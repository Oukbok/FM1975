// =============================================================================
// Vorlagen aus unterschiedlichen Ligen (Wunsch Pascal): je Eintrag ein neues Spiel im
// Land/Jahr mit einem Verein der Ebene, gespielt bis zum 10.12. der ersten Saison
// (tests/league-save.ts). Ergebnis: public/saves/<datei> + Eintrag in index.json.
//   node scripts/make-league-saves.mjs            (alle, ≈ 1 Minute)
//   ONLY=england-1992 node scripts/make-league-saves.mjs
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// [Datei ohne .txt, Land, Jahr, Ebene, Nr. des Vereins in der Liga, Land für den Namen der Vorlage]
const SAVES = [
  ['liga2-1977', 'ger', 1977, 2, 3, 'Deutschland'],
  ['regionalliga-1995', 'ger', 1995, 3, 5, 'Deutschland'],
  ['regionalliga-2004', 'ger', 2004, 3, 7, 'Deutschland'],
  ['liga3-2010', 'ger', 2010, 3, 8, 'Deutschland'],
  ['regionalliga-2015', 'ger', 2015, 4, 6, 'Deutschland'],
  ['liga1-2025', 'ger', 2025, 1, 10, 'Deutschland'],
  ['england-1992', 'eng', 1992, 1, 6, 'England'],
  ['italien-1985', 'ita', 1985, 1, 5, 'Italien'],
  ['frankreich-2000', 'fra', 2000, 1, 7, 'Frankreich'],
  ['spanien-2005', 'esp', 2005, 1, 8, 'Spanien'],
  ['niederlande2-2020', 'ned', 2020, 2, 4, 'Niederlande'],
];
const only = process.env.ONLY?.split(',');
const idxPath = 'public/saves/index.json';
let list = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf8')) : [];
for (const [key, cc, year, tier, nr, name] of SAVES) {
  if (only && !only.includes(key)) continue;
  const file = `${key}.txt`;
  const out = execFileSync('node', ['scripts/run-ts.mjs', 'tests/league-save.ts', cc, String(year), String(tier), String(nr), `public/saves/${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const info = JSON.parse(out.trim().split('\n').pop());
  const entry = { file, name: `${name} ${year} · ${info.league}`, clubName: info.clubName, season: info.season, gameDate: info.gameDate, note: `erzeugt ${new Date().toISOString().slice(0, 10)}` };
  list = [...list.filter((x) => x.file !== file), entry];
  console.log(file, '·', entry.name, '·', info.clubName);
}
writeFileSync(idxPath, JSON.stringify(list, null, 2) + '\n');
