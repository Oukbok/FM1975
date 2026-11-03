// =============================================================================
// ZENTRALE – reine Anzeige-Daten der Widgets (keine Spiellogik, nichts gespeichert).
// =============================================================================
import { seasonLabel } from '../../../engine/calendar';
import { totalIncome } from '../../../engine/finances';
import { competitionOptions, type CompOption } from '../../../game/competitionView';
import { inEuroCup } from '../../../game/euroFixture';
import { buildEdition, pressIssues } from '../../../game/press/edition';
import type { PressEdition, PressStory } from '../../../game/press/types';
import type { Game } from '../../../game/state';
import { seasonStartYear } from '../../../data/timeline';
import type { InboxMessage, Player } from '../../../types';
import { fitness100, form100, freshness100, playerMorale100 } from '../../../components/status';

// ----------------------------------------------------------------- Spiele
export interface DashGame {
  date: string;
  comp: 'Liga' | 'Pokal' | 'Europa';
  home: boolean;
  opp: string;
  /** Tore eigener Verein / Gegner (null = offen). */
  gf: number | null;
  ga: number | null;
  matchId?: string;
}

/** Eigene Pflichtspiele der Saison (Liga, Landespokal, Europapokal), zeitlich sortiert. */
export function ownGames(g: Game): DashGame[] {
  const me = g.managedClubId;
  const out: DashGame[] = [];
  const add = (comp: DashGame['comp'], date: string, h: string, a: string, hg: number | null, ag: number | null, matchId?: string) => {
    if (h !== me && a !== me) return;
    const home = h === me;
    out.push({ date, comp, home, opp: home ? a : h, gf: hg == null ? null : home ? hg : ag, ga: ag == null ? null : home ? ag : hg, matchId });
  };
  for (const m of g.fixtures) {
    if (!m.involvesPlayerClub) continue;
    add('Liga', m.date, m.homeClubId, m.awayClubId, m.result?.homeGoals ?? null, m.result?.awayGoals ?? null, m.result ? m.id : undefined);
  }
  const cups = [['Pokal', g.cup] as const, ...(['ec', 'cwc', 'uefa'] as const).map((k) => ['Europa', g.euroCups?.[k]] as const)];
  for (const [comp, cup] of cups) {
    for (const r of cup?.rounds ?? []) {
      for (const t of r.ties ?? []) {
        if (t.legs?.length) for (const l of t.legs) add(comp, l.date, l.home, l.away, l.played ? l.homeGoals : null, l.played ? l.awayGoals : null, l.match?.id);
        else add(comp, t.date, t.homeClubId, t.awayClubId, t.played ? t.homeGoals : null, t.played ? t.awayGoals : null, t.match?.id);
      }
      for (const gr of r.groups ?? []) for (const m of gr.matches) add(comp, m.date, m.home, m.away, m.hg, m.ag, m.match?.id ?? undefined);
    }
  }
  return out.filter((x) => x.date).sort((a, b) => a.date.localeCompare(b.date));
}

// ----------------------------------------------------------------- Budget
export function budgetOf(g: Game) {
  const f = g.clubs[g.managedClubId].finances;
  const e = f.expenses;
  return {
    income: totalIncome(f),
    wages: e.wages + e.staffWages,
    transfers: f.income.transferIncome - e.transferExpense,
    build: e.stadiumMaintenance + e.facilities + e.trainingFacilities,
    other: (e.operations ?? 0) + e.other,
    balance: f.balance,
    transferBudget: f.transferBudget,
  };
}

// ----------------------------------------------------------------- Team
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function teamStatus(g: Game) {
  const club = g.clubs[g.managedClubId];
  const squad = club.playerIds.map((id) => g.players[id]).filter(Boolean) as Player[];
  const xiIds = club.tactics?.startingXI?.filter((id) => g.players[id]) ?? [];
  const xi = xiIds.length >= 11 ? xiIds.map((id) => g.players[id]) : [...squad].sort((a, b) => b.overall - a.overall).slice(0, 11);
  const fit = squad.filter((p) => !p.injury);
  return {
    strength: Math.round(mean(xi.map((p) => p.overall))),
    fitness: Math.round(mean(fit.map(fitness100))),
    freshness: Math.round(mean(fit.map(freshness100))),
    form: Math.round(mean(fit.map(form100))),
    morale: Math.round(mean(squad.map(playerMorale100))),
    size: squad.length,
  };
}

export interface Absence { p: Player; kind: 'injury' | 'ban'; text: string; sort: number }

export function absences(g: Game): Absence[] {
  const club = g.clubs[g.managedClubId];
  const out: Absence[] = [];
  for (const id of club.playerIds) {
    const p = g.players[id];
    if (!p) continue;
    if (p.injury) {
      const d = Math.max(1, p.injury.daysRemaining);
      out.push({ p, kind: 'injury', text: d >= 14 ? `${Math.round(d / 7)} Wo.` : `${d} ${d === 1 ? 'Tag' : 'Tage'}`, sort: d });
    }
    if (p.suspensionMatches > 0) out.push({ p, kind: 'ban', text: `${p.suspensionMatches} ${p.suspensionMatches === 1 ? 'Spiel' : 'Spiele'}`, sort: p.suspensionMatches * 7 });
  }
  return out.sort((a, b) => b.sort - a.sort);
}

// ----------------------------------------------------------------- Übersicht
export interface OvItem extends CompOption { season: string; mine: boolean }
export interface OvSection { key: string; label: string; items: OvItem[] }

/** Wettbewerbe der laufenden Saison (+ Auslandsligen der Vorsaison), gruppiert. */
export function overviewSections(g: Game): OvSection[] {
  const me = g.managedClubId;
  const live = competitionOptions(g, g.season);
  const prev = seasonLabel(seasonStartYear(g.season) - 1);
  const abroad = g.world ? competitionOptions(g, prev).filter((o) => o.section === 'Ausland') : [];
  const mineOf = (o: CompOption) => (o.kind === 'league' ? o.key === g.leagues.playerDivision.id
    : o.key === 'cup' ? !!g.cup?.rounds.some((r) => r.ties.some((t) => t.homeClubId === me || t.awayClubId === me) || r.entrants?.includes(me))
    : inEuroCup(g.euroCups?.[o.key as 'ec' | 'cwc' | 'uefa'], me));
  const it = (o: CompOption, season: string): OvItem => ({ ...o, season, mine: mineOf(o) && season === g.season });
  const de = live.filter((o) => o.section === 'Deutschland' || o.section === 'Pokal').map((o) => it(o, g.season));
  const out: OvSection[] = [{ key: 'de', label: 'Deutschland', items: de }];
  const ddr = live.filter((o) => o.section === 'DDR').map((o) => it(o, g.season));
  if (ddr.length) out.push({ key: 'ddr', label: 'DDR', items: ddr });
  const eu = live.filter((o) => o.section === 'Europa').map((o) => it(o, g.season));
  if (eu.length) out.push({ key: 'eu', label: 'Internationale Wettbewerbe', items: eu });
  if (abroad.length) out.push({ key: 'ab', label: `Ausland ${prev}`, items: abroad.map((o) => it(o, prev)) });
  return out;
}

// ----------------------------------------------------------------- Fan-Medium
export interface FanItem { id: string; date: string; title: string; text?: string; rumor: boolean; story: PressStory; ed: PressEdition }

/** Frühere Ausgaben sind stabil (aus dem Spielstand rekonstruiert) – je Spielstand zwischenspeichern,
 *  damit der Zeitlauf nur die Ausgabe des Tages neu setzt. */
const EDITIONS = new WeakMap<Game, Map<string, PressEdition>>();
function editionCache(g: Game): Map<string, PressEdition> {
  let m = EDITIONS.get(g);
  if (!m || m.size > 40) { m = new Map(); EDITIONS.set(g, m); }
  return m;
}

/** Vereinsnachrichten + Gerüchte zum eigenen Verein aus den letzten Presse-Ausgaben. */
export function fanFeed(g: Game, max = 12): FanItem[] {
  const me = g.managedClubId;
  const mine = new Set(g.clubs[me].playerIds);
  const seen = new Set<string>();
  const out: FanItem[] = [];
  const cache = editionCache(g);
  for (const d of pressIssues(g, 5)) {
    let ed = d < g.calendar.currentDate ? cache.get(d) : undefined;
    if (!ed) {
      try { ed = buildEdition(g, d); } catch { continue; }
      if (d < g.calendar.currentDate) cache.set(d, ed);
    }
    for (const s of [ed.lead, ...ed.stories, ...ed.briefs]) {
      if (!s || s.kind === 'tabelle' || s.kind === 'spieltag') continue;
      if (!(s.own || s.clubs.includes(me) || s.people.some((p) => mine.has(p)))) continue;
      if (seen.has(s.headline)) continue;
      seen.add(s.headline);
      out.push({ id: `${d}:${s.id}`, date: s.date && s.date < d ? s.date : d, title: s.headline, text: s.dek ?? s.body[0], rumor: !!s.rumor, story: s, ed });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, max);
}

// ----------------------------------------------------------------- Nachrichten
export type MsgGroup = 'Heute' | 'Gestern' | 'Diese Woche' | 'Älter';
const dayNo = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10) + 'T00:00:00Z') / 864e5);

export function msgGroup(m: InboxMessage, today: string): MsgGroup {
  const d = dayNo(today) - dayNo(m.date);
  return d <= 0 ? 'Heute' : d === 1 ? 'Gestern' : d < 7 ? 'Diese Woche' : 'Älter';
}

/** Spieler zur Nachricht (relatedId), auch aus der Jugend. */
export function msgPlayer(g: Game, m: InboxMessage): Player | null {
  if (!m.relatedId) return null;
  return g.players[m.relatedId] ?? g.youthPlayers[m.relatedId] ?? null;
}
