// Zweite Mannschaft ohne UI: Tabelle/Spieltag sonntags, Aufstellung je Schwerpunkt, Positions-Training,
// Spielpraxis nur für Aufgestellte, keine Spiele im Juni/Juli; dazu die Ligapyramide
// (game/reservePyramid.ts): Einordnung je Epoche, Aufstiegssperre, Zwangsabstieg, Pokal bis 2007/08,
// Migration alter Spielstände.
//   node scripts/run-ts.mjs tests/reserve-test.ts
import { createNewGame } from '../src/game/newGame';
import { startNextSeason } from '../src/game/season';
import { OWN_ID, ownReserveDivision, ownReserveMinutes, pickReserveXI, reserveDaily, reserveState, setPosTrain, setReserveFocus } from '../src/game/reserveTeam';
import { reserveTransition } from '../src/game/reservePyramid';
import { reserveView } from '../src/game/reserveView';
import { ensurePositionSkill } from '../src/engine/positionSkill';
import { composeHome } from '../src/game/worldCompose';
import type { Game } from '../src/game/state';
import { processDay } from '../src/game/day';
import { HEADLESS_UI } from '../src/game/dayUi';
import { findOwnMatchDue, findMatch, quickSimOwnMatch } from '../src/game/ownMatch';
import { cupTieState, ownAmrId } from '../src/game/reserveCup';
import { resolveLineup } from '../src/engine/match/team';
import { bindRegistration } from '../src/game/registrationGame';
import { amateurLeagues, amateurLeaguesDaily, amateurTablesView } from '../src/game/amateurLeagues';
import { competitionOptions, buildSnapshot } from '../src/game/competitionView';
import { cupField, enforceWorldReserves } from '../src/engine/worldReserves';
let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const mgr = { name: 'T', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any;
const make = (year?: number, club?: string) => createNewGame({ managedClubId: club ?? (year ? composeHome('ger', year)?.tier1[2]?.id ?? 'fra' : 'mgl'), manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, ...(year ? { startYear: year, country: 'ger' } : {}) } as any);
const resIds = (g: Game) => Object.keys(g.simClubs).filter((id) => id.startsWith('res-') && !g.simClubs[id].ddr);
const tierOfClub = (g: Game, id: string) => g.simClubs[id]?.tier ?? (g.clubs[id] ? g.leagues.playerDivision.tier : 99);
/** Keine zweite Mannschaft in der 2. Liga oder auf/über der Ebene ihrer ersten Mannschaft. */
const rulesOk = (g: Game) => g.leagues.otherDivisions.filter((d) => d.tier < 100).every((d) => d.clubIds.every((id) => !id.startsWith('res-') || (d.tier >= 3 && d.tier > tierOfClub(g, id.slice(4)))));
const forceChampion = (g: Game) => { const st = reserveState(g)!; for (const r of st.table) { r.p = 34; r.w = r.id === OWN_ID ? 34 : 5; } st.md = (st.table.length - 1) * 2; };

// --- 1) Grundfunktionen (Spielstart 1975) ------------------------------------------------
const g = make();
const me = g.clubs[g.managedClubId];
ok(!reserveState(g) || (me.youthInvest?.levels.reserve ?? 0) > 0, 'ohne Baustein keine zweite Mannschaft');
me.youthInvest!.levels.reserve = 1;
const st = reserveState(g)!;
ok(st && st.table.length >= 10 && st.table.length % 2 === 0, `Liga mit ${st.table.length} Mannschaften`);
ok(st.table.some((r) => r.id.startsWith('res-')) && st.table.some((r) => g.simClubs[r.id]?.tier === 9 && !r.id.startsWith('res-')), 'Amateurliga: zweite Mannschaften und Pool-Vereine der Region');
ok(reserveView(g)!.league === 'Amateurliga' && !ownReserveDivision(g), `1975: höchste Amateurliga „${reserveView(g)!.league}“`);
ok(!!reserveView(g)!.blocked?.includes('2. Liga'), 'Hinweis: Aufstieg in die 2. Liga gesperrt');
setReserveFocus(g, 'youth');
const xi = pickReserveXI(g, me, st);
ok(xi.length >= 2 && xi.every(([p]) => p.age <= 23), `Nachwuchs: ${xi.length} Spieler (Rest Amateure), alle ≤ 23`);
setReserveFocus(g, 'comeback');
const xi2 = pickReserveXI(g, me, st);
ok(xi2.some(([p]) => p.age > 23), `Rückkehrer: auch Profis über 23 (${xi2.length})`);
const young = xi[0][0];
setPosTrain(g, [{ pid: young.id, pos: 'LA' }]);
const before = ensurePositionSkill(young, g.calendar.currentDate).v.LA ?? 0;
reserveDaily(g, '1975-07-06');
ok(st.md === 0, 'Juli: kein Spieltag');
reserveDaily(g, '1975-08-17'); reserveDaily(g, '1975-08-24');
ok(st.md === 2 && st.results.length === 2, `zwei Spieltage gespielt (${st.results.map((r) => `${r.gf}:${r.ga}`).join(', ')})`);
ok((ensurePositionSkill(young, '1975-08-24').v.LA ?? 0) > before, 'Positions-Training: Vertrautheit LA steigt');
ok(st.lastXI.some(([id, pos]) => id === young.id && pos === 'LA'), 'Trainee spielt auf seiner Trainingsposition');
const notPlaying = me.playerIds.map((id) => g.players[id]).find((p) => p.age <= 23 && !st.lastXI.some(([id]) => id === p.id));
ok(ownReserveMinutes(g, young, 0) > 0 && (!notPlaying || ownReserveMinutes(g, notPlaying, 0) === 0), 'Spielpraxis nur für Aufgestellte');

// --- 2) Einordnung je Epoche ---------------------------------------------------------------
const n75 = resIds(g).length;
ok(n75 >= 25 && resIds(g).every((id) => g.simClubs[id].tier === 9) && g.simClubs[resIds(g)[0]].name.endsWith('Amateure'), `1975: ${n75} zweite Mannschaften („Amateure“), alle in den Amateurligen`);
const g95 = make(1995);
const in95 = g95.leagues.otherDivisions.filter((d) => d.tier === 3).map((d) => d.clubIds.filter((id) => id.startsWith('res-')).length);
ok(in95.length === 4 && in95.every((n) => n >= 1 && n <= 3) && rulesOk(g95), `Start 1995: Regionalliga-Staffeln mit ${in95.join('/')} zweiten Mannschaften`);
const g10 = make(2010);
const t3 = g10.leagues.otherDivisions.find((d) => d.tier === 3)!;
const in10 = g10.leagues.otherDivisions.filter((d) => d.tier === 4).map((d) => d.clubIds.filter((id) => id.startsWith('res-')).length);
ok(!t3.clubIds.some((id) => id.startsWith('res-')) && in10.every((n) => n >= 1) && rulesOk(g10) && g10.simClubs[resIds(g10)[0]].name.endsWith(' II'), `Start 2010: Regionalligen ${in10.join('/')}, 3. Liga erst über Aufstieg, Name „II“`);

// --- 3) Aufstiegssperre + Pokal bis 2007/08 -------------------------------------------------
forceChampion(g);
startNextSeason(g);
ok(!ownReserveDivision(g) && /gesperrt/.test(reserveState(g)!.note ?? ''), `1976: Meister, aber gesperrt („${reserveState(g)!.note}“)`);
ok(rulesOk(g), '1976: keine zweite Mannschaft in der 2. Liga');
const cup76 = Object.keys(g.clubs).filter((id) => id.startsWith('amr-'));
ok(cup76.includes(`amr-${g.managedClubId}`) && cup76.length <= 3 && cup76.every((id) => g.cup!.participantIds.includes(id)), `Pokal 1976/77: Amateure im Feld (${cup76.join(', ')})`);
g95.clubs[g95.managedClubId].youthInvest!.levels.reserve = 1;
reserveState(g95);
forceChampion(g95);
startNextSeason(g95);
const d96 = ownReserveDivision(g95);
ok(!!d96 && d96.tier === 3 && /steigt/.test(reserveState(g95)!.note ?? ''), `1996: Meister der Oberliga steigt auf in die ${d96?.name}`);
ok(Object.keys(g95.clubs).some((id) => id.startsWith('amr-')), 'Pokal 1996/97: Amateure dabei');
const v96 = reserveView(g95)!;
ok(v96.tier === 3 && v96.rows.length === 18 && !!v96.blocked, `Anzeige: ${v96.league}, Hinweis „${v96.blocked}“`);
// --- 3b) Deine Amateure im Pokal mit eigenem Kader + Pokalbindung --------------------------------
{
  const amr = ownAmrId(g95);
  ok(g95.cup!.participantIds.includes(amr), 'Pokal 1996/97: deine Amateure im Feld');
  let played: { match: any; round: string } | null = null;
  for (let i = 0; i < 330 && !played; i++) {
    if (!processDay(g95, HEADLESS_UI)) { const due = findOwnMatchDue(g95); if (due) { quickSimOwnMatch(g95, due); processDay(g95, HEADLESS_UI); } }
    for (const r of g95.cup!.rounds) for (const t of r.ties) {
      const m = t.legs?.[0]?.match ?? t.match;
      if (m?.result && (t.homeClubId === amr || t.awayClubId === amr)) played = { match: m, round: r.name };
    }
  }
  ok(!!played, `Pokalspiel der Amateure gespielt (${played?.round})`);
  if (played) {
    const m = played.match;
    const side = m.homeClubId === amr ? 'home' : 'away';
    const lu = m.result.report?.lineups?.[side] ?? [];
    const mine = lu.filter((x: any) => (g95.players[x.id] ?? g95.youthPlayers[x.id])?.clubId === g95.managedClubId);
    ok(lu.length >= 11 && mine.length >= 6, `Aufstellung mit eigenem Kader: ${mine.length} eigene Spieler von ${lu.length}`);
    const pros = new Set(g95.clubs[g95.managedClubId].tactics?.startingXI ?? []);
    const sameDay = g95.fixtures.some((f) => f.date === m.date && f.involvesPlayerClub);
    ok(!sameDay || mine.every((x: any) => !pros.has(x.id)), 'Profi-Startelf nicht doppelt am selben Tag');
    const tie = cupTieState(g95);
    ok(mine.every((x: any) => tie.amateurs.includes(x.id)), `Pokalbindung: ${tie.amateurs.length} Spieler an die Amateure gebunden`);
    const msg = g95.messages.find((x) => x.relatedId === m.id && x.from === 'Trainer der Amateure');
    ok(!!msg && !!findMatch(g95, m.id), `Nachricht + Spielbericht („${msg?.subject}“)`);
    // Gebundene Spieler fehlen in der Pokal-Aufstellung der Profis.
    bindRegistration(g95);
    const club = g95.clubs[g95.managedClubId];
    const tied = tie.amateurs.find((id) => g95.players[id]);
    if (tied) {
      const save = club.tactics!.startingXI, saveMap = club.tactics!.lineupMap;
      const map = { ...(saveMap ?? {}) };
      const slot = Object.keys(map).find((k) => g95.players[map[k]]?.naturalPosition !== 'TW') ?? 's2';
      for (const k of Object.keys(map)) if (map[k] === tied) delete map[k];
      map[slot] = tied;
      club.tactics!.lineupMap = map;
      club.tactics!.startingXI = Object.values(map);
      const cupLu = resolveLineup(club, g95.players, true, 7, { year: 1996, cup: true });
      const ligaLu = resolveLineup(club, g95.players, true, 7, { year: 1996 });
      ok(!cupLu.xi.some((x) => x.p.id === tied) && !cupLu.bench.some((p) => p.id === tied), 'Pokalbindung: Gebundener fehlt bei den Profis im Pokal');
      ok(ligaLu.xi.some((x) => x.p.id === tied) || !!g95.players[tied].injury || g95.players[tied].suspensionMatches > 0, 'Liga: derselbe Spieler darf für die Profis spielen');
      club.tactics!.startingXI = save; club.tactics!.lineupMap = saveMap;
    }
  }
}
startNextSeason(g10);
ok(!Object.keys(g10.clubs).some((id) => id.startsWith('amr-')) && rulesOk(g10), 'ab 2008/09: keine zweite Mannschaft im Pokal');

// --- 4) Zwangsabstieg / Sperre in einer konstruierten Tabelle -----------------------------------
{
  const h = make(1995);
  const t2 = h.leagues.otherDivisions.find((d) => d.tier === 2)!;
  const rl = h.leagues.otherDivisions.filter((d) => d.tier === 3);
  const parent = t2.clubIds[0];
  const rid = `res-${parent}`;
  if (!h.simClubs[rid]) h.simClubs[rid] = { ...h.simClubs[parent], id: rid, name: `${h.simClubs[parent].name} II`, tier: 9 };
  const membership: Record<string, { ids: string[]; meta: any }> = {};
  membership.tier1 = { ids: h.table.rows.map((r) => r.clubId), meta: { tier: 1, group: null, name: '1. Liga' } };
  const t2ids = t2.clubIds.filter((x) => x !== parent);
  const blocked = rl[0].clubIds.find((x) => x.startsWith('res-')) ?? rl[0].clubIds[0];
  membership.tier2 = { ids: [...t2ids, blocked], meta: { tier: 2, group: null, name: '2. Liga' } };
  rl.forEach((d) => { membership[d.id] = { ids: d.clubIds.filter((x) => x !== blocked && x !== rid), meta: { tier: 3, group: d.group, name: d.name } }; });
  const tgt = membership[rl[1].id];
  tgt.ids = [parent, rid, ...tgt.ids].slice(0, 18);
  const r = reserveTransition(h, membership as any, '1996/97');
  ok(!tgt.ids.includes(rid) && r.pooled.includes(rid) && h.simClubs[rid], 'Zwangsabstieg: erste Mannschaft steigt in die Regionalliga ab → zweite muss in die Oberliga');
  ok(!blocked.startsWith('res-') || !membership.tier2.ids.includes(blocked), 'gesperrt: zweite Mannschaft nie in der 2. Liga (Nachrücker steigt auf)');
  ok(Object.values(membership).every((m) => new Set(m.ids).size === m.ids.length), 'keine doppelten Vereine nach dem Tausch');
}

// --- 5) Migration: alter Spielstand mit erfundener Mini-Liga ---------------------------------
{
  const o = make();
  const om = o.clubs[o.managedClubId];
  om.youthInvest!.levels.reserve = 2;
  for (const id of resIds(o)) delete o.simClubs[id];
  delete (o as any).reserveSeeded;
  (o as any).reserve = { season: o.season, focus: 'youth', pros: false, posTrain: [], lastXI: [], md: 3, level: 2, results: [],
    table: [{ id: 'own', name: `${om.shortName} II`, str: 55, p: 3, w: 2, d: 1, l: 0, gf: 5, ga: 2 }, ...Array.from({ length: 17 }, (_, i) => ({ id: `t:Ort${i}`, name: `Ort${i}`, str: 50, p: 3, w: 1, d: 1, l: 1, gf: 3, ga: 3 }))] };
  reserveDaily(o, '1975-08-31');
  ok((o as any).reserve.md === 4 && (o as any).reserve.table.length === 18, 'alter Stand: laufende Saison spielt in der alten Liga weiter');
  startNextSeason(o);
  ok(resIds(o).length > 20 && (o as any).reserveSeeded, `nächste Saison: ${resIds(o).length} zweite Mannschaften angelegt`);
  const ost = reserveState(o)!;
  ok(ost.table.length === 18 && ost.table.some((r) => g.simClubs[r.id] || o.simClubs[r.id]), `eingeordnet: ${ost.leagueName} mit echten Vereinen`);
}
// --- 6) Amateurligen mit den KI-Amateuren vor 1994 ---------------------------------------------
{
  const h = make();
  const sundays = (from: string, to: string) => { const out: string[] = []; const d = new Date(`${from}T00:00:00Z`); while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1); for (; d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 7)) out.push(d.toISOString().slice(0, 10)); return out; };
  for (const d of sundays('1975-08-01', '1975-11-30')) amateurLeaguesDaily(h, d);
  const tv = amateurTablesView(h);
  const resIn = tv.reduce((a, t) => a + t.rows.filter((r) => r.id.startsWith('res-')).length, 0);
  ok(tv.length >= 7 && tv.every((t) => t.rows.length === 18 && t.tier === 3 && t.name.startsWith('Amateurliga ')), `1975: ${tv.length} Amateurligen (${tv.map((t) => t.name.replace('Amateurliga ', '')).join(', ')})`);
  ok(resIn >= 25 && tv.every((t) => t.md >= 15), `${resIn} zweite Mannschaften spielen Tabelle (Spieltag ${tv[0]?.md})`);
  const opts = competitionOptions(h, h.season).filter((o) => o.key.startsWith('am:'));
  const snap = buildSnapshot(h, h.season, opts[0]?.key ?? '');
  ok(opts.length === tv.length && !!snap?.table?.length && snap.table[0].p > 0, `Statistiken › Liga: ${opts.length} Amateurligen mit Tabelle`);
  const pool9 = new Set(Object.values(h.simClubs).filter((x) => x.tier === 9 && !x.id.startsWith('res-')).map((x) => x.id));
  startNextSeason(h);
  const fin = (h as any).amateurLeagues?.final;
  const champs = Object.values(fin?.order ?? {}).map((ids: any) => ids.find((id: string) => !id.startsWith('res-') && !id.startsWith('x_yl.')));
  const up = h.leagues.otherDivisions.filter((d) => d.tier === 2).flatMap((d) => d.clubIds).filter((id) => pool9.has(id));
  const champUp = up.filter((id) => champs.includes(id));
  ok(!!fin && up.length >= 4 && champUp.length >= Math.min(4, up.length) - 1, `Aufsteiger in die 2. Liga aus dem Pool: ${up.length}, davon Amateurmeister ${champUp.length}`);
  ok(h.messages.some((m) => m.subject.startsWith('Amateurligen 1975/76')), 'Chronik: Meister der Amateurligen');
  ok(rulesOk(h) && !up.some((id) => id.startsWith('res-')), 'keine zweite Mannschaft steigt in die 2. Liga auf');
  const al = amateurLeagues(h)!;
  ok(al.season === '1976/77' && al.leagues.every((l) => l.md === 0), 'neue Saison: neue Tabellen');
  const g85 = make(1985);
  const t85 = amateurTablesView(g85).length ? amateurTablesView(g85) : (amateurLeagues(g85), amateurTablesView(g85));
  ok(t85.length >= 7 && t85.every((t) => t.name.startsWith('Amateur-Oberliga ')), `1985: ${t85[0]?.name} …`);
  const g92 = make(1992);
  amateurLeagues(g92);
  const t92 = amateurTablesView(g92);
  const no = t92.find((t) => t.key === 'nordost'), we = t92.find((t) => t.key === 'westfalen');
  ok(!!we && we.tier === 3 && (!no || (no.tier === 4 && no.name.startsWith('Verbandsliga'))), `1992: ${we?.name} (Ebene ${we?.tier}), ${no?.name ?? '–'} (Ebene ${no?.tier ?? '–'})`);
  amateurLeagues(g95);
  const t95 = amateurTablesView(g95);
  ok(t95.every((t) => t.tier === 4 && t.name.startsWith('Oberliga ')), `ab 1994: ${t95.length} Oberligen auf Ebene 4`);
}
// --- 7) DDR: DDR-Liga bis 1976, Nachwuchsoberliga 1976–1984, DDR-Liga ohne Aufstiegsrecht bis 1990 ----------
{
  const ddrRes = (x: Game, tier: number) => (x.leagues.otherDivisions.find((d) => d.tier === tier)?.clubIds ?? []).filter((id) => id.startsWith('res-'));
  const d75 = make();
  ok(ddrRes(d75, 102).length === 4 && ddrRes(d75, 102).every((id) => d75.simClubs[id]?.ddr && d75.simClubs[id].name.endsWith(' II')), `1975: DDR-Liga mit ${ddrRes(d75, 102).length} zweiten Mannschaften`);
  startNextSeason(d75);
  amateurLeagues(d75);
  const nol = amateurTablesView(d75).find((t) => t.key === 'ddr-nol');
  ok(ddrRes(d75, 102).length === 0 && !!nol && nol.rows.length === 14, `1976: Nachwuchsoberliga mit ${nol?.rows.length} Mannschaften, DDR-Liga ohne zweite Mannschaften`);
  ok(competitionOptions(d75, d75.season).some((o) => o.key === 'am:ddr-nol' && o.section === 'DDR'), 'Nachwuchsoberliga unter Statistiken › Liga (DDR)');
  ok(!Object.keys(d75.clubs).some((id) => id.startsWith('amr-ddr')), 'DDR-Reserven nie im DFB-Pokal');
  const d85 = make(1985);
  const li = d85.leagues.otherDivisions.find((d) => d.tier === 102)!;
  ok(ddrRes(d85, 102).length === 4, `Start 1985: DDR-Liga mit ${ddrRes(d85, 102).length} zweiten Mannschaften`);
  // Zweite Mannschaft vorne: kein Aufstieg in die Oberliga.
  const rid = ddrRes(d85, 102)[0];
  for (const r of li.table.rows) { r.points = r.clubId === rid ? 99 : r.points; }
  li.table.rows.sort((a, b) => b.points - a.points).forEach((r, i) => { r.position = i + 1; });
  startNextSeason(d85);
  ok(ddrRes(d85, 101).length === 0 && ddrRes(d85, 102).includes(rid), 'DDR-Liga: Erster ist zweite Mannschaft → kein Aufstieg, der Nächste rückt nach');
  const d89 = make(1989);
  startNextSeason(d89);
  ok(ddrRes(d89, 102).length === 0 && !Object.values(d89.simClubs).some((s) => s.ddr && s.id.startsWith('res-')), '1990/91: keine zweiten Mannschaften mehr in der DDR');
  startNextSeason(d89);
  const east = Object.values(d89.simClubs).filter((s) => s.id.startsWith('res-ddr') && s.tier < 100);
  ok(d89.season === '1991/92' && !Object.values(d89.simClubs).some((s) => s.ddr && s.id.startsWith('res-') && s.tier > 100), `1991/92: Osten im gesamtdeutschen System (${east.length} zweite Mannschaften von Ost-Vereinen)`);
}
// --- 8) Ausland: B-Teams nach Landesregel (Hintergrund-Welt) ------------------------------------
{
  const c: any = { name: 'Spanien', tiers: [['a', 'y', 'x-ii'], ['c', 'y-ii', 'x', 'd', 'e']], pool: ['p1', 'p2', 'z-ii'] };
  enforceWorldReserves(c, 2000, (id) => (id === 'p2' ? 60 : 50));
  ok(!c.tiers[0].includes('x-ii') && c.tiers[0].includes('c'), 'Spanien: B-Team nie in der 1. Liga – der Nächste steigt auf');
  ok(!c.tiers[1].includes('x-ii') && c.tiers[1].includes('p2') && c.pool.includes('x-ii'), 'Spanien: erste Mannschaft in der 2. Liga → B-Team in den Unterbau (Zwangsabstieg)');
  ok(c.tiers[1].includes('y-ii'), 'B-Team mit Stammverein in der 1. Liga bleibt in der 2. Liga');
  ok(cupField('Spanien', 1985, ['a', 'y-ii']).length === 2 && cupField('Spanien', 1995, ['a', 'y-ii']).length === 1 && cupField('Portugal', 2015, ['a', 'y-ii']).length === 1, 'Landespokal: Spanien B-Teams bis 1989/90, Portugal nie');
}
console.log(fails ? `\n${fails} Fehler.` : '\nZweite Mannschaft: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
