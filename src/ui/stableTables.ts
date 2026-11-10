// =============================================================================
// Feste Tabellenspalten (Wunsch Pascal): Beim Setzen eines Filters, Reiterwechsel,
// Sortieren oder Blättern sollen Spalten nicht springen. Jede `table.dtable` wird beim
// ersten Erscheinen im automatischen Layout gemessen; die Breiten der Kopfzellen werden
// danach festgeschrieben (`table-layout: fixed`, Markierung `data-fixed`). Solange React
// dieselbe Tabelle weiterverwendet, bleiben die Spalten stehen. Tabellen ohne Kopfzeile
// werden über die erste Zeile gemessen. CSS in 28-rows.css.
// =============================================================================
let installed = false;

function lock(t: HTMLTableElement): void {
  if (t.dataset.fixed || !t.isConnected || t.offsetWidth === 0) return;
  const row = t.tHead?.rows[0] ?? t.tBodies[0]?.rows[0];
  if (!row || row.cells.length < 2) return;
  const widths = Array.from(row.cells, (c) => c.getBoundingClientRect().width / Math.max(1e-6, t.getBoundingClientRect().width / t.offsetWidth));
  if (widths.some((w) => !(w > 0))) return;
  Array.from(row.cells).forEach((c, i) => { c.style.width = `${Math.round(widths[i])}px`; });
  t.dataset.fixed = '1';
}

function scan(root: ParentNode): void {
  root.querySelectorAll?.('table.dtable:not([data-fixed])').forEach((t) => lock(t as HTMLTableElement));
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
