/** تمارين التوطين التفاعلي — مستخرجة من ملف «التوطين الطبع» */

export interface MapZone {
  id: string;
  label: string;
  points: string;
}

export interface MapTarget {
  zone: string;
  name: string;
  hint: string;
}

export interface MapExercise {
  id: string;
  title: string;
  subject: "history" | "geography";
  image: string;
  instruction: string;
  note: string;
  zones: MapZone[];
  targets: MapTarget[];
}

export const MAPS: MapExercise[] = [
  {
    id: "us-industry",
    title: "المجالات الصناعية بالولايات المتحدة",
    subject: "geography",
    image: "./maps/us-industry.png",
    instruction: "عيّن على الخريطة المجال الصناعي المطلوب بالضغط على منطقته.",
    note: "النموذج 1 من ملف التوطين: الصناعات القديمة، الحديثة، والدقيقة.",
    zones: [
      { id: "old", label: "الصناعات القديمة", points: "55,8 88,10 92,45 78,52 62,48 55,30" },
      { id: "modern", label: "الصناعات الحديثة", points: "55,52 82,50 88,72 80,90 62,88 52,70" },
      { id: "precision", label: "الصناعات الدقيقة", points: "3,25 14,22 20,45 17,75 8,80 2,60" },
    ],
    targets: [
      { zone: "old", name: "الصناعات القديمة", hint: "شمال شرق الولايات المتحدة ومنطقة البحيرات الكبرى." },
      { zone: "modern", name: "الصناعات الحديثة", hint: "الجنوب والجنوب الشرقي (حزام الشمس)." },
      { zone: "precision", name: "الصناعات الدقيقة", hint: "الساحل الغربي (كاليفورنيا ومنطقة السيليكون)." },
    ],
  },
  {
    id: "us-agri",
    title: "المجالات الفلاحية بالولايات المتحدة",
    subject: "geography",
    image: "./maps/us-agri.png",
    instruction: "عيّن على الخريطة المجال الفلاحي المطلوب بالضغط على منطقته.",
    note: "النموذج 2 من ملف التوطين: الحبوب، المراعي، الزراعة المختلطة، والزراعات شبه المدارية.",
    zones: [
      { id: "grain", label: "زراعة الحبوب", points: "30,18 58,18 60,60 52,72 38,70 30,45" },
      { id: "pasture", label: "المراعي", points: "3,18 28,18 30,60 26,82 8,86 2,55" },
      { id: "mixed", label: "زراعة مختلطة وماشية", points: "62,12 90,12 90,42 74,48 62,38" },
      { id: "subtropical", label: "زراعات شبه مدارية", points: "58,70 82,68 86,88 74,95 60,88" },
    ],
    targets: [
      { zone: "grain", name: "زراعة الحبوب", hint: "السهول الكبرى في وسط البلاد." },
      { zone: "pasture", name: "المراعي", hint: "الغرب الجاف القريب من الجبال." },
      { zone: "mixed", name: "الزراعة المختلطة والماشية", hint: "الشمال الشرقي قرب البحيرات والمناطق الحضرية." },
      { zone: "subtropical", name: "الزراعات شبه المدارية", hint: "فلوريدا وسواحل خليج المكسيك." },
    ],
  },
  {
    id: "eu-expansion",
    title: "مراحل توسع الاتحاد الأوروبي",
    subject: "geography",
    image: "./maps/eu.png",
    instruction: "اضغط على البلد الذي ينتمي إلى موجة الانضمام المطلوبة.",
    note: "النموذج 3 من ملف التوطين: من المؤسسين 1957 إلى انسحاب بريطانيا 2020.",
    zones: [
      { id: "france", label: "فرنسا", points: "36,47 50,46 52,60 44,66 35,60" },
      { id: "uk", label: "بريطانيا", points: "27,24 39,22 40,38 31,41 25,33" },
      { id: "greece", label: "اليونان", points: "62,83 73,81 75,93 65,96" },
      { id: "spain", label: "إسبانيا", points: "16,67 32,65 34,78 24,83 15,76" },
      { id: "sweden", label: "السويد", points: "59,9 69,7 71,22 63,24" },
      { id: "poland", label: "بولونيا", points: "67,32 79,30 80,42 70,44" },
      { id: "romania", label: "رومانيا", points: "77,53 89,51 91,64 80,65" },
      { id: "croatia", label: "كرواتيا", points: "59,61 67,59 68,70 60,72" },
    ],
    targets: [
      { zone: "france", name: "بلد مؤسس سنة 1957", hint: "فرنسا من الدول الست المؤسسة." },
      { zone: "uk", name: "بلد انضم سنة 1973", hint: "بريطانيا (مع إيرلندا والدنمارك)." },
      { zone: "greece", name: "بلد انضم سنة 1981", hint: "اليونان." },
      { zone: "spain", name: "بلد انضم سنة 1986", hint: "إسبانيا (مع البرتغال)." },
      { zone: "sweden", name: "بلد انضم سنة 1995", hint: "السويد (مع فنلندا والنمسا)." },
      { zone: "poland", name: "بلد انضم سنة 2004", hint: "بولونيا ضمن موجة 2004 الكبرى." },
      { zone: "romania", name: "بلد انضم سنة 2007", hint: "رومانيا (مع بلغاريا)." },
      { zone: "croatia", name: "بلد انضم سنة 2013", hint: "كرواتيا." },
      { zone: "uk", name: "بلد انسحب سنة 2020", hint: "بريطانيا (Brexit)." },
    ],
  },
  {
    id: "china-agri",
    title: "المجالات الفلاحية بالصين",
    subject: "geography",
    image: "./maps/china-agri.png",
    instruction: "عيّن على الخريطة المجال الفلاحي المطلوب بالضغط على منطقته.",
    note: "النموذج 4 من ملف التوطين: الحبوب، الزراعات المدارية، وتربية المواشي.",
    zones: [
      { id: "grain", label: "زراعة الحبوب", points: "58,18 82,16 88,45 72,55 60,45 55,30" },
      { id: "tropical", label: "زراعات مدارية", points: "55,62 72,58 78,78 68,92 55,85 50,72" },
      { id: "livestock", label: "تربية المواشي", points: "15,22 50,18 55,45 48,60 25,65 8,50" },
    ],
    targets: [
      { zone: "grain", name: "زراعة الحبوب", hint: "السواحل الشرقية وسهل شمال شرق الصين." },
      { zone: "tropical", name: "الزراعات المدارية", hint: "الجنوب الصيني القريب من المدار." },
      { zone: "livestock", name: "تربية المواشي", hint: "الشمال والغرب (منغوليا الداخلية والهضاب)." },
    ],
  },
  {
    id: "china-industry",
    title: "التركز الصناعي بالصين",
    subject: "geography",
    image: "./maps/china-industry.png",
    instruction: "عيّن على الخريطة درجة التركز الصناعي المطلوبة.",
    note: "النموذج 5 من ملف التوطين: تركز هام، متوسط، وضعيف جداً.",
    zones: [
      { id: "high", label: "تركز صناعي هام", points: "70,28 88,26 92,55 82,75 70,68 66,48" },
      { id: "medium", label: "تركز صناعي متوسط", points: "48,20 68,18 69,45 60,58 50,52 44,35" },
      { id: "weak", label: "تركز صناعي ضعيف جداً", points: "5,25 44,22 45,55 38,75 12,72 3,50" },
    ],
    targets: [
      { zone: "high", name: "تركز صناعي هام", hint: "الساحل الشرقي: بكين، دلتا اليانغتسي، دلتا اللؤلؤ." },
      { zone: "medium", name: "تركز صناعي متوسط", hint: "الوسط والشمال الشرقي." },
      { zone: "weak", name: "تركز صناعي ضعيف جداً", hint: "الغرب الداخلي والهضاب." },
    ],
  },
];
