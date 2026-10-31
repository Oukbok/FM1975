// =============================================================================
// NACHWUCHS-INVESTITIONEN — Spielablauf (Rechnung in engine/youthAcademy.ts)
// -----------------------------------------------------------------------------
// • Monatlich (1.): Unterhalt + Etat buchen, fertige Ausbauten freischalten,
//   wirksame Ausbildungsqualität Richtung Ziel bewegen (≈ 20 %/Jahr),
//   Durchlässigkeit aus der Spielpraxis eigener Talente messen.
// • Saisonstart (1. Juli): Ruf der Akademie (Langzeitwert), Verlauf,
//   Leistungszentrum-Pflicht ab 2001/02, WETTBEWERB UM TALENTE: Jedes Jahr gibt
//   es eine Handvoll herausragender 12- bis 16-Jähriger; sie gehen dorthin, wo
//   Ruf, Perspektive und Unterbringung stimmen – sofern das Scouting-Netz sie
//   überhaupt kennt.
// • KI-Vereine investieren vereinfacht nach Umsatz und Trainerphilosophie
//   (Anschluss in game/aiClubs.ts: aiYouthInvest).
// • Zweite Mannschaft: Reserve-Minuten für junge Profis (engine/development.ts).
// =============================================================================
import { ClubDevContext } from '../engine/development';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { generateYouthPlayer } from '../engine/youth';
import {
  annualCostBase, attraction, awayPenalty, BLOCK_BY_KEY, coachCountMax, discoverChance, ETAT_MAX, ETAT_MIN,
  initialInvest, maxLevelIn, needsMet, nlzDutyYear, nlzMissing, NLZ_MIN, NLZ_MIN_COACHES, recruitCapacity,
  reserveMinutesFor, targetQuality, YouthBlockKey, YouthInvest, YOUTH_BLOCKS, academyLevelOf, upkeepBase,
} from '../engine/youthAcademy';
import { Club, Player } from '../types';
import { fmtPrice } from '../ui/format';
import { leagueClubs } from './season';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sim = (g: Game) => !!(g as any).simAutoManage;
/** Wird der Verein vom Spieler gesteuert (sonst KI-Regeln)? */
export const playerControlled = (g: Game, c: Club) => c.id === g.managedClubId && !sim(g);

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/** Nachwuchs-Investitionen eines Vereins (legt sie bei Bedarf an). */
export function youthInvestOf(club: Club, year: number): YouthInvest {
  if (!club.youthInvest) club.youthInvest = initialInvest(club, year);
  const inv = club.youthInvest;
  inv.builds ??= [];
  return inv;
}

/** Idempotente Nachrüstung alter Spielstände (App.tsx beim Laden, newGame). */
export function migrateYouthInvest(g: Game): void {
  const year = yearOf(g.calendar.currentDate);
  for (const c of Object.values(g.clubs)) {
    if (c.id.startsWith('am') || c.id.startsWith('eu_') || c.id.startsWith('w_')) continue;
    youthInvestOf(c, year);
  }
}

// -----------------------------------------------------------------------------
// Aktionen (eigener Verein, auch von der KI genutzt)
// -----------------------------------------------------------------------------
export interface UpgradeQuote { ok: boolean; reason?: string; build: number; months: number; upkeepDelta: number; name: string }

/** Was kostet die nächste Stufe eines Bausteins? (1975-Basis) */
export function quoteUpgrade(club: Club, key: YouthBlockKey, year: number): UpgradeQuote {
  const inv = youthInvestOf(club, year);
  const def = BLOCK_BY_KEY[key];
  const pending = inv.builds.find((b) => b.key === key);
  const cur = pending ? pending.target : inv.levels[key] ?? 0;
  const next = cur + 1;
  const lv = def.levels[next];
  if (!lv) return { ok: false, reason: 'Höchste Stufe erreicht', build: 0, months: 0, upkeepDelta: 0, name: '' };
  const base = { build: lv.build, months: lv.months, name: lv.name, upkeepDelta: (lv.upkeep - (def.levels[cur]?.upkeep ?? 0)) * (key === 'coaches' ? inv.coachCount : 1) };
  if (pending) return { ok: false, reason: 'Ausbau läuft bereits', ...base };
  if (lv.from > year) return { ok: false, reason: `ab ${lv.from}`, ...base };
  if (!needsMet(inv, key, next)) {
    const n = Object.entries(lv.needs ?? {}).map(([k, v]) => `${BLOCK_BY_KEY[k as YouthBlockKey].name} ${BLOCK_BY_KEY[k as YouthBlockKey].levels[v as number].name}`).join(', ');
    return { ok: false, reason: `braucht ${n}`, ...base };
  }
  return { ok: true, ...base };
}

function addMonths(date: string, months: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Nächste Stufe beauftragen: Baukosten sofort, wirksam nach der Bauzeit. */
export function startUpgrade(g: Game, club: Club, key: YouthBlockKey, date: string): string {
  const year = yearOf(date);
  const q = quoteUpgrade(club, key, year);
  if (!q.ok) return q.reason ?? 'Nicht möglich.';
  const inv = youthInvestOf(club, year);
  const target = (inv.levels[key] ?? 0) + 1;
  const mine = club.id === g.managedClubId;
  if (q.build > 0) book(club.finances, date, -Math.round(q.build * economyScale(year)), 'facilities', `Nachwuchs: ${q.name}`, mine);
  if (q.months <= 0) inv.levels[key] = target;
  else inv.builds.push({ key, target, done: addMonths(date, q.months) });
  return q.months <= 0 ? `${q.name} ist ab sofort aktiv.` : `${q.name}: fertig in ${q.months} Monat(en).`;
}

/** Eine Stufe zurückfahren (sofort, keine Erstattung). Laufender Ausbau wird abgebrochen. */
export function downgrade(club: Club, key: YouthBlockKey, year: number): string {
  const inv = youthInvestOf(club, year);
  const idx = inv.builds.findIndex((b) => b.key === key);
  if (idx >= 0) { inv.builds.splice(idx, 1); return 'Ausbau abgebrochen – die Baukosten sind verloren.'; }
  const min = key === 'coaches' ? 1 : 0;
  if ((inv.levels[key] ?? 0) <= min) return 'Niedrigste Stufe.';
  inv.levels[key] -= 1;
  // Abhängige Bausteine fallen mit zurück.
  for (const b of YOUTH_BLOCKS) while ((inv.levels[b.key] ?? 0) > 0 && !needsMet(inv, b.key, inv.levels[b.key])) inv.levels[b.key] -= 1;
  return `${BLOCK_BY_KEY[key].name} auf „${BLOCK_BY_KEY[key].levels[inv.levels[key]].name}“ zurückgefahren.`;
}

export function setCoachCount(club: Club, n: number, year: number): void {
  const inv = youthInvestOf(club, year);
  inv.coachCount = clamp(Math.round(n), 2, coachCountMax(year));
}

export function setYouthBudget(club: Club, base: number, year: number): void {
  const inv = youthInvestOf(club, year);
  inv.budget = clamp(Math.round(base / 5000) * 5000, ETAT_MIN, ETAT_MAX);
}

// -----------------------------------------------------------------------------
// Monatlich
// -----------------------------------------------------------------------------
/** Anteil eigener Talente (≤ 23) mit Spielpraxis bei den Profis → Zielwert der Durchlässigkeit. */
function perspectiveTarget(g: Game, club: Club, inv: YouthInvest): number {
  let s = 0;
  for (const id of club.playerIds) {
    if (!id.startsWith(club.id + '_y_')) continue;
    const p = g.players[id];
    if (!p || p.age > 23) continue;
    s += Math.min(1, (p.development.recentMinutes ?? 0) / 450);
  }
  return clamp(s * 24 + (inv.levels.reserve ?? 0) * 8, 0, 100);
}

export function monthlyYouthInvest(g: Game, today: string): void {
  const month = today.slice(0, 7);
  if (g.youthInvestTick === month) return;
  g.youthInvestTick = month;
  const year = yearOf(today);
  const scale = economyScale(year);
  const mon = Number(today.slice(5, 7));
  for (const club of leagueClubs(g)) {
    const inv = youthInvestOf(club, year);
    const mine = club.id === g.managedClubId;
    // Fertige Ausbauten.
    for (const b of [...inv.builds]) {
      if (b.done > today) continue;
      inv.levels[b.key] = Math.max(inv.levels[b.key] ?? 0, b.target);
      inv.builds.splice(inv.builds.indexOf(b), 1);
      if (mine && !sim(g)) {
        pushMessage(g.messages, makeMessage({
          date: today, category: 'training', from: 'Leiter Jugendakademie',
          subject: `Nachwuchs: ${BLOCK_BY_KEY[b.key].levels[b.target].name} ist fertig`,
          shortText: `${BLOCK_BY_KEY[b.key].name} ab sofort auf neuer Stufe.`,
          bodyText: `${BLOCK_BY_KEY[b.key].levels[b.target].name} ist fertig. Die Ausbildungsqualität steigt jetzt Schritt für Schritt – Trainer, Abläufe und Konzept brauchen Zeit. Rechne mit spürbaren Effekten bei den Talenten erst in einigen Jahren.`,
        }));
      }
    }
    // Kosten.
    const cost = Math.round(annualCostBase(inv) / 12 * scale);
    if (cost > 0) book(club.finances, today, -cost, 'training_facilities', 'Nachwuchs: Jugendetat, Trainer, Unterhalt', mine && !sim(g));
    // Verzögerte Wirkung: aufwärts ≈ 20 %/Jahr, abwärts schneller (Trainer gehen, Abläufe zerfallen).
    const target = targetQuality(club, inv, year);
    const rate = target >= inv.quality ? 0.019 : 0.035;
    inv.quality = Math.round((inv.quality + (target - inv.quality) * rate) * 10) / 10;
    if (mon >= 9 || mon <= 5) {
      inv.perspective = Math.round((inv.perspective + (perspectiveTarget(g, club, inv) - inv.perspective) * 0.1) * 10) / 10;
    }
  }
}

// -----------------------------------------------------------------------------
// Saisonstart (1. Juli, vor dem Jahrgangswechsel)
// -----------------------------------------------------------------------------
/** Erfolg eigener Absolventen (für den Ruf): wer spielt bei den Profis, wie gut? */
function graduateSuccess(g: Game, club: Club): number {
  const pre = club.id + '_y_';
  let n = 0, best = 0;
  for (const p of Object.values(g.players)) {
    if (!p.id.startsWith(pre) || p.isYouth) continue;
    if (p.overall >= 70) n++;
    best = Math.max(best, p.overall);
  }
  return clamp(n * 9 + Math.max(0, best - 66) * 3, 0, 100);
}

export function youthInvestSeasonStart(g: Game, today: string): void {
  const year = yearOf(today);
  if ((g.youthRace?.year ?? 0) >= year) return;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const duty = nlzDutyYear(tier);
  const season = `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
  for (const club of leagueClubs(g)) {
    const inv = youthInvestOf(club, year);
    // Ruf: Langzeitwert aus Ausbildung, Vereinsgröße und Erfolg eigener Talente (≈ 15 %/Jahr).
    const target = 0.45 * inv.quality + 0.2 * (club.reputation ?? 50) + 0.35 * graduateSuccess(g, club);
    inv.reputation = Math.round(clamp(inv.reputation + (target - inv.reputation) * 0.15, 0, 100) * 10) / 10;
    (inv.history ??= []).push({ season, quality: Math.round(inv.quality), reputation: Math.round(inv.reputation), spend: annualCostBase(inv) });
    if (inv.history.length > 40) inv.history.splice(0, inv.history.length - 40);
    // Leistungszentrum-Pflicht.
    if (duty != null && year >= duty) {
      const miss = nlzMissing(club, inv);
      if (!playerControlled(g, club)) { if (miss.length) aiMeetNlz(club, inv, year); }
      else if (miss.length) {
        const fine = 60000;
        book(club.finances, today, -Math.round(fine * economyScale(year)), 'other', 'Lizenzauflage: Leistungszentrum fehlt', true);
        inv.reputation = Math.max(0, inv.reputation - 5);
        pushMessage(g.messages, makeMessage({
          date: today, category: 'board', from: 'Lizenzierungsausschuss',
          subject: 'Lizenzauflage: Leistungszentrum unvollständig',
          shortText: `Geldstrafe ${fmtPrice(fine)} – das Nachwuchsleistungszentrum fehlt.`,
          bodyText: `Seit ${duty}/${String((duty + 1) % 100).padStart(2, '0')} ist ein Leistungszentrum Lizenzbedingung für deine Liga. Es fehlt noch:\n• ${miss.join('\n• ')}\n\nBis das erfüllt ist, gibt es jedes Jahr eine Geldstrafe und der Ruf der Akademie leidet. (Kader → Akademie)`,
          actionRequired: true,
        }));
      }
    } else if (duty != null && year === duty - 1 && playerControlled(g, club)) {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Lizenzierungsausschuss',
        subject: `Ab ${duty}: Leistungszentrum wird Pflicht`,
        shortText: 'Nach dem EM-Aus 2000 verlangt die Liga eigene Nachwuchsleistungszentren.',
        bodyText: `Ab der Saison ${duty}/${String((duty + 1) % 100).padStart(2, '0')} bekommt in deiner Liga nur noch eine Lizenz, wer ein Leistungszentrum betreibt. Mindestens: ${Object.entries(NLZ_MIN).map(([k, v]) => `${BLOCK_BY_KEY[k as YouthBlockKey].name} „${BLOCK_BY_KEY[k as YouthBlockKey].levels[v as number].name}“`).join(', ')} und ${NLZ_MIN_COACHES} Jugendtrainer. Plane die Bauzeiten ein.`,
      }));
    }
  }
  talentRace(g, today, year);
}

// -----------------------------------------------------------------------------
// Wettbewerb um Talente
// -----------------------------------------------------------------------------
export interface YouthRaceEntry {
  name: string; pos: string; age: number; foreign: boolean;
  /** Ziel-Verein (ID) oder '' = anderswo. */
  to: string; toName: string;
  /** Kannten deine Scouts das Talent? / War es ein Talent aus deiner Stadt? */
  known: boolean; home: boolean;
  /** Scouting-Mitte (Sterne), wie deine Scouts es sahen. */
  stars: number;
  playerId?: string;
}
export interface YouthRaceLog { year: number; entries: YouthRaceEntry[]; myRank: number; clubs: number }

/** Anzahl herausragender Talente im Jahr (DFB-Talentförderprogramm ab 2002 findet mehr). */
function poolSize(year: number): { dom: number; foreign: number } {
  return { dom: 12 + (year >= 1990 ? 2 : 0) + (year >= 2002 ? 3 : 0), foreign: year >= 1996 ? (year >= 2010 ? 5 : 3) : 0 };
}

function talentRace(g: Game, today: string, year: number): void {
  const clubs = leagueClubs(g);
  if (!clubs.length) return;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const { dom, foreign } = poolSize(year);
  const taken = new Map<string, number>();
  const entries: YouthRaceEntry[] = [];
  const my = g.clubs[g.managedClubId];
  const attr = new Map(clubs.map((c) => [c.id, attraction(c) - (tier >= 2 ? 6 : 0)]));
  for (let i = 0; i < dom + foreign; i++) {
    const isForeign = i >= dom;
    const seed = `race_${year}_${i}`;
    const r = (k: string) => hash01(`${seed}:${k}`);
    // Heimat: ein Verein der Liga oder anderswo (dort konkurriert der örtliche Profiverein).
    const home = !isForeign && r('home') < 0.55 ? clubs[Math.floor(r('hc') * clubs.length)] : null;
    const age = isForeign ? 15 + Math.floor(r('age') * 2) : 12 + Math.floor(r('age') * 4);
    let best: Club | null = null, bestScore = 30 + r('else') * 22 + (home ? 0 : 18); // „anderswo“
    for (const c of clubs) {
      if ((taken.get(c.id) ?? 0) >= recruitCapacity(c.youthInvest)) continue;
      const isHome = home?.id === c.id;
      if (!isHome && r(`d:${c.id}`) >= discoverChance(c.youthInvest, isForeign, year)) continue;
      const s = (attr.get(c.id) ?? 30) + (isHome ? 22 : -awayPenalty(c.youthInvest, age)) + (r(`n:${c.id}`) - 0.5) * 16;
      if (s > bestScore) { best = c; bestScore = s; }
    }
    const known = !!my && (home?.id === my.id || r(`d:${my.id}`) < discoverChance(my.youthInvest, isForeign, year));
    // Das Talent wird beim Zielverein erzeugt (ein Jahr jünger: der Jahrgangswechsel altert es gleich).
    const holder = best ?? my ?? clubs[0];
    const p = generateYouthPlayer(holder.id, seed, today, academyLevelOf(holder), age - 1, {
      pool: 'talent', potBias: 0.25, foreign: isForeign,
    });
    const entry: YouthRaceEntry = {
      name: p.fullName, pos: p.naturalPosition, age, foreign: isForeign, to: best?.id ?? '', toName: best?.name ?? 'anderer Verein',
      known, home: home?.id === my?.id, stars: ((p.scoutedPotentialMin ?? 3) + (p.scoutedPotentialMax ?? 3)) / 2,
    };
    if (best) {
      taken.set(best.id, (taken.get(best.id) ?? 0) + 1);
      g.youthPlayers[p.id] = p;
      best.youthPlayerIds.push(p.id);
      entry.playerId = p.id;
    }
    entries.push(entry);
  }
  const ranked = [...clubs].sort((a, b) => (attr.get(b.id) ?? 0) - (attr.get(a.id) ?? 0));
  g.youthRace = { year, entries, myRank: my ? ranked.findIndex((c) => c.id === my.id) + 1 : 0, clubs: clubs.length };
  if (my && !sim(g)) raceMessage(g, today, g.youthRace);
}

function raceMessage(g: Game, today: string, log: YouthRaceLog): void {
  const mine = log.entries.filter((e) => e.to === g.managedClubId);
  const lost = log.entries.filter((e) => e.known && e.to !== g.managedClubId);
  if (!mine.length && !lost.length) return;
  const line = (e: YouthRaceEntry) => `• ${e.name} (${e.pos}, ${e.age}${e.foreign ? ', Ausland' : ''}${e.home ? ', aus unserer Stadt' : ''})`;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Leiter Jugendakademie',
    subject: `Talentwettbewerb: ${mine.length} Zusage(n), ${lost.length} Absage(n)`,
    shortText: mine.length ? `${mine[0].name} kommt in unsere Akademie.` : `${lost[0].name} geht zu ${lost[0].toName}.`,
    bodyText: (mine.length ? `Zugesagt haben:\n${mine.map(line).join('\n')}\n\n` : '')
      + (lost.length ? `Abgesagt (wir kannten sie):\n${lost.map((e) => `${line(e)} → ${e.toName}`).join('\n')}\n\n` : '')
      + `Talente achten auf den Ruf der Akademie, das Ansehen des Vereins, Einsatzchancen bei den Profis und – wenn sie nicht von hier sind – auf ein Internat. Deine Anziehungskraft: Platz ${log.myRank} von ${log.clubs}.`,
  }));
}

// -----------------------------------------------------------------------------
// KI-Vereine (vereinfacht)
// -----------------------------------------------------------------------------
/** Reihenfolge, in der die KI ausbaut (Schritt = Baustein + Zielstufe). */
const AI_STEPS: [YouthBlockKey, number][] = [
  ['coaches', 2], ['reserve', 1], ['pitches', 1], ['scouting', 1], ['coaches', 3], ['pitches', 2], ['boarding', 1],
  ['school', 1], ['coaches', 4], ['scouting', 2], ['pitches', 3], ['boarding', 2], ['reserve', 2], ['science', 1],
  ['coaches', 5], ['school', 2], ['science', 2], ['pitches', 4], ['boarding', 3], ['scouting', 3], ['science', 3],
];

function aiMeetNlz(club: Club, inv: YouthInvest, year: number): void {
  for (const [k, v] of Object.entries(NLZ_MIN) as [YouthBlockKey, number][]) inv.levels[k] = Math.max(inv.levels[k] ?? 0, Math.min(v, maxLevelIn(k, year)));
  inv.coachCount = Math.max(inv.coachCount, NLZ_MIN_COACHES);
  void club;
}

/**
 * Jährliche Investitionsentscheidung eines KI-Vereins (Sommer). Ziel: ein
 * Anteil des Umsatzes je nach Philosophie des Trainers („jugend“ deutlich mehr,
 * „einkauf“ weniger). Höchstens ein neuer Ausbau pro Jahr; zu teuer → zurückfahren.
 */
export function aiYouthInvest(g: Game, club: Club, today: string, revenue: number): void {
  const year = yearOf(today);
  const inv = youthInvestOf(club, year);
  const phil = club.coach?.philosophy ?? 'ausgewogen';
  const share = 0.032 + (year >= 2001 ? 0.012 : 0) + (phil === 'jugend' ? 0.022 : phil === 'einkauf' ? -0.01 : 0)
    + clamp(((club.reputation ?? 55) - 60) / 1000, -0.01, 0.015);
  // Umsatz in 1975-Basis, gedeckelt auf ein realistisches Niveau (Erstligist ≈ 4,5 Mio. DM 1975).
  const realistic = 4_500_000 * clamp((club.reputation ?? 60) / 72, 0.5, 1.6) * 1.3;
  const target = share * Math.min(revenue / economyScale(year), realistic);
  const coachTarget = clamp(Math.round(target / 30000) + 4, 4, coachCountMax(year));
  inv.coachCount = clamp(inv.coachCount + Math.sign(coachTarget - inv.coachCount), 2, coachCountMax(year));
  inv.budget = clamp(Math.round(target * 0.22 / 5000) * 5000, ETAT_MIN, ETAT_MAX);
  const cost = () => annualCostBase(inv);
  if (cost() > target * 1.3) {
    // Zu teuer: den zuletzt gewählten (teuersten) Schritt zurückfahren.
    for (let i = AI_STEPS.length - 1; i >= 0; i--) {
      const [k, v] = AI_STEPS[i];
      if ((inv.levels[k] ?? 0) >= v && v > (k === 'coaches' ? 2 : 0) && !(year >= 2001 && (NLZ_MIN[k] ?? 0) >= v)) { downgrade(club, k, year); break; }
    }
    return;
  }
  if (inv.builds.length) return;
  for (const [k, v] of AI_STEPS) {
    if ((inv.levels[k] ?? 0) >= v) continue;
    const q = quoteUpgrade(club, k, year);
    if (!q.ok) continue;
    if (upkeepBase(inv) + inv.budget + q.upkeepDelta > target) return;
    if (q.build * economyScale(year) > club.finances.balance * 0.5) return;
    startUpgrade(g, club, k, today);
    return;
  }
}

// -----------------------------------------------------------------------------
// Zweite Mannschaft → Entwicklungs-Kontext
// -----------------------------------------------------------------------------
/** Ergänzt den Entwicklungs-Kontext um Reserve-Minuten (U23 ohne Profi-Einsatz). */
export function withReserve(ctxFor: (c: Club) => ClubDevContext, today: string): (c: Club) => ClubDevContext {
  // Sommerpause (Juni/Juli): auch die zweite Mannschaft spielt nicht.
  const off = ['06', '07'].includes(today.slice(5, 7));
  return (club) => {
    const ctx = ctxFor(club);
    if (off || !club.youthInvest || !(club.youthInvest.levels.reserve > 0)) return ctx;
    return { ...ctx, reserve: (p: Player, proMinutes: number) => reserveMinutesFor(club, p.age, proMinutes, p.id) };
  };
}
