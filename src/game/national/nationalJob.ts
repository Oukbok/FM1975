// =============================================================================
// NATIONALTRAINER (Wunsch Pascal: „bei Spielbeginn zusätzlich eine Nationalmannschaft
// übernehmen“). Optionales `game.nationalJob` – fehlt = wie bisher.
// -----------------------------------------------------------------------------
// • Vertrag bis zum Ende des nächsten großen Turniers der Nation (EM nur für UEFA-
//   Nationen), danach bei Erfolg Angebot zur Verlängerung um einen Turnierzyklus.
// • Ziel des Verbandes je Turnier aus dem Stärke-Rang (`goalFor`): Rang r → erwartete
//   Endplatzierung 2r+1 → Stufe des Formats (Qualifikation … Titel).
// • Vertrauen 0–100: jedes Länderspiel gegen die Erwartung (klein), Qualifikation und
//   Turnier gegen das Ziel (groß). Unter 20 → Entlassung (Nachricht, Job endet sauber,
//   alles bleibt in `history`).
// • Qualifikation: ein paar Tage vor der Nominierung (`QUAL_DAYS`) aus der Stärke deiner
//   Aufgebote der Länderspielfenster im Zyklus + Ergebnisbonus; danach steht das
//   Turnierfeld fest (buildTournament `fixedTeams`).
// • Aufgebot: game/national/nationalPick.ts. Ablauf/Haken in game/national/nationalGame.ts.
// Später leicht erweiterbar (Übernehmen mitten im Spiel = `startNationalJob`, Abgeben =
// `endNationalJob`, mehrere Stationen = `history`).
// =============================================================================
import type { Game } from '../state';
import { NATION_BY_CODE, confOf, nationExists, tournamentsOfYear, type TournamentDef, type TournamentKind } from '../../data/nationalTeams';
import { allStrengths } from './pool';
import { qualify, type NtMatch, type Tournament } from './tournament';
import { hostPick, natName } from './nationalGame';
import { addDaysISO } from '../../engine/trainingPlan';
import { hashStr } from '../../engine/leagues';
import { makeMessage, pushMessage } from '../../engine/messages';
import { CHOICE_HANDLERS } from '../eventsGame';
import { createPick, ownCampaignStrength } from './nationalPick';
import type { NjPick } from './nationalPick';

export type { NjPick } from './nationalPick';

/** Bilanz: Spiele, Siege, Remis, Niederlagen, Tore, Gegentore. */
export interface NjRec { p: number; w: number; d: number; l: number; gf: number; ga: number }
/** Ziel des Verbandes für ein Turnier (Stufe 0 = achtbar auftreten … 7 = Titel). */
export interface NjGoal { key: string; lvl: number; label: string; rank: number; of: number }
/** Eintrag der Amtszeit (Beginn, Qualifikation, Turnier, Vertrag, Ende). */
export interface NjEval {
  key: string; date: string; what: 'start' | 'qual' | 'tourn' | 'contract' | 'end';
  goal?: string; result: string; delta: number; trust: number; text: string;
}
/** Qualifikationskampagne des laufenden Zyklus: eigene Stärke je Fenster, Punkte gegen Erwartung. */
export interface NjCamp { key: string; s: number[]; pts: number; exp: number; n: number }
export interface NationalJob {
  v: 1;
  /** Nation (Kürzel aus data/nationalTeams.ts). */
  nat: string;
  since: string;
  /** Vertragsende (letzter Turniertag) und Turnier („EM 1976“). */
  until: string;
  untilKey: string;
  goal: NjGoal | null;
  trust: number;
  record: { total: NjRec; by: Record<string, NjRec> };
  history: NjEval[];
  camp?: NjCamp;
  /** Qualifikation des Vertragsturniers entschieden: Teilnehmerfeld. */
  qual?: { key: string; teams: string[]; date: string };
  /** Eigenes Aufgebot für das nächste Fenster/Turnier. */
  pick?: NjPick;
  /** Erwartung je eigenem Länderspiel (Datum|Gegner → 0–1), bis es verbucht ist. */
  exp?: Record<string, number>;
  /** Offenes Angebot zur Verlängerung. */
  offer?: { key: string; until: string; date: string };
  ended?: { date: string; reason: 'sacked' | 'expired' | 'declined' | 'resigned'; text: string };
  /** Frühere Amtszeiten (ohne eigene `prev`). */
  prev?: NationalJob[];
}
/** Offenes Angebot eines Verbandes (mitten im Spiel, game/national/nationalJob.ts `nationalVacancies`). */
export interface NationalOffer { nat: string; date: string; key: string }
type G = Game & { nationalJob?: NationalJob; nationalSackable?: boolean; nationalOffer?: NationalOffer; nationalDeclined?: Record<string, string> };

/** Entlassung möglich (Option im Assistenten, fehlt = an). */
export const sackable = (g: Game) => (g as G).nationalSackable !== false;

export const SACK_TRUST = 20;
/** Tage zwischen Entscheidung der Qualifikation und Nominierung des Turnierkaders. */
export const QUAL_DAYS = 5;
const START_TRUST = 60;

const yearOf = (iso: string) => parseInt(iso.slice(0, 4), 10);
export const fmtDay = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
export const tKey = (t: { kind: TournamentKind; year: number }) => `${t.kind} ${t.year}`;
export const tLong = (t: { kind: TournamentKind; year: number }) => `${t.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft'} ${t.year}`;
export const emptyRec = (): NjRec => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });

export function nationalJob(g: Game): NationalJob | undefined { return (g as G).nationalJob; }
/** Laufende Amtszeit (nicht beendet). */
export function activeJob(g: Game): NationalJob | null { const j = nationalJob(g); return j && !j.ended ? j : null; }

// -----------------------------------------------------------------------------
// Turnierzyklus und Ziel
// -----------------------------------------------------------------------------
/** Spielt die Nation dieses Turnier (EM nur UEFA, Nation besteht im Turnierjahr)? */
export function eligibleFor(nat: string, def: { kind: TournamentKind; year: number }): boolean {
  const n = NATION_BY_CODE[nat];
  if (!n || !nationExists(n, def.year) || (n.bannedFrom && def.year >= n.bannedFrom)) return false;
  return def.kind === 'WM' || confOf(n, def.year) === 'UEFA';
}

/** Nächstes Turnier der Nation, das nach `after` beginnt. */
export function nextCycleDef(nat: string, after: string): TournamentDef | null {
  const y = yearOf(after);
  for (let k = 0; k <= 6; k++) {
    for (const def of tournamentsOfYear(y + k, hostPick).sort((a, b) => a.start.localeCompare(b.start))) {
      if (def.start > after && eligibleFor(nat, def)) return def;
    }
  }
  return null;
}

/** Turnier zu einem Schlüssel („EM 1976“). */
export function defOfKey(key: string): TournamentDef | null {
  const [kind, ys] = key.split(' ');
  return tournamentsOfYear(parseInt(ys, 10), hostPick).find((d) => d.kind === kind) ?? null;
}

/** Stufen eines Turnierformats: Teilnahme (min) und alle erreichbaren Runden. */
export function formatLevels(def: { teams: number; year: number }): number[] {
  if (def.teams <= 4) return [5, 6, 7];
  if (def.teams === 8) return def.year === 1980 ? [1, 6, 7] : [1, 5, 6, 7];
  if (def.teams <= 16) return [1, 4, 5, 6, 7];
  if (def.teams <= 32) return [1, 3, 4, 5, 6, 7];
  return [1, 2, 3, 4, 5, 6, 7];
}
const LVL_LABEL: Record<number, string> = {
  0: 'Achtbar auftreten', 1: 'Qualifikation schaffen', 2: 'Sechzehntelfinale erreichen', 3: 'Achtelfinale erreichen',
  4: 'Viertelfinale erreichen', 5: 'Halbfinale erreichen', 6: 'Finale erreichen', 7: 'Titel gewinnen',
};
export function lvlLabel(lvl: number, def: { teams: number; year: number }): string {
  return lvl > 0 && lvl === formatLevels(def)[0] ? 'Qualifikation schaffen' : LVL_LABEL[lvl] ?? '';
}
/** Ergebnis-Text (tournament.ts `result`) → Stufe. */
export function resultLvl(res: string | undefined): number {
  switch (res) {
    case 'Vorrunde': return 1; case 'Sechzehntelfinale': return 2; case 'Achtelfinale': return 3; case 'Viertelfinale': return 4;
    case 'Halbfinale': return 5; case 'Finale': return 6; case 'Weltmeister': case 'Europameister': return 7; default: return 0;
  }
}

/** Ziel aus dem Stärke-Rang unter den Nationen, die das Turnier spielen können. */
export function goalFor(g: Game, nat: string, def: TournamentDef, date: string): NjGoal {
  const s = allStrengths(g, date);
  const list = [...s.entries()].filter(([c]) => eligibleFor(c, def)).sort((a, b) => b[1] - a[1]);
  const r = Math.max(1, list.findIndex(([c]) => c === nat) + 1 || list.length);
  const p = 2 * r + 1;
  const levels = formatLevels(def);
  let lvl = p <= 1 ? 7 : p <= 2 ? 6 : p <= 4 ? 5 : p <= 8 ? 4 : p <= 16 ? 3 : p <= 32 ? 2 : 1;
  lvl = [...levels].reverse().find((l) => l <= lvl) ?? levels[0];
  // Rang innerhalb der Turnierplätze: mindestens Qualifikation; weit dahinter: achtbar auftreten.
  if (p > def.teams) lvl = r <= def.teams ? levels[0] : 0;
  return { key: tKey(def), lvl, label: lvlLabel(lvl, def), rank: r, of: list.length };
}

// -----------------------------------------------------------------------------
// Beginn und Ende
// -----------------------------------------------------------------------------
/** Amtsantritt (Spielbeginn; später auch mitten im Spiel). Gibt false zurück, wenn die Nation nicht spielt. */
export function startNationalJob(g: Game, nat: string, date = g.calendar.currentDate): boolean {
  const def = nextCycleDef(nat, date);
  if (!def || activeJob(g)) return false;
  const goal = goalFor(g, nat, def, date);
  const old = nationalJob(g);
  const job: NationalJob = {
    v: 1, nat, since: date, until: def.end, untilKey: tKey(def), goal, trust: START_TRUST,
    record: { total: emptyRec(), by: {} }, history: [],
    ...(old ? { prev: [...(old.prev ?? []), { ...old, prev: undefined }] } : {}),
  };
  job.history.push({ key: tKey(def), date, what: 'start', goal: goal.label, result: 'Amtsantritt', delta: 0, trust: job.trust, text: `Vertrag bis zum Ende der ${tLong(def)}.` });
  (g as G).nationalJob = job;
  pushMessage(g.messages, makeMessage({
    date, category: 'general', from: 'Verband', subject: `Du bist Nationaltrainer: ${natName(nat)}`,
    shortText: `Vertrag bis zum Ende der ${tLong(def)} · Ziel: ${goal.label}`,
    bodyText: `Neben deinem Verein betreust du ab heute die Nationalmannschaft ${natName(nat)}.\n\nDein Vertrag läuft bis zum Ende der ${tLong(def)} ${def.place || ''}.\nZiel des Verbandes: ${goal.label} (Rang ${goal.rank} von ${goal.of} nach Stärke).\n\nVor jedem Länderspielfenster und vor dem Turnier nominierst du dein Aufgebot unter Nationalteam › Aufgebot – dein Co-Trainer macht einen Vorschlag. Zwischen Verein und Nationalteam schaltest du oben in der Kopfleiste um (Wappen bzw. Flagge). Erreichst du das Ziel, bietet dir der Verband eine Verlängerung an; sinkt sein Vertrauen zu stark, ist die Zeit vorbei.`,
  }));
  return true;
}

/** Amtszeit beenden (Entlassung, Vertragsende, Absage). Daten bleiben erhalten. */
export function endNationalJob(g: Game, reason: 'sacked' | 'expired' | 'declined' | 'resigned', text: string, date = g.calendar.currentDate): void {
  const job = activeJob(g);
  if (!job) return;
  job.ended = { date, reason, text };
  job.history.push({ key: job.untilKey, date, what: 'end', result: reason === 'sacked' ? 'Entlassen' : reason === 'declined' ? 'Verlängerung abgelehnt' : reason === 'resigned' ? 'Rücktritt' : 'Vertrag ausgelaufen', delta: 0, trust: job.trust, text });
  delete job.pick; delete job.offer; delete job.camp;
  for (const m of g.messages) {
    if ((m.eventRef?.type === 'nt_nominate' || m.eventRef?.type === 'nt_contract') && !m.eventRef.resolved) {
      m.eventRef.resolved = 'ende'; m.actionRequired = false; m.resultText = 'Erledigt: Deine Amtszeit als Nationaltrainer ist beendet.';
    }
  }
}

// -----------------------------------------------------------------------------
// Länderspiele verbuchen (Bilanz + kleines Vertrauen)
// -----------------------------------------------------------------------------
const recAdd = (r: NjRec, gf: number, ga: number) => { r.p++; r.gf += gf; r.ga += ga; if (gf > ga) r.w++; else if (gf < ga) r.l++; else r.d++; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const winExp = (s: number, o: number) => 1 / (1 + Math.pow(10, -(s - o) / 10));

/** Erwartung je eigenem Spiel merken (beim Ansetzen, Stärken stehen fest). */
export function noteExpectations(job: NationalJob, matches: NtMatch[], strength: (c: string) => number): void {
  for (const m of matches) {
    if (m.a !== job.nat && m.b !== job.nat) continue;
    const opp = m.a === job.nat ? m.b : m.a;
    (job.exp ??= {})[`${m.date}|${opp}`] = Math.round(winExp(strength(job.nat), strength(opp)) * 1000) / 1000;
  }
}

/** Eigenes Länderspiel ist gespielt (Tag danach, wie die Anzeige): Bilanz, Vertrauen, Kampagne. */
export function bookOwnMatch(g: Game, m: NtMatch, compKey: string, campaign: boolean, expGiven?: number): void {
  const job = activeJob(g);
  if (!job || (m.a !== job.nat && m.b !== job.nat)) return;
  const own = m.a === job.nat;
  const gf = own ? m.ga : m.gb, ga = own ? m.gb : m.ga;
  const opp = own ? m.b : m.a;
  recAdd(job.record.total, gf, ga);
  recAdd(job.record.by[compKey] ??= emptyRec(), gf, ga);
  const k = `${m.date}|${opp}`;
  const exp = expGiven ?? job.exp?.[k] ?? 0.5;
  if (job.exp) delete job.exp[k];
  let res = gf > ga ? 1 : gf < ga ? 0 : 0.5;
  if (m.pw) res = m.pw === job.nat ? 0.6 : 0.4;
  job.trust = clamp(Math.round(job.trust + clamp((res - exp) * 6, -4, 4)), 0, 100);
  if (campaign && job.camp) { job.camp.n++; job.camp.pts += res; job.camp.exp += exp; }
  if (job.trust < SACK_TRUST && sackable(g)) sack(g, job, `Nach dem ${gf}:${ga} gegen ${natName(opp)} ist das Vertrauen aufgebraucht.`);
}

// -----------------------------------------------------------------------------
// Qualifikation, Turnier, Vertrag
// -----------------------------------------------------------------------------
function evalDelta(def: TournamentDef, goalLvl: number, lvl: number): number {
  const levels = [0, ...formatLevels(def)];
  if (goalLvl === 0) return lvl === 0 ? -3 : 12 + 4 * Math.max(0, levels.indexOf(lvl) - 1);
  const d = levels.indexOf(lvl) - levels.indexOf(goalLvl);
  return d >= 0 ? Math.min(30, 8 + 6 * d) : Math.max(-35, -12 - 8 * (-d - 1));
}

function sack(g: Game, job: NationalJob, why: string): void {
  const text = `Der Verband trennt sich von dir. ${why} Deine Bilanz: ${job.record.total.w} Siege, ${job.record.total.d} Remis, ${job.record.total.l} Niederlagen.`;
  endNationalJob(g, 'sacked', text);
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'board', from: 'Verband', subject: `Entlassen: Aus als Nationaltrainer ${natName(job.nat)}`,
    shortText: why, bodyText: `${text}\n\nDein Verein bleibt dir – die Amtszeit steht weiter in Privat › Karriere › Nationalteam.`,
  }));
}

/** Qualifikation entscheiden (QUAL_DAYS vor der Nominierung, spätestens am Nominierungstag). */
export function decideQualification(g: Game, today: string): void {
  const job = activeJob(g);
  if (!job) return;
  const def = nextCycleDef(job.nat, today);
  if (!def) return;
  const key = tKey(def);
  const nominate = addDaysISO(def.start, -25);
  if (today < addDaysISO(nominate, -QUAL_DAYS) || today > nominate || job.qual?.key === key) return;
  if (job.goal?.key !== key) job.goal = goalFor(g, job.nat, def, today);
  const map = new Map(allStrengths(g, today));
  map.set(job.nat, ownCampaignStrength(g, job, key, today) ?? map.get(job.nat) ?? 60);
  const teams = qualify(def, map, yearOf(today));
  job.qual = { key, teams, date: today };
  const goal = job.goal;
  const ok = teams.includes(job.nat);
  const host = def.hosts.includes(job.nat);
  const qualDelta = ok ? (goal.lvl === 0 ? 12 : 3) : evalDelta(def, goal.lvl, 0);
  job.trust = clamp(job.trust + qualDelta, 0, 100);
  const rec = job.record.by[`Qualifikation ${key}`];
  const recTxt = rec ? ` (${rec.w} S · ${rec.d} U · ${rec.l} N, ${rec.gf}:${rec.ga} Tore)` : '';
  const text = ok ? (host ? `Als Gastgeber gesetzt.` : `Qualifiziert${recTxt}.`) : `Qualifikation verpasst${recTxt}.`;
  job.history.push({ key, date: today, what: 'qual', goal: goal.label, result: ok ? 'qualifiziert' : 'nicht qualifiziert', delta: qualDelta, trust: job.trust, text });
  pushMessage(g.messages, makeMessage({
    date: today, category: 'general', from: 'Verband',
    subject: ok ? `${natName(job.nat)} fährt zur ${tLong(def)}!` : `${tLong(def)}: ${natName(job.nat)} ist nicht dabei`,
    shortText: ok ? 'Jetzt das Turnieraufgebot nominieren.' : `Ziel war: ${goal.label}.`,
    bodyText: ok
      ? `${text} Der Verband ist zufrieden (Vertrauen ${qualDelta >= 0 ? '+' : ''}${qualDelta}).\n\nBis zum ${fmtDay(nominate)} benennst du dein Turnieraufgebot unter Nationalteam › Aufgebot. Ziel: ${goal.label}.`
      : `${text} Ziel des Verbandes war: ${goal.label}. Vertrauen ${qualDelta >= 0 ? '+' : ''}${qualDelta} (jetzt ${job.trust}).`,
  }));
  if (ok) createPick(g, job, { key: `t:${key}`, label: tLong(def), date: nominate, size: 0, year: def.year }, today);
  else cycleEnd(g, job, def, 0, 'nicht qualifiziert', true);
}

/** Teilnehmer, die für ein Turnier schon feststehen (Qualifikation des Nationaltrainers). */
export function fixedTeamsFor(g: Game, def: { kind: TournamentKind; year: number }): string[] | undefined {
  const j = nationalJob(g);
  return j?.qual?.key === tKey(def) ? j.qual.teams : undefined;
}

/** Tagesprüfung während des Turniers: eigene Spiele verbuchen, Aus/Titel bewerten. */
export function tournamentJobDay(g: Game, t: Tournament, today: string): void {
  const job = activeJob(g);
  if (!job || !t.teams.includes(job.nat)) return;
  const yest = addDaysISO(today, -1);
  const S = (c: string) => t.strength[c] ?? 60;
  for (const m of t.matches) if (m.date === yest && (m.a === job.nat || m.b === job.nat)) bookOwnMatch(g, m, tKey(t), false, winExp(S(job.nat), S(m.a === job.nat ? m.b : m.a)));
  if (!activeJob(g) || t.out[job.nat] !== yest) return;
  const def = defOfKey(tKey(t));
  if (def) cycleEnd(g, job, def, resultLvl(t.result[job.nat]), t.result[job.nat] ?? '', false);
}

/** Zyklus vorbei (Aus/Titel oder verpasste Qualifikation): Bewertung, Vertrag. */
function cycleEnd(g: Game, job: NationalJob, def: TournamentDef, lvl: number, res: string, qualOnly: boolean): void {
  const key = tKey(def);
  const goal = job.goal?.key === key ? job.goal : goalFor(g, job.nat, def, g.calendar.currentDate);
  const today = g.calendar.currentDate;
  const levels = formatLevels(def);
  const success = goal.lvl === 0 ? lvl > 0 || job.trust >= 50 : [0, ...levels].indexOf(lvl) >= [0, ...levels].indexOf(goal.lvl);
  if (!qualOnly) {
    const delta = evalDelta(def, goal.lvl, lvl);
    job.trust = clamp(job.trust + delta, 0, 100);
    const title = lvl === 7;
    const text = title ? `${natName(job.nat)} gewinnt die ${tLong(def)}!` : `${natName(job.nat)} scheidet ${res === 'Vorrunde' ? 'in der Vorrunde' : res === 'Finale' ? 'erst im Finale' : `im ${res}`} aus.`;
    job.history.push({ key, date: today, what: 'tourn', goal: goal.label, result: title ? (def.kind === 'WM' ? 'Weltmeister' : 'Europameister') : res, delta, trust: job.trust, text });
    pushMessage(g.messages, makeMessage({
      date: today, category: 'general', from: 'Verband', subject: `${tKey(def)}: ${success ? 'Ziel erreicht' : 'Ziel verfehlt'} (${title ? 'Titel' : res})`,
      shortText: `Ziel war: ${goal.label}. Vertrauen ${delta >= 0 ? '+' : ''}${delta}.`,
      bodyText: `${text}\nZiel des Verbandes war: ${goal.label}.\n\n${success ? 'Der Verband ist mit deiner Arbeit zufrieden.' : 'Der Verband hatte mehr erwartet.'} Vertrauen ${delta >= 0 ? '+' : ''}${delta} (jetzt ${job.trust}).`,
    }));
  }
  delete job.camp; delete job.qual;
  if (job.trust < SACK_TRUST && sackable(g)) { sack(g, job, `Das ${qualOnly ? 'Verpassen der Qualifikation' : 'Turnier'} war zu wenig.`); return; }
  if (key !== job.untilKey) return;
  const next = nextCycleDef(job.nat, def.end);
  if ((success || !sackable(g)) && next) {
    job.offer = { key: tKey(next), until: next.end, date: today };
    const msg = makeMessage({
      date: today, category: 'contract', from: 'Verband', subject: `Vertragsverlängerung bis zur ${tLong(next)}?`,
      shortText: 'Der Verband möchte weiter mit dir arbeiten.', actionRequired: true,
      bodyText: `Dein Vertrag endet mit der ${tLong(def)}. Der Verband bietet dir eine Verlängerung um einen Turnierzyklus an – bis zum Ende der ${tLong(next)}.\n\nOhne Antwort gilt das Angebot nach zehn Tagen als angenommen.`,
    });
    msg.choices = [{ id: 'accept', label: 'Verlängern', hint: `Weiter Nationaltrainer bis zur ${tLong(next)}.` }, { id: 'decline', label: 'Ablehnen', hint: 'Du konzentrierst dich ganz auf deinen Verein.' }];
    msg.eventRef = { type: 'nt_contract', deadline: addDaysISO(today, 10), defaultChoice: 'accept', data: { key: tKey(next) } };
    pushMessage(g.messages, msg);
  } else {
    const text = success ? 'Für die Nation steht kein weiteres Turnier an.' : `Der Verband verlängert deinen Vertrag nach der ${tLong(def)} nicht.`;
    endNationalJob(g, 'expired', text);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Verband', subject: `Vertrag als Nationaltrainer ${natName(job.nat)} endet`,
      shortText: text, bodyText: `${text}\nDeine Bilanz: ${job.record.total.p} Länderspiele, ${job.record.total.w} Siege, ${job.record.total.d} Remis, ${job.record.total.l} Niederlagen.\n\nDie Amtszeit steht in Privat › Karriere › Nationalteam.`,
    }));
  }
}

CHOICE_HANDLERS.nt_contract = (g, _ref, choice) => {
  const job = activeJob(g);
  if (!job?.offer) return { text: 'Das Angebot ist hinfällig.' };
  const o = job.offer;
  delete job.offer;
  if (choice === 'decline') {
    endNationalJob(g, 'declined', 'Du hast die Verlängerung abgelehnt.');
    return { text: 'Deine Zeit als Nationaltrainer endet. Danke für alles, sagt der Verband.' };
  }
  const def = defOfKey(o.key);
  job.until = o.until; job.untilKey = o.key;
  if (def) job.goal = goalFor(g, job.nat, def, g.calendar.currentDate);
  job.history.push({ key: o.key, date: g.calendar.currentDate, what: 'contract', goal: job.goal?.label, result: 'verlängert', delta: 0, trust: job.trust, text: `Vertrag verlängert bis zum Ende der ${def ? tLong(def) : o.key}.` });
  return { text: `Vertrag bis zur ${def ? tLong(def) : o.key}. Neues Ziel: ${job.goal?.label ?? '–'}.` };
};

// -----------------------------------------------------------------------------
// Tagesablauf: Nominierungstermine der Fenster, Qualifikation
// -----------------------------------------------------------------------------
/** Tage vor Fensterbeginn, an denen der Termin „Aufgebot nominieren“ kommt. */
export const NOMINATE_DAYS = 3;
export function jobDaily(g: Game, windows: { from: string; dates: string[]; label: string; matches: NtMatch[]; done?: boolean }[], today: string): void {
  const job = activeJob(g);
  if (!job) return;
  for (const w of windows) {
    if (w.done || w.matches.length || today >= w.from || today < addDaysISO(w.from, -NOMINATE_DAYS)) continue;
    const key = `w:${w.dates[0]}`;
    if (job.pick && !job.pick.used && job.pick.key !== key) continue;
    createPick(g, job, { key, label: `${w.label} (${w.dates.map((d) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`).join(' + ')})`, date: w.from, size: 0, year: yearOf(w.dates[0]) }, today);
  }
  decideQualification(g, today);
}

// -----------------------------------------------------------------------------
// Rücktritt
// -----------------------------------------------------------------------------
/** Ansehen, das ein Rücktritt mitten im Zyklus kostet (Privat › Karriere). */
export const RESIGN_REP = 3;
export function resignCost(g: Game): number { const j = activeJob(g); return j && !j.offer ? RESIGN_REP : 0; }
export function resignNationalJob(g: Game): void {
  const job = activeJob(g);
  if (!job) return;
  const cost = resignCost(g);
  if (cost && g.career) g.career.rep = Math.max(20, g.career.rep - cost);
  const text = cost ? `Du trittst mitten im Turnierzyklus zurück (Ansehen −${cost}).` : 'Du trittst nach dem Turnier zurück.';
  endNationalJob(g, 'resigned', text);
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'general', from: 'Verband', subject: `Rücktritt als Nationaltrainer ${natName(job.nat)}`,
    shortText: text, bodyText: `${text}\nDer Verband dankt dir und sucht einen Nachfolger. Deine Bilanz: ${job.record.total.p} Länderspiele, ${job.record.total.w} Siege, ${job.record.total.d} Remis, ${job.record.total.l} Niederlagen.`,
  }));
}

// -----------------------------------------------------------------------------
// Angebote mitten im Spiel (nur verdient: Ansehen; keine Bewerbung)
// -----------------------------------------------------------------------------
/** Nötiges Ansehen (Privat › Karriere, 20–92) für eine Nation auf Stärke-Rang r. */
export const repNeeded = (r: number) => Math.round(42 + Math.max(0, 30 - r) * 1.45);

/** Nach einem Turnier: Verbände mit verfehltem Ziel suchen einen Nachfolger; passt dein Ansehen, fragen sie dich. */
export function nationalVacancies(g: Game, t: Tournament, today: string): void {
  const gg = g as G;
  if (activeJob(g) || gg.nationalOffer || !g.career) return;
  const def = defOfKey(tKey(t));
  if (!def) return;
  const strength = allStrengths(g, today);
  const ranked = [...strength.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const rep = g.career.rep;
  const vacant: string[] = [];
  for (const nat of ranked) {
    if (!eligibleFor(nat, def) || !nextCycleDef(nat, today)) continue;
    const goal = goalFor(g, nat, def, today);
    const lvl = t.teams.includes(nat) ? resultLvl(t.result[nat]) : 0;
    const failed = [0, ...formatLevels(def)].indexOf(lvl) < [0, ...formatLevels(def)].indexOf(goal.lvl);
    const roll = (hashStr(`${tKey(t)}|${nat}|ntvac`) % 100) / 100;
    if (roll < (failed ? 0.65 : 0.12)) vacant.push(nat);
  }
  const declined = { ...(gg.nationalDeclined ?? {}) };
  // Wen du gerade verlassen hast (Rücktritt/Entlassung), der fragt so bald nicht wieder.
  for (const j of [nationalJob(g), ...(nationalJob(g)?.prev ?? [])]) if (j?.ended) declined[j.nat] = j.ended.date;
  const pick = vacant.find((nat) => rep >= repNeeded(ranked.indexOf(nat) + 1) && !(declined[nat] && declined[nat] > addDaysISO(today, -730)));
  if (!pick) return;
  const next = nextCycleDef(pick, today)!;
  gg.nationalOffer = { nat: pick, date: today, key: tKey(next) };
  const r = ranked.indexOf(pick) + 1;
  const msg = makeMessage({
    date: today, category: 'contract', from: 'Verband', subject: `Angebot: Nationaltrainer von ${natName(pick)}?`, actionRequired: true,
    shortText: `Der Verband sucht nach der ${tLong(def)} einen Nachfolger.`,
    bodyText: `Nach der ${tLong(def)} trennt sich ${natName(pick)} von seinem Nationaltrainer – und der Verband denkt an dich.\n\nDu würdest die Nationalmannschaft zusätzlich zu deinem Verein betreuen, Vertrag bis zum Ende der ${tLong(next)}. ${natName(pick)} steht auf Rang ${r} nach Stärke.\n\nOhne Antwort zieht der Verband das Angebot nach zehn Tagen zurück.`,
  });
  msg.choices = [{ id: 'accept', label: 'Annehmen', hint: `Nationaltrainer von ${natName(pick)} bis zur ${tLong(next)}.` }, { id: 'decline', label: 'Ablehnen', hint: 'Du bleibst nur bei deinem Verein.' }];
  msg.eventRef = { type: 'nt_offer', deadline: addDaysISO(today, 10), defaultChoice: 'decline', data: { nat: pick } };
  pushMessage(g.messages, msg);
}

CHOICE_HANDLERS.nt_offer = (g, ref, choice) => {
  const gg = g as G;
  const nat = String(ref.data?.nat ?? '');
  delete gg.nationalOffer;
  if (choice !== 'accept') { (gg.nationalDeclined ??= {})[nat] = g.calendar.currentDate; return { text: 'Du hast abgesagt.' }; }
  if (activeJob(g)) return { text: 'Du betreust schon eine Nationalmannschaft.' };
  return startNationalJob(g, nat) ? { text: `Du bist Nationaltrainer von ${natName(nat)}. Dein erstes Aufgebot wartet unter Nationalteam › Aufgebot.` } : { text: 'Das Angebot ist hinfällig.' };
};
