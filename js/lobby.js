/**
 * Lobby configuration for a local match.
 * The host (leader) owns mode, map, bot count and bot difficulty.
 * Pure helpers so the lobby can be tested without the DOM.
 */

export const LOBBY_KEY = "combat-protocol-lobby-v1";

export const DIFFICULTIES = {
  easy: { id: "easy", label: "سهل", accuracy: 0.8, damage: 0.7 },
  normal: { id: "normal", label: "عادي", accuracy: 1, damage: 1 },
  hard: { id: "hard", label: "صعب", accuracy: 1.18, damage: 1.35 },
};

export const LOBBY_MODES = ["deathmatch", "battleRoyale", "tdm", "survival"];

export const DEFAULT_LOBBY = {
  mode: "deathmatch",
  map: "port",
  bots: 5,
  difficulty: "normal",
  leader: "أنت",
};

export function clampBots(value, min = 1, max = 20) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return DEFAULT_LOBBY.bots;
  return Math.max(min, Math.min(max, number));
}

/** Normalises anything (storage, URL, UI) into a valid lobby object. */
export function normalizeLobby(input = {}, maps = []) {
  const source = input && typeof input === "object" ? input : {};
  const mapIds = maps.map((map) => (typeof map === "string" ? map : map.id));
  return {
    mode: LOBBY_MODES.includes(source.mode) ? source.mode : DEFAULT_LOBBY.mode,
    map: mapIds.length === 0 || mapIds.includes(source.map) ? source.map ?? DEFAULT_LOBBY.map : mapIds[0],
    bots: clampBots(source.bots ?? DEFAULT_LOBBY.bots, 1, 20),
    difficulty: DIFFICULTIES[source.difficulty] ? source.difficulty : DEFAULT_LOBBY.difficulty,
    leader: typeof source.leader === "string" && source.leader.trim() ? source.leader.trim().slice(0, 18) : DEFAULT_LOBBY.leader,
  };
}

export function loadLobby(params = null, storage = globalThis.localStorage, maps = []) {
  let stored = null;
  try {
    stored = JSON.parse(storage?.getItem?.(LOBBY_KEY) ?? "null");
  } catch {
    stored = null;
  }
  const merged = { ...(stored ?? {}) };
  if (params) {
    if (params.get("mode")) merged.mode = params.get("mode");
    if (params.get("map")) merged.map = params.get("map");
    if (params.get("bots")) merged.bots = params.get("bots");
    if (params.get("diff")) merged.difficulty = params.get("diff");
  }
  return normalizeLobby(merged, maps);
}

export function saveLobby(lobby, storage = globalThis.localStorage) {
  const normalized = normalizeLobby(lobby);
  try {
    storage?.setItem?.(LOBBY_KEY, JSON.stringify(normalized));
  } catch {
    // storage may be unavailable (private mode) - the match still works.
  }
  return normalized;
}

export function lobbyQuery(lobby, maps = []) {
  const normalized = normalizeLobby(lobby, maps);
  return `?mode=${encodeURIComponent(normalized.mode)}&map=${encodeURIComponent(normalized.map)}&bots=${normalized.bots}&diff=${encodeURIComponent(normalized.difficulty)}`;
}

export function difficultyOf(lobby) {
  return DIFFICULTIES[lobby?.difficulty] ?? DIFFICULTIES.normal;
}

/** Bot count for the mode, respecting the leader's choice within the mode budget. */
export function botCountFor(lobby, mode) {
  const requested = clampBots(lobby?.bots, 1, 20);
  const ceiling = Math.max(1, Math.min(20, mode?.enemyCount ?? 20));
  return Math.min(requested, ceiling);
}

export function lobbySummary(lobby, modeLabel, mapLabel) {
  const difficulty = difficultyOf(lobby);
  return `${modeLabel} · ${mapLabel} · ${botCountFor(lobby, { enemyCount: 20 })} بوت · ${difficulty.label}`;
}
