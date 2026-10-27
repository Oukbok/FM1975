// =============================================================================
// FOOTBALL MANAGER 1980 — Nachrichten-/E-Mail-System
// =============================================================================
// Erzeugt und verwaltet Inbox-Nachrichten ("Nachrichten"-Bereich).
// Jede Nachricht ist eine kleine E-Mail (Absender, Betreff, Datum, Fließtext)
// mit Gelesen/Ungelesen-Status. Wird in App.tsx bei Spiel-Events befüllt.
// =============================================================================
import { InboxMessage, MessageCategory } from '../types';

/** Fortlaufender Zähler für kollisionsfreie IDs innerhalb einer Session. */
let msgCounter = 0;

/** Erzeugt eine eindeutige, serialisierbare Nachrichten-ID. */
export function newMessageId(): string {
  msgCounter += 1;
  return `msg-${Date.now().toString(36)}-${msgCounter}`;
}

/** Parameter zum Erstellen einer Nachricht. */
export interface MessageInput {
  date: string;
  category: MessageCategory;
  from: string;
  subject: string;
  shortText: string;
  bodyText: string;
  actionRequired?: boolean;
  relatedId?: string;
}

/** Baut ein vollständiges {@link InboxMessage}-Objekt (ungelesen). */
export function makeMessage(input: MessageInput): InboxMessage {
  return {
    id: newMessageId(),
    date: input.date,
    category: input.category,
    from: input.from,
    subject: input.subject,
    shortText: input.shortText,
    bodyText: input.bodyText,
    read: false,
    actionRequired: input.actionRequired ?? false,
    relatedId: input.relatedId,
  };
}

/**
 * Fügt eine Nachricht vorne in die Liste ein (neueste zuerst) und begrenzt die
 * Gesamtzahl, damit der Speicherstand nicht unbegrenzt wächst.
 */
export function pushMessage(list: InboxMessage[], msg: InboxMessage, max = 80): void {
  list.unshift(msg);
  if (list.length > max) list.length = max;
}

/** Anzahl ungelesener Nachrichten (für Badge). */
export function unreadCount(list: InboxMessage[]): number {
  return list.reduce((n, m) => (m.read ? n : n + 1), 0);
}

/** Deutsche Labels & Icons je Kategorie (für UI). */
export const CATEGORY_META: Record<MessageCategory, { label: string; icon: string }> = {
  transfer: { label: 'Transfer', icon: '💰' },
  injury: { label: 'Medizin', icon: '🩹' },
  match: { label: 'Spiel', icon: '⚽' },
  board: { label: 'Vorstand', icon: '🏛️' },
  contract: { label: 'Vertrag', icon: '📝' },
  training: { label: 'Training', icon: '🎯' },
  media: { label: 'Presse', icon: '📰' },
  cup: { label: 'Pokal', icon: '🏆' },
  milestone: { label: 'Meilenstein', icon: '📜' },
  general: { label: 'Allgemein', icon: '📬' },
};
