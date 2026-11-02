import { useEffect, useState } from 'react';
import { CalendarEngine } from '../engine/calendar';
import { BuiltinSave, SaveMeta, fetchBuiltinSaves, importBuiltinSave } from '../engine/save';

// -----------------------------------------------------------------------------
// SPIEL LADEN – eigene Spielstände + Vorlagen (mitgelieferte Spielstände)
// -----------------------------------------------------------------------------
export function LoadGameScreen({ saves, onBack, onLoad, onDelete }: {
  saves: SaveMeta[]; onBack: () => void; onLoad: (slot: string) => void; onDelete: (slot: string) => void;
}) {
  const own = saves.filter((s) => !s.slot.startsWith('vorlage-'));
  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Spiel laden</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>
      {own.length === 0 ? (
        <div className="card mt16 dim" style={{ textAlign: 'center', padding: 30 }}>Keine eigenen Speicherstände vorhanden.</div>
      ) : (
        <div className="mt16" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {own.map((s) => (
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
      <BuiltinSaveList onLoad={onLoad} />
    </div>
  );
}

/** Vorlagen zum Ausprobieren (public/saves). Laden kopiert die Vorlage frisch in einen eigenen Slot. */
export function BuiltinSaveList({ onLoad }: { onLoad: (slot: string) => void }) {
  const [list, setList] = useState<BuiltinSave[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { let on = true; fetchBuiltinSaves().then((l) => on && setList(l)); return () => { on = false; }; }, []);
  if (!list?.length) return null;
  const load = async (b: BuiltinSave) => {
    setBusy(b.file); setErr(null);
    try { onLoad(await importBuiltinSave(b)); } catch (e) { setErr(e instanceof Error ? e.message : 'Laden fehlgeschlagen'); } finally { setBusy(null); }
  };
  return (
    <>
      <h3 className="mt16" style={{ margin: '20px 0 0' }}>Vorlagen</h3>
      <div className="dim mini">Mitgelieferte Spielstände zum Ausprobieren. Laden beginnt jedes Mal frisch vom Stand der Vorlage.</div>
      <div className="mt12" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((b) => (
          <div key={b.file} className="card hoverable" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{b.name} <span className="dim2 mini">· {b.clubName} · {b.season}</span></div>
              <div className="dim mini">Spieldatum: {CalendarEngine.formatDate(b.gameDate)}{b.note ? ` · ${b.note}` : ''}</div>
            </div>
            <button className="btn-sm btn-primary" disabled={busy !== null} onClick={() => load(b)}>{busy === b.file ? 'Lädt …' : 'Laden'}</button>
          </div>
        ))}
      </div>
      {err && <div className="dnote mt8" style={{ color: 'var(--neg)' }}>{err}</div>}
    </>
  );
}
