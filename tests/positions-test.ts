// Positionsvertrautheit ohne UI: Erzeugung/Verteilung, Nachrüstung (idempotent, deterministisch),
// Wachstum durch Einsätze und Training, Abbau mit 50-%-Grenze über mehrere Saisons,
// KI-Positionstraining, Wirkung in Engine/Aufstellung, Taktik-Regler (Härte, Einsatz).
//   node scripts/run-ts.mjs tests/positions-test.ts
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { aiPositionPlans, migratePositionSkills, monthlyPositions, tierCounts } from '../src/game/positionsGame';
import {
  addPositionMinutes, decayPositions, floorOf, IDLE_DAYS, peakOf, setTrainingPosition, skillOf, TRAIN_CAP, trainPositionDays,
} from '../src/engine/positionSkill';
import { famFactor, positionSuitability, setEraYear } from '../src/engine/positions';
import { tacticMods } from '../src/engine/match/team';
import { MatchSim } from '../src/engine/match/sim';
import { finishMatch } from '../src/engine/match/finish';
import { ALL_POSITIONS, type Player, type Position } from '../src/types';

let seed = 11;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const ok = (c: unknown, msg: string) => { if (!c) fail(msg); };

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
setEraYear(1975);
const all = Object.values(g.players);

// 1) Erzeugung: alle Spieler, Stammposition 100, realistische Verteilung
ok(all.every((p) => p.positionSkill && skillOf(p, p.naturalPosition) === 100), 'Spieler ohne Vertrautheit / Stamm ≠ 100');
const field = all.filter((p) => p.naturalPosition !== 'TW');
const sum = { natural: 0, good: 0, ok: 0, none: 0 };
for (const p of field) { const c = tierCounts(p); for (const k of Object.keys(sum) as (keyof typeof sum)[]) sum[k] += c[k]; }
const avg = (k: keyof typeof sum) => sum[k] / field.length;
console.log(`Feldspieler ${field.length}: Ø natürlich ${avg('natural').toFixed(2)}, gut ${avg('good').toFixed(2)}, ausreichend ${avg('ok').toFixed(2)}, ungeeignet ${avg('none').toFixed(2)}`);
ok(avg('natural') >= 1 && avg('natural') < 1.15, 'meist genau eine natürliche Position');
ok(avg('good') >= 0.9 && avg('good') <= 2.0, '1–2 gute Positionen im Schnitt');
ok(avg('ok') >= 1.5 && avg('ok') <= 4, 'einige ausreichende Positionen');
ok(field.every((p) => skillOf(p, 'TW') < 10), 'Feldspieler als Torwart nicht ungeeignet');
ok(all.filter((p) => p.naturalPosition === 'TW').every((p) => ALL_POSITIONS.every((q) => q === 'TW' || skillOf(p, q) < 50)), 'Torwart auf dem Feld zu gut');
ok(field.every((p) => p.secondaryPositions.every((q) => skillOf(p, q) >= 75)), 'Nebenpositionen ≠ Stufe gut');

// 2) Nachrüstung idempotent und deterministisch
const sample = field.slice(0, 50);
const key = (p: Player) => JSON.stringify(p.positionSkill?.v);
for (const p of sample) { delete p.positionSkill; p.secondaryPositions = []; }
ok(migratePositionSkills(g) === 50, 'Nachrüstung zählt falsch');
ok(migratePositionSkills(g) === 0, 'Nachrüstung nicht idempotent');
const before = sample.map(key);
for (const p of sample) delete p.positionSkill; // Nebenpositionen bleiben (wie in einem Spielstand)
migratePositionSkills(g);
ok(sample.every((p, i) => key(p) === before[i]), 'Nachrüstung nicht deterministisch');

// 3) Wachstum durch Einsätze
const p1 = field.find((p) => p.age <= 24 && tierCounts(p).none >= 3)!;
const target = ALL_POSITIONS.filter((q) => q !== 'TW' && q !== p1.naturalPosition).sort((a, b) => skillOf(p1, a) - skillOf(p1, b))[0];
const v0 = skillOf(p1, target), s0 = positionSuitability(p1, target);
let d = 0;
const dateOf = (n: number) => new Date(Date.UTC(1975, 7, 1) + n * 86_400_000).toISOString().slice(0, 10);
for (let i = 0; i < 34; i++) addPositionMinutes(p1, target, 90, dateOf(d += 7));
const v1 = skillOf(p1, target);
console.log(`Einsätze: ${p1.naturalPosition}→${target} ${v0} → ${v1} nach 34 Spielen (Eignung ${s0} → ${positionSuitability(p1, target)})`);
ok(v1 > 60 && v1 < 85, 'Wachstum durch Einsätze unplausibel');
for (let i = 0; i < 20; i++) addPositionMinutes(p1, target, 90, dateOf(d += 7));
console.log(`  nach 54 Spielen: ${skillOf(p1, target)}`);
ok(skillOf(p1, target) >= 75, 'nach anderthalb Saisons nicht gut');
ok(positionSuitability(p1, target) > s0, 'Eignung steigt nicht mit der Vertrautheit');
ok(p1.secondaryPositions.includes(target), 'Nebenpositionen nicht nachgeführt');

// 4) Positionstraining: bis höchstens TRAIN_CAP
const p2 = field.find((p) => p !== p1 && p.age <= 23)!;
const t2 = ALL_POSITIONS.filter((q) => q !== 'TW' && q !== p2.naturalPosition).sort((a, b) => skillOf(p2, a) - skillOf(p2, b))[0];
setTrainingPosition(p2, t2, '1975-08-01');
const tv0 = skillOf(p2, t2);
trainPositionDays(p2, 100, '1975-12-01');
const tv1 = skillOf(p2, t2);
trainPositionDays(p2, 2000, '1980-12-01');
console.log(`Training: ${t2} ${tv0} → ${tv1} nach 100 Tagen, Deckel ${skillOf(p2, t2)}`);
ok(tv1 - tv0 >= 10 && tv1 - tv0 <= 40, 'Trainingsfortschritt unplausibel');
ok(skillOf(p2, t2) <= TRAIN_CAP, 'Training über den Deckel');

// 5) Abbau: nicht vor IDLE_DAYS, langsam, nie unter 50 % des Höchstwerts
const p3 = p1; // target zuletzt am Tag d gespielt
const peak3 = peakOf(p3, target);
let monthDay = d;
let changedMonths = 0, months = 0, earlyDrop = false;
let last = skillOf(p3, target);
for (let m = 0; m < 12 * 12; m++) {
  monthDay += 30;
  const iso = dateOf(monthDay);
  decayPositions(p3, iso);
  const v = skillOf(p3, target);
  if (monthDay - d < IDLE_DAYS && v < last) earlyDrop = true;
  if (monthDay - d >= IDLE_DAYS) { months++; if (v < last) changedMonths++; }
  last = v;
  if (m === 35) console.log(`Abbau nach 3 Jahren: ${skillOf(p3, target)} (Höchstwert ${peak3})`);
}
console.log(`Abbau nach 12 Jahren: ${skillOf(p3, target)} (Untergrenze ${floorOf(p3, target)}), in ${changedMonths}/${months} Monaten gesunken`);
ok(!earlyDrop, 'Abbau vor Ablauf der Pause');
ok(skillOf(p3, target) >= peak3 * 0.5 - 0.05, '50-%-Grenze unterschritten');
ok(skillOf(p3, target) < peak3 - 10, 'kein spürbarer Abbau');
ok(changedMonths > 0 && changedMonths < months * 0.6, 'Abbau nicht zufällig verzögert');
ok(peakOf(p3, target) === peak3, 'Höchstwert verloren');
ok(skillOf(p3, p3.naturalPosition) === 100, 'Stammposition baut ab');
// Wieder spielen hebt den Wert erneut
addPositionMinutes(p3, target, 90, dateOf(monthDay + 3));
ok(skillOf(p3, target) > last, 'Rückkehr auf die Position ohne Wirkung');

// 6) KI-Positionstraining
const n = aiPositionPlans(g, '1975-07-01');
const trainers = all.filter((p) => p.positionSkill?.train && p.clubId !== g.managedClubId);
console.log(`KI: ${n} Vereine planen Positionstraining`);
ok(n > 5 && trainers.length === n, 'KI nutzt Positionstraining nicht');
const tp = trainers[0]; const tpos = tp.positionSkill!.train!; const tpv = skillOf(tp, tpos);
monthlyPositions(g, '1975-08-01'); monthlyPositions(g, '1975-09-01');
ok(skillOf(tp, tpos) > tpv, 'KI-Training ohne Fortschritt');

// 7) Wirkung: Faktor und Engine
ok(famFactor(100) === 1 && famFactor(75) > famFactor(50) && famFactor(0) <= 0.3001, 'Vertrautheitsfaktor falsch');
const clubs = leagueClubs(g);
const [h, a] = [clubs[0], clubs[1]];
// Verbuchung: Einsatzminuten erhöhen die Vertrautheit bzw. setzen den letzten Einsatz
const sim = new MatchSim(h, a, g.players, { year: 1975, seed: 3, humanClubIds: [] });
sim.runToEnd();
finishMatch(sim, { date: '1975-08-16', competition: 'Liga' });
const starters = sim.home.players.filter((m) => m.started);
ok(starters.every((m) => m.p.positionSkill?.used?.[m.pos] != null), 'Einsatz nicht verbucht');

// Taktik-Regler
const base = { formation: '', style: 'balanced', pressing: 50, tempo: 50, defensiveLine: 50 } as any;
const mHard = tacticMods({ ...base, tackleHardness: 100 }, 0, null, 0, 1);
const mSoft = tacticMods({ ...base, tackleHardness: 0 }, 0, null, 0, 1);
ok(mHard.duel > 1.05 && mSoft.duel < 0.95 && mHard.foul > mSoft.foul, 'Zweikampfhärte ohne Zweikampfwirkung');
const eHi = tacticMods({ ...base, effort: 100 }, 0, null, 0, 1);
const eLo = tacticMods({ ...base, effort: 0 }, 0, null, 0, 1);
ok(eHi.duel > eLo.duel && eHi.drain > eLo.drain && eHi.injury > eLo.injury && eHi.cards > eLo.cards, 'Einsatz-Regler wirkt nicht');
console.log(`Einsatz 100/0: Zweikampf ${eHi.duel.toFixed(2)}/${eLo.duel.toFixed(2)}, Kraft ${eHi.drain.toFixed(2)}/${eLo.drain.toFixed(2)}, Verletzung ${eHi.injury.toFixed(2)}/${eLo.injury.toFixed(2)}`);

// Spiele: Einsatz 100 gegen 0 (sonst gleiche Mannschaft): mehr Zweikämpfe gewonnen, weniger Kraft
function duelShare(effH: number, effA: number) {
  let won = 0, tot = 0, enH = 0, enA = 0;
  for (let s = 0; s < 300; s++) {
    const hh = { ...h, tactics: { ...h.tactics, effort: effH } }, aa = { ...h, id: h.id + '_b', tactics: { ...h.tactics, effort: effA } };
    const x = new MatchSim(hh, aa, g.players, { year: 1985, seed: s + 100, humanClubIds: [] });
    x.runToEnd();
    won += x.home.stats.duelsWon; tot += x.home.stats.duels;
    enH += x.home.players.filter((m) => m.started).reduce((q, m) => q + m.energy, 0);
    enA += x.away.players.filter((m) => m.started).reduce((q, m) => q + m.energy, 0);
  }
  return { share: won / tot, enH, enA };
}
const ds = duelShare(100, 0);
console.log(`Spiele Einsatz 100 vs 0: Zweikampfquote ${(ds.share * 100).toFixed(1)} %, Kraft am Ende ${(ds.enH / 3300).toFixed(1)} vs ${(ds.enA / 3300).toFixed(1)}`);
ok(ds.share > 0.53, 'Einsatz gewinnt keine Zweikämpfe');
ok(ds.enH < ds.enA, 'Einsatz kostet keine Kraft');

void ({} as Player); void ('' as Position);
console.log('Positions-Test OK');
