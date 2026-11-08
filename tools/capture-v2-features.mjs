import { resolve } from "node:path";
import { chromium } from "playwright-core";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const evidenceDir = resolve("evidence");

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox", "--hide-scrollbars"],
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  console.log("Navigating to game lobby...");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__GAME_READY__ === true, { timeout: 30000 });
  await page.waitForTimeout(600);

  // 1. Capture Modern AAA PUBG Lobby
  await page.screenshot({ path: resolve(evidenceDir, "pubg-lobby-3d.png") });
  await page.screenshot({ path: resolve(evidenceDir, "lobby-v2.png") });
  console.log("Captured pubg-lobby-3d.png and lobby-v2.png");

  // 2. Open Crates Modal
  await page.click("#crates-button");
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(evidenceDir, "pubg-crates.png") });
  console.log("Captured pubg-crates.png");
  await page.click("#crates-close");
  await page.waitForTimeout(300);

  // 3. Open Gun Lab Modal
  await page.click("#gun-lab-button");
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(evidenceDir, "pubg-gun-lab.png") });
  console.log("Captured pubg-gun-lab.png");
  await page.click("#gun-lab-close");
  await page.waitForTimeout(300);

  // 4. Open Store
  await page.click("#store-button");
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(evidenceDir, "store-bundles.png") });
  console.log("Captured store-bundles.png");
  await page.click("#store-close");
  await page.waitForTimeout(300);

  // 5. Open Friends
  await page.click("#friends-button");
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(evidenceDir, "friends-squad.png") });
  console.log("Captured friends-squad.png");
  await page.click("#friends-close");
  await page.waitForTimeout(300);

  // 6. Open Battle Pass / Progression
  await page.click("#pass-button");
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(evidenceDir, "battle-pass.png") });
  console.log("Captured battle-pass.png");
  await page.click("#progression-close");
  await page.waitForTimeout(300);

  // 5. Start Battle Royale match and capture airborne insertion with C-130
  console.log("Starting Battle Royale match...");
  await page.evaluate(() => {
    const game = window.__GAME__;
    game.modeId = "battleRoyale";
    game.mapId = "harborTown";
    game.startGame({ demo: false });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(evidenceDir, "c130-airdrop.png") });
  console.log("Captured c130-airdrop.png");

  console.log("All visual evidence captured successfully!");
} finally {
  await browser.close();
}
