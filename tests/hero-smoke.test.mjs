import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const js = readFileSync("js/main.js", "utf8");

// hero declares both frame sets
assert.match(html, /data-desktop-dir="frames\/desktop\/" data-desktop-count="150"/, "hero declares the 150-frame desktop movie");
assert.match(html, /data-mobile-dir="frames\/" data-mobile-count="120"/, "hero declares the 120-frame mobile promo");
assert.match(html, /<link rel="preload" as="image" href="frames\/desktop\/frame_001\.jpg" media="\(min-width: 821px\)">/, "desktop first frame preloads on wide screens");
assert.match(html, /<link rel="preload" as="image" href="frames\/frame_001\.jpg" media="\(max-width: 820px\)">/, "mobile first frame preloads on small screens");
assert.match(html, /<canvas id="scrub-canvas" aria-label="Lucky Lots animated neighborhood movie"/, "hero canvas has an accessible label");

// engine switches sets at the breakpoint and scrubs by scroll progress
assert.match(js, /matchMedia\("\(max-width: 820px\)"\)/, "engine switches frame sets at 820px");
assert.match(js, /function drawCurrent/, "engine renders frames through drawCurrent");
assert.match(js, /requestAnimationFrame\(loop\)/, "rAF polling drives the scrub");

// the frame files actually exist on disk
assert.ok(existsSync("frames/desktop/frame_001.jpg") && existsSync("frames/desktop/frame_150.jpg"), "desktop frames 1..150 present");
assert.ok(existsSync("frames/frame_001.jpg") && existsSync("frames/frame_120.jpg"), "mobile frames 1..120 present");

console.log("hero smoke: all assertions passed");
