import { readFile } from "node:fs/promises";
import path from "node:path";

async function readJson(rootDir, relativePath) {
  const contents = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(contents);
}

export async function loadContent(rootDir) {
  const [site, home, assets, guides, ruleSource, newsArticle, support, legal] = await Promise.all([
    readJson(rootDir, "content/site.json"),
    readJson(rootDir, "content/home.json"),
    readJson(rootDir, "content/assets.json"),
    readJson(rootDir, "content/guides.json"),
    readFile(path.join(rootDir, "content/how-to-play/source.txt"), "utf8"),
    readJson(rootDir, "content/news/2026-08-21-my-block-update.json"),
    readJson(rootDir, "content/support.json"),
    readJson(rootDir, "content/legal.json"),
  ]);
  return {
    site,
    home,
    assets,
    guides,
    ruleSections: parseRuleSections(ruleSource),
    news: [newsArticle].sort((left, right) => right.published.localeCompare(left.published)),
    support,
    legal,
  };
}

const STALE_PURCHASE_SENTENCE = "Test purchases use the displayed price but are free until launch; no real money is charged.";
const LIVE_PURCHASE_SENTENCE = "Lucky Lots is live. The Shop displays real prices for available in-app purchases; review the item and displayed cost before confirming a purchase.";
const GROUP_LABELS = new Set(["Basics", "Building", "Rivals", "More"]);

function transformApprovedStaleSentence(value) {
  return value.replace(STALE_PURCHASE_SENTENCE, LIVE_PURCHASE_SENTENCE);
}

export function parseRuleSections(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  const rawSections = [];
  let current = null;
  let currentGroup = "Basics";

  for (const line of lines) {
    const value = line.trim();
    const heading = value.match(/^(\d+)\.\s+(.+)$/);
    if (heading) {
      if (current) rawSections.push(current);
      current = {
        number: Number(heading[1]),
        title: heading[2],
        group: currentGroup,
        contentLines: [],
      };
      continue;
    }
    if (GROUP_LABELS.has(value)) {
      currentGroup = value;
      continue;
    }
    if (current) current.contentLines.push(line.replace(/\s+$/g, ""));
  }
  if (current) rawSections.push(current);

  const numbers = rawSections.map(({ number }) => number);
  const expected = Array.from({ length: 14 }, (_, index) => index + 1);
  if (numbers.length !== 14 || numbers.some((number, index) => number !== expected[index])) {
    throw new Error(`How to Play must contain numbered sections 1 through 14 exactly once; found ${numbers.join(", ")}`);
  }

  return rawSections.map(({ number, title, group, contentLines }) => {
    const blocks = contentLines.join("\n").trim().split(/\n\s*\n/).filter(Boolean);
    const paragraphs = [];
    const listItems = [];
    for (const block of blocks) {
      const blockLines = block.split("\n").map((line) => transformApprovedStaleSentence(line.trim())).filter(Boolean);
      if (blockLines.length === 1) paragraphs.push(blockLines[0]);
      else listItems.push(...blockLines);
    }
    return { number, title, group, paragraphs, listItems };
  });
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a nonempty string`);
  }
}

export function validateContent(content) {
  requireText(content?.site?.name, "site.name");
  requireText(content?.site?.origin, "site.origin");
  if (!content.site.origin.startsWith("https://")) {
    throw new Error("site.origin must use HTTPS");
  }
  if (content.site.playUrl !== "https://play.google.com/store/apps/details?id=com.luckylots.cardcity") {
    throw new Error("site.playUrl must use the verified Lucky Lots listing");
  }
  requireText(content?.home?.headline, "home.headline");
  requireText(content?.home?.description, "home.description");
  if (!Array.isArray(content.guides) || content.guides.length !== 6) {
    throw new Error("guides must contain six topic mappings");
  }
  const mappedSections = content.guides.flatMap((guide) => guide.sourceSections).sort((a, b) => a - b);
  const expectedSections = Array.from({ length: 14 }, (_, index) => index + 1);
  if (JSON.stringify(mappedSections) !== JSON.stringify(expectedSections)) {
    throw new Error("guides must map every How to Play section exactly once");
  }
  for (const [index, article] of content.news.entries()) {
    requireText(article.title, `news[${index}].title`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(article.published) || !/^\d{4}-\d{2}-\d{2}$/.test(article.modified)) {
      throw new Error(`news[${index}] dates must use YYYY-MM-DD`);
    }
  }
  requireText(content?.support?.description, "support.description");
  requireText(content?.legal?.privacy?.title, "legal.privacy.title");
  requireText(content?.legal?.terms?.title, "legal.terms.title");
  return content;
}
