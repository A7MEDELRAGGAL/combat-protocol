import { seededRandom } from "./utils.js";

/**
 * Loot model for the local Battle Royale prototype.
 * Pure data + pure functions so the tables can be tested without a renderer.
 */

export const RARITIES = {
  common: { id: "common", label: "شائع", weight: 60, color: "#9aa08f", xp: 5, multiplier: 1 },
  rare: { id: "rare", label: "نادر", weight: 27, color: "#5b8fba", xp: 12, multiplier: 1.15 },
  epic: { id: "epic", label: "ملحمي", weight: 10, color: "#a06bd0", xp: 25, multiplier: 1.3 },
  legendary: { id: "legendary", label: "أسطوري", weight: 3, color: "#d9a45c", xp: 50, multiplier: 1.45 },
};

const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

/** Item blueprints. `size` is inventory weight, `kind` drives the pickup effect. */
export const LOOT_POOL = [
  { id: "ammo-ar", kind: "ammo", name: "ذخيرة AR", weaponId: "ar4", amount: 30, size: 6, weight: 18 },
  { id: "ammo-smg", kind: "ammo", name: "ذخيرة SMG", weaponId: "smg9", amount: 32, size: 6, weight: 14 },
  { id: "ammo-dmr", kind: "ammo", name: "ذخيرة DMR", weaponId: "dmr7", amount: 10, size: 7, weight: 8 },
  { id: "ammo-sr", kind: "ammo", name: "ذخيرة SR", weaponId: "sr9", amount: 5, size: 8, weight: 4 },
  { id: "ammo-p12", kind: "ammo", name: "ذخيرة P-12", weaponId: "p12", amount: 30, size: 5, weight: 8 },
  { id: "ammo-lmg", kind: "ammo", name: "ذخيرة LMG", weaponId: "lmg6", amount: 50, size: 8, weight: 5 },
  { id: "ammo-sg", kind: "ammo", name: "خراطيش SG", weaponId: "sg12", amount: 8, size: 6, weight: 7 },
  { id: "ammo-br", kind: "ammo", name: "ذخيرة BR", weaponId: "br7", amount: 24, size: 6, weight: 6 },
  { id: "ammo-vpr", kind: "ammo", name: "ذخيرة VPR", weaponId: "vpr5", amount: 36, size: 6, weight: 6 },
  { id: "armor-25", kind: "armor", name: "صفيحة درع", amount: 25, size: 10, weight: 16 },
  { id: "armor-50", kind: "armor", name: "درع ثقيل", amount: 50, size: 16, weight: 7 },
  { id: "medkit", kind: "heal", name: "حقيبة إسعاف", amount: 45, size: 12, weight: 14 },
  { id: "stim", kind: "heal", name: "حقنة سريعة", amount: 20, size: 6, weight: 12 },
  { id: "frag", kind: "grenade", name: "قنبلة يدوية", amount: 1, size: 8, weight: 9 },
  { id: "attachment-optic", kind: "attachment", name: "منظار نقطة حمراء", attachmentId: "red-dot", size: 10, weight: 6 },
  { id: "attachment-grip", kind: "attachment", name: "مقبض رأسي", attachmentId: "vertical-grip", size: 8, weight: 6 },
  { id: "attachment-mag", kind: "attachment", name: "مخزن موسّع", attachmentId: "extended-mag", size: 9, weight: 5 },
  { id: "attachment-suppressor", kind: "attachment", name: "كاتم صوت", attachmentId: "suppressor", size: 8, weight: 4 },
  { id: "attachment-laser", kind: "attachment", name: "ليزر تكتيكي", attachmentId: "tactical-laser", size: 6, weight: 4 },
];

export const WEAPON_LOOT = [
  { weaponId: "smg9", weight: 12, rarity: "common" },
  { weaponId: "ar4", weight: 10, rarity: "common" },
  { weaponId: "sg12", weight: 7, rarity: "rare" },
  { weaponId: "br7", weight: 5, rarity: "rare" },
  { weaponId: "lmg6", weight: 4, rarity: "epic" },
  { weaponId: "dmr7", weight: 4, rarity: "epic" },
  { weaponId: "sr9", weight: 2, rarity: "legendary" },
  { weaponId: "vpr5", weight: 6, rarity: "rare" },
];

export const LOOT_SPAWN_COUNT = { battleRoyale: 28, default: 0 };

function pickWeighted(entries, random) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/** Weighted rarity roll — legendary stays rare enough to feel special. */
export function rollRarity(random = Math.random) {
  const entries = RARITY_ORDER.map((id) => ({ id, weight: RARITIES[id].weight }));
  return pickWeighted(entries, random).id;
}

/** Builds one concrete loot item from the blueprint pool. */
export function rollLootItem(random = Math.random) {
  if (random() < 0.22) {
    const weapon = pickWeighted(WEAPON_LOOT, random);
    const rarity = RARITIES[weapon.rarity];
    return {
      id: `weapon-${weapon.weaponId}`,
      kind: "weapon",
      weaponId: weapon.weaponId,
      name: `سلاح ${weapon.weaponId.toUpperCase()}`,
      rarity: rarity.id,
      color: rarity.color,
      size: 24,
      amount: 1,
    };
  }
  const blueprint = pickWeighted(LOOT_POOL, random);
  const rarityId = rollRarity(random);
  const rarity = RARITIES[rarityId];
  const bonus = rarity.multiplier;
  return {
    id: blueprint.id,
    kind: blueprint.kind,
    name: blueprint.name,
    weaponId: blueprint.weaponId ?? null,
    attachmentId: blueprint.attachmentId ?? null,
    amount: Math.max(1, Math.round((blueprint.amount ?? 1) * bonus)),
    size: blueprint.size,
    rarity: rarityId,
    color: rarity.color,
  };
}

/** Deterministic crate contents so a match can be replayed from its seed. */
export function createLootTable(seed = 1, count = LOOT_SPAWN_COUNT.battleRoyale) {
  const random = seededRandom(seed);
  const items = [];
  for (let index = 0; index < count; index += 1) items.push(rollLootItem(random));
  return items;
}

export function rarityLabel(rarityId) {
  return RARITIES[rarityId]?.label ?? RARITIES.common.label;
}
