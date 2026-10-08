# Derek

**LETZTE AUFNAHME** – Bodycam-Horrorspiel (eine einzige Datei: `public/index.html`, Three.js und PeerJS eingebettet).

Beim Start läuft ein kurzer Lade-Albtraum und ein 17-Sekunden-Trailer (Klick zum Überspringen). Mit `?skip` an der URL wird beides übersprungen.

## Kapitel 1 – Die alte Schule

Die **Grundschule St. Aurelia** (3. OG Klassentrakt → 2. OG Fachräume → Erdgeschoss mit Eingangshalle): Klassenzimmer mit Schulbänken, Tafeln mit Kreideschrift, Schwarze Bretter, Klassenfotos, Spinde, Wanduhren, Pokalvitrine. Durch die **Fenster** (Regentropfen, Rollos, Heizkörper) siehst du nachts auf Schulhof, Zaun und Straße – **Autos fahren vorbei**, ihr Scheinwerferlicht fällt durch die Scheiben, Straßenlaternen leuchten, gegenüber brennt vereinzelt Licht. Je tiefer du kommst, desto tiefer liegt die Straße.

Statt einer Tür führt nur ein **Treppenschacht mit Geländer** nach unten (abgesperrt mit Flatterband, bis die Aufgabe gelöst ist). Auf jeder Etage musst du Rätsel lösen – im Erdgeschoss gibt es zum Schluss den Haupteingang mit Glastür. Je tiefer, desto schlimmer: schnelleres Wesen, mehr Schocks, mehr Dunkelheit.

- **3. OG:** Sicherungen finden und im Sicherungskasten einsetzen.
- **2. OG:** Schlüssel im Nachsitzraum (rot/grünes Flackerlicht) → Schularchiv aufschließen → Notizen mit Code-Ziffern sammeln → Code am Tastenfeld eingeben.
- **Erdgeschoss:** alles zusammen – Sicherungen, Schlüssel, Notizen, Code – dann der Haupteingang. Wenn du ihn öffnest, beginnt der Finale-Lauf.

**Verstecken:** Spinde, Schränke und Lehrertische (drunter kriechen) – viele davon auf jeder Etage. Das Wesen sucht trotzdem, bleib ruhig und leise.

**Fernseher:** In einigen Räumen laufen TVs („Onkel Marco · SCM“, „Popelmütze“, ein Brunnen-Mädchen im Stil von *The Ring*, Überwachungsbild, Nachrichten). Schaust du zu lange hin, zieht dich das Bild fest – dann kommt der Schreck, und du musst rennen.

## Kapitel 2 – Der Albtraum

Du wachst in einem komplett neuen, hellen Haus auf und glaubst an einen schlimmen Traum. Ein paar Stunden später bestellst du dir Pizza … danach wird alles noch schlimmer. Hör genau hin. Wenn du wieder einschläfst, ist da jemand im Zimmer.

(Das Ende ist nur angedeutet: Blut auf der Linse, dann Schnitt auf Schwarz.)

**Inventar:** **I** oder **Tab** zeigt, was du dabei hast – Lampenakku, Sicherungen, Schlüssel, Türcode, Spraydosen, Kamera – und alle gefundenen Notizen. Das Spiel läuft dabei weiter.

**Videokamera:** Du hältst eine Camcorder in der Hand (Ego-Ansicht). **B** startet/stoppt die Aufnahme, **Mausrad** zoomt. Aufgenommen wird wirklich – Bild, Ton und Zeitstempel (WebM, bis 10 Minuten pro Clip). Nach dem Stoppen findest du die Videos im Pause-Menü (Esc) sowie auf Tod-/Ende-Bildschirm zum Herunterladen. Die Clips liegen nur im Browser-Speicher, bis du die Seite schließt.

**Unheimliches:** Zwischendurch passieren Dinge, ohne dass das Wesen dich jagt – eine verstimmte Spieluhr in der Ferne, Schritte hinter dir, die abrupt stoppen, zwei Augen im Dunkeln, die blinzeln und verschwinden, Bildstörungen mit kaputtem Zeitstempel, einzelne Einblendungen für Sekundenbruchteile. Und wer sich versteckt, hört es an der Tür kratzen.

## Allgemein

**Schwierigkeit** (Leicht / Normal / Albtraum) wird im Menü bzw. in der Lobby (Host) gewählt.

**Solo oder Online-Co-op (bis 4 Spieler):** Einer klickt „Raum erstellen“, die anderen geben den 4-stelligen Code ein; in der Lobby startet der Host. Läuft per WebRTC ohne eigenen Server (auch auf Vercel); für den Verbindungsaufbau wird der öffentliche PeerJS-Broker genutzt. Proximity-Voice (Mikrofon im Menü anhaken): Stimmen sind räumlich, Wände dämpfen – aber Reden lockt das Wesen an. Wer stirbt, schaut zu; auf der nächsten Etage sind alle wieder dabei.

**Steuerung:** WASD, Maus, Shift (rennen), C (ducken), I / Tab (Inventar), B (Videokamera aufnehmen), Mausrad (Zoom), F (Lampe), E (aufnehmen / benutzen / verstecken), linke Maustaste (sprühen), Q (Sprühfarbe), T (Ego/Third-Person), V (Mikrofon an/aus), Esc (Pause), R (nach dem Tod: Etage neu starten – im Co-op nur der Host), Leertaste (als Zuschauer: nächster Spieler).

**Spraydosen** liegen auf dem Boden (je 3 pro Etage, verschiedene Farben). Das Gesprühte sehen im Co-op alle. An den Wänden stehen schon Graffitis („ACT“ u. a.) – aber nicht überall, damit du selbst noch Platz hast.
