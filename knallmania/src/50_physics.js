/* =====================================================================
   50_physics: cannon.js-Welt, Dinge (Props/Items), Trümmer, Explosionen, Schaden
   ===================================================================== */
const GRP = { DEF: 1, PLAYER: 2, DEBRIS: 4 };

const Phys = (() => {
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 7; world.solver.tolerance = .002;
  world.defaultContactMaterial.contactEquationStiffness = 5e6;
  const matG = new CANNON.Material('g'), matO = new CANNON.Material('o'), matP = new CANNON.Material('p');
  const cm = (a, b, f, r) => world.addContactMaterial(new CANNON.ContactMaterial(a, b, { friction: f, restitution: r, contactEquationStiffness: 5e6, contactEquationRelaxation: 3 }));
  cm(matG, matO, .7, .1); cm(matO, matO, .5, .08); cm(matP, matG, 0, 0); cm(matP, matO, 0, 0);

  const gnd = new CANNON.Body({ mass: 0, material: matG, shape: new CANNON.Plane() });
  gnd.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  gnd.collisionFilterGroup = GRP.DEF; gnd.collisionFilterMask = GRP.DEF | GRP.PLAYER | GRP.DEBRIS;
  world.addBody(gnd);

  /* ---------- Dinge-Register ---------- */
  const things = new Set();
  let lastKnock = 0;
  function addThing(t) {
    t.dead = false; t.kind = t.kind || 'prop';
    const b = t.body;
    b.material = matO; b.collisionFilterGroup = GRP.DEF; b.collisionFilterMask = GRP.DEF | GRP.PLAYER | GRP.DEBRIS;
    b.allowSleep = true; b.sleepSpeedLimit = .25; b.sleepTimeLimit = .7;
    b.linearDamping = b.linearDamping || .02; b.angularDamping = b.angularDamping || .08;
    t.group.userData.thing = t;
    t.group.position.copy(b.position); t.group.quaternion.copy(b.quaternion);
    scene.add(t.group); world.addBody(b); things.add(t);
    b.addEventListener('collide', e => {
      const v = Math.abs(e.contact.getImpactVelocityAlongNormal()), now = performance.now();
      if (v > 2.4 && now - lastKnock > 45) { lastKnock = now; SFX.knock(b.position, v, !!t.metal); }
    });
    return t;
  }
  function removeThing(t) {
    if (t.dead) return; t.dead = true; things.delete(t);
    world.removeBody(t.body); scene.remove(t.group);
    if (t.onRemove) t.onRemove(t);
    t.group.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
  }
  function syncAll() {
    for (const t of things) {
      const b = t.body, sl = b.sleepState === CANNON.Body.SLEEPING;
      if (sl && t.slept) continue;
      t.group.position.copy(b.position); t.group.quaternion.copy(b.quaternion); t.slept = sl;
      if (b.position.y < -40 || Math.hypot(b.position.x, b.position.z) > 260) t.hp = -1, t.fell = true;
    }
  }

  /* ---------- Trümmer ---------- */
  const debris = [], dGeo = new THREE.BoxGeometry(1, 1, 1), dMats = new Map();
  const dMat = hex => { let m = dMats.get(hex); if (!m) { m = M(hex, { rough: .85 }); dMats.set(hex, m); } return m; };
  const MAXDEB = IS_MOBILE ? 70 : 150;
  function spawnDebris(pos, n, colors, size = .22, speed = 5, base) {
    for (let i = 0; i < n; i++) {
      if (debris.length >= MAXDEB) killDebris(debris[0]);
      const s = size * rand(.5, 1.4), sx = s * rand(.7, 1.6), sz = s * rand(.7, 1.6);
      const m = new THREE.Mesh(dGeo, dMat(pick(colors))); m.scale.set(sx, s, sz); m.castShadow = true; m.receiveShadow = true;
      const b = new CANNON.Body({ mass: .12 + s * s * s * 90, material: matO, shape: new CANNON.Box(new CANNON.Vec3(sx / 2, s / 2, sz / 2)) });
      b.collisionFilterGroup = GRP.DEBRIS; b.collisionFilterMask = GRP.DEF;
      b.position.set(pos.x + rand(-.3, .3), pos.y + rand(0, .4), pos.z + rand(-.3, .3));
      rsphere(_v); const sp_ = rand(.4, 1) * speed;
      b.velocity.set(_v.x * sp_ + (base ? base.x : 0), Math.abs(_v.y) * sp_ + 1 + (base ? base.y : 0), _v.z * sp_ + (base ? base.z : 0));
      b.angularVelocity.set(rand(-9, 9), rand(-9, 9), rand(-9, 9)); b.allowSleep = true; b.sleepSpeedLimit = .3; b.sleepTimeLimit = .4; b.linearDamping = .05;
      world.addBody(b); scene.add(m); m.position.copy(b.position);
      debris.push({ m, b, life: rand(7, 12), s0: m.scale.clone() });
    }
  }
  function killDebris(d) { world.removeBody(d.b); scene.remove(d.m); const i = debris.indexOf(d); if (i >= 0) debris.splice(i, 1); }
  function updateDebris(dt) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i]; d.life -= dt;
      if (d.life <= 0 || d.b.position.y < -20) { killDebris(d); continue; }
      if (d.b.sleepState !== CANNON.Body.SLEEPING) { d.m.position.copy(d.b.position); d.m.quaternion.copy(d.b.quaternion); }
      if (d.life < 1.2) { const k = d.life / 1.2; d.m.scale.set(d.s0.x * k, d.s0.y * k, d.s0.z * k); }
    }
  }

  /* ---------- Spieler-Körper ---------- */
  const player = new CANNON.Body({ mass: 75, material: matP, shape: new CANNON.Sphere(.42), fixedRotation: true, linearDamping: .0 });
  player.collisionFilterGroup = GRP.PLAYER; player.collisionFilterMask = GRP.DEF;
  player.position.set(0, 1.2, 9); player.allowSleep = false; player.updateMassProperties();
  world.addBody(player);
  let groundT = 0;
  player.addEventListener('collide', e => {
    const c = e.contact, ny = c.bi === player ? -c.ni.y : c.ni.y;
    if (ny > .5) groundT = .12;
  });

  /* ---------- Strahltests ---------- */
  const raycaster = new THREE.Raycaster(); raycaster.params.Line.threshold = .015;
  function pick_(origin, dir, maxD = 40, filter) {
    raycaster.set(origin, dir); raycaster.far = maxD;
    const objs = []; things.forEach(t => { if (!filter || filter(t)) objs.push(t.group); });
    let best = null;
    const hits = raycaster.intersectObjects(objs, true);
    for (const h of hits) {
      let o = h.object; while (o && !o.userData.thing) o = o.parent;
      if (!o) continue;
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : V3(0, 1, 0);
      best = { thing: o.userData.thing, point: h.point.clone(), normal: n, dist: h.distance }; break;
    }
    if (dir.y < -1e-4) {
      const t = -origin.y / dir.y;
      if (t > 0 && t < maxD && (!best || t < best.dist)) best = { thing: null, point: origin.clone().addScaledVector(dir, t), normal: V3(0, 1, 0), dist: t, ground: true };
    }
    return best;
  }
  const rr = new CANNON.RaycastResult(), fromV = new CANNON.Vec3(), toV = new CANNON.Vec3();
  function segHit(a, b, ignore) {
    fromV.set(a.x, a.y, a.z); toV.set(b.x, b.y, b.z); rr.reset();
    world.raycastClosest(fromV, toV, { collisionFilterMask: GRP.DEF, skipBackfaces: true }, rr);
    if (rr.hasHit && rr.body !== ignore && rr.body !== gnd) return V3(rr.hitPointWorld.x, rr.hitPointWorld.y, rr.hitPointWorld.z);
    return null;
  }

  /* ---------- Zerstörung ---------- */
  function destroyThing(t, from) {
    if (t.dead) return;
    const b = t.body, pos = V3(b.position.x, b.position.y, b.position.z);
    if (!t.fell) {
      if (t.debris) spawnDebris(pos, t.debrisN || 10, t.debris, t.debrisSize || .2, 5 + (from ? 3 : 0), b.velocity);
      SFX.shatter(pos, t.size || 1);
      const d = t.dust || 1;
      for (let i = 0; i < 4 * d; i++) { rsphere(_v); smk(pos.x, pos.y + .2, pos.z, _v.x * 1.5, Math.abs(_v.y) * 1.6 + .3, _v.z * 1.5, .5, .45, .38, .5 * (t.size || 1), 1.2 * (t.size || 1), rand(2.5, 4.5), 1.6, .15, .45, 1); }
      if (t.points) { G.score += t.points; G.destroyed++; popScore(t.points, t.name); }
      if (t.explosive) Sched.after(rand(.04, .16), () => explode(pos, t.explosive, { fire: true }));
    }
    if (t.item && t.item.state === 'idle' && !t.fell && t.item.def.fragileIgnite) t.item.ignite(.05);
    removeThing(t);
    if (t.onDestroy) t.onDestroy(t);
  }

  /* ---------- Explosion: Impuls, Schaden, Zündung, Spieler ---------- */
  function explode(pos, power, o = {}) {
    const R = o.radius ?? (3 + power * .95);
    FX.bang(pos, power, o);
    const dead = [], igniteR = Math.min(R * .55, 2.3 + power * .12);
    for (const t of things) {
      if (t.dead || t === o.ignore) continue;
      const b = t.body, dx = b.position.x - pos.x, dy = b.position.y - pos.y, dz = b.position.z - pos.z;
      const d = Math.hypot(dx, dy, dz);
      if (d > R + (t.rad || .5)) continue;
      const f = 1 - clamp((d - (t.rad || .3) * .5) / R, 0, 1), f2 = f * f, m = b.mass || 1;
      const dv = Math.min(power * 16 * f2 / m, o.cap ?? 27);
      const inv = 1 / Math.max(d, .15);
      b.velocity.x += dx * inv * dv; b.velocity.y += (dy * inv * .6 + .4) * dv; b.velocity.z += dz * inv * dv;
      b.angularVelocity.x += rand(-1, 1) * dv * .6; b.angularVelocity.y += rand(-1, 1) * dv * .6; b.angularVelocity.z += rand(-1, 1) * dv * .6;
      b.wakeUp(); t.slept = false;
      if (t.hp !== undefined && !t.tough) { t.hp -= power * 16 * f2 * (t.fragile || 1); if (t.hp <= 0) dead.push(t); }
      if (t.item && t.item.state === 'idle' && d < igniteR && power > 1.2 && Math.random() < .3 + f * .7) t.item.ignite(rand(.04, .4));
    }
    for (const t of dead) destroyThing(t, pos);
    // Trümmer werden mitgerissen
    for (const d of debris) {
      const b = d.b, dx = b.position.x - pos.x, dy = b.position.y - pos.y, dz = b.position.z - pos.z, dd = Math.hypot(dx, dy, dz);
      if (dd > R) continue; const f = 1 - dd / R, dv = Math.min(power * 12 * f * f / b.mass, 22), inv = 1 / Math.max(dd, .2);
      b.velocity.x += dx * inv * dv; b.velocity.y += (dy * inv * .6 + .5) * dv; b.velocity.z += dz * inv * dv; b.wakeUp();
    }
    // Spieler
    const cp = camera.position, pd = cp.distanceTo(pos), pr = R * 1.5;
    G.trauma = Math.min(1, G.trauma + clamp(power * .028 / (1 + pd * .12), 0, .55));
    if (pd < pr) {
      const f = 1 - pd / pr, dv = Math.min(power * 7 * f * f / 8, 14);
      _a.set(player.position.x - pos.x, 0, player.position.z - pos.z); if (_a.lengthSq() < .01) _a.set(0, 0, 1); _a.normalize();
      player.velocity.x += _a.x * dv; player.velocity.z += _a.z * dv; player.velocity.y += dv * .4;
      if (power > 14 && pd < R * .75) { G.ring = Math.max(G.ring, .9); G.flash = Math.max(G.flash, .5 * f); SFX.ring(); }
      else if (power > 6) G.flash = Math.max(G.flash, f * .18);
      G.kick = Math.max(G.kick, Math.min(14, power * .25 * f));
      if (power > 25 && pd < R * .5) { $('hurt').style.opacity = 1; setTimeout(() => $('hurt').style.opacity = 0, 400); }
    }
  }

  function clearAll() {
    for (const t of [...things]) removeThing(t);
    for (const d of [...debris]) killDebris(d);
  }

  function step(dt) { world.step(1 / 60, dt, 6); }
  return { world, player, things, addThing, removeThing, syncAll, spawnDebris, updateDebris, destroyThing, explode, pick: pick_, segHit, step, clearAll, matO, get onGround() { return groundT > 0; }, tickGround(dt) { groundT = Math.max(0, groundT - dt); } };
})();

const explode = Phys.explode;

/* ---------- Punkte-Popup ---------- */
let popAcc = 0, popTimer = 0;
function popScore(n, name) {
  popAcc += n; clearTimeout(popTimer);
  popTimer = setTimeout(() => { toast('+' + popAcc + ' Punkte' + (name ? ' · ' + name : ''), 1100); popAcc = 0; }, 160);
}
