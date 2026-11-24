// =============================================================================
// POKALE DES LANDES (Statistiken › Ligensystem, Spalte neben der Pyramide)
// -----------------------------------------------------------------------------
// Nur gelesen, nichts gespeichert: Landespokal (Heimat: `g.cup`, Ausland: laufender
// Landespokal der Welt `world.live.cups` aus game/worldCups.ts), Gipfelpokal bzw.
// Auftaktpokal (data/superCups.ts + Archiv game/superCupGame.ts), Junioren-Pokal
// (Heimat Deutschland, game/youthComps). Sieger früherer Saisons aus denselben Listen
// wie das Länderprofil (`countryHolders`). Trophäe je Pokal über `shapeOf`
// (game/trophyCabinet.ts) – dieselbe Zuordnung wie die Vitrine.
// =============================================================================
import { accessSlots, euroCompName } from '../data/euroFormats';
import { superEra, type SuperEra } from '../data/superCups';
import { seasonStartYear } from '../data/timeline';
import { COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { compLabel, pokalFormat } from '../data/youthCompetitions';
import { countryHolders, countryRef } from './countryProfile';
import { superCupState } from './superCupGame';
import { shapeOf, type TrophyShape } from './trophyCabinet';
import { leanCupRounds, leanCupRoundsN, leanCupWinner } from './worldCups';
import { youthCompsOf } from './youthComps/daily';
import { homeCountryKey, type Game } from './state';
import type { PyramidSide } from './leaguePyramid';

export interface CountryCup {
  key: 'cup' | 'super' | 'youth';
  name: string;
  shape: TrophyShape;
  /** Teilnehmer/Format kurz, z. B. „64 Vereine · 6 Runden · K.-o.“. */
  format: string;
  /** Stand der laufenden Saison, z. B. „Viertelfinale“ / „Sieger steht fest“. */
  state?: string;
  /** Sieger (Vereins-ID) mit Saison: laufende Saison, sonst die letzte bekannte. */
  holder?: { id: string; season: string; current: boolean };
  /** Zusatz, z. B. „Sieger spielt im Pokal der Pokalsieger“. */
  note?: string;
}

const SUPER_FORMAT: Record<SuperEra['format'], string> = {
  final: 'Meister gegen Pokalsieger · ein Spiel',
  legs2: 'Meister gegen Pokalsieger · Hin- und Rückspiel',
  four: 'Vier Vereine · Halbfinale und Finale',
  six: 'Sechs Vereine · K.-o.-Runden im Juli',
};

/** „im Pokal der Pokalsieger“, „in der Kontinental-Liga“, „in der Europa-Trophäe“. */
const inComp = (name: string) => (/(Liga|Trophäe)$/.test(name) ? `in der ${name}` : `im ${name}`);

/** Länder-Schlüssel der Auswahl im Ligensystem. */
export function pickCountryKey(g: Game, side: PyramidSide, country: string): string {
  return side === 'west' ? homeCountryKey(g) : side === 'ddr' ? 'DDR' : country;
}

/**
 * Pokale eines Landes für die Saison `season` (laufend bzw. letzte Saison eines früheren Zeitraums).
 * `live` = laufende Saison (Stand und Teilnehmer aus dem Spielstand).
 */
export function countryCups(g: Game, side: PyramidSide, country: string, season: string, live: boolean): CountryCup[] {
  const key = pickCountryKey(g, side, country);
  const y = seasonStartYear(season);
  const ref = countryRef(g, key === 'DDR' ? 'DDR' : key);
  const holders = countryHolders(g, ref);
  const lastHolder = (pick: (h: (typeof holders)[number]) => string | undefined): CountryCup['holder'] => {
    const h = holders.find((x) => seasonStartYear(x.season) <= y && pick(x));
    return h ? { id: pick(h)!, season: h.season, current: h.season === season } : undefined;
  };
  const out: CountryCup[] = [];

  // --- Landespokal ---
  const cupTo = accessSlots(y + 1, 1).cupTo;
  const cup: CountryCup = {
    key: 'cup', name: side === 'ddr' ? 'FDGB-Pokal' : 'Landespokal', shape: shapeOf('pokal', y),
    format: 'K.-o.-Runden · ein Spiel je Runde',
    holder: lastHolder((h) => h.cup),
    note: side === 'ddr' ? undefined : `Sieger spielt ${inComp(euroCompName(cupTo === 'cwc' ? 'cwc' : 'uefa', y + 1))}`,
  };
  const ownCup = live && ((side === 'west' && !g.ddrHome) || (side === 'ddr' && !!g.ddrHome)) ? g.cup : null;
  if (ownCup) {
    const n = ownCup.participantIds.length, r = ownCup.rounds.length;
    cup.format = `${n} Vereine · ${r} Runden · K.-o.`;
    const cur = ownCup.rounds[Math.min(ownCup.currentRoundIndex, r - 1)];
    cup.state = ownCup.winnerClubId ? 'Sieger steht fest' : cur ? `Läuft: ${cur.name}` : undefined;
    if (ownCup.winnerClubId) cup.holder = { id: ownCup.winnerClubId, season, current: true };
  } else if (live && side === 'abroad') {
    const lc = g.world?.live?.season === g.season ? g.world.live.cups?.[key] : undefined;
    if (lc) {
      const total = leanCupRoundsN(lc.ids.length);
      const played = leanCupRounds(key, season, lc).filter((x) => x.played);
      cup.format = `${lc.ids.length} Vereine · ${total} Runden · K.-o.`;
      const win = leanCupWinner(key, season, lc);
      cup.state = win ? 'Sieger steht fest' : played.length ? `${played.length} von ${total} Runden gespielt` : 'Noch keine Runde gespielt';
      if (win) cup.holder = { id: win, season, current: true };
    }
  }
  if (side !== 'abroad' || COUNTRY_BY_KEY[key]) out.push(cup);

  // --- Gipfelpokal / Auftaktpokal ---
  const era = superEra(key, y);
  if (era) {
    const arch = superCupState(g).archive.filter((a) => a.country === key && seasonStartYear(a.season) <= y)
      .sort((a, b) => b.season.localeCompare(a.season))[0];
    const ev = live ? superCupState(g).events.find((e) => e.key === 'home' && e.country === key && e.season === season) : undefined;
    out.push({
      key: 'super', name: era.name, shape: shapeOf(era.format === 'six' ? 'ligapokal' : 'super', y),
      format: SUPER_FORMAT[era.format],
      state: ev ? (ev.winner ? 'Sieger steht fest' : 'Vor dem Saisonstart') : undefined,
      holder: ev?.winner ? { id: ev.winner, season, current: true } : arch ? { id: arch.winner, season: arch.season, current: arch.season === season } : undefined,
      note: era.format === 'six' ? 'Meister, Pokalsieger und die nächsten der Tabelle' : `seit ${seasonLabelOf(era.from)}`,
    });
  }

  // --- Junioren-Pokal (nur Heimat Deutschland) ---
  const pf = side === 'west' && key === 'Deutschland' ? pokalFormat(y) : null;
  if (pf) {
    const st = youthCompsOf(g);
    const comp = live ? st?.comps.find((c) => c.key === 'pokal') : undefined;
    const teams = Number(pf.replace(/\D/g, '')) || 0;
    const winner = comp?.winner ?? undefined;
    const last = !winner && st?.lastWinners?.pokal ? st.lastWinners.pokal : undefined;
    out.push({
      key: 'youth', name: compLabel('pokal', y), shape: 'jugend',
      format: `${teams ? `${teams} A-Jugend-Teams · ` : ''}K.-o.`,
      state: comp ? (comp.done ? 'Sieger steht fest' : 'Läuft') : undefined,
      holder: winner ? { id: winner, season, current: true } : last ? { id: last, season: seasonLabelOf(y - 1), current: false } : undefined,
    });
  }
  return out;
}
