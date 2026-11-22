#!/usr/bin/env python3
"""Vorher/Nachher-Montage der Tabellen-Screenshots (tests/table-shots.mjs).

    python3 tests/table-montage.py <vorher-ordner> <nachher-ordner> <ziel-ordner> [auflösung=1280x800] [filter]

Links vorher, rechts nachher, darüber eine Beschriftung. Dateinamen wie die Screenshots.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

before, after, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
view = sys.argv[4] if len(sys.argv) > 4 else '1280x800'
only = sys.argv[5] if len(sys.argv) > 5 else ''
out.mkdir(parents=True, exist_ok=True)

def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

HEAD, GAP = 44, 12
for a in sorted((after / view).glob('*.png')):
    if only and only not in a.name:
        continue
    b = before / view / a.name
    if not b.exists():
        continue
    ib, ia = Image.open(b).convert('RGB'), Image.open(a).convert('RGB')
    w, h = ib.width + ia.width + GAP, max(ib.height, ia.height) + HEAD
    img = Image.new('RGB', (w, h), (24, 28, 36))
    d = ImageDraw.Draw(img)
    title = a.stem.split('-', 1)[1].replace('-', ' ')
    d.text((14, 10), f'VORHER  ·  {title}  ·  {view}', font=font(22), fill=(235, 200, 120))
    d.text((ib.width + GAP + 14, 10), f'NACHHER  ·  {title}  ·  {view}', font=font(22), fill=(140, 220, 150))
    img.paste(ib, (0, HEAD))
    img.paste(ia, (ib.width + GAP, HEAD))
    suffix = '' if view == '1280x800' else f'-{view}'
    img.save(out / f'{a.stem}{suffix}.png')
    print(out / f'{a.stem}{suffix}.png')
