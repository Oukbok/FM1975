// =============================================================================
// VERHANDLUNGSTISCH — Abschluss (Wunsch Pascal: Das Fenster schließt nicht einfach,
// es ist klar zu sehen, ob die Verhandlung erfolgreich war oder gescheitert ist).
// Ein Blatt Papier mit Stempel: „EINIG“ bzw. „GESCHEITERT“, darunter was vereinbart
// wurde (bzw. woran es lag), die Bilanz der Verhandlung und wie es weitergeht.
// Der Stempel fällt einmal aufs Blatt (ohne Bewegung bei „weniger Bewegung“).
// =============================================================================
import type { ReactNode } from 'react';

export interface OutcomeData {
  ok: boolean;
  /** Stempeltext, z. B. „Einig“, „Transfer perfekt“, „Gescheitert“. */
  stamp: string;
  title: string;
  text: ReactNode;
  /** Vereinbarte Punkte (bei Erfolg) bzw. der letzte Stand (bei Abbruch). */
  termsTitle?: string;
  terms: { k: string; v: ReactNode }[];
  /** Bilanz der Verhandlung in Kennzahlen. */
  recap: { k: string; v: ReactNode }[];
  /** Wie es weitergeht (ein bis drei Sätze). */
  next: ReactNode[];
  /** Datum (lesbar) für Stempel und Unterschriftenzeile. */
  date: string;
  /** Die beiden Seiten (Unterschriftenzeile bei Erfolg). */
  parties?: [string, string];
}

export function Outcome({ o }: { o: OutcomeData }) {
  return (
    <div className={`vt-out ${o.ok ? 'ok' : 'fail'}`} role="status" aria-live="polite" data-outcome={o.ok ? 'agreed' : 'failed'}>
      <div className="vt-sheet">
        <div className="vt-stamp" aria-hidden="true"><b>{o.stamp}</b><span>{o.date}</span></div>
        <div className="vt-out-kicker">{o.ok ? 'Verhandlung abgeschlossen' : 'Verhandlung beendet'}</div>
        <h2 className="vt-out-title">{o.title}</h2>
        <p className="vt-out-text">{o.text}</p>
        <div className="vt-out-grid">
          <section>
            <h3>{o.termsTitle ?? (o.ok ? 'Vereinbart' : 'Letzter Stand')}</h3>
            <dl className="vt-out-terms">
              {o.terms.map((t) => <div key={t.k}><dt>{t.k}</dt><dd>{t.v}</dd></div>)}
              {!o.terms.length && <div><dt>–</dt><dd /></div>}
            </dl>
          </section>
          <section>
            <h3>Bilanz der Verhandlung</h3>
            <dl className="vt-out-terms">
              {o.recap.map((t) => <div key={t.k}><dt>{t.k}</dt><dd>{t.v}</dd></div>)}
            </dl>
            <h3 className="mt">Wie es weitergeht</h3>
            <ul className="vt-out-next">{o.next.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </section>
        </div>
        {o.ok && o.parties && (
          <div className="vt-sign">
            <div><i>{o.parties[0]}</i><span>für den Verein</span></div>
            <div><i>{o.parties[1]}</i><span>{o.date}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
