import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

test("client source implements accessible navigation and reduced-motion reveals", async () => {
  const source = await readFile("src/js/main.js", "utf8");
  assert.match(source, /document\.documentElement\.classList\.add\(["']js["']\)/);
  assert.match(source, /setAttribute\(["']aria-expanded["']/);
  assert.match(source, /classList\.toggle\(["']is-open["']/);
  assert.match(source, /event\.key === ["']Escape["']/);
  assert.match(source, /toggle\.focus\(\)/);
  assert.match(source, /matchMedia\(["']\(prefers-reduced-motion: reduce\)["']\)/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /observer\.unobserve/);
});

test("Play-store click event is delegated without blocking normal navigation", async () => {
  const source = await readFile("src/js/main.js", "utf8");
  assert.match(source, /closest\(["']a\[data-play-placement\]["']\)/);
  assert.match(source, /CustomEvent\(["']ll:play-store-click["']/);
  assert.match(source, /placement:\s*anchor\.dataset\.playPlacement/);
  assert.doesNotMatch(source, /preventDefault\s*\(/);
  assert.doesNotMatch(source, /requestAnimationFrame|addEventListener\(["']scroll|frames\/|Web3Forms|connect\.facebook\.net|fbevents\.js/i);
});

test("build publishes a small client and layout establishes enhancement state before CSS", async () => {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const [html, client] = await Promise.all([
    readFile("index.html", "utf8"),
    readFile("js/main.js", "utf8"),
  ]);
  assert.ok(client.length < 8 * 1024, `client is ${client.length} bytes`);
  assert.ok(html.indexOf('classList.add("js")') < html.indexOf('<link rel="stylesheet"'), "JS class hook must precede CSS");
  assert.match(html, /<script src="\/js\/main\.js" defer><\/script>/);
});
