// =============================================================================
// Spielertabelle für Transfermarkt, Beobachtung und Spielerpool (Wunsch Pascal,
// Aufbau nach EA FM): Kopfzeile mit Trefferzahl und „Nur gescoutete Spieler“,
// Spalten Info · Spieler · Nation · Verein · Position · Alter · Stärke (Zahl bzw.
// geschätzte Spanne, fett) · Potenzial (Sterne mit Spanne) · Transferwert/Gehalt
// als Spanne · Empfehlung · Kenntnisse (Balken). Zeilen = PoolRow (volle Spieler
// und Weltspieler), Werte aus game/marketView.ts. Spaltenköpfe sortieren – intern
// oder, mit `sort`/`onSort`, beim Aufrufer (Spielerpool: Seiten über die ganze Liste).
// `compact` (Beobachtung, schmale Box): ohne Info, Gehalt und Empfehlungstext.
// =============================================================================
import { useMemo, useState, type ReactNode } from 'react';
import { ClubLink } from '../../components/club/ClubLink';
import ClubCrest from '../../components/ClubCrest';
import FaceThumb from '../../components/FaceThumb';
import PosBadge from '../../components/PosBadge';
import { NatFlag } from '../../components/competition/CountryFlag';
import { KnowledgeBar, StarRating } from '../../components/StarRating';
import { knowWord, poolRows, type PoolRow } from '../../game/playerPool';
import { marketInfoRows, TAG_SHORT, type MarketInfo } from '../../game/marketView';
import type { Game } from '../../game/state';
import { fmtPriceRange, fmtWageRange, vColor, wageHead } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import { useMultiSelect } from '../../ui/useMultiSelect';
import { clubObj } from './pool/poolParts';

export type MarketSortKey = 'name' | 'age' | 'ability' | 'potential' | 'value' | 'wage' | 'rec' | 'know';
export interface MarketSort { k: MarketSortKey; dir: 1 | -1 }
const REC_ORDER: Record<string, number> = { '1+': 8, '1': 7, '2+': 6, '2': 5, '2-': 4, '3': 3, '3-': 2, '4': 1, '–': 0 };

/** Sortierwert einer Zeile (auch für den Spielerpool, der selbst sortiert). */
export function marketSortValue(k: MarketSortKey, r: PoolRow, m: MarketInfo): number | string {
  switch (k) {
    case 'name': return r.name;
    case 'age': return r.age;
    case 'ability': return m.est.ov;
    case 'potential': return m.potential.lo + m.potential.hi;
    case 'value': return m.value[0] + m.value[1];
    case 'wage': return m.wage[0] + m.wage[1];
    case 'rec': return REC_ORDER[m.rec.grade] ?? 0;
    case 'know': return m.k;
  }
}
export function sortRows(rows: PoolRow[], info: Map<string, MarketInfo>, s: MarketSort): PoolRow[] {
  return [...rows].sort((a, b) => {
    const va = marketSortValue(s.k, a, info.get(a.id)!), vb = marketSortValue(s.k, b, info.get(b.id)!);
    return (typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)) * s.dir;
  });
}
const nextSort = (s: MarketSort | null, k: MarketSortKey): MarketSort | null => (s?.k === k ? (s.dir === -1 ? { k, dir: 1 } : null) : { k, dir: k === 'name' ? 1 : -1 });

/** Stärke als Zahl (sicher) bzw. Spanne (geschätzt), fett in der Schrift der Zahlenspalten. */
function Strength({ m }: { m: MarketInfo }) {
  const e = m.est;
  if (e.exact || e.ovLo === e.ovHi) return <b className="mk-ov" style={{ color: vColor(e.ov) }}>{e.ov}</b>;
  return <b className="mk-ov" style={{ color: vColor(e.ov) }} title={`Geschätzt ${e.ovLo}–${e.ovHi} (wahrscheinlich ${e.ov})`}>{e.ovLo}–{e.ovHi}</b>;
}

export function MarketTable({ g, rows, onOpen, action, compact = false, extra, filtered = false, info: infoIn, sort: sortIn, onSort, selectedId, count, scoutToggle = true }: {
  g: Game; rows: PoolRow[]; onOpen: (id: string) => void; action?: (r: PoolRow) => ReactNode;
  compact?: boolean;
  /** Zusatz rechts in der Kopfzeile (z. B. Budget, Seiten) */
  extra?: ReactNode;
  /** Liste ist schon gefiltert (Suche, Filter, Mannschaftsteil) – nur für die Kopfzeile */
  filtered?: boolean;
  /** vorberechnete Marktdaten (Spielerpool) */
  info?: Map<string, MarketInfo>;
  /** Sortierung beim Aufrufer (dann wird hier nicht sortiert) */
  sort?: MarketSort | null; onSort?: (s: MarketSort | null) => void;
  selectedId?: string | null;
  /** Trefferzahl, wenn `rows` nur eine Seite davon ist */
  count?: number;
  /** Schalter „Nur gescoutete Spieler“ (Spielerpool hat dafür einen eigenen Reiter) */
  scoutToggle?: boolean;
}) {
  const [onlyScouted, setOnlyScouted] = useState(false);
  const [sortOwn, setSortOwn] = useState<MarketSort | null>(null);
  const sort = onSort ? sortIn ?? null : sortOwn;
  const setSort = onSort ?? setSortOwn;
  const info = useMemo(() => infoIn ?? marketInfoRows(g, rows), [infoIn, g, rows, g.calendar.currentDate]);
  const shown = useMemo(() => {
    const xs = onlyScouted ? rows.filter((r) => info.get(r.id)?.scouted) : rows;
    return !onSort && sort ? sortRows(xs, info, sort) : xs;
  }, [rows, info, onlyScouted, sort, onSort]);
  const world = useMemo(() => poolRows(g).clubs, [g, g.calendar.currentDate]);
  const ms = useMultiSelect(shown.map((r) => r.id));
  const th = (k: MarketSortKey, label: ReactNode, cls = '') => (
    <th className={`mk-sort ${cls} ${sort?.k === k ? 'on' : ''}`} onClick={() => setSort(nextSort(sort, k))}>
      {label}{sort?.k === k ? <span className="mk-sort-dir">{sort.dir === -1 ? '▼' : '▲'}</span> : null}
    </th>
  );
  const total = count ?? shown.length;

  return (
    <div className={`mk ${compact ? 'compact' : ''}`}>
      <div className="mk-bar">
        <span className="mk-count"><b>{total.toLocaleString('de-DE')}</b> Spieler gefunden{filtered || onlyScouted ? ' (gefiltert)' : ''}</span>
        {scoutToggle && (
          <label className="mk-only-wrap">
            <span>Nur gescoutete Spieler</span>
            <button type="button" className={`toggle mk-only ${onlyScouted ? 'on' : ''}`} aria-pressed={onlyScouted} aria-label="Nur gescoutete Spieler" onClick={() => setOnlyScouted((v) => !v)} />
          </label>
        )}
        {ms.multi && <span className="muted">{ms.sel.size} ausgewählt</span>}
        <span className="mk-extra">{extra}</span>
      </div>
      <div className="mk-scroll">
        <table className="dtable rl-players mk-table" {...ms.attr}>
          <thead><tr>
            <th className="mk-c-check" />
            {!compact && <th className="mk-c-info">Info</th>}
            {th('name', 'Spieler')}
            <th>Nation</th>
            <th>Verein</th>
            <th>Position</th>
            {th('age', 'Alter', 'num')}
            {th('ability', <>Stärke<InfoTip k="faehigkeitSterne" /></>, 'num')}
            {th('potential', <>Potenzial<InfoTip k="potenzial" /></>)}
            {th('value', <>Transferwert<InfoTip k="marktwert" /></>)}
            {!compact && th('wage', wageHead())}
            {th('rec', <>Empfehlung<InfoTip k="empfehlung" /></>)}
            {th('know', 'Kenntnisse', 'ctr')}
            {action && <th />}
          </tr></thead>
          <tbody>
            {shown.map((r) => {
              const c = clubObj(g, r.clubId, world);
              const m = info.get(r.id)!;
              const sel = ms.has(r.id);
              return (
                <tr key={r.id} data-pid={r.id} className={`clickable ${sel ? 'msel' : selectedId === r.id ? 'sel' : ''}`}
                  onMouseDown={ms.onMouseDown} onClick={(e) => { if (!ms.click(e, r.id)) onOpen(r.id); }}>
                  <td className="mk-c-check" onClick={(e) => { e.stopPropagation(); ms.click({ ...e, ctrlKey: true, metaKey: false, shiftKey: e.shiftKey } as unknown as React.MouseEvent, r.id); }}>
                    <span className={`mk-box ${sel ? 'on' : ''}`} role="checkbox" aria-checked={sel} aria-label={`${r.name} markieren`} />
                  </td>
                  {!compact && <td className="mk-c-info">{m.tags.slice(0, 1).map((t) => <span key={t} className="mk-tag" title={m.tags.join(' · ')}>{TAG_SHORT[t] ?? t}{m.tags.length > 1 ? '+' : ''}</span>)}</td>}
                  <td className="nowrap rl-name"><span className="tm-name"><FaceThumb p={r.player ?? { id: r.id, face: r.face, dateOfBirth: `${r.born}-07-01`, age: r.age, fullName: r.name }} club={c} size={26} /><span className="mk-pname">{r.name}</span></span></td>
                  <td className="nowrap"><span className="mk-nat"><NatFlag nat={r.nat} />{!compact && <span>{r.nat}</span>}</span></td>
                  <td className="nowrap">{c ? <ClubLink id={r.clubId}><span className="mk-club"><ClubCrest club={c} size={24} /><span>{compact ? c.shortName || c.name : c.name || c.shortName}</span></span></ClubLink> : <span className="muted">–</span>}</td>
                  <td className="nowrap">{r.player ? <PosBadge p={r.player} /> : <PosBadge pos={r.pos} />}</td>
                  <td className="num mk-num">{r.age}</td>
                  <td className="num nowrap mk-num"><Strength m={m} /></td>
                  <td><StarRating lo={m.potential.lo} hi={m.potential.hi} label="Potenzial" note="Mögliche Höchststärke." /></td>
                  <td className="nowrap"><span className="mk-money">{fmtPriceRange(m.value[0], m.value[1])}</span></td>
                  {!compact && <td className="nowrap"><span className="mk-money">{fmtWageRange(m.wage[0], m.wage[1])}</span></td>}
                  <td className="nowrap"><span className={`mk-rec t${m.rec.tone}`} title={m.rec.text}><span className="mk-rec-c">{m.rec.grade}</span>{!compact && <span className="mk-rec-t">{m.rec.text}</span>}</span></td>
                  <td className="ctr"><KnowledgeBar k={m.k} word={knowWord(m.k)} /></td>
                  {action && <td className="num nowrap" onClick={(e) => e.stopPropagation()}>{action(r)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
