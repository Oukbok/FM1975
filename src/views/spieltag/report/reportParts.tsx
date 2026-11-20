// =============================================================================
// Bausteine des Spielberichts (bisheriges Layout und Ticker-Bericht):
// Statistik mit Balken, Aufstellungen mit Noten/Einzelwerten, Landesflagge.
// =============================================================================
import { isDdrClub } from '../../../game/ddrHome';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import FaceThumb from '../../../components/FaceThumb';
import { CountryFlag } from '../../../components/competition/CountryFlag';
import { eraRules } from '../../../engine/match/era';
import type { LineupEntry, MatchResultExt, TeamStats } from '../../../engine/match/types';
import { foreignCountry } from '../../../game/competitionView';
import { homeCountryKey, type Game } from '../../../game/state';
import { shortNamer } from '../../../screens/match/names';

export const WEATHER: Record<string, string> = {
  sonnig: 'Sonnig', bewoelkt: 'Bewölkt', regen: 'Regen', schnee: 'Schnee', hitze: 'Hitze', wind: 'Windig', nebel: 'Nebel',
};

export type EraStats = ReturnType<typeof eraRules>['stats'];

/** Land eines Vereins am Spieltag (Flaggen-Schlüssel): Ausland aus Europapokal/Weltdaten,
 *  DDR-Vereine bis zur Einheit am 3.10.1990, sonst das Heimatland. */
export function clubCountry(g: Game, id: string, date: string): string {
  return foreignCountry(g, id) ?? (isDdrClub(g, id) && date < '1990-10-03' ? 'DDR' : homeCountryKey(g));
}

/** Landesflagge vor einem Vereinsnamen (Wunsch Pascal). */
export function ClubFlag({ g, id, date, height = 16 }: { g: Game; id: string; date: string; height?: number }) {
  return <span className="mr-flag"><CountryFlag country={clubCountry(g, id, date)} height={height} /></span>;
}

export function StatTable({ r, hs, as, av }: { r: MatchResultExt; hs?: TeamStats; as?: TeamStats; av: EraStats }) {
  const rows: [string, string, string, number, number][] = [];
  const add = (l: string, h: number, a: number, f: (v: number) => string = (v) => String(v)) => rows.push([l, f(h), f(a), h, a]);
  const pct = (x: number, y: number) => (y > 0 ? Math.round((x / y) * 100) : 0);
  if (hs && as && av.xg) add('Expected Goals', hs.xg, as.xg, (v) => v.toFixed(2).replace('.', ','));
  if (av.possession) add('Ballbesitz', r.homePossession, 100 - r.homePossession, (v) => `${v} %`);
  add('Torschüsse', r.homeShots, r.awayShots);
  if (av.shotsOnTarget) add('Aufs Tor', r.homeShotsOnTarget, r.awayShotsOnTarget);
  if (hs && as && av.bigChances) add('Großchancen', hs.bigChances, as.bigChances);
  if (hs && as && av.passes) { add('Pässe', hs.passes, as.passes); add('Passquote', pct(hs.passesOk, hs.passes), pct(as.passesOk, as.passes), (v) => `${v} %`); }
  if (hs && as && av.duels) add('Zweikämpfe gewonnen', pct(hs.duelsWon, hs.duels), pct(as.duelsWon, as.duels), (v) => `${v} %`);
  if (hs && as && av.duels && hs.aerials != null && as.aerials != null) add('Luftduelle gewonnen', pct(hs.aerialsWon ?? 0, hs.aerials), pct(as.aerialsWon ?? 0, as.aerials), (v) => `${v} %`);
  if (hs && as && av.passes && hs.crosses != null && as.crosses != null) add('Flanken', hs.crosses, as.crosses);
  if (hs && as && av.passes && hs.dribbles != null && as.dribbles != null) add('Dribblings', hs.dribbles, as.dribbles);
  if (hs && as && av.distance) add('Laufleistung', hs.distance, as.distance, (v) => `${v.toFixed(1).replace('.', ',')} km`);
  add('Ecken', r.homeCorners, r.awayCorners);
  add('Fouls', r.homeFouls, r.awayFouls);
  if (hs && as) add('Abseits', hs.offsides, as.offsides);
  add('Gelbe Karten', r.homeYellowCards, r.awayYellowCards);
  add('Rote Karten', r.homeRedCards, r.awayRedCards);
  if (hs && as) add('Paraden', hs.saves, as.saves);
  return (
    <div className="mr-stats">
      {rows.map(([l, h, a, hv, avv]) => {
        const tot = hv + avv || 1;
        return (
          <div key={l} className="mr-stat">
            <div className="mr-stat-v"><b>{h}</b><span>{l}</span><b>{a}</b></div>
            <div className="mr-stat-bar"><span className="h" style={{ width: `${(hv / tot) * 100}%` }} /><span className="a" style={{ width: `${(avv / tot) * 100}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function LineupCol({ g, list, detail, av }: { g: Game; list: LineupEntry[]; detail: boolean; av: EraStats }) {
  const nm = shortNamer(list.map((e) => g.players[e.id] ?? g.youthPlayers?.[e.id]));
  return (
    <div className="mr-lu">
      {list.map((e) => {
        const p = g.players[e.id] ?? g.youthPlayers?.[e.id]; // A-Jugendliche bei den Amateuren im Pokal
        return (
          <div key={e.id}>
            <div className={`mr-lu-row ${e.started ? '' : 'sub'}`}>
              <span className="mr-pos">{e.pos}</span>
              <span className="mr-nm">
                <FaceThumb p={p} size={18} />
                <span className="mr-nm-t"><PlayerLink id={e.id}>{nm(p)}</PlayerLink></span>
                {e.goals > 0 && <span className="mr-tag goal">{e.goals > 1 ? `${e.goals}×` : ''}Tor</span>}
                {e.assists > 0 && <span className="mr-tag">{e.assists > 1 ? `${e.assists}×` : ''}Vorl.</span>}
                {e.card && <span className={`mr-card ${e.card === 'Gelb' ? 'y' : 'r'}`} />}
                {!e.started && <span className="mr-in">{e.in}'</span>}
              </span>
              <span className={`mr-grade ${e.grade <= 2 ? 'g-top' : e.grade <= 3 ? 'g-good' : e.grade <= 4 ? 'g-mid' : 'g-bad'}`}>{e.grade.toFixed(1).replace('.', ',')}</span>
            </div>
            {detail && e.st && <PlayerLine st={e.st} keeper={e.pos === 'TW'} av={av} />}
          </div>
        );
      })}
    </div>
  );
}

/** Einzelwerte eines Spielers (nur, was es in der Epoche schon gab). */
function PlayerLine({ st, keeper, av }: { st: number[]; keeper: boolean; av: EraStats }) {
  const [sh, sot, pa, paOk, du, duW, cr, crOk, dr, drOk, ae, aeW, tk, kp, sv] = st;
  const cells: [string, string][] = [];
  if (keeper) cells.push(['Paraden', String(sv)]);
  else cells.push(['Schüsse', av.shotsOnTarget ? `${sh}/${sot}` : String(sh)]);
  if (av.passes) cells.push(['Pässe', `${paOk}/${pa}`]);
  if (av.duels) cells.push(['Zweik.', `${duW}/${du}`]);
  if (av.duels && ae) cells.push(['Luft', `${aeW}/${ae}`]);
  if (av.passes && cr) cells.push(['Flanken', `${crOk}/${cr}`]);
  if (av.duels && dr) cells.push(['Dribbl.', `${drOk}/${dr}`]);
  if (tk) cells.push(['Ballerob.', String(tk)]);
  if (kp) cells.push(['Torvorb.', String(kp)]);
  return <div className="mr-lu-st">{cells.slice(0, 8).map(([l, v]) => <span key={l}>{l} <b>{v}</b></span>)}</div>;
}
