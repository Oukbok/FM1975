// =============================================================================
// Stadion-Draufsicht des Kartenverkaufs: acht Tribünen um das Spielfeld
// (Haupttribüne unten, Gegentribüne oben, Hinter dem Tor 1/2 links/rechts, vier
// Ecken). Tiefe je Tribüne nach Plätzen; Hover zeigt Kapazität und Bauzustand,
// Klick wählt die Tribüne (hebt die Zeile in der Preistabelle hervor).
// Eigene, schlichte Zeichnung – unabhängig von der Stadion-Szene (stadium/geo.tsx).
// =============================================================================
import { useState } from 'react';
import { STANDS } from '../../../data/seatingCatalog';
import type { Club, StandId } from '../../../types';
import { n0 } from './ticketFmt';

const fmtD = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
// Spielfeld (Querformat) im viewBox 0 0 320 214
const P = { x0: 100, x1: 220, y0: 70, y1: 144 };
const GAP = 4;

export function StandMap({ club, people, sel, onSel }: { club: Club; people: Record<StandId, number>; sel: StandId | null; onSel: (s: StandId | null) => void }) {
  const [hover, setHover] = useState<{ id: StandId; x: number; y: number } | null>(null);
  const max = Math.max(1, ...Object.values(people));
  const depth = (id: StandId) => (people[id] > 0 ? 9 + 34 * Math.sqrt(people[id] / max) : 6);
  const bp = club.stadium.blockProject;
  const building = new Set([bp?.blockId, ...(bp?.more ?? []).map((b) => b.id)].filter(Boolean));
  const buildOf = (id: StandId) => STANDS.find((s) => s.id === id)!.blocks.some((b) => building.has(b));
  const { x0, x1, y0, y1 } = P;
  const shapes: Record<StandId, string> = (() => {
    const d = depth;
    const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
    // Ecke = Ringstück um die Spielfeldecke: innen bündig mit den Geraden (Abstand GAP), außen nach Plätzen,
    // je Seite 5° Luft zu den Nachbartribünen – so laufen Geraden und Ecken als ein Oval um das Feld.
    const wedge = (cx: number, cy: number, ro: number, a0: number, a1: number) => {
      const ri = GAP, k = Math.PI / 180, b0 = (a0 + 5) * k, b1 = (a1 - 5) * k;
      const pt = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
      return `M${pt(ri, b0)}L${pt(ro, b0)}A${ro} ${ro} 0 0 1 ${pt(ro, b1)}L${pt(ri, b1)}A${ri} ${ri} 0 0 0 ${pt(ri, b0)}Z`;
    };
    // Außenradius = mittlere Tiefe der Nachbartribünen, damit der Bogen an deren Außenkante anschließt (leere Ecke: schmal).
    const cornerR = (id: StandId, a: StandId, b: StandId) => GAP + (people[id] > 0 ? (d(a) + d(b)) / 2 : d(id));
    return {
      haupt: rect(x0, y1 + GAP, x1 - x0, d('haupt')),
      gegen: rect(x0, y0 - GAP - d('gegen'), x1 - x0, d('gegen')),
      tor1: rect(x0 - GAP - d('tor1'), y0, d('tor1'), y1 - y0),
      tor2: rect(x1 + GAP, y0, d('tor2'), y1 - y0),
      ecke1: wedge(x0, y1, cornerR('ecke1', 'tor1', 'haupt'), 90, 180),
      ecke2: wedge(x0, y0, cornerR('ecke2', 'tor1', 'gegen'), 180, 270),
      ecke3: wedge(x1, y0, cornerR('ecke3', 'gegen', 'tor2'), 270, 360),
      ecke4: wedge(x1, y1, cornerR('ecke4', 'tor2', 'haupt'), 0, 90),
    };
  })();
  // Mauslage im Kartenrahmen (die Oberfläche ist per CSS skaliert: Bildschirm- in Layout-Pixel umrechnen)
  const local = (e: { clientX: number; clientY: number; currentTarget: Element }) => {
    const box = e.currentTarget.closest('.tk-map') as HTMLElement;
    const r = box.getBoundingClientRect();
    const f = r.width ? box.offsetWidth / r.width : 1;
    return { x: (e.clientX - r.left) * f, y: (e.clientY - r.top) * f };
  };
  const label = (id: StandId) => STANDS.find((s) => s.id === id)!;
  const h = hover ? label(hover.id) : null;
  return (
    <div className="tk-map" onMouseLeave={() => setHover(null)}>
      <svg viewBox="0 0 320 214" role="img" aria-label="Stadion von oben">
        <defs>
          <pattern id="tk-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" className="tk-hatch-bg" /><line x1="0" y1="0" x2="0" y2="5" className="tk-hatch-ln" />
          </pattern>
        </defs>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="2" className="tk-turf" />
        {/* Bild-Slot: Rasentextur von oben (bilder/tickets/rasen.jpg); fehlt sie, bleibt die Fläche. */}
        <image href="assets/tickets/rasen.jpg" x={x0} y={y0} width={x1 - x0} height={y1 - y0} preserveAspectRatio="xMidYMid slice" className="tk-turf-img" />
        <g className="tk-lines">
          <rect x={x0 + 4} y={y0 + 4} width={x1 - x0 - 8} height={y1 - y0 - 8} />
          <line x1={(x0 + x1) / 2} y1={y0 + 4} x2={(x0 + x1) / 2} y2={y1 - 4} />
          <circle cx={(x0 + x1) / 2} cy={(y0 + y1) / 2} r="9" />
          <rect x={x0 + 4} y={(y0 + y1) / 2 - 17} width="16" height="34" />
          <rect x={x1 - 20} y={(y0 + y1) / 2 - 17} width="16" height="34" />
        </g>
        {STANDS.map((s) => {
          const empty = people[s.id] <= 0;
          return (
            <path key={s.id} d={shapes[s.id]}
              className={`tk-stand ${sel === s.id ? 'on' : ''} ${hover?.id === s.id ? 'hov' : ''} ${empty ? 'empty' : ''}`}
              fill={buildOf(s.id) ? 'url(#tk-hatch)' : undefined}
              onMouseMove={(e) => setHover({ id: s.id, ...local(e) })}
              onClick={() => onSel(sel === s.id ? null : s.id)} />
          );
        })}
      </svg>
      {hover && h && (
        <div className="tk-tip" style={{ left: hover.x, top: hover.y }}>
          <b>{h.name}</b> <span>{h.sub}</span>
          <div>Kapazität {n0(people[hover.id])} – {buildOf(hover.id) && bp ? `im Umbau bis ${fmtD(bp.finishDate)}` : people[hover.id] > 0 ? 'fertiggestellt' : 'noch nicht ausgebaut'}</div>
        </div>
      )}
    </div>
  );
}
