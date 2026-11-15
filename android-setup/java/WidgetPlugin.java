package com.mbedilsah.gelisimtakip;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Uygulama ↔ ana ekran widget'ı köprüsü. */
@CapacitorPlugin(name = "HomeWidget")
public class WidgetPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(GelisimWidget.PREFS, Context.MODE_PRIVATE);
    }

    /** Uygulamadaki güncel veriyi widget'a gönderir. */
    @PluginMethod
    public void update(PluginCall call) {
        String data = call.getString("data");
        if (data == null) { call.reject("data yok"); return; }
        prefs().edit().putString("data", data).apply();
        GelisimWidget.refreshAll(getContext());
        call.resolve();
    }

    /** Widget'ta yapılan işaretleri döner ve listeyi temizler. */
    @PluginMethod
    public void consume(PluginCall call) {
        SharedPreferences p = prefs();
        String pending = p.getString("pending", "[]");
        p.edit().putString("pending", "[]").apply();
        JSObject r = new JSObject();
        try { r.put("items", new JSArray(pending)); } catch (Exception e) { r.put("items", new JSArray()); }
        call.resolve(r);
    }
}
