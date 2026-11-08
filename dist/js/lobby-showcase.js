import * as THREE from "../vendor/three.module.js";
import { skinById } from "./game-data.js";

/**
 * 3D Lobby Character & Squad Showcase (PUBG Mobile style).
 * Renders the player's operator with their equipped weapon on a podium,
 * plus 3 squad slots for invited teammates, with 360° rotation on drag.
 */

function makeMaterial(color, roughness = 0.55, metalness = 0.25) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function createLobbyCharacter(operatorId = "vanguard", skinId = "standard", name = "أنت") {
  const group = new THREE.Group();
  group.name = `lobby-character-${name}`;

  const op = operatorId ?? "vanguard";
  const uniformColor = op === "scout" ? 0x283438 : op === "medic" ? 0x313f38 : op === "atlas" ? 0x3d352b : 0x39433c;
  const vestColor = op === "atlas" ? 0x4a3d2e : op === "medic" ? 0x22352d : 0x222823;
  const uniform = makeMaterial(uniformColor, 0.65, 0.15);
  const vest = makeMaterial(vestColor, 0.6, 0.2);
  const skinMat = makeMaterial(0xc98d63, 0.55, 0.05);
  const helmet = makeMaterial(0x19211c, 0.45, 0.35);

  const skinDef = skinById(skinId);
  const gunColor = skinDef.body ?? 0x1b1d1a;
  const gun = makeMaterial(gunColor, 0.45, 0.55);
  const accentColor = skinDef.accent ? new THREE.Color(skinDef.accent) : new THREE.Color(0xd8a35a);
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.18,
    roughness: 0.5,
  });

  const part = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Torso & Tactical Armor Vest
  part(new THREE.BoxGeometry(0.5, 0.64, 0.28), uniform, 0, 1.12, 0);
  part(new THREE.BoxGeometry(0.58, 0.44, 0.35), vest, 0, 1.19, 0);

  // MOLLE webbing & chest magazine pouches
  for (let r = 0; r < 3; r += 1) {
    part(new THREE.BoxGeometry(0.48, 0.016, 0.02), helmet, 0, 1.08 + r * 0.065, -0.18);
  }
  for (const offset of [-0.16, 0, 0.16]) {
    part(new THREE.BoxGeometry(0.12, 0.15, 0.08), vest, offset, 1.12, -0.2);
    part(new THREE.BoxGeometry(0.04, 0.025, 0.03), accentMaterial, offset, 1.21, -0.21);
  }

  // Head, Face & Tactical Ballistic Helmet
  part(new THREE.SphereGeometry(0.125, 12, 9), skinMat, 0, 1.66, 0);
  const helmetMesh = part(new THREE.SphereGeometry(0.155, 12, 9), helmet, 0, 1.72, 0);
  helmetMesh.scale.set(1, 0.82, 1.05);

  // Dual NVG Night Vision tubes + Glowing Lenses
  for (const side of [-0.055, 0.055]) {
    const nvg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.07, 8), helmet);
    nvg.rotation.x = Math.PI / 2;
    nvg.position.set(side, 1.73, -0.17);
    group.add(nvg);

    const nvgLens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 8), accentMaterial);
    nvgLens.position.set(side, 1.73, -0.207);
    group.add(nvgLens);
  }

  // Visor / Goggles
  part(new THREE.BoxGeometry(0.22, 0.055, 0.07), accentMaterial, 0, 1.66, -0.13);

  // Legs, Kneepads & Combat Boots
  for (const side of [-1, 1]) {
    part(new THREE.CylinderGeometry(0.08, 0.065, 0.74, 8), uniform, side * 0.17, 0.45, 0);
    // Hard-shell Kneepad
    part(new THREE.BoxGeometry(0.12, 0.12, 0.06), helmet, side * 0.17, 0.44, -0.075);
    // Combat Boot
    part(new THREE.BoxGeometry(0.14, 0.12, 0.24), helmet, side * 0.17, 0.06, -0.04);
  }

  // Tactical Stance Arms holding Rifle
  // Left arm forward
  part(new THREE.CylinderGeometry(0.065, 0.055, 0.46, 8), uniform, -0.28, 1.16, -0.12);
  // Right arm supporting stock
  part(new THREE.CylinderGeometry(0.065, 0.055, 0.46, 8), uniform, 0.28, 1.14, 0.06);

  // Equipped Weapon (Assault Rifle with custom skin)
  const gunGroup = new THREE.Group();
  gunGroup.position.set(0.06, 1.15, -0.32);
  gunGroup.rotation.y = -0.18;
  gunGroup.rotation.x = -0.06;

  // Receiver body
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.52), gun);
  gunGroup.add(receiver);
  // Barrel & Shroud
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8), gun);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.42);
  gunGroup.add(barrel);
  // Muzzle brake
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.08, 8), helmet);
  brake.rotation.x = Math.PI / 2;
  brake.position.set(0, 0.02, -0.63);
  gunGroup.add(brake);
  // Magazine with grip pattern
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.1), accentMaterial);
  mag.position.set(0, -0.14, -0.08);
  mag.rotation.x = 0.14;
  gunGroup.add(mag);
  // Top rail & Holographic Sight
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.38), helmet);
  rail.position.set(0, 0.08, -0.08);
  gunGroup.add(rail);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.12), gun);
  sight.position.set(0, 0.12, -0.04);
  gunGroup.add(sight);
  const sightLens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 8), accentMaterial);
  sightLens.position.set(0, 0.12, -0.102);
  gunGroup.add(sightLens);

  group.add(gunGroup);

  return {
    group,
    gunGroup,
    setSkin(newSkinId) {
      const def = skinById(newSkinId);
      if (def?.body) gun.color.setHex(def.body);
      if (def?.accent) {
        accentMaterial.color.set(def.accent);
        accentMaterial.emissive.set(def.accent);
      }
    },
    update(time) {
      // Subtle tactical breathing animation
      const breath = Math.sin(time * 2.2) * 0.008;
      group.position.y = breath;
      gunGroup.position.y = 1.15 + breath * 1.5;
    },
  };
}

export class LobbyShowcase {
  constructor({ scene }) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = "lobby-showcase-stage";
    this.scene.add(this.root);

    // Tactical metallic platform ring
    const podiumGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.22, 32);
    const podiumMat = makeMaterial(0x161a18, 0.7, 0.3);
    this.podium = new THREE.Mesh(podiumGeo, podiumMat);
    this.podium.position.set(0, -0.11, 0);
    this.podium.receiveShadow = true;
    this.root.add(this.podium);

    // Glowing hex ring border
    const ringGeo = new THREE.TorusGeometry(3.65, 0.04, 8, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd9a84e });
    this.podiumRing = new THREE.Mesh(ringGeo, ringMat);
    this.podiumRing.position.set(0, 0.01, 0);
    this.root.add(this.podiumRing);

    this.playerChar = null;
    this.squadMembers = [];
    this.yaw = 0;
    this.targetYaw = 0;
    this.isDragging = false;
    this.lastPointerX = 0;
  }

  setPlayer(operatorId, skinId, name = "أنت") {
    if (this.playerChar?.group?.parent) {
      this.root.remove(this.playerChar.group);
    }
    this.playerChar = createLobbyCharacter(operatorId, skinId, name);
    this.playerChar.group.position.set(0, 0, 0);
    this.root.add(this.playerChar.group);
  }

  setSquad(members = []) {
    for (const mem of this.squadMembers) {
      if (mem?.group?.parent) this.root.remove(mem.group);
    }
    this.squadMembers = [];

    const slotPositions = [
      { x: -1.4, z: 0.35, yaw: 0.25 },
      { x: 1.4, z: 0.35, yaw: -0.25 },
      { x: 2.3, z: 1.1, yaw: -0.4 },
    ];

    for (let i = 0; i < Math.min(3, members.length); i += 1) {
      const data = members[i];
      const squadChar = createLobbyCharacter(data.operator ?? "scout", data.skin ?? "standard", data.name ?? `Squad-${i + 1}`);
      const pos = slotPositions[i];
      squadChar.group.position.set(pos.x, 0, pos.z);
      squadChar.group.rotation.y = pos.yaw;
      squadChar.group.scale.set(0.95, 0.95, 0.95);
      this.root.add(squadChar.group);
      this.squadMembers.push(squadChar);
    }
  }

  onPointerDown(clientX) {
    this.isDragging = true;
    this.lastPointerX = clientX;
  }

  onPointerMove(clientX) {
    if (!this.isDragging) return;
    const deltaX = clientX - this.lastPointerX;
    this.lastPointerX = clientX;
    this.targetYaw += deltaX * 0.008;
  }

  onPointerUp() {
    this.isDragging = false;
  }

  update(dt, time) {
    // Smooth rotation lerp
    this.yaw += (this.targetYaw - this.yaw) * Math.min(1, dt * 12);
    if (this.playerChar) {
      this.playerChar.group.rotation.y = this.yaw;
      this.playerChar.update(time);
    }
    for (const member of this.squadMembers) {
      member.update(time + 0.3);
    }
  }

  setVisible(visible) {
    this.root.visible = visible;
  }
}
