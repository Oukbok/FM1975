// =============================================================================
// <CrystalStarTrophy>: der Kristallstern (Fußballer des Jahres) als Bild – Foto
// `images/trophies/player-of-the-year.webp` (`PLAYER_OF_THE_YEAR_PHOTO`, Kristallstern auf
// schwarzem Sockel); lädt es nicht, bleibt die gezeichnete Trophäe `CrystalStarArt` (eigene
// Zeichnung, kein Markenlogo). Eingesetzt in der Gala (screens/gala/), im Kopf von
// Statistiken › Auszeichnungen (GoldenBallTop.tsx) und im Spielerprofil (Karriere › Auszeichnungen).
// Größe: `size` = Breite, Höhe = 1,25 × Breite (Foto quadratnah 1000 × 1100, mittig eingepasst).
// =============================================================================
import { useState } from 'react';
import { PLAYER_OF_THE_YEAR_PHOTO } from '../../data/trophyImages';
import { preloadImage } from '../../ui/imagePreload';

// Vorladen, sobald der Baustein gebraucht wird (Gala/Auszeichnungen) – kein Aufploppen beim Enthüllen.
preloadImage(PLAYER_OF_THE_YEAR_PHOTO, { keep: true });

/** Gezeichneter Rückfall: fünfzackiger Stern mit Graten auf schlankem Sockel. */
export function CrystalStarArt({ size = 180, className = 'gb-trophy' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size * 1.25} viewBox="0 0 160 200" aria-hidden>
      <defs>
        <radialGradient id="gbBall" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="var(--text)" stopOpacity="0.95" />
          <stop offset="22%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.9" />
        </radialGradient>
        <linearGradient id="gbBase" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--panel-2)" />
          <stop offset="50%" stopColor="var(--elevated)" />
          <stop offset="100%" stopColor="var(--bg-2)" />
        </linearGradient>
      </defs>
      <path d="M80 12 L96 54 L141 56 L106 84 L118 128 L80 103 L42 128 L54 84 L19 56 L64 54 Z" fill="url(#gbBall)" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M80 26 L92 59 L128 61 L100 82 L109 116 L80 97 L51 116 L60 82 L32 61 L68 59 Z" fill="none" stroke="var(--bg)" strokeOpacity="0.3" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M80 76 L80 12 M80 76 L141 56 M80 76 L118 128 M80 76 L42 128 M80 76 L19 56" stroke="var(--bg)" strokeOpacity="0.18" strokeWidth="1.2" />
      <path d="M62 136 L98 136 L92 150 L68 150 Z" fill="url(#gbBase)" />
      <rect x="56" y="150" width="48" height="12" rx="2" fill="url(#gbBase)" />
      <rect x="46" y="162" width="68" height="22" rx="3" fill="url(#gbBase)" stroke="var(--border)" />
      <rect x="58" y="169" width="44" height="8" rx="1" fill="var(--gold)" opacity="0.55" />
    </svg>
  );
}

/** Kristallstern: Foto, bei Ladefehler die Zeichnung. `className` gilt für beide (Animation/Schatten). */
export function CrystalStarTrophy({ size = 180, className = 'gb-trophy', title }: { size?: number; className?: string; title?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return title ? <span className="ks-wrap" title={title}><CrystalStarArt size={size} className={className} /></span> : <CrystalStarArt size={size} className={className} />;
  return (
    <img className={`${className} ks-photo`} src={PLAYER_OF_THE_YEAR_PHOTO} width={size} height={Math.round(size * 1.25)}
      alt="" title={title} draggable={false} onError={() => setFailed(true)} />
  );
}
