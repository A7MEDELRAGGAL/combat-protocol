/**
 * Server-authoritative room model for the local multiplayer prototype.
 * Pure data/functions so the server and tests share the same rules.
 */

import { createBox, segmentHitsBox } from "./utils.js";
import { mapById } from "./map-data.js";

export const MAX_PLAYERS = 16;
export const HIT_RADIUS = 0.62;
export const RESPAWN_MS = 3200;
export const PLAYER_HEIGHT = 1.78;

const clampNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function sanitizeName(value, fallback = "Player") {
  const name = String(value ?? "").replace(/[^\p{L}\p{N}_ -]/gu, "").trim().slice(0, 16);
  return name || fallback;
}

export function sanitizeRoom(value, fallback = "arena") {
  const room = String(value ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 20);
  return room || fallback;
}

export function getMapObstacles(mapId = "port") {
  const map = mapById(mapId);
  const boxes = [];
  if (!map) return boxes;
  for (const c of map.containers ?? []) {
    const [x, z, length, width, height, _tier, rotation = 0, elevation = 0] = c;
    const isRot = Math.abs(rotation) > 0.1;
    const sizeX = isRot ? width : length;
    const sizeZ = isRot ? length : width;
    boxes.push(createBox(x, height / 2 + elevation, z, sizeX, height, sizeZ));
  }
  for (const cr of map.crates ?? []) {
    const [x, z, size, height = 1.2] = cr;
    boxes.push(createBox(x, height / 2, z, size, height, size));
  }
  for (const b of map.barriers ?? []) {
    const [x, z, width, rotation = 0] = b;
    const height = 1.25;
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    boxes.push(createBox(x, height / 2, z, width * cos + 0.5 * sin, height, width * sin + 0.5 * cos));
  }
  return boxes;
}

export function createRoom(id = "arena", mapId = "port") {
  return {
    id: sanitizeRoom(id),
    mapId,
    obstacles: getMapObstacles(mapId),
    players: new Map(),
    createdAt: Date.now(),
  };
}

export function addPlayer(room, player) {
  if (!room || room.players.size >= MAX_PLAYERS) return null;
  const entry = {
    id: player.id,
    name: sanitizeName(player.name),
    color: player.color ?? "#d8a35a",
    operator: typeof player.operator === "string" ? player.operator.slice(0, 16) : "vanguard",
    skin: typeof player.skin === "string" ? player.skin.slice(0, 16) : "standard",
    x: 0,
    y: 0,
    z: 20,
    yaw: 0,
    pitch: 0,
    health: 100,
    dead: false,
    kills: 0,
    deaths: 0,
    respawnAt: 0,
    weapon: "ar4",
    lastSeen: Date.now(),
  };
  room.players.set(entry.id, entry);
  return entry;
}

export function removePlayer(room, id) {
  if (!room) return false;
  return room.players.delete(id);
}

export function updatePlayer(room, id, state = {}) {
  const player = room?.players.get(id);
  if (!player) return null;
  player.x = Math.max(-80, Math.min(80, clampNumber(state.x, player.x)));
  player.y = Math.max(0, Math.min(8, clampNumber(state.y, player.y)));
  player.z = Math.max(-80, Math.min(80, clampNumber(state.z, player.z)));
  player.yaw = clampNumber(state.yaw, player.yaw);
  player.pitch = Math.max(-1.5, Math.min(1.5, clampNumber(state.pitch, player.pitch)));
  player.weapon = typeof state.weapon === "string" ? state.weapon.slice(0, 12) : player.weapon;
  if (typeof state.operator === "string") player.operator = state.operator.slice(0, 16);
  if (typeof state.skin === "string") player.skin = state.skin.slice(0, 16);
  player.lastSeen = Date.now();
  return player;
}

export function snapshot(room) {
  if (!room) return [];
  return [...room.players.values()].map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    operator: player.operator ?? "vanguard",
    skin: player.skin ?? "standard",
    x: Number(player.x.toFixed(2)),
    y: Number(player.y.toFixed(2)),
    z: Number(player.z.toFixed(2)),
    yaw: Number(player.yaw.toFixed(2)),
    pitch: Number(player.pitch.toFixed(2)),
    health: Math.round(player.health),
    dead: player.dead,
    kills: player.kills,
    deaths: player.deaths,
    weapon: player.weapon,
  }));
}

export function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    operator: player.operator ?? "vanguard",
    skin: player.skin ?? "standard",
    health: Math.round(player.health),
    dead: player.dead,
    kills: player.kills,
    deaths: player.deaths,
  };
}

/**
 * Ray vs. vertical player capsule. Walls are client-side only in this MVP.
 * Returns the nearest hit and applies damage server-side.
 */
export function applyShot(room, shooterId, origin, direction, damage = 24, now = Date.now(), obstacles = room?.obstacles ?? []) {
  const shooter = room?.players.get(shooterId);
  if (!shooter || shooter.dead) return { hit: false };
  const ox = clampNumber(origin?.x);
  const oy = clampNumber(origin?.y);
  const oz = clampNumber(origin?.z);
  let dx = clampNumber(direction?.x);
  let dy = clampNumber(direction?.y);
  let dz = clampNumber(direction?.z);
  const length = Math.hypot(dx, dy, dz);
  if (length < 0.001) return { hit: false };
  dx /= length;
  dy /= length;
  dz /= length;

  let best = null;
  let bestT = Infinity;
  for (const player of room.players.values()) {
    if (player.id === shooterId || player.dead) continue;
    const centerX = player.x;
    const centerY = player.y + 1.0;
    const centerZ = player.z;
    const t = (centerX - ox) * dx + (centerY - oy) * dy + (centerZ - oz) * dz;
    if (t < 0 || t > 140 || t >= bestT) continue;
    const closestX = ox + dx * t;
    const closestY = oy + dy * t;
    const closestZ = oz + dz * t;
    // Vertical capsule: horizontal radius plus a body-height band. A sphere
    // around the chest would miss players standing on stairs or low ground.
    const horizontalSq = (closestX - centerX) ** 2 + (closestZ - centerZ) ** 2;
    if (horizontalSq > HIT_RADIUS * HIT_RADIUS) continue;
    if (closestY < player.y - 0.15 || closestY > player.y + PLAYER_HEIGHT + 0.15) continue;
    best = player;
    bestT = t;
  }

  if (!best) return { hit: false };

  // Block shot if an obstacle box intercepts the line of sight before the target
  if (Array.isArray(obstacles) && obstacles.length > 0) {
    const rayDir = { x: dx, y: dy, z: dz };
    for (const box of obstacles) {
      if (box && segmentHitsBox(origin, rayDir, bestT, box)) {
        return { hit: false, blockedByObstacle: true };
      }
    }
  }

  const applied = Math.max(4, Math.min(100, Math.round(clampNumber(damage, 24))));
  best.health = Math.max(0, best.health - applied);
  const killed = best.health <= 0;
  if (killed) {
    best.dead = true;
    best.respawnAt = now + RESPAWN_MS;
    best.deaths += 1;
    shooter.kills += 1;
  }
  return {
    hit: true,
    targetId: best.id,
    health: best.health,
    killed,
    shooterId,
    damage: applied,
    distance: Number(bestT.toFixed(2)),
  };
}

/** Respawns dead players whose timer elapsed. Returns respawn events. */
export function tickRoom(room, now = Date.now()) {
  const events = [];
  if (!room) return events;
  for (const player of room.players.values()) {
    if (!player.dead || player.respawnAt > now) continue;
    player.dead = false;
    player.health = 100;
    player.respawnAt = 0;
    events.push({ id: player.id, name: player.name });
  }
  return events;
}
