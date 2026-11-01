// Jugendwettbewerbe ohne UI: Formate je Epoche (1976, 1990, 2005, 2010, 2015, 2025), Saison
// komplett simuliert, Tabellen konsistent, Bestenlisten = Tore, Archiv begrenzt, Migration
// mitten in der Saison, Saisonwechsel über processDay, Leistung des Tagesablaufs.
//   npm run test:youthcomp
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { Game } from '../src/game/state';
import { ensureYouthComps, migrateYouthComps, youthCompsDaily, youthCompsOf } from '../src/game/youthComps/daily';
import { archiveSeason, MAX_SEASONS } from '../src/game/youthComps/archive';
import { leagueTable } from '../src/game/youthComps/table';
import { ycOpts } from '../src/game/youthComps/sim';
import { youthCompOptions, youthSeasonOptions, youthSnapshot, myYouthStandings } from '../src/game/youthComps/view';
import { titlesOf } from '../src/game/clubRecords';
import { isoAdd } from '../src/data/youthCompetitions';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let failures = 0;
const check = (cond: unknown, msg: string) => { if (!cond) { failures++; console.error('FEHLER:', msg); } };

const make = (): Game => createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
} as any);

const label = (y0: number) => `${y0}/${String((y0 + 1) % 100).padStart(2, '0')}`;

/** Spielt die Jugendwettbewerbe einer Saison `y0` isoliert durch (ohne Profi-Tagesablauf). */
function runSeason(g: Game, y0: number): number {
  g.season = label(y0);
  g.calendar.seasonStartDate = `${y0}-07-01`;
  g.calendar.seasonEndDate = `${y0 + 1}-06-${y0 % 3 === 0 ? '05' : '28'}`; // auch frühes Saisonende prüfen
  g.pointSystem = y0 >= 1995 ? '3-point' : '2-point';
  delete (g as any).youthComps;
  const t0 = performance.now();
  ensureYouthComps(g, `${y0}-07-01`);
  for (let d = `${y0}-07-01`; d < g.calendar.seasonEndDate; d = isoAdd(d, 1)) { g.calendar.currentDate = d; youthCompsDaily(g, d); }
  return performance.now() - t0;
}

function verify(g: Game, y0: number, expect: Record<string, string | null>): void {
  const st = youthCompsOf(g)!;
  const tag = label(y0);
  for (const [k, fmt] of Object.entries(expect)) {
    const c = st.comps.find((x) => x.key === k);
    check(fmt ? c?.fmt === fmt : !c, `${tag}: ${k} Format ${fmt} (ist ${c?.fmt ?? '–'})`);
  }
  for (const c of st.comps) {
    check(c.done && !!c.winner, `${tag} ${c.key}: abgeschlossen mit Sieger`);
    let goals = 0;
    for (const l of c.leagues) {
      check(l.fx.every((f) => f[3] >= 0 && f[0] < g.calendar.seasonEndDate), `${tag} ${l.name}: alle Spiele vor Saisonende gespielt`);
      const t = leagueTable(l, c.pts);
      const n = l.clubs.length;
      check(t.every((r) => r.p === (c.key === 'uyl' && c.fmt === 'uyl3' ? 6 : 2 * (n - 1))), `${tag} ${l.name}: Spielzahl einheitlich`);
      check(t.reduce((a, r) => a + r.gf, 0) === t.reduce((a, r) => a + r.ga, 0), `${tag} ${l.name}: Tore = Gegentore`);
      check(t.every((r) => r.pts === r.w * c.pts + r.d), `${tag} ${l.name}: Punkte`);
      check(new Set(l.clubs).size === n, `${tag} ${l.name}: keine doppelten Vereine`);
      goals += l.fx.reduce((a, f) => a + f[3] + f[4], 0);
    }
    for (const rd of c.ko) {
      check(rd.drawn && rd.ties.length > 0 && rd.ties.every((t) => t.w && t.g.length === rd.legs), `${tag} ${c.key} ${rd.name}: ausgelost und entschieden`);
      check(rd.dates.every((d) => d < g.calendar.seasonEndDate), `${tag} ${c.key} ${rd.name}: Termin vor Saisonende`);
      goals += rd.ties.reduce((a, t) => a + t.g.reduce((s, x) => s + x[0] + x[1], 0), 0);
    }
    const ko0 = c.ko[0];
    if (ko0 && ['lv16', 'rl8', 'bl4', 'nwl'].includes(c.fmt)) check(ko0.ties.length * 2 === ({ lv16: 16, rl8: 8, bl4: 4, nwl: 16 } as any)[c.fmt], `${tag} ${c.key}: Endrunde vollständig`);
    if (c.fmt === 'cup64') check(c.ko[0].ties.length === 32, `${tag}: Pokal 64 Teilnehmer`);
    if (c.fmt === 'cup21') check(c.ko[0].ties.length === 5 && c.ko[1].ties.length === 8, `${tag}: Pokal 21 Teilnehmer (5 Vorrundenspiele)`);
    const statGoals = Object.values(st.stats[c.key] ?? {}).reduce((a, t) => a + t[1], 0);
    check(statGoals === goals, `${tag} ${c.key}: Torschützen (${statGoals}) = Tore (${goals})`);
    check(titlesOf(g, c.winner!).length > 0 || !!g.euroClubs?.[c.winner!], `${tag} ${c.key}: Titel in der Vereins-Historie`);
  }
  // Seite: jede Option liefert einen Schnappschuss
  for (const o of youthCompOptions(g, g.season)) check(!!youthSnapshot(g, g.season, o.key), `${tag}: Schnappschuss ${o.key}`);
  const ownGames = st.comps.reduce((a, c) => a + c.leagues.reduce((s, l) => s + l.fx.filter((f) => f[1] === 'mgl' || f[2] === 'mgl').length, 0), 0);
  console.log(`${tag}: ${st.comps.map((c) => `${c.key}=${c.fmt}(${c.leagues.length} L, ${c.ko.length} R) → ${c.winner}`).join(' · ')} · eigene Ligaspiele ${ownGames} · ${(JSON.stringify(st).length / 1024).toFixed(0)} KB`);
}

// 1) Formate je Epoche (ohne Ausdünnen der Statistik, damit Tore = Torschützen prüfbar ist)
ycOpts.prune = false;
const g = make();
(g as any).simAutoManage = true;
const times: number[] = [];
const epochs: [number, Record<string, string | null>][] = [
  [1976, { u19: 'lv16', u17: 'lv16', pokal: null, ddr: 'ddr', uyl: null }],
  [1990, { u19: 'lv16', u17: 'lv16', pokal: 'cup16', ddr: 'ddr', uyl: null }],
  [2005, { u19: 'bl4', u17: 'rl8', pokal: 'cup21', uyl: null }],
  [2010, { u19: 'bl4', u17: 'bl4', pokal: 'cup21', uyl: null }],
  [2015, { u19: 'bl4', u17: 'bl4', pokal: 'cup21', uyl: 'uyl2' }],
  [2025, { u19: 'nwl', u17: 'nwl', pokal: 'cup64', uyl: 'uyl3' }],
];
for (const [y0, exp] of epochs) { times.push(runSeason(g, y0)); verify(g, y0, exp); }
// UEFA Youth League 2013/14 (nur Gruppen + K.-o.) und 1999 (Regionalliga U19)
runSeason(g, 2013); verify(g, 2013, { uyl: 'uyl1', u19: 'bl4' });
runSeason(g, 1999); verify(g, 1999, { u19: 'rl8', u17: 'lv16', pokal: 'cup21' });

ycOpts.prune = true;
// 2) Archiv begrenzt + klein
{
  const st = youthCompsOf(g)!;
  const one = JSON.stringify(st.comps.length ? (archiveSeason(g, st), st.archive[st.archive.length - 1]) : {}).length;
  check(one < 16000, `Archiv je Saison klein (${one} Zeichen)`);
  for (let i = 0; i < MAX_SEASONS + 8; i++) { st.season = `x${i}`; archiveSeason(g, st); }
  check(st.archive.length === MAX_SEASONS, `Archiv begrenzt auf ${MAX_SEASONS} (ist ${st.archive.length})`);
  console.log(`Archiv: ${one} Zeichen je Saison, max. ${MAX_SEASONS} Saisons`);
}

// 3) Echte Saison über processDay + Saisonwechsel + Leistung
{
  const h = make();
  (h as any).simAutoManage = true;
  let guard = 0, total = 0;
  const t0 = performance.now();
  while (!CalendarEngine.isSeasonOver(h.calendar) && guard++ < 900) processDay(h, HEADLESS_UI);
  total = performance.now() - t0;
  check(youthCompsOf(h)!.comps.every((c) => c.done && c.winner), '1975/76 über processDay: alle Wettbewerbe beendet');
  // Jugend allein (gleiche Saison neu aufgesetzt) im Vergleich zum ganzen Tagesablauf
  const save = h.calendar.currentDate;
  const youthMs = runSeason(h, 1975);
  h.calendar.currentDate = save;
  console.log(`Leistung: Saison 1975/76 gesamt ${total.toFixed(0)} ms, davon Jugendwettbewerbe ≈ ${youthMs.toFixed(0)} ms (${((youthMs / total) * 100).toFixed(1)} %); Epochen je Saison ${times.map((t) => t.toFixed(0)).join('/')} ms`);
  check(youthMs / total < 0.12, 'Jugendwettbewerbe < 12 % des Tagesablaufs');
  startNextSeason(h);
  guard = 0;
  while (h.calendar.currentDate < '1976-07-03' && guard++ < 10) processDay(h, HEADLESS_UI);
  const st = youthCompsOf(h)!;
  console.log(`Spielstand: ${(JSON.stringify(h).length / 1e6).toFixed(2)} Mio. Zeichen, davon Jugendwettbewerbe ${(JSON.stringify(st).length / 1e3).toFixed(0)} Tsd.`);
  check(st.season === '1976/77' && st.archive.some((a) => a.season === '1975/76'), 'Saisonwechsel: Archiv 1975/76, neue Saison');
  check(youthSeasonOptions(h).length === 2, 'Saisonwahl: Archiv + laufend');
  const snap = youthSnapshot(h, '1975/76', 'u19:ko');
  check(snap?.rounds?.length === 4 && !!snap.winner && (snap.stats?.goals.length ?? 0) > 0, 'Archiv-Schnappschuss Endrunde mit Bestenliste');
  check(st.comps.some((c) => c.key === 'u17'), '1976/77: B-Jugend beginnt');
}

// 4) Migration: alter Spielstand mitten in der Saison
{
  const m = make();
  delete (m as any).youthComps;
  m.calendar.currentDate = '1976-02-15';
  migrateYouthComps(m);
  const st = youthCompsOf(m)!;
  const fx = st.comps.flatMap((c) => c.leagues.flatMap((l) => l.fx));
  check(fx.filter((f) => f[0] < '1976-02-15').every((f) => f[3] >= 0), 'Migration: vergangene Spieltage nachsimuliert');
  check(fx.filter((f) => f[0] >= '1976-02-15').every((f) => f[3] < 0), 'Migration: künftige Spieltage offen');
  migrateYouthComps(m);
  check(youthCompsOf(m) === st, 'Migration idempotent');
  check(myYouthStandings(m).some((s) => s.compKey === 'u19' && s.pos), 'Eigene Lage (Kategorie-Übersicht)');
}

if (failures) { console.error(`\n${failures} Fehler`); process.exit(1); }
console.log('\nJugendwettbewerbe: alle Prüfungen bestanden.');
