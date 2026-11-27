/** رسوم بطاقات الدروس — مشاهد SVG مسطّحة تعبّر عن موضوع كل درس */

const star = (cx: number, cy: number, r: number, fill: string, extra = "") => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" ${extra}/>`;
};

const wrap = (id: string, sky: [string, string, string?], inner: string, ground = "#00000022") =>
  `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/>
    ${sky[2] ? `<stop offset="0.55" stop-color="${sky[2]}"/>` : ""}
  </linearGradient></defs>
  <rect width="400" height="240" fill="url(#sky-${id})"/>${inner}
  <rect x="0" y="196" width="400" height="44" fill="${ground}" opacity="0.35"/></svg>`;

const dots = (n: number, seed: number, color: string, r = 1.6) => {
  let s = "";
  let x = (seed * 73) % 400;
  for (let i = 0; i < n; i++) {
    x = (x * 37 + 91) % 400;
    const y = 14 + ((x * 53 + seed * 31) % 90);
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="${color}" opacity="0.7"/>`;
  }
  return s;
};

/* ============================ التاريخ ============================ */

const ww1 = () =>
  wrap("ww1", ["#3d2f4a", "#8a5a4a", "#d9a05b"], `
  <circle cx="330" cy="52" r="26" fill="#f2d8a0" opacity="0.9"/>
  ${dots(14, 3, "#f2d8a0")}
  <path d="M0 168 Q60 158 120 166 T240 164 T400 170 V240 H0 Z" fill="#2c2438"/>
  <g stroke="#1d1826" stroke-width="3" fill="none">
    <path d="M-10 176 L410 172"/>
    <path d="M40 190 L360 186"/>
  </g>
  <g stroke="#1d1826" stroke-width="4">
    ${[30, 110, 200, 290, 370].map((x) => `<line x1="${x}" y1="150" x2="${x}" y2="196"/>`).join("")}
  </g>
  <path d="M60 96 l14 8 -14 8 -14 -8 Z" fill="#241d30"/>
  <path d="M120 84 a10 10 0 1 0 0.1 0 M120 76 v-8 h14 v8" fill="#241d30"/>
  <path d="M250 60 l30 -8 30 8 -4 6 -26 -6 -26 6 Z" fill="#241d30"/>
  <circle cx="60" cy="150" r="9" fill="#c96f4a"/><rect x="52" y="150" width="16" height="4" rx="2" fill="#8a3f2c"/>`);

const rev = () =>
  wrap("rev", ["#4a1620", "#8a2430", "#d96a3a"], `
  <circle cx="200" cy="180" r="70" fill="#f2a65a" opacity="0.35"/>
  <g fill="#1d0f14">
    <rect x="40" y="120" width="60" height="80"/><rect x="120" y="96" width="70" height="104"/><rect x="210" y="130" width="56" height="70"/>
    <rect x="286" y="108" width="64" height="92"/>
  </g>
  ${[52, 142, 232, 306].map((x, i) => `<rect x="${x + 14}" y="${i % 2 ? 78 : 88}" width="10" height="${i % 2 ? 26 : 18}" fill="#1d0f14"/>`).join("")}
  <rect x="150" y="60" width="5" height="130" fill="#1d0f14"/>
  <path d="M155 62 h90 l-14 22 h-62 Z" fill="#c22f3d"/>
  ${star(176, 72, 8, "#f2c14e")}
  ${dots(10, 7, "#f2c14e", 1.4)}`);

const crisis = () =>
  wrap("crisis", ["#2b3440", "#55606e", "#8b95a1"], `
  <g fill="#1f2733">
    <rect x="30" y="120" width="52" height="80"/><rect x="100" y="96" width="60" height="104"/><rect x="180" y="130" width="48" height="70"/><rect x="252" y="110" width="58" height="90"/>
    ${[44, 116, 196, 268, 300].map((x) => `<rect x="${x}" y="${x === 196 ? 116 : 108}" width="8" height="${x === 196 ? 14 : 8}" fill="#141a22"/>`).join("")}
  </g>
  <path d="M40 60 L120 78 L160 66 L230 96 L290 84 L360 120" fill="none" stroke="#d96a3a" stroke-width="5" stroke-linejoin="round"/>
  <path d="M352 112 l-6 14 M352 112 l12 8" stroke="#d96a3a" stroke-width="5" stroke-linecap="round"/>
  <g fill="#e8b64c"><circle cx="90" cy="200" r="9"/><rect x="82" y="206" width="16" height="5" rx="2.5"/></g>
  <circle cx="150" cy="212" r="7" fill="#c98f2e" opacity="0.8"/>
  ${dots(8, 11, "#c9d4de", 1.2)}`);

const ww2 = () =>
  wrap("ww2", ["#101c30", "#1d3350", "#33506e"], `
  ${[[90, 40], [250, 30], [330, 70]].map(([x, y]) => `<path d="M${x - 40} ${y} L${x + 10} ${y - 46} L${x + 18} ${y - 30} L${x + 46} ${y - 22} L${x + 14} ${y - 8} L${x + 30} ${y + 6} L${x - 30} ${y + 4} Z" fill="#0a1220" opacity="0.9"/>`).join("")}
  <path d="M30 90 L90 130 L150 96 L230 140 L300 110 L370 150" fill="none" stroke="#7fb0d9" stroke-width="2" opacity="0.5"/>
  <path d="M60 40 L120 80 L60 120 Z" fill="#f2e9c9" opacity="0.10"/>
  <path d="M340 30 L280 70 L340 110 Z" fill="#f2e9c9" opacity="0.10"/>
  <path d="M0 200 Q50 192 100 198 T200 196 T400 200 V240 H0 Z" fill="#0a1420"/>
  <rect x="70" y="168" width="46" height="26" rx="4" fill="#0a1420"/>
  <rect x="112" y="160" width="22" height="12" rx="3" fill="#0a1420"/>
  <circle cx="150" cy="196" r="13" fill="#0a1420"/><circle cx="150" cy="196" r="5" fill="#33506e"/>
  ${dots(12, 5, "#9db8d6", 1.1)}`);

const protectorate = () =>
  wrap("prot", ["#0e5a54", "#14907f", "#7fd4c4"], `
  <path d="M96 60 L150 44 L196 62 L214 96 L198 140 L176 168 L140 186 L104 172 L84 138 L76 100 Z" fill="#eaf6ef" opacity="0.95"/>
  <path d="M96 60 L150 44 L196 62 L214 96 L198 140 L176 168 L140 186 L104 172 L84 138 L76 100 Z" fill="none" stroke="#0b3f3a" stroke-width="3"/>
  <path d="M84 138 L120 120 L150 132 L186 116 L214 96" fill="none" stroke="#0b3f3a" stroke-width="1.6" opacity="0.6"/>
  <rect x="262" y="52" width="96" height="60" rx="6" fill="#f4f6f5"/>
  <rect x="262" y="52" width="96" height="20" rx="6" fill="#2b4c9b"/><rect x="262" y="66" width="96" height="6" fill="#fff"/>
  <rect x="262" y="112" width="96" height="60" rx="6" fill="#f4f6f5"/>
  <rect x="262" y="112" width="96" height="20" rx="6" fill="#c0392b"/><rect x="262" y="126" width="96" height="6" fill="#fff"/>
  <circle cx="60" cy="60" r="20" fill="#f2e9c9" opacity="0.5"/>
  <path d="M330 190 l10 -4 v8 zM330 190 l-10 -4 v8 z" fill="#8a6b3f"/>`);

const exploit = () =>
  wrap("exploit", ["#123a4a", "#1d5a70", "#4a93a8"], `
  <circle cx="70" cy="56" r="22" fill="#f2d8a0" opacity="0.85"/>
  <path d="M0 190 Q80 178 160 188 T400 186 V240 H0 Z" fill="#0d2a38"/>
  <path d="M40 190 v-70 l60 -18 v18 l-38 10 v60 Z" fill="#0a2230"/>
  <path d="M100 190 v-40 h90 l-14 40 Z" fill="#0a2230"/>
  <rect x="160" y="120" width="34" height="34" fill="#0a2230"/><rect x="204" y="132" width="26" height="22" fill="#123247"/>
  <path d="M250 60 L250 150 M250 60 L310 60 M310 60 L310 190 M250 60 L230 40" stroke="#0a2230" stroke-width="8" fill="none"/>
  <path d="M310 190 l-40 -30 M310 190 l-52 -8" stroke="#0a2230" stroke-width="6"/>
  <circle cx="330" cy="52" r="14" fill="#e8b64c" opacity="0.9"/>
  ${dots(10, 9, "#bfe0ea", 1.3)}`);

const ottoman = () =>
  wrap("ottoman", ["#5a2a3a", "#a04a52", "#e0a878"], `
  <circle cx="200" cy="70" r="30" fill="#f2d8a0" opacity="0.9"/>
  <path d="M40 200 Q200 176 360 200 V240 H40 Z" fill="#3d1f2a"/>
  <g fill="#2a1420">
    <path d="M120 200 v-52 a40 40 0 0 1 80 0 v52 Z"/>
    <rect x="86" y="120" width="14" height="80"/><path d="M86 120 a7 16 0 0 1 14 0 Z"/>
    <rect x="200" y="120" width="14" height="80"/><path d="M200 120 a7 16 0 0 1 14 0 Z"/>
  </g>
  <path d="M158 148 a22 22 0 1 1 -0.1 0" fill="#e8b64c"/>
  <path d="M140 196 Q200 186 260 196" stroke="#e8b64c" stroke-width="3" fill="none" opacity="0.7"/>
  <path d="M300 200 q10 -18 20 0 q10 -18 20 0" stroke="#2a1420" stroke-width="5" fill="none"/>
  ${dots(8, 13, "#f2cfae", 1.3)}`);

const palestine = () =>
  wrap("pal", ["#2a4a34", "#4a7a4a", "#a8c98a"], `
  <circle cx="330" cy="50" r="24" fill="#f2e9c9" opacity="0.85"/>
  <path d="M0 190 Q100 176 200 188 T400 186 V240 H0 Z" fill="#1d3324"/>
  <path d="M110 190 v-70" stroke="#5a4632" stroke-width="10"/>
  <g fill="#3f6b3a">
    <ellipse cx="92" cy="112" rx="22" ry="12"/><ellipse cx="128" cy="112" rx="22" ry="12"/>
    <ellipse cx="110" cy="96" rx="20" ry="11"/><ellipse cx="110" cy="126" rx="18" ry="10"/>
  </g>
  <g fill="#5a4632"><circle cx="110" cy="150" r="8"/><rect x="104" y="156" width="12" height="16" rx="4"/></g>
  <path d="M250 190 v-60 a30 30 0 0 1 60 0 v60 Z" fill="#20382a"/>
  <path d="M262 190 v-46 a18 18 0 0 1 36 0 v46 Z" fill="#f2d8a0" opacity="0.8"/>
  <path d="M196 96 q14 -10 28 0 M210 84 q10 -8 20 0" stroke="#f2e9c9" stroke-width="3" fill="none"/>
  ${dots(8, 17, "#cfe3b8", 1.2)}`);

const coldwar = () =>
  wrap("cw", ["#16233c", "#2a3f5e", "#4a6a8a"], `
  <rect x="0" y="0" width="200" height="240" fill="#1d3a5f" opacity="0.55"/>
  <rect x="200" y="0" width="200" height="240" fill="#5f2a2a" opacity="0.4"/>
  <line x1="200" y1="0" x2="200" y2="240" stroke="#e8b64c" stroke-width="2" stroke-dasharray="8 6"/>
  <g fill="#101a2a">
    <rect x="60" y="150" width="90" height="60"/><rect x="250" y="150" width="90" height="60"/>
    <path d="M150 150 l0 -34 M150 116 l26 -14 v14 l-26 14 Z" fill="#101a2a"/>
    <path d="M250 116 l26 -14 v14 l-26 14 Z" fill="#5f1f1f"/>
  </g>
  <circle cx="150" cy="180" r="10" fill="#4a6a8a"/><circle cx="340" cy="180" r="10" fill="#8a4a4a"/>
  <path d="M40 96 l20 -8 M40 96 l-8 20 M360 96 l-20 -8 M360 96 l8 20" stroke="#e8b64c" stroke-width="4" stroke-linecap="round"/>
  ${dots(10, 19, "#9db8d6", 1.1)}`);

const decolon = () =>
  wrap("dec", ["#3a5a7a", "#6a8aa8", "#d9c9a0"], `
  <circle cx="200" cy="190" r="60" fill="#f2d8a0" opacity="0.5"/>
  <path d="M0 200 Q100 188 200 198 T400 196 V240 H0 Z" fill="#2c4a5e"/>
  ${(
    [
      [70, "#c0392b"], [120, "#f2c14e"], [170, "#0e7a5f"], [220, "#2b4c9b"], [270, "#7a3a8a"], [320, "#d96a3a"],
    ] as [number, string][]
  )
    .map(([x, c], i) => `<rect x="${x}" y="${96 - i * 4}" width="4" height="104" fill="#3a3a3a"/><path d="M${x + 4} ${96 - i * 4} h44 l-8 13 h-28 Z" fill="${c}"/>`)
    .join("")}
  <path d="M180 60 a20 20 0 0 1 40 0" fill="none" stroke="#f2e9c9" stroke-width="3" opacity="0.7"/>
  <path d="M196 52 l8 12 8 -12" fill="none" stroke="#f2e9c9" stroke-width="3"/>
  ${dots(8, 23, "#eaf2f7", 1.2)}`);

const unipolar = () =>
  wrap("uni", ["#0e1a30", "#1d3050", "#3a5a80"], `
  <circle cx="200" cy="130" r="72" fill="#2a4a72" opacity="0.8"/>
  <ellipse cx="200" cy="130" rx="72" ry="24" fill="none" stroke="#7fb0d9" stroke-width="2" opacity="0.7"/>
  <ellipse cx="200" cy="130" rx="30" ry="72" fill="none" stroke="#7fb0d9" stroke-width="2" opacity="0.5"/>
  <path d="M200 30 v-14" stroke="#e8b64c" stroke-width="4"/><circle cx="200" cy="22" r="9" fill="#f2c14e"/>
  ${star(200, 22, 7, "#fff7dd")}
  ${dots(12, 29, "#9db8d6", 1.2)}`);

const morocco = () =>
  wrap("ma", ["#0d5a50", "#12907e", "#7fd4c4"], `
  <path d="M0 190 Q120 178 240 188 T400 186 V240 H0 Z" fill="#0a3f37"/>
  <path d="M150 190 q-30 -22 -10 -40 q18 -14 30 4 q10 -20 28 -8 q20 12 -8 44 Z" fill="#eaf6ef"/>
  <path d="M296 60 h76 v48 H296 Z" fill="#c0392b"/>
  <path d="M296 60 h76 v14 H296 Z" fill="#0e7a5f"/>
  ${star(334, 74, 9, "#f2e9c9")}
  <path d="M290 130 l14 -8 v16 Z M318 124 l14 -8 v16 Z M346 130 l14 -8 v16 Z" fill="#0a3f37"/>
  <circle cx="70" cy="60" r="18" fill="#f2d8a0" opacity="0.6"/>
  ${dots(8, 31, "#bfe0ea", 1.2)}`);

const maghreb = () =>
  wrap("mg", ["#4a5a8a", "#7a8ab8", "#d9c9a0"], `
  <path d="M0 196 Q100 184 200 194 T400 192 V240 H0 Z" fill="#3a4a6e"/>
  ${(
    [
      [80, "#c0392b", "circle"],
      [200, "#0e7a5f", "star"],
      [320, "#2b4c9b", "crescent"],
    ] as [number, string, string][]
  )
    .map(([x, c, kind], i) => {
      const y = 92 - i * 8;
      const emblem =
        kind === "circle"
          ? `<circle cx="${x + 30}" cy="${y + 18}" r="10" fill="#fff"/><circle cx="${x + 30}" cy="${y + 18}" r="6" fill="${c}"/>`
          : kind === "star"
            ? star(x + 30, y + 18, 11, "#e8b64c")
            : `<circle cx="${x + 30}" cy="${y + 18}" r="10" fill="none" stroke="#f2e9c9" stroke-width="3"/><circle cx="${x + 34}" cy="${y + 14}" r="8" fill="${c}"/>`;
      return `<rect x="${x}" y="${y}" width="60" height="36" rx="4" fill="${c}"/>${emblem}<rect x="${x}" y="${y}" width="60" height="5" fill="#00000022"/>`;
    })
    .join("")}
  <circle cx="90" cy="60" r="16" fill="#f2d8a0" opacity="0.6"/>
  ${dots(8, 37, "#c9d4e8", 1.2)}`);

const arab = () =>
  wrap("arab", ["#3a2a5a", "#6a4a8a", "#c98ab8"], `
  <path d="M140 200 v-90 a60 20 0 0 1 120 0 v90 Z" fill="#241a3e"/>
  <path d="M160 200 v-80 a40 14 0 0 1 80 0 v80 Z" fill="#e8b64c" opacity="0.85"/>
  <path d="M200 60 v-24 M186 46 a14 14 0 0 1 28 0" stroke="#e8b64c" stroke-width="4" fill="none"/>
  ${(
    [
      [60, "#c0392b"], [110, "#0e7a5f"], [250, "#2b4c9b"], [300, "#7a3a8a"],
    ] as [number, string][]
  )
    .map(([x, c]) => `<rect x="${x}" y="${150 + (x % 2) * 8}" width="40" height="24" rx="3" fill="${c}"/>`)
    .join("")}
  <circle cx="340" cy="50" r="18" fill="#f2d8a0" opacity="0.7"/>
  ${dots(10, 41, "#d8b8e0", 1.2)}`);

/* ============================ الجغرافيا ============================ */

const globe = (cx: number, cy: number, r: number, fill: string, mer = "#ffffff55") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.45}" ry="${r}" fill="none" stroke="${mer}" stroke-width="2"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.32}" fill="none" stroke="${mer}" stroke-width="2"/>
  <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${mer}" stroke-width="2"/>
  <path d="M${cx - r * 0.7} ${cy - r * 0.7} A${r * 1.05} ${r * 1.05} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}" fill="none" stroke="${mer}" stroke-width="2" opacity="0.6"/>`;

const global = () =>
  wrap("gl", ["#0e4a5a", "#157a86", "#5ac8b8"], `
  ${globe(200, 118, 62, "#0f6a72", "#bfeee6")}
  <path d="M120 60 Q200 20 300 70" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-dasharray="6 5"/>
  <circle cx="300" cy="70" r="7" fill="#f2c14e"/><circle cx="140" cy="80" r="6" fill="#eaf6ef"/><circle cx="240" cy="150" r="6" fill="#eaf6ef"/>
  <path d="M300 62 l10 8 -10 8 -10 -8 Z" fill="#f2c14e"/>
  ${dots(10, 43, "#bfe0ea", 1.3)}`);

const world = () =>
  wrap("wr", ["#2a4a6e", "#4a7aa8", "#8ab8d8"], `
  ${globe(200, 116, 64, "#3a6a9a", "#d8ecf8")}
  <path d="M150 70 q20 -14 44 -8 M196 60 q26 -4 40 14 M170 150 q24 8 46 -2" stroke="#eaf6ef" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.85"/>
  <circle cx="120" cy="60" r="5" fill="#f2c14e"/><circle cx="290" cy="90" r="5" fill="#f2c14e"/><circle cx="230" cy="170" r="5" fill="#f2c14e"/>
  <path d="M120 60 L230 170 M290 90 L230 170" stroke="#f2c14e" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.8"/>
  ${dots(8, 47, "#c9dcec", 1.2)}`);

const northsouth = () =>
  wrap("ns", ["#7ab8d8", "#e8d8a8", "#d96a3a"], `
  <circle cx="200" cy="116" r="64" fill="#e8f2f8"/>
  <path d="M136 116 a64 64 0 0 1 128 0 Z" fill="#7ab8d8" opacity="0.9"/>
  <path d="M136 116 a64 64 0 0 0 128 0 Z" fill="#e0a868" opacity="0.9"/>
  <ellipse cx="200" cy="116" rx="64" ry="20" fill="none" stroke="#fff" stroke-width="2.5"/>
  <path d="M120 196 Q200 186 280 196" stroke="#3f7488" stroke-width="5" fill="none" opacity="0.8"/>
  <path d="M140 204 q10 -6 20 0 q10 -6 20 0 M240 208 q10 -6 20 0" stroke="#3f7488" stroke-width="3" fill="none"/>
  <circle cx="330" cy="52" r="20" fill="#f2d8a0" opacity="0.9"/>
  ${dots(8, 53, "#ffffffaa", 1.2)}`);

const challenges = () =>
  wrap("ch", ["#3a4a5e", "#6a7a8e", "#9aa8b8"], `
  ${globe(200, 110, 56, "#4a6a8a", "#d8ecf8")}
  <path d="M200 60 L262 168 H138 Z" fill="#e8b64c"/>
  <rect x="194" y="92" width="12" height="34" fill="#3a2a10"/>
  <circle cx="200" cy="140" r="5" fill="#3a2a10"/>
  <path d="M60 40 q20 -14 40 0 q20 -14 40 0" stroke="#8a9aa8" stroke-width="4" fill="none"/>
  ${[110, 140, 170].map((x) => `<line x1="${x}" y1="120" x2="${x - 8}" y2="152" stroke="#7fb0d9" stroke-width="2" opacity="0.7"/>`).join("")}
  ${dots(8, 59, "#c9d4de", 1.1)}`);

const eu = () =>
  wrap("eu", ["#1d3a8a", "#2a5ac8", "#7a9ae0"], `
  <circle cx="200" cy="118" r="66" fill="#2b5ac8"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    return star(200 + 52 * Math.cos(a), 118 + 52 * Math.sin(a), 6, "#f2c14e");
  }).join("")}
  ${star(200, 118, 14, "#f2c14e")}
  <circle cx="330" cy="52" r="18" fill="#f2d8a0" opacity="0.7"/>
  ${dots(8, 61, "#a8bce8", 1.2)}`);

const namerica = () =>
  wrap("na", ["#1d4a6e", "#3a7aa8", "#8ac8e0"], `
  <path d="M0 190 Q80 180 160 190 T400 188 V240 H0 Z" fill="#14506e"/>
  <g>
    <path d="M70 150 L150 138 L168 160 L150 196 L86 200 L62 176 Z" fill="#eaf6ef"/>
    <path d="M176 128 L236 120 L252 146 L236 190 L186 196 L168 160 Z" fill="#eaf6ef"/>
    <path d="M252 150 L320 142 L344 168 L322 206 L258 208 L244 180 Z" fill="#eaf6ef"/>
  </g>
  <path d="M160 160 L176 150 M240 160 L252 150" stroke="#f2c14e" stroke-width="3" stroke-dasharray="5 4"/>
  <path d="M120 92 q14 -10 28 0 M140 82 q10 -8 20 0" stroke="#eaf6ef" stroke-width="3" fill="none" opacity="0.8"/>
  <circle cx="330" cy="56" r="20" fill="#f2d8a0" opacity="0.85"/>
  ${dots(8, 67, "#bfe0ea", 1.2)}`);

const seasia = () =>
  wrap("sea", ["#3a6a4a", "#5a9a6a", "#c8dca8"], `
  <circle cx="80" cy="56" r="22" fill="#f2d8a0" opacity="0.9"/>
  <path d="M0 190 Q120 180 240 190 T400 188 V240 H0 Z" fill="#2a5038"/>
  <g fill="#7a5a3a">
    <rect x="150" y="150" width="100" height="14" rx="3"/>
    <rect x="162" y="132" width="76" height="14" rx="3"/>
    <rect x="174" y="114" width="52" height="14" rx="3"/>
    <rect x="186" y="96" width="28" height="14" rx="3"/>
    <rect x="192" y="80" width="16" height="14" rx="3"/>
  </g>
  <g fill="#3f6b3a">
    <path d="M60 190 q-6 -30 8 -44 q4 20 12 24 q-10 8 -8 20 Z"/>
    <path d="M330 192 q8 -34 -6 -50 q-4 22 -14 26 q12 8 10 24 Z"/>
  </g>
  <path d="M270 60 q20 -12 40 0 q-20 12 -40 0" fill="#4a8a5a"/>
  ${dots(10, 71, "#d8ecc0", 1.2)}`);

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
