// Spielstände für Screenshots der tieferen Ligen (Wunsch Pascal): neues Spiel bis zum Stichtag.
//   node scripts/run-ts.mjs tests/deep-prep.ts <land> <jahr> <ebene> <bis JJJJ-MM-TT> <datei>
// Beispiel: node scripts/run-ts.mjs tests/deep-prep.ts eng 1995 4 1995-11-20 test-output/deep/eng4.txt
import { compressToUTF16 } from 'lz-string';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createNewGame } from '../src/game/newGame';
import { processDay } from '../src/game/day';
import { HEADLESS_UI } from '../src/game/dayUi';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { SAVE_VERSION } from '../src/engine/save';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
const [cc, ys, ts, until, file] = process.argv.slice(2);
const year = Number(ys), tier = Number(ts);
const lg = leaguesFor(cc, year).find((l) => l.tier === tier)!;
const club = leaguePreview(lg.key, cc, year)[3].id;
const g = createNewGame({ managedClubId: club, manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, country: cc } as any);
(g as any).simAutoManage = true;
for (let i = 0; i < 400 && g.calendar.currentDate < until; i++) if (!processDay(g, HEADLESS_UI)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, HEADLESS_UI); } }
delete (g as any).simAutoManage;
const my = g.clubs[g.managedClubId];
const meta = { slot: 'deep', name: 'Tiefe Ligen', managerName: 'Test', clubName: my.name, clubId: my.id, season: g.season, gameDate: g.calendar.currentDate, savedAt: new Date().toISOString(), version: SAVE_VERSION };
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: g })));
console.log('Spielstand', file, my.name, g.leagues.playerDivision.name, g.calendar.currentDate);
