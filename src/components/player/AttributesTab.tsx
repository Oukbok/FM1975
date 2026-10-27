// Reiter „Attribute“: Profil-Netz (Kategorie-Durchschnitte) + alle Werte mit Balken
import { Player } from '../../types';
import Icon from '../Icon';
import { ATTR_DE, groupsFor, sortedKeys, groupAvg, keyAttributes, Section, Bar } from './shared';

function Radar({ p }: { p: Player }) {
  const groups = groupsFor(p);
  const n = groups.length;
  const R = 100, C = 130;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r];
  };
  const poly = (r: (i: number) => number) => groups.map((_, i) => pt(i, r(i)).join(',')).join(' ');
  return (
    <svg viewBox="0 0 260 260" className="pp-radar">
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poly(() => R * f)} fill="none" stroke="var(--border)" strokeWidth="1" />)}
      {groups.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />; })}
      <polygon points={poly((i) => (R * groupAvg(p, groups[i].keys)) / 100)} fill="rgba(0,217,255,0.22)" stroke="var(--accent)" strokeWidth="2" />
      {groups.map((g, i) => {
        const [x, y] = pt(i, R + 18);
        return (
          <text key={g.title} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="pp-radar-lbl">
            {g.short} <tspan className="pp-radar-val">{groupAvg(p, g.keys)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

export default function AttributesTab({ p }: { p: Player }) {
  const key = new Set(keyAttributes(p.naturalPosition).slice(0, 8));
  return (
    <div className="pp-grid pp-grid-attr">
      <Section title="Profil" icon={<Icon name="stats" size={15} />}>
        <Radar p={p} />
        <div className="pp-note">Hervorgehoben: die wichtigsten Werte für seine Position.</div>
      </Section>
      <div className="pp-attr-cols">
        {groupsFor(p).map((grp) => (
          <Section key={grp.title} title={grp.title} right={`Ø ${groupAvg(p, grp.keys)}`}>
            {sortedKeys(grp.keys).map((k) => (
              <div key={k} className={key.has(k) ? 'pp-key' : ''}>
                <Bar label={ATTR_DE[k]} value={Math.round(p.attributes[k])} />
              </div>
            ))}
          </Section>
        ))}
      </div>
    </div>
  );
}
