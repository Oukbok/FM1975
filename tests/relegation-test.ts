// Abstieg aus der untersten Liga ohne UI (game/relegationGame.ts):  npm run test:relegation
//  A) Deutschland 1975, 2. Liga, Teammanager: erzwungener letzter Platz → Hinweis, Spielende am Saisonwechsel,
//     kein Weiterspielen, Speichern/Laden behält das Spielende
//  B) Deutschland 2004, Regionalliga, Karriere: Entlassung mit Angeboten, Wahl, Wechsel zum 1. Juli, alter Verein
//     im Unterbau ohne Kader, halbe Saison weiter, Speichern/Laden, alter Verein kann wieder aufsteigen
//  C) DDR-Liga 1980, Simulation (Autopilot übernimmt einen anderen Verein der Liga)
//  D) England 1995, 4. Ebene, Teammanager: Spielende
//  E) 1. Liga: letzter Platz ist ein normaler Abstieg (kein Spielende); Warnungen/Zonen nur in der untersten Liga
// `ONLY=A,B` wählt Abschnitte, `DUMP_OVER=datei` schreibt den Stand aus A am Saisonende vor dem Abschluss (Screenshots: tests/gameover-shots.mjs).
import { writeFileSync } from 'node:fs';
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { saveGame, loadGame, SAVE_VERSION } from '../src/engine/save';
import { compressToUTF16 } from 'lz-string';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { chooseEventOption } from '../src/game/eventsGame';
import { ensureCareer } from '../src/game/careerState';
import { ownDropInfo, relegationWarning } from '../src/game/relegationGame';
import { seasonTasks } from '../src/game/seasonTasks';
import { clearPendingAwards } from '../src/game/seasonAwardsGame';
import { clearPendingGoldenBall } from '../src/game/goldenBallGame';
import { CalendarEngine } from '../src/engine/calendar';
import type { Game } from '../src/game/state';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; } };
let seed = 4711;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: unknown, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const on = (k: string) => !only || only.has(k);
const tick = (g: Game) => { if (!processDay(g, HEADLESS_UI)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, HEADLESS_UI); } } };
const runTo = (g: Game, iso: string) => { for (let i = 0; i < 1200 && g.calendar.currentDate < iso && !CalendarEngine.isSeasonOver(g.calendar) && !g.over; i++) tick(g); };
const seasonEnd = (_g: Game) => '9999-01-01'; // bis die Saison als beendet gilt
const name = (g: Game, id: string) => g.clubs[id]?.name ?? g.simClubs[id]?.name ?? id;
const inPyramid = (g: Game, id: string) => g.table.rows.some((r) => r.clubId === id) || g.leagues.otherDivisions.some((d) => d.clubIds.includes(id));
const forceLast = (g: Game) => { const c = g.clubs[g.managedClubId]; c.finances.ffp = { ...(c.finances.ffp ?? { warnings: 0 }), forcedRelegation: g.season }; };

function start(cc: string, year: number, tier: number, mode: 'manager' | 'career', pickAt = 0.5, leagueName?: string): Game {
  const lgs = leaguesFor(cc, year).filter((l) => l.tier === tier);
  const lg = lgs.find((l) => !leagueName || l.name === leagueName) ?? lgs[0];
  const prev = leaguePreview(lg.key, cc, year);
  const pick = prev[Math.floor(prev.length * pickAt)].id;
  return createNewGame({
    managedClubId: pick, manager: { name: 'Test Manager', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'ex_pro', startMode: mode } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, ...(year !== 1975 ? { startYear: year } : {}), ...(cc !== 'ger' ? { country: cc } : {}),
  } as any);
}

async function main(): Promise<void> {
  // ---------------------------------------------------------------------------
  if (on('A')) {
    console.log('\n== A) Deutschland 1975, 2. Liga, Teammanager ==');
    const g = start('ger', 1975, 2, 'manager');
    const own = g.managedClubId, pd = g.leagues.playerDivision;
    const info0 = ownDropInfo(g);
    ok(pd.tier === 2 && info0.lowest && info0.spots === 4, `${name(g, own)} in der ${pd.name}: unterste Ebene 1975, ${info0.spots} Abstiegsplätze`);
    const idsBefore = g.ids?.n;
    ownDropInfo(g);
    ok(g.ids?.n === idsBefore, 'Trockenlauf verbraucht keine laufenden Nummern');
    ok(/Ende deiner Amtszeit/.test(relegationWarning(g)) && /Spiel ist dann zu Ende/.test(relegationWarning(g)), `Warnsatz: ${relegationWarning(g)}`);
    ok(g.messages.some((m) => m.category === 'board' && /Ende deiner Amtszeit/.test(m.subject) && /rot markiert/.test(m.bodyText)), 'Nachricht des Vorstands zum Spielbeginn warnt');
    ok(seasonTasks(g).some((t) => t.id === 'abstieg-amtszeit'), 'Briefing-Aufgabe „Abstieg bedeutet das Ende deiner Amtszeit“');
    forceLast(g);
    ok(ownDropInfo(g).own, 'erzwungener letzter Platz zählt als Abstiegsplatz');
    runTo(g, seasonEnd(g));
    const c = ensureCareer(g);
    ok(c.releg?.season === '1975/76', `Stichtag nach dem letzten Ligaspiel: Amtszeit besiegelt am ${c.releg?.date}`);
    const note = g.messages.find((m) => /Deine Amtszeit bei/.test(m.subject));
    ok(!!note && !note.eventRef && /Spiel zu Ende/.test(note.bodyText), `Nachricht des Vorstands: „${note?.subject}“`);
    ok(g.messages.some((m) => /Abstiegsplatz: Deine Amtszeit/.test(m.subject)), 'Warnung des Vorstands während der Rückrunde');
    ok(CalendarEngine.isSeasonOver(g.calendar) && !g.over, 'Saison zu Ende gespielt, Spiel noch nicht beendet');
    if (process.env.DUMP_OVER) {
      // Stand am Saisonende vor dem Abschluss (tests/gameover-shots.mjs klickt „Abschluss“).
      const meta = { slot: 'sim', name: `${name(g, own)} · ${g.season}`, managerName: g.manager.name, clubName: name(g, own), clubId: own, season: g.season, gameDate: g.calendar.currentDate, savedAt: '1976-06-30T12:00:00.000Z', version: SAVE_VERSION };
      const copy = JSON.parse(JSON.stringify(g)) as Game; // ohne die im Test nie gezeigten Fenster (Gala, Ehrungen, Briefing, Budget)
      clearPendingAwards(copy); clearPendingGoldenBall(copy);
      if (copy.briefing) copy.briefing.pending = false;
      if (copy.budget) copy.budget.pending = false;
      writeFileSync(process.env.DUMP_OVER, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: copy })));
      console.log(`     Stand geschrieben: ${process.env.DUMP_OVER}`);
    }
    startNextSeason(g);
    const o = g.over;
    ok(!!o && g.season === '1975/76' && g.managedClubId === own, 'Saisonwechsel läuft nicht: Spielende markiert, Stand bleibt 1975/76');
    ok(!!o && o.seasons === 1 && o.record[0] + o.record[1] + o.record[2] >= 38 && o.pos === g.table.rows.length && o.rep > 0,
      `Karrierebilanz: ${o?.seasons} Saison, ${o?.record.slice(0, 3).join('-')}, ${o?.record[3]}:${o?.record[4]} Tore, Platz ${o?.pos}/${o?.size} ${o?.league}, Ansehen ${o?.rep}, beste Platzierung ${o?.best?.pos}. (${o?.best?.league})`);
    const date = g.calendar.currentDate;
    ok(processDay(g, HEADLESS_UI) === false && g.calendar.currentDate === date, 'kein Weiterspielen (processDay)');
    startNextSeason(g);
    ok(g.season === '1975/76', 'erneuter Saisonwechsel ändert nichts');
    ok(await saveGame('releg-a', { name: 'a', managerName: 'a', clubName: 'a', clubId: own, season: g.season, gameDate: date }, g), 'Speichern');
    const l = (await loadGame<Game>('releg-a'))!.game;
    prepareLoadedGame(l);
    ok(l.over?.clubId === own && l.over?.seasons === 1, 'Laden: Spielstand bleibt als beendet markiert');
  }

  // ---------------------------------------------------------------------------
  if (on('B')) {
    console.log('\n== B) Deutschland 2004, Regionalliga, Karriere ==');
    const g = start('ger', 2004, 3, 'career');
    const old = g.managedClubId, pd = g.leagues.playerDivision, oldName = name(g, old);
    const info0 = ownDropInfo(g);
    ok(pd.tier === 3 && info0.lowest && info0.spots === 4, `${oldName} in der ${pd.name}: unterste Ebene 2004, ${info0.spots} Abstiegsplätze`);
    ok(/neuen Verein/.test(relegationWarning(g)), 'Warnsatz nennt die Entlassung');
    forceLast(g);
    const rep0 = ensureCareer(g).rep;
    for (let i = 0; i < 1200 && !g.messages.some((m) => m.eventRef?.type === 'career_sacked'); i++) tick(g);
    const c = ensureCareer(g);
    const msg = g.messages.find((m) => m.eventRef?.type === 'career_sacked');
    ok(c.releg?.season === '2004/05' && !!msg && (msg.choices?.length ?? 0) >= 1 && c.rep < rep0, `Entlassung mit ${msg?.choices?.length} Angeboten (${msg?.choices?.map((x) => x.label).join(', ')}), Ansehen ${rep0} → ${c.rep}`);
    const drop = ownDropInfo(g).ids;
    ok(c.offers.every((x) => x.forced && !drop.includes(x.clubId) && g.table.rows.some((r) => r.clubId === x.clubId) && x.level <= c.rep + 12), 'Angebote: Vereine der Liga, die nicht absteigen, passend zum Ansehen');
    const choice = msg!.choices![Math.min(1, msg!.choices!.length - 1)];
    chooseEventOption(g, msg!, choice.id);
    const target = c.pendingMove?.clubId ?? '';
    ok(!!target && choice.label === c.pendingMove?.clubName, `Wahl: ${choice.label} zum 1. Juli`);
    runTo(g, '2005-06-25');
    ok(!!ensureCareer(g).pendingMove && ensureCareer(g).offers.length === 0, 'Zusage bleibt bis zum Saisonende gültig (migrateCareer räumt sie nicht ab)');
    runTo(g, seasonEnd(g));
    startNextSeason(g);
    ok(!g.over && g.season === '2005/06' && g.managedClubId === target, `Saison 2005/06 bei ${name(g, target)}`);
    ok(!g.clubs[old] && !!g.simClubs[old] && g.simClubs[old].tier === 9 && !inPyramid(g, old), `${oldName} ist im Unterbau (Pool-Verein ohne Kader, Ebene ${g.simClubs[old]?.tier})`);
    ok(!Object.values(g.players).some((p) => p.clubId === old), 'kein voller Spieler gehört mehr zum alten Verein');
    const my = g.clubs[g.managedClubId];
    ok(!!my && my.isPlayerControlled && my.playerIds.length >= 16 && g.table.rows.every((r) => (g.clubs[r.clubId]?.playerIds.length ?? 0) >= 15),
      `neue Spielerliga ${g.leagues.playerDivision.name}: ${g.table.rows.length} Vereine mit vollem Kader, eigener Kader ${my?.playerIds.length}`);
    ok(g.messages.some((m) => /Willkommen bei/.test(m.subject)) && ensureCareer(g).stints.length === 2 && ensureCareer(g).stints[0].end === 'entlassen', 'Karriere: zweite Station, erste endet mit Entlassung');
    ok(g.fixtures.filter((m) => m.involvesPlayerClub).length >= 30, 'Spielplan mit dem neuen Verein');
    runTo(g, '2005-12-15');
    const row = g.table.rows.find((r) => r.clubId === target)!;
    ok(row.played >= 14 && !g.over, `halbe Saison gespielt: ${row.played} Spiele, Platz ${row.position}`);
    ok(await saveGame('releg-b', { name: 'b', managerName: 'b', clubName: 'b', clubId: target, season: g.season, gameDate: g.calendar.currentDate }, g), 'Speichern');
    const l = (await loadGame<Game>('releg-b'))!.game;
    prepareLoadedGame(l);
    const playedBefore = l.table.rows.reduce((a, r) => a + r.played, 0);
    for (let i = 0; i < 60; i++) tick(l);
    ok(l.managedClubId === target && l.table.rows.reduce((a, r) => a + r.played, 0) > playedBefore && !l.over, `geladener Stand spielt weiter (${l.calendar.currentDate})`);
    // Wiederaufstieg: der alte Verein ist der stärkste Amateurverein seiner Region.
    (l as any).simAutoManage = true;
    l.simClubs[old].strength = 90;
    runTo(l, seasonEnd(l));
    startNextSeason(l);
    ok(inPyramid(l, old), `${oldName} steigt 2006/07 wieder auf (${l.clubs[old] ? l.leagues.playerDivision.name : l.leagues.otherDivisions.find((d) => d.clubIds.includes(old))?.name})`);
  }

  // ---------------------------------------------------------------------------
  if (on('C')) {
    console.log('\n== C) DDR-Liga 1980, Simulation mit Autopilot ==');
    const prev = leaguePreview('ddr-liga', 'gdr', 1980);
    const g = createNewGame({ managedClubId: prev[3].id, manager: { name: 'Test', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: 1980, country: 'gdr' } as any);
    (g as any).simAutoManage = true;
    const old = g.managedClubId, oldName = name(g, old);
    const info0 = ownDropInfo(g);
    ok(g.leagues.playerDivision.tier === 102 && info0.lowest && info0.spots === 2, `${oldName} in der DDR-Liga: ${info0.spots} Abstiegsplätze`);
    forceLast(g);
    runTo(g, seasonEnd(g));
    startNextSeason(g);
    ok(!g.over && g.season === '1981/82' && g.managedClubId !== old && !!g.clubs[g.managedClubId], `Autopilot übernimmt ${name(g, g.managedClubId)} (${g.leagues.playerDivision.name})`);
    ok(!g.clubs[old] && g.simClubs[old]?.tier === 109 && !inPyramid(g, old), `${oldName} in den Bezirksligen (Ebene ${g.simClubs[old]?.tier})`);
    ok(g.table.rows.every((r) => (g.clubs[r.clubId]?.playerIds.length ?? 0) >= 15), 'Spielerliga mit vollen Kadern');
    ok(ensureCareer(g).log.some((e) => /Autopilot/.test(e.text)), `Hinweis in der Chronik: ${ensureCareer(g).log.filter((e) => /Autopilot/.test(e.text)).map((e) => e.text).join(' | ')}`);
    runTo(g, '1981-09-30');
    ok(g.table.rows.find((r) => r.clubId === g.managedClubId)!.played >= 3, 'Simulation läuft weiter');
  }

  // ---------------------------------------------------------------------------
  if (on('D')) {
    console.log('\n== D) England 1995, 4. Ebene, Teammanager ==');
    const g = start('eng', 1995, 4, 'manager');
    const own = g.managedClubId;
    const info0 = ownDropInfo(g);
    ok(g.leagues.playerDivision.tier === 4 && info0.lowest && info0.spots >= 1, `${name(g, own)} in der ${g.leagues.playerDivision.name}: ${info0.spots} Abstiegsplätze`);
    forceLast(g);
    runTo(g, seasonEnd(g));
    ok(ensureCareer(g).releg?.season === '1995/96', 'Amtszeit besiegelt');
    startNextSeason(g);
    ok(!!g.over && g.over.league === g.leagues.playerDivision.name && g.season === '1995/96', `Spielende: ${g.over?.clubName}, Platz ${g.over?.pos}/${g.over?.size} ${g.over?.league}`);
  }

  // ---------------------------------------------------------------------------
  if (on('E')) {
    console.log('\n== E) 1. Liga: normaler Abstieg ==');
    const g = createNewGame({ managedClubId: 'boc', manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'ex_pro', startMode: 'manager' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
    const info = ownDropInfo(g);
    ok(!info.lowest && !info.spots && relegationWarning(g) === '', '1. Liga: keine Abstiegsplätze in den Unterbau, kein Warnsatz');
    ok(!seasonTasks(g).some((t) => t.id === 'abstieg-amtszeit') && !g.messages.some((m) => /Ende deiner Amtszeit/.test(m.bodyText)), 'keine Warnung in Briefing/Saisonziel');
    forceLast(g);
    runTo(g, seasonEnd(g));
    startNextSeason(g);
    ok(!g.over && g.managedClubId === 'boc' && g.leagues.playerDivision.tier === 2 && !ensureCareer(g).releg, `Abstieg in die ${g.leagues.playerDivision.name}, Spiel läuft weiter`);
    ok(ownDropInfo(g).lowest && g.messages.some((m) => /Saisonziel/.test(m.subject) && m.date >= '1976-07-01' && /Ende deiner Amtszeit/.test(m.bodyText)), 'jetzt in der untersten Liga: Saisonziel warnt');
  }

  console.log(fails ? `\n${fails} FEHLER` : '\nAlle Prüfungen bestanden.');
  process.exit(fails ? 1 : 0);
}
main();
