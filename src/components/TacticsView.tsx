// =============================================================================
// TAKTIK — eigenständige Seite (aus dem früheren Aufstellung-Popup ausgelagert)
// =============================================================================
// Grundausrichtung + Spielverhalten der eigenen Mannschaft. Liest/schreibt
// direkt g.clubs[managedClubId].tactics (wie LineupView).
import { useState } from 'react';
import { Tactics } from '../types';
import Icon from './Icon';

// Loses Game-Interface (Vollstruktur liegt in App.tsx).
interface G {
  clubs: Record<string, any>;
  managedClubId: string;
}

const STYLE_DE: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter',
};

export default function TacticsView({ g, onChange }: { g: G; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const t: Tactics = myClub.tactics;
  const [tab, setTab] = useState<'ausrichtung' | 'verhalten'>('ausrichtung');
  const [, force] = useState(0);
  const set = (patch: Partial<Tactics>) => { Object.assign(t, patch); force((n) => n + 1); onChange(); };

  return (
    <div className="page">
      <div className="page-head">
        <span className="page-head-ico"><Icon name="tactics" /></span>
        <div className="page-head-title">Taktik</div>
        <div className="page-head-right">
          Ausrichtung: <b style={{ color: 'var(--accent)' }}>{STYLE_DE[t.style] ?? t.style}</b>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 14, maxWidth: 360 }}>
        <button className={`tab ${tab === 'ausrichtung' ? 'active' : ''}`} onClick={() => setTab('ausrichtung')}>Ausrichtung</button>
        <button className={`tab ${tab === 'verhalten' ? 'active' : ''}`} onClick={() => setTab('verhalten')}>Verhalten</button>
      </div>

      <div style={{ marginTop: 16, maxWidth: 640 }}>
        {tab === 'ausrichtung' && (
          <div className="card">
            <div className="card-title"><span className="ico">◆</span> Grundausrichtung</div>
            <div className="chip-row" style={{ marginBottom: 14 }}>
              {(['defensive', 'balanced', 'attacking', 'counter'] as const).map((s) => (
                <button key={s} className={`chip ${t.style === s ? 'active' : ''}`}
                  onClick={() => set({ style: s })}>{STYLE_DE[s]}</button>
              ))}
            </div>
            <Slider label="Tempo" hintLo="bedächtig" hintHi="hohes Tempo" value={t.tempo} onChange={(v) => set({ tempo: v })} />
            <Slider label="Pressinghöhe" hintLo="abwartend" hintHi="hohes Pressing" value={t.pressing} onChange={(v) => set({ pressing: v })} />
            <Slider label="Abwehrlinie" hintLo="tief" hintHi="hoch" value={t.defensiveLine} onChange={(v) => set({ defensiveLine: v })} />
          </div>
        )}
        {tab === 'verhalten' && (
          <div className="card">
            <div className="card-title"><span className="ico">◆</span> Spielverhalten</div>
            <Slider label="Zweikampfhärte" hintLo="fair" hintHi="kompromisslos" value={t.tackleHardness ?? 50} onChange={(v) => set({ tackleHardness: v })} />
            <Slider label="Breite" hintLo="über die Mitte" hintHi="über die Flügel" value={t.widthFocus ?? 50} onChange={(v) => set({ widthFocus: v })} />
            <div className="toggle-row" style={{ marginTop: 8 }}>
              <div className="toggle-item">
                <span>Abseitsfalle</span>
                <button className={`toggle ${t.offsideTrap ? 'on' : ''}`} onClick={() => set({ offsideTrap: !t.offsideTrap })}>
                  <span className="knob" />
                </button>
              </div>
            </div>
            <div className="toggle-row" style={{ marginTop: 12 }}>
              <span className="dim mini" style={{ marginBottom: 6 }}>Aufbauspiel</span>
              <div className="chip-row">
                <button className={`chip ${(t.buildup ?? 'short') === 'short' ? 'active' : ''}`} onClick={() => set({ buildup: 'short' })}>Kurz (Ballbesitz)</button>
                <button className={`chip ${t.buildup === 'long' ? 'active' : ''}`} onClick={() => set({ buildup: 'long' })}>Lang (direkt)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, hintLo, hintHi }: {
  label: string; value: number; onChange: (v: number) => void; hintLo: string; hintHi: string;
}) {
  return (
    <div className="tac-slider">
      <div className="row" style={{ marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span className="pill">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <div className="row dim mini"><span>{hintLo}</span><span>{hintHi}</span></div>
    </div>
  );
}
