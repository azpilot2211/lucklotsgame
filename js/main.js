/* Lucky Lots landing.
   Hero: one canvas scrub engine, two frame sets — the 15s neighborhood movie
   on desktop (frames/desktop/), the original portrait promo on mobile
   (frames/). Scroll advances the frames; after the last frame the page
   scrolls on into reveal-animated sections. Vanilla JS, no deps. */
(function () {
  "use strict";

  var track = document.getElementById("hero");
  var hud = document.getElementById("hero-hud");
  var endcap = document.getElementById("hero-endcap");
  var canvas = document.getElementById("scrub-canvas");
  var ctx = canvas.getContext("2d");
  var mobileQuery = window.matchMedia("(max-width: 820px)");

  var SETS = {
    desktop: { dir: track.getAttribute("data-desktop-dir"), count: +track.getAttribute("data-desktop-count"), frames: [], started: false },
    mobile:  { dir: track.getAttribute("data-mobile-dir"),  count: +track.getAttribute("data-mobile-count"),  frames: [], started: false },
  };

  function activeSet() { return mobileQuery.matches ? SETS.mobile : SETS.desktop; }

  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

  function progress() {
    var r = track.getBoundingClientRect();
    return clamp01(-r.top / (r.height - window.innerHeight));
  }

  function frameSrc(set, i) {
    return set.dir + "frame_" + String(i + 1).padStart(3, "0") + ".jpg";
  }

  function loadFrame(set, i, cb) {
    var img = new Image();
    img.onload = function () { set.frames[i] = img; if (cb) cb(); };
    img.src = frameSrc(set, i);
  }

  // First frame paints immediately; the rest stream in behind it.
  function startSet(set) {
    if (set.started) return;
    set.started = true;
    loadFrame(set, 0, function () {
      drawCurrent(true);
      var next = 1, inFlight = 0;
      (function pump() {
        while (inFlight < 6 && next < set.count) {
          (function (i) {
            inFlight++;
            loadFrame(set, i, function () { inFlight--; pump(); });
          })(next++);
        }
      })();
    });
  }

  // Nearest loaded frame at or below the request (scrolling ahead of the loader).
  function bestLoaded(set, index) {
    for (var i = index; i >= 0; i--) if (set.frames[i]) return i;
    return -1;
  }

  var drawnKey = "";

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    drawnKey = "";
  }

  function drawCurrent(force) {
    var set = activeSet();
    startSet(set);
    var index = Math.round(progress() * (set.count - 1));
    var use = bestLoaded(set, index);
    if (use < 0) return;
    var key = set.dir + use;
    if (!force && key === drawnKey) return;
    drawnKey = key;
    var img = set.frames[use];
    var cw = canvas.width, ch = canvas.height;
    var scale = Math.max(cw / img.width, ch / img.height); // cover
    var w = img.width * scale, h = img.height * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function update() {
    var p = progress();
    drawCurrent(false);
    hud.classList.toggle("hidden", p > 0.03);
    endcap.classList.toggle("shown", p > 0.96);
  }

  // rAF polling keeps frames glued to the wheel and sidesteps environments
  // with unreliable scroll-event delivery; the scroll listener is the backup.
  var lastY = -1;
  (function loop() {
    var y = window.scrollY;
    if (y !== lastY) { lastY = y; update(); }
    requestAnimationFrame(loop);
  })();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", function () { sizeCanvas(); update(); });
  window.addEventListener("load", function () { sizeCanvas(); update(); });
  window.__llUpdate = function () { sizeCanvas(); update(); }; // test hook
  sizeCanvas();
  update();

  /* ================= SCROLL REVEALS ================= */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });

  /* smooth-scroll same-page anchors without global scroll-behavior */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth" });
    });
  });
})();
