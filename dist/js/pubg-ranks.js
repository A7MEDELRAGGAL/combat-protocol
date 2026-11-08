/**
 * PUBG-style Tier and Rank System for Combat Protocol.
 * Tiers: Bronze -> Silver -> Gold -> Platinum -> Diamond -> Crown -> Ace -> Conqueror.
 */

export const PUBG_TIERS = [
  { id: "bronze", name: "برونزي", english: "Bronze", minRp: 1200, maxRp: 1699, color: "#cd7f32", icon: "🥉" },
  { id: "silver", name: "فضي", english: "Silver", minRp: 1700, maxRp: 2199, color: "#c0c0c0", icon: "🥈" },
  { id: "gold", name: "ذهبي", english: "Gold", minRp: 2200, maxRp: 2699, color: "#ffd700", icon: "🥇" },
  { id: "platinum", name: "بلاتينيوم", english: "Platinum", minRp: 2700, maxRp: 3199, color: "#45b6fe", icon: "💎" },
  { id: "diamond", name: "ماسي", english: "Diamond", minRp: 3200, maxRp: 3699, color: "#9d4edd", icon: "💠" },
  { id: "crown", name: "تاج", english: "Crown", minRp: 3700, maxRp: 4199, color: "#ff9100", icon: "👑" },
  { id: "ace", name: "إيس", english: "Ace", minRp: 4200, maxRp: 4999, color: "#ff1744", icon: "⚡" },
  { id: "conqueror", name: "الغازي", english: "Conqueror", minRp: 5000, maxRp: 99999, color: "#ffea00", icon: "🏆" },
];

export function getTierForRp(rp = 1200) {
  const points = Math.max(1200, Number(rp) || 1200);
  for (let i = PUBG_TIERS.length - 1; i >= 0; i -= 1) {
    if (points >= PUBG_TIERS[i].minRp) {
      const tier = PUBG_TIERS[i];
      // Sub-tier calculation (V to I) for tiers below Ace
      if (tier.id === "ace" || tier.id === "conqueror") {
        return { ...tier, division: "", fullTitle: tier.name };
      }
      const range = tier.maxRp - tier.minRp + 1;
      const subRange = range / 5;
      const step = Math.min(4, Math.max(0, Math.floor((points - tier.minRp) / subRange)));
      const divisions = ["V", "IV", "III", "II", "I"];
      const division = divisions[step];
      return { ...tier, division, fullTitle: `${tier.name} ${division}` };
    }
  }
  return { ...PUBG_TIERS[0], division: "V", fullTitle: "برونزي V" };
}

/**
 * Calculates Rank Points (RP) change based on Battle Royale match performance.
 */
export function calculateMatchRp({ placement = 1, kills = 0, survivalSeconds = 60, totalBots = 20 }) {
  let placementPoints = 0;
  if (placement === 1) placementPoints = 35;
  else if (placement <= 3) placementPoints = 22;
  else if (placement <= 5) placementPoints = 14;
  else if (placement <= 10) placementPoints = 5;
  else if (placement <= 15) placementPoints = -6;
  else placementPoints = -18;

  const killPoints = Math.min(25, kills * 4);
  const timeBonus = Math.min(10, Math.floor(survivalSeconds / 45));

  const delta = placementPoints + killPoints + timeBonus;
  return {
    delta,
    placementPoints,
    killPoints,
    timeBonus,
    label: delta >= 0 ? `+${delta} RP` : `${delta} RP`,
  };
}

export function applyMatchRp(profile, matchResult) {
  const currentRp = Number(profile?.rp ?? 1200);
  const { delta } = calculateMatchRp(matchResult);
  const newRp = Math.max(1200, currentRp + delta);
  const currentTier = getTierForRp(currentRp);
  const newTier = getTierForRp(newRp);
  const tierChanged = newTier.id !== currentTier.id || newTier.division !== currentTier.division;

  return {
    profile: {
      ...profile,
      rp: newRp,
      stats: {
        ...(profile?.stats ?? {}),
        rp: newRp,
        highestRp: Math.max(newRp, profile?.stats?.highestRp ?? 1200),
      },
    },
    delta,
    oldTier: currentTier,
    newTier,
    tierChanged,
    promoted: newRp > currentRp && tierChanged,
    demoted: newRp < currentRp && tierChanged,
  };
}
