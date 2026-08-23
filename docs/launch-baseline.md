# Lucky Lots launch baseline

Measured 2026-08-22 on Windows 10, Node 24.16.0, Playwright Chromium 151.0.7922.34, and Lighthouse 13.4.1. Commands: `npm run check`, `npm run test:browser`, and `npm run lighthouse`.

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 100 | 100 | 100 | 100 | 1,655 ms | 0 | 32 ms | 135,508 B |
| How to Play | 100 | 100 | 100 | 100 | 1,356 ms | 0 | 2 ms | 101,101 B |
| Cards and Deals | 98 | 100 | 100 | 100 | 1,656 ms | 0 | 154 ms | 147,443 B |

Values are medians of three simulated mobile runs per URL. Lab results are not field Core Web Vitals. Browser verification found zero serious or critical axe violations across eight representative public pages, no horizontal overflow at eight viewports from 320x568 through 1440x900, no dependency on JavaScript for core content, no legacy frame requests, at most 10 initial first-party requests, and no more than 250 KB of initial mobile imagery.

Production-only checks: verify status codes and redirects, run Rich Results Test, inspect the homepage and a guide in Search Console, submit `/sitemap.xml`, confirm Vercel response headers, and test the Play Store handoff on Android hardware.
