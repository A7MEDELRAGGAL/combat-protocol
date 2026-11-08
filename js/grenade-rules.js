export const GRENADE_DEF = {
  id: "frag",
  capacity: 2,
  fuseSeconds: 1.25,
  radius: 5,
  maxDamage: 100,
  throwSpeed: 15,
  gravity: 20,
};

export function computeBlastDamage(distance, radius = GRENADE_DEF.radius, maxDamage = GRENADE_DEF.maxDamage) {
  if (!Number.isFinite(distance) || distance >= radius) return 0;
  return Math.max(0, maxDamage * (1 - Math.max(0, distance) / radius));
}
