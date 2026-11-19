// Spielstand für Screenshots des Nationaltrainers: neues Spiel (München Blau, Nationaltrainer
// Deutschland) ohne UI bis zum ersten Termin „Aufgebot nominieren“ (Zeit steht dort an).
//   node scripts/run-ts.mjs tests/national-prep.ts <aus.txt> [bis-datum]
import { writeFileSync } from 'node:fs';
import { compressToUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { nationalJob } from '../src/game/national/nationalJob';
import { SAVE_VERSION } from '../src/engine/save';

const [out, until] = process.argv.slice(2);
const ui: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {} } as DayUi;
const g = createNewGame({ managedClubId: 'muc', manager: { name: 'Max Tester', firstName: 'Max', lastName: 'Tester', nationality: 'Deutschland', birthYear: 1940, style: 'balanced', background: 'ex_pro' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, nationalTeam: 'GER' });
(g as any).simAutoManage = true;
for (let k = 0; k < 400; k++) {
  if (until ? g.calendar.currentDate >= until : nationalJob(g)?.pick && !nationalJob(g)!.pick!.used) break;
  const went = processDay(g, ui);
  if (!went) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
}
delete (g as any).simAutoManage;
for (const k of ['briefing', 'budget', 'goldenBall', 'seasonAwards', 'seasonPromises']) if ((g as any)[k]) delete (g as any)[k].pending;
const meta = { slot: 'sim', name: 'Nationaltrainer', managerName: 'Max Tester', clubName: g.clubs[g.managedClubId].name, clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate, savedAt: new Date().toISOString(), version: SAVE_VERSION };
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: g })));
console.log(`Stand ${g.calendar.currentDate}, Aufgebot: ${nationalJob(g)?.pick?.label ?? '–'}`);
