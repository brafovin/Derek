# Derek

**LETZTE AUFNAHME** – Bodycam-Horrorspiel (eine einzige Datei: `public/index.html`, Three.js und PeerJS eingebettet).

**Das Haus hat 3 Etagen** (3. OG Patientenstation → 2. OG OP-Trakt → Erdgeschoss). Auf jeder Etage musst du Rätsel lösen, um die Treppe nach unten zu öffnen – im Erdgeschoss den Ausgang. Je tiefer, desto schlimmer: schnelleres Wesen, mehr Schocks, mehr Dunkelheit.

- **Etage 3:** Sicherungen finden und im Sicherungskasten einsetzen.
- **Etage 2:** Schlüssel im dunklen Stuhlraum (rot/grünes Flackerlicht) → Archiv aufschließen → Notizen mit Code-Ziffern sammeln → Code am Tastenfeld eingeben.
- **Erdgeschoss:** alles zusammen – Sicherungen, Schlüssel, Notizen, Code – dann der Ausgang.

**Schwierigkeit** (Leicht / Normal / Albtraum) wird im Menü bzw. in der Lobby (Host) gewählt.

**Solo oder Online-Co-op (bis 4 Spieler):** Einer klickt „Raum erstellen“, die anderen geben den 4-stelligen Code ein; in der Lobby startet der Host. Läuft per WebRTC ohne eigenen Server (auch auf Vercel); für den Verbindungsaufbau wird der öffentliche PeerJS-Broker genutzt. Proximity-Voice (Mikrofon im Menü anhaken): Stimmen sind räumlich, Wände dämpfen – aber Reden lockt das Wesen an. Wer stirbt, schaut zu; auf der nächsten Etage sind alle wieder dabei.

**Steuerung:** WASD, Maus, Shift (rennen), C (ducken), F (Lampe), E (aufnehmen / benutzen / im Spind verstecken), linke Maustaste (sprühen), Q (Sprühfarbe), T (Ego/Third-Person), V (Mikrofon an/aus), Esc (Pause), R (nach dem Tod: Etage neu starten – im Co-op nur der Host), Leertaste (als Zuschauer: nächster Spieler).

**Spraydosen** liegen auf dem Boden (je 3 pro Etage, verschiedene Farben). Das Gesprühte sehen im Co-op alle. An den Wänden stehen schon Graffitis („ACT“ u. a.) – aber nicht überall, damit du selbst noch Platz hast.
