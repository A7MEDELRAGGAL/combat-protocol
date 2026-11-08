import test from "node:test";
import assert from "node:assert/strict";
import { GRENADE_DEF, computeBlastDamage } from "../js/grenade-rules.js";

test("grenade blast damage falls off to zero at the radius", () => {
  assert.equal(computeBlastDamage(0), 100);
  assert.equal(computeBlastDamage(GRENADE_DEF.radius / 2), 50);
  assert.equal(computeBlastDamage(GRENADE_DEF.radius), 0);
  assert.equal(computeBlastDamage(GRENADE_DEF.radius + 1), 0);
});

test("grenade configuration is bounded for the local prototype", () => {
  assert.equal(GRENADE_DEF.capacity, 2);
  assert.ok(GRENADE_DEF.fuseSeconds > 1 && GRENADE_DEF.fuseSeconds < 2);
  assert.ok(GRENADE_DEF.radius >= 4 && GRENADE_DEF.radius <= 6);
});
