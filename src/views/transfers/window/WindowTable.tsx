// =============================================================================
// Transferbilanz › Reiter „Transfers“: Tabelle aller Wechsel des Fensters
// (sortierbar, Listenstil „Paarungen“) + Filter rechts.
// =============================================================================
import type { Game } from '../../../game/state';
import { type TLFilter, type TLRow, type TLSortKey } from '../../../game/transferLogView';
import type { PositionGroup } from '../../../types';
import { fmtPrice, vColor } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import { ClubCell, feeText, fmtDate, potText, PlayerName } from './parts';

const COLS: { k: TLSortKey; label: string; cls?: string }[] = [
  { k: 'name', label: 'Spieler' }, { k: 'pos', label: 'Pos.', cls: 'ctr' }, { k: 'ov', label: 'Stärke', cls: 'num' },
  { k: 'pot', label: 'Potenzial' }, { k: 'age', label: 'Alter', cls: 'num' }, { k: 'from', label: 'Von' }, { k: 'to', label: 'Zu' },
  { k: 'fee', label: 'Ablöse', cls: 'num' }, { k: 'until', label: 'Vertrag', cls: 'num' },
];

export function WindowTable({ g, rows, sort, onSort, onOpen }: {
  g: Game; rows: TLRow[]; sort: { k: TLSortKey; desc: boolean }; onSort: (k: TLSortKey) => void; onOpen: (id: string) => void;
}) {
  if (!rows.length) return <div className="tw-empty">Keine Wechsel zu diesen Filtern.</div>;
  return (
    <table className="dtable tw-table">
      <thead><tr>
        {COLS.map((c) => (
          <th key={c.k} className={`${c.cls ?? ''} tw-sort ${sort.k === c.k ? 'on' : ''}`} onClick={() => onSort(c.k)}>
            {c.label}{c.k === 'pot' && <InfoTip k="potenzial" />}{sort.k === c.k ? (sort.desc ? ' ▾' : ' ▴') : ''}
          </th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.i} className={r.own ? 'me' : ''}>
            <td className="nowrap rl-name"><PlayerName row={r} onOpen={onOpen} /></td>
            <td className="ctr"><span className="pos-badge">{r.e.pos}</span></td>
            <td className="num"><b style={{ color: vColor(r.e.ov) }}>{r.e.ov}</b></td>
            <td className="nowrap tw-pot">{potText(r)}</td>
            <td className="num">{r.e.age}</td>
            <td className="nowrap"><ClubCell g={g} id={r.fromId} name={r.fromName} /></td>
            <td className="nowrap"><ClubCell g={g} id={r.toId} name={r.toName} /></td>
            <td className={`num nowrap ${r.e.fee > 0 && !r.loan && !r.back ? '' : 'muted'}`}>{feeText(r)}</td>
            <td className="num muted">{fmtDate(r.expiry)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const GROUPS: { k: PositionGroup; label: string }[] = [{ k: 'GK', label: 'TW' }, { k: 'DEF', label: 'ABW' }, { k: 'MID', label: 'MIT' }, { k: 'ATT', label: 'STU' }];
const FEE_STEPS = [0, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000];
const OV_STEPS = [0, 50, 55, 60, 65, 70, 75, 80, 85];

function Stepper({ label, value, steps, fmt, onChange }: { label: string; value: number; steps: number[]; fmt: (v: number) => string; onChange: (v: number) => void }) {
  const i = Math.max(0, steps.indexOf(value));
  return (
    <div className="tw-step">
      <span className="tw-step-l">{label}</span>
      <button className="tw-step-b" disabled={i === 0} onClick={() => onChange(steps[i - 1])} aria-label={`${label} senken`}>‹</button>
      <span className="tw-step-v">{fmt(value)}</span>
      <button className="tw-step-b" disabled={i === steps.length - 1} onClick={() => onChange(steps[i + 1])} aria-label={`${label} erhöhen`}>›</button>
    </div>
  );
}

export function WindowFilters({ f, onChange, count, total, until }: { f: TLFilter; onChange: (f: TLFilter) => void; count: number; total: number; until: string }) {
  const chk = (on: boolean, label: string, set: (v: boolean) => void) => (
    <label className="tw-chk"><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} /> {label}</label>
  );
  return (
    <div className="tw-filters">
      <div className="tw-filters-h">Wechsel bis {until}</div>
      <div className="tw-filters-n">{count} von {total}</div>
      <div className="tw-chk-grid">
        {chk(f.nat, 'National', (v) => onChange({ ...f, nat: v }))}
        {chk(f.intl, 'International', (v) => onChange({ ...f, intl: v }))}
        {GROUPS.map((x) => chk(f.groups.includes(x.k), x.label, (v) => onChange({ ...f, groups: v ? [...f.groups, x.k] : f.groups.filter((y) => y !== x.k) })))}
      </div>
      <Stepper label="Ab Ablöse" value={f.minFee} steps={FEE_STEPS} fmt={(v) => (v ? fmtPrice(v) : 'alle')} onChange={(v) => onChange({ ...f, minFee: v })} />
      <Stepper label="Ab Stärke" value={f.minOv} steps={OV_STEPS} fmt={(v) => (v ? String(v) : 'alle')} onChange={(v) => onChange({ ...f, minOv: v })} />
    </div>
  );
}
