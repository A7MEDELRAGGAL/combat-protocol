import * as THREE from "../vendor/three.module.js";
import { createLootTable } from "./loot-data.js";
import { seededRandom } from "./utils.js";

const PICKUP_RADIUS = 2.4;

/**
 * Spawns rarity-coloured loot crates in the arena and reports the nearest one.
 * Visual only — the pickup effect is applied by the game loop.
 */
export class LootSystem {
  constructor({ scene, world }) {
    this.scene = scene;
    this.world = world;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.crates = [];
    this.elapsed = 0;
    this.geometry = new THREE.BoxGeometry(0.46, 0.32, 0.34);
    this.coreGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.02);
  }

  reset(seed = 1, count = 0) {
    this.clear();
    if (count <= 0) return;
    const items = createLootTable(seed, count);
    const random = seededRandom(seed * 31 + 7);
    const buildings = this.world.buildingSpots ?? [];
    for (const [index, item] of items.entries()) {
      let position = { x: 0, z: 0 };
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const bounds = this.world.bounds ?? { halfX: 34, halfZ: 24 };
        // Put a share of the loot inside buildings so interiors are worth entering.
        const indoor = buildings.length > 0 && (index % 3 === 0 || random() < 0.18);
        if (indoor) {
          const building = buildings[Math.floor(random() * buildings.length)];
          const spread = Math.min(building.width, building.depth) * 0.32;
          position = {
            x: building.x + (random() * 2 - 1) * spread,
            z: building.z + (random() * 2 - 1) * spread,
          };
        } else {
          position = {
            x: (random() * 2 - 1) * Math.max(4, bounds.halfX - 4),
            z: (random() * 2 - 1) * Math.max(4, bounds.halfZ - 4),
          };
        }
        // Keep crates out of walls and out of the player spawn lane.
        if (this.world.isBlockedGround?.(position.x, position.z, 0.7)) continue;
        if (Math.abs(position.x) < 3 && Math.abs(position.z - 15) < 4) continue;
        break;
      }
      const mesh = this.createCrate(item);
      mesh.position.set(position.x, 0.28, position.z);
      this.group.add(mesh);
      this.crates.push({ item, mesh, taken: false, baseY: 0.28, phase: random() * Math.PI * 2 });
    }
  }

  createCrate(item) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0x2a2f2b,
      emissive: new THREE.Color(item.color ?? "#d9a45c"),
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0.35,
    });
    const body = new THREE.Mesh(this.geometry, material);
    body.castShadow = true;
    group.add(body);

    const core = new THREE.Mesh(
      this.coreGeometry,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(item.color ?? "#d9a45c"), transparent: true, opacity: 0.95 }),
    );
    core.position.set(0, 0, 0.18);
    group.add(core);
    group.userData.item = item;
    return group;
  }

  clear() {
    for (const crate of this.crates) {
      this.group.remove(crate.mesh);
      crate.mesh.traverse((child) => {
        child.material?.dispose?.();
      });
    }
    this.crates = [];
  }

  update(dt, playerPosition) {
    this.elapsed += dt;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const crate of this.crates) {
      if (crate.taken) continue;
      crate.mesh.rotation.y += dt * 0.9;
      crate.mesh.position.y = crate.baseY + Math.sin(this.elapsed * 1.8 + crate.phase) * 0.06;
      if (!playerPosition) continue;
      const distance = Math.hypot(crate.mesh.position.x - playerPosition.x, crate.mesh.position.z - playerPosition.z);
      if (distance < PICKUP_RADIUS && distance < nearestDistance) {
        nearest = crate;
        nearestDistance = distance;
      }
    }
    this.nearestCrate = nearest;
    this.nearestDistance = nearest ? nearestDistance : Infinity;
    return nearest;
  }

  take(crate) {
    if (!crate || crate.taken) return null;
    crate.taken = true;
    crate.mesh.visible = false;
    return crate.item;
  }

  get remaining() {
    return this.crates.filter((crate) => !crate.taken).length;
  }
}

export { PICKUP_RADIUS };
