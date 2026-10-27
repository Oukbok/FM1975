// Reiter „Bericht“: Einschätzung von Trainerteam/Scout – aus den Werten abgeleitet, kein Zufall.
import { Player, starsToPotential } from '../../types';
import { scoutRange, scoutRangeText } from '../../engine/scouting';
import Icon from '../Icon';
import { ATTR_DE, POS_DE, PLAYER_TYPE, Section, Line } from './shared';
import { strengthsWeaknesses } from './OverviewTab';

const level = (v: number) => (v >= 80 ? 'herausragend' : v >= 70 ? 'stark' : v >= 60 ? 'solide' : v >= 50 ? 'ausbaufähig' : 'schwach');

function personality(p: Player): string[] {
  const a = p.attributes, d = p.development;
  const out: string[] = [];
  if (a.leadership >= 75) out.push('Führungsspieler, der die Mannschaft mitreißt');
  if (a.aggression >= 78) out.push('geht keinem Zweikampf aus dem Weg – mitunter zu hitzig');
  if (a.workRate >= 78) out.push('enorm laufstark und mannschaftsdienlich');
  if (a.flair >= 78) out.push('kreativ und unberechenbar, für das Besondere zuständig');
  if (d.consistency >= 75) out.push('sehr konstant in seinen Leistungen');
  else if (d.consistency < 45) out.push('schwankt stark zwischen guten und schwachen Tagen');
  if (d.bigMatchTemperament >= 75) out.push('blüht in großen Spielen auf');
  else if (d.bigMatchTemperament < 45) out.push('wirkt in wichtigen Spielen nervös');
  if (a.composure >= 78) out.push('behält auch unter Druck die Ruhe');
  if (out.length === 0) out.push('unauffälliger Charakter ohne besondere Ausschläge');
  return out;
}

function role(p: Player, squad?: Player[]): string {
  if (!squad || !squad.includes(p)) return '—';
  const same = squad.filter((x) => x.naturalPosition === p.naturalPosition).sort((a, b) => b.overall - a.overall);
  const best = [...squad].sort((a, b) => b.overall - a.overall);
  const top11 = best.indexOf(p) < 11;
  if (same[0] === p && top11) return 'Stammspieler';
  if (top11) return 'Wichtiger Spieler';
  if (best.indexOf(p) < 16) return 'Rotationsspieler';
  if (p.age <= 21) return 'Perspektivspieler';
  return 'Ergänzungsspieler';
}

export default function ReportTab({ p, squad }: { p: Player; squad?: Player[] }) {
  const { strengths, weaknesses } = strengthsWeaknesses(p);
  const [lo, hi] = scoutRange(p);
  const maxOvr = Math.round((starsToPotential(lo) + starsToPotential(hi)) / 2);
  const outlook = maxOvr - p.overall >= 8 ? 'Hat noch viel Luft nach oben – Geduld und Einsatzzeit lohnen sich.'
    : maxOvr - p.overall >= 3 ? 'Kann sich noch etwas steigern.'
    : p.age >= 30 ? 'Hat seinen Zenit erreicht; der Abbau ist absehbar.' : 'Ist weitgehend ausentwickelt.';
  return (
    <div className="pp-grid pp-grid-report">
      <Section title="Scoutbericht" icon={<Icon name="watchlist" size={15} />}>
        <p className="pp-text">
          <b>{p.fullName}</b> ist ein {PLAYER_TYPE[p.naturalPosition] ?? 'Spieler'} ({POS_DE[p.naturalPosition]}), Gesamtstärke {p.overall} – {level(p.overall)}.
          Seine größten Stärken sind <b>{strengths.map((k) => ATTR_DE[k]).join(', ')}</b>.
          Verbesserungsbedarf sehen wir bei <b>{weaknesses.map((k) => ATTR_DE[k]).join(', ')}</b>.
        </p>
        <p className="pp-text">{outlook}</p>
        <div className="pp-section-title mt14">Persönlichkeit</div>
        <ul className="pp-bullets">{personality(p).map((t) => <li key={t}>{t}</li>)}</ul>
      </Section>
      <Section title="Einschätzung" icon={<Icon name="stats" size={15} />}>
        <div className="pp-list">
          <Line label="Rolle im Kader" value={role(p, squad)} strong />
          <Line label="Gesamtstärke" value={`${p.overall} (${level(p.overall)})`} />
          <Line label="Potenzial (Scouts)" value={`${scoutRangeText(p)} · ${level(maxOvr)}`} color="var(--accent)" />
          <Line label="Bester Fuß" value={p.preferredFoot === 'both' ? 'Beidfüßig – großer Vorteil' : p.preferredFoot === 'left' ? 'Links' : 'Rechts'} />
          <Line label="Erfahrung" value={level(p.attributes.experience)} />
        </div>
      </Section>
    </div>
  );
}
