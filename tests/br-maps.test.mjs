import test from "node:test";
import assert from "node:assert/strict";
import { BR_MAPS, isBattleRoyaleMap, brMapsForModes, mapById } from "../js/map-data.js";

test("battle royale has dedicated maps", () => {
  assert.ok(BR_MAPS.length >= 2, `${BR_MAPS.length} BR maps`);
  for (const id of BR_MAPS) assert.ok(isBattleRoyaleMap(id), id);
});

test("classic maps are not battle royale maps", () => {
  assert.equal(isBattleRoyaleMap("port"), false);
  assert.equal(isBattleRoyaleMap("drydock9"), false);
});

test("Harbor Town is a full BR map with houses and wider bounds", () => {
  const map = mapById("harborTown");
  assert.equal(map.battleRoyale, true);
  assert.ok(map.houseSpots.length >= 8);
  assert.ok(map.bounds.halfX >= 40);
  assert.ok(map.spawns.length >= 20);
  assert.ok(Object.keys(map.missionPoints).length >= 4);
});

test("lobby filter keeps the chosen map when it is valid for the mode", () => {
  const maps = brMapsForModes("battleRoyale", "meridianExpanse");
  assert.deepEqual(maps, ["meridianExpanse"]);
});

test("lobby filter falls back to a valid BR map for the mode", () => {
  const maps = brMapsForModes("battleRoyale", "port");
  assert.equal(maps.length, BR_MAPS.length);
  assert.equal(maps.includes("port"), false);
});

test("non-br modes exclude BR-only maps", () => {
  const maps = brMapsForModes("deathmatch", "port");
  assert.equal(maps.includes("port"), true);
  for (const id of BR_MAPS) assert.equal(maps.includes(id), false);
});
