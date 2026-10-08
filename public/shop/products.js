/* ============================================================
   SHOP-KONFIGURATION + PRODUKTE
   Hier änderst du alles Wichtige – der Rest des Shops passt sich an.
   ============================================================ */

window.SHOP = {
  name: "CritCandy",
  tagline: "Gaming Snacks, Candy & Drinks",
  currency: "EUR",

  /* Bestellungen landen per E-Mail bei dir. UNBEDINGT ändern! */
  email: "bestellung@deine-domain.de",

  shipping: { cost: 3.9, freeFrom: 25 },       // Versandkosten / gratis ab (Warenwert nach Rabatt, ohne Pfand)
  maxPerItem: 20,

  payments: [                                  // Auswahl im Checkout
    "Vorkasse (Überweisung)",
    "PayPal",
  ],

  /* "Mix & Spar": Rabatt auf alle einzelnen Artikel (nicht auf Sets & Boxen, nicht auf Pfand).
     Je mehr Artikel im Korb, desto höher der Rabatt. Passe qty/percent nach deiner Kalkulation an! */
  mix: {
    tiers: [
      { qty: 3, percent: 5 },
      { qty: 5, percent: 10 },
      { qty: 8, percent: 15 },
    ],
  },

  /* Willkommens-Rabatt (wird über die Loot-Box auf der Startseite freigeschaltet).
     Nicht mit Mix & Spar kombinierbar – es gilt der höhere Rabatt.
     Auf  welcome: null  setzen, um Loot-Box und Code ganz auszuschalten. */
  welcome: { code: "LEVELUP10", percent: 10, minOrder: 15 },

  /* Platzhalter in Texten: {freeFrom} {shipCost} {maxMix} {maxSet} {mixText}
     {welcomeCode} {welcomePercent} {welcomeMin} {payments} {pfand} */
  perks: [
    { icon: "🚚", title: "Gratis-Versand ab {freeFrom} €", text: "Darunter nur {shipCost} € Versand. Versand in 1–2 Werktagen." },
    { icon: "🧩", title: "Mix & Spar bis −{maxMix} %",     text: "Stell dir deinen Mix selbst zusammen – je mehr Artikel, desto günstiger." },
    { icon: "🎁", title: "Spar-Sets & Loot-Boxen",         text: "Fertige Sets mit bis zu {maxSet} % Ersparnis gegenüber dem Einzelkauf." },
  ],

  faq: [
    { q: "Wie läuft die Bestellung ab?",
      a: "Du legst deine Favoriten in den Warenkorb und schickst die Bestellung ab. Sie erreicht uns per E-Mail, wir bestätigen sie und schicken dir die Zahlungsdetails. Verschickt wird nach Zahlungseingang." },
    { q: "Wie funktioniert Mix & Spar?",
      a: "{mixText} Das gilt für alle einzelnen Artikel – Sets und Boxen sind schon günstiger kalkuliert. Rabattcodes sind nicht kombinierbar, es gilt automatisch der höhere Rabatt." },
    { q: "Was kostet der Versand?",
      a: "{shipCost} € pro Bestellung. Ab {freeFrom} € Warenwert (nach Rabatt) versenden wir kostenlos." },
    { q: "Wie ist das mit dem Pfand?",
      a: "Auf Getränke in Dosen und Einwegflaschen kommt {pfand} Pfand pro Stück dazu. Das Pfand wird im Warenkorb und auf der Rechnung getrennt ausgewiesen." },
    { q: "Welche Zahlungsarten gibt es?",
      a: "{payments}." },
    { q: "Wo finde ich Zutaten und Allergene?",
      a: "Zutaten, Allergene und Haltbarkeit stehen auf der Verpackung jedes Produkts." },
  ],
};

/* Kategorien (Reihenfolge = Reihenfolge der Filter-Buttons) */
window.CATEGORIES = [
  { id: "gummis",    label: "Gummis & Co." },
  { id: "sauer",     label: "Sauer" },
  { id: "schoko",    label: "Schoko & Riegel" },
  { id: "salzig",    label: "Chips & Salziges" },
  { id: "essen",     label: "Instant & Essen" },
  { id: "getraenke", label: "Getränke" },
  { id: "boxen",     label: "Boxen & Sets" },
];

/*  Produktfelder
    id       eindeutig, ohne Leerzeichen
    cat      eine der Kategorie-IDs oben
    price    Preis in € (inkl. MwSt.)
    weight   Füllmenge als Text, wird im Shop angezeigt
    grams    Füllmenge in Gramm → Grundpreis je 100 g (Pflicht bei Lebensmitteln)
    ml       Füllmenge in Milliliter → Grundpreis je Liter (bei Getränken)
    pfand    Pfand pro Stück in € (z. B. 0.25 für Einwegdosen/-flaschen)
    note     optionaler Hinweis im Produktdetail (z. B. Koffein)
    tags     kleine Labels auf der Karte
    badge    optional: "Neu", "Tipp" … (Sets zeigen automatisch ihre Ersparnis)
    image    optional: Pfad zu deinem eigenen Produktfoto, z. B. "img/xp-boost.jpg"
             → ersetzt die Zeichnung. Lege die Bilder in den Ordner public/shop/img/

    Aussehen der gezeichneten Verpackung:
    pack     Verpackungsart: pouch (Standbeutel) | chipbag (Chipstüte) | tube | box |
             can (Dose) | bottle | bars (Riegel) | cup (Nudelbecher) | tin (Dose rund) |
             sachets (Sticks) | loot (Loot-Box)
    label    großer Name auf der Verpackung (kurz halten)
    sub      Zeile im Band darunter
    icon     Inhalt, der auf der Verpackung und davor liegt: bear belt bottle worm heart ring
             cube gamepad lolli drop mallow pastille licorice egg strawberry chip nacho popcorn
             nut jerky pretzel cracker cookie mochi stick choc bar noodle bolt
    colors   [Verpackungsfarbe, Akzentfarbe]
    pieces   Farben des Inhalts (bunte Gummis: drei Farben; bei Chips/Riegeln: [Grundfarbe, Würzfarbe])
    glow     Leuchtfarbe hinter der Karte (sonst die Akzentfarbe)
    includes optional: Liste von Produkt-IDs → macht das Produkt zum Set. Der Shop
             rechnet die Ersparnis gegenüber dem Einzelkauf selbst aus (gleiche ID
             mehrfach = mehrere Stück). Auf dem Bild stehen die enthaltenen Produkte.
    deal     true = erscheint oben im Bereich "Spar-Sets & Loot-Boxen"

    ACHTUNG: Namen, Beschreibungen, Tags, Preise und Set-Inhalte sind Platzhalter.
    Zutaten, Allergene, "vegan", Nährwert- und Gesundheitsangaben musst du für
    deine echten Produkte selbst prüfen und korrekt angeben.                   */
const KOFFEIN = "Erhöhter Koffeingehalt. Für Kinder und schwangere oder stillende Frauen nicht empfohlen.";

window.PRODUCTS = [
  /* ---------------- Gummis & Co. ---------------- */
  { id: "controller-gummis", cat: "gummis", name: "Player-2 Controller-Gummis", price: 3.49, weight: "180 g", grams: 180,
    desc: "Fruchtgummis in Controller-Form – mit Steuerkreuz und allem Drum und Dran. Zum Zocken und zum Snacken.",
    tags: ["fruchtig", "Controller"], badge: "Neu", pack: "pouch", label: "PLAYER 2", sub: "CONTROLLER-GUMMIS", icon: "gamepad",
    colors: ["#5b2fd6", "#27e6ff"], pieces: ["#27e6ff", "#ff2fb3", "#b6ff3b"], glow: "#8b5cff" },

  { id: "crit-hit-cola", cat: "gummis", name: "Crit-Hit Cola-Flaschen", price: 2.49, weight: "200 g", grams: 200,
    desc: "Klassische Cola-Gummiflaschen – kritischer Treffer auf den Geschmacksnerv.",
    tags: ["süß", "cola"], pack: "pouch", label: "CRIT-HIT", sub: "COLA-FLASCHEN", icon: "bottle",
    colors: ["#2b1710", "#ff8a1f"], pieces: ["#8f4a22", "#a85c2c", "#7a3d1b"], glow: "#ff8a1f" },

  { id: "lag-spike-lollis", cat: "gummis", name: "Lag-Spike Brause-Lollis (6er)", price: 3.99, weight: "6 × 12 g", grams: 72,
    desc: "Lollis mit Brause-Kern, der im Mund knistert. Kein Ping, nur Spaß.",
    tags: ["knisternd", "fruchtig"], badge: "Neu", pack: "pouch", label: "LAG-SPIKE", sub: "BRAUSE-LOLLIS", icon: "lolli",
    colors: ["#0a86b8", "#ffd23f"], pieces: ["#27e6ff", "#ff2fb3", "#ffd23f"], glow: "#27e6ff" },

  { id: "extra-leben-herzen", cat: "gummis", name: "Extra-Leben Herz-Gummis", price: 2.49, weight: "150 g", grams: 150,
    desc: "Fruchtige Herzen für den Notfall. Noch ein Leben? Klar, nimm gleich drei.",
    tags: ["süß", "fruchtig"], pack: "pouch", label: "EXTRA-LEBEN", sub: "HERZ-GUMMIS", icon: "heart",
    colors: ["#b5123b", "#ffd23f"], pieces: ["#ff3b6b", "#ff8fb0", "#ff5a5a"], glow: "#ff3b6b" },

  { id: "power-up-baerchen", cat: "gummis", name: "Power-Up Gummibärchen-Mix", price: 2.79, weight: "200 g", grams: 200,
    desc: "Bunter Bären-Mix in fünf Geschmacksrichtungen. Jedes Bärchen ein kleines Power-up.",
    tags: ["süß", "fruchtig", "vegan"], pack: "pouch", label: "POWER-UP", sub: "GUMMIBÄRCHEN", icon: "bear",
    colors: ["#f4b400", "#e5233e"], pieces: ["#ff4d4d", "#7bd62f", "#ffd23f"], glow: "#ffb400" },

  { id: "pixel-bites", cat: "gummis", name: "Pixel-Bites Würfel-Gummis", price: 3.49, weight: "180 g", grams: 180,
    desc: "Würfelförmige Fruchtgummis im Retro-Look – jedes Stück ein kleiner Pixel.",
    tags: ["fruchtig", "vegan"], pack: "pouch", label: "PIXEL-BITES", sub: "WÜRFEL-GUMMIS", icon: "cube",
    colors: ["#1b5fd6", "#b6ff3b"], pieces: ["#8b5cff", "#27e6ff", "#b6ff3b"], glow: "#27a0ff" },

  { id: "noob-tube-marshmallows", cat: "gummis", name: "Noob-Tube Marshmallows", price: 2.99, weight: "150 g", grams: 150,
    desc: "Fluffig, weich und kinderleicht zu genießen. Auch Anfänger kommen damit klar.",
    tags: ["süß", "weich"], pack: "pouch", label: "NOOB-TUBE", sub: "MARSHMALLOWS", icon: "mallow",
    colors: ["#e5489f", "#ffe08a"], pieces: ["#ff9fd5", "#f4f1ff", "#ffe08a"], glow: "#ff8fd0" },

  { id: "loot-rings", cat: "gummis", name: "Loot-Rings Fruchtgummi-Ringe", price: 2.79, weight: "200 g", grams: 200,
    desc: "Bunte Fruchtgummi-Ringe zum Sammeln – gibt es in Rot, Gelb und Grün. Für jede Runde ein Ring.",
    tags: ["fruchtig", "bunt"], pack: "pouch", label: "LOOT-RINGS", sub: "FRUCHTGUMMI-RINGE", icon: "ring",
    colors: ["#6a2bd9", "#ffd23f"], pieces: ["#ff5d5d", "#ffd23f", "#6ee7a0"], glow: "#8b5cff" },

  { id: "spawn-eggs", cat: "gummis", name: "Spawn-Eggs Spiegeleier", price: 2.49, weight: "150 g", grams: 150,
    desc: "Schaumzucker-Spiegeleier mit Fruchtgummi-Dotter. Sehen aus wie echt, schmecken viel besser.",
    tags: ["süß", "weich"], pack: "pouch", label: "SPAWN-EGGS", sub: "SPIEGELEIER", icon: "egg",
    colors: ["#e8651a", "#ffffff"], pieces: ["#ffffff"], glow: "#ff9a2f" },

  { id: "berry-buff", cat: "gummis", name: "Berry-Buff Schaum-Erdbeeren", price: 2.69, weight: "160 g", grams: 160,
    desc: "Weiche Erdbeeren aus Schaumzucker – der Buff für schlechte Laune.",
    tags: ["süß", "fruchtig"], pack: "pouch", label: "BERRY-BUFF", sub: "SCHAUM-ERDBEEREN", icon: "strawberry",
    colors: ["#c8123a", "#7bd62f"], pieces: ["#e8284a", "#ff5a6e", "#d61c3d"], glow: "#ff3b5c" },

  { id: "dark-mode-lakritz", cat: "gummis", name: "Dark-Mode Lakritz-Schnecken", price: 2.79, weight: "200 g", grams: 200,
    desc: "Lakritz-Schnecken mit buntem Fruchtgummi-Kern. Schwarz im Dark Mode, bunt in der Mitte.",
    tags: ["süß", "Lakritz"], pack: "pouch", label: "DARK MODE", sub: "LAKRITZ-SCHNECKEN", icon: "licorice",
    colors: ["#1c1a26", "#ff2fb3"], pieces: ["#ff2fb3", "#ffd23f", "#27e6ff"], glow: "#ff2fb3" },

  /* ---------------- Sauer ---------------- */
  { id: "xp-boost-sauergurtel", cat: "sauer", name: "XP-Boost Sauergürtel", price: 2.99, weight: "150 g", grams: 150,
    desc: "Extra saure Fruchtgummi-Gürtel mit Zuckerkruste. Gibt dir den Kick für die nächste Runde.",
    tags: ["sauer", "fruchtig"], badge: "Tipp", pack: "pouch", label: "XP-BOOST", sub: "SAUERGÜRTEL", icon: "belt",
    colors: ["#c8177f", "#b6ff3b"], pieces: ["#ff2fb3", "#b6ff3b", "#27e6ff"], glow: "#ff2fb3" },

  { id: "rage-quit-wuermer", cat: "sauer", name: "Rage-Quit Sauerwürmer", price: 2.79, weight: "200 g", grams: 200,
    desc: "Saure Gummiwürmer mit Zuckerkruste – damit der Frust nach der Niederlage wenigstens lecker ist.",
    tags: ["sauer", "fruchtig"], pack: "pouch", label: "RAGE-QUIT", sub: "SAUERWÜRMER", icon: "worm",
    colors: ["#1f8f34", "#ff8a1f"], pieces: ["#b6ff3b", "#ff8a1f", "#ff2fb3"], glow: "#b6ff3b" },

  { id: "energy-drop-pastillen", cat: "sauer", name: "Energy-Drop Sauer-Pastillen", price: 2.49, weight: "90 g", grams: 90,
    desc: "Kleine Pastillen mit großem Sauer-Effekt in der handlichen Dose. Passt in jede Hosentasche und jeden Controller-Bag.",
    tags: ["sauer", "klein"], pack: "tin", label: "ENERGY-DROP", sub: "SAUER-PASTILLEN", icon: "pastille",
    colors: ["#0fa57a", "#ffd23f"], pieces: ["#b6ff3b", "#ffd23f", "#ff2fb3"], glow: "#12d9a0" },

  { id: "mana-trank-pulver", cat: "sauer", name: "Mana-Trank Sauerpulver", price: 1.99, weight: "3 × 10 g", grams: 30,
    desc: "Brausiges Sauerpulver zum Dippen. Füllt dein Mana in drei Sekunden wieder auf.",
    tags: ["sauer", "brausig"], pack: "sachets", label: "MANA-TRANK", sub: "SAUERPULVER", icon: "pastille",
    colors: ["#1e8fd6", "#8b5cff"], pieces: ["#27e6ff", "#8b5cff", "#b6ff3b"], glow: "#27e6ff" },

  { id: "glitch-sauer-cola", cat: "sauer", name: "Glitch Sauer-Cola", price: 2.79, weight: "200 g", grams: 200,
    desc: "Cola-Flaschen mit saurer Zuckerschicht. Ein kleiner Glitch im Geschmackssystem.",
    tags: ["sauer", "cola"], pack: "pouch", label: "GLITCH", sub: "SAUER-COLA", icon: "bottle",
    colors: ["#3b0ca3", "#b6ff3b"], pieces: ["#ffd23f", "#ff7a1a", "#b6ff3b"], glow: "#8b5cff" },

  /* ---------------- Schoko & Riegel ---------------- */
  { id: "boss-fight-chili", cat: "schoko", name: "Boss-Fight Chili-Schoko-Drops", price: 3.99, weight: "120 g", grams: 120,
    desc: "Zartbitter-Drops mit einem Hauch Chili. Süß am Anfang, Endgegner am Ende.",
    tags: ["scharf", "schoko"], badge: "Scharf", pack: "pouch", label: "BOSS-FIGHT", sub: "CHILI-SCHOKO", icon: "drop",
    colors: ["#4a2210", "#ff5a1f"], pieces: ["#6b3a1e", "#ff5a1f", "#ffd23f"], glow: "#ff5a1f" },

  { id: "boss-bar-karamell", cat: "schoko", name: "Boss-Bar Karamell-Riegel", price: 1.49, weight: "50 g", grams: 50,
    desc: "Schokoriegel mit Karamell-Kern. Der klassische Snack zwischen zwei Matches.",
    tags: ["süß", "Karamell"], pack: "bars", label: "BOSS-BAR", sub: "KARAMELL", icon: "choc",
    colors: ["#7a3b16", "#ffd23f"], pieces: ["#5a2a12", "#ffd23f"], glow: "#ffb347" },

  { id: "mana-bar-protein", cat: "schoko", name: "Mana-Bar Protein-Riegel", price: 1.99, weight: "55 g", grams: 55,
    desc: "Proteinriegel mit Nuss-Stückchen für lange Sessions. Zum Auffüllen zwischendurch.",
    tags: ["Protein", "Riegel"], pack: "bars", label: "MANA-BAR", sub: "PROTEIN", icon: "bar",
    colors: ["#1b2a8a", "#27e6ff"], pieces: ["#7b5a3a", "#27e6ff"], glow: "#27e6ff" },

  { id: "level-1-nussriegel", cat: "schoko", name: "Level-1 Nuss-Riegel", price: 1.29, weight: "35 g", grams: 35,
    desc: "Knuspriger Nussriegel – der Einstieg, wenn der kleine Hunger kommt.",
    tags: ["Riegel", "Nuss"], pack: "bars", label: "LEVEL 1", sub: "NUSS-RIEGEL", icon: "bar",
    colors: ["#2f7a2a", "#ffd23f"], pieces: ["#c99a52", "#ffd23f"], glow: "#7bd62f" },

  { id: "crit-cookies", cat: "schoko", name: "Crit Cookies Schoko-Stücke", price: 2.49, weight: "150 g", grams: 150,
    desc: "Knusprige Cookies mit Schokostücken. Garantierter kritischer Treffer.",
    tags: ["süß", "Cookies"], pack: "pouch", label: "CRIT COOKIES", sub: "SCHOKO-STÜCKE", icon: "cookie",
    colors: ["#a85a1c", "#fff1c6"], pieces: ["#d99a4e", "#3a1f12"], glow: "#e8a04a" },

  { id: "combo-sticks", cat: "schoko", name: "Combo-Sticks Schoko-Gebäck", price: 1.69, weight: "45 g", grams: 45,
    desc: "Knusprige Gebäck-Sticks mit Schokolade überzogen – zum Teilen oder allein vernichten.",
    tags: ["süß", "knusprig"], pack: "box", label: "COMBO-STICKS", sub: "SCHOKO-GEBÄCK", icon: "stick",
    colors: ["#d0152f", "#ffd23f"], pieces: ["#d9a25b", "#4a2210"], glow: "#ff4d5e" },

  /* ---------------- Chips & Salziges ---------------- */
  { id: "headshot-paprika-chips", cat: "salzig", name: "Headshot Paprika-Chips", price: 2.49, weight: "150 g", grams: 150,
    desc: "Knusprige Kartoffelchips mit kräftigem Paprika. Volltreffer – direkt in den Mund.",
    tags: ["salzig", "Paprika"], pack: "chipbag", label: "HEADSHOT", sub: "PAPRIKA-CHIPS", icon: "chip",
    colors: ["#d11a14", "#ffd23f"], pieces: ["#f0b429", "#d9481f"], glow: "#ff3b30" },

  { id: "nacho-nerd-nachos", cat: "salzig", name: "Nacho-Nerd Käse-Nachos", price: 2.79, weight: "150 g", grams: 150,
    desc: "Maischips mit Käsegeschmack. Passen zu jedem Dip und zu jedem Stream.",
    tags: ["salzig", "Käse"], pack: "chipbag", label: "NACHO-NERD", sub: "KÄSE-NACHOS", icon: "nacho",
    colors: ["#f2a900", "#d11a14"], pieces: ["#f4b21c", "#d9481f"], glow: "#ffb400" },

  { id: "ranger-tube-chips", cat: "salzig", name: "Ranger Sour-Cream-Chips (Röhre)", price: 2.79, weight: "165 g", grams: 165,
    desc: "Gleichmäßige Chips in der praktischen Röhre – mit Sour-Cream-Geschmack. Lässt sich auch mit einer Hand essen.",
    tags: ["salzig", "Röhre"], pack: "tube", label: "RANGER", sub: "SOUR CREAM", icon: "chip",
    colors: ["#27963f", "#f4f1ff"], pieces: ["#f0b429", "#7bd62f"], glow: "#4cd964" },

  { id: "pixel-pop-popcorn", cat: "salzig", name: "Pixel-Pop Karamell-Popcorn", price: 2.49, weight: "100 g", grams: 100,
    desc: "Popcorn mit knackiger Karamell-Hülle. Kino-Gefühl für die Couch.",
    tags: ["süß", "Popcorn"], pack: "chipbag", label: "PIXEL-POP", sub: "KARAMELL-POPCORN", icon: "popcorn",
    colors: ["#6a2bd9", "#ffd23f"], pieces: ["#e3a23a", "#8a4b14"], glow: "#8b5cff" },

  { id: "mana-mix-nuesse", cat: "salzig", name: "Mana-Mix Nuss-Mischung", price: 3.99, weight: "150 g", grams: 150,
    desc: "Geröstete Erdnüsse und Mandeln mit Salz. Energie für die lange Nacht.",
    tags: ["salzig", "Nüsse"], pack: "pouch", label: "MANA-MIX", sub: "NUSS-MISCHUNG", icon: "nut",
    colors: ["#7a4f24", "#f5d76e"], pieces: ["#d8a45b", "#8a5a2b"], glow: "#e0a85a" },

  { id: "crit-jerky", cat: "salzig", name: "Crit-Jerky Beef Jerky", price: 4.99, weight: "50 g", grams: 50,
    desc: "Würzig getrocknetes Rindfleisch zum Knabbern. Viel Geschmack, kaum Gewicht im Controller-Bag.",
    tags: ["herzhaft", "Fleisch"], pack: "pouch", label: "CRIT-JERKY", sub: "BEEF JERKY", icon: "jerky",
    colors: ["#6e1b17", "#ffd23f"], pieces: ["#7a2f1c"], glow: "#d9483a" },

  { id: "brezel-bits", cat: "salzig", name: "Brezel-Bits Salz-Brezeln", price: 1.99, weight: "150 g", grams: 150,
    desc: "Knusprige Mini-Brezeln mit Salz. Der Klassiker, jetzt zum Weiterzocken.",
    tags: ["salzig", "knusprig"], pack: "pouch", label: "BREZEL-BITS", sub: "SALZ-BREZELN", icon: "pretzel",
    colors: ["#b97a2a", "#1b5fd6"], pieces: ["#b86f2a"], glow: "#e0a050" },

  { id: "cheese-crit-cracker", cat: "salzig", name: "Cheese-Crit Käse-Cracker", price: 1.99, weight: "100 g", grams: 100,
    desc: "Kleine Käse-Cracker mit Biss. Ideal für Dips oder pur.",
    tags: ["salzig", "Käse"], pack: "pouch", label: "CHEESE-CRIT", sub: "KÄSE-CRACKER", icon: "cracker",
    colors: ["#e86f1c", "#ffffff"], pieces: ["#f0a23a", "#ffd23f"], glow: "#ff9a2f" },

  /* ---------------- Instant & Essen ---------------- */
  { id: "ramen-night-beef", cat: "essen", name: "Ramen Night Beef", price: 1.99, weight: "70 g", grams: 70,
    desc: "Instant-Nudeln im Becher mit Rindfleisch-Geschmack. Wasser drauf, drei Minuten warten, weiterzocken.",
    tags: ["Instant", "herzhaft"], pack: "cup", label: "RAMEN NIGHT", sub: "BEEF", icon: "noodle",
    colors: ["#b5121b", "#ffd23f"], pieces: ["#f1d48a", "#d86a3a"], glow: "#ff3b30" },

  { id: "ramen-night-spicy", cat: "essen", name: "Ramen Night Spicy", price: 2.19, weight: "75 g", grams: 75,
    desc: "Instant-Nudeln im Becher mit scharfer Würzsauce. Nur für Spieler mit Schärfe-Resistenz.",
    tags: ["Instant", "scharf"], badge: "Scharf", pack: "cup", label: "RAMEN NIGHT", sub: "SPICY", icon: "noodle",
    colors: ["#ff5a1f", "#1b1030"], pieces: ["#f1d48a", "#d86a3a"], glow: "#ff5a1f" },

  { id: "ramen-night-veggie", cat: "essen", name: "Ramen Night Veggie", price: 1.99, weight: "65 g", grams: 65,
    desc: "Instant-Nudeln im Becher mit Gemüsebrühe. Die leichte Variante für den späten Abend.",
    tags: ["Instant", "Gemüse"], pack: "cup", label: "RAMEN NIGHT", sub: "VEGGIE", icon: "noodle",
    colors: ["#2c9a4a", "#ffe08a"], pieces: ["#f1d48a", "#3f9a4a"], glow: "#4cd964" },

  { id: "mac-attack-cup", cat: "essen", name: "Mac Attack Mac & Cheese", price: 2.29, weight: "80 g", grams: 80,
    desc: "Cremige Käse-Makkaroni im Becher. In der Mikrowelle fertig, bevor der Ladebalken durch ist.",
    tags: ["Instant", "Käse"], pack: "cup", label: "MAC ATTACK", sub: "MAC & CHEESE", icon: "noodle",
    colors: ["#f5a800", "#c7141f"], pieces: ["#ffd45a", "#f0a000"], glow: "#ffb400" },

  { id: "mochi-mix", cat: "essen", name: "Mochi-Mix Reiskuchen", price: 4.49, weight: "210 g", grams: 210,
    desc: "Weiche Reiskuchen in drei Geschmacksrichtungen: ein Snack, der aus der Reihe tanzt.",
    tags: ["süß", "weich"], badge: "Neu", pack: "box", label: "MOCHI MIX", sub: "REISKUCHEN", icon: "mochi",
    colors: ["#f48fb1", "#6a2bd9"], pieces: ["#ffb3d1", "#c6a8ff", "#a8f0c6"], glow: "#ff8fd0" },

  /* ---------------- Getränke ---------------- */
  { id: "headshot-energy-zero", cat: "getraenke", name: "Headshot Energy Zero", price: 1.69, weight: "330 ml", ml: 330, pfand: 0.25, note: KOFFEIN,
    desc: "Energy Drink ohne Zucker, mit Koffein und Taurin. Eiskalt serviert zum nächsten Match.",
    tags: ["Energy", "zuckerfrei", "Koffein"], pack: "can", label: "HEADSHOT", sub: "ENERGY ZERO", icon: "bolt",
    colors: ["#12141f", "#27e6ff"], pieces: ["#12141f"], glow: "#27e6ff" },

  { id: "mana-energy-blue", cat: "getraenke", name: "Mana Energy Blue Raspberry", price: 1.69, weight: "330 ml", ml: 330, pfand: 0.25, note: KOFFEIN,
    desc: "Energy Drink mit Blaubeer-Himbeer-Geschmack. Füllt dein Mana wieder auf.",
    tags: ["Energy", "fruchtig", "Koffein"], pack: "can", label: "MANA", sub: "BLUE RASPBERRY", icon: "bolt",
    colors: ["#1b5fd6", "#27e6ff"], pieces: ["#1b5fd6"], glow: "#2f8cff" },

  { id: "rage-energy-cherry", cat: "getraenke", name: "Rage Energy Cherry", price: 1.69, weight: "330 ml", ml: 330, pfand: 0.25, note: KOFFEIN,
    desc: "Energy Drink mit Kirsch-Geschmack. Gegen Ladehemmung und Rage-Quits.",
    tags: ["Energy", "fruchtig", "Koffein"], pack: "can", label: "RAGE", sub: "CHERRY", icon: "bolt",
    colors: ["#c8141f", "#ffd23f"], pieces: ["#c8141f"], glow: "#ff3b30" },

  { id: "lag-free-cola", cat: "getraenke", name: "Lag-Free Cola", price: 1.29, weight: "330 ml", ml: 330, pfand: 0.25,
    desc: "Erfrischende Cola – ohne Verzögerung vom ersten bis zum letzten Schluck.",
    tags: ["Cola", "erfrischend"], pack: "can", label: "LAG-FREE", sub: "COLA", icon: "bolt",
    colors: ["#b3121b", "#ffffff"], pieces: ["#b3121b"], glow: "#ff3b30" },

  { id: "heal-potion-eistee", cat: "getraenke", name: "Heal-Potion Pfirsich-Eistee", price: 1.49, weight: "500 ml", ml: 500, pfand: 0.25,
    desc: "Fruchtiger Eistee mit Pfirsich-Geschmack. Der Heiltrank für Pausen zwischen den Runden.",
    tags: ["Eistee", "fruchtig"], pack: "bottle", label: "HEAL-POTION", sub: "PFIRSICH EISTEE", icon: "heart",
    colors: ["#f0a05a", "#e8485f"], pieces: ["#ff5a7a", "#ff8fa8", "#ff6a86"], glow: "#ffa54a" },

  { id: "stamina-zitrone", cat: "getraenke", name: "Stamina Zitronen-Limo", price: 1.49, weight: "500 ml", ml: 500, pfand: 0.25,
    desc: "Spritzige Limonade mit Zitronen-Geschmack. Frische für Ausdauer-Sessions.",
    tags: ["Limo", "erfrischend"], pack: "bottle", label: "STAMINA", sub: "ZITRONE", icon: "bolt",
    colors: ["#e6dc2a", "#2c9a4a"], pieces: ["#2c9a4a"], glow: "#e6dc2a" },

  { id: "night-shift-latte", cat: "getraenke", name: "Night-Shift Café Latte", price: 1.79, weight: "250 ml", ml: 250, pfand: 0.25, note: KOFFEIN,
    desc: "Kalter Milchkaffee in der Dose. Die Nachtschicht kann kommen.",
    tags: ["Kaffee", "Milch", "Koffein"], pack: "can", label: "NIGHT SHIFT", sub: "CAFÉ LATTE", icon: "bolt",
    colors: ["#5e3f2a", "#f1dcc0"], pieces: ["#5e3f2a"], glow: "#d9b58a" },

  /* ---------------- Spar-Sets & Boxen ---------------- */
  { id: "level-up-starterset", cat: "boxen", name: "Level-Up Starter-Set", price: 12.9, deal: true, colors: ["#27e6ff", "#b6ff3b"], glow: "#27e6ff",
    desc: "Fünf Klassiker im Set – der perfekte Einstieg, wenn du noch nicht weißt, was dein Build braucht.",
    tags: ["Set", "5 Artikel"],
    includes: ["xp-boost-sauergurtel", "crit-hit-cola", "lag-spike-lollis", "power-up-baerchen", "pixel-bites"] },

  { id: "sour-squad-set", cat: "boxen", name: "Sour-Squad Set", price: 10.9, deal: true, colors: ["#b6ff3b", "#ff2fb3"], glow: "#b6ff3b",
    desc: "Fünf saure Sorten für alle, die ohne Grimasse nicht zocken können.",
    tags: ["Set", "sauer"],
    includes: ["xp-boost-sauergurtel", "mana-trank-pulver", "energy-drop-pastillen", "rage-quit-wuermer", "glitch-sauer-cola"] },

  { id: "night-raid-box", cat: "boxen", name: "Night-Raid Snack-Box", price: 18.9, deal: true, colors: ["#ff9a2f", "#d11a14"], glow: "#ff9a2f",
    desc: "Sieben herzhafte und süße Snacks plus eine Cola für die Nacht-Session – von Chips bis Jerky.",
    tags: ["Set", "salzig", "Nacht"], badge: "Tipp",
    includes: ["headshot-paprika-chips", "crit-jerky", "pixel-pop-popcorn", "nacho-nerd-nachos", "brezel-bits", "mana-mix-nuesse", "cheese-crit-cracker", "lag-free-cola"] },

  { id: "ramen-night-set", cat: "boxen", name: "Ramen-Night Set", price: 11.9, deal: true, colors: ["#ff5a1f", "#ffd23f"], glow: "#ff5a1f",
    desc: "Drei Becher Instant-Nudeln, Mac & Cheese, Mochi und ein Eistee: das warme Abendessen für Zocker.",
    tags: ["Set", "Instant"],
    includes: ["ramen-night-beef", "ramen-night-spicy", "mac-attack-cup", "mochi-mix", "ramen-night-beef", "heal-potion-eistee"] },

  { id: "streamer-pack", cat: "boxen", name: "Streamer-Pack Drinks & Bars", price: 13.9, deal: true, colors: ["#27e6ff", "#1b5fd6"], glow: "#27e6ff",
    desc: "Sechs Energy Drinks in drei Sorten und drei Protein-Riegel – für den Stream-Marathon.",
    tags: ["Set", "Energy"],
    includes: ["headshot-energy-zero", "mana-energy-blue", "rage-energy-cherry", "mana-bar-protein", "headshot-energy-zero", "mana-energy-blue", "rage-energy-cherry", "mana-bar-protein", "mana-bar-protein"] },

  { id: "lan-party-box", cat: "boxen", name: "LAN-Party Box", price: 27.9, deal: true, colors: ["#ff2fb3", "#27e6ff"], glow: "#ff2fb3",
    desc: "Zwölf Artikel für den ganzen Abend – genug Snacks für vier Spieler und ein langes Turnier.",
    tags: ["Set", "für 4 Spieler"],
    includes: ["headshot-paprika-chips", "nacho-nerd-nachos", "controller-gummis", "power-up-baerchen", "crit-hit-cola", "xp-boost-sauergurtel",
               "headshot-paprika-chips", "power-up-baerchen", "crit-hit-cola", "xp-boost-sauergurtel", "ranger-tube-chips", "noob-tube-marshmallows"] },

  { id: "loot-box-mystery", cat: "boxen", name: "Loot-Box Mystery Edition", price: 19.9, weight: "ca. 1 kg", deal: true, pack: "loot", colors: ["#6a3df0", "#ff2fb3"], pieces: ["#ffd23f"], glow: "#8b5cff",
    desc: "Die Überraschungsbox: rund ein Dutzend Sorten aus dem Sortiment, jede Box anders. Du weißt nie, was drin ist – das ist der Spaß.",
    tags: ["Überraschung", "Geschenk"] },
];
