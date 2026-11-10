// =============================================================================
// Rechtsklick-Menü für Spieler (wie später in der Desktop-Fassung).
// Jedes Element mit `data-pid` (Spielerzeilen, Gesichter, PlayerRow …) öffnet
// per Rechtsklick – auf Touch-Geräten per langem Druck – ein Kontextmenü mit
// den passenden Aktionen: Profil, Vertrag, Wünsche, Medizin, Transferliste,
// Verhandlung, Verein. Das Browser-Menü wird dort unterdrückt, sonst nicht.
// Provider in GameShell (innerhalb des ClubProfileProvider).
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PlayerProfileCtx, type PlayerProfileApi } from './PlayerLink';
import { nextProfileZ } from '../../ui/stackZ';
import { createPortal } from 'react-dom';
import PlayerModal, { type Tab } from '../PlayerModal';
import { useClubProfile } from '../club/ClubLink';
import { openContractScreen } from '../../screens/contract/contractOpen';
import { startTalk, talkBlocker } from '../../game/transferTalks';
import { estimateFor } from '../../game/playerPool';
import { activeJob, cancelScouting, queueScouting, queuedJob, scoutSlots, scoutingOf } from '../../game/scoutingGame';
import { PIDSEL_CLEAR } from '../../ui/useMultiSelect';
import { materializeWorldPlayer, worldClubs, worldEntry, WP_FIELD } from '../../game/worldPool';
import { TransferTalkModal } from '../../views/transfers/TransferTalkModal';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import Icon from '../Icon';
import type { IconName } from '../iconPaths';
import PosBadge from '../PosBadge';

interface MenuState { pid: string; x: number; y: number; /** Mehrfachauswahl (ui/useMultiSelect.ts) */ group?: string[] }
interface Item { label: string; icon: IconName; run: () => void; sep?: boolean; danger?: boolean }

const LONG_PRESS_MS = 550;

function playerOf(g: Game, id: string): Player | undefined {
  return g.players[id] ?? g.youthPlayers?.[id];
}

/** Angaben für einen Scouting-Auftrag (voller Spieler oder Weltspieler). */
function scoutArgs(g: Game, id: string): { id: string; name: string; clubName: string; abroad: boolean; youth: boolean } | null {
  const p = playerOf(g, id);
  if (p) {
    if (p.clubId === g.managedClubId) return null;
    return { id, name: p.fullName, clubName: g.clubs[p.clubId]?.name ?? '', abroad: !!p.clubId && !g.clubs[p.clubId], youth: !!p.isYouth || p.age <= 18 };
  }
  const wp = id.startsWith('wp') ? worldEntry(g, id) : undefined;
  if (!wp) return null;
  const wc = worldClubs(g).get(wp[WP_FIELD.club]);
  return { id, name: `${wp[WP_FIELD.first]} ${wp[WP_FIELD.last]}`, clubName: wc?.name ?? '', abroad: wc?.country !== 'Deutschland', youth: !!wp[WP_FIELD.youth] };
}

const known = (g: Game, id: string) => !!playerOf(g, id) || (id.startsWith('wp') && !!worldEntry(g, id));

export function PlayerMenuProvider({ g, onChange, onGoto, children }: {
  g: Game; onChange: () => void; onGoto?: (screen: string) => void; children: ReactNode;
}) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [profile, setProfile] = useState<{ pid: string; tab: Tab; z?: number } | null>(null);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const clubApi = useClubProfile();
  const press = useRef<{ t: number; x: number; y: number } | null>(null);

  const openAt = useCallback((target: EventTarget | null, x: number, y: number): boolean => {
    const el = (target as Element | null)?.closest?.('[data-pid]');
    const pid = el?.getAttribute('data-pid');
    if (!pid || !known(g, pid)) return false;
    setNote(null);
    // Rechtsklick auf eine Zeile der Mehrfachauswahl → Gruppenmenü
    const ids = el?.closest('[data-pidsel]')?.getAttribute('data-pidsel')?.split(',').filter((id) => known(g, id));
    setMenu(ids && ids.length > 1 && ids.includes(pid) ? { pid, x, y, group: ids } : { pid, x, y });
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
  // Weltspieler (game/worldPool.ts): kein volles Profil, nur Scouting/Verhandlung/Verein.
  const wp = menu && !p && menu.pid.startsWith('wp') ? worldEntry(g, menu.pid) : undefined;
  const est = menu && (p || wp) ? estimateFor(g, menu.pid) : null;
  const ovText = est && !est.exact ? `${est.ovLo}–${est.ovHi}` : String(est?.ov ?? p?.overall ?? '');
  const mine = !!p && p.clubId === g.managedClubId;
  const club = p ? g.clubs[p.clubId] : undefined;
  const close = () => setMenu(null);

  const items: Item[] = [];
  const group = menu?.group;
  if (group) {
    const clearSel = () => { window.dispatchEvent(new Event(PIDSEL_CLEAR)); close(); };
    const open = group.filter((id) => !activeJob(g, id) && queuedJob(g, id) < 0 && scoutArgs(g, id));
    const running = group.filter((id) => activeJob(g, id) || queuedJob(g, id) >= 0);
    const free = Math.max(0, scoutSlots(g) - scoutingOf(g).jobs.length);
    items.push({
      label: open.length ? `${open.length} Spieler scouten${free < open.length ? ` (${free} sofort, Rest wartet)` : ''}` : 'Alle werden schon gescoutet',
      icon: 'watchlist',
      run: () => {
        if (!open.length) { setNote('Für alle ausgewählten Spieler ist schon ein Scout unterwegs oder vorgemerkt.'); return; }
        let started = 0, queued = 0, err: string | null = null;
        for (const id of open) {
          const a = scoutArgs(g, id);
          const r = a ? queueScouting(g, a) : 'Spieler nicht gefunden.';
          if (r === 'started') started++; else if (r === 'queued') queued++; else { err = r; break; }
        }
        onChange();
        if (err || queued) {
          const parts = [started && `${started} Scout${started === 1 ? '' : 's'} unterwegs`, queued && `${queued} vorgemerkt (starten, sobald ein Scout frei ist)`].filter(Boolean).join(', ');
          setNote(`${parts || 'Nichts gestartet'}${err ? `. ${err}` : '.'}`);
          return;
        }
        clearSel();
      },
    });
    if (running.length) items.push({
      label: `${running.length} Auftr${running.length === 1 ? 'ag' : 'äge'} abbrechen`, icon: 'close',
      run: () => { for (const id of running) cancelScouting(g, id); onChange(); clearSel(); },
    });
    items.push({ label: 'Auswahl aufheben', icon: 'close', sep: true, run: clearSel });
  } else if (p && menu) {
    const show = (tab: Tab) => () => { setProfile({ pid: p.id, tab, z: nextProfileZ() }); close(); };
    items.push({ label: 'Spielerprofil', icon: 'squad', run: show('overview') });
    items.push({ label: 'Entwicklung', icon: 'training', run: show('development') });
    items.push(mine && !p.isYouth
      ? { label: 'Vertrag verlängern', icon: 'contracts', run: () => { openContractScreen({ kind: 'renew', pid: p.id }); close(); } }
      : { label: 'Vertrag & Marktwert', icon: 'contracts', run: show('contract') });
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
    if (!mine) scoutItem(p.id, p.fullName, g.clubs[p.clubId]?.name ?? '', !!p.clubId && !g.clubs[p.clubId], !!p.isYouth || p.age <= 18);
  } else if (wp && menu) {
    const wc = worldClubs(g).get(wp[WP_FIELD.club]);
    const name = `${wp[WP_FIELD.first]} ${wp[WP_FIELD.last]}`;
    scoutItem(wp[WP_FIELD.id], name, wc?.name ?? '', wc?.country !== 'Deutschland', !!wp[WP_FIELD.youth]);
    items.push({
      label: 'Transferverhandlung', icon: 'negotiations', sep: true,
      run: () => {
        const mp = materializeWorldPlayer(g, wp[WP_FIELD.id]);
        if (!mp) { setNote('Spieler nicht gefunden.'); return; }
        const block = talkBlocker(g, mp);
        const r = block ?? startTalk(g, mp.id);
        if (typeof r === 'string') { setNote(r); return; }
        setTalkId(r.id); onChange(); close();
      },
    });
    if (wc && clubApi?.canOpen(wc.id)) items.push({ label: `Verein: ${wc.name}`, icon: 'shield', run: () => { clubApi.open(wc.id); close(); } });
  }
  function scoutItem(id: string, name: string, clubName: string, abroad: boolean, youth: boolean) {
    const job = activeJob(g, id);
    const waiting = queuedJob(g, id) >= 0;
    items.push({
      label: job ? 'Scout ist unterwegs' : waiting ? 'Scouting vorgemerkt' : 'Scout schicken', icon: 'watchlist', sep: true,
      run: () => {
        if (job || waiting) { setNote(job ? 'Ein Scout beobachtet ihn bereits (Transfers › Scouting).' : 'Er ist vorgemerkt – ein Scout fährt los, sobald einer frei ist.'); return; }
        const r = queueScouting(g, { id, name, clubName, abroad, youth });
        onChange();
        if (r === 'queued') { setNote('Alle Scouts sind unterwegs – vorgemerkt, der nächste freie Scout fährt los.'); return; }
        if (r !== 'started') { setNote(r); return; }
        close();
      },
    });
  }

  // Menü im Bild halten.
  const W = 290, H = 44 + items.length * 38 + (note ? 60 : 0);
  const left = menu ? Math.min(menu.x, window.innerWidth - W - 8) : 0;
  const top = menu ? Math.min(menu.y, window.innerHeight - H - 8) : 0;

  const pp = profile ? playerOf(g, profile.pid) : undefined;
  // Profil-API für <PlayerLink> (jeder Spielername öffnet das Profil)
  const profileApi = useMemo<PlayerProfileApi>(() => ({
    open: (pid, tab = 'general') => { if (playerOf(g, pid)) { setMenu(null); setProfile({ pid, tab, z: nextProfileZ() }); } },
    canOpen: (pid) => !!pid && !!playerOf(g, pid),
  }), [g]);
  const talk = talkId ? (g.transferTalks ?? []).find((t) => t.id === talkId) : undefined;
  const squad = pp ? (g.clubs[pp.clubId]?.playerIds ?? []).map((id) => g.players[id]).filter(Boolean) as Player[] : undefined;

  return (
    <PlayerProfileCtx.Provider value={profileApi}>
      {children}
      {menu && (p || wp || group) && createPortal(
        <div className="pcm-layer" onMouseDown={close} onContextMenu={(e) => { e.preventDefault(); close(); }}>
          <div className="pcm" role="menu" style={{ left, top, width: W }} onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') close(); }}>
            {group ? (
              <div className="pcm-head">
                <span className="pcm-name">{group.length} Spieler ausgewählt</span>
                <span className="pcm-sub">Strg/Umschalt</span>
              </div>
            ) : <div className="pcm-head">
              {p ? <PosBadge p={p} single /> : <PosBadge pos={wp![WP_FIELD.pos]} />}
              <span className="pcm-name">{p ? p.fullName : `${wp![WP_FIELD.first]} ${wp![WP_FIELD.last]}`}</span>
              <span className="pcm-sub">{p ? p.age : Number(g.season.slice(0, 4)) - wp![WP_FIELD.born]} J. · {ovText}</span>
            </div>}
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
          today={g.calendar.currentDate} season={g.season} initialTab={profile!.tab} zIndex={profile!.z} onClose={() => setProfile(null)} />,
        document.body,
      )}
      {talk && <TransferTalkModal g={g} talk={talk} onClose={() => setTalkId(null)} onChange={onChange} />}
    </PlayerProfileCtx.Provider>
  );
}
