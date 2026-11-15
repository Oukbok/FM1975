// Bereitet einen Spielstand mit offenem Sponsorangebot vor (für den Fenster-Fall
// „sponsor-verhandlung“ in tests/popup-size.mjs): spielt ohne UI weiter, bis der eigene
// Verein ein Angebot hat (z. B. Verlängerungsangebote am 1. Januar), und schreibt den Stand.
//   node scripts/run-ts.mjs tests/sponsor-offer-prep.ts <ein.txt> <aus.txt>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { HEADLESS_UI, processDay } from '../src/game/day';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { CalendarEngine } from '../src/engine/calendar';

const [inp, out] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game;
prepareLoadedGame(g);
const offers = () => g.clubs[g.managedClubId].commerce?.dealOffers?.length ?? 0;
let guard = 0;
while (!offers() && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) processDay(g, HEADLESS_UI);
if (!offers()) { console.error('Kein Sponsorangebot bis', g.calendar.currentDate); process.exit(1); }
delete g.simAutoManage;
// Fenster, die beim Laden aufgehen würden (Gala, Ehrungen), nicht vormerken – der Test will nur das Angebot.
if (g.goldenBall) delete g.goldenBall.pending;
if (g.seasonAwards) delete g.seasonAwards.pending;
data.meta.gameDate = g.calendar.currentDate;
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
console.log('Sponsorangebot am', g.calendar.currentDate, '→', out);
