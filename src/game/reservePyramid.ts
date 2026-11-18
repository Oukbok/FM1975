// =============================================================================
// ZWEITE MANNSCHAFTEN IN DER LIGAPYRAMIDE (Wunsch Pascal: „inwiefern zweite
// Mannschaften simuliert werden können und zu welchen Zeiten sie unter welchen
// Bedingungen in den oberen Ligen mitspielen können“). Regeln mit Quellen:
// data/reserveRules.ts, Kurzfassung docs/recherche/zweite-mannschaften.md.
// -----------------------------------------------------------------------------
// • Jede zweite Mannschaft ist ein schlanker Sim-Verein `res-<Stammverein>` (Name je
//   Epoche „X Amateure“ bzw. ab 2005 „X II“). Pool (tier 9) = Amateurligen unterhalb der
//   simulierten Ebenen (bis 1994 die Amateur-Oberligen), sonst echte Staffel.
// • KI-Vereine der 1./2. Liga haben eine, je Epoche: bis 2007/08 alle Erstligisten und
//   die meisten Zweitligisten, 2008–2014 Pflicht für alle, ab 2014/15 melden einige ab.
//   Stärke = Amateurniveau (Pool) + Abstand des Stammvereins + Ausbau „Zweite Mannschaft“.
// • Saisonwechsel `reserveTransition` (nach Auf-/Abstieg und Pool-Tausch):
//   nie 2. Liga, nie gleich oder über der ersten Mannschaft → Platz geht an den
//   Bestplatzierten der Liga darunter (Nachrücker); erste Mannschaft steigt in die Liga
//   der zweiten ab → Zwangsabstieg; Stammverein unter der 2. Liga → zweite Mannschaft
//   höchstens Oberliga (Amateurliga), unter Ebene 3 abgemeldet; Obergrenze je Staffel. Deine zweite Mannschaft steigt aus ihrer Amateurliga (game.reserve,
//   game/reserveTeam.ts) als Meister auf, wenn die Ebene darüber erlaubt ist.
// • DFB-Pokal bis 2007/08: bis zu drei Amateurmannschaften (deine bei Platz 1–3, die KI
//   nach Abschneiden/Stärke) bekommen einen Amateurplatz – als Pokal-Verein `amr-…`
//   mit eigenem Kader aus Vertragsamateuren (Pokalbindung: Profis spielen für die erste).
// Spielstand: optionale Felder `game.reserveSeeded` (Jahr der ersten Einordnung) und die
// Sim-Vereine `res-*`; alte Spielstände werden zum nächsten Saisonwechsel eingeordnet.
// =============================================================================
import type { Game } from './state';
import { homeCountryOf } from './state';
import type { LeagueDivision, LeagueGroup, SimClub } from '../engine/leagues';
import { hashStr } from '../engine/leagues';
import { POOL_TIER } from '../data/history/historicClubs';
import { CITY_LV, LV_REGION } from '../data/youthCompetitions';
import { RESERVE_OPTIONAL_FROM, reserveCupOpen, reserveName } from '../data/reserveRules';
import { seasonStartYear } from '../data/timeline';
import { makePlaceholder } from '../data/reforms';
import { migrateSeating } from './seatingGame';
import { isForeignId } from '../engine/world';
import { buildProClub } from '../data/generate';
import { makeMessage, pushMessage } from '../engine/messages';
import { RES_PREFIX, clubTierNow, isReserveId, ownReserveId, parentOfReserve, reserveCap, reserveIdOf, reserveTierOk } from './reserveIds';
import { RESERVE_CUP_PREFIX } from './reserveCup';
import { amateurFinalPos, lowestSimTier } from './amateurLeagues';
import { seedDdrReserves } from './ddrReserves';
import { finishLocalSeason, reserveLevel, sortedTable, xiStrengthNow, type ReserveState } from './reserveTeam';

type G = Game & { reserve?: ReserveState; reserveSeeded?: number };
export interface Slot { key: string; tier: number; group: LeagueGroup; ids: string[] }

const isGer = (g: Game) => homeCountryOf(g) === 'ger';
const RANK: Record<string, number> = { nord: 4, nordost: 3, west: 2, sued: 1 };

/** Region eines Vereins (Staffel-Kennung) aus der Stadt bzw. seiner Gruppe. */
export function regionOf(g: Game, id: string): LeagueGroup {
  const city = g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '';
  const lv = CITY_LV[city];
  if (lv) { const r = LV_REGION[lv]; return r === 'suedwest' ? 'west' : r; }
  return (g.simClubs[id]?.group ?? 'west') as LeagueGroup;
}

/** Passende Staffel einer Ebene für eine Region (eingleisig = immer; sonst gleiche bzw. nächstgelegene Region). */
export function slotForRegion(slots: Slot[], region: LeagueGroup, strict: boolean): Slot | undefined {
  if (!slots.length) return undefined;
  const same = slots.find((s) => s.group === region || s.group == null);
  if (same) return same;
  if (strict && slots.length < 3) return undefined; // z. B. NOFV-Oberliga 1991–94 nur für den Nordosten
  const r = RANK[region ?? 'west'] ?? 2;
  return [...slots].sort((a, b) => Math.abs((RANK[a.group ?? ''] ?? 2) - r) - Math.abs((RANK[b.group ?? ''] ?? 2) - r))[0];
}

// -----------------------------------------------------------------------------
// Wer hat eine zweite Mannschaft, wie stark ist sie?
// -----------------------------------------------------------------------------
/** Hat der Stammverein (Ebene `tier`) im Jahr eine zweite Mannschaft? */
export function wantsReserve(g: Game, parentId: string, tier: number, year: number): boolean {
  if (parentId === g.managedClubId) return reserveLevel(g.clubs[parentId]) > 0;
  if (tier > 3 || isForeignId(parentId) || parentId.startsWith('am') || parentId.startsWith('ph-')) return false;
  const c = g.clubs[parentId];
  if (c && (c.youthInvest?.levels.reserve ?? 0) > 0) return true;
  const h = hashStr(`res:${parentId}`) % 100;
  if (year < 2008) return tier === 1 || h < 70;
  if (year < RESERVE_OPTIONAL_FROM) return true; // Pflicht für Lizenzvereine
  return tier === 1 ? h < 80 : h < 45;
}

function parentStrength(g: Game, id: string): number {
  const s = g.simClubs[id];
  if (s) return s.strength;
  const c = g.clubs[id];
  if (!c) return 60;
  const o = c.playerIds.map((p) => g.players[p]?.overall ?? 50);
  return o.length ? o.reduce((a, b) => a + b, 0) / o.length : 60;
}

/** Niveau der Amateurligen (Pool ohne zweite Mannschaften). */
function amateurBase(g: Game): number {
  const pool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER && !isReserveId(s.id));
  return pool.length ? pool.reduce((a, s) => a + s.strength, 0) / pool.length : 48;
}

function aiStrength(g: Game, parentId: string, year: number, base: number): number {
  const lvl = g.clubs[parentId]?.youthInvest?.levels.reserve ?? 1;
  const jitter = ((hashStr(`resj:${parentId}:${year}`) % 100) / 100 - 0.5) * 4;
  return Math.round(Math.max(40, Math.min(75, base + 5 + (parentStrength(g, parentId) - 70) * 0.25 + (lvl >= 2 ? 2 : 0) + jitter)));
}

function makeReserve(g: Game, parentId: string, year: number): SimClub {
  const p = g.clubs[parentId] ?? g.simClubs[parentId];
  const name = reserveName(p?.name ?? parentId, year);
  return {
    id: reserveIdOf(parentId), name, shortName: `${(p?.shortName ?? parentId).slice(0, 3)}2`, city: p?.city ?? '',
    strength: 50, colors: { primary: p?.colors.primary ?? '#888888', secondary: p?.colors.secondary ?? '#FFFFFF' },
    tier: POOL_TIER, group: regionOf(g, parentId),
  };
}

/** Stammvereine (volle Vereine + Sim-Vereine der 1./2. Liga, ohne DDR-Ligen) mit ihrer Ebene. */
function parentCandidates(g: Game, tierOf: (id: string) => number): { id: string; tier: number }[] {
  const out: { id: string; tier: number }[] = [];
  for (const c of Object.values(g.clubs)) {
    if (c.id.startsWith('am') || isForeignId(c.id) || isReserveId(c.id)) continue;
    out.push({ id: c.id, tier: tierOf(c.id) });
  }
  for (const s of Object.values(g.simClubs)) if (!isReserveId(s.id) && tierOf(s.id) <= 3) out.push({ id: s.id, tier: tierOf(s.id) });
  return out;
}

/** Zweite Mannschaften anlegen/abmelden (Pool) und Name/Stärke nachführen. */
export function syncReserveClubs(g: Game, year: number, tierOf: (id: string) => number = (id) => clubTierNow(g, id)): string[] {
  if (!isGer(g)) return [];
  const want = new Set<string>();
  for (const p of parentCandidates(g, tierOf)) {
    const rid = reserveIdOf(p.id);
    // Abgestiegene Vereine (Ebene 3) behalten ihre zweite Mannschaft, gründen aber keine neue.
    if (wantsReserve(g, p.id, p.tier, year) && (p.tier <= 2 || p.id === g.managedClubId || g.simClubs[rid] || g.clubs[rid])) want.add(rid);
  }
  const removed: string[] = [];
  // DDR-Reserven (game/ddrReserves.ts) laufen getrennt.
  for (const id of [...Object.keys(g.simClubs), ...Object.keys(g.clubs)]) if (isReserveId(id) && !g.simClubs[id]?.ddr && !want.has(id) && !removed.includes(id)) removed.push(id);
  const base = amateurBase(g);
  for (const id of want) {
    const pid = parentOfReserve(id);
    if (g.clubs[id]) continue; // spielt gerade in deiner Liga mit vollem Kader (season.ts 5a)
    if (!g.simClubs[id]) g.simClubs[id] = makeReserve(g, pid, year);
    const s = g.simClubs[id];
    const parent = g.clubs[pid] ?? g.simClubs[pid];
    if (parent) s.name = reserveName(parent.name, year);
    if (pid !== g.managedClubId) s.strength = aiStrength(g, pid, year, base);
    else s.strength = Math.round(xiStrengthNow(g) || base + 4);
  }
  return removed;
}

// -----------------------------------------------------------------------------
// Einordnung (neues Spiel bzw. erster Saisonwechsel eines alten Spielstands)
// -----------------------------------------------------------------------------
/** Plant, welche zweiten Mannschaften die unterste simulierte Ebene schon beim Start belegen. */
export function planPlacement(g: Game, slots: Slot[], year: number): { key: string; outId: string; inId: string }[] {
  const west = slots.filter((s) => s.tier < 100);
  if (!west.length) return [];
  const lowest = Math.max(...west.map((s) => s.tier));
  const low = west.filter((s) => s.tier === lowest);
  if (lowest < 3) return [];
  const per = Math.min(3, reserveCap(year, low.length === 1));
  const own = ownReserveId(g);
  const cands = Object.values(g.simClubs).filter((s) => isReserveId(s.id) && s.tier === POOL_TIER
    && (s.id !== own || reserveLevel(g.clubs[g.managedClubId]) >= 2)
    && reserveTierOk(lowest, clubTierNow(g, parentOfReserve(s.id))))
    .sort((a, b) => (b.id === own ? 1 : 0) - (a.id === own ? 1 : 0) || b.strength - a.strength);
  const out: { key: string; outId: string; inId: string }[] = [];
  const used = new Set<string>();
  for (const r of cands) {
    const slot = slotForRegion(low, regionOf(g, parentOfReserve(r.id)), true);
    if (!slot) continue;
    const n = slot.ids.filter(isReserveId).length + out.filter((o) => o.key === slot.key).length;
    if (n >= per) continue;
    // Platz des Schwächsten (nie dein Verein, keine zweite Mannschaft).
    const victim = [...slot.ids].reverse().find((id) => !isReserveId(id) && id !== g.managedClubId && !used.has(id)
      && !(g.simClubs[id]?.strength != null && g.simClubs[id].strength > r.strength + 6 && r.id !== own));
    if (!victim) continue;
    used.add(victim);
    out.push({ key: slot.key, outId: victim, inId: r.id });
  }
  return out;
}

function swapInDivision(div: LeagueDivision, outId: string, inId: string): void {
  div.clubIds = div.clubIds.map((x) => (x === outId ? inId : x));
  for (const m of div.fixtures) { if (m.homeClubId === outId) m.homeClubId = inId; if (m.awayClubId === outId) m.awayClubId = inId; }
  for (const r of div.table.rows) if (r.clubId === outId) r.clubId = inId;
}

/** Neues Spiel: zweite Mannschaften anlegen und die unterste Ebene (ab 1994) einordnen. */
export function seedReserveTeams(g: Game): void {
  if (!isGer(g) || !g.leagues) return;
  const year = seasonStartYear(g.season);
  syncReserveClubs(g, year);
  const divs = g.leagues.otherDivisions.filter((d) => d.tier < 100 && d.nextMatchday <= 1);
  const plan = planPlacement(g, divs.map((d) => ({ key: d.id, tier: d.tier, group: d.group, ids: d.clubIds })), year);
  for (const p of plan) {
    const d = g.leagues.otherDivisions.find((x) => x.id === p.key)!;
    swapInDivision(d, p.outId, p.inId);
    g.simClubs[p.inId].tier = d.tier; g.simClubs[p.inId].group = d.group;
    if (g.simClubs[p.outId]) g.simClubs[p.outId].tier = POOL_TIER;
  }
  (g as G).reserveSeeded = year;
  seedDdrReserves(g); // DDR-Oberligisten: DDR-Liga bzw. Nachwuchsoberliga (game/ddrReserves.ts)
}

// -----------------------------------------------------------------------------
// Saisonwechsel
// -----------------------------------------------------------------------------
export interface ReserveTransition { pooled: string[]; cup: string[]; notes: string[] }

function bestPoolClub(g: Game, group: LeagueGroup, taken: Set<string>): string | undefined {
  const pool = Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER && !isReserveId(s.id) && !taken.has(s.id));
  pool.sort((a, b) => (b.group === group ? 1 : 0) - (a.group === group ? 1 : 0) || b.strength - a.strength);
  if (pool[0]) return pool[0].id;
  // Pool leer: fiktiver Amateurverein als Nachrücker (wie bei Ligareformen, data/reforms.ts).
  const ph = makePlaceholder(`res:${g.season}`, 4, group);
  g.simClubs[ph.id] = { ...ph, tier: POOL_TIER };
  return ph.id;
}

/**
 * Nach Auf-/Abstieg und Pool-Tausch (season.ts): zweite Mannschaften nach den Regeln der Zeit
 * einordnen. `membership` wird verändert; zurück kommen Vereine, die in den Pool gehen.
 */
export function reserveTransition(
  g: Game, membership: Record<string, { ids: string[]; meta: { tier: number; group: LeagueGroup; name: string } }>, newSeason: string,
): ReserveTransition {
  const out: ReserveTransition = { pooled: [], cup: [], notes: [] };
  if (!isGer(g)) return out;
  const gg = g as G;
  const year = seasonStartYear(newSeason);
  const keys = () => Object.keys(membership).filter((k) => membership[k].meta.tier < 100);
  const tierIn = (id: string) => { for (const k of keys()) if (membership[k].ids.includes(id)) return membership[k].meta.tier; return undefined; };
  const tierOf = (id: string) => tierIn(id) ?? (g.simClubs[id]?.tier ?? (g.clubs[id] ? 1 : 99));
  const own = ownReserveId(g);
  const ownBefore = g.simClubs[own] ? tierIn(own) ?? null : null;
  const prevOwnTier = g.simClubs[own]?.tier ?? POOL_TIER;

  // 1) Cup-Plätze aus der abgelaufenen Saison (vor allen Änderungen).
  out.cup = cupQualifiers(g, year);
  // 2) Anlegen/Abmelden.
  const removed = syncReserveClubs(g, year, tierOf);
  const taken = new Set<string>();
  for (const k of keys()) for (const id of membership[k].ids) taken.add(id);
  const replaceWithPool = (k: string, id: string) => {
    const m = membership[k];
    const repl = bestPoolClub(g, m.meta.group, taken);
    if (!repl) return false;
    taken.add(repl);
    m.ids[m.ids.indexOf(id)] = repl;
    return true;
  };
  for (const id of removed) {
    const k = keys().find((x) => membership[x].ids.includes(id));
    if (k && !replaceWithPool(k, id)) continue;
    delete g.simClubs[id];
    const full = g.clubs[id]; // spielte mit vollem Kader in deiner Liga
    if (full) {
      for (const pid of full.playerIds) delete g.players[pid];
      for (const yid of full.youthPlayerIds ?? []) delete g.youthPlayers[yid];
      delete g.clubs[id];
    }
    if (id === own) out.notes.push('Die zweite Mannschaft ist abgemeldet.');
  }

  // 3) Deine Amateurliga: Aufstieg als Meister, Abstieg der letzten drei.
  const st = gg.reserve;
  const oldDiv = g.leagues.otherDivisions.find((d) => d.tier < 100 && d.clubIds.includes(own));
  if (st && oldDiv) { // Endplatz in der Staffel festhalten
    const rows = [...oldDiv.table.rows].sort((a, b) => a.position - b.position);
    st.hist = [...(st.hist ?? []), { season: g.season, league: oldDiv.name, pos: rows.findIndex((r) => r.clubId === own) + 1, n: rows.length }].slice(-30);
  }
  const legacy = !!st && st.leagueName == null && !oldDiv; // alter Spielstand: erfundene Mini-Liga
  if (g.simClubs[own] && st && legacy) {
    // Einordnung statt Auf-/Abstieg: Stufe 2 (U23) in die unterste simulierte Staffel, sonst höchste Amateurliga.
    st.depth = 0;
    const res = reserveLevel(g.clubs[g.managedClubId]) >= 2 ? promoteOwn(g, membership, year, taken, true) : null;
    if (res?.ok) out.pooled.push(...res.pooled);
    out.notes.push(res?.ok ? 'Die zweite Mannschaft spielt ab jetzt in der echten Ligapyramide – eingeordnet in die unterste Staffel.' : 'Die zweite Mannschaft spielt ab jetzt in der echten Ligapyramide – eingeordnet in die höchste Amateurliga ihrer Region.');
  } else if (g.simClubs[own] && st && st.season === g.season && st.table.length && ownBefore == null) {
    const { pos, n } = finishLocalSeason(g, st);
    const depth = st.depth ?? 0;
    const label = st.leagueName ?? 'Amateurliga';
    st.hist = [...(st.hist ?? []), { season: g.season, league: label, pos, n }].slice(-30);
    if (pos === 1 && depth > 0) { st.depth = depth - 1; out.notes.push(`Meister der ${label} – Aufstieg in die nächsthöhere Amateurliga.`); }
    else if (pos === 1) {
      const res = promoteOwn(g, membership, year, taken);
      if (res.ok) out.pooled.push(...res.pooled);
      out.notes.push(res.text);
    } else if (pos > n - 3) { st.depth = Math.min(2, depth + 1); out.notes.push(depth >= 2 ? `Platz ${pos} in der ${label} – tiefer wird nicht gezählt, die Mannschaft bleibt.` : `Platz ${pos} in der ${label} – Abstieg.`); }
  }
  // Abstieg aus einer Staffel in die Amateurliga (Pool-Tausch hat sie schon abgegeben).
  if (st && ownBefore == null && prevOwnTier < 100 && prevOwnTier !== POOL_TIER && g.simClubs[own] && !tierIn(own)) {
    st.depth = 0; out.notes.push('Abstieg aus der Staffel – die zweite Mannschaft spielt wieder in der höchsten Amateurliga.');
  }

  // 4) Erstmalige Einordnung der KI-Mannschaften (alter Spielstand).
  if (!gg.reserveSeeded) {
    const slots = keys().map((k) => ({ key: k, tier: membership[k].meta.tier, group: membership[k].meta.group, ids: membership[k].ids }));
    for (const p of planPlacement(g, slots, year).filter((x) => x.inId !== own)) {
      const m = membership[p.key];
      m.ids[m.ids.indexOf(p.outId)] = p.inId; taken.add(p.inId); out.pooled.push(p.outId);
    }
    gg.reserveSeeded = year;
  }

  // 5) Regeln prüfen, Ebene für Ebene von oben: gesperrt/Zwangsabstieg/Obergrenze.
  const tiers = [...new Set(keys().map((k) => membership[k].meta.tier))].sort((a, b) => a - b);
  for (const tier of tiers) {
    const here = keys().filter((k) => membership[k].meta.tier === tier);
    const lower = keys().filter((k) => membership[k].meta.tier === tier + 1);
    for (const k of here) {
      const m = membership[k];
      const bad: string[] = [];
      for (const id of m.ids) if (isReserveId(id) && !reserveTierOk(tier, tierOf(parentOfReserve(id)))) bad.push(id);
      const cap = reserveCap(year, here.length === 1);
      const okRes = m.ids.filter((id) => isReserveId(id) && !bad.includes(id));
      if (tier >= 3 && okRes.length > cap) bad.push(...okRes.slice(cap)); // schlechtest Platzierte zuerst raus
      for (const id of bad) {
        const parentTier = tierOf(parentOfReserve(id));
        const why = tier <= 2 ? 'die 2. Liga ist für zweite Mannschaften gesperrt'
          : parentTier >= tier ? 'die erste Mannschaft spielt in derselben Liga (Zwangsabstieg)'
            : parentTier > 2 ? 'die erste Mannschaft spielt unterhalb der 2. Liga (höchstens Oberliga)'
            : 'zu viele zweite Mannschaften in der Staffel';
        const dest = slotForRegion(lower.map((x) => ({ key: x, tier: tier + 1, group: membership[x].meta.group, ids: membership[x].ids })), regionOf(g, parentOfReserve(id)), false);
        const i = m.ids.indexOf(id);
        if (dest) {
          const dm = membership[dest.key];
          const up = dm.ids.find((x) => !isReserveId(x) && x !== g.managedClubId);
          if (!up) continue;
          dm.ids[dm.ids.indexOf(up)] = id; m.ids[i] = up;
        } else {
          const repl = bestPoolClub(g, m.meta.group, taken);
          if (!repl) continue;
          taken.add(repl); m.ids[i] = repl; out.pooled.push(id);
        }
        if (id === own) out.notes.push(`Die zweite Mannschaft darf nicht in der ${m.meta.name} spielen: ${why}.`);
      }
    }
  }
  if (st) st.note = out.notes.length ? out.notes[out.notes.length - 1] : undefined;
  for (const n of out.notes) {
    pushMessage(g.messages, makeMessage({ date: g.calendar.currentDate, category: 'general', from: 'Trainer der Amateure', subject: 'Zweite Mannschaft', shortText: n, bodyText: n }));
  }
  return out;
}

function promoteOwn(g: Game, membership: Record<string, { ids: string[]; meta: { tier: number; group: LeagueGroup; name: string } }>, year: number, taken: Set<string>, silent = false): { ok: boolean; pooled: string[]; text: string } {
  const own = ownReserveId(g);
  const keys = Object.keys(membership).filter((k) => membership[k].meta.tier < 100);
  const lowest = Math.max(...keys.map((k) => membership[k].meta.tier));
  const parentTier = membership[keys.find((k) => membership[k].ids.includes(g.managedClubId)) ?? '']?.meta.tier ?? 1;
  if (!reserveTierOk(lowest, parentTier)) {
    return { ok: false, pooled: [], text: lowest <= 2
      ? 'Meister – aber der Aufstieg in die 2. Liga ist für zweite Mannschaften gesperrt. Der Platz geht an den Nächsten.'
      : `Meister – Aufstieg gesperrt: die erste Mannschaft spielt selbst in Ebene ${parentTier}.` };
  }
  const slots = keys.filter((k) => membership[k].meta.tier === lowest).map((k) => ({ key: k, tier: lowest, group: membership[k].meta.group, ids: membership[k].ids }));
  const slot = slotForRegion(slots, regionOf(g, g.managedClubId), true);
  if (!slot) return { ok: false, pooled: [], text: 'Meister – für deine Region gibt es auf der nächsten Ebene keine Staffel, der Aufstieg entfällt.' };
  if (slot.ids.filter(isReserveId).length >= reserveCap(year, slots.length === 1)) return { ok: false, pooled: [], text: `Meister – die ${membership[slot.key].meta.name} hat schon die erlaubte Zahl zweiter Mannschaften.` };
  const victim = [...slot.ids].reverse().find((id) => !isReserveId(id) && id !== g.managedClubId);
  if (!victim) return { ok: false, pooled: [], text: 'Meister – kein Platz frei.' };
  slot.ids[slot.ids.indexOf(victim)] = own; taken.add(own);
  return { ok: true, pooled: [victim], text: silent ? '' : `Meister! Die zweite Mannschaft steigt in die ${membership[slot.key].meta.name} auf.` };
}

// -----------------------------------------------------------------------------
// DFB-Pokal (bis 2007/08)
// -----------------------------------------------------------------------------
function cupQualifiers(g: Game, year: number): string[] {
  if (!reserveCupOpen(year)) return [];
  const own = ownReserveId(g);
  const st = (g as G).reserve;
  const out: string[] = [];
  const posIn = (id: string): { tier: number; pos: number } | null => {
    for (const d of g.leagues.otherDivisions) {
      if (d.tier >= 100 || !d.clubIds.includes(id)) continue;
      const rows = [...d.table.rows].sort((a, b) => a.position - b.position);
      return { tier: d.tier, pos: rows.findIndex((r) => r.clubId === id) + 1 };
    }
    return null;
  };
  if (g.simClubs[own]) {
    const p = posIn(own);
    const localPos = st && st.season === g.season && st.table.length ? localPosition(st) : 99;
    if ((p && p.pos <= 3) || (!p && (st?.depth ?? 0) === 0 && localPos <= 3)) out.push(own);
  }
  const ai = Object.values(g.simClubs).filter((s) => isReserveId(s.id) && s.id !== own && !s.ddr).map((s) => {
    const p = posIn(s.id);
    const jitter = (hashStr(`rescup:${s.id}:${year}`) % 100) / 10;
    // Amateurliga (game/amateurLeagues.ts): Endplatz zählt wie eine Staffel der Ebene darunter.
    const am = p ? null : amateurFinalPos(g, s.id);
    return { id: s.id, score: p ? (6 - p.tier) * 30 - p.pos * 2 + jitter : am ? (6 - lowestSimTier(g) - 1) * 30 - am * 2 + jitter : s.strength - 20 + jitter };
  }).sort((a, b) => b.score - a.score);
  for (const x of ai) { if (out.length >= 3) break; out.push(x.id); }
  return out;
}

function localPosition(st: ReserveState): number {
  return sortedTable(st).findIndex((r) => r.id === 'own') + 1;
}

export { RESERVE_CUP_PREFIX };

/** Pokal-Vereine der Amateure der neuen Saison: alte entfernen, neue mit Vertragsamateuren anlegen. */
export function reserveCupClubs(g: Game, ids: string[], seasonStart: string): string[] {
  for (const c of Object.values(g.clubs)) {
    if (!c.id.startsWith(RESERVE_CUP_PREFIX)) continue;
    for (const pid of c.playerIds) delete g.players[pid];
    for (const yid of c.youthPlayerIds ?? []) { delete g.youthPlayers[yid]; delete g.players[yid]; }
    delete g.clubs[c.id];
  }
  const out: string[] = [];
  for (const id of ids) {
    const s = g.simClubs[id];
    if (!s) continue;
    const cid = `${RESERVE_CUP_PREFIX}${parentOfReserve(id)}`;
    const c = buildProClub({ ...s, id: cid, strength: s.strength }, g.managedClubId, seasonStart, g.players, g.youthPlayers, 4);
    for (const yid of c.youthPlayerIds ?? []) { delete g.youthPlayers[yid]; delete g.players[yid]; }
    c.youthPlayerIds = [];
    c.name = s.name; c.shortName = s.shortName;
    g.clubs[cid] = c;
    out.push(cid);
  }
  if (out.length) migrateSeating(g); // Platzkategorien wie bei allen Vereinen (sonst rüstet erst das Laden nach)
  return out;
}

/** Zweite Mannschaft eines Vereins (Sim-Verein) oder null. */
export const reserveOf = (g: Game, parentId: string): SimClub | null => g.simClubs?.[reserveIdOf(parentId)] ?? null;
export const isReserveCupId = (id: string) => id.startsWith(RESERVE_CUP_PREFIX);
export { RES_PREFIX };
