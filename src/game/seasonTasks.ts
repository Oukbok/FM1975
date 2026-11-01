// =============================================================================
// SAISON-BRIEFING — „Deine Aufgaben“: Handlungsempfehlungen aus dem Spielstand
// -----------------------------------------------------------------------------
// Liest den aktuellen Spielstand (keine neue Mechanik, nichts wird verändert)
// und leitet konkrete Aufgaben für den Saisonstart ab: Kaderlücken, auslaufende
// Verträge, Transferbudget, Trainingslager, Saisonziel vs. Kaderstärke,
// Nachwuchs/NLZ, Finanzen, Sponsoren und Neues im Spiel. Jede Aufgabe nennt
// die Seite (`where` = „Kategorie › Unterpunkt“), die Oberfläche springt dorthin
// (views/zentrale/briefing/TasksPanel.tsx). Live berechnet → erledigte Aufgaben
// verschwinden beim nächsten Öffnen. Epochen-Tipps: data/briefings/eraTips.ts.
// =============================================================================
import { POSITION_GROUPS, Player, PositionGroup } from '../types';
import { bosmanActive, seasonEndYear } from '../engine/contractTalks';
import { destinationsFor } from '../engine/trainingCamp';
import { nlzDutyYear, nlzMissing } from '../engine/youthAcademy';
import type { GameChange } from './briefingChanges';
import type { BriefingSituation } from './seasonBriefing';
import { Game } from './state';
import { ownBooking, campWindow } from './trainingCampGame';
import { youthInvestOf } from './youthInvest';
import { CalendarEngine } from '../engine/calendar';
import { CAMP_LEAD_DAYS, CAMP_MIN_DAYS } from '../engine/trainingCamp';

export type TaskLevel = 'dringend' | 'wichtig' | 'tipp';

export interface SeasonTask {
  id: string;
  level: TaskLevel;
  icon: string;
  title: string;
  text: string;
  /** Seite im Spiel („Kategorie › Unterpunkt“). */
  where: string;
}

const LEVEL_ORDER: Record<TaskLevel, number> = { dringend: 0, wichtig: 1, tipp: 2 };
export const TASK_LEVEL_LABEL: Record<TaskLevel, string> = { dringend: 'Dringend', wichtig: 'Wichtig', tipp: 'Tipp' };

const GROUP_LABEL: Record<PositionGroup, string> = { GK: 'Tor', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Angriff' };
/** Mindestbesetzung je Mannschaftsteil und Zahl der Stammplätze für den Stärkevergleich. */
const GROUP_MIN: Record<PositionGroup, number> = { GK: 2, DEF: 6, MID: 6, ATT: 3 };
const GROUP_STARTERS: Record<PositionGroup, number> = { GK: 1, DEF: 4, MID: 4, ATT: 2 };

const nameOf = (p: Player) => p.lastName || p.fullName;
const listNames = (ps: Player[], max = 3) => ps.slice(0, max).map(nameOf).join(', ') + (ps.length > max ? ` und ${ps.length - max} weitere` : '');
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Wie weit darf der Kader-Rang hinter dem Ziel liegen, bevor es „ehrgeizig“ wird? */
function goalRank(goal: string, of: number): number | null {
  switch (goal) {
    case 'Meisterschaft': return 1;
    case 'Europa-Pokal-Platz': return 4;
    case 'Gesicherter Mittelfeldplatz': case 'Obere Tabellenhälfte': return Math.floor(of / 2);
    case 'Aufstieg': return 3;
    case 'Klassenerhalt': return Math.max(1, of - 3);
    default: return null;
  }
}

/**
 * Aufgaben deines Vereins zum aktuellen Datum. `sit` = Ausgangslage (Saisonziel,
 * Kaderrang), `changes` = „Neu im Spiel“ der Saison (für neu Freigeschaltetes).
 */
export function seasonTasks(g: Game, sit?: BriefingSituation, changes: GameChange[] = []): SeasonTask[] {
  const club = g.clubs[g.managedClubId];
  if (!club) return [];
  const today = g.calendar.currentDate;
  const year = parseInt(today.slice(0, 4), 10);
  const y0 = parseInt(g.season.slice(0, 4), 10) || year;
  const out: SeasonTask[] = [];
  const add = (t: SeasonTask) => { if (!out.some((x) => x.id === t.id)) out.push(t); };
  const squad = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.isYouth);

  // --- Kader: Größe und Mannschaftsteile ------------------------------------
  const byGroup = (gr: PositionGroup) => squad.filter((p) => POSITION_GROUPS[p.naturalPosition] === gr);
  const gk = byGroup('GK');
  if (gk.length < 2) {
    add({ id: 'gk', level: 'dringend', icon: 'squad', where: 'Transfers › Transfermarkt',
      title: gk.length === 0 ? 'Kein Torwart im Kader' : 'Nur ein Torwart im Kader',
      text: gk.length === 0 ? 'Ohne Torwart kannst du kein Spiel bestreiten – hol sofort zwei Keeper.'
        : `Fällt ${nameOf(gk[0])} aus, steht ein Feldspieler im Tor. Hol einen zweiten Torwart.` });
  }
  if (squad.length < 18) {
    add({ id: 'squad-small', level: 'dringend', icon: 'squad', where: 'Transfers › Transfermarkt',
      title: `Kader zu klein (${squad.length} Spieler)`,
      text: 'Mit Verletzungen und Sperren reicht das nicht durch die Saison. Ziel: mindestens 20 Profis.' });
  } else if (squad.length > 28) {
    add({ id: 'squad-big', level: 'tipp', icon: 'finances', where: 'Kader › Übersicht',
      title: `Großer Kader (${squad.length} Spieler)`,
      text: 'Viele Spieler kommen kaum zum Einsatz und kosten Gehalt. Gib Ergänzungsspieler ab.' });
  }
  for (const gr of ['DEF', 'MID', 'ATT'] as PositionGroup[]) {
    const n = byGroup(gr).length;
    if (n < GROUP_MIN[gr]) {
      add({ id: `thin-${gr}`, level: 'wichtig', icon: 'lineup', where: 'Transfers › Transfermarkt',
        title: `${GROUP_LABEL[gr]} dünn besetzt`,
        text: `Nur ${n} gelernte Spieler für ${GROUP_LABEL[gr] === 'Angriff' ? 'den Angriff' : `${gr === 'DEF' ? 'die' : 'das'} ${GROUP_LABEL[gr]}`} – eine Verletzung, und du musst umstellen.` });
    }
  }

  // Schwächster Mannschaftsteil (Stammkräfte) im Vergleich zum Rest.
  const starters = (gr: PositionGroup) => byGroup(gr).map((p) => p.overall).sort((a, b) => b - a).slice(0, GROUP_STARTERS[gr]);
  const groupAvg = (['GK', 'DEF', 'MID', 'ATT'] as PositionGroup[]).map((gr) => ({ gr, v: avg(starters(gr)), n: starters(gr).length }));
  const teamAvg = avg(groupAvg.filter((x) => x.n).map((x) => x.v));
  const weakest = groupAvg.filter((x) => x.n).sort((a, b) => a.v - b.v)[0];

  // --- Verträge -------------------------------------------------------------
  const endYear = seasonEndYear(today);
  const seasonEnd = `${endYear}-06-30`;
  const top = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 14);
  const expiring = top.filter((p) => p.contract?.expiryDate && p.contract.expiryDate <= seasonEnd && !p.contract.preContractClubId);
  const expired = expiring.filter((p) => p.contract.expiryDate < today);
  const running = expiring.filter((p) => p.contract.expiryDate >= today);
  if (expired.length) {
    add({ id: 'contracts-expired', level: 'dringend', icon: 'contracts', where: 'Kader › Verträge',
      title: expired.length === 1 ? `Vertrag von ${nameOf(expired[0])} endet jetzt` : `${expired.length} Verträge enden jetzt`,
      text: `${listNames(expired)} – der Vertrag ist zum 30.06. ausgelaufen. Ohne Verlängerung verlassen sie den Verein beim Saisonstart (game/contracts.ts).`.replace(' (game/contracts.ts)', '') });
  }
  if (running.length) {
    const bosman = bosmanActive(seasonEnd);
    add({ id: 'contracts', level: bosman ? 'dringend' : 'wichtig', icon: 'contracts', where: 'Kader › Verträge',
      title: running.length === 1 ? `Vertrag von ${nameOf(running[0])} läuft aus` : `${running.length} Stammspieler-Verträge laufen aus`,
      text: `${listNames(running)} – Vertrag endet zum Saisonende. `
        + (bosman ? 'Seit Bosman gehen sie dann ablösefrei: verlängern oder rechtzeitig verkaufen.'
          : 'Ablöse bekommst du auch danach, aber unzufriedene Spieler drängen weg – entscheide früh.') });
  }

  // --- Transferbudget -------------------------------------------------------
  const budget = club.finances.transferBudget;
  const values = top.map((p) => p.contract?.transferValue ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
  const median = values.length ? values[Math.floor(values.length / 2)] : 0;
  if (median > 0 && budget >= median * 0.6) {
    const gap = weakest && teamAvg - weakest.v >= 3 ? ` Am schwächsten: ${GROUP_LABEL[weakest.gr]}.` : '';
    add({ id: 'budget', level: 'wichtig', icon: 'transfers', where: 'Transfers › Transfermarkt',
      title: 'Transferbudget einsetzen',
      text: `Dein Budget reicht für mindestens einen Stammspieler.${gap} Schau dich auf dem Markt um, bevor die Konkurrenz zugreift.` });
  } else if (weakest && teamAvg - weakest.v >= 5) {
    add({ id: 'weak-group', level: 'tipp', icon: 'lineup', where: 'Transfers › Beobachtung',
      title: `Baustelle: ${GROUP_LABEL[weakest.gr]}`,
      text: `Deine Stammkräfte im ${GROUP_LABEL[weakest.gr] === 'Abwehr' ? 'Abwehrbereich' : GROUP_LABEL[weakest.gr]} fallen ab. Beobachte günstige Alternativen.` });
  }

  // --- Saisonziel vs. Kaderstärke --------------------------------------------
  if (sit) {
    const need = goalRank(sit.goal, sit.of);
    if (need != null && sit.rank > need + 2) {
      add({ id: 'goal-hard', level: 'wichtig', icon: 'dashVerein', where: 'Verein › Vorstand',
        title: `Ziel „${sit.goal}“ ist ehrgeizig`,
        text: `Dein Kader ist nur der ${sit.rank}.-stärkste von ${sit.of}. Verstärke dich gezielt oder halte das Vertrauen des Vorstands (${sit.confidence}/100) im Blick.` });
    } else if (sit.goal === 'Klassenerhalt' && sit.rank >= sit.of - 2) {
      add({ id: 'goal-relegation', level: 'wichtig', icon: 'dashVerein', where: 'Spieltag › Taktik',
        title: 'Abstiegskampf von Anfang an',
        text: 'Dein Kader gehört zu den schwächsten der Liga. Eine stabile Defensive und Heimstärke sind jetzt alles.' });
    } else if (need != null && sit.rank < need - 2 && sit.goal !== 'Meisterschaft') {
      add({ id: 'goal-easy', level: 'tipp', icon: 'trophy', where: 'Verein › Vorstand',
        title: 'Mehr als das Ziel ist drin',
        text: `Dein Kader ist der ${sit.rank}.-stärkste – „${sit.goal}“ ist gut erreichbar. Wer übertrifft, gewinnt Vertrauen.` });
    }
  }

  // --- Vorstand ------------------------------------------------------------
  const conf = sit?.confidence ?? Math.round(club.boardConfidence ?? 60);
  if (conf < 35) {
    add({ id: 'board', level: conf < 20 ? 'dringend' : 'wichtig', icon: 'dashVerein', where: 'Verein › Vorstand',
      title: 'Der Vorstand wird ungeduldig',
      text: `Vertrauen nur ${conf}/100. Ein guter Saisonstart ist Pflicht – sonst droht die Entlassung.` });
  }

  // --- Trainingslager -------------------------------------------------------
  const rep = club.reputation ?? 50;
  const summer = campWindow(g, 'summer');
  const latestStart = CalendarEngine.addDays(summer.to, -(CAMP_MIN_DAYS - 1));
  const canStillBook = CalendarEngine.addDays(today, CAMP_LEAD_DAYS) <= latestStart;
  const summerDest = destinationsFor('summer', y0, rep).filter((x) => x.status.ok).length;
  if (summerDest > 0 && canStillBook && !ownBooking(g, 'summer')) {
    add({ id: 'camp-summer', level: 'wichtig', icon: 'weather', where: 'Training › Trainingslager',
      title: 'Sommer-Trainingslager buchen',
      text: `${summerDest} Ziele stehen dir offen. Ein Lager in der Vorbereitung bringt Fitness und Teamgeist – buche mindestens ${CAMP_LEAD_DAYS} Tage im Voraus.` });
  }
  const winterDest = destinationsFor('winter', y0 + 1, rep).filter((x) => x.status.ok).length;
  if (winterDest > 0 && !ownBooking(g, 'winter')) {
    add({ id: 'camp-winter', level: 'tipp', icon: 'weather', where: 'Training › Trainingslager',
      title: 'Winterlager vormerken',
      text: 'Früh gebucht ist günstiger als kurzfristig – plane die Winterpause schon jetzt.' });
  }

  // --- Nachwuchs ------------------------------------------------------------
  const tier = sit?.tier ?? g.leagues?.playerDivision?.tier ?? 1;
  const duty = nlzDutyYear(tier);
  const inv = youthInvestOf(club, year);
  if (duty && y0 >= duty - 3) {
    const miss = nlzMissing(club, inv);
    if (miss.length) {
      add({ id: 'nlz', level: y0 >= duty - 1 ? 'dringend' : 'wichtig', icon: 'facilities', where: 'Jugend › Akademie',
        title: y0 >= duty ? 'Leistungszentrum unvollständig' : `Leistungszentrum bis ${duty} nötig`,
        text: `Für die Lizenz fehlt noch: ${miss.slice(0, 3).join(', ')}${miss.length > 3 ? ' …' : ''}. Bauten brauchen Zeit.` });
    }
  }
  const talents = club.youthPlayerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && p.age >= 17 && p.potentialStars >= 4);
  if (talents.length) {
    add({ id: 'talents', level: 'tipp', icon: 'youth', where: 'Jugend › Mannschaften',
      title: talents.length === 1 ? `Talent ${nameOf(talents[0])} ist so weit` : `${talents.length} Talente drängen nach oben`,
      text: `${listNames(talents)} – hochziehen und Einsatzzeit geben, sonst stagniert die Entwicklung.` });
  } else if (inv.quality < 30) {
    add({ id: 'youth-low', level: 'tipp', icon: 'youth', where: 'Jugend › Akademie',
      title: 'Nachwuchsarbeit ausbauen',
      text: 'Deine Ausbildungsqualität ist niedrig. Investitionen wirken erst nach Jahren – darum früh anfangen.' });
  }

  // --- Finanzen ------------------------------------------------------------
  const balance = club.finances.balance;
  if (balance < 0) {
    add({ id: 'debt', level: 'dringend', icon: 'finances', where: 'Finanzen › Bilanz',
      title: 'Konto im Minus',
      text: 'Spare bei Gehältern und Ausgaben oder verkaufe einen Spieler – bei Überschuldung drohen Lizenzauflagen.' });
  }
  if (club.pointDeduction && club.pointDeduction.season === g.season) {
    add({ id: 'deduction', level: 'dringend', icon: 'finances', where: 'Finanzen › Bilanz',
      title: `${club.pointDeduction.points} Punkte Abzug`,
      text: `${club.pointDeduction.reason} – du startest mit Rückstand.` });
  }
  const loanRate = (club.loans ?? []).reduce((a, l) => a + (l.remaining > 0 ? l.monthlyRate : 0), 0);
  if (loanRate > 0 && balance < loanRate * 6) {
    add({ id: 'loans', level: 'wichtig', icon: 'finances', where: 'Finanzen › Bilanz',
      title: 'Kreditraten im Blick behalten',
      text: 'Dein Kontostand deckt weniger als ein halbes Jahr Kreditraten. Plane Einnahmen vorsichtig.' });
  }

  // --- Sponsoren -----------------------------------------------------------
  const com = club.commerce;
  if (com) {
    if (!com.shirtSponsor && (com.shirtOffers?.length ?? 0) > 0) {
      add({ id: 'shirt', level: 'dringend', icon: 'sponsoring', where: 'Finanzen › Sponsoring',
        title: 'Kein Trikotsponsor',
        text: `${com.shirtOffers!.length} Angebote liegen vor. Jeder Monat ohne Vertrag kostet Einnahmen.` });
    } else if (com.shirtSponsor && com.shirtSponsor.yearsLeft <= 1) {
      add({ id: 'shirt-end', level: 'tipp', icon: 'sponsoring', where: 'Finanzen › Sponsoring',
        title: `Trikotvertrag mit ${com.shirtSponsor.name} endet`,
        text: 'Der Vertrag läuft nach dieser Saison aus. Eine gute Saison verbessert die nächsten Angebote.' });
    }
    if (!com.banden && (com.bandenOffers?.length ?? 0) > 0) {
      add({ id: 'banden', level: 'wichtig', icon: 'sponsoring', where: 'Finanzen › Sponsoring',
        title: 'Bandenwerbung unbesetzt',
        text: 'Für die Banden liegt ein Angebot vor – leicht verdientes Geld an jedem Heimspiel.' });
    }
  }

  // --- Neu freigeschaltet --------------------------------------------------
  const unlocked = changes.filter((c) => (c.kind === 'umfeld' || c.kind === 'einrichtung' || c.kind === 'jugend') && c.where && !c.title.startsWith('Veraltet'));
  const byWhere = new Map<string, GameChange[]>();
  for (const c of unlocked) byWhere.set(c.where!, [...(byWhere.get(c.where!) ?? []), c]);
  for (const [where, list] of byWhere) {
    add({ id: `new-${where}`, level: 'tipp', icon: list[0].icon, where,
      title: list.length === 1 ? list[0].title.replace(/^Neu baubar: /, 'Neu: ') : `${list.length} neue Ausbaustufen`,
      text: list.length === 1 ? list[0].text : list.map((c) => c.title.replace(/^Neu baubar: /, '')).slice(0, 3).join(' · ') });
  }

  return out.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}
