// =============================================================================
// HALLENTURNIERE IM AUSLAND (Wunsch Pascal): Wien, Graz, Genf, Paris, Schweizer
// Hallenmeisterschaft, englische Five-/Six-a-side-Turniere (Stammdaten data/indoorAbroad.ts).
// Je Winter ein Turnier je aktivem Eintrag in `IndoorWinter.abroad`: Gastgeber aus der
// Stadt, Vereine des Landes, internationale Gäste (deutsche Vereine aus den vollen Ligen
// bzw. der Hintergrund-Welt). Dein Verein bekommt Einladungen wie zu den deutschen
// Turnieren (Zusage/Absage, Hallenkader am Turniertag, Antrittsgeld) – nur in seiner
// Winterpause (game/indoorWindow.ts). Liegt das Turnier in deinem Heimatland, ist es ein
// Heimturnier. Gespielt/verbucht wird über game/indoorGame.ts (gleiche Simulation).
// =============================================================================
import { abroadFor, abroadVenue, type AbroadDef, ABROAD_BY_ID } from '../data/indoorAbroad';
import { INDOOR_GAP_DAYS } from '../data/matchCalendarRules';
import { CalendarEngine } from '../engine/calendar';
import { BreakCache, indoorHoliday } from './indoorWindow';
import { ddrBorderClosed } from './ddrHome';
import { placePoints } from './indoorMasters';
import { PoolClub, aiSquad, countryTopClubs, homeLeagueClubs, weightedPick, worldTopClubs } from './indoorPool';
import { Game, homeCountryKey, homeCountryOf, playerLevel } from './state';
import { IndoorTournament, IndoorWinter, competitiveDays, daysBetween, indoorState, ownCampDays } from './winterShared';

type Rng = () => number;

/** Tag eines Terminfensters (MM-TT) im Winter `y0/y0+1`. */
const dayOf = (mmdd: string, y0: number) => `${Number(mmdd.slice(0, 2)) >= 7 ? y0 : y0 + 1}-${mmdd}`;

/** Ist das Auslandsturnier ein Heimturnier deines Vereins (Turnier im Heimatland)? */
export function isHomeAbroad(g: Game, t: IndoorTournament): boolean {
  return !!t.cc && t.cc === homeCountryKey(g);
}

/** Deutsche Vereine, die als Gäste ins Ausland reisen (volle Ligen bzw. Hintergrund-Welt). */
function germanGuests(g: Game): PoolClub[] {
  if (homeCountryOf(g) === 'ger') return homeLeagueClubs(g).filter((p) => p.tier === 1);
  return worldTopClubs(g, 'Deutschland');
}

/** Übrige Gäste: obere Hälfte der 1. Liga der genannten Länder. */
function foreignGuests(g: Game, countries: string[], host: string): PoolClub[] {
  const out: PoolClub[] = [];
  for (const key of countries) {
    if (key === host) continue;
    const top = countryTopClubs(g, key);
    out.push(...top.slice(0, Math.max(3, Math.ceil(top.length / 2))));
  }
  return out;
}

/**
 * Auslandsturniere des Winters anlegen (aus setupIndoorWinter, Anfang November).
 * `ownBusy` = Tage, an denen dein Verein schon gebunden ist (deutsche Turniere, Pflichtspiel-Abstand).
 */
export function setupAbroad(g: Game, cur: IndoorWinter, today: string, rng: Rng, ownBusy: Set<string>): void {
  const defs = abroadFor(cur.winterYear);
  cur.abroad = [];
  if (!defs.length) return;
  const y0 = cur.winterYear - 1;
  const mid = g.managedClubId;
  const home = homeCountryKey(g);
  const bc = new BreakCache(g);
  const camp = ownCampDays(g);
  const own = g.clubs[mid];
  const ownTop = playerLevel(g) === 1;
  const st = indoorState(g);
  let foreignInvites = st.snub >= 2 ? 0 : 1; // höchstens eine Einladung ins Ausland je Winter
  const seriesCount = new Map<string, number>();
  const dayUse = new Map<string, Set<string>>();
  const busyPflicht = new Set<string>();
  for (const d of competitiveDays(g)) for (let k = -(INDOOR_GAP_DAYS - 1); k <= INDOOR_GAP_DAYS - 1; k++) busyPflicht.add(CalendarEngine.addDays(d, k));
  const ownFree = (d: string, days: number) => {
    for (let i = 0; i < days; i++) {
      const x = CalendarEngine.addDays(d, i);
      if (ownBusy.has(x) || camp.has(x) || busyPflicht.has(x)) return false;
    }
    return bc.fits(mid, d, days);
  };
  for (const def of defs) {
    if (def.country !== home && !g.world?.countries[def.country]) continue;
    const homeT = def.country === home;
    const domestic = def.domesticFrom != null && cur.winterYear >= def.domesticFrom;
    const venue = abroadVenue(def, cur.winterYear);
    const all = daysBetween(dayOf(def.window[0], y0), dayOf(def.window[1], y0))
      .filter((d) => d > CalendarEngine.addDays(today, 2) && !indoorHoliday(d) && !indoorHoliday(CalendarEngine.addDays(d, def.days - 1)));
    if (!all.length) continue;
    // Einladung deines Vereins: Heimturnier (Stadt oder Erstligist) bzw. als Gast im Ausland.
    let invite = false;
    if (own && ownTop && def.stage !== 'f') {
      if (homeT) {
        const n = seriesCount.get(`own|${def.series}`) ?? 0;
        invite = def.series ? n < 2 : def.hostCities.includes(own.city) || own.reputation >= 60 || rng() < 0.4;
        if (st.snub >= 2 && !def.hostCities.includes(own.city)) invite = invite && rng() < 0.5;
      } else if (!domestic && foreignInvites > 0 && own.reputation >= 70 && !ddrBorderClosed(g, today)) { // DDR-Start: vor dem Mauerfall keine Reisen in den Westen
        const asGerman = home === 'Deutschland' && def.german > 0;
        const asGuest = def.guestFrom.includes(home);
        invite = (asGerman || asGuest) && rng() < 0.3 + (own.reputation - 70) * 0.02;
      }
    }
    const ownDays = invite ? all.filter((d) => ownFree(d, def.days)) : [];
    if (invite && !ownDays.length) invite = false;
    const days = invite ? ownDays : all;
    const date = days[Math.min(days.length - 1, Math.floor(rng() * days.length))];
    const used = dayUse.get(date) ?? new Set<string>();
    dayUse.set(date, used);
    const t: IndoorTournament = {
      id: `ha${cur.winterYear}-${def.id}`, name: def.name, city: venue.city, hall: venue.hall, date, days: def.days,
      kind: 'abroad', aid: def.id, cc: def.country, clubIds: [], squads: {}, done: false,
    };
    if (invite) {
      t.own = null; t.clubIds.push(mid); used.add(mid);
      if (homeT) seriesCount.set(`own|${def.series}`, (seriesCount.get(`own|${def.series}`) ?? 0) + 1);
      else foreignInvites--;
    }
    if (def.stage === 'f') { cur.abroad.push(t); continue; } // Finale: Feld aus den Vorrunden (abroadDaily)
    const free = (p: PoolClub) => p.id !== mid && !used.has(p.id) && !t.clubIds.includes(p.id) && bc.fits(p.id, date, def.days)
      && (!def.series || (seriesCount.get(`${def.series}|${p.id}`) ?? 0) < 2);
    const add = (ps: PoolClub[]) => {
      for (const p of ps) {
        if (t.clubIds.length >= def.teams) break;
        t.clubIds.push(p.id); used.add(p.id);
        if (def.series) seriesCount.set(`${def.series}|${p.id}`, (seriesCount.get(`${def.series}|${p.id}`) ?? 0) + 1);
        t.squads[p.id] = aiSquad(g, p.id, cur.winterYear, rng);
      }
    };
    const locals = countryTopClubs(g, def.country);
    add(locals.filter((p) => def.hostCities.includes(p.city) && free(p)).slice(0, def.hosts));
    if (!domestic) {
      const ownGerman = invite && !homeT && home === 'Deutschland';
      if (!ownGerman && def.country !== 'Deutschland' && rng() < def.german) add(weightedPick(germanGuests(g).filter(free), (p) => p.strength - 50, 1, rng));
      const ng = Math.floor(def.guests) + (rng() < def.guests % 1 ? 1 : 0);
      if (ng > 0) add(weightedPick(foreignGuests(g, def.guestFrom, def.country).filter(free), (p) => p.strength - 50, ng, rng));
    }
    add(weightedPick(locals.filter(free), (p) => Math.max(1, p.strength - 45), def.teams - t.clubIds.length, rng));
    cur.abroad.push(t);
  }
}

/** Ersatzverein für einen frei gewordenen Platz eines Auslandsturniers (Vereine des Gastgeberlandes). */
export function abroadSubstitute(g: Game, cur: IndoorWinter, t: IndoorTournament, rng: Rng): string | undefined {
  const bc = new BreakCache(g);
  const busy = new Set([...cur.tournaments, ...(cur.abroad ?? []), ...(cur.masters ? [cur.masters] : [])]
    .filter((x) => x.date === t.date).flatMap((x) => x.clubIds));
  const sub = countryTopClubs(g, t.cc ?? '').find((p) => p.id !== g.managedClubId && !busy.has(p.id) && !t.clubIds.includes(p.id) && bc.fits(p.id, t.date, t.days));
  if (sub) { t.clubIds.push(sub.id); t.squads[sub.id] = aiSquad(g, sub.id, cur.winterYear, rng); }
  return sub?.id;
}

/**
 * Finale einer Serie (Schweizer Hallenmeisterschaft): die besten `teams` nach Platzierungspunkten
 * der Vorrunden (Gleichstand: Tordifferenz, Tore). Liefert true, wenn dein Verein dabei ist.
 */
export function buildAbroadFinal(g: Game, cur: IndoorWinter, t: IndoorTournament, rng: Rng): boolean {
  const def = ABROAD_BY_ID[t.aid ?? ''];
  if (!def?.series || t.clubIds.length) return false;
  const score = new Map<string, { pp: number; gd: number; gf: number }>();
  for (const q of cur.abroad ?? []) {
    if (q === t || !q.done || !q.result || ABROAD_BY_ID[q.aid ?? '']?.series !== def.series) continue;
    q.result.ranking.forEach((id, i) => {
      const s = score.get(id) ?? { pp: 0, gd: 0, gf: 0 };
      s.pp += placePoints(i);
      for (const m of q.result!.matches) {
        if (m.a === id) { s.gd += m.ga - m.gb; s.gf += m.ga; }
        if (m.b === id) { s.gd += m.gb - m.ga; s.gf += m.gb; }
      }
      score.set(id, s);
    });
  }
  const bc = new BreakCache(g);
  const order = [...score.entries()].sort((a, b) => b[1].pp - a[1].pp || b[1].gd - a[1].gd || b[1].gf - a[1].gf).map(([id]) => id);
  const mid = g.managedClubId;
  let mine = false;
  for (const id of order) {
    if (t.clubIds.length >= def.teams) break;
    if (!bc.fits(id, t.date, t.days)) continue;
    t.clubIds.push(id);
    if (id === mid) { t.own = null; mine = true; } else t.squads[id] = aiSquad(g, id, cur.winterYear, rng);
  }
  return mine;
}

/** Archivzeile des Winters (finishWinter). */
export function abroadHistory(g: Game, cur: IndoorWinter): [string, string, string, number][] {
  const mid = g.managedClubId;
  return (cur.abroad ?? []).filter((t) => t.done && t.result && t.aid)
    .map((t) => [t.aid!, t.result!.ranking[0], t.result!.ranking[1] ?? '', t.result!.ranking.indexOf(mid) + 1]);
}

/** Antrittsgeld-Faktor eines Turniers (Ausland nach Stammdaten, sonst 1). */
export function abroadFee(t: IndoorTournament): number {
  return t.kind === 'abroad' ? (ABROAD_BY_ID[t.aid ?? '']?.fee ?? 1) : 1;
}

export type { AbroadDef };
