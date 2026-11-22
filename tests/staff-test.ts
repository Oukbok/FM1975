// Trainerteam & Arbeitsmarkt ohne UI: Fachgebiete, Verhandlung, Entlassung, KI-Stäbe/Abwerben,
// Migration, Trainingsplan-Sperren – und eine Langzeit-Simulation über viele
// Saisons (Pool nie leer, gesunde Verteilung, Ex-Profis, Erfolg → Trainergüte).
//   npm run test:staff            (Standard 40 Saisons)
//   npm run test:staff -- 10      (kürzer)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { Game } from '../src/game/state';
import { StaffMember } from '../src/engine/staffPeople';
import {
  acceptsOffer, bestRoles, COACH_SKILLS, roleFit, roleQuality, ROLE_SKILLS, rolesAvailable, roleSlots, staffLevel, staffValueOf, AI_TRACKED_ROLES, TEAM_ROLE_IDS,
} from '../src/engine/staffSkills';
import { careerSuccess, coachAsStaff, staffFromPlayer } from '../src/engine/staffGen';
import { assistantsNeeded, coachingTeam, coachPotCut, declineFactor, dragChance, levelNeeded, pushChance, teachFactor } from '../src/engine/coaching';
import { coachCutFor, coachLevelFor, distanceFactor, setClubCoaching, truePotential } from '../src/engine/development';
import { ensureStaffWorld, findPerson, headCoachMarket, marketForRole, migrateStaffPeople, staffMarket, staffOfClub } from '../src/game/staffWorld';
import { canReassign, demandOf, dismiss, offerContract, quickHire, reassign, sendToCourse, severanceOf, slotInfo, startingStaff, blockFactorFn } from '../src/game/trainerTeam';
import { ensureStaff } from '../src/game/staffGame';
import { bindCoaching, coachingOutlook, ownCoaching } from '../src/game/coachingGame';
import { STAFF_ROLES } from '../src/data/staff';
import { weekInfos, migrateTrainingPlan } from '../src/game/trainingWeek';
import { addDaysISO, applyTemplate, effectiveDay, weekEffect, mondayOf, PLAN_TEMPLATES } from '../src/engine/trainingPlan';
import { BLOCKS_BY_ID } from '../src/engine/weeklyTraining';
import { applyScheduledTemplate, matchingTemplate, seasonWeeks, setWeekTemplate } from '../src/game/trainingSeason';
import { isLeagueClub } from '../src/engine/clubEconomy';
import { STAFF_BY_ID, staffAvailable } from '../src/data/staff';
import { staffAiChecks } from './staff-ai-checks';

const SEASONS = Number(process.argv[2] ?? 40);
let seed = 1975;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function fresh(): Game {
  return createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}
function finite(m: StaffMember): boolean {
  return Number.isFinite(m.quality) && COACH_SKILLS.every((k) => { const v = m.skills?.[k]; return v != null && Number.isFinite(v) && v >= 1 && v <= 20; });
}

// ---------------------------------------------------------------------------
// 1) Neues Spiel: Arbeitsmarkt angelegt, KI-Vereine besetzt, eigener Stab mit Fachgebieten
// ---------------------------------------------------------------------------
const g = fresh();
const w = ensureStaffWorld(g);
const ai = Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.id !== g.managedClubId);
const coFilled = ai.filter((c) => staffOfClub(g, c.id).some((m) => m.roleId === 'cotrainer')).length;
if (coFilled < ai.length) fail(`nicht alle KI-Vereine mit Co-Trainer (${coFilled}/${ai.length})`);
const free0 = w.people.filter((m) => !m.clubId);
if (free0.length < 12) fail(`zu wenige Bewerber zu Spielbeginn (${free0.length})`);
if (free0.some((m) => !staffAvailable(STAFF_BY_ID[m.roleId], 1975))) fail('Bewerber für eine Rolle, die es 1975 noch nicht gibt');
// Jede Stelle des Katalogs hat Gewichte (Summe 1); für jede Stelle der Zeit gibt es brauchbare Bewerber.
for (const r of STAFF_ROLES) {
  const w = ROLE_SKILLS[r.id];
  if (!w) fail(`Stelle ohne Fähigkeiten-Gewichte: ${r.id}`);
  const sum = Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
  if (Math.abs(sum - 1) > 1e-6) fail(`Gewichte der Stelle ${r.id} ergeben ${sum}`);
}
for (const role of rolesAvailable(1975)) {
  const ok = staffMarket(g, { role, onlyFree: true }).filter((x) => x.fit >= 7).length;
  if (ok < (role === 'cheftrainer' ? 2 : 3)) fail(`1975 nur ${ok} brauchbare Bewerber als ${role}`);
}
if (free0.length < 60) fail(`Pool zu klein (${free0.length})`);
// Stärke-Skala: 1–20 ↔ 1–99, umkehrbar, oben wie Spieler
if (staffLevel(20) !== 99 || staffLevel(14) !== 84 || staffLevel(8) !== 69 || Math.abs(staffValueOf(staffLevel(11)) - 11) > 0.3) fail('Stärke-Skala verschoben');
// Eigener Stab zu Spielbeginn: Cheftrainer + gebrauchte Co-Trainer, keine Abzüge
{
  const t = ownCoaching(g);
  if (!t.head || t.missing > 0 || t.penalty !== 0) fail(`Start ohne vollständiges Trainerteam: Chef ${!!t.head}, fehlend ${t.missing}`);
  const ai1 = [...bindCoaching(g).entries()].filter(([id]) => id !== g.managedClubId).map(([, c]) => c.level);
  console.log(`Trainerniveau zu Beginn: eigener Verein ${t.level.toFixed(0)} (Chef ${t.headLevel.toFixed(0)}, Co ${t.assistLevel.toFixed(0)}), KI ${Math.min(...ai1).toFixed(0)}–${Math.max(...ai1).toFixed(0)} (Ø ${avg(ai1).toFixed(1)})`);
  if (Math.abs(t.level - avg(ai1)) > 14) fail('eigenes Trainerniveau weit weg vom Ligaschnitt');
}
for (const m of ensureStaff(g)) if (!m.skills || !finite(m)) fail(`eigener Mitarbeiter ohne gültige Fachgebiete: ${m.name}`);
// Ruf → Qualität: große Vereine haben im Schnitt bessere Co-Trainer
const sorted = [...ai].sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
const coQ = (cs: typeof ai) => avg(cs.map((c) => staffOfClub(g, c.id).find((m) => m.roleId === 'cotrainer')?.quality ?? 0));
const topQ = coQ(sorted.slice(0, 5)), lowQ = coQ(sorted.slice(-5));
console.log(`Start 1975: ${w.people.length} Personen, ${free0.length} vereinslos, Co-Trainer Top-5-Vereine Ø ${topQ.toFixed(1)}, Letzte 5 Ø ${lowQ.toFixed(1)}`);
if (topQ <= lowQ) fail('große Vereine haben kein besseres Trainerteam');

// ---------------------------------------------------------------------------
// 2) Verhandlung, Anstellung, Entlassung
// ---------------------------------------------------------------------------
{
  const cand = marketForRole(g, 'jugendtrainer').find((m) => !m.clubId && !m.coach) ?? fail('kein Jugendtrainer frei');
  const rep = g.clubs[g.managedClubId].reputation ?? 60;
  const d = demandOf(g, cand, 'jugendtrainer');
  if (acceptsOffer(cand, d * 0.7, 2, rep, d)) fail('70 % der Forderung angenommen');
  if (!acceptsOffer(cand, d, 2, rep, d)) fail('volle Forderung abgelehnt');
  const low = offerContract(g, cand.id, d * 0.7, 2, { roleId: 'jugendtrainer' });
  if (low.ok) fail('zu niedriges Angebot führte zur Anstellung');
  const bal0 = g.clubs[g.managedClubId].finances.balance;
  const res = offerContract(g, cand.id, d, 3, { roleId: 'jugendtrainer' });
  if (!res.ok) fail(`Anstellung fehlgeschlagen: ${res.text}`);
  const hired = ensureStaff(g).find((m) => m.name === cand.name && m.roleId === 'jugendtrainer') ?? fail('nicht im Stab');
  if (g.staffWorld!.people.some((m) => m.id === cand.id)) fail('Person doppelt (Markt und Stab)');
  if (!hired.contractEnd || hired.contractEnd < '1977-06-30') fail(`Vertragsende falsch: ${hired.contractEnd}`);
  const sev = severanceOf(g, hired);
  if (sev <= 0) fail('keine Abfindung');
  dismiss(g, hired.id);
  const bal1 = g.clubs[g.managedClubId].finances.balance;
  if (bal1 > bal0 - sev + 1) fail('Abfindung nicht gebucht');
  if (!g.staffWorld!.people.some((m) => m.name === cand.name && !m.clubId)) fail('Entlassener nicht zurück auf dem Markt');
  // Abwerben eines großen Vereins klappt für einen kleinen Verein nicht.
  const big = sorted[0];
  const theirs = staffOfClub(g, big.id).find((m) => m.roleId === 'cotrainer')!;
  if ((g.clubs[g.managedClubId].reputation ?? 60) < (big.reputation ?? 60) - 4 && offerContract(g, theirs.id, 5, 3).ok) fail('Abwerben vom Großverein trotz geringem Ruf');
  console.log(`Verhandlung: Forderung ${d.toFixed(2)}, Abfindung ${sev}, Abwerben vom Großverein blockiert`);
}

// ---------------------------------------------------------------------------
// 2b) Ein Pool für alle Stellen: Eignung, Filter, mehrere Plätze, Versetzen, Fortbildung, Cheftrainer
// ---------------------------------------------------------------------------
{
  // Sortierung nach Eignung; Filter nach Fähigkeit
  const sc = staffMarket(g, { role: 'scout_1975', onlyFree: true });
  if (sc.length < 20) fail('Markt für Scouts zeigt nicht den ganzen Pool');
  for (let i = 1; i < sc.length; i++) if (sc[i].fit > sc[i - 1].fit + 1e-9) fail('Markt nicht nach Eignung sortiert');
  if (sc[0].fit !== roleFit(sc[0].m.skills, 'scout_1975')) fail('Eignung der Marktzeile stimmt nicht');
  const med = staffMarket(g, { role: 'all', onlyFree: true, min: { medizin: staffValueOf(70) } });
  if (!med.length || med.some((x) => staffLevel(x.m.skills!.medizin!) < 70)) fail('Filter nach Fähigkeit greift nicht');
  if (staffMarket(g, { role: 'all', onlyFree: true, maxAge: 35 }).some((x) => x.m.age > 35)) fail('Altersfilter greift nicht');
  // Dieselbe Person für verschiedene Stellen: unterschiedliche Eignung und Forderung
  const p = sc[0].m;
  const best = bestRoles(p.skills!, 1975, 3);
  if (best[0].fit < best[2].fit) fail('bestRoles nicht sortiert');
  // Co-Trainer: mehrere Plätze füllen sich der Reihe nach, erst dann wird ersetzt
  const slots = roleSlots('cotrainer', 1975);
  const before = slotInfo(g, 'cotrainer').holders.length;
  for (let i = before; i < slots; i++) { const r = quickHire(g, 'cotrainer', i); if (!r.ok) fail(`Co-Trainer ${i + 1} nicht eingestellt: ${r.text}`); }
  if (slotInfo(g, 'cotrainer').holders.length !== slots || slotInfo(g, 'cotrainer').free !== 0) fail('Co-Trainer-Plätze nicht gefüllt');
  const n0 = ensureStaff(g).length;
  const r2 = quickHire(g, 'cotrainer');
  if (!r2.ok || ensureStaff(g).length !== n0) fail('voller Posten: Neuer muss den Schwächsten ersetzen');
  // Einen Scout als Scout einstellen, dann zum Jugendtrainer versetzen (Stelle frei) – Gehalt sinkt nicht
  const hire = offerContract(g, p.id, demandOf(g, p, 'scout_1975'), 2, { roleId: 'scout_1975' });
  if (!hire.ok) fail(`Scout nicht eingestellt: ${hire.text}`);
  const mine = ensureStaff(g).find((m) => m.name === p.name && m.roleId === 'scout_1975') ?? fail('Scout nicht im Stab');
  if (mine.quality !== roleQuality(mine.skills, 'scout_1975')) fail('Qualität folgt nicht der besetzten Stelle');
  if (canReassign(g, mine, 'cheftrainer').ok) fail('Versetzen auf besetzte Stelle erlaubt');
  if (!canReassign(g, mine, 'jugendtrainer').ok) fail('Versetzen auf freie Stelle nicht erlaubt');
  const f0 = mine.salaryFactor;
  reassign(g, mine.id, 'jugendtrainer');
  if (mine.roleId !== 'jugendtrainer' || mine.quality !== roleQuality(mine.skills, 'jugendtrainer')) fail('Versetzen hat Stelle/Qualität nicht geändert');
  if (mine.salaryFactor < f0 - 1e-9) fail('Gehalt nach dem Versetzen gesunken');
  // Fortbildung: einmal je Jahr, Fähigkeiten der Stelle steigen nicht über das Potenzial
  const lv0 = roleFit(mine.skills, mine.roleId);
  sendToCourse(g, mine.id);
  if (roleFit(mine.skills, mine.roleId) < lv0 || COACH_SKILLS.some((k) => (mine.skills![k] ?? 0) > (mine.pot![k] ?? 0) + 1e-9)) fail('Fortbildung falsch');
  const bal = g.clubs[g.managedClubId].finances.balance;
  sendToCourse(g, mine.id);
  if (g.clubs[g.managedClubId].finances.balance !== bal) fail('zweite Fortbildung im selben Jahr gebucht');
  // Cheftrainer vom Markt: freie aus dem Trainerpool, Trainer anderer Vereine nur ohne „nur vereinslos“
  const freeHeads = headCoachMarket(g, true), allHeads = headCoachMarket(g, false);
  if (allHeads.length <= freeHeads.length) fail('Trainer der KI-Vereine fehlen auf dem Markt');
  const hc = allHeads.find((m) => m.clubId)!;
  const again = coachAsStaff(g.clubs[hc.clubId!].coach!, 1975);
  if (JSON.stringify(again.skills) !== JSON.stringify(hc.skills)) fail('Cheftrainer wechselt bei jedem Blick die Fähigkeiten');
  if (Math.abs(staffLevel(roleFit(hc.skills, 'cheftrainer')) - (g.clubs[hc.clubId!].coach!.reputation + 4)) > 2) fail('Stärke des Cheftrainers passt nicht zu seinem Ansehen');
  // Abwerben eines Cheftrainers von einem kleineren Verein: Nachfolger beim alten Verein, Person bei dir
  const small = [...ai].sort((a, b) => (a.reputation ?? 0) - (b.reputation ?? 0))[0];
  const target = allHeads.find((m) => m.clubId === small.id)!;
  const oldName = small.coach!.name;
  const got = offerContract(g, target.id, demandOf(g, target, 'cheftrainer') * 1.05, 3, { roleId: 'cheftrainer' });
  if (!got.ok) fail(`Abwerben des Cheftrainers gescheitert: ${got.text}`);
  if (!small.coach || small.coach.name === oldName) fail('alter Verein ohne Nachfolger');
  if (ensureStaff(g).filter((m) => m.roleId === 'cheftrainer').length !== 1 || ensureStaff(g).find((m) => m.roleId === 'cheftrainer')!.name !== oldName) fail('Cheftrainer nicht (allein) im Stab');
  if (findPerson(g, target.id)) fail('abgeworbener Cheftrainer steht noch auf dem Markt');
  console.log(`Pool: ${sc.length} Personen für jede Stelle, Co-Trainer ${slots} Plätze, Versetzen/Fortbildung ok, Cheftrainer ${oldName} abgeworben → Nachfolger ${small.coach.name}`);
}

// ---------------------------------------------------------------------------
// 2c) Trainerteam ↔ Entwicklung: Decke, Lerntempo, Besetzung
// ---------------------------------------------------------------------------
{
  // Reine Rechnung
  if (coachPotCut(90, 85) !== 0 || coachPotCut(90, 75) !== 4 || coachPotCut(99, 60) !== 8 || coachPotCut(99, 90) !== 0) fail('Decke des Potenzials falsch');
  if (levelNeeded(80) !== 75 || levelNeeded(99) !== 90) fail('gebrauchtes Niveau falsch');
  if (!(teachFactor(90, 60) > 1.25 && teachFactor(70, 66) === 1 && teachFactor(60, 80) === 0.85)) fail('Lerntempo falsch');
  if (!(declineFactor(90, 70) < 1 && declineFactor(60, 80) > 1)) fail('Abbau-Faktor falsch');
  if (pushChance(90, 60, 20) <= 0.2 || pushChance(90, 60, 30) !== 0 || pushChance(70, 68, 20) !== 0 || dragChance(60, 80, 25) <= 0.1 || dragChance(60, 80, 20) !== 0) fail('Schub/Abzug falsch');
  if (assistantsNeeded(88, 1975) !== 2 || assistantsNeeded(60, 1975) !== 1 || assistantsNeeded(88, 2010) !== 3 || assistantsNeeded(50, 2010) !== 1) fail('Bedarf an Co-Trainern falsch');
  // Besetzung: ohne Cheftrainer und mit zu wenigen Co-Trainern sinkt die Trainingsqualität deutlich
  const t0 = fresh();
  const full = ownCoaching(t0);
  const staff = ensureStaff(t0);
  const head = staff.find((m) => m.roleId === 'cheftrainer')!;
  const noHead = coachingTeam(staff.filter((m) => m !== head), 24, 1975, t0.clubs.mgl.reputation ?? 60);
  const none = coachingTeam(staff.filter((m) => m.roleId !== 'cheftrainer' && m.roleId !== 'cotrainer'), 24, 1975, t0.clubs.mgl.reputation ?? 60);
  if (!(noHead.extra < full.extra - 0.12 && noHead.level < full.level - 8 && none.extra < noHead.extra - 0.05 && none.level <= 35)) fail(`fehlende Trainer wirken zu schwach: voll ${full.extra}/${full.level.toFixed(0)}, ohne Chef ${noHead.extra}/${noHead.level.toFixed(0)}, ohne alle ${none.extra}/${none.level.toFixed(0)}`);
  // Spitzentrainer: etwas besser als ein gewöhnliches Team
  const top = staff.map((m) => (m.roleId === 'cheftrainer' || m.roleId === 'cotrainer' ? { ...m, skills: Object.fromEntries(COACH_SKILLS.map((k) => [k, 19])), quality: 19 } : m));
  const topT = coachingTeam(top, 24, 1975, 88);
  if (!(topT.extra > full.extra && topT.extra - full.extra < 0.12 && topT.level >= 95)) fail('Spitzentrainer wirken nicht „leicht besser“');
  // In der Engine: gleiche Spieler, schwaches gegen starkes Trainerteam
  const p = Object.values(t0.players).find((x) => !x.isYouth && x.clubId === 'mgl' && x.age <= 22 && truePotential(x) - x.overall >= 8 && x.naturalPosition !== 'TW') ?? fail('kein junger Spieler mit Luft nach oben');
  const pot = truePotential(p);
  setClubCoaching(new Map([['mgl', { level: pot - 5, gk: pot - 5 }]]));
  const dStrong = distanceFactor(p);
  if (coachCutFor(p) !== 0 || coachLevelFor(p) !== pot - 5) fail('Trainer im Bereich des Potenzials: trotzdem Decke');
  setClubCoaching(new Map([['mgl', { level: pot - 25, gk: pot - 25 }]]));
  const dWeak = distanceFactor(p);
  if (!(coachCutFor(p) === 8 && dWeak < dStrong)) fail('schwaches Trainerteam bremst nicht');
  setClubCoaching(null);
  if (coachCutFor(p) !== 0) fail('ohne hinterlegtes Trainerteam darf nichts gebremst werden');
  bindCoaching(t0);
  const out = coachingOutlook(t0);
  console.log(`Entwicklung: voll ${full.extra >= 0 ? '+' : ''}${full.extra} (Niveau ${full.level.toFixed(0)}), ohne Cheftrainer ${noHead.extra} (${noHead.level.toFixed(0)}), ohne Trainer ${none.extra} (${none.level.toFixed(0)}), Spitzentrainer +${topT.extra} (${topT.level.toFixed(0)}); Ausblick: ${out.limited.length} gebremst, ${out.learners.length} lernen viel, Rang ${out.rank}/${out.of}`);
  void startingStaff;
}

// ---------------------------------------------------------------------------
// 3) Ex-Profi: erfolgreicher Spieler → höheres Potenzial (viele Würfe)
// ---------------------------------------------------------------------------
{
  const p = Object.values(g.players).find((x) => x.naturalPosition === 'TW' && x.clubId !== g.managedClubId)!;
  const hi: number[] = [], lo: number[] = [];
  for (let i = 0; i < 300; i++) {
    const sHi = careerSuccess(88, 450, 5, true, 80), sLo = careerSuccess(64, 60, 0, false, 40);
    hi.push(roleQuality(staffFromPlayer(p, { pos: 'TW', peak: 88, apps: 450, titles: 5, s: sHi, clubs: [] }, 1990, null, Math.random).pot, 'torwarttrainer'));
    lo.push(roleQuality(staffFromPlayer(p, { pos: 'TW', peak: 64, apps: 60, titles: 0, s: sLo, clubs: [] }, 1990, null, Math.random).pot, 'torwarttrainer'));
  }
  const tw = staffFromPlayer(p, { pos: 'TW', peak: 80, apps: 200, titles: 1, s: 0.5, clubs: [] }, 1990, null, Math.random);
  if (tw.roleId !== 'torwarttrainer') fail(`Ex-Torhüter wird ${tw.roleId} statt Torwarttrainer`);
  console.log(`Ex-Torhüter: Potenzial erfolgreich Ø ${avg(hi).toFixed(1)} vs. unauffällig Ø ${avg(lo).toFixed(1)}`);
  if (avg(hi) < avg(lo) + 2) fail('Erfolg hebt das Trainerpotenzial zu wenig');
}

// ---------------------------------------------------------------------------
// 4) Trainingsplan: Spieltag gesperrt, Tag danach Regeneration, Vorlagen, Migration
// ---------------------------------------------------------------------------
{
  const first = g.fixtures.filter((m) => m.involvesPlayerClub).sort((a, b) => a.date.localeCompare(b.date))[0];
  const infos = weekInfos(g, mondayOf(first.date));
  const mi = infos.find((i) => i.date === first.date)!;
  if (mi.locks.slot1 !== 'match' || effectiveDay(g.trainingPlan.days[mi.idx], mi).slot1 !== null) fail('Spieltag nicht gesperrt');
  const nextDay = addDaysISO(first.date, 1);
  const after = weekInfos(g, mondayOf(nextDay)).find((i) => i.date === nextDay && !i.fixture && i.locks.slot1 === 'regen');
  if (!after) fail('Tag nach dem Spiel ohne Regeneration');
  const plan = { days: [] as any[] };
  applyTemplate(plan, 'taktik', 1975);
  if (plan.days.some((d: any) => ['videoanalyse', 'pressing', 'athletik', 'mental'].includes(d.slot1) || ['videoanalyse', 'pressing'].includes(d.slot2))) fail('Vorlage 1975 mit späteren Bausteinen');
  applyTemplate(plan, 'taktik', 2010);
  if (!plan.days.some((d: any) => d.slot2 === 'videoanalyse')) fail('Vorlage 2010 ohne Videoanalyse');
  const eff = (id: string) => { const p2 = { days: [] as any[] }; applyTemplate(p2, id, 2000); return weekEffect(p2.days, p2.days.map((_, i) => ({ date: '', idx: i, locks: { slot1: null, slot2: null, extra: null } })), blockFactorFn(g)); };
  const prep = eff('vorbereitung'), rest = eff('schonung');
  console.log(`Vorlagen: Vorbereitung Fitness/Tag ${prep.fitnessPerDay}, Risiko ${prep.injuryIndex}, Faktor ${prep.devFactor} | Schonung ${rest.fitnessPerDay}, ${rest.injuryIndex}, ${rest.devFactor} (${PLAN_TEMPLATES.length} Vorlagen)`);
  if (!(prep.injuryIndex > rest.injuryIndex && prep.devFactor > rest.devFactor && prep.fitnessPerDay < rest.fitnessPerDay)) fail('Vorlagen-Wirkung unplausibel');
  // Langfristig: Vorlage für eine kommende Woche vormerken, Vorschau, Anwendung am Montag
  {
    const today = g.calendar.currentDate;
    const mon2 = addDaysISO(mondayOf(today), 14);
    applyTemplate(g.trainingPlan, 'standard', 1975);
    setWeekTemplate(g, mon2, 'schonung');
    const ws = seasonWeeks(g);
    const w2 = ws.find((w) => w.monday === mon2), w3 = ws.find((w) => w.monday === addDaysISO(mon2, 7)), w0 = ws[0];
    if (!w2?.scheduled || w2.tplId !== 'schonung' || w3?.tplId !== 'schonung' || w0.tplId !== 'standard') fail(`Vormerkung in der Vorschau falsch: ${w0.tplId}/${w2?.tplId}/${w3?.tplId}`);
    if (applyScheduledTemplate(g, addDaysISO(mon2, -1)) !== null) fail('Vormerkung zu früh angewandt');
    if (applyScheduledTemplate(g, addDaysISO(mon2, 1)) !== 'schonung' || matchingTemplate(g.trainingPlan.days, 1975) !== 'schonung' || g.trainingPlan.schedule) fail('Vormerkung nicht angewandt/aufgeräumt');
    setWeekTemplate(g, mondayOf(today), 'standard');
    if (matchingTemplate(g.trainingPlan.days, 1975) !== 'standard' || g.trainingPlan.schedule) fail('Laufende Woche lädt die Vorlage nicht sofort');
    console.log(`Langfristig: ${ws.length} Wochen bis Saisonende, Vormerkung ok`);
  }
  // Migration: unbekannter und zu neuer Baustein
  g.trainingPlan.days[0].slot1 = 'gibtsnicht';
  g.trainingPlan.days[0].slot2 = 'videoanalyse';
  migrateTrainingPlan(g);
  if (g.trainingPlan.days[0].slot1 !== null || g.trainingPlan.days[0].slot2 !== 'taktik') fail(`Plan-Migration falsch: ${JSON.stringify(g.trainingPlan.days[0])}`);
  for (const d of g.trainingPlan.days) for (const v of [d.slot1, d.slot2, d.extra]) if (v && !BLOCKS_BY_ID[v]) fail('ungültiger Baustein nach Migration');
  // Alte Spielstände: Mitarbeiter ohne Fachgebiete, kein Markt
  const old = fresh();
  delete old.staffWorld;
  for (const m of old.staff ?? []) { delete m.skills; delete m.pot; delete m.contractEnd; }
  migrateStaffPeople(old);
  migrateStaffPeople(old);
  if (!old.staffWorld || (old.staff ?? []).some((m) => !finite(m) || !m.contractEnd)) fail('Migration alter Spielstände unvollständig');
  // Spielstand mit acht Fachgebieten und Bewerbern je Rolle (v1): Fähigkeiten ergänzen, Qualität der Stelle bleibt, einmalige Nachricht
  const v1 = fresh();
  const NEW = ['fuehrung', 'scouting', 'wirtschaft', 'medien', 'organisation'] as const;
  const strip = (m: StaffMember) => { for (const k of NEW) { delete m.skills![k]; delete m.pot![k]; } delete m.traits; delete m.bg; };
  v1.staff = v1.staff!.filter((m) => m.roleId !== 'cheftrainer');
  v1.staff.forEach(strip);
  v1.staffWorld!.people.forEach(strip);
  (v1.staffWorld as any).v = 1;
  const q0 = new Map(v1.staffWorld!.people.filter((m) => m.clubId).map((m) => [m.id, m.quality]));
  const msgs = v1.messages.length;
  migrateStaffPeople(v1);
  migrateStaffPeople(v1);
  if (v1.staffWorld!.v !== 2 || !v1.staffWorld!.people.every(finite) || !v1.staff.every(finite)) fail('Umstellung auf 13 Fähigkeiten unvollständig');
  for (const m of v1.staffWorld!.people) if (q0.has(m.id) && Math.abs(m.quality - q0.get(m.id)!) > 1) fail(`Qualität bei der Umstellung verschoben: ${m.roleId} ${q0.get(m.id)} → ${m.quality}`);
  if (v1.messages.length !== msgs + 1) fail('Umstellung: genau eine erklärende Nachricht erwartet');
  if (ownCoaching(v1).head || ownCoaching(v1).penalty >= 0) fail('alter Spielstand ohne Cheftrainer: Abzug fehlt');
}

// ---------------------------------------------------------------------------
// 4b) KI-Stäbe, Ausland, Faktor für alle, Abwerben, KI-Angebote, Laden/Migration (tests/staff-ai-checks.ts)
// ---------------------------------------------------------------------------
for (const line of staffAiChecks()) console.log(`KI-Stab: ${line}`);

// ---------------------------------------------------------------------------
// 5) Langzeit: viele Saisons
// ---------------------------------------------------------------------------
const sim = fresh();
(sim as any).simAutoManage = true;
interface Row { y: number; free: number; emp: number; ex: number; q: number; q90: number; qmax: number; roles: number; promoted: number; exIn: number; out: number; pool: number }
const rows: Row[] = [];
const t0 = Date.now();
for (let s = 0; s < SEASONS; s++) {
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(sim.calendar)) {
    const t = sim.clubs[sim.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    processDay(sim, HEADLESS_UI);
    if (++guard > 1000) fail('Saison endet nicht');
  }
  startNextSeason(sim);
  const year = Number(sim.season.slice(0, 4));
  const ww = sim.staffWorld!;
  const people = ww.people;
  if (!people.every(finite)) fail(`ungültige Werte ${sim.season}`);
  const free = people.filter((m) => !m.clubId);
  const emp = people.filter((m) => m.clubId);
  for (const role of AI_TRACKED_ROLES) {
    if (!staffAvailable(STAFF_BY_ID[role], year)) continue;
    const f = free.filter((m) => roleFit(m.skills, role) >= 7).length;
    if (f < 3) fail(`${sim.season}: nur ${f} brauchbare Bewerber als ${role}`);
  }
  for (const role of rolesAvailable(year)) {
    if (role === 'cheftrainer') continue;
    const f = free.filter((m) => roleFit(m.skills, role) >= 7).length;
    if (f < 2) fail(`${sim.season}: nur ${f} brauchbare Bewerber als ${role}`);
  }
  const qs = people.map((m) => m.quality).sort((a, b) => a - b);
  const last = ww.log[ww.log.length - 1];
  const aiNow = Object.values(sim.clubs).filter((c) => isLeagueClub(c) && c.id !== sim.managedClubId);
  const coverage = aiNow.filter((c) => staffOfClub(sim, c.id).some((m) => m.roleId === 'cotrainer')).length / Math.max(1, aiNow.length);
  if (coverage < 0.85) fail(`${sim.season}: nur ${Math.round(coverage * 100)} % der KI-Vereine mit Co-Trainer`);
  rows.push({
    y: year, free: free.length, emp: emp.length,
    // Ex-Profis unter den Trainern (Ärzte, Verwaltung & Co. der KI-Stäbe sind keine Ex-Profis).
    ex: people.filter((m) => m.exPro && TEAM_ROLE_IDS.has(m.roleId)).length / Math.max(1, people.filter((m) => TEAM_ROLE_IDS.has(m.roleId)).length),
    q: avg(qs), q90: qs[Math.floor(qs.length * 0.9)], qmax: qs[qs.length - 1], roles: new Set(people.map((m) => m.roleId)).size,
    promoted: last?.promoted ?? 0, exIn: last?.exPros ?? 0, out: last?.outsiders ?? 0, pool: sim.coachPool?.length ?? 0,
  });
  const r = rows[rows.length - 1];
  console.log(`${sim.season}: ${people.length} Personen (${r.free} frei, ${r.emp} angestellt), Ex-Profis (Trainer) ${Math.round(r.ex * 100)} %, Qualität Ø ${r.q.toFixed(1)} / 90 % ${r.q90} / max ${r.qmax}, Rollen ${r.roles}, neu: ${r.exIn} Ex-Profis + ${r.out} Quereinsteiger, Aufstieg zum Cheftrainer ${r.promoted}, Cheftrainer-Pool ${r.pool}`);
  if (people.length > 1300 || free.length > 330) fail('Arbeitsmarkt explodiert');
}
console.log(`Simulation: ${SEASONS} Saisons in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

if (SEASONS >= 10) {
  const late = rows.slice(5);
  const exShare = avg(late.map((r) => r.ex));
  console.log(`Ex-Profi-Anteil unter Trainern ab Saison 6: ${Math.round(exShare * 100)} %`);
  if (exShare < 0.25 || exShare > 0.85) fail(`Anteil Ex-Profis unplausibel (${Math.round(exShare * 100)} %)`);
  for (const [a, b] of [[1975, 1990], [1990, 2005], [2005, 2030]]) {
    const r = rows.filter((x) => x.y >= a && x.y < b);
    if (!r.length) continue;
    const q = avg(r.map((x) => x.q));
    console.log(`  ${a}–${b - 1}: Qualität Ø ${q.toFixed(1)}, Spitze (90 %) ${avg(r.map((x) => x.q90)).toFixed(1)}, max ${Math.max(...r.map((x) => x.qmax))}, Bewerber Ø ${avg(r.map((x) => x.free)).toFixed(0)}`);
    if (q < 6 || q > 14) fail(`Qualität driftet (${q.toFixed(1)})`);
  }
  if (rows.reduce((s, r) => s + r.promoted, 0) < SEASONS / 3) fail('kaum Aufstiege zum Cheftrainer');
  // Erfolg als Spieler → Güte als Trainer (über alle Ex-Profis im Markt)
  const ex = sim.staffWorld!.people.filter((m) => m.exPro);
  const xs = ex.map((m) => m.exPro!.s), ys = ex.map((m) => Math.max(...Object.values(m.pot ?? {})));
  const mx = avg(xs), my = avg(ys);
  const cov = avg(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const corr = cov / Math.sqrt(avg(xs.map((x) => (x - mx) ** 2)) * avg(ys.map((y) => (y - my) ** 2)));
  const q = [...ex].sort((a, b) => a.exPro!.s - b.exPro!.s);
  const lowQ2 = avg(q.slice(0, Math.floor(q.length / 4)).map((m) => m.quality));
  const hiQ2 = avg(q.slice(-Math.floor(q.length / 4)).map((m) => m.quality));
  console.log(`Ex-Profis im Markt: ${ex.length}, Korrelation Erfolg ↔ Potenzial ${corr.toFixed(2)}, Qualität unteres Viertel ${lowQ2.toFixed(1)} vs. oberes Viertel ${hiQ2.toFixed(1)}`);
  if (corr < 0.2) fail('Spielererfolg hängt kaum mit Trainergüte zusammen');
  if (hiQ2 < lowQ2 + 1) fail('erfolgreiche Ex-Profis sind nicht besser');
  const roles = new Map<string, number>();
  for (const m of sim.staffWorld!.people) roles.set(m.roleId, (roles.get(m.roleId) ?? 0) + 1);
  console.log(`Rollen: ${[...roles.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
console.log('OK – Trainerteam und Arbeitsmarkt');
