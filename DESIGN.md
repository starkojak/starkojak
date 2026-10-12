# Starkojak — Design Notes

The site is an old, leather-bound field journal lying open on a dark walnut desk,
lit by a single warm lamp from the upper left. Follow these decisions in future work.

## Language
- All site copy is **English** (`<html lang="en">`): headings, buttons, aria-labels, placeholder text.
- Placeholder copy is short, plain and book-toned. No lorem ipsum.

## Palette
| Name          | Hex       | Role |
|---------------|-----------|------|
| Iron-gall Ink | `#2A1E16` | Body text, ink drawings |
| Vellum        | `#E6D5B0` | Paper base (fallback before textures render) |
| Foxing        | `#9A6A36` | Stains, scorched edges, folios, rules |
| Oxblood       | `#4B1A16` | Leather cover and boards |
| Gilt          | `#C8A04A` | Cover tooling, focus rings, UI on the desk |
| Walnut Night  | `#140D08` | Desk / page background |
| Rubric        | `#8E2B1D` | Drop caps only (medieval rubrication) — use sparingly |

## Typography
| Role | Font | Notes |
|------|------|-------|
| Display: cover title, page titles, folios | **Cormorant SC** 600/700 | Crisp engraved capitals; gilt on the cover |
| Body text | **IM Fell English** (+ italic) | Real letterpress irregularity reads as ink on paper |
| Handwritten notes, captions, hint | **La Belle Aurore** | Quill-pen cursive; only for short notes (≥ 1.2em) |

- Line length ≤ 62ch (hard cap 70). Body line-height 1.55.
- Type scales with the page via container units (`cqw`), with a 13.5px floor for phones.

## Light & depth
- One light source: warm, upper-left. Highlights fall top-left, shadows fall bottom-right — everywhere.
- Book tilted `rotateX(7deg)` in perspective on desktop; flat on phones.
- Page-block thickness on each side tracks reading progress.
- Gutter shadow lives inside each page so it turns with the page.

## Layers (bottom → top)
1. Procedural walnut desk (SVG feTurbulence rendered once to WebP)
2. Lamp pool + vignette (CSS gradients)
3. Book contact shadow
4. Leather boards (front/back cover edges)
5. Page stacks (striped edges)
6. StPageFlip pages (paper textures, ink, content)
7. Lighting overlay on the book (highlight + shade)
8. Dust motes canvas (off with `prefers-reduced-motion`)

## Paper
- Each page gets its own seeded texture: surface undulation (diffuse lighting), fibres, grain,
  foxing blotches, speckles, ink/coffee drops, scorched edges, deckled edge; some pages torn.
- Textures are rendered once to compressed WebP blobs, never re-filtered per frame.

## Decisions that replaced defaults
- IM Fell for headings (the "every old-book site" choice) → moved to body text; titles use Cormorant SC.
- Caveat (modern marker) → La Belle Aurore (quill).
- Brown leather → oxblood.
- Flat beige gradient paper → per-page procedural textures with different stain patterns.
- All-brown palette → rubric red reserved for drop caps.

## Boldness budget
- Spend it on the opening moment (closed gilt book → 3D cover opening) and the page turn.
- Everything else stays calm: no hover effects except the two nav buttons, no extra ornaments.

## Content
- All text lives in `content.js`. Page types: `contents`, `text`, `drawing`, `photo`, `list`, `notes`, `contact`.
- Ink drawings (star chart, castle, compass rose) are original SVG in `art.js`.
- `photo: ""` renders a generated sepia placeholder; set it to an image path to use a real photo.
