// =============================================================================
// FOOTBALL MANAGER 1980 — Europapokal-Engine (Vorbild Saison 1975/76)
// =============================================================================
// Drei parallele K.-o.-Wettbewerbe wie 1975:
//   • ec   — Europapokal der Landesmeister   (16 Teams, 1 dt. Meister)
//   • cwc  — Europapokal der Pokalsieger      (16 Teams, 1 dt. Pokalsieger)
//   • uefa — Europa-Pokal                       (32 Teams, 3 dt. via Liga 2..4)
//
// "Basic": EIN Spiel pro Runde (kein Hin/Rueck), Neuauslosung nach jeder Runde.
// Auslaendische Teilnehmer stammen fix aus `src/data/europe.ts` (leichte
// `EuroClub`-Eintraege, nur per Staerke simuliert). Nur wenn der Spielerverein
// gegen einen von ihnen antritt, wird zur Laufzeit EINMALIG ein voller Kader
// generiert (Lazy-Kader, siehe `buildEuroClubFull`).
//
// Wiederverwendung: `drawRound` (Auslosung) aus `cup.ts`, `simulateCupTie`
// (volle Match-Engine) fuer Spieler-Begegnungen; Staerke-Simulation analog
// `decidePlayoff`/`simMatchGoals` aus der Liga-Engine fuer den Rest.
// =============================================================================

import type { Club, Player, PointSystem, CupState, CupRound, CupTie, LeagueTable } from '../types';
import type { EuroClub, EuroCompId } from '../data/europe';
import { EURO_FIRST_SEASON_GERMAN } from '../data/europe';
import { drawRound, simulateCupTie } from './cup';
import { buildEuroClubFull } from '../data/generate';
import { mulberry32, hashStr, simMatchGoals } from './leagues';

// -----------------------------------------------------------------------------
// STRUKTURELLES SPIEL-INTERFACE
// -----------------------------------------------------------------------------
// Die `Game`-Schnittstelle aus App.tsx wird nicht exportiert (Zirkularimport).
// Wir definieren daher ein strukturelles Interface mit exakt den Feldern, die
// die Europapokal-Engine liest/schreibt. Das echte `Game` erfuellt es strukturell.
export interface EuroGameLike {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  euroClubs?: Record<string, EuroClub>;
  managedClubId: string;
  pointSystem: PointSystem;
  simClubs?: Record<string, { strength: number }>;
  table?: LeagueTable;
  cup?: CupState | null;
  calendar?: { seasonStartDate: string; currentDate: string };
  season?: string;
  injuriesEnabled?: boolean;
}

// -----------------------------------------------------------------------------
// KONSTANTEN JE WETTBEWERB
// -----------------------------------------------------------------------------

/** Rundennamen je Wettbewerb (Index 0 = erste Runde). */
export const EURO_ROUND_NAMES: Record<EuroCompId, string[]> = {
  ec: ['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
  cwc: ['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
  uefa: ['1. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
};

/**
 * Wunsch-Termine der Runden als Monat-Tag-Vorlage (Mittwoch-nahe englische
 * Wochen der Aera). `off` = Jahres-Offset zum Saisonstartjahr (0 = Herbst,
 * 1 = Fruehjahr). Kollisionen mit Liga-/Landespokal-Terminen werden beim
 * Terminieren durch Verschiebung um je einen Tag vermieden.
 */
const EURO_DATE_TEMPLATE: Record<EuroCompId, { md: string; off: number }[]> = {
  ec: [
    { md: '10-22', off: 0 }, // Achtelfinale
    { md: '03-03', off: 1 }, // Viertelfinale
    { md: '04-07', off: 1 }, // Halbfinale
    { md: '05-12', off: 1 }, // Finale
  ],
  cwc: [
    { md: '10-01', off: 0 }, // Achtelfinale
    { md: '03-17', off: 1 }, // Viertelfinale
    { md: '04-21', off: 1 }, // Halbfinale
    { md: '05-05', off: 1 }, // Finale
  ],
  uefa: [
    { md: '09-17', off: 0 }, // 1. Runde
    { md: '10-29', off: 0 }, // Achtelfinale
    { md: '03-10', off: 1 }, // Viertelfinale
    { md: '04-14', off: 1 }, // Halbfinale
    { md: '05-19', off: 1 }, // Finale
  ],
};

/** Preisgeld je gewonnener Begegnung (DM), Aera-gerecht. EC > CWC > Europa-Verband. */
export const EURO_PRIZE_BY_ROUND: Record<EuroCompId, number[]> = {
  ec: [50000, 100000, 200000, 400000],
  cwc: [40000, 80000, 160000, 320000],
  uefa: [20000, 40000, 80000, 160000, 320000],
};

// -----------------------------------------------------------------------------
// TERMIN-PLANUNG (kollisionsfrei zu Liga- und Landespokal-Terminen)
// -----------------------------------------------------------------------------

function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Bestimmt die Termine der Runden: jeder Termin liegt nach `earliest`, mit
 * Mindestabstand zur Vorrunde, und weicht belegten Terminen (Liga ∪ Landespokal)
 * per Verschiebung um je einen Tag aus.
 */
function scheduleRoundDates(
  earliest: string,
  avoidDates: Set<string>,
  preferred: string[],
): string[] {
  const out: string[] = [];
  let prev = earliest;
  for (let i = 0; i < preferred.length; i++) {
    let d = preferred[i];
    const minDate = addDays(prev, i === 0 ? 3 : 10);
    if (d < minDate) d = minDate;
    while (avoidDates.has(d) || d <= prev) d = addDays(d, 1);
    out.push(d);
    prev = d;
  }
  return out;
}

// -----------------------------------------------------------------------------
// STAERKE EINES TEILNEHMERS (fuer die reine Staerke-Simulation)
// -----------------------------------------------------------------------------
/** Staerke: auslaendisch = EuroClub.strength; deutsch = Kader-Schnitt/Ruf. */
function localStrength(g: EuroGameLike, id: string): number {
  const eu = g.euroClubs?.[id];
  if (eu) return eu.strength;
  const sc = g.simClubs?.[id];
  if (sc) return sc.strength;
  const c = g.clubs[id];
  if (c) {
    const ovs = c.playerIds.map((pid) => g.players[pid]?.overall ?? 50);
    return ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : c.reputation;
  }
  return 50;
}

// -----------------------------------------------------------------------------
// AUSLOSUNG (drawRound aus cup.ts wiederverwenden, IDs eindeutig praefixen)
// -----------------------------------------------------------------------------
/**
 * Lost eine Europapokal-Runde aus. Nutzt `drawRound` aus cup.ts und praefixt die
 * Begegnungs-IDs anschliessend eindeutig je Wettbewerb (`euro_<comp>_r<i>_t<j>`),
 * damit sich die Match-/Tie-IDs der drei Europapokale UND des Landespokals nicht
 * ueberschneiden (die Match-ID wird erst spaeter aus tie.id abgeleitet).
 */
export function drawEuroRound(
  cup: CupState,
  comp: EuroCompId,
  roundIndex: number,
  participantIds: string[],
  managedClubId: string,
): void {
  drawRound(cup, roundIndex, participantIds, managedClubId);
  const round = cup.rounds[roundIndex];
  if (!round) return;
  round.ties.forEach((t, i) => { t.id = `euro_${comp}_r${roundIndex}_t${i}`; });
}

// -----------------------------------------------------------------------------
// WETTBEWERB ANLEGEN
// -----------------------------------------------------------------------------
/**
 * Legt einen Europapokal-Wettbewerb an: Teilnehmerfeld (deutsche volle Clubs +
 * auslaendische eu_-IDs), Rundentermine (kollisionsfrei zu Liga ∪ Landespokal)
 * und die bereits ausgeloste erste Runde.
 *
 * @param comp          Wettbewerb ('ec' | 'cwc' | 'uefa')
 * @param germanIds     deutsche Starter (volle Club-IDs in g.clubs)
 * @param foreignIds    auslaendische Starter (eu_-IDs in g.euroClubs)
 * @param leagueDates   Liga-Spieltag-Daten (Kollisionsvermeidung)
 * @param cupDates      Landespokal-Termine (Kollisionsvermeidung)
 * @param seed          fester Seed fuer Reproduzierbarkeit
 * @param earliest      fruehestes zulaessiges Datum (Saisonstart bzw. akt. Datum)
 * @param managedClubId Verein des Nutzers (fuer involvesPlayerClub-Markierung)
 */
export function createEuroCup(
  comp: EuroCompId,
  germanIds: string[],
  foreignIds: string[],
  leagueDates: Set<string>,
  cupDates: Set<string>,
  seed: number,
  earliest: string,
  managedClubId: string,
): CupState {
  const participantIds = [...germanIds, ...foreignIds];

  const earliestYear = Number(earliest.slice(0, 4));
  const seasonStartYear =
    Number(earliest.slice(5, 7)) >= 7 ? earliestYear : earliestYear - 1;

  const avoid = new Set<string>([...leagueDates, ...cupDates]);
  const preferred = EURO_DATE_TEMPLATE[comp].map(
    (t) => `${seasonStartYear + t.off}-${t.md}`,
  );
  const dates = scheduleRoundDates(earliest, avoid, preferred);

  const rounds: CupRound[] = EURO_ROUND_NAMES[comp].map((name, index) => ({
    index,
    name,
    date: dates[index],
    drawn: false,
    ties: [],
  }));

  const season = `${seasonStartYear}/${String((seasonStartYear + 1) % 100).padStart(2, '0')}`;

  const cup: CupState = {
    season,
    seed,
    participantIds,
    amateurClubIds: [],
    rounds,
    currentRoundIndex: 0,
    prizeByRound: [...EURO_PRIZE_BY_ROUND[comp]],
    winnerClubId: null,
  };

  drawEuroRound(cup, comp, 0, participantIds, managedClubId);
  return cup;
}

// -----------------------------------------------------------------------------
// DEUTSCHE QUALIFIKANTEN AUS DER VORSAISON ERMITTELN
// -----------------------------------------------------------------------------
/**
 * Ermittelt die deutschen Starter je Wettbewerb.
 * - `firstSeason` (1975/76): feste historische Starter aus `EURO_FIRST_SEASON_GERMAN`.
 * - sonst dynamisch aus der Endtabelle der Vorsaison + Landespokalsieger:
 *   ec   = Meister (Platz 1)
 *   cwc  = Landespokalsieger; ist er = Meister -> Pokalfinalist (Finalverlierer);
 *          sonst -> Vizemeister
 *   uefa = naechste 3 Ligaplaetze ab Platz 2, ohne bereits qualifizierte Vereine
 *          (kaskadiert nach unten bis genau 3 feststehen)
 */
export function computeGermanEuroQualifiers(
  g: EuroGameLike,
  firstSeason: boolean,
): Record<EuroCompId, string[]> {
  if (firstSeason) {
    return {
      ec: [...EURO_FIRST_SEASON_GERMAN.ec],
      cwc: [...EURO_FIRST_SEASON_GERMAN.cwc],
      uefa: [...EURO_FIRST_SEASON_GERMAN.uefa],
    };
  }

  const rows = g.table?.rows ?? [];
  const order = rows.map((r) => r.clubId);
  const champion = order[0];

  const ec: string[] = champion ? [champion] : [];

  // CWC: Landespokalsieger, sonst Finalist, sonst Vizemeister.
  let cwcId: string | null = g.cup?.winnerClubId ?? null;
  if (!cwcId || cwcId === champion) {
    // Pokalfinalist (Verlierer des Finales) ermitteln.
    const rounds = g.cup?.rounds ?? [];
    const finalRound = rounds[rounds.length - 1];
    const finalTie = finalRound?.ties[0];
    let finalist: string | null = null;
    if (finalTie && finalTie.winnerClubId) {
      finalist = finalTie.winnerClubId === finalTie.homeClubId
        ? finalTie.awayClubId
        : finalTie.homeClubId;
    }
    if (finalist && finalist !== champion) {
      cwcId = finalist;
    } else {
      // Vizemeister als letzte Rueckfallebene.
      cwcId = order[1] ?? null;
    }
  }
  const cwc: string[] = cwcId ? [cwcId] : [];

  // Europa-Verband: naechste 3 Ligaplaetze ab Platz 2, Doppel-Qualifikation ausschliessen.
  const taken = new Set<string>([...ec, ...cwc]);
  const uefa: string[] = [];
  for (let i = 1; i < order.length && uefa.length < 3; i++) {
    const id = order[i];
    if (taken.has(id)) continue;
    uefa.push(id);
    taken.add(id);
  }

  return { ec, cwc, uefa };
}

// -----------------------------------------------------------------------------
// SIMULATION EINER BEGEGNUNG
// -----------------------------------------------------------------------------
/**
 * Simuliert eine einzelne Europapokal-Begegnung.
 * - Ist der Spielerverein beteiligt -> VOLLE Match-Engine (`simulateCupTie`).
 *   Ist der Gegner ein auslaendischer eu_-Verein, wird EINMALIG ein voller
 *   Kader generiert (`buildEuroClubFull`) und zu g.clubs/g.players ergaenzt.
 * - Sonst -> reine, deterministische Staerke-Simulation (mulberry32-Seed aus
 *   tie.id). Kein Match-Objekt; setzt homeGoals/awayGoals/decision/penalties/
 *   winnerClubId/played.
 */
export function simulateEuroTie(
  g: EuroGameLike,
  cup: CupState,
  tie: CupTie,
  seed: number,
): void {
  const mid = g.managedClubId;
  const involvesPlayer = tie.homeClubId === mid || tie.awayClubId === mid;

  if (involvesPlayer) {
    // Auslaendischen Gegner bei Bedarf einmalig als vollen Club materialisieren.
    const oppId = tie.homeClubId === mid ? tie.awayClubId : tie.homeClubId;
    if (!g.clubs[oppId]) {
      const euro = g.euroClubs?.[oppId];
      if (euro) {
        g.clubs[oppId] = buildEuroClubFull(
          euro,
          g.calendar?.seasonStartDate ?? '',
          g.players,
        );
      }
    }
    if (g.clubs[tie.homeClubId] && g.clubs[tie.awayClubId]) {
      simulateCupTie(tie, g.clubs, g.players, g.pointSystem, cup.seed, {
        competition: 'Europapokal', logClubIds: g.managedClubId ? [g.managedClubId] : undefined, applyInjuries: g.injuriesEnabled,
      });
      return;
    }
    // Fallback (sollte nicht eintreten): auf Staerke-Simulation ausweichen.
  }

  // --- Reine Staerke-Simulation (deterministisch) ---
  const rnd = mulberry32(hashStr(`euro:${seed}:${cup.seed}:${tie.id}`));
  const homeStr = localStrength(g, tie.homeClubId);
  const awayStr = localStrength(g, tie.awayClubId);
  const base = simMatchGoals(homeStr, awayStr, rnd);
  let hg = base.home;
  let ag = base.away;
  let decision: 'regular' | 'aet' | 'penalties' = 'regular';
  let penalties: { home: number; away: number } | null = null;
  let winnerClubId: string;

  if (hg === ag) {
    // Verlaengerung: ein zusaetzlicher Tor-Durchgang; sonst Elfmeterschiessen.
    const extra = simMatchGoals(homeStr, awayStr, rnd);
    if (extra.home !== extra.away) {
      decision = 'aet';
      if (extra.home > extra.away) { hg += 1; winnerClubId = tie.homeClubId; }
      else { ag += 1; winnerClubId = tie.awayClubId; }
    } else {
      decision = 'penalties';
      const ph = 3 + Math.floor(rnd() * 3); // 3..5
      let pa = 3 + Math.floor(rnd() * 3);
      if (ph === pa) pa = ph >= 5 ? 4 : ph + 1; // kein Elfmeter-Remis
      penalties = { home: ph, away: pa };
      winnerClubId = ph > pa ? tie.homeClubId : tie.awayClubId;
    }
  } else {
    winnerClubId = hg > ag ? tie.homeClubId : tie.awayClubId;
  }

  tie.match = null;
  tie.homeGoals = hg;
  tie.awayGoals = ag;
  tie.decision = decision;
  tie.penalties = penalties;
  tie.winnerClubId = winnerClubId;
  tie.played = true;
}

// -----------------------------------------------------------------------------
// HILFSFUNKTION FUER DIE UI / STEUERUNG
// -----------------------------------------------------------------------------
/** Findet die aktuelle/naechste ungespielte Begegnung des Nutzervereins. */
export function nextPlayerEuroTie(cup: CupState, managedClubId: string): CupTie | null {
  for (const round of cup.rounds) {
    for (const t of round.ties) {
      if (!t.played && (t.homeClubId === managedClubId || t.awayClubId === managedClubId)) {
        return t;
      }
    }
  }
  return null;
}
