// =============================================================================
// Kalibrierung der Match-Engine ohne Saisonablauf:
//   node scripts/matchbench.mjs [spieleJeJahr]
// Misst Tore, Heimsiege, Remis, Schüsse, Karten je Epoche sowie
// Favoritenquote (stärkster gegen schwächsten Verein) und den Effekt
// einer schlechten Aufstellung (falsche Positionen + müde Spieler).
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { calculateTeamStrength } from '../src/engine/match';
import type { Club, Player } from '../src/types';
import { POSITION_GROUPS } from '../src/types';
import { matchTargets, TARGET_LABELS, type MatchTargets } from '../src/data/matchStats';

const N = Number(process.argv[2] ?? 3000);
let seed = 7;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Sim', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const clubs = leagueClubs(g);
const players = g.players;

function play(h: Club, a: Club, year: number, s: number, knockout = false) {
  const sim = new MatchSim(h, a, players, { year, seed: s, knockout, humanClubIds: [] });
  sim.trace = !!process.env.MIX;
  sim.runToEnd();
  return sim;
}

const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + ' %';
const t0 = Date.now();
const MODE = process.env.MODE ?? 'all';
const subsByYear: Record<number, number> = {};
let shotMix: Record<string, [number, number]> = {}, buildMix: Record<string, [number, number]> = {}, failMix: Record<string, number> = {};

/** Ist-Werte einer Epoche (gleiche Schlüssel wie die Soll-Werte in data/matchStats.ts). */
function measure(year: number, n: number): Record<keyof MatchTargets, number> & { goalsRaw: number } {
  setEraYear(year);
  const z = { goals: 0, hw: 0, dr: 0, shots: 0, sot: 0, yel: 0, red: 0, corners: 0, fouls: 0, off: 0, pen: 0,
    head: 0, corner: 0, fk: 0, penG: 0, cnt: 0, long: 0, own: 0, duels: 0, passes: 0, passOk: 0, crosses: 0, crossOk: 0, subs: 0 };
  for (let i = 0; i < n; i++) {
    const h = clubs[i % clubs.length];
    let a = clubs[(i * 7 + 3) % clubs.length];
    if (a === h) a = clubs[(i + 1) % clubs.length];
    const sim = play(h, a, year, i * 977 + year);
    const H = sim.home, A = sim.away;
    z.goals += H.goals + A.goals;
    if (H.goals > A.goals) z.hw++; else if (H.goals === A.goals) z.dr++;
    for (const T of [H, A]) {
      const st = T.stats;
      z.shots += st.shots; z.sot += st.shotsOnTarget; z.yel += st.yellow; z.red += st.red; z.corners += st.corners;
      z.fouls += st.fouls; z.off += st.offsides; z.passes += st.passes; z.passOk += st.passesOk;
      z.crosses += st.crosses ?? 0; z.crossOk += st.crossesOk ?? 0;
    }
    z.duels += H.stats.duels; z.subs += H.subsUsed + A.subsUsed;
    for (const e of sim.events) {
      const c = e.chance;
      if (e.kind === 'attack_fail') failMix[e.fail ?? '?'] = (failMix[e.fail ?? '?'] ?? 0) + 1;
      if (!c) continue;
      const key = `${c.type}${c.sp ? '/' + c.sp : ''}`;
      const sm = (shotMix[key] ??= [0, 0]);
      sm[0]++; if (c.outcome === 'goal' && !c.disallowed) sm[1]++;
      const bm = (buildMix[e.build ?? '?'] ??= [0, 0]);
      bm[0]++; if (c.outcome === 'goal' && !c.disallowed) bm[1]++;
      if (c.type === 'penalty') z.pen++;
      if (c.outcome !== 'goal' || c.disallowed) continue;
      if (c.ownGoal) { z.own++; continue; }
      if (c.type === 'header') z.head++;
      if (c.type === 'long' || c.type === 'freekick') z.long++;
      if (c.type === 'penalty') z.penG++;
      else if (c.sp === 'corner' || e.build === 'ecke') z.corner++;
      else if (c.sp === 'freekick' || e.build === 'freistoss') z.fk++;
      if (e.build === 'konter') z.cnt++;
    }
  }
  const G = Math.max(1, z.goals);
  if (process.env.MIX) {
    const show = (m: Record<string, [number, number]>) => Object.entries(m).sort((x, y) => y[1][0] - x[1][0]).map(([k, [a, b]]) => `${k} ${(a / n).toFixed(2)}/${(b / a * 100).toFixed(0)}%`).join(' | ');
    console.log(`${year} Schüsse/Spiel je Art (Quote): ${show(shotMix)}`);
    console.log(`${year} je Aufbau: ${show(buildMix)}`);
    console.log(`${year} Ballverluste: ${Object.entries(failMix).map(([k, v]) => `${k} ${(v / n).toFixed(1)}`).join(' | ')}`);
  }
  shotMix = {}; buildMix = {}; failMix = {};
  subsByYear[year] = z.subs / n;
  return {
    goalsRaw: z.goals,
    goals: z.goals / n, homeWin: z.hw / n, draw: z.dr / n, shotsPerTeam: z.shots / n / 2, onTargetShare: z.sot / Math.max(1, z.shots),
    headerShare: z.head / G, setPieceShare: (z.corner + z.fk + z.penG) / G, cornerShare: z.corner / G, freeKickShare: z.fk / G,
    penaltyShare: z.penG / G, counterShare: z.cnt / G, longShare: z.long / G, ownGoalShare: z.own / G,
    penalties: z.pen / n, fouls: z.fouls / n, yellow: z.yel / n, red: z.red / n, offsides: z.off / n, corners: z.corners / n,
    duels: z.duels / n, passesPerTeam: z.passes / n / 2, passAccuracy: z.passOk / Math.max(1, z.passes),
    crossesPerTeam: z.crosses / n / 2, crossAccuracy: z.crossOk / Math.max(1, z.crosses),
  };
}

const fmt = (k: string, v: number) => (k.endsWith('Share') || k === 'homeWin' || k === 'draw' || k.endsWith('Accuracy')) ? (v * 100).toFixed(1) + '%' : v >= 100 ? v.toFixed(0) : v.toFixed(2);
if (MODE === 'all' || MODE === 'era') {
  const years = [1975, 1985, 1995, 2005, 2015, 2024];
  const res = years.map((y) => measure(y, N));
  const keys = Object.keys(TARGET_LABELS) as (keyof MatchTargets)[];
  console.log('Ist je Epoche (Soll-Spanne aus data/matchStats.ts; ! = außerhalb)');
  console.log('Kennzahl'.padEnd(18) + years.map((y) => String(y).padStart(22)).join(''));
  let misses = 0;
  for (const k of keys) {
    let line = TARGET_LABELS[k].padEnd(18);
    years.forEach((y, i) => {
      const [lo, hi] = matchTargets(y)[k];
      const v = res[i][k];
      const out = v < lo || v > hi;
      if (out) misses++;
      line += `${out ? '!' : ' '}${fmt(k, v)} [${fmt(k, lo)}–${fmt(k, hi)}]`.padStart(22);
    });
    console.log(line);
  }
  console.log('Wechsel/Spiel'.padEnd(18) + years.map((y) => subsByYear[y].toFixed(2).padStart(22)).join(''));
  console.log(`Abweichungen: ${misses} von ${keys.length * years.length}`);
}
if (MODE === 'era') process.exit(0);

// Favorit gegen Außenseiter
setEraYear(1985);
const ranked = clubs.map((c) => ({ c, s: calculateTeamStrength(c, players).overall })).sort((x, y) => y.s - x.s);
const best = ranked[0], worst = ranked[ranked.length - 1], mid = ranked[Math.floor(ranked.length / 2)];
console.log(`Stärke: ${best.c.shortName} ${best.s.toFixed(1)} | ${mid.c.shortName} ${mid.s.toFixed(1)} | ${worst.c.shortName} ${worst.s.toFixed(1)}`);
for (const [x, y, label] of [[best, worst, 'Bester vs. Schwächster'], [best, mid, 'Bester vs. Mitte'], [ranked[1], ranked[2], 'Zweiter vs. Dritter']] as const) {
  let wHome = 0, wAway = 0, dH = 0, dA = 0;
  for (let i = 0; i < N; i++) {
    const s1 = play(x.c, y.c, 1985, i * 31 + 1);
    if (s1.home.goals > s1.away.goals) wHome++; else if (s1.home.goals === s1.away.goals) dH++;
    const s2 = play(y.c, x.c, 1985, i * 31 + 2);
    if (s2.away.goals > s2.home.goals) wAway++; else if (s2.home.goals === s2.away.goals) dA++;
  }
  console.log(`${label}: Sieg daheim ${pct(wHome / N)} (Remis ${pct(dH / N)}), Sieg auswärts ${pct(wAway / N)} (Remis ${pct(dA / N)})`);
}

// Schlechte Aufstellung: Positionen durchtauschen + müde
function points(h: Club, a: Club, n: number): number {
  let pts = 0;
  for (let i = 0; i < n; i++) {
    const s = play(h, a, 1985, i * 13 + 5);
    pts += s.home.goals > s.away.goals ? 3 : s.home.goals === s.away.goals ? 1 : 0;
  }
  return pts / n;
}
const club = mid.c;
const opp = ranked[Math.floor(ranked.length / 2) + 1].c;
const normal = points(club, opp, N);
const saved = JSON.parse(JSON.stringify(club.tactics));
const xi = club.tactics.startingXI.slice();
// falsche Positionen: Abwehr und Angriff tauschen, Torwart bleibt
const map = { ...(club.tactics.lineupMap ?? {}) };
// realistisch falsch: Abwehr und Mittelfeld tauschen (Sturm und Tor bleiben)
const grp = (s: string) => { const p = players[map[s]]; return p ? (POSITION_GROUPS[p.naturalPosition] === 'DEF' ? 'D' : POSITION_GROUPS[p.naturalPosition] === 'MID' ? 'M' : 'X') : 'X'; };
const ds = Object.keys(map).filter((s) => grp(s) === 'D'), mids = Object.keys(map).filter((s) => grp(s) === 'M');
for (let i = 0; i < Math.min(ds.length, mids.length); i++) { const t = map[ds[i]]; map[ds[i]] = map[mids[i]]; map[mids[i]] = t; }
club.tactics.lineupMap = map;
const wrong = (() => { const r = new MatchSim(club, opp, players, { year: 1985, seed: 1, humanClubIds: [club.id] }); return r; })();
void wrong;
let wrongPts = 0;
for (let i = 0; i < N; i++) { const s = new MatchSim(club, opp, players, { year: 1985, seed: i * 13 + 5, humanClubIds: [club.id] }); s.runToEnd(); wrongPts += s.home.goals > s.away.goals ? 3 : s.home.goals === s.away.goals ? 1 : 0; }
const fr = new Map<string, number>();
for (const id of xi) { const p: Player = players[id]; fr.set(id, p.frische); p.frische = 50; }
let tiredPts = 0;
for (let i = 0; i < N; i++) { const s = new MatchSim(club, opp, players, { year: 1985, seed: i * 13 + 5, humanClubIds: [club.id] }); s.runToEnd(); tiredPts += s.home.goals > s.away.goals ? 3 : s.home.goals === s.away.goals ? 1 : 0; }
for (const [id, v] of fr) players[id].frische = v;
club.tactics = saved;
console.log(`Aufstellung (${club.shortName} vs ${opp.shortName}, Punkte/Spiel): normal ${normal.toFixed(2)} | falsche Positionen ${(wrongPts / N).toFixed(2)} | falsch + müde ${(tiredPts / N).toFixed(2)}`);
console.log(`Dauer ${((Date.now() - t0) / 1000).toFixed(1)} s`);
