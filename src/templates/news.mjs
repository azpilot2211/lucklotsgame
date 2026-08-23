import { escapeHtml } from "../../scripts/lib/html.mjs";
import { renderArticleCard, renderBreadcrumbs, renderPicture, renderPlayCta, toPictureAsset } from "./components.mjs";

export function renderNewsIndex({ articles }) {
  return `<section class="page-hero section-sky">
    <div class="section-inner">
      ${renderBreadcrumbs([{ label: "Home", href: "/" }, { label: "News", href: "/news/" }])}
      <p class="eyebrow">From the block</p>
      <h1>Lucky Lots news</h1>
      <p class="lede">Verified game updates, new features, and fixes from the live Android release.</p>
    </div>
  </section>
  <section class="section" aria-labelledby="news-list">
    <div class="section-inner">
      <h2 id="news-list">Latest updates</h2>
      <div class="article-grid">${articles.map(renderArticleCard).join("")}</div>
    </div>
  </section>`;
}

export function renderNewsArticle({ site, article, assets }) {
  const articleImage = {
    ...assets[article.imageKey],
    sizes: "(min-width: 1000px) 960px, 100vw",
    outputs: assets[article.imageKey].outputs.filter(({ width }) => width <= 960),
  };
  return `<article class="article-detail">
    <header class="page-hero section-sky">
      <div class="section-inner article-header">
        ${renderBreadcrumbs([{ label: "Home", href: "/" }, { label: "News", href: "/news/" }, { label: article.title, href: article.href }])}
        <p class="eyebrow">${escapeHtml(article.category)}</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-dates">By ${escapeHtml(site.developer)} · Published <time datetime="${escapeHtml(article.published)}">${escapeHtml(article.displayDate)}</time> · Updated <time datetime="${escapeHtml(article.modified)}">${escapeHtml(article.displayDate)}</time></p>
        <div class="article-hero">${renderPicture(toPictureAsset(articleImage), "A completed Lucky Lots neighborhood shown as a scrollable street", { priority: true })}</div>
      </div>
    </header>
    <div class="section section-inner prose article-body">
      ${article.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      <aside class="related-callout"><h2>Keep building</h2><a href="${escapeHtml(article.relatedGuide.href)}">${escapeHtml(article.relatedGuide.label)} <span aria-hidden="true">→</span></a></aside>
      <div class="cta-panel">
        <p class="eyebrow">Live on Android</p>
        <h2>See your block in Lucky Lots.</h2>
        ${renderPlayCta({ site, label: "Install free on Google Play", placement: "news-article" })}
      </div>
    </div>
  </article>`;
}
