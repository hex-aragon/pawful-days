import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { makeCourse } from "../platformer.js";
const browser = await chromium.launch(),
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_URL || "http://127.0.0.1:5289/");
await page.locator("#start-screen").waitFor({ state: "visible" });
const saved = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("pawful-platformer-v3")),
    ),
  state = async () =>
    JSON.parse(await page.locator("#world").getAttribute("data-play"));
const portraits = [];
for (let coat = 0; coat < 4; coat++) {
  await page.locator(`[data-coat="${coat}"]`).click();
  assert.equal((await saved()).coat, coat);
  portraits.push(
    await page.locator("#portrait").evaluate((c) => c.toDataURL()),
  );
}
assert.equal(new Set(portraits).size, 4);
await page.locator("#name-edit").click();
await page.locator("#name-input").fill("몽실");
await page.locator("#name-form button").click();
await page.screenshot({ path: "/tmp/pawful-title-v3.png" });
await page.locator("#start").click();
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(600);
await page.keyboard.up("ArrowRight");
await page.waitForTimeout(120);
assert.ok((await state()).x > 270);
await page.keyboard.press("e");
await page.waitForTimeout(100);
assert.ok((await saved()).xp >= 5);
await page.waitForTimeout(1500);
await page.keyboard.down(" ");
await page.waitForTimeout(180);
assert.ok((await state()).y < 555);
assert.equal((await state()).jumps, 1);
await page.keyboard.up(" ");
await page.keyboard.down(" ");
await page.waitForTimeout(150);
assert.equal((await state()).jumps, 2);
await page.screenshot({ path: "/tmp/pawful-jump-v3.png" });
await page.keyboard.up(" ");
await page.waitForTimeout(1200);
const course = makeCourse(0);
await page.keyboard.down("ArrowRight");
await page.keyboard.down("Shift");
let jumpAt = 0;
const started = Date.now();
while (Date.now() - started < 45000) {
  const p = await state();
  if (p.mode === "complete") break;
  let want = false;
  if (p.grounded) {
    const support = course.platforms.find(
      (s) =>
        p.x >= s.x - 10 && p.x <= s.x + s.w + 10 && Math.abs(p.y - s.y) < 5,
    );
    want =
      Boolean(support && support.x + support.w - p.x < 155) ||
      course.platforms.some(
        (s) => s.solid && s.y < p.y && s.x - p.x > 0 && s.x - p.x < 155,
      );
  } else want = p.jumps === 1 && p.vy > 0;
  if (want && Date.now() - jumpAt > 240) {
    await page.keyboard.up(" ");
    await page.keyboard.down(" ");
    jumpAt = Date.now();
  }
  await page.waitForTimeout(50);
}
await page.keyboard.up("ArrowRight");
await page.keyboard.up("Shift");
await page.keyboard.up(" ");
await page.locator("#next").waitFor({ state: "visible", timeout: 1000 });
assert.ok((await saved()).finished[0]);
assert.equal((await saved()).unlocked, 1);
assert.ok((await saved()).xp >= 45, "growth points from actual course");
await page.locator("#next").click();
assert.equal(await page.locator("#course-name").textContent(), "바람 숲길");
await page.locator("#pause").click();
await page.locator("#change-coat").click();
await page.reload();
await page.locator("#start-screen").waitFor({ state: "visible" });
assert.equal((await saved()).name, "몽실");
assert.equal((await saved()).coat, 3);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "/tmp/pawful-mobile-title-v3.png" });
await page.locator("#start").click();
const x = (await state()).x;
const r = await page.locator("#right").boundingBox();
await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
await page.mouse.down();
await page.waitForTimeout(500);
await page.mouse.up();
await page.waitForTimeout(100);
assert.ok((await state()).x > x + 60);
await page
  .locator("#jump")
  .dispatchEvent("pointerdown", { pointerId: 1, clientX: 350, clientY: 760 });
await page.waitForTimeout(180);
assert.ok((await state()).y < 570);
await page.locator("#jump").dispatchEvent("pointerup", { pointerId: 1 });
await page.screenshot({ path: "/tmp/pawful-mobile-play-v3.png" });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
assert.deepEqual(errors, []);
console.log(
  "PASS: four distinct coats, name persistence, keyboard running, two-stage jump, care, actual full-course platform navigation and completion, growth, course unlock, mobile movement and jump, no browser errors",
);
await browser.close();
