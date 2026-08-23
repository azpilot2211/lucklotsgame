import { escapeHtml, jsonLd } from "../../scripts/lib/html.mjs";
import { renderPlayCta } from "./components.mjs";

function absoluteUrl(site, value) {
  return new URL(value, `${site.origin}/`).href;
}

export function renderLayout({ site, page, body, structuredData = [] }) {
  const canonical = absoluteUrl(site, page.path);
  const image = absoluteUrl(site, page.image || "/art/feature.webp");
  const schemas = structuredData.map(jsonLd).join("\n  ");
  const articleMeta = page.ogType === "article" ? `
  <meta property="article:published_time" content="${escapeHtml(page.published)}">
  <meta property="article:modified_time" content="${escapeHtml(page.modified)}">` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="${escapeHtml(page.ogType || "website")}">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">${articleMeta}
  <link rel="icon" href="/art/icon-192.png">
  <link rel="apple-touch-icon" href="/art/icon-192.png">
  <script>document.documentElement.classList.add("js")</script>
  <link rel="stylesheet" href="/css/site.css">
  ${schemas}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="wordmark" href="/" aria-label="Lucky Lots home"><picture class="wordmark-logo"><source sizes="(min-width: 900px) 168px, 120px" srcset="/art/optimized/site-logo-240.avif 240w, /art/optimized/site-logo-360.avif 360w" type="image/avif"><source sizes="(min-width: 900px) 168px, 120px" srcset="/art/optimized/site-logo-240.webp 240w, /art/optimized/site-logo-360.webp 360w" type="image/webp"><img src="/art/optimized/site-logo-360.webp" alt="" width="360" height="173" decoding="async"></picture></a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-controls="site-nav" aria-expanded="false"><span class="sr-only">Toggle navigation</span><span aria-hidden="true">Menu</span></button>
      <nav class="site-nav" id="site-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/how-to-play/">How to Play</a>
        <a href="/news/">News</a>
        <a href="/support/">Support</a>
      </nav>
      ${renderPlayCta({ site, label: "Google Play", placement: "header", className: "header-cta" })}
    </div>
  </header>
  <main id="main" tabindex="-1">${body}</main>
  <footer class="site-footer">
    <div class="footer-inner">
      <p>© 2026 ${escapeHtml(site.shortName)}. Built by ${escapeHtml(site.developer || "CapeCoder")}.</p>
      <nav aria-label="Legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="mailto:${escapeHtml(site.contactEmail)}">Contact</a></nav>
    </div>
  </footer>
  <script src="/js/main.js" defer></script>
</body>
</html>
`;
}
