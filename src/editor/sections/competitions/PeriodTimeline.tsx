// =============================================================================
// EDITOR › WETTBEWERBE – Zeitleiste der Perioden (Wunsch Pascal: Perioden, „durch
// die man dann wechseln kann“): Balken 1960 bis heute + offen, Pfeile, Auswahl,
// Teilen / Zusammenlegen / Grenzen verschieben.
// =============================================================================
import { useState } from 'react';
import type { CompPeriod } from '../../../data/competitions/overrides';
import { COMP_FIRST, OPEN_END } from '../../../data/competitions/registry';
import { hasValues, periodLabel, seasonLabel } from './model';

const VIEW_END = 2035;

interface Props {
  periods: CompPeriod[];
  names: string[];
  held: boolean[];
  sel: number;
  onSel: (i: number) => void;
  onSplit: (y: number) => void;
  onMerge: () => void;
  onStart: (y: number) => void;
  onEnd: (y: number) => void;
}

export function PeriodTimeline({ periods, names, held, sel, onSel, onSplit, onMerge, onStart, onEnd }: Props) {
  const p = periods[sel];
  const [splitY, setSplitY] = useState('');
  const span = VIEW_END - COMP_FIRST + 1;
  const pos = (y: number) => ((Math.min(Math.max(y, COMP_FIRST), VIEW_END + 1) - COMP_FIRST) / span) * 100;
  const ticks = [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2030];
  const yearIn = (v: string) => { const y = Math.round(Number(v)); return Number.isFinite(y) ? y : NaN; };
  const suggest = p ? Math.min(Math.max(p.from + 1, Math.round((p.from + Math.min(p.to, 2030)) / 2)), Math.min(p.to, 2100)) : 1990;

  return (
    <div className="ed-comp-tl">
      <div className="ed-comp-bar" role="tablist">
        {periods.map((x, i) => {
          const l = pos(x.from), r = pos(x.to >= OPEN_END ? VIEW_END + 1 : x.to + 1);
          if (r <= l) return null;
          return (
            <button key={`${x.from}-${i}`} role="tab" aria-selected={i === sel} data-period={i}
              className={`ed-comp-seg ${i === sel ? 'on' : ''} ${hasValues(x) ? 'own' : ''} ${held[i] ? '' : 'off'}`}
              style={{ left: `${l}%`, width: `${r - l}%` }} title={`${periodLabel(x)}: ${names[i]}`} onClick={() => onSel(i)}>
              <span>{names[i]}</span>
            </button>
          );
        })}
      </div>
      <div className="ed-comp-ticks">
        {ticks.map((t) => <span key={t} style={{ left: `${pos(t)}%` }}>{t}</span>)}
      </div>
      <div className="ed-row ed-comp-nav">
        <button className="ed-btn" data-act="prev-period" disabled={sel <= 0} onClick={() => onSel(sel - 1)} title="Vorige Periode">‹</button>
        <select className="ed-in ed-comp-pick" value={sel} onChange={(e) => onSel(Number(e.target.value))}>
          {periods.map((x, i) => <option key={i} value={i}>{periodLabel(x)} · {names[i]}{hasValues(x) ? ' (geändert)' : ''}</option>)}
        </select>
        <button className="ed-btn" data-act="next-period" disabled={sel >= periods.length - 1} onClick={() => onSel(sel + 1)} title="Nächste Periode">›</button>
        <span className="ed-hint">Periode {sel + 1} von {periods.length}</span>
      </div>
      {p && (
        <div className="ed-row ed-comp-acts">
          <label className="ed-comp-yr">von
            <input key={`s${sel}-${p.from}`} className="ed-in num" type="number" defaultValue={p.from} disabled={sel === 0}
              title={sel === 0 ? 'Die erste Periode beginnt immer mit der ältesten Saison.' : 'Beginn verschieben (Ende der vorigen Periode wandert mit)'}
              onBlur={(e) => { const y = yearIn(e.target.value); if (y !== p.from) onStart(y); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
          </label>
          <label className="ed-comp-yr">bis
            <input key={`e${sel}-${p.to}`} className="ed-in num" type="number" defaultValue={p.to >= OPEN_END ? '' : p.to} placeholder="offen" disabled={sel === periods.length - 1}
              title={sel === periods.length - 1 ? 'Die letzte Periode ist offen.' : 'Ende verschieben (Beginn der nächsten Periode wandert mit)'}
              onBlur={(e) => { const y = yearIn(e.target.value); if (y !== p.to) onEnd(y); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
          </label>
          <span className="ed-hint">{seasonLabel(p.from)} bis {p.to >= OPEN_END ? 'offen' : seasonLabel(p.to)}</span>
          <span className="ed-comp-gap" />
          <label className="ed-comp-yr">teilen ab
            <input className="ed-in num" type="number" value={splitY} placeholder={String(suggest)} onChange={(e) => setSplitY(e.target.value)} />
          </label>
          <button className="ed-btn" data-act="split-period" onClick={() => { onSplit(splitY ? yearIn(splitY) : suggest); setSplitY(''); }}>Periode teilen</button>
          <button className="ed-btn" data-act="merge-period" disabled={sel >= periods.length - 1} onClick={onMerge}>Mit nächster zusammenlegen</button>
        </div>
      )}
    </div>
  );
}
