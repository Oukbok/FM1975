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
import { isLowKey, LOW_KEYS } from '../src/data/youthLowerLeagues';
import { setupSeason } from '../src/game/youthComps/setup';
import { isLocalClub } from '../src/game/youthComps/localClubs';
import { compClubName } from '../src/game/competitionView';

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
    if (c.fest) { check(c.done && !c.leagues.length && !c.ko.length, `${tag} ${c.key}: Spielfeste abgeschlossen, ohne Tabelle`); continue; }
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
    if (!isLowKey(c.key) || c.winner === 'mgl') check(titlesOf(g, c.winner!).length > 0 || !!g.euroClubs?.[c.winner!], `${tag} ${c.key}: Titel in der Vereins-Historie`);
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
  check(one < 18000, `Archiv je Saison klein (${one} Zeichen)`);
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
  check(youthCompsOf(h)!.comps.every((c) => c.done && (c.winner || c.fest)), `1975/76 über processDay: alle Wettbewerbe beendet (offen: ${youthCompsOf(h)!.comps.filter((c) => !c.done || !(c.winner || c.fest)).map((c) => c.key).join(',')})`);
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
  // Spielstände mit ganzen Spielerobjekten in youthComps werden gekürzt.
  const yp = Object.values(m.youthPlayers)[0];
  (st.people as any)[yp.id] = JSON.parse(JSON.stringify(yp));
  (st.stats as any).u19 = { ...(st.stats.u19 ?? {}), [yp.id]: JSON.parse(JSON.stringify(yp)) };
  migrateYouthComps(m);
  check(JSON.stringify(st.people[yp.id]) === JSON.stringify([yp.fullName, yp.clubId, yp.naturalPosition]), 'Migration: Spielerobjekt → [Name, Verein, Position]');
  check(!(st.stats.u19 ?? {})[yp.id], 'Migration: ungültiger Statistik-Eintrag entfernt');
  const leak = JSON.stringify(st).includes('"attributes"') || JSON.stringify(st).includes('"contract"');
  check(!leak, 'youthComps enthält keine Spielerobjekte');
  check(myYouthStandings(m).some((s) => s.compKey === 'u19' && s.pos), 'Eigene Lage (Kategorie-Übersicht)');
}

// 5) C- bis G-Jugend je Epoche: Staffel des eigenen Vereins bzw. Spielfeste ohne Tabelle
{
  ycOpts.prune = true;
  const L = make();
  (L as any).simAutoManage = true;
  // Erwartung: Art (stf/fest) und Spieler auf dem Feld je Klasse u15/u13/u11/u9/u7
  const expect: [number, string[], number[]][] = [
    [1976, ['stf', 'stf', 'stf', 'fest', 'fest'], [11, 11, 7, 0, 0]],
    [1995, ['stf', 'stf', 'stf', 'stf', 'fest'], [11, 11, 7, 7, 0]],
    [2010, ['stf', 'stf', 'stf', 'stf', 'fest'], [11, 11, 7, 7, 0]],
    [2025, ['stf', 'stf', 'fest', 'fest', 'fest'], [11, 9, 0, 0, 0]],
  ];
  for (const [y0, kinds, ns] of expect) {
    const ms = runSeason(L, y0);
    const st = youthCompsOf(L)!;
    const tag = label(y0);
    const kb = JSON.stringify(st).length;
    ycOpts.lower = false; const msA = runSeason(L, y0); const kbA = JSON.stringify(youthCompsOf(L)!).length; ycOpts.lower = true;
    runSeason(L, y0);
    const st2 = youthCompsOf(L)!;
    const lines: string[] = [];
    LOW_KEYS.forEach((k, i) => {
      const c = st2.comps.find((x) => x.key === k);
      check(c?.fmt === kinds[i], `${tag} ${k}: ${kinds[i]} (ist ${c?.fmt})`);
      if (!c) return;
      if (c.fmt === 'fest') {
        check(!c.leagues.length && (c.fest?.d.length ?? 0) >= 6, `${tag} ${k}: Spielfeste mit Terminen, keine Tabelle`);
        const snap = youthSnapshot(L, L.season, `${k}:fest`);
        check(!!snap?.fest && !snap.table && !!snap.fest.note, `${tag} ${k}: Seite zeigt Spielfest-Erklärung statt Tabelle`);
        check(Object.values(st2.stats[k] ?? {}).every((t) => t[1] === 0 && t[3] === 0), `${tag} ${k}: keine Tore/Karten bei Spielfesten`);
        const own = Object.keys(st2.stats[k] ?? {}).length;
        lines.push(`${k}: ${c.label} (${c.fest!.d.length} Feste, ${own} Kinder)`);
        return;
      }
      const l = c.leagues[0];
      check(c.n === ns[i], `${tag} ${k}: ${ns[i]} gegen ${ns[i]} (ist ${c.n})`);
      check(l.clubs[0] === 'mgl' && l.clubs.length >= 8, `${tag} ${k}: eigener Verein in der Staffel (${l.clubs.length} Teams)`);
      check(l.clubs.every((id) => compClubName(L, id, L.season) !== id), `${tag} ${k}: alle Teams mit Namen`);
      const names = l.clubs.map((id) => compClubName(L, id, L.season));
      check(new Set(names).size === names.length, `${tag} ${k}: keine doppelten Vereinsnamen`);
      const snap = youthSnapshot(L, L.season, `${k}:${l.id}`);
      check((snap?.table?.length ?? 0) === l.clubs.length && (snap?.stats?.goals.length ?? 0) > 0, `${tag} ${k}: Tabelle + Bestenliste auf der Seite`);
      const ownPlayers = Object.keys(st2.stats[k] ?? {}).filter((pid) => L.youthPlayers[pid]?.clubId === 'mgl');
      check(ownPlayers.length >= (c.n ?? 11) || !(L as any).youthTeamsReady, `${tag} ${k}: eigene Spieler mit Einsätzen (${ownPlayers.length})`);
      if (c.cls === 'E' || c.cls === 'F') check(Object.values(st2.stats[k] ?? {}).every((t) => t[3] === 0 && t[5] === 0), `${tag} ${k}: keine Karten im Kinderfußball`);
      const pos = leagueTable(l, c.pts).find((r) => r.clubId === 'mgl')?.pos;
      lines.push(`${k}: ${c.label}, ${c.play}, ${l.clubs.length} Teams (${l.clubs.filter(isLocalClub).length} Ortsvereine), Platz ${pos}`);
    });
    const opts = youthCompOptions(L, L.season);
    check(['C-', 'D-', 'E-', 'F-', 'G-'].every((p) => opts.some((o) => o.section.startsWith(p))), `${tag}: Auswahl enthält alle Klassen`);
    check(opts.findIndex((o) => o.section.startsWith('C-')) > opts.findIndex((o) => o.section.startsWith('B-')), `${tag}: Auswahl nach Jugend sortiert`);
    const tsd = myYouthStandings(L).filter((s) => isLowKey(s.compKey)).length;
    console.log(`${tag} C–G: ${lines.join(' | ')}`);
    console.log(`   Zeit Saison ${msA.toFixed(0)} → ${ms.toFixed(0)} ms, youthComps ${(kbA / 1024).toFixed(0)} → ${(kb / 1024).toFixed(0)} KB (Saisonende), eigene Lage ${tsd} Klassen`);
    check(kb - kbA < 60 * 1024, `${tag}: C–G kosten < 60 KB`);
  }
  // Auf-/Abstieg des eigenen Vereins
  {
    const st = youthCompsOf(L)!;
    runSeason(L, 1995);
    const st1 = youthCompsOf(L)!;
    const c = st1.comps.find((x) => x.key === 'u13')!;
    c.lvl = 1; st1.lvl!.u13 = 1;
    for (const f of c.leagues[0].fx) { if (f[1] === 'mgl') { f[3] = 5; f[4] = 0; } else if (f[2] === 'mgl') { f[3] = 0; f[4] = 5; } }
    const d = st1.comps.find((x) => x.key === 'u15')!;
    for (const f of d.leagues[0].fx) { if (f[1] === 'mgl') { f[3] = 0; f[4] = 9; } else if (f[2] === 'mgl') { f[3] = 9; f[4] = 0; } }
    const prev = st1.comps;
    L.season = label(1996);
    setupSeason(L, st1, prev);
    check(st1.lvl!.u13 === 0, 'D-Jugend: Staffelsieg in der unteren Klasse → Aufstieg');
    check(st1.lvl!.u15 === 1 && st1.comps.find((x) => x.key === 'u15')!.label.startsWith('Landesliga'), 'C-Jugend: Abstieg in die Landesliga');
    void st;
  }
  // Migration: Spielstand mit Jugendwettbewerben, aber ohne C–G → sofort in der laufenden Saison
  {
    const m = make();
    ycOpts.lower = false;
    delete (m as any).youthComps;
    m.calendar.currentDate = '1975-07-01';
    ensureYouthComps(m, '1975-07-01');
    ycOpts.lower = true;
    const st = youthCompsOf(m)!;
    delete st.low;
    check(!st.comps.some((c) => isLowKey(c.key)), 'Migration: Ausgangslage ohne C–G');
    for (let d = '1975-07-01'; d <= '1975-11-15'; d = isoAdd(d, 1)) { m.calendar.currentDate = d; youthCompsDaily(m, d); }
    m.calendar.currentDate = '1975-11-16';
    const before = JSON.stringify(st.comps.filter((c) => !isLowKey(c.key)));
    migrateYouthComps(m);
    const low = st.comps.filter((c) => isLowKey(c.key));
    check(low.length === 5 && st.low === 1, 'Migration: C–G in der laufenden Saison angelegt');
    const fx = low.flatMap((c) => c.leagues.flatMap((l) => l.fx));
    check(fx.filter((f) => f[0] < '1975-11-16').every((f) => f[3] >= 0) && fx.filter((f) => f[0] >= '1975-11-16').every((f) => f[3] < 0), 'Migration: vergangene C–F-Spieltage nachgeholt, künftige offen');
    check(JSON.stringify(st.comps.filter((c) => !isLowKey(c.key))) === before, 'Migration: A/B/Pokal unverändert');
    migrateYouthComps(m);
    check(st.comps.filter((c) => isLowKey(c.key)).length === 5, 'Migration C–G idempotent');
  }
}

if (failures) { console.error(`\n${failures} Fehler`); process.exit(1); }
console.log('\nJugendwettbewerbe: alle Prüfungen bestanden.');
