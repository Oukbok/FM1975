// =============================================================================
// Vorschau „Nächstes Spiel“ – gezeichnetes Stadtbild (kein Foto): ruhige Silhouette in der
// Dämmerung, deterministisch aus dem Stadtnamen. Bildsprache aus den Kürzeln der Stadttexte
// (data/prematch/cityTextsDe.ts): d Dom · f Giebel · h Hafen · i Industrie · s Burg ·
// t Fernsehturm · m Hochhäuser · b Berge · r Fluss/Brücke.
// =============================================================================
import { hashStr, mulberry32 } from '../../engine/leagues';

const W = 400, H = 500;
const GROUND = 420;

type El = JSX.Element;

export function CitySkyline({ city, tags, year }: { city: string; tags: string; year: number }) {
  const rnd = mulberry32(hashStr(`sky:${city}`));
  const has = (t: string) => tags.includes(t);
  const water = has('h') || has('r');
  const ground = water ? GROUND - 6 : GROUND;
  const far: El[] = [], near: El[] = [], marks: El[] = [], lights: El[] = [];

  // Hintergrund: Hügel/Berge
  const hills: El[] = [];
  if (has('b')) {
    let d = `M0 ${ground - 90}`;
    for (let x = 0; x <= W; x += 40) d += ` L${x} ${ground - 110 - rnd() * 90}`;
    hills.push(<path key="m1" className="pm-sky-hill2" d={`${d} L${W} ${ground} L0 ${ground} Z`} />);
  }
  {
    let d = `M0 ${ground - 40}`;
    for (let x = 0; x <= W; x += 50) d += ` Q${x + 25} ${ground - 60 - rnd() * 25} ${x + 50} ${ground - 38 - rnd() * 14}`;
    hills.push(<path key="h1" className="pm-sky-hill" d={`${d} L${W} ${ground} L0 ${ground} Z`} />);
  }

  // Ferne Häuserreihe
  for (let x = -10; x < W; ) {
    const w = 14 + rnd() * 26, h = 30 + rnd() * 50;
    far.push(<rect key={`f${x}`} className="pm-bld-far" x={x} y={ground - h} width={w + 1} height={h} />);
    x += w;
  }

  // Wahrzeichen (hinter der vorderen Reihe)
  const slots = [0.24, 0.5, 0.76].map((f) => f * W + (rnd() - 0.5) * 30);
  let si = 0;
  const slot = () => slots[si++ % slots.length];
  if (has('s')) {
    const x = slot(), top = ground - 150;
    marks.push(
      <g key="s" className="pm-mark">
        <path d={`M${x - 90} ${ground} Q${x} ${top - 10} ${x + 90} ${ground} Z`} className="pm-sky-hill" />
        <rect x={x - 42} y={top + 6} width={84} height={40} />
        <rect x={x - 50} y={top - 16} width={18} height={62} /><rect x={x + 32} y={top - 22} width={20} height={68} />
        <path d={`M${x - 52} ${top - 16} L${x - 41} ${top - 34} L${x - 30} ${top - 16} Z M${x + 30} ${top - 22} L${x + 42} ${top - 44} L${x + 54} ${top - 22} Z`} />
        {[-30, -18, -6, 6, 18].map((dx) => <rect key={dx} x={x + dx} y={top} width={7} height={8} />)}
      </g>,
    );
  }
  if (has('d')) {
    const x = slot(), base = ground - 70;
    marks.push(
      <g key="d" className="pm-mark">
        <rect x={x - 34} y={base} width={68} height={70} />
        <path d={`M${x - 34} ${base} L${x} ${base - 26} L${x + 34} ${base} Z`} />
        <rect x={x - 30} y={base - 120} width={16} height={120} /><rect x={x + 14} y={base - 120} width={16} height={120} />
        <path d={`M${x - 31} ${base - 120} L${x - 22} ${base - 172} L${x - 13} ${base - 120} Z M${x + 13} ${base - 120} L${x + 22} ${base - 172} L${x + 31} ${base - 120} Z`} />
        <circle cx={x} cy={base + 22} r={9} className="pm-mark-glass" />
      </g>,
    );
  }
  if (has('t')) {
    const x = slot();
    marks.push(
      <g key="t" className="pm-mark">
        <path d={`M${x - 6} ${ground} L${x - 3} ${ground - 200} L${x + 3} ${ground - 200} L${x + 6} ${ground} Z`} />
        <circle cx={x} cy={ground - 206} r={13} />
        <rect x={x - 1.5} y={ground - 262} width={3} height={50} />
        <circle cx={x} cy={ground - 262} r={2.2} className="pm-mark-red" />
      </g>,
    );
  }
  if (has('m')) {
    const x0 = slot() - 50;
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const w = 20 + rnd() * 16, h = 110 + rnd() * (year >= 1990 ? 140 : 70), x = x0 + i * 26;
      marks.push(<rect key={`m${i}`} className="pm-mark" x={x} y={ground - h} width={w} height={h} />);
      for (let wy = ground - h + 8; wy < ground - 10; wy += 11) {
        if (rnd() < 0.3) lights.push(<rect key={`ml${i}-${wy}`} className="pm-win" x={x + 4 + rnd() * (w - 10)} y={wy} width={3} height={4} />);
      }
    }
  }
  if (has('i')) {
    const x = slot();
    marks.push(
      <g key="i" className="pm-mark">
        <path d={`M${x - 40} ${ground} L${x - 37} ${ground - 150} L${x - 29} ${ground - 150} L${x - 26} ${ground} Z`} />
        <path d={`M${x - 10} ${ground} L${x - 8} ${ground - 120} L${x - 1} ${ground - 120} L${x + 1} ${ground} Z`} />
        {/* Förderturm */}
        <path d={`M${x + 22} ${ground} L${x + 40} ${ground - 110} L${x + 58} ${ground} M${x + 32} ${ground - 60} L${x + 48} ${ground - 60}`} className="pm-mark-line" />
        <circle cx={x + 40} cy={ground - 110} r={7} className="pm-mark-line" />
        <rect x={x - 50} y={ground - 40} width={110} height={40} />
      </g>,
    );
  }
  if (has('h')) {
    const x = W - 70 + (rnd() - 0.5) * 20;
    marks.push(
      <g key="h" className="pm-mark-line">
        <path d={`M${x} ${ground} L${x} ${ground - 120} L${x + 60} ${ground - 120} M${x - 16} ${ground - 120} L${x + 4} ${ground - 120} M${x} ${ground - 120} L${x + 30} ${ground - 120} L${x} ${ground - 80} M${x + 50} ${ground - 120} L${x + 50} ${ground - 92}`} />
        <path d={`M${x - 60} ${ground} L${x - 60} ${ground - 90} L${x - 14} ${ground - 90} M${x - 60} ${ground - 90} L${x - 40} ${ground - 60}`} />
      </g>,
    );
  }

  // Vordere Häuserreihe
  for (let x = -6; x < W; ) {
    const w = 18 + rnd() * 30, h = 26 + rnd() * 40;
    const gable = has('f') && rnd() < 0.7;
    const y = ground - h;
    near.push(gable
      ? <path key={`n${x}`} className="pm-bld" d={`M${x} ${ground} L${x} ${y} L${x + w / 2} ${y - w * 0.55} L${x + w + 1} ${y} L${x + w + 1} ${ground} Z`} />
      : <rect key={`n${x}`} className="pm-bld" x={x} y={y} width={w + 1} height={h} />);
    for (let wy = y + 6; wy < ground - 8; wy += 10) for (let wx = x + 4; wx < x + w - 5; wx += 8) {
      if (rnd() < 0.14) lights.push(<rect key={`w${wx}-${wy}`} className="pm-win" x={wx} y={wy} width={3} height={4} />);
    }
    x += w;
  }

  const stars: El[] = Array.from({ length: 22 }, (_, i) => (
    <circle key={i} className="pm-star" cx={rnd() * W} cy={10 + rnd() * 190} r={rnd() < 0.2 ? 1.3 : 0.8} />
  ));

  return (
    <svg className="pm-city-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Stadtbild ${city}`}>
      <defs>
        <linearGradient id="pmDusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="pm-dusk-0" />
          <stop offset="70%" className="pm-dusk-1" />
          <stop offset="100%" className="pm-dusk-2" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pmDusk)" />
      {stars}
      <circle cx={W * 0.78} cy={70} r={16} className="pm-moon" />
      {hills}
      {far}
      {marks}
      {near}
      {lights}
      <rect x={0} y={ground} width={W} height={H - ground} className={water ? 'pm-water' : 'pm-street'} />
      {water && Array.from({ length: 7 }, (_, i) => {
        const x = 10 + rnd() * (W - 90);
        return <line key={i} className="pm-ripple" x1={x} x2={x + 30 + rnd() * 40} y1={ground + 14 + i * 10} y2={ground + 14 + i * 10} />;
      })}
      {has('r') && (
        <path className="pm-bridge" d={`M0 ${ground + 4} L${W} ${ground + 4} ${[60, 160, 260, 360].map((x) => `M${x - 46} ${ground + 4} Q${x} ${ground + 40} ${x + 46} ${ground + 4}`).join(' ')}`} />
      )}
    </svg>
  );
}
