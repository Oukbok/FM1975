// =============================================================================
// VERHANDLUNGSTISCH — die Punkte auf dem Tisch als Zeilen:
//   Punkt | Forderung des Gegenübers | dein Angebot | Stand | wie wichtig | fest
// „Stand“ zeigt je Punkt, ob ihr einig seid, ob noch etwas offen ist oder ob eine
// Seite den Punkt zur Bedingung gemacht hat. Ein Klick auf die Forderung übernimmt
// sie für diesen Punkt. Feste Zeilenhöhen, die Liste scrollt intern; unten ein
// fester Hinweisstreifen (Erklärung des Punkts unter dem Zeiger bzw. im Fokus).
// =============================================================================
import { type ReactNode, useState } from 'react';
import type { InfoKey } from '../../data/infoTexts';
import { InfoTip } from '../../ui/InfoTip';
import { Dots, LockButton, StatusPill, type TermStatus } from './NegParts';

export interface TermRow {
  key: string;
  label: ReactNode;
  info?: InfoKey;
  /** Forderung des Gegenübers für diesen Punkt. */
  ask: ReactNode;
  /** Forderung für diesen Punkt übernehmen (Klick auf die Forderung). */
  onAdopt?: () => void;
  /** Bedienelement für dein Angebot. */
  control: ReactNode;
  status: TermStatus;
  statusTitle?: string;
  /** Wichtigkeit für das Gegenüber 0–3. */
  weight?: number;
  known?: boolean;
  lockable?: boolean;
  locked?: boolean;
  onLock?: () => void;
  /** Erklärung im Hinweisstreifen. */
  hint?: ReactNode;
  tall?: boolean;
  /** Vom Gegenüber in der letzten Runde geändert bzw. verlangt. */
  changed?: boolean;
}

export function TermsTable({ rows, disabled, askHead = 'Forderung', mineHead = 'Dein Angebot', defaultHint, roomy, extra }: {
  rows: TermRow[]; disabled?: boolean; askHead?: string; mineHead?: string; defaultHint?: ReactNode;
  /** Wenige Punkte: höhere Zeilen. */
  roomy?: boolean;
  /** Fester Streifen zwischen Liste und Hinweis (z. B. die Aufschlüsselung des Paketwerts). */
  extra?: ReactNode;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const cur = rows.find((r) => r.key === hover);
  return (
    <div className={`vt-table${disabled ? ' off' : ''}${roomy ? ' roomy' : ''}${extra ? ' with-extra' : ''}`}>
      <div className="vt-thead">
        <span>Punkt</span><span>{askHead}</span><span>{mineHead}</span><span className="c">Stand</span><span className="c">Wichtig</span><span className="c" title="Nicht verhandelbar">Fest</span>
      </div>
      <div className="vt-rows">
        {rows.map((r) => (
          <div key={r.key} className={`vt-row${hover === r.key ? ' hl' : ''}${r.tall ? ' tall' : ''}${r.changed ? ' changed' : ''}${r.locked ? ' locked' : ''}`} data-key={r.key}
            onMouseEnter={() => setHover(r.key)} onFocusCapture={() => setHover(r.key)}>
            <span className="vt-lab">{r.label}{r.info && <InfoTip k={r.info} />}</span>
            {r.onAdopt && !disabled
              ? <button type="button" className="vt-ask adopt" onClick={r.onAdopt} title="Forderung für diesen Punkt übernehmen">{r.ask}</button>
              : <span className="vt-ask">{r.ask}</span>}
            <span className="vt-ctl">{r.control}</span>
            <span className="vt-st"><StatusPill status={r.status} title={r.statusTitle} /></span>
            <span className="vt-w">{r.weight != null && <Dots n={r.weight} known={r.known ?? true} />}</span>
            <span className="vt-lk">{r.lockable && r.onLock && <LockButton locked={!!r.locked} onToggle={r.onLock} disabled={disabled} />}</span>
          </div>
        ))}
      </div>
      {extra && <div className="vt-extra">{extra}</div>}
      <div className="vt-hint" aria-live="polite">{cur?.hint ?? defaultHint ?? ''}</div>
    </div>
  );
}
