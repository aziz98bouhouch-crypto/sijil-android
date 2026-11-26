/** رسوم توضيحية للمنهجيات — SVG خفيف بلا صور خارجية */

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
  const outline =
    "M262 46 L300 38 L330 52 L352 44 L372 58 L410 54 L436 70 L470 66 L500 84 L534 78 L548 100 L530 118 L548 140 L536 162 L556 186 L548 214 L566 244 L548 274 L552 306 L522 334 L482 346 L440 338 L404 352 L368 338 L334 352 L300 338 L268 346 L242 318 L230 288 L210 262 L196 232 L204 204 L186 180 L196 152 L182 128 L200 104 L196 82 L224 66 Z";
  const north =
    "M196 82 L224 66 L262 46 L330 52 L372 58 L410 54 L436 70 L470 66 L500 84 L534 78 L548 100 L530 118 L548 140 L536 162 L500 150 L460 160 L420 140 L380 150 L340 130 L300 140 L260 120 L220 130 L196 152 L182 128 L200 104 Z";
  const center =
    "M220 130 L260 120 L300 140 L340 130 L380 150 L420 140 L460 160 L500 150 L536 162 L556 186 L548 214 L520 210 L480 230 L440 214 L400 230 L360 216 L320 230 L280 214 L240 224 L204 204 L186 180 L196 152 Z";
  const cities = [
    { x: 300, y: 72, name: "طنجة", side: "end" },
    { x: 250, y: 148, name: "الرباط", side: "start" },
    { x: 232, y: 172, name: "الدار البيضاء", side: "start" },
    { x: 300, y: 208, name: "مراكش", side: "end" },
    { x: 252, y: 258, name: "أكادير", side: "start" },
    { x: 280, y: 318, name: "العيون", side: "end" },
  ];
  return `<figure class="gvisual"><svg viewBox="0 0 720 400" role="img" aria-label="خريطة تخطيطية للمغرب مع مفتاح ومقياس واتجاه الشمال">
    <defs>
      <clipPath id="maClip"><path d="${outline}"/></clipPath>
      <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#eaf5f9"/><stop offset="1" stop-color="#f8fcfd"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="720" height="400" fill="url(#sea)"/>
    <text x="64" y="30" class="svgt" text-anchor="end">المغرب: تركز الساكنة والأنشطة</text>
    <text x="664" y="30" class="svgm" text-anchor="start">خريطة تخطيطية للقراءة لا للحدود</text>

    <path d="${outline}" fill="#f3ead8" stroke="#6f8792" stroke-width="2"/>
    <g clip-path="url(#maClip)">
      <path d="${north}" fill="#9cc9dd" opacity="0.75"/>
      <path d="${center}" fill="#ecd7a8" opacity="0.85"/>
      <path d="M230 288 L268 346 L300 338 L334 352 L368 338 L404 352 L440 338 L482 346 L522 334 L552 306 L548 274 L566 244 L548 214 L520 210 L480 230 L440 214 L400 230 L360 216 L320 230 L280 214 L240 224 L204 204 L196 232 L210 262 L230 288 Z" fill="#f0d9b1" opacity="0.6"/>
      <path d="M232 172 L300 208 L340 250 L300 300 L260 330 L230 288 L210 262 L196 232 L204 204 L220 190 Z" fill="#d7e8d2" opacity="0.85"/>
    </g>

    <path d="M300 72 L470 110" stroke="#b9ccd4" stroke-width="1" stroke-dasharray="2 3"/>
    <text x="480" y="108" class="svgm" text-anchor="end">تركز ساحلي</text>
    <text x="388" y="262" class="svgm" text-anchor="middle">كثافة ضعيفة</text>

    ${cities
      .map(
        (c) => `<circle cx="${c.x}" cy="${c.y}" r="4.5" fill="#0f766e" stroke="#fff" stroke-width="2"/>
        <text x="${c.x + (c.side === "end" ? 10 : -10)}" y="${c.y + 4}" text-anchor="${c.side}" class="svgl" fill="#17454a">${c.name}</text>`,
      )
      .join("")}

    <g transform="translate(626 62)">
      <circle cx="0" cy="0" r="27" fill="#fff" stroke="#35566b" stroke-width="1.6"/>
      <path d="M0 -20l8 27-8-6-8 6z" fill="#b45f7a"/>
      <text x="0" y="42" text-anchor="middle" class="svgm">الشمال</text>
    </g>

    <rect x="562" y="268" width="146" height="118" rx="10" fill="#fff" stroke="#d6e4e8"/>
    <text x="700" y="288" text-anchor="start" class="svgb">المفتاح</text>
    <rect x="686" y="298" width="14" height="12" fill="#9cc9dd"/><text x="678" y="309" text-anchor="start" class="svgm">مجال ساحلي</text>
    <rect x="686" y="320" width="14" height="12" fill="#ecd7a8"/><text x="678" y="331" text-anchor="start" class="svgm">سهول داخلية</text>
    <rect x="686" y="342" width="14" height="12" fill="#d7e8d2"/><text x="678" y="353" text-anchor="start" class="svgm">مجال جبلي</text>
    <rect x="686" y="364" width="14" height="12" fill="#f0d9b1"/><text x="678" y="375" text-anchor="start" class="svgm">مجال صحراوي</text>

    <g transform="translate(62 356)">
      <line x1="0" y1="0" x2="120" y2="0" stroke="#35566b" stroke-width="2"/>
      <line x1="0" y1="-5" x2="0" y2="5" stroke="#35566b" stroke-width="1.4"/>
      <line x1="60" y1="-4" x2="60" y2="4" stroke="#35566b" stroke-width="1.2"/>
      <line x1="120" y1="-5" x2="120" y2="5" stroke="#35566b" stroke-width="1.4"/>
      <text x="60" y="18" text-anchor="middle" class="svgm">0 — 250 — 500 كم</text>
    </g>
  </svg><figcaption>لا تُقرأ الخريطة دون عنوان ومفتاح ومقياس واتجاه شمال. صف التركز ثم الامتداد ثم فسّر بالمناخ والتضاريس والسواحل والأنشطة.</figcaption></figure>`;
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
        <text x="56" y="${y(v) + 4}" text-anchor="start" class="svgm">${v}</text>`,
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
      <path d="M0 0 L0 -104 A104 104 0 0 1 98.9 -32.1 Z" fill="#2f6fb3"/>
      <path d="M0 0 L98.9 -32.1 A104 104 0 0 1 61.1 84.1 Z" fill="#d98a2b"/>
      <path d="M0 0 L61.1 84.1 A104 104 0 0 1 -83.3 62.2 Z" fill="#5a9e6f"/>
      <path d="M0 0 L-83.3 62.2 A104 104 0 0 1 0 -104 Z" fill="#b45f7a"/>
      <circle r="46" fill="#fff"/>
      <text x="0" y="-2" text-anchor="middle" class="svgb">100%</text>
      <text x="0" y="17" text-anchor="middle" class="svgm">المجموع</text>
      <text x="0" y="-78" text-anchor="middle" class="svgw" font-size="11">30%</text>
      <text x="74" y="-4" text-anchor="middle" class="svgw" font-size="11">25%</text>
      <text x="48" y="66" text-anchor="middle" class="svgw" font-size="11">20%</text>
      <text x="-66" y="48" text-anchor="middle" class="svgw" font-size="11">25%</text>
    </g>
    ${legend
      .map(
        ([c, n, v], i) => `<rect x="390" y="${110 + i * 38}" width="18" height="18" rx="4" fill="${c}"/>
        <text x="418" y="${124 + i * 38}" text-anchor="end" class="svgl">${n}</text>
        <text x="560" y="${124 + i * 38}" text-anchor="end" class="svgb">${v}</text>`,
      )
      .join("")}
    <text x="390" y="292" text-anchor="end" class="svgm">نصف الدائرة: الزاوية = النسبة × 1.8</text>
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
        <text x="56" y="${y(v) + 4}" text-anchor="start" class="svgm">${v}</text>`,
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

export function visualHTML(kind: VisualKind): string {
  if (kind === "timeline") return timeline();
  if (kind === "map") return moroccoMap();
  if (kind === "doc") return documentAnatomy();
  if (kind === "essay") return essayPlan();
  if (kind === "bar") return barChart();
  if (kind === "pie") return pieChart();
  return curveChart();
}
