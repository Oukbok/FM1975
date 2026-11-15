// =============================================================================
// VERHANDLUNGSTISCH (Spieler) — alle Vertragspunkte als Zeilen für die gemeinsame
// Tabelle (screens/negotiation/TermsTable.tsx):
//   Punkt (mit i-Hilfe) | seine Forderung | dein Angebot (Regler/Umschalter) |
//   Stand (einig/offen) | wie wichtig | nicht verhandelbar
// =============================================================================
import type { ReactNode } from 'react';
import { CLAUSE_BY_KEY, ClauseKey, OPTION_CLUB_FROM, OPTION_PLAYER_FROM } from '../../data/contractClauses';
import type { ContractTerms, NegCtx, NegDemand, OptionKind } from '../../engine/contractNegotiation';
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import { fmtPriceAuto, fmtWage, wageUnit } from '../../ui/format';
import Seg from '../../ui/Seg';
import { Amount, Dots } from '../negotiation/NegParts';
import type { TermRow } from '../negotiation/TermsTable';

export { Dots };

const pct = (x: number) => `${Math.round(x * 100)} %`;
const OPT_LABEL: Record<OptionKind, string> = { none: 'keine', club: 'Verein', player: 'Spieler' };

/** Anzeige eines Werts je Punkt. */
export function fmtClause(key: ClauseKey, t: ContractTerms): string {
  switch (key) {
    case 'wage': return fmtWage(t.wage, { unit: false });
    case 'years': return `${t.years} Jahr${t.years > 1 ? 'e' : ''}`;
    case 'raise': case 'success': return t[key] ? `+${pct(t[key])}` : 'keine';
    case 'relegation': return t.relegation ? `−${pct(t.relegation)}` : 'keine';
    case 'option': return OPT_LABEL[t.option];
    case 'promises': return t.promises.length ? t.promises.map((x) => PROMISES[x].label).join(', ') : 'keine';
    case 'release': case 'fixedFee': return t[key] ? fmtPriceAuto(t[key]) : 'keine';
    default: return (t[key] as number) ? fmtPriceAuto(t[key] as number) : 'keine';
  }
}

/** Liegt dein Angebot bei diesem Punkt unter seiner Forderung (aus seiner Sicht)? */
export function short(key: ClauseKey, o: ContractTerms, a: ContractTerms): boolean {
  switch (key) {
    case 'years': return o.years !== a.years;
    case 'relegation': return o.relegation > a.relegation;
    case 'option': return ({ club: 0, none: 1, player: 2 })[o.option] < ({ club: 0, none: 1, player: 2 })[a.option];
    case 'release': case 'fixedFee': return a[key] > 0 && (o[key] === 0 || o[key] > a[key]);
    case 'promises': return a.promises.some((x) => !o.promises.includes(x));
    default: return (o[key] as number) < (a[key] as number);
  }
}

export const CLAUSE_ORDER: ClauseKey[] = ['wage', 'years', 'signing', 'agent', 'appearance', 'goal', 'cleanSheet', 'title', 'stay', 'raise', 'success', 'loyalty', 'relegation', 'fixedFee', 'release', 'option', 'promises'];

/** Zeilen der Vertragstabelle. */
export function playerRows({ d, ctx, ask, offer, setOffer, year, known, promiseOptions, disabled, locks, toggleLock, last }: {
  d: NegDemand; ctx: NegCtx; ask: ContractTerms; offer: ContractTerms; setOffer: (t: ContractTerms) => void;
  year: number; known: boolean; promiseOptions: [PromiseType, number][]; disabled: boolean;
  locks: ClauseKey[]; toggleLock: (k: ClauseKey) => void;
  /** Forderung der Vorrunde (zum Markieren, wo er sich bewegt hat). */
  last?: ContractTerms | null;
}): TermRow[] {
  const set = <K extends keyof ContractTerms>(k: K, v: ContractTerms[K]) => setOffer({ ...offer, [k]: v });
  const fw = ctx.fairWage;
  const r100 = (x: number) => Math.max(100, Math.round(x / 100) * 100);
  const r5k = (x: number) => Math.max(5000, Math.round(x / 5000) * 5000);
  const amount = (key: ClauseKey, label: string, min: number, max: number, step: number): ReactNode => (
    <Amount label={label} value={offer[key] as number} min={min} max={max} step={step} disabled={disabled}
      onChange={(v) => set(key as keyof ContractTerms, v as never)} text={fmtClause(key, offer)} miss={short(key, offer, ask)} />
  );
  const control = (key: ClauseKey): ReactNode => {
    switch (key) {
      case 'wage': return amount('wage', 'Grundgehalt', Math.round(ask.wage * 0.5 / 10) * 10, ask.wage * 1.4, 10);
      case 'years': return <Seg size="s" value={offer.years} onChange={(v) => set('years', v)} options={[1, 2, 3, 4, 5].map((y) => ({ v: y, label: `${y} J.` }))} aria-label="Laufzeit" />;
      case 'signing': return amount('signing', 'Handgeld', 0, Math.max(ask.signing * 2.5, fw * 30), r100(fw / 4));
      case 'agent': return amount('agent', 'Beraterprovision', 0, Math.max(ctx.agentFee * 2, ask.agent * 1.5, 1000), r100(Math.max(ctx.agentFee, 1000) / 40));
      case 'appearance': return amount('appearance', 'Einsatzprämie', 0, Math.max(ask.appearance * 3, fw * 0.3), 10);
      case 'goal': return amount('goal', 'Torprämie', 0, Math.max(ask.goal * 3, fw * 0.8), 10);
      case 'cleanSheet': return amount('cleanSheet', 'Zu-null-Prämie', 0, Math.max(ask.cleanSheet * 3, fw * 0.4), 10);
      case 'title': return amount('title', 'Titelprämie', 0, fw * 12, r100(fw / 4));
      case 'stay': return amount('stay', 'Klassenerhalt-Prämie', 0, fw * 10, r100(fw / 4));
      case 'loyalty': return amount('loyalty', 'Treueprämie', 0, fw * 30, r100(fw / 2));
      case 'raise': return <Seg size="s" value={offer.raise} onChange={(v) => set('raise', v)} options={[0, 0.03, 0.05, 0.08, 0.1].map((v) => ({ v, label: v ? `+${pct(v)}` : 'keine' }))} aria-label="Gehaltssteigerung" />;
      case 'success': return <Seg size="s" value={offer.success} onChange={(v) => set('success', v)} options={[0, 0.1, 0.15, 0.2, 0.3].map((v) => ({ v, label: v ? `+${pct(v)}` : 'keine' }))} aria-label="Erfolgsklausel" />;
      case 'relegation': return <Seg size="s" value={offer.relegation} onChange={(v) => set('relegation', v)} options={[0, 0.1, 0.2, 0.3, 0.5].map((v) => ({ v, label: v ? `−${pct(v)}` : 'keine' }))} aria-label="Abstiegsklausel" />;
      case 'option': return <Seg size="s" value={offer.option} onChange={(v) => set('option', v)} aria-label="Verlängerungsoption"
        options={[{ v: 'none' as OptionKind, label: 'keine' }, { v: 'club' as OptionKind, label: 'Verein', disabled: year < OPTION_CLUB_FROM }, { v: 'player' as OptionKind, label: 'Spieler', disabled: year < OPTION_PLAYER_FROM, title: year < OPTION_PLAYER_FROM ? `erst ab ${OPTION_PLAYER_FROM}` : undefined }]} />;
      case 'release': case 'fixedFee': {
        const mv = Math.max(ctx.marketValue, 10000);
        return amount(key, CLAUSE_BY_KEY[key].label, 0, mv * 5, r5k(mv / 20));
      }
      case 'promises': {
        const toggle = (x: PromiseType) => set('promises', offer.promises.includes(x) ? offer.promises.filter((y) => y !== x) : [...offer.promises, x]);
        return (
          <div className="vt-chips">
            {promiseOptions.slice(0, 8).map(([x, w]) => (
              <button key={x} type="button" className={`vt-chip${offer.promises.includes(x) ? ' on' : ''}`} onClick={() => toggle(x)} aria-pressed={offer.promises.includes(x)} disabled={disabled} title={`${PROMISES[x].desc} Prüfung: ${PROMISES[x].check}`}>
                {PROMISES[x].label}{known && <Dots n={w >= 8 ? 3 : w >= 5 ? 2 : 1} />}
              </button>
            ))}
          </div>
        );
      }
      default: return null;
    }
  };
  return CLAUSE_ORDER.filter((k) => d.keys.includes(k)).map((key): TermRow => {
    const c = CLAUSE_BY_KEY[key];
    const miss = short(key, offer, ask);
    const locked = locks.includes(key);
    const moved = !!last && fmtClause(key, last) !== fmtClause(key, ask);
    return {
      key, info: c.info, label: key === 'wage' ? `Grundgehalt / ${wageUnit()}` : c.label,
      ask: fmtClause(key, ask),
      onAdopt: () => setOffer({ ...offer, [key]: key === 'promises' ? [...ask.promises] : ask[key] } as ContractTerms),
      control: control(key), status: locked ? 'mine' : miss ? 'open' : 'met',
      statusTitle: locked ? 'Von dir für nicht verhandelbar erklärt' : miss ? 'Hier liegt dein Angebot unter seiner Forderung' : 'Dein Angebot erfüllt seine Forderung in diesem Punkt',
      weight: d.weights[key], known, lockable: true, locked, onLock: () => toggleLock(key), tall: key === 'promises', changed: moved,
      hint: <><b>{c.label}</b> – {c.short}
        {key === 'years' && <> Wunsch: {d.range[0] === d.range[1] ? `${d.range[0]} J.` : `${d.range[0]}–${d.range[1]} J.`}</>}
        {key === 'fixedFee' && <> Gilt nur, wenn der Vertrag vor Bosman (Sommer 1996) endet.</>}
        <span className="vt-src">{c.source}</span></>,
    };
  });
}
