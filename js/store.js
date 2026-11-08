import { WEAPON_SKINS, skinById } from "./game-data.js";

/**
 * Tactical Shop & Bundles system.
 */

export const STORE_BUNDLES = [
  {
    id: "bundle-shadow",
    name: "Shadow Phantom Bundle",
    arabic: "حزمة شبح الظل",
    description: "طقم العمليات السرية: تمويه كربون ليلي + العميل Wisp + رصيد 150 نقطة مكافأة.",
    price: 320,
    badge: "الأكثر طلباً",
    skinId: "carbon",
    operatorId: "scout",
    bonusCredits: 150,
  },
  {
    id: "bundle-strike",
    name: "Strike Force Bundle",
    arabic: "حزمة القوة الضاربة",
    description: "باقة النخبة التكتيكية: تمويه بروتوكول ذهبي + العميل Rook + رصيد 300 نقطة مكافأة.",
    price: 650,
    badge: "أسطوري",
    skinId: "protocol",
    operatorId: "vanguard",
    bonusCredits: 300,
  },
  {
    id: "bundle-arctic",
    name: "Arctic Recon Bundle",
    arabic: "حزمة الاستطلاع القطبي",
    description: "تجهيز التضاريس الجليدية: تمويه قطبي استطلاعي + العميل Sable + رصيد 120 نقطة مكافأة.",
    price: 420,
    badge: "تكتيكي",
    skinId: "arctic",
    operatorId: "medic",
    bonusCredits: 120,
  },
  {
    id: "bundle-dune",
    name: "Dune Raider Bundle",
    arabic: "حزمة مغير الصحراء",
    description: "تجهيز العواصف الرملية: تمويه صحراوي + العميل Atlas + رصيد 100 نقطة مكافأة.",
    price: 240,
    badge: "مميز",
    skinId: "desert",
    operatorId: "atlas",
    bonusCredits: 100,
  },
];

export function buyBundle(profile, bundleId) {
  const bundle = STORE_BUNDLES.find((b) => b.id === bundleId);
  if (!bundle) return { profile, bought: false, reason: "bundle-not-found" };

  const currentCredits = Number(profile?.credits ?? 0);
  if (currentCredits < bundle.price) {
    return { profile, bought: false, reason: "insufficient-credits" };
  }

  const claimedBundles = new Set(profile?.claimedBundles ?? []);
  if (claimedBundles.has(bundle.id)) {
    return { profile, bought: false, reason: "already-owned" };
  }
  claimedBundles.add(bundle.id);

  const unlockedSkins = new Set(profile?.unlockedSkins ?? ["standard"]);
  unlockedSkins.add(bundle.skinId);

  const updatedProfile = {
    ...profile,
    credits: currentCredits - bundle.price + bundle.bonusCredits,
    unlockedSkins: [...unlockedSkins],
    equippedSkin: bundle.skinId,
    operatorId: bundle.operatorId,
    claimedBundles: [...claimedBundles],
  };

  return {
    profile: updatedProfile,
    bought: true,
    reason: "purchased",
    bundle,
  };
}
