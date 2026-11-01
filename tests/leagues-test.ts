// Ligen & Pokale ohne UI: Historie 1963/64–1974/75 vollständig, historische Vereine
// existieren (Pool), Bestenlisten je Wettbewerb, Archiv wächst begrenzt, Saisonwechsel
// über N Saisons mit Tausch unterste Liga ↔ Pool (West und DDR), Migration alter Stände.
//   npm run test:leagues            (Standard 10 Saisons)
//   npm run test:leagues -- 3
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { Game } from '../src/game/state';
import { HISTORIC_SEASONS, historicDivisions, historicFinal } from '../src/data/history/seasons';
import { HIST_FOREIGN, HIST_TOP_SCORERS } from '../src/data/history/finals';
import { DDR_POOL_TIER, POOL_TIER, historicClubInfo } from '../src/data/history/historicClubs';
import { clubView } from '../src/game/clubProfile';
import { leagueArchive } from '../src/game/leagueArchive';
import { migrateLeaguePool, isPoolClub } from '../src/game/clubPool';
import { seasonsOf, titlesOf } from '../src/game/clubRecords';
import { compStatsOf } from '../src/engine/compStats';
import { buildSnapshot, competitionOptions, seasonOptions } from '../src/game/competitionView';

const seasons = Number(process.argv[2] ?? 10);
let seed = 1977;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let failures = 0;
const check = (cond: unknown, msg: string) => { if (!cond) { failures++; console.error('FEHLER:', msg); } };

const make = () => createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
} as any);

// 1) Historie vollständig
check(HISTORIC_SEASONS.length === 12 && HISTORIC_SEASONS[0] === '1963/64' && HISTORIC_SEASONS[11] === '1974/75', 'Historie 1963/64–1974/75');
const g = make();
(g as any).simAutoManage = true;
const known = (id: string) => !!g.clubs[id] || !!g.simClubs[id] || id.startsWith('eu_') || !!HIST_FOREIGN[id];
for (const s of HISTORIC_SEASONS) {
  const divs = historicDivisions(s);
  const bl = divs.find((d) => d.tier === 1)!;
  check(bl && bl.rows.length === (Number(s.slice(0, 4)) < 1965 ? 16 : 18), `${s}: Bundesliga-Größe`);
  check(divs.some((d) => d.tier === 101 && d.rows.length === 14), `${s}: DDR-Oberliga`);
  for (const d of divs) {
    const games = new Set(d.rows.map((r) => r[1] + r[2] + r[3]));
    check(games.size === 1, `${s} ${d.name}: Spielzahl einheitlich`);
    check(d.rows.reduce((a, r) => a + r[4], 0) === d.rows.reduce((a, r) => a + r[5], 0), `${s} ${d.name}: Tore = Gegentore`);
    for (const r of d.rows) {
      check(r[6] === 2 * r[1] + r[2] - (r[7] ?? 0), `${s} ${d.name} ${r[0]}: Punkte`);
      check(known(r[0]), `${s} ${d.name}: Verein ${r[0]} fehlt im Spiel`);
      check(clubView(g, r[0], 1970).name !== r[0], `${s}: Name für ${r[0]}`);
    }
  }
  for (const k of ['cup', 'ec', 'cwc', 'uefa'] as const) {
    const f = historicFinal(s, k);
    check(!!f, `${s}: Endspiel ${k}`);
    if (f) { check(known(f.winner) && known(f.runnerUp), `${s} ${k}: Finalisten bekannt`); }
  }
  check(!!HIST_TOP_SCORERS[s], `${s}: Torschützenkönig`);
}
check(historicDivisions('1974/75').filter((d) => d.tier === 2).length === 2, '2. Liga 1974/75 Nord/Süd');
console.log(`Historie: ${HISTORIC_SEASONS.length} Saisons geprüft`);

// 2) Historische Vereine im neuen Spiel: Liga-Stufe 1975/76
const tierOf = (id: string) => g.clubs[id] ? g.leagues.playerDivision.tier : g.simClubs[id]?.tier;
for (const [id, tier] of [['n_dor', 2], ['n_tebe', 2], ['n_wup', 2], ['n_aac', 2], ['n_mun', 2], ['s_saa', 2], ['s_muc', 2], ['s_vfb', 2],
  ['kar', 1], ['ber', 1], ['off', 1], ['dui', 1], ['h_rwo', POOL_TIER], ['h_neu', POOL_TIER], ['h_tas', POOL_TIER], ['h_wob', POOL_TIER],
  ['ddr-aue', 101], ['ddr-zwickau', 101], ['ddr-rostock', 102], ['ddr-stralsund', DDR_POOL_TIER]] as [string, number][]) {
  check(tierOf(id) === tier, `1975/76: ${id} auf Ebene ${tier} (ist ${tierOf(id)})`);
}
check(!!historicClubInfo('h_tas'), 'Register kennt Berlin Neukölln');
// Vereins-Historie vorbefüllt
check(titlesOf(g, 'muc').filter((t) => t.kind === 'meister').length === 4, 'München Rot: 4 Meistertitel bis 1975');
check(titlesOf(g, 'muc').some((t) => t.kind === 'ec' && t.season === '1974/75'), 'München Rot: Landesmeister 1975');
check(titlesOf(g, 'ddr-magdeburg').some((t) => t.kind === 'cwc'), 'Magdeburg: Pokalsieger-Cup 1974');
check(seasonsOf(g, 'h_tas').length === 1 && seasonsOf(g, 'h_tas')[0].pos === 18, 'Berlin Neukölln: Platz 18 1965/66');
check(seasonsOf(g, 'h_rwo').length === 5, 'Oberhausen: 4 Bundesliga-Saisons + 2. Liga 1974/75');
// Auswahl der Saisons
const opts = seasonOptions(g);
check(opts[0].season === '1963/64' && opts.some((o) => o.season === '1975/76' && o.source === 'live'), 'Saisonwahl: Historie + laufend');
const h = buildSnapshot(g, '1968/69', 'tier1');
check(h?.kind === 'league' && h.table?.length === 18 && h.table[0].clubId === 'muc', 'Schnappschuss 1968/69');
const hc = buildSnapshot(g, '1969/70', 'cup');
check(hc?.kind === 'cup' && hc.rounds?.[0].ties[0].winner === 'off', 'Pokal 1969/70: Offenbach');

// 3) Saisons durchspielen
let lastArchive = 0;
let poolUps = 0;
let ddrSwaps = 0;
for (let i = 0; i < seasons; i++) {
  const season = g.season;
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 500) processDay(g, HEADLESS_UI);
  // Bestenlisten vorhanden (laufende Saison)
  const withL = Object.values(g.players).filter((p) => (compStatsOf(p)?.L?.[0] ?? 0) > 0).length;
  check(withL > 200, `${season}: Ligastatistik je Spieler (${withL})`);
  const snapL = buildSnapshot(g, season, g.leagues.playerDivision.id);
  check((snapL?.stats?.goals?.length ?? 0) >= 5, `${season}: Torschützenliste`);
  check((snapL?.stats?.clean?.length ?? 0) >= 1, `${season}: Weiße Weste`);
  check((snapL?.stats?.red?.length ?? 0) >= 1, `${season}: Rote Karten (inkl. Gelb-Rot)`);
  const cupSnap = buildSnapshot(g, season, 'cup');
  check((cupSnap?.stats?.goals?.length ?? 0) >= 1, `${season}: Pokal-Torschützen`);
  const lowest = Math.max(...g.leagues.otherDivisions.filter((d) => d.tier < 100).map((d) => d.tier), g.leagues.playerDivision.tier);
  const lowIds = new Set(g.leagues.otherDivisions.filter((d) => d.tier === lowest).flatMap((d) => d.clubIds));
  const ddrLiga = new Set(g.leagues.otherDivisions.find((d) => d.tier === 102)?.clubIds ?? []);
  startNextSeason(g);
  const arch = leagueArchive(g)!;
  check(arch.seasons.length === lastArchive + 1, `${season}: Archiv +1`);
  lastArchive = arch.seasons.length;
  const a = arch.seasons[arch.seasons.length - 1];
  check(a.season === season && a.divisions.length >= 3 && a.cups.cup?.winner, `${season}: Archiv vollständig`);
  check(Object.keys(compStatsOf(Object.values(g.players)[0]) ?? {}).length === 0, `${season}: Wettbewerbsstatistik geleert`);
  for (const list of Object.values(a.stats)) for (const l of Object.values(list)) check(l!.length <= 10, `${season}: Top-N begrenzt`);
  const size = JSON.stringify(a).length;
  check(size < 16000, `${season}: Archiv-Eintrag ${size} Byte`);
  // Tausch: neue Vereine in der untersten Liga kommen aus dem Pool
  const newLow = g.leagues.otherDivisions.filter((d) => d.tier === lowest).flatMap((d) => d.clubIds);
  const fromPool = newLow.filter((id) => !lowIds.has(id) && arch.seasons.every((s) => !s.divisions.some((d) => d.tier < lowest && d.rows.some((r) => r[0] === id))));
  poolUps += fromPool.length;
  const ddrNow = g.leagues.otherDivisions.find((d) => d.tier === 102)?.clubIds ?? [];
  ddrSwaps += ddrNow.filter((id) => !ddrLiga.has(id)).length;
  const pool = Object.values(g.simClubs).filter(isPoolClub);
  check(pool.length >= 15, `${season}: Pool nicht leer (${pool.length})`);
  for (const d of g.leagues.otherDivisions) check(d.clubIds.every((id) => g.simClubs[id] && !isPoolClub(g.simClubs[id])), `${g.season}: ${d.name} ohne Pool-Vereine`);
  console.log(`${season} → ${g.season}: Archiv ${size} B, Pool ${pool.length}, Aufsteiger aus Pool ${fromPool.length}, Meister ${a.divisions[0].rows[0][0]}`);
}
check(poolUps >= Math.min(seasons, 3) * 4, `Pool-Aufsteiger insgesamt ${poolUps}`);
check(seasons < 2 || ddrSwaps >= 4, `DDR-Auf-/Abstieg ${ddrSwaps}`);
const total = JSON.stringify(leagueArchive(g)).length;
console.log(`Archiv gesamt ${(total / 1024).toFixed(1)} KB für ${lastArchive} Saisons`);
const comps = competitionOptions(g, g.season);
check(comps.some((c) => c.key === 'cup') && comps.some((c) => c.key === 'tier1'), 'Wettbewerbe der laufenden Saison');
const past = seasonOptions(g).find((o) => o.source === 'archive');
if (past) {
  const snap = buildSnapshot(g, past.season, 'tier1');
  check(snap?.table?.length === 18 && (snap.stats?.goals?.length ?? 0) > 0, 'Archiv-Saison mit Tabelle und Bestenliste');
  const cs = buildSnapshot(g, past.season, 'cup');
  check((cs?.rounds?.length ?? 0) >= 4, 'Archiv-Pokal mit Runden');
}

// 4) Alter Spielstand: Pool + Historie nachrüsten (idempotent)
const old = make() as Game & { leagueArchive?: unknown; clubRecords?: unknown };
for (const id of Object.keys(old.simClubs)) if (isPoolClub(old.simClubs[id]) || ['ddr-aue', 'ddr-zwickau'].includes(id)) delete old.simClubs[id];
delete old.leagueArchive; delete old.clubRecords;
migrateLeaguePool(old);
migrateLeaguePool(old);
check(old.simClubs.h_rwo?.tier === POOL_TIER && old.simClubs['ddr-aue']?.tier === DDR_POOL_TIER, 'Migration: Pool ergänzt');
check(titlesOf(old, 'muc').filter((t) => t.kind === 'meister').length === 4, 'Migration: Titel genau einmal');

if (failures) { console.error(`${failures} Fehler`); process.exit(1); }
console.log('test:leagues OK');
