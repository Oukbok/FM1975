// =============================================================================
// Filter-Popup für Transfermarkt und Spielerpool (Wunsch Pascal): Knopf „Filter“
// in der Reiterleiste, kleines Fenster fester Größe darunter. Gefiltert wird nach
// dem, was dein Stab weiß (Schätzung aus game/marketView.ts), nicht nach den
// verdeckten Wahrheiten. `pool` blendet Name/Land/Liga zusätzlich ein.
// =============================================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MarketInfo } from '../../game/marketView';
import type { PoolRow } from '../../game/playerPool';
import { countryName } from '../../game/worldPool';
import { POSITION_GROUPS } from '../../types';
import { fmtPrice } from '../../ui/format';
import { placeNear, uiScale } from '../../ui/floating';
import Select from '../../ui/Select';
import Seg from '../../ui/Seg';

export interface MarketFilter {
  name: string;
  ageMin: number; ageMax: number;
  ovMin: number;
  stMin: number;
  valueMax: number;
  contract: '' | 'soon';
  listed: boolean;
  origin: '' | 'home' | 'foreign';
  know: 0 | 1 | 2;
  country: string;
  level: number;
  grp: string;
}
export const EMPTY_FILTER: MarketFilter = { name: '', ageMin: 15, ageMax: 40, ovMin: 0, stMin: 0, valueMax: 0, contract: '', listed: false, origin: '', know: 0, country: '', level: 0, grp: '' };

/** Zahl gesetzter Filter (für die Beschriftung des Knopfs). */
export function filterCount(f: MarketFilter): number {
  let n = 0;
  for (const k of Object.keys(EMPTY_FILTER) as (keyof MarketFilter)[]) if (k !== 'ageMax' && f[k] !== EMPTY_FILTER[k]) n++;
  if (f.ageMax !== EMPTY_FILTER.ageMax && f.ageMin === EMPTY_FILTER.ageMin) n++;
  return n;
}

/** Passt eine Zeile zum Filter? `home` = Land des Heimatvereins (Deutschland). */
export function passes(f: MarketFilter, r: PoolRow, m: MarketInfo | undefined, homeNat: string): boolean {
  if (f.name && !r.name.toLowerCase().includes(f.name.trim().toLowerCase())) return false;
  if (r.age < f.ageMin || r.age > f.ageMax) return false;
  if (f.grp && POSITION_GROUPS[r.pos] !== f.grp) return false;
  if (m) {
    if (f.ovMin && m.est.ovHi < f.ovMin) return false;
    if (f.stMin && m.potential.hi < f.stMin) return false;
    if (f.valueMax && m.value[0] > f.valueMax) return false;
    if (f.know === 1 && m.k < 0.2) return false;
    if (f.know === 2 && m.k < 0.45) return false;
  }
  if (f.contract === 'soon' && !(m?.tags.includes('Ablösefrei bald') || m?.tags.includes('Vertrag endet'))) return false;
  if (f.listed && !m?.tags.includes('Transferliste')) return false;
  if (f.origin === 'home' && r.nat !== homeNat) return false;
  if (f.origin === 'foreign' && r.nat === homeNat) return false;
  if (f.country === 'foreign' ? r.country === 'Deutschland' : f.country && r.country !== f.country) return false;
  if (f.level && (f.level === 3 ? r.level < 3 : r.level !== f.level)) return false;
  return true;
}

const AGES = Array.from({ length: 26 }, (_, i) => ({ value: 15 + i, label: String(15 + i) }));
const W = 460, H = 470;

/** Knopf „Filter“ (für die Reiterleiste) + Popup. */
export function FilterButton({ f, onChange, pool = false, countries = [], valueSteps = [] }: {
  f: MarketFilter; onChange: (f: MarketFilter) => void;
  pool?: boolean; countries?: string[];
  /** Obergrenzen für den Transferwert (1975-Basis) */
  valueSteps?: number[];
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; s: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const s = uiScale();
    const p = placeNear(btn.current.getBoundingClientRect(), W * s, H * s);
    setPos({ ...p, s });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Element;
      if (box.current?.contains(t) || btn.current?.contains(t) || t.closest?.('.sel3-pop')) return;
      setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  const n = filterCount(f);
  const set = (patch: Partial<MarketFilter>) => onChange({ ...f, ...patch });
  return (
    <>
      <button ref={btn} type="button" className={`tab mk-filter-btn ${open || n ? 'active' : ''}`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>Filter</span>{n > 0 && <span className="sub3-n">{n}</span>}
      </button>
      {open && createPortal(
        <div ref={box} className="mk-filter" role="dialog" aria-label="Filter"
          style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: W, height: H, transform: pos && pos.s !== 1 ? `scale(${pos.s})` : undefined, visibility: pos ? 'visible' : 'hidden' }}>
          <div className="mk-filter-head"><b>Filter</b>
            <button type="button" className="dchip" disabled={!n} onClick={() => onChange(EMPTY_FILTER)}>Zurücksetzen</button>
          </div>
          <div className="mk-filter-body">
            {pool && <label>Name<input className="ed-in mk-filter-in" value={f.name} placeholder="Suchen" onChange={(e) => set({ name: e.target.value })} /></label>}
            {pool && <label>Position<Seg size="s" value={f.grp} onChange={(v) => set({ grp: v })}
              options={[{ v: '', label: 'Alle' }, { v: 'GK', label: 'TW' }, { v: 'DEF', label: 'ABW' }, { v: 'MID', label: 'MF' }, { v: 'ATT', label: 'ANG' }]} /></label>}
            <label>Alter<span className="mk-filter-pair">
              <Select size="s" width={78} value={f.ageMin} onChange={(v) => set({ ageMin: Number(v) })} options={AGES} />
              <span>bis</span>
              <Select size="s" width={78} value={f.ageMax} onChange={(v) => set({ ageMax: Number(v) })} options={AGES} />
            </span></label>
            <label>Stärke ab<Select size="s" width={110} value={f.ovMin} onChange={(v) => set({ ovMin: Number(v) })}
              options={[0, 50, 55, 60, 65, 70, 75, 80, 85, 90].map((x) => ({ value: x, label: x ? String(x) : 'egal' }))} /></label>
            <label>Potenzial ab<Select size="s" width={110} value={f.stMin} onChange={(v) => set({ stMin: Number(v) })}
              options={[0, 2, 2.5, 3, 3.5, 4, 4.5].map((x) => ({ value: x, label: x ? `${String(x).replace('.', ',')} Sterne` : 'egal' }))} /></label>
            {valueSteps.length > 0 && <label>Transferwert bis<Select size="s" width={170} value={f.valueMax} onChange={(v) => set({ valueMax: Number(v) })}
              options={[{ value: 0, label: 'egal' }, ...valueSteps.map((x) => ({ value: x, label: fmtPrice(x) }))]} /></label>}
            {pool
              ? <>
                <label>Land<Select size="s" width={200} value={f.country} onChange={(v) => set({ country: v })}
                  options={[{ value: '', label: 'Alle Länder' }, { value: 'Deutschland', label: 'Deutschland' }, { value: 'foreign', label: 'Ausland' }, ...countries.map((c) => ({ value: c, label: countryName(c) }))]} /></label>
                <label>Liga<Seg size="s" value={f.level} onChange={(v) => set({ level: v })}
                  options={[{ v: 0, label: 'Alle' }, { v: 1, label: '1.' }, { v: 2, label: '2.' }, { v: 3, label: 'tiefer' }]} /></label>
              </>
              : <label>Herkunft<Seg size="s" value={f.origin} onChange={(v) => set({ origin: v })}
                options={[{ v: '', label: 'Alle' }, { v: 'home', label: 'Einheimisch' }, { v: 'foreign', label: 'Ausländer' }]} /></label>}
            <label>Kenntnisse<Seg size="s" value={f.know} onChange={(v) => set({ know: v })}
              options={[{ v: 0, label: 'Alle' }, { v: 1, label: 'ab vage' }, { v: 2, label: 'ab bekannt' }]} /></label>
            {!pool && <label>Vertrag<Seg size="s" value={f.contract} onChange={(v) => set({ contract: v })}
              options={[{ v: '', label: 'Alle' }, { v: 'soon', label: 'endet in 12 Monaten' }]} /></label>}
            {!pool && <label className="mk-filter-check"><span>Nur Transferliste</span>
              <button type="button" className={`toggle ${f.listed ? 'on' : ''}`} aria-pressed={f.listed} aria-label="Nur Transferliste" onClick={() => set({ listed: !f.listed })} /></label>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
