// =============================================================================
// Gesichtsbilder: welches Foto zeigt eine Person? (Register data/faceImages.ts)
// -----------------------------------------------------------------------------
// - Gruppe = Gesichtsgruppe der Herkunft (`Player.face`), Mitarbeiter = `staff`.
// - Epoche = Jahrzehnt, in dem der Spieler etwa 25 ist (Frisuren/Bärte seiner
//   aktiven Zeit). Bleibt ein Spielerleben lang gleich → stabile Identität.
//   Mitarbeiter: Jahrzehnt des laufenden Spieljahrs (Kleidung der Zeit).
// - Nummer = fest aus der ID (Hash) unter den vorhandenen Personen der Gruppe.
// - Alter: die Altersstufe dieser Person, die dem aktuellen Alter am nächsten
//   liegt (18/25/32/38) – so altert ein Spieler, wenn Stufen vorhanden sind.
// Fehlt ein passendes Bild (Gruppe/Epoche leer), gibt es null → gezeichnetes Gesicht.
// =============================================================================
import { FACE_FILES, FACE_MASKS } from '../../data/faceImages';

export const FACE_EPOCHS = [1970, 1980, 1990, 2000, 2010, 2020] as const;
export const PLAYER_AGE_STAGES = [18, 25, 32, 38] as const;
export const STAFF_AGE_STAGES = [35, 45, 55, 65] as const;
export const FACE_BASE = 'assets/faces';

interface FacePerson { nr: string; ages: number[] /* 0 = ohne Altersangabe */; masks: Set<number> }
type Index = Record<string, Record<number, FacePerson[]>>;

let cache: { n: number; idx: Index } | null = null;

/** Zerlegt `<gruppe>/<epoche>/<nr>[-<alter>]` – null bei ungültigem Namen. */
export function parseFaceKey(key: string): { group: string; epoch: number; nr: string; age: number } | null {
  const m = key.match(/^([a-z_]+)\/(\d{4})\/(\d{1,3})(?:-(\d{2}))?$/);
  if (!m) return null;
  const epoch = Number(m[2]);
  if (!(FACE_EPOCHS as readonly number[]).includes(epoch)) return null;
  return { group: m[1], epoch, nr: m[3], age: m[4] ? Number(m[4]) : 0 };
}

function index(): Index {
  if (cache && cache.n === FACE_FILES.length + FACE_MASKS.length) return cache.idx;
  const idx: Index = {};
  const masks = new Set(FACE_MASKS);
  for (const key of FACE_FILES) {
    const f = parseFaceKey(key);
    if (!f) continue;
    const list = ((idx[f.group] ??= {})[f.epoch] ??= []);
    let person = list.find((x) => x.nr === f.nr);
    if (!person) list.push(person = { nr: f.nr, ages: [], masks: new Set() });
    if (!person.ages.includes(f.age)) person.ages.push(f.age);
    if (masks.has(key)) person.masks.add(f.age);
  }
  for (const g of Object.values(idx)) for (const l of Object.values(g)) {
    l.sort((a, b) => a.nr.localeCompare(b.nr, undefined, { numeric: true }));
    for (const p of l) p.ages.sort((a, b) => a - b);
  }
  cache = { n: FACE_FILES.length + FACE_MASKS.length, idx };
  return idx;
}

function hash(str: string): number {
  // Anderer Startwert als der gezeichnete Avatar, damit Bild und Zeichnung unabhängig streuen.
  let h = 0x811c9dc5 ^ 0x5bd1e995;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const epochOfYear = (y: number) => Math.max(FACE_EPOCHS[0], Math.min(FACE_EPOCHS[FACE_EPOCHS.length - 1], Math.floor(y / 10) * 10));

/** Vorhandene Epoche dieser Gruppe, die der gewünschten am nächsten liegt (bei Gleichstand die frühere). */
function nearestEpoch(group: Record<number, FacePerson[]>, want: number): number | null {
  let best: number | null = null;
  for (const k of Object.keys(group)) {
    const e = Number(k);
    if (!group[e]?.length) continue;
    if (best == null || Math.abs(e - want) < Math.abs(best - want) || (Math.abs(e - want) === Math.abs(best - want) && e < best)) best = e;
  }
  return best;
}

export interface FaceImage { src: string; mask: string | null; key: string }

export interface FaceQuery {
  id: string;
  /** Gesichtsgruppe (Player.face); fehlt → mitteleuropa. */
  face?: string;
  /** Geburtsjahr (Spieler) – bestimmt die Epoche. */
  birthYear?: number;
  age?: number;
  /** Mitarbeiter/Trainer/Manager: Ordner `staff`, Epoche nach `year`. */
  staff?: boolean;
  /** Laufendes Spieljahr (für Mitarbeiter; Spieler ohne Geburtsjahr). */
  year?: number;
}

/** Foto für eine Person oder null (dann gezeichnetes Gesicht). */
export function faceImageFor(q: FaceQuery): FaceImage | null {
  if (!FACE_FILES.length) return null;
  const idx = index();
  const groupId = q.staff ? 'staff' : (q.face || 'mitteleuropa');
  const group = idx[groupId];
  if (!group) return null;
  const want = q.staff
    ? epochOfYear(q.year ?? 1975)
    : epochOfYear((q.birthYear ?? ((q.year ?? 1975) - (q.age ?? 25))) + 25);
  const epoch = nearestEpoch(group, want);
  if (epoch == null) return null;
  const people = group[epoch];
  const person = people[hash(`${groupId}|${q.id}`) % people.length];
  const age = q.age ?? (q.staff ? 50 : 25);
  // Nächstgelegene Altersstufe (Gleichstand: die jüngere); ein Bild ohne Altersangabe (0) nur, wenn es keine Stufen gibt.
  const staged = person.ages.filter((a) => a > 0);
  let pick = staged.length ? staged[0] : 0;
  for (const a of staged) if (Math.abs(a - age) < Math.abs(pick - age)) pick = a;
  const key = `${groupId}/${epoch}/${person.nr}${pick ? `-${pick}` : ''}`;
  return {
    key,
    src: `${FACE_BASE}/${key}.webp`,
    mask: person.masks.has(pick) ? `${FACE_BASE}/${key}-maske.webp` : null,
  };
}

// Bilder, die nicht geladen werden konnten (fehlende Datei trotz Register) – nicht erneut versuchen.
const failed = new Set<string>();
export const faceFailed = (src: string) => failed.has(src);
export const markFaceFailed = (src: string) => { failed.add(src); };
