// =============================================================================
// Zufallsereignisse im Spielablauf: monatlich würfeln, Entscheidungen auflösen.
// =============================================================================
import { Game } from './state';
import { InboxMessage, MessageEventRef } from '../types';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { EventContext, resolveEvent, rollMonthlyEvents } from '../engine/randomEvents';

function ctxFor(g: Game, date: string): EventContext | null {
  const club = g.clubs[g.managedClubId];
  if (!club) return null;
  const year = yearOf(date);
  // Fester Zufall aus Verein und Datum: Neuladen würfelt kein Ereignis weg.
  let h = 2166136261;
  const seed = `${g.managedClubId}|ev|${date}`;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  const rng = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { date, year, club, players: g.players, rng, scale: economyScale(year) };
}

export function monthlyEvents(g: Game, today: string): void {
  const ctx = ctxFor(g, today);
  if (!ctx) return;
  for (const ev of rollMonthlyEvents(ctx)) {
    const msg = makeMessage({
      date: today, category: ev.category, from: ev.from, subject: ev.subject, shortText: ev.shortText,
      bodyText: ev.bodyText, actionRequired: !!ev.choices?.length, relatedId: ev.playerId,
    });
    if (ev.choices?.length) {
      msg.choices = ev.choices;
      msg.eventRef = { type: ev.type, playerId: ev.playerId, deadline: CalendarEngine.addDays(today, 7), defaultChoice: ev.defaultChoice, data: ev.data };
    }
    ev.apply?.();
    const money = (ev as { money?: { amount: number; text: string } }).money;
    if (money) book(ctx.club.finances, today, money.amount, money.amount >= 0 ? 'other' : 'other', money.text, true);
    pushMessage(g.messages, msg);
  }
}

/**
 * Weitere Entscheidungs-Nachrichten (KI-Angebote, Vereinsereignisse …) melden
 * hier ihren Typ an; sonst gilt der Katalog aus engine/randomEvents.ts.
 */
export const CHOICE_HANDLERS: Record<string, (g: Game, ref: MessageEventRef, choice: string) => { text: string; money?: { amount: number; text: string } }> = {};

export function chooseEventOption(g: Game, msg: InboxMessage, choiceId: string, auto = false): string {
  if (!msg.eventRef || msg.eventRef.resolved) return msg.resultText ?? '';
  const ctx = ctxFor(g, g.calendar.currentDate);
  if (!ctx) return '';
  const handler = CHOICE_HANDLERS[msg.eventRef.type];
  const eff = handler ? handler(g, msg.eventRef, choiceId) : resolveEvent(ctx, msg.eventRef, choiceId);
  if (eff.money) book(ctx.club.finances, g.calendar.currentDate, eff.money.amount, 'other', eff.money.text, true);
  const label = msg.choices?.find((c) => c.id === choiceId)?.label ?? choiceId;
  msg.eventRef.resolved = choiceId;
  msg.actionRequired = false;
  msg.resultText = `${auto ? 'Ohne Rückmeldung entschieden' : 'Entscheidung'}: ${label}. ${eff.text}`.trim();
  return msg.resultText;
}

/** Nach Ablauf der Frist wird die vorsichtige Standardwahl getroffen. */
export function autoResolveEvents(g: Game, today: string): void {
  for (const m of g.messages) {
    const ref = m.eventRef;
    if (!ref || ref.resolved || ref.deadline > today) continue;
    chooseEventOption(g, m, ref.defaultChoice ?? m.choices?.[0]?.id ?? '', true);
  }
}
