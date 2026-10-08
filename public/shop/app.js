(() => {
"use strict";

const S = window.SHOP, PRODUCTS = window.PRODUCTS, CATS = window.CATEGORIES;
const W = S.welcome || null;
const TIERS = (S.mix && S.mix.tiers) || [];
const $ = (s, r = document) => r.querySelector(s);
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: S.currency });
const money = c => eur.format(c / 100);
const cents = p => Math.round(p.price * 100);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pct = n => `−${n} %`;
const bag = n => n === 1 ? "Tüte" : "Tüten";

const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
for (const p of PRODUCTS) if (p.includes) p.includes = p.includes.filter(id => byId[id] && id !== p.id);
const glow = p => esc(p.glow || p.colors[0]);

/* ---------- Produkt-Rechnungen (Sets, Ersparnis, Grundpreis) ---------- */
const isSet = p => Array.isArray(p.includes) && p.includes.length > 0;
const eligible = p => !isSet(p) && p.cat !== "boxen";               // zählt für Mix & Spar
const comps = p => { const m = new Map(); for (const id of p.includes || []) m.set(id, (m.get(id) || 0) + 1); return m; };
const grams = p => p.grams ?? (isSet(p) ? p.includes.reduce((s, id) => s + (byId[id].grams || 0), 0) : 0);
const single = p => isSet(p) ? p.includes.reduce((s, id) => s + cents(byId[id]), 0) : 0;
const saved = p => Math.max(0, single(p) - cents(p));
const savedPct = p => single(p) ? Math.round(saved(p) / single(p) * 100) : 0;
const weightLabel = p => p.weight || (isSet(p) && grams(p) ? `ca. ${grams(p)} g · ${p.includes.length} ${bag(p.includes.length)}` : "");
const basePrice = p => grams(p) ? `${eur.format(p.price / grams(p) * 100)} / 100 g` : "";
const insideText = p => [...comps(p)].map(([id, n]) => `${n > 1 ? n + "× " : ""}${byId[id].name}`).join(" · ");

/* Platzhalter in Texten aus der Konfiguration füllen */
const mixText = TIERS.map(t => `ab ${t.qty} Tüten ${t.percent} %`).join(", ");
const maxMix = TIERS.length ? TIERS[TIERS.length - 1].percent : 0;
const maxSet = Math.max(0, ...PRODUCTS.filter(isSet).map(savedPct));
const fill = t => String(t)
  .replace("{freeFrom}", String(S.shipping.freeFrom).replace(".", ","))
  .replace("{shipCost}", S.shipping.cost.toFixed(2).replace(".", ","))
  .replace("{maxMix}", maxMix).replace("{maxSet}", maxSet)
  .replace("{mixText}", mixText ? `Rabatt: ${mixText}.` : "")
  .replace("{welcomeCode}", W ? W.code : "").replace("{welcomePercent}", W ? W.percent : "").replace("{welcomeMin}", W ? W.minOrder : "")
  .replace("{payments}", S.payments.join(" oder "));

/* ============================================================
   Grafiken – alle Motive sind als SVG gezeichnet (keine Bilddateien nötig)
   ============================================================ */
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
const star = (x, y, s, col) => `<path transform="translate(${x} ${y}) scale(${s})" fill="${col}" d="M0-9 2.5-2.5 9 0 2.5 2.5 0 9-2.5 2.5-9 0-2.5-2.5z"/>`;

function cube(x, y, s, col) {
  const h = s * .58, d = s * 1.1;
  const top = `${x},${y - h} ${x + s},${y} ${x},${y + h} ${x - s},${y}`;
  const left = `${x - s},${y} ${x},${y + h} ${x},${y + h + d} ${x - s},${y + d}`;
  const right = `${x + s},${y} ${x},${y + h} ${x},${y + h + d} ${x + s},${y + d}`;
  return `<polygon points="${top}" fill="${col}"/><polygon points="${top}" fill="#fff" opacity=".22"/>` +
    `<polygon points="${left}" fill="${col}"/><polygon points="${left}" fill="#000" opacity=".2"/>` +
    `<polygon points="${right}" fill="${col}"/><polygon points="${right}" fill="#000" opacity=".4"/>`;
}

const ART = {
  bears(a, b, c) {
    const bear = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${col}">
      <circle cx="-20" cy="-50" r="11"/><circle cx="20" cy="-50" r="11"/><circle cx="0" cy="-34" r="26"/>
      <ellipse cx="0" cy="10" rx="29" ry="34"/>
      <ellipse cx="-34" cy="2" rx="9" ry="17" transform="rotate(28 -34 2)"/><ellipse cx="34" cy="2" rx="9" ry="17" transform="rotate(-28 34 2)"/>
      <ellipse cx="-16" cy="44" rx="13" ry="15"/><ellipse cx="16" cy="44" rx="13" ry="15"/>
      <ellipse cx="-10" cy="0" rx="7" ry="16" fill="#fff" opacity=".3"/>
      <circle cx="-9" cy="-37" r="3.4" fill="#2a1030"/><circle cx="9" cy="-37" r="3.4" fill="#2a1030"/>
      <path d="M-7-26q7 7 14 0" stroke="#2a1030" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;
    return bear(46, 92, .72, a) + bear(154, 92, .72, c) + bear(100, 86, 1, b);
  },

  belts(a, b, c) {
    const belt = (y, col, seed) => {
      let dots = "";
      for (let i = 0; i < 46; i++) dots += `<circle cx="${-78 + rnd(i + seed) * 156}" cy="${-9 + rnd(i * 3 + seed) * 18}" r="1.2" fill="#fff" opacity=".8"/>`;
      return `<g transform="translate(100 ${y}) rotate(-13)"><rect x="-84" y="-12" width="168" height="24" rx="12" fill="${col}"/>
        <rect x="-76" y="-9" width="152" height="5" rx="2.5" fill="#fff" opacity=".28"/>${dots}</g>`;
    };
    return belt(44, a, 1) + belt(82, b, 50) + belt(120, c, 99);
  },

  bottles(a, b, c) {
    const bottle = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M-7-46h14v12c0 8 15 12 15 26v38c0 9-8 14-22 14s-22-5-22-14v-38c0-14 15-18 15-26z" fill="${a}"/>
      <rect x="-9" y="-51" width="18" height="9" rx="3" fill="${c}"/>
      <rect x="-22" y="-2" width="44" height="24" fill="${b}"/>
      <ellipse cx="-12" cy="10" rx="3.2" ry="16" fill="#fff" opacity=".28"/></g>`;
    return bottle(52, 92, -14) + bottle(148, 92, 14) + bottle(100, 88, 0);
  },

  lollis(a, b, c) {
    const lolli = (x, y, rot, col) => `<g transform="translate(${x} ${y}) rotate(${rot})">
      <rect x="-3" y="12" width="6" height="68" rx="3" fill="#f4f1ff" opacity=".92"/>
      <circle r="30" fill="${col}"/>
      <path d="M0-22a22 22 0 1 1-22 22 16 16 0 0 1 16-16 10 10 0 0 1 10 10 5 5 0 0 1-5 5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="-14" cy="-16" rx="8" ry="4.5" fill="#fff" opacity=".4" transform="rotate(-35 -14 -16)"/></g>`;
    return lolli(48, 62, -16, a) + lolli(152, 62, 16, c) + lolli(100, 54, 0, b);
  },

  drops(a, b, c) {
    const disc = (x, y, col) => `<circle cx="${x}" cy="${y}" r="24" fill="${col}"/><circle cx="${x}" cy="${y}" r="24" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="3"/>
      <ellipse cx="${x - 8}" cy="${y - 10}" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 ${x - 8} ${y - 10})"/>`;
    const cols = [b, a, c, a, b, c];
    return [[56, 112], [100, 112], [144, 112], [78, 76], [122, 76], [100, 42]].map(([x, y], i) => disc(x, y, cols[i])).join("");
  },

  cubes(a, b, c) {
    return cube(100, 46, 32, b) + cube(68, 64, 32, a) + cube(132, 64, 32, c) + cube(100, 84, 32, b);
  },

  marshmallows(a, b, c) {
    const m = (x, y, col) => `<g transform="translate(${x} ${y})"><rect x="-22" y="-22" width="44" height="46" rx="16" fill="${col}"/>
      <rect x="-22" y="-2" width="44" height="5" fill="#000" opacity=".07"/>
      <ellipse cx="-11" cy="-8" rx="4" ry="9" fill="#fff" opacity=".55"/></g>`;
    return m(56, 110, a) + m(100, 110, b) + m(144, 110, a) + m(78, 66, b) + m(122, 66, c);
  },

  pastilles(a, b, c) {
    const coin = (x, y, col) => `<rect x="${x - 30}" y="${y}" width="60" height="10" fill="${col}"/><ellipse cx="${x}" cy="${y + 10}" rx="30" ry="10" fill="${col}"/>
      <rect x="${x - 30}" y="${y}" width="60" height="10" fill="#000" opacity=".22"/><ellipse cx="${x}" cy="${y + 10}" rx="30" ry="10" fill="#000" opacity=".22"/>
      <ellipse cx="${x}" cy="${y}" rx="30" ry="10" fill="${col}"/><ellipse cx="${x}" cy="${y}" rx="21" ry="6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
    const cols = [a, b, c, a];
    let out = "";
    for (let i = 0; i < 4; i++) out += coin(64, 110 - i * 13, cols[i]);
    for (let i = 0; i < 3; i++) out += coin(138, 120 - i * 13, cols[(i + 2) % 4]);
    return out;
  },

  dip(a, b, c) {
    const sachet = (x, y, rot, col, band) => `<g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M-26-46l6.5-7 6.5 7 6.5-7 6.5 7 6.5-7 6.5 7 6.5-7 6.5 7V48a6 6 0 0 1-6 6H-20a6 6 0 0 1-6-6z" fill="${col}"/>
      <rect x="-26" y="-14" width="52" height="34" fill="${band}"/>
      <path d="M0-10l3.2 6.8 7.4.9-5.5 5 1.5 7.3L0 6.2l-6.6 3.8 1.5-7.3-5.5-5 7.4-.9z" fill="#fff"/>
      <rect x="-21" y="-44" width="5" height="90" rx="2.5" fill="#fff" opacity=".22"/></g>`;
    let sprinkles = "";
    for (let i = 0; i < 26; i++) sprinkles += `<circle cx="${12 + rnd(i + 7) * 176}" cy="${14 + rnd(i * 5 + 3) * 132}" r="${1.6 + rnd(i) * 1.8}" fill="${[a, b, c][i % 3]}" opacity=".85"/>`;
    return sprinkles + sachet(56, 86, -12, a, b) + sachet(144, 86, 12, c, b) + sachet(100, 82, 0, b, a);
  },

  gamepad(a, b, c) {
    const pad = (x, y, s, rot, col, key) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <path d="M-62-22C-62-38-48-42-34-42H34C48-42 62-38 62-22L72 28C75 46 58 54 46 42L30 22H-30L-46 42C-58 54-75 46-72 28Z" fill="${col}"/>
      <path d="M-56-26C-54-36-44-38-34-38H34C44-38 54-36 56-26" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="4" stroke-linecap="round"/>
      <rect x="-46" y="-20" width="8" height="26" rx="2" fill="#fff" fill-opacity=".92"/><rect x="-55" y="-11" width="26" height="8" rx="2" fill="#fff" fill-opacity=".92"/>
      <circle cx="40" cy="-19" r="6" fill="${key}"/><circle cx="53" cy="-8" r="6" fill="#fff" fill-opacity=".92"/><circle cx="40" cy="3" r="6" fill="${key}"/><circle cx="27" cy="-8" r="6" fill="#fff" fill-opacity=".92"/>
      <circle cx="-14" cy="12" r="9" fill="#000" fill-opacity=".28"/><circle cx="14" cy="12" r="9" fill="#000" fill-opacity=".28"/>
      <circle cx="-14" cy="12" r="5" fill="#fff" fill-opacity=".5"/><circle cx="14" cy="12" r="5" fill="#fff" fill-opacity=".5"/></g>`;
    return pad(44, 74, .55, -16, b, a) + pad(156, 74, .55, 16, c, a) + pad(100, 86, 1, 0, a, c);
  },

  hearts(a, b, c) {
    const heart = (x, y, s, rot, col) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <path d="M0 32C-44 6-42-32-18-34-8-34 0-26 0-20 0-26 8-34 18-34 42-32 44 6 0 32Z" fill="${col}"/>
      <ellipse cx="-17" cy="-17" rx="8" ry="5" fill="#fff" opacity=".45" transform="rotate(-35 -17 -17)"/></g>`;
    return heart(46, 98, .8, -14, c) + heart(154, 98, .8, 14, b) + heart(100, 84, 1.25, 0, a) + star(32, 40, 1.2, b) + star(170, 44, 1.4, c);
  },

  worms(a, b, c) {
    const worm = (y, rot, col, seed) => {
      let dots = "";
      for (let i = 0; i < 34; i++) {
        const x = -62 + rnd(i + seed) * 124;
        dots += `<circle cx="${x}" cy="${-12 * Math.sin((x + 70) * Math.PI / 35) + (rnd(i * 3 + seed) - .5) * 9}" r="1.3" fill="#fff" opacity=".8"/>`;
      }
      return `<g transform="translate(100 ${y}) rotate(${rot})">
        <path d="M-70 0q17.5-24 35 0t35 0 35 0 35 0" fill="none" stroke="${col}" stroke-width="17" stroke-linecap="round"/>
        <path d="M-70-4q17.5-24 35 0t35 0 35 0 35 0" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="4" stroke-linecap="round"/>
        ${dots}<circle cx="-67" cy="-4" r="3.4" fill="#fff"/><circle cx="-66" cy="-4" r="1.6" fill="#2a1030"/></g>`;
    };
    return worm(40, -6, a, 1) + worm(82, 4, b, 40) + worm(124, -3, c, 80);
  },

  box(a, b, c) {
    const x = 100, y = 58, s = 44, h = s * .58, d = s * 1.1;
    const lid = `${x},${y - h * .55} ${x + s * .55},${y} ${x},${y + h * .55} ${x - s * .55},${y}`;
    return cube(x, y, s, a) + `<polygon points="${lid}" fill="${b}" opacity=".9"/>` +
      `<text transform="translate(${x - s / 2} ${y + h / 2 + d / 2 + 2}) skewY(30)" text-anchor="middle" dominant-baseline="central" font-size="44" font-weight="900" fill="${c}" stroke="#000" stroke-opacity=".25" stroke-width="2" font-family="Segoe UI,Arial,sans-serif">?</text>` +
      `<text transform="translate(${x + s / 2} ${y + h / 2 + d / 2 + 2}) skewY(-30)" text-anchor="middle" dominant-baseline="central" font-size="44" font-weight="900" fill="${c}" fill-opacity=".8" font-family="Segoe UI,Arial,sans-serif">?</text>` +
      star(30, 40, 1.3, c) + star(172, 52, 1.7, b) + star(164, 128, 1.1, c) + star(36, 118, 1.5, b);
  },

  crate(a, b, c) {
    const x = 100, y = 58, s = 44, h = s * .58, d = s * 1.1;
    const lid = `${x},${y - h * .55} ${x + s * .55},${y} ${x},${y + h * .55} ${x - s * .55},${y}`;
    const face = (fx, skew, op) => `<g transform="translate(${fx} ${y + h / 2 + d / 2 + 2}) skewY(${skew})"><g transform="scale(1.75)">${star(0, 0, 1, c).replace("<path", `<path fill-opacity="${op}"`)}</g></g>`;
    return cube(x, y, s, a) + `<polygon points="${lid}" fill="${b}" opacity=".9"/>` + face(x - s / 2, 30, 1) + face(x + s / 2, -30, .8) +
      star(30, 42, 1.3, b) + star(172, 56, 1.6, c) + star(166, 126, 1.1, b) + star(34, 120, 1.5, c);
  },
};

function art(p) {
  const draw = ART[p.art] || ART.box;
  return `<svg viewBox="0 0 200 160" role="img" aria-label="${esc(p.name)}">${draw(...p.colors)}</svg>`;
}

/* ============================================================
   Konfetti
   ============================================================ */
const fx = $("#fx"), fxc = fx.getContext("2d");
let bits = [], raf = 0;
function burst(x, y, n = 30) {
  if (reduceMotion) return;
  const cols = ["#ff2fb3", "#27e6ff", "#b6ff3b", "#ffd23f", "#8b5cff"];
  const dpr = window.devicePixelRatio || 1;
  fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
  fxc.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7;
    bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 5 + Math.random() * 5, h: 3 + Math.random() * 4,
      c: cols[i % cols.length], life: 1, rot: Math.random() * 6, vr: (Math.random() - .5) * .5 });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  fxc.clearRect(0, 0, innerWidth, innerHeight);
  bits = bits.filter(b => b.life > 0 && b.y < innerHeight + 20);
  for (const b of bits) {
    b.vy += .32; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life -= .014;
    fxc.save(); fxc.globalAlpha = Math.max(0, Math.min(1, b.life * 1.6));
    fxc.translate(b.x, b.y); fxc.rotate(b.rot); fxc.fillStyle = b.c; fxc.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); fxc.restore();
  }
  raf = bits.length ? requestAnimationFrame(tick) : 0;
  if (!raf) fxc.clearRect(0, 0, innerWidth, innerHeight);
}

/* ============================================================
   Warenkorb, Rabatte, Gutschein
   ============================================================ */
const KEY = "critcandy-cart-v1", CKEY = "critcandy-coupon-v1";
let cart = loadCart();
let coupon = loadCoupon();

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}"), out = {};
    for (const [id, q] of Object.entries(raw)) if (byId[id] && Number.isInteger(q) && q > 0) out[id] = Math.min(q, S.maxPerItem);
    return out;
  } catch { return {}; }
}
function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* privater Modus o. Ä. */ } }
function loadCoupon() { try { return W && localStorage.getItem(CKEY) === W.code ? W.code : ""; } catch { return ""; } }
function saveCoupon() { try { coupon ? localStorage.setItem(CKEY, coupon) : localStorage.removeItem(CKEY); } catch { /* egal */ } }

function pricing() {
  let sub = 0, n = 0, eligSub = 0, eligQty = 0;
  for (const [id, q] of Object.entries(cart)) {
    const p = byId[id], c = cents(p) * q;
    sub += c; n += q;
    if (eligible(p)) { eligSub += c; eligQty += q; }
  }
  let tier = null;
  for (const t of TIERS) if (eligQty >= t.qty) tier = t;
  const mixDisc = tier ? Math.round(eligSub * tier.percent / 100) : 0;
  const couponDisc = W && coupon && sub >= W.minOrder * 100 ? Math.round(sub * W.percent / 100) : 0;
  let discount = 0, label = "";
  if (couponDisc > mixDisc) { discount = couponDisc; label = `Code ${coupon} (${pct(W.percent)})`; }
  else if (mixDisc > 0) { discount = mixDisc; label = `Mix & Spar (${pct(tier.percent)})`; }
  const net = sub - discount;
  const free = n > 0 && net >= S.shipping.freeFrom * 100;
  const ship = n === 0 || free ? 0 : Math.round(S.shipping.cost * 100);
  return { sub, n, eligQty, tier, mixDisc, couponDisc, discount, label, net, free, ship, total: net + ship };
}

function setQty(id, q) {
  const before = pricing().tier ? pricing().tier.percent : 0;
  q = Math.max(0, Math.min(S.maxPerItem, q));
  if (q === 0) delete cart[id]; else cart[id] = q;
  saveCart(); renderCart();
  const after = pricing().tier ? pricing().tier.percent : 0;
  if (after > before) {
    toast(`LEVEL UP! Mix & Spar ${pct(after)} aktiv`);
    burst(innerWidth / 2, innerHeight * .3, 90);
    return true;
  }
  return false;
}
function add(id, q = 1) {
  const leveled = setQty(id, (cart[id] || 0) + q);
  const badge = $("#cartCount");
  badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
  if (!leveled) toast(`„${byId[id].name}“ liegt im Warenkorb`);
}

function tryCoupon(input) {
  if (!W || String(input).trim().toUpperCase() !== W.code.toUpperCase()) return false;
  coupon = W.code; saveCoupon(); renderCart(); renderLoot();
  return true;
}

function levelHtml(pr) {
  const max = TIERS[TIERS.length - 1].qty, q = pr.eligQty, next = TIERS.find(t => q < t.qty);
  let msg;
  if (!next) msg = `Max-Level erreicht: <strong>${pct(TIERS[TIERS.length - 1].percent)}</strong> auf alle Tüten`;
  else if (!q) msg = `Leg <strong>${next.qty} Tüten</strong> in den Korb und spar <strong>${next.percent} %</strong>`;
  else msg = `Noch <strong>${next.qty - q} ${bag(next.qty - q)}</strong> bis <strong>${pct(next.percent)}</strong>`;
  const pips = TIERS.map(t => `<span class="pip${q >= t.qty ? " on" : ""}" style="left:${t.qty / max * 100}%"><b>${t.qty}</b><em>${pct(t.percent)}</em></span>`).join("");
  return `<div class="level">
    <div class="level-head"><strong>🧩 Mix &amp; Spar</strong><span>${q} ${bag(q)}</span></div>
    <div class="level-track"><i style="width:${Math.min(100, q / max * 100)}%"></i>${pips}</div>
    <p class="level-msg">${msg}</p></div>`;
}

function couponHtml(pr) {
  if (!W) return "";
  if (coupon) {
    let note = "";
    if (pr.sub < W.minOrder * 100) note = `Der Code gilt ab ${W.minOrder} € Bestellwert.`;
    else if (pr.mixDisc >= pr.couponDisc && pr.mixDisc > 0) note = "Dein Mix-Rabatt ist höher – er wird angewendet.";
    return `<div class="coupon on"><span>✓ Code <strong>${esc(coupon)}</strong> aktiv</span><button class="remove" type="button" data-act="uncoupon">entfernen</button></div>${note ? `<p class="coupon-note">${note}</p>` : ""}`;
  }
  return `<form class="coupon" data-coupon-form><input name="code" aria-label="Gutscheincode" placeholder="Gutscheincode" autocomplete="off" maxlength="30"><button class="btn btn-ghost btn-sm" type="submit">Einlösen</button></form>`;
}

function renderCart() {
  const pr = pricing();
  $("#cartCount").textContent = pr.n;
  const lines = $("#cartLines"), foot = $("#cartFoot");
  if (!pr.n) {
    lines.innerHTML = `<div class="drawer-empty"><div class="big">🎮</div><p>Dein Warenkorb ist leer.<br>Zeit für Loot!</p></div>`;
    foot.innerHTML = `<button class="btn btn-ghost btn-block" type="button" data-act="shop">Weiter stöbern</button>`;
    renderBar();
    return;
  }
  lines.innerHTML = Object.entries(cart).map(([id, q]) => {
    const p = byId[id];
    return `<div class="line" data-id="${esc(id)}" style="--glow:${glow(p)}">
      <div class="thumb">${art(p)}</div>
      <div><h3>${esc(p.name)}</h3><div class="sub">${esc(weightLabel(p))} · ${eur.format(p.price)}</div>
        <div class="qty"><button type="button" data-act="dec" aria-label="Eine weniger">−</button><span>${q}</span><button type="button" data-act="inc" aria-label="Eine mehr">+</button></div><br>
        <button class="remove" type="button" data-act="del">Entfernen</button></div>
      <div class="sum">${money(cents(p) * q)}</div></div>`;
  }).join("");
  const missing = S.shipping.freeFrom * 100 - pr.net;
  foot.innerHTML = `
    ${TIERS.length ? levelHtml(pr) : ""}
    <div class="ship">
      <p class="ship-note">${pr.free ? "🚚 Versand ist kostenlos!" : `🚚 Noch <strong>${money(missing)}</strong> bis zum Gratis-Versand`}</p>
      <div class="ship-bar"><i style="width:${Math.min(100, pr.net / S.shipping.freeFrom)}%"></i></div>
    </div>
    <div class="row"><span class="muted">Zwischensumme</span><span>${money(pr.sub)}</span></div>
    ${pr.discount ? `<div class="row disc"><span>${esc(pr.label)}</span><span>−${money(pr.discount)}</span></div>` : ""}
    <div class="row"><span class="muted">Versand</span><span>${pr.ship ? money(pr.ship) : "kostenlos"}</span></div>
    <div class="row total"><span>Gesamt</span><span>${money(pr.total)}</span></div>
    ${couponHtml(pr)}
    <button class="btn btn-primary btn-block" type="button" data-act="checkout">Zur Kasse</button>`;
  renderBar();
}

function renderBar() {
  const pr = pricing(), show = pr.n > 0 && !drawer.classList.contains("open");
  $("#cartBar").hidden = !show;
  document.body.classList.toggle("has-bar", show);
  if (show) $("#cartBarText").innerHTML = `<strong>${pr.n} Artikel</strong><span>${money(pr.total)}</span>`;
}

/* ============================================================
   Katalog
   ============================================================ */
let cat = "alle", query = "", sort = "featured";

function renderChips() {
  const all = [{ id: "alle", label: "Alle" }, ...CATS];
  $("#chips").innerHTML = all.map(c =>
    `<button class="chip" type="button" data-cat="${esc(c.id)}" aria-pressed="${c.id === cat}">${esc(c.label)}</button>`).join("");
}

function card(p) {
  const sv = saved(p), gp = basePrice(p);
  const badge = sv ? `<span class="badge save">${pct(savedPct(p))}</span>` : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
  return `
    <article class="card${p.deal ? " deal" : ""}" style="--glow:${glow(p)}">
      <button class="media" type="button" data-open="${esc(p.id)}" aria-label="Details zu ${esc(p.name)}" tabindex="-1">${badge}${art(p)}</button>
      <div class="card-body">
        <h3><button type="button" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
        <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <p class="desc">${esc(p.desc)}</p>
        ${isSet(p) ? `<p class="inside"><strong>Enthält:</strong> ${esc(insideText(p))}</p>` : ""}
        <div class="buy">
          <div class="price">${eur.format(p.price)}${sv ? `<s class="was" title="Summe der Einzelpreise">${money(single(p))}</s>` : ""}
            <span class="unit">${esc(weightLabel(p))}${gp ? ` · ${gp}` : ""}</span></div>
          <button class="add" type="button" data-add="${esc(p.id)}" aria-label="${esc(p.name)} in den Warenkorb">In den Korb</button>
        </div>
        ${sv ? `<p class="save-note">Du sparst ${money(sv)} gegenüber dem Einzelkauf</p>` : ""}
      </div>
    </article>`;
}

function renderGrid() {
  let list = PRODUCTS.filter(p => (cat === "alle" || p.cat === cat) &&
    (!query || `${p.name} ${p.desc} ${p.tags.join(" ")}`.toLowerCase().includes(query)));
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "de"));
  $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "Produkt" : "Produkte"}`;
  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list.map(card).join("");
}

/* ============================================================
   Produktdetail
   ============================================================ */
const detail = $("#detail");

function suggest(p) {
  const pool = PRODUCTS.filter(x => x.id !== p.id && eligible(x)), out = [], seen = new Set([p.cat]);
  for (const x of pool) if (!seen.has(x.cat)) { out.push(x); seen.add(x.cat); }
  for (const x of pool) if (out.length < 3 && !out.includes(x)) out.push(x);
  return out.slice(0, 3);
}

function openDetail(id) {
  const p = byId[id]; if (!p) return;
  let qty = 1;
  const sv = saved(p), gp = basePrice(p);
  const badge = sv ? `<span class="badge save">${pct(savedPct(p))}</span>` : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
  $("#detailBody").innerHTML = `
    <div class="media" style="--glow:${glow(p)}">${badge}${art(p)}</div>
    <div class="detail-info">
      <h2 id="detailName">${esc(p.name)}</h2>
      <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <p class="desc">${esc(p.desc)}</p>
      ${isSet(p) ? `<ul class="inside-list">${[...comps(p)].map(([cid, n]) => `<li><span>${n}× ${esc(byId[cid].name)}</span><em>${esc(byId[cid].weight)}</em></li>`).join("")}</ul>` : ""}
      <p class="meta">Inhalt: ${esc(weightLabel(p))}${gp ? ` · ${gp}` : ""}</p>
      <div class="price">${eur.format(p.price)}${sv ? `<s class="was">${money(single(p))}</s>` : ""}<span class="unit">inkl. MwSt., zzgl. Versand</span></div>
      ${sv ? `<p class="save-note">Du sparst ${money(sv)} (${pct(savedPct(p))}) gegenüber dem Einzelkauf</p>` : ""}
      ${eligible(p) && TIERS.length ? `<p class="save-note">🧩 Ab ${TIERS[0].qty} Tüten im Korb gibt’s Mix-Rabatt – bis ${pct(maxMix)}.</p>` : ""}
      <div class="qty-row">
        <div class="qty"><button type="button" data-dq="-1" aria-label="Eine weniger">−</button><span id="dq">1</span><button type="button" data-dq="1" aria-label="Eine mehr">+</button></div>
        <button class="btn btn-lime" type="button" id="dAdd">In den Warenkorb</button>
      </div>
    </div>
    <div class="xsell">
      <h3>Passt gut dazu</h3>
      <div class="xsell-list">${suggest(p).map(x => `
        <div class="x" style="--glow:${glow(x)}">
          <div class="thumb">${art(x)}</div>
          <div class="x-info"><strong>${esc(x.name)}</strong><span>${eur.format(x.price)}</span></div>
          <button class="add sm" type="button" data-xadd="${esc(x.id)}" aria-label="${esc(x.name)} in den Warenkorb">+</button>
        </div>`).join("")}</div>
    </div>`;
  $("#detailBody").onclick = e => {
    const dq = e.target.closest("[data-dq]"), xa = e.target.closest("[data-xadd]"), da = e.target.closest("#dAdd");
    if (dq) { qty = Math.max(1, Math.min(S.maxPerItem, qty + Number(dq.dataset.dq))); $("#dq").textContent = qty; }
    if (xa) { const r = xa.getBoundingClientRect(); add(xa.dataset.xadd); burst(r.left + r.width / 2, r.top, 14); }
    if (da) { const r = da.getBoundingClientRect(); detail.close(); add(id, qty); burst(r.left + r.width / 2, r.top, 28); }
  };
  detail.showModal();
}

/* ============================================================
   Checkout – schickt die Bestellung als vorbereitete E-Mail
   ============================================================ */
const checkout = $("#checkout");
const demoMode = /deine-domain|example\./i.test(S.email);

function openCheckout() {
  const pr = pricing(); if (!pr.n) return;
  closeDrawer(false);
  $("#checkoutBody").innerHTML = `
    <h2 id="checkoutTitle">Zur Kasse</h2>
    <p class="lead-s">Deine Bestellung geht als E-Mail an uns – danach erhältst du die Zahlungsdetails. Du zahlst erst, wenn du sie bekommen hast.</p>
    ${demoMode ? `<div class="notice"><strong>Demo-Modus:</strong> Trag in <code>products.js</code> deine echte E-Mail-Adresse ein, damit Bestellungen bei dir ankommen.</div>` : ""}
    <div class="summary">
      <div class="row"><span>Artikel (${pr.n})</span><span>${money(pr.sub)}</span></div>
      ${pr.discount ? `<div class="row disc"><span>${esc(pr.label)}</span><span>−${money(pr.discount)}</span></div>` : ""}
      <div class="row"><span>Versand</span><span>${pr.ship ? money(pr.ship) : "kostenlos"}</span></div>
      <div class="row total"><span>Gesamt</span><span>${money(pr.total)}</span></div>
    </div>
    <form class="form" id="orderForm" autocomplete="on">
      <label class="full">Name<input name="name" required autocomplete="name" maxlength="80"></label>
      <label class="full">E-Mail<input name="email" type="email" required autocomplete="email" maxlength="120"></label>
      <label class="full">Straße und Hausnummer<input name="street" required autocomplete="street-address" maxlength="100"></label>
      <label>PLZ<input name="zip" required inputmode="numeric" pattern="[0-9]{4,5}" autocomplete="postal-code" maxlength="5"></label>
      <label>Ort<input name="city" required autocomplete="address-level2" maxlength="60"></label>
      <label>Land<select name="country" autocomplete="country-name"><option>Deutschland</option></select></label>
      <label>Zahlungsart<select name="pay">${S.payments.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
      <label class="full">Anmerkung (optional)<textarea name="note" maxlength="400"></textarea></label>
      <label class="full check"><input type="checkbox" name="agree" required><span>Ich habe die <a href="agb.html" target="_blank" rel="noopener">AGB &amp; Widerrufsbelehrung</a> und die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und akzeptiert.</span></label>
      <button class="btn btn-primary btn-block full" type="submit">Bestellung vorbereiten</button>
    </form>`;
  $("#orderForm").addEventListener("submit", submitOrder);
  checkout.showModal();
}

function orderId() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${S.name.slice(0, 2).toUpperCase()}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function submitOrder(e) {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const pr = pricing(), id = orderId();
  const items = Object.entries(cart).flatMap(([pid, q]) => {
    const p = byId[pid], l = [`${q} × ${p.name} (${weightLabel(p)}) – ${money(cents(p) * q)}`];
    if (isSet(p)) l.push(`   Inhalt: ${insideText(p)}`);
    return l;
  });
  const body = [
    `Neue Bestellung bei ${S.name}`, `Bestellnummer: ${id}`, "",
    "Artikel:", ...items, "",
    `Zwischensumme: ${money(pr.sub)}`,
    ...(pr.discount ? [`Rabatt – ${pr.label}: −${money(pr.discount)}`] : []),
    `Versand: ${pr.ship ? money(pr.ship) : "kostenlos"}`, `Gesamt: ${money(pr.total)}`, "",
    "Lieferadresse:", f.name, f.street, `${f.zip} ${f.city}`, f.country, "",
    `E-Mail: ${f.email}`, `Zahlungsart: ${f.pay}`, ...(f.note ? ["", `Anmerkung: ${f.note}`] : []),
  ].join("\n");
  const href = `mailto:${S.email}?subject=${encodeURIComponent(`Bestellung ${id}`)}&body=${encodeURIComponent(body)}`;

  $("#checkoutBody").innerHTML = `
    <div class="done">
      <div class="big">📨</div>
      <h2 id="checkoutTitle">Fast geschafft!</h2>
      <p class="lead-s">Dein E-Mail-Programm öffnet sich mit deiner Bestellung. <strong>Schick die Mail ab</strong>, dann ist sie bei uns. Öffnet sich nichts, kopiere den Text und sende ihn an <strong>${esc(S.email)}</strong>.</p>
      <textarea readonly aria-label="Bestelltext" id="orderText">${esc(body)}</textarea>
      <div class="done-actions">
        <button class="btn btn-ghost" type="button" id="copyOrder">Text kopieren</button>
        <a class="btn btn-ghost" href="${esc(href)}">Mail erneut öffnen</a>
        <button class="btn btn-lime" type="button" id="finish">Fertig – Warenkorb leeren</button>
      </div>
    </div>`;
  $("#copyOrder").onclick = () => copy(body);
  $("#finish").onclick = () => { cart = {}; saveCart(); renderCart(); checkout.close(); toast("Danke für deine Bestellung! 🎮"); burst(innerWidth / 2, innerHeight / 2, 120); };
  window.location.href = href;
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = $("#orderText"); ta.select(); document.execCommand("copy"); }
  toast("Bestellung kopiert");
}

/* ============================================================
   Loot-Box (Willkommensrabatt)
   ============================================================ */
function renderLoot() {
  if (!W) return;
  const opened = !!coupon;
  $("#loot").classList.toggle("opened", opened);
  $("#lootOpen").hidden = opened;
  $("#lootReveal").hidden = !opened;
  $("#lootCode").textContent = W.code;
  $("#lootWinText").textContent = `Dein Willkommensrabatt ist aktiv: ${pct(W.percent)} ab ${W.minOrder} € Bestellwert. Er wird im Warenkorb automatisch berücksichtigt.`;
}

function openLoot() {
  const box = $("#lootBox");
  box.classList.add("shake");
  $("#lootOpen").disabled = true;
  setTimeout(() => {
    box.classList.remove("shake");
    coupon = W.code; saveCoupon(); renderCart(); renderLoot();
    const r = box.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 110);
    toast(`Treffer! Code ${W.code} aktiviert`);
  }, reduceMotion ? 0 : 850);
}

/* ============================================================
   Drawer, Toast, Events
   ============================================================ */
const drawer = $("#drawer"), scrim = $("#scrim"), cartBtn = $("#cartBtn");
const pageParts = () => document.querySelectorAll("header.top, main, footer, .announce");
let scrimTimer;

function openDrawer() {
  clearTimeout(scrimTimer);
  scrim.hidden = false; void scrim.offsetWidth; scrim.classList.add("show");
  drawer.classList.add("open");
  cartBtn.setAttribute("aria-expanded", "true");
  pageParts().forEach(el => el.inert = true);
  drawer.setAttribute("aria-modal", "true");
  $("#toast").classList.remove("show");
  renderBar();
  $("#drawerClose").focus();
}
function closeDrawer(returnFocus = true) {
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open"); scrim.classList.remove("show");
  scrimTimer = setTimeout(() => { scrim.hidden = true; }, 250);
  cartBtn.setAttribute("aria-expanded", "false");
  drawer.setAttribute("aria-modal", "false");
  pageParts().forEach(el => el.inert = false);
  renderBar();
  if (returnFocus) cartBtn.focus();
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

cartBtn.addEventListener("click", () => drawer.classList.contains("open") ? closeDrawer() : openDrawer());
$("#cartBarBtn").addEventListener("click", openDrawer);
$("#drawerClose").addEventListener("click", () => closeDrawer());
scrim.addEventListener("click", () => closeDrawer());
document.addEventListener("keydown", e => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) closeDrawer(); });

drawer.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]"); if (!btn) return;
  const id = btn.closest(".line")?.dataset.id, act = btn.dataset.act;
  if (act === "inc") setQty(id, cart[id] + 1);
  if (act === "dec") setQty(id, cart[id] - 1);
  if (act === "del") setQty(id, 0);
  if (act === "uncoupon") { coupon = ""; saveCoupon(); renderCart(); renderLoot(); }
  if (act === "shop") { closeDrawer(); location.hash = "#produkte"; }
  if (act === "checkout") openCheckout();
});
drawer.addEventListener("submit", e => {
  if (!e.target.matches("[data-coupon-form]")) return;
  e.preventDefault();
  toast(tryCoupon(new FormData(e.target).get("code")) ? "Code aktiviert ✓" : "Dieser Code ist ungültig");
});

$("#main").addEventListener("click", e => {
  const a = e.target.closest("[data-add]"), o = e.target.closest("[data-open]");
  if (a) {
    const r = a.getBoundingClientRect();
    add(a.dataset.add); burst(r.left + r.width / 2, r.top, 16);
    a.dataset.label = a.dataset.label || a.textContent;
    a.textContent = "✓ Im Korb";
    setTimeout(() => { a.textContent = a.dataset.label; }, 900);
  } else if (o) openDetail(o.dataset.open);
});
$("#chips").addEventListener("click", e => {
  const c = e.target.closest("[data-cat]"); if (!c) return;
  cat = c.dataset.cat; renderChips(); renderGrid();
});
$("#search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderGrid(); });
$("#sort").addEventListener("change", e => { sort = e.target.value; renderGrid(); });
$("#lootOpen").addEventListener("click", openLoot);

for (const dlg of [detail, checkout]) {
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
}

/* ============================================================
   Start
   ============================================================ */
const singles = PRODUCTS.filter(eligible);
const minCents = Math.min(...singles.map(cents));
const freeFromTxt = String(S.shipping.freeFrom).replace(".", ",");

document.title = `${S.name} – ${S.tagline}`;
$("#logoName").textContent = S.name;
$("#footName").textContent = S.name;
$("#tagline").textContent = `${S.tagline}.`;

const ann = $("#announce");
ann.innerHTML = [
  W ? `🎁 Willkommensrabatt: Code ${W.code} = ${pct(W.percent)} ab ${W.minOrder} €` : "",
  `🚚 Gratis-Versand ab ${freeFromTxt} €`,
].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("");
ann.hidden = false;
if (!W) ann.removeAttribute("href");

$("#heroChips").innerHTML = [
  `Snacks ab <strong>${money(minCents)}</strong>`,
  TIERS.length ? `Mix &amp; Spar bis <strong>${pct(maxMix)}</strong>` : "",
  `Gratis-Versand ab <strong>${freeFromTxt} €</strong>`,
].filter(Boolean).map(t => `<li>${t}</li>`).join("");

const tick1 = [
  "🎮 Gaming Candy für Zocker",
  `🚚 Gratis-Versand ab ${freeFromTxt} €`,
  TIERS.length ? `🧩 Mix & Spar bis ${pct(maxMix)}` : "",
  W ? `🎁 Code ${W.code}: ${pct(W.percent)}` : "",
  maxSet ? `⚡ Spar-Sets bis ${pct(maxSet)}` : "",
  "🍬 Sauer · süß · scharf",
].filter(Boolean);
$("#tickerTrack").innerHTML = [...tick1, ...tick1, ...tick1, ...tick1].map(t => `<span>${esc(t)}</span>`).join("");

const heroIds = ["controller-gummis", "xp-boost-sauergurtel", "loot-box-mystery"].filter(id => byId[id]);   // letzte Karte liegt vorn
$("#heroArt").innerHTML = (heroIds.length ? heroIds.map(id => byId[id]) : PRODUCTS.slice(0, 3))
  .map(p => `<div class="float"><div class="media" style="--glow:${glow(p)}">${art(p)}</div></div>`).join("") +
  `<div class="sticker"><span>ab</span><strong>${money(minCents)}</strong></div>`;

if (W) {
  $("#loot").hidden = false;
  const lootArt = byId["loot-box-mystery"] || { name: "Loot-Box", art: "box", colors: ["#8b5cff", "#ff2fb3", "#ffd23f"] };
  $("#lootBox").innerHTML = art(lootArt);
  $("#lootSub").textContent = `Tipp auf die Box und sichere dir ${pct(W.percent)} Willkommensrabatt – ab ${W.minOrder} € Bestellwert. Jede Box ist ein Treffer.`;
  renderLoot();
}

$("#dealGrid").innerHTML = PRODUCTS.filter(p => p.deal).map(card).join("");
$("#mixBanner").innerHTML = TIERS.length
  ? `<strong>🧩 Mix &amp; Spar</strong><span>${TIERS.map(t => `<b>${t.qty} Tüten</b> ${pct(t.percent)}`).join(" · ")}</span><em>auf alle einzelnen Tüten – Sets sind schon günstiger kalkuliert</em>`
  : "";
$("#mixBanner").hidden = !TIERS.length;

$("#vorteile").innerHTML = S.perks.map(p =>
  `<div class="perk"><div class="ico" aria-hidden="true">${p.icon}</div><h3>${esc(fill(p.title))}</h3><p>${esc(fill(p.text))}</p></div>`).join("");
$("#faqList").innerHTML = S.faq.map(f =>
  `<details><summary>${esc(f.q)}</summary><p>${esc(fill(f.a))}</p></details>`).join("");

renderChips(); renderGrid(); renderCart();
})();
