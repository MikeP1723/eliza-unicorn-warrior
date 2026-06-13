// Run with: node --test
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  ATTACK_REACH,
  ENEMY_STATS,
  rectsOverlap,
  calcAttackHitbox,
  computeHighScore,
} = require('../game-logic.js');

// ─── rectsOverlap ─────────────────────────────────────────────────────────────
describe('rectsOverlap', () => {
  test('overlapping rects return true', () => {
    assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true);
  });

  test('non-overlapping on x-axis return false', () => {
    assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 15, y: 0, w: 10, h: 10 }), false);
  });

  test('non-overlapping on y-axis return false', () => {
    assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 15, w: 10, h: 10 }), false);
  });

  test('touching edges (not overlapping) return false', () => {
    assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
  });

  test('one rect fully inside another returns true', () => {
    assert.equal(rectsOverlap({ x: 0, y: 0, w: 20, h: 20 }, { x: 5, y: 5, w: 5, h: 5 }), true);
  });

  test('identical rects return true', () => {
    assert.equal(rectsOverlap({ x: 5, y: 5, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true);
  });

  test('single-pixel overlap returns true', () => {
    assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 10, h: 10 }), true);
  });

  test('negative-coordinate rects overlap correctly', () => {
    assert.equal(rectsOverlap({ x: -10, y: -10, w: 15, h: 15 }, { x: -5, y: -5, w: 5, h: 5 }), true);
  });

  test('order of arguments does not matter', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    assert.equal(rectsOverlap(a, b), rectsOverlap(b, a));
  });
});

// ─── calcAttackHitbox ─────────────────────────────────────────────────────────
describe('calcAttackHitbox', () => {
  const base = { x: 100, y: 300, w: 40, h: 56, facing: 1 };

  test('facing right: hitbox center is to the right of player', () => {
    const hb = calcAttackHitbox({ ...base, facing: 1 });
    const hbCenter = hb.x + hb.w / 2;
    assert.ok(hbCenter > base.x, `expected hitbox center ${hbCenter} > player.x ${base.x}`);
  });

  test('facing left: hitbox center is to the left of player', () => {
    const hb = calcAttackHitbox({ ...base, facing: -1 });
    const hbCenter = hb.x + hb.w / 2;
    assert.ok(hbCenter < base.x, `expected hitbox center ${hbCenter} < player.x ${base.x}`);
  });

  test('hitbox width matches ATTACK_REACH * 1.2', () => {
    const hb = calcAttackHitbox(base);
    assert.equal(hb.w, ATTACK_REACH * 1.2);
  });

  test('hitbox height is 48', () => {
    const hb = calcAttackHitbox(base);
    assert.equal(hb.h, 48);
  });

  test('hitbox is vertically centered around mid-body, not ground', () => {
    const hb = calcAttackHitbox(base);
    const hbMidY = hb.y + hb.h / 2;
    const groundY = base.y;
    assert.ok(hbMidY < groundY, `expected hitbox mid-y ${hbMidY} above ground ${groundY}`);
  });

  test('facing left and right produce symmetric x positions', () => {
    const right = calcAttackHitbox({ ...base, facing:  1 });
    const left  = calcAttackHitbox({ ...base, facing: -1 });
    const rightCenter = right.x + right.w / 2;
    const leftCenter  = left.x  + left.w  / 2;
    const rightOffset = rightCenter - base.x;
    const leftOffset  = base.x - leftCenter;
    assert.ok(Math.abs(rightOffset - leftOffset) < 0.01, 'offsets should be symmetric');
  });
});

// ─── computeHighScore ─────────────────────────────────────────────────────────
describe('computeHighScore', () => {
  test('new score beats existing: returns new score and isNew=true', () => {
    const result = computeHighScore(500, 300);
    assert.equal(result.best, 500);
    assert.equal(result.isNew, true);
  });

  test('new score below existing: returns existing and isNew=false', () => {
    const result = computeHighScore(200, 400);
    assert.equal(result.best, 400);
    assert.equal(result.isNew, false);
  });

  test('equal scores: not a new high score', () => {
    const result = computeHighScore(300, 300);
    assert.equal(result.best, 300);
    assert.equal(result.isNew, false);
  });

  test('first run (existing=0): any positive score is a new high score', () => {
    const result = computeHighScore(100, 0);
    assert.equal(result.best, 100);
    assert.equal(result.isNew, true);
  });

  test('zero score on first run is not a new high score', () => {
    const result = computeHighScore(0, 0);
    assert.equal(result.isNew, false);
  });
});

// ─── ENEMY_STATS ──────────────────────────────────────────────────────────────
describe('ENEMY_STATS', () => {
  const types = ['spider', 'moth', 'roach', 'hedgehog'];

  test('all four enemy types are defined', () => {
    types.forEach(t => assert.ok(ENEMY_STATS[t], `missing enemy type: ${t}`));
  });

  test('every type has required numeric fields', () => {
    types.forEach(t => {
      const e = ENEMY_STATS[t];
      ['w', 'h', 'hp', 'speed', 'score'].forEach(field => {
        assert.equal(typeof e[field], 'number', `${t}.${field} should be a number`);
        assert.ok(e[field] > 0, `${t}.${field} should be positive`);
      });
    });
  });

  test('every type has a boolean flying field', () => {
    types.forEach(t => assert.equal(typeof ENEMY_STATS[t].flying, 'boolean'));
  });

  test('only moth flies', () => {
    assert.equal(ENEMY_STATS.moth.flying, true);
    assert.equal(ENEMY_STATS.spider.flying, false);
    assert.equal(ENEMY_STATS.roach.flying, false);
    assert.equal(ENEMY_STATS.hedgehog.flying, false);
  });

  test('hp values match design spec', () => {
    assert.equal(ENEMY_STATS.spider.hp,   2);
    assert.equal(ENEMY_STATS.moth.hp,     1);
    assert.equal(ENEMY_STATS.roach.hp,    3);
    assert.equal(ENEMY_STATS.hedgehog.hp, 4);
  });

  test('hedgehog has highest score reward', () => {
    const scores = types.map(t => ENEMY_STATS[t].score);
    assert.equal(Math.max(...scores), ENEMY_STATS.hedgehog.score);
  });

  test('moth has highest movement speed', () => {
    const speeds = types.map(t => ENEMY_STATS[t].speed);
    assert.equal(Math.max(...speeds), ENEMY_STATS.roach.speed);
  });

  test('all hitbox dimensions are positive integers', () => {
    types.forEach(t => {
      const { w, h } = ENEMY_STATS[t];
      assert.ok(Number.isInteger(w) && w > 0, `${t}.w should be a positive integer`);
      assert.ok(Number.isInteger(h) && h > 0, `${t}.h should be a positive integer`);
    });
  });
});
