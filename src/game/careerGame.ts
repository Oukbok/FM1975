// =============================================================================
// TRAINERKARRIERE IM SPIELABLAUF — Jobangebote, Entlassung, Saisonbilanz
// -----------------------------------------------------------------------------
// • Ansehen (0–100, game/careerState.ts) steigt mit Über-Erfüllung des Saisonziels,
//   Titeln und Aufstiegen, sinkt bei Misserfolg und Entlassung.
// • Angebote zum Saisonende (Stichtage 20.1., 10.4., 10.5., 28.5.): größere
//   Vereine aus 1. und 2. Liga, deren Größe zu deinem Ansehen passt. Läuft deine
//   Saison besser als erwartet, melden sie sich häufiger.
// • Sofort-Angebote: Entlässt ein größerer Verein deiner Liga mitten in der Saison
//   seinen Trainer, fragt er manchmal zuerst bei dir an.
// • Entscheidung per Nachricht (Weiter-Sperre über pendingDecisions): annehmen,
//   nachverhandeln (Gehalt/Budget, Risiko: Rückzug) oder ablehnen.
// • Nur im Karriere-Modus (Assistent „Neues Spiel“ › Modus) kann dich der
//   Vorstand entlassen: mitten in der Saison nach einem Ultimatum (dann
//   Feuerwehr-Angebote aus deiner Liga) oder zum Saisonende (Angebote kleinerer
//   Vereine). Eine Wahl ist dann Pflicht.
// Ausland und Nationalmannschaft: nicht möglich (nur deutsche Ligen haben volle Kader).
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { yearOf } from '../engine/economy';
import { expectedPosition } from '../engine/environment';
import { makeMessage, pushMessage } from '../engine/messages';
import { fmtPrice } from '../ui/format';
import { aiTransferBudget } from './aiClubs';
import { noteSquad } from './aiSquadLog';
import { CHOICE_HANDLERS } from './eventsGame';
import {
  CareerState, careerLog, clubNameOf, currentStint, ensureCareer, goalFor, isCareerMode, isJobClub, JobOffer, jobLevel,
  managerWageFor, playerTier, tierOf,
} from './careerState';
import { careerSeasonSwitchStart, careerSeasonSwitchFinish, switchClubNow } from './careerSwitch';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r5k = (v: number) => Math.round(v / 5000) * 5000;
const OFFER_TYPE = 'career_offer';
const SACK_TYPE = 'career_sacked';
const OFFER_DAYS = new Set(['01-20', '04-10', '05-10', '05-28']);

const sim = (g: Game) => !!(g as any).simAutoManage;
/** In der Simulation nur mit HUMAN=1 (tests/sim.ts setzt `simCareer`). */
const active = (g: Game) => !sim(g) || !!(g as any).simCareer;

function hashRand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

function ownPos(g: Game): { pos: number; size: number; played: number; exp: number } {
  const rows = g.table.rows;
  const i = rows.findIndex((r) => r.clubId === g.managedClubId);
  const club = g.clubs[g.managedClubId];
  const size = rows.length || 18;
  return { pos: i + 1 || size, size, played: rows[i]?.played ?? 0, exp: expectedPosition(club?.boardExpectation ?? '', size) };
}

/** Erfolg der laufenden Saison gegen das Ziel (−1 … +1). */
function successNow(g: Game): number {
  const o = ownPos(g);
  if (o.played < 6) return 0;
  return clamp((o.exp - o.pos) / Math.max(2, o.size / 4), -1, 1);
}

// -----------------------------------------------------------------------------
// Angebote
// -----------------------------------------------------------------------------
export function makeOffer(g: Game, clubId: string, when: JobOffer['when'], why: string, today: string, forced = false): JobOffer {
  const c = ensureCareer(g);
  const level = jobLevel(g, clubId);
  const full = g.clubs[clubId];
  const year = yearOf(today);
  const budget = full ? r5k(aiTransferBudget(full, year, g.season) * 1.1) : r5k(Math.pow(Math.max(0, level - 35), 2) * 120);
  const endCap = `${Number(today.slice(0, 4)) + (Number(today.slice(5, 7)) >= 7 ? 1 : 0)}-06-25`;
  const dl = CalendarEngine.addDays(today, when === 'sofort' ? 4 : 10);
  return {
    id: `jo_${today}_${clubId}`, clubId, clubName: clubNameOf(g, clubId), tier: tierOf(g, clubId) ?? 2, level,
    when, wage: managerWageFor(level, c.rep), goal: goalFor(g, clubId), budget, date: today,
    deadline: when === 'saisonende' && dl > endCap ? endCap : dl, forced: forced || undefined, why,
  };
}

function offerText(g: Game, o: JobOffer): string {
  const league = o.tier === 1 ? '1. Liga' : o.tier === 2 ? '2. Liga' : `${o.tier}. Ebene`;
  return `Verein: ${o.clubName} (${league})\n`
    + `Wechsel: ${o.when === 'sofort' ? 'sofort – du übernimmst mitten in der Saison' : 'zum Saisonende (1. Juli)'}\n`
    + `Jahresgehalt: ${fmtPrice(o.wage)}\n`
    + `Saisonziel: ${o.goal}\n`
    + `Transferbudget: ${fmtPrice(o.budget)}`;
}

function pushOffer(g: Game, o: JobOffer): void {
  const c = ensureCareer(g);
  c.offers.push(o);
  c.offerCount++;
  noteSquad(g, 'jobOffers');
  const own = g.clubs[g.managedClubId];
  const msg = makeMessage({
    date: o.date, category: 'board', from: `Präsident ${g.clubs[o.clubId]?.shortName ?? g.simClubs?.[o.clubId]?.shortName ?? o.clubName}`,
    subject: o.improved ? `${o.clubName} bessert nach` : `${o.clubName} will dich als Trainer`,
    shortText: `${o.when === 'sofort' ? 'Sofort' : 'Zum Saisonende'} · ${fmtPrice(o.wage)} im Jahr · Ziel: ${o.goal}.`,
    bodyText: `${o.improved ? 'Nach deinen Forderungen hat der Verein sein Angebot verbessert.' : `${o.why} ${o.clubName} möchte dich als neuen Cheftrainer verpflichten.`}\n\n${offerText(g, o)}\n\n`
      + (o.when === 'sofort'
        ? `Nimmst du an, verlässt du ${own?.name ?? 'deinen Verein'} sofort; dort übernimmt ein Nachfolger aus dem Trainerkarussell.`
        : `Nimmst du an, führst du ${own?.name ?? 'deinen Verein'} bis zum Saisonende und wechselst zum 1. Juli.`)
      + `\n\nOhne Antwort bis ${CalendarEngine.formatDate(o.deadline)} gilt das Angebot als abgelehnt.`,
    actionRequired: true,
  });
  msg.choices = [
    { id: 'ja', label: 'Annehmen', hint: o.when === 'sofort' ? 'Wechsel sofort' : 'Wechsel zum 1. Juli' },
    ...(o.improved ? [] : [{ id: 'mehr', label: 'Nachverhandeln', hint: 'Mehr Gehalt und Budget – der Verein kann abspringen' }]),
    { id: 'nein', label: 'Ablehnen' },
  ];
  msg.eventRef = { type: OFFER_TYPE, deadline: o.deadline, defaultChoice: (g as any).simCareerAccept ? 'ja' : 'nein', data: { offer: o.id } };
  pushMessage(g.messages, msg);
}

/** Kandidaten für ein Angebot zum Saisonende (größer als dein Verein, passend zu deinem Ansehen). */
export function offerCandidates(g: Game): { id: string; level: number; fav: boolean }[] {
  const c = ensureCareer(g);
  const own = g.managedClubId;
  const l0 = jobLevel(g, own);
  const fav = g.manager?.favoriteClubId;
  const ids = [...g.table.rows.map((r) => r.clubId), ...Object.keys(g.simClubs ?? {})];
  const out: { id: string; level: number; fav: boolean }[] = [];
  for (const id of ids) {
    if (id === own || id === g.manager?.avoidClubId || c.declined[id] === g.season || !isJobClub(g, id)) continue;
    if (c.offers.some((o) => o.clubId === id)) continue;
    const level = jobLevel(g, id);
    const isFav = id === fav;
    if (level > c.rep + 5) continue;
    if (level < l0 + 3 && !(isFav && level >= l0 - 5)) continue;
    out.push({ id, level, fav: isFav });
  }
  return out;
}

export function rollJobOffers(g: Game, today: string, rng: () => number = Math.random): JobOffer | null {
  const c = ensureCareer(g);
  if (c.pendingMove || c.offers.filter((o) => !o.forced).length >= 2) return null;
  const cands = offerCandidates(g);
  if (!cands.length) return null;
  const l0 = jobLevel(g, g.managedClubId);
  const diff = g.difficulty === 'hard' ? 0.8 : g.difficulty === 'easy' ? 1.2 : 1;
  const p = clamp(0.04 + (c.rep - l0) / 30 + successNow(g) * 0.12 + (cands.some((x) => x.fav) ? 0.08 : 0), 0, 0.5) * diff;
  if (rng() >= p) return null;
  const w = cands.map((x) => (1 / (1 + Math.abs(c.rep - x.level) / 6)) * (x.fav ? 3 : 1));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  let pick = cands[0];
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) { pick = cands[i]; break; } }
  const why = pick.fav ? 'Dein Herzensverein meldet sich.' : successNow(g) > 0.3 ? 'Deine Arbeit hat sich herumgesprochen.' : 'Der Verein sucht für die neue Saison einen Trainer.';
  const o = makeOffer(g, pick.id, 'saisonende', why, today);
  pushOffer(g, o);
  return o;
}

/** Ein größerer Verein deiner Liga hat heute seinen Trainer entlassen → Anfrage an dich? */
function sackedTodayOffer(g: Game, today: string, rng: () => number): void {
  const c = ensureCareer(g);
  const m = Number(today.slice(5, 7));
  if (c.pendingMove || (m >= 4 && m <= 7)) return;
  const l0 = jobLevel(g, g.managedClubId);
  for (const row of g.table.rows) {
    const club = g.clubs[row.clubId];
    const h = club?.coachHistory?.[club.coachHistory.length - 1];
    if (!club || club.id === g.managedClubId || !h || h.to !== today || h.reason !== 'entlassen' || h.human) continue;
    const level = jobLevel(g, club.id);
    if (level < l0 + 2 || c.rep < level - 4 || c.declined[club.id] === g.season || rng() >= 0.5) continue;
    pushOffer(g, makeOffer(g, club.id, 'sofort', `${club.name} hat sich heute von Trainer ${h.name} getrennt.`, today));
    return;
  }
}

function resolveOtherOffers(g: Game, keepId?: string): void {
  const c = ensureCareer(g);
  for (const m of g.messages) {
    const ref = m.eventRef;
    if (!ref || ref.resolved || (ref.type !== OFFER_TYPE && ref.type !== SACK_TYPE) || ref.data?.offer === keepId) continue;
    ref.resolved = 'verfallen';
    m.actionRequired = false;
    m.resultText = 'Hinfällig – du hast dich anders entschieden.';
  }
  c.offers = c.offers.filter((o) => o.id === keepId);
}

function acceptOffer(g: Game, o: JobOffer, reason: 'wechsel' | 'entlassen'): string {
  const c = ensureCareer(g);
  resolveOtherOffers(g, o.id);
  c.offers = c.offers.filter((x) => x.id !== o.id);
  const sameLeague = !!g.clubs[o.clubId] && g.table.rows.some((r) => r.clubId === o.clubId);
  if (o.when === 'sofort' && sameLeague) {
    switchClubNow(g, o.clubId, o, reason);
    return `Du bist neuer Trainer von ${o.clubName}.`;
  }
  c.pendingMove = { ...o, when: 'saisonende', fromId: g.managedClubId, reason };
  careerLog(g, `Zusage an ${o.clubName} zum 1. Juli`);
  return `Du wechselst zum 1. Juli zu ${o.clubName}. Bis dahin führst du ${clubNameOf(g, g.managedClubId)} weiter.`;
}

CHOICE_HANDLERS[OFFER_TYPE] = (g, ref, choice) => {
  const c = ensureCareer(g);
  const o = c.offers.find((x) => x.id === ref.data?.offer);
  if (!o) return { text: 'Das Angebot ist nicht mehr gültig.' };
  if (choice === 'ja') return { text: acceptOffer(g, o, 'wechsel') };
  c.offers = c.offers.filter((x) => x.id !== o.id);
  if (choice === 'mehr') {
    const r = hashRand(`${o.id}|mehr`);
    if (r < clamp(0.55 + (c.rep - o.level) / 40, 0.25, 0.85)) {
      const today = g.calendar.currentDate;
      const better: JobOffer = { ...o, id: `${o.id}+`, wage: Math.round(o.wage * 1.2 / 1000) * 1000, budget: r5k(o.budget * 1.15), improved: true, date: today,
        deadline: o.when === 'sofort' ? CalendarEngine.addDays(today, 3) : (CalendarEngine.addDays(today, 5) < o.deadline ? o.deadline : CalendarEngine.addDays(today, 5)) };
      c.offerCount--; // gleiches Angebot, nur nachgebessert
      pushOffer(g, better);
      return { text: `${o.clubName} prüft deine Forderungen – ein neues Angebot liegt im Postfach.` };
    }
    c.declined[o.clubId] = g.season;
    return { text: `${o.clubName} zieht das Angebot zurück: Die Forderungen gehen dem Vorstand zu weit.` };
  }
  c.declined[o.clubId] = g.season;
  return { text: `Du bleibst. ${o.clubName} sucht weiter.` };
};

// -----------------------------------------------------------------------------
// Entlassung (nur Karriere-Modus)
// -----------------------------------------------------------------------------
function sack(g: Game, today: string, midSeason: boolean): boolean {
  const c = ensureCareer(g);
  const own = g.clubs[g.managedClubId];
  if (!own) return false;
  const l0 = jobLevel(g, own.id);
  let offers: JobOffer[] = [];
  if (midSeason) {
    // Feuerwehr-Jobs: Vereine deiner Liga, deren Trainer am stärksten wackelt.
    offers = g.table.rows.map((r) => g.clubs[r.clubId]).filter((x) => x && x.id !== own.id && x.coach && jobLevel(g, x.id) <= Math.min(c.rep + 4, l0))
      .sort((a, b) => (b!.coach!.pressure) - (a!.coach!.pressure)).slice(0, 3)
      .map((x) => makeOffer(g, x!.id, 'sofort', `${x!.name} steckt in der Krise und sucht einen Feuerwehrmann.`, today, true));
  } else {
    const ids = [...g.table.rows.map((r) => r.clubId), ...Object.keys(g.simClubs ?? {})]
      .filter((id) => id !== own.id && id !== g.manager?.avoidClubId && isJobClub(g, id))
      .map((id) => ({ id, l: jobLevel(g, id) })).filter((x) => x.l <= l0 - 2 && x.l >= c.rep - 25)
      .sort((a, b) => b.l - a.l);
    offers = [ids[0], ids[Math.floor(ids.length / 3)], ids[Math.floor(ids.length / 2)]].filter((x, i, a) => x && a.indexOf(x) === i)
      .map((x) => makeOffer(g, x!.id, 'saisonende', 'Der Verein sucht einen Trainer für die neue Saison.', today, true));
  }
  if (!offers.length) return false;
  c.sacked++;
  c.rep = clamp(c.rep - 6, 5, 99);
  careerLog(g, `Entlassen bei ${own.name}`);
  c.offers.push(...offers);
  c.offerCount += offers.length;
  noteSquad(g, 'jobOffers', offers.length);
  const msg = makeMessage({
    date: today, category: 'board', from: 'Vorstand',
    subject: midSeason ? `${own.name} trennt sich von dir` : `Keine Zukunft bei ${own.name}`,
    shortText: midSeason ? 'Der Vorstand hat dich freigestellt – es gibt Angebote.' : 'Dein Vertrag endet zum Saisonende – wähle deinen nächsten Verein.',
    bodyText: (midSeason
      ? `Der Vorstand hat nach anhaltendem Misserfolg die Reißleine gezogen. Du bist mit sofortiger Wirkung freigestellt.\n\n`
      : `Das Saisonziel „${own.boardExpectation}“ wurde klar verfehlt. Der Vorstand wird deinen Vertrag nicht fortsetzen.\n\n`)
      + `Dein Berater hat schon Gespräche geführt. Diese Vereine wollen dich:\n\n${offers.map((o) => offerText(g, o)).join('\n\n')}\n\nDu musst dich für einen entscheiden.`,
    actionRequired: true,
  });
  msg.choices = offers.map((o) => ({ id: `o:${o.id}`, label: o.clubName, hint: `${o.when === 'sofort' ? 'sofort' : 'zum 1. Juli'} · Ziel: ${o.goal}` }));
  msg.eventRef = { type: SACK_TYPE, deadline: offers[0].deadline, defaultChoice: `o:${offers[0].id}`, data: { offer: offers[0].id } };
  pushMessage(g.messages, msg);
  return true;
}

CHOICE_HANDLERS[SACK_TYPE] = (g, _ref, choice) => {
  const c = ensureCareer(g);
  const o = c.offers.find((x) => `o:${x.id}` === choice) ?? c.offers.find((x) => x.forced);
  if (!o) return { text: 'Kein Angebot mehr offen.' };
  return { text: acceptOffer(g, o, 'entlassen') };
};

function boardCheck(g: Game, today: string): void {
  if (!isCareerMode(g)) return;
  const c = ensureCareer(g);
  const own = g.clubs[g.managedClubId];
  if (!own || c.pendingMove || c.offers.some((o) => o.forced)) return;
  const conf = own.boardConfidence ?? 60;
  const st = currentStint(g);
  const o = ownPos(g);
  const m = Number(today.slice(5, 7));
  if (today.slice(8) === '01' && (m >= 10 || m <= 4) && o.played >= 8 && dayDiff(st.from, today) >= 100) {
    if (conf > 12) return;
    if (c.lastChance !== g.season) {
      c.lastChance = g.season;
      own.boardConfidence = 18;
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Vorstand', subject: 'Ultimatum des Vorstands',
        shortText: 'Letzte Chance: Ohne Wende bist du deinen Job los.',
        bodyText: `Platz ${o.pos}, Ziel „${own.boardExpectation}“. Der Vorstand stellt dir ein Ultimatum: Ändert sich bis zum nächsten Monat nichts, trennen wir uns.`,
      }));
      return;
    }
    sack(g, today, true);
    return;
  }
  if (today.slice(5) === '06-05' && conf < 25 && o.pos > o.exp + 2) sack(g, today, false);
}

// -----------------------------------------------------------------------------
// Täglicher Einstieg und Saisonwechsel
// -----------------------------------------------------------------------------
export function careerDaily(g: Game, today: string, rng: () => number = Math.random): void {
  if (!active(g) || !g.clubs[g.managedClubId]) return;
  const c = ensureCareer(g);
  // Verfallene Angebote aufräumen (Nachricht wird über autoResolveEvents entschieden).
  c.offers = c.offers.filter((o) => o.deadline >= today || g.messages.some((m) => m.eventRef?.data?.offer === o.id && !m.eventRef.resolved));
  boardCheck(g, today);
  sackedTodayOffer(g, today, rng);
  if (OFFER_DAYS.has(today.slice(5))) rollJobOffers(g, today, rng);
}

/** Saisonbilanz für dein Ansehen (startNextSeason, Endtabelle liegt noch vor). */
export function careerSeasonReview(g: Game): CareerState | null {
  if (!g.clubs[g.managedClubId] || !g.table.rows.length) return null;
  const c = ensureCareer(g);
  const st = currentStint(g);
  const own = g.clubs[g.managedClubId];
  const o = ownPos(g);
  const tier = playerTier(g);
  const titles: string[] = [];
  if (tier === 1 && o.pos === 1) titles.push('Meisterschaft');
  if (g.cup?.winnerClubId === own.id) titles.push('Pokalsieg');
  for (const cup of Object.values(g.euroCups ?? {})) if (cup?.winnerClubId === own.id) titles.push('Europapokal');
  if (tier >= 2 && o.pos <= 2) titles.push('Aufstieg');
  let d = clamp((o.exp - o.pos) * (tier === 1 ? 1.3 : 0.9), -8, 8);
  d += titles.reduce((a, t) => a + (t === 'Meisterschaft' ? 7 : t === 'Europapokal' ? 8 : t === 'Pokalsieg' ? 3 : 3), 0);
  if (d > 0) d *= clamp((100 - c.rep) / 45, 0.25, 1.2);
  c.rep = Math.round(clamp(c.rep + d, 5, 99) * 10) / 10;
  st.seasons.push({ season: g.season, tier, pos: o.pos, size: o.size, goal: own.boardExpectation, ok: o.pos <= o.exp, dRep: Math.round(d * 10) / 10, titles: titles.length ? titles : undefined });
  if (st.seasons.length > 60) st.seasons.shift();
  if (titles.length) careerLog(g, `${g.season}: ${titles.join(', ')} mit ${own.name}`);
  c.declined = {};
  return c;
}

/** Aufruf aus startNextSeason: Bilanz → ggf. Wechsel (Start). */
export function careerSeasonStart(g: Game): ReturnType<typeof careerSeasonSwitchStart> {
  if (!g.career && !isCareerMode(g) && !g.clubs[g.managedClubId]) return null;
  careerSeasonReview(g);
  if (g.career) resolveOtherOffers(g); // offene Angebote verfallen mit dem Saisonwechsel
  return careerSeasonSwitchStart(g);
}

export { careerSeasonSwitchFinish };
