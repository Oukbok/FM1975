// Gemeinsame Bausteine des Länderprofils (components/country/): Reiter-Props, kurze
// Ligatabelle, Spielerzeile mit Gesicht/Position/Verein/Stärke.
import type { SeasonLine } from '../../game/nationSquadLines';
import type { Game } from '../../game/state';
import type { CompSnapshot } from '../../game/competitionView';
import type { CountryRef, NatPlayer } from '../../game/countryProfile';
import type { PyramidData } from '../../game/leaguePyramid';
import type { Position } from '../../types';
import { TeamName, zoneOf } from '../../views/stats/competition/parts';
import { vColor } from '../../ui/format';
import FaceThumb from '../FaceThumb';
import PosBadge from '../PosBadge';
import { PlayerLink } from '../playerMenu/PlayerLink';

export interface CountryTabProps {
  g: Game;
  c: CountryRef;
  pyramid: PyramidData;
  onGoto?: (screen: string) => void;
}

/** Kurze Ligatabelle: Platz (Zone), Verein, Spiele, Tore, Punkte. */
export function MiniTable({ g, snap }: { g: Game; snap: CompSnapshot }) {
  const rows = snap.table ?? [];
  const only = !!snap.placingsOnly || !!snap.roster;
  return (
    <div className="cnx-scroll">
      {snap.caption && <div className="cnx-caption">{snap.caption}</div>}
      <table className="dtable cnx-table">
        <thead><tr><th>#</th><th>Verein</th>{!only && <><th className="num">Sp</th><th className="num">Tore</th><th className="num">Pkt</th></>}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.clubId} className={r.clubId === g.managedClubId ? 'me' : ''}>
              <td className="rl-rank"><span className={`rl-z ${snap.roster ? '' : snap.zones ? snap.zones[i] ?? '' : zoneOf(r.pos, snap.tier, rows.length, snap.source === 'history')}`}>{snap.roster ? '' : r.pos}</span></td>
              <td className="cnx-team"><TeamName g={g} id={r.clubId} season={snap.season} size={18} /></td>
              {!only && <><td className="num">{r.p}</td><td className="num">{r.gf}:{r.ga}</td><td className="num"><b>{r.pts}</b></td></>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Spielerzeile (Nationalspieler, beste Spieler): Gesicht, Name, Position, Verein, Stärke, optional Länderspiele. */
export function NatRow({ g, p, rank, caps = false, line }: { g: Game; p: NatPlayer; rank?: number; caps?: boolean; line?: SeasonLine | null }) {
  const face = g.players[p.id] ?? (p.face && p.born ? { id: p.id, face: p.face, dateOfBirth: `${p.born}-07-01`, age: p.age, fullName: p.name } : null);
  return (
    <div className={`cnx-prow ${caps ? 'caps' : ''}`} data-pid={g.players[p.id] ? p.id : undefined}>
      {rank != null && <span className="rl-rank">{rank}</span>}
      <FaceThumb p={face as never} club={g.clubs[p.clubId]} size={22} />
      <span className="cnx-pname"><PlayerLink id={p.id}>{p.name}</PlayerLink></span>
      <span className="cnx-pos"><PosBadge pos={p.pos as Position} /></span>
      <span className="cnx-age">{p.age ? `${p.age} J.` : ''}</span>
      <span className="cnx-club">{p.clubId ? <TeamName g={g} id={p.clubId} season={g.season} size={16} /> : <span className="muted">vereinslos</span>}</span>
      {caps && <>
        {/* Wunsch Pascal: statt „Spiele · Tore“ seit Spielbeginn die Saisonbilanz im Verein (game/nationSquadLines.ts) */}
        <span className="cnx-num" title={p.goals ? `${p.goals} Länderspieltore` : undefined}>{p.caps || '–'}</span>
        <span className="cnx-num">{line?.apps ?? '–'}</span>
        <span className="cnx-num">{line ? line.goals : '–'}</span>
        <span className="cnx-num">{line ? line.assists : '–'}</span>
        <span className="cnx-num">{line?.grade != null ? line.grade.toFixed(1).replace('.', ',') : '–'}</span>
      </>}
      <b className="cnx-ov" style={{ color: vColor(p.ov) }}>{p.ov}</b>
    </div>
  );
}
