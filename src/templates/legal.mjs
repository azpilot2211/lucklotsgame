import { escapeHtml } from "../../scripts/lib/html.mjs";
import { renderBreadcrumbs } from "./components.mjs";

function renderText(value) {
  return escapeHtml(value).replaceAll("azpilot@gmail.com", '<a href="mailto:azpilot@gmail.com">azpilot@gmail.com</a>');
}

function renderLegalSection(section) {
  const paragraphs = (section.paragraphs || []).map((item) => `<p>${renderText(item)}</p>`).join("");
  const items = section.items?.length ? `<ul>${section.items.map((item) => `<li>${renderText(item)}</li>`).join("")}</ul>` : "";
  const after = (section.paragraphsAfter || []).map((item) => `<p>${renderText(item)}</p>`).join("");
  const links = section.links?.length ? `<p>${section.links.map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`).join(" · ")}</p>` : "";
  return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${items}${after}${links}</section>`;
}

export function renderLegal({ legal }) {
  const label = legal.path === "/privacy.html" ? "Privacy Policy" : "Terms of Service";
  return `<section class="page-hero section-sky legal-hero">
    <div class="section-inner">
      ${renderBreadcrumbs([{ label: "Home", href: "/" }, { label, href: legal.path }])}
      <p class="eyebrow">Legal</p>
      <h1>${escapeHtml(legal.title)}</h1>
      <p><em>Last updated: ${escapeHtml(legal.updated)}</em></p>
    </div>
  </section>
  <div class="section section-inner legal-layout">
    <article class="prose legal-copy">
      <p class="lede">${renderText(legal.intro)}</p>
      ${legal.sections.map(renderLegalSection).join("")}
      <aside class="related-callout"><p>See also: <a href="${escapeHtml(legal.relatedHref)}">${escapeHtml(legal.relatedLabel)}</a></p><p><a href="/how-to-play/">Read the official How to Play guide</a></p></aside>
    </article>
  </div>`;
}
