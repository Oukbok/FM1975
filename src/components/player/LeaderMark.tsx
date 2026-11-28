// =============================================================================
// Führungsspieler-Zeichen (Wunsch Pascal: „ein Symbol immer hinter seinem Namen“).
// Kleines Wappenschild mit Winkeln in Bronze/Silber/Gold (1/2/3 Winkel – auch ohne
// Farbe lesbar) hinter dem Namen jedes Spielers mit Teambonus (engine/teamBoost.ts).
// Gezeichnet als SVG, Größe 0,8 em, steht auf der Grundlinie des Namens.
// Zeigen/Fokus/Tippen: Erklärung über useFloatTip (wie Positions-Etiketten).
// <PlayerLink> hängt es selbst an; Stellen ohne PlayerLink nutzen <LeaderMark p={…} />
// oder <LeaderName p={…}>Name</LeaderName> (Name kürzbar, Zeichen bleibt sichtbar).
// CSS `.ldm*` in styles/28-leadermark.css.
// =============================================================================
import type { ReactNode } from 'react';
import { BOOST_DE, BOOST_PCT, TEAM_BOOST_CAP, type TeamBoost } from '../../engine/teamBoost';
import { useFloatTip } from '../status/StatusTip';

const pct = (v: number) => `${String(Math.round(v * 1000) / 10).replace('.', ',')} %`;

/** Erklärsatz zum Zeichen (Tooltip, Wiki-Abgleich). */
export function leaderText(t: TeamBoost): string {
  return `Führungsspieler ${BOOST_DE[t]}: reißt die Mannschaft mit (+${pct(BOOST_PCT[t])} auf dem Platz, Teambonus zusammen höchstens +${pct(TEAM_BOOST_CAP)})`;
}

const CHEVRONS: Record<TeamBoost, number[]> = { bronze: [6.6], silver: [5.2, 8.2], gold: [3.9, 6.6, 9.3] };

/** Nur das gezeichnete Schild (auch für Legenden/Wiki). */
export function LeaderShield({ tier }: { tier: TeamBoost }) {
  return (
    <svg className={`ldm-svg ldm-${tier}`} viewBox="0 0 12 14" aria-hidden="true" focusable="false">
      <path className="ldm-shield" d="M6 .9 11.1 2.7V7c0 3-2.2 5.3-5.1 6.3C3.1 12.3.9 10 .9 7V2.7Z" />
      {CHEVRONS[tier].map((y) => <path key={y} className="ldm-chev" d={`M3.3 ${y - 1.2} 6 ${y + 1.1} 8.7 ${y - 1.2}`} />)}
    </svg>
  );
}

function Mark({ tier }: { tier: TeamBoost }) {
  const tip = useFloatTip(() => <span className="ldm-tip-row"><LeaderShield tier={tier} /><span>{leaderText(tier)}</span></span>, tier, 'ldm-tip');
  return (
    <span {...tip.handlers} className="ldm" tabIndex={0} role="img" aria-label={leaderText(tier)} data-leader={tier}>
      <LeaderShield tier={tier} />
      {tip.layer}
    </span>
  );
}

/** Zeichen hinter dem Namen – nichts, wenn der Spieler kein Führungsspieler ist. */
export function LeaderMark({ p, tier }: { p?: { teamBoost?: TeamBoost } | null; tier?: TeamBoost | null }) {
  const t = tier ?? p?.teamBoost;
  return t ? <Mark tier={t} /> : null;
}

/**
 * Name + Zeichen: ohne Teambonus nur der Name (unverändert), sonst ein Inline-Flex-Paar,
 * in dem der Name gekürzt wird und das Zeichen stehen bleibt. Mit `className` trägt der
 * äußere Span diese Klasse in beiden Fällen (ersetzt z. B. `<span className="mk-pname">`).
 */
export function LeaderName({ p, tier, children, className = '' }: {
  p?: { teamBoost?: TeamBoost } | null; tier?: TeamBoost | null; children: ReactNode; className?: string;
}) {
  const t = tier ?? p?.teamBoost;
  if (!t) return className ? <span className={className}>{children}</span> : <>{children}</>;
  return <span className={`ldm-wrap${className ? ` ${className}` : ''}`}><span className="ldm-name">{children}</span><Mark tier={t} /></span>;
}

const TIERS: TeamBoost[] = ['gold', 'silver', 'bronze'];

/** Kleine Legende: je vorhandener Stufe Schild + Anzahl (Kader › Kader). */
export function LeaderLegend({ players }: { players: { teamBoost?: TeamBoost }[] }) {
  const n = (t: TeamBoost) => players.filter((p) => p.teamBoost === t).length;
  return (
    <span className="ldm-legend">
      {TIERS.filter((t) => n(t) > 0).map((t) => (
        <span key={t} title={leaderText(t)}><LeaderShield tier={t} />{BOOST_DE[t]} {n(t)}</span>
      ))}
    </span>
  );
}
