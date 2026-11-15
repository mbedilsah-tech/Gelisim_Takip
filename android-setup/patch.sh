#!/usr/bin/env bash
# `npx cap add android` sonrası Android projesini özelleştirir (GitHub Actions'ta çalışır).
set -euo pipefail
APP=android/app
MAN=$APP/src/main/AndroidManifest.xml

# 1) İzinler: bildirim, tam zamanlı alarm, yeniden başlatma sonrası bildirimleri geri kurma
PERMS='    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />\n    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />\n'
sed -i "s#</manifest>#${PERMS}</manifest>#" "$MAN"

# 2) İkonlar (uyarlanabilir ikonu kaldırıp kendi PNG'lerimizi kullan)
rm -rf $APP/src/main/res/mipmap-anydpi-v26
cp -r android-setup/res/* $APP/src/main/res/

# 3) Pil/otomatik başlatma eklentisi (Java) ve onu kaydeden MainActivity
JDIR=$APP/src/main/java/com/mbedilsah/gelisimtakip
mkdir -p "$JDIR"
cp android-setup/java/*.java "$JDIR/"

# 4) Ana ekran widget'ı
RECV='        <receiver android:name=".GelisimWidget" android:exported="false" android:label="Gelişim Takip (4×2)">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/gelisim_widget_info" />\n        </receiver>\n        <receiver android:name=".GelisimWidgetCompact" android:exported="false" android:label="Gelişim Takip · Kompakt (4×1)">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/gelisim_widget_compact_info" />\n        </receiver>\n        <receiver android:name=".GelisimWidgetMini" android:exported="false" android:label="Gelişim Takip · Mini (3×1)">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/gelisim_widget_mini_info" />\n        </receiver>\n'
sed -i "s#</application>#${RECV}    </application>#" "$MAN"
echo "--- Widget:"; grep -n "GelisimWidget" "$MAN"

# 5) Sabit imza: her derleme repodaki aynı anahtarla imzalanır, yeni sürüm eskisinin üzerine kurulur.
#    (Gradle ~/.android/debug.keystore'u her zaman kullanmadığı için açıkça belirtiyoruz.)
SIGN='    signingConfigs {\n        debug {\n            storeFile file("../../android-setup/debug.keystore")\n            storePassword "android"\n            keyAlias "androiddebugkey"\n            keyPassword "android"\n        }\n    }'
sed -i "0,/^android {/s##android {\n${SIGN}#" $APP/build.gradle
echo "--- İmza:"; grep -n -A3 "signingConfigs" $APP/build.gradle

# 6) Sürüm numarası: her derlemede artar, telefon güncelleme olarak kurar
N=${GITHUB_RUN_NUMBER:-1}
sed -i -E "s/versionCode [0-9]+/versionCode ${N}/; s/versionName \"[^\"]*\"/versionName \"1.0.${N}\"/" $APP/build.gradle

echo "--- AndroidManifest izinleri:"; grep -n "uses-permission" "$MAN"
echo "--- Sürüm:"; grep -nE "versionCode|versionName" $APP/build.gradle
