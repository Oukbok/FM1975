// Winter-Test ohne UI: Hallenfußball (Einladungsturniere, Tour, Masters, Ende)
// und Trainingslager (Freischaltung je Epoche, Buchung, Wirkung, KI-Lager).
//   npm run test:winter
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { Game } from '../src/game/state';
import { CalendarEngine } from '../src/engine/calendar';
import { allTournaments, indoorDaily, setOwnIndoorDecision } from '../src/game/indoorGame';
import { bookCamp, cancelCamp, ownBooking, quoteCamp } from '../src/game/trainingCampGame';
import { campState, indoorState, migrateWinter, ownCampDays, winterWindow } from '../src/game/winterShared';
import { destinationsFor } from '../src/engine/trainingCamp';
import { CAMP_DESTINATIONS } from '../src/data/campDestinations';
import { INDOOR_LAST_WINTER, MASTERS_LAST_WINTER, indoorPhase } from '../src/data/indoorHistory';
import { runIndoorTournament } from '../src/engine/indoor';
import { chooseEventOption } from '../src/game/eventsGame';
import { titlesOf } from '../src/game/clubRecords';

let seed = 1991;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
function fresh(): Game {
  return createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}

// 1) Trainingslager-Ziele je Epoche
const ok = (season: 'summer' | 'winter', year: number, rep: number, id: string) =>
  destinationsFor(season, year, rep).find((x) => x.d.id === id)?.status.ok ?? false;
const expect = (cond: boolean, msg: string) => { if (!cond) fail(msg); };
expect(ok('summer', 1975, 50, 'sportschule') && ok('summer', 1975, 50, 'tegernsee'), 'Sportschule/Voralpen 1975 nicht buchbar');
expect(!ok('summer', 1976, 90, 'tirol') && ok('summer', 1977, 50, 'tirol'), 'Österreich-Freischaltung falsch');
expect(!ok('winter', 1979, 90, 'kanaren') && ok('winter', 1980, 50, 'kanaren'), 'Kanaren-Freischaltung falsch');
expect(!ok('winter', 1991, 99, 'tuerkei'), 'Türkei vor 1992');
expect(ok('winter', 1992, 75, 'tuerkei') && !ok('winter', 1992, 60, 'tuerkei') && ok('winter', 1996, 40, 'tuerkei'), 'Türkei-Stufen falsch');
expect(!ok('winter', 1991, 99, 'florida') && ok('winter', 1992, 80, 'florida'), 'Florida-Freischaltung falsch');
expect(!ok('winter', 1983, 99, 'dubai') && ok('winter', 1984, 90, 'dubai') && !ok('winter', 1984, 80, 'dubai'), 'VAE der 80er nur für die Größten');
for (let y = 1975; y <= 2010; y++) expect(!ok('winter', y, 100, 'katar'), `Katar schon ${y}`);
expect(ok('winter', 2011, 90, 'katar') && !ok('winter', 2011, 75, 'katar'), 'Katar 2011 nur für Spitzenvereine');
expect(!ok('winter', 2021, 99, 'katar') && !ok('winter', 2022, 99, 'katar') && ok('winter', 2023, 99, 'katar'), 'Corona-Sperre Katar');
expect(!ok('summer', 2014, 99, 'asien') && ok('summer', 2015, 90, 'asien'), 'Asien-Reise vor 2015');
expect(!ok('summer', 2013, 99, 'usatour') && ok('summer', 2014, 90, 'usatour'), 'USA-Tour vor 2014');
expect(!ok('summer', 1980, 90, 'kanaren') && !ok('winter', 1990, 90, 'tegernsee'), 'Saisonbindung der Ziele falsch');
const unlocked = (y: number) => CAMP_DESTINATIONS.filter((d) => d.seasons.some((s) => ok(s, y, 100, d.id))).map((d) => d.id);
console.log(`Ziele (Spitzenverein): 1975 ${unlocked(1975).join('/')} | 1992 ${unlocked(1992).join('/')} | 2011 ${unlocked(2011).join('/')} | 2021 ${unlocked(2021).join('/')}`);

// 2) Hallen-Phasen
expect(indoorPhase(1976) === 'invitational' && indoorPhase(1987) === 'invitational', 'Vorläufer-Phase');
expect(indoorPhase(1988) === 'masters' && indoorPhase(MASTERS_LAST_WINTER) === 'masters', 'Masters-Phase');
expect(indoorPhase(2002) === 'regional' && indoorPhase(INDOOR_LAST_WINTER) === 'regional', 'Auslauf');
for (let y = INDOOR_LAST_WINTER + 1; y <= 2060; y++) expect(indoorPhase(y) === 'none', `Hallenturniere nach dem Endjahr (${y})`);

// Simulationskern: viele Tore, sinnvolle Platzierung
{
  let goals = 0, games = 0, strongWins = 0;
  for (let i = 0; i < 300; i++) {
    let s = i + 1; const rng = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const r = runIndoorTournament([{ id: 'a', strength: 80 }, { id: 'b', strength: 70 }, { id: 'c', strength: 68 }, { id: 'd', strength: 66 }, { id: 'e', strength: 64 }, { id: 'f', strength: 60 }], 2, rng);
    if (r.ranking.length !== 6 || new Set(r.ranking).size !== 6) fail('Ranking unvollständig');
    for (const m of r.matches) { goals += m.ga + m.gb; games++; }
    if (r.ranking[0] === 'a') strongWins++;
  }
  const avg = goals / games;
  console.log(`Hallenspiel: Ø ${avg.toFixed(1)} Tore/Spiel, Favorit gewinnt ${Math.round(strongWins / 3)} % der Turniere`);
  expect(avg > 3.5 && avg < 9, 'Torzahl in der Halle unplausibel');
  expect(strongWins > 60 && strongWins < 240, 'Favoritenquote unplausibel');
}

// 3) Hallensaison 1990/91 komplett (Tour + Masters) – Winterablauf direkt über indoorDaily
function runWinter(g: Game, season: string, beforeEachDay?: (d: string) => void): void {
  g.season = season;
  const y0 = Number(season.slice(0, 4));
  let d = `${y0}-10-30`;
  while (d <= `${y0 + 1}-01-20`) {
    g.calendar.currentDate = d;
    beforeEachDay?.(d);
    indoorDaily(g, d);
    d = CalendarEngine.addDays(d, 1);
  }
}
{
  const g = fresh();
  migrateWinter(g);
  const own = g.clubs[g.managedClubId];
  const bal0 = own.finances.balance;
  let decided = false;
  runWinter(g, '1990/91', (d) => {
    const cur = indoorState(g).current;
    if (!cur || decided || !cur.tournaments.length) return;
    decided = true;
    const mine = cur.tournaments.filter((t) => t.own === null);
    if (mine.length < 2) fail(`zu wenige Einladungen 1990/91 (${mine.length})`);
    // Erste Einladung über die Nachricht (Auswahl-Handler), zweite absagen.
    const msg = g.messages.find((m) => m.eventRef?.type === 'indoor_invite' && m.eventRef.data?.tid === mine[0].id);
    if (!msg) fail('Einladungsnachricht fehlt');
    chooseEventOption(g, msg, 'youth');
    if (mine[0].own !== 'youth') fail('Auswahl in der Nachricht kam nicht an');
    setOwnIndoorDecision(g, mine[1].id, 'decline');
    void d;
  });
  const st = indoorState(g);
  const cur = st.current!;
  expect(cur.phase === 'masters' && cur.winterYear === 1991, 'Phase 1990/91');
  expect(cur.tournaments.length === 16 && cur.tournaments.every((t) => t.done && t.clubIds.length === 6), 'Tour 1990/91 nicht vollständig');
  expect(!!cur.masters?.done && cur.masters.clubIds.length === 8, 'Masters 1991 nicht gespielt');
  const fin = cur.masters!.result!.matches.find((m) => m.stage === 'F')!;
  const h = st.history.find((x) => x.year === 1991);
  expect(!!h?.mastersWinner && h.mastersWinner === cur.masters!.result!.ranking[0], 'Masters-Sieger nicht in der Historie');
  expect(titlesOf(g, h!.mastersWinner!).some((t) => t.kind === 'halle'), 'Masters-Titel fehlt in der Vereinshistorie');
  expect((cur.tour ?? []).length >= 20, 'Tour-Wertung zu klein');
  expect(!cur.tournaments.some((t) => t.result!.ranking.includes(g.managedClubId) && t.own === 'decline'), 'abgesagtes Turnier trotzdem gespielt');
  expect(st.snub >= 0 && own.finances.balance !== bal0, 'keine Buchungen/Verärgerung');
  const injured = Object.values(g.players).filter((p) => p.injury?.description.includes('Halle') || p.injury?.description.includes('Bande')).length;
  console.log(`Halle 1990/91: 16 Turniere, Masters ${cur.masters!.city}: ${g.clubs[fin.a]?.shortName ?? fin.a} – ${g.clubs[fin.b]?.shortName ?? fin.b} ${fin.ga}:${fin.gb}${fin.pa != null ? ` (${fin.pa}:${fin.pb} n. N.)` : ''}, Sieger ${g.clubs[h!.mastersWinner!]?.name ?? h!.mastersWinner}, abgesagt: ${cur.mastersDeclined?.length ?? 0}, Hallenverletzte ${injured}, eigenes Konto ${Math.round((own.finances.balance - bal0) / 1000)}k, Verärgerung ${st.snub}`);

  // 4) Kein Hallenfußball nach dem Endjahr, Auslauf ohne Masters
  runWinter(g, '2001/02');
  expect(indoorState(g).current!.phase === 'regional' && !indoorState(g).current!.masters, '2002 ohne Masters');
  runWinter(g, `${INDOOR_LAST_WINTER - 1}/${String(INDOOR_LAST_WINTER % 100).padStart(2, '0')}`);
  expect(indoorState(g).current!.tournaments.length > 0, 'Auslauf-Turniere fehlen');
  for (const s of ['2004/05', '2010/11', '2025/26']) {
    runWinter(g, s);
    const c = indoorState(g).current!;
    expect(c.phase === 'none' && allTournaments(c).length === 0, `Hallenturniere in ${s}`);
  }
}

// 5) Integration über processDay: Saison 1975/76 (Einladungsturniere) + Trainingslager
{
  const g = fresh();
  const own = g.clubs[g.managedClubId];
  const err = bookCamp(g, 'katar', 'winter', '1975-12-10', 7, 1);
  expect(!!err, 'Katar 1975 buchbar');
  expect(!!quoteCamp(g, 'sportschule', 'summer', '1975-07-03', 7).error, 'Vorlauf von 7 Tagen nicht geprüft');
  const e1 = bookCamp(g, 'tegernsee', 'summer', '1975-07-14', 8, 2);
  if (e1) fail(`Sommerlager nicht buchbar: ${e1}`);
  expect(!!ownBooking(g, 'summer'), 'Buchung fehlt');
  expect(!!bookCamp(g, 'sportschule', 'summer', '1975-07-25', 6, 0), 'zweites Sommerlager erlaubt');
  const fit0 = own.playerIds.reduce((s, id) => s + g.players[id].attributes.fitness, 0);
  let guard = 0;
  let bookedWinter = false;
  while (g.calendar.currentDate < '1976-01-05' && guard++ < 400) {
    const today = g.calendar.currentDate;
    if (!bookedWinter && today >= '1975-11-10' && indoorState(g).current?.tournaments.length) {
      bookedWinter = true;
      const w = winterWindow(g);
      const cur = indoorState(g).current!;
      const pend = cur.tournaments.find((t) => t.own === null);
      // Winterlager genau über eine offene Einladung legen → Einladung wird abgesagt.
      let start = w.from;
      if (pend) {
        for (let k = 4; k >= 0; k--) {
          const s = CalendarEngine.addDays(pend.date, -k);
          if (s >= w.from && !quoteCamp(g, 'sportschule', 'winter', s, 5).error) { start = s; break; }
        }
      }
      const e2 = bookCamp(g, 'sportschule', 'winter', start, 5, 0);
      if (e2) fail(`Winterlager nicht buchbar: ${e2}`);
      if (pend && pend.own !== 'decline') fail('offene Einladung im Lagerzeitraum nicht abgesagt');
      if (pend) {
        expect(setOwnIndoorDecision(g, pend.id, 'stars').includes('Trainingslager'), 'Zusage trotz Trainingslager möglich');
      }
      expect(ownCampDays(g).size === 5, 'Lagertage falsch');
    }
    processDay(g, HEADLESS_UI);
  }
  const cs = campState(g);
  expect(cs.bookings.filter((b) => b.done).length === 2, `Lager nicht abgeschlossen (${cs.bookings.map((b) => b.id + ':' + b.done).join(',')})`);
  expect(cs.ai.filter((a) => a.clubId).length >= 15, 'KI-Vereine fahren nicht ins Lager');
  expect(cs.ai.every((a) => !a.destId || ['sportschule', 'tegernsee'].includes(a.destId)), 'KI 1975 mit unzulässigem Ziel');
  const cur = indoorState(g).current!;
  expect(cur.phase === 'invitational' && !cur.masters && cur.tournaments.every((t) => t.done), 'Einladungsturniere 1975/76 nicht gespielt');
  expect(indoorState(g).history.some((h) => h.year === 1976), 'Historie 1976 fehlt');
  void fit0;
  // Storno
  const g2 = fresh();
  bookCamp(g2, 'sportschule', 'summer', '1975-07-20', 6, 0);
  const b0 = g2.clubs[g2.managedClubId].finances.balance;
  const txt = cancelCamp(g2, ownBooking(g2, 'summer')!.id);
  expect(txt.includes('erstattet') && g2.clubs[g2.managedClubId].finances.balance > b0, 'Storno ohne Erstattung');
  console.log(`1975/76: ${cur.tournaments.length} Einladungsturniere, Sieger ${cur.tournaments.map((t) => g.clubs[t.result!.ranking[0]]?.shortName ?? t.result!.ranking[0]).join(', ')} | Lager: ${cs.history.map((h) => h.note).join(' | ')} | KI-Ziele ${[...new Set(cs.ai.map((a) => a.destId).filter(Boolean))].join('/')}`);
}
console.log('Winter-Test OK');
