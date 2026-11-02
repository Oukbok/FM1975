// =============================================================================
import type { ReactNode } from 'react';
import { ClubLink } from './club/ClubLink';
// PlayerModal — großes Spielerprofil mit Reitern (angelehnt an EA Fussball Manager / Football Manager)
//   Kopf (immer sichtbar): Porträt | Identität + Steckbrief | Zustand
//   Reiter: Übersicht · Attribute · Entwicklung · Spiele · Statistik · Karriere · Vertrag & Wert · Medizin · Bericht
//   Die Reiter liegen in src/components/player/.
// =============================================================================
import { useState } from 'react';
import { Player, Club, renderStars } from '../types';
import PlayerAvatar from './PlayerAvatar';
import ClubCrest from './ClubCrest';
import { scoutRangeText } from '../engine/scouting';
import { POS_DE, PLAYER_TYPE, AVAIL_DE, utcDate, footLabel } from './player/shared';
import { StatusLine, fitness100, freshness100, form100, playerMorale100 } from './status';
import { useClubProfile } from './club/ClubLink';
import { HiddenLine } from './player/HiddenLine';
import { InfoTip } from '../ui/InfoTip';
import OverviewTab from './player/OverviewTab';
import AttributesTab from './player/AttributesTab';
import DevelopmentTab from './player/DevelopmentTab';
import StatsTab from './player/StatsTab';
import ContractTab, { Negotiation } from './player/ContractTab';
import MedicalTab from './player/MedicalTab';
import ReportTab from './player/ReportTab';
import MatchesTab from './player/MatchesTab';
import CareerTab from './player/CareerTab';
import WishesTab from './player/WishesTab';
import type { InfoKey } from '../data/infoTexts';

export type Tab = 'extra' | 'overview' | 'attributes' | 'development' | 'matches' | 'stats' | 'career' | 'contract' | 'wishes' | 'medical' | 'report';
const TABS: [Tab, string][] = [
  ['overview', 'Übersicht'], ['attributes', 'Attribute'], ['development', 'Entwicklung'], ['matches', 'Spiele'],
  ['stats', 'Statistik'], ['career', 'Karriere'], ['contract', 'Vertrag & Wert'], ['wishes', 'Wünsche'], ['medical', 'Medizin'], ['report', 'Bericht'],
];

export default function PlayerModal({ player, club, squad, today, season, onClose, negotiation, initialTab, extraTab, tag }: {
  player: Player; club?: Club; squad?: Player[]; today?: string; season?: string; onClose: () => void;
  /** Zusätzlicher erster Reiter (z. B. Jugend: Hochziehen/Fördervertrag bzw. Talent ansprechen). */
  extraTab?: { label: string; content: ReactNode };
  /** Ersetzt das Etikett „Jugend“ (z. B. „A-Jugend · U19“). */
  tag?: string;
  /** Vertragsverhandlung (nur eigener Verein). */
  negotiation?: Negotiation;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'overview');
  const g = useClubProfile()?.game;
  const p = player;
  const availText = p.availability === 'injured' ? `Verletzt (${p.injury?.daysRemaining ?? '?'} Tage)` : AVAIL_DE[p.availability];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pp-header" style={{ ['--club' as string]: club?.colors.primary ?? 'var(--border)' }}>
          <div className="pp-portrait">
            <PlayerAvatar player={p} club={club} size={210} />
            {club && <div className="pp-portrait-crest"><ClubLink id={club.id}><ClubCrest club={club} size={40} /></ClubLink></div>}
          </div>

          <div className="pp-id">
            <div className="pp-club">{club ? <ClubLink id={club.id}>{club.name}</ClubLink> : 'Vereinslos'}<span className="pp-club-no">Nr. {p.shirtNumber}</span></div>
            <h2 className="pp-name">{p.fullName}</h2>
            <div className="pp-sub">
              {POS_DE[p.naturalPosition] ?? p.naturalPosition} · {PLAYER_TYPE[p.naturalPosition] ?? '—'}
              {p.secondaryPositions.length > 0 && <span className="pp-sub-sec"> · auch {p.secondaryPositions.join(', ')}</span>}
              <span className="pp-sub-sec"> · geb. {utcDate(p.dateOfBirth)}</span>
            </div>
            <div className="pp-status">
              <span className={`pp-avail-dot${p.availability === 'available' ? '' : ' bad'}`} />
              <span className={p.availability === 'available' ? '' : 'pp-status-bad'}>{availText}</span>
              {p.transferListed && <span className="pp-tag">Transferliste</span>}
              {(p.isYouth || tag) && <span className="pp-tag">{tag ?? 'Jugend'}</span>}
            </div>
            <div className="pp-facts">
              <Fact label="Stärke" value={String(p.overall)} big info="staerke" />
              <Fact label="Potenzial" value={scoutRangeText(p)} info="potenzial" />
              <Fact label="Alter" value={`${p.age}`} title={`geboren am ${utcDate(p.dateOfBirth)}`} />
              <Fact label="Nation" value={p.nationality} />
              <Fact label="Größe" value={`${p.height} cm`} />
              <Fact label="Gewicht" value={`${p.weight} kg`} />
              <Fact label="Fuß" value={footLabel(p)} />
            </div>
          </div>

          <div className="pp-cond">
            <div className="pp-section-title">Zustand</div>
            <StatusLine kind="frische" value={freshness100(p)} />
            <StatusLine kind="form" value={form100(p)} />
            <StatusLine kind="moral" value={playerMorale100(p)} />
            <StatusLine kind="fitness" value={fitness100(p)} />
            <HiddenLine g={g} p={p} trait="konstanz" info="konstanz" />
            <HiddenLine g={g} p={p} trait="nerven" info="nervenstaerke" />
          </div>

          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <nav className="tabs pp-tabs">
          {(extraTab ? [['extra', extraTab.label] as [Tab, string], ...TABS] : TABS).map(([t, l]) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>)}
        </nav>

        <div className="pp-body">
          {tab === 'extra' && extraTab && <div className="pp-extra">{extraTab.content}</div>}
          {tab === 'overview' && <OverviewTab p={p} />}
          {tab === 'attributes' && <AttributesTab p={p} />}
          {tab === 'development' && <DevelopmentTab p={p} />}
          {tab === 'matches' && <MatchesTab p={p} />}
          {tab === 'stats' && <StatsTab p={p} />}
          {tab === 'career' && <CareerTab p={p} club={club} season={season} />}
          {tab === 'contract' && <ContractTab p={p} squad={squad} today={today} negotiation={negotiation} />}
          {tab === 'wishes' && <WishesTab p={p} />}
          {tab === 'medical' && <MedicalTab p={p} />}
          {tab === 'report' && <ReportTab p={p} squad={squad} />}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, sub, big, title, info }: { label: string; value: string; sub?: string; big?: boolean; title?: string; info?: InfoKey }) {
  return (
    <div className={`pp-fact${big ? ' big' : ''}`} title={title}>
      <div className="pp-fact-lbl">{label}{info && <InfoTip k={info} />}</div>
      <div className="pp-fact-val">{value}</div>
      {sub && <div className="pp-fact-sub">{sub}</div>}
    </div>
  );
}
