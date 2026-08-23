# luckylotsgame.com

Generated static marketing, guide, news, support, and legal site for **Lucky Lots: Card City**.

## Work locally

```powershell
npm install
npm run optimize:images
npm run build
npm run check
npm run test:browser
npm run lighthouse
```

`npm run build` recreates ignored `dist/`; do not edit generated HTML, CSS, JavaScript, robots, or sitemap files there. Templates live in `src/templates`, authored content in `src/content`, and build descriptors in `scripts/lib/pages.mjs`. Guide copy maps to `src/content/how-to-play-source.txt`, derived from the approved in-game rules.

To publish factual news, add a JSON record with slug, title, description, published/modified dates, image key, excerpt, sections, and related guide, then run the complete checks. Do not publish unverified roadmap claims.

Vercel runs `npm run check` and publishes `dist/` according to `vercel.json`. After deployment, verify `/sitemap.xml`, `/robots.txt`, `/app-ads.txt`, legal URLs, response headers, structured data, and the Google Play handoff.
