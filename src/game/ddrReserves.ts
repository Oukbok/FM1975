// =============================================================================
// ZWEITE MANNSCHAFTEN DER DDR-OBERLIGISTEN (Regeln: data/reserveRules.ts `ddrReserveLeague`)
// -----------------------------------------------------------------------------
//  • bis 1975/76: in der DDR-Liga (ohne Aufstiegsrecht in die Oberliga),
//  • 1976–1984: alle in der eigenen Nachwuchsoberliga (Tabelle in game/amateurLeagues.ts,
//    parallel zur Oberliga, ohne Auf-/Abstieg),
//  • 1984–1990: wieder in der DDR-Liga ohne Aufstiegsrecht,
//  • ab 1990/91: keine mehr; mit der Wende ordnen sich die Vereine aus dem Osten ins
//    gesamtdeutsche System ein (ihre zweiten Mannschaften entstehen dort über
//    game/reservePyramid.ts `syncReserveClubs` wie bei allen Vereinen bis Ebene 3).
// Im Spiel ist die DDR-Liga eine Staffel mit 12 Vereinen (historisch zwei bis fünf Staffeln) –
// deshalb spielen dort höchstens vier zweite Mannschaften (etwa der historische Anteil; die
// übrigen gelten als in den Bezirksligen). Steigt der Stammverein in die DDR-Liga ab, muss die
// zweite weichen (Zwangsabstieg); eine abgestiegene zweite Mannschaft fällt in die Bezirksliga
// (abgemeldet). Neue kommen nur zu Beginn einer DDR-Liga-Epoche (1984) hinzu.
// Sim-Vereine `res-<DDR-Verein>` mit `ddr: true`: Ebene 102 in der DDR-Liga, sonst 108
// (außerhalb der Pyramide, nie im DDR-Pool).
// =============================================================================
import type { Game } from './state';
import type { SimClub } from '../engine/leagues';
import { hashStr, simDisplayName } from '../engine/leagues';
import { DDR_POOL_TIER } from '../data/history/historicClubs';
import { ddrReserveLeague } from '../data/reserveRules';
import { seasonStartYear } from '../data/timeline';
import { makeMessage, pushMessage } from '../engine/messages';
import { isReserveId, parentOfReserve, reserveIdOf } from './reserveIds';

export const DDR_RES_TIER = 108;
export const DDR_RESERVE_CAP = 4;
const OBER = 101, LIGA = 102;

/** Wo spielen die zweiten Mannschaften der DDR im Jahr? */
export function ddrReserveMode(year: number): 'liga' | 'nol' | 'none' {
  const l = ddrReserveLeague(year);
  return l === 'DDR-Liga' ? 'liga' : l === 'Nachwuchsoberliga' ? 'nol' : 'none';
}

export const isDdrReserve = (g: Game, id: string) => isReserveId(id) && !!g.simClubs[id]?.ddr;
const ddrReserves = (g: Game) => Object.values(g.simClubs).filter((s) => s.ddr && isReserveId(s.id));

function ddrLevel(g: Game): { pool: number; ober: number } {
  const avg = (xs: SimClub[]) => (xs.length ? xs.reduce((a, s) => a + s.strength, 0) / xs.length : 55);
  const all = Object.values(g.simClubs).filter((s) => s.ddr && !isReserveId(s.id));
  return { pool: avg(all.filter((s) => s.tier === DDR_POOL_TIER)), ober: avg(all.filter((s) => s.tier === OBER)) };
}

/** Zweite Mannschaft eines Oberligisten anlegen bzw. Name/Stärke nachführen. */
function ensureDdrReserve(g: Game, parentId: string, year: number, tier: number): SimClub | null {
  const p = g.simClubs[parentId];
  if (!p) return null;
  const id = reserveIdOf(parentId);
  const lv = ddrLevel(g);
  const jitter = ((hashStr(`ddrres:${parentId}:${year}`) % 100) / 100 - 0.5) * 4;
  const strength = Math.round(Math.max(40, Math.min(70, lv.pool + 4 + (p.strength - lv.ober) * 0.3 + jitter)));
  const name = `${simDisplayName(p, year)} II`;
  const s = g.simClubs[id] ?? (g.simClubs[id] = { id, name, shortName: `${p.shortName.slice(0, 3)}2`, city: p.city, strength, colors: { ...p.colors }, tier, group: 'nordost', ddr: true });
  s.name = name; s.strength = strength;
  return s;
}

/** Bester DDR-Pool-Verein als Nachrücker (nie eine zweite Mannschaft). */
function poolPick(g: Game, taken: Set<string>): string | null {
  const c = Object.values(g.simClubs).filter((s) => s.tier === DDR_POOL_TIER && !isReserveId(s.id) && !taken.has(s.id)).sort((a, b) => b.strength - a.strength)[0];
  return c?.id ?? null;
}

/**
 * Neue DDR-Liga-Besetzung (`ids`) nach den Regeln des Jahres anpassen. `oberIds` = Oberliga der neuen Saison.
 * Rückgabe: angepasste Liste; Vereinsebenen werden gesetzt.
 */
export function ddrReserveLiga(g: Game, ids: string[], oberIds: string[], year: number, seed: boolean): { ids: string[]; notes: string[] } {
  const mode = ddrReserveMode(year);
  const notes: string[] = [];
  const out = [...ids];
  const taken = new Set([...ids, ...oberIds]);
  const replace = (id: string) => {
    const repl = poolPick(g, taken);
    if (!repl) return false;
    taken.add(repl);
    out[out.indexOf(id)] = repl;
    g.simClubs[repl].tier = LIGA;
    return true;
  };
  // 1) Zweite Mannschaften in der Liga prüfen.
  for (const id of out.filter((x) => isReserveId(x))) {
    const parentInOber = oberIds.includes(parentOfReserve(id));
    if (mode === 'liga' && parentInOber) continue;
    if (!replace(id)) continue;
    if (mode === 'liga') notes.push(`${g.simClubs[id]?.name ?? id}: Zwangsabstieg, die erste Mannschaft spielt selbst in der DDR-Liga.`);
    if (g.simClubs[id]) g.simClubs[id].tier = DDR_RES_TIER;
  }
  // 2) Epochenbeginn: bis zu vier zweite Mannschaften der stärksten Oberligisten aufnehmen (Platz der Schwächsten).
  if (mode === 'liga' && seed) {
    const parents = oberIds.map((id) => g.simClubs[id]).filter((s): s is SimClub => !!s).sort((a, b) => b.strength - a.strength);
    let n = out.filter(isReserveId).length;
    for (const p of parents) {
      if (n >= DDR_RESERVE_CAP) break;
      const rid = reserveIdOf(p.id);
      if (out.includes(rid)) continue;
      const victim = out.filter((x) => !isReserveId(x)).sort((a, b) => (g.simClubs[a]?.strength ?? 50) - (g.simClubs[b]?.strength ?? 50))[0];
      if (!victim) break;
      const r = ensureDdrReserve(g, p.id, year, LIGA)!;
      r.tier = LIGA;
      out[out.indexOf(victim)] = rid;
      if (g.simClubs[victim]) g.simClubs[victim].tier = DDR_POOL_TIER;
      n++;
    }
  }
  return { ids: out, notes };
}

/** Name/Stärke/Ebene aller DDR-Reserven nachführen; Nachwuchsoberliga: alle Oberligisten; ab 1990 abmelden. */
export function syncDdrReserves(g: Game, oberIds: string[], ligaIds: string[], year: number): void {
  const mode = ddrReserveMode(year);
  if (mode === 'none') { for (const s of ddrReserves(g)) delete g.simClubs[s.id]; return; }
  for (const s of ddrReserves(g)) {
    if (ligaIds.includes(s.id)) { s.tier = LIGA; ensureDdrReserve(g, parentOfReserve(s.id), year, LIGA); continue; }
    if (mode === 'nol' && oberIds.includes(parentOfReserve(s.id))) { s.tier = DDR_RES_TIER; continue; }
    delete g.simClubs[s.id]; // Bezirksliga bzw. Stammverein nicht mehr in der Oberliga
  }
  if (mode === 'nol') for (const id of oberIds) ensureDdrReserve(g, id, year, DDR_RES_TIER)!.tier = DDR_RES_TIER;
}

/** Saisonwechsel (season.ts, nach ddrExchange): Besetzung der DDR-Liga + Nachwuchsoberliga. */
export function ddrReserveTransition(g: Game, ddrNew: Record<string, string[]>, ober: string, liga: string, year: number): void {
  const oberIds = ddrNew[ober] ?? [];
  const ligaIds = ddrNew[liga];
  if (!ligaIds) return;
  const prev = ddrReserveMode(year - 1);
  const r = ddrReserveLiga(g, ligaIds, oberIds, year, prev !== 'liga');
  ddrNew[liga] = r.ids;
  syncDdrReserves(g, oberIds, r.ids, year);
  const mode = ddrReserveMode(year);
  const text = mode !== prev
    ? mode === 'nol' ? 'Die zweiten Mannschaften der Oberligisten verlassen die DDR-Liga und spielen ab sofort in der eigenen Nachwuchsoberliga.'
      : mode === 'liga' ? `Die Nachwuchsoberliga ist aufgelöst: Zweite Mannschaften spielen wieder in der DDR-Liga – ohne Aufstiegsrecht (im Spiel höchstens ${DDR_RESERVE_CAP}).`
        : 'In der DDR-Liga spielen keine zweiten Mannschaften der Oberligisten mehr.'
    : null;
  for (const n of [...(text ? [text] : []), ...r.notes]) {
    pushMessage(g.messages, makeMessage({ date: g.calendar.currentDate, category: 'general', from: 'Fußball-Chronik', subject: 'DDR: zweite Mannschaften', shortText: n, bodyText: n }));
  }
}

/** Neues Spiel (vor 1991): Reserven anlegen und in die DDR-Liga bzw. Nachwuchsoberliga einordnen. */
export function seedDdrReserves(g: Game): void {
  const year = seasonStartYear(g.season);
  const ober = g.leagues?.otherDivisions.find((d) => d.tier === OBER);
  const liga = g.leagues?.otherDivisions.find((d) => d.tier === LIGA);
  if (!ober || !liga || liga.nextMatchday > 1) return;
  const r = ddrReserveLiga(g, liga.clubIds, ober.clubIds, year, true);
  for (let i = 0; i < r.ids.length; i++) {
    const outId = liga.clubIds[i], inId = r.ids[i];
    if (outId === inId) continue;
    liga.clubIds[i] = inId;
    for (const m of liga.fixtures) { if (m.homeClubId === outId) m.homeClubId = inId; if (m.awayClubId === outId) m.awayClubId = inId; }
    for (const row of liga.table.rows) if (row.clubId === outId) row.clubId = inId;
  }
  syncDdrReserves(g, ober.clubIds, liga.clubIds, year);
}

/** Nachwuchsoberliga-Teilnehmer der Saison (1976–1984), sonst leer. */
export function nachwuchsOberligaIds(g: Game): string[] {
  if (ddrReserveMode(seasonStartYear(g.season)) !== 'nol') return [];
  return ddrReserves(g).filter((s) => s.tier === DDR_RES_TIER).map((s) => s.id).sort();
}
