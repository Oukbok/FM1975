// =============================================================================
// VERHANDLUNGSTISCH — gemeinsamer Rahmen für alle Verhandlungen (Wunsch Pascal:
// Vereine, Spieler und Mitarbeiter verhandeln am selben Tisch, übersichtlich und
// mit klarem Abschluss). Vollbild über allem, die Zeit steht (shell/GameShell.tsx).
// Kopf: Titel, Anlass, Schritte (z. B. Verein → Spieler → Abschluss).
// Körper: drei Spalten – links das Gegenüber, in der Mitte Position und Punkte,
// rechts Stimmung, Gespräch und Auswirkung. Fuß: Hinweis und Knöpfe.
// Feste Größe – nichts wächst beim Bedienen. CSS: styles/28-negotiation.css.
// =============================================================================
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';
import type { InfoKey } from '../../data/infoTexts';
import { InfoTip } from '../../ui/InfoTip';

export interface NegStep { label: string; state: 'done' | 'now' | 'todo' | 'fail' }

export function NegFrame({ context, steps, info, onClose, children, foot, kind }: {
  /** Anlass, z. B. „Transfer · Name · von Verein“. */
  context: ReactNode;
  steps?: NegStep[];
  info?: InfoKey;
  onClose: () => void;
  children: ReactNode;
  foot: ReactNode;
  /** Art des Gesprächs (nur für Tests/Styles): club | player | staff | sale. */
  kind: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  const host = (typeof document !== 'undefined' && (document.querySelector('.display-content') ?? document.body)) as Element;
  return createPortal(
    <div className={`vt-root vt-kind-${kind}`} role="dialog" aria-label="Verhandlungstisch" data-kind={kind}>
      <header className="vt-top">
        <div className="vt-top-l">
          <Icon name="negotiations" size={34} />
          <span className="vt-title">Verhandlungstisch</span>
          <span className="vt-ctx">{context}</span>
          {info && <InfoTip k={info} />}
        </div>
        {steps && (
          <ol className="vt-steps" aria-label="Ablauf">
            {steps.map((s, i) => (
              <li key={s.label} className={`vt-step ${s.state}`} aria-current={s.state === 'now' ? 'step' : undefined}>
                <span className="vt-step-n">{s.state === 'done' ? <Icon name="check" size={16} /> : s.state === 'fail' ? <Icon name="close" size={14} /> : i + 1}</span>
                <span className="vt-step-l">{s.label}</span>
              </li>
            ))}
          </ol>
        )}
        <button className="modal-close vt-close" onClick={onClose} aria-label="Schließen" title="Schließen (Esc) – das Gespräch bleibt offen">×</button>
      </header>
      <div className="vt-body">{children}</div>
      <footer className="vt-foot">{foot}</footer>
    </div>,
    host,
  );
}

/** Karte mit dunkelblauem Kopf (wie die Boxen der Seiten). */
export function NegCard({ title, right, info, className = '', children }: { title: ReactNode; right?: ReactNode; info?: InfoKey; className?: string; children: ReactNode }) {
  return (
    <section className={`vt-card ${className}`}>
      <h3 className="vt-card-h"><span className="vt-card-t">{title}{info && <InfoTip k={info} />}</span>{right != null && <span className="vt-card-r">{right}</span>}</h3>
      <div className="vt-card-b">{children}</div>
    </section>
  );
}
