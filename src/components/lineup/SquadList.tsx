// =============================================================================
// Aufstellung: Kaderliste links (Startelf / Ersatzbank / Reserve) mit Spalten
// und Sortierung je Abschnitt. Zeilen sind Ziehquelle und Ablageziel.
// =============================================================================
import { useState, type PointerEvent as RPE } from 'react';
import type { Player, Position } from '../../types';
import { positionSuitability, suitabilityColor } from '../../engine/positions';

export interface ListRow { p: Player; pos: Position | null; slotId?: string; benchIndex?: number }

type SortKey = 'pos' | 'nr' | 'name' | 'eig' | 'fr' | 'form' | 'moral' | 'note' | 'st';
const MORALE_DE: Record<string, string> = { very_low: 'sehr schlecht', low: 'schlecht', okay: 'okay', good: 'gut', excellent: 'sehr gut' };
const MORALE_N: Record<string, number> = { very_low: 0, low: 1, okay: 2, good: 3, excellent: 4 };
const POS_ORDER: Position[] = ['TW', 'LIB', 'VS', 'AV', 'DM', 'ZM', 'FL', 'OM', 'HS', 'MS'];

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
    case 'moral': return -(MORALE_N[p.morale] ?? 2);
    case 'note': return p.seasonStats?.ratedMatches ? p.seasonStats.averageRating : 9;
    case 'st': return -p.overall;
    default: return r.slotId || r.benchIndex != null ? idx : POS_ORDER.indexOf(p.naturalPosition) * 100 - p.overall / 100;
  }
}

const COLS: [SortKey, string, string][] = [
  ['pos', 'Pos', 'Position in der Aufstellung bzw. Stammposition'],
  ['nr', 'Nr', 'Rückennummer'],
  ['name', 'Name', 'Name'],
  ['eig', 'Eig', 'Eignung auf der Position (Reserve: Stammposition)'],
  ['fr', 'Frische', 'Frische (Zustand)'],
  ['form', 'Form', 'Form'],
  ['moral', 'Moral', 'Moral'],
  ['note', 'Ø Note', 'Durchschnittsnote der Saison'],
  ['st', 'Stärke', 'Gesamtstärke'],
];

export default function SquadList({ xi, bench, reserve, benchSize, captainId, hover, dragId, onDown }: {
  xi: ListRow[]; bench: ListRow[]; reserve: ListRow[]; benchSize: number; captainId: string | null;
  hover: string | null; dragId: string | null;
  onDown: (e: RPE, p: Player) => void;
}) {
  const [sort, setSort] = useState<SortKey>('pos');
  const sorted = (rows: ListRow[]) => rows.map((r, i) => ({ r, v: sortVal(r, sort, i) }))
    .sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0)).map((x) => x.r);

  const row = (r: ListRow) => {
    const p = r.p;
    const suit = rowSuit(r);
    const drop = r.slotId ? `slot:${r.slotId}` : r.benchIndex != null ? `bench:${r.benchIndex}` : 'reserve';
    const fr = Math.round(p.frische ?? 100);
    return (
      <tr key={p.id} className={`lu-row ${hover === drop ? 'over' : ''} ${dragId === p.id ? 'dragging' : ''} ${isOut(p) ? 'out' : ''}`}
        data-lu-drop={drop} data-pid={p.id} onPointerDown={(e) => onDown(e, p)}>
        <td className="lu-c-pos"><span className={r.pos ? 'lu-pos' : 'lu-pos dim'}>{r.pos ?? p.naturalPosition}</span></td>
        <td className="lu-c-num">{p.shirtNumber ?? ''}</td>
        <td className="lu-c-name">
          <span className="lu-name">{p.fullName}</span>
          {captainId === p.id && <span className="lu-cap" title="Kapitän">K</span>}
          {p.injury || p.availability === 'injured' ? <span className="lu-flag red">verletzt</span>
            : p.suspensionMatches > 0 ? <span className="lu-flag red">gesperrt</span> : null}
        </td>
        <td className="lu-c-num"><span className="lu-suit" style={{ borderColor: suitabilityColor(suit) }}>{suit}</span></td>
        <td className="lu-c-fr">
          <span className="lu-fbar"><span style={{ width: `${fr}%`, background: fr < 70 ? 'var(--orange)' : 'var(--text-3)' }} /></span>
          <span className="lu-num">{fr}</span>
        </td>
        <td className="lu-c-num" style={{ color: (p.form ?? 50) < 35 ? 'var(--orange)' : undefined }}>{Math.round(p.form ?? 50)}</td>
        <td className="lu-c-mor" style={{ color: MORALE_N[p.morale] <= 1 ? 'var(--orange)' : undefined }}>{MORALE_DE[p.morale] ?? p.morale}</td>
        <td className="lu-c-num">{fmtNote(p)}</td>
        <td className="lu-c-num lu-strong">{p.overall}</td>
      </tr>
    );
  };

  const section = (title: string, count: string, drop: string, rows: ListRow[], empty?: string) => (
    <tbody className={`lu-sec ${hover === drop ? 'over' : ''}`} data-lu-drop={drop}>
      <tr className="lu-sec-head" data-lu-drop={drop}><td colSpan={COLS.length}><span>{title}</span><span className="lu-sec-n">{count}</span></td></tr>
      {rows.map(row)}
      {!rows.length && empty && <tr className="lu-row-empty" data-lu-drop={drop}><td colSpan={COLS.length}>{empty}</td></tr>}
    </tbody>
  );

  return (
    <div className="lu-list">
      <table className="lu-table">
        <thead>
          <tr>{COLS.map(([k, label, title]) => (
            <th key={k} title={title} className={`${sort === k ? 'on' : ''} lu-h-${k}`} onClick={() => setSort(k)}>{label}</th>
          ))}</tr>
        </thead>
        {section('Startelf', `${xi.length}/11`, 'xi', sorted(xi))}
        {section('Ersatzbank', `${bench.length}/${benchSize}`, 'bench:end', sorted(bench), 'Spieler hierher ziehen')}
        {section('Reserve', `${reserve.length}`, 'reserve', sorted(reserve), 'Keine weiteren Spieler')}
      </table>
    </div>
  );
}
