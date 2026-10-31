// Jugend-Test ohne UI: volle Mannschaften, Jahreswechsel über 15 Jahre,
// Anteil der Profis, Rekrutierungs-Ereignisse (Verteilung, Zufallswurf).
//   node scripts/run-ts.mjs tests/youth-test.ts
import { createNewGame } from '../src/game/newGame';
import { ensureYouthTeams, fillYouthTeams, youthTeamsSeasonChange, YOUTH_TEAM_SIZE } from '../src/game/youthTeams';
import { eligibleRecruitEvents, makeRecruits } from '../src/game/youthRecruit';
import { YOUTH_RECRUIT_EVENTS } from '../src/data/youthRecruitEvents';
import { academyIntake, ageYouthPlayers, graduateYouth } from '../src/engine/youth';
import { youthAgeClass, YOUTH_AGE_CLASS_ORDER } from '../src/types';
import { migrateYouthInvest, monthlyYouthInvest, quoteUpgrade, startUpgrade, youthInvestOf, youthInvestSeasonStart, aiYouthInvest, setYouthBudget } from '../src/game/youthInvest';
import { annualCostBase, cpuPromotionPolicy, initialInvest, nlzMissing, reserveMinutesFor, targetQuality } from '../src/engine/youthAcademy';
import { leagueClubs } from '../src/game/season';

let seed = 5;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const club = g.clubs[g.managedClubId];
ensureYouthTeams(g, '1975-07-01');
const count = () => {
  const c: Record<string, number> = {};
  for (const id of club.youthPlayerIds) { const k = youthAgeClass(g.youthPlayers[id].age) ?? '?'; c[k] = (c[k] ?? 0) + 1; }
  return YOUTH_AGE_CLASS_ORDER.map((k) => `${k}:${c[k] ?? 0}/${YOUTH_TEAM_SIZE[k]}`).join(' ');
};
console.log('Start:', club.youthPlayerIds.length, 'Spieler –', count());
for (const k of YOUTH_AGE_CLASS_ORDER) {
  const n = club.youthPlayerIds.filter((id) => youthAgeClass(g.youthPlayers[id].age) === k).length;
  if (n < YOUTH_TEAM_SIZE[k]) fail(`${k}-Jugend nicht voll (${n})`);
}

// 15 Jahrgangswechsel
let promoted = 0, released = 0;
for (let y = 1976; y <= 1990; y++) {
  const date = `${y}-07-01`;
  ageYouthPlayers(club, g.youthPlayers);
  const grad = graduateYouth(club, g.players, g.youthPlayers, true, 40);
  promoted += grad.promoted.length; released += grad.released.length;
  for (const p of academyIntake(club, date, `${y}`)) { g.youthPlayers[p.id] = p; club.youthPlayerIds.push(p.id); }
  youthTeamsSeasonChange(g, date);
  fillYouthTeams(g, date);
}
console.log(`Nach 15 Jahren: ${club.youthPlayerIds.length} Spieler – ${count()}`);
console.log(`A-Jugend-Abgänger: ${promoted} Profis, ${released} ohne Vertrag (${Math.round(promoted / Math.max(1, promoted + released) * 100)} % schaffen es)`);
if (promoted / (promoted + released) > 0.35) fail('Zu viele schaffen es zum Profi');
if (promoted < 5) fail('Kaum jemand schafft es zum Profi');

// Ereignisse
console.log(`Ereignisse im Katalog: ${YOUTH_RECRUIT_EVENTS.length}`);
if (YOUTH_RECRUIT_EVENTS.length < 50) fail('Weniger als 50 Ereignisse');
for (const y of [1976, 1991, 2005, 2020]) console.log(`  möglich ${y}: ${eligibleRecruitEvents(y, 7, {}, `${y}-07-01`).length}`);
const stars: number[] = [];
let lucky = 0, flop = 0;
let s2 = 1;
const r = () => { s2 = (s2 * 48271) % 2147483647; return s2 / 2147483647; };
for (let i = 0; i < 1400; i++) {
  const ev = YOUTH_RECRUIT_EVENTS[i % YOUTH_RECRUIT_EVENTS.length];
  const { players, luck } = makeRecruits(g, ev, `1980-0${(i % 9) + 1}-01`, r);
  stars.push(players[0].potentialStars);
  if (luck > 0.5) lucky++; if (luck < 0) flop++;
  const bad = Object.values(players[0].attributes).some((v) => !Number.isFinite(v as number) || (v as number) < 1 || (v as number) > 100);
  if (bad) fail(`Ungültige Attribute bei ${ev.id}`);
}
stars.sort((a, b) => a - b);
const q = (x: number) => stars[Math.floor(stars.length * x)].toFixed(2);
console.log(`Rekruten-Potenzial: 10% ${q(0.1)} · Median ${q(0.5)} · 90% ${q(0.9)} · Max ${stars[stars.length - 1].toFixed(2)} · Glücksgriffe ${lucky} · Blender ${flop}`);

// ---------------------------------------------------------------------------
// Nachwuchs-Investitionen (engine/youthAcademy.ts, game/youthInvest.ts)
// ---------------------------------------------------------------------------
{
  const h = createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  const lc = leagueClubs(h);
  if (lc.some((c) => !c.youthInvest)) fail('youthInvest fehlt nach neuem Spiel');
  const snap = JSON.stringify(lc.map((c) => c.youthInvest));
  migrateYouthInvest(h);
  if (JSON.stringify(lc.map((c) => c.youthInvest)) !== snap) fail('Migration nicht idempotent');
  // Alte Spielstände: ohne youthInvest → aus der Akademie-Stufe ableiten.
  delete (lc[0] as any).youthInvest;
  migrateYouthInvest(h);
  if (!lc[0].youthInvest) fail('Migration legt youthInvest nicht an');
  // Kosten 1975 auf Zielniveau (Erstligist ≈ 4,5 Mio. DM Umsatz): typisch 60–250 Tsd.
  const costs = lc.map((c) => annualCostBase(c.youthInvest!)).sort((a, b) => a - b);
  console.log(`Nachwuchskosten 1975 (Basis): min ${costs[0]} · Median ${costs[costs.length >> 1]} · max ${costs[costs.length - 1]}`);
  if (costs[costs.length >> 1] < 50000 || costs[costs.length >> 1] > 250000) fail('Nachwuchskosten 1975 unrealistisch');
  // Epochen-Sperre: Jugendhaus erst ab 1988, Eliteschule ab 2006.
  const my = h.clubs[h.managedClubId];
  const inv = youthInvestOf(my, 1975);
  inv.levels.boarding = 1;
  if (quoteUpgrade(my, 'boarding', 1975).ok) fail('Internat 1975 schon möglich');
  if (!quoteUpgrade(my, 'boarding', 1990).ok) fail('Internat 1990 nicht möglich');
  // Ausbau mit Bauzeit und verzögerter Wirkung.
  const bal0 = my.finances.balance;
  inv.levels.pitches = 1; inv.builds = [];
  const msg = startUpgrade(h, my, 'pitches', '1975-07-01');
  if (!inv.builds.length) fail('Ausbau ohne Bauzeit: ' + msg);
  if (my.finances.balance >= bal0) fail('Baukosten nicht gebucht');
  inv.levels.coaches = 3; inv.coachCount = 9; setYouthBudget(my, 100000, 1975);
  const q0 = inv.quality;
  const goal = targetQuality(my, inv, 1975);
  for (let m = 0; m < 12; m++) { h.youthInvestTick = undefined; monthlyYouthInvest(h, `19${75 + Math.floor((6 + m) / 12)}-${String(((6 + m) % 12) + 1).padStart(2, '0')}-01`); }
  const moved = (inv.quality - q0) / Math.max(1, goal - q0);
  console.log(`Ausbildung: Start ${q0.toFixed(1)} → nach 1 Jahr ${inv.quality.toFixed(1)} (Ziel ${targetQuality(my, inv, 1976).toFixed(1)}, ${(moved * 100).toFixed(0)} % des Wegs) · Plätze Stufe ${inv.levels.pitches}`);
  if (inv.levels.pitches !== 2) fail('Bau nicht fertig geworden');
  if (moved < 0.1 || moved > 0.4) fail('Wirkung nicht verzögert (Ziel ≈ 20 %/Jahr)');
  // Zweite Mannschaft: Reserve-Minuten nur für U23 ohne Profi-Einsatz.
  inv.levels.reserve = 1;
  if (reserveMinutesFor(my, 20, 0) <= 0 || reserveMinutesFor(my, 25, 0) !== 0 || reserveMinutesFor(my, 20, 90) !== 0) fail('Reserve-Minuten falsch');
  // KI: Jugend-Trainer investiert mehr als Einkaufs-Trainer.
  const [a, b] = [lc[1], lc[2]];
  a.youthInvest = initialInvest(a, 1980); b.youthInvest = initialInvest(b, 1980);
  a.coach = { ...(a.coach as any), philosophy: 'jugend' }; b.coach = { ...(b.coach as any), philosophy: 'einkauf' };
  a.reputation = b.reputation = 70; a.finances.balance = b.finances.balance = 1e8;
  for (let y = 1980; y < 1990; y++) { aiYouthInvest(h, a, `${y}-07-03`, 4.5e6 * 2); aiYouthInvest(h, b, `${y}-07-03`, 4.5e6 * 2); a.youthInvest!.builds = []; b.youthInvest!.builds = []; }
  console.log(`KI 1990: Jugend-Trainer ${annualCostBase(a.youthInvest!)} / Einkaufs-Trainer ${annualCostBase(b.youthInvest!)} (Basis/Jahr) · Hochziehen ${JSON.stringify(cpuPromotionPolicy(a))} vs ${JSON.stringify(cpuPromotionPolicy(b))}`);
  if (annualCostBase(a.youthInvest!) <= annualCostBase(b.youthInvest!)) fail('Philosophie „jugend“ investiert nicht mehr');
  // NLZ-Pflicht: KI erfüllt sie ab 2001 automatisch.
  h.calendar.currentDate = '2001-07-01';
  h.youthRace = undefined;
  youthInvestSeasonStart(h, '2001-07-01');
  const viol = lc.filter((c) => c.id !== h.managedClubId && nlzMissing(c, c.youthInvest!).length);
  if (viol.length) fail(`KI ohne Leistungszentrum: ${viol.map((c) => c.shortName).join(', ')}`);
  // Wettbewerb um Talente.
  const race = h.youthRace!;
  const got = race.entries.filter((e) => e.to);
  console.log(`Talentwettbewerb 2001: ${race.entries.length} Talente, ${got.length} an Ligavereine, eigene Anziehung Platz ${race.myRank}/${race.clubs}`);
  if (race.entries.length < 10 || !got.length) fail('Wettbewerb um Talente leer');
  if (got.some((e) => !h.youthPlayers[e.playerId!])) fail('Talent nicht in der Akademie angekommen');
  youthInvestSeasonStart(h, '2001-07-01');
  if (h.youthRace!.entries !== race.entries) fail('Wettbewerb lief zweimal im selben Jahr');
}
console.log('Jugend-Test bestanden.');
