// =============================================================================
// PLATZIERUNGS-HISTORIE DER AUSLANDSVEREINE (Wunsch Pascal: „ich brauche die
// komplette Historie aller Clubs“) – Reiter „Historie“ im Vereinsprofil.
// -----------------------------------------------------------------------------
// Je Verein EINE Zeichenkette, zwei Zeichen je Saison ab `y0` (Startjahr der
// Saison): Zeichen 1 = Ebene + Platz, Zeichen 2 = Größe der Liga. '..' = in der
// Saison nicht in der 1./2. Liga (Unterbau, noch nicht gegründet). Alphabet: 91
// druckbare ASCII-Zeichen ohne '"', '\' und '.' (kein Escapen im JSON).
// 1. Liga Platz 1–40 → Index 0–39, 2. Liga Platz 1–50 → Index 40–89.
// ≈ 100 Zeichen je Verein für 50 Saisons. Mehrgleisige 2. Ebene (engine/worldSecond.ts): Platz und
// Größe gelten in der Staffel; die Staffel steht in `s` (ein Zeichen je Saison: zwei Staffeln 'A'/'B',
// drei 'C'/'D'/'E', sonst '1'…'9'; '.' = keine Staffel) – nur für Vereine, die je in einer
// mehrgleisigen 2. Ebene spielten.
// Geschrieben am Saisonende in `advanceWorldSeason` (engine/world.ts), Weltdaten
// vor dem Startjahr beim Anlegen und ältere Spielstände einmalig aus der
// Welt-Historie (game/worldPlacesSeed.ts `seedWorldPlaces`/`migrateWorldPlaces`).
// =============================================================================
import type { WorldState } from './worldTypes';

export interface WorldPlaces {
  /** Startjahr der ersten Saison (Index 0 jeder Zeichenkette). */
  y0: number;
  /** Je Verein zwei Zeichen je Saison (siehe oben). */
  c: Record<string, string>;
  /** Staffel der 2. Ebene je Verein und Saison (ein Zeichen, siehe oben); fehlt = nie mehrgleisig. */
  s?: Record<string, string>;
}

const ABC = (() => {
  let s = '';
  for (let i = 33; i <= 126; i++) if (i !== 34 && i !== 92 && i !== 46) s += String.fromCharCode(i);
  return s;
})();
const T1_MAX = 40, T2_MAX = 50, SIZE_MAX = ABC.length - 1;

const placeChar = (tier: number, pos: number) => ABC[tier === 1 ? Math.min(T1_MAX, pos) - 1 : T1_MAX + Math.min(T2_MAX, pos) - 1];
const sizeChar = (n: number) => ABC[Math.max(1, Math.min(SIZE_MAX, n))];

export function placesOfWorld(w: WorldState): WorldPlaces {
  return (w.places ??= { y0: 0, c: {} });
}

/** Endplatz eines Vereins in einer Saison eintragen (überschreibt dieselbe Saison). */
export function setPlace(p: WorldPlaces, id: string, year: number, tier: number, pos: number, size: number): void {
  if (!p.y0) p.y0 = year;
  if (year < p.y0) {
    const pad = '..'.repeat(p.y0 - year);
    for (const k of Object.keys(p.c)) p.c[k] = pad + p.c[k];
    for (const k of Object.keys(p.s ?? {})) p.s![k] = '.'.repeat(p.y0 - year) + p.s![k];
    p.y0 = year;
  }
  const i = (year - p.y0) * 2;
  const s = (p.c[id] ?? '').padEnd(i, '.');
  p.c[id] = s.slice(0, i) + placeChar(tier, pos) + sizeChar(size) + s.slice(i + 2);
}

/** Staffel (0-basiert) eines Vereins in einer Saison eintragen (nur mehrgleisige 2. Ebene). */
export function setGroupPlace(p: WorldPlaces, id: string, year: number, group: number, groups: number): void {
  if (!p.y0 || year < p.y0) return;
  const i = year - p.y0;
  const m = (p.s ??= {});
  const s = (m[id] ?? '').padEnd(i, '.');
  const ch = groups === 2 ? 'AB'[group] : groups === 3 ? 'CDE'[group] : String(Math.min(9, group + 1));
  m[id] = s.slice(0, i) + (ch ?? '9') + s.slice(i + 1);
}
const decodeGroup = (ch: string | undefined): { group: number; groups?: number } | null => {
  if (!ch || ch === '.') return null;
  const a = 'AB'.indexOf(ch), b = 'CDE'.indexOf(ch);
  return a >= 0 ? { group: a, groups: 2 } : b >= 0 ? { group: b, groups: 3 } : { group: Number(ch) - 1 };
};

/** Endtabellen einer Saison (Startjahr) eines Landes: 1. Liga und die Staffel(n) der 2. Ebene in Reihenfolge. */
export function notePlaces(w: WorldState, year: number, t1: string[], t2: string[] | string[][]): void {
  const p = placesOfWorld(w);
  t1.forEach((id, i) => setPlace(p, id, year, 1, i + 1, t1.length));
  const groups = (t2.length && Array.isArray(t2[0]) ? t2 : [t2]) as string[][];
  groups.forEach((g, k) => g.forEach((id, i) => {
    setPlace(p, id, year, 2, i + 1, g.length);
    if (groups.length > 1) setGroupPlace(p, id, year, k, groups.length);
  }));
}

export interface WorldPlace { year: number; tier: number; pos: number; size: number; /** Staffel der 2. Ebene (0-basiert) und Zahl der Staffeln (fehlt = unbekannt), falls mehrgleisig. */ group?: number; groups?: number }

/** Alle bekannten Endplätze eines Vereins (chronologisch). */
export function worldPlacesOf(w: WorldState | undefined, id: string): WorldPlace[] {
  const p = w?.places;
  const s = p?.c[id];
  if (!p || !s) return [];
  const out: WorldPlace[] = [];
  for (let i = 0; i + 1 < s.length; i += 2) {
    if (s[i] === '.') continue;
    const k = ABC.indexOf(s[i]);
    if (k < 0) continue;
    const gr = k >= T1_MAX ? decodeGroup(p.s?.[id]?.[i / 2]) : null;
    out.push({ year: p.y0 + i / 2, tier: k < T1_MAX ? 1 : 2, pos: k < T1_MAX ? k + 1 : k - T1_MAX + 1, size: Math.max(1, ABC.indexOf(s[i + 1])), ...(gr ?? {}) });
  }
  return out;
}
