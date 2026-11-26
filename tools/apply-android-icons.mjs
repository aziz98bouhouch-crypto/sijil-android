// ينسخ أيقونات الأندرويد المولّدة إلى مشروع Capacitor بعد `cap add/sync`.
import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "app", "resources", "android");
const res = join(root, "app", "android", "app", "src", "main", "res");

if (!existsSync(res)) {
  console.error("apply-android-icons: missing", res);
  process.exit(1);
}

for (const dir of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
  const from = join(src, `mipmap-${dir}`);
  if (!existsSync(from)) continue;
  const to = join(res, `mipmap-${dir}`);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

const values = join(res, "values");
mkdirSync(values, { recursive: true });
writeFileSync(
  join(values, "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0F766E</color>\n</resources>\n`,
);

const anydpi = join(res, "mipmap-anydpi-v26");
mkdirSync(anydpi, { recursive: true });
for (const name of ["ic_launcher", "ic_launcher_round"]) {
  writeFileSync(
    join(anydpi, `${name}.xml`),
    `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n`,
  );
}
console.log("android icons applied");
