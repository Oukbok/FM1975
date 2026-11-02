// =============================================================================
// Kabinen-Pyramide: oben die Führungsspieler, darunter Stützen, Mitläufer und
// unten die Spieler, die außen vor sind. Innerhalb einer Stufe nach Einfluss
// (links der größte). Symbol = Moral (Smiley aus components/status), K/R =
// Kapitän/Mannschaftsrat, kleine Ziffer = Gruppe (Legende darunter; Zeigen
// auf eine Gruppe hebt ihre Mitglieder hervor), gestrichelte Linie = Konflikt.
// =============================================================================
import { useLayoutEffect, useRef, useState } from 'react';
import { DRAnalysis, DRConflict, DRTier } from '../../../engine/dressingRoom';
import { Player } from '../../../types';
import { fmtDay } from '../../../ui/format';
import { MoraleIcon } from '../../../components/status';

/** Stufen von oben nach unten mit Breite in % (Pyramide). */
const TIERS: { t: DRTier; label: string; w: number }[] = [
  { t: 'fuehrung', label: 'Führung', w: 46 },
  { t: 'stuetze', label: 'Stützen', w: 66 },
  { t: 'mitlaeufer', label: 'Mitläufer', w: 84 },
  { t: 'aussen', label: 'Außen vor', w: 100 },
];
const TIP = 0.6; // Breite der Spitze im Verhältnis zur obersten Stufe

interface Line { x1: number; y1: number; x2: number; y2: number; key: string }

export function RoomPyramid({ a, players, conflicts, captainId, council, selected, onSelect }: {
  a: DRAnalysis; players: Record<string, Player>; conflicts: DRConflict[]; captainId?: string; council: string[];
  selected?: string; onSelect: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [hl, setHl] = useState<string | null>(null);
  // Gruppen-Ziffern (ohne Führungskreis – der ist die oberste Stufe).
  const marked = a.groups.filter((gr) => gr.id !== 'fuehrung');
  const num = new Map<string, number>();
  marked.forEach((gr, i) => gr.members.forEach((id) => num.set(id, i + 1)));
  const hlSet = hl ? new Set(a.groups.find((gr) => gr.id === hl)?.members ?? []) : null;
  const conflictIds = new Set(conflicts.flatMap((c) => [c.a, c.b]));

  // Konfliktlinien: Lage der Knoten nach dem Layout messen (UI-Skalierung herausrechnen).
  const sig = conflicts.map((c) => c.a + c.b).join() + a.players.map((o) => o.id + o.tier).join();
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const s = r.width / Math.max(1, el.offsetWidth) || 1;
      const at = (id: string) => {
        const n = el.querySelector<HTMLElement>(`[data-pid="${id}"]`);
        if (!n) return null;
        const q = n.getBoundingClientRect();
        return { x: (q.left + q.width / 2 - r.left) / s, y: (q.top + q.height / 2 - r.top) / s };
      };
      setLines(conflicts.map((c, i) => {
        const p = at(c.a), q = at(c.b);
        return p && q ? { x1: p.x, y1: p.y, x2: q.x, y2: q.y, key: `${i}` } : null;
      }).filter((x): x is Line => !!x));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [sig]);

  return (
    <div className="kp-wrap">
      <div className="kp-pyr" ref={box}>
        {TIERS.map((tier, i) => {
          const ids = a.players.filter((o) => o.tier === tier.t).sort((x, y) => y.influence - x.influence);
          const prev = i ? TIERS[i - 1].w : TIERS[0].w * TIP;
          const inset = ((tier.w - prev) / 2 / tier.w) * 100;
          return (
            <div key={tier.t} className={`kp-band kp-${tier.t}`} style={{ width: `${tier.w}%` }}>
              <div className="kp-bg" style={{ clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)` }} />
              <div className="kp-band-lbl">{tier.label}<span>{ids.length}</span></div>
              <div className="kp-nodes" style={{ paddingLeft: `${inset * 0.8}%`, paddingRight: `${inset * 0.8}%` }}>
                {ids.length ? ids.map((o) => {
                  const p = players[o.id];
                  if (!p) return null;
                  const cap = o.id === captainId;
                  const rat = !cap && council.includes(o.id);
                  const n = num.get(o.id);
                  const cls = ['kb-node', 'kp-node', o.id === selected ? 'sel' : '', o.outsider ? 'out' : '', hlSet && !hlSet.has(o.id) ? 'dim' : '', conflictIds.has(o.id) ? 'conf' : ''].filter(Boolean).join(' ');
                  return (
                    <div key={o.id} data-pid={o.id} className={cls} role="button" tabIndex={0} aria-label={`${p.fullName}, Einfluss ${o.influence}`}
                      onClick={() => onSelect(o.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(o.id); } }}>
                      <MoraleIcon value={p.moraleScore ?? 60} size={19} />
                      <span className="kp-name">{p.lastName}</span>
                      {(cap || rat) && <span className="kp-tag">{cap ? 'K' : 'R'}</span>}
                      {n != null && <span className="kp-grp">{n}</span>}
                    </div>
                  );
                }) : <span className="kp-empty">{tier.t === 'aussen' ? 'niemand' : '–'}</span>}
              </div>
            </div>
          );
        })}
        <svg className="kp-lines" aria-hidden="true">
          {lines.map((l) => <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
        </svg>
      </div>
      <div className="kp-legend">
        {marked.map((gr, i) => (
          <div key={gr.id} className={`kp-leg ${hl === gr.id ? 'on' : ''}`} onMouseEnter={() => setHl(gr.id)} onMouseLeave={() => setHl(null)}
            onClick={() => setHl(hl === gr.id ? null : gr.id)} title={gr.why}>
            <span className="kp-grp">{i + 1}</span>
            <span className="kp-leg-lbl">{gr.label}</span>
            <span className="kp-leg-mem">{gr.members.map((id) => players[id]?.lastName ?? '–').join(', ')}</span>
          </div>
        ))}
        {conflicts.map((c, i) => (
          <div key={`c${i}`} className="kp-leg kp-leg-conf">
            <span className="kp-conf-mark" />
            <span className="kp-leg-lbl">Konflikt</span>
            <span className="kp-leg-mem">{players[c.a]?.lastName ?? '–'} – {players[c.b]?.lastName ?? '–'} ({c.reason}, seit {fmtDay(c.since)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
