// Gemeinsame Bausteine des Vereinsprofils (Reiter in src/components/club/).
import { ClubMatchLine, ClubProfileData } from '../../game/clubProfile';
import type { SeasonPlacement } from '../../game/clubRecords';
import { Game } from '../../game/state';
import { Club, ClubCoach } from '../../types';
import { getFormation } from '../../data/formations';
import { fmtDateShort } from '../../ui/format';
import { DashBox, Empty, KV, Meter } from '../../ui/DashPage';
import { ClubLink } from './ClubLink';

export interface ClubTabProps {
  g: Game;
  d: ClubProfileData;
  openPlayer: (id: string) => void;
}

export const FORM_LETTER = { W: 'S', D: 'U', L: 'N' } as const;

/** Spielzeile: Datum · Wettbewerb · Gegner (H/A, klickbar) · Ergebnis. */
export function MatchLine({ m }: { m: ClubMatchLine }) {
  return (
    <div className="dlist-row cmx-match">
      <span className="meta cmx-date">{fmtDateShort(m.date).dmy}</span>
      <span className="cmx-comp" title={m.comp}>{m.comp === 'Liga' || m.comp === 'Pokal' ? m.comp : 'Europa'}</span>
      <span className="grow cmx-opp"><ClubLink id={m.oppId}>{m.opponent}</ClubLink> <span className="muted">({m.homeAway})</span></span>
      <span className={`dres ${m.result ? 'dres-' + m.result : ''}`}>{m.score ?? '–:–'}</span>
    </div>
  );
}

// Trainer der KI-Vereine: `Club.coach` / `Club.coachHistory` (game/coachCarousel.ts).
const coachOf = (club?: Club): ClubCoach | undefined => club?.coach;
const PHIL_DE: Record<string, string> = { jugend: 'Jugend', einkauf: 'Einkauf', ausgewogen: 'Ausgewogen' };
const REASON_DE: Record<string, string> = { entlassen: 'entlassen', ruhestand: 'Ruhestand', abgeworben: 'abgeworben', vertragsende: 'Vertragsende' };

const MGR_STYLE_DE: Record<string, string> = { defensive: 'defensiv', balanced: 'ausgewogen', attacking: 'offensiv', counter: 'Konter' };

export function CoachBox({ g, d }: { g: Game; d: ClubProfileData }) {
  if (d.isPlayerClub) {
    const m = g.manager;
    return (
      <DashBox title="Trainer" icon="tactics" right="du">
        <div className="cmx-coach-name">{m.name}</div>
        <KV k="Alter" v={`${Number(g.calendar.currentDate.slice(0, 4)) - m.birthYear} Jahre`} />
        <KV k="Nationalität" v={m.nationality} />
        <KV k="Spielstil" v={MGR_STYLE_DE[m.style] ?? m.style} />
      </DashBox>
    );
  }
  const c = coachOf(d.fullClub);
  return (
    <DashBox title="Trainer" icon="tactics" right={c ? `seit ${c.since.slice(0, 4)}` : undefined}>
      {c ? <>
        <div className="cmx-coach-name">{c.name}</div>
        <KV k="Alter · Nationalität" v={`${c.age} · ${c.nationality}`} />
        <KV k="Spielstil" v={MGR_STYLE_DE[c.style] ?? c.style} />
        <KV k="Philosophie" v={PHIL_DE[c.philosophy] ?? c.philosophy} />
        <KV k="Ansehen" v={Math.round(c.reputation)} />
        {c.preferredFormation && <KV k="Lieblingssystem" v={getFormation(c.preferredFormation).label} />}
        <Meter label="Druck vom Vorstand" value={Math.round(c.pressure)} max={100} text={`${Math.round(c.pressure)} %`}
          color={c.pressure >= 70 ? 'var(--red)' : undefined} />
        {(d.fullClub?.coachHistory ?? []).slice(-2).reverse().map((h) => (
          <KV key={h.name + h.to} k={`Vorgänger ${h.from.slice(0, 4)}–${h.to.slice(0, 4)}`} v={`${h.name} (${REASON_DE[h.reason] ?? h.reason})`} />
        ))}
      </> : <Empty icon="tactics">Trainer: unbekannt</Empty>}
    </DashBox>
  );
}

/** Mannschaftsteil-Vergleich als Spiegelbalken: dieser Verein links, dein Verein rechts. */
export function UnitCompare({ d, ownName }: { d: ClubProfileData; ownName: string }) {
  const w = (v: number) => `${Math.max(4, Math.min(100, ((v - 30) / 65) * 100))}%`;
  return (
    <div className="cmx-cmp">
      <div className="cmx-cmp-head">
        <span className="cmx-cmp-name">{d.shortName}</span><span className="cmx-cmp-name r">{ownName} (du)</span>
      </div>
      {d.units.map((u) => {
        const better = u.theirs > u.ours ? 'them' : u.ours > u.theirs ? 'us' : '';
        return (
          <div key={u.key} className="cmx-cmp-row">
            <span className={`cmx-cmp-v ${better === 'them' ? 'hi' : ''}`}>{u.theirs || '–'}</span>
            <span className="cmx-cmp-track l"><span className={`cmx-cmp-fill ${better === 'them' ? 'hi' : ''}`} style={{ width: w(u.theirs) }} /></span>
            <span className="cmx-cmp-lbl">{u.label}</span>
            <span className="cmx-cmp-track"><span className={`cmx-cmp-fill ${better === 'us' ? 'hi' : ''}`} style={{ width: w(u.ours) }} /></span>
            <span className={`cmx-cmp-v r ${better === 'us' ? 'hi' : ''}`}>{u.ours || '–'}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Kurzurteil aus dem Mannschaftsteil-Vergleich. */
export function verdict(d: ClubProfileData): string {
  if (!d.units.length) return '';
  const diff = d.units.map((u) => ({ u, x: u.theirs - u.ours })).sort((a, b) => b.x - a.x);
  const total = diff.reduce((s, e) => s + e.x, 0) / diff.length;
  const lead = total >= 4 ? 'Klar stärker besetzt als dein Team.' : total >= 1.5 ? 'Etwas stärker besetzt als dein Team.'
    : total <= -4 ? 'Klar schwächer besetzt als dein Team.' : total <= -1.5 ? 'Etwas schwächer besetzt als dein Team.' : 'Auf Augenhöhe mit deinem Team.';
  const best = diff[0], worst = diff[diff.length - 1];
  const parts = [lead];
  if (best.x >= 3) parts.push(`Vorsicht im Bereich ${best.u.label} (+${best.x}).`);
  if (worst.x <= -3) parts.push(`Angreifbar: ${worst.u.label} (${worst.x}).`);
  return parts.join(' ');
}

// -----------------------------------------------------------------------------
// Verlaufslinie der Platzierungen über alle Ligaebenen
// -----------------------------------------------------------------------------
const TIER_NAME = (t: number) => (t >= 100 ? 'DDR' : `${t}. Liga`);

export function PlacementChart({ seasons }: { seasons: SeasonPlacement[] }) {
  if (!seasons.length) return null;
  // Ebenen als Bänder untereinander (je Ebene so hoch wie ihre größte Liga).
  const tiers = [...new Set(seasons.map((s) => s.tier))].sort((a, b) => a - b);
  const bandH: Record<number, number> = {};
  for (const t of tiers) bandH[t] = Math.max(...seasons.filter((s) => s.tier === t).map((s) => s.size));
  const off: Record<number, number> = {};
  let acc = 0;
  for (const t of tiers) { off[t] = acc; acc += bandH[t]; }
  const total = acc;
  const W = 820, H = 240, padL = 64, padR = 14, padT = 12, padB = 26;
  const n = seasons.length;
  const x = (i: number) => padL + (n === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1));
  const y = (s: SeasonPlacement) => padT + ((off[s.tier] + s.pos - 0.5) / total) * (H - padT - padB);
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const path = seasons.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s).toFixed(1)}`).join(' ');
  return (
    <svg className="cmx-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Platzierungen der vergangenen Saisons">
      {tiers.map((t, i) => {
        const y0 = padT + (off[t] / total) * (H - padT - padB);
        const h = (bandH[t] / total) * (H - padT - padB);
        return (
          <g key={t}>
            <rect x={padL} y={y0} width={W - padL - padR} height={h} className={i % 2 ? 'cmx-band alt' : 'cmx-band'} />
            <text x={padL - 8} y={y0 + 14} textAnchor="end" className="cmx-axis">{TIER_NAME(t)}</text>
          </g>
        );
      })}
      <path d={path} className="cmx-line" />
      {seasons.map((s, i) => (
        <g key={s.season}>
          <circle cx={x(i)} cy={y(s)} r={s.pos === 1 ? 6 : 4.5} className={`cmx-dot ${s.pos === 1 ? 'top' : ''} ${s.live ? 'live' : ''}`}>
            <title>{`${s.season}: ${s.pos}. Platz · ${s.league}${s.live ? ' (laufend)' : ''}`}</title>
          </circle>
          {(n <= 12 || s.pos === 1 || i === n - 1) && (
            <text x={x(i)} y={y(s) - 9} textAnchor="middle" className="cmx-val">{s.pos}.</text>
          )}
          {i % labelEvery === 0 || i === n - 1 ? (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="cmx-axis">{s.season.slice(2)}</text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
