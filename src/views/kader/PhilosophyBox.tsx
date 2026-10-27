import { FOCUS_INFO, FOCUS_LABEL, PHASE_LABEL, SeasonPhase, TrainingFocus, phaseOf } from '../../engine/staffPeople';
import { Game } from '../../game/state';
import { MAX_FOERDER, setFoerder } from '../../game/staffGame';
import { DashBox } from '../../ui/DashPage';

// =============================================================================
// Trainingsphilosophie je Saisonphase + Förderspieler (wenig Klickarbeit pro
// Saison, spürbare Wirkung; siehe engine/staffPeople.ts).
// =============================================================================
const PHASES: SeasonPhase[] = ['vorbereitung', 'hinrunde', 'winter', 'rueckrunde'];
const FOCI: TrainingFocus[] = ['balance', 'belastung', 'technik', 'regeneration', 'jugend'];

export function PhilosophyBox({ g, onChange }: { g: Game; onChange: () => void }) {
  const now = phaseOf(g.calendar.currentDate);
  const focus = g.trainingFocus ?? {};
  const club = g.clubs[g.managedClubId];
  const squad = (club?.playerIds ?? []).map((id) => g.players[id]).filter(Boolean)
    .sort((a, b) => a.age - b.age || b.overall - a.overall);
  const foerder = g.foerderSpieler ?? [];

  const setFocus = (ph: SeasonPhase, f: TrainingFocus) => {
    g.trainingFocus = { ...(g.trainingFocus ?? {}), [ph]: f };
    onChange();
  };
  const toggleFoerder = (id: string) => {
    setFoerder(g, foerder.includes(id) ? foerder.filter((x) => x !== id) : [...foerder, id]);
    onChange();
  };
  const cur = focus[now] ?? 'balance';

  return (
    <DashBox title="Philosophie & Förderspieler" icon="contracts" right={PHASE_LABEL[now].split(' ')[0]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {PHASES.map((ph) => (
          <label key={ph} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: ph === now ? 900 : 600, color: ph === now ? 'var(--accent)' : 'var(--text-2)' }}>{PHASE_LABEL[ph]}</span>
            <select className="pd-select" value={focus[ph] ?? 'balance'} onChange={(e) => setFocus(ph, e.target.value as TrainingFocus)}>
              {FOCI.map((f) => <option key={f} value={f}>{FOCUS_LABEL[f]}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="dnote">{FOCUS_INFO[cur]}</div>
      <div className="dsec">Förderspieler ({foerder.length}/{MAX_FOERDER})</div>
      <div className="dnote">Bekommen +25 % Entwicklungstempo, der Rest des Kaders etwas weniger Aufmerksamkeit (−3 %).</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {squad.filter((p) => p.age <= 24 || foerder.includes(p.id)).slice(0, 14).map((p) => (
          <button key={p.id} className={`dchip ${foerder.includes(p.id) ? 'on' : ''}`}
            disabled={!foerder.includes(p.id) && foerder.length >= MAX_FOERDER}
            onClick={() => toggleFoerder(p.id)}>{p.lastName} ({p.age})</button>
        ))}
      </div>
    </DashBox>
  );
}
