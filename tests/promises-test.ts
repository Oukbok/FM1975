// Versprechen zum ersten Training ohne UI: Reaktion je Persönlichkeit, Auslösen am
// ersten Trainingstag, Auswahl/Grenzen, Prüfung über die Saison, Bilanz am Saisonende,
// alte Spielstände (kein Popup mitten in der Saison).
//   npm run test:promises [saisons]   (Standard 3)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { makePersona } from '../src/engine/persona';
import { MAX_SEASON_PROMISES, SEASON_PROMISES, reactionOf, type ReactorIn, type SeasonPromiseId } from '../src/engine/seasonPromises';
import {
  giveSeasonPromises, listeners, makeBase, pendingSeasonPromises, promiseStatus, spRecord, spState, unavailableWhy,
} from '../src/game/seasonPromisesGame';
import { trustOf } from '../src/game/promises';
import type { Game } from '../src/game/state';
import type { Player } from '../src/types';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };

// 1) Reaktion je Persönlichkeit (reine Rechnung)
const persona = (o: Partial<ReturnType<typeof makePersona>>) => ({ v: 1 as const, ehrgeiz: 50, loyalitaet: 50, geld: 50, heimat: 50, abenteuer: 50, rampenlicht: 50, familie: 50, ...o });
const R = (x: Partial<ReactorIn>, picks: SeasonPromiseId[], realism = 0.8, trust = 70) =>
  reactionOf({ persona: persona({}), prof: 50, age: 26, rank: 8, stamina: 65, homegrown: false, ...x }, picks, () => realism, trust).total;
const amb = { persona: persona({ ehrgeiz: 85, rampenlicht: 70 }) };
expect(R(amb, ['meister'], 0.85) > R({}, ['meister'], 0.85), 'Ehrgeizige mögen realistische Titelziele nicht mehr');
expect(R({ ...amb, prof: 80 }, ['meister'], 0.04, 30) < 0, 'Tollkühnes Ziel bei geringer Glaubwürdigkeit macht Profis nicht skeptisch');
expect(R({}, ['meister'], 0.3, 95) > R({}, ['meister'], 0.3, 20), 'Glaubwürdigkeit wirkt nicht');
expect(R({ rank: 3 }, ['rotation']) < 0 && R({ rank: 18 }, ['rotation']) > 0, 'Rotation: Stamm dagegen, Ergänzung dafür – verletzt');
expect(R({ age: 19 }, ['jugend']) > 0 && R({ age: 31, rank: 5 }, ['jugend']) < 0, 'Jugend: Junge dafür, Routiniers dagegen – verletzt');
expect(R({ prof: 85 }, ['disziplin']) > R({ prof: 25 }, ['disziplin']), 'Profis mögen Disziplin nicht mehr');
expect(R({ persona: persona({ heimat: 85, loyalitaet: 80 }) }, ['boerse']) < 0, 'Heimatverbundene mögen den Börsengang');
const many: SeasonPromiseId[] = ['stimmung', 'trainingsanlagen', 'stadion', 'treue', 'ziel'];
expect(R({ prof: 80 }, many) < R({ prof: 80 }, many.slice(0, 3)) + 2, 'Viele Versprechen wirken nicht unglaubwürdiger');
console.log('Reaktionen: Persönlichkeit, Realismus, Glaubwürdigkeit, Rolle – ok');

// 2) Spielablauf
const g: Game = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
(g as any).simAutoManage = true;

function runUntilPending(label: string): number {
  let days = 0;
  while (!pendingSeasonPromises(g)) {
    const ok = processDay(g, HEADLESS_UI);
    days++;
    if (pendingSeasonPromises(g)) { expect(!ok, `${label}: Zeitlauf hält für das erste Training nicht an`); break; }
    if (days > 60) fail(`${label}: kein erstes Training nach 60 Tagen`);
  }
  return days;
}
function runSeason(label: string) {
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    processDay(g, HEADLESS_UI);
    expect(!pendingSeasonPromises(g), `${label}: Popup erneut fällig am ${g.calendar.currentDate}`);
    if (++guard > 1000) fail('Saison endet nicht');
  }
}

const d1 = runUntilPending('1975/76');
console.log(`1975/76: erstes Training am ${g.calendar.currentDate} (nach ${d1} Tagen)`);
const base = makeBase(g);
expect(unavailableWhy(g, 'aufstieg', base), 'Aufstieg in der höchsten Klasse wählbar');
expect(unavailableWhy(g, 'boerse', base), 'Börse 1975 wählbar');
expect(!unavailableWhy(g, 'meister', base), 'Meister in der Bundesliga nicht wählbar');
expect(!unavailableWhy(g, 'pokal', base), 'Pokal nicht wählbar, obwohl Teilnehmer');
const ls = listeners(g);
expect(ls.length >= 11 && (ls[0].captain || ls[0].influence >= ls[1].influence), 'Zuhörer nicht nach Kapitän/Einfluss sortiert');
const moraleBefore = new Map(ls.map((l) => [l.p.id, l.p.moraleScore ?? 60]));
const trust0 = trustOf(g);
const rec = giveSeasonPromises(g, ['meister', 'pokal', 'rotation', 'stimmung', 'disziplin', 'aufstieg', 'ziel']);
expect(rec.picks.length === MAX_SEASON_PROMISES, `Höchstzahl nicht beachtet (${rec.picks.length})`);
expect(!rec.picks.some((p) => p.id === 'aufstieg'), 'Ausgegrautes Versprechen angenommen');
expect(!pendingSeasonPromises(g), 'Popup nach dem Versprechen weiter fällig');
const jolted = ls.filter((l) => (l.p.moraleScore ?? 60) !== moraleBefore.get(l.p.id)).length;
expect(jolted > 0, 'Keine sofortige Moral-Reaktion');
expect(Object.keys(rec.react ?? {}).length === ls.length, 'Reaktionen nicht gespeichert');
console.log(`Versprochen: ${rec.picks.map((p) => p.id).join(', ')} – ${jolted} Spieler mit Moral-Sprung`);

runSeason('1975/76');
expect(rec.mid, 'Kein Zwischenstand am 2. Januar');
expect(g.messages.some((m) => m.subject === 'Halbzeit: deine Versprechen'), 'Zwischenstand-Nachricht fehlt');
for (const p of rec.picks) { const st = promiseStatus(g, rec, p); expect(st.text !== undefined, `Kein Stand für ${p.id}`); }
startNextSeason(g);
expect(rec.done && rec.picks.every((p) => p.r), 'Nicht alle Versprechen ausgewertet');
const kept = rec.picks.filter((p) => p.r === 'kept').length, broken = rec.picks.length - kept;
expect(trustOf(g) === Math.max(0, Math.min(100, trust0 + kept * 4 - broken * 8)) || trustOf(g) !== trust0, 'Glaubwürdigkeit unverändert');
expect(g.messages.some((m) => m.subject.startsWith('Bilanz deiner Versprechen 1975/76')), 'Bilanz-Nachricht fehlt');
console.log(`1975/76: ${kept} gehalten, ${broken} gebrochen – ${rec.picks.map((p) => `${p.id}=${p.r}${p.note ? ` (${p.note})` : ''}`).join('; ')}; Glaubwürdigkeit ${trust0} → ${trustOf(g)}`);

// 3) Weitere Saisons: jedes Jahr fällig, zufällige Auswahl, ohne Versprechen möglich
const seasons = Number(process.argv[2] ?? 3);
let total = 0, totKept = 0;
for (let s = 1; s < seasons; s++) {
  runUntilPending(g.season);
  const opts = SEASON_PROMISES.filter((d) => !unavailableWhy(g, d.id)).map((d) => d.id);
  const pick = s % 2 ? opts.filter(() => Math.random() < 0.3).slice(0, 4) : [];
  const r = giveSeasonPromises(g, pick);
  const season = g.season;
  runSeason(season);
  startNextSeason(g);
  expect(!r.picks.length || (r.done && r.picks.every((p) => p.r)), `${season}: nicht ausgewertet`);
  total += r.picks.length; totKept += r.picks.filter((p) => p.r === 'kept').length;
  console.log(`${season}: ${r.picks.length ? r.picks.map((p) => `${p.id}=${p.r}`).join(', ') : 'ohne Versprechen'}`);
}
console.log(`Weitere Saisons: ${totKept}/${total} gehalten, Archiv ${spState(g)!.seasons.length} Saisons`);

// 4) Alter Spielstand mitten in der Saison: kein Popup, erst zur nächsten Saison.
runUntilPending(g.season);
giveSeasonPromises(g, []);
for (let i = 0; i < 80; i++) processDay(g, HEADLESS_UI);
delete (g as Game & { seasonPromises?: unknown }).seasonPromises;
for (let i = 0; i < 20; i++) { processDay(g, HEADLESS_UI); expect(!pendingSeasonPromises(g), 'Popup mitten in der Saison bei altem Spielstand'); }
expect(!spRecord(g), 'Datensatz mitten in der Saison angelegt');
// Spieler-Typen unbeeinträchtigt
const any = Object.values(g.players)[0] as Player;
expect(any && typeof any.id === 'string', 'Spieler kaputt');
console.log('Alter Spielstand: kein Popup mitten in der Saison – ok');
console.log('test:promises OK');
