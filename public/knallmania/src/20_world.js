/* =====================================================================
   20_world: Nachthimmel, Gelände, Bäume, Dorf, Zaun, Licht
   ===================================================================== */
const MOON_DIR = V3(-0.42, 0.52, -0.74).normalize();
const FIELD_R = 128;   // spielbarer Radius

const World = (() => {
  /* ---------- Himmel ---------- */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uMoon: { value: MOON_DIR.clone() } },
    vertexShader: `varying vec3 vDir; void main(){ vDir=position; vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uMoon; varying vec3 vDir;
      float hash3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){
        vec3 d=normalize(vDir); float h=d.y;
        vec3 zen=vec3(.0012,.003,.012), mid=vec3(.0065,.014,.036), hor=vec3(.03,.045,.078);
        vec3 col=mix(hor,mid,smoothstep(0.,.22,h));
        col=mix(col,zen,smoothstep(.18,.85,h));
        float gl=pow(max(dot(d,normalize(vec3(.55,0.,-.83))),0.),5.);
        col+=vec3(.13,.075,.038)*gl*exp(-max(h,0.)*6.5);
        col=mix(col,vec3(.008,.012,.02),smoothstep(0.,-.12,h));
        if(h>.02){
          vec3 p=d*240.; vec3 id=floor(p); vec3 f=fract(p)-.5;
          float r=hash3(id); float st=step(.984,r);
          float m=smoothstep(.26,.0,length(f))*st*(.35+.65*hash3(id+7.));
          m*=.7+.3*sin(uTime*(1.5+r*5.)+r*60.);
          col+=vec3(.75,.85,1.)*m*1.6*smoothstep(.02,.18,h);
        }
        float md=dot(d,uMoon);
        col+=vec3(1.,.96,.85)*smoothstep(.99962,.99984,md)*3.2;
        col+=vec3(.25,.35,.65)*pow(max(md,0.),500.)*.45+vec3(.08,.12,.24)*pow(max(md,0.),36.)*.3;
        gl_FragColor=vec4(col,1.);
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat);
  sky.frustumCulled = false; sky.renderOrder = -10;
  scene.add(sky);

  /* ---------- Gelände ---------- */
  function terrainH(x, z) {
    const r = Math.hypot(x, z);
    const far = smooth(165, 330, r);
    return far * (26 + 80 * fbm(x * .0055 + 3.1, z * .0055 - 1.7)) + smooth(110, 190, r) * fbm(x * .02, z * .02) * 5;
  }
  function dirtAmount(x, z) {
    const r = Math.hypot(x, z);
    return clamp(smooth(60, 18, r) * 1.3 + (fbm(x * .05, z * .05) - .5) * .9 * smooth(95, 20, r), 0, 1);
  }

  const grassTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#34501f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `hsla(${rand(70, 120)},${rand(25, 55)}%,${rand(12, 30)}%,.5)`; g.beginPath(); g.arc(rand(w), rand(h), rand(2, 7), 0, TAU); g.fill(); }
    for (let i = 0; i < 16000; i++) {
      g.strokeStyle = `hsl(${rand(75, 115)},${rand(30, 60)}%,${rand(14, 38)}%)`; g.lineWidth = rand(.6, 1.6);
      const x = rand(w), y = rand(h); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-2, 2), y - rand(2, 7)); g.stroke();
    }
  }, { repeat: [260, 260] });
  const dirtTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#7a6448'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) { g.fillStyle = `hsla(${rand(25, 40)},${rand(15, 35)}%,${rand(22, 50)}%,.45)`; g.beginPath(); g.arc(rand(w), rand(h), rand(1, 6), 0, TAU); g.fill(); }
    for (let i = 0; i < 9000; i++) { const v = rand(30, 78); g.fillStyle = `rgb(${v + 14},${v + 5},${v - 8})`; g.fillRect(rand(w), rand(h), rand(1, 3), rand(1, 3)); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(20,14,8,${rand(.1, .35)})`; g.beginPath(); g.arc(rand(w), rand(h), rand(.8, 3), 0, TAU); g.fill(); }
  }, { repeat: [1, 1] });
  dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping;

  const SEG = IS_MOBILE ? 200 : 300, SIZE = 1800;
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI / 2);
  {
    const p = tg.attributes.position, n = p.count, col = new Float32Array(n * 3), dirt = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), z = p.getZ(i); p.setY(i, terrainH(x, z));
      const v = .72 + .5 * fbm(x * .012, z * .012);
      const r = Math.hypot(x, z), hillDark = 1 - smooth(200, 500, r) * .35;
      col[i * 3] = v * hillDark; col[i * 3 + 1] = v * hillDark; col[i * 3 + 2] = v * hillDark * 1.04;
      dirt[i] = dirtAmount(x, z);
    }
    tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    tg.setAttribute('aDirt', new THREE.BufferAttribute(dirt, 1));
    tg.computeVertexNormals();
  }
  const groundMat = new THREE.MeshStandardMaterial({ map: grassTex, vertexColors: true, roughness: 1, metalness: 0 });
  groundMat.onBeforeCompile = sh => {
    sh.uniforms.tDirt = { value: dirtTex };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aDirt; varying float vDirt;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDirt=aDirt;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tDirt; varying float vDirt;')
      .replace('#include <map_fragment>', `
        vec4 gT=mapTexelToLinear(texture2D(map,vUv));
        vec4 dT=mapTexelToLinear(texture2D(tDirt,vUv*3.7));
        float dm=smoothstep(.38,.62,vDirt+(dT.r-.12)*.55-(gT.g-.12)*.3);
        diffuseColor*=mix(gT,dT*1.15,dm);`);
  };
  const ground = new THREE.Mesh(tg, groundMat);
  ground.receiveShadow = true; ground.name = 'ground';
  scene.add(ground);

  /* ---------- Bäume (Instanzen) ---------- */
  function buildTrees() {
    const parts = [];
    const trunk = new THREE.CylinderGeometry(.22, .34, 3, 7);
    parts.push({ geo: trunk, matrix: new THREE.Matrix4().makeTranslation(0, 1.5, 0), color: C(0x4a3320) });
    const cones = [[2.5, 3.6, 3.4], [2.05, 3.4, 5.4], [1.5, 3.2, 7.3], [.9, 2.6, 9]];
    for (const [r, hh, y] of cones) parts.push({ geo: new THREE.ConeGeometry(r, hh, 8), matrix: new THREE.Matrix4().makeTranslation(0, y, 0), color: C(0x1c3b24).multiplyScalar(rand(.9, 1.15)) });
    const geo = mergeGeos(parts);
    const N = IS_MOBILE ? 140 : 260;
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    const placed = [];
    let n = 0, tries = 0;
    while (n < N && tries++ < 4000) {
      const a = rand(TAU), r = rand(85, 300);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      // Dorfbereich freihalten
      if (Math.hypot(x - 105, z + 75) < 40 && r < 160) continue;
      if (placed.some(o => Math.hypot(o[0] - x, o[1] - z) < 5)) continue;
      placed.push([x, z]);
      const sc = rand(.8, 1.9) * (r > 160 ? 1.6 : 1);
      p.set(x, terrainH(x, z) - .2, z); s.set(sc, sc * rand(.9, 1.25), sc); q.setFromEuler(e.set(0, rand(TAU), 0));
      im.setMatrixAt(n++, m.compose(p, q, s));
    }
    im.count = n; im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    scene.add(im);
  }

  /* ---------- Dorf in der Ferne ---------- */
  function buildVillage() {
    const g = new THREE.Group();
    const wallCols = [0xd9cdb8, 0xc9b79c, 0xb9a58a, 0xe3ddd0, 0xa88a6a];
    const roofCols = [0x6a2a22, 0x4a3a34, 0x7a3a2a, 0x3a3a44];
    const winMat = M(0xffc062, { emissive: 0xffb050, ei: 1.9 });
    const winOff = M(0x1a2236, { emissive: 0x0a1020, ei: .5, rough: .3 });
    const spots = [[100, -60], [125, -85], [88, -100], [128, -48], [140, -115], [75, -80], [150, -75]];
    spots.forEach(([x, z], i) => {
      const w = rand(8, 13), d = rand(7, 10), hh = rand(5, 7.5), a = rand(-.5, .5) + Math.atan2(x, -z) * .0 + .8;
      const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = a;
      h.add(mesh(new THREE.BoxGeometry(w, hh, d), M(pick(wallCols), { rough: .95 }), 0, hh / 2, 0));
      const roof = new THREE.ConeGeometry(Math.hypot(w, d) * .62, hh * .55, 4); roof.rotateY(Math.PI / 4);
      const rm = mesh(roof, M(pick(roofCols), { rough: .9 }), 0, hh + hh * .27, 0);
      rm.scale.set(w / Math.hypot(w, d) * 1.42, 1, d / Math.hypot(w, d) * 1.42); h.add(rm);
      h.add(mesh(new THREE.BoxGeometry(.9, 2.2, .9), M(0x5a4a44), w * .25, hh + 1.2, d * .15));
      for (let side = 0; side < 2; side++) {
        const nx = Math.floor(w / 3), zside = side ? 1 : -1;
        for (let k = 0; k < nx; k++) for (let fl = 0; fl < 2; fl++) {
          const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.35), Math.random() < .55 ? winMat : winOff);
          wm.position.set(-w / 2 + (k + .5) * (w / nx), 1.8 + fl * 2.5, zside * (d / 2 + .02)); if (side) wm.rotation.y = Math.PI;
          h.add(wm);
        }
      }
      g.add(h);
    });
    scene.add(g);
  }

  /* ---------- Zaun um das Spielfeld ---------- */
  function buildFence() {
    const parts = [
      { geo: new THREE.BoxGeometry(.16, 1.5, .16), matrix: new THREE.Matrix4().makeTranslation(0, .75, 0), color: C(0x5b4430) },
      { geo: new THREE.BoxGeometry(5, .12, .06), matrix: new THREE.Matrix4().makeTranslation(2.5, 1.2, 0), color: C(0x6a5038) },
      { geo: new THREE.BoxGeometry(5, .12, .06), matrix: new THREE.Matrix4().makeTranslation(2.5, .65, 0), color: C(0x6a5038) }
    ];
    const geo = mergeGeos(parts);
    const N = 160, im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V3(1, 1, 1), p = V3(), e = new THREE.Euler();
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU, R = FIELD_R + 6;
      p.set(Math.cos(a) * R, 0, Math.sin(a) * R); q.setFromEuler(e.set(0, -a - Math.PI / 2 + Math.PI, 0));
      im.setMatrixAt(i, m.compose(p, q, s));
    }
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
  }

  /* ---------- Licht ---------- */
  const hemi = new THREE.HemisphereLight(C(0x5568a8), C(0x1c2414), .62);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(C(0x93aaff), .78);
  moon.castShadow = true;
  moon.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
  const sc = moon.shadow.camera; sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 5; sc.far = 260;
  moon.shadow.bias = -.0004; moon.shadow.normalBias = .06;
  scene.add(moon, moon.target);
  const torch = new THREE.SpotLight(C(0xfff0d0), 0, 55, .42, .55, 1.6);
  torch.position.set(.15, -.1, 0); torch.target.position.set(0, 0, -10);
  camera.add(torch, torch.target);

  buildTrees(); buildVillage(); buildFence();

  function setShadows(on, size) {
    renderer.shadowMap.enabled = on; moon.castShadow = on;
    if (moon.shadow.mapSize.x !== size) { moon.shadow.mapSize.set(size, size); if (moon.shadow.map) { moon.shadow.map.dispose(); moon.shadow.map = null; } }
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }

  function update(t, focus) {
    skyMat.uniforms.uTime.value = t;
    sky.position.copy(camera.position);
    // Mondlicht + Schattenkamera folgen dem Spieler (auf Texel-Raster gesnappt, damit nichts flimmert)
    const tx = Math.round(focus.x / 2) * 2, tz = Math.round(focus.z / 2) * 2;
    moon.target.position.set(tx, 0, tz);
    moon.position.set(tx + MOON_DIR.x * 120, MOON_DIR.y * 120, tz + MOON_DIR.z * 120);
    torch.intensity = G.torch ? 2.6 : 0;
  }
  return { update, terrainH, ground, setShadows, torch, moon };
})();
