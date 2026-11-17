// Spielstand für Screenshots der zweiten Mannschaft: alten Stand laden (Mini-Liga), Saisonwechsel
// (Einordnung in die Pyramide, game/reservePyramid.ts), dann bis zum Stichtag weiterspielen.
//   node scripts/run-ts.mjs tests/reserve-prep.ts <ein.txt> <aus.txt> [bis=JJJJ-09-20] [stufe]
import { readFileSync, writeFileSync } from 'fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { startNextSeason } from '../src/game/season';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { reserveState } from '../src/game/reserveTeam';
const [inp, out, until, lvl] = process.argv.slice(2);
const slot = JSON.parse(decompressFromUTF16(readFileSync(inp, 'utf8').slice(4)));
const g = slot.game;
prepareLoadedGame(g);
if (lvl) g.clubs[g.managedClubId].youthInvest.levels.reserve = Number(lvl);
reserveState(g);
startNextSeason(g);
const ui: DayUi = { onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {}, onCupDraw: () => false, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false } as any;
const end = until ?? `${g.season.slice(0, 4)}-09-20`;
for (let i = 0; i < 200 && g.calendar.currentDate < end; i++) {
  if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
}
const st = reserveState(g);
console.log(g.season, g.calendar.currentDate, st?.leagueName, st?.note, st?.md);
for (const k of ['briefing', 'budget']) if (g[k]?.pending) g[k].pending = false;
slot.meta = { ...(slot.meta ?? {}), season: g.season, date: g.calendar.currentDate };
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(slot)));
