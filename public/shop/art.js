/* ============================================================
   Produktgrafiken – realistisch wirkende Verpackungen als SVG
   (Standbeutel, Chipstüte, Dose, Flasche, Becher, Riegel, Karton …)

   Eigene Fotos? In products.js beim Produkt  image: "img/mein-foto.jpg"  eintragen,
   dann wird statt der Zeichnung dein Foto gezeigt.
   ============================================================ */
(() => {
"use strict";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

/* ---------- Farben ---------- */
const hex2rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map(c => c + c).join(""); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2hex = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); };
const shade = (c, t) => mix(c, "#000000", t);
const tint = (c, t) => mix(c, "#ffffff", t);
const lum = c => { const [r, g, b] = hex2rgb(c); return (.299 * r + .587 * g + .114 * b) / 255; };

/* ---------- Kontext: Verläufe & Filter, pro Grafik eindeutig ---------- */
let uid = 0;
function makeCtx() {
  const pre = "c" + (++uid) + "-";
  let n = 0;
  const defs = [], cache = new Map();
  const x = {
    defs,
    blur: pre + "blur",
    soft: pre + "soft",
    id: () => pre + (++n),
    cached(key, build) {
      if (!cache.has(key)) { const id = x.id(); defs.push(build(id)); cache.set(key, id); }
      return `url(#${cache.get(key)})`;
    },
    lin(stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0) {
      return x.cached("l" + JSON.stringify([stops, x1, y1, x2, y2]), id =>
        `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`);
    },
    rad(stops, cx = .5, cy = .5, r = .5) {
      return x.cached("r" + JSON.stringify([stops, cx, cy, r]), id =>
        `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</radialGradient>`);
    },
    clip(d) { const id = x.id(); defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return id; },
    gummy: c => x.rad([[0, tint(c, .6)], [.5, c], [1, shade(c, .38)]], .36, .3, .85),                       // glänzend-durchscheinend
    cyl: c => x.lin([[0, shade(c, .5)], [.14, shade(c, .14)], [.36, tint(c, .3)], [.55, c], [.84, shade(c, .3)], [1, shade(c, .58)]]), // Zylinder
    vert: c => x.lin([[0, tint(c, .42)], [.5, c], [1, shade(c, .36)]], 0, 0, 0, 1),
    metal: () => x.lin([[0, "#7d828c"], [.25, "#e9ecf1"], [.45, "#b9bec7"], [.7, "#f7f8fa"], [1, "#7a7f89"]]),
  };
  defs.push(`<filter id="${x.blur}" x="-40%" y="-150%" width="180%" height="400%"><feGaussianBlur stdDeviation="2.4"/></filter>`);
  defs.push(`<filter id="${x.soft}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>`);
  return x;
}

const FONT = `system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
function text(s, x, y, size, o = {}) {
  const { fill = "#fff", w = 0, weight = 900, italic = true, anchor = "middle", stroke, sw = 0, op = 1 } = o;
  const tl = w ? Math.min(w, s.length * size * .62) : 0;
  return `<text x="${x}" y="${y}" font-family='${FONT}' font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ""} text-anchor="${anchor}" fill="${fill}"` +
    `${op !== 1 ? ` fill-opacity="${op}"` : ""}${stroke ? ` stroke="${stroke}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round"` : ""}` +
    `${tl ? ` textLength="${tl.toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(s)}</text>`;
}

/* ============================================================
   Einzelstücke (der Inhalt): jedes Teil ist um (0,0) gezeichnet, ca. ±12 groß
   ============================================================ */
const P = {
  bear(x, a) {
    return `<g fill="${x.gummy(a)}" stroke="${shade(a, .4)}" stroke-width=".5">
      <circle cx="-5.6" cy="-13" r="3.3"/><circle cx="5.6" cy="-13" r="3.3"/><circle cx="0" cy="-8.4" r="6.8"/>
      <ellipse cx="0" cy="3" rx="8.4" ry="9.8"/>
      <ellipse cx="-9.6" cy="1" rx="2.9" ry="5.2" transform="rotate(26 -9.6 1)"/><ellipse cx="9.6" cy="1" rx="2.9" ry="5.2" transform="rotate(-26 9.6 1)"/>
      <ellipse cx="-4.4" cy="12.4" rx="3.7" ry="4.2"/><ellipse cx="4.4" cy="12.4" rx="3.7" ry="4.2"/></g>
      <ellipse cx="-2.8" cy="-11.4" rx="2.4" ry="1.3" fill="#fff" opacity=".6"/><ellipse cx="-3.6" cy="1" rx="1.8" ry="4.2" fill="#fff" opacity=".28"/>
      <circle cx="-2.5" cy="-8.4" r=".85" fill="#2a1030"/><circle cx="2.5" cy="-8.4" r=".85" fill="#2a1030"/>`;
  },
  belt(x, a, b, i) {
    let d = "";
    for (let k = 0; k < 18; k++) d += `<circle cx="${(-18 + rnd(k + i * 7) * 36).toFixed(1)}" cy="${(-3 + rnd(k * 3 + i) * 6).toFixed(1)}" r=".6" fill="#fff" opacity=".92"/>`;
    return `<rect x="-20" y="-4.4" width="40" height="8.8" rx="4.4" fill="${shade(a, .3)}"/><rect x="-20" y="-4.4" width="40" height="8" rx="4" fill="${x.vert(a)}"/>
      <rect x="-17" y="-3.4" width="34" height="1.7" rx=".85" fill="#fff" opacity=".35"/>${d}`;
  },
  bottle(x, a) {
    return `<path d="M-2.6-13h5.2v3.2c0 2.2 4.4 3.4 4.4 7.6V9.6c0 3-2.4 4.4-7 4.4s-7-1.4-7-4.4V-2.2c0-4.2 4.4-5.4 4.4-7.6z" fill="${x.gummy(a)}" stroke="${shade(a, .4)}" stroke-width=".5"/>
      <rect x="-3.4" y="-15" width="6.8" height="3" rx="1.2" fill="${tint(a, .75)}"/><rect x="-7" y="-1" width="14" height="6" fill="${tint(a, .82)}" opacity=".9"/>
      <ellipse cx="-3.6" cy="3" rx="1.1" ry="6" fill="#fff" opacity=".4"/>`;
  },
  worm(x, a, b, i) {
    const d = "M-17 0q4.25-8 8.5 0t8.5 0 8.5 0 8.5 0";
    let dots = "";
    for (let k = 0; k < 16; k++) { const px = -16 + rnd(k + i * 5) * 32; dots += `<circle cx="${px.toFixed(1)}" cy="${(-3.4 * Math.sin((px + 17) * Math.PI / 8.5) + (rnd(k * 3 + i) - .5) * 3).toFixed(1)}" r=".6" fill="#fff" opacity=".9"/>`; }
    return `<path d="${d}" fill="none" stroke="${shade(a, .35)}" stroke-width="6.8" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${x.lin([[0, a], [.5, a], [.5, b], [1, b]])}" stroke-width="5.8" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.3" stroke-linecap="round" transform="translate(0 -1.6)"/>${dots}`;
  },
  heart(x, a) {
    return `<path d="M0 12C-19 0-17-13-8-13-4-13 0-10 0-7 0-10 4-13 8-13 17-13 19 0 0 12Z" fill="${x.gummy(a)}" stroke="${shade(a, .4)}" stroke-width=".5"/>
      <ellipse cx="-6.5" cy="-7.5" rx="3.4" ry="1.9" fill="#fff" opacity=".6" transform="rotate(-30 -6.5 -7.5)"/>`;
  },
  ring(x, a) {
    return `<circle r="8" fill="none" stroke="${shade(a, .4)}" stroke-width="7.6"/><circle r="8" fill="none" stroke="${x.vert(a)}" stroke-width="6.6"/>
      <path d="M-6.5-4A7.5 7.5 0 0 1 3-7.2" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>`;
  },
  cube(x, a) {
    const s = 8, h = 4.6, d = 8.8, t = `0,${-h - 1} ${s},-1 0,${h - 1} ${-s},-1`;
    return `<polygon points="${t}" fill="${tint(a, .35)}"/><polygon points="${-s},-1 0,${h - 1} 0,${h - 1 + d} ${-s},${-1 + d}" fill="${a}"/>
      <polygon points="${s},-1 0,${h - 1} 0,${h - 1 + d} ${s},${-1 + d}" fill="${shade(a, .35)}"/><polygon points="${t}" fill="#fff" opacity=".25"/>
      <path d="M-6-.4L-1 ${h - 1.4}" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>`;
  },
  gamepad(x, a, b) {
    return `<g transform="scale(.19)"><path d="M-62-22C-62-38-48-42-34-42H34C48-42 62-38 62-22L72 28C75 46 58 54 46 42L30 22H-30L-46 42C-58 54-75 46-72 28Z" fill="${x.gummy(a)}" stroke="${shade(a, .4)}" stroke-width="3"/>
      <path d="M-52-28C-50-35-44-36-34-36H34C44-36 50-35 52-28" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
      <rect x="-46" y="-20" width="8" height="26" rx="2" fill="#fff" fill-opacity=".92"/><rect x="-55" y="-11" width="26" height="8" rx="2" fill="#fff" fill-opacity=".92"/>
      <circle cx="40" cy="-19" r="6" fill="${b}"/><circle cx="53" cy="-8" r="6" fill="#fff" fill-opacity=".92"/><circle cx="40" cy="3" r="6" fill="${b}"/><circle cx="27" cy="-8" r="6" fill="#fff" fill-opacity=".92"/>
      <circle cx="-14" cy="12" r="9" fill="#000" fill-opacity=".25"/><circle cx="14" cy="12" r="9" fill="#000" fill-opacity=".25"/></g>`;
  },
  lolli(x, a, b) {
    return `<g transform="translate(0 -6)"><rect x="-1.1" y="4" width="2.2" height="20" rx="1.1" fill="#f4f1ff"/><rect x="-1.1" y="4" width="1" height="20" fill="#000" opacity=".12"/>
      <circle r="10.5" fill="${x.gummy(a)}" stroke="${shade(a, .4)}" stroke-width=".5"/>
      <path d="M0-7.4a7.4 7.4 0 1 1-7.4 7.4 5.4 5.4 0 0 1 5.4-5.4 3.4 3.4 0 0 1 3.4 3.4 1.7 1.7 0 0 1-1.7 1.7" fill="none" stroke="${tint(b, .2)}" stroke-width="1.9" stroke-linecap="round"/>
      <ellipse cx="-4.4" cy="-5.6" rx="3.3" ry="1.7" fill="#fff" opacity=".6" transform="rotate(-35 -4.4 -5.6)"/></g>`;
  },
  drop(x, a) {
    return `<ellipse cx="0" cy="1.4" rx="9" ry="8.6" fill="${shade(a, .5)}"/><circle r="8.8" fill="${x.gummy(a)}" stroke="${shade(a, .45)}" stroke-width=".5"/>
      <ellipse cx="-3.2" cy="-4.2" rx="3.2" ry="1.8" fill="#fff" opacity=".6" transform="rotate(-30 -3.2 -4.2)"/>`;
  },
  mallow(x, a) {
    return `<rect x="-8" y="-7" width="16" height="15" rx="5.5" fill="${x.lin([[0, tint(a, .5)], [.5, a], [1, shade(a, .24)]], 0, 0, 1, .3)}" stroke="${shade(a, .25)}" stroke-width=".4"/>
      <ellipse cx="0" cy="-6" rx="6.3" ry="2.1" fill="#fff" opacity=".5"/><rect x="-8" y="0" width="16" height="1" fill="#000" opacity=".06"/>`;
  },
  pastille(x, a) {
    return `<rect x="-9" y="-1" width="18" height="4" fill="${shade(a, .45)}"/><ellipse cx="0" cy="3" rx="9" ry="5.4" fill="${shade(a, .45)}"/><ellipse cx="0" cy="-1" rx="9" ry="5.4" fill="${x.vert(a)}"/>
      <ellipse cx="0" cy="-1" rx="6.2" ry="3.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><ellipse cx="-3" cy="-3" rx="2.2" ry="1" fill="#fff" opacity=".5"/>`;
  },
  licorice(x, a) {
    return `<circle r="10" fill="#1b1520"/><circle r="10" fill="none" stroke="#3d3047" stroke-width=".6"/>
      <path d="M0-8.2a8.2 8.2 0 1 1-8.2 8.2 6 6 0 0 1 6-6 3.8 3.8 0 0 1 3.8 3.8" fill="none" stroke="#3d3047" stroke-width="2.2" stroke-linecap="round"/>
      <circle r="3.6" fill="${x.gummy(a)}"/><ellipse cx="-4.2" cy="-5.4" rx="3.4" ry="1.5" fill="#fff" opacity=".35" transform="rotate(-35 -4.2 -5.4)"/>`;
  },
  egg(x) {
    return `<path d="M-9.5-2C-11-8-3.5-11 .5-9.4 6.4-11 11.2-5.4 9.4 0 11.4 5.4 4.8 9.6-.4 8.2-7.6 10.4-11.4 3.4-9.5-2Z" fill="${x.lin([[0, "#ffffff"], [1, "#e6e0ee"]], 0, 0, 0, 1)}" stroke="#d3cbdd" stroke-width=".5"/>
      <circle cx="-.4" cy="0" r="4" fill="${x.gummy("#ffbf1a")}"/><ellipse cx="-1.6" cy="-1.6" rx="1.3" ry=".8" fill="#fff" opacity=".75"/>`;
  },
  strawberry(x, a) {
    let seeds = "";
    for (const [sx, sy] of [[-3, -2], [3, -3], [0, 2], [-4, 4], [4, 3], [0, -6], [-1, 7]]) seeds += `<ellipse cx="${sx}" cy="${sy}" rx=".6" ry=".9" fill="#ffe27a"/>`;
    return `<path d="M0 12C-11 6-13-5-10-8-5-11 5-11 10-8 13-5 11 6 0 12Z" fill="${x.gummy(a)}" stroke="${shade(a, .4)}" stroke-width=".5"/>${seeds}
      <path d="M-5-9L0-6 5-9 3-12 0-10-3-12Z" fill="#3fa34d"/><ellipse cx="-5" cy="-3.6" rx="2.2" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-40 -5 -3.6)"/>`;
  },
  chip(x, a, b, i) {
    let sp = "";
    for (let k = 0; k < 14; k++) sp += `<circle cx="${(-9 + rnd(k + i * 3) * 18).toFixed(1)}" cy="${(-5 + rnd(k * 5 + i) * 10).toFixed(1)}" r=".6" fill="${b}" opacity=".85"/>`;
    return `<path d="M-13 0C-13-6-5-9 0-6.6 5-10 13-8 13-1 13 5.6 5 8.6 0 6.4-5 9.6-13 6.4-13 0Z" fill="${x.lin([[0, tint(a, .35)], [.55, a], [1, shade(a, .24)]], .1, 0, .9, 1)}" stroke="${shade(a, .3)}" stroke-width=".5"/>
      <path d="M-9-1C-5-4 0-2 4-4M-8 3C-4 0 0 2 5 0" fill="none" stroke="${shade(a, .25)}" stroke-opacity=".35" stroke-width=".9" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-3.2" rx="3" ry="1.1" fill="#fff" opacity=".42" transform="rotate(-20 -6 -3.2)"/>${sp}`;
  },
  nacho(x, a, b, i) {
    let sp = "";
    for (let k = 0; k < 16; k++) sp += `<circle cx="${(-7 + rnd(k + i * 2) * 14).toFixed(1)}" cy="${(-4 + rnd(k * 3 + i) * 13).toFixed(1)}" r=".65" fill="${b}" opacity=".8"/>`;
    return `<path d="M0-12 12 9Q12.4 10.8 10.4 10.8H-10.4Q-12.4 10.8-12 9Z" fill="${x.lin([[0, tint(a, .3)], [1, shade(a, .24)]], .3, 0, .7, 1)}" stroke="${shade(a, .35)}" stroke-width=".6" stroke-linejoin="round"/>
      <path d="M0-9 8.4 6" stroke="#fff" stroke-opacity=".3" stroke-width="1.3" stroke-linecap="round" fill="none"/>${sp}`;
  },
  popcorn(x, a, b) {
    const g = x.gummy(a);
    let s = "";
    for (const [cx, cy, r] of [[-5, 3, 5.6], [5, 4, 5.4], [0, -3, 6], [-7, -4, 4.4], [7, -3, 4.6]]) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}" stroke="${shade(a, .3)}" stroke-width=".4"/>`;
    return s + `<ellipse cx="-2" cy="-5" rx="2" ry="1.2" fill="${b}" opacity=".7"/><ellipse cx="4" cy="3" rx="1.6" ry="1" fill="${b}" opacity=".6"/><ellipse cx="-6" cy="4" rx="1.4" ry=".9" fill="${b}" opacity=".6"/>
      <ellipse cx="-3" cy="-6" rx="1.7" ry=".9" fill="#fff" opacity=".6"/>`;
  },
  nut(x, a, b, i) {
    const v = i % 3;
    if (v === 0) return `<ellipse cx="-4" cy="0" rx="6" ry="4.6" fill="${x.gummy(a)}"/><ellipse cx="4" cy="0" rx="6" ry="4.6" fill="${x.gummy(a)}"/><path d="M-1-4.2Q0 0-1 4.2" fill="none" stroke="${shade(a, .4)}" stroke-width=".7"/><ellipse cx="-5" cy="-2" rx="2.4" ry="1" fill="#fff" opacity=".4"/>`;
    if (v === 1) return `<path d="M-10 1Q-6-9 8-3 11 0 8 4 0 9-10 1Z" fill="${x.gummy(b)}" stroke="${shade(b, .4)}" stroke-width=".5"/><ellipse cx="-2" cy="-1.6" rx="4" ry="1" fill="#fff" opacity=".35"/>`;
    return `<path d="M-9 4C-12-5-3-10 5-6 8-4 9 1 6 4 4 2 1 1-2 2-5 4-7 6-9 4Z" fill="${x.gummy(tint(a, .2))}" stroke="${shade(a, .4)}" stroke-width=".5"/><ellipse cx="-2" cy="-4" rx="3" ry="1" fill="#fff" opacity=".4"/>`;
  },
  jerky(x, a) {
    return `<path d="M-15-3C-9-7-2-3 4-5.5 9-7 15-3.6 16 1 14 6 8 3.6 2 5.6-4 8-10 5-16 3.6Z" fill="${x.vert(a)}" stroke="${shade(a, .5)}" stroke-width=".6"/>
      <path d="M-12-1Q-5-3 2-2T14 0M-12 2Q-4 1 3 2T13 3" stroke="${tint(a, .45)}" stroke-opacity=".5" stroke-width=".8" fill="none" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-3.4" rx="4" ry="1" fill="#fff" opacity=".28" transform="rotate(-10 -6 -3.4)"/>`;
  },
  pretzel(x, a) {
    const d = "M-10 9C-15-1-8-12-1-7 3-4 1 1 0 3-1 1-3-4 1-7 8-12 15-1 10 9";
    let salt = "";
    for (let k = 0; k < 10; k++) { const px = -10 + rnd(k) * 20, py = -8 + rnd(k * 3) * 14; salt += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="1.3" height=".8" fill="#fff" opacity=".9" transform="rotate(${(rnd(k * 7) * 180).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`; }
    return `<path d="${d}" fill="none" stroke="${shade(a, .45)}" stroke-width="4.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${x.vert(a)}" stroke-width="3.8" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".9" stroke-linecap="round" transform="translate(-.6 -.8)"/>${salt}`;
  },
  cracker(x, a, b) {
    let holes = "";
    for (const hx of [-4, 0, 4]) for (const hy of [-4, 0, 4]) holes += `<circle cx="${hx}" cy="${hy}" r=".7" fill="${shade(a, .45)}"/>`;
    return `<rect x="-8" y="-8" width="16" height="16" rx="2.4" fill="${x.lin([[0, tint(a, .3)], [1, shade(a, .22)]], 0, 0, 1, 1)}" stroke="${shade(a, .4)}" stroke-width=".5"/>${holes}
      <path d="M-7-7.4H7" stroke="#fff" stroke-opacity=".4" stroke-width="1"/><circle cx="-5" cy="5.5" r=".6" fill="${b}" opacity=".8"/><circle cx="5.6" cy="-5.6" r=".6" fill="${b}" opacity=".8"/>`;
  },
  cookie(x, a, b) {
    let chips = "";
    for (const [cx, cy, r] of [[-4, -4, 1.9], [3, -5, 1.6], [5, 1, 2], [-2, 2, 1.8], [-6, 3, 1.5], [1, 6, 1.6]])
      chips += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${(r * .8).toFixed(2)}" fill="${b}"/><ellipse cx="${cx - .5}" cy="${cy - .5}" rx="${(r * .4).toFixed(2)}" ry="${(r * .25).toFixed(2)}" fill="#fff" opacity=".28"/>`;
    return `<circle r="9.5" fill="${shade(a, .42)}"/><circle r="9" fill="${x.gummy(a)}"/>${chips}`;
  },
  mochi(x, a) {
    return `<ellipse cx="0" cy="2" rx="9.4" ry="7" fill="${shade(a, .18)}"/><ellipse cx="0" cy="0" rx="9.4" ry="7.4" fill="${x.gummy(a)}"/>
      <ellipse cx="0" cy="-2.4" rx="7" ry="3.8" fill="#fff" opacity=".32"/><ellipse cx="-3" cy="-3.6" rx="2.6" ry="1.1" fill="#fff" opacity=".7"/>`;
  },
  stick(x, a, b) {
    return `<rect x="-14" y="-1.7" width="28" height="3.4" rx="1.7" fill="#d9a25b"/><rect x="-14" y="-1.7" width="19" height="3.4" rx="1.7" fill="${x.vert(b)}"/>
      <rect x="-13" y="-1.1" width="17" height=".8" rx=".4" fill="#fff" opacity=".32"/>`;
  },
  choc(x, a) {
    let g = "";
    for (let c = 1; c < 4; c++) g += `<path d="M${-10 + c * 5}-6V6" stroke="${shade(a, .5)}" stroke-width=".7"/>`;
    return `<rect x="-10" y="-6" width="20" height="12" rx="1.6" fill="${x.vert(a)}" stroke="${shade(a, .5)}" stroke-width=".5"/>${g}<path d="M-10 0H10" stroke="${shade(a, .5)}" stroke-width=".7"/>
      <path d="M-9-5H9" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/>`;
  },
  bar(x, a, b, i) {
    let nug = "";
    for (let k = 0; k < 16; k++) nug += `<circle cx="${(-9 + rnd(k + i) * 18).toFixed(1)}" cy="${(-3 + rnd(k * 3 + i) * 6).toFixed(1)}" r="${(.7 + rnd(k * 7) * .8).toFixed(2)}" fill="${tint(a, .45)}" opacity=".8"/>`;
    return `<rect x="-11" y="-5" width="22" height="10" rx="2.2" fill="${x.vert(a)}" stroke="${shade(a, .45)}" stroke-width=".5"/>${nug}
      <path d="M-9-1.5Q-4 1 0-1T9-1" stroke="${b}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".85"/>`;
  },
  noodle(x, a, b) {
    let s = "";
    for (let k = 0; k < 5; k++) s += `<path d="M-10 ${-6 + k * 3.2}q2.5-4 5 0t5 0 5 0 5 0" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round"/>`;
    return `<ellipse cx="0" cy="3" rx="11" ry="3" fill="${shade(b, .1)}"/>${s}<circle cx="5" cy="-5" r="3.1" fill="#fff"/><circle cx="5" cy="-5" r="1.5" fill="#ffb81c"/>`;
  },
  bolt(x, a) {
    return `<path d="M3-13L-7 2H-1L-4 13 8-3H2Z" fill="${x.lin([[0, tint(a, .5)], [1, a]], 0, 0, 0, 1)}" stroke="${shade(a, .4)}" stroke-width=".6" stroke-linejoin="round"/>`;
  },
};

/* Teile, deren Farben fest zugeordnet sind (nicht reihum wechseln) */
const FIXED = new Set(["chip", "nacho", "popcorn", "nut", "jerky", "pretzel", "cracker", "cookie", "noodle", "bar", "choc", "stick", "egg", "bolt"]);
/* Teile, die einzeln groß statt als Dreier-Gruppe auf dem Etikett erscheinen */
const SINGLE = new Set(["bolt", "noodle"]);
/* Größe der Teile, die vor der Verpackung liegen */
const SPILL_SCALE = { bear: .85, belt: .85, bottle: .9, worm: .85, heart: .8, ring: .95, cube: .9, gamepad: 1.1, lolli: .85, drop: .95, mallow: .95, pastille: .95,
  licorice: .85, egg: .9, strawberry: .85, chip: 1.0, nacho: .95, popcorn: .85, nut: .95, jerky: 1.0, pretzel: .95, cracker: .95, cookie: .95, mochi: .95,
  stick: 1.1, choc: 1.0, bar: 1.0, noodle: .85, bolt: .85 };

function piece(x, icon, cols, i, px, py, s, rot, shadow = true) {
  const fn = P[icon] || P.chip;
  const a = FIXED.has(icon) ? cols[0] : cols[i % cols.length];
  const b = FIXED.has(icon) ? (cols[1] || cols[0]) : cols[(i + 1) % cols.length];
  return `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot}) scale(${s.toFixed(3)})">` +
    (shadow ? `<ellipse cx="0" cy="9" rx="10" ry="2.4" fill="#000" opacity=".38" filter="url(#${x.blur})"/>` : "") + fn(x, a, b, i) + `</g>`;
}

function cluster(x, icon, cols, k) {
  const base = (SPILL_SCALE[icon] || 1) * k;
  if (SINGLE.has(icon)) return piece(x, icon, cols, 0, 0, 0, base * 1.35, 0, false);
  return piece(x, icon, cols, 1, -13 * k, 5 * k, base * .8, -18, false) + piece(x, icon, cols, 2, 13 * k, 6 * k, base * .8, 16, false) + piece(x, icon, cols, 0, 0, -1 * k, base * 1.05, 0, false);
}

/* ============================================================
   Etikett (Marke, Name, Burst mit Inhalt, Band, Gewicht)
   ============================================================ */
const G = {
  pouch:  { cx: 0,  brandY: -83, nameY: -69.5, nameSize: 12.5, nameW: 58, burstY: -45, burstR: 23,   ribY: -26, ribW: 58, ribH: 8.5, weightY: -12 },
  chip:   { cx: 0,  brandY: -91, nameY: -77, nameSize: 13,   nameW: 62, burstY: -51, burstR: 26,   ribY: -30, ribW: 64, ribH: 9,   weightY: -15.5 },
  tube:   { cx: 0,  brandY: -80, nameY: -69, nameSize: 9.6,  nameW: 38, burstY: -45, burstR: 17.5, ribY: -26, ribW: 40, ribH: 8,   weightY: -12 },
  box:    { cx: -7, brandY: -80, nameY: -69, nameSize: 10.5, nameW: 46, burstY: -44, burstR: 20,   ribY: -24, ribW: 48, ribH: 8.5, weightY: -10 },
  can:    { cx: 0,  brandY: -77.5, nameY: -66, nameSize: 9.4, nameW: 35, burstY: -44, burstR: 15.5, ribY: -27, ribW: 40, ribH: 8,   weightY: -12 },
  bottle: { cx: 0,  brandY: -60, nameY: -50, nameSize: 9,    nameW: 34, burstY: -35, burstR: 12,   ribY: -26, ribW: 36, ribH: 7,   weightY: -14 },
};

function face(x, o, g) {
  const { c1, c2 } = o;
  const light = lum(c1) > .6;
  const ink = light ? "#1b1030" : "#ffffff", out = light ? tint(c1, .6) : shade(c1, .62);
  const pts = [];
  for (let k = 0; k < 28; k++) { const r = g.burstR * (k % 2 ? .84 : 1), a = k / 28 * Math.PI * 2; pts.push(`${(g.cx + Math.cos(a) * r).toFixed(1)},${(g.burstY + Math.sin(a) * r).toFixed(1)}`); }
  let s = `<path d="M${g.cx - 17} ${g.brandY - 1.3}l2.3 2.3-2.3 2.3-2.3-2.3z" fill="${ink}" opacity=".9"/>${text("CRITCANDY", g.cx + 3, g.brandY + 1.7, 4.4, { fill: ink, op: .9, w: 24 })}`;
  s += `<polygon points="${pts.join(" ")}" fill="${x.vert(c2)}" stroke="${tint(c2, .55)}" stroke-width=".8" stroke-linejoin="round"/>`;
  s += `<circle cx="${g.cx}" cy="${g.burstY}" r="${(g.burstR * .8).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>`;
  s += `<g transform="translate(${g.cx} ${g.burstY})">${cluster(x, o.icon, o.pieces, g.burstR / 22)}</g>`;
  s += text(o.label, g.cx, g.nameY, g.nameSize, { fill: ink, w: g.nameW, stroke: out, sw: g.nameSize * .17 });
  const rx = g.cx - g.ribW / 2;
  s += `<rect x="${rx}" y="${g.ribY}" width="${g.ribW}" height="${g.ribH}" rx="1.6" fill="${shade(c1, .55)}" stroke="${tint(c2, .3)}" stroke-width=".6"/>`;
  s += text(o.sub, g.cx, g.ribY + g.ribH * .7, g.ribH * .52, { fill: "#fff", w: g.ribW - 6 });
  if (o.weight) s += text(o.weight, g.cx, g.weightY, 4.3, { fill: ink, weight: 700, italic: false, op: .85 });
  return s;
}

/* Knitter an Ober-/Unterkante von Folienverpackungen */
function crimp(x1, x2, y1, y2, c, step = 3) {
  let s = "";
  for (let px = x1; px <= x2; px += step) s += `M${px.toFixed(1)} ${y1}V${y2}`;
  return `<path d="${s}" stroke="${shade(c, .35)}" stroke-opacity=".38" stroke-width=".8" fill="none"/>`;
}

/* ============================================================
   Verpackungen – Ursprung unten Mitte, Höhe ca. 100
   ============================================================ */
const PACK = {
  pouch(x, o) {
    const c1 = o.c1, body = "M-37-100H37C43-74 42-34 36-7Q0 5-36-7C-42-34-43-74-37-100Z", clip = x.clip(body);
    return `<path d="${body}" fill="${x.cyl(c1)}"/><g clip-path="url(#${clip})">
      <rect x="-44" y="-101" width="88" height="11.5" fill="${x.vert(tint(c1, .22))}"/>${crimp(-38, 38, -100, -89, c1, 3.1)}
      <rect x="-44" y="-88.4" width="88" height="2.4" fill="#fff" opacity=".34"/><rect x="-44" y="-86" width="88" height="1.1" fill="#000" opacity=".16"/>
      <path d="M33-100l5 0 0 7z" fill="#000" opacity=".18"/>
      ${face(x, o, G.pouch)}
      <path d="M-32-23C-22-19-10-27 2-21S22-19 34-25" stroke="#fff" stroke-opacity=".1" fill="none" stroke-width="1.4"/>
      <path d="M-34-33C-24-29-12-37 0-31S22-29 34-35" stroke="#000" stroke-opacity=".08" fill="none" stroke-width="1.4"/>
      <rect x="-35" y="-97" width="7" height="92" rx="3.5" fill="${x.lin([[0, "#fff", .55], [1, "#fff", 0]])}"/>
      <polygon points="-6,-100 12,-100 -16,-6 -34,-6" fill="#fff" opacity=".09"/><polygon points="18,-100 23,-100 5,-6 0,-6" fill="#fff" opacity=".07"/>
      <rect x="-44" y="-18" width="88" height="22" fill="${x.lin([[0, "#000", 0], [1, "#000", .4]], 0, 0, 0, 1)}"/></g>
      <path d="${body}" fill="none" stroke="${shade(c1, .55)}" stroke-opacity=".55" stroke-width=".7"/>`;
  },

  chipbag(x, o) {
    const c1 = o.c1, body = "M-40-106H40C46-86 48-66 44-54 48-40 46-20 40-2H-40C-46-20-48-40-44-54-48-66-46-86-40-106Z", clip = x.clip(body);
    const foil = x.lin([[0, shade(c1, .52)], [.08, c1], [.2, tint(c1, .5)], [.33, c1], [.5, tint(c1, .14)], [.68, shade(c1, .2)], [.84, tint(c1, .3)], [1, shade(c1, .56)]]);
    return `<g transform="rotate(-2)"><path d="${body}" fill="${foil}"/><g clip-path="url(#${clip})">
      <rect x="-48" y="-107" width="96" height="12" fill="${x.vert(shade(c1, .06))}"/>${crimp(-42, 42, -106, -94, c1, 2.8)}
      <rect x="-48" y="-13" width="96" height="12" fill="${x.vert(shade(c1, .06))}"/>${crimp(-42, 42, -13, -1, c1, 2.8)}
      ${face(x, o, G.chip)}
      <path d="M-40-92C-30-88-10-96 0-91S28-88 40-94" stroke="#fff" stroke-opacity=".16" fill="none" stroke-width="1.4"/>
      <path d="M-42-20C-30-24-12-16 0-21S30-24 42-18" stroke="#fff" stroke-opacity=".14" fill="none" stroke-width="1.4"/>
      <rect x="-41" y="-101" width="6" height="94" rx="3" fill="${x.lin([[0, "#fff", .5], [1, "#fff", 0]])}"/>
      <polygon points="-2,-106 14,-106 -12,-2 -28,-2" fill="#fff" opacity=".1"/>
      <rect x="-48" y="-14" width="96" height="14" fill="${x.lin([[0, "#000", 0], [1, "#000", .32]], 0, 0, 0, 1)}"/></g>
      <path d="${body}" fill="none" stroke="${shade(c1, .55)}" stroke-opacity=".55" stroke-width=".7"/></g>`;
  },

  tube(x, o) {
    const c1 = o.c1, c2 = o.c2, body = "M-22-90H22V-6Q22-1 17-1H-17Q-22-1-22-6Z", clip = x.clip(body);
    return `<path d="${body}" fill="${x.cyl(c1)}"/><g clip-path="url(#${clip})">${face(x, o, G.tube)}
      <rect x="-22" y="-6" width="44" height="6" fill="${x.metal()}"/>
      <rect x="-19" y="-88" width="6" height="84" rx="3" fill="${x.lin([[0, "#fff", .5], [1, "#fff", 0]])}"/></g>
      <rect x="-23.5" y="-98" width="47" height="9" rx="3" fill="${x.cyl(c2)}"/><ellipse cx="0" cy="-98" rx="23.5" ry="3" fill="${tint(c2, .35)}"/>
      <ellipse cx="0" cy="-98.4" rx="19" ry="1.8" fill="${shade(c2, .18)}"/><rect x="-20" y="-96" width="5" height="6" rx="2" fill="#fff" opacity=".3"/>`;
  },

  box(x, o) {
    const c1 = o.c1, front = "M-34-88H20V0H-34Z", side = "M20-88L34-94V-6L20 0Z", top = "M-34-88H20L34-94H-20Z";
    return `<path d="${side}" fill="${x.lin([[0, shade(c1, .42)], [1, shade(c1, .6)]])}"/><path d="${top}" fill="${x.lin([[0, tint(c1, .55)], [1, tint(c1, .25)]])}"/>
      <path d="${front}" fill="${x.lin([[0, tint(c1, .12)], [.5, c1], [1, shade(c1, .22)]], 0, 0, 1, .4)}"/><g clip-path="url(#${x.clip(front)})">${face(x, o, G.box)}
      <rect x="-31" y="-86" width="6" height="84" rx="3" fill="${x.lin([[0, "#fff", .45], [1, "#fff", 0]])}"/>
      <rect x="-34" y="-12" width="54" height="12" fill="${x.lin([[0, "#000", 0], [1, "#000", .25]], 0, 0, 0, 1)}"/></g>
      <path d="M20-88V0M-34-88H20" stroke="#fff" stroke-opacity=".3" stroke-width=".7" fill="none"/>
      <path d="M-34-88H20L34-94H-20Z M20-88L34-94V-6L20 0Z M-34-88H20V0H-34Z" fill="none" stroke="${shade(c1, .6)}" stroke-opacity=".5" stroke-width=".6" stroke-linejoin="round"/>`;
  },

  can(x, o) {
    const c1 = o.c1, body = "M-23-79V-7Q-23-1-17-1H17Q23-1 23-7V-79Q23-83 19-84.5L16-86H-16L-19-84.5Q-23-83-23-79Z", clip = x.clip(body);
    let drops = "";
    for (let k = 0; k < 16; k++) { const r = .6 + rnd(k * 3) * 1.2, dx = -20 + rnd(k) * 40, dy = -72 + rnd(k * 5 + 1) * 64;
      drops += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity=".24"/><circle cx="${(dx - r * .3).toFixed(1)}" cy="${(dy - r * .35).toFixed(1)}" r="${(r * .38).toFixed(2)}" fill="#fff" opacity=".8"/>`; }
    return `<path d="${body}" fill="${x.cyl(c1)}"/><g clip-path="url(#${clip})">
      <polygon points="-24,-58 24,-72 24,-30 -24,-16" fill="${x.vert(o.c2)}" opacity=".55"/>
      ${face(x, o, G.can)}
      <rect x="-20" y="-78" width="7" height="72" rx="3.5" fill="${x.lin([[0, "#fff", .55], [1, "#fff", 0]])}"/><rect x="16.5" y="-78" width="2.2" height="72" rx="1" fill="#fff" opacity=".22"/>
      <rect x="-24" y="-5" width="48" height="5" fill="${x.metal()}"/>${drops}</g>
      <path d="M-19-84.5Q0-81.5 19-84.5V-82Q0-79-19-82Z" fill="${x.metal()}"/>
      <ellipse cx="0" cy="-86" rx="16.5" ry="3.8" fill="${x.metal()}"/><ellipse cx="0" cy="-86.3" rx="13.6" ry="2.9" fill="#aeb3bc"/>
      <path d="M-7-87.4Q0-89 7-87.4V-85.6Q0-84-7-85.6Z" fill="#d7dbe2" stroke="#7d828c" stroke-width=".3"/><circle cx="-4" cy="-86.6" r="1.4" fill="none" stroke="#7d828c" stroke-width=".7"/>`;
  },

  bottle(x, o) {
    const liq = o.c1, lab = o.c2, body = "M-7-98H7V-91C7-83 19-80 19-64V-8Q19-1 13-1H-13Q-19-1-19-8V-64C-19-80-7-83-7-91Z", clip = x.clip(body);
    const lo = { ...o, c1: lab, c2: liq };
    return `<path d="${body}" fill="${x.lin([[0, shade(liq, .42)], [.16, liq], [.36, tint(liq, .45)], [.6, liq], [.9, shade(liq, .3)], [1, shade(liq, .52)]])}"/><g clip-path="url(#${clip})">
      <rect x="-20" y="-70" width="40" height="46" fill="${x.cyl(lab)}"/>${face(x, lo, G.bottle)}
      <ellipse cx="0" cy="-1" rx="19" ry="3.4" fill="#000" opacity=".28"/>
      <rect x="-16" y="-88" width="5" height="82" rx="2.5" fill="${x.lin([[0, "#fff", .6], [1, "#fff", 0]])}"/><rect x="13" y="-84" width="2" height="76" rx="1" fill="#fff" opacity=".22"/></g>
      <rect x="-8.4" y="-93" width="16.8" height="2.2" rx="1" fill="#fff" opacity=".55"/>
      <rect x="-7.8" y="-106" width="15.6" height="9" rx="2" fill="${x.cyl(lab)}"/><path d="M-5.6-105.4v7.8M-2.4-105.4v7.8M.8-105.4v7.8M4-105.4v7.8" stroke="#000" stroke-opacity=".22" stroke-width=".8"/>`;
  },

  bars(x, o) {
    const wrap = (oo, rot, px, py) => {
      const c1 = oo.c1, c2 = oo.c2, light = lum(c1) > .6, ink = light ? "#1b1030" : "#fff", out = light ? tint(c1, .6) : shade(c1, .62);
      const fin = (sgn) => `<path d="M${sgn * 44}-14L${sgn * 49}-12 ${sgn * 50}-8 ${sgn * 49}-4 ${sgn * 50} 0 ${sgn * 49} 4 ${sgn * 50} 8 ${sgn * 49} 12 ${sgn * 44} 14Z" fill="${tint(c1, .22)}" stroke="${shade(c1, .4)}" stroke-width=".5"/>`;
      return `<g transform="translate(${px} ${py}) rotate(${rot})">${fin(-1)}${fin(1)}
        <rect x="-44" y="-14" width="88" height="28" rx="2.5" fill="${x.lin([[0, tint(c1, .5)], [.45, c1], [1, shade(c1, .4)]], 0, 0, 0, 1)}"/>
        <rect x="-44" y="-14" width="88" height="28" rx="2.5" fill="${x.lin([[0, "#fff", 0], [.3, "#fff", .22], [.45, "#fff", 0], [.7, "#fff", .12], [1, "#fff", 0]], 0, 0, 1, .3)}"/>
        <path d="M${-37} -12.4l2.2 2.2-2.2 2.2-2.2-2.2z" fill="${ink}" opacity=".9"/>${text("CRITCANDY", -23, -9.6, 3.6, { fill: ink, op: .9, w: 20 })}
        ${text(oo.label, -41, 2, 10, { fill: ink, anchor: "start", w: 50, stroke: out, sw: 1.5 })}
        <rect x="-41" y="5.6" width="50" height="6.4" rx="1.3" fill="${shade(c1, .55)}"/>${text(oo.sub, -16, 10.3, 3.8, { fill: "#fff", w: 44 })}
        <g transform="translate(26 0)"><circle r="12.5" fill="${x.vert(c2)}" stroke="${tint(c2, .5)}" stroke-width=".7"/>${piece(x, oo.icon, oo.pieces, 0, 0, 0, .8, -12, false)}</g>
        ${oo.weight ? text(oo.weight, 26, 12.2, 3.4, { fill: ink, weight: 700, italic: false, op: .85 }) : ""}
        <path d="M-44-14H44" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/></g>`;
    };
    const o2 = { ...o, c1: mix(o.c1, o.c2, .55), c2: o.c1 };
    return wrap(o2, 8, -4, -42) + wrap(o, -13, 2, -18);
  },

  cup(x, o) {
    const c1 = o.c1, c2 = o.c2, body = "M-31-58H31L22-3Q22 0 19 0H-19Q-22 0-22-3Z", clip = x.clip(body);
    return `<g filter="url(#${x.soft})" opacity=".3"><path d="M-6-68Q-12-78-4-86T-4-102M6-68Q0-78 8-86T8-100" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>
      <path d="${body}" fill="${x.cyl(c1)}"/><g clip-path="url(#${clip})">
      <rect x="-32" y="-58" width="64" height="11" fill="${x.vert(c2)}"/><path d="M-32-47Q-16-42 0-47T32-47" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
      ${face(x, o, { cx: 0, brandY: -46.5, nameY: -35.5, nameSize: 8.4, nameW: 34, burstY: -22, burstR: 11, ribY: -12.4, ribW: 36, ribH: 6.4, weightY: -2 })}
      <rect x="-27" y="-56" width="6" height="55" rx="3" fill="${x.lin([[0, "#fff", .5], [1, "#fff", 0]])}"/>
      <rect x="-32" y="-8" width="64" height="9" fill="${x.lin([[0, "#000", 0], [1, "#000", .35]], 0, 0, 0, 1)}"/></g>
      <ellipse cx="0" cy="-58" rx="33" ry="6.6" fill="${x.cyl(tint(c2, .1))}"/><ellipse cx="0" cy="-58.4" rx="30.4" ry="5.4" fill="${x.metal()}"/>
      <ellipse cx="0" cy="-58.8" rx="26" ry="3.9" fill="${x.lin([[0, "#fff"], [1, "#cdd2da"]], 0, 0, 1, 1)}"/><path d="M12-61.6Q31-66 33.4-57.6Q22-56 12-58.2Z" fill="${x.metal()}" stroke="#8a8f98" stroke-width=".4"/>
      <circle cx="-8" cy="-59" r="2" fill="${c2}" opacity=".85"/>`;
  },

  tin(x, o) {
    const c1 = o.c1, c2 = o.c2, light = lum(c1) > .6, ink = light ? "#1b1030" : "#fff";
    return `<rect x="-34" y="-27" width="68" height="27" rx="3.5" fill="${x.cyl(c1)}"/><rect x="-34" y="-6" width="68" height="6" rx="2.5" fill="${x.metal()}" opacity=".92"/>
      <rect x="-34" y="-27" width="68" height="5" fill="${x.metal()}" opacity=".88"/><rect x="-30" y="-21" width="6" height="16" rx="3" fill="#fff" opacity=".38"/>
      <ellipse cx="0" cy="-27" rx="34.5" ry="10.4" fill="${x.metal()}"/><ellipse cx="0" cy="-27.6" rx="32" ry="9.2" fill="${x.rad([[0, tint(c1, .38)], [1, shade(c1, .16)]], .4, .35, .75)}"/>
      <g transform="translate(0 -27.6) scale(1 .3)"><circle r="26" fill="${x.vert(c2)}" stroke="${tint(c2, .5)}" stroke-width="1.2"/>
        ${text(o.label, 0, 5, 15, { fill: ink, w: 44, stroke: lum(c2) > .6 ? tint(c2, .6) : shade(c2, .6), sw: 2.4 })}</g>
      <path d="M-25-30Q-8-40 15-37" stroke="#fff" stroke-opacity=".55" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  },

  sachets(x, o) {
    const stick = (c, ang, px) => {
      const body = "M-9-70H9V0H-9Z";
      let z1 = "", z2 = "";
      for (let k = -9; k <= 9; k += 2) { z1 += `M${k}-70v7`; z2 += `M${k}-7v7`; }
      const light = lum(c) > .6, ink = light ? "#1b1030" : "#fff";
      return `<g transform="translate(${px} 0) rotate(${ang} 0 0)"><path d="${body}" fill="${x.cyl(c)}"/>
        <path d="${z1}${z2}" stroke="${shade(c, .35)}" stroke-opacity=".4" stroke-width=".8"/>
        <rect x="-9" y="-70" width="18" height="7" fill="#fff" opacity=".12"/>
        <rect x="-9" y="-44" width="18" height="14" fill="${x.vert(o.c2)}" opacity=".9"/>
        <g transform="translate(0 -37)">${piece(x, o.icon, o.pieces, 0, 0, 0, .55, 0, false)}</g>
        <g transform="translate(0 -22) rotate(-90)">${text(o.label, 0, 2.6, 7, { fill: ink, w: 34 })}</g>
        <rect x="-7" y="-68" width="2.6" height="66" rx="1.3" fill="#fff" opacity=".4"/></g>`;
    };
    return stick(shade(o.c1, .1), -16, -17) + stick(mix(o.c1, o.c2, .5), 16, 17) + stick(o.c1, 0, 0);
  },
};

/* Platzierung: Position (x, y-Boden), Größe, Schattenbreite, Zwilling (zweite Dose), Streugut */
const TYPES = {
  pouch:   { pos: [86, 132, 1.0],  sh: 40, spill: [142, 127] },
  chipbag: { pos: [86, 132, .98],  sh: 42, spill: [144, 127] },
  tube:    { pos: [84, 132, 1.0],  sh: 24, spill: [136, 127] },
  box:     { pos: [82, 132, 1.0],  sh: 44, spill: [140, 127] },
  can:     { pos: [78, 132, 1.12], sh: 24, twin: [28, -5] },
  bottle:  { pos: [78, 132, 1.0],  sh: 22, twin: [30, -4] },
  bars:    { pos: [96, 128, 1.0],  sh: 54, spill: [148, 130] },
  cup:     { pos: [88, 131, 1.38], sh: 36 },
  tin:     { pos: [80, 130, 1.38], sh: 46, spill: [146, 128] },
  sachets: { pos: [82, 132, 1.25], sh: 36, spill: [146, 127] },
};

const SPILL = [[0, 0, 24, 1.1, 0], [-17, 3, -32, 1.05, 1], [15, -1, 62, 1.0, 2], [3, -13, -12, .95, 3], [-9, -11, 48, .9, 4]];
function spill(x, o, at) {
  const k = SPILL_SCALE[o.icon] || 1;
  return [...SPILL].sort((a, b) => a[1] - b[1]).map(([dx, dy, rot, s, i]) =>
    piece(x, o.icon, o.pieces, i, at[0] + dx * (k > 1 ? 1.15 : 1), at[1] + dy, s * k, rot, true)).join("");
}

function normalize(p) {
  const col = p.colors || [];
  const c1 = col[0] || "#8b5cff", c2 = col[1] || "#ffd23f";
  const label = (p.label || (p.name || "").split(/[\s-]/)[0]).toUpperCase();
  return { type: p.pack || "pouch", c1, c2, label, sub: (p.sub || "").toUpperCase(), icon: p.icon || "chip", weight: p.weight || "",
    pieces: p.pieces && p.pieces.length ? p.pieces : [c2, tint(c1, .45), shade(c1, .15)] };
}

function single(x, p) {
  const o = normalize(p), T = TYPES[o.type] || TYPES.pouch, draw = PACK[o.type] || PACK.pouch;
  const [px, py, sc] = T.pos;
  let s = `<ellipse cx="100" cy="134" rx="78" ry="10" fill="#fff" opacity=".05"/>`;
  s += `<ellipse cx="${px + 5}" cy="${py + 1}" rx="${T.sh}" ry="${(T.sh * .14).toFixed(1)}" fill="#000" opacity=".5" filter="url(#${x.blur})"/>`;
  if (T.twin) {
    const o2 = { ...o, c1: mix(o.c1, o.c2, .5), c2: o.c1 };
    s += `<ellipse cx="${px + T.twin[0] + 5}" cy="${py + T.twin[1] + 1}" rx="${T.sh}" ry="${(T.sh * .14).toFixed(1)}" fill="#000" opacity=".4" filter="url(#${x.blur})"/>`;
    s += `<g transform="translate(${px + T.twin[0]} ${py + T.twin[1]}) scale(${(sc * .95).toFixed(3)})">${draw(x, o2)}</g>`;
  }
  s += `<g transform="translate(${px} ${py}) scale(${sc})">${draw(x, o)}</g>`;
  if (T.spill) s += spill(x, o, T.spill);
  return s;
}

/* ---------- Kiste mit Fragezeichen (Loot-Box) ---------- */
function loot(x, p) {
  const o = normalize(p), a = o.c1, b = o.c2, c = o.pieces[0] || "#ffd23f";
  const s = 42, h = s * .58, d = s * 1.12, cx = 100, cy = 138 - h - d;
  const top = `${cx},${cy - h} ${cx + s},${cy} ${cx},${cy + h} ${cx - s},${cy}`, left = `${cx - s},${cy} ${cx},${cy + h} ${cx},${cy + h + d} ${cx - s},${cy + d}`, right = `${cx + s},${cy} ${cx},${cy + h} ${cx},${cy + h + d} ${cx + s},${cy + d}`;
  const sp = (px, py, k) => `<path transform="translate(${px} ${py}) scale(${k})" fill="${c}" d="M0-9 2.5-2.5 9 0 2.5 2.5 0 9-2.5 2.5-9 0-2.5-2.5z"/>`;
  const q = (px, sk, op) => `<text transform="translate(${px} ${cy + h / 2 + d / 2 + 3}) skewY(${sk})" text-anchor="middle" dominant-baseline="central" font-size="46" font-weight="900" font-family='${FONT}' fill="${c}" fill-opacity="${op}" stroke="#000" stroke-opacity=".3" stroke-width="2" paint-order="stroke">?</text>`;
  let s2 = `<circle cx="100" cy="92" r="64" fill="${x.rad([[0, b, .5], [1, b, 0]])}"/>`;
  s2 += `<ellipse cx="102" cy="139" rx="52" ry="7" fill="#000" opacity=".5" filter="url(#${x.blur})"/>`;
  s2 += `<polygon points="${left}" fill="${x.lin([[0, tint(a, .1)], [1, shade(a, .22)]], 0, 0, 1, 1)}"/><polygon points="${right}" fill="${x.lin([[0, shade(a, .4)], [1, shade(a, .62)]], 0, 0, 1, 1)}"/>`;
  s2 += `<polygon points="${top}" fill="${x.lin([[0, tint(a, .6)], [1, tint(a, .25)]], 0, 0, 1, 1)}"/>`;
  s2 += `<polygon points="${cx},${cy - h * .6} ${cx + s * .6},${cy} ${cx},${cy + h * .6} ${cx - s * .6},${cy}" fill="${x.vert(b)}" stroke="${tint(b, .5)}" stroke-width=".8"/>`;
  s2 += `<path d="M${cx - s} ${cy}L${cx} ${cy + h} ${cx + s} ${cy}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>`;
  s2 += q(cx - s / 2, 30, 1) + q(cx + s / 2, -30, .85);
  for (const [vx, vy] of [[cx - s, cy], [cx + s, cy], [cx, cy + h], [cx, cy + h + d], [cx - s, cy + d], [cx + s, cy + d]]) s2 += `<circle cx="${vx}" cy="${vy}" r="2.2" fill="${x.metal()}" stroke="#555" stroke-width=".3"/>`;
  const floats = [["bear", 38, 62, -18], ["chip", 164, 56, 22], ["bottle", 30, 100, 14], ["popcorn", 170, 100, -10], ["gamepad", 100, 12, 8]];
  const pal = [[a, b, c], [c, b, tint(a, .3)]];
  for (const [ic, fx, fy, r] of floats) s2 += piece(x, ic, FIXED.has(ic) ? (ic === "chip" ? ["#f0b429", "#d9481f"] : ["#fff1c6", "#e8a33a"]) : pal[0], 1, fx, fy, (SPILL_SCALE[ic] || 1) * .95, r, true);
  s2 += sp(60, 30, 1.3) + sp(150, 30, 1.7) + sp(176, 128, 1.1) + sp(24, 128, 1.4);
  return s2;
}

/* ---------- Sets: die enthaltenen Produkte stehen zusammen ---------- */
const SLOTS = {
  1: [[100, 134, 1.0]],
  2: [[70, 134, .92], [130, 134, .92]],
  3: [[44, 130, .72], [156, 130, .72], [100, 136, .9]],
  4: [[38, 128, .66], [162, 128, .66], [72, 135, .84], [128, 135, .84]],
  5: [[34, 126, .6], [166, 126, .6], [68, 132, .76], [132, 132, .76], [100, 137, .9]],
  6: [[34, 125, .56], [166, 125, .56], [60, 131, .7], [140, 131, .7], [89, 137, .82], [119, 137, .82]],
};

function bundle(x, p, byId) {
  const seen = new Set(), items = [];
  for (const id of p.includes) if (!seen.has(id) && byId[id]) { seen.add(id); items.push(byId[id]); }
  const picks = items.slice(0, 6), slots = SLOTS[Math.max(1, picks.length)];
  let s = `<ellipse cx="100" cy="136" rx="84" ry="11" fill="#fff" opacity=".05"/>`;
  picks.forEach((it, k) => {
    const o = normalize(it), draw = PACK[o.type] || PACK.pouch, [px, py, sc] = slots[k], T = TYPES[o.type] || TYPES.pouch;
    s += `<ellipse cx="${px + 3}" cy="${py + 1}" rx="${(T.sh * sc).toFixed(1)}" ry="${(T.sh * sc * .16).toFixed(1)}" fill="#000" opacity=".5" filter="url(#${x.blur})"/>`;
    s += `<g transform="translate(${px} ${py}) scale(${(sc * (T.pos[2])).toFixed(3)})">${draw(x, o)}</g>`;
  });
  return s;
}

/* ============================================================
   Öffentliche Funktion
   ============================================================ */
function render(p, byId) {
  if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`;
  const x = makeCtx();
  let inner;
  if (Array.isArray(p.includes) && p.includes.length) inner = bundle(x, p, byId || {});
  else if (p.pack === "loot") inner = loot(x, p);
  else inner = single(x, p);
  return `<svg viewBox="0 0 200 160" role="img" aria-label="${esc(p.name)}"><defs>${x.defs.join("")}</defs>${inner}</svg>`;
}

window.CritArt = { render };
})();
