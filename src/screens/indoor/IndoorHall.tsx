// =============================================================================
// Gezeichnete Halle hinter der Hallen-Show (ohne Bilder): Stahlträger-Dach mit
// Hallenlicht und Lichtkegeln, Gegentribüne und Seitentribünen mit Publikum,
// Rundumbande mit Werbefeldern, Spielfläche in Perspektive – bis 1990 heller
// Kunststoffboden mit Handball-Linien, danach Kunstrasen-Teppich (Annahme nach
// Fotos der Masters-Endrunden). Ab 1990 hängt ein Videowürfel unter dem Dach.
// Foto-Slot: data/indoorImages.ts (bilder/indoor/halle-<epoche>.webp).
// Farben: Tokens --hall-* in 00-base.css, Bewegung nur per CSS (28-indoor.css).
// =============================================================================
import { memo, useState } from 'react';
import { hallPhoto } from '../../data/indoorImages';

const jitter = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

/** Publikum als Punktreihen auf einer Tribünenfläche (feste Pseudo-Zufallswerte). */
function Crowd({ x0, x1, y0, y1, rows, seed, slant = 0 }: { x0: number; x1: number; y0: number; y1: number; rows: number; seed: number; slant?: number }) {
  const out: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    const y = y0 + ((y1 - y0) * r) / Math.max(1, rows - 1);
    const shift = slant * (r / Math.max(1, rows - 1));
    const step = 13 + r * 0.6;
    for (let x = x0 + shift + (r % 2) * 6; x < x1 - shift; x += step) {
      const j = jitter(x + seed, r);
      if (j < 0.12) continue;
      out.push(<circle key={`${r}-${x.toFixed(0)}`} cx={x} cy={y + (j - 0.5) * 3} r={3.2 + r * 0.12} className={`ih-fan f${Math.floor(j * 4)}`} />);
    }
  }
  return <g>{out}</g>;
}

export const IndoorHall = memo(function IndoorHall({ year, className = '' }: { year: number; className?: string }) {
  const turf = year >= 1991;
  const cube = year >= 1990;
  const photo = hallPhoto(year);
  const [photoOk, setPhotoOk] = useState(true);
  const lamps = Array.from({ length: 8 }, (_, i) => 150 + i * 230);
  const ads = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className={`ih-hall ${className}`} aria-hidden>
      <svg className="ih-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ih-air" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--hall-roof)" />
            <stop offset="0.5" stopColor="var(--hall-air)" />
            <stop offset="1" stopColor="var(--hall-roof)" />
          </linearGradient>
          <radialGradient id="ih-glow">
            <stop offset="0" stopColor="var(--hall-light)" stopOpacity="0.6" />
            <stop offset="0.4" stopColor="var(--hall-light)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--hall-light)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ih-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--hall-light)" stopOpacity="0.13" />
            <stop offset="1" stopColor="var(--hall-light)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ih-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={turf ? 'var(--hall-turf-0)' : 'var(--hall-floor-0)'} />
            <stop offset="1" stopColor={turf ? 'var(--hall-turf-1)' : 'var(--hall-floor-1)'} />
          </linearGradient>
          <pattern id="ih-truss" width="80" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 0 L40 44 L80 0 M0 44 L80 44 M0 0 L80 0" className="ih-truss-line" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#ih-air)" />
        {/* Dach: drei Fachwerkträger */}
        {[26, 118].map((y) => <rect key={y} x="0" y={y} width="1920" height="44" fill="url(#ih-truss)" className="ih-truss" />)}
        {/* Gegentribüne (hinter dem Spielfeld) */}
        <path className="ih-stand" d="M0 230 L1920 230 L1920 470 L0 470 Z" />
        {Array.from({ length: 9 }, (_, i) => <line key={i} className="ih-row" x1="0" x2="1920" y1={252 + i * 24} y2={252 + i * 24} />)}
        <Crowd x0={10} x1={1910} y0={246} y1={446} rows={9} seed={7} />
        {[320, 800, 1120, 1600].map((x) => <rect key={x} className="ih-stair" x={x} y="236" width="16" height="234" />)}
        {/* Seitentribünen (schräg ins Bild) */}
        <path className="ih-stand side" d="M0 300 L250 470 L250 1080 L0 1080 Z" />
        <path className="ih-stand side" d="M1920 300 L1670 470 L1670 1080 L1920 1080 Z" />
        <Crowd x0={8} x1={240} y0={520} y1={1040} rows={18} seed={3} />
        <Crowd x0={1680} x1={1912} y0={520} y1={1040} rows={18} seed={11} />
        {/* Spielfläche in Perspektive + Linien */}
        <path d="M250 508 L1670 508 L1920 1080 L0 1080 Z" fill="url(#ih-floor)" />
        {turf ? (
          Array.from({ length: 8 }, (_, i) => (
            <path key={i} className="ih-turf-stripe" d={`M${250 + i * 177.5} 508 L${250 + i * 177.5 + 88} 508 L${(250 + i * 177.5 + 88 - 960) * 1.35 + 960} 1080 L${(250 + i * 177.5 - 960) * 1.35 + 960} 1080 Z`} />
          ))
        ) : (
          <g className="ih-court-lines alt">
            {/* Handball-/Basketball-Linien des Mehrzweckbodens */}
            <path d="M320 540 L1600 540" />
            <ellipse cx="960" cy="760" rx="300" ry="90" />
            <path d="M560 1080 Q960 820 1360 1080" />
          </g>
        )}
        <g className="ih-court-lines">
          <path d="M290 528 L1630 528 M960 528 L960 1080" />
          <ellipse cx="960" cy="700" rx="150" ry="44" />
          <path d="M700 528 Q960 600 1220 528" />
        </g>
        {/* Rundumbande hinten mit Werbefeldern */}
        <rect className="ih-board" x="236" y="470" width="1448" height="40" rx="3" />
        {ads.map((i) => (
          <g key={i}>
            <rect className={`ih-ad a${i % 3}`} x={246 + i * 120} y="476" width="108" height="28" rx="2" />
            <rect className="ih-ad-txt" x={262 + i * 120} y="487" width={40 + jitter(i, 5) * 40} height="6" rx="2" />
          </g>
        ))}
        {/* Seitenbanden */}
        <path className="ih-board" d="M236 470 L250 470 L0 1080 L-30 1080 Z" />
        <path className="ih-board" d="M1684 470 L1670 470 L1920 1080 L1950 1080 Z" />
        {/* Hallenlicht + Lichtkegel */}
        {lamps.map((x, i) => (
          <g key={x}>
            <path className={`ih-beam ${i % 2 ? 'b' : ''}`} d={`M${x - 14} 80 L${x + 14} 80 L${x + 150} 1080 L${x - 150} 1080 Z`} fill="url(#ih-beam)" />
            <g className="ih-lamp" style={{ animationDelay: `${(-jitter(i, 1) * 5).toFixed(2)}s` }}>
              <circle cx={x} cy="78" r="58" fill="url(#ih-glow)" />
              <rect x={x - 22} y="70" width="44" height="14" rx="3" className="ih-lamp-body" />
              <rect x={x - 17} y="80" width="34" height="5" rx="2" className="ih-lamp-core" />
            </g>
          </g>
        ))}
        {cube && (
          <g className="ih-cube">
            <line x1="960" y1="0" x2="960" y2="150" className="ih-cable" />
            <path d="M880 150 L1040 150 L1028 226 L892 226 Z" className="ih-cube-body" />
            <rect x="900" y="160" width="120" height="54" rx="2" className="ih-cube-screen" />
          </g>
        )}
      </svg>
      {photo && photoOk && <img className="ih-photo" src={photo} alt="" onError={() => setPhotoOk(false)} />}
      <div className="ih-shade" />
    </div>
  );
});
