// Bericht des Seiten-Checks (tests/audit.mjs) als Markdown-Tabellen.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { KINDS } from './audit-checks.mjs';

const esc = (s) => String(s).replace(/\|/g, '\\|');
/** Gleiche Funde auf mehreren Seiten zusammenfassen (Zahlen zählen nicht). */
const BY_PATH = new Set(['ellipsis', 'clip', 'hscroll', 'font', 'color']);
const keyOf = (f) => `${f.k}|${(BY_PATH.has(f.k) ? f.d.split(/[:„(]/)[0] : f.d).replace(/\d+(\.\d+)?/g, '#')}`;

export function summarize(findings, views) {
  const byKind = {};
  for (const k of Object.keys(KINDS)) byKind[k] = Object.fromEntries(views.map((v) => [v, 0]));
  for (const f of findings) { byKind[f.k] ??= {}; byKind[f.k][f.view] = (byKind[f.k][f.view] ?? 0) + 1; }
  const groups = new Map();
  for (const f of findings) {
    const key = keyOf(f);
    let g = groups.get(key);
    if (!g) { g = { k: f.k, d: f.d, n: 0, where: new Set(), views: new Set(), saves: new Set() }; groups.set(key, g); }
    g.n++; g.where.add(f.where); g.views.add(f.view); g.saves.add(f.save);
  }
  return { byKind, groups: [...groups.values()] };
}

export async function writeReport(path, { stats, findings, colors, saves, views, secs, before }) {
  const { byKind, groups } = summarize(findings, views);
  const L = [];
  L.push('# Seiten-Check (test:audit)', '');
  L.push(`Erzeugt von \`npm run test:audit\` (\`tests/audit.mjs\`, Prüfungen \`tests/audit-checks.mjs\`). Stände: ${saves.join(', ')}. Auflösungen: ${views.join(', ')}. ${stats.pages} Seitenansichten, ${stats.popups} Fensteransichten, ${stats.shots} Screenshots (\`test-output/audit/<auflösung>/<stand>/\`), Laufzeit ${Math.round(secs / 60)} min.`, '');
  L.push('Schwere Arten (✗) lassen den Test scheitern, die übrigen sind Hinweise für die Sichtprüfung.', '');
  L.push(`| Art | schwer | ${views.join(' | ')} | verschieden |`, `|---|---|${views.map(() => '---:').join('|')}|---:|`);
  for (const [k, def] of Object.entries(KINDS)) {
    const nDiff = groups.filter((g) => g.k === k).length;
    L.push(`| ${def.t} | ${def.hard ? '✗' : ''} | ${views.map((v) => byKind[k]?.[v] ?? 0).join(' | ')} | ${nDiff} |`);
  }
  L.push('');
  if (before) {
    const b = summarize(before.findings, views).byKind;
    L.push('## Vorher / nachher', '', `Vorher = derselbe Check auf dem Stand vor diesem Durchgang (\`DIST=…\`, ${before.stats.pages} Seiten-, ${before.stats.popups} Fensteransichten). Je Auflösung: vorher → nachher.`, '');
    L.push(`| Art | ${views.join(' | ')} |`, `|---|${views.map(() => '---|').join('')}`);
    for (const [k, def] of Object.entries(KINDS)) {
      const cells = views.map((v) => `${b[k]?.[v] ?? 0} → ${byKind[k]?.[v] ?? 0}`);
      if (cells.every((c) => c === '0 → 0')) continue;
      L.push(`| ${def.t} | ${cells.join(' | ')} |`);
    }
    L.push('');
  }
  L.push('## Funde (zusammengefasst)', '', '| Art | Anzahl | Auflösung | Stände | Seiten (Beispiele) | Beschreibung (Beispiel) |', '|---|---:|---|---|---|---|');
  const order = Object.keys(KINDS);
  groups.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k) || b.n - a.n);
  const perKind = {};
  for (const g of groups) {
    perKind[g.k] = (perKind[g.k] ?? 0) + 1;
    if (perKind[g.k] > 30) continue;
    const where = [...g.where];
    L.push(`| ${KINDS[g.k]?.t ?? g.k} | ${g.n} | ${[...g.views].join(', ')} | ${[...g.saves].join(', ')} | ${esc(where.slice(0, 3).join('; '))}${where.length > 3 ? ` (+${where.length - 3})` : ''} | ${esc(g.d)} |`);
  }
  L.push('');
  if (colors?.length) {
    const sum = colors.reduce((s, c) => s + c.n, 0);
    L.push('## Feste Farben im CSS (außerhalb 00-base/25-theme/30-theme)', '', `${sum} Farbwerte ohne Token in ${colors.length} Dateien (Zeichnungen/Szenen nutzen bewusst eigene Farben).`, '', '| Datei | Farbwerte |', '|---|---:|');
    for (const c of [...colors].sort((a, b) => b.n - a.n).slice(0, 25)) L.push(`| ${c.f} | ${c.n} |`);
    L.push('');
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, L.join('\n') + '\n');
}
