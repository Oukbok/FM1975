// =============================================================================
// Legenden im Spielablauf: zum Jahrgangswechsel tauchen sie in einer Akademie auf.
// =============================================================================
import { Game } from './state';
import { LEGENDS, LegendSeed } from '../data/legends';
import { ORIGINS } from '../data/origins';
import { generateYouthPlayer } from '../engine/youth';
import { makeMessage, pushMessage } from '../engine/messages';
import { Club, Player, clampStars, potentialToStars } from '../types';
import { isLeagueClub } from '../engine/clubEconomy';

function pickClub(g: Game, seed: LegendSeed): Club | undefined {
  const clubs = Object.values(g.clubs).filter(isLeagueClub);
  if (!clubs.length) return undefined;
  const w = clubs.map((c) => {
    const acad = c.infrastructure?.youthAcademy ?? 1;
    const region = seed.cities?.some((x) => (c.city ?? '').startsWith(x)) ? 3 : 1;
    return acad * acad * region;
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < clubs.length; i++) { r -= w[i]; if (r <= 0) return clubs[i]; }
  return clubs[clubs.length - 1];
}

/** Legenden des Jahrgangs (Geburtsjahr + 15) in Akademien einsetzen. */
export function spawnLegends(g: Game, today: string): Player[] {
  const year = Number(today.slice(0, 4));
  const done = new Set(g.spawnedLegends ?? []);
  const out: Player[] = [];
  for (const seed of LEGENDS) {
    if (seed.birthYear + 15 !== year || done.has(seed.id)) continue;
    const club = pickClub(g, seed);
    if (!club) continue;
    const p = generateYouthPlayer(club.id, `legend_${seed.id}`, today, Math.max(3, club.infrastructure?.youthAcademy ?? 1), 14);
    const origin = ORIGINS[seed.origin];
    p.firstName = seed.firstName; p.lastName = seed.lastName; p.fullName = `${seed.firstName} ${seed.lastName}`;
    if (origin) { p.nationality = origin.nationality; p.origin = origin.id; p.face = origin.face; }
    p.naturalPosition = seed.position;
    p.positionRatings = { [seed.position]: p.overall };
    p.potentialStars = clampStars(potentialToStars(seed.peak));
    p.development.potentialAbility = seed.peak;
    p.development.basePotential = seed.peak;
    p.development.professionalism = seed.professionalism;
    p.development.ambition = seed.ambition;
    p.development.legendId = seed.id;
    // Scouts ahnen etwas, sind sich aber nicht sicher.
    p.scoutedPotentialMin = clampStars(p.potentialStars - 1.25);
    p.scoutedPotentialMax = p.potentialStars;
    g.youthPlayers[p.id] = p;
    (club.youthPlayerIds ??= []).push(p.id);
    (g.spawnedLegends ??= []).push(seed.id);
    out.push(p);
    if (club.id === g.managedClubId) {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'training', from: 'Leiter Jugendakademie',
        subject: `Ein besonderer Junge: ${p.fullName}`,
        shortText: 'So etwas sieht man nicht oft.',
        bodyText: `Mit dem neuen Jahrgang ist ${p.fullName} (${p.naturalPosition}) zu uns gekommen. ${seed.bio}\n\nIch will nicht zu viel versprechen – aber so einen Jungen hatten wir lange nicht. Er braucht Geduld, gutes Training und irgendwann Spielpraxis.`,
      }));
    } else {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'media', from: 'Scouting',
        subject: `Gerücht: Ausnahmetalent bei ${club.name}`,
        shortText: 'In der Jugend soll ein besonderer Spieler aufgetaucht sein.',
        bodyText: `Unsere Scouts hören von einem 15-Jährigen bei ${club.name}, über den alle reden. Vielleicht lohnt sich ein genauerer Blick (Transfers → Beobachtungsliste → Talente anderer Vereine).`,
      }));
    }
  }
  return out;
}
