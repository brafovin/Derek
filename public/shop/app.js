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

const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
for (const p of PRODUCTS) if (p.includes) p.includes = p.includes.filter(id => byId[id] && id !== p.id);
const glow = p => esc(p.glow || p.colors[1] || p.colors[0]);

/* ---------- Produkt-Rechnungen (Sets, Ersparnis, Grundpreis) ---------- */
const isSet = p => Array.isArray(p.includes) && p.includes.length > 0;
const eligible = p => !isSet(p) && p.cat !== "boxen";               // zählt für Mix & Spar (nicht Sets/Boxen)
const comps = p => { const m = new Map(); for (const id of p.includes || []) m.set(id, (m.get(id) || 0) + 1); return m; };
const grams = p => p.grams ?? (isSet(p) && p.includes.every(id => byId[id].grams) ? p.includes.reduce((s, id) => s + byId[id].grams, 0) : 0);
const pfandC = p => isSet(p) ? p.includes.reduce((s, id) => s + pfandC(byId[id]), 0) : Math.round((p.pfand || 0) * 100);
const single = p => isSet(p) ? p.includes.reduce((s, id) => s + cents(byId[id]), 0) : 0;
const saved = p => Math.max(0, single(p) - cents(p));
const savedPct = p => single(p) ? Math.round(saved(p) / single(p) * 100) : 0;
const weightLabel = p => p.weight || (isSet(p) ? `${grams(p) ? `ca. ${grams(p)} g · ` : ""}${p.includes.length} Artikel` : "");
const basePrice = p => p.ml ? `${eur.format(p.price / p.ml * 1000)} / l` : grams(p) ? `${eur.format(p.price / grams(p) * 100)} / 100 g` : "";
const pfandTxt = p => pfandC(p) ? `zzgl. ${money(pfandC(p))} Pfand` : "";
const insideText = p => [...comps(p)].map(([id, n]) => `${n > 1 ? n + "× " : ""}${byId[id].name}`).join(" · ");

/* Platzhalter in Texten aus der Konfiguration füllen */
const mixText = TIERS.map(t => `ab ${t.qty} Artikeln ${t.percent} %`).join(", ");
const maxMix = TIERS.length ? TIERS[TIERS.length - 1].percent : 0;
const maxSet = Math.max(0, ...PRODUCTS.filter(isSet).map(savedPct));
const fill = t => String(t)
  .replace("{freeFrom}", String(S.shipping.freeFrom).replace(".", ","))
  .replace("{shipCost}", S.shipping.cost.toFixed(2).replace(".", ","))
  .replace("{maxMix}", maxMix).replace("{maxSet}", maxSet)
  .replace("{mixText}", mixText ? `Rabatt: ${mixText}.` : "")
  .replace("{welcomeCode}", W ? W.code : "").replace("{welcomePercent}", W ? W.percent : "").replace("{welcomeMin}", W ? W.minOrder : "")
  .replace("{payments}", S.payments.join(" oder ")).replace("{pfand}", money(Math.max(0, ...PRODUCTS.filter(p => !isSet(p)).map(pfandC))));

/* Produktgrafiken kommen aus art.js */
const art = p => window.CritArt.render(p, byId);

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
  const pfand = Object.entries(cart).reduce((t, [id, q]) => t + pfandC(byId[id]) * q, 0);
  return { sub, n, eligQty, tier, mixDisc, couponDisc, discount, label, net, free, ship, pfand, total: net + ship + pfand };
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
  if (!next) msg = `Max-Level erreicht: <strong>${pct(TIERS[TIERS.length - 1].percent)}</strong> auf alle Artikel`;
  else if (!q) msg = `Leg <strong>${next.qty} Artikel</strong> in den Korb und spar <strong>${next.percent} %</strong>`;
  else msg = `Noch <strong>${next.qty - q} Artikel</strong> bis <strong>${pct(next.percent)}</strong>`;
  const pips = TIERS.map(t => `<span class="pip${q >= t.qty ? " on" : ""}" style="left:${t.qty / max * 100}%"><b>${t.qty}</b><em>${pct(t.percent)}</em></span>`).join("");
  return `<div class="level">
    <div class="level-head"><strong>🧩 Mix &amp; Spar</strong><span>${q} Artikel</span></div>
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
      <div><h3>${esc(p.name)}</h3><div class="sub">${esc(weightLabel(p))} · ${eur.format(p.price)}${pfandC(p) ? ` · ${esc(pfandTxt(p))}` : ""}</div>
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
    ${pr.pfand ? `<div class="row"><span class="muted">Pfand</span><span>${money(pr.pfand)}</span></div>` : ""}
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
let cat = "alle", query = "", sort = "featured", shown = 12;
const PAGE = 12;

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
            <span class="unit"><span>${esc(weightLabel(p))}</span>${gp ? `<span>${gp}</span>` : ""}${pfandC(p) ? `<span>${esc(pfandTxt(p))}</span>` : ""}</span></div>
          <button class="add" type="button" data-add="${esc(p.id)}" aria-label="${esc(p.name)} in den Warenkorb">In den Korb</button>
        </div>
        ${sv ? `<p class="save-note">Du sparst ${money(sv)} gegenüber dem Einzelkauf</p>` : ""}
      </div>
    </article>`;
}

/* "Empfohlen": Kategorien reihum mischen, damit die ersten Karten schon Abwechslung zeigen; Sets & Boxen am Ende */
function featuredOrder(list) {
  const groups = CATS.filter(c => c.id !== "boxen").map(c => list.filter(p => p.cat === c.id));
  const out = [];
  for (let i = 0; groups.some(g => i < g.length); i++) for (const g of groups) if (i < g.length) out.push(g[i]);
  return [...out, ...list.filter(p => p.cat === "boxen")];
}

function renderGrid() {
  let list = PRODUCTS.filter(p => (cat === "alle" || p.cat === cat) &&
    (!query || `${p.name} ${p.desc} ${p.tags.join(" ")}`.toLowerCase().includes(query)));
  if (sort === "featured") list = featuredOrder(list);
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "de"));
  $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "Produkt" : "Produkte"}`;
  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list.slice(0, shown).map(card).join("");
  const rest = list.length - shown;
  $("#more").hidden = rest <= 0;
  if (rest > 0) $("#moreBtn").textContent = `Mehr anzeigen (noch ${rest})`;
}

/* ============================================================
   Produktdetail
   ============================================================ */
const detail = $("#detail");

const hash = str => { let h = 7; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; };
function suggest(p) {
  /* je Produkt eine andere, aber stabile Auswahl – möglichst aus anderen Kategorien */
  const pool = PRODUCTS.filter(x => x.id !== p.id && eligible(x)).sort((a, b) => hash(a.id + p.id) - hash(b.id + p.id));
  const out = [], seen = new Set([p.cat]);
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
      ${p.note ? `<p class="note">⚠ ${esc(p.note)}</p>` : ""}
      <div class="price">${eur.format(p.price)}${sv ? `<s class="was">${money(single(p))}</s>` : ""}<span class="unit">inkl. MwSt., zzgl. Versand${pfandC(p) ? `<br>${esc(pfandTxt(p))}` : ""}</span></div>
      ${sv ? `<p class="save-note">Du sparst ${money(sv)} (${pct(savedPct(p))}) gegenüber dem Einzelkauf</p>` : ""}
      ${eligible(p) && TIERS.length ? `<p class="save-note">🧩 Ab ${TIERS[0].qty} Artikeln im Korb gibt’s Mix-Rabatt – bis ${pct(maxMix)}.</p>` : ""}
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
      ${pr.pfand ? `<div class="row"><span>Pfand</span><span>${money(pr.pfand)}</span></div>` : ""}
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
    ...(pr.pfand ? [`Pfand: ${money(pr.pfand)}`] : []),
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
  cat = c.dataset.cat; shown = PAGE; renderChips(); renderGrid();
});
$("#search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); shown = PAGE; renderGrid(); });
$("#sort").addEventListener("change", e => { sort = e.target.value; shown = PAGE; renderGrid(); });
$("#moreBtn").addEventListener("click", () => { shown += PAGE; renderGrid(); });
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

const heroIds = ["xp-boost-sauergurtel", "headshot-energy-zero", "headshot-paprika-chips"].filter(id => byId[id]);   // letzte Karte liegt vorn
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
  ? `<strong>🧩 Mix &amp; Spar</strong><span>${TIERS.map(t => `<b>${t.qty} Artikel</b> ${pct(t.percent)}`).join(" · ")}</span><em>auf alle einzelnen Artikel – Sets sind schon günstiger kalkuliert</em>`
  : "";
$("#mixBanner").hidden = !TIERS.length;

$("#vorteile").innerHTML = S.perks.map(p =>
  `<div class="perk"><div class="ico" aria-hidden="true">${p.icon}</div><h3>${esc(fill(p.title))}</h3><p>${esc(fill(p.text))}</p></div>`).join("");
$("#faqList").innerHTML = S.faq.map(f =>
  `<details><summary>${esc(f.q)}</summary><p>${esc(fill(f.a))}</p></details>`).join("");

renderChips(); renderGrid(); renderCart();
})();
