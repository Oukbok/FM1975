// =============================================================================
// ClubCrest — SVG-Vereinswappen aus Vereinsfarben + Kürzel
// =============================================================================
import { Club } from '../types';
import { resolveCrestImage } from '../data/clubOverrides';

function contrast(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#fff';
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111' : '#fff';
}

export default function ClubCrest({ club, size = 40 }: { club: Club; size?: number }) {
  // Wappen-Auflösung: spielweiter Override-Store (nach club.id) zuerst, danach
  // das save-gebundene Club.customCrest, sonst das generierte SVG-Wappen.
  const crestImg = resolveCrestImage(club);
  if (crestImg) {
    return (
      <img
        key={crestImg}
        src={crestImg}
        width={size}
        height={size}
        alt={club.name}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
      />
    );
  }
  const { primary, secondary } = club.colors;
  const label = club.shortName.slice(0, 3);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }} aria-label={club.name}>
      <path d="M20 2 L36 7 V21 C36 30 29 36 20 39 C11 36 4 30 4 21 V7 Z" fill={primary} stroke={secondary} strokeWidth="1.5" />
      <path d="M20 2 L36 7 V21 C36 30 29 36 20 39 Z" fill="rgba(0,0,0,0.12)" />
      <text x="20" y="24" textAnchor="middle" fontSize={label.length > 2 ? 10 : 13} fontWeight="900"
            fontFamily="Inter, sans-serif" fill={contrast(primary)}>{label}</text>
    </svg>
  );
}
