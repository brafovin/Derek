// ─── MATCHMAKING SCREEN ───────────────────────────────────────────────────────

let mmCanvas, mmCtx, mmAnimFrame;
let mmTime = 0;
let mmPhase = 'searching'; // 'searching' | 'found' | 'loading'
let mmPlayers = 1;
let mmWaitTime = 0;
let mmFoundTimer = 0;
let mmLoadTimer  = 0;
let mmDots = [];
let mmRings = [];
let mmParticles = [];
let mmMap = 'Erangel';
let mmMode = 'Classic';
let mmTarget = 100;     // total players for this match (depends on map)
let mmTeamSize = 4;     // your squad size
let mmFillAcc = 0;      // accumulator for smooth player fill

const MM_PLAYER_NAMES = ['Ghost','Viper','Blaze','Shadow','Storm','Reaper','Cobra'];
const MM_JOIN_MSGS = [
  'Spieler gefunden…','Verbinden…','Beigetreten!','Suche läuft…','Spieler beitritt…'
];
let mmLog = [];
let mmFoundNames = ['YOU'];
let mmBotJoinTimer = 0.8;
let mmBotIdx = 0;

function initMatchmaking(map, mode) {
  mmCanvas = document.getElementById('mmCanvas');
  mmCtx    = mmCanvas.getContext('2d');
  _mmResize();
  window.addEventListener('resize', _mmResize);

  mmTime = 0; mmPhase = 'searching';
  mmPlayers = 1; mmWaitTime = 0;
  mmFoundTimer = 0; mmLoadTimer = 0;
  mmFoundNames = ['YOU']; mmLog = [];
  mmBotJoinTimer = 0.8; mmBotIdx = 0;
  mmFillAcc = 0;
  mmMap  = map  || activeMap  || 'Erangel';
  mmMode = mode || activeMode || 'Classic';
  mmTarget   = (typeof getMatchPlayerCount === 'function') ? getMatchPlayerCount(mmMap) : 100;
  mmTeamSize = (typeof getTeamSize === 'function') ? getTeamSize() : 4;
  mmPlayers  = mmTeamSize; // you + your squad are already in

  // Decorative rings
  mmRings = [];
  for (let i = 0; i < 4; i++) {
    mmRings.push({ r: 60 + i * 50, phase: i * Math.PI * 0.5, speed: 0.3 + i * 0.1 });
  }
  // Floating particles
  mmParticles = [];
  for (let i = 0; i < 35; i++) {
    mmParticles.push({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: -0.00005 - Math.random() * 0.0001,
      size: 1 + Math.random() * 2.5,
      alpha: 0.1 + Math.random() * 0.25,
      color: Math.random() > 0.5 ? '#FF6400' : '#FFD700',
      phase: Math.random() * Math.PI * 2,
    });
  }

  mmAnimFrame = requestAnimationFrame(_mmLoop);
}

function stopMatchmaking() {
  cancelAnimationFrame(mmAnimFrame);
  window.removeEventListener('resize', _mmResize);
}

function _mmResize() {
  if (!mmCanvas) return;
  mmCanvas.width  = window.innerWidth;
  mmCanvas.height = window.innerHeight;
}

function _mmLoop() {
  mmAnimFrame = requestAnimationFrame(_mmLoop);
  const dt = 0.016;
  mmTime += dt;
  _mmUpdate(dt);
  _mmDraw(mmCtx, mmCanvas.width, mmCanvas.height);
}

function _mmUpdate(dt) {
  // Particles drift upward
  for (const p of mmParticles) {
    p.x += p.vx; p.y += p.vy; p.phase += dt;
    if (p.y < -0.05) p.y = 1.05;
    if (p.x < -0.02) p.x = 1.02;
    if (p.x >  1.02) p.x = -0.02;
  }

  if (mmPhase === 'searching') {
    mmWaitTime += dt;

    // Smoothly fill players up to the target over ~3.5 seconds (scales to 100)
    const joinRate = mmTarget / 3.5; // players per second
    mmFillAcc += joinRate * dt;
    while (mmFillAcc >= 1 && mmPlayers < mmTarget) {
      mmFillAcc -= 1;
      mmPlayers++;
    }

    // Occasional named-join log lines for flavour
    mmBotJoinTimer -= dt;
    if (mmPlayers < mmTarget && mmBotJoinTimer <= 0) {
      mmBotJoinTimer = 0.4 + Math.random() * 0.7;
      const name = MM_PLAYER_NAMES[mmBotIdx++ % MM_PLAYER_NAMES.length];
      if (mmFoundNames.length < mmTeamSize + 6) mmFoundNames.push(name);
      mmLog.unshift({ text: name + ' ' + MM_JOIN_MSGS[Math.floor(Math.random() * MM_JOIN_MSGS.length)], t: 2.0 });
    }
    for (const l of mmLog) l.t -= dt;
    mmLog = mmLog.filter(l => l.t > 0);

    if (mmPlayers >= mmTarget) {
      mmPlayers = mmTarget;
      mmPhase = 'found';
      mmFoundTimer = 2.2;
      mmLog = [];
    }
  } else if (mmPhase === 'found') {
    mmFoundTimer -= dt;
    if (mmFoundTimer <= 0) {
      mmPhase = 'loading';
      mmLoadTimer = 1.8;
    }
  } else if (mmPhase === 'loading') {
    mmLoadTimer -= dt;
    if (mmLoadTimer <= 0) {
      stopMatchmaking();
      showScreen('pregame-screen');
      initPregame();
    }
  }
}

function _mmDraw(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#04081a');
  bg.addColorStop(1, '#0a1228');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(255,100,0,0.04)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  // Floating particles
  for (const p of mmParticles) {
    ctx.save();
    ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const cx = W / 2, cy = H / 2 - 30;

  if (mmPhase === 'searching') {
    _drawSearching(ctx, cx, cy, W, H);
  } else if (mmPhase === 'found') {
    _drawFound(ctx, cx, cy, W, H);
  } else {
    _drawLoading(ctx, cx, cy, W, H);
  }

  // Mode + Map badge (top-left)
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  _roundRect(ctx, 20, 20, 200, 54, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,100,0,0.3)'; ctx.lineWidth = 1;
  _roundRect(ctx, 20, 20, 200, 54, 8); ctx.stroke();
  ctx.font = 'bold 14px "Rajdhani",sans-serif'; ctx.textAlign = 'left';
  ctx.fillStyle = '#FF6400'; ctx.fillText(mmMode.toUpperCase(), 36, 42);
  ctx.font = '12px "Rajdhani",sans-serif'; ctx.fillStyle = '#AAA';
  ctx.fillText('🗺  ' + mmMap, 36, 62);
  ctx.restore();

  // Cancel button (bottom center)
  if (mmPhase === 'searching') {
    const bw = 160, bh = 38;
    const bx = W / 2 - bw / 2, by = H - 70;
    ctx.save();
    ctx.fillStyle = 'rgba(30,10,10,0.8)';
    _roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,50,50,0.35)'; ctx.lineWidth = 1;
    _roundRect(ctx, bx, by, bw, bh, 8); ctx.stroke();
    ctx.font = 'bold 14px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#FF5555'; ctx.fillText('✕  ABBRECHEN', bx + bw / 2, by + 24);
    ctx.restore();
    // Store button hit area for click handler
    mmCanvas._cancelBtn = { x: bx, y: by, w: bw, h: bh };
  }
}

function _drawSearching(ctx, cx, cy, W, H) {
  // Spinning radar rings
  for (const ring of mmRings) {
    ring.phase += 0.016 * ring.speed;
    ctx.save();
    ctx.strokeStyle = `rgba(255,100,0,${0.08 + 0.05 * Math.sin(ring.phase)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2); ctx.stroke();
    // Rotating dot on ring
    const dotX = cx + Math.cos(ring.phase * 2) * ring.r;
    const dotY = cy + Math.sin(ring.phase * 2) * ring.r;
    ctx.fillStyle = `rgba(255,180,0,${0.5 + 0.5 * Math.sin(ring.phase * 3)})`;
    ctx.beginPath(); ctx.arc(dotX, dotY, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Center radar sweep
  ctx.save();
  ctx.translate(cx, cy);
  const sweep = mmTime * 1.5;
  const grad = ctx.createConicalGradient
    ? ctx.createConicalGradient(0, 0, sweep)
    : null;
  // Fallback: arc sweep
  ctx.strokeStyle = 'rgba(255,100,0,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 130, sweep, sweep + Math.PI * 0.35);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,100,0,0.05)'; ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Center circle
  ctx.save();
  const pulse = 1 + 0.06 * Math.sin(mmTime * 4);
  ctx.shadowColor = '#FF6400'; ctx.shadowBlur = 30;
  ctx.strokeStyle = '#FF6400'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 28 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,100,0,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, 28 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Crosshair
  ctx.strokeStyle = '#FF6400'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();
  ctx.restore();

  // "SUCHE SPIEL" text
  ctx.font = 'bold 28px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#FFF';
  ctx.shadowColor = '#FF6400'; ctx.shadowBlur = 12;
  const dots = '.'.repeat(Math.floor(mmTime * 2) % 4);
  ctx.fillText('SUCHE SPIEL' + dots, cx, cy + 70);
  ctx.shadowBlur = 0;

  // Wait time
  const mins = Math.floor(mmWaitTime / 60);
  const secs = Math.floor(mmWaitTime % 60);
  ctx.font = '16px "Rajdhani",sans-serif'; ctx.fillStyle = '#666';
  ctx.fillText(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`, cx, cy + 98);

  // ── Player count (big) ──
  const countY = cy + 124;
  ctx.font = 'bold 30px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#4FC3F7';
  ctx.shadowColor = '#4FC3F7'; ctx.shadowBlur = 10;
  ctx.fillText(`${mmPlayers}`, cx - 26, countY);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#445'; ctx.font = 'bold 22px "Rajdhani",sans-serif';
  ctx.fillText(`/ ${mmTarget}`, cx + 34, countY);
  ctx.font = '11px "Rajdhani",sans-serif'; ctx.fillStyle = '#556';
  ctx.fillText('SPIELER IM MATCH', cx, countY + 18);

  // ── Fill progress bar ──
  const barW = Math.min(360, W - 80), barH = 8;
  const bx = cx - barW / 2, by = countY + 30;
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; _roundRect(ctx, bx, by, barW, barH, 4); ctx.fill();
  const frac = Math.min(1, mmPlayers / mmTarget);
  const fg = ctx.createLinearGradient(bx, by, bx + barW, by);
  fg.addColorStop(0, '#FF6400'); fg.addColorStop(1, '#FFD700');
  ctx.fillStyle = fg; _roundRect(ctx, bx, by, Math.max(barH, barW * frac), barH, 4); ctx.fill();

  // ── Your team row ──
  const teamLabelY = by + 34;
  ctx.font = '11px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#556';
  const teamLabels = { 1:'SOLO', 2:'DUO', 3:'TRIO', 4:'SQUAD' };
  ctx.fillText(`DEIN TEAM — ${teamLabels[mmTeamSize] || 'SQUAD'}`, cx, teamLabelY);

  const slotSize = 44, tGap = 10;
  const teamW = mmTeamSize * (slotSize + tGap) - tGap;
  const tgx = cx - teamW / 2;
  const tgy = teamLabelY + 10;
  for (let i = 0; i < mmTeamSize; i++) {
    const sx = tgx + i * (slotSize + tGap);
    const isYou = i === 0;
    ctx.save();
    ctx.fillStyle = isYou ? 'rgba(255,100,0,0.25)' : 'rgba(79,195,247,0.15)';
    ctx.shadowColor = isYou ? '#FF6400' : '#4FC3F7'; ctx.shadowBlur = 8;
    _roundRect(ctx, sx, tgy, slotSize, slotSize, 6); ctx.fill();
    ctx.strokeStyle = isYou ? '#FF6400' : '#4FC3F7'; ctx.lineWidth = 1.5;
    _roundRect(ctx, sx, tgy, slotSize, slotSize, 6); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(isYou ? '😎' : '🙂', sx + slotSize / 2, tgy + slotSize / 2 + 7);
    if (isYou) {
      ctx.font = 'bold 9px "Rajdhani",sans-serif'; ctx.fillStyle = '#FF6400';
      ctx.fillText('DU', sx + slotSize / 2, tgy + slotSize - 4);
    }
    ctx.restore();
  }

  // Log messages
  mmLog.slice(0, 3).forEach((l, i) => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, l.t / 0.5) * 0.7;
    ctx.font = '11px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#4FC3F7';
    ctx.fillText(l.text, cx, tgy + slotSize + 22 + i * 15);
    ctx.restore();
  });
}

function _drawFound(ctx, cx, cy, W, H) {
  // Flash effect
  const t = 1 - mmFoundTimer / 2.2;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.3 - t * 0.3);
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Expanding ring burst
  for (let r = 0; r < 3; r++) {
    const ringR = 40 + t * 180 + r * 50;
    const alpha = Math.max(0, 0.6 - t * 0.6 - r * 0.15);
    ctx.save();
    ctx.strokeStyle = `rgba(76,175,80,${alpha})`;
    ctx.lineWidth = 3 - r;
    ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Big checkmark / "MATCH GEFUNDEN"
  ctx.save();
  ctx.shadowColor = '#4CAF50'; ctx.shadowBlur = 40;
  ctx.font = 'bold 48px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#4CAF50';
  ctx.fillText('✓  MATCH GEFUNDEN!', cx, cy + 20);
  ctx.shadowBlur = 0;
  ctx.font = '18px "Rajdhani",sans-serif'; ctx.fillStyle = '#AAA';
  ctx.fillText(`${mmTarget} Spieler • ${mmMode} • ${mmMap}`, cx, cy + 56);
  ctx.restore();

  // Your team name row
  const teamNames = mmFoundNames.slice(0, mmTeamSize);
  const nameW = Math.min(80, (W - 80) / Math.max(1, teamNames.length));
  teamNames.forEach((name, i) => {
    const nx = (W - teamNames.length * (nameW + 4)) / 2 + i * (nameW + 4);
    const ny = cy + 100;
    ctx.save();
    ctx.fillStyle = name === 'YOU' ? 'rgba(255,100,0,0.25)' : 'rgba(79,195,247,0.12)';
    _roundRect(ctx, nx, ny, nameW, 30, 5); ctx.fill();
    ctx.strokeStyle = name === 'YOU' ? '#FF6400' : '#4FC3F7';
    ctx.lineWidth = 1; _roundRect(ctx, nx, ny, nameW, 30, 5); ctx.stroke();
    ctx.font = 'bold 10px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#EEE';
    ctx.fillText(name.slice(0, 6), nx + nameW / 2, ny + 19);
    ctx.restore();
  });
}

function _drawLoading(ctx, cx, cy, W, H) {
  const t = 1 - mmLoadTimer / 1.8;

  ctx.font = 'bold 32px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#FFF';
  ctx.fillText('LADE SPIEL…', cx, cy + 20);

  // Loading bar
  const bw = 320, bh = 8;
  const bx = cx - bw / 2, by = cy + 50;
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; _roundRect(ctx, bx, by, bw, bh, 4); ctx.fill();
  const fill = ctx.createLinearGradient(bx, by, bx + bw * t, by);
  fill.addColorStop(0, '#FF6400'); fill.addColorStop(1, '#FFD700');
  ctx.fillStyle = fill;
  _roundRect(ctx, bx, by, bw * Math.min(1, t + 0.05), bh, 4); ctx.fill();

  ctx.font = '14px "Rajdhani",sans-serif'; ctx.fillStyle = '#666';
  ctx.fillText(`${Math.floor(t * 100)}%`, cx, by + 28);
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Click handler for cancel button
function setupMatchmakingInput() {
  mmCanvas.addEventListener('click', e => {
    const r = mmCanvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (mmCanvas.width / r.width);
    const my = (e.clientY - r.top)  * (mmCanvas.height / r.height);
    const btn = mmCanvas._cancelBtn;
    if (btn && mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      stopMatchmaking();
      showScreen('lobby-screen');
      initLobby();
    }
  });
}
