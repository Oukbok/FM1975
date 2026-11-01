// =============================================================================
// Kabinen-Kreis: innen die Führungsspieler, außen die Außenseiter; die
// Sektoren sind die Gruppen der Kabine. Punktgröße = Einfluss, Füllung =
// Moral (condBar), gestrichelte Linien = Konflikte, „K“ = Kapitän.
// =============================================================================
import { DRAnalysis, DRConflict, DRTier } from '../../../engine/dressingRoom';
import { Player } from '../../../types';
import { condBar } from '../../../ui/format';

const C = 300;
/** Mittellinie je Ring (Knoten) und Außengrenze des Rings. */
const RING: Record<DRTier, number> = { fuehrung: 48, stuetze: 132, mitlaeufer: 205, aussen: 266 };
const EDGE: Record<DRTier, number> = { fuehrung: 92, stuetze: 170, mitlaeufer: 238, aussen: 292 };
const RING_LABEL: [DRTier, string][] = [['fuehrung', 'Führung'], ['stuetze', 'Stützen'], ['mitlaeufer', 'Mitläufer'], ['aussen', 'Außen vor']];

const pt = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

export function RoomCircle({ a, players, conflicts, captainId, council, selected, onSelect }: {
  a: DRAnalysis; players: Record<string, Player>; conflicts: DRConflict[]; captainId?: string; council: string[];
  selected?: string; onSelect: (id: string) => void;
}) {
  // Sektoren: Führungskreis bekommt keinen Sektor (Mitte), alle anderen nach Größe.
  const outer = a.groups.filter((g) => g.id !== 'fuehrung');
  const total = outer.reduce((s, g) => s + Math.max(2, g.members.length), 0) || 1;
  const pos: Record<string, { x: number; y: number; r: number }> = {};
  const sectors: { label: string; from: number; to: number; n: number }[] = [];
  let at = 0;
  for (const g of outer) {
    const span = (360 * Math.max(2, g.members.length)) / total;
    sectors.push({ label: g.label, from: at, to: at + span, n: g.members.length });
    const byTier = new Map<DRTier, string[]>();
    for (const id of g.members) { const t = a.byId[id].tier; byTier.set(t, [...(byTier.get(t) ?? []), id]); }
    for (const [tier, ids] of byTier) {
      ids.sort((x, y) => a.byId[y].influence - a.byId[x].influence);
      ids.forEach((id, i) => {
        const deg = at + (span * (i + 0.5)) / ids.length;
        const stagger = ids.length > 3 && tier !== 'fuehrung' ? (i % 2 ? 12 : -12) : 0;
        pos[id] = { ...pt(deg, RING[tier] + stagger), r: 5 + a.byId[id].influence / 14 };
      });
    }
    at += span;
  }
  const lead = a.groups.find((g) => g.id === 'fuehrung')?.members ?? [];
  lead.forEach((id, i) => {
    const deg = (360 * i) / Math.max(1, lead.length) + 30;
    pos[id] = { ...(lead.length === 1 ? { x: C, y: C + 6 } : pt(deg, RING.fuehrung)), r: 5 + a.byId[id].influence / 14 };
  });

  return (
    <svg className="kb-circle" viewBox="-165 -24 930 648" role="img" aria-label="Kabinen-Kreis">
      {RING_LABEL.map(([t, l]) => (
        <g key={t}>
          <circle cx={C} cy={C} r={EDGE[t]} className={t === 'aussen' ? 'kb-ring kb-ring-out' : 'kb-ring'} />
          <text x={C} y={C - EDGE[t] + 15} className="kb-ring-lbl" textAnchor="middle">{l}</text>
        </g>
      ))}
      {sectors.length > 1 && sectors.map((s) => {
        const p1 = pt(s.from, EDGE.fuehrung), p2 = pt(s.from, EDGE.aussen);
        return <line key={s.label} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="kb-sector" />;
      })}
      {sectors.map((s) => {
        const mid = (s.from + s.to) / 2;
        const p = pt(mid, EDGE.aussen + 16);
        const side = Math.sin(((mid - 90) * Math.PI) / 180 + Math.PI / 2);
        return <text key={s.label} x={p.x} y={p.y + 4} className="kb-sector-lbl" textAnchor={Math.abs(side) < 0.25 ? 'middle' : side > 0 ? 'start' : 'end'}>{s.label} ({s.n})</text>;
      })}
      {conflicts.map((c, i) => {
        const p = pos[c.a], q = pos[c.b];
        return p && q ? <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className="kb-conflict" /> : null;
      })}
      {a.players.map((o) => {
        const p = pos[o.id];
        const pl = players[o.id];
        if (!p || !pl) return null;
        const score = pl.moraleScore ?? 60;
        const cap = o.id === captainId;
        const sel = o.id === selected;
        return (
          <g key={o.id} className="kb-node" onClick={() => onSelect(o.id)}>
            <title>{`${pl.fullName} – Einfluss ${o.influence}, Moral ${Math.round(score)}`}</title>
            {o.outsider && <circle cx={p.x} cy={p.y} r={p.r + 4} className="kb-out" />}
            <circle cx={p.x} cy={p.y} r={p.r} fill={condBar(score)} className={sel ? 'kb-dot sel' : 'kb-dot'} />
            {cap && <text x={p.x} y={p.y + 4} textAnchor="middle" className="kb-cap">K</text>}
            {!cap && council.includes(o.id) && <text x={p.x} y={p.y + 4} textAnchor="middle" className="kb-cap">R</text>}
            <text x={p.x} y={p.y + p.r + 13} textAnchor="middle" className={sel ? 'kb-name sel' : 'kb-name'}>{pl.lastName}</text>
          </g>
        );
      })}
    </svg>
  );
}
