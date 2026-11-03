// =============================================================================
// Europapokal 2.0 – Aufbau einer Saison: Format je Wettbewerb (data/euroFormats.ts),
// Teilnehmerfeld (deutsche Starter nach Startplätzen + Ausland aus engine/world.ts),
// Termine aller Spieltage (Hin-/Rückspiel, Gruppenspieltage) kollisionsfrei zu Liga und
// Landespokal, Kalender-Ereignisse je Spieltermin, erwartete Teilnehmerzahl je Runde
// (Weiterleitungen aus Gruppen und zwischen den Wettbewerben).
// Markierung `CupState.v2 = 1`: Wettbewerbe ohne Markierung (alte Spielstände) laufen
// bis Saisonende im alten Modus (ein Spiel je Runde) weiter.
// =============================================================================
import { EURO_FIRST_SEASON_GERMAN, type EuroClub, type EuroCompId } from '../data/europe';
import { accessSlots, euroCompName, euroFormat, type EuroFormat } from '../data/euroFormats';
import { seasonLabel } from '../engine/calendar';
import { MIN_GAP_DAYS, WANT_GAP_DAYS } from '../data/matchCalendarRules';
import { findSlot } from '../engine/fixtureRules';
import type { CupRound, CupState, GameCalendar, LeagueTable } from '../types';

export const EURO_COMPS: EuroCompId[] = ['ec', 'cwc', 'uefa'];

export function isV2(cup: CupState | null | undefined): cup is CupState {
  return !!cup && cup.v2 === 1;
}

/** Saison-Startjahr eines Wettbewerbs. */
export function cupStartYear(cup: CupState): number {
  return Number(cup.season.slice(0, 4));
}

// -----------------------------------------------------------------------------
// Termine
// -----------------------------------------------------------------------------
const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (iso: string) => new Date(iso + 'T00:00:00Z').getUTCDay();

/**
 * Wochentag-genaue Termine aller Spieltage eines Formats nach dem Rahmenterminkalender
 * (data/matchCalendarRules.ts): Spieltag der Woche laut Format (Mi bzw. Do), mindestens
 * drei Tage Abstand zu Liga-Hauptspieltagen (`avoid`; Donnerstag zwei Tage – die Teilnehmer
 * spielen danach sonntags, game/fixtureWatch.ts) und zu Landespokal-Terminen (`cupDates`),
 * notfalls zwei Tage; zwei Spieltage desselben Wettbewerbs mindestens drei Tage auseinander.
 */
export function scheduleFormat(fmt: EuroFormat, startYear: number, avoid: Set<string>, earliest: string, cupDates?: Set<string>): string[][] {
  let prev = addDays(earliest, -2);
  const league = [...avoid].filter((d) => !cupDates?.has(d));
  const cup = cupDates ? [...cupDates] : [];
  const leagueGap = fmt.weekday === 4 ? MIN_GAP_DAYS : WANT_GAP_DAYS;
  return fmt.stages.map((st) => st.dates.map((md) => {
    const y = Number(md.slice(0, 2)) >= 7 ? startYear : startYear + 1;
    let d = `${y}-${md}`;
    // Auf den Spieltag der Woche schieben (nächstgelegener, höchstens drei Tage).
    const delta = ((fmt.weekday - weekday(d)) + 7) % 7;
    d = addDays(d, delta <= 3 ? delta : delta - 7);
    const min = addDays(prev, WANT_GAP_DAYS);
    if (d < min) d = min;
    const q = { preferred: d, weekdays: [fmt.weekday], from: min, maxShift: 10 };
    let hit = findSlot({ ...q, rules: [{ busy: league, gap: leagueGap }, { busy: cup, gap: WANT_GAP_DAYS }] })
      ?? findSlot({ ...q, rules: [{ busy: league, gap: MIN_GAP_DAYS }, { busy: cup, gap: MIN_GAP_DAYS }] })
      ?? findSlot({ ...q, weekdays: [2, 3, 4], rules: [{ busy: league, gap: MIN_GAP_DAYS }, { busy: cup, gap: MIN_GAP_DAYS }] })
      ?? findSlot({ ...q, weekdays: [], maxShift: 21, rules: [{ busy: league, gap: MIN_GAP_DAYS }, { busy: cup, gap: MIN_GAP_DAYS }] });
    if (!hit) { hit = d; while (avoid.has(hit) || cupDates?.has(hit)) hit = addDays(hit, 1); }
    prev = hit;
    return hit;
  }));
}

/** Europapokal-Wochen einer Saison (alle aktiven Wettbewerbe, ohne Rücksicht auf die Liga) – der Landespokal meidet sie. */
export function euroFrameDates(startYear: number): Set<string> {
  const out = new Set<string>();
  for (const comp of EURO_COMPS) {
    const fmt = euroFormat(comp, startYear);
    if (!fmt) continue;
    for (const ds of scheduleFormat(fmt, startYear, new Set(), `${startYear}-07-01`)) for (const d of ds) out.add(d);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Wettbewerb anlegen
// -----------------------------------------------------------------------------
/**
 * Preisgeld je gewonnener K.-o.-Begegnung (1975-Basis) nach Abstand zum Finale (Finale,
 * Halbfinale, Viertelfinale, Achtelfinale, davor) – wie bisher im Landesmeister-Wettbewerb;
 * die anderen Wettbewerbe 80 %. Gruppenspiele: Prämie je Sieg/Remis (data/euroFormats.ts).
 */
const EURO_PRIZE_BY_ROUND_V2 = [120000, 60000, 30000, 15000, 10000, 8000];

function prizeFor(comp: EuroCompId, fmt: EuroFormat, i: number): number {
  const st = fmt.stages[i];
  if (st.kind !== 'ko') return 0;
  const after = fmt.stages.slice(i + 1).filter((s) => s.kind === 'ko').length;
  const base = EURO_PRIZE_BY_ROUND_V2[Math.min(after, EURO_PRIZE_BY_ROUND_V2.length - 1)];
  return Math.round(base * (comp === 'ec' ? 1 : 0.8));
}

export function createEuroCupV2(
  comp: EuroCompId, fmt: EuroFormat, participantIds: string[], avoid: Set<string>,
  seed: number, startYear: number, earliest: string, cupDates?: Set<string>,
): CupState {
  const dates = scheduleFormat(fmt, startYear, avoid, earliest, cupDates);
  const rounds: CupRound[] = fmt.stages.map((st, index) => ({
    index, name: st.name, date: dates[index][0], drawn: false, ties: [],
    kind: st.kind, key: st.key, legs: st.kind === 'ko' ? st.legs : undefined, dates: dates[index],
    entrants: index === 0 ? [...participantIds] : [], seedOf: {}, groupOf: {},
    drawMode: st.kind === 'ko' ? st.draw : undefined,
  }));
  return {
    season: seasonLabel(startYear), seed, participantIds: [...participantIds], amateurClubIds: [], rounds,
    currentRoundIndex: 0, prizeByRound: fmt.stages.map((_, i) => prizeFor(comp, fmt, i)), winnerClubId: null,
    v2: 1, xstats: {}, xpeople: {},
  };
}

/** Erwartete Teilnehmer je Runde (inkl. Wechsel aus anderen Wettbewerben). */
export function computeNeeds(cups: Partial<Record<EuroCompId, CupState | null>>, startYear: number): void {
  const counts: Partial<Record<EuroCompId, number[]>> = {};
  for (const comp of EURO_COMPS) {
    const fmt = euroFormat(comp, startYear);
    if (fmt && cups[comp]) counts[comp] = fmt.stages.map((_, i) => (i === 0 ? fmt.field : 0));
  }
  // Feste Zuflüsse (Gruppenplätze, auch aus anderen Wettbewerben) einmal, K.-o.-Sieger iterativ
  // (die Zwischenrunde eines Wettbewerbs bekommt Teams aus einem anderen, der später zählt).
  for (const comp of EURO_COMPS) {
    const fmt = euroFormat(comp, startYear);
    const c = counts[comp];
    if (!fmt || !c) continue;
    fmt.stages.forEach((st, i) => {
      if (st.kind === 'ko') return;
      const per = st.kind === 'league' ? 1 : st.groups ?? 1;
      for (const a of st.advance ?? []) {
        const tgtComp = a.comp ?? comp;
        const tgt = euroFormat(tgtComp, startYear)?.stages.findIndex((s) => s.key === a.target) ?? -1;
        const arr = counts[tgtComp];
        if (tgt >= 0 && arr) arr[tgt] += (a.to - a.from + 1) * per;
      }
      if (st.bestRunnersUp) {
        const tgt = fmt.stages.findIndex((s) => s.key === st.bestRunnersUp!.target);
        if (tgt >= 0) c[tgt] += st.bestRunnersUp.count;
      }
    });
  }
  for (const comp of EURO_COMPS) {
    const fmt = euroFormat(comp, startYear);
    const c = counts[comp];
    if (!fmt || !c) continue;
    // Stufen sind geordnet: Sieger einer K.-o.-Runde kommen in die nächste.
    fmt.stages.forEach((st, i) => { if (st.kind === 'ko' && i + 1 < c.length) c[i + 1] += c[i] / 2; });
  }
  for (const comp of EURO_COMPS) {
    const cup = cups[comp];
    const c = counts[comp];
    if (cup && c) cup.rounds.forEach((r, i) => { r.need = Math.round(c[i]); });
  }
}

/** Kalender-Ereignis je Spieltermin. */
export function addEuroCalendarEventsV2(calendar: GameCalendar, comp: EuroCompId, cup: CupState): void {
  const name = euroCompName(comp, cupStartYear(cup));
  for (const round of cup.rounds) {
    (round.dates ?? [round.date]).forEach((date, leg) => {
      const what = round.kind === 'ko'
        ? (round.legs === 2 ? (leg === 0 ? ' (Hinspiel)' : ' (Rückspiel)') : '')
        : `, ${leg + 1}. Spieltag`;
      calendar.events.push({
        id: `euroev_${comp}_${round.index}_${leg}`, date, type: 'euro_matchday',
        title: `${name}: ${round.name}${what}`, description: `${round.name}${what} im Wettbewerb ${name} ${cup.season}.`,
        cupRoundIndex: round.index, euroComp: comp, leg, processed: false, requiresAction: false,
      });
    });
  }
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

// -----------------------------------------------------------------------------
// Deutsche Starter
// -----------------------------------------------------------------------------
export interface QualSource {
  clubs: Record<string, unknown>;
  simClubs?: Record<string, unknown>;
  table?: LeagueTable;
  cup?: CupState | null;
  leagues?: { playerDivision: { tier: number }; otherDivisions: { tier: number; table: LeagueTable }[] };
}

/** Pokalsieger und -finalist der abgelaufenen Saison. */
function cupFinalists(cup: CupState | null | undefined): { winner: string | null; finalist: string | null } {
  const winner = cup?.winnerClubId ?? null;
  const fin = cup?.rounds[cup.rounds.length - 1]?.ties[0];
  const finalist = fin?.winnerClubId ? (fin.winnerClubId === fin.homeClubId ? fin.awayClubId : fin.homeClubId) : null;
  return { winner, finalist };
}

/**
 * Deutsche Starter je Wettbewerb nach den Startplätzen der Saison (Rang Deutschlands):
 *   Meisterliga: die ersten N der Tabelle,
 *   Pokalsieger-Wettbewerb (bis 1998): Pokalsieger, sonst Finalist, sonst nächster Platz,
 *   Europa-Pokal: ab 1999 zuerst der Pokalsieger, dann die nächsten Plätze,
 *   Konferenz-Liga (ab 2021): nächster Platz.
 */
export function germanQualifiersV2(g: QualSource, startYear: number, rank: number, firstSeason: boolean): Record<EuroCompId, string[]> {
  if (firstSeason) {
    const exists = (id: string) => !!g.clubs[id] || !!g.simClubs?.[id];
    return {
      ec: EURO_FIRST_SEASON_GERMAN.ec.filter(exists),
      cwc: EURO_FIRST_SEASON_GERMAN.cwc.filter(exists),
      uefa: EURO_FIRST_SEASON_GERMAN.uefa.filter(exists),
    };
  }
  const slots = accessSlots(startYear, rank);
  const top = g.leagues && g.leagues.playerDivision.tier !== 1 ? g.leagues.otherDivisions.find((d) => d.tier === 1)?.table : g.table;
  const order = (top?.rows ?? []).map((r) => r.clubId);
  const taken = new Set<string>();
  const next = () => { const id = order.find((x) => !taken.has(x)); if (id) taken.add(id); return id; };
  const out: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  const ecOn = !!euroFormat('ec', startYear), cwcOn = !!euroFormat('cwc', startYear), uefaOn = !!euroFormat('uefa', startYear);
  if (ecOn) for (let i = 0; i < slots.ec; i++) { const id = next(); if (id) out.ec.push(id); }
  const { winner, finalist } = cupFinalists(g.cup);
  const cupEntrant = () => {
    if (winner && !taken.has(winner)) { taken.add(winner); return winner; }
    if (startYear <= 1998 && finalist && !taken.has(finalist)) { taken.add(finalist); return finalist; }
    return next();
  };
  if (slots.cupTo === 'cwc' && cwcOn) { const id = cupEntrant(); if (id) out.cwc.push(id); }
  if (uefaOn) {
    let n = slots.uefa;
    if (slots.cupTo === 'uefa') { const id = cupEntrant(); if (id) out.uefa.push(id); n--; }
    for (let i = 0; i < n; i++) { const id = next(); if (id) out.uefa.push(id); }
  }
  if (startYear >= 2021 && cwcOn) for (let i = 0; i < slots.cwc; i++) { const id = next(); if (id) out.cwc.push(id); }
  return out;
}

// -----------------------------------------------------------------------------
// Alle Wettbewerbe einer Saison
// -----------------------------------------------------------------------------
export function buildEuroCupsV2(
  quals: Record<EuroCompId, string[]>,
  euroClubs: Record<string, EuroClub>,
  avoid: Set<string>,
  seedOf: (comp: EuroCompId) => number,
  startYear: number,
  earliest: string,
  calendar: GameCalendar,
  foreign: Record<EuroCompId, string[]> | null,
  cupDates?: Set<string>,
): Record<EuroCompId, CupState | null> {
  const out: Record<EuroCompId, CupState | null> = { ec: null, cwc: null, uefa: null };
  const used = new Set<string>(EURO_COMPS.flatMap((c) => quals[c] ?? []));
  const pool: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  if (foreign) for (const c of EURO_COMPS) pool[c] = [...(foreign[c] ?? [])];
  else for (const c of Object.values(euroClubs)) if (c.id.startsWith('eu_')) pool[c.comp].push(c.id);
  for (const comp of EURO_COMPS) {
    const fmt = euroFormat(comp, startYear);
    if (!fmt) continue;
    const ids = (quals[comp] ?? []).filter((id) => !!id).slice(0, fmt.field);
    for (const id of pool[comp]) {
      if (ids.length >= fmt.field) break;
      if (!used.has(id) && euroClubs[id]) { ids.push(id); used.add(id); }
    }
    // Zu wenige Starter (kleine Welt, alte Spielstände): stärkste freie Auslandsvereine.
    if (ids.length < fmt.field) {
      const rest = Object.values(euroClubs).filter((c) => !used.has(c.id)).sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
      for (const c of rest) { if (ids.length >= fmt.field) break; ids.push(c.id); used.add(c.id); }
    }
    const cup = createEuroCupV2(comp, fmt, ids, avoid, seedOf(comp), startYear, earliest, cupDates);
    addEuroCalendarEventsV2(calendar, comp, cup);
    out[comp] = cup;
  }
  computeNeeds(out, startYear);
  return out;
}
