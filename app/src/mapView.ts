/** عرض تمارين التوطين التفاعلي على الخرائط */

import { MAPS, type MapExercise } from "./maps";
import { icon } from "./icons";

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

let state = { id: "", i: 0, mistakes: 0, clean: 0, mistake: false, locked: false, done: false };

function reset(id: string): void {
  state = { id, i: 0, mistakes: 0, clean: 0, mistake: false, locked: false, done: false };
}

export function mapsIndexView(): string {
  return `<h1 class="page">تمارين التوطين التفاعلي</h1>
  <p class="lead">خمس خرائط من ملف «التوطين الطبع»: اقرأ المطلوب ثم اضغط على المجال الصحيح. إن أخطأت يوضح لك التطبيق المجال الذي اخترته والمجال الصحيح.</p>
  <div class="guide-grid maps-grid">
    ${MAPS.map(
      (m) => `<a class="gcard mapcard" href="#/maps/${m.id}">
        <img src="${m.image}" alt="${esc(m.title)}" loading="lazy" />
        <b>${esc(m.title)}</b>
        <small>${esc(m.note)}</small>
        <span class="gmore">${m.targets.length} أسئلة ←</span>
      </a>`,
    ).join("")}
  </div>
  <div class="note" style="margin-top:14px">${icon("compass")}<br />الخريطة مرسومة من ملف التوطين، والنقر داخل المجال هو الإجابة. لا تُحتسب نقطة نهائية: النتيجة تدريبية.</div>`;
}

export function mapExerciseView(id: string): string {
  const ex = MAPS.find((m) => m.id === id) as MapExercise | undefined;
  if (!ex) return `<div class="note">هذا التمرين غير موجود. <a href="#/maps">رجوع إلى الخرائط</a></div>`;
  if (state.id !== id || state.done) reset(id);
  const target = ex.targets[state.i];

  return `<a class="back" href="#/maps">${icon("arrow")} تمارين التوطين</a>
  <div class="maphead">
    <span class="tag geo">الجغرافيا</span>
    <h1 class="page">${esc(ex.title)}</h1>
    <p class="lead">${esc(ex.instruction)}</p>
  </div>
  <div class="mapbar">
    <span class="mapask">المطلوب: <b id="mapAsked">${esc(target.name)}</b></span>
    <span class="badge" id="mapProgress">${state.i + 1} / ${ex.targets.length}</span>
  </div>
  <div class="mapstage" id="mapStage">
    <img src="${ex.image}" alt="${esc(ex.title)}" />
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="مناطق قابلة للنقر">
      ${ex.zones.map((z) => `<polygon class="mapzone" data-zone="${z.id}" points="${z.points}"><title>${esc(z.label)}</title></polygon>`).join("")}
    </svg>
  </div>
  <div class="mapfeedback" id="mapFeedback" aria-live="polite">اضغط على المنطقة التي تطابق المطلوب.</div>
  <div class="mapresult" id="mapResult" hidden></div>
  <div class="row">
    <a class="btn ghost" href="#/maps">${icon("arrow")} كل الخرائط</a>
    <a class="btn ghost" href="#/guide/geo-map">${icon("bookOpen")} منهجية التوطين</a>
  </div>`;
}

export function bindMaps(): void {
  const stage = document.getElementById("mapStage");
  if (!stage) return;
  const ex = MAPS.find((m) => m.id === state.id);
  if (!ex) return;
  const feedback = document.getElementById("mapFeedback");
  if (!feedback) return;
  const stageEl = stage;
  const feedbackEl = feedback;

  stage.querySelectorAll<SVGPolygonElement>(".mapzone").forEach((poly) => {
    poly.addEventListener("click", () => {
      if (state.locked || state.done) return;
      const zoneId = poly.dataset.zone ?? "";
      const target = ex.targets[state.i];
      const zone = ex.zones.find((z) => z.id === zoneId);

      if (zoneId === target.zone) {
        state.locked = true;
        if (!state.mistake) state.clean++;
        poly.classList.add("right");
        feedback.className = "mapfeedback ok";
        feedback.textContent = `صحيح: ${target.name}. ${target.hint}`;
        window.setTimeout(() => {
          state.i++;
          if (state.i >= ex.targets.length) {
            finish(ex);
          } else {
            const next = ex.targets[state.i];
            const asked = document.getElementById("mapAsked");
            const prog = document.getElementById("mapProgress");
            if (asked) asked.textContent = next.name;
            if (prog) prog.textContent = `${state.i + 1} / ${ex.targets.length}`;
            stage.querySelectorAll(".mapzone").forEach((p) => p.classList.remove("right", "wrong"));
            feedback.className = "mapfeedback";
            feedback.textContent = "اضغط على المنطقة التي تطابق المطلوب.";
            state.mistake = false;
            state.locked = false;
          }
        }, 750);
      } else {
        state.locked = false;
        if (!state.mistake) {
          state.mistake = true;
          state.mistakes++;
        }
        poly.classList.add("wrong");
        window.setTimeout(() => poly.classList.remove("wrong"), 700);
        feedback.className = "mapfeedback bad";
        feedback.textContent = `ليس «${zone?.label ?? "هذه المنطقة"}». المطلوب: ${target.name} — ${target.hint}`;
      }
    });
  });

  function finish(exercise: MapExercise): void {
    state.done = true;
    const result = document.getElementById("mapResult");
    const asked = document.getElementById("mapAsked");
    const prog = document.getElementById("mapProgress");
    if (asked) asked.textContent = "انتهى التمرين";
    if (prog) prog.textContent = `${exercise.targets.length} / ${exercise.targets.length}`;
    feedbackEl.className = "mapfeedback ok";
    feedbackEl.textContent = "أتممت التمرين. راجع الأخطاء إن وقعت ثم جرّب خريطة أخرى.";
    stageEl.classList.add("finished");
    if (result) {
      result.hidden = false;
      result.innerHTML = `<b>النتيجة: ${state.clean} من ${exercise.targets.length} من المحاولة الأولى</b>
        <p class="muted small">الأخطاء المسجلة: ${state.mistakes}. ${state.clean === exercise.targets.length ? "توطين دقيق، أحسنت." : "أعد التمرين بعد مراجعة المنهجية."}</p>
        <a class="btn" href="#/maps">اختر خريطة أخرى</a>`;
    }
  }
}
