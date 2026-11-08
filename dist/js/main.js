import * as THREE from "../vendor/three.module.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { WeaponSystem, WEAPON_DEFS } from "./weapons.js";
import { EnemyManager } from "./enemies.js";
import { HUD } from "./hud.js";
import { Input } from "./input.js";
import { AudioEngine } from "./audio.js";
import { createBattleRoyaleZonePlan, sampleBattleRoyaleZone } from "./zone.js";
import { GrenadeSystem } from "./grenades.js";
import { LootSystem } from "./loot.js";
import { LOOT_SPAWN_COUNT } from "./loot-data.js";
import { createInventory, addItem, inventorySummary } from "./inventory.js";
import { computePlacement, placementLabel, rankTitle } from "./progression.js";
import { botCountFor, difficultyOf, loadLobby, lobbyQuery, lobbySummary, normalizeLobby, saveLobby } from "./lobby.js";
import { createDropState, jumpFromPlane, deployChute, stepDrop, dropLabel, DROP_CONFIG } from "./drop.js";
import { createModeState, recordEnemyKill, recordPlayerDeath, completeSurvivalWave, resolveModeEnd, getObjectiveSnapshot } from "./mode-rules.js";
import { formatClock, clamp } from "./utils.js";
import { MultiplayerClient } from "./net.js";
import { RemotePlayers } from "./remote-players.js";
import { sanitizeName, sanitizeRoom } from "./multiplayer-room.js";
import {
  MODE_DEFS,
  getMode,
  OPERATOR_DEFS,
  operatorById,
  ATTACHMENT_DEFS,
  WEAPON_SKINS,
  buySkin,
  PROFILE_KEY,
  loadProfile,
  saveProfile,
  awardXp,
  getLoadoutIds,
  settleMatch,
} from "./game-data.js";
import { createTelemetry } from "./telemetry.js";
import { MAP_DEFS, mapById, mapsForMode } from "./map-data.js";
import { advanceMission, createMissionState, getMissionSnapshot, missionById } from "./mission-rules.js";
import { abilityForOperator, createAbilityState, activateAbility, stepAbilityState, abilityChargeRatio } from "./abilities.js";
import { createCargoPlane, createParachuteModel } from "./aircraft.js";
import { STORE_BUNDLES, buyBundle } from "./store.js";
import { loadFriends, saveFriends, addFriend, removeFriend } from "./friends.js";
import { BATTLE_PASS_TIERS, claimBattlePassTier } from "./progression.js";
import { PUBG_TIERS, getTierForRp, calculateMatchRp, applyMatchRp } from "./pubg-ranks.js";
import { createChatState, addMessage, filterMessagesByChannel, QUICK_MESSAGES } from "./chat.js";
import { CRATE_DEFS, openCrate, RARITY_INFO } from "./crates.js";
import { UPGRADABLE_WEAPONS, getWeaponUpgradeLevel, upgradeLabWeapon } from "./gun-lab.js";
import { LobbyShowcase } from "./lobby-showcase.js";

const STORAGE_KEY = "combat-protocol-settings-v1";
const DEFAULT_SETTINGS = {
  sensitivity: 1,
  fov: 80,
  quality: "high",
  sound: true,
  invertY: false,
};
const MATCH_SECONDS = 300;

function createRenderer(canvas, safeMode) {
  const attempts = safeMode
    ? [{ antialias: false, powerPreference: "default" }]
    : [
        { antialias: true, powerPreference: "high-performance" },
        { antialias: false, powerPreference: "default" },
      ];
  let lastError = null;
  for (const options of attempts) {
    try {
      return new THREE.WebGLRenderer({ canvas, ...options });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("WebGL renderer unavailable");
}

function showFatal(detail) {
  const fatal = document.getElementById("fatal");
  document.getElementById("boot")?.classList.add("is-done");
  document.getElementById("app")?.classList.add("is-fatal");
  if (!fatal) return;
  fatal.hidden = false;
  const box = document.getElementById("fatal-detail");
  if (box && detail) box.textContent = String(detail);
  if (window.__FATAL_BOUND__) return;
  window.__FATAL_BOUND__ = true;
  const retry = document.getElementById("fatal-retry");
  if (retry && !window.__FATAL_RETRY_BOUND__) {
    window.__FATAL_RETRY_BOUND__ = true;
    const alreadySafe = new URLSearchParams(window.location.search).get("safe") === "1";
    if (!alreadySafe) retry.textContent = "المحاولة بالوضع الآمن";
    retry.addEventListener("click", () => {
      const target = new URL(window.location.href);
      if (alreadySafe) target.searchParams.delete("safe");
      else target.searchParams.set("safe", "1");
      window.location.href = target.toString();
    });
  }
  document.getElementById("fatal-detail-toggle")?.addEventListener("click", () => {
    if (box) box.hidden = !box.hidden;
  });
}

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (stored && typeof stored === "object") return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    // ignore malformed storage
  }
  return { ...DEFAULT_SETTINGS };
}

class CombatProtocol {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.dom = {
      boot: document.getElementById("boot"),
      bootText: document.getElementById("boot-text"),
      menu: document.getElementById("menu"),
      how: document.getElementById("how"),
      lobby: document.getElementById("lobby"),
      multiplayer: document.getElementById("multiplayer"),
      modes: document.getElementById("modes"),
      armory: document.getElementById("armory"),
      settings: document.getElementById("settings"),
      pause: document.getElementById("pause"),
      gameover: document.getElementById("gameover"),
      hud: document.getElementById("hud"),
      lockHint: document.getElementById("lock-hint"),
      touch: document.getElementById("touch-controls"),
      rotateHint: document.getElementById("rotate-hint"),
      objectivePanel: document.getElementById("objective-panel"),
      store: document.getElementById("store"),
      friends: document.getElementById("friends"),
      progression: document.getElementById("progression"),
      crates: document.getElementById("crates"),
      gunLab: document.getElementById("gun-lab"),
    };
    this.settings = loadSettings();
    this.profile = loadProfile();
    this.chatState = createChatState();
    this.selectedCrateId = "crate-classic";
    this.selectedLabWeaponId = "lab-ar4-glacier";
    const bootParams = new URLSearchParams(window.location.search);
    this.lobby = loadLobby(bootParams);
    this.lobby = normalizeLobby(this.lobby, mapsForMode(this.lobby.mode).map((id) => mapById(id)));
    this.modeId = this.lobby.mode;
    this.mode = getMode(this.modeId);
    this.zone = null;
    this.zonePlan = null;
    this.abilityState = createAbilityState(this.profile.operatorId);
    this.reconUntil = 0;
    this.abilityBoostUntil = 0;
    this.wave = 1;
    this.modeState = createModeState(this.mode);
    this.missionDef = null;
    this.missionState = null;
    this.zoneTick = 0;
    this.multiplayer = false;
    this.net = null;
    this.remote = null;
    this.mpSelfId = null;
    this.mpDead = false;
    this.mpStateAt = 0;
    this.armoryReturn = "menu";
    this.isTouch =
      window.matchMedia?.("(pointer: coarse)")?.matches || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const params = new URLSearchParams(window.location.search);
    this.mapId = mapById(params.get("map") ?? this.lobby.map).id;
    this.lobby.map = this.mapId;
    this.telemetry = createTelemetry({ enabled: params.get("telemetry") !== "0" });
    this.matchId = null;
    this.respawnUntil = 0;
    this.respawnCount = 0;
    window.__PLAYTEST_EVENTS__ = this.telemetry.events;
    this.demo = params.get("demo") === "1";
    this.safeMode = params.get("safe") === "1";
    this.stableGraphics = this.safeMode || /HeadlessChrome/i.test(navigator.userAgent);
    if (this.safeMode) this.settings = { ...this.settings, quality: "low" };
    this.settingsReturn = "menu";
    this.running = false;
    this.paused = false;
    this.started = false;
    this.fireHeld = false;
    this.timeLeft = MATCH_SECONDS;
    this.score = 0;
    this.kills = 0;
    this.headshots = 0;
    this.lastTime = performance.now() / 1000;
    this.menuTime = 0;
    this.endReason = null;

    try {
      this.renderer = createRenderer(this.canvas, this.safeMode || this.stableGraphics);
    } catch (error) {
      showFatal(error?.message ?? error);
      throw error;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.settings.quality === "high" ? 1.8 : 1.2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = this.settings.quality === "high" && !this.stableGraphics;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.running = false;
      this.hud?.setVisible(false);
      showFatal("WebGL context lost");
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov,
      window.innerWidth / window.innerHeight,
      0.045,
      220,
    );
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    this.world = new World(this.scene, this.renderer, this.settings.quality, this.mapId);
    this.lobbyShowcase = new LobbyShowcase({ scene: this.scene });
    this.lobbyShowcase.setPlayer(this.profile.operatorId, this.profile.equippedSkin);
    this.player = new Player({ camera: this.camera, world: this.world, settings: this.settings });
    this.player.setOperator(operatorById(this.profile.operatorId));
    this.audio = new AudioEngine(this.settings.sound);
    this.input = new Input(this.canvas);
    this.enemies = new EnemyManager({
      scene: this.scene,
      world: this.world,
      player: this.player,
      audio: this.audio,
      callbacks: {
        onKill: (enemy, headshot, point, source) => this.onKill(enemy, headshot, point, source),
        onPlayerHit: (amount, origin) => {
          this.hud?.damageFlash(9, origin);
          this.telemetry.emit("damage_taken", { amount, source: "enemy", distance: origin?.distanceTo?.(this.player.getEyePosition()) ?? 0 });
        },
      },
    });
    this.enemies.spawnInitial(5);
    this.loot = new LootSystem({ scene: this.scene, world: this.world });
    this.inventory = createInventory();
    this.dropState = null;
    this.dropTarget = { x: 0, z: 0 };
    this.weapons = new WeaponSystem({
      scene: this.scene,
      camera: this.camera,
      player: this.player,
      world: this.world,
      enemies: this.enemies,
      audio: this.audio,
      profile: this.profile,
      callbacks: {
        onWeaponChange: (state) => this.hud?.setWeapon(state),
        onHit: ({ headshot, damage, killed }) => {
          this.hud?.hitmarker(headshot);
          this.telemetry.emit("shot_hit", { weaponId: this.weapons?.currentState?.def?.id, headshot, damage, killed });
        },
        onShot: ({ weapon, hit, origin, direction }) => {
          this.telemetry.emit("shot_fired", { weaponId: weapon.id, hit });
          if (this.multiplayer && this.net) {
            this.net.sendShot({ origin, direction, damage: weapon.damage });
          }
        },
        onReload: (state) => this.telemetry.emit("reload_started", { weaponId: state.short }),
      },
    });
    this.grenades = new GrenadeSystem({
      scene: this.scene,
      camera: this.camera,
      player: this.player,
      world: this.world,
      enemies: this.enemies,
      audio: this.audio,
      callbacks: {
        onThrow: ({ charges }) => this.telemetry.emit("grenade_thrown", { charges }),
        onDetonate: ({ radius }) => this.telemetry.emit("grenade_detonated", { radius }),
      },
    });
    this.hud = new HUD(this);
    this.renderModeCards();
    this.renderMapCards();
    this.renderQuickMapPicker();
    this.renderArmory();
    this.player.onFootstep = (sprint) => this.audio.footstep(sprint);
    this.player.onSlide = () => this.audio.slide();
    this.player.onLand = () => this.audio.land();
    this.player.onDamage = (amount, source) => {
      this.hud.damageFlash(16);
      this.audio.hurt();
      this.telemetry.emit("damage_taken", { amount, source });
    };
    this.player.onDeath = (source) => this.handlePlayerDeath(source);
    this.weapons.setVisible(false);
    this.cleanUpDropModels();
    const dropHud = document.getElementById("drop-hud");
    if (dropHud) dropHud.hidden = true;
    this.hud.setVisible(false);
    this.hud.setWeapon(this.weapons.getHudState());

    this.bindUi();
    this.bindInput();
    this.setupTouch();
    this.applySettings(this.settings);
    this.updateMenuCamera(0);
    this.renderer.render(this.scene, this.camera);

    window.addEventListener("resize", () => this.onResize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.running && !this.paused) this.pauseGame();
    });

    window.__GAME__ = this;
    window.__GAME_READY__ = true;
    window.__START_DEMO__ = () => this.startGame({ demo: true });

    setTimeout(() => {
      this.dom.boot?.classList.add("is-done");
      if (this.demo) this.startGame({ demo: true });
    }, 420);

    requestAnimationFrame((time) => this.loop(time));
  }

  bindUi() {
    document.getElementById("start-button")?.addEventListener("click", () => {
      this.audio.ui();
      this.startGame();
    });
    document.getElementById("how-button")?.addEventListener("click", () => this.showScreen("how"));
    document.getElementById("mode-button")?.addEventListener("click", () => this.showScreen("modes"));
    document.getElementById("armory-button")?.addEventListener("click", () => this.openArmory("menu"));
    document.getElementById("settings-button")?.addEventListener("click", () => this.openSettings("menu"));
    const menuActions = document.querySelector(".menu-actions");
    if (menuActions && !document.getElementById("lobby-button")) {
      const lobbyButton = document.createElement("button");
      lobbyButton.className = "btn btn-quiet";
      lobbyButton.id = "lobby-button";
      lobbyButton.type = "button";
      lobbyButton.textContent = "اللوبي";
      lobbyButton.addEventListener("click", () => this.openLobby());
      menuActions.insertBefore(lobbyButton, menuActions.children[1] ?? null);
    }
    document.getElementById("lobby-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("lobby-back")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("lobby-start")?.addEventListener("click", () => this.startLobbyMatch());
    document.getElementById("multiplayer-button")?.addEventListener("click", () => this.openMultiplayer());
    document.getElementById("mp-back")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("mp-back-top")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("mp-connect")?.addEventListener("click", () => this.connectMultiplayer());
    document.getElementById("mp-send")?.addEventListener("click", () => this.sendMultiplayerChat());
    document.getElementById("mp-chat-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.sendMultiplayerChat();
    });
    document.getElementById("mp-hud-send")?.addEventListener("click", () => this.sendMultiplayerChat("mp-hud-input"));
    document.getElementById("mp-hud-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.sendMultiplayerChat("mp-hud-input");
    });
    for (const control of ["lobby-mode", "lobby-map", "lobby-difficulty"]) {
      document.getElementById(control)?.addEventListener("change", () => this.syncLobbyFromUi());
    }
    document.getElementById("lobby-bots")?.addEventListener("input", () => this.syncLobbyFromUi());
    document.getElementById("how-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("how-back")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("modes-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("modes-back")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("armory-close")?.addEventListener("click", () => this.closeArmory(false));
    document.getElementById("armory-save")?.addEventListener("click", () => this.closeArmory(true));
    document.getElementById("settings-close")?.addEventListener("click", () => this.closeSettings(false));
    document.getElementById("settings-save")?.addEventListener("click", () => this.closeSettings(true));
    document.getElementById("settings-reset")?.addEventListener("click", () => this.resetSettings());

    document.getElementById("store-button")?.addEventListener("click", () => this.openStore("menu"));
    document.getElementById("store-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("store-back")?.addEventListener("click", () => this.showScreen("menu"));

    document.getElementById("friends-button")?.addEventListener("click", () => this.openFriends());
    document.getElementById("friends-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("friends-back")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("friend-add-btn")?.addEventListener("click", () => {
      const input = document.getElementById("friend-add-input");
      const name = input?.value?.trim();
      if (!name) return;
      const res = addFriend(this.friendsList ?? loadFriends(), name);
      const feedback = document.getElementById("friends-feedback");
      if (res.success) {
        this.friendsList = res.friends;
        if (input) input.value = "";
        if (feedback) feedback.textContent = `تمت إضافة ${name} بنجاح!`;
        this.renderFriends();
      } else {
        if (feedback) feedback.textContent = res.reason === "already-exists" ? "الصديق موجود بالفعل في القائمة!" : "الاسم غير صالح";
      }
    });

    document.getElementById("pass-button")?.addEventListener("click", () => this.openProgression());
    document.getElementById("progression-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("progression-back")?.addEventListener("click", () => this.showScreen("menu"));

    document.getElementById("crates-button")?.addEventListener("click", () => this.openCrates());
    document.getElementById("nav-crates")?.addEventListener("click", () => this.openCrates());
    document.getElementById("crates-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("crates-back")?.addEventListener("click", () => this.showScreen("menu"));

    document.getElementById("gun-lab-button")?.addEventListener("click", () => this.openGunLab());
    document.getElementById("nav-gun-lab")?.addEventListener("click", () => this.openGunLab());
    document.getElementById("gun-lab-close")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("gun-lab-back")?.addEventListener("click", () => this.showScreen("menu"));

    // World Chat channel buttons
    document.getElementById("chat-tab-world")?.addEventListener("click", () => {
      this.chatState.channel = "world";
      this.renderChat();
    });
    document.getElementById("chat-tab-squad")?.addEventListener("click", () => {
      this.chatState.channel = "squad";
      this.renderChat();
    });
    document.getElementById("chat-tab-recruit")?.addEventListener("click", () => {
      this.chatState.channel = "recruit";
      this.renderChat();
    });
    document.getElementById("chat-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input?.value?.trim();
      if (!text) return;
      const tier = getTierForRp(this.profile.rp ?? 1200);
      this.chatState = addMessage(this.chatState, {
        sender: localStorage.getItem("combat-protocol-mp-name") || "أنت",
        rank: tier.fullTitle,
        text,
        channel: this.chatState.channel,
      });
      if (input) input.value = "";
      this.renderChat();
    });

    // 360 Drag rotation for Lobby character showcase
    this.canvas?.addEventListener("pointerdown", (e) => {
      if (!this.running) this.lobbyShowcase?.onPointerDown(e.clientX);
    });
    window.addEventListener("pointermove", (e) => {
      if (!this.running) this.lobbyShowcase?.onPointerMove(e.clientX);
    });
    window.addEventListener("pointerup", () => {
      if (!this.running) this.lobbyShowcase?.onPointerUp();
    });

    document.getElementById("nav-play")?.addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("nav-store")?.addEventListener("click", () => this.openStore("menu"));
    document.getElementById("nav-armory")?.addEventListener("click", () => this.openArmory("menu"));
    document.getElementById("nav-pass")?.addEventListener("click", () => this.openProgression());
    document.getElementById("nav-friends")?.addEventListener("click", () => this.openFriends());
    document.getElementById("nav-mp")?.addEventListener("click", () => this.openMultiplayer());
    document.getElementById("nav-settings")?.addEventListener("click", () => this.openSettings("menu"));

    document.getElementById("resume-button")?.addEventListener("click", () => this.resumeGame());
    document.getElementById("pause-settings")?.addEventListener("click", () => this.openSettings("pause"));
    document.getElementById("restart-button")?.addEventListener("click", () => this.startGame());
    document.getElementById("quit-button")?.addEventListener("click", () => this.quitToMenu());

    document.getElementById("again-button")?.addEventListener("click", () => this.startGame());
    document.getElementById("gameover-menu")?.addEventListener("click", () => this.quitToMenu());

    document.getElementById("sensitivity")?.addEventListener("input", (event) => {
      document.getElementById("sensitivity-value").textContent = Number(event.target.value).toFixed(2);
    });
    document.getElementById("fov")?.addEventListener("input", (event) => {
      document.getElementById("fov-value").textContent = String(event.target.value);
    });

    this.canvas.addEventListener("click", () => {
      if (this.running && !this.paused && !this.isTouch && !this.input.locked) this.input.requestLock();
    });
  }

  bindInput() {
    this.input.onKey = (code) => {
      if (!this.running) return;
      if (code === "Escape" || code === "KeyP") {
        if (this.paused) this.resumeGame();
        else this.pauseGame();
        return;
      }
      if (this.paused) return;
      const now = performance.now() / 1000;
      if (this.dropState && this.dropState.phase !== "landed") {
        if (code === "Space" || code === "KeyF") {
          this.handleDropJump();
        }
        return;
      }
      if (code === "KeyR") this.weapons.startReload(now);
      if (code === "KeyF") this.weapons.cycle(1);
      if (code === "KeyG") this.grenades.tryThrow(now);
      if (code === "KeyV") this.weapons.tryMelee(now);
      if (code === "KeyQ") this.useAbility();
      if (code === "KeyE") this.tryPickup();
      if (/^Digit[1-9]$/.test(code)) this.weapons.switchTo(Number(code.slice(-1)) - 1, now);
    };
    this.input.onWheel = (direction) => {
      if (this.running && !this.paused) this.weapons.cycle(direction);
    };
    this.input.onLockChange = (locked) => {
      document.body.classList.toggle("is-locked", locked);
      if (!locked && this.running && !this.paused && !this.isTouch) this.pauseGame();
      this.updateLockHint();
    };
  }

  setupTouch() {
    if (!this.isTouch) return;
    document.body.classList.add("is-touch");
    const stick = document.getElementById("move-stick");
    const knob = document.getElementById("move-knob");
    const lookZone = document.getElementById("look-zone");
    const fire = document.getElementById("touch-fire");
    const reload = document.getElementById("touch-reload");
    const jump = document.getElementById("touch-jump");
    const swap = document.getElementById("touch-switch");
    const grenade = document.getElementById("touch-grenade");
    const interact = document.getElementById("touch-interact");

    let movePointer = null;
    let lookPointer = null;
    let lookLast = null;

    const resetStick = () => {
      movePointer = null;
      this.input.mobile.moveX = 0;
      this.input.mobile.moveY = 0;
      if (knob) knob.style.transform = "translate(0px, 0px)";
    };

    stick?.addEventListener("pointerdown", (event) => {
      movePointer = event.pointerId;
      stick.setPointerCapture(event.pointerId);
    });
    stick?.addEventListener("pointermove", (event) => {
      if (event.pointerId !== movePointer) return;
      const rect = stick.getBoundingClientRect();
      const radius = rect.width * 0.34;
      let dx = (event.clientX - (rect.left + rect.width / 2)) / radius;
      let dy = (event.clientY - (rect.top + rect.height / 2)) / radius;
      const length = Math.hypot(dx, dy);
      if (length > 1) {
        dx /= length;
        dy /= length;
      }
      this.input.mobile.moveX = dx;
      this.input.mobile.moveY = -dy;
      if (knob) knob.style.transform = `translate(${dx * radius * 0.55}px, ${dy * radius * 0.55}px)`;
    });
    stick?.addEventListener("pointerup", resetStick);
    stick?.addEventListener("pointercancel", resetStick);

    lookZone?.addEventListener("pointerdown", (event) => {
      lookPointer = event.pointerId;
      lookLast = { x: event.clientX, y: event.clientY };
      lookZone.setPointerCapture(event.pointerId);
    });
    lookZone?.addEventListener("pointermove", (event) => {
      if (event.pointerId !== lookPointer || !lookLast) return;
      const dx = event.clientX - lookLast.x;
      const dy = event.clientY - lookLast.y;
      lookLast = { x: event.clientX, y: event.clientY };
      this.input.mobile.lookX += dx * 1.35;
      this.input.mobile.lookY += dy * 1.35;
    });
    const releaseLook = (event) => {
      if (event.pointerId === lookPointer) {
        lookPointer = null;
        lookLast = null;
      }
    };
    lookZone?.addEventListener("pointerup", releaseLook);
    lookZone?.addEventListener("pointercancel", releaseLook);

    const holdFire = (event) => {
      event.preventDefault();
      this.input.mobile.fire = true;
      fire?.classList.add("is-down");
    };
    const releaseFire = (event) => {
      event.preventDefault();
      this.input.mobile.fire = false;
      fire?.classList.remove("is-down");
    };
    fire?.addEventListener("pointerdown", holdFire);
    fire?.addEventListener("pointerup", releaseFire);
    fire?.addEventListener("pointercancel", releaseFire);
    fire?.addEventListener("pointerleave", releaseFire);

    const tap = (element, handler) => {
      element?.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        element.classList.add("is-down");
        handler(event);
      });
      const release = () => element?.classList.remove("is-down");
      element?.addEventListener("pointerup", release);
      element?.addEventListener("pointercancel", release);
      element?.addEventListener("pointerleave", release);
    };
    const hold = (element, key) => {
      const down = (event) => {
        event.preventDefault();
        this.input.mobile[key] = true;
        element?.classList.add("is-down");
      };
      const up = (event) => {
        event.preventDefault();
        this.input.mobile[key] = false;
        element?.classList.remove("is-down");
      };
      element?.addEventListener("pointerdown", down);
      element?.addEventListener("pointerup", up);
      element?.addEventListener("pointercancel", up);
      element?.addEventListener("pointerleave", up);
    };
    const ads = document.getElementById("touch-ads");
    const crouch = document.getElementById("touch-crouch");
    const sprint = document.getElementById("touch-sprint");
    const ability = document.getElementById("touch-ability");
    const melee = document.getElementById("touch-melee");
    const pause = document.getElementById("touch-pause");

    tap(reload, () => this.weapons.startReload(performance.now() / 1000));
    tap(jump, () => {
      if (this.handleDropJump()) return;
      this.input.mobile.jump = true;
    });
    tap(swap, () => this.weapons.cycle(1));
    tap(grenade, () => this.grenades.tryThrow(performance.now() / 1000));
    tap(ability, () => this.useAbility());
    tap(melee, () => this.weapons.tryMelee(performance.now() / 1000));
    tap(pause, () => this.pauseGame());
    hold(ads, "ads");
    hold(crouch, "crouch");
    hold(sprint, "sprint");

    const holdInteract = (event) => {
      event.preventDefault();
      this.input.mobile.interact = true;
      interact?.classList.add("is-down");
      this.tryPickup();
    };
    const releaseInteract = (event) => {
      event.preventDefault();
      this.input.mobile.interact = false;
      interact?.classList.remove("is-down");
    };
    interact?.addEventListener("pointerdown", holdInteract);
    interact?.addEventListener("pointerup", releaseInteract);
    interact?.addEventListener("pointercancel", releaseInteract);
    interact?.addEventListener("pointerleave", releaseInteract);

    const updateRotateHint = () => {
      const portrait = window.innerHeight > window.innerWidth;
      this.dom.rotateHint.hidden = !(this.isTouch && this.running && portrait);
    };
    window.addEventListener("resize", updateRotateHint);
    this.updateRotateHint = updateRotateHint;
  }

  applySettings(settings) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.player.setSettings(this.settings);
    this.audio.setEnabled(this.settings.sound);
    this.renderer.shadowMap.enabled = this.settings.quality === "high" && !this.stableGraphics;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.settings.quality === "high" ? 1.8 : 1.2));
    for (const light of this.world.scene.children) {
      if (light.isDirectionalLight) light.castShadow = this.settings.quality === "high" && !this.stableGraphics;
    }
    this.updateCameraFov();
  }

  updateCameraFov() {
    const aspect = window.innerWidth / window.innerHeight;
    const base = this.settings.fov;
    const baseAspect = 16 / 9;
    let fov = base;
    if (aspect < baseAspect) {
      // Keep the horizontal field of view stable on portrait screens instead of
      // cropping it away and leaving half the display as empty sky.
      const horizontalTan = Math.tan(THREE.MathUtils.degToRad(base) / 2) * baseAspect;
      fov = Math.min(115, THREE.MathUtils.radToDeg(2 * Math.atan(horizontalTan / aspect)));
    }
    this.camera.fov = fov;
    if (this.player) this.player.baseFov = fov;
    this.camera.updateProjectionMatrix();
  }

  syncSettingsUi() {
    const set = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    };
    set("sensitivity", this.settings.sensitivity);
    set("fov", this.settings.fov);
    set("quality", this.settings.quality);
    const sound = document.getElementById("sound");
    if (sound) sound.checked = this.settings.sound;
    const invert = document.getElementById("invert-y");
    if (invert) invert.checked = this.settings.invertY;
    const sensitivityValue = document.getElementById("sensitivity-value");
    if (sensitivityValue) sensitivityValue.textContent = Number(this.settings.sensitivity).toFixed(2);
    const fovValue = document.getElementById("fov-value");
    if (fovValue) fovValue.textContent = String(this.settings.fov);
  }

  openSettings(returnTo) {
    this.settingsReturn = returnTo;
    this.syncSettingsUi();
    this.showScreen("settings");
  }

  closeSettings(save) {
    if (save) {
      const next = {
        sensitivity: Number(document.getElementById("sensitivity")?.value ?? DEFAULT_SETTINGS.sensitivity),
        fov: Number(document.getElementById("fov")?.value ?? DEFAULT_SETTINGS.fov),
        quality: document.getElementById("quality")?.value ?? DEFAULT_SETTINGS.quality,
        sound: Boolean(document.getElementById("sound")?.checked),
        invertY: Boolean(document.getElementById("invert-y")?.checked),
      };
      this.applySettings(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    this.showScreen(this.settingsReturn === "pause" ? "pause" : "menu");
  }

  resetSettings() {
    this.applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    this.syncSettingsUi();
  }

  renderModeCards() {
    const grid = document.getElementById("mode-grid");
    if (!grid) return;
    grid.innerHTML = Object.values(MODE_DEFS)
      .map(
        (mode) => `
          <button class="mode-card${mode.id === this.modeId ? " is-selected" : ""}" data-mode="${mode.id}" type="button">
            <span class="mode-card-kicker">${mode.label}</span>
            <strong>${mode.arabic}</strong>
            <small>${mode.description}</small>
            <em>${mode.objective}</em>
          </button>`,
      )
      .join("");
    grid.querySelectorAll("[data-mode]").forEach((card) => {
      card.addEventListener("click", () => {
        this.modeId = card.dataset.mode;
        this.mode = getMode(this.modeId);
        this.telemetry.emit("mode_selected", { modeId: this.modeId });
        grid.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("is-selected", item === card));
      });
    });
  }

  renderMapCards() {
    const grid = document.getElementById("map-grid");
    if (!grid) return;
    grid.innerHTML = Object.values(MAP_DEFS)
      .map(
        (map) => `
          <button class="mode-card${map.id === this.mapId ? " is-selected" : ""}" data-map="${map.id}" type="button">
            <span class="mode-card-kicker">MAP / ${map.id.toUpperCase()}</span>
            <strong>${map.arabic}</strong>
            <small>${map.label} — ${map.flow ?? "layout deterministic"}</small>
            <em>اختيار يتطلب إعادة تحميل الساحة</em>
          </button>`,
      )
      .join("");
    grid.querySelectorAll("[data-map]").forEach((card) => {
      card.addEventListener("click", () => {
        const target = new URL(window.location.href);
        target.searchParams.set("map", card.dataset.map);
        window.location.href = target.toString();
      });
    });
  }

  renderQuickMapPicker() {
    const select = document.getElementById("menu-map-select");
    const current = document.getElementById("menu-map-current");
    if (!select) return;
    select.innerHTML = Object.values(MAP_DEFS)
      .map((map) => `<option value="${map.id}">${map.arabic} — ${map.label}</option>`)
      .join("");
    select.value = this.mapId;
    if (current) current.textContent = mapById(this.mapId).arabic;
    select.addEventListener("change", () => {
      const target = new URL(window.location.href);
      target.searchParams.set("map", select.value);
      target.searchParams.delete("demo");
      window.location.href = target.toString();
    });
  }

  renderArmory() {
    const profile = this.profile;
    const operatorGrid = document.getElementById("operator-grid");
    const loadoutGrid = document.getElementById("loadout-grid");
    const meta = document.getElementById("profile-meta");
    if (meta) meta.textContent = `المستوى ${profile.level} · XP ${profile.xp} · Credits ${profile.credits}`;
    if (operatorGrid) {
      operatorGrid.innerHTML = OPERATOR_DEFS.map(
        (operator) => `
          <button class="operator-card${profile.operatorId === operator.id ? " is-selected" : ""}" data-operator="${operator.id}" type="button">
            <span>${operator.role}</span><strong>${operator.arabic}</strong><small>${operator.description}</small>
          </button>`,
      ).join("");
      operatorGrid.querySelectorAll("[data-operator]").forEach((card) =>
        card.addEventListener("click", () => {
          this.armoryDraft.operatorId = card.dataset.operator;
          operatorGrid.querySelectorAll("[data-operator]").forEach((item) => item.classList.toggle("is-selected", item === card));
        }),
      );
    }
    if (loadoutGrid) {
      loadoutGrid.innerHTML = WEAPON_DEFS.map((weapon) => {
        const selected = getLoadoutIds(this.armoryDraft, weapon.id);
        const options = ATTACHMENT_DEFS.map(
          (attachment) => `<option value="${attachment.id}" ${selected.includes(attachment.id) ? "selected" : ""}>${attachment.arabic}</option>`,
        ).join("");
        return `<label class="loadout-card"><span><strong>${weapon.name}</strong><small>${weapon.role}</small></span><select data-weapon="${weapon.id}" multiple size="3">${options}</select></label>`;
      }).join("");
    }
    const skinsGrid = document.getElementById("skins-grid");
    if (skinsGrid) {
      const unlocked = new Set(this.armoryDraft?.unlockedSkins ?? ["standard"]);
      const equipped = this.armoryDraft?.equippedSkin ?? "standard";
      const credits = Number(this.armoryDraft?.credits ?? 0);

      skinsGrid.innerHTML = WEAPON_SKINS.map((skin) => {
        const isUnlocked = unlocked.has(skin.id);
        const isEquipped = equipped === skin.id;
        const swatchColor = skin.body ? `#${skin.body.toString(16).padStart(6, "0")}` : "#444";
        const accentColor = skin.accent ? `#${skin.accent.toString(16).padStart(6, "0")}` : "#d9a45c";

        let buttonHtml = "";
        if (isEquipped) {
          buttonHtml = `<button class="skin-card-btn is-active" type="button" disabled>مجهّز حالياً</button>`;
        } else if (isUnlocked) {
          buttonHtml = `<button class="skin-card-btn" data-equip-skin="${skin.id}" type="button">تجهيز</button>`;
        } else {
          const canAfford = credits >= skin.cost;
          buttonHtml = `<button class="skin-card-btn" data-buy-skin="${skin.id}" type="button" ${canAfford ? "" : "disabled"}>
            شراء (${skin.cost} نقطة)
          </button>`;
        }

        return `
          <div class="skin-card${isEquipped ? " is-equipped" : ""}">
            <div class="skin-card-header">
              <span class="skin-card-swatch" style="background: linear-gradient(135deg, ${swatchColor} 60%, ${accentColor} 60%);"></span>
              <small style="color:var(--faint);font-family:var(--mono);">${skin.name}</small>
            </div>
            <strong>${skin.arabic}</strong>
            ${buttonHtml}
          </div>
        `;
      }).join("");

      skinsGrid.querySelectorAll("[data-equip-skin]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.armoryDraft.equippedSkin = btn.dataset.equipSkin;
          this.renderArmory();
        });
      });

      skinsGrid.querySelectorAll("[data-buy-skin]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const res = buySkin(this.armoryDraft, btn.dataset.buySkin);
          if (res.bought) {
            this.armoryDraft = res.profile;
            this.profile = saveProfile(this.armoryDraft);
            this.renderArmory();
          }
        });
      });
    }
  }

  openArmory(returnTo = "menu") {
    this.armoryReturn = returnTo;
    this.armoryDraft = JSON.parse(JSON.stringify(this.profile));
    this.renderArmory();
    this.showScreen("armory");
  }

  closeArmory(save) {
    if (save) {
      document.querySelectorAll("#loadout-grid [data-weapon]").forEach((select) => {
        this.armoryDraft.loadout[select.dataset.weapon] = [...select.selectedOptions].map((option) => option.value).slice(0, 3);
      });
      this.profile = saveProfile(this.armoryDraft);
      this.weapons.applyLoadout(this.profile);
      this.player.setOperator(operatorById(this.profile.operatorId));
      this.abilityState = createAbilityState(this.profile.operatorId);
    }
    this.showScreen(this.armoryReturn === "pause" ? "pause" : "menu");
  }

  showScreen(name) {
    const screenKey = name === "gun-lab" ? "gunLab" : name;
    for (const key of [
      "menu",
      "how",
      "lobby",
      "multiplayer",
      "modes",
      "armory",
      "settings",
      "pause",
      "gameover",
      "store",
      "friends",
      "progression",
      "crates",
      "gunLab",
    ]) {
      const element = this.dom[key];
      if (element) element.hidden = key !== screenKey;
    }
    const navTabs = document.querySelectorAll(".nav-tab");
    navTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.id === `nav-${name === "menu" ? "play" : name === "progression" ? "pass" : name === "multiplayer" ? "mp" : name}`);
    });
    this.syncLobbyProfileBadge();
    if (name === "menu") {
      this.renderChat();
      if (this.lobbyShowcase) {
        this.lobbyShowcase.setVisible(true);
        this.lobbyShowcase.setPlayer(this.profile.operatorId, this.profile.equippedSkin);
      }
    } else if (name !== "settings" && this.lobbyShowcase) {
      // In modals, keep podium visible or dimmed
    }
    if (name !== "pause" && name !== "gameover") {
      this.hud.setVisible(name === "settings" ? this.running : this.running && name !== "menu");
    }
  }

  hideAllScreens() {
    for (const key of [
      "menu",
      "how",
      "lobby",
      "multiplayer",
      "modes",
      "armory",
      "settings",
      "pause",
      "gameover",
      "store",
      "friends",
      "progression",
      "crates",
      "gunLab",
    ]) {
      if (this.dom[key]) this.dom[key].hidden = true;
    }
  }

  syncLobbyProfileBadge() {
    const profile = this.profile;
    const nameEl = document.getElementById("badge-name");
    const rankEl = document.getElementById("badge-rank");
    const levelEl = document.getElementById("badge-level");
    const xpFill = document.getElementById("badge-xp-fill");
    const creditsEl = document.getElementById("badge-credits-val");
    const materialsEl = document.getElementById("badge-materials-val");
    const tierIcon = document.getElementById("badge-tier-icon");
    const tierTitle = document.getElementById("badge-tier-title");
    const rpVal = document.getElementById("badge-rp-val");

    if (nameEl) nameEl.textContent = profile?.name ?? "Player";
    if (rankEl) rankEl.textContent = rankTitle(profile?.level ?? 1);
    if (levelEl) levelEl.textContent = `LVL ${profile?.level ?? 1}`;
    if (xpFill) {
      const xpInto = (profile?.xp ?? 0) % 1000;
      xpFill.style.width = `${Math.min(100, Math.round((xpInto / 1000) * 100))}%`;
    }
    if (creditsEl) creditsEl.textContent = String(profile?.credits ?? 0);
    if (materialsEl) materialsEl.textContent = String(profile?.weaponMaterials ?? 0);

    const tier = getTierForRp(profile?.rp ?? 1200);
    if (tierIcon) tierIcon.textContent = tier.icon;
    if (tierTitle) {
      tierTitle.textContent = tier.fullTitle;
      tierTitle.style.color = tier.color;
    }
    if (rpVal) rpVal.textContent = `${profile?.rp ?? 1200} RP`;
  }

  openStore(returnTo = "menu") {
    this.storeReturn = returnTo;
    this.renderStore();
    this.showScreen("store");
  }

  renderStore() {
    const profile = this.profile;
    const meta = document.getElementById("store-meta");
    if (meta) meta.textContent = `رصيدك الحالي: ${profile.credits ?? 0} نقطة رصيد`;

    const bundlesGrid = document.getElementById("store-bundles-grid");
    if (bundlesGrid) {
      const claimed = new Set(profile.claimedBundles ?? []);
      bundlesGrid.innerHTML = STORE_BUNDLES.map((bundle) => {
        const isClaimed = claimed.has(bundle.id);
        const canAfford = (profile.credits ?? 0) >= bundle.price;
        return `
          <div class="bundle-card">
            <span class="bundle-badge">${bundle.badge}</span>
            <strong>${bundle.arabic}</strong>
            <p>${bundle.description}</p>
            <div class="bundle-price-row">
              <span class="bundle-price">💳 ${bundle.price} نقطة</span>
              <button class="btn btn-primary" data-buy-bundle="${bundle.id}" type="button" ${isClaimed || !canAfford ? "disabled" : ""}>
                ${isClaimed ? "تم الشراء ✓" : canAfford ? "شراء الحزمة" : "نقاط غير كافية"}
              </button>
            </div>
          </div>
        `;
      }).join("");

      bundlesGrid.querySelectorAll("[data-buy-bundle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const res = buyBundle(this.profile, btn.dataset.buyBundle);
          if (res.bought) {
            this.profile = saveProfile(res.profile);
            this.syncLobbyProfileBadge();
            this.weapons.applyLoadout(this.profile);
            this.audio.playPickup("armor");
            this.renderStore();
          }
        });
      });
    }

    const skinsGrid = document.getElementById("store-skins-grid");
    if (skinsGrid) {
      const unlocked = new Set(profile.unlockedSkins ?? ["standard"]);
      const equipped = profile.equippedSkin ?? "standard";
      const credits = Number(profile.credits ?? 0);

      skinsGrid.innerHTML = WEAPON_SKINS.map((skin) => {
        const isUnlocked = unlocked.has(skin.id);
        const isEquipped = equipped === skin.id;
        const swatchColor = skin.body ? `#${skin.body.toString(16).padStart(6, "0")}` : "#444";
        const accentColor = skin.accent ? `#${skin.accent.toString(16).padStart(6, "0")}` : "#d9a45c";

        let buttonHtml = "";
        if (isEquipped) {
          buttonHtml = `<button class="skin-card-btn is-active" type="button" disabled>مجهّز حالياً</button>`;
        } else if (isUnlocked) {
          buttonHtml = `<button class="skin-card-btn" data-store-equip="${skin.id}" type="button">تجهيز</button>`;
        } else {
          const canAfford = credits >= skin.cost;
          buttonHtml = `<button class="skin-card-btn" data-store-buy="${skin.id}" type="button" ${canAfford ? "" : "disabled"}>
            شراء (${skin.cost} نقطة)
          </button>`;
        }

        return `
          <div class="skin-card${isEquipped ? " is-equipped" : ""}">
            <div class="skin-card-header">
              <span class="skin-card-swatch" style="background: linear-gradient(135deg, ${swatchColor} 60%, ${accentColor} 60%);"></span>
              <small style="color:var(--faint);font-family:var(--mono);">${skin.name}</small>
            </div>
            <strong>${skin.arabic}</strong>
            ${buttonHtml}
          </div>
        `;
      }).join("");

      skinsGrid.querySelectorAll("[data-store-equip]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.profile = saveProfile({ ...this.profile, equippedSkin: btn.dataset.storeEquip });
          this.weapons.applyLoadout(this.profile);
          this.renderStore();
        });
      });

      skinsGrid.querySelectorAll("[data-store-buy]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const res = buySkin(this.profile, btn.dataset.storeBuy);
          if (res.bought) {
            this.profile = saveProfile(res.profile);
            this.syncLobbyProfileBadge();
            this.weapons.applyLoadout(this.profile);
            this.renderStore();
          }
        });
      });
    }
  }

  openFriends() {
    this.friendsList = loadFriends();
    this.renderFriends();
    this.showScreen("friends");
  }

  renderFriends() {
    const container = document.getElementById("friends-list");
    if (!container) return;
    container.innerHTML = this.friendsList.map((f) => `
      <div class="friend-card">
        <div class="friend-main">
          <span class="friend-dot ${f.status}"></span>
          <div>
            <div class="friend-name">${f.name} <small style="color:var(--amber);">[${f.rank}]</small></div>
            <div class="friend-status">${f.statusLabel}</div>
          </div>
        </div>
        <div class="friend-actions">
          <button class="friend-btn" data-invite="${f.id}" type="button">دعوة</button>
          ${f.room ? `<button class="friend-btn" data-join="${f.room}" type="button">انضمام</button>` : ""}
          <button class="friend-btn danger" data-remove="${f.id}" type="button">×</button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll("[data-invite]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const feedback = document.getElementById("friends-feedback");
        if (feedback) feedback.textContent = "تم إرسال دعوة للانضمام إلى الغرفة!";
        this.audio.ui();
      });
    });

    container.querySelectorAll("[data-join]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const roomInput = document.getElementById("mp-room");
        if (roomInput) roomInput.value = btn.dataset.join;
        this.openMultiplayer();
      });
    });

    container.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.friendsList = removeFriend(this.friendsList, btn.dataset.remove);
        this.renderFriends();
      });
    });
  }

  openProgression() {
    this.renderBattlePass();
    this.showScreen("progression");
  }

  renderBattlePass() {
    const profile = this.profile;
    const meta = document.getElementById("pass-meta");
    const rankTitleEl = document.getElementById("pass-rank-title");
    const xpLabel = document.getElementById("pass-xp-label");
    const xpFill = document.getElementById("pass-xp-fill");

    const curLevel = profile?.level ?? 1;
    const curXp = profile?.xp ?? 0;
    const intoLevel = curXp % 1000;
    const rank = rankTitle(curLevel);

    if (meta) meta.textContent = `المستوى ${curLevel} · ${rank} · ${curXp} XP الإجمالي`;
    if (rankTitleEl) rankTitleEl.textContent = `${rank} — المستوى ${curLevel}`;
    if (xpLabel) xpLabel.textContent = `${intoLevel} / 1000 XP إلى المستوى التالي`;
    if (xpFill) xpFill.style.width = `${Math.min(100, Math.round((intoLevel / 1000) * 100))}%`;

    const trackEl = document.getElementById("pass-tiers-track");
    if (trackEl) {
      const claimed = new Set(profile?.claimedPassTiers ?? []);
      trackEl.innerHTML = BATTLE_PASS_TIERS.map((tier) => {
        const isClaimed = claimed.has(tier.tier);
        const canClaim = curLevel >= tier.levelReq;
        return `
          <div class="pass-tier-card${isClaimed ? " is-claimed" : ""}">
            <span class="pass-tier-num">TIER ${tier.tier}</span>
            <strong>${tier.reward}</strong>
            <span class="pass-tier-req">يتطلب المستوى ${tier.levelReq}</span>
            <button class="pass-tier-btn${isClaimed ? " claimed" : ""}" data-claim-tier="${tier.tier}" type="button" ${isClaimed || !canClaim ? "disabled" : ""}>
              ${isClaimed ? "تم الاستلام ✓" : canClaim ? "استلام المكافأة" : `مغلق (LVL ${tier.levelReq})`}
            </button>
          </div>
        `;
      }).join("");

      trackEl.querySelectorAll("[data-claim-tier]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const res = claimBattlePassTier(this.profile, Number(btn.dataset.claimTier));
          if (res.claimed) {
            this.profile = saveProfile(res.profile);
            this.syncLobbyProfileBadge();
            this.audio.playPickup("ammo");
            this.renderBattlePass();
          }
        });
      });
    }
  }

  renderChat() {
    const listEl = document.getElementById("chat-messages");
    if (!listEl) return;
    const channel = this.chatState.channel ?? "world";
    const messages = filterMessagesByChannel(this.chatState.messages, channel);

    document.querySelectorAll(".chat-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.id === `chat-tab-${channel}`);
    });

    listEl.innerHTML = messages.map((m) => `
      <div class="chat-msg-row">
        <span class="chat-msg-sender">${m.sender}</span>
        <span class="chat-msg-rank">${m.rank}</span>
        <span class="chat-msg-text">${m.text}</span>
        ${m.room ? `<button class="chat-msg-btn" data-room-join="${m.room}">انضمام</button>` : ""}
      </div>
    `).join("");

    listEl.querySelectorAll("[data-room-join]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const roomInput = document.getElementById("mp-room");
        if (roomInput) roomInput.value = btn.dataset.roomJoin;
        this.openMultiplayer();
      });
    });

    const quickBar = document.getElementById("quick-chat-bar");
    if (quickBar && quickBar.children.length === 0) {
      quickBar.innerHTML = QUICK_MESSAGES.map((text) => `
        <button class="quick-chip" type="button" data-quick="${text}">${text}</button>
      `).join("");
      quickBar.querySelectorAll("[data-quick]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const tier = getTierForRp(this.profile.rp ?? 1200);
          this.chatState = addMessage(this.chatState, {
            sender: localStorage.getItem("combat-protocol-mp-name") || "أنت",
            rank: tier.fullTitle,
            text: btn.dataset.quick,
            channel: this.chatState.channel,
          });
          this.renderChat();
        });
      });
    }
  }

  openCrates() {
    this.renderCrates();
    this.showScreen("crates");
  }

  renderCrates() {
    const meta = document.getElementById("crates-meta");
    if (meta) meta.textContent = `رصيدك الحالي: ${this.profile.credits ?? 0} نقطة رصيد`;

    const selector = document.getElementById("crates-selector-row");
    if (selector) {
      selector.innerHTML = CRATE_DEFS.map((crate) => {
        const isSelected = crate.id === this.selectedCrateId;
        return `
          <div class="crate-select-card${isSelected ? " is-active" : ""}" data-crate-select="${crate.id}">
            <span class="crate-card-badge ${crate.id === "crate-mythic" ? "mythic" : "classic"}">${crate.badge}</span>
            <h3 style="margin:4px 0 6px 0; font-size:15px;">${crate.arabic}</h3>
            <p style="font-size:11px; color:var(--muted); margin:0;">${crate.description}</p>
          </div>
        `;
      }).join("");

      selector.querySelectorAll("[data-crate-select]").forEach((card) => {
        card.addEventListener("click", () => {
          this.selectedCrateId = card.dataset.crateSelect;
          this.renderCrates();
        });
      });
    }

    const currentCrate = CRATE_DEFS.find((c) => c.id === this.selectedCrateId) || CRATE_DEFS[0];
    const display = document.getElementById("crate-display-area");
    if (display) {
      display.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:10px;">
          <div>
            <h3 style="margin:0; font-size:17px; color:var(--amber);">${currentCrate.arabic}</h3>
            <span style="font-size:12px; color:var(--muted);">${currentCrate.name}</span>
          </div>
          <div style="font-family:var(--mono); font-size:13px; color:var(--ink);">
            تكلفة السحب: <strong>${currentCrate.cost}</strong> عملة
          </div>
        </div>

        <div style="margin-top:10px;">
          <span style="font-size:11px; font-family:var(--mono); color:var(--muted);">المحتويات المحتملة ونسب السقوط:</span>
          <div class="crate-items-grid" style="margin-top:8px;">
            ${currentCrate.items.map((it) => {
              const rarity = RARITY_INFO[it.rarity] || RARITY_INFO.rare;
              return `
                <div class="crate-item-slot ${it.rarity}">
                  <span class="crate-item-rarity-tag" style="color:${rarity.color}">${rarity.label}</span>
                  <div style="font-size:12px; font-weight:700; margin-top:4px;">${it.name}</div>
                  <div style="font-size:10px; color:var(--muted); margin-top:2px;">احتمال: ${it.weight}%</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="crate-actions-row">
          <button class="btn btn-quiet" id="crate-open-1" type="button" style="padding:10px 24px; font-size:13px;">
            فتح 1x (${currentCrate.cost} عملة)
          </button>
          <button class="btn btn-primary" id="crate-open-10" type="button" style="padding:10px 28px; font-size:13px;">
            فتح 10x (${currentCrate.cost * 10} عملة — مضمون ملحمي+)
          </button>
        </div>
      `;

      document.getElementById("crate-open-1")?.addEventListener("click", () => this.triggerCrateOpen(1));
      document.getElementById("crate-open-10")?.addEventListener("click", () => this.triggerCrateOpen(10));
    }
  }

  triggerCrateOpen(count) {
    const res = openCrate(this.profile, this.selectedCrateId, count);
    const feedback = document.getElementById("crate-spin-feedback");
    if (!res.success) {
      if (feedback) {
        feedback.hidden = false;
        feedback.innerHTML = `<span style="color:#ff4444; font-weight:700;">عفواً: رصيدك غير كافٍ! تحتاج ${res.needed} نقطة رصيد ولديك ${res.have} فقط.</span>`;
      }
      return;
    }

    this.profile = saveProfile(res.profile);
    this.syncLobbyProfileBadge();
    this.audio.playPickup("ammo");

    if (feedback) {
      feedback.hidden = false;
      feedback.innerHTML = `
        <h3 style="color:var(--amber); margin:0 0 10px 0;">🎉 تم فتح ${res.pullCount} صندوق بنجاح! المكافآت التي حصلت عليها:</h3>
        <div class="spin-reveal-grid">
          ${res.results.map((it) => {
            const rarity = RARITY_INFO[it.rarity] || RARITY_INFO.rare;
            return `
              <div class="spin-card" style="border:1px solid ${rarity.color}; background:rgba(0,0,0,0.5); box-shadow:0 0 12px ${rarity.glow};">
                <span style="color:${rarity.color}; font-size:10px; font-weight:700;">${rarity.label}</span>
                <div style="font-weight:700; font-size:13px; margin-top:4px;">${it.name}</div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }
    this.renderCrates();
  }

  openGunLab() {
    this.renderGunLab();
    this.showScreen("gun-lab");
  }

  renderGunLab() {
    const meta = document.getElementById("lab-meta");
    if (meta) meta.textContent = `قطع التعديل: ${this.profile.weaponMaterials ?? 0} | الرصيد: ${this.profile.credits ?? 0} نقطة`;

    const selector = document.getElementById("lab-selector-row");
    if (selector) {
      selector.innerHTML = UPGRADABLE_WEAPONS.map((w) => {
        const isSel = w.id === this.selectedLabWeaponId;
        const curLvl = getWeaponUpgradeLevel(this.profile, w.id);
        return `
          <button class="lab-select-btn${isSel ? " is-active" : ""}" data-lab-select="${w.id}" type="button">
            ${w.name} (المستوى ${curLvl}/${w.maxLevel})
          </button>
        `;
      }).join("");

      selector.querySelectorAll("[data-lab-select]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.selectedLabWeaponId = btn.dataset.labSelect;
          this.renderGunLab();
        });
      });
    }

    const currentWeapon = UPGRADABLE_WEAPONS.find((w) => w.id === this.selectedLabWeaponId) || UPGRADABLE_WEAPONS[0];
    const currentLevel = getWeaponUpgradeLevel(this.profile, currentWeapon.id);
    const workbench = document.getElementById("lab-workbench");
    const nextLevelDef = currentWeapon.levels.find((l) => l.level === currentLevel + 1);

    if (workbench) {
      workbench.innerHTML = `
        <div style="border-bottom:1px solid var(--line); padding-bottom:12px;">
          <h3 style="margin:0; font-size:18px; color:var(--amber);">${currentWeapon.name}</h3>
          <p style="font-size:12px; color:var(--muted); margin:4px 0 0 0;">${currentWeapon.description}</p>
        </div>

        <div>
          <span class="kicker" style="font-size:10px;">مسار التطوير (Level Upgrades)</span>
          <div class="lab-levels-track" style="margin-top:8px;">
            ${currentWeapon.levels.map((lvl) => {
              const isUnlocked = currentLevel >= lvl.level;
              const isCurrent = currentLevel === lvl.level;
              return `
                <div class="lab-level-card ${isCurrent ? "current" : isUnlocked ? "unlocked" : ""}">
                  <span class="lab-level-num">المستوى ${lvl.level} ${isUnlocked ? "✓" : "🔒"}</span>
                  <span class="lab-level-title">${lvl.title}</span>
                  <span class="lab-level-perk">${lvl.perk}</span>
                  ${lvl.level > 1 && !isUnlocked ? `
                    <span style="font-size:10px; font-family:var(--mono); color:var(--amber); margin-top:4px;">
                      يتطلب: ${lvl.costMaterials} مادة + ${lvl.costCredits} عملة
                    </span>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="lab-upgrade-bar">
          ${nextLevelDef ? `
            <div class="lab-cost-pills">
              <span>تكلفة الترقية لمستوى ${nextLevelDef.level}:</span>
              <strong style="color:#34d399;">🧪 ${nextLevelDef.costMaterials} مادة</strong>
              <strong style="color:var(--amber);">💳 ${nextLevelDef.costCredits} عملة</strong>
            </div>
            <button class="btn btn-primary" id="lab-upgrade-btn" type="button" style="padding:10px 24px;">
              ترقية السلاح للمستوى ${nextLevelDef.level} ⚡
            </button>
          ` : `
            <div style="color:#34d399; font-weight:700; font-family:var(--mono);">
              🌟 وصل السلاح لأعلى مستوى تطور أسطوري (MAX LEVEL)!
            </div>
          `}
        </div>
        <div id="lab-feedback" style="text-align:center; font-size:13px; font-family:var(--mono);" aria-live="polite"></div>
      `;

      document.getElementById("lab-upgrade-btn")?.addEventListener("click", () => this.triggerGunUpgrade());
    }
  }

  triggerGunUpgrade() {
    const res = upgradeLabWeapon(this.profile, this.selectedLabWeaponId);
    const feedback = document.getElementById("lab-feedback");
    if (!res.upgraded) {
      if (feedback) {
        feedback.style.color = "#ff4444";
        feedback.textContent = `تعذرت الترقية: تحتاج ${res.neededMaterials} مادة و ${res.neededCredits} عملة. رصيدك الحالي: ${res.haveMaterials} مادة و ${res.haveCredits} عملة.`;
      }
      return;
    }

    this.profile = saveProfile(res.profile);
    this.syncLobbyProfileBadge();
    this.audio.playPickup("ammo");
    if (feedback) {
      feedback.style.color = "#34d399";
      feedback.textContent = `تهانينا! تمت ترقية السلاح بنجاح إلى المستوى ${res.newLevel}: ${res.levelDef.title} 🚀`;
    }
    this.renderGunLab();
  }

  startGame({ demo = false } = {}) {
    if (this.matchId) {
      this.telemetry.endMatch("restarted", { score: this.score, kills: this.kills });
      this.matchId = null;
    }
    this.demo = demo;
    this.mode = getMode(this.modeId);
    this.missionDef = this.mode.missionId ? missionById(this.mode.missionId) : null;
    if (this.missionDef && this.world.mapId !== this.missionDef.mapId) {
      const target = new URL(window.location.href);
      target.searchParams.set("map", this.missionDef.mapId);
      window.location.href = target.toString();
      return;
    }
    this.audio.ensure();
    this.audio.startAmbient();
    this.hideAllScreens();
    this.hud.setVisible(true);
    this.hud.reset(this.mode.duration);
    this.weapons.setVisible(true);
    this.weapons.reset();
    this.weapons.applyLoadout(this.profile);
    this.grenades.reset(this.mode.grenadesPerMatch ?? 2);
    this.inventory = createInventory();
    this.loot.reset((this.profile?.stats?.matches ?? 1) * 13 + 5, this.mode.id === "battleRoyale" ? LOOT_SPAWN_COUNT.battleRoyale : 0);
    const lootPrompt = document.getElementById("loot-prompt");
    if (lootPrompt) lootPrompt.hidden = true;
    const lootSummary = document.getElementById("loot-summary");
    if (lootSummary) lootSummary.textContent = inventorySummary(this.inventory);
    this.cleanUpDropModels();
    this.lobbyShowcase?.setVisible(false);
    if (this.mode.id === "battleRoyale") {
      const spawn = this.world.getSpawn(0);
      const bounds = this.world.bounds ?? { halfX: 34, halfZ: 24 };
      this.dropTarget = { x: spawn.x + 4, z: spawn.z - 6 };
      this.dropState = createDropState();
      this.cargoPlane = createCargoPlane();
      this.planePos = new THREE.Vector3(spawn.x - 4, DROP_CONFIG.planeAltitude, -bounds.halfZ - 50);
      this.planeSpeed = 26;
      this.cargoPlane.group.position.copy(this.planePos);
      this.world.scene.add(this.cargoPlane.group);
      this.cargoPlane.setJumpReady(true);
      const dropHud = document.getElementById("drop-hud");
      if (dropHud) dropHud.hidden = false;
    } else {
      this.dropState = null;
      const dropHud = document.getElementById("drop-hud");
      if (dropHud) dropHud.hidden = true;
    }
    this.player.setOperator(operatorById(this.profile.operatorId));
    this.abilityState = createAbilityState(this.profile.operatorId);
    this.reconUntil = 0;
    this.abilityBoostUntil = 0;
    this.player.abilitySpeedBoost = 1;
    this.world.clearTempBarriers();
    const botTarget =
      this.mode.id === "battleRoyale" || this.mode.id === "deathmatch"
        ? botCountFor(this.lobby, this.mode)
        : this.mode.enemyCount;
    this.enemies.ensureCount(Math.max(1, botTarget));
    this.enemies.setDifficulty(difficultyOf(this.lobby));
    this.enemies.configure({ respawn: this.mode.enemyRespawn, infighting: this.mode.id === "battleRoyale" });
    this.enemies.suppressAttack = this.mode.id === "battleRoyale";
    document.body.dataset.mode = this.mode.id;
    if (this.mode.id === "survival") this.enemies.startWave(this.mode.waveStartCount);
    else this.enemies.reset();
    this.player.reset(this.world.getSpawn(0));
    if (demo) {
      this.player.position.set(0, 0, 15);
      this.player.yaw = 0;
      this.player.pitch = -0.02;
      const demoPositions = [
        [-8, 6],
        [8, 6],
      ];
      demoPositions.forEach(([x, z], index) => {
        const enemy = this.enemies.enemies[index];
        if (!enemy) return;
        enemy.position.set(x, 0, z);
        enemy.group.position.copy(enemy.position);
        enemy.yaw = Math.atan2(-(this.player.position.x - x), -(this.player.position.z - z));
        enemy.group.rotation.y = enemy.yaw;
      });
    }
    this.timeLeft = this.mode.duration;
    this.score = 0;
    this.kills = 0;
    this.headshots = 0;
    this.fireHeld = false;
    this.running = true;
    this.paused = false;
    this.started = true;
    this.endReason = null;
    this.wave = 1;
    this.modeState = createModeState(this.mode);
    this.missionState = this.missionDef ? createMissionState(this.missionDef) : null;
    this.respawnUntil = 0;
    this.respawnCount = 0;
    this.profile.stats.matches += 1;
    this.zonePlan = this.mode.id === "battleRoyale" ? createBattleRoyaleZonePlan(this.profile.stats.matches, this.mode.duration) : null;
    this.zone = this.zonePlan ? sampleBattleRoyaleZone(this.zonePlan, 0) : null;
    this.enemies.zone = this.zone;
    this.world.setStormZone(this.zone);
    this.zoneTick = 0;
    this.matchId = this.telemetry.startMatch(this.mode.id, {
      duration: this.mode.duration,
      objectiveType: this.mode.objectiveType,
    });
    this.telemetry.emit("objective_started", { type: this.mode.objectiveType, map: this.world.mapId });
    this.world.setMissionObjective(this.missionState?.pointId ?? null);
    if (this.missionState && this.missionDef) {
      this.telemetry.emit("mission_started", {
        missionId: this.missionDef.id,
        operatorId: this.profile.operatorId,
        weaponId: this.weapons.currentState.def.id,
      });
      this.telemetry.emit("objective_started", {
        missionId: this.missionDef.id,
        objectiveId: this.missionState.objectiveId,
      });
    }
    saveProfile(this.profile);
    this.input.setEnabled(true);
    this.input.look.x = 0;
    this.input.look.y = 0;
    this.dom.lockHint?.classList.toggle("is-hidden", demo || this.isTouch);
    this.dom.touch.hidden = !(this.isTouch && !demo);
    this.dom.rotateHint.hidden = true;
    document.body.classList.remove("is-locked");
    if (!demo && !this.isTouch) this.input.requestLock();
    this.player.updateCamera(0, 0, 0);
    this.hud.setWeapon(this.weapons.getHudState());
    this.updateLockHint();
    this.audio.ui();
  }

  pauseGame() {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.input.setEnabled(false);
    this.input.exitLock();
    this.dom.pause.hidden = false;
    this.dom.menu.hidden = true;
    this.dom.lockHint?.classList.add("is-hidden");
    this.audio.stopAmbient();
    document.body.classList.remove("is-locked");
  }

  resumeGame() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.dom.pause.hidden = true;
    this.input.setEnabled(true);
    this.audio.startAmbient();
    if (!this.isTouch) this.input.requestLock();
    this.updateLockHint();
  }

  quitToMenu() {
    if (this.matchId) {
      this.telemetry.endMatch("abandoned", { score: this.score, kills: this.kills });
      this.matchId = null;
    }
    if (this.net) {
      this.net.disconnect();
      this.net = null;
    }
    if (this.remote) {
      this.remote.clear();
      this.remote = null;
    }
    this.multiplayer = false;
    this.mpDead = false;
    this.mpSelfId = null;
    const hudChat = document.getElementById("mp-hud");
    if (hudChat) hudChat.hidden = true;
    this.running = false;
    this.paused = false;
    this.started = false;
    this.input.setEnabled(false);
    this.input.exitLock();
    this.audio.stopAmbient();
    this.weapons.setVisible(false);
    this.world.setMissionObjective(null);
    this.world.setStormZone(null);
    this.world.clearTempBarriers();
    this.missionState = null;
    this.missionDef = null;
    this.cleanUpDropModels();
    const dropHud = document.getElementById("drop-hud");
    if (dropHud) dropHud.hidden = true;
    this.hud.setVisible(false);
    this.dom.touch.hidden = true;
    this.dom.rotateHint.hidden = true;
    this.lobbyShowcase?.setVisible(true);
    this.lobbyShowcase?.setPlayer(this.profile.operatorId, this.profile.equippedSkin);
    this.showScreen("menu");
    this.updateMenuCamera(0);
    document.body.classList.remove("is-locked");
  }

  endGame(reason) {
    if (!this.running) return;
    this.running = false;
    this.paused = false;
    this.endReason = reason;
    this.respawnUntil = 0;
    this.input.setEnabled(false);
    this.input.exitLock();
    this.audio.stopAmbient();
    this.dom.touch.hidden = true;
    this.dom.rotateHint.hidden = true;
    this.dom.lockHint?.classList.add("is-hidden");
    const elapsed = this.missionState ? this.missionState.elapsed : this.mode.duration - this.timeLeft;
    document.getElementById("result-score").textContent = String(Math.round(this.score)).padStart(4, "0");
    document.getElementById("result-kills").textContent = String(this.kills);
    document.getElementById("result-accuracy").textContent = `${Math.round(this.weapons.accuracy * 100)}%`;
    document.getElementById("result-time").textContent = formatClock(elapsed);
    document.getElementById("gameover-title").textContent =
      reason === "dead" ? "سقطت في الميدان." : reason === "win" ? "انتصار تكتيكي." : reason === "loss" ? "خسر فريقك." : reason === "draw" ? "تعادل ميداني." : "انتهى الوقت.";
    document.getElementById("gameover-copy").textContent =
      reason === "dead" ? "الدرع لم يكفِ. راجع زواياك وأعد المحاولة." : reason === "win" ? "أصبحت آخر مقاتل على قيد الحياة." : reason === "loss" ? "الخصم وصل إلى حد النقاط أولاً." : reason === "draw" ? "انتهى الوقت والنتيجة متساوية." : "أغلقت الساحة. هذه أرقامك النهائية.";
    const previousLevel = this.profile.level;
    const placement = computePlacement({
      result: reason,
      aliveEnemies: this.enemies.getAliveCount(),
      totalBots: this.enemies.enemies.length,
    });
    const settlement = settleMatch(this.profile, { reason, kills: this.kills, score: this.score }, this.matchId);
    this.profile = settlement.profile;
    if (this.missionState && this.missionDef) {
      this.telemetry.emit("mission_ended", {
        missionId: this.missionDef.id,
        result: reason === "win" ? "success" : "failure",
        elapsed,
        xpGranted: settlement.xpGranted,
      });
    }
    this.telemetry.endMatch(reason, {
      score: this.score,
      kills: this.kills,
      headshots: this.headshots,
      xpGranted: settlement.xpGranted,
    });
    this.matchId = null;
    const xpResult = document.getElementById("result-xp");
    const creditsResult = document.getElementById("result-credits");
    if (xpResult) xpResult.textContent = `+${settlement.xpGranted}`;
    if (creditsResult) creditsResult.textContent = `+${settlement.creditsGranted}`;
    saveProfile(this.profile);
    const placementCell = document.getElementById("result-placement");
    if (placementCell) {
      placementCell.textContent =
        this.mode.id === "battleRoyale" ? placementLabel(placement, this.enemies.enemies.length) : "—";
    }
    if (this.mode.id === "battleRoyale") {
      const rpRes = applyMatchRp(this.profile, {
        placement,
        kills: this.kills,
        survivalSeconds: Math.round(elapsed),
        totalBots: this.enemies.enemies.length,
      });
      this.profile = rpRes.profile;
      saveProfile(this.profile);
      const copy = document.getElementById("gameover-copy");
      if (copy) {
        copy.innerHTML += `<br><span style="color:${rpRes.newTier.color};font-weight:700;">${rpRes.newTier.icon} رتبة ${rpRes.newTier.fullTitle} (${rpRes.delta >= 0 ? "+" + rpRes.delta : rpRes.delta} RP)</span>`;
      }
    }
    if (this.profile.level > previousLevel) {
      const copy = document.getElementById("gameover-copy");
      if (copy) copy.textContent += ` — ترقية إلى المستوى ${this.profile.level} (${rankTitle(this.profile.level)})`;
    }
    this.hud.setVisible(true);
    this.showScreen("gameover");
  }

  handlePlayerDeath(source = "unknown") {
    if (!this.running || this.respawnUntil > 0) return;
    this.modeState = recordPlayerDeath(this.mode, this.modeState);
    this.telemetry.emit("player_died", { source, modeId: this.mode.id, respawnable: this.mode.playerRespawn });
    if (!this.mode.playerRespawn) {
      this.endGame("dead");
      return;
    }

    if (this.modeState.opponentTeamScore >= (this.mode.scoreLimit ?? Infinity)) {
      this.endGame("loss");
      return;
    }

    const now = performance.now() / 1000;
    this.respawnUntil = now + this.mode.respawnDelay;
    this.respawnCount += 1;
    this.fireHeld = false;
    this.input.setEnabled(false);
    this.hud.message(`إعادة انتشار خلال ${this.mode.respawnDelay.toFixed(1)}ث`, this.mode.respawnDelay);
  }

  respawnPlayer() {
    if (!this.running || this.respawnUntil <= 0) return;
    const spawnIndex = this.respawnCount % this.world.spawns.length;
    this.player.reset(this.world.getSpawn(spawnIndex));
    this.respawnUntil = 0;
    this.input.setEnabled(true);
    this.telemetry.emit("player_respawned", { spawnIndex, count: this.respawnCount });
    this.hud.message("عدت إلى الميدان", 1.2);
  }

  onKill(enemy, headshot, point, source = "weapon") {
    // Storm and bot-vs-bot eliminations carry no reward but still affect win conditions.
    if (source === "zone" || source === "bot") {
      this.hud.addKill(source === "zone" ? "سقط في العاصفة" : "عدو سقط في اشتباك", source === "zone" ? "STORM" : "BOT", false);
      if (this.mode.id === "battleRoyale" && this.enemies.getAliveCount() === 0) this.endGame("win");
      return;
    }
    const gain = headshot ? 150 : 100;
    this.score += gain;
    this.kills += 1;
    this.profile.stats.kills += 1;
    this.modeState = recordEnemyKill(this.mode, this.modeState);
    if (headshot) this.headshots += 1;
    this.hud.addKill(
      headshot ? "قتلة رأس" : source === "grenade" || source === "breach" ? "انفجار" : source === "melee" ? "ضربة قريبة" : "قضيت على عدو",
      source === "grenade" ? "FRAG" : source === "breach" ? "BREACH" : source === "melee" ? "MELEE" : this.weapons.currentState.def.name,
      headshot,
    );
    this.hud.message(headshot ? "+150 // HEADSHOT" : "+100 // ELIMINATED", 1.15);
    this.profile = awardXp(this.profile, headshot ? 90 : 60);
    saveProfile(this.profile);
    this.telemetry.emit("kill_confirmed", {
      enemyIndex: enemy?.index,
      headshot,
      source,
      weaponId: this.weapons.currentState.def.id,
      score: this.score,
      kills: this.kills,
    });
    if (this.modeState.objectiveComplete && this.mode.id === "tdm") this.endGame("win");
    if (this.mode.id === "battleRoyale" && this.enemies.getAliveCount() === 0) this.endGame("win");
  }

  useAbility() {
    if (!this.running || this.paused || this.player.dead || this.respawnUntil > 0) return false;
    if (this.dropState && this.dropState.phase !== "landed") return false;
    const result = activateAbility(this.abilityState);
    if (!result.activated) {
      this.hud.message(`${result.def.arabic} — شحن ${Math.ceil(this.abilityState.cooldownRemaining)}ث`, 0.9);
      return false;
    }
    this.abilityState = result.state;
    const def = result.def;
    const now = performance.now() / 1000;
    this.audio.ability(def.id);
    if (def.id === "breach-charge") {
      this.grenades.launchBreachCharge({ radius: def.radius, maxDamage: def.maxDamage });
    } else if (def.id === "recon-pulse") {
      this.reconUntil = now + def.duration;
      this.abilityBoostUntil = now + def.duration;
      this.player.abilitySpeedBoost = def.speedBoost;
    } else if (def.id === "combat-stim") {
      this.player.heal(def.healAmount);
      this.player.addArmor(def.armorAmount);
      this.player.regenRemaining = 0;
      this.hud.hitmarker(false);
    } else if (def.id === "aegis-barrier") {
      const forward = this.player.getForward(new THREE.Vector3());
      const x = this.player.position.x + forward.x * 2.3;
      const z = this.player.position.z + forward.z * 2.3;
      // Face the barrier across the player's look direction.
      this.world.addTempBarrier(x, z, this.player.yaw, { width: def.width, height: def.height, duration: def.duration });
    }
    this.hud.message(`${def.arabic} // ${def.codename}`, 1.4);
    this.telemetry.emit("ability_used", { abilityId: def.id, operatorId: def.operatorId });
    return true;
  }

  updateAbilities(dt, now) {
    this.abilityState = stepAbilityState(this.abilityState, dt);
    if (this.abilityBoostUntil > 0 && now >= this.abilityBoostUntil) {
      this.abilityBoostUntil = 0;
      this.player.abilitySpeedBoost = 1;
    }
    if (this.reconUntil > 0 && now >= this.reconUntil) this.reconUntil = 0;
  }

  isReconActive() {
    return this.reconUntil > 0;
  }

  getObjectiveLabel() {
    if (this.missionState && this.missionDef) return getMissionSnapshot(this.missionState, this.missionDef).label;
    if (this.mode.id === "survival") return `الموجة ${this.modeState.wave} · ${this.enemies.getAliveCount()} خصوم`;
    if (this.mode.id === "tdm") return `فريقك ${this.modeState.playerTeamScore}/${this.mode.scoreLimit} · الخصم ${this.modeState.opponentTeamScore}/${this.mode.scoreLimit}`;
    if (this.mode.id === "battleRoyale" && this.zone) return `الدائرة ${Math.round(this.zone.radius)}م · ${this.enemies.getAliveCount()} باقي`;
    if (this.mode.id === "deathmatch") return `النقاط ${Math.round(this.score)}`;
    return this.mode.objective;
  }

  getObjectiveState() {
    if (this.missionState && this.missionDef) {
      return { active: true, ...getMissionSnapshot(this.missionState, this.missionDef) };
    }
    return {
      active: false,
      label: this.getObjectiveLabel(),
      detail: this.mode?.objective ?? "",
      progress: 0,
    };
  }

  updateLockHint() {
    if (!this.dom.lockHint) return;
    const visible = this.running && !this.paused && !this.input.locked && !this.isTouch && !this.demo;
    this.dom.lockHint.classList.toggle("is-hidden", !visible);
  }

  updateMenuCamera(dt) {
    this.menuTime += dt;
    this.lobbyShowcase?.update(dt, this.menuTime);
    const time = this.menuTime;
    const camX = Math.sin(time * 0.08) * 0.35;
    const camY = 1.34 + Math.sin(time * 0.15) * 0.03;
    const camZ = 3.6 + Math.cos(time * 0.08) * 0.15;
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 1.15, 0);
  }

  loop(timeMs) {
    requestAnimationFrame((next) => this.loop(next));
    const now = timeMs / 1000;
    const dt = Math.min(0.05, Math.max(0, now - this.lastTime));
    this.lastTime = now;

    if (this.running && !this.paused) {
      if (!this.multiplayer) this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.respawnUntil > 0) {
        if (now >= this.respawnUntil) this.respawnPlayer();
      } else {
        if (!this.dropState || this.dropState.phase === "landed") this.player.update(dt, this.input, this.weapons);
        this.weapons.update(dt, now);
        this.grenades.update(dt);
        this.enemies.update(dt, now);
        this.world.update(dt);
        this.updateAbilities(dt, now);
        this.updateDrop(dt);
        if (!this.multiplayer) this.updateModeSystems(dt);
        this.handleFiring(now);
        this.remote?.update(dt);
        this.sendMultiplayerState(now);
      }
      if (!this.multiplayer) this.evaluateModeState(now);
      this.hud.update(dt);
      this.loot.update(dt, this.player.position);
      this.updateLootPrompt();
      this.updateLockHint();
      if (this.updateRotateHint) this.updateRotateHint();
    } else if (!this.running) {
      this.updateMenuCamera(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateModeSystems(dt) {
    if (this.missionState && this.missionDef) this.updateMissionSystems(dt);
    if (this.mode.id === "battleRoyale" && this.zone) {
      this.zoneTick += dt;
      const elapsed = this.mode.duration - this.timeLeft;
      const sampled = sampleBattleRoyaleZone(this.zonePlan, elapsed);
      this.zone.center = sampled.center;
      this.zone.radius = sampled.radius;
      this.zone.damage = sampled.damage;
      this.world.setStormZone(this.zone);
      const distance = Math.hypot(this.player.position.x - this.zone.center.x, this.player.position.z - this.zone.center.z);
      if (distance > this.zone.radius) this.player.takeDamage(this.zone.damage * dt, "zone");
    }

    if (this.mode.id === "survival" && this.enemies.getAliveCount() === 0) {
      const now = performance.now() / 1000;
      if (!this.modeState.waveBreakUntil) {
        this.modeState = { ...this.modeState, waveBreakUntil: now + this.mode.waveBreakSeconds };
        this.telemetry.emit("objective_completed", { type: "wave", wave: this.modeState.wave });
        this.hud.message(`WAVE ${this.modeState.wave} CLEAR`, this.mode.waveBreakSeconds);
      } else if (now >= this.modeState.waveBreakUntil) {
        this.modeState = completeSurvivalWave(this.modeState, now);
        const nextCount = Math.min(this.mode.waveEnemyCap, this.mode.waveStartCount + (this.modeState.wave - 1) * this.mode.waveGrowth);
        this.enemies.startWave(nextCount);
        this.telemetry.emit("objective_started", { type: "wave", wave: this.modeState.wave, enemyCount: nextCount });
        this.hud.message(`WAVE ${this.modeState.wave} // الضغط يتصاعد`, 1.5);
      }
    }
  }

  updateMissionSystems(dt) {
    if (!this.missionState || !this.missionDef || !this.running) return;
    const point = this.world.getMissionPoint(this.missionState.pointId);
    const distance = point
      ? Math.hypot(this.player.position.x - point.x, this.player.position.z - point.z)
      : Infinity;
    const result = advanceMission(this.missionState, this.missionDef, {
      dt,
      nearPoint: distance <= (point?.radius ?? 0),
      interactHeld: this.input.isDown("KeyE"),
      playerDead: this.player.dead,
      timeExpired: this.timeLeft <= 0,
    });
    this.missionState = result.state;
    this.world.setMissionObjective(this.missionState.pointId);

    for (const event of result.events) {
      if (event.type === "objective_started") {
        this.telemetry.emit("objective_started", { missionId: this.missionDef.id, objectiveId: event.objectiveId });
        this.hud.message(getMissionSnapshot(this.missionState, this.missionDef).label, 1.4);
      }
      if (event.type === "objective_completed") {
        this.telemetry.emit("objective_completed", {
          missionId: this.missionDef.id,
          objectiveId: event.objectiveId,
          elapsed: this.missionState.elapsed,
        });
      }
      if (event.type === "mission_ended") {
        if (event.result === "success") {
          this.hud.message("FIRST LIGHT // MISSION COMPLETE", 2.2);
          this.endGame("win");
        } else {
          this.endGame(event.reason === "timeout" ? "time" : "dead");
        }
      }
    }

    if (this.missionState.state === "hold_relay" && !this.missionState.waveStarted) {
      this.missionState = { ...this.missionState, waveStarted: true };
      this.enemies.ensureCount(7);
      this.enemies.configure({ respawn: false });
      this.enemies.reset();
      this.telemetry.emit("objective_pressure_started", { missionId: this.missionDef.id, enemyCount: 7 });
      this.hud.message("RELAY PRESSURE // HOLD POSITION", 1.8);
    }
  }

  evaluateModeState() {
    if (!this.running) return;
    const reason = resolveModeEnd(this.mode, this.modeState, {
      aliveEnemies: this.enemies.getAliveCount(),
      timeExpired: this.timeLeft <= 0,
      playerDead: this.player.dead,
    });
    if (reason) this.endGame(reason);
  }

  getPlaytestState() {
    return {
      modeId: this.mode.id,
      running: this.running,
      paused: this.paused,
      endReason: this.endReason,
      timeLeft: this.timeLeft,
      score: this.score,
      kills: this.kills,
      objective: getObjectiveSnapshot(this.mode, this.modeState, {
        score: this.score,
        kills: this.kills,
        aliveEnemies: this.enemies.getAliveCount(),
        zone: this.zone,
      }),
      player: { health: this.player.health, armor: this.player.armor, dead: this.player.dead, recovery: this.player.getRecoveryState() },
      grenades: this.grenades.getState(),
      mission: this.missionState && this.missionDef ? getMissionSnapshot(this.missionState, this.missionDef) : null,
    };
  }

  handleDropJump() {
    if (!this.dropState || this.dropState.phase === "landed") return false;
    if (this.dropState.phase === "plane") {
      if (this.planePos) {
        this.dropTarget.x = this.planePos.x;
        this.dropTarget.z = this.planePos.z - 12;
      }
      this.dropState.driftX = 0;
      this.dropState.driftZ = 0;
      this.dropState = jumpFromPlane(this.dropState);
      this.audio?.ui?.();
      return true;
    }
    if (this.dropState.phase === "freefall") {
      this.dropState = deployChute(this.dropState);
      this.audio?.ui?.();
      return true;
    }
    return false;
  }

  cleanUpDropModels() {
    if (this.cargoPlane?.group) {
      if (this.cargoPlane.group.parent) {
        this.cargoPlane.group.parent.remove(this.cargoPlane.group);
      }
      this.cargoPlane = null;
    }
    if (this.parachuteModel?.group) {
      if (this.parachuteModel.group.parent) {
        this.parachuteModel.group.parent.remove(this.parachuteModel.group);
      }
      this.parachuteModel = null;
    }
    this.planePos = null;
  }

  updateDrop(dt) {
    if (!this.dropState) return;

    // Continuously animate cargo aircraft if active
    if (this.cargoPlane && this.planePos) {
      this.cargoPlane.update(dt);
      this.planePos.z += (this.planeSpeed || 26) * dt;
      this.cargoPlane.group.position.copy(this.planePos);
      if (this.planePos.z > 250) {
        if (this.cargoPlane.group.parent) {
          this.cargoPlane.group.parent.remove(this.cargoPlane.group);
        }
        this.cargoPlane = null;
      }
    }

    if (this.dropState.phase === "landed") return;

    const bounds = this.world.bounds ?? { halfX: 34, halfZ: 24 };
    const dropHud = document.getElementById("drop-hud");

    if (this.dropState.phase === "plane") {
      // Player is riding inside the cargo bay
      const camX = this.planePos ? this.planePos.x : this.dropTarget.x;
      const camY = (this.planePos ? this.planePos.y : DROP_CONFIG.planeAltitude) + 0.4;
      const camZ = (this.planePos ? this.planePos.z : this.dropTarget.z) - 6.5;

      this.camera.position.set(camX, camY, camZ);
      this.camera.rotation.set(0.18, Math.PI, 0); // Looking rearward down the open ramp
      this.player.position.set(camX, camY - 0.4, camZ);
      this.player.velocity.set(0, 0, 0);

      if (dropHud) {
        dropHud.innerHTML = `<span style="color:#d9a84e;font-weight:700;">✈ طائرة الإنزال C-130 HERCULES</span><br><span style="color:#ffffff;">الارتفاع: <strong>120م</strong> | السرعة: <strong>220 كم/س</strong></span><br><span style="color:#22ff44;font-size:0.95em;letter-spacing:1px;font-weight:700;">[اضغط مسافة أو F للقفز بالمظلة]</span>`;
      }

      if (this.planePos && this.planePos.z > bounds.halfZ + 25) {
        this.handleDropJump();
      }
      return;
    }

    // Freefall or Parachute phase
    const forward = (this.input.isDown("KeyW") ? 1 : 0) - (this.input.isDown("KeyS") ? 1 : 0);
    const strafe = (this.input.isDown("KeyD") ? 1 : 0) - (this.input.isDown("KeyA") ? 1 : 0);
    this.dropState = stepDrop(this.dropState, dt, { x: strafe, z: -forward });
    const state = this.dropState;

    const limitX = bounds.halfX - 2;
    const limitZ = bounds.halfZ - 2;
    const x = clamp(this.dropTarget.x + state.driftX, -limitX, limitX);
    const z = clamp(this.dropTarget.z + state.driftZ, -limitZ, limitZ);
    state.driftX = x - this.dropTarget.x;
    state.driftZ = z - this.dropTarget.z;

    this.player.position.set(x, state.altitude, z);
    this.player.velocity.set(0, 0, 0);

    const speedKmh = Math.round((state.velocity || 0) * 3.6);

    if (state.phase === "freefall") {
      const yaw = this.player.yaw ?? 0;
      this.camera.position.set(x - Math.sin(yaw) * 2.5, state.altitude + 1.8, z - Math.cos(yaw) * 2.5);
      this.camera.rotation.set(-0.35, yaw, 0);

      if (dropHud) {
        dropHud.innerHTML = `<span style="color:#ff5555;font-weight:700;">🔻 سقوط حر تكتيكي</span> | الارتفاع: <strong>${Math.round(state.altitude)}م</strong> | السرعة: <strong>${speedKmh} كم/س</strong><br><span style="color:#dddddd;font-size:0.85em;">[WASD] للغطس والتوجيه — [SPACE / F] لفتح المظلة</span>`;
      }
    } else if (state.phase === "parachute") {
      if (!this.parachuteModel) {
        this.parachuteModel = createParachuteModel();
        this.world.scene.add(this.parachuteModel.group);
      }
      this.parachuteModel.update(dt, state.velocity);
      this.parachuteModel.group.position.set(x, state.altitude, z);
      this.parachuteModel.group.rotation.y = this.player.yaw ?? 0;

      const yaw = this.player.yaw ?? 0;
      this.camera.position.set(x - Math.sin(yaw) * 3.5, state.altitude + 2.2, z - Math.cos(yaw) * 3.5);
      this.camera.rotation.set(-0.25, yaw, 0);

      if (dropHud) {
        dropHud.innerHTML = `<span style="color:#d88235;font-weight:700;">🪂 مظلة الهبوط التكتيكية</span> | الارتفاع: <strong>${Math.round(state.altitude)}م</strong> | السرعة: <strong>${speedKmh} كم/س</strong><br><span style="color:#dddddd;font-size:0.85em;">[WASD] لتوجيه الانزلاق نحو أسطح المباني والمواقع الاستراتيجية</span>`;
      }
    }

    if (state.phase === "landed") {
      if (this.parachuteModel?.group?.parent) {
        this.parachuteModel.group.parent.remove(this.parachuteModel.group);
        this.parachuteModel = null;
      }
      this.player.position.set(x, 0, z);
      this.world.resolveMovement(this.player.position, new THREE.Vector3(0, 0, 0), this.player.radius, this.player.height);
      this.enemies.suppressAttack = false;
      this.player.velocity.set(0, 0, 0);
      this.player.updateCamera(0, 0, 0);
      if (dropHud) dropHud.hidden = true;
      this.hud.message("هبوط ناجح — اقتحم المباني واجمع الأسلحة!", 2.4);
      this.telemetry?.emit?.("drop_landed", { x: Math.round(x), z: Math.round(z) });
    }
  }

  openLobby() {
    this.renderLobby();
    this.showScreen("lobby");
  }

  openMultiplayer() {
    const nameInput = document.getElementById("mp-name");
    const roomInput = document.getElementById("mp-room");
    if (nameInput && !nameInput.value) {
      nameInput.value = localStorage.getItem("combat-protocol-mp-name") || "Player";
    }
    if (roomInput && !roomInput.value) {
      roomInput.value = localStorage.getItem("combat-protocol-mp-room") || "arena";
    }
    const status = document.getElementById("mp-status");
    if (status) status.textContent = "غير متصل — اكتب اسمك وكود الغرفة ثم ادخل";
    this.showScreen("multiplayer");
  }

  connectMultiplayer() {
    const name = sanitizeName(document.getElementById("mp-name")?.value, "Player");
    const room = sanitizeRoom(document.getElementById("mp-room")?.value, "arena");
    localStorage.setItem("combat-protocol-mp-name", name);
    localStorage.setItem("combat-protocol-mp-room", room);
    this.startMultiplayer({ name, room });
  }

  startMultiplayer({ name, room }) {
    this.multiplayer = true;
    this.mpDead = false;
    this.mpSelfId = null;
    this.mpStateAt = 0;
    this.lobby = normalizeLobby({ ...this.lobby, mode: "deathmatch", bots: 1 });
    this.modeId = "deathmatch";
    this.startGame({ demo: false });
    // Single-player bots are not part of a network room.
    this.enemies.activeCount = 0;
    for (const enemy of this.enemies.enemies) {
      enemy.dead = true;
      enemy.group.visible = false;
    }
    this.remote = new RemotePlayers({ scene: this.scene });
    this.net = new MultiplayerClient({
      name,
      room,
      onEvent: (message) => this.handleNetEvent(message),
      onStatus: (status) => {
        const element = document.getElementById("mp-status");
        if (!element) return;
        if (status.state === "connecting") element.textContent = "جاري الاتصال بالغرفة...";
        if (status.state === "online") element.textContent = `متصل — الغرفة ${status.room}`;
        if (status.state === "offline" && !this.multiplayer) element.textContent = "غير متصل";
        if (status.state === "error") element.textContent = status.message;
      },
    });
    this.net.connect({ operator: this.profile?.operatorId, skin: this.profile?.equippedSkin });
    const hudChat = document.getElementById("mp-hud");
    if (hudChat) hudChat.hidden = false;
    this.hud.message("جاري الاتصال بالغرفة...", 2);
  }

  handleNetEvent(message) {
    if (!message || typeof message.type !== "string") return;
    if (message.type === "welcome") {
      this.mpSelfId = message.selfId;
      this.remote?.updateSnapshot(message.players, this.mpSelfId);
      this.updateMpRoster(message.players);
      this.hud.message(`متصل بالغرفة ${message.room}`, 2);
      return;
    }
    if (message.type === "roster") {
      this.updateMpRoster(message.players);
      return;
    }
    if (message.type === "snapshot") {
      this.lastSnapshot = message.players;
      this.remote?.updateSnapshot(message.players, this.mpSelfId);
      this.updateMpRoster(message.players);
      const self = message.players.find((player) => player.id === this.mpSelfId);
      if (self) {
        this.player.health = self.health;
        if (self.dead && !this.mpDead) this.markMultiplayerDead();
      }
      return;
    }
    if (message.type === "join") {
      this.appendMpChat(`${message.player?.name ?? "لاعب"} انضم للغرفة`, "system");
      return;
    }
    if (message.type === "leave") {
      this.appendMpChat("لاعب غادر الغرفة", "system");
      return;
    }
    if (message.type === "shot") {
      if (message.id !== this.mpSelfId) this.remote?.spawnTracer(message.origin, message.direction);
      return;
    }
    if (message.type === "hit") {
      if (message.targetId === this.mpSelfId) {
        this.player.health = message.health;
        this.hud.damageFlash(8);
        if (message.health <= 0) this.markMultiplayerDead();
      } else if (message.shooterId === this.mpSelfId) {
        this.hud.hitmarker(false);
      }
      return;
    }
    if (message.type === "kill") {
      const text = `${message.shooterName} قتل ${message.targetName}`;
      this.appendMpChat(text, "kill");
      this.hud.message(text, 2.5);
      if (message.targetId === this.mpSelfId) this.markMultiplayerDead();
      return;
    }
    if (message.type === "respawn") {
      if (message.id === this.mpSelfId) this.respawnMultiplayer();
      return;
    }
    if (message.type === "chat") {
      this.appendMpChat(`${message.name}: ${message.text}`);
    }
  }

  updateMpRoster(players = []) {
    const roster = document.getElementById("mp-roster");
    if (!roster) return;
    const chips = players.map((player) => {
      const chip = document.createElement("span");
      chip.className = "roster-chip";
      if (player.id === this.mpSelfId) chip.classList.add("is-leader");
      chip.textContent = `${player.id === this.mpSelfId ? "أنت" : player.name}${player.dead ? " ☠" : ""} · ${player.kills ?? 0}`;
      return chip;
    });
    roster.replaceChildren(...chips);
  }

  appendMpChat(text, kind = "chat") {
    const log = document.getElementById("mp-chat");
    if (!log) return;
    const line = document.createElement("div");
    line.className = `mp-line ${kind}`;
    line.textContent = text;
    log.appendChild(line);
    while (log.children.length > 60) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
    const hudLog = document.getElementById("mp-hud-log");
    if (hudLog) {
      const hudLine = document.createElement("div");
      hudLine.textContent = text;
      hudLog.appendChild(hudLine);
      while (hudLog.children.length > 5) hudLog.removeChild(hudLog.firstChild);
    }
  }

  sendMultiplayerChat(inputId = "mp-chat-input") {
    const input = document.getElementById(inputId);
    if (!input) return;
    const text = input.value.trim();
    if (!text || !this.net) return;
    this.net.sendChat(text);
    input.value = "";
  }

  sendMultiplayerState(now) {
    if (!this.multiplayer || !this.net || !this.player || this.player.dead) return;
    if (now - this.mpStateAt < 0.1) return;
    this.mpStateAt = now;
    this.net.sendState({
      x: this.player.position.x,
      y: this.player.position.y,
      z: this.player.position.z,
      yaw: this.player.yaw,
      pitch: this.player.pitch,
      health: this.player.health,
      weapon: this.weapons.currentState?.def?.id ?? "ar4",
      operator: this.profile?.operatorId ?? "vanguard",
      skin: this.profile?.equippedSkin ?? "standard",
    });
  }

  markMultiplayerDead() {
    if (this.mpDead) return;
    this.mpDead = true;
    this.player.dead = true;
    this.player.health = 0;
    this.hud.message("قتلت — إعادة خلال 3 ثوان", 3);
  }

  respawnMultiplayer() {
    this.mpDead = false;
    this.player.dead = false;
    this.player.health = 100;
    const spawn = this.world.getSpawn(0);
    this.player.reset(spawn);
    this.hud.message("رجعت للساحة", 1.5);
    this.sendMultiplayerState(performance.now() / 1000);
  }

  renderLobby() {
    const modeSelect = document.getElementById("lobby-mode");
    if (modeSelect) modeSelect.value = this.lobby.mode;
    const mapSelect = document.getElementById("lobby-map");
    if (mapSelect) {
      mapSelect.innerHTML = mapsForMode(this.lobby.mode)
        .map((id) => mapById(id))
        .map((map) => `<option value="${map.id}">${map.arabic}</option>`)
        .join("");
      mapSelect.value = this.lobby.map;
    }
    const difficultySelect = document.getElementById("lobby-difficulty");
    if (difficultySelect) difficultySelect.value = this.lobby.difficulty;
    const bots = document.getElementById("lobby-bots");
    if (bots) bots.value = String(this.lobby.bots);
    const botsValue = document.getElementById("lobby-bots-value");
    if (botsValue) botsValue.textContent = String(this.lobby.bots);
    this.renderRoster();
    this.updateLobbySummary();
  }

  renderRoster() {
    const roster = document.getElementById("lobby-roster");
    if (!roster) return;
    const label = difficultyOf(this.lobby).label;
    const chips = ['<span class="roster-chip is-leader">أنت — القائد</span>'];
    for (let index = 0; index < Math.min(this.lobby.bots, 6); index += 1) {
      chips.push(`<span class="roster-chip">BOT ${String(index + 1).padStart(2, "0")} · ${label}</span>`);
    }
    if (this.lobby.bots > 6) chips.push(`<span class="roster-chip">+${this.lobby.bots - 6}</span>`);
    roster.innerHTML = chips.join("");
  }

  updateLobbySummary() {
    const summary = document.getElementById("lobby-summary");
    if (!summary) return;
    summary.textContent = lobbySummary(this.lobby, getMode(this.lobby.mode).label, mapById(this.lobby.map).arabic);
  }

  syncLobbyFromUi() {
    const mode = document.getElementById("lobby-mode")?.value;
    const mapOptions = mapsForMode(mode).map((id) => mapById(id));
    const selectedMap = document.getElementById("lobby-map")?.value;
    this.lobby = normalizeLobby({
      ...this.lobby,
      mode,
      map: mapOptions.some((map) => map.id === selectedMap) ? selectedMap : mapOptions[0].id,
      bots: document.getElementById("lobby-bots")?.value,
      difficulty: document.getElementById("lobby-difficulty")?.value,
    }, mapOptions);
    const botsValue = document.getElementById("lobby-bots-value");
    if (botsValue) botsValue.textContent = String(this.lobby.bots);
    this.renderLobby();
  }

  startLobbyMatch() {
    saveLobby(this.lobby);
    const target = new URL(window.location.href);
    for (const [key, value] of new URLSearchParams(lobbyQuery(this.lobby).slice(1))) {
      target.searchParams.set(key, value);
    }
    target.searchParams.delete("demo");
    window.location.href = target.toString();
  }

  updateLootPrompt() {
    const prompt = document.getElementById("loot-prompt");
    if (!prompt) return;
    const crate = this.loot?.nearestCrate;
    if (crate && !crate.taken && this.mode.id === "battleRoyale") {
      prompt.hidden = false;
      prompt.textContent = `E — ${crate.item.name}`;
    } else {
      prompt.hidden = true;
    }
  }

  tryPickup() {
    const crate = this.loot?.nearestCrate;
    if (!crate || crate.taken) return false;
    const item = this.loot.take(crate);
    if (!item) return false;
    const result = addItem(this.inventory, item);
    if (!result.added) {
      crate.taken = false;
      crate.mesh.visible = true;
      this.hud.message("الحقيبة ممتلئة", 1.2);
      return false;
    }
    this.inventory = result.inventory;
    this.applyLoot(item);
    this.audio.pickup();
    this.hud.message(`+ ${item.name}`, 1.2);
    const summary = document.getElementById("loot-summary");
    if (summary) summary.textContent = inventorySummary(this.inventory);
    this.telemetry?.emit?.("loot_picked", { itemId: item.id, rarity: item.rarity, remaining: this.loot.remaining });
    return true;
  }

  applyLoot(item) {
    if (item.kind === "ammo") {
      const state = this.weapons.states.find((entry) => entry.def.id === item.weaponId);
      if (state) state.reserve += item.amount;
    } else if (item.kind === "armor") {
      this.player.armor = Math.min(this.player.maxArmor ?? 100, (this.player.armor ?? 0) + item.amount);
    } else if (item.kind === "heal") {
      this.player.health = Math.min(this.player.maxHealth ?? 100, this.player.health + item.amount);
    } else if (item.kind === "grenade") {
      this.grenades.charges += item.amount;
    } else if (item.kind === "attachment") {
      if (item.attachmentId) {
        const ok = this.weapons.equipAttachmentOnCurrent(item.attachmentId);
        if (ok) this.hud.message(`رُكّب على ${this.weapons.currentWeapon.name}: ${item.name}`, 1.4);
      }
    } else if (item.kind === "weapon") {
      const index = this.weapons.states.findIndex((entry) => entry.def.id === item.weaponId);
      if (index >= 0) {
        // Picked-up weapons come with a full magazine and bonus reserve.
        const state = this.weapons.states[index];
        state.reserve += state.def.mag;
        this.weapons.switchTo(index);
      }
    }
  }

  handleFiring(now) {
    if (this.dropState && this.dropState.phase !== "landed") return;
    const firing = this.input.isDown("Mouse0");
    if (!firing) {
      this.fireHeld = false;
      return;
    }
    const state = this.weapons.currentState;
    if (!state.def.auto && this.fireHeld) return;
    this.fireHeld = true;
    this.weapons.tryFire(now);
  }

  switchWeapon(index) {
    if (!this.running || this.paused) return;
    this.weapons.switchTo(index, performance.now() / 1000);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.updateCameraFov();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.settings.quality === "high" ? 1.8 : 1.2));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    new CombatProtocol();
  } catch (error) {
    console.error("Combat Protocol failed to start:", error);
    showFatal(error?.stack || error?.message || error);
    window.__GAME_ERROR__ = String(error.stack || error);
  }
});

export { CombatProtocol, DEFAULT_SETTINGS, MATCH_SECONDS, WEAPON_DEFS };
