// =============================================================================
// Wirkung von Attributen und Taktik in der Match-Engine:
//   MODE=attrs   node scripts/matchbench.mjs [spiele]   – Attribut 60 gegen 85 je Duell-Art
//   MODE=tactics node scripts/matchbench.mjs [spiele]   – Einstellung → Chancenmix/Tore/Gegentore
// Ein Verein aus dem Mittelfeld der Liga, Gegner reihum (Attribute) bzw. sein neutrales Spiegelbild (Taktik).
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { calculateTeamStrength } from '../src/engine/match';
import { labRun, mirrorOf, neutralTactics, type LabStats } from '../src/engine/match/tacticLab';
import { duelP } from '../src/engine/match/skills';
import type { AttributeKey, Club, Player, Tactics } from '../src/types';
import { POSITION_GROUPS } from '../src/types';

const N = Number(process.argv[2] ?? 400);
const MODE = process.env.MODE ?? 'attrs';
const YEAR = Number(process.env.YEAR ?? 1995);
let seed = 7;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const g = createNewGame({
  managedClubId: 'mgl', manager: { name: 'Sim', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
setEraYear(YEAR);
const clubs = leagueClubs(g);
const players = g.players;
const ranked = clubs.map((c) => ({ c, s: calculateTeamStrength(c, players).overall })).sort((x, y) => y.s - x.s);
const club = ranked[Math.floor(ranked.length / 2)].c;
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

if (MODE === 'attrs') {
  console.log(`Duell-Kurve: 60 gegen 85 gewinnt ${pct(1 - duelP(60, 85))}, 70 gegen 75 ${pct(duelP(70, 75))}, gleich stark 50 %`);
  console.log(`Verein ${club.shortName} (${YEAR}), ${N} Spiele je Variante gegen alle Ligagegner, Attribut auf 60 bzw. 85 gesetzt:`);
  type Grp = (p: Player) => boolean;
  const all: Grp = (p) => p.naturalPosition !== 'TW';
  const grp = (gs: string[]): Grp => (p) => gs.includes(POSITION_GROUPS[p.naturalPosition]);
  const exps: [string, AttributeKey[], Grp, (z: Agg) => string][] = [
    ['Kopfball + Sprungkraft (alle Feldspieler)', ['heading', 'jumping'], all, (z) => `Luftduelle gewonnen ${pct(z.aerW / z.aer)} · Kopfballtore/Spiel ${(z.headG / z.n).toFixed(2)}`],
    ['Dribbling + Ballkontrolle (Angriff/Mittelfeld)', ['dribbling', 'ballControl'], grp(['ATT', 'MID']), (z) => `Dribblings gelungen ${pct(z.drW / z.dr)}`],
    ['Passspiel + Übersicht (Mittelfeld)', ['passing', 'vision'], grp(['MID']), (z) => `Pässe angekommen ${pct(z.pOk / z.p)} · Schüsse/Spiel ${(z.shots / z.n).toFixed(1)}`],
    ['Flanken (alle Feldspieler)', ['crossing'], all, (z) => `Flanken angekommen ${pct(z.crW / z.cr)} · Kopfballtore/Spiel ${(z.headG / z.n).toFixed(2)}`],
    ['Abschluss + Nervenstärke (Angriff)', ['shooting', 'composure'], grp(['ATT']), (z) => `Chancenverwertung ${pct(z.goals / Math.max(1, z.shots))}`],
    ['Tempo + Antritt (Angriff)', ['speed', 'acceleration'], grp(['ATT']), (z) => `Konter/Spiel ${(z.counters / z.n).toFixed(2)}`],
    ['Tackling + Manndeckung (Abwehr)', ['tackling', 'marking'], grp(['DEF']), (z) => `Gegner-Dribblings gelungen ${pct(z.oDrW / z.oDr)}`],
    ['Torwart: Reflexe + Stellungsspiel + 1:1', ['reflexes', 'positioning', 'oneOnOnes'], grp(['GK']), (z) => `Gegner-Verwertung ${pct(z.against / Math.max(1, z.oShots))}`],
  ];
  for (const [label, keys, who, show] of exps) {
    const out: string[] = [];
    for (const v of [60, 85]) {
      const saved: [Player, AttributeKey, number][] = [];
      for (const id of club.playerIds) {
        const p = players[id];
        if (!p || !who(p)) continue;
        for (const k of keys) { saved.push([p, k, p.attributes[k] as number]); (p.attributes as any)[k] = v; }
      }
      const z = run(club, N);
      for (const [p, k, old] of saved) (p.attributes as any)[k] = old;
      out.push(`${v}: ${show(z)} · Tore ${(z.goals / z.n).toFixed(2)}:${(z.against / z.n).toFixed(2)} · Punkte ${(z.pts / z.n).toFixed(2)}`);
    }
    console.log(`- ${label}\n    ${out.join('\n    ')}`);
  }
}

interface Agg { n: number; goals: number; against: number; pts: number; shots: number; oShots: number; aer: number; aerW: number; dr: number; drW: number; oDr: number; oDrW: number; p: number; pOk: number; cr: number; crW: number; headG: number; counters: number }
function run(c: Club, n: number): Agg {
  const z: Agg = { n: 0, goals: 0, against: 0, pts: 0, shots: 0, oShots: 0, aer: 0, aerW: 0, dr: 0, drW: 0, oDr: 0, oDrW: 0, p: 0, pOk: 0, cr: 0, crW: 0, headG: 0, counters: 0 };
  const opps = clubs.filter((x) => x !== c);
  for (let i = 0; i < n; i++) {
    const o = opps[i % opps.length];
    const home = i % 2 === 0;
    const sim = new MatchSim(home ? c : o, home ? o : c, players, { year: YEAR, seed: i * 131 + 17, humanClubIds: [] });
    sim.trace = true;
    sim.runToEnd();
    const me = home ? sim.home : sim.away, op = home ? sim.away : sim.home;
    z.n++; z.goals += me.goals; z.against += op.goals; z.pts += me.goals > op.goals ? 3 : me.goals === op.goals ? 1 : 0;
    z.shots += me.stats.shots; z.oShots += op.stats.shots; z.counters += me.stats.counters ?? 0;
    z.cr += me.stats.crosses ?? 0; z.crW += me.stats.crossesOk ?? 0;
    z.oDr += op.stats.dribbles ?? 0; z.oDrW += op.stats.dribblesOk ?? 0;
    for (const m of me.players) { z.aer += m.aerials ?? 0; z.aerW += m.aerialsWon ?? 0; z.dr += m.dribbles ?? 0; z.drW += m.dribblesOk ?? 0; z.p += m.passes; z.pOk += m.passesOk; }
    for (const e of sim.events) if (e.kind === 'chance' && e.side === me.side && e.chance?.type === 'header' && e.chance.outcome === 'goal' && !e.chance.disallowed) z.headG++;
  }
  return z;
}

if (MODE === 'tactics') {
  const base = neutralTactics(club.tactics);
  const opp = mirrorOf(club);
  const variants: [string, Partial<Tactics>][] = [
    ['Breite 0 (Mitte)', { widthFocus: 0 }], ['Breite 100 (Flügel)', { widthFocus: 100 }],
    ['Flanken hoch (Breite 80)', { widthFocus: 80, crossStyle: 'high' }], ['Flanken flach (Breite 80)', { widthFocus: 80, crossStyle: 'low' }],
    ['Aufbau lang', { buildup: 'long' }], ['Tempo 0', { tempo: 0 }], ['Tempo 100', { tempo: 100 }],
    ['Pressing 0', { pressing: 0 }], ['Pressing 100', { pressing: 100 }], ['Linie 0 (tief)', { defensiveLine: 0 }], ['Linie 100 (hoch)', { defensiveLine: 100 }],
    ['Härte 0', { tackleHardness: 0 }], ['Härte 100', { tackleHardness: 100 }], ['Einsatz 0', { effort: 0 }], ['Einsatz 100', { effort: 100 }],
    ['Abseitsfalle an', { offsideTrap: true }], ['Stil Offensiv', { style: 'attacking' }], ['Stil Defensiv', { style: 'defensive' }], ['Stil Konter', { style: 'counter' }],
  ];
  const ref = labRun(club, opp, players, base, YEAR, N);
  const cols: [string, keyof LabStats, number][] = [
    ['Flanken', 'crosses', 1], ['Kopfb.', 'headers', 2], ['Konter', 'counters', 2], ['Distanz', 'longShots', 2], ['Steil', 'throughBalls', 2],
    ['Dribbl.', 'dribbles', 1], ['Schüsse', 'shots', 1], ['Tore', 'goalsFor', 2], ['Gegent.', 'goalsAgainst', 2], ['Ballb.%', 'possession', 0],
    ['Pass%', 'passAcc', 0], ['Fouls', 'fouls', 1], ['Karten', 'cards', 2], ['Abs.Geg', 'offsidesAgainst', 2], ['Kraft', 'energy', 0], ['Punkte', 'points', 2],
  ];
  const fmt = (k: keyof LabStats, v: number, d: number) => (k === 'possession' || k === 'passAcc' ? (v * 100).toFixed(0) : v.toFixed(d));
  console.log(`Taktik-Wirkung ${club.shortName} (${YEAR}) gegen sein neutrales Spiegelbild, je ${N} Heim- + Auswärtsspiele; Zeile = Wert (Δ zu neutral)`);
  console.log('Einstellung'.padEnd(26) + cols.map(([l]) => l.padStart(13)).join(''));
  console.log('neutral'.padEnd(26) + cols.map(([, k, d]) => fmt(k, ref[k], d).padStart(13)).join(''));
  for (const [label, patch] of variants) {
    const r = labRun(club, opp, players, { ...base, ...patch }, YEAR, N);
    console.log(label.padEnd(26) + cols.map(([, k, d]) => {
      const dv = r[k] - ref[k];
      const ds = k === 'possession' || k === 'passAcc' ? (dv * 100).toFixed(0) : dv.toFixed(d);
      return `${fmt(k, r[k], d)} (${dv >= 0 ? '+' : ''}${ds})`.padStart(13);
    }).join(''));
  }
}
