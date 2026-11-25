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
  <section class="panel example">
    <h2>${icon("spark")} ${esc(topic.example.title)}</h2>
    <p class="ex-prompt">${esc(topic.example.prompt)}</p>
    <details class="solution">
      <summary>اعرض الحل النموذجي</summary>
      <p>${esc(topic.example.solution)}</p>
    </details>
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
