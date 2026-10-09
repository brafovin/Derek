#!/bin/bash
# Baut die Android-App (APK) aus public/. Voraussetzungen: Node 18+, Java 17, Android SDK (ANDROID_HOME), Python 3 + Pillow.
set -e
cd "$(dirname "$0")"
rm -rf www android && mkdir -p www/icons
cp ../public/index.html ../public/manifest.webmanifest ../public/sw.js ../public/privacy.html www/ && cp ../public/icons/icon-*.png www/icons/
npm install --no-audit --no-fund
npx cap add android
python3 patch_android.py
echo "sdk.dir=${ANDROID_HOME}" > android/local.properties
npx cap sync android
(cd android && ./gradlew assembleDebug)
mkdir -p ../public/downloads && cp android/app/build/outputs/apk/debug/app-debug.apk ../public/downloads/LetzteAufnahme.apk
echo "Fertig: public/downloads/LetzteAufnahme.apk"
