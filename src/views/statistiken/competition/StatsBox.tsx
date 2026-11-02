// =============================================================================
// Statistik-Boxen rechts neben Tabelle/Baum: je eine Box für Torschützen, Vorlagen, Scorer,
// Gelbe, Rote (inkl. Gelb-Rot) und Weiße Weste – oder Vereinswerte, wenn eine Liga
// vereinsweise simuliert wird. Raster: `.cmp-page` in 28-leagues.css.
// =============================================================================
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal from '../../../components/PlayerModal';
import type { ClubStatCat, CompSnapshot } from '../../../game/competitionView';
import type { StatCat } from '../../../game/leagueArchive';
import type { Game } from '../../../game/state';
import { DashBox } from '../../../ui/DashPage';
import { TeamName } from './parts';
import { HISTORIC_SEASONS, historicFinal } from '../../../data/history/seasons';

const CAT_TITLE: Record<StatCat, string> = {
  goals: 'Torschützen', assists: 'Vorlagengeber', scorer: 'Scorer (Tore + Vorlagen)', yellow: 'Gelbe Karten',
  red: 'Rote Karten (inkl. Gelb-Rot)', clean: 'Weiße Weste (Zu-null-Spiele der Torhüter)',
};
const CLUB_TITLE: Record<ClubStatCat, string> = { gf: 'Bester Angriff', ga: 'Beste Abwehr', w: 'Meiste Siege', cs: 'Spiele ohne Gegentor', ti: 'Meistertitel seit 1975' };

const CATS: StatCat[] = ['goals', 'assists', 'scorer', 'yellow', 'red', 'clean'];
const BOX_TITLE: Record<StatCat, string> = { goals: 'Torschützen', assists: 'Vorlagen', scorer: 'Scorer', yellow: 'Gelbe Karten', red: 'Rote Karten', clean: 'Weiße Weste' };
const CLUB_CATS: ClubStatCat[] = ['gf', 'ga', 'w', 'cs', 'ti'];

export function StatsBox({ g, snap, playerCard }: {
  g: Game; snap: CompSnapshot | null;
  /** Optional (Jugend): eigene kleine Karte statt Spielerprofil; null = normales Profil (falls vorhanden). */
  playerCard?: (pid: string, close: () => void) => ReactNode | null;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const card = sel && playerCard ? playerCard(sel, () => setSel(null)) : null;
  // Profikader oder eigene Jugend: volles Spielerprofil.
  const own = sel ? g.youthPlayers[sel] : undefined;
  const p = sel && !card ? g.players[sel] ?? (own?.clubId === g.managedClubId ? own : null) : null;
  const stats = snap?.stats;
  const clubStats = snap?.clubStats;
  const empty = snap?.source === 'live' ? 'Noch keine Einträge.' : 'Keine Einträge.';
  // Über ein Portal: die Box (Glas-Effekt) würde ein festes Popup sonst auf ihre Größe beschneiden.
  const modal = card ? createPortal(card, document.body) : p ? createPortal(
    <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
      today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />,
    document.body,
  ) : null;

  if (stats) {
    return (
      <>
        {CATS.map((cat) => {
          const list = stats[cat] ?? [];
          return (
            <DashBox key={cat} title={<span title={CAT_TITLE[cat]}>{BOX_TITLE[cat]}</span>} right={cat === 'goals' ? snap?.season : undefined} className="cmp-statbox">
              {list.length ? (
                <div className="cmp-statlist">
                  {list.map((r, i) => {
                    const rank = i > 0 && list[i - 1].value === r.value ? '' : `${i + 1}.`;
                    const clickable = !!playerCard || !!g.players[r.pid] || g.youthPlayers[r.pid]?.clubId === g.managedClubId;
                    return (
                      <div key={r.pid} className={`cmp-stat ${clickable ? 'clickable' : ''} ${r.clubId === g.managedClubId ? 'me' : ''}`} onClick={() => clickable && setSel(r.pid)} title={clickable ? 'Spielerprofil öffnen' : undefined}>
                        <span className="cmp-rank">{rank}</span>
                        <span className="cmp-pname">{r.name}</span>
                        <span className="cmp-pclub">{r.clubId && <TeamName g={g} id={r.clubId} season={snap!.season} size={16} />}</span>
                        <span className="cmp-val" title={`${r.apps} Spiele`}>{r.value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="dnote">{empty}</div>}
              {cat === 'goals' && modal}
            </DashBox>
          );
        })}
      </>
    );
  }

  // Ohne Einzelstatistik: Vereinswerte (+ Torschützenkönig bzw. Endspiele aus der Historie)
  return (
    <>
      {CLUB_CATS.map((cc) => {
        const list = clubStats?.[cc] ?? [];
        return (
          <DashBox key={cc} title={<span title={CLUB_TITLE[cc]}>{CLUB_TITLE[cc]}</span>} className="cmp-statbox">
            {list.length ? (
              <div className="cmp-statlist">
                {list.map((r, i) => (
                  <div key={r.clubId} className={`cmp-stat club ${r.clubId === g.managedClubId ? 'me' : ''}`}>
                    <span className="cmp-rank">{i > 0 && list[i - 1].value === r.value ? '' : `${i + 1}.`}</span>
                    <span className="cmp-pname"><TeamName g={g} id={r.clubId} season={snap!.season} size={18} /></span>
                    <span className="cmp-val">{r.value}</span>
                  </div>
                ))}
              </div>
            ) : <div className="dnote">Keine Vereinswerte.</div>}
          </DashBox>
        );
      })}
      <DashBox title={snap?.kind === 'cup' && snap.source === 'history' ? 'Endspiele' : 'Torschützenkönig'} right={snap?.season} className="cmp-statbox">
        {snap?.topScorer ? (
          <div className="cmp-topscorer">
            <span className="cmp-ts-clubs">{snap.topScorer.clubs.map((id) => <TeamName key={id} g={g} id={id} season={snap.season} size={16} />)}</span>
            <b>{snap.topScorer.goals} Tore</b>
          </div>
        ) : snap?.kind === 'cup' && snap.source === 'history' ? (
          <div className="cmp-statlist">
            {HISTORIC_SEASONS.map((s) => ({ s, f: historicFinal(s, snap.key as 'cup') })).filter((x) => x.f).reverse().map(({ s, f }) => (
              <div key={s} className={`cmp-stat club ${s === snap.season ? 'me' : ''}`}>
                <span className="cmp-rank">{s.slice(2)}</span>
                <span className="cmp-pname"><TeamName g={g} id={f!.winner} season={s} size={18} /></span>
                <span className="cmp-val">{f!.score.split(' ')[0].replace(',', '')}</span>
              </div>
            ))}
          </div>
        ) : <div className="dnote">Keine Einzelstatistik für diesen Wettbewerb.</div>}
      </DashBox>
    </>
  );
}
