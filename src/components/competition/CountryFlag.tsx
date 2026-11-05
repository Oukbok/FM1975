// =============================================================================
// <CountryFlag>: vereinfachte, gedämpfte Landesflagge (SVG, 3:2) aus data/countryFlags.ts
// =============================================================================
import { countryInfo } from '../../data/countryFlags';

export function CountryFlag({ country, height = 16 }: { country: string; height?: number }) {
  const f = countryInfo(country).flag;
  const w = 30, h = 20;
  let body: JSX.Element;
  switch (f.kind) {
    case 'h':
      body = <>{f.c.map((c, i) => <rect key={i} x={0} y={(h / f.c.length) * i} width={w} height={h / f.c.length + 0.2} fill={c} />)}</>;
      break;
    case 'v':
      body = <>{f.c.map((c, i) => <rect key={i} x={(w / f.c.length) * i} y={0} width={w / f.c.length + 0.2} height={h} fill={c} />)}</>;
      break;
    case 'nordic':
      body = <><rect width={w} height={h} fill={f.bg} /><rect x={9} y={0} width={4} height={h} fill={f.cross} /><rect x={0} y={8} width={w} height={4} fill={f.cross} />{f.inner && <><rect x={10} y={0} width={2} height={h} fill={f.inner} /><rect x={0} y={9} width={w} height={2} fill={f.inner} /></>}</>;
      break;
    case 'cross':
      body = <><rect width={w} height={h} fill={f.bg} /><rect x={13} y={0} width={4} height={h} fill={f.cross} /><rect x={0} y={8} width={w} height={4} fill={f.cross} /></>;
      break;
    case 'saltire':
      body = <><rect width={w} height={h} fill={f.bg} /><path d={`M0 0L${w} ${h}M${w} 0L0 ${h}`} stroke={f.cross} strokeWidth={3.2} /></>;
      break;
    case 'crescent':
      body = <><rect width={w} height={h} fill={f.bg} /><circle cx={12} cy={10} r={5.2} fill={f.fg} /><circle cx={13.6} cy={10} r={4.2} fill={f.bg} /><circle cx={19} cy={10} r={1.6} fill={f.fg} /></>;
      break;
    default:
      body = <><rect width={w} height={h} fill={f.bg} />{f.dot && <circle cx={7} cy={6} r={2.4} fill={f.dot} />}</>;
  }
  return (
    <svg className="cflag" width={height * 1.5} height={height} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={countryInfo(country).name}>
      <g opacity={0.88}>{body}</g>
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} fill="none" stroke="rgba(255,255,255,0.18)" />
    </svg>
  );
}
