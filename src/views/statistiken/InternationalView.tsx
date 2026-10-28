import ClubCrest from '../../components/ClubCrest';
import { EURO_COMP_NAMES, EURO_COMP_SHORT, EuroCompId } from '../../data/europe';
import { CalendarEngine } from '../../engine/calendar';
import { decisionBadge, roundWinners } from '../../engine/cup';
import { nextPlayerEuroTie } from '../../engine/euro';
import { clubView } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { CupTie } from '../../types';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { EuropeBox } from './EuropeBox';
import { fmtDMfull } from '../../ui/format';
import { useState } from 'react';

// --- INTERNATIONAL ----------------------------------------------------------
export function InternationalView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const euroCups = g.euroCups;
  const [comp, setComp] = useState<EuroCompId>('ec');
  // Eingeklappte Runden merken (key = comp-roundIndex). Gespielte Runden sind
  // per Default zu, aktuelle/kommende offen — die Map haelt nur Abweichungen.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Alt-Save ohne Europapokal-Struktur -> sauberer Hinweis statt Absturz.
  if (!euroCups || (!euroCups.ec && !euroCups.cwc && !euroCups.uefa)) {
    return (
      <DashPage>
        <DashBox title="International" icon="international" span={3} rows={2}>
          <Empty icon="international">Für diesen Spielstand sind noch keine Europapokal-Wettbewerbe hinterlegt. Sie erscheinen, sobald eine Saison mit europäischer Qualifikation beginnt.</Empty>
        </DashBox>
      </DashPage>
    );
  }

  const mid = g.managedClubId;
  const cup = euroCups[comp] ?? null;

  // Team-Sicht: deutsche/volle Vereine via clubView (mit Wappen), auslaendische
  // eu_-Vereine aus g.euroClubs (Farbpunkt statt Wappen, mit Land).
  const teamInfo = (id: string) => {
    const euro = g.euroClubs?.[id];
    if (euro) {
      return { name: euro.name, short: euro.shortName, colors: euro.colors, foreign: true, country: euro.country, club: null as any };
    }
    const cv = clubView(g, id);
    return { name: cv.name, short: cv.shortName, colors: cv.colors, foreign: false, country: '', club: g.clubs[id] ?? null };
  };

  const TeamSide = ({ id, won }: { id: string; won: boolean }) => {
    const t = teamInfo(id);
    return (
      <div className={`cup-team ${won ? 'cup-win' : ''}`}>
        {t.foreign ? (
          <span title={t.country} style={{
            width: 14, height: 14, borderRadius: '50%', flex: '0 0 auto',
            background: t.colors.primary, border: '1px solid rgba(255, 255, 255,0.35)', display: 'inline-block',
          }} />
        ) : (
          t.club && <ClubCrest club={t.club} size={18} />
        )}
        <span className="cup-team-name" title={t.foreign ? `${t.name} (${t.country})` : t.name}>{t.short}</span>
      </div>
    );
  };

  const TieRow = ({ tie }: { tie: CupTie }) => {
    const mine = tie.involvesPlayerClub || tie.homeClubId === mid || tie.awayClubId === mid;
    const homeWon = tie.played && tie.winnerClubId === tie.homeClubId;
    const awayWon = tie.played && tie.winnerClubId === tie.awayClubId;
    const badge = decisionBadge(tie);
    return (
      <div className={`cup-tie ${mine ? 'cup-tie-mine' : ''} ${tie.match ? 'cup-tie-clickable' : ''}`}
        onClick={() => { if (tie.match) onWatch(tie.match.id); }}>
        <TeamSide id={tie.homeClubId} won={homeWon} />
        <div className="cup-score">
          {tie.played ? (
            <>
              <b>{tie.homeGoals}:{tie.awayGoals}</b>
              {badge && <span className="cup-badge">{badge}</span>}
              {tie.penalties && <span className="cup-pens">{tie.penalties.home}:{tie.penalties.away}</span>}
            </>
          ) : (
            <span className="dim mini">{CalendarEngine.formatDate(tie.date)}</span>
          )}
        </div>
        <TeamSide id={tie.awayClubId} won={awayWon} />
      </div>
    );
  };

  const winnerName = (id: string | null) => (id ? teamInfo(id).name : '');
  const myNext = cup ? nextPlayerEuroTie(cup, mid) : null;
  const winner = cup?.winnerClubId ?? null;

  const germans = cup ? cup.participantIds.filter((id) => !g.euroClubs?.[id]) : [];
  const myTies = cup ? cup.rounds.flatMap((rd) => rd.ties.filter((t) => t.homeClubId === mid || t.awayClubId === mid).map((t) => ({ rd, t }))) : [];

  return (
    <DashPage>
      <DashBox title={cup ? `${EURO_COMP_NAMES[comp]} ${cup.season}` : 'International'} icon="international" span={2} rows={2}
        right={<span className="dbtnrow">
          {(['ec', 'cwc', 'uefa'] as EuroCompId[]).map((c) => (
            <button key={c} className={`dchip ${comp === c ? 'on' : ''}`} disabled={!euroCups[c]} onClick={() => setComp(c)}>{EURO_COMP_SHORT[c]}</button>
          ))}
        </span>}>
        {!cup ? <Empty icon="international">Dieser Wettbewerb ist in dieser Saison nicht hinterlegt.</Empty> : cup.rounds.map((round) => {
          const allPlayed = round.drawn && round.ties.length > 0 && round.ties.every((t) => t.played);
          const key = `${comp}-${round.index}`;
          const isCollapsed = key in collapsed ? collapsed[key] : allPlayed;
          const winners = allPlayed ? roundWinners(round) : [];
          return (
            <div key={round.index} className="deuro-round">
              <div className={`deuro-head ${allPlayed ? 'clickable' : ''}`} onClick={() => { if (allPlayed) setCollapsed((st) => ({ ...st, [key]: !isCollapsed })); }}>
                <b>{round.name}</b>
                <span className="dnote">{CalendarEngine.formatDate(round.date)}{allPlayed ? (isCollapsed ? ' · aufklappen' : ' · zuklappen') : ''}</span>
              </div>
              {!round.drawn ? <div className="dnote">Noch nicht ausgelost.</div>
                : isCollapsed ? <div className="dnote">Abgeschlossen – weiter: {winners.map((w) => teamInfo(w).short).join(', ')}</div>
                : <div className="deuro-ties">{round.ties.map((tie) => <TieRow key={tie.id} tie={tie} />)}</div>}
            </div>
          );
        })}
      </DashBox>

      <DashBox title="Dein Weg" icon="dashBall" right={cup ? EURO_COMP_SHORT[comp] : undefined}>
        {!cup ? <div className="dnote">–</div> : <>
          {winner && <KV k={`Sieger ${cup.season}`} v={winnerName(winner)} strong color={winner === mid ? 'var(--accent)' : undefined} />}
          {!winner && myNext && <>
            <div className="dsec">Nächstes Spiel</div>
            <KV k={cup.rounds[myNext.round]?.name ?? 'Runde'} v={CalendarEngine.formatDate(myNext.date)} />
            <KV k={myNext.homeClubId === mid ? 'Heim gegen' : 'Auswärts bei'} v={teamInfo(myNext.homeClubId === mid ? myNext.awayClubId : myNext.homeClubId).name} strong />
            {myNext.match && <button className="dchip on mt8" onClick={() => onWatch(myNext.match!.id)}>Partie ansehen</button>}
          </>}
          <div className="dsec">Bisherige Spiele</div>
          {myTies.filter(({ t }) => t.played).length ? myTies.filter(({ t }) => t.played).map(({ rd, t }) => {
            const homeSide = t.homeClubId === mid;
            return (
              <div key={t.id} className={`dlist-row ${t.match ? 'clickable' : ''}`} onClick={() => t.match && onWatch(t.match.id)}>
                <span className="meta" style={{ minWidth: 110 }}>{rd.name}</span>
                <span className="grow">{teamInfo(homeSide ? t.awayClubId : t.homeClubId).name}</span>
                <span className={`dres dres-${t.winnerClubId === mid ? 'W' : 'L'}`}>{homeSide ? `${t.homeGoals}:${t.awayGoals}` : `${t.awayGoals}:${t.homeGoals}`}</span>
              </div>
            );
          }) : <div className="dnote">{myTies.length ? 'Noch kein Spiel bestritten.' : 'Dein Verein ist in diesem Wettbewerb nicht vertreten.'}</div>}
        </>}
      </DashBox>

      <EuropeBox g={g} germans={germans} teamName={(id) => teamInfo(id).name} />
    </DashPage>
  );
}
