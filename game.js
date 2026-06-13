// Eliza - Unicorn Warrior

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const GROUND = H - 60;

// ─── High score ───────────────────────────────────────────────────────────────
const HS_KEY = 'eliza_high_score';
let highScore = parseInt(localStorage.getItem(HS_KEY) || '0', 10);

function saveHighScore() {
  if (player.score > highScore) {
    highScore = player.score;
    localStorage.setItem(HS_KEY, highScore);
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.code] = false; });

function pressed(codes) { return codes.some(c => keys[c]); }

// ─── Touch controls ───────────────────────────────────────────────────────────
const isTouchDevice = () => navigator.maxTouchPoints > 0;

// Buttons defined in canvas-space coordinates
const TOUCH_BTNS = [
  { x: 12,  y: 344, w: 82, h: 50, code: 'ArrowLeft',  label: '◀' },
  { x: 102, y: 344, w: 82, h: 50, code: 'ArrowRight', label: '▶' },
  { x: 606, y: 344, w: 82, h: 50, code: 'ArrowUp',    label: 'JUMP' },
  { x: 696, y: 344, w: 96, h: 50, code: 'Space',      label: 'ATK' },
];

function updateTouchKeys(e) {
  e.preventDefault();
  // Reset all touch-driven keys
  TOUCH_BTNS.forEach(b => { keys[b.code] = false; });
  // Map each active touch to a button
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width;
  const sy = H / rect.height;
  Array.from(e.touches).forEach(t => {
    const cx = (t.clientX - rect.left) * sx;
    const cy = (t.clientY - rect.top) * sy;
    TOUCH_BTNS.forEach(b => {
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        keys[b.code] = true;
      }
    });
  });
}

canvas.addEventListener('touchstart',  updateTouchKeys, { passive: false });
canvas.addEventListener('touchmove',   updateTouchKeys, { passive: false });
canvas.addEventListener('touchend',    e => {
  if (gameState === 'start' || gameState === 'dead') { resetGame(); e.preventDefault(); return; }
  updateTouchKeys(e);
}, { passive: false });
canvas.addEventListener('touchcancel', updateTouchKeys, { passive: false });

function drawTouchControls() {
  if (!isTouchDevice()) return;
  ctx.save();
  TOUCH_BTNS.forEach(b => {
    const active = keys[b.code];
    ctx.globalAlpha = active ? 0.9 : 0.5;
    ctx.fillStyle = active ? '#7c3aed' : '#2e1065';
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.strokeStyle = active ? '#e9d5ff' : '#7c3aed';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e9d5ff';
    ctx.font = `bold ${b.label.length > 2 ? 13 : 20}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
  });
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.restore();
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  sky1: '#1a0a2e', sky2: '#2d1b69',
  ground: '#3b1f6e', groundTop: '#6d28d9',
  star: '#e9d5ff',
  unicornBody: '#f5d0fe', unicornMane: '#f0abfc', unicornHorn: '#fbbf24',
  elizaSkin: '#fed7aa', elizaHair: '#7c3aed', elizaShirt: '#c084fc',
  elizaSkirt: '#7c3aed', elizaBoot: '#4c1d95',
  attackArc: '#fde68a',
  spider: '#1e1b4b', spiderLeg: '#312e81',
  moth: '#a78bfa', mothWing: '#c4b5fd',
  roach: '#78350f', roachBody: '#92400e',
  hedgehog: '#374151', hedgehogSpike: '#6b7280',
  hpBar: '#7c3aed', hpBarBg: '#4c1d95',
  scoreText: '#e9d5ff',
  hitFlash: '#ffffff',
  particleColors: ['#fde68a', '#f0abfc', '#c084fc', '#a78bfa'],
};

// ─── Stars ────────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, () => ({
  x: Math.random() * W,
  y: Math.random() * (GROUND - 40),
  r: Math.random() * 1.5 + 0.3,
  twinkle: Math.random() * Math.PI * 2,
}));

// ─── Particles ────────────────────────────────────────────────────────────────
const particles = [];
function spawnParticles(x, y, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      decay: Math.random() * 0.04 + 0.03,
      r: Math.random() * 4 + 2,
      color: C.particleColors[Math.floor(Math.random() * C.particleColors.length)],
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ─── Camera / scrolling ───────────────────────────────────────────────────────
let camX = 0;

// ─── Player ───────────────────────────────────────────────────────────────────
const player = {
  x: 120, y: GROUND,
  vx: 0, vy: 0,
  w: 40, h: 56,
  onGround: false,
  facing: 1,        // 1 = right, -1 = left
  attacking: false,
  attackTimer: 0,
  attackCooldown: 0,
  hitTimer: 0,
  maxHp: 5,
  hp: 5,
  dead: false,
  score: 0,
  invincible: 0,    // frames of invincibility after hit
  // animation
  legAnim: 0,
  jumpState: 0,     // 0=idle/run, 1=rising, 2=falling
};

const ATTACK_DURATION = 18;
const ATTACK_COOLDOWN = 28;
const ATTACK_REACH = 110;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;

function playerUpdate() {
  if (player.dead) return;

  // Move
  let moving = false;
  if (pressed(['ArrowLeft', 'KeyA'])) {
    player.vx = -MOVE_SPEED;
    player.facing = -1;
    moving = true;
  } else if (pressed(['ArrowRight', 'KeyD'])) {
    player.vx = MOVE_SPEED;
    player.facing = 1;
    moving = true;
  } else {
    player.vx *= 0.75;
  }

  // Jump
  if (pressed(['ArrowUp', 'KeyW']) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  // Attack
  if (pressed(['KeyZ', 'KeyX', 'Space']) && player.attackCooldown <= 0 && !player.attacking) {
    player.attacking = true;
    player.attackTimer = ATTACK_DURATION;
    player.attackCooldown = ATTACK_COOLDOWN;
    spawnParticles(
      player.x + player.facing * 30,
      player.y - player.h * 0.6,
      5
    );
  }

  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.attackTimer > 0) {
    player.attackTimer--;
    if (player.attackTimer <= 0) player.attacking = false;
  }
  if (player.invincible > 0) player.invincible--;

  // Physics
  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;

  // Ground collision
  if (player.y >= GROUND) {
    player.y = GROUND;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Left boundary (relative to cam)
  if (player.x < camX + 30) player.x = camX + 30;

  // Leg animation
  if (moving && player.onGround) {
    player.legAnim += 0.25;
  } else if (!moving) {
    player.legAnim *= 0.8;
  }

  // Camera follows
  const targetCam = player.x - W * 0.35;
  camX += (targetCam - camX) * 0.1;
  if (camX < 0) camX = 0;
}

// Attack hitbox in world space
function attackHitbox() {
  const cx = player.x + player.facing * (player.w * 0.5 + ATTACK_REACH * 0.4);
  const cy = player.y - player.h * 0.55;
  return { x: cx - ATTACK_REACH * 0.6, y: cy - 24, w: ATTACK_REACH * 1.2, h: 48 };
}

// ─── Enemy helpers ────────────────────────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ─── Enemies ──────────────────────────────────────────────────────────────────
const enemies = [];

const ENEMY_TYPES = {
  spider: {
    w: 28, h: 20, hp: 2, speed: 1.2, score: 100,
    groundOnly: true, flying: false,
    color: C.spider, legColor: C.spiderLeg,
  },
  moth: {
    w: 30, h: 22, hp: 1, speed: 1.8, score: 150,
    groundOnly: false, flying: true,
    color: C.moth, wingColor: C.mothWing,
  },
  roach: {
    w: 32, h: 18, hp: 3, speed: 2.0, score: 120,
    groundOnly: true, flying: false,
    color: C.roach, bodyColor: C.roachBody,
  },
  hedgehog: {
    w: 30, h: 26, hp: 4, speed: 0.9, score: 200,
    groundOnly: true, flying: false,
    color: C.hedgehog, spikeColor: C.hedgehogSpike,
  },
};

let enemySpawnTimer = 0;
let spawnInterval = 120;
let difficultyTimer = 0;

function spawnEnemy() {
  const types = Object.keys(ENEMY_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  const def = ENEMY_TYPES[type];
  const spawnX = camX + W + 40;

  let spawnY = GROUND;
  if (def.flying) {
    spawnY = GROUND - 80 - Math.random() * 100;
  }

  enemies.push({
    type,
    x: spawnX,
    y: spawnY,
    w: def.w,
    h: def.h,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed,
    score: def.score,
    flying: def.flying,
    vx: -def.speed,
    vy: 0,
    anim: Math.random() * Math.PI * 2,
    hitTimer: 0,
    dead: false,
    deathTimer: 0,
  });
}

function updateEnemies() {
  difficultyTimer++;
  if (difficultyTimer % 600 === 0) {
    spawnInterval = Math.max(40, spawnInterval - 8);
  }

  enemySpawnTimer++;
  if (enemySpawnTimer >= spawnInterval) {
    enemySpawnTimer = 0;
    spawnEnemy();
    if (Math.random() < 0.3) spawnEnemy();
  }

  const atk = player.attacking ? attackHitbox() : null;
  const playerBox = { x: player.x - player.w / 2, y: player.y - player.h, w: player.w, h: player.h };

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // Death animation
    if (e.dead) {
      e.deathTimer++;
      if (e.deathTimer > 30) enemies.splice(i, 1);
      continue;
    }

    // Move toward player
    e.anim += 0.15;
    e.x += e.vx;

    if (e.flying) {
      const targetY = GROUND - 80 - Math.sin(e.anim * 0.4) * 60;
      e.y += (targetY - e.y) * 0.05;
    } else {
      if (e.y < GROUND) {
        e.vy += 0.6;
        e.y += e.vy;
      }
      if (e.y >= GROUND) {
        e.y = GROUND;
        e.vy = 0;
      }
    }

    // Reverse if past left edge
    if (e.x < camX - 100) {
      enemies.splice(i, 1);
      continue;
    }

    // Attack collision
    if (atk) {
      const eBox = { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
      if (rectsOverlap(atk, eBox) && e.hitTimer <= 0) {
        e.hp--;
        e.hitTimer = 15;
        spawnParticles(e.x, e.y - e.h / 2, 6);
        if (e.hp <= 0) {
          e.dead = true;
          player.score += e.score;
          spawnParticles(e.x, e.y - e.h / 2, 14);
          continue;
        }
      }
    }
    if (e.hitTimer > 0) e.hitTimer--;

    // Enemy hits player
    if (player.invincible <= 0) {
      const eBox = { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
      if (rectsOverlap(playerBox, eBox)) {
        player.hp--;
        player.invincible = 60;
        spawnParticles(player.x, player.y - player.h / 2, 5);
        if (player.hp <= 0) {
          player.dead = true;
        }
      }
    }
  }
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawBackground() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND);
  grad.addColorStop(0, C.sky1);
  grad.addColorStop(1, C.sky2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, GROUND);

  // Stars (parallax slow)
  const t = Date.now() / 1000;
  STARS.forEach(s => {
    const px = ((s.x - camX * 0.15) % W + W) % W;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.twinkle);
    ctx.fillStyle = C.star;
    ctx.beginPath();
    ctx.arc(px, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Moon
  const moonX = 650 - (camX * 0.05) % W;
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(moonX, 60, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.sky2;
  ctx.beginPath();
  ctx.arc(moonX + 10, 55, 24, 0, Math.PI * 2);
  ctx.fill();

  // Ground
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = C.groundTop;
  ctx.fillRect(0, GROUND, W, 6);

  // Scrolling ground detail
  for (let gx = -((camX * 0.9) % 80); gx < W; gx += 80) {
    ctx.fillStyle = '#5b21b666';
    ctx.fillRect(gx, GROUND + 6, 40, 4);
  }
}

function worldToScreen(wx) { return wx - camX; }

// Draw unicorn + Eliza
function drawPlayer() {
  const sx = worldToScreen(player.x);
  const sy = player.y;
  const f = player.facing;
  const flash = player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(f, 1);
  if (flash) ctx.globalAlpha = 0.4;

  // Leg animation offsets
  const leg = Math.sin(player.legAnim) * 10;

  // ── Unicorn body ──
  // Tail
  ctx.fillStyle = C.unicornMane;
  ctx.beginPath();
  ctx.ellipse(-22, -14 + Math.sin(player.legAnim * 0.7) * 4, 8, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = C.unicornBody;
  ctx.beginPath();
  ctx.ellipse(-5, -20, 24, 15, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = C.unicornBody;
  ctx.beginPath();
  ctx.ellipse(14, -32, 9, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = C.unicornBody;
  ctx.beginPath();
  ctx.ellipse(20, -44, 11, 9, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Horn
  ctx.fillStyle = C.unicornHorn;
  ctx.beginPath();
  ctx.moveTo(28, -52);
  ctx.lineTo(24, -46);
  ctx.lineTo(32, -46);
  ctx.closePath();
  ctx.fill();
  // Horn shimmer
  if (player.attacking) {
    ctx.fillStyle = '#fde68a88';
    ctx.beginPath();
    ctx.moveTo(28, -62);
    ctx.lineTo(20, -48);
    ctx.lineTo(36, -48);
    ctx.closePath();
    ctx.fill();
  }

  // Eye
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.arc(25, -46, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(25.8, -46.5, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Mane
  ctx.fillStyle = C.unicornMane;
  ctx.beginPath();
  ctx.ellipse(16, -42, 5, 9, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  const legY = player.onGround ? 0 : (player.vy < 0 ? -6 : 6);

  function drawLeg(ox, phase) {
    const swing = Math.sin(player.legAnim + phase) * 10;
    ctx.fillStyle = C.unicornBody;
    ctx.beginPath();
    ctx.roundRect(ox - 4, -8 + legY, 8, 20 + swing * 0.3, 3);
    ctx.fill();
    // hoof
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.ellipse(ox, 12 + swing * 0.3 + legY, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLeg(-18, 0);
  drawLeg(-8, Math.PI);
  drawLeg(4, Math.PI * 0.5);
  drawLeg(14, Math.PI * 1.5);

  // ── Eliza (rider) ──
  // Boot / legs
  ctx.fillStyle = C.elizaBoot;
  ctx.beginPath();
  ctx.roundRect(-8, -42, 6, 12, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(0, -42, 6, 12, 2);
  ctx.fill();

  // Skirt
  ctx.fillStyle = C.elizaSkirt;
  ctx.beginPath();
  ctx.ellipse(-2, -46, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body / shirt
  ctx.fillStyle = C.elizaShirt;
  ctx.beginPath();
  ctx.roundRect(-7, -58, 14, 14, 3);
  ctx.fill();

  // Arms
  ctx.fillStyle = C.elizaSkin;
  // front arm
  const armSwing = player.attacking ? -30 : Math.sin(player.legAnim) * 12;
  ctx.save();
  ctx.translate(5, -55);
  ctx.rotate((armSwing * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-3, 0, 6, 14, 2);
  ctx.fill();
  ctx.restore();

  // back arm
  ctx.save();
  ctx.translate(-7, -55);
  ctx.rotate((-Math.sin(player.legAnim) * 12 * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-3, 0, 6, 12, 2);
  ctx.fill();
  ctx.restore();

  // Head
  ctx.fillStyle = C.elizaSkin;
  ctx.beginPath();
  ctx.arc(0, -64, 9, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = C.elizaHair;
  ctx.beginPath();
  ctx.arc(0, -67, 9, Math.PI, 0);
  ctx.fill();
  // ponytail
  ctx.beginPath();
  ctx.ellipse(-8, -64, 4, 8, -0.5 + Math.sin(player.legAnim * 0.5) * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.arc(4, -64, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(4.7, -64.6, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Attack arc
  if (player.attacking) {
    const progress = 1 - player.attackTimer / ATTACK_DURATION;
    ctx.strokeStyle = C.attackArc;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - progress;
    ctx.beginPath();
    ctx.arc(18, -46, ATTACK_REACH * 0.85, -Math.PI * 0.6, Math.PI * 0.1);
    ctx.stroke();
    ctx.globalAlpha = flash ? 0.4 : 1;
    ctx.lineWidth = 1;
  }

  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(e => {
    const sx = worldToScreen(e.x);
    const sy = e.y;
    const flash = e.hitTimer > 0 && Math.floor(e.hitTimer / 3) % 2 === 0;

    ctx.save();
    ctx.translate(sx, sy);
    if (flash) {
      ctx.filter = 'brightness(3)';
    }

    // Death fade
    if (e.dead) {
      ctx.globalAlpha = 1 - e.deathTimer / 30;
      ctx.translate(0, -e.deathTimer * 1.5);
    }

    switch (e.type) {
      case 'spider': drawSpider(e); break;
      case 'moth':   drawMoth(e);   break;
      case 'roach':  drawRoach(e);  break;
      case 'hedgehog': drawHedgehog(e); break;
    }

    ctx.filter = 'none';

    // HP pip bar (only if damaged)
    if (!e.dead && e.hp < e.maxHp) {
      const bw = e.w + 8;
      const bx = -bw / 2;
      const by = -e.h - 10;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), 5);
    }

    ctx.restore();
  });
}

function drawSpider(e) {
  const bob = Math.sin(e.anim) * 2;
  // body
  ctx.fillStyle = C.spider;
  ctx.beginPath();
  ctx.ellipse(0, -10 + bob, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(0, -18 + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(-2, -19 + bob, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2, -19 + bob, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // legs
  ctx.strokeStyle = C.spiderLeg;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const offset = (i % 2) * 5;
    const swing = Math.sin(e.anim + i) * 8;
    ctx.beginPath();
    ctx.moveTo(side * 10, -10 + bob + offset);
    ctx.lineTo(side * 22 + swing, -4 + offset + bob);
    ctx.stroke();
  }
}

function drawMoth(e) {
  const flutter = Math.sin(e.anim * 3) * 12;
  // wings
  ctx.fillStyle = C.mothWing;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.ellipse(-14, -14, 12, 7 + flutter * 0.3, -0.4 + flutter * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(14, -14, 12, 7 + flutter * 0.3, 0.4 - flutter * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // body
  ctx.fillStyle = C.moth;
  ctx.beginPath();
  ctx.ellipse(0, -14, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(-2.5, -18, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.5, -18, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // antennae
  ctx.strokeStyle = C.moth;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -23);
  ctx.quadraticCurveTo(-8, -30, -6, -34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -23);
  ctx.quadraticCurveTo(8, -30, 6, -34);
  ctx.stroke();
}

function drawRoach(e) {
  const scuttle = Math.sin(e.anim * 2) * 1.5;
  // shell
  ctx.fillStyle = C.roach;
  ctx.beginPath();
  ctx.ellipse(0, -9 + scuttle, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // shell shine
  ctx.fillStyle = C.roachBody;
  ctx.beginPath();
  ctx.ellipse(-2, -11 + scuttle, 7, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.fillStyle = C.roach;
  ctx.beginPath();
  ctx.ellipse(12, -9 + scuttle, 6, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(15, -11 + scuttle, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // antennae
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(14, -13); ctx.lineTo(22, -18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -13); ctx.lineTo(24, -15); ctx.stroke();
  // legs
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const swing = Math.sin(e.anim + i * 1.2) * 5;
    ctx.beginPath();
    ctx.moveTo(-6 + i * 5, -6);
    ctx.lineTo(-12 + i * 5 - swing, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6 + i * 5, -6);
    ctx.lineTo(-2 + i * 5 + swing, 0);
    ctx.stroke();
  }
}

function drawHedgehog(e) {
  const huff = Math.sin(e.anim * 1.5) * 1;
  // spikes
  ctx.fillStyle = C.hedgehogSpike;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI - Math.PI * 0.1;
    const rx = Math.cos(angle) * 16;
    const ry = Math.sin(angle) * 12 - 14;
    ctx.beginPath();
    ctx.moveTo(rx, ry - 14 + huff);
    ctx.lineTo(rx + Math.cos(angle) * 7, ry - 7 + huff);
    ctx.lineTo(rx - Math.cos(angle) * 2, ry - 7 + huff);
    ctx.closePath();
    ctx.fill();
  }
  // body
  ctx.fillStyle = C.hedgehog;
  ctx.beginPath();
  ctx.ellipse(0, -12 + huff, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // face
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath();
  ctx.ellipse(9, -12 + huff, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(15, -12 + huff, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // eyes - angry
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(11, -15 + huff, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(9, -17 + huff, 4, 2);
  // feet
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.ellipse(-5, -3, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, -3, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHUD() {
  // HP hearts
  const heartSize = 20;
  for (let i = 0; i < player.maxHp; i++) {
    const hx = 14 + i * (heartSize + 4);
    const hy = 14;
    drawHeart(hx, hy, heartSize, i < player.hp ? '#f472b6' : '#4c1d95');
  }

  // Score
  ctx.fillStyle = C.scoreText;
  ctx.font = 'bold 18px "Courier New"';
  ctx.textAlign = 'right';
  ctx.fillText(`✦ ${player.score}`, W - 14, 30);
  // High score
  if (highScore > 0) {
    ctx.fillStyle = '#fde68a';
    ctx.font = '13px "Courier New"';
    ctx.fillText(`BEST ${highScore}`, W - 14, 50);
  }
  ctx.textAlign = 'left';
}

function drawHeart(x, y, size, color) {
  const s = size / 20;
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-10, -2, -18, -10, -10, -16);
  ctx.bezierCurveTo(-4, -20, 0, -14, 0, -10);
  ctx.bezierCurveTo(0, -14, 4, -20, 10, -16);
  ctx.bezierCurveTo(18, -10, 10, -2, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── Game over / start screens ────────────────────────────────────────────────
let gameState = 'start'; // 'start' | 'playing' | 'dead'
let restartTimer = 0;

function drawStartScreen() {
  ctx.fillStyle = 'rgba(10,4,30,0.88)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f0abfc';
  ctx.font = 'bold 42px "Courier New"';
  ctx.fillText('ELIZA', W / 2, H / 2 - 70);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 22px "Courier New"';
  ctx.fillText('UNICORN WARRIOR', W / 2, H / 2 - 38);

  ctx.fillStyle = '#a78bfa';
  ctx.font = '16px "Courier New"';
  ctx.fillText('Defeat the spiders, moths, roaches,', W / 2, H / 2 + 10);
  ctx.fillText('and evil hedgehogs!', W / 2, H / 2 + 32);
  if (highScore > 0) {
    ctx.fillStyle = '#fde68a';
    ctx.font = '15px "Courier New"';
    ctx.fillText(`✦ High Score: ${highScore}`, W / 2, H / 2 + 56);
  }

  ctx.fillStyle = '#e9d5ff';
  ctx.font = 'bold 16px "Courier New"';
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  if (blink) ctx.fillText('Press ENTER or SPACE to ride!', W / 2, H / 2 + 70);

  ctx.textAlign = 'left';
}

let isNewHighScore = false;

function drawDeathScreen() {
  ctx.fillStyle = 'rgba(10,4,30,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 36px "Courier New"';
  ctx.fillText('ELIZA FELL...', W / 2, H / 2 - 60);
  ctx.fillStyle = '#e9d5ff';
  ctx.font = '20px "Courier New"';
  ctx.fillText(`Score: ${player.score}`, W / 2, H / 2 - 18);
  if (isNewHighScore) {
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 150);
    ctx.fillStyle = `rgba(253,230,138,${pulse})`;
    ctx.font = 'bold 20px "Courier New"';
    ctx.fillText('✦ NEW HIGH SCORE! ✦', W / 2, H / 2 + 12);
  } else if (highScore > 0) {
    ctx.fillStyle = '#fde68a';
    ctx.font = '16px "Courier New"';
    ctx.fillText(`Best: ${highScore}`, W / 2, H / 2 + 12);
  }
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 16px "Courier New"';
  if (blink) ctx.fillText('Press ENTER or tap to try again!', W / 2, H / 2 + 52);
  ctx.textAlign = 'left';
}

function resetGame() {
  player.x = 120; player.y = GROUND;
  player.vx = 0; player.vy = 0;
  player.hp = player.maxHp;
  player.dead = false;
  player.attacking = false;
  player.attackTimer = 0;
  player.attackCooldown = 0;
  player.invincible = 0;
  player.score = 0;
  player.legAnim = 0;
  camX = 0;
  enemies.length = 0;
  particles.length = 0;
  enemySpawnTimer = 0;
  spawnInterval = 120;
  difficultyTimer = 0;
  gameState = 'playing';
}

// ─── Main loop ────────────────────────────────────────────────────────────────
let prevTime = 0;

function loop(ts) {
  requestAnimationFrame(loop);

  drawBackground();

  if (gameState === 'start') {
    drawPlayer();
    drawTouchControls();
    drawStartScreen();
    if (pressed(['Enter', 'KeyZ'])) resetGame();
    return;
  }

  if (gameState === 'playing') {
    if (player.dead) {
      restartTimer++;
      if (restartTimer === 1) {
        isNewHighScore = saveHighScore();
      }
      if (restartTimer > 60) {
        gameState = 'dead';
        restartTimer = 0;
      }
    } else {
      playerUpdate();
      updateEnemies();
    }
  }

  updateParticles();
  drawEnemies();
  drawPlayer();
  drawParticles();
  drawHUD();
  drawTouchControls();

  if (gameState === 'dead') {
    drawDeathScreen();
    if (pressed(['Enter', 'KeyZ'])) resetGame();
  }
}

requestAnimationFrame(loop);
