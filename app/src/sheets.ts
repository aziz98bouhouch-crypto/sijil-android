import QRCode from "qrcode";
import type { Lesson, Q } from "./types";

/** FNV-1a 32-bit — مجموع تحقّق لا توقيع: يكشف تعديلاً عابراً في الكود، ولا يمنع تزويراً متعمّداً */
export function checksum(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export interface SheetSpec {
  lessonId: string;
  modeId: string;
  count: number;
  payload: string;
}

export function buildSpec(lessonId: string, modeId: string, count: number): SheetSpec {
  const body = `v1|l=${lessonId}|m=${modeId}|n=${count}`;
  return { lessonId, modeId, count, payload: `${body}|c=${checksum(body)}` };
}

export function parseSpec(payload: string): SheetSpec | null {
  const m = payload.match(/^v1\|l=([^|]+)\|m=([^|]+)\|n=(\d+)\|c=([0-9a-f]{8})$/);
  if (!m) return null;
  const body = `v1|l=${m[1]}|m=${m[2]}|n=${m[3]}`;
  if (checksum(body) !== m[4]) return null;
  return { lessonId: m[1], modeId: m[2], count: Number(m[3]), payload };
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#0d2b2b", light: "#ffffff" },
  });
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** ورقة المتعلم: تُطبع وتُنجز بالقلم، والتصحيح بالمسح */
export function studentSheetHTML(lesson: Lesson, modeName: string, qrUrl: string, qs: Q[]): string {
  const zones = qs
    .map(
      (q, i) => `
      <div class="zone">
        <div class="qnum">${i + 1}</div>
        <div class="qtext">${esc(q.prompt)}</div>
        <div class="opts">${q.options
          .map((o, k) => `<span class="opt"><b>${String.fromCharCode(65 + k)}</b>) ${esc(o)}</span>`)
          .join("")}</div>
        <div class="answer-line">الجواب: <span class="blank"></span></div>
      </div>`,
    )
    .join("");

  return `
  <div class="sheet">
    <header class="sheet-head">
      <div class="brand">
        <div class="logo">مرشدي HG</div>
        <div class="sub">ورقة تحرير مرمزة — تُنجز بالقلم وتُصحّح بالمسح</div>
      </div>
      <img class="qr" src="${qrUrl}" alt="رمز الورقة" />
    </header>

    <table class="ident">
      <tr>
        <td>المادة: <b>${lesson.subject === "history" ? "التاريخ" : "الجغرافيا"}</b></td>
        <td>الدرس: <b>${esc(lesson.title)}</b></td>
      </tr>
      <tr>
        <td>الاسم: .................................</td>
        <td>القسم: .................</td>
        <td>التاريخ: ......../......../........</td>
      </tr>
      <tr>
        <td>الطور: <b>${esc(modeName)}</b></td>
        <td>عدد الأسئلة: <b>${qs.length}</b></td>
        <td>التنقيط: ....... / ${qs.length}</td>
      </tr>
    </table>

    <div class="problem"><b>الوضعية:</b> ${esc(lesson.problemStatement)}</div>

    <section class="zones">${zones}</section>

    <footer class="sheet-foot">
      <div>أنجز الورقة بالقلم، ثم امسح الرمز في التطبيق للتصحيح الآلي والتغذية الراجعة.</div>
      <div class="tiny">${esc(lesson.sourceRef?.credit ?? "")}</div>
    </footer>
  </div>`;
}

/** ورقة الأستاذ: مفتاح التصحيح */
export function keySheetHTML(lesson: Lesson, modeName: string, qs: Q[]): string {
  const rows = qs
    .map(
      (q, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${esc(q.prompt)}</td>
        <td class="c"><b>${String.fromCharCode(65 + q.answer)}</b></td>
        <td>${esc(q.explain)}</td>
      </tr>`,
    )
    .join("");
  return `
  <div class="sheet key">
    <header class="sheet-head">
      <div class="brand">
        <div class="logo">مرشدي HG — مفتاح التصحيح</div>
        <div class="sub">${esc(lesson.title)} · ${esc(modeName)}</div>
      </div>
    </header>
    <table class="key-table">
      <thead><tr><th>#</th><th>السؤال</th><th>الجواب</th><th>التفسير</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <footer class="sheet-foot tiny">${esc(lesson.sourceRef?.credit ?? "")}</footer>
  </div>`;
}

export function printDocument(bodyHtml: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>مرشدي HG — ورقة</title>
    <style>${PRINT_CSS}</style></head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}

export const PRINT_CSS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", "Tahoma", "Arial", sans-serif; direction: rtl; color: #10201f; }
  .sheet { page-break-after: always; }
  .sheet-head { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 8px; }
  .logo { font-size: 19px; font-weight: 800; color: #0f766e; }
  .sub { font-size: 11px; color: #4b6b68; margin-top: 2px; }
  .qr { width: 84px; height: 84px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .ident td { padding: 4px 2px; }
  .problem { background: #f0fdfa; border-right: 3px solid #0f766e; padding: 7px 9px;
    font-size: 12.5px; margin: 8px 0 10px; }
  .zones { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .zone { border: 1px solid #cbe3e0; border-radius: 6px; padding: 7px 8px; font-size: 11.5px; }
  .qnum { display: inline-block; background: #0f766e; color: #fff; border-radius: 50%;
    width: 17px; height: 17px; text-align: center; line-height: 17px; font-size: 10px; }
  .qtext { display: inline; margin-right: 4px; }
  .opts { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; color: #24413f; }
  .opt b { color: #0f766e; }
  .answer-line { margin-top: 5px; color: #4b6b68; font-size: 10.5px; }
  .blank { display: inline-block; width: 70px; border-bottom: 1px dotted #9bbfbb; }
  .sheet-foot { margin-top: 10px; border-top: 1px solid #d7e9e7; padding-top: 6px;
    font-size: 10.5px; color: #4b6b68; display: flex; justify-content: space-between; gap: 10px; }
  .tiny { font-size: 9.5px; color: #6b8b88; }
  .key-table th, .key-table td { border: 1px solid #cbe3e0; padding: 5px 6px; font-size: 11px; vertical-align: top; }
  .key-table th { background: #f0fdfa; color: #0f766e; }
  .c { text-align: center; white-space: nowrap; }
  @media print { .sheet:last-child { page-break-after: auto; } }
`;
