import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { parseRuleSections } from "../scripts/lib/content.mjs";

const expectedTitles = [
  "Goal and core loop",
  "Navigation and resources",
  "Tickets, deals, and refills",
  "Cards and immediate rewards",
  "My Lot and construction",
  "Rent, repair, and protection",
  "Rivals, steals, revenge, and jail",
  "Chips, Bonus Hub, and Moving Day",
  "The Claw",
  "My City and Team",
  "The Team Race",
  "Goals and daily play",
  "Shop, ads, and recovery",
  "Accounts, online economy, saves, and guest play",
];

async function sourceSections() {
  return parseRuleSections(await readFile("content/how-to-play/source.txt", "utf8"));
}

function build() {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

test("strict parser returns the 14 authoritative numbered sections", async () => {
  const sections = await sourceSections();
  assert.equal(sections.length, 14);
  assert.deepEqual(sections.map(({ number }) => number), Array.from({ length: 14 }, (_, index) => index + 1));
  assert.deepEqual(sections.map(({ title }) => title), expectedTitles);
  assert.ok(sections.every(({ paragraphs, listItems }) => paragraphs.length > 0 && listItems.length > 0));
});

test("guide mapping includes every source section exactly once", async () => {
  const guides = JSON.parse(await readFile("content/guides.json", "utf8"));
  const mapped = guides.flatMap(({ sourceSections }) => sourceSections).sort((a, b) => a - b);
  assert.deepEqual(mapped, Array.from({ length: 14 }, (_, index) => index + 1));
  assert.equal(new Set(guides.map(({ slug }) => slug)).size, 6);
});

test("generated guide library preserves critical gameplay facts and matches the current in-game guide", async () => {
  build();
  const pages = [
    "how-to-play/index.html",
    "how-to-play/cards-and-deals/index.html",
    "how-to-play/building-and-rent/index.html",
    "how-to-play/rivals-and-jail/index.html",
    "how-to-play/bonus-games/index.html",
    "how-to-play/cities-and-events/index.html",
    "how-to-play/shop-saves-safety/index.html",
  ];
  const html = (await Promise.all(pages.map((page) => readFile(`dist/${page}`, "utf8")))).join("\n");
  assert.match(html, /Standard, Big, and Mega deals cost 1, 3, and 9 Tickets/);
  assert.match(html, /Chips cap at 25/);
  assert.match(html, /a Small Attack costs about a quarter of what one of your houses costs/);
  assert.match(html, /The Tickets and Tokens sections each offer a rewarded ad/);
  assert.match(html, /Clearing app data or uninstalling can remove guest progress/);
  assert.match(html, /Google-linked accounts use a protected online Token balance/);
  assert.doesNotMatch(html, /free until launch|no real money is charged|coming soon|no ads/i);
});

test("each guide page has one h1, breadcrumbs, useful content before its Play CTA, and schema", async () => {
  build();
  for (const slug of ["cards-and-deals", "building-and-rent", "rivals-and-jail", "bonus-games", "cities-and-events", "shop-saves-safety"]) {
    const html = await readFile(`dist/how-to-play/${slug}/index.html`, "utf8");
    assert.equal((html.match(/<h1\b/g) || []).length, 1, slug);
    assert.match(html, /aria-label="Breadcrumb"/, slug);
    assert.match(html, /"@type":"BreadcrumbList"/, slug);
    assert.match(html, /class="guide-hero-art"><picture>.*fetchpriority="high"/s, slug);
    assert.ok(html.indexOf("class=\"guide-sections\"") < html.indexOf("data-play-placement=\"guide"), slug);
  }
});

test("How to Play hub advertises a desktop image slot no wider than its CSS cap", async () => {
  build();
  const html = await readFile("dist/how-to-play/index.html", "utf8");
  assert.match(html, /class="guide-hero-art"><picture><source sizes="\(min-width: 900px\) 448px, calc\(100vw - 2rem\)"/);
});
