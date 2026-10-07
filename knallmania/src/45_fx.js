/* =====================================================================
   45_fx: High-Level-Effekte – Knall, Feuerkugel, Schuss-Flugbahnen, Himmelsexplosionen
   ===================================================================== */
const PAL = {
  red: [1, .08, .05], green: [.08, 1, .18], blue: [.1, .28, 1], gold: [1, .6, .1], white: [1, .93, .82],
  purple: [.62, .1, 1], cyan: [.08, .9, 1], pink: [1, .12, .5], orange: [1, .36, .04], silver: [.82, .92, 1], lime: [.55, 1, .08]
};
const PAL_KEYS = Object.keys(PAL);

const _v = V3(), _q = new THREE.Quaternion(), _a = V3(), _b = V3(), _c = V3();
function rsphere(o) { const z = rand(-1, 1), a = rand(TAU), r = Math.sqrt(1 - z * z); return o.set(r * Math.cos(a), z, r * Math.sin(a)); }

/* Flugbahn mit Luftwiderstand k und Schwerkraft g – exakt wie im Shader */
function pathAt(p0, v0, k, g, t, out) {
  const e = Math.exp(-k * t), f = (1 - e) / k, vt = -g / k;
  out.x = p0.x + v0.x * f; out.y = p0.y + vt * t + (v0.y - vt) * f; out.z = p0.z + v0.z * f; return out;
}
function velAt(v0, k, g, t, out) {
  const e = Math.exp(-k * t), vt = -g / k;
  out.x = v0.x * e; out.y = (v0.y - vt) * e + vt; out.z = v0.z * e; return out;
}

const FX = (() => {
  /* ---------- Bodenknall: Böller, Bomben ---------- */
  function bang(pos, p, o = {}) {
    const x = pos.x, y = pos.y, z = pos.z, dens = Q.dens, nearGround = y < 1.6;
    const wbias = G.wind;
    // Mündungsblitz
    sp(x, y, z, 0, 0, 0, 1, .95, .8, .4 + p * .16, .07 + .006 * p, 1, 0, 0, 0, 9, 0);
    sp(x, y, z, 0, 0, 0, 1, .6, .2, 1.1 + p * .5, .2 + .02 * p, 1, 0, 0, 0, 3.2, 0);
    sp(x, y, z, 0, 0, 0, 1, .35, .08, 2 + p * .9, .55 + .04 * p, 1, 0, 0, 0, .55, 0);
    // Funkenregen
    const n = Math.floor((16 + p * 5) * dens);
    for (let i = 0; i < n; i++) {
      rsphere(_v); const up = nearGround ? Math.abs(_v.y) * 1.3 : _v.y, sp_ = rand(2, 7 + Math.sqrt(p) * 3.2);
      sp(x, y, z, _v.x * sp_, up * sp_ + 1.5, _v.z * sp_, 1, rand(.6, .95), rand(.25, .6), rand(.05, .12) * (1 + p * .02), rand(.3, .9), 1.5, 9.8, 0, .8, 2.4, 0);
    }
    // Papierfetzen / Dreck (fallen schnell)
    const nb = Math.floor((6 + p * .8) * dens);
    for (let i = 0; i < nb; i++) {
      rsphere(_v); const s = rand(3, 8 + p * .35);
      smk(x, y, z, _v.x * s, Math.abs(_v.y) * s + 1, _v.z * s, o.paper ? o.paper[0] : .8, o.paper ? o.paper[1] : .08, o.paper ? o.paper[2] : .06, .09 + p * .004, 0, rand(.7, 1.6), 1.1, -9, .9, 0);
    }
    // Staub & Rauch
    if (nearGround) {
      const nd = Math.floor((5 + p * .55) * dens);
      for (let i = 0; i < nd; i++) { const a = rand(TAU), s = rand(.8, 2.2 + p * .12); smk(x, .15, z, Math.cos(a) * s, rand(.1, .8), Math.sin(a) * s, .5, .43, .33, .5 + p * .03, 1.8 + p * .12, rand(2.2, 4.2), 1.8, .12, .5, 1); }
      Scorch.add(x, z, 1 + p * .2);
    }
    const ns = 2 + Math.floor(p * .22);
    for (let i = 0; i < ns; i++) { rsphere(_v); smk(x + _v.x * .2, y + .1, z + _v.z * .2, _v.x * 1.2, Math.abs(_v.y) * 1.5 + .6, _v.z * 1.2, .62, .62, .64, .5 + p * .035, 1.4 + p * .1, rand(4, 8) + p * .08, .9, .5, .55, 1); }
    // Licht, Druckwelle
    Lights.add(pos, 1, .74, .45, clamp(2.4 + p * .45, 2, 22), 9 + p * 1.5, .3 + .012 * p);
    if (p >= 6) Shock.add(pos, 3.5 + p * .85, clamp(p / 18, .3, 1.6));
    // Feuerball bei großen Bomben
    if (p >= 22) fireball(pos, clamp(p / 40, .5, 3), nearGround);
    SFX.bang(pos, p, { crackle: p > 10 });
  }

  function fireball(pos, s, ground) {
    const x = pos.x, y = pos.y, z = pos.z, n = Math.floor(70 * Q.dens);
    for (let i = 0; i < n; i++) {
      rsphere(_v); const sp_ = rand(2, 11) * s, up = ground ? Math.abs(_v.y) : _v.y;
      sp(x, y, z, _v.x * sp_, up * sp_ + 3 * s, _v.z * sp_, 1, rand(.28, .5), .05, rand(2, 4.4) * s, rand(.9, 2.1), 1.5, -3.2, 0, 1, .9, 0);
    }
    for (let i = 0; i < 14; i++) { const a = rand(TAU), r = rand(.5, 3) * s; smk(x + Math.cos(a) * r, y + 1, z + Math.sin(a) * r, Math.cos(a) * 2, rand(5, 15) * s, Math.sin(a) * 2, .3, .29, .3, 2.5 * s, 7 * s, rand(10, 18), .7, 1.5, .6, 1); }
    // Pilzhut aus Funken
    for (let i = 0; i < 40 * Q.dens; i++) { const a = rand(TAU), r = rand(2, 9) * s; sp(x, y + 6 * s, z, Math.cos(a) * r, rand(6, 12) * s, Math.sin(a) * r, 1, .32, .06, rand(2, 3.5) * s, rand(1.4, 2.6), 1.7, -.5, 0, 1, .7, .25); }
  }

  /* ---------- Mündungsfeuer (Batterie, Mörser) ---------- */
  function muzzle(pos, dir, s = 1) {
    sp(pos.x, pos.y, pos.z, dir.x * 2, dir.y * 2, dir.z * 2, 1, .85, .5, .5 * s, .09, 1, 0, 0, 0, 6, 0);
    const n = Math.floor((8 + 14 * s) * Q.dens);
    for (let i = 0; i < n; i++) {
      rsphere(_v); const sp_ = rand(5, 16) * s;
      sp(pos.x, pos.y, pos.z, dir.x * sp_ + _v.x * 3, dir.y * sp_ + _v.y * 3, dir.z * sp_ + _v.z * 3, 1, rand(.6, .9), rand(.2, .5), rand(.06, .12) * s, rand(.25, .6), 1.4, 9.8, 0, .8, 2.2, 0);
    }
    smk(pos.x, pos.y + .15, pos.z, dir.x * 2, dir.y * 2 + .6, dir.z * 2, .7, .7, .72, .35 * s, 1.5 * s, rand(3, 5), 1.3, .4, .5, 1);
    Lights.add(pos, 1, .7, .4, 2.2 * s, 12 * s, .2);
  }

  /* ---------- Lunten-Funken ---------- */
  function fuseSpark(pos, dt) {
    let n = 38 * dt; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      rsphere(_v); const s = rand(.8, 3);
      sp(pos.x, pos.y, pos.z, _v.x * s, _v.y * s + 1.2, _v.z * s, 1, rand(.65, .95), rand(.2, .5), rand(.012, .026), rand(.18, .45), 1.4, 9.8, 0, .8, 2.6, 0);
    }
    sp(pos.x, pos.y, pos.z, 0, 0, 0, 1, .85, .55, .05, .06, 1, 0, 0, 0, 2.5, 0);
  }

  /* ---------- Sternformen ---------- */
  const qA = new THREE.Quaternion();
  function shapeIter(spec, n, cb) {
    const sh = spec.shape || 'sphere';
    if (sh === 'ring' || sh === 'saturn') {
      const tilt = rand(.2, 1.35), az = rand(TAU);
      _b.set(Math.cos(az) * Math.sin(tilt), Math.cos(tilt), Math.sin(az) * Math.sin(tilt)); // Ebenen-Normale
      _a.set(0, 1, 0).cross(_b); if (_a.lengthSq() < 1e-4) _a.set(1, 0, 0); _a.normalize(); _c.crossVectors(_b, _a);
    }
    const sphere = (m, mul, ci) => {
      qA.set(rand(-1, 1), rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
      for (let i = 0; i < m; i++) {
        const y = 1 - 2 * (i + .5) / m, r = Math.sqrt(1 - y * y), ph = i * 2.39996323;
        _v.set(Math.cos(ph) * r, y, Math.sin(ph) * r).applyQuaternion(qA);
        cb(_v.x, _v.y, _v.z, mul * (1 + rand(-1, 1) * (spec.jitter ?? .03)), ci, i, y);
      }
    };
    const ring = (m, mul, ci) => {
      for (let i = 0; i < m; i++) { const a = i / m * TAU + rand(-.02, .02); cb(_a.x * Math.cos(a) + _c.x * Math.sin(a), _a.y * Math.cos(a) + _c.y * Math.sin(a), _a.z * Math.cos(a) + _c.z * Math.sin(a), mul, ci, i, 0); }
    };
    // Ebene zur Kamera gerichtet (Herz, Smiley)
    const facing = () => { _a.set(camera.position.x - spec.cx, 0, camera.position.z - spec.cz); if (_a.lengthSq() < 1e-3) _a.set(0, 0, 1); _a.normalize(); _b.set(0, 1, 0).cross(_a).normalize(); _c.set(0, 1, 0); };
    switch (sh) {
      case 'ring': ring(n, 1, 0); break;
      case 'saturn': sphere(Math.floor(n * .6), .78, 0); ring(Math.floor(n * .4), 1.1, 1); break;
      case 'heart': {
        facing();
        for (let i = 0; i < n; i++) {
          const t = i / n * TAU, hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const u = hx / 17, w = (hy + 2.5) / 15;
          cb(_b.x * u + _c.x * w, _b.y * u + _c.y * w, _b.z * u + _c.z * w, 1, 0, i, 0);
        }
        break;
      }
      case 'smiley': {
        facing();
        const put = (u, w, ci, i) => cb(_b.x * u + _c.x * w, _b.y * u + _c.y * w, _b.z * u + _c.z * w, 1, ci, i, 0);
        const nf = Math.floor(n * .5);
        for (let i = 0; i < nf; i++) { const a = i / nf * TAU; put(Math.cos(a), Math.sin(a), 0, i); }
        for (let e = -1; e <= 1; e += 2) for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; put(e * .36 + Math.cos(a) * .1, .32 + Math.sin(a) * .13, 1, i); }
        const nm = Math.floor(n * .22);
        for (let i = 0; i < nm; i++) { const a = Math.PI * (1.17 + .66 * i / (nm - 1)); put(Math.cos(a) * .62, Math.sin(a) * .62 + .02, 1, i); }
        break;
      }
      case 'palm': {
        const arms = spec.arms || 11;
        for (let i = 0; i < arms; i++) { const a = i / arms * TAU + rand(-.15, .15), el = rand(.35, 1.1), c = Math.cos(el); cb(Math.cos(a) * c, Math.sin(el), Math.sin(a) * c, rand(.85, 1.1), 0, i, 0); }
        break;
      }
      default: {
        sphere(n, 1, 0);
        if (spec.pistil) sphere(Math.floor(n * .34), .42, -1);
      }
    }
  }

  /* ---------- Himmels-Explosion ---------- */
  function burst(pos, spec) {
    spec.cx = pos.x; spec.cz = pos.z;
    const dens = Q.dens, cols = spec.colors, ncol = cols.length;
    const big = spec.big ?? 1;
    const speed = spec.speed, drag = spec.drag ?? 1.9, life = spec.life ?? 2.4, grav = spec.grav ?? 4, size = spec.size ?? 1.2;
    const trail = spec.trail ?? 1, tl = spec.trailLife ?? .5, tstep = (spec.tstep ?? .07) / Math.max(.6, dens);
    const n = Math.max(10, Math.floor(spec.n * dens));
    const wx = G.wind.x * .3, wz = G.wind.z * .3;
    const crossette = spec.shape === 'crossette';
    const splits = crossette ? [] : null;
    const gcol = spec.trailColor;

    shapeIter(spec, n, (dx, dy, dz, mul, ci, idx, yy) => {
      let c;
      if (ci < 0) c = spec.pistil; else if (spec.mode === 'multi') c = pick(cols); else if (spec.mode === 'alt') c = cols[idx % ncol]; else if (spec.mode === 'halves') c = cols[yy > 0 ? 0 : (1 % ncol)]; else c = cols[Math.min(ci, ncol - 1)];
      const sp_ = speed * mul, vx = dx * sp_ + wx, vy = dy * sp_, vz = dz * sp_ + wz;
      const L = life * (ci < 0 ? .75 : 1) * (1 + rand(-1, 1) * (spec.lifeJ ?? .1));
      sp(pos.x, pos.y, pos.z, vx, vy, vz, c[0], c[1], c[2], size * (ci < 0 ? .8 : 1), L, drag, grav, spec.flick || 0, spec.cool ?? .5, 3.6, 0);
      if (trail > 0) {
        const tc = gcol || c, vt = -grav / drag, spd0 = sp_;
        for (let tt = tstep * .4; tt < L * .92;) {
          const vNow = spd0 * Math.exp(-drag * tt) + 2.5, stp = clamp((spec.tspace ?? .9) / vNow, tstep * .2, tstep);
          if (trail >= 1 || Math.random() < trail) {
            const e = Math.exp(-drag * tt), f = (1 - e) / drag;
            sp(pos.x + vx * f, pos.y + vt * tt + (vy - vt) * f, pos.z + vz * f, rand(-.35, .35), rand(-.35, .2), rand(-.35, .35),
              tc[0], tc[1], tc[2], size * .6 * (1 - .35 * tt / L), tl * rand(.75, 1.25), 1.3, 3, 0, spec.trailCool ?? .9, 1.45 * (1 - .55 * tt / L) * Math.min(1, .35 + stp / tstep * .65), tt);
          }
          tt += stp;
        }
      }
      if (spec.crackle) {  // Knister-Funken am Ende der Bahn
        const tt = L * .8, e = Math.exp(-drag * tt), f = (1 - e) / drag, vt = -grav / drag;
        for (let k = 0; k < 3; k++) sp(pos.x + vx * f, pos.y + vt * tt + (vy - vt) * f, pos.z + vz * f, rand(-4, 4), rand(-3, 3), rand(-4, 4), 1, .85, .55, size * .22, rand(.35, .7), 1.6, 9.8, 22, 0, 2.6, tt + k * .08);
      }
      if (crossette) splits.push(vx, vy, vz, c);
    });

    // Crossette: Sterne teilen sich in Kreuze
    if (crossette) {
      const pv = { x: 0, y: 0, z: 0 }, vv = { x: 0, y: 0, z: 0 };
      Sched.at(G.time + life * .82, () => {
        for (let i = 0; i < splits.length; i += 4) {
          pathAt(pos, { x: splits[i], y: splits[i + 1], z: splits[i + 2] }, drag, grav, life * .82, pv);
          velAt({ x: splits[i], y: splits[i + 1], z: splits[i + 2] }, drag, grav, life * .82, vv);
          _a.set(vv.x, vv.y, vv.z).normalize(); _b.set(0, 1, 0).cross(_a); if (_b.lengthSq() < 1e-3) _b.set(1, 0, 0); _b.normalize(); _c.crossVectors(_a, _b);
          const c = splits[i + 3];
          sp(pv.x, pv.y, pv.z, 0, 0, 0, 1, .9, .7, 1.2 * big, .1, 1, 0, 0, 0, 4, 0);
          for (let k = 0; k < 4; k++) {
            const ax = k < 2 ? _b : _c, sg = k % 2 ? 1 : -1, sv = (spec.speed * .5) * 1.0;
            const vx = ax.x * sg * sv + vv.x * .2, vy = ax.y * sg * sv + vv.y * .2, vz = ax.z * sg * sv + vv.z * .2;
            sp(pv.x, pv.y, pv.z, vx, vy, vz, c[0], c[1], c[2], size * .9, 1.15, 2.3, 4, 0, .5, 3, 0);
            for (let tt = .06; tt < 1.0; tt += .06) { const e = Math.exp(-2.3 * tt), f = (1 - e) / 2.3, vt = -4 / 2.3; sp(pv.x + vx * f, pv.y + vt * tt + (vy - vt) * f, pv.z + vz * f, 0, 0, 0, c[0], c[1], c[2], size * .42, .5, 1.2, 3, 0, .8, 1.1 * (1 - tt), tt); }
          }
        }
        Lights.add(pos, cols[0][0], cols[0][1], cols[0][2], 3 * big, 90 * big, .7);
        SFX.burst(pos, big * .6, { crackle: true });
      });
    }

    // Blitz, Farbglühen, Licht, Ton, Rauch
    const mc = cols[0];
    sp(pos.x, pos.y, pos.z, 0, 0, 0, 1, .95, .85, 18 * big, .24, 1, 0, 0, 0, 6, 0);
    sp(pos.x, pos.y, pos.z, 0, 0, 0, mc[0], mc[1], mc[2], 44 * big, .7, 1, 0, 0, 0, 1.6, 0);
    Lights.add(pos, mc[0] * .8 + .2, mc[1] * .8 + .2, mc[2] * .8 + .2, 4.2 * big, 140 * Math.sqrt(big), 1.6 + big * .3);
    SFX.burst(pos, big, { crackle: spec.crackle !== false && big > .5, sizzle: spec.shape === 'willow' });
    const ns = big > .6 ? 3 : 1;
    for (let i = 0; i < ns; i++) smk(pos.x + rand(-2, 2), pos.y + rand(-2, 2), pos.z + rand(-2, 2), rand(-1, 1) + G.wind.x * .3, rand(-.3, .4), rand(-1, 1) + G.wind.z * .3, .5, .5, .55, 7 * big, 11 * big, rand(20, 30), .1, .01, .17, 1);
    G.shows = (G.shows || 0) + 1;
  }

  /* ---------- Rezepte ---------- */
  function pal(n, set) { const keys = (set || PAL_KEYS).slice(); const out = []; while (out.length < n && keys.length) out.push(PAL[keys.splice(randi(0, keys.length - 1), 1)[0]]); return out; }
  /* kind: chrys|peony|willow|palm|ring|saturn|heart|smiley|crossette|strobe|kamuro|multi|pistil ; s = Größenfaktor (Batterie ~.35, Mörser 1..1.8) */
  function recipe(kind, s = 1, colors) {
    const sp0 = recipeRaw(kind, s, colors);
    if (s < 1) sp0.n = Math.round(sp0.n * (.38 + .62 * s));
    return sp0;
  }
  function recipeRaw(kind, s = 1, colors) {
    const one = () => [colors ? colors[0] : PAL[pick(['red', 'green', 'blue', 'purple', 'pink', 'cyan', 'orange', 'lime'])]];
    const R = (o) => Object.assign({ big: s, speed: 30 * Math.sqrt(s) + 6, drag: 1.9, life: 2.4, grav: 4.5, size: .85 + .8 * Math.min(s, 2.2) }, o);
    switch (kind) {
      case 'peony': return R({ shape: 'sphere', colors: colors || one(), n: 200 + 120 * s, trail: 0, pistil: pick([null, PAL.white, PAL.gold]), life: 2.1 });
      case 'chrys': return R({ shape: 'sphere', colors: colors || one(), n: 190 + 110 * s, trail: 1, tl: .55, trailLife: .55, life: 2.5 });
      case 'willow': return R({ shape: 'willow', colors: colors || [PAL.gold], n: 130 + 80 * s, speed: (34 * Math.sqrt(s) + 6) * .95, drag: 1.55, life: 4.4, grav: 5.2, trail: 1, trailLife: 1.5, tstep: .075, trailCool: 1, cool: .9, crackle: s > .5, jitter: .09 });
      case 'kamuro': return R({ shape: 'sphere', colors: colors || [PAL.gold], trailColor: PAL.gold, n: 160 + 90 * s, speed: (32 * Math.sqrt(s) + 6) * .95, drag: 1.5, life: 3.8, grav: 5, trail: 1, trailLife: 1.2, tstep: .08, crackle: true, jitter: .1, cool: .9 });
      case 'palm': return R({ shape: 'palm', colors: colors || [pick([PAL.gold, PAL.red, PAL.green])], arms: randi(9, 13), n: 12, speed: 34 * Math.sqrt(s) + 6, drag: 1.45, life: 3.2, grav: 7, size: 1.7 + s * .8, trail: 1, trailLife: 1.0, tstep: .035, tspace: .38, crackle: true });
      case 'ring': return R({ shape: 'ring', colors: colors || one(), n: 70 + 30 * s, trail: .8, trailLife: .45, life: 2.2 });
      case 'saturn': { const c = pal(2); return R({ shape: 'saturn', colors: colors || c, n: 200 + 90 * s, trail: .5, life: 2.3 }); }
      case 'heart': return R({ shape: 'heart', colors: colors || [pick([PAL.red, PAL.pink])], n: 90 + 24 * s, speed: (28 * Math.sqrt(s) + 6) * .9, trail: .9, trailLife: .5, life: 2.4, grav: 3.5 });
      case 'smiley': return R({ shape: 'smiley', colors: colors || [PAL.gold, PAL.white], n: 100 + 30 * s, speed: (26 * Math.sqrt(s) + 6) * .9, trail: .5, life: 2.4, grav: 3 });
      case 'crossette': return R({ shape: 'crossette', colors: colors || pal(1, ['red', 'green', 'orange', 'cyan', 'gold']), n: 16 + 9 * s, speed: 26 * Math.sqrt(s) + 6, drag: 1.4, life: .9, grav: 4, trail: 1, trailLife: .45, tstep: .06 });
      case 'strobe': return R({ shape: 'sphere', colors: colors || [PAL.white], n: 150 + 70 * s, flick: 12, trail: 0, life: 2.8, cool: .15, size: (.85 + .8 * Math.min(s, 2.2)) * 1.1, lifeJ: .3 });
      case 'multi': return R({ shape: 'sphere', colors: colors || pal(3), mode: 'multi', n: 230 + 110 * s, trail: .7, life: 2.4, pistil: pick([null, PAL.white]) });
      case 'pistil': { const c = pal(2); return R({ shape: 'sphere', colors: colors || [c[0]], pistil: c[1], n: 190 + 100 * s, trail: .8, life: 2.4 }); }
      default: return recipeRaw('chrys', s, colors);
    }
  }
  const ALL_KINDS = ['chrys', 'peony', 'willow', 'palm', 'ring', 'saturn', 'heart', 'crossette', 'strobe', 'kamuro', 'multi', 'pistil', 'smiley'];

  /* ---------- Schuss: aufsteigende Sternkomet bis zur Explosion ---------- */
  function launchShell(p0, v0, o) {
    const k = o.k ?? .09, g = 9.8, T0 = o.delay || 0;
    let tb = o.t;
    // Hindernis-Check auf der Flugbahn (Hauswand, Kiste …)
    let impact = null;
    if (o.check !== false && typeof Phys !== 'undefined') {
      let prev = _a.set(p0.x, p0.y, p0.z).clone(), pt = {};
      for (let t = .12; t <= tb + .001; t += .12) {
        pathAt(p0, v0, k, g, t, pt);
        if (pt.y < .1) { impact = { t: t - .06, pos: V3(pt.x, .1, pt.z) }; break; }
        const hit = Phys.segHit(prev, _b.set(pt.x, pt.y, pt.z), o.ignore);
        if (hit) { impact = { t: t - .06, pos: hit }; break; }
        prev.set(pt.x, pt.y, pt.z);
      }
    }
    if (impact) tb = Math.max(.05, impact.t);
    const hc = o.headCol || [1, .72, .38];
    sp(p0.x, p0.y, p0.z, v0.x, v0.y, v0.z, hc[0], hc[1], hc[2], o.headSize ?? .5, tb, k, g, 0, .5, 2.6, T0);
    const step = o.tstep ?? .045, spc = o.tspace ?? .8, pt = {}, spd0 = v0.length();
    for (let tt = step * .3; tt < tb;) {
      pathAt(p0, v0, k, g, tt, pt);
      const vNow = spd0 * Math.exp(-k * tt) + 3, stp = clamp(spc / vNow, step * .18, step);
      sp(pt.x, pt.y, pt.z, rand(-.5, .5), rand(-.7, .1), rand(-.5, .5), 1, rand(.55, .75), rand(.2, .32), (o.headSize ?? .5) * (o.trailSize ?? .6), rand(.45, .75), 1.6, 3, 0, .9, (o.trailInt ?? 1.6) * Math.min(1, .3 + stp / step * .7), T0 + tt);
      tt += stp;
    }
    const bp = pathAt(p0, v0, k, g, tb, {});
    const bpos = V3(bp.x, bp.y, bp.z);
    Sched.at(G.time + T0 + tb, () => {
      if (impact) { bang(bpos, 3, {}); if (o.spec) burst(bpos, Object.assign({}, o.spec, { big: (o.spec.big || 1) * .5, n: o.spec.n * .5 })); }
      else if (o.spec) burst(bpos, o.spec);
      if (o.onBurst) o.onBurst(bpos);
    });
    return { tb, bpos, impact };
  }

  /* ---------- sichtbare Geschosse (Raketen-Körper) ---------- */
  const projectiles = [];
  function addProjectile(obj, p0, v0, k, g, t0, tEnd) { projectiles.push({ obj, p0: p0.clone(), v0: v0.clone(), k, g, t0, tEnd }); scene.add(obj); }
  const _pp = {}, _pv = {};
  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i], t = G.time - p.t0;
      if (t >= p.tEnd) { scene.remove(p.obj); projectiles.splice(i, 1); continue; }
      if (t < 0) { p.obj.visible = false; continue; }
      p.obj.visible = true;
      pathAt(p.p0, p.v0, p.k, p.g, t, _pp); velAt(p.v0, p.k, p.g, t, _pv);
      p.obj.position.set(_pp.x, _pp.y, _pp.z);
      _a.set(_pv.x, _pv.y, _pv.z).normalize(); p.obj.quaternion.setFromUnitVectors(V3(0, 1, 0), _a);
    }
  }
  function clearAll() { projectiles.forEach(p => scene.remove(p.obj)); projectiles.length = 0; }

  return { bang, fireball, muzzle, fuseSpark, burst, recipe, ALL_KINDS, launchShell, addProjectile, updateProjectiles, clearAll, pal };
})();
