// =============================================================================
// Ansicht Verein ↔ Nationalteam (Wunsch Pascal): Klick auf Wappen bzw. Flagge in der
// Kopfleiste schaltet die ganze Oberfläche um (Menü, Zentrale, Akzentfarbe). Reine
// Ansicht – Zeitlauf und Spielstand bleiben gleich; gemerkt für die Sitzung.
// =============================================================================
import { useSyncExternalStore } from 'react';

export type ViewMode = 'club' | 'national';
const KEY = 'fm_view';
let mode: ViewMode = (() => { try { return sessionStorage.getItem(KEY) === 'national' ? 'national' : 'club'; } catch { return 'club'; } })();
const subs = new Set<() => void>();

export function setViewMode(m: ViewMode): void {
  if (m === mode) return;
  mode = m;
  try { sessionStorage.setItem(KEY, m); } catch { /* ohne Speicher */ }
  subs.forEach((f) => f());
}
export const viewMode = () => mode;
export function useViewMode(): ViewMode {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => mode, () => mode);
}
