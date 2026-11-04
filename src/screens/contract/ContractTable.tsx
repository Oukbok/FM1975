// =============================================================================
// VERHANDLUNGSTISCH — Mitte: alle Vertragspunkte als Zeilen
//   Punkt (mit i-Hilfe) | seine Forderung | dein Angebot (Regler/Umschalter) | wie wichtig
// Feste Zeilenhöhen, die Liste scrollt intern; unten ein fester Hinweisstreifen
// (Erklärung des Punkts unter dem Zeiger bzw. im Fokus).
// =============================================================================
import { useState } from 'react';
import { CLAUSE_BY_KEY, ClauseKey, OPTION_CLUB_FROM, OPTION_PLAYER_FROM } from '../../data/contractClauses';
import type { ContractTerms, NegCtx, NegDemand, OptionKind } from '../../engine/contractNegotiation';
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import { fmtPriceAuto, fmtWage, wageUnit } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import Seg from '../../ui/Seg';

const pct = (x: number) => `${Math.round(x * 100)} %`;
const OPT_LABEL: Record<OptionKind, string> = { none: 'keine', club: 'Verein', player: 'Spieler' };

/** Wichtigkeit als Punkte (nie als Zahl). */
export function Dots({ n, known = true }: { n: number; known?: boolean }) {
  const v = known ? Math.max(0, Math.min(3, n)) : 0;
  const word = !known ? 'noch unbekannt' : v >= 3 ? 'sehr wichtig' : v === 2 ? 'wichtig' : v === 1 ? 'nebensächlich' : 'egal';
  return <span className="ct-dots" aria-label={word} data-word={word}>{[0, 1, 2].map((i) => <i key={i} className={i < v ? 'on' : ''} />)}</span>;
}

function Range({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  const hi = Math.max(min + step, Math.ceil(max / step) * step);
  return <input className="ct-range" type="range" min={min} max={hi} step={step} value={Math.min(hi, Math.max(min, value))} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />;
}

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
function short(key: ClauseKey, o: ContractTerms, a: ContractTerms): boolean {
  switch (key) {
    case 'years': return false;
    case 'relegation': return o.relegation > a.relegation;
    case 'option': return ({ club: 0, none: 1, player: 2 })[o.option] < ({ club: 0, none: 1, player: 2 })[a.option];
    case 'release': case 'fixedFee': return a[key] > 0 && (o[key] === 0 || o[key] > a[key]);
    case 'promises': return a.promises.some((x) => !o.promises.includes(x));
    default: return (o[key] as number) < (a[key] as number);
  }
}

const ORDER: ClauseKey[] = ['wage', 'years', 'signing', 'agent', 'appearance', 'goal', 'cleanSheet', 'title', 'stay', 'raise', 'success', 'loyalty', 'relegation', 'fixedFee', 'release', 'option', 'promises'];

export function ContractTable({ d, ctx, ask, offer, setOffer, year, known, promiseOptions, disabled }: {
  d: NegDemand; ctx: NegCtx; ask: ContractTerms; offer: ContractTerms; setOffer: (t: ContractTerms) => void;
  year: number; known: boolean; promiseOptions: [PromiseType, number][]; disabled: boolean;
}) {
  const [hover, setHover] = useState<ClauseKey | null>(null);
  const set = <K extends keyof ContractTerms>(k: K, v: ContractTerms[K]) => setOffer({ ...offer, [k]: v });
  const fw = ctx.fairWage;
  const r100 = (x: number) => Math.max(100, Math.round(x / 100) * 100);
  const r5k = (x: number) => Math.max(5000, Math.round(x / 5000) * 5000);
  const keys = ORDER.filter((k) => d.keys.includes(k));

  const control = (key: ClauseKey) => {
    switch (key) {
      case 'wage': return <Range label="Grundgehalt" value={offer.wage} min={Math.round(ask.wage * 0.5 / 10) * 10} max={ask.wage * 1.4} step={10} onChange={(v) => set('wage', v)} />;
      case 'years': return <Seg size="s" value={offer.years} onChange={(v) => set('years', v)} options={[1, 2, 3, 4, 5].map((y) => ({ v: y, label: `${y} J.` }))} aria-label="Laufzeit" />;
      case 'signing': return <Range label="Handgeld" value={offer.signing} min={0} max={Math.max(ask.signing * 2.5, fw * 30)} step={r100(fw / 4)} onChange={(v) => set('signing', v)} />;
      case 'agent': return <Range label="Beraterprovision" value={offer.agent} min={0} max={Math.max(ctx.agentFee * 2, ask.agent * 1.5, 1000)} step={r100(Math.max(ctx.agentFee, 1000) / 40)} onChange={(v) => set('agent', v)} />;
      case 'appearance': return <Range label="Einsatzprämie" value={offer.appearance} min={0} max={Math.max(ask.appearance * 3, fw * 0.3)} step={10} onChange={(v) => set('appearance', v)} />;
      case 'goal': return <Range label="Torprämie" value={offer.goal} min={0} max={Math.max(ask.goal * 3, fw * 0.8)} step={10} onChange={(v) => set('goal', v)} />;
      case 'cleanSheet': return <Range label="Zu-null-Prämie" value={offer.cleanSheet} min={0} max={Math.max(ask.cleanSheet * 3, fw * 0.4)} step={10} onChange={(v) => set('cleanSheet', v)} />;
      case 'title': return <Range label="Titelprämie" value={offer.title} min={0} max={fw * 12} step={r100(fw / 4)} onChange={(v) => set('title', v)} />;
      case 'stay': return <Range label="Klassenerhalt-Prämie" value={offer.stay} min={0} max={fw * 10} step={r100(fw / 4)} onChange={(v) => set('stay', v)} />;
      case 'loyalty': return <Range label="Treueprämie" value={offer.loyalty} min={0} max={fw * 30} step={r100(fw / 2)} onChange={(v) => set('loyalty', v)} />;
      case 'raise': return <Seg size="s" value={offer.raise} onChange={(v) => set('raise', v)} options={[0, 0.03, 0.05, 0.08, 0.1].map((v) => ({ v, label: v ? `+${pct(v)}` : 'keine' }))} aria-label="Gehaltssteigerung" />;
      case 'success': return <Seg size="s" value={offer.success} onChange={(v) => set('success', v)} options={[0, 0.1, 0.15, 0.2, 0.3].map((v) => ({ v, label: v ? `+${pct(v)}` : 'keine' }))} aria-label="Erfolgsklausel" />;
      case 'relegation': return <Seg size="s" value={offer.relegation} onChange={(v) => set('relegation', v)} options={[0, 0.1, 0.2, 0.3, 0.5].map((v) => ({ v, label: v ? `−${pct(v)}` : 'keine' }))} aria-label="Abstiegsklausel" />;
      case 'option': return <Seg size="s" value={offer.option} onChange={(v) => set('option', v)} aria-label="Verlängerungsoption"
        options={[{ v: 'none' as OptionKind, label: 'keine' }, { v: 'club' as OptionKind, label: 'Verein', disabled: year < OPTION_CLUB_FROM }, { v: 'player' as OptionKind, label: 'Spieler', disabled: year < OPTION_PLAYER_FROM, title: year < OPTION_PLAYER_FROM ? `erst ab ${OPTION_PLAYER_FROM}` : undefined }]} />;
      case 'release': case 'fixedFee': {
        const mv = Math.max(ctx.marketValue, 10000);
        return <Range label={CLAUSE_BY_KEY[key].label} value={offer[key]} min={0} max={mv * 5} step={r5k(mv / 20)} onChange={(v) => set(key, v)} />;
      }
      case 'promises': {
        const toggle = (x: PromiseType) => set('promises', offer.promises.includes(x) ? offer.promises.filter((y) => y !== x) : [...offer.promises, x]);
        return (
          <div className="ct-prom">
            {promiseOptions.slice(0, 8).map(([x, w]) => (
              <button key={x} type="button" className={`ct-chip${offer.promises.includes(x) ? ' on' : ''}`} onClick={() => toggle(x)} aria-pressed={offer.promises.includes(x)}>
                {PROMISES[x].label}{known && <Dots n={w >= 8 ? 3 : w >= 5 ? 2 : 1} />}
              </button>
            ))}
          </div>
        );
      }
      default: return null;
    }
  };

  const hk = hover ?? 'wage';
  const def = CLAUSE_BY_KEY[hk];
  return (
    <div className={`ct-table${disabled ? ' off' : ''}`}>
      <div className="ct-thead">
        <span>Vertragspunkt</span><span>Forderung</span><span>Dein Angebot</span><span className="ct-th-w">Wichtig</span>
      </div>
      <div className="ct-rows">
        {keys.map((key) => {
          const c = CLAUSE_BY_KEY[key];
          const miss = short(key, offer, ask);
          return (
            <div key={key} className={`ct-row ct-row-${key}${hover === key ? ' hl' : ''}`} data-key={key}
              onMouseEnter={() => setHover(key)} onFocusCapture={() => setHover(key)}>
              <span className="ct-lab">{key === 'wage' ? `Grundgehalt / ${wageUnit()}` : c.label}{c.info && <InfoTip k={c.info} />}</span>
              <span className="ct-ask">{fmtClause(key, ask)}</span>
              <span className="ct-ctl">
                {control(key)}
                {key !== 'promises' && key !== 'years' && key !== 'option' && key !== 'raise' && key !== 'success' && key !== 'relegation'
                  && <b className={`ct-val${miss ? ' miss' : ''}`}>{fmtClause(key, offer)}</b>}
              </span>
              <span className="ct-w"><Dots n={d.weights[key]} known={known} /></span>
            </div>
          );
        })}
      </div>
      <div className="ct-hint" aria-live="polite">
        <b>{def.label}</b> – {def.short}
        {hk === 'years' && <> Wunsch: {d.range[0] === d.range[1] ? `${d.range[0]} J.` : `${d.range[0]}–${d.range[1]} J.`}</>}
        {hk === 'fixedFee' && <> Gilt nur, wenn der Vertrag vor Bosman (Sommer 1996) endet.</>}
        <span className="ct-src">{def.source}</span>
      </div>
    </div>
  );
}
