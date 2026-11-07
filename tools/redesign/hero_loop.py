#!/usr/bin/env python3
"""Hero loop from the chapel film: shot S1 played forward from its first frame (where the
camera starts at rest), eased to a stop, then played back. This makes a seamless loop.

The camera in S1 orbits the chapel, so a plain cross-fade loop would double the cliff
(foreground and background move up to ~170 px apart over 8 s). Instead the turnaround is
time-remapped: near the stop, source frames sit less than a pixel apart and are blended.
The work is done in YUV 4:2:0 planes, so the colours are never converted.

Usage: python3 tools/redesign/hero_loop.py SRC.mp4 OUT.mkv
Writes a lossless FFV1 master (1920x1080, 24 fps). The source file is only read.
"""
import subprocess
import sys

import numpy as np

W, H, FPS = 1920, 1080, 24
K = 120            # output frames in the forward half (5 s)
K_HOLD = 72        # frames at full speed before the ease-out begins


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def main():
    src, out = sys.argv[1], sys.argv[2]
    # source time for each forward output frame: 1x, then eased down to a stop
    speed = np.ones(K)
    k = np.arange(K)
    ramp = (k - K_HOLD) / (K - 1 - K_HOLD)
    speed = np.where(k < K_HOLD, 1.0, 1.0 - smoothstep(ramp))
    s = np.concatenate([[0.0], np.cumsum(speed[:-1])])
    n_src = int(np.ceil(s[-1])) + 2
    fsize = W * H * 3 // 2
    dec = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"select=lt(n\\,{n_src})", "-vsync", "0",
                          "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], capture_output=True, check=True).stdout
    frames = np.frombuffer(dec, np.uint8).reshape(-1, fsize)
    assert frames.shape[0] >= n_src - 1, frames.shape
    fwd = []
    for t in s:
        i0 = int(np.floor(t)); a = t - i0
        if a < 1e-3:
            fwd.append(frames[i0])
        else:
            f = frames[i0].astype(np.float32) * (1 - a) + frames[i0 + 1].astype(np.float32) * a
            fwd.append(np.clip(f + 0.5, 0, 255).astype(np.uint8))
    # palindrome without doubling either end frame: 0..K-1, then K-2..1
    seq = fwd + fwd[-2:0:-1]
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "ffv1", "-level", "3", "-pix_fmt", "yuv420p",
                            "-color_primaries", "bt709", "-color_trc", "iec61966-2-1",
                            "-colorspace", "bt709", "-color_range", "tv", out], stdin=subprocess.PIPE)
    for f in seq:
        enc.stdin.write(f.tobytes())
    enc.stdin.close()
    enc.wait()
    print(f"source frames used: 0..{s[-1]:.2f}  output frames: {len(seq)} ({len(seq) / FPS:.2f} s)")


if __name__ == "__main__":
    main()
