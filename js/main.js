/* Lucky Lots landing — scroll-scrubbed hero + reveal animations. Vanilla JS. */
(function () {
  "use strict";

  /* ---------- Hero: scrub the promo frames with scroll ---------- */
  var FRAME_COUNT = 120;
  var track = document.getElementById("hero");
  var canvas = document.getElementById("scrub-canvas");
  var ctx = canvas.getContext("2d");
  var intro = document.getElementById("hero-intro");
  var outro = document.getElementById("hero-outro");

  var frames = new Array(FRAME_COUNT);   // Image objects once loaded
  var currentFrame = -1;
  var pendingIndex = 0;

  function frameSrc(i) {
    return "frames/frame_" + String(i + 1).padStart(3, "0") + ".jpg";
  }

  // Load frame 0 first so the hero paints immediately, then fill in the rest.
  function loadFrame(i, cb) {
    var img = new Image();
    img.onload = function () { frames[i] = img; if (cb) cb(); };
    img.src = frameSrc(i);
  }

  loadFrame(0, function () { drawFrame(0); preloadRest(); });

  function preloadRest() {
    var next = 1;
    var inFlight = 0;
    var MAX_PARALLEL = 6;
    (function pump() {
      while (inFlight < MAX_PARALLEL && next < FRAME_COUNT) {
        (function (i) {
          inFlight++;
          loadFrame(i, function () {
            inFlight--;
            // If the user scrolled ahead of the loader, catch the canvas up.
            if (i === pendingIndex) drawFrame(i);
            pump();
          });
        })(next++);
      }
    })();
  }

  // Nearest loaded frame at or below the requested index (scrub ahead of load).
  function bestLoaded(index) {
    for (var i = index; i >= 0; i--) if (frames[i]) return i;
    return -1;
  }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    currentFrame = -1; // force redraw at new size
  }

  function drawFrame(index) {
    var use = bestLoaded(index);
    if (use < 0 || use === currentFrame) return;
    currentFrame = use;
    var img = frames[use];
    var cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    // Portrait video: cover on portrait screens, contain (letterboxed over the
    // blurred suburb backdrop) on landscape/desktop.
    var scale, mode = cw / ch > 0.9 ? "contain" : "cover";
    if (mode === "cover") {
      scale = Math.max(cw / img.width, ch / img.height);
    } else {
      scale = Math.min(cw / img.width, ch / img.height);
    }
    var w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // rAF polling instead of scroll events: immune to event-delivery quirks in
  // embedded webviews and keeps frames glued to the wheel on fast scrolls.
  var lastY = -1;

  function update() {
    var rect = track.getBoundingClientRect();
    var scrollable = rect.height - window.innerHeight;
    var progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    pendingIndex = Math.min(FRAME_COUNT - 1, Math.round(progress * (FRAME_COUNT - 1)));
    drawFrame(pendingIndex);
    intro.classList.toggle("hidden", progress > 0.04);
    outro.classList.toggle("shown", progress > 0.965);
  }

  (function loop() {
    var y = window.scrollY;
    if (y !== lastY || currentFrame === -1) {
      lastY = y;
      update();
    }
    requestAnimationFrame(loop);
  })();

  // Fallback for environments that throttle rAF but still deliver events.
  window.addEventListener("scroll", update, { passive: true });
  window.__llUpdate = update; // test hook: lets a headless harness drive the scrub

  window.addEventListener("resize", function () { sizeCanvas(); update(); });
  // Script runs before the stylesheet may have applied — a 0-sized canvas at
  // parse time gets re-measured once everything has loaded.
  window.addEventListener("load", function () { sizeCanvas(); update(); });
  sizeCanvas();

  // Smooth-scroll the CTA anchor without putting scroll-behavior on <html>
  // (global smooth makes scrub frames lag the wheel).
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Scroll reveals ---------- */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
})();
