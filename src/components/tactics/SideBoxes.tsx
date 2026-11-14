// =============================================================================
// Taktik-Seite, rechte Spalte: Eingespieltheit und der nächste Gegner im Vergleich.
// =============================================================================
import type { Club, Tactics } from '../../types';
import type { Game } from '../../game/state';
import { getFormation } from '../../data/formations';
import { practicedTactics } from '../../engine/cohesion';
import { SLOT_KEYS } from '../../engine/trainingPlan';
import { COHESION_BLOCKS, cohesionInfo } from '../../game/cohesionGame';
import ClubCrest from '../ClubCrest';
import { ClubLink } from '../club/ClubLink';
import { Empty } from '../../ui/DashPage';
import { instrLabel, type InstrKey } from './instructions';

const verdict = (v: number) => (v >= 92 ? 'Blind eingespielt' : v >= 82 ? 'Eingespielt' : v >= 68 ? 'Im Aufbau' : v >= 50 ? 'Holprig' : 'Fremd');

/** Taktische Trainingseinheiten der Woche laut Plan (Summe der Gewichte, ohne Spiel-Sperren). */
function weeklyTacticUnits(g: Game): number {
  let u = 0;
  for (const d of g.trainingPlan?.days ?? []) for (const k of SLOT_KEYS) { const id = d[k]; if (id && COHESION_BLOCKS[id]) u += COHESION_BLOCKS[id]; }
  return u;
}

export function CohesionBox({ g, set }: { g: Game; set: (p: Partial<Tactics>) => void }) {
  const info = cohesionInfo(g);
  const club = g.clubs[g.managedClubId];
  if (!info || !club.cohesion) return <Empty icon="tactics">Keine Angaben.</Empty>;
  const R = 44, C = 2 * Math.PI * R;
  const units = weeklyTacticUnits(g);
  const eff = info.effectPct;
  return (
    <div className="txc">
      <div className="txc-top">
        <svg className="txc-ring" viewBox="0 0 108 108" role="img" aria-label={`Eingespieltheit ${info.total} von 100`}>
          <circle cx="54" cy="54" r={R} className="bg" />
          <circle cx="54" cy="54" r={R} className={`fg ${info.total >= 80 ? 'good' : info.total >= 60 ? 'mid' : 'low'}`} strokeDasharray={`${(info.total / 100) * C} ${C}`} transform="rotate(-90 54 54)" />
          <text x="54" y="62" textAnchor="middle">{info.total}</text>
        </svg>
        <div className="txc-sum">
          <b>{verdict(info.total)}</b>
          <span className={eff > 0.05 ? 'pos' : eff < -0.05 ? 'neg' : ''}>{eff > 0 ? '+' : eff < 0 ? '−' : '±'}{Math.abs(eff).toFixed(1).replace('.', ',')} % Mannschaftsstärke{info.total < 80 ? ', mehr Fehler im Aufbau' : ''}</span>
          <div className="txc-bars">
            {([['Formation', info.formation], ['Anweisungen', info.instructions], ['Stammelf', info.lineup]] as const).map(([l, v]) => (
              <div key={l} className="txc-bar"><span>{l}</span><i><em style={{ width: `${v}%` }} /></i><b>{v}</b></div>
            ))}
          </div>
        </div>
      </div>
      <div className="txc-foot">
        {info.gaps.length ? (
          <>
            <p>Noch nicht eingeübt: <b>{info.gaps.slice(0, 4).map((x) => x.label).join(', ')}</b>.</p>
            <button type="button" className="b3 b3-s" onClick={() => set(practicedTactics(club.cohesion!))} title="Stellt die Anweisungen ein, die die Mannschaft eingeübt hat">Eingeübtes wiederherstellen</button>
          </>
        ) : <p>Die Anweisungen sitzen. {info.formation < 80 ? 'Die Formation braucht noch Spiele.' : info.lineup < 70 ? 'Mehr Konstanz in der Startelf hilft.' : ''}</p>}
        <p className="txc-train">{units >= 0.5 ? `Trainingsplan: ${units.toFixed(1).replace('.', ',')} Taktik-Einheiten je Woche.` : 'Im Trainingsplan steht keine Taktik-Einheit – eingeübt wird nur im Spiel.'}</p>
      </div>
    </div>
  );
}

const ROWS: [string, InstrKey][] = [['Mentalität', 'style'], ['Aufbau', 'buildup'], ['Pressing', 'pressing'], ['Abwehrlinie', 'line'], ['Deckung', 'marking'], ['Abseitsfalle', 'trap']];
/** Formationsname ohne Klammerzusatz (Platz in der Vergleichstabelle). */
const shortForm = (id: string) => getFormation(id).label.replace(/\s*\(.*\)$/, '');

export function OpponentBox({ me, opp, year, when }: { me: Club; opp: Club | null; year: number; when?: string }) {
  const oT = opp?.tactics;
  if (!opp || !oT) return <Empty icon="watchlist">Kein Gegner angesetzt.</Empty>;
  const same = (k: InstrKey) => instrLabel(k, me.tactics, year) === instrLabel(k, oT, year);
  return (
    <div className="txo">
      <div className="txo-head">
        <ClubLink id={opp.id}><ClubCrest club={opp} size={58} /></ClubLink>
        <div><b><ClubLink id={opp.id}>{opp.name}</ClubLink></b>{when && <span>{when}</span>}</div>
      </div>
      <div className="txo-table">
        <div className="txo-row head"><span>Du</span><span /><span>Gegner</span></div>
        <div className="txo-row"><span>{shortForm(me.tactics.formation)}</span><i>Formation</i><span title={getFormation(oT.formation).label}>{shortForm(oT.formation)}</span></div>
        {ROWS.map(([label, k]) => (
          <div key={k} className={`txo-row${same(k) ? ' same' : ''}`}><span>{instrLabel(k, me.tactics, year)}</span><i>{label}</i><span>{instrLabel(k, oT, year)}</span></div>
        ))}
      </div>
    </div>
  );
}
