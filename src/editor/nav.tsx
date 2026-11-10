// =============================================================================
// NAVIGATION IM EDITOR (Wunsch Pascal: QoL für Modder)
// Menü-Bereiche, Sprungziel (Suche, Änderungen, Prüffehler → Bereich + Eintrag)
// und Hervorheben des Eintrags nach dem Sprung.
// =============================================================================
import { createContext, useContext } from 'react';

export type Sec = 'general' | 'graphics' | 'changes' | 'clubs' | 'world' | 'pool' | 'europe' | 'timeline' | 'leagues' | 'facilities' | 'staff' | 'marketing' | 'names' | 'legends' | 'economy' | 'history' | 'check';

// Menü nach Kategorien, ohne Symbole (Wunsch Pascal).
export const SECTIONS: { key: Sec; label: string; group: string; title: string }[] = [
  { key: 'general', label: 'Allgemein', group: 'Datensatz', title: 'Allgemein' },
  { key: 'graphics', label: 'Grafikpakete', group: 'Datensatz', title: 'Grafikpakete: Wappen importieren & Vereins-IDs exportieren' },
  { key: 'changes', label: 'Änderungen', group: 'Datensatz', title: 'Änderungen gegenüber dem Standard' },
  { key: 'check', label: 'Prüfen & Übernehmen', group: 'Datensatz', title: 'Prüfen & Übernehmen' },
  { key: 'clubs', label: 'Vereine', group: 'Vereine & Wettbewerbe', title: 'Vereine nach Land und Liga: Daten, Wappen & Trikots' },
  { key: 'world', label: 'Ligen je Saison', group: 'Vereine & Wettbewerbe', title: 'Weltdaten: Länder, Ligazusammensetzung je Saison' },
  { key: 'pool', label: 'Amateur-Pool', group: 'Vereine & Wettbewerbe', title: 'Amateur-Pool: Nachrücker für Auf- und Abstieg' },
  { key: 'leagues', label: 'Ligasystem & Reformen', group: 'Vereine & Wettbewerbe', title: 'Ligasystem & Reformen' },
  { key: 'europe', label: 'Europa & Europapokal', group: 'Vereine & Wettbewerbe', title: 'Europa & Europapokal' },
  { key: 'names', label: 'Namen & Herkünfte', group: 'Spieler & Personal', title: 'Namen, Herkünfte & Ethnie' },
  { key: 'legends', label: 'Ausnahmetalente', group: 'Spieler & Personal', title: 'Ausnahmetalente der Fußballgeschichte' },
  { key: 'staff', label: 'Mitarbeiter', group: 'Spieler & Personal', title: 'Mitarbeiter-Rollen' },
  { key: 'economy', label: 'Wirtschaft', group: 'Verein & Wirtschaft', title: 'Wirtschaft' },
  { key: 'facilities', label: 'Einrichtungen', group: 'Verein & Wirtschaft', title: 'Einrichtungen' },
  { key: 'marketing', label: 'Marketing', group: 'Verein & Wirtschaft', title: 'Marketing-Kanäle' },
  { key: 'timeline', label: 'Chronik & Regeln', group: 'Geschichte', title: 'Chronik & Regeländerungen' },
  { key: 'history', label: 'Zeitabschnitte', group: 'Geschichte', title: 'Besondere Zeitabschnitte' },
];
export const secLabel = (s: Sec) => SECTIONS.find((x) => x.key === s)?.label ?? s;

/** Wohin ein Sprung führt: Eintrag (Zeilen-ID), Text im Feld, Land/Saison/Reiter des Bereichs. */
export interface Target { id?: string; text?: string; cc?: string; year?: number; tab?: string }

export interface NavApi { target: Target | null; goto: (sec: Sec, t?: Target) => void }
export const NavContext = createContext<NavApi>({ target: null, goto: () => undefined });
/** Sprungziel des aktuellen Bereichs (nur beim ersten Aufbau nach einem Sprung gesetzt). */
export const useNavTarget = () => useContext(NavContext).target;
export const useGoto = () => useContext(NavContext).goto;

/** Schlüssel einer Tabellenzeile: id, key, reformId, town – gleich in Tabelle, Suche und Änderungen. */
export function rowKey(o: unknown): string | undefined {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
  const r = o as Record<string, unknown>;
  for (const k of ['id', 'key', 'reformId', 'town']) if (typeof r[k] === 'string' && r[k]) return r[k] as string;
  return undefined;
}

/** Bereich eines Prüfhinweises (Feld `area` aus validate.ts). */
export function secOfArea(area: string): Sec {
  if (area.startsWith('Weltdaten')) return 'world';
  if (area.startsWith('Europa')) return 'europe';
  const m: Record<string, Sec> = {
    Allgemein: 'general', 'Amateur-Pool': 'pool', Vereine: 'clubs', 'DDR-Oberliga': 'clubs', 'DDR-Liga': 'clubs', Chronik: 'timeline',
    Ligareformen: 'leagues', Einrichtungen: 'facilities', Mitarbeiter: 'staff', Marketing: 'marketing', Wirtschaft: 'economy',
    Namen: 'names', Legenden: 'legends',
  };
  return m[area] ?? 'general';
}

const cssEsc = (s: string) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'));

/** Nach dem Sprung: Zeile bzw. Feld suchen, auswählen, in den Blick holen und kurz aufleuchten lassen. */
export function locate(root: HTMLElement | null, t: Target): boolean {
  if (!root) return false;
  let el: HTMLElement | null = null;
  if (t.id) el = root.querySelector<HTMLElement>(`[data-rowid="${cssEsc(t.id)}"]`);
  const fields = (scope: ParentNode) => Array.from(scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type=checkbox]):not([type=color]), textarea'));
  const want = t.text?.toLowerCase();
  let field: HTMLElement | undefined;
  if (want) {
    const list = fields(el ?? root);
    field = list.find((f) => f.value.toLowerCase() === want) ?? list.find((f) => f.value.toLowerCase().includes(want));
  }
  if (el && !el.classList.contains('sel')) el.click();
  const hit = field ?? el;
  if (!hit) return false;
  hit.scrollIntoView({ block: 'center' });
  // Feste Rahmen (Kopf, Menü) nie mitscrollen: scrollIntoView verschiebt sonst auch Container mit overflow: hidden.
  for (const e of Array.from(document.querySelectorAll<HTMLElement>('.ed-app, .ed-body, .ed-main'))) { e.scrollTop = 0; e.scrollLeft = 0; }
  const flash = field ?? el!;
  flash.classList.add('ed-flash');
  window.setTimeout(() => flash.classList.remove('ed-flash'), 1800);
  if (field) (field as HTMLInputElement).focus({ preventScroll: true });
  return true;
}
