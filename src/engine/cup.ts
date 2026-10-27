// =============================================================================
// FOOTBALL MANAGER 1980 — DFB-Pokal-Engine (K.-o.-Wettbewerb)
// =============================================================================
// Der DFB-Pokal läuft parallel zur Bundesliga-Saison 1980/81 als reiner
// K.-o.-Wettbewerb mit 32 Teilnehmern (18 Bundesligisten + 14 Amateurvereine).
//
// Format:
//   • 5 Runden: 1. Hauptrunde → Achtelfinale → Viertelfinale → Halbfinale → Finale
//   • Single-Leg: ein Spiel entscheidet, bei Gleichstand Verlängerung, dann Elfmeter
//   • Neuauslosung nach jeder Runde (deterministisch/seedbasiert, reproduzierbar)
//   • Der zuerst gezogene Verein hat Heimrecht
//
// Determinismus: Alle Auslosungen und Spielsimulationen leiten ihren Seed aus
// dem festen Pokal-Seed ab → jeder Spielstart erzeugt denselben Wettbewerb.
// =============================================================================

import type { Club, Player, PointSystem, CupState, CupRound, CupTie, Match } from '../types';
import { MatchEngine } from './match';

// -----------------------------------------------------------------------------
// KONSTANTEN
// -----------------------------------------------------------------------------

/** Namen der fünf Pokalrunden (Index 0 = 1. Hauptrunde). */
export const ROUND_NAMES = [
  '1. Hauptrunde',
  'Achtelfinale',
  'Viertelfinale',
  'Halbfinale',
  'Finale',
] as const;

/** Preisgeld pro Runde in DM (pro gewonnener Begegnung), Ära-gerecht 1980/81. */
export const PRIZE_BY_ROUND = [25000, 50000, 100000, 200000, 400000];

/**
 * Wunsch-Termine der Runden als Monat-Tag-Vorlage (Mittwoch-nah, Englische
 * Wochen der Ära). Das konkrete Jahr wird pro Saison aus dem Saisonstartjahr
 * abgeleitet (siehe `preferredDatesForYear`) – so passen die Pokaltermine
 * unabhängig vom Startjahr (1975, 1976, …) immer zur laufenden Saison.
 * `yearOffset` = 0 → Startjahr (Hinrunde), 1 → Folgejahr (Rückrunde).
 */
const PREFERRED_DATE_TEMPLATE: { md: string; yearOffset: number }[] = [
  { md: '09-24', yearOffset: 0 }, // 1. Hauptrunde
  { md: '11-05', yearOffset: 0 }, // Achtelfinale
  { md: '12-17', yearOffset: 0 }, // Viertelfinale (vor der Winterpause 21.12.)
  { md: '04-01', yearOffset: 1 }, // Halbfinale
  { md: '06-20', yearOffset: 1 }, // Finale (vor Saisonende 30.06.)
];

/** Baut die konkreten Wunsch-Termine für ein Saisonstartjahr (z. B. 1975). */
function preferredDatesForYear(startYear: number): string[] {
  return PREFERRED_DATE_TEMPLATE.map(
    (t) => `${startYear + t.yearOffset}-${t.md}`,
  );
}

// -----------------------------------------------------------------------------
// DETERMINISTISCHER PRNG (inline, um keine geteilte Util einzuführen)
// -----------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministische Fisher-Yates-Mischung anhand eines Seeds. */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed >>> 0);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// -----------------------------------------------------------------------------
// TERMIN-PLANUNG (Kollisionsfrei zu Liga-Spieltagen)
// -----------------------------------------------------------------------------

function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Bestimmt die Termine der fünf Runden. Jeder Termin liegt nach `earliest`,
 * mit Mindestabstand zur Vorrunde, und weicht Liga-Spieltagen (leagueDates)
 * per Verschiebung um je einen Tag aus.
 */
function scheduleRoundDates(
  earliest: string,
  leagueDates: Set<string>,
  preferred: string[],
): string[] {
  const out: string[] = [];
  let prev = earliest;
  for (let i = 0; i < preferred.length; i++) {
    let d = preferred[i];
    const minDate = addDays(prev, i === 0 ? 3 : 10);
    if (d < minDate) d = minDate;
    // Kollision mit Liga-Spieltag oder zu dicht an der Vorrunde → +1 Tag
    while (leagueDates.has(d) || d <= prev) d = addDays(d, 1);
    out.push(d);
    prev = d;
  }
  return out;
}

// -----------------------------------------------------------------------------
// AUSLOSUNG
// -----------------------------------------------------------------------------

/**
 * Lost eine Runde aus: mischt die Teilnehmer deterministisch und paart sie
 * fortlaufend (0 vs 1, 2 vs 3, ...). Der zuerst gezogene Verein hat Heimrecht.
 * Mutiert die betreffende Runde in `cup`.
 */
export function drawRound(
  cup: CupState,
  roundIndex: number,
  participantIds: string[],
  managedClubId: string,
): void {
  const round = cup.rounds[roundIndex];
  if (!round) return;
  const drawSeed = hashString(`${cup.seed}:draw:${roundIndex}`);
  const shuffled = seededShuffle(participantIds, drawSeed);

  const ties: CupTie[] = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const homeClubId = shuffled[i];
    const awayClubId = shuffled[i + 1];
    ties.push({
      id: `cup_r${roundIndex}_t${i / 2}`,
      round: roundIndex,
      homeClubId,
      awayClubId,
      date: round.date,
      played: false,
      involvesPlayerClub: homeClubId === managedClubId || awayClubId === managedClubId,
      match: null,
      homeGoals: null,
      awayGoals: null,
      decision: null,
      penalties: null,
      winnerClubId: null,
    });
  }
  round.ties = ties;
  round.drawn = true;
}

// -----------------------------------------------------------------------------
// POKAL ANLEGEN
// -----------------------------------------------------------------------------

/**
 * Legt den kompletten DFB-Pokal an: Teilnehmerfeld, Rundentermine und die
 * bereits ausgeloste 1. Hauptrunde.
 *
 * @param blClubIds       IDs der 18 Bundesligisten
 * @param amateurClubIds  IDs der generierten Amateurvereine (für 32er-Feld)
 * @param leagueDates     Menge aller Liga-Spieltag-Daten (Kollisionsvermeidung)
 * @param seed            fester Seed für Reproduzierbarkeit
 * @param earliest        frühestes zulässiges Datum (Saisonstart bzw. akt. Datum)
 * @param managedClubId   Verein des Nutzers (für involvesPlayerClub-Markierung)
 */
export function createCup(
  blClubIds: string[],
  amateurClubIds: string[],
  leagueDates: Set<string>,
  seed: number,
  earliest: string,
  managedClubId: string,
): CupState {
  const participantIds = [...blClubIds, ...amateurClubIds];

  // Saison-Startjahr aus `earliest` ableiten: Jul–Dez → laufendes Jahr,
  // Jan–Jun → Vorjahr (die Saison begann im Herbst davor). Daraus werden die
  // ära-gerechten Rundentermine gebaut, damit der Pokal unabhängig vom
  // Startjahr (1975, 1976, …) immer zur aktuellen Saison passt.
  const earliestYear = Number(earliest.slice(0, 4));
  const seasonStartYear =
    Number(earliest.slice(5, 7)) >= 7 ? earliestYear : earliestYear - 1;

  const dates = scheduleRoundDates(
    earliest,
    leagueDates,
    preferredDatesForYear(seasonStartYear),
  );

  const rounds: CupRound[] = ROUND_NAMES.map((name, index) => ({
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
    amateurClubIds,
    rounds,
    currentRoundIndex: 0,
    prizeByRound: [...PRIZE_BY_ROUND],
    winnerClubId: null,
  };

  drawRound(cup, 0, participantIds, managedClubId);
  return cup;
}

// -----------------------------------------------------------------------------
// SPIEL-SIMULATION EINER BEGEGNUNG
// -----------------------------------------------------------------------------

/**
 * Simuliert eine einzelne Pokalbegegnung (inkl. evtl. Verlängerung/Elfmeter),
 * schreibt Ergebnis, Entscheidung, Match-Objekt und Sieger in die Begegnung.
 * Die Spieler-Statistiken werden von der Match-Engine automatisch fortgeschrieben.
 */
export function simulateCupTie(
  tie: CupTie,
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  pointSystem: PointSystem,
  cupSeed: number,
): void {
  const home = clubs[tie.homeClubId];
  const away = clubs[tie.awayClubId];
  if (!home || !away) return;

  const engine = new MatchEngine(home, away, players, pointSystem, {
    seed: hashString(`${cupSeed}:${tie.id}`),
  });
  const { result, events, decision, penalties, homeWins } = engine.simulateCup();

  const match: Match = {
    id: tie.id,
    matchday: tie.round + 1,
    date: tie.date,
    homeClubId: tie.homeClubId,
    awayClubId: tie.awayClubId,
    status: 'finished',
    result,
    events,
    involvesPlayerClub: tie.involvesPlayerClub,
  };

  tie.match = match;
  tie.homeGoals = result.homeGoals;
  tie.awayGoals = result.awayGoals;
  tie.decision = decision;
  tie.penalties = penalties;
  tie.winnerClubId = homeWins ? tie.homeClubId : tie.awayClubId;
  tie.played = true;
}

// -----------------------------------------------------------------------------
// HILFSFUNKTIONEN FÜR DIE UI / STEUERUNG
// -----------------------------------------------------------------------------

/** Kurzbezeichnung der Entscheidung für die Anzeige (n.V. / i.E.). */
export function decisionBadge(tie: CupTie): string {
  if (tie.decision === 'penalties') return 'i.E.';
  if (tie.decision === 'aet') return 'n.V.';
  return '';
}

/** Liefert die Sieger-IDs einer bereits gespielten Runde (für die Neuauslosung). */
export function roundWinners(round: CupRound): string[] {
  return round.ties.map((t) => t.winnerClubId).filter((id): id is string => !!id);
}

/** Findet eine Begegnung anhand ihrer ID über alle Runden. */
export function findTie(cup: CupState, tieId: string): CupTie | null {
  for (const round of cup.rounds) {
    const t = round.ties.find((x) => x.id === tieId);
    if (t) return t;
  }
  return null;
}

/** Findet die aktuelle/nächste Begegnung des Nutzervereins (ungespielt). */
export function nextPlayerTie(cup: CupState, managedClubId: string): CupTie | null {
  for (const round of cup.rounds) {
    for (const t of round.ties) {
      if (!t.played && (t.homeClubId === managedClubId || t.awayClubId === managedClubId)) {
        return t;
      }
    }
  }
  return null;
}
