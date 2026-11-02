// =============================================================================
// „Wirkung im Spiel“ – gemessen, nicht geschätzt: Die Match-Engine spielt deine
// Mannschaft mit deiner Taktik und mit neutraler Taktik je 40 Heim- und
// Auswärtsspiele gegen den nächsten Gegner (sonst gegen das eigene Spiegelbild).
// Die Balken zeigen den Unterschied je Spiel (engine/match/tacticLab.ts).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { Club, Player, Tactics } from '../../types';
import { measureTactics, type LabStats } from '../../engine/match/tacticLab';

type Row = [label: string, key: keyof LabStats, bad: boolean, kind: 'n' | 'p' | 'g'];
const ROWS: Row[] = [
  ['Flanken', 'crosses', false, 'n'], ['Kopfballchancen', 'headers', false, 'n'], ['Konter', 'counters', false, 'n'],
  ['Distanzschüsse', 'longShots', false, 'n'], ['Torschüsse', 'shots', false, 'n'], ['Tore', 'goalsFor', false, 'g'],
  ['Gegentore', 'goalsAgainst', true, 'g'], ['Ballbesitz', 'possession', false, 'p'], ['Passquote', 'passAcc', false, 'p'],
  ['Fouls', 'fouls', true, 'n'], ['Karten', 'cards', true, 'g'], ['Kraft am Ende', 'energy', false, 'n'], ['Punkte', 'points', false, 'g'],
];
const GAMES = 40;

/** Schlüssel der Einstellungen, die die Messung beeinflussen. */
const keyOf = (t: Tactics) => [t.style, t.tempo, t.pressing, t.defensiveLine, t.tackleHardness, t.effort, t.widthFocus, t.buildup, t.offsideTrap, t.crossStyle, t.formation].join('|');

export function TacticEffect({ club, players, opp, year }: { club: Club; players: Record<string, Player>; opp: Club | null; year: number }) {
  const [res, setRes] = useState<{ mine: LabStats; neutral: LabStats } | null>(null);
  const [busy, setBusy] = useState(false);
  const key = keyOf(club.tactics) + '|' + (opp?.id ?? '');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    setBusy(true);
    window.clearTimeout(timer.current);
    // kurz warten, bis der Regler steht; dann im Hintergrund messen (~0,1–0,3 s)
    timer.current = window.setTimeout(() => {
      try { setRes(measureTactics(club, players, { ...club.tactics }, year, GAMES, opp ?? undefined)); } catch { setRes(null); }
      setBusy(false);
    }, 350);
    return () => window.clearTimeout(timer.current);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!res) return <div className="dnote">{busy ? 'Die Wirkung wird gemessen …' : 'Keine Messung möglich.'}</div>;
  return (
    <div className={`tx-effect tx-measured${busy ? ' busy' : ''}`}>
      <div className="tx-eff tx-eff-head"><span className="tx-eff-l" /><span className="tx-eff-n">neutral</span><span className="tx-eff-t2">Unterschied je Spiel</span><span className="tx-eff-v">deine</span></div>
      {ROWS.map(([label, k, bad, kind]) => {
        const a = res.mine[k], b = res.neutral[k];
        const diff = a - b;
        const rel = kind === 'p' ? diff / 0.08 : kind === 'g' ? diff / 0.35 : diff / Math.max(1, Math.abs(b) * 0.4);
        const d = Math.max(-1, Math.min(1, rel));
        const tiny = Math.abs(d) < 0.04;
        const color = tiny ? 'var(--text-3)' : (diff > 0) !== bad ? 'var(--text-2)' : 'var(--orange)';
        const show = (v: number) => (kind === 'p' ? `${Math.round(v * 100)} %` : kind === 'g' ? v.toFixed(2).replace('.', ',') : v.toFixed(1).replace('.', ','));
        return (
          <div key={label} className="tx-eff">
            <span className="tx-eff-l">{label}</span>
            <span className="tx-eff-n">{show(b)}</span>
            <span className="tx-eff-t"><span style={{ left: d < 0 ? `${50 + d * 50}%` : '50%', width: `${Math.abs(d) * 50}%`, background: color }} /></span>
            <span className="tx-eff-v" style={{ color: color === 'var(--orange)' ? color : undefined }}>{show(a)}</span>
          </div>
        );
      })}
      <div className="dnote">Gemessen mit der Match-Engine: je {GAMES} Heim- und Auswärtsspiele {opp ? `gegen ${opp.name}` : 'gegen dein eigenes Spiegelbild'}, deine Taktik gegen neutrale Einstellungen.</div>
    </div>
  );
}
