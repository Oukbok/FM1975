// Letzte Pflichtspiele mit Note (Reiter Statistiken; Spielliste nur für den eigenen Verein, engine/history.ts).
import { Player } from '../../types';
import { utcDate, Section } from './shared';

// Deutsche Noten: 1 = sehr gut … 6 = ungenügend
export const noteColor = (r: number) => (r <= 2 ? 'var(--pos)' : r <= 4 ? 'var(--text)' : 'var(--neg)');

export default function RecentMatches({ p }: { p: Player }) {
  const list = p.history?.matches ?? [];
  const recent = [...list].reverse().slice(0, 15);
  return (
    <Section title="Letzte Spiele" right={list.length ? `${list.length} erfasst` : undefined}>
      {list.length === 0 ? (
        <div className="pp-note">Die Spielliste führt das Spiel nur für Spieler deines Vereins – sie füllt sich ab dem nächsten Einsatz.</div>
      ) : (
        <table className="pp-table pp-table-matches pp3-table">
          <thead><tr><th>Datum</th><th>Wettb.</th><th>Gegner</th><th>Erg.</th><th>Min.</th><th>Tore</th><th>Vorl.</th><th>Karte</th><th>Note</th></tr></thead>
          <tbody>
            {recent.map((m, i) => (
              <tr key={i}>
                <td>{utcDate(m.date)}</td>
                <td>{m.competition === 'Europapokal' ? 'Europa' : m.competition}</td>
                <td>{m.opponent} <span className="dim">({m.home ? 'H' : 'A'})</span></td>
                <td>{m.score}</td>
                <td>{m.minutes}</td>
                <td>{m.goals || ''}</td>
                <td>{m.assists || ''}</td>
                <td>{m.card ?? ''}</td>
                <td style={{ color: noteColor(m.rating) }}>{m.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
