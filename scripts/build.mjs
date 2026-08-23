import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadContent, validateContent } from "./lib/content.mjs";
import { createPages } from "./lib/pages.mjs";

const rootDir = process.cwd();
const content = validateContent(await loadContent(rootDir));
const outputDir = path.join(rootDir, "reports", "build-smoke");

for (const page of createPages(content)) {
  const outputPath = path.resolve(outputDir, page.outputPath);
  const safePrefix = `${path.resolve(outputDir)}${path.sep}`;
  if (!outputPath.startsWith(safePrefix)) {
    throw new Error(`Output path escapes build root: ${page.outputPath}`);
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, page.html, "utf8");
}
