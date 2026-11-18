#!/usr/bin/env python3
# Übersichtsbilder der Gesichtsbilder zum Sichten der Ethnie (Wunsch Pascal).
#   python3 scripts/faces-sheet.py          nur noch nicht gesichtete (docs/bilder/faces-gesichtet.txt)
#   python3 scripts/faces-sheet.py --alle   alle Bilder
# Ausgabe: test-output/faces-sichtung/sheetNN.jpg (10 × 6 je Blatt, Nummer + Pfad darunter)
import os, sys
from PIL import Image, ImageDraw, ImageFont
ROOT, OUT, REVIEW = 'bilder/faces', 'test-output/faces-sichtung', 'docs/bilder/faces-gesichtet.txt'
seen = set()
if '--alle' not in sys.argv and os.path.exists(REVIEW):
    seen = {l.strip() for l in open(REVIEW, encoding='utf8') if l.strip() and not l.startswith('#')}
items = []
for root, _, fs in os.walk(ROOT):
    for f in fs:
        if f.endswith('.webp') and 'maske' not in f:
            key = os.path.relpath(os.path.join(root, f), ROOT)[:-5].replace(os.sep, '/')
            if not key.startswith('staff/') and key not in seen: items.append(key)
items.sort()
os.makedirs(OUT, exist_ok=True)
W, H, C, R = 150, 176, 10, 6
font = ImageFont.load_default()
for s in range(0, len(items), C * R):
    sheet = Image.new('RGB', (C * W, R * (H + 14)), (255, 255, 255)); d = ImageDraw.Draw(sheet)
    for i, key in enumerate(items[s:s + C * R]):
        im = Image.open(f'{ROOT}/{key}.webp').convert('RGBA'); bg = Image.new('RGBA', im.size, (200, 200, 200, 255)); bg.alpha_composite(im)
        im = bg.convert('RGB'); im.thumbnail((W, H))
        x, y = (i % C) * W, (i // C) * (H + 14); sheet.paste(im, (x, y))
        d.text((x + 2, y + H), f'{s + i} {key}', fill=(0, 0, 0), font=font)
    sheet.save(f'{OUT}/sheet{s // (C * R):02d}.jpg', quality=80)
print(f'{len(items)} Bild(er) in {OUT}')
