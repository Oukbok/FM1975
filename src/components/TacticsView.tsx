// =============================================================================
// TAKTIK (Aufstellung › Taktik) – Wunsch Pascal: übersichtlich und geordnet
// -----------------------------------------------------------------------------
// Vier Boxen (Wunsch Pascal): oben die Tafel „In Ballbesitz“ mit ihren Anweisungen
// (Grundausrichtung + Mit Ball, dazu Vorlagen/eigene Taktiken), unten die Tafel
// „Defensive“ mit den Anweisungen gegen den Ball. Die Tafeln zeigen nur, was aus
// den gewählten Anweisungen und Rollen folgt; ein Klick auf einen Spieler wählt seine Rolle.
// Rechts: Eingespieltheit, gemessene Wirkung im Spiel, nächster Gegner im Vergleich.
// Liest/schreibt direkt g.clubs[managedClubId].tactics (wie LineupView).
// Teile in components/tactics/, CSS 28-tactics.css.
// =============================================================================
import { useMemo, useState } from 'react';
import type { Tactics } from '../types';
import type { Game } from '../game/state';
import { getFormation } from '../data/formations';
import { practicedTactics, validCohesion } from '../engine/cohesion';
import { seasonYearOf } from '../engine/match/era';
import { CalendarEngine } from '../engine/calendar';
import { nextOpponent } from '../game/opponentView';
import { DashBox, DashPage } from '../ui/DashPage';
import { effectiveFormation } from './lineup/lineupOps';
import { InstructionPanel } from './tactics/InstructionPanel';
import { INSTRUCTIONS, type InstrKey, type Section } from './tactics/instructions';
import { CohesionBox, OpponentBox } from './tactics/SideBoxes';
import { TacticBoard, type BoardPhase } from './tactics/TacticBoard';
import { TacticEffect } from './tactics/TacticEffect';
import { TacticPresets } from './tactics/TacticPresets';

export default function TacticsView({ g, onChange }: { g: Game; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const t: Tactics = myClub.tactics;
  const [, force] = useState(0);
  const year = seasonYearOf(g.calendar.currentDate);
  const set = (patch: Partial<Tactics>) => { Object.assign(t, patch); force((n) => n + 1); onChange(); };
  const setRole = (slotId: string, roleId: string | null) => {
    const roles = { ...(t.roles ?? {}) };
    if (roleId) roles[slotId] = roleId; else delete roles[slotId];
    set({ roles });
  };
  const formation = effectiveFormation(t);
  const nx = nextOpponent(g);
  const opp = nx ? g.clubs[nx.opp] ?? null : null;

  // Eingeübte Wahl je Anweisung (Markierung in der Mitte)
  const co = myClub.cohesion;
  const drilledKey = validCohesion(co) ? JSON.stringify(co.p) : '';
  const drilled = useMemo(() => {
    if (!validCohesion(co)) return undefined;
    const pt = { ...t, ...practicedTactics(co) };
    const out: Partial<Record<InstrKey, number>> = {};
    for (const d of INSTRUCTIONS) if (d.key !== 'effort') out[d.key] = d.get(pt, year);
    return out;
  }, [drilledKey, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const board = (phase: BoardPhase) => <TacticBoard t={t} year={year} formation={formation} players={g.players} phase={phase} setRole={setRole} />;
  const panel = (sections: Section[]) => <InstructionPanel t={t} year={year} set={set} drilled={drilled} sections={sections} />;
  return (
    <DashPage className="tx-page">
      <DashBox title="In Ballbesitz" info="taktiktafel" flush className="tx-board-box tx-ball-board" right={<span className="tx-form">{getFormation(t.formation).label}</span>}>
        {board('ball')}
      </DashBox>
      <DashBox title="Anweisungen" info="anweisungen" flush className="tx-instr-box tx-ball-instr" right={<TacticPresets g={g} t={t} year={year} set={set} />}>
        {panel(['grund', 'ball'])}
      </DashBox>
      <DashBox title="Defensive" info="taktiktafel" flush className="tx-board-box tx-def-board">
        {board('gegen')}
      </DashBox>
      <DashBox title="Anweisungen" info="anweisungen" flush className="tx-instr-box tx-def-instr">
        {panel(['gegen'])}
      </DashBox>

      <div className="tx-side">
        <DashBox title="Eingespieltheit" info="eingespieltheit" className="tx-coh-box">
          <CohesionBox g={g} set={set} />
        </DashBox>
        <DashBox title="Wirkung im Spiel" info="wirkung" right="gemessen" className="tx-eff-box">
          <TacticEffect club={myClub} players={g.players} opp={opp} year={year} />
        </DashBox>
        <DashBox title="Nächster Gegner" className="tx-opp-box" right={nx ? (nx.home ? 'Heimspiel' : 'Auswärts') : undefined}>
          <OpponentBox me={myClub} opp={opp} year={year} when={nx ? `${CalendarEngine.formatDate(nx.date)} · ${nx.comp}` : undefined} />
        </DashBox>
      </div>
    </DashPage>
  );
}
