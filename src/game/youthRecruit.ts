// =============================================================================
// REKRUTIERUNGS-EREIGNISSE DER JUGEND (Daten: data/youthRecruitEvents.ts)
// -----------------------------------------------------------------------------
// Etwa einmal pro Jahr (Einstellung „Ereignisse“ wirkt mit) bietet sich die
// Chance, einen Jugendspieler auf ungewöhnlichem Weg zu holen. Das Ereignis
// legt Stärken, Schwächen und eine Potenzial-Tendenz fest; ein verdeckter
// Zufallswurf entscheidet zusätzlich:
//   8 %  Glücksgriff (+0,75 Sterne)   17 % besser als gedacht (+0,25)
//   60 % wie erwartet                 15 % Blender (−0,75)
// Die Scouts sehen nur die übliche Sterne-Spanne. Jedes Ereignis hat acht
// Jahre Sperrzeit.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { eventFrequency } from '../engine/randomEvents';
import { scoutRangeText } from '../engine/scouting';
import { generateYouthPlayer } from '../engine/youth';
import { YOUTH_RECRUIT_EVENTS, YouthRecruitEvent } from '../data/youthRecruitEvents';
import { ATTRIBUTE_LABELS_DE as ATTRIBUTE_LABEL, Player } from '../types';
import { fmtPrice } from '../ui/format';
import { CHOICE_HANDLERS } from './eventsGame';
import { Game } from './state';

const TYPE = 'youth_recruit';
const FREQ: Record<string, number> = { wenige: 0.5, normal: 1, viele: 1.8 };
/** Grundchance je Monat (≈ 1 Ereignis pro Jahr bei „normal“). */
export const YOUTH_RECRUIT_CHANCE = 0.09;

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function eligibleRecruitEvents(year: number, month: number, cooldowns: Record<string, string>, today: string): YouthRecruitEvent[] {
  return YOUTH_RECRUIT_EVENTS.filter((e) => (e.from ?? 0) <= year && (e.to ?? 9999) >= year
    && (!e.months || e.months.includes(month)) && !((cooldowns[`youth:${e.id}`] ?? '') > today));
}

/** Kandidat(en) eines Ereignisses erzeugen (noch nicht im Verein). */
export function makeRecruits(g: Game, ev: YouthRecruitEvent, today: string, r: () => number): { players: Player[]; luck: number } {
  const club = g.clubs[g.managedClubId];
  const luckRoll = r();
  const luck = luckRoll < 0.08 ? 0.75 : luckRoll < 0.25 ? 0.25 : luckRoll > 0.85 ? -0.75 : 0;
  // −0,5: Rekruten sind im Schnitt solide, keine Wunderkinder – Ausnahmen kommen über Ereignis und Glück.
  const potBias = ev.pot[0] + r() * (ev.pot[1] - ev.pot[0]) + luck - 0.5;
  const age = ev.ages[0] + Math.floor(r() * (ev.ages[1] - ev.ages[0] + 1));
  const n = ev.pair ? 2 : 1;
  const players: Player[] = [];
  for (let i = 0; i < n; i++) {
    const p = generateYouthPlayer(club.id, `rec_${ev.id}_${today}_${i}`, today, Math.max(1, club.infrastructure.youthAcademy), age, {
      pool: 'talent', potBias, positions: ev.positions, boosts: ev.boosts, weak: ev.weak, foreign: ev.foreign,
      ambition: ev.ambition, professionalism: ev.professionalism,
    });
    if (i === 1 && players[0]) { p.lastName = players[0].lastName; p.fullName = `${p.firstName} ${p.lastName}`; p.dateOfBirth = players[0].dateOfBirth; }
    p.clubId = '';
    players.push(p);
  }
  return { players, luck };
}

function describe(p: Player, ev: YouthRecruitEvent): string {
  const strong = Object.keys(ev.boosts).slice(0, 3).map((k) => `${(ATTRIBUTE_LABEL as Record<string, string>)[k] ?? k} ${(p.attributes as any)[k]}`).join(', ');
  const weak = Object.keys(ev.weak ?? {}).slice(0, 2).map((k) => `${(ATTRIBUTE_LABEL as Record<string, string>)[k] ?? k} ${(p.attributes as any)[k]}`).join(', ');
  return `${p.fullName} · ${p.naturalPosition} · ${p.age} J. · Stärke ${p.overall} · Potenzial (Scouts) ${scoutRangeText(p)}`
    + (strong ? `\nStärken: ${strong}` : '') + (weak ? `\nSchwächen: ${weak}` : '');
}

/** Monatlich (1. des Monats): vielleicht ein Rekrutierungs-Ereignis. */
export function monthlyYouthRecruit(g: Game, today: string): void {
  if ((g as any).simAutoManage) return;
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const r = seeded(`${g.managedClubId}|youthrec|${today}`);
  if (r() >= YOUTH_RECRUIT_CHANCE * (FREQ[eventFrequency()] ?? 1)) return;
  const year = Number(today.slice(0, 4));
  const cd = (g.eventCooldowns ??= {});
  const opts = eligibleRecruitEvents(year, Number(today.slice(5, 7)), cd, today);
  const total = opts.reduce((s, e) => s + e.weight, 0);
  if (!total) return;
  let roll = r() * total;
  const ev = opts.find((e) => (roll -= e.weight) <= 0) ?? opts[0];
  cd[`youth:${ev.id}`] = CalendarEngine.addDays(today, 8 * 365);
  const { players } = makeRecruits(g, ev, today, r);
  for (const p of players) g.youthPlayers[p.id] = p;
  const p0 = players[0];
  const text = ev.text.replace('{name}', p0.fullName).replace('{age}', String(p0.age)).replace('{pos}', p0.naturalPosition).replace('{city}', club.city ?? 'der Umgebung');
  const cost = ev.cost ?? 0;
  const msg = makeMessage({
    date: today, category: 'training', from: 'Leiter Jugendakademie', subject: ev.title,
    shortText: `${p0.fullName} (${p0.age}) – ${players.length > 1 ? 'zwei Spieler' : p0.naturalPosition}${cost ? `, Entschädigung ${fmtPrice(cost)}` : ''}`,
    bodyText: `${text}\n\n${players.map((p) => describe(p, ev)).join('\n\n')}\n\nWie gut er wirklich ist, weiß man erst nach ein paar Jahren – Überraschungen in beide Richtungen sind möglich.${cost ? `\n\nKosten: ${fmtPrice(cost)} Ausbildungsentschädigung.` : ''}`,
    actionRequired: true, relatedId: p0.id,
  });
  msg.choices = [
    { id: 'aufnehmen', label: players.length > 1 ? 'Beide aufnehmen' : 'In die Akademie aufnehmen', hint: cost ? fmtPrice(cost) : 'kostenlos' },
    { id: 'ablehnen', label: 'Absagen' },
  ];
  msg.eventRef = { type: TYPE, deadline: CalendarEngine.addDays(today, 7), defaultChoice: cost ? 'ablehnen' : 'aufnehmen', data: { ids: players.map((p) => p.id).join(','), cost } };
  pushMessage(g.messages, msg);
}

CHOICE_HANDLERS[TYPE] = (g, ref, choice) => {
  const club = g.clubs[g.managedClubId];
  const ids = String(ref.data?.ids ?? '').split(',').filter(Boolean);
  const ps = ids.map((id) => g.youthPlayers[id]).filter(Boolean);
  if (!ps.length) return { text: 'Die Gelegenheit ist vorbei.' };
  if (choice !== 'aufnehmen') {
    for (const p of ps) delete g.youthPlayers[p.id];
    return { text: 'Abgesagt.' };
  }
  for (const p of ps) {
    p.clubId = club.id;
    if (!club.youthPlayerIds.includes(p.id)) club.youthPlayerIds.push(p.id);
  }
  const cost = Number(ref.data?.cost ?? 0);
  if (cost > 0) {
    const today = g.calendar.currentDate;
    book(club.finances, today, -Math.round(cost * economyScale(yearOf(today))), 'other', `Ausbildungsentschädigung ${ps[0].fullName}`, true);
  }
  return { text: `${ps.map((p) => p.fullName).join(' und ')} ${ps.length > 1 ? 'gehören' : 'gehört'} jetzt zur Jugendakademie.` };
};
