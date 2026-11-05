#!/usr/bin/env python3
"""
Gesichtsbilder aus Pascals Batches einlesen (PNG, Name <epoche>_<nr>_<gruppe>.png)
und ins Spielformat bringen: public/assets/faces/<gruppe>/<epoche>/<nr>.webp
(512x600, Seitenverhältnis bleibt, transparent aufgefüllt, unten bündig, WebP q80).
Ohne Altersstufe = ein Gesicht für alle Altersstufen.

  python3 -I scripts/faces-import.py <ordner-oder-zip> [...]   danach: node scripts/faces-register.mjs
"""
import re, sys, zipfile, io
from pathlib import Path
from PIL import Image

OUT = Path('public/assets/faces')
GROUPS = {'mitteleuropa', 'nordeuropa', 'suedeuropa', 'osteuropa', 'balkan', 'tuerkei', 'westafrika', 'lateinamerika', 'ostasien', 'nordafrika', 'staff'}
EPOCHS = {1970, 1980, 1990, 2000, 2010, 2020}
NAME = re.compile(r'^(\d{4})_(\d{1,4})_([a-z_]+)\.png$', re.I)
W, H = 512, 600

def sources(args):
    for a in args:
        p = Path(a)
        if p.suffix.lower() == '.zip':
            with zipfile.ZipFile(p) as z:
                for n in z.namelist():
                    if not n.endswith('/'):
                        yield Path(n).name, z.read(n)
        elif p.is_dir():
            for f in sorted(p.rglob('*')):
                if f.is_file():
                    yield f.name, f.read_bytes()

ok, bad, alpha_missing = 0, [], 0
for name, data in sources(sys.argv[1:]):
    if name.startswith('.') or name.startswith('__'):
        continue
    m = NAME.match(name)
    if not m:
        bad.append(f'{name}: Name passt nicht (<epoche>_<nr>_<gruppe>.png)'); continue
    epoch, nr, group = int(m[1]), int(m[2]), m[3].lower()
    if epoch not in EPOCHS or group not in GROUPS:
        bad.append(f'{name}: Epoche/Gruppe unbekannt'); continue
    im = Image.open(io.BytesIO(data))
    if im.mode not in ('RGBA', 'LA') and 'transparency' not in im.info:
        alpha_missing += 1
    im = im.convert('RGBA')
    im.thumbnail((W, H), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(im, ((W - im.width) // 2, H - im.height), im)
    dst = OUT / group / str(epoch) / f'{nr:02d}.webp'
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, 'WEBP', quality=80, method=6)
    ok += 1

print(f'{ok} Bilder umgewandelt nach {OUT}/')
if alpha_missing:
    print(f'Hinweis: {alpha_missing} Bilder ohne Transparenz (Hintergrund bleibt sichtbar).')
for b in bad:
    print(' -', b)
