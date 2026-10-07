/* =====================================================================
   60_models: prozedurale 3D-Modelle (Feuerwerk & Objekte) mit gezeichneten Etiketten
   ===================================================================== */
const Mdl = (() => {
  /* ---------- Etiketten ---------- */
  function paper(o) {
    return canvasTexture(o.w || 256, o.h || 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, o.c1); gr.addColorStop(1, o.c2 || o.c1); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.save(); g.globalAlpha = .2; g.fillStyle = o.accent || '#fff';
      if (o.pattern === 'stripes') for (let x = -h; x < w + h; x += w / 9) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w / 18, 0); g.lineTo(x + w / 18 - h * .5, h); g.lineTo(x - h * .5, h); g.fill(); }
      else if (o.pattern === 'rays') { g.translate(w / 2, h / 2); for (let i = 0; i < 18; i++) { g.rotate(TAU / 18); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, -h * .06); g.lineTo(w, h * .06); g.fill(); } }
      else if (o.pattern === 'dots') for (let y = 8; y < h; y += 22) for (let x = (y / 22 % 2) * 11 + 6; x < w; x += 22) { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); }
      else if (o.pattern === 'checks') for (let y = 0; y < h; y += h / 8) for (let x = ((y / (h / 8)) % 2) * (w / 16); x < w; x += w / 8) g.fillRect(x, y, w / 16, h / 8);
      g.restore();
      g.fillStyle = o.accent || '#ffd02a'; g.fillRect(0, 0, w, h * .07); g.fillRect(0, h * .93, w, h * .07);
      for (let i = 0; i < w * h / 40; i++) { const v = rand(0, 255) | 0; g.fillStyle = `rgba(${v},${v},${v},${rand(.02, .07)})`; g.fillRect(rand(w), rand(h), rand(1, 3), rand(1, 3)); }
      if (o.text) {
        g.save(); g.translate(w / 2, h * (o.sub ? .44 : .52)); if (o.rot) g.rotate(o.rot);
        let fs = h * (o.fs || .34); g.font = `900 ${fs}px Impact,"Arial Black",sans-serif`;
        while (g.measureText(o.text).width > w * .88 && fs > 8) { fs -= 2; g.font = `900 ${fs}px Impact,"Arial Black",sans-serif`; }
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = fs * .14; g.strokeStyle = o.stroke || '#150500'; g.strokeText(o.text, 0, 0);
        g.fillStyle = o.fg || '#fff3a0'; g.fillText(o.text, 0, 0); g.restore();
      }
      if (o.sub) { g.font = `800 ${h * .1}px "Arial Black",Arial,sans-serif`; g.textAlign = 'center'; g.fillStyle = o.subc || 'rgba(255,255,255,.92)'; g.fillText(o.sub, w / 2, h * .76); }
      if (o.warn) { g.font = `700 ${h * .055}px Arial,sans-serif`; g.fillStyle = 'rgba(0,0,0,.65)'; g.fillText('ACHTUNG · NICHT IN DER HAND HALTEN · ABSTAND 8 m', w / 2, h * .9); }
    });
  }
  const _tc = {};
  const pm = (key, o, extra) => { if (!_tc[key]) _tc[key] = new THREE.MeshStandardMaterial(Object.assign({ map: paper(o), roughness: .72, metalness: 0 }, extra || {})); return _tc[key]; };

  const dark = M(0x1a1a1e, { rough: .9 }), steel = M(0x7b8190, { rough: .35, metal: .85 }), wood = M(0x8a6238, { rough: .9 });
  const fuseMat = M(0x3f9a46, { rough: .8 }), fuseWhite = M(0xe8e4d4, { rough: .9 });
  const ember = M(0xff8a2a, { emissive: 0xff5a10, ei: 2 });

  function fuse(len = .05, mat = fuseMat, lean = .5) {
    const g = new THREE.Group(), a = mesh(new THREE.CylinderGeometry(.0028, .0028, len * .6, 5), mat, 0, len * .3, 0, false);
    const b = mesh(new THREE.CylinderGeometry(.0028, .0028, len * .5, 5), mat, 0, 0, 0, false);
    a.rotation.z = -lean * .4; b.position.set(Math.sin(lean * .4) * len * .3, len * .6 - .005, 0); b.position.y += len * .2; b.rotation.z = -lean * 1.1;
    g.add(a, b); return g;
  }
  function cyl(r, h, mat, x = 0, y = 0, z = 0, seg = 14) { return mesh(new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z); }

  /* ----------------------------- Böller ----------------------------- */
  function banger(o) {
    const g = new THREE.Group(), r = o.r, h = o.h;
    const body = pm('bang' + o.key, { c1: o.c1, c2: o.c2, accent: o.accent, text: o.text, sub: o.sub, pattern: o.pattern || 'stripes', fg: o.fg, fs: .3, w: 256, h: 128 });
    const b = mesh(new THREE.CylinderGeometry(r, r, h, 14), [body, o.capMat || dark, o.capMat || dark], 0, 0, 0); g.add(b);
    if (o.bands) for (const y of [-h * .44, h * .44]) g.add(cyl(r * 1.02, h * .06, o.bandMat || steel, 0, y, 0));
    const f = fuse(o.fuseLen || h * .55, o.fuseMat || fuseMat); f.position.set(0, h / 2, 0); g.add(f);
    return { group: g, shapes: [{ half: [r, h / 2, r] }], base: h / 2, tip: V3(Math.sin(.2) * (o.fuseLen || h * .55) * .75, h / 2 + (o.fuseLen || h * .55) * .88, 0) };
  }
  function bomb(o) {
    const g = new THREE.Group(), r = o.r, h = o.h;
    const body = pm('bomb' + o.key, { c1: o.c1, c2: o.c2, accent: o.accent, text: o.text, sub: o.sub, pattern: o.pattern, fg: o.fg, fs: .3, warn: true, w: 512, h: 256 });
    g.add(mesh(new THREE.CylinderGeometry(r, r * .96, h, 24), [body, steel, steel], 0, 0, 0));
    g.add(cyl(r * 1.03, h * .05, steel, 0, h * .38, 0, 24), cyl(r * 1.03, h * .05, steel, 0, -h * .38, 0, 24));
    g.add(mesh(new THREE.SphereGeometry(r * .98, 20, 8, 0, TAU, 0, Math.PI / 2), o.c1b ? M(o.c1b, { rough: .5, metal: .7 }) : steel, 0, h / 2, 0));
    const f = fuse(r * 1.4, fuseWhite); f.position.set(0, h / 2 + r * .7, 0); g.add(f);
    return { group: g, shapes: [{ half: [r, h / 2, r] }], base: h / 2, tip: V3(.012, h / 2 + r * .7 + r * 1.4 * .88, 0) };
  }

  /* ----------------------------- Ketten-Böller ----------------------------- */
  function chain(N, rows) {
    const g = new THREE.Group(), perRow = Math.ceil(N / rows), pos = [], w = .62, d = .36;
    const crGeo = new THREE.CylinderGeometry(.013, .013, .06, 8); crGeo.rotateZ(Math.PI / 2);
    const crMat = pm('chainred', { c1: '#d4151c', c2: '#8e0a10', accent: '#ffd02a', pattern: 'stripes', w: 128, h: 64 });
    const im = new THREE.InstancedMesh(crGeo, crMat, N); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V3(1, 1, 1), e = new THREE.Euler();
    const pts = [];
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / perRow), k = i % perRow, fwd = row % 2 === 0;
      const x = -w / 2 + (fwd ? k : perRow - 1 - k) / (perRow - 1) * w, z = -d / 2 + row / (rows - 1) * d + rand(-.006, .006);
      pos.push(V3(x, -.012 + .014, z)); pts.push(x, -.0, z);
      im.setMatrixAt(i, m.compose(pos[i], q.setFromEuler(e.set(rand(-.05, .05), rand(-.5, .5), 0)), s));
    }
    im.instanceMatrix.needsUpdate = true; g.add(im);
    const lg = new THREE.BufferGeometry(); const lp = [];
    for (let i = 0; i < N - 1; i++) lp.push(pos[i].x, -.006, pos[i].z, pos[i + 1].x, -.006, pos[i + 1].z);
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xc9b38a })));
    const f = fuse(.12, fuseMat); f.position.set(pos[0].x - .05, .0, pos[0].z); f.rotation.z = Math.PI / 2 * .9; g.add(f);
    return { group: g, shapes: [{ half: [w / 2 + .03, .02, d / 2 + .03] }], base: .02, tip: V3(pos[0].x - .16, .03, pos[0].z), im, crackers: pos, N };
  }
  function frog() {
    const g = new THREE.Group();
    const geo = new THREE.ConeGeometry(.04, .05, 3); const m = pm('frog', { c1: '#2e9a3c', c2: '#1a6a28', accent: '#fff', text: 'HOP', pattern: 'dots', w: 128, h: 64 });
    const a = mesh(geo, m, 0, 0, 0); a.rotation.x = .2; g.add(a); const f = fuse(.05, fuseWhite); f.position.set(0, .03, 0); g.add(f);
    return { group: g, shapes: [{ half: [.035, .025, .035] }], base: .025, tip: V3(.01, .075, 0) };
  }

  /* ----------------------------- Raketen ----------------------------- */
  function rocket(o) {
    const g = new THREE.Group(), s = o.s || 1;
    const bm = M(0x2c6a34, { rough: .12, metal: 0, transparent: true, opacity: .62 });
    const bottle = new THREE.Group();
    bottle.add(cyl(.04, .2, bm, 0, 0, 0, 14), mesh(new THREE.CylinderGeometry(.016, .04, .06, 14), bm, 0, .13, 0), cyl(.017, .05, bm, 0, .185, 0, 10));
    bottle.children.forEach(c => c.castShadow = false); bottle.add(cyl(.0195, .012, M(0x1e4a24, { rough: .2 }), 0, .21, 0, 10));
    g.add(bottle);
    g.add(mesh(new THREE.BoxGeometry(.007, .42, .007), M(0x9a7a4a, { rough: .9 }), 0, .02, 0));
    const body = pm('rk' + o.key, { c1: o.c1, c2: o.c2, accent: o.accent, text: o.text, pattern: o.pattern || 'stripes', fg: o.fg, w: 128, h: 128, fs: .3 });
    const bh = .17 * s, br = .02 * Math.sqrt(s);
    g.add(mesh(new THREE.CylinderGeometry(br, br, bh, 12), body, 0, .22 + bh / 2, 0));
    g.add(mesh(new THREE.ConeGeometry(br * 1.02, .06 * s, 12), M(o.nose, { rough: .6 }), 0, .22 + bh + .03 * s, 0));
    for (let i = 0; i < 3; i++) { const fin = mesh(new THREE.BoxGeometry(.004, .04, .028), M(o.nose), Math.cos(i * 2.094) * br, .24, Math.sin(i * 2.094) * br); fin.rotation.y = -i * 2.094; g.add(fin); }
    const f = fuse(.05, fuseWhite); f.position.set(0, .21, 0); g.add(f);
    const top = .22 + bh + .06 * s;
    return { group: g, shapes: [{ half: [.04, .115, .04] }, { half: [.02, (top - .2) / 2 - .01, .02], off: [0, .2 + (top - .2) / 2 - .01, 0] }], base: .115, tip: V3(.005, .245, 0), topY: top, noseY: top };
  }
  /* Flug-Körper (ohne Flasche) */
  function rocketBody(o) {
    const g = new THREE.Group(), s = o.s || 1, bh = .17 * s, br = .02 * Math.sqrt(s);
    g.add(mesh(new THREE.CylinderGeometry(br, br, bh, 10), M(o.c1, { rough: .7 }), 0, 0, 0, false));
    g.add(mesh(new THREE.ConeGeometry(br * 1.02, .06 * s, 10), M(o.nose), 0, bh / 2 + .03 * s, 0, false));
    g.add(mesh(new THREE.BoxGeometry(.007, .36, .007), M(0x9a7a4a), 0, -.19, 0, false));
    return g;
  }

  /* ----------------------------- Batterien ----------------------------- */
  function cake(o) {
    const cols = o.cols, rows = o.rows, pitch = .043;
    const w = cols * pitch + .03, d = rows * pitch + .03, h = o.h;
    const g = new THREE.Group();
    const side = pm('cake' + o.key, { c1: o.c1, c2: o.c2, accent: o.accent, text: o.text, sub: o.sub, pattern: o.pattern || 'rays', fg: o.fg, w: 512, h: 256, warn: true, fs: .3 });
    const side2 = pm('cake2' + o.key, { c1: o.c2, c2: o.c1, accent: o.accent, text: o.text2 || o.text, sub: o.sub2 || 'FEUERWERK', pattern: 'stripes', fg: o.fg, w: 512, h: 256, fs: .28 });
    const topTex = canvasTexture(256, 256, (c, ww, hh) => {
      c.fillStyle = '#b08a55'; c.fillRect(0, 0, ww, hh);
      for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${rand(60, 120) | 0},${rand(40, 80) | 0},20,.08)`; c.fillRect(rand(ww), rand(hh), 2, 2); }
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const x = (q + .5) / cols * (ww - 24) + 12, y = (r + .5) / rows * (hh - 24) + 12, rr = Math.min(ww / cols, hh / rows) * .4;
        c.fillStyle = '#16100a'; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
        c.strokeStyle = '#6a4a2a'; c.lineWidth = 2; c.stroke();
      }
    });
    const topMat = M(0xffffff, { map: topTex, rough: .85 });
    const mats = [side, side, topMat, dark, side2, side2];
    g.add(mesh(new THREE.BoxGeometry(w, h, d), mats, 0, 0, 0));
    for (const y of [-h / 2 + .01]) g.add(mesh(new THREE.BoxGeometry(w + .008, .02, d + .008), M(0x2a1e14), 0, y, 0));
    const f = fuse(.09, fuseMat); f.position.set(w / 2 - .02, h / 2, d / 2 - .02); g.add(f);
    const tubes = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) tubes.push({ x: ((q + .5) / cols - .5) * (w - .03), z: ((r + .5) / rows - .5) * (d - .03), q, r });
    return { group: g, shapes: [{ half: [w / 2, h / 2, d / 2] }], base: h / 2, tip: V3(w / 2 - .02 + .02, h / 2 + .075, d / 2 - .02), tubes, cols, rows, topY: h / 2, w, d };
  }

  /* ----------------------------- Fontänen & Co ----------------------------- */
  function fountain(o) {
    const g = new THREE.Group(), r = o.r, h = o.h;
    const body = pm('fo' + o.key, { c1: o.c1, c2: o.c2, accent: o.accent, text: o.text, sub: o.sub, pattern: o.pattern || 'rays', fg: o.fg, w: 256, h: 256, fs: .24 });
    g.add(mesh(new THREE.CylinderGeometry(r * .8, r, h, 18), [body, dark, dark], 0, 0, 0));
    g.add(cyl(r * .62, .006, M(0x120c08), 0, h / 2 + .003, 0, 14));
    const f = fuse(.08, fuseWhite); f.position.set(r * .35, h / 2, 0); g.add(f);
    return { group: g, shapes: [{ half: [r, h / 2, r] }], base: h / 2, tip: V3(r * .35 + .015, h / 2 + .07, 0), top: V3(0, h / 2 + .01, 0), r };
  }
  function roman(o) {
    const g = new THREE.Group(), r = .025, h = o.h;
    const body = pm('ro' + o.key, { c1: o.c1, c2: o.c2, accent: o.accent, text: 'ROMAN', sub: o.sub, pattern: 'stripes', fg: o.fg, w: 256, h: 256, fs: .24 });
    g.add(mesh(new THREE.CylinderGeometry(r, r, h, 14), [body, dark, dark], 0, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(.2, .018, .2), wood, 0, -h / 2 - .005, 0));
    g.add(mesh(new THREE.BoxGeometry(.012, h * .55, .05), wood, 0, -h / 2 + h * .27, 0), mesh(new THREE.BoxGeometry(.05, h * .55, .012), wood, 0, -h / 2 + h * .27, 0));
    const f = fuse(.07, fuseWhite); f.position.set(r * .5, h / 2, 0); g.add(f);
    return { group: g, shapes: [{ half: [.1, .012, .1], off: [0, -h / 2 - .005, 0] }, { half: [r, h / 2, r] }], base: h / 2 + .014, tip: V3(r * .5 + .012, h / 2 + .06, 0), top: V3(0, h / 2, 0) };
  }
  function mortar(o) {
    const g = new THREE.Group(), n = o.n, cols = o.cols || n, rows = o.rows || 1, tr = o.r, th = o.h, pitch = tr * 2.6;
    const w = cols * pitch + .06, d = rows * pitch + .06;
    g.add(mesh(new THREE.BoxGeometry(w, .07, d), pm('mbase' + o.key, { c1: '#6b4a2a', c2: '#4a321c', accent: '#d8a93a', text: o.text, sub: o.sub, pattern: 'stripes', w: 256, h: 128, fs: .3 }), 0, -th / 2 - .035, 0));
    const tubes = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = ((q + .5) / cols - .5) * (w - .06), z = ((r + .5) / rows - .5) * (d - .06);
      const t = mesh(new THREE.CylinderGeometry(tr, tr * 1.02, th, 16, 1, true), M(o.tube || 0x9aa0ac, { rough: .35, metal: .9, side: THREE.DoubleSide }), x, 0, z);
      g.add(t); g.add(mesh(new THREE.RingGeometry(tr * .55, tr * 1.04, 16).rotateX(-Math.PI / 2), M(0x555a64, { metal: .8, rough: .4 }), x, th / 2 + .001, z, false));
      g.add(mesh(new THREE.CircleGeometry(tr * .56, 14).rotateX(-Math.PI / 2), dark, x, th / 2 + .0012, z, false));
      tubes.push({ x, z });
    }
    const f = fuse(.1, fuseWhite); f.position.set(w / 2 - .02, -th / 2 + .02, d / 2 - .02); g.add(f);
    return { group: g, shapes: [{ half: [w / 2, .035, d / 2], off: [0, -th / 2 - .035, 0] }, { half: [w / 2 - .02, th / 2, d / 2 - .02] }], base: th / 2 + .07, tip: V3(w / 2 - .02 + .02, -th / 2 + .095, d / 2 - .02), tubes, topY: th / 2, w, d };
  }
  function spinner() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(.055, .055, .02, 18), [pm('spin', { c1: '#e8a319', c2: '#c9471a', accent: '#fff', text: 'WIRBEL', pattern: 'rays', w: 256, h: 128, fs: .3 }), dark, dark], 0, 0, 0));
    g.add(cyl(.012, .026, steel, 0, .004, 0, 8));
    const f = fuse(.05, fuseWhite); f.position.set(.045, .008, 0); f.rotation.z = -1.2; g.add(f);
    return { group: g, shapes: [{ half: [.055, .011, .055] }], base: .011, tip: V3(.085, .035, 0) };
  }
  function smokePot(c, name) {
    const g = new THREE.Group(), col = '#' + new THREE.Color(c).getHexString();
    g.add(mesh(new THREE.CylinderGeometry(.045, .05, .11, 16), [pm('sm' + name, { c1: col, c2: '#222', accent: '#fff', text: 'NEBEL', sub: name, pattern: 'dots', w: 256, h: 128, fs: .3 }), dark, dark], 0, 0, 0));
    g.add(cyl(.047, .012, M(c, { rough: .5 }), 0, .045, 0, 16));
    const f = fuse(.06, fuseWhite); f.position.set(.02, .055, 0); g.add(f);
    return { group: g, shapes: [{ half: [.05, .055, .05] }], base: .055, tip: V3(.032, .12, 0), top: V3(0, .06, 0) };
  }
  function sparkler() {
    const g = new THREE.Group();
    g.add(cyl(.045, .03, M(0x8a5a3a, { rough: 1 }), 0, -.13, 0, 12));
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, r = .015; g.add(mesh(new THREE.CylinderGeometry(.0028, .0028, .26, 5), steel, Math.cos(a) * r, 0, Math.sin(a) * r, false)); g.add(mesh(new THREE.CylinderGeometry(.0042, .0042, .17, 5), M(0x3a3a3a, { rough: .9 }), Math.cos(a) * r, .045, Math.sin(a) * r, false)); }
    return { group: g, shapes: [{ half: [.045, .145, .045] }], base: .145, tip: V3(0, .135, 0), top: V3(0, .14, 0) };
  }

  /* ----------------------------- Objekte (Props) ----------------------------- */
  const woodTex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#9a6e3c'; g.fillRect(0, 0, w, h);
    const pl = 5; for (let i = 0; i < pl; i++) {
      const y = i * h / pl; const v = rand(-14, 14);
      g.fillStyle = `rgb(${154 + v},${110 + v},${60 + v})`; g.fillRect(0, y + 1, w, h / pl - 2);
      for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(60,36,14,${rand(.1, .3)})`; g.lineWidth = rand(.6, 1.8); g.beginPath(); const yy = y + rand(h / pl); g.moveTo(0, yy); g.bezierCurveTo(w * .3, yy + rand(-3, 3), w * .6, yy + rand(-3, 3), w, yy + rand(-2, 2)); g.stroke(); }
      g.fillStyle = '#2c1e12'; g.fillRect(0, y, w, 2);
      for (const x of [10, w - 10]) { g.fillStyle = '#4a4a4a'; g.beginPath(); g.arc(x, y + h / pl / 2, 3, 0, TAU); g.fill(); }
    }
    g.strokeStyle = '#5a3a1c'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.strokeStyle = '#4a2e14'; g.lineWidth = 12; g.beginPath(); g.moveTo(10, 10); g.lineTo(w - 10, h - 10); g.stroke();
  });
  const crateMat = M(0xffffff, { map: woodTex, rough: .9 });
  function crate() { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(.8, .8, .8), crateMat, 0, 0, 0)); return { group: g, shapes: [{ half: [.4, .4, .4] }], base: .4 }; }
  function barrel(red) {
    const g = new THREE.Group();
    const tex = red ? paper({ w: 256, h: 256, c1: '#b8211b', c2: '#7a1010', accent: '#ffd02a', text: 'PULVER', sub: '⚠ EXPLOSIV', pattern: 'stripes', fg: '#fff3a0' })
      : canvasTexture(256, 256, (c, w, h) => { c.fillStyle = '#7a5530'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 22) { c.fillStyle = `rgb(${110 + rand(-14, 14)},${75 + rand(-10, 10)},${40})`; c.fillRect(x, 0, 20, h); c.fillStyle = '#2c1c0e'; c.fillRect(x + 20, 0, 2, h); } c.fillStyle = '#3a3a3c'; for (const y of [26, 70, 186, 230]) c.fillRect(0, y, w, 14); });
    g.add(mesh(new THREE.CylinderGeometry(.3, .3, .9, 20), [new THREE.MeshStandardMaterial({ map: tex, roughness: red ? .45 : .85, metalness: red ? .5 : 0 }), steel, steel], 0, 0, 0));
    g.add(cyl(.31, .04, steel, 0, .38, 0, 20), cyl(.31, .04, steel, 0, -.38, 0, 20));
    return { group: g, shapes: [{ half: [.28, .45, .28] }], base: .45 };
  }
  function gnome() {
    const g = new THREE.Group(), skin = M(0xf0bd9a, { rough: .7 }), coat = M(0x2f5fc0, { rough: .75 }), hat = M(0xd8232a, { rough: .6 }), white = M(0xf4f4f0, { rough: .9 });
    g.add(mesh(new THREE.CylinderGeometry(.085, .13, .26, 12), coat, 0, -.1, 0));
    g.add(mesh(new THREE.SphereGeometry(.085, 14, 10), skin, 0, .1, 0));
    g.add(mesh(new THREE.SphereGeometry(.022, 8, 6), M(0xe08a7a), 0, .098, .08));
    const beard = mesh(new THREE.ConeGeometry(.09, .2, 12), white, 0, .0, .035); beard.rotation.x = Math.PI + .25; g.add(beard);
    g.add(mesh(new THREE.ConeGeometry(.1, .26, 14), hat, 0, .29, 0));
    g.add(mesh(new THREE.TorusGeometry(.088, .016, 6, 14), white, 0, .17, 0).rotateX(Math.PI / 2));
    for (const s of [-1, 1]) { g.add(mesh(new THREE.CylinderGeometry(.025, .022, .15, 6), coat, s * .125, -.06, .02)); g.add(mesh(new THREE.SphereGeometry(.03, 6, 6), skin, s * .13, -.14, .04)); g.add(mesh(new THREE.BoxGeometry(.07, .05, .1), M(0x2a2a2a), s * .045, -.255, .02)); }
    return { group: g, shapes: [{ half: [.13, .29, .13], off: [0, .02, 0] }], base: .27 };
  }
  function mailbox() {
    const g = new THREE.Group(), y = M(0xffc400, { rough: .45, metal: .1 }), blk = M(0x161616, { rough: .6 });
    g.add(mesh(new THREE.BoxGeometry(.38, .62, .3), y, 0, .38, 0));
    const top = mesh(new THREE.CylinderGeometry(.15, .15, .38, 14, 1, false, 0, Math.PI), y, 0, .69, 0); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.scale.set(1, 1, 1); g.add(top);
    g.add(mesh(new THREE.BoxGeometry(.3, .035, .02), blk, 0, .52, .151), mesh(new THREE.BoxGeometry(.2, .12, .02), M(0xffffff, { rough: .5 }), 0, .3, .151));
    g.add(mesh(new THREE.BoxGeometry(.07, .5, .07), M(0x555a60, { rough: .5, metal: .7 }), 0, -.18, 0));
    return { group: g, shapes: [{ half: [.19, .55, .15], off: [0, .22, 0] }], base: .33 };
  }
  function dixi() {
    const g = new THREE.Group(), b = M(0x2477d6, { rough: .5 }), w = M(0xf2f4f6, { rough: .5 });
    g.add(mesh(new THREE.BoxGeometry(1.1, 2.1, 1.1), b, 0, 0, 0), mesh(new THREE.BoxGeometry(1.14, .22, 1.14), w, 0, 1.15, 0));
    g.add(mesh(new THREE.BoxGeometry(.76, 1.7, .03), M(0x1b5db0, { rough: .5 }), 0, -.05, .56), mesh(new THREE.BoxGeometry(.2, .12, .04), M(0xdd2222), 0, .12, .58), mesh(new THREE.BoxGeometry(.06, .22, .05), M(0xdddddd, { metal: .8 }), .3, -.05, .59));
    return { group: g, shapes: [{ half: [.56, 1.15, .56] }], base: 1.15 };
  }
  function car() {
    const g = new THREE.Group(), body = M(0xc22a22, { rough: .3, metal: .5 }), glass = M(0x14202c, { rough: .1, metal: .6 });
    g.add(mesh(new THREE.BoxGeometry(4.1, .75, 1.8), body, 0, -.1, 0), mesh(new THREE.BoxGeometry(2.1, .65, 1.64), glass, -.1, .58, 0));
    g.add(mesh(new THREE.BoxGeometry(2.0, .08, 1.6), body, -.1, .93, 0));
    for (const x of [-1.3, 1.3]) for (const z of [-.9, .9]) { const w = cyl(.34, .24, M(0x151515, { rough: .9 }), x, -.34, z, 14); w.rotation.x = Math.PI / 2; g.add(w); const r = cyl(.2, .26, steel, x, -.34, z, 10); r.rotation.x = Math.PI / 2; g.add(r); }
    for (const z of [-.62, .62]) { g.add(mesh(new THREE.BoxGeometry(.05, .16, .3), M(0xffffcc, { emissive: 0xffeeaa, ei: .3 }), 2.06, -.02, z)); g.add(mesh(new THREE.BoxGeometry(.05, .14, .3), M(0xaa1111, { emissive: 0x880000, ei: .4 }), -2.06, -.02, z)); }
    return { group: g, shapes: [{ half: [2.05, .65, .9], off: [0, .1, 0] }], base: .75 };
  }
  function brick() { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(.44, .2, .22), M(0xa5472f, { rough: .95 }), 0, 0, 0)); return { group: g, shapes: [{ half: [.22, .1, .11] }], base: .1 }; }
  function cardboard() {
    const g = new THREE.Group(); const t = paper({ w: 256, h: 256, c1: '#c19a62', c2: '#a98048', accent: '#8a6a3a', text: 'VORSICHT', sub: 'ZERBRECHLICH', pattern: 'checks', fg: '#7a1a1a', stroke: '#e8d2a6' });
    g.add(mesh(new THREE.BoxGeometry(.6, .5, .6), M(0xffffff, { map: t, rough: .95 }), 0, 0, 0)); return { group: g, shapes: [{ half: [.3, .25, .3] }], base: .25 };
  }

    /* ----------------------------- Obst & Dummy ----------------------------- */
  function melon(pumpkin) {
    const g = new THREE.Group(), r = pumpkin ? .27 : .24;
    const tex = canvasTexture(256, 128, (c, w, h) => {
      c.fillStyle = pumpkin ? '#e8791a' : '#2f8a3a'; c.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += pumpkin ? 26 : 32) { c.fillStyle = pumpkin ? 'rgba(150,60,0,.35)' : 'rgba(10,60,20,.55)'; c.beginPath(); c.ellipse(x, h / 2, pumpkin ? 5 : 8, h, 0, 0, TAU); c.fill(); }
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: .5 }));
    if (pumpkin) m.scale.set(1, .82, 1);
    g.add(m);
    g.add(mesh(new THREE.CylinderGeometry(.025, .035, .09, 6), M(pumpkin ? 0x4a6a1a : 0x3a5a20), 0, r * (pumpkin ? .82 : 1) + .01, 0));
    return { group: g, shapes: [{ radius: r * .96 }], base: r * (pumpkin ? .82 : 1) };
  }
  function dummyParts() {
    const yel = M(0xffc21a, { rough: .55 }), blk = M(0x151515, { rough: .6 });
    const target = canvasTexture(128, 128, (c, w, h) => {
      c.fillStyle = '#ffc21a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#151515'; c.beginPath(); c.arc(w / 2, h / 2, w * .42, 0, TAU); c.fill();
      c.fillStyle = '#ffc21a'; c.beginPath(); c.moveTo(w / 2, h / 2); c.arc(w / 2, h / 2, w * .42, 0, Math.PI / 2); c.fill();
      c.beginPath(); c.moveTo(w / 2, h / 2); c.arc(w / 2, h / 2, w * .42, Math.PI, Math.PI * 1.5); c.fill();
    });
    const tm = new THREE.MeshStandardMaterial({ map: target, roughness: .55 });
    const mk = (geo, mat) => { const g = new THREE.Group(); g.add(mesh(geo, mat, 0, 0, 0)); return g; };
    const torso = new THREE.Group(); torso.add(mesh(new THREE.BoxGeometry(.38, .52, .2), yel, 0, 0, 0));
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshStandardMaterial({ map: target, roughness: .55, transparent: true })); decal.position.set(0, .06, .101); torso.add(decal);
    torso.add(mesh(new THREE.BoxGeometry(.4, .06, .22), blk, 0, -.26, 0));
    const head = new THREE.Group(); head.add(mesh(new THREE.SphereGeometry(.13, 16, 12), yel, 0, 0, 0));
    const hd = new THREE.Mesh(new THREE.CircleGeometry(.08, 16), tm); hd.position.set(0, .01, .127); head.add(hd);
    const limb = (w, h, mat) => mk(new THREE.BoxGeometry(w, h, w), mat);
    return {
      torso: { g: torso, half: [.19, .26, .1], mass: 12 }, head: { g: head, r: .13, mass: 4 },
      arm: { g: () => limb(.09, .55, yel), half: [.045, .275, .045], mass: 3 }, leg: { g: () => limb(.13, .82, blk), half: [.065, .41, .065], mass: 7 }
    };
  }

  return { melon, dummyParts, paper, pm, banger, bomb, chain, frog, rocket, rocketBody, cake, fountain, roman, mortar, spinner, smokePot, sparkler, crate, barrel, gnome, mailbox, dixi, car, brick, cardboard, wood, steel, dark, M };
})();
