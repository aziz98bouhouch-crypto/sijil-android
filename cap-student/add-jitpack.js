const fs = require('fs');
const path = require('path');

// @capacitor/barcode-scanner depends on com.github.outsystems:osbarcode-android,
// which is published on JitPack. Capacitor's generated android/build.gradle only
// declares google() + mavenCentral(), so Gradle cannot resolve the barcode lib.
// App/module dependencies resolve from the `allprojects { repositories { ... } }`
// block (NOT the buildscript block), so inject JitPack there.
const gradlePath = path.join(__dirname, 'android', 'build.gradle');
if (!fs.existsSync(gradlePath)) {
  console.error('android/build.gradle not found at', gradlePath);
  process.exit(1);
}

let g = fs.readFileSync(gradlePath, 'utf8');

if (g.indexOf('jitpack.io') !== -1) {
  console.log('jitpack repository already present');
  process.exit(0);
}

const apIdx = g.indexOf('allprojects');
if (apIdx === -1) {
  console.error('could not find allprojects block in build.gradle');
  process.exit(1);
}

const head = g.slice(0, apIdx);
let tail = g.slice(apIdx);
const jitpack = "        maven { url 'https://jitpack.io' }\n";

// Insert after the first mavenCentral() within the allprojects section.
if (tail.indexOf('mavenCentral()') !== -1) {
  tail = tail.replace(/([ \t]*mavenCentral\(\)[ \t]*\r?\n)/, function (m) {
    return m + jitpack;
  });
} else if (tail.indexOf('repositories') !== -1) {
  // Fallback: add a repositories entry right after `repositories {`.
  tail = tail.replace(/(repositories[ \t]*\{[ \t]*\r?\n)/, function (m) {
    return m + jitpack;
  });
} else {
  console.error('could not find a repositories block under allprojects');
  process.exit(1);
}

g = head + tail;
fs.writeFileSync(gradlePath, g, 'utf8');
console.log('injected JitPack maven repository into allprojects repositories');
