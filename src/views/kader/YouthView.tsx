import { MAX_LEVEL } from '../../engine/infrastructure';
import { scoutRange } from '../../engine/scouting';
import { Game } from '../../game/state';
import { Player, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_ORDER, YOUTH_AGE_CLASS_RANGE, YouthAgeClass, renderStars, youthAgeClass } from '../../types';
import { vColor } from '../../ui/format';
import { DashBox, DashPage, Empty, Meter } from '../../ui/DashPage';
import { PlayerRow } from '../shared';
import { YouthModal } from './YouthModal';
import { useState } from 'react';

// =============================================================================
// JUGEND (Jugendakademie) — Talentliste + Detail mit verstecktem Potenzial
// =============================================================================
export type YouthSort = 'pot' | 'ovr' | 'age';

/** Rendert die Scouting-Einschätzung als GOLDENE Sterne-Spanne (min–max). */
export function ScoutRange({ p }: { p: Player }) {
  const [min, max] = scoutRange(p);
  if (Math.abs(max - min) < 0.001) {
    return <span className="stars" title={`Potenzial: ${min.toFixed(1)} Sterne`}>{renderStars(min)}</span>;
  }
  return (
    <span title={`Scouting-Spanne: ${min.toFixed(1)}–${max.toFixed(1)} Sterne`} style={{ whiteSpace: 'nowrap' }}>
      <span className="stars" style={{ fontSize: 11 }}>{renderStars(min)}</span>
      <span className="dim2 mini" style={{ margin: '0 4px' }}>bis</span>
      <span className="stars" style={{ fontSize: 11 }}>{renderStars(max)}</span>
    </span>
  );
}

export function YouthView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<YouthSort>('pot');
  const [classFilter, setClassFilter] = useState<YouthAgeClass | 'ALL'>('ALL');
  const club = g.clubs[g.managedClubId];
  const acadLevel = club.infrastructure.youthAcademy;

  const sortFn = (a: Player, b: Player) => {
    switch (sortBy) {
      case 'ovr': return b.overall - a.overall;
      case 'age': return a.age - b.age;
      default: {
        const am = scoutRange(a)[1];
        const bm = scoutRange(b)[1];
        return (bm - am) || (b.overall - a.overall);
      }
    }
  };

  const youth = club.youthPlayerIds
    .map((id) => g.youthPlayers[id])
    .filter(Boolean);

  // Talente nach Altersklasse G–A gruppieren.
  const byClass: Record<YouthAgeClass, Player[]> = { G: [], F: [], E: [], D: [], C: [], B: [], A: [] };
  for (const pl of youth) {
    const cls = youthAgeClass(pl.age);
    if (cls) byClass[cls].push(pl);
  }
  for (const cls of YOUTH_AGE_CLASS_ORDER) byClass[cls].sort(sortFn);

  const p = sel ? g.youthPlayers[sel] : null;

  const rows = YOUTH_AGE_CLASS_ORDER.filter((cls) => classFilter === 'ALL' || classFilter === cls).flatMap((cls) => byClass[cls]);
  const Th = ({ k, children, cls }: { k: YouthSort; children: React.ReactNode; cls?: string }) => (
    <th className={`sortable ${cls ?? ''} ${sortBy === k ? 'sorted' : ''}`} onClick={() => setSortBy(k)}>{children}</th>
  );
  const top = [...youth].sort((a, b) => (scoutRange(b)[1] - scoutRange(a)[1]) || b.overall - a.overall).slice(0, 5);
  const ready = youth.filter((x) => youthAgeClass(x.age) === 'A').sort((a, b) => b.overall - a.overall).slice(0, 4);
  const maxClass = Math.max(1, ...YOUTH_AGE_CLASS_ORDER.map((c) => byClass[c].length));

  return (
    <DashPage>
      <DashBox title={`Talente (${youth.length})`} icon="youth" span={2} rows={2} flush
        right={<span className="dbtnrow">
          <button className={`dchip ${classFilter === 'ALL' ? 'on' : ''}`} onClick={() => setClassFilter('ALL')}>Alle</button>
          {YOUTH_AGE_CLASS_ORDER.map((cls) => (
            <button key={cls} className={`dchip ${classFilter === cls ? 'on' : ''}`} onClick={() => setClassFilter(cls)} disabled={byClass[cls].length === 0}>
              {cls} ({byClass[cls].length})
            </button>
          ))}
        </span>}>
        {rows.length === 0 ? (
          <Empty icon="youth">{youth.length === 0 ? 'Aktuell keine Talente in der Akademie. Der nächste Bambini-Jahrgang trifft zum 1. Juli ein.' : 'In dieser Altersklasse gibt es derzeit keine Talente.'}</Empty>
        ) : (
          <table className="dtable">
            <thead><tr>
              <th className="ctr">Kl.</th><th>Name</th><th className="ctr">Pos</th><Th k="age" cls="num">Alter</Th>
              <Th k="ovr" cls="num">Stärke</Th><Th k="pot">Potenzial (Scouting)</Th>
              <th className="num" title="Tempo">TMP</th><th className="num" title="Technik">TEC</th><th className="num" title="Passspiel">PAS</th>
              <th className="num" title="Zweikampf">ZWK</th><th className="num" title="Torschuss">TOR</th>
            </tr></thead>
            <tbody>
              {rows.map((pl) => (
                <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
                  <td className="ctr muted">{youthAgeClass(pl.age)}</td>
                  <td className="nowrap" style={{ fontWeight: 700 }}>{pl.fullName}</td>
                  <td className="ctr"><span className="pos-badge">{pl.naturalPosition}</span></td>
                  <td className="num">{pl.age}</td>
                  <td className="num"><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
                  <td><ScoutRange p={pl} /></td>
                  <td className="num" style={{ color: vColor(pl.attributes.speed) }}>{pl.attributes.speed}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.technique) }}>{pl.attributes.technique}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.passing) }}>{pl.attributes.passing}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.tackling) }}>{pl.attributes.tackling}</td>
                  <td className="num" style={{ color: vColor(pl.attributes.shooting) }}>{pl.attributes.shooting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashBox>

      <DashBox title="Jugendakademie" icon="facilities" right={`Stufe ${acadLevel}/${MAX_LEVEL}`}>
        <Meter label="Akademie-Stufe" value={acadLevel} max={MAX_LEVEL} text={`${acadLevel} / ${MAX_LEVEL}`} />
        {YOUTH_AGE_CLASS_ORDER.map((cls) => (
          <Meter key={cls} label={YOUTH_AGE_CLASS_LABEL[cls]} value={byClass[cls].length} max={maxClass} text={`${byClass[cls].length}`} />
        ))}
        <div className="dnote mt8">Neue Bambini kommen zum 1. Juli, alle Jahrgänge rücken auf. Ausbau der Akademie unter „Gelände“.</div>
      </DashBox>

      <DashBox title="Größte Talente" icon="trophy">
        {top.length ? top.map((x) => (
          <div key={x.id} className="dlist-row clickable" onClick={() => setSel(x.id)}>
            <span className="pos-badge">{x.naturalPosition}</span>
            <span className="grow">{x.fullName} <span className="muted">· {x.age} J.</span></span>
            <ScoutRange p={x} />
          </div>
        )) : <Empty icon="youth">Noch keine Talente.</Empty>}
        <div className="dsec">A-Jugend: bereit für die Profis</div>
        {ready.length ? ready.map((x) => <PlayerRow key={x.id} p={x} value={x.overall} onClick={() => setSel(x.id)} />)
          : <div className="dnote">Derzeit niemand in der A-Jugend.</div>}
        <div className="dnote mt8">Das echte Potenzial ist verborgen; die Spanne wird mit dem Alter enger.</div>
      </DashBox>

      {p && (
        <YouthModal
          g={g} player={p} club={club}
          onClose={() => setSel(null)}
          onChange={onChange}
        />
      )}
    </DashPage>
  );
}
