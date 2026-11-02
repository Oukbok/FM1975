// =============================================================================
// Vorlage „Test 3 Jahre“ erzeugen: Frankfurt Rot, drei Saisons gespielt, Mitte der
// Saison 1978/79 (vor der Winterpause). Ergebnis: public/saves/test-3-jahre.txt +
// Eintrag in public/saves/index.json – im Spiel unter „Spiel laden › Vorlagen“.
// Nach größeren Änderungen am Spiel neu erzeugen:  node scripts/make-test-save.mjs
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = 'test-3-jahre.txt';
const until = '1978-12-10';
execFileSync('node', ['scripts/sim.mjs', '3'], {
  stdio: ['ignore', 'ignore', 'inherit'],
  env: { ...process.env, CLUB: 'fra', TESTSAVE: '1', UNTIL: until, DUMP: `public/saves/${file}`, SEED: process.env.SEED ?? '1975' },
});
const idxPath = 'public/saves/index.json';
const list = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf8')) : [];
const entry = { file, name: 'Test 3 Jahre', clubName: 'Frankfurt Rot', season: '1978/79', gameDate: until, note: `erzeugt ${new Date().toISOString().slice(0, 10)}` };
writeFileSync(idxPath, JSON.stringify([entry, ...list.filter((x) => x.file !== file)], null, 2) + '\n');
console.log('Vorlage geschrieben:', `public/saves/${file}`);
