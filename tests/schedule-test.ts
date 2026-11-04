// Spielplan & Termine ohne UI (Rahmenterminkalender, data/matchCalendarRules.ts):
//  A) Jede Saison 1975/76–2030/31 (1. Liga 18 Vereine, 2. Liga, 20er-Liga) mit Landespokal,
//     Wiederholungsterminen, Europapokal (Starter aus der eigenen Liga), Halle: Terminwart
//     Tag für Tag (Platzbegehung, Verlegungen) ohne Spielsimulation. Geprüft: kein Verein an
//     aufeinanderfolgenden Tagen (Mindestabstand 2 Tage), Pokal/Europapokal am Wochentag der
//     Epoche, Endspiel samstags, Halle nie am Tag vor/nach einem Pflichtspiel, alle Spiele vor
//     dem 30.6., Nachholspiele vor den letzten zwei Spieltagen und nicht in der Winterpause.
//     Bericht: Absagen/Verlegungen je Epoche.
//  B) Echte Saison 1975/76 + 1976/77 im Tagesablauf: tatsächlich gespielte Termine aller
//     Vereine der eigenen Liga (Liga, Pokal inkl. Wiederholung, Europapokal), alles gespielt.
//   npm run test:schedule [bisJahr]
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { Game } from '../src/game/state';
import { CalendarEngine, generateSeasonCalendar, seasonLabel } from '../src/engine/calendar';
import { generateFixtures } from '../src/engine/league';
import { createCup } from '../src/engine/cup';
import { findWinterBreak, inCupWinterBreak } from '../src/engine/winterBreak';
import { winterBreakFor } from '../src/data/winterBreaks';
import { BreakCache } from '../src/game/indoorWindow';
import { addD, dayDiff, matchdayBaseDates, wdOf } from '../src/engine/fixtureRules';
import { addCupCalendarEvents, buildEuroCupsForSeason, cupDateSet, leagueDateSet } from '../src/game/competitions';
import { euroFrameDates } from '../src/game/euroSetup';
import { euroFormat } from '../src/data/euroFormats';
import { allEuroClubs, type EuroCompId } from '../src/data/europe';
import { allTournaments, setupIndoorWinter } from '../src/game/indoorGame';
import { indoorState } from '../src/game/winterShared';
import { indoorPhase } from '../src/data/indoorHistory';
import { calendarEra, MAKEUP_BEFORE_LAST } from '../src/data/matchCalendarRules';
import { clubCommitments, fixtureWatchDaily, harmonizeSeason } from '../src/game/fixtureWatch';
import { leagueClubs, startNextSeason } from '../src/game/season';
import type { Match } from '../src/types';

let seed = 1987;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let failures = 0;
const fails: string[] = [];
const check = (cond: boolean, msg: string) => { if (!cond) { failures++; if (fails.length < 40) fails.push(msg); } };
const toYear = Number(process.argv[2] ?? 2030);

const g: Game = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const fresh = JSON.stringify({ messages: g.messages });
const euroClubs = allEuroClubs();
const leagueIds = leagueClubs(g).map((c) => c.id);
const amIds = Object.keys(g.clubs).filter((id) => id.startsWith('am'));

interface Stat { seasons: number; ppd: number; ppdWinter: number; moved: number; gap2: number; ppdOwn: number }
const byEra = new Map<string, Stat>();
let indoorAll = 0, indoorOwn = 0;
const gapKinds: Record<string, number> = {};

function buildSeason(y: number, tier: number, size: number) {
  const ids = size === 18 ? leagueIds : [...leagueIds, ...amIds.slice(-(size - 18))];
  const clubs = ids.map((id) => g.clubs[id]);
  g.season = seasonLabel(y);
  g.messages = JSON.parse(fresh).messages;
  g.fixtures = generateFixtures(clubs, `${y}-08-15`, { tier, spread: true });
  for (const m of g.fixtures) m.involvesPlayerClub = m.homeClubId === g.managedClubId || m.awayClubId === g.managedClubId;
  (g.leagues as any).playerDivision = { ...g.leagues!.playerDivision, tier };
  g.calendar = generateSeasonCalendar(g.fixtures, `${y}-07-01`, `${y + 1}-06-30`);
  const am = amIds.filter((id) => !ids.includes(id)).slice(0, 32 - ids.length);
  const cupAvoid = leagueDateSet(g.fixtures);
  const euroWeeks = euroFrameDates(y);
  const cup = createCup(ids, am, cupAvoid, 7 + y, `${y}-07-01`, g.managedClubId, true, euroWeeks);
  addCupCalendarEvents(g.calendar, cup, cupAvoid, euroWeeks);
  g.cup = cup;
  const o = ids.filter((id) => id !== g.managedClubId);
  const quals = { ec: [o[0], o[1]], cwc: [o[2]], uefa: [o[3], o[4], g.managedClubId] } as Record<EuroCompId, string[]>;
  g.euroCups = buildEuroCupsForSeason(quals, euroClubs, leagueDateSet(g.fixtures), cupDateSet(cup), `t:${y}`, `${y}-07-01`, g.managedClubId, g.calendar, null, true);
  harmonizeSeason(g);
  const st = indoorState(g);
  st.current = indoorPhase(y + 1) !== 'none' ? setupIndoorWinter(g, `${y}-11-02`) : undefined;
  return { ids, cup };
}

// -----------------------------------------------------------------------------
// A) Alle Saisons: Aufbau + Terminwart Tag für Tag
// -----------------------------------------------------------------------------
const VARIANTS: { tier: number; size: number; years: (y: number) => boolean }[] = [
  { tier: 1, size: 18, years: () => true },
  { tier: 2, size: 20, years: (y) => y % 3 === 0 },
  { tier: 1, size: 20, years: (y) => y === 1991 || y % 7 === 0 },
];
for (let y = 1975; y <= toYear; y++) {
  for (const v of VARIANTS) {
    if (!v.years(y)) continue;
    const { ids, cup } = buildSeason(y, v.tier, v.size);
    const tag = `${seasonLabel(y)} T${v.tier}/${v.size}`;
    const era = calendarEra(y);
    // Regeln der Termine selbst
    cup.rounds.forEach((r, i) => {
      const fin = i === cup.rounds.length - 1;
      check(fin ? wdOf(r.date) === 6 || r.date > `${y + 1}-06-20` : era.cupDays.includes(wdOf(r.date)) || [2, 3, 4].includes(wdOf(r.date)), `${tag}: Pokal ${r.name} am ${r.date} (Wochentag ${wdOf(r.date)})`);
      check(r.date <= `${y + 1}-06-29`, `${tag}: Pokal ${r.name} nach Saisonende`);
    });
    // Winterpause: kein Pokalspiel (auch keine Wiederholung) in der Pause; Halle nur in der
    // Pause jedes Teilnehmers (nach seinem letzten Pflichtspiel davor, vor dem ersten danach).
    for (const r of cup.rounds) for (const d of r.dates ?? [r.date]) check(!inCupWinterBreak(d, y), `${tag}: Pokal ${r.name} am ${d} in der Winterpause`);
    {
      const bc = new BreakCache(g);
      for (const t of allTournaments(indoorState(g).current)) {
        for (const id of t.clubIds) check(bc.fits(id, t.date, t.days), `${tag}: ${t.name} ${t.date} – ${id} nicht in der Winterpause (${JSON.stringify(bc.window(id))})`);
        if (t.clubIds.includes(g.managedClubId)) indoorOwn++;
        indoorAll++;
      }
      const wbL = findWinterBreak([...matchdayBaseDates(g.fixtures).values()], y);
      const hist = winterBreakFor(y);
      if (wbL && v.size === 18 && v.tier === 1) {
        const w = dayDiff(wbL.last, wbL.first) / 7, hw = dayDiff(hist.last, hist.first) / 7;
        check(Math.abs(w - hw) <= 1, `${tag}: Pause ${w.toFixed(1)} Wochen statt ${hw.toFixed(1)} (historisch)`);
      }
    }
    for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
      const c = g.euroCups?.[comp]; const fmt = euroFormat(comp, y);
      if (!c || !fmt) continue;
      const wrong = c.rounds.flatMap((r) => r.dates ?? [r.date]).filter((d) => wdOf(d) !== fmt.weekday);
      check(wrong.length <= 2, `${tag}: ${comp} ${wrong.length} Termine abseits ${fmt.weekday} (${wrong.slice(0, 3).join(' ')}) Pokal ${cup.rounds.map((r) => (r.dates ?? [r.date]).join('+')).join(' ')}`);
    }
    // Terminwart über die Saison (Spiele gelten mit ihrem Datum als gespielt)
    const before = new Map(g.fixtures.map((m) => [m.id, m.date]));
    for (let d = `${y}-07-01`; d <= `${y + 1}-06-30`; d = addD(d, 1)) {
      for (const m of g.fixtures) if (m.status === 'scheduled' && m.date < d) m.status = 'finished';
      fixtureWatchDaily(g, d);
    }
    const st: Stat = byEra.get(era.label) ?? { seasons: 0, ppd: 0, ppdWinter: 0, moved: 0, gap2: 0, ppdOwn: 0 };
    byEra.set(era.label, st);
    if (v.tier === 1 && v.size === 18) st.seasons++;
    const base = matchdayBaseDates(g.fixtures);
    const mds = [...base.keys()].sort((a, b) => a - b);
    const deadline = base.get(mds[mds.length - MAKEUP_BEFORE_LAST])!;
    const wb = findWinterBreak([...base.values()], y);
    for (const m of g.fixtures) {
      check(m.date >= `${y}-07-15` && m.date <= `${y + 1}-06-29`, `${tag}: Spiel ${m.id} am ${m.date}`);
      if (!m.moved) continue;
      if (v.tier === 1 && v.size === 18) {
        if (m.moved.makeup) { st.ppd++; if (/-(12|01|02)-/.test(m.moved.orig)) st.ppdWinter++; if (m.involvesPlayerClub) st.ppdOwn++; } else st.moved++;
      }
      if (m.moved.makeup) {
        check(m.date < deadline, `${tag}: Nachholspiel ${m.id} am ${m.date} nicht vor den letzten zwei Spieltagen (${deadline})`);
        check(!wb || !(m.date > wb.last && m.date < wb.first), `${tag}: Nachholspiel ${m.id} in der Winterpause (${m.date})`);
        check(m.date > m.moved.orig, `${tag}: Nachholspiel vor dem Ursprungstermin`);
      }
    }
    // Abstände je Verein (alle möglichen Pokal-/Europapokalrunden, Halle)
    const all = new Set([...ids, ...amIds]);
    for (const id of all) {
      const list = clubCommitments(g, id, true).sort((a, b) => a.date.localeCompare(b.date));
      const games = list.filter((c) => c.kind !== 'halle');
      for (let i = 1; i < games.length; i++) {
        const gap = dayDiff(games[i - 1].date, games[i].date);
        check(gap >= 2, `${tag}: ${id} ${games[i - 1].kind} ${games[i - 1].date} / ${games[i].kind} ${games[i].date}`);
        if (gap === 2 && v.tier === 1 && v.size === 18 && id === g.managedClubId) { st.gap2++; const k = `${games[i - 1].kind}>${games[i].kind}`; gapKinds[k] = (gapKinds[k] ?? 0) + 1; if (process.env.DBG && gapKinds[k] < 12) console.log(tag, id, k, games[i - 1].date, games[i].date); }
      }
      for (const h of list.filter((c) => c.kind === 'halle')) {
        for (const x of games) check(Math.abs(dayDiff(x.date, h.date)) >= 2, `${tag}: ${id} Halle ${h.date} neben ${x.kind} ${x.date}`);
      }
    }
    void before;
  }
}
console.log('A) Rahmenterminkalender 1975–' + toYear + ' (1. Liga, 18 Vereine; je Saison):');
console.log('   Epoche       Saisons  Absagen/Saison (davon Dez–Feb)  eigene  Wochenend-Verlegungen  Abstand 2 Tage');
for (const [k, s] of byEra) {
  const n = Math.max(1, s.seasons);
  console.log(`   ${k.padEnd(12)} ${String(s.seasons).padStart(7)}  ${(s.ppd / n).toFixed(1).padStart(14)} (${(s.ppdWinter / n).toFixed(1)})${''.padEnd(10)}${(s.ppdOwn / n).toFixed(1).padStart(6)}  ${(s.moved / n).toFixed(1).padStart(21)}  ${(s.gap2 / n).toFixed(1).padStart(14)}`);
}
console.log('   Abstand 2 Tage nach Art:', JSON.stringify(gapKinds));
console.log(`   Hallenturniere geprüft: ${indoorAll} (mit eigenem Verein ${indoorOwn}) – alle Teilnehmer in ihrer Winterpause`);
const eraRows = [...byEra.values()];
if (eraRows.length >= 4) {
  const first = eraRows[0], last = eraRows[eraRows.length - 1];
  check(first.ppd / first.seasons >= 3, `70er: zu wenige Absagen (${(first.ppd / first.seasons).toFixed(1)} je Saison)`);
  check(last.ppd / last.seasons <= 1.5, `Gegenwart: zu viele Absagen (${(last.ppd / last.seasons).toFixed(1)} je Saison)`);
}

// -----------------------------------------------------------------------------
// B) Echte Saisons im Tagesablauf
// -----------------------------------------------------------------------------
if (!process.env.SKIP_B) {
  const h: Game = createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  for (let season = 0; season < 2; season++) {
    const played = new Map<string, { d: string; what: string }[]>();
    const note = (id: string, d: string, what: string) => { if (!played.has(id)) played.set(id, []); played.get(id)!.push({ d, what }); };
    let guard = 0;
    while (!CalendarEngine.isSeasonOver(h.calendar) && guard++ < 1000) processDay(h, HEADLESS_UI);
    const tag = h.season;
    check(h.fixtures.every((m) => m.status === 'finished'), `${tag}: Liga nicht fertig`);
    const fx: Match[] = h.fixtures;
    for (const m of fx) { note(m.homeClubId, m.date, 'Liga'); note(m.awayClubId, m.date, 'Liga'); }
    const cups = [h.cup, h.euroCups?.ec, h.euroCups?.cwc, h.euroCups?.uefa];
    for (const c of cups) {
      if (!c) continue;
      for (const r of c.rounds) {
        for (const t of r.ties) {
          const legs = t.legs?.length ? t.legs : [{ home: t.homeClubId, away: t.awayClubId, date: t.date, played: t.played }];
          for (const l of legs) if (l.played) { note(l.home, l.date, c === h.cup ? 'Pokal' : 'Europa'); note(l.away, l.date, c === h.cup ? 'Pokal' : 'Europa'); }
        }
        for (const gr of r.groups ?? []) for (const m of gr.matches) if (m.hg != null) { note(m.home, m.date, 'Europa'); note(m.away, m.date, 'Europa'); }
      }
    }
    let bad = 0;
    for (const [id, list] of played) {
      if (!h.clubs[id] || id.startsWith('am') && !h.cup?.participantIds.includes(id)) continue;
      list.sort((a, b) => a.d.localeCompare(b.d));
      for (let i = 1; i < list.length; i++) {
        if (dayDiff(list[i - 1].d, list[i].d) < 2) { bad++; check(false, `${tag} gespielt: ${id} ${list[i - 1].what} ${list[i - 1].d} / ${list[i].what} ${list[i].d}`); }
      }
    }
    const moved = fx.filter((m) => m.moved);
    console.log(`B) ${tag} im Tagesablauf: ${moved.filter((m) => m.moved!.makeup).length} Nachholspiele, ${moved.filter((m) => !m.moved!.makeup).length} Verlegungen, Folgetage ${bad}`
      + `; Nachrichten Spielabsage ${h.messages.filter((m) => m.subject.startsWith('Spielabsage')).length}, Verlegung ${h.messages.filter((m) => m.subject.startsWith('Spielverlegung')).length}`);
    if (season === 0) startNextSeason(h);
  }
}

if (failures) { console.error(fails.join('\n')); console.error(`${failures} Fehler.`); process.exit(1); }
console.log('Spielplan-Test bestanden.');
