import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { parseRuleSections } from "../scripts/lib/content.mjs";

const expectedTitles = [
  "Goal and core loop",
  "Your three currencies (and navigation)",
  "Tickets, deals, and refills",
  "Cards and immediate rewards",
  "My Lot and construction",
  "Rent, repair, and protection",
  "Rivals, steals, revenge, and jail",
  "Chips, Bonus Wheel, and Moving Day",
  "My City and Team",
  "Goals, daily play, and events",
  "Shop, ads, and recovery",
  "Profile, saves, and safety",
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

test("strict parser returns the 12 authoritative numbered sections", async () => {
  const sections = await sourceSections();
  assert.equal(sections.length, 12);
  assert.deepEqual(sections.map(({ number }) => number), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.deepEqual(sections.map(({ title }) => title), expectedTitles);
  assert.ok(sections.every(({ paragraphs, listItems }) => paragraphs.length > 0 && listItems.length > 0));
});

test("guide mapping includes every source section exactly once", async () => {
  const guides = JSON.parse(await readFile("content/guides.json", "utf8"));
  const mapped = guides.flatMap(({ sourceSections }) => sourceSections).sort((a, b) => a - b);
  assert.deepEqual(mapped, Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(new Set(guides.map(({ slug }) => slug)).size, 6);
});

test("generated guide library preserves critical gameplay facts and removes only the stale launch claim", async () => {
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
  const html = (await Promise.all(pages.map((page) => readFile(page, "utf8")))).join("\n");
  assert.match(html, /Standard, Big, and Mega deals cost 1, 3, and 9 Tickets/);
  assert.match(html, /You can hold up to 30 Chips/);
  assert.match(html, /A direct Small Attack costs 10,000 Tokens/);
  assert.match(html, /Rewarded ads are optional/);
  assert.match(html, /Clearing app data or uninstalling can remove that local copy/);
  assert.match(html, /Cloud sync is conditional/);
  assert.match(html, /Lucky Lots is live\. The Shop displays real prices/);
  assert.doesNotMatch(html, /free until launch|no real money is charged|coming soon|no ads/i);
});

test("each guide page has one h1, breadcrumbs, useful content before its Play CTA, and schema", async () => {
  build();
  for (const slug of ["cards-and-deals", "building-and-rent", "rivals-and-jail", "bonus-games", "cities-and-events", "shop-saves-safety"]) {
    const html = await readFile(`how-to-play/${slug}/index.html`, "utf8");
    assert.equal((html.match(/<h1\b/g) || []).length, 1, slug);
    assert.match(html, /aria-label="Breadcrumb"/, slug);
    assert.match(html, /"@type":"BreadcrumbList"/, slug);
    assert.match(html, /class="guide-hero-art"><picture>.*fetchpriority="high"/s, slug);
    assert.ok(html.indexOf("class=\"guide-sections\"") < html.indexOf("data-play-placement=\"guide"), slug);
  }
});
