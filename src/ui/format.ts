import { formatMoney, formatMoneyShort } from '../engine/economy';

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

export const vColor = (v: number) => v >= 75 ? 'var(--green)' : v >= 60 ? 'var(--yellow)' : v >= 45 ? 'var(--orange)' : 'var(--red)';

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
/** Voller DM-Betrag mit Tausenderpunkten (z.B. "1.240.000 DM"). */
export const fmtFullDM = (n: number) => `${Math.round(n).toLocaleString('de-DE')} DM`;

/** Kompakte DM-Darstellung: Tsd. für kleine, Mio. für große Beträge. */
export const fmtCompactDM = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. DM`;
  return `${Math.round(n / 1000).toLocaleString('de-DE')} Tsd. DM`;
};

/** Kurzes Datum "15.08.1980" (UTC). */
export function fmtDay(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}
