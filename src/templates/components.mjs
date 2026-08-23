import { attrs, escapeHtml } from "../../scripts/lib/html.mjs";

export function renderPlayCta({ site, label, placement, className = "" }) {
  return `<a${attrs({
    class: `play-cta${className ? ` ${className}` : ""}`,
    href: site.playUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    "data-play-placement": placement,
  })}>${escapeHtml(label)}</a>`;
}

export function toPictureAsset(asset) {
  if (!asset?.outputs?.length) throw new Error("toPictureAsset requires optimized outputs");
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

export function renderPicture(asset, alt, options = {}) {
  if (!asset?.src || !asset?.width || !asset?.height) {
    throw new Error("renderPicture requires src, width, and height");
  }
  const sourceAttrs = { sizes: asset.sizes || options.sizes };
  const sources = [
    asset.avif
      ? `<source${attrs({ ...sourceAttrs, srcset: asset.avif, type: "image/avif" })}>`
      : "",
    asset.webp && asset.webp !== asset.src
      ? `<source${attrs({ ...sourceAttrs, srcset: asset.webp, type: "image/webp" })}>`
      : "",
  ].join("");
  const loading = options.priority
    ? { fetchpriority: "high" }
    : { loading: "lazy", decoding: "async" };
  return `<picture>${sources}<img${attrs({
    src: asset.src,
    alt,
    width: asset.width,
    height: asset.height,
    ...loading,
    class: options.className,
  })}></picture>`;
}

export function renderBreadcrumbs(items) {
  const links = items.map((item, index) => {
    const isLast = index === items.length - 1;
    return `<li>${isLast
      ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
      : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`}</li>`;
  }).join("");
  return `<nav aria-label="Breadcrumb"><ol class="breadcrumbs">${links}</ol></nav>`;
}

export function renderFaq(items) {
  return `<div class="faq-list">${items.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><div class="faq-answer"><p>${escapeHtml(item.answer)}</p></div></details>`).join("")}</div>`;
}

export function renderArticleCard(article) {
  return `<article class="article-card">
    <p class="eyebrow">${escapeHtml(article.category)}</p>
    <h3><a href="${escapeHtml(article.href)}">${escapeHtml(article.title)}</a></h3>
    <p>${escapeHtml(article.excerpt)}</p>
    <time datetime="${escapeHtml(article.published)}">${escapeHtml(article.displayDate)}</time>
  </article>`;
}
