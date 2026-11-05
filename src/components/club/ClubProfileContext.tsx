// =============================================================================
// Vereinsprofil überall aufrufbar: GameShell legt den Provider um das laufende
// Spiel; jeder Vereinsname bzw. jedes Wappen wird über <ClubLink id=…> klickbar.
// Das Profil (ClubModal) liegt als oberstes Popup über allen anderen; Auslandsvereine
// (`eu_*`/`w_*`) bekommen ein schlichtes Profil (club/ForeignClubModal.tsx).
// =============================================================================
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { hasClubProfile } from '../../game/clubProfile';
import { Game } from '../../game/state';
import ClubModal from '../ClubModal';
import { nextProfileZ } from '../../ui/stackZ';
import ForeignClubModal, { hasForeignProfile } from './ForeignClubModal';
import { ClubProfileApi, ClubProfileCtx } from './ClubLink';

export { ClubLink, useClubProfile } from './ClubLink';

export function ClubProfileProvider({ g, onChange, children }: { g: Game; onChange: () => void; children: ReactNode }) {
  // Verlauf, damit „Zurück“ zum vorher geöffneten Verein führt; `nonce` setzt
  // Unterfenster (Spielerprofil) zurück, wenn derselbe Verein erneut geöffnet wird.
  const [stack, setStack] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);
  const [z, setZ] = useState(1200);
  const open = useCallback((id: string) => {
    setStack((s) => (s[s.length - 1] === id ? s : [...s, id].slice(-12)));
    setNonce((n) => n + 1);
    setZ(nextProfileZ());
  }, []);
  const api = useMemo<ClubProfileApi>(() => ({ open, canOpen: (id) => hasClubProfile(g, id) || hasForeignProfile(g, id), game: g, onChange }), [open, g, onChange]);
  const current = stack[stack.length - 1];

  // Jedes Wappen (ClubCrest setzt `data-club`) und jedes Element mit `data-club` öffnet per
  // Klick das Vereinsprofil – außer es liegt in einem Element mit eigener Klick-Aktion
  // (Knopf, Link, klickbare Zeile, Ziehfläche) oder schon in einem <ClubLink>.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.defaultPrevented) return;
      const t = e.target as Element | null;
      const el = t?.closest?.('[data-club]');
      const id = el?.getAttribute('data-club');
      if (!el || !id || !api.canOpen(id)) return;
      if (el.closest('.club-link, button, a, [role="button"], [role="tab"], .clickable, [data-dnd], [data-lu-drop], [data-noclub], input, label')) return;
      api.open(id);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [api]);

  return (
    <ClubProfileCtx.Provider value={api}>
      {children}
      {current && hasClubProfile(g, current) && (
        <ClubModal key={current} g={g} clubId={current} nonce={nonce} onChange={onChange}
          onBack={stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : undefined}
          onClose={() => setStack([])} zIndex={z} />
      )}
      {current && !hasClubProfile(g, current) && hasForeignProfile(g, current) && (
        <ForeignClubModal key={current} g={g} clubId={current} zIndex={z} onClose={() => setStack([])} />
      )}
    </ClubProfileCtx.Provider>
  );
}

