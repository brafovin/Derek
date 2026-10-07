// ─── PUBG MOBILE STYLE LOBBY ──────────────────────────────────────────────────

let selectedWeaponSkin = 'iceberg_m4';
let selectedCharSkin   = 0;
let lobbyAnimFrame;
let lobbyCanvas, lobbyCtx;
let lobbyTime = 0;
let lockerSection = 'weapon';

// UI state
let activeTab      = 'home';  // home | inventory | shop | friends | missions
let activeMode     = 'Classic';
let activeMap      = 'Erangel';
let squadSlots     = ['YOU', null, null, null];
let bpLevel        = 42;
let bpXP           = 68;
let playerLevel    = 79;
let playerName     = 'GunZone';
let ucAmount       = 1860;
let goldAmount     = 289400;
let bpAmount       = 12850;
let charBobPhase   = 0;
let charBreathPhase= 0;
let modeHover      = false;
let mapHover       = false;
let modeMenuOpen   = false;
let activeTeamSize = 'Squad';
let playPulse      = 0;
let newsIndex      = 0;
let newsTimer      = 0;
let shopItems      = [];
let skinPanelOpen  = false;
let hoveredSkinKey = null;
let particles      = [];
let notification   = null;
let notifTimer     = 0;

// ─── MISSIONS STATE ───────────────────────────────────────────────────────────
let missionsList = [
  { id:0, label:'5 Kills mit einer AR erzielen',   icon:'🎯', prog:3, total:5,  xp:200,  bp:50,  claimed:false },
  { id:1, label:'Top 3 Platzierung erreichen',      icon:'🏆', prog:1, total:1,  xp:300,  bp:80,  claimed:false },
  { id:2, label:'1 km mit Fahrzeug fahren',          icon:'🚗', prog:0, total:1,  xp:150,  bp:40,  claimed:false },
  { id:3, label:'2 Headshots erzielen',              icon:'💀', prog:2, total:2,  xp:250,  bp:60,  claimed:false },
  { id:4, label:'10 Lootboxen öffnen',               icon:'📦', prog:4, total:10, xp:100,  bp:30,  claimed:false },
  { id:5, label:'Mit einer Schrotflinte töten',      icon:'💥', prog:0, total:1,  xp:180,  bp:45,  claimed:false },
  { id:6, label:'30 Treffer landen',                 icon:'🔫', prog:22, total:30, xp:120, bp:35,  claimed:false },
  { id:7, label:'Waffen-Skin im Spiel nutzen',       icon:'✨', prog:1, total:1,  xp:80,   bp:20,  claimed:false },
];
// missions where prog>=total are "claimable" (done but not yet claimed)
function missionDone(m) { return m.prog >= m.total && !m.claimed; }
function missionActive(m) { return m.prog < m.total && !m.claimed; }

const MODES = ['Classic','Arcade','EvoGround','Training'];
const MAPS  = ['Erangel','Miramar','Sanhok','Vikendi'];

// How many total players each map supports (Battle Royale scale)
const MAP_PLAYER_COUNTS = { Erangel:100, Miramar:100, Sanhok:64, Vikendi:80 };
// Team size → number of players per squad
const TEAM_SIZE_COUNT = { Solo:1, Duo:2, Trio:3, Squad:4 };
// Helpers usable from matchmaking.js / pregame.js (loaded globally)
function getMatchPlayerCount(map) {
  if (typeof activeMode !== 'undefined' && activeMode === 'Training') return 16;
  return MAP_PLAYER_COUNTS[map || activeMap] || 100;
}
function getTeamSize() { return TEAM_SIZE_COUNT[activeTeamSize] || 4; }
const MAP_COLORS = {
  Erangel: ['#2D5016','#4A7C2F'],
  Miramar: ['#8B7040','#C4A862'],
  Sanhok:  ['#1A4A1A','#2D8B2D'],
  Vikendi: ['#A8C8E8','#E0F0FF'],
};
const NEWS_ITEMS = [
  { title: 'ICEBERG M4 – Neues Waffen-Skin!',  tag: 'NEU',   color: '#00BCD4' },
  { title: 'Season 30 Battle Pass – Jetzt!',    tag: 'SEASON',color: '#FFD700' },
  { title: 'Free For All Mode – Live!',         tag: 'EVENT', color: '#FF6400' },
  { title: 'Fahrzeug-Update: Neue Buggy Skins', tag: 'UPD',   color: '#4CAF50' },
];

const BOTTOM_TABS = [
  { id:'missions',   icon:'📋', label:'Aufgaben' },
  { id:'inventory',  icon:'🎒', label:'Inventar' },
  { id:'home',       icon:'🏠', label:'Home',  big: false },
  { id:'wardrobe',   icon:'👔', label:'Spind' },
  { id:'shop',       icon:'🛍', label:'Shop' },
  { id:'friends',    icon:'👥', label:'Freunde' },
];

const FRIEND_LIST = [
  { name:'Shadow',  level:88, online:true,  status:'Im Match' },
  { name:'Viper',   level:72, online:true,  status:'In Lobby' },
  { name:'Ghost',   level:95, online:true,  status:'Im Match' },
  { name:'Blaze',   level:60, online:false, status:'Zuletzt: 2h' },
  { name:'Storm',   level:55, online:false, status:'Zuletzt: 1d' },
];

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initLobby() {
  lobbyCanvas = document.getElementById('lobbyCanvas');
  lobbyCtx    = lobbyCanvas.getContext('2d');
  resizeLobbyCanvas();
  window.addEventListener('resize', resizeLobbyCanvas);
  lobbyAnimFrame = requestAnimationFrame(lobbyLoop);
  setupLobbyInteraction();
  spawnAmbientParticles();
}

function resizeLobbyCanvas() {
  if (!lobbyCanvas) return;
  lobbyCanvas.width  = window.innerWidth;
  lobbyCanvas.height = window.innerHeight;
}

function stopLobby() { cancelAnimationFrame(lobbyAnimFrame); }

function lobbyLoop() {
  const dt = 0.016;
  lobbyTime      += dt;
  charBobPhase   += dt * 0.8;
  charBreathPhase+= dt * 1.2;
  playPulse      += dt * 2;
  newsTimer      += dt;
  if (newsTimer > 5) { newsTimer = 0; newsIndex = (newsIndex+1) % NEWS_ITEMS.length; }
  if (notifTimer > 0) notifTimer -= dt;
  updateParticles(dt);
  drawLobby(lobbyCtx, lobbyCanvas.width, lobbyCanvas.height);
  lobbyAnimFrame = requestAnimationFrame(lobbyLoop);
}

// ─── AMBIENT PARTICLES ────────────────────────────────────────────────────────
function spawnAmbientParticles() {
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random(), y: Math.random() + 0.5,
      size: 1 + Math.random() * 2,
      speed: 0.00005 + Math.random() * 0.0001,
      alpha: 0.05 + Math.random() * 0.15,
      color: Math.random() > 0.5 ? '#F0A500' : '#FF6B35',
      phase: Math.random() * Math.PI * 2,
    });
  }
}
function updateParticles(dt) {
  for (const p of particles) {
    p.y -= p.speed;
    p.x += Math.sin(lobbyTime * 0.5 + p.phase) * 0.0002;
    p.phase += dt;
    if (p.y < -0.1) p.y = 1.1;
  }
}

// ─── MASTER DRAW ──────────────────────────────────────────────────────────────
function drawLobby(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // ── Background Scene ──
  drawBackground(ctx, W, H);

  // ── Floating particles ──
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha * (0.7 + Math.sin(p.phase)*0.3);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x*W, p.y*H, p.size, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── Left Panel ──
  if (activeTab === 'friends') drawFriendsPanel(ctx, W, H);
  else if (activeTab === 'missions') drawMissionsPanel(ctx, W, H);
  else if (activeTab === 'shop') drawShopPanel(ctx, W, H);
  else if (activeTab === 'inventory') drawInventoryPanel(ctx, W, H);
  else if (activeTab === 'wardrobe') drawWardrobePanel(ctx, W, H);
  else drawLeftPanel(ctx, W, H);

  // ── Right Panel ──
  drawRightPanel(ctx, W, H);

  // ── Center Character ──
  drawCharacterCenter(ctx, W, H);

  // ── Mode + Map selector (above PLAY) ──
  drawModeSelector(ctx, W, H);

  // ── Squad bar ──
  drawSquadBar(ctx, W, H);

  // ── Top HUD bar ──
  drawTopBar(ctx, W, H);

  // ── Bottom Nav ──
  drawBottomNav(ctx, W, H);

  // ── PLAY button ──
  drawPlayButton(ctx, W, H);

  // ── News ticker ──
  drawNewsTicker(ctx, W, H);

  // ── Notification ──
  if (notification && notifTimer > 0) drawNotification(ctx, W, H);

  // ── Skin Panel (overlay) ──
  if (skinPanelOpen) drawSkinPanel(ctx, W, H);

  // ── Mode Selection Menu (overlay) ──
  if (modeMenuOpen) drawModeMenu(ctx, W, H);
}

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function drawBackground(ctx, W, H) {
  // Sky gradient — sunset like PUBG Mobile
  const sky = ctx.createLinearGradient(0,0,0,H*0.65);
  sky.addColorStop(0,   '#0B1220');
  sky.addColorStop(0.3, '#1A1A2E');
  sky.addColorStop(0.6, '#16213E');
  sky.addColorStop(1,   '#0F3460');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

  // Horizon glow (warm orange)
  const hY = H * 0.58;
  const hg = ctx.createRadialGradient(W*0.5, hY, 0, W*0.5, hY, W*0.6);
  hg.addColorStop(0,   'rgba(240,130,30,0.22)');
  hg.addColorStop(0.4, 'rgba(200,80,10,0.10)');
  hg.addColorStop(1,   'transparent');
  ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);

  // Stars
  ctx.save();
  for (let i=0;i<80;i++){
    const sx=(Math.sin(i*37.7)*0.5+0.5)*W;
    const sy=(Math.sin(i*19.3)*0.5+0.5)*H*0.5;
    const sa=0.2+Math.sin(lobbyTime*0.5+i)*0.2;
    ctx.globalAlpha=sa; ctx.fillStyle='#FFF';
    ctx.beginPath(); ctx.arc(sx,sy,Math.sin(i*7.7)*0.5+0.5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Ground / airfield
  const grd = ctx.createLinearGradient(0,H*0.6,0,H);
  grd.addColorStop(0,'#0D1B0D'); grd.addColorStop(1,'#050A05');
  ctx.fillStyle=grd; ctx.fillRect(0,H*0.6,W,H*0.4);

  // Runway markings
  ctx.save();
  ctx.globalAlpha=0.12; ctx.strokeStyle='#FFF'; ctx.lineWidth=3;
  for(let i=0;i<12;i++){
    const rx=W*0.2+i*(W*0.05);
    ctx.beginPath(); ctx.moveTo(rx,H*0.72); ctx.lineTo(rx+W*0.03,H*0.72); ctx.stroke();
  }
  ctx.restore();

  // Building silhouettes (background)
  ctx.save();
  ctx.globalAlpha=0.35;
  ctx.fillStyle='#0A1208';
  // Left buildings
  [[0.02,0.55,0.06,0.15],[0.07,0.48,0.05,0.22],[0.12,0.52,0.04,0.18],
   [0.15,0.44,0.08,0.26],[0.22,0.50,0.04,0.20]].forEach(([bx,by,bw,bh])=>{
    ctx.fillRect(bx*W, by*H, bw*W, bh*H);
    // Windows
    ctx.fillStyle='rgba(255,200,80,0.25)';
    for(let wy=0;wy<5;wy++) for(let wx=0;wx<3;wx++){
      if(Math.sin(bx*100+wx*7+wy*13)>0.2)
        ctx.fillRect(bx*W+wx*(bw*W/3)+2, by*H+wy*(bh*H/6)+3, bw*W/3-4, bh*H/6-4);
    }
    ctx.fillStyle='#0A1208';
  });
  // Right buildings
  [[0.78,0.50,0.05,0.20],[0.83,0.45,0.07,0.25],[0.90,0.52,0.04,0.18],
   [0.93,0.48,0.06,0.22]].forEach(([bx,by,bw,bh])=>{
    ctx.fillStyle='#0A1208';
    ctx.fillRect(bx*W, by*H, bw*W, bh*H);
    ctx.fillStyle='rgba(255,200,80,0.2)';
    for(let wy=0;wy<5;wy++) for(let wx=0;wx<3;wx++){
      if(Math.sin(bx*100+wx*11+wy*17)>0.25)
        ctx.fillRect(bx*W+wx*(bw*W/3)+2, by*H+wy*(bh*H/6)+3, bw*W/3-4, bh*H/6-4);
    }
  });
  ctx.restore();

  // Ground fog
  const fog = ctx.createLinearGradient(0,H*0.58,0,H*0.68);
  fog.addColorStop(0,'transparent'); fog.addColorStop(1,'rgba(10,20,15,0.6)');
  ctx.fillStyle=fog; ctx.fillRect(0,H*0.58,W,H*0.1);

  // Vignette
  const vig = ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.8);
  vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // Scanlines
  ctx.save(); ctx.globalAlpha=0.02;
  for(let y=0;y<H;y+=3){ctx.fillStyle='#000';ctx.fillRect(0,y,W,1.5);}
  ctx.restore();
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function drawTopBar(ctx, W, H) {
  const barH = 58;

  // Bar background
  const bg = ctx.createLinearGradient(0,0,0,barH);
  bg.addColorStop(0,'rgba(5,8,18,0.96)'); bg.addColorStop(1,'rgba(8,12,25,0.92)');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,barH);
  ctx.strokeStyle='rgba(240,165,0,0.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,barH); ctx.lineTo(W,barH); ctx.stroke();

  // ── Avatar ──
  const avX=14, avY=9, avR=20;
  ctx.save();
  // Border ring (animated)
  const ringA = lobbyTime * 1.2;
  const rg = ctx.createLinearGradient(avX-avR,avY-avR,avX+avR,avY+avR*2);
  rg.addColorStop(0,'#F0A500'); rg.addColorStop(0.5,'#FF6B35'); rg.addColorStop(1,'#F0A500');
  ctx.strokeStyle=rg; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(avX+avR,avY+avR,avR+2,0,Math.PI*2); ctx.stroke();
  // Avatar circle
  const ag = ctx.createRadialGradient(avX+avR,avY+avR,2,avX+avR,avY+avR,avR);
  ag.addColorStop(0,CHARACTER_SKINS[selectedCharSkin].face);
  ag.addColorStop(1,CHARACTER_SKINS[selectedCharSkin].helmet);
  ctx.fillStyle=ag;
  ctx.beginPath(); ctx.arc(avX+avR,avY+avR,avR,0,Math.PI*2); ctx.fill();
  // Level badge
  ctx.fillStyle='#F0A500';
  roundRect(ctx, avX+avR*2-4, avY+avR*2-8, 22, 14, 3); ctx.fill();
  ctx.font='bold 9px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#000';
  ctx.fillText(`Lv${playerLevel}`, avX+avR*2+7, avY+avR*2+2);
  ctx.restore();

  // Player name + rank
  ctx.save();
  ctx.font='bold 15px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#FFF';
  ctx.fillText(playerName, 60, 22);
  ctx.font='11px "Rajdhani",sans-serif'; ctx.fillStyle='#F0A500';
  ctx.fillText('Platinum III  •  Season 30', 60, 38);
  ctx.restore();

  // Separator
  ctx.strokeStyle='rgba(240,165,0,0.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(220,10); ctx.lineTo(220,48); ctx.stroke();

  // Missions quick button
  ctx.save();
  ctx.fillStyle='rgba(240,165,0,0.12)';
  roundRect(ctx,230,10,90,36,6); ctx.fill();
  ctx.strokeStyle='rgba(240,165,0,0.3)'; ctx.lineWidth=1;
  roundRect(ctx,230,10,90,36,6); ctx.stroke();
  ctx.font='bold 11px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#F0A500';
  ctx.fillText('📋  AUFGABEN', 275, 32);
  // Red dot
  ctx.fillStyle='#F44336'; ctx.beginPath(); ctx.arc(315,13,5,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // ── Currencies (right side) ──
  const currencies = [
    { icon:'💎', val: ucAmount,    color:'#7C4DFF', label:'UC'   },
    { icon:'🪙', val: goldAmount,  color:'#F0A500', label:'Gold' },
    { icon:'⭐', val: bpAmount,    color:'#29B6F6', label:'BP'   },
  ];
  currencies.forEach((c,i)=>{
    const cx = W - 240 + i*78;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.4)';
    roundRect(ctx,cx,10,72,36,6); ctx.fill();
    ctx.font='16px sans-serif'; ctx.textAlign='left'; ctx.fillStyle=c.color;
    ctx.fillText(c.icon, cx+6, 33);
    ctx.font='bold 12px "Rajdhani",sans-serif'; ctx.fillStyle='#FFF';
    ctx.fillText(c.val.toLocaleString(), cx+26, 25);
    ctx.font='9px sans-serif'; ctx.fillStyle='#888';
    ctx.fillText(c.label, cx+26, 40);
    // Plus button
    ctx.fillStyle='rgba(240,165,0,0.7)';
    ctx.beginPath(); ctx.arc(cx+66, 20, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#000'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText('+', cx+66, 24);
    ctx.restore();
  });

  // Settings gear
  ctx.save();
  ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#AAA';
  ctx.fillText('⚙', W-16, 34);
  ctx.restore();
}

// ─── LEFT PANEL (default) ─────────────────────────────────────────────────────
function drawLeftPanel(ctx, W, H) {
  const px=14, py=70, pw=210, ph=H*0.55;
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.78)';
  roundRect(ctx,px,py,pw,ph,10); ctx.fill();
  ctx.strokeStyle='rgba(240,165,0,0.18)'; ctx.lineWidth=1;
  roundRect(ctx,px,py,pw,ph,10); ctx.stroke();

  // Header
  ctx.fillStyle='rgba(240,165,0,0.12)';
  roundRect(ctx,px,py,pw,36,10); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#F0A500';
  ctx.fillText('⚡  TAGESAUFGABEN', px+12, py+23);
  // Claimable count badge
  const claimCount = missionsList.filter(m => missionDone(m)).length;
  if (claimCount > 0) {
    ctx.fillStyle = '#4CAF50';
    roundRect(ctx, px+pw-64, py+8, 56, 20, 4); ctx.fill();
    ctx.font = 'bold 10px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#FFF';
    ctx.fillText(`${claimCount} ABHOLEN`, px+pw-36, py+22);
  }

  // Show first 5 missions as preview — click tab for full view
  const preview = missionsList.slice(0, 5);
  preview.forEach((m, i) => {
    const my = py + 48 + i * 50;
    const isDone    = missionDone(m);
    const isClaimed = m.claimed;
    ctx.fillStyle = isClaimed ? 'rgba(255,255,255,0.02)' : isDone ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.04)';
    roundRect(ctx, px+8, my, pw-16, 42, 6); ctx.fill();
    if (isDone) { ctx.strokeStyle='rgba(76,175,80,0.3)'; ctx.lineWidth=1; roundRect(ctx,px+8,my,pw-16,42,6); ctx.stroke(); }

    ctx.font = `bold 11px "Rajdhani",sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = isClaimed ? '#444' : isDone ? '#4CAF50' : '#DDD';
    ctx.fillText((m.icon + ' ' + m.label).slice(0, 26), px+14, my+14);

    if (isClaimed) {
      ctx.font='10px sans-serif'; ctx.fillStyle='#444';
      ctx.fillText('✓ abgeholt', px+14, my+30);
    } else if (isDone) {
      ctx.font='bold 10px "Rajdhani",sans-serif'; ctx.fillStyle='#4CAF50';
      ctx.fillText('→ AUFGABEN tab zum Abholen', px+14, my+30);
    } else {
      ctx.fillStyle='rgba(255,255,255,0.1)';
      roundRect(ctx,px+14,my+26,pw-70,5,3); ctx.fill();
      ctx.fillStyle='#F0A500';
      roundRect(ctx,px+14,my+26,(pw-70)*Math.min(1,m.prog/m.total),5,3); ctx.fill();
      ctx.font='9px sans-serif'; ctx.fillStyle='#888';
      ctx.fillText(`${m.prog}/${m.total}`, px+14+pw-74, my+31);
    }
    ctx.textAlign='right'; ctx.font='bold 10px "Rajdhani",sans-serif';
    ctx.fillStyle = isClaimed ? '#333' : isDone ? 'rgba(76,175,80,0.7)' : '#F0A500';
    ctx.fillText(`+${m.xp}XP`, px+pw-10, my+14);
  });
  ctx.restore();

  // BP Level display
  const bpY=py+ph+10;
  drawBattlePassMini(ctx, px, bpY, pw);
}

function drawBattlePassMini(ctx, x, y, w) {
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.85)';
  roundRect(ctx,x,y,w,80,10); ctx.fill();
  ctx.strokeStyle='rgba(100,200,255,0.3)'; ctx.lineWidth=1;
  roundRect(ctx,x,y,w,80,10); ctx.stroke();
  // Gold glow top
  const tg=ctx.createLinearGradient(x,y,x+w,y);
  tg.addColorStop(0,'#F0A500'); tg.addColorStop(0.5,'#FFD700'); tg.addColorStop(1,'#F0A500');
  ctx.strokeStyle=tg; ctx.lineWidth=2;
  roundRect(ctx,x,y,w,80,10); ctx.stroke();

  ctx.font='bold 11px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#FFD700';
  ctx.fillText('🏆  BATTLE PASS – SEASON 30', x+10, y+18);
  ctx.font='11px sans-serif'; ctx.fillStyle='#888';
  ctx.fillText(`Level ${bpLevel}  →  Level ${bpLevel+1}`, x+10, y+34);
  // XP bar
  ctx.fillStyle='rgba(255,255,255,0.1)'; roundRect(ctx,x+10,y+40,w-20,10,3); ctx.fill();
  const barG=ctx.createLinearGradient(x+10,0,x+10+(w-20),0);
  barG.addColorStop(0,'#F0A500'); barG.addColorStop(1,'#FFD700');
  ctx.fillStyle=barG; roundRect(ctx,x+10,y+40,(w-20)*bpXP/100,10,3); ctx.fill();
  ctx.font='bold 10px sans-serif'; ctx.textAlign='right'; ctx.fillStyle='#FFD700';
  ctx.fillText(`${bpXP}%`, x+w-10, y+52);
  ctx.font='10px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#F0A500';
  ctx.fillText('Premium-Preis: 360 UC', x+10, y+68);
  ctx.restore();
}

// ─── RIGHT PANEL ──────────────────────────────────────────────────────────────
function drawRightPanel(ctx, W, H) {
  const pw=210, px=W-pw-14, py=70;
  let curY = py;

  // ── Weapon Skin showcase ──
  drawWeaponShowcase(ctx, px, curY, pw);
  curY += 185;

  // ── RANGSAISON — header card ──
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,curY,pw,36,8); ctx.fill();
  ctx.strokeStyle='rgba(240,165,0,0.25)'; ctx.lineWidth=1;
  roundRect(ctx,px,curY,pw,36,8); ctx.stroke();
  ctx.fillStyle='rgba(240,165,0,0.12)'; roundRect(ctx,px,curY,pw,36,8); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#F0A500';
  ctx.fillText('🌐  RANGSAISON 30', px+12, curY+23);
  ctx.restore();
  curY += 42;

  // ── Rangsaison — 3 individual stat cards ──
  const rankCards=[
    { label:'Rang',   val:'Platin III', icon:'🏅', col:'#90CAF9', bg:'rgba(144,202,249,0.08)' },
    { label:'Punkte', val:'3,840 RP',   icon:'⭐', col:'#FFD700', bg:'rgba(255,215,0,0.07)'   },
    { label:'Endet',  val:'12 Tage',    icon:'⏳', col:'#FF8A65', bg:'rgba(255,138,101,0.09)' },
  ];
  rankCards.forEach((r)=>{
    ctx.save();
    ctx.fillStyle=r.bg;
    roundRect(ctx,px,curY,pw,38,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    roundRect(ctx,px,curY,pw,38,7); ctx.stroke();
    // Left accent bar
    ctx.fillStyle=r.col; ctx.fillRect(px,curY+4,3,30);
    // Icon + label
    ctx.font='15px sans-serif'; ctx.textAlign='left';
    ctx.fillText(r.icon, px+10, curY+25);
    ctx.font='11px "Rajdhani",sans-serif'; ctx.fillStyle='#778'; ctx.textAlign='left';
    ctx.fillText(r.label, px+32, curY+19);
    // Value
    ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.fillStyle=r.col; ctx.textAlign='right';
    ctx.fillText(r.val, px+pw-10, curY+25);
    ctx.restore();
    curY += 43;
  });
  curY += 6;

  // ── AKTIVE EVENTS — header card ──
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,curY,pw,36,8); ctx.fill();
  ctx.strokeStyle='rgba(255,100,30,0.3)'; ctx.lineWidth=1;
  roundRect(ctx,px,curY,pw,36,8); ctx.stroke();
  ctx.fillStyle='rgba(255,80,20,0.14)'; roundRect(ctx,px,curY,pw,36,8); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#FF6400';
  ctx.fillText('🎮  AKTIVE EVENTS', px+12, curY+23);
  ctx.restore();
  curY += 42;

  // ── Events — each in its own card ──
  const events=[
    { name:'Gun Game Fiesta', reward:'3x UC',  icon:'🔥', hot:true,  col:'#FF6400', bg:'rgba(255,100,0,0.1)'  },
    { name:'Chicken Dinner X',reward:'Skin',    icon:'🏆', hot:false, col:'#FFD700', bg:'rgba(255,215,0,0.07)' },
    { name:'Headshot König',  reward:'100 BP',  icon:'💀', hot:false, col:'#CE93D8', bg:'rgba(206,147,216,0.07)'},
  ];
  events.forEach((e)=>{
    ctx.save();
    ctx.fillStyle=e.bg;
    roundRect(ctx,px,curY,pw,46,7); ctx.fill();
    ctx.strokeStyle=e.hot?'rgba(255,100,0,0.3)':'rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    roundRect(ctx,px,curY,pw,46,7); ctx.stroke();
    // Left accent bar
    ctx.fillStyle=e.col; ctx.fillRect(px,curY+5,3,36);
    // Icon
    ctx.font='18px sans-serif'; ctx.textAlign='left';
    ctx.fillText(e.icon, px+10, curY+30);
    // Name
    ctx.font='bold 12px "Rajdhani",sans-serif'; ctx.fillStyle='#EEE'; ctx.textAlign='left';
    ctx.fillText(e.name, px+34, curY+20);
    // Reward badge
    ctx.fillStyle=e.hot?'rgba(255,100,0,0.25)':'rgba(255,215,0,0.15)';
    roundRect(ctx,px+34,curY+26,pw-46,14,3); ctx.fill();
    ctx.font='bold 10px "Rajdhani",sans-serif'; ctx.fillStyle=e.col; ctx.textAlign='left';
    ctx.fillText('Belohnung: ' + e.reward, px+38, curY+36);
    ctx.restore();
    curY += 51;
  });

  // ── STATISTIKEN — header card ──
  curY += 6;
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,curY,pw,36,8); ctx.fill();
  ctx.strokeStyle='rgba(79,195,247,0.25)'; ctx.lineWidth=1;
  roundRect(ctx,px,curY,pw,36,8); ctx.stroke();
  ctx.fillStyle='rgba(79,195,247,0.1)'; roundRect(ctx,px,curY,pw,36,8); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#4FC3F7';
  ctx.fillText('📊  STATISTIKEN', px+12, curY+23);
  ctx.restore();
  curY += 42;

  // ── Stats — each in own card ──
  const stats=[
    { label:'Matches',  val:'247',    icon:'🎮', col:'#4FC3F7' },
    { label:'Kills',    val:'1,382',  icon:'🔫', col:'#FF6400' },
    { label:'K/D',      val:'5.6',    icon:'⚔️', col:'#FFD700' },
    { label:'Win Rate', val:'18.2%',  icon:'🏆', col:'#4CAF50' },
  ];
  stats.forEach((s)=>{
    ctx.save();
    ctx.fillStyle='rgba(255,255,255,0.03)';
    roundRect(ctx,px,curY,pw,36,7); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
    roundRect(ctx,px,curY,pw,36,7); ctx.stroke();
    ctx.fillStyle=s.col; ctx.fillRect(px,curY+4,3,28);
    ctx.font='14px sans-serif'; ctx.textAlign='left';
    ctx.fillText(s.icon, px+10, curY+24);
    ctx.font='11px "Rajdhani",sans-serif'; ctx.fillStyle='#778'; ctx.textAlign='left';
    ctx.fillText(s.label, px+32, curY+17);
    ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.fillStyle=s.col; ctx.textAlign='right';
    ctx.fillText(s.val, px+pw-10, curY+24);
    ctx.restore();
    curY += 41;
  });
}

function drawWeaponShowcase(ctx, px, py, pw) {
  ctx.save();
  const ws = WEAPON_SKINS[selectedWeaponSkin];

  // Background with skin color glow
  const glowColor = ws.glow || 'rgba(240,165,0,0.3)';
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,py,pw,175,10); ctx.fill();
  if(ws.glow){
    ctx.shadowColor=ws.glow; ctx.shadowBlur=20;
  }
  ctx.strokeStyle=ws.glow||'rgba(240,165,0,0.3)'; ctx.lineWidth=1.5;
  roundRect(ctx,px,py,pw,175,10); ctx.stroke();
  ctx.shadowBlur=0;

  ctx.fillStyle='rgba(0,0,0,0.2)'; roundRect(ctx,px,py,pw,34,10); ctx.fill();
  ctx.font='bold 12px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle=ws.glow?ws.colors[0]:'#F0A500';
  ctx.fillText('🔫  WAFFEN-SKIN', px+10, py+22);

  // Skin name badge
  if(selectedWeaponSkin==='iceberg_m4'){
    ctx.fillStyle='rgba(0,188,212,0.2)';
    roundRect(ctx,px+pw-90,py+8,82,18,4); ctx.fill();
    ctx.strokeStyle='#00BCD4'; ctx.lineWidth=1; roundRect(ctx,px+pw-90,py+8,82,18,4); ctx.stroke();
    ctx.font='bold 9px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#A8D8EA';
    ctx.fillText('❄ ICEBERG M416', px+pw-49, py+21);
  }

  // Draw M416 weapon on canvas (side view)
  const wX=px+pw/2, wY=py+90;
  ctx.save();
  ctx.translate(wX, wY);
  const tilt = Math.sin(lobbyTime*0.8)*0.05;
  ctx.rotate(tilt);

  // Weapon shadow
  ctx.save(); ctx.globalAlpha=0.2;
  ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(0,18,50,8,0,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Rifle body
  if(ws.glow){ctx.shadowColor=ws.glow;ctx.shadowBlur=15;}
  // Stock
  ctx.fillStyle=ws.colors[1];
  ctx.beginPath(); ctx.roundRect(-60,-8,22,14,3); ctx.fill();
  ctx.fillStyle=ws.colors[0]; ctx.fillRect(-58,-5,18,2);

  // Main body
  ctx.fillStyle=ws.colors[0];
  ctx.beginPath(); ctx.roundRect(-38,-10,78,18,4); ctx.fill();

  // Grip
  ctx.fillStyle=ws.colors[1];
  ctx.beginPath(); ctx.roundRect(5,4,14,16,3); ctx.fill();

  // Magazine
  ctx.fillStyle=ws.colors[1];
  ctx.beginPath(); ctx.roundRect(-5,5,16,20,3); ctx.fill();

  // Top rail
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(-36,-14,74,5);
  ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(-34,-14,10,3);

  // Barrel
  ctx.fillStyle=ws.colors[2]||ws.colors[0];
  ctx.beginPath(); ctx.roundRect(40,-4,30,8,2); ctx.fill();
  // Muzzle
  ctx.fillStyle='#222'; ctx.fillRect(68,-5,6,10);

  // Scope
  ctx.fillStyle='rgba(20,20,20,0.9)';
  ctx.beginPath(); ctx.roundRect(-20,-18,36,8,3); ctx.fill();
  ctx.fillStyle='rgba(100,200,255,0.3)'; ctx.fillRect(-18,-17,32,6);

  // Skin special deco
  if(selectedWeaponSkin==='iceberg_m4'){
    // Ice crystal overlays
    ctx.fillStyle='rgba(168,216,234,0.3)';
    for(let i=0;i<5;i++){
      ctx.save(); ctx.translate(-30+i*18, -2+Math.sin(i)*3);
      ctx.rotate(lobbyTime*0.5+i);
      ctx.fillRect(-2,-4,4,8); ctx.restore();
    }
    ctx.shadowColor='#00BCD4'; ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(168,216,234,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(-38,-10,78,18,4); ctx.stroke();
  } else if(selectedWeaponSkin==='dragon'){
    ctx.shadowColor='#FF4500'; ctx.shadowBlur=15;
    ctx.strokeStyle='rgba(255,69,0,0.6)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(-38,-10,78,18,4); ctx.stroke();
  } else if(selectedWeaponSkin==='neon'){
    ctx.shadowColor='#00FFFF'; ctx.shadowBlur=20;
    ctx.strokeStyle='rgba(0,255,255,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(-38,-10,78,18,4); ctx.stroke();
  }
  ctx.shadowBlur=0;
  ctx.restore(); // weapon

  // Skin selector dots
  const dots=Object.keys(WEAPON_SKINS);
  dots.forEach((key,i)=>{
    const dx=px+12+i*(pw-24)/dots.length+(pw-24)/(dots.length*2);
    const dy=py+155;
    const sel=selectedWeaponSkin===key;
    const c=WEAPON_SKINS[key].colors[0];
    ctx.fillStyle=sel?c:'rgba(255,255,255,0.2)';
    if(sel){ctx.shadowColor=c;ctx.shadowBlur=8;}
    ctx.beginPath(); ctx.arc(dx,dy,sel?6:4,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    if(sel){
      ctx.strokeStyle=c; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(dx,dy,9,0,Math.PI*2); ctx.stroke();
    }
  });
  ctx.font='bold 10px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle=ws.colors[0];
  ctx.fillText(ws.name, px+pw/2, py+170);
  ctx.restore();
}

// ─── CHARACTER CENTER ─────────────────────────────────────────────────────────
function drawCharacterCenter(ctx, W, H) {
  const cx = W/2, groundY = H*0.80;
  const bob = Math.sin(charBobPhase) * 3;
  const breath = Math.sin(charBreathPhase) * 1.5;

  ctx.save();

  // Character ground shadow
  const sg = ctx.createRadialGradient(cx, groundY+5, 0, cx, groundY+5, 55);
  sg.addColorStop(0,'rgba(0,0,0,0.5)'); sg.addColorStop(1,'transparent');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.ellipse(cx,groundY+5,55,14,0,0,Math.PI*2); ctx.fill();

  // Character glow (from below)
  const cg = ctx.createRadialGradient(cx, groundY, 0, cx, groundY, 200);
  cg.addColorStop(0,'rgba(240,165,0,0.08)'); cg.addColorStop(1,'transparent');
  ctx.fillStyle=cg; ctx.fillRect(cx-200,groundY-300,400,320);

  ctx.translate(cx, groundY + bob);

  const skin = CHARACTER_SKINS[selectedCharSkin];
  const sc = 2.2; // scale

  // ── Draw full front-facing character ──
  drawFrontCharacter(ctx, 0, 0, sc, skin, WEAPON_SKINS[selectedWeaponSkin], breath);

  // Name plate below
  ctx.save();
  ctx.translate(0, 60);
  ctx.fillStyle='rgba(5,10,22,0.7)';
  roundRect(ctx,-60,0,120,22,5); ctx.fill();
  ctx.strokeStyle='rgba(240,165,0,0.4)'; ctx.lineWidth=1;
  roundRect(ctx,-60,0,120,22,5); ctx.stroke();
  ctx.font='bold 12px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#F0A500';
  ctx.fillText(skin.name, 0, 15);
  ctx.restore();

  ctx.restore();
}

function drawFrontCharacter(ctx, x, y, sc, skin, weapSkin, breath) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);

  // ─ Boots & Legs ─
  ctx.fillStyle = skin.boots;
  // Left boot
  ctx.beginPath(); ctx.roundRect(-14, 20, 11, 18, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-16, 34, 14, 8, 2); ctx.fill();
  // Right boot
  ctx.beginPath(); ctx.roundRect(3, 20, 11, 18, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(2, 34, 14, 8, 2); ctx.fill();

  // ─ Pants ─
  ctx.fillStyle = skin.pants;
  ctx.beginPath(); ctx.roundRect(-13, 0, 10, 24, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(3, 0, 10, 24, 2); ctx.fill();
  // Knee pad
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.fillRect(-12,10,9,6); ctx.fillRect(4,10,9,6);

  // ─ Belt ─
  ctx.fillStyle='#1A1A1A';
  ctx.fillRect(-14, -2, 28, 5);
  ctx.fillStyle='#666'; ctx.fillRect(-3,-3,6,7);

  // ─ Torso / Shirt ─
  ctx.fillStyle = skin.shirt;
  ctx.beginPath(); ctx.roundRect(-15, -22, 30, 24, 3); ctx.fill();

  // ─ Tactical Vest ─
  ctx.fillStyle = skin.vest;
  ctx.beginPath(); ctx.roundRect(-13, -22, 26, 22, 3); ctx.fill();
  // Vest pockets
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(-12,-18, 10, 8); // left pocket
  ctx.fillRect(2,-18, 10, 8);   // right pocket
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.fillRect(-11,-17,8,6); ctx.fillRect(3,-17,8,6);
  // Vest straps
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(-13,-22); ctx.lineTo(13,-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-13,-10); ctx.lineTo(13,-10); ctx.stroke();
  // Accent stripe
  ctx.fillStyle = skin.accent;
  ctx.fillRect(-13,-23,26,2);

  // ─ Arms ─
  ctx.fillStyle = skin.shirt;
  // Left arm (down, slightly out)
  ctx.save(); ctx.translate(-20,-12);
  ctx.rotate(-0.15);
  ctx.beginPath(); ctx.roundRect(-5,0,10,28,3); ctx.fill();
  // Left glove
  ctx.fillStyle='#1A1A1A'; ctx.beginPath(); ctx.roundRect(-5,24,10,8,3); ctx.fill();
  ctx.restore();

  // Right arm (holding weapon, extended)
  ctx.save(); ctx.translate(20-breath*0.3,-14);
  ctx.rotate(0.2 + breath*0.02);
  ctx.fillStyle=skin.shirt; ctx.beginPath(); ctx.roundRect(-5,0,10,28,3); ctx.fill();
  ctx.fillStyle='#1A1A1A'; ctx.beginPath(); ctx.roundRect(-5,24,10,8,3); ctx.fill();
  ctx.restore();

  // ─ Weapon in right hand ─
  ctx.save();
  ctx.translate(18+breath*0.5, 8+breath*0.3);
  ctx.rotate(0.3 + breath*0.02);
  const wc = weapSkin.colors;
  if(weapSkin.glow){ctx.shadowColor=weapSkin.glow;ctx.shadowBlur=10;}
  // Gun
  ctx.fillStyle=wc[1]; ctx.beginPath(); ctx.roundRect(-6,-4,12,4,2); ctx.fill(); // stock
  ctx.fillStyle=wc[0]; ctx.beginPath(); ctx.roundRect(-4,-8,40,14,3); ctx.fill(); // body
  ctx.fillStyle=wc[1]; ctx.fillRect(8,4,10,14); // grip
  ctx.fillStyle=wc[1]; ctx.fillRect(2,6,12,12);  // mag
  ctx.fillStyle=wc[2]||wc[0]; ctx.beginPath(); ctx.roundRect(35,-5,16,8,2); ctx.fill(); // barrel
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(-3,-12,38,5); // rail
  // Scope
  ctx.fillStyle='rgba(20,20,20,0.9)'; ctx.beginPath(); ctx.roundRect(5,-16,22,6,2); ctx.fill();
  ctx.fillStyle='rgba(100,200,255,0.3)'; ctx.fillRect(7,-15,18,4);
  if(weapSkin.special==='ice'){
    ctx.strokeStyle='rgba(168,216,234,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(-4,-8,40,14,3); ctx.stroke();
  }
  ctx.shadowBlur=0;
  ctx.restore();

  // ─ Neck ─
  ctx.fillStyle = skin.face;
  ctx.beginPath(); ctx.roundRect(-4,-28,8,8,2); ctx.fill();

  // ─ Head ─
  ctx.fillStyle = skin.face;
  ctx.beginPath(); ctx.ellipse(0,-38,12,14,0,0,Math.PI*2); ctx.fill();

  // ─ Helmet / Balaclava ─
  ctx.fillStyle = skin.helmet;
  ctx.beginPath();
  ctx.arc(0,-40,12,Math.PI,0,false); ctx.fill();
  ctx.fillRect(-12,-44,24,8); // top
  ctx.beginPath(); ctx.roundRect(-12,-44,24,4,2); ctx.fill();

  // Helmet strap/brim
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(-13,-35,26,4);

  // Goggles
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.beginPath(); ctx.roundRect(-11,-38,9,6,2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(2,-38,9,6,2); ctx.fill();
  ctx.fillStyle='rgba(100,200,255,0.35)';
  ctx.beginPath(); ctx.roundRect(-10,-37,7,4,1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(3,-37,7,4,1); ctx.fill();
  ctx.strokeStyle='rgba(150,230,255,0.5)'; ctx.lineWidth=0.5;
  ctx.beginPath(); ctx.roundRect(-11,-38,9,6,2); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(2,-38,9,6,2); ctx.stroke();

  // Nose/mouth exposed lower face (balaclava covers top)
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.roundRect(-9,-33,18,8,2); ctx.fill();
  ctx.fillStyle=skin.face; ctx.globalAlpha=0.7;
  ctx.beginPath(); ctx.ellipse(0,-31,6,3,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  // Accent stripe on helmet
  ctx.fillStyle=skin.accent;
  ctx.fillRect(-12,-43,24,2);

  // Ear comm piece
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.arc(-12,-38,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=skin.accent;
  ctx.beginPath(); ctx.arc(-12,-38,1.5,0,Math.PI*2); ctx.fill();

  ctx.restore(); // scale
}

// ─── MODE SELECTION MENU (OVERLAY) ───────────────────────────────────────────
function drawModeMenu(ctx, W, H) {
  // Dim overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);

  const mw = Math.min(780, W - 40), mh = Math.min(560, H - 80);
  const mx = W / 2 - mw / 2, my = H / 2 - mh / 2;

  // Panel background
  const panelBg = ctx.createLinearGradient(mx, my, mx, my + mh);
  panelBg.addColorStop(0, '#070D1E');
  panelBg.addColorStop(1, '#04081A');
  ctx.fillStyle = panelBg;
  roundRect(ctx, mx, my, mw, mh, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(240,165,0,0.4)'; ctx.lineWidth = 1.5;
  roundRect(ctx, mx, my, mw, mh, 16); ctx.stroke();

  // Title bar
  ctx.fillStyle = 'rgba(240,165,0,0.12)';
  roundRect(ctx, mx, my, mw, 50, 16); ctx.fill();
  ctx.font = 'bold 20px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#F0A500';
  ctx.fillText('SPIELMODUS AUSWÄHLEN', W / 2, my + 32);

  // Close X
  ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#666';
  ctx.fillText('✕', mx + mw - 22, my + 33);

  let secY = my + 64;

  // ── Section label helper ──
  function sectionLabel(label, y) {
    ctx.font = 'bold 11px "Rajdhani",sans-serif'; ctx.textAlign = 'left';
    ctx.fillStyle = '#556';
    ctx.fillText(label, mx + 20, y);
  }

  // ═══ MODE SECTION ═══
  sectionLabel('MODUS', secY);
  secY += 14;

  const modeInfo = {
    Classic:    { icon: '🎯', desc: 'Standard Battle Royale',    col: '#F0A500' },
    Arcade:     { icon: '⚡', desc: 'Schnelle Runden',            col: '#FF6400' },
    EvoGround:  { icon: '🔬', desc: 'Besondere Regeln',           col: '#4CAF50' },
    Training:   { icon: '🎮', desc: 'Üben & Testen',              col: '#4FC3F7' },
  };

  const modeCardW = (mw - 40 - 12) / 4;
  const modeCardH = 72;
  MODES.forEach((mode, i) => {
    const info = modeInfo[mode];
    const cx = mx + 20 + i * (modeCardW + 4);
    const cy = secY;
    const sel = activeMode === mode;

    ctx.fillStyle = sel ? `rgba(${hexToRgb(info.col)},0.22)` : 'rgba(255,255,255,0.04)';
    ctx.shadowColor = sel ? info.col : 'transparent';
    ctx.shadowBlur = sel ? 14 : 0;
    roundRect(ctx, cx, cy, modeCardW, modeCardH, 8); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sel ? info.col : 'rgba(255,255,255,0.08)'; ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, cx, cy, modeCardW, modeCardH, 8); ctx.stroke();

    // Icon
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(info.icon, cx + modeCardW / 2, cy + 28);
    // Name
    ctx.font = `bold 13px "Rajdhani",sans-serif`; ctx.fillStyle = sel ? info.col : '#CCC';
    ctx.fillText(mode, cx + modeCardW / 2, cy + 47);
    // Desc
    ctx.font = '10px "Rajdhani",sans-serif'; ctx.fillStyle = sel ? info.col : '#556';
    ctx.fillText(info.desc, cx + modeCardW / 2, cy + 62);

    // Selected dot
    if (sel) {
      ctx.fillStyle = info.col;
      ctx.beginPath(); ctx.arc(cx + modeCardW / 2, cy + modeCardH - 4, 3, 0, Math.PI * 2); ctx.fill();
    }
  });
  secY += modeCardH + 20;

  // ═══ TEAM SIZE SECTION ═══
  sectionLabel('TEAMGRÖSSE', secY);
  secY += 14;

  const TEAM_SIZES = ['Solo', 'Duo', 'Trio', 'Squad'];
  const TEAM_ICONS = { Solo: '👤', Duo: '👥', Trio: '👣', Squad: '🪖' };
  const tsCardW = (mw - 40 - 12) / 4;
  const tsCardH = 54;
  TEAM_SIZES.forEach((ts, i) => {
    const cx = mx + 20 + i * (tsCardW + 4);
    const cy = secY;
    const sel = activeTeamSize === ts;

    ctx.fillStyle = sel ? 'rgba(100,200,255,0.18)' : 'rgba(255,255,255,0.04)';
    ctx.shadowColor = sel ? '#4FC3F7' : 'transparent'; ctx.shadowBlur = sel ? 12 : 0;
    roundRect(ctx, cx, cy, tsCardW, tsCardH, 8); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sel ? '#4FC3F7' : 'rgba(255,255,255,0.08)'; ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, cx, cy, tsCardW, tsCardH, 8); ctx.stroke();

    ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(TEAM_ICONS[ts], cx + tsCardW / 2, cy + 24);
    ctx.font = `bold 13px "Rajdhani",sans-serif`; ctx.fillStyle = sel ? '#4FC3F7' : '#CCC';
    ctx.fillText(ts, cx + tsCardW / 2, cy + 44);

    if (sel) {
      ctx.fillStyle = '#4FC3F7';
      ctx.beginPath(); ctx.arc(cx + tsCardW / 2, cy + tsCardH - 4, 3, 0, Math.PI * 2); ctx.fill();
    }
  });
  secY += tsCardH + 20;

  // ═══ MAP SECTION ═══
  sectionLabel('KARTE', secY);
  secY += 14;

  const mapDescs = {
    Erangel: 'Temperate Island',
    Miramar: 'Desert Wasteland',
    Sanhok:  'Tropical Jungle',
    Vikendi: 'Frozen Tundra',
  };
  const mapCardW = (mw - 40 - 12) / 4;
  const mapCardH = 90;
  MAPS.forEach((map, i) => {
    const mc = MAP_COLORS[map];
    const cx = mx + 20 + i * (mapCardW + 4);
    const cy = secY;
    const sel = activeMap === map;

    // Map card gradient background
    const mapGrd = ctx.createLinearGradient(cx, cy, cx, cy + mapCardH);
    mapGrd.addColorStop(0, sel ? mc[1] + '60' : mc[0] + '30');
    mapGrd.addColorStop(1, 'rgba(4,8,26,0.9)');
    ctx.fillStyle = mapGrd;
    ctx.shadowColor = sel ? mc[1] : 'transparent'; ctx.shadowBlur = sel ? 16 : 0;
    roundRect(ctx, cx, cy, mapCardW, mapCardH, 8); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sel ? mc[1] : 'rgba(255,255,255,0.08)'; ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, cx, cy, mapCardW, mapCardH, 8); ctx.stroke();

    // Map color blob
    const blob = ctx.createRadialGradient(cx + mapCardW / 2, cy + 36, 4, cx + mapCardW / 2, cy + 36, 26);
    blob.addColorStop(0, mc[1]); blob.addColorStop(1, mc[0] + '88');
    ctx.fillStyle = blob;
    ctx.beginPath(); ctx.ellipse(cx + mapCardW / 2, cy + 36, 26, 18, 0, 0, Math.PI * 2); ctx.fill();

    // Map icon shape
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(cx + mapCardW / 2, cy + 36, 12, 0, Math.PI * 2); ctx.fill();
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(map === 'Erangel' ? '🌿' : map === 'Miramar' ? '🏜' : map === 'Sanhok' ? '🌴' : '❄️', cx + mapCardW / 2, cy + 42);

    // Name
    ctx.font = `bold 13px "Rajdhani",sans-serif`; ctx.fillStyle = sel ? mc[1] : '#CCC';
    ctx.fillText(map, cx + mapCardW / 2, cy + 66);
    // Desc
    ctx.font = '10px "Rajdhani",sans-serif'; ctx.fillStyle = sel ? mc[1] : '#556';
    ctx.fillText(mapDescs[map], cx + mapCardW / 2, cy + 80);

    if (sel) {
      ctx.fillStyle = mc[1];
      ctx.beginPath(); ctx.arc(cx + mapCardW / 2, cy + mapCardH - 4, 3, 0, Math.PI * 2); ctx.fill();
    }
  });
  secY += mapCardH + 20;

  // ═══ SPIELEN BUTTON ═══
  const btnW = 240, btnH = 52;
  const btnX = W / 2 - btnW / 2, btnY = secY;
  const pulse = Math.sin(playPulse) * 0.04 + 1;
  const g = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
  g.addColorStop(0, '#F0A500'); g.addColorStop(0.5, '#FFB300'); g.addColorStop(1, '#E65100');
  ctx.fillStyle = g;
  ctx.shadowColor = '#F0A500'; ctx.shadowBlur = 28 * pulse;
  roundRect(ctx, btnX, btnY, btnW, btnH, 10); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(ctx, btnX + 4, btnY + 4, btnW - 8, btnH / 2 - 4, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,100,0.6)'; ctx.lineWidth = 1.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 10); ctx.stroke();
  ctx.font = 'bold 22px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
  ctx.fillText(`▶  ${activeMode.toUpperCase()} — ${activeTeamSize.toUpperCase()}`, W / 2, btnY + 33);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// Helper: convert hex color to "r,g,b" string
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ─── MODE SELECTOR ────────────────────────────────────────────────────────────
function drawModeSelector(ctx, W, H) {
  const centerX=W/2, baseY=H-158;

  // Mode pills
  const modeW=100, modeH=34, gap=8;
  const totalW=MODES.length*(modeW+gap)-gap;
  MODES.forEach((m,i)=>{
    const mx=centerX-totalW/2+i*(modeW+gap), my=baseY;
    const sel=activeMode===m;
    ctx.save();
    if(sel){
      ctx.fillStyle='rgba(240,165,0,0.25)';
      ctx.shadowColor='#F0A500'; ctx.shadowBlur=12;
    } else {
      ctx.fillStyle='rgba(5,10,22,0.8)';
    }
    roundRect(ctx,mx,my,modeW,modeH,6); ctx.fill();
    ctx.strokeStyle=sel?'#F0A500':'rgba(255,255,255,0.1)'; ctx.lineWidth=1;
    roundRect(ctx,mx,my,modeW,modeH,6); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font=`${sel?'bold':''} 12px "Rajdhani",sans-serif`;
    ctx.textAlign='center'; ctx.fillStyle=sel?'#F0A500':'#888';
    ctx.fillText(m, mx+modeW/2, my+22);
    if(sel){
      ctx.fillStyle='#F0A500';
      ctx.beginPath(); ctx.arc(mx+modeW/2,my+modeH-2,3,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  });

  // Map selector
  const mapY=baseY+42;
  const mc=MAP_COLORS[activeMap];
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.85)';
  roundRect(ctx,centerX-220,mapY,440,30,6); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
  roundRect(ctx,centerX-220,mapY,440,30,6); ctx.stroke();
  // Map color dot
  const mg=ctx.createLinearGradient(centerX-10,mapY,centerX+10,mapY);
  mg.addColorStop(0,mc[0]); mg.addColorStop(1,mc[1]);
  ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(centerX-100,mapY+15,8,0,Math.PI*2); ctx.fill();
  ctx.font='bold 12px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#CCC';
  ctx.fillText(`🗺  ${activeMap}`, centerX-85, mapY+20);
  ctx.fillStyle='#888'; ctx.textAlign='right'; ctx.font='11px "Rajdhani",sans-serif';
  ctx.fillText('◀  Karte wechseln  ▶', centerX+210, mapY+20);
  ctx.restore();
}

// ─── SQUAD BAR ────────────────────────────────────────────────────────────────
function drawSquadBar(ctx, W, H) {
  const sy=H-120, barW=360, barX=W/2-barW/2;
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.7)';
  roundRect(ctx,barX,sy,barW,28,6); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
  roundRect(ctx,barX,sy,barW,28,6); ctx.stroke();

  ctx.font='10px "Rajdhani",sans-serif'; ctx.fillStyle='#556'; ctx.textAlign='left';
  ctx.fillText(activeTeamSize.toUpperCase(), barX+8, sy+18);

  // Build squad slots from chosen team size: YOU + (teamSize-1) open/filled slots
  const teamSize = getTeamSize();
  const slots = [];
  for (let i = 0; i < teamSize; i++) slots.push(i === 0 ? 'YOU' : (squadSlots[i] || null));

  slots.forEach((name,i)=>{
    const sx2=barX+60+i*72;
    if(name){
      const isMe=name==='YOU';
      ctx.fillStyle=isMe?'rgba(240,165,0,0.3)':'rgba(255,255,255,0.1)';
      roundRect(ctx,sx2,sy+3,64,22,4); ctx.fill();
      if(isMe){ctx.strokeStyle='rgba(240,165,0,0.6)';ctx.lineWidth=1;roundRect(ctx,sx2,sy+3,64,22,4);ctx.stroke();}
      ctx.font=`${isMe?'bold':''} 11px "Rajdhani",sans-serif`;
      ctx.textAlign='center'; ctx.fillStyle=isMe?'#F0A500':'#CCC';
      ctx.fillText(name, sx2+32, sy+18);
    } else {
      ctx.fillStyle='rgba(255,255,255,0.04)';
      roundRect(ctx,sx2,sy+3,64,22,4); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
      roundRect(ctx,sx2,sy+3,64,22,4); ctx.stroke();
      ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,0.2)';
      ctx.fillText('+', sx2+32, sy+21);
    }
  });
  ctx.restore();
}

// ─── PLAY BUTTON ──────────────────────────────────────────────────────────────
function drawPlayButton(ctx, W, H) {
  const bw=220, bh=58, bx=W/2-bw/2, by=H-72;
  const pulse=Math.sin(playPulse)*0.04+1;
  ctx.save();
  ctx.shadowColor='#F0A500';
  ctx.shadowBlur=30*pulse;
  const g=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
  g.addColorStop(0,'#F0A500'); g.addColorStop(0.5,'#FFB300'); g.addColorStop(1,'#E65100');
  ctx.fillStyle=g; roundRect(ctx,bx,by,bw,bh,10); ctx.fill();
  // Shine
  ctx.fillStyle='rgba(255,255,255,0.15)';
  roundRect(ctx,bx+4,by+4,bw-8,bh/2-4,8); ctx.fill();
  ctx.strokeStyle='rgba(255,220,100,0.6)'; ctx.lineWidth=1.5;
  roundRect(ctx,bx,by,bw,bh,10); ctx.stroke();
  ctx.shadowBlur=0;
  ctx.font='bold 26px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#FFF';
  ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=4;
  ctx.fillText('▶  SPIELEN', W/2, by+37);
  ctx.shadowBlur=0;
  ctx.restore();
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function drawBottomNav(ctx, W, H) {
  const navH=58, ny=H-navH;
  const bg=ctx.createLinearGradient(0,ny,0,ny+navH);
  bg.addColorStop(0,'rgba(5,8,18,0.97)'); bg.addColorStop(1,'rgba(3,5,12,0.99)');
  ctx.fillStyle=bg; ctx.fillRect(0,ny,W,navH);
  ctx.strokeStyle='rgba(240,165,0,0.2)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,ny); ctx.lineTo(W,ny); ctx.stroke();

  const tabW=W/BOTTOM_TABS.length;
  BOTTOM_TABS.forEach((tab,i)=>{
    const tx=tabW*i+tabW/2;
    const sel=activeTab===tab.id;
    ctx.save();
    if(sel){
      ctx.fillStyle='rgba(240,165,0,0.12)';
      ctx.fillRect(tx-tabW/2+2,ny,tabW-4,navH);
      ctx.strokeStyle='#F0A500'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(tx-30,ny+1); ctx.lineTo(tx+30,ny+1); ctx.stroke();
    }
    ctx.font='22px sans-serif'; ctx.textAlign='center';
    ctx.globalAlpha=sel?1:0.5;
    ctx.fillText(tab.icon, tx, ny+30);
    ctx.font=`${sel?'bold':''} 10px "Rajdhani",sans-serif`;
    ctx.fillStyle=sel?'#F0A500':'#556';
    ctx.globalAlpha=1;
    ctx.fillText(tab.label, tx, ny+48);
    ctx.restore();
  });
}

// ─── NEWS TICKER ──────────────────────────────────────────────────────────────
function drawNewsTicker(ctx, W, H) {
  const news=NEWS_ITEMS[newsIndex];
  const nx=14, ny=H-175, nw=210, nh=36;
  ctx.save();
  ctx.fillStyle=`rgba(${news.color==='#00BCD4'?'0,60,80':news.color==='#FFD700'?'60,50,0':news.color==='#FF6400'?'80,30,0':'0,50,0'},0.85)`;
  roundRect(ctx,nx,ny,nw,nh,6); ctx.fill();
  ctx.strokeStyle=news.color; ctx.lineWidth=1;
  roundRect(ctx,nx,ny,nw,nh,6); ctx.stroke();
  ctx.fillStyle=news.color; ctx.fillRect(nx,ny,4,nh);
  roundRect(ctx,nx,ny,4,nh,6); ctx.fill();
  ctx.font='bold 9px "Rajdhani",sans-serif'; ctx.textAlign='left';
  ctx.fillStyle=news.color; ctx.fillText(news.tag, nx+10, ny+14);
  ctx.font='11px "Rajdhani",sans-serif'; ctx.fillStyle='#EEE';
  // Wrap text
  const words=news.title.split(' ');
  let line='', ln=0;
  for(const w of words){
    const test=line+w+' ';
    if(ctx.measureText(test).width>nw-20&&ln===0){
      ctx.fillText(line,nx+10,ny+25); line=w+' '; ln++;
    } else line=test;
  }
  ctx.fillText(line,nx+10,ln===0?ny+27:ny+36);
  ctx.restore();
}

// ─── FRIENDS PANEL ────────────────────────────────────────────────────────────
function drawFriendsPanel(ctx, W, H) {
  const px=14, py=70, pw=210;
  const ph=Math.min(H-130, FRIEND_LIST.length*64+50);
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,py,pw,ph,10); ctx.fill();
  ctx.strokeStyle='rgba(100,200,255,0.2)'; ctx.lineWidth=1;
  roundRect(ctx,px,py,pw,ph,10); ctx.stroke();

  ctx.fillStyle='rgba(0,100,150,0.2)'; roundRect(ctx,px,py,pw,36,10); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#4FC3F7';
  ctx.fillText('👥  FREUNDE', px+12, py+23);
  const online=FRIEND_LIST.filter(f=>f.online).length;
  ctx.font='10px sans-serif'; ctx.fillStyle='#4CAF50'; ctx.textAlign='right';
  ctx.fillText(`${online} Online`, px+pw-10, py+23);

  FRIEND_LIST.forEach((f,i)=>{
    const fy=py+46+i*58;
    ctx.fillStyle='rgba(255,255,255,0.03)'; roundRect(ctx,px+6,fy,pw-12,52,6); ctx.fill();
    // Avatar
    ctx.fillStyle=CHARACTER_SKINS[i%CHARACTER_SKINS.length].helmet;
    ctx.beginPath(); ctx.arc(px+26,fy+26,18,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=f.online?'#4CAF50':'#333'; ctx.lineWidth=2; ctx.stroke();
    // Online dot
    ctx.fillStyle=f.online?'#4CAF50':'#555';
    ctx.beginPath(); ctx.arc(px+38,fy+8,5,0,Math.PI*2); ctx.fill();

    ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#EEE';
    ctx.fillText(f.name, px+50, fy+20);
    ctx.font='10px sans-serif'; ctx.fillStyle='#666';
    ctx.fillText(`Lv.${f.level}  •  ${f.status}`, px+50, fy+34);

    if(f.online){
      ctx.fillStyle='rgba(0,100,150,0.4)';
      roundRect(ctx,px+pw-62,fy+14,52,20,4); ctx.fill();
      ctx.strokeStyle='rgba(79,195,247,0.4)'; ctx.lineWidth=1;
      roundRect(ctx,px+pw-62,fy+14,52,20,4); ctx.stroke();
      ctx.font='bold 9px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#4FC3F7';
      ctx.fillText('EINLADEN', px+pw-36, fy+28);
    }
  });
  ctx.restore();
}

// ─── MISSIONS PANEL ───────────────────────────────────────────────────────────
function drawMissionsPanel(ctx, W, H) {
  const px = 14, py = 70, pw = W - 28, ph = H - 160;
  ctx.save();

  // Panel background
  ctx.fillStyle = 'rgba(4,8,20,0.95)';
  roundRect(ctx, px, py, pw, ph, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(240,165,0,0.2)'; ctx.lineWidth = 1.5;
  roundRect(ctx, px, py, pw, ph, 12); ctx.stroke();

  // Header
  ctx.fillStyle = 'rgba(240,165,0,0.12)'; roundRect(ctx, px, py, pw, 44, 12); ctx.fill();
  ctx.font = 'bold 17px "Rajdhani",sans-serif'; ctx.textAlign = 'left';
  ctx.fillStyle = '#F0A500';
  ctx.fillText('📋  AUFGABEN', px + 16, py + 28);

  // Summary row
  const done  = missionsList.filter(m => m.prog >= m.total && !m.claimed).length;
  const total = missionsList.length;
  const claimed = missionsList.filter(m => m.claimed).length;
  ctx.font = '12px "Rajdhani",sans-serif'; ctx.textAlign = 'right';
  ctx.fillStyle = done > 0 ? '#4CAF50' : '#556';
  ctx.fillText(`${done} abholbereit  •  ${claimed}/${total} erledigt`, px + pw - 14, py + 28);

  // Overall XP progress bar
  const totalXP = missionsList.reduce((s, m) => s + m.xp, 0);
  const earnedXP = missionsList.filter(m => m.claimed).reduce((s, m) => s + m.xp, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; roundRect(ctx, px + 14, py + 38, pw - 28, 6, 3); ctx.fill();
  if (totalXP > 0) {
    ctx.fillStyle = '#F0A500';
    roundRect(ctx, px + 14, py + 38, (pw - 28) * (earnedXP / totalXP), 6, 3); ctx.fill();
  }

  // Mission rows
  const rowH  = 68;
  const rowsPerPage = Math.floor((ph - 62) / (rowH + 8));
  const visibleMissions = missionsList.slice(0, rowsPerPage);

  visibleMissions.forEach((m, i) => {
    const ry = py + 54 + i * (rowH + 8);
    const isDone    = missionDone(m);
    const isClaimed = m.claimed;
    const isActive  = missionActive(m);

    // Row background
    if (isClaimed) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
    } else if (isDone) {
      ctx.fillStyle = 'rgba(76,175,80,0.12)';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
    }
    roundRect(ctx, px + 8, ry, pw - 16, rowH, 8); ctx.fill();

    // Left border accent
    ctx.fillStyle = isClaimed ? '#333' : isDone ? '#4CAF50' : '#F0A500';
    ctx.fillRect(px + 8, ry + 6, 3, rowH - 12);

    // Icon
    ctx.font = '22px sans-serif'; ctx.textAlign = 'left';
    ctx.globalAlpha = isClaimed ? 0.35 : 1;
    ctx.fillText(m.icon, px + 18, ry + 26);
    ctx.globalAlpha = 1;

    // Label
    ctx.font = isClaimed ? '12px "Rajdhani",sans-serif' : 'bold 13px "Rajdhani",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = isClaimed ? '#444' : isDone ? '#A5D6A7' : '#DDD';
    ctx.fillText(m.label, px + 46, ry + 20);

    if (isClaimed) {
      // Claimed badge
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#555';
      ctx.fillText('✓ Erledigt & abgeholt', px + 46, ry + 38);
    } else if (isDone) {
      // Completion text
      ctx.font = 'bold 11px "Rajdhani",sans-serif'; ctx.fillStyle = '#4CAF50';
      ctx.fillText('✓ Abgeschlossen!', px + 46, ry + 38);
    } else {
      // Progress bar
      const barW = pw - 180;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, px + 46, ry + 34, barW, 7, 3); ctx.fill();
      ctx.fillStyle = '#F0A500';
      roundRect(ctx, px + 46, ry + 34, barW * Math.min(1, m.prog / m.total), 7, 3); ctx.fill();
      ctx.font = '10px "Rajdhani",sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#777';
      ctx.fillText(`${m.prog} / ${m.total}`, px + 46, ry + 54);
    }

    // XP reward badge
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px "Rajdhani",sans-serif';
    ctx.fillStyle = isClaimed ? '#333' : '#F0A500';
    ctx.fillText(`+${m.xp} XP`, px + pw - 100, ry + 20);
    ctx.fillStyle = isClaimed ? '#333' : '#4FC3F7';
    ctx.fillText(`+${m.bp} BP`, px + pw - 100, ry + 36);

    // ABHOLEN button — only if done and not claimed
    if (isDone) {
      const btnW = 80, btnH = 30;
      const btnX = px + pw - 96, btnY = ry + rowH / 2 - btnH / 2;

      const btnGrd = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
      btnGrd.addColorStop(0, '#4CAF50');
      btnGrd.addColorStop(1, '#2E7D32');
      ctx.fillStyle = btnGrd;
      ctx.shadowColor = 'rgba(76,175,80,0.6)'; ctx.shadowBlur = 12;
      roundRect(ctx, btnX, btnY, btnW, btnH, 6); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 12px "Rajdhani",sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#FFF';
      ctx.fillText('ABHOLEN', btnX + btnW / 2, btnY + 19);

      // Pulse ring
      const pulse = 0.5 + 0.5 * Math.sin(lobbyTime * 4 + i);
      ctx.strokeStyle = `rgba(76,175,80,${pulse * 0.6})`;
      ctx.lineWidth = 2;
      roundRect(ctx, btnX - 2, btnY - 2, btnW + 4, btnH + 4, 7); ctx.stroke();
    }
  });

  ctx.restore();
}

// Hit-test for mission ABHOLEN buttons — returns mission index or -1
function _missionBtnHit(mx, my, W, H) {
  const px = 14, py = 70, pw = W - 28, ph = H - 160;
  const rowH = 68;
  const rowsPerPage = Math.floor((ph - 62) / (rowH + 8));
  for (let i = 0; i < Math.min(missionsList.length, rowsPerPage); i++) {
    const m = missionsList[i];
    if (!missionDone(m)) continue;
    const ry    = py + 54 + i * (rowH + 8);
    const btnW  = 80, btnH = 30;
    const btnX  = px + pw - 96;
    const btnY  = ry + rowH / 2 - btnH / 2;
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) return i;
  }
  return -1;
}

// ─── SHOP PANEL ───────────────────────────────────────────────────────────────
function drawShopPanel(ctx, W, H) {
  const px=14, py=70, pw=210;
  const items=[
    {name:'Iceberg M4',  price:'360 UC',  color:'#00BCD4', hot:true  },
    {name:'Dragon AKM',  price:'240 UC',  color:'#FF4500', hot:false },
    {name:'Neon UMP',    price:'180 UC',  color:'#00FFFF', hot:false },
    {name:'Gold Set',    price:'480 UC',  color:'#FFD700', hot:true  },
    {name:'BP Premium',  price:'360 UC',  color:'#FFD700', hot:false },
  ];
  const ph=items.length*62+50;
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,py,pw,ph,10); ctx.fill();
  ctx.strokeStyle='rgba(255,165,0,0.25)'; ctx.lineWidth=1;
  roundRect(ctx,px,py,pw,ph,10); ctx.stroke();

  ctx.fillStyle='rgba(150,80,0,0.3)'; roundRect(ctx,px,py,pw,36,10); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#F0A500';
  ctx.fillText('🛍  SHOP', px+12, py+23);

  items.forEach((item,i)=>{
    const iy=py+46+i*58;
    ctx.fillStyle='rgba(255,255,255,0.03)'; roundRect(ctx,px+6,iy,pw-12,52,6); ctx.fill();
    // Color swatch
    ctx.fillStyle=item.color; ctx.shadowColor=item.color; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.roundRect(px+10,iy+10,28,32,4); ctx.fill();
    ctx.shadowBlur=0;
    ctx.font=`bold ${item.hot?'12':'11'}px "Rajdhani",sans-serif`; ctx.textAlign='left';
    ctx.fillStyle='#EEE'; ctx.fillText(item.name, px+46, iy+22);
    if(item.hot){
      ctx.fillStyle='#F44336';
      roundRect(ctx,px+46,iy+26,30,14,3); ctx.fill();
      ctx.font='bold 8px "Rajdhani",sans-serif'; ctx.fillStyle='#FFF';
      ctx.fillText('🔥 HOT', px+61, iy+36);
    }
    ctx.fillStyle='#F0A500'; ctx.font='bold 11px "Rajdhani",sans-serif';
    ctx.textAlign='right'; ctx.fillText(item.price, px+pw-10, iy+22);
    ctx.fillStyle='rgba(240,165,0,0.8)';
    roundRect(ctx,px+pw-60,iy+30,50,16,3); ctx.fill();
    ctx.font='bold 9px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#000';
    ctx.fillText('KAUFEN', px+pw-35, iy+42);
  });
  ctx.restore();
}

// ─── INVENTORY PANEL ──────────────────────────────────────────────────────────
function drawInventoryPanel(ctx, W, H) {
  const px=14, py=70, pw=210, ph=H-160;
  ctx.save();
  ctx.fillStyle='rgba(5,10,22,0.9)';
  roundRect(ctx,px,py,pw,ph,10); ctx.fill();
  ctx.strokeStyle='rgba(150,100,200,0.25)'; ctx.lineWidth=1;
  roundRect(ctx,px,py,pw,ph,10); ctx.stroke();

  ctx.fillStyle='rgba(60,20,100,0.3)'; roundRect(ctx,px,py,pw,36,10); ctx.fill();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#CE93D8';
  ctx.fillText('🎒  INVENTAR', px+12, py+23);

  // Tabs
  const tabs=['Skins','Klamotten','Emotes'];
  tabs.forEach((t,i)=>{
    ctx.fillStyle='rgba(255,255,255,0.05)';
    roundRect(ctx,px+8+i*64,py+44,60,22,4); ctx.fill();
    ctx.font='10px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle=i===0?'#CE93D8':'#555';
    ctx.fillText(t, px+38+i*64, py+59);
    if(i===0){ctx.strokeStyle='#CE93D8';ctx.lineWidth=1;roundRect(ctx,px+8+i*64,py+44,60,22,4);ctx.stroke();}
  });

  // Skin grid
  const skinKeys=Object.keys(WEAPON_SKINS);
  skinKeys.forEach((key,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const sw=(pw-28)/2, sh=70;
    const sx=px+8+col*(sw+4), sy=py+76+row*(sh+6);
    const sk=WEAPON_SKINS[key], sel=selectedWeaponSkin===key;

    ctx.fillStyle=sel?'rgba(171,71,188,0.25)':'rgba(255,255,255,0.04)';
    roundRect(ctx,sx,sy,sw,sh,6); ctx.fill();
    if(sel){ctx.strokeStyle='#CE93D8';ctx.lineWidth=2;ctx.shadowColor='#CE93D8';ctx.shadowBlur=8;roundRect(ctx,sx,sy,sw,sh,6);ctx.stroke();ctx.shadowBlur=0;}

    // Color bars
    sk.colors.forEach((c,ci)=>{
      ctx.fillStyle=c;
      if(sk.glow){ctx.shadowColor=sk.glow;ctx.shadowBlur=4;}
      ctx.fillRect(sx+6+ci*16,sy+8,12,30); ctx.shadowBlur=0;
    });
    ctx.font='bold 9px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle=sel?'#CE93D8':'#888';
    ctx.fillText(sk.name.length>10?sk.name.slice(0,9)+'…':sk.name, sx+sw/2, sy+sh-8);
    if(key==='iceberg_m4'){
      ctx.fillStyle='#A8D8EA'; ctx.font='8px sans-serif';
      ctx.fillText('❄ PUBG', sx+sw/2, sy+sh+2);
    }
  });

  // Character skin selector at bottom
  const csY=py+ph-95;
  ctx.fillStyle='rgba(255,255,255,0.05)'; roundRect(ctx,px+6,csY,pw-12,88,6); ctx.fill();
  ctx.font='bold 11px "Rajdhani",sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#CE93D8';
  ctx.fillText('CHARAKTER', px+12, csY+16);
  CHARACTER_SKINS.forEach((s,i)=>{
    const cx2=px+18+i*36, cy2=csY+36;
    const sel=selectedCharSkin===i;
    ctx.fillStyle=s.helmet; ctx.shadowColor=sel?s.accent:'transparent'; ctx.shadowBlur=sel?8:0;
    ctx.beginPath(); ctx.arc(cx2,cy2,14,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=sel?s.accent:'#333'; ctx.lineWidth=sel?2:1; ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle=s.face; ctx.beginPath(); ctx.arc(cx2,cy2,8,0,Math.PI*2); ctx.fill();
    ctx.font='8px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=sel?'#FFF':'#555';
    ctx.fillText(s.name.split(' ')[0], cx2, csY+60);
  });
  ctx.restore();
}

// ─── WARDROBE PANEL ───────────────────────────────────────────────────────────
let wardrobeSelectedChar = playerSkins.character;
let wardrobeSelectedWeapon = playerSkins.weapon;

function drawWardrobePanel(ctx, W, H) {
  const px = 14, py = 70, pw = W - 28, ph = H - 160;
  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(5,10,22,0.93)';
  roundRect(ctx, px, py, pw, ph, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,100,0,0.25)'; ctx.lineWidth = 1.5;
  roundRect(ctx, px, py, pw, ph, 12); ctx.stroke();

  // Header
  ctx.fillStyle = 'rgba(255,100,0,0.15)'; roundRect(ctx, px, py, pw, 40, 12); ctx.fill();
  ctx.font = 'bold 16px "Rajdhani",sans-serif'; ctx.textAlign = 'left';
  ctx.fillStyle = '#FF6400';
  ctx.fillText('👔  SPIND – CHARAKTER & WAFFE ANPASSEN', px + 16, py + 26);

  const halfW = pw / 2 - 12;

  // ── LEFT: Character Skins ──
  const lx = px + 8, ly = py + 52;
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRect(ctx, lx, ly, halfW, ph - 62, 8); ctx.fill();
  ctx.font = 'bold 13px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FF6400';
  ctx.fillText('CHARAKTER SKINS', lx + halfW / 2, ly + 20);

  const cardW = (halfW - 20) / 2;
  const cardH = 155;
  CHARACTER_SKINS.forEach((skin, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = lx + 8 + col * (cardW + 6);
    const cy = ly + 30 + row * (cardH + 8);
    const sel = wardrobeSelectedChar === i;

    // Card bg
    ctx.fillStyle = sel ? 'rgba(255,100,0,0.22)' : 'rgba(255,255,255,0.04)';
    roundRect(ctx, cx, cy, cardW, cardH, 8); ctx.fill();
    if (sel) {
      ctx.strokeStyle = '#FF6400'; ctx.lineWidth = 2;
      ctx.shadowColor = '#FF6400'; ctx.shadowBlur = 12;
      roundRect(ctx, cx, cy, cardW, cardH, 8); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Mini front character preview
    const previewScale = 0.55;
    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, cardW, cardH - 22); ctx.clip();
    drawFrontCharacter(ctx, cx + cardW / 2, cy + cardH - 30, previewScale, skin, WEAPON_SKINS[wardrobeSelectedWeapon], 0);
    ctx.restore();

    // Name label
    ctx.font = sel ? 'bold 11px "Rajdhani",sans-serif' : '10px "Rajdhani",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = sel ? '#FF6400' : '#AAA';
    ctx.fillText(skin.name, cx + cardW / 2, cy + cardH - 6);

    // AUSGEWÄHLT badge
    if (sel) {
      ctx.fillStyle = '#FF6400'; roundRect(ctx, cx + cardW / 2 - 28, cy + 4, 56, 16, 4); ctx.fill();
      ctx.font = 'bold 9px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF';
      ctx.fillText('AKTIV', cx + cardW / 2, cy + 15);
    }
  });

  // ── RIGHT: Weapon Skins ──
  const rx = px + halfW + 20, ry = py + 52;
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRect(ctx, rx, ry, halfW, ph - 62, 8); ctx.fill();
  ctx.font = 'bold 13px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFD700';
  ctx.fillText('WAFFEN SKINS', rx + halfW / 2, ry + 20);

  const wCardW = (halfW - 20) / 2;
  const wCardH = 88;
  const skinKeys = Object.keys(WEAPON_SKINS);
  skinKeys.forEach((key, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const wx2 = rx + 8 + col * (wCardW + 6);
    const wy2 = ry + 30 + row * (wCardH + 8);
    const sk = WEAPON_SKINS[key];
    const sel = wardrobeSelectedWeapon === key;

    ctx.fillStyle = sel ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.04)';
    roundRect(ctx, wx2, wy2, wCardW, wCardH, 6); ctx.fill();
    if (sel) {
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
      roundRect(ctx, wx2, wy2, wCardW, wCardH, 6); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Color swatches
    sk.colors.forEach((c, ci) => {
      ctx.fillStyle = c;
      if (sk.glow) { ctx.shadowColor = sk.glow; ctx.shadowBlur = 6; }
      roundRect(ctx, wx2 + 6 + ci * 22, wy2 + 10, 18, 36, 3); ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (sk.special === 'ice') {
      ctx.font = '14px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#A8D8EA';
      ctx.fillText('❄', wx2 + wCardW - 22, wy2 + 30);
    } else if (sk.special === 'fire') {
      ctx.font = '14px sans-serif'; ctx.fillText('🔥', wx2 + wCardW - 22, wy2 + 30);
    } else if (sk.special === 'electric') {
      ctx.font = '14px sans-serif'; ctx.fillText('⚡', wx2 + wCardW - 22, wy2 + 30);
    }

    ctx.font = sel ? 'bold 10px "Rajdhani",sans-serif' : '9px "Rajdhani",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = sel ? '#FFD700' : '#888';
    ctx.fillText(sk.name.length > 12 ? sk.name.slice(0, 11) + '…' : sk.name, wx2 + wCardW / 2, wy2 + wCardH - 8);

    if (sel) {
      ctx.fillStyle = '#FFD700'; roundRect(ctx, wx2 + wCardW / 2 - 20, wy2 + 4, 40, 14, 3); ctx.fill();
      ctx.font = 'bold 8px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000';
      ctx.fillText('AKTIV', wx2 + wCardW / 2, wy2 + 14);
    }
  });

  // Apply button
  const btnW = 180, btnH = 36;
  const btnX = px + pw / 2 - btnW / 2, btnY = py + ph - 46;
  const btnGrd = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
  btnGrd.addColorStop(0, '#FF7D00'); btnGrd.addColorStop(1, '#CC4400');
  ctx.fillStyle = btnGrd;
  ctx.shadowColor = 'rgba(255,100,0,0.5)'; ctx.shadowBlur = 16;
  roundRect(ctx, btnX, btnY, btnW, btnH, 8); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = 'bold 15px "Rajdhani",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF';
  ctx.fillText('✓  ÜBERNEHMEN', btnX + btnW / 2, btnY + 23);

  ctx.restore();
}

// Wardrobe click state storage
let _wardHitAreas = [];
function _updateWardrobeHits(W, H) {
  const px = 14, py = 70, pw = W - 28, ph = H - 160;
  const halfW = pw / 2 - 12;
  const cardW = (halfW - 20) / 2;
  const cardH = 155;
  const lx = px + 8, ly = py + 52;
  _wardHitAreas = [];

  CHARACTER_SKINS.forEach((_, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    _wardHitAreas.push({ type: 'char', index: i,
      x: lx + 8 + col * (cardW + 6), y: ly + 30 + row * (cardH + 8), w: cardW, h: cardH });
  });

  const rx = px + halfW + 20, ry = py + 52;
  const wCardW = (halfW - 20) / 2;
  const wCardH = 88;
  Object.keys(WEAPON_SKINS).forEach((key, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    _wardHitAreas.push({ type: 'weapon', key,
      x: rx + 8 + col * (wCardW + 6), y: ry + 30 + row * (wCardH + 8), w: wCardW, h: wCardH });
  });

  const btnW = 180, btnH = 36;
  _wardHitAreas.push({ type: 'apply',
    x: px + pw / 2 - btnW / 2, y: py + ph - 46, w: btnW, h: btnH });
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
function drawNotification(ctx, W, H) {
  const a=Math.min(1, notifTimer/0.5);
  ctx.save();
  ctx.globalAlpha=a;
  ctx.fillStyle='rgba(30,20,5,0.95)';
  roundRect(ctx,W/2-150,80,300,44,8); ctx.fill();
  ctx.strokeStyle='#F0A500'; ctx.lineWidth=1.5;
  roundRect(ctx,W/2-150,80,300,44,8); ctx.stroke();
  ctx.font='bold 13px "Rajdhani",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#F0A500';
  ctx.fillText(notification, W/2, 107);
  ctx.restore();
}

function showNotification(msg) { notification=msg; notifTimer=2.5; }

// ─── MODE MENU CLICK HANDLER ──────────────────────────────────────────────────
function _handleModeMenuClick(mx, my, W, H) {
  const mw = Math.min(780, W - 40), mh = Math.min(560, H - 80);
  const panelX = W / 2 - mw / 2, panelY = H / 2 - mh / 2;

  // Close button
  if (mx >= panelX + mw - 36 && mx <= panelX + mw - 8 && my >= panelY + 10 && my <= panelY + 46) {
    modeMenuOpen = false; return;
  }
  // Click outside panel
  if (mx < panelX || mx > panelX + mw || my < panelY || my > panelY + mh) {
    modeMenuOpen = false; return;
  }

  let secY = panelY + 78;

  // Mode cards
  const modeCardW = (mw - 40 - 12) / 4;
  const modeCardH = 72;
  MODES.forEach((mode, i) => {
    const cx = panelX + 20 + i * (modeCardW + 4);
    if (mx >= cx && mx <= cx + modeCardW && my >= secY && my <= secY + modeCardH) {
      activeMode = mode; showNotification(`Modus: ${mode}`);
    }
  });
  secY += modeCardH + 34;

  // Team size cards
  const TEAM_SIZES = ['Solo', 'Duo', 'Trio', 'Squad'];
  const tsCardW = (mw - 40 - 12) / 4;
  const tsCardH = 54;
  TEAM_SIZES.forEach((ts, i) => {
    const cx = panelX + 20 + i * (tsCardW + 4);
    if (mx >= cx && mx <= cx + tsCardW && my >= secY && my <= secY + tsCardH) {
      activeTeamSize = ts; showNotification(`Teamgröße: ${ts}`);
    }
  });
  secY += tsCardH + 34;

  // Map cards
  const mapCardW = (mw - 40 - 12) / 4;
  const mapCardH = 90;
  MAPS.forEach((map, i) => {
    const cx = panelX + 20 + i * (mapCardW + 4);
    if (mx >= cx && mx <= cx + mapCardW && my >= secY && my <= secY + mapCardH) {
      activeMap = map; showNotification(`Karte: ${map}`);
    }
  });
  secY += mapCardH + 20;

  // SPIELEN button
  const btnW = 240, btnH = 52;
  const btnX = W / 2 - btnW / 2, btnY = secY;
  if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
    modeMenuOpen = false;
    window.goToPregame();
  }
}

// ─── INTERACTION ──────────────────────────────────────────────────────────────
function setupLobbyInteraction() {
  lobbyCanvas.addEventListener('click', e=>{
    const r=lobbyCanvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(lobbyCanvas.width/r.width);
    const my=(e.clientY-r.top)*(lobbyCanvas.height/r.height);
    const W=lobbyCanvas.width, H=lobbyCanvas.height;

    // Mode menu open — handle menu clicks first
    if (modeMenuOpen) {
      _handleModeMenuClick(mx, my, W, H);
      return;
    }

    // Play button — open mode menu
    const bw=220, bh=58, bx=W/2-bw/2, by=H-72;
    if(mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh){ modeMenuOpen = true; return; }

    // Bottom nav tabs
    const navH=58, ny=H-navH, tabW=W/BOTTOM_TABS.length;
    if(my>=ny){
      BOTTOM_TABS.forEach((tab,i)=>{
        const tx=tabW*i;
        if(mx>=tx&&mx<=tx+tabW){ activeTab=tab.id; }
      });
      return;
    }

    // Mode selector
    const baseY=H-158, modeW=100, gap=8;
    const totalMW=MODES.length*(modeW+gap)-gap;
    MODES.forEach((m,i)=>{
      const mmx=W/2-totalMW/2+i*(modeW+gap);
      if(mx>=mmx&&mx<=mmx+modeW&&my>=baseY&&my<=baseY+34){ activeMode=m; showNotification(`Modus: ${m}`); }
    });

    // Map cycle
    if(my>=H-116&&my<=H-86&&mx>=W/2-220&&mx<=W/2+220){
      const idx=(MAPS.indexOf(activeMap)+1)%MAPS.length;
      activeMap=MAPS[idx]; showNotification(`Karte: ${activeMap}`);
    }

    // Weapon skin dots
    const wsDots=Object.keys(WEAPON_SKINS);
    const dotsY=H-155-175+170; // approximate weapon showcase dots Y
    // Right panel weapon showcase click
    const pw=210, px=W-pw-14;
    const dotsAbsY=70+155;
    wsDots.forEach((key,i)=>{
      const dx=px+12+i*(pw-24)/wsDots.length+(pw-24)/(wsDots.length*2);
      const dy=dotsAbsY;
      if(Math.hypot(mx-dx,my-dy)<14){
        selectedWeaponSkin=key; playerSkins.weapon=key;
        showNotification(`Skin: ${WEAPON_SKINS[key].name}`);
      }
    });

    // Missions ABHOLEN button clicks
    if (activeTab === 'missions') {
      const hitIdx = _missionBtnHit(mx, my, W, H);
      if (hitIdx >= 0) {
        const m = missionsList[hitIdx];
        m.claimed = true;
        bpXP      = Math.min(100, bpXP + Math.floor(m.bp / 10));
        playerLevel = playerLevel; // XP could level up player
        bpAmount  += m.bp;
        showNotification(`✓ +${m.xp} XP  •  +${m.bp} BP erhalten!`);
        return;
      }
    }

    // Wardrobe tab clicks
    if (activeTab === 'wardrobe') {
      _updateWardrobeHits(W, H);
      for (const hit of _wardHitAreas) {
        if (mx >= hit.x && mx <= hit.x + hit.w && my >= hit.y && my <= hit.y + hit.h) {
          if (hit.type === 'char') {
            wardrobeSelectedChar = hit.index;
            showNotification(`Charakter: ${CHARACTER_SKINS[hit.index].name}`);
          } else if (hit.type === 'weapon') {
            wardrobeSelectedWeapon = hit.key;
            showNotification(`Waffen-Skin: ${WEAPON_SKINS[hit.key].name}`);
          } else if (hit.type === 'apply') {
            playerSkins.character = wardrobeSelectedChar;
            playerSkins.weapon = wardrobeSelectedWeapon;
            selectedCharSkin = wardrobeSelectedChar;
            selectedWeaponSkin = wardrobeSelectedWeapon;
            showNotification('✓ Auswahl gespeichert!');
          }
          return;
        }
      }
    }

    // Inventory character skins
    if(activeTab==='inventory'){
      const csBaseY=70+(H-160)-95;
      CHARACTER_SKINS.forEach((s,i)=>{
        const cx2=px+18-pw-14+14+18+i*36, cy2=csBaseY+36;
        // left panel version
        const lcx=14+18+i*36;
        if(Math.hypot(mx-lcx,my-cy2)<18){
          selectedCharSkin=i; playerSkins.character=i;
          showNotification(`Charakter: ${s.name}`);
        }
      });
    }
  });
}
