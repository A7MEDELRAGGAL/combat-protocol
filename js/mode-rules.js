export function createModeState(mode) {
  return {
    playerTeamScore: 0,
    opponentTeamScore: 0,
    wave: 1,
    waveKills: 0,
    waveBreakUntil: 0,
    objectiveComplete: false,
    modeId: mode.id,
  };
}

export function recordEnemyKill(mode, state) {
  const next = { ...state };
  if (mode.objectiveType === "team-score") next.playerTeamScore += 1;
  if (mode.objectiveType === "waves") next.waveKills += 1;
  if (mode.objectiveType === "team-score" && next.playerTeamScore >= mode.scoreLimit) next.objectiveComplete = true;
  return next;
}

export function recordPlayerDeath(mode, state) {
  const next = { ...state };
  if (mode.objectiveType === "team-score") {
    next.opponentTeamScore += 1;
    if (next.opponentTeamScore >= mode.scoreLimit) next.objectiveComplete = true;
  }
  return next;
}

export function completeSurvivalWave(state, now) {
  return {
    ...state,
    wave: state.wave + 1,
    waveKills: 0,
    waveBreakUntil: now,
  };
}

export function resolveModeEnd(mode, state, { aliveEnemies = 0, timeExpired = false, playerDead = false } = {}) {
  if (playerDead && !mode.playerRespawn) return "dead";
  if (mode.objectiveType === "team-score") {
    if (state.playerTeamScore >= mode.scoreLimit) return "win";
    if (state.opponentTeamScore >= mode.scoreLimit) return "loss";
    if (timeExpired) {
      if (state.playerTeamScore > state.opponentTeamScore) return "win";
      if (state.playerTeamScore < state.opponentTeamScore) return "loss";
      return "draw";
    }
  }
  if (mode.objectiveType === "last-standing" && aliveEnemies <= 0) return "win";
  if (mode.objectiveType === "waves" && timeExpired) return "win";
  if (timeExpired) return "time";
  return null;
}

export function getObjectiveSnapshot(mode, state, { score = 0, kills = 0, aliveEnemies = 0, zone = null } = {}) {
  if (mode.objectiveType === "team-score") {
    return { type: mode.objectiveType, playerTeamScore: state.playerTeamScore, opponentTeamScore: state.opponentTeamScore, target: mode.scoreLimit };
  }
  if (mode.objectiveType === "waves") {
    return { type: mode.objectiveType, wave: state.wave, waveKills: state.waveKills, aliveEnemies };
  }
  if (mode.objectiveType === "last-standing") {
    return { type: mode.objectiveType, aliveEnemies, zoneRadius: zone?.radius ?? null };
  }
  return { type: mode.objectiveType, score, kills };
}
