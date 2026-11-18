// =============================================================================
// DEINE AMATEURE IM LANDESPOKAL (bis 2007/08, Wunsch Pascal)
// -----------------------------------------------------------------------------
// Qualifiziert sich deine zweite Mannschaft für den DFB-Pokal (game/reservePyramid.ts
// `cupQualifiers`), tritt sie als Pokal-Verein `amr-<Verein>` an – aber mit ihrem
// echten Kader: dieselbe Auswahl wie am Liga-Sonntag (game/reserveTeam.ts
// `pickReserveXI`: Schwerpunkt, Positions-Trainees, Altersregel), aufgefüllt mit den
// Vertragsamateuren des Pokal-Vereins (Bank, fehlende Plätze).
//  • Profis nie doppelt: Spielen die Profis am selben Tag, sind Startelf und Bank der
//    Profis gesperrt (sonst wie in der Liga nur die Startelf).
//  • Pokalbindung: Wer in dieser Saison für die Amateure im Pokal gespielt hat, darf im
//    Pokal nicht mehr für die Profis spielen – und umgekehrt (engine/registration.ts
//    `setCupTied`, resolveLineup filtert im Wettbewerb „Pokal“). Spielannahme nach der
//    DFB-Spielordnung § 12 Nr. 1 (Einsatz in zweiten Mannschaften in DFB-Pokalspielen
//    eigens geregelt, Lizenzspieler in Landespokalspielen nicht zulässig); eine eigene
//    „Pokalbindung“ zwischen beiden Mannschaften steht dort nicht ausdrücklich – Quellen
//    in data/reserveRules.ts.
//  • Ergebnis-Nachricht + Spielbericht (Bericht wird wie bei eigenen Spielen gespeichert).
// KI-Amateure bleiben Pokal-Vereine aus Vertragsamateuren.
// Spielstand: optionales `game.reserveCupTie` (Saison + gebundene Spieler je Seite).
// =============================================================================
import type { Game } from './state';
import type { CupState, CupTie, Match, Player, Position } from '../types';
import { getFormation } from '../data/formations';
import { positionSuitability } from '../engine/positions';
import { setCupTied } from '../engine/registration';
import { makeMessage, pushMessage } from '../engine/messages';
import { CalendarEngine } from '../engine/calendar';
import { pickReserveXI, reserveState } from './reserveTeam';

export const RESERVE_CUP_PREFIX = 'amr-';
export interface CupTieState { season: string; amateurs: string[]; pros: string[] }
type G = Game & { reserveCupTie?: CupTieState };

/** Pokal-Verein deiner Amateure (auch wenn er gerade nicht existiert). */
export const ownAmrId = (g: Pick<Game, 'managedClubId'>) => `${RESERVE_CUP_PREFIX}${g.managedClubId}`;
/** Spielt deine zweite Mannschaft in dieser Saison im Landespokal? */
export const ownAmrInCup = (g: Game) => !!g.clubs[ownAmrId(g)] && !!g.cup?.participantIds?.includes(ownAmrId(g));

/** Pokalbindung der laufenden Saison (leer zur neuen Saison). */
export function cupTieState(g: Game): CupTieState {
  const gg = g as G;
  if (!gg.reserveCupTie || gg.reserveCupTie.season !== g.season) gg.reserveCupTie = { season: g.season, amateurs: [], pros: [] };
  return gg.reserveCupTie;
}

/** Engine-Zustand setzen (aus bindRegistration, täglich und beim Laden). */
export function bindCupTied(g: Game): void {
  const t = (g as G).reserveCupTie;
  if (!t || t.season !== g.season || !ownAmrInCup(g)) { setCupTied({}); return; }
  setCupTied({ [g.managedClubId]: t.amateurs, [ownAmrId(g)]: t.pros });
}

/** Spielen die Profis an diesem Tag (Liga, Landespokal, Europapokal)? */
export function proPlaysOn(g: Game, date: string): boolean {
  const mid = g.managedClubId;
  if (g.fixtures.some((m) => m.date === date && (m.homeClubId === mid || m.awayClubId === mid))) return true;
  const cups: (CupState | null | undefined)[] = [g.cup, ...Object.values(g.euroCups ?? {})];
  for (const c of cups) for (const r of c?.rounds ?? []) for (const t of r.ties ?? []) {
    if (t.homeClubId !== mid && t.awayClubId !== mid) continue;
    if (t.date === date || t.legs?.some((l) => l.date === date)) return true;
  }
  return false;
}

/** Spieler einer Mannschaft, die im Spiel eingesetzt wurden (aus dem Spielbericht). */
function usedIn(match: Match, clubId: string): string[] {
  const rep = (match.result as { report?: { lineups?: { home: { id: string }[]; away: { id: string }[] } } } | undefined)?.report;
  if (!rep?.lineups) return [];
  return (match.homeClubId === clubId ? rep.lineups.home : match.awayClubId === clubId ? rep.lineups.away : []).map((x) => x.id);
}

/**
 * Pokalspiel mit deinen Amateuren: Kader und Aufstellung des Pokal-Vereins für die Dauer von `fn`
 * auf deine zweite Mannschaft setzen (danach wieder die Vertragsamateure). `fn` bekommt die
 * Vereine, deren Aufstellung/Bericht gespeichert wird.
 */
export function withOwnReserveCup<T>(g: Game, home: string, away: string, date: string, fn: (logIds: string[]) => T): T {
  const mid = g.managedClubId;
  const cid = ownAmrId(g);
  const amr = g.clubs[cid];
  const club = g.clubs[mid];
  const st = reserveState(g);
  if ((home !== cid && away !== cid) || !amr || !club || !st) return fn([mid]);
  const tie = cupTieState(g);
  const exclude = new Set<string>(tie.pros);
  if (proPlaysOn(g, date)) for (const id of [...(club.tactics?.startingXI ?? []), ...(club.tactics?.substitutes ?? [])]) exclude.add(id);
  const xi = pickReserveXI(g, club, st, exclude);
  const saved = { ids: amr.playerIds, tactics: amr.tactics };
  const formation = getFormation(saved.tactics?.formation);
  const lineupMap: Record<string, string> = {};
  const free = [...formation.slots];
  // Torwart zuerst, dann nach genauer Position, sonst nach Eignung auf dem Platz.
  const order = [...xi].sort((a, b) => (a[1] === 'TW' ? -1 : 0) - (b[1] === 'TW' ? -1 : 0));
  for (const [p, pos] of order) {
    if (!free.length) break;
    let i = free.findIndex((s) => s.position === pos);
    if (i < 0) {
      const tw = p.naturalPosition === 'TW';
      const cand = free.map((s, k) => ({ k, v: (s.position === 'TW') === tw ? positionSuitability(p, s.position as Position) : -1 })).sort((x, y) => y.v - x.v)[0];
      if (!cand || cand.v < 0) continue;
      i = cand.k;
    }
    lineupMap[free[i].id] = p.id;
    free.splice(i, 1);
  }
  // A-Jugendliche leben in `youthPlayers` – für das Spiel kurz in den Spieler-Topf.
  const borrowed = xi.map(([p]) => p.id).filter((id) => !g.players[id] && g.youthPlayers?.[id]);
  for (const id of borrowed) g.players[id] = g.youthPlayers[id];
  amr.playerIds = [...Object.values(lineupMap), ...saved.ids];
  amr.tactics = { ...(saved.tactics as NonNullable<typeof saved.tactics>), startingXI: Object.values(lineupMap), lineupMap, substitutes: [] };
  try {
    return fn([mid, cid]);
  } finally {
    amr.playerIds = saved.ids;
    amr.tactics = saved.tactics;
    for (const id of borrowed) delete g.players[id];
  }
}

/** Nach einem Pokalspiel deiner Profis oder Amateure: Pokalbindung fortschreiben. Rückgabe: neu gebundene Amateure. */
export function noteCupAppearances(g: Game, match: Match): Player[] {
  if (!ownAmrInCup(g)) return [];
  const mid = g.managedClubId, cid = ownAmrId(g);
  const t = cupTieState(g);
  const fresh: Player[] = [];
  if (match.homeClubId === mid || match.awayClubId === mid) {
    for (const id of usedIn(match, mid)) if (!t.pros.includes(id)) t.pros.push(id);
  }
  if (match.homeClubId === cid || match.awayClubId === cid) {
    for (const id of usedIn(match, cid)) {
      const p = g.players[id] ?? g.youthPlayers?.[id];
      if (!p || p.clubId !== mid || t.amateurs.includes(id)) continue;
      t.amateurs.push(id); fresh.push(p);
    }
  }
  bindCupTied(g);
  return fresh;
}

/** Nachricht zum Pokalspiel deiner Amateure (Ergebnis bzw. Wiederholung) mit Link zum Spielbericht. */
export function ownReserveCupMessage(g: Game, cup: CupState, tie: CupTie, roundName: string, match: Match, fresh: Player[], replayDate?: string): void {
  const cid = ownAmrId(g);
  const name = (id: string) => g.clubs[id]?.name ?? id;
  const r = match.result;
  if (!r) return;
  const score = `${r.homeGoals}:${r.awayGoals}`;
  const opp = name(match.homeClubId === cid ? match.awayClubId : match.homeClubId);
  const tied = fresh.length
    ? `\n\nPokalbindung: ${fresh.map((p) => p.fullName).join(', ')} ${fresh.length === 1 ? 'hat' : 'haben'} für die Amateure im Pokal gespielt und ${fresh.length === 1 ? 'darf' : 'dürfen'} in dieser Saison im Pokal nicht mehr für die Profis auflaufen.`
    : '';
  let subject: string; let short: string; let body: string;
  if (replayDate) {
    subject = `Amateure im Pokal: ${name(match.homeClubId)} ${score} n.V. ${name(match.awayClubId)}`;
    short = `Unentschieden – Wiederholungsspiel am ${CalendarEngine.formatDate(replayDate)}.`;
    body = `${roundName}, Landespokal ${cup.season}: Deine zweite Mannschaft spielt gegen ${opp} auch nach Verlängerung ${score}. Wiederholung am ${CalendarEngine.formatDate(replayDate)}.`;
  } else {
    const won = tie.winnerClubId === cid;
    const final = cup.rounds[cup.rounds.length - 1]?.ties.includes(tie);
    const line = `${name(tie.homeClubId)} ${tie.homeGoals}:${tie.awayGoals}${tie.decision === 'aet' ? ' n.V.' : tie.decision === 'penalties' ? ' i.E.' : ''} ${name(tie.awayClubId)}`;
    subject = won ? (final ? `Sensation: Deine Amateure gewinnen den Landespokal!` : `Amateure im Pokal weiter: ${line}`) : `Amateure im Pokal ausgeschieden: ${line}`;
    short = won ? `${roundName} gewonnen – die zweite Mannschaft steht in der nächsten Runde.` : `${roundName}: Aus gegen ${opp}.`;
    body = `${roundName}, Landespokal ${cup.season}:\n\n${line}\n\nDeine zweite Mannschaft trat mit ihrem eigenen Kader an (Aufstellung wie am Liga-Sonntag, aufgefüllt mit Vertragsamateuren). `
      + (won ? 'Sie steht in der nächsten Runde.' : 'Für sie ist der Pokal in dieser Saison beendet.');
  }
  pushMessage(g.messages, makeMessage({ date: match.date, category: 'cup', from: 'Trainer der Amateure', subject, shortText: short, bodyText: body + tied, relatedId: match.id }));
}
