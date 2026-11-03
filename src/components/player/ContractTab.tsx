// Reiter „Vertrag“ (Vorbild EA Fussball Manager): Vertragsparameter, zusätzliche Vertragsparameter
// (Prämien, Klauseln, Leihe, Vorvertrag – nur, was es gibt), Zusagen, Einordnung im Kader, Vertragsgespräch.
import { Player } from '../../types';
import { fmtDMfull, condColor, fmtPrice, fmtWage, wageUnit } from '../../ui/format';
import { WageSlider } from '../../ui/WageSlider';
import Icon from '../Icon';
import { useState, type ReactNode } from 'react';
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
  const lo = dem.wage * 0.7, hi = dem.wage * 1.3;
  const yearOpts = [1, 2, 3, 4, 5];
  return (
    <Section title="Vertragsgespräch" icon={<Icon name="negotiations" size={15} />}>
      <div className="pp-list">
        <Line label="Haltung" value={dem.mood.charAt(0).toUpperCase() + dem.mood.slice(1)} color={MOOD_COLOR[dem.mood]} strong />
        <Line label="Einschätzung" value={dem.reason} />
        <Line label={`Forderung / ${wageUnit()}`} value={fmtWage(dem.wage, { unit: false })} />
        <Line label="Wunschlaufzeit" value={dem.minYears === dem.maxYears ? `${dem.minYears} Jahr${dem.minYears > 1 ? 'e' : ''}` : `${dem.minYears}–${dem.maxYears} Jahre`} />
      </div>
      {dem.open ? (
        <div className="talk-form">
          <WageSlider label={`Angebot / ${wageUnit()}`} value={wage} min={lo} max={hi} onChange={setWage}
            valueStyle={{ color: wage >= dem.wage ? 'var(--green)' : wage >= dem.wage * 0.93 ? 'var(--accent)' : 'var(--orange)' }} />
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
import { utcDate, Section, Line } from './shared';
import { useClubProfile } from '../club/ClubLink';
import { PLAYER_DRAW_BONUS, PLAYER_WIN_BONUS } from '../../engine/finances';
import { PROMISES } from '../../engine/transferMarket';
import type { Game } from '../../game/state';
import { InfoTip } from '../../ui/InfoTip';

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

const clubNameOf = (g: Game | undefined, id?: string) =>
  (id && g ? (g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? g.euroClubs?.[id]?.name) : undefined) ?? '—';

/** Zusatzparameter aus den Vertragsdaten – nur, was es im Spiel wirklich gibt. */
function extraParams(g: Game | undefined, p: Player): [ReactNode, ReactNode][] {
  const k = p.contract;
  const out: [ReactNode, ReactNode][] = [];
  const mine = !!g && p.clubId === g.managedClubId;
  if (mine && !p.isYouth) {
    out.push([<>Siegprämie (Mannschaftsregel)</>, fmtPrice(k.weeklyWage * PLAYER_WIN_BONUS)]);
    out.push([<>Prämie je Remis</>, fmtPrice(k.weeklyWage * PLAYER_DRAW_BONUS)]);
  }
  if (k.goalBonus) out.push(['Torprämie', fmtDMfull(k.goalBonus)]);
  if (k.loyaltyBonus) out.push([<>Treueprämie<InfoTip k="treuepraemie" /></>, `${fmtPrice(k.loyaltyBonus)} zum Vertragsende`]);
  if (k.successRaise) out.push([<>Erfolgsklausel<InfoTip k="erfolgsklausel" /></>, `+${Math.round(k.successRaise * 100)} % Gehalt bei Europapokal-Platz`]);
  if (k.noRivalSale) out.push(['Kein Verkauf an Rivalen', 'zugesagt']);
  if (k.buyBack) out.push(['Rückkaufoption', `${clubNameOf(g, k.buyBack.clubId)} · ${fmtPrice(k.buyBack.fee)} bis ${utcDate(k.buyBack.until)}`]);
  if (p.sellOn) out.push(['Weiterverkaufsbeteiligung', `${Math.round(p.sellOn.pct * 100)} % an ${clubNameOf(g, p.sellOn.clubId)}`]);
  if (p.loan) out.push(['Leihe', `von ${clubNameOf(g, p.loan.fromClubId)} bis ${utcDate(p.loan.until)}${p.loan.optionFee ? ` · Kaufoption ${fmtPrice(p.loan.optionFee)}` : ''}`]);
  if (k.preContractClubId) out.push(['Vorvertrag', `wechselt zum Vertragsende zu ${clubNameOf(g, k.preContractClubId)}`]);
  return out;
}

const PROMISE_STATE = { kept: 'eingehalten', broken: 'gebrochen' } as const;

export default function ContractTab({ p, squad, today, negotiation }: { p: Player; squad?: Player[]; today?: string; negotiation?: Negotiation }) {
  const g = useClubProfile()?.game;
  const k = p.contract;
  const left = monthsLeft(k.expiryDate, today ?? g?.calendar.currentDate);
  const inSquad = squad && squad.includes(p) ? squad : undefined;
  const avgWage = inSquad ? inSquad.reduce((s, x) => s + x.contract.weeklyWage, 0) / inSquad.length : 0;
  const extra = extraParams(g, p);
  const promises = p.promises ?? [];
  return (
    <div className="pp3-contract">
      <div className="pp3-two">
      <Section title="Vertragsparameter">
        <div className="pp-list">
          <Line label="Vertragsende" value={utcDate(k.expiryDate)} strong />
          <Line label={<>Restlaufzeit<InfoTip k="restlaufzeit" /></>} value={left === null ? '—' : left >= 12 ? `${Math.floor(left / 12)} J. ${left % 12} M.` : `${left} Monate`} color={left !== null && left <= 6 ? 'var(--neg)' : undefined} />
          <Line label={`Grundgehalt / ${wageUnit()}`} value={fmtWage(k.weeklyWage, { unit: false })} />
          <Line label={<>Marktwert<InfoTip k="marktwert" /></>} value={fmtPrice(k.transferValue)} />
          <Line label={<>Ausstiegsklausel<InfoTip k="ausstiegsklausel" /></>} value={typeof k.releaseClause === 'number' ? fmtPrice(k.releaseClause) : 'keine'} />
          <Line label={<>Zufriedenheit<InfoTip k="zufriedenheit" /></>} value={`${Math.round(k.satisfaction)} %`} color={condColor(k.satisfaction)} />
          <Line label="Transferliste" value={p.transferListed ? 'Ja' : 'Nein'} color={p.transferListed ? 'var(--neg)' : undefined} />
        </div>
      </Section>
      <Section title={<>Zusätzliche Vertragsparameter<InfoTip k="spielerKlauseln" /></>}>
        {extra.length ? (
          <div className="pp-list">{extra.map(([l, v], i) => <Line key={i} label={l} value={v} />)}</div>
        ) : <div className="pp-note">Keine Zusatzvereinbarungen.</div>}
      </Section>
      </div>
      {negotiation && <TalkBox p={p} neg={negotiation} />}
      {promises.length > 0 && (
        <Section title="Zusagen beim Wechsel">
          <div className="pp-list">
            {promises.map((pr, i) => (
              <Line key={i} label={`${PROMISES[pr.type]?.label ?? pr.type} · ${pr.season}`}
                value={pr.result ? PROMISE_STATE[pr.result] : 'offen'} color={pr.result === 'broken' ? 'var(--neg)' : pr.result === 'kept' ? 'var(--pos)' : undefined} />
            ))}
          </div>
        </Section>
      )}
      {inSquad && (
        <Section title="Einordnung im Kader">
          <div className="pp-list">
            <Line label="Stärke" value={rank(inSquad, p, (x) => x.overall)} />
            <Line label="Marktwert" value={rank(inSquad, p, (x) => x.contract.transferValue)} />
            <Line label="Gehalt" value={rank(inSquad, p, (x) => x.contract.weeklyWage)} />
            <Line label="Gehalt vs. Kaderschnitt" value={avgWage > 0 ? `${Math.round((k.weeklyWage / avgWage) * 100)} %` : '—'} />
            <Line label="Wert / Jahresgehalt" value={k.weeklyWage > 0 ? `${(k.transferValue / (k.weeklyWage * 52)).toFixed(1)}×` : '—'} />
          </div>
        </Section>
      )}
    </div>
  );
}
