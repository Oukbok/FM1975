// =============================================================================
// ClubModal — Vereinsprofil im Football-Manager-Stil (großes Popup mit Reitern)
//   Kopf (immer sichtbar): Wappen | Name, Stadt, Liga | Platz, Ø Stärke, Ansehen
//   Reiter: Übersicht · Kader · Jugend · Verein · Transfers · Historie (in src/components/club/) · Erfolge (views/club/trophies/)
// Geöffnet wird es überall über <ClubLink> (club/ClubProfileContext.tsx).
// =============================================================================
import { isDdrClub } from '../game/ddrHome';
import { CountryFlag } from './competition/CountryFlag';
import { useEffect, useState } from 'react';
import { buildClubProfile } from '../game/clubProfile';
import { Game, homeCountryKey } from '../game/state';
import { startTalk } from '../game/transferTalks';
import { materializeWorldPlayer } from '../game/worldPool';
import { Kpi } from '../ui/DashPage';
import { vColor } from '../ui/format';
import { openContractScreen } from '../screens/contract/contractOpen';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
import PlayerModal from './PlayerModal';
import ClubTab from './club/ClubTab';
import TransfersTab from './club/TransfersTab';
import HistoryTab from './club/HistoryTab';
import OverviewTab from './club/OverviewTab';
import SquadTab from './club/SquadTab';
import YouthTab from './club/YouthTab';
import { HonourStrip } from '../views/club/honours/HonoursView';
import { TrophyCabinet } from '../views/club/trophies/TrophyCabinet';

export type ClubTabKey = 'overview' | 'squad' | 'youth' | 'club' | 'transfers' | 'history' | 'trophies';
const TABS: [ClubTabKey, string][] = [['overview', 'Übersicht'], ['squad', 'Kader'], ['youth', 'Jugend'], ['club', 'Verein'], ['transfers', 'Transfers'], ['history', 'Historie'], ['trophies', 'Erfolge']];

export default function ClubModal({ g, clubId, nonce, onChange, onClose, onBack, zIndex }: {
  g: Game; clubId: string; nonce: number; onChange: () => void; onClose: () => void; onBack?: () => void; zIndex?: number;
}) {
  const [tab, setTab] = useState<ClubTabKey>('overview');
  const [selPlayer, setSelPlayer] = useState<string | null>(null);
  const [talkErr, setTalkErr] = useState<string | null>(null);

  // Wird dieser Verein erneut geöffnet (z. B. aus seinem Spielerprofil), Unterfenster schließen.
  useEffect(() => { setSelPlayer(null); }, [nonce]);

  // Escape schließt zuerst das oberste Unterfenster.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selPlayer) setSelPlayer(null); else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, selPlayer]);

  const d = buildClubProfile(g, clubId);
  // Weltspieler (Kader aus dem Weltpool) sind nur Ansichten – erst die Verhandlung legt sie an.
  const player = selPlayer ? g.players[selPlayer] ?? g.youthPlayers[selPlayer] ?? d.squad.find((p) => p.id === selPlayer) ?? null : null;
  const onTalk = (pid: string) => {
    if (!g.players[pid]) materializeWorldPlayer(g, pid);
    const r = startTalk(g, pid);
    if (typeof r === 'string') { setTalkErr(r); return; }
    setTalkErr(null); onChange(); openContractScreen({ kind: 'transfer', talkId: r.id });
  };
  const props = { g, d, openPlayer: setSelPlayer };
  // Landesflagge im Kopf (Klick öffnet das Länderprofil): Ausland aus dem Profil, DDR-Vereine bis zur Einheit, sonst Heimatland.
  const flagKey = d.foreign?.countryKey ?? (isDdrClub(g, clubId) && g.calendar.currentDate < '1990-10-03' ? 'DDR' : homeCountryKey(g));

  return (
    <div className="modal-overlay cmx-overlay" onClick={onClose} style={zIndex ? { zIndex } : undefined}>
      <div className="modal modal-xl cmx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head cmx-head" style={{ ['--club' as string]: d.colors.primary }}>
          {onBack && <button className="cmx-back" onClick={onBack} title="Zurück zum vorherigen Verein"><Icon name="swap" size={16} /> Zurück</button>}
          <ClubCrest club={d.crestClub} size={84} />
          <div className="cmx-id">
            <div className="mx-sub cmx-land"><CountryFlag country={flagKey} height={14} />{[d.city, d.founded ? `gegründet ${d.founded}` : null, d.divisionLabel].filter(Boolean).join(' · ')}</div>
            <h2>{d.name}{d.isPlayerClub && <span className="cmx-mine">dein Verein</span>}</h2>
            <HonourStrip g={g} clubId={clubId} />
          </div>
          <div className="mx-kpis">
            <Kpi value={d.tablePosition != null ? `${d.tablePosition}.` : '–'} label="Platz" />
            <Kpi value={d.strength} label="Ø Stärke" color={vColor(d.strength)} />
            <Kpi value={d.reputation ?? '–'} label="Ansehen" />
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <nav className="tabs pp-tabs cmx-tabs">
          {TABS.map(([t, l]) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>)}
        </nav>

        <div className={`mx-body mx-grid cmx-body ${tab === 'transfers' ? 'cmx-trgrid' : ''}`}>
          {tab === 'overview' && <OverviewTab {...props} />}
          {tab === 'squad' && <SquadTab {...props} onTalk={onTalk} talkErr={talkErr} />}
          {tab === 'youth' && <YouthTab {...props} onChange={onChange} />}
          {tab === 'club' && <ClubTab {...props} />}
          {tab === 'transfers' && <TransfersTab {...props} />}
          {tab === 'history' && <HistoryTab {...props} />}
          {tab === 'trophies' && <TrophyCabinet g={g} clubId={clubId} className="tro-cab-modal" />}
        </div>
      </div>

      {/* Unterfenster: Klicks nicht zum Vereins-Overlay durchreichen (würde alles schließen). */}
      <div onClick={(e) => e.stopPropagation()}>
      {player && (
        <PlayerModal player={player} club={g.clubs[player.clubId]} squad={d.squad}
          today={g.calendar.currentDate} season={g.season} onClose={() => setSelPlayer(null)} />
      )}
      </div>
    </div>
  );
}
