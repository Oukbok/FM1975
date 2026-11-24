// Taktik 2 ohne UI:  npm run test:tactics
// Stufen/Epochen-Grenzen, Rollen (Eignung, KI-Wahl, Wirkung), Eingespieltheit (Rechnung, Einüben, Wirkung im Spiel),
// Raumdeckung/Gegenpressing in der Engine, Spielablauf (Training, KI, Migration).
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { tacticPlan } from '../src/engine/match/tacticPlan';
import { effectiveTactics, markingOf, stepOf, stepValue, tacticLimits, tacticEraNotes } from '../src/engine/tacticEra';
import { ROLES, autoRole, baseRole, roleFit, roleFitFactor, roleFor, rolesFor } from '../src/engine/tacticRoles';
import { COHESION_WEIGHTS, cohesionFactor, cohesionOf, cohesionTotal, formationSimilarity, initCohesion, instructionGap, lineupShare, noteMatch, practice, practicedTactics, type Cohesion } from '../src/engine/cohesion';
import { cohesionInfo, migrateCohesion, ownTacticUnits } from '../src/game/cohesionGame';
import { coachTactics } from '../src/engine/aiManager';
import { getFormation } from '../src/data/formations';
import type { Club, Player, Tactics } from '../src/types';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FEHL'} ${msg}`); };
let seed = 7; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const g = createNewGame({
  managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const clubs = leagueClubs(g);
const P = g.players;
const me = g.clubs.mgl;

// 1) Stufen
check([0, 9, 10, 19, 21, 36, 50, 63, 81, 100].map(stepOf).join('') === '0000112344' && [0, 1, 2, 3, 4].map(stepValue).join() === '10,30,50,70,90', 'fünf Stufen: Werte 10/30/50/70/90, alte Reglerwerte fallen auf die nächste Stufe');

// 2) Epochen-Grenzen
const flat = (o: Partial<Tactics> = {}): Tactics => ({ ...me.tactics, formation: '4-4-2', marking: undefined, counterPress: undefined, ...o });
const lib = (o: Partial<Tactics> = {}): Tactics => ({ ...me.tactics, formation: 'libero-1-4-3-2', ...o });
check(getFormation('4-4-2').id === '4-4-2' && !!getFormation('libero-1-4-3-2').libero, 'Formationen der Prüfung vorhanden');
check(tacticLimits(flat(), 1975).maxPressStep === 3 && tacticLimits(flat(), 1988).maxPressStep === 4, 'Angriffspressing erst ab 1988');
check(!tacticLimits(flat(), 1980).zone && tacticLimits(flat(), 1981).zone, 'Raumdeckung ab 1981 wählbar');
check(!tacticLimits(flat(), 2007).counterPress && tacticLimits(flat(), 2008).counterPress, 'Gegenpressing ab 2008');
check(tacticLimits(lib(), 1975).maxLineStep === 2 && tacticLimits(flat({ marking: 'man' }), 1985).maxLineStep === 3 && tacticLimits(flat({ marking: 'zone' }), 1985).maxLineStep === 4, 'Abwehrlinie: Libero ≤ normal, Manndeckung ≤ hoch, Raumdeckung frei');
check(markingOf(flat(), 1990) === 'man' && markingOf(flat(), 1996) === 'zone' && markingOf(flat({ marking: 'zone' }), 1979) === 'man', 'Deckung ohne Angabe: Standard der Zeit; Raumdeckung vor 1981 nicht möglich');
const eff = effectiveTactics(lib({ pressing: 90, defensiveLine: 90, counterPress: true }), 1975)!;
check(eff.pressing === 79 && eff.defensiveLine === 59 && !eff.counterPress, `Engine kappt auf die Grenzen (Pressing ${eff.pressing}, Linie ${eff.defensiveLine})`);
check(effectiveTactics(flat({ pressing: 90, defensiveLine: 90, marking: 'zone' }), 2010)!.defensiveLine === 90, '2010 mit Raumdeckung: volle Werte');
check(tacticEraNotes(1975).next?.year === 1981 && tacticEraNotes(2030).next === null, 'Epochen-Steckbrief nennt den nächsten Schritt');
check(tacticPlan(lib({ offsideTrap: true }), 1975).trap < tacticPlan(flat({ offsideTrap: true, marking: 'man' }), 1975).trap, 'Abseitsfalle mit Libero schwächer');

// 3) Rollen
check(new Set(ROLES.map((r) => r.id)).size === ROLES.length && (['TW', 'LIB', 'IV', 'RV', 'LV', 'DM', 'ZM', 'RM', 'LM', 'OM', 'RA', 'LA', 'HS', 'MS'] as const).every((p) => rolesFor(p).filter((r) => r.base).length === 1 && rolesFor(p).length >= 2), `${ROLES.length} Rollen: jede Position hat genau eine Grundrolle und mindestens eine Spezialrolle`);
check(!rolesFor('TW', 1991).some((r) => r.id === 'tw_mit') && rolesFor('TW', 1992).some((r) => r.id === 'tw_mit') && roleFor('fl_inv', 'RA', 1990).id === 'fl' && roleFor('ms_wand', 'IV', 2000).id === 'iv', 'Rollen: Freischaltjahr und Position werden geprüft');
const squad = me.playerIds.map((id) => P[id]).filter(Boolean) as Player[];
const striker = squad.filter((p) => p.naturalPosition === 'MS' || p.naturalPosition === 'HS')[0] ?? squad[0];
const fits = rolesFor('MS', 1975).filter((r) => !r.base).map((r) => roleFit(striker, r)!);
check(fits.every((f) => f > 20 && f < 100) && roleFit(striker, baseRole('MS')) === null, `Eignung aus Schlüsselattributen (${striker.lastName}: ${fits.map((f) => f.toFixed(0)).join('/')})`);
check(roleFitFactor(striker, baseRole('MS'), 80) === 1 && roleFitFactor(striker, ROLES.find((r) => r.id === 'ms_box')!, 30) === 1.025 && roleFitFactor(striker, ROLES.find((r) => r.id === 'ms_box')!, 99) === 0.96, 'Passung: Grundrolle 1, Spezialist höchstens +2,5 %, Fehlbesetzung höchstens −4 %');
let special = 0, total = 0;
for (const c of clubs) for (const id of c.playerIds) { const p = P[id]; if (!p) continue; total++; if (!autoRole(p, p.naturalPosition, 1975, p.overall).base) special++; }
{ const ds: number[] = []; for (const c of clubs) for (const id of c.playerIds) { const p = P[id]; if (!p) continue; let bestD = -99; for (const r of rolesFor(p.naturalPosition, 1975)) { const f = roleFit(p, r); if (f != null) bestD = Math.max(bestD, f - p.overall); } if (bestD > -99) ds.push(bestD); } ds.sort((a, b) => a - b); console.log('     beste Spezialrolle gegen Stärke: Median', ds[Math.floor(ds.length / 2)].toFixed(1), '10 %', ds[Math.floor(ds.length * 0.1)].toFixed(1), '90 %', ds[Math.floor(ds.length * 0.9)].toFixed(1)); }
check(special / total > 0.15 && special / total < 0.85, `KI-Rollenwahl: ${(100 * special / total).toFixed(0)} % der Spieler bekommen eine Spezialrolle`);

// 4) Eingespieltheit – Rechnung
const t0 = flat({ style: 'balanced', pressing: 50, tempo: 50, defensiveLine: 50, widthFocus: 50, tackleHardness: 50, buildup: 'short', crossStyle: 'mixed', offsideTrap: false, marking: 'man' });
const co = initCohesion(t0, 1985);
const base = cohesionOf(co, t0, 1985);
check(base.total >= 90 && base.instructions === 100, `eingespielt auf die eigene Taktik: ${base.total}`);
const t1 = { ...t0, style: 'attacking' as const, pressing: 70, defensiveLine: 70 };
const chg = cohesionOf(co, t1, 1985);
check(chg.total < base.total - 25 && chg.instructions < 30 && instructionGap(co, t1, 1985).parts.filter((p) => p.gap > 0.1).map((p) => p.key).sort().join() === 'ds,li,pr,st', `Umstellen kostet: ${base.total} → ${chg.total} (Mentalität mit/gegen Ball, Pressing, Linie weichen ab)`);
const small = cohesionOf(co, { ...t0, tempo: 70 }, 1985);
check(small.total < base.total && small.total > base.total - 8, `kleine Änderung kostet wenig: ${base.total} → ${small.total}`);
const newF = cohesionOf(co, { ...t0, formation: '4-3-3' }, 1985);
check(newF.formation < base.formation && newF.formation > 30 && formationSimilarity('4-4-2', '4-3-3') > formationSimilarity('4-4-2', 'libero-1-4-3-2'), `fremde Formation: ${base.formation} → ${newF.formation} (verwandte Systeme helfen)`);
let weeks = 0;
const co2 = JSON.parse(JSON.stringify(co));
while (cohesionOf(co2, t1, 1985).total < base.total - 3 && weeks < 60) { noteMatch(co2, t1, 1985, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']); practice(co2, t1, 1985, 0.035 * 2, 0.02 * 2); weeks++; }
check(weeks >= 4 && weeks <= 16, `Einüben mit einem Spiel und zwei Taktik-Einheiten je Woche: ${weeks} Wochen bis fast voll`);
let weeksNo = 0;
const co3 = JSON.parse(JSON.stringify(co));
while (cohesionOf(co3, t1, 1985).total < base.total - 3 && weeksNo < 60) { noteMatch(co3, t1, 1985, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']); weeksNo++; }
check(weeksNo > weeks * 1.4, `ohne Taktik-Training dauert es länger: ${weeksNo} Wochen`);
const pt = practicedTactics(co);
check(pt.style === 'balanced' && pt.pressing === 50 && pt.marking === 'man' && pt.buildup === 'short', 'eingeübte Taktik lässt sich zurücklesen');
const co4 = JSON.parse(JSON.stringify(co));
noteMatch(co4, t0, 1985, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
for (let i = 0; i < 6; i++) noteMatch(co4, t0, 1985, 'lmnopqrstuv'.split('').map((x) => x + i));
check(cohesionOf(co4, t0, 1985).lineup < 40, `ständig neue Startelf: Stammelf-Anteil ${cohesionOf(co4, t0, 1985).lineup}`);
// 4b) Nachrechnen mit festen Zahlen (Wunsch Pascal: 40 % Formation, 40 % Anweisungen, 20 % Stammelf;
//     Stammelf aus den letzten drei Spielen 50/30/20, neuestes zuerst)
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
check(COHESION_WEIGHTS.formation === 0.4 && COHESION_WEIGHTS.instructions === 0.4 && COHESION_WEIGHTS.lineup === 0.2, 'Gewichte exakt 0,40 / 0,40 / 0,20');
{
  const r1 = cohesionTotal(80, 60, 50); // 32 + 24 + 10 = 66, nichts fremd
  const r2 = cohesionTotal(100, 100, 0); // 40 + 40 + 0 = 80 (Stammelf löst nie einen Abzug aus)
  const r3 = cohesionTotal(90, 30, 100); // 36 + 12 + 20 = 68, Anweisungen 20 unter 50 → −7 → 61
  const r4 = cohesionTotal(40, 0, 85); // 16 + 0 + 17 = 33, schwächster Teil 0 → −17,5 → 15,5
  check(near(r1.total, 66) && near(r1.penalty, 0) && near(r2.total, 80) && near(r2.penalty, 0) && near(r3.linear, 68) && near(r3.penalty, 7) && near(r3.total, 61) && near(r4.total, 15.5),
    `Gesamt nachgerechnet: 80/60/50 → ${r1.total}, 100/100/0 → ${r2.total}, 90/30/100 → ${r3.linear} − ${r3.penalty} = ${r3.total}, 40/0/85 → ${r4.total}`);
  const xi = 'abcdefghijk'.split('');
  const g1 = xi, g2 = 'abcdefghXYZ'.split(''), g3 = 'abcdeVWXYZQ'.split(''); // 11, 8, 5 von 11 gleich
  const s3 = lineupShare(xi, [g1, g2, g3])!, s2 = lineupShare(xi, [g2, g3])!, s1 = lineupShare(xi, [g3])!;
  check(near(s3, 0.5 * 1 + 0.3 * 8 / 11 + 0.2 * 5 / 11) && near(s2, (0.5 * 8 / 11 + 0.3 * 5 / 11) / 0.8) && near(s1, 5 / 11) && lineupShare(xi, []) === null
    && near(lineupShare(xi, [g3, g1, g1])!, 0.5 * 5 / 11 + 0.3 + 0.2) && near(lineupShare(xi, [g1, g2, g3, []])!, s3),
    `Stammelf 50/30/20: 11/8/5 gleich → ${(s3 * 100).toFixed(1)} (= 80,9), nur zwei Spiele → ${(s2 * 100).toFixed(1)}, eins → ${(s1 * 100).toFixed(1)}, das letzte Spiel zählt am meisten, ein viertes gar nicht`);
  // Ablauf über noteMatch: Startelfen werden gemerkt (neueste zuerst, höchstens drei) und in cohesionOf verrechnet
  const c5: Cohesion = initCohesion(t0, 1985, 100, 0.85);
  noteMatch(c5, t0, 1985, g3); noteMatch(c5, t0, 1985, g2);
  check(c5.xis!.length === 2 && c5.xis![0].join('') === g2.join('') && near(c5.s, 8 / 11), `noteMatch: Stammelf-Wert des Spiels ${(c5.s * 100).toFixed(1)} (8 von 11 aus dem Spiel davor, a–e und X/Y/Z)`);
  noteMatch(c5, t0, 1985, g1); noteMatch(c5, t0, 1985, xi.map((x) => x + '9'));
  check(c5.xis!.length === 3 && c5.xis![1].join('') === g1.join('') && c5.xis![2].join('') === g2.join(''), 'noteMatch: höchstens drei Startelfen, neueste zuerst');
  const c6: Cohesion = initCohesion(t0, 1985, 100, 0.85); c6.xis = [g1, g2, g3];
  const v6 = cohesionOf(c6, t0, 1985, t0.formation, xi);
  const exp6 = 0.4 * 100 + 0.4 * 100 + 0.2 * (100 * s3);
  check(v6.lineup === Math.round(100 * s3) && v6.formation === 100 && v6.instructions === 100 && v6.total === Math.round(exp6) && v6.penalty === 0,
    `cohesionOf: Formation 100, Anweisungen 100, Stammelf ${v6.lineup} → ${v6.total} (erwartet ${exp6.toFixed(2)})`);
  const old: Cohesion = { ...initCohesion(t0, 1985, 100, 0.7), xi: g2 }; // Altstand: nur das letzte Spiel bekannt
  check(cohesionOf(old, t0, 1985, t0.formation, xi).lineup === Math.round(800 / 11) && cohesionOf(old, t0, 1985).lineup === 70, 'Altstand: co.xi zählt als letztes Spiel, ohne Elf gilt co.s');
  noteMatch(old, t0, 1985, xi);
  check(old.xi === undefined && old.xis!.length === 2 && old.xis![1].join('') === g2.join(''), 'Altstand: co.xi wandert beim nächsten Spiel nach co.xis');
}
check(cohesionFactor(80) === 1 && cohesionFactor(100) > 1.01 && cohesionFactor(40) < 0.97, 'Wirkung: 80 neutral, 100 knapp +2 %, 40 gut −3 %');

// 5) Wirkung im Spiel
setEraYear(1995);
const A: Club = clubs[2], B: Club = clubs[9];
function series(home: Club, away: Club, n: number): { pts: number; gf: number; ga: number; errs: number; crossShare: number } {
  let pts = 0, gf = 0, ga = 0, errs = 0, cr = 0, crAll = 0;
  for (let i = 0; i < n; i++) {
    for (const flip of [false, true]) {
      const s = new MatchSim(flip ? away : home, flip ? home : away, P, { year: 1995, seed: 1000 + i * 13 + (flip ? 5 : 0), humanClubIds: [home.id] });
      s.runToEnd();
      const T = flip ? s.away : s.home, O = flip ? s.home : s.away;
      pts += T.goals > O.goals ? 3 : T.goals === O.goals ? 1 : 0; gf += T.goals; ga += O.goals;
      for (const m of T.players) { errs += m.errors; crAll += m.crosses ?? 0; if (m.pos === 'RV' || m.pos === 'LV') cr += m.crosses ?? 0; }
    }
  }
  return { pts: pts / (2 * n), gf: gf / (2 * n), ga: ga / (2 * n), errs: errs / (2 * n), crossShare: cr / Math.max(1, crAll) };
}
const tA = flat({ ...A.tactics, formation: '4-4-2', marking: 'man', roles: undefined });
const lineup = { ...A, tactics: tA };
// Eingespieltheit wirkt auf Angriff/Kontrolle/Abwehr und auf die Fehler im Aufbau (fest gerechnet, kein Zufall)
const kick = (home: Club) => new MatchSim(home, B, P, { year: 1995, seed: 5, humanClubIds: [home.id] }).home;
const strange: Tactics = { ...tA, style: tA.style === 'attacking' ? 'defensive' : 'attacking', pressing: 90 - (tA.pressing ?? 50), defensiveLine: 90 - (tA.defensiveLine ?? 50), buildup: tA.buildup === 'long' ? 'short' : 'long', formation: 'libero-1-4-3-2' };
const mGood = kick({ ...lineup, cohesion: initCohesion(tA, 1995, 100, 0.95) }).mods, mBad = kick({ ...lineup, cohesion: initCohesion(strange, 1995, 100, 0.5) }).mods, mNone = kick({ ...lineup, cohesion: undefined }).mods;
check(mGood.att > mNone.att * 1.01 && mBad.att < mNone.att * 0.97 && mBad.errors > mNone.errors * 1.15 && mGood.errors === mNone.errors,
  `Eingespieltheit im Spiel: Angriff eingespielt ×${(mGood.att / mNone.att).toFixed(3)}, fremde Taktik ×${(mBad.att / mNone.att).toFixed(3)}, Fehler ×${(mBad.errors / mNone.errors).toFixed(2)}`);
// Rollen: offensive Außenverteidiger flanken mehr und verschieben Angriff/Abwehr der Mannschaft
const slots = getFormation('4-4-2').slots;
const avRoles = (id: string) => Object.fromEntries(slots.filter((s) => s.position === 'RV' || s.position === 'LV').map((s) => [s.id, id]));
const base11 = { ...lineup, cohesion: undefined };
const off = series({ ...base11, tactics: { ...tA, roles: avRoles('av_off') } }, B, 120);
const def = series({ ...base11, tactics: { ...tA, roles: avRoles('av_def') } }, B, 120);
check(off.crossShare > def.crossShare * 1.6, `Rolle wirkt: Flankenanteil der Außenverteidiger offensiv ${(off.crossShare * 100).toFixed(0)} %, defensiv ${(def.crossShare * 100).toFixed(0)} %`);
const uOff = kick({ ...base11, tactics: { ...tA, roles: avRoles('av_off') } }), uDef = kick({ ...base11, tactics: { ...tA, roles: avRoles('av_def') } }), uBase = kick(base11);
check(uOff.units.attack > uBase.units.attack && uOff.units.defense < uBase.units.defense && uDef.units.attack < uBase.units.attack && uDef.units.defense > uBase.units.defense,
  `Rolle verschiebt die Mannschaftsteile: Angriff ${uDef.units.attack.toFixed(1)} / ${uBase.units.attack.toFixed(1)} / ${uOff.units.attack.toFixed(1)}, Abwehr ${uDef.units.defense.toFixed(1)} / ${uBase.units.defense.toFixed(1)} / ${uOff.units.defense.toFixed(1)} (defensiv / Grundrolle / offensiv)`);
check(uBase.players.filter((m) => m.onPitch).every((m) => m.rfit === 1 && m.rd === 1), 'ohne Rollen: alle Spieler neutral');
// Raumdeckung: greift nur eingespielt
const zoneT = { ...tA, marking: 'zone' as const };
const zGood = kick({ ...base11, tactics: zoneT, cohesion: initCohesion(zoneT, 1995, 100, 0.95) }).plan, zBad = kick({ ...base11, tactics: zoneT, cohesion: initCohesion(strange, 1995, 100, 0.5) }).plan, zMan = kick({ ...base11, tactics: tA, cohesion: initCohesion(tA, 1995, 100, 0.95) }).plan;
check(zMan.zone === 0 && zGood.zone > 0.9 && zBad.zone < 0.4 && zGood.pressBias > zMan.pressBias && zBad.pressBias < zMan.pressBias && zGood.tackleBias < zMan.tackleBias,
  `Raumdeckung: eingespielt Güte ${zGood.zone.toFixed(2)} (fängt mehr Pässe ab), fremd ${zBad.zone.toFixed(2)} (schlechter als Manndeckung), im Zweikampf weniger eng`);
// Gegenpressing: Konter des Gegners werden gestoppt, kostet Kraft
const cp = kick({ ...base11, tactics: { ...tA, counterPress: true } }), noCp = kick({ ...base11, tactics: { ...tA, counterPress: false } });
const cp10 = new MatchSim({ ...base11, tactics: { ...tA, counterPress: true } }, B, P, { year: 2010, seed: 5, humanClubIds: [A.id] }).home, no10 = new MatchSim({ ...base11, tactics: { ...tA, counterPress: false } }, B, P, { year: 2010, seed: 5, humanClubIds: [A.id] }).home;
check(cp.mods.exposed === noCp.mods.exposed && cp10.mods.exposed < no10.mods.exposed * 0.9 && cp10.mods.drain > no10.mods.drain, 'Gegenpressing: 1995 ohne Wirkung, 2010 weniger Konter des Gegners und mehr Kraftverbrauch');

// 6) Spielablauf
migrateCohesion(g);
check(clubs.every((c) => !!c.cohesion) && cohesionInfo(g)!.total >= 88, `neues Spiel: alle Vereine eingespielt (eigener Verein ${cohesionInfo(g)!.total})`);
const before = cohesionInfo(g)!.total;
me.tactics.style = me.tactics.style === 'attacking' ? 'defensive' : 'attacking';
me.tactics.buildup = me.tactics.buildup === 'long' ? 'short' : 'long';
const after = cohesionInfo(g)!;
check(after.total < before - 15 && after.gaps.length >= 2 && after.effectPct < 0, `Umstellung im Spiel: ${before} → ${after.total} (${after.effectPct} %), Abweichungen: ${after.gaps.map((x) => x.label).join(', ')}`);
let units = 0;
for (let i = 0; i < 28; i++) { units += ownTacticUnits(g, g.calendar.currentDate); processDay(g, HEADLESS_UI); }
const later = cohesionInfo(g)!;
check(later.total > after.total, `vier Wochen Training (${units.toFixed(1)} Taktik-Einheiten): ${after.total} → ${later.total}`);
const ai = clubs.find((c) => c.id !== 'mgl' && c.coach)!;
const t75 = coachTactics(ai, P, ai.coach!, 1975), t99 = coachTactics(ai, P, ai.coach!, 1999), t12 = coachTactics(ai, P, ai.coach!, 2012);
check(t75.marking === 'man' && !t75.counterPress && (t99.marking === 'zone' || !!getFormation(t99.formation).libero) && typeof t12.counterPress === 'boolean', `KI: 1975 Manndeckung, 1999 ${t99.marking === 'zone' ? 'Raumdeckung' : 'Libero mit Manndeckung'}, 2012 Gegenpressing ${t12.counterPress ? 'an' : 'aus'}`);

console.log(fails ? `${fails} Prüfung(en) fehlgeschlagen` : 'Taktik-Test bestanden.');
process.exit(fails ? 1 : 0);
