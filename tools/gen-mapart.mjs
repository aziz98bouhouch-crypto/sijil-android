// يولّد mapArt.ts: حدود المغرب+الصحراء pauzée + مناطق جهوية من geoBoundaries/GADM
import fs from "node:fs";

const SRC = "C:/tmp/marhadi/sijil-android-marhadi-hg/app/src";
const shapesTxt = fs.readFileSync(SRC + "/mapShapes.ts", "utf8");
const basesJson = shapesTxt.slice(
  shapesTxt.indexOf("= {") + 2,
  shapesTxt.indexOf(";\n\nexport const GEO_ZONES"),
);
const BASES = JSON.parse(basesJson.trim().replace(/;$/, ""));
const morocco = BASES.morocco;
const VIEW = morocco.viewBox; // "0 0 1000 1066"
const W = 1000, H = 1066, PAD = 14;

// نفس إسقاط build-maps.mjs (Mercator) للإطار [-17.7,20.3,-0.6,36.3]
const rad = (d) => (d * Math.PI) / 180;
const my = (lat) => (Math.log(Math.tan(Math.PI / 4 + rad(Math.max(-85, Math.min(85, lat))) / 2)) * 180) / Math.PI;
const BBOX = [-17.7, 20.3, -0.6, 36.3];
const pMinX = BBOX[0], pMaxX = BBOX[2];
const pMinY = my(BBOX[1]), pMaxY = my(BBOX[3]);
const k = (W - PAD * 2) / (pMaxX - pMinX);
const pt = (lon, lat) => [PAD + (lon - pMinX) * k, PAD + (pMaxY - my(lat)) * k];

// --- تحليل مسار SVG إلى حلقات ---
function parsePath(d) {
  const polys = [];
  let cur = null, start = null, x = 0, y = 0;
  const re = /([MLZ])([^MLZ]*)/g;
  let m;
  while ((m = re.exec(d))) {
    const cmd = m[1];
    const nums = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === "M") {
      if (cur) polys.push(cur);
      cur = [];
      for (let i = 0; i < nums.length; i += 2) {
        x = nums[i]; y = nums[i + 1];
        cur.push([x, y]);
        start = [x, y];
      }
    } else if (cmd === "L") {
      for (let i = 0; i < nums.length; i += 2) {
        x = nums[i]; y = nums[i + 1];
        cur.push([x, y]);
      }
    } else if (cmd === "Z") {
      if (cur && start) {
        const a = cur[0], b = cur[cur.length - 1];
        if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) cur.push(start.slice());
      }
      if (cur) { polys.push(cur); cur = null; }
    }
  }
  if (cur) polys.push(cur);
  return polys;
}

// دوكلاس-بوكر
function simplify(points, tol) {
  if (points.length < 5) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1; keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a], [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

const n1 = (v) => Math.round(v * 10) / 10;
/** يزيل نقطة الإغلاق المكررة حتى لا ينهار دوكلاس-بوكر على حلقة مغلقة */
const unclosed = (pts) =>
  pts.length > 2 &&
  Math.abs(pts[0][0] - pts[pts.length - 1][0]) < 1e-9 &&
  Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 1e-9
    ? pts.slice(0, -1)
    : pts;
function toPath(polys, tol) {
  return polys
    .map((ring) => {
      const pts = simplify(ring, tol);
      if (pts.length < 3) return "";
      return "M" + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z";
    })
    .filter(Boolean)
    .join("");
}

// الحدود الخارجية (بدون الثقوب — الخريطة تخطيطية)
const outlinePolys = parsePath(morocco.outline)
  .map((r) => unclosed(r))
  .map((r) => simplify(r, 2.4));
const outlineD = toPath(outlinePolys, 0.01); // أبقِ على البساطة المحسوبة
const outlineDS = "M" + outlinePolys.map((r) => r.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z").join("M");

// --- المناطق: التقسيم الجهوي الحالي (12 جهة) مجمّعة في 4 أحزمة ---
const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const ZONE_OF = [
  // شمال: طنجة-تطوان-الحسيمة، فاس-مكناس، Oriental
  [/tangier|tetouan|chefchaouen|larache|ouezzane|fnideq|fahs|hoceima|nador|driouch|berkane|taourirt|jerada|figuig|oujda|fes\b|sefrou|yacoub|hajeb|taza|taounate|guercif|boulemane|mekn|beni mellal|bni mellal|khenifra|ifrane/i, "north"],
  // وسط: الدار البيضاء-سطات، الرباط-سلا-القنيطرة، مراكش-آسفي، درعة-تافيلالت
  [/casablanca|mohamm|nouaceur|mediouna|berrechid|settat|benslimane|khouribga|rabat|sal[eé]|skhirate|kenitra|kacem|slimane|khemisset|marrakech|chichaoua|haouz|safi|youssoufia|bennour|jadida|essaouira|sraghna|azilal|fquih|errachidia|tinghir|midelt|zagora|ouarzazate|rhamna/i, "center"],
  // جنوب: سوس-ماسة، كلميم-واد نون (+ طرفاية)
  [/taroudant|tiznit|chtouka|agadir|inezgane|guelmim|tan-tan|assa|tata|ifni|tarfaya/i, "south"],
  // أقصى جنوب: إقليم وادي الذهب (أوسرد من geoBoundaries، الباقي من GADM ESH)
  [/aousserd/i, "sahara"],
];

const gb = JSON.parse(fs.readFileSync("C:/tmp/geodata/gb_mar2.geojson", "utf8"));
const esh = JSON.parse(fs.readFileSync("C:/tmp/geodata/gadm41_ESH_1.json", "utf8"));

const zonePaths = { north: [], center: [], south: [], sahara: [] };

function pushGeom(geom, zone) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
  for (const poly of polys) {
    const outer = poly[0];
    if (!outer || outer.length < 4) continue;
    const proj = unclosed(outer.map(([lo, la]) => pt(lo, la)));
    // إسقاط الثقوب أيضاً (evenodd)
    const holes = [];
    for (let i = 1; i < poly.length; i++) {
      const h = unclosed(poly[i].map(([lo, la]) => pt(lo, la)));
      if (h.length >= 4) holes.push(h);
    }
    zonePaths[zone].push([proj, ...holes]);
  }
}

let unmatched = [];
const dbg = {};
for (const f of gb.features) {
  const name = f.properties.shapeName;
  if (/Oued Ed-Dahab|Boujdour|Laayoune|Es-Semara/i.test(name)) continue; // مغطاة بـ GADM ESH
  let zone = null;
  for (const [re, z] of ZONE_OF) if (re.test(fold(name))) { zone = z; break; }
  if (!zone) { unmatched.push(name); continue; }
  const before = zonePaths[zone].length;
  pushGeom(f.geometry, zone);
  dbg[zone] = (dbg[zone] || 0) + (zonePaths[zone].length - before);
}
for (const f of esh.features) pushGeom(f.geometry, "sahara");
console.log("polys per zone:", dbg, "sahara polys:", zonePaths.sahara.length);

// مسارات بلا حدود داخلية: كل وحدات نفس المنطقة بلون واحد وبلا stroke
const zoneOut = {};
for (const [z, polys] of Object.entries(zonePaths)) {
  zoneOut[z] = polys.map(([outer, ...holes]) =>
    "M" + simplify(outer, 2.6).map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z" +
    holes.map((h) => "M" + simplify(h, 2.6).map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z").join("")
  ).join("");
}

// مدن (lon, lat, label, side)
const cities = [
  [-5.83, 35.75, "طنجة"],
  [-1.91, 34.68, "وجدة"],
  [-5.00, 34.03, "فاس"],
  [-6.84, 34.02, "الرباط"],
  [-5.55, 33.89, "مكناس"],
  [-7.59, 33.57, "الدار البيضاء"],
  [-6.20, 32.30, "القنيطرة"],
  [-8.01, 31.63, "مراكش"],
  [-9.60, 30.43, "أكادير"],
  [-7.09, 31.17, "الصويرة"],
  [-9.05, 30.43 - 0.2, "تزنيت"],
  [-6.90, 30.93, "ورزازات"],
  [-13.20, 27.13, "العيون"],
  [-15.96, 23.68, "الداخلة"],
];
const cityPts = cities.map(([lo, la, name]) => ({ ...pt(lo, la), name }));

//قمم جبلية تقريبية: الريف، الأطلس المتوسط، الأطلس الكبير، الأطلس الصغير
const peaks = [
  [-5.30, 35.20], [-4.90, 34.60], [-5.50, 33.40], [-5.00, 32.80],
  [-7.50, 31.30], [-8.20, 30.80], [-9.30, 30.20], [-7.80, 29.00],
];
const atlasPts = peaks.map(([lo, la]) => {
  const [x, y] = pt(lo, la);
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
});

const out = `/* مولَّد من geoBoundaries ADM2 + GADM 4.1 (ESH) — نفس إطار tools/build-maps.mjs، المغرب والصحراء المغربية وحدة واحدة */
export const MA_VIEW = "${VIEW}";
export const MA_OUTLINE = ${JSON.stringify(outlineDS)};
export const MA_ZONES: Record<string, string> = ${JSON.stringify(zoneOut)};
export const MA_CITIES = ${JSON.stringify(cityPts.map((c) => ({ x: Math.round(c[0] * 10) / 10, y: Math.round(c[1] * 10) / 10, name: c.name })))};
export const MA_ATLAS = ${JSON.stringify(atlasPts)};
`;
fs.writeFileSync("C:/tmp/mapArt.ts", out);
console.log("unmatched:", unmatched);
console.log("sizes:", Object.entries(zoneOut).map(([z, d]) => z + ":" + d.length).join(" "), "outline:", outlineDS.length);
