/**
 * PUBG-style Gun Lab: Upgradable Weapons with custom kill effects and killfeed broadcasts.
 */

export const UPGRADABLE_WEAPONS = [
  {
    id: "lab-ar4-glacier",
    baseWeaponId: "ar4",
    name: "AR-4 الجليدي (Glacier)",
    english: "AR-4 Glacier",
    description: "السلاح الأكثر شهرة عالمياً مع تأثيرات بلورات الثلج وإعلان الإطاحة المتوهج.",
    maxLevel: 4,
    levels: [
      { level: 1, title: "المظهر الأساسي", costMaterials: 0, costCredits: 0, perk: "تمويه بلورات الجليد الزرقاء" },
      { level: 2, title: "تأثير إصابة الرصاص", costMaterials: 60, costCredits: 200, perk: "تطاير جزيئات جليدية عند إصابة الهدف" },
      { level: 3, title: "المظهر المتقدم المتوهج", costMaterials: 140, costCredits: 450, perk: "هيكل بلوري شفاف مع نبضات ضوء داخلي" },
      { level: 4, title: "إعلان القتل الذهبي", costMaterials: 250, costCredits: 800, perk: "شريط إطاحة ذهبي فاخر في شريط الإعلانات (Killfeed)" },
    ],
  },
  {
    id: "lab-sr9-dragon",
    baseWeaponId: "sr9",
    name: "SR-9 لهيب التنين (Dragonfire)",
    english: "SR-9 Dragonfire",
    description: "بندقية قنص أسطورية تطلق لهباً تكتيكياً مع كل طلقة رصاص وتأثير إبادة ناري.",
    maxLevel: 4,
    levels: [
      { level: 1, title: "المظهر الأساسي", costMaterials: 0, costCredits: 0, perk: "نقوش قشور التنين النارية" },
      { level: 2, title: "وميض الفوهة الناري", costMaterials: 75, costCredits: 250, perk: "وميض إطلاق أحمر بركاني مخصص" },
      { level: 3, title: "الهيكل الناري المشع", costMaterials: 160, costCredits: 500, perk: "توهج بركاني ناري على ماسورة القناصة" },
      { level: 4, title: "شعار القتل الأسطوري", costMaterials: 280, costCredits: 900, perk: "أيقونة تنين مجنح في شريط القتلى لكل ضحية" },
    ],
  },
];

export function getWeaponUpgradeLevel(profile, labWeaponId) {
  const labUpgrades = profile?.labUpgrades ?? {};
  return Number(labUpgrades[labWeaponId] ?? 1);
}

export function upgradeLabWeapon(profile, labWeaponId) {
  const weapon = UPGRADABLE_WEAPONS.find((w) => w.id === labWeaponId);
  if (!weapon) return { profile, upgraded: false, reason: "weapon-not-found" };

  const currentLevel = getWeaponUpgradeLevel(profile, labWeaponId);
  if (currentLevel >= weapon.maxLevel) {
    return { profile, upgraded: false, reason: "max-level-reached" };
  }

  const nextLevel = currentLevel + 1;
  const levelDef = weapon.levels.find((l) => l.level === nextLevel);
  if (!levelDef) return { profile, upgraded: false, reason: "invalid-level" };

  const currentMaterials = Number(profile?.weaponMaterials ?? 0);
  const currentCredits = Number(profile?.credits ?? 0);

  if (currentMaterials < levelDef.costMaterials || currentCredits < levelDef.costCredits) {
    return {
      profile,
      upgraded: false,
      reason: "insufficient-resources",
      neededMaterials: levelDef.costMaterials,
      haveMaterials: currentMaterials,
      neededCredits: levelDef.costCredits,
      haveCredits: currentCredits,
    };
  }

  const updatedLabUpgrades = {
    ...(profile?.labUpgrades ?? {}),
    [labWeaponId]: nextLevel,
  };

  const updatedProfile = {
    ...profile,
    credits: currentCredits - levelDef.costCredits,
    weaponMaterials: currentMaterials - levelDef.costMaterials,
    labUpgrades: updatedLabUpgrades,
  };

  return {
    profile: updatedProfile,
    upgraded: true,
    weapon,
    newLevel: nextLevel,
    levelDef,
  };
}
