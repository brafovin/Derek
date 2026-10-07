/* =====================================================================
   40_particles: GPU-Funken (analytische Flugbahn im Vertex-Shader), Rauch,
                 dynamische Lichtblitze, Druckwellen, Brandflecken
   Alle Partikel-Positionen werden im Shader aus (Start, Geschwindigkeit, Luftwiderstand,
   Schwerkraft, Zeit) berechnet -> Zehntausende Funken kosten kaum CPU.
   ===================================================================== */
const ST = 17;
const MAXPS = (() => { try { const gl = renderer.getContext(); return gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64; } catch (e) { return 64; } })();

/* ----------------------------- Funken ----------------------------- */
const Sparks = (() => {
  const N = Q.pool, buf = new Float32Array(N * ST);
  for (let i = 0; i < N; i++) { buf[i * ST + 9] = -1e6; buf[i * ST + 10] = 1; }
  const ib = new THREE.InterleavedBuffer(buf, ST); ib.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  geo.setAttribute('aVel', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  geo.setAttribute('aCol', new THREE.InterleavedBufferAttribute(ib, 3, 6));
  geo.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 4, 9));
  geo.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 4, 13));
  geo.setDrawRange(0, N);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 700 }, uMax: { value: 150 }, uMin: { value: 3 } },
    vertexShader: `
      uniform float uTime, uScale, uMax, uMin;
      attribute vec3 aVel, aCol; attribute vec4 aA, aB;
      varying vec3 vCol;
      float hh(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){
        float age=uTime-aA.x, life=aA.y;
        if(age<0.||age>life){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vCol=vec3(0.); return; }
        float k=max(aA.w,1e-3), e=exp(-k*age);
        vec3 vt=vec3(0.,-aB.x/k,0.);
        vec3 p=position+vt*age+(aVel-vt)*((1.-e)/k);
        float u=age/life;
        float fade=smoothstep(0.,.035,u)*(1.-u*u*u);
        vec3 col=aCol;
        col=mix(col,vec3(1.,.34,.06)*max(col.r,max(col.g,col.b)),clamp(u*aB.z,0.,1.));
        float br=aB.w*fade;
        if(aB.y>0.){ float ph=fract(age*aB.y+hh(position+aVel)); br*=(ph<.5?1.:.1); }
        vec4 mv=modelViewMatrix*vec4(p,1.);
        float raw=aA.z*(1.-.55*u)*uScale/max(-mv.z,.1);
        float ps=clamp(raw,uMin,uMax);
        vCol=col*br*min(1.,.38+.62*raw/ps);
        gl_Position=projectionMatrix*mv; gl_PointSize=ps;
      }`,
    fragmentShader: `
      varying vec3 vCol;
      void main(){
        vec2 q=gl_PointCoord*2.-1.; float d2=dot(q,q); if(d2>1.) discard;
        float core=exp(-d2*13.), halo=exp(-d2*3.4)*.3*(1.-d2);
        float m=max(vCol.r,max(vCol.g,vCol.b));
        vec3 c=vCol*(core+halo)+vec3(core*core)*m*.55;
        gl_FragColor=vec4(c,1.);
      }`,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    depthWrite: false, depthTest: true, transparent: true
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5;
  scene.add(pts);

  let head = 0, dMin = 1e9, dMax = -1, count = 0;
  /* sp(): ein Funke.  pos, vel, rgb(linear/HDR), Größe(m), Lebensdauer(s), Drag, Gravitation, Flackern(Hz), Abkühlen(0..1), Helligkeit, Verzögerung */
  function sp(x, y, z, vx, vy, vz, r, g, b, size, life, drag, grav, flick, cool, inten, delay) {
    const i = head; head = (head + 1) % N; const o = i * ST;
    buf[o] = x; buf[o + 1] = y; buf[o + 2] = z; buf[o + 3] = vx; buf[o + 4] = vy; buf[o + 5] = vz;
    buf[o + 6] = r; buf[o + 7] = g; buf[o + 8] = b;
    buf[o + 9] = G.time + (delay || 0); buf[o + 10] = life; buf[o + 11] = size; buf[o + 12] = drag;
    buf[o + 13] = grav; buf[o + 14] = flick || 0; buf[o + 15] = cool || 0; buf[o + 16] = inten === undefined ? 1 : inten;
    if (i < dMin) dMin = i; if (i > dMax) dMax = i;
    if (head === 0) { dMin = 0; dMax = N - 1; }
    count++;
  }
  function flush(scale) {
    mat.uniforms.uTime.value = G.time; mat.uniforms.uScale.value = scale;
    mat.uniforms.uMin.value = 3.7 * renderer.domElement.height / 900; mat.uniforms.uMax.value = Math.min(150 * renderer.domElement.height / 900, MAXPS);
    if (dMax < 0) return;
    ib.updateRange.offset = dMin * ST; ib.updateRange.count = (dMax - dMin + 1) * ST; ib.needsUpdate = true;
    dMin = 1e9; dMax = -1;
  }
  function clear() { for (let i = 0; i < N; i++) { buf[i * ST + 9] = -1e6; } dMin = 0; dMax = N - 1; }
  function alive() { let n = 0; for (let i = 0; i < N; i++) { const a = G.time - buf[i * ST + 9]; if (a >= 0 && a <= buf[i * ST + 10]) n++; } return n; }
  return { sp, flush, clear, alive, mat, N, get spawned() { const c = count; count = 0; return c; } };
})();
const sp = Sparks.sp;

/* ----------------------------- Rauch ----------------------------- */
const Smoke = (() => {
  const N = Q.smoke, buf = new Float32Array(N * ST);
  for (let i = 0; i < N; i++) { buf[i * ST + 9] = -1e6; buf[i * ST + 10] = 1; }
  const ib = new THREE.InterleavedBuffer(buf, ST); ib.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  geo.setAttribute('aVel', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  geo.setAttribute('aCol', new THREE.InterleavedBufferAttribute(ib, 3, 6));
  geo.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 4, 9));
  geo.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 4, 13));
  geo.setDrawRange(0, N);
  const uL = [], uLC = [];
  for (let i = 0; i < 8; i++) { uL.push(new THREE.Vector4(0, -999, 0, 1)); uLC.push(new THREE.Vector3()); }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 700 }, uMaxS: { value: 300 }, uL: { value: uL }, uLC: { value: uLC }, uAmb: { value: new THREE.Vector3(.11, .13, .2) }, uWind: { value: new THREE.Vector3() } },
    vertexShader: `
      uniform float uTime, uScale, uMaxS; uniform vec4 uL[8]; uniform vec3 uLC[8]; uniform vec3 uAmb, uWind;
      attribute vec3 aVel, aCol; attribute vec4 aA, aB;
      varying vec3 vCol; varying float vA, vS;
      void main(){
        float age=uTime-aA.x, life=aA.y;
        if(age<0.||age>life){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vCol=vec3(0.); vA=0.; vS=0.; return; }
        float k=max(aB.x,1e-3), e=exp(-k*age);
        vec3 p=position+aVel*((1.-e)/k)+vec3(0.,1.,0.)*(aB.y/k)*(age-(1.-e)/k)+uWind*aB.w*age*smoothstep(0.,2.5,age);
        float u=age/life;
        float sz=aA.z+aA.w*(1.-exp(-age*.7))/.7;
        vA=aB.z*smoothstep(0.,.07,u)*pow(1.-u,1.5);
        vec3 lit=uAmb;
        for(int i=0;i<8;i++){ vec3 d=uL[i].xyz-p; lit+=uLC[i]/(1.+dot(d,d)*uL[i].w); }
        vCol=aCol*lit;
        vS=fract(sin(dot(position,vec3(12.9898,78.233,37.719)))*43758.5453);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_PointSize=clamp(sz*uScale/max(-mv.z,.1),1.,uMaxS);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying vec3 vCol; varying float vA, vS;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec2 q=gl_PointCoord*2.-1.; float d=length(q); if(d>1.) discard;
        float base=smoothstep(1.,.12,d);
        float nn=n(q*2.3+vS*17.)*.6+n(q*5.1+vS*9.)*.4;
        gl_FragColor=vec4(vCol,base*(.3+.7*nn)*vA);
      }`,
    transparent: true, depthWrite: false, depthTest: true
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4;
  scene.add(pts);

  let head = 0, dMin = 1e9, dMax = -1;
  /* smk(): Rauchpuff.  pos, vel, Tönung, Startgröße, Wachstum, Leben, Drag, Auftrieb, Deckkraft, Windfaktor */
  function smk(x, y, z, vx, vy, vz, r, g, b, size, grow, life, drag, buoy, alpha, wind) {
    const i = head; head = (head + 1) % N; const o = i * ST;
    buf[o] = x; buf[o + 1] = y; buf[o + 2] = z; buf[o + 3] = vx; buf[o + 4] = vy; buf[o + 5] = vz;
    buf[o + 6] = r; buf[o + 7] = g; buf[o + 8] = b;
    buf[o + 9] = G.time; buf[o + 10] = life; buf[o + 11] = size; buf[o + 12] = grow;
    buf[o + 13] = drag; buf[o + 14] = buoy; buf[o + 15] = alpha; buf[o + 16] = wind === undefined ? 1 : wind;
    if (i < dMin) dMin = i; if (i > dMax) dMax = i;
    if (head === 0) { dMin = 0; dMax = N - 1; }
  }
  function flush(scale) {
    mat.uniforms.uTime.value = G.time; mat.uniforms.uScale.value = scale; mat.uniforms.uMaxS.value = Math.min(380 * renderer.domElement.height / 900, MAXPS);
    mat.uniforms.uWind.value.set(G.wind.x * G.windK, 0, G.wind.z * G.windK);
    if (dMax < 0) return;
    ib.updateRange.offset = dMin * ST; ib.updateRange.count = (dMax - dMin + 1) * ST; ib.needsUpdate = true; dMin = 1e9; dMax = -1;
  }
  function clear() { for (let i = 0; i < N; i++) buf[i * ST + 9] = -1e6; dMin = 0; dMax = N - 1; }
  return { smk, flush, clear, mat, uL, uLC };
})();
const smk = Smoke.smk;

/* ----------------------------- Lichtblitze ----------------------------- */
const Lights = (() => {
  const slots = [];
  for (let i = 0; i < 8; i++) {
    const l = new THREE.PointLight(0xffffff, 0, 60, 2); scene.add(l);
    slots.push({ l, t0: -99, life: .1, i0: 0, key: null, sus: -99, r: 1, g: 1, b: 1, rad: 50, x: 0, y: 0, z: 0, cur: 0 });
  }
  function grab(key) {
    if (key) { const s = slots.find(s => s.key === key); if (s) return s; }
    let best = null, bv = 1e9;
    for (const s of slots) { const v = s.cur + (s.key ? 50 : 0); if (v < bv) { bv = v; best = s; } }
    return best;
  }
  /* add(): einmaliger Blitz (klingt exponentiell ab) */
  function add(pos, r, g, b, inten, rad, life) {
    const s = grab(null); if (!s) return;
    s.key = null; s.t0 = G.time; s.life = life; s.i0 = inten; s.r = r; s.g = g; s.b = b; s.rad = rad; s.x = pos.x; s.y = pos.y; s.z = pos.z; s.cur = inten;
  }
  /* sustain(): dauerhaftes Licht (Fontäne, Zündschnur …) – jeden Frame erneuern */
  function sustain(key, pos, r, g, b, inten, rad) {
    const s = grab(key); if (!s) return;
    s.key = key; s.sus = G.time; s.r = r; s.g = g; s.b = b; s.rad = rad; s.x = pos.x; s.y = pos.y; s.z = pos.z; s.cur = inten; s.t0 = -99; s.i0 = inten;
  }
  function update() {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]; let I = 0;
      if (s.key) { if (G.time - s.sus < .12) I = s.cur; else { s.key = null; s.cur = 0; } }
      else { const age = G.time - s.t0; if (age >= 0 && age < s.life) I = s.i0 * Math.exp(-3.4 * age / s.life) * (1 - smooth(.75, 1, age / s.life)); s.cur = I; }
      s.l.intensity = I; s.l.position.set(s.x, s.y, s.z); s.l.color.setRGB(s.r, s.g, s.b); s.l.distance = s.rad;
      Smoke.uL[i].set(s.x, s.y, s.z, 5 / (s.rad * s.rad)); Smoke.uLC[i].set(s.r * I, s.g * I, s.b * I);
    }
  }
  return { add, sustain, update };
})();

/* ----------------------------- Druckwellen ----------------------------- */
const Shock = (() => {
  const pool = [];
  const sphGeo = new THREE.SphereGeometry(1, 32, 20), ringGeo = new THREE.RingGeometry(.95, 1, 80); ringGeo.rotateX(-Math.PI / 2);
  const sphMat = () => new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uC: { value: new THREE.Vector3(1, .8, .5) } },
    vertexShader: 'varying vec3 vN, vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec3 vN, vV; void main(){ float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.4); gl_FragColor=vec4(uC*f*uA,1.); }',
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, transparent: true, depthWrite: false, side: THREE.DoubleSide
  });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(sphGeo, sphMat()); s.visible = false; s.frustumCulled = false; s.renderOrder = 6;
    const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffe0b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    r.visible = false; r.frustumCulled = false; r.renderOrder = 6;
    scene.add(s, r); pool.push({ s, r, t0: -9, dur: 1, rad: 1, on: false, ring: false, str: 1 });
  }
  let idx = 0;
  function add(pos, rad, str = 1, o = {}) {
    const p = pool[idx = (idx + 1) % pool.length];
    p.t0 = G.time; p.dur = o.dur || (.28 + rad * .018); p.rad = rad; p.on = true; p.str = str;
    p.s.position.copy(pos); p.r.position.set(pos.x, Math.max(.06, pos.y > 3 ? -99 : .06), pos.z);
    p.ring = pos.y < 3; p.s.visible = true; p.r.visible = p.ring;
    p.s.material.uniforms.uC.value.set(...(o.c || [1, .78, .5]));
  }
  function update() {
    for (const p of pool) {
      if (!p.on) continue;
      const u = (G.time - p.t0) / p.dur;
      if (u >= 1) { p.on = false; p.s.visible = false; p.r.visible = false; continue; }
      const e = 1 - Math.pow(1 - u, 2.5), r = Math.max(.3, p.rad * e);
      p.s.scale.setScalar(r); p.s.material.uniforms.uA.value = (1 - u) * (1 - u) * .42 * p.str;
      if (p.ring) { p.r.scale.setScalar(r * 1.05); p.r.material.opacity = (1 - u) * (1 - u) * .2 * Math.min(1, p.str); }
    }
  }
  return { add, update };
})();

/* ----------------------------- Brandflecken ----------------------------- */
const Scorch = (() => {
  const tex = canvasTexture(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(0,0,0,.92)'); gr.addColorStop(.45, 'rgba(8,6,4,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(0,0,0,${rand(.1, .5)})`; const a = rand(TAU), r = rand(10, 60); g.beginPath(); g.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, rand(1, 5), 0, TAU); g.fill(); }
  }, { linear: true });
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const pool = []; let idx = 0;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, color: 0x222222 });
  for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; m.renderOrder = 1; scene.add(m); pool.push(m); }
  function add(x, z, size) {
    const m = pool[idx = (idx + 1) % pool.length];
    m.position.set(x, .03 + (idx % 7) * .002, z); m.scale.setScalar(size); m.rotation.y = rand(TAU); m.visible = true;
  }
  function clear() { pool.forEach(m => m.visible = false); }
  return { add, clear };
})();

function fxUpdate() {
  const scale = renderer.domElement.height / (2 * Math.tan(camera.fov * DEG / 2));
  Lights.update(); Shock.update();
  Sparks.flush(scale); Smoke.flush(scale);
}
