// =============================================================================
// SAISON-BRIEFING — großes Popup (modal-xl) mit Reitern
//   Überblick · Fußball · Gesellschaft · Damals & heute · Neu im Spiel
// Öffnet automatisch zu Spielbeginn und am Saisonwechsel (GameShell, Einstellung
// „Saison-Briefing automatisch anzeigen“) sowie aus dem Archiv Zentrale › Briefing.
// Inhalt: game/seasonBriefing.ts (composeBriefing).
// =============================================================================
import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import type { SeasonBriefing } from '../../game/seasonBriefing';
import { ChangesTab, DiffTab, Highlights, ItemGrid, Situation } from './briefing/BriefingParts';

export type BriefingTab = 'overview' | 'football' | 'society' | 'diff' | 'ingame';

export function briefingTabs(b: SeasonBriefing): { key: BriefingTab; label: string; icon: string; count?: number }[] {
  const diffCount = b.first ? b.differences.reduce((a, g) => a + g.items.length, 0) : b.ended.length + b.started.length + b.lastSeason.length;
  return [
    { key: 'overview', label: 'Überblick', icon: 'briefing' },
    { key: 'football', label: 'Fußball', icon: 'matchball', count: b.football.length },
    { key: 'society', label: 'Gesellschaft', icon: 'politics', count: b.society.length },
    { key: 'diff', label: 'Damals & heute', icon: 'hourglass', count: diffCount },
    { key: 'ingame', label: 'Neu im Spiel', icon: 'unlock', count: b.inGame.length },
  ];
}

export function BriefingModal({ b, onClose, initialTab = 'overview' }: { b: SeasonBriefing; onClose: () => void; initialTab?: BriefingTab }) {
  const [tab, setTab] = useState<BriefingTab>(initialTab);
  useEffect(() => { setTab(initialTab); }, [b.season, initialTab]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const tabs = briefingTabs(b);
  const idx = tabs.findIndex((t) => t.key === tab);
  const next = tabs.slice(idx + 1).find((t) => t.count == null || t.count > 0);

  return (
    <div className="modal-overlay bf-overlay" onClick={onClose}>
      <div className="modal modal-xl bf-modal" role="dialog" aria-label={`Saison-Briefing ${b.season}`} onClick={(e) => e.stopPropagation()}>
        <div className="mx-head bf-head">
          <span className="bf-head-ico"><Icon name="briefing" size={46} /></span>
          <div className="bf-head-id">
            <div className="mx-sub">Saison-Briefing {b.season} · {b.first ? 'Spielbeginn' : 'Saisonwechsel'}</div>
            <h2>{b.headline}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <nav className="tabs bf-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon name={t.icon} size={18} /> {t.label}{t.count != null && <span className="bf-count">{t.count}</span>}
            </button>
          ))}
        </nav>

        <div className="mx-body bf-body">
          {tab === 'overview' && (
            <div className="bf-overview">
              <section className="bf-ov-main">
                <h3 className="bf-title">{b.title}</h3>
                <Highlights list={b.highlights} />
              </section>
              <aside className="bf-ov-side">
                <h4 className="bf-sec-title"><Icon name="dashVerein" size={20} /> Deine Ausgangslage</h4>
                <Situation sit={b.situation} year={b.startYear} />
                <h4 className="bf-sec-title mt"><Icon name="briefing" size={20} /> Mehr in den Reitern</h4>
                <div className="bf-jump">
                  {tabs.slice(1).map((t) => (
                    <button key={t.key} className="bf-jump-btn" onClick={() => setTab(t.key)} disabled={!t.count}>
                      <Icon name={t.icon} size={18} /><span>{t.label}</span><b>{t.count ?? 0}</b>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}
          {tab === 'football' && <ItemGrid items={b.football} empty="Für diese Saison liegen noch keine Fußball-Texte vor." />}
          {tab === 'society' && <ItemGrid items={b.society} empty="Für diese Saison liegen noch keine Texte zur Gesellschaft vor." />}
          {tab === 'diff' && <DiffTab b={b} />}
          {tab === 'ingame' && <ChangesTab list={b.inGame} first={b.first} />}
        </div>

        <div className="mx-foot bf-foot">
          <span className="bf-foot-hint">Alle Briefings findest du unter Zentrale › Briefing.</span>
          {next && <button className="btn-sm" onClick={() => setTab(next.key)}>{next.label} ›</button>}
          <button className="btn-primary bf-continue" onClick={onClose}>Weiter</button>
        </div>
      </div>
    </div>
  );
}
