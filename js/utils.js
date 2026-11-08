export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function shortestAngle(from, to) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}

export function moveTowardsAngle(current, target, maxDelta) {
  const delta = shortestAngle(current, target);
  return current + clamp(delta, -maxDelta, maxDelta);
}

export function formatClock(totalSeconds) {
  const value = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createBox(centerX, centerY, centerZ, sizeX, sizeY, sizeZ) {
  return {
    min: { x: centerX - sizeX / 2, y: centerY - sizeY / 2, z: centerZ - sizeZ / 2 },
    max: { x: centerX + sizeX / 2, y: centerY + sizeY / 2, z: centerZ + sizeZ / 2 },
  };
}

export function boxesOverlap(a, b) {
  return (
    a.min.x < b.max.x &&
    a.max.x > b.min.x &&
    a.min.y < b.max.y &&
    a.max.y > b.min.y &&
    a.min.z < b.max.z &&
    a.max.z > b.min.z
  );
}

export function bodyBox(position, radius, height) {
  return {
    min: { x: position.x - radius, y: position.y, z: position.z - radius },
    max: { x: position.x + radius, y: position.y + height, z: position.z + radius },
  };
}

export function hasOverheadObstacle(position, radius, targetHeight, colliders) {
  const probe = {
    min: { x: position.x - radius * 0.92, y: position.y + 0.4, z: position.z - radius * 0.92 },
    max: { x: position.x + radius * 0.92, y: position.y + targetHeight, z: position.z + radius * 0.92 },
  };
  for (const collider of colliders) {
    if (boxesOverlap(probe, collider)) return true;
  }
  return false;
}

/**
 * Moves a vertical body against a list of axis-aligned boxes.
 * Position is the feet position. Mutates position and returns contact flags.
 */
export function moveWithCollisions(position, delta, radius, height, colliders, stepHeight = 0) {
  const result = { grounded: false, hitWall: false, hitX: false, hitZ: false, ceiling: false, stepped: false };
  const epsilon = 0.001;
  const maxComponent = Math.max(Math.abs(delta.x), Math.abs(delta.y), Math.abs(delta.z));
  const steps = Math.max(1, Math.min(32, Math.ceil(maxComponent / 0.2)));
  const step = { x: delta.x / steps, y: delta.y / steps, z: delta.z / steps };

  const tryStepUp = (collider) => {
    if (stepHeight <= 0) return false;
    const rise = collider.max.y - position.y;
    if (rise <= 0 || rise > stepHeight + epsilon) return false;
    const candidate = { x: position.x, y: collider.max.y + epsilon, z: position.z };
    const candidateBox = bodyBox(candidate, radius, height);
    for (const other of colliders) {
      if (boxesOverlap(candidateBox, other)) return false;
    }
    position.y = candidate.y;
    result.grounded = true;
    result.stepped = true;
    return true;
  };

  for (let index = 0; index < steps; index += 1) {
    position.x += step.x;
    if (step.x !== 0) {
      let box = bodyBox(position, radius, height);
      for (const collider of colliders) {
        if (!boxesOverlap(box, collider)) continue;
        if (tryStepUp(collider)) {
          box = bodyBox(position, radius, height);
          continue;
        }
        if (step.x > 0) position.x = collider.min.x - radius - epsilon;
        else position.x = collider.max.x + radius + epsilon;
        box = bodyBox(position, radius, height);
        result.hitWall = true;
        result.hitX = true;
      }
    }

    position.z += step.z;
    if (step.z !== 0) {
      let box = bodyBox(position, radius, height);
      for (const collider of colliders) {
        if (!boxesOverlap(box, collider)) continue;
        if (tryStepUp(collider)) {
          box = bodyBox(position, radius, height);
          continue;
        }
        if (step.z > 0) position.z = collider.min.z - radius - epsilon;
        else position.z = collider.max.z + radius + epsilon;
        box = bodyBox(position, radius, height);
        result.hitWall = true;
        result.hitZ = true;
      }
    }

    position.y += step.y;
    let box = bodyBox(position, radius, height);
    for (const collider of colliders) {
      if (!boxesOverlap(box, collider)) continue;
      if (step.y <= 0) {
        position.y = collider.max.y + epsilon;
        result.grounded = true;
      } else {
        position.y = collider.min.y - height - epsilon;
        result.ceiling = true;
      }
      box = bodyBox(position, radius, height);
    }

    if (position.y <= 0) {
      position.y = 0;
      result.grounded = true;
    }
  }

  return result;
}

export function damageFalloff(distance, start, end, minimum = 0.5) {
  if (distance <= start) return 1;
  if (distance >= end) return minimum;
  const t = (distance - start) / (end - start);
  return lerp(1, minimum, clamp(t, 0, 1));
}

export function segmentHitsBox(origin, direction, distance, box) {
  // Slab test for line of sight. Direction must be normalized.
  let tmin = 0;
  let tmax = distance;
  for (const axis of ["x", "y", "z"]) {
    const originValue = origin[axis];
    const directionValue = direction[axis];
    if (Math.abs(directionValue) < 1e-8) {
      if (originValue < box.min[axis] || originValue > box.max[axis]) return false;
      continue;
    }
    let t1 = (box.min[axis] - originValue) / directionValue;
    let t2 = (box.max[axis] - originValue) / directionValue;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
