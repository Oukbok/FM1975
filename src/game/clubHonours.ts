// =============================================================================
// Vereinsauszeichnungen (Wunsch Pascal) – Ablauf
// -----------------------------------------------------------------------------
// Am Saisonende (startNextSeason, nach recordSeasonEnd) wird für jeden Verein mit
// vollem Kader (deine Liga, also auch die KI-Vereine) ein Saisonprofil `facts`
// festgehalten (letzte 12 Saisons). Daraus prüft `evaluate` je Auszeichnung die
// höchste geschaffte Stufe; Laufzeit 5 Jahre, Verlängerung durch dieselbe oder eine
// höhere Stufe, Aufstieg sofort, Abstieg erst nach Ablauf (data/clubHonours.ts).
// Wirkungen gehen über engine/honourEffects.ts an die Engine (`bindHonours`).
// Optionales Feld `game.honours` – fehlt es, beginnt alles mit der nächsten Saison.
//
// Eigengewächs (Wunsch Pascal): aus der Jugend des Vereins (ID `<verein>_y_`),
// mindestens ein Jahr in der Jugend (sofern Eintritt/Hochziehen bekannt), danach
// höchstens verliehen; ein Verkauf (auch mit späterem Rückkauf) beendet den Status.
// Spielminuten-Hürde 1.500 bei 34 Spieltagen, anteilig bei anderer Ligagröße.
// =============================================================================
import { HG_MINUTES_34, HONOURS, HONOUR_BY_ID, HONOUR_YEARS, TIER_NAME, type HonourId } from '../data/clubHonours';
import { seasonStartYear } from '../data/timeline';
import { setHonourTable, type HonourEffects } from '../engine/honourEffects';
import { makeMessage, pushMessage } from '../engine/messages';
import type { Club, CupState, Player } from '../types';
import { recordBook } from './clubRecords';
import type { Game } from './state';
import { openCoachEntry } from './headCoaches';

/** Saisonprofil eines Vereins (kompakt). */
export interface HonourFacts {
  s: string; tier: number; pos: number;
  /** Eigengewächse über der Minutenhürde / davon Stärke 80+. */
  hg: number; hg80: number;
  /** Eigengewächs-Verkäufe unter den Top 10 der Saison / Rekordablöse. */
  hgTop: number; hgRec: 0 | 1;
  youth: number;
  /** Europapokal: 0 nicht dabei, 1 dabei, 2 Halbfinale, 3 Finale, 4 Sieger; `euMain` = wichtigster Wettbewerb gewonnen. */
  eu: number; euMain: 0 | 1;
  /** Landespokal: 0, 1 Finale, 2 Sieger; `out` = Außenseiter (kein großer Titel in 10 Jahren). */
  cup: number; out: 0 | 1;
  homeL: number; homeD: number;
  /** Angriff/Abwehr: Tore je Spiel, beste der Liga (1/0), Verhältnis zum Ligaschnitt je Team. */
  gfpg: number; gapg: number; bestAtt: 0 | 1; bestDef: 0 | 1; attRatio: number;
  fair: 0 | 1;
  mood: number;
  loyal: number; loyalHg: number;
  profit: 0 | 1; loan: 0 | 1; reserve: number;
  att: number; cap: number;
  trf: 0 | 1;
  /** Stärke der besten 11 am Saisonende (Vergleich mit der Vorsaison). */
  str: number;
  coachY: number; calm: 0 | 1;
  /** Großer Titel in dieser Saison (Meister/Pokal/Europapokal). */
  title: 0 | 1;
}

/** `until` = Jahr des letzten Saisonendes, bis zu dem die Stufe gilt; `since` = Jahr der Vergabe. */
export interface ActiveHonour { tier: 0 | 1 | 2; until: number; since: number }

export interface HonourState {
  v: 1;
  facts: Record<string, HonourFacts[]>;
  active: Record<string, Partial<Record<HonourId, ActiveHonour>>>;
  /** Tiefste Teamstimmung je Verein in der laufenden Saison. */
  moodMin: Record<string, number>;
  /** Bilanz je Saisonwertung: Anzahl je Stufe (Kalibrierung, Sim-Bericht). */
  log?: { s: string; n: [number, number, number] }[];
}

type G = Game & { honours?: HonourState };
const MAX_FACTS = 12;

export function honourState(g: Game): HonourState {
  const gg = g as G;
  if (!gg.honours) gg.honours = { v: 1, facts: {}, active: {}, moodMin: {} };
  return gg.honours;
}

// ----------------------------------------------------------------- Wirkungen
let bound: Game | null = null;

/** Wirkungstabelle für die Engine setzen (beim Laden/Spielstart/täglich bei neuem Spielstand). */
export function bindHonours(g: Game, force = false): void {
  if (bound === g && !force) return;
  bound = g;
  const st = (g as G).honours;
  const t: Record<string, HonourEffects> = {};
  for (const [cid, list] of Object.entries(st?.active ?? {})) {
    const fx: HonourEffects = {};
    for (const [hid, a] of Object.entries(list ?? {})) {
      if (!a) continue;
      for (const [k, v] of Object.entries(HONOUR_BY_ID[hid as HonourId].tiers[a.tier].effects)) fx[k as keyof HonourEffects] = (fx[k as keyof HonourEffects] ?? 0) + (v ?? 0);
    }
    t[cid] = fx;
  }
  setHonourTable(t);
}

/** Aktive Auszeichnungen eines Vereins (Anzeige). */
export function activeHonours(g: Game, clubId: string): { id: HonourId; a: ActiveHonour }[] {
  const list = (g as G).honours?.active[clubId] ?? {};
  return HONOURS.filter((h) => list[h.id]).map((h) => ({ id: h.id, a: list[h.id]! }));
}

/** Tiefste Teamstimmung der Saison mitschreiben (dressingRoomGame). */
export function noteHonourMood(g: Game, clubId: string, mood: number): void {
  const mo = +g.calendar.currentDate.slice(5, 7);
  if (mo >= 6 && mo <= 8) return; // Vorbereitung und Saisonauftakt zählen nicht (Stimmung beginnt neutral)
  const m = honourState(g).moodMin;
  if (m[clubId] == null || mood < m[clubId]) m[clubId] = Math.round(mood);
}

// ----------------------------------------------------------------- Eigengewächs
export function isHomegrown(p: Player, club: Club): boolean {
  if (!p.id.startsWith(`${club.id}_y_`)) return false;
  if (p.youthJoined && p.youthPromoted && daysBetween(p.youthJoined, p.youthPromoted) < 365) return false;
  // Ein Verkauf beendet den Status – auch bei späterem Rückkauf. Leihen zählen nicht.
  for (const t of p.history?.transfers ?? []) if (t.fromClub === club.name && t.kind !== 'loan' && t.kind !== 'back' && (t.kind || t.fee > 0)) return false;
  return true;
}
const daysBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86400000;

// ----------------------------------------------------------------- Saisonprofil
const BIG_TITLES = new Set(['meister', 'pokal', 'ec', 'cwc', 'uefa']);

function stageIn(cup: CupState | null | undefined, id: string): number {
  if (!cup?.rounds?.length) return 0;
  let last = -1;
  cup.rounds.forEach((r, i) => { if (r.ties?.some((t) => t.homeClubId === id || t.awayClubId === id)) last = i; });
  if (last < 0) return cup.participantIds?.includes(id) ? 1 : 0;
  if (cup.winnerClubId === id) return 4;
  const name = cup.rounds[last].name ?? '';
  if (/^Finale|Endspiel/i.test(name) || last === cup.rounds.length - 1) return 3;
  if (/Halbfinale/i.test(name) || last === cup.rounds.length - 2) return 2;
  return 1;
}

function factsFor(g: Game, club: Club, season: string, ctx: SeasonCtx): HonourFacts {
  const id = club.id;
  const row = g.table.rows.find((r) => r.clubId === id);
  const games = Math.max(1, row?.played ?? 1);
  const squad = club.playerIds.map((pid) => g.players[pid]).filter((p): p is Player => !!p);
  const minNeed = HG_MINUTES_34 * ctx.matchdays / 34;
  const hgs = squad.filter((p) => isHomegrown(p, club) && (p.seasonStats?.minutesPlayed ?? 0) >= minNeed);
  // Verkäufe: Eigengewächse dieses Vereins in den Top 10 der Saison
  const sales = ctx.sales;
  const mine = sales.slice(0, 10).filter((e) => e.f === id && e.p.startsWith(`${id}_y_`));
  // Heimbilanz
  let homeL = 0, homeD = 0;
  for (const m of g.fixtures) {
    if (m.homeClubId !== id || !m.result) continue;
    if (m.result.homeGoals < m.result.awayGoals) homeL++;
    else if (m.result.homeGoals === m.result.awayGoals) homeD++;
  }
  // Fair Play: Kartenpunkte der Saison (Gelb 1, Gelb-Rot 3, Rot 5) aller Kaderspieler
  const titles = (recordBook(g)?.titles[id] ?? []);
  const sy = seasonStartYear(season);
  // Außenseiter: kein großer Titel in 15 Jahren und in der Liga nicht unter den ersten 6
  const out = titles.some(([k, s]) => BIG_TITLES.has(k) && seasonStartYear(s) >= sy - 15 && seasonStartYear(s) < sy) || (row?.position ?? 99) <= 6 ? 0 : 1;
  const titleNow = titles.some(([k, s]) => BIG_TITLES.has(k) && s === season) ? 1 : 0;
  const eu = Math.max(stageIn(g.euroCups?.ec, id), stageIn(g.euroCups?.cwc, id), stageIn(g.euroCups?.uefa, id));
  const euMain = g.euroCups?.ec?.winnerClubId === id ? 1 : 0;
  const cupStage = stageIn(g.cup, id);
  // Treue: mindestens 25 Saisonspiele und seit 10 Jahren im Verein
  const loyalList = squad.filter((p) => (p.seasonStats?.appearances ?? 0) >= 25 && yearsAt(p, club, ctx.today) >= 10);
  const fin = club.finances;
  const last = fin.seasonHistory?.[fin.seasonHistory.length - 1];
  const rev = Math.max(1, last?.revenue ?? 1);
  const coachSince = id === g.managedClubId ? openCoachEntry(g)?.from : club.coach?.since;
  const coachY = coachSince ? Math.floor(daysBetween(coachSince, ctx.today) / 365.25) : 0;
  const str = top11(squad);
  const prev = honourState(g).facts[id]?.slice(-1)[0];
  const saldo = ctx.saldo[id] ?? 0;
  return {
    s: season, tier: g.leagues.playerDivision.tier, pos: row?.position ?? 99,
    hg: hgs.length, hg80: hgs.filter((p) => p.overall >= 80).length,
    hgTop: mine.length, hgRec: sales[0]?.f === id && sales[0].p.startsWith(`${id}_y_`) ? 1 : 0,
    // Jugendtitel: A-/B-Jugend, Junioren-Pokal, DDR, Youth League, Staffelsiege C/D (E/F = Kinderfußball ohne Meisterschaft)
    youth: titles.filter(([k, s]) => s === season && (k.startsWith('jugend') || k === 'uyl') && k !== 'jugendE' && k !== 'jugendF').length,
    eu, euMain: euMain as 0 | 1,
    cup: cupStage >= 4 ? 2 : cupStage === 3 ? 1 : 0, out: out as 0 | 1,
    homeL, homeD,
    gfpg: round2((row?.goalsFor ?? 0) / games), gapg: round2((row?.goalsAgainst ?? 0) / games),
    bestAtt: ctx.bestAtt === id ? 1 : 0, bestDef: ctx.bestDef === id ? 1 : 0,
    attRatio: round2(((row?.goalsFor ?? 0) / games) / Math.max(0.01, ctx.avgGoals)),
    fair: ctx.fairest === id ? 1 : 0,
    mood: honourState(g).moodMin[id] ?? Math.round(club.dressingRoom?.mood ?? 50),
    loyal: loyalList.length, loyalHg: loyalList.filter((p) => isHomegrown(p, club)).length,
    profit: (last?.result ?? 0) > 0 ? 1 : 0,
    loan: (club.loans ?? []).length ? 1 : 0,
    reserve: round2(fin.balance / rev),
    att: round2(club.stadium.averageAttendanceRate ?? 0), cap: club.stadium.capacity,
    trf: saldo > 0 && prev && str >= prev.str + 1.5 ? 1 : 0, str,
    coachY, calm: (club.coach?.pressure ?? 0) < 60 ? 1 : 0,
    title: titleNow as 0 | 1,
  };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
function top11(squad: Player[]): number {
  const s = squad.map((p) => p.overall).sort((a, b) => b - a).slice(0, 11);
  return s.length ? round2(s.reduce((a, b) => a + b, 0) / s.length) : 0;
}
let gameStart = '1975-07-01';
function yearsAt(p: Player, club: Club, today: string): number {
  const arrivals = (p.history?.transfers ?? []).filter((t) => t.toClub === club.name && t.kind !== 'back');
  if (arrivals.length) return daysBetween(arrivals[arrivals.length - 1].date, today) / 365.25;
  // Ohne Zugang: seit der Jugend, sonst seit dem Spielbeginn (Vorgeschichte unbekannt)
  const since = p.youthJoined ?? p.youthPromoted ?? gameStart;
  return daysBetween(since, today) / 365.25;
}

interface SeasonCtx {
  today: string; matchdays: number; avgGoals: number;
  bestAtt?: string; bestDef?: string; fairest?: string;
  sales: { p: string; f: string; fee: number }[];
  saldo: Record<string, number>;
}

function seasonCtx(g: Game, season: string): SeasonCtx {
  const rows = g.table.rows;
  const n = rows.length;
  const games = rows.reduce((a, r) => a + r.played, 0) || 1;
  const goals = rows.reduce((a, r) => a + r.goalsFor, 0);
  const best = (f: (r: typeof rows[number]) => number) => [...rows].sort((a, b) => f(b) - f(a))[0]?.clubId;
  // Fairste Mannschaft: wenigste Kartenpunkte, kein Platzverweis
  let fairest: string | undefined, fairPts = Infinity;
  for (const r of rows) {
    const c = g.clubs[r.clubId];
    if (!c) continue;
    let pts = 0, reds = 0;
    for (const pid of c.playerIds) {
      const s = g.players[pid]?.seasonStats;
      if (!s) continue;
      pts += s.yellowCards + 3 * s.yellowRedCards + 5 * s.redCards;
      reds += s.yellowRedCards + s.redCards;
    }
    if (pts < fairPts) { fairPts = pts; fairest = reds ? undefined : r.clubId; }
  }
  // Transfers der Saison (Sommer- und Winterfenster)
  const sy = seasonStartYear(season);
  const keys = new Set([`${sy}S`, `${sy + 1}W`]);
  const entries = (g.transferLog?.wins ?? []).filter((w) => keys.has(w.key)).flatMap((w) => w.e).filter((e) => !e.k);
  const sales = entries.filter((e) => e.fee > 0).map((e) => ({ p: e.p, f: e.f, fee: e.fee })).sort((a, b) => b.fee - a.fee);
  const saldo: Record<string, number> = {};
  for (const e of entries) { saldo[e.f] = (saldo[e.f] ?? 0) + e.fee; saldo[e.t] = (saldo[e.t] ?? 0) - e.fee; }
  return {
    today: g.calendar.currentDate, matchdays: Math.max(2, (n - 1) * 2), avgGoals: goals / games,
    bestAtt: best((r) => r.goalsFor / Math.max(1, r.played)), bestDef: best((r) => -r.goalsAgainst / Math.max(1, r.played)),
    fairest, sales, saldo,
  };
}

// ----------------------------------------------------------------- Hürden
/** Höchste geschaffte Stufe (0 Bronze … 2 Gold) oder -1; F = Saisonprofile, neueste zuletzt. */
type Check = (F: HonourFacts[]) => number;
const lastN = (F: HonourFacts[], n: number) => (F.length >= n ? F.slice(-n) : null);
/** Die letzten n Saisons alle erfüllt (und lückenlos aufeinanderfolgend). */
function run(F: HonourFacts[], n: number, ok: (f: HonourFacts) => boolean): boolean {
  const l = lastN(F, n);
  if (!l) return false;
  for (let i = 0; i < l.length; i++) {
    if (!ok(l[i])) return false;
    if (i && seasonStartYear(l[i].s) !== seasonStartYear(l[i - 1].s) + 1) return false;
  }
  return true;
}
const tierOf = (b: boolean, s: boolean, gd: boolean) => (gd ? 2 : s ? 1 : b ? 0 : -1);

export const CHECKS: Record<HonourId, Check> = {
  talentschmiede: (F) => { const f = F[F.length - 1]; return tierOf(f.hg >= 3, f.hg >= 5, f.hg >= 7 && f.hg80 >= 3); },
  sprungbrett: (F) => { const f = F[F.length - 1]; return tierOf(f.hgTop >= 1, f.hgTop >= 2, f.hgRec === 1); },
  jugendhoheit: (F) => { const f = F[F.length - 1]; return tierOf(f.youth >= 3, f.youth >= 4, f.youth >= 5); },
  spitzenklub: (F) => {
    const top1 = (f: HonourFacts) => f.tier === 1;
    const l3 = lastN(F, 3);
    const champs = l3 ? l3.filter((f) => top1(f) && f.pos === 1).length : 0;
    return tierOf(run(F, 3, (f) => top1(f) && f.pos <= 2), champs >= 2 && run(F, 3, top1), run(F, 3, (f) => top1(f) && f.pos === 1));
  },
  europa: (F) => { const f = F[F.length - 1]; return tierOf(f.eu >= 3, f.eu >= 4, f.euMain === 1); },
  pokalschreck: (F) => { const f = F[F.length - 1]; return f.out ? tierOf(f.cup >= 1, f.cup >= 2, f.cup >= 2 && f.eu >= 2) : -1; },
  festung: (F) => { const f = F[F.length - 1]; return tierOf(f.homeL === 0, f.homeL === 0 && f.homeD <= 2, run(F, 2, (x) => x.homeL === 0)); },
  spektakel: (F) => {
    const ok = (f: HonourFacts) => f.bestAtt === 1 && f.attRatio >= 1.6;
    return tierOf(run(F, 1, ok), run(F, 2, ok), run(F, 3, ok) && F[F.length - 1].pos === 1 && F[F.length - 1].tier === 1);
  },
  bollwerk: (F) => {
    const f = F[F.length - 1];
    return tierOf(f.bestDef === 1 && f.gapg <= 0.8, f.bestDef === 1 && f.gapg <= 0.6, run(F, 2, (x) => x.bestDef === 1 && x.gapg <= 0.5));
  },
  fairplay: (F) => tierOf(run(F, 1, (f) => f.fair === 1), run(F, 2, (f) => f.fair === 1), run(F, 4, (f) => f.fair === 1)),
  truppe: (F) => { const f = F[F.length - 1]; return tierOf(f.mood >= 65, f.mood >= 72, run(F, 3, (x) => x.mood >= 72)); },
  treue: (F) => { const f = F[F.length - 1]; return tierOf(f.loyal >= 10, f.loyal >= 11, f.loyal >= 12 && f.loyalHg >= 3); },
  kasse: (F) => {
    const ok = (f: HonourFacts) => f.profit === 1 && f.loan === 0;
    return tierOf(run(F, 5, ok), run(F, 7, ok) && F[F.length - 1].reserve >= 0.5, run(F, 10, ok) && F[F.length - 1].reserve >= 1);
  },
  huette: (F) => {
    const f = F[F.length - 1];
    return tierOf(f.att >= 0.95 && f.cap >= 40000, f.att >= 0.98 && f.cap >= 50000, run(F, 2, (x) => x.att >= 0.995 && x.cap >= 60000));
  },
  transfer: (F) => {
    const ok = (f: HonourFacts) => f.trf === 1;
    const l5 = lastN(F, 5);
    return tierOf(run(F, 1, ok), run(F, 3, ok), run(F, 5, ok) && !!l5?.some((f) => f.title));
  },
  ruhe: (F) => {
    const f = F[F.length - 1];
    if (!f.calm) return -1;
    const recent = F.slice(-Math.max(1, f.coachY));
    return tierOf(f.coachY >= 5, f.coachY >= 8, f.coachY >= 12 && recent.some((x) => x.title));
  },
};

/** Fortschritt zur nächsten Stufe als kurzer Text (Anzeige im Hover). */
export function honourProgress(g: Game, clubId: string, id: HonourId): string | null {
  const f = (g as G).honours?.facts[clubId]?.slice(-1)[0];
  if (!f) return null;
  switch (id) {
    case 'talentschmiede': return `Letzte Saison: ${f.hg} Eigengewächse über der Minutenhürde (${f.hg80} mit Stärke 80+)`;
    case 'sprungbrett': return `Letzte Saison: ${f.hgTop} Eigengewächs-Verkäufe unter den Top 10`;
    case 'jugendhoheit': return `Letzte Saison: ${f.youth} Jugendtitel`;
    case 'festung': return `Letzte Saison: ${f.homeL} Heimniederlagen, ${f.homeD} Heim-Remis`;
    case 'spektakel': return `Letzte Saison: ${f.gfpg.toFixed(2).replace('.', ',')} Tore je Spiel (${Math.round(f.attRatio * 100)} % des Ligaschnitts)${f.bestAtt ? ', bester Angriff' : ''}`;
    case 'bollwerk': return `Letzte Saison: ${f.gapg.toFixed(2).replace('.', ',')} Gegentore je Spiel${f.bestDef ? ', beste Abwehr' : ''}`;
    case 'fairplay': return f.fair ? 'Letzte Saison: fairste Mannschaft der Liga' : 'Letzte Saison: nicht die fairste Mannschaft';
    case 'truppe': return `Tiefste Teamstimmung letzte Saison: ${f.mood}`;
    case 'treue': return `Letzte Saison: ${f.loyal} langjährige Stammspieler (${f.loyalHg} Eigengewächse)`;
    case 'kasse': {
      const F = (g as G).honours!.facts[clubId]; let n = 0;
      for (let i = F.length - 1; i >= 0 && F[i].profit && !F[i].loan; i--) n++;
      return `${n} Saisons in Folge mit Gewinn ohne Kredit · Rücklage ${Math.round(f.reserve * 100)} % des Umsatzes`;
    }
    case 'huette': return `Letzte Saison: ${Math.round(f.att * 100)} % Auslastung bei ${f.cap.toLocaleString('de-DE')} Plätzen`;
    case 'transfer': return f.trf ? 'Letzte Saison: Transfersaldo positiv, Mannschaft stärker' : 'Letzte Saison: Hürde verpasst';
    case 'ruhe': return `Cheftrainer seit ${f.coachY} ${f.coachY === 1 ? 'Jahr' : 'Jahren'}`;
    case 'spitzenklub': return `Letzte Saison: Platz ${f.pos} (${f.tier}. Liga)`;
    case 'europa': return ['Letzte Saison: nicht im Europapokal', 'Letzte Saison: im Europapokal ausgeschieden', 'Letzte Saison: Halbfinale', 'Letzte Saison: Endspiel', 'Letzte Saison: Europapokalsieger'][f.eu];
    case 'pokalschreck': return f.out ? `Außenseiter · Landespokal: ${['früh ausgeschieden', 'Finale', 'Sieger'][f.cup]}` : 'Kein Außenseiter (großer Titel in 15 Jahren oder unter den ersten 6 der Liga)';
  }
  return null;
}

// ----------------------------------------------------------------- Saisonwertung
/** Saisonende: Profile festhalten, Stufen vergeben/verlängern/ablaufen lassen, Nachricht an dich. */
export function honoursSeasonEnd(g: Game, season: string): void {
  const st = honourState(g);
  const ctx = seasonCtx(g, season);
  gameStart = `${g.startYear ?? 1975}-07-01`;
  const endYear = seasonStartYear(season) + 1;
  const news: string[] = [];
  const count: [number, number, number] = [0, 0, 0];
  // Nur Vereine der Spielerliga (volle Kader + vollständige Saison); Absteiger aus früheren Jahren behalten ihre Stufen.
  for (const row of g.table.rows) {
    const club = g.clubs[row.clubId];
    if (!club?.playerIds.length) continue;
    const list = (st.facts[club.id] ??= []);
    list.push(factsFor(g, club, season, ctx));
    if (list.length > MAX_FACTS) list.splice(0, list.length - MAX_FACTS);
    const act = (st.active[club.id] ??= {});
    for (const h of HONOURS) {
      const got = CHECKS[h.id](list);
      const cur = act[h.id];
      const own = club.id === g.managedClubId;
      if (cur && cur.until <= endYear) { // letzte gültige Saison ist vorbei
        if (got < 0) { delete act[h.id]; if (own) news.push(`${h.name} (${TIER_NAME[cur.tier]}) ist ausgelaufen.`); continue; }
      }
      if (got < 0) continue;
      const tier = got as 0 | 1 | 2;
      if (!cur || cur.until <= endYear || tier >= cur.tier) {
        const fresh = !cur || tier > cur.tier || cur.until <= endYear;
        // gilt die nächsten 5 Saisons (bis zum Saisonende im Jahr endYear + 5)
        act[h.id] = { tier, until: endYear + HONOUR_YEARS, since: fresh ? endYear : cur!.since };
        if (own) news.push(!cur ? `Neu: ${h.name} in ${TIER_NAME[tier]} – ${h.tiers[tier].fx}.`
          : tier > cur.tier ? `Aufgestiegen: ${h.name} jetzt in ${TIER_NAME[tier]} – ${h.tiers[tier].fx}.`
          : `Verlängert: ${h.name} (${TIER_NAME[tier]}) gilt bis zum Saisonende ${endYear + HONOUR_YEARS}.`);
      }
    }
    for (const a of Object.values(act)) if (a) count[a.tier]++;
    if (!Object.keys(act).length) delete st.active[club.id];
  }
  // Ausblick: läuft im nächsten Jahr aus
  for (const [hid, a] of Object.entries(st.active[g.managedClubId] ?? {})) {
    if (a && a.until === endYear + 1) news.push(`${HONOUR_BY_ID[hid as HonourId].name} (${TIER_NAME[a.tier]}) läuft nach der neuen Saison aus – schaff die Hürde erneut, um sie zu verlängern.`);
  }
  st.moodMin = {};
  (st.log ??= []).push({ s: season, n: count });
  if (st.log.length > 60) st.log.splice(0, st.log.length - 60);
  bindHonours(g, true);
  if (news.length) {
    pushMessage(g.messages, makeMessage({
      date: g.calendar.currentDate, category: 'board', from: 'Vereinschronik',
      subject: `Vereinsauszeichnungen ${season}`,
      shortText: news[0],
      bodyText: ['Die Saisonwertung der Vereinsauszeichnungen (Verein › Erfolge › Auszeichnungen):', '', ...news.map((n) => `• ${n}`)].join('\n'),
    }));
  }
}
