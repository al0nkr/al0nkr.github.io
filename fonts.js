// Font registry + early theme/font apply (loaded blocking in <head> to avoid a flash).
// To add a font: add one entry to SITE_FONTS. The picker in script.js reads from here.
// `scale` (optional) evens out fonts that render larger/smaller than Rubik at the same px size.
(function () {
  "use strict";

  var FONTS = {
    rubik: {
      label: "Rubik",
      stack: '"Rubik", system-ui, sans-serif',
      href: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap"
    },
    mono: {
      label: "JetBrains Mono",
      stack: '"JetBrains Mono", ui-monospace, monospace',
      href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      scale: 0.94
    },
    ubuntu: {
      label: "Ubuntu Mono",
      stack: '"Ubuntu Mono", ui-monospace, monospace',
      href: "https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap",
      scale: 1.1
    }
  };
  var DEFAULT = "rubik";
  var FONT_KEY = "al0nkr-font";
  var THEME_KEY = "al0nkr-theme";
  var root = document.documentElement;

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* private mode */ }
    return null;
  }

  function applySiteFont(id, persist) {
    if (!FONTS[id]) id = DEFAULT;
    var font = FONTS[id];
    if (font.href && !document.getElementById("font-" + id)) {
      var link = document.createElement("link");
      link.id = "font-" + id;
      link.rel = "stylesheet";
      link.href = font.href;
      document.head.appendChild(link);
    }
    root.style.setProperty("--font", font.stack);
    root.style.setProperty("--font-scale", String(font.scale || 1));
    root.setAttribute("data-font", id);
    if (persist) store(FONT_KEY, id);
    return id;
  }

  window.SITE_FONTS = FONTS;
  window.SITE_FONT_DEFAULT = DEFAULT;
  window.applySiteFont = applySiteFont;

  if (store(THEME_KEY) === "light") root.setAttribute("data-theme", "light");
  applySiteFont(store(FONT_KEY) || DEFAULT, false);
})();
