(() => {
"use strict";

const S = window.SHOP, PRODUCTS = window.PRODUCTS, CATS = window.CATEGORIES;
const $ = (s, r = document) => r.querySelector(s);
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: S.currency });
const money = cents => eur.format(cents / 100);
const cents = p => Math.round(p.price * 100);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const glow = p => esc(p.glow || p.colors[0]);

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

  box(a, b, c) {
    const x = 100, y = 58, s = 44, h = s * .58, d = s * 1.1;
    const lid = `${x},${y - h * .55} ${x + s * .55},${y} ${x},${y + h * .55} ${x - s * .55},${y}`;
    return cube(x, y, s, a) + `<polygon points="${lid}" fill="${b}" opacity=".9"/>` +
      `<text transform="translate(${x - s / 2} ${y + h / 2 + d / 2 + 2}) skewY(30)" text-anchor="middle" dominant-baseline="central" font-size="44" font-weight="900" fill="${c}" stroke="#000" stroke-opacity=".25" stroke-width="2" font-family="Segoe UI,Arial,sans-serif">?</text>` +
      `<text transform="translate(${x + s / 2} ${y + h / 2 + d / 2 + 2}) skewY(-30)" text-anchor="middle" dominant-baseline="central" font-size="44" font-weight="900" fill="${c}" fill-opacity=".8" font-family="Segoe UI,Arial,sans-serif">?</text>` +
      star(30, 40, 1.3, c) + star(172, 52, 1.7, b) + star(164, 128, 1.1, c) + star(36, 118, 1.5, b);
  },
};

function art(p) {
  const draw = ART[p.art] || ART.box;
  return `<svg viewBox="0 0 200 160" role="img" aria-label="${esc(p.name)}">${draw(...p.colors)}</svg>`;
}

/* ============================================================
   Warenkorb
   ============================================================ */
const KEY = "critcandy-cart-v1";
let cart = loadCart();

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}"), out = {};
    for (const [id, q] of Object.entries(raw)) if (byId[id] && Number.isInteger(q) && q > 0) out[id] = Math.min(q, S.maxPerItem);
    return out;
  } catch { return {}; }
}
function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* privater Modus o. Ä. */ } }

function totals() {
  let sub = 0, n = 0;
  for (const [id, q] of Object.entries(cart)) { sub += cents(byId[id]) * q; n += q; }
  const free = sub >= S.shipping.freeFrom * 100;
  const ship = n === 0 || free ? 0 : Math.round(S.shipping.cost * 100);
  return { sub, n, ship, free, total: sub + ship };
}

function setQty(id, q) {
  q = Math.max(0, Math.min(S.maxPerItem, q));
  if (q === 0) delete cart[id]; else cart[id] = q;
  saveCart(); renderCart();
}
function add(id, q = 1) {
  setQty(id, (cart[id] || 0) + q);
  const badge = $("#cartCount");
  badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
  toast(`„${byId[id].name}“ liegt im Warenkorb`);
}

function renderCart() {
  const t = totals();
  $("#cartCount").textContent = t.n;
  const lines = $("#cartLines"), foot = $("#cartFoot");
  if (!t.n) {
    lines.innerHTML = `<div class="drawer-empty"><div class="big">🎮</div><p>Dein Warenkorb ist leer.<br>Zeit für Loot!</p></div>`;
    foot.innerHTML = `<button class="btn btn-ghost btn-block" type="button" data-act="shop">Weiter stöbern</button>`;
    return;
  }
  lines.innerHTML = Object.entries(cart).map(([id, q]) => {
    const p = byId[id];
    return `<div class="line" data-id="${esc(id)}" style="--glow:${glow(p)}">
      <div class="thumb">${art(p)}</div>
      <div><h3>${esc(p.name)}</h3><div class="sub">${esc(p.weight)} · ${eur.format(p.price)}</div>
        <div class="qty"><button type="button" data-act="dec" aria-label="Eine weniger">−</button><span>${q}</span><button type="button" data-act="inc" aria-label="Eine mehr">+</button></div><br>
        <button class="remove" type="button" data-act="del">Entfernen</button></div>
      <div class="sum">${money(cents(p) * q)}</div></div>`;
  }).join("");
  const missing = S.shipping.freeFrom * 100 - t.sub;
  foot.innerHTML = `
    <p class="ship-note">${t.free ? "🎉 Versandkostenfrei!" : `Noch <strong>${money(missing)}</strong> bis zum Gratis-Versand`}</p>
    <div class="ship-bar"><i style="width:${Math.min(100, t.sub / S.shipping.freeFrom)}%"></i></div>
    <div class="row"><span class="muted">Zwischensumme</span><span>${money(t.sub)}</span></div>
    <div class="row"><span class="muted">Versand</span><span>${t.ship ? money(t.ship) : "kostenlos"}</span></div>
    <div class="row total"><span>Gesamt</span><span>${money(t.total)}</span></div>
    <button class="btn btn-primary btn-block" type="button" data-act="checkout">Zur Kasse</button>`;
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

function renderGrid() {
  let list = PRODUCTS.filter(p => (cat === "alle" || p.cat === cat) &&
    (!query || `${p.name} ${p.desc} ${p.tags.join(" ")}`.toLowerCase().includes(query)));
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "de"));
  $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "Produkt" : "Produkte"}`;
  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list.map(p => `
    <article class="card" style="--glow:${glow(p)}">
      <button class="media" type="button" data-open="${esc(p.id)}" aria-label="Details zu ${esc(p.name)}" tabindex="-1">
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}${art(p)}</button>
      <div class="card-body">
        <h3><button type="button" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
        <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <p class="desc">${esc(p.desc)}</p>
        <div class="buy">
          <div class="price">${eur.format(p.price)}<span class="unit">${esc(p.weight)}</span></div>
          <button class="add" type="button" data-add="${esc(p.id)}" aria-label="${esc(p.name)} in den Warenkorb">In den Korb</button>
        </div>
      </div>
    </article>`).join("");
}

/* ============================================================
   Produktdetail
   ============================================================ */
const detail = $("#detail");
function openDetail(id) {
  const p = byId[id]; if (!p) return;
  let qty = 1;
  $("#detailBody").innerHTML = `
    <div class="media" style="--glow:${glow(p)}">${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}${art(p)}</div>
    <div class="detail-info">
      <h2 id="detailName">${esc(p.name)}</h2>
      <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <p class="desc">${esc(p.desc)}</p>
      <p class="meta">Inhalt: ${esc(p.weight)}</p>
      <div class="price">${eur.format(p.price)}<span class="unit">inkl. MwSt., zzgl. Versand</span></div>
      <div class="qty-row">
        <div class="qty"><button type="button" data-dq="-1" aria-label="Eine weniger">−</button><span id="dq">1</span><button type="button" data-dq="1" aria-label="Eine mehr">+</button></div>
        <button class="btn btn-lime" type="button" id="dAdd">In den Warenkorb</button>
      </div>
    </div>`;
  $("#detailBody").onclick = e => {
    const dq = e.target.closest("[data-dq]");
    if (dq) { qty = Math.max(1, Math.min(S.maxPerItem, qty + Number(dq.dataset.dq))); $("#dq").textContent = qty; }
    if (e.target.closest("#dAdd")) { add(id, qty); detail.close(); }
  };
  detail.showModal();
}

/* ============================================================
   Checkout – schickt die Bestellung als vorbereitete E-Mail
   ============================================================ */
const checkout = $("#checkout");
const demoMode = /deine-domain|example\./i.test(S.email);

function openCheckout() {
  const t = totals(); if (!t.n) return;
  closeDrawer(false);
  $("#checkoutBody").innerHTML = `
    <h2 id="checkoutTitle">Zur Kasse</h2>
    <p class="lead-s">Du bekommst keine Online-Abbuchung: Deine Bestellung geht als E-Mail an uns, danach erhältst du die Zahlungsdetails.</p>
    ${demoMode ? `<div class="notice"><strong>Demo-Modus:</strong> Trag in <code>products.js</code> deine echte E-Mail-Adresse ein, damit Bestellungen bei dir ankommen.</div>` : ""}
    <div class="summary">
      <div class="row"><span>Artikel (${t.n})</span><span>${money(t.sub)}</span></div>
      <div class="row"><span>Versand</span><span>${t.ship ? money(t.ship) : "kostenlos"}</span></div>
      <div class="row total"><span>Gesamt</span><span>${money(t.total)}</span></div>
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
  const t = totals(), id = orderId();
  const items = Object.entries(cart).map(([pid, q]) => {
    const p = byId[pid];
    return `${q} × ${p.name} (${p.weight}) – ${money(cents(p) * q)}`;
  });
  const body = [
    `Neue Bestellung bei ${S.name}`, `Bestellnummer: ${id}`, "",
    "Artikel:", ...items, "",
    `Zwischensumme: ${money(t.sub)}`, `Versand: ${t.ship ? money(t.ship) : "kostenlos"}`, `Gesamt: ${money(t.total)}`, "",
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
  $("#finish").onclick = () => { cart = {}; saveCart(); renderCart(); checkout.close(); toast("Danke für deine Bestellung! 🎮"); };
  window.location.href = href;
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = $("#orderText"); ta.select(); document.execCommand("copy"); }
  toast("Bestellung kopiert");
}

/* ============================================================
   Drawer, Toast, Events
   ============================================================ */
const drawer = $("#drawer"), scrim = $("#scrim"), cartBtn = $("#cartBtn");
const pageParts = () => document.querySelectorAll("header.top, main, footer");
let scrimTimer;

function openDrawer() {
  clearTimeout(scrimTimer);
  scrim.hidden = false; void scrim.offsetWidth; scrim.classList.add("show");
  drawer.classList.add("open");
  cartBtn.setAttribute("aria-expanded", "true");
  pageParts().forEach(el => el.inert = true);
  drawer.setAttribute("aria-modal", "true");
  $("#toast").classList.remove("show");
  $("#drawerClose").focus();
}
function closeDrawer(returnFocus = true) {
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open"); scrim.classList.remove("show");
  scrimTimer = setTimeout(() => { scrim.hidden = true; }, 250);
  cartBtn.setAttribute("aria-expanded", "false");
  drawer.setAttribute("aria-modal", "false");
  pageParts().forEach(el => el.inert = false);
  if (returnFocus) cartBtn.focus();
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

cartBtn.addEventListener("click", () => drawer.classList.contains("open") ? closeDrawer() : openDrawer());
$("#drawerClose").addEventListener("click", () => closeDrawer());
scrim.addEventListener("click", () => closeDrawer());
document.addEventListener("keydown", e => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) closeDrawer(); });

drawer.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]"); if (!btn) return;
  const id = btn.closest(".line")?.dataset.id;
  if (btn.dataset.act === "inc") setQty(id, cart[id] + 1);
  if (btn.dataset.act === "dec") setQty(id, cart[id] - 1);
  if (btn.dataset.act === "del") setQty(id, 0);
  if (btn.dataset.act === "shop") { closeDrawer(); location.hash = "#produkte"; }
  if (btn.dataset.act === "checkout") openCheckout();
});

$("#grid").addEventListener("click", e => {
  const a = e.target.closest("[data-add]"), o = e.target.closest("[data-open]");
  if (a) add(a.dataset.add);
  else if (o) openDetail(o.dataset.open);
});
$("#chips").addEventListener("click", e => {
  const c = e.target.closest("[data-cat]"); if (!c) return;
  cat = c.dataset.cat; renderChips(); renderGrid();
});
$("#search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderGrid(); });
$("#sort").addEventListener("change", e => { sort = e.target.value; renderGrid(); });
$("#heroLoot").addEventListener("click", () => openDetail("loot-box-mystery"));

for (const dlg of [detail, checkout]) {
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
}

/* ============================================================
   Start
   ============================================================ */
document.title = `${S.name} – ${S.tagline}`;
$("#logoName").textContent = S.name;
$("#footName").textContent = S.name;
$("#tagline").textContent = `${S.tagline}.`;
$("#vorteile").innerHTML = S.perks.map(p =>
  `<div class="perk"><div class="ico" aria-hidden="true">${p.icon}</div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join("");

/* Reihenfolge = Stapelreihenfolge: die letzte Karte liegt vorn */
const heroIds = ["xp-boost-sauergurtel", "lag-spike-lollis", "loot-box-mystery"].filter(id => byId[id]);
$("#heroArt").innerHTML = (heroIds.length ? heroIds.map(id => byId[id]) : PRODUCTS.slice(0, 3))
  .map(p => `<div class="float"><div class="media" style="--glow:${glow(p)}">${art(p)}</div></div>`).join("");

renderChips(); renderGrid(); renderCart();
})();
