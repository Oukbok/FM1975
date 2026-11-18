// =============================================================================
// Eigene Spielerbilder (Porträts, Wunsch Pascal): ein hochgeladenes Kopfbild aus
// dem Datensatz (`playerPhotos[].portrait`, Editor › Spielerfotos bzw.
// Ausnahmetalente) ersetzt im Spiel überall das Gesicht – PlayerAvatar und damit
// Profil, Listen (FaceThumb), Presse, Newscenter, Ehrungen.
// Zuordnung wie bei den Fotos (game/playerPhotos.ts `photoIndex`: Legenden-ID,
// sonst voller Name + optional Geburtsjahr/Verein).
// Das laufende Spiel meldet GameShell per `setPortraitGame` (wie `setCrestDate`);
// ohne laufendes Spiel (Hauptmenü, Assistent) gibt es keine Porträts.
// =============================================================================
import type { Game } from './state';
import type { PlayerPhotoSet } from '../data/dataset/schema';
import { datasetPlayerPhotos } from '../data/dataset/apply';
import { photoIndex } from './playerPhotos';

let current: Game | null = null;
let any: { src: PlayerPhotoSet[]; has: boolean; faces: boolean } | null = null;

/** Laufendes Spiel für die Zuordnung (null = keines). */
export function setPortraitGame(g: Game | null): void { current = g; }

/** Hat der aktive Datensatz überhaupt Spielerbilder? (schneller Ausstieg für jede Gesichtsanzeige) */
function hasPortraits(): boolean {
  const src = datasetPlayerPhotos();
  if (any?.src !== src) any = { src, has: src.some((x) => !!x.portrait), faces: src.some((x) => !!x.face) };
  return any.has;
}

/** Hat der aktive Datensatz Ethnie-Vorgaben je Spieler? */
function hasFaces(): boolean {
  hasPortraits();
  return !!any?.faces;
}

/** Hochgeladenes Spielerbild eines Spielers (Data-URL) oder null. `g` fehlt = laufendes Spiel. */
export function portraitOf(pid: string, g: Game | null = current): string | null {
  if (!pid || !g || !hasPortraits()) return null;
  return photoIndex(g).get(pid)?.portrait ?? null;
}

/**
 * Ethnie aus dem Datensatz (`playerPhotos[].face`, Editor › Spielerbilder & Fotos bzw.
 * Ausnahmetalente): überschreibt die verdeckte Gesichtsgruppe `Player.face` des
 * zugeordneten Spielers für alle Gesichter (Zuordnung wie beim Porträt). Sonst null.
 */
export function faceOverrideOf(pid: string, g: Game | null = current): string | null {
  if (!pid || !g || !hasFaces()) return null;
  return photoIndex(g).get(pid)?.face ?? null;
}

/** Gesichtsgruppe zur Anzeige: Vorgabe aus dem Datensatz, sonst die des Spielers. */
export function shownFace(p: { id: string; face?: string }, g: Game | null = current): string | undefined {
  return faceOverrideOf(p.id, g) ?? p.face;
}
