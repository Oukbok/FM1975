// =============================================================================
// Legenden im Spielablauf
// -----------------------------------------------------------------------------
// • Spielstart 1975: Legenden der Jahrgänge bis 1960 stehen schon im Kader
//   (Profis passend zur Karrierephase, die Jüngsten in der Jugend).
// • 1. Juli: Der Jahrgang (Geburtsjahr + 15) taucht auf – 60 % beim
//   historischen Jugendverein bzw. in seiner Region, 30 % beim Verein der Region
//   mit der besten Jugendabteilung (das kann deiner sein), 10 % als Geheimtipp
//   bei einem Amateurverein (Jugend-Scouting).
// • Ausländische Legenden erscheinen als Auslandstalente im Scouting.
// • DDR-Legenden kommen erst nach der Wende (ab 1991) ins Spiel.
// =============================================================================
import { Game } from './state';
import { LEGENDS, LegendSeed } from '../data/legends';
import { isLeagueClub } from '../engine/clubEconomy';
import { makeMessage, pushMessage } from '../engine/messages';
import { Club, Player } from '../types';
import { isForeignLegend, makeLegendPro, makeLegendYouth, rarityOf } from './legendFactory';
import { addProspect, processProspects } from './legendProspects';

export function legendsActive(g: Game): boolean {
  return (g.legendMode ?? 'fictional') !== 'off';
}

function fullClubs(g: Game): Club[] {
  return Object.values(g.clubs).filter(isLeagueClub);
}

function regionClubs(g: Game, seed: LegendSeed): Club[] {
  const cities = seed.cities ?? [];
  if (!cities.length) return [];
  return fullClubs(g).filter((c) => cities.some((x) => (c.city ?? '').startsWith(x)));
}

function academyOf(c: Club): number {
  return (c.infrastructure?.youthAcademy ?? 1) + (c.infrastructure?.nlz ?? 0) * 0.5;
}

function weighted(list: Club[], w: (c: Club) => number): Club | undefined {
  if (!list.length) return undefined;
  const ws = list.map(w);
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}

/** Zielverein für eine Legende im Jugendalter (ohne Amateur-Zweig). */
function youthClubFor(g: Game, seed: LegendSeed, roll: number): Club | undefined {
  const region = regionClubs(g, seed);
  const home = seed.homeClub ? g.clubs[seed.homeClub] : undefined;
  if (roll < 0.6) {
    if (home && isLeagueClub(home)) return home;
    const r = weighted(region, (c) => academyOf(c) ** 2);
    if (r) return r;
  } else if (region.length) {
    // Beste Jugendabteilung der Region (bei Gleichstand der größere Verein).
    return [...region].sort((a, b) => academyOf(b) - academyOf(a) || (b.reputation ?? 0) - (a.reputation ?? 0))[0];
  }
  return weighted(fullClubs(g), (c) => academyOf(c) ** 2);
}

function announce(g: Game, p: Player, club: Club, seed: LegendSeed, date: string): void {
  if (club.id === g.managedClubId) {
    pushMessage(g.messages, makeMessage({
      date, category: 'training', from: 'Leiter Jugendakademie',
      subject: `Ein besonderer Junge: ${p.fullName}`,
      shortText: 'So etwas sieht man nicht oft.',
      bodyText: `Mit dem neuen Jahrgang ist ${p.fullName} (${p.naturalPosition}) zu uns gekommen. ${seed.bio}\n\nIch will nicht zu viel versprechen – aber so einen Jungen hatten wir lange nicht. Er braucht Geduld, gutes Training und irgendwann Spielpraxis.`,
    }));
  } else if (rarityOf(seed) !== 'liebling') {
    pushMessage(g.messages, makeMessage({
      date, category: 'media', from: 'Scouting',
      subject: `Gerücht: Ausnahmetalent bei ${club.name}`,
      shortText: 'In der Jugend soll ein besonderer Spieler aufgetaucht sein.',
      bodyText: `Unsere Scouts hören von einem 15-Jährigen bei ${club.name}, über den alle reden. Vielleicht lohnt sich ein genauerer Blick (Transfers → Talente anderer Vereine).`,
    }));
  }
}

function placeYouth(g: Game, p: Player, club: Club): void {
  p.clubId = club.id;
  g.youthPlayers[p.id] = p;
  (club.youthPlayerIds ??= []).push(p.id);
}

/** Legenden des Jahrgangs (Geburtsjahr + 15) auftauchen lassen. Jährlich am 1. Juli. */
export function spawnLegends(g: Game, today: string): Player[] {
  if (!legendsActive(g)) return [];
  const year = Number(today.slice(0, 4));
  processProspects(g, today);
  reunificationLegends(g, today);
  const done = new Set(g.spawnedLegends ?? []);
  const out: Player[] = [];
  for (const seed of LEGENDS) {
    if (seed.birthYear + 15 !== year || done.has(seed.id)) continue;
    if (seed.ddr && year < 1991) continue; // kommt nach der Wende
    (g.spawnedLegends ??= []).push(seed.id);
    if (isForeignLegend(seed)) {
      const p = makeLegendYouth(g, seed, 'legend_pool', today, 3, 15);
      addProspect(g, p, 'foreign', seed, today);
      continue;
    }
    const roll = Math.random();
    if (roll >= 0.9) {
      const p = makeLegendYouth(g, seed, 'legend_pool', today, 1, 15);
      addProspect(g, p, 'amateur', seed, today);
      continue;
    }
    const club = youthClubFor(g, seed, roll);
    if (!club) continue;
    const p = makeLegendYouth(g, seed, club.id, today, club.infrastructure?.youthAcademy ?? 1, 15);
    placeYouth(g, p, club);
    out.push(p);
    announce(g, p, club, seed, today);
  }
  return out;
}

/** Profi-Legende in einen Kader setzen; ersetzt den schwächsten Spieler gleicher Position. */
function placePro(g: Game, seed: LegendSeed, club: Club, date: string, age: number, replace: boolean): Player {
  const same = club.playerIds.map((id) => g.players[id])
    .filter((x): x is Player => !!x && x.naturalPosition === seed.position && !x.development.legendId)
    .sort((a, b) => a.overall - b.overall);
  const victim = replace && same.length >= 2 ? same[0] : undefined;
  const p = makeLegendPro(g, seed, club, date, age, victim?.id, victim?.shirtNumber);
  if (!victim) club.playerIds.push(p.id);
  g.players[p.id] = p;
  return p;
}

/** Zielverein für eine erwachsene Legende: Region, sonst nach Ansehen (Weltklasse → Spitzenvereine). */
function proClubFor(g: Game, seed: LegendSeed, regionOnly = false): Club | undefined {
  const region = regionClubs(g, seed);
  const rar = rarityOf(seed);
  const pow = rar === 'weltklasse' ? 4 : rar === 'national' ? 2.5 : 1;
  if (region.length && (regionOnly || Math.random() < 0.75)) return weighted(region, (c) => (c.reputation ?? 50) ** pow);
  if (regionOnly) return undefined;
  return weighted(fullClubs(g), (c) => (c.reputation ?? 50) ** pow);
}

/** Spielstart: Legenden, die 1975 schon spielen (bis Jahrgang 1960). */
export function seedStartLegends(g: Game, date: string): number {
  if (!legendsActive(g)) return 0;
  const year = Number(date.slice(0, 4));
  let n = 0;
  for (const seed of LEGENDS) {
    const age = year - seed.birthYear;
    if (age < 15 || seed.ddr) continue;
    (g.spawnedLegends ??= []).push(seed.id);
    if (age > 34) continue; // Karriere vorbei
    if (isForeignLegend(seed)) {
      if (age <= 17) addProspect(g, makeLegendYouth(g, seed, 'legend_pool', date, 3, age), 'foreign', seed, date);
      continue; // ältere spielen im Ausland
    }
    if (age <= 17) {
      const club = youthClubFor(g, seed, Math.random() * 0.9);
      if (!club) continue;
      placeYouth(g, makeLegendYouth(g, seed, club.id, date, club.infrastructure?.youthAcademy ?? 1, age), club);
      n++;
      continue;
    }
    // Publikumslieblinge nur in ihrer Region; startet das Spiel in der 2. Liga,
    // spielen die Großen in der (simulierten) 1. Liga und bleiben unsichtbar.
    const regionOnly = rarityOf(seed) === 'liebling' || (g.leagues?.playerDivision?.tier ?? 1) > 1;
    const club = proClubFor(g, seed, regionOnly);
    if (!club) continue;
    placePro(g, seed, club, date, age, true);
    n++;
  }
  return n;
}

/** Nach der Wende: DDR-Legenden kommen in die gesamtdeutschen Ligen. */
function reunificationLegends(g: Game, today: string): void {
  const year = Number(today.slice(0, 4));
  if (year < 1991) return;
  const done = new Set(g.spawnedLegends ?? []);
  const names: string[] = [];
  for (const seed of LEGENDS) {
    if (!seed.ddr || done.has(seed.id) || seed.birthYear + 15 > year) continue;
    (g.spawnedLegends ??= []).push(seed.id);
    const age = year - seed.birthYear;
    if (age > 33) continue;
    if (age <= 17) {
      const club = youthClubFor(g, seed, Math.random() * 0.9);
      if (club) placeYouth(g, makeLegendYouth(g, seed, club.id, today, club.infrastructure?.youthAcademy ?? 1, age), club);
      continue;
    }
    const club = proClubFor(g, seed);
    if (!club) continue;
    const p = placePro(g, seed, club, today, age, false);
    names.push(`${p.fullName} (${p.naturalPosition}, ${age}) → ${club.name}`);
  }
  if (names.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'media', from: 'Sportredaktion',
      subject: 'Stars aus dem Osten in der gesamtdeutschen Liga',
      shortText: `${names.length} bekannte Spieler aus der früheren DDR-Oberliga wechseln.`,
      bodyText: `Nach der Wende zieht es die Besten aus dem Osten in die gesamtdeutschen Ligen:\n\n${names.join('\n')}`,
    }));
  }
}
