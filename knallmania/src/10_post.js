/* =====================================================================
   10_post: HDR-Pipeline  (Szene -> Bloom-Kette -> ACES + Vignette + Grain)
   ===================================================================== */
const Post = (() => {
  const ext = renderer.extensions;
  const hasFloat = renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
  const TYPE = hasFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const LEVELS = 6;

  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  postScene.add(quad);

  const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
  const mk = (fs, uniforms, blend) => new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false,
    blending: blend || THREE.NoBlending, transparent: false
  });

  const matPre = mk(`
    uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr; varying vec2 vUv;
    vec3 f(vec2 uv){ return min(texture2D(tSrc,uv).rgb, vec3(40.0)); }
    void main(){
      vec3 c=(f(vUv+uTexel*vec2(-1.,-1.))+f(vUv+uTexel*vec2(1.,-1.))+f(vUv+uTexel*vec2(-1.,1.))+f(vUv+uTexel*vec2(1.,1.)))*.25;
      float br=max(c.r,max(c.g,c.b)); float kn=uThr*.6+1e-4;
      float s=clamp(br-uThr+kn,0.,2.*kn); s=s*s/(4.*kn);
      float k=max(s,br-uThr)/max(br,1e-4);
      gl_FragColor=vec4(c*k,1.);
    }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThr: { value: .85 } });

  const matDown = mk(`
    uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
    void main(){
      vec3 c=texture2D(tSrc,vUv+uTexel*vec2(-1.,-1.)).rgb+texture2D(tSrc,vUv+uTexel*vec2(1.,-1.)).rgb
            +texture2D(tSrc,vUv+uTexel*vec2(-1.,1.)).rgb+texture2D(tSrc,vUv+uTexel*vec2(1.,1.)).rgb;
      gl_FragColor=vec4(c*.25,1.);
    }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });

  const matUp = mk(`
    uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uMix; varying vec2 vUv;
    void main(){
      vec3 c=texture2D(tSrc,vUv+uTexel*vec2(-1.,-1.)).rgb+texture2D(tSrc,vUv+uTexel*vec2(0.,-1.)).rgb*2.+texture2D(tSrc,vUv+uTexel*vec2(1.,-1.)).rgb
            +texture2D(tSrc,vUv+uTexel*vec2(-1.,0.)).rgb*2.+texture2D(tSrc,vUv).rgb*4.+texture2D(tSrc,vUv+uTexel*vec2(1.,0.)).rgb*2.
            +texture2D(tSrc,vUv+uTexel*vec2(-1.,1.)).rgb+texture2D(tSrc,vUv+uTexel*vec2(0.,1.)).rgb*2.+texture2D(tSrc,vUv+uTexel*vec2(1.,1.)).rgb;
      gl_FragColor=vec4(c/16.*uMix,1.);
    }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uMix: { value: 1 } }, THREE.AdditiveBlending);

  const matFinal = mk(`
    uniform sampler2D tScene, tBloom; uniform float uBloom, uExposure, uFlash, uVig, uAb, uTime, uRing, uBloomOn;
    uniform vec2 uRes; varying vec2 vUv;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 d=(vUv-.5);
      float ab=uAb*(.4+dot(d,d)*4.);
      vec3 col=vec3(texture2D(tScene,vUv+d*ab).r,texture2D(tScene,vUv).g,texture2D(tScene,vUv-d*ab).b);
      vec3 bl=texture2D(tBloom,vUv).rgb;
      col+=bl*uBloom*uBloomOn;
      col*=uExposure;
      col+=vec3(1.,.93,.8)*uFlash;
      { vec3 a1=aces(col); float mx=max(col.r,max(col.g,col.b))+1e-4; vec3 a2=col/mx*aces(vec3(mx)).r; col=mix(a1,a2,.5); }
      float l=dot(col,vec3(.299,.587,.114));
      col=mix(col,vec3(l),uRing*.55);
      float v=1.-dot(d,d)*uVig*(1.+uRing*2.);
      col*=clamp(v,0.,1.);
      col=pow(col,vec3(1./2.2));
      col+=(h(vUv*uRes+uTime)-.5)*(2.2/255.);
      gl_FragColor=vec4(col,1.);
    }`, {
    tScene: { value: null }, tBloom: { value: null }, uBloom: { value: .32 }, uExposure: { value: 1.05 }, uFlash: { value: 0 },
    uVig: { value: 1.15 }, uAb: { value: .0035 }, uTime: { value: 0 }, uRing: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uBloomOn: { value: 1 }
  });

  let rtScene = null, bl = [], W = 1, H = 1;

  function rt(w, h, ms, depth) {
    const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: TYPE, depthBuffer: !!depth, stencilBuffer: false };
    let t;
    if (ms > 0 && renderer.capabilities.isWebGL2) { t = new THREE.WebGLMultisampleRenderTarget(w, h, o); t.samples = ms; }
    else t = new THREE.WebGLRenderTarget(w, h, o);
    t.texture.generateMipmaps = false;
    return t;
  }
  function dispose() { if (rtScene) rtScene.dispose(); bl.forEach(t => t.dispose()); bl = []; }

  function resize(w, h) {
    W = Math.max(2, Math.floor(w * Q.pr)); H = Math.max(2, Math.floor(h * Q.pr));
    dispose();
    rtScene = rt(W, H, Q.msaa, true);
    let lw = W, lh = H;
    for (let i = 0; i < LEVELS; i++) { lw = Math.max(2, lw >> 1); lh = Math.max(2, lh >> 1); bl.push(rt(lw, lh, 0, false)); }
    matFinal.uniforms.uRes.value.set(W, H);
  }

  function pass(mat, target) {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(postScene, postCam);
  }

  function render(t) {
    // 1) Szene in HDR-Target
    renderer.setRenderTarget(rtScene);
    renderer.clear(true, true, true);
    renderer.render(scene, camera);

    // 2) Bloom
    const on = Q.bloom && G.bloom > 0.001;
    if (on) {
      matPre.uniforms.tSrc.value = rtScene.texture; matPre.uniforms.uTexel.value.set(1 / W, 1 / H);
      pass(matPre, bl[0]);
      for (let i = 1; i < LEVELS; i++) {
        matDown.uniforms.tSrc.value = bl[i - 1].texture;
        matDown.uniforms.uTexel.value.set(1 / bl[i - 1].width, 1 / bl[i - 1].height);
        pass(matDown, bl[i]);
      }
      for (let i = LEVELS - 1; i > 0; i--) {
        matUp.uniforms.tSrc.value = bl[i].texture;
        matUp.uniforms.uTexel.value.set(1 / bl[i].width, 1 / bl[i].height);
        matUp.uniforms.uMix.value = 1;
        pass(matUp, bl[i - 1]);
      }
    }
    // 3) Final auf den Bildschirm
    const u = matFinal.uniforms;
    u.tScene.value = rtScene.texture; u.tBloom.value = bl[0].texture;
    u.uBloom.value = .27 * G.bloom; u.uBloomOn.value = on ? 1 : 0;
    u.uFlash.value = G.flash; u.uTime.value = t % 100; u.uRing.value = G.ring;
    u.uAb.value = .0028 + G.trauma * .006 + G.flash * .004;
    pass(matFinal, null);
  }

  return { resize, render, hasFloat, get target() { return rtScene; } };
})();

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Q.pr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  Post.resize(w, h);
}
window.addEventListener('resize', onResize);
onResize();
