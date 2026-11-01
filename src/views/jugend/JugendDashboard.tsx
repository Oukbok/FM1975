import { yearOf } from '../../engine/economy';
import { originClubOf } from '../../engine/persona';
import { Game } from '../../game/state';
import { youthInvestOf } from '../../game/youthInvest';
import { Screen } from '../../shell/navigation';
import { YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_ORDER, youthAgeClass } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { PlayerRow, squadOf } from '../shared';
import { ScoutStars } from '../shared';

// =============================================================================
// JUGEND — Kategorie-Übersicht (Akademie, Talente, Mannschaften, Eigengewächse)
// =============================================================================
export function JugendDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const inv = youthInvestOf(club, year);
  const youth = club.youthPlayerIds.map((id) => g.youthPlayers[id]).filter(Boolean);
  const mid = (p: (typeof youth)[number]) => ((p.scoutedPotentialMin ?? 0) + (p.scoutedPotentialMax ?? 0)) / 2;
  const top = youth.filter((p) => p.age >= 13).sort((a, b) => mid(b) - mid(a)).slice(0, 6);
  const byClass = YOUTH_AGE_CLASS_ORDER.map((c) => ({ c, n: youth.filter((p) => youthAgeClass(p.age) === c).length })).filter((x) => x.n > 0).reverse();
  const homegrown = squadOf(g).filter((p) => originClubOf(p.id).homegrown && originClubOf(p.id).clubId === club.id).sort((a, b) => b.overall - a.overall);
  const ready = youth.filter((p) => p.age >= 17).sort((a, b) => b.overall - a.overall).slice(0, 5);
  return (
    <DashPage>
      <DashBox title="Akademie" icon="facilities" onClick={() => onGoto('akademie')}>
        <div className="dkpis">
          <Kpi value={Math.round(inv.quality)} label="Ausbildung" />
          <Kpi value={Math.round(inv.reputation)} label="Ruf" />
          <Kpi value={inv.coachCount} label="Jugendtrainer" />
        </div>
        <Meter label="Ausbildungsqualität" value={inv.quality} />
        <Meter label="Ruf der Akademie" value={inv.reputation} />
        <Meter label="Durchlässigkeit" value={inv.perspective} />
        {inv.builds.length > 0 && <div className="dnote mt8">{inv.builds.length} Ausbau{inv.builds.length > 1 ? 'ten' : ''} laufen.</div>}
      </DashBox>

      <DashBox title="Größte Talente" icon="youth" onClick={() => onGoto('youth')} right="ab 13 Jahre">
        {top.length ? top.map((p) => (
          <PlayerRow key={p.id} p={p} sub={`${p.age} J.`} value={p.scoutedPotentialMin != null ? `${p.scoutedPotentialMin}–${p.scoutedPotentialMax}` : '–'} color="var(--text-2)" />
        )) : <Empty icon="youth">Noch keine Talente.</Empty>}
      </DashBox>

      <DashBox title="Jugendmannschaften" icon="squad" onClick={() => onGoto('youth')}>
        {byClass.length ? byClass.map(({ c, n }) => <KV key={c} k={YOUTH_AGE_CLASS_LABEL[c]} v={`${n} Spieler`} />) : <Empty icon="squad">Keine Jugendmannschaften.</Empty>}
      </DashBox>

      <DashBox title="Bald bereit für die Profis" icon="lineup" onClick={() => onGoto('youth')} right="ab 17 Jahre">
        {ready.length ? ready.map((p) => <PlayerRow key={p.id} p={p} sub={`${p.age} J. · ${p.naturalPosition}`} value={p.overall} />) : <Empty icon="lineup">Niemand im Alter für den Sprung.</Empty>}
      </DashBox>

      <DashBox title="Eigengewächse im Profikader" icon="dashKader" onClick={() => onGoto('squad')} right={`${homegrown.length}`}>
        {homegrown.length ? homegrown.slice(0, 6).map((p) => <PlayerRow key={p.id} p={p} sub={`${p.age} J.`} value={<ScoutStars p={p} />} />) : <Empty icon="dashKader">Noch kein Spieler aus der eigenen Jugend bei den Profis.</Empty>}
      </DashBox>

      <DashBox title="Jugendwettbewerbe" icon="trophy" onClick={() => onGoto('jugendwettbewerbe')}>
        <Empty icon="trophy">Meisterschaften und Pokale der Jugend folgen bald.</Empty>
      </DashBox>
    </DashPage>
  );
}
