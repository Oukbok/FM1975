// =============================================================================
// Training › Trainingsplan › Trainingsgruppen (Vorbild EA FM): der Kader nach dem,
// wie er gerade trainiert – die Gruppen ergeben sich aus dem Spielstand (model.ts
// trainingGroups), nichts davon wird gespeichert. Leitung = bester Fachmann im
// Trainerteam für das, was in der Gruppe zählt.
// =============================================================================
import { PlayerFitness, PlayerFreshness } from '../../../components/status';
import { yearOf } from '../../../engine/economy';
import { SKILL_LABEL } from '../../../engine/staffSkills';
import { Game } from '../../../game/state';
import { ensureStaff } from '../../../game/staffGame';
import { teamSkill } from '../../../game/trainerTeam';
import { Screen } from '../../../shell/navigation';
import { DashBox, DashPage, Meter } from '../../../ui/DashPage';
import { squadOf } from '../../shared';
import { TrainGroup, byPosition, trainingGroups } from './model';

function GroupBox({ gr, rows = 1 }: { gr: TrainGroup; rows?: 1 | 2 }) {
  const list = [...gr.players].sort(byPosition);
  return (
    <DashBox title={`${gr.title} (${list.length})`} rows={rows} flush className={`tr3-group tr3-g-${gr.id}`}
      right={<span className="tr3-glead">{gr.lead}</span>}>
      <div className="tr3-gnote">{gr.note}</div>
      <div className="tr3-tablewrap">
        <table className="dtable rl-players rl-sm tr3-gtable">
          <thead><tr><th>Pos.</th><th>Name</th><th className="r">Stärke</th><th className="c">Fit.</th><th className="c">Frische</th><th>{gr.id === 'position' ? 'Ziel' : gr.id === 'verletzt' ? 'Ausfall' : ''}</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} data-pid={p.id}>
                <td><span className="pos-badge">{p.naturalPosition}</span></td>
                <td className="rl-name">{p.fullName}</td>
                <td className="r">{Math.round(p.overall)}</td>
                <td className="c"><PlayerFitness p={p} showValue /></td>
                <td className="c"><PlayerFreshness p={p} showValue /></td>
                <td className="muted">{gr.id === 'position' ? p.positionSkill?.train : gr.id === 'verletzt' && p.injury ? `${p.injury.daysRemaining} Tage` : ''}</td>
              </tr>
            ))}
            {!list.length && <tr className="tr3-empty"><td colSpan={6}>niemand</td></tr>}
          </tbody>
        </table>
      </div>
    </DashBox>
  );
}

export function GroupsTab({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const groups = trainingGroups(g, squadOf(g));
  const by = Object.fromEntries(groups.map((x) => [x.id, x])) as Record<TrainGroup['id'], TrainGroup>;
  const year = yearOf(g.calendar.currentDate);
  const staff = ensureStaff(g);
  const lead = (['fitness', 'technik', 'taktik', 'torwart', 'mental', 'analyse', 'medizin'] as const)
    .filter((k) => (k !== 'analyse' || year >= 1993) && (k !== 'mental' || year >= 2003))
    .map((k) => ({ k, v: Math.round(teamSkill(staff, k, year)) }));
  return (
    <DashPage className="tr3-groups">
      <GroupBox gr={by.feld} rows={2} />
      <GroupBox gr={by.tw} />
      <DashBox title="Anleitung durch dein Trainerteam" icon="whistle" info="trainingsgruppen" onClick={() => onGoto('trainerteam')}
        right={<span className="tr3-glead">Trainerteam öffnen</span>}>
        {lead.map((l) => <Meter key={l.k} label={SKILL_LABEL[l.k]} value={l.v} max={20} text={l.v ? `${l.v}/20` : 'niemand'} />)}
        <div className="dnote mt8">Der Beste im Fach bestimmt den Lernfaktor der Bausteine (0,85 ohne Fachmann bis 1,2).</div>
      </DashBox>
      <div className="tr3-gstack">
        <GroupBox gr={by.foerder} />
        <GroupBox gr={by.position} />
      </div>
      <div className="tr3-gstack">
        <GroupBox gr={by.schonung} />
        <GroupBox gr={by.verletzt} />
      </div>
    </DashPage>
  );
}
