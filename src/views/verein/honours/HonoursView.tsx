// =============================================================================
// Verein › Erfolge › Auszeichnungen (Wunsch Pascal): alle 16 Vereinsauszeichnungen
// wie Achievements – aktive Stufen kräftig in Bronze/Silber/Gold, nicht aktive
// ausgegraut; Hover zeigt Voraussetzung und Wirkung aller Stufen (HonourBadge).
// Logik game/clubHonours.ts, Texte data/clubHonours.ts.
// =============================================================================
import { HonourBadge } from '../../../components/honours/HonourBadge';
import { HONOURS, HONOUR_GROUPS } from '../../../data/clubHonours';
import { activeHonours, honourProgress } from '../../../game/clubHonours';
import type { Game } from '../../../game/state';
import { DashBox, DashPage } from '../../../ui/DashPage';

export function HonoursView({ g, clubId }: { g: Game; clubId: string }) {
  const act = new Map(activeHonours(g, clubId).map((x) => [x.id, x.a]));
  const year = +g.calendar.currentDate.slice(0, 4) + (+g.calendar.currentDate.slice(5, 7) >= 7 ? 1 : 0);
  return (
    <DashPage className="hon-page">
      {HONOUR_GROUPS.map((grp) => {
        const list = HONOURS.filter((h) => h.group === grp);
        const n = list.filter((h) => act.has(h.id)).length;
        return (
          <DashBox key={grp} title={grp} info="auszeichnungen" right={n ? `${n} von ${list.length} aktiv` : 'keine aktiv'} className="hon-box">
            <div className="hon-grid">
              {list.map((h) => <HonourBadge key={h.id} id={h.id} active={act.get(h.id)} progress={honourProgress(g, clubId, h.id)} year={year} size={100} label />)}
            </div>
          </DashBox>
        );
      })}
    </DashPage>
  );
}

/** Kurze Leiste der aktiven Auszeichnungen (Vereinsprofil-Kopf). */
export function HonourStrip({ g, clubId }: { g: Game; clubId: string }) {
  const list = activeHonours(g, clubId);
  if (!list.length) return null;
  const year = +g.calendar.currentDate.slice(0, 4) + (+g.calendar.currentDate.slice(5, 7) >= 7 ? 1 : 0);
  return (
    <div className="hon-strip" aria-label="Vereinsauszeichnungen">
      {list.map(({ id, a }) => <HonourBadge key={id} id={id} active={a} progress={honourProgress(g, clubId, id)} year={year} size={34} />)}
    </div>
  );
}
