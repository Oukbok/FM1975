// Baut einen Test-Datensatz mit Beispiel-Weltdaten (England, tests/fixtures/world/eng.ts) als
// JSON für die Oberflächentests: node scripts/run-ts.mjs tests/world-prep.ts <ziel.json>
import { writeFileSync } from 'node:fs';
import { builtinDataset } from '../src/data/dataset/builtin';
import { CLUBS_ENG, SEASONS_ENG } from './fixtures/world/eng';

const out = process.argv[2] || 'test-output/world-dataset.json';
const ds = builtinDataset();
ds.meta = { id: 'welt-test', name: 'Welt-Test (England)', author: 'Test', description: 'Beispiel-Weltdaten England 1975/76, 1976/77, 1985/86, 2000/01.', created: '2026-11-05' };
ds.worldData = { ...(ds.worldData ?? {}), eng: { clubs: CLUBS_ENG, seasons: SEASONS_ENG as never } };
writeFileSync(out, JSON.stringify(ds));
console.log(`Datensatz geschrieben: ${out}`);
