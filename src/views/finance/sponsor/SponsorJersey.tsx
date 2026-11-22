// =============================================================================
// Sponsoring — Heimtrikot in Vereinsfarben mit den Logos der Trikot-Partner:
// Brust (Druck in Kontrastfarbe), Ausrüster (klein auf der linken Brust),
// Ärmel (ab 2017/18). Freie Flächen gestrichelt. Die Logos liegen als eigene
// Ebene über <JerseySVG> (gleiches 200×210-Raster), damit auch ein hochgeladenes
// Trikotbild bedruckt wird. Bild-Slot fürs Trikotfoto siehe docs/images/IMAGES.md.
// =============================================================================
import JerseySVG, { type JerseyPattern } from '../../../components/JerseySVG';
import { getClubKitDisplay } from '../../../data/kits';
import type { Club } from '../../../types';
import type { SponsorDeal, SponsorDealOffer, SponsorIndustry } from '../../../types/sponsor';
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

export function SponsorJersey({ club, brust, ausruester, aermel, year, ui, aermelOpen, size = 360, preview }: {
  club: Club; brust?: SponsorDeal; ausruester?: SponsorDeal; aermel?: SponsorDeal; year: number; ui: SponsorUi;
  /** Ärmelfläche vermarktbar (sonst Liga-Partner bzw. leer). */
  aermelOpen: boolean;
  size?: number;
  /** Vorschau eines Angebots: Logo auf seiner Fläche (statt des laufenden Partners). */
  preview?: SponsorDealOffer | null;
}) {
  const kit = getClubKitDisplay(club, 'home');
  const ink = luma(kit.primary) > 0.55 ? '#16181c' : '#f6f7f9';
  const zone = (t: SpTarget, label: string, x: number, y: number, w: number, h: number, children: JSX.Element | null, rot = 0) => (
    <g className={`sp3-zone ${ui.isOpen(t) ? 'on' : ''}`} {...ui.bind(t, label)} transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="4" className={children ? 'sp3-zone-hit' : 'sp3-zone-free'} />
      {children}
    </g>
  );
  // Logo je Fläche: Vorschau des Angebots hat Vorrang vor dem laufenden Vertrag.
  const logo = (slot: 'brust' | 'ausruester' | 'aermel', d?: SponsorDeal): { name: string; industry: SponsorIndustry; year: number } | null =>
    preview && preview.slot === slot ? { name: preview.partner, industry: preview.industry, year }
      : d ? { name: d.partner, industry: d.industry, year: Number(d.since.slice(0, 4)) } : null;
  const lb = logo('brust', brust), la = logo('ausruester', ausruester), lr = logo('aermel', aermel);
  const pv = (slot: string) => (preview?.slot === slot ? ' preview' : '');
  return (
    <div className="sp3-jersey">
      {kit.image ? <JerseySVG image={kit.image} size={size} />
        : <JerseySVG primary={kit.primary} secondary={kit.secondary} pattern={kit.pattern as JerseyPattern} size={size} />}
      <svg className="sp3-jersey-over" viewBox="0 0 200 210" aria-hidden={false}>
        {zone(brust ? { kind: 'deal', id: brust.id } : { kind: 'free', slot: 'brust' }, 'Brustsponsor', 64, 84, 72, 34,
          lb ? <svg className={`sp3-logo-on${pv('brust')}`} x={64} y={84} width={72} height={34} viewBox="0 0 120 50"><SponsorLogo key={lb.name} name={lb.name} industry={lb.industry} year={lb.year} variant="chest" ink={ink} /></svg>
            : <text x={100} y={105} textAnchor="middle" className="sp3-zone-txt">Brust frei</text>)}
        {zone(ausruester ? { kind: 'deal', id: ausruester.id } : { kind: 'free', slot: 'ausruester' }, 'Ausrüster', 112, 56, 14, 14,
          la ? <svg className={`sp3-logo-on${pv('ausruester')}`} x={112} y={56} width={14} height={14} viewBox="0 0 40 40"><SponsorLogo key={la.name} name={la.name} industry={la.industry} year={la.year} variant="mark" /></svg> : null)}
        {(aermel || aermelOpen) && zone(aermel ? { kind: 'deal', id: aermel.id } : { kind: 'free', slot: 'aermel' }, 'Ärmelsponsor', 154, 56, 16, 16,
          lr ? <svg className={`sp3-logo-on${pv('aermel')}`} x={154} y={56} width={16} height={16} viewBox="0 0 40 40"><SponsorLogo key={lr.name} name={lr.name} industry={lr.industry} year={lr.year} variant="mark" /></svg> : null, 22)}
      </svg>
    </div>
  );
}
