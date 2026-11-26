package com.marhadi.hg.updater;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private long downloadId = -1;
    private PluginCall pendingCall;
    private BroadcastReceiver receiver;

    @PluginMethod
    public void install(PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("رابط التحديث غير صالح", "bad_url");
            return;
        }

        final Context ctx = getContext();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ctx.getPackageManager().canRequestPackageInstalls()) {
            // نفتح إعدادات «تثبيت تطبيقات غير معروفة» ثم يطلب من المستخدم إعادة المحاولة.
            try {
                Intent settings = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + ctx.getPackageName())
                );
                settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(settings);
            } catch (Exception ignored) {
                /* بعض الأجهزة لا توفّر هذه الشاشة */
            }
            call.reject("اسمح لمرشدي بتثبيت التطبيقات ثم أعد المحاولة", "install_permission");
            return;
        }

        if (pendingCall != null) {
            call.reject("هناك تنزيل جارٍ بالفعل", "busy");
            return;
        }

        try {
            DownloadManager dm = (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) {
                call.reject("خدمة التنزيل غير متاحة", "no_downloader");
                return;
            }

            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            req.setTitle("مرشدي HG — تحديث");
            req.setDescription("جارٍ تنزيل النسخة الجديدة");
            req.setMimeType("application/vnd.android.package-archive");
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "marhadi-hg-update.apk");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                req.setAllowedOverMetered(true);
            }

            final DownloadManager manager = dm;
            downloadId = manager.enqueue(req);
            pendingCall = call;

            receiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id != downloadId) return;

                    PluginCall saved = pendingCall;
                    pendingCall = null;
                    unregisterReceiver();

                    if (saved == null) return;

                    if (!isSuccessful(manager, id)) {
                        saved.reject("فشل تنزيل التحديث. تحقق من الاتصال وحاول مجدداً", "download_failed");
                        return;
                    }

                    Uri apk = manager.getUriForDownloadedFile(id);
                    if (apk == null) {
                        saved.reject("تعذر الوصول إلى ملف التحديث", "missing_file");
                        return;
                    }

                    try {
                        Intent open = new Intent(Intent.ACTION_VIEW);
                        open.setDataAndType(apk, "application/vnd.android.package-archive");
                        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        ctx.startActivity(open);
                        JSObject result = new JSObject();
                        result.put("installed", false);
                        saved.resolve(result);
                    } catch (Exception e) {
                        saved.reject("تعذر فتح المثبّت: " + e.getLocalizedMessage(), "open_failed");
                    }
                }
            };

            IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ctx.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                ctx.registerReceiver(receiver, filter);
            }
        } catch (Exception e) {
            pendingCall = null;
            unregisterReceiver();
            call.reject("تعذر بدء التنزيل: " + e.getLocalizedMessage(), "download_failed");
        }
    }

    private boolean isSuccessful(DownloadManager manager, long id) {
        Cursor cursor = null;
        try {
            cursor = manager.query(new DownloadManager.Query().setFilterById(id));
            if (cursor != null && cursor.moveToFirst()) {
                int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                return status == DownloadManager.STATUS_SUCCESSFUL;
            }
        } catch (Exception ignored) {
            /* ignore */
        } finally {
            if (cursor != null) cursor.close();
        }
        return false;
    }

    private void unregisterReceiver() {
        if (receiver == null) return;
        try {
            getContext().unregisterReceiver(receiver);
        } catch (IllegalArgumentException ignored) {
            /* already unregistered */
        }
        receiver = null;
    }

    @Override
    protected void handleOnDestroy() {
        if (pendingCall != null) {
            pendingCall.reject("أُغلق التطبيق قبل اكتمال التنزيل", "cancelled");
            pendingCall = null;
        }
        unregisterReceiver();
        super.handleOnDestroy();
    }
}
