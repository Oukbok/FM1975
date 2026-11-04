// =============================================================================
// Aufstellung: Kaderliste links (Startelf / Ersatzbank / Reserve) mit Spalten
// und Sortierung je Abschnitt. Zeilen sind Ziehquelle und Ablageziel.
// =============================================================================
import { useState, type PointerEvent as RPE, type ReactNode } from 'react';
import type { Player, Position } from '../../types';
import { positionSuitability, suitabilityColor } from '../../engine/positions';
import { PlayerForm, PlayerFreshness, PlayerMorale, MORALE_100, playerMorale100 } from '../status';
import { InfoTip } from '../../ui/InfoTip';
import type { InfoKey } from '../../data/infoTexts';
import { posGroupClass } from '../../ui/positionBadges';

export interface ListRow { p: Player; pos: Position | null; slotId?: string; benchIndex?: number }

type SortKey = 'pos' | 'nr' | 'name' | 'eig' | 'fr' | 'form' | 'moral' | 'note' | 'st';
const POS_ORDER: Position[] = ['TW', 'LIB', 'IV', 'RV', 'LV', 'DM', 'ZM', 'RM', 'LM', 'OM', 'RA', 'LA', 'HS', 'MS'];

const fmtNote = (p: Player) => (p.seasonStats?.ratedMatches ? p.seasonStats.averageRating.toFixed(1).replace('.', ',') : '–');
const isOut = (p: Player) => p.availability !== 'available' || !!p.injury || p.suspensionMatches > 0;

export function rowSuit(r: ListRow): number {
  return positionSuitability(r.p, r.pos ?? r.p.naturalPosition);
}

function sortVal(r: ListRow, k: SortKey, idx: number): number | string {
  const p = r.p;
  switch (k) {
    case 'nr': return p.shirtNumber ?? 99;
    case 'name': return p.lastName;
    case 'eig': return -rowSuit(r);
    case 'fr': return -(p.frische ?? 100);
    case 'form': return -(p.form ?? 50);
    case 'moral': return -playerMorale100(p);
    case 'note': return p.seasonStats?.ratedMatches ? p.seasonStats.averageRating : 9;
    case 'st': return -p.overall;
    default: return r.slotId || r.benchIndex != null ? idx : POS_ORDER.indexOf(p.naturalPosition) * 100 - p.overall / 100;
  }
}

const COLS: [SortKey, string, string, InfoKey?][] = [
  ['pos', 'Pos', 'Position in der Aufstellung bzw. Stammposition'],
  ['nr', 'Nr', 'Rückennummer'],
  ['name', 'Name', 'Name'],
  ['eig', 'Eig', 'Eignung auf der Position (Reserve: Stammposition)', 'eignung'],
  ['fr', 'Frische', 'Frische (Zustand)', 'frische'],
  ['form', 'Form', 'Form'],
  ['moral', 'Moral', 'Moral'],
  ['note', 'Ø Note', 'Durchschnittsnote der Saison'],
  ['st', 'Stärke', 'Gesamtstärke'],
];

/** Abschnitt eines Ablageziels: Startelf (Slots/xi), Bank oder Reserve. */
const drop2kind = (k: string | null) => !k ? null : k.startsWith('slot:') || k === 'xi' ? 'xi' : k.startsWith('bench:') ? 'bench' : k === 'reserve' ? 'reserve' : null;

/** Unbesetzter Platz der Startelf (bleibt in der Liste als leere Position stehen). */
export interface FreeSlot { slotId: string; pos: Position }

export default function SquadList({ xi, free = [], slotOrder = [], bench, reserve, benchSize, captainId, hover, dragId, full, onDown }: {
  xi: ListRow[]; free?: FreeSlot[]; slotOrder?: string[]; bench: ListRow[]; reserve: ListRow[]; benchSize: number; captainId: string | null;
  hover: string | null; dragId: string | null; full: 'bench' | 'xi' | null;
  onDown: (e: RPE, p: Player) => void;
}) {
  const [sort, setSort] = useState<SortKey>('pos');
  const sorted = (rows: ListRow[]) => rows.map((r, i) => ({ r, v: sortVal(r, sort, i) }))
    .sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0)).map((x) => x.r);

  const row = (r: ListRow) => {
    const p = r.p;
    const suit = rowSuit(r);
    const drop = r.slotId ? `slot:${r.slotId}` : r.benchIndex != null ? `bench:${r.benchIndex}` : 'reserve';
    return (
      <tr key={p.id} className={`lu-row ${hover === drop && drop !== 'reserve' && !full ? 'over' : ''} ${dragId === p.id ? 'dragging' : ''} ${isOut(p) ? 'out' : ''}`}
        data-lu-drop={drop} data-pid={p.id} onPointerDown={(e) => onDown(e, p)}>
        <td className="lu-c-pos"><span className={`${r.pos ? 'lu-pos' : 'lu-pos dim'} ${posGroupClass(r.pos ?? p.naturalPosition)}`}>{r.pos ?? p.naturalPosition}</span></td>
        <td className="lu-c-num lu-c-nr">{p.shirtNumber ?? ''}</td>
        <td className="lu-c-name">
          <span className="lu-name">{p.fullName}</span>
          {captainId === p.id && <span className="lu-cap" title="Kapitän">K</span>}
          {p.injury || p.availability === 'injured' ? <span className="lu-flag red">verletzt</span>
            : p.suspensionMatches > 0 ? <span className="lu-flag red">gesperrt</span> : null}
        </td>
        <td className="lu-c-num"><span className="lu-suit" style={{ borderColor: suitabilityColor(suit) }}>{suit}</span></td>
        <td className="lu-c-st"><PlayerFreshness p={p} /></td>
        <td className="lu-c-st"><PlayerForm p={p} /></td>
        <td className="lu-c-st"><PlayerMorale p={p} /></td>
        <td className="lu-c-num">{fmtNote(p)}</td>
        <td className="lu-c-num lu-strong">{p.overall}</td>
      </tr>
    );
  };

  const freeRow = (f: FreeSlot) => {
    const drop = `slot:${f.slotId}`;
    return (
      <tr key={`free-${f.slotId}`} className={`lu-row lu-row-free ${hover === drop && !full ? 'over' : ''}`} data-lu-drop={drop}>
        <td className="lu-c-pos"><span className={`lu-pos ${posGroupClass(f.pos)}`}>{f.pos}</span></td>
        <td className="lu-c-num lu-c-nr" />
        <td className="lu-c-name"><span className="lu-name lu-free">frei</span></td>
        <td className="lu-c-num"><span className="lu-suit lu-ghost">00</span></td>
        <td className="lu-c-st" /><td className="lu-c-st" /><td className="lu-c-st" />
        <td className="lu-c-num" /><td className="lu-c-num" />
      </tr>
    );
  };
  /** Startelf: bei Sortierung nach Position in Formationsreihenfolge mit leeren Plätzen dazwischen, sonst leere Plätze am Ende. */
  const xiBody = () => {
    if (sort === 'pos' && slotOrder.length) {
      const bySlot = new Map(xi.map((r) => [r.slotId, r]));
      const freeBy = new Map(free.map((f) => [f.slotId, f]));
      return slotOrder.map((id) => { const r = bySlot.get(id); if (r) return row(r); const f = freeBy.get(id); return f ? freeRow(f) : null; });
    }
    return [...sorted(xi).map(row), ...free.map(freeRow)];
  };

  const kind = drop2kind(hover);
  const section = (title: string, count: string, drop: string, rows: ListRow[], empty?: string, body?: ReactNode) => (
    <tbody className={`lu-sec lu-sec-${drop.split(':')[0]} ${kind === drop2kind(drop) && !hover?.startsWith('slot:') ? (full ? 'full' : 'over') : ''}`} data-lu-drop={drop}>
      <tr className="lu-sec-head" data-lu-drop={drop}><td colSpan={COLS.length}><span>{title}</span><span className="lu-sec-n">{count}</span></td></tr>
      {body ?? rows.map(row)}
      {!rows.length && !body && empty && <tr className="lu-row-empty" data-lu-drop={drop}><td colSpan={COLS.length}>{empty}</td></tr>}
    </tbody>
  );

  return (
    <div className="lu-list">
      <table className="lu-table">
        <thead>
          <tr>{COLS.map(([k, label, title, info]) => (
            <th key={k} title={title} className={`${sort === k ? 'on' : ''} lu-h-${k}`} onClick={() => setSort(k)}>{label}{info && <InfoTip k={info} />}</th>
          ))}</tr>
        </thead>
        {section('Startelf', `${xi.length}/11`, 'xi', xi, undefined, xiBody())}
        {section('Ersatzbank', `${bench.length}/${benchSize}`, 'bench:end', sorted(bench), 'Spieler hierher ziehen')}
        {section('Reserve', `${reserve.length}`, 'reserve', sorted(reserve), 'Keine weiteren Spieler')}
      </table>
    </div>
  );
}
