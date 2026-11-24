// Relegation/Play-offs zwischen den Ligen ohne UI (data/relegationRules.ts, game/relegationHome.ts,
// game/relegationWorld.ts):  npm run test:relegation2
//  A) Deutschland 1985, eigener Erstligist auf Platz 16 → Relegation über die Match-Engine (Vorschau-Weg
//     findOwnMatchDue, Hin-/Rückspiel, K.-o.-Regel, Spielbericht, Nachrichten), Saisonwechsel nach Ergebnis
//  B) Deutschland 1985, eigener Verein unbeteiligt (2. Liga): Teilnehmer 16./3., Ergebnis = Saisonwechsel, Größen stabil
//  C) Deutschland 2010, eigener Zweitligist auf Platz 16 gegen den Dritten der 3. Liga (Gastverein), Speichern/Laden
//     zwischen Hin- und Rückspiel, Relegation 1./2. Liga mit vollem Zweitligisten, Auswärtstore, Kalender
//  D) Hintergrund ab 1995 über mehrere Saisons: England (Play-offs), Frankreich, Italien, Niederlande –
//     Ergebnisse in der Welt-Historie, Sieger spielen oben, Ligagrößen stabil
//  E) Heimatland England 1995 (Play-offs der 2. Ebene im Heimatland), Saisonwechsel
//  F) Alter Spielstand ohne Relegationsdaten: laufende Saison ohne, ab der nächsten aktiv
// `ONLY=A,B` wählt Abschnitte.
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { findOwnMatchDue, findMatch, isPrepared, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { saveGame, loadGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { relState, type RelHomeState } from '../src/game/relegationHome';
import { relegationFormat, relegationFormats, relegationText, RELEGATION_FORMATS } from '../src/data/relegationRules';
import { worldRelOf } from '../src/game/relegationWorld';
import { relSwap } from '../src/game/relegationCore';
import { relViewFor, relZonePositions } from '../src/game/relegationView';
import { ownFixtureOn } from '../src/game/euroFixture';
import { CalendarEngine } from '../src/engine/calendar';
import { COUNTRY_BY_CC } from '../src/data/world/countries';
import { worldStructureFor } from '../src/data/world/structure';
import type { Game } from '../src/game/state';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; } };
let seed = 4242;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: unknown, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const on = (k: string) => !only || only.has(k);
let ownPlayed = 0;
const tick = (g: Game) => {
  // Eigenes Relegationsspiel wie in der Oberfläche: Vorschau-Weg findOwnMatchDue → Schnellsimulation → Spieltag.
  const pre = g.calendar.pendingAdvance ? null : findOwnMatchDue(g);
  if (pre && pre.matchId.startsWith('rl_') && !isPrepared(pre)) { ownPlayed++; quickSimOwnMatch(g, pre); }
  if (!processDay(g, HEADLESS_UI)) {
    const due = findOwnMatchDue(g);
    if (due) { quickSimOwnMatch(g, due); processDay(g, HEADLESS_UI); }
  }
};
const runTo = (g: Game, iso: string) => { for (let i = 0; i < 1200 && g.calendar.currentDate < iso && !CalendarEngine.isSeasonOver(g.calendar) && !g.over; i++) tick(g); };
const runEnd = (g: Game) => runTo(g, '9999-01-01');
const name = (g: Game, id: string) => g.clubs[id]?.name ?? g.simClubs[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
const tierOf = (g: Game, id: string): number => {
  if (g.table.rows.some((r) => r.clubId === id)) return g.leagues.playerDivision.tier;
  return g.leagues.otherDivisions.find((d) => d.clubIds.includes(id))?.tier ?? -1;
};
const sizes = (g: Game) => [g.leagues.playerDivision, ...g.leagues.otherDivisions].filter((d) => d.tier < 100)
  .map((d) => `${d.tier}:${d.id === g.leagues.playerDivision.id ? g.table.rows.length : (d as any).clubIds.length}`).sort().join(' ');

function start(cc: string, year: number, tier: number, pickAt = 0.5): Game {
  const lgs = leaguesFor(cc, year).filter((l) => l.tier === tier);
  const prev = leaguePreview(lgs[0].key, cc, year);
  const pick = prev[Math.min(prev.length - 1, Math.floor(prev.length * pickAt))].id;
  return createNewGame({
    managedClubId: pick, manager: { name: 'Test Manager', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'ex_pro', startMode: 'manager' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, ...(year !== 1975 ? { startYear: year } : {}), ...(cc !== 'ger' ? { country: cc } : {}),
  } as any);
}

/** Letzter Ligatermin der eigenen Liga. */
const lastLeague = (g: Game) => g.fixtures.reduce((a, m) => (m.date > a ? m.date : a), '');

/** Nach dem letzten Spieltag (vor der Auswertung): eigenen Verein in der Tabelle auf Platz `pos` setzen. */
function placeOwn(g: Game, pos: number): void {
  const rows = g.table.rows;
  const i = rows.findIndex((r) => r.clubId === g.managedClubId), j = pos - 1;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  rows.forEach((r, k) => { r.position = k + 1; });
}

/** Bis zum letzten Ligaspieltag spielen, dann ggf. den eigenen Platz setzen (Auswertung erst am nächsten Tag). */
function toLeagueEnd(g: Game, pos?: number): void {
  const last = lastLeague(g);
  runTo(g, last);
  // Den letzten Spieltag selbst verarbeiten (eigenes Spiel), aber noch nicht den Tag danach.
  for (let i = 0; i < 5 && g.calendar.currentDate === last; i++) tick(g);
  if (pos) {
    placeOwn(g, pos);
    // Die Paarungen wurden am letzten Spieltag schon gelesen: mit der geänderten Tabelle neu lesen lassen.
    for (const rec of relState(g)?.recs ?? []) { delete rec.res; delete rec.skip; delete rec.up; rec.ent = []; for (const t of rec.ties) for (const l of t.legs) { l.h = ''; l.a = ''; } }
    for (const e of g.calendar.events) if (e.matchId?.startsWith('rl_')) e.processed = false;
  }
}

/** Ebene eines Auslandsvereins nach dem Saisonwechsel (99 = Unterbau/fehlt). */
const lvOf = (c: any, id: string): number => (c.tiers[0].includes(id) ? 1 : c.tiers[1]?.includes(id) ? 2 : c.deep?.[0]?.ids.includes(id) ? 3 : c.deep?.[1]?.ids.includes(id) ? 4 : 99);
const recsOf = (g: Game): RelHomeState['recs'] => relState(g)?.recs ?? [];

async function main(): Promise<void> {
  // ---------------------------------------------------------------------------
  console.log('\n== Daten ==');
  ok(RELEGATION_FORMATS.length >= 40, `${RELEGATION_FORMATS.length} Formate in ${new Set(RELEGATION_FORMATS.map((f) => f.cc)).size} Ländern`);
  ok(relegationFormat('ger', 1985, 1)?.kind === 'relegation' && !relegationFormat('ger', 1995, 1) && relegationFormat('ger', 2010, 2)?.kind === 'relegation', 'Deutschland: 1985 und 2010 Relegation, 1995 keine');
  ok(relegationText(relegationFormat('ger', 2010, 1)!, 18, '2. Liga') === '16. gegen 3. der 2. Liga (Hin/Rück)', `Text: ${relegationText(relegationFormat('ger', 2010, 1)!, 18, '2. Liga')}`);
  ok(relegationFormats('eng', 1995).length === 3 && relegationFormat('ita', 2010, 2)?.kind === 'playout', 'England 1995: Play-offs auf drei Ebenen; Italien 2010: Play-out');
  for (const f of RELEGATION_FORMATS) {
    if (f.brackets === 'champs') continue;
    const bad = f.brackets.some((b) => b.m.some((m, i) => [m.a, m.b].some((s) => 'w' in s && s.w >= i)));
    if (bad || !COUNTRY_BY_CC[f.cc]) ok(false, `Format ${f.cc} ${f.from}: Verweis auf späteres Spiel oder unbekanntes Land`);
  }
  {
    const arr = [['a', 'b', 'c'], ['d', 'e', 'f']];
    relSwap(arr, (i) => i + 1, [{ lv: 1, ent: ['c', 'f'], w: 'c' }]);
    ok(arr[0].includes('c') && arr[1].includes('f'), 'Platztausch: Sieger oben bleibt oben');
    const arr2 = [['a', 'b', 'f'], ['d', 'e', 'c']];
    relSwap(arr2, (i) => i + 1, [{ lv: 1, ent: ['c', 'f'], w: 'c' }]);
    ok(arr2[0].includes('c') && arr2[1].includes('f') && arr2[0].length === 3, 'Platztausch: Sieger rückt auf den umkämpften Platz');
  }

  // ---------------------------------------------------------------------------
  if (on('A')) {
    console.log('\n== A) Deutschland 1985, eigener Erstligist auf Platz 16 ==');
    const g = start('ger', 1985, 1, 0.6);
    const own = g.managedClubId;
    ok(recsOf(g).length === 1 && recsOf(g)[0].ties[0].legs.length === 2, `Klammern angelegt: ${recsOf(g).map((r) => r.ties.map((t) => t.legs.map((l) => l.d).join('/')).join(' ')).join(' | ')}`);
    ok(g.calendar.events.filter((e) => e.matchId?.startsWith('rl_')).length === 2, 'zwei Kalendertermine (Hin- und Rückspiel)');
    const last = lastLeague(g);
    ok(recsOf(g)[0].ties[0].legs[0].d > last, `Hinspiel ${recsOf(g)[0].ties[0].legs[0].d} nach dem letzten Spieltag ${last}`);
    toLeagueEnd(g, 16);
    const n1 = g.table.rows.length;
    tick(g); // Tag danach: Paarungen
    const rec = recsOf(g)[0];
    ok(rec.res && rec.ent.includes(own) && rec.ent.length === 2, `Teilnehmer: ${rec.ent.map((id) => name(g, id)).join(' – ')}`);
    ok(g.messages.some((m) => m.category === 'board' && /Relegation: Es geht um die Klasse/.test(m.subject)), 'Nachricht des Vorstands zur Relegation');
    const fx = ownFixtureOn(g, g.calendar.events.find((e) => e.matchId === rec.ties[0].legs[0].id)!);
    ok(!!fx && fx.opp === rec.ent.find((x) => x !== own) && fx.home, `Kalender: ${fx?.comp} gegen ${fx && name(g, fx.opp)} (H)`);
    const before = ownPlayed;
    runEnd(g);
    ok(ownPlayed - before === 2, `eigene Spiele über findOwnMatchDue: ${ownPlayed - before}`);
    const legs = rec.ties[0].legs;
    ok(legs.every((l) => l.hg != null) && !!rec.w, `Ergebnis: ${legs.map((l) => `${name(g, l.h)} ${l.hg}:${l.ag}${l.p ? ` (${l.p.join(':')} i.E.)` : l.et ? ' n.V.' : ''} ${name(g, l.a)}`).join(', ')} → ${name(g, rec.w!)}`);
    ok(legs.every((l) => !!rec.mt?.[l.id!]) && !!findMatch(g, legs[1].id!), 'Spielberichte über findMatch');
    const winner = rec.w!, loser = rec.ent.find((x) => x !== winner)!;
    startNextSeason(g);
    ok(tierOf(g, winner) === 1 && tierOf(g, loser) === 2, `Saisonwechsel: ${name(g, winner)} 1. Liga, ${name(g, loser)} 2. Liga`);
    ok(g.leagues.playerDivision.tier === (winner === own ? 1 : 2), `eigener Verein spielt ${g.leagues.playerDivision.name}`);
    ok(sizes(g) === '1:18 2:20', `Ligagrößen ${sizes(g)} (vorher 1. Liga ${n1})`);
    ok(relState(g)?.arch.some((a) => a.season === '1985/86' && a.recs[0].w === winner), 'Archiv der Relegation');
    ok(relState(g)?.season === '1986/87' && recsOf(g).length === 1, 'neue Saison: Relegation angelegt');
  }

  // ---------------------------------------------------------------------------
  if (on('B')) {
    console.log('\n== B) Deutschland 1985, eigener Verein unbeteiligt (2. Liga) ==');
    const g = start('ger', 1985, 2, 0.95);
    toLeagueEnd(g, 12);
    tick(g);
    const rec = recsOf(g)[0];
    const top = g.leagues.otherDivisions.find((d) => d.tier === 1)!;
    const u16 = top.table.rows[15].clubId, l3 = g.table.rows[2].clubId;
    ok(rec.ent[0] === u16 && rec.ent[1] === l3, `Teilnehmer: 16. ${name(g, u16)} gegen 3. ${name(g, l3)} (voller Zweitligist)`);
    const zones = relZonePositions('ger', g.season, 2, 0, g.table.rows.length);
    ok(zones.includes(3), `Tabellenzone Relegation in der 2. Liga: Platz ${zones.join(', ')}`);
    runEnd(g);
    ok(!!rec.w && rec.ties[0].legs[1].hg != null, `gespielt: ${rec.ties[0].legs.map((l) => `${l.hg}:${l.ag}`).join(', ')} → ${name(g, rec.w!)}`);
    const view = relViewFor(g, { cc: 'ger', mode: 'home' } as any, g.season, 1, 0);
    ok(view.length === 1 && view[0].ties[0].legs.length === 2, `Statistik-Ansicht: ${view[0]?.title}`);
    const w = rec.w!, l = rec.ent.find((x) => x !== w)!;
    startNextSeason(g);
    ok(tierOf(g, w) === 1 && tierOf(g, l) === 2 && sizes(g) === '1:18 2:20', `Saisonwechsel nach Ergebnis, Größen ${sizes(g)}`);
  }

  // ---------------------------------------------------------------------------
  if (on('C')) {
    console.log('\n== C) Deutschland 2010, eigener Zweitligist auf Platz 16 ==');
    const g = start('ger', 2010, 2, 0.5);
    const own = g.managedClubId;
    ok(recsOf(g).map((r) => r.lv).join() === '1,2', `Klammern 2010/11: Ebenen ${recsOf(g).map((r) => r.lv).join(', ')} (Regionalliga noch drei Direktaufsteiger)`);
    toLeagueEnd(g, 16);
    tick(g);
    const r2 = recsOf(g).find((r) => r.lv === 2)!, r1 = recsOf(g).find((r) => r.lv === 1)!;
    ok(r2.ent.includes(own) && r2.ties[0].legs[0].h !== own, `Relegation 2./3. Liga: ${r2.ent.map((id) => name(g, id)).join(' – ')}, Hinspiel beim Drittligisten`);
    ok(!!g.clubs[r1.ent[1]], `Relegation 1./2. Liga mit vollem Zweitligisten ${name(g, r1.ent[1])}`);
    void 0;
    // Bis nach dem Hinspiel, speichern, laden, weiter.
    runTo(g, CalendarEngine.addDays(r2.ties[0].legs[0].d, 1));
    ok(r2.ties[0].legs[0].hg != null && r2.ties[0].legs[1].hg == null, `Hinspiel ${r2.ties[0].legs[0].hg}:${r2.ties[0].legs[0].ag}, Rückspiel offen`);
    ok(await saveGame('rel2-c', { name: 'c', managerName: 'c', clubName: 'c', clubId: own, season: g.season, gameDate: g.calendar.currentDate }, g), 'Speichern zwischen Hin- und Rückspiel');
    const l = (await loadGame<Game>('rel2-c'))!.game;
    prepareLoadedGame(l);
    const lr = relState(l)!.recs.find((r) => r.lv === 2)!;
    ok(lr.ties[0].legs[0].hg === r2.ties[0].legs[0].hg && lr.ent.join() === r2.ent.join(), 'Laden: Relegation unverändert');
    const due0 = ownPlayed;
    runEnd(l);
    ok(ownPlayed - due0 === 1 && !!lr.w, `Rückspiel nach dem Laden über findOwnMatchDue → ${name(l, lr.w!)}${lr.ties[0].legs[1].p ? ' i.E.' : ''}`);
    const w = lr.w!;
    startNextSeason(l);
    ok(tierOf(l, w) === 2 && tierOf(l, lr.ent.find((x) => x !== w)!) === 3, `Saisonwechsel: ${name(l, w)} in der 2. Liga`);
    ok(sizes(l).startsWith('1:18 2:18 3:20'), `Ligagrößen ${sizes(l)}`);
  }

  // ---------------------------------------------------------------------------
  if (on('C2')) {
    console.log('\n== C2) Deutschland 2012: Aufstiegsspiele der Regionalliga-Meister ==');
    const g = start('ger', 2012, 1, 0.5);
    (g as any).simAutoManage = true;
    const champ = recsOf(g).filter((r) => r.lv === 3);
    ok(champ.length === 3, `drei geloste Duelle angelegt (${recsOf(g).map((r) => r.lv).join(', ')})`);
    for (const d of g.leagues.otherDivisions) { const { flushDivision } = await import('../src/engine/leagues'); flushDivision(d, g.simClubs, g.pointSystem, g.season); }
    const { finishHomeRelegation } = await import('../src/game/relegationHome');
    finishHomeRelegation(g);
    const ents = champ.flatMap((r) => r.ent);
    ok(champ.every((r) => r.ent.length === 2 && !!r.w) && new Set(ents).size === 6, `Paare: ${champ.map((r) => `${r.ent.map((id) => name(g, id)).join('–')} → ${name(g, r.w!)}`).join(', ')}`);
    const wins = champ.map((r) => r.w!);
    startNextSeason(g);
    ok(wins.every((id) => tierOf(g, id) === 3) && ents.filter((id) => !wins.includes(id)).every((id) => tierOf(g, id) === 4), 'Sieger in der 3. Liga, Verlierer bleiben in der Regionalliga');
    ok(sizes(g).startsWith('1:18 2:18 3:20'), `Ligagrößen ${sizes(g)}`);
  }

  // ---------------------------------------------------------------------------
  if (on('D')) {
    console.log('\n== D) Hintergrund ab 1995: England, Frankreich, Italien, Niederlande ==');
    const g = start('ger', 1995, 1, 0.5);
    (g as any).simAutoManage = true; // Saisonwechsel ohne Spieltage: der Autopilot übernimmt nach einem Abstieg (kein Spielende)
    const seasons = Number(process.env.SEASONS ?? 4);
    const keys: Record<string, string> = { eng: COUNTRY_BY_CC.eng.key, fra: COUNTRY_BY_CC.fra.key, ita: COUNTRY_BY_CC.ita.key, ned: COUNTRY_BY_CC.ned.key };
    const seen: Record<string, number> = {};
    for (let s = 0; s < seasons; s++) {
      const season = g.season, y = Number(season.slice(0, 4));
      if (s === 0) { runEnd(g); } // erste Saison mit Tagesablauf (Entscheidung nach dem letzten Spieltag)
      if (s === 0) ok(Object.keys(g.world?.live?.rel ?? {}).length > 0, `nach dem letzten Spieltag entschieden: ${Object.entries(g.world!.live!.rel!).filter(([, v]) => v.length).map(([k]) => k).join(', ')}`);
      startNextSeason(g);
      for (const [cc, key] of Object.entries(keys)) {
        const recs = worldRelOf(g, key, season);
        const c = g.world!.countries[key];
        const fmts = relegationFormats(cc, y).filter((f) => f.brackets !== 'champs');
        if (fmts.length) seen[cc] = (seen[cc] ?? 0) + recs.length;
        const st = worldStructureFor(cc, y + 1);
        const wrong = recs.filter((r) => r.w && !r.skip).filter((r) => r.ent.some((id) => lvOf(c, id) <= r.lv) && lvOf(c, r.w!) > r.lv);
        ok(!wrong.length && (!st || c.tiers[0].length === st.t1), `${season} ${cc}: ${recs.length} Klammern ${recs.map((r) => r.skip ? `L${r.lv}:–` : `L${r.lv}:${name(g, r.w!)}`).join(', ')}; 1. Liga ${c.tiers[0].length}${st ? `/${st.t1}` : ''}`);
      }
    }
    ok((seen.eng ?? 0) >= seasons && (seen.ita ?? 0) >= seasons && (seen.ned ?? 0) >= seasons, `Klammern je Land: ${JSON.stringify(seen)}`);
    // Frankreich 1985–1987: Barrage der Staffelzweiten gegen den Drittletzten der 1. Ebene; Spanien: Promoción.
    const g2 = start('ger', 1985, 1, 0.5);
    (g2 as any).simAutoManage = true;
    for (let s = 0; s < 3; s++) {
      const season = g2.season;
      startNextSeason(g2);
      for (const cc of ['fra', 'esp', 'eng']) {
        const key = COUNTRY_BY_CC[cc].key, c = g2.world!.countries[key];
        const recs = worldRelOf(g2, key, season);
        const want = relegationFormats(cc, Number(season.slice(0, 4))).length;
        const fine = recs.filter((r) => r.w && !r.skip).every((r) => !r.ent.some((id) => lvOf(c, id) <= r.lv) || lvOf(c, r.w!) <= r.lv);
        ok((!want || recs.length > 0) && fine, `${season} ${cc}: ${recs.map((r) => `L${r.lv}: ${r.ties.map((t) => t.legs.map((l) => `${l.hg}:${l.ag}`).join('/')).join(' | ')} → ${name(g2, r.w ?? '')}`).join('; ') || 'keine Relegation'}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  if (on('E')) {
    console.log('\n== E) Heimatland England 1995 ==');
    const g = start('eng', 1995, 2, 0.5);
    const lvs = recsOf(g).map((r) => r.lv);
    ok(lvs.includes(1), `Klammern im Heimatland: Ebenen ${lvs.join(', ')}`);
    runEnd(g);
    const r1 = recsOf(g).find((r) => r.lv === 1)!;
    ok(!!r1.w && r1.ties.length === 3 && r1.ties[2].legs.length === 1, `Play-offs: Finale ${r1.ties[2].legs.map((l) => `${name(g, l.h)} ${l.hg}:${l.ag} ${name(g, l.a)}`).join('')} → ${name(g, r1.w!)}`);
    const before = sizes(g);
    const w = r1.w!;
    startNextSeason(g);
    ok(tierOf(g, w) === 1, `${name(g, w)} spielt in der 1. Ebene`);
    ok(sizes(g) === before, `Ligagrößen stabil: ${sizes(g)}`);
  }

  // ---------------------------------------------------------------------------
  if (on('F')) {
    console.log('\n== F) Alter Spielstand ohne Relegationsdaten ==');
    const g = start('ger', 2010, 1, 0.5);
    delete (g as any).relegation;
    g.calendar.events = g.calendar.events.filter((e) => !e.matchId?.startsWith('rl_'));
    runEnd(g);
    ok(!relState(g), 'laufende Saison ohne Relegation (kein Absturz)');
    startNextSeason(g);
    ok(relState(g)?.season === '2011/12' && recsOf(g).length >= 2, `nächste Saison mit Relegation (${recsOf(g).length} Klammern)`);
  }

  console.log(fails ? `\n${fails} Fehler` : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
