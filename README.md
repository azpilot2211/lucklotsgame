# luckylotsgame.com

Marketing site + legal pages for **Lucky Lots: Card City**.

Static site, no build step — push to main and Vercel auto-deploys
to luckylotsgame.com.

- index.html — landing page. The hero scrubs a 15s cinematic
  neighborhood movie on desktop (frames/desktop/, 150 frames): builders
  over blueprints, a kid on a big wheel, the burglar spilling coins, the
  fire truck with a hanging fireman, a block party, and a balloon that
  escapes up to the LUCKY LOTS banner in the sky. Mobile scrubs the
  original portrait promo (frames/, 120 frames). One canvas engine,
  switched at 820px; scroll advances the frames, then the page scrolls
  on into reveal-animated sections with CSS scroll-driven parallax
  (animation-timeline: view(); progressive enhancement, no JS).
- privacy.html / terms.html — the URLs the Play Console data-safety
  form and store listing point at.
- frames/desktop/ — hero movie frames (Higgsfield Cinematic Studio,
  job fa6c8a1a; extracted at fps=10). frames/ — promo frames from
  assets/demo-video/lucky-lots-promo.mp4 in the game repo.
- art/scene/keyframes/ — the 5 storyboard stills the movie was
  generated from (rendered from game art; regeneration recipe).
- tests/hero-smoke.test.mjs — node tests/hero-smoke.test.mjs
