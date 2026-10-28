// =============================================================================
// PlayerModal — großes Spielerprofil mit Reitern (angelehnt an EA Fussball Manager / Football Manager)
//   Kopf (immer sichtbar): Porträt | Identität + Steckbrief | Zustand
//   Reiter: Übersicht · Attribute · Entwicklung · Spiele · Statistik · Karriere · Vertrag & Wert · Medizin · Bericht
//   Die Reiter liegen in src/components/player/.
// =============================================================================
import { useState } from 'react';
import { Player, Club, renderStars } from '../types';
import PlayerAvatar from './PlayerAvatar';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
import { vColor } from '../ui/format';
import { scoutRangeText } from '../engine/scouting';
import { POS_DE, PLAYER_TYPE, MORALE_DE, MORALE_VAL, AVAIL_DE, utcDate, footLabel, frischeOf, Bar } from './player/shared';
import OverviewTab from './player/OverviewTab';
import AttributesTab from './player/AttributesTab';
import DevelopmentTab from './player/DevelopmentTab';
import StatsTab from './player/StatsTab';
import ContractTab, { Negotiation } from './player/ContractTab';
import MedicalTab from './player/MedicalTab';
import ReportTab from './player/ReportTab';
import MatchesTab from './player/MatchesTab';
import CareerTab from './player/CareerTab';

export type Tab = 'overview' | 'attributes' | 'development' | 'matches' | 'stats' | 'career' | 'contract' | 'medical' | 'report';
const TABS: [Tab, string][] = [
  ['overview', 'Übersicht'], ['attributes', 'Attribute'], ['development', 'Entwicklung'], ['matches', 'Spiele'],
  ['stats', 'Statistik'], ['career', 'Karriere'], ['contract', 'Vertrag & Wert'], ['medical', 'Medizin'], ['report', 'Bericht'],
];

export default function PlayerModal({ player, club, squad, today, season, onClose, negotiation, initialTab }: {
  player: Player; club?: Club; squad?: Player[]; today?: string; season?: string; onClose: () => void;
  /** Vertragsverhandlung (nur eigener Verein). */
  negotiation?: Negotiation;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'overview');
  const p = player;
  const availText = p.availability === 'injured' ? `Verletzt (${p.injury?.daysRemaining ?? '?'} Tage)` : AVAIL_DE[p.availability];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pp-header" style={{ background: `linear-gradient(120deg, ${club?.colors.primary ?? '#1a2331'}40, transparent 60%)` }}>
          <div className="pp-portrait">
            <PlayerAvatar player={p} club={club} size={210} />
            {club && <div className="pp-portrait-crest"><ClubCrest club={club} size={44} /></div>}
          </div>

          <div className="pp-id">
            <div className="pp-club">{club?.name ?? 'Vereinslos'}</div>
            <div className="pp-name-row">
              <span className="pp-no">#{p.shirtNumber}</span>
              <h2 className="pp-name">{p.fullName}</h2>
            </div>
            <div className="pp-sub">{POS_DE[p.naturalPosition] ?? p.naturalPosition} · {PLAYER_TYPE[p.naturalPosition] ?? '—'}</div>
            <div className="pp-badges">
              <span className="pill" style={{ color: vColor(p.overall) }}>Stärke <b>{p.overall}</b></span>
              <span className="pill" title="Einschätzung der Scouts – kann danebenliegen">Potenzial <b>{scoutRangeText(p)}</b></span>
              <span className="pill" style={{ color: p.availability === 'available' ? 'var(--green)' : 'var(--red)' }}>{availText}</span>
              {p.transferListed && <span className="pill" style={{ color: 'var(--orange)' }}>Transferliste</span>}
              {p.isYouth && <span className="pill" style={{ color: 'var(--accent)' }}>Jugend</span>}
            </div>
            <div className="pp-facts">
              <Fact label="Alter" value={`${p.age} Jahre`} sub={utcDate(p.dateOfBirth)} />
              <Fact label="Nationalität" value={p.nationality} />
              <Fact label="Größe" value={`${p.height} cm`} />
              <Fact label="Gewicht" value={`${p.weight} kg`} />
              <Fact label="Fuß" value={footLabel(p)} />
            </div>
          </div>

          <div className="pp-cond">
            <div className="pp-section-title"><Icon name="fans" size={15} />Zustand</div>
            <Bar label="Frische" value={frischeOf(p)} />
            <Bar label="Fitness" value={Math.round(p.attributes.fitness)} />
            <Bar label="Form" value={Math.round(p.form)} />
            <Bar label={`Moral · ${MORALE_DE[p.morale]}`} value={MORALE_VAL[p.morale]} />
            <Bar label="Konstanz" value={Math.round(p.development.consistency)} />
            <Bar label="Nervenstärke" value={Math.round(p.development.bigMatchTemperament)} />
          </div>

          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <nav className="tabs pp-tabs">
          {TABS.map(([t, l]) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>)}
        </nav>

        <div className="pp-body">
          {tab === 'overview' && <OverviewTab p={p} />}
          {tab === 'attributes' && <AttributesTab p={p} />}
          {tab === 'development' && <DevelopmentTab p={p} />}
          {tab === 'matches' && <MatchesTab p={p} />}
          {tab === 'stats' && <StatsTab p={p} />}
          {tab === 'career' && <CareerTab p={p} club={club} season={season} />}
          {tab === 'contract' && <ContractTab p={p} squad={squad} today={today} negotiation={negotiation} />}
          {tab === 'medical' && <MedicalTab p={p} />}
          {tab === 'report' && <ReportTab p={p} squad={squad} />}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="pp-fact">
      <div className="pp-fact-lbl">{label}</div>
      <div className="pp-fact-val">{value}</div>
      {sub && <div className="pp-fact-sub">{sub}</div>}
    </div>
  );
}
