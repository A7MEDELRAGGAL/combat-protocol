import test from "node:test";
import assert from "node:assert/strict";
import { weaponById } from "../js/weapon-data.js";
import {
  MODE_DEFS,
  ATTACHMENT_DEFS,
  applyAttachments,
  awardXp,
  defaultProfile,
  operatorById,
  normalizeAttachmentIds,
  settleMatch,
} from "../js/game-data.js";
import { createBattleRoyaleZonePlan, sampleBattleRoyaleZone } from "../js/zone.js";

test("the local launch has five distinct playable modes", () => {
  assert.deepEqual(Object.keys(MODE_DEFS), ["deathmatch", "tdm", "survival", "battleRoyale", "frontlineOps"]);
  assert.equal(MODE_DEFS.battleRoyale.respawn, false);
  assert.ok(MODE_DEFS.tdm.enemyCount > MODE_DEFS.deathmatch.enemyCount);
});

test("attachments modify a weapon without mutating the base definition", () => {
  const base = weaponById("ar4");
  const tuned = applyAttachments(base, ["extended-mag", "vertical-grip"]);
  assert.equal(base.mag, 30);
  assert.equal(tuned.mag, 38);
  assert.ok(tuned.recoilPitch < base.recoilPitch);
  assert.deepEqual(tuned.attachmentIds, ["extended-mag", "vertical-grip"]);
});

test("attachment loadouts allow only one attachment per slot", () => {
  assert.deepEqual(normalizeAttachmentIds(["long-barrel", "suppressor", "vertical-grip"]), ["suppressor", "vertical-grip"]);
  const tuned = applyAttachments(weaponById("ar4"), ["long-barrel", "suppressor"]);
  assert.deepEqual(tuned.attachmentIds, ["suppressor"]);
  assert.equal(tuned.damage, weaponById("ar4").damage * 0.96);
});

test("profile progression awards levels and credits", () => {
  const profile = awardXp(defaultProfile(), 1250);
  assert.equal(profile.level, 2);
  assert.equal(profile.xp, 1250);
  assert.equal(profile.credits, 250);
});

test("operators expose distinct build identities", () => {
  assert.equal(operatorById("scout").speed, 1.1);
  assert.ok(operatorById("medic").health > operatorById("vanguard").health);
  assert.equal(ATTACHMENT_DEFS.length, 11);
  assert.equal(operatorById("atlas").speed, 0.96);
});

test("battle royale zone paths are deterministic and remain playable", () => {
  const first = createBattleRoyaleZonePlan(42, 900);
  const second = createBattleRoyaleZonePlan(42, 900);
  const different = createBattleRoyaleZonePlan(43, 900);

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, different);
  assert.equal(first.phases.length, 5);
  assert.equal(sampleBattleRoyaleZone(first, 0).radius, 31);
  assert.equal(sampleBattleRoyaleZone(first, 900).radius, 7);
  assert.equal(sampleBattleRoyaleZone(first, 0).damage, 3);
  assert.equal(sampleBattleRoyaleZone(first, 900).damage, 15);

  for (const phase of first.phases) {
    const offset = Math.hypot(
      phase.targetCenter.x - phase.startCenter.x,
      phase.targetCenter.z - phase.startCenter.z,
    );
    assert.ok(offset <= phase.startRadius - phase.targetRadius + 1e-9);
    assert.ok(phase.targetRadius < phase.startRadius);
  }
});

test("mode contracts define player and enemy lifecycle separately", () => {
  assert.equal(MODE_DEFS.tdm.enemyRespawn, true);
  assert.equal(MODE_DEFS.tdm.playerRespawn, true);
  assert.equal(MODE_DEFS.tdm.objectiveType, "team-score");
  assert.equal(MODE_DEFS.tdm.scoreLimit, 40);
  assert.equal(MODE_DEFS.tdm.objectiveTarget, 40);
  assert.equal(MODE_DEFS.battleRoyale.enemyRespawn, false);
  assert.equal(MODE_DEFS.battleRoyale.playerRespawn, false);
  assert.equal(MODE_DEFS.survival.enemyRespawn, false);
  assert.equal(MODE_DEFS.tdm.grenadesPerMatch, 2);
  assert.equal(MODE_DEFS.survival.waveKills, 5);
  assert.ok(operatorById("medic").regenRate > operatorById("vanguard").regenRate);
  assert.equal(MODE_DEFS.frontlineOps.objectiveType, "mission");
  assert.equal(MODE_DEFS.frontlineOps.missionId, "first-light");
});

test("match settlement is idempotent and updates persistent statistics", () => {
  const profile = defaultProfile();
  const first = settleMatch(profile, { reason: "win", kills: 4 }, "match-001");
  const second = settleMatch(first.profile, { reason: "win", kills: 4 }, "match-001");

  assert.equal(first.applied, true);
  assert.equal(first.xpGranted, 450);
  assert.equal(first.creditsGranted, 90);
  assert.equal(first.profile.stats.completedMatches, 1);
  assert.equal(first.profile.stats.wins, 1);
  assert.equal(second.applied, false);
  assert.equal(second.profile.xp, first.profile.xp);
  assert.equal(second.profile.credits, first.profile.credits);
  assert.deepEqual(second.profile.settledMatches, ["match-001"]);
});
