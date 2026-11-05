// =============================================================================
// <PlayerLink>: macht Spielernamen klickbar (öffnet das Spielerprofil) – Gegenstück
// zu <ClubLink>. Die Profil-API stellt PlayerMenuProvider (PlayerContextMenu.tsx,
// in GameShell). Ohne Provider oder ohne Profil (Auslandsstar ohne Spielerdaten,
// gelöschter Spieler) bleibt der Inhalt einfacher Text. `data-pid` → Rechtsklick-Menü.
// Optik: Name unverändert, Zeiger + ruhige Unterstreichung beim Hover (CSS .player-link).
// =============================================================================
import { createContext, useContext, type ReactNode } from 'react';
import type { Tab } from '../PlayerModal';

export interface PlayerProfileApi {
  open: (pid: string, tab?: Tab) => void;
  canOpen: (pid: string | null | undefined) => boolean;
}

export const PlayerProfileCtx = createContext<PlayerProfileApi | null>(null);
export const usePlayerProfile = () => useContext(PlayerProfileCtx);

export function PlayerLink({ id, children, className = '', block = false }: {
  id: string | null | undefined; children: ReactNode; className?: string; block?: boolean;
}) {
  const api = usePlayerProfile();
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
