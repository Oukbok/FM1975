// =============================================================================
// Weltdaten-Test ohne UI (npm run test:world):
//  - Start in 1975/1985/1991/2000/2025 (Deutschland mit Weltdaten), Struktur/DDR/Punkte/Europapokal
//  - Rückfall ohne Daten (Deutschland ohne Weltdaten, Land ohne Daten nicht wählbar)
//  - ein anderes Land (England) eine ganze Saison + Saisonwechsel, Speichern/Laden
//  - Auslandsligen Spieltag für Spieltag (Spielplan, Tabelle, Begegnungen, Saisonende → Welt, ältere Spielstände)
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
import { leanDates, leanGames, leanMatchdays, leanPairs, leanTable, leanWinPts, worldLiveDiv } from '../src/game/worldLeagues';
import { leanCupDates, leanCupRounds, leanCupRoundsN, leanCupWinner } from '../src/game/worldCups';
import { leanCupScorers, leanScorers } from '../src/game/worldScorers';
import { countryMatchdays, countrySeasons, countrySnapshot, pickSeason, statsCountries } from '../src/game/competitionCountry';

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

// --- 5) Auslandsligen Spieltag für Spieltag (game/worldLeagues.ts) -----------------
{
  const g = start(2000, 'ger');
  ok(!g.leagues.otherDivisions.some((d) => d.tier >= 200), 'Auslandsligen: keine eigenen Divisionen mehr (schlanke Spieltag-Simulation)');
  // Spielplan: jeder gegen jeden, Hin- und Rückrunde mit getauschtem Heimrecht
  for (const n of [9, 10, 18, 22, 24]) {
    const total = leanMatchdays(n), seen = new Set<string>(), per = new Map<number, number>();
    let okDay = true;
    for (let md = 1; md <= total; md++) {
      const day = new Set<number>();
      for (const [h, a] of leanPairs(n, md)) { seen.add(`${h}>${a}`); if (day.has(h) || day.has(a)) okDay = false; day.add(h); day.add(a); per.set(h, (per.get(h) ?? 0) + 1); }
    }
    ok(okDay && seen.size === n * (n - 1) && [...per.values()].every((v) => v === n - 1), `Spielplan ${n} Vereine: ${total} Spieltage, jede Paarung einmal daheim und einmal auswärts`);
  }
  const dates = leanDates('2000/01', 46);
  ok(dates.every((d, i) => i === 0 || d > dates[i - 1]) && dates[0] >= '2000-08-13' && dates[45] <= '2001-06-03', `Termine 46 Spieltage: ${dates[0]} … ${dates[45]}, streng aufsteigend`);
  while (g.calendar.currentDate < '2000-11-20') tick(g);
  const eng = worldLiveDiv(g, 'England', 0)!, eng2 = worldLiveDiv(g, 'England', 1)!;
  ok(!!eng && !!eng2 && eng.md > 8 && eng.md < eng.n, `England läuft: Spieltag ${eng?.md} von ${eng?.n}, 2. Liga ${eng2?.md} von ${eng2?.n}`);
  const t = leanTable(eng, 'England', g.season);
  ok(t.every((r) => r.p === eng.md) && t.reduce((a, r) => a + r.gf, 0) === t.reduce((a, r) => a + r.ga, 0) && t.every((r, i) => i === 0 || r.pts <= t[i - 1].pts), 'England: Tabelle stimmig (Spiele, Tore, Reihenfolge)');
  ok(leanWinPts('England', '2000/01') === 3 && leanWinPts('England', '1975/76') === 2 && t[0].pts === t[0].w * 3 + t[0].d, 'England: Punkteregel des Landes (3 Punkte ab 1981)');
  const games = leanGames(eng, g.season, eng.md);
  ok(games.length === eng.ids.length * (eng.ids.length - 1) && games.filter((x) => x.hg != null).length === eng.md * Math.floor(eng.ids.length / 2) && games.filter((x) => x.hg == null).every((x) => x.date > g.calendar.currentDate),
    'England: Begegnungen – gespielte mit Ergebnis, kommende mit Termin in der Zukunft');
  const en = statsCountries(g).find((c) => c.cc === 'eng')!;
  const seasons = countrySeasons(g, en), cur = seasons.find((x) => x.season === g.season)!;
  const snap = countrySnapshot(g, en, g.season, cur.source, 'r1')!;
  ok(pickSeason(seasons, g.season) === g.season && snap.table!.length === eng.ids.length && !snap.placingsOnly && snap.table![0].clubId === t[0].clubId && snap.zones!.includes('zone-eu') && snap.zones!.at(-1) === 'zone-rel',
    'Statistiken › Liga: laufende englische Tabelle mit Punkten und Zonen');
  const md = countryMatchdays(g, en, g.season, 'r1')!;
  ok(md.res.length === eng.md * Math.floor(eng.ids.length / 2) && md.ptsWin === 3, 'Statistiken › Liga: Ergebnisse je Spieltag für Heim/Auswärts/Form');
  // Torschützen aus dem Spielerpool: Summe passt zu den Toren, die Liste wächst nur (frühere Tore bleiben beim selben Schützen)
  {
    const all = leanScorers(g, eng, g.season, 9999);
    const goals = t.reduce((a, r) => a + r.gf, 0);
    ok(all.length > 30 && all.reduce((a, r) => a + r.value, 0) === goals && all.every((r, i) => i === 0 || r.value <= all[i - 1].value), `Torschützen England: ${all.length} Schützen, Summe = ${goals} Tore, bester ${all[0]?.name} (${all[0]?.value})`);
    const pos = new Map(all.map((r) => [r.pid, r.pos]));
    const top10 = all.slice(0, 10);
    ok(top10.filter((r) => ['MS', 'HS', 'RA', 'LA', 'OM'].includes(pos.get(r.pid)!)).length >= 7 && !all.some((r) => r.pos === 'TW'), 'Torschützen: vor allem Angreifer, kein Torwart');
    const early = { ...eng, r: eng.r.slice(0, Math.floor(eng.ids.length / 2) * 2 * 5) };
    const e5 = new Map(leanScorers(g, early, g.season, 9999).map((r) => [r.pid, r.value]));
    ok([...e5].every(([pid, v]) => (all.find((r) => r.pid === pid)?.value ?? 0) >= v), 'Torschützen: Stand nach 5 Spieltagen ist im heutigen Stand enthalten');
    ok(snap.scorers!.length === 15 && snap.scorers![0].pid === all[0].pid, 'Statistiken › Liga: Torschützenliste der Auslandsliga');
  }
  // Landespokal mit echten Runden
  {
    const cup = g.world!.live!.cups!['England'];
    const rounds = leanCupRounds('England', g.season, cup);
    const n = leanCupRoundsN(cup.ids.length);
    const dates = leanCupDates(g.season, n);
    ok(!!cup && cup.ids.length >= 30 && dates.every((d, i) => i === 0 || d > dates[i - 1]) && new Date(dates[n - 1] + 'T00:00:00Z').getUTCDay() === 6, `Pokal England: ${cup.ids.length} Teilnehmer, ${n} Runden, Endspiel am Samstag ${dates[n - 1]}`);
    const done = rounds.filter((r) => r.played);
    ok(cup.rd === done.length && done.length >= 1 && done.every((r) => r.date <= g.calendar.currentDate) && rounds.filter((r) => !r.played).every((r) => r.date > g.calendar.currentDate), `Pokal: ${done.length} Runde(n) gespielt, nächste ausgelost und in der Zukunft`);
    const r0 = rounds[0];
    const inR0 = new Set([...r0.ties.flatMap((x) => [x.home, x.away]), ...r0.byes]);
    ok(inR0.size === cup.ids.length && r0.ties.every((x) => x.winner === x.home || x.winner === x.away) && r0.ties.every((x) => x.hg !== x.ag || x.dec === 2), '1. Runde: jeder Verein genau einmal (Spiel oder Freilos), jedes Spiel hat einen Sieger');
    const r1 = rounds[1];
    const next = new Set([...r0.ties.map((x) => x.winner!), ...r0.byes]);
    ok(!!r1 && [...r1.ties.flatMap((x) => [x.home, x.away]), ...r1.byes].every((id) => next.has(id)) && (r1.ties.length & (r1.ties.length - 1)) === 0 && r1.byes.length === 0, '2. Runde: nur Sieger und Freilose, Feld ist eine Zweierpotenz');
    ok(JSON.stringify(leanCupRounds('England', g.season, cup)) === JSON.stringify(rounds), 'Pokal: Auslosung ist fest (zweimal gelesen = gleich)');
    const cs = countrySnapshot(g, en, g.season, cur.source, 'xcup')!;
    ok(cs.kind === 'cup' && cs.rounds!.length === n && cs.rounds![0].ties.length === r0.ties.length && !cs.winners && cs.rounds!.at(-1)!.name === 'Finale' && !cs.rounds!.at(-1)!.drawn, 'Statistiken › Pokal: englischer Pokal mit Runden (Finale noch offen)');
    {
      // Elfmeterschießen: über alle Länder muss der Sieger mehr Treffer haben (2–5), Verlängerung = ein Tor Unterschied.
      let pens = 0, aet = 0, bad = 0;
      for (const [key, c] of Object.entries(g.world!.live!.cups!)) for (const r of leanCupRounds(key, g.season, c)) for (const x of r.ties) {
        if (!r.played) continue;
        if (x.dec === 2) { pens++; const [a, b] = x.pen!; if (x.hg !== x.ag || a === b || Math.max(a, b) > 5 || Math.min(a, b) < 2 || (a > b ? x.home : x.away) !== x.winner) bad++; }
        else if (x.dec === 1) { aet++; if (Math.abs(x.hg! - x.ag!) !== 1) bad++; }
        else if (x.hg === x.ag) bad++;
      }
      ok(pens > 5 && aet > 5 && bad === 0, `Pokale aller Länder: ${aet}× Verlängerung, ${pens}× Elfmeterschießen, Ergebnisse stimmig`);
    }
    {
      const sc = leanCupScorers(g, 'England', g.season, cup, 9999);
      const goals = rounds.flatMap((r) => r.ties).reduce((a, x) => a + (x.hg ?? 0) + (x.ag ?? 0), 0);
      ok(sc.length > 5 && sc.reduce((a, r) => a + r.value, 0) <= goals && cs.scorers!.length > 0 && cs.scorers![0].pid === sc[0].pid && (cs.clubStats?.gf?.length ?? 0) > 0, `Pokal: Torschützen (${sc[0].name}, ${sc[0].value}) und Vereinswerte aus den Runden`);
    }
  }
  const before = JSON.stringify(g.world!.live);
  ok(await saveGame('wl', { name: 'wl', managerName: 'w', clubName: 'w', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g), 'Auslandsligen: Speichern');
  const l = (await loadGame<Game>('wl'))!.game;
  prepareLoadedGame(l);
  ok(JSON.stringify(l.world!.live) === before, 'Auslandsligen: Laden lässt den Stand unverändert');
  // Älterer Spielstand mit „Spiel für Spiel“-Divisionen: werden abgelöst, die Saison bis heute nachgespielt
  l.fullCountries = ['eng']; l.fullAll = true;
  l.leagues.otherDivisions.push({ ...l.leagues.otherDivisions[0], id: 'x-eng-1', tier: 201, name: 'England 1. Liga' });
  l.world!.live = undefined;
  prepareLoadedGame(l);
  ok(!l.fullCountries && !l.fullAll && !l.leagues.otherDivisions.some((d) => d.tier >= 200) && worldLiveDiv(l, 'England', 0)!.md === eng.md, 'Älterer Spielstand: „Spiel für Spiel“-Divisionen abgelöst, Auslandsligen bis heute nachgespielt');
  playSeason(g);
  const fin = leanTable(worldLiveDiv(g, 'England', 0)!, 'England', g.season);
  ok(worldLiveDiv(g, 'England', 0)!.md === eng.n && fin.every((r) => r.p === eng.n), 'England: Saison komplett gespielt');
  const old = g.season;
  startNextSeason(g);
  const rec = g.world!.history.at(-1)!;
  ok(rec.season === old && rec.champions['England'] === fin[0].clubId, 'Saisonende: Meister der Spieltag-Simulation geht in die Welt (Europapokal)');
  ok(!!rec.divs?.['England']?.[0] && rec.divs['England'][0]!.r.length === eng.n * Math.floor(eng.ids.length / 2) * 2, 'Saisonende: Liga mit allen Ergebnissen in der Welt-Historie');
  const en2 = statsCountries(g).find((c) => c.cc === 'eng')!;
  const past = countrySnapshot(g, en2, old, 'world', 'w1')!;
  ok(past.table![0].clubId === fin[0].clubId && past.table![0].pts === fin[0].pts && countryMatchdays(g, en2, old, 'w1')!.res.length === eng.ids.length * (eng.ids.length - 1), 'Vorsaison: volle Abschlusstabelle und alle Begegnungen abrufbar');
  ok(worldLiveDiv(g, 'England', 0)!.md === 0 && g.world!.live!.season === g.season, 'Neue Saison: Auslandsligen starten bei Spieltag 0');
  {
    const oc = rec.cups?.['England'];
    const w = oc ? leanCupWinner('England', old, oc) : null;
    ok(!!oc && !!w && rec.cupWinners['England'] === w, `Saisonende: Pokalsieger ${w} aus dem ausgespielten Pokal geht in die Welt`);
    const pc = countrySnapshot(g, en2, old, 'world', 'xcup')!;
    ok(pc.winner === w && pc.rounds!.every((r) => r.drawn && r.ties.every((x) => x.winner)) && pc.rounds!.at(-1)!.ties.length === 1, 'Vorsaison: Pokal mit allen Runden abrufbar');
    ok((rec.scorers?.['England|0']?.length ?? 0) === 10 && past.scorers!.length === 10 && past.scorers![0].value >= past.scorers![9].value, `Vorsaison: Torschützenliste gespeichert (${rec.scorers?.['England|0']?.[0]?.[0]}, ${rec.scorers?.['England|0']?.[0]?.[3]} Tore)`);
    ok((rec.scorers?.['England|cup']?.length ?? 0) > 0 && pc.scorers!.length === rec.scorers!['England|cup'].length && pc.finals![0].winner === w, 'Vorsaison: Pokal-Torschützen und Siegerliste gespeichert');
    ok(g.world!.live!.cups!['England'].rd === 0, 'Neue Saison: neuer Pokal');
  }
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
