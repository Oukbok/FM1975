import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal from '../../components/PlayerModal';
import { buildEdition, pressIssues } from '../../game/press/edition';
import { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { DashBox, DashPage } from '../../ui/DashPage';
import { ArticleModal } from './presse/ArticleModal';
import { Newspaper } from './presse/Newspaper';
import type { PressApi } from './presse/parts';

// =============================================================================
// PRESSE — Sportzeitung des Spiels (Zentrale › Presse)
// Ausgaben montags + donnerstags und die aktuelle Ausgabe des Tages, jeweils aus
// dem Spielstand rekonstruiert (game/press/). Schlagzeilen öffnen den Artikel,
// Gesichter das Spielerprofil, Wappen/Vereinsnamen das Vereinsprofil.
// =============================================================================
const dm = (iso: string) => `${['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(iso + 'T00:00:00Z').getUTCDay()]} ${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

export function PresseView({ g, onWatch, onGoto }: { g: Game; onWatch: (matchId: string) => void; onGoto: (s: Screen) => void }) {
  const today = g.calendar.currentDate;
  const issues = useMemo(() => pressIssues(g), [g, today]);
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, issues.length - 1);
  const date = issues[idx];
  const ed = useMemo(() => buildEdition(g, date), [g, date, today, g.messages.length]);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const story = storyId ? [ed.lead, ...ed.stories, ...ed.briefs].find((s) => s?.id === storyId) ?? null : null;
  const p = playerId ? g.players[playerId] ?? g.youthPlayers[playerId] : null;
  const api: PressApi = { g, openPlayer: setPlayerId, openStory: setStoryId, onWatch: (id) => { setStoryId(null); onWatch(id); } };

  const nav = (
    <span className="np-nav">
      <button className="dchip" disabled={idx >= issues.length - 1} onClick={() => setSel(idx + 1)} title="Ältere Ausgabe">Ältere</button>
      <span className="np-nav-list">
        {issues.slice(0, 8).map((d, i) => (
          <button key={d} className={`dchip ${i === idx ? 'on' : ''}`} onClick={() => setSel(i)} title={i === 0 ? 'Aktuelle Ausgabe' : `Ausgabe vom ${dm(d)}`}>
            {i === 0 ? 'Heute' : dm(d)}
          </button>
        ))}
      </span>
      <button className="dchip" disabled={idx === 0} onClick={() => setSel(idx - 1)} title="Neuere Ausgabe">Neuere</button>
    </span>
  );

  return (
    <DashPage className="np-page">
      <DashBox title="Presse" icon="presse" info="presse" span={3} rows={2} right={nav} flush className="np-box">
        <Newspaper key={date} api={api} ed={ed} />
        {story && createPortal(
          <ArticleModal api={api} s={story} ed={ed} onClose={() => setStoryId(null)} onGoto={onGoto} />, document.body)}
        {p && createPortal(
          <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
            today={today} season={g.season} onClose={() => setPlayerId(null)} />, document.body)}
      </DashBox>
    </DashPage>
  );
}
