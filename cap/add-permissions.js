const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.error('AndroidManifest.xml not found at', manifestPath);
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, 'utf8');

// 1) Runtime permissions (camera + storage) so getUserMedia / file access work.
const additions = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
];
const missing = additions.filter(line => xml.indexOf(line) === -1);
if (missing.length) {
  if (xml.indexOf('</manifest>') === -1) {
    console.error('could not find </manifest> closing tag');
    process.exit(1);
  }
  xml = xml.replace('</manifest>', '\n    ' + missing.join('\n    ') + '\n</manifest>');
  console.log('injected permissions:', missing.join(', '));
} else {
  console.log('permissions already present');
}

// 2) Allow cleartext (plain http) so the phone app can reach the desktop sync server over the LAN.
if (xml.indexOf('android:usesCleartextTraffic') === -1) {
  if (xml.indexOf('<application') === -1) {
    console.error('could not find <application tag');
    process.exit(1);
  }
  xml = xml.replace(/<application(\s)/, '<application$1android:usesCleartextTraffic="true"$1        ');
  console.log('enabled usesCleartextTraffic on <application>');
} else {
  console.log('usesCleartextTraffic already present');
}

fs.writeFileSync(manifestPath, xml, 'utf8');
