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
- After editing `styles.css`, `script.js` or `fonts.js`, run `python3 tools/bust.py` before committing. It stamps the links in the HTML with a content hash so visitors get the new files right away (GitHub Pages lets browsers cache them for 10 minutes).
- Fonts: add one entry to `SITE_FONTS` in `fonts.js` (label, CSS stack, Google Fonts URL, optional size `scale`); it appears in the nav picker automatically. Default is Rubik.
- Themes: color tokens live at the top of `styles.css` (dark `#050e1c` default, cream `#fff0db` light via `data-theme="light"`).
- Photo reel (the "press △ to rest at grace" section under Contact): drop new phone photos into `photos/` and run
  ```bash
  python3 tools/photos.py
  ```
  It uploads the untouched originals to the `photos` GitHub Release (never committed; `photos/*` is git-ignored), writes 1280px and 2560px display copies (JPEG q90, no chroma subsampling) to `photos/display/`, and adds entries to `photos/photos.json`. Then fill in `place` / `caption` there and commit `photos/photos.json` + `photos/display/`.
  The carousel shows the display copies; clicking a photo opens it instantly and sharpens to the 2560px copy. The original is only fetched when the viewer clicks the photo (or "View full resolution"); after that, click zooms 1:1 and drag pans. Browsers that refuse Release files keep the 2560px copy and offer "Download original".
- Contact: email only, no phone/resume per owner request. No private company metrics included.
