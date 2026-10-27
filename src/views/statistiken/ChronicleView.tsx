import Icon, { type IconName } from '../../components/Icon';
import { TIMELINE, TIMELINE_TYPE_META, seasonStartYear } from '../../data/timeline';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV, Meter } from '../../ui/DashPage';
import { useState } from 'react';

// =============================================================================
// CHRONIK — Epochen & Meilensteine des deutschen Fußballs (1975 → 2030er)
// =============================================================================
type TlType = keyof typeof TIMELINE_TYPE_META;
const TYPE_ICON: Record<string, IconName> = {
  rule: 'matchball', competition: 'trophy', law: 'contracts', tech: 'presse', finance: 'finances', reform: 'stats',
};
type TlEvent = (typeof TIMELINE)[number];

function ChronicleItem({ e, state }: { e: TlEvent; state: 'past' | 'current' | 'future' }) {
  const meta = TIMELINE_TYPE_META[e.type];
  return (
    <div className={`chronicle-item ${state}`}>
      <div className="chronicle-rail">
        <div className="chronicle-dot" style={{ background: state === 'future' ? 'var(--border)' : meta.color }} />
      </div>
      <div className="chronicle-body">
        <div className="chronicle-head">
          <span className="chronicle-icon" title={meta.label}><Icon name={TYPE_ICON[e.type] ?? 'chronicle'} size={16} /></span>
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

export function ChronicleView({ g, embedded = false }: { g: Game; embedded?: boolean }) {
  const [filter, setFilter] = useState<'all' | 'past' | 'future' | TlType>('all');
  const curYear = seasonStartYear(g.season);
  const events = [...TIMELINE].sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season));
  const fired = new Set(g.firedMilestones);
  const stateOf = (e: TlEvent): 'past' | 'current' | 'future' => {
    const y = seasonStartYear(e.season);
    return y === curYear ? 'current' : fired.has(e.id) || y < curYear ? 'past' : 'future';
  };
  const passedCount = events.filter((e) => seasonStartYear(e.season) <= curYear).length;

  if (embedded) {
    return (
      <div>
        <div className="section-title">Chronik der Epochen – Historische Zeitleiste</div>
        <div className="chronicle-list">{events.map((e) => <ChronicleItem key={e.id} e={e} state={stateOf(e)} />)}</div>
      </div>
    );
  }

  const list = events.filter((e) => filter === 'all' ? true : filter === 'past' ? stateOf(e) !== 'future' : filter === 'future' ? stateOf(e) === 'future' : e.type === filter);
  const current = events.filter((e) => stateOf(e) === 'current');
  const upcoming = events.filter((e) => stateOf(e) === 'future').slice(0, 4);
  const types = (Object.keys(TIMELINE_TYPE_META) as TlType[]).filter((t) => events.some((e) => e.type === t));

  return (
    <DashPage>
      <DashBox title="Chronik der Epochen" icon="chronicle" span={2} rows={2} right={`${passedCount}/${events.length} erreicht`}>
        <div className="dbtnrow" style={{ marginBottom: 10 }}>
          <button className={`dchip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>Alle</button>
          <button className={`dchip ${filter === 'past' ? 'on' : ''}`} onClick={() => setFilter('past')}>Erreicht</button>
          <button className={`dchip ${filter === 'future' ? 'on' : ''}`} onClick={() => setFilter('future')}>Bevorstehend</button>
          {types.map((t) => <button key={t} className={`dchip ${filter === t ? 'on' : ''}`} onClick={() => setFilter(t)}>{TIMELINE_TYPE_META[t].label}</button>)}
        </div>
        <div className="chronicle-list">{list.map((e) => <ChronicleItem key={e.id} e={e} state={stateOf(e)} />)}</div>
      </DashBox>

      <DashBox title={`Saison ${g.season}`} icon="kalender">
        {current.length ? current.map((e) => (
          <div key={e.id} className="dlist-row" style={{ alignItems: 'flex-start' }}>
            <span className="grow" style={{ whiteSpace: 'normal' }}><b>{e.title}</b><span className="dnote" style={{ display: 'block' }}>{e.description}</span></span>
          </div>
        )) : <Empty icon="chronicle">In dieser Saison tritt kein Meilenstein in Kraft.</Empty>}
        <div className="dsec">Als Nächstes</div>
        {upcoming.map((e) => <KV key={e.id} k={e.title} v={e.season} />)}
      </DashBox>

      <DashBox title="Wandel nach Bereichen" icon="stats">
        {types.map((t) => {
          const all = events.filter((e) => e.type === t);
          const done = all.filter((e) => stateOf(e) !== 'future').length;
          return <Meter key={t} label={TIMELINE_TYPE_META[t].label} value={done} max={Math.max(1, all.length)} text={`${done}/${all.length}`} color={TIMELINE_TYPE_META[t].color} />;
        })}
        <div className="dnote mt8">Jeder Meilenstein wird zu Beginn seiner Saison wirksam und verändert das Spiel, etwa die 3-Punkte-Regel 1995/96.</div>
      </DashBox>
    </DashPage>
  );
}
