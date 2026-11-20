// =============================================================================
// Auf-/Abstieg zwischen zwei mehrgleisigen Ebenen (anderes Heimatland, Wunsch Pascal: 3./4. Ebene)
// -----------------------------------------------------------------------------
// data/reformTransition.ts `normalTransition` geht davon aus, dass die obere Ebene eingleisig ist
// (Deutschland). In Spanien, Italien, Frankreich … liegen über der 4. Ebene mehrere Staffeln der
// 3. Ebene. Dann (nur mit `ctx.targets`, also nie im deutschen Ligasystem):
//  • Aufsteiger P = max(Staffeln unten, ⌊Größe oben / 6⌉) – wie in der Hintergrund-Welt
//    (engine/worldDeep.ts): zuerst die Staffelsieger, dann die Zweiten … (je Runde die stärksten);
//  • jede obere Staffel gibt reihum ihre Schlechtesten ab, insgesamt P (Größen bleiben gleich);
//  • Aufsteiger füllen die oberen Staffeln auf (Zone/Region bevorzugt), Absteiger die unteren
//    Staffeln (je Staffel so viele, wie sie abgegeben hat).
// =============================================================================
import type { CurrentDivision, TransitionContext } from './reformTransition';
import { assignByRegion, clubRegion, type Region } from './regionGeo';

export function multiUpperExchange(
  uppers: CurrentDivision[], lowers: CurrentDivision[],
  remove: Record<string, Set<string>>, add: Record<string, string[]>, ctx: TransitionContext,
): { promoted: string[]; relegated: string[] } {
  const str = ctx.strengthOf;
  const regionOf = (id: string): Region => ctx.regionHint?.(id) ?? clubRegion(ctx.cityOf(id), null);
  const stayOf = (d: CurrentDivision) => d.orderedIds.filter((id) => !remove[d.id].has(id));
  const upperN = uppers.reduce((a, d) => a + stayOf(d).length + add[d.id].length, 0);
  const P = Math.max(lowers.length, Math.round(upperN / 6));
  // Aufsteiger: Sieger, dann Zweite … (je Runde die stärksten).
  const promoted: string[] = [];
  const byGroup = new Map<string, number>();
  const longest = Math.max(0, ...lowers.map((d) => d.orderedIds.length));
  for (let k = 0; promoted.length < P && k < longest; k++) {
    const cand = lowers.map((d) => ({ id: d.orderedIds[k], gid: d.id })).filter((x) => x.id && !remove[x.gid].has(x.id))
      .sort((a, b) => str(b.id) - str(a.id) || a.id.localeCompare(b.id));
    for (const x of cand) if (promoted.length < P) { promoted.push(x.id); remove[x.gid].add(x.id); byGroup.set(x.gid, (byGroup.get(x.gid) ?? 0) + 1); }
  }
  // Absteiger reihum vom Tabellenende jeder oberen Staffel (eigener Verein nur, wenn er dran ist).
  const relegated: string[] = [];
  const lost = new Map<string, number>();
  const stays = uppers.map((d) => ({ d, ids: stayOf(d) }));
  const deepest = Math.max(0, ...stays.map((s) => s.ids.length));
  for (let j = 0; relegated.length < promoted.length && j < deepest; j++) {
    for (const s of stays) {
      const id = s.ids[s.ids.length - 1 - j];
      if (!id || relegated.length >= promoted.length || s.ids.length - j <= 2) continue;
      relegated.push(id); remove[s.d.id].add(id); lost.set(s.d.id, (lost.get(s.d.id) ?? 0) + 1);
    }
  }
  const upSlots = uppers.map((d) => ({ group: d.group, cap: lost.get(d.id) ?? 0 }));
  for (let k = 0, extra = promoted.length - relegated.length; k < extra; k++) upSlots[k % upSlots.length].cap++;
  const up = assignByRegion(promoted, upSlots, regionOf);
  uppers.forEach((d, k) => add[d.id].push(...up.buckets[k]));
  const downSlots = lowers.map((d) => ({ group: d.group, cap: byGroup.get(d.id) ?? 0 }));
  const down = assignByRegion(relegated, downSlots, regionOf);
  lowers.forEach((d, k) => add[d.id].push(...down.buckets[k]));
  // Rest (kann bei vollen Staffeln vorkommen) in die erste Staffel mit Platz.
  for (const id of up.overflow) add[uppers[0].id].push(id);
  for (const id of down.overflow) add[lowers[0].id].push(id);
  return { promoted, relegated };
}
