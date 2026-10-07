// ─── EFFECTS & PARTICLES ──────────────────────────────────────────────────────

class ParticleSystem {
  constructor() { this.particles = []; }

  emit(x, y, options = {}) {
    const count   = options.count  || 8;
    const color   = options.color  || '#FFE566';
    const speed   = options.speed  || 150;
    const life    = options.life   || 0.5;
    const size    = options.size   || 3;
    const spread  = options.spread !== undefined ? options.spread : Math.PI * 2;
    const dir     = options.dir    || 0;
    const gravity = options.gravity || 0;
    const shape   = options.shape  || 'circle'; // 'circle' | 'shard'

    for (let i = 0; i < count; i++) {
      const angle = dir - spread / 2 + Math.random() * spread;
      const spd   = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life, maxLife: life,
        size: size * (0.5 + Math.random()),
        color, gravity, alpha: 1, shape,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 5,
      });
    }
  }

  emitBlood(x, y, dir) {
    this.emit(x, y, { count: 14, color: '#CC0000', speed: 220, life: 0.6, size: 4, spread: Math.PI * 0.7, dir, gravity: 320 });
    this.emit(x, y, { count: 6,  color: '#880000', speed: 110, life: 0.9, size: 6, spread: Math.PI,       dir, gravity: 200 });
  }

  emitMuzzleFlash(x, y, dir, special) {
    if (special === 'ice') {
      this.emit(x, y, { count: 8,  color: '#A8D8EA', speed: 280, life: 0.12, size: 5, spread: 0.5, dir, shape: 'shard' });
      this.emit(x, y, { count: 5,  color: '#E3F2FD', speed: 180, life: 0.15, size: 7, spread: 0.7, dir });
    } else if (special === 'fire') {
      this.emit(x, y, { count: 8,  color: '#FF4500', speed: 320, life: 0.12, size: 6, spread: 0.6, dir });
      this.emit(x, y, { count: 5,  color: '#FFD700', speed: 200, life: 0.10, size: 8, spread: 0.5, dir });
    } else {
      this.emit(x, y, { count: 6,  color: '#FFFDE7', speed: 300, life: 0.08, size: 5, spread: 0.4, dir });
      this.emit(x, y, { count: 4,  color: '#FF8F00', speed: 200, life: 0.10, size: 7, spread: 0.6, dir });
    }
  }

  emitExplosion(x, y) {
    this.emit(x, y, { count: 30, color: '#FF6B35', speed: 350, life: 0.8,  size: 8,  spread: Math.PI * 2 });
    this.emit(x, y, { count: 20, color: '#FFE66D', speed: 250, life: 0.6,  size: 6,  spread: Math.PI * 2 });
    this.emit(x, y, { count: 15, color: '#888',    speed: 180, life: 1.0,  size: 5,  spread: Math.PI * 2, gravity: 150 });
  }

  emitSparks(x, y, dir) {
    this.emit(x, y, { count: 5, color: '#FFD700', speed: 250, life: 0.3, size: 2, spread: Math.PI * 0.4, dir });
  }

  emitImpact(x, y, dir) {
    this.emit(x, y, { count: 6, color: '#DDD', speed: 120, life: 0.25, size: 3, spread: Math.PI * 0.5, dir, gravity: 100 });
  }

  emitIceShard(x, y) {
    this.emit(x, y, { count: 10, color: '#A8D8EA', speed: 160, life: 0.5, size: 4, spread: Math.PI*2, shape: 'shard' });
    this.emit(x, y, { count: 6,  color: '#E3F2FD', speed: 100, life: 0.7, size: 6, spread: Math.PI*2 });
  }

  emitTireSmoke(x, y) {
    this.emit(x, y, { count: 2, color: '#888', speed: 30, life: 0.8, size: 8, spread: Math.PI*2, gravity: -20 });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 0.97; p.vy *= 0.97;
      p.rot += p.rotV * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 4;
      if (p.shape === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.5);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

// ─── Kill Feed ────────────────────────────────────────────────────────────────
class KillFeed {
  constructor() { this.entries = []; }

  add(killer, victim, weapon, isPlayerKill) {
    this.entries.unshift({ killer, victim, weapon, isPlayerKill, life: 5.0, maxLife: 5.0 });
    if (this.entries.length > 6) this.entries.pop();
  }

  update(dt) {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      this.entries[i].life -= dt;
      if (this.entries[i].life <= 0) this.entries.splice(i, 1);
    }
  }

  draw(ctx, canvasW) {
    const baseX = canvasW - 320;
    let y = 80;
    for (const e of this.entries) {
      const alpha   = Math.min(1, e.life);
      const slideX  = (1 - Math.min(1, (e.maxLife - e.life) / 0.3)) * 60;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(baseX + slideX, y);
      ctx.fillStyle = e.isPlayerKill ? 'rgba(255,100,0,0.88)' : 'rgba(18,18,35,0.88)';
      roundRect(ctx, 0, 0, 300, 36, 8); ctx.fill();
      ctx.strokeStyle = e.isPlayerKill ? '#FF6400' : '#334';
      ctx.lineWidth = 1;
      roundRect(ctx, 0, 0, 300, 36, 8); ctx.stroke();
      ctx.fillStyle = e.isPlayerKill ? '#FFE566' : '#EEE';
      ctx.font = 'bold 13px "Rajdhani", sans-serif';
      ctx.fillText(e.killer, 10, 23);
      ctx.fillStyle = '#aaa';
      ctx.font = '11px sans-serif';
      const kw = ctx.measureText(e.killer).width;
      ctx.fillText(`[${e.weapon}]`, 10 + kw + 6, 23);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Rajdhani", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(e.victim, 290, 23);
      ctx.restore();
      y += 44;
    }
  }
}

// ─── Screen Shake ─────────────────────────────────────────────────────────────
class ScreenShake {
  constructor() { this.intensity = 0; this.duration = 0; this.offsetX = 0; this.offsetY = 0; }
  add(intensity, duration) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration  = Math.max(this.duration,  duration);
  }
  update(dt) {
    if (this.duration > 0) {
      this.duration -= dt;
      this.offsetX   = (Math.random() - 0.5) * this.intensity * 2;
      this.offsetY   = (Math.random() - 0.5) * this.intensity * 2;
      this.intensity *= 0.88;
    } else { this.offsetX = 0; this.offsetY = 0; }
  }
}

// ─── Floating Texts ───────────────────────────────────────────────────────────
class FloatingTexts {
  constructor() { this.items = []; }
  add(x, y, text, color = '#FFE566', size = 16) {
    this.items.push({ x, y, text, color, size, life: 1.2, maxLife: 1.2, vy: -80 });
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const t = this.items[i];
      t.y += t.vy * dt; t.vy *= 0.95; t.life -= dt;
      if (t.life <= 0) this.items.splice(i, 1);
    }
  }
  draw(ctx, camX, camY) {
    for (const t of this.items) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life / 0.4);
      ctx.font = `bold ${t.size}px "Rajdhani", sans-serif`;
      ctx.fillStyle   = t.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth   = 3;
      ctx.textAlign   = 'center';
      ctx.strokeText(t.text, t.x - camX, t.y - camY);
      ctx.fillText(t.text,   t.x - camX, t.y - camY);
      ctx.restore();
    }
  }
}

// ─── Elimination Popup ────────────────────────────────────────────────────────
class EliminationPopup {
  constructor() { this.active = false; this.text = ''; this.sub = ''; this.life = 0; this.color = '#FF6400'; }
  show(text, sub, color = '#FF6400') { this.active = true; this.text = text; this.sub = sub; this.life = 2.5; this.color = color; }
  update(dt) { if (this.active) { this.life -= dt; if (this.life <= 0) this.active = false; } }
  draw(ctx, w, h) {
    if (!this.active) return;
    const scale = this.life > 2.3 ? 1 + (2.5 - this.life) * 3 : 1;
    const alpha = Math.min(1, this.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2, h / 2 - 60);
    ctx.scale(scale, scale);
    ctx.shadowColor = this.color; ctx.shadowBlur = 30;
    ctx.font = 'bold 42px "Rajdhani", sans-serif';
    ctx.fillStyle   = this.color;
    ctx.textAlign   = 'center';
    ctx.fillText(this.text, 0, 0);
    ctx.shadowBlur  = 10;
    ctx.font = 'bold 20px "Rajdhani", sans-serif';
    ctx.fillStyle = '#FFF';
    ctx.fillText(this.sub, 0, 30);
    ctx.restore();
  }
}

// ─── Weapon Level Up ──────────────────────────────────────────────────────────
class WeaponLevelUp {
  constructor() { this.active = false; this.weaponName = ''; this.life = 0; }
  show(weaponName) { this.active = true; this.weaponName = weaponName; this.life = 2.0; }
  update(dt) { if (this.active) { this.life -= dt; if (this.life <= 0) this.active = false; } }
  draw(ctx, w, h) {
    if (!this.active) return;
    const alpha = Math.min(1, this.life / 0.4) * Math.min(1, this.life);
    const y = h - 120 - (1 - Math.min(1, (2.0 - this.life) / 0.4)) * 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2, y);
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
    ctx.font = 'bold 14px "Rajdhani", sans-serif';
    ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
    ctx.fillText('WEAPON UPGRADE', 0, -16);
    ctx.font = 'bold 28px "Rajdhani", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`▶  ${this.weaponName}  ◀`, 0, 12);
    ctx.restore();
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
