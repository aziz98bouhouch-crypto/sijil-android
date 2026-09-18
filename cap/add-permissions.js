const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.error('AndroidManifest.xml not found at', manifestPath);
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, 'utf8');

const additions = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />'
];

const missing = additions.filter(line => xml.indexOf(line) === -1);
if (missing.length === 0) {
  console.log('permissions already present, nothing to do');
  process.exit(0);
}

const inject = '\n    ' + missing.join('\n    ') + '\n';
if (xml.indexOf('</manifest>') !== -1) {
  xml = xml.replace('</manifest>', inject + '</manifest>');
} else {
  console.error('could not find </manifest> closing tag');
  process.exit(1);
}

fs.writeFileSync(manifestPath, xml, 'utf8');
console.log('injected permissions:', missing.join(', '));
