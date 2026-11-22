// Weltrangliste der Nationalmannschaften ohne UI (Wunsch Pascal):
//   1. Elo-Formel (Beispiel der World Football Elo Ratings, Tordifferenz, Heimvorteil, Elfmeterschießen)
//   2. Startreihenfolge 1975 (und 1995/2025) plausibel gegen die Geschichte
//   3. 20 Saisons Länderspiele + WM/EM nur über das Ranglisten-Modul (Stärke = Grundstärke):
//      Liste bleibt stabil/plausibel, Verlauf, Nachfolgestaaten, Speicherbedarf
//   4. echtes Spiel 1975/76 (Fenster + EM 1976), Speichern/Laden, Migration alter Spielstände
//   npm run test:ranking            (alles, ≈ 1–2 min)
//   npm run test:ranking -- kurz    (ohne Teil 4)
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import type { Game } from '../src/game/state';
import { nationalState, hostPick, type NationalState, type IntlWindow } from '../src/game/national/nationalGame';
import { activeNations } from '../src/game/national/pool';
import { buildTournament, type NtMatch } from '../src/game/national/tournament';
import {
  createRanking, eloDelta, eloK, expected, goalMul, rankHistory, rankingDaily, rankingOf, rankingRows, worldRank, type NatRanking,
} from '../src/game/national/ranking';
import { NATION_BY_CODE, baseStrength, confOf, intlMatchLabel, intlWindowPlan, tournamentsOfYear } from '../src/data/nationalTeams';
import { eloTarget } from '../src/data/eloAnchors';
import { addDaysISO } from '../src/engine/trainingPlan';
import { hashStr, mulberry32, simMatchGoals } from '../src/engine/leagues';

let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const near = (a: number, b: number, eps = 0.01) => Math.abs(a - b) <= eps;
const short = process.argv.includes('kurz');

/** Rangkorrelation (Spearman) zweier Reihenfolgen derselben Codes. */
function spearman(a: string[], b: string[]): number {
  const pos = new Map(b.map((c, i) => [c, i]));
  const n = a.length;
  const d2 = a.reduce((s, c, i) => s + (i - (pos.get(c) ?? i)) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}
const order = (R: NatRanking) => Object.keys(R.pts).sort((x, y) => R.pts[y] - R.pts[x]);
const top = (R: NatRanking, n: number) => order(R).slice(0, n).map((c) => `${c} ${Math.round(R.pts[c])}`).join(', ');

// -----------------------------------------------------------------------------
// 1. Formel
// -----------------------------------------------------------------------------
console.log('— Formel');
ok(near(expected(130), 0.679, 0.001), `We bei dr = 130: ${expected(130).toFixed(3)} (Beispiel 0,679)`);
ok(near(eloDelta(630, 500, 3, 1, 20, 0), 9.63, 0.02), `3:1 im Freundschaftsspiel, neutral, 630 gegen 500: +${eloDelta(630, 500, 3, 1, 20, 0).toFixed(2)} (Beispiel +9,63)`);
ok(goalMul(1) === 1 && goalMul(2) === 1.5 && goalMul(3) === 1.75 && goalMul(10) === 2.625, 'Tordifferenz-Zuschlag 1 / 1,5 / 1,75 / 2,625');
ok(near(eloDelta(1500, 1500, 0, 0, 20, 1), 20 * (0.5 - expected(100))), `Heimvorteil +100: Remis kostet den Gastgeber ${eloDelta(1500, 1500, 0, 0, 20, 1).toFixed(2)}`);
ok(near(eloDelta(1600, 1500, 2, 2, 60, 0, true), 60 * (0.5 - expected(100))), 'Elfmeterschießen = Remis ohne Tordifferenz-Zuschlag');
ok(eloK('WM') === 60 && eloK('EM') === 50 && eloK('WM-Qualifikation') === 40 && eloK('EM-Qualifikation') === 40 && eloK('Nationenliga') === 40 && eloK('Nations League') === 40 && eloK('Freundschaftsspiel') === 20, 'K-Faktor je Spielart 60/50/40/40/40/20');

// -----------------------------------------------------------------------------
// 2. Startreihenfolge
// -----------------------------------------------------------------------------
console.log('— Startreihenfolge');
const R75 = createRanking('1975-07-01');
const o75 = order(R75);
console.log(`  1975 Top 10: ${top(R75, 10)}`);
ok(['GER', 'NED', 'BRA'].every((c) => o75.indexOf(c) < 4), 'Weltmeister 1974, Vize 1974 und Brasilien unter den ersten vier');
ok(o75.indexOf('POL') < 6, `Polen (WM-Dritter 1974) auf Platz ${o75.indexOf('POL') + 1}`);
ok(o75.indexOf('ITA') < 10 && o75.indexOf('ENG') < 10, 'England und Italien in den Top 10');
ok(o75.indexOf('QAT') > 50 && o75.indexOf('FIN') > 50, 'Katar und Finnland weit hinten');
ok(Object.keys(R75.pts).length === activeNations(1975).length, `${Object.keys(R75.pts).length} Nationen 1975 (keine Nachfolgestaaten vor ihrer Gründung)`);
ok(!R75.pts.CRO && R75.pts.YUG && R75.pts.URS && R75.pts.GDR, 'Jugoslawien, UdSSR, DDR dabei, Kroatien noch nicht');
const byBase = Object.keys(R75.pts).sort((a, b) => baseStrength(NATION_BY_CODE[b], 1975) - baseStrength(NATION_BY_CODE[a], 1975));
ok(spearman(o75, byBase) > 0.7, `Rangkorrelation Start 1975 ↔ Grundstärke ${spearman(o75, byBase).toFixed(2)}`);
const R95 = createRanking('1995-07-01'), R25 = createRanking('2025-07-01');
console.log(`  1995 Top 5: ${top(R95, 5)}\n  2025 Top 5: ${top(R25, 5)}`);
ok(order(R95).indexOf('BRA') < 3, 'Brasilien 1995 unter den ersten drei (Weltmeister 1994)');
ok(order(R25).slice(0, 5).includes('ESP') && order(R25).slice(0, 5).includes('ARG'), 'Spanien und Argentinien 2025 in den Top 5');
ok(R95.pts.CRO && R95.pts.RUS && !R95.pts.URS, '1995: Kroatien/Russland statt UdSSR');

// -----------------------------------------------------------------------------
// 3. 20 Saisons nur Länderspiele (Stärke = Grundstärke, wie im Spiel ohne Spieler)
// -----------------------------------------------------------------------------
console.log('— 20 Saisons Länderspiele');
const stub = { calendar: { currentDate: '1975-07-01' } } as unknown as Game;
(stub as any).natRanking = createRanking('1975-07-01');
const st: NationalState = { v: 1, season: '', windows: [], tourn: null, archive: [], away: {} };
const S = (c: string, y: number) => baseStrength(NATION_BY_CODE[c], y);
let urs1991 = 0;
for (let d = '1975-07-01'; d < '1995-06-29'; d = addDaysISO(d, 1)) {
  const y = parseInt(d.slice(0, 4), 10), m = d.slice(5, 10);
  if (m === '07-01') {
    // Saison planen: Fenster am ersten passenden Wochentag, Paarungen im Verband.
    const windows: IntlWindow[] = [];
    for (const w of intlWindowPlan(y)) {
      let first = `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.from).padStart(2, '0')}`;
      while (new Date(`${first}T00:00:00Z`).getUTCDay() !== (w.games === 2 ? 6 : 3)) first = addDaysISO(first, 1);
      const dates = w.games === 2 ? [first, addDaysISO(first, 4)] : [first];
      const nextKind = tournamentsOfYear(y + 1, hostPick)[0]?.kind ?? tournamentsOfYear(y + 2, hostPick)[0]?.kind ?? null;
      const win: IntlWindow = { from: addDaysISO(dates[0], -1), dates, matches: [], label: intlMatchLabel(dates[0], nextKind), squads: {} };
      const r = mulberry32(hashStr(`${dates[0]}|rk`));
      const yy = parseInt(dates[0].slice(0, 4), 10);
      for (const date of dates) {
        const byConf = new Map<string, string[]>();
        for (const n of activeNations(yy)) { const c = confOf(NATION_BY_CODE[n], yy); byConf.set(c, [...(byConf.get(c) ?? []), n]); }
        for (const list of byConf.values()) {
          const l = [...list].sort(() => r() - 0.5);
          for (let i = 0; i + 1 < l.length; i += 2) {
            const res = simMatchGoals(S(l[i], yy), S(l[i + 1], yy), r);
            win.matches.push({ date, stage: win.label, a: l[i], b: l[i + 1], ga: res.home, gb: res.away } as NtMatch);
          }
        }
      }
      windows.push(win);
    }
    st.windows = windows;
  }
  for (const def of tournamentsOfYear(y, hostPick)) {
    if (d === addDaysISO(def.start, -25)) {
      const str = new Map(activeNations(y).map((c) => [c, S(c, y)] as [string, number]));
      st.tourn = buildTournament(def, str, y, def.place);
    }
  }
  (stub as any).calendar.currentDate = d;
  rankingDaily(stub, st, d);
  if (d === '1991-12-01') urs1991 = rankingOf(stub)!.pts.URS ?? 0;
  if (d === '1992-07-01') ok(Math.abs((rankingOf(stub)!.pts.RUS ?? 0) - urs1991) < 60, `Russland übernimmt die Punkte der UdSSR (${Math.round(urs1991)} → ${Math.round(rankingOf(stub)!.pts.RUS ?? 0)})`);
}
const R = rankingOf(stub)!;
console.log(`  1995 Top 10: ${top(R, 10)}`);
const target95 = Object.keys(R.pts).sort((a, b) => eloTarget(b, 1995.5) - eloTarget(a, 1995.5));
const rho = spearman(order(R), target95);
const base95 = Object.keys(R.pts).sort((a, b) => S(b, 1995) - S(a, 1995));
console.log(`  Korrelation zur Grundstärke 1995: ${spearman(order(R), base95).toFixed(2)}`);
ok(rho > 0.7, `nach 20 Saisons: Rangkorrelation zum historischen Richtwert ${rho.toFixed(2)}`);
const t10 = new Set(target95.slice(0, 10));
const hit = order(R).slice(0, 10).filter((c) => t10.has(c)).length;
ok(hit >= 6, `${hit} der 10 historisch Besten 1995 auch in den Top 10`);
const vals = Object.values(R.pts);
ok(vals.every((v) => Number.isFinite(v)) && Math.max(...vals) < 2400 && Math.min(...vals) > 1000, `Punkte im Rahmen ${Math.round(Math.min(...vals))}–${Math.round(Math.max(...vals))}`);
ok(R.pts.CRO && R.pts.UKR && !R.pts.URS && !R.pts.YUG && !R.pts.GDR, 'Nachfolgestaaten in der Liste, UdSSR/Jugoslawien/DDR nicht mehr');
ok(R.hy === 1975 && (R.hist.GER?.length ?? 0) === 20, `Verlauf: ${R.hist.GER?.length} Jahreswerte ab ${R.hy}`);
ok(R.hist.GDR?.filter((x) => x > 0).length === 15 && R.hist.GDR?.[16] === 0, 'DDR im Verlauf bis 1990');
ok(R.ed === '1995-06-01' && Object.keys(R.rk).length === Object.keys(R.pts).length, `Ausgabe vom ${R.ed} mit ${Object.keys(R.rk).length} Nationen`);
const moved = Object.keys(R.rk).filter((c) => R.pr[c] && R.pr[c] !== R.rk[c]).length;
ok(moved > 0, `${moved} Nationen mit ± zur Ausgabe davor`);
const size = JSON.stringify(R).length;
ok(size < 12000, `Speicher der Rangliste ${(size / 1024).toFixed(1)} KB`);
// Verbände bleiben im Rahmen (Drift): Schnitt je Verband nicht weit weg vom Richtwert.
for (const conf of ['UEFA', 'CONMEBOL', 'CAF', 'AFC']) {
  const cs = Object.keys(R.pts).filter((c) => confOf(NATION_BY_CODE[c], 1995) === conf);
  const avg = cs.reduce((a, c) => a + R.pts[c], 0) / cs.length, tgt = cs.reduce((a, c) => a + eloTarget(c, 1995.5), 0) / cs.length;
  ok(Math.abs(avg - tgt) < 80, `${conf}: Schnitt ${Math.round(avg)} gegen Richtwert ${Math.round(tgt)}`);
}

// -----------------------------------------------------------------------------
// 4. echtes Spiel
// -----------------------------------------------------------------------------
if (!short) {
  console.log('— Spielablauf 1975/76');
  const ui: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
  const g = createNewGame({ managedClubId: 'muc', manager: { name: 'T', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
  (g as any).simAutoManage = true;
  const tick = (x: Game) => {
    const went = processDay(x, ui);
    if (!went) { const due = findOwnMatchDue(x); if (due) { quickSimOwnMatch(x, due); processDay(x, ui); } }
  };
  const start = { ...rankingOf(g)!.pts };
  ok(rankingOf(g) && worldRank(g, 'GER')?.rank === createRanking(g.calendar.currentDate).rk.GER, `neues Spiel: Rangliste angelegt, GER Platz ${worldRank(g, 'GER')?.rank}`);
  const t0 = Date.now();
  while (g.calendar.currentDate < '1976-06-26') tick(g);
  console.log(`  … ${g.calendar.currentDate} (${Math.round((Date.now() - t0) / 1000)} s)`);
  const Rg = rankingOf(g)!;
  const nst = nationalState(g);
  const played = new Set(nst.windows.flatMap((w) => w.matches.flatMap((m) => [m.a, m.b])));
  const changed = [...played].filter((c) => Math.abs((Rg.pts[c] ?? 0) - (start[c] ?? 0)) > 0.5).length;
  ok(changed >= played.size * 0.8, `${changed} von ${played.size} Nationen mit Länderspielen haben andere Punkte`);
  const em = nst.archive.find((a) => a.kind === 'EM' && a.year === 1976) ?? (nst.tourn?.kind === 'EM' ? nst.tourn : null);
  ok(em && Rg.seen[(em as any).winner] === 1976 * 12 + 5, `EM 1976 verbucht (Sieger ${(em as any)?.winner})`);
  ok(Rg.ed === '1976-06-01' && Rg.upto === addDaysISO(g.calendar.currentDate, -2), `Ausgabe ${Rg.ed}, verbucht bis ${Rg.upto}`);
  ok(rankingRows(g).length === Object.keys(Rg.pts).length && rankingRows(g)[0].rank === 1, `Liste mit ${rankingRows(g).length} Zeilen, Platz 1 ${rankingRows(g)[0].code}`);
  ok(rankHistory(g, 'GER').length === 2, `Verlauf GER: ${rankHistory(g, 'GER').map(([y, r]) => `${y}: ${r}`).join(', ')}`);
  // Speichern/Laden
  const copy = JSON.parse(JSON.stringify(g)) as Game;
  prepareLoadedGame(copy);
  ok(JSON.stringify(rankingOf(copy)) === JSON.stringify(Rg), 'Speichern/Laden: Rangliste unverändert');
  for (let i = 0; i < 3; i++) { tick(g); tick(copy); }
  ok(JSON.stringify(rankingOf(copy)) === JSON.stringify(rankingOf(g)), 'nach dem Laden gleich weiter');
  // Migration: alter Spielstand ohne Rangliste
  const old = JSON.parse(JSON.stringify(g)) as Game;
  delete (old as any).natRanking;
  prepareLoadedGame(old);
  const Ro = rankingOf(old);
  ok(Ro && Ro.ed === old.calendar.currentDate && Object.keys(Ro.rk).length === Object.keys(Rg.pts).length && Ro.upto === addDaysISO(old.calendar.currentDate, -1),
    `Migration: Rangliste aus den Richtwerten angelegt (${Ro ? top(Ro, 3) : '–'})`);
  // Alter Spielstand nach drei Jahren: Verlauf ab dem Startjahr + Ausgabe davor aus den Richtwerten.
  const R78 = createRanking('1978-12-10', 1975);
  ok(R78.hy === 1975 && (R78.hist.GER ?? []).length === 3 && R78.hist.GER.every((r) => r > 0) && Object.keys(R78.pr).length > 50,
    `Migration 1978: Verlauf 1975–1977 (GER ${(R78.hist.GER ?? []).join('/')}), Ausgabe davor mit ${Object.keys(R78.pr).length} Nationen`);
  const g78 = { calendar: { currentDate: '1978-12-10' }, season: '1978/79' } as unknown as Game;
  const fake = { ...g78, natRanking: R78 } as unknown as Game;
  const h78 = rankHistory(fake, 'GER');
  ok(h78.length === 4 && h78[0][0] === 1975, `Migration 1978: Rangverlauf mit ${h78.length} Punkten`);
}

console.log(fails ? `\n${fails} Fehler.` : '\nWeltrangliste: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
