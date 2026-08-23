import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { escapeHtml, attrs, jsonLd } from "../scripts/lib/html.mjs";
import { validateContent } from "../scripts/lib/content.mjs";

test("escapeHtml escapes text and attribute delimiters", () => {
  assert.equal(
    escapeHtml(`Lucky & <Lots> "City"`),
    "Lucky &amp; &lt;Lots&gt; &quot;City&quot;",
  );
});

test("attrs omits nullish and false values and escapes the rest", () => {
  assert.equal(
    attrs({ class: "cta", hidden: false, title: "Build & raid", empty: null }),
    ` class="cta" title="Build &amp; raid"`,
  );
});

test("jsonLd escapes a closing script sequence inside data", () => {
  const output = jsonLd({ name: "Lucky Lots", text: "</script>" });
  assert.match(output, /^<script type="application\/ld\+json">/);
  assert.equal((output.match(/<\/script>/gi) || []).length, 1);
  assert.match(output, /\\u003c\/script>/);
});

test("validateContent names a missing required field", () => {
  assert.throws(
    () => validateContent({ site: {}, home: {} }, process.cwd()),
    /site\.name/,
  );
});

test("build writes a deterministic public homepage", async () => {
  const first = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(first.status, 0, first.stderr);
  const firstHtml = await readFile("index.html", "utf8");

  const second = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(second.status, 0, second.stderr);
  const secondHtml = await readFile("index.html", "utf8");

  assert.equal(secondHtml, firstHtml);
  assert.match(firstHtml, /<!doctype html>/);
  assert.match(firstHtml, /Lucky Lots: Card City Builder/);
  assert.match(firstHtml, /https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.luckylots\.cardcity/);
});
