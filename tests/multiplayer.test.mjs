import test from "node:test";
import assert from "node:assert/strict";
import { createBox } from "../js/utils.js";
import {
  MAX_PLAYERS,
  addPlayer,
  applyShot,
  createRoom,
  removePlayer,
  sanitizeName,
  sanitizeRoom,
  snapshot,
  tickRoom,
  updatePlayer,
} from "../js/multiplayer-room.js";

test("multiplayer room adds players and clamps state", () => {
  const room = createRoom("Arena 01");
  assert.equal(room.id, "arena01");
  const player = addPlayer(room, { id: "p1", name: "  Ahmed!  " });
  assert.equal(player.name, "Ahmed");
  updatePlayer(room, "p1", { x: 999, y: -3, z: 12, yaw: 1.2, pitch: 0.3, weapon: "ar4" });
  const state = snapshot(room)[0];
  assert.equal(state.x, 80);
  assert.equal(state.y, 0);
  assert.equal(state.z, 12);
  assert.equal(state.weapon, "ar4");
});

test("room enforces its player cap and supports leaving", () => {
  const room = createRoom("cap");
  for (let index = 0; index < MAX_PLAYERS; index += 1) {
    assert.ok(addPlayer(room, { id: `p${index}`, name: `P${index}` }));
  }
  assert.equal(addPlayer(room, { id: "overflow", name: "Overflow" }), null);
  assert.equal(removePlayer(room, "p0"), true);
  assert.equal(room.players.size, MAX_PLAYERS - 1);
});

test("server-side shot hits the nearest player and applies damage", () => {
  const room = createRoom("shots");
  addPlayer(room, { id: "shooter", name: "Shooter" });
  addPlayer(room, { id: "target", name: "Target" });
  updatePlayer(room, "shooter", { x: 0, y: 0, z: 0 });
  updatePlayer(room, "target", { x: 0, y: 0, z: 6 });
  const result = applyShot(room, "shooter", { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 34, 1000);
  assert.equal(result.hit, true);
  assert.equal(result.targetId, "target");
  assert.equal(result.health, 66);
  assert.equal(room.players.get("target").health, 66);
});

test("a miss does not damage anyone", () => {
  const room = createRoom("miss");
  addPlayer(room, { id: "shooter", name: "Shooter" });
  addPlayer(room, { id: "target", name: "Target" });
  updatePlayer(room, "target", { x: 10, y: 0, z: 6 });
  const result = applyShot(room, "shooter", { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 34);
  assert.equal(result.hit, false);
});

test("lethal damage respawns after the room timer", () => {
  const room = createRoom("respawn");
  addPlayer(room, { id: "shooter", name: "Shooter" });
  addPlayer(room, { id: "target", name: "Target" });
  updatePlayer(room, "target", { x: 0, y: 0, z: 4 });
  const hit = applyShot(room, "shooter", { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 100, 2000);
  assert.equal(hit.killed, true);
  assert.equal(room.players.get("target").dead, true);
  assert.equal(room.players.get("shooter").kills, 1);
  assert.deepEqual(tickRoom(room, 2000 + 100), []);
  const events = tickRoom(room, 2000 + 4000);
  assert.equal(events.length, 1);
  assert.equal(room.players.get("target").dead, false);
  assert.equal(room.players.get("target").health, 100);
});

test("names and room ids are sanitized", () => {
  assert.equal(sanitizeName("<script>"), "script");
  assert.equal(sanitizeRoom("Room #1!"), "room1");
  assert.equal(sanitizeRoom(""), "arena");
});

test("obstacle blocks shot when placed between players", () => {
  const room = createRoom("wall-test");
  addPlayer(room, { id: "shooter", name: "Shooter" });
  addPlayer(room, { id: "target", name: "Target" });
  updatePlayer(room, "shooter", { x: 0, y: 0, z: 0 });
  updatePlayer(room, "target", { x: 0, y: 0, z: 10 });
  const wall = createBox(0, 1, 5, 4, 3, 2);
  const result = applyShot(room, "shooter", { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 34, 1000, [wall]);
  assert.equal(result.hit, false);
  assert.equal(result.blockedByObstacle, true);
  assert.equal(room.players.get("target").health, 100);
});

test("multiplayer room syncs operator and weapon skins", () => {
  const room = createRoom("customs");
  const player = addPlayer(room, { id: "p1", name: "Rook", operator: "atlas", skin: "protocol" });
  assert.equal(player.operator, "atlas");
  assert.equal(player.skin, "protocol");
  updatePlayer(room, "p1", { operator: "scout", skin: "carbon" });
  const snap = snapshot(room)[0];
  assert.equal(snap.operator, "scout");
  assert.equal(snap.skin, "carbon");
});
