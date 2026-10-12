# Starkojak — design plan

A single vertical page that reads like a four-page chapter of a quiet seinen manga,
printed on cheap off-white stock. Not a pop-art comic: no Ben-Day explosions, no
yellow caption boxes, no tilted "POW" panels. The tone is dry and still; the page
breathes through its margins.

## What keeps it from looking like every comic site

- **Printed-volume furniture.** Each page is a sheet with a vertical chapter tab in
  the outer margin (like a tankōbon thumb index) and a small page number (nombre)
  at the foot. On phones the tab lies flat above the title.
- **Fine screentone, not big dots.** Halftone is a 5px dot grid that fades out
  (CSS radial-gradient + mask), used sparingly: behind the title shadow and in one
  "quiet" panel that holds the balloon.
- **Irregular gutters.** Rows are separated by wider gutters than columns, and one
  gutter runs on a diagonal. Speech balloons break panel borders.
- **Colour discipline.** Vermilion appears only where the art already has it (the
  arrows) and on exactly one button: the Avnu swap button on page 3.

## Colours

| Token        | Hex       | Use                                                       |
|--------------|-----------|-----------------------------------------------------------|
| `--sumi`     | `#15130f` | Ink: panel borders, text, balloon strokes                 |
| `--paper`    | `#e7ddd0` | Page ground, measured from the art (mean of paper pixels) |
| `--white-out`| `#f5f0e7` | Inside balloons and caption boxes (correction-fluid white)|
| `--tone-30`  | `#b9b0a3` | Light screentone, hairlines                               |
| `--tone-60`  | `#6e675e` | Secondary text, page numbers                              |
| `--vermilion`| `#e2501b` | Measured from the arrows. Avnu button only.               |

## Type

- **Dela Gothic One** — title and chapter tabs. A heavy Japanese gothic with
  blunt corners: reads as an effect/title face, not a web font.
- **Comic Neue** (400/700) — balloons, captions, UI. Upright, round, hand-lettered.
- System monospace — contract address only.

## Page 1 layout

Desktop (sheet max ~1040px, 12 columns; row gutter 28px, column gutter 14px)

```
 ┌──┐
 │C │  STARKOJAK                      ← Dela Gothic, huge, halftone drop shadow
 │H │  A meme coin on Starknet.
 │1 │ ┌──────────────────────────────────────────────┐
 │  │ │▌Somewhere above the bay.                     │
 │  │ │            p1-wide  (3:2, full width)        │
 └──┘ └──────────────────────────────────────────────┘
      ┌───────────────────────────┐ ┌────────────────┐
      │                           │ │ ░░░░░░░░░░░░░░ │
      │                           │◄──( I just woke ) │  balloon breaks the border,
      │      p1-face  (2:3)       │ │ ░( up from a  ) │  tail points at the face
      │      7 columns            │ │ ░░(  dream.  )░ │
      │      the big moment       │ │ ░░░░░░░░░░░░░░ ╱
      │                           │ ╱───────────────╱  ← diagonal gutter
      │                           │ │   p1-star     │
      │                           │ │   (1:1)       │
      └───────────────────────────┘ └────────────────┘
                                                  1
```

Phone (390px): one column in reading order — tab, title, p1-wide, p1-face,
balloon panel (tail points up into the face), p1-star.

Pages 2–4 follow the same sheet system (to be built after approval).

## Motion

Panels snap into place once as they scroll in: a 220ms drop from 1.03 scale,
staggered ~90ms. The face panel on page 1 is the only big moment: a heavier slam,
then the balloon pops. Everything else is still. `prefers-reduced-motion` and
no-JS both show the final state with no animation.
