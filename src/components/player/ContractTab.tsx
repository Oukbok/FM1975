// Reiter „Vertrag & Wert“: Konditionen, Restlaufzeit, Einordnung im Kader
import { Player } from '../../types';
import { fmtDM, fmtDMfull, vColor, fmtPrice, fmtPriceFull } from '../../ui/format';
import Icon from '../Icon';
import { useState } from 'react';
import type { ContractDemand } from '../../engine/contractTalks';

/** Schnittstelle für Vertragsgespräche (vom Aufrufer mit Spielstand belegt). */
export interface Negotiation {
  demand: (p: Player) => ContractDemand;
  offer: (p: Player, wage: number, years: number) => { ok: boolean; text: string };
}

const MOOD_COLOR: Record<string, string> = { gern: 'var(--green)', offen: 'var(--accent)', 'zögerlich': 'var(--orange)', ablehnend: 'var(--red)' };

function TalkBox({ p, neg }: { p: Player; neg: Negotiation }) {
  const [, force] = useState(0);
  const dem = neg.demand(p);
  const [wage, setWage] = useState(dem.wage);
  const [years, setYears] = useState(Math.min(dem.maxYears, Math.max(dem.minYears, 3)));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const lo = Math.round(dem.wage * 0.7 / 10) * 10, hi = Math.round(dem.wage * 1.3 / 10) * 10;
  const yearOpts = [1, 2, 3, 4, 5];
  return (
    <Section title="Vertragsgespräch" icon={<Icon name="negotiations" size={15} />}>
      <div className="pp-list">
        <Line label="Haltung" value={dem.mood.charAt(0).toUpperCase() + dem.mood.slice(1)} color={MOOD_COLOR[dem.mood]} strong />
        <Line label="Einschätzung" value={dem.reason} />
        <Line label="Forderung / Woche" value={fmtPriceFull(dem.wage)} />
        <Line label="Wunschlaufzeit" value={dem.minYears === dem.maxYears ? `${dem.minYears} Jahr${dem.minYears > 1 ? 'e' : ''}` : `${dem.minYears}–${dem.maxYears} Jahre`} />
      </div>
      {dem.open ? (
        <div className="talk-form">
          <label className="talk-row">
            <span>Angebot / Woche</span>
            <input type="range" min={lo} max={hi} step={10} value={wage} onChange={(e) => setWage(Number(e.target.value))} />
            <b style={{ color: wage >= dem.wage ? 'var(--green)' : wage >= dem.wage * 0.93 ? 'var(--accent)' : 'var(--orange)' }}>{fmtPriceFull(wage)}</b>
          </label>
          <div className="talk-row">
            <span>Laufzeit</span>
            <div className="dchips">
              {yearOpts.map((y) => <button key={y} className={`dchip ${years === y ? 'on' : ''}`} onClick={() => setYears(y)}>{y} J.</button>)}
            </div>
          </div>
          <button className="btn btn-primary talk-send" onClick={() => { setMsg(neg.offer(p, wage, years)); force((x) => x + 1); }}>Angebot machen</button>
        </div>
      ) : <div className="dnote mt8">{dem.blockedText}</div>}
      {msg && <div className="dnote mt8" style={{ color: msg.ok ? 'var(--green)' : 'var(--orange)' }}>{msg.text}</div>}
    </Section>
  );
}
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

export default function ContractTab({ p, squad, today, negotiation }: { p: Player; squad?: Player[]; today?: string; negotiation?: Negotiation }) {
  const k = p.contract;
  const left = monthsLeft(k.expiryDate, today);
  const inSquad = squad && squad.includes(p) ? squad : undefined;
  const avgWage = inSquad ? inSquad.reduce((s, x) => s + x.contract.weeklyWage, 0) / inSquad.length : 0;
  return (
    <div className="pp-grid pp-grid-contract">
      <Section title="Konditionen" icon={<Icon name="contracts" size={15} />}>
        <div className="pp-list">
          <Line label="Gehalt / Woche" value={fmtPriceFull(k.weeklyWage)} strong />
          <Line label="Gehalt / Jahr" value={fmtPriceFull(k.weeklyWage * 52)} />
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
            <Stat label="Marktwert" value={fmtPrice(k.transferValue)} />
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
        {negotiation && <TalkBox p={p} neg={negotiation} />}
      </div>
    </div>
  );
}
