// =============================================================================
// ClubModal — Vereinsprofil im Football-Manager-Stil (großes Popup mit Reitern)
//   Kopf (immer sichtbar): Wappen | Name, Stadt, Liga | Platz, Ø Stärke, Ansehen
//   Reiter: Übersicht · Kader · Verein · Historie (in src/components/club/) · Erfolge (views/verein/trophies/)
// Geöffnet wird es überall über <ClubLink> (club/ClubProfileContext.tsx).
// =============================================================================
import { useEffect, useState } from 'react';
import { buildClubProfile } from '../game/clubProfile';
import { Game } from '../game/state';
import { startTalk } from '../game/transferTalks';
import { materializeWorldPlayer } from '../game/worldPool';
import { Kpi } from '../ui/DashPage';
import { vColor } from '../ui/format';
import { TransferTalkModal } from '../views/transfers/TransferTalkModal';
import ClubCrest from './ClubCrest';
import Icon from './Icon';
import PlayerModal from './PlayerModal';
import ClubTab from './club/ClubTab';
import HistoryTab from './club/HistoryTab';
import OverviewTab from './club/OverviewTab';
import SquadTab from './club/SquadTab';
import { HonourStrip } from '../views/verein/honours/HonoursView';
import { TrophyCabinet } from '../views/verein/trophies/TrophyCabinet';

export type ClubTabKey = 'overview' | 'squad' | 'club' | 'history' | 'trophies';
const TABS: [ClubTabKey, string][] = [['overview', 'Übersicht'], ['squad', 'Kader'], ['club', 'Verein'], ['history', 'Historie'], ['trophies', 'Erfolge']];

export default function ClubModal({ g, clubId, nonce, onChange, onClose, onBack, zIndex }: {
  g: Game; clubId: string; nonce: number; onChange: () => void; onClose: () => void; onBack?: () => void; zIndex?: number;
}) {
  const [tab, setTab] = useState<ClubTabKey>('overview');
  const [selPlayer, setSelPlayer] = useState<string | null>(null);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [talkErr, setTalkErr] = useState<string | null>(null);

  // Wird dieser Verein erneut geöffnet (z. B. aus seinem Spielerprofil), Unterfenster schließen.
  useEffect(() => { setSelPlayer(null); setTalkId(null); }, [nonce]);

  // Escape schließt zuerst das oberste Unterfenster.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (talkId) setTalkId(null); else if (selPlayer) setSelPlayer(null); else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, selPlayer, talkId]);

  const d = buildClubProfile(g, clubId);
  // Weltspieler (Kader aus dem Weltpool) sind nur Ansichten – erst die Verhandlung legt sie an.
  const player = selPlayer ? g.players[selPlayer] ?? g.youthPlayers[selPlayer] ?? d.squad.find((p) => p.id === selPlayer) ?? null : null;
  const talk = talkId ? (g.transferTalks ?? []).find((t) => t.id === talkId) : undefined;
  const onTalk = (pid: string) => {
    if (!g.players[pid]) materializeWorldPlayer(g, pid);
    const r = startTalk(g, pid);
    if (typeof r === 'string') { setTalkErr(r); return; }
    setTalkErr(null); setTalkId(r.id); onChange();
  };
  const props = { g, d, openPlayer: setSelPlayer };

  return (
    <div className="modal-overlay cmx-overlay" onClick={onClose} style={zIndex ? { zIndex } : undefined}>
      <div className="modal modal-xl cmx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head cmx-head" style={{ ['--club' as string]: d.colors.primary }}>
          {onBack && <button className="cmx-back" onClick={onBack} title="Zurück zum vorherigen Verein"><Icon name="swap" size={16} /> Zurück</button>}
          <ClubCrest club={d.crestClub} size={84} />
          <div className="cmx-id">
            <div className="mx-sub">{[d.city, d.founded ? `gegründet ${d.founded}` : null, d.divisionLabel].filter(Boolean).join(' · ')}</div>
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

        <div className="mx-body mx-grid cmx-body">
          {tab === 'overview' && <OverviewTab {...props} />}
          {tab === 'squad' && <SquadTab {...props} onTalk={onTalk} talkErr={talkErr} />}
          {tab === 'club' && <ClubTab {...props} />}
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
      {talk && <TransferTalkModal g={g} talk={talk} onClose={() => setTalkId(null)} onChange={onChange} />}
      </div>
    </div>
  );
}
