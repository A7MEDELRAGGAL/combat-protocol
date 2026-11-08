import test from "node:test";
import assert from "node:assert/strict";

import { PUBG_TIERS, getTierForRp, calculateMatchRp, applyMatchRp } from "../js/pubg-ranks.js";
import { DEFAULT_WORLD_MESSAGES, QUICK_MESSAGES, createChatState, addMessage, filterMessagesByChannel, sanitizeChatMessage } from "../js/chat.js";
import { CRATE_DEFS, rollSingleItem, openCrate } from "../js/crates.js";
import { UPGRADABLE_WEAPONS, getWeaponUpgradeLevel, upgradeLabWeapon } from "../js/gun-lab.js";
import { createLobbyCharacter, LobbyShowcase } from "../js/lobby-showcase.js";
import { defaultProfile } from "../js/game-data.js";
import * as THREE from "../vendor/three.module.js";

test("PUBG tiers are sorted and calculate divisions accurately", () => {
  assert.equal(PUBG_TIERS.length, 8);
  const bronze = getTierForRp(1250);
  assert.equal(bronze.id, "bronze");
  assert.equal(bronze.division, "V");

  const gold = getTierForRp(2350);
  assert.equal(gold.id, "gold");

  const ace = getTierForRp(4300);
  assert.equal(ace.id, "ace");
  assert.equal(ace.fullTitle, "إيس");

  const conqueror = getTierForRp(5500);
  assert.equal(conqueror.id, "conqueror");
  assert.equal(conqueror.fullTitle, "الغازي");
});

test("Match RP reward rewards kills and high placement in Battle Royale", () => {
  const win = calculateMatchRp({ placement: 1, kills: 6, survivalSeconds: 300 });
  assert.ok(win.delta >= 45, `expected >= 45 RP, got ${win.delta}`);
  assert.equal(win.placementPoints, 35);

  const loss = calculateMatchRp({ placement: 18, kills: 0, survivalSeconds: 20 });
  assert.ok(loss.delta < 0, `early death should lose RP: ${loss.delta}`);

  const profile = { ...defaultProfile(), rp: 1680 };
  const result = applyMatchRp(profile, { placement: 1, kills: 4, survivalSeconds: 200 });
  assert.ok(result.profile.rp > 1700);
  assert.equal(result.newTier.id, "silver");
  assert.equal(result.promoted, true);
});

test("Lobby world chat filters channels and sanitizes input", () => {
  let state = createChatState();
  assert.ok(state.messages.length >= 3);

  state = addMessage(state, { sender: "Falcon", rank: "تاج I", text: "<b>مرحبا بالجميع!</b>", channel: "world" });
  assert.equal(state.messages[0].sender, "Falcon");
  assert.equal(state.messages[0].text, "bمرحبا بالجميع!/b");

  const squadMsgs = filterMessagesByChannel(state.messages, "squad");
  assert.ok(Array.isArray(squadMsgs));

  assert.ok(QUICK_MESSAGES.length >= 4);
});

test("Lucky Crates handle single and 10x spins with credit checks", () => {
  assert.equal(CRATE_DEFS.length, 2);
  const crate = CRATE_DEFS[0];

  const poor = { ...defaultProfile(), credits: 20 };
  const denied = openCrate(poor, crate.id, 1);
  assert.equal(denied.success, false);
  assert.equal(denied.reason, "insufficient-credits");

  const rich = { ...defaultProfile(), credits: 3000, unlockedSkins: ["standard"] };
  const singlePull = openCrate(rich, crate.id, 1);
  assert.equal(singlePull.success, true);
  assert.equal(singlePull.results.length, 1);
  assert.equal(singlePull.totalCost, crate.cost);
  assert.ok(singlePull.profile.credits === 3000 - crate.cost || singlePull.results[0].kind === "credits");

  const tenPull = openCrate(singlePull.profile, crate.id, 10);
  assert.equal(tenPull.success, true);
  assert.equal(tenPull.results.length, 10);
});

test("Gun Lab upgrades weapons with progressive levels and material costs", () => {
  assert.ok(UPGRADABLE_WEAPONS.length >= 2);
  const glacier = UPGRADABLE_WEAPONS[0];
  assert.equal(glacier.maxLevel, 4);

  const initialProfile = { ...defaultProfile(), credits: 100, weaponMaterials: 10, labUpgrades: {} };
  assert.equal(getWeaponUpgradeLevel(initialProfile, glacier.id), 1);

  // Insufficient resources
  const denied = upgradeLabWeapon(initialProfile, glacier.id);
  assert.equal(denied.upgraded, false);
  assert.equal(denied.reason, "insufficient-resources");

  // Rich in materials and credits
  const richProfile = { ...defaultProfile(), credits: 1500, weaponMaterials: 500, labUpgrades: {} };
  const upgraded = upgradeLabWeapon(richProfile, glacier.id);
  assert.equal(upgraded.upgraded, true);
  assert.equal(upgraded.newLevel, 2);
  assert.equal(getWeaponUpgradeLevel(upgraded.profile, glacier.id), 2);
  assert.ok(upgraded.profile.weaponMaterials < 500);
});

test("3D Lobby character and squad podium instantiate cleanly", () => {
  const char = createLobbyCharacter("vanguard", "carbon", "Hero");
  assert.ok(char.group);
  assert.ok(char.gunGroup);
  char.setSkin("desert");
  char.update(0.5);

  const scene = new THREE.Scene();
  const showcase = new LobbyShowcase({ scene });
  assert.ok(showcase.root);
  showcase.setPlayer("scout", "arctic", "Me");
  showcase.setSquad([{ name: "Mate1", operator: "medic" }, { name: "Mate2", operator: "atlas" }]);
  assert.equal(showcase.squadMembers.length, 2);

  showcase.onPointerDown(100);
  showcase.onPointerMove(150);
  showcase.onPointerUp();
  showcase.update(0.016, 1.2);
});
