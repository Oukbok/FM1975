// =============================================================================
// STATISTIKEN › AUSZEICHNUNGEN — oben wahlweise der Goldene Ball (Standard) oder
// die Besten der Saison einer Liga (eigene Liga + 1. Ligen im Ausland,
// game/worldAwardsGame.ts); Saison per Pfeilen oder Liste. Unten alle Jahrgänge
// der eigenen Liga und die meistgeehrten Spieler. Daten: game.seasonAwards, game.goldenBall.
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { NatFlag } from '../../../components/competition/CountryFlag';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AWARD_CATS, AWARD_CAT_LABEL } from '../../../engine/seasonAwards';
import { awardTallies, awardsState } from '../../../game/seasonAwardsGame';
import { goldenBallState } from '../../../game/goldenBallGame';
import { GalaShow } from '../../../screens/gala/GalaShow';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { AwardCard, AwardHonours } from './AwardParts';
import Select from '../../../ui/Select';
import Icon from '../../../components/Icon';
import { seasonLabel } from '../../../engine/calendar';
import { awardsBySeason } from '../../../game/worldAwardsGame';
import { GoldenBallTop } from './GoldenBallTop';
import { extraAwardsState } from '../../../game/extraAwardsGame';
import { teamsOfSeason } from '../../../game/teamOfSeasonGame';
import { CoachAwardTop, GoldenShoeTop } from './ExtraAwardTops';
import { TeamOfSeasonTop } from './TeamOfSeasonTop';

export function AwardsView({ g }: { g: Game }) {
  const seasons = [...(awardsState(g)?.seasons ?? [])].reverse();
  const gb = [...(goldenBallState(g)?.years ?? [])].reverse();
  // Saisons für die Wahl oben: Ehrungen der Liga + Goldener Ball (verliehen im Dezember der Saison).
  const extra = extraAwardsState(g);
  const allSeasons = [...new Set([
    ...seasons.map((x) => x.season), ...gb.map((y) => seasonLabel(y.year)),
    ...(extra?.shoe ?? []).map((x) => x.s), ...(extra?.coach ?? []).map((x) => x.s), ...(extra?.xi ?? []).map((x) => x.s),
  ])].sort().reverse();
  const [pick, setPick] = useState<string | null>(null);
  const [league, setLeague] = useState<string>('gb');
  const season = pick && allSeasons.includes(pick) ? pick : allSeasons[0];
  const leagues = season ? awardsBySeason(g, season) : [];
  const gbYear = season ? gb.find((y) => seasonLabel(y.year) === season) : undefined;
  // Wahl oben: gb | shoe | coach | xi:<Liga> | <Liga> (Die Besten der Saison)
  const shoe = season ? extra?.shoe.find((x) => x.s === season) : undefined;
  const coach = season ? extra?.coach.find((x) => x.s === season) : undefined;
  const xis = season ? teamsOfSeason(g, season) : [];
  const special = league === 'gb' || league === 'shoe' || league === 'coach' || league.startsWith('xi:');
  const xi = league.startsWith('xi:') ? xis.find((x) => `xi:${x.d}` === league) ?? xis[0] : undefined;
  const s = special ? undefined : leagues.find((x) => x.div === league) ?? leagues[0];
  const showGb = league === 'gb' && !!gbYear;
  const tallies = awardTallies(g).filter((t) => t.wins > 1 || t.best > 0).slice(0, 12);
  const [gala, setGala] = useState<number | null>(null);
  const galaYear = gala != null ? gb.find((y) => y.year === gala) : undefined;
  const idx = season ? allSeasons.indexOf(season) : -1;
  const step = (d: number) => { const next = allSeasons[idx + d]; if (next) setPick(next); };

  const mine = g.managedClubId;
  const title = league === 'gb' ? (gbYear ? `Goldener Ball ${gbYear.year}` : 'Goldener Ball')
    : league === 'shoe' ? `Goldener Schuh ${season ?? ''}`.trim()
      : league === 'coach' ? `Trainer des Jahres ${season ?? ''}`.trim()
        : league.startsWith('xi:') ? `Elf der Saison ${season ?? ''}`.trim()
          : s ? `Die Besten der Saison ${s.season}` : 'Die Besten der Saison';
  const info = league === 'gb' ? 'goldener_ball' : league === 'shoe' ? 'goldener_schuh' : league === 'coach' ? 'trainer_des_jahres' : league.startsWith('xi:') ? 'elf_der_saison' : 'awards_wertung';
  const pickValue = special ? (league.startsWith('xi:') && xi ? `xi:${xi.d}` : league) : s?.div ?? 'gb';
  return (
    <DashPage className="aw-page">
      <DashBox title={title} icon="trophy" span={3} info={info}
        right={season ? (
          <span className="aw-pick">
            <Select className="dselect aw-pick-league" value={pickValue} onChange={(v) => setLeague(v)} aria-label="Wertung wählen">
              <option value="gb">Goldener Ball</option>
              <option value="shoe">Goldener Schuh</option>
              <option value="coach">Trainer des Jahres</option>
              {leagues.length ? <optgroup label="Die Besten der Saison">
                {leagues.map((x) => <option key={x.div} value={x.div}>{x.divName}</option>)}
              </optgroup> : null}
              {xis.length ? <optgroup label="Elf der Saison">
                {xis.map((x) => <option key={x.d} value={`xi:${x.d}`}>{`Elf der Saison · ${x.dn}`}</option>)}
              </optgroup> : null}
            </Select>
            <button type="button" className="b3 b3-s b3-icon" onClick={() => step(1)} disabled={idx >= allSeasons.length - 1} aria-label="Vorige Saison" title="Vorige Saison"><Icon name="navPrev" size={18} /></button>
            <Select className="dselect" value={season} onChange={(v) => setPick(v)} aria-label="Saison wählen">
              {allSeasons.map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
            <button type="button" className="b3 b3-s b3-icon" onClick={() => step(-1)} disabled={idx <= 0} aria-label="Nächste Saison" title="Nächste Saison"><Icon name="navNext" size={18} /></button>
          </span>
        ) : undefined}>
        {!season ? (
          <Empty icon="trophy">Am 20. Dezember wird der Goldene Ball verliehen, am Tag nach dem letzten Ligaspieltag werden die besten Spieler auf ihren Positionen geehrt – Torwart, Abwehr, Mittelfeld und Sturm. Die erste Ehrung steht am Ende der Saison {g.season} an.</Empty>
        ) : showGb ? (
          <GoldenBallTop g={g} y={gbYear!} onGala={() => setGala(gbYear!.year)} />
        ) : league === 'shoe' && shoe ? (
          <GoldenShoeTop g={g} y={shoe} />
        ) : league === 'coach' && coach ? (
          <CoachAwardTop g={g} y={coach} />
        ) : xi ? (
          <TeamOfSeasonTop g={g} t={xi} />
        ) : s ? (
          <div className="aw-page-top">
            <div className="aw-grid compact">
              {AWARD_CATS.map((cat, i) => <AwardCard key={`${s.season}-${s.div}-${cat}`} g={g} s={s} cat={cat} k={i} compact />)}
            </div>
            <AwardHonours g={g} s={s} face={44} />
          </div>
        ) : (
          <Empty icon="trophy">{league === 'gb' ? `In der Saison ${season} wurde (noch) kein Goldener Ball verliehen.`
            : league === 'shoe' ? `Der Goldene Schuh ${season} wird am Saisonende vergeben, wenn alle 1. Ligen fertig sind.`
              : league === 'coach' ? `Der Trainer des Jahres ${season} wird am Saisonende gewählt.`
                : league.startsWith('xi:') ? `Die Elf der Saison ${season} steht am Saisonende fest.`
                  : `Für die Saison ${season} gibt es (noch) keine Ehrung der Besten.`}</Empty>
        )}
      </DashBox>

      <DashBox title="Alle Jahrgänge" icon="chronicle" span={2} flush right={`${seasons.length} Saisons`}>
        {!seasons.length ? <Empty icon="chronicle">Noch keine Saison abgeschlossen.</Empty> : (
        <table className="dtable rl-players aw-years">
          <thead><tr>
            <th>Saison</th>
            {AWARD_CATS.map((c) => <th key={c}>{AWARD_CAT_LABEL[c]}</th>)}
            <th>Newcomer</th>
          </tr></thead>
          <tbody>
            {seasons.map((x) => (
              <tr key={x.season} className={x.season === season && league !== 'gb' ? 'sel' : ''} onClick={() => { setPick(x.season); setLeague(x.div); }}>
                <td className="nowrap">{x.season}{x.tier > 1 ? <span className="muted"> · {x.divName}</span> : null}</td>
                {AWARD_CATS.map((c) => {
                  const w = x.cats[c][0];
                  return (
                    <td key={c} className={`nowrap ${w?.c === (x.mine ?? mine) ? 'aw-mine' : ''} ${x.best === c ? 'aw-best' : ''}`} title={w ? `${w.n} (${w.cn})${x.best === c ? ' – Spieler der Saison' : ''}` : ''}>
                      {w ? <PlayerLink id={w.p}>{w.n}</PlayerLink> : '—'}<span className="muted"> {w ? <ClubLink id={w.c}>{w.cn}</ClubLink> : ''}</span>
                    </td>
                  );
                })}
                <td className={`nowrap ${x.rookie?.c === (x.mine ?? mine) ? 'aw-mine' : ''}`}>{x.rookie ? <PlayerLink id={x.rookie.p}>{x.rookie.n}</PlayerLink> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </DashBox>

      <DashBox title="Goldener Ball" icon="trophy" flush info="goldener_ball" right={gb.length ? `${gb.length} Jahre` : undefined}>
        {gb.length ? (
          <div className="rl rl-sm rl-players gb-archive">
            {gb.map((y) => {
              const w = y.top[0];
              return (
                <button type="button" key={y.year} className={`rl-row ${w.c === (y.mine ?? mine) ? 'me' : ''}`} onClick={() => setGala(y.year)} title="Gala noch einmal ansehen">
                  <span className="rl-rank">{y.year}</span>
                  <span className="rl-name grow"><PlayerLink id={w.p}>{w.n}</PlayerLink><span className="muted"> · <ClubLink id={w.c}>{w.cn}</ClubLink></span></span>
                  <span className="rl-num"><NatFlag nat={w.nat} height={13} /></span>
                </button>
              );
            })}
          </div>
        ) : <Empty icon="trophy">Der erste Goldene Ball wird am 20. Dezember verliehen.</Empty>}
        <div className="dsec aw-dsec">Meistgeehrt (Saison)</div>
        {tallies.length ? (
          <div className="rl rl-sm rl-players aw-tally">
            {tallies.map((t, i) => (
              <div key={t.p} className="rl-row">
                <span className="rl-rank">{i + 1}</span>
                <span className="rl-name grow"><PlayerLink id={t.p}>{t.n}</PlayerLink><span className="muted"> · <ClubLink id={t.c}>{t.cn}</ClubLink></span></span>
                <span className="rl-num" title="Spieler der Saison">{t.best ? `${t.best}× SdS` : ''}</span>
                <span className="rl-main">{t.wins}×</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Noch hat niemand mehr als eine Ehrung.</Empty>}
      </DashBox>
      {galaYear && createPortal(<GalaShow g={g} y={galaYear} onClose={() => setGala(null)} />, document.body)}
    </DashPage>
  );
}
