// Reiter „Attribute“: Positionswahl (alle Positionen, die der Spieler beherrscht) →
// positionsbezogenes Profil-Netz + alle Werte; Schlüsselattribute der gewählten Position
// hervorgehoben (Bernstein), für die Position unwichtige Werte gedimmt.
// Gewichtung direkt aus der Engine (engine/positions.ts `weightsFor`, epochenabhängig).
import { useState } from 'react';
import { Player, Position } from '../../types';
import { POSITION_NAMES_DE } from '../../engine/positions';
import {
  ATTR_DE, ATTR_SHORT, AttrKey, AttrTier, groupsFor, sortedKeys, groupAvg, attrTiers,
  positionChoices, POS_KIND_DE, Section, Bar,
} from './shared';

/** Netz über die (bis zu 8) wichtigsten Attribute der Position; Skala 20–100. */
function Radar({ p, keys, tiers }: { p: Player; keys: AttrKey[]; tiers: Map<AttrKey, AttrTier> }) {
  const n = keys.length;
  const R = 88, CX = 200, CY = 136;
  const scale = (v: number) => (R * Math.max(0, Math.min(80, v - 20))) / 80;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  };
  const poly = (r: (i: number) => number) => keys.map((_, i) => pt(i, r(i)).join(',')).join(' ');
  return (
    <svg viewBox="0 0 400 272" className="pp-radar">
      {[40, 60, 80, 100].map((v) => <polygon key={v} points={poly(() => scale(v))} fill="none" stroke="var(--border)" strokeWidth="1" />)}
      {keys.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--border-soft)" strokeWidth="1" />; })}
      <polygon points={poly((i) => scale(p.attributes[keys[i]]))} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
      {keys.map((k, i) => { const [x, y] = pt(i, scale(p.attributes[k])); return <circle key={k} cx={x} cy={y} r="2.6" fill="var(--accent)" />; })}
      {keys.map((k, i) => {
        const [x, y] = pt(i, R + 14);
        const anchor = Math.abs(x - CX) < 8 ? 'middle' : x > CX ? 'start' : 'end';
        return (
          <text key={k} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className={`pp-radar-lbl${tiers.get(k) === 'core' ? ' core' : ''}`}>
            {ATTR_SHORT[k] ?? ATTR_DE[k]} <tspan className="pp-radar-val">{Math.round(p.attributes[k])}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

export default function AttributesTab({ p }: { p: Player }) {
  const choices = positionChoices(p);
  const [pos, setPos] = useState<Position>(p.naturalPosition);
  const sel = choices.find((c) => c.pos === pos) ?? choices[0];
  const tiers = attrTiers(sel.pos);
  const radarKeys = [...tiers.keys()].slice(0, 8);
  return (
    <div className="pp-grid pp-grid-attr">
      <div className="pp-stack">
        <Section title="Position">
          <div className="pp-posbar" role="tablist">
            {choices.map((c) => (
              <button key={c.pos} role="tab" aria-selected={c.pos === sel.pos}
                className={`pp-posbtn${c.pos === sel.pos ? ' on' : ''}`} onClick={() => setPos(c.pos)}
                title={`${POSITION_NAMES_DE[c.pos]} – Eignung ${c.value}`}>
                <span className="pp-posbtn-code">{c.pos}</span>
                <span className="pp-posbtn-val">{c.value}</span>
                <span className="pp-posbtn-kind">{POS_KIND_DE[c.kind]}</span>
              </button>
            ))}
          </div>
          <div className="pp-pos-head">
            <span className="pp-pos-name">{POSITION_NAMES_DE[sel.pos]}</span>
            <span className="pp-pos-suit">Eignung <b>{sel.value}</b></span>
          </div>
          <Radar p={p} keys={radarKeys} tiers={tiers} />
          <div className="pp-legend">
            <span><i className="pp-lg-core" />Schlüsselattribut</span>
            <span><i className="pp-lg-use" />wichtig</span>
            <span><i className="pp-lg-dim" />ohne Einfluss</span>
          </div>
        </Section>
      </div>
      <div className="pp-attr-cols">
        {groupsFor(p, sel.pos).map((grp) => (
          <Section key={grp.title} title={grp.title} right={`Ø ${groupAvg(p, grp.keys)}`}>
            {sortedKeys(grp.keys).map((k) => (
              <Bar key={k} label={ATTR_DE[k]} value={Math.round(p.attributes[k])} tier={tiers.get(k) ?? 'dim'} />
            ))}
          </Section>
        ))}
      </div>
    </div>
  );
}
