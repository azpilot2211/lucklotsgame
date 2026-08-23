import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const root = process.cwd();
const reports = path.resolve(root, "reports/lighthouse");
const profiles = path.resolve(root, "reports/lighthouse-profiles");
const config = JSON.parse(await readFile("lighthouserc.json", "utf8")).ci;
await mkdir(reports, { recursive: true });
await mkdir(profiles, { recursive: true });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForUrl(url, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: "4177", SITE_HOST: "127.0.0.1" },
  stdio: "inherit",
});
const results = [];
try {
  await waitForUrl("http://127.0.0.1:4177/");
  let runNumber = 0;
  for (const url of config.collect.url) {
    for (let iteration = 0; iteration < config.collect.numberOfRuns; iteration += 1) {
      runNumber += 1;
      const port = 9300 + runNumber;
      const profile = path.join(profiles, `run-${Date.now()}-${runNumber}`);
      const chrome = spawn(chromium.executablePath(), [
        "--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
        `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
      ], { stdio: "ignore" });
      try {
        await waitForUrl(`http://127.0.0.1:${port}/json/version`);
        const result = await lighthouse(url, {
          port, logLevel: "error", output: "json", formFactor: "mobile",
          screenEmulation: config.collect.settings.screenEmulation,
        });
        if (!result) throw new Error(`Lighthouse produced no result for ${url}`);
        const slug = new URL(url).pathname.replace(/^\/+|\/+$/g, "").replaceAll("/", "-") || "home";
        await writeFile(path.join(reports, `${slug}-${iteration + 1}.json`), result.report);
        results.push({ url, lhr: result.lhr });
        console.log(`Lighthouse ${url} run ${iteration + 1}: performance ${Math.round(result.lhr.categories.performance.score * 100)}`);
      } finally {
        chrome.kill();
      }
    }
  }
} finally {
  server.kill();
}

const failures = [];
for (const { url, lhr } of results) {
  for (const [name, ruleValue] of Object.entries(config.assert.assertions)) {
    const rule = Array.isArray(ruleValue) ? ruleValue[1] ?? {} : {};
    const target = name.startsWith("categories:") ? lhr.categories[name.split(":")[1]] : lhr.audits[name];
    if (!target) { failures.push(`${url}: missing audit ${name}`); continue; }
    if (rule.minScore != null && target.score < rule.minScore) failures.push(`${url}: ${name} ${target.score} < ${rule.minScore}`);
    if (rule.maxNumericValue != null && target.numericValue > rule.maxNumericValue) failures.push(`${url}: ${name} ${target.numericValue} > ${rule.maxNumericValue}`);
    if (ruleValue === "error" && target.score !== 1) failures.push(`${url}: ${name} score ${target.score}`);
  }
}
const summary = [...new Set(results.map(({ url }) => url))].map((url) => {
  const runs = results.filter((result) => result.url === url).map(({ lhr }) => lhr);
  return {
    url,
    performance: median(runs.map((lhr) => Math.round(lhr.categories.performance.score * 100))),
    accessibility: median(runs.map((lhr) => Math.round(lhr.categories.accessibility.score * 100))),
    bestPractices: median(runs.map((lhr) => Math.round(lhr.categories["best-practices"].score * 100))),
    seo: median(runs.map((lhr) => Math.round(lhr.categories.seo.score * 100))),
    lcpMs: Math.round(median(runs.map((lhr) => lhr.audits["largest-contentful-paint"].numericValue))),
    cls: Number(median(runs.map((lhr) => lhr.audits["cumulative-layout-shift"].numericValue)).toFixed(4)),
    tbtMs: Math.round(median(runs.map((lhr) => lhr.audits["total-blocking-time"].numericValue))),
    bytes: Math.round(median(runs.map((lhr) => lhr.audits["total-byte-weight"].numericValue))),
  };
});
await writeFile(path.join(reports, "summary.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), results: summary }, null, 2)}\n`);
console.table(summary);
if (failures.length) throw new Error(`Lighthouse assertions failed:\n${failures.join("\n")}`);
