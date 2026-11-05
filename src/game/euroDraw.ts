// =============================================================================
// Europapokal 2.0 – Ziehungen: Gruppen (Töpfe, Länderschutz, Vorgruppen-Schutz),
// Ligaphase (Töpfe → Gegner je Topf), K.-o.-Runden (frei, gesetzt, fest) und das
// Anlegen der Begegnungen mit Hin- und Rückspiel. Aufruf aus game/cupDraw.ts
// (`performDraw`) am Auslosungstag bzw. direkt, wenn eine Paarung feststeht
// (Finale, Halbfinale 1993/94 beim Gruppensieger).
// =============================================================================
import { drawRulesFor, drawVenue } from '../data/drawHistory';
import { euroCompName, euroFormat } from '../data/euroFormats';
import type { EuroCompId } from '../data/europe';
import { buildEuroClubFull } from '../data/generate';
import { CalendarEngine } from '../engine/calendar';
import { runDraw } from '../engine/cupDrawRules';
import { buildGroupMatches, buildLeaguePhase, groupName } from '../engine/euroGroups';
import { drawGroups, potsByStrength } from '../engine/groupDraw';
import { makeMessage, pushMessage } from '../engine/messages';
import type { CupRound, CupState, CupTie } from '../types';
import type { DrawRecord } from '../types/draw';
import type { CupLeg } from '../types/euro2';
import { cupStartYear } from './euroSetup';
import { hashSeed, homeCountryKey, type Game } from './state';

const emptyLeg = (home: string, away: string, date: string): CupLeg =>
  ({ home, away, date, played: false, homeGoals: null, awayGoals: null, decision: null, penalties: null, match: null });

/** Begegnung einer K.-o.-Runde anlegen (bei zwei Spielen mit Rückspiel beim Gegner). */
export function makeTieV2(comp: EuroCompId, round: CupRound, i: number, home: string, away: string, mid: string): CupTie {
  const dates = round.dates ?? [round.date];
  const tie: CupTie = {
    id: `euro_${comp}_r${round.index}_t${i}`, round: round.index, homeClubId: home, awayClubId: away, date: dates[0],
    played: false, involvesPlayerClub: home === mid || away === mid, match: null,
    homeGoals: null, awayGoals: null, decision: null, penalties: null, winnerClubId: null,
  };
  tie.legs = round.legs === 2 ? [emptyLeg(home, away, dates[0]), emptyLeg(away, home, dates[1] ?? dates[0])] : [emptyLeg(home, away, dates[0])];
  return tie;
}

/** Gegner des eigenen Vereins mit vollem Kader anlegen (Textmodus, Statistik). */
export function materializeOpponents(g: Game, cup: CupState, round: CupRound): void {
  const mid = g.managedClubId;
  const ids = new Set<string>();
  for (const t of round.ties) if (t.homeClubId === mid || t.awayClubId === mid) { ids.add(t.homeClubId); ids.add(t.awayClubId); }
  for (const gr of round.groups ?? []) {
    if (!gr.ids.includes(mid)) continue;
    for (const m of gr.matches) if (m.home === mid || m.away === mid) { ids.add(m.home); ids.add(m.away); }
  }
  for (const id of ids) {
    if (g.clubs[id]) continue;
    const eu = g.euroClubs?.[id];
    if (eu) g.clubs[id] = buildEuroClubFull(eu, g.calendar?.seasonStartDate ?? '', g.players);
  }
  void cup;
}

const strengthOf = (g: Game) => (id: string): number => {
  const c = g.clubs[id];
  if (c && c.playerIds.length && !g.euroClubs?.[id]) {
    const ovs = c.playerIds.map((p) => g.players[p]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    return ovs.reduce((a, b) => a + b, 0) / Math.max(1, ovs.length);
  }
  return g.euroClubs?.[id]?.strength ?? g.simClubs?.[id]?.strength ?? c?.reputation ?? 50;
};
const countryOf = (g: Game) => (id: string) => g.euroClubs?.[id]?.country ?? homeCountryKey(g);
const nameOf = (g: Game) => (id: string) => g.clubs[id]?.name ?? g.euroClubs?.[id]?.name ?? g.simClubs?.[id]?.name ?? id;

/** Paarung ohne Ziehung (Finale; Halbfinale 1993/94: A1–B2, B1–A2 beim Gruppensieger). */
export function autoPair(g: Game, comp: EuroCompId, cup: CupState, ri: number): boolean {
  const round = cup.rounds[ri];
  const ids = round.entrants ?? [];
  if (round.drawn || ids.length < (round.need ?? 2) || ids.length < 2) return false;
  const mid = g.managedClubId;
  let pairs: [string, string][];
  if (round.drawMode === 'fixed') {
    const at = (grp: string, pos: number) => ids.find((id) => round.groupOf?.[id] === grp && round.seedOf?.[id] === pos)!;
    const grs = [...new Set(ids.map((id) => round.groupOf?.[id] ?? 'A'))].sort();
    pairs = [[at(grs[0], 1), at(grs[1], 2)], [at(grs[1], 1), at(grs[0], 2)]].filter((p) => p[0] && p[1]) as [string, string][];
  } else {
    pairs = [];
    for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i], ids[i + 1]]);
  }
  round.ties = pairs.map(([h, a], i) => makeTieV2(comp, round, i, h, a, mid));
  round.drawn = true;
  cup.currentRoundIndex = ri;
  materializeOpponents(g, cup, round);
  return true;
}

/** Ziehung einer Runde im neuen Modus. */
export function performDrawV2(g: Game, comp: EuroCompId, cup: CupState, ri: number, today: string): DrawRecord | null {
  const round = cup.rounds[ri];
  const ids = [...(round.entrants ?? [])];
  if (!round || round.drawn || ids.length < 2 || ids.length < (round.need ?? 0)) return null;
  const y = cupStartYear(cup);
  const fmt = euroFormat(comp, y);
  const st = fmt?.stages[ri];
  if (!fmt || !st) return null;
  const mid = g.managedClubId;
  const str = strengthOf(g), ctry = countryOf(g), nm = nameOf(g);
  const seed = hashSeed(`${cup.seed}:ziehung:${comp}:${ri}`);
  const v = drawVenue(comp, ri, y);
  const rec: DrawRecord = {
    comp, roundIndex: ri, roundName: round.name, date: today, matchDate: round.date, venue: v.venue, stage: v.stage,
    pots: [], balls: [], pairs: [], rules: [],
  };
  const prefix = `euro_${comp}_r${ri}`;
  if (st.kind === 'groups') {
    const fromGroups = ids.some((id) => round.seedOf?.[id] != null);
    const pots = fromGroups
      ? [{ label: 'Gruppensieger', ids: ids.filter((id) => round.seedOf?.[id] === 1) }, { label: 'Gruppenzweite', ids: ids.filter((id) => round.seedOf?.[id] !== 1) }]
      : potsByStrength(ids, st.size ?? 4, str);
    const out = drawGroups({
      pots, groups: st.groups ?? 1, perPot: fromGroups ? [2, 2] : undefined, seed, nameOf: nm,
      clash: (a, b) => ctry(a) === ctry(b) || (!!round.groupOf?.[a] && round.groupOf?.[a] === round.groupOf?.[b]),
    });
    round.groups = out.groups.map((gr, gi) => ({ name: gr.name, ids: gr.ids, matches: buildGroupMatches(gr.ids, st.rr ?? 2, round.dates ?? [round.date], `${prefix}_g${gi}`) }));
    Object.assign(rec, { pots: out.pots, balls: out.balls, groups: out.groups });
    rec.rules = [
      fromGroups ? 'Zwei Töpfe: Gruppensieger und Gruppenzweite, je zwei pro Gruppe.' : `${out.pots.length} Lostöpfe nach Spielstärke, aus jedem Topf ein Verein je Gruppe.`,
      'Länderschutz: Vereine eines Landes kommen nicht in dieselbe Gruppe.' + (fromGroups ? ' Gegner aus derselben Vorgruppe auch nicht.' : ''),
      `${st.size === 5 ? 'Jeder spielt einmal gegen jeden (zwei Heim-, zwei Auswärtsspiele).' : 'Hin- und Rückspiel gegen jeden Gruppengegner.'}`,
    ];
  } else if (st.kind === 'league') {
    const pots = potsByStrength(ids, st.pots ?? 4, str);
    const rnd = (() => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const matches = buildLeaguePhase(pots.map((p) => p.ids), st.matches ?? 8, round.dates ?? [round.date], rnd, ctry, `${prefix}_g0`);
    round.groups = [{ name: 'Ligaphase', ids, matches }];
    const opponents: NonNullable<DrawRecord['opponents']> = {};
    for (const id of ids) opponents[id] = { home: [], away: [] };
    for (const m of [...matches].sort((a, b) => a.md - b.md)) { opponents[m.home].home.push(m.away); opponents[m.away].away.push(m.home); }
    let no = 0;
    rec.pots = pots.map((p) => ({ label: p.label, ids: [...p.ids].sort((a, b) => nm(a).localeCompare(nm(b), 'de')) }));
    rec.balls = rec.pots.flatMap((p, pi) => p.ids.map((id) => ({ id, pot: pi, no: ++no, pair: 0, group: 0 })));
    rec.groups = [{ name: 'Ligaphase', ids }];
    rec.opponents = opponents;
    rec.rules = [
      `${pots.length} Lostöpfe nach Spielstärke.`,
      st.matches === 8 ? 'Jeder Verein bekommt zwei Gegner aus jedem Topf – einen daheim, einen auswärts.' : 'Jeder Verein bekommt einen Gegner aus jedem Topf, drei Heim- und drei Auswärtsspiele.',
      'Keine Gegner aus dem eigenen Land. Eine Tabelle für alle 36 Vereine.',
    ];
  } else {
    // K.-o.-Runde
    const seededMode = st.draw === 'seeded';
    const base = drawRulesFor(comp, ri === 0 ? 0 : 2, y);
    const prevKo = ri > 0 && fmt.stages[ri - 1].kind === 'ko';
    const rules = seededMode
      ? { twoPots: false, amateurHome: false, seeded: true, countryProtection: true }
      : ri === 0 ? drawRulesFor(comp, 0, y)
        : { ...base, countryProtection: comp === 'uefa' && ri === 1 && prevKo && y < 2004 };
    let fixedPots: { label: string; ids: string[] }[] | undefined;
    if (seededMode) {
      const sorted = [...ids].sort((a, b) => (round.seedOf?.[a] ?? 5) - (round.seedOf?.[b] ?? 5) || str(b) - str(a) || a.localeCompare(b));
      const half = Math.floor(sorted.length / 2);
      fixedPots = [{ label: 'Ungesetzt', ids: sorted.slice(half) }, { label: 'Gesetzt', ids: sorted.slice(0, half) }];
    }
    const out = runDraw({
      ids, rules, seed, isAmateur: () => false, countryOf: ctry, strengthOf: str, nameOf: nm, fixedPots,
      forbid: seededMode ? (a, b) => !!round.groupOf?.[a] && round.groupOf?.[a] === round.groupOf?.[b] : undefined,
    });
    if (seededMode) {
      const seeded = new Set(out.pots[1]?.ids ?? []);
      for (const p of out.pairs) if (seeded.has(p.home) && !seeded.has(p.away)) { [p.home, p.away] = [p.away, p.home]; p.swapped = true; }
    }
    round.ties = out.pairs.map((p, i) => makeTieV2(comp, round, i, p.home, p.away, mid));
    Object.assign(rec, { pots: out.pots, balls: out.balls, pairs: out.pairs });
    if (seededMode) rec.rules.push('Gesetzt sind die besser platzierten Vereine; sie spielen zuerst auswärts und haben das Rückspiel daheim.', 'Kein Duell aus derselben Gruppe oder demselben Land.');
    else if (rules.seeded) rec.rules.push('Setzliste nach Spielstärke: Gesetzte treffen auf Ungesetzte.');
    else rec.rules.push('Ein Lostopf. Der zuerst gezogene Verein hat zuerst Heimrecht.');
    if (!seededMode && rules.countryProtection) rec.rules.push('Länderschutz: Vereine eines Landes treffen nicht aufeinander.');
    rec.rules.push(round.legs === 2 ? 'Hin- und Rückspiel, das Gesamtergebnis entscheidet.' : 'Ein Spiel entscheidet.');
  }
  round.drawn = true;
  round.draw = rec;
  cup.currentRoundIndex = ri;
  materializeOpponents(g, cup, round);
  return rec;
}

/** Nachricht zur Ziehung (nur mit eigenem Verein). */
export function drawMessageV2(g: Game, comp: EuroCompId, cup: CupState, rec: DrawRecord): void {
  const mid = g.managedClubId;
  const round = cup.rounds[rec.roundIndex];
  const nm = nameOf(g);
  const name = euroCompName(comp, cupStartYear(cup));
  const my = round.ties.find((t) => t.homeClubId === mid || t.awayClubId === mid);
  const myGroup = round.groups?.find((gr) => gr.ids.includes(mid));
  if (!my && !myGroup) return;
  let short: string, body: string;
  if (my) {
    const opp = nm(my.homeClubId === mid ? my.awayClubId : my.homeClubId);
    const legs = my.legs ?? [];
    short = `Dein Los: ${opp}`;
    body = legs.length === 2
      ? `Hinspiel ${legs[0].home === mid ? 'zu Hause' : 'auswärts'} am ${CalendarEngine.formatDate(legs[0].date)}, Rückspiel ${legs[1].home === mid ? 'zu Hause' : 'auswärts'} am ${CalendarEngine.formatDate(legs[1].date)}.`
      : `Ein Spiel am ${CalendarEngine.formatDate(my.date)}.`;
    body = `Dein Gegner: ${opp}.\n\n${body}`;
  } else {
    const ms = myGroup!.matches.filter((m) => m.home === mid || m.away === mid).sort((a, b) => a.md - b.md);
    short = round.kind === 'league' ? `${ms.length} Gegner in der Ligaphase` : `Gruppe ${myGroup!.name}: ${myGroup!.ids.filter((x) => x !== mid).map(nm).join(', ')}`;
    body = `${round.kind === 'league' ? 'Deine Gegner in der Ligaphase' : `Gruppe ${myGroup!.name}`}:\n`
      + ms.map((m) => `• ${CalendarEngine.formatDate(m.date)}: ${m.home === mid ? `gegen ${nm(m.away)} (Heim)` : `bei ${nm(m.home)} (Auswärts)`}`).join('\n');
  }
  pushMessage(g.messages, makeMessage({
    date: rec.date, category: 'cup', from: 'Europapokal-Kommission',
    subject: `Auslosung ${round.name} — ${name} ${cup.season}`, shortText: short,
    bodyText: `${body}\n\nDie Ziehung (${rec.venue}) kannst du unter Statistiken › International noch einmal ansehen.`,
    actionRequired: false,
  }));
}

export { groupName };
