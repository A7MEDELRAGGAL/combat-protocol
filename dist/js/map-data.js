import { MAP_DEFS as BR_MAP_DEFS, BR_MAPS } from "./br-map-data.js";

export { BR_MAPS };

const PORT_CONTAINERS = [
  [-24, -16, 7, 2.8, 2.8, 0, 0], [-24, -8, 7, 2.8, 2.8, 1, Math.PI / 2], [-24, 2, 7, 2.8, 2.8, 2, 0],
  [-24, 11, 7, 2.8, 2.8, 3, Math.PI / 2], [-24, 19, 7, 2.8, 2.8, 4, 0], [24, -18, 7, 2.8, 2.8, 2, 0],
  [24, -9, 7, 2.8, 2.8, 4, Math.PI / 2], [24, 1, 7, 2.8, 2.8, 0, 0], [24, 10, 7, 2.8, 2.8, 1, Math.PI / 2],
  [24, 18, 7, 2.8, 2.8, 3, 0], [-11, -17, 6, 2.6, 2.6, 3, 0], [11, -17, 6, 2.6, 2.6, 1, 0],
  [-12, 16, 6, 2.6, 2.6, 0, 0], [12, 16, 6, 2.6, 2.6, 4, 0],
  [-3.4, -2, 8, 3, 2.9, 2, 0], [3.4, -2, 8, 3, 2.9, 0, 0], [0, -2, 9, 3, 2.9, 1, 0, 2.9],
  [-3.2, 4.2, 5, 2.6, 2.6, 3, Math.PI / 2], [3.2, 4.2, 5, 2.6, 2.6, 4, Math.PI / 2],
];

const PORT_CRATES = [[-17, -3, 1.8, 1.3, 0.1], [-16, 7, 1.6, 1.2, 0.4], [-8, 9, 2, 1.1, 0], [8, 9, 1.8, 1.4, 0.3], [17, -3, 1.7, 1.2, 0.2], [16, 7, 1.9, 1.3, 0.5], [-6, -12, 1.5, 1.1, 0], [6, -12, 1.5, 1.1, 0], [-2, 12, 1.7, 1.2, 0.2], [2, 12, 1.7, 1.2, 0.2]];
const PORT_BARRIERS = [[-9, -6, 4.4, 0.1], [9, -6, 4.4, -0.1], [-9, 7, 3.6, 0.2], [9, 7, 3.6, -0.2], [0, -14, 5, 0], [0, 20, 5, 0]];

export const MAP_DEFS = {
  port: {
    id: "port",
    label: "Port Meridian",
    arabic: "ميناء ميريديان",
    seed: 441,
    environment: {
      background: 0xb9b0a0,
      fog: 0xbfb4a2,
      fogNear: 42,
      fogFar: 120,
      skyTop: 0x53646f,
      skyBottom: 0xd9c5a7,
      ground: "#6b675b",
      groundStripe: "rgba(211, 190, 130, 0.28)",
      groundStain: "rgba(30, 29, 25, 0.22)",
      sun: 0xffd8a0,
      keyLight: 0xffd2a0,
      hemisphereSky: 0xc7d3d8,
      hemisphereGround: 0x40382e,
      fillLight: 0x7fa2b8,
      lamp: 0xffc98a,
    },
    flow: "ممرات حاويات متقاطعة مع مركز مفتوح وخطوط رؤية متوسطة.",
    spawns: [{ x: 0, z: 20.5, yaw: 0 }, { x: -27, z: -19, yaw: 0 }, { x: 27, z: -19, yaw: 0 }, { x: -27, z: 20, yaw: Math.PI }, { x: 27, z: 20, yaw: Math.PI }, { x: 0, z: -19.5, yaw: 0 }],
    containers: PORT_CONTAINERS,
    crates: PORT_CRATES,
    barriers: PORT_BARRIERS,
    stairs: [[0, 8.6, 0.62], [0, 7.98, 1.24], [0, 7.36, 1.86], [0, 6.74, 2.48], [0, 6.12, 3.1], [0, 5.5, 3.72]],
    barrels: [[-19, 14], [-19, 15.4], [19, 14], [19, 15.4], [31, -20], [-31, -20]],
    lights: [[-30, -20], [30, -20], [-30, 20], [30, 20], [0, -21]],
    markers: [[0, 0, 14, 0.16], [0, 0, 0.16, 14], [-18, -18, 4, 0.12], [18, 18, 4, 0.12]],
    missionPoints: {
      kiosk: { id: "kiosk", label: "Service Kiosk", arabic: "كشك الخدمة", x: -15, z: -11, radius: 3.4 },
      relay: { id: "relay", label: "Relay 07", arabic: "المرحل 07", x: 15, z: 11, radius: 3.8 },
      extraction: { id: "extraction", label: "Crane Lane", arabic: "ممر الرافعة", x: 0, z: -19, radius: 3.6 },
    },
  },
  crossline: {
    id: "crossline",
    label: "Crossline Yard",
    arabic: "ساحة التقاطع",
    seed: 902,
    environment: {
      background: 0x9fa8aa,
      fog: 0xaab5b5,
      fogNear: 38,
      fogFar: 112,
      skyTop: 0x455866,
      skyBottom: 0xc7c7b3,
      ground: "#5d625d",
      groundStripe: "rgba(181, 196, 184, 0.22)",
      groundStain: "rgba(25, 31, 31, 0.2)",
      sun: 0xffd4a4,
      keyLight: 0xe6c8a1,
      hemisphereSky: 0xb8cbd0,
      hemisphereGround: 0x303a39,
      fillLight: 0x6e9eb0,
      lamp: 0xffd3a0,
    },
    flow: "مسارات متقاطعة وغطاء مركزي يفرض تبديل الزوايا باستمرار.",
    spawns: [{ x: 0, z: 20.5, yaw: 0 }, { x: -28, z: -18, yaw: 0 }, { x: 28, z: -18, yaw: 0 }, { x: -28, z: 18, yaw: Math.PI }, { x: 28, z: 18, yaw: Math.PI }, { x: 0, z: -20, yaw: 0 }],
    containers: [
      [-20, -14, 9, 2.8, 2.8, 0, 0], [-7, -14, 7, 2.8, 2.8, 1, 0], [7, -14, 7, 2.8, 2.8, 2, 0], [20, -14, 9, 2.8, 2.8, 3, 0],
      [-20, 14, 9, 2.8, 2.8, 3, 0], [-7, 14, 7, 2.8, 2.8, 4, 0], [7, 14, 7, 2.8, 2.8, 0, 0], [20, 14, 9, 2.8, 2.8, 1, 0],
      [-20, -3, 7, 2.8, 2.8, 2, Math.PI / 2], [20, 3, 7, 2.8, 2.8, 4, Math.PI / 2], [0, 0, 7, 2.8, 2.8, 1, Math.PI / 2],
      [0, 0, 6, 2.8, 2.8, 3, Math.PI / 2, 2.9],
    ],
    crates: [[-13, -4, 1.8, 1.2, 0], [13, 4, 1.8, 1.2, 0.2], [-3, -8, 1.5, 1.1, 0.4], [3, 8, 1.5, 1.1, 0.1], [-9, 5, 2, 1.3, 0], [9, -5, 2, 1.3, 0]],
    barriers: [[-11, 0, 4.8, 0], [11, 0, 4.8, 0], [0, -8, 4, 0.15], [0, 8, 4, -0.15]],
    stairs: [[0, -5.3, 0.62], [0, -5.92, 1.24], [0, -6.54, 1.86], [0, -7.16, 2.48], [0, -7.78, 3.1]],
    barrels: [[-29, 0], [29, 0], [-15, -19], [15, 19]],
    lights: [[-30, -20], [30, -20], [-30, 20], [30, 20], [0, 0]],
    markers: [[0, 0, 18, 0.16], [0, 0, 0.16, 18], [-22, 0, 3, 0.12], [22, 0, 3, 0.12]],
  },
  stackyard: {
    id: "stackyard",
    label: "Stackyard 12",
    arabic: "ساحة التكديس 12",
    seed: 1337,
    environment: {
      background: 0x9b9484,
      fog: 0xaaa28e,
      fogNear: 40,
      fogFar: 116,
      skyTop: 0x4e5b58,
      skyBottom: 0xc7b38f,
      ground: "#5f5b4f",
      groundStripe: "rgba(206, 177, 111, 0.24)",
      groundStain: "rgba(35, 29, 23, 0.24)",
      sun: 0xffc58a,
      keyLight: 0xffc998,
      hemisphereSky: 0xb7c2bd,
      hemisphereGround: 0x40362a,
      fillLight: 0x789aa0,
      lamp: 0xffc07a,
    },
    flow: "جداران مرتفعان ومركز مكدّس للقتال العمودي والالتفاف.",
    spawns: [{ x: 0, z: 20.5, yaw: 0 }, { x: -28, z: -18, yaw: 0 }, { x: 28, z: -18, yaw: 0 }, { x: -28, z: 18, yaw: Math.PI }, { x: 28, z: 18, yaw: Math.PI }, { x: 0, z: -20, yaw: 0 }],
    containers: [
      [-26, -15, 6, 2.8, 2.8, 0, Math.PI / 2], [-26, -8, 6, 2.8, 2.8, 1, Math.PI / 2], [-26, -1, 6, 2.8, 2.8, 2, Math.PI / 2], [-26, 6, 6, 2.8, 2.8, 3, Math.PI / 2], [-26, 13, 6, 2.8, 2.8, 4, Math.PI / 2],
      [26, -13, 6, 2.8, 2.8, 2, Math.PI / 2], [26, -6, 6, 2.8, 2.8, 3, Math.PI / 2], [26, 1, 6, 2.8, 2.8, 4, Math.PI / 2], [26, 8, 6, 2.8, 2.8, 0, Math.PI / 2], [26, 15, 6, 2.8, 2.8, 1, Math.PI / 2],
      [-10, -12, 8, 3, 2.9, 2, 0], [10, 12, 8, 3, 2.9, 4, 0], [0, -3, 8, 3, 2.9, 1, 0], [0, -3, 7, 2.8, 2.8, 3, 0, 2.9],
    ],
    crates: [[-17, 2, 1.6, 1.2, 0], [17, -2, 1.6, 1.2, 0], [-14, -18, 1.8, 1.3, 0.2], [14, 18, 1.8, 1.3, 0.2], [-5, 17, 2, 1.2, 0], [5, -17, 2, 1.2, 0]],
    barriers: [[-12, 5, 4, 0.2], [12, -5, 4, -0.2], [0, 9, 5, 0], [0, -16, 5, 0]],
    stairs: [[0, 1.3, 0.62], [0, 0.68, 1.24], [0, 0.06, 1.86], [0, -0.56, 2.48], [0, -1.18, 3.1]],
    barrels: [[-31, -20], [-31, 20], [31, -20], [31, 20]],
    lights: [[-30, -20], [30, -20], [-30, 20], [30, 20], [0, 0]],
    markers: [[0, 0, 12, 0.16], [0, 0, 0.16, 12], [-20, 0, 3, 0.12], [20, 0, 3, 0.12]],
  },
  drydock9: {
    id: "drydock9",
    label: "Drydock 9",
    arabic: "حوض الإصلاح 09",
    seed: 2099,
    environment: {
      background: 0x8899a0,
      fog: 0x92a1a3,
      fogNear: 34,
      fogFar: 106,
      skyTop: 0x324a5b,
      skyBottom: 0xabb9b1,
      ground: "#515b5a",
      groundStripe: "rgba(192, 207, 193, 0.2)",
      groundStain: "rgba(18, 27, 30, 0.28)",
      sun: 0xffc69b,
      keyLight: 0xf3c39f,
      hemisphereSky: 0xabc5d0,
      hemisphereGround: 0x293536,
      fillLight: 0x5d99af,
      lamp: 0xffb878,
    },
    flow: "ثلاثة مسارات مع رافعة وسطية ومرتفعات معدنية.",
    spawns: [{ x: 0, z: 20.5, yaw: 0 }, { x: -28, z: -18, yaw: 0 }, { x: 28, z: -18, yaw: 0 }, { x: -28, z: 18, yaw: Math.PI }, { x: 28, z: 18, yaw: Math.PI }, { x: 0, z: -20, yaw: Math.PI }],
    containers: [
      [-24, -15, 8, 2.8, 2.8, 0, 0], [-12, -15, 7, 2.8, 2.8, 1, 0], [12, -15, 7, 2.8, 2.8, 2, 0], [24, -15, 8, 2.8, 2.8, 3, 0],
      [-24, 15, 8, 2.8, 2.8, 3, 0], [-12, 15, 7, 2.8, 2.8, 4, 0], [12, 15, 7, 2.8, 2.8, 0, 0], [24, 15, 8, 2.8, 2.8, 1, 0],
      [-21, -3, 6, 2.8, 2.8, 2, Math.PI / 2], [21, 3, 6, 2.8, 2.8, 4, Math.PI / 2],
      [0, -8, 8, 3, 2.9, 1, 0], [0, -8, 7, 2.8, 2.8, 3, 0, 2.9],
      [0, 8, 8, 3, 2.9, 2, 0], [0, 8, 7, 2.8, 2.8, 4, 0, 2.9],
    ],
    crates: [[-15, -5, 1.8, 1.3, 0], [15, 5, 1.8, 1.3, 0.2], [-7, -5, 1.4, 1.1, 0.4], [7, 5, 1.4, 1.1, 0.1], [-5, 18, 2, 1.2, 0], [5, -18, 2, 1.2, 0], [-28, 2, 1.6, 1.2, 0.2], [28, -2, 1.6, 1.2, 0.3]],
    barriers: [[-10, 0, 4.8, 0], [10, 0, 4.8, 0], [0, -3, 3.6, 0.18], [0, 3, 3.6, -0.18], [-3, -20, 4, 0], [3, 20, 4, 0]],
    stairs: [[0, -4.6, 0.62], [0, -5.22, 1.24], [0, -5.84, 1.86], [0, -6.46, 2.48], [0, -7.08, 3.1]],
    barrels: [[-30, -2], [30, 2], [-16, -20], [16, 20], [-2, 0], [2, 0]],
    lights: [[-30, -20], [30, -20], [-30, 20], [30, 20], [0, -20], [0, 20]],
    markers: [[0, 0, 18, 0.16], [0, 0, 0.16, 18], [-18, 0, 3, 0.12], [18, 0, 3, 0.12]],
  },
  nightBazaar: {
    id: "nightBazaar",
    label: "Night Bazaar",
    arabic: "السوق الليلي",
    seed: 3117,
    environment: {
      background: 0x171c24,
      fog: 0x2d3642,
      fogNear: 28,
      fogFar: 92,
      skyTop: 0x080d18,
      skyBottom: 0x4b3d3b,
      ground: "#383a3a",
      groundStripe: "rgba(219, 164, 92, 0.2)",
      groundStain: "rgba(4, 7, 10, 0.34)",
      sun: 0xffb36c,
      keyLight: 0xe6a56f,
      hemisphereSky: 0x536d80,
      hemisphereGround: 0x171817,
      fillLight: 0x5ca2b2,
      lamp: 0xffa860,
      exposure: 1.05,
    },
    flow: "ممر داخلي ضيق مع أسطح جانبية ومخارج قصيرة.",
    spawns: [{ x: 0, z: 20.5, yaw: 0 }, { x: -28, z: -18, yaw: 0 }, { x: 28, z: -18, yaw: 0 }, { x: -28, z: 18, yaw: Math.PI }, { x: 28, z: 18, yaw: Math.PI }, { x: 0, z: -20, yaw: Math.PI }],
    containers: [
      [-25, -14, 7, 2.8, 2.8, 0, Math.PI / 2], [-25, -5, 7, 2.8, 2.8, 1, Math.PI / 2], [-25, 5, 7, 2.8, 2.8, 2, Math.PI / 2], [-25, 14, 7, 2.8, 2.8, 3, Math.PI / 2],
      [25, -14, 7, 2.8, 2.8, 3, Math.PI / 2], [25, -5, 7, 2.8, 2.8, 4, Math.PI / 2], [25, 5, 7, 2.8, 2.8, 0, Math.PI / 2], [25, 14, 7, 2.8, 2.8, 1, Math.PI / 2],
      [-8, -10, 7, 2.8, 2.8, 2, 0], [8, 10, 7, 2.8, 2.8, 4, 0], [0, 0, 6, 2.8, 2.8, 1, Math.PI / 2], [0, 0, 5, 2.6, 2.6, 3, Math.PI / 2, 2.6],
    ],
    crates: [[-16, -14, 1.8, 1.2, 0], [16, 14, 1.8, 1.2, 0.2], [-16, 14, 1.6, 1.1, 0.3], [16, -14, 1.6, 1.1, 0.1], [-8, 5, 2, 1.3, 0], [8, -5, 2, 1.3, 0], [-3, -18, 1.5, 1.1, 0.2], [3, 18, 1.5, 1.1, 0.4]],
    barriers: [[-12, 0, 3.8, 0.1], [12, 0, 3.8, -0.1], [0, -8, 4.4, 0], [0, 8, 4.4, 0], [-4, 3, 2.8, 0.22], [4, -3, 2.8, -0.22]],
    stairs: [[0, 5.1, 0.62], [0, 4.48, 1.24], [0, 3.86, 1.86], [0, 3.24, 2.48], [0, 2.62, 3.1]],
    barrels: [[-30, -20], [-30, 20], [30, -20], [30, 20], [-4, -11], [4, 11]],
    lights: [[-30, -20], [30, -20], [-30, 20], [30, 20], [-10, 0], [10, 0]],
    markers: [[0, 0, 14, 0.16], [0, 0, 0.16, 14], [-18, -18, 3, 0.12], [18, 18, 3, 0.12]],
  },
};

export function mapById(id) {
  return MAP_DEFS[id] ?? BR_MAP_DEFS[id] ?? MAP_DEFS.port;
}

export function isBattleRoyaleMap(id) {
  return Boolean(BR_MAP_DEFS[id]?.battleRoyale);
}

/** Returns the selected map when valid; otherwise returns the full mode map list. */
export function mapsForMode(modeId, preferred = null) {
  const valid = modeId === "battleRoyale" ? [...BR_MAPS] : Object.keys(MAP_DEFS);
  if (preferred && valid.includes(preferred)) return [preferred];
  return valid;
}

export function brMapsForModes(modeId, preferred = null) {
  return mapsForMode(modeId, preferred);
}
