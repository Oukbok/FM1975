// =============================================================================
// <ClubLink>: macht Vereinsnamen/-wappen klickbar (öffnet das Vereinsprofil).
// Der Provider liegt in ClubProfileContext.tsx (eingebunden in GameShell).
// =============================================================================
import { createContext, useContext, type ReactNode } from 'react';

export interface ClubProfileApi {
  open: (clubId: string) => void;
  canOpen: (clubId: string | null | undefined) => boolean;
  /** Laufendes Spiel (für Anzeigen ohne eigenen Spielstand-Prop, z. B. Spielerwünsche). */
  game?: import('../../game/state').Game;
  /** Spielstand geändert (z. B. Transferliste aus dem Spielerprofil) – Seiten neu zeichnen. */
  onChange?: () => void;
}

export const ClubProfileCtx = createContext<ClubProfileApi | null>(null);

export function useClubProfile(): ClubProfileApi | null {
  return useContext(ClubProfileCtx);
}

/**
 * Klickbarer Vereinsname/-wappen. Ohne Provider (z. B. im Editor) oder ohne
 * Profil (Auslandsverein) bleibt der Inhalt einfacher Text.
 */
export function ClubLink({ id, children, className = '', block = false }: { id: string | null | undefined; children: ReactNode; className?: string; block?: boolean }) {
  const api = useClubProfile();
  if (!api || !id || !api.canOpen(id)) return <>{children}</>;
  const Tag = block ? 'div' : 'span';
  return (
    <Tag className={`club-link ${className}`} role="button" tabIndex={0} title="Vereinsprofil öffnen"
      onClick={(e) => { e.stopPropagation(); api.open(id); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); api.open(id); } }}>
      {children}
    </Tag>
  );
}
