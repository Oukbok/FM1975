// Bausteine der Seite Privat › Karriere (Spielzeile, Bilanz-Formate).
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import type { Comp, MgrGame, WDL } from '../../../game/managerLog';
import { games, ppg } from '../../../game/managerView';
import type { Game } from '../../../game/state';
import type { Club } from '../../../types';

export const COMP_DE: Record<Comp, string> = { L: 'Liga', P: 'Pokal', E: 'Europa' };
export const dmy = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
export const ppgText = (r: WDL) => (games(r) ? ppg(r).toFixed(2).replace('.', ',') : '–');
export const wdlText = (r: WDL) => `${r[0]}-${r[1]}-${r[2]}`;

export function crestOf(g: Game, id: string): Club | null {
  return g.clubs[id] ?? ((g.simClubs?.[id] as unknown as Club) || (g.euroClubs?.[id] as unknown as Club) || null);
}

export function ClubCell({ g, id, name }: { g: Game; id: string; name: string }) {
  const c = crestOf(g, id);
  return (
    <span className="rl-club">
      {c && <ClubCrest club={c} size={24} />}
      <ClubLink id={id}><span className="rl-name">{name}</span></ClubLink>
    </span>
  );
}

/** Ein Spiel: Datum · Wettbewerb · Gegner · Ergebnis aus deiner Sicht. */
export function GameRow({ g, x, lead }: { g: Game; x: MgrGame; lead?: string }) {
  const [date, comp, opp, home, gf, ga, name] = x;
  return (
    <div className="rl-row car-game">
      {lead != null && <span className="rl-rank">{lead}</span>}
      <span className="car-game-when">{dmy(date)}<span className="car-dim"> · {COMP_DE[comp]} · {home ? 'H' : 'A'}</span></span>
      <ClubCell g={g} id={opp} name={name} />
      <span className={`rl-num rl-main ${gf > ga ? 'car-w' : gf < ga ? 'car-l' : ''}`}>{gf}:{ga}</span>
    </div>
  );
}
