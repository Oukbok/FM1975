// =============================================================================
// Pokalauslosungen im Spielablauf: Termine je Runde setzen (Kalender), die
// Ziehung am Auslosungstag durchführen (Paarungen entstehen erst dann),
// Nachricht schreiben und der Oberfläche die Show melden.
// Alte Spielstände: Runden ohne `drawDate` werden wie bisher direkt nach der
// Vorrunde gelost (day.ts), laufende Wettbewerbe bleiben unverändert.
// Termine/Regeln: data/drawHistory.ts, Ziehung: engine/cupDrawRules.ts.
// =============================================================================
import { EURO_COMP_NAMES, EuroCompId } from '../data/europe';
import { drawDateFor, drawRulesFor, drawVenue, roundArticle, seasonStartYearOf } from '../data/drawHistory';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import { runDraw } from '../engine/cupDrawRules';
import { roundWinners } from '../engine/cup';
import { CalendarEngine } from '../engine/calendar';
import { makeMessage, pushMessage } from '../engine/messages';
import type { CupState, CupTie, GameCalendar } from '../types';
import type { DrawComp, DrawRecord } from '../types/draw';
import { hashSeed, type Game } from './state';

export const DRAW_COMPS: DrawComp[] = ['cup', 'ec', 'cwc', 'uefa'];

export function compCup(g: Game, comp: DrawComp): CupState | null {
  return comp === 'cup' ? g.cup ?? null : g.euroCups?.[comp] ?? null;
}
export function drawCompName(comp: DrawComp): string {
  return comp === 'cup' ? 'Landespokal' : EURO_COMP_NAMES[comp as EuroCompId];
}

/** Setzt die Auslosungstermine aller Runden und trägt sie in den Kalender ein. */
export function scheduleDraws(cup: CupState, comp: DrawComp, calendar: GameCalendar): void {
  const startYear = seasonStartYearOf(cup.rounds[0]?.date ?? calendar.seasonStartDate);
  cup.rounds.forEach((round, i) => {
    if (round.drawn) return;
    const d = drawDateFor(comp, i, cup.rounds.length, startYear, round.date, i > 0 ? cup.rounds[i - 1].date : null, calendar.seasonStartDate);
    if (!d) return;
    round.drawDate = d;
    calendar.events.push({
      id: `drawev_${comp}_${i}`, date: d, type: 'cup_draw',
      title: `Auslosung ${drawCompName(comp)}: ${round.name}`,
      description: `${drawVenue(comp, i, startYear).venue}: Auslosung ${roundArticle(round.name, 'gen')}.`,
      cupRoundIndex: i, euroComp: comp === 'cup' ? undefined : comp,
      processed: false, requiresAction: false,
    });
  });
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

/** Spielstärke für Setzliste und Zusammenfassung. */
export function clubStrength(g: Game, id: string): number {
  const eu = g.euroClubs?.[id];
  if (eu && !g.clubs[id]) return eu.strength;
  const c = g.clubs[id];
  if (c) {
    const ovs = c.playerIds.map((pid) => g.players[pid]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    if (ovs.length) return Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length);
    return c.reputation;
  }
  return g.simClubs?.[id]?.strength ?? eu?.strength ?? 50;
}
export function drawClubName(g: Game, id: string): string {
  return g.clubs[id]?.name ?? g.euroClubs?.[id]?.name ?? g.simClubs?.[id]?.name ?? id;
}
export function drawCountry(g: Game, id: string): string {
  return g.euroClubs?.[id]?.country ?? 'Deutschland';
}

function participantsOf(cup: CupState, ri: number): string[] | null {
  if (ri === 0) return [...cup.participantIds];
  const prev = cup.rounds[ri - 1];
  if (!prev?.drawn || !prev.ties.length || !prev.ties.every((t) => t.played)) return null;
  return roundWinners(prev);
}

/** Führt die Ziehung einer Runde durch (legt Begegnungen + Ablauf an). */
export function performDraw(g: Game, comp: DrawComp, cup: CupState, ri: number, today: string): DrawRecord | null {
  const round = cup.rounds[ri];
  const ids = participantsOf(cup, ri);
  if (!round || round.drawn || !ids || ids.length < 2) return null;
  const startYear = seasonStartYearOf(round.date);
  const rules = drawRulesFor(comp, ri, startYear);
  const am = new Set(cup.amateurClubIds ?? []);
  const out = runDraw({
    ids, rules, seed: hashSeed(`${cup.seed}:ziehung:${comp}:${ri}`), legacySeed: hashSeed(`${cup.seed}:draw:${ri}`),
    isAmateur: (id) => am.has(id), countryOf: (id) => drawCountry(g, id),
    strengthOf: (id) => clubStrength(g, id), nameOf: (id) => drawClubName(g, id),
  });
  const mid = g.managedClubId;
  round.ties = out.pairs.map((p, i): CupTie => ({
    id: comp === 'cup' ? `cup_r${ri}_t${i}` : `euro_${comp}_r${ri}_t${i}`,
    round: ri, homeClubId: p.home, awayClubId: p.away, date: round.date, played: false,
    involvesPlayerClub: p.home === mid || p.away === mid,
    match: null, homeGoals: null, awayGoals: null, decision: null, penalties: null, winnerClubId: null,
  }));
  round.drawn = true;
  cup.currentRoundIndex = ri;
  const v = drawVenue(comp, ri, startYear);
  const ruleText: string[] = [];
  if (out.pots.length === 2 && rules.twoPots) ruleText.push('Zwei Lostöpfe: Amateure und Profis. Jede Paarung beginnt mit einer Kugel aus dem Amateurtopf.');
  if (out.pots.length === 2 && rules.seeded) ruleText.push('Setzliste: Die gesetzten Vereine treffen auf ungesetzte. Je Paarung wird gelost, aus welchem Topf die erste Kugel kommt – sie hat Heimrecht.');
  if (rules.amateurHome) ruleText.push('Amateurvereine haben gegen Profis Heimrecht.');
  if (rules.countryProtection) ruleText.push('Länderschutz: Vereine eines Landes treffen in dieser Runde nicht aufeinander.');
  if (!ruleText.length || out.pots.length === 1) ruleText.unshift('Ein Lostopf. Der zuerst gezogene Verein hat Heimrecht.');
  const rec: DrawRecord = {
    comp, roundIndex: ri, roundName: round.name, date: today, matchDate: round.date,
    venue: v.venue, stage: v.stage, pots: out.pots, balls: out.balls, pairs: out.pairs, rules: ruleText,
  };
  round.draw = rec;
  return rec;
}

/** Nachricht zur Ziehung (Landespokal immer, Europapokal nur mit eigenem Verein). */
export function drawMessage(g: Game, comp: DrawComp, cup: CupState, rec: DrawRecord): void {
  const mid = g.managedClubId;
  const round = cup.rounds[rec.roundIndex];
  const my = round.ties.find((t) => t.homeClubId === mid || t.awayClubId === mid);
  if (comp !== 'cup' && !my) return;
  const name = (id: string) => drawClubName(g, id);
  const compName = drawCompName(comp);
  const heim = my?.homeClubId === mid;
  const opp = my ? name(heim ? my.awayClubId : my.homeClubId) : '';
  const list = round.ties.map((t) => `• ${name(t.homeClubId)} – ${name(t.awayClubId)}`).join('\n');
  pushMessage(g.messages, makeMessage({
    date: rec.date, category: 'cup', from: comp === 'cup' ? 'Landespokal-Kommission' : 'Europapokal-Kommission',
    subject: `Auslosung ${round.name} — ${compName} ${cup.season}`,
    shortText: my ? `Dein Los: ${opp} (${heim ? 'Heimspiel' : 'Auswärtsspiel'})` : `${round.name} ausgelost.`,
    bodyText: `${cap(roundArticle(round.name))} im ${compName} ${cup.season} ist ausgelost (${rec.venue}).\n\n`
      + (my ? `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${opp} (${CalendarEngine.formatDate(round.date)}).\n\n`
        : comp === 'cup' ? 'Dein Verein ist nicht mehr im Wettbewerb.\n\n' : '')
      + `Alle Paarungen:\n${list}\n\nDie Ziehung kannst du unter Statistiken jederzeit noch einmal ansehen.`,
    actionRequired: false,
  }));
}

export interface DrawNotice { comp: DrawComp; roundIndex: number; involvesMe: boolean }

/**
 * Tagesablauf: fällige Ziehungen durchführen. Gibt die heutigen Ziehungen zurück
 * (für die Show); die Oberfläche entscheidet, ob sie anhält.
 */
export function cupDrawsDaily(g: Game, today: string): DrawNotice[] {
  const out: DrawNotice[] = [];
  for (const comp of DRAW_COMPS) {
    const cup = compCup(g, comp);
    if (!cup) continue;
    cup.rounds.forEach((round, ri) => {
      if (round.drawn || !round.drawDate || round.drawDate > today) return;
      const rec = performDraw(g, comp, cup, ri, today);
      if (!rec) return;
      drawMessage(g, comp, cup, rec);
      const mid = g.managedClubId;
      out.push({ comp, roundIndex: ri, involvesMe: rec.pairs.some((p) => p.home === mid || p.away === mid) });
    });
  }
  return out;
}

/** Notfall am Spieltag: noch nicht geloste Runde sofort losen (ohne Show). */
export function ensureDrawn(g: Game, comp: DrawComp, ri: number, today: string): void {
  const cup = compCup(g, comp);
  const round = cup?.rounds[ri];
  if (!cup || !round || round.drawn || !round.drawDate) return;
  const rec = performDraw(g, comp, cup, ri, today);
  if (rec) drawMessage(g, comp, cup, rec);
}

/** Wird die nächste Runde an einem eigenen Termin gelost (neues Verfahren)? */
export function hasScheduledDraw(cup: CupState, ri: number): boolean {
  return !!cup.rounds[ri]?.drawDate && !cup.rounds[ri].drawn;
}

/** Nächste anstehende Ziehung (für Anzeige „Auslosung am …“). */
export function nextDrawDate(cup: CupState | null | undefined): { date: string; round: string } | null {
  const r = cup?.rounds.find((x) => !x.drawn && x.drawDate);
  return r ? { date: r.drawDate!, round: r.name } : null;
}
