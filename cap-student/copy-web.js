const fs = require('fs');
const path = require('path');

// Student app web source = the single-source SPA (portal-html.js), NOT the
// teacher desktop index.html. Bundled as the APK's www/index.html.
const root = path.join(__dirname, '..');
const dstDir = path.join(__dirname, 'www');
fs.mkdirSync(dstDir, { recursive: true });

const MIRROR_BASE = 'https://aziz98bouhouch-crypto.github.io/mawakibati-portal';
const marker = 'var MIRROR_BASE="";';

let html = require(path.join(root, 'portal-html.js'));
if (html.indexOf(marker) < 0) throw new Error('portal-html.js lost the MIRROR_BASE placeholder');
html = html.replace(marker, 'var MIRROR_BASE=' + JSON.stringify(MIRROR_BASE) + ';');
fs.writeFileSync(path.join(dstDir, 'index.html'), html);
console.log('wrote www/index.html ->', Buffer.byteLength(html) + ' bytes (mirror: ' + MIRROR_BASE + ')');

// Shared program logo, referenced by the SPA as "logo.png".
const icon = path.join(root, 'build', 'icon.png');
if (fs.existsSync(icon)) {
  fs.copyFileSync(icon, path.join(dstDir, 'logo.png'));
  console.log('copied build/icon.png -> www/logo.png');
} else {
  console.warn('warning: build/icon.png not found, header logo will hide');
}
