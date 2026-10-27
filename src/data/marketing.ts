// =============================================================================
// 1975 – A Football Manager — Marketing / Werbung
// =============================================================================
// Werbebudgets je Bereich, per Schieberegler einstellbar. Die KOSTEN steigen
// LINEAR mit dem Regler, der NUTZEN aber mit ABNEHMENDEM Grenzertrag (exponentiell
// gesättigt):
//
//     Nutzen(x) = Nutzen_max · (1 − e^(−k · x))
//
// mit x = normierte Reglerstufe (0..1). Das erste Geld bringt viel, weiteres
// Geld immer weniger – klassische Sättigungskurve.
//
// WIRKUNG: Marketing erhöht primär die REICHWEITE (Fanbindung) und über kleine
// Nebeneffekte Merchandising- und Sponsoring-Erträge. Auf das VEREINSANSEHEN
// wirkt Marketing nur SEHR schwach – Ansehen entsteht v. a. aus sportlichem
// Erfolg. Alle Ausgaben fließen monatlich in die Finanzen (skaliert via
// economyScale). Neue Werbekanäle schalten sich epochengerecht frei.
// =============================================================================

/** Ein Werbe-/Marketingbereich mit Sättigungs-Nutzenkurve. */
export interface MarketingArea {
  id: string;
  name: string;
  /** Jahr, ab dem der Kanal verfügbar ist (Epoche). */
  unlockYear: number;
  /** Optional: ab diesem Jahr nicht mehr verfügbar (Datensatz). */
  obsoleteYear?: number;
  icon: string;
  desc: string;
  /** Reglerstufen 0..maxUnits (ganzzahlig). */
  maxUnits: number;
  /** Kosten pro Reglerstufe (DM/Monat, Basis 1975) — LINEAR. */
  costPerUnit: number;
  /** Maximaler Nutzen des Kanals (Reichweiten-Indexpunkte). */
  maxBenefit: number;
  /** Sättigungs-Steilheit k (höher = schneller gesättigt). */
  k: number;
}

export const MARKETING_EPOCHS = [1975, 1984, 1993, 2000, 2010, 2020];

export const MARKETING_AREAS: MarketingArea[] = [
  // ===== 1975 — einfache Anfänge =====
  { id: 'stadionwerbung', name: 'Stadionwerbung', unlockYear: 1975, icon: '🏟️',
    desc: 'Bandenwerbung und Anzeigen im Stadion – die klassische Einnahmequelle.',
    maxUnits: 5, costPerUnit: 4000, maxBenefit: 20, k: 0.9 },
  { id: 'lokalpresse', name: 'Lokale Presse & Plakate', unlockYear: 1975, icon: '📰',
    desc: 'Anzeigen in der Lokalzeitung und Plakate in der Stadt.',
    maxUnits: 5, costPerUnit: 2500, maxBenefit: 14, k: 1.0 },

  // ===== 1984 — Privatfernsehen =====
  { id: 'fernsehwerbung', name: 'Fernsehwerbung', unlockYear: 1984, icon: '📺',
    desc: 'Werbespots im aufkommenden Privatfernsehen erreichen ein breites Publikum.',
    maxUnits: 6, costPerUnit: 9000, maxBenefit: 34, k: 0.7 },

  // ===== 1993 — überregional & Merchandising =====
  { id: 'ueberregional', name: 'Überregionale Kampagnen', unlockYear: 1993, icon: '🗞️',
    desc: 'Bundesweite Anzeigen- und Plakatkampagnen steigern die Bekanntheit.',
    maxUnits: 6, costPerUnit: 12000, maxBenefit: 30, k: 0.8 },
  { id: 'merchandising_kampagne', name: 'Merchandising-Kampagne', unlockYear: 1993, icon: '🧣',
    desc: 'Gezielte Vermarktung von Fanartikeln – kurbelt den Fanshop an.',
    maxUnits: 6, costPerUnit: 8000, maxBenefit: 26, k: 0.85 },

  // ===== 2000 — Internet =====
  { id: 'online', name: 'Internet-/Online-Werbung', unlockYear: 2000, icon: '💻',
    desc: 'Vereinswebsite, Banner und Newsletter erreichen Fans online.',
    maxUnits: 7, costPerUnit: 10000, maxBenefit: 34, k: 0.7 },

  // ===== 2010 — Social Media =====
  { id: 'socialmedia', name: 'Social-Media-Werbung', unlockYear: 2010, icon: '📱',
    desc: 'Kampagnen auf sozialen Netzwerken binden eine junge, große Fangemeinde.',
    maxUnits: 8, costPerUnit: 12000, maxBenefit: 44, k: 0.6 },

  // ===== 2020 — digital & international =====
  { id: 'influencer', name: 'Influencer & Content', unlockYear: 2020, icon: '🎬',
    desc: 'Kooperationen mit Creators und eigener Content-Kanal.',
    maxUnits: 8, costPerUnit: 15000, maxBenefit: 40, k: 0.6 },
  { id: 'international', name: 'Internationale Digitalkampagnen', unlockYear: 2020, icon: '🌍',
    desc: 'Globale, datengetriebene Kampagnen erschließen Auslandsmärkte.',
    maxUnits: 8, costPerUnit: 20000, maxBenefit: 50, k: 0.55 },
];

export const MARKETING_BY_ID: Record<string, MarketingArea> =
  Object.fromEntries(MARKETING_AREAS.map((a) => [a.id, a]));

/** Ob ein Kanal im gegebenen Jahr verfügbar ist. */
export function marketingAvailable(area: MarketingArea, year: number): boolean {
  return year >= area.unlockYear && (!area.obsoleteYear || year < area.obsoleteYear);
}

/** Monatskosten eines Kanals bei gegebener Reglerstufe (LINEAR, Basisjahr). */
export function areaMonthlyCostBase(area: MarketingArea, units: number): number {
  return Math.max(0, Math.min(area.maxUnits, units)) * area.costPerUnit;
}

/**
 * Nutzen eines Kanals bei Reglerstufe `units` (Sättigungskurve).
 * Nutzen(x) = maxBenefit · (1 − e^(−k·x)),  x = units/maxUnits (0..1).
 */
export function areaBenefit(area: MarketingArea, units: number): number {
  const u = Math.max(0, Math.min(area.maxUnits, units));
  if (u <= 0) return 0;
  // x = Reglerstufe; k wirkt pro Stufe → Nutzen sättigt Richtung maxBenefit.
  return area.maxBenefit * (1 - Math.exp(-area.k * u));
}

/** Monats-Gesamtkosten aller Marketing-Regler (Basisjahr; skaliert extern). */
export function marketingMonthlyBase(budgets: Record<string, number>): number {
  let sum = 0;
  for (const [id, units] of Object.entries(budgets)) {
    const a = MARKETING_BY_ID[id];
    if (a) sum += areaMonthlyCostBase(a, units);
  }
  return sum;
}

/** Aggregierter Marketing-Gesamtnutzen (Reichweiten-Indexpunkte). */
export function marketingTotalBenefit(budgets: Record<string, number>): number {
  let sum = 0;
  for (const [id, units] of Object.entries(budgets)) {
    const a = MARKETING_BY_ID[id];
    if (a) sum += areaBenefit(a, units);
  }
  return sum;
}

/**
 * Kleine, GEDECKELTE monatliche Zusatzerträge aus Marketing (DM, Basisjahr;
 * extern mit economyScale multipliziert). Reichweite → etwas Merchandising &
 * Sponsoring. Bewusst klein gehalten, damit Marketing kein Selbstläufer wird.
 */
export function marketingIncomeBase(budgets: Record<string, number>): { merch: number; sponsor: number } {
  const b = marketingTotalBenefit(budgets); // grob 0..250
  return {
    merch: Math.round(b * 260),   // Reichweite → Fanartikel
    sponsor: Math.round(b * 190), // Reichweite → Sponsoring
  };
}

/**
 * SEHR schwacher Beitrag des Marketings zum Vereinsansehen (Punkte, additiv,
 * stark gedeckelt). Ansehen kommt v. a. aus sportlichem Erfolg.
 */
export function marketingReputationNudge(budgets: Record<string, number>): number {
  const b = marketingTotalBenefit(budgets);
  return Math.min(0.05, b / 4000); // maximal +0,05 Reputationspunkte pro Monat
}
