// =============================================================================
// HALLENFUSSBALL – Nachrichten (Einladung, Absage, eigenes Ergebnis, Masters) und
// Anzeigenamen. Spielablauf: game/indoorGame.ts.
// =============================================================================
import { mastersMoney, tournamentFeeBase, winterYearOf } from '../data/indoorHistory';
import { INDOOR_SQUAD_LABEL, winnerOf } from '../engine/indoor';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { fmtDM, fmtDay } from '../ui/format';
import { Game } from './state';
import { IndoorTournament, IndoorWinter, indoorState } from './winterShared';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Anzeigename eines Teilnehmers (voller Verein, Ligaverein, Amateur oder Auslandsgast). */
export function indoorName(g: Game, id: string): string {
  return g.clubs[id]?.name ?? g.simClubs[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
}
export function indoorShort(g: Game, id: string): string {
  return g.clubs[id]?.shortName ?? g.simClubs[id]?.shortName ?? g.euroClubs?.[id]?.shortName ?? id;
}

export function sendInvite(g: Game, t: IndoorTournament, today: string): void {
  const club = g.clubs[g.managedClubId];
  const scale = economyScale(yearOf(t.date));
  const fee = t.kind === 'masters' ? mastersMoney(winterYearOf(g.season)).start : Math.round(tournamentFeeBase(club.reputation) * scale);
  const others = t.clubIds.filter((id) => id !== g.managedClubId).map((id) => indoorName(g, id));
  const deadline = CalendarEngine.addDays(t.date, -2) > today ? CalendarEngine.addDays(t.date, -2) : today;
  const masters = t.kind === 'masters';
  const msg = makeMessage({
    date: today, category: 'cup', from: masters ? 'DFB-Spielausschuss' : `Veranstalter ${t.city}`,
    subject: masters ? `Qualifiziert für das ${t.name}` : `Einladung: ${t.name} (${fmtDay(t.date)})`,
    shortText: masters ? `Endrunde in der ${t.hall}, ${t.city}. Teilnehmen?` : `${t.hall}, ${t.city}. Antrittsgeld ${fmtDM(fee)}.`,
    bodyText: (masters
      ? `Glückwunsch: Über die Hallentour habt ihr euch für die Endrunde des DFB-Hallenpokals qualifiziert – ${t.days} Tage in der ${t.hall} (${t.city}) ab ${fmtDay(t.date)}.\n\n`
      : `Wir laden euch zum ${t.name} in die ${t.hall} ein (${fmtDay(t.date)}).\n\nBisher zugesagt: ${others.join(', ') || 'noch offen'}.\n\n`)
      + `Antrittsgeld: ${fee > 0 ? fmtDM(fee) : 'keines'}${masters ? ' – dazu Prämien nach Platzierung' : ' – der Turniersieger bekommt eine Prämie'}.\n\n`
      + `Fünf Feldspieler plus Torwart, Rundumbande, kurze Spielzeiten. Gut für Spielpraxis von Reservisten und für die Fans – `
      + `aber der Hallenboden ist hart: Prellungen und Bänderverletzungen sind keine Seltenheit, und die Winterpause wird kürzer.\n\n`
      + `Du kannst Stammkräfte schicken, gemischt antreten oder den Nachwuchs spielen lassen. Eine Absage verärgert ${masters ? 'den DFB und die Fans' : 'den Veranstalter und die Fans'}.`,
    actionRequired: true,
  });
  msg.choices = [
    { id: 'stars', label: 'Zusagen – Stammkräfte', hint: 'Beste Titelchance, höchstes Verletzungsrisiko für Leistungsträger' },
    { id: 'mix', label: 'Zusagen – gemischt', hint: 'Drei Stammkräfte, Rest Reservisten' },
    { id: 'youth', label: 'Zusagen – Nachwuchs', hint: 'Spielpraxis für Junge, Stars werden geschont' },
    { id: 'decline', label: 'Absagen', hint: 'Keine Belastung – aber Ärger bei Veranstalter und Fans' },
  ];
  msg.eventRef = { type: 'indoor_invite', deadline, defaultChoice: 'mix', data: { tid: t.id } };
  pushMessage(g.messages, msg);
}

export function declinePenalty(g: Game, t: IndoorTournament, today: string): void {
  const st = indoorState(g);
  const home = g.clubs[g.managedClubId]?.city === t.city;
  const loss = t.kind === 'masters' ? 1.5 : home ? 2.5 : 1;
  if (g.environment) g.environment.fanMood = clamp(g.environment.fanMood - loss, 0, 100);
  st.snub += t.kind === 'masters' ? 1.5 : 1;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'media', from: 'Pressestelle',
    subject: t.kind === 'masters' ? 'DFB verärgert über Absage für die Endrunde' : `Absage verärgert ${t.city}`,
    shortText: home ? 'Die eigenen Fans hatten sich auf das Heimturnier gefreut.' : 'Der Veranstalter ist enttäuscht.',
    bodyText: `Unsere Absage für das ${t.name} sorgt für Unmut. ${home ? 'Gerade in der eigenen Stadt nehmen uns das viele Fans übel. ' : ''}`
      + `Veranstalter reden miteinander: Wer häufig absagt, wird seltener eingeladen.\n\nFan-Stimmung −${loss.toLocaleString('de-DE')}.`,
  }));
}

export function ownResultMessage(g: Game, t: IndoorTournament, place: number, money: number, injured: string[], today: string): void {
  const res = t.result!;
  const mid = g.managedClubId;
  const lines = res.matches.filter((m) => m.a === mid || m.b === mid).map((m) => {
    const home = m.a === mid;
    const opp = indoorShort(g, home ? m.b : m.a);
    const gf = home ? m.ga : m.gb, ga = home ? m.gb : m.ga;
    const pens = m.pa != null ? ` (Neunmeter ${home ? m.pa : m.pb}:${home ? m.pb : m.pa})` : '';
    const stage = m.stage === 'F' ? 'Finale' : m.stage === 'SF' ? 'Halbfinale' : m.stage === 'P3' ? 'Spiel um Platz 3' : 'Gruppe';
    return `• ${stage}: ${opp} ${gf}:${ga}${pens}`;
  });
  pushMessage(g.messages, makeMessage({
    date: today, category: 'cup', from: 'Trainerstab',
    subject: place === 0 ? `${t.name}: Turniersieg!` : `${t.name}: Platz ${place + 1}`,
    shortText: `${t.squads[mid] ? INDOOR_SQUAD_LABEL[t.squads[mid]] : ''} · Einnahmen ${fmtDM(money)}${injured.length ? ` · ${injured.length} verletzt` : ''}`,
    bodyText: `${t.name} (${t.hall}, ${t.city})\n\n${lines.join('\n')}\n\nEndplatz: ${place + 1} von ${t.clubIds.length}. Turniersieger: ${indoorName(g, res.ranking[0])}.\n`
      + `Einnahmen: ${fmtDM(money)}\n`
      + (injured.length ? `\nVerletzt:\n${injured.map((x) => '• ' + x).join('\n')}\n` : '\nZum Glück ohne Verletzte.\n')
      + `\nDie eingesetzten Spieler sind müde (Frische gesunken), Reservisten haben Spielpraxis gesammelt.`,
  }));
}

export function mastersNews(g: Game, cur: IndoorWinter, t: IndoorTournament, today: string): void {
  const fin = t.result!.matches.find((m) => m.stage === 'F')!;
  const w = winnerOf(fin)!;
  if (w === g.managedClubId) return;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'cup', from: 'Sportpresse',
    subject: `${indoorName(g, w)} gewinnt das Hallen-Masters ${cur.winterYear}`,
    shortText: `Finale in ${t.city}: ${indoorShort(g, fin.a)} – ${indoorShort(g, fin.b)} ${fin.ga}:${fin.gb}${fin.pa != null ? ` (${fin.pa}:${fin.pb} n. N.)` : ''}.`,
    bodyText: `Die Endrunde des DFB-Hallenpokals in der ${t.hall} ist entschieden: ${indoorName(g, w)} holt den Titel.`
      + (cur.mastersDeclined?.length ? `\n\nNicht angetreten trotz Qualifikation: ${cur.mastersDeclined.map((id) => indoorShort(g, id)).join(', ')}.` : ''),
  }));
}

