// =============================================================================
// CountryModal — Länderprofil (Wunsch Pascal: Klick auf eine Flagge öffnet eine Übersicht
// des Landes) im Aufbau des Vereinsprofils (components/ClubModal.tsx): Kopf mit Flagge,
// Name, Kontinent und Kennzahlen, darunter Reiter, feste Fenstergröße.
//   Übersicht · Länderspiele · Nationalkader · Ligen · Ligensystem
// Geöffnet von überall über die Flaggen (CountryProfileContext.tsx), nachgeladen über
// shell/lazyParts.ts. Daten: game/countryProfile.ts.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { countryAlive, countryFacts, countryRef, countryRep, nationInfo } from '../../game/countryProfile';
import { pyramidFromGame } from '../../game/leaguePyramid';
import type { Game } from '../../game/state';
import { Kpi } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { CountryFlag } from '../competition/CountryFlag';
import Icon from '../Icon';
import LeaguesTab from './LeaguesTab';
import MatchesTab from './MatchesTab';
import OverviewTab from './OverviewTab';
import SquadTab from './SquadTab';
import SystemTab from './SystemTab';

export type CountryTabKey = 'overview' | 'matches' | 'squad' | 'leagues' | 'system';
const TABS: [CountryTabKey, string][] = [['overview', 'Übersicht'], ['matches', 'Länderspiele'], ['squad', 'Nationalkader'], ['leagues', 'Ligen'], ['system', 'Ligensystem']];

export function CountryModal({ g, countryKey, zIndex, onClose, onBack, onGoto }: {
  g: Game; countryKey: string; zIndex?: number; onChange?: () => void; onClose: () => void; onBack?: () => void; onGoto?: (screen: string) => void;
}) {
  const [tab, setTab] = useState<CountryTabKey>('overview');
  const root = useRef<HTMLDivElement>(null);
  const today = g.calendar.currentDate;
  const c = useMemo(() => countryRef(g, countryKey), [g, countryKey, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const pyramid = useMemo(() => pyramidFromGame(g), [g, g.season, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const facts = countryFacts(g, c);
  const rep = countryRep(g, c);
  const nat = nationInfo(g, c);

  // Escape schließt nur, wenn kein anderes Profil darüber liegt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const mine = Number(root.current?.style.zIndex || 0);
      const above = [...document.querySelectorAll<HTMLElement>('.modal-overlay')].some((el) => el !== root.current && Number(getComputedStyle(el).zIndex || 0) > mine);
      if (!above) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sub = [facts.conf, countryAlive(g, c) ? facts.exists : `${facts.exists} (heute nicht mehr)`,
    c.kind === 'home' ? 'dein Heimatland' : c.kind === 'ddr' ? 'mit vollen Daten' : null].filter(Boolean).join(' · ');
  const props = { g, c, pyramid, onGoto };

  return (
    <div ref={root} className="modal-overlay cmx-overlay cnx-overlay" onClick={onClose} style={zIndex ? { zIndex } : undefined}>
      <div className="modal modal-xl cmx-modal cnx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head cmx-head cnx-head">
          {onBack && <button className="cmx-back" onClick={onBack} title="Zurück zum vorherigen Land"><Icon name="swap" size={16} /> Zurück</button>}
          <span className="cnx-flag"><CountryFlag country={c.key} height={56} noLink /></span>
          <div className="cmx-id">
            <div className="mx-sub">{sub}</div>
            <h2>{c.name}{c.kind === 'home' && <span className="cmx-mine">Heimatland</span>}</h2>
            <div className="cnx-sub2">{facts.ligen}</div>
          </div>
          <div className="mx-kpis">
            <Kpi value={rep ? rep.rep.toFixed(0) : '–'} label="Ligaruf" info="ligaruf" />
            <Kpi value={rep?.rank ? `${rep.rank}.` : '–'} label="Fünfjahreswertung" />
            <Kpi value={nat?.strength != null ? Math.round(nat.strength) : '–'} label="Nationalteam" color={nat?.strength != null ? vColor(nat.strength) : undefined} />
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <nav className="tabs pp-tabs cmx-tabs">
          {TABS.map(([t, l]) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>)}
        </nav>

        <div className="mx-body mx-grid cmx-body cnx-body">
          {tab === 'overview' && <OverviewTab {...props} />}
          {tab === 'matches' && <MatchesTab {...props} />}
          {tab === 'squad' && <SquadTab {...props} />}
          {tab === 'leagues' && <LeaguesTab {...props} />}
          {tab === 'system' && <SystemTab {...props} />}
        </div>
      </div>
    </div>
  );
}
