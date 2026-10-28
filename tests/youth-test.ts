// Jugend-Test ohne UI: volle Mannschaften, Jahreswechsel über 15 Jahre,
// Anteil der Profis, Rekrutierungs-Ereignisse (Verteilung, Zufallswurf).
//   node scripts/run-ts.mjs tests/youth-test.ts
import { createNewGame } from '../src/game/newGame';
import { ensureYouthTeams, fillYouthTeams, youthTeamsSeasonChange, YOUTH_TEAM_SIZE } from '../src/game/youthTeams';
import { eligibleRecruitEvents, makeRecruits } from '../src/game/youthRecruit';
import { YOUTH_RECRUIT_EVENTS } from '../src/data/youthRecruitEvents';
import { academyIntake, ageYouthPlayers, graduateYouth } from '../src/engine/youth';
import { youthAgeClass, YOUTH_AGE_CLASS_ORDER } from '../src/types';

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
console.log('Jugend-Test bestanden.');
