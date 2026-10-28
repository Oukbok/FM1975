"""Einmaliges Umfärben auf das Abendhimmel-Thema (Startbildschirm):
Türkis -> Bernstein, kühle Blau-/Navy-Töne -> warme Abendtöne.
Aufruf: python3 scripts/recolor-theme.py <dateien...>"""
import re, sys, colorsys

def to_hls(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, l * 100, s * 100

def from_hls(h, l, s):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, max(0, min(100, l)) / 100, max(0, min(100, s)) / 100)
    return round(r * 255), round(g * 255), round(b * 255)

def remap(r, g, b):
    h, l, s = to_hls(r, g, b)
    # Türkis/Cyan-Akzent -> Bernstein
    if 180 <= h <= 200 and s >= 45:
        if l < 18:   # sehr dunkles Cyan (Text auf Akzent, Tiefen) -> dunkles Braun
            return from_hls(29, l, min(s, 76))
        if l >= 45:
            return from_hls(34, min(l + 8, 92), 87)
        return from_hls(30, l + 4, 80)
    # kühle Grau-/Navy-Töne -> warme Abendtöne
    if 195 <= h <= 235 and s < 50:
        if l < 40:
            return from_hls(330, l, min(s * 0.45, 16))
        return from_hls(32, l, min(s * 0.7, 30))
    return r, g, b

def hx(rgb):
    return '#%02x%02x%02x' % rgb

def sub_hex(m):
    t = m.group(0)
    h = t[1:]
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    new = remap(*rgb)
    if new == rgb:
        return t
    out = hx(new)
    return out.upper() if t[1:].isupper() and any(c.isalpha() for c in t[1:]) else out

def sub_rgba(m):
    r, g, b = int(m.group(2)), int(m.group(3)), int(m.group(4))
    nr, ng, nb = remap(r, g, b)
    return f"{m.group(1)}({nr}, {ng}, {nb}{m.group(5)}"

HEX = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGBA = re.compile(r'(rgba?)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,[^)]*\)|\s*\))')

for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    n = HEX.sub(sub_hex, s)
    n = RGBA.sub(sub_rgba, n)
    if n != s:
        open(f, 'w', encoding='utf-8').write(n)
        print('umgefärbt:', f)
