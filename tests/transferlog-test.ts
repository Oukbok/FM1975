// Transferprotokoll + Spielersuche ohne UI (game/transferLog.ts, game/playerSearch.ts):
// Protokoll vollständig für ein Fenster, Popup-Termin je Epoche, Speicher begrenzt,
// Migration alter Spielstände, Top-Transfers/Bilanz-Daten, Suchfilter.
//   npm run test:transferlog
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { CalendarEngine, generateSeasonCalendar } from '../src/engine/calendar';
import {
  logOf, logTransfer, migrateTransferLog, transferWindowDue, windowClose, windowKeyOf, windowLabel, windowsForView,
} from '../src/game/transferLog';
import { DEFAULT_FILTER, filterRows, rowsOf, sortRows, topTransfers, transferOfWindow } from '../src/game/transferLogView';
import { defaultCriteria, loadSavedSearches, matches, runSearch, searchPool, wouldJoin } from '../src/game/playerSearch';
import { scoutRange } from '../src/engine/scouting';
import { POSITION_GROUPS } from '../src/types';
import type { Game } from '../src/game/state';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };
function load(path: string): Game {
  const txt = readFileSync(path, 'utf8');
  return (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
}

// 1) Fenster-Schlüssel
expect(windowKeyOf('1978-07-01') === '1978S' && windowKeyOf('1978-08-31') === '1978S', 'Sommer falsch');
expect(windowKeyOf('1978-09-01') === '1979W' && windowKeyOf('1979-01-31') === '1979W' && windowKeyOf('1979-02-01') === '1979S', 'Winter falsch');
expect(windowLabel('1979W') === 'Winter 1978/79' && windowLabel('2005S') === 'Sommer 2005', 'Beschriftung falsch');

// 2) Popup-Termin je Epoche: Kalender jeder Saison hat Fensterschlüsse; Popup am Tag danach.
for (const y of [1975, 1985, 1995, 2005, 2015, 2025]) {
  const cal = generateSeasonCalendar([], `${y}-07-01`, `${y + 1}-06-30`);
  const closes = cal.events.filter((e) => e.type === 'transfer_window_close').map((e) => e.date).sort();
  expect(closes.length === 2, `${y}: ${closes.length} Fensterschlüsse`);
  expect(windowKeyOf(closes[0]) === `${y}S` && windowKeyOf(closes[1]) === `${y + 1}W`, `${y}: Schlüssel passen nicht zum Fensterende`);
  expect(windowClose(`${y}S`) === closes[0] && windowClose(`${y + 1}W`) === closes[1], `${y}: windowClose weicht vom Kalender ab`);
  const fake = { calendar: cal, transferLog: { wins: [] }, clubs: {}, players: {}, table: { rows: [] }, managedClubId: 'x' } as unknown as Game;
  logOf(fake).wins.push({ key: `${y}S`, e: [{ d: `${y}-07-10`, p: 'p', n: 'X', pos: 'ZM', ov: 70, age: 25, nat: 'GER', f: 'a', t: 'b', fee: 1 }], r: [] });
  expect(transferWindowDue(fake, closes[0]) === null, `${y}: Popup schon am Schlusstag`);
  expect(transferWindowDue(fake, CalendarEngine.addDays(closes[0], 1)) === `${y}S`, `${y}: kein Popup am Tag nach dem Sommerfenster`);
  expect(transferWindowDue(fake, CalendarEngine.addDays(closes[0], 1)) === null, `${y}: Popup doppelt`);
  expect(transferWindowDue(fake, CalendarEngine.addDays(closes[1], 1)) === null, `${y}: Popup im leeren Winterfenster`);
}
console.log('Popup-Termine 1975–2025: Tag nach 31.08. und 31.01. ✓');

// 3) Neues Spiel: Sommer 1975 vollständig protokolliert, Popup am 1.9. und 1.2.
const g = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const due: string[] = [];
const ui: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onTransferWindow: (k) => { due.push(`${g.calendar.currentDate}:${k}`); return true; } };
for (let i = 0; i < 900 && g.calendar.currentDate < '1976-02-03'; i++) processDay(g, ui);
expect(due.join(',') === '1975-09-01:1975S,1976-02-01:1976W', `Popup-Termine ${due.join(',')}`);
const sum = logOf(g).wins.find((w) => w.key === '1975S')!;
expect(sum && sum.e.length > 20, `Sommer 1975: nur ${sum?.e.length} Wechsel`);
let hist = 0;
for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers)]) {
  for (const t of p.history?.transfers ?? []) {
    if (windowKeyOf(t.date) !== '1975S') continue;
    hist++;
    expect(sum.e.some((e) => e.p === p.id && e.d === t.date), `Wechsel fehlt im Protokoll: ${p.fullName} ${t.date} ${t.fromClub} → ${t.toClub}`);
  }
}
expect(sum.e.length >= hist, 'Protokoll kürzer als die Spielerverläufe');
expect(sum.gr && sum.co, 'Gerüchte/Trainer beim Fensterschluss nicht festgehalten');
const rows = rowsOf(g, sum);
expect(rows.every((r) => r.fromName && r.toName), 'Zeile ohne Vereinsname');
const totw = transferOfWindow(rows)!;
expect(totw && rows.every((r) => r.back || r.e.fee <= totw.e.fee), 'Transfer des Fensters ist nicht der teuerste');
const tops = topTransfers(g, rows);
const league = new Set(g.table.rows.map((r) => r.clubId));
expect(tops.length > 0 && tops.length <= 10 && tops.every((r) => league.has(r.e.t)), 'Top-Transfers nicht aus der eigenen Liga');
expect(tops.every((r, i) => i === 0 || tops[i - 1].e.ov >= r.e.ov), 'Top-Transfers nicht nach Stärke sortiert');
const only = filterRows(rows, { ...DEFAULT_FILTER, groups: ['GK'] });
expect(only.every((r) => r.group === 'GK'), 'Filter Torwart greift nicht');
const intl = filterRows(rows, { ...DEFAULT_FILTER, nat: false });
expect(intl.every((r) => r.intl) && intl.some((r) => r.fromName === 'Ausland' || r.toName === 'Ausland' || r.intl), 'Filter International greift nicht');
const byFee = sortRows(rows, 'fee', true);
expect(byFee[0].e.fee === Math.max(...rows.filter((r) => !r.loan && !r.back).map((r) => r.e.fee)), 'Sortierung nach Ablöse');
console.log(`Sommer 1975: ${sum.e.length} Wechsel (Verläufe: ${hist}), Transfer des Fensters ${totw.e.n} (${totw.e.fee}), Top ${tops.length}, Gerüchte ${sum.gr!.length}, Trainer ${sum.co!.length} ✓`);

// 4) Speicher begrenzt: viele Fenster und Wechsel
const before = JSON.stringify(g.transferLog).length;
const fakeP = Object.values(g.players)[0];
for (let y = 1976; y < 1984; y++) for (const m of ['07', '01']) for (let i = 0; i < 700; i++) {
  logTransfer(g, fakeP, 'Ausland', g.clubs.fra.name, i * 1000, `${y}-${m}-${String(1 + (i % 28)).padStart(2, '0')}`);
}
const log = logOf(g);
expect(log.wins.length <= 8, `${log.wins.length} Fenster gespeichert`);
expect(log.wins.slice(0, -2).every((w) => w.e.length <= 60), 'ältere Fenster nicht gekürzt');
expect(log.wins.every((w) => w.e.length <= 500), 'Fenster ohne Obergrenze');
const size = JSON.stringify(log).length;
expect(size < 260_000, `Protokoll zu groß: ${size} Zeichen`);
console.log(`Speicher: ${before} → ${size} Zeichen bei 16×700 Wechseln, ${log.wins.length} Fenster ✓`);

// 5) Migration: alter Spielstand ohne Feld (Vorlage „Test 3 Jahre“)
const old = load('public/saves/test-3-jahre.txt');
delete old.transferLog;
migrateTransferLog(old);
const wv = windowsForView(old);
expect(wv.length >= 1 && wv.every((w) => w.rec), 'Migration baut keine Fenster nach');
expect(old.transferLog!.shown === '1978S', `Migration: gezeigt = ${old.transferLog!.shown}`);
const snap = JSON.stringify(old.transferLog);
migrateTransferLog(old);
expect(JSON.stringify(old.transferLog) === snap, 'Migration nicht idempotent');
expect(transferWindowDue(old, '1978-12-11') === null, 'Popup nach dem Laden außerhalb des Termins');
console.log(`Migration: ${wv.map((w) => `${windowLabel(w.key)} ${w.e.length}`).join(', ')} ✓`);

// 6) Spielersuche auf der Vorlage
const s = old;
const pool = searchPool(s);
expect(pool.every((p) => p.clubId !== s.managedClubId), 'eigener Kader im Suchpool');
expect(runSearch(s, defaultCriteria(), 99999).length === pool.length, 'Standardsuche filtert');
const tw = runSearch(s, { ...defaultCriteria(), pos: 'TW', bestOnly: true });
expect(tw.length > 0 && tw.every((p) => p.naturalPosition === 'TW'), 'Suche Torwart');
const def = runSearch(s, { ...defaultCriteria(), pos: 'DEF' }, 9999);
expect(def.length > 0 && def.every((p) => [p.naturalPosition, ...p.secondaryPositions].some((x) => POSITION_GROUPS[x] === 'DEF')), 'Suche Abwehr');
const left = runSearch(s, { ...defaultCriteria(), pos: 'DEF', sides: ['L'], bestOnly: true }, 9999);
expect(left.length > 0 && left.every((p) => p.naturalPosition === 'LV'), 'Suche Seite links (Abwehr)');
const young = runSearch(s, { ...defaultCriteria(), ageMax: 21, ovMin: 60 }, 9999);
expect(young.every((p) => p.age <= 21 && p.overall >= 60), 'Alter/Stärke');
const pot = runSearch(s, { ...defaultCriteria(), potMin: 4 }, 9999);
expect(pot.every((p) => scoutRange(p)[1] >= 4), 'Potenzial (Scout-Spanne)');
const att = runSearch(s, { ...defaultCriteria(), attrs: [{ k: 'heading', min: 75 }, { k: 'speed', min: 60 }] }, 9999);
expect(att.every((p) => p.attributes.heading >= 75 && p.attributes.speed >= 60), 'Fähigkeiten');
const someone = pool[7];
const byName = runSearch(s, { ...defaultCriteria(), name: someone.lastName.toUpperCase() }, 9999);
expect(byName.some((p) => p.id === someone.id), 'Namenssuche (Groß/Klein)');
const foreign = runSearch(s, { ...defaultCriteria(), nat: 'foreign' }, 9999);
expect(foreign.every((p) => p.nationality && p.nationality !== 'GER'), 'Ausländer');
const listed = runSearch(s, { ...defaultCriteria(), transfer: 'listed' }, 9999);
expect(listed.every((p) => p.transferListed), 'Transferliste');
const real = runSearch(s, { ...defaultCriteria(), realistic: true }, 9999);
expect(real.length <= pool.length && real.every((p) => wouldJoin(s, p)), 'Nur realistische Transfers');
const lg = runSearch(s, { ...defaultCriteria(), area: 'league' }, 9999);
const lset = new Set(s.table.rows.map((r) => r.clubId));
expect(lg.every((p) => lset.has(p.clubId)), 'Suchgebiet eigene Liga');
const exp = runSearch(s, { ...defaultCriteria(), contract: 'expiring' }, 9999);
expect(exp.every((p) => (Date.parse(p.contract.expiryDate) - Date.parse(s.calendar.currentDate)) / (30.44 * 864e5) <= 12), 'Vertrag läuft aus');
expect(matches(s, someone, { ...defaultCriteria(), heightMin: someone.height }) && !matches(s, someone, { ...defaultCriteria(), heightMin: someone.height + 1 }), 'Größe');
expect(Array.isArray(loadSavedSearches()), 'Gespeicherte Suchen ohne localStorage');
console.log(`Suche: Pool ${pool.length}, TW ${tw.length}, Abwehr ${def.length}, LV ${left.length}, jung+60 ${young.length}, Pot ≥4 ${pot.length}, Kopfball+Tempo ${att.length}, Ausländer ${foreign.length}, realistisch ${real.length} ✓`);
console.log('Transferprotokoll & Suche: alle Prüfungen bestanden.');
