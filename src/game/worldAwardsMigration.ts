// =============================================================================
// AUSZEICHNUNGEN DER AUSLANDSLIGEN — Umrechnung älterer Spielstände
// -----------------------------------------------------------------------------
// Früher: `seasonAwards.world` (AwardSeason-Objekte mit Namen, Vereinsnamen und
// Begründungssätzen) + `extraAwards.xiw` (Elf der Saison mit Namen statt IDs),
// zusammen ≈ 360 KB nach fünf Saisons. Jetzt: `seasonAwards.wv` (game/worldAwardsStore.ts).
// `migrateWorldAwards` rechnet beides um und löscht die alten Felder (idempotent; Aufruf in
// game/loadMigrations.ts nach migrateExtraAwards/migrateSeasonAwards, vor ensureWorldPool):
//   • Spieler, die nicht mehr im Weltpool stehen, behalten Name/Geburtsjahr/Position in `gone`.
//   • Begründung → Merkmale (Text wird aus Kennzahlen + Merkmalen neu gebaut, gleicher Wortlaut).
//   • Elf ohne IDs: Name → Weltspieler gleichen Namens (nur der Name wird angezeigt), sonst Name.
// =============================================================================
import { AWARD_CATS, WHY_BEST, WHY_CHAMP, WHY_DROP, WHY_KING } from '../engine/seasonAwards';
import { extraAwardsState } from './extraAwardsGame';
import { type AwardEntry, awardsState, ensureAwards } from './seasonAwardsGame';
import { seasonStartYear } from '../data/timeline';
import type { Game } from './state';
import { WORLD_AWARD_SEASONS } from './worldAwardsGame';
import { type WLeague, type WRef, type WorldAwardsStore, clubIdx, packWin, packXi, refOfId, trimWorldStore } from './worldAwardsStore';
import { WP_FIELD as W } from './worldPool';

const h100 = (v: number) => Math.round((Number(v) || 0) * 100);

/** Merkmale aus einem gespeicherten Begründungssatz (engine/seasonAwards.ts `reasonText`). */
export function flagsFromWhy(why = ''): number {
  let f = 0;
  if (/bester Notenschnitt aller|die wenigsten Gegentore/.test(why)) f |= WHY_BEST;
  if (/Torschützenkönig/.test(why)) f |= WHY_KING;
  if (/Meister\.$/.test(why)) f |= WHY_CHAMP;
  else if (/Abstiegskampf\.$/.test(why)) f |= WHY_DROP;
  return f;
}

const emptyLeague = (): WLeague => [-1, [[], [], [], []], 0, 0];

export function migrateWorldAwards(g: Game): void {
  const sa = awardsState(g);
  const ea = extraAwardsState(g);
  const old = Array.isArray(sa?.world) ? sa!.world! : null;
  const oldXi = Array.isArray(ea?.xiw) ? ea!.xiw! : null;
  if (!old && !oldXi) {
    if (sa?.wv) trimWorldStore(sa.wv, WORLD_AWARD_SEASONS);
    return;
  }
  const st: WorldAwardsStore = (ensureAwards(g).wv ??= { v: 1, cl: {}, gone: {}, s: {} });
  const cache = new Map<string, number>();
  const pool = new Map((g.worldPool?.p ?? []).map((w) => [w[W.id], w]));
  const byName = new Map<string, string>();
  for (const w of g.worldPool?.p ?? []) byName.set(`${w[W.first]} ${w[W.last]}`.trim(), w[W.id]);
  const ref = (e: AwardEntry, season: string): WRef => {
    const r = refOfId(e.p);
    if (typeof r !== 'number') return e.n;
    const w = pool.get(e.p);
    if (!w || `${w[W.first]} ${w[W.last]}`.trim() !== e.n) st.gone[r] ??= [e.n, seasonStartYear(season) + 1 - e.a, e.pos];
    return r;
  };
  const isNew = new Set<string>(); // Saisons, die erst hier entstehen (bestehende nicht überschreiben)
  for (const s of old ?? []) {
    if (!s || typeof s.season !== 'string' || !s.cats || typeof s.div !== 'string') continue;
    if (st.s[s.season] && !isNew.has(s.season)) continue;
    isNew.add(s.season);
    const L = ((st.s[s.season] ??= {})[s.div] ??= emptyLeague());
    const ci = (id: string) => clubIdx(st, s.div, id, cache);
    const win = (e: AwardEntry, k: number): WRef[] => packWin(k, {
      r: ref(e, s.season), c: ci(e.c), ap: e.ap, g: h100(e.g), gl: e.gl, as: e.as, cs: e.cs, f: flagsFromWhy(e.why), ga: h100(e.ga),
    });
    L[0] = s.best ? AWARD_CATS.indexOf(s.best) : -1;
    L[1] = AWARD_CATS.map((cat, k) => (s.cats[cat] ?? []).flatMap((e, i) => (i === 0 ? win(e, k) : [ref(e, s.season), ci(e.c), h100(e.g)])));
    const rk = s.rookie ? AWARD_CATS.indexOf(s.rookie.cat) : -1;
    L[2] = s.rookie && rk >= 0 ? [rk, ...win(s.rookie, rk)] : 0;
  }
  for (const x of oldXi ?? []) {
    if (!x || typeof x.s !== 'string' || !Array.isArray(x.x) || !Array.isArray(x.c)) continue;
    if (st.s[x.s] && !isNew.has(x.s)) continue;
    isNew.add(x.s);
    const L = ((st.s[x.s] ??= {})[x.d] ??= emptyLeague());
    const ci = (id: string) => clubIdx(st, x.d, id, cache);
    // Spieler-ID über die Besten derselben Liga (Name + Verein), sonst Weltspieler gleichen Namens.
    const known = new Map<string, WRef>();
    for (const s of old ?? []) if (s?.season === x.s && s.div === x.d) for (const e of [...AWARD_CATS.flatMap((c) => s.cats?.[c] ?? []), ...(s.rookie ? [s.rookie] : [])]) known.set(`${e.n}|${e.c}`, refOfId(e.p));
    L[3] = x.x.length === 11 ? packXi(L, x.x.map((r): [WRef, number, number] => {
      const club = x.c[r[2]] ?? '';
      const id = byName.get(r[0]);
      return [known.get(`${r[0]}|${club}`) ?? (id ? refOfId(id) : r[0]), ci(club), Number(r[1]) || 0];
    })) : 0;
  }
  if (sa) delete sa.world;
  if (ea) delete ea.xiw;
  trimWorldStore(st, WORLD_AWARD_SEASONS);
}
