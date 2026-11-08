import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LOBBY,
  DIFFICULTIES,
  botCountFor,
  clampBots,
  difficultyOf,
  loadLobby,
  lobbyQuery,
  lobbySummary,
  normalizeLobby,
  saveLobby,
} from "../js/lobby.js";

const MAPS = ["port", "crossline", "stackyard", "drydock", "nightBazaar"];

test("valid input passes through unchanged", () => {
  const lobby = normalizeLobby({ mode: "battleRoyale", map: "nightBazaar", bots: 12, difficulty: "hard" }, MAPS);
  assert.equal(lobby.mode, "battleRoyale");
  assert.equal(lobby.map, "nightBazaar");
  assert.equal(lobby.bots, 12);
  assert.equal(lobby.difficulty, "hard");
});

test("invalid mode and difficulty fall back to defaults", () => {
  const lobby = normalizeLobby({ mode: "nope", difficulty: "insane" }, MAPS);
  assert.equal(lobby.mode, DEFAULT_LOBBY.mode);
  assert.equal(lobby.difficulty, DEFAULT_LOBBY.difficulty);
});

test("unknown map falls back to the first known map", () => {
  const lobby = normalizeLobby({ map: "atlantis" }, MAPS);
  assert.equal(lobby.map, "port");
});

test("bot count is clamped to 1..20", () => {
  assert.equal(clampBots(0), 1);
  assert.equal(clampBots(99), 20);
  assert.equal(clampBots("7"), 7);
  assert.equal(clampBots("abc"), DEFAULT_LOBBY.bots);
  assert.equal(normalizeLobby({ bots: 500 }, MAPS).bots, 20);
});

test("URL parameters override stored values", () => {
  const storage = { getItem: () => JSON.stringify({ mode: "deathmatch", map: "port", bots: 5 }) };
  const params = new URLSearchParams("mode=battleRoyale&bots=18&diff=hard");
  const lobby = loadLobby(params, storage, MAPS);
  assert.equal(lobby.mode, "battleRoyale");
  assert.equal(lobby.bots, 18);
  assert.equal(lobby.difficulty, "hard");
});

test("saveLobby normalises before writing", () => {
  const store = { value: null, setItem(_key, value) { this.value = value; }, getItem() { return this.value; } };
  saveLobby({ mode: "tdm", bots: 40, difficulty: "easy" }, store);
  const written = JSON.parse(store.value);
  assert.equal(written.bots, 20);
  assert.equal(written.mode, "tdm");
});

test("query string round-trips through loadLobby", () => {
  const lobby = normalizeLobby({ mode: "battleRoyale", map: "drydock", bots: 9, difficulty: "hard" }, MAPS);
  const query = lobbyQuery(lobby, MAPS);
  const parsed = loadLobby(new URLSearchParams(query.slice(1)), { getItem: () => null }, MAPS);
  assert.deepEqual(
    { mode: parsed.mode, map: parsed.map, bots: parsed.bots, difficulty: parsed.difficulty },
    { mode: "battleRoyale", map: "drydock", bots: 9, difficulty: "hard" },
  );
});

test("difficulty scales accuracy and damage in the right order", () => {
  assert.ok(DIFFICULTIES.easy.accuracy < DIFFICULTIES.normal.accuracy);
  assert.ok(DIFFICULTIES.hard.accuracy > DIFFICULTIES.normal.accuracy);
  assert.ok(DIFFICULTIES.hard.damage > DIFFICULTIES.easy.damage);
  assert.equal(difficultyOf({ difficulty: "hard" }).id, "hard");
  assert.equal(difficultyOf({ difficulty: "x" }).id, "normal");
});

test("bot count never exceeds the mode budget", () => {
  assert.equal(botCountFor({ bots: 20 }, { enemyCount: 5 }), 5);
  assert.equal(botCountFor({ bots: 3 }, { enemyCount: 20 }), 3);
});

test("summary line is readable", () => {
  const text = lobbySummary({ bots: 8, difficulty: "hard" }, "Battle Royale", "الميناء");
  assert.match(text, /Battle Royale/);
  assert.match(text, /8/);
  assert.match(text, /صعب/);
});
