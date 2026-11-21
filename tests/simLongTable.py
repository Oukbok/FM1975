#!/usr/bin/env python3
# Auswertung eines 100-Saisons-Laufs von `node scripts/sim.mjs 100` (mit FIN=1 BAL=1 TOP=1 YOUTH=1 TRANSFERS=1 AI=1 SPEED=1 …)
# zu einer Tabelle je Jahrzehnt (Markdown):  python3 tests/simLongTable.py <ausgabe.txt> [weitere …]
import re, sys
from collections import defaultdict, Counter

def parse(path):
    rows = []  # je Saison ein dict
    cur = None
    first = True
    for line in open(path, encoding='utf-8', errors='replace'):
        m = re.match(r'^(\d{4})/\d{2}\s+\| Liga (\S+) Platz (\d+) \| Ø ([\d.]+) \| Top10 ([\d.]+) \| ≥85: (\d+) .*?Meister (\S+) \| Konto (-?\d+)k', line)
        if m:
            if first:
                first = False
                cur = None
                continue
            cur = dict(y=int(m.group(1)), tier=m.group(2), place=int(m.group(3)), avg=float(m.group(4)), top10=float(m.group(5)), n85=int(m.group(6)), champ=m.group(7), konto=int(m.group(8)))
            rows.append(cur)
            continue
        if cur is None:
            continue
        if 'TRANSFERS' in line and '=' in line:
            mm = re.search(r'= (\d+) %', line); cur['trf'] = int(mm.group(1)) if mm else None
        if line.strip().startswith('LONG'):
            g = lambda k: re.search(k, line)
            cur['scale'] = float(g(r'Skala ([\d.]+)').group(1))
            cur['att'] = int(g(r'Zuschauer Ø (\d+)').group(1))
            cur['rev'] = float(g(r'Umsatz med ([-\d.]+)M').group(1))
            cur['bal'] = float(g(r'KI-Konto med ([-\d.]+)M').group(1))
            cur['balmin'] = float(g(r'min ([-\d.]+)M').group(1))
            cur['wtop'] = float(g(r'Gehalt top real ([-\d.]+)M').group(1))
            cur['wmed'] = float(g(r'med (\d+)k \|').group(1))
            cur['mw'] = float(g(r'MW top real ([-\d.]+)M').group(1))
            cur['t11'] = float(g(r'Top11 max ([\d.]+)').group(1))
        if line.strip().startswith('BAL Gehalt'):
            mm = re.search(r'Konto/Umsatz KI min (\S+) med (\S+) max (\S+) .*im Minus (\d+)', line)
            if mm:
                cur['kr_min'] = mm.group(1); cur['kr_med'] = mm.group(2); cur['neg'] = int(mm.group(4))
        if line.strip().startswith('BAL Tore'):
            mm = re.search(r'Jugend-Eigengew\. (\d+)', line); cur['youth'] = int(mm.group(1)) if mm else 0
            mm = re.search(r'Tore/Sp ([\d.]+)', line); cur['goals'] = float(mm.group(1))
        if line.strip().startswith('TOP ≥90'):
            mm = re.search(r'TOP ≥90 (\d+) ≥85 (\d+).*?≥80 (\d+).*?max (\d+).*?Spitze-Keller ([\d.]+)', line)
            if mm: cur['t90'], cur['t85'], cur['t80'], cur['tmax'], cur['gap'] = int(mm.group(1)), int(mm.group(2)), int(mm.group(3)), int(mm.group(4)), float(mm.group(5))
        if line.strip().startswith('WELT Top10'):
            mm = re.search(r'≥90 (\d+) ≥88 (\d+) ≥85 (\d+) ≥80 (\d+)', line)
            if mm: cur['w90'], cur['w85'], cur['w80'] = int(mm.group(1)), int(mm.group(3)), int(mm.group(4))
        if line.strip().startswith('KI Zugänge'):
            mm = re.search(r'Trainerwechsel (\d+) \(entlassen (\d+)\)', line)
            if mm: cur['coach'] = int(mm.group(1))
        if line.startswith('SPEED') and 'Tag Ø' in line:
            mm = re.search(r'Tag Ø ([\d.]+) ms.*Saisonwechsel (\d+) ms\s+Spielstand ([\d.]+) MB\s+Spieler (\d+)\s+Heap (\d+)', line)
            if mm and rows:
                rows[-1]['day'], rows[-1]['switch'], rows[-1]['mb'], rows[-1]['players'], rows[-1]['heap'] = float(mm.group(1)), int(mm.group(2)), float(mm.group(3)), int(mm.group(4)), int(mm.group(5))
        if line.startswith('LIGARUF'):
            mm = re.search(r'LIGARUF (\d+): (.*?) \|', line)
            if mm and rows: rows[-1]['rep'] = ' · '.join(mm.group(2).split(' · ')[:3])
    return rows

def avg(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else float('nan')

def table(path):
    rows = parse(path)
    dec = defaultdict(list)
    for r in rows: dec[(r['y'] - 1975) // 10].append(r)
    out = [f'### {path.split("/")[-1]} ({len(rows)} Saisons)', '',
           '| Jahre | Ø Liga | Top10 | ≥85 Liga | Welt ≥85/≥80 | max | Spitze–Keller | Meister (versch./Saisons, häufigster) | Umsatz med real | KI-Konto med real (min) | Konto/Umsatz med | im Minus Ø | Gehalt top/med real | MW top real | Spitzenablöse % Kurve | Zuschauer Ø | Eigengew. | Trainerwechsel | Tag ms | Wechsel s | Stand MB | Heap MB |',
           '|' + '---|' * 23]
    for k in sorted(dec):
        rs = dec[k]
        y0 = 1975 + 10 * k
        champs = Counter(r['champ'] for r in rs if r['tier'] == '1')
        ch = f"{len(champs)}/{sum(champs.values())}, {champs.most_common(1)[0][0]} {champs.most_common(1)[0][1]}" if champs else '-'
        f = lambda key, fmt='{:.1f}': (fmt.format(avg([r.get(key) for r in rs])) if any(r.get(key) is not None for r in rs) else '-')
        krm = avg([float(r['kr_med']) for r in rs if r.get('kr_med') not in (None, 'undefined')])
        out.append(f"| {y0}–{y0 + 9} | {f('avg')} | {f('top10')} | {f('t85')} | {f('w85', '{:.0f}')}/{f('w80', '{:.0f}')} | {f('tmax', '{:.0f}')} | {f('gap')} | {ch} | {f('rev', '{:.2f}')}M | {f('bal', '{:.2f}')}M ({min((r.get('balmin', 0) for r in rs), default=0):.2f}) | {krm:.2f} | {f('neg')} | {f('wtop', '{:.3f}')}M/{f('wmed', '{:.0f}')}k | {f('mw', '{:.1f}')}M | {f('trf', '{:.0f}')} % | {f('att', '{:.0f}')} | {f('youth', '{:.0f}')} | {f('coach')} | {f('day', '{:.0f}')} | {avg([r.get('switch') for r in rs]) / 1000:.1f} | {f('mb')} | {f('heap', '{:.0f}')} |")
    # Längste Meisterserie
    best, run, prev, who = 0, 0, None, None
    for r in rows:
        if r['tier'] != '1': prev = None; run = 0; continue
        run = run + 1 if r['champ'] == prev else 1
        prev = r['champ']
        if run > best: best, who = run, r['champ']
    allc = Counter(r['champ'] for r in rows if r['tier'] == '1')
    out.append('')
    out.append(f"Meister gesamt: {len(allc)} verschiedene – {', '.join(f'{a} {b}' for a, b in allc.most_common(8))} | längste Serie {best} ({who})")
    return '\n'.join(out)

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(table(p)); print()
