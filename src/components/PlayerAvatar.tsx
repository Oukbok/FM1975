// =============================================================================
// PlayerAvatar — Deterministisches SVG-Avatar-System
// 20 Gesichter · 10 Hauttöne · 20 Frisuren (1980er) · Vereinstrikot + Wappen
// =============================================================================
import { Player, Club } from '../types';

// -----------------------------------------------------------------------------
// Deterministischer Hash aus String (für stabilen Seed pro Spieler)
// -----------------------------------------------------------------------------
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// -----------------------------------------------------------------------------
// 10 Hauttöne: sehr hell (nordeuropäisch) → schwarz (afrikanisch)
// -----------------------------------------------------------------------------
const SKIN_TONES = [
  { base: '#ffe0c4', shadow: '#f0c9a8' },
  { base: '#f8d5b0', shadow: '#e6bd93' },
  { base: '#f0c39a', shadow: '#dcaa7d' },
  { base: '#e6b088', shadow: '#cf9569' },
  { base: '#d69c6f', shadow: '#bd8054' },
  { base: '#c08552', shadow: '#a56b3d' },
  { base: '#a56b3d', shadow: '#89542c' },
  { base: '#8a5629', shadow: '#6f421d' },
  { base: '#6b4322', shadow: '#523216' },
  { base: '#4d2f18', shadow: '#3a2210' },
];

// Natürliche Haarfarben (helle Hauttöne)
const LIGHT_HAIR = ['#2a2a2a', '#4a3520', '#6b4a2a', '#8a5a2a', '#b5822f', '#d4a94f', '#e0c070', '#8a4a2a', '#5a5a5a', '#1a1a1a'];
// Dunkle Haarfarben (dunkle Hauttöne → immer dunkel)
const DARK_HAIR = ['#1a1a1a', '#20140c', '#2a1a10', '#0e0e0e', '#3a2418'];

export interface AvatarConfig {
  faceId: number;      // 0-19
  skinTone: number;    // 0-9
  hairStyle: number;   // 0-19
  hairColor: string;
  facialHair: number;  // 0-3 (keiner, Schnauzer, Vollbart, Koteletten)
}

// -----------------------------------------------------------------------------
// Generator: deterministisch aus player.id
// -----------------------------------------------------------------------------
export function generatePlayerAvatar(player: Player, _club?: Club): AvatarConfig {
  const seed = hashString(player.id || player.fullName || 'x');
  const skinTone = seed % 10;
  const faceId = Math.floor(seed / 10) % 20;
  const hairStyle = Math.floor(seed / 200) % 20;
  const facialHair = Math.floor(seed / 4000) % 4;

  // Haarfarbe ethnisch passend: dunkle Haut → dunkle Haare
  let hairColor: string;
  if (skinTone >= 7) {
    hairColor = DARK_HAIR[Math.floor(seed / 16000) % DARK_HAIR.length];
  } else if (skinTone >= 5) {
    // mittlere Hauttöne: überwiegend dunkel
    const pool = ['#1a1a1a', '#2a1a10', '#3a2418', '#4a3520', '#20140c'];
    hairColor = pool[Math.floor(seed / 16000) % pool.length];
  } else {
    hairColor = LIGHT_HAIR[Math.floor(seed / 16000) % LIGHT_HAIR.length];
  }
  // Glatze (hairStyle 19) → keine Farbe relevant
  return { faceId, skinTone, hairStyle, hairColor, facialHair };
}

function darken(hex: string, amt = 0.75): string {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.slice(0, 2), 16) * amt);
  const g = Math.round(parseInt(c.slice(2, 4), 16) * amt);
  const b = Math.round(parseInt(c.slice(4, 6), 16) * amt);
  return `rgb(${r},${g},${b})`;
}

// Kontrastreiche Textfarbe für Wappen-Buchstaben
function contrastColor(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#fff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#111' : '#fff';
}

// -----------------------------------------------------------------------------
// Augen-Varianten (aus faceId abgeleitet)
// -----------------------------------------------------------------------------
function Eyes({ faceId }: { faceId: number }) {
  const type = faceId % 4;
  const eyeColor = '#3a2a1a';
  if (type === 0) {
    return (
      <g>
        <ellipse cx="40" cy="54" rx="3.2" ry="2.6" fill="#fff" />
        <ellipse cx="60" cy="54" rx="3.2" ry="2.6" fill="#fff" />
        <circle cx="40.5" cy="54" r="1.5" fill={eyeColor} />
        <circle cx="60.5" cy="54" r="1.5" fill={eyeColor} />
      </g>
    );
  }
  if (type === 1) {
    return (
      <g>
        <ellipse cx="40" cy="54" rx="3.6" ry="2.2" fill="#fff" />
        <ellipse cx="60" cy="54" rx="3.6" ry="2.2" fill="#fff" />
        <circle cx="40" cy="54" r="1.6" fill={eyeColor} />
        <circle cx="60" cy="54" r="1.6" fill={eyeColor} />
      </g>
    );
  }
  if (type === 2) {
    return (
      <g>
        <ellipse cx="40" cy="54" rx="2.8" ry="2.8" fill="#fff" />
        <ellipse cx="60" cy="54" rx="2.8" ry="2.8" fill="#fff" />
        <circle cx="40" cy="54.3" r="1.5" fill={eyeColor} />
        <circle cx="60" cy="54.3" r="1.5" fill={eyeColor} />
      </g>
    );
  }
  return (
    <g>
      <path d="M36.5 54 Q40 51.5 43.5 54" stroke={eyeColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M56.5 54 Q60 51.5 63.5 54" stroke={eyeColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="53.5" r="1.2" fill={eyeColor} />
      <circle cx="60" cy="53.5" r="1.2" fill={eyeColor} />
    </g>
  );
}

// Augenbrauen
function Brows({ faceId, color }: { faceId: number; color: string }) {
  const type = Math.floor(faceId / 4) % 3;
  if (type === 0) {
    return (
      <g stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <path d="M36 49 Q40 47.5 44 49" fill="none" />
        <path d="M56 49 Q60 47.5 64 49" fill="none" />
      </g>
    );
  }
  if (type === 1) {
    return (
      <g stroke={color} strokeWidth="2" strokeLinecap="round">
        <line x1="36" y1="48.5" x2="44" y2="48.5" />
        <line x1="56" y1="48.5" x2="64" y2="48.5" />
      </g>
    );
  }
  return (
    <g stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M36 48 L44 49.5" fill="none" />
      <path d="M56 49.5 L64 48" fill="none" />
    </g>
  );
}

// Nasen-Varianten
function Nose({ faceId, shadow }: { faceId: number; shadow: string }) {
  const type = Math.floor(faceId / 2) % 4;
  if (type === 0) return <path d="M50 56 L48 63 Q50 65 52 63" fill="none" stroke={shadow} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />;
  if (type === 1) return <path d="M49.5 57 L47.5 64 L52.5 64 L50.5 57" fill={shadow} opacity="0.55" />;
  if (type === 2) return <path d="M50 57 L48.5 63 Q50 64.5 51.5 63" fill="none" stroke={shadow} strokeWidth="1.6" strokeLinecap="round" />;
  return <path d="M50 56 L47 63 Q50 65.5 53 63" fill="none" stroke={shadow} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />;
}

// Mund-Varianten
function Mouth({ faceId }: { faceId: number }) {
  const type = Math.floor(faceId / 3) % 4;
  const lip = '#a35244';
  if (type === 0) return <path d="M44 71 Q50 74.5 56 71" fill="none" stroke={lip} strokeWidth="1.8" strokeLinecap="round" />;
  if (type === 1) return <path d="M45 71.5 L55 71.5" fill="none" stroke={lip} strokeWidth="1.8" strokeLinecap="round" />;
  if (type === 2) return <path d="M44 71 Q50 76 56 71 Q50 73 44 71" fill={lip} opacity="0.8" />;
  return <path d="M45 71 Q50 73.5 55 71" fill="none" stroke={lip} strokeWidth="2.2" strokeLinecap="round" />;
}

// -----------------------------------------------------------------------------
// Gesichtsform (aus faceId)
// -----------------------------------------------------------------------------
function faceShape(faceId: number): string {
  const type = faceId % 5;
  // Standard oval
  if (type === 0) return 'M50 34 C64 34 70 46 70 60 C70 76 61 86 50 86 C39 86 30 76 30 60 C30 46 36 34 50 34 Z';
  // Rundlich
  if (type === 1) return 'M50 35 C65 35 71 48 71 61 C71 77 62 85 50 85 C38 85 29 77 29 61 C29 48 35 35 50 35 Z';
  // Kantig
  if (type === 2) return 'M50 34 C63 34 69 45 69 59 C69 73 63 85 50 85 C37 85 31 73 31 59 C31 45 37 34 50 34 Z';
  // Schmal/länglich
  if (type === 3) return 'M50 33 C62 33 68 46 68 61 C68 78 60 87 50 87 C40 87 32 78 32 61 C32 46 38 33 50 33 Z';
  // Breit
  return 'M50 35 C66 35 73 47 73 60 C73 75 62 84 50 84 C38 84 27 75 27 60 C27 47 34 35 50 35 Z';
}

// =============================================================================
// FRISUREN (20 · 1980er) — jede als Funktion (Farbe → JSX)
// =============================================================================
function Hair({ style, color }: { style: number; color: string }) {
  const dk = darken(color, 0.72);
  switch (style) {
    case 0: // Kurzhaar / Seitenscheitel
      return <path d="M30 55 C30 40 38 31 50 31 C62 31 70 40 70 55 C70 47 64 42 55 42 C58 39 48 37 44 40 C38 38 32 46 30 55 Z" fill={color} />;
    case 1: // Vokuhila (Mullet)
      return (
        <g fill={color}>
          <path d="M31 54 C31 39 39 31 50 31 C61 31 69 39 69 54 C69 46 63 41 55 41 C50 38 44 39 40 42 C35 45 32 49 31 54 Z" />
          <path d="M31 52 C28 62 29 78 33 92 L38 90 C35 78 35 64 36 56 Z" />
          <path d="M69 52 C72 62 71 78 67 92 L62 90 C65 78 65 64 64 56 Z" />
        </g>
      );
    case 2: // Dauerwelle (Perm) — voluminös lockig
      return (
        <g fill={color}>
          <circle cx="35" cy="42" r="8" /><circle cx="45" cy="35" r="9" /><circle cx="56" cy="35" r="9" />
          <circle cx="66" cy="43" r="8" /><circle cx="30" cy="52" r="6" /><circle cx="71" cy="53" r="6" />
          <circle cx="40" cy="30" r="7" /><circle cx="61" cy="30" r="7" />
          <path d="M30 52 C30 40 38 30 50 30 C62 30 71 40 71 52 L71 46 C71 40 62 37 50 37 C38 37 30 40 30 47 Z" fill={dk} />
        </g>
      );
    case 3: // Afro
      return (
        <g fill={color}>
          <circle cx="50" cy="40" r="24" />
          <path d="M28 55 C28 45 34 34 50 34 C66 34 72 45 72 55 L72 50 C72 42 63 39 50 39 C37 39 28 42 28 50 Z" fill={dk} />
        </g>
      );
    case 4: // Seitenscheitel klassisch
      return <path d="M30 54 C30 39 39 31 50 31 C61 31 70 39 70 54 C68 45 60 42 52 43 C55 40 47 39 43 41 C37 43 32 47 30 54 Z" fill={color} />;
    case 5: // Mittelscheitel (Feathered)
      return (
        <g fill={color}>
          <path d="M30 55 C30 40 39 31 50 31 C61 31 70 40 70 55 C68 46 60 41 51 42 L50 33 L49 42 C40 41 32 46 30 55 Z" />
          <path d="M30 55 C28 50 30 44 34 41 L36 45 C33 48 31 52 32 56 Z" />
          <path d="M70 55 C72 50 70 44 66 41 L64 45 C67 48 69 52 68 56 Z" />
        </g>
      );
    case 6: // Lange Haare (Rocker)
      return (
        <g fill={color}>
          <path d="M30 54 C30 38 39 30 50 30 C61 30 70 38 70 54 C70 44 62 40 50 40 C38 40 30 44 30 54 Z" />
          <path d="M30 50 C26 62 27 80 30 94 L36 92 C33 78 33 62 34 54 Z" />
          <path d="M70 50 C74 62 73 80 70 94 L64 92 C67 78 67 62 66 54 Z" />
        </g>
      );
    case 7: // Pompadour / Tolle
      return (
        <g fill={color}>
          <path d="M32 52 C32 36 40 29 50 29 C60 29 68 36 68 52 C66 44 60 42 53 42 C56 34 62 33 64 28 C58 26 42 26 36 30 C33 38 32 45 32 52 Z" />
        </g>
      );
    case 8: // Kurz gelockt
      return (
        <g fill={color}>
          <circle cx="37" cy="44" r="6" /><circle cx="46" cy="39" r="6.5" /><circle cx="55" cy="39" r="6.5" />
          <circle cx="63" cy="44" r="6" /><circle cx="33" cy="50" r="5" /><circle cx="67" cy="50" r="5" />
          <path d="M31 52 C31 41 39 34 50 34 C61 34 69 41 69 52 L69 47 C69 41 61 39 50 39 C39 39 31 41 31 47 Z" fill={dk} />
        </g>
      );
    case 9: // Glatze mit Seitenkranz
      return (
        <g fill={color}>
          <path d="M30 58 C29 51 31 46 34 44 L37 50 C34 52 33 55 33 59 Z" />
          <path d="M70 58 C71 51 69 46 66 44 L63 50 C66 52 67 55 67 59 Z" />
          <path d="M30 58 C30 62 32 66 35 68 L37 63 C34 62 33 60 33 58 Z" />
          <path d="M70 58 C70 62 68 66 65 68 L63 63 C66 62 67 60 67 58 Z" />
        </g>
      );
    case 10: // Buzzcut (sehr kurz)
      return <path d="M31 55 C31 40 39 32 50 32 C61 32 69 40 69 55 C67 47 60 44 50 44 C40 44 33 47 31 55 Z" fill={color} opacity="0.92" />;
    case 11: // Wellig mittellang
      return (
        <g fill={color}>
          <path d="M30 56 C30 39 39 31 50 31 C61 31 70 39 70 56 C68 47 61 43 52 43 C50 40 44 41 40 44 C35 47 31 50 30 56 Z" />
          <path d="M30 54 C28 60 28 70 31 78 L35 76 C32 70 32 62 33 56 Z" />
          <path d="M70 54 C72 60 72 70 69 78 L65 76 C68 70 68 62 67 56 Z" />
        </g>
      );
    case 12: // Igel / Spikes
      return (
        <g fill={color}>
          <path d="M32 50 L34 36 L39 47 L43 33 L47 46 L50 32 L53 46 L57 33 L61 47 L66 36 L68 50 C64 44 56 42 50 42 C44 42 36 44 32 50 Z" />
        </g>
      );
    case 13: // Zurückgekämmt (Slick)
      return <path d="M31 53 C31 38 40 30 50 30 C60 30 69 38 69 53 C69 43 62 39 50 39 C43 39 36 41 33 45 C40 40 55 40 62 43 C56 39 40 39 31 53 Z" fill={color} />;
    case 14: // Locken lang (Player-Perm)
      return (
        <g fill={color}>
          <circle cx="34" cy="44" r="7" /><circle cx="44" cy="36" r="8" /><circle cx="56" cy="36" r="8" /><circle cx="66" cy="44" r="7" />
          <path d="M29 50 C26 64 28 82 32 94 L38 91 C34 78 34 62 35 52 Z" />
          <path d="M71 50 C74 64 72 82 68 94 L62 91 C66 78 66 62 65 52 Z" />
          <circle cx="30" cy="56" r="5" /><circle cx="70" cy="56" r="5" />
        </g>
      );
    case 15: // Kurz mit Pony
      return <path d="M31 55 C31 40 39 31 50 31 C61 31 69 40 69 55 C69 48 65 45 60 45 L58 51 L54 45 L50 51 L46 45 L42 51 L40 45 C35 45 31 48 31 55 Z" fill={color} />;
    case 16: // Undercut / Seiten kurz
      return (
        <g fill={color}>
          <path d="M34 50 C34 37 41 30 50 30 C59 30 66 37 66 50 C66 43 60 40 52 40 C55 36 47 37 44 39 C38 41 35 45 34 50 Z" />
        </g>
      );
    case 17: // Fransig lang
      return (
        <g fill={color}>
          <path d="M30 55 C30 39 39 30 50 30 C61 30 70 39 70 55 C68 46 60 42 50 42 C40 42 32 46 30 55 Z" />
          <path d="M32 52 L30 68 L34 60 L36 70 L39 60 L41 68 L43 58 Z" />
          <path d="M68 52 L70 68 L66 60 L64 70 L61 60 L59 68 L57 58 Z" />
        </g>
      );
    case 18: // Voluminös (Big Hair)
      return (
        <g fill={color}>
          <path d="M26 52 C26 34 37 26 50 26 C63 26 74 34 74 52 C74 42 64 38 50 38 C36 38 26 42 26 52 Z" />
          <ellipse cx="30" cy="46" rx="7" ry="10" /><ellipse cx="70" cy="46" rx="7" ry="10" />
        </g>
      );
    case 19: // Komplette Glatze
    default:
      return null;
  }
}

// =============================================================================
// Haupt-Komponente
// =============================================================================
const SIZES = { small: 40, medium: 88, large: 200 };

interface Props {
  player: Player;
  club?: Club;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function PlayerAvatar({ player, club, size = 'medium', className }: Props) {
  const cfg = generatePlayerAvatar(player, club);
  const skin = SKIN_TONES[cfg.skinTone];
  const px = SIZES[size];
  const uid = (player.id || player.fullName || 'a').replace(/[^a-zA-Z0-9]/g, '');

  const primary = club?.colors.primary ?? '#2a394f';
  const secondary = club?.colors.secondary ?? '#141b26';
  const crestLetter = (club?.shortName ?? '').slice(0, 3);

  // Bartfarbe = Haarfarbe (leicht dunkler)
  const beardColor = darken(cfg.hairColor, 0.9);

  return (
    <svg
      width={px}
      height={px * 1.15}
      viewBox="0 0 100 115"
      className={className}
      style={{ display: 'block', borderRadius: size === 'small' ? 8 : 12 }}
      role="img"
      aria-label={`Avatar ${player.fullName}`}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f2a3a" />
          <stop offset="100%" stopColor="#0f141c" />
        </linearGradient>
        <linearGradient id={`jersey-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={darken(primary, 0.8)} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}><rect x="0" y="0" width="100" height="115" rx="12" /></clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        {/* Hintergrund */}
        <rect x="0" y="0" width="100" height="115" fill={`url(#bg-${uid})`} />

        {/* Trikot ab Schultern */}
        <path d="M18 115 L18 100 C18 90 30 84 50 84 C70 84 82 90 82 100 L82 115 Z" fill={`url(#jersey-${uid})`} />
        {/* Kragen */}
        <path d="M40 85 Q50 92 60 85 L60 88 Q50 95 40 88 Z" fill={secondary} />
        {/* Schulterstreifen (Sekundärfarbe) */}
        <path d="M18 100 C18 92 24 87 30 85 L32 90 C26 92 22 96 22 101 Z" fill={secondary} opacity="0.85" />
        <path d="M82 100 C82 92 76 87 70 85 L68 90 C74 92 78 96 78 101 Z" fill={secondary} opacity="0.85" />

        {/* Vereinswappen klein auf Brust */}
        <g transform="translate(63,98)">
          <rect x="-7" y="-7" width="14" height="15" rx="3" fill={secondary} stroke={primary} strokeWidth="0.8" />
          <text x="0" y="3.5" textAnchor="middle" fontSize="6" fontWeight="900"
                fontFamily="Inter, sans-serif" fill={contrastColor(secondary)}>{crestLetter}</text>
        </g>

        {/* Hals */}
        <path d="M43 78 L43 88 Q50 92 57 88 L57 78 Z" fill={skin.shadow} />
        <rect x="43" y="76" width="14" height="6" fill={skin.base} />

        {/* Ohren */}
        <ellipse cx="30" cy="61" rx="3.5" ry="5" fill={skin.base} />
        <ellipse cx="70" cy="61" rx="3.5" ry="5" fill={skin.base} />
        <ellipse cx="30" cy="61" rx="1.6" ry="2.6" fill={skin.shadow} />
        <ellipse cx="70" cy="61" rx="1.6" ry="2.6" fill={skin.shadow} />

        {/* Gesicht */}
        <path d={faceShape(cfg.faceId)} fill={skin.base} />
        {/* Wangenschatten */}
        <path d="M32 62 Q30 70 36 76 L38 72 Q34 68 34 62 Z" fill={skin.shadow} opacity="0.35" />
        <path d="M68 62 Q70 70 64 76 L62 72 Q66 68 66 62 Z" fill={skin.shadow} opacity="0.35" />

        {/* Gesichtszüge */}
        <Brows faceId={cfg.faceId} color={beardColor} />
        <Eyes faceId={cfg.faceId} />
        <Nose faceId={cfg.faceId} shadow={skin.shadow} />
        <Mouth faceId={cfg.faceId} />

        {/* Gesichtsbehaarung */}
        {cfg.facialHair === 1 && ( // Schnauzer
          <path d="M44 68 Q50 71 56 68 Q50 70 44 68" fill={beardColor} stroke={beardColor} strokeWidth="1.4" />
        )}
        {cfg.facialHair === 2 && ( // Vollbart
          <path d="M33 62 C34 76 42 86 50 86 C58 86 66 76 67 62 C64 70 58 74 50 74 C42 74 36 70 33 62 Z" fill={beardColor} opacity="0.9" />
        )}
        {cfg.facialHair === 3 && ( // Koteletten
          <g fill={beardColor}>
            <path d="M32 56 L34 68 L37 67 L36 56 Z" />
            <path d="M68 56 L66 68 L63 67 L64 56 Z" />
          </g>
        )}

        {/* Haare (oberste Ebene) */}
        <Hair style={cfg.hairStyle} color={cfg.hairColor} />
      </g>
    </svg>
  );
}
