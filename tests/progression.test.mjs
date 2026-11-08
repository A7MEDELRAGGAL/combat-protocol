import test from "node:test";
import assert from "node:assert/strict";
import {
  computePlacement,
  levelForXp,
  levelProgress,
  placementLabel,
  rankTitle,
  xpIntoLevel,
} from "../js/progression.js";

test("level curve advances every 1000 XP", () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(999), 1);
  assert.equal(levelForXp(1000), 2);
  assert.equal(levelForXp(5500), 6);
});

test("xp inside the level and progress stay in range", () => {
  assert.equal(xpIntoLevel(2450), 450);
  assert.ok(Math.abs(levelProgress(2450) - 0.45) < 0.001);
  assert.equal(levelProgress(-50), 0);
  assert.equal(levelProgress(999999), 0.999);
});

test("rank titles step up with the level", () => {
  assert.equal(rankTitle(1), "مستجد");
  assert.equal(rankTitle(10), "عريف");
  assert.equal(rankTitle(49), "ملازم");
  assert.equal(rankTitle(120), "أسطورة");
});

test("winning a battle royale is placement 1", () => {
  assert.equal(computePlacement({ result: "win", aliveEnemies: 4, totalBots: 20 }), 1);
});

test("dying with survivors ahead increases the placement number", () => {
  assert.equal(computePlacement({ result: "dead", aliveEnemies: 0, totalBots: 20 }), 1 + 1);
  assert.equal(computePlacement({ result: "dead", aliveEnemies: 3, totalBots: 20 }), 4);
  assert.equal(computePlacement({ result: "dead", aliveEnemies: 19, totalBots: 20 }), 20);
  assert.equal(computePlacement({ result: "dead", aliveEnemies: 99, totalBots: 20 }), 20);
});

test("placement label is human readable", () => {
  assert.equal(placementLabel(4, 20), "4 / 20");
});
