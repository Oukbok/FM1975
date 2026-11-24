// Europapokal-Seite der Hintergrund-Welt (engine/world.ts): Koeffizienten, Länder-Rangliste,
// ausländische Starter der nächsten Saison.
import { EuroClub, EuroCompId, EURO_FOREIGN_COUNT } from '../data/europe';
import { EURO_EXCLUSIONS } from '../data/worldSeed';
import { CupState } from '../types';
import { accessSlots, euroFormat } from '../data/euroFormats';
import { WorldCountry, WorldState } from './worldTypes';
import { countryLevel } from './worldCountries';

// -----------------------------------------------------------------------------
// Koeffizienten aus den Europapokal-Ergebnissen
// -----------------------------------------------------------------------------
export function seasonEuroPoints(cups: Record<EuroCompId, CupState | null> | undefined): Record<string, number> {
  const pts: Record<string, number> = {};
  if (!cups) return pts;
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const cup = cups[comp];
    if (!cup) continue;
    for (const id of cup.participantIds) pts[id] = (pts[id] ?? 0) + 1;
    for (const round of cup.rounds) {
      for (const t of round.ties) if (t.winnerClubId) pts[t.winnerClubId] = (pts[t.winnerClubId] ?? 0) + 2;
      // Europapokal 2.0: Gruppen-/Ligaspiele – Sieg 1, Remis 0,5 (zwei Spiele ≈ eine K.-o.-Runde).
      for (const gr of round.groups ?? []) {
        for (const m of gr.matches) {
          if (m.hg == null || m.ag == null) continue;
          if (m.hg > m.ag) pts[m.home] = (pts[m.home] ?? 0) + 1;
          else if (m.ag > m.hg) pts[m.away] = (pts[m.away] ?? 0) + 1;
          else { pts[m.home] = (pts[m.home] ?? 0) + 0.5; pts[m.away] = (pts[m.away] ?? 0) + 0.5; }
        }
      }
    }
    if (cup.winnerClubId) pts[cup.winnerClubId] = (pts[cup.winnerClubId] ?? 0) + 2;
  }
  return pts;
}

export function pushCoef(arr: number[], v: number): void {
  arr.push(Math.round(v * 100) / 100);
  while (arr.length > 5) arr.shift();
}
export const coefSum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

/** Rangliste der Länder nach 5-Jahres-Koeffizient (ohne Deutschland). */
export function countryRanking(w: WorldState, year: number): WorldCountry[] {
  return Object.values(w.countries)
    .filter((c) => c.active && !EURO_EXCLUSIONS.some((e) => e.country === c.name && year >= e.from && year <= e.to))
    .sort((a, b) => coefSum(b.coef) - coefSum(a.coef) || countryLevel(b, year) - countryLevel(a, year));
}

/** Rang Deutschlands in der Fünfjahreswertung (1 = bestes Land); ohne Wertung Rang 2. */
export function germanRank(w: WorldState | undefined | null, year: number): number {
  if (!w || !w.germanCoef.length) return 2;
  const de = coefSum(w.germanCoef);
  return 1 + countryRanking(w, year).filter((c) => coefSum(c.coef) > de).length;
}

/**
 * Ausländische Starter: Meister der 15 bestplatzierten Länder (Landesmeister),
 * Pokalsieger der 15 bestplatzierten (bzw. Finalgegner-Ersatz: nächster der Tabelle),
 * Europa-Pokal: 29 Plätze nach Koeffizienten-Rang (3/2/1 Starter je Land).
 */
export function euroParticipants(w: WorldState, euroClubs: Record<string, EuroClub>, year: number): Record<EuroCompId, string[]> {
  const rank = countryRanking(w, year);
  const out: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  const taken = new Set<string>();
  const nextFromTable = (c: WorldCountry) => c.lastTable.find((id) => !taken.has(id) && euroClubs[id] && w.meta[id]);
  // Kapazität je Wettbewerb = Feldgröße des Formats der Saison (data/euroFormats.ts); die
  // deutschen Starter kommen beim Aufbau dazu, überzählige Ausländer fallen dort weg.
  const cap = (comp: EuroCompId) => euroFormat(comp, year)?.field ?? (year < 1999 || comp !== 'cwc' ? EURO_FOREIGN_COUNT[comp] : 0);
  const de = germanRank(w, year);
  // Rang eines Auslands-Landes in der Gesamtwertung (Deutschland mitgezählt).
  const rankOf = (i: number) => (i + 1 >= de ? i + 2 : i + 1);

  // Meisterliga: Meister, ab 1997 nach Rang auch Zweite/Dritte/Vierte.
  for (let pass = 0; pass < 4 && out.ec.length < cap('ec'); pass++) {
    rank.forEach((c, i) => {
      if (out.ec.length >= cap('ec') || accessSlots(year, rankOf(i)).ec <= pass) return;
      const id = pass === 0 && c.lastChampion && w.meta[c.lastChampion] && !taken.has(c.lastChampion) ? c.lastChampion : nextFromTable(c);
      if (id) { out.ec.push(id); taken.add(id); }
    });
  }
  // Pokalsieger-Wettbewerb (bis 1998) bzw. Europa-Trophäe (ab 2021).
  if (cap('cwc') > 0) {
    // Europa-Trophäe: mehrere Durchgänge (je Land ein weiterer Verein), damit das Feld aus
    // vielen Ländern kommt wie im Vorbild.
    for (let pass = 0; pass < (year <= 1998 ? 1 : 4) && out.cwc.length < cap('cwc'); pass++) {
      for (const c of rank) {
        if (out.cwc.length >= cap('cwc')) break;
        let id = year <= 1998 && c.lastCupWinner && w.meta[c.lastCupWinner] && !taken.has(c.lastCupWinner) ? c.lastCupWinner : undefined;
        if (!id) id = nextFromTable(c);
        if (id) { out.cwc.push(id); taken.add(id); }
      }
    }
  }
  // Europa-Pokal: ab 1999 zuerst die Pokalsieger, dann Plätze nach Rang, Rest auffüllen.
  if (year >= 1999) {
    for (const c of rank) {
      if (out.uefa.length >= cap('uefa')) break;
      if (c.lastCupWinner && w.meta[c.lastCupWinner] && !taken.has(c.lastCupWinner)) { out.uefa.push(c.lastCupWinner); taken.add(c.lastCupWinner); }
    }
  }
  let round = 0;
  while (out.uefa.length < cap('uefa') && round < 8) {
    rank.forEach((c, i) => {
      if (out.uefa.length >= cap('uefa')) return;
      const want = round === 0 ? accessSlots(year, rankOf(i)).uefa - (year >= 1999 ? 1 : 0) : 1;
      for (let k = 0; k < want && out.uefa.length < cap('uefa'); k++) {
        const id = nextFromTable(c);
        if (id) { out.uefa.push(id); taken.add(id); }
      }
    });
    round++;
  }
  // Für die Simulation im Pokal wird `comp` mitgeführt (nur informativ).
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) for (const id of out[comp]) euroClubs[id].comp = comp;
  return out;
}
