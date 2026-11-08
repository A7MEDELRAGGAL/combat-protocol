// Prints a balance table for every weapon so role overlap and outliers are visible.
// Usage: node tools/balance-report.mjs
import { WEAPON_DEFS, shotsPerSecond } from "../js/weapon-data.js";

const BODY_HP = 100;

function shotsToKill(weapon, multiplier = 1) {
  return Math.ceil(BODY_HP / (weapon.damage * multiplier));
}

function ttk(weapon, multiplier = 1) {
  const shots = shotsToKill(weapon, multiplier);
  return ((shots - 1) / shotsPerSecond(weapon)).toFixed(3);
}

function dps(weapon, multiplier = 1) {
  const pellets = weapon.pellets ?? 1;
  return (weapon.damage * pellets * multiplier * shotsPerSecond(weapon)).toFixed(1);
}

const rows = WEAPON_DEFS.map((weapon) => {
  const [near, far, farMultiplier] = weapon.range;
  const pellets = weapon.pellets ?? 1;
  const burstKill = weapon.damage * pellets >= BODY_HP;
  return {
    id: weapon.id,
    name: weapon.name,
    role: weapon.short,
    rpm: weapon.rpm,
    mag: weapon.mag,
    near,
    far,
    falloff: farMultiplier,
    // A shotgun lands its pellets in one trigger pull, so raw TTK math would lie.
    ttkClose: burstKill ? "0.000" : ttk(weapon, 1),
    ttkFar: ttk(weapon, farMultiplier),
    ttkHeadClose: burstKill ? "0.000" : ttk(weapon, weapon.headshot),
    dpsClose: dps(weapon, 1),
    dpsFar: dps(weapon, farMultiplier),
    shots: shotsToKill(weapon, 1),
    pellets,
  };
});

console.log(
  "name".padEnd(7),
  "rpm".padStart(5),
  "mag".padStart(4),
  "near".padStart(5),
  "far".padStart(4),
  "fall".padStart(5),
  "TTK0".padStart(6),
  "TTKfar".padStart(7),
  "TTKhs".padStart(6),
  "DPS0".padStart(7),
  "DPSfar".padStart(7),
  "shots".padStart(6),
);
for (const row of rows) {
  console.log(
    row.name.padEnd(7),
    String(row.rpm).padStart(5),
    String(row.mag).padStart(4),
    String(row.near).padStart(5),
    String(row.far).padStart(4),
    String(row.falloff).padStart(5),
    row.ttkClose.padStart(6),
    row.ttkFar.padStart(7),
    row.ttkHeadClose.padStart(6),
    row.dpsClose.padStart(7),
    row.dpsFar.padStart(7),
    String(row.shots).padStart(6),
  );
}

console.log("\nDominance check (a weapon that is both faster AND longer-ranged than another):");
// Sidearm, shotgun and sniper are deliberately outside the primary-rifle comparison.
const PRIMARY = new Set(["ar4", "smg9", "lmg6", "br7", "dmr7", "vpr5"]);
let flagged = 0;
for (const a of rows) {
  for (const b of rows) {
    if (a.id === b.id) continue;
    if (!PRIMARY.has(a.id) || !PRIMARY.has(b.id)) continue;
    const faster = Number(a.ttkClose) < Number(b.ttkClose) - 0.001;
    const longer = a.far > b.far;
    if (faster && longer) {
      console.log(`  ${a.name} dominates ${b.name} (TTK ${a.ttkClose} vs ${b.ttkClose}, range ${a.far}m vs ${b.far}m)`);
      flagged += 1;
    }
  }
}
console.log(flagged === 0 ? "  none" : `  ${flagged} pair(s)`);
