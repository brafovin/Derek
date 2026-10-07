# Derek

**LETZTE AUFNAHME** – Bodycam-Horrorspiel (eine einzige Datei: `public/index.html`, Three.js und PeerJS eingebettet).

**Solo oder Online-Co-op (bis 4 Spieler):** Einer klickt „Raum erstellen“, die anderen geben den 4-stelligen Code ein. Läuft per WebRTC ohne eigenen Server (auch auf Vercel); für den Verbindungsaufbau wird der öffentliche PeerJS-Broker genutzt. Proximity-Voice (Mikrofon im Menü anhaken): Stimmen sind räumlich, Wände dämpfen – aber Reden lockt das Wesen an.

Steuerung: WASD, Maus, Shift (rennen), C (ducken), F (Lampe), E (aufnehmen, verstecken, Tür öffnen), V (Mikrofon an/aus), linke Maustaste (sprühen), Q (Sprühfarbe wechseln), T (Ego/Third-Person), Esc (Pause), R (neu starten – im Co-op nur der Host), Leertaste (als Zuschauer: nächster Spieler).

Ältere Spiele (Granny Horror, Gun Zone) sind in der Git-Historie (Commit 0f923b8) und im Repo `derek2` zu finden.

**Spraydosen:** Im Gebäude liegen 5 Dosen (rot, weiß, blau, grün, gelb). Aufnehmen mit E, sprühen mit der linken Maustaste – in Ego- und Third-Person-Ansicht (T). Das Gesprühte sehen im Co-op alle Mitspieler; Sprühen macht Lärm und lockt das Wesen an.
