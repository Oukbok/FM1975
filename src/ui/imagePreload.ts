// =============================================================================
// Bilder vorladen UND dekodieren (Wunsch Pascal: keine sichtbaren Ladezeiten –
// besonders in der Desktop-Fassung für Steam).
// -----------------------------------------------------------------------------
// `preloadImage` lädt eine Adresse über ein unsichtbares <img> und wartet auf
// `decode()`: Zeigt eine Seite das Bild danach (als <img> oder CSS-Hintergrund mit
// GENAU derselben Adresse), ist es im ersten Bild schon da.
// Speicher: UI-Texturen (wenige, oft genutzt) bleiben gehalten; alles andere
// (Gesichter, Pressefotos) liegt in einer begrenzten Liste `LRU_MAX` – ältere
// Einträge fallen heraus, der Browser darf ihre dekodierten Bilder dann verwerfen.
// Messung vorher/nachher: tests/image-load-probe.mjs, Doku docs/research/performance.md.
// =============================================================================

/**
 * Papier-/Akten-Texturen aus `styles/31-dossier.css` (Variablen `--akte-*`, `--np-paper`, `--cal-paper`,
 * `--bnd-*`). Adressen müssen exakt den CSS-Adressen entsprechen (Prüfung: `npm run test:images`).
 * Reihenfolge = Vorladereihenfolge: zuerst, was die Zentrale zeigt.
 */
export const UI_TEXTURES: readonly string[] = [
  'assets/dossier/paper.webp',
  'assets/dossier/folder.webp',
  'assets/dossier/sheet.webp',
  'assets/dossier/newspaper.webp',
  'assets/dossier/calendar.webp',
  'assets/dossier/balance-binder.webp',
  'assets/dossier/balance/note-lined.webp',
  'assets/dossier/balance/note-torn.webp',
  'assets/dossier/balance/note-newspaper.webp',
  'assets/dossier/balance/note-orange.webp',
  'assets/dossier/balance/note-yellow.webp',
  'assets/dossier/balance/note-small.webp',
  'assets/dossier/balance/tape.webp',
  'assets/dossier/balance/polaroid.webp',
];

/** Höchstzahl gehaltener Gesichter/Fotos (Kader ≈ 30 + Jugend/Stab + Pressefotos). */
const LRU_MAX = 96;

const keep = new Map<string, HTMLImageElement>();
const lru = new Map<string, HTMLImageElement>();
const jobs = new Map<string, Promise<boolean>>();
const ready = new Set<string>();

const canLoad = () => typeof Image !== 'undefined';

function touch(src: string) {
  const el = lru.get(src);
  if (!el) return;
  lru.delete(src); lru.set(src, el);
}

function evict() {
  while (lru.size > LRU_MAX) {
    const oldest = lru.keys().next().value as string;
    lru.delete(oldest); jobs.delete(oldest); ready.delete(oldest);
  }
}

/**
 * Bild laden und dekodieren. Ergebnis: true = fertig, false = Fehler (404 o. Ä.).
 * Mehrfache Aufrufe mit derselben Adresse teilen sich einen Auftrag.
 */
export function preloadImage(src: string | null | undefined, opts?: { keep?: boolean; low?: boolean }): Promise<boolean> {
  if (!src || !canLoad()) return Promise.resolve(false);
  const hit = jobs.get(src);
  if (hit) { touch(src); return hit; }
  const el = new Image();
  el.decoding = 'async';
  if (opts?.low) el.setAttribute('fetchpriority', 'low');
  el.src = src;
  const p = el.decode().then(() => true, () => el.complete && el.naturalWidth > 0)
    .then((ok) => { if (ok && (keep.has(src) || lru.has(src))) ready.add(src); return ok; });
  jobs.set(src, p);
  if (opts?.keep) keep.set(src, el);
  else { lru.set(src, el); evict(); }
  return p;
}

/** Schon fertig dekodiert (über `preloadImage`)? */
export const isPreloaded = (src: string | null | undefined) => !!src && ready.has(src);

/** Mehrere Bilder; wartet höchstens `capMs` (danach läuft der Rest im Hintergrund weiter). */
export function preloadAll(srcs: (string | null | undefined)[], capMs = 0): Promise<void> {
  const all = Promise.all(srcs.map((s) => preloadImage(s))).then(() => undefined);
  return capMs > 0 ? Promise.race([all, new Promise<void>((r) => setTimeout(r, capMs))]) : all;
}

/** Im Leerlauf ausführen (Rückfall: kurzer Timer). */
export function whenIdle(fn: () => void, timeout = 1500): void {
  const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout }); else setTimeout(fn, 30);
}

let texturesStarted = false;
/**
 * UI-Texturen vorladen – vom Hauptmenü aus (App.tsx), also bevor ein Spiel geladen ist.
 * Nacheinander im Leerlauf, damit das Menü nicht ruckelt; Zentrale-Texturen zuerst.
 */
export function preloadUiTextures(): void {
  if (texturesStarted || !canLoad()) return;
  texturesStarted = true;
  let i = 0;
  const next = () => {
    if (i >= UI_TEXTURES.length) return;
    preloadImage(UI_TEXTURES[i++], { keep: true, low: true }).finally(() => whenIdle(next));
  };
  whenIdle(next);
}

/** Für Tests/`resetModuleState` nicht nötig: reiner Anzeige-Zwischenspeicher ohne Einfluss aufs Spiel. */
export function preloadStats() {
  return { kept: keep.size, cached: lru.size, ready: ready.size, max: LRU_MAX };
}
