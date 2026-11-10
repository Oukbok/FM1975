// =============================================================================
// Spielerpool/Scouting: gemeinsame Anzeige-Bausteine (Schätzspannen, Verein, Gesicht)
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import FaceThumb from '../../../components/FaceThumb';
import { ClubLink } from '../../../components/club/ClubLink';
import type { Estimate, PoolRow } from '../../../game/playerPool';
import type { Game } from '../../../game/state';
import { countryName, type WorldClubInfo } from '../../../game/worldPool';
import type { Club } from '../../../types';
import { fmtPrice, vColor } from '../../../ui/format';

const f1 = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: x % 1 ? 1 : 0, maximumFractionDigits: 2 });

export function OvEst({ e }: { e: Estimate }) {
  if (e.exact) return <b style={{ color: vColor(e.ov) }}>{e.ov}</b>;
  return <span className="pool-range"><b style={{ color: vColor(e.ov) }}>{e.ovLo}–{e.ovHi}</b></span>;
}

export function StarEst({ e }: { e: Estimate }) {
  return <span className="dscout">{e.stLo === e.stHi ? `${f1(e.st)} ★` : `${f1(e.stLo)}–${f1(e.stHi)} ★`}</span>;
}

export function ValueEst({ e }: { e: Estimate }) {
  return <>{e.k < 0.8 ? 'ca. ' : ''}{fmtPrice(e.value)}</>;
}

/** Fünf Striche für die Bekanntheit. */
export function KnowBar({ k }: { k: number }) {
  const n = Math.max(1, Math.round(k * 5));
  return (
    <span className="pool-know" title={`Bekanntheit ${Math.round(k * 100)} %`}>
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < n ? 'on' : ''} />)}
    </span>
  );
}

/** Verein mit Wappen – voller Kader über `g.clubs`, sonst Weltverein. */
export function clubObj(g: Game, id: string, world: Map<string, WorldClubInfo>): Club | undefined {
  if (g.clubs[id]) return g.clubs[id];
  const w = world.get(id);
  return w ? ({ id: w.id, name: w.name, shortName: w.shortName, city: w.city, colors: w.colors } as unknown as Club) : undefined;
}

export function ClubCell({ g, id, world }: { g: Game; id: string; world: Map<string, WorldClubInfo> }) {
  const c = clubObj(g, id, world);
  if (!c) return <span className="muted">–</span>;
  return <ClubLink id={id}><span className="pool-club">{<ClubCrest club={c} size={22} />}<span>{c.shortName || c.name}</span></span></ClubLink>;
}

export function Face({ r, size = 26 }: { r: PoolRow; size?: number }) {
  const who = r.player ?? { id: r.id, face: r.face, dateOfBirth: `${r.born}-07-01`, age: r.age, fullName: r.name };
  return <FaceThumb p={who} size={size} />;
}

export function leagueLabel(r: PoolRow): string {
  const land = countryName(r.country);
  return `${land} · ${r.level <= 1 ? '1. Liga' : r.level === 2 ? '2. Liga' : 'unterklassig'}`;
}
