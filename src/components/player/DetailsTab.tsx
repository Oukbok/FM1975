// Reiter „Details“ (Vorbild EA Fussball Manager): Anweisungen ans Trainerteam (Positionstraining,
// Schwerpunkt der Trainingswoche), Aufstellung (Rolle im Spieltagskader, Standards), Verfügbarkeit
// und Belastung (frühere „Medizin“) sowie die Verletzungen als Tabelle Saison/Verletzung/Ausfallzeit.
import { useState } from 'react';
import type { Player, Position } from '../../types';
import { useClubProfile } from '../club/ClubLink';
import { POSITION_NAMES_DE, positionSuitability } from '../../engine/positions';
import { rankedPositions, setTrainingPosition, skillOf, TRAIN_CAP } from '../../engine/positionSkill';
import { InfoTip } from '../../ui/InfoTip';
import { StatusLine, fitness100, freshness100 } from '../status';
import { HiddenLine } from './HiddenLine';
import { trainingTargets } from './profileData';
import { ATTR_DE, AVAIL_DE, INJURY_SEV_DE, INJURY_TYPE_DE, Bar, Line, Section, utcDate } from './shared';

/** Saison zu einem Datum (Juli–Juni), z. B. „1978/79“. */
export function seasonOfDate(iso: string): string {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
  const s = m >= 7 ? y : y - 1;
  return `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
}

const weeksText = (days: number) => (days >= 14 ? `${Math.round(days / 7)} Wochen` : `${days} Tag${days === 1 ? '' : 'e'}`);

function CoachOrders({ p, onChange }: { p: Player; onChange: () => void }) {
  const g = useClubProfile()?.game;
  const [, force] = useState(0);
  const today = g?.calendar.currentDate;
  const mine = !!g && p.clubId === g.managedClubId && !p.isYouth;
  if (!mine || !today) return null;
  const train = p.positionSkill?.train ?? null;
  const options = rankedPositions(p, positionSuitability).map((r) => r.pos).filter((pos) => pos !== p.naturalPosition);
  const set = (v: string) => {
    setTrainingPosition(p, v ? (v as Position) : null, today);
    force((n) => n + 1); onChange();
  };
  const focus = [...trainingTargets(g, p)].map((k) => ATTR_DE[k]);
  return (
    <Section title={<>Anweisungen ans Trainerteam<InfoTip k="positionstraining" /></>}>
      <div className="pp-list">
        <div className="pp-line pp3-orderline">
          <span className="pp-line-lbl">Zusätzliche Position trainieren</span>
          <select className="pp2-select" value={train ?? ''} onChange={(e) => set(e.target.value)}>
            <option value="">keine</option>
            {options.map((pos) => <option key={pos} value={pos}>{pos} · {POSITION_NAMES_DE[pos]} ({Math.round(skillOf(p, pos))})</option>)}
          </select>
        </div>
        {train && <div className="pp-note">Training allein bringt die Vertrautheit als {POSITION_NAMES_DE[train]} bis {TRAIN_CAP}, den Rest holt er sich in Spielen.</div>}
        <Line label="Wochentraining fördert vor allem" value={focus.length ? focus.slice(0, 6).join(', ') : '—'} />
      </div>
    </Section>
  );
}

function LineupInfo({ p }: { p: Player }) {
  const g = useClubProfile()?.game;
  const club = g?.clubs[p.clubId];
  const t = club?.tactics;
  if (!t || p.isYouth) return null;
  // Maßgeblich ist die Slot-Zuordnung (lineupMap), ältere Spielstände nutzen startingXI
  const xi = t.lineupMap && Object.keys(t.lineupMap).length ? Object.values(t.lineupMap) : t.startingXI;
  const inXI = xi.includes(p.id);
  const bench = t.substitutes.includes(p.id);
  const pos = t.assignedPositions?.[p.id];
  const roles = [
    t.captainId === p.id && 'Kapitän', t.penaltyTakerId === p.id && 'Elfmeter',
    t.freeKickTakerId === p.id && 'Freistöße', t.cornerTakerId === p.id && 'Ecken',
  ].filter(Boolean) as string[];
  const s = p.seasonStats;
  return (
    <Section title="Aufstellung">
      <div className="pp-list">
        <Line label={g && p.clubId === g.managedClubId ? 'Spieltagskader' : 'Zuletzt aufgestellt'}
          value={!xi.length ? 'keine feste Aufstellung (wird vor dem Spiel gewählt)'
            : inXI ? `Startelf${pos ? ` als ${POSITION_NAMES_DE[pos] ?? pos}` : ''}` : bench ? 'Ersatzbank' : 'nicht im Kader'} />
        <Line label="Aufgaben" value={roles.length ? roles.join(', ') : '—'} />
        <Line label="Startelf (Saison)" value={s.appearances ? `${s.starts} von ${s.appearances} Einsätzen` : 'noch kein Einsatz'} />
      </div>
    </Section>
  );
}

export default function DetailsTab({ p, onChange }: { p: Player; onChange: () => void }) {
  const g = useClubProfile()?.game;
  const inj = p.injury;
  const hist = [...(p.history?.injuries ?? [])].reverse();
  const total = hist.reduce((a, h) => a + h.days, 0);
  return (
    <div className="pp3-details">
      <CoachOrders p={p} onChange={onChange} />
      <LineupInfo p={p} />
      <div className="pp3-two">
        <Section title="Verfügbarkeit">
          <div className="pp-list">
            <Line label="Status" value={AVAIL_DE[p.availability]} color={p.availability === 'available' ? undefined : 'var(--neg)'} strong />
            {inj && <>
              <Line label="Diagnose" value={`${inj.description || INJURY_TYPE_DE[inj.type]} (${INJURY_SEV_DE[inj.severity]})`} />
              <Line label="Zurück voraussichtlich" value={`${utcDate(inj.expectedReturnDate)} · noch ${inj.daysRemaining} T.`} />
            </>}
            <Line label="Sperre" value={p.suspensionMatches > 0 ? `${p.suspensionMatches} Spiel(e)` : 'keine'} color={p.suspensionMatches > 0 ? 'var(--neg)' : undefined} />
            <Line label="Gelbe Karten (Konto)" value={p.yellowCardCount} />
          </div>
        </Section>
        <Section title="Belastung">
          <StatusLine kind="frische" value={freshness100(p)} />
          <StatusLine kind="fitness" value={fitness100(p)} />
          <Bar label="Robustheit" value={Math.round(p.attributes.strength)} />
          <div className="pp2-hidden"><HiddenLine g={g} p={p} trait="verletzung" /></div>
        </Section>
      </div>
      <Section title="Verletzungen" right={hist.length ? `${hist.length} · ${total} Ausfalltage` : undefined}>
        <table className="pp-table pp3-table">
          <thead><tr><th>Saison</th><th>Verletzung</th><th>Datum</th><th>Ort</th><th className="num">Ausfallzeit</th></tr></thead>
          <tbody>
            {hist.slice(0, 12).map((h, i) => (
              <tr key={i}>
                <td>{seasonOfDate(h.date)}</td>
                <td>{h.description || INJURY_TYPE_DE[h.type]} <span className="dim">· {INJURY_SEV_DE[h.severity]}</span></td>
                <td>{utcDate(h.date)}</td>
                <td>{h.fromTraining ? 'Training' : 'Spiel'}</td>
                <td className="num">{weeksText(h.days)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {hist.length === 0 && <div className="pp-note">Bisher keine Verletzung im Spiel.</div>}
      </Section>
    </div>
  );
}
