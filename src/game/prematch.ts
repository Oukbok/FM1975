// =============================================================================
// VORSCHAU „NÄCHSTES SPIEL“ – Anzeigedaten (screens/prematch/PrematchScreen.tsx).
// Liest nur aus dem Spielstand: Stärke (engine/match.ts calculateTeamStrength), Tabelle/Form
// (game/clubProfile.ts), Hinspiel, direkter Vergleich (game/clubRecords.ts), Zuschauer
// (engine/seating.ts, gleiche Nachfrage wie die Match-Engine, ohne Zufall), Wetter
// (game/matchWeather.ts – genau dieses Wetter übernimmt der Spielstart), Lage/Distanz
// (data/prematch/cityGeo.ts) und Stadttext (data/prematch/cityTexts*.ts).
// Ausländische Gegner werden – wie beim Spielstart – als voller Verein angelegt.
// =============================================================================
import { attendanceRestriction } from '../data/history';
import { CITY_TEXTS_ABROAD } from '../data/prematch/cityTextsAbroad';
import { CITY_TEXTS_DE } from '../data/prematch/cityTextsDe';
import { canonicalCity, cityGeo, distanceKm, isGermanCity, type LatLon } from '../data/prematch/cityGeo';
import { seasonLabel } from '../engine/calendar';
import { yearOf } from '../engine/economy';
import { calculateTeamStrength } from '../engine/match';
import type { Weather } from '../engine/match/sim';
import { capsFor, demandFor, sellSeats } from '../engine/seating';
import { seasonStartYear } from '../data/timeline';
import type { Club } from '../types';
import { buildClubProfile } from './clubProfile';
import { h2hOf } from './clubRecords';
import { clubStrengthFor } from './season';
import { forecastWeather, WEATHER_DE } from './matchWeather';
import { ensureClubs, type OwnMatchInfo } from './ownMatch';
import type { Game } from './state';

export interface PrematchSide {
  id: string;
  name: string;
  short: string;
  club: Club;
  city: string;
  country?: string;
  mine: boolean;
  /** Tabellenplatz + Liga (falls in einer Liga). */
  position?: number;
  division?: string;
  /** Mannschaftsstärke der voraussichtlichen Elf (0–100) und Rang in der eigenen Liga. */
  strength: number;
  strengthRank?: number;
  strengthOf?: number;
  /** Ligabilanz der laufenden Saison. */
  season?: { played: number; won: number; drawn: number; lost: number; points: number; goals: string };
  /** Letzte fünf Pflichtspiele, älteste zuerst. */
  form: ('W' | 'D' | 'L')[];
  geo: LatLon | null;
}

export interface H2HRow { season: string; h: string | null; a: string | null }

export interface PrematchData {
  info: OwnMatchInfo;
  home: PrematchSide;
  away: PrematchSide;
  opp: PrematchSide;
  stadium: string;
  capacity: number;
  expected: number;
  weather: Weather;
  weatherLabel: string;
  weatherNote: string;
  distance: number | null;
  /** Kartenausschnitt: beide Orte in Deutschland oder Europa. */
  mapKind: 'de' | 'eu';
  firstLeg?: { label: string; text: string };
  h2h: H2HRow[];
  /** Welche Spiele der direkte Vergleich zeigt (Anzeige). */
  h2hScope: string;
  about: { city: string; text: string; tags: string; generic: boolean };
  year: number;
}

const short = (c: Club) => c.shortName || c.name.slice(0, 3).toUpperCase();

function sideOf(g: Game, id: string, ranks: Map<string, number>, rankOf: number): PrematchSide {
  const club = g.clubs[id];
  const euro = g.euroClubs?.[id];
  const prof = buildClubProfile(g, id);
  let strength = clubStrengthFor(g, id);
  try { if (club) strength = calculateTeamStrength(club, g.players).overall; } catch { /* Anzeige */ }
  const form = prof.lastMatches.filter((m) => m.result).slice(0, 5).map((m) => m.result!).reverse();
  const city = club?.city ?? euro?.city ?? prof.city ?? '';
  const country = euro?.country;
  return {
    id, name: prof.name, short: club ? short(club) : prof.shortName, club: club ?? prof.crestClub, city, country,
    mine: id === g.managedClubId,
    position: prof.tablePosition, division: prof.divisionLabel,
    strength: Math.round(strength * 10) / 10,
    strengthRank: ranks.get(id), strengthOf: ranks.has(id) ? rankOf : undefined,
    season: prof.played != null && prof.points != null && prof.played > 0
      ? (() => {
        const row = g.table.rows.find((r) => r.clubId === id)
          ?? g.leagues.otherDivisions.flatMap((d) => d.table.rows).find((r) => r.clubId === id);
        return row ? { played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, points: row.points, goals: `${row.goalsFor}:${row.goalsAgainst}` } : undefined;
      })()
      : undefined,
    form,
    geo: cityGeo(city, country ?? (club && !euro ? 'Deutschland' : undefined))?.geo ?? null,
  };
}

/** Rang der Mannschaftsstärke in der Liga des eigenen Vereins (nur volle Vereine). */
function strengthRanks(g: Game): Map<string, number> {
  const vals = g.table.rows.map((r) => {
    const c = g.clubs[r.clubId];
    let s = clubStrengthFor(g, r.clubId);
    try { if (c) s = calculateTeamStrength(c, g.players).overall; } catch { /* Anzeige */ }
    return { id: r.clubId, s };
  }).sort((a, b) => b.s - a.s);
  return new Map(vals.map((v, i) => [v.id, i + 1]));
}

/** Erwartete Zuschauer wie in der Match-Engine (engine/seating.ts), nur ohne Zufall. */
function expectedCrowd(home: Club, away: Club | undefined, info: OwnMatchInfo, weather: Weather): number {
  try {
    const year = yearOf(info.date);
    const euro = info.competition === 'Europapokal';
    const ci = capsFor(home, year, { euro, date: info.date });
    const derby = !!home.city && home.city === away?.city;
    const month = Number(info.date.slice(5, 7));
    const d = demandFor(home, { year, away: away ?? null, derby, weather, month, euro }, ci.stehCover);
    return Math.round(sellSeats(ci.caps, d, undefined, attendanceRestriction(info.date)).attendance / 100) * 100;
  } catch {
    return Math.round(home.stadium.capacity * (home.stadium.averageAttendanceRate || 0.5) / 100) * 100;
  }
}

function prevSeasons(current: string, n: number): string[] {
  const y = seasonStartYear(current);
  return Array.from({ length: n }, (_, i) => seasonLabel(y - i));
}

/** Welche Wettbewerbe der direkte Vergleich zeigt: Liga, im Pokal Liga + Pokal, im Europapokal Europapokal. */
const H2H_SCOPE: Record<OwnMatchInfo['kind'], { comps: string; label: string }> = {
  liga: { comps: 'L', label: 'Ligaspiele' }, pokal: { comps: 'LP', label: 'Liga- und Pokalspiele' }, euro: { comps: 'E', label: 'Europapokalspiele' },
};

/** Direkter Vergleich der letzten 10 Saisons: H = beim heutigen Heimverein, A = beim heutigen Gast. */
function h2hRows(g: Game, info: OwnMatchInfo, oppId: string): H2HRow[] {
  const games = h2hOf(g, oppId).filter((t) => H2H_SCOPE[info.kind].comps.includes(t[2]));
  const iAmHome = info.side === 'home';
  return prevSeasons(g.season, 10).map((season) => {
    const row: H2HRow = { season, h: null, a: null };
    for (const [s, , , myHome, gf, ga] of games) {
      if (s !== season) continue;
      const score = myHome ? `${gf}:${ga}` : `${ga}:${gf}`;
      if ((myHome === 1) === iAmHome) row.h ??= score; else row.a ??= score;
    }
    return row;
  });
}

function firstLegOf(g: Game, info: OwnMatchInfo): PrematchData['firstLeg'] {
  const name = (id: string) => g.clubs[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
  if (info.firstLeg) {
    const f = info.firstLeg;
    const meHome = f.home === g.managedClubId;
    const mine = meHome ? f.hg : f.ag, theirs = meHome ? f.ag : f.hg;
    const verdict = mine > theirs ? 'Vorsprung aus dem Hinspiel' : mine < theirs ? 'Rückstand aus dem Hinspiel' : 'Unentschieden im Hinspiel';
    return { label: 'Hinspiel', text: `${name(f.home)} – ${name(f.away)} ${f.hg}:${f.ag} · ${verdict}${f.awayGoals ? ' · Auswärtstore zählen doppelt' : ''}` };
  }
  if (info.kind === 'liga') {
    const m = g.fixtures.find((x) => x.homeClubId === info.awayId && x.awayClubId === info.homeId && x.status === 'finished' && x.result);
    if (m?.result) return { label: 'Hinspiel', text: `${name(m.homeClubId)} – ${name(m.awayClubId)} ${m.result.homeGoals}:${m.result.awayGoals}` };
    const later = g.fixtures.find((x) => x.homeClubId === info.awayId && x.awayClubId === info.homeId);
    return { label: later ? 'Hinspiel' : 'Rückspiel', text: later ? 'Dies ist das Hinspiel – das Rückspiel folgt später in der Saison.' : '–' };
  }
  if (info.stageNote) return { label: 'Modus', text: info.stageNote };
  return { label: 'Modus', text: info.knockout ? 'K.-o.-Spiel – bei Gleichstand Verlängerung und Elfmeterschießen' : '–' };
}

/** Text „Über die Stadt“ – eigene Texte, sonst generisch aus den Daten. */
export function cityAbout(city: string, country: string | undefined, stadium: string, dist: number | null, ownCity: string): PrematchData['about'] {
  const key = canonicalCity(city);
  const hit = CITY_TEXTS_DE[key] ?? CITY_TEXTS_ABROAD[key];
  if (hit) return { city: key, tags: hit[0], text: hit[1], generic: false };
  const land = country ? countryDe(country) : isGermanCity(city) ? 'Deutschland' : '';
  const parts = [`${key}${land ? ` liegt in ${land}` : ''}${dist != null && dist > 5 ? `, rund ${Math.round(dist / 10) * 10} km Luftlinie von ${ownCity} entfernt` : ''}.`];
  if (stadium) parts.push(`Der Verein trägt seine Heimspiele im ${stadium} aus.`);
  return { city: key, tags: country ? 'dm' : 'f', text: parts.join(' '), generic: true };
}

const COUNTRY_DE: Record<string, string> = {
  Oesterreich: 'Österreich', Daenemark: 'Dänemark', Tuerkei: 'der Türkei', Rumaenien: 'Rumänien', Schweiz: 'der Schweiz',
  Niederlande: 'den Niederlanden', Tschechoslowakei: 'der Tschechoslowakei', Sowjetunion: 'der Sowjetunion', Slowakei: 'der Slowakei',
  Ukraine: 'der Ukraine',
};
const countryDe = (c: string) => COUNTRY_DE[c] ?? c;

export function buildPrematch(g: Game, info: OwnMatchInfo): PrematchData {
  ensureClubs(g, info);
  const ranks = strengthRanks(g);
  const home = sideOf(g, info.homeId, ranks, g.table.rows.length);
  const away = sideOf(g, info.awayId, ranks, g.table.rows.length);
  const opp = home.mine ? away : home;
  const own = home.mine ? home : away;
  const homeClub = g.clubs[info.homeId];
  const weather = forecastWeather(info.date, info.homeId);
  const capacity = homeClub?.stadium.capacity ?? 0;
  const expected = homeClub ? Math.min(capacity, expectedCrowd(homeClub, g.clubs[info.awayId], info, weather)) : 0;
  const distance = home.geo && away.geo ? distanceKm(home.geo, away.geo) : null;
  const deOnly = isGermanCity(home.city) && isGermanCity(away.city) && !home.country && !away.country;
  const stadium = homeClub?.stadium.name ?? '';
  const oppStadium = g.clubs[opp.id]?.stadium.name ?? '';
  return {
    info, home, away, opp, stadium, capacity, expected, weather,
    weatherLabel: WEATHER_DE[weather].label, weatherNote: WEATHER_DE[weather].note,
    distance, mapKind: deOnly ? 'de' : 'eu',
    firstLeg: firstLegOf(g, info),
    h2h: h2hRows(g, info, opp.id),
    h2hScope: H2H_SCOPE[info.kind].label,
    about: cityAbout(opp.city, opp.country, oppStadium, distance, own.city),
    year: yearOf(info.date),
  };
}
