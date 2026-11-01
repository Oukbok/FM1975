// =============================================================================
// Bausteine der Ziehungs-Show: Lostöpfe, Kugel, Enthüllung, Paarungsliste,
// Zusammenfassung. Rahmen + Steuerung in DrawShow.tsx, Stil in 28-draw.css.
// =============================================================================
import { useEffect, useRef } from 'react';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { ClubLink } from '../../components/club/ClubLink';
import { fmtDateFull } from '../../ui/format';
import type { DrawBall, DrawRecord } from '../../types/draw';
import type { ShowClub } from './drawScript';
import type { DrawPhase } from './useDrawPlayer';

type Clubs = Record<string, ShowClub>;

/** Schriftgröße so, dass lange Vereinsnamen nicht abgeschnitten werden. */
function fitSize(name: string, base: number, fitChars: number): number {
  const n = name.length;
  return n <= fitChars ? base : Math.max(Math.round(base * 0.55), Math.round(base * fitChars / n));
}

/** Kugel als SVG (neutraler Schiefer, Topf B mit Bernstein-Band). */
export function BallSvg({ pot, size = 46, no }: { pot: number; size?: number; no?: number }) {
  const gid = `drb${pot}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="dr-ballsvg">
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c9d0d9" />
          <stop offset="100%" stopColor="#6b7480" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill={`url(#${gid})`} />
      {pot === 1 && <path d="M2.5 20 a17.5 17.5 0 0 0 35 0" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.9" />}
      {no != null && <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1a1d23" fontFamily="Oswald, Barlow, sans-serif">{no}</text>}
    </svg>
  );
}

/** Lostöpfe links: Glasschale mit Kugeln + Liste der Vereine im Topf. */
export function PotsPanel({ rec, clubs, shown, activePot }: { rec: DrawRecord; clubs: Clubs; shown: number; activePot: number | null }) {
  // Ein Verein ist „draußen“, sobald seine endgültige (nicht zurückgelegte) Kugel gezogen ist.
  const out = new Set(rec.balls.slice(0, shown).filter((b) => !b.rejected).map((b) => b.id));
  return (
    <div className="dr-pots">
      {rec.pots.map((p, pi) => {
        const left = p.ids.filter((id) => !out.has(id));
        return (
          <div key={pi} className={`dr-pot ${activePot === pi ? 'active' : ''}`}>
            <div className="dr-pot-head">
              <span className="dr-pot-name">{p.label}</span>
              <span className="dr-pot-count">{left.length} / {p.ids.length}</span>
            </div>
            <div className="dr-bowl" aria-hidden="true">
              <svg viewBox="0 0 300 120" className="dr-bowl-glass" preserveAspectRatio="none">
                <path d="M10 10 Q10 112 150 112 Q290 112 290 10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                <ellipse cx="150" cy="10" rx="140" ry="7" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="dr-bowl-balls">
                {left.slice(0, 24).map((id, i) => (
                  <span key={id} className="dr-bowl-ball" style={{ animationDelay: `${(i % 7) * 0.31}s` }}><BallSvg pot={pi} size={left.length > 12 ? 24 : 30} /></span>
                ))}
              </div>
            </div>
            <div className="dr-pot-list">
              {p.ids.map((id, i) => {
                const c = clubs[id];
                return (
                  <div key={id} className={`dr-pot-row ${out.has(id) ? 'out' : ''} ${c.mine ? 'mine' : ''}`}>
                    <span className="dr-no">{i + 1}</span>
                    <ClubCrest club={c.crest} size={24} />
                    <span className="dr-pot-club">{c.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Mitte: rollende Kugel, Öffnen, Verein groß; bei zweiter Kugel die Paarung. */
export function StageReveal({ rec, clubs, ball, phase, step, reduced }: {
  rec: DrawRecord; clubs: Clubs; ball: DrawBall | undefined; phase: DrawPhase; step: number; reduced: boolean;
}) {
  if (!ball) return null;
  const c = clubs[ball.id];
  const pair = ball.rejected ? null : rec.pairs[ball.pair];
  const firstIdx = pair ? rec.balls.findIndex((b) => b.pair === ball.pair && !b.rejected) : -1;
  const isSecond = !!pair && firstIdx !== step;
  const fromLeft = rec.pots.length === 1 || ball.pot === 0;
  if (phase === 'roll') {
    return (
      <div className="dr-reveal">
        <div key={`r${step}`} className={`dr-roll ${fromLeft ? 'l' : 'r'} ${reduced ? 'still' : ''}`}><BallSvg pot={ball.pot} size={150} /></div>
      </div>
    );
  }
  if (phase === 'open') {
    return (
      <div className="dr-reveal">
        <div key={`o${step}`} className="dr-open">
          <span className="dr-half top"><BallSvg pot={ball.pot} size={150} /></span>
          <span className="dr-slip">Los {ball.no}</span>
          <span className="dr-half bot"><BallSvg pot={ball.pot} size={150} /></span>
        </div>
      </div>
    );
  }
  if (isSecond && pair) {
    const h = clubs[pair.home], a = clubs[pair.away];
    return (
      <div className="dr-reveal">
        <div key={`p${step}`} className={`dr-pairing ${h.mine || a.mine ? 'mine' : ''}`}>
          <PairSide c={h} label="Heim" fresh={h.id === ball.id} />
          <span className="dr-vs">gegen</span>
          <PairSide c={a} label="Gast" fresh={a.id === ball.id} />
        </div>
        {pair.swapped && <div className="dr-note"><Icon name="home" size={22} /> Heimrecht nach Regel getauscht</div>}
      </div>
    );
  }
  return (
    <div className="dr-reveal">
      <div key={`c${step}`} className={`dr-card ${c.mine ? 'mine' : ''} ${ball.rejected ? 'rejected' : ''}`}>
        <div className="dr-card-crest"><ClubCrest club={c.crest} size={210} /></div>
        <div className="dr-card-txt">
          <div className="dr-card-no">Los {ball.no} · {rec.pots[ball.pot]?.label}{ball.group != null && rec.groups && !rec.opponents ? ` → Gruppe ${rec.groups[ball.group]?.name ?? ''}` : ''}</div>
          <div className="dr-card-name" style={{ fontSize: fitSize(c.name, 88, 16) }}>{c.name}</div>
          <div className="dr-card-meta">{c.foreign ? c.country : c.amateur ? 'Amateurverein' : 'Profiverein'} · Stärke {c.strength}</div>
          {c.mine && <span className="dr-pill">Dein Verein</span>}
          {ball.rejected && <span className="dr-pill dim">Zurück in den Topf</span>}
        </div>
      </div>
    </div>
  );
}

function PairSide({ c, label, fresh }: { c: ShowClub; label: string; fresh: boolean }) {
  return (
    <div className={`dr-side ${c.mine ? 'mine' : ''} ${fresh ? 'fresh' : ''}`}>
      <ClubLink id={c.id}><ClubCrest club={c.crest} size={170} /></ClubLink>
      <div className="dr-side-name" style={{ fontSize: fitSize(c.name, 50, 13) }}>{c.name}</div>
      <div className="dr-side-lbl">{label}</div>
    </div>
  );
}

/** Rechts: Paarungen bauen sich auf. */
export function PairsPanel({ rec, clubs, shown }: { rec: DrawRecord; clubs: Clubs; shown: number }) {
  const seen = rec.balls.slice(0, shown).filter((b) => !b.rejected);
  const byPair = new Map<number, string[]>();
  for (const b of seen) byPair.set(b.pair, [...(byPair.get(b.pair) ?? []), b.id]);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { const el = ref.current?.querySelector('.dr-prow.fresh'); (el as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' }); }, [shown]);
  const last = seen[seen.length - 1]?.pair;
  return (
    <div className="dr-pairs">
      <div className="dr-panel-head"><span>Paarungen</span><span className="dr-dim">{[...byPair.values()].filter((v) => v.length === 2).length} / {rec.pairs.length}</span></div>
      <div className="dr-prows" ref={ref}>
        {rec.pairs.map((p, i) => {
          const got = byPair.get(i);
          if (!got) return null;
          const done = got.length === 2;
          const h = done ? clubs[p.home] : clubs[got[0]];
          const a = done ? clubs[p.away] : null;
          return (
            <div key={i} className={`dr-prow ${h.mine || a?.mine ? 'mine' : ''} ${i === last ? 'fresh' : ''}`}>
              <span className="dr-pno">{i + 1}</span>
              <ClubLink id={h.id}><span className="dr-pclub"><ClubCrest club={h.crest} size={30} /><span>{h.name}</span></span></ClubLink>
              <span className="dr-pdash">–</span>
              {a ? <ClubLink id={a.id}><span className="dr-pclub"><ClubCrest club={a.crest} size={30} /><span>{a.name}</span></span></ClubLink>
                : <span className="dr-pclub wait"><span className="dr-qm">?</span></span>}
              {done && p.swapped && <span className="dr-tag" title="Heimrecht für den Amateurverein">Heimrecht</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Ende: dein Los groß (Gegner, Termin, Heim/Auswärts, Stärkevergleich). */
export function DrawSummary({ rec, clubs, myId, endLine, onClose, closeLabel = 'Schließen' }: { rec: DrawRecord; clubs: Clubs; myId: string; endLine: string; onClose: () => void; closeLabel?: string }) {
  const my = rec.pairs.find((p) => p.home === myId || p.away === myId);
  const top = [...rec.pairs].sort((x, y) => Math.min(clubs[y.home].strength, clubs[y.away].strength) - Math.min(clubs[x.home].strength, clubs[x.away].strength))[0];
  const show = my ?? top;
  const h = clubs[show.home], a = clubs[show.away];
  const me = my ? clubs[myId] : null;
  const opp = my ? (my.home === myId ? a : h) : null;
  const diff = me && opp ? opp.strength - me.strength : 0;
  const verdict = !opp ? '' : diff >= 4 ? 'Der Gegner ist favorisiert.' : diff <= -4 ? 'Dein Verein geht als Favorit ins Spiel.' : 'Ein Duell auf Augenhöhe.';
  const max = Math.max(h.strength, a.strength, 1);
  return (
    <div className="dr-summary">
      <div className="dr-sum-kicker">{my ? 'Dein Los' : 'Dein Verein ist nicht dabei – das Topspiel der Runde'}</div>
      <div className="dr-sum-pair">
        <PairSide c={h} label="Heim" fresh={false} />
        <div className="dr-sum-mid">
          <span className="dr-vs">gegen</span>
          <span className="dr-sum-date">{fmtDateFull(rec.matchDate)}</span>
          {my && <span className="dr-pill">{my.home === myId ? 'Heimspiel' : 'Auswärtsspiel'}</span>}
        </div>
        <PairSide c={a} label="Gast" fresh={false} />
      </div>
      <div className="dr-sum-bars">
        {[h, a].map((c) => (
          <div key={c.id} className={`dr-bar ${c.mine ? 'mine' : ''}`}>
            <span className="dr-bar-lbl">{c.short}</span>
            <span className="dr-bar-track"><span style={{ width: `${Math.round((c.strength / max) * 100)}%` }} /></span>
            <span className="dr-bar-val">{c.strength}</span>
          </div>
        ))}
      </div>
      <div className="dr-sum-line">{verdict} {endLine}</div>
      <button className="dr-close" onClick={onClose}>{closeLabel}</button>
    </div>
  );
}
