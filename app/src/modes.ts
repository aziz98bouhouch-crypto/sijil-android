import type { Q, Lesson, Lexicon, Concept } from "./types";

/* ---------- أدوات ---------- */

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstSentence(text: string): string {
  const i = text.indexOf("؛");
  const chunk = i > 20 ? text.slice(0, i) : text;
  return chunk.length > 160 ? chunk.slice(0, 157).trimEnd() + "…" : chunk;
}

function words(text: string): string[] {
  return text.replace(/[«»"():،.\-–]/g, " ").split(/\s+/).filter((w) => w.length > 3);
}

/* ---------- المولّدات ---------- */

export interface ModeDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  gen(lesson: Lesson, lex: Lexicon): Q[];
}

function byIds(lesson: Lesson, lex: Lexicon): Concept[] {
  const map = new Map(lex.concepts.map((c) => [c.id, c]));
  return lesson.conceptIds.map((id) => map.get(id)).filter((c): c is Concept => !!c);
}

function misconceptionsOf(lesson: Lesson, lex: Lexicon) {
  const m = new Map(lex.misconceptions.map((x) => [x.id, x]));
  const out: { id: string; claim: string; fix: string; conceptId: string }[] = [];
  for (const c of byIds(lesson, lex)) {
    for (const mid of c.misconceptions ?? []) {
      const found = m.get(mid);
      if (found) out.push({ id: mid, claim: found.claim, fix: found.fix, conceptId: c.id });
    }
  }
  return out;
}

/** 1) تشخيص: أسئلة الدرس الجاهزة */
function diagnostic(lesson: Lesson): Q[] {
  const fixesFor = (item: (typeof lesson.items)[number]) => {
    const f: Record<number, string> = {};
    for (const d of item.distractors ?? []) f[d.i] = d.misconceptionId;
    return f;
  };
  return lesson.items.map((it) => {
    const wrong = fixesFor(it);
    const labels: Record<number, string> = {};
    for (const k of Object.keys(wrong)) labels[Number(k)] = wrong[Number(k)];
    return {
      id: it.id,
      kind: "diagnostic",
      prompt: it.stem,
      options: it.options.slice(),
      answer: it.answer,
      explain: `الجواب الصحيح: ${it.options[it.answer]}`,
      fixes: labels,
      conceptId: undefined,
    } satisfies Q;
  });
}

/** 2) مبارزة المفاهيم: مفهوم ← تعريفه بين أربعة */
function duel(lesson: Lesson, lex: Lexicon): Q[] {
  const cs = byIds(lesson, lex);
  if (cs.length < 2) return [];
  const others = lex.concepts.filter((c) => !lesson.conceptIds.includes(c.id));
  return shuffle(cs)
    .slice(0, 8)
    .map((c) => {
      const wrong = shuffle(others)
        .slice(0, 3)
        .map((o) => o.def);
      const options = shuffle([c.def, ...wrong]);
      return {
        id: `duel-${c.id}`,
        kind: "duel",
        prompt: `أي تعريف يطابق: «${c.term}»؟`,
        options,
        answer: options.indexOf(c.def),
        explain: `«${c.term}»: ${c.def}`,
        conceptId: c.id,
      } satisfies Q;
    });
}

/** 3) اصطد الخطأ: عبارة خاطئة بين عبارات صحيحة */
function trap(lesson: Lesson, lex: Lexicon): Q[] {
  const ms = misconceptionsOf(lesson, lex);
  const cs = byIds(lesson, lex);
  if (!ms.length || cs.length < 3) return [];
  return shuffle(ms)
    .slice(0, 8)
    .map((m) => {
      const truth = shuffle(cs.filter((c) => c.id !== m.conceptId))
        .slice(0, 3)
        .map((c) => firstSentence(c.def));
      const options = shuffle([m.claim, ...truth]);
      return {
        id: `trap-${m.id}`,
        kind: "trap",
        prompt: "أيّ العبارات التالية خطأ؟",
        options,
        answer: options.indexOf(m.claim),
        explain: `العبارة الخطأ شائعة: ${m.fix}`,
        conceptId: m.conceptId,
      } satisfies Q;
    });
}

/** 4) صنّف: خانات مصفوفة الدرس */
function sort(lesson: Lesson): Q[] {
  if (!lesson.matrix || lesson.matrix.columns.length < 2) return [];
  const out: Q[] = [];
  for (const row of lesson.matrix.rows) {
    row.cells.forEach((cellText, ci) => {
      if (!cellText || cellText === "—") return;
      const options = lesson.matrix!.columns.slice();
      out.push({
        id: `sort-${row.label}-${ci}`,
        kind: "sort",
        prompt: `أين تصنّف: «${cellText}»؟`,
        hint: lesson.matrix!.title,
        options,
        answer: ci,
        explain: `هذه الخانة تنتمي إلى «${lesson.matrix!.columns[ci]}» في جدول ${lesson.matrix!.title}.`,
      });
    });
  }
  return shuffle(out).slice(0, 8);
}

/** 5) رتّب الأحداث: أيّها وقع أولاً */
function order(lesson: Lesson): Q[] {
  const tl = (lesson.timeline ?? []).filter((t) => t.date && t.label);
  if (tl.length < 3) return [];
  const out: Q[] = [];
  for (let i = 1; i < tl.length; i++) {
    const pool = shuffle(tl.filter((_, k) => k !== i)).slice(0, 3);
    const opts = shuffle([...pool, tl[i]]);
    out.push({
      id: `order-${i}`,
      kind: "order",
      prompt: "أيّ هذه الأحداث وقع أولاً؟",
      options: opts.map((o) => `${o.date} — ${o.label}`),
      answer: opts.indexOf(tl[i]),
      explain: `الترتيب الصحيح: ${tl[i].date} — ${tl[i].label}.`,
    });
  }
  return out.slice(0, 5);
}

/** 6) أكمل الخاتمة: كلمة محجوبة */
function cloze(lesson: Lesson, lex: Lexicon): Q[] {
  const text = lesson.closing;
  if (!text) return [];
  const ws = words(text);
  const targets = ws.filter((w) => w.length > 4).slice(0, 4);
  const pool = new Set<string>();
  for (const l of lex.lessons) void l;
  for (const c of lex.concepts) {
    for (const w of words(c.term)) pool.add(w);
  }
  const out: Q[] = [];
  for (const target of targets) {
    const idx = text.indexOf(target);
    if (idx < 0) continue;
    const blanked = text.slice(0, idx) + "▭▭▭▭" + text.slice(idx + target.length);
    const others = shuffle([...pool].filter((w) => w !== target)).slice(0, 3);
    const options = shuffle([target, ...others]);
    out.push({
      id: `cloze-${idx}`,
      kind: "cloze",
      prompt: `أكمل خاتمة الدرس: «${blanked}»`,
      options,
      answer: options.indexOf(target),
      explain: `الخاتمة كاملة: ${text}`,
    });
  }
  return out;
}

/** 7) من؟ — الأعلام فقط */
function who(lesson: Lesson, lex: Lexicon): Q[] {
  const cs = byIds(lesson, lex);
  const figs = cs.filter((c) => c.kind === "figure");
  if (figs.length < 1) return [];
  const others = lex.concepts.filter((c) => c.kind === "figure" && !figs.some((f) => f.id === c.id));
  return figs.map((f) => {
    const wrong = shuffle(others.length >= 3 ? others : lex.concepts)
      .slice(0, 3)
      .map((o) => o.term);
    const options = shuffle([f.term, ...wrong]);
    return {
      id: `who-${f.id}`,
      kind: "who",
      prompt: `من هو؟ ${f.def}`,
      options,
      answer: options.indexOf(f.term),
      explain: `${f.term}${f.when ? ` (${f.when})` : ""}.`,
      conceptId: f.id,
    } satisfies Q;
  });
}

/** 8) اختبار سريع: خليط */
function quick(lesson: Lesson, lex: Lexicon): Q[] {
  const pool = [
    ...shuffle(diagnostic(lesson)).slice(0, 5),
    ...shuffle(trap(lesson, lex)).slice(0, 3),
    ...shuffle(cloze(lesson, lex)).slice(0, 2),
    ...shuffle(duel(lesson, lex)).slice(0, 2),
  ];
  return shuffle(pool).slice(0, 10);
}

export const MODES: ModeDef[] = [
  { id: "diagnostic", name: "تشخيص", icon: "target", desc: "أسئلة الدرس الرسمية", gen: diagnostic },
  { id: "duel", name: "مبارزة المفاهيم", icon: "swords", desc: "طابق المفهوم بتعريفه", gen: duel },
  { id: "trap", name: "اصطد الخطأ", icon: "alert", desc: "عبارة واحدة خاطئة بين أربع", gen: trap },
  { id: "sort", name: "صنّف", icon: "layers", desc: "خانات جدول المقارنة", gen: sort },
  { id: "order", name: "رتّب الأحداث", icon: "clock", desc: "الأسبق زمنياً", gen: order },
  { id: "cloze", name: "أكمل الخاتمة", icon: "pencil", desc: "كلمة محجوبة من الخاتمة", gen: cloze },
  { id: "who", name: "من؟", icon: "user", desc: "الأعلام فقط", gen: who },
  { id: "quick", name: "اختبار سريع", icon: "bolt", desc: "خليط من كل الأطوار", gen: quick },
];

export function buildMode(modeId: string, lesson: Lesson, lex: Lexicon): Q[] {
  const mode = MODES.find((m) => m.id === modeId);
  if (!mode) return [];
  return mode.gen(lesson, lex);
}

export function availableModes(lesson: Lesson, lex: Lexicon) {
  return MODES.map((m) => ({ ...m, count: m.gen(lesson, lex).length }));
}
