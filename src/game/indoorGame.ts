// =============================================================================
// HALLENFUSSBALL – Spielablauf: Einladungen, Teilnahme (eigener Verein + KI),
// Turniere in der Winterpause, Tour-Wertung, Hallen-Masters, Wirkungen, Nachrichten.
// Historie/Quellen: data/indoorHistory.ts · Simulation: engine/indoor.ts ·
// Spielstand: game/winterShared.ts · Anschluss: game/day.ts (indoorDaily).
// =============================================================================
import {
  INDOOR_LAST_WINTER, MASTERS_TEAMS, TEAMS_PER_TOURNAMENT, TOURNAMENT_WIN_BASE, indoorPhase, mastersMoney, mastersVenue,
  topClubEnthusiasm, tournamentCount, tournamentFeeBase, venuesFor, winterYearOf,
} from '../data/indoorHistory';
import {
  INDOOR_SQUAD_LABEL, IndoorEntrant, IndoorSquad, TourStat, addResultToTour, indoorStrength, pickIndoorSquad,
  runIndoorTournament, tourRanking, winnerOf,
} from '../engine/indoor';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { recordInjury } from '../engine/history';
import { hashStr, mulberry32 } from '../engine/leagues';
import { createMatchInjury } from '../engine/match/finish';
import { makeMessage, pushMessage } from '../engine/messages';
import { ensureBrand } from '../engine/clubEconomy';
import { Player } from '../types';
import { fmtDM, fmtDay } from '../ui/format';
import { addTitleRecord } from './clubRecords';
import { CHOICE_HANDLERS } from './eventsGame';
import { Game, bumpMorale } from './state';
import {
  IndoorDecision, IndoorHistoryEntry, IndoorKind, IndoorTournament, IndoorWinter, competitiveDays, daysBetween, indoorState, ownCampDays,
  winterWindow,
} from './winterShared';

type Rng = () => number;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Anzeigename eines Teilnehmers (voller Verein, Ligaverein, Amateur oder Auslandsgast). */
export function indoorName(g: Game, id: string): string {
  return g.clubs[id]?.name ?? g.simClubs[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
}
export function indoorShort(g: Game, id: string): string {
  return g.clubs[id]?.shortName ?? g.simClubs[id]?.shortName ?? g.euroClubs?.[id]?.shortName ?? id;
}

// -----------------------------------------------------------------------------
// Teilnehmer-Pool
// -----------------------------------------------------------------------------
interface PoolClub { id: string; tier: number; rep: number; city: string; kind: 'league' | 'amateur' | 'foreign'; strength: number }

function buildPool(g: Game): PoolClub[] {
  const out: PoolClub[] = [];
  const seen = new Set<string>();
  const add = (id: string, tier: number) => {
    if (seen.has(id) || tier > 2) return;
    seen.add(id);
    const c = g.clubs[id];
    const s = g.simClubs[id];
    if (!c && !s) return;
    const strength = c ? avgTop(g, c.playerIds) : (s!.strength + 3);
    out.push({ id, tier, rep: c?.reputation ?? clamp(s!.strength, 30, 90), city: c?.city ?? s!.city, kind: 'league', strength });
  };
  const ptier = g.leagues?.playerDivision?.tier ?? 1;
  for (const r of g.table.rows) add(r.clubId, ptier);
  for (const d of g.leagues?.otherDivisions ?? []) if (d.tier <= 2) for (const id of d.clubIds) add(id, d.tier);
  for (const c of Object.values(g.clubs)) {
    if (c.id.startsWith('am') && !seen.has(c.id)) { seen.add(c.id); out.push({ id: c.id, tier: 4, rep: c.reputation, city: c.city, kind: 'amateur', strength: avgTop(g, c.playerIds) - 4 }); }
  }
  for (const e of Object.values(g.euroClubs ?? {})) {
    if (!seen.has(e.id)) { seen.add(e.id); out.push({ id: e.id, tier: 0, rep: 75, city: e.city, kind: 'foreign', strength: e.strength }); }
  }
  return out;
}

function avgTop(g: Game, ids: string[]): number {
  const ovr = ids.map((id) => g.players[id]?.overall ?? 0).filter((v) => v > 0).sort((a, b) => b - a).slice(0, 8);
  return ovr.length ? ovr.reduce((a, b) => a + b, 0) / ovr.length : 55;
}

/** Teilnahmebereitschaft eines KI-Vereins (Größe, Epoche, Trainerphilosophie). */
function willingness(g: Game, p: PoolClub, winterYear: number, kind: IndoorKind): number {
  if (p.kind === 'amateur') return kind === 'regional' ? 0.8 : 0.15;
  if (p.kind === 'foreign') return kind === 'invite' ? 0.3 : 0.08;
  let w: number;
  if (kind === 'regional') w = p.tier === 1 ? (p.rep >= 78 ? 0.05 : 0.25) : 1;
  else if (kind === 'invite') w = p.tier === 1 ? 1 : 0.3;
  else w = p.tier === 1 ? 0.95 : 0.8;
  if (p.tier === 1 && p.rep >= 80 && kind !== 'regional') w *= topClubEnthusiasm(winterYear);
  const coach = g.clubs[p.id]?.coach;
  if (coach?.style === 'offensiv') w *= 1.15;
  if (coach?.style === 'defensiv') w *= 0.9;
  if (coach?.philosophy === 'jugend') w *= 1.15;
  return w;
}

/** Kaderwahl eines KI-Vereins: Spitzenvereine schonen ab Mitte der 90er ihre Stars [S1]. */
function aiSquad(g: Game, id: string, winterYear: number, rng: Rng): IndoorSquad {
  const c = g.clubs[id];
  const rep = c?.reputation ?? 60;
  if (c?.coach?.philosophy === 'jugend' && rng() < 0.6) return 'youth';
  const enth = topClubEnthusiasm(winterYear);
  if (rep >= 78) return rng() < enth ? 'stars' : rng() < 0.5 ? 'mix' : 'youth';
  return rng() < 0.55 + enth * 0.3 ? 'stars' : 'mix';
}

function weightedPick<T>(items: T[], weight: (t: T) => number, n: number, rng: Rng): T[] {
  const pool = items.map((t) => ({ t, w: Math.max(0, weight(t)) })).filter((x) => x.w > 0);
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let r = rng() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    out.push(pool[i].t);
    pool.splice(i, 1);
  }
  return out;
}

function maxPerClub(phaseKind: IndoorKind, winterYear: number): number {
  if (phaseKind === 'invite') return 2;
  if (phaseKind === 'regional') return 1;
  return winterYear >= 1998 ? 2 : 4;
}

/**
 * Endrunde (zwei Tage, Sa/So): historisch Mitte Januar (1988 Frankfurt, 2001 Dortmund
 * am 13./14.1., taz 15.01.2001) – Wochenende um den 13. Januar, ins Winterfenster
 * geklemmt und an Pflichtspielen vorbei.
 */
function mastersWeekend(win: { from: string; to: string }, winterYear: number, busy: Set<string>): string[] {
  const lastStart = CalendarEngine.addDays(win.to, -1);
  const clamp = (d: string) => (d < win.from ? win.from : d > lastStart ? lastStart : d);
  const fwd = (6 - new Date(`${winterYear}-01-13T00:00:00Z`).getUTCDay() + 7) % 7;
  const sat = CalendarEngine.addDays(`${winterYear}-01-13`, fwd > 3 ? fwd - 7 : fwd);
  for (const shift of [0, -7, 7, -14, 14]) {
    const d = clamp(CalendarEngine.addDays(sat, shift));
    const pair = [d, CalendarEngine.addDays(d, 1)];
    if (!pair.some((x) => busy.has(x))) return pair;
  }
  return [lastStart, win.to];
}

// -----------------------------------------------------------------------------
// Winter aufsetzen (Anfang November)
// -----------------------------------------------------------------------------
export function setupIndoorWinter(g: Game, today: string): IndoorWinter {
  const winterYear = winterYearOf(g.season);
  const phase = indoorPhase(winterYear);
  const cur: IndoorWinter = { season: g.season, winterYear, phase, tournaments: [] };
  if (phase === 'none') return cur;
  const rng = mulberry32(hashStr(`indoor|${g.season}|${g.managedClubId}`));
  const win = winterWindow(g);
  const busy = competitiveDays(g);
  const mastersDays = phase === 'masters' ? mastersWeekend(win, winterYear, busy) : [];
  // Tour/Einladungsturniere vor der Endrunde, sonst bis Ende Januar (Februar gehört
  // in langen Pausen dem Trainingslager).
  const tourEnd = mastersDays.length ? CalendarEngine.addDays(mastersDays[0], -2) : `${winterYear}-01-31`;
  let days = daysBetween(win.from, win.to < tourEnd ? win.to : tourEnd).filter((d) => d > today && !busy.has(d) && !mastersDays.includes(d));
  if (!days.length) days = daysBetween(win.from, win.to).filter((d) => d > today && !busy.has(d) && !mastersDays.includes(d));
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
    if (ownDates.has(t.date) || campDays.has(t.date)) continue;
    t.own = null; t.clubIds.push(g.managedClubId); ownDates.add(t.date); invites--;
  }
  // KI-Teilnehmer je Turnier.
  const count = new Map<string, number>();
  const dayUse = new Map<string, Set<string>>();
  const cap = maxPerClub(kind, winterYear);
  for (const t of cur.tournaments) {
    const used = dayUse.get(t.date) ?? new Set<string>();
    dayUse.set(t.date, used);
    const ai = pool.filter((p) => p.id !== g.managedClubId && !used.has(p.id) && (count.get(p.id) ?? 0) < cap);
    let slots = TEAMS_PER_TOURNAMENT - t.clubIds.length;
    const guestRate = kind === 'invite' ? 0.5 : kind === 'qualifier' ? 0.25 : 0;
    const extra: PoolClub[] = [];
    if (rng() < guestRate) extra.push(...weightedPick(ai.filter((p) => p.kind === 'foreign'), () => 1, 1, rng));
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
  return cur;
}

function sendInvite(g: Game, t: IndoorTournament, today: string): void {
  const club = g.clubs[g.managedClubId];
  const scale = economyScale(yearOf(t.date));
  const fee = t.kind === 'masters' ? mastersMoney(winterYearOf(g.season)).start : Math.round(tournamentFeeBase(club.reputation) * scale);
  const others = t.clubIds.filter((id) => id !== g.managedClubId).map((id) => indoorName(g, id));
  const deadline = CalendarEngine.addDays(t.date, -2) > today ? CalendarEngine.addDays(t.date, -2) : today;
  const masters = t.kind === 'masters';
  const msg = makeMessage({
    date: today, category: 'cup', from: masters ? 'DFB-Spielausschuss' : `Veranstalter ${t.city}`,
    subject: masters ? `Qualifiziert für das ${t.name}` : `Einladung: ${t.name} (${fmtDay(t.date)})`,
    shortText: masters ? `Endrunde in der ${t.hall}, ${t.city}. Teilnehmen?` : `${t.hall}, ${t.city}. Antrittsgeld ${fmtDM(fee)}.`,
    bodyText: (masters
      ? `Glückwunsch: Über die Hallentour habt ihr euch für die Endrunde des DFB-Hallenpokals qualifiziert – ${t.days} Tage in der ${t.hall} (${t.city}) ab ${fmtDay(t.date)}.\n\n`
      : `Wir laden euch zum ${t.name} in die ${t.hall} ein (${fmtDay(t.date)}).\n\nBisher zugesagt: ${others.join(', ') || 'noch offen'}.\n\n`)
      + `Antrittsgeld: ${fee > 0 ? fmtDM(fee) : 'keines'}${masters ? ' – dazu Prämien nach Platzierung' : ' – der Turniersieger bekommt eine Prämie'}.\n\n`
      + `Fünf Feldspieler plus Torwart, Rundumbande, kurze Spielzeiten. Gut für Spielpraxis von Reservisten und für die Fans – `
      + `aber der Hallenboden ist hart: Prellungen und Bänderverletzungen sind keine Seltenheit, und die Winterpause wird kürzer.\n\n`
      + `Du kannst Stammkräfte schicken, gemischt antreten oder den Nachwuchs spielen lassen. Eine Absage verärgert ${masters ? 'den DFB und die Fans' : 'den Veranstalter und die Fans'}.`,
    actionRequired: true,
  });
  msg.choices = [
    { id: 'stars', label: 'Zusagen – Stammkräfte', hint: 'Beste Titelchance, höchstes Verletzungsrisiko für Leistungsträger' },
    { id: 'mix', label: 'Zusagen – gemischt', hint: 'Drei Stammkräfte, Rest Reservisten' },
    { id: 'youth', label: 'Zusagen – Nachwuchs', hint: 'Spielpraxis für Junge, Stars werden geschont' },
    { id: 'decline', label: 'Absagen', hint: 'Keine Belastung – aber Ärger bei Veranstalter und Fans' },
  ];
  msg.eventRef = { type: 'indoor_invite', deadline, defaultChoice: 'mix', data: { tid: t.id } };
  pushMessage(g.messages, msg);
}

/** Alle Turniere des laufenden Winters (inkl. Endrunde). */
export function allTournaments(cur: IndoorWinter | undefined): IndoorTournament[] {
  return cur ? [...cur.tournaments, ...(cur.masters ? [cur.masters] : [])] : [];
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
  return decision === 'decline' ? `Absage für ${t.name} verschickt.` : `Zusage für ${t.name}: ${INDOOR_SQUAD_LABEL[decision]}.`;
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
export function indoorDaily(g: Game, today: string): void {
  const st = indoorState(g);
  const y0 = parseInt(g.season.slice(0, 4), 10);
  if (!st.current || st.current.season !== g.season) {
    if (today < `${y0}-11-01` || today > `${y0 + 1}-02-28`) return;
    if (st.current && !st.current.finished) finishWinter(g, today);
    st.current = setupIndoorWinter(g, today);
  }
  const cur = st.current;
  if (cur.phase === 'none' || cur.finished) return;
  for (const t of cur.tournaments) {
    if (!t.done && CalendarEngine.addDays(t.date, t.days - 1) <= today) playTournament(g, cur, t, today);
  }
  if (cur.masters) {
    const m = cur.masters;
    const quali = cur.tournaments.every((t) => t.done) || today >= CalendarEngine.addDays(m.date, -1);
    if (!m.clubIds.length && quali) buildMastersField(g, cur, today);
    if (!m.done && m.clubIds.length && CalendarEngine.addDays(m.date, m.days - 1) <= today) playTournament(g, cur, m, today);
  }
  if (allTournaments(cur).every((t) => t.done) && (!cur.masters || cur.masters.done)) finishWinter(g, today);
}

function buildMastersField(g: Game, cur: IndoorWinter, today: string): void {
  const m = cur.masters!;
  const rng = mulberry32(hashStr(`masters|${g.season}`));
  const pool = new Map(buildPool(g).map((p) => [p.id, p]));
  const ranking = tourRanking(cur.tour ?? []).filter((s) => pool.get(s.id)?.kind === 'league');
  // Auffüllen, falls die Tour zu klein war (z. B. Spielstand mitten im Winter geladen).
  const extra = [...pool.values()].filter((p) => p.kind === 'league' && !ranking.some((r) => r.id === p.id)).sort((a, b) => b.strength - a.strength);
  const order = [...ranking.map((r) => r.id), ...extra.map((p) => p.id)];
  cur.mastersDeclined = [];
  for (const id of order) {
    if (m.clubIds.length >= MASTERS_TEAMS) break;
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
function candidatesOf(g: Game, clubId: string): Player[] {
  const c = g.clubs[clubId];
  if (!c) return [];
  return c.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.injury && p.availability !== 'injured');
}

function playTournament(g: Game, cur: IndoorWinter, t: IndoorTournament, today: string): void {
  const mid = g.managedClubId;
  const rng = mulberry32(hashStr(`${g.season}|${t.id}|${mid}`));
  const st = indoorState(g);
  // Eigene Entscheidung: offen → gemischt; Absage → Ersatzverein + Ärger.
  if (t.own === null) t.own = 'mix';
  if (t.own === 'decline' && t.clubIds.includes(mid)) {
    t.clubIds = t.clubIds.filter((id) => id !== mid);
    const busy = new Set(allTournaments(cur).filter((x) => x.date === t.date).flatMap((x) => x.clubIds));
    const sub = buildPool(g).filter((p) => p.kind === 'league' && !busy.has(p.id) && p.id !== mid)
      .sort((a, b) => (t.kind === 'masters' ? 0 : a.tier - b.tier) || b.strength - a.strength)
      .find((p) => !(cur.mastersDeclined ?? []).includes(p.id) || t.kind !== 'masters');
    if (sub) { t.clubIds.push(sub.id); t.squads[sub.id] = aiSquad(g, sub.id, cur.winterYear, rng); }
    declinePenalty(g, t, today);
  } else if (t.own && t.own !== 'decline') {
    t.squads[mid] = t.own;
    if (g.clubs[mid]?.city === t.city && g.environment) g.environment.fanMood = clamp(g.environment.fanMood + 0.8, 0, 100);
  }
  // Teilnehmer und Hallenstärke.
  const squads = new Map<string, Player[]>();
  const entrants: IndoorEntrant[] = t.clubIds.map((id) => {
    if (g.clubs[id] && !id.startsWith('eu_')) {
      const sq = pickIndoorSquad(candidatesOf(g, id), t.squads[id] ?? 'mix');
      squads.set(id, sq);
      return { id, strength: sq.length >= 6 ? indoorStrength(sq) : 45 };
    }
    const base = g.simClubs[id]?.strength ?? g.euroClubs?.[id]?.strength ?? 55;
    return { id, strength: base + 3 };
  });
  const winPts = g.pointSystem === '3-point' ? 3 : 2;
  const res = runIndoorTournament(entrants, winPts, rng);
  t.result = res;
  t.strengths = Object.fromEntries(entrants.map((e) => [e.id, Math.round(e.strength * 10) / 10]));
  t.done = true;
  st.wins[res.ranking[0]] = (st.wins[res.ranking[0]] ?? 0) + 1;
  if (t.kind === 'qualifier') {
    const map = new Map((cur.tour ?? []).map((s) => [s.id, { ...s }] as [string, TourStat]));
    addResultToTour(map, res, winPts);
    cur.tour = [...map.values()];
  }
  // Wirkungen und Geld je vollem Verein.
  const year = yearOf(today);
  const scale = economyScale(year);
  const injured: string[] = [];
  for (const id of t.clubIds) {
    const club = g.clubs[id];
    if (!club || id.startsWith('eu_')) continue;
    const place = res.ranking.indexOf(id);
    const games = res.matches.filter((m) => m.a === id || m.b === id).length;
    const sq = squads.get(id) ?? [];
    const top11 = new Set(candidatesOf(g, id).sort((a, b) => b.overall - a.overall).slice(0, 11).map((p) => p.id));
    for (const p of sq) {
      p.frische = clamp((p.frische ?? 100) - 9 * t.days, 35, 100);
      p.attributes.fitness = Math.max(30, p.attributes.fitness - 2 * t.days);
      p.trainingLoad = (p.trainingLoad ?? 0) + 6 * t.days;
      // Spielpraxis: ca. 60 % der Hallenminuten je Spieler (Rotation).
      p.development.recentMinutes = (p.development.recentMinutes ?? 0) + games * 14 * 0.6;
      if (!top11.has(p.id)) p.development.devPoints = (p.development.devPoints ?? 0) + (p.age <= 23 ? 0.12 : 0.05);
      if (place === 0) p.morale = bumpMorale(p.morale, 1);
      // Hallenboden und Bande: ca. 1,6 % je Spieler und Turniertag (Annahme, vgl. 1989 ~20 Ausfälle [S1]).
      if (g.injuriesEnabled && !p.injury && rng() < 0.016 * t.days * (games / 4)) {
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
      money = Math.round((tournamentFeeBase(club.reputation) + (place === 0 ? TOURNAMENT_WIN_BASE : 0)) * scale);
    }
    if (money > 0) book(club.finances, today, money, 'prize_money', `${t.name}: Antrittsgeld/Prämie (Platz ${place + 1})`, id === mid);
    if (t.kind === 'masters' && place === 0) mastersTitleEffects(g, id, cur);
    if (id === mid) ownResultMessage(g, t, place, money, injured, today);
  }
  if (t.kind === 'masters') mastersNews(g, cur, t, today);
}

function declinePenalty(g: Game, t: IndoorTournament, today: string): void {
  const st = indoorState(g);
  const home = g.clubs[g.managedClubId]?.city === t.city;
  const loss = t.kind === 'masters' ? 1.5 : home ? 2.5 : 1;
  if (g.environment) g.environment.fanMood = clamp(g.environment.fanMood - loss, 0, 100);
  st.snub += t.kind === 'masters' ? 1.5 : 1;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'media', from: 'Pressestelle',
    subject: t.kind === 'masters' ? 'DFB verärgert über Absage für die Endrunde' : `Absage verärgert ${t.city}`,
    shortText: home ? 'Die eigenen Fans hatten sich auf das Heimturnier gefreut.' : 'Der Veranstalter ist enttäuscht.',
    bodyText: `Unsere Absage für das ${t.name} sorgt für Unmut. ${home ? 'Gerade in der eigenen Stadt nehmen uns das viele Fans übel. ' : ''}`
      + `Veranstalter reden miteinander: Wer häufig absagt, wird seltener eingeladen.\n\nFan-Stimmung −${loss.toLocaleString('de-DE')}.`,
  }));
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

function ownResultMessage(g: Game, t: IndoorTournament, place: number, money: number, injured: string[], today: string): void {
  const res = t.result!;
  const mid = g.managedClubId;
  const lines = res.matches.filter((m) => m.a === mid || m.b === mid).map((m) => {
    const home = m.a === mid;
    const opp = indoorShort(g, home ? m.b : m.a);
    const gf = home ? m.ga : m.gb, ga = home ? m.gb : m.ga;
    const pens = m.pa != null ? ` (Neunmeter ${home ? m.pa : m.pb}:${home ? m.pb : m.pa})` : '';
    const stage = m.stage === 'F' ? 'Finale' : m.stage === 'SF' ? 'Halbfinale' : m.stage === 'P3' ? 'Spiel um Platz 3' : 'Gruppe';
    return `• ${stage}: ${opp} ${gf}:${ga}${pens}`;
  });
  pushMessage(g.messages, makeMessage({
    date: today, category: 'cup', from: 'Trainerstab',
    subject: place === 0 ? `${t.name}: Turniersieg!` : `${t.name}: Platz ${place + 1}`,
    shortText: `${t.squads[mid] ? INDOOR_SQUAD_LABEL[t.squads[mid]] : ''} · Einnahmen ${fmtDM(money)}${injured.length ? ` · ${injured.length} verletzt` : ''}`,
    bodyText: `${t.name} (${t.hall}, ${t.city})\n\n${lines.join('\n')}\n\nEndplatz: ${place + 1} von ${t.clubIds.length}. Turniersieger: ${indoorName(g, res.ranking[0])}.\n`
      + `Einnahmen: ${fmtDM(money)}\n`
      + (injured.length ? `\nVerletzt:\n${injured.map((x) => '• ' + x).join('\n')}\n` : '\nZum Glück ohne Verletzte.\n')
      + `\nDie eingesetzten Spieler sind müde (Frische gesunken), Reservisten haben Spielpraxis gesammelt.`,
  }));
}

function mastersNews(g: Game, cur: IndoorWinter, t: IndoorTournament, today: string): void {
  const fin = t.result!.matches.find((m) => m.stage === 'F')!;
  const w = winnerOf(fin)!;
  if (w === g.managedClubId) return;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'cup', from: 'Sportpresse',
    subject: `${indoorName(g, w)} gewinnt das Hallen-Masters ${cur.winterYear}`,
    shortText: `Finale in ${t.city}: ${indoorShort(g, fin.a)} – ${indoorShort(g, fin.b)} ${fin.ga}:${fin.gb}${fin.pa != null ? ` (${fin.pa}:${fin.pb} n. N.)` : ''}.`,
    bodyText: `Die Endrunde des DFB-Hallenpokals in der ${t.hall} ist entschieden: ${indoorName(g, w)} holt den Titel.`
      + (cur.mastersDeclined?.length ? `\n\nNicht angetreten trotz Qualifikation: ${cur.mastersDeclined.map((id) => indoorShort(g, id)).join(', ')}.` : ''),
  }));
}

function finishWinter(g: Game, today: string): void {
  const st = indoorState(g);
  const cur = st.current;
  if (!cur || cur.finished) return;
  cur.finished = true;
  if (cur.phase === 'none') return;
  const mid = g.managedClubId;
  const mine = allTournaments(cur).filter((t) => t.done && t.result?.ranking.includes(mid));
  let own: string | undefined;
  if (mine.length) {
    const best = mine.map((t) => ({ t, p: t.result!.ranking.indexOf(mid) })).sort((a, b) => a.p - b.p || Number(b.t.kind === 'masters') - Number(a.t.kind === 'masters'))[0];
    own = `${best.p === 0 ? 'Sieg' : `Platz ${best.p + 1}`} ${best.t.kind === 'masters' ? 'Masters' : best.t.city}`;
  }
  const entry: IndoorHistoryEntry = { year: cur.winterYear, phase: cur.phase, own, winners: cur.tournaments.filter((t) => t.done).map((t) => t.result!.ranking[0]) };
  const m = cur.masters;
  if (m?.done && m.result) {
    const fin = m.result.matches.find((x) => x.stage === 'F')!;
    entry.mastersWinner = m.result.ranking[0];
    entry.mastersRunnerUp = m.result.ranking[1];
    // Ergebnis aus Sicht des Siegers.
    const wa = winnerOf(fin) === fin.a;
    entry.mastersScore = `${wa ? fin.ga : fin.gb}:${wa ? fin.gb : fin.ga}${fin.pa != null ? ` (${wa ? fin.pa : fin.pb}:${wa ? fin.pb : fin.pa} n. N.)` : ''}`;
    entry.city = m.city;
  }
  if (!st.history.some((h) => h.year === entry.year)) st.history.push(entry);
  st.snub = Math.max(0, st.snub - 1);
  void today;
}

/** Ob in diesem Winter überhaupt noch Hallenturniere stattfinden (für die Anzeige). */
export function indoorStillActive(winterYear: number): boolean {
  return winterYear <= INDOOR_LAST_WINTER;
}
