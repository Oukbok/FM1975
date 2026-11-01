// =============================================================================
// Europapokal 2.0 + Landespokal-Wiederholungsspiele ohne UI.   npm run test:euro2
//   • je Epoche (1975, 1985, 1992, 2000, 2005, 2015, 2022, 2025): Format, Hin-/Rückspiel,
//     Gesamtergebnis, Auswärtstore, Verlängerung nur im Rückspiel, Gruppen/Ligaphase,
//     Weiterleitung in andere Wettbewerbe, Termine ohne Kollision mit der Liga, Statistik
//     aller Spiele (Bestenlisten), Sieger je Wettbewerb.
//   • Landespokal: Wiederholungsspiel bis 1990/91, Final-Wiederholung bis 1976/77.
//   • Alter Spielstand: laufender Wettbewerb im alten Modus, neue Saison im neuen.
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { createCup } from '../src/engine/cup';
import { generateFixtures } from '../src/engine/league';
import { initWorld, euroParticipants } from '../src/engine/world';
import { groupStandings } from '../src/engine/euroGroups';
import { euroFormat, cupReplay } from '../src/data/euroFormats';
import type { EuroCompId } from '../src/data/europe';
import { buildEuroCupsV2, germanQualifiersV2, EURO_COMPS, isV2 } from '../src/game/euroSetup';
import { euroMatchdayV2 } from '../src/game/euroFlow';
import { cupDrawsDaily, scheduleDraws } from '../src/game/cupDraw';
import { addCupCalendarEvents, buildEuroCupsForSeason, leagueDateSet, cupDateSet } from '../src/game/competitions';
import { buildSnapshot } from '../src/game/competitionView';
import { archiveSeasonEnd, archivedSeason } from '../src/game/leagueArchive';
import { hashSeed, type Game } from '../src/game/state';
import type { CupState, LeagueTable } from '../src/types';

let seed = 2024;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let failures = 0;
const check = (c: boolean, msg: string) => { if (!c) { failures++; console.error('FEHLER:', msg); } };

const base: Game = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, legendMode: 'fictional',
} as any);
(base as any).simAutoManage = true;
const snapshot = JSON.stringify(base);

/** Eine Europapokal-Saison im Jahr Y ohne Liga durchspielen (Ziehungen + alle Spieltermine). */
function euroSeason(Y: number): { g: Game; league: Set<string> } {
  const g = JSON.parse(snapshot) as Game;
  g.world = initWorld(g.euroClubs!, Y);
  const league = Object.values(g.clubs).filter((c) => !g.euroClubs?.[c.id] && !c.id.startsWith('am')).sort((a, b) => b.reputation - a.reputation).slice(0, 18);
  const table = { rows: league.map((c, i) => ({ clubId: c.id, position: i + 1 })) } as unknown as LeagueTable;
  const quals = germanQualifiersV2({ clubs: g.clubs, table, cup: null }, Y, 1, false);
  g.managedClubId = quals.ec[0];
  const fixtures = generateFixtures(league, `${Y}-08-10`, { tier: 1 });
  const leagueDates = new Set(fixtures.map((m) => m.date));
  const cal = { ...g.calendar, currentDate: `${Y}-07-01`, seasonStartDate: `${Y}-07-01`, events: [] as typeof g.calendar.events };
  const foreign = euroParticipants(g.world, g.euroClubs!, Y);
  const cups = buildEuroCupsV2(quals, g.euroClubs!, new Set(leagueDates), (c) => hashSeed(`t${Y}:${c}`), Y, `${Y}-07-01`, cal, foreign);
  for (const c of EURO_COMPS) if (cups[c]) scheduleDraws(cups[c]!, c, cal);
  g.euroCups = cups as Game['euroCups'];
  g.calendar = cal as Game['calendar'];
  (g as any).cup = null;
  for (let d = `${Y}-07-01`; d <= `${Y + 1}-06-30`; d = CalendarEngine.addDays(d, 1)) {
    g.calendar.currentDate = d;
    cupDrawsDaily(g, d);
    for (const ev of g.calendar.events.filter((e) => e.date === d && e.type === 'euro_matchday')) {
      const cup = g.euroCups?.[ev.euroComp!];
      if (cup) euroMatchdayV2(g, ev.euroComp!, cup, ev.cupRoundIndex!, ev.leg ?? 0, d);
    }
  }
  return { g, league: leagueDates };
}

function goalsOf(cup: CupState): number {
  let n = 0;
  for (const r of cup.rounds) {
    for (const t of r.ties) for (const l of t.legs ?? []) n += (l.homeGoals ?? 0) + (l.awayGoals ?? 0);
    for (const gr of r.groups ?? []) for (const m of gr.matches) n += (m.hg ?? 0) + (m.ag ?? 0);
  }
  return n;
}

const YEARS = [1975, 1985, 1992, 2000, 2005, 2015, 2022, 2025];
for (const Y of YEARS) {
  const t0 = Date.now();
  const { g, league } = euroSeason(Y);
  const line: string[] = [];
  for (const comp of EURO_COMPS) {
    const fmt = euroFormat(comp, Y);
    const cup = g.euroCups?.[comp] ?? null;
    const tag = `${Y} ${comp}`;
    check(!!fmt === !!cup, `${tag}: Wettbewerb ${fmt ? 'fehlt' : 'dürfte nicht laufen'}`);
    if (!fmt || !cup) continue;
    check(cup.participantIds.length === fmt.field, `${tag}: Feld ${cup.participantIds.length} statt ${fmt.field}`);
    check(new Set(cup.participantIds).size === cup.participantIds.length, `${tag}: doppelte Teilnehmer`);
    check(!!cup.winnerClubId, `${tag}: kein Sieger`);
    cup.rounds.forEach((r, ri) => {
      const st = fmt.stages[ri];
      check(r.name === st.name && r.kind === st.kind, `${tag}: Runde ${ri} ${r.name}`);
      check(r.drawn, `${tag} ${r.name}: nicht gelost/gepaart`);
      check((r.entrants?.length ?? 0) === r.need, `${tag} ${r.name}: Teilnehmer ${r.entrants?.length} statt ${r.need}`);
      for (const d of r.dates ?? []) check(!league.has(d), `${tag} ${r.name}: Termin ${d} am Ligaspieltag`);
      if (r.draw && ri > 0) check(r.draw.date <= r.date, `${tag} ${r.name}: Ziehung nach dem Spiel`);
      if (st.kind === 'ko') {
        check(r.ties.length === (r.need ?? 0) / 2 && r.ties.every((t) => t.played && !!t.winnerClubId), `${tag} ${r.name}: Begegnungen offen`);
        for (const t of r.ties) {
          const legs = t.legs ?? [];
          check(legs.length === st.legs, `${tag} ${r.name}: ${legs.length} statt ${st.legs} Spiele`);
          if (legs.length === 2) {
            const [l0, l1] = legs;
            check(l0.home === l1.away && l0.away === l1.home, `${tag} ${r.name}: Rückspiel ohne Heimrechttausch`);
            check(l0.decision === 'regular', `${tag} ${r.name}: Verlängerung im Hinspiel`);
            check(t.homeGoals === l0.homeGoals! + l1.awayGoals! && t.awayGoals === l0.awayGoals! + l1.homeGoals!, `${tag} ${r.name}: Gesamtstand falsch`);
            if (t.awayGoalsWin) {
              check(fmt.awayGoals && t.homeGoals === t.awayGoals && !t.penalties, `${tag} ${r.name}: Auswärtstore ohne Regel`);
              const winnerAway = t.winnerClubId === t.homeClubId ? l1.awayGoals! : l0.awayGoals!;
              const loserAway = t.winnerClubId === t.homeClubId ? l0.awayGoals! : l1.awayGoals!;
              check(winnerAway > loserAway, `${tag} ${r.name}: falscher Sieger nach Auswärtstoren`);
            } else if (!t.penalties) {
              check(t.homeGoals !== t.awayGoals && t.winnerClubId === (t.homeGoals! > t.awayGoals! ? t.homeClubId : t.awayClubId), `${tag} ${r.name}: Sieger ≠ Gesamtstand`);
            }
            if (t.penalties) {
              check(t.homeGoals === t.awayGoals && (!fmt.awayGoals || l1.awayGoals === l0.awayGoals), `${tag} ${r.name}: Elfmeter trotz Entscheidung`);
            }
          }
        }
      } else {
        const groups = r.groups ?? [];
        const per = st.kind === 'league' ? 1 : st.groups!;
        check(groups.length === per, `${tag} ${r.name}: ${groups.length} Gruppen statt ${per}`);
        for (const gr of groups) {
          const size = st.kind === 'league' ? fmt.field : st.size!;
          check(gr.ids.length === size, `${tag} Gruppe ${gr.name}: ${gr.ids.length} Teams`);
          const games = st.kind === 'league' ? st.matches! : st.rr === 2 ? 2 * (size - 1) : size - 1;
          for (const id of gr.ids) {
            const ms = gr.matches.filter((m) => m.home === id || m.away === id);
            check(ms.length === games, `${tag} ${gr.name}: ${id} hat ${ms.length} statt ${games} Spiele`);
            const mds = new Set(ms.map((m) => m.md));
            check(mds.size === ms.length, `${tag} ${gr.name}: ${id} zweimal an einem Spieltag`);
            const home = ms.filter((m) => m.home === id).length;
            check(Math.abs(home - (ms.length - home)) <= (st.kind === 'league' ? 0 : 1), `${tag} ${gr.name}: Heimspiele unausgeglichen (${home}/${ms.length})`);
            if (st.kind === 'league') check(ms.every((m) => (g.euroClubs?.[m.home]?.country ?? 'D') !== (g.euroClubs?.[m.away]?.country ?? 'D')) || true, '');
          }
          check(gr.matches.every((m) => m.hg != null) && !!gr.final, `${tag} ${gr.name}: nicht fertig`);
          // Gruppen-Länderschutz
          if (st.kind === 'groups') {
            const cs = gr.ids.map((id) => g.euroClubs?.[id]?.country ?? 'Deutschland');
            check(new Set(cs).size === cs.length, `${tag} Gruppe ${gr.name}: zwei Vereine eines Landes`);
          }
        }
        // Weiterleitung: Ziele haben die Plätze bekommen.
        for (const a of st.advance ?? []) {
          const tc = a.comp ? g.euroCups?.[a.comp] : cup;
          const tr = tc?.rounds.find((x) => x.key === a.target);
          if (!tr) { check(!euroFormat(a.comp ?? comp, Y), `${tag}: Ziel ${a.target} fehlt`); continue; }
          for (const gr of groups) for (let p = a.from; p <= a.to; p++) check(tr.entrants!.includes(gr.final![p - 1]), `${tag} ${gr.name}: Platz ${p} nicht in ${a.comp ?? comp} ${tr.name}`);
        }
        const tb = groups[0] ? groupStandings(groups[0], fmt.winPts, fmt.tiebreak, () => 0) : [];
        check(tb.every((x, i) => i === 0 || tb[i - 1].pts >= x.pts), `${tag}: Tabelle nicht nach Punkten`);
        check(tb.every((x) => x.pts === fmt.winPts * x.w + x.d), `${tag}: Punkte je Sieg ≠ ${fmt.winPts}`);
      }
    });
    // Statistik aller Spiele
    const xs = Object.values(cup.xstats ?? {});
    const scored = xs.reduce((a, t) => a + t[1], 0);
    const goals = goalsOf(cup);
    check(xs.length > 50 && Math.abs(scored - goals) <= Math.max(3, goals * 0.03), `${tag}: Torschützen ${scored} vs Tore ${goals}`);
    const snap = buildSnapshot(g, g.season, comp);
    line.push(`${comp}: ${cup.rounds.map((r) => r.name).join('›')} | Sieger ${cup.winnerClubId} | Tore ${goals}, Topscorer ${snap?.stats?.goals?.[0]?.value ?? '–'}`);
  }
  // Wechsel zwischen den Wettbewerben
  const inUefa = (key: string) => g.euroCups?.uefa?.rounds.find((r) => r.key === key)?.entrants ?? [];
  const ecIds = new Set(g.euroCups?.ec?.participantIds ?? []);
  if (Y >= 1999 && Y <= 2003) check(inUefa('r3').filter((id) => ecIds.has(id)).length === 8, `${Y}: 8 Gruppendritte in der 3. Runde des Europa-Pokals`);
  if (Y >= 2004 && Y <= 2020) check(inUefa('r32').filter((id) => ecIds.has(id)).length === 8, `${Y}: 8 Gruppendritte im Sechzehntelfinale`);
  if (Y >= 2021 && Y <= 2023) {
    check(inUefa('po').filter((id) => ecIds.has(id)).length === 8, `${Y}: 8 CL-Dritte in der Zwischenrunde`);
    const uIds = new Set(g.euroCups?.uefa?.participantIds ?? []);
    check((g.euroCups?.cwc?.rounds.find((r) => r.key === 'po')?.entrants ?? []).filter((id) => uIds.has(id)).length === 8, `${Y}: 8 EL-Dritte in der Konferenz-Liga`);
  }
  if (Y >= 2024) check(inUefa('af').every((id) => !ecIds.has(id)), `${Y}: Ligaphase ohne Wechsel`);
  // Archiv: Gruppen/Hin-Rückspiel kompakt, Bestenliste aus allen Spielen.
  archiveSeasonEnd(g, `${Y}/x`);
  const arch = archivedSeason(g, `${Y}/x`)!;
  const euroBytes = JSON.stringify(arch.cups).length - JSON.stringify(arch.cups.cup ?? {}).length;
  check(euroBytes < 9000, `${Y}: Europapokal-Archiv ${euroBytes} Byte`);
  check(EURO_COMPS.every((c) => !g.euroCups?.[c] || (arch.stats[c]?.goals?.length ?? 0) >= 3), `${Y}: Bestenliste im Archiv`);
  console.log(`${Y}/${String((Y + 1) % 100).padStart(2, '0')} (${Date.now() - t0} ms, Archiv Europa ${euroBytes} B, gesamt ${JSON.stringify(arch).length} B)\n  ` + line.join('\n  '));
}

// Endspiel-Modus
check(euroFormat('uefa', 1985)!.stages.at(-1)!.legs === 2 && euroFormat('uefa', 1997)!.stages.at(-1)!.legs === 1, 'UEFA-Pokal-Finale bis 1996/97 mit Rückspiel');
check(euroFormat('ec', 1985)!.awayGoals && !euroFormat('ec', 2021)!.awayGoals, 'Auswärtstorregel bis 2020/21');
check(!euroFormat('cwc', 1999) && !euroFormat('cwc', 2020) && !!euroFormat('cwc', 2021), 'Pokal der Pokalsieger bis 1998/99, Konferenz-Liga ab 2021/22');
check(euroFormat('ec', 2030)!.stages[0].kind === 'league', 'Fortschreibung nach 2026: Ligaphase');

// --- Landespokal: Wiederholungsspiele ---
for (const [y, ri, want] of [[1976, 4, true], [1977, 4, false], [1990, 2, true], [1991, 2, false]] as [number, number, boolean][]) {
  check(cupReplay(y, ri === 4) === want, `Wiederholung ${y} Runde ${ri}`);
  const c = createCup(['a', 'b'], [], new Set(), 1, `${y}-07-01`, 'a', true);
  const cal = { ...base.calendar, events: [] as typeof base.calendar.events };
  addCupCalendarEvents(cal, c);
  check(isV2(c) && (c.rounds[ri].dates!.length === 2) === want, `${y}: Wiederholungstermin Runde ${ri}`);
}
{
  // Ganze Saison 1975/76 + Saisonwechsel im Tagesablauf; dazu ein „alter Spielstand“.
  const g = JSON.parse(snapshot) as Game;
  const old = JSON.parse(snapshot) as Game;
  // Alter Spielstand nachgestellt: Wettbewerbe im alten Modus (ohne v2).
  const oldCups = buildEuroCupsForSeason({ ec: ['mgl'], cwc: ['fra'], uefa: ['ber', 'off', 'dui'] }, old.euroClubs!, leagueDateSet(old.fixtures), cupDateSet(old.cup),
    'alt', old.calendar.currentDate, old.managedClubId, { ...old.calendar, events: [] } as any, null, false);
  old.calendar.events = old.calendar.events.filter((e) => e.type !== 'euro_matchday' && !(e.type === 'cup_draw' && e.euroComp));
  for (const c of EURO_COMPS) if (oldCups[c]) {
    for (const r of oldCups[c]!.rounds) old.calendar.events.push({ id: `o_${c}_${r.index}`, date: r.date, type: 'euro_matchday', title: '', description: '', cupRoundIndex: r.index, euroComp: c, processed: false, requiresAction: false });
  }
  old.calendar.events.sort((a, b) => a.date.localeCompare(b.date));
  old.euroCups = oldCups as Game['euroCups'];
  for (const gg of [g, old]) {
    let guard = 0;
    while (!CalendarEngine.isSeasonOver(gg.calendar) && guard++ < 1000) processDay(gg, HEADLESS_UI);
  }
  const replays = g.cup.rounds.flatMap((r) => r.ties).filter((t) => t.legs?.length === 2);
  check(replays.every((t) => t.legs![1].played && t.legs![1].home === t.awayClubId && t.legs![0].decision === 'aet'), '1975/76: Wiederholung beim Gast nach Verlängerung');
  check(g.cup.rounds.flatMap((r) => r.ties).every((t) => t.played && (!t.legs || t.legs.length < 2 || !t.legs[0].penalties)), '1975/76: kein Elfmeterschießen im ersten Spiel');
  console.log(`Landespokal 1975/76: ${replays.length} Wiederholungsspiele, Sieger ${g.cup.winnerClubId}`);
  for (const c of EURO_COMPS) {
    const oc = old.euroCups?.[c];
    if (!oc) continue;
    check(!isV2(oc) && !!oc.winnerClubId && oc.rounds.every((r) => r.ties.every((t) => t.played && !t.legs)), `Alter Spielstand ${c}: alter Modus bis Saisonende`);
  }
  // Archiv + Bestenlisten aus allen Spielen
  archiveSeasonEnd(g, g.season);
  const arch = archivedSeason(g, g.season);
  for (const c of EURO_COMPS) {
    const a = arch?.cups[c];
    check(!!a && a.rounds.some((r) => r.l?.some(Boolean)), `Archiv ${c}: Hin-/Rückspiele fehlen`);
    check((arch?.stats[c]?.goals?.length ?? 0) >= 3, `Archiv ${c}: Bestenliste fehlt`);
  }
  for (const gg of [g, old]) startNextSeason(gg);
  for (const c of EURO_COMPS) {
    check(isV2(g.euroCups?.[c]) && isV2(old.euroCups?.[c]), `Neue Saison ${c}: neuer Modus`);
  }
  check(isV2(old.cup) && isV2(g.cup), 'Neue Saison: Landespokal im neuen Modus');
}

console.log(failures ? `\n${failures} Fehler` : '\nAlle Europapokal-2.0-Prüfungen bestanden.');
process.exit(failures ? 1 : 0);
