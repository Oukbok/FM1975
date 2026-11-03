// =============================================================================
// Chancen-Meter im Kopf des Textmodus: sieben Felder (Mitte = ruhig, je drei
// zu den Teams). Während einer Szene läuft es Schritt für Schritt Richtung der
// angreifenden Mannschaft (1 Gelb Aufbau, 2 Orange gefährlich, 3 Rot Abschluss/
// Großchance) und gleitet danach zurück zur Mitte. Stufe aus Line.danger.
// =============================================================================
import type { Side } from '../../../engine/match/types';
import type { Line } from '../../../data/ticker/narrator';

export function DangerMeter({ line, homeName, awayName }: { line: Line | null; homeName: string; awayName: string }) {
  const lvl = line?.danger ?? 0;
  const side: Side | undefined = lvl ? line?.side : undefined;
  const word = !lvl || !side ? 'Ruhige Phase' : `${side === 'home' ? homeName : awayName}: ${lvl === 3 ? 'Großchance' : lvl === 2 ? 'gefährlich' : 'im Aufbau'}`;
  // Feld -3 … 3: links = Heim, rechts = Gast
  const cells = [-3, -2, -1, 0, 1, 2, 3];
  return (
    <div className={`tm-meter ${side ?? 'calm'} lvl-${lvl}`} role="meter" aria-valuemin={0} aria-valuemax={3} aria-valuenow={lvl} aria-label={word}>
      <div className="tm-meter-cells">
        <span className={`tm-chev l ${side === 'home' ? 'on' : ''}`} aria-hidden>‹‹</span>
        {cells.map((c) => {
          const d = Math.abs(c);
          const lit = c === 0 ? !side : side === (c < 0 ? 'home' : 'away') && d <= lvl;
          return <span key={c} className={`tm-cell d${d} ${lit ? 'lit' : ''}`} />;
        })}
        <span className={`tm-chev r ${side === 'away' ? 'on' : ''}`} aria-hidden>››</span>
      </div>
      <div className="tm-meter-word">{word}</div>
    </div>
  );
}
