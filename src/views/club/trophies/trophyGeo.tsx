// =============================================================================
// Bausteine der gezeichneten Trophäen: Drehkörper aus einem Profil, Ringe,
// Henkel, Sockel und die gemeinsamen Metall-Verläufe (Farben nur über Tokens
// --metal-* / --gilt-* / --plinth-* aus styles/00-base.css).
// =============================================================================
import type { CSSProperties } from 'react';

export const CX = 200;
/** Profilpunkt: [Radius, y]. Gleicher Punkt doppelt = Kante statt Rundung. */
export type P = [number, number];

const sc = (c: string): CSSProperties => ({ stopColor: `var(--${c})` });

/** Glatter Linienzug (Catmull-Rom → kubische Bézierkurven) durch die Punkte. */
function smooth(pts: [number, number][]): string {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Umriss eines Drehkörpers: rechte Seite von oben nach unten, linke gespiegelt zurück. */
export function lathe(profile: P[], cx = CX): string {
  const right = profile.map(([r, y]) => [cx + r, y] as [number, number]);
  const left = [...profile].reverse().map(([r, y]) => [cx - r, y] as [number, number]);
  return `M ${right[0][0]} ${right[0][1]}${smooth(right)} L ${left[0][0]} ${left[0][1]}${smooth(left)} Z`;
}

/** Vorderer Halbring (Unterkante einer Ellipse) – für Wülste, Kanten und Bänder. */
export function arc(r: number, y: number, k = 0.16, cx = CX): string {
  return `M ${cx - r} ${y} A ${r} ${r * k} 0 0 0 ${cx + r} ${y}`;
}

export type Metal = 'sv' | 'gd';

/** Gemeinsame Verläufe; `id` macht sie je Zeichnung eindeutig. */
export function MetalDefs({ id }: { id: string }) {
  return (
    <defs>
      {/* Zylinder-Schattierung von links nach rechts (Licht von links oben) */}
      <linearGradient id={`${id}-sv`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={sc('metal-4')} />
        <stop offset="0.12" style={sc('metal-2')} />
        <stop offset="0.27" style={sc('metal-hi')} />
        <stop offset="0.38" style={sc('metal-1')} />
        <stop offset="0.62" style={sc('metal-3')} />
        <stop offset="0.84" style={sc('metal-2')} />
        <stop offset="1" style={sc('metal-4')} />
      </linearGradient>
      <linearGradient id={`${id}-gd`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={sc('gilt-3')} />
        <stop offset="0.14" style={sc('gilt-2')} />
        <stop offset="0.28" style={sc('gilt-hi')} />
        <stop offset="0.4" style={sc('gilt-1')} />
        <stop offset="0.64" style={sc('gilt-2')} />
        <stop offset="0.86" style={sc('gilt-1')} />
        <stop offset="1" style={sc('gilt-3')} />
      </linearGradient>
      {/* Tiefe: oben klar, unten etwas dunkler (über den Körper gelegt) */}
      <linearGradient id={`${id}-shade`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.10" />
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </linearGradient>
      {/* Innenseite einer Schale */}
      <radialGradient id={`${id}-in`} cx="0.5" cy="0.25" r="0.8">
        <stop offset="0" style={sc('metal-4')} />
        <stop offset="0.7" style={sc('metal-3')} />
        <stop offset="1" style={sc('metal-2')} />
      </radialGradient>
      <radialGradient id={`${id}-in-gd`} cx="0.5" cy="0.25" r="0.8">
        <stop offset="0" style={sc('gilt-3')} />
        <stop offset="1" style={sc('gilt-1')} />
      </radialGradient>
      {/* Platten von vorn (Schale, Teller, Medaille) */}
      <linearGradient id={`${id}-plate`} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" style={sc('metal-hi')} />
        <stop offset="0.35" style={sc('metal-1')} />
        <stop offset="0.6" style={sc('metal-2')} />
        <stop offset="0.82" style={sc('metal-1')} />
        <stop offset="1" style={sc('metal-3')} />
      </linearGradient>
      <linearGradient id={`${id}-plate2`} x1="0.9" y1="0" x2="0.1" y2="1">
        <stop offset="0" style={sc('metal-1')} />
        <stop offset="0.5" style={sc('metal-3')} />
        <stop offset="1" style={sc('metal-2')} />
      </linearGradient>
      <radialGradient id={`${id}-gem`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" style={sc('metal-2')} />
        <stop offset="0.35" style={sc('plinth-1')} />
        <stop offset="1" style={sc('plinth-2')} />
      </radialGradient>
      {/* Sockel aus dunklem Stein */}
      <linearGradient id={`${id}-stone`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={sc('plinth-2')} />
        <stop offset="0.3" style={sc('plinth-1')} />
        <stop offset="0.55" style={sc('plinth-2')} />
        <stop offset="1" style={sc('plinth-2')} />
      </linearGradient>
      <radialGradient id={`${id}-floor`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.55" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Drehkörper mit Metall, Tiefenschatten und Kontur. */
export function Body({ id, d, metal = 'sv' }: { id: string; d: string; metal?: Metal }) {
  return (
    <g>
      <path d={d} fill={`url(#${id}-${metal})`} />
      <path d={d} fill={`url(#${id}-shade)`} />
      <path d={d} fill="none" style={{ stroke: `var(--${metal === 'gd' ? 'gilt-3' : 'metal-4'})` }} strokeWidth="1.2" strokeOpacity="0.7" />
    </g>
  );
}

/** Wulst/Kante: dunkle Linie mit heller Kante darunter. */
export function Ring({ r, y, k = 0.16, metal = 'sv' }: { r: number; y: number; k?: number; metal?: Metal }) {
  const hi = metal === 'gd' ? 'gilt-hi' : 'metal-hi';
  const lo = metal === 'gd' ? 'gilt-3' : 'metal-4';
  return (
    <g fill="none">
      <path d={arc(r, y, k)} style={{ stroke: `var(--${lo})` }} strokeWidth="1.6" strokeOpacity="0.8" />
      <path d={arc(r - 1, y + 2, k)} style={{ stroke: `var(--${hi})` }} strokeWidth="1" strokeOpacity="0.55" />
    </g>
  );
}

/** Offene Oberseite eines Gefäßes. */
export function Rim({ id, r, y, k = 0.16, metal = 'sv' }: { id: string; r: number; y: number; k?: number; metal?: Metal }) {
  const ry = r * k;
  return (
    <g>
      <ellipse cx={CX} cy={y} rx={r} ry={ry} fill={`url(#${id}-${metal === 'gd' ? 'in-gd' : 'in'})`} />
      <ellipse cx={CX} cy={y} rx={r} ry={ry} fill="none" style={{ stroke: `var(--${metal === 'gd' ? 'gilt-hi' : 'metal-hi'})` }} strokeWidth="3" />
      <ellipse cx={CX} cy={y} rx={r - 3} ry={ry - 2} fill="none" style={{ stroke: `var(--${metal === 'gd' ? 'gilt-3' : 'metal-3'})` }} strokeWidth="1.2" />
    </g>
  );
}

/** Henkel als Rohr (rechts; links gespiegelt). */
export function Handles({ id, d, w = 14, metal = 'sv' }: { id: string; d: string; w?: number; metal?: Metal }) {
  const lo = metal === 'gd' ? 'gilt-3' : 'metal-4';
  const mid = metal === 'gd' ? 'gilt-1' : 'metal-2';
  const hi = metal === 'gd' ? 'gilt-hi' : 'metal-hi';
  const one = (t?: string) => (
    <g transform={t}>
      <path d={d} fill="none" style={{ stroke: `var(--${lo})` }} strokeWidth={w + 3} strokeLinecap="round" />
      <path d={d} fill="none" style={{ stroke: `var(--${mid})` }} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" style={{ stroke: `var(--${hi})` }} strokeWidth={w * 0.28} strokeLinecap="round" strokeOpacity="0.85" transform="translate(-2,-2)" />
    </g>
  );
  return <g data-id={id}>{one()}{one(`translate(${2 * CX},0) scale(-1,1)`)}</g>;
}

/** Runder Steinsockel (Zylinder) mit Deckfläche. */
export function Plinth({ id, r, y, h }: { id: string; r: number; y: number; h: number }) {
  const ry = r * 0.14;
  return (
    <g>
      <path d={`M ${CX - r} ${y} L ${CX - r} ${y + h} A ${r} ${ry} 0 0 0 ${CX + r} ${y + h} L ${CX + r} ${y} Z`} fill={`url(#${id}-stone)`} />
      <ellipse cx={CX} cy={y} rx={r} ry={ry} style={{ fill: 'var(--plinth-1)', stroke: 'var(--metal-3)' }} strokeOpacity="0.35" />
      <path d={arc(r - 6, y + h - 8, 0.14)} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeOpacity="0.4" />
    </g>
  );
}

export function Floor({ id, rx = 140, y = 432 }: { id: string; rx?: number; y?: number }) {
  return <ellipse cx={CX} cy={y} rx={rx} ry={14} fill={`url(#${id}-floor)`} />;
}

/** Weicher Lichtreflex. */
export function Glint({ x, y, rx, ry, rot = 0, o = 0.35 }: { x: number; y: number; rx: number; ry: number; rot?: number; o?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity={o} transform={`rotate(${rot} ${x} ${y})`} style={{ filter: 'blur(3px)' }} />;
}
