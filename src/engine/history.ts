// =============================================================================
// Spieler-Verlauf: schreibt die Daten fürs Spielerprofil mit.
// Speicher sparen: Spielliste nur für Spieler des eigenen Vereins und begrenzt;
// Stationen/Transfers/Verletzungen sind klein und werden für alle geführt.
// =============================================================================
import {
  Player, Club, Injury, MatchLogEntry, PlayerHistory, AttributeKey, createEmptyStats,
} from '../types';

const MAX_MATCHES = 60;
const MAX_INJURIES = 30;
const MAX_SNAPSHOTS = 12;

function hist(p: Player): PlayerHistory {
  if (!p.history) p.history = {};
  return p.history;
}

export function logMatch(p: Player, entry: MatchLogEntry): void {
  const h = hist(p);
  const list = (h.matches ??= []);
  list.push(entry);
  if (list.length > MAX_MATCHES) list.splice(0, list.length - MAX_MATCHES);
}

export function recordInjury(p: Player, inj: Injury): void {
  const list = (hist(p).injuries ??= []);
  list.push({
    date: inj.startDate, type: inj.type, severity: inj.severity, description: inj.description,
    days: inj.totalDays, fromTraining: inj.fromTraining,
  });
  if (list.length > MAX_INJURIES) list.splice(0, list.length - MAX_INJURIES);
}

/** Art eines Wechsels für das Transferprotokoll (game/transferLog.ts): Leihe bzw. Rückkehr. */
export type TransferKind = 'loan' | 'back';
type TransferSink = (p: Player, fromClub: string, toClub: string, fee: number, date: string, kind?: TransferKind) => void;
let transferSink: TransferSink | null = null;
/** Transferprotokoll anhängen (game/transferLog.ts `bindTransferLog`); null = aus. */
export function setTransferSink(fn: TransferSink | null): void { transferSink = fn; }

export function recordTransfer(p: Player, fromClub: string, toClub: string, fee: number, date: string, kind?: TransferKind): void {
  (hist(p).transfers ??= []).push({ date, fromClub, toClub, fee });
  transferSink?.(p, fromClub, toClub, fee, date, kind);
}

/** Momentaufnahme aller Attribute (z. B. bei Spielbeginn und jeder großen Bewertung). */
export function snapshotAttributes(p: Player, date: string, label: string): void {
  const list = (hist(p).attributeSnapshots ??= []);
  const attributes: Partial<Record<AttributeKey, number>> = {};
  for (const k of Object.keys(p.attributes) as AttributeKey[]) attributes[k] = Math.round(p.attributes[k]);
  list.push({ date, label, attributes });
  if (list.length > MAX_SNAPSHOTS) list.splice(0, list.length - MAX_SNAPSHOTS);
}

/**
 * Saisonabschluss: Saisonbilanz als Station festhalten und die Saisonstatistik
 * für die neue Saison zurücksetzen (Karriere-Statistik bleibt).
 */
export function closeSeason(players: Record<string, Player>, clubs: Record<string, Club>, season: string): void {
  for (const p of Object.values(players)) {
    const s = p.seasonStats;
    if (s && s.appearances > 0) {
      (hist(p).stations ??= []).push({
        season,
        clubId: p.clubId,
        clubName: clubs[p.clubId]?.name ?? '—',
        appearances: s.appearances,
        goals: s.goals,
        assists: s.assists,
        averageRating: Math.round(s.averageRating * 100) / 100,
      });
    }
    p.seasonStats = createEmptyStats();
  }
}
