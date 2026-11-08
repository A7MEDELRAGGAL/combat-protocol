import test from "node:test";
import assert from "node:assert/strict";
import { advanceMission, createMissionState, getMissionSnapshot, missionById } from "../js/mission-rules.js";

test("First Light progresses through kiosk, relay hold, and extraction", () => {
  const mission = missionById("first-light");
  let state = createMissionState(mission);
  let result = advanceMission(state, mission, { nearPoint: true });
  state = result.state;
  assert.equal(state.state, "recover_key");

  result = advanceMission(state, mission, { dt: mission.recoverSeconds, nearPoint: true, interactHeld: true });
  state = result.state;
  assert.equal(state.state, "secure_relay");

  state = advanceMission(state, mission, { nearPoint: true, interactHeld: true }).state;
  assert.equal(state.state, "hold_relay");

  state = advanceMission(state, mission, { dt: mission.holdSeconds, nearPoint: true }).state;
  assert.equal(state.state, "extract");

  state = advanceMission(state, mission, { nearPoint: true }).state;
  assert.equal(state.state, "success");
  assert.equal(getMissionSnapshot(state, mission).progress, 1);
});

test("First Light cannot skip the relay hold and fails on player death", () => {
  const mission = missionById("first-light");
  let state = createMissionState(mission);
  state = advanceMission(state, mission, { nearPoint: true }).state;
  state = advanceMission(state, mission, { dt: mission.recoverSeconds, nearPoint: true, interactHeld: true }).state;
  state = advanceMission(state, mission, { nearPoint: true, interactHeld: true }).state;
  assert.equal(state.state, "hold_relay");
  assert.equal(advanceMission(state, mission, { nearPoint: true }).state.state, "hold_relay");
  const failed = advanceMission(state, mission, { playerDead: true }).state;
  assert.equal(failed.state, "failure");
  assert.equal(failed.failureReason, "dead");
});
