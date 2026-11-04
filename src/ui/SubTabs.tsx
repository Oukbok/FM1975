// =============================================================================
// SubTabs — das „dritte Menü“ (Reiterleiste unter dem Untermenü).
// Vorbild Training › Trainingsplan (Wunsch Pascal). Für Seiten mit mehreren
// gleichrangigen Ansichten (z. B. Jugend › Mannschaften A- bis G-Jugend).
//   <SubTabsPage tabs={…} active={tab} onSelect={setTab}> …DashPage… </SubTabsPage>
// Regel: Die Boxen darunter enden bündig mit der Leiste (gleiche Außenkanten,
// CSS `.sub3-page > .dpage` in 28-subtabs.css) – keine Box ragt seitlich hinaus.
// Gemerkter Reiter je Seite über `useSubTab(schlüssel, standard)` (nur im Speicher).
// =============================================================================
import { useState, type ReactNode } from 'react';

export interface SubTab<T extends string> {
  id: T;
  label: ReactNode;
  /** kleine Zahl rechts neben der Beschriftung (z. B. Spieler, Angebote) */
  count?: number;
  disabled?: boolean;
  title?: string;
}

export function SubTabs<T extends string>({ tabs, active, onSelect, className = '' }: {
  tabs: SubTab<T>[]; active: T; onSelect: (t: T) => void; className?: string;
}) {
  return (
    <nav className={`tabs sub3-tabs ${className}`} role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={active === t.id} disabled={t.disabled} title={t.title}
          className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onSelect(t.id)}>
          <span>{t.label}</span>
          {t.count != null && <span className="sub3-n">{t.count}</span>}
        </button>
      ))}
    </nav>
  );
}

/** Seite mit drittem Menü: Leiste oben, darunter der Inhalt (meist eine DashPage). */
export function SubTabsPage<T extends string>({ tabs, active, onSelect, className = '', tabsClassName = '', children }: {
  tabs: SubTab<T>[]; active: T; onSelect: (t: T) => void; className?: string; tabsClassName?: string; children: ReactNode;
}) {
  return (
    <div className={`sub3-page ${className}`}>
      <SubTabs tabs={tabs} active={active} onSelect={onSelect} className={tabsClassName} />
      {children}
    </div>
  );
}

const remembered = new Map<string, string>();

/** Reiter-Zustand, der beim Seitenwechsel erhalten bleibt (bis zum Neuladen). */
export function useSubTab<T extends string>(key: string, initial: T): [T, (t: T) => void] {
  const [tab, setTab] = useState<T>(() => (remembered.get(key) as T | undefined) ?? initial);
  const set = (t: T) => { remembered.set(key, t); setTab(t); };
  return [tab, set];
}
