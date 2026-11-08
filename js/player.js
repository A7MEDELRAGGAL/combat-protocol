import * as THREE from "../vendor/three.module.js";
import { clamp, damp, hasOverheadObstacle } from "./utils.js";

const UP = new THREE.Vector3(0, 1, 0);

export class Player {
  constructor({ camera, world, settings }) {
    this.camera = camera;
    this.world = world;
    this.settings = settings;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 50;
    this.maxArmor = 100;
    this.radius = 0.36;
    this.standHeight = 1.78;
    this.crouchHeight = 1.22;
    this.slideHeight = 1.04;
    this.height = this.standHeight;
    this.eyeHeight = 1.64;
    this.grounded = true;
    this.crouching = false;
    this.sliding = false;
    this.sprinting = false;
    this.slideTimer = 0;
    this.slideCooldown = 0;
    this.slideDirection = new THREE.Vector3();
    this.wasCrouchPressed = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.ads = 0;
    this.bobTime = 0;
    this.bobAmount = 0;
    this.breathTime = 0;
    this.landKick = 0;
    this.wasGrounded = true;
    this.stepTimer = 0;
    this.speedRatio = 0;
    this.speedMultiplier = 1;
    this.abilitySpeedBoost = 1;
    this.regenDelay = 4;
    this.regenRate = 18;
    this.regenRemaining = 0;
    this.operator = null;
    this.baseFov = settings.fov ?? 80;
    this.dead = false;
    this.onFootstep = null;
    this.onSlide = null;
    this.onLand = null;
    this.onDamage = null;
    this.onDeath = null;
    this.shake = 0;
    this.reset(world.getSpawn(0));
  }

  reset(spawn) {
    this.position.set(spawn.x, spawn.y ?? 0, spawn.z);
    this.velocity.set(0, 0, 0);
    this.yaw = spawn.yaw ?? Math.PI;
    this.pitch = 0;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.health = this.maxHealth;
    this.armor = this.maxArmor * 0.5;
    this.dead = false;
    this.grounded = true;
    this.crouching = false;
    this.sliding = false;
    this.sprinting = false;
    this.slideTimer = 0;
    this.slideCooldown = 0;
    this.wasCrouchPressed = false;
    this.coyoteTimer = 0.12;
    this.jumpBufferTimer = 0;
    this.abilitySpeedBoost = 1;
    this.height = this.standHeight;
    this.eyeHeight = 1.64;
    this.ads = 0;
    this.shake = 0;
    this.bobTime = 0;
    this.bobAmount = 0;
    this.breathTime = 0;
    this.landKick = 0;
    this.wasGrounded = true;
    this.regenRemaining = 0;
    this.updateCamera(0, 0, 0);
  }

  setSettings(settings) {
    this.settings = settings;
    this.baseFov = settings.fov ?? 80;
  }

  setOperator(operator) {
    this.operator = operator;
    this.maxHealth = operator?.health ?? 100;
    this.maxArmor = operator?.armor ?? 100;
    this.speedMultiplier = operator?.speed ?? 1;
    this.regenDelay = operator?.regenDelay ?? 4;
    this.regenRate = operator?.regenRate ?? 18;
    if (!this.dead) {
      this.health = Math.min(this.maxHealth, this.health);
      this.armor = Math.min(this.maxArmor, this.armor);
    }
  }

  getEyePosition(target = new THREE.Vector3()) {
    return target.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
  }

  getForward(target = new THREE.Vector3()) {
    return target.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  getRight(target = new THREE.Vector3()) {
    return target.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
  }

  addRecoil(pitchKick, yawKick) {
    this.recoilPitch += pitchKick;
    this.recoilYaw += yawKick;
  }

  update(dt, input, weapons) {
    if (this.dead) return;

    this.updateRecovery(dt);

    const look = input.consumeLook();
    const adsSensitivityScale = this.ads > 0.5 ? 0.72 : 1;
    const sensitivity = (this.settings.sensitivity ?? 1) * 0.0022 * adsSensitivityScale;
    const invert = this.settings.invertY ? -1 : 1;
    this.yaw -= look.x * sensitivity;
    this.pitch -= look.y * sensitivity * invert;
    this.pitch = clamp(this.pitch, -1.42, 1.42);

    const move = input.getMoveAxes();
    const wantsSprint = input.isDown("ShiftLeft") || input.isDown("ShiftRight");
    const wantsCrouch = input.isDown("ControlLeft") || input.isDown("ControlRight") || input.isDown("KeyC");
    const crouchJustPressed = wantsCrouch && !this.wasCrouchPressed;
    this.wasCrouchPressed = wantsCrouch;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    this.slideCooldown = Math.max(0, this.slideCooldown - dt);
    const currentPlanar = Math.hypot(this.velocity.x, this.velocity.z);

    // Trigger tactical slide when sprinting forward and pressing crouch.
    if (
      crouchJustPressed &&
      this.grounded &&
      this.slideCooldown <= 0 &&
      !this.sliding &&
      (currentPlanar > 6.2 || (wantsSprint && move.forward > 0.35))
    ) {
      this.sliding = true;
      this.slideTimer = 0.56;
      this.slideCooldown = 1.05;
      this.crouching = true;
      this.slideDirection.copy(forward).multiplyScalar(Math.max(0.4, move.forward)).addScaledVector(right, move.strafe);
      if (this.slideDirection.lengthSq() < 0.01) this.slideDirection.copy(forward);
      this.slideDirection.normalize();
      if (this.onSlide) this.onSlide();
    }

    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0 || !this.grounded) {
        this.sliding = false;
      }
    }

    const blockedOverhead =
      (this.crouching || this.sliding) &&
      hasOverheadObstacle(this.position, this.radius, this.standHeight, this.world.colliders ?? []);

    if (this.sliding) {
      this.crouching = true;
      this.height = this.slideHeight;
    } else if (wantsCrouch || blockedOverhead) {
      this.crouching = true;
      this.height = this.crouchHeight;
    } else {
      this.crouching = false;
      this.height = this.standHeight;
    }

    const targetEyeHeight = this.sliding ? 0.88 : this.crouching ? 1.08 : 1.64;
    this.eyeHeight = damp(this.eyeHeight, targetEyeHeight, 16, dt);

    const weapon = weapons?.currentWeapon;
    const weaponMoveScale = weapon?.moveSpeed ?? 1;
    const totalSpeedScale = this.speedMultiplier * this.abilitySpeedBoost * weaponMoveScale;
    const sprinting = wantsSprint && move.forward > 0.2 && !this.crouching && !this.sliding && this.ads < 0.5;
    this.sprinting = sprinting;

    const wish = new THREE.Vector3();
    if (this.sliding) {
      const slideProgress = clamp(this.slideTimer / 0.56, 0, 1);
      const slideSpeed = (5.0 + slideProgress * 5.6) * totalSpeedScale;
      wish.copy(this.slideDirection).multiplyScalar(slideSpeed);
    } else {
      let speed = (sprinting ? 8.2 : 6.0) * totalSpeedScale;
      if (this.crouching) speed = 3.4 * totalSpeedScale;
      if (this.ads > 0.5) speed = Math.min(speed, 4.3 * totalSpeedScale);
      wish.addScaledVector(forward, move.forward);
      wish.addScaledVector(right, move.strafe);
      if (wish.lengthSq() > 1) wish.normalize();
      wish.multiplyScalar(speed);
    }

    const acceleration = this.sliding ? 20 : this.grounded ? 14 : 3.8;
    this.velocity.x = damp(this.velocity.x, wish.x, acceleration, dt);
    this.velocity.z = damp(this.velocity.z, wish.z, acceleration, dt);

    if (input.consumeJump()) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    if (this.grounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !blockedOverhead) {
      this.velocity.y = 5.65;
      this.grounded = false;
      this.sliding = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    this.velocity.y -= 19 * dt;
    this.velocity.y = Math.max(this.velocity.y, -32);

    const fallVelocity = this.velocity.y;
    const delta = this.velocity.clone().multiplyScalar(dt);
    const contact = this.world.resolveMovement(this.position, delta, this.radius, this.height, 0.42);
    this.grounded = contact.grounded;
    if (this.grounded && !this.wasGrounded) {
      const impactSpeed = Math.abs(fallVelocity);
      this.landKick = Math.min(0.16, impactSpeed * 0.012);
      if (impactSpeed > 4.2 && this.onLand) this.onLand(impactSpeed);
    }
    this.wasGrounded = this.grounded;
    if (contact.grounded && this.velocity.y < 0) this.velocity.y = 0;
    if (contact.ceiling && this.velocity.y > 0) this.velocity.y = 0;

    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.speedRatio = clamp(planarSpeed / 8.2, 0, 1);
    this.bobTime += planarSpeed * dt * (this.sliding ? 0.5 : 1.7);
    this.breathTime += dt * (sprinting ? 1.35 : 1);
    const targetBob = this.grounded && !this.sliding ? this.speedRatio : 0;
    this.bobAmount = damp(this.bobAmount, targetBob, 8, dt);
    this.landKick = damp(this.landKick, 0, 12, dt);

    this.stepTimer -= dt;
    if (this.grounded && !this.sliding && planarSpeed > 1.6 && this.stepTimer <= 0) {
      this.stepTimer = sprinting ? 0.31 : this.crouching ? 0.52 : 0.42;
      if (this.onFootstep) this.onFootstep(sprinting);
    }

    const adsTarget = input.isDown("Mouse2") ? 1 : 0;
    this.ads = damp(this.ads, adsTarget, 12, dt);
    const slideFovBoost = this.sliding ? 4.5 : sprinting ? 2.2 : 0;
    const targetFov = (this.baseFov + slideFovBoost) / (weapon ? 1 + (weapon.zoom - 1) * this.ads : 1);
    this.camera.fov = damp(this.camera.fov, targetFov, 14, dt);
    this.camera.updateProjectionMatrix();

    this.recoilPitch = damp(this.recoilPitch, 0, 9, dt);
    this.recoilYaw = damp(this.recoilYaw, 0, 9, dt);
    this.shake = damp(this.shake, 0, 9, dt);

    const targetRoll = this.sliding ? 0.045 : -move.strafe * 0.012;
    const roll = damp(this.camera.rotation.z, targetRoll, 8, dt);
    this.updateCamera(roll, 0, 0);
  }

  updateCamera(roll = 0, extraPitch = 0, extraYaw = 0) {
    const bobFrequency = this.speedRatio > 0.68 ? 2.45 : 2.05;
    const bobX = Math.sin(this.bobTime * bobFrequency) * 0.022 * this.bobAmount;
    const bobY = Math.abs(Math.cos(this.bobTime * bobFrequency)) * -0.026 * this.bobAmount;
    const breathingX = Math.sin(this.breathTime * 1.7) * 0.0035 * (1 - this.bobAmount * 0.6);
    const breathingY = Math.cos(this.breathTime * 1.45) * 0.004 * (1 - this.bobAmount * 0.6);
    const shakeX = (Math.random() - 0.5) * this.shake * 0.02;
    const shakeY = (Math.random() - 0.5) * this.shake * 0.02;
    this.camera.position.set(
      this.position.x + bobX + breathingX + shakeX,
      this.position.y + this.eyeHeight + bobY + breathingY - this.landKick + shakeY,
      this.position.z,
    );
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw + this.recoilYaw + extraYaw;
    this.camera.rotation.x = clamp(this.pitch + this.recoilPitch + extraPitch, -1.52, 1.52);
    this.camera.rotation.z = roll;
  }

  takeDamage(amount, source = "unknown") {
    if (this.dead) return false;
    const incoming = Math.max(0, Number(amount) || 0);
    if (incoming <= 0) return false;
    this.regenRemaining = this.regenDelay;
    const absorbed = Math.min(this.armor, incoming * 0.62);
    this.armor = Math.max(0, this.armor - absorbed);
    const healthDamage = incoming - absorbed;
    this.health = Math.max(0, this.health - healthDamage);
    this.shake = Math.min(1.4, this.shake + 0.5);
    if (this.onDamage) this.onDamage(incoming, source);
    if (this.health <= 0) {
      this.dead = true;
      if (this.onDeath) this.onDeath(source);
      return true;
    }
    return false;
  }

  heal(amount) {
    const before = this.health;
    this.health = Math.min(this.maxHealth, this.health + Math.max(0, Number(amount) || 0));
    return this.health - before;
  }

  updateRecovery(dt) {
    if (this.dead || this.health >= this.maxHealth) return;
    this.regenRemaining = Math.max(0, this.regenRemaining - dt);
    if (this.regenRemaining <= 0) this.heal(this.regenRate * dt);
  }

  getRecoveryState() {
    return { remaining: this.regenRemaining, rate: this.regenRate, maxHealth: this.maxHealth };
  }

  addArmor(amount) {
    this.armor = Math.min(this.maxArmor, this.armor + amount);
  }
}

export { UP };
