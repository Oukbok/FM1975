import Icon from '../../components/Icon';
import { campDestination } from '../../data/campDestinations';
import { economyScale, yearOf } from '../../engine/economy';
import { FOCUS_LABEL, memberMonthlySalary, phaseOf, PHASE_LABEL } from '../../engine/staffPeople';
import { DAY_SHORT, EFFECT_GROUPS, SLOT_KEYS, mondayOf } from '../../engine/trainingPlan';
import { BLOCKS_BY_ID } from '../../engine/weeklyTraining';
import { Game } from '../../game/state';
import { ensureStaff } from '../../game/staffGame';
import { ensureStaffWorld, staffMarket } from '../../game/staffWorld';
import { coachingOutlook } from '../../game/coachingGame';
import { demandOf, roleLabel } from '../../game/trainerTeam';
import { currentWeekEffect, effectiveWeek } from '../../game/trainingWeek';
import { campState } from '../../game/winterShared';
import { staffLevel, teamRolesAvailable } from '../../engine/staffSkills';
import { clubTrainingFactor } from '../../engine/development';
import { Screen } from '../../shell/navigation';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { condBar, fmtDateShort, fmtStaffWage } from '../../ui/format';
import { squadOf } from '../shared';
import { fitLevel, Level, LevelBar, topSkillsText } from '../staff/staffUi';
import { blockKind } from './plan/model';

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
  const outlook = coachingOutlook(g);
  const coach = outlook.team;
  const myClub = g.clubs[g.managedClubId];
  const devPct = myClub ? Math.round((clubTrainingFactor(myClub, coach.extra) / clubTrainingFactor(myClub, 0) - 1) * 100) : 0;
  const best = staffMarket(g, { role: 'all', onlyFree: true, roles: avail }).slice(0, 6);
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
                return b ? <span key={k} className={`td-blk trk-${blockKind(b)}`}><Icon name={b.icon} size={22} /></span> : <span key={k} className="td-empty" />;
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

      <DashBox title="Trainerteam" icon="whistle" info="trainerniveau" onClick={() => onGoto('trainerteam')} right={`${team.length} ${team.length === 1 ? 'Person' : 'Personen'}`}>
        <div className="dkpis">
          <Kpi value={Math.round(coach.level)} label="Niveau" sub={`${outlook.rank}. von ${outlook.of}`} />
          <Kpi value={`${devPct >= 0 ? '+' : '−'}${Math.abs(devPct)} %`} label="Entwicklung" color={devPct < 0 ? 'var(--neg)' : undefined} />
        </div>
        {!coach.head && <div className="dnote" style={{ color: 'var(--neg)' }}>Kein Cheftrainer – die Entwicklung leidet deutlich.</div>}
        {coach.missing > 0 && <div className="dnote" style={{ color: 'var(--neg)' }}>{coach.missing === 1 ? 'Ein Co-Trainer fehlt' : `${coach.missing} Co-Trainer fehlen`} für die Größe deines Vereins.</div>}
        {outlook.limited.length > 0 && <div className="dnote">{outlook.limited.length} {outlook.limited.length === 1 ? 'Spieler wird' : 'Spieler werden'} vom Niveau der Trainer gebremst.</div>}
        {team.length ? team.slice(0, 5).map((m) => (
          <div key={m.id} className="dlist-row"><span className="grow"><b>{roleLabel(m.roleId)}</b> <span className="muted">· {m.name}</span></span><LevelBar v={fitLevel(m, m.roleId)} /><Level v={fitLevel(m, m.roleId)} /></div>
        )) : <Empty icon="whistle">Noch niemand angestellt.</Empty>}
      </DashBox>

      <DashBox title="Arbeitsmarkt" icon="staff" onClick={() => onGoto('trainerteam')} right="beste Bewerber">
        {best.map(({ m, fit, role }) => (
          <div key={m.id} className="dlist-row">
            <span className="grow"><b>{m.name}</b> <span className="muted">· {roleLabel(role)}, {m.age} J.{m.exPro ? ', Ex-Profi' : ''}</span>
              <span className="dnote" style={{ display: 'block' }}>{topSkillsText(m, 2)} · {fmtStaffWage(memberMonthlySalary({ ...m, roleId: role, salaryFactor: demandOf(g, m, role) }, scale))}</span></span>
            <Level v={staffLevel(fit)} />
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
