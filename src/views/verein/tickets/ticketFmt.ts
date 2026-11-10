// Anzeige-Helfer des Kartenverkaufs (Preise in DM/€, Schrittweite der Preisknöpfe).
import { currencyAt, formatMoney } from '../../../engine/economy';

export const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');
export const span = (w: [number, number] | null | undefined) => (w ? (w[0] === w[1] ? n0(w[0]) : `${n0(w[0])}–${n0(w[1])}`) : '–');

/** Ticketpreis in Anzeige-Währung (kleine Beträge mit Nachkommastellen). */
export function fmtTicket(nominalDM: number, year: number): string {
  const c = currencyAt(year);
  const v = nominalDM * c.perDM;
  if (v >= 1000) return formatMoney(nominalDM, year);
  return `${v.toLocaleString('de-DE', { minimumFractionDigits: v < 100 ? 2 : 0, maximumFractionDigits: v < 100 ? 2 : 0 })} ${c.unit}`;
}

/** Schrittweite der Preisknöpfe nach Anzeigebetrag. */
export const stepOf = (disp: number) => (disp < 30 ? 0.5 : disp < 100 ? 1 : disp < 1000 ? 10 : 250);

/** Umrechnung Basispreis (1975) ↔ Anzeigebetrag. */
export function priceScale(sc: number, year: number) {
  const per = currencyAt(year).perDM;
  const toDisp = (base: number) => base * sc * per;
  const fromDisp = (d: number) => d / per / sc;
  return {
    toDisp, fromDisp,
    /** Basispreis einen Schritt hoch/runter (auf das Schrittraster der Anzeige). */
    bump: (base: number, dir: number) => {
      const d = toDisp(base);
      const s = stepOf(d);
      return fromDisp(Math.max(s, Math.round(d / s) * s + dir * s));
    },
  };
}
