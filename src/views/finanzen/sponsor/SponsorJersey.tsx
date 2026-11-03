// =============================================================================
// Sponsoring — Heimtrikot in Vereinsfarben mit den Logos der Trikot-Partner:
// Brust (Druck in Kontrastfarbe), Ausrüster (klein auf der linken Brust),
// Ärmel (ab 2017/18). Freie Flächen gestrichelt. Die Logos liegen als eigene
// Ebene über <JerseySVG> (gleiches 200×210-Raster), damit auch ein hochgeladenes
// Trikotbild bedruckt wird. Bild-Slot fürs Trikotfoto siehe docs/bilder/BILDER.md.
// =============================================================================
import JerseySVG, { type JerseyPattern } from '../../../components/JerseySVG';
import { getClubKitDisplay } from '../../../data/kits';
import type { Club } from '../../../types';
import type { SponsorDeal } from '../../../types/sponsor';
import { SponsorLogo } from './SponsorLogo';
import type { SpTarget } from './model';
import type { SponsorUi } from './useSponsorUi';

/** Helligkeit 0–1 einer #rrggbb-Farbe. */
function luma(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

export function SponsorJersey({ club, brust, ausruester, aermel, year, ui, aermelOpen, size = 360 }: {
  club: Club; brust?: SponsorDeal; ausruester?: SponsorDeal; aermel?: SponsorDeal; year: number; ui: SponsorUi;
  /** Ärmelfläche vermarktbar (sonst Liga-Partner bzw. leer). */
  aermelOpen: boolean;
  size?: number;
}) {
  const kit = getClubKitDisplay(club, 'home');
  const ink = luma(kit.primary) > 0.55 ? '#16181c' : '#f6f7f9';
  const zone = (t: SpTarget, label: string, x: number, y: number, w: number, h: number, children: JSX.Element | null, rot = 0) => (
    <g className={`sp3-zone ${ui.isOpen(t) ? 'on' : ''}`} {...ui.bind(t, label)} transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="4" className={children ? 'sp3-zone-hit' : 'sp3-zone-free'} />
      {children}
    </g>
  );
  const since = (d: SponsorDeal) => Number(d.since.slice(0, 4));
  return (
    <div className="sp3-jersey">
      {kit.image ? <JerseySVG image={kit.image} size={size} />
        : <JerseySVG primary={kit.primary} secondary={kit.secondary} pattern={kit.pattern as JerseyPattern} size={size} />}
      <svg className="sp3-jersey-over" viewBox="0 0 200 210" aria-hidden={false}>
        {zone(brust ? { kind: 'deal', id: brust.id } : { kind: 'free', slot: 'brust' }, 'Brustsponsor', 64, 84, 72, 34,
          brust ? <svg x={64} y={84} width={72} height={34} viewBox="0 0 120 50"><SponsorLogo name={brust.partner} industry={brust.industry} year={since(brust)} variant="chest" ink={ink} /></svg>
            : <text x={100} y={105} textAnchor="middle" className="sp3-zone-txt">Brust frei</text>)}
        {zone(ausruester ? { kind: 'deal', id: ausruester.id } : { kind: 'free', slot: 'ausruester' }, 'Ausrüster', 112, 56, 14, 14,
          ausruester ? <svg x={112} y={56} width={14} height={14} viewBox="0 0 40 40"><SponsorLogo name={ausruester.partner} industry={ausruester.industry} year={since(ausruester)} variant="mark" /></svg> : null)}
        {(aermel || aermelOpen) && zone(aermel ? { kind: 'deal', id: aermel.id } : { kind: 'free', slot: 'aermel' }, 'Ärmelsponsor', 154, 56, 16, 16,
          aermel ? <svg x={154} y={56} width={16} height={16} viewBox="0 0 40 40"><SponsorLogo name={aermel.partner} industry={aermel.industry} year={since(aermel)} variant="mark" /></svg> : null, 22)}
      </svg>
    </div>
  );
}
