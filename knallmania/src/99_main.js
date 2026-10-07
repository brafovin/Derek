/* =====================================================================
   99_main: Szene aufbauen, Hauptschleife, Start
   ===================================================================== */
function put(id, x, z, yaw = 0, y = 0) {
  const d = BYID[id];
  if (d.custom) { d.custom(V3(x, y, z), yaw); return null; }
  const m = d.build();
  return spawnDef(d, V3(x, y, z), yaw, m.base * (d.isProp ? 1 : ITEM_SCALE));
}

function buildScene() {
  // Zielobjekte vor dem Spieler (Blick Richtung -Z)
  put('mauer', -15, -30, .15); put('mauer', 15, -35, -.2);
  for (let i = 0; i < 5; i++) put('zwerg', -4 + i * 2, -26, rand(-.5, .5));
  put('turm', 0, -35);
  put('kiste', 7, -22); put('kiste', 7.9, -22.1, .2); put('kiste', 7.45, -22, .1, .81);
  put('fass', -8, -20); put('fass', -9.1, -20.6);
  put('pulverfass', -11, -27); put('pulverfass', 11, -28); put('pulverfass', 12.1, -28.3);
  put('dixi', -22, -23, .3);
  put('briefkasten', 21, -18, -.4); put('briefkasten', -3, -34, .1);
  put('auto', 24, -32, .7);
  put('karton', 3, -19); put('karton', 4.1, -19.2, .3); put('karton', -1.4, -18.5);
  // Starter-Feuerwerk (ungezündet)
  put('dummy', -17, -22, .4); put('dummy', 17, -24, -.3); put('melone', -5.6, -21.4); put('melone', -6.2, -22); put('kuerbis', 5.2, -21);
  put('flasche', -1.6, 4.6, .3); put('batt36', .6, 4.3, .4); put('kanone', 2.3, 5.6); put('vulkan', -3.2, 3.6); put('moerser1', 3.8, 3.4, .5);
  put('kracher', 1.2, 6.2); put('kracher', 1.4, 6.3, .4); put('kette50', -3, 6.5, .2);
}

function cleanUp() {
  Sched.clear(); FX.clearAll();
  for (const it of [...Items.list]) if (it.alive) Phys.removeThing(it.thing);
  Items.clear();
  for (const d of [...Phys.things]) { if (d.kind === 'item') Phys.removeThing(d); }
  Phys.updateDebris(1e6);
  Sparks.clear(); Smoke.clear(); Scorch.clear();
}
function resetScene() {
  cleanUp(); Phys.clearAll(); Items.clear();
  Phys.player.position.set(0, 1.2, 9); Phys.player.velocity.set(0, 0, 0); P.yaw = 0; P.pitch = 0;
  G.score = 0; G.destroyed = 0; G.lit = 0; buildScene(); toast('Neue Szene');
}

/* ---------- Simulation ---------- */
function simStep(dt) {
  G.time += dt;
  G.wind.set(Math.cos(G.time * .04) * 2.2 + 1.2, 0, Math.sin(G.time * .033) * 1.8);
  Sched.run();
  Phys.step(dt);
  Phys.syncAll(); Phys.updateDebris(dt);
  for (const t of [...Phys.things]) if (t.fell) Phys.destroyThing(t);
  Items.update(dt); FX.updateProjectiles();
}
/* Test-Hilfe: Simulation ohne Rendern vorspulen */
function advance(sec, step = 1 / 30) { for (let t = 0; t < sec; t += step) { G.real += step; simStep(step); } }

/* ---------- Hauptschleife ---------- */
let lastT = performance.now() / 1000, hudT = 0, fpsAcc = 0, fpsN = 0, lowT = 0;
const NOAUTO = new URLSearchParams(location.search).has('noauto');
function frame(nowMs) {
  requestAnimationFrame(frame);
  const now = nowMs / 1000, rdt = Math.min(now - lastT, .05); lastT = now; G.real += rdt;
  G.timeScale += (G.targetScale - G.timeScale) * Math.min(1, rdt * 6);
  const dt = G.frozen ? 0 : rdt * G.timeScale;

  if (G.started) {
    updatePlayer(rdt);
    if (!G.frozen) simStep(dt);
    hudT -= rdt;
    if (hudT <= 0) {
      hudT = .25;
      $('score').textContent = Math.round(G.score).toLocaleString('de-DE');
      $('sc-d').textContent = G.destroyed; $('sc-i').textContent = G.lit;
      const w = Math.hypot(G.wind.x, G.wind.z) * G.windK * 3;
      $('windinfo').textContent = 'Wind ' + w.toFixed(1) + ' m/s';
      const fps = fpsN ? fpsAcc / fpsN : 0; fpsAcc = fpsN = 0;
      $('fps').textContent = Math.round(fps) + ' FPS' + (qName ? ' · ' + qName : '');
      if (!NOAUTO && !G.menu && fps > 0) {
        if (fps < 26) lowT += .25; else lowT = Math.max(0, lowT - .5);
        if (lowT > 5 && qName !== 'low') { const order = ['low', 'mid', 'high', 'ultra']; UI.applyQuality(order[Math.max(0, order.indexOf(qName) - 1)]); toast('Grafik automatisch reduziert (' + qName + ')'); lowT = 0; }
      }
    }
    fpsAcc += 1 / Math.max(rdt, 1e-3); fpsN++;
  }
  World.update(G.real, camera.position);
  AU.listen();
  fxUpdate();
  Post.render(G.real);
  if (G.shot) {
    G.shot = false;
    canvas.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'knallmania-' + Date.now() + '.png'; a.click(); toast('📸 Foto gespeichert'); });
  }
}

/* ---------- Start ---------- */
function startGame() {
  AU.init();
  $('start').classList.add('hidden'); $('hud').classList.remove('hidden');
  G.started = true; UI.lock(); UI.refresh();
  toast(IS_TOUCH ? '🎒 Katalog · unten: Slots · 🔥 benutzen · 💥 alles zünden' : 'B = Katalog · 1 Feuerzeug · 4–9 Feuerwerk platzieren · G = alles zünden', 5000);
}
UI.bindSettings();
if (IS_TOUCH) UI.bindTouch();
document.querySelectorAll('#qrow .btn').forEach(b => { b.classList.toggle('on', b.dataset.q === qName); b.onclick = () => UI.applyQuality(b.dataset.q); });
$('btn-play').onclick = startGame;
buildScene(); buildGhost(); UI.refresh();
camera.position.set(0, 1.62, 9);
requestAnimationFrame(frame);
window.KM = { advance, simStep, G, P, Items, Phys, FX, DEFS, BYID, Sparks, Smoke, Lights, put, startGame, resetScene, cleanUp, explode, camera, scene, renderer, World, Post, UI, Input };
