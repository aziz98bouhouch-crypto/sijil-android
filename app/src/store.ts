/** التقدّم والتقارير — localStorage فقط، بلا خادم */

export interface ModeStat {
  best: number;
  total: number;
  tries: number;
  lastAt: string;
}

export interface MissRecord {
  conceptId?: string;
  misconceptionId?: string;
  lessonId: string;
  modeId: string;
  at: string;
}

export interface Progress {
  modes: Record<string, ModeStat>; // key = lessonId::modeId
  misses: MissRecord[];
  seen: string[]; // lessons opened
}

const KEY = "marhadi:progress:v1";

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    /* تخزين معطّل أو فاسد */
  }
  return { modes: {}, misses: [], seen: [] };
}

export function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function recordRun(
  lessonId: string,
  modeId: string,
  score: number,
  total: number,
  missed: MissRecord[],
) {
  const p = load();
  const key = `${lessonId}::${modeId}`;
  const cur = p.modes[key] ?? { best: 0, total, tries: 0, lastAt: "" };
  p.modes[key] = {
    best: Math.max(cur.best, score),
    total,
    tries: cur.tries + 1,
    lastAt: new Date().toISOString(),
  };
  p.misses = [...missed, ...p.misses].slice(0, 200);
  save(p);
  return p;
}

export function markSeen(lessonId: string) {
  const p = load();
  if (!p.seen.includes(lessonId)) {
    p.seen.push(lessonId);
    save(p);
  }
}

export function stats(lexiconConceptCount: number) {
  const p = load();
  const runs = Object.values(p.modes);
  const totalTries = runs.reduce((s, r) => s + r.tries, 0);
  const mastered = new Set(p.misses.map((m) => m.conceptId).filter(Boolean)).size;
  const accuracy =
    runs.length === 0
      ? 0
      : Math.round(
          (runs.reduce((s, r) => s + (r.total ? r.best / r.total : 0), 0) / runs.length) * 100,
        );
  return {
    lessonsSeen: p.seen.length,
    totalTries,
    accuracy,
    conceptsToReview: mastered,
    lexiconCovered: Math.min(lexiconConceptCount, p.seen.length * 5),
    misses: p.misses,
  };
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
