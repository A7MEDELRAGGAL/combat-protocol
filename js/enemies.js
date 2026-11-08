import * as THREE from "../vendor/three.module.js";
import { clamp, randRange, randInt } from "./utils.js";
import { ARCHETYPES, archetypeFor } from "./enemies-data.js";
export { ARCHETYPES, archetypeFor };

const ENEMY_HEIGHT = 1.78;
const ENEMY_RADIUS = 0.38;

// Four squad palettes keep a group readable at distance without extra textures.
// Armour stays dark; only the shoulder patch and visor glow carry the accent.
const SQUAD_PALETTES = [
  { uniform: 0x4a5449, vest: 0x2b322c, helmet: 0x20251f, accent: 0xd8a35a, skin: 0x9a7a5c },
  { uniform: 0x46505c, vest: 0x2a3038, helmet: 0x1d2228, accent: 0x7fb0b8, skin: 0x8f6f52 },
  { uniform: 0x615645, vest: 0x332f28, helmet: 0x26221c, accent: 0xd07a45, skin: 0xa2815f },
  { uniform: 0x4f5248, vest: 0x2d302a, helmet: 0x21241f, accent: 0xb85a4a, skin: 0x8a6a4e },
];

function material(color, roughness = 0.7, metalness = 0.15) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addPart(group, geometry, mat, position, part, enemy, rotation = null) {
  // Remember the designed emissive (visor/patrol accent) so a hit flash can restore it.
  if (mat.emissive && mat.userData.baseEmissive === undefined) {
    mat.userData.baseEmissive = mat.emissive.getHex();
  }
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.enemy = enemy;
  mesh.userData.part = part;
  group.add(mesh);
  return mesh;
}

// Merge rigid parts that share a parent into one vertex-coloured mesh.
// Limbs keep their joint hierarchy; only the meshes inside each link collapse.
function mergeColoredGeometry(meshes) {
  const prepared = meshes.map((mesh) => {
    mesh.updateMatrix();
    const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    source.applyMatrix4(mesh.matrix);
    return { source, color: mesh.material.color ?? new THREE.Color(0xffffff) };
  });
  const vertexCount = prepared.reduce((total, entry) => total + entry.source.attributes.position.count, 0);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  let offset = 0;
  for (const { source, color } of prepared) {
    const position = source.attributes.position;
    const normal = source.attributes.normal;
    for (let index = 0; index < position.count; index += 1) {
      positions[offset] = position.getX(index);
      positions[offset + 1] = position.getY(index);
      positions[offset + 2] = position.getZ(index);
      normals[offset] = normal.getX(index);
      normals[offset + 1] = normal.getY(index);
      normals[offset + 2] = normal.getZ(index);
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
      offset += 3;
    }
    source.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function createHealthBar() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 14;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false }),
  );
  sprite.scale.set(0.82, 0.09, 1);
  sprite.position.y = 2.05;
  return { canvas, context, texture, sprite };
}

function drawHealthBar(enemy) {
  const { context, canvas, texture } = enemy.healthBar;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(8, 10, 9, 0.88)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(238, 232, 214, 0.14)";
  context.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
  const ratio = clamp(enemy.health / enemy.maxHealth, 0, 1);
  context.fillStyle = ratio > 0.55 ? "#d8a35a" : ratio > 0.25 ? "#d17a45" : "#c64736";
  context.fillRect(3, 4, (canvas.width - 6) * ratio, canvas.height - 8);
  context.strokeStyle = "rgba(8, 10, 9, 0.9)";
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  texture.needsUpdate = true;
}

class Enemy {
  constructor(manager, index) {
    this.manager = manager;
    this.index = index;
    this.archetype = archetypeFor(index);
    this.maxHealth = this.archetype.health;
    this.health = this.maxHealth;
    this.lastSeenAt = -Infinity;
    this.lastKnown = new THREE.Vector3();
    this.lastShotAt = 0;
    this.rival = null;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.state = "patrol";
    this.dead = false;
    this.deadTimer = 0;
    this.respawnTimer = 0;
    this.nextShot = 0;
    this.patrolTarget = new THREE.Vector3();
    this.patrolTimer = 0;
    this.avoidTimer = 0;
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.legSwing = 0;
    this.hitFlash = 0;
    this.muzzleTimer = 0;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);
    manager.scene.add(this.group);

    const palette = SQUAD_PALETTES[index % SQUAD_PALETTES.length];
    this.materials = {
      uniform: material(palette.uniform),
      vest: material(palette.vest),
      helmet: material(palette.helmet, 0.55, 0.25),
      visor: new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.4,
      }),
      skin: material(palette.skin, 0.82, 0.02),
      gun: material(0x1b1d1a, 0.45, 0.55),
      accent: new THREE.MeshStandardMaterial({
        color: palette.accent,
        emissive: palette.accent,
        emissiveIntensity: 0.14,
        roughness: 0.55,
        metalness: 0.15,
      }),
      pouch: material(0x3a3f36, 0.82, 0.08),
      boots: material(0x14170f, 0.85, 0.05),
    };

    this.hitMeshes = [];
    const push = (mesh) => {
      this.hitMeshes.push(mesh);
      return mesh;
    };

    // Torso, plate carrier, belt, backpack, MOLLE strips, and pouches.
    push(addPart(this.group, new THREE.BoxGeometry(0.5, 0.62, 0.27), this.materials.uniform, [0, 1.12, 0], "body", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.58, 0.44, 0.35), this.materials.vest, [0, 1.19, 0], "body", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.56, 0.09, 0.33), this.materials.vest, [0, 0.88, 0], "body", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.36, 0.42, 0.18), this.materials.vest, [0, 1.2, 0.24], "body", this));

    // MOLLE webbing strips on chest
    for (let r = 0; r < 3; r += 1) {
      push(addPart(this.group, new THREE.BoxGeometry(0.48, 0.016, 0.02), this.materials.helmet, [0, 1.08 + r * 0.065, -0.18], "body", this));
    }

    // Magazine pouches with retention tabs
    for (const offset of [-0.17, 0, 0.17]) {
      push(addPart(this.group, new THREE.BoxGeometry(0.12, 0.15, 0.08), this.materials.pouch, [offset, 1.12, -0.2], "body", this));
      push(addPart(this.group, new THREE.BoxGeometry(0.04, 0.025, 0.03), this.materials.accent, [offset, 1.21, -0.21], "body", this));
    }

    // Tactical shoulder radio & antenna
    push(addPart(this.group, new THREE.BoxGeometry(0.08, 0.14, 0.08), this.materials.helmet, [-0.22, 1.34, 0.1], "body", this));
    push(addPart(this.group, new THREE.CylinderGeometry(0.005, 0.004, 0.45, 6), this.materials.gun, [-0.22, 1.62, 0.1], "body", this));

    // Tactical duty belt gear: combat knife & sidearm holster with pistol grip
    push(addPart(this.group, new THREE.BoxGeometry(0.04, 0.18, 0.03), this.materials.gun, [-0.26, 0.94, -0.14], "body", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.09, 0.16, 0.12), this.materials.helmet, [0.28, 0.84, 0], "body", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.05, 0.08, 0.14), this.materials.gun, [0.28, 0.89, -0.02], "body", this));

    push(addPart(this.group, new THREE.CylinderGeometry(0.07, 0.075, 0.1, 8), this.materials.skin, [0, 1.5, 0], "body", this));

    // Head: rounded skull under a domed ballistic helmet + dual NVG goggles + balaclava
    push(addPart(this.group, new THREE.SphereGeometry(0.125, 14, 10), this.materials.skin, [0, 1.66, 0], "head", this));
    const helmet = push(addPart(this.group, new THREE.SphereGeometry(0.155, 14, 10), this.materials.helmet, [0, 1.72, 0], "head", this));
    helmet.scale.set(1, 0.82, 1.05);

    // Helmet ARC accessory rails on both temples
    push(addPart(this.group, new THREE.BoxGeometry(0.022, 0.035, 0.17), this.materials.accent, [-0.15, 1.73, 0], "head", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.022, 0.035, 0.17), this.materials.accent, [0.15, 1.73, 0], "head", this));

    // Dual-tube Night Vision Goggles (NVG) with illuminated front lenses
    push(addPart(this.group, new THREE.CylinderGeometry(0.03, 0.034, 0.07, 8), this.materials.helmet, [-0.055, 1.73, -0.17], "head", this, [Math.PI / 2, 0, 0]));
    push(addPart(this.group, new THREE.CylinderGeometry(0.03, 0.034, 0.07, 8), this.materials.helmet, [0.055, 1.73, -0.17], "head", this, [Math.PI / 2, 0, 0]));
    push(addPart(this.group, new THREE.CircleGeometry(0.028, 8), this.materials.visor, [-0.055, 1.73, -0.207], "head", this));
    push(addPart(this.group, new THREE.CircleGeometry(0.028, 8), this.materials.visor, [0.055, 1.73, -0.207], "head", this));

    // Tactical armored visor
    push(addPart(this.group, new THREE.BoxGeometry(0.22, 0.05, 0.06), this.materials.visor, [0, 1.66, -0.13], "head", this));

    // Balaclava & respirator filter covering lower face
    push(addPart(this.group, new THREE.BoxGeometry(0.18, 0.12, 0.14), this.materials.vest, [0, 1.56, -0.06], "head", this));
    push(addPart(this.group, new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), this.materials.helmet, [0, 1.54, -0.14], "head", this, [Math.PI / 2, 0, 0]));

    // Tactical comms headset, ear cups and boom mic
    push(addPart(this.group, new THREE.SphereGeometry(0.048, 10, 8), this.materials.helmet, [-0.145, 1.64, 0.01], "head", this));
    push(addPart(this.group, new THREE.SphereGeometry(0.048, 10, 8), this.materials.helmet, [0.145, 1.64, 0.01], "head", this));
    push(addPart(this.group, new THREE.CylinderGeometry(0.004, 0.004, 0.14, 5), this.materials.gun, [-0.12, 1.58, -0.08], "head", this, [0.4, 0.3, 0]));

    // Shoulder plates in the accent colour: makes enemies readable against the arena
    const shoulderL = push(addPart(this.group, new THREE.SphereGeometry(0.11, 12, 8), this.materials.accent, [-0.33, 1.33, 0], "limb", this));
    const shoulderR = push(addPart(this.group, new THREE.SphereGeometry(0.11, 12, 8), this.materials.accent, [0.33, 1.33, 0], "limb", this));
    shoulderL.scale.set(1, 0.85, 1.1);
    shoulderR.scale.set(1, 0.85, 1.1);

    // Legs are two-segment chains: hip swing plus a knee with hard-shell kneepads & combat boots
    const makeLeg = (side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.17, 0.86, 0);
      this.group.add(hip);
      push(addPart(hip, new THREE.CylinderGeometry(0.095, 0.078, 0.4, 8), this.materials.uniform, [0, -0.2, 0], "limb", this));
      push(addPart(hip, new THREE.BoxGeometry(0.09, 0.16, 0.11), this.materials.pouch, [side * 0.1, -0.2, -0.01], "limb", this));
      const knee = new THREE.Group();
      knee.position.set(0, -0.4, 0);
      hip.add(knee);
      push(addPart(knee, new THREE.SphereGeometry(0.085, 10, 8), this.materials.pouch, [0, -0.02, -0.055], "limb", this));
      push(addPart(knee, new THREE.BoxGeometry(0.12, 0.12, 0.06), this.materials.helmet, [0, -0.02, -0.075], "limb", this));
      push(addPart(knee, new THREE.CylinderGeometry(0.075, 0.06, 0.36, 8), this.materials.uniform, [0, -0.18, 0], "limb", this));
      push(addPart(knee, new THREE.BoxGeometry(0.16, 0.11, 0.25), this.materials.boots, [0, -0.4, -0.04], "limb", this));
      push(addPart(knee, new THREE.BoxGeometry(0.17, 0.035, 0.26), this.materials.helmet, [0, -0.45, -0.04], "limb", this));
      return { hip, knee };
    };
    const leftLegRig = makeLeg(-1);
    const rightLegRig = makeLeg(1);
    this.leftLeg = leftLegRig.hip;
    this.leftKnee = leftLegRig.knee;
    this.rightLeg = rightLegRig.hip;
    this.rightKnee = rightLegRig.knee;

    // Arms with elbow pads & tactical armored gloves
    const makeArm = (side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.33, 1.32, 0);
      this.group.add(shoulder);
      push(addPart(shoulder, new THREE.CylinderGeometry(0.072, 0.062, 0.24, 8), this.materials.uniform, [0, -0.12, 0], "limb", this));
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.24, 0);
      shoulder.add(elbow);
      push(addPart(elbow, new THREE.CylinderGeometry(0.06, 0.05, 0.22, 8), this.materials.uniform, [0, -0.11, 0], "limb", this));
      push(addPart(elbow, new THREE.SphereGeometry(0.065, 8, 8), this.materials.helmet, [0, -0.02, 0.035], "limb", this));
      push(addPart(elbow, new THREE.BoxGeometry(0.09, 0.1, 0.1), this.materials.boots, [0, -0.245, 0], "limb", this));
      push(addPart(elbow, new THREE.BoxGeometry(0.085, 0.03, 0.08), this.materials.helmet, [0, -0.22, -0.025], "limb", this));
      return { shoulder, elbow };
    };
    const leftArmRig = makeArm(-1);
    const rightArmRig = makeArm(1);
    this.armL = leftArmRig.shoulder;
    this.armR = rightArmRig.shoulder;
    this.leftElbow = leftArmRig.elbow;
    this.rightElbow = rightArmRig.elbow;
    this.rightArmBase = -1.2;
    this.armR.rotation.x = this.rightArmBase;
    this.rightElbow.rotation.x = -0.18;

    // Detailed Tactical Rifle in enemy hands
    push(addPart(this.group, new THREE.BoxGeometry(0.075, 0.12, 0.52), this.materials.gun, [0.24, 1.22, -0.36], "limb", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.06, 0.02, 0.44), this.materials.helmet, [0.24, 1.29, -0.36], "limb", this));
    push(addPart(this.group, new THREE.BoxGeometry(0.05, 0.055, 0.11), this.materials.helmet, [0.24, 1.34, -0.36], "limb", this));
    push(addPart(this.group, new THREE.CircleGeometry(0.02, 8), this.materials.visor, [0.24, 1.34, -0.42], "limb", this));
    push(addPart(this.group, new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8), this.materials.gun, [0.24, 1.24, -0.78], "limb", this, [Math.PI / 2, 0, 0]));
    push(addPart(this.group, new THREE.CylinderGeometry(0.028, 0.028, 0.08, 8), this.materials.helmet, [0.24, 1.24, -0.98], "limb", this, [Math.PI / 2, 0, 0]));
    push(addPart(this.group, new THREE.BoxGeometry(0.055, 0.22, 0.11), this.materials.helmet, [0.24, 1.08, -0.38], "limb", this, [0.2, 0, 0]));
    push(addPart(this.group, new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), this.materials.helmet, [0.24, 1.14, -0.62], "limb", this, [0, 0, 0]));

    // Archetype special gear
    if (this.archetype.id === "heavy") {
      push(addPart(this.group, new THREE.BoxGeometry(0.64, 0.48, 0.38), this.materials.vest, [0, 1.2, 0], "body", this));
      push(addPart(this.group, new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10), this.materials.helmet, [0.24, 1.05, -0.38], "limb", this, [0, 0, 0]));
    } else if (this.archetype.id === "marksman") {
      push(addPart(this.group, new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8), this.materials.helmet, [0.24, 1.36, -0.36], "limb", this, [Math.PI / 2, 0, 0]));
      push(addPart(this.group, new THREE.CylinderGeometry(0.018, 0.018, 0.58, 8), this.materials.gun, [0.24, 1.24, -0.88], "limb", this, [Math.PI / 2, 0, 0]));
    } else if (this.archetype.id === "rusher") {
      push(addPart(this.group, new THREE.BoxGeometry(0.24, 0.08, 0.08), this.materials.visor, [0, 1.66, -0.14], "head", this));
    }

    // Collapse every rigid link into one draw call while keeping joints animatable.
    this.mergedMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.72,
      metalness: 0.18,
    });
    this.mergedMaterial.userData.baseEmissive = 0;
    this.mergeRigidParts();

    this.healthBar = createHealthBar();
    this.group.add(this.healthBar.sprite);
    drawHealthBar(this);

    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0.25, 1.22, -0.92);
    this.group.add(this.muzzle);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb066,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.muzzleFlash = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), flashMaterial);
    this.muzzleFlash.position.copy(this.muzzle.position);
    this.group.add(this.muzzleFlash);

    this.reset(true);
  }

  mergeRigidParts() {
    const links = [
      this.group,
      this.leftLeg,
      this.rightLeg,
      this.leftKnee,
      this.rightKnee,
      this.armL,
      this.armR,
      this.leftElbow,
      this.rightElbow,
    ];
    for (const link of links) {
      if (!link) continue;
      const byPart = new Map();
      for (const child of [...link.children]) {
        if (!child.isMesh || !child.userData.part) continue;
        // The visor keeps its own emissive material so it still glows.
        if (child.material === this.materials.visor) continue;
        const list = byPart.get(child.userData.part) ?? [];
        list.push(child);
        byPart.set(child.userData.part, list);
      }
      for (const [part, meshes] of byPart) {
        if (meshes.length < 2) continue;
        const geometry = mergeColoredGeometry(meshes);
        const merged = new THREE.Mesh(geometry, this.mergedMaterial);
        merged.castShadow = true;
        merged.receiveShadow = true;
        merged.userData.enemy = this;
        merged.userData.part = part;
        for (const mesh of meshes) {
          link.remove(mesh);
          mesh.geometry.dispose();
        }
        link.add(merged);
      }
    }
    // Rebuild the hit list from the merged meshes that actually remain.
    this.hitMeshes = [];
    this.group.traverse((object) => {
      if (object.isMesh && object.userData.part && object.userData.enemy === this) {
        this.hitMeshes.push(object);
      }
    });
  }

  reset(initial = false) {
    const spawn = this.manager.pickSpawn(this.manager.player?.position ?? this.position);
    this.position.set(spawn.x, 0, spawn.z);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.dead = false;
    this.state = "patrol";
    this.lastSeenAt = -Infinity;
    this.rival = null;
    this.deadTimer = 0;
    this.respawnTimer = 0;
    this.nextShot = performance.now() / 1000 + randRange(0.5, 1.5);
    this.patrolTimer = 0;
    this.avoidTimer = 0;
    this.group.visible = true;
    this.group.rotation.set(0, 0, 0);
    this.group.position.copy(this.position);
    this.group.scale.setScalar(this.archetype.scale);
    this.healthBar.sprite.visible = true;
    if (this.leftLeg) this.leftLeg.rotation.x = 0;
    if (this.rightLeg) this.rightLeg.rotation.x = 0;
    if (this.leftKnee) this.leftKnee.rotation.x = 0;
    if (this.rightKnee) this.rightKnee.rotation.x = 0;
    if (this.armL) this.armL.rotation.x = 0;
    if (this.leftElbow) this.leftElbow.rotation.x = 0;
    if (this.armR) this.armR.rotation.x = this.rightArmBase ?? -1.2;
    if (this.rightElbow) this.rightElbow.rotation.x = -0.18;
    this.hitMeshes.forEach((mesh) => {
      mesh.visible = true;
      mesh.material.emissive?.setHex(mesh.material.userData.baseEmissive ?? 0);
    });
    drawHealthBar(this);
    if (initial) this.yaw = randRange(-Math.PI, Math.PI);
  }

  takeDamage(amount, headshot, point, source = "weapon") {
    if (this.dead) return { killed: false };
    this.health -= Math.max(0, Number(amount) || 0);
    this.hitFlash = 0.12;
    if (source !== "zone" && source !== "bot") {
      this.state = "chase";
      this.lastSeenAt = performance.now() / 1000;
      this.manager.player?.getEyePosition?.(this.lastKnown);
    }
    for (const mesh of this.hitMeshes) {
      if (mesh.material.emissive) mesh.material.emissive.setHex(headshot ? 0x662016 : 0x2b1d10);
    }
    if (this.health <= 0) {
      this.die(headshot, point, source);
      return { killed: true };
    }
    drawHealthBar(this);
    return { killed: false };
  }

  die(headshot, point, source = "weapon") {
    this.dead = true;
    this.health = 0;
    this.state = "dead";
    this.deadTimer = 0;
    this.respawnTimer = this.manager.respawnEnabled ? 4.2 : Infinity;
    drawHealthBar(this);
    this.healthBar.sprite.visible = false;
    if (this.manager.audio) this.manager.audio.enemyDown();
    if (this.manager.callbacks.onKill) this.manager.callbacks.onKill(this, headshot, point, source);
  }

  update(dt, now) {
    if (this.manager.player.dead) {
      this.velocity.set(0, 0, 0);
      return;
    }
    if (this.dead) {
      this.deadTimer += dt;
      this.respawnTimer -= dt;
      // Fall backwards around the feet instead of sinking through the floor.
      this.group.rotation.x = Math.min(Math.PI / 2, this.group.rotation.x + dt * 9);
      this.group.position.y = Math.max(0.12, this.group.position.y - dt * 3.5);
      // Knees buckle and the free arm drops: the body collapses instead of tipping as a plank.
      const fall = Math.min(1, this.deadTimer * 2.4);
      if (this.leftKnee) this.leftKnee.rotation.x = fall * 0.9;
      if (this.rightKnee) this.rightKnee.rotation.x = fall * 0.55;
      if (this.armL) this.armL.rotation.x = -fall * 0.85;
      if (this.armR) this.armR.rotation.x = (this.rightArmBase ?? -1.2) - fall * 0.35;
      if (this.manager.respawnEnabled && this.respawnTimer <= 0) this.reset();
      return;
    }

    const player = this.manager.player;
    const playerEye = player.getEyePosition(new THREE.Vector3());
    const eye = new THREE.Vector3(this.position.x, this.position.y + 1.55, this.position.z);
    const toPlayer = new THREE.Vector3().subVectors(playerEye, eye);
    const distance = toPlayer.length();
    const hostile = !this.manager.suppressAttack;
    const canSee = hostile && distance < 40 && this.manager.world.hasClearSegment(eye, playerEye);
    const arch = this.archetype;

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.hitFlash <= 0) {
        for (const mesh of this.hitMeshes) {
          mesh.material.emissive?.setHex(mesh.material.userData.baseEmissive ?? 0);
        }
      }
    }

    this.patrolTimer -= dt;
    this.avoidTimer -= dt;

    let moveDirection = new THREE.Vector3();
    const bounds = this.manager.world.bounds ?? { halfX: 34, halfZ: 24 };
    const limitX = bounds.halfX - 3;
    const limitZ = bounds.halfZ - 3;

    // Battle Royale storm: bots outside the circle rotate in and take damage like the player.
    const zone = this.manager.zone;
    let outsideZone = false;
    if (zone) {
      const zoneDistance = Math.hypot(this.position.x - zone.center.x, this.position.z - zone.center.z);
      outsideZone = zoneDistance > zone.radius;
      if (outsideZone) {
        this.manager.damageFromZone(this, zone.damage * dt * 0.6);
        if (this.dead) return;
      }
    }

    if (canSee) {
      this.lastSeenAt = now;
      this.lastKnown.copy(playerEye);
      this.rival = null;
      this.state = distance < arch.engageRange ? "attack" : "chase";
    } else if (this.state === "attack") {
      this.state = "chase";
    }
    if (this.state === "chase" && !canSee) {
      const reachedLastKnown = Math.hypot(this.position.x - this.lastKnown.x, this.position.z - this.lastKnown.z) < 1.6;
      if (now - this.lastSeenAt > 6 || reachedLastKnown) this.state = "patrol";
    }

    // Free-for-all bots (Battle Royale) pick fights with each other when the player is out of sight.
    if (!canSee && this.manager.infighting && (this.state === "patrol" || this.rival)) {
      if (!this.rival || this.rival.dead || !this.manager.world.hasClearSegment(eye, this.rivalEye(this.rival))) {
        this.rival = this.manager.findRival(this, eye, 26);
      }
    } else if (canSee) {
      this.rival = null;
    }

    if (this.rival && !canSee) {
      const rivalEye = this.rivalEye(this.rival);
      const toRival = new THREE.Vector3().subVectors(rivalEye, eye);
      const rivalDistance = toRival.length();
      toRival.y = 0;
      if (toRival.lengthSq() > 0.01) toRival.normalize();
      this.yaw = Math.atan2(-toRival.x, -toRival.z);
      const side = new THREE.Vector3(-toRival.z, 0, toRival.x).multiplyScalar(this.strafeDirection);
      moveDirection.copy(toRival).multiplyScalar(rivalDistance > 14 ? 0.7 : rivalDistance < 6 ? -0.5 : 0).addScaledVector(side, 0.55);
      if (Math.random() < dt * 0.7) this.strafeDirection *= -1;
      if (now >= this.nextShot) {
        this.nextShot = now + randRange(arch.fireMin, arch.fireMax) * 1.15;
        this.shootRival(this.rival, rivalDistance);
      }
    } else if (this.state === "patrol") {
      if (this.patrolTimer <= 0 || this.position.distanceTo(this.patrolTarget) < 1.4) {
        this.patrolTimer = randRange(3, 7);
        if (outsideZone) {
          const jitter = randRange(-zone.radius * 0.5, zone.radius * 0.5);
          this.patrolTarget.set(zone.center.x + jitter, 0, zone.center.z + randRange(-zone.radius * 0.5, zone.radius * 0.5));
        } else {
          const angle = randRange(-Math.PI, Math.PI);
          const radius = randRange(4, 13);
          this.patrolTarget.set(
            clamp(this.position.x + Math.cos(angle) * radius, -limitX, limitX),
            0,
            clamp(this.position.z + Math.sin(angle) * radius, -limitZ, limitZ),
          );
        }
      }
      moveDirection.subVectors(this.patrolTarget, this.position);
      if (moveDirection.lengthSq() > 0.01) moveDirection.normalize();
      this.yaw = Math.atan2(-moveDirection.x, -moveDirection.z);
    } else if (this.state === "chase") {
      const target = canSee ? playerEye : this.lastKnown;
      const direction = new THREE.Vector3().subVectors(target, eye);
      direction.y = 0;
      if (direction.lengthSq() > 0.01) direction.normalize();
      const strafe = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(this.strafeDirection * (canSee ? 0.55 : 0.15));
      moveDirection.copy(direction).add(strafe);
      this.yaw = Math.atan2(-direction.x, -direction.z);
    } else if (this.state === "attack") {
      const direction = new THREE.Vector3().subVectors(playerEye, eye);
      direction.y = 0;
      if (direction.lengthSq() > 0.01) direction.normalize();
      this.yaw = Math.atan2(-direction.x, -direction.z);
      const side = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(this.strafeDirection);
      const idealFar = arch.engageRange * 0.55;
      const idealNear = arch.id === "rusher" ? 2.5 : arch.engageRange * 0.28;
      const forwardBias = distance > idealFar ? 0.8 : distance < idealNear ? -0.6 : 0;
      moveDirection.copy(direction).multiplyScalar(forwardBias).addScaledVector(side, arch.id === "rusher" ? 0.3 : 0.55);
      if (Math.random() < dt * 0.7) this.strafeDirection *= -1;

      if (now >= this.nextShot) {
        this.nextShot = now + randRange(arch.fireMin, arch.fireMax);
        this.shoot(playerEye, distance);
      }
    }

    if (this.avoidTimer > 0) {
      moveDirection.set(-moveDirection.z, 0, moveDirection.x);
    }

    const baseSpeed = this.state === "attack" ? 2.4 : this.state === "chase" ? 3.1 : 1.5;
    const speed = (outsideZone && this.state === "patrol" ? 3.4 : baseSpeed) * arch.speed;
    if (moveDirection.lengthSq() > 0.001) {
      moveDirection.normalize();
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, moveDirection.x * speed, 7, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, moveDirection.z * speed, 7, dt);
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 8, dt);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 8, dt);
    }

    this.velocity.y -= 19 * dt;
    const delta = this.velocity.clone().multiplyScalar(dt);
    const before = this.position.clone();
    const contact = this.manager.world.resolveMovement(this.position, delta, ENEMY_RADIUS, ENEMY_HEIGHT, 0.4);
    if (contact.grounded && this.velocity.y < 0) this.velocity.y = 0;
    if (contact.hitWall && before.distanceToSquared(this.position) < 0.0002) {
      this.avoidTimer = 0.6;
      this.strafeDirection *= -1;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, this.yaw, 10, dt);

    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    // Faster steps when sprinting, shorter cadence when walking.
    this.legSwing += planarSpeed * dt * (planarSpeed > 2.4 ? 7.6 : 6.1);
    const stride = Math.min(1, planarSpeed / 3.5);
    const swing = Math.sin(this.legSwing) * Math.min(0.78, planarSpeed * 0.2);
    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      // Knees only fold on the back half of the stride, which sells the walk cycle.
      if (this.leftKnee) this.leftKnee.rotation.x = Math.max(0, swing) * 0.95;
      if (this.rightKnee) this.rightKnee.rotation.x = Math.max(0, -swing) * 0.95;
    }
    // Free arm swings against the legs; the weapon arm barely moves so the gun stays on target.
    if (this.armL) this.armL.rotation.x = -swing * 0.82;
    if (this.leftElbow) this.leftElbow.rotation.x = Math.max(0, swing) * 0.58;
    const flinch = this.muzzleTimer > 0 ? 0.08 : 0;
    if (this.armR) this.armR.rotation.x = (this.rightArmBase ?? -1.2) + swing * 0.06 + flinch;
    // Vertical bob, lateral weight shift and forward lean: reads as walking, then sprinting.
    const idleBreath = planarSpeed < 0.25 ? Math.sin(now * 2.1) * 0.006 : 0;
    this.group.position.y = this.position.y + Math.abs(Math.sin(this.legSwing)) * 0.045 * stride + idleBreath;
    this.group.position.x = this.position.x + Math.cos(this.legSwing) * 0.012 * stride;
    this.group.position.z = this.position.z + Math.sin(this.legSwing * 2) * 0.006 * stride;
    this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, stride * 0.18, 8, dt);
    this.group.rotation.z = THREE.MathUtils.damp(this.group.rotation.z, Math.cos(this.legSwing) * 0.032 * stride, 7, dt);

    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      this.muzzleFlash.material.opacity = Math.max(0, this.muzzleTimer / 0.06);
    } else {
      this.muzzleFlash.material.opacity = 0;
    }
  }

  rivalEye(rival) {
    return new THREE.Vector3(rival.position.x, rival.position.y + 1.4, rival.position.z);
  }

  shoot(playerEye, distance) {
    const origin = new THREE.Vector3();
    this.muzzle.getWorldPosition(origin);
    const player = this.manager.player;
    // Moving and crouched targets are harder to hit; the archetype shifts the base skill.
    const mobility = clamp(player.speedRatio ?? 0, 0, 1);
    const crouchPenalty = player.crouching ? 0.88 : 1;
    const arch = this.archetype;
    const accuracy = clamp(
      (0.8 - distance * 0.011 - mobility * 0.12) * crouchPenalty * arch.accuracy * (this.manager.difficulty?.accuracy ?? 1),
      0.15,
      0.95,
    );
    // The shot must actually have a clear line to the player (deployable barriers block it).
    const clear = this.manager.world.hasClearSegment(origin, playerEye);
    const hit = clear && Math.random() < accuracy;
    const spread = new THREE.Vector3(randRange(-0.5, 0.5), randRange(-0.35, 0.35), randRange(-0.5, 0.5));
    const end = playerEye.clone().add(spread);
    if (hit) {
      const damage = randRange(6.5, 11.5) * arch.damage * (this.manager.difficulty?.damage ?? 1);
      this.manager.player.takeDamage(damage, `enemy-${this.index}`);
      if (this.manager.callbacks.onPlayerHit) this.manager.callbacks.onPlayerHit(damage, origin);
    }
    this.lastShotAt = performance.now() / 1000;
    this.manager.spawnTracer(origin, end);
    this.muzzleTimer = 0.06;
    this.muzzleFlash.material.opacity = 0.9;
    if (this.manager.audio) {
      this.manager.audio.enemyShot(origin, player.position, player.yaw, arch.id === "marksman" ? "sr9" : "ar4");
    }
  }

  shootRival(rival, distance) {
    const origin = new THREE.Vector3();
    this.muzzle.getWorldPosition(origin);
    const end = this.rivalEye(rival);
    const chance = clamp(0.62 - distance * 0.015, 0.12, 0.6);
    this.lastShotAt = performance.now() / 1000;
    this.manager.spawnTracer(origin, end);
    this.muzzleTimer = 0.06;
    this.muzzleFlash.material.opacity = 0.9;
    if (Math.random() < chance) {
      rival.takeDamage(randRange(7, 12) * this.archetype.damage, false, end, "bot");
      rival.rival = this;
    }
    const player = this.manager.player;
    this.manager.audio?.enemyShot(origin, player.position, player.yaw, "ar4");
  }
}

export class EnemyManager {
  constructor({ scene, world, player, audio, callbacks = {} }) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.audio = audio;
    this.callbacks = callbacks;
    this.difficulty = { accuracy: 1, damage: 1 };
    this.enemies = [];
    this.activeCount = 0;
    this.spawnCursor = 1;
    this.tracers = [];
    this.respawnEnabled = true;
    this.suppressAttack = false;
    this.infighting = false;
    this.zone = null;

    const tracerMaterial = new THREE.LineBasicMaterial({
      color: 0xff9a62,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let index = 0; index < 14; index += 1) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, tracerMaterial.clone());
      line.visible = false;
      line.frustumCulled = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0, maxLife: 0.11 });
    }
  }

  spawnInitial(count = 5) {
    for (let index = 0; index < count; index += 1) {
      const enemy = new Enemy(this, index);
      this.enemies.push(enemy);
    }
    this.activeCount = count;
  }

  ensureCount(count) {
    while (this.enemies.length < count) {
      this.enemies.push(new Enemy(this, this.enemies.length));
    }
    for (const enemy of this.enemies) enemy.group.visible = enemy.index < count;
    this.activeCount = count;
  }

  startWave(count) {
    this.respawnEnabled = false;
    this.ensureCount(count);
    for (const enemy of this.enemies.slice(0, this.activeCount)) enemy.reset();
    for (const enemy of this.enemies.slice(this.activeCount)) enemy.group.visible = false;
  }

  configure({ respawn = true, difficulty = null, infighting = false } = {}) {
    this.respawnEnabled = respawn;
    this.infighting = infighting;
    if (difficulty) this.setDifficulty(difficulty);
  }

  findRival(self, fromEye, maxDistance = 26) {
    let best = null;
    let bestDistance = maxDistance;
    for (const other of this.getActiveEnemies()) {
      if (other === self || other.dead) continue;
      const dx = other.position.x - self.position.x;
      const dz = other.position.z - self.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance >= bestDistance) continue;
      if (!this.world.hasClearSegment(fromEye, self.rivalEye(other))) continue;
      best = other;
      bestDistance = distance;
    }
    return best;
  }

  damageFromZone(enemy, amount) {
    if (enemy.dead) return;
    enemy.takeDamage(amount, false, enemy.position, "zone");
  }

  setDifficulty(difficulty = {}) {
    this.difficulty = {
      accuracy: Number(difficulty.accuracy) || 1,
      damage: Number(difficulty.damage) || 1,
    };
  }

  pickSpawn(avoidPosition) {
    const spawns = this.world.spawns;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      this.spawnCursor = (this.spawnCursor + 1) % spawns.length;
      const spawn = spawns[this.spawnCursor];
      const distance = avoidPosition ? Math.hypot(spawn.x - avoidPosition.x, spawn.z - avoidPosition.z) : 999;
      if (distance > 8) return spawn;
    }
    return spawns[this.spawnCursor];
  }

  getHitMeshes() {
    const meshes = [];
    for (const enemy of this.enemies.slice(0, this.activeCount ?? this.enemies.length)) {
      if (enemy.dead) continue;
      for (const mesh of enemy.hitMeshes) {
        if (mesh.visible) meshes.push(mesh);
      }
    }
    return meshes;
  }

  damage(enemy, amount, headshot, point, source = "weapon") {
    return enemy.takeDamage(amount, headshot, point, source);
  }

  getActiveEnemies() {
    return this.enemies.slice(0, this.activeCount ?? this.enemies.length);
  }

  spawnTracer(start, end) {
    const tracer = this.tracers.find((item) => item.life <= 0) ?? this.tracers[0];
    const positions = tracer.line.geometry.attributes.position.array;
    positions[0] = start.x;
    positions[1] = start.y;
    positions[2] = start.z;
    positions[3] = end.x;
    positions[4] = end.y;
    positions[5] = end.z;
    tracer.line.geometry.attributes.position.needsUpdate = true;
    tracer.line.material.opacity = 0.8;
    tracer.line.visible = true;
    tracer.life = tracer.maxLife;
  }

  update(dt, now) {
    for (const enemy of this.enemies.slice(0, this.activeCount ?? this.enemies.length)) enemy.update(dt, now);
    for (const tracer of this.tracers) {
      if (tracer.life <= 0) continue;
      tracer.life -= dt;
      tracer.line.material.opacity = Math.max(0, tracer.life / tracer.maxLife) * 0.8;
      if (tracer.life <= 0) tracer.line.visible = false;
    }
  }

  reset() {
    for (const enemy of this.enemies.slice(0, this.activeCount ?? this.enemies.length)) {
      enemy.reset();
    }
  }

  getAliveCount() {
    return this.enemies.slice(0, this.activeCount ?? this.enemies.length).filter((enemy) => !enemy.dead).length;
  }
}
