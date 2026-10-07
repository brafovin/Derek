// ─── WEAPON DEFINITIONS ───────────────────────────────────────────────────────

const WEAPON_SKINS = {
  default:    { name: 'Default',       colors: ['#8a8a8a','#5a5a5a','#aaaaaa'], glow: null,          special: null },
  gold:       { name: 'Gold',          colors: ['#FFD700','#B8860B','#FFF176'], glow: '#FFD70088',   special: null },
  carbon:     { name: 'Carbon',        colors: ['#2a2a2a','#1a1a1a','#444444'], glow: null,          special: null },
  dragon:     { name: 'Dragon',        colors: ['#FF4500','#8B0000','#FF6347'], glow: '#FF450088',   special: 'fire' },
  neon:       { name: 'Neon Cyber',    colors: ['#00FFFF','#0080FF','#80FFFF'], glow: '#00FFFF88',   special: 'electric' },
  midnight:   { name: 'Midnight',      colors: ['#4B0082','#2E0057','#8B00FF'], glow: '#8B00FF66',   special: null },
  iceberg_m4: { name: 'Iceberg M4',    colors: ['#A8D8EA','#64B5F6','#E3F2FD'], glow: '#00BCD488',  special: 'ice',
                weaponLock: 'm4a1' },
};

const WEAPONS = [
  {
    id: 'glock',    name: 'Glock 17',      type: 'pistol',
    damage: 25, fireRate: 350, bulletSpeed: 600, spread: 0.05,
    mag: 15, reloadTime: 1200, bulletColor: '#FFE566', bulletSize: 4,
    range: 500, pellets: 1, isExplosive: false, isMelee: false,
    icon: 'P', color: '#4FC3F7',
  },
  {
    id: 'deagle',   name: 'Desert Eagle',  type: 'pistol',
    damage: 55, fireRate: 650, bulletSpeed: 750, spread: 0.03,
    mag: 7, reloadTime: 1500, bulletColor: '#FFD700', bulletSize: 5,
    range: 650, pellets: 1, isExplosive: false, isMelee: false,
    icon: 'DE', color: '#FFA726',
  },
  {
    id: 'ump9',     name: 'UMP-9',         type: 'smg',
    damage: 18, fireRate: 110, bulletSpeed: 520, spread: 0.10,
    mag: 25, reloadTime: 1800, bulletColor: '#FFEB3B', bulletSize: 3,
    range: 380, pellets: 1, isExplosive: false, isMelee: false,
    icon: 'SMG', color: '#66BB6A',
  },
  {
    id: 'shotgun',  name: 'S686 Shotgun',  type: 'shotgun',
    damage: 15, fireRate: 800, bulletSpeed: 420, spread: 0.28,
    mag: 6, reloadTime: 2200, bulletColor: '#FF8C00', bulletSize: 3,
    range: 250, pellets: 9, isExplosive: false, isMelee: false,
    icon: 'SG', color: '#EF5350',
  },
  {
    id: 'ak47',     name: 'AKM',           type: 'ar',
    damage: 36, fireRate: 155, bulletSpeed: 680, spread: 0.09,
    mag: 30, reloadTime: 2000, bulletColor: '#FFE066', bulletSize: 4,
    range: 500, pellets: 1, isExplosive: false, isMelee: false,
    icon: 'AK', color: '#FF7043',
  },
  {
    id: 'm4a1',     name: 'M416',          type: 'ar',
    damage: 29, fireRate: 100, bulletSpeed: 720, spread: 0.045,
    mag: 30, reloadTime: 1900, bulletColor: '#E8F5E9', bulletSize: 4,
    range: 560, pellets: 1, isExplosive: false, isMelee: false,
    icon: 'M4', color: '#29B6F6',
  },
  {
    id: 'awm',      name: 'AWM Sniper',    type: 'sniper',
    damage: 105, fireRate: 1300, bulletSpeed: 1400, spread: 0.005,
    mag: 5, reloadTime: 3000, bulletColor: '#E0F7FA', bulletSize: 6,
    range: 1200, pellets: 1, isExplosive: false, isMelee: false,
    icon: 'AWM', color: '#AB47BC',
  },
  {
    id: 'rpg',      name: 'RPG-7',         type: 'launcher',
    damage: 140, fireRate: 2500, bulletSpeed: 320, spread: 0.01,
    mag: 1, reloadTime: 3500, bulletColor: '#FF6B35', bulletSize: 8,
    range: 900, pellets: 1, isExplosive: true, explosionRadius: 100, isMelee: false,
    icon: 'RPG', color: '#FF5722',
  },
  {
    id: 'knife',    name: 'Combat Knife',  type: 'melee',
    damage: 250, fireRate: 450, bulletSpeed: 0, spread: 0,
    mag: Infinity, reloadTime: 0, bulletColor: '#FFFFFF', bulletSize: 0,
    range: 55, pellets: 1, isExplosive: false, isMelee: true,
    icon: '🔪', color: '#E0E0E0',
  },
];

// Per-player selections
const playerSkins = { weapon: 'default', character: 0 };

// Character skin definitions — human-realistic palette
const CHARACTER_SKINS = [
  {
    name: 'Shadow Ops',
    face: '#C68642', hair: '#1A1A1A', helmet: '#1C2333',
    shirt: '#2C3E50', vest: '#1A252F', pants: '#1E3A2F',
    boots: '#111',   accent: '#E74C3C',
  },
  {
    name: 'Desert Fox',
    face: '#D4956A', hair: '#3D2B1F', helmet: '#B8956A',
    shirt: '#C9A96E', vest: '#A07850', pants: '#8B7355',
    boots: '#5C4033', accent: '#FF8F00',
  },
  {
    name: 'Urban Ghost',
    face: '#FDBCB4', hair: '#2C2C2C', helmet: '#424949',
    shirt: '#5D6D7E', vest: '#4A5568', pants: '#37474F',
    boots: '#212121', accent: '#2ECC71',
  },
  {
    name: 'Red Viper',
    face: '#C68642', hair: '#000', helmet: '#641E16',
    shirt: '#922B21', vest: '#7B241C', pants: '#5B1111',
    boots: '#2C0000', accent: '#FF6B6B',
  },
  {
    name: 'Arctic Wolf',
    face: '#F5CBA7', hair: '#ECF0F1', helmet: '#BDC3C7',
    shirt: '#ECF0F1', vest: '#95A5A6', pants: '#7F8C8D',
    boots: '#566573', accent: '#8E44AD',
  },
];

// Vehicle color presets
const VEHICLE_PRESETS = [
  { name: 'Sedan',   color: '#1565C0', color2: '#0D47A1', type: 'sedan'  },
  { name: 'Pickup',  color: '#2E7D32', color2: '#1B5E20', type: 'pickup' },
  { name: 'Buggy',   color: '#F57F17', color2: '#E65100', type: 'buggy'  },
  { name: 'Muscle',  color: '#B71C1C', color2: '#7F0000', type: 'sedan'  },
];
