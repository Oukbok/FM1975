// Bewertungsrunden ohne UI: Ursachen-Protokoll (Summe der Beiträge = devPoints),
// Begründungen je Bewertung, Profil-Protokoll, alte Spielstände ohne Protokoll.
//   npm run test:ratings
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { CalendarEngine } from '../src/engine/calendar';
import { decompose } from '../src/engine/devLog';
import type { RatingResult } from '../src/engine/development';
import type { Player } from '../src/types';

let seed = 1978;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };

// 1) Zerlegung exakt: base · Π f = base + Σ Beiträge
for (const [base, fs] of [[0.11, [1.2, 0.8, 0.95, 1.3]], [-0.08, [0.7, 1.4]], [0.05, [1, 1]], [0.065, [0.3, 0.2, 1.1]]] as [number, number[]][]) {
  const parts = decompose(base, fs.map((f, i) => [`f${i}`, f] as [string, number]));
  const want = fs.reduce((a, f) => a * f, base);
  const got = parts.reduce((a, [, v]) => a + v, base);
  expect(Math.abs(want - got) < 1e-12, `Zerlegung ungenau: ${want} ≠ ${got}`);
}
expect(decompose(0.1, [['potenzial', 0], ['praxis', 1.2]])[0][1] === -0.1, 'Faktor 0 nimmt nicht die ganze Basis');

const g = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
} as any);
if (g.briefing) g.briefing.pending = undefined;
const club = g.clubs[g.managedClubId];
const own = () => club.playerIds.map((id) => g.players[id]).filter(Boolean) as Player[];

const ceremonies: { results: RatingResult[]; anlass: string }[] = [];
const ui = { ...HEADLESS_UI, onRatingCeremony: (c: { results: RatingResult[]; anlass: string }) => ceremonies.push(c) };

// 2) Bis zur Herbst-Bewertung; dabei sonntags die Summenregel prüfen.
let checks = 0, maxErr = 0;
const checkSums = () => {
  for (const p of own()) {
    const log = p.development.devLog;
    if (!log) continue;
    const sum = Object.values(log.parts).reduce((a, v) => a + v, log.start);
    maxErr = Math.max(maxErr, Math.abs(sum - (p.development.devPoints ?? 0)));
    checks++;
  }
};
let guard = 0;
while (ceremonies.length < 2 && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) {
  processDay(g, ui as any);
  if (new Date(g.calendar.currentDate + 'T00:00:00Z').getUTCDay() === 1) checkSums();
}
expect(ceremonies.length === 2, `Nur ${ceremonies.length} Bewertungsrunden erreicht (${g.calendar.currentDate})`);
expect(checks > 200, `Zu wenige Prüfungen (${checks})`);
expect(maxErr < 1e-6, `Summe der Beiträge ≠ devPoints (Abweichung ${maxErr})`);
console.log(`Summenregel: ${checks} Prüfungen, größte Abweichung ${maxErr.toExponential(1)}`);

// Fremde Vereine protokollieren nicht.
const foreign = Object.values(g.players).filter((p) => p.clubId !== g.managedClubId && p.development.devLog);
expect(foreign.length === 0, `${foreign.length} Spieler fremder Vereine mit Protokoll`);

// 3) Begründungen: zweite Runde (vollständig protokolliert) – jede Auf-/Abwertung begründet.
const r2 = ceremonies[1].results;
expect(r2.length >= 15, 'Zu wenige Ergebnisse');
for (const r of r2) {
  expect(r.reasons && r.reasons.length > 0, `${r.playerName}: keine Begründung`);
  const weighted = r.reasons!.filter((x) => x.v !== 0);
  if (!r.generic) expect(weighted.length > 0, `${r.playerName}: keine gewichtete Ursache`);
  const d = r.newOverall - r.oldOverall;
  if (d !== 0 && !r.generic) {
    expect(weighted.some((x) => Math.sign(x.v) === Math.sign(d)), `${r.playerName}: keine Ursache in Richtung ${d}`);
    expect(Math.sign(weighted[0].v) === Math.sign(d), `${r.playerName}: erste Ursache nicht in Ergebnisrichtung`);
  }
  for (const x of r.reasons!) expect(x.text && !/undefined|NaN/.test(x.text), `${r.playerName}: kaputter Text „${x.text}“`);
}
const generic2 = r2.filter((r) => r.generic).length;
expect(generic2 <= 2, `${generic2} allgemeine Begründungen in der zweiten Runde`);
const sample = r2.filter((r) => r.newOverall !== r.oldOverall).slice(0, 4);
for (const r of sample) console.log(`  ${r.playerName} ${r.oldOverall}→${r.newOverall}: ${r.reasons!.map((x) => `${x.v > 0 ? '+' : x.v < 0 ? '−' : '·'} ${x.text}`).join(' | ')}`);

// 4) Profil: Protokoll je Bewertung am Spieler, neues Protokoll begonnen.
for (const p of own()) {
  const rl = p.development.ratingLog ?? [];
  expect(rl.length >= 1 && rl[rl.length - 1].label === ceremonies[1].anlass, `${p.fullName}: Bewertung fehlt im Profil-Protokoll`);
  const dl = p.development.devLog;
  expect(dl && dl.weeks === 0 && Math.abs(Object.values(dl.parts).reduce((a, v) => a + v, dl.start) - (p.development.devPoints ?? 0)) < 1e-9, `${p.fullName}: Protokoll nicht neu begonnen`);
}
expect((g.ratingRounds ?? []).length === 2, 'Bilanz der Runden fehlt');

// 5) Alter Spielstand: kein Protokoll → allgemeine Begründung, danach wieder vollständig.
for (const p of own()) delete p.development.devLog;
guard = 0;
while (ceremonies.length < 3 && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) processDay(g, ui as any);
const r3 = ceremonies[2]?.results ?? [];
expect(r3.length > 0, 'Dritte Runde fehlt');
const partialOrGeneric = r3.filter((r) => r.generic).length;
console.log(`Alter Spielstand: ${partialOrGeneric} von ${r3.length} mit allgemeiner Begründung (Rest: Protokoll ab Laden reicht)`);
for (const r of r3) expect(r.reasons && r.reasons.length > 0, `${r.playerName}: keine Begründung (alter Spielstand)`);
console.log('Bewertungsrunden: alles in Ordnung.');
