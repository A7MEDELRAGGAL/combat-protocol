import test from "node:test";
import assert from "node:assert/strict";
import { DROP_CONFIG, createDropState, deployChute, dropLabel, jumpFromPlane, stepDrop } from "../js/drop.js";

test("starts aboard the plane at drop altitude", () => {
  const state = createDropState();
  assert.equal(state.phase, "plane");
  assert.equal(state.altitude, DROP_CONFIG.planeAltitude);
  assert.equal(state.chuteOpen, false);
});

test("plane stays level until the player jumps", () => {
  const state = createDropState();
  const same = stepDrop(state, 1);
  assert.equal(same.phase, "plane");
  assert.equal(same.altitude, DROP_CONFIG.planeAltitude);
});

test("freefall accelerates up to terminal velocity", () => {
  let state = jumpFromPlane(createDropState());
  state = stepDrop(state, 1);
  const firstVelocity = state.velocity;
  assert.ok(firstVelocity > 0, "should speed up");
  for (let index = 0; index < 40; index += 1) state = stepDrop(state, 0.5);
  assert.ok(state.velocity <= DROP_CONFIG.terminalVelocity, `${state.velocity}`);
});

test("canopy opens automatically at the configured altitude", () => {
  let state = jumpFromPlane(createDropState());
  while (state.phase === "freefall") state = stepDrop(state, 0.2);
  assert.equal(state.phase, "parachute");
  assert.equal(state.chuteOpen, true);
  assert.ok(state.altitude <= DROP_CONFIG.autoChuteAltitude + 0.001);
});

test("manual chute deploys early and only from freefall", () => {
  const falling = stepDrop(jumpFromPlane(createDropState()), 0.5);
  const opened = deployChute(falling);
  assert.equal(opened.phase, "parachute");
  const onPlane = deployChute(createDropState());
  assert.equal(onPlane.phase, "plane");
});

test("landing clamps altitude and velocity to zero", () => {
  let state = jumpFromPlane(createDropState());
  for (let index = 0; index < 400 && state.phase !== "landed"; index += 1) state = stepDrop(state, 0.25);
  assert.equal(state.phase, "landed");
  assert.equal(state.altitude, 0);
  assert.equal(state.velocity, 0);
});

test("drift is clamped to the configured speed", () => {
  let state = jumpFromPlane(createDropState());
  state = stepDrop(state, 1, { x: 5, z: -5 });
  assert.ok(Math.abs(state.driftX) <= DROP_CONFIG.driftSpeed + 0.001);
  assert.ok(Math.abs(state.driftZ) <= DROP_CONFIG.driftSpeed + 0.001);
});

test("labels describe each phase", () => {
  assert.match(dropLabel(createDropState()), /الطائرة/);
  assert.match(dropLabel({ ...createDropState(), phase: "freefall", altitude: 88 }), /88/);
  assert.match(dropLabel({ ...createDropState(), phase: "parachute", altitude: 22 }), /المظلة/);
  assert.equal(dropLabel({ ...createDropState(), phase: "landed" }), "هبطت");
});
