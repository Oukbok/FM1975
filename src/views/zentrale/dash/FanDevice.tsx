// =============================================================================
// ZENTRALE – rechte Spalte unten: Vereinsnachrichten im Medium der Epoche
// (Stadionheft → Videotext → SMS aufs Handy → Fan-App; data/fanDevice.ts).
// Inhalt: Meldungen und Gerüchte zum eigenen Verein aus der Presse (game/press/).
// Klick auf eine Meldung öffnet den Artikel.
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import { fanDeviceFor } from '../../../data/fanDevice';
import type { Game } from '../../../game/state';
import { WD_SHORT } from '../../../ui/format';
import type { FanItem } from './data';

const dm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
const wd = (iso: string) => WD_SHORT[new Date(iso.slice(0, 10) + 'T00:00:00Z').getUTCDay()];

export function FanDevice({ g, items, onOpen }: { g: Game; items: FanItem[]; onOpen: (it: FanItem) => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const dev = fanDeviceFor(today);
  const empty = <div className="dz-fan-empty">Noch keine Meldungen zu deinem Verein.</div>;
  const click = (it: FanItem) => () => onOpen(it);

  if (dev.kind === 'heft') {
    return (
      <section className="dz-fan dz-fan-heft" title={dev.hint}>
        <div className="dz-heft">
          <div className="dz-heft-mast">
            <ClubCrest club={club} size={34} />
            <div><b>{club.name}</b><span>Stadionheft · Vereinsnachrichten</span></div>
          </div>
          <div className="dz-heft-list">
            {items.length === 0 ? empty : items.map((it) => (
              <button key={it.id} className="dz-heft-item" onClick={click(it)}>
                <span className="dz-heft-date">{dm(it.date)}</span>
                <span className={it.rumor ? 'rumor' : ''}>{it.rumor ? 'Man munkelt: ' : ''}{it.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (dev.kind === 'videotext') {
    const page = 200 + (club.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 60);
    return (
      <section className="dz-fan dz-fan-tv" title={dev.hint}>
        <div className="dz-tv">
          <div className="dz-tv-screen">
            <div className="dz-vt-top"><span>{page}</span><span>VIDEOTEXT</span><span>{wd(today)} {dm(today)}</span></div>
            <div className="dz-vt-band">{club.shortName || club.name} · VEREINSNEWS</div>
            <div className="dz-vt-list">
              {items.length === 0 ? empty : items.map((it, i) => (
                <button key={it.id} className="dz-vt-item" onClick={click(it)}>
                  <span className="dz-vt-date">{dm(it.date)}</span>
                  <span className={it.rumor ? 'rumor' : ''}>{it.title}</span>
                  <span className="dz-vt-page">{page + 1 + i}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="dz-tv-foot"><i /><i /><span>{dev.title}</span></div>
        </div>
      </section>
    );
  }

  if (dev.kind === 'sms') {
    return (
      <section className="dz-fan dz-fan-sms" title={dev.hint}>
        <div className="dz-phone">
          <div className="dz-phone-ear" />
          <div className="dz-lcd">
            <div className="dz-lcd-top"><span>{(club.shortName || club.name).toUpperCase()}-INFO</span><span>{dm(today)}</span></div>
            <div className="dz-lcd-list">
              {items.length === 0 ? empty : items.map((it, i) => (
                <button key={it.id} className="dz-lcd-item" onClick={click(it)}>
                  <span className="dz-lcd-head">{i + 1}/{items.length} {dm(it.date)}</span>
                  <span>{it.rumor ? 'GERUECHT: ' : ''}{it.title}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="dz-keys">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="dz-fan dz-fan-app" title={dev.hint}>
      <div className="dz-smart">
        <div className="dz-smart-notch" />
        <div className="dz-app">
          <div className="dz-app-head" style={{ ['--club' as string]: club.colors.primary }}>
            <ClubCrest club={club} size={34} />
            <div><b>{club.name}</b><span>Fan-App</span></div>
          </div>
          <div className="dz-app-sec">Vereinsnachrichten</div>
          <div className="dz-app-list">
            {items.length === 0 ? empty : items.map((it) => (
              <button key={it.id} className="dz-app-item" onClick={click(it)}>
                <span className="dz-app-date">{wd(it.date)} {dm(it.date)}{it.rumor ? ' · Gerücht' : ''}</span>
                <span className={it.rumor ? 'rumor' : ''}>{it.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="dz-smart-bar" />
      </div>
    </section>
  );
}
