# Derek

**LETZTE AUFNAHME** – Bodycam-Horrorspiel (eine einzige Datei: `public/index.html`, Three.js und PeerJS eingebettet).

Beim Start läuft ein Lade-Albtraum, bei dem **Blut aus den Buchstaben und von oben über den Bildschirm läuft**, sich unten sammelt und bei 100 % in großen Spritzern explodiert, und ein 17-Sekunden-Trailer (Klick zum Überspringen). Mit `?skip` an der URL wird beides übersprungen.

## Grafik & Design (Update)

- **Blut-Ladebildschirm:** Tropfen wachsen an den Buchstaben des Titels, laufen ruckelnd herunter (mit Glanzlichtern), fallen in die Blutpfütze am unteren Rand und erzeugen Wellen. Dazu Sucherrahmen, pulsierender Herzschlag-Rand, VHS-Störstreifen, Kratzer, Beweisstück-Daten und Bildfehler bei 38 %/77 %. Dasselbe Blut läuft über Menü, Lobby, Pause, Tod- und Ende-Bildschirm (Tod: richtig viel) und über den Titel am Trailer-Ende.
- **Neues Menü-Design:** kantige Blut-Schrift mit rauen Rändern, Tasten-Chips für die Steuerung, rote Schaltflächen, Grafikstufe wählbar (**NIEDRIG / MITTEL / HOCH / ULTRA**, wird gespeichert; unter 24 FPS schaltet das Spiel automatisch eine Stufe runter).
- **Bild-Pipeline:** HDR-Rendering, mehrstufiges Bloom (Lampen und Fenster strahlen), Umgebungsverdunkelung aus dem Tiefenpuffer (Ecken, unter Möbeln), Schärfen, Linsenschmutz, Filmkratzer und Staub, Farbkorrektur (kühle Schatten, warme Lichter) und ein **Angst-Effekt**: Je näher das Wesen kommt, desto stärker pulsiert ein roter Rand mit Adern im Herzschlag-Takt.
- **Neue Texturen:** Wände mit abblätternder Farbe, Schimmel, Wasserrändern und Rissen (Klassentrakt: grüner Ölsockel; Fachräume: Fliesen mit Schmutzfugen, fehlende Fliesen; Halle: Holzpaneele), Böden mit Linoleumfliesen, Terrazzo bzw. Marmor-Schachbrett samt Rissen, eingetrocknetem Blut und **nassen, glänzenden Stellen**, Rasterdecken mit Wasserflecken. Das Haus (Kapitel 2) hat Eichendielen und Raufaser-Putz. Eigene Höhenkarten geben Putz, Fugen und Risse Tiefe im Licht der Taschenlampe.
- **Licht-Effekte:** Halos um Deckenlampen, Staubflocken, die nur im Lichtkegel der Taschenlampe aufglimmen, bodennaher Nebel in zwei Schichten.
- **Abgefahrene Einrichtung:** Blut-Handabdrücke entlang der Wände (immer verschmierter), lange **Schleifspuren** mit Blutlache, **Fußspuren** barfuß, Kratzspuren von Krallen, **Schriften in Blut mit Laufspuren** („ER SIEHT DICH“, „HINTER DIR“ …), Spinnweben in den Ecken, verstreute Papiere, heruntergefallene Deckenplatten, **abgedeckte Leichen** unter Tüchern (je tiefer, desto mehr) und tropfende Decken mit Pfützen, Wellen und Tropfgeräusch.
- **Wesen:** leuchtende Augen, Adern, die bei der Jagd aufglühen, und Geifer, der aus dem Maul tropft.
- **Hand & Gegenstände:** Taschenlampe mit Rippen und Kopf, realistischere Hand (Handballen, Knöchel, drei Fingerglieder mit Gelenken, Fingernägel, Adern am Handrücken), Ärmel in der Farbe deines Oberteils; wird im Dunkeln dunkel.
- **HUD:** Sucherecken, Karten-Optik für Aufgaben und Untertitel, Hotbar mit roter Auswahl.


## Prolog – Lost Place

Es beginnt friedlich: Du bist K. Marlow, filmst Lost Places und gehst bei Tageslicht in die verlassene **Grundschule St. Aurelia**. Sonne, Vogelgezwitscher, Wind. An der Wand hängt ein **Aushang mit der Steuerung** (E zum Lesen). Dann, aus dem Nichts, kommt etwas um die Ecke … der Schreck lässt dich zusammenbrechen. **Koma.** Irgendwo läutet eine Schulglocke – und du wachst in der Schule auf. Mitten in der Nacht. (Der Host kann den Prolog mit **Enter** überspringen.)

## Kapitel 1 – Die alte Schule (bei Nacht)

Die **Grundschule St. Aurelia** (3. OG Klassentrakt → 2. OG Fachräume → Erdgeschoss mit Eingangshalle): Klassenzimmer mit Schulbänken, Tafeln mit Kreideschrift, Schwarze Bretter, Klassenfotos, Spinde, Wanduhren, Pokalvitrine. Durch die **Fenster** (Regentropfen, Rollos, Heizkörper) siehst du nachts auf Schulhof, Zaun und Straße – **Autos fahren vorbei**, ihr Scheinwerferlicht fällt durch die Scheiben, Straßenlaternen leuchten, gegenüber brennt vereinzelt Licht. Je tiefer du kommst, desto tiefer liegt die Straße.

**Jede Etage ist anders gebaut:** Das **3. OG** hat klassische Klassenzimmer-Flure, das **2. OG** ist ein **Labyrinth** aus engen Gängen mit Sackgassen, Schleifen und widersprüchlichen Wegweisern („← AUSGANG“, „→ AUSGANG“ …), das **Erdgeschoss** ist eine große **Halle mit Pfeilern** und Rundgängen (leichter wegzulaufen, aber das Wesen sieht dich von weitem). Das Gebäude in Kapitel 2 ist wieder der Klassentrakt.

Statt einer Tür führt nur ein **Treppenschacht mit Geländer** nach unten (abgesperrt mit Flatterband, bis die Aufgabe gelöst ist). Auf jeder Etage musst du Rätsel lösen – im Erdgeschoss gibt es zum Schluss den Haupteingang mit Glastür. Je tiefer, desto schlimmer: schnelleres Wesen, mehr Schocks, mehr Dunkelheit.

- **3. OG:** Sicherungen finden und im Sicherungskasten einsetzen.
- **2. OG:** Schlüssel im Nachsitzraum (rot/grünes Flackerlicht) → Schularchiv aufschließen → Notizen mit Code-Ziffern sammeln → Code am Tastenfeld eingeben.
- **Erdgeschoss:** alles zusammen – Sicherungen, Schlüssel, Notizen, Code – dann der Haupteingang. Wenn du ihn öffnest, beginnt der Finale-Lauf.

**Verstecken:** Spinde, Schränke und Lehrertische (drunter kriechen) – viele davon auf jeder Etage. Das Wesen sucht trotzdem, bleib ruhig und leise.

**Fernseher:** In einigen Räumen laufen TVs („Onkel Marco · SCM“, „Popelmütze“, ein Brunnen-Mädchen im Stil von *The Ring*, Überwachungsbild, Nachrichten). Schaust du zu lange hin, zieht dich das Bild fest – dann kommt der Schreck, und du musst rennen.

## Kapitel 2 – Der Albtraum

Du wachst in einem komplett neuen, hellen Haus auf und glaubst an einen schlimmen Traum. Ein paar Stunden später bestellst du dir Pizza … danach wird alles noch schlimmer. Hör genau hin. Wenn du wieder einschläfst, ist da jemand im Zimmer.

(Das Ende ist nur angedeutet: Blut auf der Linse, dann Schnitt auf Schwarz.)

**Hotbar (Tasten 1–9, Mausrad):** Unten im Bild siehst du deine Gegenstände – 1 Kamera, 2 Taschenlampe, 3 Spraydose, 4 Sicherung, 5 Schlüssel, 6 Zigarette, 7 Joint, 8 Vape, 9 Bier. **In der Hand hältst du immer nur EINE Sache**: Die Lampe leuchtet nur, solange du sie hältst (F schaltet sie an/aus), Kamera, Foto und Zoom gehen nur mit der Kamera in der Hand, gesprüht wird nur mit der Dose. Dieselbe Taste legt den Gegenstand wieder weg. Das Mausrad schaltet durch (mit der Kamera in der Hand zoomt es).

**Zigarette (Taste 6):** Solo oder zu zweit (bzw. zu viert) im Co-op. Linksklick zündet an (Feuerzeug-Klick), danach zieht jeder Klick: Hand wandert zum Mund, Glut leuchtet auf, dann bläst du eine Rauchwolke aus, die im Raum hängen bleibt. Die Zigarette brennt nach ~13 Zügen ab. **Vorsicht:** Mit 7 % Wahrscheinlichkeit musst du husten – das ist laut und lockt das Wesen an. Im Co-op sehen und hören alle Mitspieler, wie du rauchst: Die Figur hält Zigarette, Joint oder Vape in der Hand, führt sie zum Mund, atmet die Wolke aus – und auch deine Ringe und Quallen kommen genau so bei ihnen an.

**Bier (Taste 9, unendlich) & betrunken werden:** Du hast immer eine blaue „V+ Energy“-Flasche (5 %) dabei – eine neue, sobald sie leer ist. Linksklick = Schluck (Flasche kommt zum Mund, Glucksen, ab und zu Rülpsen). Jeder Schluck macht dich betrunkener: Bild **schwankt und wird unscharf/doppelt**, die Kamera wackelt, du **taumelst beim Laufen**, driftest seitlich und stolperst bei starkem Rausch zufällig. Die Wirkung klingt langsam ab; Bier und Joint addieren sich. Mitspieler sehen, wie du trinkst. Joints sind ebenfalls unendlich.

**Mitspieler schubsen (Taste H, Co-op):** Stell dich vor einen Mitspieler (bis ~2 m) und drück H (Controller: Y in Reichweite, Handy: Taste SCHUBSEN). Er wird nach hinten gestoßen, verliert etwas Ausdauer, die Kamera ruckelt – alle sehen die Schubs-Animation. Im Versteck kann man nicht geschubst werden.

**Vape (Taste 8) & Rauch-Tricks:** Die Vape sieht aus wie eine „Bang Box“-Einweg-Vape (rosa→türkiser Verlauf, Krone, Totenkopf mit Hut, Display mit 100 %) und ist sofort einsatzbereit (kein Anzünden, brennt nicht ab, kaum Husten) und macht riesige Dampfwolken; die LED leuchtet beim Ziehen auf. Mit Zigarette, Joint und Vape kannst du Tricks: **Linksklick** = normaler Zug, **Rechtsklick** = **Rauchring** (dicker, fester Wirbelring mit Loch und leicht unregelmäßigem Rand, fliegt durch den Raum), **X** = **Rauch-Qualle** (leuchtender Wirbelring mit einer Glocke aus feinen Fäden, die zurück zum Mund fließen). Im Co-op blasen Mitspieler beim Rauchen ab und zu selbst Ringe und Quallen.

**Joint (Taste 7) – Rausch & Anomalien:** Linksklick zündet an und zieht (~8 Züge pro Joint, Husten-Chance 14 %). Jeder Zug macht dich „high“; der Rausch klingt langsam ab, **mehrere Joints stapeln sich**. Je höher du bist, desto schlimmer die Anomalien – nur bei dir selbst, Mitspieler sehen nur den Rauch: wabernde Wände und Kamera, wechselnde Farben, Doppelbilder, Herzschlag, Flüstern, Schritte, Augen im Dunkeln, flackernde Lichter, Spieluhr, Phantome des Wesens und Blackouts; die Leichen unter den Tüchern beginnen zu atmen. **Halluzinationen:** Wenn du high bist, siehst du manchmal Dinge, die nicht da sind (nur du): **schwebende Köpfe**, die dich anstarren und den Mund bewegen, **Köpfe, die an Fäden von der Decke baumeln**, und ab starkem Rausch **schwarze Gestalten**, die am Gangende stehen und langsam näher kommen. Dazu schauen **Köpfe um die Wandecke**: halb hinter der Kante schieben sie sich langsam heraus und starren dich an. Sie verschwinden, wenn du sie direkt ansiehst oder ihnen zu nah kommst – je mehr Joints, desto öfter und mehr. Der Joint-Zähler steht in der Hotbar. Der Joint sieht aus wie ein gerollter Kegel (weißer Filter, krümeliges Kraut, eingedrehte Spitze). **Die Wirkung hält nur kurz:** wenige Sekunden nach dem letzten Zug ist der Rausch (je nach Menge in etwa einer halben Minute) wieder weg – mehr Joints direkt hintereinander halten ihn höher.

Die Gegenstände in der Hand (Kamera, Lampe, Zigarette, Joint, Vape …) sitzen jetzt etwas weiter weg und sind kleiner, damit sie die Sicht nicht verdecken.

**Ducken (C):** Wer geduckt ist, wird vom Wesen kaum noch gesehen (ohne Lampe erst aus ~1,5 m, mit Lampe aus ~4 m) – langsamer, aber unauffällig.

**Taschenlampe suchen:** Nach dem Aufwachen hast du keine Lampe mehr. Im 3. OG liegen vier Taschenlampen verteilt (eine pro Spieler) – such sie, leuchtend am Boden. Ohne Lampe sieht man kaum etwas, ist aber auch schwerer zu entdecken. Mit F schaltest du sie an/aus.

**Figur-Editor (Menü → [ AUSSEHEN ], auch in der Lobby):** Die Figuren sind realistischer proportioniert (geformter Kopf mit Augen, Brauen und Lippen, Hände mit Fingern, Stoffkleidung mit Jeansmuster, Sneaker, Knie und Ellbogen beim Gehen). Stell dein Aussehen frei zusammen – Augenfarbe, Bart, Hautton, Frisur und Haarfarbe, Kopfbedeckung (Baseballcap, Beanie, Eimerhut, Kapuze, Cowboyhut, Stirnband), Brille, Mundschutz/Bandana, Oberteil (T-Shirt, Hoodie, Jacke, Weste) und Hose mit eigenen Farben, Schuhe, Rucksack/Umhängetasche und Schmuck (Kette, Ohrringe, Uhr, Armband). 3D-Vorschau zum Drehen. Wird im Browser gespeichert; im Co-op sehen alle dein Aussehen. Deine Hand in der Ego-Ansicht passt sich an.

**Roboter-Körper (Standard; Figur-Editor → KÖRPER: Roboter oder Mensch):** Jeder Spieler bekommt zunächst eine andere Farbe (Blau, Rot, Gelb, Grün), später frei änderbar. Zwei Roboter-Typen: **Kugelauge-Roboter** (Standard, blauer Eikopf mit großen Glubschaugen, geringelter Zylinderrumpf, Kegelarme und -beine) und **Android (Logo)**. Der Android-Typ sieht aus wie der grüne Android-Roboter: Kuppelkopf mit Antennen und weißen Augen, weißer Trennstrich, runder Rumpf, Kapselarme und -beine. Wählbar sind **Roboter-Farbe** (12 Farben, Standard Android-Grün), **Oberfläche** (Matt / Glänzend / Metall) und **Antennen-Schmuck** (Goldkugeln, Goldsterne, Herzen) – dazu der übrige Schmuck: Kette, Ohrringe, Uhr und Armband. Die Hand in der Ego-Ansicht übernimmt die Roboter-Farbe. Im Co-op sehen alle deinen Roboter.

**Menschen realistischer (Figur-Editor → KÖRPER: Mensch):** Neu: **Körperbau** (Schlank / Normal / Kräftig / Massiv – Schultern, Arme, Beine, Kopf), **Taktische Weste** (Brusttaschen, Schulterriemen, Magazintaschen über dunklem Langarmshirt), **Tunika + Weste** (lange Tunika bis zu den Knien), **Ausrüstung** (Gürtel + Holster, Gürtel + Taschen, Brustgurte + Holster), **Hautton Grün (Oger) und Blass**, **Trompetenohren / Spitze Ohren**, **Kinnbart** und **Gepflegter Vollbart**, **Kurze Locken**. Die Haut hat weicheres Licht, die Vorschau hat Gegenlicht und **Mausrad-Zoom** bis ins Gesicht.

**Inventar:** **I** oder **Tab** (steht auch rechts im HUD) zeigt, was du dabei hast – Lampenakku, Sicherungen, Schlüssel, Türcode, Spraydosen, Kamera – und alle gefundenen Notizen. Das Spiel läuft dabei weiter.

**Foto mit Blitz (G):** Richte die Kamera auf das Wesen und drück **G** – der Blitz blendet es: es erstarrt kurz, kreischt panisch und **rennt davon**, erst nach einer Weile kommt es wieder (und der Blitz lädt ca. 4 Sekunden nach). Die Fotos werden gespeichert und sind im Pause-Menü herunterladbar. Im Co-op wirkt der Blitz für alle.

**Videokamera:** Du hältst eine Camcorder in der Hand (Ego-Ansicht). **B** startet/stoppt die Aufnahme, **Mausrad** zoomt. Aufgenommen wird wirklich – Bild, Ton und Zeitstempel (WebM, bis 10 Minuten pro Clip). Nach dem Stoppen findest du die Videos im Pause-Menü (Esc) sowie auf Tod-/Ende-Bildschirm zum Herunterladen. Die Clips liegen nur im Browser-Speicher, bis du die Seite schließt.

**Unheimliches:** Zwischendurch passieren Dinge, ohne dass das Wesen dich jagt – eine verstimmte Spieluhr in der Ferne, Schritte hinter dir, die abrupt stoppen, zwei Augen im Dunkeln, die blinzeln und verschwinden, Bildstörungen mit kaputtem Zeitstempel, einzelne Einblendungen für Sekundenbruchteile. Und wer sich versteckt, hört es an der Tür kratzen.

## Respawn

Wer stirbt, ist **nicht mehr raus**: Nach der Todesszene wachst du am **Anfang der Etage** wieder auf (Akku mindestens 35 %, Wesen weit weg und kurz ruhig). Gefundene Gegenstände, eingesetzte Sicherungen und der Etagen-Fortschritt bleiben. Es zählt nur mit, wie oft du gestorben bist („Tode: n“). Im Co-op steht jeder einzeln wieder auf; es gibt kein Game Over und keinen Zuschauer-Modus mehr.

## Controller und Handy

**Controller** (Xbox/PlayStation/Standard-Gamepad, einfach anschließen und eine Taste drücken): linker Stick = laufen, rechter Stick = umsehen, **A** benutzen/aufnehmen/verstecken, **B** ducken, **X** Lampe, **Y** Blitzfoto, **RT** Aktion (sprühen/ziehen), **LT** Rauchring, **R3** Rauch-Qualle, **L3** rennen (an/aus), **LB/RB** Gegenstand wechseln, Steuerkreuz hoch = Video, runter = Ego/3rd, links = Sprühfarbe, rechts = Mikro, **Select** Inventar, **Start** Pause. In den Menüs: Steuerkreuz/Stick auswählen, A bestätigen, B zurück, links/rechts verstellt Regler. Der Controller vibriert, wenn das Wesen dich jagt.

**Handy/Tablet** (Touch wird automatisch erkannt, am besten im Querformat – beim ersten Antippen geht das Spiel in den Vollbildmodus): Joystick unten links = laufen, Wischen auf der rechten Bildhälfte = umsehen, Tasten für AKTION (halten), E · BENUTZEN, LAMPE, VIDEO, FOTO, RING, QUALLE, ITEM ◄ ►, RENNEN und DUCKEN (an/aus), INVENTAR, PAUSE; die Hotbar unten ist antippbar. Auf dem Handy startet die Grafik automatisch in der mittleren Stufe (sinkt bei zu niedriger Bildrate selbst).

## Android-App (APK) & Google Play Store

**Fertige Android-App:** `public/downloads/LetzteAufnahme.apk` (Capacitor-App im Querformat/Vollbild, Quellen in `android-app/`). Details in `ANDROID.md`.

Das Spiel ist als **installierbare Web-App (PWA)** vorbereitet (Manifest, Service Worker, Icons, Datenschutzseite `/privacy.html`). Wie du es als Android-App (TWA) im Play Store einreichst, steht Schritt für Schritt in **`ANDROID.md`** – das Veröffentlichen selbst geht nur über dein eigenes Play-Entwicklerkonto.

## Einstellungen (Menü und Pause: [ EINSTELLUNGEN ])

Drei Reiter: **TON**, **STEUERUNG**, **ANZEIGE**. Steuerung: alle Tasten frei belegbar (anklicken, neue Taste drücken), Maus-/Controller-/Touch-Empfindlichkeit, Y-Achse invertieren, Touch-Tastengröße, Deckkraft und Linkshänder-Layout. Anzeige: Sichtfeld (FOV), Stärke der Bildstörungen, Grafikstufe. Im Pause-Menü und in den Einstellungen gibt es **[ SPIEL BEENDEN ]** (zurück zum Hauptmenü).

**Ton:** Regler für Gesamt, Effekte, Hintergrund (Wind, Lampen, Jagd-Brummen), **Dauerbrummen** (der tiefe Dauerton lässt sich einzeln runterdrehen oder ausschalten), Mitspieler-Stimmen, Hall sowie **Bässe und Höhen** (±12 dB). Dazu **Klangprofile** (Original, Kino, Dumpf, Hell, Radio, Tief, Trocken, Höhle), die Filter, Hall und Klangfarbe verändern, und eine **Hörprobe**. Alles wird im Browser gespeichert.

## Allgemein

**Schwierigkeit** (Leicht / Normal / Albtraum) wird im Menü bzw. in der Lobby (Host) gewählt.

**Solo oder Online-Co-op (bis 4 Spieler):** Einer klickt „Raum erstellen“, die anderen geben den 4-stelligen Code ein; in der Lobby startet der Host. Läuft per WebRTC ohne eigenen Server (auch auf Vercel); für den Verbindungsaufbau wird der öffentliche PeerJS-Broker genutzt. Proximity-Voice (Mikrofon im Menü anhaken): Stimmen sind räumlich, Wände dämpfen – aber Reden lockt das Wesen an. Wer stirbt, schaut zu; auf der nächsten Etage sind alle wieder dabei.

**Steuerung:** WASD, Maus, Shift (rennen), C (ducken – kaum sichtbar), 1–9 (Gegenstand in die Hand), I / Tab (Inventar), B (Video aufnehmen), G (Foto mit Blitz), Mausrad (Zoom), F (Lampe), E (aufnehmen / benutzen / verstecken), linke Maustaste (sprühen), Q (Sprühfarbe), T (Ego/Third-Person), V (Mikrofon an/aus), Esc (Pause), R (nach dem Tod: Etage neu starten – im Co-op nur der Host), Leertaste (als Zuschauer: nächster Spieler).

**Spraydosen** liegen auf dem Boden (je 3 pro Etage, verschiedene Farben). Das Gesprühte sehen im Co-op alle. An den Wänden stehen schon Graffitis („ACT“ u. a.) – aber nicht überall, damit du selbst noch Platz hast.

## Shop – CritCandy (Gaming Snacks, Candy & Drinks)

Statischer Online-Shop unter **`/shop/`** (`public/shop/`) – ohne Build-Schritt, läuft direkt auf Vercel.

- `products.js` – **alles Wichtige an einer Stelle**: Shop-Name, E-Mail für Bestellungen, Versandkosten, Zahlungsarten, Mix-&-Spar-Stufen, Willkommens-Code, FAQ und alle Produkte (Preise, Texte, Farben, Sets). Die Datei erklärt oben jedes Produktfeld.
- `art.js` – zeichnet die Produktbilder als realistisch wirkende Verpackungen (Beutel, Chipstüte, Dose, Flasche, Nudelbecher, Riegel, Karton …) samt Inhalt davor. Sets zeigen die enthaltenen Produkte.
- `img/` – **eigene Produktfotos** ablegen und in `products.js` mit `image: "img/datei.jpg"` eintragen; das Foto ersetzt dann die Zeichnung.
- `app.js` / `style.css` / `index.html` – Logik, Design, Seitenstruktur.
- `impressum.html`, `datenschutz.html`, `agb.html` – **Vorlagen mit Platzhaltern**, vor dem Verkauf ausfüllen (keine Rechtsberatung).

Sortiment: rund 40 Einzelartikel in sieben Kategorien (Gummis, Sauer, Schoko & Riegel, Chips & Salziges, Instant & Essen, Getränke, Sets) plus Spar-Sets und Loot-Box. Alle Namen, Preise, Zutaten und Set-Inhalte sind Platzhalter.

Verkaufsmechaniken (alle ehrlich: keine erfundenen Bewertungen, Zähler oder Countdowns):

- **Spar-Sets** (`includes` in `products.js`): Der Shop rechnet die Ersparnis gegenüber dem Einzelkauf selbst aus den Produktpreisen aus.
- **Mix & Spar**: Rabatt auf einzelne Artikel, der mit der Menge steigt (`mix.tiers`), samt Level-Anzeige im Warenkorb. Pfand wird nie rabattiert.
- **Loot-Box**: Auf der Startseite öffnet der Besucher eine Box und schaltet den Willkommens-Code frei (`welcome`; auf `null` setzen zum Ausschalten). Code und Mix-Rabatt sind nicht kombinierbar – es gilt der höhere.
- Gratis-Versand ab Schwelle, Grundpreise je 100 g bzw. je Liter, Pfand (`pfand`) getrennt ausgewiesen, Cross-Selling im Produktdetail, Kassenleiste auf dem Handy.

Checkout: Der Warenkorb wird im Browser gespeichert. Beim Bestellen öffnet sich eine vorbereitete E-Mail an die Adresse aus `products.js`. Es gibt noch keine Online-Zahlung; dafür müsste ein Zahlungsanbieter (z. B. Stripe, PayPal) angebunden werden.

Lokal testen: `cd public && python3 -m http.server 8000` und `http://localhost:8000/shop/` öffnen.
