/*
 * Procedural art: paper, leather and desk textures, ink drawings, the placeholder photograph.
 * Everything is drawn here (no image files). Textures are rendered once to compressed
 * WebP/JPEG blobs so the browser never re-runs SVG filters while pages turn.
 */
const Art = (() => {
  // Small seeded random generator so every page gets its own, repeatable texture.
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const svgData = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

  // Rasterise an SVG string once and return a compressed blob URL.
  function bake(svg, w, h, type = "image/webp", quality = 0.82) {
    const src = svgData(svg);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : src), type, quality);
        } catch (e) {
          resolve(src); // tainted canvas fallback: use the SVG directly
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /* ---------- Paper ---------- */
  function paperSVG(w, h, seed, side, torn) {
    const r = rng(seed);
    const sd = () => Math.floor(r() * 99999);
    const tones = [
      ["#eedfba", "#e0c99b"],
      ["#ebd8b0", "#dcc294"],
      ["#efe1c0", "#dac196"],
      ["#e8d4aa", "#d8bd8d"]
    ][Math.floor(r() * 4)];
    const ang = Math.floor(r() * 360);
    const outerLeft = side === "left";

    // Scorch mask: inner rect pushed toward the gutter so the outer edges burn more.
    const bx = outerLeft ? w * (0.05 + r() * 0.03) : -w * 0.1;
    const bw = outerLeft ? w * 1.1 - bx : w * (0.93 - r() * 0.03) - bx;
    const by = h * (0.035 + r() * 0.03);
    const bh = h * (0.93 - r() * 0.03) - by;

    // Deckle mask rect: straight at the gutter (it extends past the canvas there).
    const dx = outerLeft ? 5 : -20;
    const dw = w + 15;

    let tear = "";
    if (torn) {
      const top = r() < 0.5;
      const cx = outerLeft ? 0 : w;
      const depthX = w * (0.12 + r() * 0.1);
      const depthY = h * (0.07 + r() * 0.07);
      const y0 = top ? 0 : h;
      const pts = [[cx, top ? depthY : h - depthY]];
      const steps = 16;
      for (let k = 1; k < steps; k++) {
        const t = k / steps;
        const x = cx + (outerLeft ? 1 : -1) * depthX * t + (r() - 0.5) * 7;
        const y = (top ? depthY : h - depthY) + (y0 - (top ? depthY : h - depthY)) * t + (r() - 0.5) * 9;
        pts.push([x, y]);
      }
      pts.push([cx + (outerLeft ? 1 : -1) * depthX, y0]);
      pts.push([outerLeft ? -30 : w + 30, top ? -30 : h + 30]);
      tear = `<polygon fill="#000" points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`;
    }

    let drops = "";
    const nDrops = Math.floor(r() * 3);
    for (let k = 0; k < nDrops; k++) {
      const x = w * (0.1 + r() * 0.8), y = h * (0.1 + r() * 0.8), rad = 6 + r() * 22;
      drops += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#8a5a2a" opacity="${0.06 + r() * 0.08}" filter="url(#drop)"/>`;
    }
    if (r() < 0.4) {
      const x = w * (0.25 + r() * 0.5), y = h * (0.55 + r() * 0.3), rad = w * (0.09 + r() * 0.05);
      drops += `<circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="#7a4e22" stroke-width="${3 + r() * 3}" opacity="${0.08 + r() * 0.06}" filter="url(#drop)"/>`;
    }

    // faint creases / hairline cracks, like a page that has been folded and pressed flat
    let creases = "";
    const nC = 1 + Math.floor(r() * 3);
    for (let k = 0; k < nC; k++) {
      let x = w * (0.1 + r() * 0.8), y = h * (0.05 + r() * 0.3);
      let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
      const dir = r() * Math.PI * 2;
      const segs = 6 + Math.floor(r() * 8);
      for (let q = 0; q < segs; q++) {
        x += Math.cos(dir + (r() - 0.5) * 0.9) * w * 0.035;
        y += Math.sin(dir + (r() - 0.5) * 0.9) * w * 0.035 + h * 0.012;
        d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      creases += `<path d="${d}" fill="none" stroke="#5b3a1c" stroke-width="1" opacity=".22"/><path d="${d}" fill="none" stroke="#fff6e0" stroke-width="1" opacity=".3" transform="translate(1.2 1)"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="base" gradientTransform="rotate(${ang} .5 .5)">
    <stop offset="0" stop-color="${tones[0]}"/><stop offset="1" stop-color="${tones[1]}"/>
  </linearGradient>
  <filter id="surf" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${(0.004 + r() * 0.003).toFixed(4)} ${(0.006 + r() * 0.004).toFixed(4)}" numOctaves="3" seed="${sd()}" result="t"/>
    <feDiffuseLighting in="t" surfaceScale="${(4 + r() * 4).toFixed(1)}" diffuseConstant="1.17" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="62"/></feDiffuseLighting>
    <feBlend in="SourceGraphic" in2="l" mode="multiply"/>
  </filter>
  <filter id="fiber" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${(0.01 + r() * 0.01).toFixed(3)} 0.45" numOctaves="2" seed="${sd()}"/>
    <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.31  0 0 0 0 0.17  1.5 0 0 0 -0.78"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${sd()}"/>
    <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.12  0.7 0 0 0 -0.24"/>
  </filter>
  <filter id="blotch" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${(0.006 + r() * 0.005).toFixed(4)}" numOctaves="4" seed="${sd()}"/>
    <feColorMatrix values="0 0 0 0 0.58  0 0 0 0 0.38  0 0 0 0 0.16  2.6 0 0 0 -1.35"/>
    <feGaussianBlur stdDeviation="3"/>
  </filter>
  <filter id="fox" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="${sd()}"/>
    <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.3  0 0 0 0 0.12  9 0 0 0 -6.6"/>
  </filter>
  <filter id="drop" x="-50%" y="-50%" width="200%" height="200%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${sd()}"/>
    <feDisplacementMap in="SourceGraphic" scale="16" xChannelSelector="R" yChannelSelector="G"/>
    <feGaussianBlur stdDeviation="1.5"/>
  </filter>
  <filter id="burnF" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="3" seed="${sd()}"/>
    <feDisplacementMap in="SourceGraphic" scale="${w * (0.12 + r() * 0.1)}" xChannelSelector="R" yChannelSelector="G"/>
    <feGaussianBlur stdDeviation="${(w / 30).toFixed(1)}"/>
  </filter>
  <filter id="deckle" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="${sd()}"/>
    <feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <mask id="burn"><rect width="${w}" height="${h}" fill="#fff"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${w * 0.07}" fill="#000" filter="url(#burnF)"/></mask>
  <mask id="cut"><g filter="url(#deckle)"><rect x="${dx}" y="5" width="${dw}" height="${h - 10}" fill="#fff"/>${tear}</g></mask>
</defs>
<g mask="url(#cut)">
  <rect width="${w}" height="${h}" fill="url(#base)" filter="url(#surf)"/>
  <rect width="${w}" height="${h}" filter="url(#fiber)" opacity=".45"/>
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
  <rect width="${w}" height="${h}" filter="url(#blotch)" opacity="${(0.22 + r() * 0.25).toFixed(2)}"/>
  <rect width="${w}" height="${h}" filter="url(#fox)" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>
  ${drops}
  ${creases}
  <rect width="${w}" height="${h}" fill="#6b3e1a" mask="url(#burn)" opacity="${(0.32 + r() * 0.18).toFixed(2)}"/>
</g>
</svg>`;
  }

  /* ---------- Leather ---------- */
  function leatherSVG(w, h, seed) {
    const r = rng(seed);
    const sd = () => Math.floor(r() * 99999);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <radialGradient id="g" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="#5e2219"/><stop offset=".6" stop-color="#4b1a16"/><stop offset="1" stop-color="#2c0e0b"/></radialGradient>
  <filter id="pebble" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="3" seed="${sd()}" result="t"/>
    <feDiffuseLighting in="t" surfaceScale="1.6" diffuseConstant="1.2" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>
    <feBlend in="SourceGraphic" in2="l" mode="multiply"/>
  </filter>
  <filter id="mottle" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="${sd()}"/>
    <feColorMatrix values="0 0 0 0 0.09  0 0 0 0 0.03  0 0 0 0 0.02  2.6 0 0 0 -1.15"/>
  </filter>
  <filter id="scuff" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.025 0.06" numOctaves="3" seed="${sd()}"/>
    <feColorMatrix values="0 0 0 0 0.66  0 0 0 0 0.42  0 0 0 0 0.3  5 0 0 0 -3.1"/>
  </filter>
  <filter id="wearF" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="${sd()}"/>
    <feDisplacementMap in="SourceGraphic" scale="40" xChannelSelector="R" yChannelSelector="G"/>
    <feGaussianBlur stdDeviation="${(w / 70).toFixed(1)}"/>
  </filter>
  <mask id="wear"><rect width="${w}" height="${h}" fill="#fff"/><rect x="${w * 0.04}" y="${h * 0.03}" width="${w * 0.92}" height="${h * 0.94}" rx="${w * 0.05}" fill="#000" filter="url(#wearF)"/></mask>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)" filter="url(#pebble)"/>
<rect width="${w}" height="${h}" filter="url(#mottle)" opacity=".55"/>
<rect width="${w}" height="${h}" filter="url(#scuff)" opacity=".16"/>
<rect width="${w}" height="${h}" fill="#8c5a3c" mask="url(#wear)" opacity=".42"/>
</svg>`;
  }

  /* ---------- Desk ---------- */
  function deskSVG(w, h) {
    let seams = "";
    for (let y = 0; y < h; y += h / 4) {
      seams += `<rect y="${y}" width="${w}" height="3" fill="#050201" opacity=".85"/><rect y="${y + 3}" width="${w}" height="1" fill="#ffcf9a" opacity=".05"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <filter id="wood" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0012 0.022" numOctaves="3" seed="11"/>
    <feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.07 0.17 0.27 0.15 0.24 0.1"/>
      <feFuncG type="table" tableValues="0.035 0.085 0.14 0.075 0.12 0.05"/>
      <feFuncB type="table" tableValues="0.018 0.04 0.065 0.035 0.055 0.025"/>
      <feFuncA type="linear" slope="0" intercept="1"/>
    </feComponentTransfer>
  </filter>
  <filter id="pores" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.45" numOctaves="2" seed="3"/>
    <feColorMatrix values="0 0 0 0 0.02  0 0 0 0 0.01  0 0 0 0 0  4 0 0 0 -2.3"/>
  </filter>
</defs>
<rect width="${w}" height="${h}" filter="url(#wood)"/>
<rect width="${w}" height="${h}" filter="url(#pores)" opacity=".55"/>
${seams}
</svg>`;
  }

  /* ---------- Ink drawings (original) ---------- */
  const INK = "#2a1e16";

  function starChart() {
    const r = rng(1789);
    let s = "";
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const r2 = k % 6 === 0 ? 85 : 89;
      s += `<line x1="${(92 * Math.cos(a)).toFixed(2)}" y1="${(92 * Math.sin(a)).toFixed(2)}" x2="${(r2 * Math.cos(a)).toFixed(2)}" y2="${(r2 * Math.sin(a)).toFixed(2)}" stroke-width=".5"/>`;
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      s += `<line x1="${(34 * Math.cos(a)).toFixed(2)}" y1="${(34 * Math.sin(a)).toFixed(2)}" x2="${(85 * Math.cos(a)).toFixed(2)}" y2="${(85 * Math.sin(a)).toFixed(2)}" stroke-width=".25" stroke-dasharray="1 2.5"/>`;
    }
    const star = (x, y, m) =>
      `<path d="M${x},${y - m} L${x + m * 0.25},${y - m * 0.25} L${x + m},${y} L${x + m * 0.25},${y + m * 0.25} L${x},${y + m} L${x - m * 0.25},${y + m * 0.25} L${x - m},${y} L${x - m * 0.25},${y - m * 0.25}Z" fill="${INK}" stroke="none"/>`;
    const constellations = [
      [[-52, -38], [-40, -50], [-24, -46], [-14, -58], [-2, -52]],
      [[30, -20], [44, -30], [58, -18], [50, -2], [34, -6], [30, -20]],
      [[-60, 20], [-46, 30], [-50, 48], [-30, 56]],
      [[12, 40], [24, 52], [40, 46], [54, 60]]
    ];
    constellations.forEach((c) => {
      s += `<polyline points="${c.map((p) => p.join(",")).join(" ")}" stroke-width=".55"/>`;
      c.forEach((p) => (s += star(p[0], p[1], 1.6 + r() * 2.2)));
    });
    for (let k = 0; k < 46; k++) {
      const a = r() * Math.PI * 2, d = 10 + r() * 76;
      s += `<circle cx="${(d * Math.cos(a)).toFixed(1)}" cy="${(d * Math.sin(a)).toFixed(1)}" r="${(0.4 + r() * 0.8).toFixed(2)}" fill="${INK}" stroke="none"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="400" height="400" fill="none" stroke="${INK}" stroke-linecap="round">
<circle r="96" stroke-width="1.3"/><circle r="92" stroke-width=".5"/>
${s}
<circle r="64" stroke-width=".5" stroke-dasharray="2 2.5"/>
<circle r="34" stroke-width=".6"/>
<ellipse rx="80" ry="36" transform="rotate(-24)" stroke-width=".6" stroke-dasharray="4 2 1 2"/>
${star(0, 0, 7)}
<circle r="10" stroke-width=".4"/>
${star(44, -30, 4.5)}
</svg>`;
  }

  function castle() {
    const r = rng(77);
    let hatch = "";
    for (let x = 6; x < 254; x += 4.5) {
      const y = 150 - 38 * Math.exp(-Math.pow((x - 118) / 85, 2)) + 4;
      const len = 4 + r() * 7;
      hatch += `<line x1="${x}" y1="${y.toFixed(1)}" x2="${(x - len * 0.6).toFixed(1)}" y2="${(y + len).toFixed(1)}" stroke-width=".45"/>`;
    }
    const shade = (x, y1, y2, n) => {
      let o = "";
      for (let k = 0; k < n; k++) o += `<line x1="${x - k * 2.2}" y1="${y1}" x2="${x - k * 2.2}" y2="${y2}" stroke-width=".4"/>`;
      return o;
    };
    const crenels = (x0, x1, y) => {
      let d = `M${x0},${y}`;
      for (let x = x0, up = true; x < x1; x += 5, up = !up) d += up ? ` v-5 h5 v5` : ` h5`;
      return `<path d="${d}" stroke-width=".9"/>`;
    };
    const cypress = (x, y, s) =>
      `<path d="M${x},${y} C${x - 3 * s},${y - 8 * s} ${x - 2 * s},${y - 16 * s} ${x},${y - 22 * s} C${x + 2 * s},${y - 16 * s} ${x + 3 * s},${y - 8 * s} ${x},${y} Z" fill="${INK}" stroke-width=".5"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 3}" stroke-width=".6"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160" width="520" height="320" fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
<path d="M0,152 C30,134 64,118 104,113 C146,108 192,112 226,126 C240,132 252,142 260,152" stroke-width="1.1"/>
${hatch}
<rect x="104" y="44" width="26" height="40" stroke-width="1"/>
<path d="M100,44 L117,14 L134,44 Z" stroke-width="1"/>
${shade(129, 46, 82, 4)}
<path d="M117,14 V5 L126,8 L117,11" stroke-width=".8"/>
<path d="M114,62 v-5 a3,3 0 0 1 6,0 v5 Z" stroke-width=".7"/>
<rect x="72" y="58" width="18" height="56" stroke-width="1"/>
<path d="M69,58 L81,30 L93,58 Z" stroke-width="1"/>
${shade(89, 60, 112, 3)}
<rect x="79" y="72" width="3.5" height="7" stroke-width=".6"/>
<rect x="146" y="66" width="17" height="48" stroke-width="1"/>
<path d="M143,66 L154.5,42 L166,66 Z" stroke-width="1"/>
${shade(162, 68, 112, 4)}
<rect x="152.5" y="80" width="3.5" height="7" stroke-width=".6"/>
<rect x="90" y="84" width="56" height="30" stroke-width="1"/>
${crenels(90, 146, 84)}
<path d="M111,114 V101 A7,7 0 0 1 125,101 V114" stroke-width=".9"/>
${shade(124, 102, 113, 5)}
${cypress(42, 136, 1)}${cypress(52, 130, 0.8)}${cypress(206, 124, 0.9)}${cypress(216, 128, 1.1)}
<path d="M178,30 q4,-4 8,0 q4,-4 8,0" stroke-width=".7"/>
<path d="M196,20 q3,-3 6,0 q3,-3 6,0" stroke-width=".6"/>
<path d="M40,40 q3,-3 6,0 q3,-3 6,0" stroke-width=".6"/>
</svg>`;
  }

  function compass() {
    let s = "";
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      const r2 = k % 4 === 0 ? 84 : 88;
      s += `<line x1="${(91 * Math.cos(a)).toFixed(2)}" y1="${(91 * Math.sin(a)).toFixed(2)}" x2="${(r2 * Math.cos(a)).toFixed(2)}" y2="${(r2 * Math.sin(a)).toFixed(2)}" stroke-width=".5"/>`;
    }
    const point = (len, half, rot, sw) =>
      `<g transform="rotate(${rot})"><polygon points="0,${-len} 0,0 ${half},${-half}" fill="${INK}" stroke-width="${sw}"/><polygon points="0,${-len} 0,0 ${-half},${-half}" stroke-width="${sw}"/></g>`;
    for (let k = 0; k < 16; k++) if (k % 2) s += `<line x1="0" y1="0" x2="${(46 * Math.sin((k * Math.PI) / 8)).toFixed(2)}" y2="${(-46 * Math.cos((k * Math.PI) / 8)).toFixed(2)}" stroke-width=".4"/>`;
    [45, 135, 225, 315].forEach((a) => (s += point(58, 8, a, 0.6)));
    [0, 90, 180, 270].forEach((a) => (s += point(86, 12, a, 0.8)));
    const letter = (t, x, y) => `<text x="${x}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="15" fill="${INK}" stroke="none" text-anchor="middle" dominant-baseline="central">${t}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-112 -112 224 224" width="448" height="448" fill="none" stroke="${INK}" stroke-linejoin="round">
<circle r="95" stroke-width="1.2"/><circle r="91" stroke-width=".5"/>
${s}
<circle r="62" stroke-width=".5" stroke-dasharray="1.5 2"/>
<circle r="5" fill="#e6d5b0" stroke-width=".8"/>
${letter("N", 0, -104)}${letter("E", 104, 0)}${letter("S", 0, 104)}${letter("W", -104, 0)}
</svg>`;
  }

  const DRAWINGS = { starChart, castle, compass };
  const drawingSVG = (name) => (DRAWINGS[name] ? DRAWINGS[name]() : "");

  // Ink drawings with a little bleed baked in (desktop), plain SVG otherwise.
  function inkURL(name, bleed) {
    const svg = drawingSVG(name);
    if (!svg) return Promise.resolve(null);
    if (!bleed) return Promise.resolve(svgData(svg));
    const w = +svg.match(/width="(\d+)"/)[1], h = +svg.match(/height="(\d+)"/)[1];
    const filtered = svg.replace(
      /^<svg([^>]*)>/,
      `<svg$1><defs><filter id="bleed"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.2" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".25"/></filter></defs><g filter="url(#bleed)" opacity=".9">`
    ).replace(/<\/svg>$/, "</g></svg>");
    return bake(filtered, w * 1.5, h * 1.5, "image/webp", 0.85);
  }

  /* ---------- The pasted photograph ---------- */
  function jagged(ctx, x, y, w, h, j, r) {
    ctx.beginPath();
    const step = 7;
    ctx.moveTo(x, y);
    for (let t = x; t <= x + w; t += step) ctx.lineTo(t, y + (r() - 0.5) * j);
    for (let t = y; t <= y + h; t += step) ctx.lineTo(x + w + (r() - 0.5) * j, t);
    for (let t = x + w; t >= x; t -= step) ctx.lineTo(t, y + h + (r() - 0.5) * j);
    for (let t = y + h; t >= y; t -= step) ctx.lineTo(x + (r() - 0.5) * j, t);
    ctx.closePath();
  }

  function paintScene(ctx, x, y, w, h, r) {
    const hz = y + h * 0.58;
    let g = ctx.createLinearGradient(0, y, 0, hz);
    g.addColorStop(0, "#9d8463");
    g.addColorStop(0.7, "#d8c09a");
    g.addColorStop(1, "#ecdcbc");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, hz - y);
    const sx = x + w * 0.66, sy = hz - h * 0.08;
    g = ctx.createRadialGradient(sx, sy, 2, sx, sy, w * 0.35);
    g.addColorStop(0, "rgba(255,246,222,.95)");
    g.addColorStop(0.12, "rgba(250,232,196,.7)");
    g.addColorStop(1, "rgba(250,232,196,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // clouds
    ctx.fillStyle = "rgba(120,98,72,.25)";
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(x + w * r(), y + h * (0.12 + r() * 0.25), w * (0.12 + r() * 0.15), h * 0.018, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // sea
    g = ctx.createLinearGradient(0, hz, 0, y + h);
    g.addColorStop(0, "#b49b78");
    g.addColorStop(1, "#5d4a36");
    ctx.fillStyle = g;
    ctx.fillRect(x, hz, w, y + h - hz);
    ctx.strokeStyle = "rgba(255,240,210,.35)";
    for (let k = 0; k < 40; k++) {
      const yy = hz + 3 + Math.pow(r(), 1.6) * (y + h - hz);
      const xx = sx + (r() - 0.5) * w * 0.25 * (1 + (yy - hz) / h);
      ctx.lineWidth = 0.8 + r();
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + 6 + r() * 18, yy);
      ctx.stroke();
    }
    // headland with lighthouse
    ctx.fillStyle = "#3e3024";
    ctx.beginPath();
    ctx.moveTo(x, hz + h * 0.02);
    ctx.lineTo(x, y + h * 0.36);
    ctx.bezierCurveTo(x + w * 0.1, y + h * 0.33, x + w * 0.2, y + h * 0.44, x + w * 0.3, hz - h * 0.04);
    ctx.lineTo(x + w * 0.38, hz + h * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + w * 0.09, y + h * 0.2, w * 0.022, h * 0.15);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.084, y + h * 0.2);
    ctx.lineTo(x + w * 0.101, y + h * 0.165);
    ctx.lineTo(x + w * 0.118, y + h * 0.2);
    ctx.fill();
    // distant hills
    ctx.fillStyle = "rgba(110,92,72,.55)";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.45, hz);
    ctx.quadraticCurveTo(x + w * 0.62, hz - h * 0.07, x + w * 0.8, hz - h * 0.02);
    ctx.quadraticCurveTo(x + w * 0.9, hz - h * 0.05, x + w, hz - h * 0.01);
    ctx.lineTo(x + w, hz);
    ctx.fill();
    // a small boat
    ctx.fillStyle = "#2e241b";
    const bx = x + w * 0.52, by = hz + h * 0.12;
    ctx.beginPath();
    ctx.moveTo(bx - 14, by);
    ctx.lineTo(bx + 14, by);
    ctx.lineTo(bx + 9, by + 5);
    ctx.lineTo(bx - 9, by + 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx, by - 1);
    ctx.lineTo(bx, by - 26);
    ctx.lineTo(bx + 13, by - 3);
    ctx.fill();
  }

  function photo(src, seed = 5) {
    return new Promise((resolve) => {
      const W = 620, H = 470, B = 22;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      const r = rng(seed);
      const finish = (img) => {
        ctx.save();
        jagged(ctx, 4, 4, W - 8, H - 8, 3, r);
        ctx.clip();
        ctx.fillStyle = "#ece2c8";
        ctx.fillRect(0, 0, W, H);
        const x = B, y = B, w = W - 2 * B, h = H - 2 * B;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        if (img) {
          const s = Math.max(w / img.width, h / img.height);
          ctx.filter = "sepia(.65) contrast(.92) brightness(1.02)";
          ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
          ctx.filter = "none";
        } else {
          paintScene(ctx, x, y, w, h, r);
        }
        // vignette + fade
        const g = ctx.createRadialGradient(W / 2, H / 2, h * 0.3, W / 2, H / 2, w * 0.7);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(40,25,10,.45)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(236,220,186,.12)";
        ctx.fillRect(x, y, w, h);
        ctx.restore();
        // grain over everything
        const id = ctx.getImageData(0, 0, W, H), d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const n = (r() - 0.5) * 26;
          d[i] += n; d[i + 1] += n; d[i + 2] += n;
        }
        ctx.putImageData(id, 0, 0);
        // scratches
        ctx.strokeStyle = "rgba(250,240,220,.35)";
        for (let k = 0; k < 6; k++) {
          ctx.lineWidth = 0.5 + r() * 0.6;
          ctx.beginPath();
          const sx = x + r() * w, sy = y + r() * h;
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (r() - 0.5) * 120, sy + (r() - 0.5) * 60);
          ctx.stroke();
        }
        // worn corners
        [[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy]) => {
          const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
          g2.addColorStop(0, "rgba(248,238,214,.75)");
          g2.addColorStop(1, "rgba(248,238,214,0)");
          ctx.fillStyle = g2;
          ctx.fillRect(cx - 60, cy - 60, 120, 120);
        });
        ctx.restore();
        // one torn-off corner
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(W, H - 46);
        for (let k = 1; k < 8; k++) ctx.lineTo(W - k * 6 + (r() - 0.5) * 4, H - 46 + k * 6 + (r() - 0.5) * 4);
        ctx.lineTo(W - 50, H);
        ctx.lineTo(W, H);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : c.toDataURL()), "image/webp", 0.8);
      };
      if (src) {
        const img = new Image();
        img.onload = () => finish(img);
        img.onerror = () => finish(null);
        img.src = src;
      } else finish(null);
    });
  }

  return {
    paper: (w, h, seed, side, torn) => bake(paperSVG(w, h, seed, side, torn), w, h, "image/webp", 0.8),
    leather: (w, h, seed) => bake(leatherSVG(w, h, seed), w, h, "image/jpeg", 0.82),
    desk: (w, h) => bake(deskSVG(w, h), w, h, "image/jpeg", 0.78),
    inkURL,
    photo
  };
})();
