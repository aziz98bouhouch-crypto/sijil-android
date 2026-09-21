const fs = require('fs');
const path = require('path');

// Student app web source = the single-source SPA (portal-html.js), NOT the
// teacher desktop index.html. Bundled as the APK's www/index.html.
const root = path.join(__dirname, '..');
const dstDir = path.join(__dirname, 'www');
fs.mkdirSync(dstDir, { recursive: true });

const html = require(path.join(root, 'portal-html.js'));
fs.writeFileSync(path.join(dstDir, 'index.html'), html);
console.log('wrote www/index.html ->', Buffer.byteLength(html) + ' bytes');

// Shared program logo, referenced by the SPA as "logo.png".
const icon = path.join(root, 'build', 'icon.png');
if (fs.existsSync(icon)) {
  fs.copyFileSync(icon, path.join(dstDir, 'logo.png'));
  console.log('copied build/icon.png -> www/logo.png');
} else {
  console.warn('warning: build/icon.png not found, header logo will hide');
}
