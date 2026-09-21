const fs = require('fs');
const path = require('path');

// @capacitor/barcode-scanner depends on com.github.outsystems:osbarcode-android,
// which is published on JitPack. Capacitor's generated android/build.gradle only
// declares google() + mavenCentral(), so Gradle cannot resolve the barcode lib.
// Inject the JitPack maven repository into the allprojects repositories block.
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

const jitpack = "        maven { url 'https://jitpack.io' }\n";
let done = false;
// Insert right after the first mavenCentral() inside a repositories block.
g = g.replace(/([ \t]*mavenCentral\(\)\s*\n)/, function (m) {
  if (done) return m;
  done = true;
  return m + jitpack;
});

if (!done) {
  console.error('could not find mavenCentral() to inject jitpack after');
  process.exit(1);
}

fs.writeFileSync(gradlePath, g, 'utf8');
console.log('injected JitPack maven repository into android/build.gradle');
