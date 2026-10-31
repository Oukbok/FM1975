// =============================================================================
// Spielfeld maßstabsgetreu nach FIFA-Regeln (Hochformat, 68 × 105 m).
// Einheiten der Zeichnung = Meter; oben = gegnerisches Tor, unten = eigenes Tor.
// Die SVG füllt ihr Elternelement (Seitenverhältnis 68/105 muss es selbst halten);
// Tore liegen hinter der Torlinie (overflow: visible).
// =============================================================================
const W = 68, L = 105;
const PA_W = 40.32, PA_D = 16.5;     // Strafraum
const GA_W = 18.32, GA_D = 5.5;      // Torraum
const SPOT = 11, R = 9.15;           // Elfmeterpunkt, Kreisradius
const GOAL_W = 7.32, GOAL_D = 1.6;   // Tor (angedeutet)
const STRIPES = 12;

export default function PitchSVG({ className = '' }: { className?: string }) {
  const half = Math.sqrt(R * R - (PA_D - SPOT) ** 2); // Teilkreis endet an der Strafraumlinie
  const cx = W / 2;
  const line = { fill: 'none', stroke: 'var(--lu-line)', strokeWidth: 1.4, vectorEffect: 'non-scaling-stroke' as const };
  const box = (y: number, w: number, d: number, top: boolean) => (
    <rect x={cx - w / 2} y={top ? y : y - d} width={w} height={d} {...line} />
  );
  return (
    <svg className={`lu-pitch-svg ${className}`} viewBox={`0 0 ${W} ${L}`} preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: STRIPES }, (_, i) => (
        <rect key={i} x={0} y={(i * L) / STRIPES} width={W} height={L / STRIPES + 0.02}
          fill={i % 2 ? 'var(--lu-grass-b)' : 'var(--lu-grass-a)'} />
      ))}
      <rect x={0} y={0} width={W} height={L} {...line} />
      <line x1={0} y1={L / 2} x2={W} y2={L / 2} {...line} />
      <circle cx={cx} cy={L / 2} r={R} {...line} />
      <circle cx={cx} cy={L / 2} r={0.3} fill="var(--lu-line)" />
      {/* oben (Angriff) */}
      {box(0, PA_W, PA_D, true)}
      {box(0, GA_W, GA_D, true)}
      <circle cx={cx} cy={SPOT} r={0.25} fill="var(--lu-line)" />
      <path d={`M ${cx - half} ${PA_D} A ${R} ${R} 0 0 0 ${cx + half} ${PA_D}`} {...line} />
      <rect x={cx - GOAL_W / 2} y={-GOAL_D} width={GOAL_W} height={GOAL_D} {...line} />
      {/* unten (eigenes Tor) */}
      {box(L, PA_W, PA_D, false)}
      {box(L, GA_W, GA_D, false)}
      <circle cx={cx} cy={L - SPOT} r={0.25} fill="var(--lu-line)" />
      <path d={`M ${cx - half} ${L - PA_D} A ${R} ${R} 0 0 1 ${cx + half} ${L - PA_D}`} {...line} />
      <rect x={cx - GOAL_W / 2} y={L} width={GOAL_W} height={GOAL_D} {...line} />
      {/* Eckviertelkreise r = 1 m */}
      <path d="M 1 0 A 1 1 0 0 1 0 1" {...line} />
      <path d={`M ${W - 1} 0 A 1 1 0 0 0 ${W} 1`} {...line} />
      <path d={`M 0 ${L - 1} A 1 1 0 0 1 1 ${L}`} {...line} />
      <path d={`M ${W} ${L - 1} A 1 1 0 0 0 ${W - 1} ${L}`} {...line} />
    </svg>
  );
}
