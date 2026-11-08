import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const PORT = 4181;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const SCENARIOS = [
  { label: "dm-5", query: "?demo=1&map=port" },
  { label: "br-20", query: "?demo=1&mode=battleRoyale&map=port&bots=20", stress: true },
  { label: "br-20-live", query: "?demo=1&mode=battleRoyale&map=port&bots=20", live: true },
];
const requested = process.argv[2];
const scenarios = requested ? SCENARIOS.filter((scenario) => scenario.label === requested) : SCENARIOS;

const server = spawn(process.execPath, ["server.mjs"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (data) => process.stdout.write(`[server] ${data}`));
server.stderr.on("data", (data) => process.stderr.write(`[server] ${data}`));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return;
    } catch {
      // retry while the local server boots
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Benchmark server did not start");
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox", "--hide-scrollbars"],
});

try {
  await waitForServer();
  for (const scenario of scenarios) {
    for (const quality of ["high", "low"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.addInitScript((selectedQuality) => {
        localStorage.setItem("combat-protocol-settings-v1", JSON.stringify({ sensitivity: 1, fov: 80, quality: selectedQuality, sound: false, invertY: false }));
      }, quality);
      await page.goto(`${BASE}/${scenario.query}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__GAME_READY__ === true, undefined, { timeout: 30000 });
      if (scenario.stress || scenario.live) {
        await page.waitForFunction(
          () => window.__GAME__?.running === true && window.__GAME__.enemies.enemies.length >= 20,
          undefined,
          { timeout: 30000 },
        );
      }
      if (scenario.live) {
        // SwiftShader runs the simulation far below real time, so land instantly
        // and measure the normal 20-bot gameplay loop from the ground.
        await page.evaluate(() => {
          const game = window.__GAME__;
          if (game.dropState) {
            game.dropState.phase = "landed";
            game.dropState.altitude = 0;
            game.dropState.velocity = 0;
            game.dropState.chuteOpen = false;
          }
          const spawn = game.world.getSpawn(0);
          game.player.position.set(spawn.x, 0, spawn.z);
          game.player.velocity.set(0, 0, 0);
        });
        await page.waitForTimeout(1500);
      }
      if (scenario.stress) {
        const sample = await page.evaluate(() => {
          const game = window.__GAME__;
          game.pauseGame();
          game.dom.pause.hidden = true;
          const enemies = game.enemies.enemies;
          enemies.forEach((enemy, index) => {
            enemy.dead = false;
            enemy.health = 100;
            enemy.position.set(-10 + (index % 5) * 5, 0, 12 - Math.floor(index / 5) * 7);
            enemy.group.position.copy(enemy.position);
            enemy.group.visible = true;
            enemy.healthBar.sprite.visible = true;
          });
          game.camera.position.set(0, 1.75, 20);
          game.camera.lookAt(0, 1.1, -2);
          game.renderer.render(game.scene, game.camera);
          return {
            enemies: enemies.length,
            drawCalls: game.renderer.info.render.calls,
          };
        });
        console.log(`${scenario.label.padEnd(6)} ${quality.padEnd(4)} enemies=${sample.enemies}  drawCalls=${sample.drawCalls}  (all placed on screen)`);
        await context.close();
        continue;
      }
      const sample = await page.evaluate(() => new Promise((resolve) => {
        const start = performance.now();
        let frames = 0;
        const tick = () => {
          frames += 1;
          const elapsed = performance.now() - start;
          if (elapsed >= 3000) {
            resolve({
              fps: Number((frames / (elapsed / 1000)).toFixed(1)),
              drawCalls: window.__GAME__.renderer.info.render.calls,
              pixelRatio: window.__GAME__.renderer.getPixelRatio(),
              shadows: window.__GAME__.renderer.shadowMap.enabled,
              enemies: window.__GAME__.enemies.enemies.length,
              meshes: window.__GAME__.scene.children.length,
            });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }));
      console.log(`${scenario.label.padEnd(6)} ${quality.padEnd(4)} enemies=${sample.enemies}  fps=${sample.fps}  drawCalls=${sample.drawCalls}  pixelRatio=${sample.pixelRatio}  shadows=${sample.shadows}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
