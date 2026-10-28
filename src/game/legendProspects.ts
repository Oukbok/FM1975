// =============================================================================
// Legenden außerhalb der Ligen: Geheimtipps und Auslandstalente
// -----------------------------------------------------------------------------
// • Geheimtipp: Eine Legende spielt mit 15 bei einem Amateurverein. Jeder kann
//   von ihm hören; wer schnell ist, holt ihn für wenig Geld. Nach einer Saison
//   schnappt ihn sich sonst der Verein der Region mit der besten Jugend.
// • Auslandstalent: Ausländische Legenden reifen in ihrer Heimat. Deine Scouts
//   sehen sie je nach Reichweite; ab 16 kannst du sie holen (Ausbildungs-
//   entschädigung, Wechselwille). Mit 18 wechseln sie sonst vielleicht zu einem
//   anderen deutschen Verein – oder machen im Ausland Karriere.
// =============================================================================
import { Game, LegendProspect } from './state';
import { LegendSeed } from '../data/legends';
import { isLeagueClub } from '../engine/clubEconomy';
import { applyOverallChange, truePotential } from '../engine/development';
import { economyScale, yearOf } from '../engine/economy';
import { bookTransfer } from '../engine/finances';
import { recordTransfer } from '../engine/history';
import { makeMessage, pushMessage } from '../engine/messages';
import { promoteYouth } from '../engine/youth';
import { youthCompensation } from '../engine/youthScouting';
import { dataScoutingBonus } from '../engine/infrastructure';
import { Club, Player } from '../types';
import { staffEffectsOf } from './staffGame';

const COUNTRY_NAME: Record<string, string> = {
  AUT: 'Österreich', SUI: 'Schweiz', NED: 'Niederlande', BEL: 'Belgien', DEN: 'Dänemark', SWE: 'Schweden', NOR: 'Norwegen',
  YUG: 'Jugoslawien', CRO: 'Kroatien', SRB: 'Serbien', POL: 'Polen', TCH: 'Tschechoslowakei', HUN: 'Ungarn', RUS: 'Sowjetunion',
  ITA: 'Italien', ESP: 'Spanien', POR: 'Portugal', FRA: 'Frankreich', ENG: 'England', SCO: 'Schottland', TUR: 'Türkei',
  GRE: 'Griechenland', BRA: 'Brasilien', ARG: 'Argentinien', GHA: 'Ghana', NGA: 'Nigeria', CMR: 'Kamerun', MAR: 'Marokko',
  JPN: 'Japan', KOR: 'Südkorea', USA: 'USA',
};
const AMATEUR_PREFIX = ['SV', 'TuS', 'FC', 'SpVgg', 'VfB', 'SC', 'TSV', 'Eintracht'];
const AMATEUR_SUFFIX = ['Nord', 'Süd', 'West', 'Ost', 'Land', 'Heide', 'Tal', 'Mark'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}
const seasonOf = (date: string) => (Number(date.slice(5, 7)) >= 7 ? Number(date.slice(0, 4)) : Number(date.slice(0, 4)) - 1);

export function addProspect(g: Game, p: Player, kind: LegendProspect['kind'], seed: LegendSeed, date: string): void {
  const city = seed.cities?.[Math.floor(Math.random() * seed.cities.length)] ?? 'Land';
  const from = kind === 'amateur'
    ? `${AMATEUR_PREFIX[Math.floor(Math.random() * AMATEUR_PREFIX.length)]} ${city}-${AMATEUR_SUFFIX[Math.floor(Math.random() * AMATEUR_SUFFIX.length)]}`
    : COUNTRY_NAME[p.nationality] ?? 'Ausland';
  p.clubId = 'legend_pool';
  (g.legendProspects ??= []).push({ player: p, kind, from, since: date, cities: seed.cities });
  if (kind === 'amateur') {
    pushMessage(g.messages, makeMessage({
      date, category: 'media', from: 'Scouting',
      subject: `Geheimtipp: ${p.fullName} (${from})`,
      shortText: 'Ein 15-Jähriger beim Amateurverein, über den die ganze Gegend spricht.',
      bodyText: `Bei ${from} spielt ein ${p.age}-Jähriger (${p.naturalPosition}), der die Gegner reihenweise stehen lässt. Noch hat ihn kein Profiverein. Wer schnell ist, bekommt ihn für wenig Geld (Transfers → Talente anderer Vereine).`,
    }));
  }
}

function scoutReach(g: Game): number {
  const mine = g.clubs[g.managedClubId];
  const s = staffEffectsOf(g).scouting + dataScoutingBonus(mine?.infrastructure?.dataCenter ?? 1);
  return Math.max(0.2, Math.min(0.85, 0.2 + s * 3.3));
}

/** Für deine Scouts sichtbare Interessenten (Geheimtipps immer, Ausland je nach Reichweite). */
export function visibleProspects(g: Game): LegendProspect[] {
  const month = g.calendar.currentDate.slice(0, 7);
  const reach = scoutReach(g);
  return (g.legendProspects ?? []).filter((x) => x.kind === 'amateur' || hash(`${x.player.id}:${month}`) < reach);
}

/** Ablöse bzw. Ausbildungsentschädigung (1975-Basis). */
export function prospectFee(x: LegendProspect, year: number): number {
  if (x.kind === 'amateur') return Math.round((4000 + (year - 1975) * 60) / 500) * 500;
  return Math.round(youthCompensation(x.player, year) * 1.5 / 5000) * 5000;
}

export function prospectMinAge(x: LegendProspect): number {
  return x.kind === 'amateur' ? 15 : 16;
}

/** Interessenten verpflichten (eine Chance je Saison). Liefert den Ergebnistext. */
export function signProspect(g: Game, playerId: string): string {
  const list = g.legendProspects ?? [];
  const x = list.find((e) => e.player.id === playerId);
  const mine = g.clubs[g.managedClubId];
  if (!x || !mine) return 'Spieler nicht gefunden.';
  const p = x.player;
  const date = g.calendar.currentDate;
  const year = yearOf(date);
  const season = seasonOf(date);
  if ((g.youthApproaches ??= {})[p.id] === season) return `Du hast ${p.fullName} in dieser Saison schon angesprochen.`;
  if (p.age < prospectMinAge(x)) return `${p.fullName} ist noch zu jung für einen Wechsel.`;
  const fee = prospectFee(x, year);
  if (fee > mine.finances.transferBudget) return `Die Ablöse übersteigt dein Transferbudget.`;
  g.youthApproaches[p.id] = season;
  // Wechselwille: Amateure wollen fast immer zu einem Profiverein; Auslandstalente zögern.
  const adapt = (p.development.adaptability ?? 50) / 100;
  const rep = (mine.reputation ?? 50) / 100;
  const will = x.kind === 'amateur' ? 0.85 : 0.2 + adapt * 0.4 + rep * 0.35 + (year >= 1995 ? 0.1 : 0);
  if (hash(`${p.id}:${mine.id}:${season}`) > will) {
    return x.kind === 'amateur'
      ? `${p.fullName} will vorerst bei ${x.from} bleiben. Versuch es nächste Saison noch einmal.`
      : `${p.fullName} möchte ${x.from} noch nicht verlassen. Vielleicht in einer späteren Saison.`;
  }
  g.legendProspects = list.filter((e) => e !== x);
  p.clubId = mine.id;
  g.youthPlayers[p.id] = p;
  (mine.youthPlayerIds ??= []).push(p.id);
  mine.finances.transferBudget -= fee;
  bookTransfer(mine, fee, true, `${p.fullName} (${x.kind === 'amateur' ? 'Ablöse' : 'Ausbildungsentschädigung'})`, date, true);
  recordTransfer(p, x.from, mine.name, Math.round(fee * economyScale(year)), date);
  pushMessage(g.messages, makeMessage({
    date, category: 'transfer', from: 'Leiter Jugendakademie',
    subject: `${p.fullName} kommt in unsere Jugend`,
    shortText: `${x.kind === 'amateur' ? 'Der Geheimtipp' : 'Das Auslandstalent'} hat unterschrieben.`,
    bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age}) wechselt von ${x.from} in unsere Jugendakademie.`,
  }));
  return `${p.fullName} wechselt in deine Jugendakademie.`;
}

function bestRegionAcademy(g: Game, p: Player, cities: string[]): Club | undefined {
  const all = Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.id !== g.managedClubId);
  const region = all.filter((c) => cities.some((x) => (c.city ?? '').startsWith(x)));
  const pool = region.length ? region : all;
  return [...pool].sort((a, b) => (b.infrastructure?.youthAcademy ?? 1) - (a.infrastructure?.youthAcademy ?? 1) || (b.reputation ?? 0) - (a.reputation ?? 0))[0];
}

/** Jährlich am 1. Juli: Interessenten altern, reifen und wechseln ggf. zu anderen Vereinen. */
export function processProspects(g: Game, today: string): void {
  const list = g.legendProspects ?? [];
  if (!list.length) return;
  const year = Number(today.slice(0, 4));
  const keep: LegendProspect[] = [];
  for (const x of list) {
    const p = x.player;
    const by = Number(p.dateOfBirth.slice(0, 4));
    if (year - by <= p.age) { keep.push(x); continue; } // in diesem Jahr schon bearbeitet
    p.age = year - by;
    // Reifen in der Heimat (Ausland gut, Amateur kaum gefördert).
    const gain = Math.min(x.kind === 'foreign' ? 3 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 2),
      Math.max(0, truePotential(p) - p.overall));
    if (gain > 0) applyOverallChange(p, gain);
    if (x.kind === 'amateur') {
      const club = bestRegionAcademy(g, p, x.cities ?? []);
      if (!club) { keep.push(x); continue; }
      p.clubId = club.id;
      g.youthPlayers[p.id] = p;
      (club.youthPlayerIds ??= []).push(p.id);
      pushMessage(g.messages, makeMessage({
        date: today, category: 'media', from: 'Scouting',
        subject: `${club.name} holt den Geheimtipp ${p.fullName}`,
        shortText: 'Das Talent vom Amateurverein ist weg.',
        bodyText: `${p.fullName} wechselt von ${x.from} in die Jugend von ${club.name}.`,
      }));
      continue;
    }
    if (p.age < 18) { keep.push(x); continue; }
    // Auslandstalent mit 18: Wechsel nach Deutschland oder Karriere in der Heimat.
    const chance = year < 1990 ? 0.25 : year < 1995 ? 0.4 : 0.65;
    const buyers = Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.id !== g.managedClubId);
    if (Math.random() < chance && buyers.length) {
      const ws = buyers.map((c) => (c.reputation ?? 50) ** 3);
      let r = Math.random() * ws.reduce((a, b) => a + b, 0);
      let club = buyers[0];
      for (let i = 0; i < buyers.length; i++) { r -= ws[i]; if (r <= 0) { club = buyers[i]; break; } }
      p.clubId = club.id;
      g.youthPlayers[p.id] = p;
      (club.youthPlayerIds ??= []).push(p.id);
      promoteYouth(club, p.id, g.players, g.youthPlayers, 32);
      pushMessage(g.messages, makeMessage({
        date: today, category: 'transfer', from: 'Sportredaktion',
        subject: `${club.name} holt ${p.fullName} aus ${x.from}`,
        shortText: 'Ein großes Talent wechselt in die Liga.',
        bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age}) wechselt aus ${x.from} zu ${club.name}. Die Scouts trauen ihm eine große Karriere zu.`,
      }));
    }
    // sonst: macht im Ausland Karriere (aus dem Spiel)
  }
  g.legendProspects = keep;
}
