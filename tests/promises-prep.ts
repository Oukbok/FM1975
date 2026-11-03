// Bereitet Spielstände für die Screenshots „Erstes Training“ vor (aus der Vorlage
// „Test 3 Jahre“): spielt ohne UI bis zum Saisonwechsel, dann bis zum ersten Training.
//   node scripts/run-ts.mjs tests/promises-prep.ts <ein.txt> <popup.txt> <stand.txt>
// <popup.txt>: Popup fällig (1979/80). <stand.txt>: Versprechen gegeben, Mitte Oktober.
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { HEADLESS_UI, processDay } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { migratePositions2 } from '../src/game/positions2Migration';
import { giveSeasonPromises, pendingSeasonPromises } from '../src/game/seasonPromisesGame';

const [inp, outPopup, outStand] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game;
migratePositions2(g);
g.simAutoManage = true;
const write = (file: string) => {
  const auto = g.simAutoManage; delete g.simAutoManage;
  data.meta.gameDate = g.calendar.currentDate; data.meta.season = g.season;
  writeFileSync(file, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
  g.simAutoManage = auto;
  console.log(g.calendar.currentDate, '→', file);
};
let guard = 0;
while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) processDay(g, HEADLESS_UI);
startNextSeason(g);
if (g.briefing) g.briefing.pending = undefined;
guard = 0;
while (!pendingSeasonPromises(g) && guard++ < 60) processDay(g, HEADLESS_UI);
if (!pendingSeasonPromises(g)) { console.error('Kein erstes Training'); process.exit(1); }
write(outPopup);
giveSeasonPromises(g, ['ziel', 'pokal', 'disziplin', 'jugend', 'trainingsanlagen']);
guard = 0;
while (g.calendar.currentDate < `${g.season.slice(0, 4)}-10-15` && guard++ < 200) processDay(g, HEADLESS_UI);
write(outStand);
