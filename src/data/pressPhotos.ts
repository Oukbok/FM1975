// =============================================================================
// Pressefotos im Lesebereich des Newscenters (Look „Akte“, Wunsch Pascal)
// -----------------------------------------------------------------------------
// Liegt ein Foto unter `bilder/presse/<epoche>/<motiv>.webp`, hier eintragen –
// erst dann wird es geladen (keine 404-Anfragen). Ohne Eintrag zeigt die Nachricht
// kein Foto. Motive und Größen: docs/bilder/BILDER.md, Abschnitt „Akte“.
// Epoche = Jahr, ab dem die Fassung gilt (1975 = Schwarzweiß der 70er …).
// =============================================================================
import type { InboxMessage } from '../types';

export type PressMotif =
  | 'zweikampf' | 'torschuss' | 'torjubel' | 'torwart' | 'kopfball' | 'abpfiff'
  | 'fans' | 'stadion' | 'training' | 'vorstand' | 'auslosung' | 'vertrag' | 'verletzung';

/** Vorhandene Fotos je Epoche. Beispiel: `1975: ['zweikampf', 'torschuss', 'torjubel']`. */
export const PRESS_PHOTOS: Record<number, PressMotif[]> = {
  1975: ['zweikampf', 'torschuss', 'torjubel', 'verletzung', 'fans', 'abpfiff', 'kopfball', 'stadion', 'training', 'auslosung', 'vertrag', 'vorstand'],
};

const MOTIFS_BY_CATEGORY: Partial<Record<InboxMessage['category'], PressMotif[]>> = {
  match: ['zweikampf', 'torschuss', 'torjubel', 'torwart', 'kopfball', 'abpfiff', 'fans'],
  cup: ['auslosung', 'stadion', 'fans'],
  board: ['vorstand'],
  training: ['training'],
  transfer: ['vertrag'],
  contract: ['vertrag'],
  injury: ['verletzung'],
  media: ['fans', 'stadion'],
};

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/** Bildpfad für eine Nachricht oder null (kein passendes Foto vorhanden). `won` = eigenes Spiel gewonnen. */
export function pressPhotoFor(m: InboxMessage, opts?: { won?: boolean }): string | null {
  const year = +m.date.slice(0, 4);
  const eras = Object.keys(PRESS_PHOTOS).map(Number).filter((e) => e <= year).sort((a, b) => b - a);
  let wanted = MOTIFS_BY_CATEGORY[m.category];
  if (m.category === 'cup' && !/Auslosung/i.test(m.subject)) wanted = ['stadion', 'fans', 'zweikampf'];
  if (!wanted) return null;
  // Jubel nur nach einem Sieg des eigenen Vereins (Ergebnis unbekannt → kein Jubel).
  if (m.category === 'match' && !opts?.won) wanted = wanted.filter((x) => x !== 'torjubel');
  for (const era of eras) {
    const have = PRESS_PHOTOS[era].filter((x) => wanted!.includes(x));
    if (have.length) return `assets/presse/${era}/${have[hash(m.id) % have.length]}.webp`;
  }
  return null;
}
