/**
 * Parachute insertion model for the Battle Royale prototype.
 * Pure physics so the drop can be tested without a renderer.
 */

export const DROP_CONFIG = {
  planeAltitude: 120,
  gravity: 9.8,
  terminalVelocity: 55,
  autoChuteAltitude: 40,
  chuteDescent: 6,
  driftSpeed: 9,
  landingAltitude: 0,
};

export function createDropState(options = {}) {
  const config = { ...DROP_CONFIG, ...options };
  return {
    phase: "plane",
    altitude: config.planeAltitude,
    velocity: 0,
    chuteOpen: false,
    driftX: 0,
    driftZ: 0,
    elapsed: 0,
    config,
  };
}

/** Leaves the aircraft. No-op unless still aboard. */
export function jumpFromPlane(state) {
  if (state.phase !== "plane") return state;
  return { ...state, phase: "freefall", velocity: 0 };
}

/** Opens the canopy early; freefall only. */
export function deployChute(state) {
  if (state.phase !== "freefall") return state;
  return { ...state, phase: "parachute", chuteOpen: true, velocity: state.config.chuteDescent };
}

/**
 * Advances one tick. `input` is a normalized {x,z} drift command.
 * Returns a new state; `landed` flips when altitude reaches the ground.
 */
export function stepDrop(state, dt, input = { x: 0, z: 0 }) {
  if (state.phase === "plane" || state.phase === "landed") return state;
  const step = Math.max(0, Number(dt) || 0);
  const config = state.config;
  let { altitude, velocity, phase, chuteOpen } = state;

  if (phase === "freefall") {
    velocity = Math.min(config.terminalVelocity, velocity + config.gravity * step);
    altitude -= velocity * step;
    if (altitude <= config.autoChuteAltitude) {
      phase = "parachute";
      chuteOpen = true;
      velocity = config.chuteDescent;
    }
  } else if (phase === "parachute") {
    velocity = config.chuteDescent;
    altitude -= velocity * step;
  }

  const maxDrift = config.driftSpeed * step;
  const clamp = (value) => Math.max(-1, Math.min(1, Number(value) || 0));
  const driftX = state.driftX + clamp(input.x) * maxDrift;
  const driftZ = state.driftZ + clamp(input.z) * maxDrift;

  let nextPhase = phase;
  if (altitude <= config.landingAltitude) {
    altitude = 0;
    velocity = 0;
    nextPhase = "landed";
  }

  return {
    ...state,
    phase: nextPhase,
    altitude,
    velocity,
    chuteOpen,
    driftX,
    driftZ,
    elapsed: state.elapsed + step,
  };
}

export function dropLabel(state) {
  if (state.phase === "plane") return "في الطائرة — اضغط مسافة للقفز";
  if (state.phase === "freefall") return `سقوط حر — ${Math.round(state.altitude)}م`;
  if (state.phase === "parachute") return `المظلة مفتوحة — ${Math.round(state.altitude)}م`;
  return "هبطت";
}
