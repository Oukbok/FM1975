import { AppSettings, DisplayMode } from '../engine/save';
import { RESOLUTION_GROUPS } from '../ui/DisplayFrame';
import { useState } from 'react';

// -----------------------------------------------------------------------------
// EINSTELLUNGEN
// -----------------------------------------------------------------------------
export function SettingsScreen({ settings, onBack, onSave }: {
  settings: AppSettings; onBack: () => void; onSave: (s: AppSettings) => void;
}) {
  const [s, setS] = useState<AppSettings>(settings);
  const save = () => { onSave(s); onBack(); };
  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Einstellungen</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>
      <div className="card mt16">
        <label className="dim mini" style={{ display: 'block' }}>Standard-Spieltempo: <b className="accent-text">{s.speedMs} ms/Tag</b></label>
        <input type="range" min={300} max={1600} step={100} value={s.speedMs} onChange={(e) => setS({ ...s, speedMs: +e.target.value })} style={{ width: '100%' }} />
        <div className="toggle-row mt16">
          <label className="toggle-item">
            <input type="checkbox" checked={s.autosave} onChange={(e) => setS({ ...s, autosave: e.target.checked })} />
            <span className={`toggle ${s.autosave ? 'on' : ''}`}></span>
            Automatisch speichern (Saisonende &amp; Meilensteine)
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={s.soundEnabled} onChange={(e) => setS({ ...s, soundEnabled: e.target.checked })} />
            <span className={`toggle ${s.soundEnabled ? 'on' : ''}`}></span>
            Ton/Effekte (Platzhalter)
          </label>
        </div>
      </div>

      {/* --- Spiel --- */}
      <div className="card mt16">
        <h3 style={{ margin: '0 0 4px' }}>Ereignisse</h3>
        <p className="dim mini" style={{ margin: '0 0 14px' }}>
          Wie oft Zufallsereignisse für Spieler und Verein auftreten (Heimweh, Disziplinfälle, Mäzen, Fanprotest, Grippewelle …).
        </p>
        <div className="seg-group">
          {(['wenige', 'normal', 'viele'] as const).map((f) => (
            <button key={f} type="button" className={`seg-btn ${(s.eventFrequency ?? 'normal') === f ? 'active' : ''}`}
              onClick={() => setS({ ...s, eventFrequency: f })}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* --- Anzeige & Auflösung --- */}
      <div className="card mt16">
        <h3 style={{ margin: '0 0 4px' }}>Anzeige</h3>
        <p className="dim mini" style={{ margin: '0 0 14px' }}>
          Auflösung, Anzeige-Modus und UI-Skalierung. Für die spätere Steam-Version vorbereitet.
        </p>

        <label className="dim mini" style={{ display: 'block' }}>Auflösung</label>
        <select
          value={s.resolution}
          onChange={(e) => setS({ ...s, resolution: e.target.value })}
          style={{ marginTop: 4 }}
        >
          <option value="auto">Automatisch (native Desktop-Auflösung)</option>
          {RESOLUTION_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o} value={o}>{o.replace('x', ' × ')}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <label className="dim mini mt16" style={{ display: 'block' }}>Anzeige-Modus</label>
        <div className="seg-group mt4">
          {([
            ['window', 'Fenster'],
            ['borderless', 'Randlos'],
            ['fullscreen', 'Vollbild'],
          ] as [DisplayMode, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`seg-btn ${s.displayMode === val ? 'active' : ''}`}
              onClick={() => setS({ ...s, displayMode: val })}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="dim mini mt16" style={{ display: 'block' }}>
          UI-Skalierung: <b className="accent-text">{s.uiScale}%</b>
        </label>
        <input
          type="range"
          min={80}
          max={150}
          step={5}
          value={s.uiScale}
          onChange={(e) => setS({ ...s, uiScale: +e.target.value })}
          style={{ width: '100%' }}
        />
        <div className="row-between dim micro" style={{ marginTop: 2 }}>
          <span>80%</span><span>100%</span><span>150%</span>
        </div>
      </div>

      {/* --- Textmodus --- */}
      <div className="card mt16">
        <h3 style={{ margin: '0 0 4px' }}>Textmodus</h3>
        <p className="dim mini" style={{ margin: '0 0 14px' }}>
          So läuft dein Spiel im Textmodus ab. Tempo und Spannungsmoment kannst du auch während des Spiels ändern.
        </p>
        <label className="dim mini" style={{ display: 'block' }}>Lesetempo</label>
        <div className="seg-group mt4">
          {(['langsam', 'normal', 'schnell'] as const).map((v) => (
            <button key={v} type="button" className={`seg-btn ${(s.matchTextSpeed ?? 'normal') === v ? 'active' : ''}`}
              onClick={() => setS({ ...s, matchTextSpeed: v })}>
              {v === 'langsam' ? 'Langsam' : v === 'normal' ? 'Normal' : 'Schnell'}
            </button>
          ))}
        </div>
        <div className="toggle-row mt16">
          <label className="toggle-item">
            <input type="checkbox" checked={s.matchSuspense !== false} onChange={(e) => setS({ ...s, matchSuspense: e.target.checked })} />
            <span className={`toggle ${s.matchSuspense !== false ? 'on' : ''}`}></span>
            Spannungsmoment bei Großchancen
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={s.matchHalftimeTalk !== false} onChange={(e) => setS({ ...s, matchHalftimeTalk: e.target.checked })} />
            <span className={`toggle ${s.matchHalftimeTalk !== false ? 'on' : ''}`}></span>
            Halbzeitansprache anbieten
          </label>
        </div>
      </div>

      <button className="btn-primary mt16" style={{ alignSelf: 'center', padding: '11px 34px' }} onClick={save}>Speichern</button>
    </div>
  );
}
