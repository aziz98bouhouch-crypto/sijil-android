const fs = require('fs');
const path = require('path');

// Patches the Capacitor-generated android/app/build.gradle to add a release
// signingConfig that reads credentials from android/keystore.properties, and
// points the existing buildTypes.release at it. Safe to re-run (idempotent).
const gradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
if (!fs.existsSync(gradlePath)) {
  console.error('build.gradle not found at', gradlePath);
  process.exit(1);
}

let g = fs.readFileSync(gradlePath, 'utf8');

if (g.indexOf('signingConfig signingConfigs.release') !== -1) {
  console.log('signing already configured');
  process.exit(0);
}

const signingConfigsBlock = [
  '',
  "    signingConfigs {",
  "        release {",
  "            def ksPropsFile = rootProject.file('keystore.properties')",
  "            if (ksPropsFile.exists()) {",
  "                def ksProps = new Properties()",
  "                ksProps.load(new FileInputStream(ksPropsFile))",
  "                storeFile rootProject.file(ksProps['storeFile'])",
  "                storePassword ksProps['storePassword']",
  "                keyAlias ksProps['keyAlias']",
  "                keyPassword ksProps['keyPassword']",
  "            }",
  "        }",
  "    }",
  ''
].join('\n');

// Insert signingConfigs right after the top-level `android {` opening.
let inserted = false;
g = g.replace(/(\bandroid\s*\{\s*\n)/, function (m) {
  inserted = true;
  return m + signingConfigsBlock;
});
if (!inserted) {
  console.error('could not find `android {` block to inject signingConfigs');
  process.exit(1);
}

// Point buildTypes.release at the signing config (first `release {` under buildTypes).
const bt = g.indexOf('buildTypes');
if (bt === -1) {
  console.error('could not find buildTypes block');
  process.exit(1);
}
const rel = g.indexOf('release', bt);
const brace = g.indexOf('{', rel);
if (rel === -1 || brace === -1) {
  console.error('could not find buildTypes.release block');
  process.exit(1);
}
g = g.slice(0, brace + 1) + '\n            signingConfig signingConfigs.release' + g.slice(brace + 1);

fs.writeFileSync(gradlePath, g, 'utf8');
console.log('injected release signingConfig into build.gradle');
