import test from "node:test";
import assert from "node:assert/strict";
import { BATTLE_ROYALE_PLAN, phaseAt, validateBattleRoyalePlan } from "../js/battle-royale-plan.js";

test("Battle Royale master plan is internally consistent", () => {
  assert.equal(validateBattleRoyalePlan(), true);
  assert.equal(BATTLE_ROYALE_PLAN.targetPlayers, 60);
  assert.deepEqual(BATTLE_ROYALE_PLAN.squadSizes, [1, 2, 4]);
  assert.equal(BATTLE_ROYALE_PLAN.prototypeBotTarget, 20);
});

test("Battle Royale phases progress from drop to overtime", () => {
  assert.equal(phaseAt(0).id, "drop");
  assert.equal(phaseAt(250).id, "rotate-1");
  assert.equal(phaseAt(1000).id, "overtime");
  assert.ok(phaseAt(1000).radius < phaseAt(0).radius);
});

test("Battle Royale loot tiers remain weighted and readable", () => {
  assert.deepEqual(BATTLE_ROYALE_PLAN.lootTiers.map((tier) => tier.id), ["common", "rare", "epic", "legendary"]);
  assert.equal(BATTLE_ROYALE_PLAN.lootTiers.reduce((sum, tier) => sum + tier.weight, 0), 100);
  assert.ok(BATTLE_ROYALE_PLAN.inventory.maxSlots > BATTLE_ROYALE_PLAN.inventory.baseSlots);
});
