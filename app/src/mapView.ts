/** عرض تمارين التوطين التفاعلي على خرائط SVG دقيقة */

import { MAPS, type MapExercise } from "./maps";
import { GEO } from "./mapShapes";
import { icon } from "./icons";

const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface MapState {
  id: string;
  i: number;
  mistakes: number;
  clean: number;
  mistake: boolean;
  locked: boolean;
  done: boolean;
}

const blank = (id = ""): MapState => ({
  id,
  i: 0,
  mistakes: 0,
  clean: 0,
  mistake: false,
  locked: false,
  done: false,
});

let state: MapState = blank();

/** خريطة SVG: سياق رمادي + حدود الدولة + مجالات قابلة للنقر مقصوصة داخل الحدود */
function mapSVG(ex: MapExercise, interactive: boolean): string {
  const g = GEO[ex.mapId];
  if (!g) return "";
  const clipId = `clip-${ex.mapId}`;
  const zones = interactive
    ? g.zones
        .map(
          (z) =>
            `<path class="mapzone" data-zone="${esc(z.id)}" d="${z.d}" role="button" tabindex="0" aria-label="${esc(
              z.label,
            )}"><title>${esc(z.label)}</title></path>`,
        )
        .join("")
    : "";
  return `<svg class="mapsvg" viewBox="${g.viewBox}" role="img" aria-label="${esc(ex.title)}">
    ${g.outline ? `<defs><clipPath id="${clipId}"><path d="${g.outline}" /></clipPath></defs>` : ""}
    <g class="mapctx">${g.context.map((d) => `<path d="${d}" />`).join("")}</g>
    ${g.outline ? `<path class="mapbase" d="${g.outline}" />` : ""}
    ${interactive ? `<g class="mapzones"${g.outline ? ` clip-path="url(#${clipId})"` : ""}>${zones}</g>` : ""}
  </svg>`;
}

function miniMap(ex: MapExercise): string {
  const g = GEO[ex.mapId];
  if (!g) return "";
  return `<div class="mapthumb"><svg viewBox="${g.viewBox}" aria-hidden="true">
    <g class="mapctx">${g.context.map((d) => `<path d="${d}" />`).join("")}</g>
    ${g.outline ? `<path class="mapbase" d="${g.outline}" />` : ""}
    <g class="mapzones">${g.zones.map((z) => `<path class="mapzone mini" d="${z.d}" />`).join("")}</g>
  </svg></div>`;
}

export function mapsIndexView(): string {
  state = blank();
  return `<h1 class="page">تمارين التوطين التفاعلي</h1>
  <p class="lead">خرائط مرسومة من حدود جغرافية حقيقية: اقرأ المطلوب ثم اضغط على المجال الصحيح داخل الخريطة. إن أخطأت يوضح لك التطبيق المجال الذي اخترته والمجال الصحيح. خريطة المغرب تشمل الصحراء المغربية.</p>
  <div class="guide-grid maps-grid">
    ${MAPS.map(
      (m) => `<a class="gcard mapcard" href="#/maps/${m.id}">
        ${miniMap(m)}
        <b>${esc(m.title)}</b>
        <small>${esc(m.note)}</small>
        <span class="gmore">${m.targets.length} أسئلة ←</span>
      </a>`,
    ).join("")}
  </div>
  <div class="note" style="margin-top:14px">${icon("compass")}<br />النقر داخل المجال هو الإجابة، والمجالات مقصوصة داخل حدود الدولة. لا تُحتسب نقطة نهائية: النتيجة تدريبية.</div>`;
}

export function mapExerciseView(id: string): string {
  const ex = MAPS.find((m) => m.id === id);
  if (!ex) return `<div class="note">هذا التمرين غير موجود. <a href="#/maps">رجوع إلى الخرائط</a></div>`;
  if (state.id !== id) state = blank(id);

  const head = `<a class="back" href="#/maps">${icon("arrow")} تمارين التوطين</a>
  <div class="maphead">
    <span class="tag ${ex.subject === "history" ? "hist" : "geo"}">${ex.subject === "history" ? "التاريخ" : "الجغرافيا"}</span>
    <h1 class="page">${esc(ex.title)}</h1>
    <p class="lead">${esc(ex.instruction)}</p>
  </div>`;

  if (state.done) {
    const perfect = state.clean === ex.targets.length;
    return `${head}
    ${miniMap(ex)}
    <div class="mapresult">
      <b>النتيجة: ${state.clean} من ${ex.targets.length} من المحاولة الأولى</b>
      <p class="muted small">الأخطاء المسجلة: ${state.mistakes}. ${
        perfect ? "توطين دقيق، أحسنت." : "أعد التمرين بعد مراجعة المنهجية."
      }</p>
      <a class="btn" href="#/maps">${icon("target")} اختر خريطة أخرى</a>
    </div>`;
  }

  const target = ex.targets[state.i];
  return `${head}
  <div class="mapbar">
    <span class="mapask">المطلوب: <b id="mapAsked">${esc(target.name)}</b></span>
    <span class="badge" id="mapProgress">${state.i + 1} / ${ex.targets.length}</span>
  </div>
  <div class="mapstage" id="mapStage">${mapSVG(ex, true)}</div>
  <div class="mapfeedback" id="mapFeedback" aria-live="polite">اضغط على المنطقة التي تطابق المطلوب.</div>
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

  const advance = () => {
    state.locked = true;
    window.setTimeout(() => {
      if (state.id !== ex.id || state.done) return;
      if (state.i + 1 >= ex.targets.length) {
        state.i = ex.targets.length;
        finishMapExercise();
        return;
      }
      state.i++;
      state.mistake = false;
      state.locked = false;
      window.dispatchEvent(new Event("hashchange"));
    }, 800);
  };

  stage.querySelectorAll<SVGPathElement>(".mapzone").forEach((zoneEl) => {
    const pick = () => {
      if (state.locked || state.done) return;
      const zoneId = zoneEl.dataset.zone ?? "";
      const target = ex.targets[state.i];
      if (!target) return;
      const zone = GEO[ex.mapId]?.zones.find((z) => z.id === zoneId);

      if (zoneId === target.zone) {
        if (!state.mistake) state.clean++;
        zoneEl.classList.add("right");
        feedback.className = "mapfeedback ok";
        feedback.textContent = `صحيح: ${target.name}. ${target.hint}`;
        advance();
      } else {
        if (!state.mistake) {
          state.mistake = true;
          state.mistakes++;
        }
        zoneEl.classList.add("wrong");
        window.setTimeout(() => zoneEl.classList.remove("wrong"), 700);
        feedback.className = "mapfeedback bad";
        feedback.textContent = `ليس «${zone?.label ?? "هذه المنطقة"}». المطلوب: ${target.name} — ${target.hint}`;
      }
    };
    zoneEl.addEventListener("click", pick);
    zoneEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick();
      }
    });
  });
}

/** يُستدعى بعد آخر إجابة لإظهار شاشة النتيجة عبر إعادة العرض */
export function finishMapExercise(): void {
  state.done = true;
  window.dispatchEvent(new Event("hashchange"));
}
