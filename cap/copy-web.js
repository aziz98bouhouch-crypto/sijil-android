const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'index.html');
const dstDir = path.join(__dirname, 'www');
const dst = path.join(dstDir, 'index.html');

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('copied web app ->', dst, '(' + fs.statSync(dst).size + ' bytes)');

// Inject the current app version so the phone in-app updater can compare it.
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  let html = fs.readFileSync(dst, 'utf8');
  html = html.split('__APP_VERSION_TOKEN__').join(pkg.version);
  fs.writeFileSync(dst, html);
  console.log('injected app version ->', pkg.version);
} catch (e) {
  console.warn('warning: could not inject app version:', e.message);
}

// Copy referenced static assets (logo, fonts, vendored libs) so relative paths
// like "build/icon.png", "build/fonts/*.woff2" and "vendor/jsqr.js" resolve
// inside the APK webDir.
function copyDir(name) {
  const s = path.join(root, name);
  const d = path.join(dstDir, name);
  if (fs.existsSync(s)) {
    fs.cpSync(s, d, { recursive: true });
    console.log('copied ' + name + ' ->', d);
  } else {
    console.warn('warning: ' + name + '/ not found, some assets may not render in APK');
  }
}
copyDir('build');
copyDir('vendor');
