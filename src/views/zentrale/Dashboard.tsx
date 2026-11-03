// =============================================================================
// ZENTRALE (Zentrale › Zentrale) – Aufbau „Newscenter“:
//   links  schmale Spalte mit Kurz-Widgets (dash/LeftWidgets.tsx, scrollt intern),
//   Mitte  Newscenter: Nachrichtenliste + Lesebereich (dash/Newscenter.tsx),
//   rechts Übersicht der Wettbewerbe (dash/Overview.tsx) + Vereinsnachrichten im
//          Medium der Epoche (dash/FanDevice.tsx, data/fanDevice.ts).
// Das Hauptmenü oben und die Kalender-Überblendung während des Zeitlaufs
// (shell/CalendarOverlay.tsx) bleiben unverändert. CSS: styles/28-dash2.css.
// =============================================================================
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal from '../../components/PlayerModal';
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { ArticleModal } from './presse/ArticleModal';
import type { PressApi } from './presse/parts';
import { fanFeed, type FanItem } from './dash/data';
import { FanDevice } from './dash/FanDevice';
import { LeftColumn } from './dash/LeftWidgets';
import { Newscenter } from './dash/Newscenter';
import { Overview } from './dash/Overview';

export function Dashboard({ g, onGoto, onWatch, onChange }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void;
  /** Spielstand geändert (gelesen, Entscheidung …) → neu zeichnen. */
  onChange?: () => void;
  /** Früher „Bearbeiten“ im Vereinsüberblick; bleibt für die Aufrufstelle erhalten. */
  onOpenEditor?: () => void;
}) {
  const [, tick] = useState(0);
  const changed = () => { tick((t) => t + 1); onChange?.(); };
  const today = g.calendar.currentDate;
  const feed = useMemo(() => fanFeed(g), [g, today, g.messages?.length]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [fanItem, setFanItem] = useState<FanItem | null>(null);
  const p = playerId ? g.players[playerId] ?? g.youthPlayers[playerId] : null;
  const api: PressApi = { g, openPlayer: setPlayerId, openStory: () => {}, onWatch: (id) => { setFanItem(null); onWatch(id); } };

  return (
    <div className="zentrale-wrap">
      <div className="dz">
        <LeftColumn g={g} onGoto={onGoto} openPlayer={setPlayerId} />
        <Newscenter g={g} onGoto={onGoto} onWatch={onWatch} onChange={changed} openPlayer={setPlayerId} />
        <div className="dz-col dz-right">
          <Overview g={g} onGoto={onGoto} />
          <FanDevice g={g} items={feed} onOpen={setFanItem} />
        </div>
      </div>
      {fanItem && createPortal(
        <ArticleModal api={api} s={fanItem.story} ed={fanItem.ed} onClose={() => setFanItem(null)} onGoto={(s) => { setFanItem(null); onGoto(s); }} />, document.body)}
      {p && createPortal(
        <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
          today={today} season={g.season} onClose={() => setPlayerId(null)} />, document.body)}
    </div>
  );
}
