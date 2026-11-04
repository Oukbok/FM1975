// Reiter „Vertrag“ (Vorbild EA Fussball Manager): Vertragsparameter, zusätzliche Vertragsparameter
// (Prämien, Klauseln, Leihe, Vorvertrag – nur, was es gibt), Zusagen, Einordnung im Kader, Vertragsgespräch.
import { Player } from '../../types';
import { condColor, fmtPrice, fmtWage, wageUnit } from '../../ui/format';
import Icon from '../Icon';
import { type ReactNode } from 'react';
import { openContractScreen } from '../../screens/contract/contractOpen';
import { clubOptionOpen } from '../../game/contractClausesGame';
import type { ContractDemand } from '../../engine/contractTalks';

/** Schnittstelle für Vertragsgespräche (vom Aufrufer mit Spielstand belegt). */
export interface Negotiation {
  demand: (p: Player) => ContractDemand;
  offer: (p: Player, wage: number, years: number) => { ok: boolean; text: string };
}

const MOOD_COLOR: Record<string, string> = { gern: 'var(--green)', offen: 'var(--accent)', 'zögerlich': 'var(--orange)', ablehnend: 'var(--red)' };

/** Vertragsgespräch: Einschätzung + Knopf zum Verhandlungstisch (screens/contract/). */
function TalkBox({ p, neg }: { p: Player; neg: Negotiation }) {
  const g = useClubProfile()?.game;
  const dem = neg.demand(p);
  const st = p.contract.talks?.neg;
  const running = st && st.status === 'open';
  return (
    <Section title={<>Vertragsgespräch<InfoTip k="v2_tisch" /></>} icon={<Icon name="negotiations" size={15} />}>
      <div className="pp-list">
        <Line label="Haltung" value={dem.mood.charAt(0).toUpperCase() + dem.mood.slice(1)} color={MOOD_COLOR[dem.mood]} strong />
        <Line label="Einschätzung" value={dem.reason} />
        <Line label="Gespräch" value={running ? `läuft – Runde ${st!.round}` : dem.open ? 'noch nicht begonnen' : 'nicht möglich'} />
      </div>
      {dem.open || running ? (
        <div className="talk-form">
          <button className="btn btn-primary talk-send" onClick={() => openContractScreen({ kind: 'renew', pid: p.id })}>
            {running ? 'Verhandlung fortsetzen' : 'Zum Verhandlungstisch'}
          </button>
        </div>
      ) : <div className="dnote mt8">{dem.blockedText}</div>}
      {g && clubOptionOpen(g, p) && <div className="dnote mt8">Vereinsoption: Am Verhandlungstisch kannst du sie ziehen (ein weiteres Jahr zu gleichen Bedingungen).</div>}
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
  const pc = (x: number) => `${Math.round(x * 100)} %`;
  if (k.appearanceBonus) out.push([<>Einsatzprämie<InfoTip k="v2_praemien" /></>, `${fmtPrice(k.appearanceBonus)} je Einsatz`]);
  if (k.goalBonus) out.push(['Torprämie', `${fmtPrice(k.goalBonus)} je Tor`]);
  if (k.cleanSheetBonus) out.push(['Zu-null-Prämie', `${fmtPrice(k.cleanSheetBonus)} je Spiel ohne Gegentor`]);
  if (k.titleBonus) out.push([<>Titelprämie<InfoTip k="v2_titel" /></>, `${fmtPrice(k.titleBonus)} je Titel`]);
  if (k.stayBonus) out.push(['Klassenerhalt-Prämie', fmtPrice(k.stayBonus)]);
  if (k.annualRaise) out.push([<>Gehaltssteigerung<InfoTip k="v2_staffel" /></>, `+${pc(k.annualRaise)} je Saison`]);
  if (k.relegationCut) out.push([<>Abstiegsklausel<InfoTip k="v2_abstieg" /></>, `−${pc(k.relegationCut)} Gehalt nach Abstieg`]);
  if (k.fixedFee) out.push([<>Festgeschriebene Ablöse<InfoTip k="v2_festablose" /></>, `${fmtPrice(k.fixedFee)} nach Vertragsende`]);
  if (k.option) out.push([<>Verlängerungsoption<InfoTip k="v2_option" /></>, k.option === 'club' ? 'Verein: +1 Jahr' : 'Spieler: +1 Jahr']);
  if (k.signed?.signing) out.push(['Handgeld bei Unterschrift', fmtPrice(k.signed.signing)]);
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
