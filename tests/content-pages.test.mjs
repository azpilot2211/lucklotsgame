import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

function build() {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

function jsonLdRecords(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]));
}

test("news index links to the one verified dated update and homepage surfaces it", async () => {
  build();
  const news = await readFile("news/index.html", "utf8");
  const home = await readFile("index.html", "utf8");
  for (const html of [news, home]) {
    assert.match(html, /href="\/news\/my-block-is-a-real-street\/"/);
    assert.match(html, /My Block is a real street now/);
    assert.match(html, /datetime="2026-08-21">August 21, 2026/);
  }
  assert.equal((news.match(/class="article-card"/g) || []).length, 1);
});

test("news article keeps visible facts and matching Article schema", async () => {
  build();
  const html = await readFile("news/my-block-is-a-real-street/index.html", "utf8");
  assert.match(html, /<article\b/);
  assert.match(html, /<h1>My Block is a real street now<\/h1>/);
  assert.match(html, /Published <time datetime="2026-08-21">August 21, 2026<\/time>/);
  assert.match(html, /Updated <time datetime="2026-08-21">August 21, 2026<\/time>/);
  assert.match(html, /By CapeCoder/);
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /<meta property="article:published_time" content="2026-08-21">/);
  assert.match(html, /house names on the road/);
  assert.match(html, /Claw prize label/);
  assert.match(html, /Team race banner/);
  assert.match(html, /<img src="\/art\/optimized\/street-960\.webp"[^>]+fetchpriority="high"/);
  const article = jsonLdRecords(html).find((record) => record["@type"] === "Article");
  assert.equal(article.headline, "My Block is a real street now");
  assert.equal(article.datePublished, "2026-08-21");
  assert.equal(article.dateModified, "2026-08-21");
  assert.equal(article.image, "https://luckylotsgame.com/art/optimized/street-960.webp");
  assert.doesNotMatch(JSON.stringify(article), /aggregateRating|reviewRating/);
});

test("support answers the live game's purchase, ad, save, and contact questions", async () => {
  build();
  const html = await readFile("support/index.html", "utf8");
  assert.match(html, /Rewarded ads are optional/);
  assert.match(html, /in-app purchases/i);
  assert.match(html, /saves locally first/i);
  assert.match(html, /Cloud sync is conditional/);
  assert.match(html, /mailto:azpilot@gmail\.com/);
  assert.match(html, /href="\/privacy\.html"/);
  assert.match(html, /href="\/terms\.html"/);
  assert.match(html, /href="\/how-to-play\/"/);
  assert.match(html, /play\.google\.com\/store\/apps\/details\?id=com\.luckylots\.cardcity/);
});

test("shared legal pages preserve substantive protections while correcting stale launch facts", async () => {
  build();
  const privacy = await readFile("privacy.html", "utf8");
  const terms = await readFile("terms.html", "utf8");
  for (const [path, html] of [["/privacy.html", privacy], ["/terms.html", terms]]) {
    assert.match(html, /Skip to content/);
    assert.match(html, new RegExp(`rel="canonical" href="https:\\/\\/luckylotsgame\\.com${path.replace(".", "\\.")}"`));
    assert.match(html, /aria-label="Breadcrumb"/);
    assert.match(html, /href="\/how-to-play\/"/);
  }
  assert.match(privacy, /Anything you type in chat is public to other players/);
  assert.match(privacy, /Messages are deleted automatically after seven days/);
  assert.match(privacy, /Optional rewarded ads/);
  assert.match(privacy, /ask about deletion of any available cloud copy/);
  assert.doesNotMatch(privacy, /sends nothing off your device|never leave your device/i);
  assert.match(privacy, /Last updated: August 1, 2026/);
  assert.match(privacy, /Chat is for talking to other players about the game/);
  assert.match(terms, /The game is provided &quot;as is&quot;, without warranty of any kind/);
  assert.match(terms, /in-game item.*have no cash value/i);
  assert.match(terms, /Last updated: July 11, 2026/);
  assert.match(terms, /Please don&#39;t decompile, modify, or redistribute the game or its assets/);
  assert.match(terms, /If these terms change in a way that matters, the update&#39;s store notes will say so/);
  const combined = `${privacy}\n${terms}`;
  assert.doesNotMatch(combined, /waitlist|no real-money purchases|don&#39;t operate accounts or servers|privacy-policy\.md/i);
});

test("content detail pages offer breadcrumbs and a useful next path", async () => {
  build();
  for (const page of ["news/my-block-is-a-real-street/index.html", "support/index.html", "privacy.html", "terms.html"]) {
    const html = await readFile(page, "utf8");
    assert.match(html, /aria-label="Breadcrumb"/, page);
    assert.match(html, /(?:data-play-placement=|href="\/how-to-play\/"|href="\/support\/")/, page);
  }
});
