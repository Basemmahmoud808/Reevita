#!/usr/bin/env python3
"""
REEVITA — image preparation pipeline.

Converts the owner-supplied WhatsApp product photos into optimized WebP assets,
generates blur placeholders consumed by next/image, and builds brand assets
(favicons + OpenGraph image).

Usage:  python scripts/prepare-images.py
Source: C:\\Users\\Basem\\Desktop\\New folder  (override with REEVITA_SOURCE_DIR)
"""
from __future__ import annotations

import base64
import io
import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(os.environ.get("REEVITA_SOURCE_DIR", r"C:\Users\Basem\Desktop\New folder"))
PUBLIC = ROOT / "public"
PRODUCTS_DIR = PUBLIC / "images" / "products"
BRAND_DIR = PUBLIC / "images" / "brand"
OG_DIR = PUBLIC / "images" / "og"

# Source file name -> storefront slug. One photo per finished product.
MAPPING: dict[str, str] = {
    "WhatsApp Image 2026-10-21 at 2.19.49 PM.jpeg": "body-lotion-sexy",
    "WhatsApp Image 2026-10-21 at 2.19.49 PM (1).jpeg": "body-lotion-ruby-musk",
    "WhatsApp Image 2026-10-21 at 2.19.50 PM.jpeg": "body-lotion-queen",
    "WhatsApp Image 2026-10-21 at 2.34.44 PM.jpeg": "shampoo-aloe-vera",
    "WhatsApp Image 2026-10-21 at 2.34.45 PM.jpeg": "shampoo-blueberry",
    "WhatsApp Image 2026-10-21 at 2.34.46 PM.jpeg": "hair-mist-sexy",
    "WhatsApp Image 2026-10-21 at 2.34.46 PM (1).jpeg": "hair-mist-ruby-musk",
    "WhatsApp Image 2026-10-21 at 2.34.46 PM (2).jpeg": "hair-mist-queen",
    "WhatsApp Image 2026-10-21 at 2.34.47 PM.jpeg": "body-butter-ruby-musk",
    "WhatsApp Image 2026-10-21 at 2.34.47 PM (1).jpeg": "body-butter-queen",
    "WhatsApp Image 2026-10-21 at 2.34.47 PM (2).jpeg": "body-butter-sexy",
    "WhatsApp Image 2026-10-21 at 2.34.48 PM.jpeg": "body-splash-queen",
    "WhatsApp Image 2026-10-21 at 2.34.48 PM (1).jpeg": "body-splash-sexy",
    "WhatsApp Image 2026-10-21 at 2.34.48 PM (2).jpeg": "body-splash-ruby-musk",
}

GOLD = (201, 168, 108)
BURGUNDY = (59, 20, 38)
IVORY = (251, 247, 243)


def font(size: int, bold: bool = False, serif: bool = True) -> ImageFont.FreeTypeFont:
    """Pick an installed Windows/macOS font with sensible fallbacks."""
    candidates = []
    if serif:
        candidates += ["georgia.ttf", "times.ttf", "constan.ttf", "DejaVuSerif.ttf"]
    else:
        candidates += ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
    if bold:
        candidates = ["georgiab.ttf", "timesbd.ttf"] + candidates
    for name in candidates:
        for base in (Path(r"C:\Windows\Fonts"), Path("/usr/share/fonts/truetype"), Path("/System/Library/Fonts")):
            path = base / name
            if path.exists():
                try:
                    return ImageFont.truetype(str(path), size)
                except OSError:
                    continue
    return ImageFont.load_default()


def fit_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Crop-to-fill like CSS object-fit: cover."""
    tw, th = size
    scale = max(tw / img.width, th / img.height)
    resized = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (resized.width - tw) // 2
    top = (resized.height - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def blur_data_url(img: Image.Image, width: int = 20) -> str:
    ratio = width / img.width
    tiny = img.resize((width, max(1, round(img.height * ratio))), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    buf = io.BytesIO()
    tiny.convert("RGB").save(buf, format="WEBP", quality=45)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def draw_crown(draw: ImageDraw.ImageDraw, cx: float, cy: float, w: float, color: tuple[int, int, int]) -> None:
    """Simple five-point crown used as the REEVITA monogram."""
    h = w * 0.72
    left, right = cx - w / 2, cx + w / 2
    top = cy - h / 2
    base = cy + h / 2
    points = [
        (left, base),
        (left, top + h * 0.28),
        (cx - w * 0.26, top + h * 0.48),
        (cx, top),
        (cx + w * 0.26, top + h * 0.48),
        (right, top + h * 0.28),
        (right, base),
    ]
    draw.polygon(points, fill=color)
    # jewels
    r = w * 0.055
    for px, py in (
        (left, top + h * 0.22),
        (cx, top - r * 1.2),
        (right, top + h * 0.22),
    ):
        draw.ellipse((px - r, py - r, px + r, py + r), fill=color)
    draw.rectangle((left, base, right, base + h * 0.16), fill=color)


def build_icons() -> list[str]:
    made = []
    for size, name in ((512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")):
        img = Image.new("RGB", (size, size), BURGUNDY)
        draw = ImageDraw.Draw(img)
        inset = size * 0.07
        draw.rounded_rectangle(
            (inset, inset, size - inset, size - inset),
            radius=size * 0.2,
            outline=GOLD,
            width=max(2, size // 96),
        )
        draw_crown(draw, size / 2, size * 0.4, size * 0.3, GOLD)
        f = font(int(size * 0.135), serif=True)
        text = "REEVITA"
        box = draw.textbbox((0, 0), text, font=f)
        draw.text(((size - (box[2] - box[0])) / 2, size * 0.66), text, font=f, fill=IVORY)
        out = BRAND_DIR / name
        img.save(out, optimize=True)
        made.append(str(out.relative_to(ROOT)))
    return made


def build_og(hero: Image.Image) -> str:
    og = fit_cover(hero.convert("RGB"), (1200, 630))
    og = ImageEnhance.Brightness(og).enhance(0.7)
    # Solid editorial scrim on the left so the label artwork never fights the wordmark.
    scrim = Image.new("RGBA", og.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    solid_until = int(og.width * 0.52)
    fade_until = int(og.width * 0.66)
    sd.rectangle((0, 0, solid_until, og.height), fill=BURGUNDY + (255,))
    steps = max(1, fade_until - solid_until)
    for i in range(steps):
        alpha = int(255 * (1 - i / steps))
        sd.line([(solid_until + i, 0), (solid_until + i, og.height)], fill=BURGUNDY + (alpha,))
    og = Image.alpha_composite(og.convert("RGBA"), scrim).convert("RGB")
    draw = ImageDraw.Draw(og)
    draw_crown(draw, 108, 148, 74, GOLD)
    draw.text((156, 110), "REEVITA", font=font(72, bold=False), fill=IVORY)
    draw.text((160, 202), "C O S M E T I C S", font=font(22, serif=False), fill=GOLD)
    draw.line((120, 268, 360, 268), fill=GOLD, width=2)
    draw.text((120, 320), "BEAUTY  ·  CARE  ·  RENEW", font=font(42), fill=IVORY)
    draw.text(
        (120, 392),
        "Luxury body & hair rituals,",
        font=font(25, serif=False),
        fill=(232, 214, 200),
    )
    draw.text((120, 428), "crafted in Egypt.", font=font(25, serif=False), fill=(232, 214, 200))
    draw.text((120, 520), "reevita.com", font=font(22, serif=False), fill=GOLD)
    out = OG_DIR / "reevita-og.jpg"
    og.save(out, quality=90, optimize=True, progressive=True)
    return str(out.relative_to(ROOT))


def main() -> int:
    if not SOURCE.exists():
        print(f"Source folder not found: {SOURCE}", file=sys.stderr)
        return 1

    for directory in (PRODUCTS_DIR, BRAND_DIR, OG_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    placeholders: dict[str, str] = {}
    report: list[dict[str, object]] = []
    hero_source: Image.Image | None = None

    for filename, slug in MAPPING.items():
        path = SOURCE / filename
        if not path.exists():
            print(f"  !! missing: {filename}", file=sys.stderr)
            continue
        with Image.open(path) as raw:
            img = ImageOps.exif_transpose(raw).convert("RGB")
            img.thumbnail((1400, 1400), Image.LANCZOS)
            out = PRODUCTS_DIR / f"{slug}.webp"
            img.save(out, format="WEBP", quality=84, method=6)
            placeholders[slug] = blur_data_url(img)
            # second gallery shot: close crop of the label / texture area
            detail = img.crop((
                int(img.width * 0.16),
                int(img.height * 0.22),
                int(img.width * 0.84),
                int(img.height * 0.74),
            ))
            detail.thumbnail((1100, 1100), Image.LANCZOS)
            detail.save(PRODUCTS_DIR / f"{slug}-detail.webp", format="WEBP", quality=86, method=6)
            if slug == "body-lotion-queen":
                hero_source = img.copy()
            report.append(
                {
                    "slug": slug,
                    "file": str(out.relative_to(ROOT)).replace("\\", "/"),
                    "width": img.width,
                    "height": img.height,
                    "bytes": out.stat().st_size,
                }
            )

    # next/image placeholders (tiny inline base64) used across the storefront
    ts_lines = [
        "// AUTO-GENERATED by scripts/prepare-images.py — do not edit by hand.",
        "export const productBlurData: Record<string, string> = {",
    ]
    for slug, data in sorted(placeholders.items()):
        ts_lines.append(f'  "{slug}": "{data}",')
    ts_lines.append("};")
    ts_lines.append("")
    (ROOT / "src" / "lib").mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "lib" / "image-placeholders.ts").write_text("\n".join(ts_lines), encoding="utf-8")

    icons = build_icons()
    og = build_og(hero_source or Image.open(next(iter(PRODUCTS_DIR.glob("*.webp")))))
    (ROOT / "scripts" / "images-report.json").write_text(
        json.dumps({"products": report, "icons": icons, "og": og}, indent=2),
        encoding="utf-8",
    )

    print(f"Prepared {len(report)} product images, {len(icons)} icons, OG image: {og}")
    for item in report:
        print(f"  {item['slug']:<26} {item['width']}x{item['height']}  {item['bytes'] // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
