(function () {
  const bookEl = document.getElementById("book");
  const total = BOOK_CONTENT.length;

  // Sayfaları content.js'ten oluştur
  BOOK_CONTENT.forEach((page, i) => {
    const el = document.createElement("div");
    el.className = "page " + (i % 2 === 0 ? "page--left" : "page--right");
    el.dataset.density = "soft";

    const inner = document.createElement("div");
    inner.className = "page__inner";

    if (page.title) {
      const h = document.createElement("h2");
      h.className = "page__title";
      h.textContent = page.title;
      inner.appendChild(h);
      const rule = document.createElement("div");
      rule.className = "page__rule";
      rule.textContent = "❦";
      inner.appendChild(rule);
    }

    (page.body || []).forEach((text, j) => {
      const p = document.createElement("p");
      if (j === 0) p.className = "dropcap";
      p.textContent = text;
      inner.appendChild(p);
    });

    if (page.quote) {
      const q = document.createElement("p");
      q.className = "page__quote";
      q.textContent = page.quote;
      inner.appendChild(q);
    }

    const num = document.createElement("span");
    num.className = "page__num";
    num.textContent = i + 1;
    inner.appendChild(num);

    el.appendChild(inner);
    bookEl.appendChild(el);
  });

  const pageFlip = new St.PageFlip(bookEl, {
    width: 520,
    height: 700,
    size: "stretch",
    minWidth: 260,
    maxWidth: 620,
    minHeight: 350,
    maxHeight: 840,
    showCover: false,
    usePortrait: true,
    maxShadowOpacity: 0.6,
    flippingTime: 900,
    mobileScrollSupport: false
  });

  pageFlip.loadFromHTML(document.querySelectorAll("#book .page"));

  const info = document.getElementById("page-info");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");

  function updateInfo() {
    const idx = pageFlip.getCurrentPageIndex();
    const portrait = pageFlip.getOrientation() === "portrait";
    if (portrait || idx + 1 >= total) {
      info.textContent = (idx + 1) + " / " + total;
    } else {
      info.textContent = (idx + 1) + "–" + (idx + 2) + " / " + total;
    }
    prev.disabled = idx === 0;
    next.disabled = portrait ? idx >= total - 1 : idx >= total - 2;
  }

  pageFlip.on("flip", updateInfo);
  pageFlip.on("changeOrientation", updateInfo);
  updateInfo();

  prev.addEventListener("click", () => pageFlip.flipPrev());
  next.addEventListener("click", () => pageFlip.flipNext());
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") pageFlip.flipPrev();
    if (e.key === "ArrowRight") pageFlip.flipNext();
  });
})();
