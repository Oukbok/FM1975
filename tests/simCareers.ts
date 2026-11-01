// =============================================================================
// Karriere-Auswertung für tests/sim.ts (TOP=1): verfolgt jeden Profi über die
// Saisons – Höchstwert, Alter beim Höchstwert, Alter beim ersten Wert ≥ 80/85 –
// und zählt Frühstars (≥ 85 mit ≤ 20) und Jahrhunderttalente (Spitze ≥ 93 und
// früh ≥ 85). Ausgabe je Jahrzehnt (Jahr des ersten Werts ≥ 85).
// =============================================================================
import type { Game } from '../src/game/state';
import type { Player } from '../src/types';

export interface Career {
  name: string; born: number; max: number; ageMax: number; first85?: { age: number; year: number }; first80Age?: number;
  lastAge: number; origin: string; l1Star: boolean; club: string;
}
export const careers = new Map<string, Career>();

/** Herkunft eines Spielers aus seiner ID (Start, Jugend, Nachrücker, KI-Ausland …). */
export function originOfPlayer(p: Player, startIds: Set<string>): string {
  return p.id.includes('_y_') ? 'Jugend' : /_r\d{4}_/.test(p.id) ? 'Nachrücker'
    : /_imp\d{4}_/.test(p.id) ? 'KI-Ausland' : /_uk\d{4}_/.test(p.id) ? 'KI-unten' : /_t\d{4}_/.test(p.id) ? 'Welt'
      : /_p\d+$/.test(p.id) ? (startIds.has(p.id) ? 'Start' : 'Aufsteiger') : 'sonst';
}

/** Am Saisonende aufrufen: alle Profis im Spiel auswerten. `l1` = Vereins-IDs der 1. Liga (falls Spielerliga). */
export function trackCareers(g: Game, startIds: Set<string>, l1: Set<string> | null): void {
  for (const p of Object.values(g.players)) {
    if (p.isYouth) continue;
    const born = Number((p.dateOfBirth ?? '1950').slice(0, 4));
    const c = careers.get(p.id) ?? { name: p.fullName, born, max: 0, ageMax: 0, lastAge: p.age, origin: originOfPlayer(p, startIds), l1Star: false, club: '' };
    // Verlauf (Bewertungsrunden) plus aktueller Wert; Alter je Eintrag aus dem Geburtsjahr.
    const pts = [...(p.development.abilityHistory ?? []).map((h) => ({ y: Number(h.date.slice(0, 4)), m: Number(h.date.slice(5, 7)), v: h.ability })),
      { y: Number(g.calendar.currentDate.slice(0, 4)), m: Number(g.calendar.currentDate.slice(5, 7)), v: p.overall }];
    for (const x of pts) {
      // Alter ≈ Kalenderjahr − Geburtsjahr (Geburtstag im Jahr vernachlässigt).
      const a = Math.max(15, Math.min(45, x.y - born));
      if (x.v > c.max) { c.max = x.v; c.ageMax = a; }
      if (x.v >= 85 && !c.first85) c.first85 = { age: a, year: x.y };
      if (x.v >= 80 && c.first80Age == null) c.first80Age = a;
    }
    c.lastAge = p.age;
    if (l1 && l1.has(p.clubId) && p.overall >= 85) c.l1Star = true;
    c.club = g.clubs[p.clubId]?.shortName ?? p.clubId;
    careers.set(p.id, c);
  }
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function careerSummary(): void {
  const all = [...careers.values()];
  for (const [a, b] of [[1975, 1985], [1985, 1995], [1995, 2005], [2005, 2015], [2015, 2030]]) {
    const st = all.filter((c) => c.first85 && c.first85.year >= a && c.first85.year < b);
    const early = st.filter((c) => c.first85!.age <= 20);
    const cent = early.filter((c) => c.max >= 93);
    console.log(`KARRIERE ${a}–${b - 1}: neu ≥85 ${st.length} (in Liga 1 ${st.filter((c) => c.l1Star).length}) | früh ≥85 mit ≤20: ${early.length} [${early.map((c) => `${c.name} ${c.max}@${c.ageMax} (${c.origin}, ${c.club})`).join('; ')}] | Jahrhunderttalente ${cent.length}`);
  }
  // Höhepunkt-Alter abgeschlossener Karrieren (zuletzt ≥ 31 gesehen).
  const done = all.filter((c) => c.lastAge >= 31);
  const band = (lo: number, hi: number) => done.filter((c) => c.max >= lo && c.max < hi);
  const line = (l: string, xs: Career[]) => `${l} n=${xs.length} Ø Höhepunkt mit ${avg(xs.map((c) => c.ageMax)).toFixed(1)} J.`;
  console.log(`KARRIERE Höhepunkt-Alter: ${line('70–79', band(70, 80))} | ${line('80–84', band(80, 85))} | ${line('85–89', band(85, 90))} | ${line('≥90', band(90, 100))}`);
  const st = done.filter((c) => c.max >= 85);
  console.log(`KARRIERE Weltklasse ab: Ø erstes ≥85 mit ${avg(st.filter((c) => c.first85).map((c) => c.first85!.age)).toFixed(1)} J., erstes ≥80 mit ${avg(st.filter((c) => c.first80Age != null).map((c) => c.first80Age!)).toFixed(1)} J. | Jahrhunderttalente gesamt ${all.filter((c) => c.max >= 93 && c.first85 && c.first85.age <= 20).length}, Spitze ≥93 gesamt ${all.filter((c) => c.max >= 93).length}`);
}
