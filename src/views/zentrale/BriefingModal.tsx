// =============================================================================
// SAISON-BRIEFING — Fenster in Textmodus-Größe (ganze Spielfläche)
//   1) Auftakt-Animation (briefing/SeasonIntro.tsx), überspringbar
//   2) Reiter: Überblick · Aufgaben & Tipps · Fußball · Gesellschaft ·
//      Damals & heute · Neu im Spiel
// Öffnet automatisch zu Spielbeginn und am Saisonwechsel (GameShell, Einstellungen
// „Saison-Briefing automatisch anzeigen“ + „Auftakt-Animation zeigen“) sowie aus
// dem Archiv Zentrale › Briefing (dort ohne Animation).
// Inhalt: game/seasonBriefing.ts, Aufgaben game/seasonTasks.ts, Tipps data/briefings/eraTips.ts.
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { eraFor, eraTipsFor } from '../../data/briefings/eraTips';
import type { SeasonBriefing } from '../../game/seasonBriefing';
import { seasonTasks } from '../../game/seasonTasks';
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { ChangesTab, DiffTab, Highlights, ItemGrid, Situation } from './briefing/BriefingParts';
import { SeasonIntro } from './briefing/SeasonIntro';
import { EraBand, TaskList, TasksTab, screenOfWhere, taskSummary } from './briefing/TasksPanel';

export type BriefingTab = 'overview' | 'tasks' | 'football' | 'society' | 'diff' | 'ingame';

export function briefingTabs(b: SeasonBriefing, taskCount?: number): { key: BriefingTab; label: string; icon: string; count?: number }[] {
  const diffCount = b.first ? b.differences.reduce((a, g) => a + g.items.length, 0) : b.ended.length + b.started.length + b.lastSeason.length;
  return [
    { key: 'overview', label: 'Überblick', icon: 'briefing' },
    { key: 'tasks', label: 'Aufgaben & Tipps', icon: 'tactics', count: taskCount },
    { key: 'football', label: 'Fußball', icon: 'matchball', count: b.football.length },
    { key: 'society', label: 'Gesellschaft', icon: 'politics', count: b.society.length },
    { key: 'diff', label: 'Damals & heute', icon: 'hourglass', count: diffCount },
    { key: 'ingame', label: 'Neu im Spiel', icon: 'unlock', count: b.inGame.length },
  ];
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
type Phase = 'intro' | 'outro' | 'content';

export function BriefingModal({ b, g, onClose, onGoto, initialTab = 'overview', auto = false, intro = false }: {
  b: SeasonBriefing;
  g?: Game;
  onClose: () => void;
  /** Direktsprung aus Aufgaben/Tipps (schließt das Fenster). */
  onGoto?: (s: Screen) => void;
  initialTab?: BriefingTab;
  /** Automatisch geöffnet (Spielbeginn/Saisonwechsel) statt aus dem Archiv. */
  auto?: boolean;
  /** Auftakt-Animation zeigen. */
  intro?: boolean;
}) {
  const [tab, setTab] = useState<BriefingTab>(initialTab);
  const [phase, setPhase] = useState<Phase>(intro && !reducedMotion() ? 'intro' : 'content');
  useEffect(() => { setTab(initialTab); }, [b.season, initialTab]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const skip = useCallback(() => {
    if (phaseRef.current !== 'intro') return;
    setPhase('outro');
    setTimeout(() => setPhase('content'), 480);
  }, []);

  // Tasten im Capture-Modus abfangen, damit die Leertaste nicht die Zeit startet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const k = e.key;
      if (phaseRef.current !== 'content') {
        if (k === ' ' || k === 'Enter' || k === 'Escape') { e.preventDefault(); e.stopPropagation(); skip(); }
        return;
      }
      if (k === 'Escape') { e.stopPropagation(); onClose(); }
      else if (k === ' ') { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, skip]);

  const club = g?.clubs[g.managedClubId];
  const era = eraFor(b.startYear);
  const tips = useMemo(() => eraTipsFor(b.startYear), [b.startYear]);
  // Aufgaben nur für die laufende Saison (aus dem aktuellen Spielstand).
  const tasks = useMemo(() => (g && g.season === b.season ? seasonTasks(g, b.situation, b.inGame) : null), [g, b]);
  const navigate = onGoto ? (where: string) => { const s = screenOfWhere(where); if (s) { onClose(); onGoto(s); } } : undefined;

  const tabs = briefingTabs(b, tasks?.length);
  const idx = tabs.findIndex((t) => t.key === tab);
  const next = tabs.slice(idx + 1).find((t) => t.count == null || t.count > 0);

  return (
    <div className={`si-root si-motif-${era.motif}`} role="dialog" aria-label={`Saison-Briefing ${b.season}`}>
      {phase !== 'content' && <SeasonIntro b={b} club={club} era={era} leaving={phase === 'outro'} onSkip={skip} />}
      {phase !== 'intro' && (
        <div className={`si-window bf-modal ${intro ? 'from-intro' : ''}`}>
          <header className="si-head">
            {club ? <span className="si-head-crest"><ClubCrest club={club} size={64} /></span>
              : <span className="bf-head-ico"><Icon name="briefing" size={46} /></span>}
            <div className="si-head-id">
              <div className="si-head-kicker">Saison-Briefing · {b.first ? 'Spielbeginn' : 'Saisonwechsel'}{club ? ` · ${club.name}` : ''}</div>
              <h2>{b.headline}</h2>
            </div>
            <div className="si-head-season">{b.season}</div>
            <button className="modal-close si-close" onClick={onClose} aria-label="Schließen">×</button>
          </header>

          <nav className="tabs bf-tabs">
            {tabs.map((t) => (
              <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <Icon name={t.icon} size={18} /> {t.label}{t.count != null && <span className="bf-count">{t.count}</span>}
              </button>
            ))}
          </nav>

          <div className="si-body bf-body">
            {tab === 'overview' && (
              <div className="si-overview">
                <aside className="si-ov-sit">
                  <h4 className="bf-sec-title">Deine Ausgangslage</h4>
                  <Situation sit={b.situation} year={b.startYear} />
                </aside>
                <section className="si-ov-main">
                  <h4 className="bf-sec-title">{b.title}</h4>
                  <Highlights list={b.highlights} compact />
                </section>
                <section className="si-ov-tasks">
                  <h4 className="bf-sec-title">Deine Aufgaben
                    {tasks?.length ? <span className="si-sum">{taskSummary(tasks)}</span> : null}</h4>
                  <TaskList tasks={tasks} onNavigate={navigate} limit={4} />
                  {tasks && tasks.length > 4 && <button className="si-more" onClick={() => setTab('tasks')}>Alle {tasks.length} Aufgaben ›</button>}
                </section>
                <EraBand era={era} tips={tips} onNavigate={navigate} />
              </div>
            )}
            {tab === 'tasks' && <TasksTab tasks={tasks} era={era} tips={tips} onNavigate={navigate} />}
            {tab === 'football' && <ItemGrid items={b.football} empty="Für diese Saison liegen noch keine Fußball-Texte vor." />}
            {tab === 'society' && <ItemGrid items={b.society} empty="Für diese Saison liegen noch keine Texte zur Gesellschaft vor." />}
            {tab === 'diff' && <DiffTab b={b} />}
            {tab === 'ingame' && <ChangesTab list={b.inGame} first={b.first} />}
          </div>

          <footer className="si-foot">
            <span className="bf-foot-hint">Alle Briefings findest du unter Zentrale › Briefing. Die Zeit steht, solange dieses Fenster offen ist.</span>
            {next && <button className="ms-btn ghost" onClick={() => setTab(next.key)}>{next.label} ›</button>}
            <button className="btn-primary bf-continue" onClick={onClose}>{auto ? (b.first ? 'Los geht’s' : 'Saison starten') : 'Schließen'}</button>
          </footer>
        </div>
      )}
    </div>
  );
}
