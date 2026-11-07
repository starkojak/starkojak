# Screenshots of the redesign

Taken on 2026-11-07 in headless Chromium 130 (Playwright) from a local static server, with brotli and byte-range support, serving this branch.

| Folder or file | What it holds |
|---|---|
| `desktop-1440/` | One viewport (1440×900, DPR 1) per section and per scroll state |
| `mobile-390/` | The same at 390×844, DPR 2 |
| `desktop-1440-full.jpg`, `mobile-390-full.jpg` | The full page as it looks while scrolling |
| `reduced-motion/` | The same sections with `prefers-reduced-motion: reduce` |

**Scroll states.** `03-graphite-to-colour-pNNN` shows the signature transition at NNN % of its scroll track, and the `05-making-*` files show the scrubbed progress sequence.

**How the full-page images were made.** They are stitched from one viewport per scroll step. Because the page has sticky, scroll-driven stages, a normal "full page" capture would not show what a visitor sees. The top bar appears only in the first frame.

**What `reduced-motion/` shows.** There is no film (the poster stays), a static half-drawing, half-painting still, the making as a grid, and no drift.
