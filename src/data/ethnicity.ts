// =============================================================================
// Name passt zum Aussehen (Wunsch Pascal): „Gib jedem Spieler eine Ethnie, damit
// das Aussehen zum Namen des Spielers passt“ – mit den Jahrzehnten weichen
// Nationalität und Ethnie immer öfter voneinander ab (Kinder afrikanischer Eltern
// in Frankreich, Spieler mit Balkan-Wurzeln in der Schweiz …).
//
// Ablauf bei neuen Spielern (playerFactory, youth, worldPool): Herkunft wie bisher,
// Ethnie fest aus der ID (`faceFor`), Name wie bisher über `makeName` (gleiche
// Zufallszahlen, der Spielablauf bleibt gleich). Weicht die Ethnie von der
// typischen der Herkunft ab, ersetzt `heritageName` den Namen – fest aus der ID:
// Nachname aus einem Namenspool dieser Ethnie (vorhandene Herkünfte, z. B.
// westafrika → Ghana/Nigeria/Kamerun, in Frankreich zuerst die frankophonen),
// Vorname je nach Generation aus dem Gastland (spätere Jahrgänge häufiger) oder
// aus der Herkunft der Familie. Nationalität bleibt die des Landes.
//
// Ausnahmen („LOCAL_FACES“): Länder, in denen die Ethnie zur einheimischen
// Bevölkerung gehört und am Namen nicht zu erkennen ist – Brasilien (afro-
// brasilianisch, europäische Wurzeln), Argentinien (italienische/spanische
// Wurzeln), Portugal (kapverdische/angolanische Wurzeln, portugiesische Namen),
// USA (afroamerikanisch), Niederlande (indonesisch-niederländisch).
// =============================================================================
import { BLOCKED_NAMES, HERITAGE_BLOCKED } from './namePools';
import { ORIGINS, faceFor, firstNamesFor, makeName, type FaceGroup, type Origin } from './origins';

/** Ethnien, die in einer Herkunft einheimisch sind (Name bleibt der des Landes). */
export const LOCAL_FACES: Record<string, FaceGroup[]> = {
  bra: ['westafrika', 'suedeuropa'],
  arg: ['suedeuropa'],
  por: ['westafrika', 'lateinamerika'],
  esp: ['lateinamerika'],
  usa: ['westafrika'],
  ned: ['ostasien'],
};

/** Namens-Herkünfte je Ethnie (Reihenfolge egal, gleich gewichtet). */
export const HERITAGE: Record<FaceGroup, string[]> = {
  mitteleuropa: ['ger', 'eng', 'fra', 'ned'],
  nordeuropa: ['swe', 'den', 'nor'],
  suedeuropa: ['ita', 'esp', 'por', 'gre'],
  osteuropa: ['pol', 'cze', 'hun', 'rus'],
  balkan: ['yug', 'cro', 'srb'],
  tuerkei: ['tur'],
  westafrika: ['gha', 'nga', 'cmr'],
  lateinamerika: ['bra', 'arg'],
  ostasien: ['jpn', 'kor'],
  nordafrika: ['mar'],
};

/** Engere Wahl je Gastland (Sprache, Kolonialgeschichte, Gastarbeiter). */
const HOST_HERITAGE: Record<string, Partial<Record<FaceGroup, string[]>>> = {
  fra: { westafrika: ['fra_af', 'fra_af', 'cmr'], suedeuropa: ['por', 'ita', 'esp'] },
  bel: { westafrika: ['cmr', 'fra_af'], suedeuropa: ['ita', 'esp'] },
  sui: { westafrika: ['cmr', 'fra_af', 'nga'], balkan: ['yug', 'cro', 'srb', 'ger_yu'], suedeuropa: ['ita', 'por', 'esp'] },
  eng: { westafrika: ['nga', 'gha', 'nga'], suedeuropa: ['ita', 'gre', 'por'] },
  sco: { westafrika: ['nga', 'gha'] },
  ned: { westafrika: ['gha', 'nga'] },
  aut: { balkan: ['yug', 'cro', 'srb', 'ger_yu'], tuerkei: ['tur', 'ger_tr'] },
  ger_modern: { westafrika: ['ger_af', 'gha', 'nga'], tuerkei: ['ger_tr'], osteuropa: ['ger_pl'], suedeuropa: ['ger_it'], balkan: ['ger_yu'] },
  swe: { balkan: ['yug', 'cro', 'srb'] },
  usa: { lateinamerika: ['arg'] },
  ita: { lateinamerika: ['bra', 'arg'] },
};

/** Ist die Ethnie in dieser Herkunft am Namen nicht zu unterscheiden? */
export function isLocalFace(o: Origin, face: string | undefined): boolean {
  return !face || face === o.face || !!LOCAL_FACES[o.id]?.includes(face as FaceGroup);
}

// -----------------------------------------------------------------------------
// Register Nachname → Ethnien (alle Herkünfte, auch aus einem Datensatz).
// -----------------------------------------------------------------------------
/** Schreibweise vereinheitlichen (Akzente, ı/ł/đ, Groß-/Kleinschreibung). */
export function foldName(s: string): string {
  return s.toLowerCase().replace(/ı/g, 'i').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ø/g, 'o').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

interface NameRegister { objs: Origin[]; byLast: Map<string, Origin[]> }
let register: NameRegister | null = null;

/** Herkünfte, in deren Namensliste ein Nachname steht (Zwischenspeicher; neu bei geändertem Datensatz). */
export function originsWithLast(last: string): Origin[] {
  const objs = Object.values(ORIGINS);
  if (!register || register.objs.length !== objs.length || register.objs.some((o, i) => o !== objs[i])) {
    const byLast = new Map<string, Origin[]>();
    for (const o of objs) for (const l of o.last) {
      const k = foldName(l);
      const list = byLast.get(k);
      if (!list) byLast.set(k, [o]); else if (!list.includes(o)) list.push(o);
    }
    register = { objs, byLast };
  }
  return register.byLast.get(foldName(last)) ?? [];
}

/** Ethnien (typische Gruppe der Herkünfte), zu denen ein Nachname gehört. */
export function lastNameGroups(last: string): Set<FaceGroup> {
  return new Set(originsWithLast(last).map((o) => o.face));
}

// -----------------------------------------------------------------------------
// Name zur abweichenden Ethnie
// -----------------------------------------------------------------------------
function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function rngOf(seed: string): () => number {
  let a = hashStr(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Herkünfte, aus denen eine Familie dieser Ethnie im Gastland ihren Namen hat. */
export function heritageOrigins(host: Origin, face: FaceGroup): Origin[] {
  const ids = HOST_HERITAGE[host.id]?.[face] ?? HERITAGE[face] ?? [];
  let list = ids.map((id) => ORIGINS[id]).filter((o): o is Origin => !!o && o.face === face && o.last.length > 0);
  if (!list.length) list = Object.values(ORIGINS).filter((o) => o.face === face && o.last.length > 0 && o.nationality !== host.nationality);
  if (!list.length) list = Object.values(ORIGINS).filter((o) => o.face === face && o.last.length > 0);
  return list;
}

/**
 * Anteil der Vornamen aus dem Gastland je Geburtsjahrgang: früh geborene Kinder
 * von Einwanderern tragen meist Namen der Herkunft, die 2./3. Generation öfter
 * Namen des Landes (1950: 10 %, 1975: ≈ 36 %, 2000: ≈ 62 %, ab 2005: 70 %).
 */
export function hostFirstShare(birthYear: number): number {
  return Math.max(0.1, Math.min(0.7, 0.1 + (birthYear - 1950) * 0.0104));
}

/**
 * Name eines Spielers, dessen Ethnie nicht die typische seiner Herkunft ist – oder
 * null, wenn die Ethnie zur Herkunft passt. Fest aus der ID (kein Spielzufall).
 * Nachnamen, die eindeutig dieser Ethnie gehören, werden bevorzugt.
 */
export function heritageName(host: Origin, face: string | undefined, birthYear: number, id: string): { firstName: string; lastName: string } | null {
  if (isLocalFace(host, face)) return null;
  const fam = heritageOrigins(host, face as FaceGroup);
  if (!fam.length) return null;
  const r = rngOf(`${id}|ethnie`);
  const src = fam[Math.floor(r() * fam.length)];
  // Kein Nachname, der im Gastland zu einer anderen Ethnie gehört; am liebsten eindeutige.
  const fit = src.last.filter((l) => !originsWithLast(l).some((o) => o.nationality === host.nationality && o.face !== face));
  const own = fit.filter((l) => { const g = lastNameGroups(l); return g.size === 1 && g.has(face as FaceGroup); });
  const lasts = own.length ? own : fit.length ? fit : src.last;
  const hostFirst = r() < hostFirstShare(birthYear);
  const firsts = hostFirst ? firstNamesFor(host, birthYear) : firstNamesFor(src, birthYear);
  const pick = (a: string[]) => a[Math.floor(r() * a.length)];
  let firstName = firsts.length ? pick(firsts) : pick(src.first);
  let lastName = pick(lasts);
  for (let i = 0; i < 6 && (BLOCKED_NAMES.has(`${firstName} ${lastName}`) || HERITAGE_BLOCKED.has(`${firstName} ${lastName}`) || firstName === lastName); i++) {
    firstName = firsts.length ? pick(firsts) : pick(src.first); lastName = pick(lasts);
  }
  return { firstName, lastName };
}

/**
 * Ethnie und passender Name eines neuen Spielers. Verbraucht genau die
 * Zufallszahlen von `makeName` – ohne abweichende Ethnie ist das Ergebnis
 * identisch mit dem bisherigen Weg.
 */
export function nameAndFace(o: Origin, rng: () => number, birthYear: number, id: string, faceBirthYear = birthYear): { firstName: string; lastName: string; face: string } {
  const n = makeName(o, rng, birthYear);
  const face = faceFor(o, faceBirthYear, id);
  const alt = heritageName(o, face, faceBirthYear, id);
  return { ...(alt ?? n), face };
}
