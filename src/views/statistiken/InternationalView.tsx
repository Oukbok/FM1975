import ClubCrest from '../../components/ClubCrest';
import { EURO_COMP_NAMES, EURO_COMP_SHORT, EuroCompId } from '../../data/europe';
import { CalendarEngine } from '../../engine/calendar';
import { decisionBadge, roundWinners } from '../../engine/cup';
import { nextPlayerEuroTie } from '../../engine/euro';
import { clubView } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { CupTie } from '../../types';
import { PageHead } from '../../ui/PageHead';
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
      <div className="page">
        <PageHead icon="international" title="International" />
        <div className="card">
          <p className="dim" style={{ margin: 0 }}>
            Für diesen Spielstand sind noch keine Europapokal-Wettbewerbe hinterlegt.
            Sie erscheinen automatisch, sobald eine neue Saison mit europäischer Qualifikation beginnt.
          </p>
        </div>
      </div>
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
            background: t.colors.primary, border: '1px solid rgba(255,255,255,0.35)', display: 'inline-block',
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

  return (
    <div className="page">
      <PageHead icon="international" title={<>International{cup && <> <span className="accent">{cup.season}</span></>}</>} />

      {/* Wettbewerbs-Umschalter */}
      <div className="seg-group" style={{ display: 'inline-flex', marginBottom: 12 }}>
        {(['ec', 'cwc', 'uefa'] as EuroCompId[]).map((c) => (
          <button key={c} className={`seg-btn ${comp === c ? 'active' : ''}`}
            disabled={!euroCups[c]} onClick={() => setComp(c)}>
            {EURO_COMP_SHORT[c]}
          </button>
        ))}
      </div>

      {!cup ? (
        <div className="card"><p className="dim" style={{ margin: 0 }}>Dieser Wettbewerb ist in dieser Saison nicht hinterlegt.</p></div>
      ) : (
        <>
          {/* Info + eigener Weg */}
          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 4 }}>{EURO_COMP_NAMES[comp]}</div>
            <p className="mini dim" style={{ margin: 0 }}>
              K.-o.-Wettbewerb mit {cup.participantIds.length} Teilnehmern. Ein Spiel entscheidet —
              bei Gleichstand Verlängerung, dann Elfmeterschießen. Nach jeder Runde wird neu ausgelost.
            </p>
            {winner && (
              <p className="mt12" style={{ margin: '10px 0 0' }}>
                <b style={{ color: 'var(--gold)' }}>Sieger {cup.season}: {winnerName(winner)}</b>
                {winner === mid && ' — das ist dein Verein!'}
              </p>
            )}
            {!winner && myNext && (
              <div className="mt12" style={{ margin: '10px 0 0' }}>
                <span className="dim mini">Dein nächstes Europapokal-Spiel — {cup.rounds[myNext.round]?.name}, {CalendarEngine.formatDate(myNext.date)}:</span><br />
                <b>{myNext.homeClubId === mid ? 'Heim gegen ' : 'Auswärts bei '}{teamInfo(myNext.homeClubId === mid ? myNext.awayClubId : myNext.homeClubId).name}</b>
                {myNext.match && (
                  <div className="mt8">
                    <button className="btn-sm btn-primary" onClick={() => onWatch(myNext.match!.id)}>Partie ansehen</button>
                  </div>
                )}
              </div>
            )}
            {!winner && !myNext && (
              <p className="mt12 dim mini" style={{ margin: '10px 0 0' }}>Dein Verein ist in diesem Wettbewerb nicht (mehr) vertreten.</p>
            )}
          </div>

          {/* Runden — aktuelle/kommende offen, gespielte einklappbar */}
          <div className="mt12" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cup.rounds.map((round) => {
              const allPlayed = round.drawn && round.ties.length > 0 && round.ties.every((t) => t.played);
              const key = `${comp}-${round.index}`;
              const isCollapsed = key in collapsed ? collapsed[key] : allPlayed;
              const winners = allPlayed ? roundWinners(round) : [];
              return (
                <div className="card" key={round.index} style={{ padding: 12 }}>
                  <div className="row" style={{ cursor: allPlayed ? 'pointer' : 'default' }}
                    onClick={() => { if (allPlayed) setCollapsed((s) => ({ ...s, [key]: !isCollapsed })); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {allPlayed && <span className="dim" style={{ fontSize: 11 }}>{isCollapsed ? '\u25B8' : '\u25BE'}</span>}
                      <b>{round.name}</b>
                      <span className="dim mini">{CalendarEngine.formatDate(round.date)}</span>
                    </div>
                    <span className="dim mini">{(cup.prizeByRound[round.index] / 1000).toLocaleString('de-DE')} Tsd. DM</span>
                  </div>
                  {!round.drawn ? (
                    <div className="cup-tie cup-tie-pending mt8"><span className="dim mini">Noch nicht ausgelost</span></div>
                  ) : isCollapsed ? (
                    <div className="dim mini mt8">
                      Abgeschlossen — weiter: {winners.map((w) => teamInfo(w).short).join(', ')}
                    </div>
                  ) : (
                    <div className="mt8" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {round.ties.map((tie) => <TieRow key={tie.id} tie={tie} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
