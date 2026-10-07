'use strict';
/* =====================================================================
   KNALLMANIA – Feuerwerks-Sandbox
   00_core: Helfer, Zustand, Renderer, Szene, Kamera
   ===================================================================== */
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const rsign = () => Math.random() < .5 ? -1 : 1;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pick = a => a[(Math.random() * a.length) | 0];
const C = hex => new THREE.Color(hex).convertSRGBToLinear();
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const $ = id => document.getElementById(id);

const IS_TOUCH = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && matchMedia('(pointer:coarse)').matches;
const IS_MOBILE = IS_TOUCH || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

/* ---------- Rauschen (für Gelände & Texturen) ---------- */
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), ux), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), ux), uy);
}
function fbm(x, y, o = 4) { let a = .5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return s; }

/* ---------- Globaler Spielzustand ---------- */
const G = {
  time: 0,            // Simulationszeit (Zeitlupe-skaliert)
  real: 0,
  timeScale: 1, targetScale: 1,
  score: 0, destroyed: 0, lit: 0,
  started: false, frozen: false, hud: true, menu: null,
  wind: new THREE.Vector3(1.6, 0, 0.7), windK: .3,
  trauma: 0, flash: 0, ring: 0, kick: 0,
  sens: 1, fov: 72, bloom: 1, vol: .8,
  fly: false, torch: false
};

/* ---------- Qualitätsstufen ---------- */
const QUALITY = {
  low:   { pr: 1,   shadows: false, msaa: 0, dens: .5,  pool: 45000,  smoke: 3500,  shadowSize: 1024, bloom: true },
  mid:   { pr: 1,   shadows: true,  msaa: 0, dens: .8,  pool: 100000, smoke: 6000,  shadowSize: 1024, bloom: true },
  high:  { pr: Math.min(window.devicePixelRatio || 1, 1.5), shadows: true, msaa: 4, dens: 1, pool: 160000, smoke: 8000, shadowSize: 2048, bloom: true },
  ultra: { pr: Math.min(window.devicePixelRatio || 1, 2),   shadows: true, msaa: 4, dens: 1.35, pool: 240000, smoke: 10000, shadowSize: 4096, bloom: true }
};
let savedQ = null; try { savedQ = localStorage.getItem('knall_q'); } catch (e) { }
let qName = new URLSearchParams(location.search).get('q') || savedQ || (IS_MOBILE ? 'low' : 'high');
if (!QUALITY[qName]) qName = 'high';
let Q = QUALITY[qName];

/* ---------- Renderer / Szene / Kamera ---------- */
const canvas = $('c');
{ const t = document.createElement('canvas');
  if (!(t.getContext('webgl2') || t.getContext('webgl'))) {
    document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;color:#fff;font:18px system-ui;text-align:center;padding:24px"><div><h1 style="font-size:42px;margin:0 0 12px">💥 Knallmania</h1>Dein Browser unterstützt kein WebGL – bitte aktuellen Chrome, Edge, Firefox oder Safari verwenden (Hardware-Beschleunigung an).</div></div>';
    throw new Error('WebGL nicht verfügbar');
  } }
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
renderer.outputEncoding = THREE.LinearEncoding;
renderer.toneMapping = THREE.NoToneMapping;
renderer.autoClear = false;
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = Q.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Q.pr);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(C(0x0b1428), 0.0048);
const camera = new THREE.PerspectiveCamera(G.fov, 1, 0.05, 1600);
camera.rotation.order = 'YXZ';
scene.add(camera);

/* ---------- Texturen & Material-Helfer ---------- */
function canvasTexture(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.encoding = o.linear ? THREE.LinearEncoding : THREE.sRGBEncoding;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.anisotropy = 4;
  return t;
}
function M(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: C(color), roughness: o.rough ?? .8, metalness: o.metal ?? 0 });
  if (o.map) { m.map = o.map; m.color.set(0xffffff); }
  if (o.emissive !== undefined) { m.emissive = C(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.transparent) { m.transparent = true; m.opacity = o.opacity ?? .6; m.depthWrite = false; }
  if (o.side) m.side = o.side;
  return m;
}
function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true; return m;
}

/* Gleiche (indizierte) Geometrien mit Vertexfarben zu einer verschmelzen */
function mergeGeos(parts) {
  const pos = [], nor = [], col = [], idx = []; let off = 0; const v = new THREE.Vector3();
  for (const p of parts) {
    const g = p.geo, m = p.matrix || new THREE.Matrix4(), nm = new THREE.Matrix3().getNormalMatrix(m);
    const P = g.attributes.position, N = g.attributes.normal, c = p.color || new THREE.Color(1, 1, 1);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
      col.push(c.r, c.g, c.b);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.array[i] + off);
    else for (let i = 0; i < P.count; i++) idx.push(off + i);
    off += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}

/* ---------- Zeitplaner (läuft in Simulationszeit, also auch in Zeitlupe korrekt) ---------- */
const Sched = {
  q: [],
  at(t, fn) { this.q.push({ t, fn }); },
  after(dt, fn) { this.q.push({ t: G.time + dt, fn }); },
  run() {
    const q = this.q; if (!q.length) return;
    const due = [];
    for (let i = q.length - 1; i >= 0; i--) if (q[i].t <= G.time) { due.push(q[i]); q.splice(i, 1); }
    if (due.length) { due.sort((a, b) => a.t - b.t); for (const d of due) { try { d.fn(d.t); } catch (e) { console.error(e); } } }
  },
  clear() { this.q.length = 0; }
};

/* ---------- Kleine UI-Helfer ---------- */
let toastTimer = 0;
function toast(msg, ms = 1800) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}
