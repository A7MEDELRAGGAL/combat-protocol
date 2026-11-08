import { clamp, formatClock, formatNumber } from "./utils.js";
import { abilityForOperator, abilityChargeRatio } from "./abilities.js";

export class HUD {
  constructor(game) {
    this.game = game;
    this.elements = {};
    this.cached = {};
    this.killEntries = [];
    this.messageTimer = 0;
    this.hitTimer = 0;
    this.damage = 0;
    this.lastMinimap = 0;
    this.bind();
  }

  bind() {
    const ids = [
      "hud",
      "timer",
      "score",
      "killfeed",
      "crosshair",
      "hitmarker",
      "health-bar",
      "health-value",
      "armor-bar",
      "armor-value",
      "weapon-name",
      "weapon-role",
      "ammo",
      "reserve",
      "reload-fill",
      "reload-wrap",
      "weapon-slots",
      "minimap",
      "hit-vignette",
      "scope",
      "scope-label",
      "hud-message",
      "alive-count",
      "accuracy",
      "regen-status",
      "grenade-count",
      "mode-label",
      "hud-mode-label",
      "hud-level",
      "zone-status",
      "map-label",
      "objective-panel",
      "objective-label",
      "objective-detail",
      "objective-progress-fill",
      "damage-arcs",
      "ability-hud",
      "ability-name",
      "ability-fill",
    ];
    for (const id of ids) this.elements[id] = document.getElementById(id);
    this.minimapContext = this.elements.minimap?.getContext("2d") ?? null;
    this.buildSlots();
  }

  buildSlots() {
    const container = this.elements["weapon-slots"];
    if (!container) return;
    container.innerHTML = "";
    const weapons = this.game.weapons?.states ?? [];
    weapons.forEach((state, index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "weapon-slot";
      slot.dataset.index = String(index);
      slot.innerHTML = `<span class="slot-key">${index + 1}</span><span class="slot-name">${state.def.short}</span>`;
      slot.addEventListener("click", () => this.game.switchWeapon(index));
      container.appendChild(slot);
    });
  }

  setVisible(visible) {
    if (this.elements.hud) this.elements.hud.classList.toggle("is-visible", visible);
  }

  setWeapon(state) {
    if (!state) return;
    this.setText("weapon-name", state.name);
    this.setText("weapon-role", state.role);
    this.setText("ammo", String(state.ammo).padStart(2, "0"));
    this.setText("reserve", String(state.reserve).padStart(3, "0"));
    const slots = this.elements["weapon-slots"]?.querySelectorAll(".weapon-slot") ?? [];
    slots.forEach((slot, index) => slot.classList.toggle("is-active", index === state.index));
    this.elements["reload-wrap"]?.classList.toggle("is-reloading", state.reloading);
    this.setText("scope-label", `${state.name} // ${Number(state.zoom ?? 1).toFixed(1)}×`);
    this.elements.scope?.setAttribute("data-optic", state.opticStyle ?? "iron");
  }

  setText(key, value) {
    if (this.cached[key] === value) return;
    this.cached[key] = value;
    const element = this.elements[key];
    if (element) element.textContent = value;
  }

  setTimer(seconds) {
    this.setText("timer", formatClock(seconds));
  }

  setScore(score) {
    this.setText("score", String(Math.max(0, Math.round(score))).padStart(4, "0"));
  }

  setAlive(count) {
    this.setText("alive-count", String(count));
  }

  setAccuracy(value) {
    this.setText("accuracy", `${Math.round(value * 100)}%`);
  }

  addKill(label, weapon, headshot = false) {
    const feed = this.elements.killfeed;
    if (!feed) return;
    const item = document.createElement("div");
    item.className = "kill-entry";
    item.innerHTML = `<span class="kill-mark">${headshot ? "◎" : "×"}</span><span class="kill-label"></span><span class="kill-weapon"></span>`;
    item.querySelector(".kill-label").textContent = label;
    item.querySelector(".kill-weapon").textContent = weapon;
    feed.prepend(item);
    const record = { element: item, expires: performance.now() + 4200 };
    this.killEntries.push(record);
    if (this.killEntries.length > 5) {
      const oldest = this.killEntries.shift();
      oldest.element.remove();
    }
  }

  hitmarker(headshot = false) {
    const element = this.elements.hitmarker;
    if (!element) return;
    element.classList.toggle("is-headshot", headshot);
    element.classList.remove("is-active");
    void element.offsetWidth;
    element.classList.add("is-active");
    this.hitTimer = 0.16;
  }

  damageFlash(amount = 12, origin = null) {
    this.damage = Math.min(1, this.damage + amount / 60);
    if (origin) this.showDamageArc(origin);
  }

  showDamageArc(origin) {
    const container = this.elements["damage-arcs"];
    const player = this.game.player;
    if (!container || !player) return;
    const dx = origin.x - player.position.x;
    const dz = origin.z - player.position.z;
    if (Math.hypot(dx, dz) < 0.2) return;
    // World bearing relative to where the camera looks (yaw 0 faces -Z).
    const bearing = Math.atan2(dx, -dz);
    const relative = bearing + player.yaw;
    const arc = document.createElement("div");
    arc.className = "damage-arc";
    arc.style.transform = `rotate(${relative}rad)`;
    arc.style.opacity = "1";
    container.appendChild(arc);
    while (container.children.length > 6) container.removeChild(container.firstChild);
    setTimeout(() => {
      arc.style.opacity = "0";
    }, 450);
    setTimeout(() => arc.remove(), 700);
  }

  message(text, duration = 1.8) {
    const element = this.elements["hud-message"];
    if (!element) return;
    element.textContent = text;
    element.classList.add("is-visible");
    this.messageTimer = duration;
  }

  showScope(visible) {
    this.elements.scope?.classList.toggle("is-visible", visible);
  }

  update(dt) {
    const game = this.game;
    const player = game.player;
    const weapon = game.weapons.getHudState();

    const health = Math.round(player.health);
    const armor = Math.round(player.armor);
    if (this.cached.health !== health) {
      this.cached.health = health;
      this.elements["health-value"].textContent = String(health);
      this.elements["health-bar"].style.width = `${clamp((health / player.maxHealth) * 100, 0, 100)}%`;
    }
    if (this.cached.armor !== armor) {
      this.cached.armor = armor;
      this.elements["armor-value"].textContent = String(armor);
      this.elements["armor-bar"].style.width = `${clamp((armor / player.maxArmor) * 100, 0, 100)}%`;
    }

    this.setTimer(game.timeLeft);
    this.setScore(game.score);
    this.setAlive(game.enemies.getAliveCount());
    this.setAccuracy(game.weapons.accuracy);
    const mode = game.mode;
    if (mode) {
      this.setText("mode-label", mode.label);
      this.setText("hud-mode-label", mode.label);
      this.setText("zone-status", game.getObjectiveLabel?.() ?? mode.objective);
    }
    const objective = game.getObjectiveState?.();
    if (objective) {
      this.setText("objective-label", objective.label ?? "");
      this.setText("objective-detail", objective.detail ?? "");
      if (this.elements["objective-progress-fill"]) {
        this.elements["objective-progress-fill"].style.width = `${Math.round((objective.progress ?? 0) * 100)}%`;
      }
      this.elements.objectivePanel?.classList.toggle("is-mission", Boolean(objective.active));
    }
    this.setText("map-label", game.world?.mapLabel ?? "الخريطة");
    this.setText("hud-level", String(game.profile?.level ?? 1));
    this.setText("grenade-count", String(game.grenades?.getState?.().available ?? 0));
    const recovery = player.getRecoveryState?.();
    this.setText("regen-status", recovery && recovery.remaining > 0 ? `استعادة بعد ${recovery.remaining.toFixed(1)}ث` : "استعادة جاهزة");
    this.setWeapon(weapon);

    const ability = game.abilityState;
    if (ability) {
      const def = abilityForOperator(ability.operatorId);
      const ready = ability.cooldownRemaining <= 0;
      this.setText("ability-name", ready ? def.arabic : `${def.arabic} ${Math.ceil(ability.cooldownRemaining)}ث`);
      const fill = this.elements["ability-fill"];
      if (fill) fill.style.width = `${Math.round(abilityChargeRatio(ability) * 100)}%`;
      this.elements["ability-hud"]?.classList.toggle("is-ready", ready);
    }

    const reloadFill = this.elements["reload-fill"];
    if (reloadFill) reloadFill.style.width = `${Math.round(weapon.reloadProgress * 100)}%`;

    const spread =
      5 +
      weapon.bloom * 10 +
      player.speedRatio * 8 +
      (player.ads > 0.5 ? -7 : 0) +
      (player.grounded ? 0 : 3);
    this.elements.crosshair?.style.setProperty("--gap", `${Math.max(2, spread)}px`);
    this.elements.crosshair?.classList.toggle("is-ads", player.ads > 0.55);
    this.showScope(weapon.opticStyle !== "iron" && player.ads > 0.62);

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) this.elements.hitmarker?.classList.remove("is-active");
    }

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.elements["hud-message"]?.classList.remove("is-visible");
    }

    if (this.damage > 0) {
      this.damage = Math.max(0, this.damage - dt * 1.8);
      if (this.elements["hit-vignette"]) {
        this.elements["hit-vignette"].style.opacity = String(this.damage * 0.7);
      }
    }

    const now = performance.now();
    for (let index = this.killEntries.length - 1; index >= 0; index -= 1) {
      if (now > this.killEntries[index].expires) {
        this.killEntries[index].element.remove();
        this.killEntries.splice(index, 1);
      }
    }

    if (now - this.lastMinimap > 90) {
      this.lastMinimap = now;
      this.drawMinimap();
    }
  }

  drawMinimap() {
    const context = this.minimapContext;
    if (!context) return;
    const game = this.game;
    const width = context.canvas.width;
    const height = context.canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(10, 12, 11, 0.84)";
    context.fillRect(0, 0, width, height);

    const bounds = game.world.bounds ?? { halfX: 34, halfZ: 24 };
    const mapX = (x) => ((x + bounds.halfX) / (bounds.halfX * 2)) * width;
    const mapY = (z) => ((z + bounds.halfZ) / (bounds.halfZ * 2)) * height;
    const mapScale = Math.min(width / (bounds.halfX * 2), height / (bounds.halfZ * 2));

    context.strokeStyle = "rgba(216, 163, 90, 0.12)";
    context.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
      const x = (index / 4) * width;
      const y = (index / 4) * height;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(236, 231, 217, 0.25)";
    context.strokeRect(0.5, 0.5, width - 1, height - 1);
    for (const item of game.world.minimap) {
      context.save();
      context.translate(mapX(item.x), mapY(item.z));
      if (item.rotation) context.rotate(item.rotation);
      context.fillStyle = item.type === "container" ? "rgba(150, 145, 128, 0.62)" : "rgba(110, 106, 94, 0.55)";
      if (item.type === "barrel") context.fillStyle = "rgba(91, 104, 86, 0.8)";
      if (item.type === "stair") context.fillStyle = "rgba(170, 160, 135, 0.55)";
      const w = (item.w / (bounds.halfX * 2)) * width;
      const d = (item.d / (bounds.halfZ * 2)) * height;
      context.fillRect(-w / 2, -d / 2, w, d);
      context.restore();
    }

    // Player view cone.
    const player = game.player;
    context.save();
    context.translate(mapX(player.position.x), mapY(player.position.z));
    context.rotate(-player.yaw);
    const gradient = context.createLinearGradient(0, 0, 0, -42);
    gradient.addColorStop(0, "rgba(216, 163, 90, 0.28)");
    gradient.addColorStop(1, "rgba(216, 163, 90, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-22, -46);
    context.lineTo(22, -46);
    context.closePath();
    context.fill();
    context.fillStyle = "#e0b06a";
    context.beginPath();
    context.moveTo(0, -6);
    context.lineTo(4.5, 5);
    context.lineTo(0, 2.5);
    context.lineTo(-4.5, 5);
    context.closePath();
    context.fill();
    context.restore();

    // Enemies show only when a Recon Pulse is active, when they are close, or when they just fired.
    const recon = game.isReconActive?.() ?? false;
    const nowSeconds = performance.now() / 1000;
    for (const enemy of game.enemies.getActiveEnemies()) {
      if (enemy.dead) continue;
      const distance = Math.hypot(enemy.position.x - player.position.x, enemy.position.z - player.position.z);
      const justFired = enemy.lastShotAt && nowSeconds - enemy.lastShotAt < 1.4;
      if (!recon && !justFired && distance > 13) continue;
      context.fillStyle = recon ? "rgba(255, 140, 90, 0.98)" : "rgba(209, 77, 60, 0.95)";
      context.beginPath();
      context.arc(mapX(enemy.position.x), mapY(enemy.position.z), recon ? 3 : 2.4, 0, Math.PI * 2);
      context.fill();
    }

    // Loot crates (Battle Royale) and the active mission marker.
    if (game.mode?.id === "battleRoyale") {
      for (const crate of game.loot?.crates ?? []) {
        if (crate.taken) continue;
        context.fillStyle = crate.item?.color ?? "#d9a45c";
        context.fillRect(mapX(crate.mesh.position.x) - 1.5, mapY(crate.mesh.position.z) - 1.5, 3, 3);
      }
    }
    if (game.missionState?.pointId) {
      const point = game.world.getMissionPoint(game.missionState.pointId);
      if (point) {
        context.strokeStyle = "rgba(255, 208, 138, 0.95)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(mapX(point.x), mapY(point.z), 5, 0, Math.PI * 2);
        context.stroke();
      }
    }

    // Remote players in online rooms.
    for (const entry of game.remote?.players?.values?.() ?? []) {
      if (!entry.player || entry.player.dead) continue;
      context.fillStyle = "rgba(119, 185, 177, 0.98)";
      context.beginPath();
      context.arc(mapX(entry.player.x), mapY(entry.player.z), 2.8, 0, Math.PI * 2);
      context.fill();
    }

    if (game.zone) {
      context.strokeStyle = "rgba(111, 155, 148, 0.9)";
      context.lineWidth = 1.5;
      context.beginPath();
       context.arc(mapX(game.zone.center.x), mapY(game.zone.center.z), game.zone.radius * mapScale, 0, Math.PI * 2);
      context.stroke();
    }

    context.strokeStyle = "rgba(240, 235, 220, 0.26)";
    context.strokeRect(0.5, 0.5, width - 1, height - 1);
  }

  reset(duration = 300) {
    for (const entry of this.killEntries) entry.element.remove();
    this.killEntries = [];
    this.cached = {};
    this.damage = 0;
    this.showScope(false);
    this.setScore(0);
    this.setTimer(duration);
    this.setText("grenade-count", "2");
    this.setText("regen-status", "استعادة جاهزة");
    this.elements["hud-message"]?.classList.remove("is-visible");
  }
}
