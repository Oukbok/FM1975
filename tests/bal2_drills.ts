// Scratch (bal2): Wirkung der Taktik-Inhalte je Programm auf die Stärke (ungerundet), je Alter.
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { applyCampDrills, CampDrillId, drillChance } from '../src/engine/campProgram';
import { familiarity, footFactor, rawSuitability } from '../src/engine/positions';
import type { Player } from '../src/types';
let seed = 7; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
const ps = leagueClubs(g).flatMap((c) => c.playerIds.map((id) => g.players[id])).filter((p): p is Player => !!p && !p.isYouth);
const raw = (p: Player) => rawSuitability(p, p.naturalPosition) * familiarity(p, p.naturalPosition) * footFactor(p, p.naturalPosition);
const sets: Record<string, CampDrillId[]> = {
  standards: ['abwehr', 'kurzpass', 'langball', 'ecken', 'freistoss', 'elfmeter'],
  kern: ['abwehr', 'aufbau', 'kurzpass', 'langball', 'torwart'],
  kern2: ['pressing', 'aufbau', 'kurzpass', 'torwart'],
  voll8: ['abwehr', 'konter', 'aufbau', 'kurzpass', 'langball', 'torwart'],
};
const ag = (a: number) => (a <= 21 ? 0 : a <= 24 ? 1 : a <= 27 ? 2 : a <= 30 ? 3 : 4);
const R = Number(process.argv[2] ?? 20);
for (const [name, drills] of Object.entries(sets)) {
  const d = [0, 0, 0, 0, 0], n = [0, 0, 0, 0, 0], u = [0, 0, 0, 0, 0];
  let r = 1;
  const rng = () => { r = (r * 48271) % 2147483647; return r / 2147483647; };
  for (let k = 0; k < R; k++) for (const p0 of ps) {
    const p = structuredClone(p0);
    const b = raw(p);
    const out = applyCampDrills(p, drills, 9, 1, rng);
    const i = ag(p.age); d[i] += raw(p) - b; n[i]++; u[i] += out.length;
  }
  console.log(name.padEnd(10), ['≤21', '22–24', '25–27', '28–30', '31+'].map((l, i) => `${l}: +1 ${(u[i] / n[i]).toFixed(2)} OVR ${(d[i] / n[i]).toFixed(3)}`).join(' | '));
}
const c25 = ps.filter((p) => p.age >= 25 && p.age <= 27);
console.log('Chance Ø 25–27', (c25.reduce((a, p) => a + drillChance(p, 9), 0) / c25.length).toFixed(3));
