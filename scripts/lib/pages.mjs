import { renderLayout } from "../../src/templates/layout.mjs";
import { renderHome } from "../../src/templates/home.mjs";

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
  return [{
    outputPath: "index.html",
    canonicalPath: "/",
    html,
    lastModified: "2026-08-22",
  }];
}
