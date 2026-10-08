/* ============================================================
   SHOP-KONFIGURATION + PRODUKTE
   Hier änderst du alles Wichtige – der Rest des Shops passt sich an.
   ============================================================ */

window.SHOP = {
  name: "CritCandy",
  tagline: "Gaming Candy für lange Sessions",
  currency: "EUR",

  /* Bestellungen landen per E-Mail bei dir. UNBEDINGT ändern! */
  email: "bestellung@deine-domain.de",

  shipping: { cost: 3.9, freeFrom: 25 },       // Versandkosten / gratis ab (Warenwert nach Rabatt)
  maxPerItem: 20,

  payments: [                                  // Auswahl im Checkout
    "Vorkasse (Überweisung)",
    "PayPal",
  ],

  /* "Mix & Spar": Rabatt auf alle einzelnen Tüten (nicht auf Boxen & Sets).
     Je mehr Tüten im Korb, desto höher der Rabatt. Passe qty/percent nach deiner Kalkulation an! */
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
     {welcomeCode} {welcomePercent} {welcomeMin} {payments} */
  perks: [
    { icon: "🚚", title: "Gratis-Versand ab {freeFrom} €", text: "Darunter nur {shipCost} € Versand. Versand in 1–2 Werktagen." },
    { icon: "🧩", title: "Mix & Spar bis −{maxMix} %",     text: "Stell dir deine Tüten selbst zusammen – je mehr, desto günstiger." },
    { icon: "🎁", title: "Spar-Sets & Loot-Boxen",         text: "Fertige Sets mit bis zu {maxSet} % Ersparnis gegenüber dem Einzelkauf." },
  ],

  faq: [
    { q: "Wie läuft die Bestellung ab?",
      a: "Du legst deine Favoriten in den Warenkorb und schickst die Bestellung ab. Sie erreicht uns per E-Mail, wir bestätigen sie und schicken dir die Zahlungsdetails. Verschickt wird nach Zahlungseingang." },
    { q: "Wie funktioniert Mix & Spar?",
      a: "{mixText} Das gilt für alle einzelnen Tüten – Boxen und Sets sind schon günstiger kalkuliert. Rabattcodes sind nicht kombinierbar, es gilt automatisch der höhere Rabatt." },
    { q: "Was kostet der Versand?",
      a: "{shipCost} € pro Bestellung. Ab {freeFrom} € Warenwert (nach Rabatt) versenden wir kostenlos." },
    { q: "Welche Zahlungsarten gibt es?",
      a: "{payments}." },
    { q: "Wo finde ich Zutaten und Allergene?",
      a: "Zutaten, Allergene und Haltbarkeit stehen auf der Verpackung jedes Produkts." },
  ],
};

/* Kategorien (Reihenfolge = Reihenfolge der Filter-Buttons) */
window.CATEGORIES = [
  { id: "gummis", label: "Gummis" },
  { id: "sauer",  label: "Sauer" },
  { id: "lollis", label: "Lollis" },
  { id: "schoko", label: "Schoko" },
  { id: "boxen",  label: "Boxen & Sets" },
];

/*  Produktfelder
    id       eindeutig, ohne Leerzeichen
    cat      eine der Kategorie-IDs oben
    price    Preis in € (inkl. MwSt.)
    weight   Füllmenge als Text, wird im Shop angezeigt
    grams    Füllmenge in Gramm – daraus entsteht der Grundpreis (€/100 g), den du bei
             Lebensmitteln angeben musst. Bei Sets wird sie automatisch addiert.
    tags     kleine Labels auf der Karte
    badge    optional: "Neu", "Tipp" … (Sets zeigen automatisch ihre Ersparnis)
    art      Motiv der Grafik: bears | belts | bottles | lollis | drops | cubes |
             marshmallows | pastilles | dip | gamepad | hearts | worms | box | crate
    colors   drei Farben für die Grafik (die erste leuchtet hinter der Karte)
    glow     optional: andere Leuchtfarbe, falls colors[0] zu dunkel ist
    includes optional: Liste von Produkt-IDs → macht das Produkt zum Set. Der Shop
             rechnet die Ersparnis gegenüber dem Einzelkauf selbst aus (gleiche ID
             mehrfach = mehrere Tüten).
    deal     true = erscheint oben im Bereich "Spar-Sets & Loot-Boxen"

    ACHTUNG: Namen, Beschreibungen, Tags, Preise und Set-Inhalte sind Platzhalter.
    Zutaten, Allergene, "vegan" usw. musst du für deine echten Produkte
    selbst prüfen und korrekt angeben.                                    */
window.PRODUCTS = [
  { id: "xp-boost-sauergurtel", cat: "sauer", name: "XP-Boost Sauergürtel", price: 2.99, weight: "150 g", grams: 150,
    desc: "Extra saure Fruchtgummi-Gürtel mit Zuckerkruste. Gibt dir den Kick für die nächste Runde.",
    tags: ["sauer", "fruchtig"], badge: "Tipp", art: "belts", colors: ["#ff2fb3", "#b6ff3b", "#27e6ff"] },

  { id: "controller-gummis", cat: "gummis", name: "Player-2 Controller-Gummis", price: 3.49, weight: "180 g", grams: 180,
    desc: "Fruchtgummis in Controller-Form – mit Steuerkreuz und allem Drum und Dran. Zum Zocken und zum Snacken.",
    tags: ["fruchtig", "Controller"], badge: "Neu", art: "gamepad", colors: ["#8b5cff", "#27e6ff", "#ff2fb3"] },

  { id: "crit-hit-cola", cat: "gummis", name: "Crit-Hit Cola-Flaschen", price: 2.49, weight: "200 g", grams: 200,
    desc: "Klassische Cola-Gummiflaschen – kritischer Treffer auf den Geschmacksnerv.",
    tags: ["süß", "cola"], art: "bottles", colors: ["#6b3b1e", "#ffd23f", "#f4f1ff"], glow: "#ff9a2f" },

  { id: "lag-spike-lollis", cat: "lollis", name: "Lag-Spike Brause-Lollis (6er)", price: 3.99, weight: "6 × 12 g", grams: 72,
    desc: "Lollis mit Brause-Kern, der im Mund knistert. Kein Ping, nur Spaß.",
    tags: ["knisternd", "fruchtig"], badge: "Neu", art: "lollis", colors: ["#27e6ff", "#ff2fb3", "#ffd23f"] },

  { id: "extra-leben-herzen", cat: "gummis", name: "Extra-Leben Herz-Gummis", price: 2.49, weight: "150 g", grams: 150,
    desc: "Fruchtige Herzen für den Notfall. Noch ein Leben? Klar, nimm gleich drei.",
    tags: ["süß", "fruchtig"], art: "hearts", colors: ["#ff3b6b", "#ff8fb0", "#ffd23f"] },

  { id: "power-up-baerchen", cat: "gummis", name: "Power-Up Gummibärchen-Mix", price: 2.79, weight: "200 g", grams: 200,
    desc: "Bunter Bären-Mix in fünf Geschmacksrichtungen. Jedes Bärchen ein kleines Power-up.",
    tags: ["süß", "fruchtig", "vegan"], art: "bears", colors: ["#ff4d4d", "#b6ff3b", "#ffd23f"] },

  { id: "rage-quit-wuermer", cat: "sauer", name: "Rage-Quit Sauerwürmer", price: 2.79, weight: "200 g", grams: 200,
    desc: "Saure Gummiwürmer mit Zuckerkruste – damit der Frust nach der Niederlage wenigstens lecker ist.",
    tags: ["sauer", "fruchtig"], art: "worms", colors: ["#b6ff3b", "#ff8a1f", "#ff2fb3"] },

  { id: "boss-fight-chili", cat: "schoko", name: "Boss-Fight Chili-Schoko-Drops", price: 3.99, weight: "120 g", grams: 120,
    desc: "Zartbitter-Drops mit einem Hauch Chili. Süß am Anfang, Endgegner am Ende.",
    tags: ["scharf", "schoko"], badge: "Scharf", art: "drops", colors: ["#7a3b1a", "#ff5a1f", "#ffd23f"], glow: "#ff5a1f" },

  { id: "pixel-bites", cat: "gummis", name: "Pixel-Bites Würfel-Gummis", price: 3.49, weight: "180 g", grams: 180,
    desc: "Würfelförmige Fruchtgummis im Retro-Look – jedes Stück ein kleiner Pixel.",
    tags: ["fruchtig", "vegan"], art: "cubes", colors: ["#8b5cff", "#27e6ff", "#b6ff3b"] },

  { id: "noob-tube-marshmallows", cat: "gummis", name: "Noob-Tube Marshmallows", price: 2.99, weight: "150 g", grams: 150,
    desc: "Fluffig, weich und kinderleicht zu genießen. Auch Anfänger kommen damit klar.",
    tags: ["süß", "weich"], art: "marshmallows", colors: ["#ff8fd0", "#f4f1ff", "#ffe08a"] },

  { id: "energy-drop-pastillen", cat: "sauer", name: "Energy-Drop Sauer-Pastillen", price: 2.49, weight: "90 g", grams: 90,
    desc: "Kleine Pastillen mit großem Sauer-Effekt. Passt in jede Hosentasche und jeden Controller-Bag.",
    tags: ["sauer", "klein"], art: "pastilles", colors: ["#b6ff3b", "#ffd23f", "#ff2fb3"] },

  { id: "mana-trank-pulver", cat: "sauer", name: "Mana-Trank Sauerpulver", price: 1.99, weight: "3 × 10 g", grams: 30,
    desc: "Brausiges Sauerpulver zum Dippen. Füllt dein Mana in drei Sekunden wieder auf.",
    tags: ["sauer", "brausig"], art: "dip", colors: ["#27e6ff", "#8b5cff", "#b6ff3b"] },

  /* ---- Spar-Sets & Boxen ---- */
  { id: "level-up-starterset", cat: "boxen", name: "Level-Up Starter-Set", price: 12.9, deal: true, art: "crate", colors: ["#27e6ff", "#b6ff3b", "#ff2fb3"],
    desc: "Fünf Klassiker im Set – der perfekte Einstieg, wenn du noch nicht weißt, was dein Build braucht.",
    tags: ["Set", "5 Sorten"],
    includes: ["xp-boost-sauergurtel", "crit-hit-cola", "lag-spike-lollis", "power-up-baerchen", "pixel-bites"] },

  { id: "sour-squad-set", cat: "boxen", name: "Sour-Squad Set", price: 8.49, deal: true, art: "crate", colors: ["#b6ff3b", "#ff2fb3", "#ffd23f"],
    desc: "Vier saure Sorten für alle, die ohne Grimasse nicht zocken können.",
    tags: ["Set", "sauer"],
    includes: ["xp-boost-sauergurtel", "mana-trank-pulver", "energy-drop-pastillen", "rage-quit-wuermer"] },

  { id: "lan-party-box", cat: "boxen", name: "LAN-Party Box", price: 21.9, deal: true, art: "crate", colors: ["#ff2fb3", "#27e6ff", "#ffd23f"],
    desc: "Neun Tüten für den ganzen Abend – genug für vier Spieler und ein langes Turnier.",
    tags: ["Set", "für 4 Spieler"], badge: "Tipp",
    includes: ["power-up-baerchen", "power-up-baerchen", "crit-hit-cola", "crit-hit-cola", "xp-boost-sauergurtel", "xp-boost-sauergurtel",
               "noob-tube-marshmallows", "pixel-bites", "controller-gummis"] },

  { id: "loot-box-mystery", cat: "boxen", name: "Loot-Box Mystery Edition", price: 19.9, weight: "ca. 1 kg", deal: true, art: "box", colors: ["#8b5cff", "#ff2fb3", "#ffd23f"],
    desc: "Die Überraschungsbox: rund ein Dutzend Sorten aus dem Sortiment, jede Box anders. Du weißt nie, was drin ist – das ist der Spaß.",
    tags: ["Überraschung", "Geschenk"] },
];
