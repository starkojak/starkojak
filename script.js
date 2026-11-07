/* Starkojak: behaviour only. Every word on the page comes from content.js (filled by the inline
   script at the end of index.html). Motion is driven by the normal scroll: nothing here holds or
   steers the scroll position. With prefers-reduced-motion the page stays still. */
(function () {
  "use strict";

  var C = window.STARK_COPY || {};
  var doc = document;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function copyText(path, fallback) {
    var v = path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, C);
    return typeof v === "string" ? v : fallback;
  }
  function later(fn) {
    if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout: 2500 });
    else window.setTimeout(fn, 500);
  }

  /* ------------------------------------------------------------ copy the contract address */

  function fallbackCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    doc.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
    doc.body.removeChild(ta);
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }

  var status = $("[data-copy-status]");
  $$("[data-copy]").forEach(function (btn) {
    var label = $("[data-copy-text]", btn);
    var timer;
    btn.addEventListener("click", function () {
      if (typeof STARKOJAK_CA !== "string") return;
      copy(STARKOJAK_CA).then(function () {
        var done = copyText("token.copied", "Copied");
        if (label) label.textContent = done;
        if (status) status.textContent = done;
        btn.classList.add("is-done");
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          if (label) label.textContent = copyText("token.copy", "Copy");
          if (status) status.textContent = "";
          btn.classList.remove("is-done");
        }, 1800);
      }, function () {
        // leave the address selected so it can be copied by hand
        var el = $("[data-ca]");
        if (!el) return;
        var range = doc.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    });
  });

  /* ------------------------------------------------------------ arrivals */

  var reveals = $$("[data-reveal]");
  if (reduced || !hasIO) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        rio.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { rio.observe(el); });
  }

  /* ------------------------------------------------------------ the hero film (never blocks the page) */

  var hero = $("[data-hero]");
  var video = $("[data-hero-video]");
  var pauseBtn = $("[data-pause]");
  var userPaused = false;
  var heroVisible = true;

  function setPauseLabel() {
    if (!pauseBtn) return;
    var paused = video.paused;
    pauseBtn.classList.toggle("is-paused", paused);
    pauseBtn.setAttribute("aria-label", paused ? copyText("hero.play", "Play the film") : copyText("hero.pause", "Pause the film"));
  }

  function startFilm() {
    if (!video || reduced) return;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""))) return;
    var portrait = window.matchMedia("(max-aspect-ratio: 3/4)").matches;
    var base = "assets/hero/hero-" + (portrait ? "portrait" : "1080");
    var ua = navigator.userAgent;
    // Safari and every browser on iOS (all WebKit) get H.264, which Apple hardware decodes;
    // Chromium and Firefox get the smaller VP9 file when they can play it.
    var webkit = /AppleWebKit/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/i.test(ua);
    var vp9 = video.canPlayType('video/webm; codecs="vp9"') === "probably";
    video.src = base + (vp9 && !webkit ? ".webm" : ".mp4");
    video.addEventListener("playing", function () {
      video.classList.add("is-playing");
      if (pauseBtn) { pauseBtn.hidden = false; setPauseLabel(); }
    });
    video.addEventListener("pause", setPauseLabel);
    video.addEventListener("play", setPauseLabel);
    if (heroVisible) play();            // if the hero is already off screen, it starts when it returns
  }

  function play() {
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused (e.g. Low Power Mode): the poster stays */ });
  }

  if (pauseBtn && video) {
    pauseBtn.addEventListener("click", function () {
      if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
    });
  }

  if (video && !reduced) {
    if (doc.readyState === "complete") later(startFilm);
    else window.addEventListener("load", function () { later(startFilm); });
    if (hasIO && hero) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (!video.src) return;
        if (!heroVisible) video.pause();
        else if (!userPaused) play();
      }, { threshold: 0 }).observe(hero);
    }
  }

  /* ------------------------------------------------------------ graphite to colour (WebGL) */

  var VERT = [
    "attribute vec2 aPos;",
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);",
    "  gl_Position = vec4(aPos, 0.0, 1.0);",
    "}"
  ].join("\n");

  // The colour arrives like a wash: in the order of the reveal map (the light comes from the low
  // sun on the left, the windows catch it first), with a frayed edge where the pigment pools.
  var FRAG = [
    "precision mediump float;",
    "varying vec2 vUv;",
    "uniform sampler2D uG;",
    "uniform sampler2D uC;",
    "uniform sampler2D uM;",
    "uniform sampler2D uN;",
    "uniform vec4 uCover;",
    "uniform float uR;",
    "void main() {",
    "  vec2 uv = vUv * uCover.xy + uCover.zw;",
    "  vec3 g = texture2D(uG, uv).rgb;",
    "  vec3 c = texture2D(uC, uv).rgb;",
    "  float m = texture2D(uM, uv).r;",
    "  float n = texture2D(uN, uv * 3.0).r * 0.62 + texture2D(uN, uv * 7.3 + 0.37).r * 0.38;",
    "  float e = 0.045;",
    "  float t = m + (n - 0.5) * 0.05;",
    "  float p = uR * (1.0 + 2.0 * e + 0.05) - e - 0.025;",
    "  float a = smoothstep(t - e, t + e, p);",
    "  float band = 1.0 - abs(a * 2.0 - 1.0);",
    "  band *= band * band;",
    "  vec3 col = mix(g, c, a) * (1.0 - 0.15 * band);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function makeNoise(size) {
    // tileable value noise, about 8 texels per feature
    var cells = size / 8, grid = new Float32Array(cells * cells), out = new Uint8Array(size * size);
    for (var i = 0; i < grid.length; i++) grid[i] = Math.random();
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var gx = x / 8, gy = y / 8, x0 = Math.floor(gx), y0 = Math.floor(gy);
        var fx = gx - x0, fy = gy - y0;
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
        var x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
        var a = grid[y0 * cells + x0], b = grid[y0 * cells + x1], c = grid[y1 * cells + x0], d = grid[y1 * cells + x1];
        out[y * size + x] = Math.round(255 * ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy));
      }
    }
    return out;
  }

  function createRenderer(canvas) {
    var gl;
    try {
      gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "default" });
    } catch (e) { gl = null; }
    if (!gl) return null;

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var u = {
      G: gl.getUniformLocation(prog, "uG"), C: gl.getUniformLocation(prog, "uC"),
      M: gl.getUniformLocation(prog, "uM"), N: gl.getUniformLocation(prog, "uN"),
      cover: gl.getUniformLocation(prog, "uCover"), r: gl.getUniformLocation(prog, "uR")
    };
    gl.uniform1i(u.G, 0); gl.uniform1i(u.C, 1); gl.uniform1i(u.M, 2); gl.uniform1i(u.N, 3);

    function texture(unit, repeat) {
      var t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      return t;
    }
    var tex = [texture(0), texture(1), texture(2), texture(3, true)];
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, tex[3]);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 256, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, makeNoise(256));

    var size = [0, 0], imgAspect = 16 / 9, focus = [0.5, 0.5];
    return {
      gl: gl,
      setImages: function (g, c, m, aspect, fx, fy) {
        [g, c, m].forEach(function (img, i) {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, tex[i]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        });
        imgAspect = aspect; focus = [fx, fy];
      },
      resize: function (w, h) {
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        size = [w, h];
        gl.viewport(0, 0, w, h);
      },
      draw: function (r) {
        var ca = size[0] / Math.max(1, size[1]);
        var su = 1, sv = 1;
        if (ca > imgAspect) sv = imgAspect / ca; else su = ca / imgAspect;
        gl.uniform4f(u.cover, su, sv, focus[0] * (1 - su), focus[1] * (1 - sv));
        gl.uniform1f(u.r, r);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  // Load an image through <picture>, so the browser picks AVIF when it can and WebP otherwise.
  function loadPicture(base) {
    return new Promise(function (resolve, reject) {
      var pic = doc.createElement("picture");
      var src = doc.createElement("source");
      src.type = "image/avif";
      src.srcset = base + ".avif";
      var img = doc.createElement("img");
      img.decoding = "async";
      img.alt = "";
      pic.appendChild(src);
      pic.appendChild(img);
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = base + ".webp";
    });
  }
  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function setupTurn() {
    var sec = $("[data-turn]");
    if (!sec || reduced) return null;
    var track = $(".turn__track", sec);
    var stage = $(".turn__stage", sec);
    var frameEl = $("[data-turn-frame]", sec);
    var canvas = $("[data-turn-canvas]", sec);
    var before = $("[data-turn-before]", sec);
    var after = $("[data-turn-after]", sec);
    var dusk = $("[data-turn-dusk]", sec);
    var seal = $("[data-turn-seal]", sec);
    var fallbackImgs = $$("[data-turn-img]", sec);
    var renderer = null, ready = false, mode = "", lastR = -1, lastSize = "";
    var state = { p: -1 };

    function pickSet() {
      var w = stage.clientWidth, h = stage.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w / Math.max(1, h) < 0.9) return { name: "portrait", g: "assets/graphite/graphite-portrait-1080", c: "assets/graphite/colour-portrait-1080", m: "assets/graphite/reveal-map-portrait.png", aspect: 1080 / 1920, fx: 0.5, fy: 0.5 };
      var big = w * dpr >= 1800;
      return { name: big ? "2560" : "1600", g: "assets/graphite/graphite-" + (big ? "2560" : "1600"), c: "assets/graphite/colour-" + (big ? "2560" : "1600"), m: "assets/graphite/reveal-map.png", aspect: 16 / 9, fx: 0.56, fy: 0.46 };
    }

    function useFallback(set) {
      sec.classList.add("turn--fallback");
      renderer = null;
      fallbackImgs.forEach(function (img) {
        var which = img.getAttribute("data-turn-img");
        img.src = (which === "graphite" ? set.g : set.c) + ".webp";
      });
      ready = true;
      lastR = -1;
      requestFrame();
    }

    function load() {
      var set = pickSet();
      mode = set.name;
      renderer = createRenderer(canvas);
      if (!renderer) { useFallback(set); return; }
      canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); useFallback(pickSet()); }, { once: true });
      Promise.all([loadPicture(set.g), loadPicture(set.c), loadImage(set.m)]).then(function (imgs) {
        if (!renderer) return;
        renderer.setImages(imgs[0], imgs[1], imgs[2], set.aspect, set.fx, set.fy);
        ready = true;
        lastR = -1; lastSize = "";
        requestFrame();
      }).catch(function () { useFallback(set); });
    }

    if (hasIO) {
      var lio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { lio.disconnect(); load(); }
      }, { rootMargin: "150% 0px 150% 0px" });
      lio.observe(sec);
    } else {
      load();
    }

    return {
      read: function (vh) {
        var r = track.getBoundingClientRect();
        state.visible = r.bottom > 0 && r.top < vh;
        state.p = clamp(-r.top / Math.max(1, r.height - stage.clientHeight), 0, 1);
      },
      write: function () {
        if (!state.visible && lastR >= 0) return;
        var p = state.p;
        var narrow = window.innerWidth <= 760;
        var s0 = narrow ? 0.8 : 0.74;
        var s = s0 + (1 - s0) * smooth(0.06, 0.34, p);
        frameEl.style.transform = "scale(" + s.toFixed(4) + ")";
        frameEl.style.setProperty("--frame-border", (1 - smooth(0.26, 0.34, p)).toFixed(3));
        before.style.opacity = (1 - smooth(0.1, 0.22, p)).toFixed(3);
        seal.style.opacity = (1 - smooth(0.18, 0.3, p)).toFixed(3);
        var a = smooth(0.8, 0.9, p);
        after.style.opacity = a.toFixed(3);
        after.style.transform = "translate3d(0," + ((1 - a) * 12).toFixed(1) + "px,0)";
        dusk.style.opacity = smooth(0.9, 1, p).toFixed(3);
        sec.classList.toggle("is-open", p > 0.2);
        var rev = smooth(0.32, 0.86, p);
        if (!ready) return;
        if (renderer) {
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          var w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
          var key = w + "x" + h;
          if (key !== lastSize) { renderer.resize(w, h); lastSize = key; lastR = -1; }
          if (Math.abs(rev - lastR) > 0.0005) { renderer.draw(rev); lastR = rev; }
        } else if (Math.abs(rev - lastR) > 0.0005) {
          fallbackImgs[1].style.opacity = rev.toFixed(3);
          lastR = rev;
        }
      },
      resize: function () { lastSize = ""; }
    };
  }

  /* ------------------------------------------------------------ the making (scrubbed by the scroll) */

  function setupMaking() {
    var sec = $("[data-making]");
    if (!sec || reduced) return null;
    var track = $(".making__track", sec);
    var stage = $(".making__stage", sec);
    var imgs = $$(".making__img", sec);
    var steps = $$(".making__steps li", sec);
    var nowN = $("[data-making-n]", sec);
    var nowL = $("[data-making-label]", sec);
    var labels = (C.making && C.making.stages) || [];
    var n = imgs.length, active = -1, state = {};
    if (nowL && labels[0]) nowL.textContent = labels[0];

    return {
      read: function (vh) {
        var r = track.getBoundingClientRect();
        state.visible = r.bottom > 0 && r.top < vh;
        state.p = clamp(-r.top / Math.max(1, r.height - stage.clientHeight), 0, 1);
      },
      write: function () {
        if (!state.visible && active >= 0) return;
        var f = clamp(state.p / 0.9, 0, 1) * (n - 1);      // the last stage holds a little
        var k = Math.floor(f), e = smooth(0.35, 0.85, f - k);
        for (var i = 1; i < n; i++) {
          var o = i <= k ? 1 : i === k + 1 ? e : 0;
          imgs[i].style.opacity = o.toFixed(3);
        }
        var now = clamp(e > 0.5 ? k + 1 : k, 0, n - 1);
        if (now !== active) {
          active = now;
          steps.forEach(function (li, i) {
            li.classList.toggle("is-on", i === now);
            li.classList.toggle("is-past", i < now);
          });
          if (nowN) nowN.textContent = (now + 1 < 10 ? "0" : "") + (now + 1);
          if (nowL && labels[now]) nowL.textContent = labels[now];
        }
      }
    };
  }

  /* ------------------------------------------------------------ the scroll loop */

  var bar = $("[data-bar]");
  var turn = setupTurn();
  var making = setupMaking();
  var parallax = reduced ? [] : $$("[data-parallax]").map(function (el) {
    return { el: el, box: el.tagName === "IMG" ? el.closest(".panel") : el.closest(".still"), img: el.tagName === "IMG" };
  });
  var heroH = hero ? hero.offsetHeight : 0;
  var queued = false;

  function frame() {
    queued = false;
    var vh = window.innerHeight;
    // read everything first
    var y = window.pageYOffset;
    if (turn) turn.read(vh);
    if (making) making.read(vh);
    for (var i = 0; i < parallax.length; i++) {
      var r = parallax[i].box.getBoundingClientRect();
      parallax[i].on = r.bottom > -40 && r.top < vh + 40;
      parallax[i].t = clamp(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      parallax[i].h = r.height;
    }
    // then write
    if (bar) bar.classList.toggle("is-solid", y > heroH - 60);
    if (turn) turn.write();
    if (making) making.write();
    for (var j = 0; j < parallax.length; j++) {
      var it = parallax[j];
      if (!it.on) continue;
      var dy = it.img ? -it.t * 14 : -it.t * it.h * 0.05;
      it.el.style.transform = "translate3d(0," + dy.toFixed(2) + "px,0)" + (it.img ? " scale(1.08)" : "");
    }
  }

  function requestFrame() {
    if (!queued) { queued = true; window.requestAnimationFrame(frame); }
  }

  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", function () {
    heroH = hero ? hero.offsetHeight : 0;
    if (turn) turn.resize();
    requestFrame();
  });
  requestFrame();
})();
