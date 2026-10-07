// ─── PRE-GAME LOBBY ───────────────────────────────────────────────────────────

let pgCanvas, pgCtx, pgAnimFrame, pgTime = 0;
let pgPlayers = [];
let pgPhase   = 'waiting'; // 'waiting' | 'countdown' | 'starting'
let pgCountdown = 5;
let pgBotJoinTimer = 0;
let pgBotIndex = 0;
let pgAllReady = false;
let pgCountdownTimer = 0;
let pgChatMessages = [];
let pgTeamSize = 4;
let pgTotalPlayers = 100;
const BOT_JOIN_NAMES = ['Ghost','Viper','Blaze','Shadow','Storm','Reaper','Cobra'];
const BOT_JOIN_MSGS  = [
  'Ready to frag!', 'Lets go!', 'No mercy today', 'GG EZ', 'Lets do this',
  '100 HP wont save you', 'Top kill incoming', 'Watch your six',
];

function initPregame() {
  pgCanvas = document.getElementById('pgCanvas');
  pgCtx    = pgCanvas.getContext('2d');
  resizePgCanvas();
  window.addEventListener('resize', resizePgCanvas);

  pgTeamSize     = (typeof getTeamSize === 'function') ? getTeamSize() : 4;
  pgTotalPlayers = (typeof getMatchPlayerCount === 'function') ? getMatchPlayerCount() : 100;
  pgPhase = 'waiting';

  // Add local player immediately
  pgPlayers = [{
    id: 'player', name: 'YOU', ready: false, isBot: false,
    skin: CHARACTER_SKINS[playerSkins.character],
    joinTime: 0, waveAnim: 0,
  }];
  pgBotJoinTimer = 0.8; // first teammate joins shortly
  pgBotIndex = 0;
  pgChatMessages = [];

  pgAnimFrame = requestAnimationFrame(pgLoop);
  setupPgButtons();
}

function resizePgCanvas() {
  if (!pgCanvas) return;
  pgCanvas.width  = window.innerWidth;
  pgCanvas.height = window.innerHeight;
}

function pgLoop(now) {
  pgAnimFrame = requestAnimationFrame(pgLoop);
  const dt = 0.016;
  pgTime += dt;
  pgUpdate(dt);
  pgDraw(pgCtx, pgCanvas.width, pgCanvas.height);
}

function stopPregame() { cancelAnimationFrame(pgAnimFrame); }

function pgUpdate(dt) {
  // Teammate bots joining — only fill up to your team size
  if (pgBotIndex < pgTeamSize - 1) {
    pgBotJoinTimer -= dt;
    if (pgBotJoinTimer <= 0) {
      const name = BOT_JOIN_NAMES[pgBotIndex];
      pgPlayers.push({
        id: `bot${pgBotIndex}`, name, ready: false, isBot: true,
        skin: CHARACTER_SKINS[Math.floor(Math.random()*CHARACTER_SKINS.length)],
        joinTime: pgTime, waveAnim: 1.0,
      });
      pgAddChat(name, BOT_JOIN_MSGS[Math.floor(Math.random()*BOT_JOIN_MSGS.length)]);
      pgBotIndex++;
      pgBotJoinTimer = 0.6 + Math.random() * 1.0;

      // Bots auto-ready after joining
      setTimeout(() => {
        const b = pgPlayers.find(p => p.name === name);
        if (b) b.ready = true;
        checkAllReady();
      }, (800 + Math.random() * 1500));
    }
  }

  // Wave animation decay
  for (const p of pgPlayers) {
    if (p.waveAnim > 0) p.waveAnim -= dt * 2;
  }

  // Countdown
  if (pgPhase === 'countdown') {
    pgCountdownTimer -= dt;
    pgCountdown = Math.ceil(pgCountdownTimer);
    if (pgCountdownTimer <= 0) {
      pgPhase = 'starting';
      setTimeout(() => { stopPregame(); showScreen('game-screen'); startGame(); }, 400);
    }
  }
}

function checkAllReady() {
  if (pgPhase !== 'waiting') return;
  const localPlayer = pgPlayers.find(p => !p.isBot);
  if (!localPlayer?.ready) return;
  const allBots = pgPlayers.filter(p => p.isBot);
  const needBots = pgTeamSize - 1;   // Solo = 0, Squad = 3
  if (allBots.length >= needBots && allBots.every(p => p.ready)) {
    pgPhase = 'countdown';
    pgCountdownTimer = 5;
    pgAddChat('SYSTEM', 'Team bereit! Match startet...');
  }
}

function pgAddChat(name, msg) {
  pgChatMessages.unshift({ name, msg, life: 8, isSystem: name === 'SYSTEM' });
  if (pgChatMessages.length > 5) pgChatMessages.pop();
}

function setupPgButtons() {
  const readyBtn = document.getElementById('pg-ready-btn');
  if (readyBtn) {
    readyBtn.addEventListener('click', () => {
      const lp = pgPlayers.find(p => !p.isBot);
      if (!lp) return;
      lp.ready = !lp.ready;
      readyBtn.textContent = lp.ready ? '✔ BEREIT' : 'BEREIT MACHEN';
      readyBtn.style.background = lp.ready
        ? 'linear-gradient(135deg,#2E7D32,#1B5E20)'
        : 'linear-gradient(135deg,#FF7D00,#CC4400)';
      checkAllReady();
    });
  }
}

// ─── PRE-GAME DRAW ────────────────────────────────────────────────────────────
function pgDraw(ctx, W, H) {
  // Background
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0, '#06080F'); bg.addColorStop(1, '#0A1020');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Grid
  ctx.strokeStyle = 'rgba(40,60,120,0.07)'; ctx.lineWidth=1;
  for (let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for (let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Scanlines
  ctx.fillStyle='rgba(0,0,0,0.035)';
  for(let y=0;y<H;y+=4) ctx.fillRect(0,y,W,2);

  // Glow circles (ambient)
  for (let i=0;i<3;i++){
    const a=pgTime*0.15+i*2.1;
    const gx=W*0.25+Math.cos(a)*W*0.1, gy=H*0.5+Math.sin(a*0.7)*H*0.15;
    const gr=ctx.createRadialGradient(gx,gy,0,gx,gy,200);
    gr.addColorStop(0,`rgba(${i===0?'255,100,0':i===1?'0,150,255':'120,0,200'},0.04)`);
    gr.addColorStop(1,'transparent');
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
  }

  // Title
  ctx.save();
  ctx.textAlign='center';
  ctx.font='bold 52px "Rajdhani", sans-serif';
  ctx.shadowColor='#FF6400'; ctx.shadowBlur=20;
  ctx.fillStyle='#FF6400';
  ctx.fillText('GUN ZONE', W/2, 70);
  ctx.font='14px "Rajdhani", sans-serif';
  ctx.shadowColor='#4FC3F7'; ctx.shadowBlur=8;
  ctx.fillStyle='#4FC3F7';
  const _teamLabel = {1:'SOLO',2:'DUO',3:'TRIO',4:'SQUAD'}[pgTeamSize] || 'SQUAD';
  ctx.fillText(`BATTLE ROYALE  •  ${_teamLabel}  •  ${pgTotalPlayers} SPIELER  •  30 MIN`, W/2, 95);
  ctx.restore();

  // ── Player Slots (your team) ──
  const totalSlots = pgTeamSize;
  const slotW = Math.min(160, (W-120)/Math.max(1,totalSlots));
  const slotH = 200;
  const slotsX = W/2 - (totalSlots*slotW)/2 + slotW/2;
  const slotY  = H*0.18;

  for (let i=0; i<totalSlots; i++){
    const p = pgPlayers[i];
    const sx = slotsX + i*slotW;
    drawPlayerSlot(ctx, sx, slotY, slotW-10, slotH, p, i);
  }

  // ── Match Info panel ──
  const miX = W*0.3, miY = H*0.58, miW = W*0.4, miH = 130;
  ctx.fillStyle='rgba(12,18,38,0.85)';
  roundRect(ctx,miX,miY,miW,miH,12); ctx.fill();
  ctx.strokeStyle='rgba(50,80,150,0.4)'; ctx.lineWidth=1;
  roundRect(ctx,miX,miY,miW,miH,12); ctx.stroke();

  ctx.save();
  ctx.textAlign='center';
  ctx.font='bold 13px "Rajdhani", sans-serif'; ctx.fillStyle='#556';
  ctx.fillText('MATCH INFORMATION', miX+miW/2, miY+20);

  const teamLabel = {1:'Solo',2:'Duo',3:'Trio',4:'Squad'}[pgTeamSize] || 'Squad';
  const infos=[
    ['Modus', (typeof activeMode!=='undefined'?activeMode:'Classic') + ' — ' + teamLabel],
    ['Map', (typeof activeMap!=='undefined'?activeMap:'Erangel')],
    ['Dauer','30 Minuten'],
    ['Spieler', pgTotalPlayers + ' im Match'],
    ['Ziel','Als Letzter überleben'],
  ];
  infos.forEach(([label,val],i)=>{
    ctx.textAlign='left'; ctx.font='11px sans-serif'; ctx.fillStyle='#556';
    ctx.fillText(label, miX+18, miY+40+i*18);
    ctx.textAlign='right'; ctx.font='bold 12px "Rajdhani", sans-serif'; ctx.fillStyle='#CCC';
    ctx.fillText(val, miX+miW-18, miY+40+i*18);
  });
  ctx.restore();

  // ── Weapon Rotation Preview ──
  const wrX=W*0.05, wrY=H*0.58, wrW=W*0.22;
  ctx.fillStyle='rgba(12,18,38,0.85)';
  roundRect(ctx,wrX,wrY,wrW,130,12); ctx.fill();
  ctx.strokeStyle='rgba(50,80,150,0.4)'; ctx.lineWidth=1;
  roundRect(ctx,wrX,wrY,wrW,130,12); ctx.stroke();
  ctx.font='bold 12px "Rajdhani", sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#556';
  ctx.fillText('WEAPON ROTATION', wrX+14, wrY+20);
  WEAPONS.forEach((w,i)=>{
    const wx=wrX+14+(i%5)*(wrW-28)/5;
    const wy=wrY+36+Math.floor(i/5)*40;
    ctx.fillStyle=i===0?'rgba(255,100,0,0.3)':'rgba(20,30,60,0.5)';
    roundRect(ctx,wx,wy,34,28,4); ctx.fill();
    ctx.font='bold 9px "Rajdhani", sans-serif'; ctx.textAlign='center'; ctx.fillStyle=w.color;
    ctx.shadowColor=w.color; ctx.shadowBlur=i===0?8:0;
    ctx.fillText(w.icon,wx+17,wy+18); ctx.shadowBlur=0;
  });

  // ── Iceberg M4 badge ──
  const sk=WEAPON_SKINS['iceberg_m4'];
  ctx.save();
  ctx.fillStyle='rgba(0,120,180,0.25)';
  roundRect(ctx,wrX+14,wrY+95,wrW-28,26,4); ctx.fill();
  ctx.strokeStyle='#A8D8EA'; ctx.lineWidth=1;
  roundRect(ctx,wrX+14,wrY+95,wrW-28,26,4); ctx.stroke();
  ctx.font='bold 11px "Rajdhani", sans-serif'; ctx.textAlign='center';
  ctx.fillStyle='#A8D8EA'; ctx.shadowColor='#00BCD4'; ctx.shadowBlur=8;
  ctx.fillText('❄ ICEBERG M4 – Aktiv', wrX+14+(wrW-28)/2, wrY+113);
  ctx.restore();

  // ── Weapon Skins preview ──
  const wsX=W*0.73, wsY=H*0.58, wsW=W*0.22;
  ctx.fillStyle='rgba(12,18,38,0.85)';
  roundRect(ctx,wsX,wsY,wsW,130,12); ctx.fill();
  ctx.strokeStyle='rgba(50,80,150,0.4)'; ctx.lineWidth=1;
  roundRect(ctx,wsX,wsY,wsW,130,12); ctx.stroke();
  ctx.font='bold 12px "Rajdhani", sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#556';
  ctx.fillText('DEIN LOADOUT', wsX+14, wsY+20);

  const selChar=CHARACTER_SKINS[playerSkins.character];
  const selSkin=WEAPON_SKINS[playerSkins.weapon];
  ctx.fillStyle=selChar.body;
  ctx.beginPath(); ctx.arc(wsX+34, wsY+65, 22, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle=selChar.accent; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle=selChar.helmet;
  ctx.beginPath(); ctx.arc(wsX+34, wsY+65, 14, 0, Math.PI*2); ctx.fill();
  ctx.font='bold 12px "Rajdhani", sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#EEE';
  ctx.fillText(selChar.name, wsX+65, wsY+60);
  ctx.font='11px "Rajdhani", sans-serif'; ctx.fillStyle='#778';
  ctx.fillText(`Skin: ${selSkin.name}`, wsX+65, wsY+78);
  selSkin.colors.forEach((c,ci)=>{
    ctx.fillStyle=c;
    if(selSkin.glow){ctx.shadowColor=selSkin.glow;ctx.shadowBlur=5;}
    ctx.fillRect(wsX+65+ci*20, wsY+88, 16, 10);
    ctx.shadowBlur=0;
  });

  // ── Chat / Status ──
  const chatX=W/2-160, chatY=H*0.78;
  pgChatMessages.forEach((msg,i)=>{
    const alpha=Math.min(1, msg.life/2);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.font=msg.isSystem?'bold 12px "Rajdhani",sans-serif':'12px sans-serif';
    ctx.textAlign='center';
    ctx.fillStyle=msg.isSystem?'#4FC3F7':'#AAA';
    const txt = msg.isSystem?`⚡ ${msg.msg}`:`${msg.name}: ${msg.msg}`;
    ctx.fillText(txt, W/2, chatY+i*20);
    ctx.restore();
  });

  // ── Phase display ──
  if (pgPhase==='countdown') {
    ctx.save();
    ctx.textAlign='center';
    const pulse=Math.sin(pgTime*Math.PI*2)*0.15+0.85;
    ctx.font=`bold ${Math.round(72*pulse)}px "Rajdhani", sans-serif`;
    ctx.shadowColor='#FFD700'; ctx.shadowBlur=40;
    ctx.fillStyle='#FFD700';
    ctx.fillText(`${Math.max(1,pgCountdown)}`, W/2, H*0.93);
    ctx.font='bold 18px "Rajdhani", sans-serif'; ctx.shadowBlur=10;
    ctx.fillStyle='#FFF';
    ctx.fillText('MATCH STARTET IN', W/2, H*0.93-60);
    ctx.restore();
  }
}

function drawPlayerSlot(ctx, cx, y, slotW, slotH, player, index) {
  const occupied = !!player;
  ctx.save();

  // Slot background
  if (occupied) {
    ctx.fillStyle = player.isBot ? 'rgba(15,25,50,0.85)' : 'rgba(30,50,100,0.9)';
  } else {
    ctx.fillStyle = 'rgba(10,15,30,0.5)';
  }
  roundRect(ctx, cx-slotW/2, y, slotW, slotH, 10);
  ctx.fill();

  if (occupied && player.ready) {
    ctx.strokeStyle='#4CAF50'; ctx.lineWidth=2;
    ctx.shadowColor='#4CAF50'; ctx.shadowBlur=8;
  } else if (occupied) {
    ctx.strokeStyle = player.isBot?'rgba(50,80,150,0.5)':'#FF6400';
    ctx.lineWidth   = player.isBot?1:2;
    ctx.shadowBlur=0;
  } else {
    ctx.strokeStyle='rgba(30,50,80,0.3)'; ctx.lineWidth=1;
  }
  roundRect(ctx, cx-slotW/2, y, slotW, slotH, 10);
  ctx.stroke();
  ctx.shadowBlur=0;

  if (!occupied) {
    // Empty slot
    ctx.font='bold 13px "Rajdhani", sans-serif'; ctx.textAlign='center';
    ctx.fillStyle='rgba(50,80,130,0.5)';
    ctx.fillText(`SLOT ${index+1}`, cx, y+slotH/2+5);
    ctx.font='11px sans-serif'; ctx.fillStyle='#223';
    ctx.fillText('Waiting...', cx, y+slotH/2+22);
    ctx.restore();
    return;
  }

  // Wave-in animation
  const wave=Math.max(0, player.waveAnim);
  ctx.globalAlpha=1-wave*0.3;

  // ── Mini Human Character ──
  const charY = y + slotH*0.4;
  const scale  = 1.4;
  ctx.save();
  ctx.translate(cx, charY);
  ctx.scale(scale, scale);
  const skin=player.skin;

  // Shadow
  ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,28,12,5,0,0,Math.PI*2); ctx.fill(); ctx.restore();

  // Legs
  ctx.fillStyle=skin.pants;
  ctx.beginPath(); ctx.roundRect(-8,10,7,18,2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(1,10,7,18,2); ctx.fill();
  // Boots
  ctx.fillStyle=skin.boots;
  ctx.beginPath(); ctx.roundRect(-9,24,9,7,2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(0,24,9,7,2); ctx.fill();

  // Torso
  ctx.fillStyle=skin.shirt;
  ctx.beginPath(); ctx.ellipse(0,0,10,13,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=skin.vest; ctx.globalAlpha=0.8;
  ctx.beginPath(); ctx.ellipse(0,0,8,11,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  // Arms
  ctx.fillStyle=skin.face;
  ctx.beginPath(); ctx.roundRect(-16,-4,8,7,2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(8,-4,8,7,2); ctx.fill();

  // Head
  ctx.fillStyle=skin.face;
  ctx.beginPath(); ctx.arc(0,-20,9,0,Math.PI*2); ctx.fill();
  // Helmet
  ctx.fillStyle=skin.helmet;
  ctx.beginPath(); ctx.arc(0,-20,9,Math.PI,0,false); ctx.fill();
  ctx.fillRect(-9,-24,18,5);
  // Accent
  ctx.fillStyle=skin.accent;
  ctx.fillRect(-9,-22,18,3);
  // Eyes
  ctx.fillStyle='#FFF';
  ctx.beginPath(); ctx.ellipse(3,-19,2.5,2,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-3,-19,2.5,2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.arc(4,-19,1.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-2,-19,1.2,0,Math.PI*2); ctx.fill();

  // You = glowing outline
  if (!player.isBot) {
    ctx.strokeStyle='rgba(255,180,0,0.6)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,-20,11,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,0,12,15,0,0,Math.PI*2); ctx.stroke();
  }

  ctx.restore(); // end scale/translate

  // Name
  ctx.font=`bold 13px "Rajdhani", sans-serif`;
  ctx.textAlign='center'; ctx.fillStyle = player.isBot?'#CCC':'#FFD700';
  ctx.fillText(player.name, cx, y+slotH*0.75);

  // Status badge
  const badgeY=y+slotH*0.82;
  ctx.fillStyle = player.ready?'rgba(30,100,30,0.8)':'rgba(80,40,10,0.8)';
  roundRect(ctx, cx-35, badgeY, 70, 18, 4); ctx.fill();
  ctx.font='bold 10px "Rajdhani", sans-serif';
  ctx.fillStyle = player.ready?'#4CAF50':'#FF9800';
  ctx.fillText(player.ready?'✔ READY':'WAITING', cx, badgeY+13);

  // YOU badge
  if (!player.isBot) {
    ctx.fillStyle='rgba(255,100,0,0.8)';
    roundRect(ctx, cx-20, y+5, 40, 18, 4); ctx.fill();
    ctx.font='bold 10px "Rajdhani", sans-serif'; ctx.fillStyle='#FFF';
    ctx.fillText('YOU', cx, y+18);
  }

  ctx.restore();
}
