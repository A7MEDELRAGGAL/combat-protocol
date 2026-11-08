/**
 * Progression helpers: placement, level curve and rank titles.
 * Pure functions so the debrief can be tested without the renderer.
 */

export const XP_PER_LEVEL = 1000;

export const RANK_TITLES = [
  { level: 1, title: "مستجد" },
  { level: 5, title: "جندي" },
  { level: 10, title: "عريف" },
  { level: 20, title: "رقيب" },
  { level: 35, title: "ملازم" },
  { level: 50, title: "نقيب" },
  { level: 75, title: "رائد" },
  { level: 100, title: "أسطورة" },
];

export function levelForXp(xp, perLevel = XP_PER_LEVEL) {
  return Math.max(1, Math.floor(Math.max(0, Number(xp) || 0) / perLevel) + 1);
}

export function xpIntoLevel(xp, perLevel = XP_PER_LEVEL) {
  const value = Math.max(0, Number(xp) || 0);
  return value % perLevel;
}

export function levelProgress(xp, perLevel = XP_PER_LEVEL) {
  return Math.min(1, xpIntoLevel(xp, perLevel) / perLevel);
}

export function rankTitle(level) {
  let current = RANK_TITLES[0].title;
  for (const entry of RANK_TITLES) {
    if (level >= entry.level) current = entry.title;
  }
  return current;
}

/**
 * Battle Royale placement: 1 for the winner, otherwise the number of bots still
 * alive when the player died (they finished ahead), clamped to the lobby size.
 */
export function computePlacement({ result, aliveEnemies = 0, totalBots = 20 } = {}) {
  const lobby = Math.max(2, Math.floor(totalBots) || 2);
  if (result === "win") return 1;
  return Math.min(lobby, Math.max(2, Math.floor(aliveEnemies) + 1));
}

export function placementLabel(placement, totalBots) {
  return `${placement} / ${totalBots}`;
}

export const BATTLE_PASS_TIERS = [
  { tier: 1, levelReq: 1, reward: "100 Credits", credits: 100, free: true },
  { tier: 2, levelReq: 3, reward: "تمويه صحراوي", skinId: "desert", free: true },
  { tier: 3, levelReq: 5, reward: "150 Credits", credits: 150, free: true },
  { tier: 4, levelReq: 8, reward: "حزمة عتاد تكتيكي + 200 نقطة", credits: 200, free: false },
  { tier: 5, levelReq: 10, reward: "تمويه كربون ليلي", skinId: "carbon", free: true },
  { tier: 6, levelReq: 15, reward: "250 Credits", credits: 250, free: false },
  { tier: 7, levelReq: 20, reward: "تمويه قطبي استطلاعي", skinId: "arctic", free: true },
  { tier: 8, levelReq: 25, reward: "350 Credits", credits: 350, free: false },
  { tier: 9, levelReq: 30, reward: "لقب الشبح التكتيكي + 400 نقطة", credits: 400, free: true },
  { tier: 10, levelReq: 40, reward: "تمويه بروتوكول ذهبي أسطوري", skinId: "protocol", free: true },
];

export function claimBattlePassTier(profile, tierNumber) {
  const tier = BATTLE_PASS_TIERS.find((t) => t.tier === tierNumber);
  if (!tier) return { profile, claimed: false, reason: "invalid-tier" };
  const currentLevel = Number(profile?.level ?? 1);
  if (currentLevel < tier.levelReq) {
    return { profile, claimed: false, reason: "level-too-low" };
  }
  const claimedTiers = new Set(profile?.claimedPassTiers ?? []);
  if (claimedTiers.has(tierNumber)) {
    return { profile, claimed: false, reason: "already-claimed" };
  }
  claimedTiers.add(tierNumber);
  const next = {
    ...profile,
    credits: Number(profile?.credits ?? 0) + (tier.credits ?? 0),
    unlockedSkins: tier.skinId
      ? [...new Set([...(profile?.unlockedSkins ?? ["standard"]), tier.skinId])]
      : [...(profile?.unlockedSkins ?? ["standard"])],
    claimedPassTiers: [...claimedTiers],
  };
  return { profile: next, claimed: true, reason: "reward-granted", tier };
}
