// =============================================================================
// Vorlagen „Frankfurt Rot nach 10 … 60 Jahren“ (Wunsch Pascal): ein Simulationslauf über
// 60 Saisons, nach je 10 Saisons bis zum 10.12. weitergespielt und als Vorlage abgelegt
// (public/saves/test-<n>-jahre.txt + Eintrag in public/saves/index.json, im Spiel unter
// Spiel laden › Vorlagen). Dauert etwa eine Stunde:  node scripts/make-era-saves.mjs
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const YEARS = (process.env.YEARS ?? '10,20,30,40,50,60').split(',').map(Number);
const file = (n) => `test-${n}-jahre.txt`;
const max = Math.max(...YEARS);
execFileSync('node', ['scripts/sim.mjs', String(max)], {
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, CLUB: 'fra', DUMPS: YEARS.map((n) => `${n}:public/saves/${file(n)}`).join(','), SEED: process.env.SEED ?? '1975' },
});
const idxPath = 'public/saves/index.json';
let list = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf8')) : [];
for (const n of YEARS) {
  const y0 = 1975 + n;
  const entry = { file: file(n), name: `Test ${n} Jahre`, clubName: 'Frankfurt Rot', season: `${y0}/${String((y0 + 1) % 100).padStart(2, '0')}`, gameDate: `${y0}-12-10`, note: `erzeugt ${new Date().toISOString().slice(0, 10)}` };
  list = [...list.filter((x) => x.file !== entry.file), entry];
}
writeFileSync(idxPath, JSON.stringify(list, null, 2) + '\n');
console.log('Vorlagen geschrieben:', YEARS.map(file).join(', '));
