// Misst die reine Rechenzeit der Match-Engine:  node scripts/run-ts.mjs tests/matchspeed.ts [spiele]
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
const N = Number(process.argv[2] ?? 3000);
const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'S', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
const clubs = leagueClubs(g);
setEraYear(1995);
for (let i = 0; i < 300; i++) new MatchSim(clubs[i % 18], clubs[(i + 5) % 18], g.players, { year: 1995, seed: i }).runToEnd();
const t0 = process.cpuUsage();
for (let i = 0; i < N; i++) new MatchSim(clubs[i % 18], clubs[(i * 7 + 3) % 18 === i % 18 ? (i + 1) % 18 : (i * 7 + 3) % 18], g.players, { year: 1995, seed: i }).runToEnd();
const u = process.cpuUsage(t0);
console.log(`${N} Spiele: ${((u.user + u.system) / 1000 / N).toFixed(3)} ms CPU je Spiel`);
