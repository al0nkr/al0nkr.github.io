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

  // Active section highlight
  var links = navLinks ? Array.prototype.slice.call(navLinks.querySelectorAll('a[href^="#"]')) : [];
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var map = new Map();
    links.forEach(function (a) { map.set(a.getAttribute("href"), a); });
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (a) { a.classList.remove("active"); });
            var link = map.get("#" + en.target.id);
            if (link) link.classList.add("active");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { obs.observe(s); });
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
})();
