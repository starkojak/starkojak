#!/bin/bash
# Encode the hero loop master (from hero_loop.py) for the web:
#   hero-1080.mp4 / .webm        1920x1080, H.264 High CRF 21 / VP9 CRF 31, no audio
#   hero-portrait.mp4 / .webm    608x1080 crop centred on the chapel, for portrait phones
# Colour is tagged like the source film: BT.709 primaries and matrix, sRGB transfer, TV range,
# so the video matches its sRGB poster.
# Usage: tools/redesign/encode_hero.sh MASTER.mkv OUT_DIR
set -euo pipefail
M="$1"; OUT="$2"
COL=(-color_primaries bt709 -color_trc iec61966-2-1 -colorspace bt709 -color_range tv)
X264=(-an -c:v libx264 -preset veryslow -profile:v high -level 4.1 -crf 21 -g 120 -pix_fmt yuv420p "${COL[@]}" -movflags +faststart)
VP9=(-an -c:v libvpx-vp9 -b:v 0 -crf 31 -deadline good -cpu-used 1 -row-mt 1 -tile-columns 2 -g 120 -pix_fmt yuv420p "${COL[@]}")
# ffmpeg 8 takes colour properties from the frames, so they are set in the filter chain too
TAG="setparams=color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709:range=tv"
CROP="crop=608:1080:896:0"
ffmpeg -v error -y -i "$M" -vf "$TAG" "${X264[@]}" "$OUT/hero-1080.mp4"
ffmpeg -v error -y -i "$M" -vf "$TAG" "${VP9[@]}" "$OUT/hero-1080.webm"
ffmpeg -v error -y -i "$M" -vf "$CROP,$TAG" "${X264[@]}" "$OUT/hero-portrait.mp4"
ffmpeg -v error -y -i "$M" -vf "$CROP,$TAG" -tile-columns 1 "${VP9[@]}" "$OUT/hero-portrait.webm"
# posters: the loop's first frame
ffmpeg -v error -y -i "$M" -vf "select=eq(n\,0)" -frames:v 1 -update 1 -pix_fmt rgb24 "$OUT/../_poster_full.png"
