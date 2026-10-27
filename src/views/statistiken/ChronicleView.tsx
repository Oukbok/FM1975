import { TIMELINE, TIMELINE_TYPE_META, seasonStartYear } from '../../data/timeline';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';

// =============================================================================
// CHRONIK — Epochen & Meilensteine des deutschen Fußballs (1975 → 2030er)
// =============================================================================
export function ChronicleView({ g, embedded = false }: { g: Game; embedded?: boolean }) {
  const curYear = seasonStartYear(g.season);
  // Chronologisch nach Saison sortiert.
  const events = [...TIMELINE].sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season));
  const fired = new Set(g.firedMilestones);
  const passedCount = events.filter((e) => seasonStartYear(e.season) <= curYear).length;

  return (
    <div className={embedded ? undefined : 'page'}>
      {embedded ? (
        <div className="section-title">Chronik der Epochen – Historische Zeitleiste</div>
      ) : (
        <PageHead icon="chronicle" title="Chronik der Epochen" />
      )}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="dim" style={{ margin: 0 }}>
          Die großen Regel-, Wettbewerbs- und Wirtschafts-Meilensteine des Fußballs von 1975 bis in die 2030er.
          Jeder Meilenstein wird zu Beginn seiner Saison wirksam – erreichte Ereignisse verändern das Spiel real
          (z. B. die 3-Punkte-Regel 1995/96). Aktuelle Saison: <b>{g.season}</b> · {passedCount}/{events.length} Meilensteine erreicht.
        </p>
      </div>

      <div className="chronicle-list">
        {events.map((e) => {
          const meta = TIMELINE_TYPE_META[e.type];
          const evYear = seasonStartYear(e.season);
          const isFired = fired.has(e.id);
          const isPast = evYear < curYear;
          const isCurrent = evYear === curYear;
          const state = isCurrent ? 'current' : isFired || isPast ? 'past' : 'future';
          return (
            <div key={e.id} className={`chronicle-item ${state}`}>
              <div className="chronicle-rail">
                <div className="chronicle-dot" style={{ background: state === 'future' ? 'var(--border)' : meta.color }}>
                  {state === 'future' ? '' : '✓'}
                </div>
              </div>
              <div className="chronicle-body">
                <div className="chronicle-head">
                  <span className="chronicle-icon" title={meta.label}>{meta.icon}</span>
                  <span className="chronicle-year">{e.year}</span>
                  <span className="chronicle-season">Saison {e.season}</span>
                  <span className="chronicle-tag" style={{ borderColor: meta.color, color: meta.color }}>{meta.label}</span>
                  {isCurrent && <span className="chronicle-badge now">Aktuell</span>}
                  {state === 'future' && <span className="chronicle-badge soon">Bevorstehend</span>}
                  {state === 'past' && <span className="chronicle-badge done">Erreicht</span>}
                </div>
                <div className="chronicle-title">{e.title}</div>
                <div className="chronicle-desc">{e.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
