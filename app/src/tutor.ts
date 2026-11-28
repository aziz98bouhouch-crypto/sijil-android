/**
 * عقل الأستاذ: إجابات عربية مبنية على محتوى التطبيق
 * (الدروس + المعجم + الدليل المنهجي + الخرائط + الموسوعة)،
 * مع بحث ويب اختياري عند عدم توفر جواب محلي.
 */
import content from "./content.json";
import type { Concept, Content, Item, Lesson } from "./types";
import { CONCEPTS, ESSAY_SCORING, ESSAY_STRUCTURE, RUBRIC_3_7, TOPICS, CHART_TYPES } from "./guide";
import { MAPS } from "./maps";
import { ENCYCLOPEDIA, type EncyclopediaEntry } from "./encyclopedia";
import { stats } from "./store";

const data = content as unknown as Content;
const lessons = data.lessons;
const concepts = data.lexicon.concepts;
const misconceptions = new Map(data.lexicon.misconceptions.map((m) => [m.id, m]));

export interface TutorRef {
  label: string;
  href: string;
}

export interface TutorReply {
  text: string;
  refs?: TutorRef[];
  followups?: string[];
  mood?: "happy" | "explain" | "thinking" | "listening";
  /** true حين لا يجد المحتوى المحلي جواباً — يسمح للواجهة بتجربة بحث الويب. */
  miss?: boolean;
}

/* ------------------------------ تطبيع اللغة ------------------------------ */

const STOP = new Set(
  "من في على عن الى إلى ما هو هي هل كيف لماذا لمادا اشرح لي اريد أريد ممكن لو سمحت استاذ الاستاذ استاذي يا و او أو ثم كل هذا هذه ذلك التي الذي ان أن لا نعم كنت يكون انا أنا انت أنت نحن هم مع بدون عند لدى قد لقد كان كانت كما بين قبل بعد حول أي اي وشكرا شكرا مرحبا سلام".split(
    /\s+/,
  ),
);

const norm = (s: string) =>
  s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const words = (s: string) =>
  norm(s)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t));

/* ------------------------------ فهرس المعرفة ------------------------------ */

interface Chunk {
  kind: "lesson" | "concept" | "guide" | "map" | "encyclopedia";
  title: string;
  heading: string;
  text: string;
  href: string;
  lessonId?: string;
  guideId?: string;
  concept?: Concept;
  entry?: EncyclopediaEntry;
  tokens: Set<string>;
  titleTokens: Set<string>;
}

const chunks: Chunk[] = [];

const add = (c: Omit<Chunk, "tokens" | "titleTokens">) => {
  const tokens = new Set(words(c.title + " " + c.heading + " " + c.text));
  chunks.push({ ...c, tokens, titleTokens: new Set(words(c.title + " " + c.heading)) });
};

for (const l of lessons) {
  add({
    kind: "lesson",
    title: l.title,
    heading: "تقديم الدرس وإشكاليته",
    text: `${l.context} الإشكالية: ${l.problemStatement} ${l.problematics?.join(" ") ?? ""}`,
    href: `#/lesson/${l.id}`,
    lessonId: l.id,
  });
  for (const a of l.axes ?? []) {
    add({
      kind: "lesson",
      title: l.title,
      heading: a.title,
      text: `${a.title}. ${a.subAxes.join(". ")}`,
      href: `#/lesson/${l.id}`,
      lessonId: l.id,
    });
  }
  add({
    kind: "lesson",
    title: l.title,
    heading: "أهداف الدرس",
    text: (l.objectives ?? []).join("؛ "),
    href: `#/lesson/${l.id}`,
    lessonId: l.id,
  });
  add({
    kind: "lesson",
    title: l.title,
    heading: "خلاصة الدرس",
    text: l.closing,
    href: `#/lesson/${l.id}`,
    lessonId: l.id,
  });
  if (l.timeline?.length) {
    add({
      kind: "lesson",
      title: l.title,
      heading: "الخط الزمني",
      text: l.timeline.map((t) => `${t.date}: ${t.label}`).join(" — "),
      href: `#/lesson/${l.id}`,
      lessonId: l.id,
    });
  }
  if (l.matrix) {
    add({
      kind: "lesson",
      title: l.title,
      heading: l.matrix.title,
      text: l.matrix.rows.map((r) => `${r.label}: ${r.cells.join(" / ")}`).join(" — "),
      href: `#/lesson/${l.id}`,
      lessonId: l.id,
    });
  }
  for (const d of l.documents ?? []) {
    add({
      kind: "lesson",
      title: l.title,
      heading: `وثيقة: ${d.title}`,
      text: [d.caption, d.body, ...(d.questions ?? []).map((q) => `${q.q} ${q.modelAnswer}`)].filter(Boolean).join(" "),
      href: `#/lesson/${l.id}`,
      lessonId: l.id,
    });
  }
  for (const e of l.essayPrompts ?? []) {
    add({
      kind: "lesson",
      title: l.title,
      heading: "موضوع مقالي",
      text: `${e.prompt} الخطة: ${e.plan.join("؛ ")}`,
      href: `#/lesson/${l.id}`,
      lessonId: l.id,
    });
  }
}

for (const c of concepts) {
  const mis = (c.misconceptions ?? []).map((id) => misconceptions.get(id)).filter(Boolean);
  const extra = [
    c.when ? `الزمن: ${c.when}.` : "",
    c.where ? `المكان: ${c.where}.` : "",
    c.actors?.length ? `الفاعلون: ${c.actors.join("، ")}.` : "",
    ...mis.map((m) => `الخطأ الشائع: «${m!.claim}» — ${m!.fix}`),
  ]
    .filter(Boolean)
    .join(" ");
  add({
    kind: "concept",
    title: c.term,
    heading: c.type ?? "مفهوم",
    text: `${c.def} ${extra}`,
    href: `#/lexicon?q=${encodeURIComponent(c.term)}`,
    concept: c,
  });
}

for (const g of CONCEPTS) {
  add({
    kind: "concept",
    title: g.term,
    heading: "تعريف مقرر",
    text: g.def,
    href: `#/lexicon?q=${encodeURIComponent(g.term)}`,
  });
}

for (const t of TOPICS) {
  const parts = [
    t.intro,
    ...t.steps.map((s) => `${s.title}: ${s.text}`),
    ...(t.pitfalls ?? []).map((p) => `تجنب: ${p}`),
    `مثال: ${t.example.prompt} ${t.example.solution}`,
  ];
  add({
    kind: "guide",
    title: t.title,
    heading: "الدليل المنهجي",
    text: parts.join(" "),
    href: `#/guide/${t.id}`,
    guideId: t.id,
  });
}

add({
  kind: "guide",
  title: "خطوات المقال",
  heading: "المقدمة والعرض والخاتمة",
  text: ESSAY_STRUCTURE.map((s) => `${s.stage}: التاريخ — ${s.history} الجغرافيا — ${s.geography}`).join(" "),
  href: "#/guide",
});

add({
  kind: "guide",
  title: "شبكة التنقيط",
  heading: "تنقيط المقال والوثائق",
  text:
    ESSAY_SCORING.map((s) => `${s.part} (${s.points}): ${s.criteria.join("؛ ")}`).join(" ") +
    " " +
    RUBRIC_3_7.map((r) => `${r.axis} ${r.points} نقط: التاريخ ${r.history} الجغرافيا ${r.geography}`).join(" "),
  href: "#/guide",
});

add({
  kind: "guide",
  title: "اختيار المبيان",
  heading: "المنحنى والأعمدة والدائري",
  text: CHART_TYPES.map((c) => `${c.type}: ${c.when} ${c.rules}`).join(" "),
  href: "#/guide",
});

for (const m of MAPS) {
  add({
    kind: "map",
    title: m.title,
    heading: "تمرين توطين تفاعلي",
    text: `${m.instruction} ${m.note} ${m.targets.map((t) => `${t.name}: ${t.hint}`).join(" ")}`,
    href: `#/maps/${m.id}`,
  });
}

const conceptTerms = new Set(concepts.map((c) => norm(c.term)));

for (const e of ENCYCLOPEDIA) {
  add({
    kind: "encyclopedia",
    title: e.term,
    heading: e.kind,
    text: `${e.def}${e.when ? ` الزمن: ${e.when}.` : ""}${e.where ? ` المكان: ${e.where}.` : ""}`,
    href: `#/lexicon?q=${encodeURIComponent(e.term)}`,
    entry: e,
  });
}

/* ------------------------------ البحث ------------------------------ */

const df = new Map<string, number>();
for (const c of chunks) for (const t of c.tokens) df.set(t, (df.get(t) ?? 0) + 1);
const idf = (t: string) => Math.log((chunks.length + 1) / ((df.get(t) ?? 0) + 1)) + 0.25;

const uniq = <T,>(a: T[]): T[] => [...new Set(a)];

function ranked(query: string, kind?: Chunk["kind"]): { chunk: Chunk; score: number }[] {
  const qt = uniq(words(query));
  if (!qt.length) return [];
  const qn = norm(query);
  const out = [];
  for (const c of chunks) {
    if (kind && c.kind !== kind) continue;
    let s = 0;
    for (const t of qt) {
      if (c.titleTokens.has(t)) s += 2.6 * idf(t);
      else if (c.tokens.has(t)) s += idf(t);
    }
    if (qn.length > 7 && norm(c.title + " " + c.text).includes(qn)) s += 4;
    if (s > 0) out.push({ chunk: c, score: s });
  }
  return out.sort((a, b) => b.score - a.score);
}

const lessonById = new Map(lessons.map((l) => [l.id, l]));

/**
 * دقة مدخلات الموسوعة: تتطلب كلمتين متميزتين على الأقل من الاستعلام داخل
 * المدخل، أو ورود مصطلحه (أو جزء مميز منه) حرفياً في السؤال.
 * يمنع اختطاف إجابات بدلالة حرف مشترك واحد مثل «القديمة».
 */
function encScoreOk(input: string, c: Chunk): boolean {
  if (!c.entry) return false;
  const qt = new Set(words(input));
  let hits = 0;
  for (const t of qt) if (c.tokens.has(t)) hits++;
  if (hits >= 2) return true;
  const n = norm(input);
  const nt = norm(c.entry.term);
  return nt.length > 4 && (n.includes(nt) || nt.includes(n));
}

const topEncyclopedia = (input: string) =>
  ranked(input, "encyclopedia").find((h) => encScoreOk(input, h.chunk));

function lessonMatch(query: string): Lesson | undefined {
  const hits = ranked(query, "lesson");
  const best = hits[0];
  if (!best || best.score < 1.4) return undefined;
  return best.chunk.lessonId ? lessonById.get(best.chunk.lessonId) : undefined;
}

/* ------------------------------ صياغة الإجابات ------------------------------ */

const refOf = (c: Chunk): TutorRef => ({ label: c.title, href: c.href });
const dedupeRefs = (refs: TutorRef[]): TutorRef[] => {
  const seen = new Map<string, TutorRef>();
  for (const r of refs) if (!seen.has(r.href)) seen.set(r.href, r);
  return [...seen.values()];
};

function conceptReply(c: Concept): TutorReply {
  const mis = (c.misconceptions ?? []).map((id) => misconceptions.get(id)).filter(Boolean);
  const lines = [`«${c.term}»${c.type ? ` (${c.type})` : ""}: ${c.def}`];
  if (c.when || c.where) lines.push([c.when && `الزمن: ${c.when}`, c.where && `المكان: ${c.where}`].filter(Boolean).join(" · "));
  if (c.actors?.length) lines.push(`الفاعلون: ${c.actors.join("، ")}.`);
  if (mis.length) lines.push(`انتبه للخطأ الشائع: «${mis[0]!.claim}» — ${mis[0]!.fix}`);
  return {
    text: lines.join("\n"),
    refs: [{ label: `بطاقة «${c.term}» في المعجم`, href: `#/lexicon?q=${encodeURIComponent(c.term)}` }],
    followups: ["أعطني مثالاً على هذا المفهوم", "ما الخطأ الشائع فيه؟", "اختبرني في هذا الدرس"],
    mood: "explain",
  };
}

function lessonSummary(l: Lesson, focus?: string): TutorReply {
  const lines = [`درس «${l.title}» (${l.module} · ${l.unit}).`, l.context, `الإشكالية: ${l.problemStatement}`];
  const axes = (l.axes ?? []).map((a, i) => `${i + 1}. ${a.title}`).join("\n");
  if (axes) lines.push(`المحاور:\n${axes}`);
  const obj = (l.objectives ?? []).slice(0, 3);
  if (obj.length) lines.push(`الأهداف: ${obj.join("؛ ")}.`);
  lines.push(`الخلاصة: ${l.closing}`);
  if (focus) {
    const hit = ranked(focus, "lesson").find((h) => h.chunk.lessonId === l.id);
    if (hit) lines.push(`بخصوص سؤالك: ${hit.chunk.heading} — ${hit.chunk.text}`);
  }
  return {
    text: lines.join("\n"),
    refs: [{ label: l.title, href: `#/lesson/${l.id}` }],
    followups: ["أعطني الخط الزمني", "ما مفاهيم هذا الدرس؟", "اختبرني فيه", "كيف أجيب عن مقال حوله؟"],
    mood: "explain",
  };
}

function guideReply(g: (typeof TOPICS)[number]): TutorReply {
  const steps = g.steps.slice(0, 5).map((s, i) => `${i + 1}. ${s.title} ${s.text}`).join("\n");
  const pitfalls = (g.pitfalls ?? []).slice(0, 2).map((p) => `• تجنب: ${p}`).join("\n");
  return {
    text: [`${g.title}: ${g.tagline}`, g.intro, steps, pitfalls, `مثال سريع: ${g.example.title}`]
      .filter(Boolean)
      .join("\n"),
    refs: [{ label: `صفحة «${g.title}» في الدليل`, href: `#/guide/${g.id}` }],
    followups: ["أعطني مثالاً محلولاً", "كيف أتعامل مع سؤال استخراج؟", "اختبرني في المنهجية"],
    mood: "explain",
  };
}

function encyclopediaReply(e: EncyclopediaEntry): TutorReply {
  const lines = [`«${e.term}» (${e.kind}): ${e.def}`];
  if (e.when) lines.push(`الزمن: ${e.when}.`);
  if (e.where) lines.push(`المكان: ${e.where}.`);
  const refs: TutorRef[] = conceptTerms.has(norm(e.term))
    ? [{ label: `بطاقة «${e.term}» في المعجم`, href: `#/lexicon?q=${encodeURIComponent(e.term)}` }]
    : [];
  return {
    text: lines.join("\n"),
    refs: refs.length ? refs : undefined,
    followups: ["أعطني مثالاً", "ما علاقته بموضوع دراسي؟", "اختبرني"],
    mood: "explain",
  };
}

function mapReply(): TutorReply {
  return {
    text: `لدينا ${MAPS.length} خرائط توطين تفاعلية: ${MAPS.map((m) => `«${m.title}»`).join("، ")}.\nاختر الخريطة، اقرأ المطلوب، ثم اضغط على المنطقة الصحيحة. حدود المقاطعات الداخلية مخفية، ولا تُحتسب لك نقطة نهائية: الهدف تدريبي.`,
    refs: [{ label: "كل الخرائط", href: "#/maps" }],
    followups: ["كيف أوطن على الخريطة؟", "افتح خريطة المغرب", "اختبرني في الخرائط"],
    mood: "happy",
  };
}

/* ------------------------------ الاختبار القصير ------------------------------ */

interface PendingQuiz {
  lesson: Lesson;
  i: number;
  correct: number;
}
let pending: PendingQuiz | null = null;

const letters = ["أ", "ب", "ج", "د"];

function startQuiz(topic?: string): TutorReply {
  let pool = lessons.filter((l) => l.items?.length && l.items.some((it) => it.options?.length >= 2));
  const found = topic ? lessonMatch(topic) : undefined;
  if (found) pool = pool.filter((l) => l.id === found.id);
  if (!pool.length) pool = lessons.filter((l) => l.items?.length);
  const lesson = pool[Math.floor(Math.random() * pool.length)];
  const items = lesson.items.filter((it) => it.options?.length >= 2 && it.answer >= 0);
  const item = items[Math.floor(Math.random() * items.length)];
  pending = { lesson, i: items.indexOf(item), correct: item.answer };
  const opts = item.options.slice(0, 4).map((o, k) => `${letters[k]}) ${o}`).join("\n");
  return {
    text: `سؤال من درس «${lesson.title}»:\n${item.stem}\n${opts}\nأجب بحرف الخيار فقط (أ، ب، ج، د).`,
    refs: [{ label: lesson.title, href: `#/lesson/${lesson.id}` }],
    followups: ["لا أعرف، أعطني تلميحاً", "غيّر السؤال", "اشرح لي الدرس"],
    mood: "thinking",
  };
}

function answerQuiz(input: string): TutorReply | null {
  if (!pending) return null;
  const lesson = pending.lesson;
  const item = lesson.items[pending.i];
  const t = norm(input).replace(/^(الخيار|الجواب|جوابي|اخترت|اختياري)\s+/g, "").replace(/\s+(هو|هي)$/g, "").trim();
  let pick = -1;
  if (/^[ابجد]$/.test(t)) pick = ["ا", "ب", "ج", "د"].indexOf(t);
  else if (/^[1-4]$/.test(t)) pick = Number(t) - 1;
  else {
    let best = 0;
    item.options.slice(0, 4).forEach((o, k) => {
      const on = norm(o);
      let sc = 0;
      if (on && t.includes(on)) sc = 10;
      else {
        const ot = new Set(words(o));
        const tt = words(t);
        sc = tt.filter((x) => ot.has(x)).length / Math.max(1, ot.size);
      }
      if (sc > best) {
        best = sc;
        pick = k;
      }
    });
    if (best < 0.5) pick = -1;
  }
  if (pick < 0) {
    return {
      text: "لم أتبيّن اختيارك. أعد الجواب بحرف واحد: أ، ب، ج، أو د. وإن أردت تلميحاً قل: «تلميح».",
      followups: ["تلميح", "غيّر السؤال", "توقف عن الاختبار"],
      mood: "thinking",
    };
  }
  const ok = pick === item.answer;
  const concept = lesson.conceptIds
    .map((id) => concepts.find((c) => c.id === id))
    .find((c) => !!c);
  const explanation =
    (item as Item & { explain?: string }).explain ?? `تذكّر: ${lesson.closing}`;
  const lines = [
    ok ? "إجابة صحيحة، أحسنت." : "ليست الإجابة الصحيحة.",
    `الجواب: ${letters[item.answer]}) ${item.options[item.answer]}`,
    explanation,
  ];
  const distractor = !ok ? item.distractors?.find((d) => d.i === pick) : undefined;
  const trap = distractor ? misconceptions.get(distractor.misconceptionId) : undefined;
  if (trap) lines.push(`سبب الخلط الشائع: ${trap.fix}`);
  if (concept) lines.push(`المفهوم المرتبط: «${concept.term}» — ${concept.def}`);
  pending = null;
  return {
    text: lines.join("\n"),
    refs: [
      { label: lesson.title, href: `#/lesson/${lesson.id}` },
      ...(concept ? [{ label: `مفهوم «${concept.term}»`, href: `#/lexicon?q=${encodeURIComponent(concept.term)}` }] : []),
    ],
    followups: ["سؤال آخر", "لخص لي هذا الدرس", "اشرح لي المنهجية"],
    mood: ok ? "happy" : "explain",
  };
}

/* ------------------------------ الواجهة ------------------------------ */

export function tutorGreeting(): TutorReply {
  return {
    text:
      "السلام عليكم، أنا الأستاذ مرشدي.\nأشرح لك دروس التاريخ والجغرافيا، وأعرّف المفاهيم، وأدربك على منهجية الوثيقة والمقال والمبيان والخريطة، وأسألك أسئلة قصيرة.\nاكتب سؤالك أو اضغط الميكروفون وتكلم بالعربية. كل إجاباتي مأخوذة من محتوى التطبيق نفسه.",
    followups: ["ما المنهجية التي أبدأ بها؟", "عرّفني العولمة", "لخص لي درس الحرب الباردة", "اختبرني"],
    mood: "happy",
  };
}

export function quickPrompts(): string[] {
  return ["كيف أجيب عن سؤال الوثيقة؟", "ما خطوات المقال الجغرافي؟", "عرّفني مفهوم القطبية الثنائية", "اختبرني في درس"];
}

export function askTutor(raw: string): TutorReply {
  const input = raw.trim();
  const q = norm(input);
  if (!q) return { text: "لم أسمع سؤالاً واضحاً. أعد صياغته من فضلك.", mood: "thinking" };

  if (pending) {
    if (/^(الغاء|إلغاء|توقف|كفى|انهي|أنهي)/.test(q)) {
      pending = null;
      return { text: "أوقفنا الاختبار. نعود متى شئت.", followups: quickPrompts(), mood: "happy" };
    }
    if (/^(تلميح|مساعدة|ساعدني|لا اعرف|لا أعرف)/.test(q) && pending) {
      const lesson = pending.lesson;
      const item = lesson.items[pending.i];
      return {
        text: `تلميح: السؤال من درس «${lesson.title}»، وراجع محوره «${lesson.axes?.[0]?.title ?? lesson.unit}». أعد النظر في الخيارات ثم أجب بحرف.`,
        followups: ["أجب بدلاً مني", "غيّر السؤال"],
        mood: "thinking",
      };
    }
    if (/غيّر|سؤال اخر|سؤال آخر/.test(q)) return startQuiz();
    const quiz = answerQuiz(input);
    if (quiz) return quiz;
    pending = null;
  }

  if (/^(سلام|السلام عليكم|مرحبا|اهلا|أهلا|صباح الخير|مساء الخير)/.test(q) || q === "هاي") {
    return tutorGreeting();
  }

  if (/من انت|من تكون|ما اسمك|عرف بنفسك/.test(q)) {
    return {
      text: "أنا الأستاذ مرشدي، أستاذ افتراضي للتاريخ والجغرافيا في تطبيق مرشدي HG. لا أخرج عن محتوى التطبيق: أشرح دروس الثانية باكالوريا، وأوضح المفاهيم والتعريفات، وأدربك على المنهجيات والخرائط.",
      followups: quickPrompts(),
      mood: "happy",
    };
  }

  if (/ماذا تعرف|ماذا يمكنك|قدراتك|كيف تساعدني|مساعدة/.test(q)) {
    return {
      text:
        "أستطيع:\n• شرح أي درس من دروس التطبيق وتلخيص محاوره وأهدافه.\n• تعريف المفاهيم والمصطلحات والأعلام وتصحيح الأخطاء الشائعة.\n• تدريبك على منهجية الوثيقة والمقال والخط الزمني والمبيان والخريطة.\n• طرح أسئلة قصيرة عليك وتصحيحها.\n• إرشادك إلى الخرائط التفاعلية وطريقة التوطين.\nاسأل بلغتك، وسأجيبك بالعربية من محتوى التطبيق.",
      followups: quickPrompts(),
      mood: "explain",
    };
  }

  if (/نتيجتي|تقدمي|احصائياتي|احصائيات|معدل الاتقان|تقريري/.test(q)) {
    const s = stats(concepts.length);
    return {
      text: `من تقريرك المحلي: فتحت ${s.lessonsSeen} درساً، وأنجزت ${s.totalTries} طوراً، ومعدل الإتقان ${s.accuracy}%، ولديك ${s.conceptsToReview} مفهوماً للمراجعة. هذه مؤشرات تدريبية لا نقطة نهائية.`,
      refs: [{ label: "تقريري", href: "#/report" }],
      followups: ["ما المفاهيم التي أخطأت فيها؟", "اختبرني", "كيف أرفع إتقاني؟"],
      mood: "explain",
    };
  }

  if (/اختبرني|اسالني|سؤال|تمارين|تمرين|اختبار/.test(q) && !/اشرح|لخص|عرف|منهجي/.test(q)) {
    return startQuiz(input);
  }

  if (/خرائط|خريطة|توطين|الخريطة/.test(q) && !/منهجي/.test(q)) {
    const hits = ranked(input, "map");
    if (hits.length) {
      const c = hits[0].chunk;
      return {
        text: `${c.title}.\n${c.text.slice(0, 600)}`,
        refs: [refOf(c), { label: "فهرس الخرائط", href: "#/maps" }],
        followups: ["كيف أوطن على الخريطة؟", "افتح الخريطة", "اختبرني في الخرائط"],
        mood: "explain",
      };
    }
    return mapReply();
  }

  if (/منهجي|منهجية|كيف اجيب|كيفية الاجابة|خطوات المقال|المقال|الوثيقة|الوثائق|مبيان|مبيانات|خط زمني|جدول|تعليق|تحليل/.test(q)) {
    const hits = ranked(input, "guide");
    if (hits.length) {
      const best = hits[0].chunk;
      const topic = best.guideId ? TOPICS.find((t) => t.id === best.guideId) : undefined;
      if (topic) return guideReply(topic);
    }
    const fallback = TOPICS.find((t) => q.includes(norm(t.title).split(" ")[1] ?? "")) ?? TOPICS[0];
    return guideReply(fallback);
  }

  if (/^(ما هو|ما هي|ما معنى|عرف|تعريف|مفهوم|معنى)/.test(q) || /ما المقصود/.test(q)) {
    const hits = ranked(input, "concept");
    const enc = topEncyclopedia(input);
    // الموسوعة تتفوق حين يذكر الاستعلام مصطلحها كاملاً وليس له بطاقة معجم،
    // أو حين يكون تطابق المفهوم ضعيفاً جداً.
    if (enc?.chunk.entry) {
      const e = enc.chunk.entry;
      const lexiconHas = conceptTerms.has(norm(e.term));
      const exactTerm = norm(input).includes(norm(e.term));
      if (!lexiconHas && (exactTerm || enc.score > (hits[0]?.score ?? 0) * 1.2)) {
        return encyclopediaReply(e);
      }
    }
    if (hits.length) {
      const c = hits[0].chunk;
      if (c.concept) return conceptReply(c.concept);
      return {
        text: c.text,
        refs: [refOf(c)],
        followups: ["أعطني مثالاً", "اختبرني في هذا المفهوم"],
        mood: "explain",
      };
    }
  }

  if (/لخص|ملخص|تلخيص|محتوى درس|محاور درس|شرح درس|اشرح لي درس/.test(q)) {
    const l = lessonMatch(input);
    if (l) return lessonSummary(l, input);
  }

  const lesson = lessonMatch(input);
  if (lesson && (q.includes("درس") || words(input).length <= 4)) {
    return lessonSummary(lesson, input);
  }

  const bestConcept = ranked(input, "concept")[0];
  if (bestConcept && bestConcept.score > 3.2 && words(input).length <= 5) {
    const c = bestConcept.chunk;
    if (c.concept) return conceptReply(c.concept);
  }

  const encHit = topEncyclopedia(input);
  if (encHit?.chunk.entry) {
    return encyclopediaReply(encHit.chunk.entry);
  }

  const hits = ranked(input).filter(
    (h) => h.chunk.kind !== "encyclopedia" || encScoreOk(input, h.chunk),
  );
  if (hits.length && hits[0].score >= 1.6) {
    const top = hits.slice(0, 2).map((h) => h.chunk);
    const primary = top[0];
    if (primary.kind === "concept" && primary.concept && words(input).length <= 6) {
      return conceptReply(primary.concept);
    }
    if (primary.kind === "guide" && primary.guideId) {
      const topic = TOPICS.find((t) => t.id === primary.guideId);
      if (topic) return guideReply(topic);
    }
    if (primary.kind === "lesson" && primary.lessonId) {
      const l = lessonById.get(primary.lessonId);
      if (l) {
        const other = top[1] && top[1].lessonId === l.id ? top[1] : undefined;
        return {
          text: [
            `من درس «${l.title}»:`,
            `${primary.heading}: ${primary.text}`,
            other && other.heading !== primary.heading ? `${other.heading}: ${other.text}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          refs: dedupeRefs([refOf(primary), ...(other ? [refOf(other)] : [])]),
          followups: ["لخص لي الدرس كاملاً", "أعطني مثالاً", "اختبرني فيه"],
          mood: "explain",
        };
      }
    }
    return {
      text: top.map((c) => `${c.heading}: ${c.text}`).join("\n"),
      refs: dedupeRefs(top.map(refOf)),
      followups: ["لخص لي أكثر", "أعطني مثالاً", "اختبرني"],
      mood: "explain",
    };
  }

  return {
    text: "لم أجد في محتوى التطبيق جواباً مباشراً عن هذا السؤال. جرّب أن تذكر الدرس أو المفهوم أو المهارة التي تهمك، مثل: «اشرح درس العولمة»، «ما تعريف التبادل الحر؟»، «كيف أجيب عن سؤال استخراج؟»، أو «اختبرني».",
    followups: quickPrompts(),
    mood: "thinking",
    miss: true,
  };
}
