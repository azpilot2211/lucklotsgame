import { access, readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const publicRoot = path.resolve(rootDir, "dist");
const origin = "https://luckylotsgame.com";
const errors = [];

function report(file, message) {
  errors.push(`${file}: ${message}`);
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function attributes(source) {
  return new Map([...source.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

function publicFileFromUrl(urlValue, basePath = "/") {
  const url = new URL(urlValue, new URL(basePath, `${origin}/`));
  if (url.origin !== origin) return null;
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
}

function safePublicPath(relativePath) {
  const resolved = path.resolve(publicRoot, relativePath);
  const prefix = `${publicRoot}${path.sep}`;
  return resolved.startsWith(prefix) ? resolved : null;
}

async function fileExists(relativePath) {
  const resolved = safePublicPath(relativePath);
  if (!resolved) return false;
  try {
    await access(resolved);
    return true;
  } catch {
    return false;
  }
}

const sitemap = await readFile(path.join(publicRoot, "sitemap.xml"), "utf8");
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (locations.length === 0) report("sitemap.xml", "contains no URLs");
if (new Set(locations).size !== locations.length) report("sitemap.xml", "contains duplicate URLs");

const pageFiles = locations.map((location) => publicFileFromUrl(location));
const pageCache = new Map();
for (const file of pageFiles) {
  if (!file || !(await fileExists(file))) {
    report("sitemap.xml", `URL does not resolve to a generated page: ${file || "invalid URL"}`);
    continue;
  }
  pageCache.set(file, await readFile(path.join(publicRoot, file), "utf8"));
}

for (const [file, html] of pageCache) {
  const canonicalMatches = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
  const checks = [
    [/<title>[^<]+<\/title>/g, "exactly one nonempty title"],
    [/<meta name="description" content="[^"]+">/g, "exactly one nonempty meta description"],
    [/<link rel="canonical" href="[^"]+">/g, "exactly one canonical"],
    [/<h1\b/g, "exactly one h1"],
    [/<main\b/g, "exactly one main landmark"],
  ];
  for (const [pattern, message] of checks) {
    if (count(html, pattern) !== 1) report(file, `must contain ${message}`);
  }
  if (!/<html lang="en">/.test(html)) report(file, "must declare lang=en");

  const canonical = canonicalMatches[0]?.[1];
  if (canonical && publicFileFromUrl(canonical) !== file) {
    report(file, `canonical does not match output path: ${canonical}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((value) => value === id).length > 1) report(file, `duplicate id: ${id}`);
  }

  const basePath = canonical ? new URL(canonical).pathname : "/";
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:mailto:|tel:)/.test(href)) continue;
    if (/^javascript:/i.test(href)) {
      report(file, `javascript href is not allowed: ${href}`);
      continue;
    }
    const target = publicFileFromUrl(href, basePath);
    if (!target) continue;
    if (!(await fileExists(target))) {
      report(file, `unresolved internal link: ${href}`);
      continue;
    }
    const fragment = new URL(href, new URL(basePath, `${origin}/`)).hash.slice(1);
    if (fragment) {
      const targetHtml = pageCache.get(target) || await readFile(path.join(publicRoot, target), "utf8");
      if (!targetHtml.includes(`id="${fragment}"`)) report(file, `unresolved fragment: ${href}`);
    }
  }

  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    const attrs = attributes(match[1]);
    for (const name of ["src", "alt", "width", "height"]) {
      if (!attrs.has(name)) report(file, `image missing ${name}: ${match[0].slice(0, 120)}`);
    }
    const src = attrs.get("src");
    const width = Number(attrs.get("width"));
    const height = Number(attrs.get("height"));
    if (!(width > 0) || !(height > 0)) report(file, `image has invalid dimensions: ${src || "unknown"}`);
    const target = src ? publicFileFromUrl(src, basePath) : null;
    if (target && !(await fileExists(target))) report(file, `missing image file: ${src}`);
  }

  for (const match of html.matchAll(/<source\b([^>]+)>/g)) {
    const srcset = attributes(match[1]).get("srcset") || "";
    for (const candidate of srcset.split(",")) {
      const source = candidate.trim().split(/\s+/)[0];
      if (!source) continue;
      const target = publicFileFromUrl(source, basePath);
      if (target && !(await fileExists(target))) report(file, `missing responsive image: ${source}`);
    }
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      const schema = JSON.parse(match[1]);
      if (/aggregateRating|reviewRating/.test(JSON.stringify(schema))) report(file, "unverified rating schema is prohibited");
    } catch (error) {
      report(file, `malformed JSON-LD: ${error.message}`);
    }
  }

  if (/coming soon|free until launch|no real money is charged|no real-money purchases|test purchases/i.test(html)) {
    report(file, "contains a prohibited stale launch or purchase claim");
  }
  if (/(?:^|["'(])\/?frames\//i.test(html)) report(file, "references obsolete frame assets");
}

for (const asset of ["css/site.css", "js/main.js"]) {
  const contents = await readFile(path.join(publicRoot, asset), "utf8");
  if (/(?:^|["'(])\/?frames\//i.test(contents)) report(asset, "references obsolete frame assets");
  if (/requestAnimationFrame|addEventListener\(["']scroll/i.test(contents)) report(asset, "contains prohibited scroll animation work");
}

const robots = await readFile(path.join(publicRoot, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) report("robots.txt", "does not reference the canonical sitemap");

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log("site validation: passed");
}
