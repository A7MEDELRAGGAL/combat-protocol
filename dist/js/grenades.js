import * as THREE from "../vendor/three.module.js";
import { GRENADE_DEF, computeBlastDamage } from "./grenade-rules.js";

export class GrenadeSystem {
  constructor({ scene, camera, player, world, enemies, audio, callbacks = {} }) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.world = world;
    this.enemies = enemies;
    this.audio = audio;
    this.callbacks = callbacks;
    this.charges = GRENADE_DEF.capacity;
    this.active = [];
    this.effects = [];
    this.nextThrow = 0;
    this.geometry = new THREE.SphereGeometry(0.14, 10, 8);
    this.material = new THREE.MeshStandardMaterial({ color: 0x4d5749, roughness: 0.64, metalness: 0.38, emissive: 0x151a13 });
    this.breachGeometry = new THREE.BoxGeometry(0.22, 0.12, 0.26);
    this.breachMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3638,
      roughness: 0.45,
      metalness: 0.55,
      emissive: 0xd9a45c,
      emissiveIntensity: 0.45,
    });
    this.effectGeometry = new THREE.SphereGeometry(0.55, 16, 12);
    this.ringGeometry = new THREE.TorusGeometry(0.75, 0.08, 8, 28);
  }

  reset(count = GRENADE_DEF.capacity) {
    for (const grenade of this.active) this.scene.remove(grenade.mesh);
    for (const effect of this.effects) this.scene.remove(effect.mesh);
    this.active = [];
    this.effects = [];
    this.charges = count;
    this.nextThrow = 0;
  }

  tryThrow(now = performance.now() / 1000) {
    if (this.charges <= 0 || now < this.nextThrow || this.player.dead) return false;
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.position.copy(origin).addScaledVector(direction, 0.7);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.active.push({
      mesh,
      kind: "frag",
      radius: GRENADE_DEF.radius,
      maxDamage: GRENADE_DEF.maxDamage,
      selfDamage: true,
      velocity: direction.multiplyScalar(GRENADE_DEF.throwSpeed).add(new THREE.Vector3(0, 4.2, 0)),
      fuse: GRENADE_DEF.fuseSeconds,
    });
    this.charges -= 1;
    this.nextThrow = now + 0.28;
    this.callbacks.onThrow?.({ charges: this.charges });
    return true;
  }

  launchBreachCharge({ radius = 4.8, maxDamage = 88 } = {}) {
    if (this.player.dead) return false;
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const mesh = new THREE.Mesh(this.breachGeometry, this.breachMaterial);
    mesh.position.copy(origin).addScaledVector(direction, 0.75);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.active.push({
      mesh,
      kind: "breach",
      sticky: true,
      stuck: false,
      radius,
      maxDamage,
      selfDamage: false,
      velocity: direction.multiplyScalar(22).add(new THREE.Vector3(0, 2.2, 0)),
      fuse: 0.72,
    });
    return true;
  }

  update(dt) {
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      const grenade = this.active[index];
      grenade.fuse -= dt;
      if (!grenade.stuck) {
        grenade.velocity.y -= GRENADE_DEF.gravity * dt;
        const contact = this.world.resolveMovement(
          grenade.mesh.position,
          grenade.velocity.clone().multiplyScalar(dt),
          0.16,
          0.32,
          0,
        );
        if (grenade.sticky && (contact.hitWall || contact.grounded || contact.ceiling)) {
          grenade.stuck = true;
          grenade.velocity.set(0, 0, 0);
        } else {
          if (contact.hitX) grenade.velocity.x *= -0.58;
          if (contact.hitZ) grenade.velocity.z *= -0.58;
          if (contact.grounded || contact.ceiling) {
            grenade.velocity.y *= -0.45;
            grenade.velocity.x *= 0.84;
            grenade.velocity.z *= 0.84;
          }
          grenade.velocity.multiplyScalar(Math.max(0, 1 - dt * 0.22));
          grenade.mesh.rotation.x += dt * 9;
          grenade.mesh.rotation.z += dt * 7;
        }
      }
      if (grenade.fuse <= 0) {
        this.detonate(grenade);
        this.scene.remove(grenade.mesh);
        this.active.splice(index, 1);
      }
    }

    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];
      effect.life -= dt;
      const t = 1 - Math.max(0, effect.life / effect.maxLife);
      effect.mesh.scale.setScalar(1 + t * (effect.scaleGain ?? 5.5));
      effect.mesh.material.opacity = Math.max(0, effect.life / effect.maxLife) * (effect.baseOpacity ?? 0.65);
      if (effect.life <= 0) {
        this.scene.remove(effect.mesh);
        effect.mesh.material.dispose();
        this.effects.splice(index, 1);
      }
    }
  }

  detonate(grenade) {
    const point = grenade.mesh.position.clone();
    const isBreach = grenade.kind === "breach";
    const radius = grenade.radius ?? GRENADE_DEF.radius;
    const maxDamage = grenade.maxDamage ?? GRENADE_DEF.maxDamage;

    const flash = new THREE.Mesh(
      this.effectGeometry,
      new THREE.MeshBasicMaterial({
        color: isBreach ? 0x7fd8e8 : 0xffb45f,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    flash.position.copy(point);
    this.scene.add(flash);
    this.effects.push({ mesh: flash, life: 0.34, maxLife: 0.34, scaleGain: 6.2, baseOpacity: 0.72 });

    const shockRing = new THREE.Mesh(
      this.ringGeometry,
      new THREE.MeshBasicMaterial({
        color: isBreach ? 0xd9a45c : 0xffd08a,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    shockRing.position.set(point.x, Math.max(0.08, point.y), point.z);
    shockRing.rotation.x = Math.PI / 2;
    this.scene.add(shockRing);
    this.effects.push({ mesh: shockRing, life: 0.38, maxLife: 0.38, scaleGain: 5.8, baseOpacity: 0.78 });

    if (point.y < 1.2) {
      this.world.addImpactDecal?.(new THREE.Vector3(point.x, 0.02, point.z), new THREE.Vector3(0, 1, 0), 0x241d18);
    }

    for (const enemy of this.enemies.getActiveEnemies()) {
      if (enemy.dead || enemy.team === "ally") continue;
      const target = new THREE.Vector3(enemy.position.x, enemy.position.y + 0.9, enemy.position.z);
      const distance = point.distanceTo(target);
      const damage = computeBlastDamage(distance, radius, maxDamage);
      if (damage <= 0) continue;
      // Breach charges concuss through thin cover within half radius; frags require LOS.
      if (!isBreach && !this.world.hasLineOfSight(point, target)) continue;
      this.enemies.damage(enemy, damage, false, point, isBreach ? "breach" : "grenade");
    }

    const playerTarget = this.player.getEyePosition(new THREE.Vector3());
    const playerDistance = point.distanceTo(playerTarget);
    if (playerDistance < 18) {
      this.player.shake = Math.min(1.5, (this.player.shake ?? 0) + (1 - playerDistance / 18) * 0.95);
    }
    if (grenade.selfDamage !== false) {
      const playerDamage = computeBlastDamage(playerDistance, radius, maxDamage);
      if (playerDamage > 0 && !this.player.dead && this.world.hasLineOfSight(point, playerTarget)) {
        this.player.takeDamage(playerDamage, "grenade");
      }
    }

    this.audio?.explosion?.(point, this.player.position, this.player.yaw);
    this.callbacks.onDetonate?.({ point, radius, kind: grenade.kind ?? "frag" });
  }

  getState() {
    return { available: this.charges, active: this.active.length };
  }
}
