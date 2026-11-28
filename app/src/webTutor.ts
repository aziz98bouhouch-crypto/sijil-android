/**
 * بحث الويب الاختياري للأستاذ: ملاذ أخير عند عدم وجود جواب محلي.
 * لا يعمل إلا إذا زوّد المستخدم مفتاحاً — من localStorage أو متغيرات Vite:
 *   marhadi-gemini-key  → Gemini API (يجيب مباشرة)
 *   marhadi-gcse-key + marhadi-gcse-cx → Google Custom Search (مصادر مغربية)
 * لا يُخزَّن أي شيء خارج الجهاز.
 */
import type { TutorReply, TutorRef } from "./tutor";

type Env = Record<string, string | undefined>;
const env = ((import.meta as unknown as { env?: Env }).env ?? {}) as Env;

const ls = (k: string): string | undefined => {
  try {
    return localStorage.getItem(k) || undefined;
  } catch {
    return undefined;
  }
};

const cfg = {
  gemini: () => ls("marhadi-gemini-key") ?? env.VITE_GEMINI_KEY,
  gcseKey: () => ls("marhadi-gcse-key") ?? env.VITE_GCSE_KEY,
  gcseCx: () => ls("marhadi-gcse-cx") ?? env.VITE_GCSE_CX,
};

export function webSearchAvailable(): boolean {
  return !!(cfg.gemini() || (cfg.gcseKey() && cfg.gcseCx()));
}

const SYSTEM =
  "أنت «الأستاذ مرشدي»، أستاذ مغربي للتاريخ والجغرافيا لطلاب البكالوريا. " +
  "أجب بالعربية الفصحى المبسطة والدقيقة، بإيجاز منظم، دون اختلاق تواريخ أو أرقام أو مصادر. " +
  "إن لم تكن متأكداً من المعلومة فاذكر ذلك صراحة. لا تتكلم عن كونك ذكاء اصطناعياً.";

async function askGemini(query: string, signal: AbortSignal): Promise<TutorReply | null> {
  const key = cfg.gemini();
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{ parts: [{ text: query }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) return null;
  return { text: text.slice(0, 1800), mood: "explain" };
}

interface CseItem {
  title?: string;
  link?: string;
  snippet?: string;
}

async function askCustomSearch(query: string, signal: AbortSignal): Promise<TutorReply | null> {
  const key = cfg.gcseKey();
  const cx = cfg.gcseCx();
  if (!key || !cx) return null;
  const q = `${query} تاريخ جغرافيا المغرب`;
  const url =
    "https://www.googleapis.com/customsearch/v1?" +
    new URLSearchParams({
      key,
      cx,
      q,
      num: "5",
      lr: "lang_ar",
      gl: "ma",
      cr: "countryMA",
      safe: "active",
    }).toString();
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: CseItem[] };
  const items = (data.items ?? []).filter((i) => i.title && i.link).slice(0, 5);
  if (!items.length) return null;
  const refs: TutorRef[] = items.map((i) => ({ label: (i.title ?? "").slice(0, 70), href: i.link ?? "#" }));
  const lines = items.map((i, k) => `${k + 1}. ${i.title}\n${i.snippet ?? ""}`);
  return {
    text: `وجدت في مصادر على الويب (راجع الروابط):\n\n${lines.join("\n\n")}`.slice(0, 1800),
    refs,
    followups: ["لخّص لي أول نتيجة", "ما المصادر الرسمية؟", "اختبرني"],
    mood: "explain",
  };
}

/** يبحث في الويب فقط عند ضبط مفتاح؛ يعيد null عند الفشل أو انعدام الإعداد. */
export async function askWebTutor(query: string): Promise<TutorReply | null> {
  if (!webSearchAvailable()) return null;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 8000);
  try {
    return (await askGemini(query, ctrl.signal)) ?? (await askCustomSearch(query, ctrl.signal));
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
