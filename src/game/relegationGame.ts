// =============================================================================
// ABSTIEG AUS DER UNTERSTEN LIGA — Ende der Amtszeit (Wunsch Pascal)
// -----------------------------------------------------------------------------
// „Mein Verein soll aus der untersten Liga absteigen können. Dann soll man
// entlassen werden und je nach Spielart ist das Spiel zu Ende oder man bekommt
// neue Angebote.“
//  • Abstiegsplätze der untersten spielbaren Ebene = dieselbe Rechnung wie der
//    Saisonwechsel (`ownDropInfo` spielt Auf-/Abstieg ohne Schutz des eigenen
//    Vereins trocken durch: computeSeasonTransition → applyHomePlan →
//    balanceDivisions → Tausch mit dem Unterbau; DDR-Liga: die zwei Letzten).
//    In der Saison einer Ligareform gibt es keinen Tausch mit dem Unterbau –
//    dann steigt niemand ab (Sicherheitsnetz `ensureProtected`).
//  • Stichtag (`relegationDaily`): der Tag nach dem letzten Ligaspiel. Steht der
//    eigene Verein auf einem Abstiegsplatz, ist die Amtszeit besiegelt
//    (`career.releg`). Teammanager: Hinweis des Vorstands, Spielende am
//    Saisonwechsel. Karriere: Entlassung mit Angeboten passend zum Ansehen
//    (vorhandene Mechanik `career_sacked` aus careerGame.ts) – Wechsel zum 1. Juli.
//  • Saisonwechsel (`relegationSeasonEnd`, erste Zeile von startNextSeason):
//    Teammanager bzw. Karriere ohne Angebot → `game.over` (Abschluss-Bildschirm
//    screens/GameOverScreen.tsx, kein Weiterspielen, Saisonwechsel läuft nicht).
//    Karriere: zugesagter Wechsel wird wirksam (careerSeasonSwitchStart), der alte
//    Verein ist nicht mehr geschützt und steigt sportlich in den Unterbau ab
//    (Pool-Verein ohne Kader; er kann später wieder aufsteigen).
//  • Simulationen (`simAutoManage`): der Autopilot übernimmt zum Saisonwechsel
//    einen anderen Verein derselben Liga (immer, auch ohne passendes Ansehen),
//    damit Sim-Läufe weiterlaufen; Hinweis in der Karriere-Chronik.
// Spielstand: optionale Felder `game.over` und `career.releg` – keine Migration.
// =============================================================================
import { computeSeasonTransition, type CurrentDivision } from '../data/reformTransition';
import { balanceDivisions } from '../data/reformSteady';
import { structureForSeason } from '../data/reforms';
import { seasonStartYear } from '../data/timeline';
import { seasonLabel } from '../engine/calendar';
import { makeMessage, pushMessage } from '../engine/messages';
import type { DivisionMeta } from '../engine/leagues';
import { makeOffer } from './careerGame';
import { careerLog, clubNameOf, ensureCareer, jobLevel, type JobOffer } from './careerState';
import { ddrDownIds, poolDownIds, poolSwapCount } from './clubPool';
import { applyHomePlan, homeRegionHint, homeSeasonPlan, homeZoneOf } from './homeStructure';
import { careerData, games } from './managerView';
import { isReserveId } from './reserveIds';
import { bindGameIds } from './resetModuleState';
import { clubStrengthFor, finalOrder } from './season';
import { Game, homeCountryOf } from './state';

/** Spielende (optionales Feld `game.over`): Karrierebilanz zum Abschluss-Bildschirm. */
export interface GameOver {
  reason: 'abstieg';
  date: string;
  season: string;
  manager: string;
  clubId: string;
  clubName: string;
  league: string;
  pos: number;
  size: number;
  /** Abgeschlossene Saisons (inkl. der letzten). */
  seasons: number;
  /** Pflichtspiele: Siege, Unentschieden, Niederlagen, Tore, Gegentore. */
  record: [number, number, number, number, number];
  titles: { label: string; n: number }[];
  best?: { pos: number; league: string; season: string };
  rep: number;
  /** Erstes Amtsjahr (Saison). */
  from: string;
}

export interface DropInfo {
  /** Spielerliga ist die unterste spielbare Ebene mit Abstieg in den Unterbau. */
  lowest: boolean;
  /** Zahl der Abstiegsplätze der eigenen Liga (Tabellenende). */
  spots: number;
  /** Vereine der eigenen Liga, die nach heutigem Stand in den Unterbau absteigen. */
  ids: string[];
  /** Der eigene Verein ist darunter. */
  own: boolean;
}

const NONE: DropInfo = { lowest: false, spots: 0, ids: [], own: false };
const sim = (g: Game) => !!(g as { simAutoManage?: boolean }).simAutoManage;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Spielart: Karriere (Entlassung mit neuen Angeboten) – sonst Teammanager (ein Verein für immer). */
export const relegationOffersMode = (g: Game) => g.manager?.startMode === 'career' || g.manager?.startMode === 'young';

/**
 * Abstiegsplätze der eigenen Liga nach dem heutigen Tabellenstand – dieselbe Rechnung wie in
 * startNextSeason, aber ohne Schutz des eigenen Vereins und ohne den Spielstand zu ändern.
 */
export function ownDropInfo(g: Game): DropInfo {
  const pd = g.leagues?.playerDivision;
  if (!pd || !g.table?.rows.length) return NONE;
  const own = g.managedClubId;
  const next = seasonStartYear(g.season) + 1;
  const newSeason = seasonLabel(next);
  const order = finalOrder(g, pd.id);
  const done = (ids: string[]): DropInfo => ({ lowest: true, spots: ids.length, ids, own: ids.includes(own) });
  const isReunify = newSeason === '1991/92' && !g.appliedReforms.includes('reform-1991-reunification');
  if (pd.id.startsWith('ddr-') && !isReunify) {
    // DDR bis 1990/91: nur die DDR-Liga tauscht mit den Bezirksligen.
    return pd.tier === 102 && next < 1991 ? done(ddrDownIds(order)) : NONE;
  }
  const current: CurrentDivision[] = [{ id: pd.id, tier: pd.tier, group: pd.group, name: pd.name, orderedIds: order }];
  for (const d of g.leagues.otherDivisions) {
    if (d.id.startsWith('ddr-') && !isReunify) continue;
    current.push({ id: d.id, tier: d.tier, group: d.group, name: d.name, orderedIds: finalOrder(g, d.id) });
  }
  if (pd.tier !== Math.max(...current.filter((c) => c.tier < 100).map((c) => c.tier))) return NONE;
  // Trockenlauf: Platzhalter ziehen laufende Nummern (engine/idSeq.ts) – Zähler danach zurücksetzen.
  bindGameIds(g);
  const seq = g.ids?.n ?? 0;
  try {
    const german = homeCountryOf(g) === 'ger';
    const plan = german ? null : homeSeasonPlan(homeCountryOf(g), current, newSeason);
    const res = computeSeasonTransition({
      newSeason, current,
      strengthOf: (id) => clubStrengthFor(g, id),
      cityOf: (id) => g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '',
      appliedReforms: g.appliedReforms,
      ...(plan ? { targets: plan.transition ?? plan.targets, regionHint: homeRegionHint(g, current, newSeason) } : {}),
    });
    if (res.reform) return NONE; // Reform-Saison: kein Tausch mit dem Unterbau
    const swaps = plan ? applyHomePlan(res, plan, current, newSeason, undefined, (id, n) => homeZoneOf(homeCountryOf(g), id, g.clubs[id]?.city ?? g.simClubs[id]?.city, n, next)) : undefined;
    const membership: Record<string, { ids: string[]; meta: DivisionMeta }> = {};
    for (const d of res.divisions) membership[d.meta.id] = { ids: d.ids, meta: d.meta };
    if (!isReunify) balanceDivisions(membership, plan ? plan.targets : structureForSeason(newSeason), (id) => clubStrengthFor(g, id));
    const west = Object.values(membership).filter((m) => m.meta.tier < 100);
    const lowest = Math.max(...west.map((m) => m.meta.tier));
    const divs = west.filter((m) => m.meta.tier === lowest);
    const k = poolSwapCount(divs.length, swaps);
    const still = new Set(west.flatMap((m) => m.ids));
    const out = order.filter((id) => !still.has(id)); // schon durch Verkleinerung der Liga entfallen
    const mine = divs.find((m) => m.meta.id === pd.id) ?? divs.find((m) => order.some((id) => m.ids.includes(id)));
    if (mine && k > 0) out.push(...poolDownIds(mine.ids, order, k).filter((id) => !out.includes(id)));
    return done(order.filter((id) => out.includes(id)));
  } finally {
    if (g.ids) g.ids.n = seq;
  }
}

/** Tabellenzonen der eigenen Liga ergänzen: Abstiegsplätze in den Unterbau (nur unterste Ebene). */
export function ownDropZones(g: Game, n: number): number {
  const info = ownDropInfo(g);
  return info.lowest ? Math.min(info.spots, Math.max(0, n - 1)) : 0;
}

/** Statistiken › Liga, laufende Saison der eigenen Liga: Zonen mit den Abstiegsplätzen in den Unterbau ({} = Standardzonen). */
export function ownLeagueZones(g: Game, n: number): { zones?: string[] } {
  const k = ownDropZones(g, n);
  if (!k) return {};
  const tier = g.leagues.playerDivision.tier;
  return { zones: Array.from({ length: n }, (_, i) => (i === 0 ? 'zone-cl' : tier === 2 && i === 1 ? 'zone-eu' : i >= n - k ? 'zone-rel' : '')) };
}

/** Warnsatz für Saisonziel, Briefing und Vorstand; '' = eigene Liga ist nicht die unterste. */
export function relegationWarning(g: Game): string {
  const info = ownDropInfo(g);
  if (!info.lowest || !info.spots) return '';
  const n = g.table.rows.length;
  const places = info.spots === 1 ? `der letzte Platz (${n}.)` : `die Plätze ${n - info.spots + 1} bis ${n}`;
  const league = g.leagues.playerDivision.name;
  return `Die ${league} ist die unterste Liga: ${places} ${info.spots === 1 ? 'steigt' : 'steigen'} in den Amateurbereich ab. `
    + `Abstieg bedeutet das Ende deiner Amtszeit – ${relegationOffersMode(g) ? 'du wirst entlassen und brauchst einen neuen Verein' : 'das Spiel ist dann zu Ende'}.`;
}

/** Spielbeginn in der untersten Liga: der Vorstand sagt es deutlich (spätere Saisons: Saisonziel-Nachricht). */
export function relegationStartNotice(g: Game): void {
  const warn = relegationWarning(g);
  if (!warn) return;
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'board', from: 'Vorstand',
    subject: 'Unterste Liga: Abstieg bedeutet das Ende deiner Amtszeit',
    shortText: 'Die Abstiegsplätze sind in der Tabelle rot markiert.',
    bodyText: `${warn}\n\nDie Abstiegsplätze sind in der Tabelle rot markiert (Statistiken › Liga).`,
  }));
}

// -----------------------------------------------------------------------------
// Angebote nach dem Abstieg (Karriere)
// -----------------------------------------------------------------------------
/** Vereine der eigenen Liga, die nicht absteigen und zu deinem Ansehen passen (höchstens drei). */
function relegationOffers(g: Game, today: string, dropIds: string[], rep: number, always: boolean): JobOffer[] {
  const own = g.managedClubId;
  const all = g.table.rows.map((r) => r.clubId)
    .filter((id) => id !== own && !dropIds.includes(id) && !!g.clubs[id] && !isReserveId(id) && id !== g.manager?.avoidClubId)
    .map((id) => ({ id, l: jobLevel(g, id) })).sort((a, b) => b.l - a.l || a.id.localeCompare(b.id));
  let fit = all.filter((x) => x.l <= rep + 12);
  if (!fit.length && always) fit = all.slice(-1);
  const pick = [fit[0], fit[Math.floor(fit.length / 2)], fit[fit.length - 1]].filter((x, i, a) => x && a.indexOf(x) === i);
  return pick.map((x) => makeOffer(g, x.id, 'saisonende', 'Der Verein sucht einen Trainer für die neue Saison.', today, true));
}

function offerLine(o: JobOffer): string {
  return `${o.clubName} – Saisonziel: ${o.goal}`;
}

/** Amtszeit besiegeln: Ansehen, Chronik, Nachricht (mit Angeboten bzw. Abschied). */
function seal(g: Game, today: string, info: DropInfo): void {
  const c = ensureCareer(g);
  const club = g.clubs[g.managedClubId];
  const pos = finalOrder(g, g.leagues.playerDivision.id).indexOf(club.id) + 1;
  c.releg = { season: g.season, date: today };
  c.sacked++;
  c.rep = clamp(c.rep - 6, 5, 99);
  careerLog(g, `Abstieg mit ${club.name} aus der ${g.leagues.playerDivision.name} – Entlassung`);
  const offers = relegationOffersMode(g) ? relegationOffers(g, today, info.ids, c.rep, false) : [];
  const head = `${club.name} beendet die Saison auf Platz ${pos} der ${g.leagues.playerDivision.name} und steigt in den Amateurbereich ab. `
    + `Der Vorstand trennt sich zum Saisonende von dir.\n\n`;
  if (!offers.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Vorstand',
      subject: `Abstieg: Deine Amtszeit bei ${club.name} endet`,
      shortText: 'Mit dem Abstieg in den Amateurbereich endet deine Amtszeit zum Saisonende.',
      bodyText: head + (relegationOffersMode(g)
        ? 'Dein Berater hat keinen Verein gefunden, der zu deinem Ansehen passt. Mit dem Saisonende ist deine Laufbahn als Manager vorbei.'
        : `Du hast dich für ${club.name} entschieden – einen anderen Verein gibt es für dich nicht. Mit dem Saisonende ist das Spiel zu Ende.`)
        + '\n\nBis zum 30. Juni führst du die Geschäfte weiter; danach siehst du deine Karrierebilanz.',
    }));
    return;
  }
  c.offers.push(...offers);
  c.offerCount += offers.length;
  const msg = makeMessage({
    date: today, category: 'board', from: 'Vorstand',
    subject: `Abstieg: ${club.name} trennt sich von dir`,
    shortText: 'Entlassung zum Saisonende – wähle deinen nächsten Verein.',
    bodyText: head + `Dein Berater hat schon Gespräche geführt. Diese Vereine wollen dich zum 1. Juli:\n\n${offers.map(offerLine).join('\n')}\n\n`
      + 'Du musst dich für einen entscheiden. Bis zum 30. Juni führst du die Geschäfte weiter.',
    actionRequired: true,
  });
  msg.choices = offers.map((o) => ({ id: `o:${o.id}`, label: o.clubName, hint: `zum 1. Juli · Ziel: ${o.goal}` }));
  msg.eventRef = { type: 'career_sacked', deadline: offers[0].deadline, defaultChoice: `o:${offers[0].id}`, data: { offer: offers[0].id } };
  pushMessage(g.messages, msg);
}

/** Täglich (game/day.ts): Warnung bei Abstiegsgefahr, Stichtag nach dem letzten Ligaspiel. */
export function relegationDaily(g: Game, today: string): void {
  if (g.over || sim(g) || !g.clubs[g.managedClubId] || !g.fixtures.length) return;
  const c = ensureCareer(g);
  if (c.releg?.season === g.season) return;
  const left = g.fixtures.some((m) => m.status !== 'finished');
  if (left) {
    // Am 1. Februar bis Mai: Vorstand warnt, solange der Verein auf einem Abstiegsplatz steht.
    const m = Number(today.slice(5, 7));
    if (today.slice(8) !== '01' || m < 2 || m > 5) return;
    const info = ownDropInfo(g);
    if (!info.own) return;
    const club = g.clubs[g.managedClubId];
    const pos = g.table.rows.findIndex((r) => r.clubId === club.id) + 1;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Vorstand',
      subject: `Abstiegsplatz: Deine Amtszeit steht auf dem Spiel`,
      shortText: `Platz ${pos} – Abstieg bedeutet das Ende deiner Amtszeit.`,
      bodyText: `${club.name} steht auf Platz ${pos}. ${relegationWarning(g)}\n\nDer Vorstand erwartet, dass du die Wende schaffst.`,
    }));
    return;
  }
  if (c.relegChk === g.season) return;
  c.relegChk = g.season;
  const info = ownDropInfo(g);
  if (info.own) seal(g, today, info);
}

// -----------------------------------------------------------------------------
// Spielende
// -----------------------------------------------------------------------------
/** Karrierebilanz zum Abschluss (wird im Spielstand festgehalten). */
export function makeGameOver(g: Game, today: string): GameOver {
  const c = ensureCareer(g);
  const club = g.clubs[g.managedClubId];
  const data = careerData(g);
  const rows = data?.seasons ?? [];
  const best = [...rows].filter((s) => s.tier && s.pos).sort((a, b) => (a.tier! - b.tier!) || (a.pos! - b.pos!))[0];
  const tl = new Map<string, number>();
  for (const s of rows) for (const t of s.titles) tl.set(t, (tl.get(t) ?? 0) + 1);
  const all = data?.totals.all ?? [0, 0, 0, 0, 0];
  const pos = finalOrder(g, g.leagues.playerDivision.id).indexOf(club.id) + 1; // inkl. Zwangsabstieg
  return {
    reason: 'abstieg', date: today, season: g.season, manager: g.manager?.name ?? 'Manager',
    clubId: club.id, clubName: club.name, league: g.leagues.playerDivision.name, pos, size: g.table.rows.length,
    seasons: rows.filter((s) => games(s.L) > 0 || !s.live).length,
    record: [all[0], all[1], all[2], all[3], all[4]],
    titles: [...tl.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, 'de')),
    best: best ? { pos: best.pos!, league: best.league ?? '', season: best.season } : undefined,
    rep: Math.round(c.rep), from: data?.from ?? g.season,
  };
}

/**
 * Erste Zeile von startNextSeason: `true` = das Spiel ist zu Ende (`game.over`), der Saisonwechsel
 * läuft nicht. Sonst steht ein nötiger Vereinswechsel als `career.pendingMove` bereit.
 */
export function relegationSeasonEnd(g: Game): boolean {
  if (g.over) return true;
  if (!g.clubs[g.managedClubId] || !g.table?.rows.length) return false;
  const c = ensureCareer(g);
  const sealed = c.releg?.season === g.season;
  const info = sealed && !sim(g) ? null : ownDropInfo(g);
  if (!sealed && !info?.own) return false;
  const today = g.calendar.currentDate;
  if (c.pendingMove && (g.clubs[c.pendingMove.clubId] || g.simClubs?.[c.pendingMove.clubId])) return false; // Wahl getroffen
  if (sim(g) || relegationOffersMode(g)) {
    // Ohne Wahl (Simulation, Frist verpasst, direkter Saisonwechsel): das beste Angebot gilt.
    const drop = info ?? ownDropInfo(g);
    if (!sealed) { c.releg = { season: g.season, date: today }; c.sacked++; c.rep = clamp(c.rep - 6, 5, 99); }
    const open = c.offers.find((o) => o.forced && !!g.clubs[o.clubId]);
    const o = open ?? relegationOffers(g, today, drop.ids, c.rep, sim(g))[0];
    if (o) {
      for (const m of g.messages) {
        const ref = m.eventRef;
        if (ref && !ref.resolved && ref.type === 'career_sacked') { ref.resolved = `o:${o.id}`; m.actionRequired = false; m.resultText = `Du wechselst zum 1. Juli zu ${o.clubName}.`; }
      }
      c.offers = [];
      c.pendingMove = { ...o, when: 'saisonende', fromId: g.managedClubId, reason: 'entlassen' };
      careerLog(g, `Abstieg mit ${clubNameOf(g, g.managedClubId)}${sim(g) ? ' – der Autopilot übernimmt ' : ' – Wechsel zu '}${o.clubName}`);
      return false;
    }
  }
  g.over = makeGameOver(g, today);
  careerLog(g, `Ende der Laufbahn nach dem Abstieg mit ${g.over.clubName}`);
  return true;
}
