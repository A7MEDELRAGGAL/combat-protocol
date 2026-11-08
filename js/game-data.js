import { clamp } from "./utils.js";

export const MODE_DEFS = {
  deathmatch: {
    id: "deathmatch",
    label: "Deathmatch",
    arabic: "مباراة حرة",
    description: "اقضِ على أكبر عدد قبل انتهاء الوقت.",
    duration: 300,
    enemyCount: 5,
    respawn: true,
    enemyRespawn: true,
    playerRespawn: true,
    respawnDelay: 2.5,
    grenadesPerMatch: 2,
    objectiveType: "score",
    objectiveTarget: 0,
    objective: "أعلى نقاط قبل نهاية الوقت",
  },
  tdm: {
    id: "tdm",
    label: "Team Deathmatch",
    arabic: "قتال الفرق",
    description: "فريقك ضد موجة خصوم محليين — حقق 40 إقصاء.",
    duration: 360,
    enemyCount: 8,
    respawn: true,
    enemyRespawn: true,
    playerRespawn: true,
    respawnDelay: 3,
    grenadesPerMatch: 2,
    objectiveType: "team-score",
    scoreLimit: 40,
    objectiveTarget: 40,
    objective: "الهدف: 40 إقصاء",
  },
  survival: {
    id: "survival",
    label: "Survival",
    arabic: "البقاء",
    description: "موجات متصاعدة. لا يوجد مكان آمن طويلاً.",
    duration: 600,
    enemyCount: 5,
    respawn: true,
    enemyRespawn: false,
    playerRespawn: false,
    respawnDelay: 0,
    grenadesPerMatch: 2,
    objectiveType: "waves",
    waveStartCount: 5,
    waveGrowth: 1,
    waveKills: 5,
    waveEnemyCap: 12,
    waveBreakSeconds: 1.8,
    objective: "اصمد أمام الموجات",
  },
  battleRoyale: {
    id: "battleRoyale",
    label: "Battle Royale",
    arabic: "باتل رويال",
    description: "نسخة محلية تجريبية: دائرة تتقلص وتتحرك وخصوم لا يعودون.",
    duration: 900,
    enemyCount: 20,
    targetPlayers: 60,
    prototypeBotTarget: 20,
    squadSizes: [1, 2, 4],
    productionPlanId: "br-frontline-v1",
    respawn: false,
    enemyRespawn: false,
    playerRespawn: false,
    respawnDelay: 0,
    grenadesPerMatch: 2,
    objectiveType: "last-standing",
    objective: "آخر مقاتل يبقى",
  },
  frontlineOps: {
    id: "frontlineOps",
    label: "Frontline Ops",
    arabic: "عمليات FRONTLINE",
    description: "First Light: استعد مفتاح الصيانة وثبّت Relay 07 ثم اخرج.",
    duration: 600,
    enemyCount: 5,
    respawn: false,
    enemyRespawn: false,
    playerRespawn: false,
    respawnDelay: 0,
    grenadesPerMatch: 2,
    objectiveType: "mission",
    missionId: "first-light",
    mapId: "port",
    objective: "First Light — مهمة سردية محلية",
  },
};

export function getMode(id) {
  return MODE_DEFS[id] ?? MODE_DEFS.deathmatch;
}

export const ATTACHMENT_DEFS = [
  { id: "red-dot", slot: "optics", name: "Red Dot", arabic: "منظار نقطة حمراء", description: "تسديد أسرع وصورة أوضح بدون حجب المحيط.", effects: { zoom: 0.08, adsSpread: 0.82 } },
  { id: "tactical-laser", slot: "accessory", name: "Tactical Laser", arabic: "ليزر تكتيكي", description: "تصويب أدق من الورك مع شعاع ليزر مرئي.", effects: { adsSpread: 0.88, spread: 0.84, zoom: -0.03, laser: true } },
  { id: "long-barrel", slot: "barrel", name: "Long Barrel", arabic: "ماسورة طويلة", description: "مدى وضرر أفضل على المسافات.", effects: { rangeStart: 1.16, rangeEnd: 1.14, recoilPitch: 1.06 } },
  { id: "suppressor", slot: "barrel", name: "Suppressor", arabic: "كاتم صوت", description: "يكتم الصوت ويخفي وميض الفوهة مقابل ضرر قريب أقل قليلاً.", effects: { damage: 0.96, spread: 0.88, recoilYaw: 0.82, suppressed: true } },
  { id: "compensator", slot: "barrel", name: "Compensator", arabic: "موازن ارتداد", description: "ارتداد أقل مقابل ضوضاء وبصمة أكبر.", effects: { recoilPitch: 0.84, recoilYaw: 0.88, spread: 1.04 } },
  { id: "extended-mag", slot: "magazine", name: "Extended Mag", arabic: "مخزن موسّع", description: "ذخيرة أكثر، تلقيم أثقل.", effects: { mag: 8, reserve: 16, reloadTime: 1.12 } },
  { id: "fast-mag", slot: "magazine", name: "Fast Mag", arabic: "مخزن سريع", description: "تلقيم أسرع دون زيادة السعة.", effects: { reloadTime: 0.78 } },
  { id: "drum-mag", slot: "magazine", name: "Drum Mag", arabic: "مخزن أسطواني", description: "سعة ضخمة مقابل تلقيم بطيء وحركة أثقل.", effects: { mag: 14, reserve: 28, reloadTime: 1.22, moveSpeed: 0.94 } },
  { id: "vertical-grip", slot: "underbarrel", name: "Vertical Grip", arabic: "مقبض رأسي", description: "يقلل الارتداد العمودي.", effects: { recoilPitch: 0.76, spread: 0.94 } },
  { id: "angled-grip", slot: "underbarrel", name: "Angled Grip", arabic: "مقبض مائل", description: "يقلل التشتت الأفقي.", effects: { recoilYaw: 0.68, adsSpread: 0.92 } },
  { id: "light-stock", slot: "stock", name: "Light Stock", arabic: "مؤخرة خفيفة", description: "تبديل أسرع وحركة أنعم.", effects: { zoom: -0.04, spread: 0.96, swapTime: 0.13, moveSpeed: 1.03 } },
];

export const OPERATOR_DEFS = [
  { id: "vanguard", codename: "ROOK", name: "Vanguard", arabic: "الطليعة // ROOK", role: "اختراق مدرّع", abilityArabic: "Q: عبوة اختراق", description: "+25 درع أقصى + شحنة اختراق متفجرة (Q).", health: 100, armor: 125, speed: 1, regenDelay: 5, regenRate: 14 },
  { id: "scout", codename: "WISP", name: "Scout", arabic: "الكشّاف // WISP", role: "استطلاع سريع", abilityArabic: "Q: نبضة استطلاع", description: "+10% سرعة حركة + رادار استطلاع ودفعة جري (Q).", health: 100, armor: 45, speed: 1.1, regenDelay: 3.5, regenRate: 18 },
  { id: "medic", codename: "SABLE", name: "Medic", arabic: "المسعف // SABLE", role: "دعم ميداني", abilityArabic: "Q: محفّز إسعافي", description: "+20 صحة أقصى + حقنة استشفاء ودرع فورية (Q).", health: 120, armor: 50, speed: 1, regenDelay: 2.2, regenRate: 28 },
  { id: "atlas", codename: "ATLAS", name: "Atlas", arabic: "أطلس // ATLAS", role: "مهندس تحصين", abilityArabic: "Q: حاجز تكتيكي", description: "درع متوازن + نشر حاجز مدرع يصد الرصاص (Q).", health: 105, armor: 70, speed: 0.96, regenDelay: 3.2, regenRate: 19 },
];

export const WEAPON_SKINS = [
  { id: "standard", name: "Factory Issue", arabic: "قياسي ميداني", cost: 0, body: null, furniture: null, accent: null },
  { id: "desert", name: "Dune Ochre", arabic: "صحراوي تكتيكي", cost: 120, body: 0x8f7958, furniture: 0x4f4332, accent: 0xd9a86c },
  { id: "carbon", name: "Night Carbon", arabic: "كربون ليلي", cost: 220, body: 0x1e2428, furniture: 0x121619, accent: 0x58c7d9 },
  { id: "arctic", name: "Frostline", arabic: "قطبي استطلاعي", cost: 350, body: 0x9aa8ae, furniture: 0x4d5960, accent: 0x7fd8e8 },
  { id: "protocol", name: "Protocol Gold", arabic: "بروتوكول ذهبي", cost: 500, body: 0x302b24, furniture: 0x1b1815, accent: 0xf0b85a },
];

export function skinById(id = "standard") {
  return WEAPON_SKINS.find((skin) => skin.id === id) ?? WEAPON_SKINS[0];
}

export const PROFILE_KEY = "combat-protocol-profile-v2";

export function defaultProfile() {
  return {
    xp: 0,
    level: 1,
    credits: 0,
    operatorId: "vanguard",
    loadout: {},
    unlockedSkins: ["standard"],
    equippedSkin: "standard",
    stats: { kills: 0, matches: 0, completedMatches: 0, wins: 0, bestFirstLightSeconds: null },
    settledMatches: [],
  };
}

export function loadProfile(storage = globalThis.localStorage) {
  const fallback = defaultProfile();
  try {
    const stored = JSON.parse(storage?.getItem(PROFILE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return fallback;
    const unlockedSkins = Array.isArray(stored.unlockedSkins)
      ? [...new Set(["standard", ...stored.unlockedSkins])]
      : ["standard"];
    const equippedSkin = unlockedSkins.includes(stored.equippedSkin) ? stored.equippedSkin : "standard";
    return {
      ...fallback,
      ...stored,
      unlockedSkins,
      equippedSkin,
      stats: { ...fallback.stats, ...(stored.stats ?? {}) },
      loadout: { ...(stored.loadout ?? {}) },
      settledMatches: Array.isArray(stored.settledMatches) ? stored.settledMatches.slice(-20) : [],
    };
  } catch {
    return fallback;
  }
}

export function buySkin(profile, skinId) {
  const skin = skinById(skinId);
  const unlocked = new Set(["standard", ...(profile?.unlockedSkins ?? [])]);
  if (unlocked.has(skin.id)) {
    return { profile: { ...profile, unlockedSkins: [...unlocked], equippedSkin: skin.id }, bought: true, reason: "already-owned" };
  }
  const credits = Number(profile?.credits ?? 0);
  if (credits < skin.cost) {
    return { profile, bought: false, reason: "insufficient-credits" };
  }
  unlocked.add(skin.id);
  return {
    bought: true,
    reason: "purchased",
    profile: {
      ...profile,
      credits: credits - skin.cost,
      unlockedSkins: [...unlocked],
      equippedSkin: skin.id,
    },
  };
}

export function saveProfile(profile, storage = globalThis.localStorage) {
  storage?.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function xpForLevel(level) {
  return Math.max(0, (level - 1) * 1000);
}

export function awardXp(profile, amount) {
  const next = { ...profile, stats: { ...profile.stats } };
  next.xp = Math.max(0, Number(next.xp ?? 0) + Math.max(0, amount));
  next.level = Math.max(1, Math.floor(next.xp / 1000) + 1);
  next.credits = Math.max(0, Number(next.credits ?? 0) + Math.round(amount / 5));
  return next;
}

export function settleMatch(profile, result = {}, matchId = "") {
  const next = {
    ...defaultProfile(),
    ...profile,
    stats: { ...defaultProfile().stats, ...(profile?.stats ?? {}) },
    settledMatches: Array.isArray(profile?.settledMatches) ? profile.settledMatches.slice(-20) : [],
  };
  if (!matchId || next.settledMatches.includes(matchId)) {
    return { profile: next, applied: false, xpGranted: 0, creditsGranted: 0 };
  }

  const kills = Math.max(0, Number(result.kills) || 0);
  const xpGranted = Math.max(100, Math.round(kills * 50 + (result.reason === "win" ? 250 : 0)));
  const settled = awardXp(next, xpGranted);
  settled.stats.completedMatches += 1;
  if (result.reason === "win") settled.stats.wins += 1;
  settled.settledMatches = [...next.settledMatches, matchId].slice(-20);
  return {
    profile: settled,
    applied: true,
    xpGranted,
    creditsGranted: Math.round(xpGranted / 5),
  };
}

export function operatorById(id) {
  return OPERATOR_DEFS.find((operator) => operator.id === id) ?? OPERATOR_DEFS[0];
}

export function attachmentById(id) {
  return ATTACHMENT_DEFS.find((attachment) => attachment.id === id) ?? null;
}

export function normalizeAttachmentIds(ids = []) {
  const normalized = [];
  const slotIndexes = new Map();
  for (const id of ids) {
    const attachment = attachmentById(id);
    if (!attachment) continue;
    const existingIndex = slotIndexes.get(attachment.slot);
    if (existingIndex === undefined) {
      slotIndexes.set(attachment.slot, normalized.length);
      normalized.push(attachment.id);
    } else {
      normalized[existingIndex] = attachment.id;
    }
  }
  return normalized.slice(0, 3);
}

export function applyAttachments(base, ids = []) {
  const next = {
    ...base,
    range: [...base.range],
    suppressed: false,
    laser: false,
    moveSpeed: 1,
    swapTime: 0.22,
  };
  const normalizedIds = normalizeAttachmentIds(ids);
  const selected = normalizedIds.map(attachmentById).filter(Boolean);
  for (const attachment of selected) {
    const effects = attachment.effects;
    if (effects.damage) next.damage *= effects.damage;
    if (effects.mag) next.mag += effects.mag;
    if (effects.reserve) next.reserve += effects.reserve;
    if (effects.reloadTime) next.reloadTime *= effects.reloadTime;
    if (effects.spread) next.spread *= effects.spread;
    if (effects.adsSpread) next.adsSpread *= effects.adsSpread;
    if (effects.recoilPitch) next.recoilPitch *= effects.recoilPitch;
    if (effects.recoilYaw) next.recoilYaw *= effects.recoilYaw;
    if (effects.zoom) next.zoom += effects.zoom;
    if (effects.rangeStart) next.range[0] *= effects.rangeStart;
    if (effects.rangeEnd) next.range[1] *= effects.rangeEnd;
    if (effects.suppressed) next.suppressed = true;
    if (effects.laser) next.laser = true;
    if (effects.moveSpeed) next.moveSpeed *= effects.moveSpeed;
    if (effects.swapTime) next.swapTime = effects.swapTime;
  }
  next.damage = Math.max(1, next.damage);
  next.mag = Math.max(1, Math.round(next.mag));
  next.reserve = Math.max(next.mag, Math.round(next.reserve));
  next.reloadTime = clamp(next.reloadTime, 0.45, 8);
  next.zoom = clamp(next.zoom, 1, 5);
  next.attachmentIds = normalizedIds;
  return next;
}

export function getLoadoutIds(profile, weaponId) {
  const ids = profile?.loadout?.[weaponId];
  return Array.isArray(ids) ? normalizeAttachmentIds(ids) : [];
}
