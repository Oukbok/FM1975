import PlayerModal from '../../components/PlayerModal';
import { formIndicator } from '../../engine/form';
import { Game } from '../../game/state';
import { renderStars, starsToPotential } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { vColor } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// KADER (Tabelle, kein Avatar)
// =============================================================================
export type SquadSort = 'ovr' | 'pot' | 'form' | 'fit' | 'age';

export function SquadView({ g }: { g: Game }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SquadSort>('ovr');
  const club = g.clubs[g.managedClubId];
  const squad = club.playerIds.map((id) => g.players[id]).sort((a, b) => {
    switch (sortBy) {
      case 'pot': return (b.potentialStars - a.potentialStars) || (b.overall - a.overall);
      case 'form': return b.form - a.form;
      case 'fit': return b.attributes.fitness - a.attributes.fitness;
      case 'age': return a.age - b.age;
      default: return b.overall - a.overall;
    }
  });
  const p = sel ? g.players[sel] : null;

  const SortBtn = ({ k, label }: { k: SquadSort; label: string }) => (
    <button className={`btn-sm ${sortBy === k ? 'active' : ''}`} onClick={() => setSortBy(k)}>{label}</button>
  );

  return (
    <div className="page">
      <PageHead
        icon="squad"
        title={<>Kader <span className="accent">({squad.length})</span></>}
        right={<>
          <span className="dim mini">Sortieren:</span>
          <SortBtn k="ovr" label="OVR" />
          <SortBtn k="pot" label="Potenzial" />
          <SortBtn k="form" label="Form" />
          <SortBtn k="fit" label="Fitness" />
          <SortBtn k="age" label="Alter" />
        </>}
      />

      <div className="card">
        <div className="table-scroll">
          <table className="squad-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Pos</th><th>Alter</th><th>OVR</th><th>Potenzial</th>
                <th>Form</th><th>Fit</th>
                <th title="Tempo">TMP</th><th title="Technik">TEC</th><th title="Passspiel">PAS</th>
                <th title="Zweikampf">ZWK</th><th title="Torschuss">TOR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((pl) => {
                const fi = formIndicator(pl.form);
                return (
                  <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
                    <td className="dim">{pl.shirtNumber}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{pl.fullName}</td>
                    <td><span className="pos-tag">{pl.naturalPosition}</span></td>
                    <td>{pl.age}</td>
                    <td><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="stars" style={{ fontSize: 12 }}>{renderStars(pl.potentialStars)}</span>
                      <span className="dim2 mini" style={{ marginLeft: 6 }}>max {starsToPotential(pl.potentialStars)}</span>
                    </td>
                    <td title={`${fi.label} (${Math.round(pl.form)})`} style={{ color: fi.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {fi.arrow} <span className="dim2 mini">{Math.round(pl.form)}</span>
                    </td>
                    <td style={{ color: vColor(pl.attributes.fitness), fontWeight: 700 }}>{Math.round(pl.attributes.fitness)}</td>
                    <td style={{ color: vColor(pl.attributes.speed) }}>{pl.attributes.speed}</td>
                    <td style={{ color: vColor(pl.attributes.technique) }}>{pl.attributes.technique}</td>
                    <td style={{ color: vColor(pl.attributes.passing) }}>{pl.attributes.passing}</td>
                    <td style={{ color: vColor(pl.attributes.tackling) }}>{pl.attributes.tackling}</td>
                    <td style={{ color: vColor(pl.attributes.shooting) }}>{pl.attributes.shooting}</td>
                    <td className={pl.availability === 'injured' ? 'red' : pl.suspensionMatches > 0 ? 'orange-text' : 'green'} style={{ whiteSpace: 'nowrap' }}>
                      {pl.availability === 'injured' ? `verletzt (${pl.injury?.daysRemaining}d)` : pl.suspensionMatches > 0 ? `gesperrt (${pl.suspensionMatches})` : 'fit'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="dim2 mini mt12">
          Klicke eine Zeile für Details. TMP=Tempo · TEC=Technik · PAS=Passspiel · ZWK=Zweikampf · TOR=Torschuss.
          Farben: <span style={{ color: 'var(--green)' }}>Grün &gt;75</span>, <span style={{ color: 'var(--yellow)' }}>Gelb 60–75</span>, <span style={{ color: 'var(--red)' }}>Rot &lt;60</span>.
        </div>
      </div>

      {p && <PlayerModal player={p} club={club} onClose={() => setSel(null)} />}
    </div>
  );
}
