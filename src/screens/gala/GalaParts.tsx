// =============================================================================
// GALA GOLDENER BALL — Bausteine: Pokal (SVG), Nationalitäts-Etikett, Preisträger-Karte,
// Liste der Plätze 4–10. CSS 28-awards.css (.gb-*).
// =============================================================================
import type { CSSProperties } from 'react';
import PlayerAvatar from '../../components/PlayerAvatar';
import { GB_TITLE_LABEL } from '../../engine/goldenBall';
import type { GBEntry } from '../../game/goldenBallGame';
import type { Game } from '../../game/state';
import type { Club, Player } from '../../types';
import { TeamName } from '../../views/statistiken/competition/parts';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

/** Der Goldene Ball: Kugel mit Nähten auf schlankem Sockel (eigene Zeichnung, kein Markenlogo). */
export function GoldenBallTrophy({ size = 180 }: { size?: number }) {
  return (
    <svg className="gb-trophy" width={size} height={size * 1.25} viewBox="0 0 160 200" aria-hidden>
      <defs>
        <radialGradient id="gbBall" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="var(--text)" stopOpacity="0.95" />
          <stop offset="22%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.9" />
        </radialGradient>
        <linearGradient id="gbBase" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--panel-2)" />
          <stop offset="50%" stopColor="var(--elevated)" />
          <stop offset="100%" stopColor="var(--bg-2)" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="74" r="62" fill="url(#gbBall)" />
      <g fill="none" stroke="var(--bg)" strokeOpacity="0.35" strokeWidth="1.6">
        <path d="M80 50 L101 65 L93 90 L67 90 L59 65 Z" />
        <path d="M80 50 L80 14 M101 65 L135 52 M93 90 L112 120 M67 90 L48 120 M59 65 L25 52" />
        <path d="M80 14 Q112 22 135 52 M135 52 Q140 92 112 120 M112 120 Q80 140 48 120 M48 120 Q20 92 25 52 M25 52 Q48 22 80 14" strokeOpacity="0.2" />
      </g>
      <path d="M62 136 L98 136 L92 150 L68 150 Z" fill="url(#gbBase)" />
      <rect x="56" y="150" width="48" height="12" rx="2" fill="url(#gbBase)" />
      <rect x="46" y="162" width="68" height="22" rx="3" fill="url(#gbBase)" stroke="var(--border)" />
      <rect x="58" y="169" width="44" height="8" rx="1" fill="var(--gold)" opacity="0.55" />
    </svg>
  );
}

/** Staatsangehörigkeit als kleines eckiges Etikett (Kürzel). */
export function NatTag({ nat }: { nat: string }) {
  return <span className="gb-nat" title={`Nationalität: ${nat}`}>{nat}</span>;
}

/** Gesicht: vorhandener Spieler oder gezeichneter Platzhalter aus ID/Name (Auslandsstar). */
export function GalaFace({ g, e, size }: { g: Game; e: GBEntry; size: number }) {
  const p = g.players[e.p] ?? ({ id: e.p, fullName: e.n } as Player);
  const c = g.clubs[e.c] ?? (g.euroClubs?.[e.c] ? ({ colors: g.euroClubs[e.c].colors, shortName: g.euroClubs[e.c].shortName } as unknown as Club) : undefined);
  return <span className="gb-face" style={{ width: size, height: size * 1.15 }}><PlayerAvatar player={p} club={c} size={size} /></span>;
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
          <GalaFace g={g} e={e} size={place === 1 ? 112 : 88} />
          <div className="gb-pod-name">{e.n}</div>
          <div className="gb-pod-meta"><NatTag nat={e.nat} /><span className="pos-badge">{e.pos}</span><span>{e.a} Jahre</span></div>
          <div className="gb-pod-club"><TeamName g={g} id={e.c} season={season} size={22} /></div>
          <div className="gb-kpis">{kpis(e).map((x) => <div key={x.k} className="gb-kpi"><b>{x.v}</b><span>{x.k}</span></div>)}</div>
          {e.tt?.length ? <div className="gb-titles">{e.tt.map((t) => <span key={t} className="gb-title">{GB_TITLE_LABEL[t]}</span>)}</div> : null}
          {e.why && <p className="gb-why">{e.why}</p>}
          {e.est && <p className="gb-est">Werte des Auslandsvereins geschätzt</p>}
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
          <span className="gb-rest-name"><NatTag nat={e.nat} /><span className="rl-name">{e.n}</span></span>
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
