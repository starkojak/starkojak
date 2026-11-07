#!/usr/bin/env python3
"""Builds every web image for the redesign. Sources are only read:
  ~/Desktop/STARK_CLIFF_CHAPEL/renders/stage_11b/stills, .../progress/plain   (chapel renders)
  assets/originals/*.png                                                   (the old site's graphite art)
  WORK/graphite/graphite_3840x2160.png    (from graphite.py)
  WORK/hero/boomerang_master.mkv          (from hero_loop.py; poster = its first frame)
  WORK/fonts_ttf/DelaGothicOne-Regular.ttf (for the Open Graph image only)

Usage: python3 tools/redesign/build_assets.py WORK_DIR
Writes into assets/{hero,prologue,graphite,world,making,og}/ and assets/paper.webp.
"""
import io
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CHAPEL = os.path.expanduser("~/Desktop/STARK_CLIFF_CHAPEL/renders/stage_11b")
OUT = os.path.join(REPO, "assets")
STAGES = ["01_blockout", "02_architecture", "03_materials", "04_cliffs", "05_painted_look",
          "06_vegetation", "07_sea_and_sky", "08_final"]


def save(img, base, widths, q_avif=60, q_webp=80, avif=True):
    """Save `img` at each width as AVIF and WebP; returns the list of written files."""
    os.makedirs(os.path.dirname(base), exist_ok=True)
    out = []
    for w in widths:
        h = round(img.height * w / img.width)
        im = img if (w, h) == img.size else img.resize((w, h), Image.LANCZOS)
        p = f"{base}-{w}.webp"
        im.save(p, "WEBP", quality=q_webp, method=6)
        out.append(p)
        if avif:
            p = f"{base}-{w}.avif"
            im.save(p, "AVIF", quality=q_avif, speed=4)
            out.append(p)
    return out


def crop_aspect(img, aspect, cx=0.5, cy=0.5):
    """Largest crop of the given aspect (w/h) centred near (cx, cy), kept inside the image."""
    W, H = img.size
    if W / H > aspect:
        w, h = round(H * aspect), H
    else:
        w, h = W, round(W / aspect)
    x0 = min(max(0, round(cx * W - w / 2)), W - w)
    y0 = min(max(0, round(cy * H - h / 2)), H - h)
    return img.crop((x0, y0, x0 + w, y0 + h))


def periodic_noise(n, sigma, rng):
    """Tileable noise: white noise filtered in the frequency domain wraps around by construction."""
    f = np.fft.fft2(rng.standard_normal((n, n)))
    k = np.fft.fftfreq(n)
    kx, ky = np.meshgrid(k, k)
    f *= np.exp(-2 * (np.pi * sigma) ** 2 * (kx ** 2 + ky ** 2))
    z = np.fft.ifft2(f).real
    return (z - z.mean()) / (z.std() + 1e-9)


def reveal_map(W, H, rng):
    """Order in which the drawing turns to colour (0 first .. 1 last): the light arrives from the
    low sun on the left, the rose and tall windows catch it early, and the edge wanders like a wash."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    ax, ay = xx / H, yy / H                       # isotropic units (height = 1)
    sx, sy = -0.15, 0.30
    d = np.hypot(ax - sx, ay - sy)
    n = np.zeros((H, W), np.float32)
    for k, (sc, amp) in enumerate([(0.22, 0.55), (0.09, 0.3), (0.04, 0.15)]):
        g = rng.standard_normal((int(H / (sc * H)) + 4, int(W / (sc * H)) + 4)).astype(np.float32)
        z = ndi.zoom(g, (H + 3 * sc * H) / g.shape[0], order=3, prefilter=False)[:H, :W]
        n += amp * (z - z.mean()) / (z.std() + 1e-6)
    m = d + 0.16 * n
    # the tall stained-glass window (an upright ellipse) and the rose window catch the light first
    for wx, wy, sx_, sy_, a in [(0.503 * 16 / 9, 0.425, 0.03, 0.07, 0.7), (0.500 * 16 / 9, 0.245, 0.02, 0.02, 0.45)]:
        m -= a * np.exp(-((ax - wx) ** 2 / (2 * sx_ * sx_) + (ay - wy) ** 2 / (2 * sy_ * sy_)))
    r = np.argsort(np.argsort(m.ravel())).reshape(H, W).astype(np.float32)   # equalise: area grows evenly
    m = r / r.max()
    return ndi.gaussian_filter(m, 1.2)


def composite_split(graphite, colour, m, p=0.5, edge=0.035):
    """What the transition shows at progress p, baked into one still (the reduced-motion view)."""
    g = np.asarray(graphite, np.float32) / 255
    c = np.asarray(colour, np.float32) / 255
    mm = np.asarray(Image.fromarray((m * 65535).astype(np.uint16)).resize(graphite.size, Image.BICUBIC),
                    np.float32) / 65535
    a = np.clip((p - (mm - edge)) / (2 * edge), 0, 1)
    a = a * a * (3 - 2 * a)
    band = (1 - np.abs(a * 2 - 1)) ** 2
    out = g * (1 - a[..., None]) + c * a[..., None]
    out *= (1 - 0.10 * band)[..., None]
    return Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8))


def main():
    work = os.path.abspath(sys.argv[1])
    rng = np.random.default_rng(23)
    written = []

    # ---------------------------------------------------------------- hero posters
    poster = os.path.join(work, "hero", "poster_frame0.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(work, "hero", "boomerang_master.mkv"),
                    "-vf", "select=eq(n\\,0),scale=in_color_matrix=bt709:in_range=limited:out_range=full,format=rgb24",
                    "-frames:v", "1", "-update", "1", poster], check=True)
    p = Image.open(poster).convert("RGB")
    written += save(p, f"{OUT}/hero/poster", [1920, 1280, 960], q_avif=58, q_webp=78)
    written += save(p.crop((896, 0, 896 + 608, 1080)), f"{OUT}/hero/poster-portrait", [608], q_avif=58, q_webp=78)

    # ---------------------------------------------------------------- prologue (old site graphite art)
    orig = os.path.join(REPO, "assets", "originals")
    bay = Image.open(f"{orig}/p2-a.png").convert("RGB")
    eyes = Image.open(f"{orig}/p1-face.png").convert("RGB").crop((0, 300, 1024, 820))     # stops above the arrows
    star = Image.open(f"{orig}/p1-star.png").convert("RGB")
    wake = Image.open(f"{orig}/p4-b.png").convert("RGB").crop((186, 120, 890, 1050))     # between the arrows
    # the screentone grain is costly to encode; q46 keeps it readable at panel size
    written += save(bay, f"{OUT}/prologue/bay", [1536, 1200, 720], q_avif=46, q_webp=72)
    written += save(eyes, f"{OUT}/prologue/eyes", [1024, 720], q_avif=46, q_webp=72)
    written += save(star, f"{OUT}/prologue/star", [800, 480], q_avif=46, q_webp=72)
    written += save(wake, f"{OUT}/prologue/wake", [704, 480], q_avif=46, q_webp=72)

    # ---------------------------------------------------------------- graphite to colour
    colour4k = Image.open(f"{CHAPEL}/stills/CAM_Hero_3840x2160.png").convert("RGB")
    graphite4k = Image.open(os.path.join(work, "graphite", "graphite_3840x2160.png")).convert("RGB")
    assert graphite4k.size == colour4k.size
    # landscape textures, and a 9:16 crop around the chapel for portrait phones
    pc = (1600, 0, 1600 + 1215, 2160)
    for name, img in [("colour", colour4k), ("graphite", graphite4k)]:
        written += save(img, f"{OUT}/graphite/{name}", [2560, 1600], q_avif=62, q_webp=80)
        written += save(img.crop(pc).resize((1080, 1920), Image.LANCZOS), f"{OUT}/graphite/{name}-portrait", [1080],
                        q_avif=62, q_webp=80)
    m = reveal_map(1024, 576, rng)
    Image.fromarray((m * 255 + 0.5).astype(np.uint8)).save(f"{OUT}/graphite/reveal-map.png", optimize=True)
    mp = m[:, round(pc[0] / 3840 * 1024): round(pc[2] / 3840 * 1024)]
    Image.fromarray((mp * 255 + 0.5).astype(np.uint8)).resize((324, 576), Image.BICUBIC).save(
        f"{OUT}/graphite/reveal-map-portrait.png", optimize=True)
    written += [f"{OUT}/graphite/reveal-map.png", f"{OUT}/graphite/reveal-map-portrait.png"]
    split = composite_split(graphite4k.resize((1920, 1080), Image.LANCZOS), colour4k.resize((1920, 1080), Image.LANCZOS),
                            m, p=0.5)
    written += save(split, f"{OUT}/graphite/split", [1920, 1280], q_avif=62, q_webp=80)

    # ---------------------------------------------------------------- the world
    coast = colour4k.crop((0, 760, 1920, 1840))
    window = colour4k.crop((1640, 180, 2720, 1620))
    stairs = crop_aspect(Image.open(f"{CHAPEL}/stills/key04_S3_f216_1920x1080.png").convert("RGB"), 3 / 4, cx=0.5)
    bell = Image.open(f"{CHAPEL}/stills/key05_S4a_f216_1920x1080.png").convert("RGB")
    written += save(coast, f"{OUT}/world/coast", [1920, 1280, 800])
    written += save(window, f"{OUT}/world/window", [1080, 720])
    written += save(stairs, f"{OUT}/world/stairs", [810, 540])
    written += save(bell, f"{OUT}/world/bell", [1920, 1280, 800])

    # ---------------------------------------------------------------- the making
    for i, st in enumerate(STAGES):
        im = Image.open(f"{CHAPEL}/progress/plain/{st}.png").convert("RGB")
        written += save(im, f"{OUT}/making/{st[:2]}", [1600, 960], q_avif=60, q_webp=80)

    # ---------------------------------------------------------------- paper tile
    n = 320
    grain = 0.55 * periodic_noise(n, 0.7, rng) + 0.3 * periodic_noise(n, 2.2, rng) + 0.35 * periodic_noise(n, 18, rng)
    paper = np.array([231, 221, 208], np.float32)                       # #e7ddd0, the site's paper
    tile = np.clip(paper[None, None, :] * (1 + 0.022 * grain[..., None]), 0, 255).astype(np.uint8)
    Image.fromarray(tile).save(f"{OUT}/paper.webp", "WEBP", quality=82, method=6)
    written.append(f"{OUT}/paper.webp")

    # ---------------------------------------------------------------- Open Graph image (1200x630)
    # the chapel full-bleed, the wordmark under it like a film title, on a soft shade
    og = crop_aspect(colour4k, 1200 / 630, cx=0.5, cy=0.40).resize((1200, 630), Image.LANCZOS).convert("RGBA")
    shade = np.zeros((630, 1200, 4), np.float32)
    yy = np.linspace(0, 1, 630)[:, None]
    shade[..., 3] = np.clip((yy - 0.48) / 0.52, 0, 1) ** 1.3 * 0.78 * 255
    shade[..., :3] = [10, 11, 14]
    og = Image.alpha_composite(og, Image.fromarray(shade.astype(np.uint8))).convert("RGB")
    ttf = os.path.join(work, "fonts_ttf", "DelaGothicOne-Regular.ttf")
    font = ImageFont.truetype(ttf, 104)
    small = ImageFont.truetype(ttf, 22)
    d = ImageDraw.Draw(og)
    tw = d.textlength("STARKOJAK", font=font)
    x = (1200 - tw) / 2
    d.text((x, 452), "STARKOJAK", font=font, fill=(245, 240, 231))
    sub = "A MEME COIN ON STARKNET"
    sw = d.textlength(sub, font=small) + 0.16 * 22 * (len(sub) - 1)
    cx = (1200 - sw) / 2
    for ch in sub:                                    # letter-spaced, like the site's labels
        d.text((cx, 576), ch, font=small, fill=(220, 185, 120))
        cx += d.textlength(ch, font=small) + 0.16 * 22
    os.makedirs(f"{OUT}/og", exist_ok=True)
    og.save(f"{OUT}/og/og-1200x630.jpg", "JPEG", quality=86, optimize=True, progressive=True)
    written.append(f"{OUT}/og/og-1200x630.jpg")

    total = 0
    for f in written:
        total += os.path.getsize(f)
    print(f"{len(written)} files, {total / 1e6:.2f} MB")
    for f in sorted(written):
        print(f"  {os.path.relpath(f, REPO):44s} {os.path.getsize(f):>9,d}")


if __name__ == "__main__":
    main()
