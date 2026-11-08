import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const PORT = 4182;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const MAP = process.argv[2] || "port";
const MODE = MAP === "port" || MAP === "crossline" || MAP === "stackyard" || MAP === "drydock9" || MAP === "nightBazaar"
  ? "deathmatch"
  : "battleRoyale";

const server = spawn(process.execPath, ["server.mjs"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (data) => process.stdout.write(`[server] ${data}`));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server did not start");
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
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[console]", msg.text());
  });
  await page.goto(`${BASE}/?demo=1&mode=${MODE}&map=${MAP}&bots=20`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const g = window.__GAME__;
    g.pauseGame();
    g.dom.pause.hidden = true;
    const enemies = g.enemies.enemies;
    // Find an open lane: both the camera spot and the enemy spot must be clear of props.
    let spot = { x: 0, z: 16 };
    outer: for (let z = 18; z >= -18; z -= 2) {
      for (let x = -26; x <= 26; x += 2) {
        if (!g.world.isBlockedGround(x, z, 1.1) && !g.world.isBlockedGround(x, z - 3.2, 1.1)) {
          spot = { x, z };
          break outer;
        }
      }
    }
    enemies.forEach((enemy, index) => {
      enemy.group.visible = index === 0;
      if (index === 0) {
        enemy.dead = false;
        enemy.health = 100;
        enemy.healthBar.sprite.visible = true;
        enemy.position.set(spot.x, 0, spot.z - 3.2);
        enemy.group.position.copy(enemy.position);
        enemy.group.rotation.set(0, Math.PI, 0);
      }
    });
    g.camera.position.set(spot.x, 1.7, spot.z);
    g.camera.lookAt(spot.x, 1.05, spot.z - 3.2);
    g.renderer.render(g.scene, g.camera);
    const decal = g.world.environmentDecals[0];
    return {
      spot,
      decals: g.world.environmentDecals.length,
      decalKinds: g.world.environmentDecals.map((mesh) => mesh.material.map?.image?.width ?? 0).slice(0, 3),
      meshes: enemies[0].hitMeshes.length,
      hasKnee: Boolean(enemies[0].leftKnee && enemies[0].rightKnee),
      buildings: g.world.buildings,
      buildingSpots: g.world.buildingSpots.slice(0, 3),
      decalPosition: decal ? { x: decal.position.x, z: decal.position.z } : null,
    };
  });
  console.log(JSON.stringify(info));
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve("evidence", "enemy-closeup.png") });
  await page.screenshot({
    path: resolve("evidence", "enemy-detail.png"),
    clip: { x: 520, y: 210, width: 400, height: 400 },
  });

  await page.evaluate(() => {
    const g = window.__GAME__;
    const decal = g.world.environmentDecals[0];
    g.camera.position.set(decal.position.x, 2.6, decal.position.z + 4.5);
    g.camera.lookAt(decal.position.x, 0, decal.position.z);
    g.renderer.render(g.scene, g.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve("evidence", "ground-decals.png") });

  const building = await page.evaluate(() => {
    const g = window.__GAME__;
    const spot = g.world.buildingSpots[0];
    if (!spot) return null;
    g.camera.position.set(spot.x, 2.0, spot.z + Math.max(7, spot.depth + 5));
    g.camera.lookAt(spot.x, 1.7, spot.z);
    g.renderer.render(g.scene, g.camera);
    return spot;
  });
  if (building) {
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve("evidence", "building.png") });
  }
  await context.close();
} finally {
  await browser.close();
  server.kill();
}
