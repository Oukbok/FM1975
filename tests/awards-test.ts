// Die Besten der Saison ohne UI: Wertung je Mannschaftsteil, Mindesteinsätze,
// Plausibilität über mehrere Saisons (Torjäger vorn, Torwart mit Gegentor-/Notenbezug),
// Archiv begrenzt, Migration, Rückfall beim Saisonwechsel.
//   npm run test:awards [saisons]   (Standard 4)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { AWARD_CATS, type AwardCandidate, awardScore, computeAwards, minApps } from '../src/engine/seasonAwards';
import { MAX_AWARD_SEASONS, awardCandidates, awardSeasonEnd, awardsState, migrateSeasonAwards, pendingAwards } from '../src/game/seasonAwardsGame';
import type { Game } from '../src/game/state';

let seed = 1979;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };

// 1) Reine Formel
const ctx = { matchdays: 34, teams: 18 };
const base: AwardCandidate = { pid: 'a', name: 'A', clubId: 'x', clubName: 'X', pos: 'MS', cat: 'ATT', age: 25, apps: 30, avg: 3.0, goals: 15, assists: 4, clean: 8, gaPerGame: 1.2, rank: 5 };
expect(awardScore({ ...base, avg: 2.5 }, ctx).score > awardScore(base, ctx).score, 'Bessere Note bringt nicht mehr Punkte');
expect(awardScore({ ...base, goals: 25 }, ctx).score > awardScore(base, ctx).score, 'Mehr Tore bringen im Sturm nicht mehr Punkte');
const gk: AwardCandidate = { ...base, cat: 'GK', pos: 'TW', goals: 0, assists: 0 };
expect(awardScore({ ...gk, gaPerGame: 0.8 }, ctx).score > awardScore(gk, ctx).score, 'Weniger Gegentore bringen dem Torwart nichts');
expect(awardScore({ ...gk, clean: 14 }, ctx).score > awardScore(gk, ctx).score, 'Zu-null-Spiele bringen dem Torwart nichts');
const few = computeAwards([{ ...base, apps: minApps(ctx) - 1, avg: 1.0, goals: 30 }, base], ctx);
expect(few.cats.ATT.length === 1 && few.cats.ATT[0].pid === 'a' && few.cats.ATT[0].apps === 30, 'Mindesteinsätze nicht beachtet');
console.log(`Formel: Mindesteinsätze ${minApps(ctx)} von ${ctx.matchdays}, Beispiel Sturm ${awardScore(base, ctx).score} Punkte`);

// 2) Mehrere Saisons simulieren
const seasons = Number(process.argv[2] ?? 4);
const g: Game = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
(g as any).simAutoManage = true;
let topScorerWins = 0, topScorerPodium = 0, gkGood = 0, gkCount = 0;
for (let s = 0; s < seasons; s++) {
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    const t = g.clubs[g.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    processDay(g, HEADLESS_UI);
    if (++guard > 1000) fail('Saison endet nicht');
  }
  const aw = pendingAwards(g);
  expect(aw && aw.season === g.season, `${g.season}: keine Auszeichnungen am Saisonende`);
  const { cands, matchdays } = awardCandidates(g);
  const need = minApps({ matchdays, teams: g.table.rows.length });
  for (const cat of AWARD_CATS) {
    expect(aw!.cats[cat].length === 3, `${g.season}: ${cat} hat nicht drei Geehrte`);
    for (const e of aw!.cats[cat]) {
      expect(e.ap >= need, `${g.season}: ${e.n} (${cat}) nur ${e.ap} Einsätze (< ${need})`);
    }
    expect((aw!.cats[cat][0].why ?? '').length > 10, `${g.season}: ${aw!.cats[cat][0].n} ohne Begründung`);
    expect(aw!.cats[cat][0].pts >= aw!.cats[cat][1].pts, `${g.season}: ${cat} nicht sortiert`);
  }
  // Torjäger: der beste Stürmer nach Toren landet oft vorn.
  const att = cands.filter((c) => c.cat === 'ATT' && c.apps >= need).sort((a, b) => b.goals - a.goals);
  if (att[0]) {
    if (aw!.cats.ATT[0].p === att[0].pid) topScorerWins++;
    if (aw!.cats.ATT.some((e) => e.p === att[0].pid)) topScorerPodium++;
  }
  // Torwart: Sieger mit Note/Gegentoren im besseren Drittel der Stammtorhüter.
  const gks = cands.filter((c) => c.cat === 'GK' && c.apps >= need);
  const w = aw!.cats.GK[0];
  const better = gks.filter((c) => c.avg < w.g - 1e-9 && c.gaPerGame < w.ga - 1e-9).length;
  gkCount++;
  if (better <= Math.max(1, Math.floor(gks.length / 3))) gkGood++;
  const best = aw!.best ? aw!.cats[aw!.best][0] : null;
  console.log(`${g.season} ${aw!.divName}: ${AWARD_CATS.map((c) => `${c} ${aw!.cats[c][0].n} (${aw!.cats[c][0].cn}, Note ${aw!.cats[c][0].g}, ${aw!.cats[c][0].gl} T, ${aw!.cats[c][0].cs} z.n., ${aw!.cats[c][0].pts} P)`).join(' | ')}`);
  console.log(`   Spieler der Saison: ${best?.n ?? '—'} · Newcomer: ${aw!.rookie ? `${aw!.rookie.n} (${aw!.rookie.a})` : '—'} · Torjäger ${att[0]?.name} ${att[0]?.goals} · ${w.why}`);
  // Zweiter Aufruf vergibt nicht doppelt.
  expect(awardSeasonEnd(g, g.calendar.currentDate) === null, 'Doppelte Vergabe');
  startNextSeason(g);
  expect(!awardsState(g)?.pending, 'pending nach dem Saisonwechsel nicht gelöscht');
}
expect(awardsState(g)!.seasons.length === seasons, 'Archiv unvollständig');
expect(topScorerPodium >= Math.ceil(seasons * 0.75), `Torjäger nur ${topScorerPodium}/${seasons} auf dem Podest`);
expect(gkGood >= Math.ceil(gkCount * 0.75), `Torwart-Sieger nur ${gkGood}/${gkCount} mit gutem Noten-/Gegentorbezug`);
console.log(`Torjäger Sieger ${topScorerWins}/${seasons}, Podest ${topScorerPodium}/${seasons}; Torwart plausibel ${gkGood}/${gkCount}`);

// 3) Archiv begrenzt + Migration idempotent
const st = awardsState(g)!;
const one = st.seasons[0];
for (let i = 0; i < MAX_AWARD_SEASONS + 10; i++) st.seasons.push({ ...one, season: `x${i}` });
st.pending = 'gibt-es-nicht';
migrateSeasonAwards(g);
expect(st.seasons.length === MAX_AWARD_SEASONS && !st.pending, 'Archiv nicht begrenzt / pending nicht bereinigt');
const snap = JSON.stringify(st);
migrateSeasonAwards(g);
expect(JSON.stringify(st) === snap, 'Migration nicht idempotent');
const old = { ...g } as any;
delete old.seasonAwards;
migrateSeasonAwards(old);
expect(old.seasonAwards === undefined, 'Migration legt bei alten Ständen ein Feld an');

// 4) Rückfall: ohne season_end-Ereignis vergibt startNextSeason (ohne Popup).
{
  const g2: Game = createNewGame({
    managedClubId: 'muc',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  (g2 as any).simAutoManage = true;
  let guard = 0;
  while (g2.calendar.currentDate < `${g2.season.slice(0, 4)}-${'06-01'}`.replace(/^(\d{4})/, (y) => String(Number(y) + 1)) && guard++ < 500) processDay(g2, HEADLESS_UI);
  const season = g2.season;
  expect(!awardsState(g2), 'Vergabe vor dem Saisonende');
  startNextSeason(g2);
  const s2 = awardsState(g2)?.seasons.find((x) => x.season === season);
  expect(s2 && !awardsState(g2)!.pending, 'Rückfall in startNextSeason fehlt');
  console.log(`Rückfall ${season}: ${AWARD_CATS.map((c) => s2!.cats[c][0]?.n).join(', ')}`);
}
console.log(`Spielstand: ${(JSON.stringify(awardsState(g)!.seasons[0]).length / 1024).toFixed(1)} KB je Saison`);
console.log('OK – Auszeichnungen der Saison');
