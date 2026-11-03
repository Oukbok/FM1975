// =============================================================================
// Rechtsklick-Menü für Spieler (wie später in der Desktop-Fassung).
// Jedes Element mit `data-pid` (Spielerzeilen, Gesichter, PlayerRow …) öffnet
// per Rechtsklick – auf Touch-Geräten per langem Druck – ein Kontextmenü mit
// den passenden Aktionen: Profil, Vertrag, Wünsche, Medizin, Transferliste,
// Verhandlung, Verein. Das Browser-Menü wird dort unterdrückt, sonst nicht.
// Provider in GameShell (innerhalb des ClubProfileProvider).
// =============================================================================
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal, { type Tab } from '../PlayerModal';
import { useClubProfile } from '../club/ClubLink';
import { startTalk } from '../../game/transferTalks';
import { TransferTalkModal } from '../../views/transfers/TransferTalkModal';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import Icon from '../Icon';
import type { IconName } from '../iconPaths';

interface MenuState { pid: string; x: number; y: number }
interface Item { label: string; icon: IconName; run: () => void; sep?: boolean; danger?: boolean }

const LONG_PRESS_MS = 550;

function playerOf(g: Game, id: string): Player | undefined {
  return g.players[id] ?? g.youthPlayers?.[id];
}

export function PlayerMenuProvider({ g, onChange, onGoto, children }: {
  g: Game; onChange: () => void; onGoto?: (screen: string) => void; children: ReactNode;
}) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [profile, setProfile] = useState<{ pid: string; tab: Tab } | null>(null);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const clubApi = useClubProfile();
  const press = useRef<{ t: number; x: number; y: number } | null>(null);

  const openAt = useCallback((target: EventTarget | null, x: number, y: number): boolean => {
    const el = (target as Element | null)?.closest?.('[data-pid]');
    const pid = el?.getAttribute('data-pid');
    if (!pid || !playerOf(g, pid)) return false;
    setNote(null);
    setMenu({ pid, x, y });
    return true;
  }, [g]);

  useEffect(() => {
    const onCtx = (e: MouseEvent) => { if (openAt(e.target, e.clientX, e.clientY)) e.preventDefault(); };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      const { clientX: x, clientY: y, target } = e;
      const t = window.setTimeout(() => { if (openAt(target, x, y)) navigator.vibrate?.(10); }, LONG_PRESS_MS);
      press.current = { t, x, y };
    };
    const cancel = (e: PointerEvent) => {
      const p = press.current; if (!p) return;
      if (e.type === 'pointermove' && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 10) return;
      clearTimeout(p.t); press.current = null;
    };
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', cancel);
    document.addEventListener('pointercancel', cancel);
    document.addEventListener('pointermove', cancel);
    return () => {
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', cancel);
      document.removeEventListener('pointercancel', cancel);
      document.removeEventListener('pointermove', cancel);
    };
  }, [openAt]);

  const p = menu ? playerOf(g, menu.pid) : undefined;
  const mine = !!p && p.clubId === g.managedClubId;
  const club = p ? g.clubs[p.clubId] : undefined;
  const close = () => setMenu(null);

  const items: Item[] = [];
  if (p && menu) {
    const show = (tab: Tab) => () => { setProfile({ pid: p.id, tab }); close(); };
    items.push({ label: 'Spielerprofil', icon: 'squad', run: show('overview') });
    items.push({ label: 'Entwicklung', icon: 'training', run: show('development') });
    items.push({ label: mine ? 'Vertrag verlängern' : 'Vertrag & Marktwert', icon: 'contracts', run: show('contract') });
    items.push({ label: 'Wünsche', icon: 'watchlist', run: show('wishes') });
    items.push({ label: 'Medizin', icon: 'facilities', run: show('medical') });
    if (mine && !p.isYouth) {
      items.push({
        label: p.transferListed ? 'Von der Transferliste nehmen' : 'Auf die Transferliste setzen', icon: 'transfers', sep: true,
        run: () => { p.transferListed = !p.transferListed; onChange(); close(); },
      });
      if (onGoto) items.push({ label: 'Zur Aufstellung', icon: 'lineup', run: () => { onGoto('lineup'); close(); } });
    }
    if (!mine && !p.isYouth && club) {
      items.push({
        label: 'Transferverhandlung', icon: 'negotiations', sep: true,
        run: () => {
          const r = startTalk(g, p.id);
          if (typeof r === 'string') { setNote(r); return; }
          setTalkId(r.id); onChange(); close();
        },
      });
    }
    if (club && clubApi?.canOpen(club.id)) items.push({ label: `Verein: ${club.name}`, icon: 'shield', sep: mine, run: () => { clubApi.open(club.id); close(); } });
  }

  // Menü im Bild halten.
  const W = 290, H = 44 + items.length * 38 + (note ? 60 : 0);
  const left = menu ? Math.min(menu.x, window.innerWidth - W - 8) : 0;
  const top = menu ? Math.min(menu.y, window.innerHeight - H - 8) : 0;

  const pp = profile ? playerOf(g, profile.pid) : undefined;
  const talk = talkId ? (g.transferTalks ?? []).find((t) => t.id === talkId) : undefined;
  const squad = pp ? (g.clubs[pp.clubId]?.playerIds ?? []).map((id) => g.players[id]).filter(Boolean) as Player[] : undefined;

  return (
    <>
      {children}
      {menu && p && createPortal(
        <div className="pcm-layer" onMouseDown={close} onContextMenu={(e) => { e.preventDefault(); close(); }}>
          <div className="pcm" role="menu" style={{ left, top, width: W }} onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') close(); }}>
            <div className="pcm-head">
              <span className="pos-badge">{p.naturalPosition}</span>
              <span className="pcm-name">{p.fullName}</span>
              <span className="pcm-sub">{p.age} J. · {p.overall}</span>
            </div>
            {items.map((it, i) => (
              <button key={it.label} type="button" role="menuitem" autoFocus={i === 0}
                className={`pcm-item ${it.sep ? 'sep' : ''}`} onClick={it.run}>
                <Icon name={it.icon} size={16} /> <span>{it.label}</span>
              </button>
            ))}
            {note && <div className="pcm-note">{note}</div>}
          </div>
        </div>,
        document.body,
      )}
      {pp && createPortal(
        <PlayerModal key={`${pp.id}-${profile!.tab}`} player={pp} club={g.clubs[pp.clubId]} squad={squad}
          today={g.calendar.currentDate} season={g.season} initialTab={profile!.tab} onClose={() => setProfile(null)} />,
        document.body,
      )}
      {talk && <TransferTalkModal g={g} talk={talk} onClose={() => setTalkId(null)} onChange={onChange} />}
    </>
  );
}
