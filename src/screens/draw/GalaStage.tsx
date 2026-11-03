// =============================================================================
// Gala-Bühne der Auslosung (gezeichnet, ohne Bilder): Scheinwerferreihen oben,
// Lichtpunkt-Raster an den Seiten, geschwungene Bühnenkante mit Lichtern unten,
// weiche Lichtkegel. Liegt hinter Kopfleiste und Mittelkarte (DrawShow.tsx).
// Flackern/Schwenken nur per CSS (28-draw.css), bei reduzierter Bewegung aus.
// =============================================================================
import { memo } from 'react';

/** Feste Pseudo-Zufallswerte je Lampe (sonst flackern alle gleich). */
const jitter = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

function Lamp({ x, y, r, i }: { x: number; y: number; r: number; i: number }) {
  const style = { animationDelay: `${(-jitter(i, 1) * 6).toFixed(2)}s`, animationDuration: `${(3.2 + jitter(i, 2) * 3.4).toFixed(2)}s` };
  return (
    <g className="dr-lamp" style={style}>
      <circle cx={x} cy={y} r={r * 3.1} fill="url(#drg-glow)" />
      <circle cx={x} cy={y} r={r * 1.28} fill="#1a2130" stroke="#3a4455" strokeWidth="2" />
      <circle cx={x} cy={y} r={r} fill="url(#drg-core)" />
    </g>
  );
}

export const GalaStage = memo(function GalaStage() {
  const row1 = Array.from({ length: 9 }, (_, i) => 120 + i * 210);
  const row2 = Array.from({ length: 13 }, (_, i) => 60 + i * 150);
  const floor = Array.from({ length: 9 }, (_, i) => 160 + i * 200);
  return (
    <svg className="dr-gala-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="drg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gala-night-0)" />
          <stop offset="0.45" stopColor="var(--gala-night-1)" />
          <stop offset="1" stopColor="var(--gala-night-0)" />
        </linearGradient>
        <radialGradient id="drg-glow">
          <stop offset="0" stopColor="var(--gala-lamp)" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="var(--gala-lamp)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--gala-lamp)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="drg-core" cx="45%" cy="40%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="var(--gala-lamp)" />
          <stop offset="1" stopColor="#aeb9c9" />
        </radialGradient>
        <linearGradient id="drg-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gala-lamp)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--gala-lamp)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="drg-truss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a10" />
          <stop offset="1" stopColor="#161d2a" />
        </linearGradient>
        <pattern id="drg-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="2.6" fill="var(--gala-lamp)" />
        </pattern>
        <linearGradient id="drg-fadeL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="drg-fadeR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="drg-maskL"><rect x="0" y="190" width="330" height="700" fill="url(#drg-fadeL)" /></mask>
        <mask id="drg-maskR"><rect x="1590" y="190" width="330" height="700" fill="url(#drg-fadeR)" /></mask>
        <linearGradient id="drg-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--gala-lamp)" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="var(--gala-lamp)" stopOpacity="0.85" />
          <stop offset="1" stopColor="var(--gala-lamp)" stopOpacity="0.15" />
        </linearGradient>
        <filter id="drg-blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      <rect width="1920" height="1080" fill="url(#drg-sky)" />
      {/* Lichtkegel aus der Decke */}
      <g className="dr-beams">
        <polygon className="dr-beam a" points="560,150 620,150 900,1000 260,1000" fill="url(#drg-beam)" />
        <polygon className="dr-beam b" points="1300,150 1360,150 1660,1000 1020,1000" fill="url(#drg-beam)" />
      </g>
      {/* Deckentraverse mit zwei Scheinwerferreihen */}
      <path d="M0 0 H1920 V150 Q960 190 0 150 Z" fill="url(#drg-truss)" />
      <path d="M0 150 Q960 190 1920 150" fill="none" stroke="#2a3343" strokeWidth="3" />
      <line x1="0" y1="86" x2="1920" y2="86" stroke="#1d2533" strokeWidth="6" />
      {row1.map((x, i) => <Lamp key={`a${i}`} x={x} y={46} r={17} i={i} />)}
      {row2.map((x, i) => <Lamp key={`b${i}`} x={x} y={126} r={11} i={i + 20} />)}
      {/* Lichtpunkt-Raster an den Seiten */}
      <rect x="0" y="190" width="330" height="700" fill="url(#drg-dots)" mask="url(#drg-maskL)" opacity="0.55" />
      <rect x="1590" y="190" width="330" height="700" fill="url(#drg-dots)" mask="url(#drg-maskR)" opacity="0.55" />
      {/* Bogen über der Bühne */}
      <path d="M520 214 Q960 150 1400 214" fill="none" stroke="var(--gala-lamp)" strokeOpacity="0.35" strokeWidth="4" strokeDasharray="26 10" />
      {/* Bühnenboden mit geschwungener Kante */}
      <path d="M0 1000 Q960 930 1920 1000 V1080 H0 Z" fill="#0a0e16" />
      <path d="M0 1000 Q960 930 1920 1000" fill="none" stroke="url(#drg-edge)" strokeWidth="10" filter="url(#drg-blur)" />
      <path d="M0 1000 Q960 930 1920 1000" fill="none" stroke="url(#drg-edge)" strokeWidth="3" />
      <path d="M0 1028 Q960 962 1920 1028" fill="none" stroke="#1d2533" strokeWidth="2" />
      {floor.map((x, i) => {
        const t = (x - 960) / 960;
        return <Lamp key={`f${i}`} x={x} y={1040 - 52 * (1 - t * t)} r={8} i={i + 40} />;
      })}
    </svg>
  );
});
