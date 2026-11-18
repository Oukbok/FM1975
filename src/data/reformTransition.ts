// =============================================================================
// 1975 – A Football Manager — SAISONWECHSEL DER LIGAPYRAMIDE (Auf-/Abstieg, Reformen)
// =============================================================================
// Rechnet aus den Endständen aller Divisionen die Besetzung der neuen Saison:
// generischer Auf-/Abstieg (normalTransition) oder – zur Saison einer noch nicht
// angewandten Reform aus data/reforms.ts – die passende Struktur-Migration.
// Staffeln werden nie über feste IDs gesucht, sondern über Ebene + Kennung `group`;
// Vereine kommen nach ihrer Region in eine Staffel (data/regionGeo.ts).
// Weicht die Pyramide eines alten Spielstands von der Soll-Struktur ab (z. B. die
// frühere Regionalliga Nord/Nordost/Süd ab 2008), ordnet alignStructure die Ebene
// beim nächsten Saisonwechsel neu – laufende Saisons spielen unverändert zu Ende.
// =============================================================================

import { LeagueGroup, SimClub, DivisionMeta, mulberry32, hashStr } from '../engine/leagues';
import { DivisionTarget, LeagueReform, makePlaceholder, pendingReform, structureForSeason } from './reforms';
import { Region, assignByRegion, clubRegion, groupOrder } from './regionGeo';

// -----------------------------------------------------------------------------
// Transition-Typen
// -----------------------------------------------------------------------------

/** Endstand einer Division vor dem Saisonwechsel. */
export interface CurrentDivision {
  id: string;
  tier: number;
  group: LeagueGroup;
  name: string;
  /** Abschlusstabelle: geordnete Verein-IDs (Meister zuerst). */
  orderedIds: string[];
}

export interface TransitionContext {
  newSeason: string;
  current: CurrentDivision[];
  strengthOf: (id: string) => number;
  cityOf: (id: string) => string;
  appliedReforms: string[];
  /** Verein des Spielers – darf NIE aus der Simulation fallen (Schutz bei Reformen). */
  protectedId?: string;
  /** Sollgrößen statt der deutschen Struktur (anderes Heimatland, Weltdaten). */
  targets?: DivisionTarget[];
}

export interface TransitionResult {
  /** Neue Mitgliedschaften je Division (mit Meta der Zielstruktur). */
  divisions: { meta: DivisionMeta; ids: string[] }[];
  /** Neu erzeugte fiktive Platzhalter (in game.simClubs aufzunehmen). */
  placeholders: SimClub[];
  /** Aus der Pyramide entfernte Vereine (aus game.simClubs zu löschen). */
  dropped: string[];
  /** Die angewandte Reform (falls diese Saison eine Reform trägt), sonst null. */
  reform: LeagueReform | null;
  /** Aufsteiger in die 1. Liga (für Nachrichten). */
  promotedTop: string[];
  /** Absteiger aus der 1. Liga (für Nachrichten). */
  relegatedTop: string[];
}

// -----------------------------------------------------------------------------
// Verteil-Helfer: Vereine nach Region auf Staffeln aufteilen + auffüllen
// -----------------------------------------------------------------------------
/** Region je Verein: Stadt, sonst die Staffel, in der er zuletzt spielte. */
function regionResolver(ctx: TransitionContext): (id: string) => Region {
  const hint = new Map<string, LeagueGroup>();
  for (const d of ctx.current) for (const id of d.orderedIds) hint.set(id, d.group);
  const cache = new Map<string, Region>();
  return (id) => {
    let r = cache.get(id);
    if (!r) {
      // Neue Platzhalter (noch nicht im Spielstand) tragen ihre Staffel in der ID: ph-t<Ebene>-<Staffel>-…
      const ph = /^ph-t\d+-([a-z]+)-/.exec(id)?.[1];
      r = clubRegion(ctx.cityOf(id), hint.get(id) ?? (ph && ph !== 'x' ? ph as LeagueGroup : null));
      cache.set(id, r);
    }
    return r;
  };
}

// Verteilt `ids` nach Region auf die Ziel-Staffeln `targets` (gleiche Ebene) und füllt
// fehlende Plätze mit fiktiven Platzhaltern auf (die game/clubPool.ts mit Amateurvereinen
// der Region besetzt). Jeder kommt nur in die Staffel seiner Region; ist sie voll, steigen
// die Schwächsten in die Amateurligen ab (`overflow`) – wie 2008, als viele Vereine aus
// dem Nordosten in die Oberliga mussten. Der eigene Verein wird immer zuerst eingeteilt.
function distributeToGroups(
  ids: string[],
  targets: DivisionTarget[],
  regionOf: (id: string) => Region,
  strengthOf: (id: string) => number,
  seedKey: string,
  protectedId?: string,
): { result: { meta: DivisionMeta; ids: string[] }[]; placeholders: SimClub[]; overflow: string[] } {
  const sortedTargets = [...targets].sort((a, b) => groupOrder(a.group) - groupOrder(b.group));
  const order = [...ids].sort((a, b) => (b === protectedId ? 1 : 0) - (a === protectedId ? 1 : 0) || strengthOf(b) - strengthOf(a));
  const { buckets, overflow } = assignByRegion(order, sortedTargets.map((t) => ({ group: t.group, cap: t.teamCount })), regionOf, true);
  const result: { meta: DivisionMeta; ids: string[] }[] = [];
  const placeholders: SimClub[] = [];
  sortedTargets.forEach((t, k) => {
    const bucket = buckets[k];
    while (bucket.length < t.teamCount) {
      const ph = makePlaceholder(seedKey, t.tier, t.group);
      placeholders.push(ph);
      bucket.push(ph.id);
    }
    result.push({ meta: metaOf(t), ids: bucket });
  });
  return { result, placeholders, overflow };
}

function metaOf(t: DivisionTarget): DivisionMeta {
  return { id: t.id, name: t.name, tier: t.tier, group: t.group };
}

// -----------------------------------------------------------------------------
// NORMALER Saisonwechsel (keine Reform): generischer Auf-/Abstieg
// -----------------------------------------------------------------------------
// Arbeitet strukturunabhängig auf der aktuellen Pyramide: für jede Ebenen-Grenze
// steigen die Staffelmeister (+ ggf. weitere Plätze bzw. Sieger der Aufstiegsrunde)
// auf, die Schlechtesten der oberen Ebene ab. Absteiger in mehrere Staffeln:
// bis Ebene 2 so, dass jede Staffel so viele bekommt, wie sie abgegeben hat; ab
// Ebene 3 (unterste Ebene, Deutschland) nach Region – eine Staffel mit mehr
// Absteigern gibt dafür zusätzlich Schwächste an die Amateurligen ab, eine mit
// weniger füllt über Platzhalter (→ Pool der Region, game/clubPool.ts) auf.

/** Aufstiegsrunde: Meister (+ Vizemeister markierter Staffeln) losen Duelle, Sieger nach Stärke + Glück. */
function promotionPlayoff(
  lowers: CurrentDivision[], slots: number, targets: DivisionTarget[], ctx: TransitionContext,
): { id: string; gid: string }[] {
  const cands: { id: string; gid: string }[] = [];
  for (const lg of lowers) if (lg.orderedIds[0]) cands.push({ id: lg.orderedIds[0], gid: lg.id });
  for (const lg of lowers) {
    const t = targets.find((x) => x.id === lg.id) ?? targets.find((x) => x.tier === lg.tier && x.group === lg.group);
    if (t?.playoffRunnerUp && lg.orderedIds[1]) cands.push({ id: lg.orderedIds[1], gid: lg.id });
  }
  const byStrength = [...cands].sort((a, b) => ctx.strengthOf(b.id) - ctx.strengthOf(a.id));
  if (cands.length < slots * 2) return byStrength.slice(0, slots);
  const rnd = mulberry32(hashStr(`playoff:${ctx.newSeason}`));
  const field = byStrength.slice(0, slots * 2);
  for (let i = field.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [field[i], field[j]] = [field[j], field[i]]; }
  const out: { id: string; gid: string }[] = [];
  for (let k = 0; k < slots; k++) {
    const a = field[2 * k], b = field[2 * k + 1];
    const pA = 1 / (1 + Math.exp(-(ctx.strengthOf(a.id) - ctx.strengthOf(b.id)) / 5));
    out.push(rnd() < pA ? a : b);
  }
  return out;
}

function normalTransition(ctx: TransitionContext): TransitionResult {
  const { current, strengthOf, cityOf } = ctx;
  const tiers = Array.from(new Set(current.map((d) => d.tier))).sort((a, b) => a - b);
  const targets = ctx.targets ?? structureForSeason(ctx.newSeason);
  const regional = !ctx.targets; // Region nur im deutschen Ligasystem
  const regionOf = regionResolver(ctx);

  // Arbeitskopien + Sammelstellen für Zu-/Abgänge (aus ORIGINAL-Reihenfolge berechnet).
  const remove: Record<string, Set<string>> = {};
  const add: Record<string, string[]> = {};
  for (const d of current) { remove[d.id] = new Set(); add[d.id] = []; }
  const placeholders: SimClub[] = [];
  const dropped: string[] = [];

  let promotedTop: string[] = [];
  let relegatedTop: string[] = [];

  for (let i = 0; i < tiers.length - 1; i++) {
    const upperTier = tiers[i];
    const lowerTier = tiers[i + 1];
    const uppers = current.filter((d) => d.tier === upperTier);
    const lowers = current.filter((d) => d.tier === lowerTier);
    if (uppers.length === 0 || lowers.length === 0) continue;
    const upper = uppers[0]; // obere Ebene ist in allen Strukturen eingleisig
    const G = lowers.length;
    const upT = targets.find((t) => t.id === upper.id) ?? targets.find((t) => t.tier === upperTier && t.group == null);
    const P = upT?.upSlots ?? (G >= 3 ? G : 3); // Zahl der Auf-/Absteiger an dieser Grenze

    // Aufsteiger je Staffel bestimmen (Meister, Rest über Reihung; weniger Plätze als Staffeln = Aufstiegsrunde).
    const promotedByGroup: Record<string, string[]> = {};
    for (const lg of lowers) promotedByGroup[lg.id] = [];
    if (P < G) {
      for (const w of promotionPlayoff(lowers, P, targets, ctx)) promotedByGroup[w.gid].push(w.id);
    } else {
      for (const lg of lowers) if (lg.orderedIds[0]) promotedByGroup[lg.id].push(lg.orderedIds[0]);
      const extra = P - G;
      if (extra > 0) {
        if (G === 1) {
          const lg = lowers[0];
          for (let k = 1; k <= extra && lg.orderedIds[k]; k++) promotedByGroup[lg.id].push(lg.orderedIds[k]);
        } else {
          const runners = lowers
            .map((lg) => ({ id: lg.orderedIds[1], gid: lg.id }))
            .filter((r) => !!r.id)
            .sort((a, b) => strengthOf(b.id) - strengthOf(a.id));
          for (let k = 0; k < extra && k < runners.length; k++) promotedByGroup[runners[k].gid].push(runners[k].id);
        }
      }
    }
    const promoted: string[] = [];
    for (const lg of lowers) promoted.push(...promotedByGroup[lg.id]);

    // Absteiger der oberen Ebene = die schlechtesten `promoted.length` Vereine.
    const relegated = promoted.length ? upper.orderedIds.slice(-promoted.length) : [];

    // Zu-/Abgänge oben vermerken.
    for (const id of relegated) remove[upper.id].add(id);
    for (const id of promoted) add[upper.id].push(id);

    // Aufsteiger aus den Staffeln entfernen.
    for (const lg of lowers) for (const id of promotedByGroup[lg.id]) remove[lg.id].add(id);

    const lowest = lowerTier === tiers[tiers.length - 1];
    if (regional && G > 1 && lowerTier >= 3 && lowest) {
      // Nach Region: jeder Absteiger in seine Staffel, Größen über Amateurligen ausgleichen.
      const groups = lowers.map((lg) => ({ group: lg.group, cap: Number.POSITIVE_INFINITY }));
      const { buckets } = assignByRegion(relegated, groups, regionOf);
      lowers.forEach((lg, k) => {
        add[lg.id].push(...buckets[k]);
        const size = lg.orderedIds.length - remove[lg.id].size + add[lg.id].length;
        let over = size - lg.orderedIds.length;
        for (const id of [...lg.orderedIds].reverse()) {
          if (over <= 0) break;
          if (remove[lg.id].has(id) || id === ctx.protectedId) continue;
          remove[lg.id].add(id); dropped.push(id); over--;
        }
        for (let n = size; n < lg.orderedIds.length; n++) {
          const ph = makePlaceholder(`fill:${ctx.newSeason}`, lg.tier, lg.group);
          placeholders.push(ph); add[lg.id].push(ph.id);
        }
      });
    } else {
      // Jede Staffel erhält so viele, wie sie abgegeben hat (Größe bleibt konstant), möglichst nach Region.
      const slots: string[] = [];
      for (const lg of lowers) for (let k = 0; k < promotedByGroup[lg.id].length; k++) slots.push(lg.id);
      if (G === 1) {
        for (let k = 0; k < slots.length && k < relegated.length; k++) add[slots[k]].push(relegated[k]);
      } else {
        const caps = lowers.map((lg) => ({ group: lg.group, cap: promotedByGroup[lg.id].length }));
        const { buckets, overflow } = assignByRegion(relegated, caps, regional ? regionOf : (id) => clubRegion(cityOf(id), null));
        lowers.forEach((lg, k) => add[lg.id].push(...buckets[k]));
        if (overflow.length) dropped.push(...overflow); // kann nicht vorkommen (Summe der Plätze = Absteiger)
      }
    }

    if (i === 0) { promotedTop = promoted.slice(); relegatedTop = relegated.slice(); }
  }

  const divisions = current.map((d) => ({
    meta: { id: d.id, name: d.name, tier: d.tier, group: d.group } as DivisionMeta,
    ids: d.orderedIds.filter((id) => !remove[d.id].has(id)).concat(add[d.id]),
  }));

  return { divisions, placeholders, dropped, reform: null, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// Staffeln einer Ebene an die Soll-Struktur angleichen (alte Spielstände)
// -----------------------------------------------------------------------------
// Stimmen die Staffeln einer Ebene nicht mit der Soll-Struktur überein (andere
// Kennungen/IDs, z. B. Regionalliga Nord/Nordost/Süd aus älteren Versionen statt
// Nord/West/Süd), werden alle Vereine der Ebene nach Region neu verteilt. Nur im
// deutschen Ligasystem und nur, wenn die Ebene die Soll-Struktur hat (Zahl der
// Ebenen gleich). Überzählige (Schwächste) wechseln in die Amateurligen.
function alignStructure(res: TransitionResult, ctx: TransitionContext, targets: DivisionTarget[]): TransitionResult {
  if (ctx.targets) return res;
  const regionOf = regionResolver(ctx);
  const tiers = [...new Set(targets.map((t) => t.tier))];
  let divisions = res.divisions;
  const placeholders = [...res.placeholders];
  const dropped = [...res.dropped];
  for (const tier of tiers) {
    const want = targets.filter((t) => t.tier === tier);
    const have = divisions.filter((d) => d.meta.tier === tier);
    if (!have.length) continue;
    const same = want.length === have.length && want.every((t) => have.some((d) => d.meta.id === t.id && d.meta.group === t.group));
    if (same) continue;
    const ids = have.flatMap((d) => d.ids);
    const { result, placeholders: ph, overflow } = distributeToGroups(ids, want, regionOf, ctx.strengthOf, `align:${ctx.newSeason}`, ctx.protectedId);
    placeholders.push(...ph);
    const lower = divisions.filter((d) => d.meta.tier === tier + 1);
    if (lower.length) lower[0].ids.push(...overflow); else dropped.push(...overflow);
    divisions = [...divisions.filter((d) => d.meta.tier !== tier), ...result];
  }
  divisions.sort((a, b) => a.meta.tier - b.meta.tier || groupOrder(a.meta.group) - groupOrder(b.meta.group));
  return { ...res, divisions, placeholders, dropped };
}

// -----------------------------------------------------------------------------
// Hilfen für Reform-Migrationen
// -----------------------------------------------------------------------------
function findDiv(current: CurrentDivision[], pred: (d: CurrentDivision) => boolean): CurrentDivision | undefined {
  return current.find(pred);
}

// Normaler Auf-/Abstieg 1.↔2. Liga innerhalb einer Reform-Migration (eingleisige
// obere Struktur): 3 Absteiger, 3 Aufsteiger aus der Spitze der 2. Liga.
function topExchangeSingle(
  t1: string[], t2: string[],
): { newTier1: string[]; newTier2Base: string[]; promotedTop: string[]; relegatedTop: string[] } {
  const relegatedTop = t1.slice(-3);
  const promotedTop = t2.slice(0, 3);
  const newTier1 = t1.filter((id) => !relegatedTop.includes(id)).concat(promotedTop);
  const newTier2Base = t2.filter((id) => !promotedTop.includes(id)); // Absteiger werden später ergänzt
  return { newTier1, newTier2Base, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// 1981/82 — Zusammenführung Nord/Süd → eingleisige 2. Liga
// -----------------------------------------------------------------------------
function migrate1981(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current, strengthOf } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const nord = findDiv(current, (d) => d.tier === 2 && d.group === 'nord')?.orderedIds ?? [];
  const sued = findDiv(current, (d) => d.tier === 2 && d.group === 'sued')?.orderedIds ?? [];

  // 1. Liga: normaler Auf-/Abstieg (3 runter, 3 rauf: beide Meister + bester Zweiter).
  const relegatedTop = t1.slice(-3);
  const nordChamp = nord[0]; const suedChamp = sued[0];
  const runnerUp = (nord[1] && sued[1])
    ? (strengthOf(nord[1]) >= strengthOf(sued[1]) ? nord[1] : sued[1])
    : (nord[1] || sued[1]);
  const promotedTop = [nordChamp, suedChamp, runnerUp].filter(Boolean) as string[];
  const newTier1 = t1.filter((id) => !relegatedTop.includes(id)).concat(promotedTop);

  // 2. Liga eingleisig: beste 10 je Staffel = Qualifikanten, minus Aufsteiger, plus Absteiger.
  const promSet = new Set(promotedTop);
  const qualPool = [...nord.slice(0, 10), ...sued.slice(0, 10)];
  const newTier2 = qualPool.filter((id) => !promSet.has(id)).concat(relegatedTop);

  // Alle übrigen 2.-Liga-Vereine steigen ab (aus der Simulation entfernt).
  const kept = new Set([...promotedTop, ...newTier2]);
  const dropped = [...nord, ...sued].filter((id) => !kept.has(id));

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
  ];
  return { divisions, placeholders: [], dropped, reform, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// 1994/95 — Regionalliga (Ebene 3, vier Staffeln) neu einziehen
// -----------------------------------------------------------------------------
function migrate1994(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const t2 = findDiv(current, (d) => d.tier === 2)?.orderedIds ?? [];

  const { newTier1, newTier2Base, promotedTop, relegatedTop } = topExchangeSingle(t1, t2);
  const newTier2 = newTier2Base.concat(relegatedTop); // bleibt 20

  // Neue Regionalliga: vier Staffeln. Eine bereits bestehende dritte Ebene
  // (z. B. die 1991/92 gebildete NOFV-Oberliga) fließt in die neue Regionalliga
  // ein; fehlende Plätze werden mit fiktiven Platzhaltern aufgefüllt.
  const oldTier3 = current.filter((d) => d.tier === 3).flatMap((d) => d.orderedIds);
  const rlTargets = reform.targetStructure.filter((x) => x.tier === 3);
  const { result: rlDivs, placeholders, overflow } = distributeToGroups(oldTier3, rlTargets, regionResolver(ctx), ctx.strengthOf, reform.reformId, ctx.protectedId);

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
    ...rlDivs,
  ];
  return { divisions, placeholders, dropped: overflow, reform, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// 2008/09 — 3. Liga (eingleisig) einziehen, Regionalliga auf Ebene 4
// -----------------------------------------------------------------------------
function migrate2008(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const t2 = findDiv(current, (d) => d.tier === 2)?.orderedIds ?? [];
  const rlGroups = current.filter((d) => d.tier === 3); // bisherige Regionalliga-Staffeln

  const { newTier1, newTier2Base, promotedTop, relegatedTop } = topExchangeSingle(t1, t2);
  const newTier2 = newTier2Base.concat(relegatedTop); // bleibt 20

  // 3. Liga: beste 5 jeder bisherigen Regionalliga-Staffel = 20 Qualifikanten.
  const thirdLeague: string[] = [];
  const remainder: string[] = [];
  for (const g of rlGroups) {
    thirdLeague.push(...g.orderedIds.slice(0, 5));
    remainder.push(...g.orderedIds.slice(5));
  }
  // Sollgröße 20 der 3. Liga sicherstellen (auffüllen, falls Datenlage kleiner).
  const thirdTarget = reform.targetStructure.find((x) => x.id === 'tier3')!;
  const thirdPlaceholders: SimClub[] = [];
  while (thirdLeague.length < thirdTarget.teamCount) {
    const ph = makePlaceholder(reform.reformId, 3, null);
    thirdPlaceholders.push(ph); thirdLeague.push(ph.id);
  }

  // Neue viertklassige Regionalliga: Rest geografisch auf 3 Staffeln + auffüllen.
  const rl4Targets = reform.targetStructure.filter((x) => x.tier === 4);
  const { result: rl4Divs, placeholders: rl4Placeholders, overflow } =
    distributeToGroups(remainder, rl4Targets, regionResolver(ctx), ctx.strengthOf, reform.reformId, ctx.protectedId);

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
    { meta: metaOf(thirdTarget), ids: thirdLeague },
    ...rl4Divs,
  ];
  return {
    divisions,
    placeholders: [...thirdPlaceholders, ...rl4Placeholders],
    dropped: overflow, reform, promotedTop, relegatedTop,
  };
}

// -----------------------------------------------------------------------------
// 2012/13 — Regionalliga in fünf Staffeln (Nord, Nordost, West, Südwest, Bayern)
// -----------------------------------------------------------------------------
// Auf-/Abstieg der Saison 2011/12 noch nach altem Modus (drei Meister steigen auf,
// drei Absteiger aus der 3. Liga nach Region), danach werden alle Vereine der
// Ebene 4 nach Region auf die fünf neuen Staffeln verteilt; die zusätzlichen Plätze
// füllt game/clubPool.ts `absorbPlaceholders` mit Amateurvereinen der Region.
function migrate2012(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const base = normalTransition(ctx);
  const t = reform.targetStructure;
  const rl4 = base.divisions.filter((d) => d.meta.tier === 4).flatMap((d) => d.ids);
  const { result, placeholders, overflow } = distributeToGroups(rl4, t.filter((x) => x.tier === 4), regionResolver(ctx), ctx.strengthOf, reform.reformId, ctx.protectedId);
  const upper = base.divisions.filter((d) => d.meta.tier < 4).map((d) => {
    const tt = t.find((x) => x.tier === d.meta.tier && x.group === d.meta.group);
    return tt ? { meta: metaOf(tt), ids: d.ids } : d;
  });
  return {
    ...base,
    divisions: [...upper, ...result],
    placeholders: [...base.placeholders, ...placeholders],
    dropped: [...base.dropped, ...overflow],
    reform,
  };
}

// -----------------------------------------------------------------------------
// 1991/92 — Deutsche Wiedervereinigung: DDR-Ligen in die Pyramide integrieren
// -----------------------------------------------------------------------------
// Die DDR-Divisionen (interne tier 101 = DDR-Oberliga, tier 102 = DDR-Liga)
// werden für diese eine Transition in `ctx.current` mitgegeben (siehe App.tsx /
// startNextSeason). Verteilung nach DDR-Oberliga-Endstand:
//   Platz 1–2 → 1. Liga (auf 20 aufgestockt),
//   Platz 3–6 → 2. Liga (direkt), Platz 7–8 → 2. Liga (Aufstiegsrunde),
//   Rest DDR-Oberliga + komplette DDR-Liga → NOFV-Oberliga (Ebene 3, Nordost).
// West-Auf-/Abstieg 1.↔2. Liga entfällt in dieser Umbau-Saison (alle West-Vereine
// bleiben; die 1. Liga wächst durch die 2 DDR-Aufsteiger einmalig auf 20).
function migrate1991(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const t2 = findDiv(current, (d) => d.tier === 2)?.orderedIds ?? [];
  const ober = findDiv(current, (d) => d.tier === 101)?.orderedIds ?? [];
  const liga = findDiv(current, (d) => d.tier === 102)?.orderedIds ?? [];

  const toBL = ober.slice(0, 2);        // Platz 1–2 → 1. Liga
  const toL2direct = ober.slice(2, 6);  // Platz 3–6 → 2. Liga direkt
  const toL2playoff = ober.slice(6, 8); // Platz 7–8 → 2. Liga (Aufstiegsrunde)
  const restOber = ober.slice(8);       // Rest DDR-Oberliga → NOFV

  // 1. Liga: alle West-Erstligisten bleiben + 2 DDR-Aufsteiger → einmalig 20.
  const newTier1 = [...t1, ...toBL];
  // 2. Liga: alle West-Zweitligisten bleiben + 6 DDR-Vereine (einmalig vergrößert).
  const newTier2 = [...t2, ...toL2direct, ...toL2playoff];
  // NOFV-Oberliga (Ebene 3, Nordost): Rest DDR-Oberliga + komplette DDR-Liga.
  let nofv = [...restOber, ...liga];
  const dropped: string[] = [];
  // Gerade Staffelgröße sicherstellen (Spielplan-Generator braucht gerade Zahl).
  if (nofv.length % 2 === 1) dropped.push(nofv.pop() as string);

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
    { meta: metaOf(t.find((x) => x.id === 'tier3-nordost')!), ids: nofv },
  ];
  // promotedTop = DDR-Aufsteiger in die 1. Liga (für die Meilenstein-Nachricht).
  return { divisions, placeholders: [], dropped, reform, promotedTop: toBL, relegatedTop: [] };
}

// -----------------------------------------------------------------------------
// Normalisierung übergroßer Ebenen auf die Soll-(Steady-)Struktur
// -----------------------------------------------------------------------------
// Nach der einmalig übergroßen Wiedervereinigungs-Saison (1. Liga = 20, 2. Liga
// vergrößert) führt der reguläre Saisonwechsel die Ebenen schrittweise auf ihre
// Sollgrößen zurück: übergroße Ebenen geben ihre schwächsten Vereine an die
// nächsttiefere Ebene ab (top-down); auf der untersten Ebene fallen Überzählige
// aus der Simulation. Dadurch steigen in der Normalisierungs-Saison mehr Vereine
// ab als sonst. Passt eine Ebene bereits, ist der Schritt ein No-op.
function normalizeToSteady(res: TransitionResult, newSeason: string, given?: DivisionTarget[]): TransitionResult {
  const targets = given ?? structureForSeason(newSeason);
  const tiers = Array.from(new Set(res.divisions.map((d) => d.meta.tier))).sort((a, b) => a - b);
  const dropped = [...res.dropped];
  for (const tier of tiers) {
    for (const d of res.divisions.filter((x) => x.meta.tier === tier)) {
      const tgt = targets.find((t) => t.id === d.meta.id)?.teamCount
        ?? targets.find((t) => t.tier === tier)?.teamCount
        ?? d.ids.length;
      while (d.ids.length > tgt) {
        const victim = d.ids.pop() as string; // schwächster (Tabellenende) zuerst
        const lower = res.divisions.find((x) => x.meta.tier === tier + 1);
        if (lower) lower.ids.push(victim); else dropped.push(victim);
      }
    }
  }
  return { ...res, dropped };
}

// -----------------------------------------------------------------------------
// Öffentliche Einstiegsfunktion
// -----------------------------------------------------------------------------
/**
 * Berechnet die Mitgliedschaften der neuen Saison. Liegt für die Saison eine noch
 * nicht angewandte Reform vor, wird die entsprechende Struktur-Migration
 * ausgeführt; andernfalls der generische, strukturunabhängige Auf-/Abstieg.
 */
export function computeSeasonTransition(ctx: TransitionContext): TransitionResult {
  const pending = pendingReform(ctx.newSeason, ctx.appliedReforms);
  let res: TransitionResult;
  if (pending) {
    switch (pending.reformId) {
      case 'reform-1981-single-second': res = migrate1981(ctx, pending); break;
      case 'reform-1991-reunification': res = migrate1991(ctx, pending); break;
      case 'reform-1994-regionalliga': res = migrate1994(ctx, pending); break;
      case 'reform-2008-third-league': res = migrate2008(ctx, pending); break;
      case 'reform-2012-regionalliga': res = migrate2012(ctx, pending); break;
      default: res = alignStructure(normalTransition(ctx), ctx, pending.targetStructure); break;
    }
  } else {
    // Regulärer Saisonwechsel; führt zugleich übergroße Ebenen (z. B. die 1991/92
    // einmalig vergrößerte 1./2. Liga) schrittweise auf die Sollgrößen zurück und
    // ordnet Staffeln älterer Spielstände nach der Soll-Struktur neu.
    res = normalizeToSteady(normalTransition(ctx), ctx.newSeason, ctx.targets);
    res = alignStructure(res, ctx, structureForSeason(ctx.newSeason));
  }
  return ensureProtected(res, ctx.protectedId);
}

/**
 * Stellt sicher, dass der Verein des Spielers nie aus der Ligapyramide fällt.
 * Falls eine Reform ihn (z. B. als Absteiger in eine nicht simulierte Amateurliga)
 * entfernen würde, wird er stattdessen in die unterste Ebene aufgenommen und
 * verdrängt dort den schwächsten Eintrag (Platzhalter bevorzugt, sonst realer
 * Verein, der dann absteigt). So bleiben alle Staffelgrößen gerade.
 */
function ensureProtected(res: TransitionResult, protectedId?: string): TransitionResult {
  if (!protectedId) return res;
  if (res.divisions.some((d) => d.ids.includes(protectedId))) return res;
  const lowestTier = Math.max(...res.divisions.map((d) => d.meta.tier));
  const target = res.divisions.find((d) => d.meta.tier === lowestTier);
  if (!target || target.ids.length === 0) return res;
  const victimIdx = target.ids.length - 1;
  const victim = target.ids[victimIdx];
  target.ids[victimIdx] = protectedId;
  const dropped = res.dropped.filter((id) => id !== protectedId);
  let placeholders = res.placeholders;
  if (victim && victim.startsWith('ph-')) {
    placeholders = res.placeholders.filter((p) => p.id !== victim); // Platzhalter entfällt lautlos
  } else if (victim) {
    dropped.push(victim); // realer Verein steigt an Stelle des Spielers ab
  }
  return { ...res, dropped, placeholders };
}

