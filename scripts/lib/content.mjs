import { readFile } from "node:fs/promises";
import path from "node:path";

async function readJson(rootDir, relativePath) {
  const contents = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(contents);
}

export async function loadContent(rootDir) {
  const [site, home] = await Promise.all([
    readJson(rootDir, "content/site.json"),
    readJson(rootDir, "content/home.json"),
  ]);
  return { site, home };
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
  return content;
}
