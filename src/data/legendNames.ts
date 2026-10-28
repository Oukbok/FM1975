// =============================================================================
// EIGENE NAMENSDATEI für Legenden (Einstellung „Historische Spieler“)
// -----------------------------------------------------------------------------
// Eine lokale JSON-Datei { "lg_1954_1": "Vorname Nachname", … } ersetzt beim
// Auftauchen einer Legende ihren erfundenen Namen. Die Datei bleibt im eigenen
// Browser (localStorage) und wird nie mit dem Spiel ausgeliefert – wie die
// privaten Namensdateien bei anderen Fußballmanagern.
// =============================================================================
import { LEGENDS } from './legends';

const KEY = 'fm1975.legendNames';

function storage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export function loadLegendNames(): Record<string, string> {
  const s = storage();
  if (!s) return {};
  try { return JSON.parse(s.getItem(KEY) ?? '{}') as Record<string, string>; } catch { return {}; }
}

export function clearLegendNames(): void {
  try { storage()?.removeItem(KEY); } catch { /* egal */ }
}

/** Datei prüfen und speichern. Liefert die Zahl übernommener Namen oder einen Fehlertext. */
export function importLegendNames(text: string): { count: number; error?: string } {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { count: 0, error: 'Die Datei ist kein gültiges JSON.' }; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { count: 0, error: 'Erwartet wird ein Objekt { "Legenden-ID": "Vorname Nachname" }.' };
  const out: Record<string, string> = {};
  for (const [id, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v !== 'string') continue;
    const name = v.trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.length > 40 || !name.includes(' ')) continue;
    out[id] = name;
  }
  if (!Object.keys(out).length) return { count: 0, error: 'Keine gültigen Einträge gefunden (Format „Vorname Nachname“).' };
  try { storage()?.setItem(KEY, JSON.stringify(out)); } catch { return { count: 0, error: 'Speichern im Browser fehlgeschlagen.' }; }
  return { count: Object.keys(out).length };
}

/** Name aus der Datei in Vor- und Nachname zerlegen. */
export function splitName(full: string): { firstName: string; lastName: string } {
  const i = full.indexOf(' ');
  return { firstName: full.slice(0, i), lastName: full.slice(i + 1) };
}

/** Vorlage zum Ausfüllen: alle Legenden mit Jahrgang, Position und erfundenem Namen. */
export function legendNamesTemplate(): string {
  const rows = LEGENDS.map((l) => `  ${JSON.stringify(l.id)}: ${JSON.stringify(`${l.firstName} ${l.lastName}`)}`);
  return `{\n${rows.join(',\n')}\n}\n`;
}
