#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تصحيحات المراجعة النقدية للدروس T1–T8 وG1–G7."""
import json

BASE = "content/2bac-ad/lessons/"


def load(n):
    return json.load(open(BASE + n + ".json", encoding="utf-8"))


def save(n, d):
    json.dump(d, open(BASE + n + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def item(d, iid):
    return next(i for i in d["items"] if i["id"] == iid)


def repl_all(obj, old, new):
    if isinstance(obj, str):
        return obj.replace(old, new)
    if isinstance(obj, list):
        return [repl_all(x, old, new) for x in obj]
    if isinstance(obj, dict):
        return {k: repl_all(v, old, new) for k, v in obj.items()}
    return obj


# ---------- T01 ----------
d = load("t01")
item(d, "q-t01-04")["options"][3] = "18 يناير و28 يونيو 1919"
item(d, "q-t01-10")["answer"] = 2
item(d, "q-t01-10")["distractors"] = [{"i": 0, "misconceptionId": "m-league-united-nations"}]
for t in d["timeline"]:
    if t["date"] == "12 يناير 1919":
        t["date"] = "18 يناير 1919"
        t["label"] = "افتتاح مؤتمر السلام بباريس"
    if t["date"] == "1919":
        t["date"] = "10 يناير 1920"
        t["label"] = "التأسيس الفعلي لعصبة الأمم (بعد اعتماد ميثاقها سنة 1919)"
d = repl_all(d, "12 يناير", "18 يناير")
save("t01", d)

# ---------- T02 ----------
d = load("t02")
item(d, "q-t02-10")["options"][2] = "مزارع حكومية (سوفخوز) وتعاونيات جماعية (كلخوز)"
save("t02", d)

# ---------- T04 ----------
d = load("t04")
it = item(d, "q-t04-07")
it["options"][0] = "بداية 1943"
it["distractors"] = [{"i": 1, "misconceptionId": "m-stalingrad-1944"}]
item(d, "q-t04-12")["options"][1] = "انسحاب ألمانيا (1933) وإيطاليا (1937) من عصبة الأمم وتكوين المحور الثلاثي 1937"
for t in d["timeline"]:
    if t["date"] == "أواخر 1942":
        t["date"] = "فبراير 1943"
        t["label"] = "انتصار ستالينغراد وبداية تحول موازين الحرب"
save("t04", d)

# ---------- T06 ----------
d = load("t06")
item(d, "q-t06-01")["options"][0] = "إحداث وكالات الإيداع والقرض مثل البنك المخزني سنة 1907"
for t in d["timeline"]:
    if t["date"] == "1907":
        t["label"] = "إحداث البنك المخزني"
save("t06", d)

# ---------- T08 ----------
d = load("t08")
it = item(d, "q-t08-01")
it["answer"] = 0
it["distractors"] = []
it = item(d, "q-t08-05")
it["stem"] = "نص قرار التقسيم 181 على:"
it["options"] = ["دولتين عربية ويهودية والقدس منطقة دولية", "دولة فيدرالية واحدة", "دولتين عربيتين", "دولة يهودية فقط"]
it["answer"] = 0
it["distractors"] = []
it = item(d, "q-t08-06")
it["stem"] = "من اعترف بدولة إسرائيل فور إعلان قيامها سنة 1948؟"
it["options"] = ["الولايات المتحدة والاتحاد السوفيتي", "فرنسا وبريطانيا", "الدول العربية", "عصبة الأمم"]
it["answer"] = 0
it["distractors"] = []
for t in d["timeline"]:
    if t["date"] == "1993":
        t["label"] = "اتفاق أوسلو وإنشاء السلطة الوطنية الفلسطينية"
save("t08", d)

# ---------- G02 ----------
d = load("g02")
item(d, "q-g02-04")["stem"] = "الناتج الوطني الخام (PNB) هو:"
save("g02", d)

# ---------- G03 ----------
d = load("g03")
d = repl_all(d, "البيجهوية", "البين-جهوية")
save("g03", d)

# ---------- G04 ----------
d = load("g04")
d = repl_all(d, "كيوطو", "كيوتو")
save("g04", d)

# ---------- G05 ----------
d = load("g05")
for r in d["matrix"]["rows"]:
    r["cells"] = [c.replace("نحو 5 ملايين كلم مربع", "نحو 4.2 مليون كلم مربع").replace("نحو 500 مليون نسمة", "نحو 450 مليون نسمة") for c in r["cells"]]
idx = next(i for i, t in enumerate(d["timeline"]) if t["date"] == "1992")
d["timeline"].insert(idx + 1, {"date": "1993", "label": "دخول معاهدة ماستريخت حيز التنفيذ", "conceptId": "c-eu-integration"})
save("g05", d)

# ---------- G06 ----------
d = load("g06")
item(d, "q-g06-02")["stem"] = "وقع اتفاق التبادل الحر بين الولايات المتحدة وكندا سنة:"
for t in d["timeline"]:
    if t["date"] == "1988":
        t["label"] = "توقيع اتفاق التبادل الحر بين الولايات المتحدة وكندا (ALEA)"
save("g06", d)

# ---------- G07 ----------
d = load("g07")
item(d, "q-g07-07")["options"][2] = "كمبوديا ولاوس وميانمار"
it = item(d, "q-g07-12")
it["stem"] = "أبرز تحول في مسار آسيان منذ سنة 2015 هو:"
it["options"] = ["إطلاق المجموعة الاقتصادية لآسيان", "إلغاء مبدأ عدم التدخل", "تحول الرابطة إلى اتحاد سياسي", "انسحاب الدول الخمس المؤسسة"]
it["answer"] = 0
it["distractors"] = [{"i": 2, "misconceptionId": "m-integration-same-as-fta"}]
save("g07", d)

# ---------- المعجم ----------
lp = "content/2bac-ad/lexicon.json"
lex = json.load(open(lp, encoding="utf-8"))
by = {c["id"]: c for c in lex["concepts"]}
by["c-league-of-nations"]["def"] = (
    "منظمة تأسست فعلياً في 10 يناير 1920 باقتراح من الرئيس الأمريكي ولسون، بعد اعتماد ميثاقها سنة 1919، "
    "لتنظيم العلاقات الدولية وضمان السلم؛ وقد فشلت في مواجهة الأزمات الدولية."
)
by["c-sovkhoz-kolkhoz"]["def"] = (
    "السوفخوزات مزارع حكومية يملكها الدولة، والكلخوزات تعاونيات فلاحية جماعية أُجبر الفلاحون على الانضمام إليها، "
    "واعتمدها ستالين لتطوير الفلاحة في إطار التخطيط السوفياتي."
)
by["c-stalingrad"]["def"] = (
    "معركة انتهت بانتصار الجيش السوفياتي في فبراير 1943 بعد محاصرة الجيش الألماني، "
    "وتُعد نقطة تحوّل الحرب لصالح الحلفاء على الجبهة الشرقية."
)
by["c-kyoto-protocol"]["term"] = "اتفاقية كيوتو"
by["c-kyoto-protocol"]["def"] = by["c-kyoto-protocol"]["def"].replace("كيوطو", "كيوتو")
for m in lex["misconceptions"]:
    if m["id"] == "m-league-united-nations":
        m["fix"] = "عصبة الأمم تأسست فعلياً سنة 1920 (ميثاقها 1919) باقتراح ولسون؛ وهيئة الأمم المتحدة جاءت بعد الحرب العالمية الثانية سنة 1945."
    elif m["id"] == "m-kolkhoz-private":
        m["fix"] = "السوفخوزات مزارع حكومية، والكلخوزات تعاونيات جماعية؛ وليست ملكيات خاصة."
    elif m["id"] == "m-stalingrad-1944":
        m["fix"] = "ستالينغراد انتهت في فبراير 1943؛ ونورماندي 1944."
    elif m["id"] == "m-kyoto-morocco-only":
        m["claim"] = "اتفاقية كيوتو خاصة بالبلدان النامية وحدها."
        m["fix"] = "اتفاقية كيوتو تُلزم الدول الموقعة، وأثرها الأكبر على الدول الصناعية الملوِّثة."
json.dump(lex, open(lp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("applied T1-T8 / G1-G7 fixes")
