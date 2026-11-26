/**
 * يبني ملف mapShapes.ts من بيانات Natural Earth (حدود الدول الحقيقية).
 * التشغيل: node tools/build-maps.mjs
 * المصدر: ne_110m_admin_0_countries.geojson
 */
import fs from "node:fs";

const SRC = "C:/tmp/geodata/countries.geojson";
const OUT = "C:/tmp/marhadi-hg/app/src/mapShapes.ts";

const gj = JSON.parse(fs.readFileSync(SRC, "utf8"));
const byName = new Map(gj.features.map((f) => [f.properties.ADMIN, f]));

const rad = (d) => (d * Math.PI) / 180;
/** إسقاط مركاتور: x خط الطول، y محوّل ليسهل قياس المسافات */
const my = (lat) => (Math.log(Math.tan(Math.PI / 4 + rad(Math.max(-85, Math.min(85, lat))) / 2)) * 180) / Math.PI;

function polygons(feature) {
  const g = feature.geometry;
  if (!g) return [];
  return g.type === "Polygon" ? [g.coordinates] : g.coordinates;
}

/** الحلقات الخارجية فقط (بلا جزر صغيرة جداً لتخفيف الحجم) */
function rings(feature, opts = {}) {
  const out = [];
  for (const poly of polygons(feature)) {
    const ring = poly[0];
    if (!ring || ring.length < 5) continue;
    let lon = 0;
    let lat = 0;
    for (const [x, y] of ring) {
      lon += x;
      lat += y;
    }
    lon /= ring.length;
    lat /= ring.length;
    if (opts.usOnly && (lon < -130 || lat > 50)) continue;
    if (opts.minArea && Math.abs(ringArea(ring)) < opts.minArea) continue;
    out.push(ring);
  }
  return out;
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}

/** قصّ حلقة على مستطيل (Sutherland–Hodgman) في فضاء الإسقاط */
function clipRing(ring, xmin, xmax, ymin, ymax) {
  const edges = [
    (p) => p[0] >= xmin,
    (p) => p[0] <= xmax,
    (p) => p[1] >= ymin,
    (p) => p[1] <= ymax,
  ];
  const inter = (a, b, keep) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    let t = 0;
    const edgeIndex = edges.indexOf(keep);
    if (edgeIndex === 0) t = (xmin - a[0]) / dx;
    if (edgeIndex === 1) t = (xmax - a[0]) / dx;
    if (edgeIndex === 2) t = (ymin - a[1]) / dy;
    if (edgeIndex === 3) t = (ymax - a[1]) / dy;
    return [a[0] + dx * t, a[1] + dy * t];
  };
  let out = ring;
  for (const keep of edges) {
    const input = out;
    out = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const curIn = keep(cur);
      const prevIn = keep(prev);
      if (curIn) {
        if (!prevIn) out.push(inter(prev, cur, keep));
        out.push(cur);
      } else if (prevIn) {
        out.push(inter(prev, cur, keep));
      }
    }
  }
  return out;
}

function makeFrame(bbox) {
  const [w, s, e, n] = bbox;
  const pMinX = w;
  const pMaxX = e;
  const pMinY = my(s);
  const pMaxY = my(n);
  const pad = 14;
  const W = 1000;
  const k = (W - pad * 2) / (pMaxX - pMinX);
  const H = (pMaxY - pMinY) * k + pad * 2;
  const pt = (lon, lat) => [pad + (lon - pMinX) * k, pad + (pMaxY - my(lat)) * k];
  return { pt, pad, W, H, pMinX, pMaxX, pMinY, pMaxY, k, bbox };
}

const n1 = (v) => Math.round(v * 10) / 10;

function pathFromRings(ringList, frame, clipped) {
  const parts = [];
  for (const ring of ringList) {
    let r = [];
    for (const [lon, lat] of ring) r.push(frame.pt(lon, lat));
    if (clipped) {
      r = clipRing(r, frame.pad, frame.W - frame.pad, frame.pad, frame.pad + (frame.H - frame.pad * 2));
    }
    if (r.length < 3) continue;
    parts.push("M" + r.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z");
  }
  return parts.join("");
}

function rectPath([lon1, lat1, lon2, lat2], frame) {
  const a = frame.pt(lon1, lat1);
  const b = frame.pt(lon2, lat2);
  const x1 = n1(Math.min(a[0], b[0]));
  const x2 = n1(Math.max(a[0], b[0]));
  const y1 = n1(Math.min(a[1], b[1]));
  const y2 = n1(Math.max(a[1], b[1]));
  return `M${x1} ${y1}L${x2} ${y1}L${x2} ${y2}L${x1} ${y2}Z`;
}

const intersects = (f, bbox) => {
  const b = f.bbox;
  if (!b) return false;
  return !(b[2] < bbox[0] || b[0] > bbox[2] || b[3] < bbox[1] || b[1] > bbox[3]);
};

const BASES = {
  us: {
    bbox: [-126, 23, -66, 50],
    outline: ["United States of America"],
    usOnly: true,
  },
  china: {
    bbox: [72, 17, 136, 55],
    outline: ["China"],
  },
  europe: {
    bbox: [-12, 34, 32, 62],
    outline: [],
  },
  morocco: {
    bbox: [-18, 20, -0.5, 36.5],
    outline: ["Morocco", "Western Sahara"],
  },
};

const MAPS = {
  "us-industry": {
    base: "us",
    zones: [
      { id: "old", label: "الصناعات القديمة: الشمال الشرقي والبحيرات الكبرى", rect: [-90, 38, -70, 48] },
      { id: "modern", label: "الصناعات الحديثة: حزام الشمس (الجنوب والجنوب الشرقي)", rect: [-100, 25, -75, 38] },
      { id: "precision", label: "الصناعات الدقيقة: الساحل الغربي (كاليفورنيا)", rect: [-125, 32, -114, 42] },
    ],
  },
  "us-agri": {
    base: "us",
    zones: [
      { id: "grain", label: "زراعة الحبوب: السهول الكبرى", rect: [-104, 35, -96, 49] },
      { id: "pasture", label: "المراعي: الغرب الجاف والأقاليم الجبلية", rect: [-118, 35, -104, 45] },
      { id: "mixed", label: "الزراعة المختلطة وتربية الماشية: الشمال الشرقي", rect: [-96, 38, -80, 48] },
      { id: "subtropical", label: "الزراعات شبه المدارية: فلوريدا والخليج", rect: [-85, 25, -80, 31] },
    ],
  },
  "china-agri": {
    base: "china",
    zones: [
      { id: "grain", label: "زراعة الحبوب: السهل الشمالي والشرقي", rect: [110, 32, 130, 46] },
      { id: "tropical", label: "الزراعات المدارية: الجنوب الصيني", rect: [104, 18, 120, 25] },
      { id: "livestock", label: "تربية المواشي: الشمال والغرب (منغوليا الداخلية والهضاب)", rect: [75, 35, 109, 48] },
    ],
  },
  "china-industry": {
    base: "china",
    zones: [
      { id: "high", label: "تركز صناعي هام: السواحل الشرقية (بكين، اليانغتسي، اللؤلؤ)", rect: [112, 22, 122, 40] },
      { id: "medium", label: "تركز صناعي متوسط: الوسط والشمال الشرقي", rect: [104, 28, 112, 40, 120, 40, 132, 48] },
      { id: "weak", label: "تركز صناعي ضعيف: الغرب الداخلي والهضاب", rect: [75, 28, 104, 48] },
    ],
  },
  eu: {
    base: "europe",
    countries: [
      { id: "france", label: "فرنسا", name: "France" },
      { id: "uk", label: "المملكة المتحدة", name: "United Kingdom" },
      { id: "greece", label: "اليونان", name: "Greece" },
      { id: "spain", label: "إسبانيا", name: "Spain" },
      { id: "sweden", label: "السويد", name: "Sweden" },
      { id: "poland", label: "بولونيا", name: "Poland" },
      { id: "romania", label: "رومانيا", name: "Romania" },
      { id: "croatia", label: "كرواتيا", name: "Croatia" },
    ],
  },
  "morocco-occupation": {
    base: "morocco",
    zones: [
      { id: "s1912", label: "السهول الأطلسية: فاس، الرباط، الدار البيضاء، مراكش (1912)", rect: [-9.6, 31, -5.4, 35.2] },
      { id: "s1914", label: "الشمال الشرقي وتازة (1914)", rect: [-5.4, 32, -2, 34.6] },
      { id: "rif", label: "الريف: حرب عبد الكريم الخطابي (1921–1926)", rect: [-5.6, 34.6, -2, 36.2] },
      { id: "s1934", label: "الأطلس الصغير والجنوب الشرقي: اكتمال الاحتلال (1934)", rect: [-11, 27.6, -3.6, 31] },
      { id: "sahara", label: "الصحراء المغربية تحت الاحتلال الإسباني (1884–1975)", rect: [-17, 20.5, -8.5, 27.6] },
    ],
  },
  "morocco-sahara": {
    base: "morocco",
    zones: [
      { id: "tarfaya", label: "منطقة طرفاية (1912–1958)", rect: [-13.4, 27.6, -8.5, 29.6] },
      { id: "saqia", label: "الساقية الحمراء (1884)", rect: [-15.2, 24.4, -8.5, 27.6] },
      { id: "oued", label: "وادي الذهب (1884)", rect: [-17.2, 20.4, -8.5, 24.4] },
    ],
  },
};

const out = {};
for (const [id, cfg] of Object.entries(MAPS)) {
  const base = BASES[cfg.base];
  const frame = makeFrame(base.bbox);
  const outlineNames = base.outline;

  // شكل الدولة/الدول موضع السؤال
  let outline = "";
  if (outlineNames.length) {
    for (const nm of outlineNames) {
      const f = byName.get(nm);
      if (!f) throw new Error("دولة غير موجودة: " + nm);
      outline += pathFromRings(rings(f, base), frame, false);
    }
  }

  // دول السياق (رمادية) مقصوصة على الإطار
  const zoneNames = new Set((cfg.countries ?? []).map((c) => c.name));
  const context = [];
  for (const f of gj.features) {
    const nm = f.properties.ADMIN;
    if (outlineNames.includes(nm) || zoneNames.has(nm)) continue;
    if (!intersects(f, base.bbox)) continue;
    const d = pathFromRings(rings(f), frame, true);
    if (d) context.push(d);
  }

  const zones = [];
  for (const z of cfg.countries ?? []) {
    const f = byName.get(z.name);
    if (!f) throw new Error("دولة غير موجودة: " + z.name);
    zones.push({ id: z.id, label: z.label, d: pathFromRings(rings(f), frame, true) });
  }
  for (const z of cfg.zones ?? []) {
    const rects = z.rect.length === 8 ? [z.rect.slice(0, 4), z.rect.slice(4, 8)] : [z.rect];
    const d = rects.map((r) => rectPath(r, frame)).join("");
    zones.push({ id: z.id, label: z.label, d });
  }

  out[id] = {
    viewBox: `0 0 ${Math.round(frame.W)} ${Math.round(frame.H)}`,
    outline,
    context,
    zones,
  };
}

const header = `/* مولَّد آلياً من Natural Earth (ne_110m_admin_0_countries) عبر tools/build-maps.mjs — لا تحرّره يدوياً. */\n\nexport interface GeoZone {\n  id: string;\n  label: string;\n  d: string;\n}\n\nexport interface GeoMap {\n  viewBox: string;\n  outline: string;\n  context: string[];\n  zones: GeoZone[];\n}\n\nexport const GEO: Record<string, GeoMap> = `;

fs.writeFileSync(OUT, header + JSON.stringify(out, null, 0) + ";\n");
console.log("written", OUT, (fs.statSync(OUT).size / 1024).toFixed(1) + "kB");
for (const [k, v] of Object.entries(out)) {
  console.log(k, v.viewBox, "context:", v.context.length, "zones:", v.zones.length, "outline:", v.outline.length);
}
