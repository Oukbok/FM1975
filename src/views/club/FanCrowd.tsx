// =============================================================================
// FANKURVE — gezeichnete Fans auf der Stehtribüne
// -----------------------------------------------------------------------------
// Anzahl: Stimmung und Auslastung (8 bis 42 Figuren). Gemüt je Figur: Stimmung,
// letzte Ergebnisse und etwas Zufall → jubelnd (Arme hoch, Schal/Fahne),
// gelassen oder enttäuscht (Arme verschränkt, Hände am Kopf). Ausstattung je
// Epoche: Kutte und Wollmütze (70er/80er), Schals (90er+), Handys (ab 2010).
// Bei sehr guter Laune Fahnen und Spruchband, bei schlechter ein Protestbanner.
// =============================================================================
import type { ReactNode } from 'react';

interface Props {
  mood: number;          // 0–100
  formPoints: number;    // Punkte aus den letzten 5 Spielen (0–15), -1 = keine Spiele
  attendance: number;    // erwartete Auslastung 0–1
  primary: string;
  secondary: string;
  year: number;
  seed: string;
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const SKIN = ['#f1c9a5', '#e0ac85', '#c68c5e', '#8d5a3b', '#f5d7bd', '#b97a50'];
const HAIR = ['#2b1d14', '#5a3a22', '#c9a15b', '#1a1a1a', '#8a8a8a', '#a0522d'];

type Moodish = 'happy' | 'neutral' | 'sad';

function Fan({ x, y, s, m, shirt, accent, era, r, i }: { x: number; y: number; s: number; m: Moodish; shirt: string; accent: string; era: number; r: () => number; i: number }) {
  const skin = SKIN[Math.floor(r() * SKIN.length)];
  const hair = HAIR[Math.floor(r() * HAIR.length)];
  const hat = era === 0 && r() < 0.35;
  const kutte = era === 0 && r() < 0.4;
  const scarf = era >= 1 && r() < 0.6;
  const phone = era === 2 && m === 'happy' && r() < 0.25;
  const body = kutte ? '#3d5a80' : shirt;
  const arms: ReactNode[] = [];
  const sw = 5 * s;
  if (m === 'happy') {
    arms.push(<line key="l" x1={-9 * s} y1={-14 * s} x2={-15 * s} y2={-36 * s} stroke={body} strokeWidth={sw} strokeLinecap="round" />);
    arms.push(<line key="r" x1={9 * s} y1={-14 * s} x2={15 * s} y2={-36 * s} stroke={body} strokeWidth={sw} strokeLinecap="round" />);
    if (scarf) arms.push(<rect key="sc" x={-16 * s} y={-40 * s} width={32 * s} height={6 * s} fill={accent} stroke={shirt} strokeWidth={1.5} />);
    if (phone) arms.push(<rect key="ph" x={12 * s} y={-42 * s} width={6 * s} height={9 * s} rx={1} fill="#1d232b" stroke="#9fd7ec" />);
  } else if (m === 'sad') {
    if (r() < 0.5) {
      // Hände am Kopf
      arms.push(<path key="l" d={`M ${-9 * s} ${-14 * s} L ${-14 * s} ${-26 * s} L ${-7 * s} ${-28 * s}`} stroke={body} strokeWidth={sw} fill="none" strokeLinecap="round" />);
      arms.push(<path key="r" d={`M ${9 * s} ${-14 * s} L ${14 * s} ${-26 * s} L ${7 * s} ${-28 * s}`} stroke={body} strokeWidth={sw} fill="none" strokeLinecap="round" />);
    } else {
      // verschränkte Arme
      arms.push(<line key="x" x1={-9 * s} y1={-10 * s} x2={9 * s} y2={-6 * s} stroke={body} strokeWidth={sw} strokeLinecap="round" />);
      arms.push(<line key="y" x1={9 * s} y1={-10 * s} x2={-9 * s} y2={-6 * s} stroke={body} strokeWidth={sw} strokeLinecap="round" />);
    }
  } else {
    arms.push(<line key="l" x1={-9 * s} y1={-14 * s} x2={-11 * s} y2={0} stroke={body} strokeWidth={sw} strokeLinecap="round" />);
    arms.push(<line key="r" x1={9 * s} y1={-14 * s} x2={11 * s} y2={0} stroke={body} strokeWidth={sw} strokeLinecap="round" />);
  }
  const mouth = m === 'happy' ? <path d={`M ${-4 * s} ${-26 * s} Q 0 ${-21 * s} ${4 * s} ${-26 * s}`} stroke="#5a2a20" strokeWidth={1.6} fill="#7a2d22" />
    : m === 'sad' ? <path d={`M ${-4 * s} ${-23 * s} Q 0 ${-27 * s} ${4 * s} ${-23 * s}`} stroke="#5a2a20" strokeWidth={1.6} fill="none" />
      : <line x1={-3.5 * s} y1={-24.5 * s} x2={3.5 * s} y2={-24.5 * s} stroke="#5a2a20" strokeWidth={1.4} />;
  return (
    <g transform={`translate(${x},${y})`}><g className={m === 'happy' ? `fan-jump fan-d${i % 4}` : undefined}>
      <rect x={-10 * s} y={-18 * s} width={20 * s} height={20 * s} rx={5 * s} fill={body} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
      {kutte && <rect x={-3 * s} y={-18 * s} width={6 * s} height={20 * s} fill={shirt} opacity={0.9} />}
      {scarf && m !== 'happy' && <rect x={-9 * s} y={-20 * s} width={18 * s} height={4 * s} fill={accent} />}
      {arms}
      <circle cx={0} cy={-28 * s} r={9 * s} fill={skin} />
      {hat ? <path d={`M ${-9.5 * s} ${-30 * s} Q 0 ${-46 * s} ${9.5 * s} ${-30 * s} Z`} fill={accent} /> : <path d={`M ${-9 * s} ${-30 * s} Q 0 ${-42 * s} ${9 * s} ${-30 * s}`} fill={hair} />}
      <circle cx={-3.2 * s} cy={-30 * s} r={1.2 * s} fill="#222" />
      <circle cx={3.2 * s} cy={-30 * s} r={1.2 * s} fill="#222" />
      {mouth}
    </g></g>
  );
}

export function FanCrowd({ mood, formPoints, attendance, primary, secondary, year, seed }: Props) {
  const r = rng(seed);
  const era = year < 1990 ? 0 : year < 2010 ? 1 : 2;
  const formMood = formPoints < 0 ? 50 : (formPoints / 15) * 100;
  const feel = mood * 0.6 + formMood * 0.4;
  const n = Math.round(6 + Math.max(0, Math.min(1, (mood / 100) * 0.6 + attendance * 0.4)) * 26);
  const W = 900, H = 300;
  const rows = 4;
  const terrace: ReactNode[] = [];
  for (let i = 0; i < rows; i++) {
    const y = 100 + i * 50;
    terrace.push(<rect key={i} x={0} y={y} width={W} height={50} fill={i % 2 ? '#5b616a' : '#666d76'} />);
    terrace.push(<rect key={`b${i}`} x={0} y={y} width={W} height={4} fill="#7c838c" />);
  }
  // Wellenbrecher (Stehplatzgeländer)
  for (let i = 1; i < rows; i++) terrace.push(<line key={`g${i}`} x1={0} y1={100 + i * 50 - 20} x2={W} y2={100 + i * 50 - 20} stroke="#aeb5bd" strokeWidth={2} opacity={0.5} />);

  // Plätze auf den Rängen (hinten zuerst)
  const spots: { x: number; y: number; row: number }[] = [];
  for (let row = 0; row < rows; row++) {
    const perRow = 10 - row;
    for (let k = 0; k < perRow; k++) spots.push({ x: 50 + (k + 0.5) * (W - 100) / perRow + (r() - 0.5) * 20, y: 146 + row * 50, row });
  }
  // Verteilung: zuerst vorne/mitte füllen
  const chosen = spots.map((s2) => ({ s2, k: Math.abs(s2.x - W / 2) / W + (rows - s2.row) * 0.12 + r() * 0.25 })).sort((a, b) => a.k - b.k).slice(0, n).map((c) => c.s2)
    .sort((a, b) => a.row - b.row);
  const fans = chosen.map((p, i) => {
    const f = feel + (r() - 0.5) * 40;
    const m: Moodish = f >= 62 ? 'happy' : f >= 38 ? 'neutral' : 'sad';
    const s = 1.2 + p.row * 0.1;
    return <Fan key={i} i={i} x={p.x} y={p.y} s={s} m={m} shirt={r() < 0.7 ? primary : secondary} accent={r() < 0.5 ? secondary : primary} era={era} r={r} />;
  });

  const euphoric = feel >= 70, angry = feel < 32;
  return (
    <svg className="fan-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={W} height={100} fill="url(#fanSky)" />
      <defs>
        <linearGradient id="fanSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d2a3a" /><stop offset="1" stopColor="#36506a" /></linearGradient>
      </defs>
      {/* Flutlicht */}
      <g opacity={0.9}>
        <rect x={60} y={20} width={60} height={18} fill="#2d333b" /><rect x={64} y={24} width={52} height={10} fill="#fff6c8" />
        <rect x={W - 120} y={20} width={60} height={18} fill="#2d333b" /><rect x={W - 116} y={24} width={52} height={10} fill="#fff6c8" />
      </g>
      {terrace}
      {euphoric && <g>
        <rect x={W / 2 - 170} y={52} width={340} height={36} rx={4} fill={primary} stroke={secondary} strokeWidth={3} />
        <text x={W / 2} y={77} textAnchor="middle" fontSize={20} fontWeight={900} fill={secondary}>{era === 0 ? 'IMMER WIEDER – UNSER VEREIN!' : 'WIR SIND IMMER FÜR EUCH DA!'}</text>
        {[150, W - 150].map((fx) => <g key={fx}><line x1={fx} y1={150} x2={fx} y2={60} stroke="#ccc" strokeWidth={3} /><path d={`M ${fx} 60 L ${fx + 60} 70 L ${fx} 84 Z`} fill={primary} stroke={secondary} strokeWidth={2} /></g>)}
      </g>}
      {angry && <g>
        <rect x={W / 2 - 180} y={52} width={360} height={36} rx={4} fill="#f2efe6" stroke="#333" strokeWidth={2} />
        <text x={W / 2} y={77} textAnchor="middle" fontSize={19} fontWeight={900} fill="#2b2b2b">{era === 2 ? 'EURE GEHÄLTER – UNSERE NERVEN!' : 'WIR WOLLEN EUCH KÄMPFEN SEHEN!'}</text>
      </g>}
      {fans}
    </svg>
  );
}
