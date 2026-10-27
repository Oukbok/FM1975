import Icon from '../../components/Icon';
import { CalendarEngine } from '../../engine/calendar';
import { AppSettings, SaveMeta, deleteSave, listSaves, nextFreeSlot } from '../../engine/save';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { useState } from 'react';

// --- EINSTELLUNGEN (als Overlay) --------------------------------------------
export function SettingsModal({ settings, onClose, onSave }: {
  settings: AppSettings; onClose: () => void; onSave: (s: AppSettings) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <SettingsScreen settings={settings} onBack={onClose} onSave={onSave} />
      </div>
    </div>
  );
}

// --- SPEICHERN / LADEN (gemeinsames Overlay) --------------------------------
export function SaveLoadModal({ mode, currentSlot, onClose, onSave, onLoad }: {
  mode: 'save' | 'load';
  currentSlot: string | null;
  onClose: () => void;
  onSave: (slot: string, name: string) => void;
  onLoad: (slot: string) => void;
}) {
  const [saves, setSaves] = useState<SaveMeta[]>(() => listSaves());
  const current = saves.find((s) => s.slot === currentSlot);
  const [name, setName] = useState<string>(current?.name ?? '');
  const refresh = () => setSaves(listSaves());
  const del = (slot: string, label: string) => {
    if (confirm(`Speicherstand "${label}" wirklich löschen?`)) { deleteSave(slot); refresh(); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="row"><h2 style={{ margin: 0 }}>{mode === 'save' ? 'Spiel speichern' : 'Spiel laden'}</h2>
          <button className="btn-sm" onClick={onClose}>Schließen</button></div>

        {mode === 'save' && (
          <div className="card mt16">
            <div className="card-title"><span className="ico"><Icon name="save" /></span> Neuer Spielstand</div>
            <input className="mt8" style={{ width: '100%' }} placeholder="Name des Spielstands (optional)"
              value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-sm btn-primary mt12" onClick={() => onSave(nextFreeSlot(), name)}>Neu speichern</button>
          </div>
        )}

        <div className="mt16" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
          {saves.length === 0 ? (
            <div className="card dim" style={{ textAlign: 'center', padding: 24 }}>Keine Speicherstände vorhanden.</div>
          ) : saves.map((s) => (
            <div key={s.slot} className="card hoverable" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{s.name || s.clubName} {s.slot === currentSlot && <span className="pill" style={{ marginLeft: 6 }}>aktuell</span>}</div>
                <div className="dim mini">{s.clubName} · {s.season} · {s.managerName}</div>
                <div className="dim2 mini">Spieldatum: {CalendarEngine.formatDate(s.gameDate)} · Gespeichert: {new Date(s.savedAt).toLocaleString('de-DE')}</div>
              </div>
              {mode === 'save' ? (
                <button className="btn-sm" onClick={() => { if (confirm(`Speicherstand "${s.name || s.clubName}" überschreiben?`)) onSave(s.slot, name || s.name); }}>Überschreiben</button>
              ) : (
                <button className="btn-sm btn-primary" onClick={() => onLoad(s.slot)}>Laden</button>
              )}
              <button className="btn-sm danger" onClick={() => del(s.slot, s.name || s.clubName)}>Löschen</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
