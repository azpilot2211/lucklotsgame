import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const pages = [
  "index.html",
  "how-to-play/index.html",
  "how-to-play/cards-and-deals/index.html",
  "how-to-play/building-and-rent/index.html",
  "how-to-play/rivals-and-jail/index.html",
  "how-to-play/bonus-games/index.html",
  "how-to-play/cities-and-events/index.html",
  "how-to-play/shop-saves-safety/index.html",
  "news/index.html",
  "news/my-block-is-a-real-street/index.html",
  "support/index.html",
  "privacy.html",
  "terms.html",
];

function build() {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

function expectedPath(file) {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
  return `/${file}`;
}

function localTarget(href, currentFile = "index.html") {
  const url = new URL(href, `https://luckylotsgame.com${expectedPath(currentFile)}`);
  if (url.origin !== "https://luckylotsgame.com") return null;
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
}

test("every public page has complete unique Google-facing metadata", async () => {
  build();
  for (const file of pages) {
    const html = await readFile(path.join("dist", file), "utf8");
    assert.equal((html.match(/<title>[^<]+<\/title>/g) || []).length, 1, file);
    assert.equal((html.match(/<meta name="description" content="[^"]+">/g) || []).length, 1, file);
    assert.equal((html.match(/<link rel="canonical" href="[^"]+">/g) || []).length, 1, file);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    assert.equal((html.match(/<main\b/g) || []).length, 1, file);
    assert.match(html, /<html lang="en">/, file);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)[1];
    assert.equal(canonical, `https://luckylotsgame.com${expectedPath(file)}`, file);
    for (const property of ["og:type", "og:title", "og:description", "og:url", "og:image"]) {
      assert.match(html, new RegExp(`<meta property="${property}" content="[^"]+">`), `${file} ${property}`);
    }
    assert.match(html.match(/<meta property="og:url" content="([^"]+)">/)[1], /^https:\/\//, file);
    assert.match(html.match(/<meta property="og:image" content="([^"]+)">/)[1], /^https:\/\//, file);
  }
});

test("internal links, fragments, and image files resolve", async () => {
  build();
  const cache = new Map();
  for (const file of pages) cache.set(file, await readFile(path.join("dist", file), "utf8"));
  for (const [file, html] of cache) {
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:mailto:|tel:|https:\/\/play\.google\.com)/.test(href)) continue;
      const target = localTarget(href, file);
      if (!target) continue;
      await access(path.join("dist", target));
      const fragment = new URL(href, `https://luckylotsgame.com${expectedPath(file)}`).hash.slice(1);
      if (fragment) {
        const targetHtml = cache.get(target) || await readFile(path.join("dist", target), "utf8");
        assert.match(targetHtml, new RegExp(`id="${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${file} -> ${href}`);
      }
    }
    for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
      const attrs = match[1];
      assert.match(attrs, /\ssrc="([^"]+)"/, file);
      assert.match(attrs, /\salt="[^"]*"/, file);
      assert.match(attrs, /\swidth="\d+"/, file);
      assert.match(attrs, /\sheight="\d+"/, file);
      await access(path.join("dist", localTarget(attrs.match(/\ssrc="([^"]+)"/)[1], file)));
    }
  }
});

test("structured data parses and never invents ratings", async () => {
  build();
  for (const file of pages) {
    const html = await readFile(path.join("dist", file), "utf8");
    for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      const record = JSON.parse(match[1]);
      assert.doesNotMatch(JSON.stringify(record), /aggregateRating|reviewRating/);
    }
  }
});

test("robots and sitemap expose every canonical once", async () => {
  build();
  const [robots, sitemap] = await Promise.all([
    readFile("dist/robots.txt", "utf8"),
    readFile("dist/sitemap.xml", "utf8"),
  ]);
  assert.equal(robots, "User-agent: *\nAllow: /\nSitemap: https://luckylotsgame.com/sitemap.xml\n");
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(locations).size, pages.length);
  assert.deepEqual(locations, [...locations].sort());
  for (const file of pages) {
    const canonical = `https://luckylotsgame.com${expectedPath(file)}`;
    assert.equal(locations.filter((location) => location === canonical).length, 1, canonical);
  }
  assert.equal((sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length, pages.length);
});
