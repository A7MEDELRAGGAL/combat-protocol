import * as THREE from "../vendor/three.module.js";
import { skinById } from "./game-data.js";

const MAX_TRACERS = 16;

function makeNameSprite(name, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(8, 10, 9, 0.72)";
  ctx.fillRect(0, 5, canvas.width, 30);
  ctx.fillStyle = color;
  ctx.fillRect(0, 5, 4, 30);
  ctx.fillStyle = "rgba(240, 232, 214, 0.95)";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.slice(0, 18), canvas.width / 2 + 2, 21);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(2.1, 0.33, 1);
  sprite.position.y = 2.16;
  return sprite;
}

function makeHealthSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 14;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(0.78, 0.085, 1);
  sprite.position.y = 1.94;
  return { canvas, ctx, texture, sprite };
}

function drawHealth(bar, health) {
  const { canvas, ctx, texture } = bar;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(8, 10, 9, 0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.max(0, Math.min(1, health / 100));
  ctx.fillStyle = ratio > 0.55 ? "#d8a35a" : ratio > 0.25 ? "#d17a45" : "#c64736";
  ctx.fillRect(2, 4, (canvas.width - 4) * ratio, canvas.height - 8);
  ctx.strokeStyle = "rgba(8, 10, 9, 0.9)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  texture.needsUpdate = true;
}

function material(color, roughness = 0.72, metalness = 0.12) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Visible proxy for another connected player. */
export class RemotePlayers {
  constructor({ scene }) {
    this.scene = scene;
    this.players = new Map();
    this.tracers = [];
    const tracerMaterial = new THREE.LineBasicMaterial({
      color: 0xff9a62,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let index = 0; index < MAX_TRACERS; index += 1) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, tracerMaterial.clone());
      line.visible = false;
      line.frustumCulled = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0, maxLife: 0.1 });
    }
  }

  createModel(player) {
    const group = new THREE.Group();
    const accent = new THREE.Color(player.color ?? "#d8a35a");
    const op = player.operator ?? "vanguard";
    const uniformColor = op === "scout" ? 0x283438 : op === "medic" ? 0x313f38 : op === "atlas" ? 0x3d352b : 0x39433c;
    const vestColor = op === "atlas" ? 0x4a3d2e : op === "medic" ? 0x22352d : 0x222823;
    const uniform = material(uniformColor);
    const vest = material(vestColor);
    const helmet = material(0x1b201d, 0.6, 0.2);
    const skinMat = material(0x9a7a5c, 0.85, 0.02);
    const skinDef = skinById(player.skin ?? "standard");
    const gunColor = skinDef.body ?? 0x1b1d1a;
    const gun = material(gunColor, 0.45, 0.55);
    const accentColor = skinDef.accent ? new THREE.Color(skinDef.accent) : accent;
    const accentMaterial = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.16, roughness: 0.55 });
    const part = (geometry, mat, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };
    part(new THREE.BoxGeometry(0.5, 0.62, 0.27), uniform, 0, 1.12, 0);
    part(new THREE.BoxGeometry(0.58, 0.42, 0.34), vest, 0, 1.19, 0);
    part(new THREE.SphereGeometry(0.125, 12, 9), skinMat, 0, 1.66, 0);
    const helmetMesh = part(new THREE.SphereGeometry(0.155, 12, 9), helmet, 0, 1.72, 0);
    helmetMesh.scale.set(1, 0.82, 1.05);
    part(new THREE.BoxGeometry(0.22, 0.05, 0.06), accentMaterial, 0, 1.66, -0.13);
    for (const side of [-1, 1]) {
      part(new THREE.CylinderGeometry(0.075, 0.06, 0.72, 7), uniform, side * 0.17, 0.45, 0);
      part(new THREE.CylinderGeometry(0.065, 0.055, 0.48, 7), uniform, side * 0.32, 1.14, 0);
      part(new THREE.SphereGeometry(0.1, 10, 7), accentMaterial, side * 0.31, 1.33, 0);
    }
    part(new THREE.BoxGeometry(0.12, 0.12, 0.68), gun, 0.25, 1.22, -0.36);
    part(new THREE.BoxGeometry(0.08, 0.08, 0.36), gun, 0.25, 1.16, -0.72);
    group.add(makeNameSprite(player.name, player.color ?? "#d8a35a"));
    const health = makeHealthSprite();
    group.add(health.sprite);
    this.scene.add(group);
    return { group, health, target: new THREE.Vector3(), targetYaw: 0 };
  }

  updateSnapshot(players, selfId) {
    const seen = new Set();
    for (const player of players) {
      if (player.id === selfId) continue;
      seen.add(player.id);
      let entry = this.players.get(player.id);
      if (entry && (entry.player?.operator !== player.operator || entry.player?.skin !== player.skin)) {
        this.scene.remove(entry.group);
        entry.group.traverse((child) => {
          child.geometry?.dispose?.();
          if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
          else child.material?.dispose?.();
        });
        entry = null;
      }
      if (!entry) {
        entry = this.createModel(player);
        this.players.set(player.id, entry);
      }
      entry.player = player;
      entry.target.set(player.x, player.y ?? 0, player.z);
      entry.targetYaw = player.yaw ?? 0;
      entry.group.visible = !player.dead;
      if (entry.healthValue !== player.health) {
        entry.healthValue = player.health;
        drawHealth(entry.health, player.health);
      }
    }
    for (const [id, entry] of this.players) {
      if (seen.has(id)) continue;
      this.scene.remove(entry.group);
      entry.group.traverse((child) => {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
        else child.material?.dispose?.();
      });
      this.players.delete(id);
    }
  }

  update(dt) {
    const blend = 1 - Math.exp(-12 * dt);
    for (const entry of this.players.values()) {
      entry.group.position.lerp(entry.target, blend);
      let difference = entry.targetYaw - entry.group.rotation.y;
      while (difference > Math.PI) difference -= Math.PI * 2;
      while (difference < -Math.PI) difference += Math.PI * 2;
      entry.group.rotation.y += difference * blend;
    }
    for (const tracer of this.tracers) {
      if (tracer.life <= 0) continue;
      tracer.life -= dt;
      tracer.line.material.opacity = Math.max(0, tracer.life / tracer.maxLife) * 0.8;
      if (tracer.life <= 0) tracer.line.visible = false;
    }
  }

  spawnTracer(origin, direction) {
    const tracer = this.tracers.find((item) => item.life <= 0) ?? this.tracers[0];
    const start = new THREE.Vector3(origin.x, origin.y, origin.z);
    const dir = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    const end = start.clone().addScaledVector(dir, 55);
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

  clear() {
    for (const entry of this.players.values()) {
      this.scene.remove(entry.group);
      entry.group.traverse((child) => {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
        else child.material?.dispose?.();
      });
    }
    this.players.clear();
  }
}
