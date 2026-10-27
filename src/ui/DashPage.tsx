// =============================================================================
// DashPage / DashBox — einheitliches Seitenraster wie die Zentrale.
// Gleiche Geometrie wie das Zentrale-Dashboard (3 Spalten à 30 %, gleiche Lücken,
// 2 Reihen zwischen Kalenderstreifen und Footer). Boxen können über mehrere
// Spalten/Reihen gehen (`span`, `rows`); der Inhalt einer Box scrollt intern,
// die Seite selbst nie.
// =============================================================================
import { type ReactNode } from 'react';
import Icon, { type IconName } from '../components/Icon';

export function DashPage({ children, rows = 2, className = '' }: { children: ReactNode; rows?: 1 | 2; className?: string }) {
  return <div className={`dpage dpage-r${rows} ${className}`}>{children}</div>;
}

export function DashBox({
  title, icon, right, children, span = 1, rows = 1, onClick, className = '', flush = false,
}: {
  title: ReactNode;
  icon?: IconName;
  right?: ReactNode;
  children?: ReactNode;
  /** Spalten (1–3) */
  span?: 1 | 2 | 3;
  /** Reihen (1–2) */
  rows?: 1 | 2;
  onClick?: () => void;
  className?: string;
  /** Inhalt ohne Innenabstand (z. B. randlose Tabellen) */
  flush?: boolean;
}) {
  return (
    <section
      className={`card dbox ${onClick ? 'clickable' : ''} ${className}`}
      style={{ gridColumn: `span ${span}`, gridRow: `span ${rows}` }}
      onClick={onClick}
    >
      <div className="dxh">
        {icon && <span className="dxh-ico"><Icon name={icon} size={20} /></span>}
        <span className="dxh-title">{title}</span>
        {right != null && <span className="dxh-right">{right}</span>}
      </div>
      <div className={`dbox-body ${flush ? 'flush' : ''}`}>{children}</div>
    </section>
  );
}

/** Große Kennzahl mit Beschriftung (Kachel). */
export function Kpi({ value, label, sub, color }: { value: ReactNode; label: string; sub?: ReactNode; color?: string }) {
  return (
    <div className="dkpi">
      <div className="dkpi-val" style={color ? { color } : undefined}>{value}</div>
      <div className="dkpi-lbl">{label}</div>
      {sub != null && <div className="dkpi-sub">{sub}</div>}
    </div>
  );
}

/** Zeile Beschriftung – Wert. */
export function KV({ k, v, color, strong }: { k: ReactNode; v: ReactNode; color?: string; strong?: boolean }) {
  return (
    <div className="dkv">
      <span className="dkv-k">{k}</span>
      <span className="dkv-v" style={{ color, fontWeight: strong ? 900 : undefined }}>{v}</span>
    </div>
  );
}

/** Horizontaler Balken mit Wert (0–100 oder max). */
export function Meter({ label, value, max = 100, color, text }: { label: ReactNode; value: number; max?: number; color?: string; text?: ReactNode }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="dmeter">
      <span className="dmeter-lbl">{label}</span>
      <span className="dmeter-track"><span className="dmeter-fill" style={{ width: `${pct}%`, background: color ?? 'var(--accent)' }} /></span>
      <span className="dmeter-val">{text ?? Math.round(value)}</span>
    </div>
  );
}

/** Hinweis „weiter zu …“ unten in einer Box. */
export function BoxLink({ children }: { children: ReactNode }) {
  return <div className="dbox-link">{children} →</div>;
}

/** Leerer Zustand innerhalb einer Box. */
export function Empty({ children, icon = 'info' as IconName }: { children: ReactNode; icon?: IconName }) {
  return (
    <div className="dempty">
      <Icon name={icon} size={28} />
      <div>{children}</div>
    </div>
  );
}
