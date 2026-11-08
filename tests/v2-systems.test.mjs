import test from "node:test";
import assert from "node:assert/strict";
import {
  ABILITY_DEFS,
  abilityChargeRatio,
  abilityForOperator,
  activateAbility,
  canActivateAbility,
  createAbilityState,
  stepAbilityState,
} from "../js/abilities.js";
import {
  ATTACHMENT_DEFS,
  OPERATOR_DEFS,
  WEAPON_SKINS,
  applyAttachments,
  buySkin,
  defaultProfile,
  loadProfile,
} from "../js/game-data.js";
import { weaponById } from "../js/weapon-data.js";
import { LOOT_POOL } from "../js/loot-data.js";
import { WEAPON_DEFS } from "../js/weapon-data.js";
import { createBox, hasOverheadObstacle, moveWithCollisions } from "../js/utils.js";
import { computeBlastDamage } from "../js/grenade-rules.js";
import { ARCHETYPES, archetypeFor } from "../js/enemies-data.js";
import { inventorySummary, createInventory, addItem } from "../js/inventory.js";
import { STORE_BUNDLES, buyBundle } from "../js/store.js";
import { DEFAULT_FRIENDS, loadFriends, saveFriends, addFriend, removeFriend } from "../js/friends.js";
import { BATTLE_PASS_TIERS, claimBattlePassTier } from "../js/progression.js";
import { createCargoPlane, createParachuteModel } from "../js/aircraft.js";

test("every operator has exactly one active ability with a cooldown", () => {
  for (const operator of OPERATOR_DEFS) {
    const ability = abilityForOperator(operator.id);
    assert.equal(ability.operatorId, operator.id);
    assert.ok(ability.cooldown > 5, `${operator.id} cooldown`);
  }
  assert.equal(Object.keys(ABILITY_DEFS).length, OPERATOR_DEFS.length);
});

test("ability activates once, then locks until the cooldown elapses", () => {
  let state = createAbilityState("medic");
  assert.equal(canActivateAbility(state), true);
  const first = activateAbility(state);
  assert.equal(first.activated, true);
  state = first.state;
  assert.equal(activateAbility(state).activated, false);
  assert.equal(state.uses, 1);
  assert.ok(abilityChargeRatio(state) < 0.01);
  state = stepAbilityState(state, ABILITY_DEFS.medic.cooldown + 1);
  assert.equal(state.cooldownRemaining, 0);
  assert.equal(abilityChargeRatio(state), 1);
  assert.equal(activateAbility(state).activated, true);
});

test("unknown operators fall back to the first ability", () => {
  assert.equal(abilityForOperator("nobody").id, ABILITY_DEFS.vanguard.id);
});

test("step-up lets the body climb low ledges but not walls", () => {
  const step = createBox(2, 0.15, 0, 1, 0.3, 4);
  const position = { x: 0, y: 0, z: 0 };
  const result = moveWithCollisions(position, { x: 3, y: 0, z: 0 }, 0.36, 1.78, [step], 0.42);
  assert.equal(result.stepped, true);
  assert.ok(position.y >= 0.3, `expected y on the step, got ${position.y}`);

  const wall = createBox(2, 1, 0, 1, 2, 4);
  const blocked = { x: 0, y: 0, z: 0 };
  const wallResult = moveWithCollisions(blocked, { x: 3, y: 0, z: 0 }, 0.36, 1.78, [wall], 0.42);
  assert.equal(wallResult.stepped, false);
  assert.equal(wallResult.hitX, true);
  assert.ok(blocked.y === 0);
});

test("wall hit reports the axis so projectiles can reflect correctly", () => {
  const zWall = createBox(0, 1, 2, 4, 2, 1);
  const position = { x: 0, y: 0, z: 0 };
  const result = moveWithCollisions(position, { x: 0, y: 0, z: 3 }, 0.36, 1.78, [zWall]);
  assert.equal(result.hitZ, true);
  assert.equal(result.hitX, false);
});

test("overhead check blocks standing up under a low ceiling", () => {
  const ceiling = createBox(0, 1.55, 0, 3, 0.2, 3);
  assert.equal(hasOverheadObstacle({ x: 0, y: 0, z: 0 }, 0.36, 1.78, [ceiling]), true);
  assert.equal(hasOverheadObstacle({ x: 10, y: 0, z: 0 }, 0.36, 1.78, [ceiling]), false);
});

test("attachment effects produce real gameplay flags", () => {
  const base = weaponById("ar4");
  const suppressed = applyAttachments(base, ["suppressor", "tactical-laser"]);
  assert.equal(suppressed.suppressed, true);
  assert.equal(suppressed.laser, true);
  assert.equal(base.suppressed, undefined);
  const drum = applyAttachments(base, ["drum-mag"]);
  assert.ok(drum.moveSpeed < 1);
  const light = applyAttachments(base, ["light-stock"]);
  assert.ok(light.swapTime < 0.22);
  assert.ok(light.moveSpeed > 1);
});

test("optics and the laser no longer compete for one slot", () => {
  const tuned = applyAttachments(weaponById("ar4"), ["red-dot", "tactical-laser"]);
  assert.deepEqual(tuned.attachmentIds, ["red-dot", "tactical-laser"]);
});

test("every attachment loot item points at a real attachment id", () => {
  const known = new Set(ATTACHMENT_DEFS.map((attachment) => attachment.id));
  const attachments = LOOT_POOL.filter((entry) => entry.kind === "attachment");
  assert.ok(attachments.length >= 5);
  for (const entry of attachments) assert.ok(known.has(entry.attachmentId), entry.attachmentId);
});

test("every weapon has an ammo pickup", () => {
  const covered = new Set(LOOT_POOL.filter((entry) => entry.kind === "ammo").map((entry) => entry.weaponId));
  for (const weapon of WEAPON_DEFS) assert.ok(covered.has(weapon.id), `${weapon.id} ammo`);
});

test("inventory summary reports used weight, not the stack count", () => {
  let inventory = createInventory();
  inventory = addItem(inventory, { id: "armor-25", kind: "armor", name: "x", amount: 25, size: 10 }).inventory;
  assert.ok(inventorySummary(inventory).startsWith("10/"));
});

test("weapon skins are bought with credits and equipped once owned", () => {
  const poor = { ...defaultProfile(), credits: 50 };
  const denied = buySkin(poor, "carbon");
  assert.equal(denied.bought, false);
  assert.equal(denied.reason, "insufficient-credits");
  assert.equal(denied.profile.credits, 50);

  const rich = { ...defaultProfile(), credits: 400 };
  const bought = buySkin(rich, "carbon");
  assert.equal(bought.bought, true);
  assert.equal(bought.profile.credits, 400 - WEAPON_SKINS.find((skin) => skin.id === "carbon").cost);
  assert.equal(bought.profile.equippedSkin, "carbon");
  assert.ok(bought.profile.unlockedSkins.includes("carbon"));

  const again = buySkin(bought.profile, "carbon");
  assert.equal(again.reason, "already-owned");
  assert.equal(again.profile.credits, bought.profile.credits);
});

test("loading a profile never equips a skin the player does not own", () => {
  const storage = { getItem: () => JSON.stringify({ equippedSkin: "protocol", unlockedSkins: ["desert"] }) };
  const profile = loadProfile(storage);
  assert.equal(profile.equippedSkin, "standard");
  assert.ok(profile.unlockedSkins.includes("standard"));
});

test("breach charge keeps the grenade falloff curve with its own radius", () => {
  assert.equal(computeBlastDamage(0, 4.8, 88), 88);
  assert.equal(computeBlastDamage(4.8, 4.8, 88), 0);
  assert.ok(computeBlastDamage(2.4, 4.8, 88) > 40);
});

test("enemy archetypes are deterministic and cover four distinct roles", () => {
  assert.equal(ARCHETYPES.length, 4);
  assert.equal(new Set(ARCHETYPES.map((entry) => entry.id)).size, 4);
  assert.equal(archetypeFor(0).id, archetypeFor(4).id);
  const marksman = ARCHETYPES.find((entry) => entry.id === "marksman");
  const rusher = ARCHETYPES.find((entry) => entry.id === "rusher");
  const heavy = ARCHETYPES.find((entry) => entry.id === "heavy");
  assert.ok(marksman.engageRange > rusher.engageRange);
  assert.ok(heavy.health > marksman.health);
  assert.ok(rusher.speed > heavy.speed);
});

test("tactical store bundles are well formed and purchase flow works", () => {
  assert.ok(STORE_BUNDLES.length >= 4);
  for (const bundle of STORE_BUNDLES) {
    assert.ok(bundle.id);
    assert.ok(bundle.name);
    assert.ok(bundle.arabic);
    assert.ok(bundle.price > 0);
    assert.ok(bundle.skinId);
  }

  const poor = { ...defaultProfile(), credits: 50, claimedBundles: [] };
  const denied = buyBundle(poor, "bundle-shadow");
  assert.equal(denied.bought, false);
  assert.equal(denied.reason, "insufficient-credits");
  assert.equal(denied.profile.credits, 50);

  const rich = { ...defaultProfile(), credits: 2500, claimedBundles: [], unlockedSkins: ["standard"] };
  const bought = buyBundle(rich, "bundle-shadow");
  assert.equal(bought.bought, true);
  assert.ok(bought.profile.credits < 2500);
  assert.ok(bought.profile.claimedBundles.includes("bundle-shadow"));
  assert.ok(bought.profile.unlockedSkins.includes("carbon"));

  const repeat = buyBundle(bought.profile, "bundle-shadow");
  assert.equal(repeat.bought, false);
  assert.equal(repeat.reason, "already-owned");
});

test("social squad and friends system manages roster and storage", () => {
  const memStore = {};
  const mockStorage = {
    getItem: (k) => memStore[k] ?? null,
    setItem: (k, v) => {
      memStore[k] = String(v);
    },
  };

  const initial = loadFriends(mockStorage);
  assert.equal(initial.length, DEFAULT_FRIENDS.length);
  assert.ok(initial.some((f) => f.status === "online"));
  assert.ok(initial.some((f) => f.status === "in-match"));

  const res = addFriend(initial, "Ghost-77", mockStorage);
  assert.equal(res.success, true);
  assert.equal(res.friends.length, initial.length + 1);
  const ghost = res.friend;
  assert.ok(ghost);
  assert.equal(ghost.name, "Ghost-77");
  assert.equal(ghost.status, "online");

  // Blank name should not add
  const blank = addFriend(res.friends, "   ", mockStorage);
  assert.equal(blank.success, false);
  assert.equal(blank.friends.length, res.friends.length);

  // Removing a friend
  const removed = removeFriend(res.friends, ghost.id, mockStorage);
  assert.equal(removed.length, initial.length);
  assert.ok(!removed.some((f) => f.id === ghost.id));

  // Round-trip reload from storage
  const reloaded = loadFriends(mockStorage);
  assert.equal(reloaded.length, initial.length);
});

test("battle pass has 10 tiers with progressive unlocks and rewards", () => {
  assert.equal(BATTLE_PASS_TIERS.length, 10);
  for (let i = 0; i < BATTLE_PASS_TIERS.length; i += 1) {
    const tier = BATTLE_PASS_TIERS[i];
    assert.equal(tier.tier, i + 1);
    assert.ok(tier.levelReq >= tier.tier);
    assert.ok(tier.reward);
  }

  // Level 1 profile trying to claim tier 5
  const lowLevel = { ...defaultProfile(), level: 1, claimedPassTiers: [] };
  const denied = claimBattlePassTier(lowLevel, 5);
  assert.equal(denied.claimed, false);
  assert.equal(denied.reason, "level-too-low");

  // Level 10 profile claiming tier 1
  const highLevel = { ...defaultProfile(), level: 10, credits: 100, claimedPassTiers: [] };
  const claimed1 = claimBattlePassTier(highLevel, 1);
  assert.equal(claimed1.claimed, true);
  assert.ok(claimed1.profile.credits > 100);
  assert.ok(claimed1.profile.claimedPassTiers.includes(1));

  // Trying to claim tier 1 again fails
  const repeat = claimBattlePassTier(claimed1.profile, 1);
  assert.equal(repeat.claimed, false);
  assert.equal(repeat.reason, "already-claimed");
});

test("3D procedural C-130 cargo plane and tactical parachute instantiate cleanly", () => {
  const plane = createCargoPlane();
  assert.ok(plane.group);
  assert.equal(plane.group.name, "cargo-aircraft");
  assert.equal(plane.propGroups.length, 4);

  const initialPropRot = plane.propGroups[0].rotation.z;
  plane.update(0.1);
  assert.ok(plane.propGroups[0].rotation.z > initialPropRot);

  plane.setJumpReady(true);
  assert.equal(plane.jumpLightGreen.visible, true);
  assert.equal(plane.jumpLightRed.visible, false);

  const chute = createParachuteModel();
  assert.ok(chute.group);
  assert.equal(chute.group.name, "tactical-parachute");
  assert.ok(chute.group.children.length >= 3);
  chute.update(0.1, 6);
});
