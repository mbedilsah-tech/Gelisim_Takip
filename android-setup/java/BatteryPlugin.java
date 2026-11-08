package com.mbedilsah.gelisimtakip;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pil optimizasyonu ve üreticiye özel "otomatik başlatma" ayarları.
 * Bu izinler olmadan bazı telefonlar (Xiaomi, Samsung, Huawei, Oppo, Vivo…)
 * uygulama kapalıyken kurulan bildirim alarmlarını siler.
 */
@CapacitorPlugin(name = "Battery")
public class BatteryPlugin extends Plugin {

    private String pkg() { return getContext().getPackageName(); }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        boolean ignoring = true;
        if (Build.VERSION.SDK_INT >= 23) {
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            ignoring = pm != null && pm.isIgnoringBatteryOptimizations(pkg());
        }
        r.put("ignoring", ignoring);
        r.put("manufacturer", Build.MANUFACTURER == null ? "" : Build.MANUFACTURER);
        r.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(r);
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 23) {
            try {
                Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                i.setData(Uri.parse("package:" + pkg()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
                return;
            } catch (Exception ignored) { }
            try {
                Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
                return;
            } catch (Exception ignored) { }
        }
        openDetails();
        call.resolve();
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        openDetails();
        call.resolve();
    }

    @PluginMethod
    public void openAutostart(PluginCall call) {
        String[][] targets = {
            {"com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"},
            {"com.hihonor.systemmanager", "com.hihonor.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
            {"com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"},
            {"com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"},
            {"com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"},
            {"com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"},
            {"com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"},
            {"com.samsung.android.lool", "com.samsung.android.sm.battery.ui.BatteryActivity"},
            {"com.samsung.android.sm", "com.samsung.android.sm.battery.ui.BatteryActivity"},
            {"com.asus.mobilemanager", "com.asus.mobilemanager.autostart.AutoStartActivity"},
        };
        String man = Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase();
        for (String[] t : targets) {
            if (!matches(man, t[0])) continue;
            try {
                Intent i = new Intent();
                i.setComponent(new ComponentName(t[0], t[1]));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                JSObject r = new JSObject();
                r.put("opened", "autostart");
                call.resolve(r);
                return;
            } catch (Exception ignored) { }
        }
        openDetails();
        JSObject r = new JSObject();
        r.put("opened", "details");
        call.resolve(r);
    }

    private boolean matches(String man, String pkg) {
        if (pkg.contains("miui")) return man.contains("xiaomi") || man.contains("redmi") || man.contains("poco");
        if (pkg.contains("huawei")) return man.contains("huawei");
        if (pkg.contains("hihonor")) return man.contains("honor");
        if (pkg.contains("coloros") || pkg.contains("oppo")) return man.contains("oppo") || man.contains("realme") || man.contains("oneplus");
        if (pkg.contains("vivo") || pkg.contains("iqoo")) return man.contains("vivo") || man.contains("iqoo");
        if (pkg.contains("samsung")) return man.contains("samsung");
        if (pkg.contains("asus")) return man.contains("asus");
        return false;
    }

    private void openDetails() {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception ignored) { }
    }
}
