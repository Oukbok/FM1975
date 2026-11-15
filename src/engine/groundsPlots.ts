// =============================================================================
// VEREINSGELÄNDE — Grundstückskarte (Wunsch Pascal: keine leeren Grundstücke,
// alle kaufbaren von Anfang an sichtbar). Rund um den Campus liegen zwölf
// Nachbargrundstücke mit fester Lage und Größe. Je Verein und Lage steht fest
// (aus der Vereins-ID, nichts Zufälliges zur Laufzeit), welche davon zu kaufen
// sind und was darauf steht: Brachland, Kleingärten, Wohnhäuser oder Gewerbe.
// Bebaute Grundstücke kosten deutlich mehr (Entschädigung, Abriss).
// Gekaufte Grundstücke (`ClubGrounds.plots`) sind Bauland; ein Umfeld-Modul,
// das dort gebaut wird, steht in `ClubGrounds.sites`.
// Spielablauf (Kauf, Bau, Migration): game/groundsGame.ts · Zeichnung:
// views/verein/grounds/PlotLayer.tsx.
// =============================================================================
import type { Club } from '../types';
import type { ClubGrounds, GroundsLocation, GroundsModuleKey } from '../types/grounds';
import { GROUNDS_BY_KEY, GROUNDS_MODULES, LAND_PARCEL, LOCATIONS } from '../data/groundsCatalog';
import { BuildCheck, EXPANSION_PARCELS, LAND_EXPANSIONS, checkNext, levelOf, mdScale } from './grounds';

export type PlotKind = 'brache' | 'garten' | 'haeuser' | 'gewerbe';

export interface PlotDef {
  id: string;
  /** Lage in der Zeichnung (Welt-Koordinaten der Geländeszene). */
  x: number; y: number; w: number; d: number;
  /** Größe in Parzellen. */
  size: number;
  /** Lagebezeichnung für die Liste. */
  where: string;
}

/** Feste Karte: westlich der Quartiere, östlich der Campusstraße, südlich des Campus. */
export const PLOTS: PlotDef[] = [
  { id: 'w1', x: -4.4, y: 37.2, w: 7, d: 7.2, size: 3, where: 'westlich des Nachwuchs-Quartiers' },
  { id: 'w2', x: -4.4, y: 47, w: 7, d: 9.2, size: 4, where: 'westlich der Verwaltung' },
  { id: 'w3', x: -4.4, y: 59.2, w: 7, d: 4.8, size: 2, where: 'im Südwesten' },
  { id: 'e1', x: 47.6, y: 33.4, w: 8.4, d: 6.6, size: 3, where: 'östlich der Campusstraße' },
  { id: 'e2', x: 47.6, y: 40.6, w: 8.4, d: 6.6, size: 3, where: 'östlich der Campusstraße' },
  { id: 'e3', x: 47.6, y: 47.8, w: 8.4, d: 8.4, size: 4, where: 'östlich der Verwaltung' },
  { id: 'e4', x: 47.6, y: 56.8, w: 8.4, d: 4.2, size: 2, where: 'im Südosten' },
  { id: 's1', x: 4, y: 59.2, w: 9.6, d: 7, size: 4, where: 'südlich des Campus' },
  { id: 's2', x: 14, y: 59.2, w: 7.2, d: 7, size: 3, where: 'südlich des Campus' },
  { id: 's3', x: 21.6, y: 59.2, w: 5, d: 7, size: 2, where: 'südlich des Campus' },
  { id: 's4', x: 27, y: 59.2, w: 9.6, d: 7, size: 4, where: 'südlich des Campus' },
  { id: 's5', x: 37, y: 59.2, w: 7.2, d: 7, size: 3, where: 'südlich des Campus' },
];
export const PLOT_BY_ID: Record<string, PlotDef> = Object.fromEntries(PLOTS.map((p) => [p.id, p]));

export interface PlotKindDef { name: string; factor: number; desc: string; clear: string }
export const PLOT_KINDS: Record<PlotKind, PlotKindDef> = {
  brache: { name: 'Brachland', factor: 1, desc: 'Ungenutztes Land: Unkraut, Schutt, ein alter Schuppen. Niemand muss weichen – der günstigste Weg zu mehr Fläche.', clear: 'Der Schutt wird abgefahren, die Fläche planiert.' },
  garten: { name: 'Kleingärten', factor: 1.4, desc: 'Eine Kleingartenkolonie. Die Pächter bekommen eine Entschädigung und Ersatzland, die Lauben werden abgebaut.', clear: 'Die Lauben werden abgebaut, die Pächter entschädigt.' },
  haeuser: { name: 'Wohnhäuser', factor: 2.4, desc: 'Wohnhäuser mit Gärten. Der Verein muss die Häuser kaufen, die Bewohner entschädigen und alles abreißen lassen – das kostet.', clear: 'Die Häuser werden gekauft und abgerissen, die Bewohner ziehen um.' },
  gewerbe: { name: 'Gewerbe', factor: 3, desc: 'Werkstatt und Halle mit Hof. Der Betrieb verlangt Ablöse für Gebäude, Maschinen und den Umzug – das teuerste Land am Platz.', clear: 'Der Betrieb zieht um, Halle und Hof werden abgerissen.' },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Bisherige Obergrenze der zukaufbaren Fläche je Lage (Parzellen). */
export function landCap(location: GroundsLocation): number {
  return LOCATIONS[location].maxLand * LAND_PARCEL + LAND_EXPANSIONS * EXPANSION_PARCELS;
}

/** Verteilung der Arten je Lage (Schwellen in Prozent: Brache, Kleingärten, Wohnhäuser, Rest Gewerbe). */
const KIND_MIX: Record<GroundsLocation, [number, number, number]> = {
  innenstadt: [10, 25, 70],
  stadtteil: [30, 55, 85],
  stadtrand: [60, 80, 90],
};

export interface ClubPlot extends PlotDef { kind: PlotKind; buyable: boolean }

const cache = new Map<string, ClubPlot[]>();

/**
 * Karte eines Vereins: Art jedes Grundstücks und ob es zu kaufen ist. Fest aus
 * Vereins-ID und Lage. Kaufbar sind so viele, dass ihre Parzellen zusammen etwa
 * die frühere Obergrenze der Lage ergeben; darunter immer ein kleines Stück
 * Brachland und mindestens ein bebautes Grundstück.
 */
export function clubPlots(clubId: string, location: GroundsLocation): ClubPlot[] {
  const ck = `${clubId}|${location}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const cap = landCap(location);
  const order = [...PLOTS].sort((a, b) => hash(`plot:${clubId}:${a.id}`) - hash(`plot:${clubId}:${b.id}`));
  // Ein kleines Grundstück zuerst (Einstieg, und alte Spielstände mit einem Zukauf finden ihr Stück).
  const small = order.findIndex((p) => p.size === LAND_PARCEL);
  if (small > 0) order.unshift(...order.splice(small, 1));
  // Auswahl, die die Obergrenze genau trifft (sonst knapp darunter): in der Innenstadt wenige große,
  // am Stadtrand viele kleinere Grundstücke; bei Gleichstand die in der festen Reihenfolge vorderen.
  const want = location === 'innenstadt' ? -1 : location === 'stadtrand' ? 1 : 0;
  let bestMask = 1, bestSum = 0, bestN = 0, bestScore = -1;
  for (let mask = 1; mask < 1 << order.length; mask += 2) { // Bit 0 = das kleine Grundstück, immer dabei
    let sum = 0, score = 0, n = 0;
    for (let i = 0; i < order.length; i++) if (mask & (1 << i)) { sum += order[i].size; n++; score += 1 << (order.length - i); }
    if (sum > cap) continue;
    const better = sum !== bestSum ? sum > bestSum : (n - bestN) * want !== 0 ? (n - bestN) * want > 0 : score > bestScore;
    if (better) { bestMask = mask; bestSum = sum; bestN = n; bestScore = score; }
  }
  const buy = order.filter((_, i) => bestMask & (1 << i)).map((p) => p.id);
  const mix = KIND_MIX[location];
  const kinds: Record<string, PlotKind> = {};
  for (const p of PLOTS) {
    const r = hash(`kind:${clubId}:${p.id}`) % 100;
    kinds[p.id] = r < mix[0] ? 'brache' : r < mix[1] ? 'garten' : r < mix[2] ? 'haeuser' : 'gewerbe';
  }
  kinds[buy[0]] = 'brache';
  if (buy.length > 1 && !buy.some((id) => kinds[id] === 'haeuser' || kinds[id] === 'gewerbe')) {
    kinds[buy[buy.length - 1]] = hash(`built:${clubId}`) % 2 ? 'haeuser' : 'gewerbe';
  }
  const out = PLOTS.map((p) => ({ ...p, kind: buy.includes(p.id) ? kinds[p.id] : 'haeuser' as PlotKind, buyable: buy.includes(p.id) }));
  cache.set(ck, out);
  return out;
}

export const plotsOf = (club: Club, gr: ClubGrounds) => clubPlots(club.id, gr.location);
export const ownedPlotIds = (gr: ClubGrounds): string[] => gr.plots ?? [];
export const isOwned = (gr: ClubGrounds, id: string) => (gr.plots ?? []).includes(id);
/** Noch zu kaufende Grundstücke, günstigstes zuerst. */
export function plotsForSale(club: Club, gr: ClubGrounds, year: number): ClubPlot[] {
  return plotsOf(club, gr).filter((p) => p.buyable && !isOwned(gr, p.id)).sort((a, b) => plotPrice(gr, a, year) - plotPrice(gr, b, year));
}

/**
 * Kaufpreis (nominal): Grundpreis je Parzelle der Lage × Größe × Art-Faktor,
 * +8 % je bereits gekauftem Grundstück, auf 10.000 gerundet. Ein Stück Brachland
 * mit zwei Parzellen kostet so viel wie früher der erste Zukauf.
 */
export function plotPrice(gr: ClubGrounds, plot: { size: number; kind: PlotKind }, year: number): number {
  const base = LOCATIONS[gr.location].landPrice / LAND_PARCEL;
  const v = base * plot.size * PLOT_KINDS[plot.kind].factor * Math.pow(1.08, ownedPlotIds(gr).length) * mdScale(year);
  return Math.max(10000, Math.round(v / 10000) * 10000);
}

/** Modul, das auf dem Grundstück steht (oder dort gebaut wird). */
export const siteOf = (gr: ClubGrounds, plotId: string): GroundsModuleKey | undefined => gr.sites?.[plotId];
/** Grundstück, auf dem das Modul steht. */
export function plotOfModule(gr: ClubGrounds, key: GroundsModuleKey): string | undefined {
  return Object.keys(gr.sites ?? {}).find((id) => gr.sites![id] === key);
}

/** Zuordnungen aufräumen: Modul abgerissen bzw. Bauantrag abgelehnt → Grundstück ist wieder frei. */
export function cleanSites(gr: ClubGrounds): void {
  if (!gr.sites) return;
  for (const [id, key] of Object.entries(gr.sites)) {
    if (!isOwned(gr, id) || (levelOf(gr, key) < 1 && !gr.projects.some((p) => p.module === key))) delete gr.sites[id];
  }
}

/** Diese Umfeld-Teile haben keinen eigenen Bauplatz (Strecke der Stadt, Masten am Stadion). */
const NO_SITE: GroundsModuleKey[] = ['transit', 'floodlight'];

export interface PlotOption { key: GroundsModuleKey; check: BuildCheck; area: number; upgrade: boolean }

/**
 * Was auf einem eigenen, freien Grundstück gebaut werden kann: jedes Umfeld-Modul,
 * dessen nächste Stufe freigeschaltet ist, Fläche braucht und mit ihrer Fläche auf
 * das Grundstück passt, und das noch auf keinem anderen Grundstück steht.
 * `check.ok` sagt, ob der Bau sofort möglich ist (Geld, Gesamtfläche, Voraussetzungen).
 */
export function buildableOn(club: Club, gr: ClubGrounds, plotId: string, year: number): PlotOption[] {
  const plot = PLOT_BY_ID[plotId];
  if (!plot || !isOwned(gr, plotId) || siteOf(gr, plotId)) return [];
  const out: PlotOption[] = [];
  for (const m of GROUNDS_MODULES) {
    if (NO_SITE.includes(m.key) || plotOfModule(gr, m.key)) continue;
    const check = checkNext(club, gr, m.key, year);
    const def = check.def;
    if (!def || year < def.unlock || def.area < 1 || def.area > plot.size) continue;
    if (gr.projects.some((p) => p.module === m.key)) continue;
    out.push({ key: m.key, check, area: def.area, upgrade: levelOf(gr, m.key) > 0 });
  }
  return out.sort((a, b) => Number(b.check.ok) - Number(a.check.ok) || Number(a.upgrade) - Number(b.upgrade) || GROUNDS_BY_KEY[a.key].name.localeCompare(GROUNDS_BY_KEY[b.key].name));
}

/** Ob `key` (nächste Stufe) auf dieses Grundstück darf. */
export function canSite(club: Club, gr: ClubGrounds, plotId: string, key: GroundsModuleKey, year: number): boolean {
  return buildableOn(club, gr, plotId, year).some((o) => o.key === key);
}

/** Zugekaufte Parzellen nach der alten Zählung (`landBought` Pakete, danach Nachbargelände). */
function legacyParcels(gr: ClubGrounds): number {
  const max = LOCATIONS[gr.location].maxLand;
  const n = gr.landBought ?? 0;
  return Math.min(n, max) * LAND_PARCEL + Math.max(0, n - max) * EXPANSION_PARCELS;
}

/**
 * Alte Spielstände: `landBought > 0`, aber noch keine Grundstücksliste → so viele
 * Grundstücke als gekauft markieren, dass ihre Parzellen die zugekaufte Fläche
 * möglichst genau, aber nicht darüber, abdecken (günstigste Kombination, also
 * zuerst Brachland). `area` bleibt unverändert. Idempotent.
 */
export function migratePlots(club: Club, gr: ClubGrounds): void {
  if (gr.plots || !(gr.landBought > 0)) return;
  const target = Math.max(0, Math.min(gr.area - LOCATIONS[gr.location].area, legacyParcels(gr)));
  const cand = plotsOf(club, gr).filter((p) => p.buyable);
  let best: ClubPlot[] = [], bestSum = 0, bestCost = 0;
  for (let mask = 1; mask < 1 << cand.length; mask++) {
    let sum = 0, cost = 0;
    const set: ClubPlot[] = [];
    for (let i = 0; i < cand.length; i++) if (mask & (1 << i)) { sum += cand[i].size; cost += cand[i].size * PLOT_KINDS[cand[i].kind].factor; set.push(cand[i]); }
    if (sum > target) continue;
    if (sum > bestSum || (sum === bestSum && cost < bestCost - 1e-9)) { best = set; bestSum = sum; bestCost = cost; }
  }
  gr.plots = best.map((p) => p.id);
}
