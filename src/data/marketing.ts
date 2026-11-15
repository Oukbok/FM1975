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
// WIRKUNG (Werbung 2.0, Wunsch Pascal: Werbung muss sich lohnen können): Jeder Kanal
// zahlt auf bestimmte WERBEZIELE ein (`CHANNEL_GOALS`): Zuschauer, Mitglieder,
// Fanartikel und die Marke regional / national / international. Je Ziel gibt es
// eine Obergrenze (`GOAL_CAP`); wie viel davon erreicht wird, hängt vom Anteil der
// bespielten Kanäle AN DEN KANÄLEN DER EPOCHE ab – neue Medien nehmen den alten
// Reichweite weg. Ablauf, Trägheit und Markenaufbau: game/marketingGame.ts.
// Alle Ausgaben fließen monatlich in die Finanzen (skaliert via economyScale).
// =============================================================================

/** Ein Werbe-/Marketingbereich mit Sättigungs-Nutzenkurve. */
export interface MarketingArea {
  id: string;
  name: string;
  /** Jahr, ab dem der Kanal verfügbar ist (Epoche). */
  unlockYear: number;
  /** Optional: ab diesem Jahr nicht mehr verfügbar (Datensatz). */
  obsoleteYear?: number;
  /** Veraltet: frühere Datensätze trugen hier ein Symbol; es wird nicht angezeigt. */
  icon?: string;
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
  { id: 'stadionwerbung', name: 'Stadionaktionen', unlockYear: 1975,
    desc: 'Eigene Werbung im Stadion: Stadionzeitung, Anzeigetafel, Aktionstage – bindet die Zuschauer (die Banden vermarktet das Sponsoring).',
    maxUnits: 5, costPerUnit: 1200, maxBenefit: 20, k: 0.9 },
  { id: 'lokalpresse', name: 'Lokale Presse & Plakate', unlockYear: 1975,
    desc: 'Anzeigen in der Lokalzeitung und Plakate in der Stadt.',
    maxUnits: 5, costPerUnit: 750, maxBenefit: 14, k: 1.0 },

  // ===== 1984 — Privatfernsehen =====
  { id: 'fernsehwerbung', name: 'Fernsehwerbung', unlockYear: 1984,
    desc: 'Werbespots im aufkommenden Privatfernsehen erreichen ein breites Publikum.',
    maxUnits: 6, costPerUnit: 2700, maxBenefit: 34, k: 0.7 },

  // ===== 1993 — überregional & Merchandising =====
  { id: 'ueberregional', name: 'Überregionale Kampagnen', unlockYear: 1993,
    desc: 'Bundesweite Anzeigen- und Plakatkampagnen steigern die Bekanntheit.',
    maxUnits: 6, costPerUnit: 3600, maxBenefit: 30, k: 0.8 },
  { id: 'merchandising_kampagne', name: 'Merchandising-Kampagne', unlockYear: 1993,
    desc: 'Gezielte Vermarktung von Fanartikeln – kurbelt den Fanshop an.',
    maxUnits: 6, costPerUnit: 2400, maxBenefit: 26, k: 0.85 },

  // ===== 2000 — Internet =====
  { id: 'online', name: 'Internet-/Online-Werbung', unlockYear: 2000,
    desc: 'Vereinswebsite, Banner und Newsletter erreichen Fans online.',
    maxUnits: 7, costPerUnit: 3000, maxBenefit: 34, k: 0.7 },

  // ===== 2010 — Social Media =====
  { id: 'socialmedia', name: 'Social-Media-Werbung', unlockYear: 2010,
    desc: 'Kampagnen auf sozialen Netzwerken binden eine junge, große Fangemeinde.',
    maxUnits: 8, costPerUnit: 3600, maxBenefit: 44, k: 0.6 },

  // ===== 2020 — digital & international =====
  { id: 'influencer', name: 'Influencer & Content', unlockYear: 2020,
    desc: 'Kooperationen mit Creators und eigener Content-Kanal.',
    maxUnits: 8, costPerUnit: 4500, maxBenefit: 40, k: 0.6 },
  { id: 'international', name: 'Internationale Digitalkampagnen', unlockYear: 2020,
    desc: 'Globale, datengetriebene Kampagnen erschließen Auslandsmärkte.',
    maxUnits: 8, costPerUnit: 6000, maxBenefit: 50, k: 0.55 },
];

/** Preisniveau der Werbung gegenüber den Kanal-Stammdaten (auch eigener Datensätze). */
export const MARKETING_COST_FACTOR = 0.15;
/**
 * Preisfaktor auf die Kanal-Stammdaten (Basisjahr), mit dem Kosten gebucht und angezeigt werden:
 *  • Epoche: Solange es nur wenige Kanäle gibt, tragen sie die ganze Wirkung – und kosten entsprechend mehr
 *    (sonst wäre Werbung in den 70ern fast geschenkt und 2020 unbezahlbar).
 *  • Vereinsgröße: Ein großer Verein fährt größere Kampagnen (mehr Auflage, mehr Fläche) als ein kleiner –
 *    so lohnen sich die unteren Stufen für jeden, der Anschlag aber nur für wenige.
 */
export function marketingPriceFactor(year: number, reputation: number): number {
  const full = (list: MarketingArea[]) => list.reduce((s, a) => s + a.maxUnits * a.costPerUnit, 0);
  const all = full(MARKETING_AREAS), avail = full(MARKETING_AREAS.filter((a) => marketingAvailable(a, year)));
  const era = avail > 0 ? Math.pow(all / avail, 0.835) : 1;
  const size = Math.pow(Math.max(30, Math.min(100, reputation)) / 75, 1.5);
  return MARKETING_COST_FACTOR * era * size;
}

// -----------------------------------------------------------------------------
// Werbeziele
// -----------------------------------------------------------------------------
export type MarketingGoal = 'att' | 'members' | 'merch' | 'reg' | 'nat' | 'intl';
export const MARKETING_GOALS: MarketingGoal[] = ['att', 'members', 'merch', 'reg', 'nat', 'intl'];
export const GOAL_LABEL: Record<MarketingGoal, string> = {
  att: 'Zuschauer', members: 'Mitglieder', merch: 'Fanartikel', reg: 'Marke regional', nat: 'Marke national', intl: 'Marke international',
};
/**
 * Höchste Wirkung je Ziel, wenn alle Kanäle der Epoche voll laufen: Zuschauernachfrage, Mitgliedsbeiträge
 * und Fanartikel als Anteil (0,06 = +6 %), Marke in Punkten über dem, was der Ruf allein hergibt.
 */
export const GOAL_CAP: Record<MarketingGoal, number> = { att: 0.05, members: 0.12, merch: 0.12, reg: 8, nat: 10, intl: 12 };
/** Worauf ein Kanal einzahlt (Gewichte). Kanäle eigener Datensätze ohne Eintrag: `DEFAULT_GOALS`. */
export const CHANNEL_GOALS: Record<string, Partial<Record<MarketingGoal, number>>> = {
  stadionwerbung: { att: 3, merch: 1, members: 1 },
  lokalpresse: { att: 2, members: 2, reg: 3 },
  fernsehwerbung: { nat: 3, reg: 1, att: 1, merch: 1 },
  ueberregional: { nat: 3, members: 1 },
  merchandising_kampagne: { merch: 4 },
  online: { merch: 2, members: 2, nat: 1, intl: 1 },
  socialmedia: { merch: 2, nat: 2, intl: 2, members: 1 },
  influencer: { intl: 2, nat: 1, merch: 1 },
  international: { intl: 4 },
};
const DEFAULT_GOALS: Partial<Record<MarketingGoal, number>> = { reg: 1, nat: 1, merch: 1 };
export const channelGoals = (id: string) => CHANNEL_GOALS[id] ?? DEFAULT_GOALS;

/** Ausschöpfung eines Kanals 0..1 (Sättigungskurve, volle Stufe = 1). */
export function areaSaturation(area: MarketingArea, units: number): number {
  // Flacher als die alte Reichweiten-Kurve: Stufe 1 bringt rund 35–40 %, die halbe Leiste rund zwei Drittel.
  const u = Math.max(0, Math.min(area.maxUnits, units)), k = area.k * 0.45;
  const full = 1 - Math.exp(-k * area.maxUnits);
  return full > 0 ? (1 - Math.exp(-k * u)) / full : 0;
}

/**
 * Zielwirkung je Werbeziel bei diesen Reglern im Jahr `year`: Obergrenze × Anteil der bespielten
 * Kanäle an allen Kanälen der Epoche, die auf das Ziel einzahlen.
 */
export function marketingTargets(budgets: Record<string, number>, year: number): Record<MarketingGoal, number> {
  const out = { att: 0, members: 0, merch: 0, reg: 0, nat: 0, intl: 0 } as Record<MarketingGoal, number>;
  const areas = MARKETING_AREAS.filter((a) => marketingAvailable(a, year));
  for (const goal of MARKETING_GOALS) {
    let total = 0, got = 0;
    for (const a of areas) {
      const w = channelGoals(a.id)[goal] ?? 0;
      if (!w) continue;
      total += w;
      got += w * areaSaturation(a, budgets[a.id] ?? 0);
    }
    out[goal] = total > 0 ? GOAL_CAP[goal] * (got / total) : 0;
  }
  return out;
}

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
