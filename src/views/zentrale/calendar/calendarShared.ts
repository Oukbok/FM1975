// Gemeinsame Beschriftungen der Kalenderseite (views/zentrale/CalendarView.tsx).
export const WD_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MONTH_LABELS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/** Filter der Kalenderseite (Wunsch Pascal): 1. Mannschaft, Jugend, Sonstiges – standardmäßig alle an. */
export type CalGroup = 'team' | 'youth' | 'other';
export const CAL_GROUPS: { key: CalGroup; label: string }[] = [
  { key: 'team', label: '1. Mannschaft' }, { key: 'youth', label: 'Jugend' }, { key: 'other', label: 'Sonstiges' },
];
/** Gruppe eines Termins: eigene Spiele, Halle, Trainingslager, Bewertung, Verträge = 1. Mannschaft. */
export function calGroupOf(ev: { kind?: string; isMatch: boolean }): CalGroup {
  if (ev.kind === 'Jugend') return 'youth';
  if (ev.isMatch || ev.kind === 'Halle' || ev.kind === 'Training' || ev.kind === 'Bewertung' || ev.kind === 'Verträge' || ev.kind === 'Länderspiel') return 'team';
  return 'other';
}
