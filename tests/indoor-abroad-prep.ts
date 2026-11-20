// Bereitet einen Spielstand für Screenshots der Hallen-Show mit Auslandsturnier vor:
// eigener Verein als Spitzenverein (Ansehen 92), Einladung ins Ausland zugesagt, deutsche
// Turniere abgesagt, Stand am Vortag des Auslandsturniers.
//   DUMP=test-output/indoor/save1990oct.txt UNTIL=1990-10-25 node scripts/sim.mjs 15
//   node scripts/run-ts.mjs tests/indoor-abroad-prep.ts <ein.txt> <aus.txt>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { HEADLESS_UI, processDay } from '../src/game/day';
import { CalendarEngine } from '../src/engine/calendar';
import { migratePositions2 } from '../src/game/positions2Migration';
import { setOwnIndoorDecision } from '../src/game/indoorGame';
import { indoorState } from '../src/game/winterShared';

const [inp, out] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game;
migratePositions2(g);
g.simAutoManage = true;
g.clubs[g.managedClubId].reputation = 92;
let guard = 0;
while (indoorState(g).current?.season !== g.season && guard++ < 30) processDay(g, HEADLESS_UI);
const cur = indoorState(g).current!;
const t = (cur.abroad ?? []).find((x) => x.own === null);
if (!t) { console.error('Keine Einladung ins Ausland:', (cur.abroad ?? []).map((x) => x.name).join(', ')); process.exit(1); }
setOwnIndoorDecision(g, t.id, 'mix');
for (const o of cur.tournaments) if (o.own === null && o.date <= t.date) setOwnIndoorDecision(g, o.id, 'decline');
guard = 0;
while (g.calendar.currentDate < CalendarEngine.addDays(t.date, -1) && guard++ < 120) processDay(g, HEADLESS_UI);
delete g.simAutoManage;
data.meta.gameDate = g.calendar.currentDate; data.meta.season = g.season;
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
console.log(`${t.name} ${t.date}: ${t.clubIds.join(', ')} → ${out} (${g.calendar.currentDate})`);
