// Match-Engine 2 ohne UI:  npm run test:engine
// Duell-Kurve, Torschnitt/Torarten, Attributwirkung, Taktikwirkung, Konstanz, Nervenstärke, Reproduzierbarkeit.
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { dayForm, duelP, nerveF } from '../src/engine/match/skills';
import { labRun, mirrorOf, neutralTactics } from '../src/engine/match/tacticLab';
import { makeMPlayer } from '../src/engine/match/team';
import { finishMatch } from '../src/engine/match/finish';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FEHL'} ${msg}`); };

const g = createNewGame({
  managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const clubs = leagueClubs(g);
const P = g.players;
setEraYear(1995);

// 1) Duell-Kurve
const p = duelP(85, 60);
check(p > 0.7 && p < 0.85, `Duell 85 gegen 60: ${(p * 100).toFixed(1)} % (deutlich, aber mit Zufall)`);
check(Math.abs(duelP(70, 70) - 0.5) < 1e-9, 'gleich stark = 50 %');

// 2) Torschnitt und Torarten
let goals = 0, head = 0, sp = 0, pens = 0;
const N = 400;
for (let i = 0; i < N; i++) {
  const sim = new MatchSim(clubs[i % clubs.length], clubs[(i * 5 + 3) % clubs.length === i % clubs.length ? (i + 1) % clubs.length : (i * 5 + 3) % clubs.length], P, { year: 1995, seed: i + 11 });
  sim.trace = true;
  sim.runToEnd();
  goals += sim.home.goals + sim.away.goals;
  for (const e of sim.events) {
    const c = e.chance;
    if (!c) continue;
    if (c.type === 'penalty') pens++;
    if (c.outcome !== 'goal' || c.disallowed || c.ownGoal) continue;
    if (c.type === 'header') head++;
    if (c.sp || c.type === 'penalty' || c.type === 'freekick') sp++;
  }
}
check(goals / N > 2.6 && goals / N < 3.5, `Tore je Spiel 1995: ${(goals / N).toFixed(2)}`);
check(head / goals > 0.12 && head / goals < 0.26, `Kopfballtore ${(head / goals * 100).toFixed(1)} %`);
check(sp / goals > 0.15 && sp / goals < 0.36, `Standardtore ${(sp / goals * 100).toFixed(1)} %`);
check(pens / N > 0.15 && pens / N < 0.4, `Elfmeter je Spiel ${(pens / N).toFixed(2)}`);

// 3) Reproduzierbarkeit
const a = new MatchSim(clubs[0], clubs[1], P, { year: 1995, seed: 42 }); a.runToEnd();
const b = new MatchSim(clubs[0], clubs[1], P, { year: 1995, seed: 42 }); b.runToEnd();
check(a.home.goals === b.home.goals && a.away.goals === b.away.goals && a.home.stats.duels === b.home.stats.duels, 'gleicher Seed → gleiches Spiel');

// 4) Attribut wirkt: Kopfball 85 gegen 60 (alle Feldspieler eines Vereins)
const club = clubs[3];
const field = club.playerIds.map((id) => P[id]).filter((x) => x && x.naturalPosition !== 'TW');
function aerialRate(v: number): number {
  const saved = field.map((x) => [x.attributes.heading, x.attributes.jumping] as const);
  for (const x of field) { x.attributes.heading = v; x.attributes.jumping = v; }
  let w = 0, t = 0;
  for (let i = 0; i < 150; i++) {
    const s = new MatchSim(club, clubs[(i % (clubs.length - 1) + 4) % clubs.length], P, { year: 1995, seed: i * 3 + 1 });
    s.runToEnd();
    for (const m of s.home.players) { w += m.aerialsWon ?? 0; t += m.aerials ?? 0; }
  }
  field.forEach((x, i) => { x.attributes.heading = saved[i][0]; x.attributes.jumping = saved[i][1]; });
  return w / Math.max(1, t);
}
const lo = aerialRate(60), hi = aerialRate(85);
check(hi - lo > 0.1, `Luftduelle gewonnen: Kopfball 60 → ${(lo * 100).toFixed(1)} %, 85 → ${(hi * 100).toFixed(1)} %`);

// 5) Taktik wirkt: Breite 100 gegen 0
const base = neutralTactics(club.tactics);
const wide = labRun(club, mirrorOf(club), P, { ...base, widthFocus: 100 }, 1995, 60);
const mid = labRun(club, mirrorOf(club), P, { ...base, widthFocus: 0 }, 1995, 60);
check(wide.crosses > mid.crosses * 2, `Flanken je Spiel: Mitte ${mid.crosses.toFixed(1)}, Flügel ${wide.crosses.toFixed(1)}`);
check(wide.longShots < mid.longShots, `Distanzschüsse: Mitte ${mid.longShots.toFixed(1)}, Flügel ${wide.longShots.toFixed(1)}`);
const press = labRun(club, mirrorOf(club), P, { ...base, pressing: 100 }, 1995, 60);
const calm = labRun(club, mirrorOf(club), P, { ...base, pressing: 0 }, 1995, 60);
check(press.counters > calm.counters && press.energy < calm.energy, `Pressing: Konter ${calm.counters.toFixed(2)} → ${press.counters.toFixed(2)}, Kraft ${calm.energy.toFixed(0)} → ${press.energy.toFixed(0)}`);

// 6) Konstanz: gleiche Mitte, unterschiedliche Streuung; Nervenstärke unter Druck
const pl = P[club.playerIds[1]];
const mp = makeMPlayer(pl, 'home', pl.naturalPosition, true, 0);
let seed = 5; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const spread = (cons: number) => {
  const old = pl.development.consistency; pl.development.consistency = cons;
  const xs = Array.from({ length: 4000 }, () => dayForm(mp, rng));
  pl.development.consistency = old;
  const m = xs.reduce((s, x) => s + x, 0) / xs.length;
  return { m, sd: Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length) };
};
const unst = spread(20), st = spread(95);
check(Math.abs(unst.m - 1) < 0.01 && Math.abs(st.m - 1) < 0.01, `Konstanz verschiebt den Schnitt nicht (${unst.m.toFixed(3)} / ${st.m.toFixed(3)})`);
check(unst.sd > st.sd * 2, `Konstanz 20 streut stärker als 95 (${unst.sd.toFixed(3)} gegen ${st.sd.toFixed(3)})`);
const oldB = pl.development.bigMatchTemperament;
pl.development.bigMatchTemperament = 95; const strong = nerveF(mp, 1);
pl.development.bigMatchTemperament = 10; const weak = nerveF(mp, 1);
pl.development.bigMatchTemperament = oldB;
check(strong > 1 && weak < strong && nerveF(mp, 0) === 1, `Nervenstärke unter Druck: stark ${strong.toFixed(3)}, schwach ${weak.toFixed(3)}, ohne Druck 1`);

// 7) Spielbericht mit Einzelwerten
const s7 = new MatchSim(clubs[0], clubs[2], P, { year: 2005, seed: 9, humanClubIds: [clubs[0].id] });
s7.runToEnd();
const out = finishMatch(s7, { logClubIds: [clubs[0].id] });
const st7 = out.result.report?.lineups.home[0]?.st;
check(!!st7 && st7.length === 15, 'Spielbericht enthält Einzelwerte je Spieler');
const tot = out.result.report!.lineups.home.reduce((s, e) => s + (e.st?.[4] ?? 0), 0);
check(tot > 100, `Zweikämpfe der Heimelf im Bericht: ${tot}`);

console.log(fails ? `${fails} Prüfung(en) fehlgeschlagen` : 'Match-Engine-Test bestanden.');
process.exit(fails ? 1 : 0);
