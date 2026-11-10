import { useMemo, useState } from 'react';
import { Dataset } from '../../data/dataset/schema';
import { builtinDataset } from '../../data/dataset/builtin';
import { Explain } from '../TableEditor';
import { diffDataset, shortValue, type Change } from '../diff';
import { pathLabel, targetFor } from '../search';
import { Sec, secLabel, useGoto } from '../nav';
import { mirrorStart } from './Clubs';

// =============================================================================
// ÄNDERUNGEN (Wunsch Pascal: QoL für Modder): alles, was die Arbeitskopie vom
// Standard-Datensatz unterscheidet – je Bereich, mit Sprung und Zurücksetzen.
// =============================================================================
const KIND: Record<Change['kind'], string> = { changed: 'geändert', added: 'neu', removed: 'entfernt' };
const PAGE = 200;

export function ChangesSection({ ds, onChange }: { ds: Dataset; onChange: () => void }) {
  const std = useMemo(() => builtinDataset(), []);
  const [ver, setVer] = useState(0);
  const [only, setOnly] = useState<Sec | 'all'>('all');
  const [shown, setShown] = useState(PAGE);
  const goto = useGoto();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { changes, more } = useMemo(() => diffDataset(std, ds), [std, ds, ver]);
  const rows = useMemo(() => changes.map((c) => ({ c, ...targetFor(ds, c.path, typeof c.after === 'string' ? c.after : undefined) })), [changes, ds]);
  const bySec = new Map<Sec, number>();
  for (const r of rows) bySec.set(r.sec, (bySec.get(r.sec) ?? 0) + 1);
  const list = rows.filter((r) => only === 'all' || r.sec === only);

  const revert = (cs: Change[]) => { for (const c of [...cs].reverse()) c.revert(); mirrorStart(ds); setVer((v) => v + 1); onChange(); };

  return (
    <div className="ed-section">
      <Explain>Alle Unterschiede deiner Arbeitskopie zum eingebauten Standard-Datensatz. <b>Zeigen</b> springt zum Eintrag, <b>Zurücksetzen</b> holt den Standardwert zurück (rückgängig machen mit Strg+Z). Neue Einträge werden beim Zurücksetzen gelöscht, entfernte wieder eingefügt. Name und ID des Datensatzes zählen nicht.</Explain>
      <div className="ed-row">
        <button className={`ed-btn ${only === 'all' ? 'on' : ''}`} onClick={() => { setOnly('all'); setShown(PAGE); }}>Alle <span className="ed-badge">{changes.length}{more ? '+' : ''}</span></button>
        {[...bySec].map(([s, n]) => (
          <button key={s} className={`ed-btn ${only === s ? 'on' : ''}`} data-chg={s} onClick={() => { setOnly(s); setShown(PAGE); }}>{secLabel(s)} <span className="ed-badge">{n}</span></button>
        ))}
        {only !== 'all' && list.length > 0 && <button className="ed-btn" onClick={() => revert(list.map((r) => r.c))}>Alle {list.length} in „{secLabel(only)}“ zurücksetzen</button>}
      </div>
      {!changes.length && <div className="ed-ok mt8">Keine Änderungen – die Arbeitskopie entspricht dem Standard.</div>}
      {list.length > 0 && (
        <div className="ed-table-scroll">
          <table className="ed-table ed-changes">
            <thead><tr><th style={{ width: 90 }}>Art</th><th style={{ width: 150 }}>Bereich</th><th>Eintrag</th><th>Standard</th><th>Jetzt</th><th style={{ width: 200 }} /></tr></thead>
            <tbody>
              {list.slice(0, shown).map((r, i) => (
                <tr key={i} className={`chg-${r.c.kind}`}>
                  <td><span className={`ed-badge chg-${r.c.kind}`}>{KIND[r.c.kind]}</span></td>
                  <td>{secLabel(r.sec)}</td>
                  <td className="ed-chg-path">{pathLabel(ds, r.c.path)}</td>
                  <td className="ed-hint">{shortValue(r.c.before)}</td>
                  <td>{shortValue(r.c.after)}</td>
                  <td className="ed-chg-act">
                    {r.c.kind !== 'removed' && <button className="ed-btn" onClick={() => goto(r.sec, r.target)}>Zeigen</button>}
                    <button className="ed-btn" data-act="chg-revert" onClick={() => revert([r.c])}>Zurücksetzen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > shown && <button className="ed-btn mt8" onClick={() => setShown((n) => n + PAGE)}>Weitere {Math.min(PAGE, list.length - shown)} zeigen ({list.length - shown} übrig)</button>}
        </div>
      )}
    </div>
  );
}
