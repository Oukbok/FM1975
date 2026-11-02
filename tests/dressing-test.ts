// =============================================================================
// Kabine ohne UI: zwei Läufe mit gleichem Zufall über N Saisons (Standard 30)
//   passiv – du greifst nie ein (Vorfälle lösen sich mit der Standardwahl)
//   aktiv  – einfache Trainer-Strategie (Gespräche, Sitzungen, Teamevents,
//            Kapitän/Mannschaftsrat, kluge Antworten auf Vorfälle)
// Prüft: verschiedene Konstellationen über die Jahre, ohne Eingreifen keine
// Dauerkrise, aber gelegentlich schlechte Stimmung (4–8 % Krisentage), mit
// Eingreifen messbar besser, klar verfehlte Saisonziele → deutlich mehr
// Krisen (auch im Gegenversuch mit überzogenem Ziel), sofortige Moral-Sprünge
// nach Spielen/Gesprächen/Transferliste, Moral im Rahmen, Abnutzung von
// Gesprächen/Sitzungen, Nachrüstung alter Spielstände, KI-Moral beweglich.
//   npm run test:dressing [-- saisons]      CLUB=… SEED=… für andere Läufe
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { Game } from '../src/game/state';
import { economyScale, yearOf } from '../src/engine/economy';
import { chooseEventOption } from '../src/game/eventsGame';
import { teamEventDefs, talkOdds, MORALE_STEPS, analyzeRoom, goalFactors } from '../src/engine/dressingRoom';
import {
  appointCaptain, eventState, goalOf, meetingState, migrateDressingRoom, roomAnalysis, roomInputs, roomOf, squadOf, talkState, talkTo, teamEvent, teamMeeting, toggleCouncil,
} from '../src/game/dressingRoomGame';
import { joltsOf } from '../src/game/moraleJolt';

const seasons = Number(process.argv[2] ?? 30);
const SEED = Number(process.env.SEED ?? 1975);
let seed = SEED;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

let fails = 0;
const check = (ok: boolean, what: string) => { console.log(`${ok ? 'OK  ' : 'FEHL'} ${what}`); if (!ok) fails++; };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function newGame(club = process.env.CLUB ?? 'mgl'): Game {
  seed = SEED;
  const g = createNewGame({
    managedClubId: club,
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  (g as any).simAutoManage = true;
  return g;
}

// -----------------------------------------------------------------------------
// Aktive Trainer-Strategie
// -----------------------------------------------------------------------------
function answerIncidents(g: Game): number {
  let n = 0;
  const club = g.clubs[g.managedClubId];
  for (const m of g.messages) {
    const ref = m.eventRef;
    if (!ref || ref.resolved || !ref.type.startsWith('kabine_')) continue;
    const dr = roomOf(club);
    let c = ref.defaultChoice ?? '';
    switch (ref.type) {
      case 'kabine_streit': c = 'schlichten'; break;
      case 'kabine_forderung': c = club.finances.balance > Number(ref.data?.cost ?? 0) * economyScale(yearOf(g.calendar.currentDate)) * 6 ? 'erfuellen' : 'kompromiss'; break;
      case 'kabine_integration': c = m.choices?.some((x) => x.id === 'pate') ? 'pate' : m.choices?.some((x) => x.id === 'sprachkurs') ? 'sprachkurs' : 'zeit'; break;
      case 'kabine_abend': c = 'ja'; break;
      case 'kabine_gruppen': c = 'sitzung'; break;
      case 'kabine_predigt': c = dr.mood < 45 ? 'aufbauen' : 'sachlich'; break;
    }
    chooseEventOption(g, m, c);
    n++;
  }
  return n;
}

const acts = { talks: 0, meetings: 0, events: 0, captain: 0, council: 0, incidents: 0 };
function coach(g: Game): void {
  const today = g.calendar.currentDate;
  const club = g.clubs[g.managedClubId];
  acts.incidents += answerIncidents(g);
  if (new Date(today + 'T00:00:00Z').getUTCDay() !== 1) return; // montags
  const dr = roomOf(club);
  const a = roomAnalysis(g);
  // Kapitän: der einflussreichste Spieler (einmal je Saison prüfen, August).
  if (today.slice(5, 7) === '08' && Number(today.slice(8)) <= 7) {
    const best = [...a.players].sort((x, y) => y.influence - x.influence)[0];
    const capRank = [...a.players].sort((x, y) => y.influence - x.influence).findIndex((o) => o.id === dr.captainId);
    if (best && capRank > 2) { appointCaptain(g, best.id); acts.captain++; }
    for (const id of dr.council ?? []) if ((a.byId[id]?.tier ?? 'aussen') === 'aussen') { toggleCouncil(g, id); acts.council++; }
    for (const o of [...a.players].sort((x, y) => y.influence - x.influence)) {
      if ((dr.council?.length ?? 0) >= 3) break;
      if (o.id !== dr.captainId && !dr.council?.includes(o.id) && o.tier !== 'aussen') { toggleCouncil(g, o.id); acts.council++; }
    }
  }
  // Gespräche: bis zu drei pro Woche mit den Unzufriedensten.
  const unhappy = a.players.filter((o) => o.outsider || o.target < 48).sort((x, y) => x.target - y.target);
  let t = 0;
  for (const o of unhappy) {
    if (t >= 3) break;
    const p = g.players[o.id];
    if (!p || talkState(g, o.id).nextOn) continue;
    const odds = talkOdds('beruhigen', p, o, p.moraleScore ?? 60);
    const kind = odds.chance >= 0.45 ? 'beruhigen' : talkOdds('loben', p, o, p.moraleScore ?? 60).chance >= 0.5 ? 'loben' : null;
    if (!kind) continue;
    talkTo(g, o.id, kind); acts.talks++; t++;
  }
  // In der Krise: die Führungsspieler stärken (ihre Laune trägt die Stimmung).
  if (dr.mood < 45) {
    for (const id of a.leaders) {
      if (t >= 5) break;
      const p = g.players[id];
      if (!p || talkState(g, id).nextOn || (p.moraleScore ?? 60) >= 75) continue;
      talkTo(g, id, talkOdds('loben', p, a.byId[id], p.moraleScore ?? 60).chance >= 0.5 ? 'loben' : 'beruhigen'); acts.talks++; t++;
    }
  }
  const { ctx } = roomInputs(g, club);
  const ms = meetingState(g);
  if (dr.mood < 48 && !ms.nextOn && ms.wear >= 0.6) { teamMeeting(g, 'aufbauen'); acts.meetings++; }
  const defs = teamEventDefs(yearOf(today));
  if (!eventState(g).nextOn && !ctx.offSeason && ((dr.cohesion ?? 60) < 55 || dr.mood < 50 || a.outsiders.length >= 2)) {
    const ev = club.finances.balance > defs[1].cost * economyScale(yearOf(today)) * 8 ? 'ausflug' : 'abend';
    // (ohne Geld sagt der Vorstand nein – dann bleibt es bei Gesprächen und Sitzungen)
    if (teamEvent(g, ev).ok) acts.events++;
  }
}

// -----------------------------------------------------------------------------
// Lauf
// -----------------------------------------------------------------------------
interface SeasonSnap { season: string; mood: number; cohesion: number; outsiders: number; groups: number; langGroups: number; leaders: string; captain: string; lowMorale: number; topGroup: string }
interface SeasonGoal { season: string; goal: string; pos: number; expected: number; size: number; days: number; crisis: number }
interface RunStats { label: string; moods: number[]; morale: number[]; crisisDays: number; longestCrisis: number; snaps: SeasonSnap[]; incidents: number; aiSpread: number[]; minScore: number; maxScore: number; goals: SeasonGoal[] }

function run(active: boolean, opts: { club?: string; n?: number; goal?: string } = {}): RunStats {
  const g = newGame(opts.club);
  const st: RunStats = { label: active ? 'aktiv' : 'passiv', moods: [], morale: [], crisisDays: 0, longestCrisis: 0, snaps: [], incidents: 0, aiSpread: [], minScore: 100, maxScore: 0, goals: [] };
  let streak = 0, lastInc = '';
  for (let s = 0; s < (opts.n ?? seasons); s++) {
    let guard = 0;
    let sDays = 0, sCrisis = 0;
    while (!CalendarEngine.isSeasonOver(g.calendar)) {
      if (opts.goal) g.clubs[g.managedClubId].boardExpectation = opts.goal; // Gegenversuch: überzogenes Ziel
      const t = g.clubs[g.managedClubId]?.tactics;
      if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
      if (active) coach(g);
      processDay(g, HEADLESS_UI);
      const club = g.clubs[g.managedClubId];
      const dr = club.dressingRoom;
      const today = g.calendar.currentDate;
      if (dr) {
        if (dr.lastIncident && dr.lastIncident !== lastInc) { lastInc = dr.lastIncident; st.incidents++; }
        st.moods.push(dr.mood); sDays++;
        if (dr.mood < 35) { st.crisisDays++; sCrisis++; streak++; st.longestCrisis = Math.max(st.longestCrisis, streak); } else streak = 0;
        const sq = squadOf(g, club);
        for (const p of sq) {
          const v = p.moraleScore ?? 60;
          if (!Number.isFinite(v)) throw new Error(`Moral NaN bei ${p.fullName}`);
          st.minScore = Math.min(st.minScore, v); st.maxScore = Math.max(st.maxScore, v);
        }
        st.morale.push(avg(sq.map((p) => p.moraleScore ?? 60)));
        if (today.endsWith('-03-01') && st.snaps[st.snaps.length - 1]?.season !== g.season) {
          const a = roomAnalysis(g);
          const name = (id?: string) => (id ? g.players[id]?.lastName ?? '?' : '-');
          st.snaps.push({
            season: g.season, mood: Math.round(dr.mood), cohesion: a.cohesion, outsiders: a.outsiders.length, groups: a.groups.length,
            langGroups: a.groups.filter((x) => x.id.startsWith('lang-')).length, leaders: a.leaders.map(name).join('/'), captain: name(dr.captainId),
            lowMorale: sq.filter((p) => (p.moraleScore ?? 60) < 41).length, topGroup: [...a.groups].sort((x, y) => y.members.length - x.members.length)[0]?.label ?? '-',
          });
          // KI: Verteilung der Moral-Stufen (Anzahl verschiedener Stufen in der Liga).
          const ai = Object.values(g.clubs).filter((c) => c.id !== club.id && c.playerIds.length).flatMap((c) => c.playerIds.map((id) => g.players[id]?.morale)).filter(Boolean);
          st.aiSpread.push(new Set(ai).size);
        }
      }
      if (++guard > 1000) throw new Error('Saison endet nicht');
    }
    const gl = goalOf(g, g.clubs[g.managedClubId]);
    if (gl) st.goals.push({ season: g.season, goal: gl.label, pos: gl.pos, expected: gl.expected, size: gl.size, days: sDays, crisis: sCrisis });
    startNextSeason(g);
  }
  return st;
}

const t0 = Date.now();
const passive = run(false);
const actsPassive = { ...acts };
const active = run(true);
console.log(`\nLaufzeit ${((Date.now() - t0) / 1000).toFixed(0)} s, ${seasons} Saisons je Lauf\n`);
console.log('Saison   | Stimmung | Zusammenh. | Außens. | Gruppen (Sprache) | Moral<41 | Führung (Kapitän)');
for (const s of passive.snaps) console.log(`${s.season.padEnd(8)} | ${String(s.mood).padStart(8)} | ${String(s.cohesion).padStart(10)} | ${String(s.outsiders).padStart(7)} | ${String(s.groups).padStart(7)} (${s.langGroups})       | ${String(s.lowMorale).padStart(8)} | ${s.leaders} (${s.captain})`);
console.log('\nSaison   | Ziel                         | Platz (Soll) | Krisentage');
for (const x of passive.goals) console.log(`${x.season.padEnd(8)} | ${x.goal.padEnd(28)} | ${String(x.pos).padStart(5)} (${String(x.expected).padStart(2)})   | ${x.crisis} (${(x.crisis / Math.max(1, x.days) * 100).toFixed(0)} %)`);
const summary = (r: RunStats) => `${r.label}: Ø Stimmung ${avg(r.moods).toFixed(1)}, Ø Moral ${avg(r.morale).toFixed(1)}, Krisentage ${(r.crisisDays / Math.max(1, r.moods.length) * 100).toFixed(1)} % (längste ${r.longestCrisis} T.), Ø Außenseiter ${avg(r.snaps.map((s) => s.outsiders)).toFixed(2)}, Moral ${r.minScore.toFixed(0)}–${r.maxScore.toFixed(0)}`;
console.log('\n' + summary(passive));
console.log(summary(active));
console.log(`aktiv: ${acts.talks} Gespräche, ${acts.meetings} Sitzungen, ${acts.events} Teamevents, ${acts.captain} Kapitänswechsel, ${acts.council} Ratsänderungen, ${acts.incidents} Vorfälle beantwortet${actsPassive.talks ? ' (passiv nicht null!)' : ''}\n`);

// --- Konstellationen
const outs = new Set(passive.snaps.map((s) => s.outsiders));
const groupCounts = new Set(passive.snaps.map((s) => s.groups));
const leaderSets = new Set(passive.snaps.map((s) => s.leaders));
check(outs.size >= 3, `verschiedene Außenseiter-Zahlen über die Jahre (${[...outs].sort().join(', ')})`);
check(groupCounts.size >= 2, `verschiedene Gruppenzahlen (${[...groupCounts].sort().join(', ')})`);
check(passive.snaps.some((s) => s.langGroups > 0) || seasons < 20, 'mindestens einmal eine Sprachgruppe');
check(leaderSets.size >= Math.min(5, seasons / 3), `Führungsspieler wechseln über die Jahre (${leaderSets.size} Konstellationen)`);
const moodRange = Math.max(...passive.snaps.map((s) => s.mood)) - Math.min(...passive.snaps.map((s) => s.mood));
check(moodRange >= 10, `Stimmung schwankt zwischen den Saisons (Spanne ${moodRange})`);
// --- Balance ohne Eingreifen
check(avg(passive.moods) >= 50, `ohne Eingreifen läuft die Kabine meist ordentlich (Ø ${avg(passive.moods).toFixed(1)} ≥ 50)`);
const crisisRate = (r: { crisisDays: number; moods: number[] }) => r.crisisDays / Math.max(1, r.moods.length);
check(crisisRate(passive) >= 0.03 && crisisRate(passive) <= 0.1, `ohne Eingreifen gelegentlich schlechte Stimmung: ${(crisisRate(passive) * 100).toFixed(1)} % Krisentage (Ziel 4–8 %, Rahmen 3–10 %)`);
// Klar verfehlte Ziele (mindestens ein Viertel der Liga hinter dem Soll) → deutlich mehr Krisentage.
const missed = (x: SeasonGoal) => x.pos - x.expected >= Math.max(3, x.size / 4);
const rateOf = (xs: SeasonGoal[]) => xs.reduce((a, x) => a + x.crisis, 0) / Math.max(1, xs.reduce((a, x) => a + x.days, 0));
const miss = passive.goals.filter(missed), fine = passive.goals.filter((x) => !missed(x));
console.log(`Saisons mit klar verfehltem Ziel: ${miss.length} (${(rateOf(miss) * 100).toFixed(1)} % Krisentage), übrige ${fine.length} (${(rateOf(fine) * 100).toFixed(1)} %)`);
if (miss.length >= 2) check(rateOf(miss) >= Math.max(0.1, 2 * rateOf(fine)), 'klar verfehlte Saisonziele: deutlich mehr Krisentage');
check(passive.longestCrisis < 120, `keine Dauerkrise (längste ${passive.longestCrisis} Tage < 120)`);
check(passive.incidents >= seasons * 1.5 && passive.incidents <= seasons * 9, `Vorfälle selten, aber vorhanden (${(passive.incidents / seasons).toFixed(1)} je Saison)`);
// --- Eingreifen hilft
check(avg(active.moods) >= avg(passive.moods) + 2, `Eingreifen hebt die Stimmung (+${(avg(active.moods) - avg(passive.moods)).toFixed(1)})`);
check(avg(active.morale) >= avg(passive.morale) + 1, `Eingreifen hebt die Moral (+${(avg(active.morale) - avg(passive.morale)).toFixed(1)})`);
check(active.crisisDays <= passive.crisisDays * 0.6, `mit Eingreifen deutlich weniger Krisentage (${(crisisRate(active) * 100).toFixed(1)} % statt ${(crisisRate(passive) * 100).toFixed(1)} %)`);
// --- Moral im Rahmen
for (const r of [passive, active]) check(avg(r.morale) >= 45 && avg(r.morale) <= 80 && r.minScore >= 0 && r.maxScore <= 100, `${r.label}: Ø Moral ${avg(r.morale).toFixed(1)} im Rahmen 45–80`);
check(avg(passive.aiSpread) >= 3, `KI-Vereine: Moral-Stufen beweglich (Ø ${avg(passive.aiSpread).toFixed(1)} verschiedene Stufen)`);

// --- Gegenversuch: gleicher Verein, überzogenes Ziel „Meisterschaft“ (immer klar verfehlt außer als Spitzenteam)
{
  const club = process.env.HARD_CLUB ?? 'bre';
  const n = Math.min(seasons, 6);
  const base = run(false, { club, n });
  const hard = run(false, { club, n, goal: 'Meisterschaft' });
  const hardAct = run(true, { club, n, goal: 'Meisterschaft' });
  const pos = (r: RunStats) => r.goals.map((x) => x.pos).join('/');
  console.log(`\nGegenversuch ${club} (${n} Saisons, Plätze ${pos(base)}): eigenes Ziel ${(crisisRate(base) * 100).toFixed(1)} % Krisentage, Ziel Meisterschaft ${(crisisRate(hard) * 100).toFixed(1)} %, mit Eingreifen ${(crisisRate(hardAct) * 100).toFixed(1)} %`);
  check(crisisRate(hard) >= Math.max(0.1, crisisRate(base) * 1.8), 'überzogenes Saisonziel → deutlich mehr Krisentage');
  check(crisisRate(hardAct) <= crisisRate(hard) * 0.6, 'auch dann hilft Eingreifen deutlich');
  // Rechnung: gleicher Kader, Ziel klar verfehlt vs. erreicht
  const fs = goalFactors({ label: 'Europa-Pokal-Platz', pos: 15, expected: 4, size: 18, played: 15, dropFrom: 16, winless: 5 });
  const sumF = fs.reduce((a, f) => a + f.value, 0);
  check(sumF <= -25, `Zielverfehlung drückt die Zielstimmung (${fs.map((f) => `${f.label} ${f.value}`).join(', ')})`);
  const early = goalFactors({ label: 'Europa-Pokal-Platz', pos: 15, expected: 4, size: 18, played: 2, dropFrom: 16, winless: 0 });
  check(!early.length, 'nach zwei Spieltagen noch kein Tabellendruck');
}

// --- Sofortige Moral-Sprünge
{
  const g = newGame();
  const club = g.clubs[g.managedClubId];
  let found = false;
  for (let i = 0; i < 200 && !found; i++) {
    const before = new Map(squadOf(g, club).map((p) => [p.id, p.moraleScore ?? 60]));
    processDay(g, HEADLESS_UI);
    const today = g.calendar.currentDate;
    const dr = roomOf(club);
    const js = (dr.jolts ?? []).filter((j) => j.date <= today && /gegen /.test(j.label));
    const recent = js.filter((j) => (Date.parse(today) - Date.parse(j.date)) / 86400000 <= 1);
    if (recent.length >= 8) {
      found = true;
      const j = recent.find((x) => Math.abs(x.value) >= 2) ?? recent[0];
      const p = g.players[j.pid];
      const d = (p.moraleScore ?? 60) - (before.get(j.pid) ?? 60);
      console.log(`\nSprung nach dem Spiel: ${p.lastName} ${j.value > 0 ? '+' : ''}${j.value} „${j.label}“ (Moral ${before.get(j.pid)?.toFixed(1)} → ${p.moraleScore?.toFixed(1)})`);
      check(Math.abs(d - j.value) <= 1.5 || Math.sign(d) === Math.sign(j.value), 'Spiel verändert die Moral sofort');
      check(recent.some((x) => /^(Sieg|Niederlage|Tor|Siegtor|Nicht aufgestellt|Eingewechselt|Nur eingewechselt|Glanzleistung|Schwaches)/.test(x.label)), `Sprünge tragen den Anlass (${[...new Set(recent.map((x) => x.label.split(' ')[0]))].join(', ')})`);
      check(joltsOf(dr, j.pid).length > 0, 'Sprung beim Spieler abrufbar (Anzeige im Fokus)');
      // Ohne neue Ereignisse gleitet die Moral zurück zum Zielwert.
      const a = roomAnalysis(g);
      const gap0 = Math.abs((p.moraleScore ?? 60) - a.byId[p.id].target);
      for (let k = 0; k < 3; k++) processDay(g, HEADLESS_UI);
      const gap1 = Math.abs((p.moraleScore ?? 60) - roomAnalysis(g).byId[p.id].target);
      check(gap1 <= gap0 + 3, `Moral gleitet zurück (Abstand zum Ziel ${gap0.toFixed(1)} → ${gap1.toFixed(1)})`);
    }
  }
  check(found, 'mindestens ein Spiel mit Moral-Sprüngen');
  // Gespräch: sofort
  const p = squadOf(g, club)[5];
  const m0 = p.moraleScore ?? 60;
  talkTo(g, p.id, 'loben', () => 0);
  check((p.moraleScore ?? 60) > m0, `Lob wirkt sofort (${m0.toFixed(1)} → ${(p.moraleScore ?? 60).toFixed(1)})`);
  // Transferliste: sofort am nächsten Tageslauf
  const q = squadOf(g, club).filter((x) => !x.transferListed)[7];
  q.transferListed = true;
  const q0 = q.moraleScore ?? 60;
  processDay(g, HEADLESS_UI);
  const lj = joltsOf(roomOf(club), q.id).find((x) => /Transferliste/.test(x.label));
  check(!!lj && (q.moraleScore ?? 60) < q0, `Transferliste: Sprung ${lj?.value ?? 0} (${q0.toFixed(1)} → ${(q.moraleScore ?? 60).toFixed(1)})`);
  q.transferListed = false;
  // Mood-Faktor sichtbar
  const { xs, ctx } = roomInputs(g, club);
  const scores = Object.fromEntries(xs.map((x) => [x.p.id, x.p.moraleScore ?? 60]));
  const hardCtx = { ...ctx, offSeason: false, goal: { label: 'Meisterschaft', pos: 14, expected: 1, size: 18, played: 14, dropFrom: 16, winless: 4 } };
  const okCtx = { ...ctx, offSeason: false, goal: { label: 'Meisterschaft', pos: 1, expected: 1, size: 18, played: 14, dropFrom: 16, winless: 0 } };
  const dT = analyzeRoom(xs, okCtx, scores).moodTarget - analyzeRoom(xs, hardCtx, scores).moodTarget;
  check(dT >= 20, `Zielstimmung: klar verfehlt vs. erreicht −${dT}`);
}

// --- Abnutzung und Nachrüstung (kleiner Extra-Lauf)
{
  const g = newGame();
  for (let i = 0; i < 70; i++) processDay(g, HEADLESS_UI);
  const club = g.clubs[g.managedClubId];
  const dr = roomOf(club);
  const p = squadOf(g, club)[3];
  const gains: number[] = [];
  for (let i = 0; i < 4; i++) {
    const before = (dr.boosts ?? []).length;
    const r = talkTo(g, p.id, 'loben', () => 0);
    const b = (dr.boosts ?? []).slice(before).find((x) => x.pid === p.id);
    gains.push(r.ok && b ? b.value : 0);
    g.calendar.currentDate = CalendarEngine.addDays(g.calendar.currentDate, 11);
  }
  check(gains[0] > 0 && gains[1] < gains[0] && gains[3] < gains[1], `Gespräche nutzen sich ab (${gains.map((x) => x.toFixed(1)).join(' → ')})`);
  talkTo(g, p.id, 'beruhigen');
  const again = talkTo(g, p.id, 'loben');
  check(!again.ok, `Abklingzeit greift („${again.text}“)`);
  const vals: number[] = [];
  for (let i = 0; i < 3; i++) {
    const before = (dr.boosts ?? []).length;
    teamMeeting(g, 'aufbauen', () => 0);
    vals.push((dr.boosts ?? []).slice(before).filter((b) => b.pid === '*').reduce((s, b) => s + b.value, 0));
    g.calendar.currentDate = CalendarEngine.addDays(g.calendar.currentDate, 15);
  }
  check(vals[2] < 0, `Sitzungs-Spam schadet (${vals.map((x) => x.toFixed(1)).join(' → ')})`);
  // Alter Spielstand: ohne Kabine und ohne Moral-Zahl
  delete club.dressingRoom;
  for (const q of Object.values(g.players)) delete q.moraleScore;
  const json = JSON.parse(JSON.stringify(g)) as Game;
  migrateDressingRoom(json); migrateDressingRoom(json);
  const c2 = json.clubs[json.managedClubId];
  check(!!c2.dressingRoom && squadOf(json, c2).every((q) => typeof q.moraleScore === 'number' && MORALE_STEPS.includes(q.morale)), 'Nachrüstung alter Spielstand (idempotent)');
  for (let i = 0; i < 10; i++) processDay(json, HEADLESS_UI);
  check(squadOf(json, c2).every((q) => Number.isFinite(q.moraleScore!)), 'nach Nachrüstung läuft der Tagesablauf');
}

console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
