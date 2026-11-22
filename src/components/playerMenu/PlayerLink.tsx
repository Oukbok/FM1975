// =============================================================================
// <PlayerLink>: macht Spielernamen klickbar (öffnet das Spielerprofil) – Gegenstück
// zu <ClubLink>. Die Profil-API stellt PlayerMenuProvider (PlayerContextMenu.tsx,
// in GameShell). Weltspieler (`wp…`) öffnen ein Vorschau-Profil wie im Spielerpool.
// Ohne Provider oder ohne Profil (Spieler nicht mehr im Pool, gelöschter Spieler)
// bleibt der Inhalt einfacher Text. `data-pid` → Rechtsklick-Menü.
// Optik: Name unverändert, Zeiger + ruhige Unterstreichung beim Hover (CSS .player-link).
// Führungsspieler (Teambonus) bekommen automatisch das Zeichen hinter dem Namen
// (components/player/LeaderMark.tsx) – `mark={false}` schaltet es ab (Fließtext, Inhalte
// mit Gesicht/Note, wo der Aufrufer das Zeichen selbst setzt).
// =============================================================================
import { createContext, useContext, type ReactNode } from 'react';
import type { Tab } from '../PlayerModal';
import type { TeamBoost } from '../../engine/teamBoost';
import { LeaderName } from '../player/LeaderMark';

export interface PlayerProfileApi {
  open: (pid: string, tab?: Tab) => void;
  canOpen: (pid: string | null | undefined) => boolean;
  /** Teambonus-Stufe eines vollen Spielers (Führungsspieler-Zeichen). */
  boostOf?: (pid: string) => TeamBoost | undefined;
}

export const PlayerProfileCtx = createContext<PlayerProfileApi | null>(null);
export const usePlayerProfile = () => useContext(PlayerProfileCtx);

export function PlayerLink({ id, children, className = '', block = false, mark = true }: {
  id: string | null | undefined; children: ReactNode; className?: string; block?: boolean; mark?: boolean;
}) {
  const api = usePlayerProfile();
  const tier = mark && !block && id ? api?.boostOf?.(id) : undefined;
  if (tier) children = <LeaderName tier={tier}>{children}</LeaderName>;
  if (!api || !id || !api.canOpen(id)) return <>{children}</>;
  const Tag = block ? 'div' : 'span';
  const go = () => api.open(id);
  return (
    <Tag className={`player-link ${className}`} role="button" tabIndex={0} title="Spielerprofil öffnen" data-pid={id}
      onClick={(e) => { e.stopPropagation(); go(); }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); go(); } }}>
      {children}
    </Tag>
  );
}
