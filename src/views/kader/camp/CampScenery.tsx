// =============================================================================
// TRAININGSLAGER-PLANER – gezeichnetes Ortsbild (Rückfall für das Foto-Slot
// `bilder/camp/<ziel>.webp`, freigeschaltet in data/campImages.ts).
// Je Landschaftstyp eine Szene (Sportschule, Küste, Mittelgebirge, Alpen, Mittelmeer,
// Insel, Wüste, Subtropen, Großstadt, Kap); im Winter liegt in Mitteleuropa Schnee.
// Farben nur über die Tokens `--ls-*` in 00-base.css (CSS-Klassen in 28-camp2.css).
// =============================================================================
import { useState } from 'react';
import type { CampDestination } from '../../../data/campDestinations';
import { campPhoto } from '../../../data/campImages';

export type SceneKind = 'schule' | 'kueste' | 'huegel' | 'alpen' | 'mittelmeer' | 'insel' | 'wueste' | 'palmen' | 'stadt' | 'kap';

export function sceneKind(d: CampDestination): SceneKind {
  if (d.region === 'inland') return 'schule';
  if (d.region === 'kueste') return 'kueste';
  if (d.region === 'mittelgebirge') return 'huegel';
  if (d.region === 'alpen') return 'alpen';
  if (d.id === 'kanaren' || d.id === 'malta' || d.id === 'zypern') return 'insel';
  if (d.region === 'sueden') return 'mittelmeer';
  if (d.climate === 'golf') return 'wueste';
  if (d.climate === 'florida') return 'palmen';
  if (d.climate === 'kap') return 'kap';
  return 'stadt';
}
const COLD = new Set(['flachland', 'kueste', 'mittelgebirge', 'alpen', 'hochalpen']);
export const snowy = (d: CampDestination, month: number) => COLD.has(d.climate) && (month === 11 || month <= 1);

/** Kleiner deterministischer Zufall je Ziel (Bäume, Häuser). */
function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 10000) / 10000; };
}

const Fir = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="ls-tree">
    <path d="M0 -34 L10 -14 L5 -14 L13 0 L-13 0 L-5 -14 L-10 -14 Z" /><rect x={-1.5} y={0} width={3} height={5} className="ls-trunk" />
  </g>
);
const Leafy = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="ls-tree">
    <rect x={-1.5} y={-8} width={3} height={10} className="ls-trunk" /><ellipse cx={0} cy={-16} rx={11} ry={12} />
  </g>
);
const Palm = ({ x, y, s = 1, flip }: { x: number; y: number; s?: number; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} className="ls-palm">
    <path d="M0 0 Q4 -30 10 -58" className="ls-palm-trunk" />
    {[-150, -115, -70, -30, 10].map((a) => (
      <path key={a} d="M0 0 Q14 -8 30 2" transform={`translate(10 -58) rotate(${a})`} className="ls-palm-leaf" />
    ))}
  </g>
);
const House = ({ x, y, w, h, roof = true, cls = '' }: { x: number; y: number; w: number; h: number; roof?: boolean; cls?: string }) => (
  <g className={`ls-house ${cls}`}>
    <rect x={x} y={y - h} width={w} height={h} />
    {roof && <path d={`M${x - 3} ${y - h} L${x + w / 2} ${y - h - w * 0.32} L${x + w + 3} ${y - h} Z`} className="ls-roof" />}
    {Array.from({ length: Math.max(1, Math.floor(w / 14)) }, (_, i) => (
      <rect key={i} x={x + 5 + i * 14} y={y - h + 6} width={5} height={6} className="ls-win" />
    ))}
  </g>
);

function Sky({ kind, snow }: { kind: SceneKind; snow: boolean }) {
  const warm = kind === 'wueste' || kind === 'mittelmeer' || kind === 'insel' || kind === 'palmen' || kind === 'kap';
  return (
    <>
      <defs>
        <linearGradient id="lsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className={snow ? 'ls-sky-grey-0' : 'ls-sky-0'} />
          <stop offset="100%" className={snow ? 'ls-sky-grey-1' : 'ls-sky-1'} />
        </linearGradient>
      </defs>
      <rect width={640} height={400} fill="url(#lsSky)" />
      {!snow && <circle cx={warm ? 520 : 470} cy={warm ? 70 : 80} r={warm ? 26 : 20} className="ls-sun" />}
      <g className="ls-cloud">
        <ellipse cx={130} cy={70} rx={48} ry={11} /><ellipse cx={160} cy={62} rx={30} ry={10} />
        {!warm && <><ellipse cx={380} cy={46} rx={40} ry={8} /><ellipse cx={402} cy={40} rx={22} ry={8} /></>}
      </g>
    </>
  );
}

function Pitch({ x, y, w, snow }: { x: number; y: number; w: number; snow: boolean }) {
  const h = w * 0.16;
  return (
    <g className={`ls-pitch ${snow ? 'snow' : ''}`}>
      <path d={`M${x} ${y} L${x + w} ${y} L${x + w - 30} ${y - h} L${x + 30} ${y - h} Z`} />
      <path d={`M${x + w / 2} ${y} L${x + w / 2 - 2} ${y - h} M${x + 14} ${y - 2} L${x + w - 14} ${y - 2}`} className="ls-line" />
      <ellipse cx={x + w / 2 - 1} cy={y - h / 2} rx={w * 0.07} ry={h * 0.22} className="ls-line" />
      <path d={`M${x + 34} ${y - h + 1} l0 -9 l26 0 l0 9`} className="ls-goal" />
    </g>
  );
}

function Scene({ kind, d, snow }: { kind: SceneKind; d: CampDestination; snow: boolean }) {
  const r = seeded(d.id);
  const ground = snow ? 'ls-snowfield' : 'ls-grass';
  switch (kind) {
    case 'schule':
      return (
        <>
          <path d="M0 250 Q160 228 320 240 T640 232 L640 400 L0 400 Z" className="ls-far" />
          {Array.from({ length: 14 }, (_, i) => <Leafy key={i} x={20 + i * 46 + r() * 20} y={246 + r() * 6} s={0.8 + r() * 0.4} />)}
          <rect x={0} y={262} width={640} height={138} className={ground} />
          <House x={60} y={278} w={150} h={46} roof={false} cls="flat" />
          <House x={214} y={278} w={70} h={30} roof={false} cls="flat" />
          <g className="ls-mast">{[330, 610].map((x) => <g key={x}><rect x={x} y={170} width={3} height={110} /><rect x={x - 9} y={166} width={21} height={8} /></g>)}</g>
          <Pitch x={300} y={385} w={330} snow={snow} />
        </>
      );
    case 'kueste':
      return (
        <>
          <rect x={0} y={230} width={640} height={60} className="ls-sea" />
          <path d="M0 236 L640 236" className="ls-sea-line" />
          <path d="M0 300 Q120 262 240 280 Q380 300 470 262 Q560 236 640 258 L640 400 L0 400 Z" className={snow ? 'ls-snowfield' : 'ls-dune'} />
          <path d="M0 330 Q200 300 420 320 T640 312 L640 400 L0 400 Z" className={snow ? 'ls-snowfield-2' : 'ls-dune-2'} />
          {Array.from({ length: 26 }, (_, i) => { const x = 10 + r() * 620, y = 284 + r() * 40; return <path key={i} d={`M${x} ${y} l-3 -9 M${x} ${y} l1 -11 M${x} ${y} l4 -8`} className="ls-reed" />; })}
          <g className="ls-tower"><path d="M520 262 L528 176 L540 176 L548 262 Z" /><rect x={524} y={168} width={20} height={10} className="ls-roof" /><rect x={528} y={196} width={12} height={10} className="ls-band" /><rect x={526} y={226} width={16} height={10} className="ls-band" /></g>
          <House x={80} y={278} w={60} h={24} />
        </>
      );
    case 'huegel':
      return (
        <>
          <path d="M0 210 Q120 150 260 196 Q380 140 520 186 Q590 168 640 180 L640 400 L0 400 Z" className="ls-far" />
          <path d="M0 260 Q140 214 300 250 Q460 210 640 244 L640 400 L0 400 Z" className="ls-mid" />
          {Array.from({ length: 34 }, (_, i) => <Fir key={i} x={r() * 640} y={232 + r() * 50} s={0.7 + r() * 0.6} />)}
          <path d="M0 300 Q220 280 400 296 T640 288 L640 400 L0 400 Z" className={ground} />
          <House x={380} y={318} w={64} h={26} />
          <Pitch x={60} y={388} w={280} snow={snow} />
        </>
      );
    case 'alpen': {
      const lake = d.id === 'tegernsee' || d.id === 'kaernten' || d.id === 'schweiz';
      const high = d.climate === 'hochalpen';
      return (
        <>
          <path d="M0 230 L70 150 L120 190 L210 92 L290 180 L360 120 L430 170 L520 80 L600 160 L640 140 L640 400 L0 400 Z" className="ls-rock" />
          <path d={`M180 125 L210 92 L238 124 L222 118 L210 128 L196 118 Z M490 112 L520 80 L552 115 L534 108 L520 120 L505 108 Z M340 140 L360 120 L380 140 L370 137 L360 145 Z${high || snow ? ' M50 172 L70 150 L95 170 L80 168 L70 176 Z M410 150 L430 170 L420 166 Z' : ''}`} className="ls-snowcap" />
          <path d="M0 250 Q160 210 320 240 Q480 210 640 238 L640 400 L0 400 Z" className="ls-mid" />
          {Array.from({ length: 30 }, (_, i) => <Fir key={i} x={r() * 640} y={238 + r() * 34} s={0.7 + r() * 0.5} />)}
          {lake && <ellipse cx={320} cy={300} rx={340} ry={22} className="ls-sea" />}
          <path d={`M0 ${lake ? 318 : 290} Q200 ${lake ? 306 : 276} 400 ${lake ? 316 : 288} T640 ${lake ? 310 : 282} L640 400 L0 400 Z`} className={ground} />
          <House x={420} y={lake ? 336 : 312} w={70} h={28} cls="chalet" />
          <Pitch x={40} y={392} w={300} snow={snow} />
        </>
      );
    }
    case 'mittelmeer':
      return (
        <>
          <path d="M0 220 Q60 200 120 214 L120 240 L0 240 Z" className="ls-far" />
          <rect x={0} y={232} width={640} height={80} className="ls-sea" />
          <path d="M0 238 L640 238" className="ls-sea-line" />
          <path d="M0 330 Q200 290 360 306 Q500 318 640 290 L640 400 L0 400 Z" className="ls-grass dry" />
          <House x={380} y={300} w={130} h={56} roof={false} cls="white" />
          <House x={516} y={296} w={60} h={34} roof={false} cls="white" />
          <Palm x={340} y={312} s={1.1} /><Palm x={600} y={300} s={0.9} flip />
          <Pitch x={30} y={392} w={300} snow={false} />
        </>
      );
    case 'insel':
      return (
        <>
          <path d="M120 236 L250 140 L300 160 L330 150 L470 236 Z" className="ls-rock" />
          <path d="M250 140 L270 150 L300 160 L282 166 L262 158 Z" className="ls-snowcap thin" />
          <rect x={0} y={236} width={640} height={70} className="ls-sea" />
          <path d="M0 242 L640 242" className="ls-sea-line" />
          <path d="M0 320 Q160 296 320 312 Q480 324 640 300 L640 400 L0 400 Z" className="ls-grass dry" />
          <House x={420} y={316} w={120} h={42} roof={false} cls="white" />
          <Palm x={90} y={330} s={1.2} /><Palm x={560} y={318} s={0.9} flip />
          <Pitch x={130} y={394} w={280} snow={false} />
        </>
      );
    case 'wueste':
      return (
        <>
          <g className="ls-sky-towers">
            {[[300, 14, 150], [322, 10, 110], [340, 16, 175], [362, 9, 95], [380, 12, 130], [398, 7, 205], [410, 12, 120]].map(([x, w, h]) => <rect key={x} x={x} y={262 - h} width={w} height={h} />)}
          </g>
          <path d="M0 270 Q120 240 260 262 Q420 284 640 250 L640 400 L0 400 Z" className="ls-sand" />
          <path d="M0 320 Q180 294 360 318 T640 304 L640 400 L0 400 Z" className="ls-sand-2" />
          <Palm x={80} y={330} s={1} /><Palm x={560} y={322} s={1.1} flip />
          <Pitch x={200} y={394} w={300} snow={false} />
        </>
      );
    case 'palmen':
      return (
        <>
          <rect x={0} y={240} width={640} height={70} className="ls-sea" />
          <path d="M0 316 Q200 300 400 312 T640 304 L640 400 L0 400 Z" className="ls-grass" />
          {[60, 140, 520, 600].map((x, i) => <Palm key={x} x={x} y={314 + (i % 2) * 6} s={1 + r() * 0.3} flip={i > 1} />)}
          <House x={230} y={308} w={150} h={36} roof={false} cls="white" />
          <Pitch x={180} y={394} w={300} snow={false} />
        </>
      );
    case 'kap':
      return (
        <>
          <path d="M60 236 L130 150 L400 146 L460 236 Z" className="ls-rock" />
          <path d="M130 150 L400 146" className="ls-sea-line" />
          <rect x={0} y={236} width={640} height={60} className="ls-sea" />
          <path d="M0 312 Q220 290 420 306 T640 296 L640 400 L0 400 Z" className="ls-grass" />
          <House x={470} y={300} w={110} h={40} roof={false} cls="white" />
          <Pitch x={40} y={394} w={320} snow={false} />
        </>
      );
    default: {
      const xs = Array.from({ length: 22 }, (_, i) => ({ x: 20 + i * 28 + r() * 8, w: 18 + r() * 14, h: 50 + r() * 120 }));
      return (
        <>
          <g className="ls-sky-towers">{xs.map((b, i) => <rect key={i} x={b.x} y={270 - b.h} width={b.w} height={b.h} />)}</g>
          <rect x={0} y={268} width={640} height={132} className="ls-grass" />
          {Array.from({ length: 10 }, (_, i) => <Leafy key={i} x={30 + i * 64} y={286} s={0.9} />)}
          <Pitch x={170} y={392} w={300} snow={false} />
        </>
      );
    }
  }
}

/** Großes Ortsbild: Foto, sonst gezeichnete Landschaft. */
export function CampScenery({ d, month }: { d: CampDestination; month: number }) {
  const photo = campPhoto(d.id);
  const [failed, setFailed] = useState<string | null>(null);
  if (photo && failed !== photo) return <img className="cs-photo-img" src={photo} alt={d.name} onError={() => setFailed(photo)} />;
  const kind = sceneKind(d);
  const snow = snowy(d, month);
  return (
    <svg className={`cs-scene ls-${kind} ${snow ? 'ls-winter' : ''}`} viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${d.name} (Zeichnung)`}>
      <Sky kind={kind} snow={snow} />
      <Scene kind={kind} d={d} snow={snow} />
    </svg>
  );
}
