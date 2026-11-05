// VERHANDLUNGSTISCH — links: der Spieler (Gesicht, Stärke, Persönlichkeit als
// Einschätzung, Karrierephase, bisheriger Vertrag, was ihm wichtig ist, Wünsche).
// Verdeckte Werte nie als Zahl – nur Worte bzw. Punkte.
import ClubCrest from '../../components/ClubCrest';
import PlayerAvatar from '../../components/PlayerAvatar';
import PosBadge from '../../components/PosBadge';
import { CLAUSE_BY_KEY, ClauseKey } from '../../data/contractClauses';
import type { NegDemand } from '../../engine/contractNegotiation';
import { careerPhase, PHASE_LABEL, personaOf, personaTitle, TRAIT_LABEL, TRAITS, traitBand } from '../../engine/persona';
import { scoutRangeText } from '../../engine/scouting';
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { fmtPrice, fmtWage } from '../../ui/format';
import { utcDate } from '../../components/player/shared';
import { Dots } from './ContractTable';
import { InfoTip } from '../../ui/InfoTip';

export function ContractPlayer({ g, p, d, knowledge, promiseOptions }: {
  g: Game; p: Player; d: NegDemand | null; knowledge: number; promiseOptions: [PromiseType, number][];
}) {
  const club = g.clubs[p.clubId];
  const pe = personaOf(p);
  const known = knowledge >= 0.55;
  const traits = TRAITS.map((t) => [t, traitBand(pe[t], knowledge, `${p.id}|ct|${t}`)] as const)
    .sort((a, b) => (b[1].lo + b[1].hi) - (a[1].lo + a[1].hi)).slice(0, 3);
  const top = d ? (Object.entries(d.weights) as [ClauseKey, number][]).filter(([k]) => d.keys.includes(k)).sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
  const k = p.contract;
  const extras = [k.appearanceBonus && 'Einsatzprämie', k.goalBonus && 'Torprämie', k.cleanSheetBonus && 'Zu-null-Prämie', k.titleBonus && 'Titelprämie',
    k.stayBonus && 'Klassenerhalt', k.annualRaise && 'Staffelung', k.fixedFee && 'festgeschriebene Ablöse', k.releaseClause && 'Ausstiegsklausel',
    k.option && (k.option === 'club' ? 'Vereinsoption' : 'Spieleroption'), k.relegationCut && 'Abstiegsklausel', k.loyaltyBonus && 'Treueprämie', k.successRaise && 'Erfolgsklausel'].filter(Boolean);
  return (
    <aside className="ct-card ct-player">
      <div className="ct-head">
        <PlayerAvatar player={p} club={club} size={124} priority />
        <div className="ct-head-r">
          <div className="ct-name">{p.fullName}</div>
          <div className="ct-sub">{club && <ClubCrest club={club} size={24} />}<span>{club?.name}</span></div>
          <div className="ct-sub"><PosBadge p={p} single /><span>{p.age} Jahre</span></div>
        </div>
      </div>
      <div className="ct-kpis">
        <div><b>{p.overall}</b><span>Stärke</span></div>
        <div><b>{scoutRangeText(p)}</b><span>Potenzial</span></div>
        <div><b>{fmtPrice(k.transferValue)}</b><span>Marktwert</span></div>
      </div>
      <section className="ct-sec">
        <h3 className="ct-h">Persönlichkeit <InfoTip k="persoenlichkeit" /></h3>
        <div className="ct-kv"><span>Typ</span><b>{knowledge >= 0.35 ? personaTitle(pe) : 'noch unbekannt'}</b></div>
        <div className="ct-kv"><span>Karriere</span><b>{PHASE_LABEL[careerPhase(p)].split(' – ')[0]}</b></div>
        <div className="ct-kv ct-kv-note"><span>{PHASE_LABEL[careerPhase(p)].split(' – ')[1] ?? ''}</span></div>
        {traits.map(([t, b]) => <div key={t} className="ct-kv"><span>{TRAIT_LABEL[t]}</span><b>{b.text}</b></div>)}
      </section>
      <section className="ct-sec">
        <h3 className="ct-h">{p.clubId === g.managedClubId ? 'Bisheriger Vertrag' : `Vertrag bei ${club?.shortName ?? club?.name ?? '—'}`}</h3>
        <div className="ct-kv"><span>Gehalt</span><b>{fmtWage(k.weeklyWage)}</b></div>
        <div className="ct-kv"><span>Vertragsende</span><b>{utcDate(k.expiryDate)}</b></div>
        <div className="ct-kv"><span>Zufriedenheit</span><b>{k.satisfaction >= 70 ? 'zufrieden' : k.satisfaction >= 45 ? 'geht so' : 'unzufrieden'}</b></div>
        <div className="ct-kv ct-kv-wrap"><span>Klauseln</span><b>{extras.length ? extras.join(', ') : 'keine'}</b></div>
      </section>
      <section className="ct-sec">
        <h3 className="ct-h">Was ihm wichtig ist</h3>
        {top.map(([key, w]) => <div key={key} className="ct-kv"><span>{CLAUSE_BY_KEY[key].label}</span><Dots n={w} known={known} /></div>)}
        {promiseOptions.slice(0, 2).map(([x, w]) => <div key={x} className="ct-kv"><span>Zusage: {PROMISES[x].label}</span><Dots n={w >= 8 ? 3 : w >= 5 ? 2 : 1} known={known} /></div>)}
      </section>
    </aside>
  );
}
