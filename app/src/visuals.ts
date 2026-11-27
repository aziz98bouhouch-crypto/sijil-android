/** رسوم توضيحية للمنهجيات — SVG خفيف بلا صور خارجية */

import { MA_VIEW, MA_OUTLINE, MA_ZONES, MA_CITIES, MA_ATLAS } from "./mapArt";

export type VisualKind = "timeline" | "map" | "doc" | "essay" | "bar" | "pie" | "curve";

function timeline(): string {
  const start = 1912;
  const end = 1956;
  const x0 = 64;
  const x1 = 664;
  const scale = (year: number) => x0 + ((year - start) / (end - start)) * (x1 - x0);
  const events = [
    { year: 1912, label: "الحماية", sub: "بداية الحماية الفرنسية", up: true },
    { year: 1930, label: "الظهير البربري", sub: "سياسة التفرقة", up: false },
    { year: 1944, label: "وثيقة الاستقلال", sub: "تحول المطالب", up: true },
    { year: 1953, label: "نفي السلطان", sub: "أزمة النظام", up: false },
    { year: 1956, label: "الاستقلال", sub: "نهاية الحماية", up: true },
  ];
  const phases = [
    { from: 1912, to: 1930, color: "#d98a2b", name: "المقاومة السياسية" },
    { from: 1930, to: 1944, color: "#2f6fb3", name: "المطالبة بالإصلاح" },
    { from: 1944, to: 1956, color: "#0e9488", name: "الاستقلال" },
  ];
  const ticks = [];
  for (let y = 1912; y <= 1956; y += 4) ticks.push(y);

  return `<figure class="gvisual"><svg viewBox="0 0 720 300" role="img" aria-label="خط زمني متناسب لمراحل الحماية الفرنسية بالمغرب 1912 إلى 1956">
    <defs>
      <linearGradient id="tlAxis" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#94a9b5"/><stop offset="1" stop-color="#35566b"/>
      </linearGradient>
    </defs>
    <text x="64" y="26" class="svgt" text-anchor="end">خط زمني متناسب: المغرب 1912 — 1956</text>
    <text x="664" y="26" class="svgm" text-anchor="start">المسافة تعكس المدة الحقيقية</text>

    ${phases
      .map((p, i) => {
        const a = scale(p.from);
        const b = scale(p.to);
        return `<rect x="${a}" y="122" width="${b - a}" height="26" rx="7" fill="${p.color}" opacity="0.16"/>
        <rect x="${a}" y="122" width="${b - a}" height="4" rx="2" fill="${p.color}"/>
        <text x="${(a + b) / 2}" y="140" text-anchor="middle" class="svgl" fill="${p.color}">${p.name}</text>
        <text x="${(a + b) / 2}" y="166" text-anchor="middle" class="svgm">${p.to - p.from} سنة</text>`;
      })
      .join("")}

    <line x1="${x0}" y1="192" x2="${x1 + 8}" y2="192" stroke="url(#tlAxis)" stroke-width="3" stroke-linecap="round"/>
    <path d="M${x1 + 8} 192l-11-5v10z" fill="#35566b"/>
    ${ticks
      .map((y) => {
        const x = scale(y);
        const major = y % 8 === 0;
        return `<line x1="${x}" y1="${192 - (major ? 6 : 3)}" x2="${x}" y2="${192 + (major ? 6 : 3)}" stroke="#9fb2bc" stroke-width="${major ? 1.6 : 1}"/>
        ${major ? `<text x="${x}" y="212" text-anchor="middle" class="svgm">${y}</text>` : ""}`;
      })
      .join("")}

    ${events
      .map((e) => {
        const x = scale(e.year);
        const ly = e.up ? 84 : 244;
        return `<line x1="${x}" y1="${e.up ? 126 : 150}" x2="${x}" y2="${ly + (e.up ? 20 : -18)}" stroke="#b9ccd4" stroke-width="1.4" stroke-dasharray="3 3"/>
        <circle cx="${x}" cy="192" r="6.5" fill="#fff" stroke="#0f766e" stroke-width="3"/>
        <circle cx="${x}" cy="192" r="2.4" fill="#0f766e"/>
        <rect x="${x - 62}" y="${ly - (e.up ? 0 : 26)}" width="124" height="${e.up ? 36 : 44}" rx="9" fill="#fff" stroke="#dce8e5"/>
        <text x="${x}" y="${ly + (e.up ? 14 : 11)}" text-anchor="middle" class="svgb">${e.label}</text>
        <text x="${x}" y="${ly + (e.up ? 28 : 26)}" text-anchor="middle" class="svgm">${e.year} · ${e.sub}</text>`;
      })
      .join("")}

    <path d="M${scale(1912)} 272v8H${scale(1956)}v-8" fill="none" stroke="#8a4459" stroke-width="2"/>
    <path d="M${scale(1912)} 276l7-4v8zM${scale(1956)} 276l-7-4v8z" fill="#8a4459"/>
    <text x="364" y="292" text-anchor="middle" class="svgl" fill="#8a4459">المدة الإجمالية: 1956 − 1912 = 44 سنة</text>
  </svg><figcaption>لا تُوزَّع المحطات بالتساوي: 1912←1930 (18 سنة) أطول من 1944←1956 (12 سنة). احسب المدة قبل الرسم، وسمِّ المراحل.</figcaption></figure>`;
}

function moroccoMap(): string {
  /* حدود حقيقية من geoBoundaries/GADM (mapArt.ts): المغرب والصحراء المغربية
     مرسومتان كوحدة واحدة بلا خط فصل — نفس منطق تمارين التوطين في mapShapes.ts */
  const bands: [string, string][] = [
    ["north", "المتوسطي الشمالي"],
    ["center", "الوسط: سهول وأطلس"],
    ["south", "الجنوب"],
    ["sahara", "المناطق الصحراوية"],
  ];
  const bandColor: Record<string, string> = {
    north: "#a9cdec",
    center: "#eed9a9",
    south: "#e3c493",
    sahara: "#dcc9b8",
  };
  /* إزاحة وتسميات يدوية لتفادي تراكب أسماء المدن */
  const labelAt: Record<string, [number, number, string]> = {
    "طنجة": [0, 18, "middle"],
    "وجدة": [-10, 5, "end"],
    "فاس": [0, -12, "middle"],
    "الرباط": [-10, 6, "end"],
    "مكناس": [10, 14, "start"],
    "الدار البيضاء": [-10, 16, "end"],
    "القنيطرة": [0, -12, "middle"],
    "مراكش": [0, -12, "middle"],
    "أكادير": [-10, 6, "end"],
    "الصويرة": [0, -12, "middle"],
    "تزنيت": [10, 14, "start"],
    "ورزازات": [0, -12, "middle"],
    "العيون": [0, -12, "middle"],
    "الداخلة": [10, 6, "start"],
  };
  const cities = MA_CITIES.map((c) => {
    const [dx, dy, anchor] = labelAt[c.name] ?? [0, 16, "middle"];
    return `<circle cx="${c.x}" cy="${c.y}" r="5" fill="#0f766e" stroke="#fff" stroke-width="2"/>
    <text x="${c.x + dx}" y="${c.y + dy}" text-anchor="${anchor}" class="mal" font-size="15" style="paint-order:stroke;stroke:#f4fbf9;stroke-width:3.5;stroke-linejoin:round">${c.name}</text>`;
  }).join("");
  const peaks = MA_ATLAS.map(
    (p) => `<path d="M${p.x} ${p.y - 8}L${p.x + 4.6} ${p.y + 3.4}L${p.x - 4.6} ${p.y + 3.4}Z" fill="#8a6bbf" opacity="0.85"/>`,
  ).join("");
  return `<figure class="gvisual"><svg viewBox="${MA_VIEW}" role="img" aria-label="خريطة المملكة المغربية مع مفتاح ومقياس واتجاه الشمال">
    <defs>
      <linearGradient id="sea2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e8f4f8"/><stop offset="1" stop-color="#f8fcfd"/>
      </linearGradient>
      <clipPath id="maClip2"><path d="${MA_OUTLINE}"/></clipPath>
    </defs>
    <rect x="0" y="0" width="1000" height="1066" fill="url(#sea2)"/>
    <text x="960" y="46" text-anchor="end" class="svgt2">المملكة المغربية: التوزيع الجغرافي</text>
    <text x="60" y="46" class="svgm2" text-anchor="start">خريطة تخطيطية للقراءة لا للحدود</text>
    <text x="700" y="30" text-anchor="middle" class="svgs2" fill="#3f7488">البحر الأبيض المتوسط</text>
    <text x="34" y="560" text-anchor="middle" class="svgs2" fill="#3f7488" transform="rotate(-90 34 560)">المحيط الأطلسي</text>

    <path d="${MA_OUTLINE}" fill="#f3ead8"/>
    <g clip-path="url(#maClip2)">
      ${bands
        .map(
          ([k]) => `<path d="${MA_ZONES[k]}" fill="${bandColor[k]}" fill-rule="evenodd" opacity="0.85"/>`,
        )
        .join("")}
      ${peaks}
    </g>
    <path d="${MA_OUTLINE}" fill="none" stroke="#6f8792" stroke-width="2.5"/>
    <text x="585" y="520" text-anchor="middle" class="svgs2" fill="#6b5a86">الأطلس</text>

    ${cities}

    <g transform="translate(948 128)">
      <circle r="34" fill="#fff" stroke="#35566b" stroke-width="2"/>
      <path d="M0 -24l9 31-9-7-9 7z" fill="#b45f7a"/>
      <text x="0" y="52" text-anchor="middle" class="svgm2">الشمال</text>
    </g>

    <g transform="translate(56 88)">
      <rect width="370" height="180" rx="14" fill="#fff" stroke="#d6e4e8"/>
      <text x="352" y="28" text-anchor="end" class="svgb2">المفتاح (تقسيم مبسّط)</text>
      ${bands
        .map(
          ([k, label], i) => `<rect x="336" y="${44 + i * 24}" width="15" height="13" rx="2" fill="${bandColor[k]}" stroke="#c9bfa8" stroke-width="0.6"/>
          <text x="326" y="${55 + i * 24}" text-anchor="end" class="svgm2">${label}</text>`,
        )
        .join("")}
      <line x1="20" y1="150" x2="190" y2="150" stroke="#35566b" stroke-width="2"/>
      <line x1="20" y1="144" x2="20" y2="156" stroke="#35566b" stroke-width="1.4"/>
      <line x1="105" y1="146" x2="105" y2="154" stroke="#35566b" stroke-width="1.1"/>
      <line x1="190" y1="144" x2="190" y2="156" stroke="#35566b" stroke-width="1.4"/>
      <text x="105" y="172" text-anchor="middle" class="svgm2">0 — 250 — 500 كم (تقريبي)</text>
    </g>
  </svg><figcaption>الحدود مرسومة كوحدة واحدة: الصحراء المغربية جزء من التراب الوطني ولا يُفصل عنها خطٌّ حدودي. صف التركز ثم الامتداد ثم فسّر بالمناخ والتضاريس والسواحل والأنشطة.</figcaption></figure>`;
}

function documentAnatomy(): string {
  const labels = [
    { y: 76, n: 1, text: "النوع والطبيعة", detail: "خطاب، معاهدة، تقرير، جدول…" },
    { y: 124, n: 2, text: "الصاحب والمصدر", detail: "من كتب؟ وفي أي سياق؟" },
    { y: 172, n: 3, text: "التاريخ", detail: "اليوم، الشهر، السنة أو الفترة" },
    { y: 220, n: 4, text: "الموضوع", detail: "ما الحدث أو الظاهرة؟" },
    { y: 268, n: 5, text: "حدود الوثيقة", detail: "ماذا لا تقوله؟" },
  ];
  return `<figure class="gvisual"><svg viewBox="0 0 720 340" role="img" aria-label="تشريح الوثيقة التاريخية أو الجغرافية: خمسة عناصر للتعريف والقراءة">
    <rect x="62" y="34" width="290" height="270" rx="12" fill="#fffdf7" stroke="#d8c9a8"/>
    <path d="M62 46a12 12 0 0112-12h266a12 12 0 0112 12v18H62z" fill="#f2e7cf"/>
    <text x="207" y="64" text-anchor="middle" class="svgb" fill="#6b5427">وثيقة للتحليل</text>
    <text x="84" y="96" class="svgl" fill="#41525a">«… مقتطف من نص أو جدول أو خريطة …»</text>
    ${[118, 142, 166, 190, 214, 238, 262]
      .map((y, i) => `<line x1="84" y1="${y}" x2="${i % 3 === 2 ? 300 : 332}" y2="${y}" stroke="#e4dccb" stroke-width="6" stroke-linecap="round"/>`)
      .join("")}
    <circle cx="306" cy="280" r="26" fill="none" stroke="#b45f7a" stroke-width="2" opacity="0.7"/>
    <text x="306" y="285" text-anchor="middle" class="svgm" fill="#8a4459">المصدر</text>
    <text x="84" y="288" class="svgm">المصدر: …</text>

    ${labels
      .map(
        (l) => `<line x1="352" y1="${l.y}" x2="398" y2="${l.y}" stroke="#b9ccd4" stroke-width="1.4" stroke-dasharray="3 3"/>
        <circle cx="414" cy="${l.y}" r="13" fill="#0f766e"/>
        <text x="414" y="${l.y + 4.5}" text-anchor="middle" class="svgw" font-size="11">${l.n}</text>
        <text x="438" y="${l.y - 2}" text-anchor="end" class="svgb">${l.text}</text>
        <text x="438" y="${l.y + 14}" text-anchor="end" class="svgm">${l.detail}</text>`,
      )
      .join("")}

    <text x="664" y="318" text-anchor="start" class="svgm">ثم: استخرج من الوثيقة حصراً، أو عرّف من المكتسبات حسب السؤال</text>
  </svg><figcaption>الخطأ الشائع: القفز إلى الاستخراج قبل تعريف الوثيقة وضبط سياقها في جملة واحدة.</figcaption></figure>`;
}

function essayPlan(): string {
  const parts = [
    { x: 44, title: "المقدمة", lines: ["تأطير: زمن + مكان + موضوع", "طرح الإشكالية", "الإعلان عن الخطة"], color: "#2f6fb3" },
    { x: 262, title: "العرض", lines: ["فقرة لكل محور", "معطيات وتواريخ ومفاهيم", "جمل انتقالية"], color: "#0e9488" },
    { x: 480, title: "الخاتمة", lines: ["استخلاص النتائج", "فتح أفق", "بلا تكرار للمقدمة"], color: "#d98a2b" },
  ];
  return `<figure class="gvisual"><svg viewBox="0 0 720 320" role="img" aria-label="تصميم المقال: مقدمة وعرض وخاتمة مع شبكة التنقيط">
    <text x="42" y="28" class="svgt" text-anchor="end">تصميم المقال في ثلاث مراحل</text>
    <text x="678" y="28" class="svgm" text-anchor="start">8 نقاط معرفة + 2 تصميم ولغة وشكل</text>
    ${parts
      .map(
        (p, i) => `<rect x="${p.x}" y="48" width="196" height="188" rx="14" fill="#fff" stroke="#dce8e5"/>
        <rect x="${p.x}" y="48" width="196" height="6" rx="3" fill="${p.color}"/>
        <circle cx="${p.x + 24}" cy="82" r="13" fill="${p.color}" opacity="0.14"/>
        <text x="${p.x + 24}" y="87" text-anchor="middle" class="svgb" fill="${p.color}">${i + 1}</text>
        <text x="${p.x + 46}" y="87" text-anchor="end" class="svgb">${p.title}</text>
        ${p.lines
          .map(
            (l, j) => `<circle cx="${p.x + 24}" cy="${116 + j * 30}" r="3" fill="${p.color}"/>
            <text x="${p.x + 36}" y="${120 + j * 30}" text-anchor="end" class="svgm">${l}</text>`,
          )
          .join("")}
        ${i < 2 ? `<path d="M${p.x + 206} 142h8" stroke="#9fb2bc" stroke-width="2"/><path d="M${p.x + 214} 142l-6-4v8z" fill="#9fb2bc"/>` : ""}`,
      )
      .join("")}
    <rect x="42" y="256" width="634" height="40" rx="10" fill="#f6fbfa" stroke="#dce8e5"/>
    <text x="60" y="281" text-anchor="end" class="svgl" fill="#0a4a45">الشكل: فقرة تبدأ بفراغ · خط واضح · لغة سليمة · تصميم 1ن · لغة 0.5ن · شكل 0.5ن</text>
  </svg><figcaption>كل محور في نص الموضوع يقابله محور في العرض؛ والمقدمة والخاتمة نقطة صريحة في الشبكة.</figcaption></figure>`;
}

function barChart(): string {
  const data = [
    { n: "الولايات المتحدة", v: 138, c: "#0e9488" },
    { n: "الصين", v: 137, c: "#2f6fb3" },
    { n: "الهند", v: 110, c: "#d98a2b" },
    { n: "فرنسا", v: 35, c: "#8a6bbf" },
    { n: "البرازيل", v: 10, c: "#b45f7a" },
  ];
  const base = 250;
  const top = 64;
  const max = 150;
  const y = (v: number) => base - (v / max) * (base - top);
  return `<figure class="gvisual"><svg viewBox="0 0 720 310" role="img" aria-label="مبيان أعمدة منفصلة لإنتاج القمح في خمس دول سنة 2023">
    <text x="64" y="28" class="svgt" text-anchor="end">إنتاج القمح سنة 2023 (مليون طن)</text>
    <text x="664" y="28" class="svgm" text-anchor="start">أعمدة منفصلة · سلّم منتظم</text>
    ${[0, 50, 100, 150]
      .map(
        (v) => `<line x1="64" y1="${y(v)}" x2="660" y2="${y(v)}" stroke="#e4eef0" stroke-width="1"/>
        <text x="58" y="${y(v) + 4}" text-anchor="end" class="svgm">${v}</text>`,
      )
      .join("")}
    <line x1="64" y1="64" x2="64" y2="250" stroke="#35566b" stroke-width="1.6"/>
    <line x1="64" y1="250" x2="668" y2="250" stroke="#35566b" stroke-width="1.6"/>
    ${data
      .map((d, i) => {
        const x = 92 + i * 116;
        return `<rect x="${x}" y="${y(d.v)}" width="62" height="${250 - y(d.v)}" rx="5" fill="${d.c}" opacity="0.9"/>
        <text x="${x + 31}" y="${y(d.v) - 8}" text-anchor="middle" class="svgb">${d.v}</text>
        <text x="${x + 31}" y="270" text-anchor="middle" class="svgm">${d.n}</text>`;
      })
      .join("")}
    <text x="16" y="160" transform="rotate(-90 16 160)" text-anchor="middle" class="svgm">مليون طن</text>
    <text x="64" y="300" text-anchor="end" class="svgm">المصدر: معطيات تدريبية — 2023</text>
  </svg><figcaption>عنصر واحد في عدة أمكنة وزمن واحد ← أعمدة بسيطة منفصلة. لاحظ الفرق بين أعلى قيمة (138) وأدناها (10).</figcaption></figure>`;
}

function pieChart(): string {
  const legend = [
    ["#2f6fb3", "الفحم", "30%"],
    ["#d98a2b", "الغاز", "25%"],
    ["#5a9e6f", "النفط", "20%"],
    ["#b45f7a", "المتجددة", "25%"],
  ];
  return `<figure class="gvisual"><svg viewBox="0 0 720 330" role="img" aria-label="مبيان دائري لبنية مزيج الطاقة">
    <text x="64" y="28" class="svgt" text-anchor="end">بنية مزيج الطاقة (مثال تدريبي)</text>
    <text x="664" y="28" class="svgm" text-anchor="start">مجموع النسب = 100%</text>
    <g transform="translate(210 175)">
      <circle r="104" fill="#fff" stroke="#e4eef0"/>
      <path d="M0 0 L0 -104 A104 104 0 0 1 98.9 32.1 Z" fill="#2f6fb3"/>
      <path d="M0 0 L98.9 32.1 A104 104 0 0 1 -32.1 98.9 Z" fill="#d98a2b"/>
      <path d="M0 0 L-32.1 98.9 A104 104 0 0 1 -104 0 Z" fill="#5a9e6f"/>
      <path d="M0 0 L-104 0 A104 104 0 0 1 0 -104 Z" fill="#b45f7a"/>
      <circle r="46" fill="#fff"/>
      <text x="0" y="-2" text-anchor="middle" class="svgb">100%</text>
      <text x="0" y="17" text-anchor="middle" class="svgm">المجموع</text>
      <text x="55" y="-40" text-anchor="middle" class="svgw" font-size="11">30%</text>
      <text x="31" y="62" text-anchor="middle" class="svgw" font-size="11">25%</text>
      <text x="-56" y="42" text-anchor="middle" class="svgw" font-size="11">20%</text>
      <text x="-48" y="-46" text-anchor="middle" class="svgw" font-size="11">25%</text>
    </g>
    ${legend
      .map(
        ([c, n, v], i) => `<rect x="390" y="${110 + i * 38}" width="18" height="18" rx="4" fill="${c}"/>
        <text x="418" y="${124 + i * 38}" text-anchor="end" class="svgl">${n}</text>
        <text x="560" y="${124 + i * 38}" text-anchor="end" class="svgb">${v}</text>`,
      )
      .join("")}
    <text x="390" y="292" text-anchor="end" class="svgm">الدائرة الكاملة: الزاوية = النسبة × 3.6</text>
  </svg><figcaption>ابدأ من أعلى الدائرة مع عقارب الساعة، وسمِّ كل قطاع، وتحقق من أن مجموع الزوايا 360°.</figcaption></figure>`;
}

function curveChart(): string {
  const pts = [
    { x: 96, v: 1, l: "1750" },
    { x: 256, v: 2.5, l: "1950" },
    { x: 430, v: 6, l: "2000" },
    { x: 590, v: 8, l: "2022" },
  ];
  const y = (v: number) => 250 - (v / 8) * 186;
  return `<figure class="gvisual"><svg viewBox="0 0 720 310" role="img" aria-label="منحنى تطور سكان العالم 1750 إلى 2022">
    <text x="64" y="28" class="svgt" text-anchor="end">تطور سكان العالم (مليار نسمة)</text>
    <text x="664" y="28" class="svgm" text-anchor="start">1750 — 2022</text>
    ${[0, 2, 4, 6, 8]
      .map(
        (v) => `<line x1="64" y1="${y(v)}" x2="660" y2="${y(v)}" stroke="#e4eef0"/>
        <text x="58" y="${y(v) + 4}" text-anchor="end" class="svgm">${v}</text>`,
      )
      .join("")}
    <line x1="64" y1="64" x2="64" y2="250" stroke="#35566b" stroke-width="1.6"/>
    <line x1="64" y1="250" x2="668" y2="250" stroke="#35566b" stroke-width="1.6"/>
    <path d="M96 250 L96 ${y(1)} L256 ${y(2.5)} L430 ${y(6)} L590 ${y(8)} L590 250 Z" fill="#0e9488" opacity="0.12"/>
    <polyline points="96,${y(1)} 256,${y(2.5)} 430,${y(6)} 590,${y(8)}" fill="none" stroke="#0e9488" stroke-width="3.2" stroke-linejoin="round"/>
    ${pts
      .map(
        (p) => `<circle cx="${p.x}" cy="${y(p.v)}" r="5.5" fill="#fff" stroke="#0e9488" stroke-width="3"/>
        <text x="${p.x}" y="${y(p.v) - 12}" text-anchor="middle" class="svgb">${p.v}</text>
        <text x="${p.x}" y="270" text-anchor="middle" class="svgm">${p.l}</text>`,
      )
      .join("")}
    <text x="16" y="160" transform="rotate(-90 16 160)" text-anchor="middle" class="svgm">مليار نسمة</text>
  </svg><figcaption>النقاط متصلة لأن الزمن متصل. اقرأ الاتجاه والانقطاعات والفترات، لا الشكل فقط.</figcaption></figure>`;
}

/* ===== رسوم مصغّرة لأنواع المبيانات — تُعرض في جدول «اختر المبيان المناسب» ===== */

export type ChartThumbKind =
  | "curve"
  | "bar"
  | "grouped"
  | "pie"
  | "half"
  | "sep"
  | "stacked"
  | "diverging"
  | "hist";

const TH_COLORS = ["#0e9488", "#2f6fb3", "#d98a2b", "#b45f7a"];

export function chartThumb(kind: ChartThumbKind): string {
  if (kind === "curve") {
    return `<svg viewBox="0 0 220 140" role="img" aria-label="رسم منحنى بياني">
      <line x1="24" y1="16" x2="24" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      <line x1="24" y1="112" x2="206" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      ${[34, 68, 102].map((y) => `<line x1="24" y1="${y}" x2="206" y2="${y}" stroke="#eef3f4"/>`).join("")}
      <path d="M30 104 C60 96 74 78 100 66 S150 40 198 26" fill="none" stroke="#0e9488" stroke-width="3" stroke-linecap="round"/>
      ${[[30, 104], [100, 66], [198, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#0e9488" stroke-width="2.6"/>`).join("")}
      <path d="M198 26l-4 8M198 26l-9 3" stroke="#0e9488" stroke-width="1.6" fill="none"/>
    </svg>`;
  }
  if (kind === "bar") {
    const bars = [
      [38, 62], [86, 88], [134, 46], [182, 74],
    ];
    return `<svg viewBox="0 0 220 140" role="img" aria-label="رسم أعمدة بياني">
      <line x1="20" y1="18" x2="20" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      <line x1="20" y1="112" x2="208" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      ${[40, 68, 96].map((y) => `<line x1="20" y1="${y}" x2="208" y2="${y}" stroke="#eef3f4"/>`).join("")}
      ${bars
        .map(
          ([x, h], i) => `<rect x="${x}" y="${112 - h}" width="24" height="${h}" rx="4" fill="${TH_COLORS[i % 4]}" opacity="0.9"/>
          <rect x="${x + 6}" y="${112 - h - 15}" width="12" height="4" rx="2" fill="#35566b" opacity="0.55"/>`,
        )
        .join("")}
    </svg>`;
  }
  if (kind === "grouped") {
    const groups = [36, 104, 172];
    return `<svg viewBox="0 0 220 140" role="img" aria-label="رسم أعمدة مزدوجة بياني">
      <line x1="20" y1="18" x2="20" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      <line x1="20" y1="112" x2="208" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      ${[40, 68, 96].map((y) => `<line x1="20" y1="${y}" x2="208" y2="${y}" stroke="#eef3f4"/>`).join("")}
      ${groups
        .map((gx, gi) => {
          const h1 = 52 + gi * 10;
          const h2 = 74 - gi * 8;
          return `<rect x="${gx}" y="${112 - h1}" width="17" height="${h1}" rx="3" fill="#0e9488" opacity="0.9"/>
          <rect x="${gx + 19}" y="${112 - h2}" width="17" height="${h2}" rx="3" fill="#2f6fb3" opacity="0.9"/>`;
        })
        .join("")}
      <rect x="140" y="14" width="12" height="9" rx="2" fill="#0e9488"/><text x="156" y="22" font-size="11" fill="#46616e">ظاهرة أ</text>
      <rect x="140" y="28" width="12" height="9" rx="2" fill="#2f6fb3"/><text x="156" y="36" font-size="11" fill="#46616e">ظاهرة ب</text>
    </svg>`;
  }
  /* ===== أمثلة أعمدة: منفصلة / متراكبة / ذات اتجاهين / متصلة ===== */
  const colAxes = `<line x1="20" y1="18" x2="20" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      <line x1="20" y1="112" x2="208" y2="112" stroke="#9fb2bc" stroke-width="1.4"/>
      ${[40, 68, 96].map((y) => `<line x1="20" y1="${y}" x2="208" y2="${y}" stroke="#eef3f4"/>`).join("")}`;
  if (kind === "sep") {
    const bars = [
      [36, 66], [84, 44], [132, 84], [180, 58],
    ];
    return `<svg viewBox="0 0 220 140" role="img" aria-label="أعمدة بسيطة منفصلة">
      ${colAxes}
      ${bars.map(([x, h]) => `<rect x="${x}" y="${112 - h}" width="26" height="${h}" rx="4" fill="#0e9488" opacity="0.85"/>`).join("")}
      <text x="112" y="132" text-anchor="middle" font-size="11" fill="#647b84">فئات متباعدة بمسافات متساوية</text>
    </svg>`;
  }
  if (kind === "stacked") {
    const groups = [
      { x: 52, a: 46, b: 30 },
      { x: 118, a: 60, b: 22 },
    ];
    return `<svg viewBox="0 0 220 140" role="img" aria-label="أعمدة متراكبة">
      ${colAxes}
      ${groups
        .map(
          (g) => `<rect x="${g.x}" y="${112 - g.a - g.b}" width="34" height="${g.b}" rx="3" fill="#2f6fb3" opacity="0.9"/>
          <rect x="${g.x}" y="${112 - g.a}" width="34" height="${g.a}" rx="3" fill="#0e9488" opacity="0.9"/>
          <rect x="${g.x}" y="${112 - g.a - g.b - 14}" width="10" height="4" rx="2" fill="#35566b" opacity="0.5"/>`,
        )
        .join("")}
      <rect x="158" y="24" width="12" height="9" rx="2" fill="#0e9488"/><text x="174" y="32" font-size="11" fill="#46616e">عنصر 1</text>
      <rect x="158" y="40" width="12" height="9" rx="2" fill="#2f6fb3"/><text x="174" y="48" font-size="11" fill="#46616e">عنصر 2</text>
    </svg>`;
  }
  if (kind === "diverging") {
    return `<svg viewBox="0 0 220 140" role="img" aria-label="أعمدة باتجاهين حول الصفر">
      <line x1="20" y1="66" x2="208" y2="66" stroke="#35566b" stroke-width="1.8"/>
      ${[40, 68, 96].map((y) => `<line x1="20" y1="${y}" x2="208" y2="${y}" stroke="#eef3f4"/>`).join("")}
      <rect x="42" y="66" width="22" height="40" rx="3" fill="#0e9488" opacity="0.85"/>
      <rect x="42" y="26" width="22" height="40" rx="3" fill="#0e9488" opacity="0.85"/>
      <rect x="90" y="66" width="22" height="30" rx="3" fill="#b45f7a" opacity="0.85"/>
      <rect x="138" y="36" width="22" height="30" rx="3" fill="#0e9488" opacity="0.85"/>
      <rect x="186" y="66" width="22" height="18" rx="3" fill="#b45f7a" opacity="0.85"/>
      <text x="112" y="60" text-anchor="middle" font-size="10" fill="#647b84">صفر</text>
      <text x="112" y="132" text-anchor="middle" font-size="11" fill="#647b84">فائض ↑ / عجز ↓</text>
    </svg>`;
  }
  if (kind === "hist") {
    const hs = [18, 30, 52, 74, 88, 74, 52, 30, 18];
    return `<svg viewBox="0 0 220 140" role="img" aria-label="مدرج تكراري بأعمدة متصلة">
      ${colAxes}
      ${hs
        .map((h, i) => `<rect x="${28 + i * 18}" y="${112 - h}" width="18" height="${h}" fill="#8a6bbf" opacity="0.75"/>`)
        .join("")}
      <path d="M28 100 C50 96 60 78 80 62 C100 46 120 44 140 52 C160 60 176 74 192 88" fill="none" stroke="#35566b" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text x="112" y="132" text-anchor="middle" font-size="11" fill="#647b84">فئات متصلة بلا فراغ</text>
    </svg>`;
  }
  if (kind === "pie" || kind === "half") {
    const half = kind === "half";
    const cx = half ? 66 : 78;
    const cy = half ? 116 : 72;
    const r = half ? 46 : 44;
    /* قطاعات: زوايا من أعلى الدائرة مع عقارب الساعة (360) أو نصف علوي (180) */
    const fr = half ? [0.4, 0.3, 0.3] : [0.3, 0.25, 0.2, 0.25];
    const ptAt = (f: number) => {
      if (half) {
        const ang = Math.PI - f * Math.PI; // من اليسار فوق القوس إلى اليمين
        return [cx + r * Math.cos(ang), cy - r * Math.sin(ang)];
      }
      const ang = -Math.PI / 2 + f * Math.PI * 2;
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
    };
    let acc = 0;
    const sectors = fr.map((f, i) => {
      const a = ptAt(acc);
      acc += f;
      const b = ptAt(acc);
      const large = f > 0.5 ? 1 : 0;
      return `<path d="M${cx} ${cy}L${a[0].toFixed(1)} ${a[1].toFixed(1)}A${r} ${r} 0 ${large} 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}Z" fill="${TH_COLORS[i % 4]}" opacity="0.9"/>`;
    });
    const legend = fr
      .map((f, i) => {
        const ly = 34 + i * 26;
        return `<rect x="150" y="${ly}" width="13" height="13" rx="3" fill="${TH_COLORS[i % 4]}"/>
        <text x="170" y="${ly + 11}" font-size="12" fill="#46616e">${Math.round(f * 100)}%</text>`;
      })
      .join("");
    return `<svg viewBox="0 0 220 140" role="img" aria-label="رسم دائري أو نصف دائري بياني">
      ${half ? `<line x1="${cx - r - 4}" y1="${cy}" x2="${cx + r + 4}" y2="${cy}" stroke="#9fb2bc" stroke-width="1.4"/>` : ""}
      ${sectors.join("")}
      ${legend}
    </svg>`;
  }
  return "";
}

export function visualHTML(kind: VisualKind): string {
  if (kind === "timeline") return timeline();
  if (kind === "map") return moroccoMap();
  if (kind === "doc") return documentAnatomy();
  if (kind === "essay") return essayPlan();
  if (kind === "bar") return barChart();
  if (kind === "pie") return pieChart();
  return curveChart();
}
