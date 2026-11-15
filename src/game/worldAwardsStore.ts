// =============================================================================
// AUSZEICHNUNGEN DER AUSLANDSLIGEN — kompaktes Archiv `game.seasonAwards.wv`
// -----------------------------------------------------------------------------
// Die Besten der Saison + Elf der Saison aller 1. Ligen im Ausland (letzte
// WORLD_AWARD_SEASONS Saisons; geschrieben in game/worldAwardsGame.ts) als Zahlentupel:
//   • Spieler = Nummer des Weltspielers (`wp<base36>` → Zahl); Name, Geburtsjahr und
//     Position kommen aus game.worldPool. Verlässt ein Spieler den Pool (Karriereende,
//     Wechsel ins eigene Land), hält `rememberWorldPlayers` (aus game/worldPool.ts)
//     sie in `gone` fest. Zeichenkette statt Zahl = nur der Name (ältere Elf ohne ID).
//   • Verein = Index in `cl[Land]` (ID ohne gemeinsamen Anfang), Name aus den Vereinsdaten.
//   • Noten/Gegentore × 100 gerundet, Begründung als Merkmale (engine/seasonAwards.ts
//     `reasonFlags`/`reasonText`), nur die Plätze und Werte, die die Oberfläche zeigt.
// Löst die Objektlisten `seasonAwards.world` und `extraAwards.xiw` ab (≈ 450 → ≈ 56 KB
// nach fünf Saisons); Umrechnung `migrateWorldAwards` in game/worldAwardsMigration.ts.
// Bewusst ohne Laufzeit-Importe aus dem Spiel (game/worldPool.ts ruft hierher).
// =============================================================================
import type { Game } from './state';

/** Spieler: Zahl = Weltspieler `wp` + Zahl (base36), Zeichenkette = Name ohne ID. */
export type WRef = number | string;
/**
 * Ein Mannschaftsteil: Sieger (Felder je Teil, `WIN_FIELDS`), danach je Platz 2/3 `ref, verein, note×100`.
 * Gespeichert wird nur, was Karte und Begründung zeigen (Torwart ohne Tore/Vorlagen, Mittelfeld/Sturm ohne Zu-null).
 */
export type WCat = WRef[];
/** Newcomer: `kategorie (Index AWARD_CATS)`, dann die Sieger-Felder dieser Kategorie. */
export type WRookie = WRef[];
/**
 * Liga: [Spieler der Saison (Index AWARD_CATS, −1 keiner), [TW, Abwehr, Mittelfeld, Sturm], Newcomer | 0,
 * Elf | 0]. Elf je Platz (Reihenfolge = Slots der Formation) `ref, verein, note×100` oder −(n) = n-ter Platz
 * der Mannschaftsteile (`catSpots`, gleicher Spieler/Verein/Note) – siehe `packXi`/`unpackXi`.
 */
export type WLeague = [number, WCat[], WRookie | 0, WRef[] | 0];

export interface WorldAwardsStore {
  v: 1;
  /** Vereine je Land: [gemeinsamer ID-Anfang, Rest der ID …] (`=` + ganze ID, wenn der Anfang nicht passt); Verein = Index im Rest. */
  cl: Record<string, string[]>;
  /** Spieler, die den Weltpool verlassen haben: Nummer → [Name, Geburtsjahr, Position]. */
  gone: Record<string, [string, number, string]>;
  /** Saison → Länderschlüssel → Liga. */
  s: Record<string, Record<string, WLeague>>;
}

/** Werte eines Siegers/Newcomers (Note und Gegentore × 100). */
export interface WWin { r: WRef; c: number; ap: number; g: number; gl: number; as: number; cs: number; f: number; ga: number }
type WKey = keyof WWin;
/** Felder des Sieger-Blocks je Mannschaftsteil (Index AWARD_CATS); Platz 0/1/3 immer Spieler/Verein/Note. */
export const WIN_FIELDS: WKey[][] = [
  ['r', 'c', 'ap', 'g', 'cs', 'f', 'ga'],
  ['r', 'c', 'ap', 'g', 'gl', 'as', 'cs', 'f'],
  ['r', 'c', 'ap', 'g', 'gl', 'as', 'f'],
  ['r', 'c', 'ap', 'g', 'gl', 'as', 'f'],
];
/** Länge des Sieger-Blocks je Mannschaftsteil. */
export const winLen = (catIdx: number) => WIN_FIELDS[catIdx].length;
export const packWin = (k: number, w: WWin): WRef[] => WIN_FIELDS[k].map((f) => w[f]);
export function unpackWin(k: number, a: WRef[], i: number): WWin {
  const w: WWin = { r: a[i], c: -1, ap: 0, g: 0, gl: 0, as: 0, cs: 0, f: 0, ga: 0 };
  WIN_FIELDS[k].forEach((f, j) => { if (f !== 'r') w[f] = Number(a[i + j]) || 0; });
  return w;
}

type Store = { seasonAwards?: { wv?: WorldAwardsStore } };
export const worldStore = (g: Game): WorldAwardsStore | undefined => (g as unknown as Store).seasonAwards?.wv;

export const refOfId = (id: string): WRef => (/^wp[0-9a-z]+$/.test(id) ? parseInt(id.slice(2), 36) : id);
export const idOfRef = (r: WRef): string | undefined => (typeof r === 'number' ? `wp${r.toString(36)}` : undefined);

/** Plätze der Mannschaftsteile in fester Reihenfolge: Feld, Index des Spielers, Index der Note. */
export function catSpots(l: WLeague): { a: WRef[]; i: number; g: number }[] {
  const out: { a: WRef[]; i: number; g: number }[] = [];
  l[1].forEach((c, k) => {
    if (!c.length) return;
    out.push({ a: c, i: 0, g: 3 });
    for (let i = winLen(k); i < c.length; i += 3) out.push({ a: c, i, g: i + 2 });
  });
  return out;
}

/**
 * Elf packen: steht ein Spieler schon bei den Besten derselben Liga (gleicher Verein und
 * gleiche Note), genügt der Verweis −(Platz + 1) auf `catSpots`; sonst `ref, verein, note×100`.
 */
export function packXi(l: WLeague, rows: [WRef, number, number][]): WRef[] {
  const spots = catSpots(l);
  return rows.flatMap(([r, c, g]) => {
    const k = spots.findIndex((s) => s.a[s.i] === r && s.a[s.i + 1] === c && s.a[s.g] === g);
    return k >= 0 ? [-(k + 1)] : [r, c, g];
  });
}

/** Elf entpacken: [ref, verein, note×100] je Platz. */
export function unpackXi(l: WLeague): [WRef, number, number][] {
  const xi = l[3];
  if (!xi) return [];
  const spots = catSpots(l);
  const out: [WRef, number, number][] = [];
  for (let i = 0; i < xi.length;) {
    const v = xi[i];
    if (typeof v === 'number' && v < 0) {
      const s = spots[-v - 1];
      out.push(s ? [s.a[s.i], Number(s.a[s.i + 1]), Number(s.a[s.g])] : ['?', -1, 0]);
      i++;
    } else { out.push([v, Number(xi[i + 1]), Number(xi[i + 2])]); i += 3; }
  }
  return out;
}

/** Jede Spieler-Stelle einer Liga: Feld + Index des Spielers (Verein steht direkt dahinter). */
export function eachSpot(l: WLeague, fn: (arr: WRef[], i: number) => void): void {
  for (const s of catSpots(l)) fn(s.a, s.i);
  if (l[2]) fn(l[2], 1);
  const xi = l[3];
  if (xi) for (let i = 0; i < xi.length;) {
    if (typeof xi[i] === 'number' && (xi[i] as number) < 0) { i++; continue; }
    fn(xi, i); i += 3;
  }
}

const clubPrefix = (id: string) => /^(w_[a-z0-9]+-)/.exec(id)?.[1] ?? '';

/** Vereins-Index im Land `key` (legt den Verein bei Bedarf an; `cache` beschleunigt viele Aufrufe). */
export function clubIdx(st: WorldAwardsStore, key: string, id: string, cache?: Map<string, number>): number {
  const list = (st.cl[key] ??= [clubPrefix(id)]);
  const short = list[0] && id.startsWith(list[0]) ? id.slice(list[0].length) : `=${id}`;
  const ck = `${key}|${short}`;
  let i = cache?.get(ck);
  if (i == null) {
    i = list.indexOf(short, 1) - 1;
    if (i < 0) i = list.push(short) - 2;
    cache?.set(ck, i);
  }
  return i;
}

/** Vereins-ID zu einem Index (leer, wenn unbekannt). */
export function clubOf(st: WorldAwardsStore, key: string, i: number): string {
  const list = st.cl[key];
  const v = list && i >= 0 ? list[i + 1] : undefined;
  return v == null ? '' : v.startsWith('=') ? v.slice(1) : list![0] + v;
}

/** Nur die letzten `keep` Saisons behalten; Vereinslisten und `gone` auf Benutztes kürzen (idempotent). */
export function trimWorldStore(st: WorldAwardsStore, keep: number): void {
  const seasons = Object.keys(st.s).sort();
  for (const s of seasons.slice(0, Math.max(0, seasons.length - keep))) delete st.s[s];
  const next: WorldAwardsStore = { v: 1, cl: {}, gone: {}, s: {} };
  const cache = new Map<string, number>();
  const refs = new Set<string>();
  for (const s of Object.keys(st.s).sort()) {
    for (const [key, l] of Object.entries(st.s[s])) eachSpot(l, (a, i) => {
      if (typeof a[i] === 'number') refs.add(String(a[i]));
      const id = clubOf(st, key, Number(a[i + 1]));
      a[i + 1] = id ? clubIdx(next, key, id, cache) : -1;
    });
  }
  st.cl = next.cl;
  for (const k of Object.keys(st.gone)) if (!refs.has(k)) delete st.gone[k];
}

/**
 * Weltspieler verlassen den Pool (Karriereende, Abbau, Wechsel): Name/Geburtsjahr/Position
 * für die Spieler festhalten, die im Archiv stehen. `gone` = [ID, Name, Geburtsjahr, Position].
 */
export function rememberWorldPlayers(g: Game, gone: [string, string, number, string][]): void {
  const st = worldStore(g);
  if (!st || !gone.length) return;
  const refs = new Set<number>();
  for (const s of Object.values(st.s)) for (const l of Object.values(s)) eachSpot(l, (a, i) => { if (typeof a[i] === 'number') refs.add(a[i] as number); });
  for (const [id, name, born, pos] of gone) {
    const r = refOfId(id);
    if (typeof r === 'number' && refs.has(r) && !st.gone[r]) st.gone[r] = [name, born, pos];
  }
}
