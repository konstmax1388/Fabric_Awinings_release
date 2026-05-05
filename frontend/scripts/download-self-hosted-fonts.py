"""Скачать woff2 с fonts.gstatic.com по CSS Google Fonts; пишет локальный CSS со ссылками /fonts/gfont-NN.woff2."""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "public" / "fonts"
CSS_URL = (
    "https://fonts.googleapis.com/css2?"
    "family=Raleway:wght@400;500;600;700;800&"
    "family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,700;1,800&"
    "display=swap"
)
OUT_CSS = FONT_DIR / "self-hosted.css"


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        CSS_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0"
            ),
        },
    )
    css = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
    urls_order: list[str] = []
    seen: set[str] = set()
    for m in re.finditer(r"url\((https://fonts\.gstatic\.com/[^)]+)\)\s+format\('woff2'\)", css):
        u = m.group(1)
        if u not in seen:
            seen.add(u)
            urls_order.append(u)
    if not urls_order:
        raise SystemExit("no woff2 urls in css")
    for i, url in enumerate(urls_order):
        dest = FONT_DIR / f"gfont-{i:02d}.woff2"
        if not dest.is_file():
            with urllib.request.urlopen(url, timeout=60) as resp:
                dest.write_bytes(resp.read())
    local_css = css
    for i, url in enumerate(urls_order):
        local_css = local_css.replace(url, f"/fonts/gfont-{i:02d}.woff2")
    OUT_CSS.write_text(local_css, encoding="utf-8")
    total = sum((FONT_DIR / f"gfont-{i:02d}.woff2").stat().st_size for i in range(len(urls_order)))
    print("woff2 files", len(urls_order), "total bytes", total, "->", OUT_CSS)


if __name__ == "__main__":
    main()
