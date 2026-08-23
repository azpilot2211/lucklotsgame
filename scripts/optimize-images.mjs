import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const outputRoot = path.resolve(rootDir, "art", "optimized");
const manifest = JSON.parse(await readFile(path.join(rootDir, "content", "assets.json"), "utf8"));

for (const [key, asset] of Object.entries(manifest)) {
  const sourcePath = path.resolve(rootDir, asset.source);
  for (const output of asset.outputs) {
    const outputPath = path.resolve(rootDir, output.path);
    const safePrefix = `${outputRoot}${path.sep}`;
    if (!outputPath.startsWith(safePrefix)) {
      throw new Error(`${key} output escapes art/optimized: ${output.path}`);
    }
    await mkdir(path.dirname(outputPath), { recursive: true });
    let pipeline = sharp(sourcePath).resize({
      width: output.width,
      withoutEnlargement: true,
      fit: "inside",
    });
    pipeline = output.format === "avif"
      ? pipeline.avif({ quality: 58, effort: 5 })
      : pipeline.webp({ quality: 76, effort: 5 });
    await pipeline.toFile(outputPath);
  }
}

console.log(`optimized ${Object.keys(manifest).length} source assets`);
