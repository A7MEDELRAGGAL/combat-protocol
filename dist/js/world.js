import * as THREE from "../vendor/three.module.js";
import { createBox, moveWithCollisions, segmentHitsBox, seededRandom } from "./utils.js";
import { mapById } from "./map-data.js";

const ARENA = { halfX: 34, halfZ: 24 };

function makeCanvasTexture(size, painter, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  painter(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  return texture;
}

function roughnessTexture(seed, repeatX = 1, repeatY = 1) {
  const texture = makeCanvasTexture(
    256,
    (ctx, size) => {
      const random = seededRandom(seed + 401);
      ctx.fillStyle = "#b6b6b6";
      ctx.fillRect(0, 0, size, size);
      for (let index = 0; index < 2400; index += 1) {
        const value = 92 + Math.floor(random() * 118);
        ctx.fillStyle = `rgb(${value},${value},${value})`;
        ctx.fillRect(random() * size, random() * size, 0.4 + random() * 2.8, 0.4 + random() * 2.8);
      }
      ctx.strokeStyle = "rgba(40, 40, 40, 0.22)";
      ctx.lineWidth = 1;
      for (let line = 0; line < size; line += 32) {
        ctx.beginPath();
        ctx.moveTo(line, 0);
        ctx.lineTo(line + 12, size);
        ctx.stroke();
      }
    },
    repeatX,
    repeatY,
  );
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function normalTexture(seed, repeatX = 1, repeatY = 1) {
  const texture = makeCanvasTexture(
    256,
    (ctx, size) => {
      const random = seededRandom(seed + 907);
      ctx.fillStyle = "rgb(128,128,255)";
      ctx.fillRect(0, 0, size, size);
      for (let index = 0; index < 900; index += 1) {
        const x = random() * size;
        const y = random() * size;
        const radius = 0.5 + random() * 2.2;
        const tilt = 108 + Math.floor(random() * 40);
        ctx.fillStyle = `rgb(${tilt},${tilt + Math.floor(random() * 18)},255)`;
        ctx.fillRect(x, y, radius, radius);
      }
      ctx.strokeStyle = "rgb(142,142,255)";
      ctx.lineWidth = 1;
      for (let seam = 0; seam < size; seam += 32) {
        ctx.beginPath();
        ctx.moveTo(seam, 0);
        ctx.lineTo(seam + 8, size);
        ctx.stroke();
      }
    },
    repeatX,
    repeatY,
  );
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function groundTexture(seed = 441, palette = {}) {
  return makeCanvasTexture(
    512,
    (ctx, size) => {
      const random = seededRandom(seed);
      const base = palette.base ?? "#6b675b";
      const stripe = palette.stripe ?? "rgba(211, 190, 130, 0.28)";
      const stain = palette.stain ?? "rgba(30, 29, 25, 0.22)";
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      for (let index = 0; index < 9000; index += 1) {
        const shade = 70 + Math.floor(random() * 45);
        const tint = random() > 0.52 ? 1 : 0.82;
        ctx.fillStyle = `rgba(${Math.round(shade * tint)},${Math.round((shade - 3) * tint)},${Math.round((shade - 10) * tint)},${0.08 + random() * 0.18})`;
        const x = random() * size;
        const y = random() * size;
        const radius = 0.5 + random() * 2.2;
        ctx.fillRect(x, y, radius, radius);
      }
      ctx.strokeStyle = "rgba(36, 34, 29, 0.28)";
      ctx.lineWidth = 2;
      for (let line = 0; line <= size; line += 64) {
        ctx.beginPath();
        ctx.moveTo(line, 0);
        ctx.lineTo(line, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, line);
        ctx.lineTo(size, line);
        ctx.stroke();
      }
      ctx.strokeStyle = stripe;
      ctx.lineWidth = 10;
      ctx.setLineDash([40, 42]);
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = stain;
      for (let index = 0; index < 28; index += 1) {
        const x = random() * size;
        const y = random() * size;
        ctx.beginPath();
        ctx.ellipse(x, y, 8 + random() * 26, 3 + random() * 9, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(235, 231, 215, 0.12)";
      ctx.lineWidth = 2;
      for (let lane = 0; lane < 4; lane += 1) {
        const offset = 46 + lane * 112;
        ctx.beginPath();
        ctx.moveTo(offset, size * 0.08);
        ctx.lineTo(offset + random() * 18 - 9, size * 0.92);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(236, 231, 217, 0.07)";
      ctx.lineWidth = 1;
      for (let seam = 0; seam < 18; seam += 1) {
        const x = random() * size;
        const y = random() * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 18 + random() * 60, y + (random() - 0.5) * 4);
        ctx.stroke();
      }
    },
    8,
    6,
  );
}

// Flat ground stains: oil, standing water and dirt. One 128px texture per kind,
// reused by every patch so the cost stays at draw calls only.
function stainTexture(kind, seed) {
  return makeCanvasTexture(128, (ctx, size) => {
    const random = seededRandom(seed);
    const center = size / 2;
    if (kind === "water") {
      const gradient = ctx.createRadialGradient(center, center, 6, center, center, center);
      gradient.addColorStop(0, "rgba(126, 148, 156, 0.42)");
      gradient.addColorStop(0.62, "rgba(96, 118, 126, 0.3)");
      gradient.addColorStop(0.88, "rgba(188, 200, 198, 0.24)");
      gradient.addColorStop(1, "rgba(188, 200, 198, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(214, 224, 220, 0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(center, center, center * 0.56, center * 0.38, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    if (kind === "dirt") {
      const gradient = ctx.createRadialGradient(center, center, 4, center, center, center);
      gradient.addColorStop(0, "rgba(92, 76, 52, 0.55)");
      gradient.addColorStop(0.7, "rgba(96, 80, 56, 0.3)");
      gradient.addColorStop(1, "rgba(96, 80, 56, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      for (let index = 0; index < 90; index += 1) {
        const angle = random() * Math.PI * 2;
        const radius = random() * center * 0.85;
        ctx.fillStyle = `rgba(58, 46, 30, ${0.05 + random() * 0.16})`;
        ctx.fillRect(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius, 1 + random() * 3, 1 + random() * 2);
      }
      return;
    }
    // Oil: near-black core, ragged edge, and a faint specular arc.
    const gradient = ctx.createRadialGradient(center, center, 3, center, center, center);
    gradient.addColorStop(0, "rgba(9, 8, 7, 0.9)");
    gradient.addColorStop(0.55, "rgba(20, 18, 15, 0.72)");
    gradient.addColorStop(0.84, "rgba(32, 29, 24, 0.3)");
    gradient.addColorStop(1, "rgba(32, 29, 24, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    for (let index = 0; index < 14; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = random() * center * 0.68;
      ctx.fillStyle = `rgba(7, 7, 6, ${0.16 + random() * 0.24})`;
      ctx.beginPath();
      ctx.ellipse(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius, 4 + random() * 14, 2 + random() * 8, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(172, 184, 190, 0.07)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, center * 0.6, 0.4, 2.7);
    ctx.stroke();
  });
}

function containerTexture(base, accent) {
  return makeCanvasTexture(256, (ctx, size) => {
    const random = seededRandom(base.length * 91 + 17);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += 16) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, 0, 5, size);
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(x + 8, 0, 4, size);
    }
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, size, 14);
    ctx.fillRect(0, size - 14, size, 14);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 18, 10, size - 36);
    for (let index = 0; index < 70; index += 1) {
      const x = random() * size;
      const y = random() * size;
      ctx.fillStyle = `rgba(40, 28, 20, ${0.04 + random() * 0.12})`;
      ctx.fillRect(x, y, 2 + random() * 20, 1 + random() * 3);
    }
    ctx.strokeStyle = "rgba(235, 231, 215, 0.2)";
    ctx.lineWidth = 2;
    for (let seam = 14; seam < size; seam += 34) {
      ctx.beginPath();
      ctx.moveTo(seam, 0);
      ctx.lineTo(seam, size);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(230, 226, 210, 0.5)";
    ctx.font = "bold 13px monospace";
    ctx.fillText("MERIDIAN / CM-04", 24, 44);
  });
}

function crateTexture() {
  return makeCanvasTexture(256, (ctx, size) => {
    const random = seededRandom(9921);
    ctx.fillStyle = "#7c6749";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      ctx.fillRect(0, y, size, 30);
    }
    ctx.strokeStyle = "rgba(34, 26, 18, 0.4)";
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, size - 12, size - 12);
    ctx.strokeStyle = "rgba(34, 26, 18, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(size - 8, size - 8);
    ctx.moveTo(size - 8, 8);
    ctx.lineTo(8, size - 8);
    ctx.stroke();
    for (let index = 0; index < 40; index += 1) {
      ctx.fillStyle = `rgba(22, 18, 12, ${0.05 + random() * 0.1})`;
      ctx.fillRect(random() * size, random() * size, 3 + random() * 12, 1);
    }
    ctx.strokeStyle = "rgba(218, 178, 116, 0.3)";
    ctx.lineWidth = 3;
    for (let band = 18; band < size; band += 52) ctx.strokeRect(band, 0, 5, size);
  });
}

function sunTexture() {
  return makeCanvasTexture(256, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 238, 197, 1)");
    gradient.addColorStop(0.18, "rgba(255, 204, 130, 0.9)");
    gradient.addColorStop(0.52, "rgba(224, 142, 73, 0.22)");
    gradient.addColorStop(1, "rgba(224, 142, 73, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
}

const CONTAINER_COLORS = [
  ["#7f3d32", "#d9a15c"],
  ["#2f4d55", "#82b0a6"],
  ["#4d5440", "#c7b375"],
  ["#6a4c33", "#d7b48a"],
  ["#3b3f45", "#a8b0b0"],
];

export class World {
  constructor(scene, renderer, quality = "high", mapId = "port") {
    this.scene = scene;
    this.renderer = renderer;
    this.quality = quality;
    this.map = mapById(mapId);
    this.mapId = this.map.id;
    this.mapLabel = this.map.arabic;
    // BR arenas are larger: their data carries its own bounds.
    this.bounds = this.map.bounds ?? { halfX: ARENA.halfX, halfZ: ARENA.halfZ };
    this.colliders = [];
    this.shootables = [];
    this.minimap = [];
    this.spawns = [];
    this.raycaster = new THREE.Raycaster();
    this.elapsed = 0;
    this.flags = [];
    this.missionMarkers = new Map();
    this.impactDecals = [];
    this.impactDecalIndex = 0;
    this.environmentDecals = [];
    this.buildings = 0;
    this.buildingSpots = [];

    this.buildEnvironment();
    this.buildArena();
    this.buildEnvironmentDecals();
    this.buildImpactDecals();
    this.buildMissionMarkers();
    this.buildLights();
    this.buildSpawns();
  }

  buildEnvironment() {
    const theme = this.map.environment ?? {};
    this.theme = theme;
    this.scene.background = new THREE.Color(theme.background ?? 0xb9b0a0);
    this.scene.fog = new THREE.Fog(theme.fog ?? 0xbfb4a2, theme.fogNear ?? 45, theme.fogFar ?? 120);
    if (this.renderer && Number.isFinite(theme.exposure)) this.renderer.toneMappingExposure = theme.exposure;

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(155, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          topColor: { value: new THREE.Color(theme.skyTop ?? 0x53646f) },
          bottomColor: { value: new THREE.Color(theme.skyBottom ?? 0xd9c5a7) },
          offset: { value: 24 },
          exponent: { value: 0.72 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
      }),
    );
    this.scene.add(sky);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture(this.map.seed, {
        base: theme.ground,
        stripe: theme.groundStripe,
        stain: theme.groundStain,
      }),
      roughness: 0.92,
      roughnessMap: roughnessTexture(this.map.seed, 8, 6),
      normalMap: normalTexture(this.map.seed, 8, 6),
      normalScale: new THREE.Vector2(0.28, 0.28),
      metalness: 0.06,
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.bounds.halfX * 2 + 12, this.bounds.halfZ * 2 + 12),
      groundMaterial,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.world = true;
    this.scene.add(ground);
    this.shootables.push(ground);

    const sun = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunTexture(),
        color: theme.sun ?? 0xffd8a0,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    sun.position.set(-42, 30, -70);
    sun.scale.set(24, 24, 1);
    this.scene.add(sun);

    // A muted skyline outside the playable area.
    const skylineMaterial = new THREE.MeshStandardMaterial({ color: theme.skyline ?? 0x62696a, roughness: 1, metalness: 0.05 });
    const skylineRandom = seededRandom(this.map.seed + 17);
    for (let index = 0; index < 18; index += 1) {
      const width = 3 + skylineRandom() * 5;
      const height = 5 + skylineRandom() * 14;
      const depth = 3 + skylineRandom() * 5;
      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), skylineMaterial);
      const side = index % 4;
      const along = -42 + (index / 17) * 84;
      building.position.set(
        side === 0 ? along : side === 1 ? along : side === 2 ? -50 : 50,
        height / 2,
        side === 0 ? -45 : side === 1 ? 45 : along,
      );
      building.rotation.y = skylineRandom() * 0.2;
      this.scene.add(building);
    }
  }

  addCollider(x, y, z, width, height, depth) {
    const collider = createBox(x, y, z, width, height, depth);
    this.colliders.push(collider);
    return collider;
  }

  buildEnvironmentDecals() {
    const budget = this.quality === "low" ? 6 : 12;
    const geometry = new THREE.CircleGeometry(1, 18);
    const kinds = ["oil", "water", "dirt"];
    const materials = kinds.map((kind, index) => new THREE.MeshBasicMaterial({
      map: stainTexture(kind, this.map.seed + 311 + index * 47),
      transparent: true,
      opacity: kind === "water" ? 0.45 : kind === "oil" ? 0.66 : 0.5,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }));
    const random = seededRandom(this.map.seed + 771);
    let placed = 0;
    for (let attempt = 0; attempt < budget * 16 && placed < budget; attempt += 1) {
      const x = (random() * 2 - 1) * (this.bounds.halfX - 3);
      const z = (random() * 2 - 1) * (this.bounds.halfZ - 3);
      if (this.isBlockedGround(x, z, 1.6)) continue;
      const index = Math.floor(random() * kinds.length);
      const mesh = new THREE.Mesh(geometry, materials[index]);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = random() * Math.PI;
      const radius = 0.7 + random() * 1.5;
      mesh.scale.set(radius * (0.85 + random() * 0.45), radius * (0.7 + random() * 0.45), 1);
      mesh.position.set(x, 0.006 + placed * 0.0006, z);
      mesh.userData.environmentDecal = true;
      this.scene.add(mesh);
      this.environmentDecals.push(mesh);
      placed += 1;
    }
  }

  // Keep stains out of container footprints; they are ground decals, not props.
  isBlockedGround(x, z, padding = 1) {
    return this.colliders.some((collider) => (
      x > collider.min.x - padding
      && x < collider.max.x + padding
      && z > collider.min.z - padding
      && z < collider.max.z + padding
    ));
  }

  buildImpactDecals() {
    const geometry = new THREE.CircleGeometry(0.055, 10);
    const ringGeometry = new THREE.RingGeometry(0.07, 0.095, 10);
    for (let index = 0; index < 48; index += 1) {
      const group = new THREE.Group();
      const mark = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0x17130f,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      const ring = new THREE.Mesh(
        ringGeometry,
        new THREE.MeshBasicMaterial({
          color: 0x8e6244,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      mark.rotation.z = (index * 0.53) % Math.PI;
      ring.rotation.z = mark.rotation.z;
      group.add(mark, ring);
      group.visible = false;
      group.userData.impactDecal = true;
      this.scene.add(group);
      this.impactDecals.push({ group, mark, ring, life: 0 });
    }
  }

  addImpactDecal(point, normal, color = 0x8e6244) {
    if (!point || !normal) return;
    const decal = this.impactDecals[this.impactDecalIndex];
    this.impactDecalIndex = (this.impactDecalIndex + 1) % this.impactDecals.length;
    const direction = normal.clone().normalize();
    decal.group.position.copy(point).addScaledVector(direction, 0.008);
    decal.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    decal.mark.material.opacity = 0.86;
    decal.ring.material.color.setHex(color);
    decal.ring.material.opacity = 0.7;
    decal.group.visible = true;
    decal.life = 34;
  }

  addContainer(x, z, width, depth, height, colorIndex, rotation = 0, elevation = 0) {
    const [base, accent] = CONTAINER_COLORS[colorIndex % CONTAINER_COLORS.length];
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhysicalMaterial({
      map: containerTexture(base, accent),
      roughness: 0.78,
      roughnessMap: roughnessTexture(this.map.seed + colorIndex * 31, 1.2, 1.4),
      normalMap: normalTexture(this.map.seed + colorIndex * 43, 1.2, 1.4),
      normalScale: new THREE.Vector2(0.42, 0.42),
      metalness: 0.32,
      clearcoat: 0.12,
      clearcoatRoughness: 0.56,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2 + elevation, z);
    mesh.rotation.y = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.world = true;
    this.scene.add(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x24231f, transparent: true, opacity: 0.24 }),
    );
    mesh.add(edges);
    const doorLines = new THREE.BufferGeometry();
    const doorX = width * 0.34;
    const doorBottom = -height * 0.38;
    const doorTop = height * 0.38;
    const doorZ = depth / 2 + 0.012;
    doorLines.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([
        -doorX, doorBottom, doorZ, -doorX, doorTop, doorZ,
        doorX, doorBottom, doorZ, doorX, doorTop, doorZ,
        -doorX, 0, doorZ, doorX, 0, doorZ,
      ], 3),
    );
    mesh.add(new THREE.LineSegments(
      doorLines,
      new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.62 }),
    ));
    const cornerMaterial = new THREE.MeshStandardMaterial({ color: 0x202828, roughness: 0.42, metalness: 0.78 });
    for (const side of [-1, 1]) {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(0.075, height * 0.92, 0.075), cornerMaterial);
      corner.position.set(side * (width * 0.46), 0, depth / 2 + 0.035);
      mesh.add(corner);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.018, 8), cornerMaterial);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(side * (width * 0.41), height * 0.34, depth / 2 + 0.045);
      mesh.add(bolt);
    }
    const serialPlate = new THREE.Mesh(
      new THREE.BoxGeometry(Math.min(width * 0.28, 1.4), 0.08, 0.018),
      new THREE.MeshStandardMaterial({ color: 0x1f2524, roughness: 0.58, metalness: 0.48 }),
    );
    serialPlate.position.set(0, 0.12, doorZ + 0.006);
    mesh.add(serialPlate);
    this.shootables.push(mesh);

    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    const boxWidth = width * cos + depth * sin;
    const boxDepth = width * sin + depth * cos;
    this.addCollider(x, height / 2 + elevation, z, boxWidth, height, boxDepth);
    this.minimap.push({ x, z, w: boxWidth, d: boxDepth, type: "container", color: base });
    return mesh;
  }

  addCrate(x, z, size = 1.6, height = 1.2, rotation = 0) {
    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshPhysicalMaterial({
      map: crateTexture(),
      roughness: 0.86,
      roughnessMap: roughnessTexture(this.map.seed + Math.round(x * 17 + z * 11), 1.2, 1.2),
      normalMap: normalTexture(this.map.seed + Math.round(x * 19 + z * 13), 1.2, 1.2),
      normalScale: new THREE.Vector2(0.34, 0.34),
      metalness: 0.08,
      clearcoat: 0.06,
      clearcoatRoughness: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.rotation.y = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.world = true;
    this.scene.add(mesh);
    this.shootables.push(mesh);
    this.addCollider(x, height / 2, z, size, height, size);
    this.minimap.push({ x, z, w: size, d: size, type: "crate", color: "#7c6749" });
  }

  addBarrier(x, z, width = 3.2, rotation = 0) {
    const height = 0.95;
    const geometry = new THREE.BoxGeometry(width, height, 0.5);
    const material = new THREE.MeshPhysicalMaterial({ color: 0x858b87, roughness: 0.76, metalness: 0.32, clearcoat: 0.1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.rotation.y = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.world = true;
    this.scene.add(mesh);
    const hazard = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.88, 0.075, 0.52),
      new THREE.MeshStandardMaterial({ color: 0xd19a55, roughness: 0.68, metalness: 0.18 }),
    );
    hazard.position.set(0, height * 0.42, 0);
    hazard.rotation.z = Math.PI * 0.04;
    mesh.add(hazard);
    this.shootables.push(mesh);
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    this.addCollider(x, height / 2, z, width * cos + 0.5 * sin, height, width * sin + 0.5 * cos);
    this.minimap.push({ x, z, w: width, d: 0.5, type: "barrier", color: "#9b9c92", rotation });
  }

  addBarrel(x, z) {
    const geometry = new THREE.CylinderGeometry(0.45, 0.45, 1.1, 12);
    const material = new THREE.MeshPhysicalMaterial({ color: 0x4f5b4e, roughness: 0.58, metalness: 0.58, clearcoat: 0.14 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.55, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.world = true;
    this.scene.add(mesh);
    this.shootables.push(mesh);
    this.addCollider(x, 0.55, z, 0.9, 1.1, 0.9);
    this.minimap.push({ x, z, w: 0.9, d: 0.9, type: "barrel", color: "#4f5b4e" });
  }

  addLightPole(x, z) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 6.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a3c39, roughness: 0.6, metalness: 0.4 }),
    );
    pole.position.set(x, 3.25, z);
    pole.castShadow = true;
    this.scene.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 8),
      new THREE.MeshBasicMaterial({ color: this.theme?.lamp ?? 0xffd7a0 }),
    );
    lamp.position.set(x, 6.45, z);
    this.scene.add(lamp);
    const light = new THREE.PointLight(this.theme?.lamp ?? 0xffc98a, 12, 18, 2);
    light.position.set(x, 6.2, z);
    this.scene.add(light);
  }

  buildArena() {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666c68, roughness: 0.9, metalness: 0.08 });
    const wallHeight = 4.2;
    const walls = [
      [0, -this.bounds.halfZ - 0.6, this.bounds.halfX * 2 + 2.4, wallHeight, 1.2],
      [0, this.bounds.halfZ + 0.6, this.bounds.halfX * 2 + 2.4, wallHeight, 1.2],
      [-this.bounds.halfX - 0.6, 0, 1.2, wallHeight, this.bounds.halfZ * 2 + 2.4],
      [this.bounds.halfX + 0.6, 0, 1.2, wallHeight, this.bounds.halfZ * 2 + 2.4],
    ];
    for (const [x, z, width, height, depth] of walls) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
      wall.position.set(x, height / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.userData.world = true;
      this.scene.add(wall);
      this.shootables.push(wall);
      this.addCollider(x, height / 2, z, width, height, depth);
      this.minimap.push({ x, z, w: width, d: depth, type: "wall", color: "#76786f" });
    }

    for (const [x, z, w, d, h, color, rotation = 0, elevation = 0] of this.map.containers) {
      this.addContainer(x, z, w, d, h, color, rotation, elevation);
    }

    for (const [x, z, baseHeight] of this.map.stairs ?? []) {
      const step = Math.round((3.72 - baseHeight) / 0.62);
      const height = 0.32 * (step + 1);
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, height, 0.64),
        new THREE.MeshStandardMaterial({ color: 0x6f7168, roughness: 0.9 }),
      );
      stair.position.set(x, height / 2, z);
      stair.castShadow = true;
      stair.receiveShadow = true;
      stair.userData.world = true;
      this.scene.add(stair);
      this.shootables.push(stair);
      this.addCollider(x, height / 2, z, 2.4, height, 0.64);
      this.minimap.push({ x, z, w: 2.4, d: 0.64, type: "stair", color: "#6f7168" });
    }

    for (const [x, z, size, height, rotation] of this.map.crates) this.addCrate(x, z, size, height, rotation);
    for (const [x, z, width, rotation] of this.map.barriers) this.addBarrier(x, z, width, rotation);
    for (const [x, z] of this.map.barrels) this.addBarrel(x, z);
    for (const [x, z] of this.map.lights) this.addLightPole(x, z);
    this.buildBuildings();

    // Painted ground markers, original geometry only.
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xd8b36a, transparent: true, opacity: 0.32 });
    for (const [x, z, width, depth] of this.map.markers) {
      const marker = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, 0.012, z);
      this.scene.add(marker);
    }
    this.addGroundDetails();
  }

  buildBuildings() {
    const styles = [
      { wall: 0x8d8778, trim: 0x5d594e, roof: 0x3f4441 },
      { wall: 0x9d907a, trim: 0x6d6454, roof: 0x4a4a43 },
      { wall: 0x7f8789, trim: 0x556063, roof: 0x353b3c },
    ];
    this.buildingMaterials = styles.map((style, index) => ({
      wall: new THREE.MeshStandardMaterial({
        color: style.wall,
        roughness: 0.9,
        metalness: 0.04,
        roughnessMap: roughnessTexture(this.map.seed + 600 + index, 2, 1),
        normalMap: normalTexture(this.map.seed + 640 + index, 2, 1),
        normalScale: new THREE.Vector2(0.25, 0.25),
      }),
      trim: new THREE.MeshStandardMaterial({ color: style.trim, roughness: 0.82, metalness: 0.08 }),
      roof: new THREE.MeshStandardMaterial({ color: style.roof, roughness: 0.94, metalness: 0.03 }),
    }));
    this.windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x18282d,
      roughness: 0.18,
      metalness: 0.42,
      emissive: 0x0a1214,
      emissiveIntensity: 0.4,
    });
    this.buildingLampMaterial = new THREE.MeshBasicMaterial({ color: 0xffdca8 });

    const explicit = this.map.houseSpots ?? null;
    let placed = 0;
    if (explicit) {
      for (const [x, z, w, d, h, rotation, style = 0] of explicit) {
        this.addBuilding(x, z, w, d, h, rotation, style);
        placed += 1;
      }
    }

    const random = seededRandom(this.map.seed + 1201);
    const target = this.map.buildingCount ?? (this.map.battleRoyale ? 7 : 3);
    if (placed >= target) return;
    for (let attempt = 0; attempt < target * 90 && placed < target; attempt += 1) {
      const width = (this.map.battleRoyale ? 6.5 : 5.2) + random() * (this.map.battleRoyale ? 4.5 : 2.4);
      const depth = (this.map.battleRoyale ? 5.8 : 4.8) + random() * (this.map.battleRoyale ? 3.2 : 2.2);
      const height = 3.7 + random() * 1.5;
      const rotation = Math.floor(random() * 4) * (Math.PI / 2);
      const x = (random() * 2 - 1) * Math.max(2, this.bounds.halfX - width / 2 - 3);
      const z = (random() * 2 - 1) * Math.max(2, this.bounds.halfZ - depth / 2 - 3);
      if (!this.canPlaceBuilding(x, z, width, depth, rotation)) continue;
      this.addBuilding(x, z, width, depth, height, rotation, Math.floor(random() * styles.length));
      placed += 1;
    }
  }

  canPlaceBuilding(x, z, width, depth, rotation) {
    const swap = Math.abs(Math.sin(rotation)) > 0.5;
    const sizeX = swap ? depth : width;
    const sizeZ = swap ? width : depth;
    if (Math.abs(x) + sizeX / 2 > this.bounds.halfX - 2) return false;
    if (Math.abs(z) + sizeZ / 2 > this.bounds.halfZ - 2) return false;
    const footprint = {
      minX: x - sizeX / 2 - 0.9,
      maxX: x + sizeX / 2 + 0.9,
      minZ: z - sizeZ / 2 - 0.9,
      maxZ: z + sizeZ / 2 + 0.9,
    };
    for (const collider of this.colliders) {
      if (
        footprint.minX < collider.max.x &&
        footprint.maxX > collider.min.x &&
        footprint.minZ < collider.max.z &&
        footprint.maxZ > collider.min.z
      ) {
        return false;
      }
    }
    for (const spawn of this.map.spawns ?? []) {
      if (Math.hypot(spawn.x - x, spawn.z - z) < 6) return false;
    }
    for (const point of Object.values(this.map.missionPoints ?? {})) {
      if (Math.hypot(point.x - x, point.z - z) < 6) return false;
    }
    return true;
  }

  addBuilding(x, z, width, depth, height, rotation = 0, styleIndex = 0) {
    this.buildings += 1;
    this.buildingSpots.push({ x, z, width, depth, height, rotation });
    const style = this.buildingMaterials[styleIndex % this.buildingMaterials.length];
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    this.scene.add(group);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const swap = Math.abs(sin) > 0.5;
    const thickness = 0.24;
    const doorWidth = Math.min(1.8, width * 0.3);
    const doorHeight = 2.35;
    const frontZ = -depth / 2 + thickness / 2;
    const backZ = depth / 2 - thickness / 2;

    const worldPosition = (localX, localZ) => ({
      x: x + localX * cos + localZ * sin,
      z: z - localX * sin + localZ * cos,
    });
    const box = (localX, localY, localZ, sizeX, sizeY, sizeZ, material, { collide = true, minimap = false } = {}) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sizeX, sizeY, sizeZ), material);
      mesh.position.set(localX, localY, localZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.world = true;
      group.add(mesh);
      this.shootables.push(mesh);
      const world = worldPosition(localX, localZ);
      if (collide) {
        this.addCollider(world.x, localY, world.z, swap ? sizeZ : sizeX, sizeY, swap ? sizeX : sizeZ);
      }
      if (minimap) {
        this.minimap.push({ x: world.x, z: world.z, w: swap ? sizeZ : sizeX, d: swap ? sizeX : sizeZ, type: "building", color: "#8a8374" });
      }
      return mesh;
    };

    // Floor slab and flat roof with a parapet.
    box(0, 0.05, 0, width, 0.1, depth, style.trim, { collide: false });
    box(0, height + 0.01, 0, width + 0.4, 0.2, depth + 0.4, style.roof, { minimap: true });
    for (const [edgeX, edgeZ, edgeW, edgeD] of [
      [0, -depth / 2 - 0.1, width + 0.4, 0.18],
      [0, depth / 2 + 0.1, width + 0.4, 0.18],
      [-width / 2 - 0.1, 0, 0.18, depth + 0.4],
      [width / 2 + 0.1, 0, 0.18, depth + 0.4],
    ]) {
      box(edgeX, height + 0.25, edgeZ, edgeW, 0.5, edgeD, style.trim);
    }

    // Front wall: two pier segments plus a lintel above the doorway.
    const pierWidth = (width - doorWidth) / 2;
    if (pierWidth > 0.2) {
      box(-width / 2 + pierWidth / 2, height / 2, frontZ, pierWidth, height, thickness, style.wall);
      box(width / 2 - pierWidth / 2, height / 2, frontZ, pierWidth, height, thickness, style.wall);
    }
    if (height > doorHeight) {
      box(0, doorHeight + (height - doorHeight) / 2, frontZ, doorWidth, height - doorHeight, thickness, style.wall);
    }
    box(0, height / 2, backZ, width, height, thickness, style.wall);
    box(-width / 2 + thickness / 2, height / 2, 0, thickness, height, depth - thickness * 2, style.wall);
    box(width / 2 - thickness / 2, height / 2, 0, thickness, height, depth - thickness * 2, style.wall);

    // Corner posts, a roof fascia and a plinth break up the flat wall panels.
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        box(sideX * (width / 2 - 0.02), height / 2, sideZ * (depth / 2 - 0.02), 0.2, height, 0.2, style.trim, { collide: false });
      }
      box(sideX * (width / 2 - 0.02), 0.2, 0, 0.24, 0.4, depth, style.trim, { collide: false });
    }
    box(0, height - 0.08, 0, width + 0.12, 0.2, depth + 0.12, style.trim, { collide: false });
    box(0, 0.2, backZ - 0.01, width - 0.3, 0.4, 0.05, style.trim, { collide: false });

    // Door frame and a small entry step.
    box(-doorWidth / 2 - 0.06, doorHeight / 2, frontZ - 0.03, 0.12, doorHeight, 0.14, style.trim, { collide: false });
    box(doorWidth / 2 + 0.06, doorHeight / 2, frontZ - 0.03, 0.12, doorHeight, 0.14, style.trim, { collide: false });
    box(0, doorHeight + 0.08, frontZ - 0.03, doorWidth + 0.24, 0.16, 0.14, style.trim, { collide: false });
    box(0, 0.08, frontZ - 0.48, doorWidth + 0.3, 0.16, 0.7, style.trim, { collide: false });
    box(0, doorHeight + 0.35, frontZ - 0.48, doorWidth + 0.8, 0.12, 1.0, style.trim, { collide: false });
    box(0, doorHeight + 0.1, frontZ - 0.6, 0.34, 0.12, 0.22, this.buildingLampMaterial, { collide: false });

    // Side windows: a dark pane with a proud frame, readable from a distance.
    for (const side of [-1, 1]) {
      const paneX = side * (width / 2 + 0.015);
      const frameX = side * (width / 2 + 0.03);
      box(frameX, 1.6, 0, 0.07, 1.36, depth * 0.42, style.trim, { collide: false });
      box(paneX, 1.6, 0, 0.09, 1.1, depth * 0.32, this.windowMaterial, { collide: false });
    }
    if (width > 4.6) {
      const paneWidth = Math.min(1.25, Math.max(0.6, (width - doorWidth) / 2 - 0.3));
      const frontFace = frontZ - thickness / 2;
      const backFace = backZ + thickness / 2;
      for (const side of [-1, 1]) {
        const paneX = side * (doorWidth / 2 + 0.15 + paneWidth / 2);
        box(paneX, 1.62, frontFace - 0.03, paneWidth, 1.08, 0.08, this.windowMaterial, { collide: false });
        box(paneX, 1.62, frontFace - 0.07, paneWidth + 0.2, 1.26, 0.06, style.trim, { collide: false });
        box(paneX, 1.62, backFace + 0.03, paneWidth, 1.08, 0.08, this.windowMaterial, { collide: false });
        box(paneX, 1.62, backFace + 0.07, paneWidth + 0.2, 1.26, 0.06, style.trim, { collide: false });
      }
    }

    // Rooftop plant gives the silhouette a believable skyline.
    box(width * 0.24, height + 0.42, 0, 1.15, 0.55, 0.95, style.trim);
    box(width * 0.24, height + 0.82, 0, 0.72, 0.22, 0.62, style.roof, { collide: false });
    box(-width * 0.24, height + 0.3, 0, 0.16, 0.4, 0.16, style.trim, { collide: false });

    // A desk and a shelf give the interior a readable function through the doorway.
    if (width > 6.5) {
      box(-width * 0.18, 0.48, 0.45, 2.0, 0.9, 0.8, style.trim);
      box(width * 0.28, 0.9, -depth * 0.18, 0.9, 1.8, 0.5, style.trim);
    }

    // Two-story building: adds upper floor, staircase, and second-story sniper windows
    if (height >= 5.0) {
      const midY = height * 0.5;
      // Upper floor slab (with opening for staircase on left side)
      box(width * 0.12, midY, 0, width * 0.7, 0.15, depth - thickness * 2.2, style.trim, { collide: true });

      // Interior tactical staircase along the left wall
      const steps = 5;
      const stepH = midY / steps;
      const stepD = (depth * 0.6) / steps;
      for (let s = 1; s <= steps; s += 1) {
        box(
          -width / 2 + 0.85,
          (s * stepH) / 2,
          -depth * 0.3 + (s - 0.5) * stepD,
          1.2,
          s * stepH,
          stepD,
          style.trim,
          { collide: true },
        );
      }

      // Upper floor front & back sniper windows
      box(width * 0.15, midY + 1.35, frontZ - thickness / 2 - 0.02, 1.4, 0.95, 0.08, this.windowMaterial, { collide: false });
      box(width * 0.15, midY + 1.35, backZ + thickness / 2 + 0.02, 1.4, 0.95, 0.08, this.windowMaterial, { collide: false });
    }

    box(0, height - 0.14, 0, 0.62, 0.06, 0.62, this.buildingLampMaterial, { collide: false });
  }

  addGroundDetails() {
    const random = seededRandom(this.map.seed + 777);
    const stainMaterial = new THREE.MeshBasicMaterial({
      color: 0x202521,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      premultipliedAlpha: true,
      blending: THREE.MultiplyBlending,
    });
    for (let index = 0; index < 18; index += 1) {
      const width = 0.8 + random() * 2.8;
      const depth = 0.15 + random() * 0.48;
      const stain = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), stainMaterial.clone());
      stain.rotation.x = -Math.PI / 2;
      stain.rotation.z = random() * Math.PI;
      stain.position.set(-30 + random() * 60, 0.016, -20 + random() * 40);
      stain.material.opacity = 0.08 + random() * 0.12;
      this.scene.add(stain);
    }
  }

  buildMissionMarkers() {
    for (const point of Object.values(this.map.missionPoints ?? {})) {
      const group = new THREE.Group();
      group.position.set(point.x, 0.04, point.z);
      group.visible = false;

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(1.3, point.radius * 0.58), 0.055, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0xd8a35a, transparent: true, opacity: 0.88, depthWrite: false }),
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.12, 2.2, 8),
        new THREE.MeshBasicMaterial({ color: 0x75c5c4, transparent: true, opacity: 0.42, depthWrite: false }),
      );
      beacon.position.y = 1.1;
      group.add(beacon);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.92, depthWrite: false }),
      );
      cap.position.y = 2.25;
      group.add(cap);

      this.scene.add(group);
      this.missionMarkers.set(point.id, { group, ring, beacon, point });
    }
  }

  getMissionPoint(pointId) {
    return this.map.missionPoints?.[pointId] ?? null;
  }

  setMissionObjective(pointId = null) {
    for (const [id, marker] of this.missionMarkers) marker.group.visible = Boolean(pointId && id === pointId);
  }

  buildLights() {
    const hemisphere = new THREE.HemisphereLight(
      this.theme?.hemisphereSky ?? 0xc7d3d8,
      this.theme?.hemisphereGround ?? 0x40382e,
      this.mapId === "nightBazaar" ? 0.72 : 1.08,
    );
    this.scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(this.theme?.keyLight ?? 0xffd2a0, this.mapId === "nightBazaar" ? 1.55 : 3.15);
    sun.position.set(-28, 42, 26);
    sun.castShadow = this.quality === "high";
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -44;
    sun.shadow.camera.right = 44;
    sun.shadow.camera.top = 34;
    sun.shadow.camera.bottom = -34;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 110;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(this.theme?.fillLight ?? 0x7fa2b8, this.mapId === "nightBazaar" ? 0.62 : 0.38);
    fill.position.set(24, 18, -30);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(this.mapId === "nightBazaar" ? 0x78a8bd : 0x8aa1ad, 0.34);
    rim.position.set(-18, 12, -34);
    rim.target.position.set(0, 0, 0);
    this.scene.add(rim.target);
    this.scene.add(rim);

    this.buildAtmosphere();
  }

  buildAtmosphere() {
    // Additive sun flare: a cheap stand-in for bloom without a post-processing pass.
    const flareCanvas = document.createElement("canvas");
    flareCanvas.width = 128;
    flareCanvas.height = 128;
    const context = flareCanvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 240, 210, 0.95)");
    gradient.addColorStop(0.22, "rgba(255, 212, 150, 0.48)");
    gradient.addColorStop(1, "rgba(255, 190, 120, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const flareTexture = new THREE.CanvasTexture(flareCanvas);
    flareTexture.colorSpace = THREE.SRGBColorSpace;
    const flare = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flareTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        opacity: 0.8,
      }),
    );
    flare.scale.setScalar(this.mapId === "nightBazaar" ? 24 : 38);
    flare.position.set(-140, 96, 130);
    this.scene.add(flare);

    // Dust motes give the arena depth without costing a draw call per particle.
    const count = this.quality === "low" ? 180 : 420;
    const positions = new Float32Array(count * 3);
    this.dustSpeed = new Float32Array(count);
    const dustRandom = seededRandom(this.map.seed + 990);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (dustRandom() - 0.5) * 70;
      positions[index * 3 + 1] = dustRandom() * 14 + 0.4;
      positions[index * 3 + 2] = (dustRandom() - 0.5) * 54;
      this.dustSpeed[index] = 0.15 + dustRandom() * 0.5;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffe6c2,
        size: 0.06,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  buildSpawns() {
    this.spawns = this.map.spawns.map((spawn) => ({ ...spawn }));
  }

  getSpawn(index = 0) {
    return this.spawns[index % this.spawns.length];
  }

  resolveMovement(position, delta, radius, height, stepHeight = 0) {
    return moveWithCollisions(position, delta, radius, height, this.colliders, stepHeight);
  }

  raycast(origin, direction, far = 120) {
    this.raycaster.set(origin, direction);
    this.raycaster.far = far;
    const hits = this.raycaster.intersectObjects(this.shootables, false);
    return hits.length ? hits[0] : null;
  }

  hasLineOfSight(from, to) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const distance = direction.length();
    if (distance < 0.01) return true;
    direction.normalize();
    this.raycaster.set(from, direction);
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(this.shootables, false);
    return !hits.some((hit) => hit.distance < distance - 0.35);
  }

  // Segment test against the AABB list; cheaper than a mesh ray for AI vision.
  hasClearSegment(from, to) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const distance = direction.length();
    if (distance < 0.01) return true;
    direction.normalize();
    const origin = { x: from.x, y: from.y, z: from.z };
    const dir = { x: direction.x, y: direction.y, z: direction.z };
    for (const collider of this.colliders) {
      if (segmentHitsBox(origin, dir, distance - 0.35, collider)) return false;
    }
    return true;
  }

  update(dt) {
    this.elapsed += dt;
    for (const decal of this.impactDecals) {
      if (decal.life <= 0) continue;
      decal.life -= dt;
      const fade = Math.min(1, decal.life / 4);
      decal.mark.material.opacity = 0.86 * fade;
      decal.ring.material.opacity = 0.7 * fade;
      if (decal.life <= 0) decal.group.visible = false;
    }
    if (this.dust) {
      const attribute = this.dust.geometry.attributes.position;
      const array = attribute.array;
      for (let index = 0; index < this.dustSpeed.length; index += 1) {
        array[index * 3 + 1] += this.dustSpeed[index] * dt;
        if (array[index * 3 + 1] > 14.5) array[index * 3 + 1] = 0.4;
      }
      attribute.needsUpdate = true;
    }
    for (const marker of this.missionMarkers.values()) {
      if (!marker.group.visible) continue;
      marker.ring.rotation.z += dt * 0.9;
      marker.beacon.material.opacity = 0.26 + (Math.sin(this.elapsed * 3.2) + 1) * 0.12;
      marker.group.position.y = 0.04 + Math.sin(this.elapsed * 2.1) * 0.025;
    }
    this.updateTempBarriers(dt);
    if (this.stormWall?.visible) {
      this.stormWall.material.opacity = 0.2 + (Math.sin(this.elapsed * 2.4) + 1) * 0.06;
      this.stormWall.rotation.y += dt * 0.05;
    }
  }

  /** Deployable cover (Atlas barrier): visible mesh + collider, auto-expires. */
  addTempBarrier(x, z, yaw, { width = 2.6, height = 1.38, duration = 14 } = {}) {
    const thickness = 0.28;
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a5660,
      emissive: 0x58c7d9,
      emissiveIntensity: 0.38,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0.94,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), material);
    mesh.position.set(x, height / 2, z);
    mesh.rotation.y = yaw;
    mesh.castShadow = true;
    mesh.userData.world = true;
    this.scene.add(mesh);
    this.shootables.push(mesh);
    // Axis-aligned collider that fits the rotated footprint.
    const cos = Math.abs(Math.cos(yaw));
    const sin = Math.abs(Math.sin(yaw));
    const sizeX = width * cos + thickness * sin;
    const sizeZ = width * sin + thickness * cos;
    const collider = this.addCollider(x, height / 2, z, sizeX, height, sizeZ);
    this.tempBarriers ??= [];
    const barrier = { mesh, collider, life: duration, maxLife: duration };
    this.tempBarriers.push(barrier);
    return barrier;
  }

  updateTempBarriers(dt) {
    if (!this.tempBarriers?.length) return;
    for (let index = this.tempBarriers.length - 1; index >= 0; index -= 1) {
      const barrier = this.tempBarriers[index];
      barrier.life -= dt;
      if (barrier.life < 2) barrier.mesh.material.opacity = 0.35 + Math.abs(Math.sin(this.elapsed * 12)) * 0.5;
      if (barrier.life <= 0) this.removeTempBarrier(barrier, index);
    }
  }

  removeTempBarrier(barrier, index = this.tempBarriers.indexOf(barrier)) {
    this.scene.remove(barrier.mesh);
    barrier.mesh.geometry.dispose();
    barrier.mesh.material.dispose();
    const shootIndex = this.shootables.indexOf(barrier.mesh);
    if (shootIndex >= 0) this.shootables.splice(shootIndex, 1);
    const colliderIndex = this.colliders.indexOf(barrier.collider);
    if (colliderIndex >= 0) this.colliders.splice(colliderIndex, 1);
    if (index >= 0) this.tempBarriers.splice(index, 1);
  }

  clearTempBarriers() {
    for (const barrier of [...(this.tempBarriers ?? [])]) this.removeTempBarrier(barrier);
  }

  /** Visible storm wall for the Battle Royale zone (open cylinder, additive). */
  setStormZone(zone) {
    if (!zone) {
      if (this.stormWall) this.stormWall.visible = false;
      return;
    }
    if (!this.stormWall) {
      const geometry = new THREE.CylinderGeometry(1, 1, 36, 72, 1, true);
      const material = new THREE.MeshBasicMaterial({
        color: 0x58c7d9,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      });
      this.stormWall = new THREE.Mesh(geometry, material);
      this.stormWall.position.y = 17;
      this.stormWall.frustumCulled = false;
      this.scene.add(this.stormWall);
    }
    const radius = Math.max(1, zone.radius);
    this.stormWall.visible = true;
    this.stormWall.scale.set(radius, 1, radius);
    this.stormWall.position.x = zone.center.x;
    this.stormWall.position.z = zone.center.z;
  }

  dispose() {
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
      }
    });
  }
}

export { ARENA };
