// ─── GAME 3D — Three.js based 3D shooter ──────────────────────────────────────

const T3 = 2.5;       // world units per tile
const WALL_H = 3.5;   // warehouse wall height (taller)
const G3_MATCH = 30 * 60;
const G3_BOT_HP = 100;
const G3_BOT_COUNT = 7;

let g3Scene, g3Cam, g3Renderer, g3Clock;
let g3Player, g3Bots = [], g3Bullets = [], g3LootBoxes = [], g3Vehicles = [];
let g3Running = false, g3AnimId = null;
let g3Keys = {}, g3PointerLocked = false;
let g3CamYaw = 0, g3CamPitch = 0.18;
let g3PeekAmount = 0;          // -1 = full left, 0 = center, 1 = full right
let g3MatchTime = G3_MATCH;
let g3KillFeedItems = [];
let g3FloatingTexts = [];
let g3Particles = [];
let g3WeaponIndex = 0;
let g3Score = 0, g3Kills = 0;
let g3AmmoInMag, g3Reloading = false, g3ReloadTimer = 0;
let g3LastShot = 0;
let g3InvincibleTimer = 0;
let g3HUD;
let g3Flashlight, g3FlashlightTarget; // weapon flashlight
let g3InVehicle = null;               // reference to vehicle player is driving
let g3NearVehicle = null;             // vehicle within enter range

// ─── ABANDONED HOUSE MAP ──────────────────────────────────────────────────────
// 0=floor  1=solid wall  2=low furniture(cover)  3=debris  4=tall furniture
// 5=broken window frame (wall with hole - lets light pass, no collision above 0.8)
//
// Rooms:  A=Eingang  B=Wohnzimmer  C=Küche  D=Esszimmer  E=Flur
//         F=Schlafzimmer1  G=Schlafzimmer2  H=Badezimmer  I=Keller-Gang(dark)
//         J=Lagerraum(dark)  K=Garten(front)
//
//    col: 0         5         10        15        20
const HOUSE_MAP = [
//row 0 – outer north wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
//row 1 – garden/yard (K) - open outside
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
//row 2 – garden
  [1,0,3,0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,0,0,3,1],
//row 3 – front house wall: door gap at col 5, broken window at cols 10-11 & 15-16
  [1,1,1,1,1,0,1,1,1,1,5,5,1,1,1,5,5,1,1,1,1,1],
//row 4 – entrance hall (A) + living room left (B)
  [1,0,2,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,2,0,1],
//row 5 – A + B continue
  [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
//row 6 – interior wall: B|C split, gap doorways at col 6 and col 14
  [1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
//row 7 – kitchen (C) left, dining room (D) right
  [1,0,0,2,0,0,0,0,0,4,1,0,0,0,0,0,0,2,0,0,0,1],
//row 8 – C + D
  [1,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,0,1],
//row 9 – interior wall: hallway gap at col 5 and col 14
  [1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
//row 10 – hallway (E) – dark inner corridor
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
//row 11 – hallway continues, staircase area center
  [1,0,0,3,0,0,0,0,0,3,0,3,0,0,0,3,0,0,0,0,0,1],
//row 12 – interior wall: bedroom access gaps at col 3, col 10, col 17
  [1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1],
//row 13 – bedroom 1 (F) left, storage/dark room (J) center, bedroom 2 (G) right
  [1,0,0,0,0,2,0,1,0,0,0,0,0,1,0,0,0,0,0,2,0,1],
//row 14 – rooms continue, bathroom (H) gap in center
  [1,0,4,0,0,0,0,1,0,3,0,3,0,1,0,0,0,0,4,0,0,1],
//row 15 – F + J + G  (J is the dark storage room – no window)
  [1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
//row 16 – interior wall with bathroom door at col 10
  [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1],
//row 17 – bathroom (H) – inner, no windows, dark
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
//row 18 – bathroom / basement stair area
  [1,0,3,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,3,0,0,1],
//row 19 – south outer wall with small gaps (broken)
  [1,1,1,5,1,1,1,1,1,1,1,1,1,1,1,1,1,5,1,1,1,1],
];

// Which rooms are DARK (inner rooms needing flashlight)
// Approximate tile regions:  hallway row 10-11, dark storage col 8-12 row 13-15, bathroom row 17-18
function g3RoomIsDark(tx, tz) {
  if (tz >= 10 && tz <= 11) return true;                       // inner hallway
  if (tz >= 13 && tz <= 15 && tx >= 8 && tx <= 12) return true; // dark storage room
  if (tz >= 17 && tz <= 18) return true;                       // bathroom / back
  return false;
}

const G3_MAP = HOUSE_MAP;

const G3_SPAWN_TILES = [
  [3,1],[17,1],[2,4],[18,4],   // garden / entrance
  [3,7],[17,7],                 // kitchen / dining
  [3,13],[17,13],               // bedrooms
  [5,10],[15,10],               // hallway
  [10,17],                      // bathroom
];
function g3RandomSpawn() {
  // Pick a random open tile
  for (let attempts = 0; attempts < 30; attempts++) {
    const s = G3_SPAWN_TILES[Math.floor(Math.random() * G3_SPAWN_TILES.length)];
    if (g3TileAt(s[0], s[1]) === 0) {
      return new THREE.Vector3((s[0] + 0.5) * T3, 0.5, (s[1] + 0.5) * T3);
    }
  }
  return new THREE.Vector3(3 * T3, 0.5, 1 * T3);
}

// ─── MATERIAL CACHE ───────────────────────────────────────────────────────────
const g3Mats = {};
function g3Mat(hex, opts = {}) {
  const key = hex + JSON.stringify(opts);
  if (!g3Mats[key]) {
    g3Mats[key] = new THREE.MeshLambertMaterial({ color: hex, ...opts });
  }
  return g3Mats[key];
}

// ─── CHARACTER MESH ───────────────────────────────────────────────────────────
function buildCharMesh(skin, isPlayer) {
  const group = new THREE.Group();

  const face    = g3Mat(skin.face);
  const helmetM = g3Mat(skin.helmet);
  const shirtM  = g3Mat(skin.shirt);
  const vestM   = g3Mat(skin.vest);
  const pantsM  = g3Mat(skin.pants);
  const bootsM  = g3Mat(skin.boots);
  const accentM = g3Mat(skin.accent);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.3), shirtM);
  torso.position.set(0, 0.85, 0);
  group.add(torso);

  // Vest
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.32), vestM);
  vest.position.set(0, 0.85, 0.01);
  group.add(vest);

  // Belt accent
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.32), accentM);
  belt.position.set(0, 0.56, 0);
  group.add(belt);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), face);
  head.position.set(0, 1.37, 0);
  group.add(head);

  // Helmet
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.215, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetM);
  helmet.position.set(0, 1.42, 0);
  group.add(helmet);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.12, 6), face);
  neck.position.set(0, 1.17, 0);
  group.add(neck);

  // Left arm
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), shirtM);
  lArm.position.set(-0.37, 0.83, 0);
  group.add(lArm);

  // Right arm
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), shirtM);
  rArm.position.set(0.37, 0.83, 0);
  group.add(rArm);

  // Weapon stub attached to right arm
  const gunBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.55), g3Mat('#555'));
  gunBar.position.set(0.37, 0.78, -0.35);
  group.add(gunBar);

  // Left leg
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), pantsM);
  lLeg.position.set(-0.14, 0.27, 0);
  group.add(lLeg);

  // Right leg
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), pantsM);
  rLeg.position.set(0.14, 0.27, 0);
  group.add(rLeg);

  // Left boot
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.28), bootsM);
  lBoot.position.set(-0.14, 0.04, 0.03);
  group.add(lBoot);

  // Right boot
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.28), bootsM);
  rBoot.position.set(0.14, 0.04, 0.03);
  group.add(rBoot);

  // Name label (sprite) — skip for player self
  group.userData.lLeg = lLeg;
  group.userData.rLeg = rLeg;
  group.userData.walkPhase = 0;

  return group;
}

// ─── BULLET ──────────────────────────────────────────────────────────────────
class G3Bullet {
  constructor(pos, dir, weapon, ownerId) {
    this.pos = pos.clone();
    this.dir = dir.clone().normalize();
    this.speed = (weapon.bulletSpeed || 600) / 60;
    this.damage = weapon.damage;
    this.range = (weapon.range || 500) / 60 * this.speed;
    this.traveledDist = 0;
    this.ownerId = ownerId;
    this.dead = false;
    this.isExplosive = weapon.isExplosive || false;

    const geo = new THREE.SphereGeometry(0.06, 4, 4);
    const col = weapon.bulletColor || '#FFE566';
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col }));
    this.mesh.position.copy(this.pos);
    g3Scene.add(this.mesh);
  }

  update(dt) {
    const step = this.speed * dt * 60;
    this.pos.addScaledVector(this.dir, step);
    this.traveledDist += step;
    this.mesh.position.copy(this.pos);

    if (this.traveledDist > this.range) this.dead = true;

    // Wall collision
    const tx = Math.floor(this.pos.x / T3);
    const tz = Math.floor(this.pos.z / T3);
    if (g3TileAt(tx, tz) !== 0) this.dead = true;
  }

  remove() {
    g3Scene.remove(this.mesh);
    this.mesh.geometry.dispose();
  }
}

// ─── LOOT BOX 3D ─────────────────────────────────────────────────────────────
class G3LootBox {
  constructor(pos, killedName) {
    this.pos = pos.clone();
    this.killedName = killedName;
    this.life = 30;
    this.dead = false;
    this.bobPhase = Math.random() * Math.PI * 2;

    const geo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    const mat = new THREE.MeshLambertMaterial({ color: '#8B6914' });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.pos);
    this.mesh.position.y = 0.25;
    g3Scene.add(this.mesh);

    // Golden glow ring
    const ringGeo = new THREE.TorusGeometry(0.35, 0.04, 6, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#FFD700' });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.copy(this.pos);
    this.ring.position.y = 0.05;
    g3Scene.add(this.ring);
  }

  update(dt) {
    this.life -= dt;
    this.bobPhase += dt * 2.5;
    if (this.life <= 0) { this.dead = true; return; }
    this.mesh.position.y = 0.25 + Math.sin(this.bobPhase) * 0.06;
    this.mesh.rotation.y += dt * 1.2;
    this.ring.rotation.z += dt * 2;
  }

  isNear(pos) {
    return this.pos.distanceTo(pos) < 1.8;
  }

  remove() {
    g3Scene.remove(this.mesh);
    g3Scene.remove(this.ring);
    this.mesh.geometry.dispose();
    this.ring.geometry.dispose();
  }
}

// ─── BLOOD PARTICLE ───────────────────────────────────────────────────────────
class G3BloodParticle {
  constructor(pos) {
    const count = 8 + Math.floor(Math.random() * 8);
    this.dead = false;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.06, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: '#CC0000' });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );
      g3Scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.4 + Math.random() * 0.4 });
    }
  }
  update(dt) {
    let allDead = true;
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life > 0) {
        allDead = false;
        p.vel.y -= 12 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        if (p.mesh.position.y < 0.05) p.mesh.position.y = 0.05;
        p.mesh.material.opacity = Math.max(0, p.life / 0.8);
      } else {
        p.mesh.visible = false;
      }
    }
    if (allDead) this.dead = true;
  }
  remove() {
    for (const p of this.particles) {
      g3Scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
  }
}

// ─── VEHICLE 3D ───────────────────────────────────────────────────────────────
class G3Vehicle {
  constructor(pos, preset) {
    this.pos     = pos.clone();
    this.yaw     = Math.random() * Math.PI * 2;
    this.speed   = 0;
    this.steer   = 0;
    this.preset  = preset;
    this.occupied = false;
    this.dead    = false;
    this.enterPrompt = false;

    this._buildMesh();
  }

  _buildMesh() {
    const g = new THREE.Group();
    const bodyCol  = new THREE.MeshLambertMaterial({ color: this.preset.color });
    const bodyCol2 = new THREE.MeshLambertMaterial({ color: this.preset.color2 });
    const blackM   = new THREE.MeshLambertMaterial({ color: '#111' });
    const glassM   = new THREE.MeshLambertMaterial({ color: '#223344', transparent: true, opacity: 0.55 });
    const tyreMat  = new THREE.MeshLambertMaterial({ color: '#1a1a1a' });
    const rimMat   = new THREE.MeshLambertMaterial({ color: '#888' });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.0), bodyCol);
    body.position.y = 0.55;
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 2.1), bodyCol2);
    cabin.position.set(0, 1.05, -0.1);
    cabin.castShadow = true;
    g.add(cabin);

    // Windshield
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.06), glassM);
    wind.position.set(0, 1.1, 1.0);
    g.add(wind);
    const rearWind = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.06), glassM);
    rearWind.position.set(0, 1.05, -1.15);
    g.add(rearWind);

    // Side windows
    [-0.83, 0.83].forEach(sx => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 1.3), glassM);
      sw.position.set(sx, 1.1, -0.1);
      g.add(sw);
    });

    // Bumpers
    const frontBump = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.12), blackM);
    frontBump.position.set(0, 0.35, 2.06);
    g.add(frontBump);
    const rearBump = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.12), blackM);
    rearBump.position.set(0, 0.35, -2.06);
    g.add(rearBump);

    // Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: '#ffffcc' });
    [[0.65, 1.95], [-0.65, 1.95]].forEach(([hx, hz]) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.06), headlightMat);
      hl.position.set(hx, 0.62, hz);
      g.add(hl);
    });

    // Taillights
    const taillightMat = new THREE.MeshBasicMaterial({ color: '#cc1111' });
    [[0.65, -1.95], [-0.65, -1.95]].forEach(([tx, tz]) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.06), taillightMat);
      tl.position.set(tx, 0.62, tz);
      g.add(tl);
    });

    // 4 wheels
    const wheelPos = [[0.95, -0.05, 1.3], [-0.95, -0.05, 1.3], [0.95, -0.05, -1.3], [-0.95, -0.05, -1.3]];
    wheelPos.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 12), tyreMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      g.add(wheel);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.24, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      g.add(rim);
    });

    this.mesh = g;
    this.mesh.position.copy(this.pos);
    this.mesh.position.y = 0;
    this.mesh.rotation.y = this.yaw;
    g3Scene.add(this.mesh);
  }

  isNear(pos) {
    return this.pos.distanceTo(pos) < 3.5;
  }

  enter() {
    this.occupied = true;
    g3Player.mesh.visible = false; // hide character while driving
  }

  exit() {
    this.occupied = false;
    g3Player.mesh.visible = true;
    // Eject player to side of car
    const side = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    g3Player.pos.copy(this.pos).addScaledVector(side, 2.5);
    g3Player.vel.set(0, 0, 0);
  }

  update(dt) {
    if (!this.occupied) return;

    const throttle = (g3Keys['KeyW'] || g3Keys['ArrowUp'])   ? 1
                   : (g3Keys['KeyS'] || g3Keys['ArrowDown'])  ? -0.5 : 0;
    const steerIn  = (g3Keys['KeyA'] || g3Keys['ArrowLeft'])  ? 1
                   : (g3Keys['KeyD'] || g3Keys['ArrowRight']) ? -1 : 0;

    this.speed += throttle * 14 * dt;
    this.speed *= 0.92; // friction
    this.speed = Math.max(-6, Math.min(16, this.speed));

    if (Math.abs(this.speed) > 0.1) {
      this.yaw += steerIn * 1.8 * dt * Math.sign(this.speed);
    }

    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const nx = this.pos.x + fwd.x * this.speed * dt;
    const nz = this.pos.z + fwd.z * this.speed * dt;

    if (g3TileAt(Math.floor(nx / T3), Math.floor(this.pos.z / T3)) === 0) this.pos.x = nx;
    else this.speed *= -0.4;
    if (g3TileAt(Math.floor(this.pos.x / T3), Math.floor(nz / T3)) === 0) this.pos.z = nz;
    else this.speed *= -0.4;

    this.mesh.position.set(this.pos.x, 0, this.pos.z);
    this.mesh.rotation.y = this.yaw;

    // Sync camera player pos to vehicle
    g3Player.pos.set(this.pos.x, this.pos.y, this.pos.z);
    g3CamYaw = this.yaw + Math.PI; // camera behind car
  }

  remove() {
    g3Scene.remove(this.mesh);
  }
}

// ─── BOT AI ──────────────────────────────────────────────────────────────────
class G3Bot {
  constructor(name, skinIndex) {
    this.name = name;
    this.hp = G3_BOT_HP;
    this.id = Math.random();
    this.dead = false;
    this.respawnTimer = 0;
    this.weaponIndex = 0;
    this.kills = 0;
    this.score = 0;

    this.skin = CHARACTER_SKINS[skinIndex % CHARACTER_SKINS.length];
    this.mesh = buildCharMesh(this.skin, false);
    const spawn = g3RandomSpawn();
    this.mesh.position.copy(spawn);
    g3Scene.add(this.mesh);

    this.pos = spawn.clone();
    this.vel = new THREE.Vector3();
    this.dir = new THREE.Vector3(0, 0, -1);
    this.state = 'patrol';
    this.stateTimer = 2 + Math.random() * 3;
    this.patrolTarget = this._randomPatrolPoint();
    this.lastShot = 0;
    this.shootCooldown = 1100 + Math.random() * 900; // medium: 1.1–2s between shots
    this.reactionTimer = 0.9 + Math.random() * 1.2;  // medium reaction delay

    // Name label sprite
    this._makeLabel();
  }

  _makeLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 40;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(0, 0, 256, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#FF6400';
    ctx.font = 'bold 22px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 128, 28);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.label = new THREE.Sprite(mat);
    this.label.scale.set(1.4, 0.28, 1);
    this.label.position.set(0, 2.1, 0);
    this.mesh.add(this.label);
  }

  _randomPatrolPoint() {
    for (let i = 0; i < 20; i++) {
      const tx = 1 + Math.floor(Math.random() * (G3_MAP[0].length - 2));
      const tz = 1 + Math.floor(Math.random() * (G3_MAP.length - 2));
      if (G3_MAP[tz][tx] === 0) {
        return new THREE.Vector3((tx + 0.5) * T3, 0.5, (tz + 0.5) * T3);
      }
    }
    return this.pos.clone();
  }

  takeDamage(dmg, shooterId) {
    if (this.dead) return;
    this.hp -= dmg;
    // Blood
    g3Particles.push(new G3BloodParticle(this.pos.clone().add(new THREE.Vector3(0, 0.9, 0))));
    if (this.hp <= 0) this._die(shooterId);
  }

  _die(killerId) {
    this.dead = true;
    this.hp = 0;
    // Drop loot box
    g3LootBoxes.push(new G3LootBox(this.pos.clone(), this.name));
    // Kill feed
    if (killerId === 'player') {
      g3Kills++;
      g3Score += 100;
      g3WeaponIndex = Math.min(g3WeaponIndex + 1, WEAPONS.length - 1);
      g3AmmoInMag = WEAPONS[g3WeaponIndex].mag;
      g3AddFloat(`+100 XP  •  ${WEAPONS[g3WeaponIndex].name}!`, '#FFD700', this.pos);
      g3KillFeed(`DU  →  ${this.name}`);
    } else {
      g3KillFeed(`${this.name} eliminated`);
    }
    this.mesh.visible = false;
    this.respawnTimer = 5 + Math.random() * 3;
  }

  respawn() {
    this.dead = false;
    this.hp = G3_BOT_HP;
    const spawn = g3RandomSpawn();
    this.pos.copy(spawn);
    this.mesh.position.copy(spawn);
    this.mesh.visible = true;
    this.state = 'patrol';
    this.stateTimer = 2 + Math.random() * 3;
    this.patrolTarget = this._randomPatrolPoint();
  }

  update(dt, now) {
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }

    // Animate legs
    const speed = this.vel.length();
    if (speed > 0.01) {
      this.mesh.userData.walkPhase += dt * speed * 8;
      const swing = Math.sin(this.mesh.userData.walkPhase) * 0.25;
      if (this.mesh.userData.lLeg) this.mesh.userData.lLeg.rotation.x = swing;
      if (this.mesh.userData.rLeg) this.mesh.userData.rLeg.rotation.x = -swing;
    }

    const playerDist = this.pos.distanceTo(g3Player.pos);

    this.stateTimer -= dt;
    this.reactionTimer -= dt;

    if (playerDist < 18 && this.reactionTimer <= 0) { // shorter detection range
      this.state = 'chase';
      this.stateTimer = 3 + Math.random() * 2;
    }

    if (this.state === 'patrol') {
      const d = this.patrolTarget.distanceTo(this.pos);
      if (d < 1 || this.stateTimer <= 0) {
        this.patrolTarget = this._randomPatrolPoint();
        this.stateTimer = 2 + Math.random() * 3;
      }
      const toward = this.patrolTarget.clone().sub(this.pos).normalize();
      this.vel.lerp(new THREE.Vector3(toward.x * 2.5, 0, toward.z * 2.5), dt * 4);
      if (toward.length() > 0.01) this.dir.copy(toward);
    }

    if (this.state === 'chase') {
      const toward = g3Player.pos.clone().sub(this.pos).normalize();
      this.vel.lerp(new THREE.Vector3(toward.x * 4, 0, toward.z * 4), dt * 4);
      this.dir.copy(toward);

      if (playerDist > 22) { this.state = 'patrol'; this.reactionTimer = 0.9; }

      // Shoot at player — bots use weak weapons (max pistol/smg tier)
      const botWeapon = WEAPONS[Math.min(this.weaponIndex, 2)]; // cap at UMP-9
      if (now - this.lastShot > this.shootCooldown && playerDist < 16) {
        this.lastShot = now;
        const weapon = botWeapon;
        const shootDir = toward.clone();
        // Medium accuracy: noticeable spread
        shootDir.x += (Math.random() - 0.5) * 0.32;
        shootDir.z += (Math.random() - 0.5) * 0.32;
        shootDir.normalize();
        const bPos = this.pos.clone().add(new THREE.Vector3(0, 0.85, 0));
        g3Bullets.push(new G3Bullet(bPos, shootDir, weapon, this.id));
      }
    }

    // Move with collision
    const nx = this.pos.x + this.vel.x * dt;
    const nz = this.pos.z + this.vel.z * dt;
    const r = 0.3;
    if (g3TileAt(Math.floor(nx / T3), Math.floor(this.pos.z / T3)) === 0) this.pos.x = nx;
    if (g3TileAt(Math.floor(this.pos.x / T3), Math.floor(nz / T3)) === 0) this.pos.z = nz;
    this.vel.multiplyScalar(0.85);

    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    if (this.dir.length() > 0.01) {
      this.mesh.rotation.y = Math.atan2(this.dir.x, this.dir.z);
    }
  }
}

// ─── MAP HELPERS ─────────────────────────────────────────────────────────────
function g3TileAt(tx, tz) {
  if (tx < 0 || tz < 0 || tx >= G3_MAP[0].length || tz >= G3_MAP.length) return 1;
  return G3_MAP[tz][tx];
}

function g3BuildMap() {
  // ── Abandoned house materials ──────────────────────────────────────────────
  // Old wooden floors, cracked plaster walls, rotten furniture, moss/damp stains
  const floorMat    = new THREE.MeshLambertMaterial({ color: '#5c4a2a' }); // worn wood
  const outerWall   = new THREE.MeshLambertMaterial({ color: '#7a7060' }); // crumbling plaster
  const innerWall   = new THREE.MeshLambertMaterial({ color: '#6a6054' }); // yellowed wallpaper
  const ceilingMat  = new THREE.MeshLambertMaterial({ color: '#4a4438' }); // grimy ceiling
  const gardenFloor = new THREE.MeshLambertMaterial({ color: '#3a4830' }); // overgrown yard
  const debrisMat   = new THREE.MeshLambertMaterial({ color: '#5a4830' }); // rubble/debris
  const furnMat     = new THREE.MeshLambertMaterial({ color: '#4a3020' }); // rotten furniture
  const furnDarkMat = new THREE.MeshLambertMaterial({ color: '#2e2018' }); // darker furniture
  const windowFrameM= new THREE.MeshLambertMaterial({ color: '#5a5040' }); // broken window frame
  const moldMat     = new THREE.MeshLambertMaterial({ color: '#3a4030' }); // mold/moss on walls

  const mapW = G3_MAP[0].length, mapH = G3_MAP.length;
  const totalW = mapW * T3, totalH = mapH * T3;

  // Overgrown ground (garden rows 0-3)
  const gardenGeo = new THREE.PlaneGeometry(totalW, 4 * T3);
  const garden = new THREE.Mesh(gardenGeo, gardenFloor);
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(totalW / 2, 0, 2 * T3);
  garden.receiveShadow = true;
  g3Scene.add(garden);

  // Interior floor (rest of house)
  const intFloor = new THREE.Mesh(new THREE.PlaneGeometry(totalW, (mapH - 4) * T3), floorMat);
  intFloor.rotation.x = -Math.PI / 2;
  intFloor.position.set(totalW / 2, 0, (4 + (mapH - 4) / 2) * T3);
  intFloor.receiveShadow = true;
  g3Scene.add(intFloor);

  // Ceiling (only over house interior rows 3-19)
  const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(totalW, (mapH - 3) * T3), ceilingMat);
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.set(totalW / 2, WALL_H, (3 + (mapH - 3) / 2) * T3);
  g3Scene.add(ceilMesh);

  for (let tz = 0; tz < mapH; tz++) {
    for (let tx = 0; tx < mapW; tx++) {
      const t = G3_MAP[tz][tx];
      const wx = tx * T3 + T3 / 2;
      const wz = tz * T3 + T3 / 2;

      if (t === 1) {
        // Crumbling plaster wall — slightly irregular height
        const h = WALL_H * (0.88 + Math.random() * 0.16);
        const mat = tz <= 3 ? outerWall : (tz <= 9 ? innerWall : innerWall);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(T3, h, T3), mat);
        wall.position.set(wx, h / 2, wz);
        wall.castShadow = true; wall.receiveShadow = true;
        g3Scene.add(wall);
        // Mold/damage patch on some walls
        if (Math.random() < 0.35) {
          const patch = new THREE.Mesh(new THREE.BoxGeometry(T3 * 0.6, T3 * 0.4, 0.05), moldMat);
          patch.position.set(wx + (Math.random()-0.5)*T3*0.3, 0.6 + Math.random()*0.8, wz + T3/2 + 0.01);
          g3Scene.add(patch);
        }

      } else if (t === 5) {
        // Broken window frame — low wall stub + frame, no full block (lets light/bullets through)
        const stub = new THREE.Mesh(new THREE.BoxGeometry(T3, 0.8, T3), outerWall);
        stub.position.set(wx, 0.4, wz);
        stub.castShadow = true; stub.receiveShadow = true;
        g3Scene.add(stub);
        // Window frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(T3, 0.12, T3), windowFrameM);
        frame.position.set(wx, 1.5, wz);
        g3Scene.add(frame);
        const top = new THREE.Mesh(new THREE.BoxGeometry(T3, 0.12, T3), windowFrameM);
        top.position.set(wx, WALL_H - 0.3, wz);
        g3Scene.add(top);
        // Broken glass shards on floor
        for (let s = 0; s < 4; s++) {
          const shard = new THREE.Mesh(new THREE.BoxGeometry(0.1 + Math.random()*0.2, 0.02, 0.08+Math.random()*0.15), windowFrameM);
          shard.position.set(wx + (Math.random()-0.5)*T3*0.8, 0.01, wz + (Math.random()-0.5)*T3*0.6);
          shard.rotation.y = Math.random() * Math.PI;
          g3Scene.add(shard);
        }

      } else if (t === 2) {
        // Rotten furniture (low cover: overturned table, fallen bookcase)
        const furn = new THREE.Mesh(new THREE.BoxGeometry(T3*0.88, 0.65, T3*0.55), furnMat);
        furn.position.set(wx, 0.325, wz);
        furn.rotation.y = Math.random() * Math.PI * 0.3;
        furn.castShadow = true; furn.receiveShadow = true;
        g3Scene.add(furn);
        // Table legs broken/visible
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), furnDarkMat);
        leg.position.set(wx + 0.3, 0.175, wz + 0.2);
        g3Scene.add(leg);

      } else if (t === 3) {
        // Debris pile: rubble, fallen plaster, bricks
        const heights = [0.22, 0.18, 0.28, 0.16];
        for (let d = 0; d < 4; d++) {
          const chunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.3 + Math.random()*0.4, heights[d], 0.3 + Math.random()*0.4),
            debrisMat
          );
          chunk.position.set(
            wx + (Math.random()-0.5)*T3*0.7,
            heights[d]/2,
            wz + (Math.random()-0.5)*T3*0.7
          );
          chunk.rotation.y = Math.random() * Math.PI;
          chunk.receiveShadow = true;
          g3Scene.add(chunk);
        }

      } else if (t === 4) {
        // Tall rotten wardrobe / cabinet (full cover)
        const cab = new THREE.Mesh(new THREE.BoxGeometry(T3*0.72, WALL_H*0.75, T3*0.4), furnMat);
        cab.position.set(wx, WALL_H*0.375, wz);
        cab.castShadow = true; cab.receiveShadow = true;
        g3Scene.add(cab);
        // Door hanging off hinge
        const door = new THREE.Mesh(new THREE.BoxGeometry(T3*0.34, WALL_H*0.65, 0.05), furnDarkMat);
        door.position.set(wx + T3*0.22, WALL_H*0.325, wz + T3*0.25);
        door.rotation.y = 0.4;
        g3Scene.add(door);
      }
    }
  }

  // ── Room-specific lights ───────────────────────────────────────────────────
  // Bright: rooms near windows (living room, kitchen, garden-facing)
  // Dark:   inner hallway, storage room, bathroom

  // Garden — daylight
  const sunBeam1 = new THREE.PointLight(0xffeedd, 1.2, 14);
  sunBeam1.position.set(5 * T3, 2.5, 1.5 * T3);
  g3Scene.add(sunBeam1);
  const sunBeam2 = new THREE.PointLight(0xffeedd, 1.2, 14);
  sunBeam2.position.set(15 * T3, 2.5, 1.5 * T3);
  g3Scene.add(sunBeam2);

  // Living room (B) — bright, windows facing north
  const livingLight = new THREE.PointLight(0xffe4b0, 1.4, 16);
  livingLight.position.set(5 * T3, 2.2, 5 * T3);
  g3Scene.add(livingLight);

  // Kitchen (C) — moderate
  const kitchenLight = new THREE.PointLight(0xffd090, 0.9, 14);
  kitchenLight.position.set(4 * T3, 2.2, 7.5 * T3);
  g3Scene.add(kitchenLight);

  // Dining room (D)
  const diningLight = new THREE.PointLight(0xffcc80, 0.9, 14);
  diningLight.position.set(17 * T3, 2.2, 7.5 * T3);
  g3Scene.add(diningLight);

  // Hallway (E) — dim yellow, like one broken bulb
  const hallLight = new THREE.PointLight(0xaa8830, 0.35, 12);
  hallLight.position.set(10 * T3, 2.8, 10.5 * T3);
  g3Scene.add(hallLight);

  // Bedroom 1 (F) — moderate, side window light
  const bed1Light = new THREE.PointLight(0xffd0a0, 1.0, 14);
  bed1Light.position.set(3 * T3, 2.2, 14 * T3);
  g3Scene.add(bed1Light);

  // Bedroom 2 (G) — moderate
  const bed2Light = new THREE.PointLight(0xffd0a0, 1.0, 14);
  bed2Light.position.set(18 * T3, 2.2, 14 * T3);
  g3Scene.add(bed2Light);

  // Dark storage room (J) — almost nothing (emergency: very faint greenish)
  const storageLight = new THREE.PointLight(0x203018, 0.18, 8);
  storageLight.position.set(10 * T3, 2.0, 14 * T3);
  g3Scene.add(storageLight);

  // Bathroom (H) — single dim bare bulb (flickery orange)
  const bathLight = new THREE.PointLight(0xff8820, 0.28, 10);
  bathLight.position.set(10 * T3, 2.4, 17.5 * T3);
  g3Scene.add(bathLight);

  // Cracked ceiling details — random bits of plaster hanging
  const plasterMat = new THREE.MeshLambertMaterial({ color: '#555048' });
  for (let i = 0; i < 18; i++) {
    const tx2 = 2 + Math.random() * (mapW - 4);
    const tz2 = 4 + Math.random() * (mapH - 6);
    if (g3TileAt(Math.floor(tx2), Math.floor(tz2)) !== 0) continue;
    const chunk = new THREE.Mesh(
      new THREE.BoxGeometry(0.3 + Math.random()*0.5, 0.08, 0.2 + Math.random()*0.4),
      plasterMat
    );
    chunk.position.set(tx2 * T3, WALL_H - 0.04, tz2 * T3);
    chunk.rotation.y = Math.random() * Math.PI;
    g3Scene.add(chunk);
  }
}

// ─── PLAYER ──────────────────────────────────────────────────────────────────
function g3BuildPlayer() {
  const skin = CHARACTER_SKINS[playerSkins.character];
  const mesh = buildCharMesh(skin, true);
  g3Scene.add(mesh);

  const spawn = g3RandomSpawn();
  return {
    mesh,
    pos: spawn.clone(),
    vel: new THREE.Vector3(),
    hp: 100,
    id: 'player',
  };
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function g3BuildHUD() {
  const hud = document.createElement('div');
  hud.id = 'g3hud';
  hud.style.cssText = `
    position:fixed;inset:0;pointer-events:none;z-index:50;
    font-family:'Rajdhani',sans-serif;user-select:none;
  `;
  hud.innerHTML = `
    <div id="g3-crosshair" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:22px;height:22px;pointer-events:none;">
      <svg viewBox="0 0 22 22" width="22" height="22">
        <line x1="11" y1="2" x2="11" y2="8" stroke="#FFF" stroke-width="1.5" opacity="0.8"/>
        <line x1="11" y1="14" x2="11" y2="20" stroke="#FFF" stroke-width="1.5" opacity="0.8"/>
        <line x1="2" y1="11" x2="8" y2="11" stroke="#FFF" stroke-width="1.5" opacity="0.8"/>
        <line x1="14" y1="11" x2="20" y2="11" stroke="#FFF" stroke-width="1.5" opacity="0.8"/>
        <circle cx="11" cy="11" r="1.5" fill="#FF6400"/>
      </svg>
    </div>
    <div id="g3-hp" style="position:absolute;bottom:60px;left:30px;color:#4FC3F7;font-size:22px;font-weight:700;">
      ❤ <span id="g3-hp-val">100</span>
    </div>
    <div id="g3-ammo" style="position:absolute;bottom:60px;right:30px;text-align:right;font-size:22px;font-weight:700;color:#FFD700;">
      <span id="g3-ammo-val">30</span><span style="color:#666;font-size:16px"> / ∞</span>
    </div>
    <div id="g3-weapon" style="position:absolute;bottom:90px;right:30px;text-align:right;font-size:16px;color:#FF6400;letter-spacing:2px;">
      <span id="g3-weapon-name">Glock 17</span>
    </div>
    <div id="g3-timer" style="position:absolute;top:20px;left:50%;transform:translateX(-50%);
      font-size:28px;font-weight:700;color:#FFF;text-shadow:0 0 10px #000;">
      <span id="g3-timer-val">30:00</span>
    </div>
    <div id="g3-score" style="position:absolute;top:20px;right:30px;font-size:20px;font-weight:700;color:#FFD700;">
      <span id="g3-score-val">0</span> pts
    </div>
    <div id="g3-kills" style="position:absolute;top:50px;right:30px;font-size:16px;color:#4FC3F7;">
      <span id="g3-kills-val">0</span> kills
    </div>
    <div id="g3-wlevel" style="position:absolute;top:55px;left:50%;transform:translateX(-50%);
      font-size:13px;color:#FF6400;letter-spacing:1px;">
      LEVEL <span id="g3-wlevel-val">1</span> / ${WEAPONS.length}
    </div>
    <div id="g3-killfeed" style="position:absolute;top:100px;right:20px;
      display:flex;flex-direction:column;gap:4px;align-items:flex-end;"></div>
    <div id="g3-floats" style="position:absolute;inset:0;overflow:hidden;pointer-events:none;"></div>
    <div id="g3-reload" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,60px);
      background:rgba(0,0,0,0.7);padding:8px 20px;border-radius:6px;color:#FFD700;font-size:16px;letter-spacing:2px;">
      NACHLADEN...
    </div>
    <div id="g3-lock-hint" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      text-align:center;color:#FFF;font-size:28px;font-weight:700;text-shadow:0 2px 8px #000;">
      Klicken zum Spielen<br><span style="font-size:14px;color:#aaa;">ESC = Maus freigeben</span>
    </div>
    <div id="g3-hp-bar" style="position:absolute;bottom:45px;left:30px;width:200px;height:8px;
      background:rgba(255,255,255,0.12);border-radius:4px;">
      <div id="g3-hp-bar-fill" style="height:100%;border-radius:4px;background:linear-gradient(90deg,#F44336,#FF6400);width:100%;transition:width 0.2s;"></div>
    </div>
    <div id="g3-dmg-overlay" style="position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(ellipse at center,transparent 40%,rgba(200,0,0,0) 100%);opacity:0;transition:opacity 0.3s;"></div>
    <!-- Soft vignette for depth -->
    <div style="position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(ellipse 80% 75% at 50% 50%,transparent 45%,rgba(0,0,0,0.38) 100%);"></div>
    <!-- Vehicle enter prompt -->
    <div id="g3-vehicle-prompt" style="display:none;position:absolute;bottom:140px;left:50%;
      transform:translateX(-50%);background:rgba(0,0,0,0.72);border:1px solid rgba(255,200,0,0.5);
      border-radius:8px;padding:10px 22px;font-size:16px;font-weight:700;color:#FFD700;
      letter-spacing:2px;text-align:center;">
      <span style="font-size:20px;">🚗</span>  [F]  EINSTEIGEN
    </div>
    <!-- Vehicle exit prompt (when driving) -->
    <div id="g3-vehicle-exit" style="display:none;position:absolute;top:50%;left:50%;
      transform:translate(-50%,80px);background:rgba(0,0,0,0.65);border:1px solid rgba(255,200,0,0.4);
      border-radius:8px;padding:8px 20px;font-size:14px;color:#FFD700;letter-spacing:2px;">
      [F]  AUSSTEIGEN
    </div>
    <!-- Peek hint -->
    <div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);
      font-size:11px;color:rgba(200,220,255,0.35);letter-spacing:1px;">
      Q / E  PEEKEN  &nbsp;|&nbsp;  F  EINSTEIGEN / LOOTEN  &nbsp;|&nbsp;  SHIFT  SPRINT
    </div>
  `;
  document.body.appendChild(hud);
  return hud;
}

function g3UpdateHUD() {
  document.getElementById('g3-hp-val').textContent = Math.max(0, Math.ceil(g3Player.hp));
  document.getElementById('g3-hp-bar-fill').style.width = Math.max(0, g3Player.hp) + '%';
  document.getElementById('g3-ammo-val').textContent = g3Reloading ? '...' : (g3InVehicle ? '—' : g3AmmoInMag);
  document.getElementById('g3-weapon-name').textContent = g3InVehicle ? ('🚗 ' + g3InVehicle.preset.name) : WEAPONS[g3WeaponIndex].name;
  document.getElementById('g3-score-val').textContent = g3Score;
  document.getElementById('g3-kills-val').textContent = g3Kills;
  document.getElementById('g3-wlevel-val').textContent = g3WeaponIndex + 1;
  document.getElementById('g3-reload').style.display = g3Reloading ? 'block' : 'none';
  document.getElementById('g3-lock-hint').style.display = g3PointerLocked ? 'none' : 'block';

  // Vehicle prompts
  const vPrompt = document.getElementById('g3-vehicle-prompt');
  const vExit   = document.getElementById('g3-vehicle-exit');
  if (vPrompt) vPrompt.style.display = (!g3InVehicle && g3NearVehicle) ? 'block' : 'none';
  if (vExit)   vExit.style.display   = g3InVehicle ? 'block' : 'none';

  const mins = Math.floor(g3MatchTime / 60);
  const secs = Math.floor(g3MatchTime % 60);
  document.getElementById('g3-timer-val').textContent =
    String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function g3KillFeed(text) {
  const kf = document.getElementById('g3-killfeed');
  if (!kf) return;
  const el = document.createElement('div');
  el.style.cssText = `background:rgba(0,0,0,0.75);border-left:3px solid #FF6400;
    padding:4px 10px;font-size:13px;color:#EEE;border-radius:3px;animation:slideIn 0.3s ease;`;
  el.textContent = text;
  kf.insertBefore(el, kf.firstChild);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
  g3KillFeedItems.push(el);
}

function g3AddFloat(text, color, worldPos) {
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;font-size:18px;font-weight:700;color:${color};
    text-shadow:0 0 8px ${color};pointer-events:none;white-space:nowrap;`;
  el.textContent = text;
  const container = document.getElementById('g3-floats');
  if (container) container.appendChild(el);

  // Project world pos to screen
  const screenPos = worldPos.clone().project(g3Cam);
  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  let life = 1.5;
  let vy = -40;
  const tick = () => {
    life -= 1 / 60;
    vy -= 0.5;
    const curY = parseFloat(el.style.top) + vy * (1 / 60);
    el.style.top = curY + 'px';
    el.style.opacity = Math.max(0, life / 1.5);
    if (life > 0) requestAnimationFrame(tick);
    else if (el.parentNode) el.parentNode.removeChild(el);
  };
  requestAnimationFrame(tick);
}

function g3FlashDamage() {
  const overlay = document.getElementById('g3-dmg-overlay');
  if (!overlay) return;
  overlay.style.background = 'radial-gradient(ellipse at center,transparent 40%,rgba(200,0,0,0.45) 100%)';
  overlay.style.opacity = '1';
  setTimeout(() => { overlay.style.opacity = '0'; }, 300);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initGame3D() {
  const canvas = document.getElementById('gameCanvas');
  // Ensure canvas has correct pixel dimensions before Three.js reads them
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width  = W;
  canvas.height = H;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  // Reset all mutable globals from previous sessions
  g3Bots = []; g3Bullets = []; g3LootBoxes = []; g3Vehicles = [];
  g3InVehicle = null; g3NearVehicle = null;
  g3PeekAmount = 0; g3CamYaw = 0; g3CamPitch = 0.18;
  g3WeaponIndex = 0; g3Score = 0; g3Kills = 0;
  g3Reloading = false; g3InvincibleTimer = 0;
  g3KillFeedItems = []; g3FloatingTexts = []; g3Particles = [];
  Object.keys(g3Mats).forEach(k => delete g3Mats[k]); // clear material cache

  g3Scene = new THREE.Scene();
  g3Scene.fog = new THREE.Fog(0x8090a8, 35, 70);
  g3Scene.background = new THREE.Color(0x8090a8); // overcast sky grey

  g3Cam = new THREE.PerspectiveCamera(75, W / H, 0.05, 120);

  g3Renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  g3Renderer.setSize(W, H, false); // false = don't update canvas style (we did it above)
  g3Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  g3Renderer.shadowMap.enabled = true;
  g3Renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ── ABANDONED HOUSE LIGHTING ──
  // Overcast daylight filtering in through broken windows — low ambient
  const ambient = new THREE.AmbientLight(0x9aacb8, 0.55);
  g3Scene.add(ambient);

  // Weak overcast sun from outside (comes through windows at low angle)
  const mainLight = new THREE.DirectionalLight(0xd0d8c0, 0.9);
  mainLight.position.set(6, 18, -4); // from outside/above
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(2048, 2048);
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far  = 80;
  mainLight.shadow.camera.left = -30;
  mainLight.shadow.camera.right = 30;
  mainLight.shadow.camera.top  = 30;
  mainLight.shadow.camera.bottom = -30;
  mainLight.shadow.bias = -0.001;
  g3Scene.add(mainLight);

  // Cool sky fill from above (blue overcast)
  const fillLight = new THREE.DirectionalLight(0x8090c0, 0.35);
  fillLight.position.set(-8, 10, 12);
  g3Scene.add(fillLight);

  // ── WEAPON FLASHLIGHT (additional tactical light, visible in shadowed areas) ──
  g3Flashlight = new THREE.SpotLight(0xe8f0ff, 2.8); // brighter for dark rooms
  g3Flashlight.angle = Math.PI / 10;
  g3Flashlight.penumbra = 0.35;
  g3Flashlight.decay = 1.4;
  g3Flashlight.distance = 26;
  g3Flashlight.castShadow = false; // shadow already from main light
  g3FlashlightTarget = new THREE.Object3D();
  g3Scene.add(g3FlashlightTarget);
  g3Flashlight.target = g3FlashlightTarget;
  g3Scene.add(g3Flashlight);

  g3Clock = new THREE.Clock();
  g3BuildMap();
  g3Player = g3BuildPlayer();

  // Vehicles
  g3Vehicles = [];
  const vehicleSpawns = [
    { tx:4,  tz:1, preset: VEHICLE_PRESETS[0] }, // garden front
    { tx:14, tz:2, preset: VEHICLE_PRESETS[3] }, // garden right
  ];
  vehicleSpawns.forEach(vs => {
    if (g3TileAt(vs.tx, vs.tz) === 0) {
      g3Vehicles.push(new G3Vehicle(
        new THREE.Vector3((vs.tx + 0.5) * T3, 0, (vs.tz + 0.5) * T3),
        vs.preset
      ));
    }
  });

  g3InVehicle  = null;
  g3NearVehicle = null;

  // Bots
  g3Bots = [];
  for (let i = 0; i < G3_BOT_COUNT; i++) {
    g3Bots.push(new G3Bot(BOT_NAMES[i % BOT_NAMES.length], i));
  }

  g3WeaponIndex = 0;
  g3AmmoInMag = WEAPONS[0].mag;
  g3MatchTime = G3_MATCH;
  g3Score = 0; g3Kills = 0;
  g3Running = true;

  g3HUD = g3BuildHUD();

  g3SetupInput(canvas);
  g3Loop();
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
function g3SetupInput(canvas) {
  document.addEventListener('keydown', e => {
    g3Keys[e.code] = true;
    if (e.code === 'KeyR' && !g3Reloading) g3StartReload();
    if (e.code === 'KeyF') g3TryInteract(); // loot OR vehicle enter/exit
  });
  document.addEventListener('keyup', e => { g3Keys[e.code] = false; });

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    g3PointerLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener('mousemove', e => {
    if (!g3PointerLocked) return;
    g3CamYaw   -= e.movementX * 0.002;
    g3CamPitch -= e.movementY * 0.002;
    g3CamPitch = Math.max(-0.15, Math.min(0.6, g3CamPitch));
  });

  document.addEventListener('mousedown', e => {
    if (e.button === 0 && g3PointerLocked) g3TryShoot();
  });

  window.addEventListener('resize', () => {
    g3Cam.aspect = window.innerWidth / window.innerHeight;
    g3Cam.updateProjectionMatrix();
    g3Renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ─── SHOOT ────────────────────────────────────────────────────────────────────
function g3TryShoot() {
  const now = performance.now();
  const weapon = WEAPONS[g3WeaponIndex];
  if (g3Reloading) return;
  if (now - g3LastShot < weapon.fireRate) return;
  if (g3AmmoInMag <= 0) { g3StartReload(); return; }

  g3LastShot = now;
  g3AmmoInMag--;

  // Shoot direction = camera forward projected to XZ
  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyEuler(new THREE.Euler(-g3CamPitch, g3CamYaw, 0, 'YXZ'));
  dir.normalize();

  // Spread
  const spread = weapon.spread || 0;
  dir.x += (Math.random() - 0.5) * spread;
  dir.z += (Math.random() - 0.5) * spread;
  dir.normalize();

  for (let p = 0; p < (weapon.pellets || 1); p++) {
    const spreadDir = dir.clone();
    if (weapon.pellets > 1) {
      spreadDir.x += (Math.random() - 0.5) * weapon.spread;
      spreadDir.z += (Math.random() - 0.5) * weapon.spread;
      spreadDir.normalize();
    }
    const bPos = g3Player.pos.clone().add(new THREE.Vector3(0, 0.85, 0));
    g3Bullets.push(new G3Bullet(bPos, spreadDir, weapon, 'player'));
  }

  if (g3AmmoInMag <= 0) g3StartReload();
}

function g3StartReload() {
  if (g3Reloading) return;
  g3Reloading = true;
  g3ReloadTimer = WEAPONS[g3WeaponIndex].reloadTime / 1000;
}

function g3TryInteract() {
  // Exit vehicle first priority
  if (g3InVehicle) {
    g3InVehicle.exit();
    g3InVehicle = null;
    return;
  }
  // Enter nearby vehicle
  if (g3NearVehicle) {
    g3InVehicle = g3NearVehicle;
    g3InVehicle.enter();
    return;
  }
  // Loot lootbox
  for (const lb of g3LootBoxes) {
    if (!lb.dead && lb.isNear(g3Player.pos)) {
      lb.dead = true;
      g3Player.hp = Math.min(100, g3Player.hp + 50);
      g3Score += 10;
      g3KillFeed('Lootbox: +50 HP gelooted!');
      break;
    }
  }
}

// ─── GAME LOOP ────────────────────────────────────────────────────────────────
function g3Loop() {
  if (!g3Running) return;
  g3AnimId = requestAnimationFrame(g3Loop);

  const dt = Math.min(g3Clock.getDelta(), 0.033); // cap at ~30fps minimum
  const now = performance.now();

  // Timer
  g3MatchTime -= dt;
  if (g3MatchTime <= 0) { g3EndMatch(); return; }

  // Reload
  if (g3Reloading) {
    g3ReloadTimer -= dt;
    if (g3ReloadTimer <= 0) {
      g3Reloading = false;
      g3AmmoInMag = WEAPONS[g3WeaponIndex].mag;
    }
  }

  // Auto-fire on hold
  if (g3Keys['Mouse0'] || g3Keys['MouseLeft']) g3TryShoot();

  // Invincibility
  g3InvincibleTimer = Math.max(0, g3InvincibleTimer - dt);

  // ── PEEK (Q = left, E = right) ──
  const peekTarget = g3Keys['KeyQ'] ? -1 : g3Keys['KeyE'] ? 1 : 0;
  g3PeekAmount += (peekTarget - g3PeekAmount) * Math.min(1, dt * 10);

  // ── VEHICLE UPDATE ──
  if (g3InVehicle) {
    g3InVehicle.update(dt);
  } else {
    // Player on foot
    const speed = g3Keys['ShiftLeft'] ? 7 : 4.5;
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(g3CamYaw), 0, Math.cos(g3CamYaw));
    const right   = new THREE.Vector3(Math.cos(g3CamYaw), 0, -Math.sin(g3CamYaw));

    if (g3Keys['KeyW'] || g3Keys['ArrowUp'])    moveDir.addScaledVector(forward, -1);
    if (g3Keys['KeyS'] || g3Keys['ArrowDown'])  moveDir.addScaledVector(forward,  1);
    if (g3Keys['KeyA'] || g3Keys['ArrowLeft'])  moveDir.addScaledVector(right, -1);
    if (g3Keys['KeyD'] || g3Keys['ArrowRight']) moveDir.addScaledVector(right,  1);
    if (moveDir.length() > 0) moveDir.normalize();

    g3Player.vel.lerp(new THREE.Vector3(moveDir.x * speed, 0, moveDir.z * speed), dt * 12);
    g3Player.vel.multiplyScalar(0.8);

    const nx = g3Player.pos.x + g3Player.vel.x * dt;
    const nz = g3Player.pos.z + g3Player.vel.z * dt;
    if (g3TileAt(Math.floor(nx / T3), Math.floor(g3Player.pos.z / T3)) === 0) g3Player.pos.x = nx;
    if (g3TileAt(Math.floor(g3Player.pos.x / T3), Math.floor(nz / T3)) === 0) g3Player.pos.z = nz;

    // Animate legs
    const pSpeed = g3Player.vel.length();
    g3Player.mesh.userData.walkPhase = (g3Player.mesh.userData.walkPhase || 0) + dt * pSpeed * 8;
    const pSwing = Math.sin(g3Player.mesh.userData.walkPhase) * 0.25;
    if (g3Player.mesh.userData.lLeg) g3Player.mesh.userData.lLeg.rotation.x = pSwing;
    if (g3Player.mesh.userData.rLeg) g3Player.mesh.userData.rLeg.rotation.x = -pSwing;
    g3Player.mesh.position.set(g3Player.pos.x, 0, g3Player.pos.z);
    g3Player.mesh.rotation.y = g3CamYaw;

    // Detect nearby vehicle
    g3NearVehicle = null;
    for (const v of g3Vehicles) {
      if (!v.occupied && v.isNear(g3Player.pos)) { g3NearVehicle = v; break; }
    }
  }

  // ── CAMERA — third-person shoulder with peek offset ──
  const camDist   = g3InVehicle ? 8 : 5;
  const camHeight = g3InVehicle ? 5  : 3.8;
  const camOffX   = Math.sin(g3CamYaw) * camDist;
  const camOffZ   = Math.cos(g3CamYaw) * camDist;

  // Shoulder offset (right side) + peek lateral shift
  const peekShift  = g3PeekAmount * 1.8;
  const shoulderR  = 0.55; // lean to right shoulder by default
  const lateralX   =  Math.cos(g3CamYaw) * (shoulderR + peekShift);
  const lateralZ   = -Math.sin(g3CamYaw) * (shoulderR + peekShift);

  g3Cam.position.set(
    g3Player.pos.x + camOffX + lateralX,
    camHeight + Math.sin(g3CamPitch) * camDist * 0.4,
    g3Player.pos.z + camOffZ + lateralZ
  );

  // Look at player chest (offset slightly toward peek direction)
  g3Cam.lookAt(
    g3Player.pos.x + lateralX * 0.25,
    1.0,
    g3Player.pos.z + lateralZ * 0.25
  );

  // Slight camera roll when peeking — applied AFTER lookAt via local rotate
  if (Math.abs(g3PeekAmount) > 0.01) {
    g3Cam.rotateZ(g3PeekAmount * -0.07);
  }

  // ── Flashlight follows aim ──
  const aimDir = new THREE.Vector3(0, 0, -1)
    .applyEuler(new THREE.Euler(-g3CamPitch * 0.5, g3CamYaw, 0, 'YXZ'))
    .normalize();
  const gunPos = new THREE.Vector3(
    g3Player.pos.x - Math.sin(g3CamYaw) * 0.3,
    1.0,
    g3Player.pos.z - Math.cos(g3CamYaw) * 0.3
  );
  g3Flashlight.position.copy(gunPos);
  g3FlashlightTarget.position.copy(gunPos).addScaledVector(aimDir, 20);

  // Update vehicle prompts and meshes
  for (const v of g3Vehicles) {
    if (!v.occupied) v.update(dt); // idle (no-op for unoccupied)
  }

  // Bots
  for (const bot of g3Bots) bot.update(dt, now);

  // Bullets
  for (const b of g3Bullets) {
    b.update(dt);
    if (!b.dead) {
      // Check player hit
      if (b.ownerId !== 'player' && g3InvincibleTimer <= 0) {
        if (b.pos.distanceTo(g3Player.pos.clone().add(new THREE.Vector3(0, 0.85, 0))) < 0.45) {
          b.dead = true;
          g3Player.hp -= b.damage;
          g3InvincibleTimer = 0.25;
          g3FlashDamage();
          g3Particles.push(new G3BloodParticle(g3Player.pos.clone().add(new THREE.Vector3(0, 0.9, 0))));
          if (g3Player.hp <= 0) {
            g3Player.hp = 100;
            g3InvincibleTimer = 3;
            g3WeaponIndex = Math.max(0, g3WeaponIndex - 1);
            g3AmmoInMag = WEAPONS[g3WeaponIndex].mag;
            const spawn = g3RandomSpawn();
            g3Player.pos.copy(spawn);
            g3Score = Math.max(0, g3Score - 30);
          }
        }
      }
      // Check bot hits
      if (b.ownerId === 'player') {
        for (const bot of g3Bots) {
          if (!bot.dead && b.pos.distanceTo(bot.pos.clone().add(new THREE.Vector3(0, 0.85, 0))) < 0.5) {
            b.dead = true;
            bot.takeDamage(b.damage, 'player');
          }
        }
      }
    }
  }
  g3Bullets = g3Bullets.filter(b => { if (b.dead) { b.remove(); return false; } return true; });

  // Loot boxes
  for (const lb of g3LootBoxes) lb.update(dt);
  g3LootBoxes = g3LootBoxes.filter(lb => { if (lb.dead) { lb.remove(); return false; } return true; });

  // Particles
  for (const p of g3Particles) p.update(dt);
  g3Particles = g3Particles.filter(p => { if (p.dead) { p.remove(); return false; } return true; });

  g3UpdateHUD();
  g3Renderer.render(g3Scene, g3Cam);
}

// ─── END MATCH ────────────────────────────────────────────────────────────────
function g3EndMatch() {
  g3Running = false;
  if (g3AnimId) cancelAnimationFrame(g3AnimId);
  document.exitPointerLock();
  g3Cleanup();

  const entries = [{ name: 'YOU', score: g3Score, kills: g3Kills }];
  for (const bot of g3Bots) entries.push({ name: bot.name, score: bot.score, kills: bot.kills });
  entries.sort((a, b) => b.score - a.score);
  window.gameShowResults(entries);
}

// ─── CLEANUP ─────────────────────────────────────────────────────────────────
function g3Cleanup() {
  for (const b of g3Bullets)  b.remove();
  for (const lb of g3LootBoxes) lb.remove();
  for (const p of g3Particles)  p.remove();
  for (const v of g3Vehicles)   v.remove();
  g3Bullets = []; g3LootBoxes = []; g3Particles = []; g3Vehicles = [];
  g3InVehicle = null; g3NearVehicle = null;
  const hud = document.getElementById('g3hud');
  if (hud) hud.parentNode.removeChild(hud);
  // Clear scene
  if (g3Scene) {
    while (g3Scene.children.length > 0) {
      const obj = g3Scene.children[0];
      g3Scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }
}
