// =============================================================================
// Verein › Erfolge: Reiter „Vereinspokale“ (Vitrine, trophies/TrophyCabinet.tsx)
// und „Ruhmeshalle“ (Spieler-Archiv, statistiken/HallOfFameView.tsx).
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../game/state';
import { HallOfFameView } from '../statistiken/HallOfFameView';
import { TrophyCabinet } from './trophies/TrophyCabinet';

type Tab = 'pokale' | 'ruhm';
let lastTab: Tab = 'pokale';

export function ErfolgeView({ g }: { g: Game }) {
  const [tab, setTabState] = useState<Tab>(lastTab);
  const setTab = (t: Tab) => { lastTab = t; setTabState(t); };
  return (
    <div className="tro-page">
      <nav className="tabs tro-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'ruhm'} className={`tab ${tab === 'ruhm' ? 'active' : ''}`} onClick={() => setTab('ruhm')}>Ruhmeshalle</button>
        <button role="tab" aria-selected={tab === 'pokale'} className={`tab ${tab === 'pokale' ? 'active' : ''}`} onClick={() => setTab('pokale')}>Vereinspokale</button>
      </nav>
      {tab === 'pokale' ? <TrophyCabinet g={g} clubId={g.managedClubId} className="tro-cab-page" /> : <HallOfFameView g={g} />}
    </div>
  );
}
