// =============================================================================
// NATIONALMANNSCHAFTEN – Ablauf (Wunsch Pascal, #36). Optionales `game.national`.
// -----------------------------------------------------------------------------
// • Länderspielfenster je Saison (data/nationalTeams.ts `intlWindowPlan`): das
//   Spiel sucht Termine ohne eigenes Pflichtspiel; alle Nationen spielen (Paarung
//   im Verband), Aufgebote aus der Spielwelt, Länderspiele/Tore an `Player.intl`.
//   Abgestellte Spieler sind vom Vortag bis zum letzten Spiel `availability =
//   'international'` (fehlen bei Spielen ihres Vereins), danach weniger frisch.
// • WM/EM: 25 Tage vor dem Anpfiff nominiert und komplett ausgespielt
//   (game/national/tournament.ts), Ergebnisse werden Tag für Tag sichtbar; die
//   Spieler sind ab 7 Tagen vor dem Anpfiff bis zum Aus ihrer Nation weg.
// • Folgen: Länderspiele erhöhen den Marktwert (Nationalspieler-Aufschlag),
//   ein starkes Turnier gibt einen Schub, der über zweieinhalb Jahre abklingt
//   (`intlValueFactor`, genutzt in engine/clubEconomy.ts `marketValueFor`).
//   Weltmeister/Europameister: Form und Moral hoch, dafür später im Training.
// • Nachrichten nur für den eigenen Verein (Abstellungen, Nominierung, Turnier).
// Seite: views/statistiken/NationalView.tsx (Statistiken › Nationalteams).
// =============================================================================
import { intlExperience } from '../../engine/experience';
import type { Player } from '../../types';
import type { Game } from '../state';
import { NATION_BY_CODE, confOf, intlMatchLabel, intlWindowPlan, squadSizeOf, tournamentsOfYear, type TournamentKind } from '../../data/nationalTeams';
import { activeNations, allStrengths, candidatesByNation, pickSquad, startingXI, type Cand } from './pool';
import { buildTournament, STAGE_LABEL, type NtMatch, type Tournament } from './tournament';
import { addDaysISO } from '../../engine/trainingPlan';
import { ownFixtures } from '../trainingWeek';
import { hashStr, mulberry32, simMatchGoals } from '../../engine/leagues';
import { makeMessage, pushMessage } from '../../engine/messages';
import { createMatchInjury } from '../../engine/match/finish';
import { recordInjury } from '../../engine/history';
import { marketValueFor } from '../../engine/clubEconomy';
export { intlValueFactor } from '../../engine/clubEconomy';
import { homeNat } from '../registrationGame';
import { countryInfo, countryOfNat } from '../../data/countryFlags';
import { moraleJolt } from '../moraleJolt';

export interface IntlWindow { from: string; dates: string[]; matches: NtMatch[]; label: string; squads: Record<string, string[]>; done?: boolean }
export interface TournamentRecord { kind: TournamentKind; year: number; place: string; winner: string; runnerUp: string; home: string; topScorer?: [string, string, number] }
export interface NationalState {
  v: 1;
  season: string;
  windows: IntlWindow[];
  tourn: Tournament | null;
  archive: TournamentRecord[];
  /** Abgestellte volle Spieler: ID → bis (einschließlich). */
  away: Record<string, string>;
}
type G = Game & { national?: NationalState };

const yearOf = (iso: string) => parseInt(iso.slice(0, 4), 10);
export const natName = (code: string) => { const k = countryOfNat(code); return k ? countryInfo(k).name : code; };

export function nationalState(g: Game): NationalState {
  const gg = g as G;
  if (!gg.national) gg.national = { v: 1, season: '', windows: [], tourn: null, archive: [], away: {} };
  return gg.national;
}

/** Zustand mit den Länderspielfenstern der laufenden Saison (plant sie beim ersten Zugriff). */
export function nationalSeason(g: Game): NationalState {
  const st = nationalState(g);
  if (st.season !== g.season) { st.season = g.season; st.windows = planWindows(g); }
  return st;
}

// -----------------------------------------------------------------------------
// Länderspielfenster
// -----------------------------------------------------------------------------
function planWindows(g: Game): IntlWindow[] {
  const y0 = parseInt(g.season.slice(0, 4), 10);
  const out: IntlWindow[] = [];
  const today = g.calendar.currentDate;
  const fx = ownFixtures(g, `${y0}-08-01`, `${y0 + 1}-05-31`);
  // Pokal-/Europapokalrunden zählen schon vor der Auslosung (der eigene Verein könnte spielen).
  const rounds = new Set<string>();
  for (const r of g.cup?.rounds ?? []) if (r.date) rounds.add(r.date);
  for (const cup of Object.values(g.euroCups ?? {})) for (const r of cup?.rounds ?? []) { if ((r as { date?: string }).date) rounds.add((r as { date: string }).date); for (const t of r.ties ?? []) rounds.add(t.date); }
  const busy = (d: string) => fx.has(d) || rounds.has(d);
  const nextT = nextTournamentKind(y0);
  for (const w of intlWindowPlan(y0)) {
    const first = `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.from).padStart(2, '0')}`;
    let dates: string[] | null = null;
    for (let k = 0; k < 24 && !dates; k++) {
      const d = addDaysISO(first, k);
      const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
      if (w.games === 2 && wd === 6) {
        const wed = addDaysISO(d, 4);
        if (![-1, 0, 1, 2, 3, 4, 5].some((o) => busy(addDaysISO(d, o)))) dates = [d, wed];
      } else if (w.games === 1 && wd === 3) {
        if (![-1, 0, 1].some((o) => busy(addDaysISO(d, o)))) dates = [d];
      }
    }
    if (!dates) {
      // Kein freies Wochenende: nur der Mittwoch ohne eigenes Spiel.
      for (let k = 0; k < 28 && !dates; k++) {
        const d = addDaysISO(first, k);
        if (new Date(`${d}T00:00:00Z`).getUTCDay() === 3 && ![-1, 0, 1].some((o) => busy(addDaysISO(d, o)))) dates = [d];
      }
    }
    if (!dates || dates[dates.length - 1] < today) continue;
    out.push({ from: addDaysISO(dates[0], dates.length > 1 ? -5 : -1), dates, matches: [], label: intlMatchLabel(dates[0], nextT), squads: {} });
  }
  return out;
}

function nextTournamentKind(y0: number): TournamentKind | null {
  for (const y of [y0 + 1, y0 + 2]) {
    const t = tournamentsOfYear(y, hostPick)[0];
    if (t) return t.kind;
  }
  return null;
}

function hostPick(kind: TournamentKind, year: number): string {
  const list = activeNations(year).filter((c) => kind === 'WM' || confOf(NATION_BY_CODE[c], year) === 'UEFA');
  return list[hashStr(`${kind}${year}host`) % list.length];
}

const available = (g: Game) => (c: Cand) => {
  if (!c.full) return false;
  const p = g.players[c.id];
  return !p || !!p.injury || (p.availability !== 'available' && p.availability !== 'international');
};

/** Fenster beginnt: Aufgebote, Spiele (alle Nationen), Abstellung. */
function startWindow(g: Game, st: NationalState, w: IntlWindow): void {
  const year = yearOf(w.dates[0]);
  const strength = allStrengths(g, w.from);
  const r = mulberry32(hashStr(`${g.season}|${w.dates[0]}|lsp`));
  const nats = activeNations(year).filter((c) => strength.has(c));
  const size = Math.min(23, squadSizeOf(year));
  const squads = new Map<string, Cand[]>();
  for (const n of nats) {
    const sq = pickSquad(g, n, w.from, size, available(g));
    squads.set(n, sq);
    w.squads[n] = sq.map((c) => c.id);
  }
  for (const date of w.dates) {
    // Paarungen im Verband (Zufall je Termin).
    const byConf = new Map<string, string[]>();
    for (const n of nats) { const c = confOf(NATION_BY_CODE[n], year); byConf.set(c, [...(byConf.get(c) ?? []), n]); }
    for (const list of byConf.values()) {
      const l = [...list].sort(() => r() - 0.5);
      for (let i = 0; i + 1 < l.length; i += 2) {
        const a = l[i], b = l[i + 1];
        const res = simMatchGoals(strength.get(a)!, strength.get(b)!, r);
        const m: NtMatch = { date, stage: w.label, a, b, ga: res.home, gb: res.away };
        m.scorers = [...pickScorers(squads.get(a) ?? [], a, m.ga, r), ...pickScorers(squads.get(b) ?? [], b, m.gb, r)];
        w.matches.push(m);
      }
    }
  }
  const until = w.dates[w.dates.length - 1];
  for (const sq of squads.values()) for (const c of sq) if (c.full) st.away[c.id] = until;
  // Nachricht: eigene Abstellungen
  const own = [...squads.values()].flat().filter((c) => c.full && c.clubId === g.managedClubId);
  if (own.length) {
    pushMessage(g.messages, makeMessage({
      date: g.calendar.currentDate, category: 'general', from: 'Verband', subject: `Länderspiele: ${own.length} Spieler abgestellt`,
      shortText: own.map((c) => c.name).join(', '),
      bodyText: `Zu den Länderspielen am ${w.dates.map(fmtD).join(' und ')} (${w.label}) sind abgestellt:\n${own.map((c) => `• ${c.name} (${natName(c.nat)})`).join('\n')}\n\nSie fehlen dir bis einschließlich ${fmtD(until)} und kommen weniger frisch zurück. Überblick: Statistiken › Nationalteams.`,
    }));
  }
}

const fmtD = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

const SCORE_W: Record<string, number> = { MS: 5, HS: 4, RA: 3.2, LA: 3.2, OM: 2.4, ZM: 1.1, RM: 1.6, LM: 1.6, DM: 0.6, IV: 0.45, LIB: 0.45, RV: 0.35, LV: 0.35, TW: 0 };
function pickScorers(squad: Cand[], nat: string, goals: number, r: () => number): [string, string][] {
  const xi = startingXI(squad);
  const out: [string, string][] = [];
  if (!xi.length) return out;
  for (let k = 0; k < goals; k++) {
    const tot = xi.reduce((a, c) => a + (SCORE_W[c.pos] ?? 1) * (c.ov / 80), 0);
    let x = r() * tot;
    const c = xi.find((y) => (x -= (SCORE_W[y.pos] ?? 1) * (y.ov / 80)) <= 0) ?? xi[xi.length - 1];
    out.push([c.id, nat]);
  }
  return out;
}

/** Länderspiel(e) verbuchen: Einsätze, Tore, Frische, kleine Verletzungsgefahr, Form. */
function bookMatches(g: Game, matches: NtMatch[], squads: Record<string, string[]>, today: string): void {
  const r = mulberry32(hashStr(`${today}|ntbook`));
  for (const m of matches) {
    for (const [nat, gf, ga] of [[m.a, m.ga, m.gb], [m.b, m.gb, m.ga]] as [string, number, number][]) {
      const ids = squads[nat] ?? [];
      const players = ids.map((id) => g.players[id]).filter((p): p is Player => !!p);
      const cands: Cand[] = players.map((p) => ({ id: p.id, name: p.fullName, nat, pos: p.naturalPosition, ov: p.overall, age: p.age, clubId: p.clubId, full: true }));
      const xi = new Set(startingXI(cands).map((c) => c.id));
      const bench = players.filter((p) => !xi.has(p.id)).sort(() => r() - 0.5).slice(0, 3).map((p) => p.id);
      for (const p of players) {
        if (!xi.has(p.id) && !bench.includes(p.id)) continue;
        const I = (p.intl ??= { caps: 0, goals: 0 });
        I.caps++; I.last = today.slice(0, 4);
        intlExperience(p, 1, xi.has(p.id));
        I.goals += (m.scorers ?? []).filter(([id]) => id === p.id).length;
        p.frische = Math.max(40, p.frische - (xi.has(p.id) ? 14 : 6));
        p.form = Math.max(0, Math.min(100, p.form + (gf > ga ? 2 : gf < ga ? -2 : 0)));
        if (g.injuriesEnabled && xi.has(p.id) && r() < 0.012 && !p.injury) {
          const inj = createMatchInjury(r() < 0.8 ? 'minor' : 'moderate', today);
          inj.description = `${inj.description} (Länderspiel)`;
          p.injury = inj; p.availability = 'injured'; recordInjury(p, inj);
          if (p.clubId === g.managedClubId) {
            pushMessage(g.messages, makeMessage({
              date: today, category: 'injury', from: 'Mannschaftsarzt', subject: `${p.fullName} verletzt von der Nationalmannschaft zurück`,
              shortText: `${inj.description}, ${inj.totalDays} Tage`, bodyText: `${p.fullName} hat sich beim Länderspiel ${natName(m.a)} – ${natName(m.b)} verletzt: ${inj.description}. Ausfallzeit etwa ${inj.totalDays} Tage.`,
            }));
          }
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Turniere
// -----------------------------------------------------------------------------
function maybeBuildTournament(g: Game, st: NationalState, today: string): void {
  const y = yearOf(today);
  for (const def of [...tournamentsOfYear(y, hostPick), ...tournamentsOfYear(y + 1, hostPick)]) {
    const nominate = addDaysISO(def.start, -25);
    if (today < nominate || today > def.end) continue;
    if (st.tourn && st.tourn.kind === def.kind && st.tourn.year === def.year) return;
    if (st.archive.some((a) => a.kind === def.kind && a.year === def.year)) return;
    const strength = allStrengths(g, today);
    const place = def.place || `in ${natName(def.hosts[0])}`;
    const t = buildTournament(def, strength, y, place);
    const size = squadSizeOf(def.year);
    const r = mulberry32(hashStr(`${def.kind}${def.year}|sc`));
    const sq = new Map<string, Cand[]>();
    for (const n of t.teams) {
      const s = pickSquad(g, n, today, size, available(g));
      sq.set(n, s);
      t.squads[n] = s.map((c) => c.id);
      for (const c of s) t.names[c.id] = [c.name, c.pos, c.ov, c.clubId];
    }
    for (const m of t.matches) m.scorers = [...pickScorers(sq.get(m.a) ?? [], m.a, m.ga, r), ...pickScorers(sq.get(m.b) ?? [], m.b, m.gb, r)];
    st.tourn = t;
    const camp = addDaysISO(def.start, -7);
    for (const [n, s] of sq) for (const c of s) if (c.full) st.away[c.id] = `${camp}|${t.out[n]}`;
    const own = [...sq.values()].flat().filter((c) => c.full && c.clubId === g.managedClubId);
    const name = def.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft';
    const home = homeNat(g);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'media', from: 'Pressestelle', subject: `${name} ${def.year} ${t.place}: die Aufgebote stehen`,
      shortText: own.length ? `${own.length} Spieler von dir fahren hin.` : t.teams.includes(home) ? `${natName(home)} ist dabei.` : `${natName(home)} hat sich nicht qualifiziert.`,
      bodyText: `Vom ${fmtD(def.start)} bis ${fmtD(def.end)}${def.year} spielen ${t.teams.length} Mannschaften ${t.place}.\n${t.teams.includes(home) ? `${natName(home)} ist qualifiziert.` : `${natName(home)} hat die Qualifikation verpasst.`}\n${own.length ? `\nAus deinem Kader nominiert:\n${own.map((c) => `• ${c.name} (${natName(c.nat)})`).join('\n')}\n\nSie reisen eine Woche vor dem Anpfiff ins Quartier und fehlen dir, bis ihre Mannschaft ausscheidet – mit einem starken Turnier steigt ihr Marktwert.` : ''}\nSpielplan und Ergebnisse: Statistiken › Nationalteams.`,
    }));
    return;
  }
}

function tournamentDaily(g: Game, st: NationalState, today: string): void {
  const t = st.tourn;
  if (!t || t.done) return;
  const home = homeNat(g);
  // Eigene Nation: Aus oder Titel melden.
  if (t.teams.includes(home) && t.out[home] === addDaysISO(today, -1)) {
    const res = t.result[home];
    const title = res === 'Weltmeister' || res === 'Europameister';
    pushMessage(g.messages, makeMessage({
      date: today, category: 'media', from: 'Pressestelle', subject: title ? `${natName(home)} ist ${res}!` : `${t.kind} ${t.year}: Aus für ${natName(home)} (${res})`,
      shortText: title ? 'Das ganze Land feiert.' : 'Die Nationalspieler kehren heim.',
      bodyText: title ? `${natName(home)} gewinnt die ${t.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft'} ${t.place}. Die Spieler kommen gefeiert, aber spät aus dem Urlaub – die Begeisterung trägt in die neue Saison.` : `${natName(home)} scheidet ${res === 'Vorrunde' ? 'in der Vorrunde' : `im ${res}`} aus. Die Nationalspieler sind ab sofort zurück bei ihren Vereinen.`,
    }));
  }
  if (today <= t.end) return;
  // Turnier vorbei: Wirkungen buchen.
  const year = yearOf(t.end);
  const sq: Record<string, string[]> = t.squads;
  const games = t.matches;
  const boostOf = (res: string) => (res === 'Weltmeister' || res === 'Europameister' ? 0.3 : res === 'Finale' ? 0.2 : res === 'Halbfinale' ? 0.12 : res === 'Viertelfinale' ? 0.06 : 0.02);
  for (const [nat, ids] of Object.entries(sq)) {
    const res = t.result[nat] ?? 'Vorrunde';
    const ms = games.filter((m) => m.a === nat || m.b === nat);
    const xi = new Set(startingXI(ids.map((id) => g.players[id]).filter(Boolean).map((p) => ({ id: p.id, name: p.fullName, nat, pos: p.naturalPosition, ov: p.overall, age: p.age, clubId: p.clubId, full: true }))).map((c) => c.id));
    for (const id of ids) {
      const p = g.players[id];
      if (!p) continue;
      const goals = ms.reduce((a, m) => a + (m.scorers ?? []).filter(([s]) => s === id).length, 0);
      const apps = xi.has(id) ? ms.length : Math.round(ms.length / 3);
      const I = (p.intl ??= { caps: 0, goals: 0 });
      I.caps += apps; I.goals += goals; I.last = String(year);
      intlExperience(p, apps, xi.has(id), true);
      (I.tourn ??= []).push({ t: `${t.kind} ${t.year}`, res, apps, goals });
      if (I.tourn.length > 8) I.tourn.shift();
      const b = (xi.has(id) ? boostOf(res) : boostOf(res) / 3) + Math.min(0.15, goals * 0.025);
      if (b > (I.boost?.v ?? 0) * Math.max(0, 1 - (year - (I.boost?.year ?? year)) / 2.5)) I.boost = { v: Math.round(b * 100) / 100, year };
      p.frische = Math.min(p.frische, 70);
      if (res === 'Weltmeister' || res === 'Europameister') { p.form = Math.min(100, p.form + 6); if (p.clubId === g.managedClubId) moraleJolt(g, p, 8, `${res} geworden`); }
      p.contract.transferValue = marketValueFor(p, year);
    }
  }
  const scorers = new Map<string, number>();
  for (const m of games) for (const [id] of m.scorers ?? []) scorers.set(id, (scorers.get(id) ?? 0) + 1);
  const top = [...scorers.entries()].sort((a, b) => b[1] - a[1])[0];
  st.archive.push({
    kind: t.kind, year: t.year, place: t.place, winner: t.winner, runnerUp: t.runnerUp, home: t.result[home] ?? 'nicht qualifiziert',
    topScorer: top ? [t.names[top[0]]?.[0] ?? '', Object.entries(sq).find(([, ids]) => ids.includes(top[0]))?.[0] ?? '', top[1]] : undefined,
  });
  t.done = true;
}

// -----------------------------------------------------------------------------
// Tagesablauf (day.ts)
// -----------------------------------------------------------------------------
export function nationalDaily(g: Game, today: string): void {
  const st = nationalSeason(g);
  maybeBuildTournament(g, st, today);
  for (const w of st.windows) {
    if (w.done) continue;
    if (today === w.from && !w.matches.length) startWindow(g, st, w);
    for (const d of w.dates) if (d === addDaysISO(today, -1) && w.matches.length) bookMatches(g, w.matches.filter((m) => m.date === d), w.squads, d);
    if (today > w.dates[w.dates.length - 1]) w.done = true;
  }
  tournamentDaily(g, st, today);
  // Abstellungen: weg setzen bzw. zurück. Hat der Verein heute ein Pflichtspiel (z. B. Pokalfinale
  // während eines Turniers), spielt der Spieler für ihn – der Verband gibt ihn frei.
  const playing = new Set<string>();
  if (Object.keys(st.away).length) {
    for (const m of g.fixtures) if (m.date === today) { playing.add(m.homeClubId); playing.add(m.awayClubId); }
    for (const r of g.cup?.rounds ?? []) for (const t of r.ties ?? []) if (t.date === today) { playing.add(t.homeClubId); playing.add(t.awayClubId); }
    for (const cup of Object.values(g.euroCups ?? {})) for (const r of cup?.rounds ?? []) for (const t of r.ties ?? []) if (t.date === today) { playing.add(t.homeClubId); playing.add(t.awayClubId); }
  }
  for (const [id, span] of Object.entries(st.away)) {
    const p = g.players[id];
    const [from, to] = span.includes('|') ? span.split('|') : [today, span];
    if (!p || today > to) {
      if (p?.availability === 'international') p.availability = 'available';
      delete st.away[id];
      continue;
    }
    if (playing.has(p.clubId)) { if (p.availability === 'international') p.availability = 'available'; continue; }
    if (today >= from && p.availability === 'available') p.availability = 'international';
  }
}

// -----------------------------------------------------------------------------
// Anzeige
// -----------------------------------------------------------------------------
export interface NatMatchRow extends NtMatch { label: string }
/** Länderspiele einer Nation (bisherige Saison + Turnier), neueste zuerst, nur bis heute. */
export function nationMatches(g: Game, nat: string): NatMatchRow[] {
  const st = nationalState(g);
  const today = g.calendar.currentDate;
  const rows: NatMatchRow[] = [];
  for (const w of st.windows) for (const m of w.matches) if ((m.a === nat || m.b === nat) && m.date <= today) rows.push({ ...m, label: m.stage });
  const t = st.tourn;
  if (t) for (const m of t.matches) if ((m.a === nat || m.b === nat) && m.date <= today) rows.push({ ...m, label: `${t.kind} · ${STAGE_LABEL[m.stage] ?? m.stage}` });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

/** Nächste Termine (Fenster / Turnier). */
export function upcoming(g: Game): { date: string; text: string }[] {
  const st = nationalState(g);
  const today = g.calendar.currentDate;
  const out: { date: string; text: string }[] = [];
  for (const w of st.windows) if (w.dates[0] >= today) out.push({ date: w.dates[0], text: `${w.label} (${w.dates.map(fmtD).join(', ')})` });
  const y = yearOf(today);
  for (const def of [...tournamentsOfYear(y, hostPick), ...tournamentsOfYear(y + 1, hostPick), ...tournamentsOfYear(y + 2, hostPick)]) {
    if (def.end >= today) out.push({ date: def.start, text: `${def.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft'} ${def.year} ${def.place || `in ${natName(def.hosts[0])}`}` });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
}

/** Aktuelles bzw. letztes Aufgebot einer Nation (Namen, Stärke, Verein, Kennung voll/Welt). */
export function currentSquad(g: Game, nat: string): { id: string; name: string; pos: string; ov: number; clubId: string; full: boolean }[] {
  const st = nationalState(g);
  const today = g.calendar.currentDate;
  const t = st.tourn && !st.tourn.done && today >= st.tourn.nominate ? st.tourn : null;
  let ids = t?.squads[nat];
  if (!ids) ids = [...st.windows].reverse().find((w) => w.squads[nat]?.length && w.from <= today)?.squads[nat];
  const cand = candidatesByNation(g).get(nat) ?? [];
  const byId = new Map(cand.map((c) => [c.id, c]));
  const list = ids ? ids.map((id) => byId.get(id) ?? (t?.names[id] ? { id, name: t.names[id][0], pos: t.names[id][1], ov: t.names[id][2], clubId: t.names[id][3], full: !!g.players[id] } : null)).filter(Boolean) as Cand[]
    : pickSquad(g, nat, today);
  return list.map((c) => ({ id: c.id, name: c.name, pos: c.pos, ov: c.ov, clubId: c.clubId, full: !!g.players[c.id] }));
}
