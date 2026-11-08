import test from "node:test";
import assert from "node:assert/strict";
import { MODE_DEFS } from "../js/game-data.js";
import { completeSurvivalWave, createModeState, recordEnemyKill, recordPlayerDeath, resolveModeEnd, getObjectiveSnapshot } from "../js/mode-rules.js";

test("TDM tracks separate team scores and resolves win/loss/draw", () => {
  const mode = MODE_DEFS.tdm;
  let state = createModeState(mode);
  state = recordEnemyKill(mode, state);
  state = recordPlayerDeath(mode, state);
  assert.deepEqual(getObjectiveSnapshot(mode, state), { type: "team-score", playerTeamScore: 1, opponentTeamScore: 1, target: 40 });
  assert.equal(resolveModeEnd(mode, state, { timeExpired: true }), "draw");
  assert.equal(resolveModeEnd(mode, { ...state, playerTeamScore: 40 }, {}), "win");
  assert.equal(resolveModeEnd(mode, { ...state, opponentTeamScore: 40 }, {}), "loss");
});

test("Survival advances waves only after the active wave is clear", () => {
  const mode = MODE_DEFS.survival;
  let state = createModeState(mode);
  state = recordEnemyKill(mode, state);
  assert.equal(state.wave, 1);
  assert.equal(state.waveKills, 1);
  const next = completeSurvivalWave(state, 12);
  assert.equal(next.wave, 2);
  assert.equal(next.waveKills, 0);
  assert.equal(resolveModeEnd(mode, next, { timeExpired: true }), "win");
});

test("Battle Royale only wins when no enemies remain", () => {
  const mode = MODE_DEFS.battleRoyale;
  assert.equal(mode.targetPlayers, 60);
  assert.equal(mode.prototypeBotTarget, 20);
  assert.deepEqual(mode.squadSizes, [1, 2, 4]);
  const state = createModeState(mode);
  assert.equal(resolveModeEnd(mode, state, { aliveEnemies: 1 }), null);
  assert.equal(resolveModeEnd(mode, state, { aliveEnemies: 0 }), "win");
  assert.equal(resolveModeEnd(mode, state, { playerDead: true }), "dead");
});
