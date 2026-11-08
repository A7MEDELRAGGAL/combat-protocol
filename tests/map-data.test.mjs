import test from "node:test";
import assert from "node:assert/strict";
import { MAP_DEFS, mapById } from "../js/map-data.js";

test("the prototype exposes five deterministic map layouts", () => {
  assert.deepEqual(Object.keys(MAP_DEFS), ["port", "crossline", "stackyard", "drydock9", "nightBazaar"]);
  assert.equal(new Set(Object.values(MAP_DEFS).map((map) => map.label)).size, 5);
  for (const map of Object.values(MAP_DEFS)) {
    assert.equal(map.spawns.length, 6);
    assert.ok(map.containers.length >= 10);
    assert.ok(map.markers.length >= 2);
    assert.ok(map.flow.length > 12);
    for (const spawn of map.spawns) {
      assert.ok(Math.abs(spawn.x) <= 34);
      assert.ok(Math.abs(spawn.z) <= 24);
    }
  }
  assert.equal(mapById("unknown").id, "port");
});
