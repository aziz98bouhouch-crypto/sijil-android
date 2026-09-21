// Injects a native Android print plugin so every printout uses the Chromium
// print engine (perfect RTL Arabic + real A4 pagination) instead of html2canvas.
// Must run AFTER `npx cap add android` because that step regenerates /android.
const fs = require('fs');
const path = require('path');

const PKG_DIR = 'com/sijil/taqyim/pro';
const srcRoot = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', PKG_DIR);

const PLUGIN_JAVA = `package com.sijil.taqyim.pro;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SijilPrint")
public class SijilPrintPlugin extends Plugin {

    @PluginMethod
    public void printHtml(final PluginCall call) {
        final String html = call.getString("html");
        final String name = call.getString("name", "طباعة");
        if (html == null || html.trim().isEmpty()) {
            call.reject("لا يوجد محتوى للطباعة");
            return;
        }
        final Handler main = new Handler(Looper.getMainLooper());
        main.post(new Runnable() {
            @Override
            public void run() {
                try {
                    final Context ctx = getContext();
                    final WebView wv = new WebView(ctx);
                    wv.getSettings().setJavaScriptEnabled(false);
                    wv.getSettings().setUseWideViewPort(true);
                    wv.getSettings().setLoadWithOverviewMode(true);
                    wv.getSettings().setSupportZoom(false);
                    float density = ctx.getResources().getDisplayMetrics().density;
                    int w = Math.max(1, (int) (794 * density));
                    wv.measure(
                        View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
                    wv.layout(0, 0, w, Math.max(1, wv.getMeasuredHeight()));
                    wv.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            main.postDelayed(new Runnable() {
                                @Override
                                public void run() {
                                    try {
                                        doPrint(view, name);
                                        JSObject ret = new JSObject();
                                        ret.put("ok", true);
                                        call.resolve(ret);
                                    } catch (Exception e) {
                                        call.reject("تعذّر الطباعة: " + e.getMessage());
                                    }
                                }
                            }, 550);
                        }
                    });
                    wv.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    call.reject("خطأ في تجهيز الطباعة: " + e.getMessage());
                }
            }
        });
    }

    private void doPrint(WebView wv, String name) {
        Context ctx = getContext();
        PrintManager pm = (PrintManager) ctx.getSystemService(Context.PRINT_SERVICE);
        PrintDocumentAdapter adapter = wv.createPrintDocumentAdapter(name);
        PrintAttributes.Builder attrs = new PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setResolution(new PrintAttributes.Resolution("pdf", "pdf", 600, 600))
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS);
        pm.print(name, adapter, attrs.build());
    }
}
`;

const MAIN_ACTIVITY_JAVA = `package com.sijil.taqyim.pro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SijilPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;

fs.mkdirSync(srcRoot, { recursive: true });
fs.writeFileSync(path.join(srcRoot, 'SijilPrintPlugin.java'), PLUGIN_JAVA, 'utf8');
fs.writeFileSync(path.join(srcRoot, 'MainActivity.java'), MAIN_ACTIVITY_JAVA, 'utf8');
console.log('print plugin written to ' + srcRoot);
