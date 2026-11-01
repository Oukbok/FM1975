// =============================================================================
// Drehbuch der Ziehungs-Show: zu jeder Kugel die Kommentarzeile (Grammatik
// data/ticker/draw.ts) und die Anzeigedaten der Vereine.
// =============================================================================
import { Speaker, type TextCtx } from '../../data/ticker/grammar';
import { DRAW_TEXT } from '../../data/ticker/draw';
import { roundArticle } from '../../data/drawHistory';
import { clubStrength, drawClubName, drawCountry } from '../../game/cupDraw';
import { clubView } from '../../game/clubProfile';
import type { Game } from '../../game/state';
import type { Club } from '../../types';
import type { DrawRecord } from '../../types/draw';

export interface ShowClub {
  id: string; name: string; short: string; country: string; strength: number;
  amateur: boolean; foreign: boolean; mine: boolean;
  /** Für <ClubCrest> (Auslandsvereine als Ersatzobjekt aus Farben + Kürzel). */
  crest: Club;
}

export interface ScriptLine { text: string; tone: 'neutral' | 'mine' | 'hot' | 'rule' }

export function showClub(g: Game, id: string, amateurs: Set<string>): ShowClub {
  const eu = g.euroClubs?.[id];
  const full = g.clubs[id];
  const cv = clubView(g, id);
  const name = full?.name ?? eu?.name ?? cv.name ?? drawClubName(g, id);
  const short = full?.shortName ?? eu?.shortName ?? cv.shortName;
  const crest = (full ?? { id, name, shortName: short, city: eu?.city ?? cv.city, colors: eu?.colors ?? cv.colors }) as Club;
  return {
    id, name, short, country: drawCountry(g, id), strength: clubStrength(g, id),
    amateur: amateurs.has(id), foreign: !!eu && !full, mine: id === g.managedClubId, crest,
  };
}

function seedRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Kommentar je Kugel (Index wie `rec.balls`) + Einleitung + Schluss. */
export function buildScript(g: Game, rec: DrawRecord, clubs: Record<string, ShowClub>): { intro: string; perBall: ScriptLine[]; end: string } {
  const year = Number(rec.date.slice(0, 4));
  const sp = new Speaker({ ...DRAW_TEXT }, seedRng(rec.balls.length * 31 + year));
  const me = clubs[g.managedClubId]?.name ?? '';
  const ctx = (slots: Record<string, string>, flags: string[] = []): TextCtx => ({
    year, flags: new Set([...(rec.comp === 'cup' ? ['cup'] : []), ...flags]),
    slots: { round: rec.roundName, round_n: roundArticle(rec.roundName), round_g: roundArticle(rec.roundName, 'gen'), venue: rec.venue, me, ...slots },
  });
  const perBall: ScriptLine[] = [];
  const firstOf = new Map<number, string>();
  let saidHome = false;
  for (const b of rec.balls) {
    const c = clubs[b.id];
    if (b.rejected) { perBall.push({ text: sp.say('rejected', ctx({ n: c.name })), tone: 'rule' }); continue; }
    const pair = rec.pairs[b.pair];
    if (!firstOf.has(b.pair)) {
      firstOf.set(b.pair, b.id);
      perBall.push(c.mine ? { text: sp.say('mine_first', ctx({ n: c.name })), tone: 'mine' } : { text: sp.say('first', ctx({ n: c.name })), tone: 'neutral' });
      continue;
    }
    const h = clubs[pair.home], a = clubs[pair.away];
    const parts = [sp.say('pair', ctx({ h: h.name, a: a.name }))];
    let tone: ScriptLine['tone'] = 'neutral';
    const strong = Math.min(h.strength, a.strength), gap = Math.abs(h.strength - a.strength);
    const mine = h.mine ? h : a.mine ? a : null;
    if (mine) {
      const opp = mine === h ? a : h;
      const diff = opp.strength - mine.strength;
      parts.push(sp.say(diff >= 4 ? 'mine_pair_hard' : diff <= -4 ? 'mine_pair_good' : 'mine_pair_even', ctx({})));
      tone = 'mine';
    } else if (strong >= 70 && gap <= 6) { parts.push(sp.say('big', ctx({}))); tone = 'hot'; }
    else if (gap >= 14 || h.amateur !== a.amateur) parts.push(sp.say('david', ctx({}, h.strength < a.strength ? ['home_small'] : [])));
    // Heimrecht-Regel: bei getauschtem Heimrecht immer, sonst nur beim ersten Amateur-Heimspiel erwähnen.
    if (pair.swapped || (h.amateur && !a.amateur && !saidHome && rec.rules.some((r) => r.startsWith('Amateur')))) { parts.push(sp.say('amateur_home', ctx({}))); saidHome = true; }
    if (rec.comp !== 'cup' && h.country === a.country && !mine) parts.push(sp.say('german_duel', ctx({})));
    perBall.push({ text: parts.filter(Boolean).join(' '), tone });
  }
  return { intro: sp.say('intro', ctx({})), perBall, end: sp.say('end', ctx({})) };
}
