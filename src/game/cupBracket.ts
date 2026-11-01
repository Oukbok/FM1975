// =============================================================================
// Turnierbaum eines K.-o.-Wettbewerbs (Landespokal, Europapokale) ohne UI.
// Im Spiel wird jede Runde neu gelost – es gibt also keinen festen Baum. Für die
// Anzeige ordnen wir die gespielten Runden rückwärts so, dass die beiden
// Begegnungen, aus denen eine Paarung der nächsten Runde stammt, direkt
// untereinander stehen. Kommende Runden bleiben leere Plätze.
// Anzeige: components/competition/CupBracket.tsx.
// =============================================================================
import { decisionBadge } from '../engine/cup';
import type { CupState, CupTie } from '../types';

export interface BracketTie {
  home: string;
  away: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winner: string | null;
  /** „n.V.“ / „i.E.“ */
  badge: string;
  pens: { home: number; away: number } | null;
  /** Heimrecht nach Regel getauscht (aus der Ziehung). */
  swapped?: boolean;
  /** Hin- und Rückspiel (Sicht der Begegnung) bzw. erstes Spiel + Wiederholung. */
  legs?: [number, number][];
  /** Durch Auswärtstore entschieden. */
  byAwayGoals?: boolean;
}

export interface BracketRound {
  name: string;
  date: string;
  drawn: boolean;
  /** Plätze in Baum-Reihenfolge; `null` = Paarung steht noch nicht fest. */
  ties: (BracketTie | null)[];
}

function toBracketTie(t: CupTie, swapped?: boolean): BracketTie {
  const legs = (t.legs ?? []).filter((l) => l.played)
    .map((l) => (l.home === t.homeClubId ? [l.homeGoals ?? 0, l.awayGoals ?? 0] : [l.awayGoals ?? 0, l.homeGoals ?? 0]) as [number, number]);
  return {
    home: t.homeClubId, away: t.awayClubId, homeGoals: t.played ? t.homeGoals : null, awayGoals: t.played ? t.awayGoals : null,
    winner: t.played ? t.winnerClubId : null, badge: t.played ? (t.awayGoalsWin ? 'Ausw.' : decisionBadge(t)) : '', pens: t.penalties, swapped,
    legs: (t.legs?.length ?? 0) === 2 && legs.length ? legs : undefined, byAwayGoals: t.awayGoalsWin,
  };
}

/**
 * Europapokal 2.0: Der Baum beginnt mit der ersten K.-o.-Runde, ab der jede Runde genau die
 * Sieger der vorigen enthält (nach Gruppen/Ligaphase, Zwischenrunde, Wechsel aus anderen
 * Wettbewerben). Rückgabe: Index der ersten Baum-Runde.
 */
export function bracketStart(cup: CupState): number {
  let start = 0;
  cup.rounds.forEach((r, i) => { if (r.kind && r.kind !== 'ko') start = i + 1; });
  for (let i = cup.rounds.length - 2; i >= start; i--) {
    const a = cup.rounds[i].need, b = cup.rounds[i + 1].need;
    if (a != null && b != null && b * 2 !== a) { start = i + 1; break; }
  }
  return Math.min(start, cup.rounds.length - 1);
}

export function bracketFromCup(full: CupState): BracketRound[] {
  const cup: CupState = full.v2 ? { ...full, rounds: full.rounds.slice(bracketStart(full)) } : full;
  const R = cup.rounds.length;
  const firstSize = full.v2 ? Math.max(1, Math.round((cup.rounds[0]?.need ?? 2) / 2)) : Math.max(cup.rounds[0]?.ties.length ?? 0, Math.ceil(cup.participantIds.length / 2), 1 << Math.max(0, R - 1));
  const sizes = cup.rounds.map((_, i) => Math.max(1, Math.round(firstSize / (1 << i))));
  const ordered: (CupTie | null)[][] = cup.rounds.map((r) => (r.drawn ? [...r.ties] : []));
  let last = -1;
  cup.rounds.forEach((r, i) => { if (r.drawn && r.ties.length) last = i; });
  // Rückwärts: Runde i nach den Teilnehmern von Runde i+1 ordnen.
  for (let i = last - 1; i >= 0; i--) {
    const pool = ordered[i].filter((t): t is CupTie => !!t);
    const out: (CupTie | null)[] = new Array(Math.max(sizes[i], pool.length)).fill(null);
    ordered[i + 1].forEach((nt, k) => {
      if (!nt) return;
      [nt.homeClubId, nt.awayClubId].forEach((id, side) => {
        const idx = pool.findIndex((t) => t.winnerClubId === id);
        if (idx >= 0 && 2 * k + side < out.length) out[2 * k + side] = pool.splice(idx, 1)[0];
      });
    });
    // Rest (sollte nicht vorkommen) in freie Plätze.
    for (const t of pool) { const free = out.indexOf(null); if (free >= 0) out[free] = t; else out.push(t); }
    ordered[i] = out;
  }
  return cup.rounds.map((r, i) => {
    const swappedOf = (t: CupTie) => r.draw?.pairs.find((p) => p.home === t.homeClubId && p.away === t.awayClubId)?.swapped;
    const list = ordered[i].map((t) => (t ? toBracketTie(t, swappedOf(t)) : null));
    while (list.length < sizes[i]) list.push(null);
    return { name: r.name, date: r.date, drawn: r.drawn, ties: list };
  });
}
