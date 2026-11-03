// =============================================================================
// Mittelkarte der Gala-Auslosung: Pokal-Medaillon, Lostopf als Raster aller
// Teilnehmer (gezogene Vereine blenden aus, das Feld bleibt stehen) und die
// Paarungsliste „Heim – Gast“, die sich darunter aufbaut. Gruppen-/Ligaphase:
// DrawGroups.tsx. Rahmen + Steuerung: DrawShow.tsx, Stil: 28-draw.css (.dg-*).
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import type { DrawRecord } from '../../types/draw';
import type { ShowClub } from './drawScript';

type Clubs = Record<string, ShowClub>;

/** Größenstufe nach Teilnehmerzahl (Schrift/Wappen im Raster und in der Liste). */
export function boardSize(rec: DrawRecord): 'xl' | 'l' | 'm' | 's' {
  const n = rec.pots.reduce((s, p) => s + p.ids.length, 0);
  return n > 40 ? 'xl' : n > 20 ? 'l' : n > 12 ? 'm' : 's';
}

/** Gezeichnetes Pokal-Medaillon (silberner Pokal im Schieferring, Wettbewerbsfarbe als Ring). */
export function TrophyMark({ size = 100 }: { size?: number }) {
  return (
    <svg className="dg-trophy" width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <linearGradient id="dgt-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#c5ced9" />
          <stop offset="1" stopColor="#7d8897" />
        </linearGradient>
        <radialGradient id="dgt-bg" cx="40%" cy="35%">
          <stop offset="0" stopColor="#2c3546" />
          <stop offset="1" stopColor="#141a25" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#dgt-bg)" stroke="#5d6879" strokeWidth="2" />
      <circle cx="40" cy="40" r="33" fill="none" stroke="var(--dg-comp)" strokeWidth="3" />
      <path d="M27 20 H53 V30 C53 40 47 46 40 46 C33 46 27 40 27 30 Z" fill="url(#dgt-silver)" />
      <path d="M27 23 C19 23 19 35 29 38 M53 23 C61 23 61 35 51 38" fill="none" stroke="url(#dgt-silver)" strokeWidth="3" />
      <rect x="37.5" y="46" width="5" height="7" fill="#aab4c2" />
      <path d="M31 53 H49 L51 60 H29 Z" fill="url(#dgt-silver)" />
      <rect x="33" y="55.5" width="14" height="2" fill="var(--accent)" opacity="0.85" />
      <path d="M31 23 C31 33 34 40 38 43" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.6" />
    </svg>
  );
}

/** Vereine, deren endgültige (nicht zurückgelegte) Kugel schon gezogen ist. */
export function drawnSet(rec: DrawRecord, shown: number): Set<string> {
  return new Set(rec.balls.slice(0, shown).filter((b) => !b.rejected).map((b) => b.id));
}

/** Lostopf als Raster: je Topf ein Abschnitt; gezogene Vereine blenden aus, das Feld bleibt leer. */
export function PoolGrid({ rec, clubs, shown, back, activePot }: {
  rec: DrawRecord; clubs: (id: string) => ShowClub; shown: number; back?: string | null; activePot: number | null;
}) {
  const out = drawnSet(rec, shown);
  const size = boardSize(rec);
  const maxPot = Math.max(...rec.pots.map((p) => p.ids.length));
  const single = rec.pots.length === 1;
  // Ein Topf mit bis zu 40 Vereinen: breitere Felder (6 Spalten), damit lange Namen ausgeschrieben bleiben.
  const cols = !single && maxPot <= 10 ? maxPot : size === 's' ? 4 : size === 'm' && single ? 4 : size === 'l' && single ? 6 : 8;
  const crest = size === 'xl' ? 26 : size === 'l' ? 34 : size === 'm' ? 42 : 48;
  return (
    <div className={`dg-pool dg-${size} ${cols >= 8 ? 'dense' : ''}`}>
      {rec.pots.map((p, pi) => {
        const left = p.ids.filter((id) => !out.has(id)).length;
        return (
          <div key={pi} className={`dg-pot ${activePot === pi ? 'active' : ''}`}>
            {rec.pots.length > 1 && (
              <div className="dg-pot-head"><span>{p.label}</span><span className="dg-pot-n">{left} / {p.ids.length}</span></div>
            )}
            <div className="dg-pot-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {p.ids.map((id) => {
                const c = clubs(id);
                return (
                  <div key={id} className={`dg-cell ${out.has(id) ? 'out' : ''} ${c.mine ? 'me' : ''} ${back === id ? 'back' : ''}`} aria-hidden={out.has(id)}>
                    <ClubCrest club={c.crest} size={crest} />
                    <span className="dg-cell-name">{c.name}</span>
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

function Side({ c, side, crest }: { c: ShowClub | null; side: 'home' | 'away'; crest: number }) {
  if (!c) return <span className={`dg-side ${side} wait`}><span className="dg-qm">?</span></span>;
  return (
    <ClubLink id={c.id}>
      <span className={`dg-side ${side} ${c.mine ? 'me' : ''}`}>
        <ClubCrest club={c.crest} size={crest} />
        <span className="dg-side-name">{c.name}</span>
      </span>
    </ClubLink>
  );
}

/** Paarungsliste: neue Paarungen erscheinen in fester Spaltenordnung, die jüngste kurz hervorgehoben. */
export function PairList({ rec, clubs, shown }: { rec: DrawRecord; clubs: Clubs; shown: number }) {
  const seen = rec.balls.slice(0, shown).filter((b) => !b.rejected);
  const byPair = new Map<number, string[]>();
  for (const b of seen) byPair.set(b.pair, [...(byPair.get(b.pair) ?? []), b.id]);
  const last = seen[seen.length - 1];
  const n = rec.pairs.length;
  const cols = n > 8 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const size = boardSize(rec);
  return (
    <div className={`dg-pairs dg-${size} ${cols === 1 ? 'one' : ''}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, var(--dg-row))` }}>
      {rec.pairs.map((p, i) => {
        const got = byPair.get(i);
        if (!got) return <div key={i} className="dg-prow empty" style={slot(i, rows)} />;
        const done = got.length === 2;
        const h = clubs[done ? p.home : got[0]];
        const a = done ? clubs[p.away] : null;
        const crest = size === 'xl' ? 28 : size === 'l' ? 40 : size === 'm' ? 46 : 52;
        return (
          <div key={i} style={slot(i, rows)}
            className={`dg-prow ${h.mine || a?.mine ? 'mine' : ''} ${last?.pair === i ? 'fresh' : ''}`}>
            <span className="dg-pno">{i + 1}</span>
            <Side c={h} side="home" crest={crest} />
            <span className="dg-dash">–</span>
            <Side c={a} side="away" crest={crest} />
            <span className="dg-ptag">{done && p.swapped ? <span className="dr-tag" title="Heimrecht für den Amateurverein">Heimrecht</span> : null}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Feste Lage im Raster (spaltenweise), damit nichts springt. */
function slot(i: number, rows: number) {
  return { gridRow: (i % rows) + 1, gridColumn: Math.floor(i / rows) + 1 };
}
