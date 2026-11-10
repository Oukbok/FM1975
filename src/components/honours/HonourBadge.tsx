// =============================================================================
// Medaille einer Vereinsauszeichnung (Wunsch Pascal: wie Achievements).
// Ring in Bronze/Silber/Gold, innen dunkelblaue Scheibe mit Symbol; nicht aktiv =
// ausgegraut. Hover/Fokus/Tippen zeigt immer alle drei Stufen mit Voraussetzung
// und Wirkung (useFloatTip aus components/status/StatusTip.tsx).
// Symbole selbst gezeichnet (24er-Raster, nur Linien), keine Bilder nötig.
// =============================================================================
import type { ReactNode } from 'react';
import { HONOUR_BY_ID, TIER_NAME, type HonourId } from '../../data/clubHonours';
import type { ActiveHonour } from '../../game/clubHonours';
import { useFloatTip } from '../status/StatusTip';

const ICONS: Record<HonourId, ReactNode> = {
  talentschmiede: <><path d="M12 21v-8" /><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z" /><path d="M12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z" /><path d="M7 21h10" /></>,
  sprungbrett: <><path d="M3 18h9l3-3" /><path d="M5 18v3M10 18v3" /><path d="M16 11l3-6 2 1" /><circle cx="17.5" cy="3.5" r="1.2" /><path d="M14 13l2-2" /></>,
  jugendhoheit: <><path d="M4 17l1.5-9 4 4L12 6l2.5 6 4-4L20 17z" /><path d="M4 20h16" /></>,
  spitzenklub: <><path d="M3 20h18" /><path d="M9 20v-9h6v9" /><path d="M4 20v-5h5M15 15h5v5" /><path d="M12 4l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 6.1l2-.3z" /></>,
  europa: <>{Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <circle key={i} cx={12 + 7.5 * Math.cos(a)} cy={12 + 7.5 * Math.sin(a)} r="1.3" />; })}<circle cx="12" cy="12" r="2.6" /></>,
  pokalschreck: <><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 3M17 6h2.5a2.5 2.5 0 0 1-2.5 3" /><path d="M12 13v4M8.5 20h7" /><path d="M13 5.5l-2 3h2l-1.5 2.5" /></>,
  festung: <><path d="M4 21V9h3v2h2V9h6v2h2V9h3v12z" /><path d="M10 21v-4a2 2 0 0 1 4 0v4" /><path d="M4 9V5h3v4M17 9V5h3v4" /></>,
  spektakel: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /><circle cx="12" cy="12" r="2.2" /></>,
  bollwerk: <><path d="M12 3l7 3v5c0 5-3.2 8.5-7 10-3.8-1.5-7-5-7-10V6z" /><path d="M12 7v10M8 11h8" /></>,
  fairplay: <><path d="M3 12l4-4 3 2 3-2 5 4" /><path d="M7 8l-2 6 4 3 2-1 2 1 2-1 2 1 3-4" /><path d="M11 16l-1-2M13.5 16.5l-1-2.5M16 15.5l-1-2" /></>,
  truppe: <><circle cx="8" cy="8" r="2.4" /><circle cx="16" cy="8" r="2.4" /><circle cx="12" cy="6" r="2.4" /><path d="M3.5 19c.5-3.5 2.4-5.5 4.5-5.5s4 2 4 2 1.9-2 4-2 4 2 4.5 5.5" /></>,
  treue: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M9 10.5l2 2 4-4" /></>,
  kasse: <><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" /><path d="M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" /><path d="M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" /></>,
  huette: <><path d="M3 9c3-2 6-3 9-3s6 1 9 3" /><path d="M3 9v8c3 2 6 3 9 3s6-1 9-3V9" /><path d="M6 12h2M10 12.5h2M14 12.5h2M18 12h0M7 15.5h2M11 16h2M15 15.5h2" /></>,
  transfer: <><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /><circle cx="19" cy="8" r="1.4" /><circle cx="5" cy="16" r="1.4" /></>,
  ruhe: <><path d="M12 3v15" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M9 6h6" /><circle cx="12" cy="4" r="1.3" /><path d="M5 11l-2-2M19 11l2-2" /></>,
};

/** Medaille (SVG). `tier` = null → nicht aktiv (grau). */
export function HonourMedal({ id, tier, size = 64 }: { id: HonourId; tier: 0 | 1 | 2 | null; size?: number }) {
  const cls = tier == null ? 'off' : ['bronze', 'silber', 'gold'][tier];
  return (
    <svg className={`hm hm-${cls}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" className="hm-ring" />
      <circle cx="32" cy="32" r="30" className="hm-shine" />
      <circle cx="32" cy="32" r="23.5" className="hm-disc" />
      <g transform="translate(17 17) scale(1.25)" className="hm-icon">{ICONS[id]}</g>
    </svg>
  );
}

/** Inhalt des Hover-Fensters: alle Stufen, aktive markiert, dazu Laufzeit und Fortschritt. */
export function HonourTipBody({ id, active, progress, year }: { id: HonourId; active?: ActiveHonour; progress?: string | null; year: number }) {
  const h = HONOUR_BY_ID[id];
  return (
    <div className="hm-tip">
      <div className="hm-tip-h"><b>{h.name}</b><span>{h.what}</span></div>
      {h.tiers.map((t, i) => (
        <div key={i} className={`hm-tip-tier t${i} ${active?.tier === i ? 'on' : ''}`}>
          <span className="hm-tip-dot" />
          <div><b>{TIER_NAME[i]}</b><span>{t.need}</span><em>{t.fx}</em></div>
        </div>
      ))}
      <div className="hm-tip-foot">
        {active ? `Aktiv: ${TIER_NAME[active.tier]} bis zum Saisonende ${active.until}${active.until <= year ? ' – letzte Saison' : ''}` : 'Nicht aktiv'}
        {progress ? <><br />{progress}</> : null}
        <br />Gilt 5 Jahre und verlängert sich, wenn die Hürde erneut geschafft wird.
      </div>
    </div>
  );
}

/** Medaille mit Hover-Fenster. */
export function HonourBadge({ id, active, progress, year, size = 64, label }: {
  id: HonourId; active?: ActiveHonour; progress?: string | null; year: number; size?: number; label?: boolean;
}) {
  const tip = useFloatTip(() => <HonourTipBody id={id} active={active} progress={progress} year={year} />, `${id}${active?.tier}`, 'hm-pop');
  const h = HONOUR_BY_ID[id];
  return (
    <span className={`hb ${active ? 'on' : 'off'} ${label ? 'hb-card' : ''}`} tabIndex={0} {...tip.handlers}
      aria-label={`${h.name}${active ? ` (${TIER_NAME[active.tier]})` : ' (nicht aktiv)'}`}>
      <HonourMedal id={id} tier={active ? active.tier : null} size={size} />
      {label && <span className="hb-name">{h.name}</span>}
      {label && <span className="hb-sub">{active ? `${TIER_NAME[active.tier]} · bis ${active.until}` : 'nicht aktiv'}</span>}
      {tip.layer}
    </span>
  );
}
