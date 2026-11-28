#!/usr/bin/env node
'use strict';
/**
 * أيقونة تطبيق الهاتف (أندرويد) — تُشتق من شعار سطح المكتب build/icon.png
 * حتى تظهر أيقونة التطبيق في شاشة الهاتف بعد التثبيت.
 *
 * ينتج:
 *   mipmap-*dpi/ic_launcher.png             (أيقونة عادية لمختلف الكثافات)
 *   mipmap-*dpi/ic_launcher_round.png       (أيقونة دائرية)
 *   mipmap-*dpi/ic_launcher_foreground.png  (طبقة الأيقونة التكيفية: الشعار فقط)
 *   mipmap-*dpi/ic_launcher_background.png  (خلفية متدرّجة تغطي المربع كله)
 *   mipmap-anydpi-v26/ic_launcher*.xml      (ربط الطبقات بنظام أندرويد 8+)
 *
 * التنفيذ خالٍ من أي تبعيات (zlib المدمج في Node فقط).
 * الاستخدام:
 *   node make-icons.js android            # يكتب داخل android/app/src/main/res
 *   node make-icons.js preview <مجلد>      # يكتب صورًا للمعاينة فقط
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ------------------------------- PNG codec ------------------------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const name = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, crc]);
}

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  let pos = 8, w = 0, h = 0, depth = 0, color = 0, interlace = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      color = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (color !== 6 && color !== 2)) {
    throw new Error('unsupported png (depth ' + depth + ', color ' + color + ', interlace ' + interlace + ')');
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = color === 6 ? 4 : 3;
  const stride = w * ch;
  const out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev[x];
      const c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      out[o] = cur[x * ch];
      out[o + 1] = cur[x * ch + 1];
      out[o + 2] = cur[x * ch + 2];
      out[o + 3] = ch === 4 ? cur[x * ch + 3] : 255;
    }
    prev = cur;
  }
  return { w, h, data: out };
}

function encodePNG(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------- resampling ------------------------------ */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

function weightsFor(srcN, dstN) {
  const res = [];
  const scale = dstN / srcN;
  if (scale < 1) {
    const inv = 1 / scale;
    for (let i = 0; i < dstN; i++) {
      const a = i * inv, b = (i + 1) * inv;
      const idx = [], wt = [];
      for (let j = Math.floor(a); j < Math.ceil(b); j++) {
        const ov = Math.min(b, j + 1) - Math.max(a, j);
        if (ov > 0) { idx.push(j); wt.push(ov / inv); }
      }
      res.push({ idx, wt });
    }
    return res;
  }
  const cr = (x) => {
    const ax = Math.abs(x);
    if (ax < 1) return 1.5 * ax * ax * ax - 2.5 * ax * ax + 1;
    if (ax < 2) return -0.5 * ax * ax * ax + 2.5 * ax * ax - 4 * ax + 2;
    return 0;
  };
  for (let i = 0; i < dstN; i++) {
    const center = (i + 0.5) / scale;
    const idx = [], wt = [];
    let sum = 0;
    for (let j = Math.floor(center) - 2; j <= Math.floor(center) + 2; j++) {
      if (j < 0 || j >= srcN) continue;
      const w0 = cr(center - (j + 0.5));
      if (!w0) continue;
      idx.push(j); wt.push(w0); sum += w0;
    }
    if (!idx.length) { idx.push(clamp(Math.floor(center), 0, srcN - 1)); wt.push(1); sum = 1; }
    for (let k = 0; k < wt.length; k++) wt[k] /= sum;
    res.push({ idx, wt });
  }
  return res;
}

function resize(src, sw, sh, dw, dh) {
  if (sw === dw && sh === dh) return Buffer.from(src);
  const p = new Float64Array(sw * sh * 4);
  for (let i = 0; i < sw * sh; i++) {
    const a = src[i * 4 + 3] / 255;
    p[i * 4] = src[i * 4] * a;
    p[i * 4 + 1] = src[i * 4 + 1] * a;
    p[i * 4 + 2] = src[i * 4 + 2] * a;
    p[i * 4 + 3] = src[i * 4 + 3];
  }
  const xw = weightsFor(sw, dw);
  const tmp = new Float64Array(dw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < dw; x++) {
      const { idx, wt } = xw[x];
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < idx.length; k++) {
        const s = (y * sw + idx[k]) * 4, q = wt[k];
        r += p[s] * q; g += p[s + 1] * q; b += p[s + 2] * q; a += p[s + 3] * q;
      }
      const o = (y * dw + x) * 4;
      tmp[o] = r; tmp[o + 1] = g; tmp[o + 2] = b; tmp[o + 3] = a;
    }
  }
  const yw = weightsFor(sh, dh);
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const { idx, wt } = yw[y];
    for (let x = 0; x < dw; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < idx.length; k++) {
        const s = (idx[k] * dw + x) * 4, q = wt[k];
        r += tmp[s] * q; g += tmp[s + 1] * q; b += tmp[s + 2] * q; a += tmp[s + 3] * q;
      }
      const o = (y * dw + x) * 4;
      if (a <= 0.5) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
        continue;
      }
      const f = 255 / a;
      out[o] = clamp(Math.round(r * f), 0, 255);
      out[o + 1] = clamp(Math.round(g * f), 0, 255);
      out[o + 2] = clamp(Math.round(b * f), 0, 255);
      out[o + 3] = clamp(Math.round(a), 0, 255);
    }
  }
  return out;
}

/* ------------------------ background model + glyph ----------------------- */

function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => row.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    const t = M[c]; M[c] = M[piv]; M[piv] = t;
    const d = M[c][c];
    if (Math.abs(d) < 1e-12) continue;
    for (let k = c; k <= n; k++) M[c][k] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (!f) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row) => row[n]);
}

/** يتعلّم تدرّج الخلفية (كثير حدود من الدرجة الثانية) من بكسلات الخلفية فقط. */
function fitBackground(img) {
  const { w, h, data } = img;
  const terms = (u, v) => [1, u, v, u * u, u * v, v * v];
  const N = 6;
  const ATA = Array.from({ length: N }, () => new Array(N).fill(0));
  const ATb = [new Array(N).fill(0), new Array(N).fill(0), new Array(N).fill(0)];
  let used = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      // خلفية الشعار زرقاء/بنفسجية: الأزرق غالب دائمًا ويسبق الأحمر بفارق واضح
      if (!(a > 200 && b > 185 && b - r > 50)) continue;
      const t = terms(x / (w - 1), y / (h - 1));
      for (let p = 0; p < N; p++) for (let q = 0; q < N; q++) ATA[p][q] += t[p] * t[q];
      for (let p = 0; p < N; p++) { ATb[0][p] += t[p] * r; ATb[1][p] += t[p] * g; ATb[2][p] += t[p] * b; }
      used++;
    }
  }
  if (!used) throw new Error('could not locate the icon background');
  const coef = ATb.map((b) => solve(ATA, b));
  // قياس جودة المطابقة
  let err = 0, n = 0;
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * 4;
      const r = data[i], b = data[i + 2], a = data[i + 3];
      if (!(a > 200 && b > 185 && b - r > 50)) continue;
      const t = terms(x / (w - 1), y / (h - 1));
      for (let c = 0; c < 3; c++) {
        let p = 0;
        for (let k = 0; k < 6; k++) p += coef[c][k] * t[k];
        const real = data[i + c];
        err += (p - real) * (p - real);
        n++;
      }
    }
  }
  return { coef, rms: Math.sqrt(err / Math.max(1, n)) };
}

function evalBg(coef, u, v) {
  const t = [1, u, v, u * u, u * v, v * v];
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let p = 0;
    for (let k = 0; k < 6; k++) p += coef[c][k] * t[k];
    out[c] = clamp(p, 0, 255);
  }
  return out;
}

/**
 * يفصل الشعار (الغطاء الأكاديمي + علامة الصح) عن التدرّج خلفه.
 * الشفافية تُحسب من «كم يبتعد البكسل عن لون الخلفية المتوقّع»،
 * فيبقى الحرف نقيًا على خلفية شفافة صالحة للأيقونة التكيفية.
 */
function extractGlyph(img, work, fit) {
  const up = resize(img.data, img.w, img.h, work, work);
  const out = Buffer.alloc(work * work * 4);
  for (let y = 0; y < work; y++) {
    const v = y / (work - 1);
    for (let x = 0; x < work; x++) {
      const i = (y * work + x) * 4;
      const a0 = up[i + 3] / 255;
      if (a0 <= 0) continue;
      const bg = evalBg(fit.coef, x / (work - 1), v);
      const r = up[i], g = up[i + 1], b = up[i + 2];
      const denom = bg[2] - bg[0];
      let a = denom > 1 ? 1 - (b - r) / denom : 0;
      a = clamp(a, 0, 1) * a0;
      if (a < 0.06) continue;
      const inv = 1 / a;
      const o = i;
      out[o] = clamp(Math.round((r - (1 - a) * bg[0]) * inv), 0, 255);
      out[o + 1] = clamp(Math.round((g - (1 - a) * bg[1]) * inv), 0, 255);
      out[o + 2] = clamp(Math.round((b - (1 - a) * bg[2]) * inv), 0, 255);
      out[o + 3] = clamp(Math.round(a * 255), 0, 255);
    }
  }
  return out;
}

/* -------------------------------- shapes -------------------------------- */

/** يضع صورة داخل لوحة مربعة شفافة بمقاس نسبة (scale)، ثم يقصّها بقناع، ثم يصغّرها. */
function composited(size, art, artW, artH, scale, mask, ss) {
  const big = size * ss;
  const inner = Math.round(big * scale);
  const small = resize(art, artW, artH, inner, inner);
  const canvas = Buffer.alloc(big * big * 4);
  const off = Math.floor((big - inner) / 2);
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const s = (y * inner + x) * 4;
      const d = ((y + off) * big + (x + off)) * 4;
      canvas[d] = small[s];
      canvas[d + 1] = small[s + 1];
      canvas[d + 2] = small[s + 2];
      canvas[d + 3] = small[s + 3];
    }
  }
  if (mask === 'circle') {
    const c = big / 2, r = big / 2;
    for (let y = 0; y < big; y++) {
      for (let x = 0; x < big; x++) {
        const dx = x + 0.5 - c, dy = y + 0.5 - c;
        if (Math.hypot(dx, dy) > r) canvas[(y * big + x) * 4 + 3] = 0;
      }
    }
  }
  return resize(canvas, big, big, size, size);
}

/** يبني الأيقونة التكيفية: خلفية متدرّجة تغطي 108dp كاملة + الشعار في المنطقة الآمنة. */
function buildAdaptive(size, glyph, glyphW, fit, safe) {
  const bg = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = evalBg(fit.coef, x / (size - 1), y / (size - 1));
      const o = (y * size + x) * 4;
      bg[o] = Math.round(c[0]);
      bg[o + 1] = Math.round(c[1]);
      bg[o + 2] = Math.round(c[2]);
      bg[o + 3] = 255;
    }
  }
  const inner = Math.round(size * safe);
  const g = resize(glyph, glyphW, glyphW, inner, inner);
  const fg = Buffer.alloc(size * size * 4);
  const off = Math.floor((size - inner) / 2);
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const s = (y * inner + x) * 4;
      const d = ((y + off) * size + (x + off)) * 4;
      fg[d] = g[s];
      fg[d + 1] = g[s + 1];
      fg[d + 2] = g[s + 2];
      fg[d + 3] = g[s + 3];
    }
  }
  return { bg, fg };
}

/* --------------------------------- build -------------------------------- */

const DENSITIES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
];

const ADAPTIVE_XML =
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
  '    <background android:drawable="@mipmap/ic_launcher_background" />\n' +
  '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n' +
  '</adaptive-icon>\n';

function main() {
  const mode = process.argv[2] || 'android';
  const artPath = path.join(__dirname, '..', 'build', 'icon.png');
  const art = decodePNG(fs.readFileSync(artPath));
  const fit = fitBackground(art);
  const WORK = 1024;
  const glyph = extractGlyph(art, WORK, fit);
  // 0.70: يضع الشعار داخل المنطقة الآمنة (66dp من 108dp) دون قصّه بأقنعة المشغّل
  const SAFE = 0.7;
  console.log('icon source ' + art.w + 'x' + art.h + ', background fit rms=' + fit.rms.toFixed(2));

  if (mode === 'preview') {
    const outDir = process.argv[3] || path.join(__dirname, 'preview');
    fs.mkdirSync(outDir, { recursive: true });
    const { bg, fg } = buildAdaptive(432, glyph, WORK, fit, SAFE);
    const adaptive = Buffer.from(bg);
    for (let i = 0; i < adaptive.length; i += 4) {
      const a = fg[i + 3] / 255;
      if (!a) continue;
      for (let c = 0; c < 3; c++) adaptive[i + c] = clamp(Math.round(fg[i + c] * a + adaptive[i + c] * (1 - a)), 0, 255);
    }
    const write = (name, buf, w, h) => fs.writeFileSync(path.join(outDir, name), encodePNG(w, h, buf));
    write('legacy-192.png', resize(art.data, art.w, art.h, 192, 192), 192, 192);
    write('legacy-48.png', resize(art.data, art.w, art.h, 48, 48), 48, 48);
    write('round-192.png', composited(192, art.data, art.w, art.h, 0.92, 'circle', 4), 192, 192);
    write('adaptive-432.png', adaptive, 432, 432);
    write('foreground-432.png', fg, 432, 432);
    write('background-432.png', bg, 432, 432);
    console.log('previews written to ' + outDir);
    return;
  }

  const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(resDir)) {
    throw new Error('android project not found: run "npx cap add android" first (' + resDir + ')');
  }
  for (const [name, dpi] of DENSITIES) {
    const dir = path.join(resDir, 'mipmap-' + name);
    fs.mkdirSync(dir, { recursive: true });
    const legacy = Math.round(48 * dpi);
    const fgSize = Math.round(108 * dpi);
    const { bg, fg } = buildAdaptive(fgSize, glyph, WORK, fit, SAFE);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), encodePNG(legacy, legacy, resize(art.data, art.w, art.h, legacy, legacy)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), encodePNG(legacy, legacy, composited(legacy, art.data, art.w, art.h, 0.92, 'circle', 4)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), encodePNG(fgSize, fgSize, fg));
    fs.writeFileSync(path.join(dir, 'ic_launcher_background.png'), encodePNG(fgSize, fgSize, bg));
    console.log('wrote mipmap-' + name + ' (' + legacy + 'px legacy, ' + fgSize + 'px adaptive layers)');
  }
  const anydpi = path.join(resDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpi, { recursive: true });
  fs.writeFileSync(path.join(anydpi, 'ic_launcher.xml'), ADAPTIVE_XML);
  fs.writeFileSync(path.join(anydpi, 'ic_launcher_round.xml'), ADAPTIVE_XML);
  const values = path.join(resDir, 'values');
  fs.mkdirSync(values, { recursive: true });
  const mid = evalBg(fit.coef, 0.5, 0.5).map((v) => Math.round(v));
  fs.writeFileSync(
    path.join(values, 'ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FF' +
      mid.map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('') +
      '</color>\n</resources>\n'
  );
  console.log('adaptive icon xml written to ' + anydpi);
}

main();
