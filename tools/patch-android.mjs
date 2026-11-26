/**
 * يُشغَّل بعد `npx cap add android` في CI:
 * - يضبط رقم الإصدار من رقم تشغيل GitHub.
 * - يضيف توقيعاً ثابتاً حتى تُثبَّت التحديثات فوق النسخة الحالية.
 */
import fs from "node:fs";

const file = "android/app/build.gradle";
let gradle = fs.readFileSync(file, "utf8");
const version = process.env.APP_VERSION || "1";

gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${version}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);

if (!gradle.includes("marhadi-release")) {
  gradle = gradle.replace(
    /android\s*\{/,
    `android {
    signingConfigs {
        marhadi-release {
            storeFile file("../../keys/marhadi.keystore")
            storeType "PKCS12"
            storePassword "marhadi-hg-2026"
            keyAlias "marhadi"
            keyPassword "marhadi-hg-2026"
        }
    }`,
  );
}

gradle = gradle.replace(
  /(buildTypes\s*\{[\s\S]*?release\s*\{)/,
  "$1\n            signingConfig signingConfigs.marhadi-release",
);

if (!gradle.includes("signingConfig signingConfigs.marhadi-release")) {
  throw new Error("تعذر إضافة توقيع الإصدار إلى build.gradle");
}

fs.writeFileSync(file, gradle);
console.log(`build.gradle: versionCode=${version}, release signing enabled`);
