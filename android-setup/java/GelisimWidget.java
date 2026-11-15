package com.mbedilsah.gelisimtakip;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * Ana ekran widget'ı: sıradaki vakit + geri sayım, bugünün 5 vakti (dokununca işaretlenir), yıldızlar.
 * Veriyi uygulama (WidgetPlugin) SharedPreferences'a yazar; widget'ta yapılan işaretler
 * "pending" listesine eklenir ve uygulama açılınca kendi kayıtlarına aktarılır.
 */
public class GelisimWidget extends AppWidgetProvider {

    static final String PREFS = "gelisim_widget";
    static final String ACTION_TOGGLE = "com.mbedilsah.gelisimtakip.WIDGET_TOGGLE";
    static final String ACTION_REFRESH = "com.mbedilsah.gelisimtakip.WIDGET_REFRESH";

    static final String[] KEYS = {"imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"};
    static final String[] LABELS = {"İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"};
    static final String[] PRAYER_NAMES = {"Sabah", "Öğle", "İkindi", "Akşam", "Yatsı"};
    static final String[] PRAYER_KEYS = {"imsak", "ogle", "ikindi", "aksam", "yatsi"};
    static final int[] PILL_IDS = {R.id.p0, R.id.p1, R.id.p2, R.id.p3, R.id.p4};
    static final int[] LEVEL_COLORS = {0x00000000, 0xFFC9EFC4, 0xFF2F9A5C, 0xFFA9D3F7, 0xFF2563B8, 0xFF7A3FC4};

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        refreshAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_TOGGLE.equals(action)) {
            toggle(context, intent.getStringExtra("date"), intent.getIntExtra("i", -1));
            refreshAll(context);
        } else if (ACTION_REFRESH.equals(action)) {
            refreshAll(context);
        }
    }

    static String dayKey(Calendar c) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(c.getTime());
    }

    static JSONObject readData(Context ctx) {
        try {
            String s = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("data", null);
            return s == null ? null : new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    static void toggle(Context ctx, String date, int i) {
        if (date == null || i < 0 || i > 4) return;
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            JSONObject data = readData(ctx);
            if (data == null) return;
            JSONObject day = data.getJSONObject("days").optJSONObject(date);
            if (day == null) return;
            JSONArray p = day.getJSONArray("p");
            int val = p.optInt(i, 0) == 1 ? 0 : 1;
            p.put(i, val);
            JSONArray pending = new JSONArray(prefs.getString("pending", "[]"));
            JSONObject item = new JSONObject();
            item.put("date", date);
            item.put("i", i);
            item.put("val", val);
            pending.put(item);
            prefs.edit().putString("data", data.toString()).putString("pending", pending.toString()).apply();
        } catch (Exception ignored) { }
    }

    static long timeAt(Calendar day, String hhmm) {
        Calendar c = (Calendar) day.clone();
        String[] parts = hhmm.split(":");
        c.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
        c.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, GelisimWidget.class));
        if (ids == null || ids.length == 0) return;
        long nextChange = 0;
        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_gelisim);
        try {
            nextChange = build(ctx, views);
        } catch (Exception e) {
            views.setTextViewText(R.id.next_label, "Uygulamayı bir kez aç");
        }
        for (int id : ids) mgr.updateAppWidget(id, views);
        schedule(ctx, nextChange);
    }

    /** Görünümü doldurur; bir sonraki yenileme zamanını (ms) döner. */
    static long build(Context ctx, RemoteViews v) throws Exception {
        // Başlığa dokununca uygulama açılsın
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPi = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.header, openPi);
        v.setOnClickPendingIntent(R.id.summary, openPi);

        Calendar now = Calendar.getInstance();
        Calendar midnight = (Calendar) now.clone();
        midnight.add(Calendar.DAY_OF_MONTH, 1);
        midnight.set(Calendar.HOUR_OF_DAY, 0);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 5);

        JSONObject data = readData(ctx);
        boolean dark = data != null && "dark".equals(data.optString("theme"));
        int ink = dark ? 0xFFE6ECE8 : 0xFF1C2A23;
        int muted = dark ? 0xFF93A19A : 0xFF7A857E;
        v.setInt(R.id.root, "setBackgroundResource", dark ? R.drawable.widget_bg_dark : R.drawable.widget_bg_light);
        v.setTextColor(R.id.next_label, ink);
        v.setTextColor(R.id.countdown, ink);
        v.setTextColor(R.id.summary, muted);

        String todayKey = dayKey(now);
        JSONObject days = data == null ? null : data.optJSONObject("days");
        JSONObject today = days == null ? null : days.optJSONObject(todayKey);
        if (today == null) {
            v.setChronometer(R.id.countdown, SystemClock.elapsedRealtime(), null, false);
            v.setTextViewText(R.id.next_label, "Güncel bilgi için uygulamayı aç");
            v.setTextViewText(R.id.countdown, "");
            v.setTextViewText(R.id.summary, "Gelişim Takip");
            for (int i = 0; i < 5; i++) {
                v.setTextViewText(PILL_IDS[i], PRAYER_NAMES[i]);
                v.setInt(PILL_IDS[i], "setBackgroundResource", dark ? R.drawable.pill_off_dark : R.drawable.pill_off_light);
                v.setTextColor(PILL_IDS[i], ink);
            }
            return midnight.getTimeInMillis();
        }

        JSONObject times = today.getJSONObject("times");
        JSONArray p = today.getJSONArray("p");

        // Sıradaki vakit
        long nowMs = now.getTimeInMillis();
        long nextMs = 0;
        String nextLabel = null, nextTime = null;
        for (int k = 0; k < KEYS.length; k++) {
            String t = times.optString(KEYS[k], null);
            if (t == null) continue;
            long at = timeAt(now, t);
            if (at > nowMs) { nextMs = at; nextLabel = LABELS[k]; nextTime = t; break; }
        }
        if (nextLabel == null) {
            Calendar tom = (Calendar) now.clone();
            tom.add(Calendar.DAY_OF_MONTH, 1);
            JSONObject td = days.optJSONObject(dayKey(tom));
            if (td != null) {
                nextTime = td.getJSONObject("times").optString("imsak", null);
                if (nextTime != null) { nextMs = timeAt(tom, nextTime); nextLabel = "İmsak (yarın)"; }
            }
        }
        if (nextLabel != null) {
            v.setTextViewText(R.id.next_label, nextLabel + " · " + nextTime);
            long base = SystemClock.elapsedRealtime() + (nextMs - System.currentTimeMillis());
            if (Build.VERSION.SDK_INT >= 24) {
                v.setChronometer(R.id.countdown, base, null, true);
                v.setChronometerCountDown(R.id.countdown, true);
            } else {
                long mins = Math.max(0, (nextMs - nowMs) / 60000);
                v.setTextViewText(R.id.countdown, (mins / 60) + " sa " + (mins % 60) + " dk");
            }
        } else {
            v.setChronometer(R.id.countdown, SystemClock.elapsedRealtime(), null, false);
            v.setTextViewText(R.id.next_label, "Vakitler için uygulamayı aç");
            v.setTextViewText(R.id.countdown, "");
        }

        // 5 vakit: dokununca işaretle / kaldır
        int count = 0;
        for (int i = 0; i < 5; i++) {
            boolean done = p.optInt(i, 0) == 1;
            if (done) count++;
            String t = times.optString(PRAYER_KEYS[i], "");
            v.setTextViewText(PILL_IDS[i], (done ? "✓ " : "") + PRAYER_NAMES[i] + "\n" + t);
            v.setInt(PILL_IDS[i], "setBackgroundResource",
                done ? (dark ? R.drawable.pill_on_dark : R.drawable.pill_on_light) : (dark ? R.drawable.pill_off_dark : R.drawable.pill_off_light));
            v.setTextColor(PILL_IDS[i], done ? (dark ? 0xFF0C1A14 : 0xFFFFFFFF) : ink);
            Intent tg = new Intent(ctx, GelisimWidget.class);
            tg.setAction(ACTION_TOGGLE);
            tg.putExtra("date", todayKey);
            tg.putExtra("i", i);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, 100 + i, tg, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(PILL_IDS[i], pi);
        }

        int stars = today.optInt("stars", 0);
        StringBuilder sb = new StringBuilder();
        sb.append(count).append("/5 vakit");
        if (count == 5) sb.append(" 💜");
        if (stars > 0) {
            sb.append("   ");
            if (stars <= 5) for (int s = 0; s < stars; s++) sb.append('★');
            else sb.append("★×").append(stars);
        }
        v.setTextViewText(R.id.summary, sb.toString());
        v.setInt(R.id.level, "setBackgroundColor", LEVEL_COLORS[count]);

        long next = midnight.getTimeInMillis();
        if (nextMs > nowMs && nextMs < next) next = nextMs + 1000;
        return next;
    }

    static void schedule(Context ctx, long at) {
        if (at <= 0) return;
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            Intent i = new Intent(ctx, GelisimWidget.class);
            i.setAction(ACTION_REFRESH);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, 99, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            am.set(AlarmManager.RTC, at, pi);
        } catch (Exception ignored) { }
    }
}
