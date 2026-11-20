// =============================================================================
// KONTINENTE AUSSERHALB EUROPAS – leichte Hintergrund-Simulation (Wunsch Pascal).
// -----------------------------------------------------------------------------
// Ziel: Teilnehmer für Weltpokal/Klub-WM (game/intercontinental.ts) mit minimaler
// Rechenzeit und minimalem Speicher – KEINE Ligen, KEINE Spieltage, keine Kader.
//   • Saisonergebnis je Land = gewichtete Ziehung: Stärke je Epoche aus den Daten
//     (data/world/continents/) + Saisonform (fest aus Verein/Jahr) + Zufall.
//     Gespeichert nur die ersten vier als Index-Zeichenkette je Jahr.
//   • Kontinentalpokal je Kontinent = schlanker K.-o.-Baum (8/16 Teams, Hin/Rück
//     als Gesamtergebnis), historische Lenkung über die echten Sieger (Option
//     „Historische Entwicklung der Vereine“: Aus/Historisch/Streng).
// Zeitachse (Kalenderjahre wie in Südamerika/Afrika/Asien): beim Saisonwechsel in
// die Saison y/y+1 wird die Meisterschaft des Jahres y−1 und der Kontinentalpokal
// des Jahres y ausgespielt (dessen Sieger spielt im Dezember y den Weltpokal).
// Optionales Feld `game.continents`; fehlt es (alte Spielstände), wird es beim Laden
// bzw. am nächsten Saisonwechsel angelegt (`ensureContinents`).
// =============================================================================
import type { Game } from './state';
import { seasonStartYear } from '../data/timeline';
import { hashStr, mulberry32 } from '../engine/leagues';
import {
  CONTINENTS, CONTINENT_KEYS, CT_BY_CC, CT_COUNTRIES, ctClub, ctClubActive, ctConfOf, ctId, ctLeagueActive, ctSlots, ctStrength, cupEraOf,
  type ContinentKey, type CtCountry,
} from '../data/world/continents';
import { CT_STEER } from '../data/world/continents/intercontinental';

/** Kontinentalpokal eines Jahres (Name aus data/world/continents `cupEraOf`). `sc` = Finale aus Sicht des Siegers, `t` = Teilnehmer in Baumreihenfolge, `r` = Runden „h.a.hg.ag[.e]“ (Indizes in t, e: 1 n. V., 2 i. E. Heim, 3 i. E. Gast). */
export interface CtCupRecord { w: string; ru: string; sc: string; t?: string[]; r?: string[] }
export interface ContinentsState {
  v: 1;
  /** Zuletzt ausgespielter Kontinentalpokal (Jahr). */
  y: number;
  /** Platzierungen je Jahr: „bra:3.0.5.1|arg:…“ (Index der Vereine in den Daten, die ersten vier). */
  nat: Record<number, string>;
  cups: Record<number, Partial<Record<ContinentKey, CtCupRecord>>>;
}
type G = Game & { continents?: ContinentsState };

/** Baum-Details nur für die letzten Jahre (danach Sieger/Finale). */
const DETAIL_YEARS = 12;

export function continentsState(g: Game): ContinentsState | undefined { return (g as G).continents; }

// -----------------------------------------------------------------------------
// Stärke
// -----------------------------------------------------------------------------
const formOf = (id: string, year: number) => (mulberry32(hashStr(`ctf|${id}|${year}`))() - 0.5) * 4;

/** Stärke eines Kontinentalvereins im Jahr inkl. Saisonform (±2, fest). */
export function ctStrengthAt(id: string, year: number): number {
  const r = ctClub(id);
  return r ? ctStrength(r.club, year) + formOf(id, year) : 60;
}
/** Stärke für Auslosungen/Schnellsimulation (game/cupDraw.ts `clubStrength`). */
export function continentalStrength(g: Game, id: string): number {
  return ctStrengthAt(id, seasonStartYear(g.season));
}

// -----------------------------------------------------------------------------
// Meisterschaft je Land (gewichtete Ziehung)
// -----------------------------------------------------------------------------
function gauss(r: () => number): number { return Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r()); }

function rankCountry(c: CtCountry, year: number): number[] {
  const r = mulberry32(hashStr(`ctn|${c.cc}|${year}`));
  return c.clubs
    .map((cl, i) => ({ i, on: ctClubActive(cl, year), v: ctStrength(cl, year) + formOf(`w_ct_${c.cc}_${cl.key}`, year) + gauss(r) * 2.6 }))
    .filter((x) => x.on)
    .sort((a, b) => b.v - a.v)
    .slice(0, 4)
    .map((x) => x.i);
}

function playNational(st: ContinentsState, year: number): void {
  if (st.nat[year] != null) return;
  const parts: string[] = [];
  for (const c of CT_COUNTRIES) if (ctLeagueActive(c, year)) parts.push(`${c.cc}:${rankCountry(c, year).join('.')}`);
  st.nat[year] = parts.join('|');
}

/** Platzierung (Vereins-IDs, bis zu vier) eines Landes im Jahr; leer = keine Liga/kein Datum. */
export function nationalRanking(g: Game, cc: string, year: number): string[] {
  const s = continentsState(g)?.nat[year];
  if (!s) return [];
  const part = s.split('|').find((p) => p.startsWith(`${cc}:`));
  if (!part) return [];
  return part.slice(cc.length + 1).split('.').filter(Boolean).map((x) => ctId(cc, Number(x))).filter((x): x is string => !!x);
}
export const nationalChampion = (g: Game, cc: string, year: number): string | undefined => nationalRanking(g, cc, year)[0];

/** Jahre mit gespeicherter Meisterschaft (absteigend). */
export function nationalYears(g: Game): number[] {
  return Object.keys(continentsState(g)?.nat ?? {}).map(Number).sort((a, b) => b - a);
}

// -----------------------------------------------------------------------------
// Kontinentalpokal (schlanker K.-o.-Baum)
// -----------------------------------------------------------------------------
const pois = (l: number, r: () => number) => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= r(); } while (p > L && k < 12); return k - 1; };
/** Tore eines Spiels: Heimvorteil oder neutral (gleiches Poisson-Modell wie engine/world.ts `worldMatchGoals`). */
export function ctGoals(a: number, b: number, r: () => number, neutral: boolean, k = 0.55): [number, number] {
  // k = 0,55 wie `worldMatchGoals`; zwischen Kontinenten (Weltpokal/Klub-WM) steiler k = 0,7:
  // Klassenunterschiede entscheiden klarer (Außenseiter-Siege gegen Europa blieben selten).
  const d = (a - b) / 10;
  const base = neutral ? [1.25, 1.25] : [1.4, 1.05];
  return [pois(Math.min(4.5, Math.max(0.2, base[0] * Math.exp(d * k))), r), pois(Math.min(4, Math.max(0.15, base[1] * Math.exp(-d * k))), r)];
}

function steerBonus(g: Game): number { return CT_STEER[g.historyMode ?? 'off'] ?? 0; }

function fieldFor(g: Game, st: ContinentsState, k: ContinentKey, year: number, size: number): string[] {
  const steerId = CONTINENTS[k].winners[year];
  const ids: string[] = [];
  const countries = CT_COUNTRIES.filter((c) => ctConfOf(c, year) === k && ctSlots(c, year) > 0);
  for (const c of countries) ids.push(...nationalRanking(g, c.cc, year - 1).slice(0, ctSlots(c, year)));
  const holder = st.cups[year - 1]?.[k]?.w;
  if (holder && !ids.includes(holder) && ctClubActive(ctClub(holder)!.club, year)) ids.push(holder);
  // Historische Lenkung: der echte Sieger des Jahres ist dabei (statt des schwächsten seines Landes bzw. Feldes).
  if (steerBonus(g) > 0 && steerId && !ids.includes(steerId) && ctClub(steerId) && ctClubActive(ctClub(steerId)!.club, year)) {
    const cc = ctClub(steerId)!.cc;
    const same = ids.filter((id) => ctClub(id)?.cc === cc);
    const out = (same.length ? same : ids).reduce<string | null>((m, id) => (!m || ctStrengthAt(id, year) < ctStrengthAt(m, year) ? id : m), null);
    if (out && ids.length >= size) ids.splice(ids.indexOf(out), 1);
    ids.push(steerId);
  }
  // Je Land der Meister zuerst, dann nach Stärke auffüllen.
  const champs = new Set(countries.map((c) => nationalRanking(g, c.cc, year - 1)[0]).filter(Boolean));
  ids.sort((a, b) => Number(champs.has(b)) - Number(champs.has(a)) || ctStrengthAt(b, year) - ctStrengthAt(a, year));
  return ids.slice(0, size);
}

function playCup(g: Game, st: ContinentsState, k: ContinentKey, year: number): void {
  const era = cupEraOf(k, year);
  if (!era || st.cups[year]?.[k]) return;
  const r = mulberry32(hashStr(`ctc|${k}|${year}`));
  const field = fieldFor(g, st, k, year, era.size);
  if (field.length < 2) return;
  // Baum auf Zweierpotenz: die Stärksten haben Freilose (null), der Rest wird gelost.
  let n = 1; while (n < field.length) n *= 2;
  const byes = n - field.length;
  const rest = field.slice(byes);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const t = [...field.slice(0, byes), ...rest];
  const slots: (number | null)[] = [];
  for (let b = 0; b < byes; b++) slots.push(b, null);
  for (let i = byes; i < t.length; i++) slots.push(i);
  const steer = CONTINENTS[k].winners[year];
  const bonus = steerBonus(g);
  const str = (i: number) => ctStrengthAt(t[i], year) + (t[i] === steer ? bonus : 0);
  const rounds: string[] = [];
  let cur = slots;
  let finalScore = '';
  while (cur.length > 1) {
    const next: (number | null)[] = [];
    const ties: string[] = [];
    const isFinal = cur.length === 2;
    for (let i = 0; i < cur.length; i += 2) {
      const a = cur[i], b = cur[i + 1];
      if (a == null || b == null) { next.push(a ?? b); continue; }
      let ga: number, gb: number, e = 0;
      if (isFinal ? era.finalLegs === 2 : era.legs === 2) {
        const [h1, a1] = ctGoals(str(b), str(a), r, false); // Hinspiel beim zweiten, Rückspiel beim ersten
        const [h2, a2] = ctGoals(str(a), str(b), r, false);
        ga = a1 + h2; gb = h1 + a2;
      } else [ga, gb] = ctGoals(str(a), str(b), r, isFinal || era.legs === 1);
      let win = ga > gb ? a : gb > ga ? b : -1;
      if (win < 0) {
        const pa = 0.5 + (str(a) - str(b)) / 60;
        if (r() < 0.3) { e = 1; if (r() < pa) ga++; else gb++; win = ga > gb ? a : b; } else { win = r() < pa ? a : b; e = win === a ? 2 : 3; }
      }
      ties.push(`${a}.${b}.${ga}.${gb}${e ? `.${e}` : ''}`);
      if (isFinal) finalScore = `${win === a ? `${ga}:${gb}` : `${gb}:${ga}`}${e === 1 ? ' n.V.' : e > 1 ? ' i.E.' : ''}`;
      next.push(win);
    }
    rounds.push(ties.join(','));
    cur = next;
  }
  const w = t[cur[0]!];
  const last = rounds[rounds.length - 1].split('.').map(Number);
  const ru = t[last[0] === cur[0] ? last[1] : last[0]];
  (st.cups[year] ??= {})[k] = { w, ru, sc: finalScore, t, r: rounds };
}

/** Sieger des Kontinentalpokals (Spiel bzw. vor dem Spielstart die echten Sieger). */
export function continentalWinner(g: Game, k: ContinentKey, year: number): string | undefined {
  return continentsState(g)?.cups[year]?.[k]?.w;
}
export function continentalRecord(g: Game, k: ContinentKey, year: number): CtCupRecord | undefined {
  return continentsState(g)?.cups[year]?.[k];
}

/** Siegerliste eines Kontinents: gespielte Jahre, davor die echten Sieger (`pre`). */
export function continentalWinners(g: Game, k: ContinentKey): { year: number; w: string; ru?: string; sc?: string; pre?: boolean }[] {
  const st = continentsState(g);
  const out = new Map<number, { year: number; w: string; ru?: string; sc?: string; pre?: boolean }>();
  const first = st ? Math.min(...Object.keys(st.cups).map(Number), st.y + 1) : 9999;
  for (const [y, id] of Object.entries(CONTINENTS[k].winners)) if (Number(y) < first) out.set(Number(y), { year: Number(y), w: id, pre: true });
  for (const [y, c] of Object.entries(st?.cups ?? {})) { const x = c[k]; if (x) out.set(Number(y), { year: Number(y), w: x.w, ru: x.ru, sc: x.sc }); }
  return [...out.values()].sort((a, b) => b.year - a.year);
}

// -----------------------------------------------------------------------------
// Ablauf
// -----------------------------------------------------------------------------
/** Ein Jahr fortschreiben: Meisterschaft y−1, Kontinentalpokale y. */
function step(g: Game, st: ContinentsState, year: number): void {
  playNational(st, year - 2);
  playNational(st, year - 1);
  for (const k of CONTINENT_KEYS) playCup(g, st, k, year);
  st.y = year;
}

function prune(st: ContinentsState): void {
  // Ältere Meisterschaften: nur noch der Meister je Land.
  for (const y of Object.keys(st.nat).map(Number)) if (y < st.y - 20 && st.nat[y].includes('.')) st.nat[y] = st.nat[y].split('|').map((p) => p.split('.')[0]).join('|');
  for (const y of Object.keys(st.cups).map(Number)) {
    if (y > st.y - DETAIL_YEARS) continue;
    for (const rec of Object.values(st.cups[y])) if (rec) { delete rec.t; delete rec.r; }
  }
}

/**
 * Hintergrund bis zur Saison mit Startjahr `year` fortschreiben (Spielstart, Laden,
 * Saisonwechsel). Idempotent; alte Spielstände holen höchstens die laufende Saison nach.
 */
export function ensureContinents(g: Game, year = seasonStartYear(g.season)): ContinentsState {
  const gg = g as G;
  if (!gg.continents) gg.continents = { v: 1, y: year - 1, nat: {}, cups: {} };
  const st = gg.continents;
  for (let y = Math.max(st.y + 1, year - 3); y <= year; y++) step(g, st, y);
  prune(st);
  return st;
}

/** Länder eines Kontinents (Anzeige). */
export function countriesOf(k: ContinentKey, year: number): CtCountry[] {
  return CT_COUNTRIES.filter((c) => ctConfOf(c, year) === k);
}
export { CT_BY_CC };
