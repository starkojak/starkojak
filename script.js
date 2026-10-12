/* Starkojak: panels snap in as they scroll into view; contract address from content.js. */
(function () {
  "use strict";

  // Contract address: always rendered from the single constant in content.js.
  document.querySelectorAll("[data-ca]").forEach(function (el) {
    el.textContent = STARKOJAK_CA;
  });

  var panels = document.querySelectorAll(".snap");
  var STAGGER = 90;

  if (!("IntersectionObserver" in window)) {
    panels.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.style.setProperty("--delay", n++ * STAGGER + "ms");
      el.classList.add("is-in");
      io.unobserve(el);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });

  panels.forEach(function (el) { io.observe(el); });
})();
