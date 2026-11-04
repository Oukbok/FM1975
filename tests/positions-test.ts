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
import {
  famFactor, footFactor, mirrorPosition, normalizePosition, positionSuitability, roleOf, setEraYear, sideOf,
} from '../src/engine/positions';
import { migratePositions2 } from '../src/game/positions2Migration';
import { FORMATIONS } from '../src/data/formations';
import { PITCH_GRID } from '../src/data/pitchGrid';
import { tacticMods } from '../src/engine/match/team';
import { MatchSim } from '../src/engine/match/sim';
import { finishMatch } from '../src/engine/match/finish';
import { ALL_POSITIONS, type Player, type Position } from '../src/types';
import { BADGE_MIN, playablePositions, posGroupKey, recentPositionCounts } from '../src/ui/positionBadges';

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
ok(v1 - v0 > 30 && v1 - v0 < 60, 'Wachstum durch Einsätze unplausibel (Ziel ≈ +40 je Saison ohne Training)');
for (let i = 0; i < 20; i++) addPositionMinutes(p1, target, 90, dateOf(d += 7));
console.log(`  nach 54 Spielen: ${skillOf(p1, target)}`);
ok(skillOf(p1, target) >= 65, 'nach anderthalb Saisons noch zu niedrig');
ok(positionSuitability(p1, target) > s0, 'Eignung steigt nicht mit der Vertrautheit');
for (let i = 0; i < 40; i++) addPositionMinutes(p1, target, 90, dateOf(d += 7));
ok(p1.secondaryPositions.includes(target), 'Nebenpositionen nicht nachgeführt');

// 3b) Lerntempo (Wunsch Pascal): ähnliche Position schneller, ab 80 deutlich langsamer, Training < Spiele
{
  const mk = (nat: Position, pos: Position, v: number) => ({ id: `lt-${nat}-${pos}-${v}`, naturalPosition: nat, preferredFoot: 'right', age: 27, secondaryPositions: [],
    positionSkill: { v: { [nat]: 100, [pos]: v }, t0: 0 } }) as unknown as Player;
  const games = (q: Player, pos: Position, n: number) => { for (let i = 0; i < n; i++) addPositionMinutes(q, pos, 90, '1976-03-01'); return skillOf(q, pos); };
  const sim = games(mk('RV', 'RM', 20), 'RM', 30) - 20, far = games(mk('MS', 'ZM', 20), 'ZM', 30) - 20;
  const high = games(mk('MS', 'ZM', 80), 'ZM', 30) - 80;
  const tq = mk('MS', 'ZM', 20); setTrainingPosition(tq, 'ZM', '1976-07-01'); trainPositionDays(tq, 230, '1977-06-01');
  const tr = skillOf(tq, 'ZM') - 20;
  console.log(`Lerntempo je Saison: ähnlich +${sim.toFixed(1)}, fremd +${far.toFixed(1)}, ab 80 +${high.toFixed(1)}, nur Training +${tr.toFixed(1)}`);
  ok(far > 30 && far < 45, `Einsätze fremde Position: ${far}`);
  ok(sim > far * 1.1 && sim < far * 1.45, `ähnliche Position nicht etwas schneller: ${sim} vs ${far}`);
  ok(high < far * 0.45, `ab 80 nicht deutlich langsamer: ${high}`);
  ok(tr > 8 && tr < far * 0.6, `Training allein: ${tr}`);
}

// 4) Positionstraining: bis höchstens TRAIN_CAP
const p2 = field.find((p) => p !== p1 && p.age <= 23)!;
const t2 = ALL_POSITIONS.filter((q) => q !== 'TW' && q !== p2.naturalPosition).sort((a, b) => skillOf(p2, a) - skillOf(p2, b))[0];
setTrainingPosition(p2, t2, '1975-08-01');
const tv0 = skillOf(p2, t2);
trainPositionDays(p2, 100, '1975-12-01');
const tv1 = skillOf(p2, t2);
trainPositionDays(p2, 2000, '1980-12-01');
console.log(`Training: ${t2} ${tv0} → ${tv1} nach 100 Tagen, Deckel ${skillOf(p2, t2)}`);
ok(tv1 - tv0 >= 4 && tv1 - tv0 <= 15, 'Trainingsfortschritt unplausibel');
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


// 8) Positionen 2.0: Seiten, Fuß, Raster, Migration alter Spielstände
setEraYear(1975);
ok(ALL_POSITIONS.length === 14 && ALL_POSITIONS.every((q) => !['VS', 'AV', 'FL'].includes(q)), 'Positionsliste nicht 2.0');
ok(sideOf('RV') === 'R' && sideOf('LM') === 'L' && sideOf('IV') === 'C' && mirrorPosition('RA') === 'LA' && mirrorPosition('ZM') === 'ZM', 'Seiten-Helfer falsch');
ok(roleOf('LV') === 'AV' && roleOf('RM') === 'SM' && roleOf('LA') === 'FL', 'Rollen-Helfer falsch');
ok(normalizePosition('VS') === 'IV' && normalizePosition('AV', { foot: 'left' }) === 'LV' && normalizePosition('FL', { foot: 'right' }) === 'RA'
  && normalizePosition('fl', { foot: 'both', side: 'L' }) === 'LA' && normalizePosition('XX') === null, 'Alte Kürzel werden nicht eingelesen');
// Raster und Formationen: Seite passt zur Lage
for (const pt of PITCH_GRID) ok(sideOf(pt.position) === 'C' || (sideOf(pt.position) === 'L') === (pt.x < 50), `Rasterpunkt ${pt.id} auf falscher Seite`);
for (const f of FORMATIONS) for (const sl of f.slots) ok(sideOf(sl.position) === 'C' || (sideOf(sl.position) === 'L') === (sl.x < 50), `${f.id} ${sl.id} auf falscher Seite`);
// Erzeugung: Außenbahn-Spieler meist mit dem passenden Fuß, Gegenseite deutlich schwächer
const pros = Object.values(g.players);
const share = (pos: Position, foot: string) => { const xs = pros.filter((p) => p.naturalPosition === pos); return xs.filter((p) => p.preferredFoot === foot).length / Math.max(1, xs.length); };
console.log(`Fuß: LV links ${(share('LV', 'left') * 100).toFixed(0)} %, RV rechts ${(share('RV', 'right') * 100).toFixed(0)} %, LA links ${(share('LA', 'left') * 100).toFixed(0)} %`);
ok(share('LV', 'left') >= 0.55 && share('RV', 'right') >= 0.75 && share('LA', 'left') >= 0.55, 'Fuß passt selten zur Seite');
const rvs = pros.filter((p) => p.naturalPosition === 'RV' && p.preferredFoot === 'right');
const lvGood = rvs.filter((p) => skillOf(p, 'LV') >= 75).length / rvs.length;
const rmAvg = rvs.reduce((q, p) => q + skillOf(p, 'RM'), 0) / rvs.length, lmAvg = rvs.reduce((q, p) => q + skillOf(p, 'LM'), 0) / rvs.length;
console.log(`Rechtsfüßige RV (${rvs.length}): LV „gut“ ${(lvGood * 100).toFixed(0)} %, Ø RM ${rmAvg.toFixed(0)} / LM ${lmAvg.toFixed(0)}`);
ok(lvGood < 0.5, 'Gegenseite zu oft gut');
ok(rmAvg > lmAvg + 8, 'Seite spielt bei Nachbarpositionen keine Rolle');
// Fuß-Faktor: schwacher Fuß kostet auf der Seite etwas, beidfüßig nichts; inverse Flügel ab 2005 normal
const fp = { ...rvs[0], preferredFoot: 'right' } as Player;
ok(footFactor(fp, 'RV') === 1 && footFactor(fp, 'LV') < 1 && footFactor(fp, 'IV') === 1, 'Fuß-Faktor Verteidiger');
ok(footFactor({ ...fp, preferredFoot: 'both' } as Player, 'LV') === 1, 'Beidfüßig mit Abzug');
setEraYear(2010); ok(footFactor(fp, 'LA') === 1, 'Inverser Flügel 2010 mit Abzug'); setEraYear(1975);
ok(footFactor(fp, 'LA') < 1, 'Flügel 1975 auf falscher Seite ohne Abzug');

// Migration: alter Spielstand mit VS/AV/FL
const legacy = (src: Player, nat: string, foot: Player['preferredFoot'], id: string): Player => {
  const q = JSON.parse(JSON.stringify(src)) as any;
  q.id = id; q.naturalPosition = nat; q.preferredFoot = foot; q.secondaryPositions = ['VS'];
  q.positionRatings = { [nat]: q.overall };
  q.positionSkill = { v: { TW: 3, LIB: 55, VS: 80, AV: nat === 'AV' ? 100 : 40, DM: 50, ZM: 45, OM: 20, FL: nat === 'FL' ? 100 : 62, MS: 15, HS: 18 }, t0: 2000, used: { AV: 2001 }, train: 'FL' };
  return q as Player;
};
const gm = JSON.parse(JSON.stringify(g)) as typeof g;
const host = Object.values(gm.clubs).find((c) => c.id !== gm.managedClubId && c.tactics?.lineupMap)!;
const base0 = gm.players[host.playerIds[0]];
const lvL = legacy(base0, 'AV', 'left', 'mig_lv'), raR = legacy(base0, 'FL', 'right', 'mig_ra'), avB = legacy(base0, 'AV', 'both', 'mig_both'), vs = legacy(base0, 'VS', 'right', 'mig_iv');
for (const q of [lvL, raR, avB, vs]) gm.players[q.id] = q;
// Beidfüßiger stand bisher rechts in der Aufstellung (4-4-2, Slot s5 = x 84)
host.tactics.formation = '4-4-2';
host.tactics.lineupMap = { ...(host.tactics.lineupMap ?? {}), s5: avB.id };
host.tactics.assignedPositions = { [avB.id]: 'AV' as Position, [raR.id]: 'FL' as Position };
host.tactics.slotLayout = { s9: { x: 84, y: 26, position: 'FL' as Position }, s6: { x: 15, y: 48, position: 'FL' as Position }, s3: { x: 38, y: 72, position: 'VS' as Position } };
const nMig = migratePositions2(gm);
ok(nMig === 4, `Migration zählt ${nMig} statt 4`);
ok(migratePositions2(gm) === 0, 'Migration nicht idempotent');
ok(lvL.naturalPosition === 'LV' && raR.naturalPosition === 'RA' && avB.naturalPosition === 'RV' && vs.naturalPosition === 'IV', 'Stammposition falsch umgerechnet');
ok(skillOf(lvL, 'LV') === 100 && skillOf(lvL, 'RV') >= 50 && skillOf(lvL, 'RV') < 75, `Gegenseite LV→RV ${skillOf(lvL, 'RV')}`);
ok(skillOf(avB, 'LV') >= 75, 'Beidfüßiger auf der Gegenseite nicht gut');
ok(skillOf(raR, 'RM') >= 75 && skillOf(raR, 'RM') > skillOf(raR, 'LM'), `Flügel → RM ${skillOf(raR, 'RM')} / LM ${skillOf(raR, 'LM')}`);
ok(skillOf(vs, 'IV') === 100 && lvL.positionSkill!.v.IV === 80, 'VS → IV falsch');
ok(lvL.positionSkill!.train === 'LA' && raR.positionSkill!.train === 'RA' && lvL.positionSkill!.used?.LV === 2001, 'Training/Einsatz nicht umgerechnet');
for (const q of [lvL, raR, avB, vs]) {
  const keys = [...Object.keys(q.positionSkill!.v), ...q.secondaryPositions, ...Object.keys(q.positionRatings)];
  ok(keys.every((k) => (ALL_POSITIONS as string[]).includes(k)), `${q.id}: alte Kürzel übrig (${keys.join(',')})`);
  ok(ALL_POSITIONS.every((k) => q.positionSkill!.v[k] != null), `${q.id}: Positionen fehlen`);
}
ok(host.tactics.slotLayout!.s9.position === 'RA' && host.tactics.slotLayout!.s6.position === 'LM' && host.tactics.slotLayout!.s3.position === 'IV', 'slotLayout falsch umgerechnet');
ok(host.tactics.assignedPositions![avB.id] === 'RV' && host.tactics.assignedPositions![raR.id] === 'RA', 'assignedPositions falsch umgerechnet');
console.log('Positionen 2.0: Seiten, Fuß, Raster und Migration OK');

// Positionsetiketten (ui/positionBadges.ts): Gruppenfarbe, Schwelle 80, stärkste zuerst, Gleichstand nach Einsätzen
{
  ok(posGroupKey('TW') === 'gk' && posGroupKey('LIB') === 'def' && posGroupKey('RV') === 'def' && posGroupKey('DM') === 'mid'
    && posGroupKey('LM') === 'mid' && posGroupKey('RA') === 'att' && posGroupKey('HS') === 'att' && posGroupKey('VS') === 'def' && posGroupKey('xx') === null, 'Gruppenfarben falsch');
  let multi = 0, more = 0;
  for (const p of all.slice(0, 600)) {
    const l = playablePositions(p);
    ok(l.some((e) => e.pos === p.naturalPosition), `${p.id}: Stammposition fehlt im Etikett`);
    ok(l.every((e) => e.pos === p.naturalPosition || e.skill >= BADGE_MIN), `${p.id}: Position unter ${BADGE_MIN} im Etikett`);
    ok(l.every((e, i) => i === 0 || l[i - 1].value >= e.value), `${p.id}: nicht nach Stärke sortiert`);
    if (l.length > 1) multi++;
    if (l.length > 2) more++;
  }
  ok(BADGE_MIN === 80, 'Etiketten-Schwelle nicht 80');
  ok(multi > 50 && multi < 600, `Mehrfach-Positionen unplausibel: ${multi}/600`);
  // Gleichstand: gleiche Stärke → häufiger gespielte zuerst
  const q = JSON.parse(JSON.stringify(all.find((p) => p.naturalPosition === 'RV')!)) as Player;
  q.positionSkill!.v.LV = 100;
  const tie = (q.preferredFoot as string) === 'both' || positionSuitability(q, 'RV') === positionSuitability(q, 'LV');
  q.history = { matches: Array.from({ length: 25 }, (_, i) => ({ date: '1976-01-01', competition: 'Liga' as const, opponent: 'x', home: true, score: '0:0', minutes: 90, goals: 0, assists: 0, rating: 3, pos: (i < 5 ? 'RV' : 'LV') as Position })) };
  const rc = recentPositionCounts(q);
  ok(rc.LV === 20 && !rc.RV, `Zählung letzte 20 Spiele falsch: ${JSON.stringify(rc)}`);
  if (tie) ok(playablePositions(q)[0].pos === 'LV', 'Gleichstand nicht nach Einsätzen entschieden');
  console.log(`Positionsetiketten OK (mehrere: ${multi}/600, mehr als zwei: ${more}/600)`);
}

void ({} as Player); void ('' as Position);
console.log('Positions-Test OK');
