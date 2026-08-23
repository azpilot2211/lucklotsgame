# Lucky Lots Content Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scroll-gated Lucky Lots landing page with a fast, accessible, content-driven static website that sends qualified visitors to Google Play and publishes authoritative game guides and news.

**Architecture:** A dependency-light Node build composes structured content through shared template functions into crawlable static HTML at the repository root. The browser receives semantic HTML, one cacheable stylesheet, and a very small progressive-enhancement script; it does not receive a framework or fetch page content at runtime. Existing original game artwork is reused through responsive, explicitly sized images, while the 120/150-frame cinematic stays outside the critical path.

**Tech Stack:** Node.js 24, ES modules, Node’s built-in test runner and assertions, semantic HTML5, CSS Grid/Flexbox/custom properties, vanilla JavaScript, a pinned `sharp` development dependency for deterministic image derivatives, Vercel static hosting, Lighthouse CLI, and axe-core/Playwright for accessibility checks.

**Spec:** `docs/superpowers/specs/2026-08-22-lucky-lots-content-site-design.md`

## Global Constraints

- The public product name is **Lucky Lots: Card City Builder** and the verified install URL is `https://play.google.com/store/apps/details?id=com.luckylots.cardcity`.
- The supplied in-game How to Play text is authoritative when it conflicts with older marketing or Play listing copy.
- Remove every public claim that the game is “coming soon,” purchases are test-only, or the game has no ads.
- Public positioning may state: free to play, optional rewarded ads, in-app purchases, Android availability, and short-session play.
- Never fabricate reviews, ratings, player counts, awards, testimonials, or structured rating data.
- Preserve `/privacy.html` and `/terms.html` as published URLs.
- Core content and Google Play links must work without JavaScript.
- No runtime framework, hydration, client-side content fetching, autoplay audio, scroll hijacking, or JavaScript parallax loop.
- Target Lighthouse lab scores of at least 95 in Performance, Accessibility, Best Practices, and SEO under the recorded test configuration.
- Engineer toward field thresholds of LCP at or below 2.5 seconds, INP below 200 milliseconds, and CLS below 0.1 at the 75th percentile.
- Initial compressed HTML, CSS, and JavaScript combined must remain at or below 100 KB; initial JavaScript at or below 10 KB; initial images at 390 CSS pixels at or below 250 KB; and first-party requests at or below 10.
- Meet WCAG 2.2 AA for implemented interfaces, including visible focus, keyboard access, 44 × 44 CSS pixel touch targets, reduced motion, reflow, and sufficient contrast.
- Existing original logo, screenshots, characters, cards, street scene, marketing art, and cinematic stills are the first-choice visual assets.
- The 120 mobile and 150 desktop cinematic frames must not be requested during ordinary page load.
- Content changes must generate deterministic, crawlable static HTML.
- Commit after each task only after that task’s tests and diff checks pass.

---

## File and interface map

### Build and validation

- `package.json` — scripts and development dependencies only; no runtime dependency is shipped.
- `scripts/build.mjs` — orchestrates page rendering, asset copying, sitemap generation, and stale-output cleanup through explicit output paths.
- `scripts/lib/html.mjs` — escaping and safe rendering helpers.
- `scripts/lib/content.mjs` — loads and validates site, guide, and news data.
- `scripts/lib/pages.mjs` — maps content records to final page descriptors.
- `scripts/validate-site.mjs` — validates generated HTML metadata, internal links, referenced local assets, structured data, and prohibited stale claims.
- `scripts/optimize-images.mjs` — creates only the responsive derivatives named in the asset manifest.

### Content

- `content/site.json` — global brand, production URL, Play URL, navigation, and footer data.
- `content/home.json` — homepage headings, sections, FAQ, and CTA copy.
- `content/how-to-play/source.txt` — repository copy of the user-supplied authoritative rules.
- `content/guides.json` — guide page metadata and an exact mapping of authoritative sections to page slugs.
- `content/news/2026-08-21-my-block-update.json` — first verified update article.
- `content/support.json` — support questions, save/ads/purchase clarifications, and contact address.

### Templates

- `src/templates/layout.mjs` — document shell, metadata, header, main landmark, structured data, and footer.
- `src/templates/components.mjs` — pure reusable component renderers.
- `src/templates/home.mjs` — homepage composition only.
- `src/templates/guide.mjs` — guide hub and detail layout.
- `src/templates/news.mjs` — news index and article layout.
- `src/templates/support.mjs` — support page layout.
- `src/templates/legal.mjs` — existing legal body wrapped in the shared shell without changing legal meaning.

### Browser assets and output

- `src/css/site.css` — the complete token, base, component, responsive, accessibility, and motion stylesheet.
- `src/js/main.js` — mobile navigation, FAQ enhancement, reveal enhancement, and outbound click measurement.
- `art/optimized/` — generated AVIF/WebP derivatives referenced by the templates.
- Generated HTML: `index.html`, `how-to-play/**/index.html`, `news/**/index.html`, `support/index.html`, `privacy.html`, and `terms.html`.
- Generated discovery files: `robots.txt` and `sitemap.xml`.

### Stable interfaces

```js
// scripts/lib/html.mjs
export function escapeHtml(value) {}
export function attrs(record) {}
export function jsonLd(value) {}

// scripts/lib/content.mjs
export async function loadContent(rootDir) {}
export function validateContent(content, rootDir) {}

// scripts/lib/pages.mjs
export function createPages(content) {}
// returns Array<{ outputPath, canonicalPath, html, lastModified }>

// src/templates/layout.mjs
export function renderLayout({ site, page, body, structuredData }) {}

// src/templates/components.mjs
export function renderPlayCta({ site, label, placement, className = "" }) {}
export function renderPicture(asset, alt, options = {}) {}
export function renderBreadcrumbs(items) {}
export function renderFaq(items) {}
export function renderArticleCard(article) {}
```

---

### Task 1: Establish the deterministic static build and baseline tests

**Files:**
- Create: `package.json`
- Create: `scripts/lib/html.mjs`
- Create: `scripts/lib/content.mjs`
- Create: `scripts/build.mjs`
- Create: `tests/build.test.mjs`
- Modify: `.gitignore`
- Preserve for later replacement: `index.html`, `css/style.css`, `js/main.js`

**Interfaces:**
- Consumes: repository root and JSON/text content paths.
- Produces: `escapeHtml(value)`, `attrs(record)`, `jsonLd(value)`, `loadContent(rootDir)`, and a `npm run build` command that generates a non-public smoke page under `reports/build-smoke/` without replacing the live homepage.

- [ ] **Step 1: Record the current baseline failure and clean Git state**

Run:

```powershell
git status --short --branch
node tests/hero-smoke.test.mjs
```

Expected: Git is clean except for plan/spec commits; the legacy smoke test fails because it expects `css/style.css?v=9` while the page uses `v=10`. Save the exact result in the implementation commentary; do not “fix” that obsolete assertion because the test will be replaced.

- [ ] **Step 2: Write failing build-helper tests**

Create `tests/build.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, attrs, jsonLd } from "../scripts/lib/html.mjs";
import { validateContent } from "../scripts/lib/content.mjs";

test("escapeHtml escapes text and attribute delimiters", () => {
  assert.equal(escapeHtml(`Lucky & <Lots> "City"`), "Lucky &amp; &lt;Lots&gt; &quot;City&quot;");
});

test("attrs omits nullish and false values and escapes the rest", () => {
  assert.equal(
    attrs({ class: "cta", hidden: false, title: `Build & raid`, empty: null }),
    ` class="cta" title="Build &amp; raid"`,
  );
});

test("jsonLd prevents a closing script sequence", () => {
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
```

- [ ] **Step 3: Run the helper tests and verify they fail**

Run: `node --test tests/build.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/lib/html.mjs` or `scripts/lib/content.mjs`.

- [ ] **Step 4: Implement the minimal HTML helpers**

Create `scripts/lib/html.mjs`:

```js
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

export function attrs(record) {
  return Object.entries(record)
    .filter(([, value]) => value !== false && value != null)
    .map(([name, value]) => ` ${name}="${escapeHtml(value === true ? "" : value)}"`)
    .join("");
}

export function jsonLd(value) {
  const serialized = JSON.stringify(value).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${serialized}</script>`;
}
```

- [ ] **Step 5: Add package scripts and a minimal content loader/build entrypoint**

Create `package.json`:

```json
{
  "name": "luckylotsgame-site",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "node --test tests/*.test.mjs",
    "validate": "node scripts/validate-site.mjs",
    "check": "npm run build && npm test && npm run validate"
  }
}
```

Create `scripts/lib/content.mjs` with JSON loading through `fs/promises.readFile`, returning `{ site, home }` from `content/site.json` and `content/home.json`. Implement `validateContent(content, rootDir)` to require nonempty `site.name`, an HTTPS `site.origin`, the exact verified Play URL, a nonempty homepage headline, and a nonempty homepage description; throw a message naming the invalid field. Create `scripts/build.mjs` to call `loadContent(process.cwd())`, then `validateContent(content, process.cwd())`, render a temporary minimal HTML shell containing the site name, and write `reports/build-smoke/index.html` through `fs/promises.writeFile`. Add `node_modules/`, `.lighthouseci/`, and `reports/` to `.gitignore`; do not ignore generated public HTML.

- [ ] **Step 6: Add minimum content fixtures and test the build**

Create `content/site.json` with production URL, exact Play URL, product name, developer name, and contact email. Create `content/home.json` with the approved hero headline and subhead. Extend `tests/build.test.mjs` to run `npm run build` in a child process and assert the generated `reports/build-smoke/index.html` contains `<!doctype html>`, `Lucky Lots: Card City Builder`, and the exact Play URL.

Run: `npm run build && node --test tests/build.test.mjs`

Expected: PASS and `reports/build-smoke/index.html` has the same SHA-256 across two consecutive builds. The existing public `index.html` remains byte-for-byte unchanged in this task.

- [ ] **Step 7: Review and commit the build foundation**

Run:

```powershell
git diff --check
npm test
git add package.json .gitignore content/site.json content/home.json scripts tests/build.test.mjs
git commit -m "build: add deterministic static site generator"
```

Expected: tests pass and the commit contains no guide, news, or visual implementation.

---

### Task 2: Build the shared document shell, components, and metadata contract

**Files:**
- Create: `src/templates/layout.mjs`
- Create: `src/templates/components.mjs`
- Create: `scripts/lib/pages.mjs`
- Create: `tests/templates.test.mjs`
- Modify: `scripts/build.mjs`
- Modify: `content/site.json`

**Interfaces:**
- Consumes: validated `site`, page descriptor, body HTML, and structured-data objects.
- Produces: `renderLayout`, `renderPlayCta`, `renderPicture`, `renderBreadcrumbs`, `renderFaq`, `renderArticleCard`, and `createPages(content)`.

- [ ] **Step 1: Write failing contract tests for the shared shell**

Create `tests/templates.test.mjs` with a fixture page and assertions for:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { renderLayout } from "../src/templates/layout.mjs";
import { renderPlayCta, renderPicture } from "../src/templates/components.mjs";

const site = {
  name: "Lucky Lots: Card City Builder",
  origin: "https://luckylotsgame.com",
  playUrl: "https://play.google.com/store/apps/details?id=com.luckylots.cardcity",
};

test("layout emits canonical metadata and accessible landmarks", () => {
  const html = renderLayout({
    site,
    page: { title: "How to Play", description: "Learn the real Lucky Lots rules.", path: "/how-to-play/" },
    body: "<h1>How to Play</h1>",
    structuredData: [],
  });
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/luckylotsgame\.com\/how-to-play\/">/);
  assert.match(html, /<a class="skip-link" href="#main">Skip to content<\/a>/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<meta name="description" content="Learn the real Lucky Lots rules\.">/);
});

test("Play CTA records placement and is safe for a new tab", () => {
  const html = renderPlayCta({ site, label: "Install free on Google Play", placement: "hero" });
  assert.match(html, /data-play-placement="hero"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("responsive picture reserves dimensions and prioritizes only an LCP image", () => {
  const html = renderPicture(
    { src: "/art/optimized/hero-960.webp", avif: "/art/optimized/hero-960.avif", width: 960, height: 720 },
    "A Lucky Lots neighborhood",
    { priority: true },
  );
  assert.match(html, /width="960" height="720"/);
  assert.match(html, /fetchpriority="high"/);
  assert.doesNotMatch(html, /loading="lazy"/);
});
```

- [ ] **Step 2: Run the template tests and verify they fail**

Run: `node --test tests/templates.test.mjs`

Expected: FAIL with module-not-found errors for the template files.

- [ ] **Step 3: Implement pure shared component renderers**

Create `src/templates/components.mjs` using `escapeHtml` and `attrs`. `renderPlayCta` must require `site`, `label`, and `placement`; output an anchor with the exact Play URL, visible label, `data-play-placement`, `target="_blank"`, and `rel="noopener noreferrer"`. `renderPicture` must output AVIF/WebP `<source>` elements where supplied, an `<img>` with required width/height/alt, and either `fetchpriority="high"` or `loading="lazy" decoding="async"`, never both. Implement breadcrumb, FAQ, and article-card renderers as semantic `<nav>`, `<details>`, and `<article>` structures.

- [ ] **Step 4: Implement the shared layout**

Create `src/templates/layout.mjs` to output lowercase `<!doctype html>`, language, viewport, unique title, description, absolute canonical, Open Graph tags, icon links, `/css/site.css`, a skip link, header/navigation, `<main id="main">`, footer, structured data from `jsonLd`, and `/js/main.js` with `defer`. The header’s Play CTA uses placement `header`. Mobile navigation markup uses a real button with `aria-controls="site-nav"` and `aria-expanded="false"`; navigation content is visible by default when JavaScript is absent.

- [ ] **Step 5: Implement page descriptor creation and integrate the build**

Create `scripts/lib/pages.mjs` with `createPages(content)` returning page descriptors. Initially return only the homepage descriptor. Modify `scripts/build.mjs` to render each descriptor under `reports/build-smoke/`, create its parent directory, and write the page. Reject output paths outside the chosen output root by resolving each path and checking it begins with that verified root plus the platform separator. The public homepage remains unchanged until Task 4 delivers the complete replacement.

- [ ] **Step 6: Run tests and inspect the generated shell**

Run:

```powershell
npm run build
node --test tests/templates.test.mjs tests/build.test.mjs
Select-String -Path reports/build-smoke/index.html -Pattern '<title>','canonical','skip-link','data-play-placement="header"'
```

Expected: all tests pass and each selected pattern occurs exactly once where appropriate.

- [ ] **Step 7: Commit the shared shell**

Run:

```powershell
git diff --check
git add src/templates scripts/lib/pages.mjs scripts/build.mjs content/site.json tests
git commit -m "feat: add shared accessible site shell"
```

---

### Task 3: Create the responsive visual system and optimized asset manifest

**Files:**
- Create: `src/css/site.css`
- Create: `scripts/optimize-images.mjs`
- Create: `content/assets.json`
- Create: `tests/assets.test.mjs`
- Create: `art/optimized/*`
- Modify: `package.json`
- Modify: `scripts/build.mjs`

**Interfaces:**
- Consumes: existing source art and `content/assets.json` derivative definitions.
- Produces: responsive image records used by `renderPicture` and a single generated `/css/site.css` browser asset.

- [ ] **Step 1: Write failing asset and CSS budget tests**

Create `tests/assets.test.mjs` to load `content/assets.json`, verify every source exists, verify every declared output has positive width/height, and after optimization verify output files exist. Add CSS assertions that `src/css/site.css` contains `:focus-visible`, `@media (prefers-reduced-motion: reduce)`, a minimum `min-height: 44px` control rule, and no `background-attachment: fixed` or `animation-timeline`.

- [ ] **Step 2: Run the asset tests and verify they fail**

Run: `node --test tests/assets.test.mjs`

Expected: FAIL because the asset manifest and new stylesheet do not exist.

- [ ] **Step 3: Define the exact derivative manifest**

Create `content/assets.json` entries for:

- Hero: `art/feature.webp` at 640 and 960 pixels wide in AVIF/WebP.
- Logo: `art/logo.png` at 360 and 560 pixels wide in AVIF/WebP.
- Each 540 × 960 gameplay screenshot at 360 and 540 pixels wide in AVIF/WebP.
- Rival characters at their current intrinsic size in WebP with no upscaling.
- `art/scene/street.webp` at 640, 960, and 1440 pixels wide in AVIF/WebP.
- Cinematic keyframes at 640 and 960 pixels wide for deferred scene dividers only.

Each record must include a stable key, source, outputs, width, height, and intended `sizes` string. Do not include any file from `frames/` or `frames/desktop/`.

- [ ] **Step 4: Implement deterministic image optimization**

Add `sharp` as a pinned development dependency. Implement `scripts/optimize-images.mjs` to read the manifest, use `withoutEnlargement: true`, preserve aspect ratio, encode AVIF at quality 58 and WebP at quality 76, and write only named outputs under `art/optimized/`. Fail if a source is missing or an output escapes `art/optimized/`. Add `"optimize:images": "node scripts/optimize-images.mjs"` to `package.json`.

- [ ] **Step 5: Build the CSS system**

Create `src/css/site.css` with:

- Color, spacing, radius, shadow, type, and maximum-width custom properties.
- Base reset, readable body defaults, responsive fluid type, semantic link/button states, skip link, and focus-visible outline.
- Header/navigation, hero, proof strip, loop grid, screenshot frames, rival cards, guide cards, article cards, FAQ, breadcrumbs, CTA panel, and footer.
- Base one-column layout; two-column cards from 600px; full header and split hero from 900px; content max width at 1200px.
- Minimum 44px interactive dimensions.
- Reveal classes that are visible by default and only become pre-animation hidden after the root receives `.js`.
- Reduced-motion rules that remove transitions, animations, and smooth scrolling.
- No fixed background, scroll timeline, layout-property animation, or continuously running decorative animation.

Modify `scripts/build.mjs` to copy the CSS to `css/site.css` and the JS later to `js/main.js`.

- [ ] **Step 6: Optimize, test, and inspect budgets**

Run:

```powershell
npm install
npm run optimize:images
npm run build
node --test tests/assets.test.mjs
Get-ChildItem art/optimized -File | Sort-Object Length -Descending | Select-Object Name,Length
```

Expected: tests pass; no optimized asset references `frames/`; hero mobile WebP/AVIF candidates are individually below 150 KB; the logo candidates are individually below 80 KB.

- [ ] **Step 7: Commit the design system and derivatives**

Run:

```powershell
git diff --check
git add package.json package-lock.json content/assets.json scripts/optimize-images.mjs scripts/build.mjs src/css/site.css css/site.css tests/assets.test.mjs art/optimized
git commit -m "feat: add responsive visual system and optimized art"
```

---

### Task 4: Build the conversion-focused homepage

**Files:**
- Create: `src/templates/home.mjs`
- Create: `tests/home.test.mjs`
- Modify: `content/home.json`
- Modify: `scripts/lib/pages.mjs`
- Generate: `index.html`

**Interfaces:**
- Consumes: `site`, `home`, asset records, article summaries, guide summaries, and shared component functions.
- Produces: `renderHome({ site, home, assets, guides, articles })` and the final `/index.html`.

- [ ] **Step 1: Write failing homepage conversion tests**

Create `tests/home.test.mjs` to run the build and assert:

```js
assert.match(html, /<h1>Deal cards\. Build houses\. Take the whole street\.<\/h1>/);
assert.match(html, /data-play-placement="hero"/);
assert.match(html, /href="#how-it-plays"/);
assert.match(html, /Free to play/);
assert.match(html, /Optional rewarded ads/);
assert.match(html, /Built for short sessions/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.doesNotMatch(html, /coming soon|no ads|test purchases are free/i);
assert.doesNotMatch(html, /frames\/(?:desktop\/)?frame_/i);
```

Also assert the section heading order: core loop, gameplay proof, rivals, bonus/events, City play, guide preview, latest news, FAQ, and closing CTA.

- [ ] **Step 2: Run the homepage tests and verify they fail**

Run: `node --test tests/home.test.mjs`

Expected: FAIL because `src/templates/home.mjs` and the approved sections are absent.

- [ ] **Step 3: Populate approved homepage content**

Expand `content/home.json` with the exact launch hero, the four loop steps, authentic screenshot captions, rival summaries, bonus/event copy, City copy, six guide preview cards, seven FAQ entries, and closing CTA from the spec. Use durable copy on promotional sections; keep mutable ticket costs, direct-attack prices, percentages, and purchase prices in the guide pages.

- [ ] **Step 4: Implement the homepage template**

Create `renderHome` using semantic sections and shared components. Switch `scripts/build.mjs` from the temporary `reports/build-smoke/` root to the verified repository root only after this complete homepage renderer and its content are ready. Requirements:

- Hero identity and both actions fit in source order before the hero image.
- Use one prioritized hero picture only.
- Core steps use an ordered list.
- Gameplay screenshots and character art use descriptive alt text and explicit dimensions.
- FAQ uses visible native `<details>` content.
- Latest news receives article data; when no verified article exists it omits the section rather than inventing an item.
- Every Play CTA has a distinct placement.

- [ ] **Step 5: Add homepage structured data**

In `scripts/lib/pages.mjs`, attach visible-content-matching JSON-LD:

```js
{
  "@context": "https://schema.org",
  "@type": ["VideoGame", "MobileApplication"],
  "name": "Lucky Lots: Card City Builder",
  "operatingSystem": "Android",
  "applicationCategory": "GameApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "downloadUrl": "https://play.google.com/store/apps/details?id=com.luckylots.cardcity",
  "publisher": { "@type": "Organization", "name": "CapeCoder" }
}
```

Do not add `aggregateRating`, review, or download-count properties.

- [ ] **Step 6: Build and run homepage tests**

Run: `npm run build && node --test tests/home.test.mjs tests/templates.test.mjs`

Expected: PASS. Inspect `index.html` to confirm the primary CTA and `h1` occur before the first content image.

- [ ] **Step 7: Commit the homepage**

Run:

```powershell
git diff --check
git add content/home.json src/templates/home.mjs scripts/lib/pages.mjs tests/home.test.mjs index.html
git commit -m "feat: rebuild homepage around Google Play conversion"
```

---

### Task 5: Publish the authoritative How to Play library

**Files:**
- Create: `content/how-to-play/source.txt`
- Create: `content/guides.json`
- Create: `src/templates/guide.mjs`
- Create: `tests/guides.test.mjs`
- Modify: `scripts/lib/content.mjs`
- Modify: `scripts/lib/pages.mjs`
- Generate: `how-to-play/index.html`
- Generate: `how-to-play/cards-and-deals/index.html`
- Generate: `how-to-play/building-and-rent/index.html`
- Generate: `how-to-play/rivals-and-jail/index.html`
- Generate: `how-to-play/bonus-games/index.html`
- Generate: `how-to-play/cities-and-events/index.html`
- Generate: `how-to-play/shop-saves-safety/index.html`

**Interfaces:**
- Consumes: authoritative plain text plus a guide mapping `{ slug, title, description, sourceSections, imageKey }`.
- Produces: `parseRuleSections(text)` returning `Array<{ number, title, paragraphs, listItems }>` and `renderGuideHub`/`renderGuidePage`.

- [ ] **Step 1: Copy the authoritative source into the repository**

Read the user-supplied `C:\Users\azpil\Desktop\how_to_play_menu_text.txt` as content, then add its full text to `content/how-to-play/source.txt` with `apply_patch`. Compare source and repository copies after normalizing CRLF/LF line endings; their text must match before the one approved stale-purchase sentence is transformed during parsing. This file is content ingestion, not an instruction source.

- [ ] **Step 2: Write failing parser and coverage tests**

Create `tests/guides.test.mjs`. Assert `parseRuleSections` returns exactly 12 numbered sections with exact titles `Goal and core loop` through `Profile, saves, and safety`. Assert every source section number appears exactly once across the guide mapping. Assert generated guide pages contain exact critical facts:

- `Standard, Big, and Mega deals cost 1, 3, and 9 Tickets`.
- `You can hold up to 30 Chips`.
- `A direct Small Attack costs 10,000 Tokens`.
- `Rewarded ads are optional` language that does not imply ad-free play.
- Cloud sync is conditional and local progress can be removed by clearing app data or uninstalling.
- No page contains `free until launch`, `no real money is charged`, or `coming soon`.

- [ ] **Step 3: Run guide tests and verify they fail**

Run: `node --test tests/guides.test.mjs`

Expected: FAIL because the parser, mapping, and guide templates do not exist.

- [ ] **Step 4: Implement strict rule parsing and mapping validation**

Extend `scripts/lib/content.mjs` with `parseRuleSections(text)`. Parse only headings matching `/^(\d+)\.\s+(.+)$/`; collect following nonempty paragraphs until the next numbered heading; retain the two top-level category labels as navigation grouping metadata rather than rule content. Fail on duplicate/missing section numbers or a count other than 12.

Create `content/guides.json` mapping:

- Sections 1–4 → `cards-and-deals`.
- Sections 5–6 → `building-and-rent`.
- Section 7 → `rivals-and-jail`.
- Section 8 → `bonus-games`.
- Sections 9–10 → `cities-and-events`.
- Sections 11–12 → `shop-saves-safety`.

Replace only the stale sentence in Section 11 with: `Lucky Lots is live. The Shop displays real prices for available in-app purchases; review the item and displayed cost before confirming a purchase.` Preserve all other supplied rule text exactly unless a visible contradiction is separately approved.

- [ ] **Step 5: Implement guide templates and page descriptors**

The hub introduces the core loop, renders a linked table of contents, and shows all six topic cards. Detail pages render breadcrumbs, one `h1`, a local table of contents when multiple source sections exist, authoritative paragraphs/lists, a related authentic image, related-guide links, and a Play CTA after useful content. Add `BreadcrumbList` structured data to hub/detail pages.

- [ ] **Step 6: Build and verify the guide library**

Run:

```powershell
npm run build
node --test tests/guides.test.mjs
rg -n -i "coming soon|free until launch|no real money is charged|no ads" how-to-play
```

Expected: tests pass and the prohibited-claim search returns no matches. Manually compare each generated page’s section headings against the authoritative source.

- [ ] **Step 7: Commit the guide library**

Run:

```powershell
git diff --check
git add content/how-to-play content/guides.json src/templates/guide.mjs scripts/lib/content.mjs scripts/lib/pages.mjs tests/guides.test.mjs how-to-play
git commit -m "feat: publish authoritative How to Play guides"
```

---

### Task 6: Add factual news publishing, support, and shared legal presentation

**Files:**
- Create: `content/news/2026-08-21-my-block-update.json`
- Create: `content/support.json`
- Create: `src/templates/news.mjs`
- Create: `src/templates/support.mjs`
- Create: `src/templates/legal.mjs`
- Create: `tests/content-pages.test.mjs`
- Modify: `scripts/lib/content.mjs`
- Modify: `scripts/lib/pages.mjs`
- Modify: `privacy.html`
- Modify: `terms.html`
- Generate: `news/index.html`
- Generate: `news/my-block-is-a-real-street/index.html`
- Generate: `support/index.html`

**Interfaces:**
- Consumes: validated news/support records and the existing legal-page body copy.
- Produces: news index/article, support, and visually unified legal pages.

- [ ] **Step 1: Write failing news/support/legal tests**

Create `tests/content-pages.test.mjs` to assert:

- The news index links to one verified dated article.
- The article title, `datePublished`, and `dateModified` are ISO dates and visible.
- Article JSON-LD uses `Article`, matches the visible headline/date/image, and does not claim ratings.
- Support answers identify optional rewarded ads, in-app purchases, local-first saves, conditional cloud sync, and the contact email.
- Privacy and Terms retain their original substantive heading/body text and published paths.
- Every detail page includes breadcrumbs and a Google Play or related-guide path.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/content-pages.test.mjs`

Expected: FAIL because the content records and templates do not exist.

- [ ] **Step 3: Create the verified first news record**

Use the Play listing’s August 21, 2026 “What’s new” facts only: My Block now presents finished neighborhoods as scrollable streets with house names on the road and real construction stages; the Claw prize label no longer overlaps the house pile; the Team race banner no longer cuts off its second line. Set the title to `My Block is a real street now`, category `Game update`, published/modified date `2026-08-21`, a short factual excerpt, and an existing My Block/feature image. Do not invent version numbers or player reaction.

- [ ] **Step 4: Implement news and support templates**

News index sorts descending by published date. Article pages show semantic `<article>`, headline, dates, category, body, related guide, and CTA. Support uses native headings and `<details>` for concise questions but keeps all answer text in HTML without JavaScript. Add visible links to Privacy, Terms, the Play listing, the How to Play hub, and `mailto:azpilot@gmail.com`.

- [ ] **Step 5: Wrap legal pages without changing their meaning**

Extract the current Privacy and Terms body content into data passed to `renderLegal`, preserving wording, effective dates, headings, lists, and contact details. Apply the shared header/footer, unique metadata, canonical URLs, skip link, and accessible typography. A snapshot-like test stores normalized original legal text before modification and compares it with normalized rendered `<main>` text after excluding navigation/footer additions.

- [ ] **Step 6: Build and test all content pages**

Run: `npm run build && node --test tests/content-pages.test.mjs`

Expected: PASS. Confirm the homepage latest-news section now renders exactly the verified article.

- [ ] **Step 7: Commit news, support, and legal integration**

Run:

```powershell
git diff --check
git add content/news content/support.json src/templates/news.mjs src/templates/support.mjs src/templates/legal.mjs scripts/lib tests/content-pages.test.mjs news support privacy.html terms.html index.html
git commit -m "feat: add news support and unified legal pages"
```

---

### Task 7: Add progressive interaction and privacy-conscious conversion events

**Files:**
- Create: `src/js/main.js`
- Create: `tests/client.test.mjs`
- Modify: `scripts/build.mjs`
- Modify: `src/css/site.css`
- Generate: `js/main.js`
- Generate: `css/site.css`

**Interfaces:**
- Consumes: `[data-nav-toggle]`, `#site-nav`, `[data-reveal]`, and `[data-play-placement]` HTML hooks.
- Produces: keyboard-safe mobile navigation, optional reveal enhancement, and `CustomEvent("ll:play-store-click")` plus optional existing analytics forwarding.

- [ ] **Step 1: Write failing static client-contract tests**

Create `tests/client.test.mjs` to assert the source script:

- Adds `.js` to the root before applying hidden reveal states.
- Toggles `aria-expanded` and a navigation open class.
- Closes navigation on Escape and returns focus to the toggle.
- Uses `matchMedia("(prefers-reduced-motion: reduce)")` before reveal behavior.
- Uses `IntersectionObserver` only as progressive enhancement.
- Listens for clicks on `a[data-play-placement]` without preventing navigation.
- Dispatches `ll:play-store-click` with the placement value.
- Does not contain `requestAnimationFrame`, `scroll` listeners, frame-directory strings, Web3Forms, or an embedded Meta Pixel loader.

- [ ] **Step 2: Run the client tests and verify they fail**

Run: `node --test tests/client.test.mjs`

Expected: FAIL because the new source script does not exist.

- [ ] **Step 3: Implement minimal progressive behavior**

Create an IIFE in `src/js/main.js`. Immediately add `.js` to `document.documentElement`. Wire the nav toggle through `aria-expanded`; close on Escape and on a selected navigation link. If reduced motion is not requested and `IntersectionObserver` exists, observe `[data-reveal]`, add `.is-visible` once, and unobserve. Attach one delegated click listener for Play anchors; dispatch:

```js
document.dispatchEvent(new CustomEvent("ll:play-store-click", {
  detail: { placement: anchor.dataset.playPlacement },
}));
```

If `window.fbq` already exists, forward a `Lead`/custom outbound event only after the click; do not load the Pixel in this file. Do not stop the browser’s normal link action.

- [ ] **Step 4: Add CSS hooks that fail open**

Only `.js [data-reveal]:not(.is-visible)` may be visually hidden for reveal setup, and the reduced-motion media query must force all reveal content visible. The no-JavaScript document remains fully readable and navigation remains usable.

- [ ] **Step 5: Build and test the client bundle**

Run:

```powershell
npm run build
node --test tests/client.test.mjs
Get-Item js/main.js | Select-Object Length
```

Expected: PASS and uncompressed `js/main.js` remains below 8 KB, leaving margin below the 10 KB compressed budget.

- [ ] **Step 6: Commit the progressive enhancement**

Run:

```powershell
git diff --check
git add src/js/main.js src/css/site.css scripts/build.mjs tests/client.test.mjs js/main.js css/site.css
git commit -m "feat: add lightweight accessible interactions"
```

---

### Task 8: Generate crawl files and enforce whole-site SEO integrity

**Files:**
- Create: `scripts/validate-site.mjs`
- Create: `tests/seo.test.mjs`
- Modify: `scripts/build.mjs`
- Modify: `scripts/lib/pages.mjs`
- Generate: `robots.txt`
- Generate: `sitemap.xml`

**Interfaces:**
- Consumes: final page descriptors and generated public files.
- Produces: deterministic sitemap/robots output and a nonzero exit on metadata, link, asset, structured-data, or prohibited-claim violations.

- [ ] **Step 1: Write failing whole-site SEO tests**

Create `tests/seo.test.mjs` to build the site, enumerate generated HTML, and assert:

- Every public HTML file has one nonempty title, one meta description, one canonical, one visible `h1`, one `<main>`, and one `lang="en"`.
- Canonicals start with `https://luckylotsgame.com/` and match the output path.
- Open Graph title, description, image, and URL are absolute and present.
- Every internal `href` target resolves to a generated file or valid fragment.
- Every local image source exists and has width, height, and alt attributes.
- Every JSON-LD block parses and contains no `aggregateRating`.
- `robots.txt` includes `Sitemap: https://luckylotsgame.com/sitemap.xml`.
- The sitemap includes every canonical indexable page once and excludes duplicate/trailing variants.

- [ ] **Step 2: Run SEO tests and verify they fail**

Run: `node --test tests/seo.test.mjs`

Expected: FAIL because discovery files and complete validation are absent.

- [ ] **Step 3: Generate robots and sitemap from page descriptors**

In `scripts/build.mjs`, generate:

```text
User-agent: *
Allow: /
Sitemap: https://luckylotsgame.com/sitemap.xml
```

Generate XML with escaped absolute `<loc>` and ISO `<lastmod>` for each indexable descriptor. Sort by canonical path for deterministic output. Do not add priority or changefreq guesses.

- [ ] **Step 4: Implement the standalone validator**

Create `scripts/validate-site.mjs` using Node filesystem and URL APIs. Parse the controlled generated markup with targeted tag extraction sufficient for this site; report file path and exact failure for missing metadata, duplicate IDs, unresolved internal paths/fragments, missing image dimensions/alt, malformed JSON-LD, prohibited claims, and references into `frames/` from generated HTML/CSS/JS. Exit 1 on any failure and print `site validation: passed` only when no errors exist.

- [ ] **Step 5: Build and run the complete static gate**

Run: `npm run check`

Expected: build completes; all Node tests pass; validator prints `site validation: passed`.

- [ ] **Step 6: Validate Google-facing markup with external tools**

Serve the build locally and run Lighthouse SEO plus a JSON-LD schema sanity check. After deployment, use Google’s Rich Results Test and URL Inspection because localhost cannot establish production crawlability. Record production-only verification as a launch checklist item, not as a local pass.

- [ ] **Step 7: Commit crawl and validation infrastructure**

Run:

```powershell
git diff --check
git add scripts/build.mjs scripts/validate-site.mjs scripts/lib/pages.mjs tests/seo.test.mjs robots.txt sitemap.xml package.json
git commit -m "feat: enforce crawlable SEO-ready output"
```

---

### Task 9: Verify accessibility, responsiveness, and Core Web Vitals in a production-like server

**Files:**
- Create: `tests/browser/accessibility.test.mjs`
- Create: `tests/browser/responsive.test.mjs`
- Create: `lighthouserc.json`
- Create: `scripts/serve.mjs`
- Create: `docs/launch-baseline.md`
- Modify: `package.json`
- Modify as evidence requires: `src/css/site.css`, `src/templates/*.mjs`, `src/js/main.js`, asset manifest/derivatives

**Interfaces:**
- Consumes: the complete generated site through a local HTTP server.
- Produces: automated accessibility/responsive checks, Lighthouse reports, inspected screenshots, and a baseline report with exact scores and remaining production-only checks.

- [ ] **Step 1: Add browser-test and Lighthouse dependencies/scripts**

Pin development versions of `playwright`, `@axe-core/playwright`, `lighthouse`, and `@lhci/cli`. Add scripts:

```json
{
  "serve": "node scripts/serve.mjs",
  "test:browser": "node --test tests/browser/*.test.mjs",
  "lighthouse": "lhci autorun",
  "verify": "npm run check && npm run test:browser && npm run lighthouse"
}
```

Implement `scripts/serve.mjs` as a local static server that resolves paths inside the repository, maps directory requests to `index.html`, returns correct content types, prevents path traversal, and sets immutable caching only for fingerprinted/optimized assets during measurement.

- [ ] **Step 2: Write accessibility browser tests**

Using Playwright Chromium and `AxeBuilder`, test `/`, `/how-to-play/`, one detail guide, `/news/`, one article, `/support/`, `/privacy.html`, and `/terms.html`. Assert zero serious or critical axe violations; skip link moves focus/target to main; navigation opens/closes by keyboard; FAQ details work with Enter/Space; every visible interactive control is at least 44 × 44; and reduced motion leaves all content visible.

- [ ] **Step 3: Write responsive/no-JavaScript tests**

At 320 × 568, 360 × 800, 390 × 844, 412 × 915, 768 × 1024, 1024 × 768, 1280 × 720, and 1440 × 900, assert `document.documentElement.scrollWidth <= innerWidth`, hero `h1` and primary Play CTA are visible in the first viewport at mobile sizes, and no text element is clipped. Create a browser context with JavaScript disabled and assert homepage content, navigation links, FAQ answers, and Play links remain present.

- [ ] **Step 4: Configure Lighthouse budgets and assertions**

Create `lighthouserc.json` for mobile runs against the homepage, How to Play hub, and one guide detail. Use three runs per URL and assert minimum category scores of 0.95. Add audits for LCP ≤2500ms, CLS ≤0.1, total blocking time ≤200ms as a lab responsiveness proxy, total byte weight consistent with the spec budget, and no console errors. Record Lighthouse configuration, Chrome version, Node version, and timestamp in the baseline report.

- [ ] **Step 5: Run the production-like verification and fix evidence-backed failures**

Run `npm run verify`. For each failure, record the failing audit/selector, trace it to markup/style/script/asset cause, add or tighten a regression assertion, apply the smallest fix, and rerun the same command. Do not weaken thresholds to obtain green output.

- [ ] **Step 6: Capture and inspect visual evidence**

Capture full-page and first-viewport PNGs at 390 × 844, 412 × 915, 1280 × 720, and 1440 × 900 for the homepage, plus representative guide and news pages. Inspect them for hierarchy, cropping, contrast, spacing rhythm, focus visibility, screenshot legibility, CTA prominence, and accidental empty space. Structural test success is not visual approval; log any visual fixes and recapture after changes.

- [ ] **Step 7: Measure initial-request and frame-sequence exclusion**

From a cold browser context at 390 × 844, collect requests until `load` plus two seconds. Assert no request URL contains `/frames/`, first-party requests are at most 10, and initial image transfer is at most 250 KB. If analytics adds third-party requests, report them separately and ensure they do not block LCP.

- [ ] **Step 8: Write the launch baseline**

Create `docs/launch-baseline.md` with exact commands, environment versions, Lighthouse median scores, LCP/CLS/TBT, asset/request totals, axe result, tested viewports, screenshot paths, known field-data gap, and production-only checklist: Rich Results Test, Search Console URL Inspection, sitemap submission, redirects/status codes, and real Android hardware.

- [ ] **Step 9: Commit verified performance and accessibility work**

Run:

```powershell
git diff --check
npm run verify
git add package.json package-lock.json lighthouserc.json scripts/serve.mjs tests/browser docs/launch-baseline.md src css js art/optimized index.html how-to-play news support privacy.html terms.html robots.txt sitemap.xml
git commit -m "test: verify performance accessibility and responsive quality"
```

---

### Task 10: Perform the final conversion audit and prepare the 30-day launch runbook

**Files:**
- Create: `docs/conversion-audit.md`
- Create: `docs/launch-30-day-plan.md`
- Modify only for confirmed final defects: generated/source site files and regression tests
- Update: `README.md`

**Interfaces:**
- Consumes: verified site, launch baseline, spec metrics, and implemented event names.
- Produces: evidence-backed prelaunch verdict, prioritized experiment plan, measurement definitions, and maintenance instructions.

- [ ] **Step 1: Audit the arrival-to-action path at four entry types**

Review homepage cold arrival, an organic guide detail arrival, a news article arrival, and support arrival. For each, record: first visible promise, unresolved question before the nearest Play CTA, proof available, friction, and next action. Mark findings as confirmed defect, experiment proposal, or production-only unknown.

- [ ] **Step 2: Verify the three highest-impact conversion fixes are present**

Assert with evidence:

1. Identity, core promise, and Play CTA are visible in the first mobile viewport.
2. Every authoritative guide topic is crawlable and internally linked.
3. Live metadata, app structured data, canonicals, sitemap, and stale-claim removal pass validation.

If any assertion fails, add a regression test, fix it, and rerun `npm run verify` before continuing.

- [ ] **Step 3: Write `docs/conversion-audit.md`**

Lead with the verdict. Include the verified funnel, friction by step, trust signals, prioritized remaining fixes, and the three sequential tests:

1. Hero Variant A vs Variant B.
2. Authentic gameplay screenshot vs neighborhood transformation art.
3. Guide mid-content Play CTA vs end-only CTA.

Define the primary metric as `play_store_click` events divided by eligible landing sessions, segmented by placement and landing page. State that an outbound click is not a confirmed install.

- [ ] **Step 4: Write `docs/launch-30-day-plan.md`**

Include the production launch checklist, weekly schedule, controlled traffic sources, low-volume metrics, experiment order, and stop-changing rule from the spec. Add owners/actions for Search Console sitemap submission, homepage plus representative-page URL inspection, Play Console acquisition review, social announcements linking to relevant guide pages, and weekly query/content review.

- [ ] **Step 5: Update README publishing instructions**

Document:

- `npm install`, `npm run optimize:images`, `npm run build`, `npm run check`, `npm run test:browser`, and `npm run lighthouse`.
- How to add a factual news JSON record with slug, title, description, dates, image key, excerpt, sections, and related guide.
- How guide sections map from the authoritative source.
- Which files are generated and must not be manually edited.
- Vercel static deployment expectations and production verification steps.

- [ ] **Step 6: Run the final hostile review**

Run:

```powershell
git status --short
git diff --check
npm run verify
rg -n -i "coming soon|free until launch|no real money is charged|no ads" --glob "*.html" --glob "*.json" --glob "*.xml"
rg -n "frames/" index.html how-to-play news support css js
```

Expected: verification passes; prohibited-claim search returns no public-content matches; critical-path frame search returns no matches. Review `git diff` as a hostile reviewer for unsupported claims, missing alt text, stale URLs, unescaped content, and unrelated changes.

- [ ] **Step 7: Commit the launch handoff**

Run:

```powershell
git add README.md docs/conversion-audit.md docs/launch-30-day-plan.md
git commit -m "docs: add conversion audit and launch runbook"
git status --short --branch
```

Expected: working tree is clean and the branch contains the complete verified redesign in reviewable commits.

---

## Execution completion gate

Before claiming the website is finished:

1. Invoke `superpowers:verification-before-completion`.
2. Run `npm run verify` from a clean production-like build and inspect the latest output rather than relying on an earlier run.
3. Inspect the final Git diff/history and confirm no unrelated files were changed.
4. Report exact Lighthouse scores, Core Web Vitals lab metrics, accessibility results, tested viewports, request/image budgets, commit hashes, and production-only verification gaps.
5. Invoke `superpowers:requesting-code-review` for an independent review before integration.
6. Invoke `superpowers:finishing-a-development-branch` only after implementation, tests, and review are complete.
