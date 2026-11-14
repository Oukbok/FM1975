// =============================================================================
// „Wirkung im Spiel“ – gemessen, nicht geschätzt: Die Match-Engine spielt deine
// Mannschaft mit deiner Taktik und mit neutraler Taktik je 40 Heim- und
// Auswärtsspiele gegen den nächsten Gegner (sonst gegen das eigene Spiegelbild).
// Oben die drei Zahlen, auf die es ankommt (Punkte, Tore, Gegentore) mit dem
// Unterschied zur neutralen Taktik; darunter die Ursachen in drei Gruppen.
// Gemessen ohne Eingespieltheit (engine/match/tacticLab.ts).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { Club, Player, Tactics } from '../../types';
import { measureTactics, type LabStats } from '../../engine/match/tacticLab';

type Kind = 'n' | 'p' | 'g';
type Row = [label: string, key: keyof LabStats, bad: boolean, kind: Kind];
const GROUPS: [string, Row[]][] = [
  ['Angriff', [['Torschüsse', 'shots', false, 'n'], ['Flanken', 'crosses', false, 'n'], ['Kopfballchancen', 'headers', false, 'n'], ['Konter', 'counters', false, 'n'], ['Distanzschüsse', 'longShots', false, 'n']]],
  ['Kontrolle', [['Ballbesitz', 'possession', false, 'p'], ['Passquote', 'passAcc', false, 'p']]],
  ['Preis', [['Fouls', 'fouls', true, 'n'], ['Karten', 'cards', true, 'g'], ['Kraft am Ende', 'energy', false, 'n']]],
];
const HEAD: Row[] = [['Punkte', 'points', false, 'g'], ['Tore', 'goalsFor', false, 'g'], ['Gegentore', 'goalsAgainst', true, 'g']];
const GAMES = 40;
const show = (v: number, kind: Kind) => (kind === 'p' ? `${Math.round(v * 100)} %` : kind === 'g' ? v.toFixed(2).replace('.', ',') : v.toFixed(1).replace('.', ','));
const delta = (d: number, kind: Kind) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${kind === 'p' ? `${Math.abs(Math.round(d * 100))} %` : Math.abs(d).toFixed(kind === 'g' ? 2 : 1).replace('.', ',')}`;

/** Schlüssel der Einstellungen, die die Messung beeinflussen. */
const keyOf = (t: Tactics) => [t.style, t.tempo, t.pressing, t.defensiveLine, t.tackleHardness, t.effort, t.widthFocus, t.buildup, t.offsideTrap, t.crossStyle, t.formation, t.marking, t.counterPress, JSON.stringify(t.roles ?? {})].join('|');

export function TacticEffect({ club, players, opp, year }: { club: Club; players: Record<string, Player>; opp: Club | null; year: number }) {
  const [res, setRes] = useState<{ mine: LabStats; neutral: LabStats } | null>(null);
  const [busy, setBusy] = useState(false);
  const key = keyOf(club.tactics) + '|' + (opp?.id ?? '');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    setBusy(true);
    window.clearTimeout(timer.current);
    // kurz warten, bis die Wahl steht; dann messen (~0,1–0,3 s)
    timer.current = window.setTimeout(() => {
      try { setRes(measureTactics(club, players, { ...club.tactics }, year, GAMES, opp ?? undefined)); } catch { setRes(null); }
      setBusy(false);
    }, 350);
    return () => window.clearTimeout(timer.current);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!res) return <div className="dnote">{busy ? 'Die Wirkung wird gemessen …' : 'Keine Messung möglich.'}</div>;
  return (
    <div className={`txe${busy ? ' busy' : ''}`}>
      <div className="txe-head">
        {HEAD.map(([label, k, bad, kind]) => {
          const d = res.mine[k] - res.neutral[k];
          const tiny = Math.abs(d) < 0.03;
          return (
            <div key={label} className="txe-kpi">
              <span className="txe-kpi-l">{label} je Spiel</span>
              <b>{show(res.mine[k], kind)}</b>
              <i className={tiny ? '' : (d > 0) !== bad ? 'pos' : 'neg'}>{delta(d, kind)}</i>
            </div>
          );
        })}
      </div>
      <div className="txe-groups">
        {GROUPS.map(([name, rows]) => (
          <div key={name} className="txe-group">
            <h5>{name}</h5>
            {rows.map(([label, k, bad, kind]) => {
              const a = res.mine[k], b = res.neutral[k];
              const diff = a - b;
              const rel = kind === 'p' ? diff / 0.08 : kind === 'g' ? diff / 0.35 : diff / Math.max(1, Math.abs(b) * 0.4);
              const d = Math.max(-1, Math.min(1, rel));
              const tiny = Math.abs(d) < 0.04;
              const cls = tiny ? 'flat' : (diff > 0) !== bad ? 'pos' : 'neg';
              return (
                <div key={label} className="txe-row" title={`Neutral: ${show(b, kind)}`}>
                  <span className="txe-l">{label}</span>
                  <span className="txe-t"><span className={cls} style={{ left: d < 0 ? `${50 + d * 50}%` : '50%', width: `${Math.abs(d) * 50}%` }} /></span>
                  <span className={`txe-v ${cls}`}>{show(a, kind)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="txe-foot">{GAMES * 2} Spiele {opp ? `gegen ${opp.name}` : 'gegen dein Spiegelbild'} · Balken: Unterschied zur neutralen Taktik</div>
    </div>
  );
}
