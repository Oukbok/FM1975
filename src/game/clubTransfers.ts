// =============================================================================
// TRANSFERARCHIV JE SAISON (Wunsch Pascal) – Reiter „Transfers“ im Vereinsprofil.
// -----------------------------------------------------------------------------
// • Jeder Wechsel zählt zur Saison des Tages, an dem der Spieler wechselt bzw.
//   sein Vertrag beginnt (1.7. = neue Saison, `seasonOfDate`).
// • Geschrieben über den Empfänger in game/transferLog.ts (`archiveTransfer`),
//   Leihen nachträglich markiert (`archiveLoan`). Anders als das Transfer-
//   protokoll (8 Fenster) bleibt alles erhalten – schlanke Tupel, ≈ 60 Byte.
// • Alte Spielstände: `migrateClubTransfers` baut das Archiv einmalig aus den
//   Spielerverläufen und dem Transferprotokoll nach (was rekonstruierbar ist).
// =============================================================================
import type { TransferKind } from '../engine/history';
import type { Game } from './state';
import type { TLEntry } from './transferLog';
import { seasonOfDate } from './managerLog';
import { worldTransferSeasons, worldTransfersOf } from './worldTransfers';

/** [Datum, Spieler-ID, Name, Position, Stärke, Alter, von, zu, Ablöse (1975-Basis), Art] */
export type CTRow = [string, string, string, string, number, number, string, string, number, (TransferKind | 0)?];
export interface ClubTransferArchive { s: Record<string, CTRow[]> }

const rowOf = (e: TLEntry): CTRow => {
  const r: CTRow = [e.d, e.p, e.n, e.pos, e.ov, e.age, e.f, e.t, e.fee];
  if (e.k) r.push(e.k);
  return r;
};

function archiveOf(g: Game): ClubTransferArchive { return (g.clubTransfers ??= { s: {} }); }

/** Wechsel ins Archiv (aus logTransfer). */
export function archiveTransfer(g: Game, e: TLEntry): void {
  (archiveOf(g).s[seasonOfDate(e.d)] ??= []).push(rowOf(e));
}

/** Letzten Wechsel des Spielers als Leihe markieren. */
export function archiveLoan(g: Game, pid: string, date: string): void {
  const list = g.clubTransfers?.s[seasonOfDate(date)] ?? [];
  for (let i = list.length - 1; i >= 0; i--) if (list[i][1] === pid) { list[i][9] = 'loan'; return; }
}

export interface ClubTransferRow {
  date: string; pid: string; name: string; pos: string; ov: number; age: number;
  /** Gegenseite: Vereins-ID oder Name */ other: string; fee: number; kind?: TransferKind;
}
export interface ClubTransferSeason { ins: ClubTransferRow[]; outs: ClubTransferRow[]; loanedOut: ClubTransferRow[]; loanedIn: ClubTransferRow[] }

/** Wechsel eines Vereins in einer Saison, aufgeteilt in Zugänge/Abgänge/Verliehen/Geliehen. */
export function clubTransfersOf(g: Game, clubId: string, season: string): ClubTransferSeason {
  const names = new Set([clubId, g.clubs[clubId]?.name, g.simClubs?.[clubId]?.name].filter(Boolean) as string[]);
  const out: ClubTransferSeason = { ins: [], outs: [], loanedOut: [], loanedIn: [] };
  for (const r of g.clubTransfers?.s[season] ?? []) {
    const from = names.has(r[6]), to = names.has(r[7]);
    if (from === to) continue;
    const kind = r[9] || undefined;
    const row: ClubTransferRow = { date: r[0], pid: r[1], name: r[2], pos: r[3], ov: r[4], age: r[5], other: to ? r[6] : r[7], fee: r[8], kind };
    if (kind === 'loan') (to ? out.loanedIn : out.loanedOut).push(row);
    else (to ? out.ins : out.outs).push(row);
  }
  // Weltspieler (Auslandsvereine, deutsche Vereine ohne vollen Kader): game/worldTransfers.ts
  worldTransfersOf(g, clubId, season, out);
  return out;
}

/** Saisons mit Archiv (neueste zuerst), die laufende immer dabei. */
export function transferSeasons(g: Game): string[] {
  const set = new Set([...Object.keys(g.clubTransfers?.s ?? {}), ...worldTransferSeasons(g), g.season]);
  return [...set].sort().reverse();
}

/** Alte Spielstände: Archiv einmalig aus Protokoll + Spielerverläufen nachbauen. */
export function migrateClubTransfers(g: Game): void {
  if (g.clubTransfers) return;
  const arch = archiveOf(g);
  const seen = new Set<string>();
  for (const w of g.transferLog?.wins ?? []) for (const e of w.e) {
    const k = `${e.d}|${e.p}`;
    if (seen.has(k)) continue;
    seen.add(k); archiveTransfer(g, e);
  }
  const byName = new Map<string, string>();
  for (const c of Object.values(g.simClubs ?? {})) byName.set(c.name, c.id);
  for (const c of Object.values(g.clubs)) byName.set(c.name, c.id);
  const today = g.calendar.currentDate;
  for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers ?? {})]) {
    for (const t of p.history?.transfers ?? []) {
      const k = `${t.date}|${p.id}`;
      if (seen.has(k) || t.date > today) continue;
      seen.add(k);
      const yrs = Number(today.slice(0, 4)) - Number(t.date.slice(0, 4));
      const row: CTRow = [t.date, p.id, p.fullName, p.naturalPosition, Math.round(p.overall), Math.max(15, p.age - yrs),
        byName.get(t.fromClub) ?? t.fromClub, byName.get(t.toClub) ?? t.toClub, 0];
      if (t.kind) row.push(t.kind);
      (arch.s[seasonOfDate(t.date)] ??= []).push(row);
    }
  }
  for (const list of Object.values(arch.s)) list.sort((a, b) => a[0].localeCompare(b[0]));
}
