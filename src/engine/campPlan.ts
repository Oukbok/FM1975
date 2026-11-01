// =============================================================================
// TRAININGSLAGER-PLANER – Rechenlogik ohne Spielstand: Kartenausschnitte (Kontinente),
// Vor- und Nachteile eines Ziels, Wirkungsbalken der Planung, Erfolgswertung.
// Oberfläche: views/kader/camp/ · Rechnung der Wirkung: engine/trainingCamp.ts.
// =============================================================================
import { CAMP_CLIMATE, CAMP_TRANSPORT_LABEL, CampDestination } from '../data/campDestinations';
import { CampLodging, lodgingsFor } from '../data/campLodgings';
import type { CampSeason } from '../game/winterShared';
import { CampOutlook, campWeather, hasHall, hasTurf, lodgingAltitude } from './trainingCamp';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const pct = (v: number) => `${Math.round(v * 100)} %`;

// -----------------------------------------------------------------------------
// Karte: Ausschnitte (Grad) – lon0/lon1, lat0/lat1, Bezugsbreite für die Stauchung
// -----------------------------------------------------------------------------
export type CampMapViewId = 'dach' | 'europa' | 'afrika' | 'asien' | 'amerika' | 'welt';
export interface CampMapView { id: CampMapViewId; label: string; lon: [number, number]; lat: [number, number]; phi: number }
export const CAMP_MAP_VIEWS: CampMapView[] = [
  { id: 'dach', label: 'Deutschland & Alpen', lon: [4.2, 16.4], lat: [45.4, 55.4], phi: 50 },
  { id: 'europa', label: 'Europa & Mittelmeer', lon: [-19, 37], lat: [25.5, 59], phi: 44 },
  { id: 'afrika', label: 'Afrika', lon: [-24, 54], lat: [-37, 38], phi: 5 },
  { id: 'asien', label: 'Asien & Naher Osten', lon: [24, 146], lat: [-8, 56], phi: 30 },
  { id: 'amerika', label: 'Amerika', lon: [-128, -58], lat: [12, 54], phi: 34 },
  { id: 'welt', label: 'Welt', lon: [-170, 180], lat: [-50, 75], phi: 20 },
];
export function inView(v: CampMapView, d: CampDestination): boolean {
  const [lat, lon] = d.geo;
  return lon >= v.lon[0] && lon <= v.lon[1] && lat >= v.lat[0] && lat <= v.lat[1];
}
/** Kontinent eines Ziels (Startansicht der Karte); Ausschnitte überlappen sich. */
export function homeView(d: CampDestination | undefined): CampMapViewId {
  if (!d) return 'dach';
  const [lat, lon] = d.geo;
  if (inView(CAMP_MAP_VIEWS[0], d)) return 'dach';
  if (lon < -30) return 'amerika';
  if (lat > 27 && lon < 42) return 'europa';
  if (lat < 0 || lon < 38) return 'afrika';
  return 'asien';
}

// -----------------------------------------------------------------------------
// Vor- und Nachteile eines Ziels (mit gewählter oder bester Unterkunft)
// -----------------------------------------------------------------------------
export interface ProsCons { pros: string[]; cons: string[] }
export interface ProsConsCtx {
  d: CampDestination; l?: CampLodging; season: CampSeason; month: number; year: number;
  /** Gesamtkosten (nominal) und Kontostand für die Einordnung. */
  cost?: number; balance?: number; obligation?: string; aiCount?: number;
}
export function destinationProsCons(c: ProsConsCtx): ProsCons {
  const { d, month, year } = c;
  const pros: string[] = [], cons: string[] = [];
  const ls = lodgingsFor(d.id, year);
  const l = c.l ?? ls[ls.length - 1];
  const w = campWeather(d, month);
  const cover = l && (hasTurf(l, year) || hasHall(l, year));
  // Klima im gewählten Monat
  if (w.risk <= 0.15) pros.push(`${MONTHS[month]}: ${CAMP_CLIMATE[d.climate].label}, kaum Ausfälle (${pct(w.risk)})`);
  else if (w.risk >= 0.45) cons.push(`${MONTHS[month]}: ${pct(w.risk)} Ausfallrisiko${cover ? ' – Halle/Kunstrasen fangen einiges auf' : ', Plätze oft unbespielbar'}`);
  if (w.ground >= 0.8 && w.risk > 0.15) pros.push('Rasen in bestem Zustand');
  // Reise
  const h = String(d.travelH).replace('.', ',');
  if (d.transport !== 'flug' && d.travelH <= 4) pros.push(`Kurze Anreise (${CAMP_TRANSPORT_LABEL[d.transport]}, ${h} h)`);
  else if (d.transport === 'flug' && d.travelH >= 8) cons.push(`${h} h Flug${Math.abs(d.tz) >= 3 ? `, Jetlag (${d.tz > 0 ? '+' : '−'}${Math.abs(d.tz)} h)` : ''} – müde Beine bei der Rückkehr`);
  else if (Math.abs(d.tz) >= 3) cons.push(`Zeitverschiebung ${d.tz > 0 ? '+' : '−'}${Math.abs(d.tz)} h`);
  else if (d.travelH >= 8) cons.push(`Lange Busreise (${h} h)`);
  // Anlage
  if (l) {
    if (l.pitches >= 4 && l.pitchQ >= 0.85) pros.push(`Erstklassige Anlage (${l.pitches} Plätze)`);
    else if (l.pitches <= 1) cons.push('Nur ein Platz – wenig Raum für Gruppen');
    if (hasHall(l, year) && (d.seasons.includes('winter') && c.season === 'winter')) pros.push('Halle als Ausweichort bei Frost');
    if (l.runs === 'duenen' || l.runs === 'berg') pros.push(l.runs === 'duenen' ? 'Dünenläufe für die Kondition' : 'Bergläufe für die Kondition');
  }
  // Höhe
  const alt = l ? lodgingAltitude(d, l) : d.altitude;
  if (alt >= 1500) { pros.push(`Höhenreiz auf ${alt.toLocaleString('de-DE')} m – wirkt zwei Wochen später`); cons.push('In der Höhe müde Beine direkt nach dem Lager'); }
  // Ablenkung
  const lure = l ? l.lure : 0.3;
  if (d.buzz >= 0.45 || lure >= 0.5) cons.push(d.buzz >= 0.8 ? 'Termine, Fans, Presse: kaum Ruhe zum Trainieren' : 'Viel Ablenkung – Gefahr für die Disziplin');
  else if (d.buzz <= 0.15 && (!l || l.quiet >= 0.6)) pros.push('Abgeschieden – volle Konzentration');
  // Geld, Sponsor, Image
  if (d.marketing >= 0.2) pros.push(d.marketing >= 0.8 ? 'Marketingreise: hohe Erlöse, weltweite Bekanntheit' : 'Sponsoren-Termine und internationale Bekanntheit');
  if (c.obligation === d.id) pros.push('Erfüllt die Sponsor-Pflicht');
  if (c.cost != null && c.balance != null && c.balance > 0) {
    const share = c.cost / c.balance;
    if (share >= 0.12) cons.push(`Teuer: ${pct(share)} des Kontostands`);
    else if (share <= 0.02) pros.push('Günstig');
  }
  const crit = [...(d.criticism ?? [])].reverse().find((x) => x.from <= year);
  if (crit) cons.push(crit.text.replace(/\s*\[C\d+\]/g, ''));
  const home = d.region === 'inland' || d.region === 'kueste' || d.region === 'mittelgebirge' || d.country === 'Deutschland';
  if (home && d.buzz >= 0.2) pros.push('Fans schauen beim Training zu');
  if ((c.aiCount ?? 0) >= 4) cons.push(`Voll: ${c.aiCount} andere Vereine vor Ort`);
  else if (d.opp === 'international' || d.opp === 'top') pros.push('Starke Testgegner vor Ort');
  return { pros: pros.slice(0, 5), cons: cons.slice(0, 4) };
}

// -----------------------------------------------------------------------------
// Wirkungsbalken (wie Taktik › Wirkung im Spiel): −1 … +1, `bad` = höher ist schlechter
// -----------------------------------------------------------------------------
export interface CampBar { key: string; label: string; d: number; text: string; bad?: boolean; hint: string }
export interface CampBarCtx {
  o: CampOutlook; travelers: number; youth: number; stayed: number; injuredAlong: number;
  cost: number; income: number; balance: number;
}
export function campEffectBars(c: CampBarCtx): CampBar[] {
  const { o } = c;
  const fit = o.fitness + o.altitudeFitness;
  const tact = o.dev * 2 + Math.max(0, o.form) / 6;
  const spirit = (o.morale - 0.3) * 2.2 + o.satisfaction / 12 - o.starGrumble * 2 - o.discipline * 1.5
    - (c.stayed > 0 ? Math.min(0.5, c.stayed * 0.06) : 0) + (c.youth > 0 ? 0.05 : 0);
  const rest = (o.campFrische - o.travelFrische) / 18 + (c.injuredAlong > 0 ? o.heal / 25 : 0);
  const injN = o.injury * (c.travelers + c.youth);
  const net = c.income - c.cost;
  const share = c.balance > 0 ? -net / c.balance : 1;
  const sgn = (v: number, dig = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(dig).replace('.', ',')}`;
  return [
    { key: 'fit', label: 'Fitness', d: clamp(fit / 16, -1, 1), text: sgn(fit), hint: 'Fitness-Aufbau je Spieler (inkl. Höhenreiz)' },
    { key: 'tact', label: 'Taktik & Form', d: clamp(tact / 1.4, -1, 1), text: sgn(o.form), hint: 'Entwicklungsschritte, Spielformen, Testspiele' },
    { key: 'spirit', label: 'Teamgeist', d: clamp(spirit, -1, 1), text: spirit >= 0.35 ? 'stark' : spirit >= 0.1 ? 'gut' : spirit > -0.1 ? 'neutral' : 'leidet', hint: `Chance auf bessere Stimmung ${pct(o.morale)}; Zuhausegebliebene, Disziplin und murrende Stars ziehen ab` },
    { key: 'rest', label: 'Erholung', d: clamp(rest, -1, 1), text: sgn(o.campFrische - o.travelFrische, 0), hint: 'Frische bei der Rückkehr (Reise, Höhe, Regeneration); mitreisende Verletzte' },
    { key: 'inj', label: 'Verletzungsrisiko', d: clamp(injN / 2.5, 0, 1), text: `≈ ${injN.toFixed(1).replace('.', ',')}`, bad: true, hint: 'Erwartete Verletzte im Lager' },
    { key: 'cash', label: 'Kosten / Kasse', d: clamp(share / 0.15, -1, 1), text: c.balance > 0 ? `${share > 0 ? '−' : '+'}${pct(Math.abs(share))}` : '–', bad: true, hint: 'Saldo aus Kosten und Erlösen im Verhältnis zum Kontostand' },
  ];
}

// -----------------------------------------------------------------------------
// Erfolgswertung nach dem Lager
// -----------------------------------------------------------------------------
export function campScore(x: { luck: number; fitGain: number; fitAfter?: number; dev: number; moraleUp: number; moraleDown: number; travelers: number; injuries: number; incidents: number }): number {
  const n = Math.max(1, x.travelers);
  // Wer schon am Limit ist (Fitness ≈ 100), dem fehlt kein Zuwachs – das zählt als erfüllt.
  const fit = (x.fitAfter ?? 0) >= 98.5 ? Math.max(10, Math.min(16, x.fitGain * 1.2)) : Math.min(16, x.fitGain * 1.2);
  const s = 52 + (x.luck - 1) * 70 + fit + Math.min(10, x.dev * 18)
    + (x.moraleUp / n) * 22 - (x.moraleDown / n) * 22 - x.injuries * 7 - x.incidents * 4;
  return Math.round(clamp(s, 3, 98));
}
export function campGrade(score: number): string {
  return score >= 80 ? 'Voller Erfolg' : score >= 65 ? 'Gelungen' : score >= 45 ? 'Durchwachsen' : score >= 30 ? 'Enttäuschend' : 'Fehlschlag';
}
