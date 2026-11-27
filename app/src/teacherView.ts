/** شاشة الأستاذ: شخصية 3D + محادثة صوتية/كتابية عربية مع إجابات من محتوى التطبيق */
import { icon } from "./icons";
import { askTutor, quickPrompts, tutorGreeting, type TutorRef, type TutorReply } from "./tutor";
import type { TeacherAvatar, AvatarMood } from "./avatar3d";

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

let avatar: TeacherAvatar | null = null;
let busy = false;
let muted = false;
let listening = false;
let bindToken = 0;
let webRec: WebSpeech | null = null;
let nativeStop: (() => void) | null = null;
let silenceTimer: number | undefined;
let typingTimer: number | undefined;

/* ------------------------------ أنواع Web Speech ------------------------------ */

interface SpeechResultAlt {
  transcript: string;
  confidence: number;
}
interface SpeechResult {
  isFinal: boolean;
  length: number;
  [i: number]: SpeechResultAlt;
}
interface SpeechEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechResult };
}
interface WebSpeech {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type WebSpeechCtor = new () => WebSpeech;
const speechWindow = window as unknown as {
  SpeechRecognition?: WebSpeechCtor;
  webkitSpeechRecognition?: WebSpeechCtor;
  Capacitor?: { isNativePlatform?: () => boolean };
};

const isNative = () => !!speechWindow.Capacitor?.isNativePlatform?.();

/* ------------------------------ الصوت ------------------------------ */

let voices: SpeechSynthesisVoice[] = [];
let voiceNoteShown = false;
let pendingSpeech = "";
let voiceTries = 0;
let unlockBound = false;
let speechToken = 0;

/* --------------------- النطق الأصلي على أندرويد (TTS) --------------------- */
// WebView لا يوفّر أصوات speechSynthesis على أندرويد، لذلك نستخدم محرك
// النطق الأصلي في الهاتف عبر إضافة Capacitor، وهو يدعم العربية مباشرة.

type NativeTtsModule = typeof import("@capacitor-community/text-to-speech");
let nativeModule: Promise<NativeTtsModule> | null = null;
let nativeLang: string | null = null;

function loadNativeTts(): Promise<NativeTtsModule> {
  if (!nativeModule) nativeModule = import("@capacitor-community/text-to-speech");
  return nativeModule;
}

async function pickNativeLang(TTS: NativeTtsModule["TextToSpeech"]): Promise<string | null> {
  if (nativeLang) return nativeLang;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      for (const lang of ["ar-MA", "ar-SA", "ar-EG", "ar"]) {
        const res = await TTS.isLanguageSupported({ lang });
        if (res.supported) {
          nativeLang = lang;
          return lang;
        }
      }
      return null;
    } catch {
      // قد يكون المحرك لم يكمل تهيئته بعد.
      await new Promise((r) => window.setTimeout(r, 300));
    }
  }
  return null;
}

async function speakNative(text: string) {
  const clean = cleanForSpeech(text).slice(0, 1800);
  const token = bindToken;
  const tok = ++speechToken;
  try {
    const { TextToSpeech } = await loadNativeTts();
    if (token !== bindToken || tok !== speechToken) return;
    const lang = await pickNativeLang(TextToSpeech);
    if (token !== bindToken || tok !== speechToken) return;
    if (!lang) {
      pendingSpeech = "";
      avatar?.setSpeaking(false);
      if (!listening) setStatus("النص متاح · لا صوت عربي", "");
      micNote(
        "لم يجد الهاتف صوتاً عربياً لمحرك النطق. ثمّن «أصوات Google» أو بيانات العربية من إعدادات الهاتف ← اللغة والإدخال ← تحويل النص إلى كلام، ثم أعد فتح التطبيق.",
        "warn",
      );
      return;
    }
    pendingSpeech = "";
    avatar?.setSpeaking(true);
    setStatus("يتحدث…", "talking");
    await TextToSpeech.speak({ text: clean, lang, rate: 0.95, pitch: 0.88, volume: 1 });
    if (tok !== speechToken) return;
    avatar?.setSpeaking(false);
    if (!listening) setStatus("جاهز · اسأل بالعربية", "");
  } catch {
    if (tok !== speechToken) return;
    pendingSpeech = "";
    avatar?.setSpeaking(false);
    if (!listening) setStatus("جاهز · اسأل بالعربية", "");
  }
}

function speakLater() {
  if (pendingSpeech && !muted && !listening) speak(pendingSpeech);
}

function bindSpeechUnlock() {
  if (unlockBound) return;
  unlockBound = true;
  document.addEventListener("pointerdown", speakLater);
  document.addEventListener("keydown", speakLater);
}

function unbindSpeechUnlock() {
  if (!unlockBound) return;
  unlockBound = false;
  document.removeEventListener("pointerdown", speakLater);
  document.removeEventListener("keydown", speakLater);
}

function refreshVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices();
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const ar = voices.filter((v) => v.lang?.toLowerCase().startsWith("ar"));
  const male = (v: SpeechSynthesisVoice) =>
    /male|ذكر|man\b|maged|tarik|hoda|salim|omar|youssef/i.test(v.name ?? "");
  const ma = ar.find((v) => v.lang === "ar-MA");
  const maleVoice = ar.find((v) => male(v));
  return maleVoice ?? ma ?? ar.find((v) => v.lang === "ar-SA") ?? ar.find((v) => v.lang === "ar-EG") ?? ar[0];
}

function setStatus(text: string, tone = "") {
  const el = document.getElementById("teacherStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "teacher-status " + tone;
}

function setExpression(text: string) {
  const el = document.getElementById("teacherExpression");
  if (el) el.textContent = text;
}

function setMood(m: AvatarMood) {
  avatar?.setMood(m);
  setExpression(
    m === "happy"
      ? "ابتسامة مرحّبة"
      : m === "thinking"
        ? "يفكّر معك"
        : m === "listening"
          ? "يستمع إليك"
          : "يشرح بهدوء",
  );
}

function cleanForSpeech(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[•·]/g, "،")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

function speak(text: string) {
  const clean = cleanForSpeech(text).slice(0, 1800);
  if (!clean) return;
  if (muted) {
    avatar?.setSpeaking(false);
    return;
  }
  pendingSpeech = text;
  // على الهاتف نستخدم محرك أندرويد الأصلي أولاً لأنه ينطق العربية بثبات.
  if (isNative()) {
    void speakNative(text);
    return;
  }
  if (!("speechSynthesis" in window)) {
    avatar?.setSpeaking(false);
    return;
  }
  bindSpeechUnlock();
  window.speechSynthesis.cancel();
  refreshVoices();
  const voice = pickVoice();
  // قد تُحمَّل الأصوات بعد أول رسم للصفحة؛ نعيد المحاولة بدل إسكات الأستاذ.
  if (!voice && voiceTries < 4) {
    const attempt = ++voiceTries;
    window.setTimeout(() => {
      if (pendingSpeech === text && !muted) speak(text);
    }, 350 * attempt);
    return;
  }
  if (!voice) {
    if (!voiceNoteShown) {
      voiceNoteShown = true;
      micNote("لا يوجد صوت عربي مثبّت على هذا الجهاز. النص مكتوب أمامك، ويمكنك تثبيت صوت عربي من إعدادات النظام لسماع الأستاذ.");
    }
    avatar?.setSpeaking(false);
    pendingSpeech = "";
    if (!listening) setStatus("جاهز · اسأل بالعربية", "");
    return;
  }
  voiceTries = 0;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = voice?.lang ?? "ar-MA";
  if (voice) u.voice = voice;
  u.rate = 0.97;
  u.pitch = 0.88;
  u.onstart = () => {
    pendingSpeech = "";
    avatar?.setSpeaking(true);
    setStatus("يتحدث…", "talking");
  };
  u.onend = () => {
    pendingSpeech = "";
    avatar?.setSpeaking(false);
    if (!listening) setStatus("جاهز · اسأل بالعربية", "");
  };
  u.onerror = () => {
    pendingSpeech = "";
    avatar?.setSpeaking(false);
    if (!listening) setStatus("جاهز · اسأل بالعربية", "");
  };
  if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  window.speechSynthesis.speak(u);
  window.setTimeout(() => {
    if (!("speechSynthesis" in window) || window.speechSynthesis.speaking) return;
    avatar?.setSpeaking(false);
    if (!listening) setStatus("جاهز · اسأل بالعربية", "");
  }, 1800);
}

function stopSpeech() {
  speechToken++;
  pendingSpeech = "";
  if (isNative()) {
    void loadNativeTts()
      .then(({ TextToSpeech }) => TextToSpeech.stop())
      .catch(() => void 0);
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  avatar?.setSpeaking(false);
}

/* ------------------------------ المحادثة ------------------------------ */

function chatLog(): HTMLElement | null {
  return document.getElementById("chatLog");
}

function scrollChat() {
  const log = chatLog();
  if (log) log.scrollTop = log.scrollHeight;
}

function bubble(
  role: "teacher" | "student",
  text: string,
  refs: TutorRef[] = [],
  followups: string[] = [],
): HTMLElement {
  const row = document.createElement("div");
  row.className = "msg " + role;
  if (role === "teacher") {
    const pic = document.createElement("img");
    pic.className = "msg-pic";
    pic.src = "./teacher.webp";
    pic.alt = "";
    row.appendChild(pic);
  }
  const body = document.createElement("div");
  body.className = "bubble";
  const p = document.createElement("p");
  p.textContent = text;
  body.appendChild(p);
  if (refs.length) {
    const wrap = document.createElement("div");
    wrap.className = "msg-refs";
    for (const r of refs) {
      const a = document.createElement("a");
      a.href = r.href;
      a.textContent = r.label;
      wrap.appendChild(a);
    }
    body.appendChild(wrap);
  }
  row.appendChild(body);
  if (role === "teacher" && followups.length) {
    const chips = document.createElement("div");
    chips.className = "msg-chips";
    followups.slice(0, 3).forEach((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chipbtn";
      b.textContent = f;
      b.addEventListener("click", () => send(f));
      chips.appendChild(b);
    });
    body.appendChild(chips);
  }
  return row;
}

function addMessage(role: "teacher" | "student", text: string, refs: TutorRef[] = [], followups: string[] = []) {
  const log = chatLog();
  if (!log) return;
  log.appendChild(bubble(role, text, refs, followups));
  scrollChat();
}

function typingRow(): HTMLElement {
  const row = document.createElement("div");
  row.className = "msg teacher typing";
  const body = document.createElement("div");
  body.className = "bubble";
  body.innerHTML = `<span class="dotpulse"><i></i><i></i><i></i></span>`;
  row.appendChild(body);
  return row;
}

function respond(reply: TutorReply) {
  addMessage("teacher", reply.text, reply.refs ?? [], reply.followups ?? []);
  setMood(reply.mood ?? "explain");
  speak(reply.text);
  if (reply.mood === "happy") avatar?.wave();
}

function send(text: string) {
  const clean = text.trim();
  if (!clean || busy) return;
  const input = document.getElementById("chatInput") as HTMLInputElement | null;
  if (input) input.value = "";
  stopSpeech();
  addMessage("student", clean);
  busy = true;
  setMood("thinking");
  setStatus("يفكّر…", "thinking");
  const log = chatLog();
  const t = typingRow();
  log?.appendChild(t);
  scrollChat();
  const token = bindToken;
  typingTimer = window.setTimeout(() => {
    if (token !== bindToken) return;
    t.remove();
    busy = false;
    respond(askTutor(clean));
  }, 420);
}

/* ------------------------------ الميكروفون ------------------------------ */

function micNote(text: string, tone = "") {
  const el = document.getElementById("micNote");
  if (!el) return;
  el.textContent = text;
  el.className = "chat-note " + tone;
}

function setMicUI(on: boolean) {
  listening = on;
  const btn = document.getElementById("micBtn");
  if (btn) {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
  }
  const wrap = document.getElementById("teacherChat");
  if (wrap) wrap.classList.toggle("listening", on);
  if (on) {
    setMood("listening");
    setStatus("يستمع… تكلّم بالعربية", "listening");
  } else if (!busy) {
    setStatus("جاهز · اسأل بالعربية", "");
  }
}

function cleanupSpeechInput() {
  window.clearTimeout(silenceTimer);
  if (webRec) {
    try {
      webRec.abort();
    } catch {
      /* ignore */
    }
    webRec = null;
  }
  if (nativeStop) {
    nativeStop();
    nativeStop = null;
  }
  setMicUI(false);
}

function finishWeb(rec: WebSpeech, transcript: string) {
  if (webRec !== rec) return;
  cleanupSpeechInput();
  const text = transcript.trim();
  if (text.length > 1) send(text);
  else micNote("لم أسمع عبارة واضحة. أعد المحاولة أو اكتب سؤالك.");
}

async function startWebMic(rec: WebSpeech) {
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      micNote("جارٍ طلب إذن الميكروفون…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop());
    }
    let transcript = "";
    let lastHeard = 0;
    rec.lang = "ar-MA";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setMicUI(true);
      stopSpeech();
      micNote("أستمع… تكلّم بالعربية، وسأرسل سؤالك عند توقفك عن الكلام.");
    };
    rec.onresult = (e) => {
      let text = "";
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      transcript = text;
      lastHeard = Date.now();
      micNote(`سمعت: «${text.trim()}»`);
      if (final) {
        window.clearTimeout(silenceTimer);
        silenceTimer = window.setTimeout(() => {
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
        }, 1400);
      }
    };
    let langFallbackTried = false;
    rec.onerror = (e) => {
      const code = e.error ?? "";
      if (code === "language-not-supported" && !langFallbackTried) {
        langFallbackTried = true;
        rec.lang = "ar-SA";
        try {
          rec.start();
        } catch {
          cleanupSpeechInput();
          micNote("تعذر التعرف الصوتي بالعربية على هذا المتصفح. اكتب سؤالك.", "warn");
        }
        return;
      }
      cleanupSpeechInput();
      micNote(
        code === "not-allowed" || code === "service-not-allowed"
          ? "لم يُسمح باستخدام الميكروفون. اسمح به من إعدادات المتصفح ثم أعد المحاولة، أو اكتب سؤالك."
          : code === "no-speech"
            ? "لم أسمع صوتاً. اضغط الميكروفون وحاول مرة أخرى."
            : "تعذر التعرف على الصوت الآن. يمكنك كتابة سؤالك.",
        "warn",
      );
    };
    rec.onend = () => finishWeb(rec, transcript);
    webRec = rec;
    rec.start();
  } catch {
    cleanupSpeechInput();
    micNote("تعذر تشغيل الميكروفون. تحقق من الإذن أو اكتب سؤالك.", "warn");
  }
}

async function startNativeMic() {
  micNote("جارٍ طلب إذن الميكروفون…");
  try {
    const mod = await import("@capacitor-community/speech-recognition");
    const SR = mod.SpeechRecognition;
    const avail = await SR.available();
    if (!avail.available) {
      micNote("التعرف الصوتي غير متاح على هذا الجهاز. اكتب سؤالك بالعربية.", "warn");
      return;
    }
    const perm = await SR.requestPermissions();
    if (perm.speechRecognition !== "granted") {
      micNote("لم يُسمح باستخدام الميكروفون. فعّل الإذن من إعدادات التطبيق أو اكتب سؤالك.", "warn");
      return;
    }
    let transcript = "";
    let finished = false;
    let partialHandle: { remove: () => Promise<void> } | null = null;
    let stateHandle: { remove: () => Promise<void> } | null = null;

    const cleanup = () => {
      window.clearTimeout(silenceTimer);
      void partialHandle?.remove();
      void stateHandle?.remove();
      void SR.removeAllListeners();
      nativeStop = null;
      setMicUI(false);
    };

    const finish = async () => {
      if (finished) return;
      finished = true;
      try {
        await SR.stop();
      } catch {
        /* ignore */
      }
      cleanup();
      const text = transcript.trim();
      if (text.length > 1) send(text);
      else micNote("لم أسمع عبارة واضحة. أعد المحاولة أو اكتب سؤالك.");
    };

    nativeStop = () => {
      finished = true;
      cleanup();
      void SR.stop().catch(() => void 0);
    };

    partialHandle = await SR.addListener("partialResults", (data) => {
      const t = data.matches?.[0] ?? "";
      if (!t) return;
      transcript = t;
      micNote(`سمعت: «${t}»`);
      window.clearTimeout(silenceTimer);
      silenceTimer = window.setTimeout(() => void finish(), 1700);
    });
    stateHandle = await SR.addListener("listeningState", (state) => {
      if (state.status === "started") {
        setMicUI(true);
        stopSpeech();
        micNote("أستمع… تكلّم بالعربية، وسأرسل سؤالك عند التوقف.");
      } else if (state.status === "stopped" && listening) {
        void finish();
      }
    });

    const options = {
      language: "ar-MA",
      maxResults: 1,
      prompt: "تحدث بالعربية الآن",
      partialResults: true,
      popup: false,
    };
    try {
      await SR.start(options);
    } catch {
      try {
        await SR.start({ ...options, language: "ar-SA" });
      } catch {
        cleanup();
        micNote("تعذر بدء التعرف الصوتي بالعربية على هذا الجهاز. اكتب سؤالك.", "warn");
      }
    }
  } catch {
    micNote("تعذر تشغيل الميكروفون. تحقق من الإذن أو اكتب سؤالك.", "warn");
  }
}

function toggleMic() {
  if (listening) {
    cleanupSpeechInput();
    micNote("أوقفت الاستماع. يمكنك الكتابة أو إعادة المحاولة.");
    return;
  }
  if (isNative()) {
    void startNativeMic();
    return;
  }
  const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  if (!Ctor) {
    micNote("هذا المتصفح لا يدعم التعرف الصوتي. اكتب سؤالك بالعربية، أو افتح التطبيق على Chrome/أندرويد.", "warn");
    return;
  }
  void startWebMic(new Ctor());
}

/* ------------------------------ الواجهة ------------------------------ */

export function teacherView(): string {
  return `<a class="back" href="#/">${icon("arrow")} الرئيسية</a>
  <div class="teacher-wrap">
    <section class="avatar-panel" aria-label="الأستاذ مرشدي ثلاثي الأبعاد">
      <div class="avatar-stage" id="avatarStage">
        <img class="avatar-fallback" src="./teacher.webp" alt="الأستاذ مرشدي" />
        <div class="avatar-loading" id="avatarLoading">${icon("spark")} جارٍ تجهيز الأستاذ…</div>
        <span class="avatar-tag">${icon("spark")} ثلاثي الأبعاد · تفاعلي</span>
      </div>
      <div class="avatar-caption">
        <div class="avatar-id">
          <b>الأستاذ مرشدي</b>
          <span>مدرس التاريخ والجغرافيا</span>
        </div>
        <span class="expression" id="teacherExpression">ابتسامة مرحّبة</span>
      </div>
      <p class="avatar-say">اسألني عن أي درس أو مفهوم أو منهجية، أو قل «اختبرني» لأطرح عليك سؤالاً. سأجيبك بالعربية من محتوى التطبيق.</p>
      <div class="avatar-facts">
        <span>${icon("bookOpen")} الدروس</span>
        <span>${icon("library")} المعجم</span>
        <span>${icon("compass")} المنهجية</span>
        <span>${icon("target")} الخرائط</span>
      </div>
    </section>

    <section class="chat-panel" id="teacherChat" aria-label="محادثة الأستاذ">
      <header class="chat-top">
        <div class="chat-id">
          <span class="live-dot"></span>
          <div><b>محادثة مباشرة</b><small id="teacherStatus">جاهز · اسأل بالعربية</small></div>
        </div>
        <button class="iconbtn" id="muteBtn" type="button" aria-pressed="false" title="تشغيل/كتم صوت الأستاذ">${icon("volume")}</button>
      </header>

      <div class="chat-log" id="chatLog" aria-live="polite"></div>

      <div class="chat-suggest" id="chatSuggest"></div>

      <form class="chat-form" id="chatForm" autocomplete="off">
        <button class="mic-btn" id="micBtn" type="button" aria-pressed="false" title="التحدث بالعربية">${icon("mic")}</button>
        <input id="chatInput" name="q" placeholder="اكتب سؤالك بالعربية…" aria-label="سؤالك" maxlength="300" />
        <button class="send-btn" type="submit" title="إرسال">${icon("send")}</button>
      </form>
      <div class="chat-note" id="micNote">الميكروفون يعمل بعد إذنك، ولا نحتفظ بالتسجيلات. يمكنك الكتابة دائماً.</div>
    </section>
  </div>`;
}

export async function bindTeacher(): Promise<void> {
  const token = ++bindToken;
  destroyTeacher(true);
  bindToken = token;

  muted = localStorage.getItem("marhadi-teacher-mute") === "1";
  const muteBtn = document.getElementById("muteBtn");
  const paintMute = () => {
    if (!muteBtn) return;
    muteBtn.classList.toggle("muted", muted);
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.title = muted ? "تشغيل صوت الأستاذ" : "كتم صوت الأستاذ";
    muteBtn.innerHTML = muted ? icon("volumeOff") : icon("volume");
  };
  paintMute();
  muteBtn?.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("marhadi-teacher-mute", muted ? "1" : "0");
    paintMute();
    if (muted) {
      stopSpeech();
      setStatus("الصوت مكتوم · النص متاح", "");
    } else {
      speak("عاد صوتي. اسألني ما شئت.");
    }
  });

  const greeting = tutorGreeting();
  addMessage("teacher", greeting.text);
  // يبدأ الأستاذ بالكلام وحده عند فتح الشاشة، ويُستأنف تلقائياً عند أول لمسة
  // إن منع المتصفح النطق قبل تفاعل المستخدم.
  window.setTimeout(() => {
    if (bindToken === token) speak(greeting.text);
  }, 250);
  const suggest = document.getElementById("chatSuggest");
  if (suggest) {
    for (const p of quickPrompts()) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chipbtn";
      b.textContent = p;
      b.addEventListener("click", () => send(p));
      suggest.appendChild(b);
    }
  }

  const form = document.getElementById("chatForm") as HTMLFormElement | null;
  const input = document.getElementById("chatInput") as HTMLInputElement | null;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input?.value ?? "");
  });
  document.getElementById("micBtn")?.addEventListener("click", toggleMic);

  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  const stage = document.getElementById("avatarStage");
  if (stage) {
    try {
      const mod = await import("./avatar3d");
      if (token !== bindToken) return;
      avatar = mod.createTeacherAvatar(stage);
      document.getElementById("avatarLoading")?.remove();
      stage.querySelector(".avatar-fallback")?.remove();
      setMood("happy");
      const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
      if (synth?.speaking) avatar.setSpeaking(true);
      window.setTimeout(() => {
        if (token === bindToken) avatar?.wave();
      }, 500);
    } catch {
      document.getElementById("avatarLoading")?.remove();
      stage.classList.add("fallback");
      micNote("تعذر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز؛ تبقى المحادثة متاحة.", "warn");
    }
  }

  (window as unknown as { __teacherCleanup?: () => void }).__teacherCleanup = () => destroyTeacher(false);
}

export function destroyTeacher(silent = true): void {
  bindToken++;
  pendingSpeech = "";
  voiceTries = 0;
  unbindSpeechUnlock();
  cleanupSpeechInput();
  stopSpeech();
  window.clearTimeout(typingTimer);
  if (avatar) {
    avatar.dispose();
    avatar = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null;
  busy = false;
  if (!silent) listening = false;
}
