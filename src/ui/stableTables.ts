// =============================================================================
// Tabellen: passend + feste Spalten (Wunsch Pascal). Regel: docs/research/table-rules.md
//
// 1) Einpassen – keine Tabelle scrollt waagerecht. Passt eine Tabelle nicht in ihre Box
//    (kleine Flächen wie Steam Deck 1280×800, angehobene Schrift), wird sie in festen
//    Stufen schmaler, bis sie passt:
//      a) `data-fit="tight"`: enge Zellabstände, Kurzform der Spaltenköpfe (`ui/Short.tsx`)
//      b) Spalten nach Wichtigkeit weglassen: `<th data-pri="2…9">` – die höchste Zahl
//         fällt zuerst (bei Gleichstand die rechte). Ohne `data-pri` bleibt die Spalte immer.
//         Ausgeblendet wird per `data-drop="5 9"` an der Tabelle + nth-child-Regeln
//         (styles/33-tables.css) – React darf Zeilen beliebig neu zeichnen.
//      c) letzte Stufe: die Namensspalte (`<th data-flex>`, sonst die breiteste) wird
//         schmaler, lange Namen enden mit „…“ (voller Text als Tooltip, ui/ellipsisTitle.ts).
//    `<th data-min="190">`: Mindestbreite einer Spalte in fest gesetzten Tabellen – wird sie
//    unterschritten, gilt die Tabelle ebenfalls als zu breit.
//    Gilt für jede `table.dtable` und jede Tabelle mit der Klasse `fit-cols`.
// 2) Feste Spalten – beim Setzen eines Filters, Reiterwechsel, Sortieren oder Blättern
//    sollen Spalten nicht springen. Jede `table.dtable` wird beim ersten Erscheinen im
//    automatischen Layout gemessen; die Breiten der Kopfzellen werden danach festgeschrieben
//    (`table-layout: fixed`, Markierung `data-fixed`). Solange React dieselbe Tabelle
//    weiterverwendet, bleiben die Spalten stehen. Tabellen ohne Kopfzeile werden über die
//    erste Zeile gemessen. CSS in 28-rows.css.
// =============================================================================
let installed = false;

/** Kleinste Breite, auf die die Namensspalte in Stufe c) zusammengeschoben wird. */
const FLEX_MIN = 120;

/** Verfügbare Breite: Inhaltsbreite des Elternelements. */
function roomFor(t: HTMLTableElement): number {
  const p = t.parentElement;
  if (!p) return 0;
  const s = getComputedStyle(p);
  return p.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
}

function headCells(t: HTMLTableElement): HTMLTableCellElement[] {
  const row = t.tHead?.rows[0] ?? t.tBodies[0]?.rows[0];
  return row ? Array.from(row.cells) : [];
}

/** Zu breit für die Box – oder eine Spalte unter ihrer Mindestbreite (`data-min`). */
function tooWide(t: HTMLTableElement, room: number, cells: HTMLTableCellElement[]): boolean {
  if (t.offsetWidth > room + 1) return true;
  return cells.some((c) => c.dataset.min && c.offsetWidth > 0 && c.offsetWidth < Number(c.dataset.min));
}

/** Zeilen über die ganze Breite (Abschnittsköpfe, Leertext): `colspan` um die ausgeblendeten
 *  Spalten kürzen – sonst bleiben in fest gesetzten Tabellen leere Geisterspalten stehen. Läuft
 *  bei jedem Durchgang, weil React neue Zeilen mit dem alten Wert einfügt. */
function spans(t: HTMLTableElement): void {
  const n = (t.dataset.drop ?? '').split(' ').filter(Boolean).length;
  for (const c of t.querySelectorAll<HTMLTableCellElement>(':scope > * > tr > [colspan]')) {
    const full = Number(c.dataset.span ?? c.colSpan);
    if (full < 2 || c.parentElement!.children.length > 1) continue;
    c.dataset.span = String(full);
    if (c.colSpan !== full - n) c.colSpan = Math.max(1, full - n);
  }
}

/** Stufen a) und b). Liefert die Breite, die nach allen Stufen noch fehlt (0 = passt). */
function fit(t: HTMLTableElement): number {
  const room = roomFor(t);
  const cells = headCells(t);
  if (room <= 0 || cells.length < 2 || !tooWide(t, room, cells)) return 0;
  t.dataset.fit = 'tight';
  const order = cells
    .map((c, i) => ({ i, pri: c.offsetWidth > 0 ? Number(c.dataset.pri) || 1 : 1 }))
    .filter((c) => c.pri > 1)
    .sort((a, b) => b.pri - a.pri || b.i - a.i);
  const dropped: number[] = [];
  for (const c of order) {
    if (!tooWide(t, room, cells)) break;
    dropped.push(c.i + 1);
    t.dataset.drop = dropped.join(' ');
    spans(t);
  }
  return Math.max(0, t.offsetWidth - room);
}

/** Andere Spaltenzahl als beim Messen (Spalte je nach Auswahl): Tabelle neu einpassen. */
function stale(t: HTMLTableElement): boolean {
  const n = headCells(t).length;
  if (!t.dataset.cols || Number(t.dataset.cols) === n) return false;
  for (const c of headCells(t)) c.style.width = '';
  delete t.dataset.drop; spans(t);
  delete t.dataset.fixed; delete t.dataset.fit; delete t.dataset.fitDone; delete t.dataset.cols;
  return true;
}

function lock(t: HTMLTableElement): void {
  if (t.dataset.fixed || !t.isConnected || t.offsetWidth === 0) return;
  const cells = headCells(t);
  if (cells.length < 2) return;
  t.dataset.cols = String(cells.length);
  const missing = fit(t);
  const k = Math.max(1e-6, t.getBoundingClientRect().width / t.offsetWidth);
  const shown = cells.filter((c) => c.offsetWidth > 0);
  const widths = shown.map((c) => c.getBoundingClientRect().width / k);
  if (widths.some((w) => !(w > 0))) return;
  // Namensspalte: `data-flex`, sonst die breiteste.
  let f = shown.findIndex((c) => c.dataset.flex != null);
  if (f < 0) f = widths.indexOf(Math.max(...widths));
  if (missing > 0) {
    // Stufe c): zuerst die Namensspalte, den Rest (selten) gleichmäßig von allen.
    const cut = Math.min(missing, Math.max(0, widths[f] - FLEX_MIN));
    widths[f] -= cut;
    const rest = missing - cut;
    if (rest > 0) { const sum = widths.reduce((a, b) => a + b, 0); for (let i = 0; i < widths.length; i++) widths[i] *= (sum - rest) / sum; }
    t.dataset.fit = 'squeeze';
  }
  // Auf ganze Pixel aufrunden – sonst bekommt ein Inhalt fester Breite (Positions-Etiketten 82 px)
  // 0,1 px zu wenig und endet mit „…“. Die Rundung nimmt sich die Namensspalte.
  const px = widths.map((w) => Math.ceil(w - 0.01));
  px[f] = Math.max(Math.min(FLEX_MIN, px[f]), px[f] - (px.reduce((a, b) => a + b, 0) - widths.reduce((a, b) => a + b, 0)) - 1);
  shown.forEach((c, i) => { c.style.width = `${px[i]}px`; });
  t.dataset.fixed = '1';
}

/** Tabellen ohne feste Spalten (eigene Layouts): nur einpassen, einmal je Tabelle. */
function fitOnly(t: HTMLTableElement): void {
  if (t.dataset.fitDone || !t.isConnected || t.offsetWidth === 0) return;
  t.dataset.fitDone = '1';
  t.dataset.cols = String(headCells(t).length);
  fit(t);
}

function scan(root: ParentNode): void {
  root.querySelectorAll?.('table[data-cols]').forEach((t) => stale(t as HTMLTableElement));
  root.querySelectorAll?.('table[data-drop]').forEach((t) => spans(t as HTMLTableElement));
  root.querySelectorAll?.('table.dtable:not([data-fixed])').forEach((t) => lock(t as HTMLTableElement));
  root.querySelectorAll?.('table.fit-cols:not(.dtable):not([data-fit-done])').forEach((t) => fitOnly(t as HTMLTableElement));
}

export function installStableTables(): void {
  if (installed || typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
  installed = true;
  let queued = false;
  const run = () => { queued = false; scan(document); };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } })
    .observe(document.body, { childList: true, subtree: true });
  requestAnimationFrame(run);
}
