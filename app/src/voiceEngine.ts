/**
 * محرك صوت الأستاذ: تحويل الكلام إلى نص والنطق.
 * يعمل في المتصفح عبر Web Speech API، وعلى أندرويد عبر إضافات Capacitor.
 * لا يعرف شيئاً عن الواجهة أو الأفاتار — يُبلّغ عنها بأحداث فقط.
 */

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

/* ------------------------------ الواجهة العامة ------------------------------ */

export interface VoiceEngineHandlers {
  /** تغيّرت حالة الاستماع (الميكروفون). */
  onListeningChange(on: boolean): void;
  /** تغيّرت حالة النطق — تُستدعى true عند بدء الصوت وfalse عند نهايته أو فشله. */
  onSpeakingChange(on: boolean): void;
  /** وصل نص نهائي من التعرف الصوتي — على الواجهة عرضه/إرساله. */
  onTranscript(text: string): void;
  /** ملاحظة قصيرة تحت مربع الكتابة (#micNote). */
  onNote(text: string, tone?: string): void;
  /** تجاوز لحالة السطر العلوي (#teacherStatus) لحالات استثنائية. */
  onStatus?(text: string, tone?: string): void;
}

export interface VoiceEngine {
  /** ينطق النص. يضمن استدعاء onSpeakingChange(false) مرة واحدة على الأقل عند انتهاء المحاولة. */
  speak(text: string): void;
  /** يوقف أي كلام جارٍ ويلغي الكلام المؤجل. */
  stop(): void;
  /** يبدّل الميكروفون: إيقاف الاستماع أو بدؤه. */
  toggleMic(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  isListening(): boolean;
  dispose(): void;
}

/* ------------------------------ إنشاء المحرك ------------------------------ */

export function createVoiceEngine(h: VoiceEngineHandlers): VoiceEngine {
  let alive = true;
  let muted = false;
  let listening = false;
  let speaking = false;

  let webRec: WebSpeech | null = null;
  let nativeStop: (() => void) | null = null;
  let silenceTimer: number | undefined;
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

  /* ------------------------------ الصوت ------------------------------ */

  let voices: SpeechSynthesisVoice[] = [];
  let voiceNoteShown = false;
  let pendingSpeech = "";
  let voiceTries = 0;
  let unlockBound = false;

  function setSpeaking(on: boolean) {
    if (!alive || on === speaking) return;
    speaking = on;
    h.onSpeakingChange(on);
  }

  /** نهاية محاولة النطق: يضمن إشعاراً واحداً بـfalse حتى لو لم يبدأ الصوت فعلياً. */
  function endSpeak() {
    speaking = false;
    if (alive) h.onSpeakingChange(false);
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

  function cleanForSpeech(text: string) {
    return text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[•·]/g, "،")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function speakNative(text: string) {
    const clean = cleanForSpeech(text).slice(0, 1800);
    const tok = ++speechToken;
    try {
      const { TextToSpeech } = await loadNativeTts();
      if (!alive || tok !== speechToken) return;
      const lang = await pickNativeLang(TextToSpeech);
      if (!alive || tok !== speechToken) return;
      if (!lang) {
        pendingSpeech = "";
        endSpeak();
        h.onStatus?.("النص متاح · لا صوت عربي", "");
        h.onNote(
          "لم يجد الهاتف صوتاً عربياً لمحرك النطق. ثمّن «أصوات Google» أو بيانات العربية من إعدادات الهاتف ← اللغة والإدخال ← تحويل النص إلى كلام، ثم أعد فتح التطبيق.",
          "warn",
        );
        return;
      }
      pendingSpeech = "";
      setSpeaking(true);
      await TextToSpeech.speak({ text: clean, lang, rate: 0.95, pitch: 0.88, volume: 1 });
      if (!alive || tok !== speechToken) return;
      endSpeak();
    } catch {
      if (!alive || tok !== speechToken) return;
      pendingSpeech = "";
      endSpeak();
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

  function speak(text: string) {
    const clean = cleanForSpeech(text).slice(0, 1800);
    if (!clean || muted) {
      endSpeak();
      return;
    }
    pendingSpeech = text;
    // على الهاتف نستخدم محرك أندرويد الأصلي أولاً لأنه ينطق العربية بثبات.
    if (isNative()) {
      void speakNative(text);
      return;
    }
    if (!("speechSynthesis" in window)) {
      endSpeak();
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
        if (alive && pendingSpeech === text && !muted) speak(text);
      }, 350 * attempt);
      return;
    }
    if (!voice) {
      voiceTries = 0;
      if (!voiceNoteShown) {
        voiceNoteShown = true;
        h.onNote("لا يوجد صوت عربي مثبّت على هذا الجهاز. النص مكتوب أمامك، ويمكنك تثبيت صوت عربي من إعدادات النظام لسماع الأستاذ.");
      }
      pendingSpeech = "";
      endSpeak();
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
      setSpeaking(true);
    };
    u.onend = () => {
      pendingSpeech = "";
      endSpeak();
    };
    u.onerror = () => {
      pendingSpeech = "";
      endSpeak();
    };
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.speak(u);
    window.setTimeout(() => {
      if (!alive || !("speechSynthesis" in window) || window.speechSynthesis.speaking) return;
      endSpeak();
    }, 1800);
  }

  function stop() {
    speechToken++;
    pendingSpeech = "";
    if (isNative()) {
      void loadNativeTts()
        .then(({ TextToSpeech }) => TextToSpeech.stop())
        .catch(() => void 0);
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    endSpeak();
  }

  /* ------------------------------ الميكروفون ------------------------------ */

  function setListening(on: boolean) {
    if (!alive || on === listening) return;
    listening = on;
    h.onListeningChange(on);
  }

  function stopMic() {
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
    setListening(false);
  }

  function finishTranscript(transcript: string) {
    const text = transcript.trim();
    if (text.length > 1) h.onTranscript(text);
    else h.onNote("لم أسمع عبارة واضحة. أعد المحاولة أو اكتب سؤالك.");
  }

  async function startWebMic(rec: WebSpeech) {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        h.onNote("جارٍ طلب إذن الميكروفون…");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((tr) => tr.stop());
      }
      let transcript = "";
      rec.lang = "ar-MA";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => {
        setListening(true);
        stop();
        h.onNote("أستمع… تكلّم بالعربية، وسأرسل سؤالك عند توقفك عن الكلام.");
      };
      rec.onresult = (e) => {
        let text = "";
        let final = false;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
          if (e.results[i].isFinal) final = true;
        }
        transcript = text;
        h.onNote(`سمعت: «${text.trim()}»`);
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
            stopMic();
            h.onNote("تعذر التعرف الصوتي بالعربية على هذا المتصفح. اكتب سؤالك.", "warn");
          }
          return;
        }
        stopMic();
        h.onNote(
          code === "not-allowed" || code === "service-not-allowed"
            ? "لم يُسمح باستخدام الميكروفون. اسمح به من إعدادات المتصفح ثم أعد المحاولة، أو اكتب سؤالك."
            : code === "no-speech"
              ? "لم أسمع صوتاً. اضغط الميكروفون وحاول مرة أخرى."
              : "تعذر التعرف على الصوت الآن. يمكنك كتابة سؤالك.",
          "warn",
        );
      };
      rec.onend = () => {
        if (webRec !== rec) return;
        stopMic();
        finishTranscript(transcript);
      };
      webRec = rec;
      rec.start();
    } catch {
      stopMic();
      h.onNote("تعذر تشغيل الميكروفون. تحقق من الإذن أو اكتب سؤالك.", "warn");
    }
  }

  async function startNativeMic() {
    h.onNote("جارٍ طلب إذن الميكروفون…");
    try {
      const mod = await import("@capacitor-community/speech-recognition");
      const SR = mod.SpeechRecognition;
      const avail = await SR.available();
      if (!alive) return;
      if (!avail.available) {
        h.onNote("التعرف الصوتي غير متاح على هذا الجهاز. اكتب سؤالك بالعربية.", "warn");
        return;
      }
      const perm = await SR.requestPermissions();
      if (!alive) return;
      if (perm.speechRecognition !== "granted") {
        h.onNote("لم يُسمح باستخدام الميكروفون. فعّل الإذن من إعدادات التطبيق أو اكتب سؤالك.", "warn");
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
        setListening(false);
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
        finishTranscript(transcript);
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
        h.onNote(`سمعت: «${t}»`);
        window.clearTimeout(silenceTimer);
        silenceTimer = window.setTimeout(() => void finish(), 1700);
      });
      stateHandle = await SR.addListener("listeningState", (state) => {
        if (state.status === "started") {
          setListening(true);
          stop();
          h.onNote("أستمع… تكلّم بالعربية، وسأرسل سؤالك عند التوقف.");
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
        if (!alive) return;
        try {
          await SR.start({ ...options, language: "ar-SA" });
        } catch {
          cleanup();
          h.onNote("تعذر بدء التعرف الصوتي بالعربية على هذا الجهاز. اكتب سؤالك.", "warn");
        }
      }
    } catch {
      if (!alive) return;
      h.onNote("تعذر تشغيل الميكروفون. تحقق من الإذن أو اكتب سؤالك.", "warn");
    }
  }

  function toggleMic() {
    if (listening) {
      stopMic();
      h.onNote("أوقفت الاستماع. يمكنك الكتابة أو إعادة المحاولة.");
      return;
    }
    if (isNative()) {
      void startNativeMic();
      return;
    }
    const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Ctor) {
      h.onNote("هذا المتصفح لا يدعم التعرف الصوتي. اكتب سؤالك بالعربية، أو افتح التطبيق على Chrome/أندرويد.", "warn");
      return;
    }
    void startWebMic(new Ctor());
  }

  /* ------------------------------ دورة الحياة ------------------------------ */

  refreshVoices();
  if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = refreshVoices;

  return {
    speak,
    stop,
    toggleMic,
    setMuted(m: boolean) {
      muted = m;
    },
    isMuted: () => muted,
    isListening: () => listening,
    dispose() {
      alive = false;
      speechToken++;
      pendingSpeech = "";
      voiceTries = 0;
      unbindSpeechUnlock();
      stopMic();
      stop();
      window.clearTimeout(silenceTimer);
      if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null;
    },
  };
}
