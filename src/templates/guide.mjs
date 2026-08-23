import { escapeHtml } from "../../scripts/lib/html.mjs";
import { renderBreadcrumbs, renderPicture, renderPlayCta } from "./components.mjs";

function responsiveAsset(asset) {
  const avif = asset.outputs.filter((item) => item.format === "avif");
  const webp = asset.outputs.filter((item) => item.format === "webp");
  const fallback = webp.at(-1) || avif.at(-1);
  const scale = Math.min(fallback.width / asset.width, 1);
  return {
    src: `/${fallback.path}`,
    avif: avif.map((item) => `/${item.path} ${item.width}w`).join(", ") || undefined,
    webp: webp.map((item) => `/${item.path} ${item.width}w`).join(", ") || undefined,
    width: Math.min(fallback.width, asset.width),
    height: Math.round(asset.height * scale),
    sizes: asset.sizes,
  };
}

function guideCard(guide) {
  return `<article class="guide-card">
    <p class="eyebrow">How to Play</p>
    <h2><a href="/how-to-play/${escapeHtml(guide.slug)}/">${escapeHtml(guide.title)}</a></h2>
    <p>${escapeHtml(guide.description)}</p>
    <a href="/how-to-play/${escapeHtml(guide.slug)}/">Read this guide <span aria-hidden="true">→</span></a>
  </article>`;
}

export function renderGuideHub({ guides, assets }) {
  return `<section class="page-hero section-sky">
    <div class="section-inner page-hero-inner">
      <div>
        ${renderBreadcrumbs([{ label: "Home", href: "/" }, { label: "How to Play", href: "/how-to-play/" }])}
        <p class="eyebrow">Official game guide</p>
        <h1>How to Play Lucky Lots</h1>
        <p class="lede">Deal three cards, bank useful rewards, build one house stage at a time, collect rent, and protect your street. Choose a topic for the exact rules.</p>
      </div>
      <div class="guide-hero-art">${renderPicture(responsiveAsset(assets.sceneBuilders), "Builders working on a Lucky Lots neighborhood", { priority: true })}</div>
    </div>
  </section>
  <section class="section" aria-labelledby="guide-topics">
    <div class="section-inner">
      <div class="section-heading">
        <p class="eyebrow">Choose a topic</p>
        <h2 id="guide-topics">From your first deal to a protected city</h2>
        <p>Every numbered rule from the in-game guide appears once in this library.</p>
      </div>
      <nav class="guide-grid" aria-label="How to Play topics">${guides.map(guideCard).join("")}</nav>
    </div>
  </section>`;
}

function renderRuleSection(section) {
  const paragraphs = section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const list = section.listItems.length > 0
    ? `<ul>${section.listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  return `<section id="section-${section.number}">
    <p class="eyebrow">Rule ${section.number}</p>
    <h2>${escapeHtml(section.title)}</h2>
    ${paragraphs}${list}
  </section>`;
}

export function renderGuidePage({ site, guide, sections, guides, assets }) {
  const related = guides.filter(({ slug }) => slug !== guide.slug).slice(0, 3);
  const toc = sections.length > 1 ? `<nav class="local-toc" aria-label="On this page">
    <strong>On this page</strong>
    <ol>${sections.map((section) => `<li><a href="#section-${section.number}">${escapeHtml(section.title)}</a></li>`).join("")}</ol>
  </nav>` : "";
  return `<section class="page-hero section-sky">
    <div class="section-inner page-hero-inner">
      <div>
        ${renderBreadcrumbs([{ label: "Home", href: "/" }, { label: "How to Play", href: "/how-to-play/" }, { label: guide.title, href: `/how-to-play/${guide.slug}/` }])}
        <p class="eyebrow">Official game guide</p>
        <h1>${escapeHtml(guide.title)}</h1>
        <p class="lede">${escapeHtml(guide.description)}</p>
      </div>
      <div class="guide-hero-art">${renderPicture(responsiveAsset(assets[guide.imageKey]), `${guide.title} gameplay in Lucky Lots`, { priority: true })}</div>
    </div>
  </section>
  <section class="section">
    <div class="section-inner guide-layout">
      <aside>${toc}</aside>
      <article class="prose guide-sections">${sections.map(renderRuleSection).join("")}</article>
    </div>
  </section>
  <section class="section section-sky">
    <div class="section-inner">
      <div class="cta-panel">
        <p class="eyebrow">Ready to deal?</p>
        <h2>Put the rules to work on your own block.</h2>
        ${renderPlayCta({ site, label: "Install free on Google Play", placement: `guide-${guide.slug}` })}
      </div>
      <div class="related-guides">
        <h2>Keep learning</h2>
        <div class="guide-grid">${related.map(guideCard).join("")}</div>
      </div>
    </div>
  </section>`;
}
