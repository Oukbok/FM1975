// Trainingslager-Planer ohne UI: Kartendaten, Vor-/Nachteile, Zeitraum-Prüfung,
// Reisegruppe (Kosten, Mindestgröße), Planung → Buchung → Lager → Archiv mit
// gemessener Wirkung, DayUi.onCampEnd, Höhentraining im Archiv, alte Stände.
//   npm run test:camp
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI, DayUi } from '../src/game/day';
import type { Game } from '../src/game/state';
import { CAMP_DESTINATIONS, campDestination } from '../src/data/campDestinations';
import { WORLD_BORDERS, WORLD_LAND } from '../src/data/campWorldMap';
import { CAMP_MAP_VIEWS, campEffectBars, campGrade, destinationProsCons, homeView, inView } from '../src/engine/campPlan';
import { campOutlook, destinationsFor } from '../src/engine/trainingCamp';
import { lodgingsFor } from '../src/data/campLodgings';
import { CAMP_MIN_GROUP, bookCamp, checkCampDates, ownBooking, quoteCamp } from '../src/game/trainingCampGame';
import { campGroup, defaultCampSquad, invitableYouth } from '../src/game/campResult';
import { campState, competitiveDays, migrateWinter } from '../src/game/winterShared';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const fail = (m: string): never => { console.error('FEHLER:', m); process.exit(1); };
const expect = (c: boolean, m: string) => { if (!c) fail(m); };
function fresh(): Game {
  return createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}

// 1) Karte: Umrisse vorhanden, jedes Ziel liegt in einem Kontinent-Ausschnitt, Deutsche in „Deutschland & Alpen“
expect(WORLD_LAND.length > 20000 && WORLD_BORDERS.length > 5000 && WORLD_LAND.length + WORLD_BORDERS.length < 140000, 'Kartendaten fehlen oder zu groß');
for (const d of CAMP_DESTINATIONS) {
  const [lat, lon] = d.geo;
  expect(Math.abs(lat) <= 70 && Math.abs(lon) <= 180, `${d.id}: Koordinaten unplausibel`);
  expect(CAMP_MAP_VIEWS.some((v) => v.id !== 'welt' && inView(v, d)), `${d.id} liegt in keinem Ausschnitt`);
  if (d.country === 'Deutschland') expect(inView(CAMP_MAP_VIEWS[0], d) && homeView(d) === 'dach', `${d.id} nicht in Deutschland & Alpen`);
}
expect(homeView(campDestination('katar')) === 'asien' && homeView(campDestination('florida')) === 'amerika' && homeView(campDestination('suedafrika')) === 'afrika', 'Startansicht je Kontinent falsch');
// Südafrika historisch: erst ab 2015 (belegt Januar 2015), Corona-Sperre
const ok = (s: 'summer' | 'winter', y: number, rep: number, id: string) => destinationsFor(s, y, rep).find((x) => x.d.id === id)?.status.ok ?? false;
expect(!ok('winter', 2014, 99, 'suedafrika') && ok('winter', 2015, 70, 'suedafrika') && !ok('winter', 2021, 99, 'suedafrika'), 'Südafrika-Freischaltung falsch');
for (let y = 1975; y <= 2010; y++) expect(!ok('winter', y, 100, 'katar'), `Katar schon ${y}`);
// Je Epoche: 1976 nur Ziele in Deutschland/Alpen buchbar, 2015 auf mehreren Kontinenten
const conts = (s: 'summer' | 'winter', y: number) => new Set(destinationsFor(s, y, 90).filter((x) => x.status.ok).map((x) => homeView(x.d)));
expect([...conts('summer', 1976)].every((v) => v === 'dach') && [...conts('winter', 1976)].every((v) => v === 'dach'), '1976 Ziele außerhalb Mitteleuropas');
expect(conts('winter', 2016).size >= 4, `2016 zu wenige Kontinente (${[...conts('winter', 2016)].join(',')})`);

// 2) Vor- und Nachteile
{
  const katar = campDestination('katar')!;
  const pc = destinationProsCons({ d: katar, season: 'winter', month: 0, year: 2020 });
  expect(pc.cons.some((t) => t.includes('Katar')), 'Kritik an Katar fehlt bei den Nachteilen');
  expect(pc.pros.some((t) => t.includes('Januar')), 'Golfklima im Januar nicht als Vorteil');
  const harz = campDestination('harz')!;
  const ph = destinationProsCons({ d: harz, season: 'winter', month: 0, year: 1980 });
  expect(ph.cons.some((t) => t.includes('Ausfallrisiko')), 'Winterwetter im Harz nicht als Nachteil');
  const eng = destinationProsCons({ d: campDestination('engadin')!, season: 'summer', month: 6, year: 2000 });
  expect(eng.pros.some((t) => t.includes('Höhenreiz')), 'Höhe nicht als Vorteil');
}

// 3) Zeitraum-Prüfung, Reisegruppe, Kosten, Wirkungsbalken
const g = fresh();
const club = g.clubs[g.managedClubId];
{
  const busy = [...competitiveDays(g)].find((d) => d >= '1975-07-20' && d <= '1975-08-20');
  if (busy) expect(!!checkCampDates(g, 'summer', busy, 5).error, 'Pflichtspiel im Zeitraum nicht gesperrt');
  expect(!!checkCampDates(g, 'summer', '1975-07-03', 5).error, 'Vorlauf nicht geprüft');
  expect(!checkCampDates(g, 'summer', '1975-07-14', 8).error, 'freier Zeitraum gesperrt');
  const all = defaultCampSquad(g);
  const big = quoteCamp(g, 'tegernsee', 'summer', '1975-07-14', 8, { squad: all });
  const small = quoteCamp(g, 'tegernsee', 'summer', '1975-07-14', 8, { squad: all.slice(0, 13) });
  expect(!big.error && !small.error && small.cost < big.cost, `kleine Reisegruppe nicht günstiger (${small.cost} vs ${big.cost})`);
  expect(!!quoteCamp(g, 'tegernsee', 'summer', '1975-07-14', 8, { squad: all.slice(0, CAMP_MIN_GROUP - 2) }).error, 'zu kleine Reisegruppe buchbar');
  const d = campDestination('tegernsee')!, l = lodgingsFor('tegernsee', 1975)[0];
  const o = campOutlook({ d, l, focus: 'kondition', season: 'summer', days: 8, tests: 2, year: 1975, rep: club.reputation, start: '1975-07-14' });
  const or = campOutlook({ d, l, focus: 'regeneration', season: 'summer', days: 8, tests: 2, year: 1975, rep: club.reputation, start: '1975-07-14' });
  const base = { travelers: 22, youth: 0, stayed: 0, injuredAlong: 0, cost: big.cost, income: 0, balance: club.finances.balance };
  const bk = campEffectBars({ o, ...base }), br = campEffectBars({ o: or, ...base });
  const bar = (b: typeof bk, k: string) => b.find((x) => x.key === k)!.d;
  expect(bar(bk, 'fit') > bar(br, 'fit') && bar(br, 'rest') > bar(bk, 'rest') && bar(br, 'inj') < bar(bk, 'inj'), 'Balken reagieren nicht auf den Schwerpunkt');
  const left = campEffectBars({ o, ...base, stayed: 6 });
  expect(bar(left, 'spirit') < bar(bk, 'spirit'), 'Zuhausegebliebene senken den Teamgeist nicht');
  expect(bk.every((b) => b.d >= -1 && b.d <= 1), 'Balken außerhalb −1…1');
  // Spannen: lo ≤ Erwartung ≤ hi, Fitness mit Wetter-Spanne, Kosten fest
  expect(bk.every((b) => b.lo <= b.d + 1e-9 && b.d <= b.hi + 1e-9 && b.lo >= -1 && b.hi <= 1), 'Spanne umschließt den Erwartungswert nicht');
  const fitB = bk.find((b) => b.key === 'fit')!, cash = bk.find((b) => b.key === 'cash')!;
  expect(o.weatherRisk <= 0 || fitB.hi > fitB.lo, 'Fitness ohne Spanne trotz Wetterrisiko');
  expect(cash.lo === cash.hi, 'Kosten haben eine Spanne');
  expect(bk.find((b) => b.key === 'inj')!.text.length > 0 && bk.find((b) => b.key === 'spirit')!.hi > bk.find((b) => b.key === 'spirit')!.lo, 'Teamgeist ohne Spanne');
}

// 4) Planung → Buchung → Lager → Archiv
{
  const all = defaultCampSquad(g);
  const home = all.slice(-3); // drei bleiben daheim
  const squad = all.filter((id) => !home.includes(id));
  const youth = invitableYouth(g).slice(0, 2).map((p) => p.id);
  const dev0 = new Map(youth.map((id) => [id, g.youthPlayers[id].development.devPoints ?? 0]));
  const err = bookCamp(g, 'tegernsee', 'summer', '1975-07-14', 8, 2, { focus: 'taktik', squad, youth });
  expect(!err, `Buchung gescheitert: ${err}`);
  const b = ownBooking(g, 'summer')!;
  expect(b.squad?.length === squad.length && b.youth?.length === youth.length, 'Reisegruppe nicht gespeichert');
  const grp = campGroup(g, b);
  expect(grp.pros.length === squad.length && grp.stayed.length === all.length - squad.length + (club.playerIds.length - all.length) && grp.youth.length === youth.length, 'Reisegruppe falsch gelesen');
  const ended: string[] = [];
  const ui: DayUi = { ...HEADLESS_UI, onCampEnd: (id) => { ended.push(id); return true; } };
  let stopped = false;
  for (let i = 0; i < 40 && g.calendar.currentDate <= '1975-07-23'; i++) {
    const before = ended.length;
    const went = processDay(g, ui);
    if (ended.length > before) stopped = !went;
  }
  expect(ended.length === 1 && ended[0] === b.id, `onCampEnd nicht genau einmal (${ended.join(',')})`);
  expect(stopped, 'Vorlauf hält für die Zusammenfassung nicht an');
  const r = b.result;
  expect(!!r, 'keine gemessene Wirkung');
  expect(r!.travelers === squad.length && r!.youth === youth.length && r!.stayed >= 3, 'Zählung der Reisegruppe falsch');
  expect(r!.fit[1] > r!.fit[0], `Fitness nicht gestiegen (${r!.fit.join(' → ')})`);
  expect(r!.score >= 3 && r!.score <= 98 && !!campGrade(r!.score), 'Wertung außerhalb 3–98');
  expect(r!.best.length > 0 && r!.best.every((p) => !home.includes(p.id)), 'Gewinner fehlen oder sind Zuhausegebliebene');
  expect(r!.cost === b.cost, 'Kosten nicht im Archiv');
  for (const id of youth) {
    const p = g.youthPlayers[id];
    if (!p.injury) expect((p.development.devPoints ?? 0) > dev0.get(id)!, 'Jugendspieler ohne Entwicklungsschub');
  }
  const h = campState(g).history.find((x) => x.bookingId === b.id);
  expect(!!h && !!h.result && h.focus === 'taktik' && h.start === b.start, 'Verlaufseintrag ohne Wirkung');
  // Archiv übersteht Speichern/Laden (JSON) und Migration
  const g2: Game = JSON.parse(JSON.stringify(g));
  migrateWinter(g2); migrateWinter(g2);
  expect(campState(g2).history.find((x) => x.bookingId === b.id)?.result?.score === r!.score, 'Archiv nach dem Laden verloren');
  // Höhentraining trägt sich nachträglich ins Archiv ein (Buchung und Verlauf getrennt nach dem Laden)
  const b2 = campState(g2).bookings.find((x) => x.id === b.id)!;
  b2.delayed = { due: g2.calendar.currentDate, fitness: 2.4 };
  processDay(g2, HEADLESS_UI);
  expect(b2.result?.altitude === 2.4 && campState(g2).history.find((x) => x.bookingId === b.id)?.result?.altitude === 2.4, 'Höhentraining nicht im Archiv');
  console.log(`Lager Tegernsee: ${r!.score}/100 (${campGrade(r!.score)}), Fitness ${r!.fit.join(' → ')}, Form ${r!.form.join(' → ')}, Teamgeist ${r!.spirit.join(' → ')}, ${r!.injuries} verletzt, Gewinner ${r!.best.map((p) => p.name).join(', ')}`);
}

// 5) Alte Buchung ohne Reisegruppe: alle Profis fahren, Lager ohne Planer-Felder läuft
{
  const g3 = fresh();
  expect(!bookCamp(g3, 'sportschule', 'summer', '1975-07-14', 6, 0), 'alte Buchung');
  const b = ownBooking(g3, 'summer')!;
  delete (b as any).squad; delete (b as any).youth;
  expect(campGroup(g3, b).pros.length === g3.clubs[g3.managedClubId].playerIds.length, 'alte Buchung: nicht alle Profis');
  for (let i = 0; i < 20 && !b.done; i++) processDay(g3, HEADLESS_UI);
  expect(!!b.result && b.result.stayed === 0, 'alte Buchung ohne Ergebnis');
  // Alter Verlaufseintrag ohne Wirkung bleibt lesbar
  campState(g3).history.unshift({ season: '1974/75', destId: 'harz', campSeason: 'summer', note: 'alt' });
  migrateWinter(g3);
  expect(campState(g3).history[0].note === 'alt', 'alter Verlauf verändert');
}
console.log('Trainingslager-Planer-Test OK');
