// Trainerteam & Arbeitsmarkt ohne UI: Fachgebiete, Verhandlung, Entlassung,
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
import { acceptsOffer, careerSuccess, demandFactor, roleQuality, staffFromPlayer, AI_TRACKED_ROLES } from '../src/engine/staffSkills';
import { ensureStaffWorld, marketForRole, migrateStaffPeople, staffOfClub } from '../src/game/staffWorld';
import { dismiss, offerContract, severanceOf, blockFactorFn } from '../src/game/trainerTeam';
import { ensureStaff } from '../src/game/staffGame';
import { weekInfos, migrateTrainingPlan } from '../src/game/trainingWeek';
import { addDaysISO, applyTemplate, effectiveDay, weekEffect, mondayOf, PLAN_TEMPLATES } from '../src/engine/trainingPlan';
import { BLOCKS_BY_ID } from '../src/engine/weeklyTraining';
import { applyScheduledTemplate, matchingTemplate, seasonWeeks, setWeekTemplate } from '../src/game/trainingSeason';
import { isLeagueClub } from '../src/engine/clubEconomy';
import { STAFF_BY_ID, staffAvailable } from '../src/data/staff';

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
  return Number.isFinite(m.quality) && Object.values(m.skills ?? {}).every((v) => Number.isFinite(v) && v >= 1 && v <= 20);
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
  const cand = marketForRole(g, 'jugendtrainer').find((m) => !m.clubId) ?? fail('kein Jugendtrainer frei');
  const rep = g.clubs[g.managedClubId].reputation ?? 60;
  const d = demandFactor(cand, rep);
  if (acceptsOffer(cand, d * 0.7, 2, rep)) fail('70 % der Forderung angenommen');
  if (!acceptsOffer(cand, d, 2, rep)) fail('volle Forderung abgelehnt');
  const low = offerContract(g, cand.id, d * 0.7, 2);
  if (low.ok) fail('zu niedriges Angebot führte zur Anstellung');
  const bal0 = g.clubs[g.managedClubId].finances.balance;
  const res = offerContract(g, cand.id, d, 3);
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
  if (!old.staffWorld || (old.staff ?? []).some((m) => !m.skills || !m.contractEnd)) fail('Migration alter Spielstände unvollständig');
}

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
    const f = free.filter((m) => m.roleId === role).length;
    if (f < 3) fail(`${sim.season}: nur ${f} Bewerber als ${role}`);
  }
  const qs = people.map((m) => m.quality).sort((a, b) => a - b);
  const last = ww.log[ww.log.length - 1];
  const aiNow = Object.values(sim.clubs).filter((c) => isLeagueClub(c) && c.id !== sim.managedClubId);
  const coverage = aiNow.filter((c) => staffOfClub(sim, c.id).some((m) => m.roleId === 'cotrainer')).length / Math.max(1, aiNow.length);
  if (coverage < 0.85) fail(`${sim.season}: nur ${Math.round(coverage * 100)} % der KI-Vereine mit Co-Trainer`);
  rows.push({
    y: year, free: free.length, emp: emp.length, ex: people.filter((m) => m.exPro).length / people.length,
    q: avg(qs), q90: qs[Math.floor(qs.length * 0.9)], qmax: qs[qs.length - 1], roles: new Set(people.map((m) => m.roleId)).size,
    promoted: last?.promoted ?? 0, exIn: last?.exPros ?? 0, out: last?.outsiders ?? 0, pool: sim.coachPool?.length ?? 0,
  });
  const r = rows[rows.length - 1];
  console.log(`${sim.season}: ${people.length} Personen (${r.free} frei, ${r.emp} angestellt), Ex-Profis ${Math.round(r.ex * 100)} %, Qualität Ø ${r.q.toFixed(1)} / 90 % ${r.q90} / max ${r.qmax}, Rollen ${r.roles}, neu: ${r.exIn} Ex-Profis + ${r.out} Quereinsteiger, Aufstieg zum Cheftrainer ${r.promoted}, Cheftrainer-Pool ${r.pool}`);
  if (people.length > 650) fail('Arbeitsmarkt explodiert');
}
console.log(`Simulation: ${SEASONS} Saisons in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

if (SEASONS >= 10) {
  const late = rows.slice(5);
  const exShare = avg(late.map((r) => r.ex));
  console.log(`Ex-Profi-Anteil ab Saison 6: ${Math.round(exShare * 100)} %`);
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
