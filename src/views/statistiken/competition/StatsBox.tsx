// =============================================================================
// Statistik-Box rechts: Torschützen, Vorlagen, Scorer, Gelbe, Rote (inkl. Gelb-Rot),
// Weiße Weste – oder Vereinswerte, wenn eine Liga vereinsweise simuliert wird.
// =============================================================================
import { useState } from 'react';
import PlayerModal from '../../../components/PlayerModal';
import type { ClubStatCat, CompSnapshot } from '../../../game/competitionView';
import type { StatCat } from '../../../game/leagueArchive';
import type { Game } from '../../../game/state';
import { DashBox, Empty } from '../../../ui/DashPage';
import { Chips, TeamName } from './parts';
import { HISTORIC_SEASONS, historicFinal } from '../../../data/history/seasons';

const CAT_LABEL: Record<StatCat, string> = { goals: 'Tore', assists: 'Vorlagen', scorer: 'Scorer', yellow: 'Gelb', red: 'Rot', clean: 'Weiße Weste' };
const CAT_TITLE: Record<StatCat, string> = {
  goals: 'Torschützen', assists: 'Vorlagengeber', scorer: 'Scorer (Tore + Vorlagen)', yellow: 'Gelbe Karten',
  red: 'Rote Karten (inkl. Gelb-Rot)', clean: 'Weiße Weste (Zu-null-Spiele der Torhüter)',
};
const CLUB_LABEL: Record<ClubStatCat, string> = { gf: 'Tore', ga: 'Gegentore', w: 'Siege', cs: 'Zu null', ti: 'Meistertitel' };
const CLUB_TITLE: Record<ClubStatCat, string> = { gf: 'Bester Angriff', ga: 'Beste Abwehr', w: 'Meiste Siege', cs: 'Spiele ohne Gegentor', ti: 'Meistertitel seit 1975' };

export function StatsBox({ g, snap }: { g: Game; snap: CompSnapshot | null }) {
  const [cat, setCat] = useState<StatCat>('goals');
  const [ccat, setCcat] = useState<ClubStatCat>('gf');
  const [sel, setSel] = useState<string | null>(null);
  const p = sel ? g.players[sel] ?? g.youthPlayers[sel] : null; // Jugendwettbewerbe: auch Jugendspieler
  const stats = snap?.stats;
  const clubStats = snap?.clubStats;
  const modal = p ? (
    <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
      today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />
  ) : null;

  if (stats) {
    const list = stats[cat] ?? [];
    return (
      <DashBox title="Statistik" icon="stats" right={snap?.season} className="cmp-stats">
        <div className="cmp-toolbar"><Chips<StatCat> value={cat} onChange={setCat} options={(Object.keys(CAT_LABEL) as StatCat[]).map((c) => ({ v: c, label: CAT_LABEL[c], title: CAT_TITLE[c] }))} /></div>
        <div className="dsec">{CAT_TITLE[cat]}</div>
        {list.length ? (
          <div className="cmp-statlist">
            {list.map((r, i) => {
              const rank = i > 0 && list[i - 1].value === r.value ? '' : `${i + 1}.`;
              const clickable = !!(g.players[r.pid] ?? g.youthPlayers[r.pid]);
              return (
                <div key={r.pid} className={`cmp-stat ${clickable ? 'clickable' : ''} ${r.clubId === g.managedClubId ? 'me' : ''}`} onClick={() => clickable && setSel(r.pid)} title={clickable ? 'Spielerprofil öffnen' : undefined}>
                  <span className="cmp-rank">{rank}</span>
                  <span className="cmp-pname">{r.name}{r.pos && <span className="pos-badge cmp-pos">{r.pos}</span>}</span>
                  <span className="cmp-pclub">{r.clubId && <TeamName g={g} id={r.clubId} season={snap!.season} size={16} />}</span>
                  <span className="cmp-val">{r.value}</span>
                  <span className="cmp-apps" title="Einsätze">{r.apps} Sp.</span>
                </div>
              );
            })}
          </div>
        ) : <Empty icon="stats">{snap?.source === 'live' ? 'Noch keine Einträge in dieser Saison.' : 'Keine Einträge.'}</Empty>}
        {modal}
      </DashBox>
    );
  }

  // Ohne Einzelstatistik: Vereinswerte (+ Torschützenkönig aus der Historie)
  const cats = (Object.keys(CLUB_LABEL) as ClubStatCat[]).filter((c) => clubStats?.[c]?.length);
  const cc = cats.includes(ccat) ? ccat : cats[0];
  const list = cc ? clubStats![cc]! : [];
  return (
    <DashBox title="Statistik" icon="stats" right={snap?.season} className="cmp-stats">
      {snap?.topScorer && (
        <div className="cmp-topscorer">
          <span className="dkv-k">Torschützenkönig</span>
          <span className="cmp-ts-clubs">{snap.topScorer.clubs.map((id) => <TeamName key={id} g={g} id={id} season={snap.season} size={16} />)}</span>
          <b>{snap.topScorer.goals} Tore</b>
        </div>
      )}
      {cats.length ? <>
        <div className="cmp-toolbar"><Chips<ClubStatCat> value={cc!} onChange={setCcat} options={cats.map((c) => ({ v: c, label: CLUB_LABEL[c], title: CLUB_TITLE[c] }))} /></div>
        <div className="dsec">{CLUB_TITLE[cc!]} · Vereinswerte</div>
        <div className="cmp-statlist">
          {list.map((r, i) => (
            <div key={r.clubId} className={`cmp-stat club ${r.clubId === g.managedClubId ? 'me' : ''}`}>
              <span className="cmp-rank">{i > 0 && list[i - 1].value === r.value ? '' : `${i + 1}.`}</span>
              <span className="cmp-pname"><TeamName g={g} id={r.clubId} season={snap!.season} size={16} /></span>
              <span className="cmp-val">{r.value}</span>
            </div>
          ))}
        </div>
      </> : snap?.kind === 'cup' && snap.source === 'history' ? <>
        <div className="dsec">Endspiele vor Spielbeginn</div>
        <div className="cmp-statlist">
          {HISTORIC_SEASONS.map((s) => ({ s, f: historicFinal(s, snap.key as 'cup') })).filter((x) => x.f).reverse().map(({ s, f }) => (
            <div key={s} className={`cmp-stat club ${s === snap.season ? 'me' : ''}`}>
              <span className="cmp-rank">{s.slice(2)}</span>
              <span className="cmp-pname"><TeamName g={g} id={f!.winner} season={s} size={16} /></span>
              <span className="cmp-apps">{f!.score.split(' ')[0].replace(',', '')}</span>
            </div>
          ))}
        </div>
      </> : <Empty icon="stats">Keine Statistik vorhanden.</Empty>}
    </DashBox>
  );
}
