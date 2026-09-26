// Portfolio interactions: year, theme, font picker, nav, TOC highlight, to-top, copy email, repo grid.
(function () {
  "use strict";

  // Year (progressive enhancement; static fallback already in HTML)
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme: dark by default; light (cream) via data-theme="light". fonts.js applies the stored choice early.
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var STORE_KEY = "al0nkr-theme";
  function syncThemeBtn() {
    var isLight = root.getAttribute("data-theme") === "light";
    if (themeMeta) themeMeta.setAttribute("content", isLight ? "#fff0db" : "#050e1c");
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-pressed", isLight ? "true" : "false");
    themeBtn.textContent = isLight ? "☾" : "☀";
    themeBtn.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  }
  syncThemeBtn();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      if (next === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* ignore */ }
      syncThemeBtn();
    });
  }

  // Font picker: options come from SITE_FONTS in fonts.js; swaps live via --font.
  var fontSelect = document.getElementById("font-select");
  if (fontSelect && window.SITE_FONTS && window.applySiteFont) {
    Object.keys(window.SITE_FONTS).forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = window.SITE_FONTS[id].label;
      fontSelect.appendChild(opt);
    });
    fontSelect.value = root.getAttribute("data-font") || window.SITE_FONT_DEFAULT;
    fontSelect.addEventListener("change", function () {
      window.applySiteFont(fontSelect.value, true);
    });
  } else if (fontSelect) {
    fontSelect.hidden = true;
  }

  // Mobile nav
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  // Active section highlight. Scroll-position based so short sections at the end of the
  // page (which can never reach the middle of the viewport) still get highlighted.
  // A clicked link stays active until the user scrolls away from where it landed.
  var links = navLinks ? Array.prototype.slice.call(navLinks.querySelectorAll('a[href^="#"]')) : [];
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if (sections.length) {
    var locked = null;   // href of a clicked link
    var lockY = null;    // scroll position where the click-scroll settled
    var settleTimer = null;
    var ticking = false;

    var setActive = function (href) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === href;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };

    var fromScroll = function () {
      var doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        return "#" + sections[sections.length - 1].id;
      }
      var threshold = Math.min(window.innerHeight * 0.35, 280);
      var current = null;
      sections.forEach(function (sec) {
        if (sec.getBoundingClientRect().top <= threshold) current = "#" + sec.id;
      });
      return current;
    };

    var update = function () {
      ticking = false;
      if (locked) {
        if (lockY === null || Math.abs(window.scrollY - lockY) < 40) return setActive(locked);
        locked = lockY = null;
      }
      setActive(fromScroll());
    };

    var settle = function (delay) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { lockY = window.scrollY; }, delay);
    };

    var lockTo = function (href) {
      locked = href;
      lockY = null;
      setActive(href);
      settle(300); // covers clicks that don't scroll (already at target)
    };

    links.forEach(function (a) {
      a.addEventListener("click", function () { lockTo(a.getAttribute("href")); });
    });

    window.addEventListener("scroll", function () {
      // While a click-scroll is in flight, record where it settles.
      if (locked && lockY === null) return settle(150);
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);

    if (location.hash && links.some(function (a) { return a.getAttribute("href") === location.hash; })) {
      lockTo(location.hash);
    } else {
      update();
    }
  }

  // Back to top
  var toTop = document.getElementById("to-top");
  if (toTop) {
    var onScroll = function () {
      toTop.hidden = window.scrollY < 600;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Copy email
  var copyBtn = document.getElementById("copy-email");
  var copyStatus = document.getElementById("copy-status");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      function done(msg) {
        copyBtn.textContent = msg;
        if (copyStatus) copyStatus.textContent = msg;
        setTimeout(function () { copyBtn.textContent = "Copy email"; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(
          function () { done("Copied!"); },
          function () { done("Copy: " + email); }
        );
      } else {
        var ta = document.createElement("textarea");
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done("Copied!"); }
        catch (e) { done("Copy: " + email); }
        document.body.removeChild(ta);
      }
    });
  }

  // Repo grid with stale-while-revalidate cache
  var grid = document.getElementById("repo-grid");
  var USER = "al0nkr";
  var SKIP = new Set(["al0nkr.github.io", "homepage"]);
  var CACHE_KEY = "al0nkr-repos-v1";
  var CACHE_TTL = 6 * 60 * 60 * 1000;

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function skeleton() {
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 6 })
      .map(function () { return '<div class="repo-skeleton" aria-hidden="true"></div>'; })
      .join("");
  }

  function render(list, stale) {
    if (!grid) return;
    var items = list.filter(function (r) { return !r.fork && !SKIP.has(r.name); });
    items.sort(function (a, b) {
      var stars = (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (stars !== 0) return stars;
      return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
    });
    if (!items.length) {
      grid.innerHTML = '<p class="muted">No additional repositories.</p>';
      return;
    }
    grid.innerHTML =
      items
        .map(function (r) {
          var updated = r.pushed_at ? new Date(r.pushed_at).toISOString().slice(0, 10) : "";
          return (
            '<div class="repo">' +
            '<a href="' + escapeHtml(r.html_url) + '" target="_blank" rel="noopener">' + escapeHtml(r.name) + "</a>" +
            (r.description ? "<p>" + escapeHtml(r.description) + "</p>" : "") +
            '<span class="lang">' + escapeHtml(r.language || "") +
            (r.stargazers_count ? " ★ " + escapeHtml(r.stargazers_count) : "") + "</span>" +
            (updated ? '<span class="updated">Updated ' + escapeHtml(updated) + (stale ? " · cached" : "") + "</span>" : "") +
            "</div>"
          );
        })
        .join("");
  }

  function renderError(cached) {
    if (!grid) return;
    if (cached && cached.length) {
      render(cached, true);
      return;
    }
    grid.innerHTML =
      '<p class="muted">Could not load live repos (API rate limit or offline). ' +
      'See <a href="https://github.com/al0nkr?tab=repositories">all repositories on GitHub</a>.</p>';
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.data)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  async function loadRepos() {
    if (!grid) return;
    var cached = readCache();
    var fresh = !cached || Date.now() - cached.at > CACHE_TTL;
    if (cached && cached.data.length && !fresh) {
      render(cached.data, true);
      return;
    }
    if (cached && cached.data.length) render(cached.data, true);
    else skeleton();
    try {
      var res = await fetch("https://api.github.com/users/" + USER + "/repos?sort=updated&per_page=30");
      if (!res.ok) throw new Error("GitHub API " + res.status);
      var repos = await res.json();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: repos })); }
      catch (e) { /* ignore */ }
      render(repos, false);
    } catch (e) {
      renderError(cached ? cached.data : null);
    }
  }

  loadRepos();

  // Reward: photo reel. Photos are listed in photos/photos.json as
  // [{ "src": "photos/x.jpg", "place": "Beijing, China", "caption": "...", "date": "Jul 2025", "alt": "..." }]
  // and fetched the first time the reel is opened.
  var rewardToggle = document.getElementById("reward-toggle");
  var rewardPanel = document.getElementById("reward-panel");
  var carousel = document.getElementById("carousel");
  var track = document.getElementById("carousel-track");
  var dots = document.getElementById("carousel-dots");
  var emptyMsg = document.getElementById("reward-empty");
  var lightbox = document.getElementById("lightbox");
  var photos = null;
  var current = 0;

  function slides() { return track ? Array.prototype.slice.call(track.children) : []; }

  function markCurrent(i) {
    current = i;
    slides().forEach(function (s, j) { s.classList.toggle("is-current", j === i); });
    Array.prototype.forEach.call(dots.children, function (d, j) {
      d.setAttribute("aria-selected", j === i ? "true" : "false");
      d.tabIndex = j === i ? 0 : -1;
    });
  }

  function goTo(i) {
    var list = slides();
    if (!list.length) return;
    i = (i + list.length) % list.length;
    var s = list[i];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2 });
    markCurrent(i);
  }

  function renderPhotos() {
    if (!photos.length) {
      emptyMsg.hidden = false;
      return;
    }
    track.innerHTML = photos
      .map(function (p, i) {
        var alt = p.alt || p.caption || p.place || "Photo " + (i + 1);
        return (
          '<figure class="slide" aria-roledescription="slide" aria-label="' + (i + 1) + " of " + photos.length + '">' +
          '<button class="slide-media" type="button" data-index="' + i + '" aria-label="Enlarge: ' + escapeHtml(alt) + '">' +
          '<img src="' + escapeHtml(p.src) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async" />' +
          (p.place ? '<span class="place">' + escapeHtml(p.place) + "</span>" : "") +
          "</button>" +
          ((p.caption || p.date)
            ? "<figcaption><span>" + escapeHtml(p.caption || "") + '</span><span class="date">' + escapeHtml(p.date || "") + "</span></figcaption>"
            : "") +
          "</figure>"
        );
      })
      .join("");
    dots.innerHTML = photos
      .map(function (p, i) {
        return '<button type="button" role="tab" aria-label="Photo ' + (i + 1) + (p.place ? ": " + escapeHtml(p.place) : "") + '"></button>';
      })
      .join("");
    carousel.hidden = false;
    var single = photos.length < 2;
    document.getElementById("carousel-prev").hidden = single;
    document.getElementById("carousel-next").hidden = single;
    dots.hidden = single;
    requestAnimationFrame(function () { goTo(0); });
  }

  function loadPhotos() {
    if (photos) return;
    photos = [];
    fetch("photos/photos.json", { cache: "no-cache" })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (list) { photos = Array.isArray(list) ? list.filter(function (p) { return p && p.src; }) : []; })
      .catch(function () { photos = []; })
      .then(renderPhotos);
  }

  if (rewardToggle && rewardPanel && track) {
    rewardToggle.addEventListener("click", function () {
      var open = rewardToggle.getAttribute("aria-expanded") !== "true";
      rewardToggle.setAttribute("aria-expanded", open ? "true" : "false");
      rewardPanel.classList.toggle("open", open);
      if (open) rewardPanel.removeAttribute("inert");
      else rewardPanel.setAttribute("inert", "");
      rewardToggle.firstChild.textContent = open ? "Close the photo reel " : "Open the photo reel ";
      if (open) loadPhotos();
    });

    document.getElementById("carousel-prev").addEventListener("click", function () { goTo(current - 1); });
    document.getElementById("carousel-next").addEventListener("click", function () { goTo(current + 1); });
    dots.addEventListener("click", function (e) {
      var i = Array.prototype.indexOf.call(dots.children, e.target);
      if (i >= 0) goTo(i);
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    });

    // Keep the current slide in sync with swipes and trackpad scrolling.
    var scrollTick = false;
    track.addEventListener("scroll", function () {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(function () {
        scrollTick = false;
        var mid = track.scrollLeft + track.clientWidth / 2;
        var best = 0, bestDist = Infinity;
        slides().forEach(function (s, i) {
          var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        if (best !== current) markCurrent(best);
      });
    }, { passive: true });

    // Enlarged view
    track.addEventListener("click", function (e) {
      var btn = e.target.closest(".slide-media");
      if (!btn) return;
      var i = Number(btn.getAttribute("data-index"));
      if (i !== current) return goTo(i); // side slides: bring to center first
      openLightbox(i);
    });
  }

  // Size the photo from its natural dimensions so the frame hugs it exactly.
  function fitLightboxImg() {
    var img = document.getElementById("lightbox-img");
    if (!img.naturalWidth) return;
    var maxW = Math.min(window.innerWidth * 0.94, 1200) - 2;
    var maxH = window.innerHeight * 0.94 - 64;
    var scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    img.style.width = Math.round(img.naturalWidth * scale) + "px";
  }

  function showInLightbox(i) {
    var p = photos[i];
    current = i;
    var img = document.getElementById("lightbox-img");
    img.style.width = "";
    img.onload = fitLightboxImg;
    img.src = p.src;
    if (img.complete) fitLightboxImg();
    img.alt = p.alt || p.caption || p.place || "";
    var place = document.getElementById("lightbox-place");
    place.textContent = p.place || "";
    place.hidden = !p.place;
    document.getElementById("lightbox-caption").textContent = [p.caption, p.date].filter(Boolean).join(" · ");
    var single = photos.length < 2;
    document.getElementById("lightbox-prev").hidden = single;
    document.getElementById("lightbox-next").hidden = single;
  }

  function openLightbox(i) {
    if (!lightbox || typeof lightbox.showModal !== "function") {
      window.open(photos[i].src, "_blank", "noopener");
      return;
    }
    showInLightbox(i);
    lightbox.showModal();
  }

  if (lightbox) {
    var step = function (d) { showInLightbox((current + d + photos.length) % photos.length); };
    document.getElementById("lightbox-close").addEventListener("click", function () { lightbox.close(); });
    document.getElementById("lightbox-prev").addEventListener("click", function () { step(-1); });
    document.getElementById("lightbox-next").addEventListener("click", function () { step(1); });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("close", function () { goTo(current); });
    window.addEventListener("resize", function () { if (lightbox.open) fitLightboxImg(); });
  }
})();
