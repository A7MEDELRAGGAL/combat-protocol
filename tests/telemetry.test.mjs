import test from "node:test";
import assert from "node:assert/strict";
import { Telemetry } from "../js/telemetry.js";

test("telemetry correlates match events and keeps timestamps monotonic", () => {
  let time = 10;
  const telemetry = new Telemetry({ clock: () => time });
  const matchId = telemetry.startMatch("tdm", { duration: 360 });
  time = 5;
  telemetry.emit("shot_fired", { weaponId: "ar4", hit: false });
  time = 25;
  telemetry.endMatch("time", { kills: 2 });

  assert.equal(telemetry.events.length, 3);
  assert.equal(telemetry.events[0].name, "match_started");
  assert.equal(telemetry.events[1].matchId, matchId);
  assert.ok(telemetry.events[1].timestamp >= telemetry.events[0].timestamp);
  assert.equal(telemetry.events[2].name, "match_ended");
  assert.equal(telemetry.matchId, null);
});

test("disabled telemetry has no gameplay-facing event output", () => {
  const telemetry = new Telemetry({ enabled: false });
  telemetry.startMatch("deathmatch");
  telemetry.emit("shot_fired", { weaponId: "ar4" });
  telemetry.endMatch("dead");
  assert.deepEqual(telemetry.events, []);
});

test("telemetry bounds its event buffer and payload size", () => {
  const telemetry = new Telemetry({ maxEvents: 2, clock: () => 1 });
  telemetry.emit("a", Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`key${index}`, index])));
  telemetry.emit("b");
  telemetry.emit("c");
  assert.equal(telemetry.events.length, 2);
  assert.equal(telemetry.events[0].name, "b");
  assert.ok(Object.keys(telemetry.events[1].payload).length <= 16);
});
