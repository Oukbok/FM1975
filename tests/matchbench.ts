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
  sim.runToEnd();
  return sim;
}

const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + ' %';
const t0 = Date.now();
for (const year of [1975, 1985, 1995, 2005, 2015, 2024]) {
  setEraYear(year);
  let goals = 0, hw = 0, dr = 0, shots = 0, sot = 0, yel = 0, red = 0, corners = 0, fouls = 0, off = 0, xg = 0, subs = 0, pen = 0;
  for (let i = 0; i < N; i++) {
    const h = clubs[i % clubs.length];
    let a = clubs[(i * 7 + 3) % clubs.length];
    if (a === h) a = clubs[(i + 1) % clubs.length];
    const sim = play(h, a, year, i * 977 + year);
    const H = sim.home, A = sim.away;
    goals += H.goals + A.goals;
    if (H.goals > A.goals) hw++; else if (H.goals === A.goals) dr++;
    shots += H.stats.shots + A.stats.shots; sot += H.stats.shotsOnTarget + A.stats.shotsOnTarget;
    yel += H.stats.yellow + A.stats.yellow; red += H.stats.red + A.stats.red;
    corners += H.stats.corners + A.stats.corners; fouls += H.stats.fouls + A.stats.fouls;
    off += H.stats.offsides + A.stats.offsides; xg += H.stats.xg + A.stats.xg;
    subs += H.subsUsed + A.subsUsed;
    pen += sim.events.filter((e) => e.chance?.type === 'penalty').length;
  }
  console.log(`${year}: Tore ${(goals / N).toFixed(2)} | Heim ${pct(hw / N)} Remis ${pct(dr / N)} Ausw ${pct(1 - (hw + dr) / N)} | Schüsse ${(shots / N).toFixed(1)} aufs Tor ${(sot / N).toFixed(1)} xG ${(xg / N).toFixed(2)} | Ecken ${(corners / N).toFixed(1)} Fouls ${(fouls / N).toFixed(1)} Abseits ${(off / N).toFixed(1)} | Gelb ${(yel / N).toFixed(2)} Rot ${(red / N).toFixed(2)} | Elfer ${(pen / N).toFixed(2)} Wechsel ${(subs / N).toFixed(1)}`);
}

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
const grp = (s: string) => { const p = players[map[s]]; return p ? (['VS', 'AV', 'LIB'].includes(p.naturalPosition) ? 'D' : ['DM', 'ZM', 'OM'].includes(p.naturalPosition) ? 'M' : 'X') : 'X'; };
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
