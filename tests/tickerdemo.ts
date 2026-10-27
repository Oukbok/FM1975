// Gibt ein komplettes Spiel im Textmodus auf der Konsole aus:  node scripts/tickerdemo.mjs [jahr] [seed] [ko]
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { Narrator } from '../src/data/ticker/narrator';

const year = Number(process.argv[2] ?? 1978);
const seed = Number(process.argv[3] ?? 3);
const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'S', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
setEraYear(year);
const clubs = leagueClubs(g);
const home = clubs[seed % clubs.length];
const away = clubs[(seed * 5 + 1) % clubs.length];
const sim = new MatchSim(home, away, g.players, { year, seed, knockout: process.argv[4] === 'ko', live: true, humanSides: ['home'], humanClubIds: [home.id] });
const nar = new Narrator(sim, { mySide: 'home', suspense: true });
let n = 0;
while (!sim.finished) {
  const evs = sim.step();
  if (sim.minute === 30 && evs.some((e) => e.kind === 'flow')) sim.shout('home', 'druck');
  if (evs.some((e) => e.kind === 'halftime')) sim.teamTalk('home', 'predigt');
  for (const l of nar.narrate(evs)) {
    n++;
    console.log(l.minute.padStart(6), l.suspense ? `[~~~~ → ${l.text}]` : l.text);
  }
}
console.log('Zeilen', n, 'Endstand', sim.home.goals, ':', sim.away.goals);
