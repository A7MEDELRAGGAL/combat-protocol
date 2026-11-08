import { clamp, lerp, seededRandom, TAU } from "./utils.js";

const DEFAULT_ZONE = {
  phases: 5,
  initialCenter: { x: 0, z: 0 },
  initialRadius: 31,
  finalRadius: 7,
  initialDamage: 3,
  finalDamage: 15,
};

function copyCenter(center) {
  return { x: Number(center.x) || 0, z: Number(center.z) || 0 };
}

/**
 * Builds a deterministic shrinking-zone path for the local Battle Royale mode.
 * Each target circle stays inside its previous circle, so players are never
 * pushed into an impossible zone jump when the phase changes.
 */
export function createBattleRoyaleZonePlan(seed = 1, duration = 900, options = {}) {
  const config = { ...DEFAULT_ZONE, ...options };
  const phaseCount = Math.max(1, Math.floor(config.phases));
  const totalDuration = Math.max(0.001, Number(duration) || 0.001);
  const random = seededRandom(seed);
  const phaseDuration = totalDuration / phaseCount;
  const phases = [];
  let startCenter = copyCenter(config.initialCenter);
  let startRadius = Math.max(0.1, Number(config.initialRadius) || DEFAULT_ZONE.initialRadius);

  for (let index = 0; index < phaseCount; index += 1) {
    const progress = (index + 1) / phaseCount;
    const targetRadius = lerp(startRadius, Math.max(0.1, Number(config.finalRadius) || DEFAULT_ZONE.finalRadius), 1 / (phaseCount - index));
    const maxOffset = Math.max(0, (startRadius - targetRadius) * 0.8);
    const angle = random() * TAU;
    const distance = Math.sqrt(random()) * maxOffset;
    const targetCenter = {
      x: startCenter.x + Math.cos(angle) * distance,
      z: startCenter.z + Math.sin(angle) * distance,
    };

    phases.push({
      startTime: index * phaseDuration,
      endTime: (index + 1) * phaseDuration,
      startCenter,
      targetCenter,
      startRadius,
      targetRadius,
      startDamage: lerp(config.initialDamage, config.finalDamage, index / phaseCount),
      targetDamage: lerp(config.initialDamage, config.finalDamage, progress),
    });

    startCenter = targetCenter;
    startRadius = targetRadius;
  }

  return {
    seed,
    duration: totalDuration,
    phases,
  };
}

/** Samples the deterministic plan at elapsed match time without mutating it. */
export function sampleBattleRoyaleZone(plan, elapsedSeconds = 0) {
  if (!plan?.phases?.length) {
    return {
      center: { x: 0, z: 0 },
      radius: DEFAULT_ZONE.initialRadius,
      damage: DEFAULT_ZONE.initialDamage,
      progress: 0,
    };
  }

  const elapsed = clamp(Number(elapsedSeconds) || 0, 0, plan.duration);
  const phaseDuration = plan.duration / plan.phases.length;
  const phaseIndex = Math.min(plan.phases.length - 1, Math.floor(elapsed / phaseDuration));
  const phase = plan.phases[phaseIndex];
  const phaseProgress = clamp((elapsed - phase.startTime) / (phase.endTime - phase.startTime), 0, 1);

  return {
    center: {
      x: lerp(phase.startCenter.x, phase.targetCenter.x, phaseProgress),
      z: lerp(phase.startCenter.z, phase.targetCenter.z, phaseProgress),
    },
    radius: lerp(phase.startRadius, phase.targetRadius, phaseProgress),
    damage: lerp(phase.startDamage, phase.targetDamage, phaseProgress),
    progress: clamp(elapsed / plan.duration, 0, 1),
  };
}
