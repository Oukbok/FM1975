// =============================================================================
// FÜNFJAHRESWERTUNG (Länderkoeffizient) – Anzeige ohne zweite Rechnung
// -----------------------------------------------------------------------------
// Liest nur, was der Europapokal ohnehin nutzt: Punkte je Saison und Land
// (`WorldCountry.coef`, `WorldState.germanCoef` = Heimatland, geschrieben in
// engine/world.ts `advanceWorldSeason` aus engine/worldEuro.ts `seasonEuroPoints` –
// Ø Punkte je Starter), Reihung `countryRanking` + `germanRank` und Startplätze nach
// Rang `accessSlots` (data/euroFormats.ts). Startplätze gelten für die FOLGESAISON:
// so rechnet der Saisonwechsel (engine/euro.ts: Rang und Plätze mit Jahr + 1). Für dein
// Land stehen sie damit fest; die übrigen Länder werden beim Saisonwechsel mit den
// Punkten der laufenden Saison neu gereiht. Genutzt in Statistiken › Ligensystem
// (Reiter Fünfjahreswertung, Pokale des Landes) und im Länderprofil (Übersicht).
// =============================================================================
import { COUNTRY_BY_CC, COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { accessSlots, euroCompName } from '../data/euroFormats';
import { seasonStartYear } from '../data/timeline';
import { coefSum, countryRanking, germanRank } from '../engine/world';
import { homeCountryOf, type Game } from './state';

export type CoefComp = 'ec' | 'cwc' | 'uefa';

export interface CoefRow {
  /** Länder-/Flaggen-Schlüssel (data/countryFlags.ts, z. B. „Deutschland“, „England“). */
  key: string;
  name: string;
  home: boolean;
  rank: number;
  /** Punkte der letzten fünf abgeschlossenen Saisons (älteste zuerst; null = keine Wertung). */
  seasons: (number | null)[];
  total: number;
  slots: Record<CoefComp, number>;
}

export interface CoefTable {
  /** Spalten: abgeschlossene Saisons („1985/86“ …), älteste zuerst. */
  seasons: string[];
  /** Saison, für die die Startplätze gelten. */
  next: string;
  /** Wettbewerbe der Folgesaison mit Namen der Epoche (nur solche mit Startplätzen). */
  comps: { id: CoefComp; name: string }[];
  /** Pokalsieger spielt in … (bis 1998 Pokal der Pokalsieger, danach im Europa-Pokal). */
  cupTo: CoefComp;
  rows: CoefRow[];
}

const N = 5;
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Fünfjahreswertung der laufenden Saison; null = keine Hintergrund-Welt. */
export function coefTable(g: Game): CoefTable | null {
  const w = g.world;
  if (!w) return null;
  const y = seasonStartYear(g.season);
  const next = y + 1;
  const seasons = Array.from({ length: N }, (_, i) => seasonLabelOf(y - N + i));
  const cols = (arr: number[]): (number | null)[] => seasons.map((_, i) => {
    const k = arr.length - (N - i);
    return k >= 0 ? arr[k] : null;
  });
  const list = countryRanking(w, next);
  const de = germanRank(w, next);
  const homeKey = COUNTRY_BY_CC[homeCountryOf(g)]?.key ?? 'Deutschland';
  const ordered: Omit<CoefRow, 'rank' | 'slots'>[] = list.map((c) => ({
    key: c.name, name: COUNTRY_BY_KEY[c.name]?.name ?? c.name,
    home: false, seasons: cols(c.coef), total: round2(coefSum(c.coef)),
  }));
  // Heimatland an seinem Rang wie im Saisonwechsel (germanRank; ohne Wertung Rang 2).
  ordered.splice(Math.min(de - 1, ordered.length), 0, {
    key: homeKey, name: COUNTRY_BY_CC[homeCountryOf(g)]?.name ?? homeKey, home: true,
    seasons: cols(w.germanCoef), total: round2(coefSum(w.germanCoef)),
  });
  const rows: CoefRow[] = ordered.map((r, i) => {
    const s = accessSlots(next, i + 1);
    return { ...r, rank: i + 1, slots: { ec: s.ec, cwc: s.cwc, uefa: s.uefa } };
  });
  // Reihenfolge der Epoche: bis 1998 Landesmeister, Pokalsieger, Europa-Pokal; danach Meisterliga, Kontinental-Liga, Europa-Trophäe.
  const comps = ((next <= 1998 ? ['ec', 'cwc', 'uefa'] : ['ec', 'uefa', 'cwc']) as CoefComp[])
    .filter((c) => rows.some((r) => r.slots[c] > 0))
    .map((id) => ({ id, name: euroCompName(id, next) }));
  return { seasons, next: seasonLabelOf(next), comps, cupTo: accessSlots(next, 1).cupTo === 'cwc' ? 'cwc' : 'uefa', rows };
}

/** Zeile eines Landes (Flaggen-Schlüssel) in der Wertung; null = nicht gewertet (DDR, ausgeschlossen, keine Welt). */
export function coefRowOf(t: CoefTable | null, key: string): CoefRow | null {
  return t?.rows.find((r) => r.key === key) ?? null;
}

/** Punkte für die Anzeige: „12,4“; null → „–“. */
export const fmtCoef = (v: number | null): string => (v == null ? '–' : v.toFixed(1).replace('.', ','));
