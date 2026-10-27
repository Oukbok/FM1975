import { CalendarEngine } from '../engine/calendar';
import { SaveMeta } from '../engine/save';

// -----------------------------------------------------------------------------
// SPIEL LADEN
// -----------------------------------------------------------------------------
export function LoadGameScreen({ saves, onBack, onLoad, onDelete }: {
  saves: SaveMeta[]; onBack: () => void; onLoad: (slot: string) => void; onDelete: (slot: string) => void;
}) {
  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Spiel laden</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>
      {saves.length === 0 ? (
        <div className="card mt16 dim" style={{ textAlign: 'center', padding: 30 }}>Keine Speicherstände vorhanden.</div>
      ) : (
        <div className="mt16" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {saves.map((s) => (
            <div key={s.slot} className="card hoverable" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{s.clubName} <span className="dim2 mini">· {s.season}</span></div>
                <div className="dim mini">Manager: {s.managerName} · Spieldatum: {CalendarEngine.formatDate(s.gameDate)}</div>
                <div className="dim2 mini">Gespeichert: {new Date(s.savedAt).toLocaleString('de-DE')}</div>
              </div>
              <button className="btn-sm btn-primary" onClick={() => onLoad(s.slot)}>Laden</button>
              <button className="btn-sm danger" onClick={() => { if (confirm(`Speicherstand "${s.clubName}" löschen?`)) onDelete(s.slot); }}>Löschen</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
