#!/usr/bin/env python3
"""Stamp asset links (CSS, JS, tab icons) with a content hash so browsers pick up changes immediately.

GitHub Pages serves files with `Cache-Control: max-age=600`, so without this a
visitor can see a stale styles.css / script.js / fonts.js for up to 10 minutes
after a deploy. Rewrites e.g. `src="fonts.js"` or `src="fonts.js?v=old"` to
`src="fonts.js?v=<hash>"` in the HTML pages. Run before committing:

    python3 tools/bust.py
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ["styles.css", "script.js", "fonts.js",
          "favicon-32.png", "favicon-light-32.png", "favicon-64.png", "favicon-light-64.png", "apple-touch-icon.png",
          "tarnished.webp"]
# Images referenced from styles.css (stamped inside the CSS first, so the CSS hash covers them)
CSS_ASSETS = ["avatar.jpg", "avatar-light.jpg"]
PAGES = ["index.html", "404.html"]


def stamp(text, hashes):
    for asset, h in hashes.items():
        text = re.sub(r'(["\'])' + re.escape(asset) + r'(\?v=[0-9a-f]*)?\1',
                      lambda m: f"{m.group(1)}{asset}?v={h}{m.group(1)}", text)
    return text


def main():
    css_path = ROOT / "styles.css"
    css_hashes = {a: hashlib.sha1((ROOT / a).read_bytes()).hexdigest()[:8] for a in CSS_ASSETS}
    css = css_path.read_text()
    new_css = stamp(css, css_hashes)
    if new_css != css:
        css_path.write_text(new_css)
        print("updated styles.css")
    hashes = {a: hashlib.sha1((ROOT / a).read_bytes()).hexdigest()[:8] for a in ASSETS}
    for page in PAGES:
        path = ROOT / page
        html = path.read_text()
        new = stamp(html, hashes)
        if new != html:
            path.write_text(new)
            print(f"updated {page}")
    print(", ".join(f"{a}?v={h}" for a, h in hashes.items()))


if __name__ == "__main__":
    main()
