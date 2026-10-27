import ClubCrest from '../../components/ClubCrest';
import { CalendarEngine } from '../../engine/calendar';
import { decisionBadge, nextPlayerTie } from '../../engine/cup';
import { Game } from '../../game/state';
import { CupTie } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { fmtDMfull } from '../../ui/format';

// =============================================================================
// DFB-POKAL (Turnierbaum + eigener Weg)
// =============================================================================
export function CupView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const cup = g.cup;
  const mid = g.managedClubId;
  if (!cup) {
    return (
      <div className="page">
        <PageHead icon="trophy" title="DFB-Pokal" />
        <div className="card"><p className="dim">Für diesen Spielstand ist kein Pokal-Wettbewerb hinterlegt.</p></div>
      </div>
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
            <span className="dim mini">{CalendarEngine.formatDate(tie.date)}</span>
          )}
        </div>
        <div className={`cup-team ${awayWon ? 'cup-win' : ''}`}>
          {away && <ClubCrest club={away} size={18} />}
          <span className="cup-team-name">{short(tie.awayClubId)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <PageHead icon="trophy" title={<>DFB-Pokal <span className="accent">{cup.season}</span></>} />

      {/* Info + eigener Weg */}
      <div className="card">
        <p className="mini" style={{ margin: 0 }}>
          K.-o.-Wettbewerb mit <b>32 Teilnehmern</b> (18 Bundesligisten + 14 Amateurvereine) über 5 Runden.
          Ein Spiel entscheidet — bei Gleichstand Verlängerung, dann Elfmeterschießen. Nach jeder Runde wird neu ausgelost.
        </p>
        {winner && (
          <p className="mt12" style={{ margin: '10px 0 0' }}>
            <b className="accent-text">Pokalsieger {cup.season}: {name(winner)}</b>
            {winner === mid && ' — Glückwunsch, das ist dein Verein! 🎉'}
          </p>
        )}
        {!winner && myNext && (
          <p className="mt12" style={{ margin: '10px 0 0' }}>
            <span className="dim mini">Dein nächstes Pokalspiel — {cup.rounds[myNext.round].name}, {CalendarEngine.formatDate(myNext.date)}:</span><br />
            <b>{myNext.homeClubId === mid ? 'Heim gegen' : 'Auswärts bei'} {myNext.homeClubId === mid ? name(myNext.awayClubId) : name(myNext.homeClubId)}</b>
          </p>
        )}
        {!winner && !myNext && (
          <p className="mt12 dim mini" style={{ margin: '10px 0 0' }}>Dein Verein ist im Pokal ausgeschieden.</p>
        )}
      </div>

      {/* Turnierbaum */}
      <div className="cup-bracket mt12">
        {cup.rounds.map((round) => (
          <div className="cup-col" key={round.index}>
            <div className="cup-col-head">
              <span>{round.name}</span>
              <span className="dim mini">{CalendarEngine.formatDate(round.date)} · {(cup.prizeByRound[round.index] / 1000).toLocaleString('de-DE')} Tsd. DM</span>
            </div>
            {round.drawn ? (
              round.ties.map((tie) => <TieRow key={tie.id} tie={tie} />)
            ) : (
              <div className="cup-tie cup-tie-pending"><span className="dim mini">Noch nicht ausgelost</span></div>
            )}
          </div>
        ))}
      </div>

      {/* Preisgeld-Leiter */}
      <div className="card mt12">
        <div className="section-title" style={{ fontSize: 14, marginBottom: 8 }}>Preisgeld pro gewonnener Runde</div>
        <div className="cup-prizes">
          {cup.rounds.map((r) => (
            <div className="cup-prize" key={r.index}>
              <span className="dim mini">{r.name}</span>
              <b>{fmtDMfull(cup.prizeByRound[r.index])}</b>
            </div>
          ))}
        </div>
        <p className="dim mini" style={{ marginTop: 8, marginBottom: 0 }}>
          Zusätzlich erhält der Ausrichter (zuerst gezogener Verein) die Heimeinnahmen aus Eintritt, Fanartikeln und TV-Geldern.
        </p>
      </div>
    </div>
  );
}
