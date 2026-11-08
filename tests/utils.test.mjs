import test from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  damageFalloff,
  createBox,
  boxesOverlap,
  bodyBox,
  moveWithCollisions,
  segmentHitsBox,
  shortestAngle,
  formatClock,
} from "../js/utils.js";

test("clamp keeps values inside the range", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(42, 0, 10), 10);
});

test("damageFalloff is full inside the first range and floors at the minimum", () => {
  assert.equal(damageFalloff(10, 20, 60, 0.5), 1);
  assert.equal(damageFalloff(20, 20, 60, 0.5), 1);
  assert.equal(damageFalloff(60, 20, 60, 0.5), 0.5);
  assert.equal(damageFalloff(200, 20, 60, 0.5), 0.5);
  const middle = damageFalloff(40, 20, 60, 0.5);
  assert.ok(middle > 0.5 && middle < 1);
});

test("boxesOverlap detects intersecting and separated volumes", () => {
  const a = createBox(0, 0, 0, 2, 2, 2);
  const b = createBox(1.5, 0, 0, 2, 2, 2);
  const c = createBox(10, 0, 0, 2, 2, 2);
  assert.equal(boxesOverlap(a, b), true);
  assert.equal(boxesOverlap(a, c), false);
});

test("bodyBox grows from the feet position", () => {
  const box = bodyBox({ x: 1, y: 0, z: 2 }, 0.4, 1.8);
  assert.deepEqual(box.min, { x: 0.6, y: 0, z: 1.6 });
  assert.deepEqual(box.max, { x: 1.4, y: 1.8, z: 2.4 });
});

test("moveWithCollisions stops horizontal movement at a wall", () => {
  const wall = createBox(2, 1, 0, 1, 2, 4);
  const position = { x: 0, y: 0, z: 0 };
  const result = moveWithCollisions(position, { x: 3, y: 0, z: 0 }, 0.36, 1.78, [wall]);
  assert.equal(result.hitWall, true);
  assert.ok(position.x < 1.5, `expected x < 1.5, got ${position.x}`);
  assert.ok(position.x > 1.1, `expected x near the wall, got ${position.x}`);
});

test("moveWithCollisions lands on a box", () => {
  const platform = createBox(0, 1, 0, 4, 2, 4);
  const position = { x: 0, y: 3, z: 0 };
  const result = moveWithCollisions(position, { x: 0, y: -2.5, z: 0 }, 0.36, 1.78, [platform]);
  assert.equal(result.grounded, true);
  assert.ok(position.y >= 2 && position.y < 2.01, `expected y near 2, got ${position.y}`);
});

test("moveWithCollisions stops upward movement at a ceiling", () => {
  const ceiling = createBox(0, 4, 0, 4, 1, 4);
  const position = { x: 0, y: 0, z: 0 };
  const result = moveWithCollisions(position, { x: 0, y: 4, z: 0 }, 0.36, 1.78, [ceiling]);
  assert.equal(result.ceiling, true);
  assert.ok(position.y <= 2.22, `expected y under the ceiling, got ${position.y}`);
});

test("moveWithCollisions stands on the ground plane", () => {
  const position = { x: 0, y: 0.5, z: 0 };
  const result = moveWithCollisions(position, { x: 0, y: -1, z: 0 }, 0.36, 1.78, []);
  assert.equal(result.grounded, true);
  assert.equal(position.y, 0);
});

test("segmentHitsBox detects line-of-sight blockers", () => {
  const wall = createBox(0, 1, 0, 1, 2, 4);
  assert.equal(segmentHitsBox({ x: -2, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, 4, wall), true);
  assert.equal(segmentHitsBox({ x: -2, y: 3, z: 0 }, { x: 1, y: 0, z: 0 }, 4, wall), false);
});

test("shortestAngle takes the short way around", () => {
  assert.ok(Math.abs(shortestAngle(0.1, Math.PI * 2 - 0.1) + 0.2) < 1e-9);
});

test("formatClock always renders mm:ss", () => {
  assert.equal(formatClock(300), "05:00");
  assert.equal(formatClock(61), "01:01");
  assert.equal(formatClock(0), "00:00");
});
