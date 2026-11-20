// =============================================================================
// HALLENFUSSBALL – Spielablauf: Einladungen, Teilnahme (eigener Verein + KI),
// Turniere in der Winterpause, Tour-Wertung, Hallen-Masters, Wirkungen, Nachrichten.
// Historie/Quellen: data/indoorHistory.ts · Simulation: engine/indoor.ts ·
// Spielstand: game/winterShared.ts · Anschluss: game/day.ts (indoorDaily).
// =============================================================================
import { PoolClub, aiSquad, buildPool, maxPerClub, weightedPick, willingness } from './indoorPool';
import { abroadFee, abroadHistory, abroadSubstitute, buildAbroadFinal, setupAbroad } from './indoorAbroad';
import { worldSquadPreview } from './worldPool';
import { ABROAD_BY_ID } from '../data/indoorAbroad';
import { mastersBoard, mastersRanking, mastersWeekend, packBoard } from './indoorMasters';
import { creditIndoorTournament, hallDrillBonus, pruneIndoorRecs } from './indoorRecords';
import { INDOOR_GAP_DAYS } from '../data/matchCalendarRules';
import { addDevPoints } from '../engine/devLog';
import {
  INDOOR_LAST_WINTER, MASTERS_TEAMS, TEAMS_PER_TOURNAMENT, TOURNAMENT_WIN_BASE, guestRate, indoorPhase, mastersMoney, mastersVenue,
  topClubEnthusiasm, tournamentCount, tournamentFeeBase, venuesFor, winterYearOf,
} from '../data/indoorHistory';
import {
  IndoorEntrant, IndoorResult, IndoorSquad, TourStat, addResultToTour, indoorSkill, indoorStrength, pickIndoorSquad,
  runIndoorTournament, winnerOf,
} from '../engine/indoor';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { recordInjury } from '../engine/history';
import { hashStr, mulberry32 } from '../engine/leagues';
import { createMatchInjury } from '../engine/match/finish';
import { ensureBrand } from '../engine/clubEconomy';
import { Player } from '../types';
import { addTitleRecord } from './clubRecords';
import { CHOICE_HANDLERS } from './eventsGame';
import { BreakCache, indoorHoliday } from './indoorWindow';
import { reconcileIndoor } from './indoorReconcile';
import { declinePenalty, indoorName, indoorShort, mastersNews, ownResultMessage, sendInvite } from './indoorNews';

export { indoorName, indoorShort };
import { Game, bumpMorale, homeCountryOf } from './state';
import {
  IndoorDecision, IndoorHistoryEntry, IndoorKind, IndoorTournament, IndoorWinter, competitiveDays, daysBetween, indoorState, ownCampDays,
  winterWindow,
} from './winterShared';

type Rng = () => number;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Winter aufsetzen (Anfang November)
// -----------------------------------------------------------------------------
export function setupIndoorWinter(g: Game, today: string): IndoorWinter {
  const winterYear = winterYearOf(g.season);
  // Deutsche Hallenturniere/Masters nur mit Heimatland Deutschland; Auslandsturniere immer (game/indoorAbroad.ts).
  const phase = homeCountryOf(g) === 'ger' ? indoorPhase(winterYear) : 'none';
  const cur: IndoorWinter = { season: g.season, winterYear, phase, tournaments: [] };
  const ownBusy = new Set<string>();
  if (phase !== 'none') setupGermanWinter(g, cur, today, ownBusy);
  setupAbroad(g, cur, today, mulberry32(hashStr(`indoor-abroad|${g.season}|${g.managedClubId}`)), ownBusy);
  for (const t of cur.abroad ?? []) if (t.own === null) sendInvite(g, t, today);
  if (!cur.abroad?.length) delete cur.abroad;
  return cur;
}

/** Deutsche Hallensaison: Einladungs-/Qualifikationsturniere, Masters-Termin, Einladungen, KI-Felder. */
function setupGermanWinter(g: Game, cur: IndoorWinter, today: string, ownBusy: Set<string>): void {
  const { winterYear, phase } = cur;
  const rng = mulberry32(hashStr(`indoor|${g.season}|${g.managedClubId}`));
  const win = winterWindow(g);
  // Winterpause je Verein (game/indoorWindow.ts): Halle erst nach dem letzten Pflichtspiel.
  const bc = new BreakCache(g);
  // Rahmenterminkalender: Halle nie am Tag vor/nach einem Pflichtspiel – weder für dich
  // noch für die KI-Teilnehmer (alle Pokal-/Europapokaltermine zählen).
  const busy = new Set<string>();
  const pflicht = [...competitiveDays(g), ...g.calendar.events.filter((e) => e.type === 'cup_matchday' || e.type === 'euro_matchday').map((e) => e.date)];
  for (const d of pflicht) for (let k = -(INDOOR_GAP_DAYS - 1); k <= INDOOR_GAP_DAYS - 1; k++) busy.add(CalendarEngine.addDays(d, k));
  const mastersDays = phase === 'masters' ? mastersWeekend(win, winterYear, busy) : [];
  // Tour/Einladungsturniere vor der Endrunde, sonst bis Ende Januar (Februar gehört
  // in langen Pausen dem Trainingslager).
  const tourEnd = mastersDays.length ? CalendarEngine.addDays(mastersDays[0], -2) : `${winterYear}-01-31`;
  let days = daysBetween(win.from, win.to < tourEnd ? win.to : tourEnd).filter((d) => d > today && !busy.has(d) && !mastersDays.includes(d) && !indoorHoliday(d));
  if (!days.length) days = daysBetween(win.from, win.to).filter((d) => d > today && !busy.has(d) && !mastersDays.includes(d) && !indoorHoliday(d));
  const kind: IndoorKind = phase === 'invitational' ? 'invite' : phase === 'masters' ? 'qualifier' : 'regional';
  const n = tournamentCount(winterYear);
  const venues = venuesFor(winterYear);
  const label = kind === 'invite' ? 'Internationales Hallenturnier' : kind === 'qualifier' ? 'Hallenturnier (DFB-Qualifikation)' : 'Hallen-Cup';
  const off = Math.floor(rng() * venues.length);
  for (let i = 0; i < n && days.length; i++) {
    const v = venues[(i + off) % venues.length];
    const date = days[Math.min(days.length - 1, Math.floor((i / n) * days.length))];
    cur.tournaments.push({ id: `ht${winterYear}-${i}`, name: `${label} ${v.city}`, city: v.city, hall: v.hall, date, days: 1, kind, clubIds: [], squads: {}, done: false });
  }
  if (mastersDays.length) {
    const mv = mastersVenue(winterYear);
    cur.masters = { id: `hm${winterYear}`, name: `Hallen-Masters ${winterYear}`, city: mv.city, hall: mv.hall, date: mastersDays[0], days: 2, kind: 'masters', clubIds: [], squads: {}, done: false };
  }
  // Eigener Verein: Einladungen (Größe, Liga, Verärgerung über frühere Absagen).
  const pool = buildPool(g);
  const own = pool.find((p) => p.id === g.managedClubId);
  const st = indoorState(g);
  let invites = 0;
  if (own && own.tier <= 2) {
    if (kind === 'invite') invites = own.rep >= 70 ? 2 : own.rep >= 55 || own.tier === 1 ? 1 : 0;
    else if (kind === 'qualifier') invites = winterYear >= 1998 ? 2 : 3;
    else invites = 1;
    if (st.snub >= 2) invites = Math.max(0, invites - 1);
  }
  const campDays = ownCampDays(g);
  const ownDates = new Set<string>();
  const ordered = [...cur.tournaments].sort((a, b) => Number(b.city === own?.city) - Number(a.city === own?.city) || (rng() - 0.5));
  for (const t of ordered) {
    if (invites <= 0) break;
    if (ownDates.has(t.date) || campDays.has(t.date) || !bc.fits(g.managedClubId, t.date, t.days)) continue;
    t.own = null; t.clubIds.push(g.managedClubId); ownDates.add(t.date); invites--;
    for (let k = -1; k <= t.days; k++) ownBusy.add(CalendarEngine.addDays(t.date, k));
  }
  if (cur.masters) for (let k = -1; k <= cur.masters.days; k++) ownBusy.add(CalendarEngine.addDays(cur.masters.date, k));
  // KI-Teilnehmer je Turnier.
  const count = new Map<string, number>();
  const dayUse = new Map<string, Set<string>>();
  const cap = maxPerClub(kind, winterYear);
  for (const t of cur.tournaments) {
    const used = dayUse.get(t.date) ?? new Set<string>();
    dayUse.set(t.date, used);
    const ai = pool.filter((p) => p.id !== g.managedClubId && !used.has(p.id) && (count.get(p.id) ?? 0) < cap && bc.fits(p.id, t.date, t.days));
    let slots = TEAMS_PER_TOURNAMENT - t.clubIds.length;
    // Auslandsgäste: bis 1997 aus Ländern mit Winterpause, Ostblock eingeschlossen; nie im Masters (data/indoorHistory.ts [S8]).
    const extra: PoolClub[] = [];
    if (rng() < guestRate(winterYear, kind as 'invite' | 'qualifier' | 'regional')) {
      extra.push(...weightedPick(ai.filter((p) => p.kind === 'foreign'), (p) => willingness(g, p, winterYear, kind), 1, rng));
    }
    if (rng() < (kind === 'regional' ? 1 : kind === 'qualifier' ? 0.3 : 0.15)) extra.push(...weightedPick(ai.filter((p) => p.kind === 'amateur'), () => 1, 1, rng));
    slots -= extra.length;
    const league = weightedPick(ai.filter((p) => p.kind === 'league'),
      (p) => willingness(g, p, winterYear, kind) * (p.city === t.city ? 4 : 1) / (1 + (count.get(p.id) ?? 0)), slots, rng);
    for (const p of [...league, ...extra]) {
      t.clubIds.push(p.id); used.add(p.id); count.set(p.id, (count.get(p.id) ?? 0) + 1);
      t.squads[p.id] = p.kind === 'league' ? aiSquad(g, p.id, winterYear, rng) : 'stars';
    }
    if (t.own === null) used.add(g.managedClubId);
  }
  for (const t of cur.tournaments) if (t.own === null) sendInvite(g, t, today);
}

/** Alle Turniere des laufenden Winters (inkl. Endrunde). */
export function allTournaments(cur: IndoorWinter | undefined): IndoorTournament[] {
  return cur ? [...cur.tournaments, ...(cur.abroad ?? []), ...(cur.masters ? [cur.masters] : [])] : [];
}

/**
 * Entscheidung des eigenen Vereins (Seite „Halle“ oder Nachricht). Liefert einen
 * Hinweistext; bei Konflikt mit dem Trainingslager wird nicht zugesagt.
 */
export function setOwnIndoorDecision(g: Game, tid: string, decision: IndoorDecision): string {
  const t = allTournaments(indoorState(g).current).find((x) => x.id === tid);
  if (!t || t.done || t.own === undefined) return 'Turnier nicht gefunden.';
  if (decision !== 'decline') {
    const camp = ownCampDays(g);
    for (let i = 0; i < t.days; i++) {
      if (camp.has(CalendarEngine.addDays(t.date, i))) { t.own = 'decline'; syncMessage(g, tid, 'decline'); return 'Abgesagt: Ihr seid an diesem Tag im Trainingslager.'; }
    }
  }
  t.own = decision;
  syncMessage(g, tid, decision);
  return decision === 'decline' ? `Absage für ${t.name} verschickt.` : `Zusage für ${t.name}. Den Hallenkader stellst du am Turniertag zusammen.`;
}

function syncMessage(g: Game, tid: string, decision: IndoorDecision): void {
  for (const m of g.messages) {
    if (m.eventRef?.type !== 'indoor_invite' || m.eventRef.data?.tid !== tid || m.eventRef.resolved) continue;
    m.eventRef.resolved = decision;
    m.actionRequired = false;
    m.resultText = `Entscheidung: ${m.choices?.find((c) => c.id === decision)?.label ?? decision}.`;
  }
}

CHOICE_HANDLERS.indoor_invite = (g, ref, choice) => {
  const tid = String(ref.data?.tid ?? '');
  const t = allTournaments(indoorState(g).current).find((x) => x.id === tid);
  if (t && !t.done) {
    const txt = setOwnIndoorDecision(g, tid, choice as IndoorDecision);
    return { text: txt };
  }
  return { text: 'Das Turnier ist bereits vorbei.' };
};

// -----------------------------------------------------------------------------
// Tagesablauf (game/day.ts)
// -----------------------------------------------------------------------------
/**
 * `show` (Oberfläche, game/day.ts): true = das Turnier deines Vereins wird heute als
 * Show gespielt (screens/indoor/) – dann nur vorbereiten und `cur.live` setzen.
 * Rückgabe: true, wenn eine Show wartet.
 */
export function indoorDaily(g: Game, today: string, show?: (t: IndoorTournament) => boolean): boolean {
  const st = indoorState(g);
  const y0 = parseInt(g.season.slice(0, 4), 10);
  if (!st.current || st.current.season !== g.season) {
    if (today < `${y0}-11-01` || today > `${y0 + 1}-02-28`) return false;
    if (st.current && !st.current.finished) finishWinter(g, today);
    st.current = setupIndoorWinter(g, today);
  }
  const cur = st.current;
  if (cur.finished || !allTournaments(cur).length) return false;
  // Termine in Pflichtspielzeit (alte Spielstände, Nachholspiele) verlegen bzw. absagen.
  reconcileIndoor(g, cur, today, (t) => substituteAny(g, cur, t, mulberry32(hashStr(`${g.season}|${t.id}|sub|${today}`))));
  // Eine Show, die über ihren Tag hinaus offen blieb (Laden, Einstellung), läuft im Hintergrund.
  if (cur.live) {
    const lt = allTournaments(cur).find((x) => x.id === cur.live);
    if (!lt || lt.done) cur.live = undefined;
    else if (CalendarEngine.addDays(lt.date, lt.days - 1) < today) playIndoorShowHeadless(g);
    else return true;
  }
  const due = (t: IndoorTournament) => !t.done && CalendarEngine.addDays(t.date, t.days - 1) <= today;
  const startShow = (t: IndoorTournament): boolean => {
    if (!show || !t.clubIds.includes(g.managedClubId) || t.own === 'decline' || !show(t)) return false;
    prepareTournament(g, cur, t, today, mulberry32(hashStr(`${g.season}|${t.id}|${g.managedClubId}`)));
    if (!t.clubIds.includes(g.managedClubId)) return false;
    cur.live = t.id;
    return true;
  };
  for (const t of cur.tournaments) {
    if (!due(t)) continue;
    if (startShow(t)) return true;
    playTournament(g, cur, t, today);
  }
  for (const t of cur.abroad ?? []) {
    // Finale einer Serie (Schweiz): Feld aus den Vorrunden, sobald sie gespielt sind.
    const def = ABROAD_BY_ID[t.aid ?? ''];
    if (def?.stage === 'f' && !t.clubIds.length && !t.done) {
      const quali = (cur.abroad ?? []).filter((q) => q !== t && ABROAD_BY_ID[q.aid ?? '']?.series === def.series);
      if (quali.every((q) => q.done) || today >= CalendarEngine.addDays(t.date, -1)) {
        if (buildAbroadFinal(g, cur, t, mulberry32(hashStr(`${g.season}|${t.id}|final`)))) sendInvite(g, t, today);
      }
    }
    if (!t.clubIds.length || !due(t)) continue;
    if (startShow(t)) return true;
    playTournament(g, cur, t, today);
  }
  if (cur.masters) {
    const m = cur.masters;
    const quali = cur.tournaments.every((t) => t.done) || today >= CalendarEngine.addDays(m.date, -1);
    if (!m.clubIds.length && quali) buildMastersField(g, cur, today);
    if (m.clubIds.length && due(m)) {
      if (startShow(m)) return true;
      playTournament(g, cur, m, today);
    }
  }
  if (allTournaments(cur).every((t) => t.done) && (!cur.masters || cur.masters.done)) finishWinter(g, today);
  return false;
}

function buildMastersField(g: Game, cur: IndoorWinter, today: string): void {
  const m = cur.masters!;
  const rng = mulberry32(hashStr(`masters|${g.season}`));
  const pool = new Map(buildPool(g).map((p) => [p.id, p]));
  const bc = new BreakCache(g);
  const ranking = mastersRanking(cur).filter((s) => pool.get(s.id)?.kind === 'league');
  // Auffüllen, falls die Tour zu klein war (z. B. Spielstand mitten im Winter geladen).
  const extra = [...pool.values()].filter((p) => p.kind === 'league' && !ranking.some((r) => r.id === p.id)).sort((a, b) => b.strength - a.strength);
  const order = [...ranking.map((r) => r.id), ...extra.map((p) => p.id)];
  cur.mastersDeclined = [];
  for (const id of order) {
    if (m.clubIds.length >= MASTERS_TEAMS) break;
    // Noch Pflichtspiele an den Endrunden-Tagen (z. B. Europapokal): kein Platz in der Halle.
    if (!bc.fits(id, m.date, m.days)) continue;
    if (id === g.managedClubId) {
      m.clubIds.push(id); m.own = null; sendInvite(g, m, today);
      continue;
    }
    const p = pool.get(id)!;
    const declineP = p.tier === 1 && p.rep >= 80 ? (1 - topClubEnthusiasm(cur.winterYear)) * 0.8 : 0.08;
    if (rng() < declineP) { cur.mastersDeclined.push(id); continue; }
    m.clubIds.push(id); m.squads[id] = aiSquad(g, id, cur.winterYear, rng);
  }
}

// -----------------------------------------------------------------------------
// Turnier spielen
// -----------------------------------------------------------------------------
export function candidatesOf(g: Game, clubId: string): Player[] {
  const c = g.clubs[clubId];
  if (!c) return [];
  return c.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.injury && p.availability !== 'injured');
}

/**
 * Spieltag-Vorbereitung (verändert den Spielstand, genau einmal je Turnier): offene
 * Entscheidung → gemischt; Absage → Ersatzverein + Ärger; Heimturnier → Fans.
 */
function prepareTournament(g: Game, cur: IndoorWinter, t: IndoorTournament, today: string, rng: Rng): void {
  const mid = g.managedClubId;
  if (t.own === null) t.own = 'mix';
  if (t.own === 'decline' && t.clubIds.includes(mid)) {
    t.clubIds = t.clubIds.filter((id) => id !== mid);
    substituteAny(g, cur, t, rng);
    declinePenalty(g, t, today);
  } else if (t.own && t.own !== 'decline') {
    t.squads[mid] = t.own;
    if (g.clubs[mid]?.city === t.city && g.environment) g.environment.fanMood = clamp(g.environment.fanMood + 0.8, 0, 100);
  }
  // Mindestens 6 Teilnehmer = zwei Gruppen à 3 (Wunsch Pascal: eine Zweiergruppe ist sinnlos).
  // Erst Vereine in der Winterpause, notfalls jeder freie Verein aus dem Pool.
  for (let i = 0; t.clubIds.length < INDOOR_MIN_TEAMS && i < 12; i++) {
    if (!substituteAny(g, cur, t, rng) && !substituteAny(g, cur, t, rng, true)) break;
  }
}

/** Ersatz je Turnierart: Auslandsturnier aus dem Gastgeberland, sonst deutscher Pool. */
function substituteAny(g: Game, cur: IndoorWinter, t: IndoorTournament, rng: Rng, relaxed = false): string | undefined {
  return t.kind === 'abroad' ? abroadSubstitute(g, cur, t, rng) : substituteIndoor(g, cur, t, rng, relaxed);
}

/** Ersatzverein für einen frei gewordenen Platz (nur Vereine, die an dem Tag Winterpause haben). */
function substituteIndoor(g: Game, cur: IndoorWinter, t: IndoorTournament, rng: Rng, relaxed = false): string | undefined {
  const mid = g.managedClubId;
  const bc = new BreakCache(g);
  const busy = new Set(allTournaments(cur).filter((x) => x.date === t.date).flatMap((x) => x.clubIds));
  const sub = buildPool(g).filter((p) => (relaxed || p.kind === 'league') && !busy.has(p.id) && !t.clubIds.includes(p.id) && p.id !== mid
      && (relaxed || bc.fits(p.id, t.date, t.days)))
    .sort((a, b) => (t.kind === 'masters' ? 0 : a.tier - b.tier) || b.strength - a.strength)
    .find((p) => !(cur.mastersDeclined ?? []).includes(p.id) || t.kind !== 'masters');
  if (sub) { t.clubIds.push(sub.id); t.squads[sub.id] = aiSquad(g, sub.id, cur.winterYear, rng); }
  return sub?.id;
}

/** Mindestens so viele Vereine je Turnier (zwei Gruppen à 3). */
export const INDOOR_MIN_TEAMS = 6;

/** Hallenauswahl: so viele Feldspieler bzw. Torhüter dürfen (müssen) mit. */
export const INDOOR_PICK = { keepers: 1, fieldMin: 5, fieldMax: 7 } as const;

/** Eigener Hallenkader: gewählte Spieler (gültig: 1 Torwart + 5–7 Feldspieler, alle einsatzfähig), sonst nach Kaderwahl. */
export function ownIndoorSquad(g: Game, t: IndoorTournament): Player[] {
  const cands = candidatesOf(g, g.managedClubId);
  if (t.ownIds?.length) {
    const sel = t.ownIds.map((id) => cands.find((p) => p.id === id)).filter((p): p is Player => !!p);
    const tw = sel.filter((p) => p.naturalPosition === 'TW'), fp = sel.filter((p) => p.naturalPosition !== 'TW');
    if (tw.length === INDOOR_PICK.keepers && fp.length >= INDOOR_PICK.fieldMin && fp.length <= INDOOR_PICK.fieldMax) return [...tw, ...fp];
  }
  const pick = t.squads[g.managedClubId] ?? (t.own && t.own !== 'decline' ? t.own : 'mix');
  return pickIndoorSquad(cands, pick);
}

/** Teilnehmer mit Hallenstärke und (bei vollen Vereinen) Hallenkader – ohne Zufall, ohne Änderung. */
export function tournamentEntrants(g: Game, t: IndoorTournament): { entrants: IndoorEntrant[]; squads: Map<string, Player[]> } {
  const squads = new Map<string, Player[]>();
  const entrants: IndoorEntrant[] = t.clubIds.map((id) => {
    if (g.clubs[id] && !id.startsWith('eu_')) {
      const sq = id === g.managedClubId ? ownIndoorSquad(g, t) : pickIndoorSquad(candidatesOf(g, id), t.squads[id] ?? 'mix');
      squads.set(id, sq);
      // Hallentraining der letzten 14 Tage: kleiner Formbonus nur für deinen Verein (game/indoorRecords.ts).
      return { id, strength: (sq.length >= 6 ? indoorStrength(sq) : 45) + (id === g.managedClubId ? hallDrillBonus(g, t.date) : 0) };
    }
    const base = g.simClubs[id]?.strength ?? g.euroClubs?.[id]?.strength ?? 55;
    // Ohne vollen Kader (Auslandsgäste, untere Ligen): Hallenkader aus dem Weltpool nur für Namen/Anzeige,
    // die Stärke bleibt die der Hintergrund-Welt (game/worldPool.ts).
    const wsq = worldSquadPreview(g, id);
    if (wsq.length >= 6 && wsq.some((p) => p.naturalPosition === 'TW')) squads.set(id, pickIndoorSquad(wsq, 'stars'));
    return { id, strength: base + 3 };
  });
  return { entrants, squads };
}

export function indoorWinPts(g: Game): number { return g.pointSystem === '3-point' ? 3 : 2; }

function playTournament(g: Game, cur: IndoorWinter, t: IndoorTournament, today: string): void {
  const rng = mulberry32(hashStr(`${g.season}|${t.id}|${g.managedClubId}`));
  prepareTournament(g, cur, t, today, rng);
  const { entrants, squads } = tournamentEntrants(g, t);
  // Zu wenige Teilnehmer (z. B. Absagen nach Verlegungen): Turnier fällt aus statt abzustürzen.
  if (entrants.length < 4) { cur.tournaments = cur.tournaments.filter((x) => x !== t); if (cur.masters === t) cur.masters = undefined; return; }
  const res = runIndoorTournament(entrants, indoorWinPts(g), rng);
  applyTournament(g, cur, t, res, entrants, squads, today, rng);
}

/** Wirkung des Turniers auf deinen Verein (für die Siegerehrung der Show). */
export interface IndoorOutcome {
  place: number; money: number; injured: string[]; fan: number;
  /** Mittlere Frische der eingesetzten Spieler vorher/nachher. */
  frische: [number, number];
  players: number;
}

/**
 * Ergebnis verbuchen: Tour, Titel, Frische/Fitness/Spielpraxis, Verletzungen, Geld,
 * Nachrichten. `ownBlock` = Spiele, in denen dein Verein die Stammfünf durchspielen
 * ließ (Show): etwas mehr Müdigkeit und Verletzungsrisiko für die besten fünf.
 */
function applyTournament(g: Game, cur: IndoorWinter, t: IndoorTournament, res: IndoorResult, entrants: IndoorEntrant[],
  squads: Map<string, Player[]>, today: string, rng: Rng, ownBlock = 0): IndoorOutcome | undefined {
  const mid = g.managedClubId;
  const st = indoorState(g);
  const winPts = indoorWinPts(g);
  t.result = res;
  t.strengths = Object.fromEntries(entrants.map((e) => [e.id, Math.round(e.strength * 10) / 10]));
  t.done = true;
  st.wins[res.ranking[0]] = (st.wins[res.ranking[0]] ?? 0) + 1;
  if (t.kind === 'qualifier') {
    const map = new Map((cur.tour ?? []).map((s) => [s.id, { ...s }] as [string, TourStat]));
    addResultToTour(map, res, winPts);
    cur.tour = [...map.values()];
  }
  // Hallenruf nur für Spieler mit vollem Datensatz (Weltpool-Gäste zählen nicht).
  creditIndoorTournament(g, t, res, new Map([...squads].filter(([id]) => !!g.clubs[id] && !id.startsWith('eu_'))), cur.winterYear);
  // Wirkungen und Geld je vollem Verein.
  const year = yearOf(today);
  const scale = economyScale(year);
  const injured: string[] = [];
  let outcome: IndoorOutcome | undefined;
  for (const id of t.clubIds) {
    const club = g.clubs[id];
    if (!club || id.startsWith('eu_')) continue;
    const place = res.ranking.indexOf(id);
    const games = res.matches.filter((m) => m.a === id || m.b === id).length;
    const sq = squads.get(id) ?? [];
    const top11 = new Set(candidatesOf(g, id).sort((a, b) => b.overall - a.overall).slice(0, 11).map((p) => p.id));
    const fan0 = g.environment?.fanMood ?? 0;
    const fr0 = sq.reduce((s, p) => s + (p.frische ?? 100), 0);
    // Stammfünf (Show): die fünf stärksten Hallen-Feldspieler.
    const five = id === mid && ownBlock > 0
      ? new Set(sq.filter((p) => p.naturalPosition !== 'TW').sort((x, y) => indoorSkill(y) - indoorSkill(x)).slice(0, 5).map((p) => p.id))
      : new Set<string>();
    for (const p of sq) {
      const hard = five.has(p.id) ? ownBlock : 0;
      p.frische = clamp((p.frische ?? 100) - 9 * t.days - 2 * hard, 35, 100);
      p.attributes.fitness = Math.max(30, p.attributes.fitness - 2 * t.days);
      p.trainingLoad = (p.trainingLoad ?? 0) + 6 * t.days;
      // Spielpraxis: ca. 60 % der Hallenminuten je Spieler (Rotation).
      p.development.recentMinutes = (p.development.recentMinutes ?? 0) + games * 14 * 0.6;
      if (!top11.has(p.id)) addDevPoints(p, 'halle', p.age <= 23 ? 0.12 : 0.05);
      if (place === 0) p.morale = bumpMorale(p.morale, 1);
      // Hallenboden und Bande: ca. 1,6 % je Spieler und Turniertag (Annahme, vgl. 1989 ~20 Ausfälle [S1]).
      if (g.injuriesEnabled && !p.injury && rng() < 0.016 * t.days * (games / 4) * (1 + 0.15 * hard)) {
        const r = rng();
        const inj = createMatchInjury(r < 0.68 ? 'minor' : r < 0.94 ? 'moderate' : 'severe', today);
        inj.description = inj.type === 'bruise' ? 'Prellung (Bande)' : inj.type === 'ligament' ? 'Bänderriss (Hallenboden)'
          : inj.type === 'bone' ? 'Knochenbruch (Hallenturnier)' : `${inj.description} (Hallenturnier)`;
        p.injury = inj; p.availability = 'injured'; recordInjury(p, inj);
        if (id === mid) injured.push(`${p.fullName} – ${inj.description}, ${inj.totalDays} Tage`);
      }
    }
    // Geld: Antrittsgeld + Prämie.
    let money: number;
    if (t.kind === 'masters') {
      const mm = mastersMoney(cur.winterYear);
      money = mm.start + (place === 0 ? mm.winner : place === 1 ? mm.runnerUp : place <= 3 ? mm.semi : mm.group);
    } else {
      money = Math.round((tournamentFeeBase(club.reputation) + (place === 0 ? TOURNAMENT_WIN_BASE : 0)) * scale * abroadFee(t));
    }
    if (money > 0) book(club.finances, today, money, 'prize_money', `${t.name}: Antrittsgeld/Prämie (Platz ${place + 1})`, id === mid);
    if (t.kind === 'masters' && place === 0) mastersTitleEffects(g, id, cur);
    if (id === mid) {
      ownResultMessage(g, t, place, money, injured, today);
      const n = Math.max(1, sq.length);
      outcome = {
        place, money, injured: [...injured], fan: (g.environment?.fanMood ?? 0) - fan0,
        frische: [fr0 / n, sq.reduce((s, p) => s + (p.frische ?? 100), 0) / n], players: sq.length,
      };
    }
  }
  if (t.kind === 'masters') mastersNews(g, cur, t, today);
  return outcome;
}

// -----------------------------------------------------------------------------
// Show (screens/indoor/): Turnier des eigenen Vereins live spielen
// -----------------------------------------------------------------------------
/** Turnier, das gerade als Show wartet (oder nichts). */
export function pendingIndoorShow(g: Game): IndoorTournament | undefined {
  const cur = indoorState(g).current;
  if (!cur?.live || cur.season !== g.season) return undefined;
  const t = allTournaments(cur).find((x) => x.id === cur.live);
  return t && !t.done ? t : undefined;
}

/** Show beendet: Ergebnis verbuchen (gleiche Wirkungen wie im Hintergrund). */
export function finishIndoorShow(g: Game, tid: string, res: IndoorResult, ownBlock: number): IndoorOutcome | undefined {
  const cur = indoorState(g).current;
  const t = allTournaments(cur).find((x) => x.id === tid);
  if (!cur || !t || t.done) return undefined;
  const { entrants, squads } = tournamentEntrants(g, t);
  const rng = mulberry32(hashStr(`${g.season}|${t.id}|${g.managedClubId}|show`));
  const out = applyTournament(g, cur, t, res, entrants, squads, g.calendar.currentDate, rng, ownBlock);
  cur.live = undefined;
  indoorDaily(g, g.calendar.currentDate); // Masters-Feld / Winterabschluss nachziehen
  return out;
}

/** Show abgeschaltet oder übersprungen: Turnier im Hintergrund wie bisher spielen. */
export function playIndoorShowHeadless(g: Game): void {
  const cur = indoorState(g).current;
  const t = pendingIndoorShow(g);
  if (!cur || !t) return;
  const { entrants, squads } = tournamentEntrants(g, t);
  const rng = mulberry32(hashStr(`${g.season}|${t.id}|${g.managedClubId}|show`));
  applyTournament(g, cur, t, runIndoorTournament(entrants, indoorWinPts(g), rng), entrants, squads, g.calendar.currentDate, rng);
  cur.live = undefined;
  indoorDaily(g, g.calendar.currentDate);
}

function mastersTitleEffects(g: Game, id: string, cur: IndoorWinter): void {
  const st = indoorState(g);
  st.titles[id] = (st.titles[id] ?? 0) + 1;
  addTitleRecord(g, id, 'halle', cur.season);
  const club = g.clubs[id];
  if (!club) return;
  for (const pid of club.playerIds) { const p = g.players[pid]; if (p) p.morale = bumpMorale(p.morale, 1); }
  club.reputation = clamp(club.reputation + 0.4, 0, 100);
  const b = ensureBrand(club);
  b.regional = clamp(b.regional + 1, 0, 100); b.national = clamp(b.national + 1, 0, 100);
  if (id === g.managedClubId && g.environment) g.environment.fanMood = clamp(g.environment.fanMood + 3, 0, 100);
}

function finishWinter(g: Game, today: string): void {
  const st = indoorState(g);
  const cur = st.current;
  if (!cur || cur.finished) return;
  cur.finished = true;
  if (cur.phase === 'none' && !cur.abroad?.length) return;
  const mid = g.managedClubId;
  const mine = allTournaments(cur).filter((t) => t.done && t.result?.ranking.includes(mid));
  let own: string | undefined;
  if (mine.length) {
    const best = mine.map((t) => ({ t, p: t.result!.ranking.indexOf(mid) })).sort((a, b) => a.p - b.p || Number(b.t.kind === 'masters') - Number(a.t.kind === 'masters'))[0];
    own = `${best.p === 0 ? 'Sieg' : `Platz ${best.p + 1}`} ${best.t.kind === 'masters' ? 'Masters' : best.t.city}`;
  }
  const entry: IndoorHistoryEntry = { year: cur.winterYear, phase: cur.phase, own, winners: cur.tournaments.filter((t) => t.done).map((t) => t.result!.ranking[0]) };
  const m = cur.masters;
  const board = packBoard(mastersBoard(g, cur, cur.winterYear, (id) => indoorShort(g, id)));
  if (board) entry.board = board;
  if (m?.done && m.result) {
    const fin = m.result.matches.find((x) => x.stage === 'F')!;
    entry.mastersWinner = m.result.ranking[0];
    entry.mastersRunnerUp = m.result.ranking[1];
    // Ergebnis aus Sicht des Siegers.
    const wa = winnerOf(fin) === fin.a;
    entry.mastersScore = `${wa ? fin.ga : fin.gb}:${wa ? fin.gb : fin.ga}${fin.pa != null ? ` (${wa ? fin.pa : fin.pb}:${wa ? fin.pb : fin.pa} n. N.)` : ''}`;
    entry.city = m.city;
  }
  const abroad = abroadHistory(g, cur);
  if (abroad.length) entry.abroad = abroad;
  if (!st.history.some((h) => h.year === entry.year)) st.history.push(entry);
  pruneIndoorRecs(g, cur.winterYear);
  st.snub = Math.max(0, st.snub - 1);
  void today;
}

/**
 * Beim Laden (App.tsx, idempotent): künftige Hallentermine alter Spielstände, die in die
 * Pflichtspielzeit eines Teilnehmers fallen, verlegen bzw. absagen (game/indoorReconcile.ts).
 */
export function migrateIndoorDates(g: Game): number {
  const cur = indoorState(g).current;
  if (!cur || cur.season !== g.season || cur.finished || !allTournaments(cur).length) return 0;
  const today = g.calendar.currentDate;
  return reconcileIndoor(g, cur, today, (t) => substituteAny(g, cur, t, mulberry32(hashStr(`${g.season}|${t.id}|sub|${today}`))));
}

/** Ob in diesem Winter überhaupt noch Hallenturniere stattfinden (für die Anzeige). */
export function indoorStillActive(winterYear: number): boolean {
  return winterYear <= INDOOR_LAST_WINTER;
}
