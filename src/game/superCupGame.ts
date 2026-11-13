// =============================================================================
// SUPERCUPS & KLEINE POKALE – Ablauf (Wunsch Pascal, #46). Optionales `game.superCup`.
// -----------------------------------------------------------------------------
// • Beim Saisonwechsel: Teilnehmer aus der abgelaufenen Saison festhalten
//   (`superCupSeeds`, vor dem Überschreiben von Tabelle/Pokal/Europapokal), danach
//   (`setupSuperCups`) Termine vor dem ersten Ligaspieltag anlegen:
//   – Heimatland nach data/superCups.ts (Supercup 1987–96/ab 2010, Ligapokal 1997–2007 …),
//   – UEFA-Supercup Ende August, falls ein deutscher Verein dabei ist; sonst nur Ergebnis,
//   – alle übrigen Länder der Hintergrund-Welt: Ergebnis sofort ins Archiv.
// • Spieltag (`superCupMatchday` aus day.ts, Kalender-Ereignis 'super_cup'):
//   volle Vereine über die Match-Engine (eigenes Spiel mit Vorschau/Textmodus wie im
//   Pokal), sonst nach Stärke. Titel über `addTitleRecord` ('super' / 'ligapokal').
// Seite: views/statistiken/SuperCupView.tsx (Statistiken › Supercup).
// =============================================================================
import type { Match } from '../types';
import type { Game } from './state';
import { hashSeed, homeCountryKey } from './state';
import { SUPER_CUPS, SUPER_PRIZE, superEra, type SuperEra } from '../data/superCups';
import { MatchEngine, type KoRule } from '../engine/match';
import { buildEuroClubFull } from '../data/generate';
import { book, bookCupHomeMatch } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { economyScale, yearOf } from '../engine/economy';
import { hashStr, mulberry32, simMatchGoals } from '../engine/leagues';
import { CalendarEngine } from '../engine/calendar';
import { makeMessage, pushMessage } from '../engine/messages';
import { addTitleRecord } from './clubRecords';
import { clubStrength, drawClubName } from './cupDraw';

export type ScStage = 'QF' | 'SF' | 'F' | 'L1' | 'L2';
export interface ScMatch {
  id: string; date: string; stage: ScStage; home: string; away: string;
  /** Platzhalter für Paarungen späterer Runden: Sieger von Spiel-Index. */
  from?: [number | string, number | string];
  played?: boolean; hg?: number; ag?: number; pens?: [number, number]; aet?: boolean;
  winner?: string; match?: Match;
}
export interface ScEvent {
  key: 'home' | 'uefa';
  name: string; country: string; season: string; format: SuperEra['format'] | 'uefa';
  teams: string[]; matches: ScMatch[];
  winner?: string; runnerUp?: string; shared?: boolean;
  era?: SuperEra;
}
export interface ScArchive { season: string; country: string; name: string; winner: string; runnerUp: string; score: string; shared?: boolean }
export interface SuperCupState { v: 1; season: string; events: ScEvent[]; archive: ScArchive[] }
type G = Game & { superCup?: SuperCupState };

export function superCupState(g: Game): SuperCupState {
  const gg = g as G;
  if (!gg.superCup) gg.superCup = { v: 1, season: '', events: [], archive: [] };
  return gg.superCup;
}

export const ROUND_DE: Record<ScStage, string> = { QF: 'Viertelfinale', SF: 'Halbfinale', F: 'Finale', L1: 'Hinspiel', L2: 'Rückspiel' };

// -----------------------------------------------------------------------------
// Teilnehmer aus der abgelaufenen Saison
// -----------------------------------------------------------------------------
export interface ScSeeds { order: string[]; cupWinner: string | null; cupFinalist: string | null; ec: string | null; cwc: string | null; uefa: string | null }

/** Vor dem Überschreiben von Tabelle/Pokal/Europapokal aufrufen (season.ts). */
export function superCupSeeds(g: Game): ScSeeds {
  const top = g.leagues && g.leagues.playerDivision.tier !== 1 ? g.leagues.otherDivisions.find((d) => d.tier === 1)?.table : g.table;
  const rows = top?.rows ?? []; // bereits nach Platz sortiert (wie euroSetup.germanQualifiersV2)
  const cup = g.cup;
  const fin = cup?.rounds[cup.rounds.length - 1]?.ties[0];
  const cupWinner = cup?.winnerClubId ?? fin?.winnerClubId ?? null;
  const cupFinalist = fin && fin.winnerClubId ? (fin.winnerClubId === fin.homeClubId ? fin.awayClubId : fin.homeClubId) : null;
  const w = (k: 'ec' | 'cwc' | 'uefa') => g.euroCups?.[k]?.winnerClubId ?? null;
  return { order: rows.map((r) => r.clubId), cupWinner, cupFinalist, ec: w('ec'), cwc: w('cwc'), uefa: w('uefa') };
}

// -----------------------------------------------------------------------------
// Aufbau zum Saisonstart
// -----------------------------------------------------------------------------
const addDays = (iso: string, n: number) => CalendarEngine.addDays(iso, n);

function busyDates(g: Game, ids: string[]): Set<string> {
  const s = new Set<string>();
  for (const m of g.fixtures) if (ids.includes(m.homeClubId) || ids.includes(m.awayClubId)) s.add(m.date);
  for (const e of g.calendar.events) if (e.type === 'cup_matchday' || e.type === 'euro_matchday' || e.type === 'super_cup') s.add(e.date);
  return s;
}
/** Freier Tag (±1 Tag Abstand zu Pflichtspielen) ab `start` rückwärts/vorwärts. */
function freeDay(busy: Set<string>, start: string, dir: -1 | 1, min: string): string {
  let d = start;
  for (let k = 0; k < 20; k++) {
    if (d >= min && ![-1, 0, 1].some((o) => busy.has(addDays(d, o)))) return d;
    d = addDays(d, dir);
  }
  return start;
}

function firstLeagueDate(g: Game): string {
  return g.fixtures.reduce((a, m) => (m.date < a ? m.date : a), `${g.season.slice(0, 4)}-08-20`);
}

function addEvent(g: Game, m: ScMatch, ev: ScEvent): void {
  g.calendar.events.push({
    id: `scev_${m.id}`, date: m.date, type: 'super_cup', title: `${ev.name}: ${ROUND_DE[m.stage]}`,
    description: ev.key === 'uefa' ? 'Europäischer Supercup' : `${ev.name} ${ev.season}`, matchId: m.id, processed: false, requiresAction: false,
  });
}

function homeEvent(g: Game, s: ScSeeds, y: number): ScEvent | null {
  const country = homeCountryKey(g);
  const era = superEra(country, y);
  if (!era || !s.order.length) return null;
  const champ = s.order[0];
  const cupW = s.cupWinner && s.cupWinner !== champ ? s.cupWinner : null;
  const other = cupW ?? (era.double === 'cupFinalist' && s.cupFinalist && s.cupFinalist !== champ ? s.cupFinalist : s.order[1]);
  if (!other) return null;
  const season = g.season;
  const ev: ScEvent = { key: 'home', name: era.name, country, season, format: era.format, teams: [], matches: [], era };
  const fl = firstLeagueDate(g);
  const id = (k: string) => `sc_${season.slice(0, 4)}_${k}`;
  if (era.format === 'final') {
    ev.teams = [champ, other];
    const busy = busyDates(g, ev.teams);
    const date = freeDay(busy, addDays(fl, era.month === 7 ? -18 : -7), -1, `${y}-07-10`);
    const [h, a] = era.host === 'other' ? [other, champ] : [champ, other];
    ev.matches.push({ id: id('f'), date, stage: 'F', home: h, away: a });
  } else if (era.format === 'legs2') {
    ev.teams = [champ, other];
    const busy = busyDates(g, ev.teams);
    const d1 = freeDay(busy, addDays(fl, -10), -1, `${y}-07-10`);
    const d2 = freeDay(busy, addDays(d1, 4), 1, addDays(d1, 3));
    ev.matches.push({ id: id('l1'), date: d1, stage: 'L1', home: other, away: champ }, { id: id('l2'), date: d2, stage: 'L2', home: champ, away: other });
  } else {
    // Ligapokal (6) bzw. Final Four (4): Meister + Pokalsieger + Liga nach Platz.
    const n = era.format === 'six' ? 6 : 4;
    const list = [champ, ...(cupW ? [cupW] : [])];
    for (const c of s.order) { if (list.length >= n) break; if (!list.includes(c)) list.push(c); }
    if (list.length < n) return null;
    ev.teams = list;
    const busy = busyDates(g, list);
    const fdate = freeDay(busy, addDays(fl, era.format === 'four' ? 150 : -12), -1, `${y}-07-10`);
    const sfd = freeDay(busy, addDays(fdate, -4), -1, `${y}-07-08`);
    if (n === 6) {
      const qfd = freeDay(busy, addDays(sfd, -4), -1, `${y}-07-05`);
      ev.matches.push({ id: id('q1'), date: qfd, stage: 'QF', home: list[2], away: list[5] }, { id: id('q2'), date: qfd, stage: 'QF', home: list[3], away: list[4] });
      ev.matches.push({ id: id('s1'), date: sfd, stage: 'SF', home: list[0], away: '', from: [list[0], 1] }, { id: id('s2'), date: sfd, stage: 'SF', home: list[1], away: '', from: [list[1], 0] });
    } else {
      ev.matches.push({ id: id('s1'), date: sfd, stage: 'SF', home: list[0], away: list[3] }, { id: id('s2'), date: sfd, stage: 'SF', home: list[1], away: list[2] });
    }
    const sIdx = ev.matches.length - 2;
    ev.matches.push({ id: id('f'), date: fdate, stage: 'F', home: '', away: '', from: [sIdx, sIdx + 1] });
  }
  return ev;
}

function uefaEvent(g: Game, s: ScSeeds, y: number): ScEvent | null {
  const a = s.ec, b = y <= 1999 ? s.cwc : s.uefa;
  if (!a || !b || a === b) return null;
  const ev: ScEvent = { key: 'uefa', name: 'Europäischer Supercup', country: 'Europa', season: g.season, format: 'uefa', teams: [a, b], matches: [] };
  const busy = busyDates(g, ev.teams);
  const date = freeDay(busy, `${y}-08-28`, 1, `${y}-08-20`);
  ev.matches.push({ id: `sc_${g.season.slice(0, 4)}_u`, date, stage: 'F', home: a, away: b });
  return ev;
}

/** Nach dem Aufbau von Kalender/Europapokal der neuen Saison aufrufen (season.ts, newGame nicht). */
export function setupSuperCups(g: Game, s: ScSeeds): void {
  const st = superCupState(g);
  const y = parseInt(g.season.slice(0, 4), 10);
  st.season = g.season;
  st.events = [];
  const home = homeEvent(g, s, y);
  if (home) st.events.push(home);
  const uefa = uefaEvent(g, s, y);
  if (uefa) st.events.push(uefa);
  for (const ev of st.events) {
    // Mit vollem eigenem/deutschem Verein: echte Termine im Kalender; sonst sofort ausspielen.
    const anyFull = ev.teams.some((id) => g.clubs[id]);
    if (ev.key === 'uefa' && !anyFull) { for (const m of ev.matches) playScMatch(g, ev, m, m.date); finish(g, ev, m0(ev).date); continue; }
    for (const m of ev.matches) addEvent(g, m, ev);
  }
  g.calendar.events.sort((a, b) => a.date.localeCompare(b.date));
  const mine = st.events.filter((e) => e.teams.includes(g.managedClubId));
  for (const ev of mine) {
    const first = ev.matches.find((m) => m.home === g.managedClubId || m.away === g.managedClubId || (m.from && ev.teams.indexOf(g.managedClubId) < 2));
    pushMessage(g.messages, makeMessage({
      date: g.calendar.currentDate, category: 'cup', from: ev.key === 'uefa' ? 'Europäischer Verband' : 'Verband',
      subject: `${ev.name} ${ev.season}: Du bist dabei`,
      shortText: first ? `${ROUND_DE[first.stage]} am ${CalendarEngine.formatDate(first.date)}` : 'Termine im Kalender.',
      bodyText: `Als ${ev.teams[0] === g.managedClubId ? 'Meister' : ev.key === 'uefa' ? 'Europapokalsieger' : 'Pokalsieger'} spielst du den ${ev.name} ${ev.season}. Teilnehmer: ${ev.teams.map((id) => drawClubName(g, id)).join(', ')}.\n\nDie Termine stehen im Kalender – ein Titel zum Saisonauftakt bringt Prämie und Ruhe.`,
    }));
  }
  backgroundSuperCups(g, y);
}

const m0 = (ev: ScEvent) => ev.matches[ev.matches.length - 1];

/** Übrige Länder (Hintergrund-Welt): Ergebnis sofort ins Archiv. */
function backgroundSuperCups(g: Game, y: number): void {
  const w = g.world;
  if (!w) return;
  const st = superCupState(g);
  const homeKey = homeCountryKey(g);
  const r = mulberry32(hashStr(`sc|${g.season}`));
  for (const [country, c] of Object.entries(w.countries)) {
    if (!c.active || country === homeKey || !SUPER_CUPS[country]) continue;
    const era = superEra(country, y);
    if (!era || !c.lastChampion) continue;
    const champ = c.lastChampion;
    const other = c.lastCupWinner && c.lastCupWinner !== champ ? c.lastCupWinner : c.lastTable[1];
    if (!other) continue;
    const res = quickResult(g, champ, other, r, era);
    st.archive.push({ season: g.season, country, name: era.name, winner: res.winner, runnerUp: res.winner === champ ? other : champ, score: res.score, shared: res.shared });
  }
  if (st.archive.length > 900) st.archive.splice(0, st.archive.length - 900);
}

function quickResult(g: Game, a: string, b: string, r: () => number, era?: SuperEra): { winner: string; score: string; shared?: boolean } {
  const x = simMatchGoals(clubStrength(g, a), clubStrength(g, b), r);
  if (x.home !== x.away) return { winner: x.home > x.away ? a : b, score: `${x.home}:${x.away}` };
  if (era?.shared) return { winner: a, score: `${x.home}:${x.away}`, shared: true };
  const pa = 0.5 + (clubStrength(g, a) - clubStrength(g, b)) / 120;
  return { winner: r() < pa ? a : b, score: `${x.home}:${x.away} i.E.` };
}

// -----------------------------------------------------------------------------
// Spieltag
// -----------------------------------------------------------------------------
function koOf(ev: ScEvent, m: ScMatch): KoRule | undefined {
  if (m.stage === 'L1') return undefined;
  if (m.stage === 'L2') {
    const l1 = ev.matches.find((x) => x.stage === 'L1');
    return { prev: [l1?.ag ?? 0, l1?.hg ?? 0], awayGoals: true, extraTime: true, shootout: true };
  }
  if (ev.era?.shared) return undefined;
  return ev.era?.directPens ? { extraTime: false, shootout: true } : { extraTime: true, shootout: true };
}

function resolvePairing(ev: ScEvent, m: ScMatch): void {
  if (!m.from) return;
  const side = (f: number | string) => (typeof f === 'string' ? f : ev.matches[f]?.winner ?? '');
  const [a, b] = m.from;
  m.home = side(a); m.away = side(b);
}

/** Spiel ausführen (volle Vereine per Engine, sonst nach Stärke). */
function playScMatch(g: Game, ev: ScEvent, m: ScMatch, today: string): void {
  if (m.played) return;
  resolvePairing(ev, m);
  if (!m.home || !m.away) return;
  const mid = g.managedClubId;
  const ko = koOf(ev, m);
  // Eigener Verein gegen Auslandsverein (Europäischer Supercup): Gegner voll anlegen wie im Europapokal.
  if (m.home === mid || m.away === mid) for (const id of [m.home, m.away]) {
    const eu = !g.clubs[id] ? g.euroClubs?.[id] : undefined;
    if (eu) g.clubs[id] = buildEuroClubFull(eu, g.calendar?.seasonStartDate ?? '', g.players);
  }
  const full = !!g.clubs[m.home] && !!g.clubs[m.away];
  if (full) {
    const engine = new MatchEngine(g.clubs[m.home], g.clubs[m.away], g.players, g.pointSystem, {
      seed: hashSeed(`sc:${m.id}`), date: m.date, competition: 'Pokal', logClubIds: [mid], applyInjuries: g.injuriesEnabled, ko,
    });
    const o = ko ? engine.simulateCup() : { ...engine.simulate(), decision: 'regular' as const, penalties: null };
    m.hg = o.result.homeGoals; m.ag = o.result.awayGoals;
    m.pens = o.penalties ? [o.penalties.home, o.penalties.away] : undefined;
    m.aet = o.decision === 'aet';
    m.match = { id: m.id, matchday: 0, date: m.date, homeClubId: m.home, awayClubId: m.away, status: 'finished', result: o.result, events: o.events, involvesPlayerClub: m.home === mid || m.away === mid };
    bookCupHomeMatch(g.clubs[m.home], o.result, m.date, m.home === mid, economyScale(yearOf(m.date)));
  } else {
    const r = mulberry32(hashSeed(`sc:${m.id}`));
    const x = simMatchGoals(clubStrength(g, m.home), clubStrength(g, m.away), r);
    m.hg = x.home; m.ag = x.away;
    if (ko?.shootout && (m.stage !== 'L2' ? x.home === x.away : false)) m.pens = r() < 0.5 ? [5, 4] : [4, 5];
  }
  m.played = true;
  // Sieger
  if (m.stage === 'L1') { m.winner = undefined; return; }
  if (m.stage === 'L2') {
    const l1 = ev.matches.find((x) => x.stage === 'L1')!;
    const aggHome = (m.hg ?? 0) + (l1.ag ?? 0), aggAway = (m.ag ?? 0) + (l1.hg ?? 0);
    m.winner = m.pens ? (m.pens[0] > m.pens[1] ? m.home : m.away) : aggHome !== aggAway ? (aggHome > aggAway ? m.home : m.away)
      : ((l1.ag ?? 0) > (m.ag ?? 0) ? m.home : m.away);
  } else if (m.pens) m.winner = m.pens[0] > m.pens[1] ? m.home : m.away;
  else if (m.hg !== m.ag) m.winner = (m.hg ?? 0) > (m.ag ?? 0) ? m.home : m.away;
  else m.winner = m.home; // geteilter Titel (Remis): Titel für beide, Anzeige „geteilt“
  if (full) {
    const hw = m.winner === m.home;
    const draw = m.hg === m.ag && !m.pens;
    applyMatchEffects(g.clubs[m.home], g.players, draw ? 'D' : hw ? 'W' : 'L');
    applyMatchEffects(g.clubs[m.away], g.players, draw ? 'D' : hw ? 'L' : 'W');
  }
  void today;
}

function prize(g: Game, club: string, amount: number, text: string, date: string): void {
  const c = g.clubs[club];
  if (!c || amount <= 0) return;
  book(c.finances, date, Math.round(amount * economyScale(yearOf(date))), 'prize_money', text, club === g.managedClubId);
}

function finish(g: Game, ev: ScEvent, date: string): void {
  const f = m0(ev);
  if (!f.played || ev.winner) return;
  const shared = !!ev.era?.shared && f.hg === f.ag && !f.pens;
  ev.winner = f.winner;
  ev.runnerUp = f.winner === f.home ? f.away : f.home;
  ev.shared = shared;
  const kind = ev.key === 'uefa' ? 'uefasuper' : ev.format === 'six' ? 'ligapokal' : 'super';
  for (const id of shared ? [f.home, f.away] : [ev.winner!]) addTitleRecord(g, id, kind, ev.season);
  const st = superCupState(g);
  const score = f.stage === 'L2' ? `${(f.hg ?? 0) + (ev.matches[0].ag ?? 0)}:${(f.ag ?? 0) + (ev.matches[0].hg ?? 0)}` : `${f.hg}:${f.ag}`;
  st.archive.push({ season: ev.season, country: ev.country, name: ev.name, winner: ev.winner!, runnerUp: ev.runnerUp!, score: `${score}${f.pens ? ' i.E.' : f.aet ? ' n.V.' : ''}`, shared });
  const amt = ev.key === 'uefa' ? SUPER_PRIZE.uefa : ev.format === 'six' ? SUPER_PRIZE.ligapokal : SUPER_PRIZE.win;
  if (!shared) prize(g, ev.winner!, amt, `Prämie ${ev.name}`, date);
  for (const id of ev.teams) prize(g, id, SUPER_PRIZE.start, `Antrittsgeld ${ev.name}`, date);
  const mid = g.managedClubId;
  const mine = ev.teams.includes(mid);
  pushMessage(g.messages, makeMessage({
    date, category: 'cup', from: ev.key === 'uefa' ? 'Europäischer Verband' : 'Verband', relatedId: f.match?.id,
    subject: shared ? `${ev.name}: ${drawClubName(g, f.home)} und ${drawClubName(g, f.away)} teilen sich den Titel`
      : ev.winner === mid ? `${ev.name} gewonnen!` : `${ev.name} ${ev.season}: ${drawClubName(g, ev.winner!)}`,
    shortText: `${drawClubName(g, f.home)} – ${drawClubName(g, f.away)} ${score}${f.pens ? ` (${f.pens[0]}:${f.pens[1]} i.E.)` : ''}`,
    bodyText: mine
      ? (ev.winner === mid || shared ? `Der erste Titel der Saison ist da: ${ev.name} ${ev.season}. Prämie und ein guter Start für die Stimmung.` : `Der ${ev.name} geht an ${drawClubName(g, ev.winner!)}. Abhaken – die Saison beginnt erst.`)
      : `${drawClubName(g, ev.winner!)} gewinnt den ${ev.name} ${ev.season}.`,
  }));
}

/** Kalender-Ereignis 'super_cup' (day.ts). Rückgabe: Match-ID des eigenen Spiels. */
export function superCupMatchday(g: Game, matchId: string | undefined, today: string): string | null {
  const st = superCupState(g);
  for (const ev of st.events) {
    const m = ev.matches.find((x) => x.id === matchId);
    if (!m) continue;
    // Alle Spiele dieses Tages des Wettbewerbs (zwei Viertel-/Halbfinals an einem Tag).
    let own: string | null = null;
    for (const x of ev.matches.filter((y) => y.date === m.date && !y.played)) {
      playScMatch(g, ev, x, today);
      if (x.match && (x.home === g.managedClubId || x.away === g.managedClubId)) own = x.match.id;
    }
    if (m0(ev).played) finish(g, ev, today);
    return own;
  }
  return null;
}

/** Eigenes Spiel heute (für findOwnMatchDue): Paarung, Datum, K.-o.-Regel. */
export function ownSuperCupDue(g: Game, matchId: string | undefined): { ev: ScEvent; m: ScMatch; ko?: KoRule } | null {
  const st = (g as G).superCup;
  if (!st) return null;
  for (const ev of st.events) {
    const m = ev.matches.find((x) => x.id === matchId);
    if (!m || m.played) continue;
    resolvePairing(ev, m);
    const mid = g.managedClubId;
    const mm = ev.matches.find((x) => x.date === m.date && !x.played && (resolvePairing(ev, x), x.home === mid || x.away === mid));
    const ok = (id: string) => !!g.clubs[id] || !!g.euroClubs?.[id];
    if (!mm || !ok(mm.home) || !ok(mm.away)) return null;
    return { ev, m: mm, ko: koOf(ev, mm) };
  }
  return null;
}

/** Match-Objekt für den Spielbericht. */
export function findSuperCupMatch(g: Game, id: string): { match: Match; label: string } | null {
  for (const ev of (g as G).superCup?.events ?? []) for (const m of ev.matches) if (m.match?.id === id) return { match: m.match, label: `${ev.name} · ${ROUND_DE[m.stage]}` };
  return null;
}

/** Archiv-Eintrag eines Landes/einer Saison mit Beteiligung des Vereins (Trophäenschrank). */
export function superCupArchiveFor(g: Game, season: string, country: string, clubId: string): ScArchive | undefined {
  return (g as G).superCup?.archive.find((a) => a.season === season && a.country === country && (a.winner === clubId || a.runnerUp === clubId));
}

/** Abschneiden des eigenen Vereins in einer Saison (Karriere › Saisons). */
export function superCupResultOf(g: Game, season: string, clubId: string): string | undefined {
  const st = (g as G).superCup;
  if (!st) return undefined;
  const ev = st.season === season ? st.events.find((e) => e.key === 'home' && e.teams.includes(clubId)) : undefined;
  if (ev) {
    if (ev.winner) return ev.winner === clubId || ev.shared ? 'Sieger' : `${ROUND_DE[m0(ev).stage]}`;
    const last = [...ev.matches].reverse().find((m) => m.played && (m.home === clubId || m.away === clubId));
    if (last && last.winner && last.winner !== clubId) return ROUND_DE[last.stage];
    return 'läuft';
  }
  const a = st.archive.find((x) => x.season === season && x.country === homeCountryKey(g) && (x.winner === clubId || x.runnerUp === clubId));
  return a ? (a.winner === clubId || a.shared ? 'Sieger' : 'Finale') : undefined;
}
