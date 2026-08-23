import { escapeHtml } from "./html.mjs";
import { renderLayout } from "../../src/templates/layout.mjs";

export function createPages(content) {
  const body = `<section><h1>${escapeHtml(content.home.headline)}</h1><p>${escapeHtml(content.home.subhead)}</p></section>`;
  const html = renderLayout({
    site: content.site,
    page: {
      title: content.home.title,
      description: content.home.description,
      path: "/",
      image: "/art/feature.webp",
    },
    body,
    structuredData: [],
  });
  return [{
    outputPath: "index.html",
    canonicalPath: "/",
    html,
    lastModified: "2026-08-22",
  }];
}
