import Icon, { type IconName } from '../../components/Icon';
import { TIMELINE, TIMELINE_TYPE_META, seasonStartYear } from '../../data/timeline';
import { Game } from '../../game/state';

// =============================================================================
// CHRONIK — Epochen & Meilensteine des deutschen Fußballs (1975 → 2030er)
// Zeitleiste für das Wiki; das große Fenster (Footer rechts) liegt in ChronicleModal.tsx.
// =============================================================================
export type TlType = keyof typeof TIMELINE_TYPE_META;
export type ChronState = 'past' | 'current' | 'future';
export const CHRON_TYPE_ICON: Record<string, IconName> = {
  rule: 'matchball', competition: 'trophy', law: 'contracts', tech: 'presse', finance: 'finances', reform: 'stats',
};
export type TlEvent = (typeof TIMELINE)[number];

function ChronicleItem({ e, state }: { e: TlEvent; state: 'past' | 'current' | 'future' }) {
  const meta = TIMELINE_TYPE_META[e.type];
  return (
    <div className={`chronicle-item ${state}`}>
      <div className="chronicle-rail">
        <div className="chronicle-dot" style={{ background: state === 'future' ? 'var(--border)' : meta.color }} />
      </div>
      <div className="chronicle-body">
        <div className="chronicle-head">
          <span className="chronicle-icon" title={meta.label}><Icon name={CHRON_TYPE_ICON[e.type] ?? 'chronicle'} size={16} /></span>
          <span className="chronicle-year">{e.year}</span>
          <span className="chronicle-season">Saison {e.season}</span>
          <span className="chronicle-tag" style={{ borderColor: meta.color, color: meta.color }}>{meta.label}</span>
          {state === 'current' && <span className="chronicle-badge now">Aktuell</span>}
          {state === 'future' && <span className="chronicle-badge soon">Bevorstehend</span>}
          {state === 'past' && <span className="chronicle-badge done">Erreicht</span>}
        </div>
        <div className="chronicle-title">{e.title}{e.fictional ? <span className="muted" style={{ fontWeight: 500, marginLeft: 8, fontSize: 13 }}>(fiktive Zukunft)</span> : null}</div>
        <div className="chronicle-desc">{e.description}</div>
      </div>
    </div>
  );
}

/** Zeitleiste für den Wiki-Artikel „Chronik der Epochen“. */
export function ChronicleView({ g }: { g: Game; embedded?: boolean }) {
  const curYear = seasonStartYear(g.season);
  const events = [...TIMELINE].sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season));
  const fired = new Set(g.firedMilestones);
  const stateOf = (e: TlEvent): ChronState => {
    const y = seasonStartYear(e.season);
    return y === curYear ? 'current' : fired.has(e.id) || y < curYear ? 'past' : 'future';
  };
  return (
    <div>
      <div className="section-title">Chronik der Epochen – Historische Zeitleiste</div>
      <div className="chronicle-list">{events.map((e) => <ChronicleItem key={e.id} e={e} state={stateOf(e)} />)}</div>
    </div>
  );
}
