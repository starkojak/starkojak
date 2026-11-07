# Starkojak site: inventory before the redesign

Taken on 2026-11-07, before any change, from `main` at `bb1b056` ("Add Buy on StarkLaunchy next to Buy on Avnu").
The live production site (https://www.starkojak.xyz/) was fetched the same day. Its `index.html`, `style.css`,
`script.js`, `content.js` and `favicon.svg` are byte-identical to `main`.

## 1. Stack and deployment

| Item | Finding |
|---|---|
| Stack | A hand-written static site: `index.html`, `style.css`, `script.js` and `content.js` (vanilla JS, no framework). |
| Build tool | None. There is no `package.json`, no bundler, no `vercel.json` and no build command, so the files are served as they are. |
| Package manager | None for the site. `tools/check-ca.mjs` is a standalone Node script (`node tools/check-ca.mjs`) that checks the contract address. It uses only Node built-ins. |
| Fonts | Google Fonts CSS (Comic Neue 400/700, Dela Gothic One), loaded from fonts.googleapis.com and fonts.gstatic.com. |
| Hosting | Vercel, through its Git integration with GitHub `starkojak/starkojak`. The Vercel project is `oguzhankirikkks-projects/starkojak`, taken from the commit-status target URL. |
| How Vercel deploys it | On every push, `vercel[bot]` creates a GitHub deployment and sets a "Vercel" commit status. With no build step, Vercel uploads the repo root as static files. `.vercelignore` excludes `tools/` and `DESIGN.md`: both return 404 on the live site. `README.md` also returns 404. |
| Production branch | **`main`**. All 7 deployments in the repo's history (`f213070` to `bb1b056`) are in the **Production** environment and come from `main`. `main` is also the default branch. It has no branch protection. |
| Preview deployments for other branches | **Probably yes, but this is not yet verified.** Vercel's Git integration creates a Preview deployment for every push to a non-production branch unless that is switched off. Nothing in the repo switches it off: there is no `vercel.json` with `git.deploymentEnabled` and no ignore script. The dashboard settings (Ignored Build Step, branch rules) can't be read without a Vercel login, and the Vercel CLI isn't installed. No preview has ever been made because `main` has been the only branch. Pushing `redesign` will settle the question. |
| Domains | `https://starkojak.xyz/` returns a 308 redirect to `https://www.starkojak.xyz/`, which serves the site. `https://starkojak.vercel.app/` also serves it (200) and is the GitHub repo's "homepage" field. The canonical and OG URLs in the HTML point at `https://starkojak.xyz/`. |
| GitHub CLI | `gh` is logged in as `starkojak` (admin on the repo, `repo` scope). |
| Local state found | `main` has an uncommitted change to `.gitignore` that adds `video/` and `trailer/`. It is left as it is and will not be committed. |

## 2. Sections and every piece of visible text (verbatim)

The page reads as a four-page manga chapter on warm paper. Each "sheet" has a vertical chapter tab in the left
margin, which lies flat above the content on phones, and a page number (nombre) at the bottom right.

### Top bar (sticky, 48 px)
- Brand: `Starkojak` (links to `#top`)
- `Buy on Avnu` (boxed; hidden at ≤600 px)
- `Buy on StarkLaunchy` (boxed; hidden at ≤600 px)
- `Buy` (boxed; shown only at ≤600 px; links to `#chapter-3`)
- X icon (SVG), `aria-label="Starkojak on X"`

### Page 1 (`#chapter-1`)
- Tab: `Chapter 1: The Dream`
- H1: `STARKOJAK`, with a screentone drop shadow drawn from `data-text="STARKOJAK"`
- Tagline: `A meme coin on Starknet.`
- Panel p1-wide caption: `Somewhere above the bay.`
- Panel p1-face (no caption)
- Balloon: `I just woke up from a dream.`, shown upper-case through CSS
- Panel p1-star (no caption)
- Nombre: `1`

### Page 2 (`#chapter-2`, "calm")
- Tab: `Chapter 2: The Quiet Part`
- p2-a caption: `Starkojak sat at the edge and waited for nothing in particular.`
- p2-b caption: `Something small came up out of the ground.`
- p2-c caption: `More followed. Starkojak went back to sleep.`
- p2-d balloon: `Is this still the dream?`, upper-case through CSS
- Nombre: `2`

### Page 3 (`#chapter-3`)
- Tab: `Chapter 3: Finding Starkojak`
- p3-a band: `1. Get a Starknet wallet.`
- p3-b band: `2. Get some STRK and swap it on Avnu or StarkLaunchy.`
- Buttons: `Buy on Avnu` (vermilion), `Buy on StarkLaunchy` (white-out)
- p3-c band: `3. Receive Starkojak.`
- Contract box: heading `Contract address`; the full address (shortened on phones to `0x01576E…f77c45`); button `Copy` (changes to `Copied` for 1.8 s); note `Always check the contract address before you swap.`; a visually hidden live region that reads `Copied`
- Nombre: `3`

### Page 4 (`#chapter-4`, "final")
- Tab: `Final Chapter`
- p4-a caption: `More showed up.`
- p4-b (no caption)
- End panel: `To be continued.` and the button `Follow on X`
- A four-pointed star ornament (SVG)
- Nombre: `4`

### Footer
- `Starkojak is a meme coin with no intrinsic value and no promise of return. Nothing here is financial advice. Do your own research.`

### Image alt texts (verbatim)
- p1-wide: `A hillside above a wide bay at sunset, three tall orange arrows standing in the brush.`
- p1-face: `Close-up of Starkojak's face, eyes shut, a four-pointed star on the head and two orange arrows behind.`
- p1-star: `Extreme close-up of the pale star on Starkojak's dark head.`
- p2-a: `Starkojak, small and seen from behind, sitting on a rock ledge above the bay as the sun sets.`
- p2-b: `Starkojak lying low, one eye half open, watching a tiny orange arrow push up through the soil.`
- p2-c: `Starkojak asleep in the foreground while dozens of orange arrows stand on the hill behind.`
- p2-d: `Starkojak sitting cross-legged, eyes closed, in a field of orange arrows that runs to the horizon.`
- p3-a: `Starkojak looking down at a small black wallet held in both hands.`
- p3-b: `A finger resting on one of two coins, with curved arrows between them showing a swap.`
- p3-c: `Starkojak, eyes closed and smiling, holding up a coin with a four-pointed star on it.`
- p4-a: `A crowd of round-headed figures with stars on their heads, seen from behind, facing a large setting sun over the sea.`
- p4-b: `Starkojak glancing sideways with one eye open, orange arrows and the bay behind.`

## 3. Images, video and fonts

All the art is graphite or pencil style on warm paper. Orange arrows are the only colour in it.

| File | Pixels | Bytes | Used | Contents |
|---|---|---|---|---|
| `assets/p1-wide.webp` | 1536×1024 | 551,774 | page 1 (`fetchpriority=high`) | bay at sunset, **three big orange arrows** |
| `assets/p1-face.webp` | 1024×1536 | 490,692 | page 1 | face, eyes closed, star; **two orange arrows at the right edge** |
| `assets/p1-star.webp` | 1254×1254 | 510,632 | page 1 | extreme close-up of the star, no arrows |
| `assets/p2-a.webp` | 1536×1024 | 496,848 | page 2 (lazy) | small figure on a ledge above the bay, no arrows |
| `assets/p2-b.webp` | 1254×1254 | 417,078 | page 2 (lazy) | **arrow pushing out of the soil** |
| `assets/p2-c.webp` | 1024×1536 | 550,874 | page 2 (lazy) | asleep, **a hill full of arrows** |
| `assets/p2-d.webp` | 1536×1024 | 462,802 | page 2 (lazy) | **a field of arrows** |
| `assets/p3-a.webp` | 1254×1254 | 598,596 | page 3 (lazy) | holding a wallet, no arrows |
| `assets/p3-b.webp` | 1536×1024 | 620,170 | page 3 (lazy) | swapping two coins |
| `assets/p3-c.webp` | 1254×1254 | 425,790 | page 3 (lazy) | holding a coin, **orange arrows around** |
| `assets/p4-a.webp` | 1536×1024 | 595,506 | page 4 (lazy) | crowd facing the sun, **arrows spread across the frame** |
| `assets/p4-b.webp` | 958×1478 | 632,840 | page 4 (lazy) | one eye open, star; **arrows to the left and right** |
| `assets/mascot.webp` | 1272×898 | 63,690 | **not referenced** | colour render of the mascot with orange arrows |
| `assets/og-image.jpg` | 1024×1536 | 474,643 | `og:image`, `twitter:image` | the p1-face art as a JPEG (portrait, with arrows) |
| `favicon.svg` | vector | 224 | `<link rel="icon">` | ink rounded square with a paper-coloured four-pointed star |
| `assets/originals/*.png` | — | 1.5–4.7 MB each | gitignored | PNG masters of all of the above |

- **Video:** none on the current site.
- **Fonts** (Google Fonts, `display=swap`; only the subsets below load for this page's text):
  - Comic Neue 400 latin, 13,220 B
  - Comic Neue 700 latin, 12,800 B
  - Dela Gothic One 400 latin, 13,800 B (plus latin-ext 9,040 B, which loads only if needed)

## 4. Colours and type (from `style.css` and `DESIGN.md`)

| Token | Hex | Use |
|---|---|---|
| `--sumi` | `#15130f` | ink: borders, text, balloon strokes |
| `--paper` | `#e7ddd0` | page ground, measured from the art |
| `--white-out` | `#f5f0e7` | inside balloons and caption boxes |
| `--tone-30` | `#b9b0a3` | light screentone |
| `--tone-60` | `#6e675e` | secondary text, page numbers |
| `--vermilion` | `#e2501b` | measured from the arrows; used only on the Avnu button |

- **Typefaces:**
  - Dela Gothic One: title, tabs, contract-box label, end line.
  - Comic Neue 400/700: everything else.
  - System monospace: the address.
- **Panels:** 4 px ink borders, diagonal gutters made with `clip-path`, dot screentone made with radial gradients and masks, and speech balloons with SVG tails.

## 5. How the current scroll story works
- **Normal document scroll.** There is no scroll-jacking, no sticky scenes, no parallax and no scroll-scrubbing. Only the top bar is sticky.
- **Reveals.** `script.js` uses an `IntersectionObserver` (threshold 0.2, root margin −6% at the bottom) to add `.is-in` to every `.snap` element once, with a 90 ms stagger. CSS keyframes then play:
  - `snap`: a 230 ms drop from scale 1.035.
  - `slam`: 460 ms, on the page 1 face.
  - `pop`: the balloons, 420 ms after their panel.
  - `settle`: on page 2, a 380 ms fade up.
- **Fallbacks.** The hidden state applies only when JS runs (`html.js`). `prefers-reduced-motion: reduce` shows everything with no animation.
- **Scripts.** `script.js` also writes the contract address from `content.js` into `[data-ca]` and its short form into `[data-ca-short]`, and sets every `[data-starklaunchy]` link's `href`.
- **Copy button.** It uses `navigator.clipboard.writeText` and falls back to `execCommand("copy")`. If both fail, it selects the address text.

## 6. Links, contract address, analytics, meta

- **Buy on Avnu:** `https://app.avnu.fi/en?sellToken=strk&buyToken=starkojak`
  - Written as `&amp;` in the HTML.
  - Used twice: top bar and page 3.
  - Opens with `target="_blank" rel="noopener noreferrer"`.
- **Buy on StarkLaunchy:** `https://starklaunchy.fun/token/0x1576eb581192ad3b05c27836c4b324d89c6814cc3ab44f476507d58e6f77c45?side=buy`
  - Defined once as `STARKLAUNCHY_URL` in `content.js` and set by `script.js`.
  - Used twice: top bar and page 3.
  - The token in the URL is the contract address in lower case with the leading zero dropped. `check-ca.mjs` checks that the two are equal.
- **X:** `https://x.com/Starkojak`. Used twice: the top-bar icon and "Follow on X".
- **Contract address:** `0x01576Eb581192ad3b05C27836C4b324D89c6814Cc3Ab44F476507D58e6f77c45`
  - 66 characters, mixed case.
  - Defined once as `STARKOJAK_CA` in `content.js`. `node tools/check-ca.mjs` prints `OK`.
  - Character by character:
    `0 x 0 1 5 7 6 E b 5 8 1 1 9 2 a d 3 b 0 5 C 2 7 8 3 6 C 4 b 3 2 4 D 8 9 c 6 8 1 4 C c 3 A b 4 4 F 4 7 6 5 0 7 D 5 8 e 6 f 7 7 c 4 5`
- **Analytics:** none in the page, so no analytics script runs. The Vercel project seems to have Speed Insights switched on: `/_vercel/speed-insights/script.js` returns 200. The page never loads that script, so nothing is collected. Vercel Web Analytics is off: `/_vercel/insights/script.js` returns 404. There are no third-party trackers.
- **Head tags** (verbatim values):
  - `<title>`: `Starkojak — a meme coin on Starknet`
  - `description`: `Starkojak is a meme coin on Starknet, told as a short manga chapter.`
  - `theme-color`: `#e7ddd0`
  - `canonical`: `https://starkojak.xyz/`
  - `og:type` `website` · `og:url` `https://starkojak.xyz/` · `og:title` `Starkojak` · `og:description` `A meme coin on Starknet.`
  - `og:image` `https://starkojak.xyz/assets/og-image.jpg` (1024×1536) · `og:image:alt` `Starkojak, eyes closed, a four-pointed star on the head.`
  - `twitter:card` `summary_large_image` · `twitter:image` `https://starkojak.xyz/assets/og-image.jpg`
  - Icon: `/favicon.svg` (`image/svg+xml`). There is no apple-touch-icon, no manifest, no robots.txt and no sitemap; both of the last two return 404.
- **Favicon source:** `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#15130f"/><path d="M16 3.5Q17.9 14.1 28.5 16Q17.9 17.9 16 28.5Q14.1 17.9 3.5 16Q14.1 14.1 16 3.5Z" fill="#e7ddd0"/></svg>`

## 7. Screenshots (`_redesign/before/`)

The screenshots were taken from the live production URL in headless Chromium 130 (Playwright). Before each capture
the whole page was scrolled so that every reveal and lazy image had fired. The viewport was then grown to the full
page height, because Chromium's own full-page mode left the page 1 star panel unpainted. Files are JPEG q88.

| File | Size |
|---|---|
| `desktop-1440-full.jpg` | 1440×6223 CSS px at DPR 1 |
| `mobile-390-full.jpg` | 390×6104 CSS px at DPR 2, saved as 780×12208 px |

No console errors were seen on either viewport.

## 8. New material for the redesign (`~/Desktop/STARK_CLIFF_CHAPEL`, read-only)

| Source | Facts |
|---|---|
| `renders/final/cliff_chapel_silent.mp4` | 1920×1080, 24 fps, 888 frames, 37.0 s, H.264 High, yuv420p, BT.709 tagged with the sRGB transfer curve, no audio, 42.1 MB. It has four shots: S1 the sea and cliffs, S2 the approach to the hero view, S3 the entrance stairs, S4a the bell tower. |
| `renders/stage_11b/stills/` | `CAM_Hero_3840x2160.png` (the hero view of the chapel on its cliff); `key01_S1_f120` (the coast and cliffs from the sea); `key03_S3_f001` (the entrance terrace); `key04_S3_f216` (the stairs and the door); `key05_S4a_f216` (the bell tower). All the key stills are 1920×1080 PNG. |
| `renders/stage_11b/progress/` | 8 milestones of the same CAM_Hero framing at 1600×900, each in `plain/` and `labelled/` versions, plus `progress_sheet.png`. The labels, from `sources.json`: Blockout, Architecture, Materials, Cliffs, Painted look, Vegetation, Sea and sky, Final. |
| How it was made (`CLAUDE.md` of that project) | "Build, entirely from Python scripts, a 3D environment in Blender", rendered in EEVEE with a painterly compositor stage. |
