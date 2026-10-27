// =============================================================================
// 1975 – A Football Manager — Wirtschafts-/Epochen-Engine (Makro-Finanzkurve)
// =============================================================================
// Bildet die über die Jahrzehnte STEIGENDE Finanzbasis des Profifußballs ab.
// Kernidee: eine jährlich wachsende „Erlös-Basis" (Makro-Index) interpoliert
// geometrisch zwischen historischen Stützwerten. Aus ihr wird ein
// Skalierungsfaktor abgeleitet, der Vereinseinnahmen über die Dekaden real
// mitwachsen lässt (1975 ≈ 1×, 2030 ≈ 130×).
//
// WÄHRUNGS-ÄRA
//   • Bis einschließlich 2001: Deutsche Mark (DM)
//   • Ab 2002:               Euro (EUR), 1 EUR = 1,95583 DM
// Interne Spielbeträge bleiben nominal in DM; die Anzeige rechnet ab 2002 in
// EUR um. Der Makro-Index selbst wird intern in EUR geführt (durchgehende Reihe),
// damit die Nachkrisen-Projektion ab 2030 mit ihrer EUR-Sättigungskonstante passt.
// =============================================================================

/** Umrechnungskurs der Währungsumstellung (fix): 1 EUR = 1,95583 DM. */
export const DM_PER_EUR = 1.95583;

/** Letztes Jahr der DM-Ära (2002 → Euro-Bargeld). */
export const LAST_DM_YEAR = 2001;

/** Startjahr des Spiels (Bezugsjahr für economyScale = 1,0). */
export const ECONOMY_BASE_YEAR = 1975;

/**
 * Historische Stützwerte der Erlös-Basis (Bundesliga-Gesamterlöse, Größenordnung),
 * intern durchgehend in EUR geführt. DM-Ära-Werte sind aus nominalen DM
 * umgerechnet (÷ 1,95583), damit eine lückenlose Reihe entsteht.
 *
 * Nominal-Herkunft (Designdaten):
 *   1975 120 Mio DM · 1980 180 · 1985 300 · 1990 500 · 1995 900 ·
 *   2000 1,80 Mrd DM · 2001 2,00 Mrd DM ·
 *   2005 1,30 Mrd € · 2010 1,80 · 2015 2,80 · 2020 4,20 ·
 *   2021 4,48 · 2022 5,24 · 2023 5,87 · 2024 6,33 · 2030 8,10 Mrd €
 */
const DM = (mrdDM: number) => (mrdDM * 1e9) / DM_PER_EUR; // Mrd DM → EUR
const EUR = (mrdEUR: number) => mrdEUR * 1e9;             // Mrd EUR → EUR

interface Anchor { year: number; value: number; }
const ANCHORS: Anchor[] = [
  { year: 1975, value: DM(0.120) },
  { year: 1980, value: DM(0.180) },
  { year: 1985, value: DM(0.300) },
  { year: 1990, value: DM(0.500) },
  { year: 1995, value: DM(0.900) },
  { year: 2000, value: DM(1.800) },
  { year: 2001, value: DM(2.000) },
  { year: 2005, value: EUR(1.300) },
  { year: 2010, value: EUR(1.800) },
  { year: 2015, value: EUR(2.800) },
  { year: 2020, value: EUR(4.200) },
  { year: 2021, value: EUR(4.480) },
  { year: 2022, value: EUR(5.240) },
  { year: 2023, value: EUR(5.870) },
  { year: 2024, value: EUR(6.330) },
  { year: 2030, value: EUR(8.100) },
];

const LAST_ANCHOR = ANCHORS[ANCHORS.length - 1];

/** Deterministischer Pseudo-Zufall in [-1, 1] aus einem Jahr (reproduzierbar). */
function yearShock(year: number): number {
  let h = (year * 2654435761) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  h = h >>> 0; // WICHTIG: XOR liefert vorzeichenbehaftet → wieder unsigned machen.
  return (h / 0xffffffff) * 2 - 1; // [-1, 1]
}

// Cache für die iterative Projektion ab 2030 (monoton, deterministisch).
const _projCache: Record<number, number> = {};

/**
 * Erlös-Basis (Makro-Index) für ein Jahr, in EUR.
 *  • Zwischen zwei Stützwerten: geometrische Interpolation
 *      R(y) = R0 · (R1/R0)^((y−y0)/(y1−y0))
 *  • Nach dem letzten Stützwert (2030): jährliche Fortschreibung
 *      R_t = R_(t−1) · (1 + 0,037 − d_sat) · shock_t
 *      d_sat = 0,035 · R/(R + 12 Mrd €),  shock ∈ ±3 %
 */
export function revenueBaseline(year: number): number {
  if (year <= ANCHORS[0].year) return ANCHORS[0].value;
  // Innerhalb der Stützwerte interpolieren.
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i], b = ANCHORS[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return a.value * Math.pow(b.value / a.value, t);
    }
  }
  // Projektion ab dem letzten Stützwert.
  if (year <= LAST_ANCHOR.year) return LAST_ANCHOR.value;
  if (_projCache[year] != null) return _projCache[year];
  let r = LAST_ANCHOR.value;
  for (let y = LAST_ANCHOR.year + 1; y <= year; y++) {
    const dSat = 0.035 * (r / (r + EUR(12)));
    const shock = 1 + yearShock(y) * 0.03; // ±3 %
    r = r * (1 + 0.037 - dSat) * shock;
    _projCache[y] = r;
  }
  return r;
}

/**
 * Skalierungsfaktor der Finanzbasis gegenüber 1975 (economyScale(1975) = 1,0).
 * Vereinseinnahmen werden hiermit über die Jahrzehnte real hochskaliert.
 */
export function economyScale(year: number): number {
  return revenueBaseline(year) / revenueBaseline(ECONOMY_BASE_YEAR);
}

/** Währung einer Ära: DM bis 2001, EUR ab 2002. */
export function currencyForYear(year: number): 'DM' | 'EUR' {
  return year <= LAST_DM_YEAR ? 'DM' : 'EUR';
}

/** Extrahiert das Jahr aus einem ISO-Datum ("1975-07-01" → 1975). */
export function yearOf(dateISO: string): number {
  return parseInt(dateISO.slice(0, 4), 10) || ECONOMY_BASE_YEAR;
}

function fmtNum(n: number, decimals = 0): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Formatiert einen NOMINALEN DM-Betrag ära-gerecht:
 *   • Jahr ≤ 2001 → „… DM"
 *   • Jahr ≥ 2002 → in EUR umgerechnet (÷ 1,95583), „… €"
 * `compact` gibt kompakte Tsd./Mio./Mrd.-Schreibweise aus.
 */
export function formatMoney(amountDM: number, year: number, compact = false): string {
  const eur = currencyForYear(year) === 'EUR';
  const value = eur ? amountDM / DM_PER_EUR : amountDM;
  const unit = eur ? '€' : 'DM';
  const abs = Math.abs(value);
  if (compact) {
    if (abs >= 1e9) return `${fmtNum(value / 1e9, 2)} Mrd. ${unit}`;
    if (abs >= 1e6) return `${fmtNum(value / 1e6, 2)} Mio. ${unit}`;
    if (abs >= 1e4) return `${fmtNum(value / 1e3, 0)} Tsd. ${unit}`;
    return `${fmtNum(value, 0)} ${unit}`;
  }
  return `${fmtNum(Math.round(value))} ${unit}`;
}

/** Kurzform „… Tsd./Mio. …" ára-gerecht (ersetzt das alte fmtDM). */
export function formatMoneyShort(amountDM: number, year: number): string {
  const eur = currencyForYear(year) === 'EUR';
  const value = eur ? amountDM / DM_PER_EUR : amountDM;
  const unit = eur ? '€' : 'DM';
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${fmtNum(value / 1e6, 2)} Mio. ${unit}`;
  return `${fmtNum(Math.round(value / 1e3))} Tsd. ${unit}`;
}
