'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyC'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

const SPEED_BOOST_DURATION = 5;
const SPEED_POWERUP_DROP_CHANCE = 0.2;
const SPEED_POWERUP_TTL = 8;
const SHIELD_DURATION = 7;
const SHIELD_POWERUP_DROP_CHANCE = 0.14;
const SHIELD_POWERUP_TTL = 8;
const TRIPLE_SHOT_DURATION = 5;
const TRIPLE_POWERUP_DROP_CHANCE = 0.2;
const TRIPLE_POWERUP_TTL = 8;
const TRIPLE_SHOT_SPREAD = 4 * Math.PI / 180;
const SHOOTING_STAR_SPAWN_INTERVAL = 15;
const SHOOTING_STAR_TTL = 8;
const SHOOTING_STAR_SPEED = 180;
const SHOOTING_STAR_TRAIL_INTERVAL = 0.05;
const SHOOTING_STAR_POINTS_LARGE = 200;
const SHOOTING_STAR_POINTS_SMALL = 100;
const SKIN_STORAGE_KEY = 'asteroidsSkinIndex';

const SHIP_SKINS = [
  {
    id: 'classic',
    name: 'CLASSIC',
    stroke: '#fff',
    thrust: 'rgba(255, 130, 0, 0.85)',
    drawBody(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(20 * scale, 0);
      ctx.lineTo(-12 * scale, -9 * scale);
      ctx.lineTo(-7 * scale, 0);
      ctx.lineTo(-12 * scale, 9 * scale);
      ctx.closePath();
      ctx.stroke();
    },
    drawThruster(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(-8 * scale, -4 * scale);
      ctx.lineTo((-8 - rand(6, 14)) * scale, 0);
      ctx.lineTo(-8 * scale, 4 * scale);
      ctx.stroke();
    }
  },
  {
    id: 'nova',
    name: 'NOVA',
    stroke: '#66d9ff',
    thrust: 'rgba(102, 217, 255, 0.95)',
    drawBody(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(21 * scale, 0);
      ctx.lineTo(-3 * scale, -6 * scale);
      ctx.lineTo(-12 * scale, -12 * scale);
      ctx.lineTo(-9 * scale, -2 * scale);
      ctx.lineTo(-17 * scale, 0);
      ctx.lineTo(-9 * scale, 2 * scale);
      ctx.lineTo(-12 * scale, 12 * scale);
      ctx.lineTo(-3 * scale, 6 * scale);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-2 * scale, -5 * scale);
      ctx.lineTo(6 * scale, 0);
      ctx.lineTo(-2 * scale, 5 * scale);
      ctx.stroke();
    },
    drawThruster(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(-11 * scale, -5 * scale);
      ctx.lineTo((-16 - rand(4, 10)) * scale, -2 * scale);
      ctx.moveTo(-11 * scale, 5 * scale);
      ctx.lineTo((-16 - rand(4, 10)) * scale, 2 * scale);
      ctx.stroke();
    }
  },
  {
    id: 'wraith',
    name: 'WRAITH',
    stroke: '#ff77ff',
    thrust: 'rgba(193, 120, 255, 0.95)',
    drawBody(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(22 * scale, 0);
      ctx.lineTo(4 * scale, -5 * scale);
      ctx.lineTo(-8 * scale, -10 * scale);
      ctx.lineTo(-14 * scale, -4 * scale);
      ctx.lineTo(-9 * scale, 0);
      ctx.lineTo(-14 * scale, 4 * scale);
      ctx.lineTo(-8 * scale, 10 * scale);
      ctx.lineTo(4 * scale, 5 * scale);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-2 * scale, -4 * scale);
      ctx.lineTo(10 * scale, 0);
      ctx.lineTo(-2 * scale, 4 * scale);
      ctx.stroke();
    },
    drawThruster(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(-10 * scale, -3 * scale);
      ctx.lineTo((-19 - rand(5, 12)) * scale, 0);
      ctx.lineTo(-10 * scale, 3 * scale);
      ctx.stroke();
    }
  },
  {
    id: 'vanguard',
    name: 'VANGUARD',
    stroke: '#8aff80',
    thrust: 'rgba(138, 255, 128, 0.9)',
    drawBody(scale = 1) {
      ctx.beginPath();
      ctx.moveTo(18 * scale, 0);
      ctx.lineTo(4 * scale, -8 * scale);
      ctx.lineTo(-8 * scale, -8 * scale);
      ctx.lineTo(-15 * scale, -4 * scale);
      ctx.lineTo(-11 * scale, 0);
      ctx.lineTo(-15 * scale, 4 * scale);
      ctx.lineTo(-8 * scale, 8 * scale);
      ctx.lineTo(4 * scale, 8 * scale);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5 * scale, -8 * scale);
      ctx.lineTo(10 * scale, 0);
      ctx.lineTo(5 * scale, 8 * scale);
      ctx.stroke();
    },
    drawThruster(scale = 1) {
      const pulse = rand(4, 9);
      ctx.beginPath();
      ctx.moveTo(-12 * scale, -5 * scale);
      ctx.lineTo((-12 - pulse) * scale, 0);
      ctx.lineTo(-12 * scale, 5 * scale);
      ctx.stroke();
    }
  }
];

function loadSkinIndex() {
  try {
    const raw = window.localStorage.getItem(SKIN_STORAGE_KEY);
    const index = Number.parseInt(raw, 10);
    return Number.isInteger(index) && index >= 0 && index < SHIP_SKINS.length ? index : 0;
  } catch {
    return 0;
  }
}

function saveSkinIndex(index) {
  try {
    window.localStorage.setItem(SKIN_STORAGE_KEY, String(index));
  } catch {
    // Ignora fallos de persistencia para no interrumpir la partida.
  }
}

function getCurrentSkin() {
  return SHIP_SKINS[currentSkinIndex];
}

function cycleShipSkin() {
  currentSkinIndex = (currentSkinIndex + 1) % SHIP_SKINS.length;
  saveSkinIndex(currentSkinIndex);
}

function drawShipSkin(skin, scale = 1, thrusting = false) {
  ctx.strokeStyle = skin.stroke;
  skin.drawBody(scale);

  if (thrusting && Math.random() > 0.35) {
    ctx.strokeStyle = skin.thrust;
    skin.drawThruster(scale);
  }
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3, kind = 'normal') {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.kind = kind;
    this.radius = RADII[size];
    this.dead = false;
    this.ttl = kind === 'shootingStar' ? SHOOTING_STAR_TTL : 0;
    this.trailTimer = 0;

    const angle = rand(0, Math.PI * 2);
    const speed = kind === 'shootingStar'
      ? SHOOTING_STAR_SPEED
      : SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;

    if (this.kind === 'shootingStar') {
      this.ttl -= dt;
      this.trailTimer += dt;
      while (this.trailTimer >= SHOOTING_STAR_TRAIL_INTERVAL) {
        this.trailTimer -= SHOOTING_STAR_TRAIL_INTERVAL;
        particles.push(new Particle(this.x, this.y, {
          angle: Math.atan2(this.vy, this.vx) + Math.PI,
          speedMin: 35,
          speedMax: 80,
          spread: 0.45,
          lifeMin: 0.18,
          lifeMax: 0.38,
        }));
      }

      if (this.ttl <= 0) this.dead = true;
    }
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1, this.kind),
      new Asteroid(this.x, this.y, this.size - 1, this.kind),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.kind === 'shootingStar' ? '#ffd966' : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoostTimer = 0;
    this.shieldTimer = 0;
    this.tripleShotTimer = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoostTimer > 0) this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.tripleShotTimer > 0) this.tripleShotTimer = Math.max(0, this.tripleShotTimer - dt);

    const ROT   = 3.5;   // rad/s
    const THRUST = this.speedBoostTimer > 0 ? 520 : 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShotTimer <= 0) return [new Bullet(ox, oy, this.angle)];
    return [
      new Bullet(ox, oy, this.angle - TRIPLE_SHOT_SPREAD),
      new Bullet(ox, oy, this.angle),
      new Bullet(ox, oy, this.angle + TRIPLE_SHOT_SPREAD),
    ];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = getCurrentSkin();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    drawShipSkin(skin, 1, this.thrusting);

    if (this.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = this.shieldTimer < 2 && Math.floor(this.shieldTimer * 10) % 2 === 0
        ? 'rgba(80, 255, 200, 0.45)'
        : 'rgba(80, 255, 200, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, opts = {}) {
    this.x  = x;
    this.y  = y;
    const angle = opts.angle === undefined
      ? rand(0, Math.PI * 2)
      : opts.angle + rand(-(opts.spread || 0), opts.spread || 0);
    const speed = rand(opts.speedMin || 30, opts.speedMax || 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(opts.lifeMin || 0.4, opts.lifeMax || 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up de velocidad ─────────────────────────────────────────────────────
class SpeedPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 10;
    this.ttl = SPEED_POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#66d9ff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(0, -5);
    ctx.lineTo(3, -1);
    ctx.lineTo(0, -1);
    ctx.lineTo(4, -8);
    ctx.lineTo(0, 1);
    ctx.lineTo(-3, 1);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-up de escudo ────────────────────────────────────────────────────────
class ShieldPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 10;
    this.ttl = SHIELD_POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#50ffc8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 5, Math.PI * 0.2, Math.PI * 0.8);
    ctx.moveTo(-5, 0);
    ctx.lineTo(-3, 5);
    ctx.lineTo(3, 5);
    ctx.lineTo(5, 0);
    ctx.stroke();
    ctx.restore();
  }
}

class TripleShotPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 10;
    this.ttl = TRIPLE_POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#ff66cc';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, 4);
    ctx.lineTo(-1, -6);
    ctx.lineTo(0, 2);
    ctx.lineTo(1, -6);
    ctx.lineTo(5, 4);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, speedPowerUps, shieldPowerUps, tripleShotPowerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarSpawnTimer;
let currentSkinIndex = loadSkinIndex();

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const edge = randInt(0, 3);
  let x = 0;
  let y = 0;

  if (edge === 0) {
    x = 0;
    y = rand(0, H);
  } else if (edge === 1) {
    x = W;
    y = rand(0, H);
  } else if (edge === 2) {
    x = rand(0, W);
    y = 0;
  } else {
    x = rand(0, W);
    y = H;
  }

  const star = new Asteroid(x, y, 3, 'shootingStar');
  const targetX = rand(W * 0.2, W * 0.8);
  const targetY = rand(H * 0.2, H * 0.8);
  const angle = Math.atan2(targetY - y, targetX - x);
  star.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
  star.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
  asteroids.push(star);
}

function getAsteroidPoints(asteroid) {
  if (asteroid.kind !== 'shootingStar') return POINTS[asteroid.size];
  return asteroid.size === 3 ? SHOOTING_STAR_POINTS_LARGE : SHOOTING_STAR_POINTS_SMALL;
}

function maybeDropPowerUp(asteroid) {
  if (asteroid.kind === 'shootingStar') return;
  if (Math.random() < SHIELD_POWERUP_DROP_CHANCE) {
    shieldPowerUps.push(new ShieldPowerUp(asteroid.x, asteroid.y));
    return;
  }
  if (Math.random() < SPEED_POWERUP_DROP_CHANCE) {
    speedPowerUps.push(new SpeedPowerUp(asteroid.x, asteroid.y));
    return;
  }
  if (Math.random() < TRIPLE_POWERUP_DROP_CHANCE) {
    tripleShotPowerUps.push(new TripleShotPowerUp(asteroid.x, asteroid.y));
  }
}

function destroyAsteroid(asteroid, fragments) {
  asteroid.dead = true;
  score += getAsteroidPoints(asteroid);
  explode(asteroid.x, asteroid.y, asteroid.size * 5);
  maybeDropPowerUp(asteroid);
  fragments.push(...asteroid.split());
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  speedPowerUps = [];
  shieldPowerUps = [];
  tripleShotPowerUps = [];
  shootingStarSpawnTimer = SHOOTING_STAR_SPAWN_INTERVAL;
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  speedPowerUps = [];
  shieldPowerUps = [];
  tripleShotPowerUps = [];
  shootingStarSpawnTimer = SHOOTING_STAR_SPAWN_INTERVAL;
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (pressed('KeyC')) cycleShipSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    speedPowerUps.forEach(powerUp => powerUp.update(dt));
    shieldPowerUps.forEach(powerUp => powerUp.update(dt));
    tripleShotPowerUps.forEach(powerUp => powerUp.update(dt));
    particles = particles.filter(p => !p.dead);
    speedPowerUps = speedPowerUps.filter(powerUp => !powerUp.dead);
    shieldPowerUps = shieldPowerUps.filter(powerUp => !powerUp.dead);
    tripleShotPowerUps = tripleShotPowerUps.filter(powerUp => !powerUp.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    speedPowerUps.forEach(powerUp => powerUp.update(dt));
    shieldPowerUps.forEach(powerUp => powerUp.update(dt));
    tripleShotPowerUps.forEach(powerUp => powerUp.update(dt));
    particles = particles.filter(p => !p.dead);
    speedPowerUps = speedPowerUps.filter(powerUp => !powerUp.dead);
    shieldPowerUps = shieldPowerUps.filter(powerUp => !powerUp.dead);
    tripleShotPowerUps = tripleShotPowerUps.filter(powerUp => !powerUp.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  shootingStarSpawnTimer -= dt;
  if (shootingStarSpawnTimer <= 0) {
    spawnShootingStar();
    shootingStarSpawnTimer = SHOOTING_STAR_SPAWN_INTERVAL;
  }
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  speedPowerUps.forEach(powerUp => powerUp.update(dt));
  shieldPowerUps.forEach(powerUp => powerUp.update(dt));
  tripleShotPowerUps.forEach(powerUp => powerUp.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  asteroids = asteroids.filter(a => !a.dead);
  particles = particles.filter(p => !p.dead);
  speedPowerUps = speedPowerUps.filter(powerUp => !powerUp.dead);
  shieldPowerUps = shieldPowerUps.filter(powerUp => !powerUp.dead);
  tripleShotPowerUps = tripleShotPowerUps.filter(powerUp => !powerUp.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        destroyAsteroid(a, newAsteroids);
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldTimer > 0) {
          const shieldFragments = [];
          destroyAsteroid(a, shieldFragments);
          asteroids = asteroids.filter(asteroid => !asteroid.dead).concat(shieldFragments);
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Nave vs power-ups
  for (const powerUp of speedPowerUps) {
    if (!powerUp.dead && dist(ship, powerUp) < ship.radius + powerUp.radius) {
      powerUp.dead = true;
      ship.speedBoostTimer = SPEED_BOOST_DURATION;
    }
  }
  for (const powerUp of shieldPowerUps) {
    if (!powerUp.dead && dist(ship, powerUp) < ship.radius + powerUp.radius) {
      powerUp.dead = true;
      ship.shieldTimer = SHIELD_DURATION;
    }
  }
  for (const powerUp of tripleShotPowerUps) {
    if (!powerUp.dead && dist(ship, powerUp) < ship.radius + powerUp.radius) {
      powerUp.dead = true;
      ship.tripleShotTimer = TRIPLE_SHOT_DURATION;
    }
  }
  speedPowerUps = speedPowerUps.filter(powerUp => !powerUp.dead);
  shieldPowerUps = shieldPowerUps.filter(powerUp => !powerUp.dead);
  tripleShotPowerUps = tripleShotPowerUps.filter(powerUp => !powerUp.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = getCurrentSkin();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  drawShipSkin(skin, 0.45, false);
  ctx.restore();
}

function drawHUD() {
  const statusBars = [];

  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (ship.speedBoostTimer > 0) {
    statusBars.push({
      label: `VELOCIDAD ${ship.speedBoostTimer.toFixed(1)}s`,
      color: '#66d9ff',
      fill: 'rgba(102, 217, 255, 0.35)',
      ratio: ship.speedBoostTimer / SPEED_BOOST_DURATION,
    });
  }

  if (ship.shieldTimer > 0) {
    statusBars.push({
      label: `ESCUDO ${ship.shieldTimer.toFixed(1)}s`,
      color: '#50ffc8',
      fill: 'rgba(80, 255, 200, 0.35)',
      ratio: ship.shieldTimer / SHIELD_DURATION,
    });
  }

  if (ship.tripleShotTimer > 0) {
    statusBars.push({
      label: `TRIPLE ${ship.tripleShotTimer.toFixed(1)}s`,
      color: '#ff66cc',
      fill: 'rgba(255, 102, 204, 0.35)',
      ratio: ship.tripleShotTimer / TRIPLE_SHOT_DURATION,
    });
  }

  const barW = 220;
  const barH = 10;
  const barX = 14;
  const barY = 38;
  statusBars.forEach((bar, i) => {
    const y = barY + i * 24;
    ctx.textAlign = 'left';
    ctx.fillStyle = bar.color;
    ctx.fillText(bar.label, barX, y + 16);

    ctx.strokeStyle = bar.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, y + 8, barW, barH);
    ctx.fillStyle = bar.fill;
    ctx.fillRect(barX, y + 8, barW * bar.ratio, barH);
  });

  ctx.textAlign = 'right';
  ctx.fillStyle = getCurrentSkin().stroke;
  ctx.fillText(`SKIN ${getCurrentSkin().name}  C PARA CAMBIAR`, W - 14, H - 16);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  speedPowerUps.forEach(powerUp => powerUp.draw());
  shieldPowerUps.forEach(powerUp => powerUp.draw());
  tripleShotPowerUps.forEach(powerUp => powerUp.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
