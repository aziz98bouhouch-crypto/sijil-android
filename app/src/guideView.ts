/** عرض صفحات الدليل المنهجي: فهرس، صفحة مجال، واختبار تطبيقي لكل مادة */

import { TOPICS, SUBJECTS, TESTS, RUBRIC_3_7, type GuideTopic } from "./guide";
import { icon } from "./icons";

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const subjectName = (subject: string) => (subject === "history" ? "التاريخ" : "الجغرافيا");
const subjectClass = (subject: string) => (subject === "history" ? "hist" : "geo");

/** رسوم توضيحية مدمجة (SVG) ترافق كل منهجية */
function visualHTML(kind: "timeline" | "map" | "bar" | "pie" | "curve"): string {
  if (kind === "timeline") {
    const ev = [
      { y: 1912, x: 50, t: "الحماية", up: true },
      { y: 1930, x: 279, t: "الظهير البربري", up: false },
      { y: 1944, x: 457, t: "وثيقة الاستقلال", up: true },
      { y: 1956, x: 610, t: "الاستقلال", up: false },
    ];
    return `<figure class="gvisual"><svg viewBox="0 0 660 190" role="img" aria-label="خط زمني من 1912 إلى 1956">
      <line x1="40" y1="95" x2="625" y2="95" stroke="#35566b" stroke-width="3" stroke-linecap="round"/>
      <path d="M625 95l-12-6v12z" fill="#35566b"/>
      ${ev
        .map(
          (e) => `<line x1="${e.x}" y1="86" x2="${e.x}" y2="104" stroke="#35566b" stroke-width="2"/>
        <circle cx="${e.x}" cy="95" r="6" fill="#fff" stroke="#2f6fb3" stroke-width="3"/>
        <text x="${e.x}" y="${e.up ? 70 : 124}" text-anchor="middle" class="svgb">${e.y}</text>
        <text x="${e.x}" y="${e.up ? 52 : 142}" text-anchor="middle" class="svgs">${e.t}</text>`,
        )
        .join("")}
      <path d="M50 160v8h560v-8" fill="none" stroke="#b45f7a" stroke-width="2"/>
      <text x="330" y="184" text-anchor="middle" class="svgs" fill="#8a4459">المدة: 1956 − 1912 = 44 سنة</text>
    </svg><figcaption>المسافات بين المحطات تعكس المدد الحقيقية، لا تباعداً اعتباطياً.</figcaption></figure>`;
  }

  if (kind === "bar") {
    const bars = [
      { n: "المغرب", v: 20, x: 95, c: "#2f6fb3" },
      { n: "الجزائر", v: 35, x: 190, c: "#d98a2b" },
      { n: "تونس", v: 15, x: 285, c: "#5a9e6f" },
      { n: "ليبيا", v: 45, x: 380, c: "#b45f7a" },
    ];
    return `<figure class="gvisual"><svg viewBox="0 0 520 220" role="img" aria-label="مبيان أعمدة للمقارنة">
      <text x="62" y="16" class="svgs">إنتاج القمح (مليون طن) — مثال تدريبي</text>
      ${[0, 15, 30, 45]
        .map((v) => `<line x1="60" y1="${180 - v * 3.2}" x2="470" y2="${180 - v * 3.2}" stroke="#dce6ea" stroke-width="1"/>
        <text x="52" y="${184 - v * 3.2}" text-anchor="end" class="svgs">${v}</text>`)
        .join("")}
      <line x1="60" y1="20" x2="60" y2="180" stroke="#35566b" stroke-width="2"/>
      <line x1="60" y1="180" x2="478" y2="180" stroke="#35566b" stroke-width="2"/>
      ${bars
        .map(
          (b) => `<rect x="${b.x}" y="${180 - b.v * 3.2}" width="56" height="${b.v * 3.2}" rx="3" fill="${b.c}"/>
          <text x="${b.x + 28}" y="${174 - b.v * 3.2}" text-anchor="middle" class="svgb">${b.v}</text>
          <text x="${b.x + 28}" y="198" text-anchor="middle" class="svgs">${b.n}</text>`,
        )
        .join("")}
      <text x="16" y="105" transform="rotate(-90 16 105)" text-anchor="middle" class="svgs">القيمة</text>
    </svg><figcaption>أعمدة متساوية العرض، سلّم منتظم، ووحدة معلنة على المحور.</figcaption></figure>`;
  }

  if (kind === "pie") {
    return `<figure class="gvisual"><svg viewBox="0 0 520 240" role="img" aria-label="مبيان دائري للنسب">
      <path d="M150 120 L150 42 A78 78 0 0 1 224.2 144.1 Z" fill="#2f6fb3"/>
      <path d="M150 120 L224.2 144.1 A78 78 0 0 1 125.9 194.2 Z" fill="#d98a2b"/>
      <path d="M150 120 L125.9 194.2 A78 78 0 0 1 72 120 Z" fill="#5a9e6f"/>
      <path d="M150 120 L72 120 A78 78 0 0 1 150 42 Z" fill="#b45f7a"/>
      <text x="190" y="91" text-anchor="middle" class="svgw">30%</text>
      <text x="175" y="166" text-anchor="middle" class="svgw">25%</text>
      <text x="98" y="152" text-anchor="middle" class="svgw">20%</text>
      <text x="112" y="88" text-anchor="middle" class="svgw">25%</text>
      ${[
        ["#2f6fb3", "الفحم", "30%"],
        ["#d98a2b", "الغاز", "25%"],
        ["#5a9e6f", "النفط", "20%"],
        ["#b45f7a", "المتجددة", "25%"],
      ]
        .map(
          ([c, n, v], i) => `<rect x="300" y="${72 + i * 34}" width="16" height="16" rx="3" fill="${c}"/>
          <text x="326" y="${85 + i * 34}" class="svgs">${n}</text>
          <text x="430" y="${85 + i * 34}" class="svgb">${v}</text>`,
        )
        .join("")}
      <text x="300" y="232" class="svgs" fill="#6b7d88">المجموع = 100% — مثال تدريبي</text>
    </svg><figcaption>كل نسبة تُحوَّل إلى زاوية: النسبة × 3.6 في الدائرة، و× 1.8 في نصف الدائرة.</figcaption></figure>`;
  }

  if (kind === "curve") {
    const pts = [
      { x: 90, y: 169, v: "1", l: "1750" },
      { x: 210, y: 145, v: "2,5", l: "1950" },
      { x: 330, y: 89, v: "6", l: "2000" },
      { x: 450, y: 57, v: "8", l: "2022" },
    ];
    return `<figure class="gvisual"><svg viewBox="0 0 520 230" role="img" aria-label="منحنى تطور سكان العالم">
      <text x="62" y="16" class="svgs">سكان العالم (مليار نسمة) — مثال تدريبي</text>
      ${[0, 2, 4, 6, 8]
        .map((v) => `<line x1="60" y1="${185 - v * 16}" x2="480" y2="${185 - v * 16}" stroke="#dce6ea"/>
        <text x="52" y="${189 - v * 16}" text-anchor="end" class="svgs">${v}</text>`)
        .join("")}
      <line x1="60" y1="25" x2="60" y2="185" stroke="#35566b" stroke-width="2"/>
      <line x1="60" y1="185" x2="488" y2="185" stroke="#35566b" stroke-width="2"/>
      <path d="M90 185 L90 169 L210 145 L330 89 L450 57 L450 185 Z" fill="#2f6fb3" opacity=".10"/>
      <polyline points="90,169 210,145 330,89 450,57" fill="none" stroke="#2f6fb3" stroke-width="3" stroke-linejoin="round"/>
      ${pts
        .map(
          (p) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="#2f6fb3" stroke-width="3"/>
          <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" class="svgb">${p.v}</text>
          <text x="${p.x}" y="204" text-anchor="middle" class="svgs">${p.l}</text>`,
        )
        .join("")}
    </svg><figcaption>نقاط متصلة بخط؛ يُقرأ الاتجاه والفترات والانقطاعات، لا الشكل فقط.</figcaption></figure>`;
  }

  return `<figure class="gvisual"><svg viewBox="0 0 640 260" role="img" aria-label="عناصر قراءة الخريطة">
    <rect width="640" height="260" fill="#e9f4f7"/>
    <path d="M40 88 L120 48 L230 40 L320 62 L400 52 L470 78 L500 130 L450 190 L340 208 L220 200 L110 176 L52 140 Z" fill="#f5f1e4" stroke="#7d8f99" stroke-width="2"/>
    <path d="M300 58 L400 54 L470 82 L480 130 L420 152 L350 140 L318 104 Z" fill="#9cc3dd"/>
    <path d="M300 120 L350 140 L420 152 L400 196 L310 202 L250 170 L260 132 Z" fill="#e7b87a"/>
    <path d="M70 106 L170 72 L260 90 L262 138 L190 172 L104 160 L58 138 Z" fill="#a9cfa6"/>
    <text x="390" y="100" text-anchor="middle" class="svgb">1</text>
    <text x="340" y="174" text-anchor="middle" class="svgb">2</text>
    <text x="160" y="124" text-anchor="middle" class="svgb">3</text>
    <circle cx="585" cy="50" r="26" fill="#fff" stroke="#35566b" stroke-width="2"/>
    <path d="M585 32l7 22-7-5-7 5z" fill="#b45f7a"/>
    <text x="585" y="94" text-anchor="middle" class="svgs">الشمال</text>
    <rect x="492" y="112" width="136" height="112" rx="6" fill="#fff" stroke="#c7d5db"/>
    <text x="616" y="132" text-anchor="end" class="svgb">المفتاح</text>
    <rect x="598" y="144" width="12" height="12" fill="#9cc3dd"/><text x="590" y="154" text-anchor="end" class="svgs">صناعة</text>
    <rect x="598" y="166" width="12" height="12" fill="#e7b87a"/><text x="590" y="176" text-anchor="end" class="svgs">فلاحة</text>
    <rect x="598" y="188" width="12" height="12" fill="#a9cfa6"/><text x="590" y="198" text-anchor="end" class="svgs">رعي</text>
    <line x1="52" y1="232" x2="172" y2="232" stroke="#35566b" stroke-width="3"/>
    <line x1="52" y1="226" x2="52" y2="238" stroke="#35566b" stroke-width="2"/>
    <line x1="112" y1="228" x2="112" y2="236" stroke="#35566b" stroke-width="2"/>
    <line x1="172" y1="226" x2="172" y2="238" stroke="#35566b" stroke-width="2"/>
    <text x="112" y="252" text-anchor="middle" class="svgs">0 — 500 — 1000 كم</text>
    <text x="300" y="240" text-anchor="middle" class="svgs" fill="#6b7d88">عنوان الخريطة + المفتاح + المقياس + اتجاه الشمال</text>
  </svg><figcaption>لا تُقرأ الخريطة دون عنوان ومفتاح ومقياس واتجاه شمال.</figcaption></figure>`;
}

function card(t: GuideTopic): string {
  return `<a class="gcard" href="#/guide/${t.id}">
    <span class="gicon">${icon(t.icon)}</span>
    <b>${esc(t.title)}</b>
    <small>${esc(t.tagline)}</small>
    <span class="gmore">افتح الصفحة ←</span>
  </a>`;
}

export function guideIndexView(): string {
  return `<h1 class="page">الدليل المنهجي</h1>
  <p class="lead">كل مجال منهجي في صفحة مستقلة. اختر المادة ثم المجال، واشتغل على الخطوات والمثال والتمارين، ثم اختبر نفسك في الاختبار التطبيقي لكل مادة.</p>
  <p class="muted small">مستند إلى دليل «مرشدي في التاريخ والجغرافيا» (2020)، والإطار المرجعي المغربي، والكتاب المدرسي.</p>
  ${SUBJECTS.map((s) => {
    const topics = TOPICS.filter((t) => t.subject === s.id);
    return `<h2 class="sec">${esc(s.name)}</h2>
      <p class="lead">${esc(s.intro)}</p>
      <div class="guide-grid">${topics.map(card).join("")}</div>
      ${s.id === "geography" ? `<div class="guide-grid maps-teaser"><a class="gcard mapcard" href="#/maps"><span class="gicon">${icon("target")}</span><b>تمارين التوطين التفاعلي</b><small>خمس خرائط: اضغط على المجال الصحيح ويصحح لك الخطأ فوراً.</small><span class="gmore">افتح الخرائط ←</span></a></div>` : ""}
      <div class="row"><a class="btn" href="#/guide/test/${s.id}">${icon("check")} اختبار تطبيقي في ${esc(s.name)}</a></div>`;
  }).join("")}
  <section class="panel">
    <h2>${icon("chart")} شبكة تنقيط الاشتغال على الوثائق 3 + 7</h2>
    <div class="tablewrap"><table class="mtable"><thead><tr><th>المحور</th><th>النقط</th><th>في التاريخ</th><th>في الجغرافيا</th></tr></thead>
    <tbody>${RUBRIC_3_7.map(
      (r) =>
        `<tr><th>${esc(r.axis)}</th><td class="c"><b>${r.points}</b></td><td>${esc(r.history)}</td><td>${esc(r.geography)}</td></tr>`,
    ).join("")}</tbody></table></div>
    <p class="muted small">الشبكة خاصة بأسئلة الوثائق؛ للمقال معاييره (الفهم، الاستثمار، المفاهيم، البنية، اللغة، التركيب).</p>
  </section>`;
}

function exercisesHTML(t: GuideTopic): string {
  return t.exercises
    .map(
      (ex) => `<div class="qbox" data-answer="${ex.answer}" data-explain="${esc(ex.explain)}">
        <p class="qstem">${esc(ex.q)}</p>
        <div class="qopts">${ex.options
          .map((o, i) => `<button class="qopt" data-i="${i}">${esc(o)}</button>`)
          .join("")}</div>
        <p class="qfb" hidden></p>
      </div>`,
    )
    .join("");
}

export function guideTopicView(id: string): string {
  const topic = TOPICS.find((t) => t.id === id);
  if (!topic) {
    return `<div class="note">هذا المجال غير موجود. <a href="#/guide">رجوع إلى الدليل</a></div>`;
  }
  const siblings = TOPICS.filter((t) => t.subject === topic.subject);
  const idx = siblings.findIndex((t) => t.id === topic.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return `<a class="back" href="#/guide">${icon("arrow")} الدليل المنهجي</a>
  <div class="ghead">
    <span class="tag ${subjectClass(topic.subject)}">${subjectName(topic.subject)}</span>
    <h1 class="page">${esc(topic.title)}</h1>
    <p class="lead">${esc(topic.intro)}</p>
  </div>
  <section class="panel">
    <h2>${icon(topic.icon)} خطوات الاشتغال</h2>
    <div class="steps">${topic.steps
      .map((s) => `<div class="step"><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div>`)
      .join("")}</div>
  </section>
  ${topic.visual ? `<section class="panel"><h2>${icon("chart")} صورة توضيحية</h2>${visualHTML(topic.visual)}</section>` : ""}
  <section class="panel example">
    <h2>${icon("spark")} ${esc(topic.example.title)}</h2>
    <p class="ex-prompt">${esc(topic.example.prompt)}</p>
    <details class="solution">
      <summary>اعرض الحل النموذجي</summary>
      <p>${esc(topic.example.solution)}</p>
    </details>
    ${topic.id === "geo-map" ? `<div class="row"><a class="btn" href="#/maps">${icon("target")} ابدأ تمارين التوطين التفاعلي</a></div>` : ""}
  </section>
  <section class="panel">
    <h2>${icon("pencil")} تمرين تطبيقي</h2>
    <p class="muted small">اختر الجواب؛ سيظهر التصحيح والشرح فوراً.</p>
    ${exercisesHTML(topic)}
  </section>
  <section class="panel">
    <h2>${icon("alert")} أخطاء شائعة</h2>
    <ul class="bullets bad">${topic.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </section>
  <div class="row gnav">
    ${prev ? `<a class="btn ghost" href="#/guide/${prev.id}">${icon("arrow")} ${esc(prev.title)}</a>` : ""}
    ${next ? `<a class="btn ghost" href="#/guide/${next.id}">${esc(next.title)} ${icon("arrow")}</a>` : ""}
  </div>`;
}

export function guideTestView(subject: string): string {
  const key = subject === "geography" ? "geography" : "history";
  const test = TESTS[key];
  return `<a class="back" href="#/guide">${icon("arrow")} الدليل المنهجي</a>
  <span class="tag ${subjectClass(key)}">${subjectName(key)}</span>
  <h1 class="page">${esc(test.title)}</h1>
  <p class="lead">${esc(test.intro)}</p>
  <div id="test">
    ${test.questions
      .map(
        (q, i) => `<div class="tq" data-answer="${q.answer}" data-explain="${esc(q.explain)}">
          <p class="qstem"><b>${i + 1}.</b> ${esc(q.q)}</p>
          <div class="qopts">${q.options
            .map((o, j) => `<button class="qopt topt" data-q="${i}" data-i="${j}">${esc(o)}</button>`)
            .join("")}</div>
          <p class="texp" hidden></p>
        </div>`,
      )
      .join("")}
  </div>
  <div class="row"><button class="btn" id="checktest">${icon("check")} صحح الاختبار</button>
    <a class="btn ghost" href="#/guide/test/${key === "history" ? "geography" : "history"}">اختبار المادة الأخرى</a></div>
  <div id="testresult" class="testresult" hidden></div>`;
}

export function bindGuide(): void {
  document.querySelectorAll<HTMLElement>(".qbox").forEach((box) => {
    const opts = [...box.querySelectorAll<HTMLButtonElement>(".qopt")];
    opts.forEach((btn) =>
      btn.addEventListener("click", () => {
        if (box.classList.contains("done")) return;
        box.classList.add("done");
        const correct = Number(box.dataset.answer);
        const chosen = Number(btn.dataset.i);
        opts.forEach((b, i) => {
          b.disabled = true;
          if (i === correct) b.classList.add("good");
        });
        if (chosen !== correct) btn.classList.add("bad");
        const fb = box.querySelector<HTMLElement>(".qfb");
        if (fb) {
          fb.hidden = false;
          fb.textContent = (chosen === correct ? "إجابة صحيحة. " : "إجابة غير صحيحة. ") + (box.dataset.explain ?? "");
        }
      }),
    );
  });

  const test = document.getElementById("test");
  if (!test) return;
  const picked = new Map<number, number>();
  test.querySelectorAll<HTMLButtonElement>(".topt").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (test.classList.contains("checked")) return;
      const q = Number(btn.dataset.q);
      picked.set(q, Number(btn.dataset.i));
      test.querySelectorAll(`.topt[data-q="${q}"]`).forEach((b) => b.classList.remove("picked"));
      btn.classList.add("picked");
    });
  });

  document.getElementById("checktest")?.addEventListener("click", () => {
    if (test.classList.contains("checked")) return;
    test.classList.add("checked");
    let score = 0;
    const qs = [...test.querySelectorAll<HTMLElement>(".tq")];
    qs.forEach((el, idx) => {
      const ans = Number(el.dataset.answer);
      const pick = picked.get(idx);
      if (pick === ans) score++;
      el.querySelectorAll<HTMLButtonElement>(".topt").forEach((b, i) => {
        b.disabled = true;
        if (i === ans) b.classList.add("good");
        if (pick === i && pick !== ans) b.classList.add("bad");
      });
      const exp = el.querySelector<HTMLElement>(".texp");
      if (exp) {
        exp.hidden = false;
        exp.textContent = (pick === ans ? "✔ " : "✘ ") + (el.dataset.explain ?? "");
      }
    });
    const res = document.getElementById("testresult");
    if (res) {
      const pct = Math.round((score / qs.length) * 100);
      res.hidden = false;
      res.className = "testresult " + (pct >= 80 ? "ok" : pct >= 50 ? "mid" : "low");
      res.textContent = `النتيجة: ${score} من ${qs.length} (${pct}%). ${
        pct >= 80 ? "ممتاز، واصل." : pct >= 50 ? "مقبول، راجع الأسئلة الخاطئة." : "أعد قراءة صفحات الدليل ثم أعد الاختبار."
      }`;
    }
  });
}
