import React from 'react';

/**
 * Muster-Typen für das parametrische Trikot.
 *  - solid          … einfarbig
 *  - stripes        … senkrechte Streifen (z.B. Gladbach-/HSV-Stil)
 *  - hoops          … waagerechte Ringel
 *  - sash           … diagonale Schärpe
 *  - mittelstreifen … ein breiter mittiger Längsstreifen
 *  - halves         … zweigeteilt (linke/rechte Hälfte)
 */
export type JerseyPattern =
  | 'solid'
  | 'stripes'
  | 'hoops'
  | 'sash'
  | 'mittelstreifen'
  | 'halves';

/**
 * Rechtssicheres, generisches Vektor-Trikot im flachen Dark-Theme-Stil.
 * Vollständig parametrisch aus Vereinsfarben + Muster erzeugt – kein echtes
 * Vereinslogo/-design. Skaliert frei über `size`.
 */
export function JerseySVG({
  primary = '#1e56a0',
  secondary = '#e8edf4',
  detail,
  pattern = 'solid',
  number,
  size = 160,
  image,
}: {
  /** Grundfarbe (Trikot-Body). */
  primary?: string;
  /** Zweitfarbe (Muster/Streifen). */
  secondary?: string;
  /** Detailfarbe für Kragen & Ärmel (Default: Zweitfarbe bzw. heller Kontrast). */
  detail?: string;
  /** Muster-Typ. */
  pattern?: JerseyPattern;
  /** Optionale Rückennummer. */
  number?: number | string;
  /** Darstellungsgröße in Pixeln (Breite). */
  size?: number;
  /**
   * Optionales hochgeladenes Trikotbild (Data-URL). Wenn gesetzt, wird dieses
   * Bild statt des generierten Vektor-Trikots angezeigt (überall bevorzugt).
   */
  image?: string;
}) {
  const rid = React.useId().replace(/[:]/g, '');
  const clipId = `jc-${rid}`;
  const shId = `js-${rid}`;
  const W = 200;
  const H = 210;

  // Hochgeladenes Trikotbild hat Vorrang vor dem generierten SVG.
  if (image) {
    return (
      <img
        key={image}
        src={image}
        width={size}
        height={(size * H) / W}
        alt="Vereinstrikot"
        style={{ width: size, height: (size * H) / W, objectFit: 'contain', display: 'block' }}
      />
    );
  }

  // Ob die Zweitfarbe sich sichtbar von der Grundfarbe unterscheidet.
  const norm = (c: string) => (c || '').trim().toLowerCase();
  const secDiffers = !!secondary && norm(secondary) !== norm(primary);
  const det = detail ?? (secDiffers ? secondary : '#e8edf4');

  // Trikot-Silhouette (Body inkl. Ärmel), im Uhrzeigersinn, mit V-Ausschnitt.
  const outline =
    'M 82 26 L 58 34 L 40 40 L 22 82 L 52 92 L 60 74 L 62 196 ' +
    'Q 62 202 68 202 L 132 202 Q 138 202 138 196 L 140 74 L 148 92 ' +
    'L 178 82 L 160 40 L 142 34 L 118 26 L 100 50 Z';

  const patternEls = () => {
    switch (pattern) {
      case 'stripes': {
        const out: React.ReactNode[] = [];
        for (let x = 20; x < 180; x += 30) {
          out.push(<rect key={x} x={x} y={0} width={15} height={H} fill={secondary} />);
        }
        return out;
      }
      case 'hoops': {
        const out: React.ReactNode[] = [];
        for (let y = 34; y < H; y += 34) {
          out.push(<rect key={y} x={0} y={y} width={W} height={17} fill={secondary} />);
        }
        return out;
      }
      case 'sash':
        return <polygon points="18,58 52,36 182,168 148,190" fill={secondary} />;
      case 'mittelstreifen':
        return <rect x={86} y={0} width={28} height={H} fill={secondary} />;
      case 'halves':
        return <rect x={100} y={0} width={100} height={H} fill={secondary} />;
      case 'solid':
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={size}
      height={(size * H) / W}
      style={{ display: 'block' }}
      role="img"
      aria-label="Vereinstrikot"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={outline} />
        </clipPath>
        <linearGradient id={shId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.24" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* Grundfarbe */}
        <rect x={0} y={0} width={W} height={H} fill={primary} />
        {/* Muster */}
        {patternEls()}
        {/* Ärmel-Akzent in Detailfarbe */}
        <path d="M 40 40 L 22 82 L 52 92 L 60 74 Z" fill={det} fillOpacity="0.92" />
        <path d="M 160 40 L 178 82 L 148 92 L 140 74 Z" fill={det} fillOpacity="0.92" />
        {/* sanfte Licht/Schatten-Modellierung */}
        <rect x={0} y={0} width={W} height={H} fill={`url(#${shId})`} />
      </g>

      {/* Kragen (V-Ausschnitt) */}
      <path
        d="M 82 26 L 100 50 L 118 26"
        fill="none"
        stroke={det}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* feine Außenkontur für saubere Kanten auf dunklem Grund */}
      <path
        d={outline}
        fill="none"
        stroke="#0a0e14"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {number != null && number !== '' && (
        <text
          x={100}
          y={152}
          textAnchor="middle"
          fontSize="74"
          fontWeight={800}
          fill="#f5f7fa"
          stroke="#0a0e14"
          strokeWidth="2"
          style={{ paintOrder: 'stroke' }}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {number}
        </text>
      )}
    </svg>
  );
}

export default JerseySVG;
