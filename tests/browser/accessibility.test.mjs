import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startServer, stopServer } from "./helpers.mjs";

const paths = [
  "/",
  "/how-to-play/",
  "/how-to-play/cards-and-deals/",
  "/news/",
  "/news/my-block-is-a-real-street/",
  "/support/",
  "/privacy.html",
  "/terms.html",
];

test("public pages have no serious or critical axe violations", async (t) => {
  const server = await startServer(4181);
  t.after(() => stopServer(server.child));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const pathname of paths) {
    await page.goto(`${server.baseUrl}${pathname}`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    assert.deepEqual(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })), [], pathname);
  }
});

test("keyboard navigation, skip link, FAQ, and reduced motion remain accessible", async (t) => {
  const server = await startServer(4182);
  t.after(() => stopServer(server.child));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${server.baseUrl}/`);
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").textContent(), "Skip to content");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main");

  const toggle = page.locator("[data-nav-toggle]");
  await toggle.focus();
  await page.keyboard.press("Enter");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute("data-nav-toggle")), true);

  await page.goto(`${server.baseUrl}/support/`);
  const firstQuestion = page.locator("summary").first();
  await firstQuestion.focus();
  await page.keyboard.press("Enter");
  assert.equal(await firstQuestion.evaluate((summary) => summary.parentElement.open), true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${server.baseUrl}/`);
  const hiddenRevealCount = await page.locator("[data-reveal]").evaluateAll((items) => items.filter((item) => getComputedStyle(item).opacity !== "1").length);
  assert.equal(hiddenRevealCount, 0);

  const undersized = await page.locator("button, summary, .play-cta, .site-nav a, .support-links a").evaluateAll((items) => items
    .filter((item) => item.getClientRects().length > 0)
    .map((item) => ({ text: item.textContent.trim(), rect: item.getBoundingClientRect().toJSON() }))
    .filter(({ rect }) => rect.width < 44 || rect.height < 44));
  assert.deepEqual(undersized, []);
});
