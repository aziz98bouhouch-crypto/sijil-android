const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'index.html');
const dstDir = path.join(__dirname, 'www');
const dst = path.join(dstDir, 'index.html');
fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('copied web app ->', dst, '(' + fs.statSync(dst).size + ' bytes)');
