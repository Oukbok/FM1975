// =============================================================================
// Presse: kleine Bausteine der Zeitungsseite (Bild, Ergebniszeile, Kurzname).
// =============================================================================
import type { ReactNode } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import PlayerAvatar from '../../../components/PlayerAvatar';
import { ClubLink } from '../../../components/club/ClubLink';
import { clubView } from '../../../game/clubProfile';
import type { Game } from '../../../game/state';
import type { PressImage, PressResult } from '../../../game/press/types';
import type { Player } from '../../../types';

export interface PressApi {
  g: Game;
  openPlayer: (id: string) => void;
  openStory: (id: string) => void;
  onWatch: (matchId: string) => void;
}

const playerOf = (g: Game, id: string) => g.players[id] ?? g.youthPlayers[id];
export const clubShort = (g: Game, id: string) => clubView(g, id, Number(g.season.slice(0, 4))).name;

/** Wappen eines beliebigen Vereins (auch Unterklasse/Ausland) – klickbar, wenn es ein Profil gibt. */
export function Crest({ g, id, size }: { g: Game; id: string; size: number }) {
  const v = clubView(g, id, Number(g.season.slice(0, 4)));
  const foreign = !g.clubs[id] && !g.simClubs?.[id] && g.euroClubs?.[id];
  const crest = foreign
    ? <span className="np-dot" style={{ width: size * 0.5, height: size * 0.5, background: g.euroClubs![id].colors.primary }} />
    : <ClubCrest club={v as never} size={size} />;
  return <ClubLink id={id} className="np-crest">{crest}</ClubLink>;
}

/** Gesicht eines Spielers – Klick öffnet das Spielerprofil. */
export function Face({ api, id, size, caption }: { api: PressApi; id: string; size: number; caption?: boolean }) {
  const p = playerOf(api.g, id);
  if (!p) return null;
  return (
    <span className="np-face" role="button" tabIndex={0} title={`${p.fullName} – Spielerprofil öffnen`}
      onClick={(e) => { e.stopPropagation(); api.openPlayer(id); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); api.openPlayer(id); } }}>
      <PlayerAvatar player={p} club={api.g.clubs[p.clubId]} size={size} />
      {caption && <span className="np-face-cap">{p.lastName}</span>}
    </span>
  );
}

/** Bild eines Artikels (Gesicht, Trainer oder Wappen). */
export function StoryImage({ api, img, size }: { api: PressApi; img: PressImage | undefined; size: number }) {
  if (!img) return null;
  if (img.kind === 'player') return <Face api={api} id={img.id} size={size} />;
  if (img.kind === 'coach') {
    const fake = { id: `coach:${img.id}`, fullName: img.name } as Player;
    const pic = <span className="np-face np-coach" title={img.name}><PlayerAvatar player={fake} size={size} staff year={Number(api.g.calendar.currentDate.slice(0, 4))} /></span>;
    return img.clubId ? <ClubLink id={img.clubId}>{pic}</ClubLink> : pic;
  }
  return <span className="np-crestimg" style={{ width: size, height: size * 1.15 }}><Crest g={api.g} id={img.id} size={Math.round(size * 0.8)} /></span>;
}

/** Ergebniszeile mit Wappen; Klick auf das Ergebnis öffnet den Spielbericht. */
export function ResultLine({ api, r, my }: { api: PressApi; r: PressResult; my: string }) {
  const g = api.g;
  const score: ReactNode = <b>{r.hg}:{r.ag}</b>;
  return (
    <div className={`np-res ${r.matchId ? 'clickable' : ''}`} onClick={() => r.matchId && api.onWatch(r.matchId)}
      title={r.matchId ? 'Spielbericht öffnen' : undefined}>
      <span className={`np-res-team h ${r.home === my ? 'me' : ''}`}><ClubLink id={r.home}><span className="np-res-name">{clubShort(g, r.home)}</span></ClubLink><Crest g={g} id={r.home} size={20} /></span>
      <span className="np-res-score">{score}{r.note && <small>{r.note}</small>}</span>
      <span className={`np-res-team ${r.away === my ? 'me' : ''}`}><Crest g={g} id={r.away} size={20} /><ClubLink id={r.away}><span className="np-res-name">{clubShort(g, r.away)}</span></ClubLink></span>
    </div>
  );
}
