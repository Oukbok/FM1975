// =============================================================================
// Energie im Spiel (Wunsch Pascal: Spieler sollen spürbar müde werden):
//   node scripts/run-ts.mjs tests/energybench.ts [spiele=300]
// Misst die Energie der Spieler, die von Anfang an auf dem Platz stehen, nach 60/75/90 Minuten
// je Typ (Torwart, Feldspieler nach Ausdauer) bei normaler und hoher Intensität (Pressing,
// Tempo, Einsatz hoch), dazu den Anteil der Tore nach der Pause / ab der 76. Minute und die
// Wechsel je Spiel. Soll-Werte und Quellen: docs/research/match-energy.md.
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import type { Club } from '../src/types';

const N = Number(process.argv[2] ?? 300);
const YEARS = (process.env.YEARS ?? '1975,1995,2025').split(',').map(Number);
let seed = 11;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const g = createNewGame({
  managedClubId: 'mgl', manager: { name: 'Sim', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const clubs = leagueClubs(g);
const KEYS = ['TW', 'Feld Ausd. <60', 'Feld Ausd. 60–74', 'Feld Ausd. ≥75'] as const;
const key = (m: { group: string; p: { attributes: { stamina?: number } } }) => {
  if (m.group === 'GK') return 0;
  const s = m.p.attributes.stamina ?? 60;
  return s < 60 ? 1 : s < 75 ? 2 : 3;
};

function run(year: number, intense: boolean) {
  setEraYear(year);
  const acc = KEYS.map(() => ({ e60: 0, e75: 0, e90: 0, n60: 0, n75: 0, n90: 0, start: 0, ns: 0 }));
  let goals = 0, g2 = 0, g76 = 0, subs = 0, tiredSubs = 0;
  for (let i = 0; i < N; i++) {
    const h = clubs[i % clubs.length];
    let a = clubs[(i * 7 + 3) % clubs.length];
    if (a === h) a = clubs[(i + 1) % clubs.length];
    const keep: [Club, unknown][] = [];
    if (intense) for (const c of [h, a]) { keep.push([c, c.tactics]); c.tactics = { ...(c.tactics as object), pressing: 85, tempo: 80, effort: 85 } as Club['tactics']; }
    const sim = new MatchSim(h, a, g.players, { year, seed: i * 131 + year, knockout: false, humanClubIds: [] });
    for (const t of [sim.home, sim.away]) for (const m of t.players) if (m.onPitch) { acc[key(m)].start += m.energy; acc[key(m)].ns++; }
    const seen = new Set<number>();
    while (!sim.finished) {
      sim.step();
      const min = sim.minute;
      for (const at of [60, 75, 90]) {
        if (min >= at && !seen.has(at) && sim.period === 2) {
          seen.add(at);
          for (const t of [sim.home, sim.away]) for (const m of t.players) {
            if (!m.onPitch || !m.started || m.injured) continue;
            const z = acc[key(m)];
            if (at === 60) { z.e60 += m.energy; z.n60++; } else if (at === 75) { z.e75 += m.energy; z.n75++; } else { z.e90 += m.energy; z.n90++; }
          }
        }
      }
    }
    for (const [c, t] of keep) c.tactics = t as Club['tactics'];
    for (const ev of sim.events) {
      if (ev.kind === 'chance' && ev.chance?.outcome === 'goal' && !ev.chance.disallowed && ev.period <= 2) { goals++; if (ev.period === 2) g2++; if (ev.period === 2 && ev.minute > 75) g76++; }
      if (ev.kind === 'sub') { subs++; if (ev.detail === 'muede') tiredSubs++; }
    }
  }
  const f = (s: number, n: number) => (n ? (s / n).toFixed(1) : '–').padStart(6);
  console.log(`\n${year} ${intense ? 'hohe Intensität (Pressing 85, Tempo 80, Einsatz 85)' : 'Vereinstaktik'} – ${N} Spiele`);
  console.log('Typ                  Start   60.    75.    90.   (n90)');
  KEYS.forEach((k, i) => { const z = acc[i]; console.log(`${k.padEnd(18)} ${f(z.start, z.ns)} ${f(z.e60, z.n60)} ${f(z.e75, z.n75)} ${f(z.e90, z.n90)}  (${z.n90})`); });
  console.log(`Tore/Spiel ${(goals / N).toFixed(2)} · 2. Hz ${(g2 / Math.max(1, goals) * 100).toFixed(1)} % · ab 76. ${(g76 / Math.max(1, goals) * 100).toFixed(1)} % · Wechsel/Team ${(subs / N / 2).toFixed(2)} (müde ${(tiredSubs / N / 2).toFixed(2)})`);
}

// Verteilung der Ausdauer der Feldspieler in der Startelf (was ist „mittel“, was „gut“?)
{
  const st: number[] = [];
  for (const c of clubs) { const sim = new MatchSim(c, c === clubs[0] ? clubs[1] : clubs[0], g.players, { year: 1995, seed: 1, knockout: false, humanClubIds: [] }); for (const m of sim.home.players) if (m.onPitch && m.group !== 'GK') st.push(m.p.attributes.stamina ?? 60); }
  st.sort((a, b) => a - b);
  const q = (f: number) => st[Math.floor(f * (st.length - 1))];
  console.log(`Ausdauer Startelf (Feld): 10 % ${q(0.1)} · 25 % ${q(0.25)} · Median ${q(0.5)} · 75 % ${q(0.75)} · 90 % ${q(0.9)}`);
}
for (const y of YEARS) { run(y, false); run(y, true); }
