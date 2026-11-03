// =============================================================================
// Saison-Briefing — „Deine Aufgaben“ (game/seasonTasks.ts) und „Typisch für
// diese Spielzeit“ (data/briefings/eraTips.ts) mit Direktsprung zur Seite.
// Ziel einer Aufgabe ist ein Pfad „Kategorie › Unterpunkt“ aus MENU_STRUCTURE.
// =============================================================================
import Icon from '../../../components/Icon';
import { topicMeta } from '../../../data/briefings';
import type { EraTip, EraTipSet } from '../../../data/briefings/eraTips';
import { SeasonTask, TASK_LEVEL_LABEL, TaskLevel } from '../../../game/seasonTasks';
import { MENU_STRUCTURE, Screen } from '../../../shell/navigation';

/** „Kader › Verträge“ → Screen (null, wenn es die Seite nicht gibt). */
export function screenOfWhere(where?: string): Screen | null {
  if (!where) return null;
  const [cat, sub] = where.split('›').map((s) => s.trim());
  const c = MENU_STRUCTURE.find((x) => x.label === cat);
  if (c && !sub) return c.dash;
  // Unterpunkt auch in anderer Kategorie suchen (ältere Pfade nach Menü-Umbau, z. B. „Kader › Akademie“).
  return c?.subs.find((s) => s.label === sub)?.screen
    ?? MENU_STRUCTURE.flatMap((x) => x.subs).find((s) => s.label === sub)?.screen ?? null;
}

export type Navigate = (where: string) => void;

function JumpButton({ where, onNavigate }: { where?: string; onNavigate?: Navigate }) {
  if (!where) return null;
  const ok = !!onNavigate && !!screenOfWhere(where);
  return ok
    ? <button className="si-jump" onClick={() => onNavigate!(where)} title={`Zu ${where}`}>{where} <span aria-hidden>›</span></button>
    : <span className="si-where">{where}</span>;
}

export function TaskList({ tasks, onNavigate, limit, empty }: { tasks: SeasonTask[] | null; onNavigate?: Navigate; limit?: number; empty?: string }) {
  if (!tasks) return <p className="bf-empty">Aufgaben gibt es nur für die laufende Saison – für frühere Briefings bleiben die Epochen-Tipps.</p>;
  if (!tasks.length) return <p className="bf-empty">{empty ?? 'Alles im Griff – keine offenen Aufgaben zum Saisonstart.'}</p>;
  const list = limit ? tasks.slice(0, limit) : tasks;
  return (
    <ul className="si-tasks">
      {list.map((t) => (
        <li key={t.id} className={`si-task lv-${t.level}`}>
          <span className="si-task-ico"><Icon name={t.icon} size={22} /></span>
          <span className="si-task-main">
            <span className="si-task-head"><span className={`si-level lv-${t.level}`}>{TASK_LEVEL_LABEL[t.level]}</span><b>{t.title}</b></span>
            <span className="si-task-text">{t.text}</span>
            <JumpButton where={t.where} onNavigate={onNavigate} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Zählung je Stufe für Kopfzeilen („2 dringend · 3 wichtig“). */
export function taskSummary(tasks: SeasonTask[]): string {
  const n = (l: TaskLevel) => tasks.filter((t) => t.level === l).length;
  return (['dringend', 'wichtig', 'tipp'] as TaskLevel[]).filter((l) => n(l)).map((l) => `${n(l)} ${TASK_LEVEL_LABEL[l].toLowerCase()}`).join(' · ');
}

/** Band „Typisch für diese Spielzeit“: kurze Karten (Überblick). */
export function EraBand({ era, tips, onNavigate }: { era: EraTipSet; tips: EraTip[]; onNavigate?: Navigate }) {
  return (
    <section className="si-era-band">
      <h4 className="bf-sec-title">Typisch für diese Spielzeit <span className="si-era-name">{era.label}</span></h4>
      <div className="si-era-cards">
        {tips.slice(0, 4).map((t, i) => (
          <article key={i} className="si-era-card">
            <header><Icon name={topicMeta(t.topic).icon} size={18} /><b>{t.title}</b></header>
            <p>{t.inGame}</p>
            <JumpButton where={t.where} onNavigate={onNavigate} />
          </article>
        ))}
      </div>
    </section>
  );
}

/** Reiter „Aufgaben & Tipps“: links alle Aufgaben, rechts alle Epochen-Tipps ausführlich. */
export function TasksTab({ tasks, era, tips, onNavigate }: { tasks: SeasonTask[] | null; era: EraTipSet; tips: EraTip[]; onNavigate?: Navigate }) {
  return (
    <div className="si-tasks-tab">
      <section>
        <h4 className="bf-sec-title">Deine Aufgaben{tasks?.length ? <span className="bf-count">{tasks.length}</span> : null}</h4>
        <TaskList tasks={tasks} onNavigate={onNavigate} />
      </section>
      <section>
        <h4 className="bf-sec-title">Typisch für diese Spielzeit</h4>
        <p className="bf-lead si-era-lead">{era.label} ({era.from}{era.to < 2099 ? `–${era.to}` : ' und später'})</p>
        <div className="si-tips">
          {tips.map((t, i) => (
            <article key={i} className="si-tip">
              <header><Icon name={topicMeta(t.topic).icon} size={22} /><span className="bf-kicker">{topicMeta(t.topic).label}</span></header>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <div className="bf-ingame"><Icon name="unlock" size={16} /><span><b>Für dich:</b> {t.inGame}</span></div>
              <JumpButton where={t.where} onNavigate={onNavigate} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
