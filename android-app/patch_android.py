"""Passt das von Capacitor erzeugte Android-Projekt an: Querformat, Vollbild, Mikrofon, Icons, Immersive-Modus."""
import re, os, shutil
from PIL import Image
m = 'android/app/src/main/AndroidManifest.xml'; s = open(m).read()
if 'screenOrientation' not in s: s = s.replace('<activity', '<activity android:screenOrientation="sensorLandscape" android:hardwareAccelerated="true"', 1)
s = s.replace('</manifest>', '    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n    <uses-permission android:name="android.permission.VIBRATE" />\n    <uses-feature android:name="android.hardware.microphone" android:required="false" />\n    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n</manifest>')
open(m, 'w').write(s)
st = 'android/app/src/main/res/values/styles.xml'; t = open(st).read()
t = t.replace('<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">', '<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>')
open(st, 'w').write(t)
src = Image.open('../public/icons/icon-512.png').convert('RGBA'); res = 'android/app/src/main/res'
for d, sz in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    p = f'{res}/mipmap-{d}'; os.makedirs(p, exist_ok=True)
    for n in ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']: src.resize((sz, sz), Image.LANCZOS).save(f'{p}/{n}')
shutil.rmtree(f'{res}/mipmap-anydpi-v26', ignore_errors=True)
ma = [os.path.join(r, f) for r, _, fs in os.walk('android/app/src/main/java') for f in fs if f == 'MainActivity.java'][0]
pkg = re.search(r'package ([\w.]+);', open(ma).read()).group(1)
open(ma, 'w').write(f'''package {pkg};

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        immersive();
    }}
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {{ super.onWindowFocusChanged(hasFocus); if (hasFocus) immersive(); }}
    private void immersive() {{
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }}
}}
''')
print('Android-Projekt angepasst')
