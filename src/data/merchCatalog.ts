// =============================================================================
// Fanartikel-Sortiment je Epoche (Preise in 1975-Basis, Anzeige mit fmtPrice).
// =============================================================================
// Quellen/Annahmen (bewusst grob, Größenordnungen):
//   • 1970er: Fanartikel = Schals, Mützen, Wimpel, Aufnäher und Anstecker für die Kutte,
//     Vereinsheft/Jahrbuch, Autogrammkarten und Poster („Starschnitt“ in Jugendzeitschriften),
//     Vereinsschallplatten. Verkauf an Buden am Stadion und auf der Geschäftsstelle.
//   • Trikotwerbung ab 1973 (Eintracht Braunschweig/Jägermeister); Trikot-Nachbildungen
//     für Fans werden erst Ende der 1970er von den Ausrüstern breit angeboten und in den
//     1980ern zum Massenartikel → Freischaltung 1978, Anteil wächst bis in die 2000er.
//   • Freizeitkleidung (T-Shirts, Sweatshirts, Jacken) und Haushalt/Accessoires (Tassen,
//     Feuerzeuge, Bettwäsche) breiten sich in den 1980ern aus; Fanartikel-Boom Mitte der
//     1990er, Einbruch 1997/98 (Überangebot, im Umfeld als `merchSlump`).
//   • Saisonrückblicke auf VHS ab Mitte der 1980er, DVD ab etwa 2000, mit Streaming um
//     2015 kaum noch gefragt → „Video & DVD“ 1986–2016.
//   • Feste Rückennummern mit Spielernamen in der Bundesliga ab 1995/96 → erst ab dann
//     zählen beflockte Trikots je Spieler; vorher Poster/Autogrammkarten je Spieler.
//   • Wareneinsatz im Mittel ≈ 35 % des Verkaufspreises (engine/sponsorship.ts MERCH_COGS).
//   • Stückpreise folgen den Verbraucherpreisen (VPI Westdeutschland/Deutschland, 1975 = 1),
//     nicht der Fußball-Finanzbasis `economyScale` – ein Schal kostet 1995 gut 20 DM, nicht 100.
//     Trikots haben zusätzlich einen Markenaufschlag: Replika ≈ 55 DM (1978), ≈ 120 DM (1995),
//     ≈ 65 € (2005), ≈ 85 € (2015), ≈ 100 € (2024). Was der Markt mehr hergibt, kommt über
//     mehr verkaufte Stücke.
// =============================================================================
import type { MerchItemId } from '../types/merch';

export interface MerchItemDef {
  id: MerchItemId;
  name: string;
  /** kurze Beschreibung je Epoche */
  desc: string;
  /** erstes Jahr im Sortiment */
  from: number;
  /** letztes Jahr (optional) */
  until?: number;
  /** Richtpreis (Verkauf) in 1975-Basis */
  price: number;
  /** Einkaufspreis in 1975-Basis */
  cost: number;
  /** Lagerplatz je Stück (Schal = 1) */
  vol: number;
  /** Umsatz-Gewicht über die Jahre (Stützpunkte, linear dazwischen) */
  w: [number, number][];
  /** Modellwechsel: Restbestand wird zum Vorjahresmodell (Ladenhüter) */
  model?: boolean;
  /** Bildname in public/assets/merch/ (Fallback: Icon) */
  img: string;
  /** Preisaufschlag über den Verbraucherpreisen (Stützpunkte, linear dazwischen) */
  trend?: [number, number][];
}

/** Verbraucherpreise gegenüber 1975 (gerundet; ab 1991 Gesamtdeutschland, Fortschreibung 2 %/Jahr). */
export const MERCH_CPI: [number, number][] = [
  [1975, 1], [1980, 1.25], [1985, 1.47], [1990, 1.58], [1995, 1.88], [2000, 1.99], [2005, 2.17],
  [2010, 2.33], [2015, 2.48], [2020, 2.62], [2023, 3.05], [2025, 3.15],
];

export const MERCH_ITEMS: MerchItemDef[] = [
  { id: 'schal', name: 'Schals & Mützen', desc: 'Strickschal, Pudelmütze – das Fanartikel-Rückgrat.', from: 1950, price: 12, cost: 4.3, vol: 1, img: 'schal',
    w: [[1975, 40], [1985, 26], [1995, 14], [2010, 10], [2025, 8]] },
  { id: 'wimpel', name: 'Wimpel & Aufnäher', desc: 'Für Kutte, Autoscheibe und Kinderzimmer.', from: 1950, price: 4, cost: 1.2, vol: 0.3, img: 'wimpel',
    w: [[1975, 16], [1985, 13], [1995, 5], [2005, 2], [2025, 1.5]] },
  { id: 'magazin', name: 'Vereinsmagazin & Jahrbuch', desc: 'Vereinsheft, Jahrbuch, Chronik.', from: 1950, price: 5, cost: 2.2, vol: 0.5, img: 'magazin',
    w: [[1975, 13], [1990, 8], [2005, 4], [2025, 2]] },
  { id: 'poster', name: 'Poster & Autogrammkarten', desc: 'Mannschaftsposter, Starschnitt, Autogrammkarten.', from: 1950, price: 4, cost: 1.2, vol: 0.3, img: 'poster',
    w: [[1975, 16], [1990, 8], [2005, 4], [2025, 3]] },
  { id: 'ball', name: 'Bälle & Sportartikel', desc: 'Vereinsball, Trainingsanzug, Sporttasche.', from: 1950, price: 18, cost: 7, vol: 2, img: 'ball',
    w: [[1975, 10], [1995, 6], [2025, 4]] },
  { id: 'musik', name: 'Musik & Multimedia', desc: 'Vereinsschallplatte, später CD, CD-ROM und Spiele.', from: 1950, price: 9, cost: 3.5, vol: 0.4, img: 'musik',
    w: [[1975, 3], [1995, 5], [2010, 3], [2025, 2]] },
  { id: 'trikot', name: 'Trikot-Replika', desc: 'Das Heimtrikot wie die Profis – ab den 1980ern der Renner.', from: 1978, price: 45, cost: 20, vol: 1, model: true, img: 'trikot',
    trend: [[1978, 1.08], [1985, 1.2], [1995, 1.4], [2005, 1.33], [2015, 1.5], [2024, 1.4]],
    w: [[1978, 5], [1985, 16], [1995, 32], [2005, 38], [2025, 40]] },
  { id: 'bekleidung', name: 'Fankleidung', desc: 'T-Shirts, Sweatshirts, Jacken im Vereinsdesign.', from: 1982, price: 20, cost: 7.2, vol: 1.5, img: 'bekleidung',
    w: [[1982, 5], [1995, 18], [2025, 20]] },
  { id: 'accessoires', name: 'Accessoires & Haushalt', desc: 'Tassen, Feuerzeuge, Bettwäsche, Uhren.', from: 1980, price: 9, cost: 3, vol: 0.8, img: 'accessoires',
    w: [[1980, 4], [1995, 12], [2025, 15]] },
  { id: 'video', name: 'Video & DVD', desc: 'Saisonrückblick auf VHS, ab etwa 2000 auf DVD.', from: 1986, until: 2016, price: 25, cost: 10, vol: 0.5, img: 'video',
    w: [[1986, 3], [1995, 6], [2005, 6], [2012, 3], [2016, 1]] },
];

export const MERCH_BY_ID = Object.fromEntries(MERCH_ITEMS.map((d) => [d.id, d])) as Record<MerchItemId, MerchItemDef>;

/** Im Jahr X erhältlich? */
export function merchAvailable(d: MerchItemDef, year: number): boolean {
  return year >= d.from && (d.until == null || year <= d.until);
}

/** Kommende Artikel (Freischaltjahr in der Zukunft). */
export function merchUpcoming(year: number): MerchItemDef[] {
  return MERCH_ITEMS.filter((d) => d.from > year).sort((a, b) => a.from - b.from);
}

/** Ab dieser Saison tragen Fan-Trikots Name und feste Nummer (Bundesliga 1995/96). */
export const FLOCK_YEAR = 1995;
/** Anteil beflockter Trikots ab FLOCK_YEAR. */
export const FLOCK_SHARE = 0.6;

/** Neues Trikotmodell in dieser Saison? Bis 1989 alle zwei Jahre, danach jährlich. */
export function newKitSeason(startYear: number): boolean {
  return startYear >= 1990 || startYear % 2 === 0;
}

/** Mengenrabatt beim Einkauf je bestellter Stückzahl. */
export const VOLUME_DISCOUNT: [number, number][] = [[20000, 0.18], [8000, 0.14], [3000, 0.1], [1000, 0.06], [250, 0.03]];

/** Lagerplätze je Fanshop-Stufe (infrastructure.merchandising 0–5), 1975. */
export const STORE_CAP = [1500, 2500, 4500, 8000, 14000, 24000];
/** Zusätzliche Lagerfläche je Stufe des Megastores im Umfeld. */
export const MEGASTORE_CAP = 0.4;
