// =============================================================================
// Hallen-Show: Anzeigedaten der Teilnehmer, Seiten für den Textmodus
// (engine/indoorMatch.ts) und Kommentar je Ereignis (data/ticker/indoor.ts).
// =============================================================================
import { Speaker, type TextCtx } from '../../data/ticker/grammar';
import { INDOOR_TEXT } from '../../data/ticker/indoor';
import { indoorSkill, type IndoorStage } from '../../engine/indoor';
import type { IndoorEvent, IndoorPlay, IndoorSide } from '../../engine/indoorMatch';
import { hashStr, mulberry32 } from '../../engine/leagues';
import { indoorName, indoorShort } from '../../game/indoorGame';
import type { Game } from '../../game/state';
import type { Player } from '../../types';

export const STAGE_LABEL: Record<IndoorStage, string> = { A: 'Gruppe A', B: 'Gruppe B', SF: 'Halbfinale', P3: 'Spiel um Platz 3', F: 'Finale' };

/** Kurzer Name für den Ticker (Nachname, bei Dopplung mit Initiale). */
function tickerName(p: Player, all: Player[]): string {
  const same = all.filter((x) => x.lastName === p.lastName).length > 1;
  return same ? `${p.firstName.charAt(0)}. ${p.lastName}` : p.lastName;
}

/** Seite für das minutengenaue Hallenspiel: Torwart + Feldspieler mit Torgefahr. */
export function indoorSide(id: string, strength: number, squad: Player[] | undefined): IndoorSide {
  if (!squad?.length) return { id, strength, field: [] };
  const tw = squad.find((p) => p.naturalPosition === 'TW');
  const field = squad.filter((p) => p !== tw).map((p) => {
    const sk = indoorSkill(p);
    const atk = (p.attributes.shooting + p.attributes.dribbling) / 2;
    return { name: tickerName(p, squad), w: Math.max(1, (sk - 35) * (atk / 60)) };
  });
  return { id, strength, keeper: tw ? tickerName(tw, squad) : undefined, field };
}

export interface TickLine {
  key: string;
  /** Spielsekunde (Neunmeterschießen: null). */
  t: number | null;
  text: string;
  tone: 'goal' | 'goal-mine' | 'hot' | 'plain' | 'whistle' | 'so-hit' | 'so-miss';
  score: [number, number];
  /** Stand im Neunmeterschießen (wenn begonnen). */
  so?: [number, number];
  ev: IndoorEvent;
}

const fmtClock = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
export { fmtClock };

/** Kommentarzeilen eines eigenen Hallenspiels. */
export function narrate(g: Game, play: IndoorPlay, own: 0 | 1, ctxInfo: { hall: string; city: string; year: number; seed: string }): TickLine[] {
  const rng = mulberry32(hashStr(`${ctxInfo.seed}|txt`));
  const sp = new Speaker({ ...INDOOR_TEXT }, rng);
  const ids = [play.match.a, play.match.b];
  const short = ids.map((id) => indoorName(g, id));
  const stage = play.match.stage;
  const ko = stage !== 'A' && stage !== 'B';
  const out: TickLine[] = [];
  let reg: [number, number] = [0, 0];
  let so: [number, number] | undefined;
  play.events.forEach((e, i) => {
    const s = e.side;
    const flags = new Set<string>();
    if (e.who) flags.add('named');
    if (e.assist) flags.add('assist');
    if (e.keeper) flags.add('keeper');
    if (s === own) flags.add('mine');
    if (e.empty) flags.add('empty');
    if (ko) flags.add('ko');
    if (stage === 'F') flags.add('final');
    const isSo = e.kind.startsWith('so_');
    const sc = isSo ? e.score : e.score;
    if (e.kind === 'goal') {
      if (sc[0] === sc[1]) flags.add('equal');
      else if ((sc[s] - sc[1 - s]) === 1 && (reg[s] - reg[1 - s]) === 0) flags.add('lead');
    }
    // Anstoß/Abpfiff: Heimmannschaft vorn.
    const team = e.kind === 'kickoff' || e.kind === 'end' ? short[0] : short[s];
    const opp = e.kind === 'kickoff' || e.kind === 'end' ? short[1] : short[1 - s];
    const ctx: TextCtx = {
      year: ctxInfo.year, flags,
      slots: {
        team, opp, who: e.who, assist: e.assist, keeper: e.keeper, score: `${sc[0]}:${sc[1]}`,
        hall: ctxInfo.hall, city: ctxInfo.city, round: STAGE_LABEL[stage],
      },
    };
    let text = '';
    let tone: TickLine['tone'] = 'plain';
    switch (e.kind) {
      case 'goal': {
        text = sp.say(e.empty ? 'goal_empty' : 'goal', ctx);
        if (s === own) { const x = sp.say('goal_mine', ctx); if (x) text += ' ' + x; }
        tone = s === own ? 'goal-mine' : 'goal';
        break;
      }
      case 'end': {
        text = sp.say('end', ctx);
        if (ko && sc[0] === sc[1]) text += ' ' + sp.say('end_draw_ko', ctx);
        tone = 'whistle';
        break;
      }
      case 'kickoff': case 'half': case 'second': tone = 'whistle'; text = sp.say(e.kind, ctx); break;
      case 'penalty': case 'keeper_out': tone = 'hot'; text = sp.say(e.kind, ctx); break;
      case 'so_start': tone = 'whistle'; so = [0, 0]; text = sp.say('so_start', ctx); break;
      case 'so_shot': so = [e.score[0], e.score[1]]; tone = e.ok ? 'so-hit' : 'so-miss'; text = sp.say(e.ok ? 'so_hit' : 'so_miss', ctx); break;
      case 'so_end': tone = 'whistle'; ctx.slots.team = short[s]; text = sp.say('so_end', ctx); break;
      default: text = sp.say(e.kind, ctx);
    }
    if (!isSo) reg = [e.score[0], e.score[1]];
    if (!text) return;
    out.push({ key: `${i}`, t: isSo ? null : e.t, text, tone, score: [reg[0], reg[1]], so: so ? [so[0], so[1]] : undefined, ev: e });
  });
  return out;
}

export { indoorName, indoorShort };
