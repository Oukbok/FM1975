// =============================================================================
// TRIBÜNENNAMEN & VEREINSLEGENDEN (Wunsch Pascal)
// -----------------------------------------------------------------------------
// • Vereinslegenden: Spieler mit langer Zeit im Verein (laufender Kader, frühere
//   Spieler, Archiv der Karriereenden) ernennst du zur Legende (höchstens 11).
//   Die Ernennung freut die Fans einmalig.
// • Eine Tribüne nach einer Legende benennen bringt kein Geld, aber Ansehen:
//   einmalig mehr Fan-Stimmung und dauerhaft ein Zuschlag auf die Ziel-Stimmung
//   (`legendStandMood`, +1,5 je Tribüne, höchstens +6) – über die Stimmung auch
//   Zuschauerschnitt und Mitglieder.
// • Ab STAND_SPONSOR_YEAR bieten Firmen Geld für einzelne Tribünennamen (Anteil
//   der Plätze am Stadion × Wert der Stadion-Namensrechte × 0,3). Ein Sponsor auf
//   einer Legenden-Tribüne empört die Fans.
// Felder `Club.standNames`/`Club.clubLegends`, nur der eigene Verein.
// =============================================================================
import { LOGE_GUESTS, STAND, STANDS } from '../data/seatingCatalog';
import { NAMING_FIRMS, namingAnnualNominal } from '../engine/clubBusiness';
import { yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { rawStandCaps } from '../engine/seating';
import type { Club, ClubLegend, NamingRights, StandId, StandName } from '../types';
import type { Game } from './state';

export const STAND_SPONSOR_YEAR = 2005;
export const MAX_LEGENDS = 11;
const LEGEND_MOOD = 1.5;
const MIN_APPS = 120;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const seasonOf = (date: string) => { const y = Number(date.slice(0, 4)); const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1; return `${s}/${String((s + 1) % 100).padStart(2, '0')}`; };
function shiftFans(g: Game, d: number): void { if (g.environment) g.environment.fanMood = clamp(g.environment.fanMood + d, 0, 100); }

/** Namenszusatz je Tribüne: Geraden = „Tribüne“, hinter dem Tor = „Kurve“, Ecken = „Ecke“. */
export function standSuffix(id: StandId): string {
  return id === 'haupt' || id === 'gegen' ? 'Tribüne' : id === 'tor1' || id === 'tor2' ? 'Kurve' : 'Ecke';
}
/** Angezeigter Tribünenname. */
export function standLabel(club: Club, id: StandId): string {
  return club.standNames?.[id]?.name ?? STAND[id].name;
}

// --- Vereinslegenden -----------------------------------------------------------
export interface LegendCandidate { id: string; name: string; apps: number; goals: number; seasons: number; active: boolean }

/** Kandidaten: mindestens 120 Pflichtspiele für den Verein (laufend, früher oder im Archiv). */
export function legendCandidates(g: Game): LegendCandidate[] {
  const club = g.clubs[g.managedClubId];
  if (!club) return [];
  const have = new Set((club.clubLegends ?? []).map((l) => l.id));
  const out = new Map<string, LegendCandidate>();
  for (const p of Object.values(g.players)) {
    if (have.has(p.id)) continue;
    const st = (p.history?.stations ?? []).filter((s) => s.clubId === club.id);
    let apps = st.reduce((a, s) => a + s.appearances, 0), goals = st.reduce((a, s) => a + s.goals, 0);
    const active = p.clubId === club.id;
    if (active) { apps += p.seasonStats.appearances; goals += p.seasonStats.goals; }
    if (apps >= MIN_APPS) out.set(p.id, { id: p.id, name: p.fullName, apps, goals, seasons: st.length + (active ? 1 : 0), active });
  }
  for (const a of g.archive ?? []) {
    if (have.has(a.id) || out.has(a.id)) continue;
    const mine = a.lastClubId === club.id || a.clubs.includes(club.name);
    // Archiv kennt nur die Karriere-Einsätze: zuletzt hier oder lange hier (nur ein Verein).
    if (mine && a.apps >= (a.clubs.length <= 1 ? MIN_APPS : 250)) out.set(a.id, { id: a.id, name: a.name, apps: a.apps, goals: a.goals, seasons: 0, active: false });
  }
  return [...out.values()].sort((x, y) => y.apps - x.apps).slice(0, 40);
}

export function appointLegend(g: Game, id: string): string | null {
  const club = g.clubs[g.managedClubId];
  const list = (club.clubLegends ??= []);
  if (list.length >= MAX_LEGENDS) return `Höchstens ${MAX_LEGENDS} Vereinslegenden – eine Legende ist etwas Besonderes.`;
  const c = legendCandidates(g).find((x) => x.id === id);
  if (!c) return 'Der Spieler erfüllt die Voraussetzungen nicht (mindestens 120 Pflichtspiele für den Verein).';
  const today = g.calendar.currentDate;
  const legend: ClubLegend = { id: c.id, name: c.name, since: today, apps: c.apps, goals: c.goals };
  list.push(legend);
  shiftFans(g, 2);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Vorstand', subject: `${c.name} ist Vereinslegende`,
    shortText: `${c.name} (${c.apps} Spiele, ${c.goals} Tore) wird zur Vereinslegende ernannt.`,
    bodyText: `Der Verein ehrt ${c.name} für ${c.apps} Pflichtspiele und ${c.goals} Tore. Die Fans feiern die Ernennung. Eine Tribüne nach ihm zu benennen, geht unter Finanzen › Sponsoring › Namensrechte.`,
  }));
  return null;
}

// --- Tribünen ------------------------------------------------------------------
function standShare(club: Club, id: StandId): number {
  const caps = rawStandCaps(club);
  if (!caps) return 1 / STANDS.length;
  const per = (sid: StandId) => Object.entries(caps[sid] ?? {}).reduce((a, [k, v]) => a + (k === 'loge' ? v * LOGE_GUESTS : v), 0);
  const total = STANDS.reduce((a, s) => a + per(s.id), 0);
  return total > 0 ? per(id) / total : 0;
}

/** Angebote für einen Tribünennamen (deterministisch je Saison und Tribüne). */
export function standOffers(g: Game, id: StandId): Extract<StandName, { kind: 'sponsor' }>[] {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const cur = club.standNames?.[id];
  if (year < STAND_SPONSOR_YEAR || (cur?.kind === 'sponsor' && cur.untilYear - year > 1)) return [];
  const share = standShare(club, id);
  if (share <= 0) return [];
  const season = seasonOf(today);
  const base = club.stadium.capacity * 1.3 * clamp(0.6 + club.reputation / 100, 0.8, 1.6) * share * 0.3;
  const used = new Set<number>([...STANDS].map((s) => club.standNames?.[s.id]).filter((x): x is Extract<StandName, { kind: 'sponsor' }> => x?.kind === 'sponsor').map((x) => NAMING_FIRMS.indexOf(x.sponsor)));
  if (club.namingRights) used.add(NAMING_FIRMS.indexOf(club.namingRights.sponsor));
  const out: Extract<StandName, { kind: 'sponsor' }>[] = [];
  for (let i = 0; i < 2; i++) {
    let k = hash(`${club.id}:${season}:${id}:${i}`) % NAMING_FIRMS.length;
    for (let n = 0; used.has(k) && n < NAMING_FIRMS.length; n++) k = (k + 1) % NAMING_FIRMS.length;
    used.add(k);
    const firm = NAMING_FIRMS[k];
    const years = [3, 5][i];
    const factor = [0.95, 1.08][i] * (0.9 + (hash(`${firm}:${season}:${id}`) % 20) / 100);
    out.push({ kind: 'sponsor', sponsor: firm, name: `${firm.split(' ')[0]}-${standSuffix(id)}`, annualValue: Math.max(1000, Math.round((base * factor) / 500) * 500), fromYear: year, untilYear: year + years });
  }
  return out;
}

export function standAnnualNominal(s: Extract<StandName, { kind: 'sponsor' }>, club: Club, year: number): number {
  return namingAnnualNominal(s as unknown as NamingRights, club, year);
}

export function nameStandAfterLegend(g: Game, id: StandId, legendId: string): string | null {
  const club = g.clubs[g.managedClubId];
  const l = (club.clubLegends ?? []).find((x) => x.id === legendId);
  if (!l) return 'Nur ernannte Vereinslegenden können einer Tribüne ihren Namen geben.';
  const names = (club.standNames ??= {});
  if (Object.values(names).some((n) => n?.kind === 'legend' && n.legendId === legendId)) return `Nach ${l.name} ist schon eine Tribüne benannt.`;
  const before = names[id];
  const today = g.calendar.currentDate;
  const name = `${l.name.replace(/\s+/g, '-')}-${standSuffix(id)}`;
  names[id] = { kind: 'legend', legendId, name, since: today };
  shiftFans(g, before?.kind === 'sponsor' ? 6 : 4);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Vorstand', subject: `Die ${STAND[id].name} heißt jetzt ${name}`,
    shortText: `Zu Ehren von ${l.name} trägt die ${STAND[id].name} ab sofort seinen Namen.`,
    bodyText: `Zu Ehren von ${l.name} heißt die ${STAND[id].name} ab sofort ${name}.${before?.kind === 'sponsor' ? ` Der Vertrag mit ${before.sponsor} ist damit beendet.` : ''} Die Fans sind begeistert – solange der Name bleibt, steigt ihre Stimmung dauerhaft etwas.`,
  }));
  return null;
}

export function acceptStandOffer(g: Game, id: StandId, idx: number): string | null {
  const club = g.clubs[g.managedClubId];
  const o = standOffers(g, id)[idx];
  if (!o) return 'Das Angebot liegt nicht mehr vor.';
  const names = (club.standNames ??= {});
  const before = names[id];
  names[id] = { ...o };
  const tradition = g.environment?.tradition ?? 50;
  shiftFans(g, before?.kind === 'legend' ? -(8 + tradition / 12) : -(1 + tradition / 40));
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'board', from: 'Vermarktung', subject: `${STAND[id].name}: Namensrechte an ${o.sponsor}`,
    shortText: `Die ${STAND[id].name} heißt bis ${o.untilYear} ${o.name}.`,
    bodyText: `${o.sponsor} zahlt für den Namen der ${STAND[id].name} bis 30.06.${o.untilYear}. ${before?.kind === 'legend' ? `Dass ${before.name} einem Firmennamen weichen muss, nehmen dir viele Fans übel.` : 'Ein Teil der Fans sieht den Kunstnamen kritisch.'}`,
  }));
  return null;
}

export function resetStandName(g: Game, id: StandId): void {
  const club = g.clubs[g.managedClubId];
  const cur = club.standNames?.[id];
  if (!cur) return;
  delete club.standNames![id];
  if (cur.kind === 'legend') shiftFans(g, -4);
}

/** Zuschlag auf die Ziel-Stimmung der Fans (engine/environment.ts über environmentGame). */
export function legendStandMood(club: Club): number {
  const n = Object.values(club.standNames ?? {}).filter((x) => x?.kind === 'legend').length;
  return Math.min(4, n) * LEGEND_MOOD;
}

/** Monatlich: Sponsorgeld der Tribünen buchen, abgelaufene Verträge beenden. */
export function standNamesMonthly(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club?.standNames) return;
  const year = yearOf(today);
  for (const s of STANDS) {
    const n = club.standNames[s.id];
    if (n?.kind !== 'sponsor') continue;
    if (today >= `${n.untilYear}-07-01`) {
      delete club.standNames[s.id];
      pushMessage(g.messages, makeMessage({ date: today, category: 'board', from: 'Vermarktung', subject: `${s.name}: Namensvertrag ausgelaufen`, shortText: `Die Tribüne heißt wieder ${s.name}.`, bodyText: `Der Vertrag mit ${n.sponsor} ist ausgelaufen. Neue Angebote oder eine Vereinslegende findest du unter Finanzen › Sponsoring › Namensrechte.` }));
      continue;
    }
    const m = Math.round(standAnnualNominal(n, club, year) / 12);
    if (m > 0) book(club.finances, today, m, 'commercial', `Tribünenname ${n.name} (Monat)`, true);
  }
}
