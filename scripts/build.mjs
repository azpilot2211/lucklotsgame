import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadContent, validateContent } from "./lib/content.mjs";
import { escapeHtml } from "./lib/html.mjs";

const rootDir = process.cwd();
const content = validateContent(await loadContent(rootDir));
const outputDir = path.join(rootDir, "reports", "build-smoke");
const outputPath = path.join(outputDir, "index.html");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(content.home.title)}</title>
  <meta name="description" content="${escapeHtml(content.home.description)}">
</head>
<body>
  <h1>${escapeHtml(content.site.name)}</h1>
  <a href="${escapeHtml(content.site.playUrl)}">Install on Google Play</a>
</body>
</html>
`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, html, "utf8");
