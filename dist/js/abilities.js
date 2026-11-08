/**
 * Pure active-ability definitions and cooldown state machine for Operators.
 * Designed for deterministic Node unit testing without Three.js or DOM.
 */

export const ABILITY_DEFS = {
  vanguard: {
    id: "breach-charge",
    operatorId: "vanguard",
    codename: "ROOK",
    name: "Breach Charge",
    arabic: "عبوة اختراق",
    cooldown: 16,
    duration: 0.45,
    radius: 4.8,
    maxDamage: 88,
    description: "تطلق شحنة اختراق متفجرة تطيح بالخصوم المتحصنين خلف الأغطية.",
  },
  scout: {
    id: "recon-pulse",
    operatorId: "scout",
    codename: "WISP",
    name: "Recon Pulse",
    arabic: "نبضة استطلاع",
    cooldown: 18,
    duration: 5.5,
    radius: 34,
    speedBoost: 1.15,
    description: "موجة كهرومغناطيسية تكشف مواقع الأعداء على الرادار وتمنح دفعة سرعة.",
  },
  medic: {
    id: "combat-stim",
    operatorId: "medic",
    codename: "SABLE",
    name: "Combat Stim",
    arabic: "محفّز إسعافي",
    cooldown: 20,
    duration: 3.5,
    healAmount: 40,
    armorAmount: 25,
    description: "حقنة ميدانية فورية تستعيد 40 صحة و25 درعاً وتلغي تأخير التعافي.",
  },
  atlas: {
    id: "aegis-barrier",
    operatorId: "atlas",
    codename: "ATLAS",
    name: "Aegis Barrier",
    arabic: "حاجز تكتيكي",
    cooldown: 22,
    duration: 14,
    width: 2.6,
    height: 1.38,
    description: "ينشر حاجزاً مدرعاً صلباً أمامك يصد الرصاص ويثبّت الممرات.",
  },
};

export function abilityForOperator(operatorId = "vanguard") {
  return ABILITY_DEFS[operatorId] ?? ABILITY_DEFS.vanguard;
}

export function createAbilityState(operatorId = "vanguard") {
  const def = abilityForOperator(operatorId);
  return {
    operatorId: def.operatorId,
    abilityId: def.id,
    cooldownRemaining: 0,
    activeRemaining: 0,
    uses: 0,
  };
}

export function canActivateAbility(state) {
  return Boolean(state) && state.cooldownRemaining <= 0;
}

export function activateAbility(state) {
  const def = abilityForOperator(state?.operatorId);
  if (!canActivateAbility(state)) {
    return { state, activated: false, def };
  }
  return {
    activated: true,
    def,
    state: {
      ...state,
      abilityId: def.id,
      cooldownRemaining: def.cooldown,
      activeRemaining: def.duration ?? 0,
      uses: (state.uses ?? 0) + 1,
    },
  };
}

export function stepAbilityState(state, dt = 0) {
  if (!state) return createAbilityState();
  const step = Math.max(0, Number(dt) || 0);
  return {
    ...state,
    cooldownRemaining: Math.max(0, state.cooldownRemaining - step),
    activeRemaining: Math.max(0, state.activeRemaining - step),
  };
}

export function abilityChargeRatio(state) {
  const def = abilityForOperator(state?.operatorId);
  if (!state || state.cooldownRemaining <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - state.cooldownRemaining / def.cooldown));
}
