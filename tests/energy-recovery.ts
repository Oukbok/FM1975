// =============================================================================
// Frische zwischen den Spielen (Wunsch Pascal: „je niedriger, desto mehr Energie pro Tag,
// die letzten Punkte langsamer; in englischen Wochen wieder spielfit“):
//   node scripts/run-ts.mjs tests/energy-recovery.ts [durchläufe=6]
// 1. Tabelle: Erholung je Tag nach Ausgangswert × Training (Rechnung aus engine/form.ts).
// 2. Spielablauf wie game/day.ts: eigener Verein spielt Sa – Mi – Sa – Sa (volle Match-Engine,
//    Frische nach dem Spiel aus der gemerkten Belastung), dazwischen Wochenplan mit Spiel-Sperren
//    (Tag nach dem Spiel = Regeneration) bzw. Vorlage „Englische Woche“; gemessen wird die Frische
//    der Startelf am Morgen jedes Spieltags. Prüft: ≥ 85 vor dem Mittwochs-/Samstagsspiel, nicht alle 100.
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchEngine } from '../src/engine/match';
import { applyMatchEffects, freshnessGain, trainingFreshCost, trainingRecoveryFactor } from '../src/engine/form';
import { applyDailyTraining, createDefaultWeeklyPlan, dayLoad } from '../src/engine/weeklyTraining';
import { dailyRecovery } from '../src/engine/training';
import { PLAN_TEMPLATES, addDaysISO, effectiveDay, locksFor, weekdayIdx, type OwnFixture } from '../src/engine/trainingPlan';
import type { DaySlots, Player } from '../src/types';

const RUNS = Number(process.argv[2] ?? 6);
let seed = 7;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// --- 1. Tabelle -------------------------------------------------------------------------------
const LOADS: [string, number | undefined][] = [['Regeneration (−4)', -4], ['frei (0)', 0], ['Spieltag/KI', undefined], ['normal (6,5)', 6.5], ['hart (10)', 10], ['sehr hart (16)', 16]];
console.log('Erholung je Tag (Ausdauer 70, Alter 26 → Personenfaktor 1,05)');
const pf = 1 + (((70 - 50) / 50) * 2.5) / 15;
console.log('Frische   ' + LOADS.map(([n]) => n.padStart(18)).join(''));
for (const fr of [40, 50, 60, 70, 80, 90, 95, 98]) {
  console.log(String(fr).padEnd(10) + LOADS.map(([, l]) => (freshnessGain(fr, trainingRecoveryFactor(l), pf) - trainingFreshCost(l)).toFixed(1).padStart(18)).join(''));
}

// --- 2. Spielablauf ----------------------------------------------------------------------------
const g = createNewGame({
  managedClubId: 'mgl', manager: { name: 'Sim', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: false, speedMs: 300,
});
setEraYear(1995);
const me = g.clubs[g.managedClubId];
const opps = leagueClubs(g).filter((c) => c.id !== me.id);
const SAT = '1995-09-02';
const MATCHES = [SAT, addDaysISO(SAT, 4), addDaysISO(SAT, 7), addDaysISO(SAT, 14)];
const fx = new Map<string, OwnFixture>(MATCHES.map((d, i) => [d, { date: d, home: i % 2 === 0, oppId: opps[i].id, comp: 'Liga' }]));
const plans: [string, DaySlots[]][] = [
  ['Standardplan', createDefaultWeeklyPlan().days],
  ['Vorlage Englische Woche', PLAN_TEMPLATES.find((t) => t.id === 'englisch')!.days.map(([slot1, slot2, extra]) => ({ slot1, slot2, extra }))],
];
const fresh = (ids: string[]) => ids.map((id) => g.players[id].frische ?? 100);
const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
let fail = 0;

for (const [name, days] of plans) {
  const acc: number[][] = MATCHES.map(() => []);
  const after: number[] = [];
  let all100 = 0;
  for (let r = 0; r < RUNS; r++) {
    for (const p of Object.values(g.players)) { p.frische = 100; p.injury = null; p.availability = 'available'; p.suspensionMatches = 0; }
    let xi: string[] = [];
    for (let d = SAT; d <= MATCHES[3]; d = addDaysISO(d, 1)) {
      const f = fx.get(d);
      if (f) {
        const mi = MATCHES.indexOf(d);
        if (mi > 0) {
          const v = fresh(xi); acc[mi].push(...v);
          if (v.every((x) => x >= 99.5)) all100++;
        }
        const opp = g.clubs[f.oppId];
        const [h, a] = f.home ? [me, opp] : [opp, me];
        new MatchEngine(h, a, g.players, '3-point', { date: d, competition: 'Liga', seed: r * 977 + mi }).simulate();
        applyMatchEffects(h, g.players, 'D'); applyMatchEffects(a, g.players, 'D');
        if (mi === 0) { xi = me.playerIds.filter((id) => (g.players[id].frische ?? 100) < 90); after.push(...fresh(xi)); }
        dailyRecovery(g.players);
      } else {
        const day = effectiveDay(days[weekdayIdx(d)], locksFor(d, fx));
        applyDailyTraining(me, g.players, day, false);
      }
    }
  }
  console.log(`\n${name} (${RUNS} Durchläufe, Startelf des ersten Spiels: ${Math.round(after.length / RUNS)} Spieler)`);
  console.log(`  nach dem Spiel Sa: Ø ${avg(after).toFixed(1)} (min ${Math.min(...after).toFixed(0)})`);
  const lbl = ['Sa', 'Mi (3 Tage Pause)', 'Sa (2 Tage Pause)', 'Sa (6 Tage Pause)'];
  for (let i = 1; i < MATCHES.length; i++) {
    const v = acc[i];
    console.log(`  Morgen ${lbl[i].padEnd(18)} Ø ${avg(v).toFixed(1)} · min ${Math.min(...v).toFixed(0)} · ≥ 99,5: ${Math.round(v.filter((x) => x >= 99.5).length / v.length * 100)} %`);
  }
  console.log(`  Tagesbelastung: ${days.map((d) => dayLoad(d)).join(' / ')} (Mo–So)`);
  if (avg(acc[1]) < 85 || avg(acc[2]) < 85) { console.log('  FEHLER: Ø Frische vor dem nächsten Spiel unter 85'); fail++; }
  if (all100 === RUNS * 3) { console.log('  FEHLER: alle Spieler immer bei 100'); fail++; }
}
if (fail) process.exit(1);
console.log('\nOK');
