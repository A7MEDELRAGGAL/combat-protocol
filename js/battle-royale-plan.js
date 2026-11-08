export const BATTLE_ROYALE_PLAN = {
  id: "br-frontline-v1",
  label: "Frontline Battle Royale",
  targetPlayers: 60,
  squadSizes: [1, 2, 4],
  targetMatchSeconds: 1080,
  prototypeBotTarget: 20,
  productionTickRate: 20,
  snapshotRate: 10,
  respawn: "limited-revive",
  phases: [
    { id: "drop", start: 0, end: 75, radius: 31, damage: 0, objective: "هبوط واختيار نقطة البداية" },
    { id: "loot", start: 75, end: 210, radius: 31, damage: 0, objective: "اجمع سلاحاً ودرعاً وعلاجاً" },
    { id: "rotate-1", start: 210, end: 360, radius: 24, damage: 3, objective: "تحرك قبل إغلاق الدائرة الأولى" },
    { id: "rotate-2", start: 360, end: 510, radius: 18, damage: 5, objective: "اقطع الطريق على الفرق المتأخرة" },
    { id: "rotate-3", start: 510, end: 690, radius: 13, damage: 8, objective: "سيطر على الـPOI الآمن" },
    { id: "final", start: 690, end: 870, radius: 9, damage: 12, objective: "الاشتباك النهائي" },
    { id: "overtime", start: 870, end: 1080, radius: 7, damage: 15, objective: "لا يوجد مكان آمن" },
  ],
  lootTiers: [
    { id: "common", label: "Common", color: "#9aa19a", weight: 60, attachmentSlots: 1 },
    { id: "rare", label: "Rare", color: "#4ea4e8", weight: 28, attachmentSlots: 2 },
    { id: "epic", label: "Epic", color: "#a77be8", weight: 10, attachmentSlots: 3 },
    { id: "legendary", label: "Legendary", color: "#f1b95e", weight: 2, attachmentSlots: 3 },
  ],
  itemCategories: ["weapon", "ammo", "armor", "heal", "grenade", "attachment", "utility"],
  inventory: {
    baseSlots: 10,
    maxSlots: 18,
    weaponSlots: 2,
    sidearmSlots: 1,
    armorSlots: 1,
    healStackLimit: 4,
    ammoStackLimit: 180,
    attachmentSlotsPerWeapon: 3,
  },
  revive: {
    downedSeconds: 25,
    reviveSeconds: 7,
    selfRevive: false,
    squadBuyback: true,
    buybackWindowSeconds: 120,
  },
  poiTypes: ["hot-drop", "mid-tier", "quiet", "high-ground", "rotation-hub"],
  launchGates: {
    br0: { players: 0, bots: 20, loot: true, inventory: true, squads: false },
    br1: { players: 20, bots: 0, loot: true, inventory: true, squads: true },
    br2: { players: 60, bots: 0, loot: true, inventory: true, squads: true },
  },
};

export function phaseAt(elapsedSeconds = 0, plan = BATTLE_ROYALE_PLAN) {
  const elapsed = Math.max(0, Math.min(plan.targetMatchSeconds, Number(elapsedSeconds) || 0));
  return plan.phases.find((phase) => elapsed >= phase.start && elapsed < phase.end) ?? plan.phases.at(-1);
}

export function validateBattleRoyalePlan(plan = BATTLE_ROYALE_PLAN) {
  if (!plan || plan.targetPlayers < 2 || plan.targetMatchSeconds <= 0) return false;
  if (!Array.isArray(plan.phases) || plan.phases.length < 5) return false;
  if (plan.phases[0].start !== 0) return false;
  for (let index = 0; index < plan.phases.length; index += 1) {
    const phase = plan.phases[index];
    if (phase.end <= phase.start || phase.radius <= 0 || phase.damage < 0) return false;
    const next = plan.phases[index + 1];
    if (next && next.start !== phase.end) return false;
    if (next && next.radius > phase.radius) return false;
  }
  if (plan.phases.at(-1).end !== plan.targetMatchSeconds) return false;
  const totalLootWeight = plan.lootTiers.reduce((sum, tier) => sum + tier.weight, 0);
  return totalLootWeight === 100 && plan.inventory.weaponSlots === 2 && plan.inventory.maxSlots >= plan.inventory.baseSlots;
}
