import * as THREE from "../vendor/three.module.js";
import { clamp, damageFalloff, randRange, seededRandom } from "./utils.js";
import { WEAPON_DEFS } from "./weapon-data.js";
import { applyAttachments, getLoadoutIds, skinById } from "./game-data.js";
export { WEAPON_DEFS } from "./weapon-data.js";

function makeMaterial(color, roughness = 0.6, metalness = 0.35) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    depthTest: false,
    depthWrite: false,
  });
}

function addBox(group, size, position, material, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.renderOrder = 1000 + group.children.length;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, radiusTop, radiusBottom, height, position, material, rotation = [Math.PI / 2, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 10), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.renderOrder = 1000 + group.children.length;
  group.add(mesh);
  return mesh;
}

function addSphere(group, radius, position, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.renderOrder = 1000 + group.children.length;
  group.add(mesh);
  return mesh;
}

function addFastener(group, position, material, radius = 0.014) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.012, 8), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.z = Math.PI / 2;
  mesh.renderOrder = 1000 + group.children.length;
  group.add(mesh);
  return mesh;
}

function addRail(group, position, length, material) {
  const rail = addBox(group, [0.07, 0.018, length], position, material);
  for (let index = 0; index < Math.max(2, Math.floor(length / 0.065)); index += 1) {
    const z = position[2] - length / 2 + 0.035 + index * 0.065;
    addBox(group, [0.082, 0.012, 0.018], [position[0], position[1] + 0.014, z], material);
  }
  return rail;
}

function weaponSurfaceTexture(base, fleck, scratch) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const random = seededRandom(base.length * 919 + fleck.length * 17 + scratch.length * 7);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);

  // Brushed tactical metal striations
  for (let y = 0; y < 128; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";
    ctx.fillRect(0, y, 128, 1.5);
  }

  for (let index = 0; index < 46; index += 1) {
    ctx.fillStyle = index % 3 === 0 ? fleck : "rgba(0, 0, 0, 0.16)";
    ctx.globalAlpha = 0.16 + random() * 0.24;
    ctx.beginPath();
    const x = random() * 128;
    const y = random() * 128;
    const radius = 3 + random() * 12;
    ctx.ellipse(x, y, radius, radius * (0.2 + random() * 0.4), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = scratch;
  ctx.lineWidth = 1;
  for (let index = 0; index < 18; index += 1) {
    const x = random() * 128;
    const y = random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4 + random() * 14, y + (random() - 0.5) * 2.5);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function weaponPalette(def) {
  const palettes = {
    ar4: { body: "#39423f", handguard: "#4a4638", fleck: "rgba(120, 128, 108, 0.4)", scratch: "rgba(210, 202, 180, 0.25)" },
    smg9: { body: "#263b3d", handguard: "#334c4b", fleck: "rgba(111, 188, 180, 0.28)", scratch: "rgba(172, 218, 202, 0.24)" },
    dmr7: { body: "#4b4640", handguard: "#5b5044", fleck: "rgba(193, 127, 94, 0.3)", scratch: "rgba(227, 191, 156, 0.24)" },
    p12: { body: "#4c514f", handguard: "#313532", fleck: "rgba(198, 204, 194, 0.32)", scratch: "rgba(232, 232, 215, 0.28)" },
    sr9: { body: "#5b5143", handguard: "#3e3831", fleck: "rgba(191, 143, 94, 0.32)", scratch: "rgba(241, 211, 168, 0.24)" },
    lmg6: { body: "#3b4538", handguard: "#4a513e", fleck: "rgba(143, 169, 115, 0.3)", scratch: "rgba(210, 220, 171, 0.22)" },
    sg12: { body: "#4c4037", handguard: "#5a4a3b", fleck: "rgba(208, 139, 85, 0.3)", scratch: "rgba(235, 195, 150, 0.22)" },
    br7: { body: "#35434b", handguard: "#3c4e56", fleck: "rgba(91, 143, 186, 0.32)", scratch: "rgba(189, 222, 239, 0.22)" },
    vpr5: { body: "#283f3e", handguard: "#2d514d", fleck: "rgba(89, 182, 177, 0.3)", scratch: "rgba(176, 235, 218, 0.22)" },
  };
  return palettes[def.id] ?? palettes.ar4;
}

function texturedMaterial(texture, roughness = 0.6, metalness = 0.3) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness,
    metalness,
    depthTest: false,
    depthWrite: false,
  });
}

function createAttachmentVisuals(group, def) {
  const nodes = {};
  const mountMaterial = makeMaterial(0x242b27, 0.5, 0.55);
  const accentMaterial = makeMaterial(def.accent, 0.38, 0.34);
  nodes["red-dot"] = addBox(group, [0.06, 0.04, 0.1], [0, 0.17, -0.08], accentMaterial);
  nodes["tactical-laser"] = addBox(group, [0.035, 0.035, 0.12], [0.075, 0.02, -0.58], accentMaterial);
  const laserBeamMaterial = new THREE.MeshBasicMaterial({
    color: 0x58e6d9,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  const laserBeam = addCylinder(group, 0.0022, 0.0022, 2.2, [0.075, 0.02, -1.72], laserBeamMaterial);
  laserBeam.visible = false;
  nodes["tactical-laser"].userData.beam = laserBeam;
  nodes["long-barrel"] = addCylinder(group, 0.024, 0.024, 0.28, [0, 0.025, -1.08], mountMaterial);
  nodes.suppressor = addCylinder(group, 0.042, 0.036, 0.22, [0, 0.025, -1.06], mountMaterial);
  nodes.compensator = addCylinder(group, 0.034, 0.028, 0.12, [0, 0.025, -1.02], accentMaterial);
  nodes["extended-mag"] = addBox(group, [0.074, 0.25, 0.11], [0, -0.19, -0.12], mountMaterial);
  nodes["fast-mag"] = addBox(group, [0.082, 0.025, 0.12], [0, -0.245, -0.12], accentMaterial);
  nodes["drum-mag"] = addCylinder(group, 0.11, 0.11, 0.12, [0, -0.19, -0.12], mountMaterial, [0, 0, 0]);
  nodes["vertical-grip"] = addBox(group, [0.04, 0.12, 0.055], [0, -0.08, -0.53], mountMaterial);
  nodes["angled-grip"] = addBox(group, [0.04, 0.12, 0.055], [0, -0.08, -0.53], mountMaterial, [-0.36, 0, 0]);
  nodes["light-stock"] = addBox(group, [0.06, 0.07, 0.16], [0, 0.02, 0.33], mountMaterial);
  Object.values(nodes).forEach((node) => {
    node.visible = false;
    node.renderOrder = 1100;
  });
  return nodes;
}

function syncAttachmentVisuals(view, def) {
  const ids = new Set(def.attachmentIds ?? []);
  for (const [id, node] of Object.entries(view.attachmentVisuals ?? {})) {
    node.visible = ids.has(id);
    if (node.userData?.beam) node.userData.beam.visible = ids.has(id);
  }
  if (view.parts?.barrel) view.parts.barrel.scale.y = ids.has("long-barrel") ? 1.18 : 1;
}

function applySkinToView(view, def, skinId = "standard") {
  if (!view?.materials) return;
  const skin = skinById(skinId);
  view.materials.body.color.setHex(skin.body ?? 0xffffff);
  view.materials.handguard.color.setHex(skin.furniture ?? 0xffffff);
  const accentHex = skin.accent ?? def.accent;
  view.materials.accent.color.setHex(accentHex);
  view.materials.accent.emissive.setHex(accentHex);
}

function createViewModel(def) {
  const group = new THREE.Group();
  const palette = weaponPalette(def);
  const bodyMaterial = texturedMaterial(weaponSurfaceTexture(palette.body, palette.fleck, palette.scratch), 0.55, 0.42);
  const darkMaterial = makeMaterial(0x1d211d, 0.68, 0.32);
  const metalMaterial = makeMaterial(0x2f3436, 0.4, 0.72);
  const handguardMaterial = texturedMaterial(weaponSurfaceTexture(palette.handguard, palette.fleck, palette.scratch), 0.82, 0.1);
  const gloveMaterial = makeMaterial(0x3a342b, 0.92, 0.04);
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: def.accent,
    emissive: def.accent,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.2,
    depthTest: false,
    depthWrite: false,
  });
  const lensMaterial = new THREE.MeshBasicMaterial({
    color: def.accent,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
  });
  const brassMaterial = makeMaterial(0xd8ad42, 0.25, 0.85);
  const tritiumMaterial = new THREE.MeshBasicMaterial({
    color: 0x58f58b,
    depthTest: false,
    depthWrite: false,
  });

  // Rear stock and buffer tube.
  const stock = addBox(group, [0.095, 0.105, 0.24], [0, 0.005, 0.31], handguardMaterial);
  addBox(group, [0.08, 0.035, 0.17], [0, 0.07, 0.31], darkMaterial);
  addCylinder(group, 0.03, 0.03, 0.2, [0, 0.035, 0.18], metalMaterial);
  // Crane stock cheek riser & adjustment lock
  addCylinder(group, 0.036, 0.036, 0.18, [0, 0.052, 0.31], handguardMaterial, [Math.PI / 2, 0, 0]);
  addBox(group, [0.024, 0.03, 0.075], [0, -0.042, 0.31], metalMaterial);
  // Ribbed rubber buttpad
  addBox(group, [0.094, 0.135, 0.025], [0, -0.005, 0.435], darkMaterial);
  for (let i = 0; i < 4; i += 1) {
    addBox(group, [0.082, 0.01, 0.008], [0, -0.05 + i * 0.03, 0.448], metalMaterial);
  }

  // Receiver group.
  const receiver = addBox(group, [0.1, 0.115, 0.46], [0, 0, -0.06], bodyMaterial);
  addBox(group, [0.095, 0.045, 0.4], [0, 0.075, -0.08], darkMaterial);
  addBox(group, [0.085, 0.055, 0.26], [0, -0.075, -0.02], darkMaterial);
  addBox(group, [0.075, 0.02, 0.16], [0, -0.085, -0.15], accentMaterial);
  addBox(group, [0.016, 0.06, 0.24], [0.064, 0.03, -0.02], darkMaterial);
  addBox(group, [0.018, 0.045, 0.16], [0.066, 0.03, -0.12], metalMaterial);
  addFastener(group, [0.064, 0.048, 0.12], metalMaterial, 0.012);
  addFastener(group, [-0.064, 0.048, 0.12], metalMaterial, 0.012);
  const bolt = addBox(group, [0.045, 0.035, 0.16], [0, 0.102, 0.08], metalMaterial);

  // Tactical receiver details: deflector, forward assist, selector lever, charging handle
  addBox(group, [0.025, 0.038, 0.055], [0.065, 0.035, 0.02], darkMaterial);
  addCylinder(group, 0.012, 0.016, 0.048, [0.068, 0.055, 0.09], metalMaterial, [0.35, 0.25, 0]);
  addCylinder(group, 0.012, 0.012, 0.015, [-0.055, -0.01, 0.06], metalMaterial, [0, 0, Math.PI / 2]);
  addBox(group, [0.012, 0.024, 0.008], [-0.056, 0.008, 0.06], metalMaterial, [0, 0, 0.35]);
  addBox(group, [0.008, 0.008, 0.008], [-0.058, 0.022, 0.06], accentMaterial);
  addBox(group, [0.075, 0.016, 0.045], [0, 0.096, 0.2], metalMaterial);
  addBox(group, [0.095, 0.018, 0.022], [0, 0.096, 0.22], darkMaterial);
  addRail(group, [0, 0.098, -0.06], 0.38, metalMaterial);

  // Handguard, rails, barrel.
  const handguard = addBox(group, [0.082, 0.075, 0.3], [0, 0.005, -0.44], handguardMaterial);
  addBox(group, [0.086, 0.012, 0.3], [0, 0.055, -0.44], metalMaterial);
  for (let rail = 0; rail < 4; rail += 1) {
    addBox(group, [0.09, 0.014, 0.026], [0, 0.062, -0.33 - rail * 0.075], metalMaterial);
  }
  addBox(group, [0.012, 0.05, 0.34], [0.052, 0.02, -0.44], metalMaterial);
  addBox(group, [0.012, 0.05, 0.34], [-0.052, 0.02, -0.44], metalMaterial);
  addRail(group, [0, 0.073, -0.43], 0.34, metalMaterial);
  addBox(group, [0.016, 0.07, 0.08], [0.063, 0.01, -0.42], darkMaterial);
  addBox(group, [0.016, 0.07, 0.08], [-0.063, 0.01, -0.42], darkMaterial);

  // M-LOK cooling slots along handguard
  for (let slot = 0; slot < 3; slot += 1) {
    addBox(group, [0.01, 0.02, 0.05], [0.046, 0.005, -0.34 - slot * 0.07], darkMaterial);
    addBox(group, [0.01, 0.02, 0.05], [-0.046, 0.005, -0.34 - slot * 0.07], darkMaterial);
  }

  const barrel = addCylinder(group, 0.018, 0.018, 0.42, [0, 0.025, -0.74], metalMaterial);
  const muzzleBrake = addCylinder(group, 0.03, 0.03, 0.085, [0, 0.025, -0.96], darkMaterial);
  addCylinder(group, 0.024, 0.026, 0.024, [0, 0.025, -1.014], metalMaterial);
  addBox(group, [0.046, 0.015, 0.042], [0, 0.025, -0.96], darkMaterial);

  // Grip, magazine, trigger guard.
  addBox(group, [0.055, 0.17, 0.09], [0, -0.13, 0.09], darkMaterial, [-0.22, 0, 0]);
  addBox(group, [0.07, 0.2, 0.105], [0, -0.145, -0.12], darkMaterial, [0.16, 0, 0]);
  addBox(group, [0.018, 0.018, 0.1], [0, -0.09, 0.01], metalMaterial);
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 6, 16, Math.PI), metalMaterial);
  triggerGuard.position.set(0, -0.085, -0.01);
  triggerGuard.rotation.x = Math.PI / 2;
  triggerGuard.scale.set(0.75, 1, 1.25);
  triggerGuard.renderOrder = 1000 + group.children.length;
  group.add(triggerGuard);
  addBox(group, [0.035, 0.025, 0.065], [0, -0.095, -0.02], darkMaterial);
  addBox(group, [0.085, 0.018, 0.045], [0, -0.25, -0.12], metalMaterial);

  // Magazine ribs & ammo witness window
  for (let magRib = 0; magRib < 5; magRib += 1) {
    addBox(group, [0.076, 0.012, 0.11], [0, -0.085 - magRib * 0.028, -0.12 + magRib * 0.006], darkMaterial);
  }
  addBox(group, [0.074, 0.08, 0.02], [0.036, -0.14, -0.11], darkMaterial);
  addBox(group, [0.074, 0.065, 0.014], [0.037, -0.14, -0.11], brassMaterial);

  // Optic.
  addBox(group, [0.05, 0.025, 0.14], [0, 0.105, -0.08], darkMaterial);
  const opticBody = addBox(group, [0.055, 0.055, 0.11], [0, 0.14, -0.08], darkMaterial);
  addBox(group, [0.07, 0.018, 0.16], [0, 0.102, -0.08], metalMaterial);
  // Holographic sun hood & adjustment dials
  addBox(group, [0.068, 0.068, 0.115], [0, 0.142, -0.08], darkMaterial);
  addCylinder(group, 0.012, 0.012, 0.022, [0.038, 0.142, -0.08], metalMaterial, [0, 0, Math.PI / 2]);
  addCylinder(group, 0.012, 0.012, 0.022, [0, 0.182, -0.08], metalMaterial, [0, 0, 0]);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), lensMaterial);
  lens.position.set(0, 0.14, -0.137);
  lens.renderOrder = 1000 + group.children.length;
  group.add(lens);

  const reticleRing = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.012, 16), lensMaterial);
  reticleRing.position.set(0, 0.14, -0.138);
  reticleRing.renderOrder = 1000 + group.children.length;
  group.add(reticleRing);

  const frontSight = addBox(group, [0.018, 0.05, 0.025], [0, 0.09, -0.66], metalMaterial);
  frontSight.visible = true;
  addBox(group, [0.02, 0.05, 0.02], [0, 0.09, -0.57], darkMaterial);
  const frontTritium = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), tritiumMaterial);
  frontTritium.position.set(0, 0.112, -0.66);
  frontTritium.renderOrder = 1000 + group.children.length;
  group.add(frontTritium);

  // Gloved tactical hands with knuckle armor and combat watch.
  addBox(group, [0.085, 0.075, 0.11], [0.022, -0.042, -0.44], gloveMaterial);
  addBox(group, [0.07, 0.09, 0.09], [0.02, -0.105, 0.055], gloveMaterial);
  addBox(group, [0.088, 0.034, 0.08], [0.022, -0.018, -0.44], darkMaterial);
  addBox(group, [0.075, 0.03, 0.07], [0.02, -0.09, 0.055], darkMaterial);
  addBox(group, [0.082, 0.032, 0.055], [0.022, -0.078, -0.38], metalMaterial);
  addBox(group, [0.042, 0.012, 0.034], [0.022, -0.062, -0.38], accentMaterial);

  const viewLight = new THREE.PointLight(0xffd9a8, 1.7, 4.2, 2);
  viewLight.position.set(0.35, 0.35, 0.55);
  group.add(viewLight);

  // Cool fill from the left shapes the silhouette so the model stops reading as a flat black box.
  const fillLight = new THREE.PointLight(0xa8b4bd, 0.32, 3.4, 2);
  fillLight.position.set(-0.45, 0.1, -0.25);
  group.add(fillLight);

  if (def.id === "dmr7") {
    barrel.scale.y = 1.35;
    barrel.position.z = -0.82;
    handguard.scale.z = 1.22;
    handguard.position.z = -0.48;
    addBox(group, [0.065, 0.065, 0.2], [0, 0.17, -0.08], darkMaterial);
    addCylinder(group, 0.045, 0.045, 0.26, [0, 0.18, -0.1], darkMaterial);
    // Folding tactical bipod
    addBox(group, [0.08, 0.03, 0.06], [0, -0.055, -0.55], metalMaterial);
    addBox(group, [0.02, 0.02, 0.22], [-0.035, -0.07, -0.44], darkMaterial);
    addBox(group, [0.02, 0.02, 0.22], [0.035, -0.07, -0.44], darkMaterial);
    group.scale.setScalar(0.7);
  } else if (def.id === "smg9") {
    stock.visible = false;
    barrel.scale.y = 0.62;
    barrel.position.z = -0.62;
    handguard.scale.z = 0.72;
    handguard.position.z = -0.33;
    // Collapsible wire stock
    addBox(group, [0.015, 0.015, 0.32], [-0.052, 0.02, 0.18], metalMaterial);
    addBox(group, [0.015, 0.015, 0.32], [0.052, 0.02, 0.18], metalMaterial);
    addBox(group, [0.09, 0.08, 0.018], [0, 0.02, 0.34], darkMaterial);
    group.scale.setScalar(0.62);
  } else if (def.id === "p12") {
    stock.visible = false;
    handguard.visible = false;
    barrel.scale.y = 0.55;
    barrel.position.z = -0.52;
    receiver.scale.z = 0.72;
    // Slide cocking serrations
    for (let i = 0; i < 4; i += 1) {
      addBox(group, [0.104, 0.03, 0.01], [0, 0.035, 0.02 - i * 0.025], metalMaterial);
    }
    // Underbarrel rail flashlight
    addBox(group, [0.045, 0.035, 0.12], [0, -0.05, -0.16], darkMaterial);
    addCylinder(group, 0.015, 0.015, 0.02, [0, -0.05, -0.22], metalMaterial);
    group.scale.setScalar(0.52);
  } else if (def.id === "sr9") {
    barrel.scale.y = 1.5;
    barrel.position.z = -0.9;
    handguard.scale.z = 1.3;
    handguard.position.z = -0.5;
    addBox(group, [0.055, 0.06, 0.28], [0, 0.19, -0.1], darkMaterial);
    addCylinder(group, 0.045, 0.045, 0.3, [0, 0.2, -0.13], darkMaterial);
    addCylinder(group, 0.022, 0.022, 0.14, [0, 0.03, -1.02], metalMaterial);
    // Large 50mm sniper scope bell & sunshade
    addCylinder(group, 0.038, 0.048, 0.14, [0, 0.2, -0.25], darkMaterial);
    addCylinder(group, 0.036, 0.036, 0.08, [0, 0.2, 0.02], darkMaterial);
    // Bolt handle with knurled knob
    addBox(group, [0.045, 0.012, 0.015], [0.075, 0.08, 0.06], metalMaterial);
    addSphere(group, 0.016, [0.1, 0.07, 0.06], metalMaterial);
    // Massive dual-chamber tank muzzle brake
    addBox(group, [0.07, 0.035, 0.08], [0, 0.03, -1.05], darkMaterial);
    group.scale.setScalar(0.66);
  } else if (def.id === "lmg6") {
    barrel.scale.y = 1.1;
    barrel.position.z = -0.78;
    addBox(group, [0.16, 0.18, 0.24], [0, -0.17, -0.16], darkMaterial);
    addBox(group, [0.1, 0.1, 0.5], [0, -0.05, -0.5], metalMaterial);
    // Heavy carry handle
    addBox(group, [0.018, 0.08, 0.02], [0.03, 0.14, -0.2], metalMaterial);
    addBox(group, [0.018, 0.02, 0.16], [0.03, 0.18, -0.12], darkMaterial);
    addBox(group, [0.018, 0.08, 0.02], [0.03, 0.14, -0.04], metalMaterial);
    // Ammo feed belt
    addBox(group, [0.08, 0.025, 0.05], [0.07, -0.09, -0.14], brassMaterial);
    group.scale.setScalar(0.62);
  } else if (def.id === "sg12") {
    stock.visible = false;
    barrel.scale.set(1.65, 0.86, 1.65);
    barrel.position.z = -0.69;
    handguard.scale.set(1.28, 0.9, 0.9);
    handguard.position.z = -0.4;
    addBox(group, [0.1, 0.12, 0.32], [0, -0.08, -0.52], darkMaterial);
    // Extended tubular magazine
    addCylinder(group, 0.022, 0.022, 0.44, [0, -0.02, -0.72], metalMaterial);
    // Heat shield ventilation ports
    for (let i = 0; i < 4; i += 1) {
      addBox(group, [0.075, 0.01, 0.02], [0, 0.048, -0.48 - i * 0.06], darkMaterial);
    }
    group.scale.setScalar(0.66);
  } else if (def.id === "br7") {
    barrel.scale.y = 1.16;
    barrel.position.z = -0.8;
    handguard.scale.z = 1.12;
    handguard.position.z = -0.47;
    addBox(group, [0.07, 0.07, 0.22], [0, 0.17, -0.08], darkMaterial);
    addCylinder(group, 0.04, 0.04, 0.24, [0, 0.18, -0.1], darkMaterial);
    // Waffle magazine ridges
    for (let i = 0; i < 4; i += 1) {
      addBox(group, [0.076, 0.012, 0.09], [0, -0.12 - i * 0.032, -0.12], darkMaterial);
    }
    group.scale.setScalar(0.66);
  } else if (def.id === "vpr5") {
    stock.visible = false;
    barrel.scale.y = 0.5;
    barrel.position.z = -0.5;
    handguard.scale.z = 0.58;
    handguard.position.z = -0.28;
    receiver.scale.z = 0.82;
    addBox(group, [0.08, 0.23, 0.12], [0, -0.17, -0.12], darkMaterial);
    // Front magwell grip
    addBox(group, [0.065, 0.11, 0.06], [0, -0.11, -0.24], darkMaterial);
    group.scale.setScalar(0.54);
  } else {
    group.scale.setScalar(0.6);
  }

  const attachmentVisuals = createAttachmentVisuals(group, def);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.03, -0.99);
  group.add(muzzle);

  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd08a,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  // Crossed quads: a single plane disappears edge-on and was invisible in gameplay shots.
  const flash = new THREE.Group();
  const flashA = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), flashMaterial);
  const flashB = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), flashMaterial.clone());
  flashB.rotation.y = Math.PI / 2;
  const flashC = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), flashMaterial.clone());
  flashC.rotation.x = Math.PI / 2;
  flashA.renderOrder = 1000;
  flashB.renderOrder = 1000;
  flashC.renderOrder = 1000;
  flash.add(flashA, flashB, flashC);
  flash.position.copy(muzzle.position);
  flash.visible = false;
  group.add(flash);

  const light = new THREE.PointLight(0xffc27a, 0, 8, 2);
  light.position.copy(muzzle.position);
  group.add(light);

  group.position.set(0.35, -0.29, -0.82);
  group.rotation.set(0.02, -0.06, 0);
  group.visible = false;
  const view = {
    group,
    muzzle,
    flash,
    light,
    flashMaterial,
    opticBody,
    scopeAnchor: lens,
    materials: { body: bodyMaterial, handguard: handguardMaterial, accent: accentMaterial },
    parts: { barrel, receiver, handguard, stock, bolt, muzzleBrake, frontSight },
    ejection: new THREE.Object3D(),
    attachmentVisuals,
  };
  view.ejection.position.set(0.085, 0.025, -0.02);
  group.add(view.ejection);
  syncAttachmentVisuals(view, def);
  return view;
}

export class WeaponSystem {
  constructor({ scene, camera, player, world, enemies, audio, callbacks = {}, profile = null }) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.world = world;
    this.enemies = enemies;
    this.audio = audio;
    this.callbacks = callbacks;
    this.profile = profile;
    this.raycaster = new THREE.Raycaster();
    this.states = WEAPON_DEFS.map((baseDef) => {
      const attachmentIds = getLoadoutIds(profile, baseDef.id);
      const def = applyAttachments(baseDef, attachmentIds);
      return {
        baseDef,
        def,
        attachmentIds,
        ammo: def.mag,
        reserve: def.reserve,
        reloading: false,
        reloadEnd: 0,
        nextFire: 0,
        bloom: 0,
        boltTimer: 0,
        view: createViewModel(def),
      };
    });
    this.currentIndex = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.currentWeapon = this.states[0].def;
    this.viewRoot = new THREE.Group();
    this.camera.add(this.viewRoot);
    for (const state of this.states) {
      this.viewRoot.add(state.view.group);
    }
    this.states[0].view.group.visible = true;
    this.recoilOffset = 0;
    this.swayX = 0;
    this.swayY = 0;

    this.tracers = [];
    this.tracerGeometry = new THREE.BufferGeometry();
    this.tracerGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const tracerMaterial = new THREE.LineBasicMaterial({
      color: 0xffd39a,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let index = 0; index < 18; index += 1) {
      const material = tracerMaterial.clone();
      const line = new THREE.Line(this.tracerGeometry.clone(), material);
      line.visible = false;
      line.frustumCulled = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0, maxLife: 0.09 });
    }

    this.sparks = [];
    const sparkGeometry = new THREE.BoxGeometry(0.035, 0.035, 0.035);
    for (let index = 0; index < 36; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffc47a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(sparkGeometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.sparks.push({ mesh, velocity: new THREE.Vector3(), life: 0, maxLife: 0.3 });
    }
    this.sparkIndex = 0;

    this.casings = [];
    const casingGeometry = new THREE.CylinderGeometry(0.006, 0.006, 0.028, 8);
    for (let index = 0; index < 24; index += 1) {
      const casing = new THREE.Mesh(
        casingGeometry,
        new THREE.MeshStandardMaterial({ color: 0xc6954d, roughness: 0.34, metalness: 0.72 }),
      );
      casing.visible = false;
      casing.frustumCulled = false;
      this.scene.add(casing);
      this.casings.push({ mesh: casing, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0, maxLife: 1.6 });
    }
    this.casingIndex = 0;
    this.meleeTimer = 0;
    this.nextMelee = 0;
    this.applyLoadout(profile);
  }

  get currentState() {
    return this.states[this.currentIndex];
  }

  applyLoadout(profile) {
    this.profile = profile;
    const equippedSkin = profile?.equippedSkin ?? "standard";
    for (const state of this.states) {
      const ids = getLoadoutIds(profile, state.baseDef.id);
      const ammoRatio = state.def.mag > 0 ? state.ammo / state.def.mag : 1;
      state.attachmentIds = ids;
      state.def = applyAttachments(state.baseDef, ids);
      state.ammo = Math.min(state.def.mag, Math.max(0, Math.round(state.def.mag * ammoRatio)));
      state.reserve = Math.max(state.ammo, state.def.reserve);
      syncAttachmentVisuals(state.view, state.def);
      applySkinToView(state.view, state.baseDef, equippedSkin);
    }
    this.currentWeapon = this.currentState.def;
    if (this.callbacks.onWeaponChange) this.callbacks.onWeaponChange(this.getHudState());
  }

  equipAttachmentOnCurrent(attachmentId) {
    const state = this.currentState;
    if (!state || !attachmentId) return false;
    state.attachmentIds = [...state.attachmentIds, attachmentId];
    state.def = applyAttachments(state.baseDef, state.attachmentIds);
    state.attachmentIds = [...state.def.attachmentIds];
    state.ammo = Math.min(state.def.mag, state.ammo);
    state.reserve = Math.max(state.ammo, state.reserve);
    syncAttachmentVisuals(state.view, state.def);
    this.currentWeapon = state.def;
    if (this.callbacks.onWeaponChange) this.callbacks.onWeaponChange(this.getHudState());
    return true;
  }

  get accuracy() {
    return this.shotsFired ? this.shotsHit / this.shotsFired : 0;
  }

  setVisible(visible) {
    this.viewRoot.visible = visible;
  }

  switchTo(index, now = performance.now() / 1000) {
    if (index < 0 || index >= this.states.length || index === this.currentIndex) return;
    if (this.currentState.reloading) {
      this.currentState.reloading = false;
      this.audio?.cancelReload?.();
    }
    this.currentState.view.group.visible = false;
    this.currentIndex = index;
    this.currentWeapon = this.currentState.def;
    this.currentState.view.group.visible = true;
    this.currentState.nextFire = now + (this.currentState.def.swapTime ?? 0.22);
    this.recoilOffset = 0;
    if (this.callbacks.onWeaponChange) this.callbacks.onWeaponChange(this.getHudState());
  }

  cycle(direction) {
    const next = (this.currentIndex + direction + this.states.length) % this.states.length;
    this.switchTo(next);
  }

  startReload(now = performance.now() / 1000) {
    const state = this.currentState;
    if (state.reloading || state.ammo >= state.def.mag || state.reserve <= 0) return false;
    state.reloading = true;
    state.reloadEnd = now + state.def.reloadTime;
    if (this.audio) this.audio.reload(state.def.reloadTime);
    if (this.callbacks.onReload) this.callbacks.onReload(this.getHudState());
    return true;
  }

  finishReload() {
    const state = this.currentState;
    const needed = state.def.mag - state.ammo;
    const loaded = Math.min(needed, state.reserve);
    state.ammo += loaded;
    state.reserve -= loaded;
    state.reloading = false;
    if (this.callbacks.onWeaponChange) this.callbacks.onWeaponChange(this.getHudState());
  }

  tryMelee(now = performance.now() / 1000) {
    if (this.player.dead || now < this.nextMelee) return false;
    if (this.currentState.reloading) {
      this.currentState.reloading = false;
      this.audio?.cancelReload?.();
    }
    this.nextMelee = now + 0.46;
    this.meleeTimer = 0.26;
    this.audio?.melee?.();

    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const enemyMeshes = this.enemies?.getHitMeshes?.() ?? [];
    this.raycaster.set(origin, direction);
    this.raycaster.far = 2.75;
    const hits = this.raycaster.intersectObjects([...enemyMeshes, ...this.world.shootables], false);
    let hitEnemy = null;
    let hitPoint = origin.clone().addScaledVector(direction, 1.8);
    let isHead = false;

    if (hits.length && hits[0].object.userData.enemy) {
      hitEnemy = hits[0].object.userData.enemy;
      hitPoint = hits[0].point.clone();
      isHead = hits[0].object.userData.part === "head";
    } else {
      // Wide close-quarters melee arc fallback within 2.3m
      let closest = 2.35;
      for (const enemy of this.enemies?.getActiveEnemies?.() ?? []) {
        if (enemy.dead || enemy.team === "ally") continue;
        const target = new THREE.Vector3(enemy.position.x, enemy.position.y + 1.1, enemy.position.z);
        const toEnemy = target.clone().sub(origin);
        const dist = toEnemy.length();
        if (dist > closest) continue;
        if (toEnemy.normalize().dot(direction) < 0.62) continue;
        if (!this.world.hasClearSegment(origin, target)) continue;
        closest = dist;
        hitEnemy = enemy;
        hitPoint = target;
      }
    }

    if (hitEnemy) {
      const damage = isHead ? 115 : 72;
      const result = this.enemies.damage(hitEnemy, damage, isHead, hitPoint, "melee");
      this.spawnSparks(hitPoint, 0xffd08a, 7);
      this.audio?.hit?.(isHead);
      this.callbacks.onHit?.({ enemy: hitEnemy, damage, headshot: isHead, point: hitPoint, killed: result.killed, source: "melee" });
    } else if (hits.length) {
      this.spawnSparks(hits[0].point, 0xffd6a0, 4);
      this.audio?.impact?.();
    }
    if (this.callbacks.onShot && !hitEnemy) {
      // Allow MP melee check at short range
      this.callbacks.onMelee?.({ origin: origin.clone(), direction: direction.clone(), damage: 72 });
    } else {
      this.callbacks.onMelee?.({ origin: origin.clone(), direction: direction.clone(), damage: 72 });
    }
    return true;
  }

  firePellet(state, spread, origin) {
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    direction.x += randRange(-spread, spread);
    direction.y += randRange(-spread, spread);
    direction.z += randRange(-spread, spread) * 0.25;
    direction.normalize();

    const enemyMeshes = this.enemies?.getHitMeshes?.() ?? [];
    this.raycaster.set(origin, direction);
    this.raycaster.far = 140;
    const hits = this.raycaster.intersectObjects([...enemyMeshes, ...this.world.shootables], false);
    let endPoint = origin.clone().addScaledVector(direction, 90);
    let hitEnemy = false;
    let hitSurface = false;
    let hitData = null;

    if (hits.length) {
      const hit = hits[0];
      endPoint = hit.point.clone();
      if (hit.object.userData.enemy) {
        const enemy = hit.object.userData.enemy;
        const part = hit.object.userData.part ?? "body";
        const multiplier = part === "head" ? state.def.headshot : part === "limb" ? 0.78 : 1;
        const falloff = damageFalloff(hit.distance, state.def.range[0], state.def.range[1], state.def.range[2]);
        const damage = state.def.damage * multiplier * falloff;
        const result = this.enemies.damage(enemy, damage, part === "head", endPoint);
        this.spawnSparks(endPoint, part === "head" ? 0xd95b45 : 0xffc47a, state.def.pellets ? 3 : 6);
        hitData = { enemy, damage, headshot: part === "head", point: endPoint, killed: result.killed };
        hitEnemy = true;
      } else {
        this.spawnSparks(endPoint, 0xffd6a0, state.def.pellets ? 2 : 3);
        const normal = hit.face
          ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
          : direction.clone().negate();
        this.world.addImpactDecal(endPoint, normal, 0x8e6244);
        hitSurface = true;
      }
    }

    return { endPoint, hitEnemy, hitSurface, hitData, direction };
  }

  tryFire(now = performance.now() / 1000) {
    const state = this.currentState;
    if (state.reloading || this.player.dead) return false;
    if (now < state.nextFire) return false;
    if (state.ammo <= 0) {
      if (this.audio) this.audio.empty();
      state.nextFire = now + 0.25;
      this.startReload(now);
      return false;
    }

    state.ammo -= 1;
    state.nextFire = now + 60 / state.def.rpm;
    this.shotsFired += 1;

    const bloomPenalty = state.bloom * (this.player.ads > 0.4 ? 0.0045 : 0.012);
    const crouchBonus = this.player.crouching ? 0.78 : 1;
    const spread =
      ((this.player.ads > 0.4 ? state.def.adsSpread : state.def.spread) + bloomPenalty + this.player.speedRatio * 0.011) *
      crouchBonus;
    state.bloom = Math.min(1, state.bloom + 0.32);

    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const pelletCount = Math.min(12, Math.max(1, Math.round(state.def.pellets ?? 1)));
    const pelletSpread = pelletCount > 1 ? spread * 0.85 : spread;
    let landedEnemyHit = false;
    let landedSurfaceHit = false;
    for (let pellet = 0; pellet < pelletCount; pellet += 1) {
      const result = this.firePellet(state, pelletSpread, origin);
      landedEnemyHit = landedEnemyHit || result.hitEnemy;
      landedSurfaceHit = landedSurfaceHit || result.hitSurface;
      if (result.hitData) {
        if (this.callbacks.onHit) this.callbacks.onHit(result.hitData);
        if (this.audio) this.audio.hit(result.hitData.headshot);
      } else if (result.hitSurface && this.audio && pellet === 0) {
        this.audio.impact();
      }
      const muzzlePosition = state.view.muzzle.getWorldPosition(new THREE.Vector3());
      this.spawnTracer(muzzlePosition, result.endPoint);
    }
    if (landedEnemyHit) this.shotsHit += 1;

    const recoilScale = (this.player.ads > 0.5 ? 0.62 : 1) * (this.player.crouching ? 0.82 : 1);
    this.player.addRecoil(state.def.recoilPitch * recoilScale, randRange(-state.def.recoilYaw, state.def.recoilYaw));
    this.recoilOffset = Math.min(0.12, this.recoilOffset + 0.045);
    if (!state.def.suppressed) {
      state.view.flash.visible = true;
      state.view.flash.rotation.z = Math.random() * Math.PI;
      state.view.flash.scale.setScalar(randRange(0.7, 1.2));
      state.view.light.intensity = 6;
      state.flashTimer = 0.055;
    }
    state.boltTimer = state.def.auto ? 0.06 : 0.11;
    this.spawnCasing(state);
    if (this.audio) this.audio.shot(state.def.id, Boolean(state.def.suppressed));
    if (this.callbacks.onShot) {
      this.callbacks.onShot({
        weapon: state.def,
        hit: landedEnemyHit,
        surfaceHit: landedSurfaceHit,
        pellets: pelletCount,
        spread: pelletSpread,
        origin: origin.clone(),
        direction: this.camera.getWorldDirection(new THREE.Vector3()),
      });
    }

    return true;
  }

  spawnTracer(start, end) {
    const tracer = this.tracers.find((item) => item.life <= 0) ?? this.tracers[0];
    const positions = tracer.line.geometry.attributes.position.array;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const distance = Math.hypot(dx, dy, dz) || 1;
    // A full muzzle-to-impact line reads as a screen-wide artifact on camera.
    // Draw a short streak instead and let the fade do the work.
    const scale = Math.min(distance, 6.5) / distance;
    positions[0] = start.x;
    positions[1] = start.y;
    positions[2] = start.z;
    positions[3] = start.x + dx * scale;
    positions[4] = start.y + dy * scale;
    positions[5] = start.z + dz * scale;
    tracer.line.geometry.attributes.position.needsUpdate = true;
    tracer.line.material.opacity = 0.9;
    tracer.line.visible = true;
    tracer.life = tracer.maxLife;
  }

  spawnSparks(point, color, count) {
    for (let index = 0; index < count; index += 1) {
      const spark = this.sparks[this.sparkIndex];
      this.sparkIndex = (this.sparkIndex + 1) % this.sparks.length;
      spark.mesh.position.copy(point);
      spark.mesh.material.color.setHex(color);
      spark.mesh.material.opacity = 0.95;
      spark.mesh.visible = true;
      spark.velocity.set(randRange(-2.2, 2.2), randRange(0.8, 3.2), randRange(-2.2, 2.2));
      spark.life = spark.maxLife;
    }
  }

  spawnCasing(state) {
    const casing = this.casings[this.casingIndex];
    this.casingIndex = (this.casingIndex + 1) % this.casings.length;
    const origin = state.view.ejection.getWorldPosition(new THREE.Vector3());
    casing.mesh.position.copy(origin);
    casing.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    casing.mesh.visible = true;
    casing.velocity.set(randRange(0.55, 1.25), randRange(0.7, 1.5), randRange(-0.35, 0.35));
    casing.velocity.applyQuaternion(this.camera.quaternion);
    casing.spin.set(randRange(-10, 10), randRange(-10, 10), randRange(-10, 10));
    casing.life = casing.maxLife;
  }

  update(dt, now) {
    const state = this.currentState;
    if (state.reloading && now >= state.reloadEnd) this.finishReload();

    state.bloom = Math.max(0, state.bloom - dt * 2.4);
    state.flashTimer = Math.max(0, (state.flashTimer ?? 0) - dt);
    state.view.flash.visible = state.flashTimer > 0;
    state.view.light.intensity = state.flashTimer > 0 ? 6 : 0;
    state.boltTimer = Math.max(0, (state.boltTimer ?? 0) - dt);
    if (state.view.parts?.bolt) {
      const boltOffset = state.boltTimer > 0 ? -0.06 * Math.sin((state.boltTimer / 0.11) * Math.PI) : 0;
      state.view.parts.bolt.position.z = 0.08 + boltOffset;
    }

    this.recoilOffset = Math.max(0, this.recoilOffset - dt * 0.8);
    this.meleeTimer = Math.max(0, (this.meleeTimer ?? 0) - dt);
    const meleeArc = this.meleeTimer > 0 ? Math.sin((this.meleeTimer / 0.26) * Math.PI) : 0;

    // Mouse look inertia sway (gun lags when turning camera)
    const currentYaw = this.player.yaw;
    const currentPitch = this.player.pitch;
    if (this.lastPlayerYaw === undefined) {
      this.lastPlayerYaw = currentYaw;
      this.lastPlayerPitch = currentPitch;
      this.lookSwayYaw = 0;
      this.lookSwayPitch = 0;
      this.sprintWeight = 0;
      this.slideWeight = 0;
    }
    const deltaYaw = currentYaw - this.lastPlayerYaw;
    const deltaPitch = currentPitch - this.lastPlayerPitch;
    this.lastPlayerYaw = currentYaw;
    this.lastPlayerPitch = currentPitch;

    this.lookSwayYaw = THREE.MathUtils.damp(this.lookSwayYaw, clamp(deltaYaw * 2.4, -0.05, 0.05), 10, dt);
    this.lookSwayPitch = THREE.MathUtils.damp(this.lookSwayPitch, clamp(deltaPitch * 2.4, -0.05, 0.05), 10, dt);

    // Sprint & Slide target weights
    const isSprinting = Boolean(this.player.sprinting) && !state.reloading && this.player.ads < 0.2;
    this.sprintWeight = THREE.MathUtils.damp(this.sprintWeight, isSprinting ? 1 : 0, 7.5, dt);

    const isSliding = Boolean(this.player.sliding);
    this.slideWeight = THREE.MathUtils.damp(this.slideWeight, isSliding ? 1 : 0, 9.0, dt);

    // Natural breathing when idle or moving slowly
    const idleFactor = (1 - clamp(this.player.speedRatio ?? 0, 0, 1)) * (this.player.ads > 0.5 ? 0.15 : 1.0);
    const breathX = Math.sin(now * 1.6) * 0.0035 * idleFactor;
    const breathY = Math.sin(now * 3.2) * 0.0025 * idleFactor;
    const breathRoll = Math.cos(now * 1.6) * 0.004 * idleFactor;

    // Tactical Sprint Pose: lowered and tilted diagonally across body like modern AAA games
    const sprintBob = Math.sin(this.player.bobTime * 2.2);
    const sprintBounce = Math.abs(Math.cos(this.player.bobTime * 2.2));
    const sprintOffsetX = (0.07 + sprintBob * 0.022) * this.sprintWeight;
    const sprintOffsetY = (-0.11 + sprintBounce * 0.02) * this.sprintWeight;
    const sprintOffsetZ = (0.06 - sprintBounce * 0.015) * this.sprintWeight;
    const sprintRotX = -0.34 * this.sprintWeight;
    const sprintRotY = 0.38 * this.sprintWeight;
    const sprintRotZ = (-0.26 + sprintBob * 0.08) * this.sprintWeight;

    // Slide Pose: tilted sideways aggressively
    const slideOffsetX = -0.04 * this.slideWeight;
    const slideOffsetY = -0.08 * this.slideWeight;
    const slideRotZ = -0.36 * this.slideWeight;

    // Movement Bobbing
    const walkBobX = Math.sin(this.player.bobTime * 2.1) * 0.012 * this.player.bobAmount * (1 - this.sprintWeight * 0.8);
    const walkBobY = Math.abs(Math.cos(this.player.bobTime * 2.1)) * -0.01 * this.player.bobAmount * (1 - this.sprintWeight * 0.8);
    const walkRoll = Math.sin(this.player.bobTime * 2.1) * 0.018 * this.player.bobAmount * (1 - this.sprintWeight * 0.8);

    const moveX = this.player.velocity.x * 0.0015;
    const moveY = this.player.velocity.z * 0.0015;
    this.swayX = THREE.MathUtils.damp(this.swayX, moveX, 6, dt);
    this.swayY = THREE.MathUtils.damp(this.swayY, moveY, 6, dt);
    const view = state.view.group;
    const portrait = window.innerHeight > window.innerWidth;
    const baseX = portrait ? 0.2 : 0.35;
    const baseY = portrait ? -0.27 : -0.29;
    const reloadProgress = state.reloading
      ? Math.min(1, Math.max(0, 1 - (state.reloadEnd - now) / state.def.reloadTime))
      : 0;
    // One smooth arc per reload: the weapon dips, tilts and comes back.
    const reloadArc = state.reloading ? Math.sin(reloadProgress * Math.PI) : 0;
    const crouchDrop = this.player.crouching ? 0.04 : 0;

    const isAds = this.player.ads > 0.5;
    const targetX = isAds
      ? 0
      : (baseX + this.swayX + this.lookSwayYaw + breathX + walkBobX + sprintOffsetX + slideOffsetX - meleeArc * 0.16);
    const targetY = isAds
      ? -0.18
      : (baseY + this.swayY - this.lookSwayPitch + breathY + walkBobY - reloadArc * 0.14 - crouchDrop + sprintOffsetY + slideOffsetY + meleeArc * 0.06);
    const targetZ = -0.82 + this.recoilOffset + sprintOffsetZ - meleeArc * 0.34;

    const targetRotX = isAds
      ? (this.recoilOffset * 0.5)
      : (this.recoilOffset * 0.6 + reloadArc * 0.25 + sprintRotX - this.lookSwayPitch * 0.5 - meleeArc * 0.32);
    const targetRotY = isAds ? 0 : (sprintRotY + this.lookSwayYaw * 0.8);
    const targetRotZ = isAds ? 0 : (reloadArc * 0.5 + breathRoll + walkRoll + sprintRotZ + slideRotZ + meleeArc * 0.38);

    view.position.x = THREE.MathUtils.damp(view.position.x, targetX, 14, dt);
    view.position.y = THREE.MathUtils.damp(view.position.y, targetY, 14, dt);
    view.position.z = THREE.MathUtils.damp(view.position.z, targetZ, 18, dt);
    view.rotation.x = THREE.MathUtils.damp(view.rotation.x, targetRotX, 14, dt);
    view.rotation.y = THREE.MathUtils.damp(view.rotation.y, targetRotY, 12, dt);
    view.rotation.z = THREE.MathUtils.damp(view.rotation.z, targetRotZ, 12, dt);

    for (const tracer of this.tracers) {
      if (tracer.life <= 0) continue;
      tracer.life -= dt;
      tracer.line.material.opacity = Math.max(0, tracer.life / tracer.maxLife) * 0.9;
      if (tracer.life <= 0) tracer.line.visible = false;
    }

    for (const spark of this.sparks) {
      if (spark.life <= 0) continue;
      spark.life -= dt;
      spark.velocity.y -= 8 * dt;
      spark.mesh.position.addScaledVector(spark.velocity, dt);
      spark.mesh.material.opacity = Math.max(0, spark.life / spark.maxLife);
      if (spark.life <= 0) spark.mesh.visible = false;
    }

    for (const casing of this.casings) {
      if (casing.life <= 0) continue;
      casing.life -= dt;
      casing.velocity.y -= 10.5 * dt;
      casing.mesh.position.addScaledVector(casing.velocity, dt);
      casing.mesh.rotation.x += casing.spin.x * dt;
      casing.mesh.rotation.y += casing.spin.y * dt;
      casing.mesh.rotation.z += casing.spin.z * dt;
      if (casing.mesh.position.y < 0.035) {
        casing.mesh.position.y = 0.035;
        casing.velocity.y = Math.abs(casing.velocity.y) * 0.22;
        casing.velocity.x *= 0.72;
        casing.velocity.z *= 0.72;
        casing.spin.multiplyScalar(0.82);
      }
      if (casing.life <= 0) casing.mesh.visible = false;
    }
  }

  getHudState() {
    const state = this.currentState;
    const reloadProgress = state.reloading
      ? clamp(1 - (state.reloadEnd - performance.now() / 1000) / state.def.reloadTime, 0, 1)
      : 0;
    return {
      name: state.def.name,
      role: state.def.role,
      short: state.def.short,
      ammo: state.ammo,
      reserve: state.reserve,
      mag: state.def.mag,
      reloading: state.reloading,
      reloadProgress,
      index: this.currentIndex,
      total: this.states.length,
      bloom: state.bloom,
      ads: this.player.ads,
      zoom: state.def.zoom,
      opticStyle: state.attachmentIds.includes("red-dot") ? "red-dot" : state.def.visual?.opticStyle ?? "iron",
      attachmentIds: [...state.attachmentIds],
    };
  }

  reset() {
    for (let index = 0; index < this.states.length; index += 1) {
      const state = this.states[index];
      state.def = applyAttachments(state.baseDef, state.attachmentIds);
      state.ammo = state.def.mag;
      state.reserve = state.def.reserve;
      state.reloading = false;
      state.nextFire = 0;
      state.bloom = 0;
      state.boltTimer = 0;
      syncAttachmentVisuals(state.view, state.def);
      state.view.group.visible = index === 0;
    }
    this.currentIndex = 0;
    this.currentWeapon = this.states[0].def;
    this.shotsFired = 0;
    this.shotsHit = 0;
    for (const casing of this.casings) {
      casing.life = 0;
      casing.mesh.visible = false;
    }
    if (this.callbacks.onWeaponChange) this.callbacks.onWeaponChange(this.getHudState());
  }
}
