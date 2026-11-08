import test from "node:test";
import assert from "node:assert/strict";
import { RARITIES, createLootTable, rollLootItem, rollRarity } from "../js/loot-data.js";
import {
  addItem,
  canFit,
  createInventory,
  freeCapacity,
  inventorySummary,
  totalAmmo,
  usedCapacity,
} from "../js/inventory.js";

test("loot table is deterministic for a seed", () => {
  const a = createLootTable(7, 12);
  const b = createLootTable(7, 12);
  assert.deepEqual(a.map((item) => item.id), b.map((item) => item.id));
  const c = createLootTable(8, 12);
  assert.notDeepEqual(a.map((item) => item.id), c.map((item) => item.id));
});

test("every rolled item is well formed", () => {
  const items = createLootTable(3, 40);
  assert.equal(items.length, 40);
  for (const item of items) {
    assert.ok(item.id && item.name, "id and name");
    assert.ok(item.size > 0, `${item.id} size`);
    assert.ok(item.amount > 0, `${item.id} amount`);
    assert.ok(RARITIES[item.rarity], `${item.id} rarity ${item.rarity}`);
    assert.ok(["weapon", "ammo", "armor", "heal", "grenade", "attachment"].includes(item.kind), item.kind);
  }
});

test("rarity roll always returns a known tier", () => {
  for (let index = 0; index < 200; index += 1) {
    const rarity = rollRarity();
    assert.ok(RARITIES[rarity], rarity);
  }
});

test("legendary loot stays uncommon", () => {
  const items = createLootTable(11, 400);
  const legendary = items.filter((item) => item.rarity === "legendary").length;
  const ratio = legendary / items.length;
  assert.ok(ratio < 0.2, `legendary ratio ${ratio.toFixed(2)} is too high`);
});

test("inventory starts empty with full capacity", () => {
  const inventory = createInventory();
  assert.equal(usedCapacity(inventory), 0);
  assert.equal(freeCapacity(inventory), inventory.capacity);
  assert.equal(inventorySummary(inventory).startsWith("0/"), true);
});

test("ammo stacks instead of consuming extra slots", () => {
  const inventory = createInventory();
  const ammo = { id: "ammo-ar", kind: "ammo", name: "ذخيرة", weaponId: "ar4", amount: 30, size: 6 };
  const first = addItem(inventory, ammo);
  const before = usedCapacity(first.inventory);
  const second = addItem(first.inventory, ammo);
  assert.equal(second.added, true);
  assert.equal(second.inventory.items.length, 1);
  assert.equal(second.inventory.items[0].count, 2);
  assert.equal(usedCapacity(second.inventory), before);
  assert.equal(totalAmmo(second.inventory, "ar4"), 60);
});

test("a full bag rejects new stacks without throwing", () => {
  let inventory = createInventory(12);
  const armor = { id: "armor-50", kind: "armor", name: "درع", amount: 50, size: 10 };
  const first = addItem(inventory, armor);
  assert.equal(first.added, true);
  const second = addItem(first.inventory, armor);
  assert.equal(second.added, false);
  assert.equal(second.reason, "full");
  assert.equal(second.inventory.items.length, 1);
});

test("armor never exceeds 100", () => {
  let inventory = createInventory(500);
  for (let index = 0; index < 5; index += 1) {
    inventory = addItem(inventory, { id: "armor-25", kind: "armor", name: "درع", amount: 25, size: 4 }).inventory;
  }
  assert.equal(inventory.armor, 100);
});

test("two primaries and one sidearm cap the loadout", () => {
  let inventory = createInventory(500);
  for (const weaponId of ["ar4", "smg9", "sg12"]) {
    inventory = addItem(inventory, { id: `weapon-${weaponId}`, kind: "weapon", name: weaponId, weaponId, size: 20 }).inventory;
  }
  assert.deepEqual(inventory.primaries, ["ar4", "smg9"]);
  assert.equal(inventory.sidearm, "sg12");
});

test("canFit mirrors free capacity", () => {
  const inventory = createInventory(20);
  assert.equal(canFit(inventory, { size: 15 }), true);
  assert.equal(canFit(inventory, { size: 25 }), false);
});
