#!/usr/bin/env python3
"""Hand-drawn graphite rendering of the chapel's hero still.

Builds a pencil drawing from the colour painting, the way a draughtsman would plan it:
  - a tone plan of light and shadow (sunlit stone and sky stay paper, shadows are built up),
  - contour lines with pressure, wobble, gaps and a lighter "searching" second pass,
  - hatching in coherent patches: tapered, slightly curved strokes on a jittered lattice,
    one direction for light shade, a crossing layer for shadow, a third for the darkest,
    level strokes on the sea, short upright strokes on the foliage, soft level strokes in the sky,
  - a smudged graphite wash under the hatching, erased highlights, paper tooth,
  - a drawing that thins out towards the edges, the way a sketch is left unfinished.

Usage:
  python3 tools/redesign/graphite.py SRC.png OUT_DIR [--scale 0.5] [--seed 11] [--debug]

Writes OUT_DIR/graphite_<W>x<H>.png (RGB). Needs numpy, scipy and Pillow only.
The source image is only read. Region shapes are written for the CAM_Hero framing.
"""
import argparse
import os
import time

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.signal import fftconvolve

np.seterr(over="ignore")

# The drawing paper is a touch lighter than the site's page colour (#e7ddd0),
# so the drawing reads as a sheet laid on the page.
PAPER = np.array([0.957, 0.929, 0.878], np.float32)      # #f4ede0
GRAPHITE = np.array([0.155, 0.156, 0.172], np.float32)


# ----------------------------------------------------------------------------- helpers

def log(t0, msg):
    print(f"[{time.time() - t0:6.1f}s] {msg}", flush=True)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def smooth_noise(shape, scale, rng):
    """Band-limited noise with features about `scale` px wide, zero mean, unit std."""
    H, W = shape
    scale = max(float(scale), 1.0)
    gh, gw = int(H / scale) + 4, int(W / scale) + 4
    g = rng.standard_normal((gh, gw)).astype(np.float32)
    z = ndi.zoom(g, scale, order=3, prefilter=False)
    if z.shape[0] < H or z.shape[1] < W:
        z = np.pad(z, ((0, max(0, H - z.shape[0])), (0, max(0, W - z.shape[1]))), mode="reflect")
    z = z[:H, :W]
    z = z - z.mean()
    return z / (z.std() + 1e-6)


def fbm(shape, scale, rng, octaves=4, gain=0.5):
    out = np.zeros(shape, np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * smooth_noise(shape, scale / (2 ** o), rng)
        tot += amp
        amp *= gain
    return out / tot


def guided_filter(I, p, r, eps):
    size = 2 * r + 1
    mean = lambda x: ndi.uniform_filter(x, size=size, mode="reflect")
    mI, mp = mean(I), mean(p)
    a = (mean(I * p) - mI * mp) / (mean(I * I) - mI * mI + eps)
    b = mp - a * mI
    return mean(a) * I + mean(b)


def hash2(i, j, seed):
    """Integer hash of two arrays -> float32 in [0, 1)."""
    h = (i.astype(np.int64) * 73856093) ^ (j.astype(np.int64) * 19349663) ^ (seed * 83492791)
    h = h & 0xFFFFFFFF
    h = ((h ^ (h >> 16)) * 0x45D9F3B) & 0xFFFFFFFF
    h = ((h ^ (h >> 16)) * 0x45D9F3B) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 0xFFFFFF).astype(np.float32) / float(0x1000000)


def warp(img, dx, dy, order=1):
    H, W = img.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return ndi.map_coordinates(img, [yy + dy, xx + dx], order=order, mode="nearest")


def polygon_mask(shape, pts, s_blur):
    """Soft mask from a polygon given in normalised (x, y) coordinates."""
    H, W = shape
    img = Image.new("L", (W, H), 0)
    ImageDraw.Draw(img).polygon([(x * W, y * H) for x, y in pts], fill=255)
    m = np.asarray(img, np.float32) / 255.0
    return ndi.gaussian_filter(m, s_blur) if s_blur > 0 else m


def polyline_y(xs, pts):
    """Piecewise-linear y(x) through normalised points."""
    px = np.array([p[0] for p in pts]); py = np.array([p[1] for p in pts])
    return np.interp(xs, px, py)


# ----------------------------------------------------------------------------- strokes

def hatch(shape, D, angle, spacing, dash, gap, width, lo, hi, rng, seed, s,
          warp_amp=0.45, warp_scale=380, bend=0.12, fray=0.035, patch=0.05, min_press=0.32,
          rows_len=11.0, row_drift=1.0, row_jitter=0.16):
    """One layer of hatching, drawn in coherent patches.

    Strokes run at `angle` degrees (image coords, x right / y down), `spacing` px apart,
    about `dash` px long with `gap` px between them. A stroke is laid wherever the
    target darkness D passes `lo` (the edge of the patch is frayed per stroke and wanders
    with a slow noise), and it is pressed harder as D rises towards `hi`.
    Returns stroke darkness 0..1.
    """
    H, W = shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    th = np.deg2rad(angle)
    drift = smooth_noise(shape, warp_scale * s, rng) * warp_amp * spacing   # the hand drifts
    u = -xx * np.sin(th) + yy * np.cos(th) + drift                          # across the strokes
    v = xx * np.cos(th) + yy * np.sin(th)                                   # along the strokes
    del xx, yy, drift
    i = np.floor(u / spacing)
    fu = u / spacing - i
    P = dash + gap
    # neighbouring lanes start their strokes at nearly the same place, so the strokes form rows,
    # as a hand lays them; the rows wander slowly and each lane is nudged a little
    # blocks of rows_len lanes share a start (with a slight slant), as one movement of the hand
    blk = np.floor(i / rows_len)
    in_blk = i - blk * rows_len
    slant = (hash2(blk, np.ones_like(blk), seed) - 0.5) * 0.06
    row_phase = hash2(blk, np.zeros_like(blk), seed) + in_blk * slant
    sv = v + (row_phase * row_drift + (hash2(i, np.zeros_like(i), seed) - 0.5) * row_jitter) * P
    block_press = 0.85 + 0.3 * hash2(blk, np.full_like(blk, 3), seed)
    j = np.floor(sv / P)
    t = sv - j * P
    h1 = hash2(i, j, seed + 1)
    L = dash * (0.6 + 0.8 * h1)
    tau = t / L
    inside = (tau <= 1.0).astype(np.float32)
    tau = np.clip(tau, 0.0, 1.0)
    h3 = hash2(i, j, seed + 3)
    tau_p = np.where(h3 > 0.5, tau, 1.0 - tau)              # which end the pressure starts at
    off = 0.5 + (hash2(i, j, seed + 2) - 0.5) * 0.36
    arc = (hash2(i, j, seed + 4) - 0.5) * 2.0 * bend * ((tau - 0.5) ** 2 - 0.0833) * L / spacing
    dist = np.abs(fu - off - arc) * spacing
    press = smoothstep(0.0, 0.12, tau_p) * (1.0 - 0.75 * smoothstep(0.5, 1.0, tau_p))
    w = width * (0.55 + 0.45 * press)
    cov = np.clip(w + 0.5 - dist, 0.0, 1.0)
    del dist, fu, u, v, sv, t
    # patch edge: where D passes lo, wandering slowly and frayed stroke by stroke
    wander = smooth_noise(shape, 140 * s, rng) * patch
    thr = lo + wander + (hash2(i, j, seed + 5) - 0.5) * 2 * fray
    sel = smoothstep(thr - 0.015, thr + 0.015, D)
    amount = smoothstep(lo, hi, D)
    k = np.clip((min_press + (1 - min_press) * amount) * (0.82 + 0.18 * hash2(i, j, seed + 6)) * block_press, 0, 1)
    return cov * press * inside * sel * k


def line_kernel(length, angle):
    n = int(length) | 1
    c = n // 2
    img = Image.new("L", (n * 4, n * 4), 0)
    th = np.deg2rad(angle)
    dx, dy = np.cos(th) * c * 4, np.sin(th) * c * 4
    ImageDraw.Draw(img).line([(c * 4 + 2 - dx, c * 4 + 2 - dy), (c * 4 + 2 + dx, c * 4 + 2 + dy)], fill=255, width=4)
    k = np.asarray(img.resize((n, n), Image.LANCZOS), np.float32)
    return k / (k.sum() + 1e-6)


def sketch_lines(Ls, length):
    """Lu, Xu & Jia (2012) style stroke map: edges re-drawn as short directional strokes
    that run on past their ends, like quick pencil lines."""
    G = np.hypot(ndi.sobel(Ls, axis=1), ndi.sobel(Ls, axis=0))
    G = np.clip(G / (np.percentile(G, 99.5) + 1e-6), 0, 1.5)
    ks = [line_kernel(length, n * 180.0 / 8) for n in range(8)]
    resp = np.stack([fftconvolve(G, k, mode="same") for k in ks])
    idx = np.argmax(resp, axis=0)
    del resp
    out = np.zeros_like(G)
    for n, k in enumerate(ks):
        out += fftconvolve(G * (idx == n), k, mode="same")
    return np.clip(out / (np.percentile(out, 99.7) + 1e-6), 0, 1)


# ----------------------------------------------------------------------------- regions

# CAM_Hero framing, normalised coordinates.
SKY_FLOOR = [(0.00, 0.455), (0.10, 0.43), (0.15, 0.40), (0.22, 0.372), (0.28, 0.40), (0.35, 0.42),
             (0.40, 0.405), (0.45, 0.45), (0.74, 0.45), (0.76, 0.30), (0.80, 0.27), (0.85, 0.262),
             (0.90, 0.30), (1.00, 0.30)]
SEA = [(0.0, 0.517), (0.135, 0.517), (0.128, 0.565), (0.13, 0.612), (0.20, 0.622), (0.245, 0.612),
       (0.29, 0.585), (0.296, 0.64), (0.285, 0.70), (0.25, 0.79), (0.235, 0.88), (0.205, 1.0), (0.0, 1.0)]
FAR = [(0.0, 0.36), (0.45, 0.36), (0.45, 0.435), (0.33, 0.44), (0.322, 0.56), (0.30, 0.565), (0.25, 0.60),
       (0.0, 0.53)]
FAR_RIGHT = [(0.765, 0.22), (0.97, 0.22), (0.97, 0.50), (0.86, 0.50), (0.85, 0.395), (0.80, 0.335), (0.765, 0.305)]
ROCKS = [(0.24, 0.62), (0.30, 0.62), (0.30, 0.80), (0.46, 0.74), (0.60, 0.72), (0.72, 0.74), (0.80, 0.80),
         (0.90, 0.86), (0.98, 0.92), (1.0, 1.0), (0.18, 1.0), (0.22, 0.85)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out_dir")
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--debug", action="store_true")
    a = ap.parse_args()
    t0 = time.time()
    rng = np.random.default_rng(a.seed)
    os.makedirs(a.out_dir, exist_ok=True)

    im = Image.open(a.src).convert("RGB")
    W, H = int(round(im.width * a.scale)), int(round(im.height * a.scale))
    s = W / 3840.0                       # every size below is written for a 3840 px wide drawing
    if (W, H) != im.size:
        im = im.resize((W, H), Image.LANCZOS)
    rgb = np.asarray(im, np.float32) / 255.0
    shape = (H, W)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx, ny = xx / W, yy / H
    del yy, xx
    log(t0, f"loaded {W}x{H}")

    # -- structure: flatten the painterly brush patches, keep the forms
    Ls = guided_filter(Y, Y, int(14 * s) + 1, 0.004)
    Ls = guided_filter(Ls, Ls, int(5 * s) + 1, 0.0015)
    Lb = ndi.gaussian_filter(Ls, 2.5 * s)
    log(t0, "structure")

    # -- regions (soft masks)
    var = ndi.uniform_filter(Ls * Ls, int(15 * s) | 1) - ndi.uniform_filter(Ls, int(15 * s) | 1) ** 2
    floor = polyline_y(nx[0], SKY_FLOOR)[None, :]
    skyish = (Ls > 0.58) & (var < 0.0022) & (ny < floor)
    lab, _ = ndi.label(skyish)
    top = np.unique(lab[: max(2, int(6 * s)), :]); top = top[top > 0]
    sky = np.isin(lab, top)
    sky = ndi.binary_closing(sky, iterations=max(1, int(8 * s)))
    sky = ndi.binary_fill_holes(sky)
    sky = sky & (ny < floor + 0.01)
    sky = ndi.gaussian_filter(sky.astype(np.float32), 4 * s)
    del lab, skyish
    greenness = ndi.gaussian_filter(g - 0.5 * (r + b), 4 * s)
    foliage = smoothstep(0.010, 0.032, greenness) * smoothstep(0.62, 0.70, nx)
    foliage = np.clip(foliage + smoothstep(0.012, 0.03, greenness) * smoothstep(0.80, 0.86, nx), 0, 1)
    foliage = ndi.gaussian_filter(foliage, 3 * s)
    sea_poly = polygon_mask(shape, SEA, 3 * s)
    warmth = ndi.gaussian_filter(r - b, 5 * s)
    rockish = smoothstep(0.035, 0.085, warmth) * smoothstep(0.70, 0.55, ndi.gaussian_filter(Y, 3 * s))
    rockish = ndi.gaussian_filter(np.maximum(rockish, smoothstep(0.0040, 0.012, var) * smoothstep(0.62, 0.70, ny)), 3 * s)
    sea = sea_poly * (1 - smoothstep(0.35, 0.65, rockish))
    far = np.maximum(polygon_mask(shape, FAR, 10 * s), polygon_mask(shape, FAR_RIGHT, 10 * s))
    far = far * (1 - sky) * (1 - sea) * (1 - foliage)
    land = np.clip(1 - sky - sea - far - foliage, 0, 1)
    log(t0, "regions")

    # -- tone plan: target graphite darkness 0 (paper) .. 1 (heaviest)
    D_land = 0.18 * smoothstep(0.72, 0.42, Lb) + 0.82 * smoothstep(0.44, 0.10, Lb)   # light stays paper
    D_sky = 0.24 * smoothstep(0.66, 0.54, Lb)                            # only the deepest cloud shadow
    D_sea = 0.62 * smoothstep(0.82, 0.48, Lb) + 0.3 * smoothstep(0.5, 0.25, Lb)
    D_far = 0.42 * smoothstep(0.74, 0.42, Lb)
    D_fol = 0.30 * smoothstep(0.70, 0.45, Lb) + 0.70 * smoothstep(0.46, 0.12, Lb)
    # the cliff rocks: their lit faces still carry a little form shading
    rocks = polygon_mask(shape, ROCKS, 12 * s) * land
    Lr = ndi.gaussian_filter(Lb, 9 * s)
    D_rock = 0.13 + 0.17 * smoothstep(0.80, 0.48, Lr) + 0.70 * smoothstep(0.46, 0.10, 0.5 * Lb + 0.5 * Lr)
    D_land = D_land * (1 - rocks) + D_rock * rocks
    D = D_land * land + D_sky * sky + D_sea * sea + D_far * far + D_fol * foliage
    # erased highlights: the window glow, lamps, the sparkle on the water
    glow = smoothstep(0.16, 0.30, ndi.gaussian_filter(r - b, 1.5 * s)) * smoothstep(0.42, 0.62, Y)
    glow = glow * (1 - sea) * (1 - foliage)
    D = D * (1 - 0.7 * glow)
    sparkle = smoothstep(0.76, 0.88, ndi.gaussian_filter(Y, 1.0 * s)) * sea
    D = D * (1 - 0.95 * sparkle)
    # an unfinished sketch: the drawing thins out towards the edges, unevenly
    cx, cy = 0.56, 0.46
    rr = np.sqrt(((nx - cx) / np.where(nx < cx, 0.60, 0.52)) ** 2 + ((ny - cy) / 0.58) ** 2)
    edge_noise = fbm(shape, 420 * s, rng, octaves=4)
    finish = np.clip(1 - smoothstep(0.80, 1.20, rr + 0.14 * edge_noise), 0, 1)
    finish = finish * (1 - 0.6 * smoothstep(0.80, 1.02, ny + 0.05 * edge_noise) * rocks)   # rocks left loose
    D = D * (0.12 + 0.88 * finish)
    log(t0, "tone")

    # -- hatching
    part = smooth_noise(shape, 330 * s, rng)
    wA = [smoothstep(-0.25, -0.45, part), smoothstep(-0.45, -0.25, part) * smoothstep(0.45, 0.25, part),
          smoothstep(0.25, 0.45, part)]
    hl = np.zeros(shape, np.float32)
    for n, ang in enumerate((-50, -58, -66)):
        hl += wA[n] * hatch(shape, D, angle=ang, spacing=6.6 * s, dash=74 * s, gap=7 * s, width=0.85 * s, lo=0.09,
                            hi=0.55, rng=rng, seed=101 + 10 * n, s=s)
    del part, wA
    log(t0, "hatch A")
    hx = hatch(shape, D, angle=24, spacing=6.2 * s, dash=62 * s, gap=8 * s, width=0.8 * s, lo=0.50, hi=0.85,
               rng=rng, seed=202, s=s)
    log(t0, "hatch B")
    hd = hatch(shape, D, angle=-100, spacing=5.4 * s, dash=48 * s, gap=6 * s, width=0.8 * s, lo=0.72, hi=0.97,
               rng=rng, seed=303, s=s)
    log(t0, "hatch C")
    hs1 = hatch(shape, D, angle=0.8, spacing=6.4 * s, dash=110 * s, gap=46 * s, width=0.75 * s, lo=0.12, hi=0.6,
                rng=rng, seed=404, s=s, warp_amp=0.7, warp_scale=220, bend=0.04, fray=0.06)
    hs2 = hatch(shape, D, angle=-2.5, spacing=5.8 * s, dash=70 * s, gap=34 * s, width=0.7 * s, lo=0.45, hi=0.85,
                rng=rng, seed=405, s=s, warp_amp=0.6, warp_scale=200, bend=0.03, fray=0.05)
    log(t0, "hatch sea")
    hk = hatch(shape, D, angle=-9, spacing=7.6 * s, dash=96 * s, gap=16 * s, width=0.7 * s, lo=0.10, hi=0.30,
               rng=rng, seed=707, s=s, warp_amp=0.8, warp_scale=300, bend=0.06, fray=0.05, min_press=0.25)
    log(t0, "hatch sky")
    hf1 = hatch(shape, D, angle=-80, spacing=4.8 * s, dash=24 * s, gap=7 * s, width=0.85 * s, lo=0.08, hi=0.55,
                rng=rng, seed=505, s=s, warp_amp=1.3, warp_scale=60, bend=0.3)
    hf2 = hatch(shape, D, angle=-112, spacing=4.4 * s, dash=18 * s, gap=7 * s, width=0.8 * s, lo=0.45, hi=0.9,
                rng=rng, seed=606, s=s, warp_amp=1.3, warp_scale=60, bend=0.3)
    log(t0, "hatch foliage")
    H_land = 1 - (1 - hl) * (1 - hx) * (1 - hd)
    H_far = 0.25 * hl
    H_sea = 1 - (1 - hs1) * (1 - hs2) * (1 - 0.6 * hd)
    H_fol = 1 - (1 - hf1) * (1 - hf2) * (1 - 0.6 * hd)
    Hh = H_land * land + H_far * far + H_sea * sea + H_fol * foliage + hk * sky
    Hh = np.clip(Hh, 0, 1)
    del hl, hx, hd, hs1, hs2, hk, hf1, hf2, H_land, H_far, H_sea, H_fol

    # -- smudged wash under the hatching: graphite rubbed into the shadows
    wash = ndi.gaussian_filter(D, 4 * s)
    wash = smoothstep(0.30, 1.0, wash) * 0.30 * (0.7 + 0.3 * smoothstep(-1.5, 1.5, fbm(shape, 110 * s, rng, 3)))
    wash = wash * (1 - 0.8 * sky)
    wash = np.maximum(wash, far * 0.40 * ndi.gaussian_filter(D, 10 * s))        # distant hills, rubbed in
    log(t0, "wash")

    # -- contour lines
    g1 = ndi.gaussian_filter(Ls, 1.2 * s)
    g2 = ndi.gaussian_filter(Ls, 1.2 * s * 1.7)
    lines_fine = smoothstep(0.012, 0.040, g2 - g1)              # dark side of each edge
    g1 = ndi.gaussian_filter(Ls, 2.6 * s)
    g2 = ndi.gaussian_filter(Ls, 2.6 * s * 1.7)
    lines_bold = smoothstep(0.020, 0.060, g2 - g1)
    del g1, g2
    yb = guided_filter(Ls, 0.5 * (r + g) - b, int(6 * s) + 1, 0.002)      # yellow-blue opponent channel
    c1 = ndi.gaussian_filter(yb, 1.4 * s)
    c2 = ndi.gaussian_filter(yb, 1.4 * s * 1.7)
    lines_chroma = smoothstep(0.012, 0.035, np.abs(c2 - c1))
    del yb, c1, c2
    sk = smoothstep(0.20, 0.80, sketch_lines(ndi.gaussian_filter(Ls, 1.6 * s), max(9, int(64 * s))))
    log(t0, "lines")
    dx = smooth_noise(shape, 170 * s, rng) * 1.8 * s
    dy = smooth_noise(shape, 170 * s, rng) * 1.8 * s
    pressure = 0.55 + 0.45 * smoothstep(-1.2, 1.0, smooth_noise(shape, 60 * s, rng))
    gaps = smoothstep(-1.3, -0.55, smooth_noise(shape, 28 * s, rng))
    lines = np.maximum(0.80 * lines_fine, 0.90 * lines_bold)
    lines = np.maximum(lines, 0.75 * lines_chroma)
    lines = np.maximum(lines, 0.38 * sk)
    lines = warp(lines, dx, dy) * pressure * (0.22 + 0.78 * gaps)
    dx2 = smooth_noise(shape, 130 * s, rng) * 2.8 * s
    dy2 = smooth_noise(shape, 130 * s, rng) * 2.8 * s
    ghost = warp(np.maximum(lines_fine, 0.5 * sk), dx2, dy2) * 0.30          # a lighter searching pass
    lines = 1 - (1 - lines) * (1 - ghost)
    lines = lines * (0.10 + 0.90 * np.clip(finish * 1.25, 0, 1))
    lines = lines * (1 - 0.30 * sky) * (1 - 0.35 * far) * (1 - 0.35 * sea)
    lines = lines * (1 - 0.35 * smoothstep(0.55, 0.95, D))                   # dark masses need no outline
    lines = lines * (1 - 0.45 * rocks)
    del lines_fine, lines_bold, lines_chroma, sk, ghost
    log(t0, "lines styled")

    # -- construction lines: the sea horizon, long and light, drawn freehand
    cons = Image.new("L", (W * 2, H * 2), 0)
    dr = ImageDraw.Draw(cons)
    yh = 0.517 * H
    dr.line([(0.01 * W * 2, (yh + 1.4 * s) * 2), (0.40 * W * 2, (yh - 1.2 * s) * 2)], fill=135, width=max(1, int(3.6 * s)))
    dr.line([(0.07 * W * 2, (yh + 4.2 * s) * 2), (0.30 * W * 2, (yh + 3.0 * s) * 2)], fill=80, width=max(1, int(3.0 * s)))
    cons = np.asarray(cons.resize((W, H), Image.LANCZOS), np.float32) / 255.0
    lines = 1 - (1 - lines) * (1 - cons * (0.5 + 0.5 * gaps))

    # -- assemble
    T = 1 - (1 - wash) * (1 - 0.92 * Hh) * (1 - 0.88 * lines)
    tooth = smoothstep(-1.6, 1.6, smooth_noise(shape, 1.1 * s, rng) * 0.6 + smooth_noise(shape, 2.6 * s, rng) * 0.4)
    T_eff = np.clip(T * (1 - (1 - tooth) * 0.42 * (1 - T ** 2)), 0, 0.93)    # graphite catches the tooth
    fibre = ndi.gaussian_filter(rng.standard_normal(shape).astype(np.float32), (1.6 * s, 3.2 * s))
    fibre = fibre / (fibre.std() + 1e-6)
    mottle = fbm(shape, 300 * s, rng, 3)
    paper = PAPER[None, None, :] * (1 + 0.016 * mottle[..., None] + 0.008 * fibre[..., None]
                                    + 0.012 * (tooth[..., None] - 0.5))
    out = paper * (1 - T_eff[..., None]) + GRAPHITE[None, None, :] * T_eff[..., None]
    out = np.clip(out, 0, 1)
    path = os.path.join(a.out_dir, f"graphite_{W}x{H}.png")
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(path)
    log(t0, f"wrote {path}")
    if a.debug:
        for name, m in {"D": D, "sky": sky, "sea": sea, "foliage": foliage, "far": far, "land": land,
                        "finish": finish, "lines": lines, "hatch": Hh}.items():
            Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).save(os.path.join(a.out_dir, f"dbg_{name}.png"))
        log(t0, "debug masks written")


if __name__ == "__main__":
    main()
