import "./styles.css";
import data from "./content.json";
import type { Content, Lesson, Concept, Q } from "./types";
import { MODES, buildMode, availableModes } from "./modes";
import { GUIDE, RUBRIC_3_7 } from "./guide";
import { recordRun, markSeen, stats, resetAll, type MissRecord } from "./store";
import {
  buildSpec,
  qrDataUrl,
  studentSheetHTML,
  keySheetHTML,
  printDocument,
  parseSpec,
} from "./sheets";
import { icon } from "./icons";

const content = data as unknown as Content;
const lex = content.lexicon;
const app = document.getElementById("app") as HTMLElement;
document.getElementById("splash")?.remove();

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const byId = new Map<string, Lesson>(content.lessons.map((l) => [l.id, l]));
const conceptById = new Map<string, Concept>(lex.concepts.map((c) => [c.id, c]));
const misById = new Map(lex.misconceptions.map((m) => [m.id, m]));
const lessonMeta = new Map(lex.lessons.map((l) => [l.id, l]));

const subjectName = (s: string) => (s === "history" ? "التاريخ" : "الجغرافيا");

interface PlayState {
  lessonId: string;
  modeId: string;
  qs: Q[];
  i: number;
  score: number;
  answered: boolean;
  chosen: number;
  missed: MissRecord[];
}
let play: PlayState | null = null;

/* ------------------------------ الهيكل ------------------------------ */

const NAV = [
  { href: "#/", label: "الدروس", key: "home", ic: "book" },
  { href: "#/lexicon", label: "المعجم", key: "lexicon", ic: "library" },
  { href: "#/guide", label: "الدليل", key: "guide", ic: "compass" },
  { href: "#/report", label: "تقريري", key: "report", ic: "chart" },
];

function nav(active: string): string {
  return `<header class="topbar">
    <a class="brand" href="#/"><span class="mark">HG</span> مرشدي <b>HG</b></a>
    <nav>${NAV.map(
      (n) =>
        `<a href="${n.href}" class="${active === n.key ? "on" : ""}">${icon(n.ic)}${n.label}</a>`,
    ).join("")}</nav>
  </header>`;
}

function mobileNav(active: string): string {
  return `<nav class="mobile-nav">${NAV.map(
    (n) =>
      `<a href="${n.href}" class="${active === n.key ? "on" : ""}">${icon(n.ic)}<span>${n.label}</span></a>`,
  ).join("")}</nav>`;
}

function screen(active: string, inner: string): string {
  return `<div class="shell">${nav(active)}<main>${inner}</main>
    <footer class="foot">مرشدي HG — التاريخ والجغرافيا · الثانية باكالوريا آداب وعلوم إنسانية<br />
    المحتوى محرّر من الكتاب المدرسي · لا نقطة نهائية آلية</footer></div>${mobileNav(active)}`;
}

/* ------------------------------ الرئيسية ------------------------------ */

function homeView(): string {
  const s = stats(lex.concepts.length);
  const ready = content.lessons.length;
  const total = lex.lessons.length;

  const card = (meta: { id: string; code: string; title: string; subject: string; unit: string }) => {
    const lesson = byId.get(meta.id);
    const isReady = !!lesson;
    const modes = isReady ? availableModes(lesson, lex).filter((m) => m.count > 0) : [];
    return `<article class="lcard ${isReady ? "" : "soon"}">
      <div class="lhead">
        <span class="code">${meta.code}</span>
        <h3>${esc(meta.title)}</h3>
        <span class="badge ${isReady ? "ok" : ""}">${isReady ? "جاهز" : "لاحقاً"}</span>
      </div>
      <div class="lmeta">${esc(meta.unit)} · ${subjectName(meta.subject)}</div>
      ${
        isReady
          ? `<div class="chips">${modes
              .slice(0, 3)
              .map((m) => `<span class="chip">${icon(m.icon)}${m.name}</span>`)
              .join("")}${modes.length > 3 ? `<span class="chip">+${modes.length - 3}</span>` : ""}</div>
             <div class="row">
               <a class="btn" href="#/lesson/${meta.id}">${icon("bookOpen")} افتح الدرس</a>
               <a class="btn ghost" href="#/play/${meta.id}/quick">${icon("bolt")} اختبار</a>
             </div>`
          : `<div class="row"><button class="btn ghost" disabled style="opacity:.55">${icon("clock")} قيد الإعداد</button></div>`
      }
    </article>`;
  };

  const hist = lex.lessons.filter((l) => l.subject === "history").sort((a, b) => a.order - b.order);
  const geo = lex.lessons.filter((l) => l.subject === "geography").sort((a, b) => a.order - b.order);

  return screen(
    "home",
    `<section class="hero">
      <div>
        <h1>تعلّم التاريخ والجغرافيا باللعب</h1>
        <p>ثمانية أطوار مختلفة الميكانيكا لكل درس، دليل منهجي للوثيقة والمقال، وأوراق تحرير تُطبع وتُنجز بالقلم وتُصحَّح بالمسح.</p>
        <div class="row">
          <a class="btn" href="#/play/geo-2bac-ad-g01/quick">${icon("bolt")} ابدأ الآن</a>
          <a class="btn ghost" href="#/guide">${icon("compass")} الدليل المنهجي</a>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><b>${ready}/${total}</b><span>درساً جاهزاً</span></div>
        <div class="stat"><b>${lex.concepts.length}</b><span>بطاقة مفهوم</span></div>
        <div class="stat"><b>${lex.misconceptions.length}</b><span>خطأ شائع</span></div>
        <div class="stat"><b>${s.accuracy}%</b><span>معدل الإتقان</span></div>
      </div>
    </section>

    <h2 class="sec">${icon("book")} التاريخ <span class="tag">${hist.filter((h) => byId.has(h.id)).length}/${hist.length}</span></h2>
    <div class="grid">${hist.map(card).join("")}</div>

    <h2 class="sec">${icon("layers")} الجغرافيا <span class="tag">${geo.filter((h) => byId.has(h.id)).length}/${geo.length}</span></h2>
    <div class="grid">${geo.map(card).join("")}</div>`,
  );
}

/* ------------------------------ الدرس ------------------------------ */

function lessonView(id: string): string {
  const l = byId.get(id);
  if (!l) {
    const meta = lessonMeta.get(id);
    return screen(
      "home",
      `<div class="note">${icon("clock")}<br />هذا الدرس لم يُبنَ بعد${meta ? ` (${esc(meta.title)})` : ""}.<br />بطاقاته موجودة في المعجم، لكن ملف الدرس والتمارين غير مكتملين حتى الآن.</div>
       <div class="row"><a class="btn" href="#/">${icon("arrow")} رجوع</a></div>`,
    );
  }
  markSeen(id);
  const modes = availableModes(l, lex).filter((m) => m.count > 0);
  const concepts = l.conceptIds.map((c) => conceptById.get(c)).filter((c): c is Concept => !!c);

  return screen(
    "home",
    `<a class="back" href="#/">${icon("arrow")} كل الدروس</a>
    <header class="lhero">
      <span class="kicker">${esc(l.module)} · ${esc(l.unit)}</span>
      <h1>${esc(l.title)}</h1>
      <div class="ctx">${esc(l.context)}</div>
      <div class="prob"><b>الإشكالية:</b> ${esc(l.problemStatement)}</div>
    </header>

    <div class="cols">
      <section class="panel">
        <h3>محاور الدرس</h3>
        <ol class="axes">${l.axes
          .map(
            (a) => `<li><b>${esc(a.title)}</b>
              <ul>${a.subAxes.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></li>`,
          )
          .join("")}</ol>
        <h3>الأهداف</h3>
        <ul class="bullets">${l.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
        <h3>الخاتمة</h3>
        <p class="closing">${esc(l.closing)}</p>
      </section>

      <aside class="panel">
        <h3>مفاهيم الدرس <span class="tag">${concepts.length}</span></h3>
        <div class="mini-cards">${concepts
          .map(
            (c) => `<a class="mini" href="#/lexicon?q=${encodeURIComponent(c.term)}">
              <b>${esc(c.term)}</b><span>${c.kind === "figure" ? "علم" : c.type ?? "مفهوم"}</span></a>`,
          )
          .join("")}</div>
        ${
          l.timeline && l.timeline.length
            ? `<h3>الخط الزمني</h3><ul class="tl">${l.timeline
                .map((t) => `<li><b>${esc(t.date ?? "")}</b> ${esc(t.label)}</li>`)
                .join("")}</ul>`
            : ""
        }
        <div class="src">${esc(l.sourceRef?.credit ?? "")}</div>
      </aside>
    </div>

    ${
      l.matrix
        ? `<section class="panel"><h3>${esc(l.matrix.title)}</h3>
            <div class="tablewrap"><table class="mtable"><thead><tr><th></th>${l.matrix.columns
              .map((c) => `<th>${esc(c)}</th>`)
              .join("")}</tr></thead><tbody>${l.matrix.rows
              .map(
                (r) =>
                  `<tr><th>${esc(r.label)}</th>${r.cells
                    .map((c) => `<td class="${c === "—" ? "dash" : ""}">${esc(c)}</td>`)
                    .join("")}</tr>`,
              )
              .join("")}</tbody></table></div></section>`
        : ""
    }

    ${
      l.documents && l.documents.length
        ? `<section class="panel"><h3>الوثائق <span class="tag">${l.documents.length}</span></h3>
            ${l.documents
              .map(
                (d) => `<details class="doc">
                  <summary><b>${esc(d.title)}</b> <span class="muted small">${esc(d.caption ?? "")}</span></summary>
                  ${d.body ? `<blockquote>${esc(d.body)}</blockquote>` : ""}
                  ${
                    d.data
                      ? `<div class="tablewrap"><table class="mtable"><thead><tr>${d.data.columns
                          .map((c) => `<th>${esc(c)}</th>`)
                          .join("")}</tr></thead><tbody>${d.data.rows
                          .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
                          .join("")}</tbody></table></div>`
                      : ""
                  }
                  <ol class="dq">${(d.questions ?? [])
                    .map(
                      (q) =>
                        `<li>${esc(q.q)}
                         <details><summary>الإجابة النموذجية</summary><p>${esc(q.modelAnswer)}</p></details></li>`,
                    )
                    .join("")}</ol>
                  <div class="src">${esc(d.source ?? "")}</div>
                </details>`,
              )
              .join("")}</section>`
        : ""
    }

    <section class="panel">
      <h3>أطوار اللعب <span class="tag">${modes.length}</span></h3>
      <div class="modes">${modes
        .map(
          (m) => `<a class="mode" href="#/play/${l.id}/${m.id}">
            <span class="tile">${icon(m.icon)}</span>
            <b>${m.name}</b>
            <small>${m.desc}</small>
            <em>${m.count} سؤالاً</em>
          </a>`,
        )
        .join("")}</div>
      <div class="row">
        <a class="btn ghost" href="#/sheet/${l.id}/${modes[0]?.id ?? "diagnostic"}">${icon("qr")} أوراق تحرير مرمزة (QR)</a>
      </div>
    </section>

    ${
      l.essayPrompts && l.essayPrompts.length
        ? `<section class="panel"><h3>موضوع المقال</h3>${l.essayPrompts
            .map(
              (e) => `<p>${esc(e.prompt)}</p><details class="doc"><summary>خطة مقترحة</summary><ol class="dq">${e.plan
                .map((p) => `<li>${esc(p)}</li>`)
                .join("")}</ol></details>`,
            )
            .join("")}</section>`
        : ""
    }`,
  );
}

/* ------------------------------ اللعب ------------------------------ */

function playView(lessonId: string, modeId: string): string {
  const l = byId.get(lessonId);
  if (!l) return screen("home", `<div class="note">الدرس غير جاهز.</div>`);

  if (!play || play.lessonId !== lessonId || play.modeId !== modeId) {
    const qs = buildMode(modeId, l, lex);
    if (!qs.length) return screen("home", `<div class="note">هذا الطور غير متوفر لهذا الدرس.</div>`);
    play = { lessonId, modeId, qs, i: 0, score: 0, answered: false, chosen: -1, missed: [] };
  }

  const st = play;
  const mode = MODES.find((m) => m.id === modeId);
  const q = st.qs[st.i];

  if (!q) {
    const pct = Math.round((st.score / st.qs.length) * 100);
    return screen(
      "home",
      `<div class="result">
        <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
        <h2>${pct >= 80 ? "ممتاز" : pct >= 50 ? "مقبول" : "يحتاج مراجعة"}</h2>
        <p class="muted">${st.score} من ${st.qs.length} — طور «${mode?.name ?? modeId}» · ${esc(l.title)}</p>
        ${
          st.missed.length
            ? `<div class="review"><h3>${icon("spark")} راجع هذه المفاهيم</h3><ul>${st.missed
                .filter((m) => m.conceptId)
                .map((m) => conceptById.get(m.conceptId as string))
                .filter(Boolean)
                .filter((c, i, arr) => arr.findIndex((x) => x!.id === c!.id) === i)
                .map((c) => `<li>${esc(c!.term)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        <div class="row" style="justify-content:center">
          <button class="btn" data-again>${icon("refresh")} أعد الطور</button>
          <a class="btn ghost" href="#/lesson/${l.id}">${icon("arrow")} رجوع للدرس</a>
        </div>
        <p class="muted small">هذا مؤشر تدريبي لا علامة نهائية: التنقيط النهائي بقلم المصحّح وفق معايير النشاط (3+7 لأسئلة الوثائق، ومعايير المقال لموضوع مقالي).</p>
      </div>`,
    );
  }

  const picked = st.answered ? st.chosen : -1;
  const correct = st.answered && picked === q.answer;
  const mid = q.fixes?.[picked];
  const mis = mid ? misById.get(mid) : undefined;
  const concept = q.conceptId ? conceptById.get(q.conceptId) : undefined;

  return screen(
    "home",
    `<div class="playbar">
      <a class="back" href="#/lesson/${l.id}" style="margin:0">${icon("close")} خروج</a>
      <div class="pinfo">${esc(mode?.name ?? "")} · ${esc(l.title)}</div>
      <div class="pcount">${st.i + 1}/${st.qs.length} · ${st.score} ✓</div>
    </div>
    <div class="progress"><i style="width:${((st.i + (st.answered ? 1 : 0)) / st.qs.length) * 100}%"></i></div>

    <section class="qcard">
      <span class="qkind">${icon(mode?.icon ?? "target")} ${esc(q.hint ?? (mode?.name ?? ""))}</span>
      <h2 class="qprompt">${esc(q.prompt)}</h2>
      <div class="opts-vertical">
        ${q.options
          .map((o, k) => {
            let cls = "";
            if (st.answered) {
              if (k === q.answer) cls = "right";
              else if (k === picked) cls = "wrong";
            }
            return `<button class="opt ${cls}" data-opt="${k}" ${st.answered ? "disabled" : ""}>
              <b>${String.fromCharCode(65 + k)}</b><span>${esc(o)}</span></button>`;
          })
          .join("")}
      </div>

      ${
        st.answered
          ? `<div class="feedback ${correct ? "good" : "bad"}">
              <div class="fb-layer"><b>1 · ماذا حدث</b><p>${
                correct ? "إجابة صحيحة." : "الإجابة غير صحيحة."
              } ${esc(q.explain)}</p></div>
              ${
                mis && !correct
                  ? `<div class="fb-layer"><b>2 · لماذا يهم</b><p>وقعت في الخطأ الشائع: «${esc(
                      mis.claim,
                    )}» — ${esc(mis.fix)}</p></div>`
                  : `<div class="fb-layer"><b>2 · لماذا يهم</b><p>${
                      concept
                        ? `هذا المفهوم مرتبط ببطاقة «${esc(concept.term)}» في المعجم.`
                        : "كل سؤال يقيس مهارة من مهارات الدرس، والخطأ دليل على موضع يحتاج مراجعة لا على فشل."
                    }</p></div>`
              }
              <div class="fb-layer"><b>3 · الخطوة التالية</b><p>${
                correct
                  ? "انتقل إلى السؤال الموالي، وإن تكرر نفس النوع فجرّب طوراً أصعب."
                  : concept
                    ? `افتح بطاقة «${esc(concept.term)}» وأعد قراءة تعريفها، ثم أعد هذا الطور.`
                    : "أعد قراءة محور الدرس المتعلق بالسؤال، ثم أعد الطور."
              }</p></div>
              <div class="row"><button class="btn" data-next>${st.i + 1 === st.qs.length ? "النتيجة" : "السؤال التالي"} ${icon("arrow")}</button></div>
            </div>`
          : ""
      }
    </section>`,
  );
}

/* ------------------------------ المعجم ------------------------------ */

function lexiconView(query: string): string {
  const q = query.trim().toLowerCase();
  const domains = new Map(lex.domains.map((d) => [d.id, d]));
  const filtered = lex.concepts.filter((c) => {
    if (!q) return true;
    return (
      c.term.toLowerCase().includes(q) ||
      c.def.toLowerCase().includes(q) ||
      (c.type ?? "").toLowerCase().includes(q)
    );
  });
  const groups = new Map<string, Concept[]>();
  for (const c of filtered) {
    const arr = groups.get(c.domainId) ?? [];
    arr.push(c);
    groups.set(c.domainId, arr);
  }

  return screen(
    "lexicon",
    `<h1 class="page">المعجم <span class="tag">${filtered.length}/${lex.concepts.length}</span></h1>
    <input class="search" id="q" value="${esc(query)}" placeholder="ابحث عن مفهوم أو تعريف…" autocomplete="off" />
    ${[...groups.entries()]
      .map(([dom, cs]) => {
        const d = domains.get(dom);
        return `<h2 class="sec">${esc(d?.name ?? dom)} <span class="tag">${cs.length}</span></h2>
        <div class="grid small">${cs
          .map(
            (c) => `<article class="kcard">
              <div class="khead"><b>${esc(c.term)}</b><span class="chip">${esc(c.type ?? c.kind)}</span></div>
              <p>${esc(c.def)}</p>
              <div class="kmeta">
                ${c.when ? `<span>${esc(c.when)}</span>` : ""}
                ${c.where ? `<span>${esc(c.where)}</span>` : ""}
                ${c.actors && c.actors.length ? `<span>${esc(c.actors.join("، "))}</span>` : ""}
              </div>
              ${
                c.misconceptions && c.misconceptions.length
                  ? `<details class="mis"><summary>${icon("alert")} خطأ شائع (${c.misconceptions.length})</summary>${c.misconceptions
                      .map((m) => {
                        const mm = misById.get(m);
                        return mm ? `<p><b>«${esc(mm.claim)}»</b><br />${esc(mm.fix)}</p>` : "";
                      })
                      .join("")}</details>`
                  : ""
              }
              ${
                c.lessons.length
                  ? `<div class="kless">${c.lessons
                      .map((li) => `<a href="#/lesson/${li}">${esc(lessonMeta.get(li)?.code ?? li)}</a>`)
                      .join(" ")}</div>`
                  : `<div class="kless muted">غير مرتبط بدرس</div>`
              }
            </article>`,
          )
          .join("")}</div>`;
      })
      .join("")}`,
  );
}

/* ------------------------------ الدليل ------------------------------ */

function guideView(): string {
  return screen(
    "guide",
    `<h1 class="page">الدليل المنهجي</h1>
    <p class="lead">أربعة مسارات للعمل المطلوب في الامتحان — الوثيقة، المقال، المبيان، والخط الزمني — ومسار خامس للتصحيح الذاتي، مستندة إلى دليل «مرشدي».</p>
    ${GUIDE.map(
      (g) => `<section class="panel">
        <h2>${icon(g.icon)} ${esc(g.title)}</h2>
        <p class="lead">${esc(g.intro)}</p>
        <div class="steps">${g.steps
          .map((s) => `<div class="step"><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div>`)
          .join("")}</div>
        <h3>أخطاء شائعة</h3>
        <ul class="bullets bad">${g.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </section>`,
    ).join("")}
    <section class="panel">
      <h2>${icon("chart")} شبكة تنقيط الاشتغال على الوثائق 3 + 7</h2>
      <div class="tablewrap"><table class="mtable"><thead><tr><th>المحور</th><th>النقط</th><th>المضمون</th></tr></thead>
      <tbody>${RUBRIC_3_7.map(
        (r) => `<tr><th>${esc(r.axis)}</th><td class="c"><b>${r.points}</b></td><td>${esc(r.detail)}</td></tr>`,
      ).join("")}</tbody></table></div>
      <p class="muted small">هذه الشبكة خاصة بأسئلة الوثائق؛ أما المقال فله معاييره (الفهم، الاستثمار، المفاهيم، البنية، اللغة، التركيب). والتطبيق لا يمنح نقطة نهائية آلية: الاختيار من متعدد مؤشر تشخيصي فقط.</p>
    </section>`,
  );
}

/* ------------------------------ التقرير ------------------------------ */

function reportView(): string {
  const s = stats(lex.concepts.length);
  const recent = s.misses.slice(0, 30);
  const byConcept = new Map<string, number>();
  for (const m of s.misses) if (m.conceptId) byConcept.set(m.conceptId, (byConcept.get(m.conceptId) ?? 0) + 1);
  const top = [...byConcept.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return screen(
    "report",
    `<h1 class="page">تقريري</h1>
    <div class="stats wide">
      <div class="stat"><b>${s.lessonsSeen}</b><span>درساً فتحته</span></div>
      <div class="stat"><b>${s.totalTries}</b><span>طوراً أنجزته</span></div>
      <div class="stat"><b>${s.accuracy}%</b><span>معدل الإتقان</span></div>
      <div class="stat"><b>${s.conceptsToReview}</b><span>مفهوماً للمراجعة</span></div>
    </div>
    ${
      top.length
        ? `<section class="panel"><h2>${icon("spark")} أكثر المفاهيم تعثراً</h2><ul class="bullets">${top
            .map(([cid, n]) => {
              const c = conceptById.get(cid);
              return `<li><b>${esc(c?.term ?? cid)}</b> — ${n} خطأ</li>`;
            })
            .join("")}</ul></section>`
        : `<div class="note" style="margin-top:14px">${icon("spark")}<br />لم تُنجز أي طور بعد. ابدأ بدرس جاهز.</div>`
    }
    ${
      recent.length
        ? `<section class="panel"><h2>آخر الأخطاء</h2><div class="tablewrap"><table class="mtable"><thead><tr><th>الدرس</th><th>الطور</th><th>المفهوم</th></tr></thead><tbody>${recent
            .map(
              (m) =>
                `<tr><td>${esc(lessonMeta.get(m.lessonId)?.code ?? m.lessonId)}</td><td>${esc(
                  MODES.find((x) => x.id === m.modeId)?.name ?? m.modeId,
                )}</td><td>${esc(conceptById.get(m.conceptId ?? "")?.term ?? "—")}</td></tr>`,
            )
            .join("")}</tbody></table></div></section>`
        : ""
    }
    <div class="row"><button class="btn ghost" id="reset">${icon("refresh")} تصفير التقدّم</button></div>`,
  );
}

/* ------------------------------ الأوراق ------------------------------ */

let sheetState: { modeId: string; count: number; qr: string | null; payload: string } = {
  modeId: "",
  count: 8,
  qr: null,
  payload: "",
};

function sheetView(lessonId: string, modeId: string): string {
  const l = byId.get(lessonId);
  if (!l) return screen("home", `<div class="note">الدرس غير جاهز.</div>`);
  const modes = availableModes(l, lex).filter((m) => m.count > 0);
  if (!sheetState.modeId || !modes.some((m) => m.id === sheetState.modeId)) {
    sheetState = {
      modeId: modeId && modes.some((m) => m.id === modeId) ? modeId : modes[0]?.id ?? "",
      count: 8,
      qr: null,
      payload: "",
    };
  }

  const spec = sheetState.modeId ? buildSpec(l.id, sheetState.modeId, sheetState.count) : null;
  const qs = sheetState.modeId ? buildMode(sheetState.modeId, l, lex).slice(0, sheetState.count) : [];

  return screen(
    "home",
    `<a class="back" href="#/lesson/${l.id}">${icon("arrow")} ${esc(l.title)}</a>
    <h1 class="page">${icon("qr")} أوراق تحرير مرمزة</h1>
    <p class="lead">اختر الطور وعدد الأسئلة، ثم اطبع الورقة ليجيب عنها المتعلم بالقلم. رمز QR يحمل مواصفات التمرين فقط (بلا اسم ولا إجابة)، والتصحيح يتم بالمسح.</p>
    <section class="panel">
      <div class="row wrap">
        <label>الطور
          <select id="m">${modes
            .map(
              (m) =>
                `<option value="${m.id}" ${m.id === sheetState.modeId ? "selected" : ""}>${m.name} (${m.count})</option>`,
            )
            .join("")}</select>
        </label>
        <label>عدد الأسئلة
          <input id="n" type="number" min="4" max="12" value="${sheetState.count}" />
        </label>
        <button class="btn" id="gen">${icon("qr")} توليد الورقة</button>
      </div>
      ${
        sheetState.qr
          ? `<div class="sheetpreview">
              <img src="${sheetState.qr}" alt="رمز الورقة" />
              <div>
                <div class="muted small">مواصفات مُرمّزة:</div>
                <code class="payload">${esc(sheetState.payload)}</code>
                <div class="muted small">${qs.length} سؤالاً · ${esc(
                  modes.find((m) => m.id === sheetState.modeId)?.name ?? "",
                )}</div>
                <div class="row">
                  <button class="btn" id="print-student">${icon("print")} ورقة المتعلم</button>
                  <button class="btn ghost" id="print-key">${icon("check")} مفتاح التصحيح</button>
                </div>
              </div>
            </div>`
          : `<div class="note" style="margin-top:14px">${icon("qr")}<br />اضغط «توليد الورقة» لإنشاء الرمز.</div>`
      }
      ${
        spec
          ? `<details class="doc"><summary>فحص المواصفات (كما ستُقرأ عند المسح)</summary>
              <p class="small">${esc(JSON.stringify(parseSpec(spec.payload) ?? {}, null, 1))}</p></details>`
          : ""
      }
    </section>`,
  );
}

/* ------------------------------ التوجيه ------------------------------ */

function route(): { name: string; parts: string[] } {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qstr] = h.split("?");
  return { name: path, parts: [qstr ?? ""] };
}

function render() {
  const { name, parts } = route();
  const seg = name.split("/").filter(Boolean);
  const view = seg[0] ?? "";
  let html = "";
  let needsSearch = false;

  switch (view) {
    case "":
      html = homeView();
      break;
    case "lesson":
      html = lessonView(seg[1] ?? "");
      break;
    case "play":
      play = null;
      html = playView(seg[1] ?? "", seg[2] ?? "diagnostic");
      break;
    case "lexicon": {
      const params = new URLSearchParams(parts[0]);
      html = lexiconView(params.get("q") ?? "");
      needsSearch = true;
      break;
    }
    case "guide":
      html = guideView();
      break;
    case "report":
      html = reportView();
      break;
    case "sheet":
      html = sheetView(seg[1] ?? "", seg[2] ?? "");
      break;
    default:
      html = screen("home", `<div class="note">صفحة غير موجودة. <a href="#/">الرئيسية</a></div>`);
  }

  app.innerHTML = html;
  bind(view, seg, needsSearch);
  window.scrollTo({ top: 0 });
}

function bind(view: string, seg: string[], needsSearch: boolean) {
  if (needsSearch) {
    const input = document.getElementById("q") as HTMLInputElement | null;
    if (input) {
      let t: number | undefined;
      input.addEventListener("input", () => {
        window.clearTimeout(t);
        t = window.setTimeout(() => {
          const v = input.value;
          location.replace(`#/lexicon?q=${encodeURIComponent(v)}`);
          const el = document.getElementById("q") as HTMLInputElement | null;
          if (el) {
            el.focus();
            el.setSelectionRange(v.length, v.length);
          }
        }, 220);
      });
    }
  }

  if (view === "report") {
    document.getElementById("reset")?.addEventListener("click", () => {
      if (confirm("سيُحذف كل تقدّمك المحلي. متابعة؟")) {
        resetAll();
        render();
      }
    });
  }

  if (view === "play") {
    if (!play) return;
    const st = play;
    document.querySelectorAll<HTMLButtonElement>("[data-opt]").forEach((b) => {
      b.addEventListener("click", () => {
        if (st.answered) return;
        const k = Number(b.dataset.opt);
        st.chosen = k;
        st.answered = true;
        const q = st.qs[st.i];
        if (k === q.answer) st.score++;
        else {
          st.missed.push({
            conceptId: q.conceptId,
            misconceptionId: q.fixes?.[k],
            lessonId: st.lessonId,
            modeId: st.modeId,
            at: new Date().toISOString(),
          });
        }
        const keep = { ...st };
        render();
        play = keep;
        document.querySelectorAll<HTMLButtonElement>("[data-opt]").forEach((o) => (o.disabled = true));
      });
    });
    document.querySelector("[data-next]")?.addEventListener("click", () => {
      st.i++;
      st.answered = false;
      st.chosen = -1;
      if (st.i >= st.qs.length) {
        recordRun(st.lessonId, st.modeId, st.score, st.qs.length, st.missed);
      }
      render();
    });
    document.querySelector("[data-again]")?.addEventListener("click", () => {
      play = null;
      render();
    });
  }

  if (view === "sheet") {
    const l = byId.get(seg[1] ?? "");
    if (!l) return;
    const sel = document.getElementById("m") as HTMLSelectElement | null;
    const num = document.getElementById("n") as HTMLInputElement | null;
    document.getElementById("gen")?.addEventListener("click", async () => {
      sheetState.modeId = sel?.value ?? sheetState.modeId;
      sheetState.count = Math.max(4, Math.min(12, Number(num?.value ?? 8)));
      const spec = buildSpec(l.id, sheetState.modeId, sheetState.count);
      sheetState.payload = spec.payload;
      sheetState.qr = await qrDataUrl(spec.payload);
      render();
    });
    document.getElementById("print-student")?.addEventListener("click", () => {
      const qs = buildMode(sheetState.modeId, l, lex).slice(0, sheetState.count);
      const name = MODES.find((m) => m.id === sheetState.modeId)?.name ?? "";
      const ok = printDocument(studentSheetHTML(l, name, sheetState.qr ?? "", qs));
      if (!ok) alert("تعذّر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.");
    });
    document.getElementById("print-key")?.addEventListener("click", () => {
      const qs = buildMode(sheetState.modeId, l, lex).slice(0, sheetState.count);
      const name = MODES.find((m) => m.id === sheetState.modeId)?.name ?? "";
      printDocument(keySheetHTML(l, name, qs));
    });
  }
}

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => void 0);
  });
}
