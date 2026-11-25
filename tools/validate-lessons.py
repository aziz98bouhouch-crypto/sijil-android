#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تحقّق واحد لكل ملفات الدروس: يفحص الربط ثنائي الاتجاه مع lexicon.json
ويمنع تكرار أخطاء g01 (مشتت من درس آخر، معرّف خطأ مجهول، جواب دائماً في نفس الموضع...).

الاستعمال:
    python tools/validate-lessons.py
    python tools/validate-lessons.py --dir content/2bac-ad
    python tools/validate-lessons.py --strict     # يحوّل التحذيرات إلى أخطاء

الخروج: 0 إن لا أخطاء، 1 إن وُجد خطأ واحد على الأقل.
"""

import argparse
import collections
import glob
import json
import os
import sys

REQUIRED = ("id", "title", "levelId", "subject", "items")
RECOMMENDED = ("objectives", "documents", "sources", "problemStatement", "sourceRef", "closing", "context")


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def err(self, code, where, msg):
        self.errors.append((code, where, msg))

    def warn(self, code, where, msg):
        self.warnings.append((code, where, msg))

    def dump(self):
        for code, where, msg in self.errors:
            print(f"  ✗ [{code}] {where}: {msg}")
        for code, where, msg in self.warnings:
            print(f"  ! [{code}] {where}: {msg}")


def load_json(path, rep):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        rep.err("E00", os.path.basename(path), f"JSON غير صالح: السطر {e.lineno} — {e.msg}")
    except OSError as e:
        rep.err("E00", os.path.basename(path), f"لا يمكن قراءة الملف: {e}")
    return None


def check_lesson(lesson, lex, rep, seen_item_ids):
    lid = lesson.get("id", "?")
    topic = os.path.basename(lid)

    # 1) الحقول الإلزامية والمستحسنة (§11.2)
    for f in REQUIRED:
        if f not in lesson or lesson[f] in ("", [], None):
            rep.err("E01", lid, f"حقل إلزامي ناقص أو فارغ: {f}")
    for f in RECOMMENDED:
        if f not in lesson:
            rep.warn("W01", lid, f"حقل مستحسن غائب: {f}")

    # 2) الدرس معرّف في المعجم
    lex_lessons = {l["id"]: l for l in lex.get("lessons", [])}
    if lid not in lex_lessons:
        rep.err("E02", lid, "المعرّف غير موجود في lexicon.lessons[]")
    else:
        if lesson.get("subject") != lex_lessons[lid].get("subject"):
            rep.err("E03", lid, f"المادة لا تطابق المعجم ({lesson.get('subject')} ≠ {lex_lessons[lid].get('subject')})")

    # 3) الإشكالية
    ps = lesson.get("problemStatement")
    if ps:
        probs = lesson.get("problematics") or []
        if ps not in probs:
            rep.err("E04", lid, "problemStatement ليس ضمن problematics[]")

    # 4) sourceRef
    src = lesson.get("sourceRef") or {}
    if not src.get("file"):
        rep.err("E05", lid, "sourceRef.file غائب")
    elif not os.path.exists(os.path.join(ROOT, src["file"])):
        rep.warn("W02", lid, f"ملف المصدر غير موجود في المشروع: {src['file']}")

    # 5) الربط ثنائي الاتجاه
    concepts = {c["id"]: c for c in lex.get("concepts", [])}
    declared = lesson.get("conceptIds") or []
    if not declared:
        rep.err("E06", lid, "conceptIds[] فارغ")

    if len(set(declared)) != len(declared):
        dup = [x for x, n in collections.Counter(declared).items() if n > 1]
        rep.err("E07", lid, f"conceptIds مكررة: {dup}")

    for cid in declared:
        c = concepts.get(cid)
        if not c:
            rep.err("E08", lid, f"conceptId مجهول: {cid}")
            continue
        if lid not in c.get("lessons", []):
            rep.err("E09", lid, f"ربط غير متماثل: {cid}.lessons[] لا يحتوي {lid}")
        if not c.get("misconceptions"):
            rep.err("E10", lid, f"{cid} بلا خطأ شائع")

    # الاتجاه العكسي: كل مفهوم يشير إلى هذا الدرس يجب أن يكون في conceptIds
    for cid, c in concepts.items():
        if lid in c.get("lessons", []) and cid not in declared:
            rep.err("E11", lid, f"ربط غير متماثل: {cid}.lessons[] يذكر هذا الدرس لكنه غائب عن conceptIds")

    # 6) الأخطاء الشائعة المتاحة لهذا الدرس فقط
    lesson_mis = {m for cid in declared if cid in concepts for m in concepts[cid].get("misconceptions", [])}
    all_mis = {m["id"] for m in lex.get("misconceptions", [])}

    # 7) الأسئلة
    items = lesson.get("items") or []
    answers = collections.Counter()
    for it in items:
        iid = it.get("id", "?")
        if iid in seen_item_ids:
            rep.err("E12", lid, f"معرّف سؤال مكرر في المشروع: {iid}")
        seen_item_ids.add(iid)

        opts = it.get("options") or []
        ans = it.get("answer")
        if len(opts) != 4:
            rep.err("E13", iid, f"عدد الخيارات {len(opts)} ≠ 4")
        if not isinstance(ans, int) or not (0 <= ans < len(opts)):
            rep.err("E14", iid, f"answer={ans} خارج المدى")
        else:
            answers[ans] += 1

        for d in it.get("distractors") or []:
            mid, di = d.get("misconceptionId"), d.get("i")
            if mid not in all_mis:
                rep.err("E15", iid, f"مشتت يشير إلى خطأ شائع مجهول: {mid}")
            elif mid not in lesson_mis:
                owner = next((c["id"] for c in lex["concepts"] if mid in c.get("misconceptions", [])), "?")
                rep.err("E16", iid, f"مشتت من خارج الدرس: {mid} (ينتمي إلى {owner})")
            if di == ans:
                rep.err("E17", iid, "مشتت يشير إلى موضع الجواب الصحيح")
            if not isinstance(di, int) or not (0 <= di < len(opts)):
                rep.err("E18", iid, f"موضع مشتت خارج المدى: {di}")

    if len(items) < 12:
        rep.warn("W03", lid, f"عدد الأسئلة {len(items)} < 12")

    # توزيع مواضع الجواب: يمنع «الجواب دائماً أولاً» كما في g01 الأصلي
    if len(items) >= 8 and len(answers) == 1:
        rep.err("E19", lid, f"كل الأجوبة في الموضع {list(answers)[0]} — توزيع معطوب")
    elif answers:
        top, n = answers.most_common(1)[0]
        if len(items) >= 8 and n / len(items) > 0.6:
            rep.warn("W04", lid, f"{n}/{len(items)} من الأجوبة في الموضع {top}")

    # 8) الوثائق
    for d in lesson.get("documents") or []:
        did = d.get("id", "?")
        for q in d.get("questions") or []:
            if not q.get("modelAnswer"):
                rep.err("E20", did, "سؤال وثيقة بلا إجابة نموذجية")
        if d.get("type") == "table":
            data = d.get("data") or {}
            cols, rows = data.get("columns") or [], data.get("rows") or []
            for r in rows:
                if len(r) != len(cols):
                    rep.err("E21", did, f"صف بجدول الوثيقة بعدد خانات {len(r)} ≠ أعمدة {len(cols)}")

    # 9) المصفوفة
    mx = lesson.get("matrix")
    if mx:
        cols = mx.get("columns") or []
        if len(cols) < 2:
            rep.err("E22", lid, "مصفوفة بأقل من عمودين")
        for r in mx.get("rows") or []:
            if len(r.get("cells") or []) != len(cols):
                rep.err("E23", lid, f"صف مصفوفة «{r.get('label')}» بعدد خانات ≠ عدد الأعمدة")

    # 10) المقال
    if not lesson.get("essayPrompts"):
        rep.warn("W05", lid, "لا يوجد essayPrompts (مسار المقال معطّل لهذا الدرس)")
    for e in lesson.get("essayPrompts") or []:
        if not e.get("plan"):
            rep.err("E24", e.get("id", "?"), "مقال بلا خطة")

    # 11) الخط الزمني
    for t in lesson.get("timeline") or []:
        if not t.get("date") or not t.get("label"):
            rep.err("E25", lid, "عنصر خط زمني بلا تاريخ أو عنوان")
        cid = t.get("conceptId")
        if cid and cid not in declared:
            rep.err("E26", lid, f"خط زمني يشير إلى مفهوم خارج الدرس: {cid}")


def main():
    global ROOT
    ap = argparse.ArgumentParser(description="تحقّق من ملفات الدروس وربطها بالمعجم")
    ap.add_argument("--dir", default=None, help="مجلد الفرع (افتراضي: content/2bac-ad)")
    ap.add_argument("--strict", action="store_true", help="التحذيرات تُعدّ أخطاء")
    args = ap.parse_args()

    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    branch_dir = args.dir or os.path.join("content", "2bac-ad")
    base = os.path.join(ROOT, branch_dir)
    lex_path = os.path.join(base, "lexicon.json")
    lessons_glob = os.path.join(base, "lessons", "*.json")

    print("=== تحقّق الدروس مقابل المعجم ===")
    print(f"الجذر: {ROOT}")
    print(f"المعجم: {os.path.relpath(lex_path, ROOT)}")

    rep = Report()
    if not os.path.exists(lex_path):
        print(f"✗ لا يوجد lexicon.json في {base}")
        return 1

    lex = load_json(lex_path, rep)
    if lex is None:
        rep.dump()
        return 1

    files = sorted(glob.glob(lessons_glob))
    if not files:
        print(f"✗ لا ملفات دروس في {os.path.relpath(os.path.dirname(lessons_glob), ROOT)}")
        return 1

    seen_item_ids = set()
    seen_lesson_ids = set()
    total_items = 0

    for path in files:
        lesson = load_json(path, rep)
        if lesson is None:
            continue
        lid = lesson.get("id")
        seen_lesson_ids.add(lid)
        before = len(rep.errors)
        check_lesson(lesson, lex, rep, seen_item_ids)
        total_items += len(lesson.get("items") or [])
        status = "✔" if len(rep.errors) == before else "✗"
        cids = len(lesson.get("conceptIds") or [])
        print(f"  {status} {os.path.basename(path):<12} {lid:<22} مفاهيم={cids:<3} أسئلة={len(lesson.get('items') or [])}")

    # تغطية: كل درس في المعجم له ملف؟ (تحذير واحد مجمّع، لا سطر لكل درس)
    lex_lessons = {l["id"] for l in lex.get("lessons", [])}
    missing = sorted(lex_lessons - seen_lesson_ids)
    if missing:
        rep.warn("W06", f"{len(missing)} درساً",
                 "معرّف في المعجم بلا ملف درس: " + "، ".join(missing))

    # بطاقات مرتبطة بدروس لا ملف لها بعد (متوقع أثناء البناء)
    orphans = sorted(c["id"] for c in lex.get("concepts", [])
                     if c.get("lessons") and not (set(c["lessons"]) & seen_lesson_ids))
    if orphans:
        rep.warn("W07", f"{len(orphans)} بطاقة",
                 "مرتبطة بدروس لا ملف لها بعد — مثال: " + "، ".join(orphans[:3]))

    print("\n--- النتيجة ---")
    if rep.errors or rep.warnings:
        rep.dump()
    if args.strict:
        rep.errors.extend(rep.warnings)
        rep.warnings = []

    n_err, n_warn = len(rep.errors), len(rep.warnings)
    print(f"\nملفات: {len(files)} | دروس في المعجم: {len(lex_lessons)} | أسئلة: {total_items}")
    print(f"أخطاء: {n_err} | تحذيرات: {n_warn}")
    if n_err == 0:
        print("✔ الربط ثنائي الاتجاه سليم في كل الملفات.")
        return 0
    print("✗ فشل التحقق.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
