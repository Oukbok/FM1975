// =============================================================================
// TERMINWART – hält die Spielansetzungen der eigenen Liga nach dem Rahmenterminkalender
// (data/matchCalendarRules.ts, Rechnung engine/fixtureRules.ts):
//  • `harmonizeSeason` beim Saisonaufbau: Fr/So/Mo-Spiele, die zu dicht an einem Pokal- oder
//    Europapokaltermin eines Teilnehmers liegen, rücken auf den Hauptspieltag.
//  • `fixtureWatchDaily` täglich (game/day.ts, vor dem eigenen Spiel):
//    – Platzbegehung am Vortag: Schnee, Frost, Nebel, Unwetter → Absage, Nachholspiel unter
//      der Woche (Abstände eingehalten, nicht in der Winterpause, vor den letzten zwei Spieltagen);
//    – Vorschau 12 Tage: Liegt ein Ligaspiel zu dicht an einem Pokal-/Europapokalspiel eines
//      der beiden Vereine (z. B. Donnerstag Europa League → Samstag), wird es innerhalb des
//      Wochenendes verlegt (meist Sonntag). Repariert so auch alte Spielstände sanft – nur
//      künftige Termine, idempotent.
// Simulierte Ligen spielen geschlossen am Hauptspieltag und werden nicht verlegt.
// =============================================================================
import {
  INDOOR_GAP_DAYS, MAKEUP_BEFORE_LAST, MAX_POSTPONEMENTS, MIN_GAP_DAYS, POSTPONE_TEXT, WANT_GAP_DAYS, WD_NAME, calendarEra,
} from '../data/matchCalendarRules';
import { CalendarEngine } from '../engine/calendar';
import { addD, dayDiff, gapTo, findSlotTiered, matchdayBaseDates, wdOf, weatherPostponement } from '../engine/fixtureRules';
import { makeMessage, pushMessage } from '../engine/messages';
import { findWinterBreak } from '../engine/winterBreak';
import type { CalendarEvent, Match, MatchMoveReason } from '../types';
import { inEuroCup, mayPlayOn } from './euroFixture';
import { forecastWeather } from './matchWeather';
import type { Game } from './state';
import type { IndoorState } from './winterShared';

type Kind = 'liga' | 'pokal' | 'europapokal' | 'halle';
export interface Commitment { date: string; kind: Kind }

function aliveInCup(g: Game, id: string): boolean {
  const cup = g.cup;
  if (!cup?.participantIds.includes(id)) return false;
  return !cup.rounds.some((r) => r.ties.some((t) => (t.homeClubId === id || t.awayClubId === id) && t.played && t.winnerClubId && t.winnerClubId !== id));
}

/**
 * Alle Termine eines Vereins: Liga (eigene Liga), Landespokal, Europapokal, Halle.
 * `conservative` = jede mögliche Runde zählt (Saisonaufbau); sonst nur Termine, an denen der
 * Verein nach heutigem Stand noch spielen kann.
 */
export function clubCommitments(g: Game, id: string, conservative: boolean, exclude?: Match): Commitment[] {
  const out: Commitment[] = [];
  for (const m of g.fixtures) {
    if (m === exclude || (m.homeClubId !== id && m.awayClubId !== id)) continue;
    out.push({ date: m.date, kind: 'liga' });
  }
  for (const ev of g.calendar.events) {
    if (ev.type === 'cup_matchday' && g.cup?.participantIds.includes(id)) {
      if (conservative || cupPossible(g, ev, id)) out.push({ date: ev.date, kind: 'pokal' });
    } else if (ev.type === 'euro_matchday' && ev.euroComp) {
      const cup = g.euroCups?.[ev.euroComp];
      if (!inEuroCup(cup, id)) continue;
      if (conservative || mayPlayOn(g, ev, id)) out.push({ date: ev.date, kind: 'europapokal' });
    }
  }
  const cur = (g as Game & { indoor?: IndoorState }).indoor?.current;
  if (cur) {
    for (const t of [...cur.tournaments, ...(cur.masters ? [cur.masters] : [])]) {
      if (t.done || !t.clubIds.includes(id)) continue;
      if (id === g.managedClubId && t.own === 'decline') continue;
      for (let i = 0; i < t.days; i++) out.push({ date: addD(t.date, i), kind: 'halle' });
    }
  }
  return out;
}

function cupPossible(g: Game, ev: CalendarEvent, id: string): boolean {
  const cup = g.cup!;
  if (!aliveInCup(g, id)) return false;
  const round = ev.cupRoundIndex != null ? cup.rounds[ev.cupRoundIndex] : undefined;
  if (!round?.drawn) return true;
  const tie = round.ties.find((t) => t.homeClubId === id || t.awayClubId === id);
  if (!tie) return false;
  if ((ev.leg ?? 0) === 1) return !!tie.legs?.[1] || !tie.played;
  return true;
}

/** Kleinster Abstand eines Termins zu den Pflichtspielen (Halle: eigener Mindestabstand) – < 0 = Regel verletzt. */
function slack(date: string, list: Commitment[]): number {
  let s = Infinity;
  for (const c of list) {
    const g = Math.abs(dayDiff(c.date, date));
    s = Math.min(s, c.kind === 'halle' ? (g >= INDOOR_GAP_DAYS ? WANT_GAP_DAYS + 1 : g) : g);
  }
  return s;
}

function closestKind(date: string, list: Commitment[]): Kind | null {
  let best: Commitment | null = null; let bg = Infinity;
  for (const c of list) {
    const g = Math.abs(dayDiff(c.date, date));
    if (g < bg) { bg = g; best = c; }
  }
  return best?.kind ?? null;
}

const fmt = (d: string) => `${WD_NAME[wdOf(d)]}, ${CalendarEngine.formatDate(d)}`;
const nameOf = (g: Game, id: string) => g.clubs[id]?.name ?? id;

/** Ligaspiel verlegen: Datum, Kalender-Ereignis, Markierung. */
function relocate(g: Game, m: Match, to: string, why: MatchMoveReason, today: string, makeup: boolean): void {
  const prev = m.moved;
  m.moved = { orig: prev?.orig ?? m.date, why, on: today, n: (prev?.n ?? 0) + (makeup ? 1 : 0), makeup: makeup || prev?.makeup || undefined };
  if (!m.moved.makeup) delete m.moved.makeup;
  m.date = to;
  for (const ev of g.calendar.events) {
    if (ev.type === 'matchday' && ev.matchId === m.id) {
      ev.date = to;
      ev.processed = false;
      if (makeup) ev.title = `Spieltag ${m.matchday} (Nachholspiel)`;
    }
  }
  g.calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

function seasonY0(g: Game): number { return parseInt(g.season.slice(0, 4), 10); }

// -----------------------------------------------------------------------------
// Saisonaufbau: Wochenendspiele an Pokal-/Europapokalwochen anpassen
// -----------------------------------------------------------------------------
export function harmonizeSeason(g: Game): number {
  const base = matchdayBaseDates(g.fixtures);
  const cache = new Map<string, Commitment[]>();
  const of = (id: string) => {
    if (!cache.has(id)) cache.set(id, clubCommitments(g, id, true).filter((c) => c.kind !== 'liga'));
    return cache.get(id)!;
  };
  let n = 0;
  for (const m of g.fixtures) {
    if (m.status !== 'scheduled') continue;
    const b = base.get(m.matchday);
    if (!b || b === m.date) continue;
    const other = [...of(m.homeClubId), ...of(m.awayClubId)];
    if (slack(m.date, other) < WANT_GAP_DAYS && slack(b, other) > slack(m.date, other)) {
      m.date = b;
      for (const ev of g.calendar.events) if (ev.type === 'matchday' && ev.matchId === m.id) ev.date = b;
      n++;
    }
  }
  if (n) g.calendar.events.sort((a, b) => a.date.localeCompare(b.date));
  return n;
}

// -----------------------------------------------------------------------------
// Täglich: Platzbegehung (Vortag) + Wochenend-Verlegungen (12 Tage voraus)
// -----------------------------------------------------------------------------
const LOOKAHEAD = 12;

export function fixtureWatchDaily(g: Game, today: string): void {
  if (!g.fixtures?.length || !g.calendar) return;
  weekendRepair(g, today);
  weatherCheck(g, addD(today, 1), today);
}

/** Hauptspieltag-Kandidaten am Wochenende (bzw. um einen Wochenspieltag herum). */
function weekendOptions(g: Game, m: Match, base: string): string[] {
  const y0 = seasonY0(g);
  const out = [base, addD(base, 1)];
  if (wdOf(base) === 6) {
    if (y0 >= 1992) out.push(addD(base, -1));
  } else out.push(addD(base, -1));
  if (m.moved?.makeup) out.push(m.date); // Nachholspiel: eigener Termin bleibt Kandidat
  return [...new Set(out)];
}

function weekendRepair(g: Game, today: string): void {
  const base = matchdayBaseDates(g.fixtures);
  const horizon = addD(today, LOOKAHEAD);
  for (const m of g.fixtures) {
    if (m.status !== 'scheduled' || m.date <= today || m.date > horizon) continue;
    const list = [...clubCommitments(g, m.homeClubId, false, m), ...clubCommitments(g, m.awayClubId, false, m)];
    const now = slack(m.date, list);
    if (now >= WANT_GAP_DAYS) continue;
    const b = m.moved?.makeup ? m.date : base.get(m.matchday) ?? m.date;
    let best = m.date; let bs = now;
    for (const d of weekendOptions(g, m, b)) {
      if (d <= today) continue;
      const s = slack(d, list);
      if (s > bs) { best = d; bs = s; }
    }
    if (best === m.date) continue;
    const kind = closestKind(m.date, list);
    const why: MatchMoveReason = kind === 'europapokal' ? 'europapokal' : kind === 'pokal' ? 'pokal' : 'termin';
    const from = m.date;
    relocate(g, m, best, why, today, false);
    if (m.involvesPlayerClub) {
      const opp = m.homeClubId === g.managedClubId ? m.awayClubId : m.homeClubId;
      pushMessage(g.messages, makeMessage({
        date: today, category: 'match', from: 'Spielausschuss',
        subject: `Spielverlegung: ${m.matchday}. Spieltag gegen ${nameOf(g, opp)}`,
        shortText: `Neu: ${fmt(best)} statt ${fmt(from)}.`,
        bodyText: `Das Ligaspiel gegen ${nameOf(g, opp)} (${m.matchday}. Spieltag) wird von ${fmt(from)} auf ${fmt(best)} verlegt.\n\n`
          + (why === 'europapokal' ? 'Grund: Europapokal unter der Woche – nach den Spielplanrichtlinien bekommt der Verein mehr Ruhe bis zum nächsten Ligaspiel.'
            : why === 'pokal' ? 'Grund: Pokalspiel in derselben Woche – so bleiben zwei Ruhetage zwischen den Spielen.'
              : 'Grund: Terminüberschneidung – zwischen zwei Pflichtspielen liegen mindestens zwei Tage.'),
      }));
    }
  }
}

/** Letzter zulässiger Termin für Nachholspiele: vor den letzten zwei Spieltagen. */
function makeupDeadline(g: Game): string {
  const base = matchdayBaseDates(g.fixtures);
  const mds = [...base.keys()].sort((a, b) => a - b);
  const cut = base.get(mds[Math.max(0, mds.length - MAKEUP_BEFORE_LAST)])!;
  return addD(cut, -MIN_GAP_DAYS);
}

/** Ausweichtermin für ein abgesagtes Spiel (oder null = es gibt keinen, das Spiel findet statt). */
export function findMakeupDate(g: Game, m: Match, from: string): string | null {
  const y0 = seasonY0(g);
  const to = makeupDeadline(g);
  if (from > to) return null;
  const wb = findWinterBreak([...matchdayBaseDates(g.fixtures).values()], y0);
  const list = [...clubCommitments(g, m.homeClubId, false, m), ...clubCommitments(g, m.awayClubId, false, m)];
  const games = list.filter((c) => c.kind !== 'halle').map((c) => c.date);
  const halls = list.filter((c) => c.kind === 'halle').map((c) => c.date);
  const skip = (d: string) => {
    if (wb && d > wb.last && d < wb.first) return true;
    const md = d.slice(5);
    return md === '12-24' || md === '12-25' || md === '12-26' || md === '12-31' || md === '01-01';
  };
  return findSlotTiered({
    preferred: from, from, to, weekdays: calendarEra(y0).midweek, maxShift: Math.max(0, dayDiff(from, to)),
    preferEarlier: true, skip, busy: games, extra: [{ busy: halls, gap: INDOOR_GAP_DAYS }],
  });
}

function weatherCheck(g: Game, day: string, today: string): void {
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  for (const m of g.fixtures) {
    if (m.status !== 'scheduled' || m.date !== day) continue;
    if ((m.moved?.n ?? 0) >= MAX_POSTPONEMENTS) continue;
    const reason = weatherPostponement(day, m.homeClubId, m.awayClubId, tier, forecastWeather(day, m.homeClubId));
    if (!reason) continue;
    const to = findMakeupDate(g, m, addD(day, WANT_GAP_DAYS));
    if (!to) continue; // kein Ausweichtermin vor dem Saisonfinale: Das Spiel findet statt.
    relocate(g, m, to, reason, today, true);
    const own = m.involvesPlayerClub;
    if (!own) continue; // fremde Absagen: Spielplan/Presse zeigen das Nachholspiel
    const t = POSTPONE_TEXT[reason];
    pushMessage(g.messages, makeMessage({
      date: today, category: 'match', from: 'Spielausschuss',
      subject: `Spielabsage (${t.short}): ${nameOf(g, m.homeClubId)} – ${nameOf(g, m.awayClubId)}`,
      shortText: `Nachholspiel ${fmt(to)}.`,
      bodyText: `${t.long}\n\nDas Spiel ${nameOf(g, m.homeClubId)} – ${nameOf(g, m.awayClubId)} (${m.matchday}. Spieltag, ${fmt(day)}) fällt aus. `
        + `Nachholtermin: ${fmt(to)}.`
        + '\n\nNachholspiele liegen unter der Woche, mit mindestens zwei Ruhetagen zu den anderen Spielen und spätestens vor den letzten zwei Spieltagen.',
    }));
  }
}

/** Anzeige: „Nachholspiel“ bzw. „verlegt“ (Kalender, Spielplan, Vorschau, Presse). */
export function moveLabel(m: Match): string | null {
  if (!m.moved) return null;
  if (m.moved.makeup) return `Nachholspiel (${POSTPONE_TEXT[m.moved.why as keyof typeof POSTPONE_TEXT]?.short ?? 'Absage'} am ${CalendarEngine.formatDate(m.moved.orig)})`;
  return `verlegt von ${CalendarEngine.formatDate(m.moved.orig)}`;
}
