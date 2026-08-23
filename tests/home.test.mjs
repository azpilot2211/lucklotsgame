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

test("homepage resolves the promise and Google Play action above the hero art", async () => {
  build();
  const html = await readFile("dist/index.html", "utf8");
  assert.match(html, /<h1>Deal cards\. Build houses\. Take the whole street\.<\/h1>/);
  assert.match(html, /data-play-placement="hero"/);
  assert.match(html, /href="#how-it-plays"/);
  assert.match(html, /Free to play/);
  assert.match(html, /Optional rewarded ads/);
  assert.match(html, /Built for short sessions/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.indexOf("data-play-placement=\"hero\"") < html.indexOf("class=\"hero-art\""));
});

test("homepage tells the complete conversion story in order", async () => {
  build();
  const html = await readFile("dist/index.html", "utf8");
  const headings = [
    "One hand can change the whole block.",
    "This is the game—not a mockup.",
    "Nice street. Shame if a rival noticed.",
    "There’s always another way to win.",
    "Build with a City behind you.",
    "Know exactly what every card and currency does.",
    "Latest news",
    "Questions before your first deal?",
    "Your first empty lot is waiting.",
  ];
  let previous = -1;
  for (const heading of headings) {
    const index = html.indexOf(heading);
    assert.ok(index > previous, `${heading} is missing or out of order`);
    previous = index;
  }
  assert.match(html, /href="\/news\/my-block-is-a-real-street\/"/);
});

test("homepage uses authentic optimized art without stale launch claims or frame requests", async () => {
  build();
  const html = await readFile("dist/index.html", "utf8");
  assert.match(html, /\/art\/optimized\/hero-640\.avif/);
  assert.match(html, /\/art\/optimized\/card-table-360\.avif/);
  assert.match(html, /\/art\/optimized\/rival-marv\.webp/);
  assert.doesNotMatch(html, /coming soon|no ads|test purchases are free/i);
  assert.doesNotMatch(html, /frames\/(?:desktop\/)?frame_/i);
  assert.match(html, /<script src="\/js\/main\.js" defer><\/script>/);
});

test("homepage adds a playful generated logo and structured hero badges", async () => {
  build();
  const html = await readFile("dist/index.html", "utf8");
  assert.match(html, /class="proof-item"/);
  assert.equal((html.match(/class="proof-item"/g) || []).length, 3);
  assert.match(html, /class="proof-icon" aria-hidden="true"/);
  assert.match(html, /class="wordmark-logo"/);
  assert.match(html, /\/art\/optimized\/site-logo-360\.avif/);
});

test("homepage structured data describes a free Android game without ratings", async () => {
  build();
  const html = await readFile("dist/index.html", "utf8");
  assert.match(html, /"@type":\["VideoGame","MobileApplication"\]/);
  assert.match(html, /"operatingSystem":"Android"/);
  assert.match(html, /"price":"0"/);
  assert.doesNotMatch(html, /aggregateRating/);
});

test("generated homepage has no trailing whitespace", async () => {
  build();
  const html = await readFile("dist/index.html", "utf8");
  assert.doesNotMatch(html, /[ \t]+$/m);
});
