// =============================================================================
// ZENTRALE – rechte Spalte unten: Vereinsnachrichten im Medium der Epoche
// (Stadionheft → Videotext → SMS aufs Handy → Fan-App; data/fanDevice.ts) – nur als Unterzeile,
// dargestellt als ruhige Liste wie die übrigen Boxen.
// Inhalt: Meldungen und Gerüchte zum eigenen Verein aus der Presse (game/press/).
// Klick auf eine Meldung öffnet den Artikel.
// =============================================================================
import { fanDeviceFor } from '../../../data/fanDevice';
import type { Game } from '../../../game/state';
import { WD_SHORT } from '../../../ui/format';
import type { FanItem } from './data';

const dm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
const wd = (iso: string) => WD_SHORT[new Date(iso.slice(0, 10) + 'T00:00:00Z').getUTCDay()];

export function FanDevice({ g, items, onOpen }: { g: Game; items: FanItem[]; onOpen: (it: FanItem) => void }) {
  const club = g.clubs[g.managedClubId];
  const dev = fanDeviceFor(g.calendar.currentDate);
  // Ruhige Liste im Stil der übrigen Boxen (Wunsch Pascal: die gezeichneten Geräte/Zeitungen wirkten
  // fremd). Das Medium der Epoche steht nur noch als Unterzeile im Kopf.
  const sub = dev.kind === 'videotext'
    ? `Videotext · Tafel ${200 + (club.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 60)}`
    : dev.title;
  return (
    <section className="dz-fan" title={dev.hint}>
      <div className="dz-fn">
        <div className="dz-fn-head">
          <span className="dz-fn-title">Vereinsnachrichten</span>
          <span className="dz-fn-sub">{sub}</span>
        </div>
        <div className="dz-fn-list">
          {items.length === 0 ? <div className="dz-fan-empty">Noch keine Meldungen zu deinem Verein.</div> : items.map((it) => (
            <button key={it.id} className="dz-fn-item" onClick={() => onOpen(it)}>
              <span className="dz-fn-date">{wd(it.date)} {dm(it.date)}</span>
              <span className="dz-fn-text">
                {it.rumor && <span className="dz-fn-tag">Gerücht</span>}
                {it.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
