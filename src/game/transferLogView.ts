// =============================================================================
// Transferbilanz: Anzeigedaten aus dem Transferprotokoll (game/transferLog.ts)
// – Zeilen mit aufgelösten Vereinen, Filter/Sortierung, Transfer des Fensters,
// Top-Transfers der eigenen Liga, Texte für Verträge/Gerüchte/Trainer.
// Ohne React; genutzt von views/transfers/window/.
// =============================================================================
import { historicClubInfo } from '../data/history/historicClubs';
import { scoutRange } from '../engine/scouting';
import { POSITION_GROUPS, type Player, type Position, type PositionGroup } from '../types';
import { clubView } from './clubProfile';
import type { Game } from './state';
import { buildCoachNews, buildRumors, type TLCoach, type TLEntry, type TLRenewal, type TLRumor, type TLWindow, keyYear } from './transferLog';

export interface TLRow {
  i: number;
  e: TLEntry;
  player?: Player;
  fromId?: string; toId?: string;
  fromName: string; toName: string;
  /** Beteiligung des Auslands */ intl: boolean;
  loan: boolean; back: boolean; own: boolean;
  group: PositionGroup;
  pot?: [number, number];
  /** Vertragsende beim neuen Verein (nur solange er dort spielt) */ expiry?: string;
}

/** Ist das eine (bekannte) Vereins-ID? */
function knownClub(g: Game, id: string): 'de' | 'eu' | null {
  if (g.clubs[id] || g.simClubs?.[id] || historicClubInfo(id)) return 'de';
  if (g.euroClubs?.[id]) return 'eu';
  return null;
}

export function clubName(g: Game, ref: string, year: number): string {
  const k = knownClub(g, ref);
  if (k === 'de') return clubView(g, ref, year).name;
  if (k === 'eu') return g.euroClubs![ref].name;
  return ref || 'vereinslos';
}

export function rowsOf(g: Game, w: TLWindow): TLRow[] {
  const my = g.managedClubId, year = keyYear(w.key);
  return w.e.map((e, i) => {
    const fk = knownClub(g, e.f), tk = knownClub(g, e.t);
    const p = g.players[e.p] ?? g.youthPlayers?.[e.p];
    const german = (k: 'de' | 'eu' | null, ref: string) => k === 'de' || (k === null && ref !== 'Ausland');
    return {
      i, e, player: p,
      fromId: fk ? e.f : undefined, toId: tk ? e.t : undefined,
      fromName: clubName(g, e.f, year), toName: clubName(g, e.t, year),
      intl: !(german(fk, e.f) && german(tk, e.t)),
      loan: e.k === 'loan', back: e.k === 'back', own: e.f === my || e.t === my,
      group: POSITION_GROUPS[e.pos as Position] ?? 'MID',
      pot: p ? scoutRange(p) : undefined,
      expiry: p && p.clubId === e.t ? p.contract.expiryDate : undefined,
    };
  });
}

// --------------------------------------------------------------- Filter/Sort
export interface TLFilter { nat: boolean; intl: boolean; groups: PositionGroup[]; minFee: number; minOv: number; club: string }
export const DEFAULT_FILTER: TLFilter = { nat: true, intl: true, groups: ['GK', 'DEF', 'MID', 'ATT'], minFee: 0, minOv: 0, club: '' };
export type TLSortKey = 'name' | 'pos' | 'ov' | 'pot' | 'age' | 'from' | 'to' | 'fee' | 'until';

export function filterRows(rows: TLRow[], f: TLFilter): TLRow[] {
  return rows.filter((r) => (r.intl ? f.intl : f.nat) && f.groups.includes(r.group) && r.e.fee >= f.minFee && r.e.ov >= f.minOv
    && (!f.club || r.e.f === f.club || r.e.t === f.club));
}

export function sortRows(rows: TLRow[], key: TLSortKey, desc: boolean): TLRow[] {
  const v = (r: TLRow): number | string => {
    switch (key) {
      case 'name': return r.e.n;
      case 'pos': return r.e.pos;
      case 'ov': return r.e.ov;
      case 'pot': return r.pot ? r.pot[0] + r.pot[1] : -1;
      case 'age': return r.e.age;
      case 'from': return r.fromName;
      case 'to': return r.toName;
      case 'fee': return r.back ? -2 : r.loan ? -1 : r.e.fee;
      case 'until': return r.expiry ?? '';
    }
  };
  return [...rows].sort((a, b) => {
    const x = v(a), y = v(b);
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'de');
    return (desc ? -c : c) || b.e.ov - a.e.ov;
  });
}

/** Transfer des Fensters: höchste Ablöse, sonst stärkster Neuzugang (ohne Leih-Rückkehrer). */
export function transferOfWindow(rows: TLRow[]): TLRow | undefined {
  return [...rows].filter((r) => !r.back).sort((a, b) => b.e.fee - a.e.fee || b.e.ov - a.e.ov)[0];
}

/** Top-Transfers: Neuzugänge der Vereine der eigenen Liga, nach Stärke (Ablöse als Spalte). */
export function topTransfers(g: Game, rows: TLRow[], n = 10): TLRow[] {
  const league = new Set(g.table.rows.map((r) => r.clubId));
  return rows.filter((r) => !r.back && league.has(r.e.t))
    .sort((a, b) => b.e.ov - a.e.ov || b.e.fee - a.e.fee || a.e.age - b.e.age).slice(0, n);
}

/** Vereine, die im Fenster vorkommen (für „Verein auswählen“). */
export function clubsOfWindow(g: Game, rows: TLRow[]): { id: string; name: string }[] {
  const ids = new Set<string>();
  for (const r of rows) { if (r.fromId && g.clubs[r.fromId]) ids.add(r.fromId); if (r.toId && g.clubs[r.toId]) ids.add(r.toId); }
  return [...ids].map((id) => ({ id, name: g.clubs[id].name })).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// ---------------------------------------------------------- Kästen (Texte)
export interface TLNews { key: string; clubId: string; playerId?: string; text: string }

export function renewalNews(g: Game, w: TLWindow, club = ''): TLNews[] {
  const year = keyYear(w.key);
  return [...w.r].filter((r: TLRenewal) => !club || r.c === club).sort((a, b) => b.ov - a.ov)
    .map((r, i) => ({ key: `r${i}`, clubId: r.c, playerId: r.p, text: `${r.n} verlängert bei ${clubName(g, r.c, year)} bis zum ${r.until.slice(8, 10)}.${r.until.slice(5, 7)}.${r.until.slice(0, 4)}` }));
}

const RUMOR_TXT = [
  (n: string, c: string) => `${n} zu ${c}?`,
  (n: string, c: string) => `${n} wird von ${c} beobachtet`,
  (n: string, c: string) => `${c} hat Interesse an ${n}`,
  (n: string, c: string) => `${c} ist angeblich an ${n} interessiert`,
];
export function rumorNews(g: Game, w: TLWindow, club = ''): TLNews[] {
  const year = keyYear(w.key);
  const list: TLRumor[] = w.gr ?? buildRumors(g, g.calendar.currentDate);
  return list.filter((r) => !club || r.c === club || g.players[r.p]?.clubId === club)
    .map((r, i) => ({ key: `g${i}`, clubId: r.c, playerId: r.p, text: RUMOR_TXT[Math.abs(r.v) % RUMOR_TXT.length](r.n, clubName(g, r.c, year)) }));
}

export function coachNews(g: Game, w: TLWindow, club = ''): TLNews[] {
  const year = keyYear(w.key);
  const list: TLCoach[] = w.co ?? buildCoachNews(g, w.key, false);
  const t = (x: TLCoach, c: string) => {
    switch (x.kind) {
      case 'entlassen': return `${c} trennt sich von Trainer ${x.n}`;
      case 'ruhestand': return `${x.n} beendet seine Trainerlaufbahn bei ${c}`;
      case 'abgeworben': return `${x.n} verlässt ${c} – von einem größeren Verein abgeworben`;
      case 'vertragsende': return `${x.n} und ${c} gehen getrennte Wege`;
      case 'neu': return `${x.n} übernimmt bei ${c}`;
      case 'wackelt': return `${x.n} steht bei ${c} kurz vor der Entlassung`;
    }
  };
  return list.filter((x) => !club || x.c === club).map((x, i) => ({ key: `c${i}`, clubId: x.c, text: t(x, clubName(g, x.c, year)) }));
}
