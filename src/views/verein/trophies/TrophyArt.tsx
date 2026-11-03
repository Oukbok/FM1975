// =============================================================================
// Gezeichnete Trophäen (SVG) je Wettbewerb – eigene, freie Formen ohne echte
// Logos oder Schriftzüge: Meisterschale, DDR-Meisterpokal, Silberteller,
// Landespokal, Henkelpokal (Landesmeister/Meisterliga), Pokalsieger-Pokal,
// Konferenz-Pokal, Europa-Pokal, Hallen-Pokal, Jugendpokal, Aufstiegsmedaille.
// Liegt ein Foto in data/trophyImages.ts, zeigt TrophyCabinet das Foto.
// =============================================================================
import { useId } from 'react';
import type { TrophyShape } from '../../../game/trophyCabinet';
import { arc, Body, CX, Floor, Glint, Handles, lathe, MetalDefs, Plinth, Rim, Ring, type P } from './trophyGeo';

type ArtProps = { id: string };

/** Meisterschale: runde Silberplatte mit gravierten Ringen, fünf Medaillons und Mittelbuckel. */
function Schale({ id }: ArtProps) {
  const cy = 205;
  const med = [0, 1, 2, 3, 4].map((k) => { const a = (-90 + k * 72) * Math.PI / 180; return [CX + 127 * Math.cos(a), cy + 127 * Math.sin(a)]; });
  const dots = Array.from({ length: 10 }, (_, k) => { const a = (-72 + k * 36) * Math.PI / 180; return [CX + 155 * Math.cos(a), cy + 155 * Math.sin(a)]; });
  return (
    <g>
      <Floor id={id} rx={120} y={430} />
      <circle cx={CX} cy={cy} r={168} style={{ fill: 'var(--metal-4)' }} />
      <circle cx={CX} cy={cy} r={165} fill={`url(#${id}-plate)`} />
      <circle cx={CX} cy={cy} r={150} fill={`url(#${id}-plate2)`} opacity="0.55" />
      <circle cx={CX} cy={cy} r={150} fill="none" style={{ stroke: 'var(--metal-4)' }} strokeWidth="1.5" />
      {/* Gravur-Ringe (Namen der Meister, als feine Striche angedeutet) */}
      {[106, 113, 120, 127, 134, 141].map((r) => (
        <circle key={r} cx={CX} cy={cy} r={r} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeWidth="2.2" strokeDasharray="1.4 2.6 3 1.8 2 2.4" opacity="0.75" />
      ))}
      <circle cx={CX} cy={cy} r={99} fill="none" style={{ stroke: 'var(--metal-hi)' }} strokeWidth="3" />
      <circle cx={CX} cy={cy} r={96} fill="none" style={{ stroke: 'var(--metal-4)' }} strokeWidth="1.2" />
      <circle cx={CX} cy={cy} r={95} fill={`url(#${id}-plate)`} opacity="0.85" />
      {[70, 78, 86].map((r) => <circle key={r} cx={CX} cy={cy} r={r} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeWidth="1.6" strokeDasharray="2 2.4 1 3" opacity="0.7" />)}
      {med.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={21} style={{ fill: 'var(--metal-4)' }} />
          <circle cx={x} cy={y} r={19} fill={`url(#${id}-plate)`} />
          <circle cx={x} cy={y} r={13} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeWidth="1.4" />
          <circle cx={x} cy={y} r={8} fill={`url(#${id}-gem)`} />
          <circle cx={x - 2.5} cy={y - 2.5} r={2} fill="#fff" opacity="0.6" />
        </g>
      ))}
      {dots.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={4.6} fill={`url(#${id}-gem)`} /><circle cx={x - 1.2} cy={y - 1.2} r={1.1} fill="#fff" opacity="0.6" /></g>)}
      {/* Mittelbuckel */}
      <circle cx={CX} cy={cy} r={52} style={{ fill: 'var(--metal-4)' }} opacity="0.7" />
      <circle cx={CX} cy={cy} r={49} fill={`url(#${id}-sv)`} />
      <circle cx={CX} cy={cy} r={38} fill={`url(#${id}-plate2)`} />
      <circle cx={CX} cy={cy} r={28} fill={`url(#${id}-plate)`} />
      <circle cx={CX} cy={cy} r={28} fill="none" style={{ stroke: 'var(--metal-4)' }} strokeWidth="1.2" />
      <path d={`M ${CX} ${cy - 15} L ${CX + 14} ${cy - 4.5} L ${CX + 8.8} ${cy + 12} L ${CX - 8.8} ${cy + 12} L ${CX - 14} ${cy - 4.5} Z`} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeWidth="2" />
      <Glint x={CX - 70} y={cy - 85} rx={70} ry={16} rot={-38} o={0.28} />
      <Glint x={CX + 90} y={cy + 95} rx={40} ry={8} rot={-38} o={0.12} />
      {/* Sockel mit Schlitz: hält die Schale an der Unterkante */}
      <path d={`M ${CX - 96} 362 L ${CX + 96} 362 L ${CX + 118} 420 L ${CX - 118} 420 Z`} fill={`url(#${id}-stone)`} />
      <path d={`M ${CX - 96} 362 L ${CX + 96} 362`} style={{ stroke: 'var(--metal-3)' }} strokeOpacity="0.55" />
      <rect x={CX - 70} y={358} width={140} height={5} rx={2} style={{ fill: 'var(--plinth-2)' }} />
    </g>
  );
}

/** DDR-Meisterpokal: Deckelpokal mit vergoldeten Bändern. */
function Ddr({ id }: ArtProps) {
  const body: P[] = [[80, 150], [86, 196], [72, 248], [36, 288], [16, 304], [16, 304], [25, 317], [14, 331], [14, 331], [40, 368], [76, 388], [78, 396], [78, 396]];
  const lid: P[] = [[0, 52], [9, 56], [11, 66], [5, 76], [5, 76], [18, 84], [52, 112], [80, 138], [82, 146]];
  return (
    <g>
      <Floor id={id} rx={110} y={424} />
      <Plinth id={id} r={92} y={396} h={22} />
      <Body id={id} d={lathe(body)} />
      <Ring r={84} y={200} /><Ring r={80} y={220} k={0.2} />
      <path d={lathe([[85, 178], [86, 190], [86, 190]])} fill={`url(#${id}-gd)`} opacity="0.95" />
      <Ring r={25} y={317} metal="gd" />
      <Body id={id} d={lathe(lid)} />
      <path d={lathe([[80, 136], [82, 146], [82, 146]])} fill={`url(#${id}-gd)`} />
      <Ring r={52} y={112} /><Ring r={18} y={86} metal="gd" />
      <Glint x={CX - 46} y={230} rx={7} ry={40} o={0.3} />
      <Glint x={CX - 34} y={110} rx={5} ry={18} rot={30} o={0.3} />
    </g>
  );
}

/** Silberteller (Staffelsieg): kleinere Platte mit Lorbeerkranz auf einem Ständer. */
function Teller({ id }: ArtProps) {
  const cy = 215;
  const leaves = Array.from({ length: 28 }, (_, k) => {
    const side = k < 14 ? -1 : 1; const t = (k % 14) / 13;
    const a = (side < 0 ? 100 + t * 150 : 80 - t * 150) * Math.PI / 180;
    return { x: CX + 92 * Math.cos(a), y: cy + 92 * Math.sin(a), rot: (a * 180) / Math.PI + (side < 0 ? 60 : 120) };
  });
  return (
    <g>
      <Floor id={id} rx={110} y={428} />
      <path d={`M ${CX - 30} 300 L ${CX - 70} 418 M ${CX + 30} 300 L ${CX + 70} 418 M ${CX} 320 L ${CX} 412`} style={{ stroke: 'var(--metal-3)' }} strokeWidth="7" strokeLinecap="round" />
      <path d={`M ${CX - 30} 300 L ${CX - 70} 418 M ${CX + 30} 300 L ${CX + 70} 418`} style={{ stroke: 'var(--metal-1)' }} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx={CX} cy={cy} r={142} style={{ fill: 'var(--metal-4)' }} />
      <circle cx={CX} cy={cy} r={139} fill={`url(#${id}-plate)`} />
      <circle cx={CX} cy={cy} r={124} fill="none" style={{ stroke: 'var(--metal-hi)' }} strokeWidth="2.5" />
      <circle cx={CX} cy={cy} r={121} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeWidth="1.2" />
      <circle cx={CX} cy={cy} r={120} fill={`url(#${id}-plate2)`} opacity="0.35" />
      {leaves.map((l, i) => <ellipse key={i} cx={l.x} cy={l.y} rx={10} ry={4} transform={`rotate(${l.rot} ${l.x} ${l.y})`} style={{ fill: 'var(--metal-2)', stroke: 'var(--metal-4)' }} strokeWidth="0.8" />)}
      <circle cx={CX} cy={cy} r={58} fill={`url(#${id}-plate)`} />
      <circle cx={CX} cy={cy} r={58} fill="none" style={{ stroke: 'var(--metal-4)' }} strokeWidth="1.2" />
      {[30, 38, 46].map((r) => <circle key={r} cx={CX} cy={cy} r={r} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeWidth="1.4" strokeDasharray="2 2 1 3" opacity="0.7" />)}
      <Glint x={CX - 62} y={cy - 70} rx={56} ry={12} rot={-40} o={0.3} />
    </g>
  );
}

/** Landespokal: hoher, sich öffnender Pokal ohne Henkel, vergoldetes Band. */
function Pokal({ id }: ArtProps) {
  const body: P[] = [[106, 72], [100, 100], [84, 160], [60, 222], [34, 262], [20, 280], [20, 280], [29, 294], [18, 308], [18, 308], [42, 344], [70, 370], [74, 380], [74, 380]];
  return (
    <g>
      <Floor id={id} rx={118} y={426} />
      <Plinth id={id} r={86} y={380} h={38} />
      <Body id={id} d={lathe(body)} />
      <path d={lathe([[98, 104], [94, 122], [94, 122]])} fill={`url(#${id}-gd)`} />
      {Array.from({ length: 7 }, (_, k) => { const x = CX - 72 + k * 24; return <circle key={k} cx={x} cy={115 + Math.abs(x - CX) * 0.02} r={3.6} fill={`url(#${id}-gem)`} />; })}
      <Ring r={98} y={104} metal="gd" /><Ring r={94} y={122} metal="gd" />
      <Ring r={72} y={190} k={0.18} /><Ring r={29} y={294} metal="gd" /><Ring r={42} y={344} />
      <Rim id={id} r={106} y={72} k={0.15} />
      <Glint x={CX - 52} y={168} rx={7} ry={44} rot={16} o={0.3} />
    </g>
  );
}

/** Henkelpokal (Landesmeister/Meisterliga): bauchiger Körper mit großen Ohren-Henkeln. */
function Henkel({ id }: ArtProps) {
  const body: P[] = [[70, 96], [76, 132], [78, 190], [60, 246], [30, 286], [16, 304], [16, 304], [19, 330], [19, 330], [44, 360], [66, 384], [66, 392], [66, 392]];
  return (
    <g>
      <Floor id={id} rx={130} y={428} />
      <Plinth id={id} r={84} y={392} h={28} />
      <Handles id={id} d={`M ${CX + 64} 108 C ${CX + 190} 40, ${CX + 200} 230, ${CX + 56} 262`} w={17} />
      <Body id={id} d={lathe(body)} />
      <Ring r={77} y={150} k={0.2} /><Ring r={74} y={214} k={0.22} />
      <Ring r={19} y={330} /><Ring r={44} y={360} />
      <Rim id={id} r={70} y={96} k={0.18} />
      <Glint x={CX - 42} y={190} rx={8} ry={52} o={0.32} />
    </g>
  );
}

/** Pokalsieger-Pokal: schlanke Deckelvase mit kleinen geschwungenen Henkeln. */
function Cwc({ id }: ArtProps) {
  const body: P[] = [[48, 122], [56, 152], [58, 222], [40, 272], [18, 300], [12, 318], [12, 318], [20, 330], [12, 342], [12, 342], [40, 380], [56, 394], [56, 394]];
  const lid: P[] = [[0, 34], [8, 38], [10, 50], [4, 60], [4, 60], [14, 70], [36, 96], [50, 114], [52, 122]];
  return (
    <g>
      <Floor id={id} rx={100} y={426} />
      <Plinth id={id} r={70} y={394} h={24} />
      <Handles id={id} d={`M ${CX + 54} 160 C ${CX + 104} 160, ${CX + 102} 214, ${CX + 74} 226 S ${CX + 54} 256, ${CX + 44} 262`} w={10} />
      <Body id={id} d={lathe(body)} />
      <Ring r={57} y={170} k={0.2} /><Ring r={56} y={236} k={0.22} /><Ring r={20} y={330} />
      <Body id={id} d={lathe(lid)} />
      <Ring r={36} y={96} /><Ring r={14} y={70} />
      <Glint x={CX - 30} y={210} rx={5} ry={40} o={0.32} />
    </g>
  );
}

/** Europa-Pokal: Vase mit breitem Bauch, anliegenden Henkeln, hoher Steinsockel. */
function Uefa({ id }: ArtProps) {
  const body: P[] = [[64, 110], [58, 140], [82, 200], [78, 252], [44, 290], [30, 308], [30, 308], [58, 338], [64, 350], [64, 350]];
  return (
    <g>
      <Floor id={id} rx={130} y={428} />
      <path d={`M ${CX - 84} 350 L ${CX + 84} 350 L ${CX + 96} 420 L ${CX - 96} 420 Z`} fill={`url(#${id}-stone)`} />
      <path d={`M ${CX - 84} 350 L ${CX + 84} 350`} style={{ stroke: 'var(--metal-3)' }} strokeOpacity="0.5" />
      <rect x={CX - 40} y={374} width={80} height={22} rx={2} fill="none" style={{ stroke: 'var(--metal-3)' }} strokeOpacity="0.4" />
      <Handles id={id} d={`M ${CX + 60} 122 C ${CX + 128} 128, ${CX + 132} 196, ${CX + 82} 232`} w={12} />
      <Body id={id} d={lathe(body)} />
      <Ring r={60} y={150} k={0.2} /><Ring r={82} y={214} k={0.22} /><Ring r={30} y={308} />
      {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M ${CX - 60 + k * 24} 170 Q ${CX - 64 + k * 25} 222 ${CX - 50 + k * 20} 266`} fill="none" style={{ stroke: 'var(--metal-4)' }} strokeOpacity="0.35" strokeWidth="1.4" />)}
      <Rim id={id} r={64} y={110} k={0.18} />
      <Glint x={CX - 46} y={210} rx={8} ry={42} o={0.3} />
    </g>
  );
}

/** Konferenz-Pokal: moderne, facettierte Säule, die sich nach oben öffnet. */
function Konferenz({ id }: ArtProps) {
  const top = 70, bot = 372, n = 6;
  const facets = Array.from({ length: n }, (_, k) => {
    const t0 = k / n, t1 = (k + 1) / n;
    const x = (t: number, w: number) => CX - w + 2 * w * t;
    return `M ${x(t0, 78)} ${top + Math.sin(t0 * Math.PI) * 14} L ${x(t1, 78)} ${top + Math.sin(t1 * Math.PI) * 14} L ${x(t1 + 0.04, 28)} ${bot} L ${x(t0 + 0.04, 28)} ${bot} Z`;
  });
  return (
    <g>
      <Floor id={id} rx={100} y={426} />
      <Plinth id={id} r={58} y={372} h={46} />
      {facets.map((d, k) => <path key={k} d={d} style={{ fill: `var(--${['metal-3', 'metal-1', 'metal-hi', 'metal-2', 'metal-3', 'metal-4'][k]})`, stroke: 'var(--metal-4)' }} strokeWidth="0.8" />)}
      <path d={facets.join(' ')} fill={`url(#${id}-shade)`} />
      <path d={arc(78, top, 0.18)} fill="none" style={{ stroke: 'var(--metal-hi)' }} strokeWidth="3" />
      <ellipse cx={CX} cy={top} rx={78} ry={14} fill={`url(#${id}-in)`} opacity="0.9" />
      <ellipse cx={CX} cy={top} rx={78} ry={14} fill="none" style={{ stroke: 'var(--metal-hi)' }} strokeWidth="2" />
      <Glint x={CX - 18} y={190} rx={5} ry={70} rot={4} o={0.28} />
    </g>
  );
}

/** Hallen-Pokal: vergoldeter Henkelpokal, gedrungen. */
function Halle({ id }: ArtProps) {
  const body: P[] = [[90, 170], [88, 208], [66, 258], [34, 290], [14, 306], [14, 306], [22, 318], [14, 330], [14, 330], [46, 362], [64, 378], [64, 378]];
  return (
    <g>
      <Floor id={id} rx={118} y={426} />
      <Plinth id={id} r={78} y={378} h={40} />
      <Handles id={id} d={`M ${CX + 86} 186 C ${CX + 158} 176, ${CX + 156} 262, ${CX + 60} 264`} w={13} metal="gd" />
      <Body id={id} d={lathe(body)} metal="gd" />
      <Ring r={88} y={206} k={0.16} metal="gd" /><Ring r={22} y={318} metal="gd" /><Ring r={46} y={362} metal="gd" />
      <Rim id={id} r={90} y={170} k={0.16} metal="gd" />
      <Glint x={CX - 52} y={226} rx={7} ry={32} rot={18} o={0.35} />
    </g>
  );
}

/** Jugendpokal: silberner Henkelpokal auf Block mit Gravurplakette. */
function Jugend({ id }: ArtProps) {
  const body: P[] = [[66, 132], [70, 178], [58, 232], [30, 270], [14, 288], [14, 288], [21, 300], [13, 312], [13, 312], [38, 336], [52, 344], [52, 344]];
  return (
    <g>
      <Floor id={id} rx={112} y={428} />
      <rect x={CX - 78} y={344} width={156} height={76} rx={3} fill={`url(#${id}-stone)`} />
      <rect x={CX - 50} y={366} width={100} height={34} rx={2} fill={`url(#${id}-plate)`} />
      {[376, 384, 392].map((y) => <path key={y} d={`M ${CX - 36} ${y} L ${CX + 36} ${y}`} style={{ stroke: 'var(--metal-3)' }} strokeWidth="1.6" strokeDasharray="3 2 6 2" />)}
      <Handles id={id} d={`M ${CX + 64} 148 C ${CX + 122} 140, ${CX + 120} 222, ${CX + 52} 236`} w={11} />
      <Body id={id} d={lathe(body)} />
      <Ring r={70} y={176} k={0.2} /><Ring r={21} y={300} />
      <Rim id={id} r={66} y={132} k={0.18} />
      <Glint x={CX - 38} y={196} rx={6} ry={32} o={0.3} />
    </g>
  );
}

/** Aufstiegsmedaille: Medaille am Band mit eingeprägtem Pfeil nach oben. */
function Aufstieg({ id }: ArtProps) {
  const cy = 270;
  return (
    <g>
      <Floor id={id} rx={96} y={428} />
      <path d={`M ${CX - 70} 40 L ${CX - 22} 40 L ${CX + 20} 196 L ${CX - 22} 196 Z`} style={{ fill: 'var(--plinth-1)', stroke: 'var(--metal-4)' }} />
      <path d={`M ${CX + 70} 40 L ${CX + 22} 40 L ${CX - 20} 196 L ${CX + 22} 196 Z`} style={{ fill: 'var(--metal-4)', stroke: 'var(--plinth-2)' }} />
      <path d={`M ${CX - 50} 40 L ${CX - 6} 196`} style={{ stroke: 'var(--metal-2)' }} strokeWidth="3" opacity="0.6" />
      <path d={`M ${CX + 50} 40 L ${CX + 6} 196`} style={{ stroke: 'var(--metal-2)' }} strokeWidth="3" opacity="0.6" />
      <rect x={CX - 26} y={188} width={52} height={14} rx={3} fill={`url(#${id}-sv)`} />
      <circle cx={CX} cy={cy} r={98} style={{ fill: 'var(--metal-4)' }} />
      <circle cx={CX} cy={cy} r={95} fill={`url(#${id}-plate)`} />
      <circle cx={CX} cy={cy} r={82} fill="none" style={{ stroke: 'var(--metal-4)' }} strokeWidth="1.4" />
      <circle cx={CX} cy={cy} r={79} fill={`url(#${id}-plate2)`} opacity="0.4" />
      {Array.from({ length: 40 }, (_, k) => { const a = (k * 9) * Math.PI / 180; return <circle key={k} cx={CX + 88 * Math.cos(a)} cy={cy + 88 * Math.sin(a)} r={1.6} style={{ fill: 'var(--metal-3)' }} />; })}
      <path d={`M ${CX} ${cy - 46} L ${CX + 40} ${cy - 4} L ${CX + 18} ${cy - 4} L ${CX + 18} ${cy + 44} L ${CX - 18} ${cy + 44} L ${CX - 18} ${cy - 4} L ${CX - 40} ${cy - 4} Z`} fill={`url(#${id}-sv)`} style={{ stroke: 'var(--metal-4)' }} strokeWidth="1.4" />
      <Glint x={CX - 44} y={cy - 46} rx={40} ry={10} rot={-40} o={0.3} />
    </g>
  );
}

/** UEFA-Jugendliga: kleiner Henkelpokal. */
function Uyl({ id }: ArtProps) {
  return <g transform={`translate(${CX * 0.18} 78) scale(0.82)`}><Henkel id={id} /></g>;
}

const ART: Record<TrophyShape, (p: ArtProps) => JSX.Element> = {
  schale: Schale, ddr: Ddr, teller: Teller, pokal: Pokal, henkel: Henkel, cwc: Cwc,
  konferenz: Konferenz, uefa: Uefa, halle: Halle, jugend: Jugend, uyl: Uyl, aufstieg: Aufstieg,
};

export function TrophyArt({ shape, className = '' }: { shape: TrophyShape; className?: string }) {
  const id = `tro${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const Art = ART[shape];
  return (
    <svg className={`tro-art ${className}`} viewBox="0 0 400 450" role="img" aria-hidden="true">
      <MetalDefs id={id} />
      <Art id={id} />
    </svg>
  );
}
