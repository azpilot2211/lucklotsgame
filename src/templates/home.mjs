import { escapeHtml } from "../../scripts/lib/html.mjs";
import {
  renderArticleCard,
  renderFaq,
  renderPicture,
  renderPlayCta,
  toPictureAsset,
} from "./components.mjs";

function heading(eyebrow, title, body = "") {
  const description = body ? `\n    <p>${escapeHtml(body)}</p>` : "";
  return `<div class="section-heading" data-reveal>
    <p class="eyebrow">${escapeHtml(eyebrow)}</p>
    <h2>${escapeHtml(title)}</h2>${description}
  </div>`;
}

export function renderHome({ site, home, assets, articles = [] }) {
  const hero = toPictureAsset(assets.hero);
  const heroProof = home.proof.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const loop = home.loop.map((item, index) => `<li class="loop-card" data-reveal>
    <span class="step-number" aria-hidden="true">${index + 1}</span>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.body)}</p>
  </li>`).join("");
  const features = home.features.map((item) => `<div class="feature-row${item.reversed ? " is-reversed" : ""}">
    <div class="phone-frame" data-reveal>${renderPicture(toPictureAsset(assets[item.asset]), item.alt)}</div>
    <div class="feature-copy" data-reveal><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div>
  </div>`).join("");
  const rivals = home.rivals.map((item) => `<figure class="rival-card" data-reveal>
    ${renderPicture(toPictureAsset(assets[item.asset]), item.alt)}
    <figcaption><strong>${escapeHtml(item.name)}</strong><span>“${escapeHtml(item.quote)}”</span></figcaption>
  </figure>`).join("");
  const guides = home.guideTopics.map((item) => `<article class="guide-card" data-reveal>
    <h3><a href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a></h3>
    <p>${escapeHtml(item.body)}</p>
    <a href="${escapeHtml(item.href)}">Read this guide <span aria-hidden="true">→</span></a>
  </article>`).join("");
  const news = articles.length > 0 ? `<section class="section" aria-labelledby="latest-news">
    <div class="section-inner">
      ${heading("From the block", "Latest news")}
      <div class="article-grid" id="latest-news">${articles.slice(0, 3).map(renderArticleCard).join("")}</div>
    </div>
  </section>` : "";

  return `<section class="hero">
    <div class="section-inner hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(home.eyebrow)}</p>
        <h1>${escapeHtml(home.headline)}</h1>
        <p class="lede">${escapeHtml(home.subhead)}</p>
        <div class="hero-actions">
          ${renderPlayCta({ site, label: home.primaryCta, placement: "hero" })}
          <a class="secondary-cta" href="#how-it-plays">${escapeHtml(home.secondaryCta)} <span aria-hidden="true">↓</span></a>
        </div>
        <ul class="hero-proof">${heroProof}</ul>
      </div>
      <div class="hero-art">${renderPicture(hero, "Lucky Lots neighborhood and game characters", { priority: true })}</div>
    </div>
  </section>
  <div class="proof-strip"><ul class="section-inner proof-list"><li>Three-card deals</li><li>Houses built stage by stage</li><li>Rivals, Cities, and live events</li></ul></div>
  <section class="section" id="how-it-plays">
    <div class="section-inner">
      ${heading("The core loop", "One hand can change the whole block.", "Deal what you need, finish one more stage, protect what you built, and keep the street growing.")}
      <ol class="loop-grid">${loop}</ol>
    </div>
  </section>
  <section class="section section-sky">
    <div class="section-inner">
      ${heading("Authentic gameplay", "This is the game—not a mockup.", "Real screens show the hand you deal, the house you build, and the rival you choose.")}
      <div class="feature-grid">${features}</div>
    </div>
  </section>
  <section class="section section-dark">
    <div class="section-inner">
      ${heading("Meet the neighbors", "Nice street. Shame if a rival noticed.", "Marv, Deb, and Mr. Grigsby are building too—and they are not above helping themselves to your progress.")}
      <div class="rival-grid">${rivals}</div>
    </div>
  </section>
  <section class="section">
    <div class="section-inner feature-row">
      <div class="phone-frame" data-reveal>${renderPicture(toPictureAsset(assets.prizeWheel), "The Lucky Lots Bonus Wheel")}</div>
      <div class="feature-copy" data-reveal>
        <p class="eyebrow">Bonus games & events</p>
        <h2>There’s always another way to win.</h2>
        <p>Spend Chips on the Bonus Wheel and mini-games, work through daily goals, and check live timers before joining limited-time events.</p>
        <a href="/how-to-play/bonus-games/">Explore bonus games <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
  <section class="section section-sky">
    <div class="section-inner feature-row is-reversed">
      <div class="phone-frame" data-reveal>${renderPicture(toPictureAsset(assets.myCity), "My City projects and team activity in Lucky Lots")}</div>
      <div class="feature-copy" data-reveal>
        <p class="eyebrow">City play</p>
        <h2>Build with a City behind you.</h2>
        <p>Chat safely, request cards or Tokens, help with repairs and bail, fund projects, open City Chests, and compete together.</p>
        <a href="/how-to-play/cities-and-events/">See how Cities work <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="section-inner">
      ${heading("How to Play", "Know exactly what every card and currency does.", "Start with the core loop or jump straight to the rule you need.")}
      <div class="guide-grid">${guides}</div>
    </div>
  </section>
${news}<section class="section section-sky">
    <div class="section-inner">
      ${heading("Good to know", "Questions before your first deal?")}
      ${renderFaq(home.faq)}
    </div>
  </section>
  <section class="section section-dark">
    <div class="section-inner cta-panel" data-reveal>
      <p class="eyebrow">Live on Android</p>
      <h2>Your first empty lot is waiting.</h2>
      <p class="lede">Deal a few hands, finish your first foundation, and start turning one street into a city.</p>
      ${renderPlayCta({ site, label: "Build your block on Google Play", placement: "footer" })}
    </div>
  </section>`;
}
