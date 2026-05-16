import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "screenshots");
mkdirSync(outDir, { recursive: true });

const file = "file://" + path.join(root, "presentation.html");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
});

await page.goto(file, { waitUntil: "networkidle" });
const total = await page.$$eval(".slide", (s) => s.length);
console.log(`Found ${total} slides. Capturing…`);

// Ensure we start on slide 1
await page.evaluate(() => {
  document.querySelectorAll(".slide").forEach((s, i) => {
    s.classList.toggle("active", i === 0);
  });
});
await page.waitForTimeout(400);

for (let i = 1; i <= total; i++) {
  // Force-activate the i-th slide directly (bypass hash, which has no listener)
  await page.evaluate((n) => {
    document.querySelectorAll(".slide").forEach((s, i) => {
      s.classList.toggle("active", i === n - 1);
    });
  }, i);
  // Re-trigger anim by retoggling active class
  await page.waitForTimeout(1200);
  const name = `slide-${String(i).padStart(2, "0")}.png`;
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  console.log(`  ✓ ${name}`);
}

await browser.close();
console.log(`\nDone. Output: ${outDir}`);
