/**
 * يجمع محتوى الفرع (lexicon.json + lessons/*.json) في ملف واحد يستورده التطبيق.
 * الاستعمال: node tools/build-content.mjs [branch]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const branch = process.argv[2] || "2bac-ad";
const base = join(ROOT, "content", branch);

if (!existsSync(base)) {
  console.error(`✗ مجلد المحتوى غير موجود: ${base}`);
  process.exit(1);
}

const lexicon = JSON.parse(readFileSync(join(base, "lexicon.json"), "utf-8"));
const lessonsDir = join(base, "lessons");
const lessons = existsSync(lessonsDir)
  ? readdirSync(lessonsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => {
        const lesson = JSON.parse(readFileSync(join(lessonsDir, f), "utf-8"));
        if (!lessons_ok(lesson)) {
          console.warn(`! تحذير: ${f} ناقص الحقول الأساسية`);
        }
        return lesson;
      })
  : [];

function lessons_ok(l) {
  return l && l.id && Array.isArray(l.items) && Array.isArray(l.conceptIds);
}

const out = {
  branch,
  generatedAt: new Date().toISOString().slice(0, 10),
  lexicon,
  lessons,
};

mkdirSync(join(ROOT, "app", "src"), { recursive: true });
const dest = join(ROOT, "app", "src", "content.json");
writeFileSync(dest, JSON.stringify(out), "utf-8");

const kb = (JSON.stringify(out).length / 1024).toFixed(1);
console.log(`✔ ${lessons.length} درساً + ${lexicon.concepts.length} بطاقة => app/src/content.json (${kb} KB)`);
