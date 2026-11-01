// =============================================================================
// Europapokal 2.0 – Spieltage: Hin- und Rückspiel (Gesamtergebnis, Auswärtstore auch
// in der Verlängerung bis 2020/21, Verlängerung/Elfmeter erst im Rückspiel),
// Gruppen- und Ligaspieltage, Weiterkommen (Sieger, Gruppenplätze, beste Zweite,
// Wechsel in einen anderen Wettbewerb), Einnahmen (jedes Heimspiel), Prämien
// (K.-o.-Runde, Sieg/Remis in Gruppe/Liga), Belastung (Form/Frische je Spiel).
// Spiele des eigenen Vereins: volle Match-Engine (vorbereitet über Textmodus oder
// Schnellsimulation); alle anderen: engine/euroLight.ts mit Statistik.
// =============================================================================
import { euroCompName, euroFormat, groupBonusEur } from '../data/euroFormats';
import type { EuroCompId } from '../data/europe';
import { CalendarEngine } from '../engine/calendar';
import { withEuroSink } from '../engine/compStats';
import { DM_PER_EUR, economyScale, euroMoneyFactor, yearOf } from '../engine/economy';
import { groupDone, groupStandings } from '../engine/euroGroups';
import { lightMatch, teamStrength } from '../engine/euroLight';
import { book, bookCupHomeMatch } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { MatchEngine, type KoRule } from '../engine/match';
import { makeMessage, pushMessage } from '../engine/messages';
import type { CupState, CupTie, Match, MatchResult } from '../types';
import type { CupLeg, GroupMatch } from '../types/euro2';
import { ensureDrawn } from './cupDraw';
import { autoPair } from './euroDraw';
import { cupStartYear, EURO_COMPS } from './euroSetup';
import { hashSeed, type Game } from './state';

interface Played { hg: number; ag: number; decision: CupLeg['decision']; penalties: CupLeg['penalties']; match: Match | null; result: MatchResult }

/** K.-o.-Regel des Rückspiels bzw. eines Einzelspiels. */
export function legKoRule(cup: CupState, comp: EuroCompId, tie: CupTie, slot: number): KoRule | null {
  const legs = tie.legs ?? [];
  if (legs.length === 2 && slot === 0) return null;
  if (legs.length === 2) {
    const l0 = legs[0];
    return { prev: [l0.awayGoals ?? 0, l0.homeGoals ?? 0], awayGoals: !!euroFormat(comp, cupStartYear(cup))?.awayGoals, extraTime: true, shootout: true };
  }
  return { extraTime: true, shootout: true };
}

function synthResult(hg: number, ag: number, attendance: number, yellow: [number, number], red: [number, number]): MatchResult {
  return {
    homeGoals: hg, awayGoals: ag, homePossession: 50, homeShots: 0, awayShots: 0, homeShotsOnTarget: 0, awayShotsOnTarget: 0,
    homeCorners: 0, awayCorners: 0, homeFouls: 0, awayFouls: 0, homeYellowCards: yellow[0], awayYellowCards: yellow[1],
    homeRedCards: red[0], awayRedCards: red[1], attendance,
  };
}

/** Ein Spiel austragen (eigener Verein: volle Engine, sonst Hintergrund mit Statistik). */
function playOne(g: Game, cup: CupState, home: string, away: string, date: string, id: string, md: number, ko: KoRule | null): Played {
  const mid = g.managedClubId;
  if ((home === mid || away === mid) && g.clubs[home] && g.clubs[away]) {
    const engine = new MatchEngine(g.clubs[home], g.clubs[away], g.players, g.pointSystem, {
      seed: hashSeed(`${cup.seed}:${id}`), date, competition: 'Europapokal', logClubIds: [mid], applyInjuries: g.injuriesEnabled,
      ko: ko ?? undefined,
    });
    const o = withEuroSink(cup.xstats ??= {}, () => (ko ? engine.simulateCup() : { ...engine.simulate(), decision: 'regular' as const, penalties: null }));
    const match: Match = { id, matchday: md, date, homeClubId: home, awayClubId: away, status: 'finished', result: o.result, events: o.events, involvesPlayerClub: true };
    return { hg: o.result.homeGoals, ag: o.result.awayGoals, decision: o.decision, penalties: o.penalties, match, result: o.result };
  }
  const r = lightMatch(g, cup, home, away, date, id, ko ? { ...ko, knockout: true } : null);
  return { hg: r.hg, ag: r.ag, decision: r.decision, penalties: r.penalties, match: null, result: synthResult(r.hg, r.ag, r.attendance, r.yellow, r.red) };
}

/** Einnahmen und Belastung eines gespielten Spiels. */
function afterMatch(g: Game, comp: EuroCompId, home: string, away: string, date: string, p: Played, group: boolean): void {
  const mid = g.managedClubId;
  const y = yearOf(date);
  const h = g.clubs[home], a = g.clubs[away];
  const german = (id: string) => !!g.clubs[id] && !g.euroClubs?.[id];
  if (h && german(home)) bookCupHomeMatch(h, p.result, date, home === mid, economyScale(y));
  const res = (s: 'h' | 'a'): 'W' | 'D' | 'L' => (p.hg === p.ag ? 'D' : (p.hg > p.ag) === (s === 'h') ? 'W' : 'L');
  if (h) applyMatchEffects(h, g.players, res('h'));
  if (a) applyMatchEffects(a, g.players, res('a'));
  if (group) {
    const bonus = groupBonusEur(comp, y);
    const name = euroCompName(comp, y - (Number(date.slice(5, 7)) >= 7 ? 0 : 1));
    for (const [id, r] of [[home, res('h')], [away, res('a')]] as const) {
      if (!german(id) || r === 'L') continue;
      const amt = Math.round((r === 'W' ? bonus.win : bonus.draw) * DM_PER_EUR);
      book(g.clubs[id].finances, date, amt, 'prize_money', `${name} – Prämie ${r === 'W' ? 'Sieg' : 'Unentschieden'}`, id === mid);
    }
  }
}

// -----------------------------------------------------------------------------
// K.-o.-Runden
// -----------------------------------------------------------------------------
function resolveTie(cup: CupState, comp: EuroCompId, tie: CupTie): void {
  const legs = tie.legs!;
  const last = legs[legs.length - 1];
  tie.match = last.match ?? legs[0].match;
  tie.decision = last.decision;
  if (legs.length === 1) {
    tie.homeGoals = last.homeGoals; tie.awayGoals = last.awayGoals; tie.penalties = last.penalties;
    tie.winnerClubId = last.penalties ? (last.penalties.home > last.penalties.away ? last.home : last.away)
      : (last.homeGoals! > last.awayGoals! ? last.home : last.away);
  } else {
    const [l0, l1] = legs;
    const aggH = l0.homeGoals! + l1.awayGoals!, aggA = l0.awayGoals! + l1.homeGoals!;
    tie.homeGoals = aggH; tie.awayGoals = aggA;
    tie.penalties = l1.penalties ? { home: l1.penalties.away, away: l1.penalties.home } : null;
    if (tie.penalties) tie.winnerClubId = tie.penalties.home > tie.penalties.away ? tie.homeClubId : tie.awayClubId;
    else if (aggH !== aggA) tie.winnerClubId = aggH > aggA ? tie.homeClubId : tie.awayClubId;
    else {
      // Gleichstand nach Hin- und Rückspiel ohne Elfmeter → Auswärtstore.
      tie.awayGoalsWin = true;
      tie.winnerClubId = l1.awayGoals! > l0.awayGoals! ? tie.homeClubId : tie.awayClubId;
    }
  }
  tie.played = true;
  void cup; void comp;
}

function koSlot(g: Game, comp: EuroCompId, cup: CupState, ri: number, slot: number): string | null {
  const round = cup.rounds[ri];
  const mid = g.managedClubId;
  const last = (round.legs ?? 1) - 1;
  let own: string | null = null;
  for (const tie of round.ties) {
    const leg = tie.legs?.[slot];
    if (!leg || leg.played || tie.played) continue;
    const id = `${tie.id}_l${slot}`;
    const p = playOne(g, cup, leg.home, leg.away, leg.date, id, ri + 1, legKoRule(cup, comp, tie, slot));
    Object.assign(leg, { played: true, homeGoals: p.hg, awayGoals: p.ag, decision: p.decision, penalties: p.penalties, match: p.match });
    afterMatch(g, comp, leg.home, leg.away, leg.date, p, false);
    if (slot === last) {
      resolveTie(cup, comp, tie);
      const w = tie.winnerClubId!;
      if (g.clubs[w] && !g.euroClubs?.[w] && cup.prizeByRound[ri] > 0) {
        const y = yearOf(leg.date);
        book(g.clubs[w].finances, leg.date, Math.round(cup.prizeByRound[ri] * economyScale(y) * euroMoneyFactor(comp, y)), 'prize_money',
          `${euroCompName(comp, cupStartYear(cup))} – Prämie (${round.name})`, w === mid);
      }
    }
    if (leg.home === mid || leg.away === mid) { own = id; pushMessage(g.messages, legMessage(g, comp, cup, ri, tie, slot)); }
  }
  return own;
}

// -----------------------------------------------------------------------------
// Gruppen / Ligaphase
// -----------------------------------------------------------------------------
function groupSlot(g: Game, comp: EuroCompId, cup: CupState, ri: number, md: number): string | null {
  const round = cup.rounds[ri];
  const mid = g.managedClubId;
  let own: string | null = null;
  for (const gr of round.groups ?? []) {
    for (const m of gr.matches) {
      if (m.md !== md || m.hg != null) continue;
      const p = playOne(g, cup, m.home, m.away, m.date, m.id, md + 1, null);
      m.hg = p.hg; m.ag = p.ag; m.match = p.match;
      afterMatch(g, comp, m.home, m.away, m.date, p, true);
      if (m.home === mid || m.away === mid) { own = m.id; pushMessage(g.messages, groupMessage(g, comp, cup, ri, m)); }
    }
  }
  return own;
}

/** Platzierungen festschreiben und Weiterkommende (auch in andere Wettbewerbe) eintragen. */
function finishGroups(g: Game, comp: EuroCompId, cup: CupState, ri: number): void {
  const round = cup.rounds[ri];
  const y = cupStartYear(cup);
  const fmt = euroFormat(comp, y);
  const st = fmt?.stages[ri];
  if (!fmt || !st || !round.groups) return;
  const str = (id: string) => teamStrength(g, id);
  const tables = round.groups.map((gr) => ({ gr, rows: groupStandings(gr, fmt.winPts, fmt.tiebreak, str) }));
  for (const t of tables) t.gr.final = t.rows.map((r) => r.id);
  const send = (id: string, target: string, tgtComp: EuroCompId, seed: number, grp: string) => {
    const tc = tgtComp === comp ? cup : g.euroCups?.[tgtComp];
    const tr = tc?.v2 ? tc.rounds.find((r) => r.key === target) : undefined;
    if (!tc || !tr) return;
    (tr.entrants ??= []).push(id);
    (tr.seedOf ??= {})[id] = seed;
    (tr.groupOf ??= {})[id] = grp;
    if (tr.drawMode === 'none' || tr.drawMode === 'fixed') autoPair(g, tgtComp, tc, tr.index);
  };
  for (const a of st.advance ?? []) {
    for (const t of tables) for (let pos = a.from; pos <= a.to; pos++) {
      const row = t.rows[pos - 1];
      if (row) send(row.id, a.target, a.comp ?? comp, a.seed ?? pos, `${comp}:${t.gr.name}`);
    }
  }
  if (st.bestRunnersUp) {
    const ru = tables.map((t) => t.rows[1]).filter(Boolean)
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || b.agf - a.agf || str(b.id) - str(a.id));
    for (const r of ru.slice(0, st.bestRunnersUp.count)) {
      const t = tables.find((x) => x.rows[1] === r)!;
      send(r.id, st.bestRunnersUp.target, comp, 2, `${comp}:${t.gr.name}`);
    }
  }
  const mid = g.managedClubId;
  const mine = tables.find((t) => t.gr.ids.includes(mid));
  if (mine) {
    const pos = mine.rows.findIndex((r) => r.id === mid) + 1;
    const dest = (st.advance ?? []).find((a) => pos >= a.from && pos <= a.to);
    const destName = dest ? (dest.comp && dest.comp !== comp
      ? `Wechsel in den Wettbewerb ${euroCompName(dest.comp, y)} (${g.euroCups?.[dest.comp]?.rounds.find((r) => r.key === dest.target)?.name ?? ''})`
      : `weiter: ${fmt.stages.find((s) => s.key === dest.target)?.name ?? ''}`) : (st.bestRunnersUp && pos === 2 && cup.rounds.find((r) => r.key === st.bestRunnersUp!.target)?.entrants?.includes(mid) ? 'weiter als einer der besten Gruppenzweiten' : 'ausgeschieden');
    pushMessage(g.messages, makeMessage({
      date: round.dates?.[round.dates.length - 1] ?? round.date, category: 'cup', from: 'Europapokal-Kommission',
      subject: `${round.name} beendet: Platz ${pos}${mine.gr.name !== 'Ligaphase' ? ` in Gruppe ${mine.gr.name}` : ''}`,
      shortText: `Platz ${pos} – ${destName}.`,
      bodyText: `${euroCompName(comp, y)} ${cup.season}, ${round.name}:\n\n`
        + mine.rows.map((r, i) => `${i + 1}. ${nameOf(g, r.id)} – ${r.pts} Punkte, ${r.gf}:${r.ga} Tore`).slice(0, mine.gr.name === 'Ligaphase' ? 12 : 8).join('\n')
        + `\n\nDein Verein: Platz ${pos} – ${destName}.`,
      actionRequired: false,
    }));
  }
}

const nameOf = (g: Game, id: string) => g.clubs[id]?.name ?? g.euroClubs?.[id]?.name ?? g.simClubs?.[id]?.name ?? id;

// -----------------------------------------------------------------------------
// Spieltag
// -----------------------------------------------------------------------------
/** Ein Europapokal-Spieltermin im neuen Modus. Rückgabe: Match-ID des eigenen Spiels. */
export function euroMatchdayV2(g: Game, comp: EuroCompId, cup: CupState, ri: number, slot: number, today: string): string | null {
  const round = cup.rounds[ri];
  if (!round) return null;
  if (!round.drawn) {
    if (round.drawMode === 'none' || round.drawMode === 'fixed') autoPair(g, comp, cup, ri);
    else ensureDrawn(g, comp, ri, today);
  }
  if (!round.drawn) return null;
  const own = round.kind === 'ko' ? koSlot(g, comp, cup, ri, slot) : groupSlot(g, comp, cup, ri, slot);
  const lastSlot = (round.dates?.length ?? 1) - 1;
  if (slot < lastSlot) return own;
  if (round.kind !== 'ko') {
    if ((round.groups ?? []).every(groupDone)) finishGroups(g, comp, cup, ri);
    return own;
  }
  if (!round.ties.every((t) => t.played)) return own;
  const next = cup.rounds[ri + 1];
  const winners = round.ties.map((t) => t.winnerClubId!).filter(Boolean);
  if (next) {
    for (const w of winners) (next.entrants ??= []).push(w);
    cup.currentRoundIndex = ri + 1;
    if (next.drawMode === 'none' || next.drawMode === 'fixed') autoPair(g, comp, cup, ri + 1);
  } else {
    cup.winnerClubId = winners[0] ?? null;
    const w = cup.winnerClubId;
    const name = euroCompName(comp, cupStartYear(cup));
    if (w && w !== g.managedClubId) {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'media', from: 'Europapokal-Chronik', subject: `${name} ${cup.season}: ${nameOf(g, w)}`,
        shortText: `${nameOf(g, w)} gewinnt den Wettbewerb ${name}.`,
        bodyText: `Das Finale (${name} ${cup.season}) ist entschieden. ${nameOf(g, w)} sichert sich den Titel.`, actionRequired: false,
      }));
    }
  }
  return own;
}

// -----------------------------------------------------------------------------
// Nachrichten
// -----------------------------------------------------------------------------
function badge(l: CupLeg): string {
  return l.decision === 'penalties' && l.penalties ? ` n.V., ${l.penalties.home}:${l.penalties.away} i.E.` : l.decision === 'aet' ? ' n.V.' : '';
}

function legMessage(g: Game, comp: EuroCompId, cup: CupState, ri: number, tie: CupTie, slot: number) {
  const mid = g.managedClubId;
  const round = cup.rounds[ri];
  const leg = tie.legs![slot];
  const name = euroCompName(comp, cupStartYear(cup));
  const line = `${nameOf(g, leg.home)} ${leg.homeGoals}:${leg.awayGoals}${badge(leg)} ${nameOf(g, leg.away)}`;
  const isFinal = ri === cup.rounds.length - 1;
  if (!tie.played) {
    const back = tie.legs![1];
    return makeMessage({
      date: leg.date, category: 'cup', from: 'Spielbericht Europapokal', relatedId: leg.match?.id,
      subject: `${name}, Hinspiel: ${line}`, shortText: `Rückspiel am ${CalendarEngine.formatDate(back.date)}.`,
      bodyText: `${round.name}, Hinspiel:\n\n${line}\n\nDas Rückspiel folgt am ${CalendarEngine.formatDate(back.date)} ${back.home === mid ? 'im eigenen Stadion' : 'auswärts'}.`
        + (euroFormat(comp, cupStartYear(cup))?.awayGoals ? ' Bei Gleichstand nach beiden Spielen zählen Auswärtstore doppelt.' : ''),
    });
  }
  const won = tie.winnerClubId === mid;
  const agg = tie.legs!.length === 2
    ? `\n\nGesamt: ${nameOf(g, tie.homeClubId)} ${tie.homeGoals}:${tie.awayGoals} ${nameOf(g, tie.awayClubId)}${tie.awayGoalsWin ? ' – entschieden durch die Auswärtstorregel' : ''}.` : '';
  return makeMessage({
    date: leg.date, category: 'cup', from: 'Spielbericht Europapokal', relatedId: leg.match?.id,
    subject: isFinal && won ? `Europapokalsieger! ${name} ${cup.season}` : `${name}: ${won ? 'Weiter!' : 'Aus.'} ${line}`,
    shortText: isFinal && won ? `Ihr habt den Wettbewerb ${name} gewonnen!` : won ? `${round.name} überstanden.` : `In der Runde ${round.name} ausgeschieden.`,
    bodyText: `${round.name}${tie.legs!.length === 2 ? ', Rückspiel' : ''}:\n\n${line}${agg}\n\n`
      + (isFinal && won ? 'Ein historischer Triumph in Europa!' : won ? 'Dein Verein steht in der nächsten Runde.' : 'Der Europapokal ist für diese Saison beendet.'),
  });
}

function groupMessage(g: Game, comp: EuroCompId, cup: CupState, ri: number, m: GroupMatch) {
  const round = cup.rounds[ri];
  const name = euroCompName(comp, cupStartYear(cup));
  const line = `${nameOf(g, m.home)} ${m.hg}:${m.ag} ${nameOf(g, m.away)}`;
  return makeMessage({
    date: m.date, category: 'cup', from: 'Spielbericht Europapokal', relatedId: m.id,
    subject: `${name}, ${m.md + 1}. Spieltag: ${line}`, shortText: `${round.name}, ${m.md + 1}. Spieltag.`,
    bodyText: `${round.name}, ${m.md + 1}. Spieltag:\n\n${line}\n\nDie Tabelle findest du unter Statistiken › International.`,
  });
}

/** Alle Spiele eines neuen Wettbewerbs gespielt? (Test/Diagnose) */
export function euroDone(g: Game): boolean {
  return EURO_COMPS.every((c) => { const cup = g.euroCups?.[c]; return !cup || !!cup.winnerClubId; });
}
