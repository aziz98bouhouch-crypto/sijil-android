/** عرض صفحات الدليل المنهجي: فهرس، صفحة مجال، واختبار تطبيقي لكل مادة */

import {
  TOPICS,
  SUBJECTS,
  TESTS,
  RUBRIC_3_7,
  GOLDEN_RULES,
  CHART_TYPES,
  CONCEPTS,
  type AnswerSource,
  type DocApplication,
  type GuideScorePart,
  type EssayStage,
  type ModelEssay,
  type GuideSkill,
  type GuideTopic,
} from "./guide";
import { icon } from "./icons";
import { visualHTML, type VisualKind } from "./visuals";
import {
  CHART_DIMENSIONS,
  COLUMN_RULES,
  CHART_APPLICATIONS,
  CHART_CHECKLIST,
} from "./chartGuide";

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const subjectName = (subject: string) => (subject === "history" ? "التاريخ" : "الجغرافيا");
const subjectClass = (subject: string) => (subject === "history" ? "hist" : "geo");

/** تسمية مرجعية الإجابة */
const srcLabel: Record<AnswerSource, string> = {
  docs: "من الوثائق حصراً",
  acquired: "من المكتسبات",
  both: "الوثائق + المكتسبات",
};

function skillsHTML(skills: GuideSkill[]): string {
  return `<div class="tablewrap"><table class="mtable skills">
    <thead><tr><th>المهارة / السؤال المنهجي</th><th>الوثائق التي تهمها</th><th>مرجعية الإجابة والضوابط</th></tr></thead>
    <tbody>${skills
      .map(
        (s) => `<tr><th>${esc(s.skill)}</th><td>${esc(s.docs)}</td><td><span class="src src-${s.source}">${esc(
          srcLabel[s.source],
        )}</span>${esc(s.rule)}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
}

function applicationHTML(app: DocApplication): string {
  return `<p class="muted small">${esc(app.title)}</p>
  <div class="docapp">${app.documents
    .map((d) => `<article class="doc"><b>${esc(d.label)}</b><p>${esc(d.text)}</p></article>`)
    .join("")}</div>
  <h3 class="minihead">الأسئلة وعناصر الإجابة المصححة</h3>
  <div class="qa">${app.questions
    .map(
      (q) => `<details class="qaitem"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`,
    )
    .join("")}</div>`;
}

function scoringHTML(parts: GuideScorePart[]): string {
  return `<div class="scoregrid">${parts
    .map(
      (p) => `<div class="scorecard"><div class="scorehead"><b>${esc(p.part)}</b><span>${esc(
        p.points,
      )}</span></div><ul class="bullets">${p.criteria.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>`,
    )
    .join("")}</div>`;
}

function structureHTML(rows: EssayStage[]): string {
  return `<div class="tablewrap"><table class="mtable"><thead><tr><th>المرحلة</th><th>في التاريخ</th><th>في الجغرافيا</th></tr></thead>
  <tbody>${rows
    .map(
      (r) => `<tr><th>${esc(r.stage)}</th><td>${esc(r.history)}</td><td>${esc(r.geography)}</td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function modelHTML(m: ModelEssay): string {
  return `<p class="ex-prompt">${esc(m.prompt)}</p>
  <details class="solution"><summary>اعرض النموذج المصحح كاملاً</summary>
  <div class="modelessay">${m.sections
    .map((s) => `<p><b>${esc(s.label)}:</b> ${esc(s.text)}</p>`)
    .join("")}</div></details>`;
}

function chartTypesHTML(): string {
  return `<div class="tablewrap"><table class="mtable"><thead><tr><th>نوع المبيان</th><th>متى يُستعمل؟</th><th>الضوابط</th></tr></thead>
  <tbody>${CHART_TYPES.map(
    (c) => `<tr><th>${esc(c.type)}</th><td>${esc(c.when)}</td><td>${esc(c.rules)}</td></tr>`,
  ).join("")}</tbody></table></div>`;
}

function conceptsHTML(subject: GuideTopic["subject"]): string {
  const rows = CONCEPTS.filter((c) => c.subject === subject);
  return `<div class="tablewrap"><table class="mtable"><thead><tr><th>المفهوم / المصطلح</th><th>التعريف الدقيق وفق الإطار المرجعي</th></tr></thead>
  <tbody>${rows.map((c) => `<tr><th>${esc(c.term)}</th><td>${esc(c.def)}</td></tr>`).join("")}</tbody></table></div>`;
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
  ${SUBJECTS.map((s) => {
    const topics = TOPICS.filter((t) => t.subject === s.id);
    return `<h2 class="sec">${esc(s.name)}</h2>
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
    <p class="muted small">الشبكة خاصة بأسئلة الوثائق؛ للمقال شبكة 8 + 2 نقطة (تصميم 1، لغة 0.5، شكل 0.5). <a href="#/guide/hist-essay">اطّلع على شبكة المقال</a>.</p>
  </section>
  <section class="panel">
    <h2>${icon("alert")} الضوابط المنهجية الذهبية</h2>
    <div class="rules">${GOLDEN_RULES.map(
      (r) => `<div class="rule"><b>${esc(r.title)}</b><p>${esc(r.text)}</p></div>`,
    ).join("")}</div>
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

function chartDimensionsHTML(): string {
  return `<div class="dim-grid">${CHART_DIMENSIONS.map(
    (d, i) => `<div class="dim-card"><span class="dim-n">${i + 1}</span><b>${esc(
      d.key,
    )}</b><p>${esc(d.question)}</p><small>${esc(d.detail)}</small></div>`,
  ).join("")}</div>`;
}

function columnRulesHTML(): string {
  return `<div class="tablewrap"><table class="mtable"><thead><tr><th>تركيبة الجدول (عنصر / مكان / زمن)</th><th>نوع المبيان الأنسب</th><th>التمثيل الهندسي</th></tr></thead>
  <tbody>${COLUMN_RULES.map(
    (r) => `<tr><th>${esc(r.case)}</th><td><span class="src src-both">${esc(r.kind)}</span></td><td>${esc(r.shape)}</td></tr>`,
  ).join("")}</tbody></table></div>`;
}

function chartApplicationsHTML(): string {
  return `<div class="chartapps">${CHART_APPLICATIONS.map(
    (a, i) => `<details class="chartapp"${i === 0 ? " open" : ""}>
      <summary><span class="src src-acquired">${esc(a.type)}</span><b>${esc(a.title)}</b></summary>
      <div class="tablewrap"><table class="mtable chart-table"><thead><tr>${a.headers
        .map((h) => `<th>${esc(h)}</th>`)
        .join("")}</tr></thead><tbody>${a.rows
        .map(
          (row) =>
            `<tr>${row.map((c, j) => (j === 0 ? `<th>${esc(c)}</th>` : `<td class="c">${esc(c)}</td>`)).join("")}</tr>`,
        )
        .join("")}</tbody></table></div>
      <p class="chart-reason"><b>التعليل المنهجي:</b> ${esc(a.reason)}</p>
      <p class="chart-desc"><b>الوصف الجغرافي (عام ← جزئي في فقرة):</b> ${esc(a.description)}</p>
    </details>`,
  ).join("")}</div>`;
}

function chartChecklistHTML(): string {
  return `<div class="tablewrap"><table class="mtable"><thead><tr><th>العنصر</th><th>المواصفات المطلوبة</th></tr></thead>
  <tbody>${CHART_CHECKLIST.map(
    (c) => `<tr><th>${esc(c.item)}</th><td>${esc(c.spec)}</td></tr>`,
  ).join("")}</tbody></table></div>`;
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

  const visual: VisualKind | null =
    topic.visual ??
    (topic.id.endsWith("-doc") ? "doc" : topic.id.endsWith("-essay") ? "essay" : null);
  const isCharts = topic.id === "geo-bar" || topic.id === "geo-pie" || topic.id === "geo-curve";

  return `<a class="back" href="#/guide">${icon("arrow")} الدليل المنهجي</a>
  <div class="ghead">
    <span class="tag ${subjectClass(topic.subject)}">${subjectName(topic.subject)}</span>
    <h1 class="page">${esc(topic.title)}</h1>
  </div>
  <section class="panel">
    <h2>${icon(topic.icon)} خطوات الاشتغال</h2>
    <div class="steps">${topic.steps
      .map((s) => `<div class="step"><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div>`)
      .join("")}</div>
  </section>
  ${visual ? `<section class="panel"><h2>${icon("chart")} صورة توضيحية</h2>${visualHTML(visual)}</section>` : ""}
  ${isCharts ? `<section class="panel"><h2>${icon("chart")} اختر المبيان المناسب</h2>${chartTypesHTML()}</section>` : ""}
  ${topic.id === "geo-bar"
    ? `<section class="panel"><h2>${icon("target")} القاعدة الذهبية: ثلاثة أبعاد قبل الرسم</h2>
        ${chartDimensionsHTML()}
      </section>
      <section class="panel"><h2>${icon("chart")} جدول اختيار شكل الأعمدة</h2>${columnRulesHTML()}</section>
      <section class="panel"><h2>${icon("bookOpen")} تطبيقات نموذجية مرسومة ومصححة</h2>${chartApplicationsHTML()}</section>
      <section class="panel"><h2>${icon("check")} شبكة القبول والتنقيط</h2>${chartChecklistHTML()}</section>`
    : ""}
  ${topic.skills
    ? `<section class="panel"><h2>${icon("doc")} جدول المهارات ومرجعية الإجابة</h2>
    ${skillsHTML(topic.skills)}</section>`
    : ""}
  ${topic.application
    ? `<section class="panel"><h2>${icon("check")} تطبيق مصحح على الوثائق</h2>${applicationHTML(topic.application)}</section>`
    : ""}
  ${topic.scoring
    ? `<section class="panel"><h2>${icon("target")} شبكة تنقيط الموضوع المقالي (10 نقط)</h2>${scoringHTML(
        topic.scoring,
      )}</section>`
    : ""}
  ${topic.structure
    ? `<section class="panel"><h2>${icon("pencil")} خطوات التحرير: التاريخ والجغرافيا</h2>${structureHTML(
        topic.structure,
      )}</section>`
    : ""}
  ${topic.model
    ? `<section class="panel example"><h2>${icon("spark")} ${esc(topic.model.title)}</h2>${modelHTML(
        topic.model,
      )}</section>`
    : ""}
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
    ${exercisesHTML(topic)}
  </section>
  <section class="panel">
    <h2>${icon("alert")} أخطاء شائعة</h2>
    <ul class="bullets bad">${topic.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </section>
  ${topic.id === "hist-doc" || topic.id === "geo-doc"
    ? `<section class="panel"><h2>${icon("doc")} مسرد المفاهيم لسؤال التعريف</h2>
    ${conceptsHTML(topic.subject)}</section>`
    : ""}
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
