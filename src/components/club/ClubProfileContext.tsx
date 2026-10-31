// =============================================================================
// Vereinsprofil überall aufrufbar: GameShell legt den Provider um das laufende
// Spiel; jeder Vereinsname bzw. jedes Wappen wird über <ClubLink id=…> klickbar.
// Das Profil (ClubModal) liegt als oberstes Popup über allen anderen.
// =============================================================================
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { hasClubProfile } from '../../game/clubProfile';
import { Game } from '../../game/state';
import ClubModal from '../ClubModal';
import { ClubProfileApi, ClubProfileCtx } from './ClubLink';

export { ClubLink, useClubProfile } from './ClubLink';

export function ClubProfileProvider({ g, onChange, children }: { g: Game; onChange: () => void; children: ReactNode }) {
  // Verlauf, damit „Zurück“ zum vorher geöffneten Verein führt; `nonce` setzt
  // Unterfenster (Spielerprofil) zurück, wenn derselbe Verein erneut geöffnet wird.
  const [stack, setStack] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);
  const open = useCallback((id: string) => {
    setStack((s) => (s[s.length - 1] === id ? s : [...s, id].slice(-12)));
    setNonce((n) => n + 1);
  }, []);
  const api = useMemo<ClubProfileApi>(() => ({ open, canOpen: (id) => hasClubProfile(g, id) }), [open, g]);
  const current = stack[stack.length - 1];

  return (
    <ClubProfileCtx.Provider value={api}>
      {children}
      {current && hasClubProfile(g, current) && (
        <ClubModal key={current} g={g} clubId={current} nonce={nonce} onChange={onChange}
          onBack={stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : undefined}
          onClose={() => setStack([])} />
      )}
    </ClubProfileCtx.Provider>
  );
}

