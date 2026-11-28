/** ألعاب البكالوريا gamified — محقق الوثائق، صانع القرار، مختبر المبيان، خط الزمن */
import content from "./content.json";
import { CHART_TYPES } from "./guide";
import { askTutor } from "./tutor";
import { icon } from "./icons";
import type { Content, Lesson } from "./types";

const data = content as unknown as Content;
const lessons = data.lessons;
const concepts = data.lexicon.concepts;
const misconceptions = data.lexicon.misconceptions;

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type GameKind = "chrono" | "lie" | "chart" | "strategy" | "race" | "geoclue" | "links" | "essay" | "mapx" | "debate";

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
  { kind: "race", title: "سباق المبيانات", desc: "توقّع مسار المنحنى واختر التفسير الصحيح", ic: "chart" },
  { kind: "geoclue", title: "تحدي التخمين الجغرافي", desc: "خمّن المجال من تلميحات تدريجية", ic: "target" },
  { kind: "links", title: "الروابط الخفية", desc: "صنّف 16 بطاقة إلى 4 مجموعات مترابطة", ic: "layers" },
  { kind: "essay", title: "مهندس المقال", desc: "ابنِ هيكل المقال المقالي من كتل مبعثرة", ic: "pencil" },
  { kind: "mapx", title: "فك تشفير الخرائط", desc: "طابق الطبقات الجغرافية وتطوّر الحدود", ic: "compass" },
  { kind: "debate", title: "مناظرة الأستاذ", desc: "حوار حي مع شخصية — أقنعه بحجج الدرس", ic: "swords" },
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
  const usable = pool.length ? pool : lessons.filter((l) => l.timeline?.length);
  let round = 0, totalMistakes = 0;

  const newRound = () => {
    round++;
    const lesson = pick(usable);
    const events = lesson.timeline ?? [];
    const ordered = [...events].sort((a, b) => (a.date < b.date ? -1 : 1));
    const deck = shuffle(events.map((e, i) => ({ ...e, key: i })));
    let step = 0, mistakes = 0;

    const lvl = Math.floor((round - 1) / 10) + 1;
    const rInLvl = ((round - 1) % 10) + 1;
    stage.innerHTML = shell(`
      <div class="ginfo"><b>${esc(lesson.title)}</b><span>رتّب ${events.length} أحداث — المستوى ${lvl} · الجولة ${rInLvl}/10</span></div>
      <div class="chrono-slots">
        ${ordered.map(() => `<div class="chrono-slot"></div>`).join("")}
      </div>
      <div class="chrono-deck">
        ${deck.map((e) => `<button class="chrono-card" data-key="${e.key}">${esc(e.label)}<small>${esc(e.date)}</small></button>`).join("")}
      </div>
      <div class="gscore-line">أخطاء: ${mistakes} · المرحلة: ${step}/${events.length}</div>`,
      `<span>الأقدم ← → الأحدث</span>`);

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
            totalMistakes += mistakes;
            if (round >= 100) {
              const avg = totalMistakes / 100;
              stage.innerHTML = shell(result(avg <= 1.5, "مؤرخ خط الزمن!", `أكملت 100 جولة ترتيب بـ${totalMistakes} خطأ إجمالاً (معدل ${avg.toFixed(1)}).`, "#/games"));
              return;
            }
            setTimeout(newRound, 900);
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
  newRound();
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
      <div class="ginfo"><b>وثيقة ${round}</b><span>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10 — ${current.length} عبارات، انقر على الجملة المغلوطة</span></div>
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
            if (round >= 100) {
              stage.innerHTML = shell(result(score >= 700, score >= 850 ? "محقق محترف!" : "تحقيق جيد", `حصّلت ${score}/1000 في كشف الأخطاء عبر 10 مستويات. راجع بطاقات المفاهيم في المعجم لتثبيت التصحيحات.`, "#/lexicon"));
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
      <div class="ginfo"><b>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10</b><span>أي مبيان تختار لتمثيل هذه المعطيات؟</span></div>
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
          if (round >= 100) {
            stage.innerHTML = shell(result(score >= 800, "رسام مبيانات!", `حصّلت ${score}/1000 في اختيار المبيان عبر 10 مستويات. راجع «اختيار المبيان» في الدليل لمزيد من القواعد.`, "#/guide/chart"));
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
    a: { label: "قبول القرض والشروط", fx: { eco: 8, env: 12, soc: 0, dip: 8 }, note: "تمويل أخضر يحصّن المصداقية الدولية." },
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

/* ------------------------------ 5) سباق المبيانات ------------------------------ */

interface RaceCard {
  title: string;
  unit: string;
  known: number[];
  future: "up" | "flat" | "down";
  cause: string;
  options: string[];
}

const RACES: RaceCard[] = [
  { title: "الناتج الداخلي الخام — الولايات المتحدة", unit: "تريليون دولار", known: [10, 12, 14, 15, 16, 20],
    future: "down", cause: "أزمة الرهن العقاري 2008 تُحدث تراجعاً مؤقتاً ثم تعافٍ",
    options: ["أزمة الرهن العقاري 2008", "ازدهار التسعينيات", "سقوط جدار برلين"] },
  { title: "نسبة التمدين — المغرب", unit: "%", known: [35, 42, 49, 55, 61, 64],
    future: "up", cause: "الهجرة القروية للمدن",
    options: ["الهجرة القروية للمدن", "انخفاض الخصوبة", "توسع المدن الجديدة"] },
  { title: "نسبة مساهمة الفلاحة — الصين", unit: "%", known: [40, 36, 31, 26, 22, 18],
    future: "down", cause: "التحول نحو الصناعة والخدمات",
    options: ["التحول نحو الصناعة والخدمات", "ازدهار الفلاحة", "ثورة الخضراء"] },
];

function raceStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const W = 640, H = 200, pad = 24;
  const newRound = () => {
    round++;
    const c = RACES[(round - 1) % RACES.length];
    const n = c.known.length;
    const all = [...c.known, c.known[n - 1] + (c.future === "up" ? 3 : c.future === "down" ? -3 : 0)];
    const min = Math.min(...all) - 4, max = Math.max(...all) + 4;
    const px = (i: number) => pad + (i / (all.length - 1)) * (W - pad * 2);
    const py = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    const pts = all.map((v, i) => `${px(i).toFixed(0)},${py(v).toFixed(0)}`).join(" ");
    const knownPts = c.known.map((v, i) => `${px(i).toFixed(0)},${py(v).toFixed(0)}`).join(" ");
    stage.innerHTML = shell(`
      <div class="ginfo"><b>${esc(c.title)}</b><span>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10 — ${esc(c.unit)}، توقف المنحنى عند ${c.known[n - 1]}: ماذا سيحدث؟</span></div>
      <svg viewBox="0 0 ${W} ${H}" class="race-svg">
        <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="rgba(255,255,255,0.2)"/>
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="rgba(255,255,255,0.2)"/>
        <polyline points="${pts}" fill="none" stroke="rgba(94,234,212,0.35)" stroke-width="3" stroke-dasharray="7 6"/>
        <polyline id="raceLine" points="${knownPts}" fill="none" stroke="#5eead4" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="${px(n - 1)}" cy="${py(c.known[n - 1])}" r="6" fill="#fff"/>
      </svg>
      <div class="chart-opts" style="grid-template-columns:1fr">
        <button class="chart-opt" data-a="up">↗ صعود</button>
        <button class="chart-opt" data-a="flat">→ استقرار</button>
        <button class="chart-opt" data-a="down">↘ تراجع</button>
      </div>
      <div class="gscore-line">النقاط: ${score}</div>`,
      `<span>اقرأ الاتجاه قبل أن يكمل المنحنى</span>`);
    let answered = false;
    stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((b) => {
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const dir = b.dataset.a as "up" | "flat" | "down";
        const okDir = dir === c.future;
        if (okDir) score += 10;
        /* أكمل رسم المستقبل */
        const line = stage.querySelector("#raceLine") as SVGPolylineElement | null;
        const endIdx = all.length - 1;
        if (line) {
          const futurePts = [px(n - 1), py(c.known[n - 1])];
          for (let i = n; i <= endIdx; i++) futurePts.push(px(i), py(all[i]));
          line.setAttribute("points", [...knownPts.split(" "), ...Array.from({ length: endIdx - n + 1 }, (_, k) => `${px(n + k)},${py(all[n + k])}`)].join(" "));
          line.setAttribute("stroke", okDir ? "#6ee7a0" : "#f87171");
        }
        const note = document.createElement("div");
        note.className = "gfeedback";
        note.innerHTML = `<b>${okDir ? "اتجاه صحيح!" : "اتجاه خاطئ."}</b> التفسير: ${esc(c.cause)} <small>— ${esc(c.title)}</small>`;
        stage.querySelector(".gbody")!.appendChild(note);
        stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
        setTimeout(() => {
          if (round >= 100) stage.innerHTML = shell(result(score >= 700, "محلل اتجاهات!", `حصّلت ${score}/1000 في قراءة المنحنيات عبر 10 مستويات.`, "#/guide/chart"));
          else newRound();
        }, 2800);
      });
    });
  };
  newRound();
}

/* ------------------------------ 6) تحدي التخمين الجغرافي ------------------------------ */

interface Clue { answer: string; options: string[]; clues: string[] }

const CLUES: Clue[] = [
  { answer: "الاتحاد الأوروبي", options: ["الاتحاد الأوروبي", "النافتا", "آسيان", "السوق المشتركة"],
    clues: ["تكتل اقتصادي يضم 27 دولة", "عملة موحدة: اليورو", "أقوى اقتصاد جهوي في العالم", "مقره بروكسل"] },
  { answer: "الصحراء المغربية", options: ["الصحراء المغربية", "الصحراء الليبية", "الصحراء النفودية", "الصحراء"],
    clues: ["مناخ قاحل معروضات رملية", "ثروات فوسفاتية مهمة", "جزء من التراب الوطني المغربي", "مدن كبرى: العيون والداخلة"] },
  { answer: "الولايات المتحدة الأمريكية", options: ["الولايات المتحدة", "روسيا", "الصين", "الهند"],
    clues: ["أكبر اقتصاد في العالم", "أمة مهاجرين", "عاصمة وولشينغتون", "قوة بحرية وجوية عظمى"] },
  { answer: "حوض البحر الأبيض المتوسط", options: ["البحر الأبيض المتوسط", "البحر الأحمر", "المحيط الأطلسي", "بحر العرب"],
    clues: ["يفصل أوروبا عن أفريقيا", "مضيق جبل طارق عند مدخله", "حضارات قديمة على ضفافه", "تكتل الأورو-متوسطي حوله"] },
  { answer: "الصين", options: ["الصين", "اليابان", "كوريا الجنوبية", "الهند"],
    clues: ["أكبر عدد سكان في العالم", "ثاني اقتصاد عالمياً", "حزب شيوعي واحد", "نموذج «اشتراكية السوق»"] },
  { answer: "الأطلس المتوسط", options: ["الأطلس المتوسط", "الأطلس الكبير", "الأطلس الصغير", "جبال الريف"],
    clues: ["يمتد من طنجة إلى مراكش", "قممه تتجاوز 4000م", "ممرات تاريخية كطريق تداوت", "مناخ متوسطي جبلي"] },
];

function geoClueStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const newRound = () => {
    round++;
    const c = CLUES[(round - 1) % CLUES.length];
    let hint = 0;
    const draw = () => {
      stage.innerHTML = shell(`
        <div class="ginfo"><b>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10 — خمّن المجال</b><span>تلميح ${hint + 1}/${c.clues.length}: ${esc(c.clues[hint])}</span></div>
        <div class="chart-opts">
          ${c.options.map((o) => `<button class="chart-opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}
        </div>
        <div class="row" style="justify-content:center">
          <button class="btn ghost" id="clueMore" ${hint >= c.clues.length - 1 ? "disabled" : ""}>تلميح آخر (−5 نقاط)</button>
        </div>
        <div class="gscore-line">النقاط: ${score}</div>`,
        `<span>كلما خمّنت مبكراً ربحت أكثر</span>`);
      stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((b) => {
        b.addEventListener("click", () => {
          const ok = b.dataset.o === c.answer;
          score += ok ? Math.max(5, 20 - hint * 5) : 0;
          stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((x) => {
            if ((x as HTMLElement).dataset.o === c.answer) x.classList.add("is-right");
            else if (x === b) x.classList.add("is-wrong");
            x.disabled = true;
          });
          const note = document.createElement("div");
          note.className = "gfeedback";
          note.innerHTML = `<b>${ok ? "أصبت!" : "ليست الإجابة."}</b> ${esc(c.answer)} — ${esc(c.clues.join(" · "))}`;
          stage.querySelector(".gbody")!.appendChild(note);
          stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
          setTimeout(() => {
            if (round >= 100) stage.innerHTML = shell(result(score >= 800, "مستكشف جغرافي!", `حصّلت ${score}/1000 نقطة في التخمين الجغرافي عبر 10 مستويات.`, "#/games"));
            else newRound();
          }, 2400);
        });
      });
      document.getElementById("clueMore")?.addEventListener("click", () => {
        hint++;
        score = Math.max(0, score - 5);
        draw();
      });
    };
    draw();
  };
  newRound();
}

/* ------------------------------ 7) الروابط الخفية ------------------------------ */

interface LinkGroup { name: string; items: string[] }

const LINK_GROUPS: LinkGroup[] = [
  { name: "تكتلات اقتصادية كبرى", items: ["الاتحاد الأوروبي", "النافتا", "آسيان", "ميركوسور"] },
  { name: "مضائق وملاح بحرية حرجة", items: ["جبل طارق", "هرمز", "باب المندب", "الملقا"] },
  { name: "معسكرات الحرب الباردة", items: ["الاتحاد السوفياتي", "الولايات المتحدة", "حلف وارسو", "حلف شمال الأطلسي"] },
  { name: "محطات الثورة الفرنسية", items: ["اقتحام الباستيل", "إعلان حقوق الإنسان", "إعدام لويس السادس عشر", "العهد الكبير"] },
];

function linksStage(stage: HTMLElement) {
  let lvl = 1, groups = shuffle(LINK_GROUPS);
  let cards = shuffle(groups.flatMap((g) => g.items.map((t) => ({ t, g: g.name }))));
  const solved = new Set<string>();
  let sel: string[] = [], errors = 0;
  const reset = () => {
    groups = shuffle(LINK_GROUPS);
    cards = shuffle(groups.flatMap((g) => g.items.map((t) => ({ t, g: g.name }))));
    solved.clear(); sel = []; errors = 0;
  };

  const draw = () => {
    const remaining = cards.filter((c) => !solved.has(c.t));
    stage.innerHTML = shell(`
      <div class="ginfo"><b>صنّف البطاقات إلى مجموعات من 4</b><span>المستوى ${lvl} · مجموعات مكتشفة: ${solved.size / 4}/4 — أخطاء: ${errors}/4</span></div>
      <div class="links-grid">
        ${remaining.map((c) => `<button class="link-card ${sel.includes(c.t) ? "sel" : ""}" data-t="${esc(c.t)}">${esc(c.t)}</button>`).join("")}
        ${[...solved].map((t) => `<button class="link-card done" disabled>${esc(t)}</button>`).join("")}
      </div>
      <div class="row" style="justify-content:center">
        <button class="btn" id="linksOk" ${sel.length !== 4 ? "disabled" : ""}>تحقق</button>
        <button class="btn ghost" id="linksClr">مسح التحديد</button>
      </div>
      <div class="gscore-line">اختر 4 بطاقات لها رابط مشترك ثم اضغط «تحقق»</div>`,
      `<span>استلهام لعبة Connections</span>`);

    stage.querySelectorAll<HTMLButtonElement>(".link-card:not(.done)").forEach((b) => {
      b.addEventListener("click", () => {
        const t = b.dataset.t!;
        if (sel.includes(t)) sel = sel.filter((x) => x !== t);
        else if (sel.length < 4) sel.push(t);
        draw();
      });
    });
    document.getElementById("linksClr")?.addEventListener("click", () => { sel = []; draw(); });
    document.getElementById("linksOk")?.addEventListener("click", () => {
      const chosen = cards.filter((c) => sel.includes(c.t));
      const names = new Set(chosen.map((c) => c.g));
      if (names.size === 1) {
        chosen.forEach((c) => solved.add(c.t));
        sel = [];
        const gname = chosen[0].g;
        if (solved.size === 16) {
          if (lvl >= 10) {
            stage.innerHTML = shell(result(errors <= 2, "خبير الروابط!", `أكملت 10 مستويات — أخطاء ${errors} في الأخيرة. المجموعات: ${groups.map((g) => g.name).join("، ")}`, "#/guide"));
            return;
          }
          lvl++; reset();
          const lvlNote = document.createElement("div");
          lvlNote.className = "gfeedback ok";
          lvlNote.innerHTML = `<b>المستوى ${lvl}!</b> مجموعة جديدة بانتظارك`;
          stage.querySelector(".gbody")!.appendChild(lvlNote);
          setTimeout(draw, 1600);
          return;
        }
        draw();
        const note = document.createElement("div");
        note.className = "gfeedback ok";
        note.innerHTML = `<b>ممتاز!</b> المجموعة: ${esc(gname)}`;
        stage.querySelector(".gbody")!.appendChild(note);
      } else {
        errors++;
        sel = [];
        if (errors >= 4) {
          stage.innerHTML = shell(result(false, "المحاولة انتهت", `المجموعات هي: ${groups.map((g) => `${g.name} (${g.items.join("، ")})`).join(" — ")}`, "#/games"));
          return;
        }
        draw();
        const note = document.createElement("div");
        note.className = "gfeedback bad";
        note.innerHTML = `<b>ليست مجموعة واحدة.</b> فكّر في الرابط المشترك بين البطاقات`;
        stage.querySelector(".gbody")!.appendChild(note);
      }
    });
  };
  draw();
}

/* ------------------------------ 8) مهندس المقال ------------------------------ */

interface Essay { topic: string; intro: string; blocks: { t: string; ok: boolean }[] }

const ESSAYS: Essay[] = [
  { topic: "مظاهر وعوامل قوة الفلاحة المغربية",
    intro: "أطروحة: تتعدد مظاهر النشاط الفلاحي وتختلف عوامله بين المجال الجنوبي والمجال الشمالي.",
    blocks: [
      { t: "مقدمة: طرح الإشكال — كيف تتوزع مظاهر الفلاحة بين شمال المملكة وجنوبها؟", ok: true },
      { t: "عرض 1: المظاهر الفلاحية في الشمال — جبال الأطلس المتوسط والمجال الساحلي", ok: true },
      { t: "عرض 2: المظاهر الفلاحية في الجنوب — السهول الداخلية والسفوح الصحراوية", ok: true },
      { t: "تحليل: تفسير التباين — العوامل الطبيعية (التساقطات، التربة) والبشرية (الكثافة، القنوات)", ok: true },
      { t: "خاتمة: خلاصة + إعادة صياغة الإشكال بأفق تنموي", ok: true },
      { t: "دخيل: مراحل الحرب العالمية الأولى في أوروبا", ok: false },
      { t: "دخيل: مبيان تطور الصادرات اليابانية", ok: false },
    ] },
  { topic: "التكتلات الاقتصادية وأثرها على النظام العالمي",
    intro: "أطروحة: التكتلات تحرر التجارة داخل المجموعة لكنها تخلق تمايزاً مع الخارج.",
    blocks: [
      { t: "مقدمة: الإشكال — هل التكتل قوة للنمو أم حاجز للتبادل العالمي؟", ok: true },
      { t: "عرض 1: آليات التكامل — حرية تنقل السلع ورؤوس الأموال", ok: true },
      { t: "عرض 2: الأثر الإيجابي — نمو التجارة الداخلية ونقل التكنولوجيا", ok: true },
      { t: "عرض 3: الأثر السلبي — تمايز الأسعار مع الدول غير الأعضاء", ok: true },
      { t: "خاتمة: تقييم متوازن + موقع المغرب التفاوضي", ok: true },
      { t: "دخيل: مراحل الثورة الفرنسية 1789-1799", ok: false },
      { t: "دخيل: تعريف خط الاستواء ومداره", ok: false },
    ] },
];

function essayStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const newRound = () => {
    round++;
    const e = ESSAYS[(round - 1) % ESSAYS.length];
    const needed = e.blocks.filter((b) => b.ok);
    const pool = shuffle(e.blocks.map((b, i) => ({ ...b, i })));
    const used = new Set<number>();
    let placed = 0, errors = 0;

    const draw = () => {
      const slots = needed.map((_, i) =>
        placed > i
          ? `<div class="essay-slot filled">${esc(needed[i].t.slice(0, 42))}…</div>`
          : `<div class="essay-slot">${i + 1}</div>`,
      ).join("");
      stage.innerHTML = shell(`
        <div class="ginfo"><b>المستوى ${round} · الموضوع: ${esc(e.topic)}</b><span>${esc(e.intro)}</span></div>
        <div class="essay-slots">${slots}</div>
        <div class="links-grid essay-pool">
          ${pool.filter((b) => !used.has(b.i)).map((b) => `<button class="link-card" data-i="${b.i}">${esc(b.t.slice(0, 60))}${b.t.length > 60 ? "…" : ""}</button>`).join("")}
        </div>
        <div class="gscore-line">المواضع: ${placed}/${needed.length} — أخطاء: ${errors} — النقاط: ${score}</div>`,
        `<span>اضغط الكتلة الصحيحة بالترتيب المنهجي — الدخيل يُعاقَب</span>`);
      stage.querySelectorAll<HTMLButtonElement>(".essay-pool .link-card").forEach((btn) => {
        btn.addEventListener("click", () => {
          const b = pool.find((x) => x.i === Number(btn.dataset.i))!;
          if (!b.ok) { errors++; score = Math.max(0, score - 5); btn.classList.add("is-wrong"); setTimeout(draw, 500); return; }
          if (b.t !== needed[placed].t) { errors++; score = Math.max(0, score - 3); btn.classList.add("is-wrong"); setTimeout(draw, 500); return; }
          used.add(b.i);
          placed++;
          if (placed === needed.length) {
            score += 15;
            if (round >= 10) {
              stage.innerHTML = shell(result(errors <= 2, "مهندس مقال!", `أكملت 10 مستويات مقالية — ${score} نقطة.`, "#/guide"));
              return;
            }
            const note = document.createElement("div");
            note.className = "gfeedback ok";
            note.innerHTML = `<b>مقال مكتمل!</b> +15 — انتقل للموضوع التالي`;
            stage.querySelector(".gbody")!.appendChild(note);
            setTimeout(newRound, 1600);
            return;
          }
          draw();
        });
      });
    };
    draw();
  };
  newRound();
}

/* ------------------------------ 9) فك تشفير الخرائط ------------------------------ */

interface MapPuzzle { a: string; b: string; options: string[]; answer: number; lesson: string }

const MAP_PUZZLES: MapPuzzle[] = [
  { a: "خريطة الكثافة السكانية", b: "خريطة التساقطات المطرية",
    options: ["الكثافة العالية تقابل التساقطات المرتفعة — علاقة مباشرة", "الكثافة تتوزع عكس التساقطات تماماً", "لا علاقة بين الطبقتين", "الكثافة تتبع خطوط الطول فقط"], answer: 0, lesson: "العلاقة بين المكونات" },
  { a: "خريطة التجمعات الحضرية", b: "خريطة شبكة النقل",
    options: ["المدن الكبرى تتطور حيث تتقاطع محاور النقل", "المدن لا علاقة لها بالنقل", "المدن تنشأ عشوائياً", "النقل يتبع الكثافة فقط"], answer: 0, lesson: "التحضر والتنظيم المجالي" },
  { a: "خريطة أقاليم الصيد", b: "خريطة قرب الشواطئ",
    options: ["الصيد يتركز قرب الشواطئ حيث الثروة السمكية", "الصيد يبتعد عن الشواطئ", "الصيد عشوائي", "الشواطئ لا تؤثر"], answer: 0, lesson: "الأنشطة الساحلية" },
  { a: "خريطة الحدود قبل 1914", b: "خريطة الحدود بعد 1918",
    options: ["الحرب العالمية الأولى أعادت رسم خريطة أوروبا", "لم تتغير الحدود", "ازدادت الإمبراطوريات", "انهارت كل الدول"], answer: 0, lesson: "أوروبا بين الحربين" },
  { a: "خريطة المستعمرات 1914", b: "خريطة الاستقلالات بعد 1945",
    options: ["موجة الاستقلالات بعد الحرب العالمية الثانية", "لم تتغير الخريطة", "توسعت الإمبراطوريات", "ظهرت دول جديدة في أوروبا فقط"], answer: 0, lesson: "النظام العالمي الجديد" },
];

function mapxStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const newRound = () => {
    round++;
    const p = MAP_PUZZLES[(round - 1) % MAP_PUZZLES.length];
    const order = shuffle(p.options.map((_, i) => i));
    const opts = order.map((i) => p.options[i]);
    const ans = order.indexOf(p.answer);
    stage.innerHTML = shell(`
      <div class="ginfo"><b>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10 — فك شفرة الطبقات</b><span>طبقة أ × طبقة ب</span></div>
      <div class="map-layers">
        <div class="map-layer"><span class="map-layer-tag">أ</span> ${esc(p.a)}</div>
        <div class="map-layer"><span class="map-layer-tag">ب</span> ${esc(p.b)}</div>
      </div>
      <div class="chart-opts" style="grid-template-columns:1fr">
        ${opts.map((o, i) => `<button class="chart-opt" data-i="${i}">${esc(o)}</button>`).join("")}
      </div>
      <div class="gscore-line">النقاط: ${score}</div>`,
      `<span>حلل العلاقة بين الطبقتين</span>`);
    stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const ok = Number(b.dataset.i) === ans;
        if (ok) score += 12;
        stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((x) => {
          if (Number(x.dataset.i) === ans) x.classList.add("is-right");
          else if (x === b) x.classList.add("is-wrong");
          x.disabled = true;
        });
        const note = document.createElement("div");
        note.className = "gfeedback";
        note.innerHTML = `<b>${ok ? "تحليل صحيح!" : "إجابة غير دقيقة."}</b> ${esc(p.options[p.answer])} <small>— ${esc(p.lesson)}</small>`;
        stage.querySelector(".gbody")!.appendChild(note);
        stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
        setTimeout(() => {
          if (round >= 100) stage.innerHTML = shell(result(score >= 800, "محلل خرائط!", `حصّلت ${score}/1000 في فك تشفير الطبقات عبر 10 مستويات.`, "#/maps"));
          else newRound();
        }, 2600);
      });
    });
  };
  newRound();
}

/* ------------------------------ 10) مناظرة الأستاذ ------------------------------ */

const DEBATES = [
  { persona: "مدافع عن العولمة الليبرالية",
    thesis: "أنت تُجسّد رأياً يقول إن العولمة رفعت مستوى المعيشة عالمياً وأن التجارة الحرة تخدم الجميع. ناقشه بحجج الدرس: التفاوت بين الشمال والجنوب، أثر على الفلاحة المحلية، أزمات النظام المالي.",
    lesson: "lesson-g10" },
  { persona: "رئيس أمريكي في أزمات 1929",
    thesis: "أنت تقود الاقتصاد الأمريكي بعد انهيار بورصة وول ستريت. الطالب يحاورك عن السبيل للخروج من الكساد: تدخل الدولة أم السوق الحرة؟ استخدم معطيات درس الولايات المتحدة.",
    lesson: "lesson-us" },
];

function debateStage(stage: HTMLElement) {
  stage.innerHTML = shell(`
    <div class="ginfo"><b>اختر خصم المناظرة</b><span>ستحاور الشخصية — استخدم حجج الدرس لتقنعها</span></div>
    <div class="chart-opts" style="grid-template-columns:1fr">
      ${DEBATES.map((d, i) => `<button class="chart-opt" data-i="${i}"><b>${esc(d.persona)}</b><br><small style="opacity:.75">${esc(d.thesis.slice(0, 90))}…</small></button>`).join("")}
    </div>`,
    `<span>مناظرة تفاعلية</span>`);
  stage.querySelectorAll<HTMLButtonElement>(".chart-opt").forEach((b) => {
    b.addEventListener("click", () => runDebate(stage, DEBATES[Number(b.dataset.i)]));
  });
}

function runDebate(stage: HTMLElement, d: (typeof DEBATES)[number]) {
  let turns = 0;
  const draw = () => {
    stage.innerHTML = shell(`
      <div class="ginfo"><b>${esc(d.persona)}</b><span>${esc(d.thesis)}</span></div>
      <div class="debate-log" id="debLog">
        <div class="bubble teacher">سؤال لك: ما رأيك في قضايا الدرس؟ ابدأ حجّتك بأقوى معطى تجده في المحتوى.</div>
      </div>
      <div class="row" style="gap:8px">
        <input id="debInput" class="debate-input" placeholder="اكتب حجّتك…" maxlength="300">
        <button class="btn" id="debSend">${icon("send")}</button>
      </div>
      <div class="gscore-line">الأدوار: ${turns}/4 — ثم يقيّم الأستاذ قوة حججك</div>`,
      `<span>حوار مناظرة — 4 أدوار</span>`);
    const log = document.getElementById("debLog")!;
    const inp = document.getElementById("debInput") as HTMLInputElement;
    const send = async () => {
      const v = inp.value.trim();
      if (!v) return;
      inp.value = "";
      log.insertAdjacentHTML("beforeend", `<div class="bubble student">${esc(v)}</div>`);
      turns++;
      const thinking = document.createElement("div");
      thinking.className = "bubble teacher";
      thinking.textContent = "…";
      log.appendChild(thinking);
      log.scrollTop = log.scrollHeight;
      const reply = await Promise.resolve(askTutor(`مناظرة: أنت ${d.persona}. رد على هذا الرأي بجملتين قصيرتين كأنك في حوار مباشر، ثم اقترح سؤالاً مضاداً: ${v}`));
      thinking.textContent = reply.text;
      log.scrollTop = log.scrollHeight;
      stage.querySelector(".gscore-line")!.textContent = `الأدوار: ${Math.min(turns, 4)}/4`;
      if (turns >= 4) {
        const ev = await Promise.resolve(askTutor(`قيّم هذه المناظرة باختصار: ${d.persona} ضد حجج الطالب. أعطِ تقديراً من 10 وتوصية واحدة: آخر ما قيل «${v}»`));
        const note = document.createElement("div");
        note.className = "gfeedback";
        note.innerHTML = `<b>تقييم الأستاذ</b><br>${esc(ev.text)}`;
        stage.querySelector(".gbody")!.appendChild(note);
        inp.disabled = true;
        document.getElementById("debSend")?.setAttribute("disabled", "");
      }
    };
    document.getElementById("debSend")?.addEventListener("click", send);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
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
    else if (kind === "race") raceStage(stage);
    else if (kind === "geoclue") geoClueStage(stage);
    else if (kind === "links") linksStage(stage);
    else if (kind === "essay") essayStage(stage);
    else if (kind === "mapx") mapxStage(stage);
    else if (kind === "debate") debateStage(stage);
  }, 60);
  void t;
}
