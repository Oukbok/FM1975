// =============================================================================
// GALA KRISTALLSTERN — Bausteine: Pokal (SVG), Nationalitäts-Etikett, Preisträger-Karte,
// Liste der Plätze 4–10. CSS 28-awards.css (.gb-*).
// =============================================================================
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import type { CSSProperties } from 'react';
import PlayerAvatar, { hasFacePhoto } from '../../components/PlayerAvatar';
import { GB_TITLE_LABEL } from '../../engine/goldenBall';
import type { GBEntry } from '../../game/goldenBallGame';
import type { Game } from '../../game/state';
import type { Club, Player } from '../../types';
import { TeamName } from '../../views/stats/competition/parts';
import PosBadge from '../../components/PosBadge';
import { NatFlag } from '../../components/competition/CountryFlag';
import FaceThumb from '../../components/FaceThumb';
import { awardPerson } from '../../views/stats/awards/AwardParts';
import { CrystalStarTrophy } from '../../components/awards/CrystalStarTrophy';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

/** Der Kristallstern: Foto mit gezeichnetem Rückfall (components/awards/CrystalStarTrophy.tsx). */
export function GoldenBallTrophy({ size = 180 }: { size?: number }) {
  return <CrystalStarTrophy size={size} />;
}

/** Staatsangehörigkeit als Landesflagge (Ländername als Tooltip; Wunsch Pascal statt Kürzel-Kasten). */
export function NatTag({ nat, height = 16 }: { nat: string; height?: number }) {
  return <NatFlag nat={nat} height={height} />;
}

/** Gesicht: voller Spieler, Weltspieler (Gesichtsgruppe/Geburtsjahr aus dem Pool) oder gezeichneter Platzhalter aus ID/Name. */
export function GalaFace({ g, e, size }: { g: Game; e: GBEntry; size: number }) {
  const p = awardPerson(g, e.p) ?? ({ id: e.p, fullName: e.n } as Player);
  const c = g.clubs[e.c] ?? (g.euroClubs?.[e.c] ? ({ colors: g.euroClubs[e.c].colors, shortName: g.euroClubs[e.c].shortName } as unknown as Club) : undefined);
  const photo = hasFacePhoto(p);
  return <span className="gb-face" style={{ width: size, height: size * 1.15 }}><PlayerAvatar key={p.id} player={p} club={c} size={photo ? Math.round(size * 1.15 * 512 / 600) : size} /></span>;
}

function kpis(e: GBEntry): { k: string; v: string }[] {
  const keeper = e.pos === 'TW';
  return [
    { k: 'Spiele', v: String(e.ap) },
    { k: 'Note', v: fmt(e.g) },
    keeper ? { k: 'Zu null', v: String(e.cs) } : { k: 'Tore', v: String(e.gl) },
    keeper ? { k: 'Stärke', v: String(e.ov) } : { k: 'Vorlagen', v: String(e.as) },
  ];
}

/** Preisträger auf dem Podest (verdeckt, bis er enthüllt ist). */
export function PodiumCard({ g, e, place, shown, season, mine }: { g: Game; e: GBEntry; place: number; shown: boolean; season: string; mine: boolean }) {
  return (
    <article className={`gb-pod p${place} ${shown ? 'shown' : ''} ${mine ? 'mine' : ''}`} aria-hidden={!shown}>
      <div className="gb-pod-place">{place}</div>
      {shown ? (
        <div className="gb-pod-in" style={{ '--k': 0 } as CSSProperties}>
          <GalaFace g={g} e={e} size={place === 1 ? 112 : place === 2 ? 88 : 80} />
          <div className="gb-pod-name"><PlayerLink id={e.p}>{e.n}</PlayerLink></div>
          <div className="gb-pod-meta"><NatTag nat={e.nat} /><PosBadge pos={e.pos} /><span>{e.a} Jahre</span></div>
          <div className="gb-pod-club"><TeamName g={g} id={e.c} season={season} size={22} /></div>
          <div className="gb-kpis">{kpis(e).map((x) => <div key={x.k} className="gb-kpi"><b>{x.v}</b><span>{x.k}</span></div>)}</div>
          {e.tt?.length ? <div className="gb-titles">{e.tt.map((t) => <span key={t} className="gb-honor">{GB_TITLE_LABEL[t]}</span>)}</div> : null}
          {e.why && <p className="gb-why">{e.why}</p>}
        </div>
      ) : (
        <div className="gb-pod-hidden">Platz {place}</div>
      )}
    </article>
  );
}

/** Plätze 4–10 (die ersten drei stehen auf dem Podest – nichts doppelt). */
export function GalaRest({ g, top, mine, season }: { g: Game; top: GBEntry[]; mine?: string; season: string }) {
  return (
    <div className="rl rl-sm gb-rest">
      {top.slice(3).map((e, i) => (
        <div key={e.p} className={`rl-row gb-rest-row ${e.c === mine ? 'me' : ''}`} style={{ '--k': i } as CSSProperties}>
          <span className="rl-rank">{i + 4}</span>
          <span className="gb-rest-name"><FaceThumb p={awardPerson(g, e.p)} size={26} /><NatTag nat={e.nat} height={14} /><span className="rl-name"><PlayerLink id={e.p}>{e.n}</PlayerLink></span></span>
          <span className="gb-rest-club"><TeamName g={g} id={e.c} season={season} size={18} short /></span>
          <span className="rl-num">{e.pos}</span>
          <span className="rl-num">{e.ap} Sp.</span>
          <span className="rl-num">{e.pos === 'TW' ? `${e.cs} z. n.` : `${e.gl} T · ${e.as} V`}</span>
          <span className="rl-num">Note {fmt(e.g)}</span>
        </div>
      ))}
    </div>
  );
}
