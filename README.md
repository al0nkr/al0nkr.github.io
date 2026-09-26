# Alankar Dutta — portfolio (al0nkr.github.io)

Vanilla HTML/CSS/JS academic portfolio. No build step. Hosted on GitHub Pages.

## Rename (you must do this as @al0nkr — current CLI is logged in as work account and cannot rename)

Current repo `al0nkr/homepage` is empty. GitHub user sites require the name `al0nkr.github.io`:

1. As `@al0nkr`, go to https://github.com/al0nkr/homepage → Settings → General → Rename to `al0nkr.github.io` → Rename.
2. Clone: `git clone https://github.com/al0nkr/al0nkr.github.io.git`
3. Copy files from this folder (`index.html`, `styles.css`, `script.js`, `404.html`, `.nojekyll`) into the clone, commit + push to `main`.
4. Settings → Pages → Deploy from branch → `main` / `/ (root)`. Live at https://al0nkr.github.io/ in ~1 min.
5. Optional: set profile bio link to https://al0nkr.github.io/.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Update content

- Edit `index.html` sections directly (Experience, Projects, Awards).
- Project grid auto-loads from `https://api.github.com/users/al0nkr/repos` via `script.js`; curated 6 cards are static.
- Avatar: `https://avatars.githubusercontent.com/u/129394458?v=4` (GitHub avatar, no local image).
- Fonts: add one entry to `SITE_FONTS` in `fonts.js` (label, CSS stack, Google Fonts URL); it appears in the nav picker automatically. Default is Rubik.
- Themes: color tokens live at the top of `styles.css` (dark `#050e1c` default, cream light via `data-theme="light"`).
- Contact: email only, no phone/resume per owner request. No private company metrics included.
