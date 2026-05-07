"""Один раз: вытащить PNG из «толстого» logo.svg (обёртка SVG+base64), сохранить logo-fallback.webp.

Тот же приём можно применить к тяжёлому SVG логотипу в /media/ (например imagemmk.svg), если там вложен raster.
"""
from __future__ import annotations

import base64
import io
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "public" / "branding" / "logo.svg"
WEBP_OUT = ROOT / "public" / "branding" / "logo-fallback.webp"


def main() -> None:
    text = SVG_PATH.read_text(encoding="utf-8")
    m = re.search(r'data:image/png;base64,\s*([^"]+)"', text)
    if not m:
        raise SystemExit("embedded png not found")
    raw = base64.b64decode(re.sub(r"\s+", "", m.group(1)))
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    max_w = 880
    w, h = im.size
    if w > max_w:
        nh = max(1, int(h * max_w / w))
        im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
    WEBP_OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(WEBP_OUT, format="WEBP", quality=84, method=6)
    print("wrote", WEBP_OUT, "bytes", WEBP_OUT.stat().st_size, "dims", im.size)


if __name__ == "__main__":
    main()
