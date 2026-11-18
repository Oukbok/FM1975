// =============================================================================
// Name passt zum Aussehen – alte Spielstände (Wunsch Pascal). Bestehende Namen
// werden NIE geändert; stattdessen bekommt ein Spieler einmalig die Ethnie
// (`face`), zu der sein Nachname eindeutig gehört:
//  - Nachname steht nur in Namenslisten EINER Gruppe (z. B. „Mensah“, „Yilmaz“,
//    „Kowalski“), das Gesicht ist eine andere → Gesicht = diese Gruppe;
//  - Nachname passt eindeutig zur typischen Gruppe der Nationalität, das Gesicht
//    nicht („John Smith“ mit westafrika) → Gesicht = Namensgruppe.
// Mehrdeutige oder unbekannte Namen bleiben, Ethnien, die in einer Herkunft
// einheimisch sind (data/ethnicity.ts `LOCAL_FACES`, z. B. Brasilien), ebenso.
// Ausnahmetalente (feste Ethnie) bleiben unberührt. Markierung `game.faceNameV`.
// Neue Spieler passen bereits beim Erzeugen (data/ethnicity.ts `nameAndFace`).
// =============================================================================
import type { Game } from './state';
import type { Origin } from '../data/origins';
import { LOCAL_FACES, originsWithLast } from '../data/ethnicity';
import { WP_FIELD as W } from './worldPool';

export const FACE_NAME_VERSION = 1;

/** Passende Ethnie zu Nachname + Nationalität, oder null (Gesicht bleibt). Rein, ohne Spielstand. */
export function faceForName(last: string, nationality: string | undefined, face: string | undefined): string | null {
  if (!last) return null;
  const all = originsWithLast(last);
  if (!all.length) return null;
  const nat = all.filter((o) => o.nationality === nationality);
  const base: Origin[] = nat.length ? nat : all;
  const allowed = new Set<string>();
  const groups = new Set<string>();
  for (const o of base) {
    groups.add(o.face); allowed.add(o.face);
    for (const f of LOCAL_FACES[o.id] ?? []) allowed.add(f);
  }
  if (face && allowed.has(face)) return null;
  if (groups.size !== 1) return null;
  const g = [...groups][0];
  return g !== face ? g : null;
}

/** Einmalige Umstellung (idempotent). Liefert die Zahl der umgestellten Spieler. */
export function migrateFaceNames(g: Game): number {
  if ((g.faceNameV ?? 0) >= FACE_NAME_VERSION) return 0;
  const legends = new Set(Object.values(g.legends2?.done ?? {}));
  let n = 0;
  for (const store of [g.players, g.youthPlayers]) {
    for (const p of Object.values(store ?? {})) {
      if (!p || legends.has(p.id) || !p.face) continue;
      const f = faceForName(p.lastName, p.nationality, p.face);
      if (f) { p.face = f; n++; }
    }
  }
  for (const w of g.worldPool?.p ?? []) {
    if (!w[W.face]) continue;
    const f = faceForName(w[W.last], w[W.nat], w[W.face]);
    if (f) { w[W.face] = f; n++; }
  }
  g.faceNameV = FACE_NAME_VERSION;
  return n;
}
