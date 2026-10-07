/* =====================================================================
   90_ui: Hotbar, Katalog, Pause-Menü, Touch-Steuerung
   ===================================================================== */
const UI = (() => {
  const hot = $('hotbar');
  let catTab = 'boeller';

  function slotInfo(s) {
    if (s.tool === 'lighter') return ['🔥', 'Feuerzeug'];
    if (s.tool === 'grab') return ['✋', 'Greifer'];
    if (s.tool === 'delete') return ['🗑️', 'Löschen'];
    const d = BYID[s.item]; return d ? [d.icon, d.name] : ['❔', '–'];
  }
  function refresh() {
    hot.innerHTML = '';
    P.slots.forEach((s, i) => {
      const [ic, nm] = slotInfo(s), el = document.createElement('div');
      el.className = 'slot' + (i === P.sel ? ' sel' : ''); el.innerHTML = `<span class="k">${i + 1}</span><span class="ic">${ic}</span><span class="nm">${nm}</span>`;
      el.onclick = () => setSlot(i); hot.appendChild(el);
    });
    nameLine();
  }
  function nameLine() {
    const s = P.slots[P.sel], el = $('itemname');
    if (s.tool === 'lighter') el.innerHTML = 'Feuerzeug<small>Auf Lunte zielen &amp; klicken</small>';
    else if (s.tool === 'grab') el.innerHTML = 'Greifer<small>Klick halten · Rad = Abstand · Rechtsklick = Werfen</small>';
    else if (s.tool === 'delete') el.innerHTML = 'Löschen<small>Klick auf ein Objekt entfernt es</small>';
    else { const d = BYID[s.item]; el.innerHTML = d.name + '<small>Klick = platzieren · F = lit werfen · R = drehen</small>'; }
  }

  /* ---------- Katalog ---------- */
  function renderCatalog() {
    const tabs = $('tabs'); tabs.innerHTML = '';
    CATS.forEach(c => { const b = document.createElement('button'); b.className = 'tab' + (c.id === catTab ? ' on' : ''); b.textContent = c.name; b.onclick = () => { catTab = c.id; renderCatalog(); }; tabs.appendChild(b); });
    const list = $('items'); list.innerHTML = '';
    DEFS.filter(d => d.cat === catTab).forEach(d => {
      const el = document.createElement('div'); el.className = 'it';
      const st = d.stats, bar = (n, l) => `<span>${l}</span><div class="bar"><i style="width:${n * 10}%"></i></div>`;
      el.innerHTML = `<div class="top"><span class="big">${d.icon}</span><h3>${d.name}</h3></div><p>${d.desc}</p>` + (st ? `<div class="bars">${bar(st[0], 'Lärm')}${bar(st[1], 'Wirkung')}${bar(st[2], 'Dauer')}</div>` : '');
      el.onclick = () => { assignItem(d.id); SFX.place(); closeCatalog(); toast(d.icon + ' ' + d.name + ' in Slot ' + (P.sel + 1)); };
      list.appendChild(el);
    });
    $('cat-slot').textContent = 'Ziel: Slot ' + (P.slots[P.sel].item ? P.sel + 1 : 4);
  }
  function openCatalog() {
    if (!P.slots[P.sel].item) { catTab = catTab || 'boeller'; }
    G.menu = 'catalog'; renderCatalog(); $('catalog').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    Input.down = false;
  }
  function closeCatalog() { $('catalog').classList.add('hidden'); G.menu = null; lock(); }

  /* ---------- Pause ---------- */
  function openPause() {
    if (G.menu) return;
    G.menu = 'pause'; G.frozen = true; $('pause').classList.remove('hidden'); Input.down = false; P.grab = null;
    document.querySelectorAll('#pq .btn').forEach(b => b.classList.toggle('on', b.dataset.q === qName));
    if (document.pointerLockElement) document.exitPointerLock();
  }
  function resume() { $('pause').classList.add('hidden'); G.menu = null; G.frozen = false; lock(); }
  function lock() {
    if (IS_TOUCH || Input.noLock) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { Input.noLock = true; }); } catch (e) { Input.noLock = true; }
    canvas.focus();
  }

  /* ---------- Einstellungen ---------- */
  function applyQuality(name) {
    qName = name; Q = QUALITY[name];
    World.setShadows(Q.shadows, Q.shadowSize); onResize();
    document.querySelectorAll('#pq .btn,#qrow .btn').forEach(b => b.classList.toggle('on', b.dataset.q === name));
    try { localStorage.setItem('knall_q', name); } catch (e) { }
  }
  function bindSettings() {
    $('s-vol').oninput = e => AU.setVolume(e.target.value / 100);
    $('s-sens').oninput = e => G.sens = e.target.value / 100;
    $('s-fov').oninput = e => { G.fov = +e.target.value; };
    $('s-wind').oninput = e => G.windK = e.target.value / 100;
    $('s-bloom').oninput = e => G.bloom = e.target.value / 100;
    document.querySelectorAll('#pq .btn').forEach(b => b.onclick = () => applyQuality(b.dataset.q));
    $('btn-resume').onclick = resume;
    $('btn-clean').onclick = () => { cleanUp(); toast('🧹 Aufgeräumt'); resume(); };
    $('btn-reset').onclick = () => { resetScene(); resume(); };
    $('cat-x').onclick = closeCatalog;
  }

  /* ---------- Touch ---------- */
  function bindTouch() {
    document.body.classList.add('touchmode'); $('touch').classList.remove('hidden');
    const joy = $('joy'), knob = joy.firstElementChild; let jid = null, jc = null;
    joy.addEventListener('touchstart', e => { const t = e.changedTouches[0]; jid = t.identifier; const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; mv(t); e.preventDefault(); }, { passive: false });
    const mv = t => { let dx = (t.clientX - jc.x) / 55, dy = (t.clientY - jc.y) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } Input.joy.x = dx; Input.joy.y = dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; };
    joy.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === jid) mv(t); e.preventDefault(); }, { passive: false });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === jid) { jid = null; Input.joy.x = Input.joy.y = 0; knob.style.transform = ''; } };
    joy.addEventListener('touchend', end); joy.addEventListener('touchcancel', end);
    // Umschauen: Wischen auf der Spielfläche
    let lid = null, lx = 0, ly = 0, ltime = 0, moved = 0;
    canvas.addEventListener('touchstart', e => { if (G.menu) return; const t = e.changedTouches[0]; lid = t.identifier; lx = t.clientX; ly = t.clientY; ltime = performance.now(); moved = 0; e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === lid) { Input.lookDX += (t.clientX - lx) * 1.6; Input.lookDY += (t.clientY - ly) * 1.6; moved += Math.abs(t.clientX - lx) + Math.abs(t.clientY - ly); lx = t.clientX; ly = t.clientY; } e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === lid) { lid = null; if (moved < 12 && performance.now() - ltime < 300 && G.started && !G.menu) { doPrimary(true); } } });
    const b = (id, fn, hold) => { const el = $(id); el.addEventListener('touchstart', e => { e.preventDefault(); fn(true); if (hold) Input.down = true; }, { passive: false }); el.addEventListener('touchend', e => { e.preventDefault(); if (hold) { Input.down = false; releasePrimary(); } }); };
    b('tb-act', () => doPrimary(true), true);
    b('tb-jump', () => { Input.jump = true; });
    b('tb-throw', () => throwLit());
    b('tb-all', () => Items.igniteAll());
    b('tb-cat', () => openCatalog());
    b('tb-menu', () => openPause());
    b('tb-prev', () => setSlot(P.sel - 1));
    b('tb-next', () => setSlot(P.sel + 1));
  }

  return { refresh, nameLine, openCatalog, closeCatalog, openPause, resume, lock, applyQuality, bindSettings, bindTouch };
})();
