/* =====================================================================
   80_player: Steuerung, Kamera, Werkzeuge (Feuerzeug, Greifer, Löschen, Platzieren), Werfen
   ===================================================================== */
const Input = { keys: {}, locked: false, noLock: false, down: false, down2: false, joy: { x: 0, y: 0 }, jump: false, lookDX: 0, lookDY: 0 };

const P = {
  yaw: .0, pitch: 0, sel: 0, ghostRot: 0, ghost: null, ghostKey: '', hover: null, grab: null, lastThrow: 0, lastDel: 0, lastPlace: 0, clickEdge: false,
  stepT: 0,
  slots: [
    { tool: 'lighter' }, { tool: 'grab' }, { tool: 'delete' },
    { item: 'kanone' }, { item: 'kette50' }, { item: 'flasche' }, { item: 'batt100' }, { item: 'moerser5' }, { item: 'vulkan' }
  ]
};

/* ---------- Viewmodel (Feuerzeug) ---------- */
const VM = (() => {
  const g = new THREE.Group(); g.position.set(.22, -.22, -.42); g.scale.setScalar(.72); camera.add(g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.034, .062, .014), new THREE.MeshStandardMaterial({ color: C(0x9aa2b2), metalness: .9, roughness: .3 }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(.034, .02, .014), new THREE.MeshStandardMaterial({ color: C(0xb6bdcc), metalness: .9, roughness: .25 })); lid.position.y = .04;
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .016, 8), new THREE.MeshStandardMaterial({ color: C(0x333333), roughness: .8 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(.004, .033, 0);
  const lighter = new THREE.Group(); lighter.add(body, lid, wheel); lighter.rotation.set(.2, -.25, -.12); lighter.position.set(0, 0, 0);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.011, .045, 8), new THREE.MeshBasicMaterial({ color: C(0xffb040).multiplyScalar(3.2), transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }));
  flame.position.set(0, .075, 0); lighter.add(flame);
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(.005, .026, 6), new THREE.MeshBasicMaterial({ color: C(0x9ec8ff).multiplyScalar(2.5), transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })); flameCore.position.set(0, .063, 0); lighter.add(flameCore);
  const flameTip = new THREE.Object3D(); flameTip.position.set(0, .095, 0); lighter.add(flameTip);
  g.add(lighter);
  const hold = new THREE.Group(); hold.position.set(.02, -.03, 0); g.add(hold);
  let kick = 0, holdKey = '';
  function setHold(key, d) {
    if (holdKey === key) return; holdKey = key;
    while (hold.children.length) hold.remove(hold.children[0]);
    if (!d) return;
    const m = d.build().group; m.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });
    const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(V3()), mx = Math.max(sz.x, sz.y, sz.z), s = clamp(.2 / mx, .1, 2.5);
    m.scale.setScalar(s); m.rotation.set(.35, .6, .15); hold.add(m);
  }
  function update(dt, tool, moving) {
    lighter.visible = tool === 'lighter';
    hold.visible = tool === 'item';
    const t = G.real;
    g.position.y = -.22 + Math.sin(t * 9) * .004 * moving - kick * .03; g.position.x = .2 + Math.cos(t * 4.5) * .003 * moving;
    kick = Math.max(0, kick - dt * 6);
    if (tool === 'lighter') {
      const f = 1 + Math.sin(t * 40) * .12 + Math.random() * .12; flame.scale.set(1, f, 1); flameCore.scale.set(1, f, 1);
      flameTip.getWorldPosition(_v);
      if (Math.random() < dt * 40) sp(_v.x, _v.y, _v.z, rand(-.05, .05), rand(.2, .45), rand(-.05, .05), 1, .62, .22, .008, rand(.1, .2), 1, -1, 0, .8, 1.3, 0);
      Lights.sustain('lighter', _v, 1, .62, .3, .55, 4.5);
    }
  }
  return { update, setHold, kick() { kick = 1; }, flameTip };
})();

/* ---------- Auswahl ---------- */
function curSlot() { return P.slots[P.sel]; }
function curDef() { const s = curSlot(); return s.item ? BYID[s.item] : null; }
function setSlot(i) {
  P.sel = ((i % P.slots.length) + P.slots.length) % P.slots.length;
  P.grab = null; SFX.click(); buildGhost(); UI.refresh();
}
function assignItem(id) {
  if (!P.slots[P.sel].item) { P.sel = 3; }
  P.slots[P.sel].item = id; delete P.slots[P.sel].tool; buildGhost(); UI.refresh();
}

/* ---------- Geister-Vorschau ---------- */
const ghostMatOK = new THREE.MeshBasicMaterial({ color: 0x66ff9a, transparent: true, opacity: .42, depthWrite: false });
const ghostMatBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: .42, depthWrite: false });
function buildGhost() {
  if (P.ghost) { scene.remove(P.ghost.group); P.ghost = null; }
  const d = curDef(); P.ghostKey = '';
  VM.setHold(d ? d.id : '', d);
  if (!d) return;
  const m = d.build(); m.group.traverse(c => { if (c.isMesh) { c.material = ghostMatOK; c.castShadow = false; c.receiveShadow = false; } });
  m.group.visible = false; scene.add(m.group);
  const k = d.isProp ? 1 : ITEM_SCALE; m.group.scale.setScalar(k);
  P.ghost = { group: m.group, base: (m.base ?? .1) * k, def: d };
}

const _hitO = V3(), _hitD = V3();
function aimRay() { camera.getWorldPosition(_hitO); camera.getWorldDirection(_hitD); return [_hitO, _hitD]; }

function tryPlace() {
  const d = curDef(), g = P.ghost; if (!d || !g || !g.valid) return;
  if (Items.list.length > 450) { toast('Zu viele Objekte – bitte aufräumen'); return; }
  const o = g.surf, yaw = g.group.rotation.y;
  spawnDef(d, o, yaw, g.base);
  SFX.place(); VM.kick(); P.lastPlace = performance.now();
}

/* ---------- Zielen / Interaktion ---------- */
function findIgnitable() {
  const [o, dir] = aimRay();
  const hit = Phys.pick(o, dir, 5, t => t.item && t.item.state === 'idle');
  if (hit && hit.thing && hit.thing.item) return hit.thing.item;
  let best = null, bs = 1e9;
  for (const it of Items.list) {
    if (it.state !== 'idle' || !it.alive) continue;
    const p = it.body.position; _v.set(p.x - o.x, p.y - o.y, p.z - o.z); const dist = _v.length();
    if (dist > 4.8 || dist < .1) continue;
    const ang = Math.acos(clamp(_v.dot(dir) / dist, -1, 1));
    const lim = .13 + .25 / Math.max(dist, .5) * .35;
    if (ang < lim && ang * (1 + dist * .1) < bs) { bs = ang * (1 + dist * .1); best = it; }
  }
  return best;
}

function doPrimary(edge) {
  const s = curSlot();
  if (s.tool === 'lighter') {
    if (!edge && !Input.down) return;
    const it = findIgnitable();
    if (it && it.ignite()) { SFX.flick(); VM.kick(); toast('🔥 ' + it.def.name + ' – ZÜNDET!', 900); }
  } else if (s.tool === 'delete') {
    const now = performance.now(); if (now - P.lastDel < 110 && !edge) return;
    const [o, dir] = aimRay(); const hit = Phys.pick(o, dir, 30);
    if (hit && hit.thing) { P.lastDel = now; const p = hit.thing.body.position; for (let i = 0; i < 3; i++) smk(p.x, p.y, p.z, rand(-.4, .4), rand(.2, .8), rand(-.4, .4), .7, .7, .7, .3, 1, 1.2, 1, .4, .35, 1); Phys.removeThing(hit.thing); SFX.remove(); }
  } else if (s.tool === 'grab') {
    if (!edge) return;
    const [o, dir] = aimRay(); const hit = Phys.pick(o, dir, 14);
    if (hit && hit.thing) {
      const b = hit.thing.body; _v.copy(hit.point);
      const local = new CANNON.Vec3(); b.pointToLocalFrame(new CANNON.Vec3(_v.x, _v.y, _v.z), local);
      P.grab = { thing: hit.thing, dist: clamp(hit.dist, 1.2, 12), local };
    }
  } else if (s.item) {
    if (!edge) return; tryPlace();
  }
}
function releasePrimary() { P.grab = null; }
function doSecondary() {
  const s = curSlot();
  if (P.grab) { const b = P.grab.thing.body, [, dir] = aimRay(); b.velocity.set(dir.x * 18, dir.y * 18 + 2, dir.z * 18); P.grab = null; return; }
  if (s.item) {    // Pipette: Typ unter dem Fadenkreuz übernehmen
    const [o, dir] = aimRay(); const hit = Phys.pick(o, dir, 30);
    if (hit && hit.thing && hit.thing.item) { assignItem(hit.thing.item.def.id); toast('Pipette: ' + hit.thing.item.def.name); }
  }
}

function throwLit() {
  const d = curDef(); const now = performance.now(); if (!d || now - P.lastThrow < 280) return; P.lastThrow = now;
  const [o, dir] = aimRay();
  const pos = V3(o.x + dir.x * .7, o.y + dir.y * .7 - .15, o.z + dir.z * .7);
  if (d.custom) { toast('Das kann man nicht werfen 😉'); return; }
  const th = d.isProp ? makeProp(d, pos, P.yaw) : new Item(d, pos, 0, { quat: camera.quaternion });
  const b = (d.isProp ? th : th.thing).body, pv = Phys.player.velocity;
  const sp_ = d.isProp ? 11 : 15;
  b.velocity.set(dir.x * sp_ + pv.x, dir.y * sp_ + 2.2 + pv.y, dir.z * sp_ + pv.z);
  b.angularVelocity.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));
  if (!d.isProp) th.ignite(Math.max(.45, d.fuse * .45));
  SFX.flick(); VM.kick();
}

/* ---------- Spieler-Update ---------- */
function updatePlayer(dt) {
  const body = Phys.player;
  // Kamera aus Eingaben
  const look = .0022 * G.sens;
  P.yaw -= Input.lookDX * look; P.pitch = clamp(P.pitch - Input.lookDY * look, -1.5, 1.5); Input.lookDX = Input.lookDY = 0;
  const K = G.menu ? {} : Input.keys, joy = G.menu ? { x: 0, y: 0 } : Input.joy;
  if (K.ArrowLeft) P.yaw += 1.9 * dt; if (K.ArrowRight) P.yaw -= 1.9 * dt;
  if (K.ArrowUp) P.pitch = clamp(P.pitch + 1.4 * dt, -1.5, 1.5); if (K.ArrowDown) P.pitch = clamp(P.pitch - 1.4 * dt, -1.5, 1.5);

  const ix = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0) + joy.x, iz = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) - joy.y;
  const run = K.ShiftLeft || K.ShiftRight || Math.hypot(joy.x, joy.y) > .85;
  const ts = 1 / Math.max(.3, G.timeScale);
  const speed = (G.fly ? (run ? 26 : 11) : (run ? 7.6 : 4.4)) * ts;
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  let wx = (-sy * iz + cy * ix), wz = (-cy * iz - sy * ix);
  const wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; }
  wx *= speed; wz *= speed;
  Phys.tickGround(dt);
  const gnd = Phys.onGround;
  if (G.fly) {
    body.collisionFilterMask = 0; body.force.y += body.mass * 9.82;
    const vy = ((K.Space ? 1 : 0) - ((K.ControlLeft || K.KeyC) ? 1 : 0) + (Input.jumpHeld ? 1 : 0)) * (run ? 20 : 9) * ts;
    body.velocity.x += (wx - body.velocity.x) * Math.min(1, 6 * dt * ts * .5 + .12); body.velocity.z += (wz - body.velocity.z) * Math.min(1, 6 * dt * ts * .5 + .12); body.velocity.y += (vy - body.velocity.y) * .25;
    if (body.position.y < .6) body.position.y = .6;
  } else {
    body.collisionFilterMask = GRP.DEF;
    const acc = (gnd ? 16 : 3.2) * dt * Math.min(ts, 2);
    body.velocity.x += (wx - body.velocity.x) * Math.min(1, acc); body.velocity.z += (wz - body.velocity.z) * Math.min(1, acc);
    if ((K.Space || Input.jump) && gnd) { body.velocity.y = 5.4; Input.jump = false; }
  }
  const r = Math.hypot(body.position.x, body.position.z);
  if (r > FIELD_R - 1) { body.position.x *= (FIELD_R - 1) / r; body.position.z *= (FIELD_R - 1) / r; body.velocity.x *= .5; body.velocity.z *= .5; }

  // Kamera
  const bp = body.position;
  camera.position.set(bp.x, bp.y + (G.fly ? .3 : 1.2), bp.z);
  const sh = G.trauma * G.trauma, t = G.real * 36;
  camera.rotation.set(P.pitch + (Math.sin(t * 1.3) * Math.sin(t * .71 + 1)) * .045 * sh, P.yaw + (Math.sin(t * 1.1 + 2) * Math.sin(t * .83)) * .045 * sh, (Math.sin(t * .9 + 4)) * .03 * sh);
  camera.position.x += Math.sin(t * 1.7) * .03 * sh; camera.position.y += Math.sin(t * 1.9 + 1) * .03 * sh;
  G.trauma = Math.max(0, G.trauma - dt * 1.5); G.flash = Math.max(0, G.flash - dt * 1.8); G.ring = Math.max(0, G.ring - dt * .22); G.kick = Math.max(0, G.kick - dt * 28 * Math.max(1, G.kick * .1));
  const fv = G.fov + G.kick + (run && (ix || iz) ? 3 : 0); if (Math.abs(camera.fov - fv) > .05) { camera.fov += (fv - camera.fov) * Math.min(1, dt * 10); camera.updateProjectionMatrix(); }

  // Werkzeug
  const s = curSlot(), tool = s.tool || 'item';
  VM.update(dt, tool, (ix || iz) && gnd ? 1 : 0);
  if ((ix || iz) && gnd && !G.fly) { P.stepT -= dt * (run ? 1.45 : 1); if (P.stepT <= 0) { P.stepT = .46; SFX.step(); } } else P.stepT = Math.min(P.stepT, .12);
  const cross = $('cross');
  let cls = '';
  if (tool === 'lighter') {
    const it = findIgnitable(); P.hover = it; cls = it ? 'act' : '';
    if (it) $('itemname').innerHTML = it.def.name + '<small>' + it.def.desc + '</small>'; else UI.nameLine();
    if (Input.down) doPrimary(false);
  } else if (tool === 'delete') { cls = 'del'; if (Input.down) doPrimary(false); }
  else if (tool === 'grab') {
    cls = 'grab';
    if (P.grab) {
      const th = P.grab.thing; if (th.dead) { P.grab = null; }
      else {
        const [o, dir] = aimRay(), b = th.body, wp = new CANNON.Vec3();
        b.pointToWorldFrame(P.grab.local, wp);
        const tx = o.x + dir.x * P.grab.dist, ty = o.y + dir.y * P.grab.dist, tz = o.z + dir.z * P.grab.dist;
        let vx = (tx - wp.x) * 12, vy = (ty - wp.y) * 12, vz = (tz - wp.z) * 12; const l = Math.hypot(vx, vy, vz); if (l > 28) { vx *= 28 / l; vy *= 28 / l; vz *= 28 / l; }
        b.velocity.set(vx, vy, vz); b.angularVelocity.scale(.88, b.angularVelocity); b.wakeUp(); th.slept = false;
      }
    }
  } else updateGhost();
  if (tool !== 'item' && P.ghost) P.ghost.group.visible = false;
  cross.className = cls;
}

function updateGhost() {
  const g = P.ghost; if (!g) return;
  const [o, dir] = aimRay(); const hit = Phys.pick(o, dir, 28, () => true);
  if (!hit) { g.group.visible = false; g.valid = false; return; }
  g.valid = true; g.surf = hit.point.clone();
  const n = hit.normal; let p = hit.point.clone();
  if (n.y < .55) { p.addScaledVector(V3(n.x, 0, n.z).normalize(), .12); }
  g.surf.copy(p);
  g.group.position.set(p.x, p.y + g.base + .004, p.z);
  g.group.rotation.set(0, P.yaw + P.ghostRot, 0);
  g.group.visible = true;
}

/* ---------- Tastatur / Maus ---------- */
window.addEventListener('keydown', e => {
  if (e.repeat && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) { if (e.code === 'Tab') e.preventDefault(); return; }
  Input.keys[e.code] = true;
  if (!G.started) return;
  if (e.code === 'Tab') e.preventDefault();
  if (G.menu === 'catalog') { if (e.code === 'KeyB' || e.code === 'Tab' || e.code === 'Escape') UI.closeCatalog(); return; }
  if (G.menu) { if (e.code === 'Escape') UI.resume(); return; }
  if (e.code === 'Escape') { UI.openPause(); return; }
  if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 9) setSlot(n - 1); }
  switch (e.code) {
    case 'KeyB': case 'Tab': UI.openCatalog(); break;
    case 'KeyF': throwLit(); break;
    case 'KeyR': P.ghostRot += Math.PI / 4; break;
    case 'KeyG': Items.igniteAll(); break;
    case 'KeyZ': G.targetScale = G.targetScale < 1 ? 1 : .2; $('slowbadge').classList.toggle('hidden', G.targetScale >= 1); toast(G.targetScale < 1 ? '🎬 Zeitlupe' : 'Normale Geschwindigkeit'); break;
    case 'KeyV': G.fly = !G.fly; toast(G.fly ? '🕊️ Flugmodus (Leertaste hoch · Strg runter)' : 'Flugmodus aus'); break;
    case 'KeyL': G.torch = !G.torch; toast(G.torch ? '🔦 Taschenlampe an' : 'Taschenlampe aus'); SFX.click(); break;
    case 'KeyP': G.shot = true; break;
    case 'KeyH': G.hud = !G.hud; $('hud').classList.toggle('hidden', !G.hud); break;
    case 'KeyQ': setSlot(P.sel - 1); break;
    case 'KeyE': setSlot(P.sel + 1); break;
  }
});
window.addEventListener('keyup', e => { Input.keys[e.code] = false; });
window.addEventListener('blur', () => { Input.keys = {}; Input.down = false; });

document.addEventListener('mousemove', e => {
  if (!G.started || G.menu) return;
  if (Input.locked) { Input.lookDX += e.movementX; Input.lookDY += e.movementY; }
  else if (Input.noLock && Input.down2) { Input.lookDX += e.movementX; Input.lookDY += e.movementY; }
});
canvas.addEventListener('mousedown', e => {
  if (!G.started || G.menu) return;
  if (!Input.locked && !Input.noLock) { UI.lock(); return; }
  if (e.button === 0) { Input.down = true; doPrimary(true); }
  else if (e.button === 2) { Input.down2 = true; doSecondary(); }
});
window.addEventListener('mouseup', e => { if (e.button === 0) { Input.down = false; releasePrimary(); } if (e.button === 2) Input.down2 = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => {
  if (!G.started || G.menu) return;
  if (P.grab) { P.grab.dist = clamp(P.grab.dist - Math.sign(e.deltaY) * .6, 1, 14); return; }
  setSlot(P.sel + Math.sign(e.deltaY));
}, { passive: true });
document.addEventListener('pointerlockchange', () => {
  Input.locked = document.pointerLockElement === canvas;
  if (Input.locked) Input.everLocked = true;
  if (!Input.locked && G.started && !G.menu) UI.openPause();
});
document.addEventListener('pointerlockerror', () => {
  if (Input.everLocked) { clearTimeout(Input.retry); Input.retry = setTimeout(() => { if (!G.menu && G.started && !Input.locked) UI.lock(); }, 900); return; }
  Input.noLock = true; toast('Maus-Sperre nicht möglich – Rechtsklick halten zum Umschauen', 4500);
});
