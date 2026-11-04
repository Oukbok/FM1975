// Kopfleiste des laufenden Spiels: Logo, Hauptnavigation, Kontostand, Zahnrad-Menü und
// der Weiter-Knopf (feste Breite in allen Zuständen, CSS 18-header.css).
import { useEffect, useRef, useState } from 'react';
import ClubCrest from '../components/ClubCrest';
import Icon from '../components/Icon';
import type { OwnMatchInfo } from '../game/ownMatch';
import type { Game } from '../game/state';
import { fmtDMfull } from '../ui/format';
import { MENU_STRUCTURE, Screen } from './navigation';
import type { AppSettings } from '../engine/save';
import ThemePicker from '../ui/ThemePicker';

export interface HeaderMenu {
  settings: () => void; wiki: () => void; editor: () => void;
  save: () => void; load: () => void; exit: () => void;
}

export function HeaderBar({ g, settings, onSettings, screen, setScreen, saveMsg, menu, running, seasonOver, due, prematchOn, mustRead,
  onOpenPrematch, onQuickSim, onStartText, onReadMail, onContinue }: {
  g: Game; settings: AppSettings; onSettings: (s: AppSettings) => void; screen: Screen; setScreen: (s: Screen) => void; saveMsg: string; menu: HeaderMenu;
  running: boolean; seasonOver: boolean; due: OwnMatchInfo | null; prematchOn: boolean; mustRead: boolean;
  onOpenPrematch: () => void; onQuickSim: () => void; onStartText: () => void; onReadMail: () => void; onContinue: () => void;
}) {
  const myClub = g.clubs[g.managedClubId];
  // Das Zahnrad-Menü öffnet/schließt NUR per Klick (kein Hover); Klick außerhalb schließt es.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);
  useEffect(() => { if (running) setMenuOpen(false); }, [running]);
  const pick = (fn: () => void) => () => { setMenuOpen(false); fn(); };
  // Aktive Hauptkategorie für die Navigation.
  const navMatched = MENU_STRUCTURE.find((c) => c.dash === screen || c.subs.some((s) => s.screen === screen));
  const hdrBtnLabel = seasonOver ? 'Neue Saison' : running ? 'Pause' : 'Weiter';

  return (
    <header className={`hd-bar ${screen === 'dashboard' ? 'hd-bar--zentrale' : ''}`}>
      <div className="hd-logo">
        <span className="hd-logo-year">1975</span>
        <span className="hd-logo-div" aria-hidden="true" />
        <span className="hd-logo-title"><span>A Football</span><span>Manager</span></span>
      </div>

      <nav className="hd-nav">
        {MENU_STRUCTURE.map((cat) => (
          <button key={cat.key} className={`hd-nav-item ${navMatched && cat.key === navMatched.key ? 'active' : ''}`} onClick={() => setScreen(cat.dash)}>
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Rechter Block: Verein, Kontostand, Einstellungen, Weiter */}
      <div className="hd-right">
        {saveMsg && <span className="save-toast">{saveMsg}</span>}
        <div className="hd-club" title={myClub.name}>
          <ClubCrest club={myClub} size={60} />
          <span className="hd-club-name">{myClub.name}</span>
        </div>
        <span className="hd-sep" aria-hidden="true" />
        <div className="hd-balance">
          <span className="hd-balance-ico"><Icon name="finances" /></span>
          <span className="hd-balance-lbl">Kontostand:</span>
          <span className={`hd-balance-val ${myClub.finances.balance < 0 ? 'neg' : 'pos'}`}>{fmtDMfull(myClub.finances.balance)}</span>
        </div>
        <span className="hd-sep" aria-hidden="true" />
        <ThemePicker settings={settings} onSettings={onSettings} width={64} />
        <div className="hdr-menu" ref={menuRef}>
          <button className="hd-gear" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} title="Menü & Einstellungen">
            <Icon name="settings" />
          </button>
          {menuOpen && (
            <div className="menu-dropdown" role="menu">
              <button className="menu-dd-item" role="menuitem" onClick={pick(menu.settings)}><Icon name="settings" /> <span>Einstellungen</span></button>
              <button className="menu-dd-item" role="menuitem" onClick={pick(menu.wiki)}><Icon name="wiki" /> <span>Wiki / Spielhilfe</span></button>
              <button className="menu-dd-item" role="menuitem" onClick={pick(menu.editor)}><Icon name="dashVerein" /> <span>Editor</span></button>
              <div className="menu-dd-sep" />
              <button className="menu-dd-item" role="menuitem" onClick={pick(menu.save)}><Icon name="save" /> <span>Speichern</span></button>
              <button className="menu-dd-item" role="menuitem" onClick={pick(menu.load)}><Icon name="loadGame" /> <span>Laden</span></button>
              <div className="menu-dd-sep" />
              <button className="menu-dd-item" role="menuitem" onClick={pick(() => { if (confirm('Zurück zum Hauptmenü? Nicht gespeicherter Fortschritt geht verloren.')) menu.exit(); })}>
                <Icon name="mainmenu" /> <span>Hauptmenü</span>
              </button>
              <button className="menu-dd-item danger" role="menuitem" onClick={pick(() => { if (confirm('Spiel wirklich beenden? Nicht gespeicherter Fortschritt geht verloren.')) menu.exit(); })}>
                <Icon name="quit" /> <span>Spiel beenden</span>
              </button>
            </div>
          )}
        </div>
        <span className="hd-sep" aria-hidden="true" />
        {due && prematchOn ? (
          <button className="hd-continue pm-next" onClick={onOpenPrematch} title="Vorschau öffnen und Spielart wählen">
            <span className="hd-continue-ico" aria-hidden="true"><Icon name="matchball" size={34} /></span>
            <span className="hd-continue-txt"><span className="hd-continue-lbl">Nächstes Spiel</span></span>
          </button>
        ) : due ? (
          <div className="hd-match-btns">
            <button className="hd-continue compact" onClick={onQuickSim} title="Sofortiges Ergebnis">
              <span className="hd-continue-ico" aria-hidden="true"><Icon name="skip" size={34} /></span>
              <span className="hd-continue-lbl">Schnell simulieren</span>
            </button>
            <button className="hd-continue compact text" onClick={onStartText} title="Spiel im Textmodus verfolgen und eingreifen">
              <span className="hd-continue-ico" aria-hidden="true"><Icon name="matchball" size={34} /></span>
              <span className="hd-continue-lbl">Textmodus</span>
            </button>
          </div>
        ) : mustRead ? (
          <button className="hd-continue mail" onClick={onReadMail} title="Bitte überprüfe deine Nachrichten – eine Entscheidung ist offen.">
            <span className="hd-continue-ico" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="44" height="44">
                <rect x="5" y="11" width="38" height="27" rx="3" fill="#fff" fillOpacity="0.95" />
                <path d="M6 13 L24 27 L42 13" fill="none" stroke="var(--neg)" strokeWidth="3" strokeLinejoin="round" />
                <circle cx="39" cy="12" r="6.5" fill="#fff" />
                <circle cx="39" cy="12" r="4.5" fill="var(--neg)" />
              </svg>
            </span>
            <span className="hd-continue-txt"><span className="hd-continue-lbl long">Nachrichten</span></span>
          </button>
        ) : (
          <button className={`hd-continue ${running ? 'running' : ''} ${seasonOver ? 'season' : ''}`} onClick={onContinue}
            title={seasonOver ? 'Nächste Saison starten' : 'Leertaste'}>
            <span className="hd-continue-ico" aria-hidden="true">
              {running ? (
                <svg viewBox="0 0 24 24" width="38" height="38"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="45" height="45"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
              )}
            </span>
            <span className="hd-continue-txt"><span className="hd-continue-lbl">{hdrBtnLabel}</span></span>
          </button>
        )}
      </div>
    </header>
  );
}
