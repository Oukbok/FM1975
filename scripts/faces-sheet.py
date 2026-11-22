#!/usr/bin/env python3
# Übersichtsbilder der Gesichtsbilder zum Sichten der Ethnie (Wunsch Pascal).
#   python3 scripts/faces-sheet.py          nur noch nicht gesichtete (docs/images/faces-reviewed.txt)
#   python3 scripts/faces-sheet.py --alle   alle Bilder
# Ausgabe: test-output/faces-sichtung/sheetNN.jpg (10 × 6 je Blatt, Nummer + Pfad darunter)
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
ROOT, OUT, REVIEW = 'images/faces', 'test-output/faces-sichtung', 'docs/images/faces-reviewed.txt'
# Ordner (englisch) -> Gruppen-ID wie im Register/in der Sichtungsliste (src/data/faceDirs.json)
DIRS = json.load(open('src/data/faceDirs.json', encoding='utf8'))
GROUP_OF_DIR = {d: g for g, d in DIRS.items()}
seen = set()
if '--alle' not in sys.argv and os.path.exists(REVIEW):
    seen = {l.strip() for l in open(REVIEW, encoding='utf8') if l.strip() and not l.startswith('#')}
items = []
for root, _, fs in os.walk(ROOT):
    for f in fs:
        if f.endswith('.webp') and '-mask' not in f:
            rel = os.path.relpath(os.path.join(root, f), ROOT)[:-5].replace(os.sep, '/')
            d, rest = rel.split('/', 1)
            key = f'{GROUP_OF_DIR.get(d, d)}/{rest}'
            if not key.startswith('staff/') and key not in seen: items.append(key)
items.sort()
os.makedirs(OUT, exist_ok=True)
W, H, C, R = 150, 176, 10, 6
font = ImageFont.load_default()
for s in range(0, len(items), C * R):
    sheet = Image.new('RGB', (C * W, R * (H + 14)), (255, 255, 255)); d = ImageDraw.Draw(sheet)
    for i, key in enumerate(items[s:s + C * R]):
        g, rest = key.split('/', 1)
        im = Image.open(f'{ROOT}/{DIRS.get(g, g)}/{rest}.webp').convert('RGBA'); bg = Image.new('RGBA', im.size, (200, 200, 200, 255)); bg.alpha_composite(im)
        im = bg.convert('RGB'); im.thumbnail((W, H))
        x, y = (i % C) * W, (i // C) * (H + 14); sheet.paste(im, (x, y))
        d.text((x + 2, y + H), f'{s + i} {key}', fill=(0, 0, 0), font=font)
    sheet.save(f'{OUT}/sheet{s // (C * R):02d}.jpg', quality=80)
print(f'{len(items)} Bild(er) in {OUT}')
