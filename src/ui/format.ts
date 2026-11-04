import { economyScale, formatMoney, formatMoneyShort } from '../engine/economy';

// -----------------------------------------------------------------------------
// Währung ära-gerecht: bis 2001 DM, ab 2002 EUR (1 EUR = 1,95583 DM). Damit die
// zahlreichen bestehenden fmtDM/fmtDMfull-Aufrufe ohne Jahr weiter funktionieren,
// hält ein Modul-Level-Jahr das aktuelle Spieljahr; es wird bei jeder Verarbeitung
// und jedem Render aktualisiert (setDisplayYear).
// -----------------------------------------------------------------------------
export let _displayYear = 1975;

export function setDisplayYear(year: number): void { _displayYear = year; }

export const fmtDM = (n: number) => formatMoneyShort(n, _displayYear);

export const fmtDMfull = (n: number) => formatMoney(n, _displayYear);

/**
 * Preisschilder (Gehalt, Marktwert, Transferbudget) liegen in 1975-Basis vor und
 * werden für die Anzeige auf das aktuelle Spieljahr hochgerechnet.
 */
export const fmtPrice = (base: number) => formatMoneyShort(base * economyScale(_displayYear), _displayYear);
export const fmtPriceFull = (base: number) => formatMoney(Math.round(base * economyScale(_displayYear)), _displayYear);
/** Preisschild, kleine Beträge (unter 10.000 nominal) voll ausgeschrieben – z. B. Prämien je Einsatz. */
export const fmtPriceAuto = (base: number) => (Math.abs(base * economyScale(_displayYear)) < 10000 ? fmtPriceFull(base) : fmtPrice(base));

// -----------------------------------------------------------------------------
// GEHÄLTER — intern immer Wochengehalt in 1975-Basis (`contract.weeklyWage`,
// Gehaltsbudget). Angezeigt wird auf die Einserstelle, je nach Einstellung
// „pro Jahr“ (Standard, × 52) oder „pro Woche“. Die Einstellung setzt App.tsx
// bei jedem Render (`setWagePeriod`), wie `setDisplayYear`.
// -----------------------------------------------------------------------------
export type WagePeriod = 'jahr' | 'woche';
let _wagePeriod: WagePeriod = 'jahr';
export function setWagePeriod(p: WagePeriod | undefined): void { _wagePeriod = p === 'woche' ? 'woche' : 'jahr'; }
export const wagePeriod = (): WagePeriod => _wagePeriod;
/** „Jahr“ bzw. „Woche“ – für Beschriftungen wie „Gehalt / Jahr“. */
export const wageUnit = () => (_wagePeriod === 'woche' ? 'Woche' : 'Jahr');
/** Kurzform für Spaltenköpfe („Gehalt/Jahr“). */
export const wageHead = (label = 'Gehalt') => `${label}/${_wagePeriod === 'woche' ? 'Wo.' : 'Jahr'}`;
const periodFactor = () => (_wagePeriod === 'woche' ? 1 : 52);
const currencyDiv = () => (_displayYear > 2001 ? 1.95583 : 1);
/** Wochengehalt (1975-Basis) → angezeigter Betrag in der Währung der Epoche je Zeitraum (ungerundet). */
export const wageToDisplay = (weeklyBase: number) => (weeklyBase * economyScale(_displayYear) * periodFactor()) / currencyDiv();
/** Angezeigter/eingegebener Betrag je Zeitraum → Wochengehalt in 1975-Basis. */
export const wageFromDisplay = (amount: number) => (amount * currencyDiv()) / (economyScale(_displayYear) * periodFactor());
/** Gehalt auf die Einserstelle, z. B. „312.457 DM / Jahr“ (`unit: false` ohne Zeitraum). */
export function fmtWage(weeklyBase: number, opts: { unit?: boolean } = {}): string {
  const v = Math.round(wageToDisplay(weeklyBase));
  const s = `${v.toLocaleString('de-DE')} ${_displayYear > 2001 ? '€' : 'DM'}`;
  return opts.unit === false ? s : `${s} / ${wageUnit()}`;
}
/** Mitarbeitergehalt (nominal pro Monat, engine/staffPeople.ts) im gewählten Zeitraum, auf die Einserstelle. */
export function fmtStaffWage(monthlyNominal: number, opts: { unit?: boolean } = {}): string {
  const v = Math.round((monthlyNominal * (_wagePeriod === 'woche' ? 12 / 52 : 12)) / currencyDiv());
  const s = `${v.toLocaleString('de-DE')} ${_displayYear > 2001 ? '€' : 'DM'}`;
  return opts.unit === false ? s : `${s} / ${wageUnit()}`;
}
/** Schrittweite für Gehalts-Schieberegler in Anzeige-Einheiten (≈ 1 % des Höchstwerts, glatte Zahl). */
export function wageStep(maxDisplay: number): number {
  return Math.max(1, 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, maxDisplay))) - 2));
}

/** Qualitätsskala für Werte (Attribute, Stärke, Eignung): monochrom – hell = gut, dunkel = schwach. */
export const vColor = (v: number) => v >= 80 ? 'var(--q-1)' : v >= 70 ? 'var(--q-2)' : v >= 55 ? 'var(--q-3)' : 'var(--q-4)';
/** Balkenfarbe passend zur Qualitätsskala (gedämpfter als die Ziffern). */
export const vBar = (v: number) => v >= 70 ? 'var(--bar-fill-hi)' : v >= 55 ? 'var(--bar-fill)' : 'var(--q-4)';
/** Zustandswerte (Frische, Fitness, Moral …): neutral, nur auffällig wenn wirklich niedrig. */
export const condColor = (v: number) => v < 45 ? 'var(--red)' : v < 60 ? 'var(--yellow)' : 'var(--text)';
export const condBar = (v: number) => v < 45 ? 'var(--red)' : v < 60 ? 'var(--yellow)' : 'var(--bar-fill-hi)';

// =============================================================================
// KALENDER-ZEITSTRAHL (Header) — 7 „Kalenderblatt"-Kacheln
// =============================================================================
// Spiegelt die Events aus „Zentrale → Kalender" (Liga-/Pokalspiele, Transfer-
// fenster, Bewertungen, Winterpause, Saisonende + geplante Aktivitäten). Kachel
// 2 von links ist IMMER „heute"; links davon das jüngste vergangene Event, rechts
// die nächsten kommenden Events. Alles wird rein aus g.calendar/g.activities +
// g.calendar.currentDate abgeleitet und schreibt so automatisch mit den Tagen fort.
export const CAL_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const CAL_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Zerlegt ein ISO-Datum (UTC) in Tag/Monatskürzel/Wochentag. */
export function calParts(iso: string): { day: number; mon: string; wd: string } {
  const d = new Date(iso + 'T00:00:00Z');
  return { day: d.getUTCDate(), mon: CAL_MONTHS[d.getUTCMonth()], wd: CAL_DAYS[d.getUTCDay()] };
}

export const WD_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export const MON_FULL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export const WD_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function fmtDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${WD_FULL[d.getUTCDay()]}, ${d.getUTCDate()}. ${MON_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtDateShort(iso: string): { wd: string; dmy: string } {
  const d = new Date(iso + 'T00:00:00Z');
  const p2 = (n: number) => String(n).padStart(2, '0');
  return { wd: WD_SHORT[d.getUTCDay()], dmy: `${p2(d.getUTCDate())}.${p2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}` };
}

export function zoneClass(pos: number, rowCount: number): string {
  if (pos <= 1) return 'zone-cl';
  if (pos <= 4) return 'zone-eu';
  if (pos >= rowCount - 2) return 'zone-rel';
  return '';
}

// =============================================================================
// FINANZEN
// =============================================================================
/** Voller Betrag ära-gerecht (DM bis 2001, danach EUR), z. B. "1.240.000 DM". */
export const fmtFullDM = (n: number) => formatMoney(n, _displayYear);

/** Kompakte Darstellung ära-gerecht: Tsd. für kleine, Mio. für große Beträge. */
export const fmtCompactDM = (n: number) => {
  const eur = _displayYear > 2001;
  const v = eur ? n / 1.95583 : n;
  const unit = eur ? '€' : 'DM';
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. ${unit}`;
  return `${Math.round(v / 1000).toLocaleString('de-DE')} Tsd. ${unit}`;
};

/** Kurzes Datum "15.08.1980" (UTC). */
export function fmtDay(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}
