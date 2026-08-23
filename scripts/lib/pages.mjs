import { renderLayout } from "../../src/templates/layout.mjs";
import { renderHome } from "../../src/templates/home.mjs";
import { renderGuideHub, renderGuidePage } from "../../src/templates/guide.mjs";
import { renderNewsArticle, renderNewsIndex } from "../../src/templates/news.mjs";
import { renderSupport } from "../../src/templates/support.mjs";
import { renderLegal } from "../../src/templates/legal.mjs";

function breadcrumbSchema(site, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, `${site.origin}/`).href,
    })),
  };
}

export function createPages(content) {
  const body = renderHome({
    site: content.site,
    home: content.home,
    assets: content.assets,
    articles: content.news || [],
  });
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": ["VideoGame", "MobileApplication"],
    name: content.site.name,
    operatingSystem: "Android",
    applicationCategory: "GameApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    downloadUrl: content.site.playUrl,
    publisher: { "@type": "Organization", name: content.site.developer },
  };
  const html = renderLayout({
    site: content.site,
    page: {
      title: content.home.title,
      description: content.home.description,
      path: "/",
      image: "/art/feature.webp",
    },
    body,
    structuredData: [applicationSchema],
  });
  const pages = [{
    outputPath: "index.html",
    canonicalPath: "/",
    html,
    lastModified: "2026-08-22",
  }];

  pages.push({
    outputPath: "how-to-play/index.html",
    canonicalPath: "/how-to-play/",
    html: renderLayout({
      site: content.site,
      page: {
        title: "How to Play Lucky Lots — Official Game Guide",
        description: "Learn Lucky Lots deal costs, currencies, construction, rent, rivals, bonus games, Cities, events, purchases, saves, and safety.",
        path: "/how-to-play/",
        image: "/art/optimized/scene-builders-960.webp",
      },
      body: renderGuideHub({ guides: content.guides, assets: content.assets }),
      structuredData: [breadcrumbSchema(content.site, [
        { name: "Home", path: "/" },
        { name: "How to Play", path: "/how-to-play/" },
      ])],
    }),
    lastModified: "2026-08-22",
  });

  for (const guide of content.guides) {
    const guidePath = `/how-to-play/${guide.slug}/`;
    const sections = guide.sourceSections.map((number) => content.ruleSections.find((section) => section.number === number));
    pages.push({
      outputPath: `how-to-play/${guide.slug}/index.html`,
      canonicalPath: guidePath,
      html: renderLayout({
        site: content.site,
        page: {
          title: `${guide.title} — Lucky Lots How to Play`,
          description: guide.description,
          path: guidePath,
          image: `/${content.assets[guide.imageKey].outputs.find((item) => item.format === "webp").path}`,
        },
        body: renderGuidePage({
          site: content.site,
          guide,
          sections,
          guides: content.guides,
          assets: content.assets,
        }),
        structuredData: [breadcrumbSchema(content.site, [
          { name: "Home", path: "/" },
          { name: "How to Play", path: "/how-to-play/" },
          { name: guide.title, path: guidePath },
        ])],
      }),
      lastModified: "2026-08-22",
    });
  }

  pages.push({
    outputPath: "news/index.html",
    canonicalPath: "/news/",
    html: renderLayout({
      site: content.site,
      page: {
        title: "Lucky Lots News — Game Updates & Fixes",
        description: "Read verified Lucky Lots Android game updates, feature changes, and fixes from CapeCoder.",
        path: "/news/",
        image: "/art/optimized/street-960.webp",
      },
      body: renderNewsIndex({ articles: content.news }),
      structuredData: [breadcrumbSchema(content.site, [
        { name: "Home", path: "/" },
        { name: "News", path: "/news/" },
      ])],
    }),
    lastModified: content.news[0].modified,
  });

  for (const article of content.news) {
    const image = `${content.site.origin}/art/optimized/street-960.webp`;
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      datePublished: article.published,
      dateModified: article.modified,
      image,
      author: { "@type": "Organization", name: content.site.developer },
      publisher: { "@type": "Organization", name: content.site.developer },
      mainEntityOfPage: new URL(article.href, `${content.site.origin}/`).href,
    };
    pages.push({
      outputPath: `news/${article.slug}/index.html`,
      canonicalPath: article.href,
      html: renderLayout({
        site: content.site,
        page: {
          title: `${article.title} — Lucky Lots News`,
          description: article.excerpt,
          path: article.href,
          image: "/art/optimized/street-960.webp",
          ogType: "article",
          published: article.published,
          modified: article.modified,
        },
        body: renderNewsArticle({ site: content.site, article, assets: content.assets }),
        structuredData: [
          breadcrumbSchema(content.site, [
            { name: "Home", path: "/" },
            { name: "News", path: "/news/" },
            { name: article.title, path: article.href },
          ]),
          articleSchema,
        ],
      }),
      lastModified: article.modified,
    });
  }

  pages.push({
    outputPath: "support/index.html",
    canonicalPath: "/support/",
    html: renderLayout({
      site: content.site,
      page: {
        title: content.support.title,
        description: content.support.description,
        path: "/support/",
        image: "/art/optimized/hero-960.webp",
      },
      body: renderSupport({ site: content.site, support: content.support }),
      structuredData: [breadcrumbSchema(content.site, [
        { name: "Home", path: "/" },
        { name: "Support", path: "/support/" },
      ])],
    }),
    lastModified: "2026-08-22",
  });

  for (const legal of [content.legal.privacy, content.legal.terms]) {
    const label = legal.path === "/privacy.html" ? "Privacy Policy" : "Terms of Service";
    pages.push({
      outputPath: legal.path.slice(1),
      canonicalPath: legal.path,
      html: renderLayout({
        site: content.site,
        page: {
          title: legal.metaTitle,
          description: legal.description,
          path: legal.path,
          image: "/art/optimized/hero-960.webp",
        },
        body: renderLegal({ legal }),
        structuredData: [breadcrumbSchema(content.site, [
          { name: "Home", path: "/" },
          { name: label, path: legal.path },
        ])],
      }),
      lastModified: "2026-08-22",
    });
  }

  return pages;
}
