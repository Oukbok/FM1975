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
let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const mgr = { name: 'T', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any;
const make = (year?: number, club?: string) => createNewGame({ managedClubId: club ?? (year ? composeHome('ger', year)?.tier1[2]?.id ?? 'fra' : 'mgl'), manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, ...(year ? { startYear: year, country: 'ger' } : {}) } as any);
const resIds = (g: Game) => Object.keys(g.simClubs).filter((id) => id.startsWith('res-'));
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
console.log(fails ? `\n${fails} Fehler.` : '\nZweite Mannschaft: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
