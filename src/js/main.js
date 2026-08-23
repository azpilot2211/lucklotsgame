(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");

  function setNavigation(open, restoreFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    if (restoreFocus) toggle.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNavigation(toggle.getAttribute("aria-expanded") !== "true", false);
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNavigation(false, false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNavigation(false, true);
      }
    });
  }

  var revealItems = document.querySelectorAll("[data-reveal]");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  document.addEventListener("click", function (event) {
    var anchor = event.target.closest("a[data-play-placement]");
    if (!anchor) return;
    var placement = anchor.dataset.playPlacement;
    document.dispatchEvent(new CustomEvent("ll:play-store-click", {
      detail: { placement: anchor.dataset.playPlacement },
    }));
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", "PlayStoreClick", { placement: placement });
    }
  });
}());
