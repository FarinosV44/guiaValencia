"""Exporta tamaños web del logo original sin modificarlo (#36).
Uso: python3 scripts/logo.py  (requiere Pillow). El original queda en investigacion/.../identidad/."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "investigacion/ampliacion-2026-10-24/identidad/logo-donde-comer-valencia.png"
OUT = ROOT / "src/assets/img"
OUT.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
assert img.size == (1254, 1254), img.size
for size in (96, 192, 180, 512):
    img.resize((size, size), Image.LANCZOS).save(OUT / f"logo-{size}.png", optimize=True)
    if size in (96, 192):
        img.resize((size, size), Image.LANCZOS).save(OUT / f"logo-{size}.webp", quality=90, method=6)
# Recorte del rostro/plato para iconos pequeños: a 32 px el tenedor y la cuenta se pierden.
face = img.crop((330, 250, 920, 840))
face.resize((32, 32), Image.LANCZOS).save(OUT / "favicon-32.png", optimize=True)
face.resize((64, 64), Image.LANCZOS).save(OUT / "favicon-64.png", optimize=True)
print("ok")
