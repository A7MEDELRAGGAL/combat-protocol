/**
 * BR-focused arena data: two larger,POI-based maps reserved for Battle Royale.
 * Same schema as classic maps so world.js builds them without changes.
 */

const MERIDIAN_CONTAINERS = [
  // North yard (POI: مساحة الشحن)
  [-26, -26, 9, 2.8, 2.8, 0, 0], [-14, -26, 8, 2.8, 2.8, 1, 0], [-2, -26, 9, 2.8, 2.8, 2, 0],
  [12, -26, 8, 2.8, 2.8, 3, 0], [24, -26, 9, 2.8, 2.8, 4, 0],
  [-20, -18, 7, 2.8, 2.8, 1, 0], [16, -18, 7, 2.8, 2.8, 2, 0],
  // Central stack (POI: البرج)
  [-4, -6, 8, 2.9, 2.9, 3, 0], [4, -6, 8, 2.9, 2.9, 0, 0], [0, 2, 7, 2.8, 2.8, 1, Math.PI / 2],
  [0, 10, 7, 2.8, 2.8, 2, Math.PI / 2, 2.9], [-7, 6, 6, 2.6, 2.6, 4, 0], [7, 6, 6, 2.6, 2.6, 3, 0],
  // East depot (POI: المستودع الشرقي)
  [26, -8, 8, 2.8, 2.8, 0, Math.PI / 2], [26, 4, 8, 2.8, 2.8, 1, Math.PI / 2], [26, 16, 8, 2.8, 2.8, 2, Math.PI / 2],
  [16, 12, 7, 2.8, 2.8, 4, 0],
  // West depot (POI: المستودع الغربي)
  [-26, -4, 8, 2.8, 2.8, 2, Math.PI / 2], [-26, 8, 8, 2.8, 2.8, 3, Math.PI / 2], [-26, 20, 8, 2.8, 2.8, 4, Math.PI / 2],
  [-16, 14, 7, 2.8, 2.8, 0, 0],
  // South row (POI: السوق)
  [-22, 26, 9, 2.8, 2.8, 1, 0], [-8, 26, 8, 2.8, 2.8, 2, 0], [6, 26, 9, 2.8, 2.8, 3, 0], [20, 26, 8, 2.8, 2.8, 4, 0],
  [-2, 20, 6, 2.6, 2.6, 0, Math.PI / 2],
];

const MERIDIAN_CRATES = [
  [-10, -22, 1.8, 1.3, 0], [8, -22, 1.7, 1.2, 0.2], [-18, -10, 1.6, 1.1, 0.3], [18, -10, 1.6, 1.1, 0],
  [-2, -2, 2, 1.2, 0], [2, 14, 1.8, 1.2, 0.1], [-22, 2, 1.7, 1.1, 0.2], [22, 10, 1.8, 1.2, 0],
  [-12, 20, 1.6, 1.1, 0.3], [12, 20, 1.6, 1.1, 0.1], [0, -16, 1.9, 1.2, 0], [0, 24, 1.9, 1.2, 0.2],
];

const MERIDIAN_BARRIERS = [
  [-8, -14, 5, 0], [8, -14, 5, 0], [-14, 0, 4.4, 0], [14, 0, 4.4, 0],
  [-6, 14, 4, 0.1], [6, 14, 4, -0.1], [0, -22, 5, 0], [0, 22, 5, 0],
];

const MERIDIAN_BARRELS = [
  [-30, -30], [-30, -28], [30, -30], [30, -28], [-30, 30], [30, 30],
  [-12, -8], [12, 8], [-24, 16], [24, -16], [0, -26], [0, 26],
];

const MERIDIAN_LIGHTS = [
  [-32, -32], [32, -32], [-32, 32], [32, 32], [0, -32], [0, 32], [-16, 0], [16, 0],
];

const MERIDIAN_MARKERS = [
  [0, 0, 24, 0.14], [0, 0, 0.14, 24], [-20, -20, 5, 0.1], [20, 20, 5, 0.1], [-20, 20, 5, 0.1], [20, -20, 5, 0.1],
];

const DUNE_CONTAINERS = [
  // Ring layout around a dune bowl
  [-28, -20, 8, 2.8, 2.8, 3, 0], [-18, -24, 7, 2.8, 2.8, 4, 0], [-6, -26, 8, 2.8, 2.8, 0, 0], [8, -24, 7, 2.8, 2.8, 1, 0], [22, -22, 8, 2.8, 2.8, 2, 0],
  [-30, -4, 7, 2.8, 2.8, 4, Math.PI / 2], [30, -8, 7, 2.8, 2.8, 0, Math.PI / 2],
  [-30, 14, 7, 2.8, 2.8, 1, Math.PI / 2], [30, 18, 7, 2.8, 2.8, 3, Math.PI / 2],
  [-22, 26, 8, 2.8, 2.8, 2, 0], [-6, 28, 7, 2.8, 2.8, 3, 0], [10, 26, 8, 2.8, 2.8, 4, 0], [24, 24, 7, 2.8, 2.8, 0, 0],
  // Center ridge (POI: حافة الكثيب)
  [0, -4, 8, 2.9, 2.9, 0, Math.PI / 2], [-3, 6, 7, 2.8, 2.8, 1, 0], [3, 14, 7, 2.8, 2.8, 2, 0],
  [-12, 8, 6, 2.6, 2.6, 3, 0], [12, 2, 6, 2.6, 2.6, 4, 0],
];

const DUNE_CRATES = [
  [-24, -18, 1.8, 1.2, 0], [-4, -20, 1.7, 1.1, 0.2], [16, -18, 1.8, 1.2, 0.1], [-28, 8, 1.6, 1.1, 0.3],
  [28, 12, 1.6, 1.1, 0], [-16, 22, 1.8, 1.2, 0.2], [6, 24, 1.7, 1.1, 0], [0, 0, 2, 1.2, 0],
  [-10, 14, 1.6, 1.1, 0.1], [10, 8, 1.6, 1.1, 0.3], [-20, -8, 1.8, 1.2, 0], [20, -4, 1.8, 1.2, 0.2],
];

const DUNE_BARRIERS = [
  [-12, -12, 4.6, 0], [12, -12, 4.6, 0], [-16, 4, 4, 0.12], [16, 6, 4, -0.12],
  [-6, 22, 4.4, 0], [6, 22, 4.4, 0], [0, -24, 4.6, 0], [0, 16, 4.2, 0],
];

const DUNE_BARRELS = [
  [-32, -24], [-32, 24], [32, -24], [32, 24], [-14, -20], [14, -20], [-18, 18], [18, 14], [0, -18], [0, 18],
];

const DUNE_LIGHTS = [
  [-32, -32], [32, -32], [-32, 32], [32, 32], [-20, 0], [20, 0], [0, -30], [0, 30],
];

const DUNE_MARKERS = [
  [0, 0, 26, 0.13], [0, 0, 0.13, 26], [-22, -22, 5, 0.1], [22, -22, 5, 0.1], [-22, 22, 5, 0.1], [22, 22, 5, 0.1],
];

const BR_SPAWNS = [
  { x: 0, z: 30, yaw: 0 }, { x: 0, z: -30, yaw: Math.PI }, { x: -30, z: 0, yaw: Math.PI / 2 }, { x: 30, z: 0, yaw: -Math.PI / 2 },
  { x: -30, z: -30, yaw: Math.PI / 4 }, { x: 30, z: -30, yaw: -Math.PI / 4 }, { x: -30, z: 30, yaw: 3 * Math.PI / 4 }, { x: 30, z: 30, yaw: -3 * Math.PI / 4 },
  { x: -16, z: 30, yaw: 0 }, { x: 16, z: 30, yaw: 0 }, { x: -16, z: -30, yaw: Math.PI }, { x: 16, z: -30, yaw: Math.PI },
  { x: -30, z: -16, yaw: Math.PI / 2 }, { x: -30, z: 16, yaw: Math.PI / 2 }, { x: 30, z: -16, yaw: -Math.PI / 2 }, { x: 30, z: 16, yaw: -Math.PI / 2 },
  { x: 0, z: 16, yaw: 0 }, { x: 0, z: -16, yaw: Math.PI }, { x: -16, z: 0, yaw: Math.PI / 2 }, { x: 16, z: 0, yaw: -Math.PI / 2 },
];

const HARBOR_CONTAINERS = [
  [-34, -28, 8, 2.8, 2.8, 0, Math.PI / 2], [-34, -14, 8, 2.8, 2.8, 1, Math.PI / 2],
  [-34, 0, 8, 2.8, 2.8, 2, Math.PI / 2], [-34, 14, 8, 2.8, 2.8, 3, Math.PI / 2],
  [-34, 28, 8, 2.8, 2.8, 4, Math.PI / 2], [34, -28, 8, 2.8, 2.8, 2, Math.PI / 2],
  [34, -14, 8, 2.8, 2.8, 0, Math.PI / 2], [34, 0, 8, 2.8, 2.8, 1, Math.PI / 2],
  [34, 14, 8, 2.8, 2.8, 4, Math.PI / 2], [34, 28, 8, 2.8, 2.8, 3, Math.PI / 2],
  [-18, -30, 7, 2.6, 2.6, 1, 0], [18, -30, 7, 2.6, 2.6, 2, 0],
  [-18, 30, 7, 2.6, 2.6, 3, 0], [18, 30, 7, 2.6, 2.6, 0, 0],
];

const HARBOR_CRATES = [
  [-30, -20, 1.8, 1.2, 0], [-20, -8, 1.7, 1.1, 0.2], [20, -8, 1.8, 1.2, 0.1],
  [30, 20, 1.7, 1.1, 0], [-30, 22, 1.6, 1.1, 0.3], [-12, 0, 1.8, 1.2, 0],
  [12, 0, 1.7, 1.1, 0.2], [0, 20, 1.9, 1.2, 0],
];

const HARBOR_BARRIERS = [
  [-20, -12, 4.6, 0], [20, -12, 4.6, 0], [-20, 4, 4.2, 0.1],
  [20, 4, 4.2, -0.1], [0, 24, 5, 0], [0, -24, 5, 0],
];

const HARBOR_BARRELS = [
  [-36, -30], [36, -30], [-36, 30], [36, 30], [-26, 0], [26, 0], [0, -26], [0, 26],
];

const HARBOR_LIGHTS = [
  [-36, -32], [36, -32], [-36, 32], [36, 32], [-14, -14], [14, 14], [0, 0],
];

const HARBOR_MARKERS = [
  [0, 0, 30, 0.16], [0, 0, 0.16, 28], [-24, -20, 6, 0.12], [24, 20, 6, 0.12],
];

const HARBOR_SPAWNS = [
  { x: 0, z: 34, yaw: 0 }, { x: 0, z: -34, yaw: Math.PI }, { x: -38, z: 0, yaw: Math.PI / 2 }, { x: 38, z: 0, yaw: -Math.PI / 2 },
  { x: -30, z: -30, yaw: Math.PI / 4 }, { x: 30, z: -30, yaw: -Math.PI / 4 }, { x: -30, z: 30, yaw: 3 * Math.PI / 4 }, { x: 30, z: 30, yaw: -3 * Math.PI / 4 },
  { x: -14, z: 34, yaw: 0 }, { x: 14, z: 34, yaw: 0 }, { x: -14, z: -34, yaw: Math.PI }, { x: 14, z: -34, yaw: Math.PI },
  { x: -38, z: -16, yaw: Math.PI / 2 }, { x: -38, z: 16, yaw: Math.PI / 2 }, { x: 38, z: -16, yaw: -Math.PI / 2 }, { x: 38, z: 16, yaw: -Math.PI / 2 },
  { x: 0, z: 16, yaw: 0 }, { x: 0, z: -16, yaw: Math.PI }, { x: -16, z: 0, yaw: Math.PI / 2 }, { x: 16, z: 0, yaw: -Math.PI / 2 },
];

export const BR_MAPS = ["meridianExpanse", "duneBasin", "harborTown"];

export const MAP_DEFS = {
  meridianExpanse: {
    id: "meridianExpanse",
    label: "Meridian Expanse",
    arabic: "سهل ميريديان",
    seed: 7001,
    battleRoyale: true,
    bounds: { halfX: 36, halfZ: 34 },
    environment: {
      background: 0xc7bda8,
      fog: 0xcabfa9,
      fogNear: 55,
      fogFar: 165,
      skyTop: 0x4d5e6a,
      skyBottom: 0xdcc9a9,
      ground: "#6f6a5c",
      groundStripe: "rgba(214, 190, 128, 0.26)",
      groundStain: "rgba(28, 27, 23, 0.2)",
      sun: 0xffd8a0,
      keyLight: 0xffd2a0,
      hemisphereSky: 0xc7d3d8,
      hemisphereGround: 0x423a2f,
      fillLight: 0x7fa2b8,
      lamp: 0xffc98a,
      skyline: 0x6a6d68,
    },
    flow: "ساحة واسعة بخمس نقاط اهتمام: الشحن، البرج، المستودعان، والسوق.",
    spawns: BR_SPAWNS,
    containers: MERIDIAN_CONTAINERS,
    crates: MERIDIAN_CRATES,
    barriers: MERIDIAN_BARRIERS,
    houseSpots: [
      [31, -20, 5.5, 5.5, 4.0, 0, 1],
      [-31, -20, 5.5, 5.5, 4.0, 0, 2],
      [31, 20, 5.5, 5.5, 4.0, Math.PI, 0],
      [-31, 20, 5.5, 5.5, 4.0, Math.PI, 1],
    ],
    stairs: [[0, 4.4, 0.62], [0, 3.78, 1.24], [0, 3.16, 1.86], [0, 2.54, 2.48]],
    barrels: MERIDIAN_BARRELS,
    lights: MERIDIAN_LIGHTS,
    markers: MERIDIAN_MARKERS,
    missionPoints: {
      northYard: { id: "northYard", label: "Container Yard", arabic: "مساحة الشحن", x: 0, z: -26, radius: 6 },
      centralStack: { id: "centralStack", label: "Central Stack", arabic: "البرج", x: 0, z: 2, radius: 6 },
      eastDepot: { id: "eastDepot", label: "East Depot", arabic: "المستودع الشرقي", x: 26, z: 6, radius: 6 },
      westDepot: { id: "westDepot", label: "West Depot", arabic: "المستودع الغربي", x: -26, z: 8, radius: 6 },
      southMarket: { id: "southMarket", label: "South Market", arabic: "السوق", x: 0, z: 26, radius: 6 },
    },
  },
  duneBasin: {
    id: "duneBasin",
    label: "Dune Basin",
    arabic: "حوض الكثبان",
    seed: 7113,
    battleRoyale: true,
    bounds: { halfX: 36, halfZ: 34 },
    environment: {
      background: 0xd2b890,
      fog: 0xd4bb94,
      fogNear: 60,
      fogFar: 175,
      skyTop: 0x5a5a6e,
      skyBottom: 0xe4c9a2,
      ground: "#7a6f58",
      groundStripe: "rgba(224, 196, 132, 0.24)",
      groundStain: "rgba(38, 32, 22, 0.22)",
      sun: 0xffdCA0,
      keyLight: 0xffd8a8,
      hemisphereSky: 0xd0d8dc,
      hemisphereGround: 0x4a4030,
      fillLight: 0x8fa8b8,
      lamp: 0xffcf98,
      skyline: 0x71695a,
      exposure: 1.14,
    },
    flow: "حوض واسع بحلقة خارجية ومرتفع مركزي — قناصة واشتباكات مفتوحة.",
    spawns: BR_SPAWNS,
    containers: DUNE_CONTAINERS,
    crates: DUNE_CRATES,
    barriers: DUNE_BARRIERS,
    stairs: [[0, -8.4, 0.62], [0, -9.02, 1.24], [0, -9.64, 1.86], [0, -10.26, 2.48]],
    barrels: DUNE_BARRELS,
    lights: DUNE_LIGHTS,
    markers: DUNE_MARKERS,
    missionPoints: {
      outerRing: { id: "outerRing", label: "Outer Ring", arabic: "الحلقة الخارجية", x: 0, z: -26, radius: 8 },
      duneRidge: { id: "duneRidge", label: "Dune Ridge", arabic: "حافة الكثيب", x: 0, z: 4, radius: 7 },
    },
  },
  harborTown: {
    id: "harborTown",
    label: "Harbor Town",
    arabic: "بلدة الميناء",
    seed: 7229,
    battleRoyale: true,
    bounds: { halfX: 40, halfZ: 36 },
    environment: {
      background: 0xb9b4a5,
      fog: 0xc5bca9,
      fogNear: 52,
      fogFar: 160,
      skyTop: 0x465966,
      skyBottom: 0xdcc6a7,
      ground: "#6c685c",
      groundStripe: "rgba(218, 194, 136, 0.24)",
      groundStain: "rgba(26, 27, 24, 0.22)",
      sun: 0xffd7a2,
      keyLight: 0xffd0a0,
      hemisphereSky: 0xc4d0d4,
      hemisphereGround: 0x40392f,
      fillLight: 0x7e9fb2,
      lamp: 0xffc78c,
      skyline: 0x636762,
      exposure: 1.12,
    },
    flow: "بلدة ساحلية بمبانٍ سكنية ومستودعات وممرات ضيقة — قتال متوسط المدى مع أسطح ومداخل.",
    spawns: HARBOR_SPAWNS,
    containers: HARBOR_CONTAINERS,
    crates: HARBOR_CRATES,
    barriers: HARBOR_BARRIERS,
    barrels: HARBOR_BARRELS,
    lights: HARBOR_LIGHTS,
    markers: HARBOR_MARKERS,
    houseSpots: [
      [-24, -20, 10, 8, 5.4, 0, 0],
      [-8, -20, 9, 7, 4.0, 0, 1],
      [10, -20, 9, 7, 4.2, 0, 2],
      [26, -20, 9, 8, 5.4, 0, 0],
      [-24, -2, 9, 7, 5.2, 0, 2],
      [26, -2, 9, 7, 5.2, Math.PI, 0],
      [-24, 10, 10, 8, 4.2, Math.PI, 1],
      [-8, 12, 9, 7, 3.9, Math.PI, 2],
      [10, 12, 9, 7, 4.1, Math.PI, 0],
      [26, 10, 9, 8, 5.4, Math.PI, 1],
    ],
    missionPoints: {
      northRow: { id: "northRow", label: "North Row", arabic: "الصف الشمالي", x: 0, z: -26, radius: 6 },
      southRow: { id: "southRow", label: "South Row", arabic: "الصف الجنوبي", x: 0, z: 26, radius: 6 },
      market: { id: "market", label: "Town Market", arabic: "سوق البلدة", x: -24, z: 10, radius: 5 },
      docks: { id: "docks", label: "Harbor Docks", arabic: "أرصفة الميناء", x: 34, z: 0, radius: 6 },
      plaza: { id: "plaza", label: "Central Plaza", arabic: "الساحة المركزية", x: 0, z: 0, radius: 7 },
    },
  },
};
