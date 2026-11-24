// Spielstände für Screenshots der Relegation (tests/relegation2-shots.mjs):
//   node scripts/run-ts.mjs tests/relegation2-prep.ts [ordner]
//   <ordner>/rel-vor.txt  = Deutschland 2010/11, eigener Zweitligist auf Platz 16, Tag vor dem Hinspiel
//   <ordner>/rel-nach.txt = derselbe Stand Mitte Juni (Relegation im Heimatland und im Ausland gespielt)
import { mkdirSync, writeFileSync } from 'node:fs';
import { compressToUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { findOwnMatchDue, isPrepared, quickSimOwnMatch } from '../src/game/ownMatch';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { relState } from '../src/game/relegationHome';
import { clearPendingAwards } from '../src/game/seasonAwardsGame';
import { clearPendingGoldenBall } from '../src/game/goldenBallGame';
import { SAVE_VERSION } from '../src/engine/save';
import { CalendarEngine } from '../src/engine/calendar';
import type { Game } from '../src/game/state';

const out = process.argv[2] || 'test-output/relegation2';
mkdirSync(out, { recursive: true });
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: () => {}, key: () => null, length: 0 };
const tick = (g: Game) => {
  const pre = g.calendar.pendingAdvance ? null : findOwnMatchDue(g);
  if (pre && !isPrepared(pre)) quickSimOwnMatch(g, pre);
  if (!processDay(g, HEADLESS_UI)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, HEADLESS_UI); } }
};
const runTo = (g: Game, iso: string) => { for (let i = 0; i < 1200 && g.calendar.currentDate < iso && !CalendarEngine.isSeasonOver(g.calendar); i++) tick(g); };
function dump(g: Game, file: string): void {
  const copy = JSON.parse(JSON.stringify(g)) as Game;
  clearPendingAwards(copy); clearPendingGoldenBall(copy);
  if (copy.briefing) copy.briefing.pending = false;
  if (copy.budget) copy.budget.pending = false;
  const club = copy.clubs[copy.managedClubId];
  const meta = { slot: 'sim', name: `${club.name} · ${copy.season}`, managerName: copy.manager.name, clubName: club.name, clubId: club.id, season: copy.season, gameDate: copy.calendar.currentDate, savedAt: `${copy.calendar.currentDate}T12:00:00.000Z`, version: SAVE_VERSION };
  writeFileSync(`${out}/${file}`, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: copy })));
  console.log('Stand', `${out}/${file}`, copy.calendar.currentDate);
}

const lgs = leaguesFor('ger', 2010).filter((l) => l.tier === 2);
const pick = leaguePreview(lgs[0].key, 'ger', 2010)[9].id;
const g = createNewGame({
  managedClubId: pick, manager: { name: 'Test Manager', nationality: 'GER', birthYear: 1970, style: 'balanced', background: 'ex_pro', startMode: 'manager' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: 2010,
} as any);
const last = g.fixtures.reduce((a, m) => (m.date > a ? m.date : a), '');
runTo(g, last);
for (let i = 0; i < 5 && g.calendar.currentDate === last; i++) tick(g);
// Eigenen Verein auf Platz 16 setzen und die Paarungen neu lesen lassen.
const rows = g.table.rows;
const i0 = rows.findIndex((r) => r.clubId === g.managedClubId);
[rows[i0], rows[15]] = [rows[15], rows[i0]];
rows.forEach((r, k) => { r.position = k + 1; });
for (const rec of relState(g)?.recs ?? []) { delete rec.res; delete rec.skip; delete rec.up; rec.ent = []; for (const t of rec.ties) for (const l of t.legs) { l.h = ''; l.a = ''; } }
for (const e of g.calendar.events) if (e.matchId?.startsWith('rl_')) e.processed = false;
tick(g);
const first = relState(g)!.recs.find((r) => r.lv === 2)!.ties[0].legs[0].d;
runTo(g, CalendarEngine.addDays(first, -1));
dump(g, 'rel-vor.txt');
runTo(g, `${g.season.slice(0, 4) === '2010' ? 2011 : 2011}-06-16`);
dump(g, 'rel-nach.txt');
