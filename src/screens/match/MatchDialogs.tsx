// =============================================================================
// Abschluss des Textmodus im Reiter „Abpfiff“ (Halbzeitansprache: changes/TalkTabs.tsx).
// =============================================================================
import { LeaderName } from '../../components/player/LeaderMark';
import { ClubLink } from '../../components/club/ClubLink';
import Icon from '../../components/Icon';
import type { MatchSim } from '../../engine/match/sim';
import type { MatchOutcome, Side } from '../../engine/match/types';
import type { Game } from '../../game/state';
import { shortNamer } from './names';

/** Ergebnis aus Sicht des eigenen Teams (Text + Ton). */
export function verdictOf(sim: MatchSim, side: Side, outcome: MatchOutcome | null): { text: string; tone: 'good' | 'bad' | '' } {
  const [h, a] = sim.score();
  const mine = side === 'home' ? h : a, theirs = side === 'home' ? a : h;
  const won = outcome ? (side === 'home' ? outcome.homeWins : !outcome.homeWins) : mine > theirs;
  const text = outcome?.decision === 'penalties' ? (won ? 'Weiter nach Elfmeterschießen!' : 'Ausgeschieden im Elfmeterschießen.')
    : mine > theirs ? 'Sieg!' : mine < theirs ? 'Niederlage.' : 'Unentschieden.';
  return { text, tone: won && (mine > theirs || outcome?.decision === 'penalties') ? 'good' : mine < theirs || outcome?.decision === 'penalties' ? 'bad' : '' };
}

/**
 * Abpfiff im Textmodus (Wunsch Pascal: kein eigenes Fenster mehr, sondern in der Anzeige):
 * Reiter „Abpfiff“ rechts mit Spieler des Spiels und Noten der eigenen Elf.
 */
export function EndTab({ g, sim, side, outcome }: { g: Game; sim: MatchSim; side: Side; outcome: MatchOutcome | null }) {
  const r = outcome?.result;
  const rep = r?.report;
  const lineup = rep ? (side === 'home' ? rep.lineups.home : rep.lineups.away) : [];
  const motm = r?.manOfTheMatchId ? g.players[r.manOfTheMatchId] : null;
  const nm = shortNamer(lineup.map((e) => g.players[e.id]));
  const v = verdictOf(sim, side, outcome);
  return (
    <div className="tm-pad tm-end">
      <div className={`tm-end-verdict ${v.tone}`}><Icon name="matchball" size={26} /> {v.text}</div>
      {motm && <div className="tm-end-motm">Spieler des Spiels: <b>{motm.firstName} {motm.lastName}</b> (<ClubLink id={motm.clubId}>{g.clubs[motm.clubId]?.name ?? ''}</ClubLink>)</div>}
      <div className="tm-end-grades">
        {lineup.map((e) => {
          const p = g.players[e.id];
          return (
            <div key={e.id} className="ms-gr">
              <span className="ms-pos">{e.pos}</span>
              <span className="ms-name"><LeaderName p={p}>{nm(p)}</LeaderName>{e.goals ? ` · ${e.goals} Tor${e.goals > 1 ? 'e' : ''}` : ''}{e.assists ? ` · ${e.assists} Vorl.` : ''}</span>
              <span className="ms-dim">{e.started ? '' : `ab ${e.in}'`}{e.out != null ? ` bis ${e.out}'` : ''}</span>
              <span className={`ms-grade ${e.grade <= 2 ? 'g-top' : e.grade <= 3 ? 'g-good' : e.grade <= 4 ? 'g-mid' : 'g-bad'}`}>{e.grade.toFixed(1).replace('.', ',')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
