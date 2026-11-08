export const MISSION_DEFS = {
  firstLight: {
    id: "first-light",
    label: "First Light",
    arabic: "الضوء الأول",
    mapId: "port",
    recoverSeconds: 2,
    holdSeconds: 24,
    objectiveOrder: ["ingress", "recover_key", "secure_relay", "hold_relay", "extract", "success"],
  },
};

const OBJECTIVES = {
  ingress: {
    id: "reach-kiosk",
    pointId: "kiosk",
    label: "الوصول إلى كشك الخدمة",
    detail: "اتبع علامة المهمة إلى Relay 07.",
  },
  recover_key: {
    id: "recover-key",
    pointId: "kiosk",
    label: "استعادة مفتاح الصيانة",
    detail: "اضغط E واستمر حتى يكتمل الاستخراج.",
  },
  secure_relay: {
    id: "secure-relay",
    pointId: "relay",
    label: "الوصول إلى Relay 07",
    detail: "اقترب من المرحل وابدأ التثبيت.",
  },
  hold_relay: {
    id: "hold-relay",
    pointId: "relay",
    label: "تثبيت Relay 07",
    detail: "ابقَ داخل نطاق المرحل واحمِ التثبيت.",
  },
  extract: {
    id: "extract-data",
    pointId: "extraction",
    label: "الخروج إلى ممر الرافعة",
    detail: "احمل البيانات إلى نقطة الاستخراج.",
  },
  success: {
    id: "mission-complete",
    pointId: null,
    label: "اكتملت المهمة",
    detail: "تم تأمين Relay 07. راجع تقرير المهمة.",
  },
  failure: {
    id: "mission-failed",
    pointId: null,
    label: "فشلت المهمة",
    detail: "أعد المحاولة من البداية.",
  },
};

export function missionById(id = "first-light") {
  return Object.values(MISSION_DEFS).find((mission) => mission.id === id) ?? MISSION_DEFS.firstLight;
}

export function objectiveForState(state = "ingress") {
  return OBJECTIVES[state] ?? OBJECTIVES.ingress;
}

export function createMissionState(mission = MISSION_DEFS.firstLight) {
  const objective = objectiveForState("ingress");
  return {
    missionId: mission.id,
    state: "ingress",
    objectiveId: objective.id,
    pointId: objective.pointId,
    progress: 0,
    elapsed: 0,
    completedObjectives: [],
    failureReason: null,
  };
}

function transition(state, nextState) {
  const objective = objectiveForState(nextState);
  return {
    ...state,
    state: nextState,
    objectiveId: objective.id,
    pointId: objective.pointId,
    progress: 0,
  };
}

function completeObjective(state, objectiveId) {
  if (state.completedObjectives.includes(objectiveId)) return state;
  return { ...state, completedObjectives: [...state.completedObjectives, objectiveId] };
}

function objectiveStarted(state, nextState) {
  const objective = objectiveForState(nextState);
  return {
    type: "objective_started",
    objectiveId: objective.id,
    state: nextState,
  };
}

function objectiveCompleted(state) {
  const objective = objectiveForState(state.state);
  return {
    type: "objective_completed",
    objectiveId: objective.id,
    state: state.state,
  };
}

export function advanceMission(
  state,
  mission = MISSION_DEFS.firstLight,
  { dt = 0, nearPoint = false, interactHeld = false, playerDead = false, timeExpired = false } = {},
) {
  let next = { ...state, elapsed: state.elapsed + Math.max(0, dt) };
  const events = [];

  if (next.state === "success" || next.state === "failure") return { state: next, events };

  if (playerDead || timeExpired) {
    next = transition(next, "failure");
    next.failureReason = playerDead ? "dead" : "timeout";
    events.push({ type: "mission_ended", result: "failure", reason: next.failureReason });
    return { state: next, events };
  }

  if (next.state === "ingress" && nearPoint) {
    next = transition(next, "recover_key");
    events.push(objectiveCompleted(state));
    events.push(objectiveStarted(next, "recover_key"));
    return { state: next, events };
  }

  if (next.state === "recover_key") {
    if (nearPoint && interactHeld) next.progress = Math.min(1, next.progress + dt / mission.recoverSeconds);
    if (next.progress >= 1) {
      next = completeObjective(next, next.objectiveId);
      next = transition(next, "secure_relay");
      events.push(objectiveCompleted(state));
      events.push(objectiveStarted(next, "secure_relay"));
    }
    return { state: next, events };
  }

  if (next.state === "secure_relay" && nearPoint && interactHeld) {
    next = transition(next, "hold_relay");
    events.push(objectiveCompleted(state));
    events.push(objectiveStarted(next, "hold_relay"));
    return { state: next, events };
  }

  if (next.state === "hold_relay") {
    if (nearPoint) next.progress = Math.min(1, next.progress + dt / mission.holdSeconds);
    if (next.progress >= 1) {
      next = completeObjective(next, next.objectiveId);
      next = transition(next, "extract");
      events.push(objectiveCompleted(state));
      events.push(objectiveStarted(next, "extract"));
    }
    return { state: next, events };
  }

  if (next.state === "extract" && nearPoint) {
    next = completeObjective(next, next.objectiveId);
    next = transition(next, "success");
    next.progress = 1;
    events.push(objectiveCompleted(state));
    events.push({ type: "mission_ended", result: "success", reason: "extraction" });
  }

  return { state: next, events };
}

export function getMissionSnapshot(state, mission = MISSION_DEFS.firstLight) {
  const objective = objectiveForState(state?.state ?? "ingress");
  return {
    missionId: mission.id,
    state: state?.state ?? "ingress",
    objectiveId: objective.id,
    pointId: objective.pointId,
    label: objective.label,
    detail: objective.detail,
    progress: Math.max(0, Math.min(1, Number(state?.progress) || 0)),
    elapsed: state?.elapsed ?? 0,
    failureReason: state?.failureReason ?? null,
  };
}

export { OBJECTIVES };
