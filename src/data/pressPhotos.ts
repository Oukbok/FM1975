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

/** Vorhandene Fotos je Epoche. Beispiel: `1975: ['zweikampf', 'torschuss', 'torwart', 'torjubel']`. */
export const PRESS_PHOTOS: Record<number, PressMotif[]> = {
  1975: ['zweikampf', 'torschuss', 'torwart', 'torjubel', 'verletzung', 'fans', 'abpfiff', 'kopfball', 'stadion', 'training', 'auslosung', 'vertrag', 'vorstand'],
};

/** Weitere Fassungen eines Motivs (Wunsch Pascal: nicht immer dasselbe Bild): „Epoche:Motiv“ → Anzahl
 *  zusätzlicher Dateien `<motiv>_01.webp` … `<motiv>_NN.webp` neben `<motiv>.webp`; die Nachricht wählt
 *  fest aus ihrer ID. */
export const PRESS_VARIANTS: Record<string, number> = {
  '1975:abpfiff': 10,
  '1975:fans': 10,
  '1975:kopfball': 3,
  '1975:torjubel': 6,
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

/**
 * Anlass eines eigenen Spielerfotos aus dem Datensatz (Editor › Spielerfotos, Wunsch Pascal):
 * „general“ = passt immer, sonst eine Pose passend zu den Pressemotiven.
 */
export type PhotoPose = 'general' | 'torjubel' | 'torschuss' | 'zweikampf' | 'kopfball' | 'torwart' | 'abpfiff' | 'verletzung' | 'vertrag' | 'training';
export const PHOTO_POSES: { id: PhotoPose; label: string; hint: string }[] = [
  { id: 'general', label: 'Allgemein', hint: 'Porträt oder neutrales Foto – passt zu jeder Nachricht' },
  { id: 'torjubel', label: 'Torjubel', hint: 'nach Toren und Siegen' },
  { id: 'torschuss', label: 'Torschuss', hint: 'Spielberichte, Torjäger' },
  { id: 'kopfball', label: 'Kopfball', hint: 'Spielberichte' },
  { id: 'zweikampf', label: 'Zweikampf', hint: 'Spielberichte, auch nach Niederlagen' },
  { id: 'torwart', label: 'Torwart-Parade', hint: 'Spielberichte über Torhüter' },
  { id: 'abpfiff', label: 'Abpfiff', hint: 'nach dem Spiel, auch enttäuscht' },
  { id: 'verletzung', label: 'Verletzung', hint: 'Verletzungsmeldungen' },
  { id: 'vertrag', label: 'Vertrag', hint: 'Transfers, Gerüchte, Vertragsverlängerungen' },
  { id: 'training', label: 'Training', hint: 'Training, Jugend, Kabine' },
];
const POSE_IDS = new Set<string>(PHOTO_POSES.map((x) => x.id));
export const isPhotoPose = (x: unknown): x is PhotoPose => typeof x === 'string' && POSE_IDS.has(x);

/** Passende Posen eines Spielerfotos zu einer Nachricht, beste zuerst (leer = nur allgemeine Fotos). */
export function messagePoses(m: InboxMessage, opts?: { won?: boolean; keeper?: boolean }): PhotoPose[] {
  const text = `${m.subject} ${m.shortText}`;
  if (m.category === 'injury' || /verletz/i.test(m.subject)) return ['verletzung'];
  if (m.category === 'transfer' || m.category === 'contract' || /Vertrag|Wechsel|Transfer/i.test(m.subject)) return ['vertrag'];
  if (m.category === 'training') return ['training'];
  if (m.category === 'match' || m.category === 'cup') {
    const goal = /Tor|Treffer|Doppelpack|Hattrick/i.test(text);
    const base: PhotoPose[] = opts?.won
      ? ['torjubel', ...(goal ? ['torschuss', 'kopfball'] as PhotoPose[] : []), 'zweikampf', 'abpfiff']
      : [...(goal ? ['torschuss', 'kopfball'] as PhotoPose[] : []), 'zweikampf', 'abpfiff'];
    return opts?.keeper ? ['torwart', ...base] : base;
  }
  return [];
}

/** Passende Posen zu einem Zeitungsartikel (game/press/types.ts `PressKind`). */
export function storyPoses(kind: string, opts?: { keeper?: boolean }): PhotoPose[] {
  const keeper = opts?.keeper ? ['torwart'] as PhotoPose[] : [];
  switch (kind) {
    case 'spiel': return [...keeper, 'torjubel', 'torschuss', 'kopfball', 'zweikampf'];
    case 'rekord': return [...keeper, 'torjubel', 'torschuss', 'kopfball'];
    case 'transfer': case 'geruecht': return ['vertrag'];
    case 'verletzung': return ['verletzung'];
    case 'jugend': case 'kabine': return ['training'];
    default: return [];
  }
}

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
    if (!have.length) continue;
    const motif = have[hash(m.id) % have.length];
    const v = hash(`v|${m.id}|${m.date}`) % (1 + (PRESS_VARIANTS[`${era}:${motif}`] ?? 0));
    return `assets/presse/${era}/${motif}${v ? `_${String(v).padStart(2, '0')}` : ''}.webp`;
  }
  return null;
}
