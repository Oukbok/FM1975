// =============================================================================
// SPIELERMELDUNG & AUSLÄNDERREGELN IM SPIELABLAUF (Wunsch Pascal, #35)
// -----------------------------------------------------------------------------
// • Ausländergrenze im Spielberichtsbogen gilt für alle Vereine in allen Spielen
//   (match/team.ts `resolveLineup` über engine/registration.ts).
// • Europapokal-Meldeliste des eigenen Vereins (optionales `game.registration`):
//   Vorauswahl mit Homegrown-Quote, Änderungen bis zum ersten Europapokalspiel,
//   danach nur in der Winterpause (Januar) bis zu drei neue Namen; B-Liste für
//   U21-Eigengewächse ab 2006. Nur Gemeldete spielen im Europapokal.
// • Kaderauflagen der Liga (eigener Verein): Nicht-Europäer unter Vertrag (2004–2006,
//   Verhandlung gesperrt), zwölf einheimische Lizenzspieler und Local Player ab 2006
//   (Prüfung am 1.9. und 1.2., Verstoß = Geldstrafe der Liga).
// Regeln/Quellen: data/registrationRules.ts. Seite: views/kader/RegistrationView.tsx.
// =============================================================================
import type { Game } from './state';
import { homeCountryOf } from './state';
import type { Club, Player } from '../types';
import { domesticRulesFor, euroRulesFor } from '../data/registrationRules';
import { countryOrigin } from '../data/world/countries';
import { ORIGINS } from '../data/origins';
import { isHomegrown } from './clubHonours';
import { inEuroCup } from './euroFixture';
import { isNational, isNonEuropean, setEuroLists, setRegHome, trainedInCountry, countsAsForeign, matchForeignCap } from '../engine/registration';
import { book } from '../engine/finances';
import { formatMoney, yearOf } from '../engine/economy';
import { lastRevenue } from '../engine/clubEconomy';
import { makeMessage, pushMessage } from '../engine/messages';

export interface RegistrationState {
  season: string;
  /** Gemeldete A-Liste (IDs). */
  euro: string[];
  /** Von Hand geändert (sonst folgt die Liste der Vorauswahl). */
  manual?: boolean;
  /** In der Winterpause neu gemeldete Spieler. */
  winterAdded?: string[];
  /** Letzte Prüfung der Kaderauflagen („2006-09-01“). */
  checked?: string;
}
type G = Game & { registration?: RegistrationState };

const seasonYear = (g: Game) => parseInt(g.season.slice(0, 4), 10);
const squadOf = (g: Game, c: Club) => c.playerIds.map((id) => g.players[id]).filter(Boolean) as Player[];

/** Heimat-Nationalität des Spielstands (Deutschland: GER). */
export function homeNat(g: Game): string {
  const cc = homeCountryOf(g);
  if (cc === 'ger') return 'GER';
  return ORIGINS[countryOrigin(cc)]?.nationality ?? 'GER';
}

/** Spielt der eigene Verein in dieser Saison einen Europapokal? */
export function ownInEurope(g: Game): boolean {
  const me = g.managedClubId;
  const e = g.euroCups;
  return !!e && (inEuroCup(e.ec, me) || inEuroCup(e.cwc, me) || inEuroCup(e.uefa, me));
}

/** Erste Station mit Alter (aus Saison und Geburtsjahr). */
function firstStation(p: Player): { clubId: string; age: number } | null {
  const st = [...(p.history?.stations ?? [])].sort((a, b) => a.season.localeCompare(b.season))[0];
  if (!st) return null;
  const born = parseInt((p.dateOfBirth ?? '').slice(0, 4), 10);
  return { clubId: st.clubId, age: born ? parseInt(st.season.slice(0, 4), 10) - born : 99 };
}
/** Vereinsausgebildet: Eigengewächs bzw. erste Profistation beim Verein mit höchstens 21 Jahren. */
export function clubTrained(p: Player, c: Club): boolean {
  if (isHomegrown(p, c)) return true;
  const f = firstStation(p);
  return !!f && f.clubId === c.id && f.age <= 21;
}
/** Lokal (im Verband) ausgebildet: Jugend bei einem Verein des Landes oder Einheimischer ohne
 *  Auslandsstation vor 22 (die Jugend erzeugter Spieler ist nicht einzeln festgehalten). */
export function assocTrained(p: Player): boolean {
  if (trainedInCountry(p)) return true;
  const f = firstStation(p);
  return isNational(p, f ? parseInt((p.dateOfBirth ?? '2000').slice(0, 4), 10) + 18 : 2000) && (!f || f.age > 21 || !/^(eu_|w_|x-)/.test(f.clubId));
}
/** B-Liste: U21 und seit zwei Jahren im Verein ausgebildet (vereinfacht: Eigengewächs ≤ 21). */
export const bListEligible = (p: Player, c: Club) => p.age <= 21 && clubTrained(p, c);

export interface EuroCheck { max: number | null; count: number; club: number; assoc: number; needClub: number; needAssoc: number; effMax: number | null; ok: boolean; reason?: string }

/** Prüft eine A-Liste gegen die Regeln der Saison (fehlende Homegrown-Plätze verkleinern die Liste wie bei der UEFA). */
export function checkEuroList(g: Game, ids: string[]): EuroCheck {
  const c = g.clubs[g.managedClubId];
  const r = euroRulesFor(seasonYear(g));
  const ps = ids.map((id) => g.players[id]).filter(Boolean) as Player[];
  const club = ps.filter((p) => clubTrained(p, c)).length;
  const assoc = ps.filter((p) => assocTrained(p)).length;
  const [needAssoc, needClub] = r.homegrown ?? [0, 0];
  const missing = Math.max(0, needClub - club) + Math.max(0, (needAssoc - needClub) - Math.max(0, assoc - Math.min(club, needClub)));
  const effMax = r.listMax == null ? null : r.listMax - missing;
  const ok = effMax == null || ps.length <= effMax;
  return { max: r.listMax, count: ps.length, club, assoc, needClub, needAssoc, effMax, ok, reason: ok ? undefined : `Höchstens ${effMax} Spieler: ${missing} Homegrown-Plätze unbesetzt.` };
}

/** Vorauswahl: Homegrown-Quote zuerst, dann die stärksten Spieler bis zur Obergrenze. */
export function suggestEuroList(g: Game): string[] {
  const c = g.clubs[g.managedClubId];
  const r = euroRulesFor(seasonYear(g));
  const sq = squadOf(g, c).sort((a, b) => b.overall - a.overall);
  if (r.listMax == null) return sq.map((p) => p.id);
  const [needAssoc, needClub] = r.homegrown ?? [0, 0];
  const pick: Player[] = [];
  const add = (p: Player) => { if (!pick.includes(p) && pick.length < r.listMax!) pick.push(p); };
  // B-Liste-Kandidaten bleiben außen vor (zusätzlich gemeldet), solange sie nicht zu den Besten gehören.
  sq.filter((p) => clubTrained(p, c)).slice(0, needClub).forEach(add);
  sq.filter((p) => assocTrained(p)).slice(0, Math.max(0, needAssoc - pick.length)).forEach(add);
  const gk = sq.filter((p) => p.naturalPosition === 'TW');
  gk.slice(0, 3).forEach(add);
  for (const p of sq) { if (r.bList && bListEligible(p, c) && p.overall < (sq[17]?.overall ?? 0)) continue; add(p); }
  return pick.map((p) => p.id);
}

function state(g: Game): RegistrationState {
  const gg = g as G;
  if (!gg.registration || gg.registration.season !== g.season) gg.registration = { season: g.season, euro: [] };
  return gg.registration;
}

/** A-Liste (von Hand gesetzt oder Vorauswahl). */
export function euroAList(g: Game): string[] {
  const c = g.clubs[g.managedClubId];
  const s = state(g);
  return (s.manual ? s.euro : suggestEuroList(g)).filter((id) => c.playerIds.includes(id));
}

/** Gemeldete Spieler inkl. B-Liste (für die Engine). */
export function euroRegistered(g: Game): string[] {
  const c = g.clubs[g.managedClubId];
  const s = state(g);
  const a = s.manual ? s.euro : suggestEuroList(g);
  const r = euroRulesFor(seasonYear(g));
  const b = r.bList ? squadOf(g, c).filter((p) => bListEligible(p, c) && !a.includes(p.id)).map((p) => p.id) : [];
  return [...a.filter((id) => c.playerIds.includes(id)), ...b];
}

/** Ist die Meldeliste gerade änderbar? */
export function euroListOpen(g: Game): { open: boolean; winter: boolean; left: number; text: string } {
  const r = euroRulesFor(seasonYear(g));
  const played = euroGamesPlayed(g);
  const month = Number(g.calendar.currentDate.slice(5, 7));
  if (!played) return { open: true, winter: false, left: Infinity, text: 'Bis zum ersten Europapokalspiel frei änderbar.' };
  if (month === 1 && r.winterChanges > 0) {
    const left = r.winterChanges - (state(g).winterAdded?.length ?? 0);
    return { open: left > 0, winter: true, left, text: `Winterpause: noch ${Math.max(0, left)} Nachmeldung(en).` };
  }
  return { open: false, winter: false, left: 0, text: r.winterChanges ? 'Gesperrt – Nachmeldungen nur in der Winterpause (Januar).' : 'Gesperrt bis zur nächsten Saison.' };
}

function euroGamesPlayed(g: Game): boolean {
  const me = g.managedClubId;
  for (const cup of [g.euroCups?.ec, g.euroCups?.cwc, g.euroCups?.uefa]) {
    for (const r of cup?.rounds ?? []) {
      if (r.ties.some((t) => t.played && (t.homeClubId === me || t.awayClubId === me))) return true;
      if (r.groups?.some((gr) => gr.matches.some((m) => m.match && (m.home === me || m.away === me)))) return true;
    }
  }
  return false;
}

/** Meldeliste setzen (von der Seite). */
export function setEuroList(g: Game, ids: string[]): string | null {
  const s = state(g);
  const chk = checkEuroList(g, ids);
  if (!chk.ok) return chk.reason ?? 'Liste ungültig.';
  const o = euroListOpen(g);
  if (!o.open) return o.text;
  const before = new Set(s.manual ? s.euro : suggestEuroList(g));
  const added = ids.filter((id) => !before.has(id));
  if (o.winter) {
    if (added.length > o.left) return `In der Winterpause nur noch ${o.left} Nachmeldung(en).`;
    s.winterAdded = [...(s.winterAdded ?? []), ...added];
  }
  s.euro = ids; s.manual = true;
  bindRegistration(g);
  return null;
}

/** Engine-Zustand setzen: Heimat-Nationalität, Meldeliste des eigenen Vereins (falls Europapokal). */
export function bindRegistration(g: Game): void {
  setRegHome(homeNat(g));
  setEuroLists(ownInEurope(g) && euroRulesFor(seasonYear(g)).listMax != null ? { [g.managedClubId]: euroRegistered(g) } : {});
}

// ---------------------------------------------------------------- Kaderauflagen der Liga
export interface DomesticStatus {
  year: number;
  foreignCount: number;
  matchCap: number | null;
  nonEurope: number;
  nonEuropeMax?: number;
  national: number;
  minNational?: number;
  localClub: number;
  localAssoc: number;
  local?: [number, number];
  issues: string[];
}

export function domesticStatus(g: Game, club = g.clubs[g.managedClubId]): DomesticStatus {
  const year = seasonYear(g);
  const r = domesticRulesFor(year);
  const sq = squadOf(g, club);
  const issues: string[] = [];
  const nonEurope = sq.filter((p) => isNonEuropean(p, year)).length;
  const national = sq.filter((p) => isNational(p, year)).length;
  const localClub = sq.filter((p) => clubTrained(p, club)).length;
  const localAssoc = sq.filter((p) => assocTrained(p)).length;
  if (r.contractNonEurope != null && nonEurope > r.contractNonEurope) issues.push(`${nonEurope} Nicht-Europäer unter Vertrag (erlaubt ${r.contractNonEurope}).`);
  if (r.minNational != null && national < r.minNational) issues.push(`Nur ${national} einheimische Lizenzspieler (Pflicht ${r.minNational}).`);
  if (r.local && (localAssoc < r.local[0] || localClub < r.local[1])) issues.push(`Local Player: ${localAssoc} lokal / ${localClub} im Verein ausgebildet (Pflicht ${r.local[0]} / ${r.local[1]}).`);
  return {
    year, foreignCount: sq.filter((p) => countsAsForeign(p, year)).length, matchCap: matchForeignCap(year), nonEurope, nonEuropeMax: r.contractNonEurope,
    national, minNational: r.minNational, localClub, localAssoc, local: r.local, issues,
  };
}

/** Verhandlung sperren, wenn ein weiterer Nicht-Europäer die Vertragsgrenze sprengt. */
export function registrationBlocker(g: Game, p: Player): string | null {
  const year = seasonYear(g);
  const r = domesticRulesFor(year);
  if (r.contractNonEurope == null || !isNonEuropean(p, year)) return null;
  const st = domesticStatus(g);
  return st.nonEurope >= r.contractNonEurope ? `Ausländerregel: Höchstens ${r.contractNonEurope} Nicht-Europäer unter Vertrag.` : null;
}

/** Täglich (billig): am 1.9. und 1.2. Kaderauflagen prüfen; Verstoß = Geldstrafe. */
export function registrationDaily(g: Game, today: string): void {
  const md = today.slice(5);
  if (md !== '09-01' && md !== '02-01') return;
  const s = state(g);
  if (s.checked === today) return;
  s.checked = today;
  const st = domesticStatus(g);
  if (!st.issues.length) return;
  const club = g.clubs[g.managedClubId];
  const year = yearOf(today);
  const fine = Math.max(10000, Math.round((lastRevenue(club, year) * 0.004 * st.issues.length) / 10000) * 10000);
  book(club.finances, today, -fine, 'other', 'Geldstrafe: Kaderauflagen verletzt', true);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Ligaverband', subject: 'Kaderauflagen verletzt – Geldstrafe',
    shortText: `${formatMoney(fine, year)} Strafe.`,
    bodyText: `Bei der Prüfung nach Ende des Transferfensters erfüllt dein Kader die Auflagen nicht:\n${st.issues.map((x) => `• ${x}`).join('\n')}\n\nDie Liga verhängt eine Geldstrafe von ${formatMoney(fine, year)}. Die nächste Prüfung folgt nach dem nächsten Transferfenster. Überblick: Kader › Spielermeldung.`,
  }));
}
