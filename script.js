(function () {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = matchMedia("(max-width: 719px), (pointer: coarse)").matches;

  const RATIO = 540 / 750; // page width / height
  const MIN_W = 260; // narrower than 2 × this → single page (portrait)

  const stage = document.getElementById("stage");
  const bookEl = document.getElementById("book");
  const hint = document.getElementById("hint");
  const info = document.getElementById("page-info");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  const pages = BOOK.pages;
  const inner = pages.length;
  const total = inner + 2;

  hint.textContent = BOOK.cover.hint;

  /* ---------- Building the pages ---------- */
  const h = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const RULE =
    '<svg viewBox="0 0 120 10" aria-hidden="true"><path d="M2 5 H50 M70 5 H118" stroke="currentColor" stroke-width=".8" fill="none"/><path d="M60 1 L64 5 L60 9 L56 5 Z" fill="currentColor"/><circle cx="46" cy="5" r="1" fill="currentColor"/><circle cx="74" cy="5" r="1" fill="currentColor"/></svg>';

  const inkJobs = [];
  function figure(name, cls, alt) {
    const fig = h("figure", "ink " + (cls || ""));
    const img = h("img");
    img.alt = alt || "";
    img.decoding = "async";
    fig.appendChild(img);
    inkJobs.push({ img, name });
    return fig;
  }

  const ALT = {
    starChart: "An ink star chart with rings, constellations and a bright star.",
    castle: "An ink sketch of a castle on a hill.",
    compass: "An ink compass rose."
  };

  function title(c, p) {
    if (!p.title) return;
    c.appendChild(h("h2", "page-title", p.title));
    const rule = h("div", "rule");
    rule.innerHTML = RULE;
    c.appendChild(rule);
  }

  function paragraphs(c, list, dropcap) {
    (list || []).forEach((t, i) => c.appendChild(h("p", "body" + (dropcap && i === 0 ? " dropcap" : ""), t)));
  }

  const RENDER = {
    contents(c, p) {
      title(c, p);
      const ol = h("ol", "toc");
      p.entries.forEach((e) => {
        const li = h("li");
        const b = h("button", "toc-link");
        b.type = "button";
        b.dataset.page = e.page;
        b.textContent = e.label;
        li.appendChild(b);
        li.appendChild(h("span", "toc-dots"));
        li.appendChild(h("span", "toc-num", String(e.page)));
        ol.appendChild(li);
      });
      c.appendChild(ol);
      if (p.note) c.appendChild(h("p", "hand note note--end", p.note));
    },
    text(c, p) {
      title(c, p);
      paragraphs(c, p.paragraphs, true);
      if (p.drawing) c.appendChild(figure(p.drawing, "ink--foot", ALT[p.drawing]));
      if (p.note) c.appendChild(h("p", "hand note", p.note));
    },
    drawing(c, p) {
      title(c, p);
      c.appendChild(figure(p.drawing, "ink--plate", ALT[p.drawing]));
      if (p.caption) c.appendChild(h("p", "caption", p.caption));
      (p.notes || []).forEach((n, i) => c.appendChild(h("p", "hand note note--" + (i % 2 ? "b" : "a"), n)));
    },
    photo(c, p) {
      title(c, p);
      const fig = h("figure", "photo");
      const img = h("img");
      img.alt = p.photo ? p.caption || "Photograph" : "A faded sepia photograph of a lighthouse on a headland at sunset.";
      fig.appendChild(img);
      fig.appendChild(h("span", "tape tape--a"));
      fig.appendChild(h("span", "tape tape--b"));
      c.appendChild(fig);
      if (p.caption) c.appendChild(h("p", "hand note note--photo", p.caption));
      Art.photo(p.photo).then((url) => (img.src = url));
    },
    list(c, p) {
      title(c, p);
      if (p.intro) c.appendChild(h("p", "body", p.intro));
      const ul = h("ul", "items");
      p.items.forEach((t) => ul.appendChild(h("li", null, t)));
      c.appendChild(ul);
      if (p.drawing) c.appendChild(figure(p.drawing, "ink--margin", ALT[p.drawing]));
    },
    notes(c, p) {
      title(c, p);
      paragraphs(c, p.paragraphs);
      const ul = h("ul", "hand-list");
      (p.lines || []).forEach((t, i) => ul.appendChild(h("li", "hand" + (i === 0 ? " hand-head" : ""), t)));
      c.appendChild(ul);
    },
    contact(c, p) {
      title(c, p);
      paragraphs(c, p.paragraphs);
      const dl = h("dl", "letters");
      (p.links || []).forEach((l) => {
        dl.appendChild(h("dt", null, l.label));
        const dd = h("dd");
        if (l.href) {
          const a = h("a", null, l.value);
          a.href = l.href;
          a.target = "_blank";
          a.rel = "noopener";
          dd.appendChild(a);
        } else dd.textContent = l.value;
        dl.appendChild(dd);
      });
      c.appendChild(dl);
      if (p.signature) c.appendChild(h("p", "hand signature", p.signature));
    }
  };

  const GILT_FRAME = `<svg class="cover-frame" viewBox="0 0 540 750" aria-hidden="true">
  <defs>
    <linearGradient id="gilt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1d98f"/><stop offset=".35" stop-color="#c8a04a"/>
      <stop offset=".55" stop-color="#8a6a24"/><stop offset=".75" stop-color="#e2c271"/><stop offset="1" stop-color="#9c7a30"/>
    </linearGradient>
    <g id="fleuron">
      <path d="M0 0 C14 2 24 10 26 24 C18 16 10 14 0 16 Z"/>
      <path d="M0 0 C2 14 10 24 24 26 C16 18 14 10 16 0 Z"/>
      <circle cx="30" cy="30" r="3"/>
    </g>
  </defs>
  <g fill="none" stroke="url(#gilt)">
    <rect x="30" y="30" width="480" height="690" stroke-width="2.4"/>
    <rect x="40" y="40" width="460" height="670" stroke-width=".9"/>
    <rect x="58" y="58" width="424" height="634" stroke-width=".6" stroke-dasharray="1 5"/>
  </g>
  <g fill="url(#gilt)">
    <use href="#fleuron" transform="translate(46 46)"/>
    <use href="#fleuron" transform="translate(494 46) scale(-1 1)"/>
    <use href="#fleuron" transform="translate(46 704) scale(1 -1)"/>
    <use href="#fleuron" transform="translate(494 704) scale(-1 -1)"/>
    <path d="M270 150 l10 10 -10 10 -10 -10 Z"/>
    <path d="M190 160 H250 M290 160 H350" stroke="url(#gilt)" stroke-width="1.2"/>
    <g transform="translate(270 470)">
      <circle r="62" fill="none" stroke="url(#gilt)" stroke-width="1.4"/>
      <circle r="55" fill="none" stroke="url(#gilt)" stroke-width=".6"/>
      <path d="M0 -52 L7 -7 L52 0 L7 7 L0 52 L-7 7 L-52 0 L-7 -7 Z"/>
      <path d="M0 -34 L4 -4 L34 0 L4 4 L0 34 L-4 4 L-34 0 L-4 -4 Z" transform="rotate(45)" opacity=".75"/>
      <circle r="4.5" fill="#4b1a16"/>
    </g>
    <path d="M190 600 H350" stroke="url(#gilt)" stroke-width="1.2"/>
  </g>
</svg>`;

  function coverPage(kind) {
    const page = h("div", "page page--cover page--" + kind);
    page.dataset.density = "hard";
    page.appendChild(h("div", "leather"));
    if (kind === "front") {
      page.insertAdjacentHTML("beforeend", GILT_FRAME);
      page.appendChild(h("h2", "cover-title gilt", BOOK.cover.title));
      page.appendChild(h("p", "cover-sub gilt", BOOK.cover.subtitle));
      page.appendChild(h("p", "cover-vol gilt", BOOK.cover.volume));
    } else {
      page.insertAdjacentHTML(
        "beforeend",
        `<svg class="blind-stamp" viewBox="-60 -60 120 120" aria-hidden="true"><circle r="54" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0 -44 L6 -6 L44 0 L6 6 L0 44 L-6 6 L-44 0 L-6 -6 Z" fill="currentColor"/></svg>`
      );
      page.appendChild(h("p", "cover-motto gilt", BOOK.backCover.motto));
    }
    page.appendChild(h("div", "hinge"));
    return page;
  }

  const pageEls = [];
  bookEl.appendChild(coverPage("front"));
  pages.forEach((p, i) => {
    const n = i + 1;
    const side = n % 2 ? "left" : "right";
    const page = h("div", "page page--paper page--" + side);
    page.dataset.density = "soft";
    page.appendChild(h("div", "paper"));
    const c = h("div", "page-content type-" + p.type);
    (RENDER[p.type] || RENDER.text)(c, p);
    page.appendChild(c);
    page.appendChild(h("div", "gutter"));
    page.appendChild(h("span", "folio", String(n)));
    bookEl.appendChild(page);
    pageEls.push({ page, side, n });
  });
  bookEl.appendChild(coverPage("back"));

  /* ---------- Layout ---------- */
  let portrait = false;
  function layout() {
    const root = document.documentElement; // clientWidth ignores overflow-expanded layout viewports
    const availW = root.clientWidth - 32;
    const availH = root.clientHeight - (lite ? 116 : 190);
    const land = Math.min(availW * (lite ? 1 : 0.9), availH * 2 * RATIO, 1180);
    portrait = land < 2 * MIN_W;
    const w = portrait ? Math.min(availW - 22, availH * RATIO, 620) : land; // room for the page block edge
    const pw = portrait ? w : w / 2;
    stage.style.width = Math.floor(w) + "px";
    stage.style.setProperty("--pw", pw + "px");
    stage.style.setProperty("--ph", pw / RATIO + "px");
  }
  window.addEventListener("resize", layout); // registered before PageFlip's own listener
  layout();

  /* ---------- PageFlip ---------- */
  const pf = new St.PageFlip(bookEl, {
    width: 540,
    height: 750,
    size: "stretch",
    minWidth: MIN_W,
    maxWidth: 1000,
    minHeight: 200,
    maxHeight: 2000,
    showCover: true,
    usePortrait: true,
    drawShadow: true,
    maxShadowOpacity: 0.55,
    flippingTime: reduceMotion ? 250 : 1100,
    showPageCorners: !reduceMotion,
    mobileScrollSupport: false,
    swipeDistance: 25
  });
  pf.loadFromHTML(bookEl.querySelectorAll(".page"));

  const STACK = lite ? 9 : 16;
  function update(opening) {
    const i = pf.getCurrentPageIndex();
    const isPortrait = pf.getOrientation() === "portrait";
    const front = i === 0 && !opening;
    const back = i === total - 1 && !opening;
    const pw = parseFloat(stage.style.getPropertyValue("--pw"));

    stage.classList.toggle("is-portrait", isPortrait);
    stage.classList.toggle("is-front", front);
    stage.classList.toggle("is-back", back);
    // Boards/stacks on a side appear only once a page actually lies there.
    stage.classList.toggle("hide-left", i === 0 || isPortrait);
    stage.classList.toggle("hide-right", i === total - 1 && !isPortrait);

    let leftFrac, rightFrac, shift = 0, vx = 0, vw = isPortrait ? pw : pw * 2;
    if (isPortrait) {
      leftFrac = 0;
      rightFrac = (total - 1 - i) / (total - 1);
    } else if (front) {
      leftFrac = 0; rightFrac = 1; shift = -pw / 2; vx = pw; vw = pw;
    } else if (back) {
      leftFrac = 1; rightFrac = 0; shift = pw / 2; vw = pw;
    } else {
      const l = Math.max(1, i);
      leftFrac = l / (total - 1);
      rightFrac = 1 - leftFrac;
      // While the cover is still swinging, light and shadow stay on the half that holds pages.
      if (opening && i === 0) { vx = pw; vw = pw; }
      if (opening && i === total - 1) vw = pw;
    }
    stage.style.setProperty("--tl", Math.max(2, leftFrac * STACK) + "px");
    stage.style.setProperty("--tr", Math.max(2, rightFrac * STACK) + "px");
    stage.style.setProperty("--rx", isPortrait ? "0px" : pw + "px");
    stage.style.setProperty("--shift", shift + "px");
    stage.style.setProperty("--vx", vx + "px");
    stage.style.setProperty("--vw", vw + "px");

    if (i > 0) hint.classList.add("is-gone");

    if (i === 0) info.textContent = "Cover";
    else if (i === total - 1) info.textContent = "Back cover";
    else if (isPortrait || i === total - 2) info.textContent = `Page ${i} of ${inner}`;
    else info.textContent = `Pages ${i}–${i + 1} of ${inner}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
  }

  pf.on("flip", () => update());
  pf.on("changeOrientation", () => {
    layout();
    update();
  });
  pf.on("changeState", (e) => {
    // Start sliding a closed book to the centre as soon as it begins to open.
    if (e.data === "flipping" || e.data === "user_fold") {
      const i = pf.getCurrentPageIndex();
      if (i === 0 || i === total - 1) update(true);
    } else if (e.data === "read") update();
  });
  window.addEventListener("resize", () => requestAnimationFrame(() => update()));
  update();

  prevBtn.addEventListener("click", () => pf.flipPrev());
  nextBtn.addEventListener("click", () => pf.flipNext());
  bookEl.addEventListener("click", (e) => {
    const link = e.target.closest(".toc-link");
    if (link) pf.flip(+link.dataset.page);
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (e.key === "ArrowLeft") pf.flipPrev();
    else if (e.key === "ArrowRight") pf.flipNext();
    else if ((e.key === "Enter" || e.key === " ") && e.target === stage) {
      e.preventDefault();
      pf.flipNext();
    }
  });

  /* ---------- Textures (rendered once, in order of visibility) ---------- */
  const texScale = lite ? 0.6 : 1;
  const TW = Math.round(760 * texScale), TH = Math.round(TW / RATIO);
  const reveal = () => document.body.classList.add("is-ready");
  setTimeout(reveal, 1800); // never keep the book hidden for long

  (async () => {
    const [desk, leather] = await Promise.all([
      Art.desk(lite ? 900 : 1600, lite ? 1200 : 1000),
      Art.leather(Math.round(TW * 0.8), Math.round(TH * 0.8), 31)
    ]);
    if (desk) document.body.style.setProperty("--desk", `url(${desk})`);
    if (leather) document.documentElement.style.setProperty("--leather", `url(${leather})`);
    reveal();

    for (const { page, side, n } of pageEls) {
      const torn = n === 3 || n === 6 || n === 8;
      const url = await Art.paper(TW, TH, 1000 + n * 97, side, torn);
      if (url) {
        const paper = page.querySelector(".paper");
        paper.style.backgroundImage = `url(${url})`;
        paper.classList.add("is-textured");
      }
    }
    for (const job of inkJobs) job.img.src = await Art.inkURL(job.name, !lite);
  })();

  // Ink drawings appear immediately as plain SVG, then get their baked version.
  inkJobs.forEach((job) => Art.inkURL(job.name, false).then((u) => { if (!job.img.src) job.img.src = u; }));

  /* ---------- Dust in the lamp light ---------- */
  const canvas = document.getElementById("dust");
  if (reduceMotion) {
    canvas.remove();
  } else {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W, H, motes;
    const count = lite ? 18 : 46;
    const resize = () => {
      W = canvas.width = Math.round(window.innerWidth * dpr);
      H = canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    const spawn = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -10,
      r: (0.4 + Math.random() * 1.3) * dpr,
      vx: (0.03 + Math.random() * 0.08) * dpr,
      vy: (0.02 + Math.random() * 0.06) * dpr,
      ph: Math.random() * Math.PI * 2,
      a: 0.25 + Math.random() * 0.5
    });
    resize();
    motes = Array.from({ length: count }, () => spawn(true));
    window.addEventListener("resize", resize);
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(50, now - last) / 16.7;
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const m of motes) {
        m.ph += 0.01 * dt;
        m.x += (m.vx + Math.sin(m.ph) * 0.05) * dt;
        m.y += (m.vy + Math.cos(m.ph * 0.7) * 0.04) * dt;
        if (m.x > W + 10 || m.y > H + 10) Object.assign(m, spawn(false), { x: Math.random() * W * 0.7 });
        // brighter inside the lamp beam (upper left → centre)
        const beam = Math.max(0, 1 - Math.hypot(m.x / W - 0.42, m.y / H - 0.38) * 1.8);
        const alpha = m.a * (0.15 + beam) * (0.7 + 0.3 * Math.sin(m.ph * 3));
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(255,224,170,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!document.hidden) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) { last = performance.now(); requestAnimationFrame(tick); }
    });
  }
})();
