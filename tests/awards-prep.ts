// Bereitet einen Spielstand für die Screenshots der Ehrungen vor: spielt ohne UI weiter,
// bis „Die Besten der Saison“ (MODE=awards, Standard) bzw. die Gala des Goldenen Balls
// (MODE=gala) vorgemerkt ist, und schreibt den Stand im Speicherformat.
//   node scripts/run-ts.mjs tests/awards-prep.ts <ein.txt> <aus.txt>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { HEADLESS_UI, processDay } from '../src/game/day';
import { pendingAwards } from '../src/game/seasonAwardsGame';
import { pendingGoldenBall } from '../src/game/goldenBallGame';
import { CalendarEngine } from '../src/engine/calendar';
import { migratePositions2 } from '../src/game/positions2Migration';

const [inp, out] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game;
migratePositions2(g); // ältere Spielstände (alte Positionskürzel)
const gala = process.env.MODE === 'gala';
let guard = 0;
while (!(gala ? pendingGoldenBall(g) : pendingAwards(g)) && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) processDay(g, HEADLESS_UI);
if (!(gala ? pendingGoldenBall(g) : pendingAwards(g))) { console.error('Nichts vorgemerkt bis', g.calendar.currentDate); process.exit(1); }
delete g.simAutoManage;
if (!gala && g.goldenBall) delete g.goldenBall.pending;
data.meta.gameDate = g.calendar.currentDate;
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
console.log('vorgemerkt am', g.calendar.currentDate, '→', out);
