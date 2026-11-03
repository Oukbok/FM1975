// Reiter „Bericht“: Einschätzung von Trainerteam/Scout – aus den Werten abgeleitet, kein Zufall.
import { Player, starsToPotential } from '../../types';
import { scoutRange, scoutRangeText } from '../../engine/scouting';
import Icon from '../Icon';
import { ATTR_DE, POS_DE, PLAYER_TYPE, Section, Line, strengthsWeaknesses } from './shared';
import { useClubProfile } from '../club/ClubLink';
import type { Game } from '../../game/state';
import { estimateHidden, hiddenKnowledge } from '../../game/hiddenTraits';

const level = (v: number) => (v >= 80 ? 'herausragend' : v >= 70 ? 'stark' : v >= 60 ? 'solide' : v >= 50 ? 'ausbaufähig' : 'schwach');

function personality(p: Player, g: Game | undefined): string[] {
  const a = p.attributes;
  const out: string[] = [];
  // Verdeckte Werte nur als Einschätzung (game/hiddenTraits.ts), erst ab einem belastbaren Eindruck
  const k = hiddenKnowledge(g, p), own = !!g && p.clubId === g.managedClubId;
  const kon = k >= 0.45 ? estimateHidden(p, 'konstanz', k, own).word : null;
  const ner = k >= 0.45 ? estimateHidden(p, 'nerven', k, own).word : null;
  if (a.leadership >= 75) out.push('Führungsspieler, der die Mannschaft mitreißt');
  if (a.aggression >= 78) out.push('geht keinem Zweikampf aus dem Weg – mitunter zu hitzig');
  if (a.workRate >= 78) out.push('enorm laufstark und mannschaftsdienlich');
  if (a.flair >= 78) out.push('kreativ und unberechenbar, für das Besondere zuständig');
  if (kon === 'sehr konstant') out.push('sehr konstant in seinen Leistungen');
  else if (kon === 'schwankt stark') out.push('schwankt stark zwischen guten und schwachen Tagen');
  if (ner === 'nervenstark') out.push('blüht in großen Spielen auf');
  else if (ner === 'wirkt nervös') out.push('wirkt in wichtigen Spielen nervös');
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
  const g = useClubProfile()?.game;
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
        <ul className="pp-bullets">{personality(p, g).map((t) => <li key={t}>{t}</li>)}</ul>
      </Section>
      <Section title="Einschätzung" icon={<Icon name="stats" size={15} />}>
        <div className="pp-list">
          <Line label="Rolle im Kader" value={role(p, squad)} strong />
          <Line label="Gesamtstärke" value={`${p.overall} (${level(p.overall)})`} />
          <Line label="Potenzial (Scouts)" value={`${scoutRangeText(p)} · ${level(maxOvr)}`} />
          <Line label="Bester Fuß" value={p.preferredFoot === 'both' ? 'Beidfüßig – großer Vorteil' : p.preferredFoot === 'left' ? 'Links' : 'Rechts'} />
          <Line label="Erfahrung" value={level(p.attributes.experience)} />
        </div>
      </Section>
    </div>
  );
}
