// =============================================================================
// FANKURVE (Wunsch Pascal): Wo stehen die eigenen harten Fans – und was zahlen sie?
// Günstige Stehplätze in der Fankurve machen die aktive Szene zufrieden (Monats-
// stimmung, game/environmentGame.ts); ohne Stehplätze fühlt sie sich verdrängt.
// Wo Stehen nicht erlaubt ist (data/fanCulture.ts), zählen die günstigsten
// Sitzplätze der Kurve – mit halber Wirkung. Reine Rechenlogik.
// =============================================================================
import { STAND } from '../data/seatingCatalog';
import { fanCultureOf, standingAllowed } from '../data/fanCulture';
import type { Club, SeatCat } from '../types';
import { rawStandCaps, refPrice, standPrice } from './seating';
import { homeStands } from './stadiumExtras';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const half = (v: number) => Math.round(v * 2) / 2;

export interface FanStandInfo {
  /** Beitrag zur Zielstimmung je Monat (−6 … +6). */
  mood: number;
  text: string;
  /** Stehplatzanteil der Fankurve (0…1). */
  standShare: number;
  /** Preis gegen Richtpreis der günstigen Kategorie (null = keine). */
  ratio: number | null;
  standing: boolean;
  curve: string;
}

/** Wirkung der Fankurve auf die Stimmung (null = keine Fankurve festgelegt). */
export function fanStandMood(club: Club, year: number, cc: string): FanStandInfo | null {
  const homes = homeStands(club.stadium.fans);
  const raw = homes.length ? rawStandCaps(club) : null;
  if (!homes.length || !raw) return null;
  const c = { steh: 0, sitz: 0, dach: 0, premium: 0, business: 0 };
  for (const h of homes) for (const k of Object.keys(c) as (keyof typeof c)[]) c[k] += raw[h][k];
  const seats = c.steh + c.sitz + c.dach + c.premium + c.business;
  const standing = standingAllowed(cc, year);
  const curve = fanCultureOf(cc).curve;
  const where = `${curve} (${homes.map((h) => STAND[h].name).join(', ')})`;
  const standShare = seats ? c.steh / seats : 0;
  // Preis gegen Richtpreis, gewichtet nach Plätzen je Tribüne
  const ratioOf = (k: SeatCat) => {
    let w = 0, v = 0;
    for (const h of homes) { const n = raw[h][k]; w += n; v += n * standPrice(club, h, k, year); }
    return w > 0 ? v / w / refPrice(club, k, year) : 1;
  };
  if (!seats) return { mood: 0, text: `In der ${where} gibt es keine Plätze.`, standShare, ratio: null, standing, curve };
  if (standing) {
    if (standShare < 0.4) return { mood: -3, text: `In der ${where} gibt es kaum Stehplätze – die aktive Szene fühlt sich verdrängt.`, standShare, ratio: null, standing, curve };
    const ratio = ratioOf('steh');
    const mood = half(clamp((1.15 - ratio) * 20, -6, 6));
    const text = mood >= 3 ? `Günstige Stehplätze in der ${where}: die Fans sind zufrieden.`
      : mood > 0 ? `Die Stehplätze in der ${where} sind bezahlbar.`
        : mood > -2 ? `Die Stehplätze in der ${where} gelten als teuer.`
          : `In der ${where} hängen Banner gegen die Stehplatzpreise.`;
    return { mood, text, standShare, ratio, standing, curve };
  }
  const cat: SeatCat = c.sitz >= c.dach ? 'sitz' : 'dach';
  const ratio = ratioOf(cat);
  const mood = half(clamp((1.15 - ratio) * 10, -3, 3));
  return { mood, text: `Stehen ist nicht erlaubt – in der ${where} zählen die günstigsten Sitzplätze${mood > 0 ? ', und die sind bezahlbar' : mood < 0 ? ', und die gelten als teuer' : ''}.`, standShare, ratio, standing, curve };
}
