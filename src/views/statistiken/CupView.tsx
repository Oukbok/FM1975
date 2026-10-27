import ClubCrest from '../../components/ClubCrest';
import { CalendarEngine } from '../../engine/calendar';
import { decisionBadge, nextPlayerTie } from '../../engine/cup';
import { Game } from '../../game/state';
import { CupTie } from '../../types';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtDMfull, fmtDateShort } from '../../ui/format';

// =============================================================================
// DFB-POKAL (Turnierbaum + eigener Weg)
// =============================================================================
export function CupView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const cup = g.cup;
  const mid = g.managedClubId;
  if (!cup) {
    return (
      <DashPage>
        <DashBox title="Landespokal" icon="trophy" span={3} rows={2}><Empty icon="trophy">Für diesen Spielstand ist kein Pokal-Wettbewerb hinterlegt.</Empty></DashBox>
      </DashPage>
    );
  }
  const name = (id: string) => g.clubs[id]?.name ?? id;
  const short = (id: string) => g.clubs[id]?.shortName ?? name(id);
  const myNext = nextPlayerTie(cup, mid);
  const winner = cup.winnerClubId;

  const TieRow = ({ tie }: { tie: CupTie }) => {
    const mine = tie.involvesPlayerClub;
    const home = g.clubs[tie.homeClubId]; const away = g.clubs[tie.awayClubId];
    const badge = decisionBadge(tie);
    const homeWon = tie.played && tie.winnerClubId === tie.homeClubId;
    const awayWon = tie.played && tie.winnerClubId === tie.awayClubId;
    return (
      <div className={`cup-tie ${mine ? 'cup-tie-mine' : ''} ${tie.match ? 'cup-tie-clickable' : ''}`}
        onClick={() => { if (tie.match) onWatch(tie.match.id); }}>
        <div className={`cup-team ${homeWon ? 'cup-win' : ''}`}>
          {home && <ClubCrest club={home} size={18} />}
          <span className="cup-team-name">{short(tie.homeClubId)}</span>
        </div>
        <div className="cup-score">
          {tie.played ? (
            <>
              <b>{tie.homeGoals}:{tie.awayGoals}</b>
              {badge && <span className="cup-badge">{badge}</span>}
              {tie.penalties && <span className="cup-pens">{tie.penalties.home}:{tie.penalties.away}</span>}
            </>
          ) : (
            <span className="dim mini">{fmtDateShort(tie.date).dmy}</span>
          )}
        </div>
        <div className={`cup-team ${awayWon ? 'cup-win' : ''}`}>
          {away && <ClubCrest club={away} size={18} />}
          <span className="cup-team-name">{short(tie.awayClubId)}</span>
        </div>
      </div>
    );
  };

  // Eigener Weg: alle Runden mit Beteiligung des eigenen Vereins.
  const myTies = cup.rounds.flatMap((rd) => rd.ties.filter((t) => t.involvesPlayerClub).map((t) => ({ rd, t })));
  const earned = myTies.filter(({ t }) => t.played && t.winnerClubId === mid).reduce((sum, { rd }) => sum + cup.prizeByRound[rd.index], 0);
  const out = myTies.some(({ t }) => t.played && t.winnerClubId && t.winnerClubId !== mid);

  return (
    <DashPage>
      <DashBox title={`Landespokal ${cup.season}`} icon="trophy" span={2} rows={2} right={winner ? `Sieger: ${name(winner)}` : undefined}>
        <div className="cup-bracket dcup-bracket">
          {cup.rounds.map((round) => (
            <div className="cup-col" key={round.index}>
              <div className="cup-col-head">
                <span>{round.name}</span>
                <span className="dim mini">{CalendarEngine.formatDate(round.date)}</span>
              </div>
              {round.drawn ? round.ties.map((tie) => <TieRow key={tie.id} tie={tie} />)
                : <div className="cup-tie cup-tie-pending"><span className="dim mini">Noch nicht ausgelost</span></div>}
            </div>
          ))}
        </div>
      </DashBox>

      <DashBox title="Dein Weg" icon="dashBall" right={winner === mid ? 'Pokalsieger' : out ? 'ausgeschieden' : myNext ? 'im Wettbewerb' : undefined}>
        {winner === mid && <div className="dnote" style={{ color: 'var(--accent)', fontSize: 17, fontWeight: 800 }}>Glückwunsch – dein Verein hat den Pokal gewonnen!</div>}
        {!winner && myNext && <>
          <div className="dsec">Nächstes Pokalspiel</div>
          <KV k={cup.rounds[myNext.round].name} v={CalendarEngine.formatDate(myNext.date)} />
          <KV k={myNext.homeClubId === mid ? 'Heim gegen' : 'Auswärts bei'} v={myNext.homeClubId === mid ? name(myNext.awayClubId) : name(myNext.homeClubId)} strong />
        </>}
        <div className="dsec">Bisherige Runden</div>
        {myTies.filter(({ t }) => t.played).length ? myTies.filter(({ t }) => t.played).map(({ rd, t }) => {
          const homeSide = t.homeClubId === mid;
          const opp = homeSide ? t.awayClubId : t.homeClubId;
          const won = t.winnerClubId === mid;
          return (
            <div key={t.id} className={`dlist-row ${t.match ? 'clickable' : ''}`} onClick={() => t.match && onWatch(t.match.id)}>
              <span className="meta" style={{ minWidth: 110 }}>{rd.name}</span>
              <span className="grow">{name(opp)} <span className="muted">({homeSide ? 'H' : 'A'})</span></span>
              <span className={`dres dres-${won ? 'W' : 'L'}`}>{homeSide ? `${t.homeGoals}:${t.awayGoals}` : `${t.awayGoals}:${t.homeGoals}`}{decisionBadge(t) ? ` ${decisionBadge(t)}` : ''}</span>
            </div>
          );
        }) : <div className="dnote">Noch kein Pokalspiel bestritten.</div>}
        {!winner && !myNext && out && <div className="dnote mt8">Dein Verein ist im Pokal ausgeschieden.</div>}
      </DashBox>

      <DashBox title="Preisgeld" icon="finances" right={earned ? `${fmtDMfull(earned)} erspielt` : undefined}>
        {cup.rounds.map((rd) => <KV key={rd.index} k={rd.name} v={fmtDMfull(cup.prizeByRound[rd.index])} />)}
        <div className="dnote mt8">32 Teilnehmer, 5 Runden, ein Spiel entscheidet (Verlängerung, Elfmeterschießen). Der Gastgeber erhält zusätzlich die Heimeinnahmen.</div>
      </DashBox>
    </DashPage>
  );
}
