// ─── GAME ENGINE ──────────────────────────────────────────────────────────────

const TILE   = 40;
const MATCH_DURATION = 30 * 60;
const BOT_COUNT = 7;
const BOT_MAX_HP = 100; // Gegner haben 100 HP

// ─── LOOT BOX ─────────────────────────────────────────────────────────────────
class LootBox {
  constructor(x, y, killedName) {
    this.x = x; this.y = y;
    this.killedName = killedName;
    this.life = 30; // disappears after 30 seconds
    this.open  = false;
    this.scale = 0; // spawn animation
    this.glow  = 1.0;
    this.pulse = Math.random() * Math.PI * 2;
    this.angle = (Math.random() - 0.5) * 0.3;
    this.loot  = this._generateLoot();
    this.showPrompt = false;
  }

  _generateLoot() {
    return [
      { icon: '❤', label: 'Medkit', color: '#F44336' },
      { icon: '🔫', label: WEAPONS[Math.floor(Math.random()*WEAPONS.length)].name, color: '#4FC3F7' },
      { icon: '💰', label: `${50 + Math.floor(Math.random()*100)} Gold`, color: '#FFD700' },
    ];
  }

  update(dt) {
    this.life -= dt;
    this.pulse += dt * 3;
    if (this.scale < 1) this.scale = Math.min(1, this.scale + dt * 4);
  }

  isNear(entity) {
    const dx = entity.x - this.x, dy = entity.y - this.y;
    return Math.hypot(dx, dy) < 55;
  }

  draw(ctx, camX, camY) {
    if (this.life <= 0) return;
    const sx = this.x - camX, sy = this.y - camY;
    const sc = this.scale;
    const pulseFactor = 1 + Math.sin(this.pulse) * 0.08;
    const fadeAlpha = this.life < 5 ? this.life / 5 : 1;

    ctx.save();
    ctx.globalAlpha = fadeAlpha;
    ctx.translate(sx, sy);
    ctx.scale(sc * pulseFactor, sc * pulseFactor);
    ctx.rotate(this.angle);

    // Ground glow
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
    grd.addColorStop(0, 'rgba(255,180,0,0.18)');
    grd.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI*2); ctx.fill();

    // Box body
    ctx.fillStyle = '#3D2B0A';
    ctx.beginPath(); ctx.roundRect(-14, -12, 28, 24, 3); ctx.fill();

    // Box lid
    ctx.fillStyle = '#5C3D0F';
    ctx.beginPath(); ctx.roundRect(-14, -18, 28, 8, 3); ctx.fill();

    // Metal straps
    ctx.strokeStyle = '#A0720A'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(14, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 12); ctx.stroke();

    // Lock
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, -2, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // Loot label floating above
    ctx.rotate(-this.angle);
    ctx.font = 'bold 10px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFE566';
    ctx.shadowColor = '#FF6400'; ctx.shadowBlur = 8;
    ctx.fillText(this.killedName, 0, -26);
    ctx.shadowBlur = 0;

    ctx.restore();

    // Prompt
    if (this.showPrompt) {
      ctx.save();
      ctx.fillStyle = 'rgba(8,12,25,0.88)';
      roundRect(ctx, sx-55, sy-55, 110, 22, 5); ctx.fill();
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1;
      roundRect(ctx, sx-55, sy-55, 110, 22, 5); ctx.stroke();
      ctx.font = 'bold 11px "Rajdhani", sans-serif';
      ctx.textAlign = 'center'; ctx.fillStyle = '#FFD700';
      ctx.fillText('[F] Looten', sx, sy-39);
      ctx.restore();
    }
    this.showPrompt = false;
  }
}

// ─── MAP ──────────────────────────────────────────────────────────────────────
const MAP_DATA = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,2,2,0,0,0,1],
  [1,0,0,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,2,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,3,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,3,3,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,2,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,2,0,0,0,1],
  [1,0,0,2,2,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,2,2,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];
const MAP_H = MAP_DATA.length;
const MAP_W = MAP_DATA[0].length;

function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return 1;
  return MAP_DATA[ty][tx];
}
function isSolid(tx, ty) { return tileAt(tx, ty) !== 0; }

const SPAWN_POINTS = [
  {x:1.5,y:1.5},{x:27.5,y:1.5},{x:1.5,y:27.5},{x:27.5,y:27.5},
  {x:7.5,y:14.5},{x:21.5,y:14.5},{x:14.5,y:7.5},{x:14.5,y:21.5},
  {x:4.5,y:8.5},{x:24.5,y:8.5},{x:4.5,y:20.5},{x:24.5,y:20.5},
];
function randomSpawn() {
  const s = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
  return { x: s.x * TILE, y: s.y * TILE };
}

const BOT_NAMES = ['Ghost','Viper','Blaze','Shadow','Storm','Reaper','Cobra'];

// ─── DRAW HUMAN CHARACTER ─────────────────────────────────────────────────────
function drawHuman(ctx, x, y, aimAngle, moveAngle, walkPhase, skin, weapSkin, isPlayer, invincible) {
  ctx.save();
  ctx.translate(x, y);

  // Blink when invincible
  if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Shadow
  ctx.save();
  ctx.globalAlpha *= 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(2, 6, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === LEGS (drawn behind body, animate while moving) ===
  const legSwing = Math.sin(walkPhase) * 0.35;
  const legColor = skin.pants;
  const bootColor = skin.boots;

  ctx.save();
  ctx.rotate(aimAngle + Math.PI); // legs trail behind aim

  // Left leg
  ctx.save();
  ctx.translate(-5, 4);
  ctx.rotate(legSwing);
  ctx.fillStyle = legColor;
  ctx.beginPath();
  ctx.roundRect(-3.5, 0, 7, 14, 2);
  ctx.fill();
  // Boot
  ctx.fillStyle = bootColor;
  ctx.beginPath();
  ctx.roundRect(-4, 11, 9, 6, 2);
  ctx.fill();
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(5, 4);
  ctx.rotate(-legSwing);
  ctx.fillStyle = legColor;
  ctx.beginPath();
  ctx.roundRect(-3.5, 0, 7, 14, 2);
  ctx.fill();
  ctx.fillStyle = bootColor;
  ctx.beginPath();
  ctx.roundRect(-4, 11, 9, 6, 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // === BODY / TORSO ===
  ctx.save();
  ctx.rotate(aimAngle);

  // Shirt
  ctx.fillStyle = skin.shirt;
  ctx.beginPath();
  ctx.ellipse(0, 2, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tactical vest
  ctx.fillStyle = skin.vest;
  ctx.globalAlpha = ctx.globalAlpha;
  ctx.beginPath();
  ctx.ellipse(0, 2, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vest lines
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-5, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -3);  ctx.lineTo(5, 10);  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, 2);  ctx.lineTo(7, 2);   ctx.stroke();

  // Right arm + weapon
  ctx.save();
  ctx.translate(9, 2);
  ctx.fillStyle = skin.face; // skin color arm
  ctx.beginPath();
  ctx.roundRect(0, -3, 10, 6, 2);
  ctx.fill();

  // Weapon
  const wc = weapSkin ? weapSkin.colors : ['#888','#555','#aaa'];
  const wglow = weapSkin ? weapSkin.glow : null;
  if (wglow) { ctx.shadowColor = wglow; ctx.shadowBlur = 8; }
  ctx.fillStyle = wc[0];
  ctx.beginPath();
  ctx.roundRect(8, -4, 20, 8, 2);
  ctx.fill();
  ctx.fillStyle = wc[1];
  ctx.fillRect(24, -3, 6, 6);
  // Muzzle
  ctx.fillStyle = wc[2] || '#ccc';
  ctx.fillRect(29, -1.5, 4, 3);
  // Sight rail
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(10, -6, 14, 2);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Left arm
  ctx.save();
  ctx.translate(-9, 2);
  ctx.fillStyle = skin.face;
  ctx.beginPath();
  ctx.roundRect(-10, -3, 10, 6, 2);
  ctx.fill();
  ctx.restore();

  ctx.restore(); // end body rotation

  // === HEAD ===
  ctx.save();
  ctx.rotate(aimAngle);

  // Neck
  ctx.fillStyle = skin.face;
  ctx.fillRect(-3, -17, 6, 5);

  // Head (flesh)
  ctx.fillStyle = skin.face;
  ctx.beginPath();
  ctx.arc(0, -24, 10, 0, Math.PI * 2);
  ctx.fill();

  // Helmet top
  ctx.fillStyle = skin.helmet;
  ctx.beginPath();
  ctx.arc(0, -24, 10, Math.PI, 0, false);
  ctx.fill();
  ctx.fillRect(-10, -28, 20, 6);

  // Helmet brim
  ctx.fillStyle = skin.helmet;
  ctx.fillRect(-11, -21, 22, 3);

  // Helmet goggle
  if (isPlayer) {
    ctx.fillStyle = 'rgba(100,200,255,0.4)';
    ctx.beginPath();
    ctx.arc(5, -24, 4, -0.5, 0.5);
    ctx.arc(-5, -24, 4, Math.PI - 0.5, Math.PI + 0.5);
    ctx.fill();
  }

  // Eyes
  const eyeY = -23;
  ctx.fillStyle = '#FFF';
  ctx.beginPath(); ctx.ellipse(4, eyeY, 3, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-4, eyeY, 3, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = isPlayer ? '#1565C0' : '#333';
  ctx.beginPath(); ctx.arc(5, eyeY, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-3, eyeY, 1.5, 0, Math.PI*2); ctx.fill();

  // Nose
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.arc(0, -20, 2, 0, Math.PI); ctx.fill();

  // Accent stripe on helmet
  ctx.fillStyle = skin.accent;
  ctx.fillRect(-10, -26, 20, 3);

  // Player outline glow
  if (isPlayer) {
    ctx.restore();
    ctx.save();
    ctx.rotate(aimAngle);
    ctx.strokeStyle = 'rgba(255,220,50,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -24, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore(); // end translate
}

// ─── VEHICLE ──────────────────────────────────────────────────────────────────
class Vehicle {
  constructor(type, x, y, colorData) {
    this.type     = type;    // 'sedan' | 'pickup' | 'buggy'
    this.x        = x;
    this.y        = y;
    this.angle    = Math.random() * Math.PI * 2;
    this.speed    = 0;
    this.color    = colorData.color;
    this.color2   = colorData.color2;
    this.name     = colorData.name;
    this.hp       = 300;
    this.maxHp    = 300;
    this.driver   = null; // entity currently driving
    this.alive    = true;
    this.smokeTimer = 0;

    // Type-specific stats
    if (type === 'buggy') {
      this.maxSpeed    = 280;
      this.acceleration= 200;
      this.friction    = 1.8;
      this.turnSpeed   = 2.2;
      this.w = 30; this.h = 42;
    } else if (type === 'pickup') {
      this.maxSpeed    = 210;
      this.acceleration= 140;
      this.friction    = 1.5;
      this.turnSpeed   = 1.6;
      this.w = 38; this.h = 58;
    } else {
      this.maxSpeed    = 240;
      this.acceleration= 160;
      this.friction    = 1.6;
      this.turnSpeed   = 1.9;
      this.w = 34; this.h = 54;
    }
  }

  get radius() { return Math.max(this.w, this.h) / 2; }

  update(dt, throttle, steer, particles) {
    if (!this.alive) return;

    // Acceleration / friction
    if (throttle !== 0) {
      this.speed += throttle * this.acceleration * dt;
    } else {
      this.speed *= Math.pow(1 - this.friction * dt, 1);
      if (Math.abs(this.speed) < 2) this.speed = 0;
    }
    this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, this.speed));

    // Steering (only when moving)
    const speedFactor = Math.abs(this.speed) / this.maxSpeed;
    if (speedFactor > 0.05) {
      this.angle += steer * this.turnSpeed * dt * speedFactor * Math.sign(this.speed);
    }

    // Movement with wall collision
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    const nx = this.x + vx * dt;
    const ny = this.y + vy * dt;
    const hw = this.w / 2 - 2, hh = this.h / 2 - 2;

    // Check corners
    const corners = [
      {x: nx + Math.cos(this.angle)*hh - Math.sin(this.angle)*hw, y: ny + Math.sin(this.angle)*hh + Math.cos(this.angle)*hw},
      {x: nx + Math.cos(this.angle)*hh + Math.sin(this.angle)*hw, y: ny + Math.sin(this.angle)*hh - Math.cos(this.angle)*hw},
      {x: nx - Math.cos(this.angle)*hh - Math.sin(this.angle)*hw, y: ny - Math.sin(this.angle)*hh + Math.cos(this.angle)*hw},
      {x: nx - Math.cos(this.angle)*hh + Math.sin(this.angle)*hw, y: ny - Math.sin(this.angle)*hh - Math.cos(this.angle)*hw},
    ];
    const hit = corners.some(c => isSolid(Math.floor(c.x/TILE), Math.floor(c.y/TILE)));
    if (!hit) { this.x = nx; this.y = ny; }
    else { this.speed *= -0.3; }

    // Tire smoke at high speed
    this.smokeTimer -= dt;
    if (Math.abs(this.speed) > this.maxSpeed * 0.7 && this.smokeTimer <= 0) {
      const rearX = this.x - Math.cos(this.angle) * this.h/2;
      const rearY = this.y - Math.sin(this.angle) * this.h/2;
      particles.emitTireSmoke(rearX, rearY);
      this.smokeTimer = 0.1;
    }
  }

  tryEnter(entity) {
    if (!this.alive || this.driver) return false;
    const dx = entity.x - this.x, dy = entity.y - this.y;
    return Math.hypot(dx, dy) < 65;
  }

  eject(dx = 30) {
    const driver = this.driver;
    if (!driver) return;
    driver.x = this.x + Math.cos(this.angle + Math.PI/2) * dx;
    driver.y = this.y + Math.sin(this.angle + Math.PI/2) * dx;
    driver.inVehicle = null;
    this.driver   = null;
    this.speed   *= 0.3;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      if (this.driver) this.eject(50);
      this.alive = false;
    }
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    if (!this.alive) {
      // Wreck
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.angle);
      ctx.fillStyle = '#333';
      ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.w/2, -this.h/2, this.w, this.h);
      ctx.fillStyle = '#555';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥', 0, 5);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle   = '#000';
    ctx.beginPath();
    ctx.ellipse(3, 5, this.w/2, this.h/3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    const hw = this.w/2, hh = this.h/2;

    if (this.type === 'buggy') {
      // Open frame buggy
      ctx.fillStyle = this.color2;
      ctx.beginPath(); ctx.roundRect(-hw, -hh, this.w, this.h, 6); ctx.fill();
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.roundRect(-hw+4, -hh+4, this.w-8, this.h-8, 4); ctx.fill();
      // Roll cage
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4;
      ctx.strokeRect(-hw+4, -hh*0.4, this.w-8, hh*0.8);
    } else {
      // Car body
      ctx.fillStyle = this.color2;
      ctx.beginPath(); ctx.roundRect(-hw, -hh, this.w, this.h, 5); ctx.fill();

      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.roundRect(-hw+2, -hh+2, this.w-4, this.h-4, 4); ctx.fill();

      // Windshield (front)
      ctx.fillStyle = 'rgba(180,230,255,0.55)';
      ctx.beginPath(); ctx.roundRect(-hw+5, -hh+6, this.w-10, hh*0.55, 2); ctx.fill();

      // Rear window
      ctx.fillStyle = 'rgba(150,200,230,0.45)';
      ctx.beginPath(); ctx.roundRect(-hw+5, hh*0.2, this.w-10, hh*0.5, 2); ctx.fill();

      // Roof
      ctx.fillStyle = this.color2;
      if (this.type === 'pickup') {
        ctx.fillRect(-hw+3, -hh*0.05, this.w-6, hh*0.6);
      } else {
        ctx.beginPath(); ctx.roundRect(-hw+4, -hh*0.15, this.w-8, hh*0.85, 3); ctx.fill();
      }

      // Headlights
      ctx.fillStyle = '#FFFDE7';
      ctx.shadowColor = '#FFF9C4';
      ctx.shadowBlur  = 8;
      ctx.fillRect(-hw+3, -hh+2, 7, 4);
      ctx.fillRect(hw-10, -hh+2, 7, 4);
      // Tail lights
      ctx.fillStyle = '#F44336';
      ctx.shadowColor = '#F44336';
      ctx.fillRect(-hw+3, hh-6, 7, 4);
      ctx.fillRect(hw-10, hh-6, 7, 4);
      ctx.shadowBlur = 0;
    }

    // Wheels
    const wheelW = 7, wheelH = 11;
    const wheels = [
      {x: -hw-2, y: -hh*0.55}, {x: hw-wheelW+2, y: -hh*0.55},
      {x: -hw-2, y:  hh*0.45}, {x: hw-wheelW+2, y:  hh*0.45},
    ];
    wheels.forEach(w => {
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath(); ctx.roundRect(w.x, w.y, wheelW, wheelH, 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(w.x+wheelW/2, w.y+wheelH/2, wheelW*0.35, 0, Math.PI*2); ctx.fill();
    });

    // Driver indicator
    if (this.driver) {
      ctx.fillStyle = 'rgba(255,220,0,0.7)';
      ctx.beginPath(); ctx.arc(0, -hh*0.2, 5, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();

    // HP bar
    const pct = this.hp / this.maxHp;
    if (pct < 1) {
      const bw = 50, bh = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(sx - bw/2, sy - this.h/2 - 14, bw, bh);
      ctx.fillStyle = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(sx - bw/2, sy - this.h/2 - 14, bw * pct, bh);
    }

    // "Press E" prompt
    if (!this.driver && this._showPrompt) {
      ctx.save();
      ctx.fillStyle = 'rgba(10,15,30,0.85)';
      roundRect(ctx, sx - 50, sy - this.h/2 - 36, 100, 22, 5);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      roundRect(ctx, sx - 50, sy - this.h/2 - 36, 100, 22, 5);
      ctx.stroke();
      ctx.font = 'bold 12px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('[E] Enter Vehicle', sx, sy - this.h/2 - 20);
      ctx.restore();
    }
    this._showPrompt = false;
  }
}

// ─── BULLET ───────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle, weapon, ownerId, ownerName) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * weapon.bulletSpeed;
    this.vy = Math.sin(angle) * weapon.bulletSpeed;
    this.weapon    = weapon;
    this.ownerId   = ownerId;
    this.ownerName = ownerName;
    this.alive     = true;
    this.traveled  = 0;
    this.size      = weapon.bulletSize;
    this.color     = weapon.bulletColor;
    this.isExplosive      = weapon.isExplosive;
    this.explosionRadius  = weapon.explosionRadius || 0;
    this.trail = [];
  }

  update(dt, entities, vehicles, particles, shake, feed, floatTexts, elim, onKill, onExplosion) {
    if (!this.alive) return;
    this.trail.push({x: this.x, y: this.y});
    if (this.trail.length > 8) this.trail.shift();

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.traveled += Math.hypot(this.vx * dt, this.vy * dt);

    if (this.traveled > this.weapon.range) { this.alive = false; return; }

    const tx = Math.floor(this.x / TILE), ty = Math.floor(this.y / TILE);
    if (isSolid(tx, ty)) {
      this.alive = false;
      if (this.isExplosive) onExplosion(this.x, this.y, this);
      else particles.emitSparks(this.x, this.y, Math.atan2(-this.vy, -this.vx));
      return;
    }

    // Vehicle hit
    for (const v of vehicles) {
      if (!v.alive || v.driver?.id === this.ownerId) continue;
      const dx = v.x - this.x, dy = v.y - this.y;
      if (Math.hypot(dx, dy) < v.radius + this.size) {
        this.alive = false;
        if (this.isExplosive) { onExplosion(this.x, this.y, this); return; }
        v.takeDamage(this.weapon.damage * 0.3);
        particles.emitImpact(this.x, this.y, Math.atan2(-this.vy, -this.vx));
        return;
      }
    }

    // Entity hit
    for (const e of entities) {
      if (!e.alive || e.id === this.ownerId || e.inVehicle) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      if (dx*dx + dy*dy < (e.radius + this.size) * (e.radius + this.size)) {
        this.alive = false;
        if (this.isExplosive) { onExplosion(this.x, this.y, this); return; }
        e.takeDamage(this.weapon.damage, this.ownerId, this.ownerName, this.weapon.name,
                     particles, shake, feed, floatTexts, elim, onKill);
        return;
      }
    }
  }

  draw(ctx, camX, camY) {
    if (!this.alive) return;
    const sx = this.x - camX, sy = this.y - camY;
    if (this.trail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.trail.length - 1; i++) {
        ctx.globalAlpha = (i / this.trail.length) * 0.4;
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = this.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(this.trail[i].x - camX, this.trail[i].y - camY);
        ctx.lineTo(this.trail[i+1].x - camX, this.trail[i+1].y - camY);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = this.color; ctx.shadowBlur = this.isExplosive ? 14 : 6;
    ctx.fillStyle   = this.color;
    ctx.beginPath(); ctx.arc(sx, sy, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ─── BASE ENTITY ──────────────────────────────────────────────────────────────
class Entity {
  constructor(id, name, x, y, isPlayer) {
    this.id = id; this.name = name;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.angle     = 0;
    this.moveAngle = 0;
    this.walkPhase = 0;
    this.hp        = isPlayer ? 100 : BOT_MAX_HP;
    this.maxHp     = isPlayer ? 100 : BOT_MAX_HP;
    this.alive     = true;
    this.radius    = 15;
    this.isPlayer  = isPlayer;
    this.weaponIndex  = 0;
    this.ammo         = WEAPONS[0].mag;
    this.reloading    = false;
    this.reloadTimer  = 0;
    this.shootCooldown = 0;
    this.kills  = 0;
    this.deaths = 0;
    this.score  = 0;
    this.respawnTimer = 0;
    this.invincible   = 0;
    this.inVehicle    = null;
    this.skinData     = isPlayer ? CHARACTER_SKINS[playerSkins.character] : CHARACTER_SKINS[Math.floor(Math.random()*CHARACTER_SKINS.length)];
  }

  get weapon() { return WEAPONS[this.weaponIndex]; }

  advanceWeapon() {
    if (this.weaponIndex < WEAPONS.length - 1) {
      this.weaponIndex++;
      this.ammo = this.weapon.mag;
      this.reloading = false;
      return true;
    }
    return false;
  }

  regressWeapon() {
    if (this.weaponIndex > 0) {
      this.weaponIndex--;
      this.ammo = this.weapon.mag;
      this.reloading = false;
    }
  }

  takeDamage(dmg, killerID, killerName, weaponName, particles, shake, feed, floatTexts, elim, onKill) {
    if (!this.alive || this.invincible > 0) return false;
    this.hp -= dmg;
    particles.emitBlood(this.x, this.y, Math.atan2(this.y, this.x));

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.deaths++;
      this.respawnTimer = 3.0;
      if (this.inVehicle) { this.inVehicle.eject(40); }

      const isPlayerKilling = killerID === 'player';
      const isPlayerKilled  = this.isPlayer;
      feed.add(killerName, this.name, weaponName, isPlayerKilling);

      if (isPlayerKilling) {
        shake.add(8, 0.25);
        floatTexts.add(this.x, this.y - 20, '+1 KILL', '#FFE566', 18);
        elim.show('ELIMINATION!', `${this.name} eliminated by ${killerName}`, '#FF6400');
      } else if (isPlayerKilled) {
        shake.add(15, 0.4);
        elim.show('YOU WERE ELIMINATED', `By ${killerName} with ${weaponName}`, '#FF1744');
      } else {
        elim.show(`${this.name} eliminated`, `By ${killerName}`, '#29B6F6');
      }

      onKill(killerID, this.id);
      return true;
    }
    return false;
  }

  applyMovement(dt) {
    if (!this.alive) return;
    const moving = this.vx !== 0 || this.vy !== 0;
    if (!moving) return;
    if (moving) {
      this.moveAngle = Math.atan2(this.vy, this.vx);
      this.walkPhase += dt * 8;
    }

    const nx = this.x + this.vx * dt;
    const ny = this.y + this.vy * dt;
    const r  = this.radius * 0.9;

    const canX = !isSolid(Math.floor((nx+r)/TILE), Math.floor(this.y/TILE)) &&
                 !isSolid(Math.floor((nx-r)/TILE), Math.floor(this.y/TILE));
    const canY = !isSolid(Math.floor(this.x/TILE), Math.floor((ny+r)/TILE)) &&
                 !isSolid(Math.floor(this.x/TILE), Math.floor((ny-r)/TILE));
    if (canX) this.x = nx;
    if (canY) this.y = ny;
  }

  draw(ctx, camX, camY) {
    if (!this.alive) return;
    const sx = this.x - camX, sy = this.y - camY;

    const ws = this.isPlayer ? WEAPON_SKINS[playerSkins.weapon] : WEAPON_SKINS['default'];
    drawHuman(ctx, sx, sy, this.angle, this.moveAngle, this.walkPhase,
              this.skinData, ws, this.isPlayer, this.invincible);

    // HP bar
    if (this.hp < this.maxHp) {
      const bw = 34, bh = 4;
      const bx = sx - bw/2, by = sy - 46;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, bh);
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(bx, by, bw * pct, bh);
    }

    // Name tag (bots only)
    if (!this.isPlayer) {
      ctx.save();
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(sx - 24, sy - 58, 48, 14);
      ctx.fillStyle = '#FFF';
      ctx.fillText(this.name, sx, sy - 47);
      ctx.restore();
    }
  }
}

// ─── PLAYER ───────────────────────────────────────────────────────────────────
class Player extends Entity {
  constructor() {
    const sp = randomSpawn();
    super('player', 'YOU', sp.x, sp.y, true);
    this.speed  = 130;
    this.keys   = {};
    this.mouseX = 0; this.mouseY = 0;
    this.shooting = false;
  }

  handleInput(keys, mouseX, mouseY, camX, camY, shooting) {
    this.keys     = keys;
    this.mouseX   = mouseX + camX;
    this.mouseY   = mouseY + camY;
    this.shooting = shooting;
    if (this.inVehicle) {
      this.angle = Math.atan2(this.mouseY - this.inVehicle.y, this.mouseX - this.inVehicle.x);
    } else {
      this.angle = Math.atan2(this.mouseY - this.y, this.mouseX - this.x);
    }
  }

  update(dt, bullets, entities, vehicles, particles, shake, feed, floatTexts, elim, levelUpFx, onKill) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }
    this.invincible = Math.max(0, this.invincible - dt);

    // Vehicle driving
    if (this.inVehicle) {
      const car = this.inVehicle;
      const throttle = (this.keys['w'] || this.keys['arrowup'] ? 1 : 0) -
                       (this.keys['s'] || this.keys['arrowdown'] ? 1 : 0);
      const steer    = (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) -
                       (this.keys['a'] || this.keys['arrowleft']  ? 1 : 0);
      car.update(dt, throttle, steer, particles);
      this.x = car.x; this.y = car.y;
      this.angle = Math.atan2(this.mouseY - this.y, this.mouseX - this.x);
    } else {
      this.vx = 0; this.vy = 0;
      if (this.keys['w'] || this.keys['arrowup'])    this.vy = -this.speed;
      if (this.keys['s'] || this.keys['arrowdown'])   this.vy =  this.speed;
      if (this.keys['a'] || this.keys['arrowleft'])   this.vx = -this.speed;
      if (this.keys['d'] || this.keys['arrowright'])  this.vx =  this.speed;
      if (this.vx && this.vy) { this.vx *= 0.707; this.vy *= 0.707; }
      this.applyMovement(dt);
    }

    this.shootCooldown = Math.max(0, this.shootCooldown - dt * 1000);
    if (this.reloading) {
      this.reloadTimer -= dt * 1000;
      if (this.reloadTimer <= 0) { this.reloading = false; this.ammo = this.weapon.mag; }
    }
    if (this.ammo <= 0 && !this.reloading) this.startReload();
    if (this.shooting && !this.reloading) {
      this.tryShoot(bullets, particles, entities, shake, feed, floatTexts, elim, levelUpFx, onKill);
    }
  }

  tryShoot(bullets, particles, entities, shake, feed, floatTexts, elim, levelUpFx, onKill) {
    if (this.shootCooldown > 0 || this.ammo <= 0) return;
    const w = this.weapon;
    if (w.isMelee) {
      // Melee
      for (const e of entities) {
        if (!e.alive || e.id === this.id) continue;
        const dx = e.x - this.x, dy = e.y - this.y;
        if (dx*dx + dy*dy < w.range*w.range) {
          particles.emitBlood(e.x, e.y, Math.atan2(dy, dx));
          shake.add(5, 0.2);
          e.takeDamage(w.damage, this.id, this.name, w.name,
                       particles, shake, feed, floatTexts, elim, onKill);
        }
      }
      this.shootCooldown = w.fireRate;
      return;
    }
    this.shootCooldown = w.fireRate;
    this.ammo--;

    const originX = this.inVehicle ? this.inVehicle.x : this.x;
    const originY = this.inVehicle ? this.inVehicle.y : this.y;
    const muzzleX = originX + Math.cos(this.angle) * 35;
    const muzzleY = originY + Math.sin(this.angle) * 35;

    const skinKey = playerSkins.weapon;
    const special = WEAPON_SKINS[skinKey]?.special || null;
    particles.emitMuzzleFlash(muzzleX, muzzleY, this.angle, special);
    shake.add(w.type === 'sniper' ? 6 : w.type === 'launcher' ? 10 : 2, 0.08);

    for (let i = 0; i < w.pellets; i++) {
      const spread = (Math.random() - 0.5) * w.spread * 2;
      bullets.push(new Bullet(muzzleX, muzzleY, this.angle + spread, w, this.id, this.name));
    }
  }

  startReload() {
    if (this.reloading || this.weapon.isMelee) return;
    this.reloading   = true;
    this.reloadTimer = this.weapon.reloadTime;
  }

  respawn() {
    const sp = randomSpawn();
    this.x = sp.x; this.y = sp.y;
    this.hp = this.maxHp;
    this.alive = true;
    this.invincible = 2.0;
    this.reloading = false;
    this.ammo = this.weapon.mag;
    this.regressWeapon();
  }
}

// ─── BOT ──────────────────────────────────────────────────────────────────────
class Bot extends Entity {
  constructor(id, name, x, y) {
    super(id, name, x, y, false);
    this.speed        = 88 + Math.random() * 40;
    this.state        = 'patrol';
    this.target       = null;
    this.patrolTarget = { x, y };
    this.visionRange  = 220;
    this.stateTimer   = 0;
    this.strafeDir    = 1;
    this.strafeCooldown = 0;
    this.lastKnownX   = x;
    this.lastKnownY   = y;
    this.reactionTime = 0.18 + Math.random() * 0.3;
    this.reactionTimer = 0;
    this.newPatrolCooldown = 0;
    this.difficulty   = 0.55 + Math.random() * 0.45;
  }

  canSee(target) {
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.visionRange) return false;
    const steps = Math.ceil(dist / TILE);
    for (let i = 1; i < steps; i++) {
      const tx = Math.floor((this.x + dx*i/steps) / TILE);
      const ty = Math.floor((this.y + dy*i/steps) / TILE);
      if (isSolid(tx, ty)) return false;
    }
    return true;
  }

  newPatrol() {
    for (let i = 0; i < 20; i++) {
      const tx = 1 + Math.floor(Math.random() * (MAP_W - 2));
      const ty = 1 + Math.floor(Math.random() * (MAP_H - 2));
      if (!isSolid(tx, ty)) {
        this.patrolTarget = { x: (tx+0.5)*TILE, y: (ty+0.5)*TILE };
        return;
      }
    }
  }

  update(dt, bullets, player, particles, shake, feed, floatTexts, elim, onKill) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        const sp = randomSpawn();
        this.x = sp.x; this.y = sp.y;
        this.hp = this.maxHp;
        this.alive = true;
        this.invincible = 1.5;
        this.reloading  = false;
        this.ammo = this.weapon.mag;
        this.regressWeapon();
      }
      return;
    }
    this.invincible    = Math.max(0, this.invincible - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt * 1000);
    this.stateTimer   -= dt;
    this.strafeCooldown -= dt;
    this.newPatrolCooldown -= dt;

    if (this.reloading) {
      this.reloadTimer -= dt * 1000;
      if (this.reloadTimer <= 0) { this.reloading = false; this.ammo = this.weapon.mag; }
    }
    if (this.ammo <= 0 && !this.reloading) {
      this.reloading = true;
      this.reloadTimer = this.weapon.reloadTime;
    }

    const target = player.alive ? player : null;
    if (target && this.canSee(target)) {
      this.lastKnownX = target.x; this.lastKnownY = target.y;
      this.state = 'chase';
      this.reactionTimer -= dt;
    } else {
      if (this.state === 'chase') { this.state = 'search'; this.stateTimer = 3 + Math.random()*2; }
      if (this.state === 'search' && this.stateTimer <= 0) this.state = 'patrol';
    }

    this.vx = 0; this.vy = 0;

    if (this.state === 'patrol') {
      const dx = this.patrolTarget.x - this.x, dy = this.patrolTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < TILE * 0.5 || this.newPatrolCooldown <= 0) {
        this.newPatrol(); this.newPatrolCooldown = 1.5 + Math.random()*2;
      }
      if (dist > 5) { this.vx = dx/dist*this.speed*0.6; this.vy = dy/dist*this.speed*0.6; this.angle = Math.atan2(dy,dx); }
    } else {
      const tx = this.state === 'chase' && target ? target.x : this.lastKnownX;
      const ty = this.state === 'chase' && target ? target.y : this.lastKnownY;
      const dx = tx - this.x, dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      this.angle = Math.atan2(dy, dx);

      if (this.state === 'chase' && target) {
        const idealDist = this.weapon.type === 'sniper' ? 300 : this.weapon.type === 'shotgun' ? 110 : 180;
        if (dist > idealDist + 30) { this.vx = dx/dist*this.speed; this.vy = dy/dist*this.speed; }
        else if (dist < idealDist - 30) { this.vx = -dx/dist*this.speed*0.5; this.vy = -dy/dist*this.speed*0.5; }
        if (this.strafeCooldown <= 0) { this.strafeDir = Math.random()>0.5?1:-1; this.strafeCooldown = 0.9+Math.random()*1.2; }
        const perpX = -dy/dist*this.strafeDir, perpY = dx/dist*this.strafeDir;
        this.vx += perpX*this.speed*0.4; this.vy += perpY*this.speed*0.4;

        if (this.reactionTimer <= 0 && !this.reloading && this.shootCooldown <= 0 && this.ammo > 0) {
          const aimAngle = this.angle + (Math.random()-0.5)*(this.weapon.spread + (1-this.difficulty)*0.2);
          if (this.weapon.isMelee) {
            if (dist < this.weapon.range) {
              target.takeDamage(this.weapon.damage, this.id, this.name, this.weapon.name,
                                particles, shake, feed, floatTexts, elim, onKill);
              this.shootCooldown = this.weapon.fireRate;
            }
          } else {
            this.shootCooldown = this.weapon.fireRate;
            this.ammo--;
            const mx = this.x + Math.cos(aimAngle)*(this.radius+8);
            const my = this.y + Math.sin(aimAngle)*(this.radius+8);
            particles.emitMuzzleFlash(mx, my, aimAngle, null);
            for (let i = 0; i < this.weapon.pellets; i++) {
              const s = (Math.random()-0.5)*this.weapon.spread*2;
              bullets.push(new Bullet(mx, my, aimAngle+s, this.weapon, this.id, this.name));
            }
          }
          this.reactionTimer = this.reactionTime;
        }
      } else if (this.state === 'search' && dist > 10) {
        this.vx = dx/dist*this.speed*0.7; this.vy = dy/dist*this.speed*0.7;
      }
    }

    const spd = Math.hypot(this.vx, this.vy);
    if (spd > this.speed) { this.vx *= this.speed/spd; this.vy *= this.speed/spd; }
    this.applyMovement(dt);
  }
}

// ─── GAME ─────────────────────────────────────────────────────────────────────
class Game {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.width   = canvas.width;
    this.height  = canvas.height;

    this.particles  = new ParticleSystem();
    this.shake      = new ScreenShake();
    this.feed       = new KillFeed();
    this.floatTexts = new FloatingTexts();
    this.elim       = new EliminationPopup();
    this.levelUpFx  = new WeaponLevelUp();

    this.bullets    = [];
    this.explosions = [];
    this.lootBoxes  = [];

    this.player   = new Player();
    this.bots     = [];
    for (let i = 0; i < BOT_COUNT; i++) {
      const sp = randomSpawn();
      this.bots.push(new Bot(`bot${i}`, BOT_NAMES[i], sp.x, sp.y));
    }

    // Vehicles — 4 auf der Karte
    this.vehicles = [];
    const vspawns = [
      {x: 6*TILE, y: 6*TILE}, {x: 22*TILE, y: 6*TILE},
      {x: 6*TILE, y: 22*TILE}, {x: 22*TILE, y: 22*TILE},
    ];
    VEHICLE_PRESETS.forEach((preset, i) => {
      this.vehicles.push(new Vehicle(preset.type, vspawns[i].x, vspawns[i].y, preset));
    });

    this.camX = 0; this.camY = 0;
    this.keys  = {};
    this.mouse = { x: 0, y: 0, down: false };

    this.timeLeft = MATCH_DURATION;
    this.running  = false;
    this.over     = false;
    this.lastTime = 0;

    this.scores = new Map();
    this.scores.set('player', { name: 'YOU', kills: 0, score: 0 });
    for (const b of this.bots) this.scores.set(b.id, { name: b.name, kills: 0, score: 0 });

    this.floorPattern = null;
    this._buildFloorPattern();
    this.bindInput();
  }

  _buildFloorPattern() {
    const pc = document.createElement('canvas');
    pc.width = pc.height = TILE;
    const px = pc.getContext('2d');
    px.fillStyle = '#1A2235';
    px.fillRect(0, 0, TILE, TILE);
    // Subtle texture
    px.fillStyle = 'rgba(255,255,255,0.015)';
    for (let i = 0; i < 5; i++) {
      const rx = Math.random()*TILE, ry = Math.random()*TILE;
      px.fillRect(rx, ry, 4, 4);
    }
    px.strokeStyle = '#1D2640';
    px.lineWidth = 1;
    px.beginPath(); px.moveTo(TILE,0); px.lineTo(TILE,TILE); px.stroke();
    px.beginPath(); px.moveTo(0,TILE); px.lineTo(TILE,TILE); px.stroke();
    this.floorPattern = this.ctx.createPattern(pc, 'repeat');
  }

  bindInput() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (k === 'r') this.player.startReload();
      if (k === 'e') this.tryVehicleInteract();
      if (k === 'f') this.tryLoot();
    });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    this.canvas.addEventListener('mousemove', e => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (this.canvas.width  / r.width);
      this.mouse.y = (e.clientY - r.top)  * (this.canvas.height / r.height);
    });
    this.canvas.addEventListener('mousedown', () => { this.mouse.down = true; });
    this.canvas.addEventListener('mouseup',   () => { this.mouse.down = false; });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  tryLoot() {
    if (!this.player.alive) return;
    for (let i = this.lootBoxes.length - 1; i >= 0; i--) {
      const box = this.lootBoxes[i];
      if (box.isNear(this.player)) {
        // Heal on loot
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
        this.floatTexts.add(box.x, box.y - 20, `+50 HP  💊`, '#4CAF50', 16);
        this.particles.emitIceShard(box.x, box.y);
        this.shake.add(3, 0.1);
        this.lootBoxes.splice(i, 1);
        break;
      }
    }
  }

  tryVehicleInteract() {
    if (!this.player.alive) return;
    if (this.player.inVehicle) {
      this.player.inVehicle.eject(40);
      return;
    }
    for (const v of this.vehicles) {
      if (v.tryEnter(this.player)) {
        this.player.inVehicle = v;
        v.driver = this.player;
        return;
      }
    }
  }

  start() {
    this.running  = true;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    if (this.over) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.over = true; this.showResults(); return; }

    const allEntities = [this.player, ...this.bots];
    this.player.handleInput(this.keys, this.mouse.x, this.mouse.y, this.camX, this.camY, this.mouse.down);
    this.player.update(dt, this.bullets, allEntities, this.vehicles, this.particles, this.shake,
                       this.feed, this.floatTexts, this.elim, this.levelUpFx,
                       (kid, vid) => this.onKill(kid, vid, allEntities));

    for (const bot of this.bots) {
      bot.update(dt, this.bullets, this.player, this.particles, this.shake, this.feed,
                 this.floatTexts, this.elim, (kid, vid) => this.onKill(kid, vid, allEntities));
    }

    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(dt, allEntities, this.vehicles, this.particles, this.shake, this.feed,
        this.floatTexts, this.elim,
        (kid, vid) => this.onKill(kid, vid, allEntities),
        (bx, by, b) => this.onExplosion(bx, by, b, allEntities));
      if (!this.bullets[i].alive) this.bullets.splice(i, 1);
    }

    // Vehicle prompt check
    for (const v of this.vehicles) {
      if (!this.player.inVehicle && v.tryEnter(this.player)) v._showPrompt = true;
    }

    // Loot boxes
    for (let i = this.lootBoxes.length - 1; i >= 0; i--) {
      const box = this.lootBoxes[i];
      box.update(dt);
      if (box.isNear(this.player)) box.showPrompt = true;
      if (box.life <= 0) this.lootBoxes.splice(i, 1);
    }

    // Explosions decay
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= dt;
      if (this.explosions[i].life <= 0) this.explosions.splice(i, 1);
    }

    // Effects
    this.particles.update(dt);
    this.shake.update(dt);
    this.feed.update(dt);
    this.floatTexts.update(dt);
    this.elim.update(dt);
    this.levelUpFx.update(dt);

    // Camera
    const targetX = (this.player.inVehicle ? this.player.inVehicle.x : this.player.x) - this.width / 2;
    const targetY = (this.player.inVehicle ? this.player.inVehicle.y : this.player.y) - this.height / 2;
    const maxCX = MAP_W * TILE - this.width, maxCY = MAP_H * TILE - this.height;
    this.camX += (Math.max(0, Math.min(maxCX, targetX)) - this.camX) * 0.12;
    this.camY += (Math.max(0, Math.min(maxCY, targetY)) - this.camY) * 0.12;
    this.camX += this.shake.offsetX; this.camY += this.shake.offsetY;
  }

  onKill(killerId, victimId, entities) {
    const entry = this.scores.get(killerId);
    if (entry) { entry.kills++; entry.score++; }
    const killer = entities.find(e => e.id === killerId);
    if (killer) {
      const advanced = killer.advanceWeapon();
      if (killer.isPlayer && advanced) this.levelUpFx.show(killer.weapon.name);
    }
    // Spawn loot box at victim position
    const victim = entities.find(e => e.id === victimId);
    if (victim) {
      this.lootBoxes.push(new LootBox(
        victim.x + (Math.random()-0.5)*20,
        victim.y + (Math.random()-0.5)*20,
        victim.name
      ));
    }
  }

  onExplosion(bx, by, bullet, entities) {
    this.particles.emitExplosion(bx, by);
    this.shake.add(14, 0.5);
    this.explosions.push({ x: bx, y: by, life: 0.5, maxLife: 0.5, radius: bullet.explosionRadius });
    for (const e of entities) {
      if (!e.alive || e.id === bullet.ownerId) continue;
      const dx = e.x - bx, dy = e.y - by;
      const dist = Math.hypot(dx, dy);
      if (dist < bullet.explosionRadius) {
        e.takeDamage(bullet.weapon.damage * (1 - dist/bullet.explosionRadius*0.5),
          bullet.ownerId, bullet.ownerName, bullet.weapon.name,
          this.particles, this.shake, this.feed, this.floatTexts, this.elim,
          (kid, vid) => this.onKill(kid, vid, entities));
      }
    }
    // Vehicle explosion damage
    for (const v of this.vehicles) {
      if (!v.alive) continue;
      const dist = Math.hypot(v.x - bx, v.y - by);
      if (dist < bullet.explosionRadius + 30) v.takeDamage(bullet.weapon.damage * 0.5);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const cx = Math.round(this.camX), cy = Math.round(this.camY);

    this.drawMap(ctx, cx, cy);
    for (const v of this.vehicles) v.draw(ctx, cx, cy);
    this.particles.draw(ctx);
    for (const bot of this.bots) bot.draw(ctx, cx, cy);
    if (!this.player.inVehicle) this.player.draw(ctx, cx, cy);
    else {
      // Draw player ON TOP of vehicle
      this.player.draw(ctx, cx, cy);
    }
    for (const b of this.bullets) b.draw(ctx, cx, cy);

    for (const ex of this.explosions) {
      const a = ex.life / ex.maxLife;
      const r = ex.radius * (1 + (1-a)*0.5);
      ctx.save();
      const g = ctx.createRadialGradient(ex.x-cx, ex.y-cy, 0, ex.x-cx, ex.y-cy, r);
      g.addColorStop(0, `rgba(255,220,100,${a*0.9})`);
      g.addColorStop(0.4, `rgba(255,100,20,${a*0.7})`);
      g.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex.x-cx, ex.y-cy, r, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    for (const box of this.lootBoxes) box.draw(ctx, cx, cy);
    this.floatTexts.draw(ctx, cx, cy);
    this.drawHUD(ctx);
    this.feed.draw(ctx, this.width);
    this.elim.draw(ctx, this.width, this.height);
    this.levelUpFx.draw(ctx, this.width, this.height);
    this.drawCrosshair(ctx);
  }

  drawMap(ctx, cx, cy) {
    const sx = Math.max(0, Math.floor(cx/TILE));
    const sy = Math.max(0, Math.floor(cy/TILE));
    const ex = Math.min(MAP_W, sx + Math.ceil(this.width/TILE)+2);
    const ey = Math.min(MAP_H, sy + Math.ceil(this.height/TILE)+2);

    ctx.fillStyle = this.floorPattern;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let ty = sy; ty < ey; ty++) {
      for (let tx = sx; tx < ex; tx++) {
        const tile = tileAt(tx, ty);
        if (tile === 0) continue;
        const wx = tx*TILE - cx, wy = ty*TILE - cy;

        if (tile === 1) {
          const g = ctx.createLinearGradient(wx, wy, wx+TILE, wy+TILE);
          g.addColorStop(0, '#263045'); g.addColorStop(1, '#182030');
          ctx.fillStyle = g;
          ctx.fillRect(wx, wy, TILE, TILE);
          ctx.strokeStyle = '#304060'; ctx.lineWidth = 1;
          ctx.strokeRect(wx+0.5, wy+0.5, TILE-1, TILE-1);
          ctx.fillStyle = 'rgba(150,180,220,0.1)';
          ctx.fillRect(wx, wy, TILE, 3);
          // Brick pattern
          ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5;
          for (let r = 0; r < 4; r++) {
            const roff = r%2 === 0 ? 0 : TILE/4;
            ctx.beginPath();
            ctx.moveTo(wx + roff, wy + r*(TILE/4));
            ctx.lineTo(wx + roff + TILE/2, wy + r*(TILE/4));
            ctx.stroke();
          }
        } else if (tile === 2) {
          // Wood crate
          ctx.fillStyle = '#5D4037'; ctx.fillRect(wx+3, wy+3, TILE-6, TILE-6);
          ctx.strokeStyle = '#795548'; ctx.lineWidth = 1.5;
          ctx.strokeRect(wx+3, wy+3, TILE-6, TILE-6);
          ctx.fillStyle = '#795548';
          ctx.fillRect(wx+TILE/2-1, wy+4, 2, TILE-8);
          ctx.fillRect(wx+4, wy+TILE/2-1, TILE-8, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(wx+TILE-6, wy+3, 3, TILE-6);
          ctx.fillRect(wx+3, wy+TILE-6, TILE-6, 3);
        } else if (tile === 3) {
          // Metal barrel
          ctx.fillStyle = '#37474F';
          ctx.beginPath(); ctx.arc(wx+TILE/2, wy+TILE/2, TILE/2-4, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = '#546E7A'; ctx.lineWidth = 2; ctx.stroke();
          ctx.strokeStyle = '#455A64'; ctx.lineWidth = 3;
          for (let r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.arc(wx+TILE/2, wy+TILE/2, (TILE/2-4)*(0.4+r*0.2), 0, Math.PI*2);
            ctx.stroke();
          }
          // Hazard stripe
          ctx.fillStyle = '#F9A825';
          ctx.fillRect(wx+TILE/2-3, wy+TILE/2-6, 6, 12);
        }
      }
    }
  }

  drawHUD(ctx) {
    const p = this.player;

    // Top bar
    ctx.fillStyle = 'rgba(8,12,25,0.88)';
    ctx.fillRect(0, 0, this.width, 58);
    ctx.strokeStyle = '#1E3A6E'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,58); ctx.lineTo(this.width,58); ctx.stroke();

    // Timer
    const m = Math.floor(this.timeLeft/60), s = Math.floor(this.timeLeft%60);
    const isLow = this.timeLeft < 60;
    ctx.save();
    ctx.font = 'bold 34px "Rajdhani", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isLow ? (Math.floor(this.timeLeft*2)%2 ? '#FF1744':'#FF8A80') : '#E0E0E0';
    if (isLow) { ctx.shadowColor='#FF1744'; ctx.shadowBlur=15; }
    ctx.fillText(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, this.width/2, 40);
    ctx.shadowBlur=0;
    ctx.font='11px sans-serif'; ctx.fillStyle='#556'; ctx.fillText('TIME REMAINING', this.width/2, 14);
    ctx.restore();

    // Kills
    ctx.save();
    ctx.font='bold 26px "Rajdhani", sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#FFE566';
    ctx.fillText(`${p.kills}`, 20, 38);
    ctx.font='11px sans-serif'; ctx.fillStyle='#778'; ctx.fillText('KILLS', 20, 14);
    ctx.restore();

    // Weapon name
    ctx.save();
    ctx.font='bold 16px "Rajdhani", sans-serif'; ctx.textAlign='left';
    ctx.fillStyle = p.weapon.color; ctx.shadowColor=p.weapon.color; ctx.shadowBlur=8;
    ctx.fillText(p.weapon.name, 80, 38);
    ctx.shadowBlur=0;
    ctx.font='11px sans-serif'; ctx.fillStyle='#778';
    ctx.fillText(`WPN ${p.weaponIndex+1}/${WEAPONS.length}`, 80, 14);
    ctx.restore();

    // Vehicle indicator
    if (p.inVehicle) {
      ctx.save();
      ctx.fillStyle='rgba(30,60,130,0.8)';
      roundRect(ctx, this.width/2-80, 62, 160, 28, 6); ctx.fill();
      ctx.font='bold 13px "Rajdhani", sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#4FC3F7';
      ctx.fillText(`🚗 ${p.inVehicle.name}  •  [E] Aussteigen`, this.width/2, 81);
      ctx.restore();
    }

    // Bottom HUD
    const bY = this.height - 82;
    ctx.fillStyle='rgba(8,12,25,0.88)';
    ctx.fillRect(0, bY, this.width, 82);
    ctx.strokeStyle='#1E3A6E'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,bY); ctx.lineTo(this.width,bY); ctx.stroke();

    // HP bar
    ctx.fillStyle='rgba(0,0,0,0.5)';
    roundRect(ctx, 20, bY+18, 200, 12, 3); ctx.fill();
    const hpPct = p.hp/p.maxHp;
    ctx.fillStyle = hpPct>0.5?'#4CAF50':hpPct>0.25?'#FF9800':'#F44336';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur=6;
    roundRect(ctx, 20, bY+18, 200*hpPct, 12, 3); ctx.fill();
    ctx.shadowBlur=0;
    ctx.font='bold 12px "Rajdhani", sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#FFF';
    ctx.fillText(`HP  ${Math.ceil(p.hp)} / ${p.maxHp}`, 20, bY+46);

    // Ammo
    ctx.textAlign='right';
    if (p.reloading) {
      const prog = 1 - p.reloadTimer/p.weapon.reloadTime;
      ctx.fillStyle='#FFD700'; ctx.shadowColor='#FFD700'; ctx.shadowBlur=8;
      ctx.font='bold 14px "Rajdhani", sans-serif';
      ctx.fillText(`RELOADING... ${Math.round(prog*100)}%`, this.width-20, bY+32);
      ctx.fillStyle='rgba(0,0,0,0.5)';
      roundRect(ctx, this.width-180, bY+38, 160, 6, 3); ctx.fill();
      ctx.fillStyle='#FFD700';
      roundRect(ctx, this.width-180, bY+38, 160*prog, 6, 3); ctx.fill();
    } else {
      ctx.fillStyle = p.ammo===0?'#F44336':'#E0E0E0'; ctx.shadowBlur=0;
      ctx.font='bold 30px "Rajdhani", monospace';
      const ammoTxt = p.weapon.isMelee ? '∞' : `${p.ammo} / ${p.weapon.mag}`;
      ctx.fillText(ammoTxt, this.width-20, bY+40);
      ctx.font='11px sans-serif'; ctx.fillStyle='#778';
      ctx.fillText('AMMO', this.width-20, bY+56);
    }
    ctx.shadowBlur=0;

    // Gun game progress
    const pgW = this.width-250, pgX=125, pgY=bY+62;
    ctx.fillStyle='rgba(0,0,0,0.5)'; roundRect(ctx,pgX,pgY,pgW,8,4); ctx.fill();
    ctx.fillStyle='#FFD700'; ctx.shadowColor='#FFD700'; ctx.shadowBlur=6;
    roundRect(ctx,pgX,pgY,pgW*(p.weaponIndex/(WEAPONS.length-1)),8,4); ctx.fill();
    ctx.shadowBlur=0;
    ctx.font='10px sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#556';
    ctx.fillText('GUN GAME PROGRESS', pgX, pgY-2);
    ctx.textAlign='right'; ctx.fillText(`${p.weaponIndex+1}/${WEAPONS.length}`, pgX+pgW, pgY-2);

    // Respawn overlay
    if (!p.alive) {
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.65)';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.textAlign='center';
      ctx.font='bold 52px "Rajdhani", sans-serif'; ctx.fillStyle='#F44336';
      ctx.shadowColor='#F44336'; ctx.shadowBlur=25;
      ctx.fillText('ELIMINATED', this.width/2, this.height/2-20);
      ctx.font='bold 26px "Rajdhani", sans-serif'; ctx.fillStyle='#FFD700';
      ctx.shadowColor='#FFD700'; ctx.shadowBlur=15;
      ctx.fillText(`Respawn in ${Math.ceil(p.respawnTimer)}s`, this.width/2, this.height/2+30);
      ctx.restore();
    }

    this.drawMiniLeaderboard(ctx);
  }

  drawMiniLeaderboard(ctx) {
    const entries = [...this.scores.values()].sort((a,b)=>b.score-a.score).slice(0,5);
    const x=this.width-320, y=this.height-195;
    ctx.save();
    ctx.fillStyle='rgba(8,12,25,0.75)';
    roundRect(ctx,x,y,300,140,8); ctx.fill();
    ctx.strokeStyle='#1E3A6E'; ctx.lineWidth=1;
    roundRect(ctx,x,y,300,140,8); ctx.stroke();
    ctx.font='bold 11px "Rajdhani", sans-serif'; ctx.fillStyle='#556'; ctx.textAlign='left';
    ctx.fillText('LEADERBOARD', x+12, y+18);
    entries.forEach((e,i)=>{
      const ey=y+34+i*22;
      const isP = e.name==='YOU';
      ctx.fillStyle = i===0?'#FFD700':isP?'#FF6400':'#CCC';
      ctx.font=`${isP?'bold':''} 13px "Rajdhani", sans-serif`;
      ctx.fillText(`#${i+1}  ${e.name}`, x+12, ey);
      ctx.textAlign='right'; ctx.fillText(`${e.score} pts`, x+288, ey); ctx.textAlign='left';
    });
    ctx.restore();
  }

  drawCrosshair(ctx) {
    const {x,y} = this.mouse;
    const size=12, gap=5;
    ctx.save();
    ctx.strokeStyle='rgba(255,255,255,0.88)'; ctx.lineWidth=1.5;
    ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=3;
    ctx.beginPath(); ctx.moveTo(x-size-gap,y); ctx.lineTo(x-gap,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+gap,y); ctx.lineTo(x+size+gap,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y-size-gap); ctx.lineTo(x,y-gap); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y+gap); ctx.lineTo(x,y+size+gap); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.fill();
    const spread = this.player.weapon.spread*80;
    if (spread>3) {
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(x,y,spread,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  showResults() {
    setTimeout(()=>{
      const entries=[...this.scores.values()].sort((a,b)=>b.score-a.score);
      window.gameShowResults(entries);
    }, 600);
  }

  resize(w,h) { this.width=w; this.height=h; }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
let gameInstance = null;
function startGame() {
  const canvas = document.getElementById('gameCanvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cursor = 'none';
  gameInstance = new Game(canvas);
  gameInstance.start();
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gameInstance) gameInstance.resize(canvas.width, canvas.height);
  });
}
