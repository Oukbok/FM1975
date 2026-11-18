// =============================================================================
// AMATEUR-OBERLIGEN UNTER DEN SIMULIERTEN LIGEN (Wunsch Pascal: die zweiten
// Mannschaften der KI-Vereine sollen auch vor 1994 sichtbar und sinnvoll laufen)
// -----------------------------------------------------------------------------
// Unterhalb der untersten simulierten Ebene lebt der Vereins-Pool (game/clubPool.ts,
// tier 9). Dort spielen jetzt die höchsten Amateurligen je Verbandsgruppe als echte
// Tabellen – bis 1978 „Amateurliga“, 1978–1994 „Amateur-Oberliga“, danach „Oberliga“
// (data/reserveRules.ts `localLeagueName`):
//   Nord · Berlin · Nordrhein · Westfalen · Südwest · Hessen · Baden-Württemberg · Bayern
//   (ab 1991 Nordost statt Berlin) – Zuordnung über den Landesverband der Stadt
//   (data/youthCompetitions.ts CITY_LV), sonst fest aus Region + ID.
// • Je Staffel 18 Mannschaften: zweite Mannschaften der Gruppe (höchstens 8), die
//   stärksten Pool-Vereine, Rest erzeugte Ortsvereine (`x_yl.*`, nur Name/Farbe).
// • Ergebnisse sonntags (nicht im Juni/Juli) mit dem schlanken Modell `worldMatchGoals`
//   (wie die Auslandsligen) – keine Spielpläne gespeichert, nur die Tabelle.
// • Deine zweite Mannschaft spielt in ihrer Gruppe in der eigenen Tabelle
//   (game/reserveTeam.ts, gleiche Zusammensetzung `amateurTableIds`); diese Gruppe
//   wird hier nicht doppelt geführt.
// • Saisonende `closeAmateurLeagues` (season.ts, vor Auf-/Abstieg): Endstand je Gruppe;
//   Meister bekommen beim Pool-Tausch den Vorrang (`amateurPoolBonus` in clubPool.ts) –
//   zweite Mannschaften sind für die 2. Bundesliga gesperrt (bis 1994 immer), dann rückt
//   der Nächste nach; Chronik-Nachricht mit den Meistern. KI-Amateure im DFB-Pokal nach
//   dem Endplatz (game/reservePyramid.ts `cupQualifiers`).
// Spielstand: optionales `game.amateurLeagues` (Saison, Tabellen, Endstand der Vorsaison).
// =============================================================================
import type { Game } from './state';
import { homeCountryOf } from './state';
import { POOL_TIER } from '../data/history/historicClubs';
import { CITY_LV, type Lv, type YcRegion } from '../data/youthCompetitions';
import { localLeagueName } from '../data/reserveRules';
import { seasonStartYear } from '../data/timeline';
import { hashStr, mulberry32, simDisplayName } from '../engine/leagues';
import { worldMatchGoals } from '../engine/world';
import { makeMessage, pushMessage } from '../engine/messages';
import { localClubId } from './youthComps/localClubs';
import { clubTierNow, isReserveId, ownReserveId, parentOfReserve, reserveTierOk } from './reserveIds';

export interface AmGroup { key: string; label: string; lv: Lv[]; region: YcRegion; from?: number; to?: number }
export const AM_GROUPS: AmGroup[] = [
  { key: 'nord', label: 'Nord', lv: ['SH', 'HH', 'HB', 'NI'], region: 'nord' },
  { key: 'berlin', label: 'Berlin', lv: ['BE'], region: 'nordost', to: 1991 },
  { key: 'nordost', label: 'Nordost', lv: ['BE', 'MV', 'BB', 'ST', 'TH', 'SN'], region: 'nordost', from: 1991 },
  { key: 'nordrhein', label: 'Nordrhein', lv: ['NR', 'MR'], region: 'west' },
  { key: 'westfalen', label: 'Westfalen', lv: ['WF'], region: 'west' },
  { key: 'suedwest', label: 'Südwest', lv: ['RL', 'SW', 'SL'], region: 'suedwest' },
  { key: 'hessen', label: 'Hessen', lv: ['HE'], region: 'sued' },
  { key: 'bawue', label: 'Baden-Württemberg', lv: ['BA', 'SB', 'WU'], region: 'sued' },
  { key: 'bayern', label: 'Bayern', lv: ['BY'], region: 'sued' },
];
const SIZE = 18;
const MAX_RES = 8;

export interface AmRow { id: string; str: number; p: number; w: number; d: number; l: number; gf: number; ga: number }
export interface AmLeague { key: string; name: string; tier: number; rows: AmRow[]; md: number }
export interface AmateurLeagues {
  season: string;
  leagues: AmLeague[];
  /** Endstand der abgelaufenen Saison je Gruppe (Pool-Tausch, Pokal, Anzeige). */
  final?: { season: string; order: Record<string, string[]>; names: Record<string, string> };
}
type G = Game & { amateurLeagues?: AmateurLeagues; reserve?: { season: string; depth?: number; table: { id: string }[]; group?: string } };

const groupsFor = (year: number) => AM_GROUPS.filter((x) => (x.from == null || year >= x.from) && (x.to == null || year < x.to));

/** Verbandsgruppe eines Vereins (Stadt → Landesverband, sonst Liga-Gruppe + ID). */
export function amGroupOf(g: Game, id: string, year = seasonStartYear(g.season)): string {
  const s = g.simClubs[id] ?? g.simClubs[parentOfReserve(id)];
  const city = g.clubs[id]?.city ?? s?.city ?? g.clubs[parentOfReserve(id)]?.city ?? '';
  const gs = groupsFor(year);
  const lv = CITY_LV[city];
  if (lv) return (gs.find((x) => x.lv.includes(lv)) ?? gs[0]).key;
  const grp = s?.group ?? 'west';
  const cands = gs.filter((x) => (grp === 'sued' ? x.region === 'sued' : grp === 'nord' ? x.key === 'nord' : grp === 'nordost' ? x.region === 'nordost' : x.region === 'west' || x.region === 'suedwest'));
  const list = cands.length ? cands : gs;
  return list[hashStr(`amg:${city || id}`) % list.length].key;
}

const isGer = (g: Game) => homeCountryOf(g) === 'ger';
const westDivs = (g: Game) => (g.leagues?.otherDivisions ?? []).filter((d) => d.tier < 100);
/** Unterste simulierte West-Ebene (mit Spielerliga). */
export function lowestSimTier(g: Game): number {
  return Math.max(g.leagues?.playerDivision.tier ?? 1, ...westDivs(g).map((d) => d.tier));
}
/** Pool-Vereine (West bzw. ab 1991 gesamt) außer deiner zweiten Mannschaft. */
function poolClubs(g: Game) {
  const own = ownReserveId(g);
  return Object.values(g.simClubs).filter((s) => s.tier === POOL_TIER && s.id !== own);
}
function poolBase(g: Game): number {
  const p = poolClubs(g).filter((s) => !isReserveId(s.id));
  return p.length ? p.reduce((a, s) => a + s.strength, 0) / p.length : 48;
}

/** Regionen-Kennung der Liga-Gruppen (Spiel) zu einer Verbandsgruppe. */
const divRegion = (r: YcRegion) => (r === 'suedwest' ? 'west' : r);
/**
 * Ebene der höchsten Amateurliga einer Gruppe: eine unter der tiefsten simulierten Ebene, die diese Gruppe
 * abdeckt (eingleisig, eigene Regionalstaffel oder ab drei Staffeln alle). 1991–94 liegt die NOFV-Oberliga
 * nur über dem Nordosten.
 */
export function amTier(g: Game, key: string): number {
  const grp = AM_GROUPS.find((x) => x.key === key) ?? AM_GROUPS[0];
  const divs = [{ tier: g.leagues?.playerDivision.tier ?? 1, group: g.leagues?.playerDivision.group ?? null }, ...westDivs(g)];
  let t = 1;
  for (const d of divs) {
    const n = divs.filter((x) => x.tier === d.tier).length;
    if (d.group == null || d.group === divRegion(grp.region) || n >= 3 || (d.tier <= 2)) t = Math.max(t, d.tier);
  }
  return t + 1;
}

/** Liganame einer Gruppe in der Saison (tiefer als die übrigen Gruppen: Verbandsliga). */
export function amLeagueName(g: Game, key: string, year = seasonStartYear(g.season)): string {
  const grp = AM_GROUPS.find((x) => x.key === key)!;
  const min = Math.min(...groupsFor(year).map((x) => amTier(g, x.key)));
  return `${localLeagueName(year, Math.min(2, amTier(g, key) - min))} ${grp.label}`;
}

/**
 * Teilnehmer der höchsten Amateurliga einer Gruppe: zweite Mannschaften (höchstens acht, stärkste zuerst),
 * stärkste Pool-Vereine, aufgefüllt mit Ortsvereinen. `withOwn` = Platz für deine zweite Mannschaft.
 */
export function amateurTableIds(g: Game, key: string, withOwn: boolean): { id: string; str: number }[] {
  const year = seasonStartYear(g.season);
  const grp = AM_GROUPS.find((x) => x.key === key) ?? AM_GROUPS[0];
  const pool = poolClubs(g).filter((s) => amGroupOf(g, s.id, year) === key);
  const n = SIZE - (withOwn ? 1 : 0);
  const res = pool.filter((s) => isReserveId(s.id)).sort((a, b) => b.strength - a.strength).slice(0, MAX_RES - (withOwn ? 1 : 0));
  const ama = pool.filter((s) => !isReserveId(s.id)).sort((a, b) => b.strength - a.strength).slice(0, n - res.length);
  const out = [...res, ...ama].map((s) => ({ id: s.id, str: s.strength }));
  const base = poolBase(g);
  const r = mulberry32(hashStr(`amfill:${key}:${g.season}`));
  for (let i = 1; out.length < n; i++) out.push({ id: localClubId(grp.region, false, 40 + i + AM_GROUPS.indexOf(grp) * 30), str: Math.round((base - 3 + r() * 6) * 10) / 10 });
  return out;
}

/** Spielt deine zweite Mannschaft gerade in der höchsten Amateurliga (eigene Tabelle) – und in welcher Gruppe? */
function ownGroup(g: Game): string | null {
  const st = (g as G).reserve;
  if (!st || st.season !== g.season || (st.depth ?? 0) > 0 || !st.table?.length) return null;
  return amGroupOf(g, g.managedClubId);
}

/** Tabellen der laufenden Saison (legt sie zur neuen Saison an). null = nichts zu simulieren. */
export function amateurLeagues(g: Game): AmateurLeagues | null {
  if (!isGer(g) || !g.leagues) return null;
  const gg = g as G;
  const cur = gg.amateurLeagues;
  if (cur && cur.season === g.season) return cur;
  const year = seasonStartYear(g.season);
  const own = ownGroup(g);
  const leagues: AmLeague[] = [];
  for (const grp of groupsFor(year)) {
    if (grp.key === own) continue;
    const pool = poolClubs(g).filter((s) => amGroupOf(g, s.id, year) === grp.key);
    if (!pool.some((s) => isReserveId(s.id)) && pool.length < 4) continue;
    const rows = amateurTableIds(g, grp.key, false).map(({ id, str }) => ({ id, str, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }));
    leagues.push({ key: grp.key, name: amLeagueName(g, grp.key, year), tier: amTier(g, grp.key), rows, md: 0 });
  }
  gg.amateurLeagues = { season: g.season, leagues, final: cur?.final };
  return gg.amateurLeagues;
}

/** Deine zweite Mannschaft spielt jetzt selbst in der Amateurliga ihrer Gruppe: KI-Tabelle dort entfernen. */
export function dropOwnAmateurGroup(g: Game): void {
  const al = (g as G).amateurLeagues;
  const own = ownGroup(g);
  if (al && al.season === g.season && own) al.leagues = al.leagues.filter((l) => l.key !== own);
}

const strOf = (g: Game, r: AmRow) => g.simClubs[r.id]?.strength ?? r.str;

function playRound(g: Game, l: AmLeague, seed: string): void {
  const n = l.rows.length;
  if (n < 2 || l.md >= (n - 1) * 2) return;
  const r = mulberry32(hashStr(`am:${l.key}:${seed}`));
  const round = l.md % (n - 1), second = l.md >= n - 1;
  const ids = l.rows.map((x) => x.id);
  const rot = [ids[0], ...ids.slice(1).slice(round), ...ids.slice(1).slice(0, round)];
  for (let i = 0; i < n / 2; i++) {
    let a = rot[i], b = rot[n - 1 - i];
    if ((i + l.md + (second ? 1 : 0)) % 2) [a, b] = [b, a];
    const A = l.rows.find((x) => x.id === a)!, B = l.rows.find((x) => x.id === b)!;
    const [hg, ag] = worldMatchGoals(strOf(g, A), strOf(g, B), r);
    const book = (row: AmRow, gf: number, ga: number) => { row.p++; row.gf += gf; row.ga += ga; if (gf > ga) row.w++; else if (gf < ga) row.l++; else row.d++; };
    book(A, hg, ag); book(B, ag, hg);
  }
  l.md++;
}

/** Sonntags (aus day.ts), nicht im Juni/Juli. */
export function amateurLeaguesDaily(g: Game, today: string): void {
  if (new Date(`${today}T00:00:00Z`).getUTCDay() !== 0) return;
  const mo = today.slice(5, 7);
  if (mo === '06' || mo === '07') return;
  const al = amateurLeagues(g);
  if (!al) return;
  for (const l of al.leagues) playRound(g, l, today);
}

export function sortedAm(rows: AmRow[], win: number): AmRow[] {
  return [...rows].sort((a, b) => (b.w * win + b.d) - (a.w * win + a.d) || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.id.localeCompare(b.id));
}

/** Anzeigename eines Teilnehmers. */
export function amName(g: Game, id: string): string {
  const s = g.simClubs[id];
  return s ? simDisplayName(s, seasonStartYear(g.season)) : id;
}

/**
 * Saisonende (season.ts, vor dem Auf-/Abstieg): offene Spieltage nachholen, Endstand je Gruppe sichern
 * (inkl. der Tabelle deiner zweiten Mannschaft), Chronik-Nachricht mit den Meistern.
 */
export function closeAmateurLeagues(g: Game, ownTable?: { key: string; order: string[] } | null): void {
  const gg = g as G;
  const al = gg.amateurLeagues;
  if (!al || al.season !== g.season) return;
  const win = g.pointSystem === '3-point' ? 3 : 2;
  const order: Record<string, string[]> = {};
  const names: Record<string, string> = {};
  for (const l of al.leagues) {
    for (let k = 0; l.md < (l.rows.length - 1) * 2 && k < 60; k++) playRound(g, l, `rest${k}`);
    order[l.key] = sortedAm(l.rows, win).map((r) => r.id);
    names[l.key] = l.name;
  }
  if (ownTable) { order[ownTable.key] = ownTable.order; names[ownTable.key] = amLeagueName(g, ownTable.key); }
  al.final = { season: g.season, order, names };
  // Chronik: Meister je Staffel, gesperrte zweite Mannschaften.
  const lines: string[] = [];
  for (const k of Object.keys(order)) {
    const ids = order[k];
    const champ = ids[0];
    if (!champ || champ.startsWith('x_yl.')) continue;
    let line = `${names[k]}: ${champ === ownReserveId(g) ? 'deine zweite Mannschaft' : amName(g, champ)}`;
    if (isReserveId(champ) && !reserveTierOk(amTier(g, k) - 1, clubTierNow(g, parentOfReserve(champ)))) {
      const next = ids.find((id) => !isReserveId(id) && !id.startsWith('x_yl.'));
      line += ` – als zweite Mannschaft ohne Aufstiegsrecht${next ? `, an der Aufstiegsrunde nimmt ${amName(g, next)} teil` : ''}`;
    }
    lines.push(line);
  }
  if (lines.length) {
    pushMessage(g.messages, makeMessage({
      date: g.calendar.currentDate, category: 'general', from: 'Fußball-Chronik',
      subject: `Amateurligen ${g.season}: die Meister`, shortText: `${lines.length} Staffeln entschieden.`,
      bodyText: `Die höchsten Amateurligen ${g.season} sind entschieden:\n\n${lines.map((l) => `• ${l}`).join('\n')}\n\nDie Meister haben beim Aufstieg in die ${lowestSimTier(g) <= 2 ? '2. Bundesliga' : 'nächsthöhere Liga'} den Vorrang.`,
    }));
  }
}

/** Vorrang beim Pool-Tausch aus dem Endstand der Amateurliga (Meister +40, dann −12 je Platz). */
export function amateurPoolBonus(g: Game): (id: string) => number {
  const f = (g as G).amateurLeagues?.final;
  if (!f || f.season !== g.season) return () => 0;
  const pos = new Map<string, number>();
  for (const ids of Object.values(f.order)) ids.filter((id) => !id.startsWith('x_yl.')).forEach((id, i) => pos.set(id, i));
  return (id) => { const p = pos.get(id); return p == null ? 0 : Math.max(0, 40 - p * 12); };
}

/** Endplatz in der Amateurliga (Vorsaison) bzw. null. */
export function amateurFinalPos(g: Game, id: string): number | null {
  const f = (g as G).amateurLeagues?.final;
  if (!f) return null;
  for (const ids of Object.values(f.order)) { const i = ids.indexOf(id); if (i >= 0) return i + 1; }
  return null;
}

/** Alle Amateurliga-Tabellen der laufenden Saison für die Anzeige (inkl. der Liga deiner zweiten Mannschaft). */
export interface AmTableView { key: string; name: string; tier: number; md: number; total: number; rows: AmRow[]; own: boolean }
export function amateurTablesView(g: Game): AmTableView[] {
  const al = (g as G).amateurLeagues;
  const out: AmTableView[] = (al && al.season === g.season ? al.leagues : []).map((l) => ({ key: l.key, name: l.name, tier: l.tier, md: l.md, total: (l.rows.length - 1) * 2, rows: l.rows, own: false }));
  const st = (g as G).reserve as (G['reserve'] & { md?: number; table: (AmRow & { name: string })[] }) | undefined;
  const key = ownGroup(g);
  if (st && key && isGer(g)) {
    const own = ownReserveId(g);
    out.push({ key, name: amLeagueName(g, key), tier: amTier(g, key), md: st.md ?? 0, total: (st.table.length - 1) * 2, own: true,
      rows: (st.table as unknown as AmRow[]).map((r) => ({ ...r, id: r.id === 'own' ? own : r.id })) });
  }
  const order = AM_GROUPS.map((x) => x.key);
  return out.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}
