// Adds a native camera-permission plugin so the QR scanner can ASK for (and
// verify) the Android CAMERA permission before getUserMedia() is attempted.
// Must run AFTER `npx cap add android` and AFTER add-print-plugin.js, because
// that step generates/overwrites MainActivity.java.
const fs = require('fs');
const path = require('path');

const PKG_DIR = 'com/sijil/taqyim/pro';
const srcRoot = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', PKG_DIR);

const PLUGIN_JAVA = `package com.sijil.taqyim.pro;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.util.PermissionHelper;

@CapacitorPlugin(
    name = "SijilCamera",
    permissions = { @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }) }
)
public class SijilCameraPlugin extends Plugin {

    private boolean granted() {
        return PermissionHelper.hasPermissions(getContext(), new String[] { Manifest.permission.CAMERA });
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", granted());
        ret.put("declared", isPermissionDeclared("camera"));
        call.resolve(ret);
    }

    // Resolves {granted:true, already:bool}; rejects when the user denies.
    @PluginMethod
    public void ensure(PluginCall call) {
        if (granted()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("already", true);
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("camera", call, "cameraGranted");
    }

    @PermissionCallback
    private void cameraGranted(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", true);
        ret.put("already", false);
        call.resolve(ret);
    }

    // Opens this app's permission screen in system Settings (recovery path after a denial).
    @PluginMethod
    public void openSettings(final PluginCall call) {
        final Context ctx = getContext();
        try {
            final Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", ctx.getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (getActivity() != null) {
                getActivity()
                    .runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            ctx.startActivity(intent);
                        }
                    });
            } else {
                ctx.startActivity(intent);
            }
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("تعذّر فتح إعدادات التطبيق: " + e.getMessage());
        }
    }
}
`;

fs.mkdirSync(srcRoot, { recursive: true });
fs.writeFileSync(path.join(srcRoot, 'SijilCameraPlugin.java'), PLUGIN_JAVA, 'utf8');
console.log('camera plugin written to ' + srcRoot);

// Register it in MainActivity (keep the print plugin registration intact).
const maPath = path.join(srcRoot, 'MainActivity.java');
if (fs.existsSync(maPath)) {
  let java = fs.readFileSync(maPath, 'utf8');
  if (java.indexOf('SijilCameraPlugin.class') === -1) {
    const anchor = 'registerPlugin(SijilPrintPlugin.class);';
    if (java.indexOf(anchor) !== -1) {
      java = java.replace(anchor, anchor + '\n        registerPlugin(SijilCameraPlugin.class);');
    } else {
      java = java.replace(
        /(public class MainActivity extends BridgeActivity \{\s*\r?\n\s*@Override\s*\r?\n\s*protected void onCreate\(Bundle savedInstanceState\) \{)/,
        '$1\n        registerPlugin(SijilCameraPlugin.class);'
      );
    }
    if (java.indexOf('SijilCameraPlugin.class') === -1) {
      console.error('could not register SijilCameraPlugin in MainActivity.java');
      process.exit(1);
    }
    fs.writeFileSync(maPath, java, 'utf8');
    console.log('MainActivity.java now registers SijilCameraPlugin');
  } else {
    console.log('MainActivity.java already registers SijilCameraPlugin');
  }
} else {
  console.log('MainActivity.java not found yet — skipping registration (run after add-print-plugin.js)');
}
