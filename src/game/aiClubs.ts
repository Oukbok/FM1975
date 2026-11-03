// =============================================================================
// MANAGER-KI DER KI-VEREINE — Kaderplanung, Transfers, Jugend
// -----------------------------------------------------------------------------
// Jeder KI-Verein bewertet an festen Markttagen (Sommer: Juli/August, Winter:
// Januar) seinen Kader je Positionsgruppe (engine/aiManager.ts) und entscheidet
// nach Bedarf, Kasse und Trainerphilosophie:
//   • Jugend hochziehen (Philosophie „jugend“ bevorzugt),
//   • gezielt bei anderen KI-Vereinen kaufen (Ablöse über engine/transferMarket:
//     Verkäuferposition, Rekordkurve; Spielerinteresse entscheidet mit),
//   • im Ausland kaufen, wenn im Inland nichts passt,
//   • Überzählige auf die Transferliste setzen bzw. abgeben.
// Mengen orientieren sich an der Bundesliga: etwa 3–8 Zugänge je Verein und
// Saison. Generierte Nachrücker (game/squads.ts) sind nur noch der Notnagel zum
// Ende des Sommerfensters. Der eigene Verein wird nie angefasst (nur in der
// Simulation ohne Oberfläche, `simAutoManage`).
// =============================================================================
import { Club, Player } from '../types';
import { assessSquad, GROUP_LABEL, GROUP_OF, GROUP_POS, GroupNeed, PosGroup, squadLevel11, SquadAssessment, targetStrength } from '../engine/aiManager';
import { AI_RESERVE, hasTransferBan, isLeagueClub, lastRevenue, marketValueFor, marketWage } from '../engine/clubEconomy';
import { bosmanActive } from '../engine/contractTalks';
import { clubWageLevel, economyScale } from '../engine/economy';
import { bookTransfer } from '../engine/finances';
import { recordTransfer } from '../engine/history';
import { makeMessage, pushMessage } from '../engine/messages';
import { createPlayer } from '../engine/playerFactory';
import { refreshOverall } from '../engine/development';
import { capBase, frenzy, sellerPosition, softCap } from '../engine/transferMarket';
import { promoteYouth } from '../engine/youth';
import { ORIGINS, pickOrigin } from '../data/origins';
import { coachTactics } from '../engine/aiManager';
import { fmtPrice } from '../ui/format';
import { coachClubs, coachSeasonReview, ensureCoaches, weeklyCoachPressure } from './coachCarousel';
import { transferPlayer } from './contracts';
import { sellAbroad } from './aiOffers';
import { fillSquad, leagueAnchor, MAX_SQUAD, MIN_SQUAD, wageRatioOf } from './squads';
import { Game } from './state';
import { aiYouthInvest } from './youthInvest';
import { willJoin } from './playerWishesGame';
import { poachStar } from './aiStarMarket';
import { aiLoansSeasonEnd } from './aiLoans';
import { coachRecordsSeasonEnd } from './coachRecord';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r5k = (v: number) => Math.round(v / 5000) * 5000;

export interface AiMarketState {
  /** Saison, für die Budgets und Zähler gelten. */
  season: string;
  /** Zugänge je Verein in dieser Saison. */
  arrivals: Record<string, number>;
  /** Schlagzeilen des laufenden Fensters (für die Nachricht zum Fensterschluss). */
  news: string[];
  /** Entlassungen während dieser Saison. */
  sacked: number;
}

const SUMMER_DAYS = new Set(['07-03', '07-10', '07-17', '07-24', '07-31', '08-07', '08-14', '08-21', '08-28']);
const WINTER_DAYS = new Set(['01-08', '01-15', '01-22', '01-29']);
const MAX_IN_SUMMER = 5;
const MAX_IN_SEASON = 7;
const MAX_IN_WINTER = 2;
/** Größter Kader, mit dem noch eingekauft wird. */
const BUY_SQUAD_MAX = 26;

const sim = (g: Game) => !!(g as any).simAutoManage;
/** Wird der Verein von der KI geführt? */
export function isAiClub(g: Game, c: Club): boolean {
  return isLeagueClub(c) && (c.id !== g.managedClubId || sim(g));
}
const aiClubs = (g: Game) => Object.values(g.clubs).filter((c) => isAiClub(g, c));
export const squadOf = (g: Game, c: Club) => c.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p);

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function market(g: Game): AiMarketState {
  if (!g.aiMarket || g.aiMarket.season !== g.season) g.aiMarket = { season: g.season, arrivals: {}, news: [], sacked: 0 };
  return g.aiMarket;
}

// -----------------------------------------------------------------------------
// Saisonstart: Budgets, Taktik
// -----------------------------------------------------------------------------
/** Transferbudget eines KI-Vereins (1975-Basis) aus Kontostand, Umsatz und Philosophie. */
export function aiTransferBudget(c: Club, year: number, season: string): number {
  if (hasTransferBan(c, season) || c.finances.balance <= 0) return 0;
  const rev = lastRevenue(c, year);
  const free = Math.max(0, c.finances.balance - AI_RESERVE * rev) * 0.85;
  const phil = c.coach?.philosophy === 'einkauf' ? 1.25 : c.coach?.philosophy === 'jugend' ? 0.75 : 1;
  return r5k(free * phil / economyScale(year));
}

function initSeason(g: Game, today: string): void {
  if (g.aiMarket?.season === g.season) return;
  market(g);
  const year = Number(today.slice(0, 4));
  for (const c of aiClubs(g)) {
    c.finances.transferBudget = aiTransferBudget(c, year, g.season);
    if (c.coach) c.tactics = coachTactics(c, g.players, c.coach, year);
  }
}

// -----------------------------------------------------------------------------
// Täglicher Einstieg (game/day.ts)
// -----------------------------------------------------------------------------
export function aiClubsDaily(g: Game, today: string, rng: () => number = Math.random): void {
  if (coachClubs(g).some((c) => !c.coach)) ensureCoaches(g, today, rng);
  initSeason(g, today);
  const m = market(g);
  weeklyCoachPressure(g, today, () => m.sacked, () => { m.sacked++; }, rng);
  const md = today.slice(5);
  if (SUMMER_DAYS.has(md)) marketRound(g, today, false, rng);
  else if (WINTER_DAYS.has(md)) marketRound(g, today, true, rng);
}

/** Vor dem Saisonwechsel (Endtabelle liegt noch vor): Trainerbilanz und Karussell. */
export function aiSeasonEnd(g: Game, rng: () => number = Math.random): void {
  // Leihen enden spätestens jetzt (falls der 30. Juni nicht lief), Trainerbilanz der Saison sichern.
  aiLoansSeasonEnd(g, g.calendar.currentDate, rng);
  coachRecordsSeasonEnd(g);
  coachSeasonReview(g, g.calendar.currentDate, rng);
}

/** Alte Spielstände: Trainer zuweisen (SAVE_VERSION 10). */
export function migrateAiClubs(g: Game): void {
  ensureCoaches(g, g.calendar.currentDate);
}

// -----------------------------------------------------------------------------
// Markttag
// -----------------------------------------------------------------------------
export interface RoundCtx {
  g: Game; today: string; year: number; winter: boolean; rng: () => number;
  /** Ligaspieler, die grundsätzlich wechseln können. */
  pool: Player[];
  /** Bezug für Auslandszugänge (keine Stärke-Inflation). */
  leagueRef: number;
  /** Liga-Anker aus game/squads.ts (negativ = Liga über dem Ziel). */
  anchor: number;
  busy: Set<string>;
}

function marketRound(g: Game, today: string, winter: boolean, rng: () => number): void {
  const m = market(g);
  const year = Number(today.slice(0, 4));
  const clubs = aiClubs(g);
  const levels = clubs.map((c) => squadLevel11(squadOf(g, c))).sort((a, b) => a - b);
  const busy = new Set((g.transferTalks ?? []).filter((t) => t.phase !== 'done' && t.phase !== 'failed').map((t) => t.playerId));
  const ctx: RoundCtx = {
    g, today, year, winter, rng, busy,
    leagueRef: levels[Math.floor(levels.length * 0.6)] ?? 72,
    anchor: leagueAnchor(g),
    pool: clubs.filter((c) => c.playerIds.length > MIN_SQUAD - 1).flatMap((c) => squadOf(g, c)),
  };
  const firstSummer = !winter && today.slice(5) === '07-03';
  for (const club of shuffle(clubs, rng)) {
    const squad = squadOf(g, club);
    const a = assessSquad(squad, club.tactics?.formation, winter ? 60 : 9999);
    listSurplus(club, a);
    if (firstSummer) {
      philosophyYouth(g, club, a, today, m);
      // Nachwuchs-Investitionen nach Umsatz und Philosophie (game/youthInvest.ts).
      aiYouthInvest(g, club, today, lastRevenue(club, year));
    }
    // Zu große Kader: Überzählige abgeben (unterklassig/Ausland).
    if (club.playerIds.length > BUY_SQUAD_MAX) sellSurplus(g, club, a, today, 1);
    else if (!winter && club.playerIds.length >= 24) releaseVeteran(g, club, squad, a, today);
    const got = m.arrivals[club.id] ?? 0;
    // Topvereine holen im Sommer gezielt Stars kleinerer Vereine (game/aiStarMarket.ts).
    if (!winter && got < MAX_IN_SUMMER && poachStar(ctx, club, a)) { m.arrivals[club.id] = got + 1; continue; }
    // Zu dünner Kader: Breite hat Vorrang vor Grenzen und Zufall (sonst füllen generierte Nachrücker auf).
    const short = !winter && club.playerIds.length < MIN_SQUAD;
    if (!short && (got >= MAX_IN_SEASON || (!winter && got >= MAX_IN_SUMMER) || (winter && got >= winterBase(m, club) + MAX_IN_WINTER))) continue;
    const need = a.order[0];
    if (!need || need.score < (winter ? 14 : short ? 4 : 8)) continue;
    if (!short && rng() > (winter ? 0.5 : 0.6)) continue; // nicht jeder Verein schlägt an jedem Markttag zu
    if (actOnNeed(ctx, club, a, need)) m.arrivals[club.id] = got + 1;
  }
}

/** Zugänge vor dem Winterfenster merken, damit dort höchstens zwei dazukommen. */
function winterBase(m: AiMarketState, c: Club): number {
  const key = `${c.id}#w`;
  if (m.arrivals[key] == null) m.arrivals[key] = m.arrivals[c.id] ?? 0;
  return m.arrivals[key];
}

function listSurplus(club: Club, a: SquadAssessment): void {
  for (const g of Object.values(a.groups)) for (const p of g.surplus) p.transferListed = true;
}

/** Bedarf decken: Jugend, Inland, Ausland – je nach Philosophie und Kasse. */
function actOnNeed(ctx: RoundCtx, club: Club, a: SquadAssessment, need: GroupNeed): boolean {
  const phil = club.coach?.philosophy ?? 'ausgewogen';
  const want = targetStrength(a, need);
  const prospect = bestProspect(ctx.g, club, need.group);
  const canBuy = club.playerIds.length < BUY_SQUAD_MAX && club.finances.transferBudget > 0 && !hasTransferBan(club, ctx.g.season);
  // Jugend zuerst, wenn das Talent reicht (für Breite) oder der Trainer auf Jugend setzt.
  const youthBar = need.quality ? want.min : want.min - (phil === 'jugend' ? 4 : phil === 'einkauf' ? -2 : 2);
  if (prospect && prospect.overall >= youthBar && (phil !== 'einkauf' || !canBuy)) return promote(ctx, club, prospect, need);
  if (canBuy) {
    // Herkunft des Zugangs: Ligakonkurrent, unterklassiger Verein oder Ausland (je nach Epoche).
    const pAbroad = ctx.year < 1985 ? 0.15 : ctx.year < 1995 ? 0.25 : ctx.year < 2005 ? 0.38 : 0.45;
    const pLower = need.quality ? 0.12 : phil === 'jugend' ? 0.5 : 0.38;
    const r = ctx.rng();
    const order: ('liga' | 'unten' | 'ausland')[] = r < pAbroad ? ['ausland', 'liga', 'unten']
      : r < pAbroad + pLower ? ['unten', 'liga', 'ausland'] : ['liga', 'unten', 'ausland'];
    for (const src of order) {
      if (src === 'liga' && buyDomestic(ctx, club, a, need, want)) return true;
      if (src !== 'liga' && buyExternal(ctx, club, need, want, src)) return true;
    }
  }
  // Notlösung bei echter Lücke: das beste Talent, auch wenn es noch nicht ganz reicht.
  if (prospect && !need.quality && prospect.overall >= want.min - 6) return promote(ctx, club, prospect, need);
  return false;
}

function bestProspect(g: Game, club: Club, group: PosGroup): Player | null {
  let best: Player | null = null;
  for (const id of club.youthPlayerIds ?? []) {
    const p = g.youthPlayers[id];
    if (!p || p.age < 17 || GROUP_OF[p.naturalPosition] !== group) continue;
    if (!best || p.overall + p.potentialStars * 3 > best.overall + best.potentialStars * 3) best = p;
  }
  return best;
}

function promote(ctx: RoundCtx, club: Club, p: Player, need: GroupNeed): boolean {
  const res = promoteYouth(club, p.id, ctx.g.players, ctx.g.youthPlayers, 27);
  if (!res.ok) return false;
  p.contract.weeklyWage = Math.max(p.contract.weeklyWage, Math.round(marketWage(p) * 0.6 * clubWageLevel(club, ctx.year)));
  void need;
  return true;
}

/** Saisonbeginn: Trainer mit Jugend-Philosophie ziehen ihre besten Talente hoch. */
function philosophyYouth(g: Game, club: Club, a: SquadAssessment, today: string, m: AiMarketState): void {
  const phil = club.coach?.philosophy ?? 'ausgewogen';
  // Gute Akademien (Ausbildungsqualität ≥ 60) geben einem weiteren Talent die Chance.
  const n = (phil === 'jugend' ? 1 : 0) + ((club.youthInvest?.quality ?? 0) >= 60 ? 1 : 0);
  const cands = (club.youthPlayerIds ?? []).map((id) => g.youthPlayers[id])
    .filter((p): p is Player => !!p && p.age >= 18 && p.potentialStars >= 3.5 && p.overall >= a.level - 12)
    .sort((x, y) => y.potentialStars - x.potentialStars || y.overall - x.overall);
  for (const p of cands.slice(0, n)) {
    if (club.playerIds.length >= MAX_SQUAD) break;
    if (promoteYouth(club, p.id, g.players, g.youthPlayers, MAX_SQUAD).ok) m.arrivals[club.id] = (m.arrivals[club.id] ?? 0) + 1;
  }
  void today;
}

// -----------------------------------------------------------------------------
// Kauf im Inland
// -----------------------------------------------------------------------------
export function monthsLeftOf(p: Player, today: string): number {
  const [y, mo] = p.contract.expiryDate.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  return (y - ty) * 12 + (mo - tm);
}

export function recentlyMoved(p: Player, today: string): boolean {
  const t = p.history?.transfers;
  const last = t?.[t.length - 1]?.date;
  if (!last) return false;
  return Date.parse(today + 'T00:00:00Z') - Date.parse(last + 'T00:00:00Z') < 300 * 86400000;
}

function buyDomestic(ctx: RoundCtx, buyer: Club, a: SquadAssessment, need: GroupNeed, want: { min: number; ideal: number }): boolean {
  const { g, rng, today, year } = ctx;
  const phil = buyer.coach?.philosophy ?? 'ausgewogen';
  const budget = buyer.finances.transferBudget;
  const maxAge = phil === 'jugend' ? 26 : need.quality ? 31 : 29;
  const cands = ctx.pool.filter((p) => p.clubId !== buyer.id && GROUP_OF[p.naturalPosition] === need.group
    && p.overall >= want.min && p.age <= maxAge && !p.isYouth && !ctx.busy.has(p.id)
    && !p.contract.preContractClubId && !recentlyMoved(p, today)
    && p.contract.transferValue * 0.85 <= budget);
  if (!cands.length) return false;
  // Qualitätsbedarf: Stärkere als das Ideal sind willkommen (wenn bezahlbar und er will).
  const fit = (o: number) => need.quality ? Math.max(0, want.ideal - o) * 2 + Math.max(0, o - want.ideal) * 0.5 : Math.abs(o - want.ideal) * 2;
  const score = (p: Player) => -fit(p.overall) - p.contract.transferValue / Math.max(1, budget) * 8
    + (phil === 'jugend' ? (26 - p.age) * 0.8 : 0) + (p.transferListed ? 3 : 0) + rng() * 6;
  const ranked = cands.map((p) => ({ p, s: score(p) })).sort((x, y) => y.s - x.s).slice(0, 4);
  for (const { p } of ranked) {
    const seller = g.clubs[p.clubId];
    if (!seller || !isAiClub(g, seller) || seller.playerIds.length <= MIN_SQUAD - 1) continue;
    const sSquad = squadOf(g, seller);
    const pos = sellerPosition(p, seller, buyer, { year, monthsLeft: monthsLeftOf(p, today), bosman: bosmanActive(today), squad: sSquad, rival: false, scope: 'germany' });
    if (pos.untouchable && (buyer.reputation ?? 0) < (seller.reputation ?? 0) + 8) continue;
    // Würde der Verkäufer selbst eine Lücke reißen? Dann nur zur vollen Forderung.
    const sNeed = assessSquad(sSquad, seller.tactics?.formation).groups[need.group];
    const thin = sNeed.count <= sNeed.starters + 1;
    const floor = thin ? pos.asking : pos.walkaway;
    const urgency = 1 + clamp(need.score / 100, 0, 0.3);
    const raw = p.contract.transferValue * (1 + rng() * 0.3) * urgency;
    const cap = capBase(year, 'germany');
    const maxPay = Math.min(budget, softCap(raw, cap) * frenzy(raw, cap, rng));
    if (maxPay < floor) continue;
    const fee = r5k(clamp((floor + Math.min(pos.asking, maxPay)) / 2, floor, maxPay));
    // Spieler: will er? (Persönlichkeit, Vereinsgröße, Stammplatz, Heimat, Rivalität – game/playerWishesGame.ts)
    const join = willJoin(g, p, buyer, rng);
    if (!join.ok) continue;
    const name = p.fullName;
    transferPlayer(g, p, seller, buyer, fee, today);
    p.contract.weeklyWage = Math.round(join.wishes.demand.min);
    ctx.busy.add(p.id);
    reportDeal(ctx, `${buyer.name} verpflichtet ${name} von ${seller.name} (${fmtPrice(fee)})`, fee, name, buyer, seller.name, need);
    return true;
  }
  return false;
}

// -----------------------------------------------------------------------------
// Kauf im Ausland oder bei unterklassigen Vereinen (Spieler entsteht neu)
// -----------------------------------------------------------------------------
/** Unterklassiger Verein als Herkunft (Ebene unter der Spielerliga, ohne DDR-Staffeln). */
function lowerClubName(g: Game, rng: () => number): string | null {
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const cands = Object.values(g.simClubs ?? {}).filter((c) => c.tier === tier + 1);
  if (!cands.length) return null;
  return cands[Math.floor(rng() * cands.length)].name;
}

function buyExternal(ctx: RoundCtx, club: Club, need: GroupNeed, want: { min: number; ideal: number }, kind: 'ausland' | 'unten'): boolean {
  const { g, rng, year, today } = ctx;
  const lower = kind === 'unten';
  const from = lower ? lowerClubName(g, rng) : 'Ausland';
  if (!from) return false;
  // Unterklassige Spieler sind jünger und etwas schwächer; niemand übertrifft das Liganiveau.
  // Fertige Weltklasse kauft man nicht aus dem Nichts: unterklassig höchstens 79, Ausland höchstens 83.
  // Anziehungskraft: Kleine Vereine locken keine fertigen Leistungsträger von außen (Ruf als Obergrenze).
  const pull = club.reputation + (lower ? 8 : 4);
  const top = lower ? Math.min(want.ideal - 3, ctx.leagueRef - 4, 79, pull) : Math.min(want.ideal, ctx.leagueRef, 83, pull);
  // Liga-Anker wie bei den Nachrückern: ist die Liga zu stark, kommen etwas schwächere Spieler.
  const strength = Math.round(Math.min(want.min + rng() * Math.max(0, want.ideal - want.min), top) + Math.min(0, ctx.anchor));
  if (strength < want.min - (need.quality ? 1 : 4) + Math.min(0, ctx.anchor)) return false;
  let origin = pickOrigin(year, rng, lower);
  for (let i = 0; !lower && i < 6 && origin.nationality === 'GER'; i++) origin = pickOrigin(year, rng);
  if (!lower && origin.nationality === 'GER') origin = ORIGINS.aut ?? origin;
  const posList = GROUP_POS[need.group];
  const p = createPlayer({
    id: `${club.id}_${lower ? 'uk' : 'imp'}${year}_${Math.floor(rng() * 1e9)}`, clubId: club.id, pos: posList[Math.floor(rng() * posList.length)],
    age: lower ? 19 + Math.floor(rng() * 7) : 21 + Math.floor(rng() * 8), strength, year, date: today, rng, shirt: 0, origin,
  });
  refreshOverall(p);
  p.contract.transferValue = marketValueFor(p, year);
  const fee = r5k(p.contract.transferValue * (lower ? 0.7 : 1));
  if (fee > club.finances.transferBudget) return false;
  p.contract.weeklyWage = Math.max(Math.max(5, Math.round(80 * clubWageLevel(club, year))), Math.round(marketWage(p) * Math.max(0.6 * clubWageLevel(club, year), wageRatioOf(g, club))));
  g.players[p.id] = p;
  club.playerIds.push(p.id);
  club.finances.transferBudget -= fee;
  bookTransfer(club, fee, true, p.fullName, today, club.isPlayerControlled);
  recordTransfer(p, from, club.name, Math.round(fee * economyScale(year)), today);
  reportDeal(ctx, lower ? `${club.name} holt ${p.fullName} von ${from} (${fmtPrice(fee)})`
    : `${club.name} holt ${p.fullName} (${origin.nationality}) aus dem Ausland (${fmtPrice(fee)})`, fee, p.fullName, club, from, need);
  return true;
}

export function reportDeal(ctx: RoundCtx, line: string, fee: number, name: string, buyer: Club, from: string, need: GroupNeed | PosGroup): void {
  const group = typeof need === 'string' ? need : need.group;
  const m = market(ctx.g);
  m.news.push(line);
  if (m.news.length > 60) m.news.shift();
  // Spitzentransfers sofort melden.
  if (fee >= 0.45 * capBase(ctx.year, 'germany')) {
    pushMessage(ctx.g.messages, makeMessage({
      date: ctx.today, category: 'transfer', from: 'Sportpresse',
      subject: `Spitzentransfer: ${name} wechselt zu ${buyer.name}`,
      shortText: `${fmtPrice(fee)} Ablöse – ${buyer.shortName} verstärkt die ${GROUP_LABEL[group]}.`,
      bodyText: `${buyer.name} hat ${name} von ${from} verpflichtet. Die Ablöse beträgt ${fmtPrice(fee)}.\n\n`
        + `Der Verein hatte Bedarf in der ${GROUP_LABEL[group]}${buyer.coach ? ` – Trainer ${buyer.coach.name} bekommt seinen Wunschspieler` : ''}.`,
    }));
  }
}

// -----------------------------------------------------------------------------
// Abgänge
// -----------------------------------------------------------------------------
function sellSurplus(g: Game, club: Club, a: SquadAssessment, today: string, max: number): number {
  const cands = Object.values(a.groups).flatMap((x) => x.surplus)
    .filter((p) => club.playerIds.includes(p.id))
    .sort((x, y) => (x.overall - x.age * 0.6) - (y.overall - y.age * 0.6));
  let n = 0;
  for (const p of cands) {
    if (n >= max) break;
    const fee = p.age <= 30 ? r5k(p.contract.transferValue * 0.5) : 0;
    const to = p.age >= 30 || p.overall < a.level - 10 ? 'einen unterklassigen Verein' : 'Ausland';
    market(g).news.push(`${club.name} gibt ${p.fullName} ab (${to === 'Ausland' ? 'ins Ausland' : 'unterklassig'})`);
    sellAbroad(g, p, club, to === 'Ausland' ? 'Ausland' : 'unterklassiger Verein', fee, today);
    n++;
  }
  return n;
}

/** Sommer: einen alternden Ergänzungsspieler abgeben (Platz für Jüngere). */
function releaseVeteran(g: Game, club: Club, squad: Player[], a: SquadAssessment, today: string): void {
  const v = squad.filter((p) => p.age >= 32 && p.overall < a.level - 4 && club.playerIds.includes(p.id))
    .sort((x, y) => (x.overall - x.age) - (y.overall - y.age))[0];
  if (!v) return;
  market(g).news.push(`${club.name} verabschiedet ${v.fullName} (${v.age}) zu einem unterklassigen Verein`);
  sellAbroad(g, v, club, 'unterklassiger Verein', 0, today);
}

/**
 * Transferfenster schließt: Überzählige abgeben, Notnagel-Auffüllen (Sommer),
 * Taktik an den neuen Kader anpassen. Gibt die Schlagzeilen des Fensters zurück.
 */
export function aiWindowClose(g: Game, today: string): string[] {
  const m = market(g);
  const winter = today.slice(5, 7) === '01';
  const year = Number(today.slice(0, 4));
  for (const club of aiClubs(g)) {
    const a = assessSquad(squadOf(g, club), club.tactics?.formation);
    if (club.playerIds.length > MAX_SQUAD + 1) sellSurplus(g, club, a, today, club.playerIds.length - MAX_SQUAD - 1);
    if (!winter) fillSquad(g, club, today, MIN_SQUAD);
    if (club.coach) club.tactics = coachTactics(club, g.players, club.coach, year);
  }
  const news = [...m.news];
  m.news = [];
  return news;
}

// -----------------------------------------------------------------------------
// Für KI-Angebote an den Spieler (game/aiOffers.ts)
// -----------------------------------------------------------------------------
/**
 * KI-Vereine, die für diesen Spieler Bedarf haben und sich die Ablöse leisten
 * können – nach Dringlichkeit sortiert.
 */
export function needBidders(g: Game, p: Player, fee: number): Club[] {
  const group = GROUP_OF[p.naturalPosition];
  return aiClubs(g)
    .filter((c) => c.id !== p.clubId && c.id !== g.managedClubId && c.finances.transferBudget >= fee && c.playerIds.length < BUY_SQUAD_MAX)
    .map((c) => {
      const a = assessSquad(squadOf(g, c), c.tactics?.formation);
      const need = a.groups[group];
      const fits = p.overall >= targetStrength(a, need).min;
      return { c, s: fits ? need.score : 0 };
    })
    .filter((x) => x.s >= 8)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}
