// =============================================================================
// CHEFTRAINER ALLER VEREINE DER WELT (Wunsch Pascal: „Jedes Team soll sich aus
// dem Mitarbeiterpool für alle Mitarbeiter bedienen.“)
// -----------------------------------------------------------------------------
// Vereine mit vollem Kader in der Spielerliga haben ihren Trainer am Verein
// (`Club.coach`, game/coachCarousel.ts). Alle übrigen – Sim-Vereine des
// Heimatlands (2. Liga, DDR-Ligen, Regionalligen …), alle Vereine der
// Auslandsligen (1./2. Ebene und tiefere Ebenen) und bei Bedarf Gegner von
// anderen Kontinenten oder Amateure im Pokal – haben einen Cheftrainer im
// gemeinsamen Mitarbeiterpool `game.staffWorld.heads` (kompakt als Tupel):
//   • Herkunft passend zum Land (data/origins.ts, `originKeyOf`), Ansehen
//     passend zur Vereinsgröße, Stil/Philosophie wie bei den KI-Trainern.
//   • Trainerkarussell auch im Ausland: Druck nach Tabelle gegen Erwartung
//     (Winter + Saisonende), Entlassung, Ruhestand, Vertragsende, größere
//     Vereine eines Landes werben erfolgreiche Trainer kleinerer ab.
//   • Freie Trainer der Welt (`heads.f`): Entlassene und Ex-Profis aus dem
//     Weltpool (game/worldPool.ts → `noteWorldRetirees`); sie wechseln auch das
//     Land – und freie Trainer des Heimat-Trainerpools (`game.coachPool`)
//     gehen ins Ausland bzw. bekannte Auslandstrainer kommen in ihn.
//   • Wird ein solcher Verein als voller Verein angelegt (Europapokal, Gast im
//     Pokal, Weltpokal), bekommt er seinen Trainer als `Club.coach` samt Taktik
//     nach dessen Stil (`attachHead`) – Textmodus, Vorschau und Gegner-Seite
//     zeigen ihn dann wie bei heimischen KI-Vereinen.
// Zufall nur aus festen Saaten (Verein/Saison) – verbraucht kein Math.random.
// =============================================================================
import type { Club, ClubCoach } from '../types';
import { COACH_PHILOSOPHY_LABEL, COACH_STYLE_LABEL, coachTactics, formationsFor, makeCoach, pressureTarget } from '../engine/aiManager';
import { isLeagueClub } from '../engine/clubEconomy';
import { homeNationality, ORIGINS, originNat, type Origin } from '../data/origins';
import { originKeyOf } from '../data/generate';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { ctClub } from '../data/world/continents';
import { leanTable } from './worldLeagues';
import { hashSeed, homeCountryOf, type Game } from './state';
import type { StaffWorld } from './staffWorld';

/** Cheftrainer eines Vereins: [id, Name, Nation, Geburtsjahr, Ansehen, Stil·3 + Philosophie, im Amt seit, Druck 0–100]. */
export type WHead = [string, string, string, number, number, number, string, number];
/** Freier Trainer der Welt: [id, Name, Nation, Geburtsjahr, Ansehen, Stil·3 + Philosophie, frei seit (Jahr), Ex-Profi 1/0]. */
export type WFree = [string, string, string, number, number, number, number, number];
export interface WorldHeads {
  v: 1;
  /** Laufende Nummer der Trainer-IDs (`wc<n>`). */
  n: number;
  /** Cheftrainer je Verein (Vereine ohne vollen Kader in der Spielerliga). */
  c: Record<string, WHead>;
  /** Freie Trainer der Welt (Entlassene, Ex-Profis aus dem Weltpool). */
  f: WFree[];
}

const STYLES = ['offensiv', 'ausgewogen', 'defensiv', 'konter'] as const;
const PHILS = ['jugend', 'einkauf', 'ausgewogen'] as const;
const H = { id: 0, name: 1, nat: 2, born: 3, rep: 4, sp: 5, since: 6, pr: 7 } as const;
/** Höchstzahl freier Trainer der Welt (Spielstandgröße). */
const FREE_MAX = 160;
/** Höchstens so viele bekannte Auslandstrainer gehen je Saison in den Trainerpool des Heimatlands. */
const TO_HOME_MAX = 2;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const yearOf = (d: string) => Number(d.slice(0, 4));
const days = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

function seeded(key: string): () => number {
  let a = hashSeed(key) >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// -----------------------------------------------------------------------------
// Speicher und Ansicht
// -----------------------------------------------------------------------------
export function worldHeads(g: Game): WorldHeads | null {
  return (g.staffWorld as StaffWorld | undefined)?.heads ?? null;
}
function heads(g: Game): WorldHeads | null {
  const w = g.staffWorld as StaffWorld | undefined;
  if (!w) return null;
  return (w.heads ??= { v: 1, n: 0, c: {}, f: [] });
}

const spOf = (c: ClubCoach) => Math.max(0, STYLES.indexOf(c.style)) * 3 + Math.max(0, PHILS.indexOf(c.philosophy));

/** Trainer als `ClubCoach` (wie bei den KI-Vereinen der Spielerliga). */
export function headView(h: WHead, year: number): ClubCoach {
  const style = STYLES[Math.floor(h[H.sp] / 3)] ?? 'ausgewogen';
  const prefs = formationsFor(style, year);
  return {
    id: h[H.id], name: h[H.name], age: year - h[H.born], nationality: h[H.nat],
    style, philosophy: PHILS[h[H.sp] % 3] ?? 'ausgewogen', reputation: h[H.rep], since: h[H.since],
    preferredFormation: prefs[hashSeed(h[H.id]) % prefs.length], pressure: h[H.pr],
  };
}

function toHead(c: ClubCoach, year: number, since: string, id: string): WHead {
  return [id, c.name, c.nationality, year - c.age, Math.round(clamp(c.reputation, 10, 99)), spOf(c), since, 25];
}
const nextId = (hs: WorldHeads) => `wc${(++hs.n).toString(36)}`;

/** Cheftrainer eines beliebigen Vereins (voll: `Club.coach`; sonst aus dem Pool der Welt). Eigener Verein: keiner. */
export function coachOfClub(g: Game, id: string): ClubCoach | undefined {
  if (id === g.managedClubId) return undefined;
  const c = g.clubs[id]?.coach;
  if (c) return c;
  const h = worldHeads(g)?.c[id];
  return h ? headView(h, yearOf(g.calendar.currentDate)) : undefined;
}

/** Kurzzeile für Anzeigen: „offensiv · setzt auf die Jugend“. */
export function coachStyleText(c: ClubCoach): string {
  return `${COACH_STYLE_LABEL[c.style]} · ${COACH_PHILOSOPHY_LABEL[c.philosophy]}`;
}

// -----------------------------------------------------------------------------
// Welche Vereine, welche Herkunft
// -----------------------------------------------------------------------------
interface Target { rep: number; origin?: Origin; country?: string }

/** Herkunft der Einheimischen eines Vereins außerhalb des Heimatlands (undefined = Heimatland). */
function originFor(g: Game, id: string): { origin?: Origin; country?: string } {
  const e = g.euroClubs?.[id];
  if (e) {
    const cc = COUNTRY_BY_KEY[e.country]?.cc;
    const home = homeCountryOf(g);
    if (cc && (cc === home || (home === 'ger' && cc === 'gdr' && !g.ddrHome))) return {};
    return { origin: ORIGINS[originKeyOf(e.country)], country: e.country };
  }
  const ct = ctClub(id);
  if (ct) return { origin: ORIGINS[originKeyOf(ct.country.key)], country: ct.country.key };
  return {};
}

/** Alle Vereine ohne vollen Kader, die einen Cheftrainer im Pool haben sollen. */
export function headTargets(g: Game): Map<string, Target> {
  const out = new Map<string, Target>();
  for (const s of Object.values(g.simClubs ?? {})) {
    if (g.clubs[s.id] || s.tier === 9 || s.tier === 109 || s.tier >= 200) continue;
    out.set(s.id, { rep: clamp(s.strength + 4, 40, 90) });
  }
  const home = homeCountryOf(g);
  for (const c of Object.values(g.world?.countries ?? {})) {
    if (c.active === false) continue;
    const cc = COUNTRY_BY_KEY[c.name]?.cc;
    if (cc && (cc === home || (home === 'ger' && cc === 'gdr'))) continue;
    const ids = [...(c.tiers[0] ?? []), ...(c.tiers[1] ?? []), ...(c.deep ?? []).flatMap((d) => d?.ids ?? [])];
    for (const id of ids) {
      const e = g.euroClubs?.[id];
      if (!e || g.clubs[id] && isLeagueClub(g.clubs[id])) continue;
      out.set(id, { rep: clamp(e.strength + 8, 40, 95), ...originFor(g, id) });
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Besetzen
// -----------------------------------------------------------------------------
function domesticNat(t: Target, year: number): string | undefined {
  return t.origin ? originNat(t.origin, year, 'wc') : undefined;
}

/** Anteil ausländischer Trainer bei Neubesetzungen je Epoche. */
const foreignShare = (year: number) => (year < 1990 ? 0.12 : year < 2005 ? 0.2 : 0.28);

/**
 * Nachfolger für einen Verein: freie Trainer der Welt (Landsleute zuerst, mit der Epoche öfter auch aus dem
 * Ausland), freie Trainer des Heimat-Trainerpools – sonst ein neuer Name aus dem Land.
 */
function successor(g: Game, hs: WorldHeads, t: Target, date: string, rng: () => number, fresh: boolean): WHead {
  const year = yearOf(date);
  if (!fresh) {
    const dom = domesticNat(t, year) ?? homeNationality();
    const abroad = rng() < foreignShare(year);
    let best = -1, bs = -99;
    hs.f.forEach((f, i) => {
      const age = year - f[3];
      if (age >= 66 || age < 33 || f[4] < t.rep - 26 || f[4] > t.rep + 10) return;
      if ((f[2] === dom) === abroad) return;
      const s = f[4] - Math.abs(f[4] - t.rep) * 0.4 + rng() * 12;
      if (s > bs) { bs = s; best = i; }
    });
    if (best >= 0) {
      const f = hs.f.splice(best, 1)[0];
      return [f[0], f[1], f[2], f[3], f[4], f[5], date, 25];
    }
    // Heimat-Trainerpool: deutsche Trainer im Ausland bzw. Sim-Vereine der Heimat (nur, wenn genug Trainer frei sind).
    const pool = g.coachPool ?? [];
    if (pool.length > 8 && (t.origin ? abroad : rng() < 0.3)) {
      let pc: ClubCoach | null = null, ps = -99;
      for (const c of pool) {
        if (c.age >= 66 || c.reputation < t.rep - 20 || c.reputation > t.rep + 8) continue;
        const s = c.reputation - Math.abs(c.reputation - t.rep) * 0.4 + rng() * 10;
        if (s > ps) { ps = s; pc = c; }
      }
      if (pc) {
        g.coachPool = pool.filter((x) => x !== pc);
        return toHead(pc, year, date, pc.id);
      }
    }
  }
  return toHead(makeCoach(year, t.rep, date, rng, t.origin), year, date, nextId(hs));
}

/** Trainer setzen; ist der Verein gerade als voller Verein angelegt (Gast, Europapokal), auch dort. */
function setHead(g: Game, hs: WorldHeads, id: string, h: WHead): void {
  hs.c[id] = h;
  const club = g.clubs[id];
  if (club && !isLeagueClub(club) && id !== g.managedClubId) club.coach = headView(h, yearOf(g.calendar.currentDate));
}

/** Trainer verlässt einen Verein: in den Kreis der freien Trainer (Ruhestand: weg). */
function release(g: Game, hs: WorldHeads, h: WHead, year: number, retire: boolean, sacked: boolean, toHome: { n: number }, rng: () => number): void {
  if (retire || year - h[3] >= 66) return;
  const rep = clamp(h[4] - (sacked ? 4 : 0), 10, 99);
  // Bekannte Trainer zieht es auch in die Heimat-Liga (Trainerpool des Trainerkarussells).
  if (rep >= 72 && toHome.n < TO_HOME_MAX && rng() < 0.2) {
    toHome.n++;
    const v = headView([...h.slice(0, 4), rep, ...h.slice(5)] as WHead, year);
    (g.coachPool ??= []).push({ ...v, pressure: 0 });
    return;
  }
  hs.f.push([h[0], h[1], h[2], h[3], rep, h[5], year, 0]);
}

function trimFree(hs: WorldHeads, year: number): void {
  hs.f = hs.f.filter((f) => year - f[3] < 68 && year - f[6] < 6);
  if (hs.f.length > FREE_MAX) {
    hs.f.sort((a, b) => (b[4] - (year - b[6]) * 3) - (a[4] - (year - a[6]) * 3));
    hs.f.length = FREE_MAX;
  }
}

/**
 * Jeder Verein ohne vollen Kader bekommt einen Cheftrainer; Vereine, die nicht mehr dazugehören, geben ihn frei.
 * Neues Spiel / altes Spielstand (`initial`): neue Namen fest aus Verein + Saison. Idempotent.
 */
export function ensureWorldHeads(g: Game, initial = false): void {
  const hs = heads(g);
  if (!hs) return;
  const date = g.calendar.currentDate;
  const year = yearOf(date);
  migrateLeanHeads(g, hs);
  const targets = headTargets(g);
  const rng = seeded(`wh:${g.season}:${Object.keys(hs.c).length}`);
  const toHome = { n: 0 };
  for (const id of Object.keys(hs.c)) {
    if (targets.has(id)) continue;
    const club = g.clubs[id];
    if (club && !isLeagueClub(club)) continue; // gerade als Gast angelegt – bleibt bis zum Saisonwechsel
    if (club && isLeagueClub(club) && !club.coach && id !== g.managedClubId) adoptHead(g, club);
    else release(g, hs, hs.c[id], year, false, false, toHome, rng);
    delete hs.c[id];
  }
  for (const [id, t] of targets) {
    if (hs.c[id]) continue;
    const h = initial ? successor(g, hs, t, date, seeded(`wh:${id}:${g.season}`), true) : successor(g, hs, t, date, rng, false);
    // Erstbesetzung: im Amt seit einigen Jahren (fest aus dem Verein).
    if (initial) h[6] = `${year - (hashSeed(id) % 4)}-07-01`;
    setHead(g, hs, id, h);
  }
  // Schon angelegte Gastvereine/Europapokal-Gegner ohne Trainer (ältere Spielstände): nur den Namen setzen.
  for (const c of Object.values(g.clubs)) if (!isLeagueClub(c) && !c.coach && c.id !== g.managedClubId) attachHead(g, c, false);
  trimFree(hs, year);
}

/** Ältere Spielstände: Auslands-Cheftrainer der schlanken Stäbe (game/staffLean.ts) werden Trainer im Pool der Welt. */
function migrateLeanHeads(g: Game, hs: WorldHeads): void {
  const w = g.staffWorld as StaffWorld;
  const year = yearOf(g.calendar.currentDate);
  const gone = new Set<object>();
  for (const m of w.people) {
    if (m.roleId !== 'cheftrainer' || !m.clubId || g.clubs[m.clubId] || !g.euroClubs?.[m.clubId]) continue;
    gone.add(m);
    if (hs.c[m.clubId]) continue;
    const style = m.coach?.style ?? 'ausgewogen', phil = m.coach?.philosophy ?? 'ausgewogen';
    hs.c[m.clubId] = [m.coach?.id ?? nextId(hs), m.name, m.nat ?? 'GER', year - m.age, Math.round(clamp(m.coach?.rep ?? 55, 10, 99)),
      STYLES.indexOf(style) * 3 + PHILS.indexOf(phil), m.hired || g.calendar.currentDate, 25];
  }
  if (gone.size) w.people = w.people.filter((m) => !gone.has(m));
}

/**
 * Verein ohne vollen Kader wird als voller Verein angelegt (Europapokal, Gast im Pokal, Weltpokal): sein
 * Cheftrainer – notfalls neu, fest aus Verein + Saison – steht am Verein, die Taktik folgt seinem Stil.
 */
export function attachHead(g: Game, club: Club, tactics = true): void {
  if (club.id === g.managedClubId || isLeagueClub(club)) return;
  const hs = heads(g);
  if (!hs) return;
  const year = yearOf(g.calendar.currentDate);
  let h = hs.c[club.id];
  if (!h) {
    const t: Target = { rep: clamp(club.reputation ?? 60, 30, 95), ...originFor(g, club.id) };
    h = successor(g, hs, t, g.calendar.currentDate, seeded(`wh:${club.id}:${g.season}`), true);
    hs.c[club.id] = h;
  }
  club.coach = headView(h, year);
  if (tactics) club.tactics = coachTactics(club, g.players, club.coach, year);
}

/** Aufsteiger in die Spielerliga (season.ts 5a): behält seinen Trainer. */
export function adoptHead(g: Game, club: Club): void {
  const hs = worldHeads(g);
  const h = hs?.c[club.id];
  if (!hs || !h || club.id === g.managedClubId) return;
  delete hs.c[club.id];
  if (!club.coach) club.coach = headView(h, yearOf(g.calendar.currentDate));
}

/** Absteiger aus der Spielerliga (season.ts 5b): sein Trainer bleibt beim Verein, jetzt im Pool der Welt. */
export function stashHead(g: Game, club: Club): void {
  const hs = heads(g);
  if (!hs || !club.coach || club.id === g.managedClubId || hs.c[club.id] || !isLeagueClub(club)) return;
  const c = club.coach;
  hs.c[club.id] = toHead(c, yearOf(g.calendar.currentDate), c.since, c.id);
  hs.c[club.id][7] = Math.round(c.pressure * 0.4 + 10);
}

/** Dein Cheftrainer wechselt zu einem Verein ohne vollen Kader (game/staffWorld.ts staffMovedTo). */
export function headMovedTo(g: Game, clubId: string, c: ClubCoach): void {
  const hs = heads(g);
  if (!hs) return;
  const year = yearOf(g.calendar.currentDate);
  const old = hs.c[clubId];
  if (old) release(g, hs, old, year, false, false, { n: TO_HOME_MAX }, seeded(`whm:${clubId}`));
  setHead(g, hs, clubId, toHead(c, year, g.calendar.currentDate, c.id));
}

// -----------------------------------------------------------------------------
// Trainerkarussell der Welt
// -----------------------------------------------------------------------------
interface Standing { id: string; pos: number; exp: number; size: number; top: boolean; form: ('W' | 'D' | 'L')[]; played: number }

/** Tabellen aller Ligen ohne volle Kader: Auslandsligen (Spieltage) und Sim-Ligen der Heimat. */
function standings(g: Game): Map<string, Standing> {
  const out = new Map<string, Standing>();
  const put = (ids: string[], str: (id: string) => number, rows: { id: string; form: ('W' | 'D' | 'L')[]; played: number }[], top: boolean) => {
    const exp = new Map([...ids].sort((a, b) => str(b) - str(a) || (a < b ? -1 : 1)).map((id, i) => [id, i + 1]));
    rows.forEach((r, i) => out.set(r.id, { id: r.id, pos: i + 1, exp: exp.get(r.id) ?? i + 1, size: rows.length, top, form: r.form, played: r.played }));
  };
  for (const [key, d] of Object.entries(g.world?.live?.divs ?? {})) {
    const [land, idx] = key.split('|');
    const rows = leanTable(d, land, g.world!.live!.season);
    put(d.ids, (id) => g.euroClubs?.[id]?.strength ?? 50, rows.map((r) => ({ id: r.clubId, form: r.form, played: r.p })), idx === '0');
  }
  for (const div of g.leagues?.otherDivisions ?? []) {
    const rows = div.table?.rows ?? [];
    if (!rows.length) continue;
    put(rows.map((r) => r.clubId), (id) => g.simClubs?.[id]?.strength ?? 50, rows.map((r) => ({ id: r.clubId, form: r.form ?? [], played: r.played })), div.tier === 2);
  }
  return out;
}

/** Druck aus Tabellenplatz gegen Erwartung (gleiche Formel wie in der Spielerliga). */
function pressureOf(s: Standing, rep: number): number {
  return pressureTarget({ position: s.pos, form: s.form } as Parameters<typeof pressureTarget>[0], s.size, s.exp, rep);
}

/**
 * Täglich (game/aiClubs.ts): am 1.12. und 1.3. Druck auf alle Trainer der Welt, wer weit unter der Erwartung
 * steht, kann entlassen werden; der Nachfolger kommt sofort.
 */
export function worldHeadsDaily(g: Game, today: string): void {
  const md = today.slice(5);
  if (md !== '12-01' && md !== '03-01') return;
  const hs = worldHeads(g);
  if (!hs) return;
  const year = yearOf(today);
  const rng = seeded(`whd:${today}`);
  const st = standings(g);
  const targets = headTargets(g);
  const toHome = { n: TO_HOME_MAX };
  for (const [id, h] of Object.entries(hs.c)) {
    const s = st.get(id);
    if (!s || s.played < 8) continue;
    h[7] = Math.round(clamp(h[7] + (pressureOf(s, h[4]) - h[7]) * 0.6, 0, 100));
    if (h[7] < 72 || days(h[6], today) < 100 || rng() >= (h[7] - 66) / 100 * 1.1) continue;
    release(g, hs, h, year, false, true, toHome, rng);
    const t = targets.get(id) ?? { rep: clamp(h[4], 30, 95), ...originFor(g, id) };
    setHead(g, hs, id, successor(g, hs, t, today, rng, false));
  }
}

/**
 * Saisonende (vor dem Saisonwechsel, Tabellen liegen noch vor): Ansehen nach Abschneiden, Ruhestand,
 * Entlassung, Vertragsende; offene Stellen besetzen – größere Vereine eines Landes werben zuerst ab.
 */
export function worldHeadsSeasonEnd(g: Game, date: string): void {
  const hs = worldHeads(g);
  if (!hs) return;
  const year = yearOf(date);
  const rng = seeded(`whs:${g.season}`);
  const st = standings(g);
  const targets = headTargets(g);
  const toHome = { n: 0 };
  const vacant: string[] = [];
  const stars: { id: string; gain: number; country?: string; rep: number }[] = [];
  for (const [id, h] of Object.entries(hs.c)) {
    const s = st.get(id);
    const age = year - h[3];
    const gain = s ? s.exp - s.pos : 0;
    if (s) h[4] = Math.round(clamp(h[4] + clamp(gain * 1.2, -8, 8) + (s.pos === 1 ? (s.top ? 5 : 2) : 0), 10, 99));
    const years = days(h[6], date) / 365;
    let reason: 'ruhestand' | 'entlassen' | 'vertragsende' | null = null;
    if (age >= 70 || (age >= 65 && rng() < 0.4)) reason = 'ruhestand';
    else if (s && (h[7] >= 65 || gain <= -5) && years >= 0.5 && rng() < 0.55) reason = 'entlassen';
    else if (years >= 3 && rng() < (years >= 5 ? 0.16 : 0.09)) reason = 'vertragsende';
    if (reason) {
      release(g, hs, h, year, reason === 'ruhestand', reason === 'entlassen', toHome, rng);
      delete hs.c[id];
      vacant.push(id);
    } else {
      h[7] = Math.round(h[7] * 0.4 + 10);
      if (gain >= 3) stars.push({ id, gain, country: targets.get(id)?.country, rep: targets.get(id)?.rep ?? h[4] });
    }
  }
  const rep = (id: string) => targets.get(id)?.rep ?? 50;
  vacant.sort((a, b) => rep(b) - rep(a) || (a < b ? -1 : 1));
  for (let i = 0; i < vacant.length; i++) {
    const id = vacant[i];
    const t = targets.get(id) ?? { rep: 50, ...originFor(g, id) };
    const k = stars.findIndex((x) => x.country === t.country && x.rep < t.rep - 3 && hs.c[x.id]);
    if (k >= 0 && rng() < 0.35) {
      const from = stars.splice(k, 1)[0].id;
      const h = hs.c[from];
      delete hs.c[from];
      setHead(g, hs, id, [h[0], h[1], h[2], h[3], h[4], h[5], date, 25]);
      vacant.push(from);
      continue;
    }
    setHead(g, hs, id, successor(g, hs, t, date, rng, false));
  }
  trimFree(hs, year);
}

/**
 * Weltpool (game/worldPool.ts): Ex-Profis, die ihre Karriere beenden, werden mit einer Chance (Stärke) freie
 * Trainer der Welt – bekannt werden sie erst als Trainer (Ansehen unter dem der Spitzentrainer).
 */
export function noteWorldRetirees(g: Game, list: { id: string; name: string; nat: string; born: number; ov: number }[]): void {
  const hs = worldHeads(g);
  if (!hs || !list.length) return;
  const year = yearOf(g.calendar.currentDate);
  for (const p of list) {
    const r = (hashSeed(`wx:${p.id}`) % 1000) / 1000;
    if (p.ov < 60 || r >= clamp((p.ov - 58) * 0.012, 0, 0.3)) continue;
    const sp = (hashSeed(`wxs:${p.id}`) % 4) * 3 + (hashSeed(`wxp:${p.id}`) % 3);
    hs.f.push([nextId(hs), p.name, p.nat, p.born, Math.round(clamp(p.ov - 28 + r * 30, 30, 78)), sp, year + 1, 1]);
  }
  trimFree(hs, year);
}
