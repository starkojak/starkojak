/* Starkojak: panels snap in as they scroll into view; contract address from content.js. */
(function () {
  "use strict";

  // Contract address: always rendered from the single constant in content.js.
  document.querySelectorAll("[data-ca]").forEach(function (el) {
    el.textContent = STARKOJAK_CA;
  });
  document.querySelectorAll("[data-ca-short]").forEach(function (el) {
    el.textContent = STARKOJAK_CA.slice(0, 8) + "\u2026" + STARKOJAK_CA.slice(-6);
  });

  document.querySelectorAll("[data-starklaunchy]").forEach(function (el) {
    el.href = STARKLAUNCHY_URL;
  });

  // Copy always copies the full address, whatever is shown on screen.
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }

  var status = document.querySelector("[data-copy-status]");
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var timer;
    btn.addEventListener("click", function () {
      copy(STARKOJAK_CA).then(function () {
        btn.textContent = "Copied";
        if (status) status.textContent = "Copied";
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.textContent = "Copy";
          if (status) status.textContent = "";
        }, 1800);
      }, function () {
        // Leave the address selectable so it can be copied by hand.
        var range = document.createRange();
        range.selectNodeContents(document.querySelector("[data-ca]"));
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    });
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
