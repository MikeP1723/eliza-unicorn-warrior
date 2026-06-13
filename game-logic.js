// Pure game logic — no browser APIs, safe to require() in Node for testing.

const ATTACK_REACH = 110;

// Enemy stats without palette colours (game.js merges colours in)
const ENEMY_STATS = {
  spider:   { w: 28, h: 20, hp: 2, speed: 1.2, score: 100, flying: false, groundOnly: true  },
  moth:     { w: 30, h: 22, hp: 1, speed: 1.8, score: 150, flying: true,  groundOnly: false },
  roach:    { w: 32, h: 18, hp: 3, speed: 2.0, score: 120, flying: false, groundOnly: true  },
  hedgehog: { w: 30, h: 26, hp: 4, speed: 0.9, score: 200, flying: false, groundOnly: true  },
};

// Axis-aligned bounding-box overlap test.
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Pure hitbox calculation — takes a plain player-state object.
function calcAttackHitbox(p) {
  const cx = p.x + p.facing * (p.w * 0.5 + ATTACK_REACH * 0.4);
  const cy = p.y - p.h * 0.55;
  return { x: cx - ATTACK_REACH * 0.6, y: cy - 24, w: ATTACK_REACH * 1.2, h: 48 };
}

// Pure high-score logic — returns the new best and whether it changed.
function computeHighScore(currentScore, existingBest) {
  const newBest = Math.max(currentScore, existingBest);
  return { best: newBest, isNew: currentScore > existingBest };
}

if (typeof module !== 'undefined') {
  module.exports = { ATTACK_REACH, ENEMY_STATS, rectsOverlap, calcAttackHitbox, computeHighScore };
}
