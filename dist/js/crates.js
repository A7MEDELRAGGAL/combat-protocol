/**
 * PUBG-style Lucky Crate Opening & Spin System.
 * Rarity tiers: Mythic (🔴) > Legendary (🟣) > Epic (🔵) > Rare (⚪).
 */

export const CRATE_DEFS = [
  {
    id: "crate-classic",
    name: "Classic Tactical Crate",
    arabic: "الصندوق الكلاسيكي",
    cost: 120,
    badge: "كلاسيكي",
    description: "يحتوي على أطقم تمويه تكتيكية، جلود أسلحة نادرة، ومواد تطوير الأسلحة.",
    items: [
      { id: "skin-arctic", kind: "skin", skinId: "arctic", name: "تمويه قطبي استطلاعي", rarity: "epic", weight: 20 },
      { id: "skin-desert", kind: "skin", skinId: "desert", name: "تمويه مغير الصحراء", rarity: "epic", weight: 25 },
      { id: "skin-carbon", kind: "skin", skinId: "carbon", name: "تمويه كربون ليلي", rarity: "legendary", weight: 8 },
      { id: "skin-protocol", kind: "skin", skinId: "protocol", name: "تمويه بروتوكول ذهبي", rarity: "mythic", weight: 2 },
      { id: "mat-parts-50", kind: "material", amount: 50, name: "50 قطعة تعديل أسلحة", rarity: "rare", weight: 30 },
      { id: "credits-250", kind: "credits", amount: 250, name: "250 نقطة مكافأة", rarity: "rare", weight: 15 },
    ],
  },
  {
    id: "crate-mythic",
    name: "Mythic Arsenal Crate",
    arabic: "صندوق الترسانة الخرافية",
    cost: 280,
    badge: "خرافي",
    description: "فرصة الحصول على أسلحة قابلة للتطوير مثل AR-4 الجليدي وتأثيرات الإطاحة الذهبية.",
    items: [
      { id: "skin-glacier", kind: "skin", skinId: "glacier", name: "AR-4 الجليدي (قابل للتطوير)", rarity: "mythic", weight: 3 },
      { id: "skin-protocol", kind: "skin", skinId: "protocol", name: "تمويه بروتوكول ذهبي فاخر", rarity: "legendary", weight: 12 },
      { id: "skin-carbon", kind: "skin", skinId: "carbon", name: "تمويه كربون سري", rarity: "legendary", weight: 15 },
      { id: "skin-arctic", kind: "skin", skinId: "arctic", name: "تمويه العمليات القطبية", rarity: "epic", weight: 30 },
      { id: "mat-parts-120", kind: "material", amount: 120, name: "120 مادة تطوير سلاح", rarity: "rare", weight: 25 },
      { id: "credits-600", kind: "credits", amount: 600, name: "600 نقطة رصيد إضافي", rarity: "epic", weight: 15 },
    ],
  },
];

export const RARITY_INFO = {
  mythic: { label: "خرافي", color: "#ff2a5f", glow: "rgba(255, 42, 95, 0.6)" },
  legendary: { label: "أسطوري", color: "#a855f7", glow: "rgba(168, 85, 247, 0.5)" },
  epic: { label: "ملحمي", color: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },
  rare: { label: "نادر", color: "#10b981", glow: "rgba(16, 185, 129, 0.3)" },
};

export function rollSingleItem(crate) {
  const totalWeight = crate.items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of crate.items) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
  return crate.items[0];
}

export function openCrate(profile, crateId, count = 1) {
  const crate = CRATE_DEFS.find((c) => c.id === crateId);
  if (!crate) return { profile, success: false, reason: "crate-not-found" };

  const pullCount = count === 10 ? 10 : 1;
  const totalCost = crate.cost * pullCount;
  const currentCredits = Number(profile?.credits ?? 0);

  if (currentCredits < totalCost) {
    return { profile, success: false, reason: "insufficient-credits", needed: totalCost, have: currentCredits };
  }

  const results = [];
  const unlockedSkins = new Set(profile?.unlockedSkins ?? ["standard"]);
  let bonusCredits = 0;
  let addedMaterials = 0;

  for (let i = 0; i < pullCount; i += 1) {
    let item = rollSingleItem(crate);
    // Guaranteed Epic or higher on 10th pull
    if (pullCount === 10 && i === 9 && (item.rarity === "rare")) {
      const epicPlus = crate.items.filter((it) => it.rarity !== "rare");
      if (epicPlus.length > 0) {
        item = epicPlus[Math.floor(Math.random() * epicPlus.length)];
      }
    }

    results.push(item);
    if (item.kind === "skin" && item.skinId) {
      unlockedSkins.add(item.skinId);
    } else if (item.kind === "credits") {
      bonusCredits += Number(item.amount || 0);
    } else if (item.kind === "material") {
      addedMaterials += Number(item.amount || 0);
    }
  }

  const updatedProfile = {
    ...profile,
    credits: currentCredits - totalCost + bonusCredits,
    weaponMaterials: Number(profile?.weaponMaterials ?? 0) + addedMaterials,
    unlockedSkins: [...unlockedSkins],
  };

  return {
    profile: updatedProfile,
    success: true,
    crate,
    pullCount,
    results,
    totalCost,
  };
}
