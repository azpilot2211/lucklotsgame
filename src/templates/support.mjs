import { escapeHtml } from "../../scripts/lib/html.mjs";
import { renderBreadcrumbs, renderFaq, renderPlayCta } from "./components.mjs";

export function renderSupport({ site, support }) {
  return `<section class="page-hero section-sky">
    <div class="section-inner">
      ${renderBreadcrumbs([{ label: "Home", href: "/" }, { label: "Support", href: "/support/" }])}
      <p class="eyebrow">Player help</p>
      <h1>${escapeHtml(support.title)}</h1>
      <p class="lede">${escapeHtml(support.intro)}</p>
    </div>
  </section>
  <section class="section">
    <div class="section-inner support-layout">
      <div>
        <div class="section-heading"><p class="eyebrow">Quick answers</p><h2>Start here</h2></div>
        ${renderFaq(support.questions)}
      </div>
      <aside class="support-links">
        <h2>Useful links</h2>
        <a href="/how-to-play/">Read the official How to Play guide</a>
        <a href="/privacy.html">Read the Privacy Policy</a>
        <a href="/terms.html">Read the Terms of Service</a>
        <a href="mailto:${escapeHtml(site.contactEmail)}">Email ${escapeHtml(site.contactEmail)}</a>
        <a href="${escapeHtml(site.playUrl)}" target="_blank" rel="noopener noreferrer">Open Lucky Lots on Google Play</a>
      </aside>
    </div>
  </section>
  <section class="section section-sky">
    <div class="section-inner cta-panel">
      <p class="eyebrow">Back to the block</p>
      <h2>Ready for your next deal?</h2>
      ${renderPlayCta({ site, label: "Open Lucky Lots on Google Play", placement: "support" })}
    </div>
  </section>`;
}
