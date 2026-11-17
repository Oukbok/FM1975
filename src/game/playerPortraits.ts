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
let any: { src: PlayerPhotoSet[]; has: boolean } | null = null;

/** Laufendes Spiel für die Zuordnung (null = keines). */
export function setPortraitGame(g: Game | null): void { current = g; }

/** Hat der aktive Datensatz überhaupt Spielerbilder? (schneller Ausstieg für jede Gesichtsanzeige) */
function hasPortraits(): boolean {
  const src = datasetPlayerPhotos();
  if (any?.src !== src) any = { src, has: src.some((x) => !!x.portrait) };
  return any.has;
}

/** Hochgeladenes Spielerbild eines Spielers (Data-URL) oder null. `g` fehlt = laufendes Spiel. */
export function portraitOf(pid: string, g: Game | null = current): string | null {
  if (!pid || !g || !hasPortraits()) return null;
  return photoIndex(g).get(pid)?.portrait ?? null;
}
