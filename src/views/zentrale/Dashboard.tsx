// =============================================================================
// ZENTRALE (Zentrale › Zentrale) – Aufbau „Newscenter“:
//   links  schmale Spalte mit Kurz-Widgets (dash/LeftWidgets.tsx, scrollt intern),
//   Mitte  Newscenter: Nachrichtenliste + Lesebereich (dash/Newscenter.tsx),
//   rechts Nächstes Spiel, Teamstatus, Unsere Besten, Zeitgeist (dash/RightWidgets.tsx).
// Das Hauptmenü oben und die Kalender-Überblendung während des Zeitlaufs
// (shell/CalendarOverlay.tsx) bleiben unverändert. CSS: styles/28-dash2.css.
// =============================================================================
import { useState } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal from '../../components/PlayerModal';
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { LeftColumn } from './dash/LeftWidgets';
import { Newscenter } from './dash/Newscenter';
import { RightColumn } from './dash/RightWidgets';

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
  const [playerId, setPlayerId] = useState<string | null>(null);
  const p = playerId ? g.players[playerId] ?? g.youthPlayers[playerId] : null;

  return (
    <div className="zentrale-wrap">
      <div className="dz">
        <LeftColumn g={g} onGoto={onGoto} openPlayer={setPlayerId} />
        <Newscenter g={g} onGoto={onGoto} onWatch={onWatch} onChange={changed} openPlayer={setPlayerId} />
        <RightColumn g={g} onGoto={onGoto} />
      </div>
      {p && createPortal(
        <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
          today={today} season={g.season} onClose={() => setPlayerId(null)} />, document.body)}
    </div>
  );
}
