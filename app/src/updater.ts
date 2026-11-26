/**
 * التحديث الذاتي — يفحص إصدارات GitHub، ينزّل APK، ويفتح مثبّت أندرويد.
 * على المتصفح (PWA) يفتح رابط التنزيل مباشرة.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";

const REPO = "aziz98bouhouch-crypto/sijil-android";
const CACHE_KEY = "marhadi:update-check:v1";
const CACHE_MS = 6 * 60 * 60 * 1000;

interface ApkUpdaterPlugin {
  install(options: { url: string }): Promise<{ installed?: boolean }>;
}

const ApkUpdater = registerPlugin<ApkUpdaterPlugin>("ApkUpdater");

export interface UpdateInfo {
  version: number;
  url: string;
  page: string;
}

interface Release {
  tag_name?: string;
  html_url?: string;
  draft?: boolean;
  assets?: { name?: string; browser_download_url?: string }[];
}

export function currentVersion(): number {
  const n = Number.parseInt(__APP_VERSION__, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseReleases(releases: Release[], current: number): UpdateInfo | null {
  let best: UpdateInfo | null = null;
  for (const r of releases) {
    if (r.draft) continue;
    const m = /^marhadi-v(\d+)$/.exec(r.tag_name ?? "");
    if (!m) continue;
    const apk =
      r.assets?.find((a) => a.name === "marhadi-hg.apk") ??
      r.assets?.find((a) => a.name?.toLowerCase().endsWith(".apk"));
    if (!apk?.browser_download_url) continue;
    const version = Number(m[1]);
    if (!Number.isFinite(version) || version <= current) continue;
    if (!best || version > best.version) {
      best = { version, url: apk.browser_download_url, page: r.html_url ?? "" };
    }
  }
  return best;
}

export async function checkForUpdate(force = false): Promise<UpdateInfo | null> {
  const current = currentVersion();
  try {
    if (!force) {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { at: number; info: UpdateInfo | null };
        if (Date.now() - cached.at < CACHE_MS) {
          return cached.info && cached.info.version > current ? cached.info : null;
        }
      }
    }

    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const info = parseReleases((await res.json()) as Release[], current);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), info }));
    } catch {
      /* ignore */
    }
    return info;
  } catch {
    return null;
  }
}

export async function installUpdate(info: UpdateInfo): Promise<"installer" | "download"> {
  if (Capacitor.isNativePlatform()) {
    await ApkUpdater.install({ url: info.url });
    return "installer";
  }
  window.open(info.url, "_blank", "noopener");
  return "download";
}
