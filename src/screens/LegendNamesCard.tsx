import { useRef, useState } from 'react';
import { clearLegendNames, importLegendNames, legendNamesTemplate, loadLegendNames } from '../data/legendNames';
import { resetLegendNameCache } from '../game/legendFactory';

// =============================================================================
// Einstellungen → Historische Spieler: eigene Namensdatei für Legenden.
// Die Datei bleibt im Browser und wird nie veröffentlicht.
// =============================================================================
export function LegendNamesCard() {
  const [count, setCount] = useState(() => Object.keys(loadLegendNames()).length);
  const [msg, setMsg] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const res = importLegendNames(await f.text());
    resetLegendNameCache();
    if (res.error) setMsg(res.error);
    else { setCount(res.count); setMsg(`${res.count} Namen übernommen.`); }
    if (input.current) input.current.value = '';
  };
  const template = () => {
    const blob = new Blob([legendNamesTemplate()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'legenden-namen.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  const clear = () => { clearLegendNames(); resetLegendNameCache(); setCount(0); setMsg('Namensdatei entfernt.'); };

  return (
    <div className="card mt16">
      <h3 style={{ margin: '0 0 4px' }}>Historische Spieler</h3>
      <p className="dim mini" style={{ margin: '0 0 12px' }}>
        Das Spiel kennt nur erfundene Legenden. Mit einer eigenen Namensdatei gibst du ihnen andere Namen – nur für dich,
        die Datei bleibt in diesem Browser. Format: <code>{'{ "lg_1954_1": "Vorname Nachname", … }'}</code>.
        Die Vorlage enthält alle Legenden-IDs mit ihren erfundenen Namen. Wähle beim neuen Spiel „Eigene Namensdatei“.
      </p>
      <div className="chip-row">
        <button className="btn-sm" onClick={template}>Vorlage herunterladen</button>
        <button className="btn-sm" onClick={() => input.current?.click()}>Namensdatei laden</button>
        {count > 0 && <button className="btn-sm" onClick={clear}>Entfernen</button>}
        <input ref={input} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <div className="dim2 mini mt8">{count ? `Geladen: ${count} Namen.` : 'Keine Namensdatei geladen.'} {msg}</div>
    </div>
  );
}
