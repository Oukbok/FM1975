// =============================================================================
// KABINE — Spielablauf: täglicher Lauf, KI-Vereine, Trainer-Aktionen
// -----------------------------------------------------------------------------
// Rechnung in engine/dressingRoom.ts, Vorfälle mit Entscheidung in
// game/dressingRoomEvents.ts, Seite views/kader/DressingRoomView.tsx.
//   • eigener Verein, täglich: Moral 0–100 folgt dem Zielwert (8 %/Tag), die
//     Stufe `Player.morale` (wirkt in der Match-Engine) wird daraus abgeleitet;
//     Teamstimmung folgt ihrem Zielwert (6 %/Tag).
//   • KI-Vereine, sonntags: Stimmung aus den letzten Ergebnissen, Moral-Stufen
//     wandern mit 30 % Wahrscheinlichkeit eine Stufe Richtung Ziel.
//   • Aktionen: Einzelgespräch (Abklingzeit 10 Tage, nutzt sich ab),
//     Mannschaftssitzung (14 Tage), Teamevent (30 Tage, kostet Geld),
//     Kapitän und Mannschaftsrat bestimmen.
// =============================================================================
import {
  DRAnalysis, DRBoost, DRContext, DRPlayerIn, DressingRoomState, TalkKind, TALK_LABEL, TeamEventKind,
  aiMoodTarget, aiMoraleStep, analyzeRoom, boostNow, languageBarrier, moraleScoreOf, moraleStepOf, MORALE_STEPS, stepRange, talkOdds, teamEventDefs,
} from '../engine/dressingRoom';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { personaOf } from '../engine/persona';
import { Club, Player } from '../types';
import { yearsAtClub } from './playerWishesGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const days = (a: string, b: string) => (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000;

export const TALK_COOLDOWN = 10;
export const MEETING_COOLDOWN = 14;
export const EVENT_COOLDOWN = 30;

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
export function roomOf(club: Club): DressingRoomState {
  if (!club.dressingRoom || club.dressingRoom.v !== 1) club.dressingRoom = { v: 1, mood: 58 };
  return club.dressingRoom;
}

export function squadOf(g: Game, club: Club): Player[] {
  return club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.isYouth);
}

export function addBoost(dr: DressingRoomState, pid: string, value: number, label: string, date: string, half = 30): void {
  (dr.boosts ??= []).push({ pid, value: Math.round(value * 10) / 10, label, date, half });
}

export function logRoom(dr: DressingRoomState, date: string, text: string): void {
  (dr.log ??= []).unshift({ date, text });
  if (dr.log.length > 14) dr.log.length = 14;
}

function hasFlag(dr: DressingRoomState, f: string) { return !!dr.flags?.includes(f); }
export function setFlag(dr: DressingRoomState, f: string) { if (!hasFlag(dr, f)) { (dr.flags ??= []).push(f); if (dr.flags.length > 200) dr.flags.splice(0, dr.flags.length - 200); } }

// -----------------------------------------------------------------------------
// Eingaben für die Rechnung
// -----------------------------------------------------------------------------
function ownLeague(g: Game, clubId: string) {
  const played = g.fixtures.filter((m) => m.result && (m.homeClubId === clubId || m.awayClubId === clubId));
  return { played: played.length, last: played.reduce((a, m) => (m.date > a ? m.date : a), '') };
}

export function roomInputs(g: Game, club: Club, today = g.calendar.currentDate): { xs: DRPlayerIn[]; ctx: DRContext } {
  const dr = roomOf(club);
  const squad = squadOf(g, club);
  const byOvr = [...squad].sort((a, b) => b.overall - a.overall);
  const rank = new Map(byOvr.map((p, i) => [p.id, i + 1]));
  const top = byOvr.slice(0, 18);
  const squadAvg = top.reduce((a, p) => a + p.overall, 0) / Math.max(1, top.length);
  const lg = ownLeague(g, club.id);
  const offSeason = lg.played < 3 || !lg.last || days(lg.last, today) > 18;
  const row = g.table.rows.find((r) => r.clubId === club.id);
  const form = row?.form ?? [];
  const ppg = form.length ? form.reduce((a, r) => a + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / form.length : null;
  const yearAgo = CalendarEngine.addDays(today, -400);
  const xs: DRPlayerIn[] = squad.map((p) => {
    const years = yearsAtClub(p, today);
    const help = (hasFlag(dr, `pate:${p.id}`) ? 0.5 : 1) * (hasFlag(dr, `kurs:${p.id}`) ? 0.6 : 1);
    const peers = squad.filter((o) => o.id !== p.id && Math.abs(o.overall - p.overall) <= 3).map((o) => o.contract.weeklyWage).sort((a, b) => a - b);
    const med = peers.length >= 2 ? peers[peers.length >> 1] : 0;
    const ratio = med > 0 ? p.contract.weeklyWage / med : 1;
    return {
      p, years, rank: rank.get(p.id) ?? 99,
      share: clamp((p.development.recentMinutes ?? 0) / 600, 0, 1.5),
      barrier: languageBarrier(p, years, help),
      captain: dr.captainId === p.id,
      council: !!dr.council?.includes(p.id),
      brokenPromise: !!p.promises?.some((x) => x.result === 'broken' && x.madeOn >= yearAgo),
      deniedMove: !!dr.denied?.some((d) => d.pid === p.id && days(d.date, today) <= 240),
      wageGap: clamp((0.65 - ratio) / 0.35, 0, 1),
    };
  });
  return { xs, ctx: { today, year: yearOf(today), offSeason, squadAvg, mood: dr.mood, ppg, boosts: dr.boosts ?? [], conflicts: dr.conflicts ?? [] } };
}

/** Analyse der Kabine des eigenen Vereins (für Seite und Tageslauf). */
export function roomAnalysis(g: Game, club = g.clubs[g.managedClubId]): DRAnalysis {
  const { xs, ctx } = roomInputs(g, club);
  const scores: Record<string, number> = {};
  for (const x of xs) scores[x.p.id] = x.p.moraleScore ?? moraleScoreOf(x.p.morale);
  return analyzeRoom(xs, ctx, scores);
}

// -----------------------------------------------------------------------------
// Täglicher Lauf (eigener Verein) + KI sonntags
// -----------------------------------------------------------------------------
export function migrateDressingRoom(g: Game): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const dr = roomOf(club);
  for (const p of squadOf(g, club)) if (typeof p.moraleScore !== 'number' || !Number.isFinite(p.moraleScore)) p.moraleScore = moraleScoreOf(p.morale);
  dr.seen ??= club.playerIds.slice();
  dr.cohesion ??= 60;
  ensureLeadership(g, club);
}

function prune(dr: DressingRoomState, today: string): void {
  dr.boosts = (dr.boosts ?? []).filter((b) => Math.abs(boostNow(b, today)) >= 0.3);
  dr.conflicts = (dr.conflicts ?? []).filter((c) => c.until >= today);
  const recent = (xs: string[] | undefined, n: number) => (xs ?? []).filter((d) => days(d, today) <= n);
  for (const k of Object.keys(dr.talks ?? {})) { dr.talks![k] = recent(dr.talks![k], 120); if (!dr.talks![k].length) delete dr.talks![k]; }
  dr.meetings = recent(dr.meetings, 120);
  dr.events = recent(dr.events, 180);
  dr.denied = (dr.denied ?? []).filter((d) => days(d.date, today) <= 300);
}

/** Fremde Stufenwechsel (Ereignisse, Trainingslager, Versprechen …) als abklingenden Faktor übernehmen. */
function syncExternal(dr: DressingRoomState, p: Player, today: string, isNew: boolean): void {
  if (isNew || typeof p.moraleScore !== 'number' || !Number.isFinite(p.moraleScore)) { p.moraleScore = moraleScoreOf(p.morale); return; }
  const was = moraleStepOf(p.moraleScore);
  if (was === p.morale) return;
  const d = MORALE_STEPS.indexOf(p.morale) - MORALE_STEPS.indexOf(was);
  addBoost(dr, p.id, d * 14, d > 0 ? 'Positives Erlebnis (siehe Nachrichten)' : 'Rückschlag (siehe Nachrichten)', today, 30);
  const [lo, hi] = stepRange(p.morale);
  p.moraleScore = clamp(p.moraleScore + d * 14, lo, hi);
}

function captureDeniedWishes(g: Game, dr: DressingRoomState, club: Club, today: string): void {
  for (const m of g.messages) {
    const ref = m.eventRef;
    if (!ref || ref.type !== 'ai_offer' || !ref.resolved || !ref.playerId || Number(ref.data?.wish ?? 0) !== 1) continue;
    if (hasFlag(dr, `m:${m.id}`)) continue;
    setFlag(dr, `m:${m.id}`);
    const p = g.players[ref.playerId];
    if (p && p.clubId === club.id && ref.resolved !== 'annehmen') (dr.denied ??= []).push({ pid: p.id, date: today });
  }
}

function checkPledges(g: Game, dr: DressingRoomState, today: string): void {
  const keep: typeof dr.pledges = [];
  for (const pl of dr.pledges ?? []) {
    const p = g.players[pl.pid];
    if (!p || p.clubId !== g.managedClubId) continue;
    const starts = p.seasonStats?.starts ?? 0;
    if (starts < pl.starts0) pl.starts0 = 0;
    if (starts >= pl.starts0 + 2) { addBoost(dr, p.id, 4, 'Zusage eingehalten', today, 45); continue; }
    if (today > pl.until) {
      addBoost(dr, p.id, -10, 'Zusage nicht eingehalten', today, 60);
      g.promiseTrust = clamp((g.promiseTrust ?? 70) - 5, 0, 100);
      logRoom(dr, today, `${p.lastName}: Einsatz versprochen, aber nicht gespielt.`);
      pushMessage(g.messages, makeMessage({
        date: today, category: 'contract', from: p.fullName, subject: `${p.lastName}: „Du hattest mir Einsätze versprochen“`,
        shortText: 'Die Zusage aus dem Einzelgespräch wurde nicht eingehalten.',
        bodyText: `${p.fullName} hat in den vier Wochen nach eurem Gespräch keine zwei Spiele von Beginn an bestritten. Seine Moral leidet, und deine Glaubwürdigkeit sinkt (jetzt ${g.promiseTrust}).`,
        relatedId: p.id,
      }));
      continue;
    }
    keep.push(pl);
  }
  dr.pledges = keep;
}

/** Ernannter Kapitän muss im Kader sein, sonst übernimmt die Binde aus der Aufstellung (bzw. der Führungsstärkste). */
export function ensureLeadership(g: Game, club: Club, today = g.calendar.currentDate): void {
  const dr = roomOf(club);
  const squad = squadOf(g, club);
  if (!dr.captainId || !squad.some((p) => p.id === dr.captainId)) {
    const t = club.tactics?.captainId;
    const pick = squad.find((p) => p.id === t) ?? [...squad].sort((a, b) => (b.attributes.leadership ?? 0) - (a.attributes.leadership ?? 0))[0];
    dr.captainId = pick?.id; dr.captainSince = today;
  }
  dr.council = (dr.council ?? []).filter((id) => id !== dr.captainId && squad.some((p) => p.id === id));
}

/** Eigener Verein: täglich. Rückgabe = aktuelle Analyse (für Vorfälle). */
export function dressingRoomDaily(g: Game, today: string): DRAnalysis | null {
  const club = g.clubs[g.managedClubId];
  if (!club) return null;
  const dr = roomOf(club);
  const squad = squadOf(g, club);
  if (squad.length < 11) return null;
  prune(dr, today);
  const seen = new Set(dr.seen ?? squad.map((p) => p.id));
  for (const p of squad) syncExternal(dr, p, today, !seen.has(p.id));
  dr.seen = club.playerIds.slice();
  captureDeniedWishes(g, dr, club, today);
  ensureLeadership(g, club, today);
  checkPledges(g, dr, today);
  const a = roomAnalysis(g, club);
  for (const p of squad) {
    const o = a.byId[p.id];
    if (!o) continue;
    const s = p.moraleScore ?? moraleScoreOf(p.morale);
    p.moraleScore = Math.round((s + (o.target - s) * 0.08) * 10) / 10;
    p.morale = moraleStepOf(p.moraleScore);
  }
  dr.mood = Math.round((dr.mood + (a.moodTarget - dr.mood) * 0.06) * 10) / 10;
  dr.cohesion = a.cohesion;
  rallyIfStuck(g, dr, a, today);
  if (today.slice(8) === '01') {
    (dr.history ??= []).push({ date: today, mood: Math.round(dr.mood), cohesion: a.cohesion, outsiders: a.outsiders.length });
    if (dr.history.length > 30) dr.history.splice(0, dr.history.length - 30);
  }
  return a;
}

/**
 * Keine Dauerkrise: Steckt die Stimmung vier Wochen unter 35, raufen sich die
 * Spieler selbst zusammen (Kapitän/Führungsspieler rufen die Mannschaft
 * zusammen) – höchstens alle 6 Wochen, stärker mit einem anerkannten Kapitän.
 */
function rallyIfStuck(g: Game, dr: DressingRoomState, a: DRAnalysis, today: string): void {
  if (dr.mood >= 35) { dr.lowSince = undefined; return; }
  dr.lowSince ??= today;
  if (days(dr.lowSince, today) < 28 || (dr.rally && days(dr.rally, today) < 42)) return;
  const cap = dr.captainId ? g.players[dr.captainId] : undefined;
  const strong = !!cap && (a.byId[cap.id]?.influence ?? 0) >= 60;
  addBoost(dr, '*', strong ? 12 : 9, 'Spieler raufen sich zusammen', today, 45);
  addBoost(dr, '#c', 6, 'Aussprache ohne Trainer', today, 45);
  dr.rally = today; dr.lowSince = today;
  const who = cap ? cap.fullName : 'Die Führungsspieler';
  logRoom(dr, today, `${cap ? cap.lastName : 'Die Führungsspieler'} ruft die Mannschaft ohne Trainer zusammen.`);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'general', from: 'Co-Trainer', subject: 'Die Mannschaft rauft sich zusammen',
    shortText: `${who} hat die Spieler zu einer Aussprache ohne Trainer zusammengerufen.`,
    bodyText: `Nach Wochen schlechter Stimmung hat ${who} die Mannschaft zu einer Aussprache ohne Trainerteam zusammengerufen. Die Luft ist etwas klarer. Mit Gesprächen, einer Sitzung oder einem Teamevent kannst du nachlegen (Kader › Kabine).`,
  }));
}

/** KI-Vereine: sonntags, günstig gerechnet (Stimmung → Moral-Stufen). */
export function aiDressingRoomsWeekly(g: Game): void {
  const forms = new Map<string, ('W' | 'D' | 'L')[]>();
  for (const r of g.table.rows) forms.set(r.clubId, r.form ?? []);
  for (const d of g.leagues?.otherDivisions ?? []) for (const r of d.table.rows) forms.set(r.clubId, r.form ?? []);
  for (const club of Object.values(g.clubs)) {
    if (club.id === g.managedClubId || !club.playerIds.length) continue;
    const dr = roomOf(club);
    dr.mood = Math.round((dr.mood + (aiMoodTarget(forms.get(club.id) ?? []) - dr.mood) * 0.4) * 10) / 10;
    const squad = squadOf(g, club).sort((a, b) => b.overall - a.overall);
    squad.forEach((p, i) => {
      const want = aiMoraleStep(dr.mood, p, i + 1);
      const cur = MORALE_STEPS.indexOf(p.morale);
      if (cur !== want && Math.random() < 0.3) p.morale = MORALE_STEPS[cur + Math.sign(want - cur)];
    });
  }
}

// -----------------------------------------------------------------------------
// Trainer-Aktionen
// -----------------------------------------------------------------------------
export interface RoomResult { ok: boolean; text: string }

export function talkState(g: Game, pid: string): { nextOn?: string; wear: number; count: number } {
  const dr = roomOf(g.clubs[g.managedClubId]);
  const today = g.calendar.currentDate;
  const ds = (dr.talks?.[pid] ?? []).filter((d) => days(d, today) <= 60);
  const last = ds.reduce((a, d) => (d > a ? d : a), '');
  const nextOn = last && days(last, today) < TALK_COOLDOWN ? CalendarEngine.addDays(last, TALK_COOLDOWN) : undefined;
  const busy = Object.values(dr.talks ?? {}).flat().filter((d) => days(d, today) <= 14).length;
  return { nextOn, wear: Math.pow(0.65, ds.length) * (busy > 6 ? 0.7 : 1), count: ds.length };
}

export function talkTo(g: Game, pid: string, kind: TalkKind, rng: () => number = Math.random): RoomResult {
  const club = g.clubs[g.managedClubId];
  const p = g.players[pid];
  const today = g.calendar.currentDate;
  if (!club || !p || p.clubId !== club.id) return { ok: false, text: 'Der Spieler ist nicht mehr im Kader.' };
  const dr = roomOf(club);
  const st = talkState(g, pid);
  if (st.nextOn) return { ok: false, text: `Ihr habt gerade erst gesprochen – wieder ab ${st.nextOn.split('-').reverse().join('.')}.` };
  if (kind === 'einsatz' && dr.pledges?.some((x) => x.pid === pid)) return { ok: false, text: `${p.lastName} hat deine Zusage schon.` };
  const a = roomAnalysis(g, club);
  const o = a.byId[pid];
  const score = p.moraleScore ?? moraleScoreOf(p.morale);
  const odds = talkOdds(kind, p, o, score);
  (dr.talks ??= {})[pid] = [...(dr.talks[pid] ?? []), today];
  const label = `Gespräch: ${TALK_LABEL[kind].toLowerCase()}`;
  const success = rng() < odds.chance;
  let text: string;
  if (kind === 'einsatz') {
    addBoost(dr, pid, odds.gain * st.wear, 'Einsatz zugesagt', today, 30);
    const until = CalendarEngine.addDays(today, roomInputs(g, club).ctx.offSeason ? 56 : 28);
    (dr.pledges ??= []).push({ pid, date: today, until, starts0: p.seasonStats?.starts ?? 0 });
    text = `${p.lastName} freut sich über die Zusage. Er erwartet bis ${until.split('-').reverse().join('.')} mindestens zwei Startelf-Einsätze.`;
  } else if (success) {
    addBoost(dr, pid, odds.gain * st.wear, label, today, 30);
    if (kind === 'kritisieren') p.form = clamp((p.form ?? 50) + 4, 0, 100);
    text = kind === 'loben' ? (odds.needed ? `${p.lastName} nimmt das Lob dankbar an.` : `${p.lastName} nickt – er war ohnehin obenauf.`)
      : kind === 'kritisieren' ? `${p.lastName} schluckt, nimmt die Kritik aber an und zieht im Training an.`
        : `${p.lastName} wirkt erleichtert, dass du zuhörst.`;
    if (kind === 'beruhigen') {
      const c = (dr.conflicts ?? []).find((x) => x.a === pid || x.b === pid);
      if (c && rng() < 0.4) { dr.conflicts = dr.conflicts!.filter((x) => x !== c); text += ' Den Streit will er begraben.'; }
    }
  } else {
    addBoost(dr, pid, -odds.loss * st.wear, label, today, 30);
    text = kind === 'loben' ? `Das Lob verpufft – ${p.lastName} wirkt unbeeindruckt.`
      : kind === 'kritisieren' ? `${p.lastName} fühlt sich ungerecht behandelt.`
        : `${p.lastName} blockt ab.`;
    if (kind === 'kritisieren' && (o?.influence ?? 0) >= 60) { addBoost(dr, '*', -3, `${p.lastName} macht Stimmung gegen dich`, today, 21); text += ' Als Führungsspieler trägt er das in die Kabine.'; }
  }
  if (st.count >= 2) text += ' (Ihr sprecht oft – die Worte nutzen sich ab.)';
  logRoom(dr, today, `${TALK_LABEL[kind]} – ${p.lastName}: ${text}`);
  return { ok: true, text };
}

function leadMorale(g: Game, a: DRAnalysis): number {
  const ls = a.leaders.map((id) => g.players[id]).filter(Boolean);
  return ls.length ? ls.reduce((s, p) => s + (p.moraleScore ?? 60), 0) / ls.length : 60;
}

export function meetingState(g: Game): { nextOn?: string; wear: number } {
  const dr = roomOf(g.clubs[g.managedClubId]);
  const today = g.calendar.currentDate;
  const ds = (dr.meetings ?? []).filter((d) => days(d, today) <= 60);
  const last = ds.reduce((a, d) => (d > a ? d : a), '');
  return { nextOn: last && days(last, today) < MEETING_COOLDOWN ? CalendarEngine.addDays(last, MEETING_COOLDOWN) : undefined, wear: Math.pow(0.6, ds.length) };
}

export function teamMeeting(g: Game, tone: 'aufbauen' | 'klartext', rng: () => number = Math.random): RoomResult {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const dr = roomOf(club);
  const st = meetingState(g);
  if (st.nextOn) return { ok: false, text: `Die letzte Sitzung ist erst wenige Tage her – wieder ab ${st.nextOn.split('-').reverse().join('.')}.` };
  (dr.meetings ??= []).push(today);
  const a = roomAnalysis(g, club);
  const { ctx } = roomInputs(g, club);
  const squad = squadOf(g, club);
  let text: string;
  if (st.wear < 0.4) {
    addBoost(dr, '*', -3, 'Sitzung zu viel', today, 21);
    text = 'Schon wieder eine Sitzung? Die Spieler können es nicht mehr hören.';
  } else if (tone === 'aufbauen') {
    const base = dr.mood < 45 ? 8 : dr.mood < 60 ? 4 : 2;
    const ok = rng() < 0.5 + (leadMorale(g, a) - 50) / 100;
    addBoost(dr, '*', (ok ? base : 1) * st.wear, 'Mannschaftssitzung', today, 25);
    text = ok ? (base >= 8 ? 'Die Ansprache trifft den Nerv – die Köpfe gehen wieder hoch.' : 'Ruhige Sitzung, gute Stimmung.') : 'Die Führungsspieler ziehen nicht richtig mit – die Sitzung verpufft.';
  } else {
    const bad = (ctx.ppg ?? 1.4) < 1.1 || dr.mood < 45;
    const prof = squad.reduce((s, p) => s + (p.development.professionalism ?? 50), 0) / Math.max(1, squad.length);
    if ((ctx.ppg ?? 0) >= 1.8) { addBoost(dr, '*', -6 * st.wear, 'Klartext nach Siegen', today, 25); text = 'Nach den guten Ergebnissen versteht niemand den harten Ton.'; }
    else if (bad && prof >= 48) {
      addBoost(dr, '*', 7 * st.wear, 'Klartext in der Krise', today, 25);
      for (const p of squad) p.form = clamp((p.form ?? 50) + 2, 0, 100);
      text = 'Deutliche Worte, die ankommen – im Training wird wieder gerannt.';
    } else { addBoost(dr, '*', -5 * st.wear, 'Klartext ohne Anlass', today, 25); text = 'Die Mannschaft fühlt sich ungerecht behandelt.'; }
  }
  logRoom(dr, today, `Mannschaftssitzung (${tone === 'aufbauen' ? 'aufbauen' : 'Klartext'}): ${text}`);
  return { ok: true, text };
}

export function eventState(g: Game): { nextOn?: string; wear: number } {
  const dr = roomOf(g.clubs[g.managedClubId]);
  const today = g.calendar.currentDate;
  const ds = dr.events ?? [];
  const last = ds.reduce((a, d) => (d > a ? d : a), '');
  return { nextOn: last && days(last, today) < EVENT_COOLDOWN ? CalendarEngine.addDays(last, EVENT_COOLDOWN) : undefined, wear: Math.pow(0.7, ds.filter((d) => days(d, today) <= 120).length) };
}

export function teamEvent(g: Game, kind: TeamEventKind, free = false): RoomResult {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const dr = roomOf(club);
  const def = teamEventDefs(yearOf(today)).find((d) => d.kind === kind)!;
  const st = eventState(g);
  if (st.nextOn) return { ok: false, text: `Das letzte Teamevent ist noch nicht lange her – wieder ab ${st.nextOn.split('-').reverse().join('.')}.` };
  const cost = Math.round(def.cost * economyScale(yearOf(today)));
  if (!free && club.finances.balance < cost) return { ok: false, text: 'Der Vorstand gibt dafür kein Geld frei – das Konto gibt es nicht her.' };
  if (!free) book(club.finances, today, -cost, 'other', `Teamevent: ${def.label}`, true);
  (dr.events ??= []).push(today);
  addBoost(dr, '*', def.mood * st.wear, def.label, today, 40);
  addBoost(dr, '#c', def.cohesion * st.wear, def.label, today, 60);
  const a = roomAnalysis(g, club);
  for (const id of a.outsiders) addBoost(dr, id, def.outsider * st.wear, `${def.label}: dabei gewesen`, today, 40);
  const text = `${def.label}: ${a.outsiders.length ? 'Auch die Außenseiter kommen ins Gespräch.' : 'Gute Stimmung.'}${st.wear < 0.8 ? ' Der Reiz lässt etwas nach – das letzte Event ist nicht lange her.' : ''}`;
  logRoom(dr, today, text);
  return { ok: true, text };
}

export function appointCaptain(g: Game, pid: string): RoomResult {
  const club = g.clubs[g.managedClubId];
  const p = g.players[pid];
  const today = g.calendar.currentDate;
  const dr = roomOf(club);
  if (!p || p.clubId !== club.id) return { ok: false, text: 'Der Spieler ist nicht im Kader.' };
  if (dr.captainId === pid) return { ok: false, text: `${p.lastName} ist bereits Kapitän.` };
  const old = dr.captainId ? g.players[dr.captainId] : undefined;
  const a = roomAnalysis(g, club);
  const rankNoCap = [...a.players].map((o) => ({ id: o.id, v: o.influence - (o.id === dr.captainId ? 15 : 0) })).sort((x, y) => y.v - x.v).findIndex((x) => x.id === pid);
  let text = `${p.lastName} trägt ab sofort die Binde.`;
  if (old && old.clubId === club.id) {
    addBoost(dr, old.id, -10 * (0.5 + personaOf(old).rampenlicht / 100), 'Binde verloren', today, 60);
    text += ` ${old.lastName} ist enttäuscht.`;
  }
  if (dr.captainSince && days(dr.captainSince, today) < 60) { addBoost(dr, '*', -4, 'Ständiger Kapitänswechsel', today, 30); text += ' Der schnelle Wechsel sorgt für Unruhe.'; }
  if (rankNoCap > 4) { addBoost(dr, '*', -3, 'Kapitänswahl umstritten', today, 30); text += ' In der Kabine hätten viele einen anderen gewählt.'; }
  addBoost(dr, pid, 6, 'Zum Kapitän ernannt', today, 60);
  dr.captainId = pid; dr.captainSince = today;
  dr.council = (dr.council ?? []).filter((id) => id !== pid);
  if (club.tactics) club.tactics.captainId = pid;
  logRoom(dr, today, text);
  return { ok: true, text };
}

export function toggleCouncil(g: Game, pid: string): RoomResult {
  const club = g.clubs[g.managedClubId];
  const p = g.players[pid];
  const today = g.calendar.currentDate;
  const dr = roomOf(club);
  if (!p || p.clubId !== club.id) return { ok: false, text: 'Der Spieler ist nicht im Kader.' };
  if (dr.captainId === pid) return { ok: false, text: 'Der Kapitän führt den Mannschaftsrat ohnehin an.' };
  const c = dr.council ?? [];
  if (c.includes(pid)) {
    dr.council = c.filter((x) => x !== pid);
    addBoost(dr, pid, -5, 'Aus dem Mannschaftsrat entfernt', today, 45);
    logRoom(dr, today, `${p.lastName} ist nicht mehr im Mannschaftsrat.`);
    return { ok: true, text: `${p.lastName} ist nicht mehr im Mannschaftsrat – er nimmt es persönlich.` };
  }
  if (c.length >= 3) return { ok: false, text: 'Der Mannschaftsrat hat schon drei Mitglieder.' };
  dr.council = [...c, pid];
  addBoost(dr, pid, 4, 'In den Mannschaftsrat berufen', today, 45);
  logRoom(dr, today, `${p.lastName} rückt in den Mannschaftsrat.`);
  return { ok: true, text: `${p.lastName} gehört jetzt zum Mannschaftsrat.` };
}

export type { DRBoost };
