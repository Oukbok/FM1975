// =============================================================================
// VEREINSWECHSEL DES MANAGERS — `game.managedClubId` umhängen
// -----------------------------------------------------------------------------
// Zwei Wege:
//   • sofort (Verein der eigenen Liga, volle Kader): `switchClubNow`
//   • zum Saisonwechsel (auch in eine andere Liga): `careerSeasonSwitchStart` setzt
//     in startNextSeason VOR Auf-/Abstieg die neue ID (damit dessen Liga zur
//     Spielerliga wird und volle Kader bekommt), `careerSeasonSwitchFinish` richtet
//     nach dem Aufbau der neuen Saison alles für den neuen Verein ein.
// Alter Verein: Trainer aus dem Pool, Taktik der KI, Fanshop/Laden entfällt
// (KI bucht pauschal), dein Trainerteam bleibt dort. Neuer Verein: sein bisheriger
// Trainer geht, sein Trainerteam wird deins, Umfeld/Jugendteams/Stadion-Blöcke/
// Fanartikel/Budget werden für ihn eingerichtet. Offene Entscheidungen des alten
// Vereins verfallen. Alles idempotent und ohne neue Spielstand-Version.
// =============================================================================
import { Club } from '../types';
import { autoFillLineup } from '../engine/lineupAI';
import { makeMessage, pushMessage } from '../engine/messages';
import { updateScoutEstimate } from '../engine/scouting';
import { fmtPrice } from '../ui/format';
import { budgetState, recordBudgetPlan } from './budgetPlan';
import { depart, install, pickSuccessor } from './coachCarousel';
import { addRecord, leagueRecordSince } from './coachRecord';
import { ensureEnvironment, setSeasonGoal } from './environmentGame';
import { migrateMerch } from './merchGame';
import { repairSquadLists } from './squads';
import { ensureStadiumBlocks } from './stadiumGame';
import { migrateTrainingPlan } from './trainingWeek';
import { ensureYouthTeams } from './youthTeams';
import { spRecord } from './seasonPromisesGame';
import { careerLog, clubNameOf, currentStint, ensureCareer, JobOffer, managerWageFor, startStint, stintRecord } from './careerState';
import { Game } from './state';

/** Offene Entscheidungen, die mit dem Wechsel hinfällig werden (Karriere-Angebote bleiben). */
function dropOpenDecisions(g: Game): void {
  for (const m of g.messages) {
    const ref = m.eventRef;
    if (!ref || ref.resolved || ref.type.startsWith('career_')) continue;
    ref.resolved = 'verfallen';
    m.actionRequired = false;
    m.resultText = 'Durch deinen Vereinswechsel hinfällig.';
  }
}

/** Abschied vom bisherigen Verein: Station schließen, Trainerhistorie, Nachfolger (falls voller Verein). */
export function detachFromClub(g: Game, date: string, reason: 'wechsel' | 'entlassen'): string {
  const oldId = g.managedClubId;
  const old = g.clubs[oldId];
  ensureCareer(g);
  const st = currentStint(g);
  st.rec = stintRecord(g, st);
  st.rec.upTo = undefined;
  st.to = date;
  st.end = reason;
  if (old) {
    (old.coachHistory ??= []).push({
      name: g.manager.name, from: st.from, to: date, reason: reason === 'entlassen' ? 'entlassen' : 'abgeworben', rec: { ...st.rec }, human: true,
    });
    if (old.coachHistory.length > 30) old.coachHistory.splice(0, old.coachHistory.length - 30);
    old.isPlayerControlled = false;
    old.merchShop = undefined; // KI-Vereine buchen Fanartikel pauschal
    // Nachfolger aus dem Trainerpool, KI-Taktik.
    const succ = pickSuccessor(g, old, date, Math.random);
    install(g, old, succ, date, false);
    // Dein Trainerteam bleibt beim Verein (Arbeitsmarkt game/staffWorld.ts).
    if (g.staffWorld) for (const m of g.staff ?? []) g.staffWorld.people.push({ ...m, clubId: old.id });
  }
  g.staff = [];
  g.hiredStaff = [];
  // Laufende Verhandlungen und Entscheidungen des alten Vereins enden.
  for (const t of g.transferTalks ?? []) if (t.phase !== 'done' && t.phase !== 'failed') t.phase = 'failed';
  dropOpenDecisions(g);
  // Versprechen zum ersten Training gelten dem alten Kader.
  const rec = spRecord(g);
  if (rec) rec.done = true;
  // Geplante Trainingslager des alten Vereins verfallen.
  const camps = (g as Game & { camps?: { bookings: { start: string; done: boolean; report?: string }[] } }).camps;
  if (camps) for (const b of camps.bookings) if (!b.done) { b.done = true; b.report = b.report ?? 'Abgesagt (Trainerwechsel).'; }
  return oldId;
}

/** Neuer Verein: Trainer geht, Trainerteam, Umfeld, Jugend, Stadion, Laden, Aufstellung, Station. */
export function adoptClub(g: Game, date: string, offer: Pick<JobOffer, 'wage' | 'budget' | 'goal'> | null, opts: { midSeason: boolean; reason: 'wechsel' | 'entlassen' | 'start'; fromName?: string }): Club | null {
  const club = g.clubs[g.managedClubId];
  if (!club) return null;
  if (club.coach) depart(g, club, date, opts.midSeason ? 'entlassen' : 'vertragsende');
  club.coach = undefined;
  club.isPlayerControlled = true;
  // Trainerteam des Vereins übernehmen.
  if (g.staffWorld) {
    const mine = g.staffWorld.people.filter((m) => m.clubId === club.id);
    g.staffWorld.people = g.staffWorld.people.filter((m) => m.clubId !== club.id);
    g.staff = mine.map((m) => ({ ...m, clubId: undefined, freeSince: undefined }));
    g.hiredStaff = [...new Set(g.staff.map((m) => m.roleId))];
  }
  // Eigener-Verein-Zustand neu aufsetzen.
  g.foerderSpieler = [];
  g.devReportSnapshot = undefined;
  g.youthApproaches = {};
  g.marketing = {};
  g.activities = [];
  g.environment = undefined;
  ensureEnvironment(g);
  g.youthTeamsReady = false;
  ensureYouthTeams(g, date);
  ensureStadiumBlocks(g);
  migrateMerch(g);
  migrateTrainingPlan(g);
  for (const id of club.playerIds) { const p = g.players[id]; if (p) updateScoutEstimate(p, 0.4, true); }
  // Spielerliga-Markierungen (Spielplan, Pokal).
  for (const m of g.fixtures) m.involvesPlayerClub = m.homeClubId === club.id || m.awayClubId === club.id;
  for (const r of g.cup?.rounds ?? []) for (const t of r.ties) t.involvesPlayerClub = t.homeClubId === club.id || t.awayClubId === club.id;
  for (const cup of Object.values(g.euroCups ?? {})) for (const r of cup?.rounds ?? []) for (const t of r.ties) t.involvesPlayerClub = t.homeClubId === club.id || t.awayClubId === club.id;
  if (club.tactics) club.tactics = autoFillLineup(club, g.players, club.tactics);
  // Vorstand: frischer Start, zugesagtes Budget.
  club.boardConfidence = 65;
  if (offer && offer.budget > club.finances.transferBudget) club.finances.transferBudget = offer.budget;
  if (opts.midSeason) {
    setSeasonGoal(g, date);
    const st = budgetState(g);
    st.plans = st.plans.filter((p) => p.season !== g.season);
    recordBudgetPlan(g, { pending: true });
  }
  repairSquadLists(g);
  // Neue Station.
  const c = ensureCareer(g);
  const stint = startStint(g);
  stint.from = date;
  if (offer) stint.wage = offer.wage;
  else stint.wage = managerWageFor(60, c.rep);
  c.stints.push(stint);
  if (c.stints.length > 40) c.stints.splice(0, c.stints.length - 40);
  careerLog(g, `Neuer Verein: ${club.name}${opts.fromName ? ` (zuvor ${opts.fromName})` : ''}`);
  pushMessage(g.messages, makeMessage({
    date, category: 'board', from: `Vorstand ${club.shortName}`,
    subject: `Willkommen bei ${club.name}!`,
    shortText: `Dein erster Arbeitstag – Saisonziel: ${offer?.goal ?? club.boardExpectation}.`,
    bodyText: `Herzlich willkommen, ${g.manager.name}!\n\nDer Vorstand von ${club.name} freut sich auf die Zusammenarbeit. `
      + `${opts.midSeason ? 'Du übernimmst mitten in der Saison – die Mannschaft wartet auf neue Impulse.' : 'Die Vorbereitung auf die neue Saison beginnt jetzt.'}\n\n`
      + `Vereinbart: Saisonziel „${offer?.goal ?? club.boardExpectation}“${offer ? `, Jahresgehalt ${fmtPrice(offer.wage)}, Transferbudget ${fmtPrice(Math.max(offer.budget, club.finances.transferBudget))}` : ''}.\n\n`
      + `Das Trainerteam des Vereins steht bereit (${g.staff?.length ?? 0} Personen). Kader, Taktik und Training findest du wie gewohnt in den Menüs.`,
  }));
  return club;
}

/** Sofortiger Wechsel zu einem Verein der eigenen Liga. */
export function switchClubNow(g: Game, newId: string, offer: JobOffer | null, reason: 'wechsel' | 'entlassen'): boolean {
  if (!g.clubs[newId] || newId === g.managedClubId || !g.table.rows.some((r) => r.clubId === newId)) return false;
  const date = g.calendar.currentDate;
  const fromName = clubNameOf(g, g.managedClubId);
  detachFromClub(g, date, reason);
  g.managedClubId = newId;
  adoptClub(g, date, offer, { midSeason: true, reason, fromName });
  return true;
}

/**
 * startNextSeason, nach dem Saisonabschluss und vor Auf-/Abstieg: angenommenes
 * Angebot wirksam machen (ID umhängen). Gibt den alten Vereinsnamen zurück.
 */
export function careerSeasonSwitchStart(g: Game): { fromName: string; offer: JobOffer & { reason: 'wechsel' | 'entlassen' } } | null {
  const c = g.career;
  const mv = c?.pendingMove;
  if (!c || !mv) return null;
  c.pendingMove = undefined;
  const exists = !!g.clubs[mv.clubId] || !!g.simClubs?.[mv.clubId];
  if (!exists || mv.clubId === g.managedClubId) return null;
  const fromName = clubNameOf(g, g.managedClubId);
  // Bilanz der letzten Saison noch beim alten Verein verbuchen.
  const st = currentStint(g);
  st.rec = addRecord(st.rec, { ...leagueRecordSince(g, st.clubId, st.from, st.rec?.upTo), upTo: g.calendar.currentDate });
  detachFromClub(g, g.calendar.currentDate, mv.reason);
  g.managedClubId = mv.clubId;
  return { fromName, offer: mv };
}

/** startNextSeason, nach dem Aufbau der neuen Saison: neuen Verein einrichten. */
export function careerSeasonSwitchFinish(g: Game, sw: { fromName: string; offer: JobOffer & { reason: 'wechsel' | 'entlassen' } } | null): void {
  if (!sw) return;
  // Budget-Fenster und Saisonziel folgen in startNextSeason (recordBudgetPlan/setSeasonGoal).
  adoptClub(g, g.calendar.currentDate, sw.offer, { midSeason: false, reason: sw.offer.reason, fromName: sw.fromName });
}
