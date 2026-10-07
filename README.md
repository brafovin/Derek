# Derek

**LETZTE AUFNAHME** – Bodycam-Horrorspiel (eine einzige Datei: `public/index.html`, Three.js und PeerJS eingebettet).

Beim Start läuft ein kurzer Lade-Albtraum und ein 17-Sekunden-Trailer (Klick zum Überspringen). Mit `?skip` an der URL wird beides übersprungen.

## Kapitel 1 – Das Haus

**Das Haus hat 3 Etagen** (3. OG Patientenstation → 2. OG OP-Trakt → Erdgeschoss). Auf jeder Etage musst du Rätsel lösen, um die Treppe nach unten zu öffnen – im Erdgeschoss den Ausgang. Je tiefer, desto schlimmer: schnelleres Wesen, mehr Schocks, mehr Dunkelheit.

- **Etage 3:** Sicherungen finden und im Sicherungskasten einsetzen.
- **Etage 2:** Schlüssel im dunklen Stuhlraum (rot/grünes Flackerlicht) → Archiv aufschließen → Notizen mit Code-Ziffern sammeln → Code am Tastenfeld eingeben.
- **Erdgeschoss:** alles zusammen – Sicherungen, Schlüssel, Notizen, Code – dann der Ausgang. Wenn du ihn öffnest, beginnt der Finale-Lauf.

**Verstecken:** Spinde, Schränke und Betten (drunter kriechen) – viele davon auf jeder Etage. Das Wesen sucht trotzdem, bleib ruhig und leise.

**Fernseher:** In einigen Räumen laufen TVs („Onkel Marco · SCM“, „Popelmütze“, ein Brunnen-Mädchen im Stil von *The Ring*, Überwachungsbild, Nachrichten). Schaust du zu lange hin, zieht dich das Bild fest – dann kommt der Schreck, und du musst rennen.

## Kapitel 2 – Der Albtraum

Du wachst in einem komplett neuen, hellen Haus auf und glaubst an einen schlimmen Traum. Ein paar Stunden später bestellst du dir Pizza … danach wird alles noch schlimmer. Hör genau hin. Wenn du wieder einschläfst, ist da jemand im Zimmer.

(Das Ende ist nur angedeutet: Blut auf der Linse, dann Schnitt auf Schwarz.)

## Allgemein

**Schwierigkeit** (Leicht / Normal / Albtraum) wird im Menü bzw. in der Lobby (Host) gewählt.

**Solo oder Online-Co-op (bis 4 Spieler):** Einer klickt „Raum erstellen“, die anderen geben den 4-stelligen Code ein; in der Lobby startet der Host. Läuft per WebRTC ohne eigenen Server (auch auf Vercel); für den Verbindungsaufbau wird der öffentliche PeerJS-Broker genutzt. Proximity-Voice (Mikrofon im Menü anhaken): Stimmen sind räumlich, Wände dämpfen – aber Reden lockt das Wesen an. Wer stirbt, schaut zu; auf der nächsten Etage sind alle wieder dabei.

**Steuerung:** WASD, Maus, E (rennen, Shift geht auch), C (ducken), G (Lampe), F (aufnehmen / benutzen / verstecken), linke Maustaste (sprühen), Q (Sprühfarbe), T (Ego/Third-Person), V (Mikrofon an/aus), Esc (Pause), R (nach dem Tod: Etage neu starten – im Co-op nur der Host), Leertaste (als Zuschauer: nächster Spieler).

**Spraydosen** liegen auf dem Boden (je 3 pro Etage, verschiedene Farben). Das Gesprühte sehen im Co-op alle. An den Wänden stehen schon Graffitis („ACT“ u. a.) – aber nicht überall, damit du selbst noch Platz hast.
