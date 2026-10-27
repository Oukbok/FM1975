// Reiter „Karriere“: Stationen je Saison + Transfers
import { Player, Club } from '../../types';
import { fmtDM } from '../../ui/format';
import Icon from '../Icon';
import { utcDate, Section, Line } from './shared';

export default function CareerTab({ p, club, season }: { p: Player; club?: Club; season?: string }) {
  const stations = [...(p.history?.stations ?? [])].reverse();
  const transfers = [...(p.history?.transfers ?? [])].reverse();
  const s = p.seasonStats, c = p.careerStats;
  return (
    <div className="pp-grid pp-grid-career">
      <Section title="Stationen" icon={<Icon name="chronicle" size={15} />}>
        <table className="pp-table">
          <thead><tr><th>Saison</th><th>Verein</th><th>Spiele</th><th>Tore</th><th>Vorl.</th><th>Ø Note</th></tr></thead>
          <tbody>
            <tr className="pp-row-current">
              <td>{season ?? 'aktuell'}</td><td>{club?.name ?? '—'} <span className="dim">(läuft)</span></td>
              <td>{s.appearances}</td><td>{s.goals}</td><td>{s.assists}</td><td>{s.averageRating > 0 ? s.averageRating.toFixed(2) : '—'}</td>
            </tr>
            {stations.slice(0, 12).map((st, i) => (
              <tr key={i}>
                <td>{st.season}</td><td>{st.clubName}</td><td>{st.appearances}</td><td>{st.goals}</td><td>{st.assists}</td>
                <td>{st.averageRating > 0 ? st.averageRating.toFixed(2) : '—'}</td>
              </tr>
            ))}
            <tr className="pp-row-total">
              <td>Gesamt</td><td /><td>{c.appearances}</td><td>{c.goals}</td><td>{c.assists}</td><td>{c.averageRating > 0 ? c.averageRating.toFixed(2) : '—'}</td>
            </tr>
          </tbody>
        </table>
        {stations.length === 0 && <div className="pp-note">Frühere Saisons werden ab jetzt zum Saisonende festgehalten.</div>}
      </Section>
      <Section title="Transfers" icon={<Icon name="transfers" size={15} />}>
        {transfers.length === 0 ? (
          <div className="pp-note">Noch kein Vereinswechsel im Spiel.</div>
        ) : (
          <div className="pp-list">
            {transfers.slice(0, 10).map((t, i) => (
              <Line key={i} label={`${utcDate(t.date)} · ${t.fromClub} → ${t.toClub}`} value={t.fee > 0 ? fmtDM(t.fee) : 'ablösefrei'} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
