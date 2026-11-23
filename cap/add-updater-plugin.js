// In-app APK updater for the teacher Android app.
// The generated Android project is recreated on every CI build, so this script
// injects the native plugin, FileProvider and install permission after
// `npx cap add android` and before the signed build.
const fs = require('fs');
const path = require('path');

const PKG_DIR = 'com/sijil/taqyim/pro';
const mainDir = path.join(__dirname, 'android', 'app', 'src', 'main');
const srcRoot = path.join(mainDir, 'java', PKG_DIR);
const manifestPath = path.join(mainDir, 'AndroidManifest.xml');
const gradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const xmlDir = path.join(mainDir, 'res', 'xml');

if (!fs.existsSync(manifestPath)) {
  console.error('AndroidManifest.xml not found at', manifestPath);
  process.exit(1);
}
if (!fs.existsSync(gradlePath)) {
  console.error('build.gradle not found at', gradlePath);
  process.exit(1);
}

const PLUGIN_JAVA = `package com.sijil.taqyim.pro;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkUpdater")
public class SijilUpdaterPlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("رابط التحديث غير صالح");
            return;
        }

        final Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ctx.getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent settings = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + ctx.getPackageName())
                );
                settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(settings);
                call.reject("اسمح بتثبيت التطبيقات من هذا التطبيق ثم أعد المحاولة", "INSTALL_PERMISSION");
            } catch (Exception e) {
                call.reject("تعذّر فتح إعدادات التثبيت: " + e.getMessage(), "INSTALL_PERMISSION");
            }
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    File dir = ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) dir = ctx.getCacheDir();
                    if (!dir.exists() && !dir.mkdirs()) throw new IOException("تعذّر إنشاء مجلد التنزيل");

                    File out = new File(dir, "sijil-update.apk");
                    if (out.exists() && !out.delete()) throw new IOException("تعذّر حذف النسخة القديمة");

                    HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(60000);
                    conn.setRequestProperty("User-Agent", "SijilTaqyim-Updater");
                    conn.setRequestProperty("Accept", "application/vnd.android.package-archive");
                    conn.connect();
                    int code = conn.getResponseCode();
                    if (code != HttpURLConnection.HTTP_OK) throw new IOException("HTTP " + code);

                    int total = conn.getContentLength();
                    InputStream in = conn.getInputStream();
                    FileOutputStream fos = new FileOutputStream(out);
                    byte[] buf = new byte[8192];
                    long got = 0;
                    int n, lastPct = -1;
                    while ((n = in.read(buf)) != -1) {
                        fos.write(buf, 0, n);
                        got += n;
                        if (total > 0) {
                            int pct = (int) Math.min(100, got * 100 / total);
                            if (pct != lastPct && (pct % 2 == 0 || pct == 100)) {
                                lastPct = pct;
                                JSObject progress = new JSObject();
                                progress.put("percent", pct);
                                notifyListeners("progress", progress);
                            }
                        }
                    }
                    fos.flush();
                    fos.close();
                    in.close();
                    conn.disconnect();

                    if (out.length() < 100 * 1024) throw new IOException("الملف المنزّل غير صالح");

                    final Uri apkUri = FileProvider.getUriForFile(
                        ctx, ctx.getPackageName() + ".fileprovider", out
                    );
                    final Intent install = new Intent(Intent.ACTION_VIEW);
                    install.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                    Runnable launch = new Runnable() {
                        @Override
                        public void run() {
                            try {
                                ctx.startActivity(install);
                                JSObject ret = new JSObject();
                                ret.put("ok", true);
                                call.resolve(ret);
                            } catch (Exception e) {
                                call.reject("تعذّر فتح مثبّت أندرويد: " + e.getMessage());
                            }
                        }
                    };
                    if (getActivity() != null) getActivity().runOnUiThread(launch);
                    else launch.run();
                } catch (final Exception e) {
                    call.reject("تعذّر تنزيل التحديث: " + e.getMessage());
                }
            }
        }).start();
    }
}
`;

fs.mkdirSync(srcRoot, { recursive: true });
fs.writeFileSync(path.join(srcRoot, 'SijilUpdaterPlugin.java'), PLUGIN_JAVA, 'utf8');
console.log('in-app updater plugin written to ' + srcRoot);

// Register it in MainActivity after the existing native plugins.
const maPath = path.join(srcRoot, 'MainActivity.java');
if (!fs.existsSync(maPath)) {
  console.error('MainActivity.java not found — run this after add-print-plugin.js and add-camera-plugin.js');
  process.exit(1);
}
let java = fs.readFileSync(maPath, 'utf8');
if (java.indexOf('SijilUpdaterPlugin.class') === -1) {
  const anchor = 'registerPlugin(SijilCameraPlugin.class);';
  if (java.indexOf(anchor) !== -1) {
    java = java.replace(anchor, anchor + '\n        registerPlugin(SijilUpdaterPlugin.class);');
  } else {
    java = java.replace(
      /(public class MainActivity extends BridgeActivity \{\s*\r?\n\s*@Override\s*\r?\n\s*protected void onCreate\(Bundle savedInstanceState\) \{)/,
      '$1\n        registerPlugin(SijilUpdaterPlugin.class);'
    );
  }
  if (java.indexOf('SijilUpdaterPlugin.class') === -1) {
    console.error('could not register SijilUpdaterPlugin in MainActivity.java');
    process.exit(1);
  }
  fs.writeFileSync(maPath, java, 'utf8');
  console.log('MainActivity.java now registers SijilUpdaterPlugin');
} else {
  console.log('MainActivity.java already registers SijilUpdaterPlugin');
}

// Allow the app to hand a downloaded APK to the system package installer.
let manifest = fs.readFileSync(manifestPath, 'utf8');
const installPermission = '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />';
if (manifest.indexOf('android.permission.REQUEST_INSTALL_PACKAGES') === -1) {
  manifest = manifest.replace('</manifest>', '\n    ' + installPermission + '\n</manifest>');
  console.log('added REQUEST_INSTALL_PACKAGES permission');
}
const provider = `<provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${'${applicationId}'}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>`;
if (manifest.indexOf('androidx.core.content.FileProvider') === -1) {
  manifest = manifest.replace('</application>', provider + '\n    </application>');
  console.log('added FileProvider declaration');
}
fs.writeFileSync(manifestPath, manifest, 'utf8');

fs.mkdirSync(xmlDir, { recursive: true });
fs.writeFileSync(
  path.join(xmlDir, 'file_paths.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<paths xmlns:android="http://schemas.android.com/apk/res/android">\n' +
    '    <external-files-path name="updates" path="Download/" />\n' +
    '    <cache-path name="cache" path="." />\n' +
    '</paths>\n',
  'utf8'
);
console.log('wrote res/xml/file_paths.xml');

// Android refuses to install an APK whose versionCode is not newer. Use the
// package.json version (1.0.104 -> 10104) on every signed build.
let gradle = fs.readFileSync(gradlePath, 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
const parts = String(version).split('.').map(function (n) { return parseInt(n, 10) || 0; });
const versionCode = parts[0] * 10000 + parts[1] * 100 + parts[2];
if (!/versionCode\s+\d+/.test(gradle)) {
  console.error('could not find versionCode in build.gradle');
  process.exit(1);
}
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode ' + versionCode);
gradle = gradle.replace(/versionName\s+"[^"]*"/, 'versionName "' + version + '"');
fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('set Android versionName=' + version + ' versionCode=' + versionCode);