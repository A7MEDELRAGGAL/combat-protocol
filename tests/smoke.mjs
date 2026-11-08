import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const PORT = 4180;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const evidenceDir = resolve("evidence");
await mkdir(evidenceDir, { recursive: true });

let failures = 0;
function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const server = spawn(process.execPath, ["server.mjs"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (data) => process.stdout.write(`[server] ${data}`));
server.stderr.on("data", (data) => process.stderr.write(`[server] ${data}`));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  throw new Error("Server did not start");
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox", "--hide-scrollbars"],
});

try {
  await waitForServer();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await page.waitForTimeout(1200);
  check("page title", (await page.title()).includes("Combat Protocol"));
  check("canvas exists", await page.locator("#canvas").isVisible());
  check("boot overlay hidden", await page.evaluate(() => document.getElementById("boot").classList.contains("is-done")));
  const renderCalls = await page.evaluate(() => window.__GAME__.renderer.info.render.calls);
  check("WebGL rendered frames", renderCalls > 0, `${renderCalls} draw calls`);
  await page.screenshot({ path: resolve(evidenceDir, "menu.png") });

  await page.click("#lobby-button");
  await page.waitForTimeout(200);
  check("lobby screen opens", await page.locator("#lobby").isVisible());
  await page.evaluate(() => {
    const set = (id, value) => {
      const element = document.getElementById(id);
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    };
    set("lobby-mode", "battleRoyale");
    set("lobby-map", "harborTown");
    set("lobby-difficulty", "hard");
    const slider = document.getElementById("lobby-bots");
    slider.value = "12";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(150);
  const lobbyState = await page.evaluate(() => ({
    lobby: window.__GAME__.lobby,
    summary: document.getElementById("lobby-summary").textContent,
    chips: document.querySelectorAll("#lobby-roster .roster-chip").length,
    difficulty: window.__GAME__.enemies.difficulty,
  }));
  check(
    "leader choices apply to the lobby state",
    lobbyState.lobby.mode === "battleRoyale" && lobbyState.lobby.map === "harborTown" && lobbyState.lobby.bots === 12 && lobbyState.lobby.difficulty === "hard",
    JSON.stringify(lobbyState.lobby),
  );
  check("lobby roster shows the leader plus bots", lobbyState.chips >= 2, `${lobbyState.chips} chips`);
  check("lobby summary reflects the selection", lobbyState.summary.includes("12") && lobbyState.summary.includes("صعب"), lobbyState.summary);
  await page.screenshot({ path: resolve(evidenceDir, "lobby.png") });
  await page.evaluate(() => document.getElementById("lobby-back").click());
  await page.waitForTimeout(150);

  await page.click("#mode-button");
  check("mode selector opens", await page.locator("#modes").isVisible());
  check("five mode cards render", await page.locator("#mode-grid .mode-card").count() === 5);
  check("five map cards render", await page.locator("#map-grid .mode-card").count() === 5);
  check("quick map picker renders five options", await page.locator("#menu-map-select option").count() === 5);
  const quickMapOptions = await page.locator("#menu-map-select option").evaluateAll((options) => options.map((option) => option.value));
  check("quick map picker includes the new maps", quickMapOptions.includes("drydock9") && quickMapOptions.includes("nightBazaar"), quickMapOptions.join(","));
  const quickMapPage = await context.newPage();
  await quickMapPage.goto(BASE, { waitUntil: "networkidle" });
  await quickMapPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await Promise.all([
    quickMapPage.waitForURL((url) => url.searchParams.get("map") === "nightBazaar"),
    quickMapPage.selectOption("#menu-map-select", "nightBazaar"),
  ]);
  await quickMapPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await quickMapPage.waitForTimeout(500);
  const quickMapState = await quickMapPage.evaluate(() => ({
    mapId: window.__GAME__.world.mapId,
    label: document.getElementById("menu-map-current").textContent,
  }));
  check("quick map picker navigates to the selected map", quickMapState.mapId === "nightBazaar" && quickMapState.label === "السوق الليلي", JSON.stringify(quickMapState));
  await quickMapPage.close();
  await page.click("#modes-back");
  await page.click("#armory-button");
  check("armory opens", await page.locator("#armory").isVisible());
   check("operator cards render", await page.locator("#operator-grid .operator-card").count() === 4);
   check("all weapon loadouts render", await page.locator("#loadout-grid .loadout-card").count() === 9);
  await page.click("#armory-close");

  await page.evaluate(() => window.__START_DEMO__());
  await page.waitForTimeout(1600);
  const state = await page.evaluate(() => ({
    running: window.__GAME__.running,
    paused: window.__GAME__.paused,
    enemies: window.__GAME__.enemies.enemies.length,
    alive: window.__GAME__.enemies.getAliveCount(),
    health: window.__GAME__.player.health,
    ammo: window.__GAME__.weapons.currentState.ammo,
    hud: document.getElementById("hud").classList.contains("is-visible"),
    matchId: window.__GAME__.matchId,
    telemetry: window.__PLAYTEST_EVENTS__.map((event) => event.name),
    position: { x: window.__GAME__.player.position.x, z: window.__GAME__.player.position.z },
  }));
  check("demo running", state.running === true && state.paused === false);
  check("five enemies spawned", state.enemies === 5, `${state.alive} alive`);
  check("HUD visible", state.hud === true);
  check("player has health", state.health > 0, `${state.health} HP`);
  check("match telemetry starts", Boolean(state.matchId) && state.telemetry.includes("match_started"), `${state.telemetry.length} events`);
  check("match starts with grenade charges", await page.evaluate(() => window.__GAME__.getPlaytestState().grenades.available === 2));
  await page.screenshot({ path: resolve(evidenceDir, "gameplay.png") });

  const ammoBefore = state.ammo;
  await page.evaluate(() => window.__GAME__.weapons.tryFire(performance.now() / 1000));
  await page.waitForTimeout(250);
  const ammoAfter = await page.evaluate(() => window.__GAME__.weapons.currentState.ammo);
  check("weapon fires and consumes ammo", ammoAfter < ammoBefore, `${ammoBefore} -> ${ammoAfter}`);
  check("shot telemetry records firing", await page.evaluate(() => window.__PLAYTEST_EVENTS__.some((event) => event.name === "shot_fired")));
  const impactState = await page.evaluate(() => {
    const game = window.__GAME__;
    const decals = game.world.impactDecals;
    const Vector3 = game.camera.position.constructor;
    const point = new Vector3(0, 1, 0);
    const normal = new Vector3(0, 1, 0);
    for (let index = 0; index < decals.length + 1; index += 1) game.world.addImpactDecal(point, normal);
    return {
      pool: decals.length,
      active: decals.filter((decal) => decal.group.visible).length,
      hasApi: typeof game.world.addImpactDecal === "function",
      reusedFirst: decals[0].group.visible,
    };
  });
  check("impact decals use a bounded reusable pool", impactState.pool === 48 && impactState.active === 48 && impactState.hasApi && impactState.reusedFirst, JSON.stringify(impactState));

  const grenadeState = await page.evaluate(() => {
    const game = window.__GAME__;
    for (const enemy of game.enemies.enemies) {
      enemy.dead = true;
      enemy.group.visible = false;
    }
    const before = game.getPlaytestState().grenades.available;
    const thrown = game.grenades.tryThrow(performance.now() / 1000);
    return { thrown, before, after: game.getPlaytestState().grenades.available };
  });
  check("grenade throws and consumes one charge", grenadeState.thrown && grenadeState.before === 2 && grenadeState.after === 1, JSON.stringify(grenadeState));
  await page.waitForFunction(
    () => window.__PLAYTEST_EVENTS__.some((event) => event.name === "grenade_detonated"),
    { timeout: 8000 },
  ).catch(() => {});
  const grenadeAfter = await page.evaluate(() => ({
    detonated: window.__PLAYTEST_EVENTS__.some((event) => event.name === "grenade_detonated"),
    active: window.__GAME__.getPlaytestState().grenades.active,
  }));
  check("grenade detonates and emits telemetry", grenadeAfter.detonated, JSON.stringify(grenadeAfter));

  const recoveryState = await page.evaluate(() => {
    const game = window.__GAME__;
    game.paused = true;
    game.player.armor = 0;
    game.player.health = game.player.maxHealth - 35;
    game.player.regenRemaining = 0;
    const before = game.player.health;
    game.player.updateRecovery(0.75);
    const after = game.player.health;
    game.paused = false;
    return { before, after, remaining: game.player.regenRemaining };
  });
  check("automatic health recovery works", recoveryState.after > recoveryState.before && recoveryState.remaining === 0, JSON.stringify(recoveryState));

  await page.evaluate(() => window.__GAME__.input.keys.add("KeyW"));
  await page.waitForTimeout(600);
  const speed = await page.evaluate(() => Math.hypot(window.__GAME__.player.velocity.x, window.__GAME__.player.velocity.z));
  await page.evaluate(() => window.__GAME__.input.keys.delete("KeyW"));
  check("WASD movement works", speed > 0.8, `${speed.toFixed(2)} m/s`);

  const combat = await page.evaluate(() => {
    const game = window.__GAME__;
    game.paused = true;
    const enemy = game.enemies.enemies[0];
    enemy.dead = false;
    enemy.health = 100;
    enemy.group.visible = true;
    enemy.healthBar.sprite.visible = true;
    enemy.position.set(0, 0, 10);
    enemy.group.position.copy(enemy.position);
    game.player.position.set(0, 0, 16);
    game.player.yaw = 0;
    game.player.pitch = -0.06;
    game.player.updateCamera(0, 0, 0);
    game.scene.updateMatrixWorld(true);
    const scoreBefore = game.score;
    for (let index = 0; index < 8; index += 1) {
      game.weapons.tryFire(performance.now() / 1000 + index * 0.2);
    }
    game.paused = false;
    return {
      scoreBefore,
      score: game.score,
      kills: game.kills,
      enemyHealth: enemy.health,
      feed: document.querySelectorAll("#killfeed .kill-entry").length,
    };
  });
  check("combat kill awards score", combat.score > combat.scoreBefore && combat.kills > 0, `${combat.kills} kill(s), ${combat.score} pts`);
  check("killfeed updates", combat.feed > 0, `${combat.feed} entry/entries`);
  check("kill telemetry records confirmation", await page.evaluate(() => window.__PLAYTEST_EVENTS__.some((event) => event.name === "kill_confirmed")));
  await page.evaluate(() => window.__GAME__.hud.update(0.016));
  await page.waitForTimeout(150);
  const accuracyState = await page.evaluate(() => ({
    value: window.__GAME__.weapons.accuracy,
    fired: window.__GAME__.weapons.shotsFired,
    hit: window.__GAME__.weapons.shotsHit,
    text: document.getElementById("accuracy").textContent,
    hudText: window.__GAME__.hud.elements.accuracy?.textContent,
    cached: window.__GAME__.hud.cached.accuracy,
  }));
  check("accuracy reflects landed shots", accuracyState.value > 0 && accuracyState.text !== "0%", JSON.stringify(accuracyState));
  await page.screenshot({ path: resolve(evidenceDir, "combat.png") });

  const logistics = await page.evaluate(() => {
    const game = window.__GAME__;
    const now = performance.now() / 1000;
    game.weapons.currentState.ammo = 2;
    game.weapons.startReload(now);
    game.weapons.update(0.016, now + 3);
    const reloaded = game.weapons.currentState.ammo;
    game.switchWeapon(2);
    return {
      reloaded,
      index: game.weapons.currentIndex,
      name: game.weapons.currentWeapon.name,
      hudName: document.getElementById("weapon-name").textContent,
    };
  });
  check("reload refills the magazine", logistics.reloaded === 30, `${logistics.reloaded} rounds`);

  const reloadAnim = await page.evaluate(() => {
    const game = window.__GAME__;
    const weapons = game.weapons;
    const state = weapons.currentState;
    game.paused = true;
    state.ammo = Math.max(1, state.def.mag - 6);
    const now = performance.now() / 1000;
    weapons.startReload(now);
    for (let index = 0; index < 14; index += 1) weapons.update(0.016, now + 0.3 + index * 0.016);
    const dipping = state.view.group.position.y;
    weapons.finishReload();
    for (let index = 0; index < 60; index += 1) weapons.update(0.016, now + 6 + index * 0.016);
    const rest = state.view.group.position.y;
    game.paused = false;
    return { dipping: Number(dipping.toFixed(3)), rest: Number(rest.toFixed(3)) };
  });
  check("reload animation dips the viewmodel", reloadAnim.dipping < reloadAnim.rest - 0.005, JSON.stringify(reloadAnim));
  check("weapon switch updates HUD", logistics.index === 2 && logistics.name === "DMR-7" && logistics.hudName === "DMR-7", `${logistics.name} / ${logistics.hudName}`);

   const heavy = await page.evaluate(() => {
     const game = window.__GAME__;
    const dmrAmmo = game.weapons.currentState.ammo;
    game.switchWeapon(4);
    const sr = { index: game.weapons.currentIndex, name: game.weapons.currentWeapon.name, mag: game.weapons.currentState.def.mag };
    game.weapons.tryFire(performance.now() / 1000 + 1);
    const afterShot = game.weapons.currentState.ammo;
    game.switchWeapon(5);
    const lmg = { index: game.weapons.currentIndex, name: game.weapons.currentWeapon.name };
     return { dmrAmmo, sr, afterShot, lmg };
   });
  check("SR-9 equips and fires", heavy.sr.name === "SR-9" && heavy.afterShot === heavy.sr.mag - 1, JSON.stringify(heavy.sr));
   check("LMG-6 equips on slot 6", heavy.lmg.name === "LMG-6" && heavy.lmg.index === 5, heavy.lmg.name);
   const newWeaponState = await page.evaluate(() => {
     const game = window.__GAME__;
     game.switchWeapon(6);
     const shotgun = { index: game.weapons.currentIndex, name: game.weapons.currentWeapon.name, pellets: game.weapons.currentWeapon.pellets };
     game.switchWeapon(7);
     const battleRifle = { index: game.weapons.currentIndex, name: game.weapons.currentWeapon.name };
     game.switchWeapon(8);
     const machinePistol = { index: game.weapons.currentIndex, name: game.weapons.currentWeapon.name };
     return { shotgun, battleRifle, machinePistol };
   });
   check("new weapon slots equip correctly", newWeaponState.shotgun.name === "SG-12" && newWeaponState.shotgun.pellets === 8 && newWeaponState.battleRifle.name === "BR-7" && newWeaponState.machinePistol.name === "VPR-5", JSON.stringify(newWeaponState));

   const realismState = await page.evaluate(() => {
     const game = window.__GAME__;
     const view = game.weapons.states[0].view;
     return {
       theme: game.world.theme,
       casings: game.weapons.casings.length,
       bolt: Boolean(view.parts?.bolt),
       ejection: Boolean(view.ejection),
       childCount: view.group.children.length,
     };
   });
   check("realism pass adds weapon construction details", realismState.bolt && realismState.ejection && realismState.casings >= 20 && realismState.childCount >= 30, JSON.stringify(realismState));
   check("maps expose distinct environment themes", realismState.theme?.fogNear < realismState.theme?.fogFar && realismState.theme?.ground, JSON.stringify(realismState.theme));

  const presentation = await page.evaluate(() => {
    const game = window.__GAME__;
    const equipped = {
      ...game.profile,
      loadout: { ...game.profile.loadout, ar4: ["red-dot", "long-barrel"] },
    };
    game.weapons.applyLoadout(equipped);
    const ar = game.weapons.states[0];
    game.switchWeapon(2);
    game.player.ads = 1;
    game.hud.update(0.016);
    return {
      attachments: ar.def.attachmentIds,
      redDotVisible: ar.view.attachmentVisuals["red-dot"].visible,
      longBarrelVisible: ar.view.attachmentVisuals["long-barrel"].visible,
      scopeVisible: document.getElementById("scope").classList.contains("is-visible"),
      scopeOptic: document.getElementById("scope").dataset.optic,
    };
  });
  check("attachment visuals follow the equipped loadout", presentation.attachments.length === 2 && presentation.redDotVisible && presentation.longBarrelVisible, JSON.stringify(presentation));
  check("magnified scope appears while aiming", presentation.scopeVisible && presentation.scopeOptic === "magnified", JSON.stringify(presentation));
  await page.evaluate(() => {
    const game = window.__GAME__;
    game.player.ads = 0;
    game.weapons.applyLoadout(game.profile);
    game.switchWeapon(0);
  });

  const slots = await page.locator("#weapon-slots .weapon-slot").count();
   check("nine weapon slots are rendered", slots === 9, `${slots} slots`);

  const lootState = await page.evaluate(() => {
    const game = window.__GAME__;
    game.loot.reset(5, 10);
    const crate = game.loot.crates[0];
    game.player.position.set(crate.mesh.position.x, 0, crate.mesh.position.z);
    game.loot.update(0.016, game.player.position);
    const nearest = Boolean(game.loot.nearestCrate);
    const before = game.inventory.items.length;
    const ok = game.tryPickup();
    return {
      spawned: game.loot.crates.length,
      nearest,
      ok,
      before,
      after: game.inventory.items.length,
      remaining: game.loot.remaining,
      promptText: document.getElementById("loot-prompt")?.textContent ?? "",
    };
  });
  check("loot crates spawn from the seeded table", lootState.spawned === 10, `${lootState.spawned} crates`);
  check("proximity detection finds a crate", lootState.nearest === true);
  check("pickup moves the item into the inventory", lootState.ok === true && lootState.after >= lootState.before, JSON.stringify(lootState));

  const dropFlow = await page.evaluate(async () => {
    const module = await import("./js/drop.js");
    let state = module.jumpFromPlane(module.createDropState());
    let guard = 0;
    while (state.phase !== "landed" && guard < 3000) {
      state = module.stepDrop(state, 0.2);
      guard += 1;
    }
    return { phase: state.phase, altitude: state.altitude, ticks: guard, chute: state.chuteOpen };
  });
  check("parachute drop reaches the ground in the browser", dropFlow.phase === "landed" && dropFlow.altitude === 0, JSON.stringify(dropFlow));
  check("canopy opened automatically during the drop", dropFlow.chute === true, `${dropFlow.ticks} ticks`);

  await page.evaluate(() => window.__GAME__.pauseGame());
  await page.waitForTimeout(400);
  check("pause overlay", await page.locator("#pause").isVisible());
  await page.screenshot({ path: resolve(evidenceDir, "pause.png") });

  await page.click("#pause-settings");
  await page.evaluate(() => {
    const slider = document.getElementById("sensitivity");
    slider.value = "1.4";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click("#settings-save");
  await page.waitForTimeout(250);
  const settingsState = await page.evaluate(() => ({
    sensitivity: window.__GAME__.settings.sensitivity,
    stored: JSON.parse(localStorage.getItem("combat-protocol-settings-v1") ?? "{}").sensitivity,
  }));
  check("settings save applies and persists", settingsState.sensitivity === 1.4 && settingsState.stored === 1.4, `${settingsState.sensitivity} / ${settingsState.stored}`);
  await page.click("#resume-button");
  await page.waitForTimeout(250);
  check("resume restores the match", await page.evaluate(() => window.__GAME__.paused === false));

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  const persisted = await page.evaluate(() => window.__GAME__.settings.sensitivity);
  check("settings survive reload", persisted === 1.4, String(persisted));

  const errorPage = await context.newPage();
  await errorPage.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return original.call(this, type, ...args);
    };
  });
  await errorPage.goto(BASE, { waitUntil: "networkidle" });
  await errorPage.waitForTimeout(900);
  const fatalVisible = await errorPage.locator("#fatal").isVisible();
  const fatalTitle = await errorPage.locator("#fatal h2").textContent();
  check(
    "WebGL error path is handled",
    fatalVisible && String(fatalTitle).includes("تعذّر تشغيل الساحة"),
    String(fatalTitle).slice(0, 60),
  );
  await errorPage.click("#fatal-detail-toggle");
  check("fatal detail toggle reveals the raw error", await errorPage.locator("#fatal-detail").isVisible());
  const fatalRaw = await errorPage.locator("#fatal-detail").textContent();
  check("fatal detail is isolated as LTR text", (await errorPage.locator("#fatal-detail").getAttribute("dir")) === "ltr", String(fatalRaw).slice(0, 40));
  await errorPage.screenshot({ path: resolve(evidenceDir, "error-state.png") });
  await errorPage.close();

  const arabicSpacing = await page.evaluate(() => getComputedStyle(document.querySelector(".hud-label")).letterSpacing);
  check("Arabic HUD labels are not letter-spaced", arabicSpacing === "normal", arabicSpacing);

  const safePage = await context.newPage();
  await safePage.goto(`${BASE}/?safe=1`, { waitUntil: "networkidle" });
  await safePage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  const safeState = await safePage.evaluate(() => ({
    safe: window.__GAME__.safeMode,
    shadows: window.__GAME__.renderer.shadowMap.enabled,
    pixelRatio: window.__GAME__.renderer.getPixelRatio(),
    fov: Math.round(window.__GAME__.camera.fov),
  }));
  check(
    "safe mode boots with compatibility settings",
    safeState.safe === true && safeState.shadows === false && safeState.pixelRatio <= 1.2,
    JSON.stringify(safeState),
  );
  await safePage.screenshot({ path: resolve(evidenceDir, "safe-mode.png") });
  await safePage.close();

  check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  const tdmPage = await context.newPage();
  await tdmPage.goto(BASE, { waitUntil: "networkidle" });
  await tdmPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await tdmPage.click("#mode-button");
  await tdmPage.click('[data-mode="tdm"]');
  await tdmPage.click("#modes-back");
  await tdmPage.click("#start-button");
  await tdmPage.waitForTimeout(450);
  const deathState = await tdmPage.evaluate(() => {
    const game = window.__GAME__;
    game.player.takeDamage(9999, "smoke");
    return { mode: game.mode.id, running: game.running, dead: game.player.dead, respawnDelay: game.mode.respawnDelay, timer: document.getElementById("timer").textContent };
  });
  check("TDM uses its configured duration", deathState.timer === "06:00", deathState.timer);
  check("TDM death follows its respawn contract", deathState.mode === "tdm" && deathState.running && deathState.dead && deathState.respawnDelay > 0, JSON.stringify(deathState));
  await tdmPage.waitForTimeout((deathState.respawnDelay + 0.7) * 1000);
  const respawnState = await tdmPage.evaluate(() => ({
    running: window.__GAME__.running,
    dead: window.__GAME__.player.dead,
    respawned: window.__PLAYTEST_EVENTS__.some((event) => event.name === "player_respawned"),
  }));
  check("TDM respawns the player without ending the match", respawnState.running && !respawnState.dead && respawnState.respawned, JSON.stringify(respawnState));
  await tdmPage.close();

  const mapPage = await context.newPage();
  await mapPage.goto(`${BASE}/?demo=1&map=crossline`, { waitUntil: "networkidle" });
  await mapPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await mapPage.waitForTimeout(1200);
   const mapState = await mapPage.evaluate(() => ({
     mapId: window.__GAME__.world.mapId,
     mapLabel: document.getElementById("map-label").textContent,
     running: window.__GAME__.running,
     buildings: window.__GAME__.world.buildings,
   }));
   check("alternate map boots in a playable match", mapState.mapId === "crossline" && mapState.running && mapState.mapLabel && mapState.buildings > 0, JSON.stringify(mapState));
   await mapPage.close();

   for (const mapId of ["drydock9", "nightBazaar"]) {
     const newMapPage = await context.newPage();
     await newMapPage.goto(`${BASE}/?demo=1&map=${mapId}`, { waitUntil: "networkidle" });
     await newMapPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
     await newMapPage.waitForTimeout(700);
     const newMapState = await newMapPage.evaluate(() => ({
       mapId: window.__GAME__.world.mapId,
       mapLabel: document.getElementById("map-label").textContent,
       containers: window.__GAME__.world.map.containers.length,
       buildings: window.__GAME__.world.buildings,
       running: window.__GAME__.running,
     }));
     check(`${mapId} boots as a distinct playable map`, newMapState.mapId === mapId && newMapState.running && newMapState.containers >= 10 && newMapState.buildings > 0, JSON.stringify(newMapState));
     await newMapPage.close();
   }

  const brTownPage = await context.newPage();
  await brTownPage.goto(`${BASE}/?demo=1&mode=battleRoyale&map=harborTown&bots=20`, { waitUntil: "networkidle" });
  await brTownPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await brTownPage.waitForTimeout(900);
  const brTownState = await brTownPage.evaluate(() => ({
    mapId: window.__GAME__.world.mapId,
    buildings: window.__GAME__.world.buildings,
    bounds: window.__GAME__.world.bounds,
    enemies: window.__GAME__.enemies.enemies.length,
    running: window.__GAME__.running,
  }));
  check("Harbor Town BR map boots with houses and 20 bots", brTownState.mapId === "harborTown" && brTownState.running && brTownState.buildings >= 6 && brTownState.enemies === 20 && brTownState.bounds.halfX >= 40, JSON.stringify(brTownState));
  await brTownPage.close();

  const missionPage = await context.newPage();
  await missionPage.goto(BASE, { waitUntil: "networkidle" });
  await missionPage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await missionPage.click("#mode-button");
  await missionPage.click('[data-mode="frontlineOps"]');
  await missionPage.click("#modes-back");
  await missionPage.click("#start-button");
  await missionPage.waitForTimeout(500);
  const missionInitial = await missionPage.evaluate(() => ({
    mode: window.__GAME__.mode.id,
    state: window.__GAME__.getPlaytestState().mission?.state,
    label: document.getElementById("objective-label").textContent,
    marker: window.__GAME__.world.missionMarkers.get("kiosk")?.group.visible,
  }));
  check("First Light starts from the real mode UI", missionInitial.mode === "frontlineOps" && missionInitial.state === "ingress" && missionInitial.marker, JSON.stringify(missionInitial));

  const missionResult = await missionPage.evaluate(() => {
    const game = window.__GAME__;
    const moveTo = (pointId) => {
      const point = game.world.getMissionPoint(pointId);
      game.player.position.set(point.x, 0, point.z);
    };
    moveTo("kiosk");
    game.updateMissionSystems(0.016);
    game.input.keys.add("KeyE");
    game.updateMissionSystems(game.missionDef.recoverSeconds);
    game.input.keys.delete("KeyE");
    moveTo("relay");
    game.input.keys.add("KeyE");
    game.updateMissionSystems(0.016);
    game.input.keys.delete("KeyE");
    game.updateMissionSystems(game.missionDef.holdSeconds);
    moveTo("extraction");
    game.updateMissionSystems(0.016);
    return {
      mission: game.getPlaytestState().mission,
      running: game.running,
      gameover: !document.getElementById("gameover").hidden,
      ended: window.__PLAYTEST_EVENTS__.find((event) => event.name === "mission_ended") ?? null,
    };
  });
  check("First Light completes its objective chain", missionResult.mission?.state === "success" && missionResult.gameover && missionResult.ended?.matchId, JSON.stringify(missionResult));
  await missionPage.close();
  await context.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));
  await mobilePage.goto(BASE, { waitUntil: "networkidle" });
  await mobilePage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await mobilePage.waitForTimeout(900);
  await mobilePage.screenshot({ path: resolve(evidenceDir, "mobile-menu.png") });
  await mobilePage.click("#start-button");
  await mobilePage.waitForTimeout(1200);
  check("mobile touch controls", await mobilePage.locator("#touch-controls").isVisible());
  check("mobile game running", await mobilePage.evaluate(() => window.__GAME__.running === true));
  const mobileLayout = await mobilePage.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
    const vitals = rect(".vitals");
    const stick = rect(".touch-stick");
    const minimap = rect("#minimap");
    const overlaps =
      vitals && stick
        ? !(vitals.bottom <= stick.top || vitals.top >= stick.bottom || vitals.right <= stick.left || vitals.left >= stick.right)
        : false;
    return { overlaps, minimap: minimap ? minimap.width : 0, vitalsBottom: vitals ? Math.round(vitals.bottom) : 0, stickTop: stick ? Math.round(stick.top) : 0 };
  });
  check("mobile HUD clears the movement stick", mobileLayout.overlaps === false, JSON.stringify(mobileLayout));
  check("mobile minimap is visible", mobileLayout.minimap > 0, `${mobileLayout.minimap}px`);
  const mobileFov = await mobilePage.evaluate(() => Math.round(window.__GAME__.camera.fov));
  check("portrait camera widens the field of view", mobileFov > 90, `${mobileFov}°`);
  await mobilePage.screenshot({ path: resolve(evidenceDir, "mobile-game.png") });
  check("no mobile page errors", mobileErrors.length === 0, mobileErrors.slice(0, 2).join(" | "));
  await mobile.close();

  const landscape = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const landscapePage = await landscape.newPage();
  await landscapePage.goto(BASE, { waitUntil: "networkidle" });
  await landscapePage.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await landscapePage.click("#start-button");
  await landscapePage.waitForTimeout(1200);
  const landscapeState = await landscapePage.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
    const slots = rect(".weapon-slots");
    const ammo = rect(".weapon-hud");
    const overlaps =
      slots && ammo
        ? !(slots.bottom <= ammo.top || slots.top >= ammo.bottom || slots.right <= ammo.left || slots.left >= ammo.right)
        : false;
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      overlaps,
      fov: Math.round(window.__GAME__.camera.fov),
      slotsVisible: Boolean(slots && slots.width > 0),
    };
  });
  check("landscape phone has no horizontal overflow", landscapeState.overflow <= 1, `${landscapeState.overflow}px`);
  check("landscape HUD keeps weapon slots clear of the ammo panel", landscapeState.overlaps === false, JSON.stringify(landscapeState));
  check("landscape phone still shows the weapon rack", landscapeState.slotsVisible === true);
  await landscapePage.screenshot({ path: resolve(evidenceDir, "mobile-landscape.png") });
  await landscape.close();
} catch (error) {
  failures += 1;
  console.error("FAIL  smoke test crashed —", error.message);
} finally {
  await browser.close();
  server.kill();
}

console.log(failures === 0 ? "All smoke checks passed." : `${failures} smoke check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);

