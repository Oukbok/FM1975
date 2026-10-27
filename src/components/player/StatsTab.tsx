// Reiter „Statistik“: Saison vs. Karriere + abgeleitete Quoten
import { Player, PlayerStats } from '../../types';
import Icon from '../Icon';
import { Section, Stat } from './shared';

const ROWS: [string, (s: PlayerStats) => number | string][] = [
  ['Einsätze', (s) => s.appearances],
  ['davon Startelf', (s) => s.starts],
  ['Einwechslungen', (s) => s.substituteAppearances],
  ['Minuten', (s) => s.minutesPlayed],
  ['Tore', (s) => s.goals],
  ['Vorlagen', (s) => s.assists],
  ['Scorerpunkte', (s) => s.goals + s.assists],
  ['Gelbe Karten', (s) => s.yellowCards],
  ['Gelb-Rote Karten', (s) => s.yellowRedCards],
  ['Rote Karten', (s) => s.redCards],
  ['Zu-null-Spiele', (s) => s.cleanSheets],
  ['Elfmeter gehalten', (s) => s.penaltiesSaved],
  ['Elfmeter verschossen', (s) => s.penaltiesMissed],
  ['Ø Note', (s) => (s.averageRating > 0 ? s.averageRating.toFixed(2) : '—')],
];

const per90 = (n: number, min: number) => (min > 0 ? ((n * 90) / min).toFixed(2) : '—');

export default function StatsTab({ p }: { p: Player }) {
  const s = p.seasonStats, c = p.careerStats;
  return (
    <div className="pp-grid pp-grid-stats">
      <Section title="Zahlen" icon={<Icon name="stats" size={15} />}>
        <table className="pp-table">
          <thead><tr><th /><th>Saison</th><th>Karriere</th></tr></thead>
          <tbody>
            {ROWS.map(([label, f]) => (
              <tr key={label}><td>{label}</td><td>{f(s)}</td><td>{f(c)}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
      <div className="pp-stack">
        <Section title="Quoten (Saison)" icon={<Icon name="matchball" size={15} />}>
          <div className="pp-stat-grid">
            <Stat label="Tore / 90 Min." value={per90(s.goals, s.minutesPlayed)} />
            <Stat label="Vorlagen / 90 Min." value={per90(s.assists, s.minutesPlayed)} />
            <Stat label="Minuten pro Tor" value={s.goals > 0 ? Math.round(s.minutesPlayed / s.goals) : '—'} />
            <Stat label="Startelf-Quote" value={s.appearances > 0 ? `${Math.round((s.starts / s.appearances) * 100)} %` : '—'} />
            <Stat label="Ø Minuten / Spiel" value={s.appearances > 0 ? Math.round(s.minutesPlayed / s.appearances) : '—'} />
            <Stat label="Karten / Spiel" value={s.appearances > 0 ? ((s.yellowCards + s.redCards + s.yellowRedCards) / s.appearances).toFixed(2) : '—'} />
          </div>
        </Section>
        <Section title="Quoten (Karriere)" icon={<Icon name="chronicle" size={15} />}>
          <div className="pp-stat-grid">
            <Stat label="Tore / 90 Min." value={per90(c.goals, c.minutesPlayed)} />
            <Stat label="Vorlagen / 90 Min." value={per90(c.assists, c.minutesPlayed)} />
            <Stat label="Ø Note" value={c.averageRating > 0 ? c.averageRating.toFixed(2) : '—'} />
          </div>
        </Section>
      </div>
    </div>
  );
}
