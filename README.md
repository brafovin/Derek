# Derek
Angelegt über das BRAFO-Dashboard

## 🎆 Knallmania – Feuerwerks-Sandbox

Ein 3D-Feuerwerks-Spiel im Browser (Three.js + cannon.js, alles in einer Datei, läuft auch offline).
Öffnen: [`knallmania/index.html`](knallmania/index.html) (bzw. `/knallmania/` auf der Seite).

**Steuerung** – `WASD` laufen · `Maus` umschauen · `LMB` benutzen · `1` Feuerzeug · `2` Greifer · `3` Löschen ·
`4–9` Feuerwerk-Slots · `B` Katalog · `F` anzünden & werfen · `G` alles zünden · `Z` Zeitlupe · `V` fliegen ·
`R` drehen · `L` Lampe · `P` Foto · `H` HUD aus · `Esc` Menü. Auf dem Handy gibt es Touch-Steuerung.

**Inhalt** – 40+ Artikel: Böller (Kracher bis 5-kg-Mega-Bombe), Ketten-Böller, Raketen (Heuler, Palme, Herz …),
Batterien (bis 150 Schuss), Fontänen, Römische Lichter, Mörser (bis 8″ Riesenschale), Bodenwirbel, Nebeltöpfe,
Show-Pakete – dazu zerstörbare Objekte (Kisten, Pulverfässer, Gartenzwerge, Dixi-Klo, Auto, Ziegelmauern, Ragdoll-Dummies …).
Alle Effekte (GPU-Funken, Rauch, dynamisches Licht, 3D-Sound mit Schall-Laufzeit & Echo) sind komplett prozedural.

**Entwicklung** – Quellcode in `knallmania/src/`, Bauen mit `python3 knallmania/build.py` (erzeugt `knallmania/index.html`).
