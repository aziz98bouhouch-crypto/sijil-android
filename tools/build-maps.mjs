/**
 * يبني mapShapes.ts من حدود حقيقية:
 *  - Natural Earth: حدود الدول وسياق الجوار.
 *  - GADM 4.1 (المستوى 1): الولايات/المقاطعات/الجهات التي تُجمَّع في مجالات التوطين.
 * التشغيل: node tools/build-maps.mjs
 */
import fs from "node:fs";

const NE = "C:/tmp/geodata/countries.geojson";
const GADM = {
  USA: "C:/tmp/geodata/gadm41_USA_1.json",
  CHN: "C:/tmp/geodata/gadm41_CHN_1.json",
  MAR: "C:/tmp/geodata/gadm41_MAR_1.json",
};
const OUT = "C:/tmp/marhadi-hg/app/src/mapShapes.ts";

const ne = JSON.parse(fs.readFileSync(NE, "utf8"));
const byName = new Map(ne.features.map((f) => [f.properties.ADMIN, f]));
const admin = {};
for (const [k, p] of Object.entries(GADM)) admin[k] = JSON.parse(fs.readFileSync(p, "utf8")).features;

const rad = (d) => (d * Math.PI) / 180;
const my = (lat) => (Math.log(Math.tan(Math.PI / 4 + rad(Math.max(-85, Math.min(85, lat))) / 2)) * 180) / Math.PI;

function polygons(feature) {
  const g = feature.geometry;
  if (!g) return [];
  return g.type === "Polygon" ? [g.coordinates] : g.coordinates;
}

/** حلقات خارجية فقط، مع استبعاد الجزر الصغيرة */
function rings(feature, opts = {}) {
  const out = [];
  for (const poly of polygons(feature)) {
    const ring = poly[0];
    if (!ring || ring.length < 4) continue;
    let lon = 0;
    let lat = 0;
    for (const [x, y] of ring) {
      lon += x;
      lat += y;
    }
    lon /= ring.length;
    lat /= ring.length;
    if (opts.usOnly && (lon < -130 || lat > 50)) continue;
    if (Math.abs(ringArea(ring)) < (opts.minArea ?? 0)) continue;
    out.push(ring);
  }
  return out;
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}

/** تبسيط دوكلاص-بوكر على نقاط مُسقطة (بالبكسل) */
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

const n1 = (v) => Math.round(v * 10) / 10;

function toPath(ringList, frame, { clipped = false, tol = 0.9 } = {}) {
  const parts = [];
  for (const ring of ringList) {
    let pts = ring.map(([lon, lat]) => frame.pt(lon, lat));
    if (clipped) {
      const yMax = frame.pad + (frame.H - frame.pad * 2);
      pts = clipRing(pts, frame.pad, frame.W - frame.pad, frame.pad, yMax);
    }
    if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) {
      pts = pts.slice(0, -1);
    }
    if (pts.length < 4) continue;
    pts = simplify(pts, tol);
    if (pts.length < 3) continue;
    parts.push("M" + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L") + "Z");
  }
  return parts.join("");
}

const intersects = (f, bbox) => {
  const b = f.bbox;
  if (!b) return false;
  return !(b[2] < bbox[0] || b[0] > bbox[2] || b[3] < bbox[1] || b[1] > bbox[3]);
};

const BASES = {
  us: { bbox: [-126, 23, -66, 50], outline: ["United States of America"], usOnly: true },
  china: { bbox: [72, 17, 136, 55], outline: ["China"] },
  europe: { bbox: [-12, 34, 32, 62], outline: [] },
  morocco: { bbox: [-18, 20, -0.5, 36.5], outline: ["Morocco", "Western Sahara"] },
};

const ZONES = {
  "us-industry": [
    {
      id: "old",
      label: "الصناعات القديمة: الشمال الشرقي والبحيرات الكبرى",
      units: ["Connecticut", "Maine", "Massachusetts", "NewHampshire", "RhodeIsland", "Vermont", "NewJersey", "NewYork", "Pennsylvania", "Ohio", "Indiana", "Illinois", "Michigan", "Wisconsin", "Minnesota", "Missouri", "Iowa"],
    },
    {
      id: "modern",
      label: "الصناعات الحديثة: حزام الشمس (الجنوب والجنوب الشرقي)",
      units: ["Delaware", "Maryland", "Virginia", "WestVirginia", "NorthCarolina", "SouthCarolina", "Georgia", "Florida", "Kentucky", "Tennessee", "Alabama", "Mississippi", "Arkansas", "Louisiana", "Oklahoma", "Texas"],
    },
    {
      id: "precision",
      label: "الصناعات الدقيقة: كاليفورنيا والساحل الغربي",
      units: ["California", "Oregon", "Washington"],
    },
  ],
  "us-agri": [
    {
      id: "grain",
      label: "زراعة الحبوب: السهول الكبرى",
      units: ["NorthDakota", "SouthDakota", "Nebraska", "Kansas", "Oklahoma", "Texas"],
    },
    {
      id: "pasture",
      label: "المراعي: الغرب الجاف والجبال",
      units: ["Montana", "Wyoming", "Colorado", "NewMexico", "Nevada", "Idaho", "Utah", "Arizona"],
    },
    {
      id: "mixed",
      label: "الزراعة المختلطة وتربية الماشية: الشمال الشرقي والبحيرات",
      units: ["Iowa", "Illinois", "Indiana", "Ohio", "Missouri", "Minnesota", "Wisconsin", "Michigan", "Kentucky", "Tennessee", "NewYork", "Pennsylvania"],
    },
    {
      id: "subtropical",
      label: "الزراعات شبه المدارية: فلوريدا وسواحل الخليج",
      units: ["Florida", "Louisiana", "Mississippi"],
    },
  ],
  "china-agri": [
    {
      id: "grain",
      label: "زراعة الحبوب: السهل الشمالي والشمال الشرقي",
      units: ["Hebei", "Henan", "Shandong", "Shanxi", "Shaanxi", "Anhui", "Jiangsu", "Liaoning", "Jilin", "Heilongjiang"],
    },
    {
      id: "tropical",
      label: "الزراعات المدارية: الجنوب الصيني",
      units: ["Guangdong", "Guangxi", "Hainan", "Fujian", "Yunnan"],
    },
    {
      id: "livestock",
      label: "تربية المواشي: الشمال والغرب (منغوليا الداخلية والهضاب)",
      units: ["NeiMongol", "XinjiangUygur", "Xizang", "Qinghai", "Gansu", "NingxiaHui"],
    },
  ],
  "china-industry": [
    {
      id: "high",
      label: "تركز صناعي هام: السواحل الشرقية",
      units: ["Beijing", "Tianjin", "Shanghai", "Jiangsu", "Zhejiang", "Fujian", "Guangdong", "Shandong", "Hebei"],
    },
    {
      id: "medium",
      label: "تركز صناعي متوسط: الوسط والشمال الشرقي",
      units: ["Liaoning", "Jilin", "Heilongjiang", "Henan", "Hubei", "Hunan", "Anhui", "Jiangxi", "Shanxi", "Shaanxi", "Chongqing", "Sichuan"],
    },
    {
      id: "weak",
      label: "تركز صناعي ضعيف: الغرب الداخلي والهضاب",
      units: ["XinjiangUygur", "Xizang", "Qinghai", "Gansu", "NingxiaHui", "Guizhou", "Yunnan", "NeiMongol"],
    },
  ],
  "eu-expansion": [
    { id: "france", label: "فرنسا", country: "France" },
    { id: "uk", label: "المملكة المتحدة", country: "United Kingdom" },
    { id: "greece", label: "اليونان", country: "Greece" },
    { id: "spain", label: "إسبانيا", country: "Spain" },
    { id: "sweden", label: "السويد", country: "Sweden" },
    { id: "poland", label: "بولونيا", country: "Poland" },
    { id: "romania", label: "رومانيا", country: "Romania" },
    { id: "croatia", label: "كرواتيا", country: "Croatia" },
  ],
  "morocco-occupation": [
    {
      id: "s1912",
      label: "السهول الأطلسية: الدار البيضاء، الرباط، مراكش، تادلة (1912)",
      units: ["GrandCasablanca", "Chaouia-Ouardigha", "Doukkala-Abda", "Rabat-Salé-Zemmour-Zaer", "Gharb-Chrarda-BéniHssen", "Tadla-Azilal", "Marrakech-Tensift-AlHaouz"],
    },
    { id: "s1914", label: "الشرق وتازة: وجدة 1907 وتازة 1914", units: ["Fès-Boulemane", "Taza-AlHoceima-Taounate", "Oriental"] },
    { id: "rif", label: "الريف: حرب عبد الكريم الخطابي (1921–1926)", units: ["Tanger-Tétouan"] },
    {
      id: "s1934",
      label: "الأطلس والجنوب الشرقي: اكتمال الاحتلال (1934)",
      units: ["Meknès-Tafilalet", "Souss-Massa-Draâ", "Guelmim-Es-Semara"],
    },
    { id: "sahara", label: "الصحراء المغربية تحت الاحتلال الإسباني (1884–1975)", country: "Western Sahara" },
  ],
};

const outBases = {};
for (const [key, base] of Object.entries(BASES)) {
  const frame = makeFrame(base.bbox);
  let outline = "";
  for (const nm of base.outline) {
    const f = byName.get(nm);
    if (!f) throw new Error("دولة غير موجودة: " + nm);
    outline += toPath(rings(f, base), frame, { tol: 1.1 });
  }
  const zonesCountries = new Set((ZONES["eu-expansion"] ?? []).map((z) => z.country).filter(Boolean));
  const context = [];
  for (const f of ne.features) {
    const nm = f.properties.ADMIN;
    if (base.outline.includes(nm) || zonesCountries.has(nm)) continue;
    if (!intersects(f, base.bbox)) continue;
    const d = toPath(rings(f), frame, { clipped: true, tol: 2.4 });
    if (d) context.push(d);
  }
  outBases[key] = { viewBox: `0 0 ${Math.round(frame.W)} ${Math.round(frame.H)}`, outline, context, frame };
}

const outZones = {};
for (const [mapId, zones] of Object.entries(ZONES)) {
  const baseKey = mapId.startsWith("us-") ? "us" : mapId.startsWith("china-") ? "china" : mapId.startsWith("morocco-") ? "morocco" : "europe";
  const { frame } = outBases[baseKey];
  outZones[mapId] = zones.map((z) => {
    let d = "";
    if (z.country) {
      const f = byName.get(z.country);
      if (!f) throw new Error("دولة غير موجودة: " + z.country);
      d = toPath(rings(f, { minArea: 0.04 }), frame, { clipped: true, tol: 2.4 });
    } else {
      const feats = admin[GADM_KEY(baseKey)].filter((f) => z.units.includes(f.properties.NAME_1));
      const found = new Set(feats.map((f) => f.properties.NAME_1));
      for (const u of z.units) if (!found.has(u)) throw new Error(`وحدة غير موجودة (${mapId}): ${u}`);
      d = feats.map((f) => toPath(rings(f, { minArea: 0.04 }), frame, { clipped: true, tol: 2.4 })).join("");
    }
    return { id: z.id, label: z.label, d };
  });
}

function GADM_KEY(baseKey) {
  return baseKey === "us" ? "USA" : baseKey === "china" ? "CHN" : "MAR";
}

for (const b of Object.values(outBases)) delete b.frame;

const header = `/* مولَّد آلياً من Natural Earth + GADM 4.1 عبر tools/build-maps.mjs — لا تحرّره يدوياً. */\n\nexport interface GeoBase {\n  viewBox: string;\n  outline: string;\n  context: string[];\n}\n\nexport interface GeoZone {\n  id: string;\n  label: string;\n  d: string;\n}\n\nexport const GEO_BASES: Record<string, GeoBase> = `;

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
for (const [k, v] of Object.entries(outZones)) console.log("zones", k, v.length, v.map((z) => z.d.length).join("/"));
