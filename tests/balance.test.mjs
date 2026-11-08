import test from "node:test";
import assert from "node:assert/strict";
import { WEAPON_DEFS, weaponById, timeToKill } from "../js/weapon-data.js";

const ttkOf = (id) => Number(timeToKill(weaponById(id)));

test("close-range TTK ladder follows the intended roles", () => {
  const vpr = ttkOf("vpr5");
  const smg = ttkOf("smg9");
  const ar = ttkOf("ar4");
  assert.ok(vpr < smg, `VPR-5 ${vpr}s should beat SMG-9 ${smg}s up close`);
  assert.ok(smg < ar, `SMG-9 ${smg}s should beat AR-4 ${ar}s up close`);
  assert.ok(ar < ttkOf("p12"), "AR-4 should beat the sidearm");
});

test("every weapon loses damage at distance", () => {
  for (const weapon of WEAPON_DEFS) {
    const [, near, far, multiplier] = [weapon.range[0], weapon.range[0], weapon.range[1], weapon.range[2]];
    assert.ok(near < far, `${weapon.id} range ordering`);
    assert.ok(multiplier > 0 && multiplier < 1, `${weapon.id} falloff ${multiplier}`);
    assert.ok(
      Number(timeToKill(weapon, multiplier)) > Number(timeToKill(weapon)),
      `${weapon.id} must kill slower at falloff range`,
    );
  }
});

test("only the sniper and the shotgun can one-shot a full-health body", () => {
  const oneShot = WEAPON_DEFS.filter(
    (weapon) => weapon.damage * (weapon.pellets ?? 1) >= 100,
  )
    .map((weapon) => weapon.id)
    .sort();
  assert.deepEqual(oneShot, ["sg12", "sr9"]);
});

test("nothing in the rifle class dominates the AR-4 on both speed and range", () => {
  const ar = weaponById("ar4");
  for (const id of ["lmg6", "br7", "smg9", "vpr5", "dmr7"]) {
    const weapon = weaponById(id);
    const killsFaster = ttkOf(id) < Number(timeToKill(ar));
    const reachesFurther = weapon.range[1] > ar.range[1];
    assert.ok(!(killsFaster && reachesFurther), `${id} dominates AR-4 on both axes`);
  }
});

test("magazine size and reload time stay inversely related", () => {
  const sorted = [...WEAPON_DEFS].sort((a, b) => a.mag - b.mag);
  const small = sorted[0];
  const large = sorted[sorted.length - 1];
  assert.ok(large.reloadTime > small.reloadTime, `${large.name} should reload slower than ${small.name}`);
});
