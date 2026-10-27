// Reiter „Spiele“: letzte Pflichtspiele mit Note + Notenkurve
import { Player, MatchLogEntry } from '../../types';
import Icon from '../Icon';
import { utcDate, Section, Line } from './shared';

// Deutsche Noten: 1 = sehr gut … 6 = ungenügend
const noteColor = (r: number) => (r <= 2 ? 'var(--green)' : r <= 3 ? 'var(--accent)' : r <= 4 ? 'var(--yellow)' : 'var(--red)');

function NoteChart({ list }: { list: MatchLogEntry[] }) {
  const pts = list.slice(-20);
  if (pts.length < 2) return null;
  const W = 520, H = 170, pad = 26;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (pts.length - 1);
  const y = (r: number) => pad + ((r - 1) / 5) * (H - 2 * pad); // 1 oben, 6 unten
  const path = pts.map((m, i) => `${i ? 'L' : 'M'}${x(i)},${y(m.rating)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <g key={n}>
          <line x1={pad} x2={W - pad} y1={y(n)} y2={y(n)} stroke="var(--border-soft)" />
          <text x={6} y={y(n) + 4} className="pp-chart-axis">{n}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {pts.map((m, i) => <circle key={i} cx={x(i)} cy={y(m.rating)} r="4" fill={noteColor(m.rating)} />)}
    </svg>
  );
}

export default function MatchesTab({ p }: { p: Player }) {
  const list = p.history?.matches ?? [];
  if (list.length === 0) {
    return <div className="pp-empty">Noch keine Pflichtspiele für deinen Verein erfasst. Die Spielliste füllt sich ab dem nächsten Einsatz.</div>;
  }
  const recent = [...list].reverse().slice(0, 15);
  const last5 = list.slice(-5);
  const avg5 = last5.reduce((s, m) => s + m.rating, 0) / last5.length;
  return (
    <div className="pp-grid pp-grid-matches">
      <Section title="Letzte Spiele" icon={<Icon name="schedule" size={15} />} right={`${list.length} erfasst`}>
        <table className="pp-table pp-table-matches">
          <thead><tr><th>Datum</th><th>Wettbewerb</th><th>Gegner</th><th>Erg.</th><th>Min.</th><th>Tore</th><th>Vorl.</th><th>Karte</th><th>Note</th></tr></thead>
          <tbody>
            {recent.map((m, i) => (
              <tr key={i}>
                <td>{utcDate(m.date)}</td>
                <td>{m.competition}</td>
                <td>{m.opponent} <span className="dim">({m.home ? 'H' : 'A'})</span></td>
                <td>{m.score}</td>
                <td>{m.minutes}</td>
                <td>{m.goals || ''}</td>
                <td>{m.assists || ''}</td>
                <td>{m.card ?? ''}</td>
                <td style={{ color: noteColor(m.rating), fontWeight: 900 }}>{m.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <div className="pp-stack">
        <Section title="Notenkurve" icon={<Icon name="stats" size={15} />} right="1 = sehr gut">
          <NoteChart list={list} />
        </Section>
        <Section title="Formtrend" icon={<Icon name="matchball" size={15} />}>
          <div className="pp-list">
            <Line label="Ø Note letzte 5 Spiele" value={avg5.toFixed(2)} color={noteColor(avg5)} strong />
            <Line label="Tore / Vorlagen letzte 5" value={`${last5.reduce((s, m) => s + m.goals, 0)} / ${last5.reduce((s, m) => s + m.assists, 0)}`} />
            <Line label="Beste Note" value={Math.min(...list.map((m) => m.rating)).toFixed(1)} />
          </div>
        </Section>
      </div>
    </div>
  );
}
