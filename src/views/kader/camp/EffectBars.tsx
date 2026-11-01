// =============================================================================
// TRAININGSLAGER – Wirkungsbalken (wie Taktik › Wirkung im Spiel): ausgehend von
// der Mitte, hell = Vorteil, Orange = Nachteil. Rechnung: engine/campPlan.ts.
// =============================================================================
import type { CampBar } from '../../../engine/campPlan';

export function EffectBars({ bars, empty }: { bars: CampBar[]; empty?: boolean }) {
  return (
    <div className={`tx-effect cp-bars ${empty ? 'empty' : ''}`}>
      {bars.map((b) => {
        const d = empty ? 0 : b.d;
        const neutral = Math.abs(d) < 0.02;
        const good = b.bad ? d < 0 : d > 0;
        const color = neutral ? 'var(--text-3)' : good ? 'var(--text-2)' : 'var(--orange)';
        return (
          <div key={b.key} className="tx-eff cp-eff" title={b.hint}>
            <span className="tx-eff-l">{b.label}</span>
            <span className="tx-eff-t"><span style={{ left: d < 0 ? `${50 + d * 50}%` : '50%', width: `${Math.abs(d) * 50}%`, background: color }} /></span>
            <span className="tx-eff-v" style={{ color: !neutral && !good ? color : undefined }}>{empty ? '–' : b.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Vorher/Nachher-Balken (Archiv, Zusammenfassung): grauer Sockel = vorher, heller Teil = Zuwachs. */
export function BeforeAfter({ label, before, after, max = 100, unit = '', digits = 1 }: {
  label: string; before: number; after: number; max?: number; unit?: string; digits?: number;
}) {
  const lo = Math.min(before, after), hi = Math.max(before, after);
  const up = after >= before;
  const f = (v: number) => v.toFixed(digits).replace('.', ',');
  const diff = after - before;
  return (
    <div className="cp-ba">
      <span className="cp-ba-l">{label}</span>
      <span className="cp-ba-t">
        <span className="cp-ba-base" style={{ width: `${(lo / max) * 100}%` }} />
        <span className={`cp-ba-d ${up ? 'up' : 'down'}`} style={{ left: `${(lo / max) * 100}%`, width: `${Math.max(0.6, ((hi - lo) / max) * 100)}%` }} />
      </span>
      <span className="cp-ba-v">{f(before)}{unit} › <b>{f(after)}{unit}</b></span>
      <span className={`cp-ba-x ${Math.abs(diff) < 0.05 ? '' : up ? 'pos' : 'neg'}`}>{diff >= 0 ? '+' : '−'}{f(Math.abs(diff))}</span>
    </div>
  );
}
