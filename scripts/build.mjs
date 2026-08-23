import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadContent, validateContent } from "./lib/content.mjs";
import { createPages } from "./lib/pages.mjs";

const rootDir = process.cwd();
const content = validateContent(await loadContent(rootDir));
const outputDir = path.resolve(rootDir, "dist");
if (path.dirname(outputDir) !== path.resolve(rootDir) || path.basename(outputDir) !== "dist") {
  throw new Error(`Refusing to clean unexpected output directory: ${outputDir}`);
}
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
const pages = createPages(content);

for (const page of pages) {
  const outputPath = path.resolve(outputDir, page.outputPath);
  const safePrefix = `${path.resolve(outputDir)}${path.sep}`;
  if (!outputPath.startsWith(safePrefix)) {
    throw new Error(`Output path escapes build root: ${page.outputPath}`);
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, page.html, "utf8");
}

await mkdir(path.join(outputDir, "css"), { recursive: true });
await copyFile(
  path.join(rootDir, "src", "css", "site.css"),
  path.join(outputDir, "css", "site.css"),
);
await mkdir(path.join(outputDir, "js"), { recursive: true });
await copyFile(
  path.join(rootDir, "src", "js", "main.js"),
  path.join(outputDir, "js", "main.js"),
);

async function copyPublicFile(relativePath) {
  const source = path.resolve(rootDir, relativePath);
  const destination = path.resolve(outputDir, relativePath);
  const sourcePrefix = `${path.resolve(rootDir)}${path.sep}`;
  const destinationPrefix = `${outputDir}${path.sep}`;
  if (!source.startsWith(sourcePrefix) || !destination.startsWith(destinationPrefix)) {
    throw new Error(`Public file escapes its root: ${relativePath}`);
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

const publicAssets = new Set([
  "app-ads.txt",
  "art/icon-192.png",
  "art/feature.webp",
  ...Object.values(content.assets).flatMap((asset) => asset.outputs.map((output) => output.path)),
]);
for (const asset of publicAssets) await copyPublicFile(asset);

const robots = `User-agent: *\nAllow: /\nSitemap: ${content.site.origin}/sitemap.xml\n`;
await writeFile(path.join(outputDir, "robots.txt"), robots, "utf8");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const sitemapEntries = pages
  .filter((page) => page.indexable !== false)
  .sort((left, right) => left.canonicalPath.localeCompare(right.canonicalPath))
  .map((page) => `  <url>\n    <loc>${escapeXml(new URL(page.canonicalPath, `${content.site.origin}/`).href)}</loc>\n    <lastmod>${escapeXml(page.lastModified)}</lastmod>\n  </url>`)
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
await writeFile(path.join(outputDir, "sitemap.xml"), sitemap, "utf8");
