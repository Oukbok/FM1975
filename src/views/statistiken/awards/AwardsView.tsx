// =============================================================================
// STATISTIKEN › AUSZEICHNUNGEN — Die Besten der Saison im Archiv (Saisonwahl).
// Oben die vier Karten der gewählten Saison, unten alle Jahrgänge und die
// meistgeehrten Spieler. Daten: game.seasonAwards (game/seasonAwardsGame.ts).
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal from '../../../components/PlayerModal';
import { AWARD_CATS, AWARD_CAT_LABEL } from '../../../engine/seasonAwards';
import { awardTallies, awardsState } from '../../../game/seasonAwardsGame';
import { goldenBallState } from '../../../game/goldenBallGame';
import { GalaShow } from '../../../screens/gala/GalaShow';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { AwardCard, AwardHonours } from './AwardParts';
import Select from '../../../ui/Select';

export function AwardsView({ g }: { g: Game }) {
  const seasons = [...(awardsState(g)?.seasons ?? [])].reverse();
  const [pick, setPick] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const s = seasons.find((x) => x.season === pick) ?? seasons[0];
  const tallies = awardTallies(g).filter((t) => t.wins > 1 || t.best > 0).slice(0, 12);
  const gb = [...(goldenBallState(g)?.years ?? [])].reverse();
  const [gala, setGala] = useState<number | null>(null);
  const galaYear = gala != null ? gb.find((y) => y.year === gala) : undefined;
  const p = sel ? g.players[sel] : null;
  const open = (id: string) => { if (g.players[id]) setSel(id); };

  const mine = g.managedClubId;
  return (
    <DashPage className="aw-page">
      {!s ? (
        <DashBox title="Die Besten der Saison" icon="trophy" span={3} info="awards_wertung">
          <Empty icon="trophy">Am Tag nach dem letzten Ligaspieltag werden die besten Spieler auf ihren Positionen geehrt – Torwart, Abwehr, Mittelfeld und Sturm. Die erste Ehrung steht am Ende der Saison {g.season} an.</Empty>
        </DashBox>
      ) : (
      <DashBox title={`Die Besten der Saison ${s.season}`} icon="trophy" span={3} info="awards_wertung"
        right={(
          <span className="aw-pick">
            <span className="aw-pick-div">{s.divName}</span>
            <Select className="dselect" value={s.season} onChange={(v) => setPick(v)} aria-label="Saison wählen">
              {seasons.map((x) => <option key={x.season} value={x.season}>{x.season}</option>)}
            </Select>
          </span>
        )}>
        <div className="aw-page-top">
          <div className="aw-grid compact">
            {AWARD_CATS.map((cat, i) => <AwardCard key={`${s.season}-${cat}`} g={g} s={s} cat={cat} k={i} compact onPlayer={open} />)}
          </div>
          <AwardHonours g={g} s={s} onPlayer={open} />
        </div>
      </DashBox>
      )}

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
              <tr key={x.season} className={x.season === s?.season ? 'sel' : ''} onClick={() => setPick(x.season)}>
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
                  <span className="rl-num">{w.nat}</span>
                </button>
              );
            })}
          </div>
        ) : <Empty icon="trophy">Der erste Goldene Ball wird am 20. Dezember verliehen.</Empty>}
        <div className="dsec aw-dsec">Meistgeehrt (Saison)</div>
        {tallies.length ? (
          <div className="rl rl-sm rl-players">
            {tallies.map((t, i) => (
              <div key={t.p} className="rl-row">
                <span className="rl-rank">{i + 1}</span>
                <span className="rl-name grow"><PlayerLink id={t.p}>{t.n}</PlayerLink><span className="muted"> · {t.cn}</span></span>
                <span className="rl-num" title="Spieler der Saison">{t.best ? `${t.best}× SdS` : ''}</span>
                <span className="rl-main">{t.wins}×</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Noch hat niemand mehr als eine Ehrung.</Empty>}
      </DashBox>
      {galaYear && createPortal(<GalaShow g={g} y={galaYear} onClose={() => setGala(null)} />, document.body)}
      {p && createPortal(
        <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
          today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />,
        document.body,
      )}
    </DashPage>
  );
}
