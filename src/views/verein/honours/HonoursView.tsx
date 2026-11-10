// =============================================================================
// Verein › Erfolge › Auszeichnungen (Wunsch Pascal): je Gruppe eine Box als Tabelle –
// links die Auszeichnung, rechts die Stufen Bronze/Silber/Gold mit Medaille, darunter
// knapp Voraussetzung und Bonus. Erreichte Stufen (bis zur aktiven) in vollen Farben,
// die übrigen blass. Hover auf eine Medaille zeigt alles ausführlich (HonourBadge).
// Logik game/clubHonours.ts, Texte data/clubHonours.ts.
// =============================================================================
import { HonourBadge, HonourMedal, HonourTipBody } from '../../../components/honours/HonourBadge';
import { useFloatTip } from '../../../components/status/StatusTip';
import { HONOURS, HONOUR_GROUPS, TIER_NAME, type HonourDef } from '../../../data/clubHonours';
import { activeHonours, honourProgress, type ActiveHonour } from '../../../game/clubHonours';
import type { Game } from '../../../game/state';
import { DashBox, DashPage } from '../../../ui/DashPage';

const seasonEndYear = (iso: string) => +iso.slice(0, 4) + (+iso.slice(5, 7) >= 7 ? 1 : 0);

function TierCell({ h, i, active, progress, year }: { h: HonourDef; i: 0 | 1 | 2; active?: ActiveHonour; progress: string | null; year: number }) {
  const reached = !!active && active.tier >= i;
  const tip = useFloatTip(() => <HonourTipBody id={h.id} active={active} progress={progress} year={year} />, `${h.id}${active?.tier}`, 'hm-pop');
  const t = h.tiers[i];
  return (
    <div className={`hon-tier t${i} ${reached ? 'on' : ''} ${active?.tier === i ? 'cur' : ''}`}>
      <span className="hon-tier-medal" tabIndex={0} {...tip.handlers} aria-label={`${h.name} ${TIER_NAME[i]}${reached ? ' (erreicht)' : ''}`}>
        <HonourMedal id={h.id} tier={i} size={40} dim={!reached} />
        {tip.layer}
      </span>
      <div className="hon-tier-txt">
        <b>{TIER_NAME[i]}{active?.tier === i ? ` · bis ${active.until}` : ''}</b>
        <span className="hon-need" title={t.need}>{t.need}</span>
        <span className="hon-fx" title={t.fx}>{t.fx}</span>
      </div>
    </div>
  );
}

export function HonoursView({ g, clubId }: { g: Game; clubId: string }) {
  const act = new Map(activeHonours(g, clubId).map((x) => [x.id, x.a]));
  const year = seasonEndYear(g.calendar.currentDate);
  return (
    <DashPage className="hon-page">
      {HONOUR_GROUPS.map((grp) => {
        const list = HONOURS.filter((h) => h.group === grp);
        const n = list.filter((h) => act.has(h.id)).length;
        return (
          <DashBox key={grp} title={grp} info="auszeichnungen" right={n ? `${n} von ${list.length} aktiv` : 'keine aktiv'} className="hon-box">
            <div className="hon-table">
              {list.map((h) => {
                const a = act.get(h.id);
                const prog = honourProgress(g, clubId, h.id);
                return (
                  <div key={h.id} className={`hon-row ${a ? 'on' : ''}`}>
                    <div className="hon-name">
                      <b>{h.name}</b>
                      <span>{h.what}</span>
                      {prog && <em title={prog}>{prog}</em>}
                    </div>
                    {([0, 1, 2] as const).map((i) => <TierCell key={i} h={h} i={i} active={a} progress={prog} year={year} />)}
                  </div>
                );
              })}
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
  const year = seasonEndYear(g.calendar.currentDate);
  return (
    <div className="hon-strip" aria-label="Vereinsauszeichnungen">
      {list.map(({ id, a }) => <HonourBadge key={id} id={id} active={a} progress={honourProgress(g, clubId, id)} year={year} size={34} />)}
    </div>
  );
}
