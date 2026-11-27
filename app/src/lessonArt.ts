/** رسوم بطاقات الدروس — أسلوب موحّد: خلفية متدرجة + شعار مركزي واحد واضح */

const INK = "#22303a";
const CREAM = "#f5ead2";
const GOLD = "#e8b64c";
const RUST = "#c96f4a";

const star = (cx: number, cy: number, r: number, fill: string) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
};

/** إطار موحّد: سماء متدرجة + وهج خلف الشعار + ظل أرضي */
const frame = (id: string, sky: [string, string], inner: string, accent = "#ffffff") =>
  `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/>
  </linearGradient></defs>
  <rect width="400" height="240" fill="url(#sky-${id})"/>
  <circle cx="200" cy="112" r="86" fill="${accent}" opacity="0.10"/>
  <circle cx="52" cy="42" r="3" fill="${accent}" opacity="0.5"/>
  <circle cx="352" cy="58" r="2.4" fill="${accent}" opacity="0.45"/>
  <circle cx="330" cy="30" r="1.8" fill="${accent}" opacity="0.4"/>
  ${inner}
  <ellipse cx="200" cy="182" rx="86" ry="11" fill="#0b1c22" opacity="0.16"/>
  </svg>`;

const dots = (n: number, seed: number, color: string, r = 1.5) => {
  let s = "";
  let x = (seed * 73) % 400;
  for (let i = 0; i < n; i++) {
    x = (x * 37 + 91) % 400;
    const y = 12 + ((x * 53 + seed * 31) % 80);
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="${color}" opacity="0.55"/>`;
  }
  return s;
};

/* ============================ التاريخ ============================ */

const ww1 = () =>
  frame("ww1", ["#33253f", "#7a4a3c"], `
  <g stroke="${INK}" stroke-width="3" fill="none" opacity="0.9">
    <path d="M96 78 Q140 62 184 76 T272 74"/>
    <path d="M96 92 Q140 76 184 90 T272 88"/>
  </g>
  <g stroke="${INK}" stroke-width="2.4">
    ${[112, 148, 184, 220, 256].map((x) => `<line x1="${x}" y1="70" x2="${x}" y2="96"/>`).join("")}
  </g>
  <path d="M168 128 a34 34 0 0 1 68 0 l-8 8 h-52 Z" fill="${CREAM}"/>
  <rect x="156" y="134" width="92" height="12" rx="6" fill="${INK}"/>
  <rect x="188" y="120" width="8" height="22" rx="4" fill="${INK}"/>
  ${dots(8, 3, "#f2d8a0")}`);

const rev = () =>
  frame("rev", ["#3d1020", "#8a2c3a"], `
  <g fill="${INK}">
    <rect x="120" y="120" width="52" height="56"/>
    <rect x="186" y="96" width="60" height="80"/>
    <rect x="260" y="128" width="48" height="48"/>
    <rect x="132" y="98" width="10" height="26"/><rect x="206" y="72" width="10" height="28"/><rect x="274" y="106" width="10" height="26"/>
  </g>
  <circle cx="211" cy="86" r="9" fill="${CREAM}" opacity="0.8"/>
  <circle cx="228" cy="72" r="7" fill="${CREAM}" opacity="0.6"/>
  <rect x="160" y="44" width="4" height="80" fill="${INK}"/>
  <path d="M164 46 h76 l-11 20 h-54 Z" fill="#c22f3d"/>
  ${star(180, 56, 8, GOLD)}
  ${dots(6, 7, "#f2c14e")}`);

const crisis = () =>
  frame("crisis", ["#232b38", "#4a5666"], `
  <path d="M118 84 L168 104 L196 92 L246 128 L282 116 L336 158" fill="none" stroke="${RUST}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M330 148 l-4 14 M330 148 l14 10" stroke="${RUST}" stroke-width="6" stroke-linecap="round"/>
  <g fill="${GOLD}">
    <circle cx="120" cy="168" r="13"/><circle cx="120" cy="168" r="8" fill="#f7dfae"/>
    <circle cx="288" cy="180" r="10"/><circle cx="288" cy="180" r="6" fill="#f7dfae"/>
  </g>
  <path d="M0 200 Q80 192 160 200 T400 198 V240 H0 Z" fill="${INK}" opacity="0.35"/>
  ${dots(7, 11, "#c9d4de")}`);

const ww2 = () =>
  frame("ww2", ["#0c1626", "#274a72"], `
  <path d="M40 40 L120 96 L40 152 Z" fill="#f2e9c9" opacity="0.08"/>
  <path d="M360 40 L280 96 L360 152 Z" fill="#f2e9c9" opacity="0.08"/>
  <g fill="${INK}">
    <path d="M140 140 h120 l-14 26 h-92 Z"/>
    <rect x="176" y="112" width="52" height="30" rx="6"/>
    <rect x="222" y="120" width="34" height="9" rx="4"/>
    <circle cx="168" cy="168" r="15"/><circle cx="252" cy="168" r="15"/>
    <circle cx="210" cy="168" r="15"/>
  </g>
  <circle cx="202" cy="126" r="9" fill="#f2e9c9"/>
  ${star(202, 126, 6, "#c0392b")}
  <path d="M120 196 h160" stroke="${INK}" stroke-width="6" opacity="0.5"/>
  ${dots(9, 5, "#9db8d6")}`);

const protectorate = () =>
  frame("prot", ["#0b4f4a", "#17a392"], `
  <path d="M128 62 L172 48 L212 64 L228 96 L214 136 L194 162 L162 178 L130 166 L112 134 L106 98 Z" fill="${CREAM}"/>
  <path d="M128 62 L172 48 L212 64 L228 96 L214 136 L194 162 L162 178 L130 166 L112 134 L106 98 Z" fill="none" stroke="${INK}" stroke-width="3.5"/>
  <path d="M112 134 L144 118 L172 128 L206 114 L228 96" fill="none" stroke="${INK}" stroke-width="1.8" opacity="0.55"/>
  <g transform="translate(238 96)">
    <circle cx="0" cy="0" r="13" fill="none" stroke="${GOLD}" stroke-width="7"/>
    <rect x="10" y="-4" width="42" height="8" rx="4" fill="${GOLD}"/>
    <rect x="44" y="2" width="7" height="12" fill="${GOLD}"/>
    <rect x="56" y="2" width="7" height="9" fill="${GOLD}"/>
  </g>
  ${dots(6, 9, "#bfe0ea")}`);

const exploit = () =>
  frame("exploit", ["#0e3242", "#2a6a86"], `
  <rect x="150" y="150" width="10" height="44" fill="${INK}"/>
  <path d="M155 152 L226 96 L238 104 L168 158 Z" fill="${INK}"/>
  <path d="M150 152 L128 138 L134 128 L158 140 Z" fill="${INK}"/>
  <line x1="212" y1="102" x2="212" y2="140" stroke="${INK}" stroke-width="4"/>
  <path d="M204 140 h16 l-8 14 Z" fill="${GOLD}"/>
  <g fill="${CREAM}">
    <path d="M96 176 l18 -10 18 10 -6 16 h-24 Z"/>
    <path d="M268 172 l16 -9 16 9 -5 15 h-22 Z"/>
  </g>
  <path d="M96 176 h36 M268 172 h32" stroke="${INK}" stroke-width="4" opacity="0.6"/>
  ${dots(7, 13, "#bfe0ea")}`);

const ottoman = () =>
  frame("ottoman", ["#43202e", "#8a3a4e"], `
  <g fill="${INK}">
    <rect x="146" y="92" width="108" height="16" rx="4"/>
    <path d="M158 92 a42 42 0 0 1 84 0 Z"/>
    <rect x="118" y="76" width="12" height="96"/><path d="M118 76 a6 14 0 0 1 12 0 Z"/>
    <rect x="270" y="76" width="12" height="96"/><path d="M270 76 a6 14 0 0 1 12 0 Z"/>
  </g>
  <circle cx="200" cy="58" r="16" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <circle cx="208" cy="52" r="13" fill="#8a3a4e"/>
  <rect x="196" y="40" width="8" height="14" fill="${GOLD}"/>
  <circle cx="200" cy="38" r="4" fill="${GOLD}"/>
  ${dots(6, 17, "#f2cfae")}`);

const palestine = () =>
  frame("pal", ["#24402e", "#4a7a4a"], `
  <path d="M170 172 v-56 a30 30 0 0 1 60 0 v56 Z" fill="${INK}"/>
  <path d="M180 172 v-44 a20 20 0 0 1 40 0 v44 Z" fill="#e8c98a"/>
  <path d="M200 96 v-22" stroke="${INK}" stroke-width="6"/>
  <g fill="#5f9a58">
    <ellipse cx="178" cy="72" rx="16" ry="9" transform="rotate(-30 178 72)"/>
    <ellipse cx="222" cy="72" rx="16" ry="9" transform="rotate(30 222 72)"/>
    <ellipse cx="200" cy="58" rx="15" ry="8"/>
  </g>
  <g fill="${GOLD}">
    <circle cx="178" cy="80" r="4"/><circle cx="222" cy="80" r="4"/><circle cx="200" cy="64" r="4"/>
  </g>
  <g transform="translate(262 128)">
    <circle cx="0" cy="0" r="11" fill="none" stroke="${GOLD}" stroke-width="6"/>
    <rect x="8" y="-4" width="34" height="8" rx="4" fill="${GOLD}"/>
    <rect x="36" y="0" width="6" height="10" fill="${GOLD}"/>
  </g>
  ${dots(6, 19, "#cfe3b8")}`);

const coldwar = () =>
  frame("cw", ["#141f33", "#33507a"], `
  <rect x="120" y="96" width="160" height="80" rx="6" fill="${INK}"/>
  ${Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) =>
      `<rect x="${128 + c * 22 + (r % 2) * 11}" y="${104 + r * 18}" width="20" height="12" rx="2" fill="#3d5470"/>`
    ).join("")
  ).join("")}
  <path d="M108 84 L292 84" stroke="${GOLD}" stroke-width="4" stroke-dasharray="10 7"/>
  <g>
    <rect x="132" y="52" width="52" height="32" rx="3" fill="#3a6ea8"/>
    <rect x="216" y="52" width="52" height="32" rx="3" fill="#a83a3a"/>
    ${star(158, 68, 7, "#eaf2f8")}
    ${star(242, 68, 7, "#f2e4c8")}
    <rect x="156" y="30" width="4" height="26" fill="${INK}"/>
    <rect x="240" y="30" width="4" height="26" fill="${INK}"/>
  </g>
  ${dots(7, 23, "#9db8d6")}`);

const decolon = () =>
  frame("dec", ["#2a4a6e", "#7a9ac0"], `
  <path d="M200 190 a64 64 0 0 1 0 -128 a52 52 0 0 1 0 128" fill="none"/>
  <path d="M200 196 A64 64 0 0 1 264 132" fill="none" stroke="${GOLD}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
  <g>
    ${(
      [
        [104, "#c0392b"], [140, "#f2c14e"], [176, "#0e7a5f"], [212, "#2b4c9b"], [248, "#7a3a8a"],
      ] as [number, string][]
    )
      .map(([x, c], i) => `<rect x="${x}" y="${64 - i * 3}" width="3.5" height="104" fill="${INK}"/><path d="M${x + 3.5} ${64 - i * 3} h36 l-7 12 h-22 Z" fill="${c}"/>`)
      .join("")}
  </g>
  ${dots(6, 29, "#eaf2f7")}`);

const unipolar = () =>
  frame("uni", ["#0a1428", "#274a78"], `
  <circle cx="200" cy="126" r="58" fill="#2a4a72"/>
  <ellipse cx="200" cy="126" rx="58" ry="19" fill="none" stroke="#8ab8e0" stroke-width="2"/>
  <ellipse cx="200" cy="126" rx="24" ry="58" fill="none" stroke="#8ab8e0" stroke-width="2" opacity="0.7"/>
  <line x1="200" y1="126" x2="258" y2="126" stroke="#8ab8e0" stroke-width="2"/>
  <path d="M200 44 v-16" stroke="${GOLD}" stroke-width="4"/>
  <circle cx="200" cy="24" r="11" fill="${GOLD}"/>
  ${star(200, 24, 8, "#fff7dd")}
  ${dots(8, 31, "#9db8d6")}`);

const morocco = () =>
  frame("ma", ["#0c4f45", "#17a392"], `
  <path d="M0 196 Q120 184 240 194 T400 192 V240 H0 Z" fill="${INK}" opacity="0.3"/>
  <path d="M150 190 q-34 -26 -12 -46 q20 -16 34 2 q12 -24 32 -10 q22 14 -10 54 Z" fill="${CREAM}"/>
  <g>
    <path d="M286 66 q40 -10 74 4 v52 q-34 -14 -74 -4 Z" fill="#c0392b"/>
    <path d="M286 66 q40 -10 74 4 v9 q-34 -14 -74 -4 Z" fill="#0e7a5f"/>
    ${star(330, 82, 10, "#f5ead2")}
    <rect x="280" y="44" width="4" height="80" fill="${INK}"/>
    <circle cx="282" cy="42" r="5" fill="${GOLD}"/>
  </g>
  <circle cx="76" cy="64" r="20" fill="#f2d8a0" opacity="0.55"/>
  ${dots(6, 37, "#bfe0ea")}`);

const maghreb = () =>
  frame("mg", ["#3a4a7a", "#8a9ac8"], `
  <path d="M0 198 Q100 186 200 196 T400 194 V240 H0 Z" fill="${INK}" opacity="0.3"/>
  <g>
    <rect x="112" y="60" width="52" height="34" rx="4" fill="#c0392b"/>
    <circle cx="138" cy="77" r="9" fill="#f5ead2"/><circle cx="138" cy="77" r="5.5" fill="#c0392b"/>
    <rect x="174" y="64" width="52" height="34" rx="4" fill="#0e7a5f"/>
    ${star(200, 81, 9, GOLD)}
    <rect x="236" y="60" width="52" height="34" rx="4" fill="#2b4c9b"/>
    <circle cx="262" cy="77" r="9" fill="none" stroke="#f5ead2" stroke-width="3"/><circle cx="266" cy="73" r="7" fill="#2b4c9b"/>
  </g>
  <rect x="108" y="52" width="3" height="50" fill="${INK}"/>
  <rect x="170" y="56" width="3" height="46" fill="${INK}"/>
  <rect x="232" y="52" width="3" height="50" fill="${INK}"/>
  <circle cx="84" cy="56" r="16" fill="#f2d8a0" opacity="0.5"/>
  ${dots(6, 41, "#c9d4e8")}`);

const arab = () =>
  frame("arab", ["#33244e", "#6a4a8a"], `
  <path d="M148 180 v-84 a52 18 0 0 1 104 0 v84 Z" fill="none" stroke="${GOLD}" stroke-width="7"/>
  <path d="M168 180 v-72 a32 12 0 0 1 64 0 v72 Z" fill="${INK}"/>
  <path d="M200 76 v-24 M186 60 a14 14 0 0 1 28 0" stroke="${GOLD}" stroke-width="5" fill="none"/>
  <rect x="150" y="180" width="100" height="8" rx="4" fill="${GOLD}"/>
  ${[
    [96, "#c0392b"], [288, "#2b4c9b"],
  ]
    .map(([x, c]) => `<rect x="${x}" y="150" width="34" height="22" rx="3" fill="${c}"/>`)
    .join("")}
  <circle cx="342" cy="52" r="18" fill="#f2d8a0" opacity="0.6"/>
  ${dots(7, 43, "#d8b8e0")}`);

/* ============================ الجغرافيا ============================ */

const globe = (cx: number, cy: number, r: number, fill: string, mer = "#ffffff66") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.45}" ry="${r}" fill="none" stroke="${mer}" stroke-width="2"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.32}" fill="none" stroke="${mer}" stroke-width="2"/>
  <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${mer}" stroke-width="2"/>`;

const global = () =>
  frame("gl", ["#0c4453", "#1a8a92"], `
  ${globe(200, 118, 56, "#0f6a72", "#bfeee6")}
  <path d="M128 66 Q200 26 296 76" fill="none" stroke="${GOLD}" stroke-width="3" stroke-dasharray="7 6"/>
  <circle cx="296" cy="76" r="7" fill="${GOLD}"/>
  <circle cx="142" cy="88" r="6" fill="${CREAM}"/>
  <circle cx="238" cy="158" r="6" fill="${CREAM}"/>
  <path d="M296 68 l12 9 -12 9 -12 -9 Z" fill="${GOLD}"/>
  ${dots(7, 47, "#bfe0ea")}`);

const world = () =>
  frame("wr", ["#24406a", "#4a7aa8"], `
  ${globe(200, 116, 58, "#3a6a9a", "#d8ecf8")}
  <path d="M158 74 q18 -12 40 -7 M200 64 q24 -3 36 13 M172 152 q22 8 42 -2" stroke="#bfe3c8" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="128" cy="62" r="5" fill="${GOLD}"/>
  <circle cx="286" cy="92" r="5" fill="${GOLD}"/>
  <circle cx="232" cy="168" r="5" fill="${GOLD}"/>
  <path d="M128 62 L232 168 M286 92 L232 168" stroke="${GOLD}" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.8"/>
  ${dots(6, 53, "#c9dcec")}`);

const northsouth = () =>
  frame("ns", ["#6aa8cc", "#d8c090"], `
  <circle cx="200" cy="112" r="56" fill="#e8f2f8"/>
  <path d="M144 112 a56 56 0 0 1 112 0 Z" fill="#5aa8d8"/>
  <path d="M144 112 a56 56 0 0 0 112 0 Z" fill="#d89a58"/>
  <ellipse cx="200" cy="112" rx="56" ry="17" fill="none" stroke="#ffffff" stroke-width="3"/>
  <path d="M330 52 a14 14 0 1 0 0.1 0" fill="#f2d8a0"/>
  <path d="M120 190 Q200 180 280 190" stroke="#3f7488" stroke-width="6" fill="none" opacity="0.7"/>
  ${dots(6, 59, "#ffffffaa")}`);

const challenges = () =>
  frame("ch", ["#333f52", "#6a7a8e"], `
  ${globe(200, 108, 50, "#4a6a8a", "#d8ecf8")}
  <path d="M200 66 L252 164 H148 Z" fill="${GOLD}"/>
  <rect x="195" y="102" width="10" height="30" fill="${INK}"/>
  <circle cx="200" cy="144" r="5" fill="${INK}"/>
  <path d="M64 44 q18 -12 36 0 q18 -12 36 0" stroke="#9aa8b8" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${[104, 134, 164].map((x) => `<line x1="${x}" y1="128" x2="${x - 9}" y2="158" stroke="#8ab8e0" stroke-width="3" stroke-linecap="round"/>`).join("")}
  ${dots(6, 61, "#c9d4de")}`);

const eu = () =>
  frame("eu", ["#16307e", "#2a5ac8"], `
  <circle cx="200" cy="116" r="60" fill="#2b5ac8"/>
  <circle cx="200" cy="116" r="60" fill="none" stroke="#1d3a8a" stroke-width="4"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    return star(200 + 46 * Math.cos(a), 116 + 46 * Math.sin(a), 6, "#f2c14e");
  }).join("")}
  ${dots(6, 67, "#a8bce8")}`);

const namerica = () =>
  frame("na", ["#143c5e", "#3a7aa8"], `
  <path d="M0 192 Q80 182 160 192 T400 190 V240 H0 Z" fill="#0e3a56" opacity="0.8"/>
  <g fill="#bfe8c8">
    <path d="M96 148 L168 138 L184 158 L168 192 L110 196 L88 176 Z"/>
    <path d="M192 130 L246 124 L260 148 L246 188 L202 194 L188 162 Z"/>
    <path d="M268 152 L330 146 L352 170 L332 202 L274 204 L262 180 Z"/>
  </g>
  <path d="M176 152 L192 142 M254 154 L268 146" stroke="${GOLD}" stroke-width="4" stroke-dasharray="6 5"/>
  <path d="M336 60 q14 -10 28 0 q14 -10 28 0" stroke="#eaf6ef" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="76" cy="58" r="20" fill="#f2d8a0" opacity="0.55"/>
  ${dots(6, 71, "#bfe0ea")}`);

const seasia = () =>
  frame("sea", ["#2f5c40", "#5a9a6a"], `
  <circle cx="330" cy="52" r="20" fill="#f2d8a0" opacity="0.9"/>
  <g fill="#7a5a3a">
    <rect x="146" y="146" width="108" height="15" rx="4"/>
    <rect x="158" y="128" width="84" height="15" rx="4"/>
    <rect x="170" y="110" width="60" height="15" rx="4"/>
    <rect x="182" y="92" width="36" height="15" rx="4"/>
    <rect x="190" y="76" width="20" height="14" rx="4"/>
  </g>
  <rect x="196" y="56" width="8" height="22" fill="${GOLD}"/>
  <circle cx="200" cy="54" r="6" fill="${GOLD}"/>
  <path d="M0 200 Q120 190 240 200 T400 198 V240 H0 Z" fill="${INK}" opacity="0.3"/>
  ${dots(7, 73, "#d8ecc0")}`);

/* ============================ الخريطة ============================ */

const SCENES: Record<string, () => string> = {
  "hist-2bac-ad-t01": ww1,
  "hist-2bac-ad-t02": rev,
  "hist-2bac-ad-t03": crisis,
  "hist-2bac-ad-t04": ww2,
  "hist-2bac-ad-t05": protectorate,
  "hist-2bac-ad-t06": exploit,
  "hist-2bac-ad-t07": ottoman,
  "hist-2bac-ad-t08": palestine,
  "hist-2bac-ad-t09": coldwar,
  "hist-2bac-ad-t10": decolon,
  "hist-2bac-ad-t11": unipolar,
  "hist-2bac-ad-t12": morocco,
  "hist-2bac-ad-t13": maghreb,
  "hist-2bac-ad-t14": arab,
  "hist-2bac-ad-t15": palestine,
  "geo-2bac-ad-g01": global,
  "geo-2bac-ad-g02": world,
  "geo-2bac-ad-g03": northsouth,
  "geo-2bac-ad-g04": challenges,
  "geo-2bac-ad-g05": eu,
  "geo-2bac-ad-g06": namerica,
  "geo-2bac-ad-g07": seasia,
};

export function lessonArt(id: string): string {
  const fn = SCENES[id];
  if (!fn) return "";
  try {
    return fn();
  } catch {
    return "";
  }
}
