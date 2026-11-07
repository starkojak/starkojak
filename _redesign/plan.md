# Starkojak redesign: "Graphite and colour"

STARK's characters are drawn in graphite, and its world is a painted 3D environment. The site uses both:

- **Paper and ink for story moments:** the warm paper ground, black ink, the bold wordmark, panel frames and vertical chapter tabs from the current identity.
- **Full-bleed colour for the world.**

The page is meant to feel calm, cinematic and alive without asking anything of the visitor. The reference is an anime film's official site, not a token landing page.

## Section order (the brief's order, kept)

| # | Section | Ground | Why it sits here |
|---|---|---|---|
| 1 | Hero: the film loop, wordmark, one line, Avnu / StarkLaunchy / X | colour, full-bleed | The world comes first, and every action is on the first screen. |
| 2 | Prologue: four graphite panels with captions | paper | The story begins in pencil, on the page. |
| 3 | Graphite to colour: the signature moment | paper, then colour | It turns the pencil page into the painted world. It has to follow the prologue and lead into the world. |
| 4 | The world: four chapel stills that drift slowly | night | Now that the colour has "arrived", the world is shown large. |
| 5 | The making: blockout to final, scrubbed by the scroll | paper | Back to the page for the production notebook. |
| 6 | Token: the address, copy, the two buy buttons, X | paper | Practical, calm, and easy to find (the top bar's "Buy" jumps here). |
| 7 | Footer: X and the disclaimer | ink | The back cover. |

I kept this order because the page alternates between paper and colour, and the one transition that has to happen on screen, pencil to paint, falls exactly between the prologue and the world.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#e7ddd0` | the page, as before (measured from the art), with a tiling grain (`assets/paper.webp`, 3 KB) |
| `--paper-hi` | `#f4ede0` | the drawing paper of the graphite rendering |
| `--white-out` | `#f5f0e7` | caption boxes, the token card, light buttons |
| `--ink` | `#15130f` | text, panel borders, tabs, the top bar once scrolled, the footer |
| `--tone-60` | `#5f5850` | secondary text on paper (4.9:1 contrast) |
| `--night` | `#0f1115` | the ground behind the colour stills |
| `--mist` | `#ece6da` | text on night and over images |
| `--gold` | `#dcb978` | small labels on the stills, focus rings (golden hour, from the renders) |
| `--vermilion` | `#d24a1e` | only the hanko-style seal that signs the drawing and the prologue's last panel |

Vermilion was the Avnu button's colour. It now appears only on the seal, so the colour that matched the old site's orange arrows no longer carries the page.

## Type (self-hosted Latin subsets, SIL OFL, about 89 KB in all)

- **Dela Gothic One:** the STARKOJAK wordmark, chapter tabs, small headings. This is the current identity.
- **Shippori Mincho 400/500:** every story line and caption. A Japanese Mincho with a literary Latin; it is what gives the film-subtitle tone.
- **Zen Kaku Gothic New 500/700:** buttons, labels, UI.
- **System monospace:** the contract address.

## Motion

Motion follows the normal scroll. Nothing holds or steers the scroll position; the scroll sections are `position: sticky` stages inside tall tracks.

- **Hero:**
  - Shown at first: a responsive poster (AVIF/WebP, portrait crop on phones).
  - The film: requested only after `load` and an idle callback, never with Save-Data or 2G. It fades in on `playing`, pauses when the hero leaves the screen, and has a pause button.
  - Codecs: Chromium and Firefox get VP9 WebM. Safari and every iOS browser get H.264.
- **Prologue:** panels fade up once (1.2 s) and their images move a little with the scroll (about 14 px of parallax).
- **Graphite to colour (WebGL):**
  - The pencil drawing starts as a framed panel on the paper with the line "Every world begins in graphite." The panel opens to full-bleed.
  - Colour washes in, in the order of a precomputed reveal map: the light arrives from the low sun on the left, and the stained-glass and rose windows turn amber first. The edge is frayed by a noise texture and has a slightly darker rim where the pigment pools.
  - Then "Colour comes back the way memory does." and a dusk gradient that hands over to the dark section.
  - The canvas redraws only when the progress changes.
  - Without WebGL, the two images cross-fade instead.
- **The world:**
  - Each still drifts slowly (a 32 s scale/translate loop on the compositor) plus gentle parallax.
  - Captions are a small gold label and one Mincho line.
- **The making:**
  - Eight stacked frames of the same camera. Each stage holds, then cross-fades into the next as you scroll. The final stage holds at the end.
  - Under the frame is a rail with the eight stage labels. Phones show the numbers on the rail and the current stage below it.
- **`prefers-reduced-motion: reduce`:**
  - No film (the poster stays) and no arrivals, drift or parallax.
  - The transition becomes one baked still, half pencil and half paint, with both lines.
  - The making becomes a static 4 × 2 grid (2 × 4 on phones).
  - With no JavaScript, the same still and grid are shown, but the copy (which comes from `content.js`) is missing. A one-line notice asks the visitor to turn JavaScript on.

## Copy

- **Where it lives:** every visible line, alt text and label is in `content.js` (`window.STARK_COPY`), next to the contract address and the three links. The layout reads it through `data-c`, `data-c-alt`, `data-c-aria` and `data-href` attributes. A small inline script at the end of `index.html` fills it in before the first paint, so there is no flash and no layout shift.
- **What stays in the HTML:** the `<head>` metadata (title, description, Open Graph) is static, because link previews do not run scripts. So is the one-line noscript notice.
- **Tone:** the lines are atmosphere only, never plot events: a city in ruins, waking, lost memory, a quiet world waiting to be remembered. There is no hype, no prices and no promises.

## Assets: what was made and how

All scripts are in `tools/redesign/`, which Vercel does not deploy. The chapel folder is only read.

### Hero loop (`hero_loop.py`, `encode_hero.sh`)

- **Source:** shot S1, the open sea and cliffs and the calmest stretch of the film. Its camera orbits the chapel, so the foreground and background move up to about 170 px apart over 8 s, and a plain cross-fade loop would double the cliff.
- **Method:** S1 is played forward from its first frame, where the camera starts at rest, then eased to a stop and played back. The result is seamless with no double image (9.9 s, 238 frames). Near the stop, source frames sit less than a pixel apart and are blended. The work is done in YUV, so the colour is untouched.
- **Encodes** (all tagged like the source: BT.709 with the sRGB transfer, which matches the poster):

  | File | Size | Codec |
  |---|---|---|
  | landscape 1920×1080 | 3.2 MB | H.264 (CRF 21) |
  | landscape 1920×1080 | 1.8 MB | VP9 (CRF 31) |
  | portrait crop 608×1080, for phones | 1.1 MB | H.264 |
  | portrait crop 608×1080, for phones | 0.65 MB | VP9 |

- **Poster:** it is the first frame. In Chrome it differs from the decoded video frame by 1–2 levels out of 255.

### Graphite drawing (`graphite.py`)

Built from the 3840×2160 hero still with numpy and scipy only, planned the way a draughtsman would:

- **Tone:** sunlit stone and sky stay paper, and only the shadows are built up.
- **Contours:** dark-side DoG lines plus colour-opponent edges (stone against sky has little luminance contrast). They have pressure, wobble, gaps and a lighter "searching" second pass.
- **Hatching:** three layers, laid in rows the way a hand lays them, with tapered and slightly curved strokes and patches at three angles.
- **Region strokes:** level strokes on the sea, short upright strokes on the cypresses and shrubs, and an almost blank sky.
- **Finishing:** rubbed graphite in the distant hills and shadows, erased highlights on the glass and the water sparkle, and paper tooth in every stroke.
- **An unfinished edge:** the drawing thins out irregularly towards the frame, and the rocks are left loose.

Web textures: 2560 and 1600 (16:9) and 1080×1920 (portrait), AVIF with WebP fallback.

### Images (`build_assets.py`)

- **Formats:** every image is AVIF plus WebP, in responsive sizes, lazy-loaded below the fold, with width and height set.
- **World stills:** two crops of the 4K hero still (the coast with the ruined castle, and the gable with the stained glass), `key04` (the stairs) and `key05` (the bell). `key01` was left out because it is a frame of the same shot as the hero film. `key03` was left out because `key04` covers the same entrance better.
- **The making:** the eight `progress/plain` frames. Their labels come from `sources.json`.
- **Open Graph:** `assets/og/og-1200x630.jpg` shows the hero still with the wordmark set like a film title.

### Reused from the current site

All of these are re-encoded from the masters in `assets/originals`.

- **Used:**
  - `p2-a`: the bay. Used whole.
  - `p1-star`: the star. Used whole.
  - `p1-face`: cropped to the closed eyes, stopping above the arrows.
  - `p4-b`: cropped between the arrows to the open eye.
  - Both crops were checked for orange pixels: none.
- **Left out because they read as price or pump imagery (orange up-arrows):** `p1-wide`, `p2-b`, `p2-c`, `p2-d`, `p3-c`, `p4-a`, and `mascot`, which is colour and was already unused.
- **Left out for tone:** `p3-a` (the wallet) and `p3-b` (the coin swap). These are transactional, not atmospheric.
- **Still in `assets/`:** the old files stay there, untouched, so nothing is lost. They can be deleted after approval.

## Technical notes

- There is still no build step. Vercel serves the repo root as static files, as it does now.
- **Files:**
  - `index.html`: structure only.
  - `style.css`
  - `script.js`: behaviour, the WebGL scene, the scroll loop.
  - `content.js`: copy, the address, the links.
  - `fonts/`
  - `assets/{hero,prologue,graphite,world,making,og}/`
- **`tools/check-ca.mjs`:** now also checks the Avnu and X links exactly. It still checks that the address appears only in `content.js`. Run `node tools/check-ca.mjs` and it prints `OK`.
- **`.vercelignore`:** now also excludes `_redesign/` (these notes, the screenshots and the Lighthouse reports), so they stay in git and off the website.
- **Rebuilding the assets:**
  1. Run `graphite.py`, then `hero_loop.py`, then `encode_hero.sh`.
  2. Then run `build_assets.py WORK_DIR`.
  3. `build_assets.py` expects the old masters in `assets/originals/`, which is gitignored and present only on this Mac.
