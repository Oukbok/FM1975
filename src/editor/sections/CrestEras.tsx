// =============================================================================
// VEREINE › Wappen eines Vereins über die Jahre (Wunsch Pascal):
// Grundwappen (`crests`, gilt ab Spielbeginn) + beliebig viele spätere Wappen
// (`crestEras`), jedes mit dem Jahr, ab dessen Saisonbeginn (1. Juli) es das
// vorige ersetzt. Die Liste ist immer nach Jahr sortiert.
// =============================================================================
import { useRef, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import { CrestEra, Dataset } from '../../data/dataset/schema';
import { Club } from '../../types';
import { imageToDataUrl } from '../store';

const MIN_YEAR = 1975, MAX_YEAR = 2100;

type Target = { kind: 'base' } | { kind: 'era'; index: number } | { kind: 'new' };

export function CrestEras({ ds, club, onChange }: { ds: Dataset; club: Club; onChange: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const target = useRef<Target>({ kind: 'base' });
  const [err, setErr] = useState<string | null>(null);
  const base = ds.crests?.[club.id];
  const eras = ds.crestEras?.[club.id] ?? [];

  const preview = (crest?: string) => <ClubCrest club={{ ...club, customCrest: crest } as Club} size={44} />;
  const store = (list: CrestEra[]) => {
    ds.crestEras ??= {};
    if (list.length) ds.crestEras[club.id] = [...list].sort((a, b) => a.from - b.from);
    else delete ds.crestEras[club.id];
    onChange();
  };
  const pick = (t: Target) => { target.current = t; file.current?.click(); };

  const upload = async (f?: File) => {
    if (!f) return;
    try {
      const url = await imageToDataUrl(f);
      const t = target.current;
      setErr(null);
      if (t.kind === 'base') { ds.crests ??= {}; ds.crests[club.id] = url; onChange(); return; }
      if (t.kind === 'era') { store(eras.map((e, i) => (i === t.index ? { ...e, crest: url } : e))); return; }
      // neues Wappen: zehn Jahre nach dem letzten (bzw. 1985), frei änderbar
      const last = eras.length ? eras[eras.length - 1].from : 1975;
      store([...eras, { from: Math.min(MAX_YEAR, last + 10), crest: url }]);
    } catch (e) { setErr((e as Error).message); }
  };

  const setYear = (i: number, v: string) => {
    const y = Math.round(Number(v));
    if (!Number.isFinite(y)) return;
    store(eras.map((e, k) => (k === i ? { ...e, from: Math.max(MIN_YEAR, Math.min(MAX_YEAR, y)) } : e)));
  };
  const dupes = new Set(eras.map((e) => e.from).filter((y, i, a) => a.indexOf(y) !== i));

  return (
    <>
      <div className="ed-sec">Wappen</div>
      <div className="ed-crests">
        <div className="ed-crest-row">
          {preview(base)}
          <div className="ed-crest-when"><b>Ab Spielbeginn</b><span className="ed-hint">{base ? 'eigenes Bild' : 'Standardwappen'}</span></div>
          <div className="ed-crest-acts">
            <button className="ed-btn" onClick={() => pick({ kind: 'base' })}>{base ? 'Ersetzen' : 'Bild hochladen'}</button>
            {base && <button className="ed-btn" onClick={() => { delete ds.crests![club.id]; onChange(); }}>Entfernen</button>}
          </div>
        </div>
        {eras.map((e, i) => (
          <div key={`${i}-${e.from}`} className="ed-crest-row">
            {preview(e.crest)}
            <div className="ed-crest-when">
              <label>ab Saison
                <input className={`ed-in num ed-crest-year${dupes.has(e.from) ? ' bad' : ''}`} type="number" min={MIN_YEAR} max={MAX_YEAR}
                  defaultValue={e.from} onBlur={(ev) => setYear(i, ev.target.value)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur(); }} />
              </label>
              <span className="ed-hint">Saison {e.from}/{String((e.from + 1) % 100).padStart(2, '0')}</span>
            </div>
            <div className="ed-crest-acts">
              <button className="ed-btn" onClick={() => pick({ kind: 'era', index: i })}>Ersetzen</button>
              <button className="ed-btn" onClick={() => store(eras.filter((_, k) => k !== i))}>Entfernen</button>
            </div>
          </div>
        ))}
      </div>
      <div className="ed-row"><button className="ed-btn" onClick={() => pick({ kind: 'new' })}>Weiteres Wappen hinzufügen</button></div>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }}
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="ed-hint">PNG, JPG oder SVG, verkleinert auf 256 px. Ein späteres Wappen ersetzt das vorige ab Saisonbeginn (1. Juli) des eingetragenen Jahres – im laufenden Spiel und schon im Assistenten beim gewählten Startjahr.</div>
      {dupes.size > 0 && <div className="ed-err">Zwei Wappen haben dasselbe Jahr – es gilt nur eines davon.</div>}
      {err && <div className="ed-err">{err}</div>}
    </>
  );
}
