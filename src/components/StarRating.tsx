// =============================================================================
// Sterne mit Spanne (Wunsch Pascal): fünf Vektor-Sterne (scharf in jeder Größe),
// je Stern in Vierteln von links nach rechts gefüllt. Sicherer Teil (bis `lo`)
// gelb, geschätzter Teil (`lo` bis `hi`) weiß, Rest leer. Hover/Fokus/Tippen zeigt
// die Spanne in Worten (status/StatusTip.tsx `useFloatTip`).
// =============================================================================
import { useId } from 'react';
import { useFloatTip } from './status/StatusTip';

/** Fünfzackiger Stern im Raster 0..24 (abgerundete Spitzen über stroke-linejoin). */
const STAR = 'M12 1.6l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.7l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z';

const fmt = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
export const starText = (lo: number, hi: number) => (lo === hi ? `${fmt(lo)} Sterne` : `${fmt(lo)}–${fmt(hi)} Sterne`);

export function StarRating({ lo, hi, size = 22, label, note }: {
  /** sicher (gelb) bis lo, geschätzt (weiß) bis hi – je in Vierteln 0..5 */
  lo: number; hi: number; size?: number;
  /** Titel im Hover, z. B. „Potenzial“ */
  label: string;
  /** Erklärsatz im Hover */
  note?: string;
}) {
  const id = useId().replace(/:/g, '');
  const a = Math.max(0, Math.min(5, Math.round(lo * 4) / 4));
  const b = Math.max(a, Math.min(5, Math.round(hi * 4) / 4));
  const tip = useFloatTip(() => (
    <>
      <b>{label}: </b><span className="st-tip-val">{starText(a, b)}</span>
      <div className="mk-tip-note">{a === b ? 'Sicher eingeschätzt.' : `Sicher sind ${fmt(a)} Sterne (gelb), bis ${fmt(b)} sind möglich (weiß).`}{note ? ` ${note}` : ''}</div>
    </>
  ), `${a}|${b}`);
  const gap = 2;
  const w = 5 * 24 + 4 * gap;
  return (
    <span className="mk-stars" tabIndex={0} aria-label={`${label}: ${starText(a, b)}`} {...tip.handlers}>
      <svg viewBox={`0 0 ${w} 24`} width={(size * w) / 24} height={size} aria-hidden>
        <defs>
          <clipPath id={`${id}s`}>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={STAR} transform={`translate(${i * (24 + gap)} 0)`} />)}</clipPath>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => <path key={i} className="mk-star-bg" d={STAR} transform={`translate(${i * (24 + gap)} 0)`} />)}
        <g clipPath={`url(#${id}s)`}>
          {[0, 1, 2, 3, 4].map((i) => {
            const x = i * (24 + gap);
            const sure = Math.max(0, Math.min(1, a - i)), est = Math.max(0, Math.min(1, b - i));
            // Stern-Breite reicht von 1,0 bis 23,0 – Viertel auf die sichtbare Breite verteilen.
            const W = (f: number) => (f <= 0 ? 0 : f >= 1 ? 24 : 1 + f * 22);
            return (
              <g key={i}>
                {est > sure && <rect className="mk-star-est" x={x + W(sure)} y={0} width={W(est) - W(sure)} height={24} />}
                {sure > 0 && <rect className="mk-star-sure" x={x} y={0} width={W(sure)} height={24} />}
              </g>
            );
          })}
        </g>
        {[0, 1, 2, 3, 4].map((i) => <path key={i} className="mk-star-line" d={STAR} transform={`translate(${i * (24 + gap)} 0)`} />)}
      </svg>
      {tip.layer}
    </span>
  );
}

/** Kenntnisse als senkrechter Balken (unten → oben), Farbe rot → grün (Wunsch Pascal). */
export function KnowledgeBar({ k, word }: { k: number; word: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, k)) * 100);
  const lvl = k >= 0.8 ? 5 : k >= 0.6 ? 4 : k >= 0.4 ? 3 : k >= 0.2 ? 2 : 1;
  const tip = useFloatTip(() => (
    <>
      <b>Kenntnisse: </b><span className="st-tip-val">{pct} %</span> – {word}
      <div className="mk-tip-note">Je mehr du über einen Spieler weißt, desto enger die Spannen bei Stärke, Potenzial, Wert und Gehalt. Mehr erfährst du über Spiele gegen seinen Verein, Medien, Scouting-Mitarbeiter und Scouting-Aufträge.</div>
    </>
  ), pct);
  return (
    <span className="mk-know" tabIndex={0} aria-label={`Kenntnisse ${pct} %`} {...tip.handlers}>
      <span className={`mk-know-fill lv${lvl}`} style={{ height: `${Math.max(6, pct)}%` }} />
      {tip.layer}
    </span>
  );
}
