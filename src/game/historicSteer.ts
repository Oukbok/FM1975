// =============================================================================
// ENTWICKLUNG DER ANDEREN VEREINE — zufällig oder an der echten Geschichte orientiert
// -----------------------------------------------------------------------------
// Beim Spielstart wählbar (optionales Feld `game.historyMode`, alte Spielstände = Aus):
//   off     – alle Vereine entwickeln sich frei nach Erfolg, Geld und Zufall (wie bisher)
//   medium  – sanfte Lenkung in Richtung der historischen Zielkurve (data/historicStrength.ts)
//   strong  – deutliche Lenkung: die echten Großklubs landen meist oben
// Gelenkt werden nur KI-Vereine, nie der eigene Verein (auch nicht nach einem Wechsel –
// dann gilt die Kurve wieder für den verlassenen Verein). Es gibt keine Ergebnisvorgabe
// und keinen Eingriff in die Match-Engine; die Kurve wirkt über die vorhandenen Hebel:
//   • volle Vereine (deine Liga): Ruf und Marke (→ Zuschauer, Sponsoring, Star-Markt,
//     Spielerwünsche, Trainerwahl, Nachwuchs-Etat) und ein jährlicher Geldzufluss bzw.
//     -abfluss aus dem Umfeld (Gönner, Konzern, Investor bzw. Altlasten), der vor dem
//     KI-Haushalt gebucht wird und so in Transfers und Gehälter fließt;
//   • Sim-Vereine (übrige deutsche Ligen, DDR, Pool): Stärke Richtung Liga-Median ± Kurve;
//   • Auslandsvereine (engine/world.ts): natürliche Größe/Größe Richtung Kurve.
// Aufrufe aus game/season.ts (startNextSeason).
// =============================================================================
import { Game } from './state';
import { book } from '../engine/finances';
import { brandFromReputation, ensureBrand, isLeagueClub, lastRevenue } from '../engine/clubEconomy';
import { foreignFactor, germanFactor } from '../data/historicStrength';
import type { EuroClub } from '../data/europe';
import type { WorldState } from '../engine/world';

export type HistoryMode = 'off' | 'medium' | 'strong';

export const HISTORY_MODES: { id: HistoryMode; label: string; desc: string }[] = [
  { id: 'off', label: 'Aus', desc: 'Frei und zufällig – jeder Verein kann aufsteigen oder abstürzen.' },
  { id: 'medium', label: 'Mittel', desc: 'Leicht an der echten Geschichte orientiert, Überraschungen bleiben häufig.' },
  { id: 'strong', label: 'Stark', desc: 'Deutlich an der Geschichte orientiert: die echten Großklubs landen meist oben.' },
];

export const historyModeLabel = (m: HistoryMode | undefined) => HISTORY_MODES.find((x) => x.id === (m ?? 'off'))!.label;

interface Weights {
  /** Anteil des Wegs zum Ziel-Ruf je Saison. */
  rep: number;
  /** Anteil des Wegs zur Ziel-Marke je Saison. */
  brand: number;
  /** Geldzufluss je Saison als Anteil des Liga-Medianumsatzes je Faktorpunkt über 1 (unter 1 halb so stark). */
  money: number;
  /** Anteil des Wegs zur Zielstärke je Saison (Sim-Vereine). */
  sim: number;
  /** Stärkepunkte je Faktorpunkt über/unter dem Liga-Median (Sim-Vereine). */
  simK: number;
  /** Anteil des Wegs zur Zielgröße je Saison (Auslandsvereine). */
  world: number;
}

const WEIGHTS: Record<Exclude<HistoryMode, 'off'>, Weights> = {
  medium: { rep: 0.08, brand: 0.05, money: 0.3, sim: 0.2, simK: 30, world: 0.25 },
  strong: { rep: 0.4, brand: 0.15, money: 1.8, sim: 0.5, simK: 55, world: 0.6 },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function historyModeOf(g: Pick<Game, 'historyMode'>): HistoryMode {
  return g.historyMode ?? 'off';
}

function weightsOf(g: Game): Weights | null {
  const m = historyModeOf(g);
  return m === 'off' ? null : WEIGHTS[m];
}

/** Ziel-Ruf eines Vereins zum Faktor (1,0 → 68; 1,42 → 95; 0,8 → 55). */
export function targetReputation(f: number): number {
  return clamp(68 + (f - 1) * 65, 40, 97);
}

/**
 * Saisonende (nach dem Finanzabschluss mit Marke/Ruf): Ruf und Marke der vollen
 * KI-Vereine Richtung Kurve ziehen. `year` = Startjahr der neuen Saison.
 */
export function historicSeasonClose(g: Game, year: number): void {
  const w = weightsOf(g);
  if (!w) return;
  for (const c of Object.values(g.clubs)) {
    if (!isLeagueClub(c) || c.id === g.managedClubId) continue;
    const f = germanFactor(c.id, year);
    if (f == null) continue;
    const repT = targetReputation(f);
    c.reputation = Math.round(clamp((c.reputation ?? 60) + (repT - (c.reputation ?? 60)) * w.rep, 20, 99));
    const b = ensureBrand(c);
    const a = brandFromReputation(repT);
    b.regional = clamp(b.regional + (a.regional - b.regional) * w.brand, 0, 100);
    b.national = clamp(b.national + (a.national - b.national) * w.brand, 0, 100);
    b.international = clamp(b.international + (a.international - b.international) * w.brand, 0, 100);
  }
}

/**
 * Saisonstart (vor dem KI-Haushalt in openFinancialSeason): Geld aus dem Umfeld.
 * Historisch große Vereine bekommen einen Zufluss (Gönner, Konzern, Investor,
 * Vermarktungsvorsprung), abgestürzte einen Abfluss (Altlasten). Nominal gebucht.
 */
export function historicMoney(g: Game, year: number, date: string): void {
  const w = weightsOf(g);
  if (!w) return;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  // Bezug ist der Medianumsatz der Liga (nicht der eigene Umsatz): sonst würde der Zufluss
  // über den Umsatz des Vorjahres immer weiter wachsen.
  const league = Object.values(g.clubs).filter(isLeagueClub);
  const revs = league.map((c) => lastRevenue(c, year, tier)).sort((a, b) => a - b);
  const medRev = revs[revs.length >> 1] ?? 0;
  for (const c of league) {
    if (c.id === g.managedClubId) continue;
    const f = germanFactor(c.id, year);
    if (f == null || Math.abs(f - 1) < 0.02) continue;
    // Unter 1 halb so stark (Altlasten); ganz oben (ab 1,3) überproportional: Die Weltspitze
    // setzt sich auch finanziell von den übrigen Großklubs ab (Deloitte: Bayern ≈ 2× Dortmund).
    const share = (f - 1) * w.money * (f < 1 ? 0.5 : 1 + Math.max(0, f - 1.3) * 4);
    const amount = Math.round(medRev * share);
    if (!amount) continue;
    book(c.finances, date, amount, 'other', amount > 0 ? 'Umfeld: Gönner und Vermarktung' : 'Umfeld: Altlasten', false);
  }
}

/**
 * Sim-Vereine (alle deutschen Vereine außerhalb deiner Liga, DDR, Pool): Stärke
 * Richtung Median ihrer Liga plus/minus Kurve. Nach dem Ligenumbau aufrufen.
 */
export function historicSimClubs(g: Game, year: number): void {
  const w = weightsOf(g);
  if (!w) return;
  const byDiv: Record<string, number[]> = {};
  const key = (t: number, gr: unknown) => `${t}|${gr ?? ''}`;
  for (const s of Object.values(g.simClubs)) (byDiv[key(s.tier, s.group)] ??= []).push(s.strength);
  const median = (xs: number[]) => { const t = [...xs].sort((a, b) => a - b); return t[t.length >> 1] ?? 55; };
  const med: Record<string, number> = {};
  for (const [k, xs] of Object.entries(byDiv)) med[k] = median(xs);
  // Maßstab der höchsten Liga (West bzw. DDR-Oberliga): Großklubs gehören dorthin, auch
  // wenn sie gerade tiefer spielen. Spielt deine Liga oben, zählt die mittlere Kaderstärke.
  const topSim = (ddr: boolean) => Object.values(g.simClubs).filter((s) => (ddr ? s.tier === 101 : s.tier === 1)).map((s) => s.strength);
  const fullTop = g.leagues?.playerDivision?.tier === 1
    ? Object.values(g.clubs).filter((c) => isLeagueClub(c)).map((c) => {
      const o = c.playerIds.map((id) => g.players[id]?.overall ?? 50);
      return o.length ? o.reduce((a, b) => a + b, 0) / o.length : 60;
    })
    : [];
  const topWest = topSim(false).length ? median(topSim(false)) : fullTop.length ? median(fullTop) : null;
  const topDdr = topSim(true).length ? median(topSim(true)) : null;
  for (const s of Object.values(g.simClubs)) {
    if (s.id === g.managedClubId || s.tier >= 200) continue; // Länder Spiel für Spiel (game/fullCountries.ts)
    const f = germanFactor(s.canonicalId ?? s.id, year);
    if (f == null) continue;
    const top = s.tier > 100 ? topDdr : topWest;
    const base = f >= 1.05 && top != null ? Math.max(top, med[key(s.tier, s.group)]) : med[key(s.tier, s.group)];
    const target = base + (f - 1) * w.simK;
    s.strength = Math.round(clamp(s.strength + (target - s.strength) * w.sim, 38, 92));
  }
}

/** Auslandsvereine: Größe und natürliche Größe Richtung Kurve (vor advanceWorldSeason). */
export function historicWorld(g: Game, world: WorldState, euroClubs: Record<string, EuroClub>, year: number): void {
  const w = weightsOf(g);
  if (!w) return;
  for (const [id, m] of Object.entries(world.meta)) {
    const ec = euroClubs[id];
    if (!ec || id === g.managedClubId) continue;
    const f = foreignFactor(ec.country, ec.name, year);
    if (f == null) continue;
    // Größe 0,5 ≈ Mittelfeld der 1. Liga, 0,95 ≈ Spitzenklub (engine/world.ts).
    const t = clamp(0.5 + (f - 1) * 1.2, 0.1, 0.97);
    m.home = clamp(m.home + (t - m.home) * w.world, 0.1, 0.97);
    m.size = clamp(m.size + (t - m.size) * w.world * 0.6, 0, 1);
    // Großklubs: magere Jahre des Generationen-Zyklus abfedern (Geld kauft über Täler hinweg).
    if (f >= 1.15 && m.cycle < 0) m.cycle *= 1 - w.world * 0.6;
  }
}

/**
 * Auslandsvereine nach der Saison-Rechnung (nach advanceWorldSeason): Stärke um einen
 * kleinen Betrag Richtung Kurve verschieben. Weil engine/world.ts die Stärke jede Saison
 * zu 40 % zur Zielstärke zieht, pendelt sich der Vorsprung bei etwa dem 2,5-Fachen ein
 * (Stark: Faktor 1,4 ≈ +5 Punkte, Mittel ≈ +2).
 */
export function historicWorldAfter(g: Game, world: WorldState, euroClubs: Record<string, EuroClub>, year: number): void {
  const w = weightsOf(g);
  if (!w) return;
  for (const id of Object.keys(world.meta)) {
    const ec = euroClubs[id];
    if (!ec || id === g.managedClubId) continue;
    const f = foreignFactor(ec.country, ec.name, year);
    if (f == null || Math.abs(f - 1) < 0.05) continue;
    ec.strength = Math.round(clamp(ec.strength + (f - 1) * 8 * w.world, 40, 92));
  }
}

/** Alte Spielstände: kein Feld = Aus (nichts zu tun, nur Wert normalisieren). */
export function migrateHistoryMode(g: Game): void {
  if (g.historyMode && !['off', 'medium', 'strong'].includes(g.historyMode)) g.historyMode = 'off';
}
