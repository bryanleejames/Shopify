#!/usr/bin/env python3
"""Generate FluxPay app icons in all required iOS sizes."""

import math
import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "Assets.xcassets", "AppIcon.appiconset")

# FluxPay brand colors
FLUX_BLUE = (26, 115, 232)  # #1A73E8
WHITE = (255, 255, 255)

SIZES = {
    "20x20": 20,
    "40x40": 40,
    "60x60": 60,
    "80x80": 80,
    "120x120": 120,
    "152x152": 152,
    "167x167": 167,
    "180x180": 180,
    "1024x1024": 1024,
}


def draw_lightning_bolt(draw, cx, cy, size, color=WHITE):
    """Draw a minimalist lightning bolt at (cx, cy) with given size."""
    scale = size / 100.0
    # Points for a clean lightning bolt shape
    pts = [
        (cx - 18 * scale, cy + 32 * scale),  # bottom-left
        (cx - 2 * scale, cy - 4 * scale),  # top-right of first segment
        (cx + 4 * scale, cy + 5 * scale),  # inner corner
        (cx + 18 * scale, cy - 28 * scale),  # top-right
        (cx + 2 * scale, cy + 14 * scale),  # bottom-right of second
        (cx - 4 * scale, cy - 5 * scale),  # inner corner
    ]
    draw.polygon(pts, fill=color)


def draw_icon(size, output_path):
    """Generate a single FluxPay icon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    corner_radius = size * 0.225  # ~22.5% of size for iOS rounded square look
    # Approximate rounded rect by drawing circles at corners + filled rects
    r = int(corner_radius)
    
    # Fill center
    draw.rectangle([r, 0, size - r, size], fill=FLUX_BLUE)
    draw.rectangle([0, r, size, size - r], fill=FLUX_BLUE)
    
    # Fill corner circles
    draw.ellipse([0, 0, r * 2, r * 2], fill=FLUX_BLUE)
    draw.ellipse([size - r * 2, 0, size, r * 2], fill=FLUX_BLUE)
    draw.ellipse([0, size - r * 2, r * 2, size], fill=FLUX_BLUE)
    draw.ellipse([size - r * 2, size - r * 2, size, size], fill=FLUX_BLUE)

    # Draw lightning bolt
    bolt_size = size * 0.5  # 50% of icon size
    draw_lightning_bolt(draw, size / 2, size / 2, bolt_size)

    img.save(output_path, "PNG")
    print(f"  Generated: {output_path} ({size}x{size})")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for name, side in SIZES.items():
        filename = f"icon-{name}.png"
        path = os.path.join(OUTPUT_DIR, filename)
        draw_icon(side, path)

    print(f"\nAll {len(SIZES)} icons generated in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
