#!/usr/bin/env python3
"""Publish photos for the reward photo reel without committing the originals.

For every JPEG in photos/ that isn't in photos/photos.json yet:
  1. make two display copies in photos/display/ (1280px and 2560px on the long
     edge, JPEG q90, no chroma subsampling, ICC profile kept, EXIF dropped,
     rotation applied). These are committed so every browser can show them.
  2. upload the untouched original to the "photos" GitHub Release. Release files
     are served as downloads, which Chrome/Safari still display inline but
     Firefox refuses; the page falls back to the 2560px copy there.
  3. add an entry to photos/photos.json (newest first)

Place names and captions are left for you to fill in photos.json afterwards;
existing entries are never overwritten.

Usage:  python3 tools/photos.py            # publish new photos
        python3 tools/photos.py --dry-run  # show what would happen
Needs:  Pillow (pip install pillow) and the GitHub CLI (gh) logged in.
"""
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

REPO = "al0nkr/al0nkr.github.io"
TAG = "photos"
SIZES = (1280, 2560)
ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "photos"
DISPLAY = PHOTOS / "display"
MANIFEST = PHOTOS / "photos.json"
BASE_URL = f"https://github.com/{REPO}/releases/download/{TAG}/"


def gh(*args, check=True):
    return subprocess.run(["gh", *args], check=check, capture_output=True, text=True)


def ensure_release():
    if gh("release", "view", TAG, "-R", REPO, check=False).returncode != 0:
        gh("release", "create", TAG, "-R", REPO, "--title", "Photos", "--latest=false",
           "--notes", "Images for the photo reel on al0nkr.github.io. Not part of the site source.")


def date_label(stem):
    # Phone cameras name files like 20250723_121541.jpg
    try:
        return datetime.strptime(stem[:8], "%Y%m%d").strftime("%b %Y")
    except ValueError:
        return ""


def make_copies(src):
    im = ImageOps.exif_transpose(Image.open(src))
    icc = im.info.get("icc_profile")
    im = im.convert("RGB")
    out = {}
    for size in SIZES:
        copy = im.copy()
        copy.thumbnail((size, size), Image.LANCZOS)
        dest = DISPLAY / f"{src.stem}-{size}.jpg"
        copy.save(dest, "JPEG", quality=90, subsampling=0, optimize=True, progressive=True,
                  **({"icc_profile": icc} if icc else {}))
        out[size] = dest
    return im.size, out


def main():
    dry = "--dry-run" in sys.argv
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []
    known = {p.get("id") for p in manifest}
    new = sorted(f for f in PHOTOS.iterdir()
                 if f.suffix.lower() in (".jpg", ".jpeg") and f.stem not in known)
    if not new:
        print("Nothing new to publish.")
        return
    print(f"{len(new)} new photo(s): {', '.join(f.name for f in new)}")
    if dry:
        return

    DISPLAY.mkdir(exist_ok=True)
    ensure_release()
    for src in new:
        (w, h), copies = make_copies(src)
        gh("release", "upload", TAG, str(src), "-R", REPO, "--clobber")
        small, large = (copies[s].relative_to(ROOT).as_posix() for s in SIZES)
        manifest.append({
            "id": src.stem,
            "src": small,
            "srcset": f"{small} {SIZES[0]}w, {large} {SIZES[1]}w",
            "large": large,
            "full": BASE_URL + src.name,
            "width": w,
            "height": h,
            "date": date_label(src.stem),
            "place": "",
            "caption": "",
        })
        print(f"  {src.name} ({w}x{h}): original uploaded, {len(copies)} display copies in photos/display/")

    manifest.sort(key=lambda p: p.get("id", ""), reverse=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"Updated {MANIFEST.relative_to(ROOT)}. Fill in place/caption, then commit photos.json and photos/display/.")


if __name__ == "__main__":
    main()
