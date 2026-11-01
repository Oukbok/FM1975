import Icon from '../../components/Icon';
import { campDestination } from '../../data/campDestinations';
import { economyScale, yearOf } from '../../engine/economy';
import { coachingReport, FOCUS_LABEL, memberMonthlySalary, phaseOf, PHASE_LABEL } from '../../engine/staffPeople';
import { DAY_SHORT, EFFECT_GROUPS, SLOT_KEYS, mondayOf } from '../../engine/trainingPlan';
import { BLOCKS_BY_ID } from '../../engine/weeklyTraining';
import { Game } from '../../game/state';
import { ensureStaff } from '../../game/staffGame';
import { ensureStaffWorld, marketForRole } from '../../game/staffWorld';
import { roleLabel } from '../../game/trainerTeam';
import { currentWeekEffect, effectiveWeek } from '../../game/trainingWeek';
import { campState } from '../../game/winterShared';
import { teamRolesAvailable } from '../../engine/staffSkills';
import { Screen } from '../../shell/navigation';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { condBar, fmtDM, fmtDateShort } from '../../ui/format';
import { squadOf } from '../shared';
import { QBar, topSkills } from './teamParts';

// =============================================================================
// TRAINING — Kategorie-Übersicht (Woche, Wirkung, Belastung, Team, Markt, Lager)
// =============================================================================
export function TrainingDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const year = yearOf(g.calendar.currentDate);
  const scale = economyScale(year);
  const { infos, days } = effectiveWeek(g, mondayOf(g.calendar.currentDate));
  const fx = currentWeekEffect(g);
  const top = EFFECT_GROUPS.map((gr) => ({ gr, v: fx.groups[gr.key] })).sort((a, b) => b.v - a.v).slice(0, 5);
  const max = Math.max(6, top[0]?.v ?? 0);
  const squad = squadOf(g);
  const tired = [...squad].sort((a, b) => (a.frische ?? 100) - (b.frische ?? 100)).slice(0, 6);
  const injured = squad.filter((p) => p.injury);
  const staff = ensureStaff(g);
  ensureStaffWorld(g);
  const avail = teamRolesAvailable(year);
  const team = staff.filter((m) => avail.includes(m.roleId));
  const rep = coachingReport(staff, squad.length, year);
  const best = marketForRole(g, 'all').filter((m) => !m.clubId && avail.includes(m.roleId)).slice(0, 6);
  const camps = campState(g).bookings.filter((b) => !b.done).sort((a, b) => a.start.localeCompare(b.start));
  const phase = phaseOf(g.calendar.currentDate);
  return (
    <DashPage>
      <DashBox title="Diese Woche" icon="training" onClick={() => onGoto('training')} right={`${fx.units} Einheiten`}>
        <div className="td-week">
          {infos.map((inf, i) => (
            <div key={i} className={`td-day ${inf.fixture ? 'match' : ''} ${inf.date === g.calendar.currentDate ? 'today' : ''}`}>
              <span className="td-day-name">{DAY_SHORT[i]}</span>
              {inf.fixture ? <Icon name="matchball" size={22} /> : SLOT_KEYS.map((k) => {
                const b = days[i][k] ? BLOCKS_BY_ID[days[i][k] as string] : null;
                return b ? <Icon key={k} name={b.icon} size={22} /> : <span key={k} className="td-empty" />;
              })}
            </div>
          ))}
        </div>
        <KV k="Fitness je Trainingstag" v={`${fx.fitnessPerDay > 0 ? '+' : ''}${fx.fitnessPerDay}`} />
        <KV k={`Philosophie (${PHASE_LABEL[phase]})`} v={FOCUS_LABEL[g.trainingFocus?.[phase] ?? 'balance']} />
      </DashBox>

      <DashBox title="Wochenwirkung" icon="stats" onClick={() => onGoto('training')}>
        {top.map(({ gr, v }) => <Meter key={gr.key} label={gr.label} value={v} max={max} text={v < 2 ? 'gering' : v < 4.5 ? 'mittel' : 'stark'} />)}
        <div className="dnote mt8">Entwicklung durch den Trainingsumfang: {Math.round((fx.devFactor - 1) * 100) >= 0 ? '+' : ''}{Math.round((fx.devFactor - 1) * 100)} %.</div>
      </DashBox>

      <DashBox title="Belastung" icon="dashKader" onClick={() => onGoto('training')} right={`${injured.length} verletzt`}>
        {tired.map((p) => <Meter key={p.id} label={p.fullName} value={p.frische ?? 100} color={condBar(p.frische ?? 100)} />)}
      </DashBox>

      <DashBox title="Trainerteam" icon="whistle" onClick={() => onGoto('trainerteam')} right={`${team.length}/${avail.length} besetzt`}>
        <div className="dkpis">
          <Kpi value={`${rep.extra >= 0 ? '+' : ''}${Math.round(rep.extra * 100)} %`} label="Entwicklung" />
          <Kpi value={`${Math.round(rep.capacity * 100)} %`} label="Betreuung" />
        </div>
        {team.length ? team.slice(0, 5).map((m) => (
          <div key={m.id} className="dlist-row"><span className="grow"><b>{roleLabel(m.roleId)}</b> <span className="muted">· {m.name}</span></span><QBar q={m.quality} /><span className="val">{m.quality}</span></div>
        )) : <Empty icon="whistle">Noch niemand angestellt.</Empty>}
      </DashBox>

      <DashBox title="Arbeitsmarkt" icon="staff" onClick={() => onGoto('trainerteam')} right="beste Bewerber">
        {best.map((m) => (
          <div key={m.id} className="dlist-row">
            <span className="grow"><b>{m.name}</b> <span className="muted">· {roleLabel(m.roleId)}, {m.age} J.{m.exPro ? ', Ex-Profi' : ''}</span>
              <span className="dnote" style={{ display: 'block' }}>{topSkills(m, 2)} · {fmtDM(memberMonthlySalary(m, scale))}/Monat</span></span>
            <span className="val">{m.quality}</span>
          </div>
        ))}
      </DashBox>

      <DashBox title="Trainingslager" icon="weather" onClick={() => onGoto('trainingslager')}>
        {camps.length ? camps.map((b) => (
          <div key={b.id} className="dlist-row"><span className="grow"><b>{campDestination(b.destId)?.name ?? b.destId}</b> <span className="muted">· {b.season === 'summer' ? 'Sommer' : 'Winter'}</span></span><span className="meta">{fmtDateShort(b.start).dmy}–{fmtDateShort(b.end).dmy}</span></div>
        )) : <Empty icon="weather">Kein Trainingslager gebucht.</Empty>}
      </DashBox>
    </DashPage>
  );
}
