/**
 * يبني mapShapes.ts من حدود حقيقية:
 *  - Natural Earth: حدود الدول وسياق الجوار (المغرب + الصحراء المغربية كوحدة واحدة).
 *  - GADM 4.1 (المستوى 1): الولايات/المقاطعات الصينية والأمريكية، وأقاليم الصحراء.
 *  - geoBoundaries ADM2 (المغرب، 2017): أقاليم وعمالات دقيقة لمراحل الاحتلال والوحدة الترابية.
 *
 * كل مجال يُدمَج هندسياً (union) فتُخفى حدوده الإدارية الداخلية ويبقى حدّه الخارجي فقط.
 * التشغيل: node tools/build-maps.mjs   (يتطلب npm install داخل tools/)
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pc = require("polygon-clipping");

const NE = "C:/tmp/geodata/countries.geojson";
const GB_MAR = "C:/tmp/geodata/gb_mar2.geojson";
const NE1 = "C:/tmp/geodata/ne50_admin1.geojson";
const GADM = {
  ESH: "C:/tmp/geodata/gadm41_ESH_1.json",
};
const OUT = "C:/tmp/marhadi-hg/app/src/mapShapes.ts";

const ne = JSON.parse(fs.readFileSync(NE, "utf8"));
const byName = new Map(ne.features.map((f) => [f.properties.ADMIN, f]));
const admin = {};
for (const [k, p] of Object.entries(GADM)) admin[k] = JSON.parse(fs.readFileSync(p, "utf8")).features;
const ne1 = JSON.parse(fs.readFileSync(NE1, "utf8")).features;

const rad = (d) => (d * Math.PI) / 180;
const my = (lat) => (Math.log(Math.tan(Math.PI / 4 + rad(Math.max(-85, Math.min(85, lat))) / 2)) * 180) / Math.PI;

/** GeoJSON geometry → polygon-clipping MultiPolygon */
function geoms(feature) {
  const g = feature?.geometry;
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates];
  if (g.type === "MultiPolygon") return g.coordinates;
  return [];
}

const ringArea = (ring) => {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
};

/** تبسيط دوكلاص-بوكر */
function simplify(points, tol) {
  if (points.length < 5) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = -1;
    let idx = -1;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

function clipRing(ring, xmin, xmax, ymin, ymax) {
  const edges = [
    [(p) => p[0] >= xmin, (a, b) => (xmin - a[0]) / (b[0] - a[0])],
    [(p) => p[0] <= xmax, (a, b) => (xmax - a[0]) / (b[0] - a[0])],
    [(p) => p[1] >= ymin, (a, b) => (ymin - a[1]) / (b[1] - a[1])],
    [(p) => p[1] <= ymax, (a, b) => (ymax - a[1]) / (b[1] - a[1])],
  ];
  let out = ring;
  for (const [inside, tAt] of edges) {
    const input = out;
    out = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      const cross = () => {
        const t = Math.max(0, Math.min(1, tAt(prev, cur)));
        return [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t];
      };
      if (curIn) {
        if (!prevIn) out.push(cross());
        out.push(cur);
      } else if (prevIn) out.push(cross());
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
  return { pt, pad, W, H, pMinX, pMaxX, pMinY, pMaxY };
}

/** يحول هندسة إلى وحدات مقصوصة داخل الإطار (إحداثيات بكسل) */
function projected(feature, frame, { minArea = 0, usOnly = false } = {}) {
  const out = [];
  const rect = [frame.pad, frame.W - frame.pad, frame.pad, frame.H - frame.pad];
  for (const poly of geoms(feature)) {
    const outer = poly[0];
    if (!outer || outer.length < 4) continue;
    if (Math.abs(ringArea(outer)) < minArea) continue;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of outer) {
      cx += x;
      cy += y;
    }
    cx /= outer.length;
    cy /= outer.length;
    if (usOnly && (cx < -130 || cy > 50)) continue;
    const proj = (ring) => {
      let pts = ring.map(([lon, lat]) => frame.pt(lon, lat));
      pts = clipRing(pts, rect[0], rect[1], rect[2], rect[3]);
      if (pts.length > 2) {
        const a = pts[0];
        const b = pts[pts.length - 1];
        if (Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01) pts.pop();
      }
      return pts;
    };
    const o = proj(outer);
    if (o.length < 3) continue;
    const holes = [];
    for (let i = 1; i < poly.length; i++) {
      const h = proj(poly[i]);
      if (h.length >= 3) holes.push(h);
    }
    out.push([o, ...holes]);
  }
  return out;
}

const n1 = (v) => Math.round(v * 10) / 10;

/** MultiPolygon (بكسل) → مسار SVG (الحدود الخارجية، مع الثقوب بقاعدة evenodd) */
function toPath(mp, { tol = 1.4 } = {}) {
  const parts = [];
  for (const poly of mp) {
    const rings = [];
    for (const ring of poly) {
      let pts = ring;
      if (pts.length > 3) {
        const a = pts[0];
        const b = pts[pts.length - 1];
        if (Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9) pts = pts.slice(0, -1);
      }
      if (pts.length < 4) continue;
      if (Math.abs(ringArea(pts)) < 0.4) continue;
      pts = simplify(pts, tol);
      if (pts.length < 3) continue;
      rings.push("M" + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z");
    }
    if (rings.length) parts.push(rings.join(""));
  }
  return parts.join("");
}

/** يرتب المجالات زمنياً ويمنع تراكبها: كل مجال يُنقص منه ما سبقه */
function partitionZones(specs) {
  const done = [];
  const out = [];
  for (const s of specs) {
    let mp = s.mp;
    if (!mp?.length) throw new Error("مجال فارغ: " + s.id);
    if (done.length) mp = polyDifference(mp, polyUnion(done.flat()));
    done.push(mp);
    out.push({ id: s.id, label: s.label, d: toPath(mp, { tol: 1.3 }) });
  }
  return out;
}

/** يدمج حدود وحدات إدارية (مجال) بعد إسقاطها */
function dissolve(features, frame, opts = {}) {
  const polys = [];
  for (const f of features) polys.push(...projected(f, frame, opts));
  if (!polys.length) return [];
  const merged = polyUnion(polys);
  return merged;
}

/** يُغلق الحلقات (polygon-clipping يتطلب ذلك) ويضمن صلاحية الشكل */
function closed(mp) {
  return mp.map((poly) =>
    poly
      .map((ring) => {
        if (!ring.length) return ring;
        const a = ring[0];
        const b = ring[ring.length - 1];
        return a[0] === b[0] && a[1] === b[1] ? ring : [...ring, a];
      })
      .filter((r) => r.length >= 4),
  );
}

function polyUnion(polys) {
  try {
    return pc.union(...closed(polys).map((p) => [p]));
  } catch (e) {
    console.warn("union fallback:", e.message);
    return polys;
  }
}

function polyIntersect(a, b) {
  if (!a?.length || !b?.length) return [];
  try {
    return pc.intersection(closed(a), closed(b));
  } catch (e) {
    console.warn("intersection fallback:", e.message);
    return a;
  }
}

function polyDifference(a, b) {
  if (!a?.length) return [];
  if (!b?.length) return a;
  try {
    return pc.difference(closed(a), closed(b));
  } catch (e) {
    console.warn("difference fallback:", e.message);
    return a;
  }
}

const intersects = (f, bbox) => {
  const b = f.bbox;
  if (!b) return false;
  return !(b[2] < bbox[0] || b[0] > bbox[2] || b[3] < bbox[1] || b[1] > bbox[3]);
};

/** أسماء geoBoundaries تُنظّف من العربية والفرنسية والإضافات */
const fold = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(Province|Prefecture)\s+(de\s+|d'|of\s+)?/i, "")
    .replace(/\s+(Province|Prefecture)$/i, "")
    .replace(/[\s-]+$/, "")
    .trim();

const marFeatures = new Map();
for (const f of JSON.parse(fs.readFileSync(GB_MAR, "utf8")).features) {
  if (f.properties.shapeName.includes("Oued Ed-Dahab")) continue; // هندسة مصدرها تالفة؛ نعتمد Natural Earth
  marFeatures.set(fold(f.properties.shapeName), f);
}

const marUnits = (list) =>
  list.map((u) => {
    const f = marFeatures.get(u);
    if (!f) throw new Error("وحدة مغربية غير موجودة: " + u);
    return f;
  });

const esh = (name) => {
  const f = admin.ESH.find((x) => x.properties.NAME_1 === name);
  if (!f) throw new Error("إقليم صحراوي غير موجود: " + name);
  return f;
};

const BASES = {
  us: { bbox: [-126, 23, -66, 50], outline: ["United States of America"], usOnly: true, skip: ["United States of America"] },
  china: { bbox: [72, 17, 136, 55], outline: ["China"], skip: ["China"] },
  europe: { bbox: [-12, 34, 32, 62], outline: [], skip: [] },
  morocco: {
    bbox: [-17.7, 20.3, -0.6, 36.3],
    outline: ["Morocco", "Western Sahara"],
    skip: ["Morocco", "Western Sahara"],
  },
};

const frameOf = {};
const outBases = {};
for (const [key, base] of Object.entries(BASES)) {
  const frame = makeFrame(base.bbox);
  frameOf[key] = frame;
  let outlinePolys = [];
  for (const nm of base.outline) {
    const f = byName.get(nm);
    if (!f) throw new Error("دولة غير موجودة: " + nm);
    outlinePolys.push(...projected(f, frame, { tol: 1.2 }));
  }
  if (key === "morocco") {
    // المغرب كاملاً: أقاليم geoBoundaries الدقيقة + الصحراء المغربية من Natural Earth
    for (const f of marFeatures.values()) outlinePolys.push(...projected(f, frame, { minArea: 0.0005 }));
    for (const f of admin.ESH) outlinePolys.push(...projected(f, frame, { minArea: 0.0005 }));
    outlinePolys.push(...projected(byName.get("Western Sahara"), frame, { tol: 1.2 }));
    outlinePolys = polyUnion(outlinePolys);
  }
  const zonesCountries = new Set(ZONES_EU());
  const context = [];
  for (const f of ne.features) {
    const nm = f.properties.ADMIN;
    if (base.skip.includes(nm) || zonesCountries.has(nm)) continue;
    if (!intersects(f, base.bbox)) continue;
    const d = toPath(projected(f, frame, { tol: 2.2 }), { tol: 2.2 });
    if (d) context.push(d);
  }
  outBases[key] = {
    viewBox: `0 0 ${Math.round(frame.W)} ${Math.round(frame.H)}`,
    outline: toPath(outlinePolys, { tol: 1.1 }),
    context,
  };
}

// دول موجة التوسع الأوروبي تُستبعد من سياق الجوار (تُرسم كمجالات)
function ZONES_EU() {
  return [
    "France",
    "United Kingdom",
    "Greece",
    "Spain",
    "Sweden",
    "Poland",
    "Romania",
    "Croatia",
  ];
}

const MOROCCO_OCCUPATION = [
  {
    id: "s1907",
    label: "المناطق الشرقية والدار البيضاء (1907–1911)",
    units: ["Oujda-Angad", "Berkane", "Taourirt", "Jerada", "Figuig", "Casablanca", "Mohammedia", "Nouaceur", "Mediouna", "Berrechid"],
  },
  {
    id: "s1912",
    label: "السهول الأطلسية والمدن الكبرى (1912)",
    units: [
      "Rabat", "Sale", "Skhirate-Temara", "Kenitra", "Sidi Kacem", "Sidi Slimane", "Khemisset",
      "Fes", "Moulay Yacoub", "Sefrou", "Meknes", "El Hajeb", "Settat", "Khouribga", "Benslimane",
      "El Jadida", "Safi", "Sidi Bennour", "Youssoufia", "Marrakech", "El Kelaat Es-Sraghna",
      "Rhamna", "Essaouira", "Chichaoua",
    ],
  },
  {
    id: "s1914",
    label: "تازة والأطلس المتوسط (1914–1921)",
    units: ["Taza", "Taounate", "Guercif", "Khenifra", "Ifrane", "Boulemane", "Azilal"],
  },
  {
    id: "rif",
    label: "الريف وجبالة: حرب عبد الكريم الخطابي (1921–1926)",
    units: ["Tetouan", "Chefchaouen", "Larache", "Ouezzane", "Al Hoceima", "Nador", "Driouch", "M'diq-Fnideq", "Fahs-Anjra"],
  },
  {
    id: "s1934",
    label: "اكتمال الاحتلال: الأطلس الكبير وسوس والجنوب الشرقي (1934)",
    units: [
      "Beni Mellal", "Fquih Ben Saleh", "Midelt", "Errachidia", "Tinghir", "Ouarzazate", "Zagora",
      "Al Haouz", "Taroudant", "Tiznit", "Chtouka-Ait Baha", "Agadir Ida-Outanane",
      "Inezgane-Ait Melloul", "Tata", "Guelmim", "Tan-Tan", "Assa-Zag",
    ],
  },
];

const UNITY = [
  {
    id: "u1956",
    label: "الاستقلال: المملكة سنة 1956",
    units: [
      "Khemisset", "Rhamna", "Sidi Slimane", "Kenitra", "Taroudant", "Tata", "Errachidia", "Safi",
      "Youssoufia", "Moulay Yacoub", "Nador", "Chefchaouen", "Skhirate-Temara", "Settat",
      "Chtouka-Ait Baha", "M'diq-Fnideq", "Taza", "Ouezzane", "Fahs-Anjra", "Al Hoceima",
      "Benslimane", "Figuig", "Sidi Kacem", "Mediouna", "Oujda-Angad", "Khouribga", "Tan-Tan",
      "Tiznit", "Chichaoua", "Sidi Bennour", "Guelmim", "Agadir Ida-Outanane", "Al Haouz",
      "Inezgane-Ait Melloul", "Larache", "Nouaceur", "Ouarzazate", "Fes", "Marrakech",
      "Mohammedia", "Essaouira", "Rabat", "Azilal", "Beni Mellal", "Assa-Zag", "Boulemane",
      "Fquih Ben Saleh", "Guercif", "Jerada", "Khenifra", "El Hajeb", "El Kelaat Es-Sraghna",
      "Midelt", "Sefrou", "Taourirt", "Tinghir", "Ifrane", "Tetouan", "Zagora", "Meknes",
      "Berkane", "Driouch", "Taounate", "Sale", "Casablanca", "Berrechid", "El Jadida",
    ],
  },
  { id: "tangier", label: "طنجة: إلغاء النظام الدولي (1956)", units: ["Tangier - Assilah"] },
  { id: "tarfaya", label: "طرفاية (1958)", units: ["Tarfaya"] },
  { id: "ifni", label: "سيدي إفني (1969)", units: ["Sidi Ifni"] },
];

const zonePaths = (features, frame, opts = {}) => toPath(dissolve(features, frame, opts), { tol: 1.3 });

const moroccoFrame = frameOf.morocco;
const neMorocco = projected(byName.get("Morocco"), moroccoFrame, { tol: 1.2 });
const neSahara = projected(byName.get("Western Sahara"), moroccoFrame, { tol: 1.2 });
const moroccoFull = polyUnion([...neMorocco, ...neSahara]);

const outZones = {};

{
  const specs = MOROCCO_OCCUPATION.map((z) => ({
    id: z.id,
    label: z.label,
    mp: polyIntersect(dissolve(marUnits(z.units), moroccoFrame, { minArea: 0.0005 }), neMorocco),
  }));
  specs.push({
    id: "sahara",
    label: "الصحراء المغربية: الاحتلال الإسباني (1884–1975)",
    mp: dissolve(admin.ESH, moroccoFrame, { minArea: 0.0005 }),
  });
  outZones["morocco-occupation"] = partitionZones(specs);
}

{
  const specs = UNITY.map((z) => ({
    id: z.id,
    label: z.label,
    mp: polyIntersect(dissolve(marUnits(z.units), moroccoFrame, { minArea: 0.0005 }), neMorocco),
  }));
  specs.push({
    id: "saqia",
    label: "الساقية الحمراء (1975)",
    mp: dissolve([esh("Laayoune"), esh("Boujdour"), esh("EsSemara")], moroccoFrame, {
      minArea: 0.0005,
    }),
  });
  specs.push({
    id: "dakhla",
    label: "وادي الذهب (1979)",
    mp: dissolve([esh("OuedelDahab")], moroccoFrame, { minArea: 0.0005 }),
  });
  outZones["morocco-unity"] = partitionZones(specs);
}

const US_ZONES = {
  "us-industry": [
    { id: "old", label: "الصناعات القديمة: الشمال الشرقي والبحيرات الكبرى", units: ["Connecticut", "Maine", "Massachusetts", "NewHampshire", "RhodeIsland", "Vermont", "NewJersey", "NewYork", "Pennsylvania", "Ohio", "Indiana", "Illinois", "Michigan", "Wisconsin", "Minnesota", "Missouri", "Iowa"] },
    { id: "modern", label: "الصناعات الحديثة: حزام الشمس (الجنوب والجنوب الشرقي)", units: ["Delaware", "Maryland", "Virginia", "WestVirginia", "NorthCarolina", "SouthCarolina", "Georgia", "Florida", "Kentucky", "Tennessee", "Alabama", "Mississippi", "Arkansas", "Louisiana", "Oklahoma", "Texas"] },
    { id: "precision", label: "الصناعات الدقيقة: كاليفورنيا والساحل الغربي", units: ["California", "Oregon", "Washington"] },
  ],
  "us-agri": [
    { id: "grain", label: "زراعة الحبوب: السهول الكبرى", units: ["NorthDakota", "SouthDakota", "Nebraska", "Kansas", "Oklahoma", "Texas"] },
    { id: "pasture", label: "المراعي: الغرب الجاف والجبال", units: ["Montana", "Wyoming", "Colorado", "NewMexico", "Nevada", "Idaho", "Utah", "Arizona"] },
    { id: "mixed", label: "الزراعة المختلطة وتربية الماشية: الشمال الشرقي والبحيرات", units: ["Iowa", "Illinois", "Indiana", "Ohio", "Missouri", "Minnesota", "Wisconsin", "Michigan", "Kentucky", "Tennessee", "NewYork", "Pennsylvania"] },
    { id: "subtropical", label: "الزراعات شبه المدارية: فلوريدا وسواحل الخليج", units: ["Florida", "Louisiana", "Mississippi"] },
  ],
};

const CHINA_ZONES = {
  "china-agri": [
    { id: "grain", label: "زراعة الحبوب: السهل الشمالي والشمال الشرقي", units: ["Hebei", "Henan", "Shandong", "Shanxi", "Shaanxi", "Anhui", "Jiangsu", "Liaoning", "Jilin", "Heilongjiang"] },
    { id: "tropical", label: "الزراعات المدارية: الجنوب الصيني", units: ["Guangdong", "Guangxi", "Hainan", "Fujian", "Yunnan"] },
    { id: "livestock", label: "تربية المواشي: الشمال والغرب (منغوليا الداخلية والهضاب)", units: ["NeiMongol", "XinjiangUygur", "Xizang", "Qinghai", "Gansu", "NingxiaHui"] },
  ],
  "china-industry": [
    { id: "high", label: "تركز صناعي هام: السواحل الشرقية", units: ["Beijing", "Tianjin", "Shanghai", "Jiangsu", "Zhejiang", "Fujian", "Guangdong", "Shandong", "Hebei"] },
    { id: "medium", label: "تركز صناعي متوسط: الوسط والشمال الشرقي", units: ["Liaoning", "Jilin", "Heilongjiang", "Henan", "Hubei", "Hunan", "Anhui", "Jiangxi", "Shanxi", "Shaanxi", "Chongqing", "Sichuan"] },
    { id: "weak", label: "تركز صناعي ضعيف: الغرب الداخلي والهضاب", units: ["XinjiangUygur", "Xizang", "Qinghai", "Gansu", "NingxiaHui", "Guizhou", "Yunnan", "NeiMongol"] },
  ],
};

const EU_ZONES = [
  { id: "france", label: "فرنسا", country: "France" },
  { id: "uk", label: "المملكة المتحدة", country: "United Kingdom" },
  { id: "greece", label: "اليونان", country: "Greece" },
  { id: "spain", label: "إسبانيا", country: "Spain" },
  { id: "sweden", label: "السويد", country: "Sweden" },
  { id: "poland", label: "بولونيا", country: "Poland" },
  { id: "romania", label: "رومانيا", country: "Romania" },
  { id: "croatia", label: "كرواتيا", country: "Croatia" },
];

/** أسماء GADM/USGS مختصرة تختلف عن Natural Earth */
const NE1_ALIAS = {
  NeiMongol: "Inner Mongol",
  NingxiaHui: "Ningxia",
  XinjiangUygur: "Xinjiang",
};
const key1 = (s) => s.replace(/[^a-z]/gi, "").toLowerCase();

const ne1Units = (country, list) => {
  const pool = ne1.filter((f) => f.properties.admin === country);
  const byKey = new Map(pool.map((f) => [key1(f.properties.name), f]));
  return list.map((u) => {
    const f = byKey.get(key1(NE1_ALIAS[u] ?? u));
    if (!f) throw new Error(`وحدة غير موجودة (${country}): ${u}`);
    return f;
  });
};

for (const [mapId, zones] of Object.entries({ ...US_ZONES, ...CHINA_ZONES })) {
  const baseKey = mapId.startsWith("us-") ? "us" : "china";
  const frame = frameOf[baseKey];
  const country = baseKey === "us" ? "United States of America" : "China";
  outZones[mapId] = zones.map((z) => ({
    id: z.id,
    label: z.label,
    d: zonePaths(ne1Units(country, z.units), frame, { minArea: 0.0005, usOnly: baseKey === "us" }),
  }));
}

outZones["eu-expansion"] = EU_ZONES.map((z) => {
  const f = byName.get(z.country);
  if (!f) throw new Error("دولة غير موجودة: " + z.country);
  return { id: z.id, label: z.label, d: toPath(projected(f, frameOf.europe, { tol: 1.4 }), { tol: 1.2 }) };
});

for (const b of Object.values(outBases)) delete b.frame;

const header = `/* مولَّد آلياً من Natural Earth + GADM 4.1 + geoBoundaries عبر tools/build-maps.mjs — لا تحرّره يدوياً. */\n\nexport interface GeoBase {\n  viewBox: string;\n  outline: string;\n  context: string[];\n}\n\nexport interface GeoZone {\n  id: string;\n  label: string;\n  d: string;\n}\n\nexport const GEO_BASES: Record<string, GeoBase> = `;

fs.writeFileSync(
  OUT,
  header +
    JSON.stringify(outBases) +
    ";\n\nexport const GEO_ZONES: Record<string, GeoZone[]> = " +
    JSON.stringify(outZones) +
    ";\n",
);
console.log("written", OUT, (fs.statSync(OUT).size / 1024).toFixed(1) + "kB");
for (const [k, v] of Object.entries(outBases)) console.log("base", k, v.viewBox, "context", v.context.length, "outline", v.outline.length);
for (const [k, v] of Object.entries(outZones))
  console.log("zones", k, v.length, v.map((z) => z.d.length).join("/"), v.some((z) => !z.d) ? "!! EMPTY !!" : "");
