import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startServer, stopServer } from "./helpers.mjs";

const viewports = [
  [320, 568], [360, 800], [390, 844], [412, 915],
  [768, 1024], [1024, 768], [1280, 720], [1440, 900],
];

test("homepage fits target viewports with the mobile promise and action visible", async (t) => {
  const server = await startServer(4183);
  t.after(() => stopServer(server.child));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  await mkdir("reports/screenshots", { recursive: true });
  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(`${server.baseUrl}/`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 0, `${width}x${height} overflows by ${overflow}px`);
    const proofItems = await page.locator(".proof-item").all();
    assert.equal(proofItems.length, 3, `hero proof items missing at ${width}x${height}`);
    const proofListBox = await page.locator(".proof-list").boundingBox();
    assert.ok(proofListBox, `.proof-list missing at ${width}x${height}`);
    const leftGutter = proofListBox.x;
    const rightGutter = width - (proofListBox.x + proofListBox.width);
    assert.ok(Math.abs(leftGutter - rightGutter) <= 1, `.proof-list gutters differ at ${width}x${height}: ${leftGutter}px / ${rightGutter}px`);
    for (const item of proofItems) {
      const box = await item.boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= width, `.proof-item escapes ${width}x${height}`);
    }
    if (width <= 412) {
      for (const selector of ["h1", '[data-play-placement="hero"]']) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(box && box.y >= 0 && box.y + box.height <= height, `${selector} is outside ${width}x${height}`);
      }
    }
    if ((width === 390 && height === 844) || (width === 1440 && height === 900)) {
      await page.screenshot({ path: `reports/screenshots/home-${width}x${height}.png`, fullPage: true });
    }
    await page.close();
  }
});

test("no-JavaScript content and navigation fail open", async (t) => {
  const server = await startServer(4184);
  t.after(() => stopServer(server.child));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${server.baseUrl}/`);
  await assert.doesNotReject(() => page.locator("h1").waitFor({ state: "visible" }));
  assert.equal(await page.locator(".site-nav a").count(), 4);
  assert.equal(await page.locator(".nav-toggle").isVisible(), false);
  assert.ok(await page.locator("[data-play-placement]").count() >= 3);
  await page.goto(`${server.baseUrl}/support/`);
  assert.match(await page.locator("main").textContent(), /Rewarded ads are optional/);
});

test("cold mobile request budget excludes legacy frames", async (t) => {
  const server = await startServer(4185);
  t.after(() => stopServer(server.child));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const firstParty = [];
  let imageBytes = 0;
  page.on("response", async (response) => {
    const url = new URL(response.url());
    if (url.origin !== server.baseUrl) return;
    firstParty.push(url.pathname);
    if (response.request().resourceType() === "image") {
      const length = Number(response.headers()["content-length"] || 0);
      imageBytes += length;
    }
  });
  await page.goto(`${server.baseUrl}/`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  assert.equal(firstParty.some((pathname) => pathname.includes("/frames/")), false);
  assert.ok(firstParty.length <= 10, `initial first-party requests: ${firstParty.join(", ")}`);
  assert.ok(imageBytes <= 250 * 1024, `initial image transfer: ${imageBytes} bytes`);
});
