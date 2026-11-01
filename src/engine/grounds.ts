// =============================================================================
// STADIONUMFELD — Rechenlogik ohne UI (Vereinsgelände 2.0)
// -----------------------------------------------------------------------------
// Lage & Fläche, Anreise (Parkplätze, ÖPNV, Chaos bei Großspielen), Handel,
// Sicherheit (Ausschreitungen, Strafen, Polizeigebühren), Hospitality & Medien,
// Abnutzung/Modernisierung. Preise und Freischaltjahre: data/groundsCatalog.ts.
// Spielablauf (Bauprojekte, Genehmigung, KI, Nachrichten): game/groundsGame.ts.
//
// Anschlüsse an andere Systeme (bewusst klein):
//   • finances.ts bookHomeMatch/bookCupHomeMatch → bookGroundsMatchday()
//   • environment.ts MonthInput.groundsMood ← groundsMoodBonus()
//   • stadium.averageAttendanceRate ← Delta von groundsAttendanceBonus() (monatlich)
// =============================================================================
import type { Club, FinanceCategory } from '../types';
import type { ClubGrounds, GroundsLocation, GroundsModuleKey, GroundsModuleState } from '../types/grounds';
import {
  GROUNDS_BY_KEY, GROUNDS_MODULES, GroundsLevelDef, GroundsModuleDef, INFRA_AREA, LAND_PARCEL, LOCATIONS, incidentBaseRate,
} from '../data/groundsCatalog';
import { clubTier, economyScale, revenueScale, tierScale, yearOf } from './economy';
import { commercialMultiplier } from './clubEconomy';
import { book } from './finances';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Spieltags-Skala (Bau, Unterhalt, Spieltagsposten). */
export const mdScale = (year: number) => revenueScale('matchday', year);

// -----------------------------------------------------------------------------
// Grundgrößen
// -----------------------------------------------------------------------------
/** Lage des Stadions: fest je Verein (deterministisch). */
export function locationFor(club: Club): GroundsLocation {
  const r = hash(`loc:${club.id}`) % 100;
  return r < 28 ? 'innenstadt' : r < 74 ? 'stadtteil' : 'stadtrand';
}

export function levelOf(gr: ClubGrounds | undefined, key: GroundsModuleKey): number {
  return gr?.modules[key]?.level ?? 0;
}

export function levelDef(key: GroundsModuleKey, level: number): GroundsLevelDef | undefined {
  return level >= 1 ? GROUNDS_BY_KEY[key].levels[level - 1] : undefined;
}

export function isOutdated(st: GroundsModuleState | undefined, def: GroundsModuleDef, year: number): boolean {
  return !!st && st.level > 0 && year - st.builtYear >= def.lifespan;
}

/** Wirkungsfaktor aus dem Zustand: 100 % → ×1, 0 % → ×0,6. Veraltet zusätzlich ×0,85. */
export function condMult(st: GroundsModuleState | undefined, def?: GroundsModuleDef, year?: number): number {
  if (!st) return 1;
  const base = 0.6 + 0.4 * clamp(st.condition, 0, 100) / 100;
  return def && year != null && isOutdated(st, def, year) ? base * 0.85 : base;
}

/** Wert eines Wirkungsfelds auf der aktuellen Stufe × Zustand. */
function eff(gr: ClubGrounds, key: GroundsModuleKey, field: keyof GroundsLevelDef, year: number): number {
  const st = gr.modules[key];
  const d = levelDef(key, st?.level ?? 0);
  const v = d?.[field];
  return typeof v === 'number' ? v * condMult(st, GROUNDS_BY_KEY[key], year) : 0;
}

// -----------------------------------------------------------------------------
// Fläche
// -----------------------------------------------------------------------------
export function infraAreaUsed(club: Club): number {
  let sum = 0;
  for (const [k, arr] of Object.entries(INFRA_AREA)) {
    const lv = Math.round(((club.infrastructure as unknown as Record<string, number>)[k]) ?? 1);
    sum += arr[clamp(lv, 0, 5)] ?? 0;
  }
  return sum;
}

export function modulesAreaUsed(gr: ClubGrounds): number {
  let sum = 0;
  for (const m of GROUNDS_MODULES) sum += levelDef(m.key, levelOf(gr, m.key))?.area ?? 0;
  // Laufende Bauprojekte belegen bereits die Fläche der Zielstufe.
  for (const p of gr.projects) {
    const cur = levelDef(p.module, levelOf(gr, p.module))?.area ?? 0;
    sum += Math.max(0, (levelDef(p.module, p.targetLevel)?.area ?? 0) - cur);
  }
  return sum;
}

export function areaUsed(club: Club, gr: ClubGrounds): number {
  return infraAreaUsed(club) + modulesAreaUsed(gr);
}

/** Preis des nächsten Grundstückspakets (nominal) oder null, wenn nichts mehr zu haben ist. */
export function landPrice(gr: ClubGrounds, year: number): number | null {
  const loc = LOCATIONS[gr.location];
  if (gr.landBought >= loc.maxLand) return null;
  return Math.round((loc.landPrice * Math.pow(1.3, gr.landBought) * mdScale(year)) / 10000) * 10000;
}
export { LAND_PARCEL };

// -----------------------------------------------------------------------------
// Anreise
// -----------------------------------------------------------------------------
/** Anteil der Nicht-Fußgänger, die mit dem Auto kommen. */
export function carShare(year: number): number {
  if (year < 1990) return 0.5 + (year - 1975) * 0.007;
  if (year < 2005) return 0.6 - (year - 1990) * 0.003;
  return clamp(0.555 - (year - 2005) * 0.005, 0.4, 0.6);
}

export interface AccessInfo { capacity: number; demand: number; ratio: number; spaces: number; transit: number; street: number }

/** Anreisekapazität (Personen) gegen die Nachfrage bei `attendance` Zuschauern. */
export function accessInfo(club: Club, gr: ClubGrounds, year: number, attendance: number): AccessInfo {
  const loc = LOCATIONS[gr.location];
  // Große Stadien stehen in großen Städten: Linienverkehr und Straßen wachsen mit (Wurzel der Größe).
  const sizeF = Math.sqrt(Math.max(1, (club.stadium?.capacity ?? 30000) / 30000));
  const spaces = Math.round(eff(gr, 'parking', 'spaces', year));
  const street = Math.round(loc.street * sizeF);
  // ÖPNV betreibt die Stadt: kein Verschleiß-Abschlag.
  const transit = Math.round(loc.baseTransit * sizeF + (levelDef('transit', levelOf(gr, 'transit'))?.transitCap ?? 0));
  const capacity = Math.round(spaces * 2.5 + street + transit);
  const demand = Math.round(attendance * (1 - loc.walk));
  return { capacity, demand, ratio: demand > 0 ? capacity / demand : 9, spaces, transit, street };
}

/** Typische Zuschauerzahl (für Planung und Auslastungs-Bonus). */
export function typicalAttendance(club: Club): number {
  return Math.round(club.stadium.capacity * clamp(club.stadium.averageAttendanceRate ?? 0.7, 0.3, 1));
}

// -----------------------------------------------------------------------------
// Sicherheit
// -----------------------------------------------------------------------------
/** Gesamte Risikosenkung durch Ordnungsdienst, Fanprojekt, Familienblock, Fanräume (0–0,85). */
export function riskReduction(gr: ClubGrounds, year: number): number {
  let keep = 1;
  for (const m of GROUNDS_MODULES) {
    let r = eff(gr, m.key, 'risk', year);
    if (m.key === 'fanProject') r *= clamp((gr.modules.fanProject?.months ?? 0) / 12, 0.25, 1);
    keep *= 1 - r;
  }
  return clamp(1 - keep, 0, 0.85);
}

/** Wahrscheinlichkeit von Ausschreitungen bei einem Heimspiel. */
export function incidentRisk(gr: ClubGrounds, year: number, derby: boolean, fanMood: number): number {
  return clamp(incidentBaseRate(year) * (derby ? 2.2 : 1) * (fanMood < 40 ? 1.3 : 1) * (1 - riskReduction(gr, year)), 0, 0.6);
}

// -----------------------------------------------------------------------------
// Wirkung auf Auslastung und Fan-Stimmung
// -----------------------------------------------------------------------------
export interface Contribution { label: string; value: number }

/** Bonus auf die Basis-Auslastung (Anteil) mit Aufschlüsselung. */
export function groundsAttendanceParts(club: Club, gr: ClubGrounds, year: number): Contribution[] {
  const parts: Contribution[] = [];
  const loc = LOCATIONS[gr.location];
  if (loc.att) parts.push({ label: `Lage (${loc.name})`, value: loc.att });
  for (const k of ['transit', 'familyBlock', 'floodlight'] as GroundsModuleKey[]) {
    let v = eff(gr, k, 'att', year);
    if (k === 'familyBlock' && year >= 1980 && year < 1993) v *= 1.5; // Familien kehren zurück
    if (v) parts.push({ label: GROUNDS_BY_KEY[k].name, value: v });
  }
  const sl = levelOf(gr, 'stewards');
  if (year >= 1980 && year < 1993 && sl >= 2) parts.push({ label: 'Sicherheit in der Krawall-Zeit', value: (sl - 1) * 0.007 });
  const acc = accessInfo(club, gr, year, typicalAttendance(club));
  if (acc.ratio < 1) parts.push({ label: 'Anreise überlastet', value: -Math.min(0.08, (1 - acc.ratio) * 0.12) });
  return parts;
}

export function groundsAttendanceBonus(club: Club, gr: ClubGrounds, year: number): number {
  return clamp(groundsAttendanceParts(club, gr, year).reduce((a, p) => a + p.value, 0), -0.12, 0.12);
}

/** Beitrag zum Zielwert der Fan-Stimmung (Punkte, −8..+8) mit Aufschlüsselung. */
export function groundsMoodParts(gr: ClubGrounds, year: number, today?: string): Contribution[] {
  const parts: Contribution[] = [];
  for (const m of GROUNDS_MODULES) {
    let v = eff(gr, m.key, 'mood', year);
    if (m.key === 'fanProject') v *= clamp((gr.modules.fanProject?.months ?? 0) / 12, 0.25, 1);
    if (m.key === 'choreoRoom' && year >= 2005 && year < 2015) v *= 1.5; // Ultra-Kultur
    if (m.key === 'familyBlock' && year >= 1998 && year < 2015) v -= 0.8; // Kurve verliert Stehplätze
    if (v) parts.push({ label: m.name, value: v });
  }
  if (today) {
    const since = new Date(Date.parse(today + 'T00:00:00Z') - 60 * 86400000).toISOString().slice(0, 10);
    const recent = gr.log.filter((e) => e.date >= since);
    const inc = recent.filter((e) => e.kind === 'incident').length;
    const chaos = recent.filter((e) => e.kind === 'chaos').length;
    if (inc) parts.push({ label: 'Ausschreitungen', value: -1.5 * inc });
    if (chaos) parts.push({ label: 'Anreise-Chaos', value: -1 * chaos });
  }
  return parts;
}

export function groundsMoodBonus(gr: ClubGrounds | undefined, year: number, today?: string): number {
  if (!gr) return 0;
  return clamp(groundsMoodParts(gr, year, today).reduce((a, p) => a + p.value, 0), -8, 8);
}

// -----------------------------------------------------------------------------
// Geld: Spieltag
// -----------------------------------------------------------------------------
export interface MoneyItem { label: string; amount: number; kind: 'matchday' | 'commercial' | 'facilities' | 'other' }

/** Besetzung der Business-Plätze (0,4–1). */
export function hospitalityOccupancy(club: Club): number {
  return clamp(0.45 + (club.reputation ?? 50) / 200, 0.4, 0.98);
}

/** Posten eines Heimspiels (nominal) – ohne zu buchen. Auch für die Vorschau. */
export function matchdayItems(club: Club, gr: ClubGrounds, attendance: number, year: number): MoneyItem[] {
  const md = mdScale(year);
  const items: MoneyItem[] = [];
  const loc = LOCATIONS[gr.location];
  // Parkgebühren
  const spaces = eff(gr, 'parking', 'spaces', year);
  if (spaces > 0) {
    const cars = (attendance * (1 - loc.walk) * carShare(year)) / 2.5;
    const parked = Math.min(cars, spaces);
    items.push({ label: 'Parkgebühren', amount: Math.round(parked * 1.5 * md), kind: 'matchday' });
  }
  // Je-Kopf- und Pauschalposten (Ordnungsdienst, Shuttle, Kombiticket, Familienblock, Fan-Zone)
  for (const k of ['transit', 'stewards', 'familyBlock', 'fanZone'] as GroundsModuleKey[]) {
    const d = levelDef(k, levelOf(gr, k));
    if (!d) continue;
    const cm = k === 'fanZone' || k === 'familyBlock' ? condMult(gr.modules[k], GROUNDS_BY_KEY[k], year) : 1;
    const ph = (d.perHead ?? 0) * (d.perHead && d.perHead > 0 ? cm : 1);
    const amount = Math.round((attendance * ph + (d.perMatch ?? 0)) * md);
    if (amount) items.push({ label: d.name, amount, kind: amount > 0 ? 'matchday' : 'facilities' });
  }
  // Hospitality
  const seats = eff(gr, 'hospitality', 'seats', year);
  if (seats > 0) {
    const occ = hospitalityOccupancy(club) * clamp(commercialMultiplier(club, year), 0.7, 1.5);
    items.push({ label: `Business-Plätze (${Math.round(seats * Math.min(1, occ))} belegt)`, amount: Math.round(seats * Math.min(1, occ) * 12 * md), kind: 'commercial' });
  }
  return items;
}

/** Anreise-Chaos: Schweregrad 0–0,5 (Anteil der Nachfrage über der Kapazität). */
export function chaosSeverity(club: Club, gr: ClubGrounds, year: number, attendance: number): number {
  const a = accessInfo(club, gr, year, attendance);
  return a.demand > 0 ? clamp((a.demand - a.capacity) / a.demand, 0, 0.5) : 0;
}

function addStats(gr: ClubGrounds, date: string, income: number, cost: number, extra?: { fines?: number; incidents?: number; chaos?: number }) {
  const y = Number(date.slice(0, 4));
  const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  const season = `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
  if (!gr.stats || gr.stats.season !== season) {
    if (gr.stats) gr.prevStats = gr.stats;
    gr.stats = { season, income: 0, cost: 0, fines: 0, incidents: 0, chaos: 0 };
  }
  gr.stats.income += income;
  gr.stats.cost += cost;
  gr.stats.fines += extra?.fines ?? 0;
  gr.stats.incidents += extra?.incidents ?? 0;
  gr.stats.chaos += extra?.chaos ?? 0;
}
export { addStats as addGroundsStats };

export function pushLog(gr: ClubGrounds, e: Omit<import('../types/grounds').GroundsLogEntry, 'shown'>, shown = false): void {
  gr.log.unshift({ ...e, shown });
  if (gr.log.length > 30) gr.log.length = 30;
}

/**
 * ANSCHLUSS finances.ts: bucht die Umfeld-Posten eines Heimspiels (alle Vereine mit
 * `grounds`). Ohne `grounds` (noch nicht nachgerüstet) passiert nichts.
 */
export function bookGroundsMatchday(club: Club, attendance: number, date: string, track: boolean): void {
  const gr = club.grounds;
  if (!gr || attendance <= 0) return;
  const year = yearOf(date);
  let inc = 0, cost = 0;
  for (const it of matchdayItems(club, gr, attendance, year)) {
    if (!it.amount) continue;
    book(club.finances, date, it.amount, (it.amount > 0 ? it.kind : 'facilities') as FinanceCategory, `Umfeld: ${it.label}`, track);
    if (it.amount > 0) inc += it.amount; else cost -= it.amount;
  }
  const sev = chaosSeverity(club, gr, year, attendance);
  let chaos = 0;
  if (sev >= 0.08) {
    const lost = Math.round(sev * attendance * 0.5 * mdScale(year));
    book(club.finances, date, -lost, 'other', 'Anreise-Chaos: entgangener Umsatz an Buden und Shop', track);
    cost += lost;
    chaos = 1;
    pushLog(gr, { date, kind: 'chaos', amount: lost, text: `Anreise-Chaos: ${Math.round(sev * 100)} % der Zuschauer kamen verspätet oder gar nicht zu Buden und Shop.` }, !track);
  }
  addStats(gr, date, inc, cost, { chaos });
}

// -----------------------------------------------------------------------------
// Geld: Monat
// -----------------------------------------------------------------------------
/** Flaute auf dem Fanartikelmarkt 1997–1999 (Überangebot). */
export function merchSlump(year: number): number {
  return year >= 1997 && year <= 1999 ? 0.7 : 1;
}

/** Monatliche Posten (nominal): Unterhalt (−) und laufende Erlöse (+). */
export function monthlyItems(club: Club, gr: ClubGrounds, year: number): MoneyItem[] {
  // Liga-Ebene: Unterhalt und Erlöse wachsen bei Unterklassigen nur anteilig mit (tierScale) –
  // sonst zahlte ein Viertligist Bundesliga-Preise und das Umfeld fraß seinen ganzen Umsatz.
  const tier = clubTier(club);
  const md = tierScale(mdScale(year), tier, 'matchday');
  const cms = tierScale(revenueScale('commercial', year), tier, 'commercial');
  const items: MoneyItem[] = [];
  let upkeep = 0;
  for (const m of GROUNDS_MODULES) {
    const st = gr.modules[m.key];
    const d = levelDef(m.key, st?.level ?? 0);
    if (!d) continue;
    let u = d.upkeep;
    if (m.key === 'fanProject' && year >= 1993) u *= 0.4; // NKSS: Stadt, Land und DFB tragen mit
    upkeep += u;
    if (d.monthly) {
      const cm = condMult(st, m, year);
      let v = d.monthly * cm;
      if (m.commercial) {
        v *= cms * commercialMultiplier(club, year) * merchSlump(year);
        if (m.key === 'onlineShop' && st!.level >= 3) v *= 0.6 + (club.brand?.international ?? 0) / 100;
      } else {
        v *= md;
        if (m.key === 'tours') v *= (levelOf(gr, 'museum') ? 1.3 : 1) * ((club.infrastructure.stadium ?? 1) >= 4 ? 1.3 : 1);
        if (m.key === 'museum') v *= 0.7 + (club.reputation ?? 50) / 150;
      }
      items.push({ label: d.name, amount: Math.round(v), kind: m.commercial ? 'commercial' : 'matchday' });
    }
  }
  if (upkeep > 0) items.unshift({ label: 'Unterhalt Umfeld', amount: -Math.round(upkeep * md), kind: 'facilities' });
  return items;
}

// -----------------------------------------------------------------------------
// Bauen
// -----------------------------------------------------------------------------
export function buildCost(key: GroundsModuleKey, level: number, year: number): number {
  const d = levelDef(key, level);
  if (!d || d.cost <= 0) return 0;
  const v = d.cost * mdScale(year);
  return v >= 100000 ? Math.round(v / 10000) * 10000 : Math.round(v / 1000) * 1000;
}

export interface BuildCheck { ok: boolean; reason?: string; cost: number; level: number; def?: GroundsLevelDef; areaNeed: number }

/** Ob die nächste Stufe gebaut werden kann (ohne Kontostand der KI-Budgets). */
export function checkNext(club: Club, gr: ClubGrounds, key: GroundsModuleKey, year: number): BuildCheck {
  const m = GROUNDS_BY_KEY[key];
  const cur = levelOf(gr, key);
  const level = cur + 1;
  const def = m.levels[level - 1];
  const fail = (reason: string, cost = 0) => ({ ok: false, reason, cost, level, def, areaNeed: 0 });
  if (!def) return fail('Höchste Stufe erreicht');
  const cost = buildCost(key, level, year);
  if (year < def.unlock) return fail(`Verfügbar ab ${def.unlock}`, cost);
  if (gr.projects.some((p) => p.module === key)) return fail('Bauvorhaben läuft bereits', cost);
  if (key === 'transit' && gr.talk) return fail('Verhandlung mit der Stadt läuft', cost);
  if (m.requires) {
    const have = (club.infrastructure as unknown as Record<string, number>)[m.requires.facility] ?? 1;
    if (have < m.requires.level) return fail(`Braucht Fanshop Stufe ${m.requires.level}`, cost);
  }
  const areaNeed = Math.max(0, def.area - (levelDef(key, cur)?.area ?? 0));
  if (areaUsed(club, gr) + areaNeed > gr.area) return { ok: false, reason: 'Keine Fläche frei – Grundstück kaufen oder etwas abreißen', cost, level, def, areaNeed };
  if (club.finances.balance < cost) return { ok: false, reason: 'Kontostand zu niedrig', cost, level, def, areaNeed };
  return { ok: true, cost, level, def, areaNeed };
}

/** Sanierung auf 100 % (veraltete Anlagen werden dabei modernisiert). */
export function renovateCost(gr: ClubGrounds, key: GroundsModuleKey, year: number): number {
  const st = gr.modules[key];
  if (!st || st.level < 1) return 0;
  const m = GROUNDS_BY_KEY[key];
  let total = 0;
  for (let l = 1; l <= st.level; l++) total += m.levels[l - 1].cost;
  const share = 0.4 * (100 - st.condition) / 100 + (isOutdated(st, m, year) ? 0.25 : 0);
  const v = total * share * mdScale(year);
  return v < 1000 ? 0 : Math.round(v / 1000) * 1000;
}

/** Monatliche Abnutzung (doppelt bei veralteten Anlagen). */
export function wearMonthly(gr: ClubGrounds, year: number): void {
  for (const m of GROUNDS_MODULES) {
    const st = gr.modules[m.key];
    if (!st || st.level < 1) continue;
    st.condition = Math.max(10, st.condition - m.wear * (isOutdated(st, m, year) ? 2 : 1));
    if (m.key === 'fanProject') st.months = (st.months ?? 0) + 1;
  }
}

// -----------------------------------------------------------------------------
// Ausgangslage (neue Spiele, alte Spielstände, KI-Vereine)
// -----------------------------------------------------------------------------
/** Stufe, die ein Verein mit Ruf `rep` im Jahr `year` typischerweise hat. */
export function typicalLevel(m: GroundsModuleDef, rep: number, year: number, lagYears: number): number {
  let lv = 0;
  // Stufen, die es schon 1975 gab, haben die Vereine bereits (kein Rückstand).
  m.levels.forEach((d, i) => { if ((d.unlock <= 1975 ? 1975 : d.unlock + lagYears) <= year && d.aiRep <= rep) lv = i + 1; });
  return lv;
}

export function makeGrounds(club: Club, year: number): ClubGrounds {
  const location = locationFor(club);
  const rep = club.reputation ?? 60;
  const lag = rep >= 85 ? 1 : rep >= 75 ? 3 : rep >= 65 ? 6 : 10;
  const gr: ClubGrounds = { location, area: LOCATIONS[location].area, landBought: 0, modules: {}, projects: [], attApplied: 0, log: [] };
  for (const m of GROUNDS_MODULES) {
    if (m.requires && ((club.infrastructure as unknown as Record<string, number>)[m.requires.facility] ?? 1) < m.requires.level) continue;
    let lv = typicalLevel(m, rep, year, m.key === 'floodlight' ? 0 : lag);
    // Fanprojekte und Fanräume gibt es nicht überall (deterministisch je Verein).
    if ((m.key === 'fanProject' || m.key === 'choreoRoom' || m.key === 'museum') && hash(`${m.key}:${club.id}`) % 3 === 0) lv = 0;
    if (lv > 0) {
      const built = Math.max(m.levels[lv - 1].unlock, year - (hash(`age:${m.key}:${club.id}`) % 12));
      gr.modules[m.key] = { level: lv, condition: clamp(100 - (year - built) * 3.5, 45, 100), builtYear: built, months: m.key === 'fanProject' ? 24 : undefined };
    }
  }
  // Fläche reicht immer für die Ausgangslage (+2 Reserve).
  gr.area = Math.max(gr.area, areaUsed(club, gr) + 2);
  return gr;
}

export { economyScale };
