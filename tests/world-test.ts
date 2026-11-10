// =============================================================================
// Weltdaten-Test ohne UI (npm run test:world):
//  - Start in 1975/1985/1991/2000/2025 (Deutschland mit Weltdaten), Struktur/DDR/Punkte/Europapokal
//  - Rückfall ohne Daten (Deutschland ohne Weltdaten, Land ohne Daten nicht wählbar)
//  - ein anderes Land (England) eine ganze Saison + Saisonwechsel, Speichern/Laden
//  - Länder Spiel für Spiel (Divisionen, Endtabelle → Hintergrund-Europa)
//  - Editor-Änderung an Deutschland (Datensatz worldData) wirkt im neuen Spiel
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { saveGame, loadGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { builtinDataset } from '../src/data/dataset/builtin';
import { applyDataset } from '../src/data/dataset/apply';
import { CLUB_SEEDS } from '../src/data/generate';
import { builtinWorldData, registerCountryData, worldSeason } from '../src/data/world/index';
import { composeHome, playableCountries } from '../src/game/worldCompose';
import { getHomeOrigin } from '../src/data/origins';
import type { Game } from '../src/game/state';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; }, clear: () => store.clear(),
};
let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const ui: DayUi = { onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {}, onCupDraw: () => false, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
const tick = (g: Game) => { if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } } };
const mgr = { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'rookie' } as any;
const start = (year: number, country = 'ger', club?: string, extra: Record<string, unknown> = {}) => {
  const id = club ?? composeHome(country, year)?.tier1[2]?.id ?? 'fra';
  return createNewGame({ managedClubId: id, manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, country, ...extra } as any);
};
const playSeason = (g: Game) => { const end = `${Number(g.season.slice(0, 4)) + 1}-06-29`; for (let i = 0; i < 400 && g.calendar.currentDate < end; i++) tick(g); };
const divSizes = (g: Game) => [g.table.rows.length, ...g.leagues.otherDivisions.map((d) => d.clubIds.length)];

// --- 1) Standardstart 1975 bleibt wie bisher ---------------------------------
{
  const g = createNewGame({ managedClubId: 'fra', manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
  ok(g.season === '1975/76' && g.startYear === undefined && g.homeCountry === undefined, 'Standard: Saison 1975/76 ohne Startjahr-/Landfeld (alte Spielstände = 1975)');
  ok(Object.keys(g.clubs).filter((id) => !id.startsWith('am')).sort().join() === CLUB_SEEDS.map((s) => s.id).sort().join(), 'Standard: 1. Liga = Startvereine 1975 (Daten Deutschland 1975 = Seeds → alter Aufbau)');
  ok(g.leagues.otherDivisions.some((d) => d.id === 'tier2-nord') && g.leagues.otherDivisions.some((d) => d.id.startsWith('ddr-')), 'Standard: 2. Liga Nord/Süd + DDR');
}

// --- 2) Start in mehreren Jahren (Deutschland mit Weltdaten) -----------------
for (const y of [1985, 1991, 2000, 2025]) {
  const row = worldSeason('ger', y)!;
  const g = start(y);
  const t1 = (g.leagues.playerDivision.tier === 1 ? g.table.rows.map((r) => r.clubId) : g.leagues.otherDivisions.find((d) => d.tier === 1)!.clubIds);
  const expect = row.t1.slice(0, row.t1.length - (row.t1.length % 2));
  ok(g.season.startsWith(String(y)) && g.calendar.currentDate === `${y}-07-01`, `${y}: Saison ${g.season}, Start ${g.calendar.currentDate}`);
  ok(expect.every((id) => t1.includes(id)), `${y}: 1. Liga = Weltdaten (${t1.length} Vereine)`);
  ok(g.pointSystem === (y >= 1995 ? '3-point' : '2-point'), `${y}: Punkteregel ${g.pointSystem}`);
  ok(g.leagues.otherDivisions.some((d) => d.id.startsWith('ddr-')) === (y <= 1990), `${y}: DDR-Ligen ${y <= 1990 ? 'vorhanden' : 'aufgelöst'}`);
  ok(divSizes(g).every((n) => n % 2 === 0 && n >= 4), `${y}: alle Ligen gerade Größe (${divSizes(g).join('/')})`);
  const quals = Object.values(g.euroCups ?? {}).flatMap((c) => c?.participantIds ?? []).filter((id) => g.clubs[id] || g.simClubs[id]);
  const dataEuro = Object.values(row.euro ?? {}).flat().filter((id) => g.clubs[id] || g.simClubs[id]);
  ok(quals.length > 0 && (!dataEuro.length || dataEuro.some((id) => quals.includes(id))), `${y}: Europapokal-Starter aus den Daten (${quals.length})`);
  ok(g.world?.countries && Object.keys(g.world.countries).length > 10, `${y}: Hintergrund-Europa (${Object.keys(g.world!.countries).length} Länder)`);
  if (y >= 1993) ok(!g.world!.countries['Sowjetunion']?.active && !!g.world!.countries['Russland'], `${y}: Staatsteilungen vorweggenommen`);
  for (let i = 0; i < 30; i++) tick(g);
  ok(g.calendar.currentDate > `${y}-07-25`, `${y}: 30 Tage gelaufen (${g.calendar.currentDate})`);
  const lastPre = g.clubRecords ? Object.values((g as any).clubRecords.seasons ?? {}).flat().length : 0;
  if (y > 1980) ok(lastPre > 0, `${y}: Historie vor dem Start in der Vereins-Historie`);
}

// --- 3) Rückfall ohne Daten ---------------------------------------------------
{
  const saved = builtinWorldData().ger;
  registerCountryData('ger', [], {});
  const g = start(1988);
  ok(g.season === '1988/89' && Object.keys(g.clubs).some((id) => CLUB_SEEDS.some((s) => s.id === id)), 'ohne Daten: Deutschland 1988 mit Startvereinen 1975');
  ok(g.leagues.otherDivisions.some((d) => d.id === 'tier2'), 'ohne Daten: eingleisige 2. Liga nach Struktur 1988');
  registerCountryData('ger', saved.clubs, saved.seasons);
  ok(!playableCountries(1990).includes('ukr') && playableCountries(1990).includes('ger'), 'Land ohne Daten nicht wählbar, Deutschland immer');
}

// --- 4) England eine Saison (anderes Heimatland) ------------------------------
{
  const g = start(1985, 'eng');
  ok(g.homeCountry === 'eng' && getHomeOrigin() === 'eng', 'England: Heimatland gesetzt, Herkunft Einheimische = eng');
  const own = g.clubs[g.managedClubId];
  const engShare = own.playerIds.filter((p) => g.players[p]?.nationality === 'ENG').length / own.playerIds.length;
  ok(engShare > 0.6, `England: Kader überwiegend englisch (${Math.round(engShare * 100)} %)`);
  ok(g.pointSystem === '3-point', 'England 1985: 3-Punkte-Regel (seit 1981)');
  ok(!g.leagues.otherDivisions.some((d) => d.id.startsWith('ddr-')), 'England: keine DDR-Ligen');
  ok(!Object.values(g.euroCups ?? {}).some((c) => c?.participantIds.some((id) => g.clubs[id] && !id.startsWith('am'))), 'England 1985: Europapokal-Sperre (Heysel)');
  ok(!!g.world!.countries['Deutschland'] && !g.world!.countries['England'], 'England: Deutschland läuft im Hintergrund, England nicht doppelt');
  const sizes = divSizes(g);
  playSeason(g);
  ok(g.fixtures.every((m) => m.status === 'finished'), 'England: alle Ligaspiele gespielt');
  startNextSeason(g);
  ok(g.season === '1986/87' && divSizes(g).join() === sizes.join(), `England: Saisonwechsel, Ligagrößen gleich (${divSizes(g).join('/')})`);
  ok(g.pointSystem === '3-point' && g.appliedReforms.length > 0, 'England: keine deutschen Reformen, Punkteregel bleibt');
  ok(await saveGame('w', { name: 'w', managerName: 'w', clubName: 'w', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g), 'England: Speichern');
  const l = (await loadGame<Game>('w'))!.game;
  prepareLoadedGame(l);
  ok(l.homeCountry === 'eng' && getHomeOrigin() === 'eng', 'England: Laden stellt Heimatland wieder her');
  for (let i = 0; i < 40; i++) tick(l);
  ok(l.calendar.currentDate >= '1986-07-25', `England: geladener Stand läuft weiter (${l.calendar.currentDate})`);
}

// --- 5) Länder Spiel für Spiel ------------------------------------------------
{
  const g = start(2000, 'ger', undefined, { fullCountries: ['eng', 'ita'] });
  const xs = g.leagues.otherDivisions.filter((d) => d.id.startsWith('x-'));
  ok(xs.length === 4 && xs.every((d) => d.clubIds.length % 2 === 0), `Spiel für Spiel: ${xs.map((d) => `${d.name} ${d.clubIds.length}`).join(', ')}`);
  playSeason(g);
  const eng1 = g.leagues.otherDivisions.find((d) => d.id === 'x-eng-1')!;
  ok(eng1.table.rows.every((r) => r.played === (eng1.clubIds.length - 1) * 2), 'Spiel für Spiel: englische 1. Liga komplett gespielt');
  const champ = [...eng1.table.rows].sort((a, b) => a.position - b.position)[0].clubId;
  startNextSeason(g);
  ok(g.world!.history.at(-1)?.champions['England'] === champ, 'Spiel für Spiel: Meister geht in die Hintergrund-Welt (Europapokal)');
  ok(g.leagues.otherDivisions.filter((d) => d.id.startsWith('x-')).length === 4, 'Spiel für Spiel: Divisionen nach dem Saisonwechsel neu aufgebaut');
}

// --- 6) Editor-Änderung an Deutschland wirkt -----------------------------------
{
  const ds = builtinDataset();
  ds.meta = { id: 'welt-edit', name: 'Edit', created: '2026-11-05' };
  const ger = JSON.parse(JSON.stringify(ds.worldData!.ger));
  const club = ger.clubs.find((c: { id: string }) => c.id === 'fra');
  club.name = 'Testhausen Rot';
  ger.seasons[1990].t1 = [...ger.seasons[1990].t1];
  const out = ger.seasons[1990].t1.pop();
  const into = (ger.seasons[1990].t2 as string[]).find((id) => !ger.seasons[1990].t1.includes(id))!;
  ger.seasons[1990].t1.push(into);
  ds.worldData = { ...ds.worldData, ger };
  applyDataset(ds);
  const g1975 = createNewGame({ managedClubId: 'fra', manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
  ok(g1975.clubs.fra.name === 'Testhausen Rot', 'Editor: geänderter Name gilt für den Start 1975');
  const g90 = start(1990, 'ger', 'fra');
  const t1 = g90.table.rows.map((r) => r.clubId);
  ok(t1.includes(into) && !t1.includes(out!) && g90.clubs.fra.name === 'Testhausen Rot', `Editor: Saison 1990/91 umgestellt (${into} rein, ${out} raus)`);
  applyDataset(null);
  ok(CLUB_SEEDS.find((s) => s.id === 'fra')!.name !== 'Testhausen Rot', 'Editor: eingebauter Datensatz wiederhergestellt');
}

console.log(fails ? `\n${fails} Fehler` : '\nAlle Weltdaten-Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
