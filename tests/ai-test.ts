// Manager-KI-Test ohne UI: Trainer der KI-Vereine, Kaderplanung im Sommer-
// fenster, eigener Verein bleibt unberührt, Druck/Karussell, Migration.
//   npm run test:ai
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { aiWindowClose, migrateAiClubs, needBidders } from '../src/game/aiClubs';
import { coachClubs, coachSeasonReview, ensureCoaches } from '../src/game/coachCarousel';
import { assessSquad, coachTactics, makeCoach, pressureTarget } from '../src/engine/aiManager';
import { getFormation } from '../src/data/formations';
import { Game } from '../src/game/state';
import { LeagueTableRow } from '../src/types';

let seed = 4711;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
function fresh(): Game {
  return createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}

// 1) Trainer beim neuen Spiel
const g = fresh();
const own = g.clubs[g.managedClubId];
if (own.coach) fail('eigener Verein hat einen KI-Trainer');
const ai = coachClubs(g);
if (ai.length < 15) fail(`zu wenige KI-Vereine (${ai.length})`);
for (const c of ai) {
  const k = c.coach;
  if (!k) fail(`${c.name} ohne Trainer`);
  if (!k.name.includes(' ') || k.age < 30 || k.age > 70) fail(`Trainer unplausibel: ${JSON.stringify(k)}`);
  if (k.reputation < 0 || k.reputation > 100 || k.pressure < 0 || k.pressure > 100) fail('Werte außerhalb 0–100');
  if (!['offensiv', 'ausgewogen', 'defensiv', 'konter'].includes(k.style)) fail('Stil unbekannt');
  if (getFormation(c.tactics.formation).id !== c.tactics.formation) fail(`${c.name}: Formation unbekannt (${c.tactics.formation})`);
  const want = { offensiv: 'attacking', ausgewogen: 'balanced', defensiv: 'defensive', konter: 'counter' }[k.style];
  if (c.tactics.style !== want) fail(`${c.name}: Taktikstil ${c.tactics.style} passt nicht zum Trainer (${k.style})`);
  if (c.tactics.startingXI.length !== 11) fail(`${c.name}: keine volle Startelf`);
}
const nat = new Set(ai.map((c) => c.coach!.nationality));
console.log(`Trainer: ${ai.length} KI-Vereine, Nationalitäten ${[...nat].join('/')}, z. B. ${ai[0].name}: ${ai[0].coach!.name} (${ai[0].coach!.style}, ${ai[0].tactics.formation})`);

// Ära: 2010 keine Libero-Formation mehr als Lieblingsformation
for (let i = 0; i < 40; i++) {
  const k = makeCoach(2010, 70, '2010-07-01', Math.random);
  if (k.preferredFormation?.startsWith('libero')) fail('Libero als Lieblingsformation 2010');
}
const k2010 = { ...ai[0].coach!, style: 'offensiv' as const, preferredFormation: '4-3-3' };
if (coachTactics(ai[0], g.players, k2010, 2010).formation.startsWith('libero')) fail('Libero-Formation 2010 gewählt');

// 2) Sommerfenster: KI kauft nach Bedarf, eigener Verein bleibt unberührt
for (const id of own.playerIds) g.players[id].contract.expiryDate = '1990-06-30';
const ownBefore = [...own.playerIds].sort().join(',');
const ownBalance = own.finances.balance;
const clubOf = new Map(Object.values(g.players).map((p) => [p.id, p.clubId]));
let guard = 0;
while (g.calendar.currentDate < '1975-09-01' && guard++ < 200) processDay(g, HEADLESS_UI);
if ([...own.playerIds].sort().join(',') !== ownBefore) fail('eigener Kader wurde automatisch verändert');
void ownBalance;
const arrivals = Object.entries(g.aiMarket?.arrivals ?? {}).filter(([k]) => !k.includes('#')).reduce((s, [, v]) => s + v, 0);
const moved = Object.values(g.players).filter((p) => clubOf.has(p.id) && clubOf.get(p.id) !== p.clubId && g.clubs[p.clubId]).length;
console.log(`Sommer 1975: ${arrivals} Zugänge der KI-Vereine, ${moved} Wechsel zwischen Ligavereinen`);
if (arrivals < ai.length * 1.5) fail(`zu wenige Zugänge (${arrivals})`);
if (arrivals > ai.length * 8) fail(`zu viele Zugänge (${arrivals})`);
for (const c of ai) {
  if (c.playerIds.length < 20 || c.playerIds.length > 28) fail(`${c.name}: Kadergröße ${c.playerIds.length}`);
  for (const id of c.playerIds) if (g.players[id]?.clubId !== c.id) fail(`${c.name}: Kaderliste inkonsistent`);
}

// 3) Bedarf: Verein ohne Ersatztorhüter sucht einen Torwart
const needy = ai.find((c) => c.playerIds.length >= 21)!;
const keepers = needy.playerIds.filter((id) => g.players[id].naturalPosition === 'TW');
for (const id of keepers.slice(1)) { needy.playerIds = needy.playerIds.filter((x) => x !== id); delete g.players[id]; }
const a = assessSquad(needy.playerIds.map((id) => g.players[id]), needy.tactics.formation);
if (a.groups.TW.score < 8) fail(`Torwartmangel nicht erkannt (Bedarf ${a.groups.TW.score})`);
needy.finances.transferBudget = 50_000_000;
const gk = Object.values(g.players).filter((p) => p.naturalPosition === 'TW' && p.clubId === own.id).sort((x, y) => y.overall - x.overall)[0];
if (gk && !needBidders(g, gk, 1000).some((c) => c.id === needy.id)) fail('Bedarfsbieter für Torwart fehlt');
console.log(`Bedarf ${needy.name}: Tor ${a.groups.TW.score.toFixed(0)}, Reihenfolge ${a.order.slice(0, 3).map((x) => x.group).join(' > ')}`);

// 4) Vorstandsdruck
const row = (pos: number, form: ('W' | 'D' | 'L')[]): LeagueTableRow => ({ clubId: 'x', position: pos, previousPosition: pos, played: 12, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form });
const low = pressureTarget(row(17, ['L', 'L', 'L', 'D', 'L']), 18, 6, 50);
const high = pressureTarget(row(2, ['W', 'W', 'D', 'W', 'W']), 18, 8, 50);
console.log(`Druck: Platz 17 statt 6 → ${low.toFixed(0)}, Platz 2 statt 8 → ${high.toFixed(0)}`);
if (low < 85 || high > 15) fail('Druckformel unplausibel');

// 5) Karussell zum Saisonende: Ruhestand, Nachfolger, Historie, Pool
const victim = coachClubs(g)[0];
victim.coach!.age = 69;
const oldName = victim.coach!.name;
coachSeasonReview(g, '1976-06-30', Math.random);
if (!victim.coach || victim.coach.name === oldName) fail('kein Nachfolger nach Ruhestand');
if (!victim.coachHistory?.some((h) => h.name === oldName && h.reason === 'ruhestand')) fail('Historie ohne Ruhestand');
if (g.clubs[g.managedClubId].coach) fail('eigener Verein bekam einen Trainer');

// 6) Migration alter Spielstände
for (const c of coachClubs(g)) { delete c.coach; delete c.coachHistory; }
delete g.coachPool; delete g.aiMarket;
migrateAiClubs(g);
if (coachClubs(g).some((c) => !c.coach)) fail('Migration ohne Trainer');
if (ensureCoaches(g, g.calendar.currentDate) !== 0) fail('ensureCoaches nicht idempotent');
// Fensterschluss ohne Marktstand darf nicht scheitern
aiWindowClose(g, '1976-01-31');

console.log('Manager-KI-Test bestanden.');
