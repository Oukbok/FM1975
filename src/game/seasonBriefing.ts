// =============================================================================
// SAISON-BRIEFING — Zusammensetzen, Archiv, Nachricht (ohne Oberfläche)
// -----------------------------------------------------------------------------
// Zu Spielbeginn und zu jedem Saisonwechsel entsteht ein Briefing:
//  • erste Saison: „So anders ist der Fußball 1975/76“ – alle geltenden
//    Unterschiede zum heutigen Fußball (data/briefings/differences.ts), nach
//    Thema gruppiert, dazu Fußball/Gesellschaft der Saison;
//  • jede weitere Saison: „Was ist neu?“ – Fußball/Gesellschaft der Saison,
//    Unterschiede, die enden („ab jetzt wie heute“) oder neu beginnen, plus
//    kompakt alle, die weiter gelten;
//  • immer: „Neu im Spiel“ (game/briefingChanges.ts) und „Deine Ausgangslage“.
// Am Spielstand liegt nur das kleine Archiv `game.briefing` (Saison + Eckdaten
// der Ausgangslage); die Inhalte werden aus den Daten rekonstruiert.
// Oberfläche: views/zentrale/BriefingModal.tsx (Popup) + BriefingView.tsx (Archiv).
// =============================================================================
import {
  BRIEFING_TOPICS, BriefingItem, BriefingTopic, DifferenceToToday,
  briefingFor, differencesEnded, differencesFor, differencesStarting, topicMeta,
} from '../data/briefings';
import { economyScale } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { GameChange, gameChangesFor } from './briefingChanges';
import { Game } from './state';

/** Eckdaten „Deine Ausgangslage“ zum Saisonstart (Geld nominal in der Währung der Zeit). */
export interface BriefingSituation {
  goal: string;
  confidence: number;
  league: string;
  tier: number;
  balance: number;
  transferBudget: number;
  squad: number;
  avgAge: number;
  avgOvr: number;
  rank: number;
  of: number;
  foreigners: number;
  best?: { name: string; ovr: number; pos: string };
}

export interface BriefingRecord {
  season: string;
  /** Erste Saison dieses Spiels (Variante „So anders ist der Fußball“). */
  first?: boolean;
  date: string;
  sit?: BriefingSituation;
}

/** Optionales Spielstandfeld `game.briefing`. */
export interface BriefingLog {
  records: BriefingRecord[];
  /** Briefing, das die Oberfläche noch automatisch zeigen soll. */
  pending?: string;
}

export interface BriefingHighlight {
  icon: string;
  kicker: string;
  title: string;
  text: string;
}

export interface DifferenceGroup { topic: BriefingTopic; label: string; icon: string; items: DifferenceToToday[] }

export interface SeasonBriefing {
  season: string;
  startYear: number;
  first: boolean;
  title: string;
  headline: string;
  /** Liegt ein redaktioneller Eintrag vor? */
  hasEntry: boolean;
  football: BriefingItem[];
  society: BriefingItem[];
  /** Alle geltenden Unterschiede, nach Thema gruppiert. */
  differences: DifferenceGroup[];
  /** Seit dieser Saison wie heute (galten bis zur Vorsaison). */
  ended: DifferenceToToday[];
  /** Ab dieser Saison neu anders als heute. */
  started: DifferenceToToday[];
  /** Laufen in dieser Saison zum letzten Mal. */
  lastSeason: DifferenceToToday[];
  inGame: GameChange[];
  highlights: BriefingHighlight[];
  situation?: BriefingSituation;
}

const startYearOf = (season: string) => parseInt(season.slice(0, 4), 10) || 0;

function groupDifferences(list: DifferenceToToday[]): DifferenceGroup[] {
  return BRIEFING_TOPICS
    .map((t) => ({ topic: t.key, label: t.label, icon: t.icon, items: list.filter((d) => d.topic === t.key) }))
    .filter((g) => g.items.length > 0);
}

/** Die 3–5 wichtigsten Punkte für den Überblick. */
function pickHighlights(b: Omit<SeasonBriefing, 'highlights'>): BriefingHighlight[] {
  const out: BriefingHighlight[] = [];
  const add = (h: BriefingHighlight) => { if (out.length < 5 && !out.some((x) => x.title === h.title)) out.push(h); };
  if (b.first) {
    // Je Thema der deutlichste Unterschied – Regeln, Geld, Liga, Medien zuerst.
    for (const t of ['regeln', 'geld', 'liga', 'medien', 'taktik'] as BriefingTopic[]) {
      const d = b.differences.find((g) => g.topic === t)?.items[0];
      if (d && out.length < 3) add({ icon: topicMeta(t).icon, kicker: 'Damals & heute', title: d.title, text: d.then });
    }
    for (const it of b.football.filter((x) => x.inGame)) add({ icon: topicMeta(it.topic).icon, kicker: 'Im Spiel', title: it.title, text: it.inGame! });
    if (b.society[0]) add({ icon: topicMeta(b.society[0].topic).icon, kicker: 'Gesellschaft', title: b.society[0].title, text: b.society[0].text });
    for (const it of b.football) add({ icon: topicMeta(it.topic).icon, kicker: 'Fußball', title: it.title, text: it.text });
    return out;
  }
  for (const d of b.ended) add({ icon: topicMeta(d.topic).icon, kicker: 'Ab jetzt wie heute', title: d.title, text: `Vorbei. Jetzt: ${d.today}` });
  for (const c of b.inGame.filter((x) => x.major)) add({ icon: c.icon, kicker: 'Neu im Spiel', title: c.title, text: shorten(c.text) });
  for (const it of b.football.filter((x) => x.inGame)) add({ icon: topicMeta(it.topic).icon, kicker: 'Im Spiel', title: it.title, text: it.inGame! });
  for (const d of b.started) add({ icon: topicMeta(d.topic).icon, kicker: 'Neu anders als heute', title: d.title, text: d.then });
  if (b.football[0]) add({ icon: topicMeta(b.football[0].topic).icon, kicker: 'Fußball', title: b.football[0].title, text: b.football[0].text });
  if (b.society[0]) add({ icon: topicMeta(b.society[0].topic).icon, kicker: 'Gesellschaft', title: b.society[0].title, text: b.society[0].text });
  for (const it of b.football.slice(1)) add({ icon: topicMeta(it.topic).icon, kicker: 'Fußball', title: it.title, text: it.text });
  for (const c of b.inGame) add({ icon: c.icon, kicker: 'Neu im Spiel', title: c.title, text: shorten(c.text) });
  return out;
}

/** Erster Satz bzw. höchstens ~180 Zeichen. */
export function shorten(text: string, max = 180): string {
  const first = text.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? text;
  const t = first.length >= 40 ? first : text;
  return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, '') + ' …' : t;
}

/**
 * Setzt das Briefing einer Saison zusammen. `opts.first` = erste Saison des
 * Spiels, `opts.tier` = Liga-Ebene (Lizenzauflagen), `opts.situation` = Ausgangslage.
 */
export function composeBriefing(season: string, opts: { first?: boolean; tier?: number; situation?: BriefingSituation } = {}): SeasonBriefing {
  const y = startYearOf(season);
  const first = !!opts.first;
  const entry = briefingFor(y);
  const active = differencesFor(y);
  const base = {
    season, startYear: y, first,
    title: first ? `So anders ist der Fußball ${season}` : `Was ist neu ${season}?`,
    headline: entry?.headline ?? (first ? 'Willkommen im Jahr ' + y : `Saison ${season}`),
    hasEntry: !!entry,
    football: entry?.football ?? [],
    society: entry?.society ?? [],
    differences: groupDifferences(active),
    ended: first ? [] : differencesEnded(y),
    started: first ? [] : differencesStarting(y),
    lastSeason: active.filter((d) => d.to === y),
    inGame: gameChangesFor(y, { first, tier: opts.tier ?? opts.situation?.tier ?? 1 }),
    situation: opts.situation,
  };
  return { ...base, highlights: pickHighlights(base) };
}

/** Briefing eines Archiv-Eintrags. */
export function briefingOfRecord(r: BriefingRecord): SeasonBriefing {
  return composeBriefing(r.season, { first: r.first, situation: r.sit });
}

// -----------------------------------------------------------------------------
// Ausgangslage + Archiv am Spielstand
// -----------------------------------------------------------------------------

export function situationOf(g: Game): BriefingSituation | undefined {
  const club = g.clubs[g.managedClubId];
  if (!club) return undefined;
  const squad = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const top14 = (ids: string[]) => {
    const o = ids.map((id) => g.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length);
  };
  const league = g.table?.rows?.map((r) => g.clubs[r.clubId]).filter(Boolean) ?? [];
  const ranked = league.map((c) => ({ id: c.id, s: top14(c.playerIds) })).sort((a, b) => b.s - a.s);
  const rank = Math.max(1, ranked.findIndex((r) => r.id === club.id) + 1);
  const best = [...squad].sort((a, b) => b.overall - a.overall)[0];
  const year = parseInt(g.calendar.currentDate.slice(0, 4), 10);
  const avg = (f: (p: (typeof squad)[number]) => number) => squad.length ? squad.reduce((a, p) => a + f(p), 0) / squad.length : 0;
  return {
    goal: club.boardExpectation,
    confidence: Math.round(club.boardConfidence ?? 60),
    league: g.leagues?.playerDivision?.name ?? '1. Liga',
    tier: g.leagues?.playerDivision?.tier ?? 1,
    balance: Math.round(club.finances.balance),
    transferBudget: Math.round(club.finances.transferBudget * economyScale(year)),
    squad: squad.length,
    avgAge: Math.round(avg((p) => p.age) * 10) / 10,
    avgOvr: Math.round(avg((p) => p.overall)),
    rank, of: ranked.length || 1,
    foreigners: squad.filter((p) => p.nationality && !/^(GER|DE|D|DEU|Deutschland|DDR|GDR)$/i.test(p.nationality)).length,
    best: best ? { name: best.fullName || `${best.firstName} ${best.lastName}`.trim(), ovr: best.overall, pos: String(best.naturalPosition ?? '') } : undefined,
  };
}

export function briefingLog(g: Game): BriefingLog {
  if (!g.briefing) g.briefing = { records: [] };
  return g.briefing;
}

/**
 * Briefing der aktuellen Saison festhalten (Spielbeginn bzw. Saisonwechsel),
 * zum automatischen Anzeigen vormerken und als Nachricht ablegen.
 */
export function recordSeasonBriefing(g: Game, first = false): SeasonBriefing {
  const log = briefingLog(g);
  const sit = situationOf(g);
  const rec: BriefingRecord = { season: g.season, first: first || undefined, date: g.calendar.currentDate, sit };
  log.records = log.records.filter((r) => r.season !== g.season);
  log.records.push(rec);
  if (log.records.length > 80) log.records.splice(0, log.records.length - 80);
  log.pending = g.season;
  const b = briefingOfRecord(rec);
  pushMessage(g.messages, briefingMessage(b, g.calendar.currentDate));
  return b;
}

function briefingMessage(b: SeasonBriefing, date: string) {
  const lines: string[] = [];
  if (b.highlights.length) lines.push('Das Wichtigste:', ...b.highlights.map((h) => `• ${h.title} – ${h.text}`), '');
  if (!b.first && b.inGame.length) lines.push('Neu im Spiel:', ...b.inGame.map((c) => `• ${c.title}${c.where ? ` (${c.where})` : ''}`), '');
  lines.push('Das ganze Briefing findest du jederzeit unter Zentrale › Briefing.');
  return makeMessage({
    date, category: 'milestone', from: 'Saison-Briefing',
    subject: `Saison-Briefing ${b.season}: ${b.headline}`,
    shortText: b.first ? `So anders ist der Fußball ${b.season}.` : `Was ist neu? ${b.inGame.length} Änderungen im Spiel.`,
    bodyText: `${b.title}\n\n${lines.join('\n')}`,
  });
}

/** Alter Spielstand: Archiv ab der aktuellen Saison anlegen; beim Laden nie automatisch zeigen. */
export function migrateBriefing(g: Game): void {
  const log = briefingLog(g);
  if (!log.records.some((r) => r.season === g.season)) {
    log.records.push({ season: g.season, date: g.calendar.currentDate, sit: situationOf(g) });
  }
  log.pending = undefined;
}

/** Vorgemerktes Briefing als gezeigt markieren. */
export function clearPendingBriefing(g: Game): void {
  if (g.briefing) g.briefing.pending = undefined;
}
