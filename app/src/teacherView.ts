/**
 * شاشة الأستاذ: مدار متوهج + محادثة صوتية/كتابية عربية مع إجابات من محتوى التطبيق.
 * آلة حالات: idle ←→ thinking ←→ speaking، وlistening يعلو على كل شيء.
 * الصوت كله مفوَّض إلى voiceEngine؛ هنا الواجهة والحالة فقط.
 */
import { icon } from "./icons";
import { askTutor, quickPrompts, tutorGreeting, type TutorRef, type TutorReply } from "./tutor";
import { createVoiceEngine, type VoiceEngine } from "./voiceEngine";

type Mood = "happy" | "explain" | "thinking" | "listening";
const MOODS: Mood[] = ["happy", "explain", "thinking", "listening"];

let voice: VoiceEngine | null = null;
let bindToken = 0;
let typingTimer: number | undefined;

type Phase = "idle" | "thinking" | "listening" | "speaking";
let phase: Phase = "idle";
let muted = false;
/** حالة سطرعلوي لاصقة (مثل «لا صوت عربي») حتى يتجاوزها حدث صوتي أو فعل مستخدم. */
let stickyStatus: { text: string; tone: string } | null = null;

/* ------------------------------ حالة الواجهة ------------------------------ */

function setStatus(text: string, tone = "") {
  const el = document.getElementById("teacherStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "teacher-status " + tone;
}

function paintStatus() {
  if (stickyStatus) {
    setStatus(stickyStatus.text, stickyStatus.tone);
    return;
  }
  switch (phase) {
    case "listening":
      setStatus("يستمع… تكلّم بالعربية", "listening");
      break;
    case "speaking":
      setStatus("يتحدث…", "talking");
      break;
    case "thinking":
      setStatus("يفكّر…", "thinking");
      break;
    default:
      setStatus(muted ? "الصوت مكتوم · النص متاح" : "جاهز · اسأل بالعربية", "");
  }
}

function setPhase(p: Phase) {
  phase = p;
  if (p !== "idle") stickyStatus = null;
  const wrap = document.getElementById("teacherChat");
  if (wrap) wrap.classList.toggle("listening", p === "listening");
  const btn = document.getElementById("micBtn");
  if (btn) {
    btn.classList.toggle("on", p === "listening");
    btn.setAttribute("aria-pressed", String(p === "listening"));
  }
  paintStatus();
}

function orb(): HTMLElement | null {
  return document.getElementById("teacherOrb");
}

function setMood(m: Mood) {
  const el = orb();
  if (!el) return;
  for (const x of MOODS) el.classList.toggle("mood-" + x, x === m);
}

function wave() {
  const el = orb();
  if (!el) return;
  el.classList.remove("wave");
  void el.offsetWidth;
  el.classList.add("wave");
  window.setTimeout(() => el.classList.remove("wave"), 2700);
}

function micNote(text: string, tone = "") {
  const el = document.getElementById("micNote");
  if (!el) return;
  el.textContent = text;
  el.className = "chat-note " + tone;
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
  voice?.speak(reply.text);
  if (reply.mood === "happy") wave();
}

function send(text: string) {
  const clean = text.trim();
  if (!clean || phase === "thinking") return;
  const input = document.getElementById("chatInput") as HTMLInputElement | null;
  if (input) input.value = "";
  stickyStatus = null;
  voice?.stop();
  addMessage("student", clean);
  setPhase("thinking");
  setMood("thinking");
  const log = chatLog();
  const t = typingRow();
  log?.appendChild(t);
  scrollChat();
  const token = bindToken;
  typingTimer = window.setTimeout(() => {
    if (token !== bindToken) return;
    t.remove();
    respond(askTutor(clean));
  }, 420);
}

/* ------------------------------ الصوت المسموع ------------------------------ */

/** النص المسموع يُكتب في حقل الإدخال أولاً ثم يُرسل — لا يضيع إن كان الأستاذ مشغولاً */
function submitVoice(text: string) {
  const input = document.getElementById("chatInput") as HTMLInputElement | null;
  const clean = text.trim();
  if (input && clean) {
    input.value = clean;
    input.focus();
  }
  if (phase !== "thinking") {
    send(clean);
  } else {
    micNote("سؤالك المسجل في مربع الكتابة — اضغط إرسال عندما يجهز الأستاذ.");
  }
}

/* ------------------------------ ربط الصوت بالواجهة ------------------------------ */

function bindVoiceHandlers() {
  voice = createVoiceEngine({
    onListeningChange(on) {
      if (on) {
        setPhase("listening");
        setMood("listening");
      } else if (phase === "listening") {
        setPhase("idle");
        setMood("explain");
      }
    },
    onSpeakingChange(on) {
      orb()?.classList.toggle("speaking", on);
      if (on) {
        stickyStatus = null;
        if (phase === "idle" || phase === "thinking") setPhase("speaking");
      } else if (phase === "speaking" || phase === "thinking") {
        setPhase("idle");
      }
    },
    onTranscript: (text) => submitVoice(text),
    onNote: (text, tone) => micNote(text, tone),
    onStatus: (text, tone) => {
      stickyStatus = { text, tone: tone ?? "" };
      paintStatus();
    },
  });
  voice.setMuted(muted);
}

/* ------------------------------ الواجهة ------------------------------ */

export function teacherView(): string {
  return `<a class="back" href="#/">${icon("arrow")} الرئيسية</a>
  <div class="teacher-desk">
    <div class="teacher-orb mood-happy" id="teacherOrb" role="img" aria-label="الأستاذ مرشدي" title="الأستاذ مرشدي">${icon("spark")}</div>
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
  bindVoiceHandlers();

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
    voice?.setMuted(muted);
    paintMute();
    if (muted) {
      voice?.stop();
      stickyStatus = null;
      paintStatus();
    } else {
      voice?.speak("عاد صوتي. اسألني ما شئت.");
    }
  });

  const greeting = tutorGreeting();
  addMessage("teacher", greeting.text);
  // يبدأ الأستاذ بالكلام وحده عند فتح الشاشة، ويُستأنف تلقائياً عند أول لمسة
  // إن منع المتصفح النطق قبل تفاعل المستخدم.
  window.setTimeout(() => {
    if (bindToken === token) voice?.speak(greeting.text);
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
  document.getElementById("micBtn")?.addEventListener("click", () => voice?.toggleMic());

  setMood("happy");
  window.setTimeout(wave, 500);

  (window as unknown as { __teacherCleanup?: () => void }).__teacherCleanup = () => destroyTeacher(false);
}

export function destroyTeacher(silent = true): void {
  bindToken++;
  phase = "idle";
  stickyStatus = null;
  window.clearTimeout(typingTimer);
  voice?.dispose();
  voice = null;
}
