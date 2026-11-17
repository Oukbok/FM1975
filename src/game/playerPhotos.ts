// =============================================================================
// Eigene Spielerfotos im Spiel (Wunsch Pascal): Fotos aus dem Datensatz
// (`playerPhotos`, Editor › Spielerfotos bzw. Ausnahmetalente) erscheinen in
// Zeitung und Newscenter, wenn der Spieler erwähnt wird.
// -----------------------------------------------------------------------------
// Zuordnung Datensatz-Eintrag → Spieler-ID im Spielstand:
//  - `legendId`: über `game.legends2.done[legendId]` (Spieler-ID der erschienenen
//    Legende; bleibt beim Hochziehen aus der Jugend gleich) – hält auch, wenn die
//    Legende erst im Spielverlauf erzeugt wird.
//  - sonst voller Name (Groß-/Kleinschreibung egal), optional Geburtsjahr und
//    aktueller Verein. Passen mehrere Spieler, gilt der Eintrag für keinen.
// Auswahl: zuerst ein Foto der besten passenden Pose (Reihenfolge der Wunschliste),
// sonst ein allgemeines Foto, sonst null (→ wie bisher das generische Pressefoto).
// =============================================================================
import type { InboxMessage, Player } from '../types';
import type { Game } from './state';
import type { PlayerPhotoSet } from '../data/dataset/schema';
import type { PhotoPose } from '../data/pressPhotos';
import { datasetPlayerPhotos } from '../data/dataset/apply';
import { messagePlayers } from './messagePlayers';
import { linkParts } from './nameIndex';

type Index = { day: string; src: PlayerPhotoSet[]; done: number; map: Map<string, PlayerPhotoSet> };
const CACHE = new WeakMap<Game, Index>();
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/** Spieler-ID → Foto-Eintrag (je Spielstand und Tag zwischengespeichert). */
export function photoIndex(g: Game): Map<string, PlayerPhotoSet> {
  const src = datasetPlayerPhotos();
  const day = g.calendar?.currentDate ?? '';
  const done = Object.keys(g.legends2?.done ?? {}).length;
  const hit = CACHE.get(g);
  if (hit && hit.src === src && hit.day === day && hit.done === done) return hit.map;
  const map = new Map<string, PlayerPhotoSet>();
  if (src.length) {
    const byName = new Map<string, Player[]>();
    for (const p of [...Object.values(g.players ?? {}), ...Object.values(g.youthPlayers ?? {})]) {
      if (!p?.fullName) continue;
      const k = norm(p.fullName);
      const l = byName.get(k);
      if (l) l.push(p); else byName.set(k, [p]);
    }
    for (const set of src) {
      if (set.legendId) {
        const pid = g.legends2?.done?.[set.legendId];
        if (pid && pid !== '-' && !map.has(pid)) map.set(pid, set);
        continue;
      }
      const cands = (byName.get(norm(set.name ?? '')) ?? []).filter((p) =>
        (set.born == null || Number(p.dateOfBirth?.slice(0, 4)) === set.born)
        && (!set.club || p.clubId === set.club || p.clubId === `w_${set.club}`));
      if (cands.length === 1 && !map.has(cands[0].id)) map.set(cands[0].id, set);
    }
  }
  CACHE.set(g, { day, src, done, map });
  return map;
}

/** Foto aus einem Eintrag: beste passende Pose, sonst allgemein, sonst null. `seed` streut zwischen gleichwertigen Fotos. */
export function pickPhoto(set: PlayerPhotoSet, wanted: PhotoPose[], seed: string): string | null {
  for (const pose of [...wanted.filter((x) => x !== 'general'), 'general' as const]) {
    const list = set.photos.filter((ph) => ph.pose === pose);
    if (list.length) return list[hash(seed) % list.length].img;
  }
  return null;
}

/** Eigenes Foto eines Spielers für einen Anlass oder null. */
export function playerPhotoFor(g: Game, pid: string, wanted: PhotoPose[], seed: string): string | null {
  const set = photoIndex(g).get(pid);
  return set ? pickPhoto(set, wanted, seed) : null;
}

const isKeeper = (p: Player | undefined) => p?.naturalPosition === 'TW';

/**
 * Foto zu einer Nachricht: Spieler der Nachricht (game/messagePlayers.ts – Bezüge
 * relatedId/eventRef/Namen des eigenen Kaders), danach alle im Text genannten
 * Spieler (Namensregister game/nameIndex.ts). Der erste mit passendem Foto zählt.
 */
export function messagePlayerPhoto(g: Game, m: InboxMessage, poses: (keeper: boolean) => PhotoPose[]): { src: string; pid: string } | null {
  const idx = photoIndex(g);
  if (!idx.size) return null;
  const ids: string[] = messagePlayers(g, m).map((p) => p.id);
  for (const text of [m.subject, m.shortText, m.bodyText]) {
    for (const part of linkParts(g, text ?? '')) if (typeof part !== 'string' && part.ref.kind === 'player') ids.push(part.ref.id);
  }
  for (const pid of [...new Set(ids)]) {
    if (!idx.has(pid)) continue;
    const src = playerPhotoFor(g, pid, poses(isKeeper(g.players[pid] ?? g.youthPlayers[pid])), m.id);
    if (src) return { src, pid };
  }
  return null;
}

/** Torhüter? (Pose „Torwart-Parade“ zuerst). */
export const keeperOf = (g: Game, pid: string) => isKeeper(g.players[pid] ?? g.youthPlayers[pid]);
