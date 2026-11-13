// =============================================================================
// Beteiligte Spieler einer Nachricht + Moral-Reaktion nach einer Entscheidung
// (Wunsch Pascal). Genutzt vom Newscenter (Gesichter) und von eventsGame.ts.
// -----------------------------------------------------------------------------
// Beteiligt: relatedId, eventRef.playerId, Spieler-IDs in eventRef.data und alle
// eigenen Spieler (Profis + Jugend), deren Name im Text steht (voller Name oder
// eindeutiger Nachname – nicht, wenn der Nachname dort zu einem anderen Vornamen gehört,
// z. B. der Manager oder ein Familienmitglied); Gleichnamige nur einmal, höchstens 4.
// Reaktion: Nach der Entscheidung wird die Moral-Änderung je beteiligtem Spieler
// mit seinem Gemüt gewichtet (Persönlichkeit: Ehrgeiz + Rampenlicht = Ego,
// Familie/Loyalität = Bindung ans Team, ältere Spieler gelassener) und mit
// einem Satz an der Nachricht gespeichert (`InboxMessage.moraleFx`).
// =============================================================================
import type { InboxMessage, Player } from '../types';
import type { Game } from './state';
import { personaOf } from '../engine/persona';
import { moraleScoreOf } from '../engine/dressingRoom';
import { moraleJolt } from './moraleJolt';

const pById = (g: Game, id: unknown): Player | null => (typeof id === 'string' ? g.players[id] ?? g.youthPlayers[id] ?? null : null);
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Steht der Nachname im Text bei einem anderen Vornamen („Christian Lorenz“ übernimmt –
 * der Manager, ein Verwandter, ein Trainer), ist nicht der Spieler gemeint.
 */
function otherBearer(text: string, p: Player): boolean {
  const re = new RegExp(`(\\p{Lu}[\\p{Ll}-]+)\\s+${esc(p.lastName)}(?![\\p{L}])`, 'gu');
  for (let mm = re.exec(text); mm; mm = re.exec(text)) if (mm[1] !== p.firstName) return true;
  return false;
}

export function messagePlayers(g: Game, m: InboxMessage): Player[] {
  const out: Player[] = [];
  const add = (p: Player | null) => { if (p && !out.some((x) => x.id === p.id || x.fullName === p.fullName)) out.push(p); };
  add(pById(g, m.relatedId));
  add(pById(g, m.eventRef?.playerId));
  for (const v of Object.values(m.eventRef?.data ?? {})) add(pById(g, v));
  for (const fx of m.moraleFx ?? []) add(pById(g, fx.pid));
  const club = g.clubs[g.managedClubId];
  if (club) {
    const text = `${m.subject}\n${m.shortText}\n${m.bodyText}`;
    const squad = [...club.playerIds, ...club.youthPlayerIds].map((id) => pById(g, id)).filter((p): p is Player => !!p);
    const lastCount = new Map<string, number>();
    for (const p of squad) lastCount.set(p.lastName, (lastCount.get(p.lastName) ?? 0) + 1);
    const hits: [number, Player][] = [];
    for (const p of squad) {
      let at = p.fullName ? text.indexOf(p.fullName) : -1;
      if (at < 0 && p.lastName.length >= 4 && lastCount.get(p.lastName) === 1 && !otherBearer(text, p)) {
        const mm = new RegExp(`(^|[^\\p{L}])${esc(p.lastName)}(?![\\p{L}])`, 'u').exec(text);
        if (mm) at = mm.index;
      }
      if (at >= 0) hits.push([at, p]);
    }
    hits.sort((a, b) => a[0] - b[0]).forEach(([, p]) => add(p));
  }
  return out.slice(0, 4);
}

const scoreOf = (p: Player) => (typeof p.moraleScore === 'number' && Number.isFinite(p.moraleScore) ? p.moraleScore : moraleScoreOf(p.morale));

/** Gemüt 0,4 … 1,8: wie stark ein Spieler auf Kabinen-Entscheidungen reagiert. */
export function temperOf(p: Player): number {
  const pe = personaOf(p);
  const ego = (pe.ehrgeiz + pe.rampenlicht) / 200; // 0..1
  const bond = (pe.familie + pe.loyalitaet) / 200;
  const age = p.age >= 31 ? -0.15 : p.age <= 21 ? 0.1 : 0;
  return Math.max(0.4, Math.min(1.8, 0.45 + ego * 0.95 + bond * 0.3 + age));
}

function reactionWord(d: number, t: number): string {
  if (d >= 6) return t > 1.15 ? 'ist erleichtert und freut sich riesig' : 'ist erleichtert';
  if (d >= 3) return 'ist zufrieden';
  if (d >= 1) return 'lässt es ziemlich kalt';
  if (d > -1) return 'zeigt keine Regung';
  if (d > -3) return 'nimmt es gelassen';
  if (d > -6) return 'ist verärgert';
  return t > 1.15 ? 'ist tief getroffen und lässt es alle spüren' : 'ist tief enttäuscht';
}

/** Vorher-Werte der Beteiligten (vor dem Handler). */
export function moraleBefore(g: Game, m: InboxMessage): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of messagePlayers(g, m)) if (p.clubId === g.managedClubId && !p.isYouth) map.set(p.id, scoreOf(p));
  return map;
}

/** Nach dem Handler: Änderung mit dem Gemüt gewichten und an der Nachricht speichern. */
export function recordMoraleReactions(g: Game, m: InboxMessage, before: Map<string, number>): void {
  const fx: NonNullable<InboxMessage['moraleFx']> = [];
  for (const [pid, b] of before) {
    const p = g.players[pid];
    if (!p) continue;
    const base = scoreOf(p) - b;
    const t = temperOf(p);
    if (Math.abs(base) >= 0.5) moraleJolt(g, p, base * (t - 1), base > 0 ? 'Reaktion auf deine Entscheidung' : 'Ärger über deine Entscheidung');
    const d = Math.round(scoreOf(p) - b);
    fx.push({ pid, d, w: reactionWord(d, t) });
  }
  if (fx.length) m.moraleFx = fx;
}
