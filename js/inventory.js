/**
 * Capacity-limited inventory for the Battle Royale prototype.
 * Pure functions: every mutation returns a new inventory object.
 */

export const DEFAULT_CAPACITY = 120;
export const MAX_PRIMARY_WEAPONS = 2;
export const MAX_ATTACHMENTS_PER_WEAPON = 3;

export function createInventory(capacity = DEFAULT_CAPACITY) {
  return {
    capacity,
    items: [],
    primaries: [],
    sidearm: null,
    armor: 0,
    grenades: 0,
    attachments: [],
  };
}

export function usedCapacity(inventory) {
  // A stack occupies one slot; extra rounds in the same stack are free.
  return inventory.items.reduce((sum, item) => sum + (item.size ?? 0), 0);
}

export function freeCapacity(inventory) {
  return Math.max(0, inventory.capacity - usedCapacity(inventory));
}

export function canFit(inventory, item, count = 1) {
  return freeCapacity(inventory) >= (item.size ?? 0) * count;
}

/**
 * Adds an item, stacking ammo/heal/grenade entries by id.
 * Returns { inventory, added, reason } and never throws on a full bag.
 */
export function addItem(inventory, item, count = 1) {
  if (!item) return { inventory, added: false, reason: "missing-item" };
  const stackable = item.kind === "ammo" || item.kind === "heal" || item.kind === "grenade";
  const existing = stackable ? inventory.items.find((entry) => entry.id === item.id) : null;
  const size = (item.size ?? 0) * count;

  if (!existing && freeCapacity(inventory) < size) {
    return { inventory, added: false, reason: "full" };
  }

  const items = inventory.items.map((entry) => ({ ...entry }));
  if (existing) {
    const target = items.find((entry) => entry.id === item.id);
    target.count = (target.count ?? 1) + count;
  } else {
    items.push({ ...item, count });
  }

  let next = { ...inventory, items };

  if (item.kind === "weapon") {
    if (inventory.primaries.length < MAX_PRIMARY_WEAPONS) {
      next.primaries = [...inventory.primaries, item.weaponId];
    } else if (!inventory.sidearm) {
      next.sidearm = item.weaponId;
    }
  }
  if (item.kind === "armor") next.armor = Math.min(100, inventory.armor + (item.amount ?? 0));
  if (item.kind === "grenade") next.grenades = inventory.grenades + (item.amount ?? 1) * count;
  if (item.kind === "attachment" && inventory.attachments.length < MAX_ATTACHMENTS_PER_WEAPON * MAX_PRIMARY_WEAPONS) {
    next.attachments = [...inventory.attachments, item.attachmentId ?? item.id];
  }

  return { inventory: next, added: true, reason: "ok" };
}

export function removeItem(inventory, itemId, count = 1) {
  const items = inventory.items
    .map((entry) => ({ ...entry }))
    .map((entry) => (entry.id === itemId ? { ...entry, count: (entry.count ?? 1) - count } : entry))
    .filter((entry) => (entry.count ?? 1) > 0);
  return { ...inventory, items };
}

export function totalAmmo(inventory, weaponId) {
  return inventory.items
    .filter((item) => item.kind === "ammo" && item.weaponId === weaponId)
    .reduce((sum, item) => sum + (item.amount ?? 0) * (item.count ?? 1), 0);
}

/** Human-readable one-line summary for the HUD. */
export function inventorySummary(inventory) {
  const used = usedCapacity(inventory);
  return `${used}/${inventory.capacity} وزن · درع ${Math.round(inventory.armor)} · قنابل ${inventory.grenades}`;
}
