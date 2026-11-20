// Spielstand für Screenshots Scouting 2.0: Vorlage 2025 mit Abos, zurückgekehrtem Auslandsscout,
// laufender Reise und zwei Jugendcamps mit Talenten (eins übernehmbar).
//   node scripts/run-ts.mjs tests/scouting-prep.ts [aus]   (Standard test-output/scouting/stand.txt)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { subscribe } from '../src/game/scoutSoftware';
import { abroadDaily, scoutStaff, startAbroad } from '../src/game/scoutAbroad';
import { scoutingOf } from '../src/game/scoutingGame';
import { buildCamp, campAt, youthCampsDaily } from '../src/game/youthCamps';
import type { Game } from '../src/game/state';

const file = process.argv[2] ?? 'test-output/scouting/stand.txt';
const txt = readFileSync('public/saves/liga1-2025.txt', 'utf8');
const save = JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { meta: Record<string, unknown>; game: Game };
const g = save.game;
prepareLoadedGame(g);
const today = g.calendar.currentDate;
subscribe(g, 'vista');
subscribe(g, 'lupe');
const st = scoutStaff(g);
startAbroad(g, 'Spanien', 4, st[0].id);
scoutingOf(g).abroad![0].start = '2025-11-01';
abroadDaily(g, today);
startAbroad(g, 'Portugal', 8, st[0].id);
for (const id of ['gha', 'bra']) {
  buildCamp(g, id, 1);
  const c = campAt(g, id)!;
  c.building!.done = today;
}
youthCampsDaily(g, today);
youthCampsDaily(g, '2024-07-01');
youthCampsDaily(g, '2025-07-01');
const kid = campAt(g, 'gha')!.kids[0];
if (kid) kid.born -= 3;
buildCamp(g, 'gha', 2);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, 'LZ1:' + compressToUTF16(JSON.stringify({ ...save, game: g })));
console.log('Spielstand', file, today);
