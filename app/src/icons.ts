/** أيقونات SVG مدمجة — خطوط 24×24، ترث لون النص، لا صور خارجية */

const BODY: Record<string, string> = {
  // أطوار اللعب
  target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>`,
  swords: `<path d="M3 3l6.5 6.5"/><path d="M21 3l-6.5 6.5"/><path d="M6.2 12.8L3 16l5 5 3.2-3.2"/><path d="M17.8 12.8L21 16l-5 5-3.2-3.2"/><path d="M9.5 14.5l5-5"/>`,
  alert: `<path d="M12 3.6L2.8 19.4a1.4 1.4 0 001.2 2h16a1.4 1.4 0 001.2-2L12 3.6z"/><path d="M12 9.5v4.6"/><circle cx="12" cy="17.6" r="1" fill="currentColor" stroke="none"/>`,
  layers: `<path d="M12 3l8.5 4.4L12 11.8 3.5 7.4 12 3z"/><path d="M3.5 12.2L12 16.6l8.5-4.4"/><path d="M3.5 16.8L12 21.2l8.5-4.4"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.4V12l3.2 2"/>`,
  pencil: `<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/><path d="M13.8 6.2l3 3"/>`,
  user: `<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20.4c0-3.7 3.3-6.2 7.4-6.2s7.4 2.5 7.4 6.2"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0"/><path d="M12 18v3.2M8.8 21.2h6.4"/>`,
  send: `<path d="M20.5 3.5L3.8 10.4l6.2 2.6 2.6 6.2 7.9-15.7z"/><path d="M20.5 3.5l-10.5 9.5"/>`,
  volume: `<path d="M4 9.2h3.7L13 5v14l-5.3-4.2H4z"/><path d="M16.2 8.4a5 5 0 010 7.2"/><path d="M19 5.8a9 9 0 010 12.4"/>`,
  volumeOff: `<path d="M4 9.2h3.7L13 5v14l-5.3-4.2H4z"/><path d="M16.4 9.4l4.8 5.2M21.2 9.4l-4.8 5.2"/>`,
  bolt: `<path d="M13.5 2.5L4.8 13.6h5.6L10 21.5l8.8-11.1h-5.7l.4-7.9z"/>`,
  // تنقّل
  book: `<path d="M4 4.8A2.8 2.8 0 016.8 2H20v17.5H6.8A2.8 2.8 0 004 22V4.8z"/><path d="M6.8 2v17.5"/>`,
  library: `<rect x="3" y="4" width="5" height="16" rx="1.4"/><rect x="10" y="4" width="5" height="16" rx="1.4"/><path d="M17.4 5.2l4 14.8"/>`,
  compass: `<circle cx="12" cy="12" r="8.8"/><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2 5.2-2z"/>`,
  chart: `<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>`,
  // أدوات
  search: `<circle cx="11" cy="11" r="6.6"/><path d="M16 16l4.6 4.6"/>`,
  print: `<path d="M7 9V3h10v6"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.8"/><path d="M7 14.5h10V21H7z"/>`,
  qr: `<rect x="3" y="3" width="6.5" height="6.5" rx="1.2"/><rect x="14.5" y="3" width="6.5" height="6.5" rx="1.2"/><rect x="3" y="14.5" width="6.5" height="6.5" rx="1.2"/><path d="M14.5 14.5h3v3h-3z"/><path d="M20.5 14.5v3.2M14.5 20.5h2.4M20.5 20.5h.01"/>`,
  check: `<path d="M4.5 12.5l4.6 4.6L19.5 6.8"/>`,
  close: `<path d="M6 6l12 12"/><path d="M18 6L6 18"/>`,
  refresh: `<path d="M20 11.5A8 8 0 006.4 6.4L4 8.8"/><path d="M4 4.4v4.4h4.4"/><path d="M4 12.5A8 8 0 0017.6 17.6L20 15.2"/><path d="M20 19.6v-4.4h-4.4"/>`,
  arrow: `<path d="M14 6l-6 6 6 6"/>`,
  spark: `<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>`,
  bookOpen: `<path d="M12 6.4C10.3 4.9 8.2 4.2 4.5 4.2v13.6c3.7 0 5.8.7 7.5 2.2 1.7-1.5 3.8-2.2 7.5-2.2V4.2c-3.7 0-5.8.7-7.5 2.2z"/><path d="M12 6.4v13.6"/>`,
  doc: `<path d="M6 3h8l6 6v12H6z"/><path d="M14 3v6h6"/><path d="M9 13h8M9 17h5"/>`,
  route: `<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6H14a3 3 0 010 6h-4a3 3 0 000 6h5.6"/>`,
  dot: `<circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>`,
};

export function icon(name: string, cls = ""): string {
  const body = BODY[name] ?? BODY.dot;
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
