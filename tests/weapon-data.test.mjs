import test from "node:test";
import assert from "node:assert/strict";
import { WEAPON_DEFS, weaponById, shotsPerSecond, timeToKill } from "../js/weapon-data.js";

test("there are nine original weapons with unique ids and names", () => {
  assert.equal(WEAPON_DEFS.length, 9);
  assert.equal(new Set(WEAPON_DEFS.map((weapon) => weapon.id)).size, 9);
  assert.equal(new Set(WEAPON_DEFS.map((weapon) => weapon.name)).size, 9);
  for (const weapon of WEAPON_DEFS) {
    assert.ok(weapon.name.length >= 2);
    assert.ok(!/combat master/i.test(weapon.name));
  }
});

test("weapon stats are internally consistent", () => {
  for (const weapon of WEAPON_DEFS) {
    assert.ok(weapon.damage > 0, `${weapon.id} damage`);
    assert.ok(weapon.headshot > 1, `${weapon.id} headshot multiplier`);
    assert.ok(weapon.rpm > 0, `${weapon.id} rpm`);
    assert.ok(weapon.mag > 0, `${weapon.id} magazine`);
    assert.ok(weapon.reserve >= weapon.mag, `${weapon.id} reserve`);
    assert.ok(weapon.reloadTime > 0, `${weapon.id} reload`);
    assert.ok(weapon.spread > 0 && weapon.adsSpread > 0, `${weapon.id} spread`);
    assert.ok(weapon.adsSpread < weapon.spread, `${weapon.id} ADS should tighten spread`);
    assert.equal(weapon.range.length, 3);
    assert.ok(weapon.range[0] < weapon.range[1]);
  }
});

test("weaponById resolves known ids and rejects unknown ids", () => {
  assert.equal(weaponById("ar4")?.name, "AR-4");
  assert.equal(weaponById("nope"), null);
});

test("shotsPerSecond and timeToKill match the card values", () => {
  const ar = weaponById("ar4");
  assert.ok(Math.abs(shotsPerSecond(ar) - 10.3333) < 0.001);
  assert.equal(timeToKill(ar), "0.29");
  const dmr = weaponById("dmr7");
  assert.equal(timeToKill(dmr), "0.35");
});

test("SR-9 kills with a single body shot", () => {
  const sr = weaponById("sr9");
  assert.ok(sr.damage >= 100, `${sr.damage} damage`);
  assert.equal(timeToKill(sr), "0.00");
});

test("LMG-6 trades handling for magazine size, it does not out-DPS the AR-4", () => {
  const lmg = weaponById("lmg6");
  const ar = weaponById("ar4");
  assert.ok(Number(timeToKill(lmg)) > Number(timeToKill(ar)), `${timeToKill(lmg)} vs ${timeToKill(ar)}`);
  assert.ok(Number(timeToKill(lmg)) <= 0.45, timeToKill(lmg));
  assert.ok(lmg.mag > ar.mag * 2, `${lmg.mag} rounds`);
  assert.ok(lmg.reloadTime > ar.reloadTime, "slower reload");
});

test("new weapons cover close, tactical, and shotgun roles", () => {
  const shotgun = weaponById("sg12");
  const battleRifle = weaponById("br7");
  const machinePistol = weaponById("vpr5");
  assert.equal(shotgun.pellets, 8);
  assert.ok(shotgun.range[1] < battleRifle.range[0]);
  assert.ok(machinePistol.rpm > weaponById("smg9").rpm);
  assert.ok(shotgun.mag < battleRifle.mag);
});
