/* =====================================================================
   30_audio: komplett synthetisierter 3D-Sound (Böller, Raketen, Echo, Tinnitus …)
   ===================================================================== */
const AU = (() => {
  let ctx = null, master, comp, lp, dry, wetIn, noiseBuf, crackleBuf;
  const S = { rate: 1, active: 0, ok: false };
  const _f = V3(), _u = V3(), _p = V3(), _q = new THREE.Quaternion();
  const MAXN = 150;

  function makeIR(sec) {
    const sr = ctx.sampleRate, len = Math.floor(sr * sec), b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (i < sr * .01 ? i / (sr * .01) : 1); }
      // Echo von der Baumgrenze / vom Dorf
      for (const [tm, a] of [[.14 + c * .02, .55], [.33 - c * .03, .4], [.58, .28], [.9, .16]]) {
        const s0 = Math.floor(tm * sr); for (let k = 0; k < 900 && s0 + k < len; k++) d[s0 + k] += (Math.random() * 2 - 1) * a * Math.exp(-k / 160);
      }
    }
    return b;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }); } catch (e) { return; }
    const sr = ctx.sampleRate;
    master = ctx.createGain(); master.gain.value = G.vol;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 14; comp.ratio.value = 7; comp.attack.value = .002; comp.release.value = .22;
    lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 20000; lp.Q.value = .4;
    dry = ctx.createGain();
    const conv = ctx.createConvolver(); conv.buffer = makeIR(2.6);
    wetIn = ctx.createGain(); const wg = ctx.createGain(); wg.gain.value = .55;
    dry.connect(lp); wetIn.connect(conv); conv.connect(wg); wg.connect(lp);
    lp.connect(comp); comp.connect(master); master.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, sr * 3, sr);
    { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    // Knistern: seltene, kurze Klicks
    crackleBuf = ctx.createBuffer(1, sr * 3, sr);
    { const d = crackleBuf.getChannelData(0); let i = 0;
      while (i < d.length) { i += Math.floor(rand(.002, .03) * sr); const a = rand(.3, 1), l = Math.floor(rand(.0008, .004) * sr);
        for (let k = 0; k < l && i + k < d.length; k++) d[i + k] = (Math.random() * 2 - 1) * a * (1 - k / l); } }
    S.ok = true;
    ambience();
  }

  const T = d => d / S.rate, F = f => f * S.rate;
  const now = () => ctx.currentTime;

  function setPos(p, v) {
    if (p.positionX) { p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z; } else p.setPosition(v.x, v.y, v.z);
  }

  /* Ausgangs-Knoten: räumlich + Entfernungs-Filter + Hall-Anteil */
  function out(pos, ref, wet) {
    const g = ctx.createGain();
    if (pos) {
      const d = camera.position.distanceTo(pos);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = clamp(18000 / (1 + d / 28), 700, 18000); f.Q.value = .3;
      const p = ctx.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = 1.12; p.maxDistance = 20000;
      setPos(p, pos);
      g.connect(f); f.connect(p); p.connect(dry);
      const w = ctx.createGain(); w.gain.value = wet * ref / (ref + d * 1.1) * (1 + Math.min(d / 120, 1.2)); g.connect(w); w.connect(wetIn);
    } else { g.connect(dry); const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(wetIn); }
    return g;
  }
  const delayFor = pos => pos ? clamp(camera.position.distanceTo(pos) / 343, 0, 2.5) / Math.max(.3, S.rate) : 0;

  function track(src) { S.active++; src.onended = () => { S.active--; }; }

  function nb(t0, dur, type, freq, q, vol, o, att = .001, f1) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = S.rate;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(F(freq), t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(F(f1), t0 + att + T(dur));
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + att); g.gain.exponentialRampToValueAtTime(.0001, t0 + att + T(dur));
    s.connect(f); f.connect(g); g.connect(o);
    s.start(t0, Math.random() * 2); s.stop(t0 + att + T(dur) + .05); track(s);
  }
  function tone(t0, f0, f1, dur, vol, o, type = 'sine', att = .002) {
    const s = ctx.createOscillator(); s.type = type; s.frequency.setValueAtTime(F(f0), t0); s.frequency.exponentialRampToValueAtTime(Math.max(10, F(f1)), t0 + T(dur));
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + att); g.gain.exponentialRampToValueAtTime(.0001, t0 + att + T(dur));
    s.connect(g); g.connect(o); s.start(t0); s.stop(t0 + att + T(dur) + .05); track(s);
  }
  function crackle(t0, dur, vol, o, hp = 2500) {
    const s = ctx.createBufferSource(); s.buffer = crackleBuf; s.loop = true; s.playbackRate.value = S.rate * rand(.9, 1.2);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = F(hp);
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + .02); g.gain.setValueAtTime(vol, t0 + T(dur) * .55); g.gain.exponentialRampToValueAtTime(.0001, t0 + T(dur));
    s.connect(f); f.connect(g); g.connect(o); s.start(t0, Math.random() * 2); s.stop(t0 + T(dur) + .05); track(s);
  }
  const ok = () => ctx && S.ok && S.active < MAXN && ctx.state !== 'closed';

  /* ---------- Sounds ---------- */
  const SFX = {
    bang(pos, power = 4, o = {}) {
      if (!ok()) return;
      const ref = 4 + power * .7, t0 = now() + delayFor(pos), out_ = out(pos, ref, .5);
      const v = clamp(.35 + power * .075, .3, 2.6);
      nb(t0, .05 + power * .002, 'highpass', 1700, .7, v, out_);
      nb(t0, .1 + power * .012, 'lowpass', 2200 + power * 20, .8, v * .9, out_);
      nb(t0, .3 + power * .02, 'lowpass', 300, .7, v * .85, out_);
      if (power > 2) tone(t0, 150, 38, .3 + power * .012, v * 1.05, out_);
      if (power > 12) { nb(t0 + .02, 1.1 + power * .02, 'lowpass', 140, .6, v * .6, out_); tone(t0, 70, 24, 1.2, v * .8, out_); }
      if (o.crackle) crackle(t0 + .05, .8, v * .35, out_);
    },
    burst(pos, size = 1, o = {}) {
      if (!ok()) return;
      const t0 = now() + delayFor(pos), out_ = out(pos, 14 + size * 10, .9);
      const v = clamp(.45 + size * .35, .4, 2.4);
      nb(t0, .04, 'highpass', 1500, .6, v * .8, out_);
      nb(t0, .5 + size * .25, 'lowpass', 420, .7, v, out_);
      tone(t0, 110, 30, .6 + size * .3, v * 1.1, out_);
      if (o.crackle !== false) { crackle(t0 + .12, 1.0 + size * .3, v * .45, out_, 2200); }
      if (o.sizzle) nb(t0 + .1, 2.4, 'bandpass', 5200, .6, v * .12, out_, .2, 2500);
    },
    thump(pos, big = 1) {   // Abschuss (Mörser / Batterie)
      if (!ok()) return;
      const t0 = now() + delayFor(pos) * .6, out_ = out(pos, 5 + big * 3, .35);
      nb(t0, .12 + big * .08, 'lowpass', 600, .8, .55 + big * .35, out_);
      tone(t0, 130, 42, .2 + big * .1, .7 + big * .35, out_);
    },
    pop(pos, v = .5) {
      if (!ok()) return; const t0 = now() + delayFor(pos), out_ = out(pos, 4, .3);
      nb(t0, .05, 'bandpass', 1200, 1, v, out_); tone(t0, 220, 70, .1, v * .8, out_);
    },
    whoosh(pos, dur = 1.1, vol = .5) {
      if (!ok()) return; const t0 = now() + delayFor(pos) * .3, out_ = out(pos, 5, .3);
      nb(t0, dur, 'bandpass', 500, .9, vol, out_, .12, 2600);
    },
    whistle(pos, dur = 1.6, vol = .35) {
      if (!ok()) return; const t0 = now() + delayFor(pos) * .4, out_ = out(pos, 6, .4);
      const s = ctx.createOscillator(); s.type = 'sine'; s.frequency.setValueAtTime(F(900), t0); s.frequency.exponentialRampToValueAtTime(F(2800), t0 + T(dur));
      const lfo = ctx.createOscillator(); lfo.frequency.value = F(14); const lg = ctx.createGain(); lg.gain.value = F(60); lfo.connect(lg); lg.connect(s.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + .15); g.gain.setValueAtTime(vol, t0 + T(dur) * .85); g.gain.exponentialRampToValueAtTime(.0001, t0 + T(dur));
      s.connect(g); g.connect(out_); s.start(t0); lfo.start(t0); s.stop(t0 + T(dur) + .05); lfo.stop(t0 + T(dur) + .05); track(s);
    },
    fuse(pos, dur = 1.5) {
      if (!ok()) return; const t0 = now(), out_ = out(pos, 1.6, .15);
      nb(t0, dur, 'highpass', 4200, .5, .13, out_, .05); crackle(t0, dur, .22, out_, 3000);
    },
    hiss(pos, dur = 4, vol = .4) {
      if (!ok()) return; const t0 = now(), out_ = out(pos, 3, .25);
      nb(t0, dur, 'bandpass', 3600, .5, vol, out_, .08); crackle(t0, dur, vol * .7, out_, 2000);
    },
    spin(pos, dur = 3.5, vol = .4) {
      if (!ok()) return; const t0 = now(), out_ = out(pos, 3, .25);
      nb(t0, dur, 'bandpass', 900, 1.2, vol, out_, .1, 2400); crackle(t0, dur, vol * .6, out_, 2500);
    },
    knock(pos, v = 4, metal = false) {
      if (!ok()) return; const t0 = now(), out_ = out(pos, 3, .2), a = clamp(v / 14, .08, .7);
      nb(t0, .09, 'bandpass', metal ? 1800 : 520 + Math.random() * 300, 2.2, a, out_);
      tone(t0, metal ? 700 : 190, metal ? 400 : 90, .08, a * .6, out_);
    },
    shatter(pos, size = 1) {
      if (!ok()) return; const t0 = now() + delayFor(pos), out_ = out(pos, 5, .3);
      nb(t0, .25 + size * .1, 'bandpass', 900, .6, .5 + size * .2, out_); crackle(t0, .5, .5, out_, 1200);
    },
    ring() {
      if (!ok()) return; const t0 = now();
      const s = ctx.createOscillator(); s.frequency.value = 7600; const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(.045, t0 + .15); g.gain.exponentialRampToValueAtTime(.0001, t0 + 5);
      s.connect(g); g.connect(master); s.start(t0); s.stop(t0 + 5.1);
      lp.frequency.cancelScheduledValues(t0); lp.frequency.setValueAtTime(650, t0); lp.frequency.exponentialRampToValueAtTime(20000, t0 + 4.2);
    },
    click() { if (!ok()) return; const t0 = now(); tone(t0, 900, 500, .04, .12, dry); },
    flick() { if (!ok()) return; const t0 = now(); nb(t0, .05, 'bandpass', 3200, 2, .25, dry); tone(t0 + .03, 1500, 800, .05, .08, dry); },
    step() { if (!ok()) return; const t0 = now(); nb(t0, .09, 'lowpass', 700 + Math.random() * 400, .8, .1 + Math.random() * .05, dry); },
    place() { if (!ok()) return; const t0 = now(); nb(t0, .07, 'lowpass', 500, 1, .35, dry); tone(t0, 160, 70, .08, .3, dry); },
    remove() { if (!ok()) return; const t0 = now(); nb(t0, .12, 'bandpass', 700, 1, .3, dry, .001, 200); }
  };

  function ambience() {
    // Nachtwind
    const w = ctx.createBufferSource(); w.buffer = noiseBuf; w.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 380; wf.Q.value = .5;
    const wg = ctx.createGain(); wg.gain.value = .03;
    const l = ctx.createOscillator(); l.frequency.value = .11; const lg = ctx.createGain(); lg.gain.value = .02; l.connect(lg); lg.connect(wg.gain);
    w.connect(wf); wf.connect(wg); wg.connect(master); w.start(); l.start();
    // Grillen
    const cr = (f, rate, gate, vol) => {
      const o = ctx.createOscillator(); o.frequency.value = f;
      const a = ctx.createGain(); a.gain.value = .5; const lf = ctx.createOscillator(); lf.type = 'square'; lf.frequency.value = rate;
      const lfg = ctx.createGain(); lfg.gain.value = .5; lf.connect(lfg); lfg.connect(a.gain);
      const b = ctx.createGain(); b.gain.value = .5; const gt = ctx.createOscillator(); gt.type = 'square'; gt.frequency.value = gate;
      const gtg = ctx.createGain(); gtg.gain.value = .5; gt.connect(gtg); gtg.connect(b.gain);
      const v = ctx.createGain(); v.gain.value = vol;
      o.connect(a); a.connect(b); b.connect(v); v.connect(master); o.start(); lf.start(); gt.start();
    };
    cr(4300, 33, 1.3, .006); cr(3950, 29, .9, .005); cr(4650, 37, .7, .004);
  }

  function listen() {
    if (!ctx) return;
    S.rate = clamp(G.timeScale, .3, 1);
    camera.getWorldPosition(_p); camera.getWorldQuaternion(_q);
    _f.set(0, 0, -1).applyQuaternion(_q); _u.set(0, 1, 0).applyQuaternion(_q);
    const L = ctx.listener;
    if (L.positionX) {
      L.positionX.value = _p.x; L.positionY.value = _p.y; L.positionZ.value = _p.z;
      L.forwardX.value = _f.x; L.forwardY.value = _f.y; L.forwardZ.value = _f.z; L.upX.value = _u.x; L.upY.value = _u.y; L.upZ.value = _u.z;
    } else { L.setPosition(_p.x, _p.y, _p.z); L.setOrientation(_f.x, _f.y, _f.z, _u.x, _u.y, _u.z); }
  }
  function setVolume(v) { G.vol = v; if (master) master.gain.setTargetAtTime(v, ctx.currentTime, .05); }

  return { init, listen, setVolume, SFX, get ctx() { return ctx; } };
})();
const SFX = AU.SFX;
