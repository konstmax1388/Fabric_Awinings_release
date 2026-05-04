#!/usr/bin/env python3
"""
Готовит иконки 128×128 для сайта из исходных PNG в Cursor assets.

По умолчанию:
  1) оценивает цвет фона по углам и серединам сторон;
  2) делает близкие к нему пиксели прозрачными (простой «хромакей», без ML);
  3) обрезает по bounding box содержимого;
  4) вписывает в квадрат с прозрачными полями и масштабирует до --size.

Запуск из корня репозитория (нужен Pillow):
  py -3 scripts/build_site_icons.py
  py -3 scripts/build_site_icons.py --bg-tolerance 50 --margin 6
  py -3 scripts/build_site_icons.py --no-remove-bg

Результат: frontend/public/icons/site-icon-*.png
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

# (уникальный фрагмент имени файла в assets, выходное имя)
ICON_SPECS: list[tuple[str, str]] = [
    ("730ecef7", "site-icon-contract.png"),
    ("413a18e2", "site-icon-factory.png"),
    ("045472dd", "site-icon-fabric.png"),
    ("024ebe36", "site-icon-measure.png"),
    ("b99b79b5", "site-icon-warranty.png"),
    ("b59f735a", "site-icon-price.png"),
    ("8f627a33", "site-icon-service.png"),
    ("9a1fadbd", "site-icon-time.png"),
]


def default_assets_dir() -> Path | None:
    home = Path.home()
    cand = home / ".cursor/projects/e-PRO-WORK-Fabric-Awinings/assets"
    return cand if cand.is_dir() else None


def find_source(assets: Path, needle: str) -> Path:
    matches = [p for p in assets.iterdir() if p.is_file() and needle in p.name and p.suffix.lower() == ".png"]
    if not matches:
        raise FileNotFoundError(f"В {assets} нет PNG с фрагментом «{needle}»")
    if len(matches) > 1:
        raise RuntimeError(f"Неоднозначно для «{needle}»: {matches}")
    return matches[0]


def sample_background_rgb(im: Image.Image) -> tuple[int, int, int]:
    """Средний цвет по углам и серединам сторон (типичный однотонный фон иконок)."""
    rgb = im.convert("RGB")
    w, h = rgb.size

    def px(x: int, y: int) -> tuple[int, int, int]:
        return rgb.getpixel((max(0, min(w - 1, x)), max(0, min(h - 1, y))))

    pts = [
        px(0, 0),
        px(w - 1, 0),
        px(0, h - 1),
        px(w - 1, h - 1),
        px(w // 2, 0),
        px(w // 2, h - 1),
        px(0, h // 2),
        px(w - 1, h // 2),
    ]
    n = len(pts)
    r = sum(p[0] for p in pts) // n
    g = sum(p[1] for p in pts) // n
    b = sum(p[2] for p in pts) // n
    return r, g, b


def remove_near_background(im: Image.Image, bg: tuple[int, int, int], tolerance: int) -> Image.Image:
    """Пиксели, близкие к bg по max(|ΔR|,|ΔG|,|ΔB|), делаем полностью прозрачными."""
    out = im.convert("RGBA")
    w, h = out.size
    br, bg_, bb = bg
    px = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if max(abs(r - br), abs(g - bg_), abs(b - bb)) <= tolerance:
                px[x, y] = (0, 0, 0, 0)
    return out


def crop_to_alpha_bbox(im: Image.Image) -> Image.Image:
    """Обрезка по непрозрачным пикселям."""
    bbox = im.getchannel("A").getbbox()
    if bbox is None:
        return im
    return im.crop(bbox)


def square_canvas(im: Image.Image) -> Image.Image:
    """Квадрат max(w,h), содержимое по центру на прозрачном фоне."""
    w, h = im.size
    side = max(w, h)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return canvas


def resize_to_square(im: Image.Image, size: int, margin: int) -> Image.Image:
    """Масштаб в size×size, внутреннее поле margin с каждой стороны (итог полезной области size-2*margin)."""
    inner = max(1, size - 2 * margin)
    w, h = im.size
    scale = inner / max(w, h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(scaled, ((size - nw) // 2, (size - nh) // 2), scaled)
    return canvas


def process_icon(
    src: Path,
    dst: Path,
    *,
    size: int,
    margin: int,
    remove_bg: bool,
    bg_tolerance: int,
) -> None:
    im = Image.open(src)
    if remove_bg:
        bg = sample_background_rgb(im)
        im = remove_near_background(im, bg, bg_tolerance)
        im = crop_to_alpha_bbox(im)
        if im.size[0] < 2 or im.size[1] < 2:
            # слишком агрессивно сняли фон — откат к исходнику без удаления фона
            im = Image.open(src).convert("RGBA")
            im = crop_to_alpha_bbox(im)
    else:
        im = im.convert("RGBA")
        im = crop_to_alpha_bbox(im)

    im = square_canvas(im)
    im = resize_to_square(im, size=size, margin=margin)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "PNG", optimize=True)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    out_dir = root / "frontend/public/icons"
    parser = argparse.ArgumentParser(description="Иконки site-icon-*.png: фон + 128×128")
    parser.add_argument(
        "--assets",
        type=Path,
        default=None,
        help="Каталог Cursor assets (по умолчанию ~/.cursor/projects/e-PRO-WORK-Fabric-Awinings/assets)",
    )
    parser.add_argument("--size", type=int, default=128, help="Сторона выходного квадрата, px")
    parser.add_argument("--margin", type=int, default=4, help="Отступ от края после масштаба, px")
    parser.add_argument(
        "--bg-tolerance",
        type=int,
        default=42,
        help="Порог max(|ΔR|,|ΔG|,|ΔB|) для удаления фона (больше — съедает больше «почти фона»)",
    )
    parser.add_argument(
        "--no-remove-bg",
        action="store_true",
        help="Не удалять фон, только обрезка по альфе (если есть) и квадрат 128×128",
    )
    args = parser.parse_args()
    assets = args.assets or default_assets_dir()
    if assets is None or not assets.is_dir():
        raise SystemExit(
            "Укажите каталог с исходными PNG: --assets <path> "
            "(или положите файлы в ~/.cursor/projects/e-PRO-WORK-Fabric-Awinings/assets)"
        )
    remove_bg = not args.no_remove_bg
    for needle, filename in ICON_SPECS:
        src = find_source(assets, needle)
        dst = out_dir / filename
        process_icon(
            src,
            dst,
            size=args.size,
            margin=args.margin,
            remove_bg=remove_bg,
            bg_tolerance=args.bg_tolerance,
        )
        print(f"OK {filename} <- {src.name}")
    print(f"Готово: {out_dir} ({args.size}x{args.size}, remove_bg={remove_bg})")


if __name__ == "__main__":
    main()
