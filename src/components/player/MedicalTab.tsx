// Reiter „Medizin“: Verfügbarkeit, Verletzung, Belastung, Sperren
import { Player } from '../../types';
import { vColor } from '../../ui/format';
import Icon from '../Icon';
import { AVAIL_DE, INJURY_TYPE_DE, INJURY_SEV_DE, utcDate, frischeOf, Section, Line, Bar } from './shared';

export default function MedicalTab({ p }: { p: Player }) {
  const inj = p.injury;
  const prone = Math.round(p.development.injuryProneness);
  const hist = p.history?.injuries ?? [];
  return (
    <div className="pp-grid pp-grid-medical">
      <Section title="Verfügbarkeit" icon={<Icon name="staff" size={15} />}>
        <div className="pp-avail" style={{ color: p.availability === 'available' ? 'var(--green)' : 'var(--red)' }}>{AVAIL_DE[p.availability]}</div>
        {inj ? (
          <div className="pp-list">
            <Line label="Diagnose" value={inj.description || INJURY_TYPE_DE[inj.type]} strong />
            <Line label="Art" value={INJURY_TYPE_DE[inj.type]} />
            <Line label="Schwere" value={INJURY_SEV_DE[inj.severity]} />
            <Line label="Seit" value={utcDate(inj.startDate)} />
            <Line label="Voraussichtlich zurück" value={utcDate(inj.expectedReturnDate)} />
            <Line label="Ausfall noch" value={`${inj.daysRemaining} von ${inj.totalDays} Tagen`} />
            <Line label="Entstanden im" value={inj.fromTraining ? 'Training' : 'Spiel'} />
          </div>
        ) : (
          <div className="pp-note">Keine aktuelle Verletzung.</div>
        )}
        <div className="pp-list mt8">
          <Line label="Sperre" value={p.suspensionMatches > 0 ? `${p.suspensionMatches} Spiel(e)` : 'keine'} color={p.suspensionMatches > 0 ? 'var(--red)' : undefined} />
          <Line label="Gelbe Karten (Konto)" value={p.yellowCardCount} />
        </div>
      </Section>
      <div className="pp-stack">
      <Section title="Belastung & Körper" icon={<Icon name="training" size={15} />}>
        <Bar label="Frische" value={frischeOf(p)} />
        <Bar label="Fitness" value={Math.round(p.attributes.fitness)} />
        <Bar label="Robustheit" value={Math.round(p.attributes.strength)} />
        <div className="pp-list mt8">
          <Line label="Trainingsbelastung" value={Math.round(p.trainingLoad)} />
          <Line label="Verletzungsanfälligkeit" value={prone >= 65 ? 'Hoch' : prone >= 40 ? 'Mittel' : 'Gering'} color={vColor(100 - prone)} />
          <Line label="Größe / Gewicht" value={`${p.height} cm · ${p.weight} kg`} />
        </div>
      </Section>
      <Section title="Verletzungshistorie" icon={<Icon name="chronicle" size={15} />} right={hist.length ? `${hist.length} · ${hist.reduce((a, h) => a + h.days, 0)} Ausfalltage` : undefined}>
        {hist.length === 0 ? <div className="pp-note">Bisher keine Verletzung im Spiel.</div> : (
          <div className="pp-list">
            {[...hist].reverse().slice(0, 6).map((h, i) => (
              <Line key={i} label={`${utcDate(h.date)} · ${h.fromTraining ? 'Training' : 'Spiel'}`} value={`${h.description} (${h.days} T.)`} />
            ))}
          </div>
        )}
      </Section>
      </div>
    </div>
  );
}
