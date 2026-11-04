// VERHANDLUNGSTISCH — rechts: Stimmung/Geduld, Gesprächsverlauf, Auswirkung aufs Budget
// (Gehaltsbudget nach dem Angebot, Kosten der ersten Saison und über die Laufzeit
// nominal, Einmalzahlungen gegen das Transferbudget, Glaubwürdigkeit).
import { useEffect, useRef } from 'react';
import { packageCost, type ContractTerms, type NegCtx } from '../../engine/contractNegotiation';
import { economyScale, formatMoney } from '../../engine/economy';
import { wageLimitFactor } from '../../game/budgetPlan';
import type { NegView } from '../../game/contractView';
import { trustOf } from '../../game/promises';
import type { Game } from '../../game/state';
import { fmtPrice, fmtPriceAuto } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';

const WHO: Record<string, string> = { du: 'Du', spieler: 'Spieler', berater: 'Berater', info: 'Info', verein: 'Verein' };

export function moodOf(v: NegView): { word: string; cls: string } {
  if (v.status === 'agreed') return { word: 'Einig', cls: 'good' };
  if (v.status === 'failed') return { word: 'Abgebrochen', cls: 'bad' };
  if (v.status === 'blocked') return { word: 'Keine Gespräche', cls: 'bad' };
  const r = v.patience / Math.max(1, v.startPatience);
  return r >= 0.7 ? { word: 'Gesprächsbereit', cls: 'good' } : r >= 0.4 ? { word: 'Angespannt', cls: 'mid' } : { word: 'Gereizt', cls: 'bad' };
}

export function ContractSide({ g, v, offer, agentLabel }: { g: Game; v: NegView; offer: ContractTerms | null; agentLabel: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [v.log.length]);
  const m = moodOf(v);
  const club = g.clubs[g.managedClubId];
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const p = g.players[v.pid];
  const mine = p?.clubId === club.id;
  const wagesNow = club.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) - (mine ? p.contract.weeklyWage : 0);
  const after = wagesNow + (offer?.wage ?? (mine ? p.contract.weeklyWage : 0));
  const budget = Math.max(1, club.finances.wageBudget ?? 0);
  const limit = wageLimitFactor(g);
  const share = after / budget;
  const cost = offer && v.ctx ? packageCost(offer, v.ctx as NegCtx) : null;
  const nominal = (x: number) => formatMoney(Math.round(x * economyScale(year)), year);
  const once = offer ? offer.signing + offer.agent : 0;
  const trust = trustOf(g);
  return (
    <aside className="ct-card ct-side">
      <section className="ct-sec ct-mood">
        <h3 className="ct-h">Stimmung <InfoTip k="v2_geduld" /><span className="ct-h-note">Runde {v.round} von {v.maxRounds}</span></h3>
        <div className={`ct-mood-word ${m.cls}`}>{m.word}</div>
        <div className="ct-meter" aria-label={`Geduld ${m.word}`}><span className={m.cls} style={{ width: `${Math.max(0, Math.min(100, (v.patience / Math.max(1, v.startPatience)) * 100))}%` }} /></div>
      </section>
      <section className="ct-sec ct-logsec">
        <h3 className="ct-h">Gesprächsverlauf</h3>
        <div className="ct-log" ref={listRef}>
          {v.log.length === 0 && <div className="ct-dim">Noch kein Wort gewechselt.</div>}
          {v.log.map((l, i) => (
            <div key={i} className={`ct-line who-${l.who}`}>
              <span className="ct-who">{l.who === 'berater' ? agentLabel.replace(/^sein /, '').replace(/^./, (c) => c.toUpperCase()) : WHO[l.who] ?? l.who}</span>
              <span className="ct-txt">{l.text}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="ct-sec ct-budget">
        <h3 className="ct-h">Auswirkung <InfoTip k="v2_kosten" /></h3>
        <div className="ct-kv"><span>Gehaltsbudget danach</span><b className={share > limit ? 'neg' : ''}>{Math.round(share * 100)} %<em> / Grenze {Math.round(limit * 100)} %</em></b></div>
        <div className="ct-meter thin"><span className={share > limit ? 'bad' : 'neutral'} style={{ width: `${Math.min(100, (share / Math.max(limit, 1)) * 100)}%` }} /></div>
        <div className="ct-kv"><span>Kosten erste Saison</span><b>{cost ? nominal(cost.season) : '—'}</b></div>
        <div className="ct-kv"><span>{offer ? `Gesamt über ${offer.years} Jahr${offer.years > 1 ? 'e' : ''}` : 'Gesamt über die Laufzeit'}</span><b>{cost ? nominal(cost.total) : '—'}</b></div>
        <div className="ct-kv"><span>Handgeld + Provision</span><b className={once > club.finances.transferBudget ? 'neg' : ''}>{fmtPriceAuto(once)}</b></div>
        <div className="ct-kv"><span>Transferbudget</span><b>{fmtPrice(Math.max(0, club.finances.transferBudget))}</b></div>
        <div className="ct-kv"><span>Glaubwürdigkeit</span><b>{trust >= 75 ? 'hoch' : trust >= 55 ? 'ordentlich' : trust >= 35 ? 'angekratzt' : 'gering'}</b></div>
      </section>
    </aside>
  );
}
