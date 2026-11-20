// =============================================================================
// DDR als Heimatland (game/ddrHome.ts) ohne UI – npm run test:ddrhome
//   1. Start 1980 in der DDR-Oberliga und in der DDR-Liga: Spielerliga, Kader, Punkteregel, Währung,
//      Europapokal-Starter, Transfersperre, eine Saison + Saisonwechsel, Speichern/Laden.
//   2. Start 1989 in der Oberliga, Lauf über den Saisonwechsel 1991/92: Verteilung nach migrate1991,
//      Heimatland danach Deutschland, Spielerliga korrekt, Mauerfall öffnet den Markt.
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { ddrTransferBlocker, isDdrClub, isDdrHome } from '../src/game/ddrHome';
import { homeCurrencyCc, currencyAt } from '../src/engine/economy';
import { playableCountries } from '../src/game/worldCompose';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { homeCountryOf, type Game } from '../src/game/state';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ui: DayUi = { onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {}, onCupDraw: () => false, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false } as DayUi;

let fails = 0;
const ok = (cond: unknown, msg: string) => { if (!cond) { fails++; console.log('  FEHLER', msg); } else console.log('  ok', msg); };
const tick = (g: Game) => { if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } } };
const runTo = (g: Game, iso: string) => { let n = 0; while (g.calendar.currentDate < iso && n++ < 420) tick(g); };
const runSeason = (g: Game) => { runTo(g, `${g.season.slice(0, 4)}-06-29`.replace(/^(\d{4})/, (y) => String(Number(y) + 1))); startNextSeason(g); };
const start = (club: string, year: number) => {
  const g = createNewGame({ managedClubId: club, manager: { name: 'Test', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, country: 'gdr' } as any);
  (g as any).simAutoManage = true;
  return g;
};
const name = (g: Game, id: string) => g.clubs[id]?.name ?? g.simClubs[id]?.name ?? id;
const fullOk = (g: Game) => g.table.rows.every((r) => (g.clubs[r.clubId]?.playerIds.length ?? 0) >= 16);

console.log('Assistent');
ok(playableCountries(1980).includes('gdr') && playableCountries(1990).includes('gdr') && !playableCountries(1991).includes('gdr'), 'DDR wählbar 1975–1990, ab 1991 nicht');
const lg = leaguesFor('gdr', 1980);
ok(lg.length === 2 && lg[0].name === 'DDR-Oberliga' && lg[1].name === 'DDR-Liga', `Ligen ${lg.map((l) => l.name).join(', ')}`);
ok(leaguePreview(lg[0].key, 'gdr', 1980).length === 14, `Oberliga 14 Vereine (${leaguePreview(lg[0].key, 'gdr', 1980).length})`);
ok(leaguePreview(lg[1].key, 'gdr', 1980).length >= 12, `DDR-Liga ${leaguePreview(lg[1].key, 'gdr', 1980).length} Vereine`);

for (const [club, league] of [['ddr-jena', 'DDR-Oberliga'], [leaguePreview('ddr-liga', 'gdr', 1980)[3].id, 'DDR-Liga']] as const) {
  console.log(`Start 1980 ${league} (${club})`);
  const g = start(club, 1980);
  ok(isDdrHome(g) && homeCountryOf(g) === 'ger', 'Markierung ddrHome, technisch Deutschland');
  ok(g.leagues.playerDivision.name === league, `Spielerliga ${g.leagues.playerDivision.name}`);
  ok(g.table.rows.every((r) => isDdrClub(g, r.clubId)), 'nur DDR-Vereine in der Spielerliga');
  ok(fullOk(g), 'volle Kader');
  ok(g.leagues.otherDivisions.some((d) => d.tier === 1) && g.leagues.otherDivisions.filter((d) => d.id.startsWith('ddr-')).length === 1, 'Bundesliga simuliert, andere DDR-Liga simuliert');
  ok(g.pointSystem === '2-point', 'Punkteregel 2 Punkte');
  ok(homeCurrencyCc() === 'gdr' && currencyAt(1980, '1980-08-01').unit === 'M', `Währung ${currencyAt(1980, '1980-08-01').name}`);
  const ownPlayers = g.clubs[club].playerIds.map((id) => g.players[id]);
  ok(ownPlayers.every((p) => p.nationality === 'GER'), 'keine Ausländer im Kader');
  const ec = g.euroCups?.ec?.participantIds ?? [];
  ok(ec.some((id) => isDdrClub(g, id)) && ec.some((id) => !!g.simClubs[id] && !isDdrClub(g, id)), `Europapokal: DDR- und BRD-Meister (${ec.filter((id) => g.clubs[id] || g.simClubs[id]).map((id) => name(g, id)).join(', ')})`);
  const west = g.leagues.otherDivisions.find((d) => d.tier === 1)!.clubIds[0];
  ok(!!ddrTransferBlocker(g, west, g.calendar.currentDate) && !ddrTransferBlocker(g, g.table.rows.find((r) => r.clubId !== club)!.clubId, g.calendar.currentDate), 'Westtransfers gesperrt, DDR-intern erlaubt');
  runSeason(g);
  ok(g.season === '1981/82' && isDdrHome(g), `Saisonwechsel → ${g.season} in ${g.leagues.playerDivision.name}`);
  ok(g.table.rows.some((r) => r.clubId === club) && fullOk(g), 'eigener Verein in der Spielerliga, volle Kader');
  ok(g.leagues.playerDivision.id.startsWith('ddr-') && g.leagues.otherDivisions.filter((d) => d.id.startsWith('ddr-')).length === 1, 'DDR-Ligen weiter getrennt');
  const ddrSizes = [g.table.rows.length, ...g.leagues.otherDivisions.filter((d) => d.id.startsWith('ddr-')).map((d) => d.clubIds.length)];
  ok(ddrSizes.every((n) => n >= 12 && n % 2 === 0), `DDR-Ligagrößen ${ddrSizes.join('/')}`);
  for (let i = 0; i < 40; i++) tick(g);
  // Speichern/Laden (wie test:season: JSON-Kopie + prepareLoadedGame)
  const copy = JSON.parse(JSON.stringify(g)) as Game;
  prepareLoadedGame(copy);
  ok(isDdrHome(copy) && homeCurrencyCc() === 'gdr' && copy.leagues.playerDivision.id === g.leagues.playerDivision.id && copy.leagues.otherDivisions.length === g.leagues.otherDivisions.length, 'Laden: DDR-Start, Währung, Ligen unverändert');
  // Weiterlauf wie test:season: laufender Stand mit denselben Nachrüstungen gegen geladenen Stand, gleicher Zufall.
  const ref = JSON.parse(JSON.stringify(g)) as Game;
  prepareLoadedGame(ref);
  const s0 = seed;
  for (let i = 0; i < 21; i++) tick(ref);
  const after1 = JSON.stringify({ t: ref.table.rows, d: ref.calendar.currentDate, o: ref.leagues.otherDivisions.map((d) => d.table.rows) });
  seed = s0;
  prepareLoadedGame(copy);
  for (let i = 0; i < 21; i++) tick(copy);
  ok(after1 === JSON.stringify({ t: copy.table.rows, d: copy.calendar.currentDate, o: copy.leagues.otherDivisions.map((d) => d.table.rows) }), 'nach dem Laden 21 Tage identisch weiter');
}

console.log('Start 1989 Oberliga → Wiedervereinigung');
{
  const g = start('ddr-dresden', 1989);
  runTo(g, '1989-11-20');
  const west = g.leagues.otherDivisions.find((d) => d.tier === 1)!.clubIds[0];
  ok(!ddrTransferBlocker(g, west, g.calendar.currentDate), 'nach dem Mauerfall: Westtransfers möglich');
  runSeason(g);
  ok(g.season === '1990/91' && isDdrHome(g), `1990/91 noch DDR (${g.leagues.playerDivision.name})`);
  ok(currencyAt(1990, '1990-08-01').unit === 'DM', 'Währungsunion: ab 1.7.1990 D-Mark');
  runTo(g, '1991-06-29');
  const ober = g.leagues.playerDivision.id === 'ddr-oberliga' ? g.table.rows.map((r) => r.clubId) : g.leagues.otherDivisions.find((d) => d.id === 'ddr-oberliga')!.table.rows.map((r) => r.clubId);
  const ownPos = ober.indexOf(g.managedClubId) + 1;
  startNextSeason(g);
  ok(g.season === '1991/92' && !isDdrHome(g) && homeCountryOf(g) === 'ger' && homeCurrencyCc() === 'ger', 'Heimatland Deutschland, Markierung weg');
  ok(g.appliedReforms.includes('reform-1991-reunification'), 'Reform 1991 angewandt');
  ok(!g.leagues.otherDivisions.some((d) => d.id.startsWith('ddr-')) && !g.leagues.playerDivision.id.startsWith('ddr-'), 'keine DDR-Ligen mehr');
  const tierOf = (id: string) => g.table.rows.some((r) => r.clubId === id) ? g.leagues.playerDivision.tier : g.leagues.otherDivisions.find((d) => d.clubIds.includes(id))?.tier;
  ok(ober.slice(0, 2).every((id) => tierOf(id) === 1), `Platz 1–2 in der 1. Liga (${ober.slice(0, 2).map((id) => name(g, id)).join(', ')})`);
  ok(ober.slice(2, 8).every((id) => tierOf(id) === 2), `Platz 3–8 in der 2. Liga`);
  ok(ober.slice(8).every((id) => tierOf(id) === 3), `Rest in der NOFV-Oberliga`);
  const want = ownPos <= 2 ? 1 : ownPos <= 8 ? 2 : 3;
  ok(g.leagues.playerDivision.tier === want && g.table.rows.some((r) => r.clubId === g.managedClubId), `eigener Verein (Platz ${ownPos}) spielt in ${g.leagues.playerDivision.name}`);
  ok(fullOk(g), 'volle Kader in der neuen Spielerliga');
  ok(g.table.rows.length === (want === 1 ? 20 : want === 2 ? g.table.rows.length : 18) && g.table.rows.length % 2 === 0, `Ligagröße ${g.table.rows.length}`);
  for (let i = 0; i < 60; i++) tick(g);
  runTo(g, '1992-06-29');
  startNextSeason(g);
  ok(g.season === '1992/93' && g.table.rows.some((r) => r.clubId === g.managedClubId), `1992/93 weiter in ${g.leagues.playerDivision.name}`);
}

console.log(fails ? `\n${fails} FEHLER` : '\nAlles ok');
process.exit(fails ? 1 : 0);
