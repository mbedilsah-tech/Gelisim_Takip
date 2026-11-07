#!/usr/bin/env bash
# `npx cap add android` sonrası Android projesini özelleştirir (GitHub Actions'ta çalışır).
set -euo pipefail
APP=android/app
MAN=$APP/src/main/AndroidManifest.xml

# 1) İzinler: bildirim, tam zamanlı alarm, yeniden başlatma sonrası bildirimleri geri kurma
PERMS='    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />\n'
sed -i "s#</manifest>#${PERMS}</manifest>#" "$MAN"

# 2) İkonlar (uyarlanabilir ikonu kaldırıp kendi PNG'lerimizi kullan)
rm -rf $APP/src/main/res/mipmap-anydpi-v26
cp -r android-setup/res/* $APP/src/main/res/

# 3) Sürüm numarası: her derlemede artar, telefon güncelleme olarak kurar
N=${GITHUB_RUN_NUMBER:-1}
sed -i -E "s/versionCode [0-9]+/versionCode ${N}/; s/versionName \"[^\"]*\"/versionName \"1.0.${N}\"/" $APP/build.gradle

echo "--- AndroidManifest izinleri:"; grep -n "uses-permission" "$MAN"
echo "--- Sürüm:"; grep -nE "versionCode|versionName" $APP/build.gradle
