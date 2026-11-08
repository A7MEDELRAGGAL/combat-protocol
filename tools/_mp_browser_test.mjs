import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const PORT = 4192;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const server = spawn(process.execPath, ["server.mjs"], { env: { ...process.env, PORT: String(PORT), MP_DEBUG: "1" }, stdio: ["ignore", "pipe", "pipe"] });
server.stdout.on("data", (data) => console.log("[server]", data.toString().trim()));
server.stderr.on("data", (data) => console.log("[server:err]", data.toString().trim()));
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    if ((await fetch(`${BASE}/health`)).ok) break;
  } catch {}
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox", "--hide-scrollbars"],
});
const errors = [];

async function join(page, name) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__GAME_READY__ === true, undefined, { timeout: 30000 });
  await page.click("#multiplayer-button");
  await page.fill("#mp-name", name);
  await page.fill("#mp-room", "test-room");
  await page.click("#mp-connect");
  await page.waitForFunction(() => window.__GAME__.multiplayer === true && Boolean(window.__GAME__.net?.selfId), undefined, { timeout: 15000 });
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const one = await context.newPage();
  const two = await context.newPage();
  await join(one, "Alpha");
  await join(two, "Bravo");
  await one.waitForTimeout(1200);

  await one.evaluate(() => {
    window.__GAME__.player.position.set(0, 0, 0);
    window.__GAME__.player.yaw = 0;
    window.__GAME__.player.pitch = 0;
  });
  await two.evaluate(() => {
    window.__GAME__.player.position.set(0, 0, 6);
    window.__GAME__.player.yaw = Math.PI;
    window.__GAME__.player.pitch = 0;
    window.__GAME__.net.sendState({ x: 0, y: 0, z: 6, yaw: Math.PI, pitch: 0, health: 100, weapon: "ar4" });
  });
  await one.waitForTimeout(1600);

  const before = await two.evaluate(() => ({
    health: window.__GAME__.player.health,
    remote: window.__GAME__.remote?.players.size ?? 0,
    roster: document.querySelectorAll("#mp-roster .roster-chip").length,
    paused: window.__GAME__.paused,
    running: window.__GAME__.running,
    position: { x: window.__GAME__.player.position.x, z: window.__GAME__.player.position.z },
    remotes: [...(window.__GAME__.remote?.players.values() ?? [])].map((entry) => ({ x: entry.target.x, z: entry.target.z })),
  }));
  console.log("page1 snapshot", await one.evaluate(() => (window.__GAME__.lastSnapshot ?? []).map((player) => ({ name: player.name, x: player.x, z: player.z }))));
  console.log("ids", await one.evaluate(() => ({ self: window.__GAME__.mpSelfId, net: window.__GAME__.net?.selfId, remotes: [...(window.__GAME__.remote?.players.values() ?? [])].map((entry) => ({ name: entry.player?.name, target: { x: entry.target.x, z: entry.target.z } })) })), await two.evaluate(() => ({ self: window.__GAME__.mpSelfId, net: window.__GAME__.net?.selfId })));

  await one.evaluate(() => {
    window.__GAME__.net.sendShot({ origin: { x: 0, y: 1, z: 0 }, direction: { x: 0, y: 0, z: 1 }, damage: 25 });
  });
  await two.waitForTimeout(900);
  const after = await two.evaluate(() => ({
    health: window.__GAME__.player.health,
    remote: window.__GAME__.remote?.players.size ?? 0,
    roster: document.querySelectorAll("#mp-roster .roster-chip").length,
  }));

  await two.fill("#mp-hud-input", "hello from Bravo");
  await two.press("#mp-hud-input", "Enter");
  await one.waitForTimeout(600);
  const chat = await one.locator("#mp-hud-log").innerText();

  await one.screenshot({ path: resolve("evidence", "multiplayer-game.png") });
  await one.evaluate(() => window.__GAME__.quitToMenu());
  await one.waitForTimeout(500);
  await one.click("#multiplayer-button");
  await one.waitForTimeout(300);
  await one.screenshot({ path: resolve("evidence", "multiplayer-room.png") });

  console.log(JSON.stringify({ before, after, chatHasHello: chat.includes("hello from Bravo"), errors }));
  await context.close();
} finally {
  await browser.close();
  server.kill();
}
