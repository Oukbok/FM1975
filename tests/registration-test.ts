// Spielermeldung & Ausländerregeln ohne UI: Grenzen je Epoche in resolveLineup (auch KI),
// Status Einheimisch/Europäer/Fußball-Deutscher, Meldeliste (Vorauswahl, Homegrown-Verkleinerung,
// Sperre nach dem ersten Spiel), Kaderauflagen + Verhandlungssperre für Nicht-Europäer.
//   node scripts/run-ts.mjs tests/registration-test.ts
import { createNewGame } from '../src/game/newGame';
import { resolveLineup } from '../src/engine/match/team';
import { countsAsForeign, matchForeignCap, setEuroLists, setRegHome } from '../src/engine/registration';
import { checkEuroList, domesticStatus, registrationBlocker, suggestEuroList } from '../src/game/registrationGame';
import type { Player } from '../src/types';

let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const g = createNewGame({ managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
setRegHome('GER');
const me = g.clubs[g.managedClubId];
const sq = me.playerIds.map((id) => g.players[id]);
// Fünf starke Ausländer: zwei Engländer, zwei Brasilianer, ein Niederländer
const make = (i: number, nat: string) => { const p = sq[i]; p.nationality = nat; p.overall = 95; p.id.includes('_y_'); p.history = { ...(p.history ?? {}), stations: [] } as any; return p; };
const fx = [make(0, 'ENG'), make(1, 'ENG'), make(2, 'BRA'), make(3, 'BRA'), make(4, 'NED')];
const count = (year: number, euro = false) => { const lu = resolveLineup(me, g.players, false, 5, { year, euro }); return [...lu.xi.map((x) => x.p), ...lu.bench].filter((p) => fx.includes(p as Player)).length; };
ok(matchForeignCap(1980) === 2 && count(1980) === 2, `1980: höchstens 2 Ausländer im Bogen (${count(1980)})`);
ok(matchForeignCap(1993) === 3 && count(1993) <= 3, `1993: höchstens 3 (${count(1993)})`);
ok(!countsAsForeign(fx[0], 1997) && countsAsForeign(fx[2], 1997), '1997: Engländer frei, Brasilianer zählt');
ok(count(1997) === 5 - 0 || count(1997) >= 4, `1997: Europäer frei, Nicht-Europäer max 3 (${count(1997)} von 5)`);
ok(count(2010) === 5, `2010: keine Grenze (${count(2010)})`);
// Meldeliste
const s1999 = g.season; (g as any).season = '2007/08';
const list = suggestEuroList(g);
ok(list.length <= 25, `Vorauswahl ${list.length} Spieler`);
const chk = checkEuroList(g, list);
ok(chk.effMax != null && chk.effMax <= 25, `Homegrown-Prüfung: ${chk.club} Verein, ${chk.assoc} Land, Obergrenze ${chk.effMax}`);
setEuroLists({ [me.id]: list.slice(0, 11) });
const lu = resolveLineup(me, g.players, false, 5, { year: 2007, euro: true });
ok(lu.xi.every((x) => list.slice(0, 11).includes(x.p.id)), 'Europapokal: nur Gemeldete in der Startelf');
setEuroLists({});
// Kaderauflagen 2005: vier Nicht-Europäer erlaubt
(g as any).season = '2005/06';
for (const i of [5, 6, 7]) sq[i].nationality = 'ARG';
const st = domesticStatus(g);
ok(st.nonEurope === 5 && st.issues.length > 0, `2005: ${st.nonEurope} Nicht-Europäer → Auflage verletzt`);
const other = Object.values(g.players).find((p) => p.clubId !== me.id && !p.isYouth)!;
other.nationality = 'BRA';
ok(!!registrationBlocker(g, other), 'Verhandlung über weiteren Nicht-Europäer gesperrt');
(g as any).season = '2008/09';
const st8 = domesticStatus(g);
ok(st8.minNational === 12 && !!st8.local, `2008: Pflicht 12 Einheimische (${st8.national}) + Local Player (${st8.localAssoc}/${st8.localClub})`);
(g as any).season = s1999;
console.log(fails ? `\n${fails} Fehler.` : '\nSpielermeldung: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
