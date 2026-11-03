// =============================================================================
// Wechsel-Bildschirm: Reiter „Halbzeitansprache“ (nur in der Pause, Engine
// teamTalk) und „Spielergespräche“ (kurzer Zuruf an einzelne Spieler, einmal je
// Halbzeit, Engine playerTalk) – sowie die Spiel-Taktik („Taktik öffnen“).
// =============================================================================
import { grade } from '../../../engine/match/finish';
import type { MatchSim } from '../../../engine/match/sim';
import { onPitch, tacticsOf } from '../../../engine/match/state';
import { MENTALITY_LABEL, type Mentality, type PlayerTalk, type Side, type TeamTalk } from '../../../engine/match/types';
import { MoraleIcon, playerMorale100 } from '../../../components/status';
import { StatsPanel } from '../MatchPanels';
import { fmtGrade, gradeCls, gradeEarly } from '../board/LineupBoard';
import type { Draft, TacticPatch } from './draft';

const TALKS: [TeamTalk, string, string][] = [
  ['loben', 'Loben', 'Bestärkt bei Führung, kann bei Rückstand zu bequem machen.'],
  ['analyse', 'Ruhig analysieren', 'Sachlich, kleiner Effekt, kaum Risiko.'],
  ['predigt', 'Kabinenpredigt', 'Weckt bei Rückstand auf, verunsichert bei Führung. Gibt etwas Kraft zurück.'],
];

export function HalftimeTalk({ sim, side, d, onChange }: { sim: MatchSim; side: Side; d: Draft; onChange: (t: TeamTalk | null) => void }) {
  const [h, a] = sim.score();
  const mine = side === 'home' ? h : a, theirs = side === 'home' ? a : h;
  const mood = mine > theirs ? 'Deine Elf führt.' : mine < theirs ? 'Deine Elf liegt zurück.' : 'Es ist alles offen.';
  return (
    <div className="tm-talk">
      <p className="tm-talk-lead">{mood} Was sagst du deiner Mannschaft in der Kabine? Die Ansprache wirkt in der zweiten Halbzeit.</p>
      <div className="tm-talk-opts">
        {TALKS.map(([id, label, hint]) => (
          <button key={id} type="button" className={`tm-talk-opt ${d.talk === id ? 'on' : ''}`} onClick={() => onChange(d.talk === id ? null : id)}>
            <b>{label}</b><span>{hint}</span>
          </button>
        ))}
      </div>
      <p className="tm-dim">Ohne Auswahl sagst du nichts.</p>
      <div className="tm-talk-stats">
        <div className="tm-sec">Statistik zur Pause</div>
        <StatsPanel sim={sim} />
      </div>
    </div>
  );
}

const PT: [PlayerTalk, string][] = [['loben', 'Loben'], ['fordern', 'Mehr fordern'], ['beruhigen', 'Beruhigen']];

export function PlayerTalks({ sim, side, d, onChange }: { sim: MatchSim; side: Side; d: Draft; onChange: (id: string, k: PlayerTalk | null) => void }) {
  const early = gradeEarly(sim);
  return (
    <div className="tm-talk">
      <p className="tm-talk-lead">Ein kurzes Wort an einzelne Spieler – einmal je Halbzeit. Lob hilft denen, die gut spielen; Fordern weckt schwache, kränkt aber starke; Beruhigen hilft Verwarnten und Nervösen.</p>
      <div className="tm-pt-list">
        {onPitch(sim.team(side)).map((m) => {
          const done = (m.talked ?? 0) === sim.period;
          const g = grade(sim, m);
          return (
            <div key={m.id} className={`tm-pt-row ${done ? 'done' : ''}`}>
              <span className="tm-pos">{m.pos}</span>
              <span className="tm-name">{m.p.firstName?.[0]}. {m.p.lastName}{m.yellow > 0 && <i className="ms-card y" />}</span>
              <span className={early ? 'tm-dim' : `ms-grade ${gradeCls(g)}`}>{early ? '–' : fmtGrade(g)}</span>
              <MoraleIcon value={playerMorale100(m.p)} size={20} />
              <div className="tm-pt-btns">
                {done ? <span className="tm-dim">schon gesprochen</span> : PT.map(([k, label]) => (
                  <button key={k} type="button" className={`tm-chip ${d.talks[m.id] === k ? 'on' : ''}`}
                    onClick={() => onChange(m.id, d.talks[m.id] === k ? null : k)}>{label}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SLIDERS: [keyof TacticPatch, string, string, string][] = [
  ['tempo', 'Tempo', 'bedächtig', 'hohes Tempo'],
  ['widthFocus', 'Breite', 'über die Mitte', 'über die Flügel'],
  ['pressing', 'Pressing', 'abwartend', 'hoch'],
  ['defensiveLine', 'Abwehrlinie', 'tief', 'hoch'],
  ['effort', 'Einsatz', 'kräfteschonend', 'volle Kraft'],
];

/** Spiel-Taktik: Ausrichtung + Anweisungen nur für dieses Spiel (die gespeicherte Taktik bleibt unverändert). */
export function TacticPane({ sim, side, d, onMentality, onTactic }: {
  sim: MatchSim; side: Side; d: Draft; onMentality: (m: Mentality) => void; onTactic: (p: TacticPatch) => void;
}) {
  const base = tacticsOf(sim.team(side));
  const val = (k: keyof TacticPatch): number => {
    const v = d.tactics[k] ?? base?.[k];
    return typeof v === 'number' ? v : 50;
  };
  const buildup = d.tactics.buildup ?? base?.buildup ?? 'short';
  return (
    <div className="tm-tac">
      <div className="tm-sec">Ausrichtung</div>
      <div className="tm-chips">
        {([-2, -1, 0, 1, 2] as Mentality[]).map((m) => (
          <button key={m} type="button" className={`tm-chip ${d.mentality === m ? 'on' : ''}`} onClick={() => onMentality(m)}>{MENTALITY_LABEL[m]}</button>
        ))}
      </div>
      <div className="tm-sec">Anweisungen für dieses Spiel</div>
      {SLIDERS.map(([k, label, lo, hi]) => (
        <label key={k} className="tm-slider">
          <span>{label}</span>
          <em>{lo}</em>
          <input type="range" min={0} max={100} step={5} value={val(k)} onChange={(e) => onTactic({ [k]: Number(e.target.value) })} />
          <em>{hi}</em>
        </label>
      ))}
      <div className="tm-slider">
        <span>Aufbauspiel</span>
        <div className="tm-chips">
          <button type="button" className={`tm-chip ${buildup === 'short' ? 'on' : ''}`} onClick={() => onTactic({ buildup: 'short' })}>Kurz</button>
          <button type="button" className={`tm-chip ${buildup === 'long' ? 'on' : ''}`} onClick={() => onTactic({ buildup: 'long' })}>Lang</button>
        </div>
      </div>
      <p className="tm-dim">Gilt nur in diesem Spiel. Zurufe gibst du im Spiel rechts unter „Taktik“.</p>
    </div>
  );
}
