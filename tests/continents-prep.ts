// Spielstände für Screenshots Weltpokal/Klub-WM (tests/continents-shots.mjs):
//   node scripts/run-ts.mjs tests/continents-prep.ts [ordner]
//   <ordner>/wp-1985.txt  = 1985, du bist Landesmeister-Sieger, Spieltag des Weltpokals in Tokio (Vorschau)
//   <ordner>/cwc-2009.txt = 2009, Klub-WM (7 Teams) ausgespielt (Statistiken › International › Welt)
import { mkdirSync, writeFileSync } from 'node:fs';
import { compressToUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { setupIntercontinental } from '../src/game/intercontinental';
import { SAVE_VERSION } from '../src/engine/save';
import type { Game } from '../src/game/state';

const dir = process.argv[2] || 'test-output/continents';
mkdirSync(dir, { recursive: true });
const ui: DayUi = { onOwnMatchDue() {}, onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onCupDraw: () => false, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
const make = (year: number) => {
  const g = createNewGame({ managedClubId: 'muc', manager: { name: 'Test', nationality: 'GER', birthYear: year - 38, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, historyMode: 'medium' } as any);
  (g as any).simAutoManage = true;
  return g;
};
const dump = (g: Game, file: string) => {
  delete (g as any).simAutoManage;
  const meta = { slot: 'sim', name: 'Transatlantik-Pokal', managerName: 'Test', clubName: g.clubs.muc.name, clubId: 'muc', season: g.season, gameDate: g.calendar.currentDate, savedAt: new Date().toISOString(), version: SAVE_VERSION };
  writeFileSync(`${dir}/${file}`, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: g })));
  console.log(`${dir}/${file}: ${g.calendar.currentDate}`);
};
/** Tage laufen lassen; `stop` true → am Spieltag des Wettbewerbs anhalten (vor dem Spiel). */
function run(g: Game, until: string, stop: (label: string) => boolean): boolean {
  let guard = 0;
  while (g.calendar.currentDate < until && guard++ < 900) {
    if (processDay(g, ui)) continue;
    const due = findOwnMatchDue(g);
    if (due && stop(due.label)) return true;
    if (due) quickSimOwnMatch(g, due);
    processDay(g, ui);
  }
  return false;
}

{
  const g = make(1985);
  setupIntercontinental(g, { ec: 'muc', ecRu: null });
  if (run(g, '1985-12-31', (l) => l.startsWith('Transatlantik-Pokal'))) dump(g, 'wp-1985.txt');
  else console.log('Transatlantik-Pokal-Spieltag nicht erreicht');
}
{
  const g = make(2009);
  setupIntercontinental(g, { ec: 'muc', ecRu: null });
  run(g, '2009-12-30', () => false);
  dump(g, 'cwc-2009.txt');
}
