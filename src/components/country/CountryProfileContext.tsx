// =============================================================================
// Länderprofil überall aufrufbar (Wunsch Pascal: Klick auf eine Flagge öffnet eine
// Übersicht des Landes). GameShell legt den Provider um das laufende Spiel; jede
// Flagge (<CountryFlag> setzt `data-country`) öffnet per Klick das Profil – außer sie
// liegt in einem Knopf, Link oder einer klickbaren Zeile (eigene Aktion). Das Fenster
// (CountryModal) wird nachgeladen (shell/lazyParts.ts) und stapelt wie Vereins- und
// Spielerprofil über ui/stackZ.ts.
// =============================================================================
import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { COUNTRY_INFO } from '../../data/countryFlags';
import type { Game } from '../../game/state';
import { nextProfileZ } from '../../ui/stackZ';
import { CountryModal } from '../../shell/lazyParts';

export interface CountryProfileApi {
  open: (key: string) => void;
  canOpen: (key: string | null | undefined) => boolean;
}

export const CountryProfileCtx = createContext<CountryProfileApi | null>(null);
export const useCountryProfile = () => useContext(CountryProfileCtx);

/** Elemente mit eigener Klick-Aktion: dort öffnet eine Flagge kein Profil. */
const OWN_ACTION = '.club-link, .player-link, button, a, [role="button"], [role="tab"], [role="option"], .clickable, [data-dnd], [data-lu-drop], [data-nocountry], input, label, .sel3-pop';

export function CountryProfileProvider({ g, onChange, onGoto, children }: {
  g: Game; onChange: () => void; onGoto?: (screen: string) => void; children: ReactNode;
}) {
  const [stack, setStack] = useState<string[]>([]);
  const [z, setZ] = useState(1200);
  const open = useCallback((key: string) => {
    setStack((s) => (s[s.length - 1] === key ? s : [...s, key].slice(-12)));
    setZ(nextProfileZ());
  }, []);
  const api = useMemo<CountryProfileApi>(() => ({ open, canOpen: (k) => !!k && !!COUNTRY_INFO[k] }), [open]);
  const current = stack[stack.length - 1];

  useEffect(() => {
    // Zeiger über Flaggen nur, solange ein Profil geöffnet werden kann (nicht im Assistenten/Editor).
    document.documentElement.classList.add('cflag-live');
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.defaultPrevented) return;
      const el = (e.target as Element | null)?.closest?.('[data-country]');
      const key = el?.getAttribute('data-country');
      if (!el || !key || !api.canOpen(key) || el.closest(OWN_ACTION)) return;
      api.open(key);
    };
    // Einfangphase: Fenster halten Klicks mit stopPropagation zurück (Overlay schließt sonst) –
    // Flaggen darin sollen trotzdem öffnen.
    document.addEventListener('click', onClick, true);
    return () => { document.removeEventListener('click', onClick, true); document.documentElement.classList.remove('cflag-live'); };
  }, [api]);

  return (
    <CountryProfileCtx.Provider value={api}>
      {children}
      {current && (
        <Suspense fallback={null}>
          <CountryModal key={current} g={g} countryKey={current} zIndex={z} onChange={onChange}
            onGoto={onGoto ? (s: string) => { setStack([]); onGoto(s); } : undefined}
            onBack={stack.length > 1 ? () => setStack((s) => s.slice(0, -1)) : undefined}
            onClose={() => setStack([])} />
        </Suspense>
      )}
    </CountryProfileCtx.Provider>
  );
}
