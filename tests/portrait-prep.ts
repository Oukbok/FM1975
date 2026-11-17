// Vorbereitung für tests/dataset-lib.mjs: Vorlage „Test 3 Jahre“ mit Datensatz „bildtest“
// (den der Test im Editor anlegt) und dem Namen des stärksten Spielers im eigenen Kader.
//   node scripts/run-ts.mjs tests/portrait-prep.ts <ausgabe.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import type { Game } from '../src/game/state';

const out = process.argv[2] || 'test-output/portrait-prep.json';
const txt = readFileSync('public/saves/test-3-jahre.txt', 'utf8');
const wrap = JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game };
const g = wrap.game;
const all = Object.values(g.players);
const squad = g.clubs[g.managedClubId].playerIds.map((id) => g.players[id]).filter(Boolean)
  .filter((p) => all.filter((x) => x.fullName === p.fullName).length === 1)
  .sort((a, b) => b.overall - a.overall);
const p = squad[0];
g.datasetId = 'bildtest';
g.datasetName = 'Bildtest';
writeFileSync(out, JSON.stringify({ save: 'LZ1:' + compressToUTF16(JSON.stringify(wrap)), player: p.fullName, born: Number(p.dateOfBirth.slice(0, 4)) }));
console.log(`Spieler mit Spielerbild: ${p.fullName}`);
