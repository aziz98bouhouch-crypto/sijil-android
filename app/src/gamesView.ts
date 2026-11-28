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
  let round = 0, totalMistakes = 0, lastLesson = "";
  const usedSigs = new Set<string>();

  const newRound = () => {
    round++;
    const lvl0 = Math.floor((round - 1) / 10) + 1;
    const hardPool = lvl0 >= 8
      ? [...usable].sort((a, b) => (b.timeline?.length ?? 0) - (a.timeline?.length ?? 0)).slice(0, Math.max(3, Math.ceil(usable.length / 3)))
      : usable;
    let lesson = pick(hardPool);
    if (lesson.id === lastLesson && hardPool.length > 1) { do { lesson = pick(hardPool); } while (lesson.id === lastLesson); }
    lastLesson = lesson.id;
    const all = lesson.timeline ?? [];
    /* جولة فريدة: عيّنة فرعية من الأحداث — الحجم يكبر مع المستوى */
    const k = all.length > 5 ? Math.min(all.length, 5 + Math.floor(lvl0 / 4)) : Math.max(3, all.length - 1);
    let events = all, sig = "";
    for (let t = 0; t < 25; t++) {
      events = shuffle(all).slice(0, k);
      sig = lesson.id + ":" + events.map((e) => all.indexOf(e)).sort((a, b) => a - b).join(",");
      if (!usedSigs.has(sig)) break;
    }
    usedSigs.add(sig);
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
  const truePool = concepts.map((c) => ({ text: c.def, src: c.term }));
  const liePool = misconceptions.map((m) => ({ text: m.claim, fix: m.fix, src: m.id }));
  const usedSigs = new Set<string>();
  let round = 0, score = 0, current: typeof deck = [], lastLie = "";

  const newRound = () => {
    const lvl = Math.floor((round) / 10) + 1;
    const liesWanted = lvl >= 7 ? 2 : 1;
    let sig = "";
    for (let t = 0; t < 25; t++) {
      let lies = shuffle(liePool).slice(0, liesWanted);
      if (liesWanted === 1 && lies[0].src === lastLie) { const alt = pick(liePool.filter((l) => l.src !== lastLie)); lies = [alt]; }
      const trues = shuffle(truePool).slice(0, 4 - liesWanted);
      current = shuffle([...trues.map((x) => ({ text: x.text, lie: false, src: x.src })), ...lies.map((l) => ({ text: l.text, lie: true, fix: l.fix, src: l.src }))]);
      sig = current.map((c) => c.src).sort().join("|");
      if (!usedSigs.has(sig)) break;
    }
    usedSigs.add(sig);
    lastLie = current.find((c) => c.lie)!.src;
    const found = new Set<number>();
    round++;
    stage.innerHTML = shell(`
      <div class="ginfo"><b>وثيقة ${round}</b><span>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10 — ${current.length} عبارات، انقر على ${liesWanted > 1 ? "الجملتين المغلوطتين" : "الجملة المغلوطة"}</span></div>
      <div class="doc-paper">
        ${current.map((c, i) => `<button class="doc-line" data-i="${i}"><span class="doc-num">${i + 1}</span>${esc(c.text)}</button>`).join("")}
      </div>
      <div class="gscore-line">النقاط: ${score}${liesWanted > 1 ? ` — الأخطاء المتبقية: ${liesWanted}` : ""}</div>`,
      `<span>الوثائق لا تكذب — إلا ${liesWanted > 1 ? "جملتان مغلوطتان" : "جملة واحدة"}</span>`);
    stage.querySelectorAll<HTMLButtonElement>(".doc-line").forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.i);
        const c = current[idx];
        if (c.lie) {
          found.add(idx);
          score += 10;
          b.classList.add("is-lie");
          b.disabled = true;
          stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}${liesWanted > found.size ? ` — الأخطاء المتبقية: ${liesWanted - found.size}` : ""}`;
          const note = document.createElement("div");
          note.className = "gfeedback";
          note.innerHTML = `<b>أصبت!</b> التصحيح: ${esc(c.fix ?? "")} <small>— ${esc(c.src)}</small>`;
          stage.querySelector(".gbody")!.appendChild(note);
          if (found.size >= liesWanted) {
            stage.querySelectorAll<HTMLButtonElement>(".doc-line").forEach((x) => {
              const cc = current[Number(x.dataset.i)];
              if (cc.lie) x.classList.add("is-lie");
              else x.classList.add("is-true");
              x.disabled = true;
            });
            setTimeout(() => {
              if (round >= 100) {
                stage.innerHTML = shell(result(score >= 700, score >= 850 ? "محقق محترف!" : "تحقيق جيد", `حصّلت ${score}/1000 في كشف الأخطاء عبر 10 مستويات. راجع بطاقات المفاهيم في المعجم لتثبيت التصحيحات.`, "#/lexicon"));
              } else newRound();
            }, 2600);
          }
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

/* معطى إحصائي مولّد عشوائياً يناسب نوع المبيان — يجعل كل جولة فريدة */
function genSpec(chartType: string): string {
  const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  const pickN = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);
  const years = () => `${ri(1995, 2005)} ← ${ri(2006, 2015)} ← ${ri(2016, 2020)} ← ${ri(2021, 2025)}`;
  if (chartType === "مبيان بالمنحنى")
    return `تطور «${pick(["عدد السياح", "استهلاك الماء", "الناتج الزراعي", "درجة الحرارة", "عدد التلاميذ"])}» بالمغرب: ${years()} ← القيم: ${[ri(10, 40), ri(15, 50), ri(20, 60), ri(25, 70)].join(" ← ")} (بالمليون)`;
  if (chartType === "مبيان بالأعمدة")
    return `مقارنة «${pick(["عدد السكان", "المساحة", "الناتج المحلي", "عدد المدارس"])}» بين ${pickN(["الدار البيضاء", "فاس", "مراكش", "طنجة", "أكادير", "وجدة", "الرباط", "مكناس"], 4).join(" / ")}: ${[ri(10, 90), ri(10, 90), ri(10, 90), ri(10, 90)].join(" / ")} (بالألف)`;
  if (chartType === "مبيان بالأعمدة المزدوجة")
    return `مقارنة «${pick(["الصادرات والواردات", "الذكور والإناث", "الحضر والريف", "الإنتاج والاستهلاك"])}» لثلاث سنوات متتالية: ${[ri(20, 60), ri(25, 65), ri(30, 70)].join(" / ")} مقابل ${[ri(15, 55), ri(20, 60), ri(25, 65)].join(" / ")}`;
  if (chartType === "مبيان دائري (360°)")
    return `بنية «${pick(["مزيج الطاقة", "توزيع السكان", "مصادر الدخل", "نفقات الأسرة"])}»: ${ri(30, 50)}% + ${ri(20, 35)}% + ${ri(10, 25)}% + ${100 - (0)}% الباقي موزع على فئات أصغر`;
  return `بنية «${pick(["رأي الاستفتاء", "توزيع الأصوات", "نعم/لا", "موافق/معارض"])}» بخيارين رئيسيين ونسبتان فقط`;
}

function chartStage(stage: HTMLElement) {
  let round = 0, score = 0, lastChart = "";
  const types = CHART_TYPES.map((c) => c.type);

  const newRound = () => {
    round++;
    const lvl = Math.floor((round - 1) / 10) + 1;
    const hard = lvl >= 8;
    let correct = pick(CHART_TYPES);
    if (correct.type === lastChart) { do { correct = pick(CHART_TYPES); } while (correct.type === lastChart); }
    lastChart = correct.type;
    const distract = CHART_TYPES.filter((c) => c.type !== correct.type);
    /* المستويات الصعبة: 5 خيارات بدل 4 */
    const options = hard
      ? shuffle([correct, ...shuffle(distract).slice(0, 4)])
      : shuffle([correct, ...shuffle(distract).slice(0, 3)]);
    const spec = genSpec(correct.type);
    stage.innerHTML = shell(`
      <div class="ginfo"><b>المستوى ${lvl} · الجولة ${((round - 1) % 10) + 1}/10</b><span>أي مبيان تختار لتمثيل هذه المعطيات؟</span></div>
      <div class="doc-paper chart-q">
        <p class="chart-when">${esc(spec)}</p>
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
        const note = document.createElement("div");
        note.className = "gfeedback";
        note.innerHTML = `<b>${ok ? "صحيح!" : "المناسب: " + esc(correct.type)}</b> ${esc(correct.rules)}`;
        stage.querySelector(".gbody")!.appendChild(note);
        stage.querySelector(".gscore-line")!.textContent = `النقاط: ${score}`;
        setTimeout(() => {
          if (round >= 100) {
            stage.innerHTML = shell(result(score >= 800, "رسام مبيانات!", `حصّلت ${score}/1000 في اختيار المبيان عبر 10 مستويات.`, "#/guide/chart"));
          } else newRound();
        }, 2200);
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

const RACE_TITLES: { t: string; u: string }[] = [
  { t: "الناتج الداخلي الخام — POWER", u: "تريليون دولار" },
  { t: "نسبة التمدين — COUNTRY", u: "%" },
  { t: "نسبة مساهمة الفلاحة — COUNTRY", u: "%" },
  { t: "النمو السكاني — REGION", u: "% سنوياً" },
  { t: "استهلاك الطاقة — COUNTRY", u: "مليار طن معادل" },
  { t: "معدل البطالة — COUNTRY", u: "%" },
  { t: "نسبة الفئات العمرية — REGION", u: "%" },
  { t: "حجم التجارة الخارجية — COUNTRY", u: "مليار دولار" },
];
const RACE_POWER = ["الولايات المتحدة", "الصين", "فرنسا", "ألمانيا", "اليابان", "الهند", "البرازيل"];
const RACE_COUNTRY = ["المغرب", "مصر", "الجزائر", "تركيا", "إسبانيا", "إيطاليا", "كندا"];
const RACE_REGION = ["أفريقيا جنوب الصحراء", "العالم العربي", "الاتحاد الأوروبي", "آسيا الجنوبية", "أمريكا اللاتينية"];
const RACE_CAUSES: Record<"up" | "flat" | "down", string[]> = {
  up: ["نمو اقتصادي مستمر", "ازدياد الاستثمارات", "تحسن الظروف الدولية", "توسع الطلب العالمي"],
  flat: ["استقرار نسبي بلا صدمات", "توازن بين عوامل متعارضة", "مرحلة انتقالية هادئة"],
  down: ["أزمة مالية أو اقتصادية", "تراجع الطلب", "أزمة مناخية أو صحية", "اضطرابات جيوسياسية"],
};

function genRace(): RaceCard {
  const tpl = pick(RACE_TITLES);
  const title = tpl.t.replace("POWER", pick(RACE_POWER)).replace("COUNTRY", pick(RACE_COUNTRY)).replace("REGION", pick(RACE_REGION));
  const future = pick(["up", "flat", "down"] as const);
  const n = 6 + Math.floor(Math.random() * 3);
  let v = 15 + Math.floor(Math.random() * 40);
  const known = [v];
  for (let i = 1; i < n; i++) {
    v += Math.floor(Math.random() * 9) - 3;
    v = Math.max(3, v);
    known.push(v);
  }
  const others = (["up", "flat", "down"] as const).filter((d) => d !== future);
  return {
    title, unit: tpl.u, known, future,
    cause: pick(RACE_CAUSES[future]),
    options: shuffle([pick(RACE_CAUSES[future]), pick(RACE_CAUSES[others[0]]), pick(RACE_CAUSES[others[1]])]),
  };
}

interface RaceCard {
  title: string;
  unit: string;
  known: number[];
  future: "up" | "flat" | "down";
  cause: string;
  options: string[];
}

/* المصفوفة RACES حُذفت — genRace() يولّد سلاسل فريدة عشوائياً كل جولة */

function raceStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const W = 640, H = 200, pad = 24;
  const newRound = () => {
    round++;
    const base = genRace();
    const lvl = Math.floor((round - 1) / 10) + 1;
    const c = lvl >= 8 ? { ...base, known: base.known.slice(0, -1) } : base;
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
  { answer: "الولايات المتحدة", options: ["الولايات المتحدة", "روسيا", "الصين", "الهند"],
    clues: ["أكبر اقتصاد في العالم", "أمة مهاجرين", "عاصمة وولشينغتون", "قوة بحرية وجوية عظمى"] },
  { answer: "البحر الأبيض المتوسط", options: ["البحر الأبيض المتوسط", "البحر الأحمر", "المحيط الأطلسي", "بحر العرب"],
    clues: ["يفصل أوروبا عن أفريقيا", "مضيق جبل طارق عند مدخله", "حضارات قديمة على ضفافه", "تكتل الأورو-متوسطي حوله"] },
  { answer: "الصين", options: ["الصين", "اليابان", "كوريا الجنوبية", "الهند"],
    clues: ["ثاني أكبر عدد سكان في العالم", "ثاني اقتصاد عالمياً", "حزب شيوعي واحد", "نموذج «اشتراكية السوق»"] },
  { answer: "الأطلس المتوسط", options: ["الأطلس المتوسط", "الأطلس الكبير", "الأطلس الصغير", "جبال الريف"],
    clues: ["يمتد من طنجة إلى مراكش", "قممه تتجاوز 4000م", "ممرات تاريخية كطريق تداوت", "مناخ متوسطي جبلي"] },
  { answer: "معاهدة وستفاليا", options: ["معاهدة وستفاليا", "معاهدة فرساي", "اتفاقية مونسو", "ميثاق الأمم المتحدة"],
    clues: ["عام 1648", "أنهت حرب الثلاثين عاماً", "كرّست مبدأ سيادة الدولة", "أعادت رسم خريطة أوروبا"] },
  { answer: "الثورة الصناعية", options: ["الثورة الصناعية", "الثورة الفرنسية", "الثورة الروسية", "الثورة الخضراء"],
    clues: ["بدأت في بريطانيا القرن 18", "الآلة البخارية محورها", "التحول من فلاحي لأجراء", "أسست النظام الرأسمالي"] },
  { answer: "نهر الأمازون", options: ["نهر الأمازون", "نهر النيل", "نهر الكونغو", "نهر الميسيسيبي"],
    clues: ["أكبر نهر من حيث التصريف في العالم", "يقع في أمريكا الجنوبية", "تحيطه الغابات الاستوائية", "ينبع في بيرو"] },
  { answer: "حلف وارسو", options: ["حلف وارسو", "حلف الأطلسي", "الاتحاد الأوروبي", "السوق المشتركة"],
    clues: ["نشأ 1955", "المعسكر الشرقي في الحرب الباردة", "كان مقابلاً لحلف الناتو", "انهار مع تفكك الاتحاد السوفياتي"] },
  { answer: "بحر قزوين", options: ["بحر قزوين", "البحر الأحمر", "بحر العرب", "البحر الميت"],
    clues: ["أكبر بحيرة مالحة في العالم", "تقع بين أوروبا وآسيا", "غني باحتياطيات النفط", "لا يصب فيه أي نهر"] },
  { answer: "الحرب العالمية الأولى", options: ["الحرب العالمية الأولى", "الحرب العالمية الثانية", "حرب الثلاثين عاماً", "حرب المئة عام"],
    clues: ["1914-1918", "انطلقت من سراييفو", "استخدمت الدبابات والغازات", "أنهتها معاهدة فرساي"] },
  { answer: "الصحراء", options: ["الصحراء", "غوبي", "كالاهاري", "أتاكاما"],
    clues: ["أكبر صحراء حارة في العالم", "تمتد عبر شمال أفريقيا", "تشمل دولاً كثيرة", "مناخها قاحل"] },
  { answer: "نهر النيل", options: ["نهر النيل", "نهر الأمازون", "نهر الكونغو", "نهر الدانوب"],
    clues: ["أطول نهر في العالم", "يمر بمصر والسودان", "على ضفافه حضارة قديمة", "مصبه دلتا واسعة"] },
  { answer: "معاهدة فرساي", options: ["معاهدة فرساي", "معاهدة وستفاليا", "اتفاقية مونسو", "ميثاق الأمم المتحدة"],
    clues: ["عام 1919", "أنهت الحرب العالمية الأولى رسمياً", "فرضت تعويضات على ألمانيا", "من أسباب الحرب العالمية الثانية"] },
  { answer: "قناة بنما", options: ["قناة بنما", "قناة السويس", "مضيق جبل طارق", "قناة كورنث"],
    clues: ["تقسم أمريكا الوسطى", "تختصر الطريق البحري بين المحيطين", "افتتحت سنة 1914", "تدار بشراكة دولية"] },
];

function geoClueStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const usedIdx = new Set<number>();
  const newRound = () => {
    round++;
    const ci = (() => { if (usedIdx.size >= CLUES.length) usedIdx.clear(); let i: number; do { i = Math.floor(Math.random() * CLUES.length); } while (usedIdx.has(i)); usedIdx.add(i); return i; })();
    const c = CLUES[ci];
    const lvl = Math.floor((round - 1) / 10) + 1;
    const hintCost = lvl >= 8 ? 8 : 5;
    let hint = 0;
    const draw = () => {
      stage.innerHTML = shell(`
        <div class="ginfo"><b>المستوى ${Math.floor((round - 1) / 10) + 1} · الجولة ${((round - 1) % 10) + 1}/10 — خمّن المجال</b><span>تلميح ${hint + 1}/${c.clues.length}: ${esc(c.clues[hint])}</span></div>
        <div class="chart-opts">
          ${c.options.map((o) => `<button class="chart-opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}
        </div>
        <div class="row" style="justify-content:center">
          <button class="btn ghost" id="clueMore" ${hint >= c.clues.length - 1 ? "disabled" : ""}>تلميح آخر (−${hintCost} نقاط)</button>
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
        score = Math.max(0, score - hintCost);
        draw();
      });
    };
    draw();
  };
  newRound();
}

/* ------------------------------ 7) الروابط الخفية ------------------------------ */

interface LinkGroup { name: string; items: string[] }

/* كل set = لوحة ألغاز كاملة (4 مجموعات × 4 بطاقات) — كل مستوى يسحب set مختلفاً */
const LINK_SETS: LinkGroup[][] = [
  [
    { name: "تكتلات اقتصادية كبرى", items: ["الاتحاد الأوروبي", "النافتا", "آسيان", "ميركوسور"] },
    { name: "مضائق وملاح بحرية حرجة", items: ["جبل طارق", "هرمز", "باب المندب", "الملقا"] },
    { name: "معسكرات الحرب الباردة", items: ["الاتحاد السوفياتي", "الولايات المتحدة", "حلف وارسو", "حلف شمال الأطلسي"] },
    { name: "محطات الثورة الفرنسية", items: ["اقتحام الباستيل", "إعلان حقوق الإنسان", "إعدام لويس السادس عشر", "العهد الكبير"] },
  ],
  [
    { name: "أنهار كبرى في العالم", items: ["الأمازون", "النيل", "الكونغو", "الدانوب"] },
    { name: "صحاري العالم الكبرى", items: ["الصحراء الكبرى", "غوبي", "كالاهاري", "أتاكاما"] },
    { name: "أزمنة التاريخ", items: ["العصور القديمة", "العصور الوسطى", "العصر الحديث", "العصر المعاصر"] },
    { name: "هيئات أممية", items: ["مجلس الأمن", "الجمعية العامة", "الأمانة العامة", "محكمة العدل الدولية"] },
  ],
  [
    { name: "مصادر الطاقة", items: ["النفط", "الغاز الطبيعي", "الفحم", "الطاقة الشمسية"] },
    { name: "محاصيل زراعية كبرى", items: ["القمح", "الأرز", "الذرة", "الصويا"] },
    { name: "معادن خام", items: ["الحديد", "النحاس", "الذهب", "الفوسفات"] },
    { name: "قارات العالم", items: ["آسيا", "أفريقيا", "أوروبا", "أمريكا"] },
  ],
  [
    { name: "ثورات كبرى", items: ["الثورة الفرنسية", "الثورة الروسية", "الثورة الصناعية", "الثورة الثقافية الصينية"] },
    { name: "عواصم كبرى", items: ["واشنطن", "موسكو", "بكين", "بروكسل"] },
    { name: "تكتلات عسكرية", items: ["الناتو", "حلف وارسو", "الجيش المغربي", "الاتحاد الأفريقي"] },
    { name: "لغات العالم الرسمية", items: ["العربية", "الفرنسية", "الإنجليزية", "الإسبانية"] },
  ],
  [
    { name: "محيطات وبحار", items: ["الأطلسي", "الهادئ", "الهندي", "المتجمد الشمالي"] },
    { name: "أنظمة سياسية", items: ["الملكية الدستورية", "الجمهورية", "الأنظمة الاشتراكية", "الأنظمة الملكية المطلقة"] },
    { name: "فترات زمنية", items: ["ما قبل التاريخ", "القديم", "الوسيط", "الحديث"] },
    { name: "أوسمة وجوائز", items: ["نوبل", "وسام الاستحقاق", "جائزة", "ميدالية"] },
  ],
  [
    { name: "كتل اقتصادية", items: ["الاتحاد الأوروبي", "مجلس التعاون الخليجي", "السوق المشتركة", "آسيان"] },
    { name: "ثورات تحريرية", items: ["الثورة الصناعية", "الثورة الفرنسية", "الثورة الثقافية الصينية", "ثورة البخار"] },
    { name: "مناطق تكامل", items: ["منطقة الشنغن", "منطقة اليورو", "المنطقة الاقتصادية الأوروبية", "منطقة حرة"] },
    { name: "شخصيات تاريخية", items: ["نابليون", "غاندي", "ماندلا", "نيرون"] },
  ],
];

function linksStage(stage: HTMLElement) {
  let lvl = 1, groups: LinkGroup[] = [];
  let cards: { t: string; g: string }[] = [];
  const usedSets = new Set<number>();
  const solved = new Set<string>();
  let sel: string[] = [], errors = 0;
  const deal = () => {
    if (usedSets.size >= LINK_SETS.length) usedSets.clear();
    let si: number;
    do { si = Math.floor(Math.random() * LINK_SETS.length); } while (usedSets.has(si));
    usedSets.add(si);
    groups = LINK_SETS[si];
    cards = shuffle(groups.flatMap((g) => g.items.map((t) => ({ t, g: g.name }))));
  };
  deal();
  const reset = () => {
    deal();
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
        if (errors >= (lvl >= 8 ? 2 : 4)) {
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

/* كتل دخيلة مشتركة — تُسحب عشوائياً كل مستوى فتبقى التوليفة مختلفة */
const EXTRA_BLOCKS = [
  "دخيل: مراحل الحرب الباردة 1947-1991",
  "دخيل: تعريف خط الاستواء ومداره",
  "دخيل: مبيان أعمدة لتطور الصادرات 1990-2020",
  "دخيل: معاهدة فرساي وبنودها",
  "دخيل: طبقات الغلاف الجوي وخصائصها",
  "دخيل: مراحل الثورة الفرنسية 1789-1799",
  "دخيل: مكونات النظام البيئي البحري",
  "دخيل: الحرب العالمية الأولى — الجبهات والأطراف",
  "دخيل: التيارات البحرية الرئيسية",
  "دخيل: أزمة 1929 والكساد الكبير",
].map((t) => ({ t, ok: false }));

function essayStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const newRound = () => {
    round++;
    const e = ESSAYS[(round - 1) % ESSAYS.length];
    const needed = e.blocks.filter((b) => b.ok);
    const extraCount = round >= 8 ? 3 : 2;
    const extra = shuffle(EXTRA_BLOCKS).slice(0, extraCount);
    const pool = shuffle([...e.blocks, ...extra].map((b, i) => ({ ...b, i })));
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

interface MapPuzzle { a: string; b: string; options: string[]; answer: number; lesson: string; hard?: string }

const MAP_PUZZLES: MapPuzzle[] = [
  { a: "خريطة الكثافة السكانية", b: "خريطة التساقطات المطرية",
    options: ["الكثافة العالية تقابل التساقطات المرتفعة — علاقة مباشرة", "الكثافة تتوزع عكس التساقطات تماماً", "لا علاقة بين الطبقتين", "الكثافة تتبع خطوط الطول فقط"], answer: 0, lesson: "العلاقة بين المكونات", hard: "الكثافة مرتفعة حيث التساقطات متوسطة — العلاقة غير مباشرة" },
  { a: "خريطة التجمعات الحضرية", b: "خريطة شبكة النقل",
    options: ["المدن الكبرى تتطور حيث تتقاطع محاور النقل", "المدن لا علاقة لها بالنقل", "المدن تنشأ عشوائياً", "النقل يتبع الكثافة فقط"], answer: 0, lesson: "التحضر والتنظيم المجالي", hard: "المدن تنجذب للموانئ فقط دون المحاور البرية" },
  { a: "خريطة أقاليم الصيد", b: "خريطة قرب الشواطئ",
    options: ["الصيد يتركز قرب الشواطئ حيث الثروة السمكية", "الصيد يبتعد عن الشواطئ", "الصيد عشوائي", "الشواطئ لا تؤثر"], answer: 0, lesson: "الأنشطة الساحلية", hard: "الصيد يتركز في عرض البحر البعيد" },
  { a: "خريطة الحدود قبل 1914", b: "خريطة الحدود بعد 1918",
    options: ["الحرب العالمية الأولى أعادت رسم خريطة أوروبا", "لم تتغير الحدود", "ازدادت الإمبراطوريات", "انهارت كل الدول"], answer: 0, lesson: "أوروبا بين الحربين", hard: "الحرب العالمية الأولى لم تغير الحدود الأوروبية" },
  { a: "خريطة المستعمرات 1914", b: "خريطة الاستقلالات بعد 1945",
    options: ["موجة الاستقلالات بعد الحرب العالمية الثانية", "لم تتغير الخريطة", "توسعت الإمبراطوريات", "ظهرت دول جديدة في أوروبا فقط"], answer: 0, lesson: "النظام العالمي الجديد", hard: "الاستقلالات وقعت كلها قبل 1945" },
  { a: "خريطة العالم قبل 1914", b: "خريطة العالم بعد 1945",
    options: ["الحربان العالميتان أعادتا رسم الخريطة السياسية", "لم تتغير الخريطة إطلاقاً", "ازدادت الإمبراطوريات الأوروبية", "ظهرت القارات الخمس"], answer: 0, lesson: "النظام العالمي", hard: "الإمبراطوريات الأوروبية توسعت بعد 1945" },
  { a: "خريطة المناخ", b: "خريطة أنواع الزراعة",
    options: ["المناخ يحدد نوع الزراعة الممكن في كل منطقة", "الزراعة لا علاقة لها بالمناخ", "المناخ عشوائي بلا نمط", "الزراعة تتبع الحدود السياسية فقط"], answer: 0, lesson: "العوامل الطبيعية", hard: "الزراعة تتبع الحدود السياسية" },
  { a: "خريطة الإمبراطورية الرومانية", b: "خريطة اليونان القديمة",
    options: ["روما ورثت الحضارة اليونانية ووسعتها", "روما قطعت كل صلة باليونان", "اليونان احتلت روما عسكرياً", "الحضارتان لا صلة بينهما"], answer: 0, lesson: "الحضارة اليونانية الرومانية", hard: "روما قطعت كل صلة باليونان" },
  { a: "خريطة المغرب الطبيعي", b: "خريطة المدن المغربية",
    options: ["المدن الكبرى تتجمع قرب السواحل والسهول لا في الجبال", "المدن تتوزع بالتساوي على كل التضاريس", "المدن تتركز في المناطق الجبلية", "السواحل خالية من المدن"], answer: 0, lesson: "التعمير", hard: "المدن تتركز في المناطق الجبلية" },
  { a: "خريطة الأقاليم المناخية", b: "خريطة الكثافة السكانية",
    options: ["السكان يتركزون في الأقاليم المعتدلة والمناطق الساحلية", "السكان يتوزعون بالتساوي على كل المناخات", "السكان يتركزون في الصحاري الحارة", "المناخ لا يؤثر في التوزيع السكاني"], answer: 0, lesson: "العوامل الطبيعية", hard: "السكان يتركزون في الصحاري الحارة" },
  { a: "خريطة الاتحاد الأوروبي", b: "خريطة النافتا",
    options: ["الاتحاد الأوروبي أوسع مساحة وأعضاؤه أكثر تنوعاً", "النافتا أوسع من الاتحاد الأوروبي", "التكتلان متطابقان", "النافتا أوروبية والاتحاد أمريكي"], answer: 0, lesson: "التكتلات", hard: "النافتا أوسع من الاتحاد الأوروبي" },
  { a: "خريطة الثروة المعدنية", b: "خريطة الصناعة",
    options: ["الصناعة تتركز قرب مناطق استخراج المعادن", "الصناعة عشوائية بلا علاقة", "المعادن لا تؤثر في الصناعة", "الصناعة تتبع الحدود فقط"], answer: 0, lesson: "العوامل الاقتصادية", hard: "الصناعة تتبع الحدود فقط" },
  { a: "خريطة شبكات النقل", b: "خريطة المبادلات", options: ["المبادلات تتبع محاور النقل الرئيسية", "المبادلات عشوائية", "النقل لا يؤثر", "المبادلات تتبع خطوط الطول"], answer: 0, lesson: "التبادلات", hard: "المبادلات عشوائية" },
];

function mapxStage(stage: HTMLElement) {
  let round = 0, score = 0;
  const usedIdx = new Set<number>();
  const newRound = () => {
    round++;
    const pi = (() => { if (usedIdx.size >= MAP_PUZZLES.length) usedIdx.clear(); let i: number; do { i = Math.floor(Math.random() * MAP_PUZZLES.length); } while (usedIdx.has(i)); usedIdx.add(i); return i; })();
    const p = MAP_PUZZLES[pi];
    const lvl = Math.floor((round - 1) / 10) + 1;
    const order = shuffle(p.options.map((_, i) => i));
    const opts = order.map((i) => p.options[i]);
    if (lvl >= 8 && p.hard) opts.push(p.hard);
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
