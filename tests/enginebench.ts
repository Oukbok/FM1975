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
  console.log(`Verein ${club.shortName} (${YEAR}), ${N} Spiele je Variante gegen alle Ligagegner, Attribut der Gruppe auf 60 bzw. 85 gesetzt`);
  console.log('(Positionsstärke bleibt gleich – gemessen wird nur die direkte Wirkung in den Szenen; TD = Tordifferenz je Spiel)');
  type Grp = (p: Player) => boolean;
  const all: Grp = (p) => p.naturalPosition !== 'TW';
  const grp = (gs: string[]): Grp => (p) => gs.includes(POSITION_GROUPS[p.naturalPosition]);
  const ATT = grp(['ATT']), MID = grp(['MID']), DEF = grp(['DEF']), GK = grp(['GK']), AM = grp(['ATT', 'MID']), DM = grp(['DEF', 'MID']);
  const r = (a: number, b: number) => pct(a / Math.max(1, b));
  const g = (a: number, z: Z) => (a / z.n).toFixed(2);
  // [Bezeichnung, Attribute, Gruppe, Messgröße]
  const exps: [string, AttributeKey[], Grp, (z: Z) => string][] = [
    ['Fitness (Feld)', ['fitness'], all, (z) => `Tore ${g(z.m.goals, z)}`],
    ['Ausdauer (Feld)', ['stamina'], all, (z) => `Energie am Ende ${(z.m.energy / z.m.energyN).toFixed(0)} · Tore ab 70. ${g(z.m.late, z)}:${g(z.o.late, z)}`],
    ['Schnelligkeit (Angriff)', ['speed'], ATT, (z) => `Laufduelle ${r(z.m.raceW, z.m.race)} · Konter ${g(z.m.counters, z)}`],
    ['Antritt (Angriff)', ['acceleration'], ATT, (z) => `Laufduelle ${r(z.m.raceW, z.m.race)} · Dribblings ${r(z.m.drW, z.m.dr)}`],
    ['Schnelligkeit + Antritt (Abwehr)', ['speed', 'acceleration'], DEF, (z) => `Gegner-Laufduelle ${r(z.o.raceW, z.o.race)} · Gegner-Konter ${g(z.o.counters, z)}`],
    ['Kraft (Feld)', ['strength'], all, (z) => `Zweikämpfe ${r(z.m.duelW, z.m.duel)} · Luftduelle ${r(z.m.aerW, z.m.aer)}`],
    ['Sprungkraft (Feld)', ['jumping'], all, (z) => `Luftduelle ${r(z.m.aerW, z.m.aer)}`],
    ['Beweglichkeit (Angr./Mf.)', ['agility'], AM, (z) => `Dribblings ${r(z.m.drW, z.m.dr)}`],
    ['Balance (Angr./Mf.)', ['balance'], AM, (z) => `Dribblings ${r(z.m.drW, z.m.dr)} · Zweikämpfe ${r(z.m.duelW, z.m.duel)}`],
    ['Technik (Angr./Mf.)', ['technique'], AM, (z) => `Verwertung ${r(z.m.goals, z.m.shots)} · Pässe ${r(z.m.pOk, z.m.p)}`],
    ['Ballannahme (Angriff)', ['firstTouch'], ATT, (z) => `Pässe ${r(z.m.pOk, z.m.p)} · Verwertung ${r(z.m.goals, z.m.shots)}`],
    ['Abschluss (Angriff)', ['shooting'], ATT, (z) => `Verwertung ${r(z.m.goals, z.m.shots)}`],
    ['Schusskraft (Feld)', ['shotPower'], all, (z) => `Distanztore ${g(z.m.longG, z)}`],
    ['Weitschuss (Feld)', ['longShots'], all, (z) => `Distanzschüsse ${g(z.m.longS, z)} · Distanztore ${g(z.m.longG, z)}`],
    ['Passen (Mittelfeld)', ['passing'], MID, (z) => `Pässe ${r(z.m.pOk, z.m.p)} · Schüsse ${g(z.m.shots, z)}`],
    ['Lange Bälle (Abwehr)', ['longPassing'], DEF, (z) => `lange Bälle verloren ${g(z.m.lbLost, z)}`],
    ['Flanken (Feld)', ['crossing'], all, (z) => `Flanken ${r(z.m.crW, z.m.cr)} · Kopfballtore ${g(z.m.headG, z)}`],
    ['Dribbling (Angr./Mf.)', ['dribbling'], AM, (z) => `Dribblings ${r(z.m.drW, z.m.dr)}`],
    ['Ballkontrolle (Abw./Mf.)', ['ballControl'], DM, (z) => `Patzer ${g(z.m.errors, z)} · Zweikämpfe ${r(z.m.duelW, z.m.duel)}`],
    ['Kopfball (Feld)', ['heading'], all, (z) => `Luftduelle ${r(z.m.aerW, z.m.aer)} · Kopfballtore ${g(z.m.headG, z)}`],
    ['Tackling (Abwehr)', ['tackling'], DEF, (z) => `Gegner-Dribblings ${r(z.o.drW, z.o.dr)}`],
    ['Deckung (Abwehr)', ['marking'], DEF, (z) => `Gegner-Kopfballtore ${g(z.o.headG, z)} · Gegner-Dribblings ${r(z.o.drW, z.o.dr)}`],
    ['Stellungsspiel (Abwehr)', ['positioning'], DEF, (z) => `Gegner-Laufduelle ${r(z.o.raceW, z.o.race)} · Gegner-Pässe ${r(z.o.pOk, z.o.p)}`],
    ['Abfangen (Abw./Mf.)', ['interceptions'], DM, (z) => `Gegner-Pässe ${r(z.o.pOk, z.o.p)}`],
    ['Erfahrung (Feld)', ['experience'], all, (z) => `Patzer ${g(z.m.errors, z)} · Karten ${g(z.m.cards, z)}`],
    ['Übersicht (Mittelfeld)', ['vision'], MID, (z) => `Großchancen ${g(z.m.big, z)} · Pässe ${r(z.m.pOk, z.m.p)}`],
    ['Nervenstärke (Angriff)', ['composure'], ATT, (z) => `Großchancen verwertet ${r(z.m.bigG, z.m.big)}`],
    ['Konzentration (Abw./Mf.)', ['concentration'], DM, (z) => `Patzer ${g(z.m.errors, z)} · Gegentore ab 70. ${g(z.o.late, z)}`],
    ['Entscheidungen (Angr./Mf.)', ['decisions'], AM, (z) => `Pässe ${r(z.m.pOk, z.m.p)} · Abseits ${g(z.m.offs, z)}`],
    ['Führung (Feld)', ['leadership'], all, (z) => `Patzer ${g(z.m.errors, z)}`],
    ['Laufbereitschaft (Feld)', ['workRate'], all, (z) => `Gegner-Konter ${g(z.o.counters, z)} · Gegner-Pässe ${r(z.o.pOk, z.o.p)}`],
    ['Aggressivität (Feld)', ['aggression'], all, (z) => `Fouls ${g(z.m.fouls, z)} · Karten ${g(z.m.cards, z)} · Gegner-Pässe ${r(z.o.pOk, z.o.p)}`],
    ['Teamwork (Feld)', ['teamwork'], all, (z) => `Pässe ${r(z.m.pOk, z.m.p)} · Gegner-Pässe ${r(z.o.pOk, z.o.p)} · Abseits Gegner ${g(z.o.offs, z)}`],
    ['Flair (Angr./Mf.)', ['flair'], AM, (z) => `Solo-Abschlüsse ${g(z.m.solo, z)} · Dribblings ${g(z.m.dr, z)}`],
    ['Torwart: Reflexe', ['reflexes'], GK, (z) => `Gegner-Verwertung ${r(z.o.goals, z.o.shots)}`],
    ['Torwart: Fangsicherheit', ['handling'], GK, (z) => `Gegner-Nachschüsse ${g(z.o.rebound, z)}`],
    ['Torwart: Abschlag', ['kicking'], GK, (z) => `lange Bälle verloren ${g(z.m.lbLost, z)} · Konter ${g(z.m.counters, z)}`],
    ['Torwart: Strafraumbeherrschung', ['aerialReach'], GK, (z) => `Flanken gefangen ${g(z.m.claim, z)} · Gegner-Kopfballtore ${g(z.o.headG, z)}`],
    ['Torwart: Eins gegen eins', ['oneOnOnes'], GK, (z) => `Gegner-Großchancen verwertet ${r(z.o.bigG, z.o.big)}`],
    ['Torwart: Kommandos', ['communication'], GK, (z) => `Gegner-Kopfballtore ${g(z.o.headG, z)} · Gegner-Luftduelle ${r(z.o.aerW, z.o.aer)}`],
    ['Elfmeter (Feld)', ['penalties'], all, (z) => `Elfmeter verwandelt ${r(z.m.penG, z.m.pen)}`],
    ['Freistöße (Feld)', ['freeKicks'], all, (z) => `Freistoßtore ${g(z.m.fkG, z)}`],
    ['Ecken (Feld)', ['corners'], all, (z) => `Ecken-Tore ${g(z.m.cornerG, z)}`],
  ];
  const only = process.env.ONLY;
  for (const [label, keys, who, show] of exps) {
    if (only && !label.toLowerCase().includes(only.toLowerCase())) continue;
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
      const td = (z.m.goals - z.o.goals) / z.n;
      out.push(`${v}: ${show(z)} · TD ${td >= 0 ? '+' : ''}${td.toFixed(2)} · Pkt ${(z.pts / z.n).toFixed(2)}`);
    }
    console.log(`- ${label}\n    ${out.join('\n    ')}`);
  }
  // Wunsch Pascal: schneller Stürmer gegen hoch stehende Abwehr – Abwehrlinie aller Gegner fest hoch bzw. tief
  if (!only || 'linie'.includes(only.toLowerCase())) {
    const opps = clubs.filter((x) => x !== club);
    const saved = opps.map((o) => [o, o.tactics?.defensiveLine] as const);
    for (const line of [100, 0]) {
      for (const o of opps) if (o.tactics) o.tactics.defensiveLine = line;
      const out: string[] = [];
      for (const v of [60, 85]) {
        const keep: [Player, AttributeKey, number][] = [];
        for (const id of club.playerIds) {
          const p = players[id];
          if (!p || !ATT(p)) continue;
          for (const k of ['speed', 'acceleration'] as AttributeKey[]) { keep.push([p, k, p.attributes[k] as number]); (p.attributes as any)[k] = v; }
        }
        const z = run(club, N);
        for (const [p, k, old] of keep) (p.attributes as any)[k] = old;
        const td = (z.m.goals - z.o.goals) / z.n;
        out.push(`${v}: Laufduelle ${r(z.m.raceW, z.m.race)} · Konter ${g(z.m.counters, z)} · Tore ${g(z.m.goals, z)} · TD ${td >= 0 ? '+' : ''}${td.toFixed(2)}`);
      }
      console.log(`- Tempo (Angriff) gegen Abwehrlinie ${line === 100 ? 'hoch' : 'tief'}\n    ${out.join('\n    ')}`);
    }
    for (const [o, l] of saved) if (o.tactics) o.tactics.defensiveLine = l as number;
  }
}

/** Zähler je Seite (m = eigener Verein, o = Gegner). */
function side0() {
  return { goals: 0, shots: 0, late: 0, energy: 0, energyN: 0, race: 0, raceW: 0, counters: 0, duel: 0, duelW: 0, aer: 0, aerW: 0, dr: 0, drW: 0,
    p: 0, pOk: 0, cr: 0, crW: 0, headG: 0, longS: 0, longG: 0, lbLost: 0, errors: 0, cards: 0, fouls: 0, big: 0, bigG: 0, offs: 0,
    solo: 0, rebound: 0, claim: 0, pen: 0, penG: 0, fkG: 0, cornerG: 0 };
}
type S = ReturnType<typeof side0>;
interface Z { n: number; pts: number; m: S; o: S }
function run(c: Club, n: number): Z {
  const z: Z = { n: 0, pts: 0, m: side0(), o: side0() };
  const opps = clubs.filter((x) => x !== c);
  for (let i = 0; i < n; i++) {
    const o = opps[i % opps.length];
    const home = i % 2 === 0;
    const sim = new MatchSim(home ? c : o, home ? o : c, players, { year: YEAR, seed: i * 131 + 17, humanClubIds: [] });
    sim.trace = true;
    sim.runToEnd();
    const me = home ? sim.home : sim.away, op = home ? sim.away : sim.home;
    z.n++; z.pts += me.goals > op.goals ? 3 : me.goals === op.goals ? 1 : 0;
    for (const [T, s] of [[me, z.m], [op, z.o]] as const) {
      s.goals += T.goals; s.shots += T.stats.shots; s.counters += T.stats.counters ?? 0;
      s.cr += T.stats.crosses ?? 0; s.crW += T.stats.crossesOk ?? 0; s.fouls += T.stats.fouls; s.cards += T.stats.yellow + T.stats.red; s.offs += T.stats.offsides;
      for (const m of T.players) {
        s.aer += m.aerials ?? 0; s.aerW += m.aerialsWon ?? 0; s.dr += m.dribbles ?? 0; s.drW += m.dribblesOk ?? 0;
        s.p += m.passes; s.pOk += m.passesOk; s.duel += m.duels; s.duelW += m.duelsWon; s.errors += m.errors;
        if (m.onPitch && m.group !== 'GK') { s.energy += m.energy; s.energyN++; }
      }
    }
    for (const e of sim.events) {
      const s = e.side === me.side ? z.m : z.o;
      if (e.kind === 'chance' && e.chance) {
        const ch = e.chance, goal = ch.outcome === 'goal' && !ch.disallowed;
        if (goal && e.minute >= 70) s.late++;
        if (ch.type === 'header' && goal) s.headG++;
        if (ch.type === 'long') { s.longS++; if (goal) s.longG++; }
        if (ch.big && ch.type !== 'penalty') { s.big++; if (goal) s.bigG++; }
        if (ch.type === 'solo') s.solo++;
        if (ch.rebound) s.rebound++;
        if (ch.type === 'penalty') { s.pen++; if (goal) s.penG++; }
        if (goal && ch.type === 'freekick') s.fkG++;
        if (goal && (ch.sp === 'corner' || e.build === 'ecke')) s.cornerG++;
        if ((e.build === 'steilpass' || e.build === 'konter') && e.other) { s.race++; s.raceW++; }
      }
      if (e.kind === 'attack_fail') {
        if (e.fail === 'race') s.race++;
        if (e.fail === 'longball') s.lbLost++;
        if (e.fail === 'claim') (e.side === me.side ? z.o : z.m).claim++;
      }
    }
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
    ['Pass%', 'passAcc', 0], ['Fouls', 'fouls', 1], ['Karten', 'cards', 2], ['Abs.Geg', 'offsidesAgainst', 2], ['Energie', 'energy', 0], ['Punkte', 'points', 2],
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

// MODE=fit – passt die Taktik zum Kader? (engine/match/tacticFit.ts) Ein Spielertyp wird für alle Feldspieler
// auf schwach/stark gesetzt; gemessen wird die Taktik gegen neutral (Tordifferenz/Punkte je Spiel).
if (MODE === 'fit') {
  const base = neutralTactics(club.tactics);
  // eigener Gegner (nicht das Spiegelbild – sonst ändert sich der Spielertyp auf beiden Seiten)
  const oc = ranked[Math.floor(ranked.length / 2) + 1].c;
  const opp = { ...oc, tactics: neutralTactics(oc.tactics) };
  const field = club.playerIds.map((id) => players[id]).filter((p) => p && p.naturalPosition !== 'TW');
  const exps: [string, AttributeKey[], [string, Partial<Tactics>][]][] = [
    ['Passspiel', ['passing', 'vision', 'firstTouch'], [['kurz, ruhig', { tempo: 25 }], ['lang', { buildup: 'long' }], ['Tempo 100', { tempo: 100 }], ['lang + Tempo 75', { buildup: 'long', tempo: 75 }]]],
    ['Laufstärke', ['stamina', 'workRate'], [['Pressing 100', { pressing: 100 }], ['Pressing 0', { pressing: 0 }]]],
    ['Tempo', ['speed', 'acceleration'], [['Linie 100', { defensiveLine: 100 }], ['Linie 0', { defensiveLine: 0 }]]],
    ['Dribbling', ['dribbling', 'agility'], [['Tempo 100', { tempo: 100 }], ['Offensiv', { style: 'attacking' }]]],
    ['Flanken+Kopfball', ['crossing', 'heading', 'jumping'], [['Breite 90 hoch', { widthFocus: 90, crossStyle: 'high' }], ['Breite 10', { widthFocus: 10 }]]],
  ];
  for (const [label, keys, vars] of exps) {
    if (process.env.ONLY && !label.startsWith(process.env.ONLY)) continue;
    for (const v of [48, 62, 80]) {
      const saved: [Player, AttributeKey, number][] = [];
      for (const p of field) for (const k of keys) { saved.push([p, k, p.attributes[k] as number]); (p.attributes as any)[k] = v; }
      const ref = labRun(club, opp, players, base, YEAR, N);
      const out = vars.map(([n, patch]) => {
        const r = labRun(club, opp, players, { ...base, ...patch }, YEAR, N);
        const gd = (r.goalsFor - r.goalsAgainst) - (ref.goalsFor - ref.goalsAgainst);
        return `${n}: TD ${gd >= 0 ? '+' : ''}${gd.toFixed(2)} Pkt ${(r.points - ref.points >= 0 ? '+' : '')}${(r.points - ref.points).toFixed(2)}`;
      });
      for (const [p, k, old] of saved) (p.attributes as any)[k] = old;
      console.log(`${label} ${v}: ${out.join(' | ')}`);
    }
  }
}
