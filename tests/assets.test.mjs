import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";

async function loadManifest() {
  return JSON.parse(await readFile("content/assets.json", "utf8"));
}

test("asset manifest uses existing sources and safe optimized outputs", async () => {
  const manifest = await loadManifest();
  assert.ok(Object.keys(manifest).length >= 15);
  for (const [key, asset] of Object.entries(manifest)) {
    assert.doesNotMatch(asset.source, /^frames\//, `${key} must not use cinematic frames`);
    await access(asset.source);
    assert.ok(asset.width > 0 && asset.height > 0, `${key} needs dimensions`);
    assert.ok(asset.outputs.length > 0, `${key} needs outputs`);
    for (const output of asset.outputs) {
      assert.match(output.path, /^art\/optimized\//, `${key} output must stay optimized`);
      assert.ok(output.width > 0, `${key} output needs a width`);
      assert.match(output.format, /^(avif|webp)$/);
    }
  }
});

test("optimized image outputs exist and stay within launch candidate budgets", async () => {
  const manifest = await loadManifest();
  for (const [key, asset] of Object.entries(manifest)) {
    for (const output of asset.outputs) {
      const file = await stat(output.path);
      assert.ok(file.size > 0, `${output.path} is empty`);
      if (key === "hero" && output.width <= 640) {
        assert.ok(file.size < 150 * 1024, `${output.path} exceeds 150 KB`);
      }
      if (key === "logo") {
        assert.ok(file.size < 80 * 1024, `${output.path} exceeds 80 KB`);
      }
    }
  }
});

test("stylesheet includes accessibility and motion safeguards", async () => {
  const css = await readFile("src/css/site.css", "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.doesNotMatch(css, /background-attachment:\s*fixed/);
  assert.doesNotMatch(css, /animation-timeline/);
});
