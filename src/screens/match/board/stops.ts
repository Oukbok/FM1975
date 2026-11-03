// =============================================================================
// Optionen „Anhalten bei …“ des Textmodus: prüft die Ereignisse einer Minute
// und liefert einen Grund, wenn das Spiel für dich anhalten soll.
// =============================================================================
import type { MatchSim } from '../../../engine/match/sim';
import { onPitch } from '../../../engine/match/state';
import type { Side, SimEvent } from '../../../engine/match/types';

export interface StopOpts { stopSubs: boolean; stopLate: boolean; stopBehind: boolean; autoSubs: boolean }

export function makeStopCheck(sim: MatchSim, side: Side, opts: () => StopOpts): (evs: SimEvent[]) => string | null {
  let lateDone = false;
  let prevDiff = 0;
  const tired = new Set<string>();
  const nm = (id?: string) => (id ? sim.players[id]?.lastName ?? '' : '');
  return (evs) => {
    const o = opts();
    let why: string | null = null;
    for (const ev of evs) {
      if (ev.side !== side) continue;
      // Ohne Co-Trainer hält das Spiel bei einer Verletzung immer an.
      if (ev.kind === 'injury' && ev.detail === 'wartet') return `Verletzung: ${nm(ev.player)} kann kaum weiter`;
      if (!o.stopSubs) continue;
      if (ev.kind === 'injury') why ??= `Verletzung: ${nm(ev.player)}`;
      if (ev.kind === 'card' && ev.card !== 'yellow') why ??= `Platzverweis: ${nm(ev.player)}`;
      if (ev.kind === 'sub' && ev.detail && o.autoSubs) why ??= `Co-Trainer wechselt: ${nm(ev.player)} für ${nm(ev.other)}`;
    }
    const t = sim.team(side);
    if (!why && o.stopSubs && !o.autoSubs && sim.subsLeft(t) > 0 && sim.phase === 'play') {
      const done = onPitch(t).find((m) => m.group !== 'GK' && m.energy < 55 && !tired.has(m.id));
      if (done) { tired.add(done.id); why = `${done.p.lastName} ist am Ende seiner Kräfte`; }
    }
    const diff = sim.effDiff(side);
    if (!why && o.stopBehind && diff < 0 && diff < prevDiff) why = 'Deine Elf liegt zurück';
    prevDiff = diff;
    if (!why && o.stopLate && !lateDone && sim.period === 2 && sim.minute >= 75 && sim.phase === 'play') { lateDone = true; why = 'Schlussphase'; }
    return why;
  };
}
