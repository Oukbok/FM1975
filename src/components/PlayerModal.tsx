// =============================================================================
// PlayerModal — großes Spielerprofil nach dem Vorbild EA Fussball Manager („Profil 2“)
//   oben links  Nummer + Name, Verein, Wappen mit Gesicht, Steckbrief (player/ProfileHead)
//   oben rechts Positionsfeld, Saisonbilanz, Vertragsstatus (player/ProfileTop)
//   unten links Fähigkeiten – immer sichtbar (player/SkillsPanel)
//   unten rechts Reiter: [Zusatz] · Allgemein · Details · Statistiken · Stationen · Vertrag · Wünsche · Bericht,
//               darunter die Aktionsleiste (player/ActionBar: Bericht, Gespräch, Vertrag, Transferliste …)
//   Knöpfe oben rechts: vorheriger/nächster Spieler im Kader (wenn `squad` übergeben), Schließen.
//   Die Teile liegen in src/components/player/, CSS in styles/28-profile2.css.
// =============================================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Player, Club, Position } from '../types';
import Icon from './Icon';
import ProfileHead from './player/ProfileHead';
import ProfileTop from './player/ProfileTop';
import SkillsPanel from './player/SkillsPanel';
import { bestPositions } from './player/profileData';
import GeneralTab from './player/GeneralTab';
import DetailsTab from './player/DetailsTab';
import StatsTab from './player/StatsTab';
import ContractTab, { Negotiation } from './player/ContractTab';
import ReportTab from './player/ReportTab';
import CareerTab from './player/CareerTab';
import WishesTab from './player/WishesTab';
import ActionBar from './player/ActionBar';

export type Tab = 'extra' | 'general' | 'details' | 'stats' | 'career' | 'contract' | 'wishes' | 'report'
  // frühere Reiter (Aufrufer/alte Links) – werden abgebildet
  | 'overview' | 'attributes' | 'matches' | 'season' | 'development' | 'medical';
const TABS: [Tab, string][] = [
  ['general', 'Allgemein'], ['details', 'Details'], ['stats', 'Statistiken'], ['career', 'Stationen'],
  ['contract', 'Vertrag'], ['wishes', 'Wünsche'], ['report', 'Bericht'],
];
const OLD_TAB: Partial<Record<Tab, Tab>> = {
  overview: 'general', attributes: 'general', matches: 'stats', season: 'stats', development: 'stats', medical: 'details',
};
const mapTab = (t: Tab): Tab => OLD_TAB[t] ?? t;

export default function PlayerModal({ player, club, squad, today, season, onClose, negotiation, initialTab, extraTab, tag }: {
  player: Player; club?: Club; squad?: Player[]; today?: string; season?: string; onClose: () => void;
  /** Zusätzlicher erster Reiter (z. B. Jugend: Hochziehen/Fördervertrag bzw. Talent ansprechen). */
  extraTab?: { label: string; content: ReactNode };
  /** Ersetzt das Etikett „Jugend“ (z. B. „A-Jugend · U19“). */
  tag?: string;
  /** Vertragsverhandlung (nur eigener Verein). */
  negotiation?: Negotiation;
  initialTab?: Tab;
}) {
  const [cur, setCur] = useState<Player>(player);
  useEffect(() => setCur(player), [player]);
  const p = cur;
  const [tab, setTab] = useState<Tab>(mapTab(initialTab ?? 'general'));
  const [, bump] = useState(0);
  const changed = () => bump((n) => n + 1);
  const best = useMemo(() => bestPositions(p), [p]);
  const [sel, setSel] = useState<Position>(best[0]?.pos ?? p.naturalPosition);
  useEffect(() => setSel(bestPositions(p)[0]?.pos ?? p.naturalPosition), [p]);

  // Blättern im Kader – nicht bei Zusatz-Reiter (gehört genau zu diesem Spieler)
  const list = !extraTab && squad ? squad.filter(Boolean) : [];
  const idx = list.findIndex((x) => x.id === p.id);
  const canNav = idx >= 0 && list.length > 1;
  const go = (d: number) => { if (canNav) setCur(list[(idx + d + list.length) % list.length]); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Als Portal in document.body (Jugend, Presse, Bestenlisten) liegt das Fenster außerhalb
  // des DisplayFrame: dann dessen Skalierung nachbilden, damit es genauso aussieht wie im Spiel.
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.closest('.display-content')) return;
    const inner = document.querySelector('.display-inner') as HTMLElement | null;
    const content = document.querySelector('.display-content') as HTMLElement | null;
    if (!inner || !content || !inner.offsetWidth) return;
    const fit = inner.getBoundingClientRect().width / inner.offsetWidth;
    const z = parseFloat(getComputedStyle(content).zoom || '1') || 1;
    if (fit > 0) setZoom(fit * z);
  }, []);

  const tabs = extraTab ? [['extra', extraTab.label] as [Tab, string], ...TABS] : TABS;
  const active = tab === 'extra' && !extraTab ? 'general' : tab;

  return (
    <div className="modal-overlay" onClick={onClose} ref={ref} style={zoom ? { zoom } : undefined}>
      <div className="modal pp-modal pp2" onClick={(e) => e.stopPropagation()} style={{ ['--club' as string]: club?.colors.primary ?? 'var(--border)' }}>
        <div className="pp2-actions">
          {canNav && <>
            <button type="button" className="pp2-round pp2-nav-prev" onClick={() => go(-1)} title={`Vorheriger Spieler: ${list[(idx - 1 + list.length) % list.length].fullName}`}><Icon name="navPrev" size={18} /></button>
            <span className="pp2-navpos">{idx + 1}/{list.length}</span>
            <button type="button" className="pp2-round pp2-nav-next" onClick={() => go(1)} title={`Nächster Spieler: ${list[(idx + 1) % list.length].fullName}`}><Icon name="navNext" size={18} /></button>
          </>}
          <button type="button" className="pp2-round pp2-close" onClick={onClose} title="Schließen"><Icon name="close" size={18} /></button>
        </div>

        <div className="pp2-grid">
          <ProfileHead p={p} club={club} tag={tag} best={best} sel={sel} onSelect={setSel} />
          <ProfileTop p={p} sel={sel} best={best.map((b) => b.pos)} onSelect={setSel} />
          <SkillsPanel p={p} pos={sel} onPos={setSel} />
          <div className="pp2-right">
            <nav className={`tabs pp-tabs pp2-tabs${tabs.length > 8 ? ' many' : ''}`}>
              {tabs.map(([t, l]) => <button key={t} className={`tab ${active === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>)}
            </nav>
            <div className="pp2-tabbody" key={p.id + active}>
              {active === 'extra' && extraTab && <div className="pp-extra">{extraTab.content}</div>}
              {active === 'general' && <GeneralTab p={p} />}
              {active === 'details' && <DetailsTab p={p} onChange={changed} />}
              {active === 'stats' && <StatsTab p={p} />}
              {active === 'career' && <CareerTab p={p} club={club} season={season} />}
              {active === 'contract' && <ContractTab p={p} squad={squad} today={today} negotiation={negotiation} />}
              {active === 'wishes' && <WishesTab p={p} />}
              {active === 'report' && <ReportTab p={p} squad={squad} />}
            </div>
            <ActionBar p={p} onTab={setTab} onChange={changed} />
          </div>
        </div>
      </div>
    </div>
  );
}
