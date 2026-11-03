// =============================================================================
// Positionsetikett in Gruppenfarbe (TW türkis, Abwehr grün, Mittelfeld blau,
// Angriff rot) – einzige Darstellung eines Positionskürzels in Listen.
// =============================================================================
// <PosBadge pos="IV" />          ein Etikett (Archive, Ehrungen, Slot-Positionen)
// <PosBadge p={player} />        bis zu zwei Etiketten (stärkste zuerst) + „+“ bei mehr;
//                                feste Breite, damit Spalten nicht springen.
//                                Hover/Fokus/Tippen: alle einsetzbaren Positionen mit Stufe.
// <PosBadge p={player} single /> nur die stärkste Position (enge Stellen), mit Einblendung.
// `compact` = schmalere Etiketten für enge Listen.
// Regeln (Schwelle, Reihenfolge) in ui/positionBadges.ts.
// =============================================================================
import type { Player } from '../types';
import { POSITION_NAMES_DE } from '../engine/positions';
import { TIER_DE } from '../engine/positionSkill';
import { fallbackPositions, playablePositions, posGroupClass, RECENT_GAMES, type PosEntry } from '../ui/positionBadges';
import { vColor } from '../ui/format';
import { useFloatTip } from './status/StatusTip';

interface Props {
  pos?: string | null;
  p?: Player | null;
  single?: boolean;
  compact?: boolean;
  className?: string;
}

/** Ein einzelnes Etikett (ohne Einblendung). */
export function PosTag({ pos, compact, className }: { pos: string; compact?: boolean; className?: string }) {
  const g = posGroupClass(pos);
  return <span className={`pos-badge${g ? ` ${g}` : ''}${compact ? ' pb-c' : ''}${className ? ` ${className}` : ''}`}>{pos}</span>;
}

export default function PosBadge({ pos, p, single, compact, className }: Props) {
  if (!p) return pos ? <PosTag pos={pos} compact={compact} className={className} /> : <span className="pos-badge pb-empty">–</span>;
  return <PlayerPos p={p} single={single} compact={compact} className={className} />;
}

function PlayerPos({ p, single, compact, className }: { p: Player; single?: boolean; compact?: boolean; className?: string }) {
  const list = playablePositions(p);
  const shown = list.slice(0, single ? 1 : 2);
  const more = !single && list.length > 2;
  const tip = useFloatTip(() => <PosTipBody p={p} list={list} />, list.length, 'pb-tip');
  const label = `Positionen: ${list.map((e) => e.pos).join(', ')}`;
  return (
    <span {...tip.handlers} tabIndex={0} aria-label={label}
      className={`posb${single ? ' posb-1' : ''}${compact ? ' posb-c' : ''}${className ? ` ${className}` : ''}`}>
      {shown.map((e) => <PosTag key={e.pos} pos={e.pos} compact={compact} />)}
      {more && <span className="pb-more" aria-hidden="true">+</span>}
      {tip.layer}
    </span>
  );
}

function TipRow({ e }: { e: PosEntry }) {
  return (
    <span className="pb-tip-row">
      <PosTag pos={e.pos} compact />
      <span className="pb-tip-name">{POSITION_NAMES_DE[e.pos]}</span>
      <span className={`pb-tip-tier t-${e.tier}`}>{TIER_DE[e.tier]}</span>
      <b className="pb-tip-val" style={{ color: vColor(e.value) }}>{e.value}</b>
      <span className="pb-tip-games">{e.games ? `${e.games}×` : ''}</span>
    </span>
  );
}

function PosTipBody({ p, list }: { p: Player; list: PosEntry[] }) {
  const ok = fallbackPositions(p);
  const anyGames = list.some((e) => e.games > 0);
  return (
    <>
      <span className="pb-tip-head">Einsetzbar auf {list.length === 1 ? '1 Position' : `${list.length} Positionen`}</span>
      {list.map((e) => <TipRow key={e.pos} e={e} />)}
      {ok.length > 0 && <span className="pb-tip-note">Ausreichend: {ok.map((e) => e.pos).join(', ')}</span>}
      <span className="pb-tip-note">Stärkste Position zuerst{anyGames ? `; × = Einsätze in den letzten ${RECENT_GAMES} Spielen` : ''}.</span>
    </>
  );
}
