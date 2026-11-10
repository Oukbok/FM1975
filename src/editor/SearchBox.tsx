import { useEffect, useMemo, useRef, useState } from 'react';
import { Dataset } from '../data/dataset/schema';
import { searchDataset } from './search';
import { secLabel, Sec, Target } from './nav';

// =============================================================================
// GLOBALE SUCHE im Kopf des Editors (Wunsch Pascal: QoL für Modder).
// Strg+F / „/“ setzt den Fokus; Pfeile + Enter wählen, Klick springt hin.
// =============================================================================
export function SearchBox({ ds, ver, onGo }: { ds: Dataset; ver: number; onGo: (sec: Sec, t: Target) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const [debounced, setDebounced] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = window.setTimeout(() => setDebounced(q), 180); return () => window.clearTimeout(t); }, [q]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const res = useMemo(() => searchDataset(ds, debounced), [ds, debounced, ver]);
  useEffect(() => setAct(0), [debounced]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, select');
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') || (e.key === '/' && !typing)) { e.preventDefault(); ref.current?.focus(); ref.current?.select(); setOpen(true); }
    };
    const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('keydown', key);
    window.addEventListener('mousedown', down);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('mousedown', down); };
  }, []);

  const go = (i: number) => {
    const h = res.hits[i];
    if (!h) return;
    setOpen(false);
    onGo(h.sec, h.target);
  };
  const mark = (v: string) => {
    const i = v.toLowerCase().indexOf(debounced.trim().toLowerCase());
    if (i < 0) return v;
    const n = debounced.trim().length;
    return <>{v.slice(0, i)}<mark>{v.slice(i, i + n)}</mark>{v.slice(i + n)}</>;
  };

  return (
    <div className="ed-search-g" ref={box}>
      <input ref={ref} className="ed-in" data-act="global-search" placeholder="Im Datensatz suchen … (Strg+F)" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setAct((a) => Math.min(a + 1, res.hits.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setAct((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); go(act); }
          else if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
        }} />
      {open && debounced.trim().length >= 2 && (
        <div className="ed-search-res">
          {!res.hits.length && <div className="ed-hint ed-search-empty">Keine Treffer für „{debounced}“.</div>}
          {res.hits.map((h, i) => (
            <button key={i} className={`ed-search-hit ${i === act ? 'on' : ''}`} onMouseEnter={() => setAct(i)} onClick={() => go(i)}>
              <span className="ed-search-sec">{secLabel(h.sec)}</span>
              <span className="ed-search-val">{mark(h.value.length > 80 ? `${h.value.slice(0, 77)}…` : h.value)}</span>
              <span className="ed-search-path">{h.label}</span>
            </button>
          ))}
          {res.more && <div className="ed-hint ed-search-empty">Mehr als {res.hits.length} Treffer – Suche genauer eingrenzen.</div>}
        </div>
      )}
    </div>
  );
}
