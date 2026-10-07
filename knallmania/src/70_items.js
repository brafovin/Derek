/* =====================================================================
   70_items: Feuerwerks-Katalog, Zündlogik, Verhalten jedes Artikels, Objekte
   ===================================================================== */
const DEFS = [], BYID = {};
const CATS = [
  { id: 'boeller', name: '💥 Böller' }, { id: 'ketten', name: '🧨 Ketten' }, { id: 'raketen', name: '🚀 Raketen' },
  { id: 'batterien', name: '🎆 Batterien' }, { id: 'fontaenen', name: '⛲ Fontänen' }, { id: 'moerser', name: '🎇 Mörser' },
  { id: 'spezial', name: '🌀 Spezial' }, { id: 'objekte', name: '🧱 Objekte' }
];
function def(d) { DEFS.push(d); BYID[d.id] = d; return d; }

/* ---------- Item-Klasse ---------- */
const Items = { list: [], spent: [] };
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const ITEM_SCALE = 1.6;   // Feuerwerk etwas größer als echt – besser sichtbar & anfassbar

class Item {
  constructor(d, pos, yaw = 0, o = {}) {
    this.def = d; const m = this.model = d.build();
    this.group = m.group; this.state = 'idle'; this.t = 0; this.fuseT = 0; this.fuseMax = 1;
    const body = new CANNON.Body({ mass: d.mass });
    const S = ITEM_SCALE; this.group.scale.setScalar(S);
    for (const s of m.shapes) body.addShape(s.radius ? new CANNON.Sphere(s.radius * S) : new CANNON.Box(new CANNON.Vec3(s.half[0] * S, s.half[1] * S, s.half[2] * S)), s.off ? new CANNON.Vec3(s.off[0] * S, s.off[1] * S, s.off[2] * S) : undefined);
    body.position.set(pos.x, pos.y, pos.z);
    if (o.quat) body.quaternion.set(o.quat.x, o.quat.y, o.quat.z, o.quat.w); else body.quaternion.setFromEuler(0, yaw, 0, 'XYZ');
    this.body = body;
    this.thing = { kind: 'item', body, group: this.group, item: this, tough: true, hp: 99, rad: .25 * S, name: d.name, metal: false };
    this.group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    Phys.addThing(this.thing);
    Items.list.push(this);
    this.tip = m.tip || V3(0, .1, 0);
  }
  get alive() { return !this.thing.dead; }
  wpos(v) { this.group.updateMatrixWorld(true); return this.group.localToWorld(v.clone()); }
  wdir(x = 0, y = 1, z = 0) { return V3(x, y, z).normalize().applyQuaternion(this.group.quaternion); }
  tipWorld() { return this.wpos(this.tip); }
  ignite(delay) {
    if (this.state !== 'idle' || !this.alive) return false;
    this.state = 'fuse'; this.fuseMax = this.fuseT = delay !== undefined ? delay : this.def.fuse * rand(.92, 1.12);
    G.lit++;
    if (this.fuseT > .15) SFX.fuse(this.tipWorld(), this.fuseT);
    return true;
  }
  update(dt) {
    if (this.state === 'fuse') {
      this.fuseT -= dt;
      FX.fuseSpark(this.tipWorld(), dt);
      if (this.fuseT <= 0) { this.state = 'active'; this.t = 0; this.def.fire(this); }
    } else if (this.state === 'active' && this.upd) { this.t += dt; this.upd(dt); }
  }
  finish() {
    if (this.state === 'spent') return; this.state = 'spent'; this.upd = null;
    this.group.traverse(c => { if (c.isMesh && c.material) { const mm = Array.isArray(c.material) ? c.material : [c.material]; c.material = mm.map(x => { if (x.userData.burnt) return x; const n = x.clone(); n.color.multiplyScalar(.28); n.userData.burnt = true; return n; }); if (c.material.length === 1) c.material = c.material[0]; } });
    Items.spent.push(this);
    while (Items.spent.length > 40) { const o = Items.spent.shift(); if (o.alive) Phys.removeThing(o.thing); }
  }
  finishAt(sec) { Sched.after(sec, () => this.finish()); }
  remove() { Phys.removeThing(this.thing); }
}
Items.update = dt => {
  for (let i = Items.list.length - 1; i >= 0; i--) {
    const it = Items.list[i];
    if (!it.alive) { Items.list.splice(i, 1); continue; }
    if (it.thing.fell) { Phys.removeThing(it.thing); continue; }
    it.update(dt);
  }
};
Items.igniteAll = () => {
  const idle = Items.list.filter(i => i.state === 'idle' && i.alive);
  if (!idle.length) { toast('Nichts zum Zünden da – platziere erst Feuerwerk (B)'); return; }
  idle.forEach((it, i) => Sched.after(i * .45 + rand(0, .1), () => it.ignite(it.def.fuse * .45)));
  toast('💥 Zünd-Sequenz: ' + idle.length + ' Artikel');
};
Items.clear = () => { Items.list.length = 0; Items.spent.length = 0; };

/* ---------- Hilfen für Verhalten ---------- */
const rk = a => a[(Math.random() * a.length) | 0];
const _hc = new THREE.Color();
const WARM = [1, .72, .38];
function dirFromTilt(tx, tz) { return V3(tx, 1, tz).normalize(); }

function shootFrom(item, tb, s) {
  if (!item.alive) return;
  const p = item.wpos(V3(tb.x, item.model.topY + .02, tb.z));
  const d = dirFromTilt(s.tx || 0, s.tz || 0).applyQuaternion(item.group.quaternion);
  FX.muzzle(p, d, s.muz ?? .55); SFX.thump(p, s.big ?? .45);
  const v = d.clone().multiplyScalar(s.speed ?? 34);
  FX.launchShell(p, v, { k: s.k ?? .1, t: s.tb ?? 1.9, spec: s.spec, ignore: item.body, headCol: s.head, headSize: s.hs, tstep: s.tstep });
  item.body.velocity.y += .25 * (s.muz ?? .55); item.body.wakeUp();
}

/* ---- Batterie: Programm = Liste {t, tube, shot} ---- */
function cakeProgram(item, prog) {
  const tubes = item.model.tubes; let last = 0;
  prog(tubes, (t, tb, s) => { last = Math.max(last, t + (s.tb ?? 1.9)); Sched.after(t, () => shootFrom(item, tb, s)); });
  item.finishAt(last + 1.5); item.upd = null;
}
const COLS5 = [PAL.red, PAL.green, PAL.blue, PAL.gold, PAL.purple], COLS7 = [PAL.red, PAL.green, PAL.blue, PAL.gold, PAL.purple, PAL.cyan, PAL.pink];
const RAND_KINDS = ['chrys', 'peony', 'ring', 'multi', 'crossette', 'strobe', 'pistil'];
const cakeSpec = (kind, c, s = .3) => FX.recipe(kind, s, c ? [c] : undefined);
const fanTilt = (q, cols, amp) => ((q / Math.max(1, cols - 1)) - .5) * 2 * Math.tan(amp * DEG);

/* ---- Raketen ---- */
function fireRocket(item, cfg) {
  const m = item.model;
  item.group.updateMatrixWorld(true);
  const p = item.wpos(V3(0, .3, 0));
  const d = item.wdir(rand(-.035, .035) + (cfg.wob || 0) * rand(-1, 1), 1, rand(-.035, .035) + (cfg.wob || 0) * rand(-1, 1));
  const v = d.clone().multiplyScalar(cfg.v), k = cfg.k ?? .2;
  // Rakete im Modell verstecken (Flasche + Stab bleiben)
  item.group.children.forEach((c, i) => { if (i >= 1) c.visible = false; });
  const obj = Mdl.rocketBody(cfg.look); obj.scale.setScalar(ITEM_SCALE);
  const spec = cfg.spec();
  const r = FX.launchShell(p, v, { k, t: cfg.tb, spec, tstep: .03, tspace: .3, headSize: .5, trailSize: .75, trailInt: 2.4, headCol: [1, .85, .5], ignore: item.body, onBurst: cfg.onBurst });
  FX.addProjectile(obj, p, v, k, 9.8, G.time, r.tb);
  SFX.whoosh(p, Math.min(1.5, r.tb), .55); if (cfg.whistle) SFX.whistle(p, r.tb, .4);
  // Abbrand am Start
  const down = d.clone().multiplyScalar(-1);
  for (let i = 0; i < 28 * Q.dens; i++) { rsphere(_v); sp(p.x, p.y, p.z, down.x * rand(3, 9) + _v.x * 2, down.y * rand(3, 9) + _v.y * 2, down.z * rand(3, 9) + _v.z * 2, 1, rand(.5, .8), rand(.2, .4), rand(.06, .12), rand(.2, .5), 1.3, 9.8, 0, .8, 2.2, 0); }
  sp(p.x, p.y, p.z, 0, 0, 0, 1, .7, .35, 1.6, .25, 1, 0, 0, 0, 4, 0); Lights.add(p, 1, .7, .4, 3, 16, .35);
  // Rauchspur
  const pt = {};
  for (let t = .05; t < r.tb; t += .09) { pathAt(p, v, k, 9.8, t, pt); smk(pt.x, pt.y, pt.z, rand(-.3, .3), rand(-.2, .2), rand(-.3, .3), .65, .65, .68, .25, 1.4, rand(4, 7), 1, .1, .32, 1); }
  item.body.velocity.y -= .6; item.body.angularVelocity.set(rand(-1, 1), 0, rand(-1, 1)); item.body.wakeUp();
  item.finishAt(.2); item.upd = null;
}
const ROCKET_LOOK = (c1, nose) => ({ c1, nose, s: 1 });

/* ---- Mörser ---- */
function fireMortar(item, tube, kind, s, extra) {
  if (!item.alive) return;
  const p = item.wpos(V3(tube.x, item.model.topY + .02, tube.z));
  const d = item.wdir(rand(-.02, .02), 1, rand(-.02, .02));
  FX.muzzle(p, d, 1.4 + s * .6); SFX.thump(p, 1 + s * .5);
  const sp0 = 58 + rand(0, 6) + s * 3, k = .075, tb = 3.2 + s * .12 + rand(0, .25);
  const spec = Object.assign(FX.recipe(kind, s, extra && extra.colors), extra && extra.spec);
  FX.launchShell(p, d.clone().multiplyScalar(sp0), { k, t: tb, spec, tstep: .04, headSize: .75, ignore: item.body });
  item.body.velocity.y -= .8; item.body.wakeUp();
  // Staubwolke am Mündungsboden
  for (let i = 0; i < 4; i++) smk(p.x, p.y - .2, p.z, rand(-1, 1), rand(.3, 1), rand(-1, 1), .7, .7, .7, .5, 1.6, 4, 1.5, .2, .4, 1);
}
const BIG_KINDS = ['chrys', 'peony', 'willow', 'palm', 'ring', 'saturn', 'heart', 'crossette', 'multi', 'kamuro', 'pistil', 'smiley', 'strobe'];

/* ---------- Böller ---------- */
const bangDef = (id, name, icon, desc, mdl, power, fuseT, stats, extra = {}) => def(Object.assign({
  id, cat: 'boeller', name, icon, desc, mass: .05 + power * .004, fuse: fuseT, stats,
  build: () => Mdl.banger(mdl),
  fire(it) { const p = it.wpos(V3(0, 0, 0)); it.remove(); explode(p, power, { paper: mdl.paperc || [.8, .08, .06], radius: extra.radius }); }
}, extra));

bangDef('kracher', 'Kracher', '🧨', 'Der Klassiker. Kurze Lunte, kräftiger Knall.', { key: 'k1', r: .016, h: .09, c1: '#d8201c', c2: '#8a0c10', accent: '#ffd02a', text: 'KRACH', pattern: 'stripes' }, 3.2, 1.3, [3, 2, 1]);
bangDef('kanone', 'Kanonenschlag', '💣', 'Fetter Knall mit Druckwelle. Kistendeckel fliegen.', { key: 'k2', r: .022, h: .11, c1: '#3a2a22', c2: '#1a100c', accent: '#c9c9d0', text: 'KANONE', sub: 'SCHLAG', pattern: 'checks', fg: '#e8e8f0', bands: true, paperc: [.5, .45, .4] }, 9, 1.8, [5, 4, 1]);
bangDef('cobra', 'Cobra Superknall', '🐍', 'Silberfolie, 3 g Blitzknallsatz. Laut!', { key: 'k3', r: .03, h: .14, c1: '#aeb4c0', c2: '#6a7080', accent: '#e8d02a', text: 'COBRA', sub: 'SUPER 12', pattern: 'rays', fg: '#d42020', bands: true, paperc: [.8, .8, .85] }, 17, 2.1, [7, 6, 1]);
bangDef('labomba', 'La Bomba', '🔥', 'Handgroße Kugelbombe. Nur mit viel Abstand zünden!', { key: 'k4', r: .06, h: .16, c1: '#1a1a1a', c2: '#0a0a0a', accent: '#ffcf1a', text: 'BOMBA', sub: 'XXL', pattern: 'stripes', fg: '#ffcf1a', bands: true, paperc: [.2, .2, .2], radius: 24 }, 34, 2.6, [9, 8, 1]);
def({
  id: 'mega', cat: 'boeller', name: 'MEGA-Bombe 5 kg', icon: '☢️', desc: 'Das Ende der Fahnenstange. Feuerball, Druckwelle, Pilzwolke.', mass: 4, fuse: 4.4, stats: [10, 10, 1],
  build: () => Mdl.bomb({ key: 'b1', r: .15, h: .3, c1: '#7a1810', c2: '#3a0a06', accent: '#ffcf1a', text: 'MEGA', sub: 'BOMBE', pattern: 'stripes', fg: '#ffd02a' }),
  fire(it) { const p = it.wpos(V3(0, 0, 0)); it.remove(); explode(p, 110, { radius: 64, cap: 55, paper: [.15, .13, .12] }); }
});
def({
  id: 'frosch', cat: 'boeller', name: 'Knallfrosch', icon: '🐸', desc: 'Hüpft wild umher und knallt dabei. Ende: dicker Rumms.', mass: .03, fuse: 1.1, stats: [4, 3, 3],
  build: () => Mdl.frog(),
  fire(it) {
    let hops = randi(5, 8); it.hopT = 0;
    it.upd = dt => {
      it.hopT -= dt;
      if (it.hopT <= 0) {
        it.hopT = rand(.22, .4);
        if (hops-- <= 0) { const p = it.wpos(V3()); it.remove(); explode(p, 4, { paper: [.1, .5, .15] }); return; }
        const b = it.body, a = rand(TAU); b.velocity.set(Math.cos(a) * rand(1.5, 3.2), rand(2.8, 4.8), Math.sin(a) * rand(1.5, 3.2)); b.angularVelocity.set(rand(-8, 8), rand(-8, 8), rand(-8, 8)); b.wakeUp();
        const p = it.wpos(V3()); explode(p, .9, { radius: 1.6, paper: [.1, .55, .15] });
      }
    };
  }
});

/* ---------- Ketten ---------- */
const chainDef = (id, name, icon, desc, N, rows, fuseT, spacing, power, stats) => def({
  id, cat: 'ketten', name, icon, desc, mass: .12 + N * .002, fuse: fuseT, stats,
  build: () => Mdl.chain(N, rows),
  fire(it) {
    const im = it.model.im; let t = 0;
    for (let i = 0; i < N; i++) {
      t += spacing * rand(.7, 1.3);
      Sched.after(t, () => {
        if (!it.alive) return;
        const p = it.wpos(it.model.crackers[i].clone().add(V3(0, .03, 0)));
        im.setMatrixAt(i, ZERO); im.instanceMatrix.needsUpdate = true;
        explode(p, power, { radius: 2.4 + power * .4, paper: [.85, .08, .06] });
        it.body.velocity.y += .12; it.body.velocity.x += rand(-.06, .06); it.body.wakeUp();
      });
    }
    it.finishAt(t + .3);
  }
});
chainDef('kette50', 'China-Böller 50', '🎊', 'Rote Lady-Cracker-Kette. Feuert wie ein Maschinengewehr.', 50, 5, 2.2, .055, 1.5, [6, 3, 4]);
chainDef('kette200', 'Mega-Kette 200', '🧧', '200 China-Böller – ein endloses Stakkato.', 200, 10, 2.8, .045, 1.7, [9, 5, 8]);
chainDef('kette_kracher', 'Kanonen-Kette 30', '⛓️', 'Dicke Kracher in Serie. Mit jedem Knall zittert der Boden.', 30, 3, 2.4, .2, 4.4, [8, 7, 6]);

/* ---------- Raketen ---------- */
const rocketDef = (id, name, icon, desc, mdl, cfg, stats) => def({
  id, cat: 'raketen', name, icon, desc, mass: .35, fuse: 2.1, stats, build: () => Mdl.rocket(mdl),
  fire(it) { fireRocket(it, cfg); }
});
rocketDef('flasche', 'Flaschenrakete', '🚀', 'Steht in der Bierflasche. Steigt auf ~45 m.', { key: 'r1', c1: '#d8221e', c2: '#8c1010', accent: '#fff', nose: 0xffd02a, s: 1 },
  { v: 40, k: .2, tb: 1.95, look: ROCKET_LOOK(0xd8221e, 0xffd02a), spec: () => FX.recipe(rk(['peony', 'chrys', 'ring', 'pistil']), .55) }, [4, 5, 1]);
rocketDef('heuler', 'Heuler', '📣', 'Pfeift sich nach oben und endet mit einem harten Knall.', { key: 'r2', c1: '#e8a319', c2: '#a8610a', accent: '#1a1a1a', nose: 0x222222, pattern: 'checks', s: 1.15 },
  { v: 38, k: .2, tb: 1.9, whistle: true, look: ROCKET_LOOK(0xe8a319, 0x222222), spec: () => FX.recipe('strobe', .5), onBurst: p => { FX.bang(p, 10, { paper: [.9, .9, .9] }); } }, [8, 4, 2]);
rocketDef('mega_rakete', 'Mega-Rakete', '🎇', 'Große Showrakete, ~80 m Höhe, riesiger Stern.', { key: 'r3', c1: '#1c4fd0', c2: '#0e2a7a', accent: '#ffd02a', text: 'MEGA', nose: 0xdd2222, s: 1.5 },
  { v: 52, k: .2, tb: 2.45, look: ROCKET_LOOK(0x1c4fd0, 0xdd2222), spec: () => FX.recipe(rk(['chrys', 'peony', 'multi', 'ring', 'saturn', 'pistil']), 1.1) }, [5, 8, 1]);
rocketDef('palme', 'Palmen-Rakete', '🌴', 'Goldene Palmwedel mit Knistern.', { key: 'r4', c1: '#e0b020', c2: '#8a6410', accent: '#1a6a2a', text: 'PALME', nose: 0x1a8a2a, s: 1.4 },
  { v: 50, k: .2, tb: 2.35, look: ROCKET_LOOK(0xe0b020, 0x1a8a2a), spec: () => FX.recipe('palm', 1.0) }, [4, 8, 1]);
rocketDef('herz', 'Herz-Rakete', '❤️', 'Zeichnet ein Herz oder Smiley in den Nachthimmel.', { key: 'r5', c1: '#e0207a', c2: '#8a0a48', accent: '#fff', text: '♥', nose: 0xffffff, s: 1.4 },
  { v: 50, k: .2, tb: 2.35, look: ROCKET_LOOK(0xe0207a, 0xffffff), spec: () => FX.recipe(Math.random() < .6 ? 'heart' : 'smiley', 1.15) }, [4, 8, 1]);

/* ---------- Batterien ---------- */
const cakeDef = (id, name, icon, desc, mdl, fuseT, prog, stats) => def({
  id, cat: 'batterien', name, icon, desc, mass: 1 + mdl.cols * mdl.rows * .02, fuse: fuseT, stats, build: () => Mdl.cake(mdl),
  fire(it) { cakeProgram(it, prog); }
});
cakeDef('batt16', 'Mini-Batterie 16', '🎆', 'Schnelle bunte Salve. Kurz & knackig.', { key: 'c16', cols: 4, rows: 4, h: .2, c1: '#d82a22', c2: '#7a0e0a', accent: '#ffd02a', text: 'MINI 16', sub: 'SALVE', pattern: 'rays', fg: '#fff3a0' }, 2.4,
  (tubes, add) => tubes.forEach((tb, i) => add(i * .13, tb, { tx: fanTilt(tb.q, 4, 10), tz: fanTilt(tb.r, 4, 6), speed: 30, tb: 1.7, spec: cakeSpec('peony', COLS5[i % 5]) })), [4, 4, 2]);
cakeDef('batt36', 'Fächer-Verbund 36', '🪭', 'Schießt im Fächer von links nach rechts.', { key: 'c36', cols: 6, rows: 6, h: .3, c1: '#1c5fd0', c2: '#0c2a7a', accent: '#ffd02a', text: 'FÄCHER 36', sub: 'VERBUND', pattern: 'stripes', fg: '#fff' }, 2.8,
  (tubes, add) => tubes.forEach(tb => add(tb.q * .5 + tb.r * .07, tb, { tx: fanTilt(tb.q, 6, 38), tz: fanTilt(tb.r, 6, 8), speed: 33, tb: 1.85, spec: cakeSpec(rk(['chrys', 'peony', 'ring']), COLS7[(tb.q + tb.r) % 7], .34) })), [5, 6, 4]);
cakeDef('batt100', 'MEGA-Batterie 100', '💫', '100 Schuss in drei Akten. Der Nachbar ruft die Polizei.', { key: 'c100', cols: 10, rows: 10, h: .36, c1: '#6a1ad0', c2: '#2a0a7a', accent: '#ffd02a', text: 'MEGA 100', sub: 'SCHUSS', pattern: 'rays', fg: '#ffe86a' }, 3.2,
  (tubes, add) => {
    tubes.forEach((tb, i) => {
      let t, tx, tz;
      if (i < 40) { t = i * .1; tx = fanTilt(i % 10, 10, 30) * (Math.floor(i / 10) % 2 ? -1 : 1); tz = fanTilt(Math.floor(i / 10), 10, 8); }
      else if (i < 80) { t = 4.4 + (i - 40) * .085; const q = (i - 40) % 10, r = Math.floor((i - 40) / 10); tx = fanTilt(q < 5 ? q : 9 - q, 10, 28) * (q < 5 ? -1 : 1); tz = fanTilt(r, 10, 12); }
      else { t = 8.2 + (i - 80) * .045; tx = rand(-.5, .5); tz = rand(-.5, .5); }
      add(t, tb, { tx, tz, speed: 31 + (i >= 80 ? 4 : 0), tb: 1.75 + (i >= 80 ? .15 : 0), muz: i >= 80 ? .8 : .55, spec: cakeSpec(rk(RAND_KINDS), pick(COLS7), i >= 80 ? .42 : .32) });
    });
  }, [8, 9, 8]);
cakeDef('batt_weide', 'Gold-Weide 49', '🌟', 'Goldene Weiden-Trauerbäume mit Knistern.', { key: 'c49', cols: 7, rows: 7, h: .32, c1: '#e8b020', c2: '#8a5c08', accent: '#2a1808', text: 'GOLD 49', sub: 'WEIDE', pattern: 'rays', fg: '#2a1000' }, 3,
  (tubes, add) => tubes.forEach((tb, i) => add(i * .34, tb, { tx: fanTilt(tb.q, 7, 20) + rand(-.05, .05), tz: fanTilt(tb.r, 7, 20), speed: 36, tb: 2.1, k: .1, spec: FX.recipe('willow', .5) })), [5, 7, 7]);
cakeDef('batt_strobe', 'Blitz & Knister 25', '⚡', 'Weiße Blitzstrobos und Knisterregen.', { key: 'c25', cols: 5, rows: 5, h: .26, c1: '#e8ecf4', c2: '#98a0b4', accent: '#1a1a2a', text: 'BLITZ 25', sub: 'KNISTER', pattern: 'checks', fg: '#101830', stroke: '#e8ecf4' }, 2.8,
  (tubes, add) => tubes.forEach((tb, i) => add(i * .22 + (i > 19 ? 0 : 0), tb, { tx: fanTilt(tb.q, 5, 16), tz: fanTilt(tb.r, 5, 16), speed: 33, tb: 1.85, spec: Object.assign(FX.recipe('strobe', i > 19 ? .7 : .4), { crackle: true }), big: .5 })), [6, 6, 5]);
cakeDef('batt_finale', 'WAHNSINN 150', '🌋', 'Die große Finale-Batterie: 150 Schuss, 22 Sekunden Dauerfeuer.', { key: 'c150', cols: 10, rows: 15, h: .5, c1: '#d82a22', c2: '#240a06', accent: '#ffe040', text: 'WAHNSINN', sub: '150 SCHUSS', pattern: 'rays', fg: '#ffe86a' }, 3.4,
  (tubes, add) => {
    let t = 0;
    tubes.forEach((tb, i) => {
      const prog = i / tubes.length; t += lerp(.26, .045, prog * prog) * rand(.8, 1.2);
      const ang = Math.sin(i * .21) * 32;
      add(t, tb, { tx: Math.tan(ang * DEG) + rand(-.06, .06), tz: fanTilt(tb.r, 15, 14), speed: 32 + prog * 6, tb: 1.8 + prog * .2, muz: .6 + prog * .4, spec: cakeSpec(rk(prog > .85 ? ['multi', 'strobe', 'peony'] : RAND_KINDS), pick(COLS7), .3 + prog * .25) });
    });
  }, [10, 10, 10]);

/* ---------- Fontänen ---------- */
function fountainFire(it, cfg) {
  const top = it.model.top, tk = 'f' + Math.random();
  SFX.hiss(it.wpos(top), cfg.dur, cfg.vol ?? .4);
  let smokeT = 0;
  it.upd = dt => {
    if (it.t > cfg.dur) { it.finish(); return; }
    const p = it.wpos(top), up = it.wdir(), fade = it.t < .6 ? it.t / .6 : (cfg.dur - it.t < 1.2 ? (cfg.dur - it.t) / 1.2 : 1);
    const ramp = (cfg.final && cfg.dur - it.t < cfg.final) ? 1.8 : 1;
    let n = cfg.rate * dt * fade * ramp * Q.dens; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
    const hue = (it.t * (cfg.hue || .15)) % 1;
    for (let i = 0; i < n; i++) {
      rsphere(_v); const a = Math.tan(cfg.cone * DEG), s = rand(cfg.v0, cfg.v1);
      _a.set(up.x + _v.x * a, up.y + _v.y * a, up.z + _v.z * a).normalize();
      let c = cfg.col; if (cfg.rainbow) { _hc.setHSL((hue + rand(0, .08)) % 1, 1, .5); c = [_hc.r * 1.2, _hc.g * 1.2, _hc.b * 1.2]; } else if (cfg.mix) c = pick(cfg.mix);
      sp(p.x, p.y, p.z, _a.x * s, _a.y * s, _a.z * s, c[0], c[1], c[2], cfg.size * rand(.7, 1.2), rand(cfg.l0, cfg.l1), cfg.drag, 9.8, cfg.flick || 0, cfg.cool ?? .7, 2.6, 0);
    }
    const lc = cfg.rainbow ? [1, .8, .5] : (cfg.mix ? cfg.mix[0] : cfg.col);
    Lights.sustain(tk, V3(p.x, p.y + 1.2 + cfg.v1 * .1, p.z), lc[0], lc[1], lc[2], (1.8 + cfg.v1 * .08) * fade, 12 + cfg.v1 * .9);
    smokeT -= dt; if (smokeT < 0) { smokeT = .35; smk(p.x, p.y + 1, p.z, rand(-.3, .3), rand(1, 2.5), rand(-.3, .3), .6, .6, .62, .5, 1.8, rand(5, 8), .9, .35, .26, 1); }
    if (cfg.final && cfg.dur - it.t < cfg.final && Math.random() < dt * 2) explode(p.clone().addScaledVector(up, 3), .4, { radius: 1 });
  };
}
const fountDef = (id, name, icon, desc, mdl, cfg, fuseT, stats) => def({
  id, cat: 'fontaenen', name, icon, desc, mass: .5 + mdl.h * 2, fuse: fuseT, stats, build: () => Mdl.fountain(mdl), fire(it) { fountainFire(it, cfg); }
});
fountDef('vulkan', 'Gold-Vulkan', '🌋', 'Goldene Funkenfontäne, ~5 m hoch.', { key: 'f1', r: .06, h: .2, c1: '#e8b020', c2: '#8a5c08', accent: '#2a1808', text: 'VULKAN', sub: 'GOLD', pattern: 'rays', fg: '#2a1000' },
  { dur: 24, rate: 420, v0: 7, v1: 15, cone: 9, col: [1, .6, .13], size: .1, l0: .9, l1: 1.7, drag: .45, cool: .75, vol: .42 }, 1.8, [3, 5, 6]);
fountDef('silber', 'Silber-Brillant', '✨', 'Gleißend helle, weiß-blaue Funken.', { key: 'f2', r: .055, h: .22, c1: '#c8d0e0', c2: '#6a748c', accent: '#1a2a5a', text: 'SILBER', sub: 'BRILLANT', pattern: 'dots', fg: '#102060', stroke: '#e0e8ff' },
  { dur: 22, rate: 480, v0: 8, v1: 17, cone: 7, col: [.85, .93, 1], size: .09, l0: .7, l1: 1.4, drag: .5, cool: .15, flick: 0, vol: .45 }, 1.8, [3, 5, 6]);
fountDef('regenbogen', 'Regenbogen-Fontäne', '🌈', 'Wechselt ständig die Farbe.', { key: 'f3', r: .07, h: .24, c1: '#e83a8a', c2: '#2a8ae8', accent: '#fff', text: 'RAINBOW', pattern: 'stripes', fg: '#fff' },
  { dur: 26, rate: 520, v0: 8, v1: 16, cone: 11, rainbow: true, hue: .14, size: .1, l0: .8, l1: 1.5, drag: .5, cool: 0, vol: .45 }, 1.8, [3, 6, 7]);
fountDef('mega_font', 'MEGA-Fontäne', '🔱', 'Meterhohe Funkenwand mit großem Finale.', { key: 'f4', r: .12, h: .38, c1: '#e8601a', c2: '#7a1a08', accent: '#ffd02a', text: 'MEGA', sub: 'FONTÄNE', pattern: 'rays', fg: '#ffe86a' },
  { dur: 38, rate: 900, v0: 12, v1: 26, cone: 8, mix: [[1, .6, .13], [1, .35, .08], [1, .8, .3]], size: .13, l0: 1.1, l1: 2.2, drag: .35, cool: .7, vol: .6, final: 4 }, 2.4, [4, 9, 9]);

/* ---------- Römische Lichter ---------- */
const romanDef = (id, name, icon, desc, mdl, shots, interval, stats) => def({
  id, cat: 'fontaenen', name, icon, desc, mass: .9, fuse: 1.8, stats, build: () => Mdl.roman(mdl),
  fire(it) {
    let t = 0;
    for (let i = 0; i < shots; i++) {
      const c = COLS7[i % 7], tt = t;
      Sched.after(tt, () => {
        if (!it.alive) return;
        const p = it.wpos(it.model.top), d = it.wdir(rand(-.03, .03), 1, rand(-.03, .03));
        FX.muzzle(p, d, .5); SFX.thump(p, .4);
        FX.launchShell(p, d.clone().multiplyScalar(29), { k: .12, t: 1.35, headCol: c, headSize: .55, spec: FX.recipe('peony', .24, [c]), ignore: it.body, tstep: .035 });
        it.body.velocity.y += .1; it.body.wakeUp();
      });
      t += interval * rand(.85, 1.15);
    }
    it.finishAt(t + 1.8);
  }
});
romanDef('roman10', 'Römisches Licht 10', '🕯️', 'Zehn farbige Leuchtkugeln nacheinander.', { key: 'ro1', h: .5, c1: '#1a8a3a', c2: '#0a4a1c', accent: '#ffd02a', sub: '10 SCHUSS', fg: '#fff3a0' }, 10, .6, [4, 4, 5]);
romanDef('roman25', 'Römisches Licht XL', '🏮', '25 Kugeln im Dauerfeuer, bunt gemischt.', { key: 'ro2', h: .7, c1: '#c8201c', c2: '#6a0a08', accent: '#fff', sub: '25 SCHUSS', fg: '#fff' }, 25, .38, [5, 5, 8]);

/* ---------- Mörser ---------- */
def({
  id: 'moerser1', cat: 'moerser', name: 'Mörser 3″', icon: '🎇', desc: 'Ein Schuss, ~120 m hoch, riesiger Himmelsstern.', mass: 2.5, fuse: 2.2, stats: [8, 8, 1],
  build: () => Mdl.mortar({ key: 'm1', n: 1, r: .055, h: .32, text: 'MÖRSER 3″', sub: 'EINZELSCHUSS' }),
  fire(it) { fireMortar(it, it.model.tubes[0], rk(BIG_KINDS), 1.5); it.finishAt(.5); }
});
def({
  id: 'moerser5', cat: 'moerser', name: 'Mörser-Rack 5', icon: '🎆', desc: 'Fünf verschiedene Schalen hintereinander.', mass: 5, fuse: 2.4, stats: [9, 9, 3],
  build: () => Mdl.mortar({ key: 'm5', n: 5, r: .05, h: .3, text: 'RACK 5', sub: 'MÖRSER' }),
  fire(it) {
    const kinds = BIG_KINDS.slice().sort(() => Math.random() - .5);
    it.model.tubes.forEach((tb, i) => Sched.after(i * 1.0, () => fireMortar(it, tb, kinds[i], 1.3)));
    it.finishAt(6.5);
  }
});
def({
  id: 'moerser_finale', cat: 'moerser', name: 'Finale-Rack 16', icon: '🎑', desc: 'Schnelle Salve aus 16 Mörsern. Ende: vierfacher Knall.', mass: 9, fuse: 2.8, stats: [10, 10, 5],
  build: () => Mdl.mortar({ key: 'm16', n: 16, cols: 8, rows: 2, r: .042, h: .28, text: 'FINALE 16', sub: 'ROYAL' }),
  fire(it) {
    const tubes = it.model.tubes;
    tubes.forEach((tb, i) => {
      const t = i < 12 ? i * .55 : 7.0 + (i - 12) * .08;
      Sched.after(t, () => fireMortar(it, tb, i < 12 ? rk(BIG_KINDS) : rk(['multi', 'chrys', 'peony', 'strobe']), i < 12 ? 1.15 : 1.7));
    });
    it.finishAt(11);
  }
});
def({
  id: 'moerser_riese', cat: 'moerser', name: 'RIESEN-Mörser 8″', icon: '🌠', desc: 'Eine einzige gewaltige Kugelschale – das ganze Dorf wird wach.', mass: 12, fuse: 3.4, stats: [10, 10, 1],
  build: () => Mdl.mortar({ key: 'm8', n: 1, r: .1, h: .55, tube: 0xb0443a, text: 'RIESE 8″', sub: 'KUGELBOMBE' }),
  fire(it) {
    const p = it.wpos(V3(0, it.model.topY + .02, 0)), d = it.wdir(), sp0 = 76, k = .07, tb = 3.9;
    FX.muzzle(p, d, 3.2); SFX.thump(p, 3);
    const kind = rk(['chrys', 'peony', 'multi', 'pistil', 'kamuro', 'saturn', 'willow']);
    const spec = Object.assign(FX.recipe(kind, 2.9), { n: 640 });
    FX.launchShell(p, d.clone().multiplyScalar(sp0), { k, t: tb, spec, tstep: .04, headSize: 1.1, ignore: it.body });
    explode(p, 8, { radius: 6 }); it.body.velocity.y -= 2; it.finishAt(.5);
  }
});

/* ---------- Spezial ---------- */
def({
  id: 'wirbel', cat: 'spezial', name: 'Bodenwirbel', icon: '🌀', desc: 'Dreht sich, zischt und flitzt kreuz und quer.', mass: .06, fuse: 1.4, stats: [4, 3, 3],
  build: () => Mdl.spinner(),
  fire(it) {
    SFX.spin(it.wpos(V3()), 4.6, .45); let jumped = false; const dur = 4.6;
    it.upd = dt => {
      if (it.t > dur) { const p = it.wpos(V3()); explode(p, 2.2, { paper: [.9, .6, .1] }); it.remove(); return; }
      const b = it.body; b.wakeUp(); b.angularVelocity.set(0, 26, 0);
      if (!jumped && it.t > .5) { jumped = true; b.velocity.y += 4; }
      if (Math.random() < dt * 5) { const a = rand(TAU); b.velocity.x += Math.cos(a) * 2.5; b.velocity.z += Math.sin(a) * 2.5; }
      const p = it.wpos(V3()), n = Math.floor(70 * dt * Q.dens + Math.random());
      for (let i = 0; i < n; i++) {
        const a = it.t * 26 + rand(-.4, .4), r = .07; const c = rk([[1, .75, .3], [1, .55, .15], [1, .95, .7]]);
        sp(p.x + Math.cos(a) * r, p.y + .02, p.z + Math.sin(a) * r, -Math.sin(a) * 6 + b.velocity.x * .3, rand(.5, 3), Math.cos(a) * 6 + b.velocity.z * .3, c[0], c[1], c[2], .06, rand(.3, .65), 1.5, 9.8, 0, .8, 2.6, 0);
      }
      Lights.sustain('w' + it.thing.body.id, p, 1, .7, .35, 1.2, 8);
    };
  }
});
const smokeDef = (id, name, col, hex) => def({
  id, cat: 'spezial', name, icon: '💨', desc: 'Dichter farbiger Rauch für Fotos & Atmosphäre. ~25 s.', mass: .3, fuse: 1.6, stats: [1, 4, 9],
  build: () => Mdl.smokePot(hex, name),
  fire(it) {
    const dur = 26; SFX.hiss(it.wpos(V3()), 6, .25);
    it.upd = dt => {
      if (it.t > dur) { it.finish(); return; }
      const p = it.wpos(it.model.top), fade = it.t > dur - 4 ? (dur - it.t) / 4 : 1;
      let n = 11 * dt * Q.dens * fade; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) smk(p.x, p.y, p.z, rand(-.6, .6), rand(2, 4), rand(-.6, .6), col[0], col[1], col[2], 1.1, 7, rand(8, 13), 1.1, .5, .62, 1.4);
      sp(p.x, p.y + .02, p.z, 0, 1, 0, col[0], col[1], col[2], .25, .15, 1, 0, 14, 0, 1.2, 0);
    };
  }
});
smokeDef('nebel_rot', 'Nebeltopf Rot', [1.3, .22, .2], 0xdd2a22);
smokeDef('nebel_gruen', 'Nebeltopf Grün', [.3, 1.2, .35], 0x2ab04a);
smokeDef('nebel_blau', 'Nebeltopf Blau', [.28, .5, 1.4], 0x2a6ae0);
def({
  id: 'wunderkerze', cat: 'spezial', name: 'Wunderkerzen', icon: '🎇', desc: 'Fünf Wunderkerzen im Sand. Gemütlich.', mass: .15, fuse: .9, stats: [1, 2, 9],
  build: () => Mdl.sparkler(),
  fire(it) {
    const dur = 30; SFX.hiss(it.wpos(it.model.top), 12, .15); const key = 'wk' + it.thing.body.id;
    it.upd = dt => {
      if (it.t > dur) { it.finish(); return; }
      const p = it.wpos(V3(0, .15 - it.t / dur * .08, 0)); let n = 130 * dt * Q.dens; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) { rsphere(_v); const s = rand(.8, 3.4); sp(p.x + rand(-.03, .03), p.y, p.z + rand(-.03, .03), _v.x * s, _v.y * s + .8, _v.z * s, 1, rand(.8, .95), rand(.45, .7), rand(.015, .03), rand(.2, .5), 1.6, 9.8, 0, .6, 3, 0); }
      Lights.sustain(key, p, 1, .85, .6, 1.4, 7);
    };
  }
});

/* ---------- Objekte ---------- */
const PROPS = {};
function propDef(d) {
  d.cat = 'objekte'; d.isProp = true; def(d); PROPS[d.id] = d; return d;
}
function makeProp(d, pos, yaw = 0) {
  const m = d.build(), body = new CANNON.Body({ mass: d.mass });
  for (const s of m.shapes) body.addShape(s.radius ? new CANNON.Sphere(s.radius) : new CANNON.Box(new CANNON.Vec3(...s.half)), s.off ? new CANNON.Vec3(...s.off) : undefined);
  body.position.set(pos.x, pos.y, pos.z); body.quaternion.setFromEuler(0, yaw, 0, 'XYZ');
  const t = {
    kind: 'prop', body, group: m.group, hp: d.hp, name: d.name, points: d.points, debris: d.debris, debrisN: d.debrisN, debrisSize: d.debrisSize,
    explosive: d.explosive, rad: d.rad || .5, size: d.size || 1, metal: d.metal, tough: d.tough, dust: d.dust, fragile: d.fragile
  };
  m.group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  Phys.addThing(t);
  return t;
}
propDef({ id: 'kiste', name: 'Holzkiste', icon: '📦', desc: 'Klassisches Ziel. Splittert hübsch.', build: () => Mdl.crate(), mass: 12, hp: 55, points: 40, debris: [0x9a6e3c, 0x7a5028, 0xb08048], debrisN: 12, debrisSize: .2, rad: .6, size: 1 });
propDef({ id: 'karton', name: 'Pappkarton', icon: '📫', desc: 'Leicht zerstörbar.', build: () => Mdl.cardboard(), mass: 3, hp: 18, points: 15, debris: [0xc19a62, 0xa98048], debrisN: 7, debrisSize: .18, rad: .45 });
propDef({ id: 'fass', name: 'Holzfass', icon: '🛢️', desc: 'Rollt, fliegt, zerbricht.', build: () => Mdl.barrel(false), mass: 20, hp: 80, points: 60, debris: [0x7a5530, 0x5a3c1e, 0x3a3a3c], debrisN: 12, debrisSize: .22, rad: .6, size: 1.2 });
propDef({ id: 'pulverfass', name: 'Pulverfass', icon: '🧨', desc: 'Rotes Fass voll Schwarzpulver. Explodiert heftig!', build: () => Mdl.barrel(true), mass: 22, hp: 28, points: 120, explosive: 38, debris: [0xb8211b, 0x7a1010, 0x3a3a3c], debrisN: 10, debrisSize: .2, rad: .6, size: 1.2, metal: true, fragile: 1 });
propDef({ id: 'zwerg', name: 'Gartenzwerg', icon: '🧙', desc: 'Der heimliche Hauptdarsteller deutscher Vorgärten.', build: () => Mdl.gnome(), mass: 4, hp: 24, points: 150, debris: [0xd8232a, 0x2f5fc0, 0xf4f4f0, 0xf0bd9a], debrisN: 12, debrisSize: .09, rad: .35, size: .6 });
propDef({ id: 'briefkasten', name: 'Briefkasten', icon: '📮', desc: 'Gelbes Dauerziel. Hält einiges aus.', build: () => Mdl.mailbox(), mass: 35, hp: 160, points: 250, debris: [0xffc400, 0x555a60, 0xffffff], debrisN: 12, debrisSize: .13, rad: .6, size: 1.2, metal: true });
propDef({ id: 'dixi', name: 'Dixi-Klo', icon: '🚽', desc: 'Blau, hoch und sehr unschuldig.', build: () => Mdl.dixi(), mass: 70, hp: 200, points: 400, debris: [0x2477d6, 0xf2f4f6, 0x1b5db0], debrisN: 20, debrisSize: .32, rad: 1.2, size: 2.2, dust: 3 });
propDef({ id: 'auto', name: 'Auto', icon: '🚗', desc: 'Schwer! Braucht schon eine ordentliche Bombe.', build: () => Mdl.car(), mass: 380, hp: 1e9, tough: true, points: 0, rad: 2.3, size: 3, metal: true });
propDef({ id: 'ziegel', name: 'Ziegel', icon: '🧱', desc: 'Einzelner Ziegelstein.', build: () => Mdl.brick(), mass: 5, hp: 32, points: 12, debris: [0xa5472f, 0x8a3a24, 0xc8c0b0], debrisN: 5, debrisSize: .09, rad: .3 });
def({
  id: 'mauer', cat: 'objekte', isProp: true, name: 'Ziegelmauer', icon: '🧱', desc: 'Fertige Mauer aus 35 Ziegeln – zum Einreißen.', mass: 0, build: () => { const m = Mdl.crate(); m.group.children[0].scale.set(2.4 / .8, 1.2 / .8, .3 / .8); m.base = .6; return m; },
  custom(pos, yaw) {
    const cols = 5, rows = 7, bw = .46, bh = .205, bd = .23, d = PROPS.ziegel;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const off = (r % 2) * bw / 2, lx = (c - (cols - 1) / 2) * bw + off - (r % 2 ? bw / 2 * .0 : 0);
      if (r % 2 && c === cols - 1) continue;
      const x = pos.x + lx * cy, z = pos.z - lx * sy;
      const t = makeProp(d, V3(x, pos.y + bh / 2 + r * (bh + .003) + .005, z), yaw);
      t.body.sleep();
    }
  }
});
def({
  id: 'turm', cat: 'objekte', isProp: true, name: 'Kistenturm', icon: '🗼', desc: 'Fünf Kisten übereinander.', mass: 0, build: () => { const m = Mdl.crate(); m.group.scale.set(1, 1, 1); m.base = .4; return m; },
  custom(pos, yaw) { for (let i = 0; i < 5; i++) { const t = makeProp(PROPS.kiste, V3(pos.x, pos.y + .4 + i * .81, pos.z), yaw + rand(-.05, .05)); } }
});


propDef({ id: 'melone', name: 'Wassermelone', icon: '🍉', desc: 'Platzt spektakulär. Rot, saftig, laut.', build: () => Mdl.melon(false), mass: 5, hp: 14, points: 35, debris: [0xd8242a, 0xe8383c, 0xf4f4e0, 0x2f8a3a], debrisN: 16, debrisSize: .09, rad: .3, size: .6, dust: 2 });
propDef({ id: 'kuerbis', name: 'Kürbis', icon: '🎃', desc: 'Zeitlos. Fliegt weit.', build: () => Mdl.melon(true), mass: 6, hp: 18, points: 35, debris: [0xe8791a, 0xc8601a, 0xf0a040], debrisN: 14, debrisSize: .1, rad: .3, size: .6, dust: 2 });
def({
  id: 'dummy', cat: 'objekte', isProp: true, name: 'Test-Dummy', icon: '🤸', desc: 'Schlaffer Ragdoll. Fliegt, rollt, lässt sich greifen.', mass: 0,
  build: () => { const m = Mdl.crate(); m.group.children[0].scale.set(.5, 2.1, .3); m.base = 1.05 * .8; m.group.children[0].material = ghostBox; return m; },
  custom(pos, yaw) { spawnDummy(pos, yaw); }
});
const ghostBox = new THREE.MeshBasicMaterial({ color: 0xffc21a });
function spawnDummy(pos, yaw) {
  const P_ = Mdl.dummyParts(), fam = [], cons = [], cy = Math.cos(yaw), sy = Math.sin(yaw);
  const mk = (grp, shape, mass, lx, ly, lz, hp) => {
    const b = new CANNON.Body({ mass, shape });
    b.position.set(pos.x + lx * cy + lz * sy, pos.y + ly, pos.z - lx * sy + lz * cy); b.quaternion.setFromEuler(0, yaw, 0, 'XYZ');
    b.linearDamping = .06; b.angularDamping = .25;
    grp.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    const t = { kind: 'prop', body: b, group: grp, tough: true, hp: 1e9, rad: .45, name: 'Test-Dummy', family: fam };
    Phys.addThing(t); fam.push(t); return b;
  };
  const torso = mk(P_.torso.g, new CANNON.Box(new CANNON.Vec3(...P_.torso.half)), P_.torso.mass, 0, 1.06, 0);
  const head = mk(P_.head.g, new CANNON.Sphere(P_.head.r), P_.head.mass, 0, 1.06 + .26 + .15, 0);
  const aL = mk(P_.arm.g(), new CANNON.Box(new CANNON.Vec3(...P_.arm.half)), P_.arm.mass, -.255, 1.06 + .26 - .28, 0);
  const aR = mk(P_.arm.g(), new CANNON.Box(new CANNON.Vec3(...P_.arm.half)), P_.arm.mass, .255, 1.06 + .26 - .28, 0);
  const lL = mk(P_.leg.g(), new CANNON.Box(new CANNON.Vec3(...P_.leg.half)), P_.leg.mass, -.1, .42, 0);
  const lR = mk(P_.leg.g(), new CANNON.Box(new CANNON.Vec3(...P_.leg.half)), P_.leg.mass, .1, .42, 0);
  const V = (x, y, z) => new CANNON.Vec3(x, y, z);
  const join = (a, pa, b, pb) => { const c = new CANNON.PointToPointConstraint(a, pa, b, pb, 600); c.collideConnected = false; Phys.world.addConstraint(c); cons.push(c); };
  join(torso, V(0, .27, 0), head, V(0, -.14, 0));
  join(torso, V(-.23, .23, 0), aL, V(0, .25, 0)); join(torso, V(.23, .23, 0), aR, V(0, .25, 0));
  join(torso, V(-.1, -.28, 0), lL, V(0, .38, 0)); join(torso, V(.1, -.28, 0), lR, V(0, .38, 0));
  const cleanup = () => { cons.forEach(c => { try { Phys.world.removeConstraint(c); } catch (e) { } }); cons.length = 0; fam.forEach(o => { if (!o.dead) Phys.removeThing(o); }); };
  fam.forEach(t => { t.onRemove = cleanup; });
  [torso, head, aL, aR, lL, lR].forEach(b => { b.sleep(); });
  return fam;
}

/* ---------- Show-Pakete: ganze Feuerwerksshow auf Knopfdruck aufbauen ---------- */
function placeShow(pos, yaw, list) {
  const rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  list.forEach(([id, lat, dep]) => put(id, pos.x + rx * lat + fx * dep, pos.z + rz * lat + fz * dep, yaw, pos.y));
  toast('🎆 Show aufgebaut – jetzt mit G alles zünden!', 4000); SFX.place();
}
const showBox = () => { const m = Mdl.crate(); m.group.children[0].scale.set(7, .15, 2.6); m.group.children[0].material = ghostBox; m.base = .075; return m; };
def({
  id: 'show_klein', cat: 'spezial', isProp: true, name: 'Show-Paket Klein', icon: '🎁', desc: 'Baut ~20 Artikel in Reihen auf. Dann G drücken: Show!', mass: 0, build: showBox,
  custom(pos, yaw) {
    placeShow(pos, yaw, [
      ['vulkan', -3.6, 1.2], ['vulkan', 0, 1.2], ['vulkan', 3.6, 1.2],
      ['flasche', -3, 0], ['flasche', -2, 0], ['flasche', -1, 0], ['flasche', 1, 0], ['flasche', 2, 0], ['flasche', 3, 0],
      ['batt16', -3.2, -1.4], ['batt36', -1.1, -1.4], ['batt36', 1.1, -1.4], ['batt16', 3.2, -1.4],
      ['moerser5', -2.2, -2.8], ['moerser5', 2.2, -2.8], ['batt_weide', 0, -2.4],
      ['mega_rakete', -1.2, -4], ['herz', 0, -4], ['palme', 1.2, -4],
      ['batt100', -1.8, -5.4], ['moerser_finale', 1.8, -5.4]
    ]);
  }
});
def({
  id: 'show_gross', cat: 'spezial', isProp: true, name: 'Show-Paket GROSS', icon: '🎪', desc: 'Silvester-Großshow: ~45 Artikel, ein langes Finale.', mass: 0, build: showBox,
  custom(pos, yaw) {
    const L = [];
    for (let i = -5; i <= 5; i += 2.5) L.push(['vulkan', i, 1.6]);
    for (let i = -4; i <= 4; i++) L.push(['flasche', i * .8, .4]);
    for (let i = 0; i < 3; i++) L.push(['heuler', -2.5 + i * 2.5, -.6]);
    L.push(['roman25', -6, 0], ['roman25', 6, 0], ['regenbogen', -4, 1.6], ['regenbogen', 4, 1.6]);
    for (let i = 0; i < 4; i++) L.push([['batt36', 'batt_strobe', 'batt36', 'batt16'][i], -4.5 + i * 3, -2]);
    L.push(['moerser5', -6, -3.2], ['moerser5', 6, -3.2], ['moerser1', -3, -3.2], ['moerser1', 3, -3.2]);
    L.push(['mega_rakete', -2, -4.2], ['herz', -.7, -4.2], ['palme', .7, -4.2], ['mega_rakete', 2, -4.2]);
    L.push(['batt100', -3.5, -5.6], ['batt_weide', 0, -5.2], ['batt100', 3.5, -5.6]);
    L.push(['moerser_finale', -5, -7], ['batt_finale', 0, -7.4], ['moerser_finale', 5, -7], ['moerser_riese', -2.2, -6.8], ['moerser_riese', 2.2, -6.8]);
    placeShow(pos, yaw, L);
  }
});

/* ---------- Platzieren ---------- */
/* surf = Auftreffpunkt auf der Oberfläche; base = Abstand Modell-Ursprung -> Unterkante */
function spawnDef(d, surf, yaw, base, o) {
  if (d.custom) { d.custom(surf, yaw); return null; }
  const c = V3(surf.x, surf.y + base + .004, surf.z);
  return d.isProp ? makeProp(d, c, yaw) : new Item(d, c, yaw, o);
}
