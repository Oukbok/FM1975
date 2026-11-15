// VERHANDLUNGSTISCH — links: der Spieler (Gesicht, Stärke, Kräfteverhältnis, Persönlichkeit
// als Einschätzung, Karrierephase, bisheriger Vertrag). Verdeckte Werte nie als Zahl –
// nur Worte bzw. Punkte.
import ClubCrest from '../../components/ClubCrest';
import PlayerAvatar from '../../components/PlayerAvatar';
import PosBadge from '../../components/PosBadge';
import { careerPhase, PHASE_LABEL, personaOf, personaTitle, TRAIT_LABEL, TRAITS, traitBand } from '../../engine/persona';
import { scoutRangeText } from '../../engine/scouting';
import { estimateFor } from '../../game/playerPool';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { fmtPrice, fmtWage } from '../../ui/format';
import { utcDate } from '../../components/player/shared';
import { NegCard } from '../negotiation/NegFrame';
import { Balance, type LeverItem, Row } from '../negotiation/NegParts';

export function ContractPlayer({ g, p, knowledge, levers, compact }: { g: Game; p: Player; knowledge: number; levers: LeverItem[]; compact?: boolean }) {
  const club = g.clubs[p.clubId];
  const own = p.clubId === g.managedClubId;
  const pe = personaOf(p);
  const est = own ? null : estimateFor(g, p.id);
  const traits = TRAITS.map((t) => [t, traitBand(pe[t], knowledge, `${p.id}|ct|${t}`)] as const)
    .sort((a, b) => (b[1].lo + b[1].hi) - (a[1].lo + a[1].hi)).slice(0, compact ? 2 : 3);
  const k = p.contract;
  const extras = [k.appearanceBonus && 'Einsatzprämie', k.goalBonus && 'Torprämie', k.cleanSheetBonus && 'Zu-null-Prämie', k.titleBonus && 'Titelprämie',
    k.stayBonus && 'Klassenerhalt', k.annualRaise && 'Staffelung', k.fixedFee && 'festgeschriebene Ablöse', k.releaseClause && 'Ausstiegsklausel',
    k.option && (k.option === 'club' ? 'Vereinsoption' : 'Spieleroption'), k.relegationCut && 'Abstiegsklausel', k.loyaltyBonus && 'Treueprämie', k.successRaise && 'Erfolgsklausel'].filter(Boolean);
  return (
    <aside className="vt-left">
      <NegCard title="Der Spieler" className="vt-who">
        <div className="vt-who-head">
          <PlayerAvatar player={p} club={club} size={124} priority />
          <div className="vt-who-r">
            <div className="vt-who-name">{p.fullName}</div>
            <div className="vt-who-sub">{club && <ClubCrest club={club} size={24} />}<span>{club?.name}</span></div>
            <div className="vt-who-sub"><PosBadge p={p} single /><span>{p.age} Jahre</span></div>
          </div>
        </div>
        <div className="vt-kpis">
          <div><b>{est && !est.exact ? `${est.ovLo}–${est.ovHi}` : p.overall}</b><span>Stärke</span></div>
          <div><b>{est ? (est.stLo === est.stHi ? `${est.st} ★` : `${est.stLo}–${est.stHi} ★`).replace(/\./g, ',') : scoutRangeText(p)}</b><span>Potenzial</span></div>
          <div><b>{est && est.k < 0.8 ? `ca. ${fmtPrice(est.value)}` : fmtPrice(k.transferValue)}</b><span>Marktwert</span></div>
        </div>
        <h4 className="vt-h">Kräfteverhältnis</h4>
        <Balance levers={levers} me="Du" them={p.lastName} max={compact ? 4 : 6} />
        <h4 className="vt-h">Persönlichkeit</h4>
        <Row k="Typ">{knowledge >= 0.35 ? personaTitle(pe) : 'noch unbekannt'}</Row>
        <Row k="Karriere">{PHASE_LABEL[careerPhase(p)].split(' – ')[0]}</Row>
        {traits.map(([t, b]) => <Row key={t} k={TRAIT_LABEL[t]}>{b.text}</Row>)}
        <h4 className="vt-h">{own ? 'Bisheriger Vertrag' : `Vertrag bei ${club?.shortName ?? club?.name ?? '—'}`}</h4>
        <Row k="Gehalt">{own || knowledge >= 0.5 ? fmtWage(k.weeklyWage) : 'unbekannt'}</Row>
        <Row k="Vertragsende">{utcDate(k.expiryDate)}</Row>
        {own && <Row k="Zufriedenheit">{k.satisfaction >= 70 ? 'zufrieden' : k.satisfaction >= 45 ? 'geht so' : 'unzufrieden'}</Row>}
        {own && <div className="vt-kv wrap"><span>Klauseln</span><b>{extras.length ? extras.join(', ') : 'keine'}</b></div>}
      </NegCard>
    </aside>
  );
}
