// =============================================================================
// ZENTRALE – rechte Spalte oben: „Übersicht“ aller Wettbewerbe (aufklappbar).
// Klick führt zu Statistiken › Liga/Pokal/International mit passender Auswahl
// (Vorauswahl über presetCompetition in CompetitionPage.tsx).
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../../game/state';
import type { Screen } from '../../../shell/navigation';
import { presetCompetition } from '../../statistiken/competition/CompetitionPage';
import { overviewSections, type OvItem } from './data';

const LS_KEY = 'fm1975_dash_open';
function loadOpen(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') ?? {}; } catch { return {}; }
}

export function Overview({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const sections = overviewSections(g);
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({ de: true, eu: true, ...loadOpen() }));
  const toggle = (k: string) => setOpen((o) => {
    const n = { ...o, [k]: !o[k] };
    try { localStorage.setItem(LS_KEY, JSON.stringify(n)); } catch { /* ohne Speicher */ }
    return n;
  });
  const go = (it: OvItem) => {
    presetCompetition(it.season, it.key);
    onGoto(it.kind === 'league' ? 'table' : it.key === 'cup' ? 'cup' : 'international');
  };
  return (
    <section className="dz-w dz-ov">
      <div className="dz-wh"><span className="dz-wt">Übersicht</span><span className="dz-wr">Saison {g.season}</span></div>
      <div className="dz-wb dz-ov-body">
        {sections.map((s) => (
          <div key={s.key} className="dz-ov-sec">
            <button className="dz-ov-head" aria-expanded={!!open[s.key]} onClick={() => toggle(s.key)}>
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className={open[s.key] ? 'open' : ''}><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{s.label}</span><span className="dz-dim">{s.items.length}</span>
            </button>
            {open[s.key] && (
              <div className="dz-ov-list">
                {s.items.map((it) => (
                  <button key={it.key} className={`dz-ov-item ${it.mine ? 'mine' : ''}`} onClick={() => go(it)} title={`${it.label} öffnen`}>
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
