// Portfolio interactions: year, theme, nav, TOC highlight, to-top, copy email, repo grid.
(function () {
  "use strict";

  // Year (progressive enhancement; static fallback already in HTML)
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme: respect stored choice, else OS preference via CSS. Toggle sets data-theme.
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-toggle");
  var STORE_KEY = "al0nkr-theme";
  try {
    var stored = localStorage.getItem(STORE_KEY);
    if (stored === "dark" || stored === "light") root.setAttribute("data-theme", stored);
  } catch (e) { /* private mode */ }
  function syncThemeBtn() {
    if (!themeBtn) return;
    var isDark =
      root.getAttribute("data-theme") === "dark" ||
      (!root.getAttribute("data-theme") &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
    themeBtn.textContent = isDark ? "◑" : "◐";
  }
  syncThemeBtn();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next;
      if (current) {
        next = current === "dark" ? "light" : "dark";
      } else {
        next = prefersDark ? "light" : "dark";
      }
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* ignore */ }
      syncThemeBtn();
    });
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
            "<p>" + (r.description ? escapeHtml(r.description) : "No description.") + "</p>" +
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
