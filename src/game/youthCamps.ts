// =============================================================================
// JUGENDCAMPS IM AUSLAND (Wunsch Pascal, Jugend › Jugendcamps)
// -----------------------------------------------------------------------------
// Optionales `game.youthCamps` (fehlt = kein Camp). Standorte/Stufen/Kosten in
// data/youthCampSites.ts.
//   BAU      Partnerschule → Eigenes Camp → Akademie (Ausbau zahlt die Differenz),
//            Bauzeit 4/8/12 Monate, Kosten × Verbraucherpreise × Landesfaktor,
//            zählt aufs Jugendbudget. Höchstens drei Camps.
//   BETRIEB  monatlich am 1. ab Fertigstellung (Kategorie Betrieb).
//   TALENTE  am 1. Juli (nach dem Nachwuchs-Jahrgang) je Stufe 1/2/3 neue Talente
//            mit 14–16 Jahren – Name, Gesicht, Nationalität des Landes über
//            data/ethnicity.ts `nameAndFace`. Sie bleiben im Camp (Partnerverein),
//            bis sie in deine Jugend dürfen: vor 2001 und in EU-Ländern ab 16,
//            sonst ab 18 (FIFA-Minderjährigenschutz). Übernehmen = Knopf; mit 20
//            gehen sie anderswohin. Erzeugt beim Übernehmen über
//            `generateYouthPlayer` mit festem Seed (gleiches Potenzial wie beim
//            Eintreffen, Stärke passend zum Alter).
//   KI       Große Vereine (Ruf > 75) haben ab 1995 mit wachsender Wahrscheinlichkeit
//            (bis 2010 voll, höchstens 50 % je Jahr) ein Camp bzw. Daten-Abos:
//            +1 ausländisches Talent (Stufe Partnerschule) im Jahr (`aiCampTalents`),
//            Zähler in `ai`. Balance: YOUTH=1 node scripts/sim.mjs 45 vorher/nachher.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { originNat } from '../data/origins';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { generateYouthPlayer } from '../engine/youth';
import { academyLevelOf } from '../engine/youthAcademy';
import { hashSeed, mulberry32 } from '../engine/youthShared';
import { ORIGINS, homeNationality } from '../data/origins';
import { nameAndFace } from '../data/ethnicity';
import { CAMP_LEVELS, CAMP_SITES, CAMP_SITE_BY_ID, MAX_CAMPS, joinAge, type CampLevelDef, type CampSite } from '../data/youthCampSites';
import type { Player, Position } from '../types';
import { checkBudget, noteBudgetSpend } from './budgetPlan';
import { cpi } from './scoutingGame';
import type { Game } from './state';

export interface CampKid { id: string; born: number; pos: Position; name: string; first: string; last: string; face: string; st: [number, number]; since: string; /** Stufe des Camps beim Eintreffen */ lv: number }
export interface OwnCamp {
  site: string;
  /** fertige Stufe (0 = noch im Bau) */
  level: number;
  opened: string;
  /** laufender Bau/Ausbau */
  building?: { level: number; done: string };
  kids: CampKid[];
  /** Talente insgesamt / übernommen */
  total: number;
  joined: number;
}
export interface YouthCampsState { v: 1; camps: OwnCamp[]; /** KI-Talente je Jahr (letzte 12) */ ai?: [number, number][] }

const KIDS_MAX = 12;
const h01 = (s: string) => (hashSeed(s) >>> 0) / 4294967296;

export function campsOf(g: Game): YouthCampsState {
  return (g.youthCamps ??= { v: 1, camps: [] });
}
export const levelDef = (lv: number): CampLevelDef => CAMP_LEVELS[Math.max(0, Math.min(2, lv - 1))];
export const campAt = (g: Game, site: string): OwnCamp | undefined => g.youthCamps?.camps.find((c) => c.site === site);

/** Stufe am Standort im Jahr möglich? */
export function levelOpen(site: CampSite, lv: number, year: number): boolean {
  return year >= site.from && year >= levelDef(lv).from;
}

/** Erstes Jahr, in dem ein Standort (Stufe 1) möglich ist. */
export function siteFrom(site: CampSite): number { return Math.max(site.from, CAMP_LEVELS[0].from); }

/** Bau-/Ausbaukosten: nominal + Preisschild. */
export function buildCost(site: CampSite, lv: number, fromLv: number, year: number): { nominal: number; tag: number } {
  const base = levelDef(lv).build - (fromLv > 0 ? levelDef(fromLv).build : 0);
  const nominal = Math.round((base * site.cost * cpi(year)) / 1000) * 1000;
  return { nominal, tag: nominal / economyScale(year) };
}

/** Monatlicher Betrieb: nominal + Preisschild. */
export function monthlyCost(site: CampSite, lv: number, year: number): { nominal: number; tag: number } {
  const nominal = Math.round((levelDef(lv).monthly * site.cost * cpi(year)) / 100) * 100;
  return { nominal, tag: nominal / economyScale(year) };
}

/** Bauen oder ausbauen. Rückgabe: Fehlertext oder null. */
export function buildCamp(g: Game, siteId: string, lv: number): string | null {
  const site = CAMP_SITE_BY_ID[siteId];
  const today = g.calendar.currentDate, year = yearOf(today);
  if (!site) return 'Unbekannter Standort.';
  if (!levelOpen(site, lv, year)) return `${levelDef(lv).name} in ${site.name} ist erst ab ${Math.max(site.from, levelDef(lv).from)} möglich.`;
  if (ORIGINS[site.id]?.nationality === homeNationality()) return 'Im eigenen Land gibt es dafür die Akademie.';
  const st = campsOf(g);
  const cur = campAt(g, siteId);
  if (!cur && st.camps.length >= MAX_CAMPS) return `Höchstens ${MAX_CAMPS} Camps im Ausland.`;
  if (cur?.building) return 'Dort wird schon gebaut.';
  const from = cur?.level ?? 0;
  if (lv <= from) return 'Diese Stufe gibt es dort schon.';
  if (lv > from + 1) return 'Erst die Stufe davor bauen.';
  const c = buildCost(site, lv, from, year);
  const own = g.clubs[g.managedClubId];
  if (own.finances.balance < c.nominal) return 'Dafür ist kein Geld in der Kasse.';
  const bud = checkBudget(g, 'youth', c.nominal);
  if (bud) return bud;
  book(own.finances, today, -c.nominal, 'facilities', `Jugendcamp ${site.name}: ${levelDef(lv).name}`, true);
  noteBudgetSpend(g, 'youth', c.nominal);
  const building = { level: lv, done: CalendarEngine.addDays(today, levelDef(lv).days) };
  if (cur) cur.building = building;
  else st.camps.push({ site: siteId, level: 0, opened: today, building, kids: [], total: 0, joined: 0 });
  return null;
}

/** Camp schließen (Talente im Camp gehen verloren, gebautes Geld ist weg). */
export function closeCamp(g: Game, siteId: string): void {
  const st = g.youthCamps;
  if (st) st.camps = st.camps.filter((c) => c.site !== siteId);
}

export const kidAge = (k: CampKid, date: string): number => yearOf(date) - k.born - (Number(date.slice(5, 7)) >= 7 ? 0 : 1);

/** Darf das Talent schon in deine Jugend? */
export function kidReady(g: Game, site: CampSite, k: CampKid): boolean {
  return kidAge(k, g.calendar.currentDate) >= joinAge(site, g.calendar.currentDate);
}

function youthOpts(site: CampSite, lv: number) {
  return { pool: 'talent' as const, potBias: levelDef(lv).potBias + site.talent, foreign: true };
}

/** Spieler eines Camps erzeugen (fester Seed → gleiches Potenzial bei jedem Aufruf). */
function makeCampPlayer(g: Game, clubId: string, site: CampSite, seed: string, lv: number, age: number, today: string): Player {
  const club = g.clubs[clubId];
  const p = generateYouthPlayer(clubId, seed, today, academyLevelOf(club), age, youthOpts(site, lv));
  const o = ORIGINS[site.id];
  const n = nameAndFace(o, mulberry32(hashSeed(`${p.id}|camp`)), yearOf(today) - age, p.id);
  Object.assign(p, { origin: o.id, nationality: originNat(o, yearOf(today), p.id), face: n.face, firstName: n.firstName, lastName: n.lastName, fullName: `${n.firstName} ${n.lastName}` });
  return p;
}

/** Talent übernehmen. Rückgabe: Fehlertext oder null. */
export function takeKid(g: Game, siteId: string, kidId: string): string | null {
  const camp = campAt(g, siteId), site = CAMP_SITE_BY_ID[siteId];
  const k = camp?.kids.find((x) => x.id === kidId);
  if (!camp || !site || !k) return 'Talent nicht gefunden.';
  const today = g.calendar.currentDate;
  if (!kidReady(g, site, k)) return `${k.name} darf erst mit ${joinAge(site, today)} wechseln (Regel des Weltverbands zum Schutz Minderjähriger).`;
  const club = g.clubs[g.managedClubId];
  const p = makeCampPlayer(g, club.id, site, k.id, k.lv || camp.level || 1, Math.min(19, kidAge(k, today)), today);
  Object.assign(p, { firstName: k.first, lastName: k.last, fullName: k.name, face: k.face, youthJoined: today });
  g.youthPlayers[p.id] = p;
  club.youthPlayerIds.push(p.id);
  camp.kids = camp.kids.filter((x) => x !== k);
  camp.joined++;
  return null;
}

/** Neue Talente eines Camps (1. Juli). */
function campIntake(g: Game, camp: OwnCamp, site: CampSite, today: string): CampKid[] {
  const year = yearOf(today);
  const n = levelDef(camp.level).talents;
  const out: CampKid[] = [];
  for (let i = 0; i < n; i++) {
    const seed = `camp_${site.id}_${year}_${i}`;
    const age = 14 + Math.floor(h01(`${g.managedClubId}|${seed}|age`) * 3);
    const p = makeCampPlayer(g, g.managedClubId, site, seed, camp.level, age, today);
    out.push({
      id: seed, born: year - age, pos: p.naturalPosition, name: p.fullName, first: p.firstName, last: p.lastName, face: p.face ?? '',
      st: [p.scoutedPotentialMin ?? 2, p.scoutedPotentialMax ?? 3], since: today, lv: camp.level,
    });
  }
  return out;
}

/** KI: große Vereine holen über Camps/Abos ein Talent im Jahr mehr. */
export function aiCampTalents(g: Game, today: string): number {
  const year = yearOf(today);
  if (year < 1995) return 0;
  const era = Math.min(1, (year - 1995) / 15);
  const sites = CAMP_SITES.filter((s) => year >= siteFrom(s) && ORIGINS[s.id]);
  if (!sites.length) return 0;
  let n = 0;
  for (const c of Object.values(g.clubs)) {
    if (c.id === g.managedClubId || c.playerIds.length < 11) continue;
    const p = Math.max(0, Math.min(1, (c.reputation - 75) / 20)) * era * 0.5;
    if (p <= 0 || h01(`aic|${c.id}|${year}`) >= p) continue;
    const site = sites[Math.floor(h01(`aics|${c.id}|${year}`) * sites.length)];
    const pl = makeCampPlayer(g, c.id, site, `aic_${year}`, 1, joinAge(site, today), today);
    pl.youthJoined = today;
    g.youthPlayers[pl.id] = pl;
    c.youthPlayerIds.push(pl.id);
    n++;
  }
  if (n) {
    const st = campsOf(g);
    st.ai = [...(st.ai ?? []).filter((x) => x[0] !== year), [year, n] as [number, number]].slice(-12);
  }
  return n;
}

/** Täglich: Fertigstellung, Betrieb am 1., Talente am 1. Juli. */
export function youthCampsDaily(g: Game, today: string): void {
  const july1 = today.slice(5) === '07-01';
  if (july1) aiCampTalents(g, today);
  const st = g.youthCamps;
  if (!st?.camps.length) return;
  const year = yearOf(today);
  const own = g.clubs[g.managedClubId];
  for (const camp of st.camps) {
    const site = CAMP_SITE_BY_ID[camp.site];
    if (!site) continue;
    if (camp.building && camp.building.done <= today) {
      camp.level = camp.building.level;
      delete camp.building;
      pushMessage(g.messages, makeMessage({
        date: today, category: 'training', from: 'Leiter Jugendakademie',
        subject: `Jugendcamp ${site.name}: ${levelDef(camp.level).name} fertig`,
        shortText: `Ab dem nächsten 1. Juli kommen ${levelDef(camp.level).talents} Talent(e) je Jahrgang.`,
        bodyText: `Unser Standort in ${site.name} ist als ${levelDef(camp.level).name} in Betrieb. Jeden Sommer nehmen wir dort ${levelDef(camp.level).talents} Talent(e) auf. Sie spielen beim Partnerverein, bis sie zu uns wechseln dürfen (ab ${joinAge(site, today)} Jahren). Laufende Kosten: monatlich unter Finanzen › Bilanz (Betrieb).`,
      }));
    }
    if (camp.level > 0 && today.slice(8) === '01') {
      const m = monthlyCost(site, camp.level, year);
      book(own.finances, today, -m.nominal, 'operations', `Jugendcamp ${site.name}`, true);
      noteBudgetSpend(g, 'youth', m.nominal, false);
    }
    if (!july1 || camp.level <= 0) continue;
    const gone = camp.kids.filter((k) => kidAge(k, today) >= 20);
    camp.kids = camp.kids.filter((k) => !gone.includes(k));
    const fresh = campIntake(g, camp, site, today);
    camp.kids.push(...fresh);
    camp.total += fresh.length;
    if (camp.kids.length > KIDS_MAX) camp.kids.splice(0, camp.kids.length - KIDS_MAX);
    const ready = camp.kids.filter((k) => !fresh.includes(k) && kidReady(g, site, k));
    const line = (k: CampKid) => `• ${k.name} (${k.pos}, ${kidAge(k, today)} Jahre)`;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'training', from: `Jugendcamp ${site.name}`,
      subject: `Neuer Jahrgang im Jugendcamp ${site.name}`,
      shortText: `${fresh.length} neue(s) Talent(e)${ready.length ? `, ${ready.length} dürfen jetzt wechseln` : ''}.`,
      bodyText: `Neu im Camp:\n${fresh.map(line).join('\n')}\n\n`
        + (ready.length ? `Alt genug für unsere Jugend (Jugend › Jugendcamps → Übernehmen):\n${ready.map(line).join('\n')}\n\n` : '')
        + (gone.length ? `Mit 20 zu alt – haben das Camp verlassen:\n${gone.map(line).join('\n')}\n\n` : '')
        + `Wechsel in unsere Jugend erst ab ${joinAge(site, today)} Jahren${joinAge(site, today) === 18 ? ' (Regel des Weltverbands zum Schutz Minderjähriger)' : ''}.`,
    }));
  }
}

/** Fertigstellungstermine (Kalender). */
export function campDates(g: Game): { date: string; name: string }[] {
  return (g.youthCamps?.camps ?? []).filter((c) => c.building).map((c) => ({ date: c.building!.done, name: CAMP_SITE_BY_ID[c.site]?.name ?? c.site }));
}

/** Monatliche Kosten aller fertigen Camps (Preisschild). */
export function campsMonthlyTag(g: Game): number {
  const year = yearOf(g.calendar.currentDate);
  return (g.youthCamps?.camps ?? []).reduce((a, c) => {
    const s = CAMP_SITE_BY_ID[c.site];
    return a + (s && c.level > 0 ? monthlyCost(s, c.level, year).tag : 0);
  }, 0);
}

/** Alte/fehlerhafte Spielstände absichern (loadMigrations). */
export function migrateYouthCamps(g: Game): void {
  const st = g.youthCamps;
  if (!st) return;
  if (!Array.isArray(st.camps)) st.camps = [];
  st.camps = st.camps.filter((c) => c && CAMP_SITE_BY_ID[c.site]);
  for (const c of st.camps) { c.kids ??= []; c.total ??= 0; c.joined ??= 0; c.level ??= 0; }
}
