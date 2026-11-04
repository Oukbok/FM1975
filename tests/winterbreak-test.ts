// Winterpausen-Test ohne UI: Länge/Lage der Winterpause je Epoche, Spielpläne aller
// Ligagrößen vor dem 30.6., keine Terminkollisionen Liga/Pokal/Europapokal/Halle,
// Hallen-Masters im Januar, Trainingslager im Pausenfenster.
//   npm run test:winterbreak
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { Game } from '../src/game/state';
import { CalendarEngine, generateSeasonCalendar, seasonLabel } from '../src/engine/calendar';
import { generateFixtures } from '../src/engine/league';
import { createCup } from '../src/engine/cup';
import { findWinterBreak, inCupWinterBreak, seasonSchedule } from '../src/engine/winterBreak';
import { BreakCache } from '../src/game/indoorWindow';
import { reconcileIndoor } from '../src/game/indoorReconcile';
import { WEST_BREAKS, winterBreakFor } from '../src/data/winterBreaks';
import { addCupCalendarEvents, leagueDateSet } from '../src/game/competitions';
import { allTournaments, setupIndoorWinter } from '../src/game/indoorGame';
import { campWindow } from '../src/game/trainingCampGame';
import { competitiveDays, indoorState, winterWindow } from '../src/game/winterShared';
import { indoorPhase } from '../src/data/indoorHistory';
import { leagueClubs, startNextSeason } from '../src/game/season';

let seed = 1987;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let failures = 0;
const check = (cond: boolean, msg: string) => { if (!cond) { failures++; console.error('FEHLER:', msg); } };
const days = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000);
const weeks = (y0: number) => { const s = seasonSchedule(y0, 34, 1); return days(s.breakLast, s.breakFirst) / 7; };

// 1) Pausenlänge je Epoche (Bundesliga, 18 Vereine)
const EPOCHS: { from: number; to: number; min: number; max: number; name: string }[] = [
  { from: 1975, to: 1985, min: 3, max: 8, name: '1975–1985 (4–6 Wochen)' },
  { from: 1986, to: 1996, min: 8, max: 11, name: '1986–1996 (lange Pause)' },
  { from: 1997, to: 2008, min: 5, max: 9, name: '1997–2008 (~6 Wochen)' },
  { from: 2009, to: 2019, min: 4, max: 6, name: '2009–2019 (~4–5 Wochen)' },
  { from: 2020, to: 2060, min: 3, max: 3.5, name: 'ab 2020 (~3 Wochen)' },
];
for (const e of EPOCHS) {
  const ws: number[] = [];
  for (let y = e.from; y <= e.to; y++) {
    if (y === 2022 || y === 2034) continue; // WM im Winter
    const w = weeks(y);
    ws.push(w);
    check(w >= e.min - 0.01 && w <= e.max + 0.01, `${seasonLabel(y)}: Pause ${w.toFixed(1)} Wochen außerhalb ${e.min}–${e.max}`);
  }
  console.log(`${e.name.padEnd(26)} Ø ${(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(1)} Wochen (min ${Math.min(...ws).toFixed(1)}, max ${Math.max(...ws).toFixed(1)})`);
}
check(weeks(1986) === 11, '1986/87 muss 11 Wochen Pause haben');
check(weeks(2022) >= 9 && seasonSchedule(2022, 34, 1).breakLast === '2022-11-12', 'WM-Pause 2022/23 (ab 13.11.2022)');
// Belegte Jahre exakt übernommen (Bundesliga, 18 Vereine; 1991/92 mit 20 Vereinen)
for (const r of WEST_BREAKS) {
  const s = seasonSchedule(r.y0, r.y0 === 1991 ? 38 : 34, 1);
  check(s.breakLast === r.last && s.breakFirst === r.first, `${seasonLabel(r.y0)}: ${s.breakLast}/${s.breakFirst} statt ${r.last}/${r.first}`);
}
check(winterBreakFor(2020).basis === 'interpoliert', '2020/21 (Corona-Stauchung) wird nicht nachgebaut');
// DDR: lange Pause bis Ende Februar
for (let y = 1975; y <= 1990; y++) {
  const s = seasonSchedule(y, 26, 101, 'ddr');
  const w = days(s.breakLast, s.breakFirst) / 7;
  check(w >= 8 && w <= 12 && s.before === 13, `DDR ${seasonLabel(y)}: ${w} Wochen nach Spieltag ${s.before}`);
}

// 2) Alle Ligagrößen/Spielklassen/Jahre: Spieltage in der Saison, chronologisch, Mindestabstand.
let englishWeeks = 0, checked = 0;
for (let y = 1975; y <= 2060; y++) {
  for (const kind of (y < 1991 ? ['west', 'ddr'] : ['west']) as ('west' | 'ddr')[]) {
    for (const clubs of [12, 14, 16, 17, 18, 19, 20]) {
      for (const tier of kind === 'ddr' ? [101, 102] : [1, 2, 3]) {
        const stubs = Array.from({ length: clubs }, (_, i) => ({ id: `c${i}` })) as any[];
        const fx = generateFixtures(stubs, `${y}-08-15`, { tier, kind });
        const mds = [...new Set(fx.map((m) => m.matchday))].sort((a, b) => a - b);
        const dateOf = (md: number) => fx.find((m) => m.matchday === md)!.date;
        const ds = mds.map(dateOf);
        checked++;
        const tag = `${seasonLabel(y)} ${kind} T${tier} ${clubs} Vereine`;
        check(ds[0] >= `${y}-07-15` && ds[ds.length - 1] <= `${y + 1}-06-30`, `${tag}: außerhalb der Saison (${ds[0]}–${ds[ds.length - 1]})`);
        for (let i = 1; i < ds.length; i++) check(days(ds[i - 1], ds[i]) >= 3, `${tag}: Spieltage ${i}/${i + 1} zu dicht (${ds[i - 1]}, ${ds[i]})`);
        // jeder Verein genau einmal je Spieltag
        for (const md of mds) {
          const ids = fx.filter((m) => m.matchday === md).flatMap((m) => [m.homeClubId, m.awayClubId]);
          check(new Set(ids).size === ids.length, `${tag}: Doppelbelegung an Spieltag ${md}`);
          check(new Set(fx.filter((m) => m.matchday === md).map((m) => m.date)).size === 1, `${tag}: Spieltag ${md} an mehreren Tagen`);
        }
        englishWeeks += ds.filter((d) => new Date(d + 'T00:00:00Z').getUTCDay() !== 6).length;
      }
    }
  }
}
console.log(`Spielpläne geprüft: ${checked} (Jahre × Größen × Klassen), Wochenspieltage gesamt ${englishWeeks}`);

// 3) Einzelne Winter: Pokal, Halle, Trainingslager im Spielstand (ohne Europapokal)
const fresh = (): Game => createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
for (const y of [1976, 1984, 1986, 1987, 1990, 1993, 1996, 1997, 1998, 2000, 2003]) {
  const g = fresh();
  const clubs = leagueClubs(g);
  g.season = seasonLabel(y);
  g.fixtures = generateFixtures(clubs, `${y}-08-15`, { tier: 1 });
  for (const m of g.fixtures) m.involvesPlayerClub = m.homeClubId === g.managedClubId || m.awayClubId === g.managedClubId;
  g.calendar = generateSeasonCalendar(g.fixtures, `${y}-07-01`, `${y + 1}-06-30`);
  const cup = createCup(clubs.map((c) => c.id), Object.keys(g.clubs).filter((id) => id.startsWith('am')).slice(0, 14), leagueDateSet(g.fixtures), 7 + y, `${y}-07-01`, g.managedClubId);
  addCupCalendarEvents(g.calendar, cup);
  g.cup = cup; g.euroCups = { ec: null, cwc: null, uefa: null } as any;
  const league = leagueDateSet(g.fixtures);
  for (const r of cup.rounds) check(!league.has(r.date), `${g.season}: Pokalrunde ${r.name} am Ligaspieltag ${r.date}`);
  for (const r of cup.rounds) for (const d of r.dates ?? [r.date]) check(!inCupWinterBreak(d, y), `${g.season}: Pokal ${r.name} am ${d} in der Winterpause`);
  const win = winterWindow(g);
  const wb = findWinterBreak(g.fixtures.map((m) => m.date), y)!;
  const wbEv = g.calendar.events.find((e) => e.type === 'winter_break')!;
  check(wbEv.date === CalendarEngine.addDays(wb.last, 1), `${g.season}: Kalender-Ereignis Winterpause ${wbEv.date}`);
  check(campWindow(g, 'winter').from === win.from && campWindow(g, 'winter').to === win.to, `${g.season}: Lagerfenster ≠ Winterfenster`);
  const st = indoorState(g);
  st.current = setupIndoorWinter(g, `${y}-11-02`);
  const busy = competitiveDays(g);
  const ts = allTournaments(st.current);
  const phase = indoorPhase(y + 1);
  if (phase !== 'none') check(ts.length > 0, `${g.season}: keine Hallenturniere`);
  for (const t of ts) {
    for (let i = 0; i < t.days; i++) {
      const d = CalendarEngine.addDays(t.date, i);
      check(d >= win.from && d <= win.to, `${g.season}: ${t.name} am ${d} außerhalb der Pause ${win.from}–${win.to}`);
      check(!busy.has(d), `${g.season}: ${t.name} am ${d} kollidiert mit Pflichtspiel`);
    }
  }
  const bc = new BreakCache(g);
  for (const t of ts) for (const id of t.clubIds) check(bc.fits(id, t.date, t.days), `${g.season}: ${t.name} – ${id} nicht in seiner Winterpause`);
  const m = st.current.masters;
  if (phase === 'masters') {
    check(!!m && m.date.slice(5, 7) === '01', `${g.season}: Masters nicht im Januar (${m?.date})`);
    check(ts.filter((t) => t !== m).every((t) => t.date < m!.date), `${g.season}: Tour-Turnier nach dem Masters`);
  }
  console.log(`${g.season}: Pause ${wb.last} → ${wb.first} (${(days(wb.last, wb.first) / 7).toFixed(1)} Wo.), Fenster ${win.from}–${win.to}, ${ts.length} Hallenturniere${m ? `, Masters ${m.date}` : ''}, Pokal ${cup.rounds.map((r) => r.date.slice(5)).join(' ')}`);
}

// 3b) Alter Spielstand (wie Dez. 1978 im Spiel): Pokal 20.12. + Wiederholung 23.12. in der
//     Pause, Hallenturnier 18.12. → wird verlegt (Nachricht), zweiter Abgleich ändert nichts.
{
  const y = 1978;
  const g = fresh();
  const clubs = leagueClubs(g);
  g.season = seasonLabel(y);
  g.fixtures = generateFixtures(clubs, `${y}-08-15`, { tier: 1 });
  for (const m of g.fixtures) m.involvesPlayerClub = m.homeClubId === g.managedClubId || m.awayClubId === g.managedClubId;
  g.calendar = generateSeasonCalendar(g.fixtures, `${y}-07-01`, `${y + 1}-06-30`);
  const cup = createCup(clubs.map((c) => c.id), Object.keys(g.clubs).filter((id) => id.startsWith('am')).slice(0, 14), leagueDateSet(g.fixtures), 7 + y, `${y}-07-01`, g.managedClubId);
  cup.rounds[2].date = '1978-12-20';
  addCupCalendarEvents(g.calendar, cup);
  g.calendar.events.push({ id: 'cupev_2_1', date: '1978-12-23', type: 'cup_matchday', title: 'Landespokal: Viertelfinale (Wiederholungsspiele)', description: '', cupRoundIndex: 2, leg: 1, processed: false, requiresAction: false } as any);
  cup.rounds[2].dates = ['1978-12-20', '1978-12-23'];
  g.cup = cup; g.euroCups = { ec: null, cwc: null, uefa: null } as any;
  const st = indoorState(g);
  st.current = setupIndoorWinter(g, `${y}-11-02`);
  const win = winterWindow(g);
  check(win.from === '1978-12-25', `Altstand 1978: Pause deines Vereins ab ${win.from} statt 25.12. (nach der Pokal-Wiederholung)`);
  const t = st.current.tournaments[0];
  if (!t.clubIds.includes(g.managedClubId)) { t.clubIds = [g.managedClubId, ...t.clubIds.slice(0, 5)]; t.own = null; }
  t.date = '1978-12-18';
  const msgs = g.messages.length;
  const n1 = reconcileIndoor(g, st.current, '1978-12-01', () => undefined);
  const n2 = reconcileIndoor(g, st.current, '1978-12-01', () => undefined);
  check(n1 >= 1 && n2 === 0, `Altstand 1978: Abgleich nicht idempotent (${n1}, ${n2})`);
  check(t.date >= win.from && t.date <= win.to, `Altstand 1978: Turnier am ${t.date} nicht in der Pause`);
  check(g.messages.length > msgs && g.messages[0].subject.startsWith('Hallenturnier'), 'Altstand 1978: keine Nachricht zur Verlegung');
  const bc = new BreakCache(g);
  for (const x of allTournaments(st.current)) for (const id of x.clubIds) check(bc.fits(id, x.date, x.days), `Altstand 1978: ${x.name} ${x.date} – ${id} außerhalb der Pause`);
  console.log(`Altstand 1978/79: Pokal 20.12./23.12. → Pause ab ${win.from}; Turnier 18.12. → ${t.date} (${g.messages[0].subject})`);
}

// 4) Echte Saison im Tagesablauf: Liga/Pokal/Europapokal kollisionsfrei, Sim-Ligen
//    nach Datum fortgeführt, Saisonende vollständig, Formdrift in der Pause.
{
  const g = fresh();
  const comp = () => {
    const cupD = new Set(g.calendar.events.filter((e) => e.type === 'cup_matchday').map((e) => e.date));
    const euroD = g.calendar.events.filter((e) => e.type === 'euro_matchday').map((e) => e.date);
    const lg = leagueDateSet(g.fixtures, g.leagues?.otherDivisions ?? []);
    for (const d of cupD) check(!leagueDateSet(g.fixtures).has(d), `${g.season}: Pokal am Ligaspieltag ${d}`);
    for (const d of euroD) check(!lg.has(d) && !cupD.has(d), `${g.season}: Europapokal-Kollision ${d}`);
  };
  comp();
  const wb = findWinterBreak(g.fixtures.map((m) => m.date), 1975)!;
  let formBefore = 0, formAfter = 0;
  const own = () => g.clubs[g.managedClubId].playerIds.map((id) => g.players[id]).filter((p) => p && !p.injury);
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 1000) {
    const d = g.calendar.currentDate;
    if (d === CalendarEngine.addDays(wb.last, 3)) formBefore = own().reduce((s, p) => s + Math.abs(p.form - 50), 0);
    if (d === CalendarEngine.addDays(wb.first, -1)) formAfter = own().reduce((s, p) => s + Math.abs(p.form - 50), 0);
    if (d === wb.first) {
      for (const div of g.leagues!.otherDivisions) {
        const played = div.fixtures.filter((m) => m.status === 'finished');
        check(played.every((m) => m.date <= d), `${div.name}: Spiel nach Datum gespielt`);
        check(div.fixtures.filter((m) => m.date < d).every((m) => m.status === 'finished'), `${div.name}: Spiel vor der Pause nicht gespielt`);
      }
    }
    processDay(g, HEADLESS_UI);
  }
  check(g.fixtures.every((m) => m.status === 'finished'), '1975/76: eigene Liga nicht fertig');
  for (const div of g.leagues!.otherDivisions) check(div.fixtures.every((m) => m.status === 'finished'), `${div.name}: nicht fertig gespielt`);
  // Saisonwechsel: neue Pläne nach Winterpausen-Tabelle, Europapokal kollisionsfrei.
  startNextSeason(g);
  comp();
  const wb2 = findWinterBreak(g.fixtures.map((m) => m.date), 1976)!;
  check(wb2.last === '1976-12-11' && wb2.first === '1977-01-15', `1976/77: Pause ${wb2.last}/${wb2.first}`);
  const ddr = g.leagues!.otherDivisions.find((d) => d.tier >= 100);
  if (ddr) check(findWinterBreak(ddr.fixtures.map((m) => m.date), 1976)!.first.slice(5, 7) === '02', 'DDR-Rückrunde nicht im Februar');
  console.log(`1976/77: Ligen ${g.leagues!.otherDivisions.map((d) => `${d.name} ${d.fixtures[0]?.date}`).join(', ')}; Europapokal ${g.calendar.events.filter((e) => e.type === 'euro_matchday').length} Termine`);
  guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 1000) processDay(g, HEADLESS_UI);
  check(g.fixtures.every((m) => m.status === 'finished'), '1976/77: eigene Liga nicht fertig');
  for (const div of g.leagues!.otherDivisions) check(div.fixtures.every((m) => m.status === 'finished'), `${div.name}: nicht fertig gespielt`);
  check(formAfter <= formBefore, `Form driftet in der Pause nicht zur Mitte (${formBefore.toFixed(0)} → ${formAfter.toFixed(0)})`);
  console.log(`1975/76 im Tagesablauf: Pause ${wb.last} → ${wb.first}, Formabstand zur Mitte ${formBefore.toFixed(0)} → ${formAfter.toFixed(0)}`);
}

if (failures) { console.error(`${failures} Fehler.`); process.exit(1); }
console.log('Winterpausen-Test bestanden.');
