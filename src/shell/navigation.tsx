import Icon, { type IconName } from '../components/Icon';

export type Screen = 'dashboard' | 'table' | 'fixtures' | 'squad' | 'lineup' | 'training' | 'transfers' | 'finances' | 'youth' | 'facilities' | 'cup' | 'chronicle' | 'wiki' | 'staff' | 'marketing' | 'calendar'
  // Kategorie-Dashboards (Übersichtsseiten je Hauptkategorie)
  | 'cat-spieltag' | 'cat-kader' | 'cat-transfers' | 'cat-finanzen' | 'cat-verein' | 'cat-statistiken'
  // Neue Einzelseiten
  | 'tactics' | 'stadium' | 'presse' | 'vertraege' | 'meldung' | 'reserve' | 'beobachtung' | 'spielerpool' | 'scouting' | 'verhandlungen' | 'leihen' | 'sponsoring' | 'fans' | 'international' | 'nationalteams' | 'supercup' | 'vorstand' | 'ruhmeshalle' | 'akademie'
  // Winter: Hallenfußball + Trainingslager
  | 'halle' | 'trainingslager'
  // Saison-Briefing (Archiv)
  | 'briefing'
  // Kabine (Kader › Kabine)
  | 'kabine'
  // Training (Kategorie) + Jugend (Kategorie)
  | 'cat-training' | 'trainerteam' | 'cat-jugend' | 'jugendwettbewerbe' | 'jugendcamps'
  // Die Besten der Saison (Statistiken › Auszeichnungen)
  | 'auszeichnungen'
  // Fanartikel (Finanzen › Fanartikel)
  | 'fanartikel'
  // Kartenverkauf (Verein › Kartenverkauf)
  | 'kartenverkauf'
  // Saisonbudget (Finanzen › Budget)
  | 'budget'
  // Übersicht Ligensystem (Statistiken › Ligensystem)
  | 'ligensystem'
  // Managerkarriere (Privat › Karriere)
  | 'karriere'
  // Privatleben (Privat): Übersicht, Familie, Freizeit, Vermögen
  | 'privat' | 'familie' | 'freizeit' | 'vermoegen'
  // Nationaltrainer (Ansicht Nationalteam): Übersicht/Aufgebot/Spiele & Turniere (views/national/)
  | 'nationalteam';

// =============================================================================
// MENÜ-STRUKTUR (zweistufige Top-Navigation)
// =============================================================================
// Reihe 1 = 9 Hauptkategorien (Klick öffnet das jeweilige Kategorie-Dashboard),
// Reihe 2 = Unterpunkte der aktiven Kategorie. Alle Symbole im Set-C-Stil.
export interface SubItem { screen: Screen; label: string; icon: IconName }

export interface MainCat { key: string; label: string; icon: IconName; dash: Screen; subs: SubItem[] }

// Jede Kategorie bekommt als ERSTEN Unterpunkt einen gleichnamigen Eintrag, der auf das
// Kategorie-Dashboard (`dash`) zeigt. Dadurch ist er automatisch aktiv, sobald man im
// Obermenue auf die Kategorie klickt (Header navigiert auf `dash`, TopNav markiert den
// Unterpunkt mit `screen === s.screen`). Reihenfolge: Selbst-Eintrag zuerst, dann die Views.
export const MENU_STRUCTURE: MainCat[] = [
  { key: 'zentrale', label: 'Zentrale', icon: 'zentrale', dash: 'dashboard', subs: [
    { screen: 'dashboard', label: 'Zentrale', icon: 'zentrale' },
    { screen: 'presse', label: 'Presse', icon: 'presse' },
    { screen: 'calendar', label: 'Kalender', icon: 'kalender' },
    { screen: 'briefing', label: 'Briefing', icon: 'briefing' },
  ] },
  // Aufstellung (Wunsch Pascal, früher „Spieltag“): der Gegner als eigener Unterpunkt nach Taktik.
  { key: 'aufstellung', label: 'Aufstellung', icon: 'lineup', dash: 'lineup', subs: [
    { screen: 'lineup', label: 'Aufstellung', icon: 'lineup' },
    { screen: 'tactics', label: 'Taktik', icon: 'tactics' },
    { screen: 'cat-spieltag', label: 'Gegner', icon: 'watchlist' },
    { screen: 'fixtures', label: 'Spielplan', icon: 'schedule' },
  ] },
  { key: 'kader', label: 'Kader', icon: 'squad', dash: 'cat-kader', subs: [
    { screen: 'cat-kader', label: 'Kader', icon: 'squad' },
    { screen: 'squad', label: 'Übersicht', icon: 'squad' },
    { screen: 'vertraege', label: 'Verträge', icon: 'contracts' },
    { screen: 'meldung', label: 'Spielermeldung', icon: 'contracts' },
    { screen: 'kabine', label: 'Kabine', icon: 'squad' },
  ] },
  { key: 'training', label: 'Training', icon: 'training', dash: 'cat-training', subs: [
    { screen: 'cat-training', label: 'Training', icon: 'training' },
    { screen: 'training', label: 'Trainingsplan', icon: 'training' },
    { screen: 'trainingslager', label: 'Trainingslager', icon: 'weather' },
    { screen: 'trainerteam', label: 'Trainerteam', icon: 'whistle' },
  ] },
  { key: 'jugend', label: 'Jugend', icon: 'youth', dash: 'cat-jugend', subs: [
    { screen: 'cat-jugend', label: 'Jugend', icon: 'youth' },
    { screen: 'akademie', label: 'Akademie', icon: 'facilities' },
    { screen: 'youth', label: 'Mannschaften', icon: 'youth' },
    { screen: 'reserve', label: '2. Mannschaft', icon: 'squad' },
    { screen: 'jugendwettbewerbe', label: 'Jugendwettbewerbe', icon: 'trophy' },
    { screen: 'jugendcamps', label: 'Jugendcamps', icon: 'international' },
  ] },
  { key: 'transfers', label: 'Transfers', icon: 'transfers', dash: 'cat-transfers', subs: [
    { screen: 'cat-transfers', label: 'Transfers', icon: 'transfers' },
    { screen: 'transfers', label: 'Transfermarkt', icon: 'transfers' },
    { screen: 'spielerpool', label: 'Spielerpool', icon: 'international' },
    { screen: 'beobachtung', label: 'Beobachtung', icon: 'watchlist' },
    { screen: 'scouting', label: 'Scouting', icon: 'trVideo' },
    { screen: 'verhandlungen', label: 'Verhandlungen', icon: 'negotiations' },
    { screen: 'leihen', label: 'Leihen', icon: 'swap' },
  ] },
  { key: 'finanzen', label: 'Finanzen', icon: 'finances', dash: 'cat-finanzen', subs: [
    { screen: 'cat-finanzen', label: 'Finanzen', icon: 'finances' },
    { screen: 'finances', label: 'Bilanz', icon: 'finances' },
    { screen: 'budget', label: 'Budget', icon: 'dashFinanzen' },
    { screen: 'sponsoring', label: 'Sponsoring', icon: 'sponsoring' },
    { screen: 'fanartikel', label: 'Fanartikel', icon: 'merch' },
    { screen: 'marketing', label: 'Marketing', icon: 'marketing' },
  ] },
  { key: 'verein', label: 'Verein', icon: 'stadium', dash: 'cat-verein', subs: [
    { screen: 'cat-verein', label: 'Verein', icon: 'stadium' },
    { screen: 'staff', label: 'Mitarbeiter', icon: 'staff' },
    { screen: 'facilities', label: 'Vereinsgelände', icon: 'facilities' },
    { screen: 'stadium', label: 'Stadion', icon: 'stadium' },
    { screen: 'kartenverkauf', label: 'Kartenverkauf', icon: 'ticket' },
    { screen: 'fans', label: 'Fans', icon: 'fans' },
    { screen: 'ruhmeshalle', label: 'Erfolge', icon: 'trophy' },
  ] },
  { key: 'statistiken', label: 'Statistiken', icon: 'stats', dash: 'cat-statistiken', subs: [
    { screen: 'cat-statistiken', label: 'Statistiken', icon: 'stats' },
    { screen: 'table', label: 'Liga', icon: 'stats' },
    { screen: 'ligensystem', label: 'Ligensystem', icon: 'stats' },
    { screen: 'cup', label: 'Pokal', icon: 'trophy' },
    { screen: 'supercup', label: 'Supercup', icon: 'trophy' },
    { screen: 'international', label: 'International', icon: 'international' },
    { screen: 'nationalteams', label: 'Nationalteams', icon: 'international' },
    { screen: 'halle', label: 'Halle', icon: 'trophy' },
    { screen: 'auszeichnungen', label: 'Auszeichnungen', icon: 'trophy' },
  ] },
  // Privatleben (Wunsch Pascal #47): dein Leben neben dem Verein, Karriere, Familie über Generationen.
  { key: 'privat', label: 'Privat', icon: 'home', dash: 'privat', subs: [
    { screen: 'privat', label: 'Privat', icon: 'home' },
    { screen: 'karriere', label: 'Karriere', icon: 'whistle' },
    { screen: 'familie', label: 'Familie', icon: 'fans' },
    { screen: 'freizeit', label: 'Freizeit', icon: 'music' },
    { screen: 'vermoegen', label: 'Vermögen', icon: 'finances' },
  ] },
];

// Ansicht Nationalteam (Wunsch Pascal, Umschalter in der Kopfleiste, shell/viewMode.ts): nur
// Bereiche, die für die Nationalmannschaft zählen. Zentrale zeigt dann die Nationalteam-Widgets.
export const NATIONAL_MENU: MainCat[] = [
  { key: 'nt-zentrale', label: 'Zentrale', icon: 'zentrale', dash: 'dashboard', subs: [
    { screen: 'dashboard', label: 'Zentrale', icon: 'zentrale' },
    { screen: 'calendar', label: 'Kalender', icon: 'kalender' },
    { screen: 'presse', label: 'Presse', icon: 'presse' },
  ] },
  { key: 'nt-team', label: 'Nationalteam', icon: 'international', dash: 'nationalteam', subs: [
    { screen: 'nationalteam', label: 'Nationalteam', icon: 'international' },
  ] },
  { key: 'nt-scout', label: 'Beobachten', icon: 'watchlist', dash: 'spielerpool', subs: [
    { screen: 'spielerpool', label: 'Spielerpool', icon: 'international' },
    { screen: 'scouting', label: 'Scouting', icon: 'trVideo' },
  ] },
  { key: 'nt-stats', label: 'Statistiken', icon: 'stats', dash: 'nationalteams', subs: [
    { screen: 'nationalteams', label: 'Nationalteams', icon: 'international' },
    { screen: 'table', label: 'Liga', icon: 'stats' },
    { screen: 'ligensystem', label: 'Ligensystem', icon: 'stats' },
    { screen: 'international', label: 'International', icon: 'international' },
    { screen: 'auszeichnungen', label: 'Auszeichnungen', icon: 'trophy' },
  ] },
  { key: 'nt-privat', label: 'Privat', icon: 'home', dash: 'privat', subs: [
    { screen: 'privat', label: 'Privat', icon: 'home' },
    { screen: 'karriere', label: 'Karriere', icon: 'whistle' },
  ] },
];
/** Menü der Ansicht. */
export const menuFor = (view: 'club' | 'national'): MainCat[] => (view === 'national' ? NATIONAL_MENU : MENU_STRUCTURE);
/** Seiten, die in beiden Ansichten passen (kein Umschalten beim Aufruf). */
export const NEUTRAL_SCREENS: Screen[] = ['wiki', 'chronicle'];
/** Seiten der Ansicht. */
export const screensOf = (menu: MainCat[]): Set<Screen> => new Set(menu.flatMap((c) => [c.dash, ...c.subs.map((s) => s.screen)]));

/** Zweistufige Top-Navigation: Hauptkategorien + Unterpunkte der aktiven Kategorie. */
export function TopNav({ screen, setScreen, dateLabel, onBack, onForward, menu = MENU_STRUCTURE }: { screen: Screen; setScreen: (s: Screen) => void; dateLabel?: string; onBack?: () => void; onForward?: () => void; menu?: MainCat[] }) {
  const matched = menu.find((c) => c.dash === screen || c.subs.some((s) => s.screen === screen));
  const activeCat = matched ?? menu[0];
  return (
    <nav className="top-nav sub-only">
      <div className="tn-sub">
        {/* Zurück/Vorwärts (je bis zu 20 Seiten, Alt+←/→); ausgegraut ohne Verlauf, z. B. nach Zeitlauf. */}
        <span className="tn-hist">
          <button className="tn-back" disabled={!onBack} onClick={onBack} title={onBack ? 'Zurück zur vorherigen Seite (Alt+←)' : 'Keine vorherige Seite'} aria-label="Zurück">
            <Icon name="navPrev" size={18} />
          </button>
          <button className="tn-back tn-fwd" disabled={!onForward} onClick={onForward} title={onForward ? 'Vorwärts (Alt+→)' : 'Keine nächste Seite'} aria-label="Vorwärts">
            <Icon name="navNext" size={18} />
          </button>
        </span>
        {activeCat.subs.map((s) => (
          <button key={s.screen} className={`tn-sub-item ${screen === s.screen ? 'active' : ''}`} onClick={() => setScreen(s.screen)}>
            <span>{s.label}</span>
          </button>
        ))}
        {dateLabel && <span className="tn-date">{dateLabel}</span>}
      </div>
    </nav>
  );
}
