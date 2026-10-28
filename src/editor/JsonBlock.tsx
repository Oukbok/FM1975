import { useEffect, useState } from 'react';

// =============================================================================
// JSON-Feld für verschachtelte Daten (z. B. Teilungen, Ligastrukturen).
// Übernimmt Änderungen erst, wenn der Text gültiges JSON ist.
// =============================================================================
export function JsonBlock<T>({ value, onApply, rows = 10 }: { value: T; onApply: (v: T) => void; rows?: number }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setText(JSON.stringify(value, null, 2)); setErr(null); }, [value]);
  const apply = () => {
    try { onApply(JSON.parse(text) as T); setErr(null); } catch (e) { setErr(`Kein gültiges JSON: ${(e as Error).message}`); }
  };
  return (
    <div className="ed-json">
      <textarea className="ed-in ed-code" rows={rows} value={text} spellCheck={false} onChange={(e) => setText(e.target.value)} />
      <div className="ed-row">
        <button className="ed-btn on" onClick={apply}>Übernehmen</button>
        <button className="ed-btn" onClick={() => { setText(JSON.stringify(value, null, 2)); setErr(null); }}>Verwerfen</button>
        {err && <span className="ed-err">{err}</span>}
      </div>
    </div>
  );
}
