// =============================================================================
// Halbzeitansprache und Abschluss des Textmodus.
// =============================================================================
import Icon from '../../components/Icon';
import type { MatchSim } from '../../engine/match/sim';
import type { MatchOutcome, Side, TeamTalk } from '../../engine/match/types';
import type { Game } from '../../game/state';
import { shortNamer } from './names';

const TALKS: [TeamTalk, string, string][] = [
  ['loben', 'Loben', 'Bestärkt bei Führung, kann bei Rückstand zu bequem machen.'],
  ['analyse', 'Ruhig analysieren', 'Sachlich, kleiner Effekt, kaum Risiko.'],
  ['predigt', 'Kabinenpredigt', 'Weckt bei Rückstand auf, verunsichert bei Führung.'],
];

export function HalftimeDialog({ sim, side, onTalk }: { sim: MatchSim; side: Side; onTalk: (t: TeamTalk | null) => void }) {
  const [h, a] = sim.score();
  const mine = side === 'home' ? h : a, theirs = side === 'home' ? a : h;
  const mood = mine > theirs ? 'Deine Elf führt.' : mine < theirs ? 'Deine Elf liegt zurück.' : 'Es ist alles offen.';
  return (
    <div className="ms-dialog-bg">
      <div className="ms-dialog">
        <div className="ms-dialog-head"><Icon name="whistle" size={30} /> Halbzeit – {h}:{a}</div>
        <p className="ms-dialog-p">{mood} Was sagst du deiner Mannschaft in der Kabine?</p>
        <div className="ms-talks">
          {TALKS.map(([id, label, hint]) => (
            <button key={id} className="ms-talk" onClick={() => onTalk(id)}>
              <b>{label}</b><span>{hint}</span>
            </button>
          ))}
        </div>
        <button className="ms-btn ghost" onClick={() => onTalk(null)}>Nichts sagen</button>
      </div>
    </div>
  );
}

export function EndPanel({ g, sim, side, outcome, onClose }: {
  g: Game; sim: MatchSim; side: Side; outcome: MatchOutcome | null; onClose: () => void;
}) {
  const r = outcome?.result;
  const rep = r?.report;
  const lineup = rep ? (side === 'home' ? rep.lineups.home : rep.lineups.away) : [];
  const motm = r?.manOfTheMatchId ? g.players[r.manOfTheMatchId] : null;
  const nm = shortNamer(lineup.map((e) => g.players[e.id]));
  const [h, a] = sim.score();
  const mine = side === 'home' ? h : a, theirs = side === 'home' ? a : h;
  const won = outcome ? (side === 'home' ? outcome.homeWins : !outcome.homeWins) : mine > theirs;
  const verdict = outcome?.decision === 'penalties' ? (won ? 'Weiter nach Elfmeterschießen!' : 'Ausgeschieden im Elfmeterschießen.')
    : mine > theirs ? 'Sieg!' : mine < theirs ? 'Niederlage.' : 'Unentschieden.';
  return (
    <div className="ms-dialog-bg">
      <div className="ms-dialog wide">
        <div className="ms-dialog-head">
          <Icon name="matchball" size={30} /> Abpfiff – {sim.home.club.name} {h}:{a} {sim.away.club.name}
          {outcome?.penalties && <span className="ms-dim"> ({outcome.penalties.home}:{outcome.penalties.away} i.E.)</span>}
          {outcome?.decision === 'aet' && <span className="ms-dim"> n.V.</span>}
        </div>
        <p className={`ms-verdict ${won ? 'good' : mine < theirs || outcome?.decision === 'penalties' ? 'bad' : ''}`}>{verdict}</p>
        {motm && <p className="ms-dialog-p">Spieler des Spiels: <b>{motm.firstName} {motm.lastName}</b> ({g.clubs[motm.clubId]?.name ?? ''})</p>}
        <div className="ms-grades">
          {lineup.map((e) => {
            const p = g.players[e.id];
            return (
              <div key={e.id} className="ms-gr">
                <span className="ms-pos">{e.pos}</span>
                <span className="ms-name">{nm(p)}{e.goals ? ` · ${e.goals} Tor${e.goals > 1 ? 'e' : ''}` : ''}{e.assists ? ` · ${e.assists} Vorl.` : ''}</span>
                <span className="ms-dim">{e.started ? '' : `ab ${e.in}'`}{e.out != null ? ` bis ${e.out}'` : ''}</span>
                <span className={`ms-grade ${e.grade <= 2 ? 'g-top' : e.grade <= 3 ? 'g-good' : e.grade <= 4 ? 'g-mid' : 'g-bad'}`}>{e.grade.toFixed(1).replace('.', ',')}</span>
              </div>
            );
          })}
        </div>
        <button className="btn-primary ms-continue" onClick={onClose}>Weiter</button>
      </div>
    </div>
  );
}
