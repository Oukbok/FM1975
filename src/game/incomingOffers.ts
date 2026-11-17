// =============================================================================
// Eingehende Angebote für eigene Spieler (Wunsch Pascal: Transfers › Verhandlungen
// zeigt sie, solange eine Entscheidung offen ist; Newscenter-Knopf führt dorthin).
// -----------------------------------------------------------------------------
// Quelle sind die Entscheidungs-Nachrichten selbst – KI-Kaufangebote (`ai_offer`,
// game/aiOffers.ts) und Leihanfragen (`ai_loan_request`, game/loanMarket.ts). Nichts
// wird zusätzlich gespeichert; die Antwort läuft über `chooseEventOption`, damit
// Nachricht, Ergebnistext und Moral-Reaktion dieselben sind wie im Newscenter.
// =============================================================================
import type { InboxMessage, Player } from '../types';
import { chooseEventOption } from './eventsGame';
import type { LoanTerms } from '../engine/loanDeal';
import { offerTerms } from './loanMarket';
import type { Game } from './state';

export const INCOMING_TYPES = ['ai_offer', 'ai_loan_request'] as const;
/** Gegenangebote im Verhandlungen-Reiter: Aufschlag in Prozent auf das Angebot. */
export const COUNTER_STEPS = [10, 25, 50] as const;

export interface IncomingOffer {
  msg: InboxMessage;
  kind: 'sale' | 'loan';
  player: Player | null;
  /** Verein des Interessenten (fehlt bei Auslandsvereinen ohne vollen Kader). */
  clubId?: string;
  clubName: string;
  /** Gebotene Ablöse (Kauf) bzw. Kaufoption (Leihe) in 1975-Basis. */
  fee: number;
  deadline: string;
  /** Spieler möchte wechseln (nur Kaufangebote). */
  wish: boolean;
  /** Bedingungen der Leihe (nur Leihangebote). */
  terms?: LoanTerms;
}

/** Ist das eine noch offene Anfrage eines anderen Vereins für einen eigenen Spieler? */
export function isOpenIncoming(m: InboxMessage): boolean {
  const r = m.eventRef;
  return !!r && !r.resolved && !m.resultText && (INCOMING_TYPES as readonly string[]).includes(r.type);
}

export function incomingOffers(g: Game): IncomingOffer[] {
  return (g.messages ?? []).filter(isOpenIncoming).map((msg): IncomingOffer => {
    const r = msg.eventRef!;
    const player = (r.playerId && g.players[r.playerId]) || null;
    if (r.type === 'ai_offer') {
      const buyer = String(r.data?.buyer ?? '');
      return { msg, kind: 'sale', player, clubId: buyer.startsWith('foreign:') ? undefined : buyer,
        clubName: String(r.data?.buyerName ?? g.clubs[buyer]?.name ?? 'Interessent'), fee: Number(r.data?.fee ?? 0),
        deadline: r.deadline, wish: Number(r.data?.wish ?? 0) === 1 };
    }
    const to = String(r.data?.to ?? '');
    return { msg, kind: 'loan', player, clubId: to, clubName: g.clubs[to]?.name ?? 'Interessent',
      fee: Number(r.data?.option ?? 0), deadline: r.deadline, wish: false, terms: offerTerms(g, r.data, msg.date) };
  }).sort((a, b) => a.deadline.localeCompare(b.deadline));
}

/** Gegenangebot-Wahl (`mehr10`, `mehr25`, `mehr50`) – Bezeichnung für Nachricht und Ergebnis. */
export const counterChoice = (pct: number) => ({ id: `mehr${pct}`, label: `Mehr fordern (+${pct} %)` });

/**
 * Antwort auf ein eingehendes Angebot (Annehmen/Gegenangebot/Ablehnen) – dieselbe
 * Auflösung wie ein Klick in der Nachricht. Gegenangebote, die die Nachricht nicht
 * anbietet, werden als Wahl ergänzt, damit der Ergebnistext sie richtig benennt.
 */
export function answerIncoming(g: Game, msg: InboxMessage, choiceId: string): string {
  const pct = /^mehr(\d+)$/.exec(choiceId);
  if (pct && !msg.choices?.some((c) => c.id === choiceId)) {
    msg.choices = [...(msg.choices ?? []), counterChoice(Number(pct[1]))];
  }
  msg.read = true;
  return chooseEventOption(g, msg, choiceId);
}
