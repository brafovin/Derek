# LETZTE AUFNAHME im Google Play Store

Das Spiel ist eine **PWA** (installierbare Web-App: `manifest.webmanifest`, `sw.js`, Icons in `public/icons/`). Für den Play Store wird sie als **Trusted Web Activity (TWA)** verpackt – das ist eine dünne Android-App, die die Seite im Vollbild zeigt.

> **Wichtig:** Ich (Claude) kann das Spiel **nicht selbst im Play Store veröffentlichen**. Dafür brauchst du ein eigenes Google-Play-Entwicklerkonto (einmalig 25 US-$, Identitätsprüfung), einen privaten Signaturschlüssel und musst die Einreichung selbst abschicken. Alles andere ist hier vorbereitet.

## Was schon fertig ist
- Spiel unter Vercel erreichbar (HTTPS) – die URL ist die „Start-URL“ der App.
- `manifest.webmanifest`, Service Worker (offline-fähig im Solo-Modus), Icons (192, 512, maskable, Play-Icon 512), **Feature-Graphic 1024×500** (`public/icons/feature-graphic-1024x500.png`).
- Datenschutzerklärung: `/privacy.html` (**Name/Anschrift/E-Mail darin eintragen!** – Pflicht für den Store).
- Touch- und Controller-Steuerung, automatische Grafikstufe für Handys.

## Schritt für Schritt
1. **Entwicklerkonto** anlegen: https://play.google.com/console (25 $, Ausweis-/Adressprüfung; neue private Konten brauchen vor der Veröffentlichung einen **geschlossenen Test mit mindestens 12 Testern über 14 Tage**).
2. **APK/AAB bauen** (am einfachsten mit PWABuilder oder Bubblewrap):
   - PWABuilder: https://www.pwabuilder.com → URL deiner Vercel-Seite eingeben → „Package for stores“ → Android → AAB herunterladen (Signaturschlüssel wird mitgeliefert – **sichern!**).
   - oder lokal: `npm i -g @bubblewrap/cli && bubblewrap init --manifest=https://DEINE-URL/manifest.webmanifest && bubblewrap build`.
3. **Digital Asset Links** (damit die App ohne Adressleiste läuft): die vom Tool erzeugte Datei `assetlinks.json` nach `public/.well-known/assetlinks.json` legen (mit SHA-256-Fingerabdruck des Play-App-Signing-Schlüssels aus der Play Console) und deployen.
4. **Store-Eintrag** in der Play Console: Titel, Kurz-/Langbeschreibung (Vorlage unten), Screenshots (Handy-Querformat, mind. 2), Icon 512×512 (`icon-play-512.png`), Feature-Graphic, Datenschutz-URL (`https://DEINE-URL/privacy.html`).
5. **Inhaltsfragebogen / Altersfreigabe (IARC)** wahrheitsgemäß ausfüllen: Gewalt/Blut, Horror, **Darstellung von Tabak- und Cannabiskonsum**, Online-Interaktion mit anderen (Co-op, Sprachchat). Erwartet: ab 16 oder 18.
6. **Datensicherheit** ausfüllen: keine Daten gesammelt/geteilt (Mikrofon nur für optionalen Sprachchat, wird nicht gespeichert). Zielgruppe: **nicht für Kinder**.
7. Geschlossenen Test starten → nach 14 Tagen mit 12 Testern „Produktion beantragen“ → Prüfung durch Google (meist einige Tage).

## Mögliche Hürden (ehrlich)
- Die Spielinhalte (Blut, Horror, **Joint-Konsum und Halluzinationen**) sind für den Play Store nicht verboten, brauchen aber eine hohe Altersfreigabe. Google lehnt Apps ab, die **illegale Drogen bewerben oder verkaufen**; im Spiel ist der Konsum Teil einer Horrorgeschichte. Wenn die Prüfung das beanstandet, ist die einfachste Lösung, die Joint-Funktion in der Store-Version auszuschalten.
- Sprachchat/Online-Co-op: Nutzergenerierte Inhalte gibt es nicht (keine Texte), aber Mikrofon-Berechtigung muss in der Datensicherheit stehen.
- Die Online-Funktion nutzt den kostenlosen öffentlichen PeerJS-Server; bei vielen Spielern kann das instabil sein.

## Textvorlage
**Kurzbeschreibung (80 Zeichen):** Bodycam-Horror: Lost Place, Rätsel, Verstecken – solo oder im Co-op.

**Langbeschreibung:** Du bist K. Marlow und filmst Lost Places. Heute: die verlassene Grundschule St. Aurelia. Am Tag ist alles ruhig – nachts wachst du in demselben Gebäude auf, und etwas jagt dich. Löse Rätsel, finde Sicherungen und Schlüssel, versteck dich in Spinden und unter Tischen, blende das Wesen mit dem Kamerablitz und komm lebend raus. Mit 1–4 Spielern online, Proximity-Voice, Touch- und Controller-Steuerung. Enthält Horror, Blut und Schockeffekte. Nicht für Kinder.
