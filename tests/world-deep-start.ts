// Teil von tests/world-deep-test.ts: Start in der 3./4. Ebene eines anderen Heimatlandes (England 1995,
// Spanien 2010), eine Saison + Saisonwechsel + Speichern/Laden; Auslandsligen der 3./4. Ebene Spieltag für
// Spieltag (Heimat Deutschland) inkl. Statistiken › Liga, Pyramide und Vereinsprofil.
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { saveGame, loadGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { lowerTierPlan } from '../src/game/lowerTierStart';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { countryOptions, countrySeasons, countrySnapshot, statsCountries } from '../src/game/competitionCountry';
import { pyramidFromGame } from '../src/game/leaguePyramid';
import { foreignLive, foreignSeasons } from '../src/game/foreignClub';
import { worldLiveDiv } from '../src/game/worldLeagues';
import { deepIdx } from '../src/game/worldLeagues';
import type { Game } from '../src/game/state';

const ui: DayUi = { onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {}, onCupDraw: () => false, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
const tick = (g: Game) => { if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } } };
const mgr = { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'rookie' } as any;
const playSeason = (g: Game) => { const end = `${Number(g.season.slice(0, 4)) + 1}-06-29`; for (let i = 0; i < 400 && g.calendar.currentDate < end; i++) tick(g); };
const tierSizes = (g: Game) => {
  const m = new Map<number, number[]>();
  for (const d of [{ tier: g.leagues.playerDivision.tier, n: g.table.rows.length }, ...g.leagues.otherDivisions.map((d) => ({ tier: d.tier, n: d.clubIds.length }))]) {
    if (d.tier >= 100) continue;
    m.set(d.tier, [...(m.get(d.tier) ?? []), d.n]);
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, ns]) => `E${t}:${ns.join('/')}`).join(' ');
};

export async function runStartChecks(): Promise<number> {
  let fails = 0;
  const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };

  console.log('\n== Start im Ausland in der 3./4. Ebene ==');
  const cases: [string, number, number, boolean][] = [['eng', 1995, 3, true], ['eng', 1995, 4, true], ['esp', 2010, 3, true]];
  for (const [cc, y, tier, full] of cases) {
    const tag = `${cc} ${y} Ebene ${tier}`;
    const leagues = leaguesFor(cc, y);
    const lg = leagues.find((l) => l.tier === tier);
    ok(!!lg, `${tag}: Assistent zeigt wählbare Liga (${leagues.filter((l) => l.tier >= 3).map((l) => l.name).join(', ')})`);
    if (!lg) continue;
    const prev = leaguePreview(lg.key, cc, y);
    ok(prev.length >= 16 && prev.every((c) => c.tier === tier), `${tag}: Vorschau ${lg.name} mit ${prev.length} Vereinen`);
    const plan = lowerTierPlan(cc, y).find((d) => d.meta.id === lg.key)!;
    const pick = prev[Math.floor(prev.length / 2)].id;
    const t0 = Date.now();
    const g = createNewGame({ managedClubId: pick, manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: y, country: cc } as any);
    const pd = g.leagues.playerDivision;
    ok(pd.tier === tier && pd.id === lg.key, `${tag}: Spielerliga ${pd.name} (${Date.now() - t0} ms)`);
    const ids = g.table.rows.map((r) => r.clubId);
    ok(ids.length === plan.size && ids.every((id) => (g.clubs[id]?.playerIds.length ?? 0) >= 18), `${tag}: ${ids.length} Vereine mit vollem Kader`);
    const all = [...ids, ...g.leagues.otherDivisions.filter((d) => d.tier < 100).flatMap((d) => d.clubIds)];
    ok(new Set(all).size === all.length, `${tag}: kein Verein doppelt`);
    ok(g.leagues.otherDivisions.some((d) => d.tier === 1) && g.leagues.otherDivisions.some((d) => d.tier === 2), `${tag}: 1./2. Ebene simuliert (${tierSizes(g)})`);
    const own = g.clubs[g.managedClubId];
    ok(own.stadium.capacity <= 15000 && own.reputation <= 55, `${tag}: kleines Stadion ${own.stadium.capacity}, Ruf ${own.reputation}`);
    // Statistiken › Liga: Heimatland mit Ebenen 3/4
    const home = statsCountries(g).find((c) => c.mode === 'home')!;
    const opts = countryOptions(g, home, g.season, 'live');
    ok(opts.some((o) => o.section === `${tier}. Ebene`), `${tag}: Statistiken › Liga Gruppe „${tier}. Ebene“ (${opts.filter((o) => o.kind === 'league').map((o) => o.label).join(', ')})`);
    const pyr = pyramidFromGame(g);
    ok(pyr.west.levels.filter((lv) => !lv[0]?.pool && !lv[0]?.struct).length >= 4 || tier === 3 && cc !== 'eng', `${tag}: Pyramide mit echten Ligen bis Ebene 4 (${pyr.west.levels.map((lv) => lv.map((d) => d.name + (d.struct ? '*' : '')).join('+')).join(' | ')})`);
    if (!full) continue;
    const before = tierSizes(g);
    playSeason(g);
    const lastPos = g.table.rows.find((r) => r.clubId === g.managedClubId)!.position;
    const t3old = new Set(g.leagues.otherDivisions.filter((d) => d.tier === 3).flatMap((d) => d.clubIds).concat(pd.tier === 3 ? ids : []));
    startNextSeason(g);
    const after = tierSizes(g);
    ok(before === after, `${tag}: Ligagrößen nach dem Wechsel gleich (${before} → ${after})`);
    const t3new = new Set([...g.leagues.otherDivisions.filter((d) => d.tier === 3).flatMap((d) => d.clubIds), ...(g.leagues.playerDivision.tier === 3 ? g.table.rows.map((r) => r.clubId) : [])]);
    const moved = [...t3old].filter((id) => !t3new.has(id)).length;
    ok(moved > 0, `${tag}: Auf-/Abstieg aus der 3. Ebene (${moved} Vereine gewechselt), eigener Platz ${lastPos} → ${g.leagues.playerDivision.name}`);
    const thin = g.table.rows.filter((r) => (g.clubs[r.clubId]?.playerIds.length ?? 0) < 15);
    ok(!thin.length, `${tag}: neue Spielerliga mit vollen Kadern`);
    ok(await saveGame('deep', { name: 'deep', managerName: 'd', clubName: 'd', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g), `${tag}: Speichern`);
    const l = (await loadGame<Game>('deep'))!.game;
    prepareLoadedGame(l);
    for (let i = 0; i < 50; i++) tick(l);
    ok(l.leagues.playerDivision.id === g.leagues.playerDivision.id && l.table.rows.some((r) => r.played > 0), `${tag}: geladener Stand spielt weiter (${l.calendar.currentDate})`);
  }

  console.log('\n== Auslandsligen der 3./4. Ebene (Heimat Deutschland 1995) ==');
  {
    const g = createNewGame({ managedClubId: 'fra', manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: 1995, country: 'ger' } as any);
    const eng = g.world!.countries.England;
    ok((eng.deep?.length ?? 0) === 2, `England im Hintergrund mit Ebene 3/4 (${eng.deep?.map((d) => d.groups.join('/')).join(' | ')})`);
    for (let i = 0; i < 120; i++) tick(g);
    const d3 = worldLiveDiv(g, 'England', deepIdx(3, 0));
    ok(!!d3 && d3.md > 5, `England Ebene 3 Spieltag für Spieltag (Spieltag ${d3?.md}/${d3?.n})`);
    const c = statsCountries(g).find((x) => x.worldKey === 'England')!;
    const opts = countryOptions(g, c, g.season, 'roster');
    const o3 = opts.find((o) => o.section === '3. Ebene');
    ok(!!o3 && opts.some((o) => o.section === '4. Ebene'), `Statistiken › Liga England: ${opts.filter((o) => o.kind === 'league').map((o) => `${o.label} (${o.section})`).join(', ')}`);
    const snap = o3 ? countrySnapshot(g, c, g.season, 'roster', o3.key) : null;
    ok(!!snap?.table?.length && snap.table[0].p > 0, `Tabelle 3. Ebene: ${snap?.label} ${snap?.table?.length} Vereine, Spitze ${snap?.table?.[0]?.pts} Punkte`);
    const pyr = pyramidFromGame(g).abroad.find((s) => s.key === 'England')!;
    ok(pyr.levels.filter((lv) => !lv[0]?.pool && !lv[0]?.struct).length === 4, `Pyramide England: ${pyr.levels.map((lv) => lv.map((d) => `${d.name}${d.struct ? '*' : ''}(${d.clubs.length})`).join('+')).join(' | ')}`);
    const sample = eng.deep![0].ids[0];
    const fl = foreignLive(g, sample, 'England');
    ok(!!fl && fl.tier === 3, `Vereinsprofil: ${g.euroClubs![sample].name} „${fl?.label}“ Platz ${fl?.pos}`);
    playSeason(g);
    startNextSeason(g);
    const rec = g.world!.history[g.world!.history.length - 1];
    {
      const withSquad = new Set((g.worldPool?.p ?? []).map((w) => w[1]));
      const e2 = g.world!.countries.England;
      const miss = e2.tiers[1].filter((id) => !withSquad.has(id));
      const deepSq = (e2.deep ?? []).flatMap((d) => d.ids).filter((id) => withSquad.has(id)).length;
      ok(!miss.length, `Aufsteiger in die 2. Ebene haben Weltspieler-Kader (${miss.length} ohne)`);
      console.log(`     Ebene 3/4 mit Kader (Absteiger, werden abgebaut): ${deepSq}`);
    }
    ok(!!rec.deep?.England?.[0]?.length, `Welt-Historie hat die Ergebnisse der 3./4. Ebene (${rec.season})`);
    const seasons = foreignSeasons(g, sample, 'England');
    ok(seasons.some((s) => s.tier >= 3), `Vereinsprofil-Platzierungen: ${seasons.slice(-2).map((s) => `${s.season} ${s.league} ${s.pos}/${s.size}`).join(' · ')}`);
    const past = countrySeasons(g, c).find((s) => s.season === rec.season)!;
    const po = countryOptions(g, c, rec.season, past.source).filter((o) => o.section === '3. Ebene' || o.section === '4. Ebene');
    const ps = po[0] ? countrySnapshot(g, c, rec.season, past.source, po[0].key) : null;
    ok(po.length >= 2 && !!ps?.table?.length && ps.table[0].p > 0, `abgeschlossene Saison ${rec.season}: ${po.map((o) => o.label).join(', ')} mit Tabelle`);
  }
  return fails;
}
