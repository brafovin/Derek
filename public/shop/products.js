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

  shipping: { cost: 4.9, freeFrom: 30 },       // Versandkosten / ab wann gratis
  maxPerItem: 20,

  payments: [                                  // Auswahl im Checkout
    "Vorkasse (Überweisung)",
    "PayPal",
  ],

  perks: [
    { icon: "🚚", title: "Versand in 1–2 Werktagen", text: "Ab 30 € Bestellwert versandkostenfrei." },
    { icon: "🎮", title: "Von Zockern für Zocker",   text: "Snacks, die zwischen zwei Matches passen." },
    { icon: "🎁", title: "Loot-Box mit Überraschung", text: "Jede Box ist anders – Sammeln erlaubt." },
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
    weight   Füllmenge, wird im Shop angezeigt
    tags     kleine Labels auf der Karte
    badge    optional: "Neu", "Bestseller" …
    art      Motiv der Grafik: bears | belts | bottles | lollis | drops | cubes |
             marshmallows | pastilles | dip | box
    colors   drei Farben für die Grafik (die erste leuchtet hinter der Karte)
    glow     optional: andere Leuchtfarbe, falls colors[0] zu dunkel ist

    ACHTUNG: Namen, Beschreibungen, Tags und Preise sind Platzhalter.
    Zutaten, Allergene, "vegan" usw. musst du für deine echten Produkte
    selbst prüfen und korrekt angeben.                                    */
window.PRODUCTS = [
  { id: "xp-boost-sauergurtel", cat: "sauer", name: "XP-Boost Sauergürtel", price: 3.49, weight: "150 g",
    desc: "Extra saure Fruchtgummi-Gürtel mit Zuckerkruste. Gibt dir den Kick für die nächste Runde.",
    tags: ["sauer", "fruchtig"], badge: "Bestseller", art: "belts", colors: ["#ff2fb3", "#b6ff3b", "#27e6ff"] },

  { id: "crit-hit-cola", cat: "gummis", name: "Crit-Hit Cola-Flaschen", price: 2.99, weight: "200 g",
    desc: "Klassische Cola-Gummiflaschen – kritischer Treffer auf den Geschmacksnerv.",
    tags: ["süß", "cola"], art: "bottles", colors: ["#6b3b1e", "#ffd23f", "#f4f1ff"], glow: "#ff9a2f" },

  { id: "lag-spike-lollis", cat: "lollis", name: "Lag-Spike Brause-Lollis (6er)", price: 4.49, weight: "6 × 12 g",
    desc: "Lollis mit Brause-Kern, der im Mund knistert. Kein Ping, nur Spaß.",
    tags: ["knisternd", "fruchtig"], badge: "Neu", art: "lollis", colors: ["#27e6ff", "#ff2fb3", "#ffd23f"] },

  { id: "power-up-baerchen", cat: "gummis", name: "Power-Up Gummibärchen-Mix", price: 3.29, weight: "200 g",
    desc: "Bunter Bären-Mix in fünf Geschmacksrichtungen. Jedes Bärchen ein kleines Power-up.",
    tags: ["süß", "fruchtig", "vegan"], art: "bears", colors: ["#ff4d4d", "#b6ff3b", "#ffd23f"] },

  { id: "boss-fight-chili", cat: "schoko", name: "Boss-Fight Chili-Schoko-Drops", price: 4.99, weight: "120 g",
    desc: "Zartbitter-Drops mit einem Hauch Chili. Süß am Anfang, Endgegner am Ende.",
    tags: ["scharf", "schoko"], badge: "Scharf", art: "drops", colors: ["#7a3b1a", "#ff5a1f", "#ffd23f"], glow: "#ff5a1f" },

  { id: "pixel-bites", cat: "gummis", name: "Pixel-Bites Würfel-Gummis", price: 4.19, weight: "180 g",
    desc: "Würfelförmige Fruchtgummis im Retro-Look – jedes Stück ein kleiner Pixel.",
    tags: ["fruchtig", "vegan"], art: "cubes", colors: ["#8b5cff", "#27e6ff", "#b6ff3b"] },

  { id: "noob-tube-marshmallows", cat: "gummis", name: "Noob-Tube Marshmallows", price: 3.79, weight: "150 g",
    desc: "Fluffig, weich und kinderleicht zu genießen. Auch Anfänger kommen damit klar.",
    tags: ["süß", "weich"], art: "marshmallows", colors: ["#ff8fd0", "#f4f1ff", "#ffe08a"] },

  { id: "mana-trank-pulver", cat: "sauer", name: "Mana-Trank Sauerpulver", price: 2.49, weight: "3 × 10 g",
    desc: "Brausiges Sauerpulver zum Dippen. Füllt dein Mana in drei Sekunden wieder auf.",
    tags: ["sauer", "brausig"], art: "dip", colors: ["#27e6ff", "#8b5cff", "#b6ff3b"] },

  { id: "energy-drop-pastillen", cat: "sauer", name: "Energy-Drop Sauer-Pastillen", price: 2.99, weight: "90 g",
    desc: "Kleine Pastillen mit großem Sauer-Effekt. Passt in jede Hosentasche und jeden Controller-Bag.",
    tags: ["sauer", "klein"], art: "pastilles", colors: ["#b6ff3b", "#ffd23f", "#ff2fb3"] },

  { id: "loot-box-mystery", cat: "boxen", name: "Loot-Box Mystery Edition", price: 24.9, weight: "ca. 1 kg",
    desc: "Die Überraschungsbox: rund ein Dutzend Sorten aus dem Sortiment, jede Box anders. Selten gibt es ein legendäres Extra.",
    tags: ["Überraschung", "Geschenk"], badge: "Bestseller", art: "box", colors: ["#8b5cff", "#ff2fb3", "#ffd23f"] },

  { id: "level-up-starterset", cat: "boxen", name: "Level-Up Starter-Set", price: 14.9, weight: "ca. 500 g",
    desc: "Fünf Klassiker im Set – der perfekte Einstieg, wenn du noch nicht weißt, was dein Build braucht.",
    tags: ["Set", "Geschenk"], art: "box", colors: ["#27e6ff", "#b6ff3b", "#ff2fb3"] },
];
