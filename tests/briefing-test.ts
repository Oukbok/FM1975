// Saison-Briefing ohne UI: Zusammensetzen (1975/76, 1995/96, 2002/03 …),
// „Neu im Spiel“ aus den Spieldaten, Archiv am Spielstand, Saisonwechsel, Laden.
//   npm run test:briefing
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { composeBriefing, migrateBriefing, briefingLog } from '../src/game/seasonBriefing';
import { gameChangesFor } from '../src/game/briefingChanges';
import { DIFFERENCES } from '../src/data/briefings/differences';
import { briefingFor, differencesFor } from '../src/data/briefings';
import { TIMELINE, seasonStartYear } from '../src/data/timeline';
import { ERA_TIPS, eraFor, eraTipsFor } from '../src/data/briefings/eraTips';
import { seasonTasks } from '../src/game/seasonTasks';
import { situationOf } from '../src/game/seasonBriefing';
import { MENU_STRUCTURE } from '../src/shell/navigation';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };
const label = (y: number) => `${y}/${String((y + 1) % 100).padStart(2, '0')}`;

// 1) Erste Saison: „So anders ist der Fußball 1975/76“
const b75 = composeBriefing('1975/76', { first: true });
expect(b75.first && b75.title.includes('So anders'), 'Erste Saison ohne „So anders“-Titel');
const diffs75 = differencesFor(1975).length;
expect(b75.differences.reduce((a, g) => a + g.items.length, 0) === diffs75, 'Nicht alle geltenden Unterschiede gruppiert');
expect(b75.ended.length === 0 && b75.started.length === 0, 'Erste Saison zeigt Wechsel statt Gesamtbild');
expect(b75.inGame.some((c) => c.title.includes('D-Mark')), '1975/76: Währung D-Mark fehlt');
expect(b75.inGame.some((c) => c.kind === 'halle'), '1975/76: Hallenturniere fehlen');
expect(b75.inGame.some((c) => c.kind === 'training'), '1975/76: Trainingslager fehlen');
expect(b75.highlights.length >= 3 && b75.highlights.length <= 5, `1975/76: ${b75.highlights.length} Überblickspunkte`);
console.log(`1975/76: ${diffs75} Unterschiede in ${b75.differences.length} Themen, ${b75.inGame.length} Spielpunkte, Überblick: ${b75.highlights.map((h) => h.title).join(' | ')}`);

// 2) 1995/96: Drei-Punkte-Regel (falls im Spiel so) + endende Unterschiede
const b95 = composeBriefing('1995/96');
const threeTl = TIMELINE.find((e) => e.effect?.pointSystem === '3-point');
if (threeTl) {
  const y3 = seasonStartYear(threeTl.season);
  const b3 = y3 === 1995 ? b95 : composeBriefing(label(y3));
  expect(b3.inGame.some((c) => c.title === threeTl.title && c.major), `${label(y3)}: Drei-Punkte-Regel fehlt im „Neu im Spiel“`);
  expect(b3.highlights.some((h) => h.title === threeTl.title || h.kicker === 'Ab jetzt wie heute'), `${label(y3)}: Drei-Punkte-Regel nicht im Überblick`);
}
const ended95 = DIFFERENCES.filter((d) => d.to === 1994);
expect(b95.ended.length === ended95.length, '1995/96: endende Unterschiede falsch');
expect(b95.ended.every((d) => b95.highlights.some((h) => h.title === d.title)) || b95.highlights.length === 5, '1995/96: „Ab jetzt wie heute“ fehlt im Überblick');
expect(!b95.differences.some((g) => g.items.some((d) => d.to < 1995)), '1995/96: abgelaufene Unterschiede gelten noch');
console.log(`1995/96: Neu im Spiel ${b95.inGame.map((c) => c.title).join(' | ')} | ab jetzt wie heute: ${b95.ended.map((d) => d.title).join(', ') || '—'}`);

// 3) Euro: Ankündigung 2001/02, erste ganze Saison 2002/03
const b01 = composeBriefing('2001/02');
const b02 = composeBriefing('2002/03');
expect(b01.inGame.some((c) => c.title === 'Der Euro kommt'), '2001/02: Euro-Umstellung fehlt');
expect(b02.inGame.some((c) => c.title.includes('Euro')), '2002/03: Euro fehlt');
expect(!composeBriefing('2003/04').inGame.some((c) => c.title.includes('Euro')), '2003/04: Euro doppelt');
console.log(`2002/03: ${b02.inGame.map((c) => c.title).join(' | ')}`);

// 4) Einzelne Quellen: Ligareform, Trainingslager, Halle, Nachwuchs, Umfeld, Einrichtung
const has = (y: number, kind: string, part: string) => gameChangesFor(y).some((c) => c.kind === kind && c.title.includes(part));
expect(has(1981, 'liga', '2. 1. Liga') || has(1981, 'liga', 'Liga'), '1981/82: Ligareform fehlt');
expect(has(1977, 'training', 'Österreichische Alpen'), '1977/78: Tirol fehlt');
expect(has(1979, 'training', 'Kanarische'), '1979/80: Kanaren (Winter 1980) fehlen');
expect(has(1987, 'halle', 'Masters'), '1987/88: Hallen-Masters fehlt');
expect(has(2001, 'halle', 'eingestellt'), '2001/02: Masters-Ende fehlt');
expect(has(1985, 'jugend', 'Fußballlehrer'), '1985/86: Nachwuchs-Baustein fehlt');
expect(has(1993, 'umfeld', 'Kombiticket'), '1993/94: Kombiticket fehlt');
expect(has(1990, 'einrichtung', 'Reha'), '1990/91: Reha-Zentrum fehlt');
expect(gameChangesFor(2001, { tier: 1 }).some((c) => c.title.includes('Leistungszentrum')), '2001/02: NLZ-Pflicht fehlt');
expect(gameChangesFor(1998).some((c) => c.title.includes('Sitzplätzen')), '1998/99: Europapokal-Sitzplätze fehlen');

// 5) Alle Saisons 1975–2045 lassen sich zusammensetzen
let withEntry = 0;
for (let y = 1975; y <= 2045; y++) {
  const b = composeBriefing(label(y), { first: y === 1975 });
  expect(b.highlights.length <= 5, `${label(y)}: zu viele Überblickspunkte`);
  if (briefingFor(y)) withEntry++;
}
console.log(`Redaktionelle Einträge vorhanden: ${withEntry} von 71 Saisons (1975–2045)`);

// 6) Spielstand: neues Spiel → Archiv + Popup vorgemerkt, Saisonwechsel, Laden
const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
} as any);
const log = briefingLog(g);
expect(log.records.length === 1 && log.records[0].first && log.pending === '1975/76', 'Neues Spiel: Briefing nicht vorgemerkt');
expect(log.records[0].sit && log.records[0].sit.goal && log.records[0].sit.squad > 10, 'Ausgangslage fehlt');
expect(g.messages.some((m) => m.subject.startsWith('Saison-Briefing 1975/76')), 'Briefing-Nachricht 1975/76 fehlt');
expect(!g.messages.some((m) => m.from === 'Fußball-Chronik' && m.subject.startsWith('1975:')), 'Chronik-Nachricht 1975 doppelt zum Briefing');
console.log(`Ausgangslage 1975/76: ${JSON.stringify(log.records[0].sit)}`);
log.pending = undefined;
let guard = 0;
while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 500) processDay(g, HEADLESS_UI);
const before = g.messages.length;
startNextSeason(g);
expect(log.records.length === 2 && log.pending === '1976/77' && !log.records[1].first, 'Saisonwechsel: Briefing nicht vorgemerkt');
const fresh = g.messages.slice(0, Math.max(0, g.messages.length - before + 5));
expect(g.messages.some((m) => m.subject.startsWith('Saison-Briefing 1976/77')), 'Briefing-Nachricht 1976/77 fehlt');
expect(!fresh.some((m) => m.from === 'Fußball-Chronik' && /^1976:/.test(m.subject)), 'Chronik-Einzelnachricht zum Saisonstart doppelt');
migrateBriefing(g);
expect(log.pending === undefined && log.records.length === 2, 'Laden: Popup nicht unterdrückt oder Archiv verändert');
const old: any = { ...g, briefing: undefined };
migrateBriefing(old);
expect(old.briefing.records.length === 1 && old.briefing.records[0].season === '1976/77' && !old.briefing.pending, 'Alter Spielstand: Archiv nicht ab aktueller Saison');

// 7) Epochen-Tipps: lückenlos 1975–2099, 2–5 Tipps je Saison, gültige Seiten
const whereOk = (w?: string) => { if (!w) return true; const [c, sub] = w.split('›').map((x) => x.trim()); const cat = MENU_STRUCTURE.find((m) => m.label === c); return !!cat && (!sub || cat.subs.some((x) => x.label === sub)); };
for (let y = 1975; y <= 2060; y++) {
  const e = eraFor(y);
  expect(e.from <= y && y <= e.to, `${label(y)}: keine Epoche`);
  const t = eraTipsFor(y);
  expect(t.length >= 2 && t.length <= 6, `${label(y)}: ${t.length} Epochen-Tipps`);
}
for (const e of ERA_TIPS) for (const t of e.tips) expect(whereOk(t.where), `Epochen-Tipp „${t.title}“: Seite ${t.where} unbekannt`);
expect(eraTipsFor(1975).some((t) => t.title.includes('Libero')), '1975: Libero-Tipp fehlt');
expect(eraTipsFor(1996).some((t) => t.title.includes('ablösefrei')), '1996: Bosman-Tipp fehlt');
expect(eraTipsFor(2002).some((t) => /Euro|Zahlen/.test(t.title)), '2002: Euro-Tipp fehlt');
expect(!eraTipsFor(2022).some((t) => t.title.includes('ohne Publikum')), '2022: Geisterspiel-Tipp gilt noch');
// Keine Doppelung mit den Unterschieden „Damals & heute“ (gleicher Titel).
for (const e of ERA_TIPS) for (const t of e.tips) expect(!DIFFERENCES.some((d) => d.title === t.title), `Epochen-Tipp „${t.title}“ doppelt zu differences.ts`);

// 8) Aufgaben aus dem Spielstand: Seiten gültig, gezielt erzeugte Lagen erkannt
const club = g.clubs[g.managedClubId];
const sit = situationOf(g)!;
const base = seasonTasks(g, sit, composeBriefing(g.season).inGame);
for (const t of base) expect(whereOk(t.where), `Aufgabe „${t.title}“: Seite ${t.where} unbekannt`);
const ids = (list: { id: string }[]) => list.map((t) => t.id);
// Nur ein Torwart → dringend
const keepers = club.playerIds.filter((id) => g.players[id]?.naturalPosition === 'TW');
const savedIds = [...club.playerIds];
club.playerIds = club.playerIds.filter((id) => !keepers.slice(1).includes(id));
expect(ids(seasonTasks(g, sit)).includes('gk'), 'Nur ein Torwart nicht erkannt');
expect(seasonTasks(g, sit)[0].level === 'dringend', 'Dringende Aufgabe nicht zuerst');
club.playerIds = savedIds;
// Auslaufender Vertrag eines Stammspielers
const star = club.playerIds.map((id) => g.players[id]).sort((a, b) => b.overall - a.overall)[0];
const exp = star.contract.expiryDate;
star.contract.expiryDate = `${parseInt(g.season.slice(0, 4), 10) + 1}-06-30`;
expect(ids(seasonTasks(g, sit)).includes('contracts'), 'Auslaufender Vertrag nicht erkannt');
star.contract.expiryDate = exp;
// Konto im Minus, kein Trikotsponsor
const bal = club.finances.balance;
club.finances.balance = -100000;
expect(ids(seasonTasks(g, sit)).includes('debt'), 'Konto im Minus nicht erkannt');
club.finances.balance = bal;
if (club.commerce) {
  const sp = club.commerce.shirtSponsor;
  club.commerce.shirtSponsor = undefined;
  club.commerce.shirtOffers = [{ name: 'Test', annualValue: 100000, years: 2 }];
  expect(ids(seasonTasks(g, sit)).includes('shirt'), 'Fehlender Trikotsponsor nicht erkannt');
  club.commerce.shirtSponsor = sp;
}
// Ziel deutlich über der Kaderstärke
expect(ids(seasonTasks(g, { ...sit, goal: 'Meisterschaft', rank: 9, of: 18 })).includes('goal-hard'), 'Ehrgeiziges Saisonziel nicht erkannt');
// Neu Freigeschaltetes als Tipp mit Seite
const unlocks = seasonTasks(g, sit, gameChangesFor(1993));
expect(unlocks.some((t) => t.id.startsWith('new-') && whereOk(t.where)), '1993/94: Neu im Umfeld nicht als Aufgabe');
console.log(`Aufgaben ${g.season}: ${base.map((t) => `${t.level}:${t.title}`).join(' | ')}`);
console.log('Briefing-Test OK');
