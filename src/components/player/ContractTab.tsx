// Reiter „Vertrag & Wert“: Konditionen, Restlaufzeit, Einordnung im Kader
import { Player } from '../../types';
import { fmtDM, fmtDMfull, vColor } from '../../ui/format';
import Icon from '../Icon';
import { utcDate, Section, Line, Stat } from './shared';

function monthsLeft(expiry: string, today?: string): number | null {
  if (!expiry) return null;
  const a = today ? new Date(today) : new Date();
  const b = new Date(expiry);
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()));
}

function rank<T>(list: T[], self: T, val: (x: T) => number): string {
  const sorted = [...list].sort((a, b) => val(b) - val(a));
  const i = sorted.indexOf(self);
  return i < 0 ? '—' : `${i + 1}. von ${sorted.length}`;
}

export default function ContractTab({ p, squad, today }: { p: Player; squad?: Player[]; today?: string }) {
  const k = p.contract;
  const left = monthsLeft(k.expiryDate, today);
  const inSquad = squad && squad.includes(p) ? squad : undefined;
  const avgWage = inSquad ? inSquad.reduce((s, x) => s + x.contract.weeklyWage, 0) / inSquad.length : 0;
  return (
    <div className="pp-grid pp-grid-contract">
      <Section title="Konditionen" icon={<Icon name="contracts" size={15} />}>
        <div className="pp-list">
          <Line label="Gehalt / Woche" value={fmtDMfull(k.weeklyWage)} strong />
          <Line label="Gehalt / Jahr" value={fmtDMfull(k.weeklyWage * 52)} />
          <Line label="Vertrag bis" value={utcDate(k.expiryDate)} />
          <Line label="Restlaufzeit" value={left === null ? '—' : left >= 12 ? `${Math.floor(left / 12)} J. ${left % 12} M.` : `${left} Monate`} color={left !== null && left <= 6 ? 'var(--orange)' : undefined} />
          <Line label="Ausstiegsklausel" value={typeof k.releaseClause === 'number' ? fmtDM(k.releaseClause) : 'keine'} />
          <Line label="Tor-Prämie" value={k.goalBonus ? fmtDMfull(k.goalBonus) : 'keine'} />
          <Line label="Transferliste" value={p.transferListed ? 'Ja' : 'Nein'} color={p.transferListed ? 'var(--orange)' : undefined} />
        </div>
      </Section>
      <div className="pp-stack">
        <Section title="Wert & Zufriedenheit" icon={<Icon name="finances" size={15} />}>
          <div className="pp-stat-grid">
            <Stat label="Marktwert" value={fmtDM(k.transferValue)} />
            <Stat label="Zufriedenheit" value={<span style={{ color: vColor(k.satisfaction) }}>{k.satisfaction} %</span>} />
            <Stat label="Wert / Jahresgehalt" value={k.weeklyWage > 0 ? `${(k.transferValue / (k.weeklyWage * 52)).toFixed(1)}×` : '—'} />
          </div>
        </Section>
        {inSquad && (
          <Section title="Einordnung im Kader" icon={<Icon name="squad" size={15} />}>
            <div className="pp-list">
              <Line label="Stärke" value={rank(inSquad, p, (x) => x.overall)} />
              <Line label="Marktwert" value={rank(inSquad, p, (x) => x.contract.transferValue)} />
              <Line label="Gehalt" value={rank(inSquad, p, (x) => x.contract.weeklyWage)} />
              <Line label="Gehalt vs. Kaderschnitt" value={avgWage > 0 ? `${Math.round((k.weeklyWage / avgWage) * 100)} %` : '—'} />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
