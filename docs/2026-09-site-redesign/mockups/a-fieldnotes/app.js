/* Minimal vanilla JS for the mockup micro-interactions (M2, M7, M9, M10, M11, nav shadow). */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sticky nav hairline once scrolled
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // M2 — sliding indicator under nav links
  var links = document.querySelector(".nav-links");
  var indicator = links && links.querySelector(".indicator");
  if (links && indicator) {
    var current = links.querySelector('a[aria-current="page"]');
    var move = function (el) {
      if (!el) { indicator.style.width = "0"; return; }
      var r = el.getBoundingClientRect(), p = links.getBoundingClientRect();
      indicator.style.width = r.width + "px";
      indicator.style.transform = "translateX(" + (r.left - p.left) + "px)";
    };
    move(current);
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("mouseenter", function () { move(a); });
      a.addEventListener("focus", function () { move(a); });
    });
    links.addEventListener("mouseleave", function () { move(current); });
    window.addEventListener("resize", function () { move(current); });
  }

  // M7 — copy button on code blocks
  document.querySelectorAll(".codeblock").forEach(function (block) {
    var btn = block.querySelector(".copy"), pre = block.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      var text = pre.innerText;
      var done = function () {
        btn.textContent = "Copied";
        btn.classList.add("is-done");
        setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1200);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
    });
  });

  // M9 — Spotify / YouTube facades: swap in the iframe on click
  document.querySelectorAll("[data-embed]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = btn.getAttribute("data-embed");
      iframe.title = btn.getAttribute("data-title") || "Embedded player";
      iframe.loading = "lazy";
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      var host = btn.closest("[data-embed-host]") || btn.parentNode;
      if (host === btn.parentNode) host.replaceChild(iframe, btn); else { host.innerHTML = ""; host.appendChild(iframe); }
    });
  });

  // M10 — footer status line cycles its middle item
  var cycle = document.querySelector(".status .cycle");
  if (cycle && !reduce) {
    var items = (cycle.getAttribute("data-items") || "").split("|").filter(Boolean);
    var i = 0;
    if (items.length > 1) {
      setInterval(function () {
        cycle.classList.add("is-fading");
        setTimeout(function () {
          i = (i + 1) % items.length;
          cycle.textContent = items[i];
          cycle.classList.remove("is-fading");
        }, 300);
      }, 6000);
    }
  }

  // M11 — TOC highlights the current section
  var toc = document.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    var tocLinks = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var headings = tocLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
    var setActive = function (id) {
      tocLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + id); });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-20% 0px -70% 0px" });
    headings.forEach(function (h) { io.observe(h); });
    if (headings[0]) setActive(headings[0].id);
  }
})();
