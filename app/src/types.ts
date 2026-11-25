export interface Concept {
  id: string;
  kind: "concept" | "figure";
  type?: string;
  domainId: string;
  term: string;
  def: string;
  when?: string;
  where?: string;
  actors?: string[];
  lessons: string[];
  link?: "core" | "evoked" | "future";
  status?: string;
  misconceptions?: string[];
  notes?: string;
  source?: string;
}

export interface Misconception {
  id: string;
  for: string;
  claim: string;
  fix: string;
}

export interface Domain {
  id: string;
  subject: "history" | "geography";
  name: string;
  order: number;
}

export interface LessonMeta {
  id: string;
  code: string;
  subject: "history" | "geography";
  order: number;
  unit: string;
  title: string;
}

export interface Lexicon {
  meta: Record<string, unknown>;
  domains: Domain[];
  lessons: LessonMeta[];
  concepts: Concept[];
  misconceptions: Misconception[];
}

export interface Item {
  id: string;
  type: string;
  stem: string;
  options: string[];
  answer: number;
  distractors?: { i: number; misconceptionId: string }[];
  skillId?: string;
  difficulty?: number;
}

export interface Matrix {
  id: string;
  title: string;
  columns: string[];
  rows: { label: string; cells: string[] }[];
}

export interface DocQuestion {
  q: string;
  skillId?: string;
  modelAnswer: string;
}

export interface Doc {
  id: string;
  type: string;
  title: string;
  caption?: string;
  source?: string;
  body?: string;
  data?: { columns: string[]; rows: string[][] };
  questions?: DocQuestion[];
}

export interface Axis {
  id: string;
  order: number;
  title: string;
  subAxes: string[];
}

export interface Lesson {
  id: string;
  levelId: string;
  branchIds: string[];
  subject: "history" | "geography";
  module: string;
  unit: string;
  order: number;
  title: string;
  context: string;
  problemStatement: string;
  problematics: string[];
  objectives: string[];
  axes: Axis[];
  matrix?: Matrix;
  conceptIds: string[];
  figures?: unknown[];
  documents?: Doc[];
  timeline?: { date: string; label: string; conceptId?: string | null }[];
  skills?: string[];
  items: Item[];
  essayPrompts?: { id: string; prompt: string; plan: string[]; rubric?: string }[];
  closing: string;
  sourceRef?: { file: string; pages?: number[]; credit?: string };
  sources?: string[];
  sheetTemplates?: string[];
}

export interface Content {
  branch: string;
  generatedAt: string;
  lexicon: Lexicon;
  lessons: Lesson[];
}

/** سؤال مولّد في اللعب */
export interface Q {
  id: string;
  kind: string;
  prompt: string;
  hint?: string;
  options: string[];
  answer: number;
  explain: string;
  /** شرح الخطأ لكل خيار خاطئ: index => نص */
  fixes?: Record<number, string>;
  conceptId?: string;
}
