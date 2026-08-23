import test from "node:test";
import assert from "node:assert/strict";
import { renderLayout } from "../src/templates/layout.mjs";
import {
  renderBreadcrumbs,
  renderFaq,
  renderPicture,
  renderPlayCta,
} from "../src/templates/components.mjs";

const site = {
  name: "Lucky Lots: Card City Builder",
  shortName: "Lucky Lots",
  origin: "https://luckylotsgame.com",
  playUrl: "https://play.google.com/store/apps/details?id=com.luckylots.cardcity",
  contactEmail: "azpilot@gmail.com",
};

test("layout emits canonical metadata and accessible landmarks", () => {
  const html = renderLayout({
    site,
    page: {
      title: "How to Play",
      description: "Learn the real Lucky Lots rules.",
      path: "/how-to-play/",
      image: "/art/feature.webp",
    },
    body: "<h1>How to Play</h1>",
    structuredData: [],
  });

  assert.match(html, /<html lang="en">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/luckylotsgame\.com\/how-to-play\/">/);
  assert.match(html, /<a class="skip-link" href="#main">Skip to content<\/a>/);
  assert.match(html, /<main id="main" tabindex="-1">/);
  assert.match(html, /<meta name="description" content="Learn the real Lucky Lots rules\.">/);
  assert.match(html, /<button[^>]+data-nav-toggle[^>]+aria-controls="site-nav"[^>]+aria-expanded="false"/);
});

test("Play CTA records placement and is safe for a new tab", () => {
  const html = renderPlayCta({
    site,
    label: "Install free on Google Play",
    placement: "hero",
  });
  assert.match(html, /data-play-placement="hero"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Install free on Google Play/);
});

test("responsive picture reserves dimensions and prioritizes only an LCP image", () => {
  const html = renderPicture(
    {
      src: "/art/optimized/hero-960.webp",
      avif: "/art/optimized/hero-960.avif",
      width: 960,
      height: 720,
    },
    "A Lucky Lots neighborhood",
    { priority: true },
  );
  assert.match(html, /width="960" height="720"/);
  assert.match(html, /fetchpriority="high"/);
  assert.doesNotMatch(html, /loading="lazy"/);
});

test("non-priority pictures lazy load", () => {
  const html = renderPicture(
    { src: "/art/shot-my_lot.webp", width: 540, height: 960 },
    "Building a Lucky Lots house",
  );
  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.doesNotMatch(html, /fetchpriority="high"/);
});

test("breadcrumbs and FAQ use native accessible structures", () => {
  const breadcrumbs = renderBreadcrumbs([
    { label: "Home", href: "/" },
    { label: "How to Play", href: "/how-to-play/" },
  ]);
  const faq = renderFaq([{ question: "Is it free?", answer: "Yes." }]);
  assert.match(breadcrumbs, /<nav aria-label="Breadcrumb">/);
  assert.match(breadcrumbs, /aria-current="page"/);
  assert.match(faq, /<details/);
  assert.match(faq, /<summary>Is it free\?<\/summary>/);
});
