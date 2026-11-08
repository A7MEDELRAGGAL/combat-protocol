/**
 * Combat archetypes. Index % 4 keeps the mix deterministic: every squad of four
 * contains one of each role, which makes fights readable and varied.
 */
export const ARCHETYPES = [
  { id: "assault", arabic: "مهاجم", health: 100, speed: 1, engageRange: 26, fireMin: 0.75, fireMax: 1.35, damage: 1, accuracy: 1, scale: 1 },
  { id: "rusher", arabic: "مقتحم", health: 85, speed: 1.35, engageRange: 12, fireMin: 0.45, fireMax: 0.85, damage: 0.95, accuracy: 0.9, scale: 0.97 },
  { id: "marksman", arabic: "قنّاص", health: 80, speed: 0.85, engageRange: 36, fireMin: 1.4, fireMax: 2.2, damage: 1.9, accuracy: 1.2, scale: 1 },
  { id: "heavy", arabic: "ثقيل", health: 160, speed: 0.78, engageRange: 22, fireMin: 0.55, fireMax: 0.95, damage: 0.8, accuracy: 0.85, scale: 1.08 },
];

export function archetypeFor(index) {
  return ARCHETYPES[Math.abs(Math.trunc(index)) % ARCHETYPES.length];
}
