/** ألعاب البكالوريا gamified — محقق الوثائق، صانع القرار، مختبر المبيان، خط الزمن */
import content from "./content.json";
import { CHART_TYPES } from "./guide";
import { icon } from "./icons";
import type { Content, Lesson } from "./types";

const data = content as unknown as Content;
const lessons = data.lessons;
const concepts = data.lexicon.concepts;
const misconceptions = data.lexicon.misconceptions;

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type GameKind = "chrono" | "lie" | "chart" | "strategy";

interface GameDef {
  kind: GameKind;
  title: string;
  desc: string;
  ic: string;
}

const GAMES: GameDef[] = [
  { kind: "chrono", title: "خط الزمن", desc: "رتّب الأحداث التاريخية في تسلسلها الصحيح", ic: "clock" },
  { kind: "lie", title: "محقق الوثائق", desc: "اكتشف الجملة المغلوطة داخل الوثيقة", ic: "doc" },
  { kind: "chart", title: "مختبر المبيان", desc: "اختر نوع المبيان الأنسب لكل معطى إحصائي", ic: "chart" },
  { kind: "strategy", title: "صانع القرار", desc: "أزمة جيوسياسية — قراراتك تحدد مصير المؤشرات", ic: "swords" },
];

/* ------------------------------ الإطار ------------------------------ */

export function gamesIndexView(): string {
  return `<div class="page-head"><div><h1>الألعاب والتحديات</h1><p class="lead">تعلّم بمنهجية اللعب: وثائق، قرارات، مبيانات، زمن</p></div></div>
  <div class="grid">
    ${GAMES.map(
      (g) => `<a class="gcard" href="#/game/${g.kind}">
        <span class="gcard-ic">${icon(g.ic)}</span>
        <b>${g.title}</b><p>${g.desc}</p>
        <span class="gcard-go">العب الآن ${icon("arrow")}</span>
      </a>`,
    ).join("")}
  </div>
  <div class="note">الألعاب تدريبية بلا نقطة نهائية — كل خطأ مصحوب بتفسير من محتوى التطبيق.</div>`;
}

export function gameView(kind: string): string {
  const g = GAMES.find((x) => x.kind === kind);
  if (!g) return `<div class="note">لعبة غير موجودة. <a href="#/games">الألعاب</a></div>`;
  return `<a class="back" href="#/games">${icon("arrow")} الألعاب</a>
  <div class="page-head"><div><h1>${g.title}</h1><p class="lead">${g.desc}</p></div></div>
  <section class="game-stage" id="gameStage"><div class="game-loading">جارٍ تجهيز اللعبة…</div></section>`;
}

/* ------------------------------ أدوات ------------------------------ */

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

function shell(inner: string, score = ""): string {
  return `<div class="gscore">${score}</div><div class="gbody">${inner}</div>`;
}
function result(ok: boolean, title: string, text: string, href = "#/games"): string {
  return `<div class="gresult ${ok ? "win" : "lose"}">
    <span class="gresult-ic">${icon(ok ? "check" : "alert")}</span>
    <b>${title}</b><p>${esc(text)}</p>
    <div class="row"><a class="btn" href="${href}">${icon("refresh")} العب مجدداً</a><a class="btn ghost" href="#/games">كل الألعاب</a></div>
  </div>`;
}

/* ------------------------------ 1) خط الزمن ------------------------------ */

function chronoStage(stage: HTMLElement) {
  const pool = lessons.filter((l) => (l.timeline?.length ?? 0) >= 4);
  const lesson = pick(pool.length ? pool : lessons.filter((l) => l.timeline?.length));
  const events = lesson.timeline ?? [];
  const ordered = [...events].sort((a, b) => (a.date < b.date ? -1 : 1));
  const deck = shuffle(events.map((e, i) => ({ ...e, key: i })));
  let step = 0, mistakes = 0;

  const draw = () => {
    stage.innerHTML = shell(`
      <div class="ginfo"><b>${esc(lesson.title)}</b><span>رتّب ${events.length} أحداث من الأقدم إلى الأحدث — الخطأ explanations في الأسفل</span></div>
      <div class="chrono-slots">
        ${ordered.map(() => `<div class="chrono-slot"></div>`).join("")}
      </div>
      <div class="chrono-deck">
        ${deck.map((e) => `<button class="chrono-card" data-key="${e.key}" ${step > ordered.findIndex((o) => o.date === e.date && o.label === e.label) && false ? "" : ""}>${esc(e.label)}<small>${esc(e.date)}</small></button>`).join("")}
      </div>
      <div class="gscore-line">أخطاء: ${mistakes} · المرحلة: ${step}/${events.length}</div>`,
      `<span>الأقدم ← → الأحدث</span>`);
    bind();
  };

  const bind = () => {
    stage.querySelectorAll<HTMLButtonElement>(".chrono-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = Number(btn.dataset.key);
        const ev = events[key];
        const expected = ordered[step];
        const same = ev.date === expected.date && ev.label === expected.label;
        const slot = stage.querySelectorAll(".chrono-slot")[step] as HTMLElement;
        if (same) {
          slot.classList.add("filled");
          slot.innerHTML = `<b>${esc(ev.date)}</b><span>${esc(ev.label)}</span>`;
          btn.remove();
          step++;
          if (step >= ordered.length) {
            const stars = mistakes === 0 ? "★★★" : mistakes <= 2 ? "★★☆" : "★☆☆";
            stage.innerHTML = shell(result(true, `أحسنت! ${stars}`, `رتّبت أحداث «${lesson.title}» بـ${mistakes} خطأ. راجع الخط الزمني في الدرس للمقارنة.`, `#/lesson/${lesson.id}`));
            return;
          }
          stage.querySelector(".gscore-line")!.textContent = `أخطاء: ${mistakes} · المرحلة: ${step}/${events.length}`;
        } else {
          mistakes++;
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 500);
          stage.querySelector(".gscore-line")!.textContent = `أخطاء: ${mistakes} · المرحلة: ${step}/${events.length}`;
        }
      });
    });
  };
  draw();
}

/* ------------------------------ 2) محقق الوثائق ------------------------------ */

function lieStage(stage: HTMLElement) {
  const deck: { text: string; lie: boolean; fix?: string; src: string }[] = [];
  const truePool = concepts.slice(0, 60).map((c) => ({ text: c.def, src: c.term }));
  const liePool = misconceptions.slice(0, 60).map((m) => ({ text: m.claim, fix: m.fix, src: m.id }));
  let round = 0, score = 0, current: typeof deck = [];

  const newRound = () => {
    const lie = pick(liePool);
    const trues = shuffle(truePool).slice(0, 3).map((t) => ({ text: t.text, lie: false, src: t.src }));
    current = shuffle([...trues, { text: lie.text, lie: true, fix: lie.fix, src: lie.src }]);
    round++;
    stage.innerHTML = shell(`
      <div class="ginfo"><b>الجولة ${round}/5</b><span>وثيقة من ${current.length} عبارات — انقر على الجملة المغلوطة تاريخياً أو جغرافياً</span></div>
      <div class="doc-paper">
        ${current.map((c, i) => `<button class="doc-line" data-i="${i}"><span class="doc-num">${i + 1}</span>${esc(c.text)}</button>`).join("")}
      </div>
      <div class="gscore-line">النقاط: ${score}</div>`,
      `<span>الوثائق لا تكذب — إلا جملة واحدة</span>`);
    stage.querySelectorAll<HTMLButtonElement>(".doc-line").forEach((b) => {
      b.addEventListener("click", () => {
        const c = current[Number(b.dataset.i)];
        if (c.lie) {
          score += 10;
          stage.querySelectorAll<HTMLButtonElement>(".doc-line").forEach((x) => {
            const cc = current[Number(x.dataset.i)];
            x.classList.add(cc.lie ? "is-lie" : "is-true");
            x.disabled = true;
          });
          const note = document.createElement("div");
          note.className = "gfeedback";
          note.innerHTML = `<b>أصبت!</b> التصحيح: ${esc(c.fix ?? "")} <small>— ${esc(c.src)}</small>`;
          stage.querySelector(".gbody")!.appendChild(note);
          stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
          setTimeout(() => {
            if (round >= 5) {
              stage.innerHTML = shell(result(score >= 30, score >= 40 ? "محقق محترف!" : "تحقيق جيد", `حصّلت ${score}/50 في كشف الأخطاء. راجع بطاقات المفاهيم في المعجم لتثبيت التصحيحات.`, "#/lexicon"));
            } else newRound();
          }, 2600);
        } else {
          b.classList.add("wrong");
          setTimeout(() => b.classList.remove("wrong"), 450);
          score = Math.max(0, score - 2);
          stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
        }
      });
    });
  };
  newRound();
}

/* ------------------------------ 3) مختبر المبيان ------------------------------ */

function chartStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const types = CHART_TYPES.map((c) => c.type);

  const newRound = () => {
    round++;
    const correct = pick(CHART_TYPES);
    const options = shuffle([correct, ...shuffle(CHART_TYPES.filter((c) => c.type !== correct.type)).slice(0, 3)]);
    stage.innerHTML = shell(`
      <div class="ginfo"><b>الجولة ${round}/6</b><span>أي مبيان تختار لتمثيل هذه المعطيات؟</span></div>
      <div class="doc-paper chart-q">
        <p class="chart-when">${esc(correct.when)}</p>
        <p class="chart-rules">${esc(correct.rules)}</p>
      </div>
      <div class="chart-opts">
        ${options.map((o) => `<button class="chart-opt" data-t="${esc(o.type)}">${esc(o.type)}</button>`).join("")}
      </div>
      <div class="gscore-line">النقاط: ${score}</div>`,
      `<span>الاختيار الدقيق = درجة البكالوريا</span>`);
    stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const ok = b.dataset.t === correct.type;
        if (ok) score += 10;
        stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((x) => {
          if (x.dataset.t === correct.type) x.classList.add("is-right");
          else if (x === b) x.classList.add("is-wrong");
          x.disabled = true;
        });
        stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
        setTimeout(() => {
          if (round >= 6) {
            stage.innerHTML = shell(result(score >= 50, "رسام مبيانات!", `حصّلت ${score}/60. راجع «اختيار المبيان» في الدليل لمزيد من القواعد.`, "#/guide/chart"));
          } else newRound();
        }, 1600);
      });
    });
  };
  newRound();
}

/* ------------------------------ 4) صانع القرار ------------------------------ */

interface Meter { k: string; v: number }
interface Choice { label: string; fx: Partial<Record<string, number>>; note: string }
interface Card { text: string; a: Choice; b: Choice; lesson?: string }

const WATER_CARDS: Card[] = [
  { text: "الجفاف يشتد: الموارد المائية تتراجع 30% هذا الموسم. ما القرار؟", lesson: "التعمير والتناقص الموارد",
    a: { label: "حفر آبار عميقة جديدة", fx: { eco: -8, env: -14, soc: 6, dip: 0 }, note: "حل سريع لكن استنزاف المياه الجوفية يهدد المستقبل — مفهوم «الاستدامة»." },
    b: { label: "تحلية مياه البحر وتعميم الري بالتنقيط", fx: { eco: -12, env: 10, soc: 8, dip: 4 }, note: "استثمار مكلف لكن يحفظ المورد — رهان «التنمية المستدامة»." } },
  { text: "الفلاحون يشتكون من ارتفاع أسعار البذور المحسّنة. ما الموقف؟",
    a: { label: "دعم الفلاحين الصغار وتقنين الأسعار", fx: { eco: -6, env: 0, soc: 14, dip: 2 }, note: "عدالة اجتماعية مع كلفة على الميزانية." },
    b: { label: "ترك السوق ينظم نفسه", fx: { eco: 8, env: 0, soc: -16, dip: 0 }, note: "فلسفة الليبرالية الاقتصادية — لكن قد تسرّع الهجرة القروية." } },
  { text: "دولة مجاورة تعرض بيع كهرباء رخيصة مشترطة بالتعاون الإقليمي. ما ردك؟",
    a: { label: "قبول الشراكة الثنائية", fx: { eco: 10, env: 4, soc: 0, dip: 12 }, note: "مكسب اقتصادي لكن تبعية طاقوية — مفاضلة «السيادة»." },
    b: { label: "الاعتماد على الإنتاج المحلي فقط", fx: { eco: -6, env: 0, soc: 2, dip: -10 }, note: "استقلالية كاملة بثمن البطالة المحتملة في القطاع." } },
  { text: "تلوث سد مهم بالمبيدات. ما الأولوية؟",
    a: { label: "معالجة المياه قبل الشرب", fx: { eco: -10, env: 16, soc: 6, dip: 0 }, note: "حماية الصحة العامة أولاً." },
    b: { label: "تأجيل المعالجة للميزانية", fx: { eco: 6, env: -18, soc: -12, dip: 0 }, note: "توفير قصير المدى بكلفة صحية وبيئية باهظة." } },
  { text: "طلبة الأرياف يهاجرون للمدن بحثاً عن العمل. كيف تواجه؟",
    a: { label: "مشاريع استثمارية موجهة في الأرياف", fx: { eco: -8, env: 0, soc: 14, dip: 0 }, note: "تثبيت السكان — «التنمية المتوازنة»." },
    b: { label: "توسيع المدن لاستيعاب المهاجرين", fx: { eco: -10, env: -8, soc: -4, dip: 0 }, note: "تكلفة عمرانية وبيئية مرتفعة." } },
  { text: "مؤسسة دولية تعرض قرضاً لقطاع الفلاحة بشروط بيئية صارمة. ما القرار؟",
    a: { label: "قبول القرض والشروط", fx: { eco: 8, env: 12, soc: 0, dip: 8 }, note: "تمويل أخضر يحصّن Credibilité الدولية." },
    b: { label: "رفض التدخل في الشؤون الداخلية", fx: { eco: -4, env: 0, soc: 0, dip: -12 }, note: "موقف سيادي لكن يفقد تمويلاً متاحاً." } },
  { text: "نقص الأمطار يتكرر 3 سنوات. ما الاستراتيجية؟",
    a: { label: "برنامج طوارئ وطني شامل", fx: { eco: -14, env: 10, soc: 10, dip: 2 }, note: "تعبئة مجتمعية — يرفع الاستقرار لكنه مكلف." },
    b: { label: "الاعتماد على المساعدات الخارجية", fx: { eco: 4, env: -4, soc: -8, dip: -8 }, note: "حل مؤقت بكرامة وطنية أقل وارتباط خارجي." } },
  { text: "آخر قرار: التقرير النهائي للتدبير المائي. ما الخلاصة؟",
    a: { label: "ماء واحد... سياسات متكاملة فقط تنقذنا", fx: { eco: 10, env: 14, soc: 10, dip: 10 }, note: "الدرس: الإدارة المتكاملة للموارد المائية = استدامة." },
    b: { label: "كل قطعة تتدبر أمرها", fx: { eco: -16, env: -18, soc: -14, dip: -14 }, note: "التجزئة = فشل تدبيري — قارن مع الدرس." } },
];

function strategyStage(stage: HTMLElement) {
  const meters: Meter[] = [
    { k: "الاقتصاد", v: 55 },
    { k: "البيئة", v: 55 },
    { k: "الاستقرار", v: 55 },
    { k: "العلاقات الدولية", v: 55 },
  ];
  let i = 0;

  const draw = (note = "") => {
    if (meters.some((m) => m.v <= 0)) {
      const dead = meters.find((m) => m.v <= 0)!;
      stage.innerHTML = shell(result(false, "انهيار المؤشر", `انهار مؤشر «${dead.k}» — ${note || "قرارك قاد إلى نتيجة سلبية"}. الدرس المستفاد: القرارات الجيوسياسية مترابطة، والخطأ في مؤشر واحد قد يجرّ البقية.`, "#/games"));
      return;
    }
    if (i >= WATER_CARDS.length) {
      const avg = meters.reduce((s, m) => s + m.v, 0) / meters.length;
      stage.innerHTML = shell(result(avg >= 55, avg >= 70 ? "خبير جيواستراتيجي!" : "دبلوماسي ماهر", `أنهيت أزمة الماء بمتوسط مؤشرات ${Math.round(avg)}. ${meters.map((m) => `${m.k}: ${Math.round(m.v)}`).join(" · ")}`, "#/games"));
      return;
    }
    const c = WATER_CARDS[i];
    stage.innerHTML = shell(`
      <div class="gmeters">
        ${meters.map((m) => `<div class="gmeter"><span>${m.k}</span><div class="gbar"><i style="width:${Math.max(0, m.v)}%"></i></div><b>${Math.round(m.v)}</b></div>`).join("")}
      </div>
      <div class="ginfo"><b>القرار ${i + 1}/${WATER_CARDS.length}</b><span>${esc(c.text)}</span></div>
      <div class="schoices">
        <button class="schoice" data-side="a"><b>${esc(c.a.label)}</b></button>
        <button class="schoice" data-side="b"><b>${esc(c.b.label)}</b></button>
      </div>
      ${note ? `<div class="gfeedback">${esc(note)}</div>` : ""}
      <div class="gscore-line">اسحب/اختر قرارك — المؤشرات تتأثر فوراً</div>`,
      `<span>أزمة تدبير المياه — المغرب</span>`);
    stage.querySelectorAll<HTMLButtonElement>(".schoice").forEach((b) => {
      b.addEventListener("click", () => {
        const ch = b.dataset.side === "a" ? c.a : c.b;
        for (const m of meters) m.v = Math.max(0, Math.min(100, m.v + (ch.fx[m.k === "العلاقات الدولية" ? "dip" : m.k === "الاقتصاد" ? "eco" : m.k === "البيئة" ? "env" : "soc"] ?? 0)));
        i++;
        draw(ch.note);
      });
    });
  };
  draw();
}

/* ------------------------------ الموزع ------------------------------ */

export function bindGames(kind: string): void {
  const stage = document.getElementById("gameStage");
  if (!stage) return;
  const t = setTimeout(() => {
    if (kind === "chrono") chronoStage(stage);
    else if (kind === "lie") lieStage(stage);
    else if (kind === "chart") chartStage(stage);
    else if (kind === "strategy") strategyStage(stage);
  }, 60);
  void t;
}
