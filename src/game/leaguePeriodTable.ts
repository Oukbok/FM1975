// =============================================================================
// ABSCHLUSSTABELLE EINES FRÜHEREN ZEITRAUMS (Statistiken › Ligensystem, Wunsch Pascal)
// -----------------------------------------------------------------------------
// Linke Liste der Ligapyramide in einem früheren Zeitraum bzw. beim letzten Stand einer
// archivierten Liga: Abschlusstabelle der letzten Saison des Zeitraums – aus denselben Quellen
// wie Statistiken › Liga (game/competitionCountry.ts: Liga-Archiv, Welt-Historie, Weltdaten vor
// dem Startjahr). Die Liga wird über ihren Namen gefunden (gleiche Namen wie in der Pyramide,
// data/leagueNames.ts), die 1. Ebene notfalls über die Ebene. Fehlt die Saison im Spielstand
// (Archiv begrenzt, vor dem Spielbeginn), liefert sie einen Hinweis statt einer Tabelle.
// =============================================================================
import { COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { countryOptions, countrySeasons, countrySnapshot, statsCountries } from './competitionCountry';
import { compClubName } from './competitionView';
import type { LeaguePeriod, PyrPick } from './leaguePeriods';
import type { PyrDivision, PyrFinal } from './leaguePyramid';
import { homeCountryOf, type Game } from './state';

const GREY = { primary: '#8a8a8a', secondary: '#ffffff' };

export function periodFinalTable(g: Game, pick: PyrPick, p: LeaguePeriod, d: PyrDivision): PyrFinal | null {
  if (d.pool) return null;
  const season = seasonLabelOf(p.to);
  const cc = pick.side === 'ddr' ? 'gdr' : pick.side === 'west' ? homeCountryOf(g) : COUNTRY_BY_KEY[pick.country]?.cc ?? pick.country;
  const sc = statsCountries(g).find((c) => c.cc === cc);
  const missing = (why: string): PyrFinal => ({ caption: `Abschlusstabelle ${season}`, hint: why });
  if (!sc) return missing('Für dieses Land liegen in diesem Spielstand keine Tabellen vor.');
  const opt0 = countrySeasons(g, sc).find((s) => s.season === season && s.source !== 'roster' && s.source !== 'live');
  const start = g.startYear ?? 1975;
  const archived = `Die Abschlusstabelle ${season} ist in diesem Spielstand nicht mehr gespeichert – das Archiv bewahrt nur die jüngeren Saisons auf. Meister und Endplätze der Vereine stehen weiter in der Vereins-Historie.`;
  if (!opt0) {
    return missing(p.to < start
      ? `Die Saison ${season} lag vor dem Spielbeginn ${seasonLabelOf(start)} – ihre Abschlusstabelle kennt dieser Spielstand nicht.`
      : archived);
  }
  const opts = countryOptions(g, sc, season, opt0.source).filter((o) => o.kind === 'league');
  const tierOf = (t?: number) => (t == null ? undefined : t >= 100 ? t % 100 : t);
  const opt = opts.find((o) => o.label === d.name)
    ?? (d.level === 1 ? opts.find((o) => tierOf(o.tier) === 1) : undefined)
    ?? (opts.filter((o) => tierOf(o.tier) === d.level).length === 1 ? opts.find((o) => tierOf(o.tier) === d.level) : undefined);
  if (!opt) return missing(d.level === 1 ? archived : `Für ${d.name} liegt zur Saison ${season} keine Abschlusstabelle vor – das Spiel bewahrt für frühere Saisons vor allem die oberen Ligen auf.`);
  const snap = countrySnapshot(g, sc, season, opt0.source, opt.key);
  const rows = [...(snap?.table ?? [])].sort((a, b) => a.pos - b.pos);
  if (!rows.length) return missing(archived);
  const placings = !!snap?.placingsOnly;
  return {
    caption: placings ? `Endstand ${season} · nur Platzierungen` : `Abschlusstabelle ${season}`,
    clubs: rows.map((r) => {
      const id = r.clubId;
      const full = g.clubs[id] ?? g.simClubs[id];
      const euro = g.euroClubs?.[id] ?? g.euroClubs?.[id.replace(/^w_/, '')];
      const colors = full?.colors ?? euro?.colors ?? GREY;
      return {
        id, name: compClubName(g, id, season), shortName: full?.shortName ?? '', city: full?.city ?? euro?.city ?? '',
        colors, strength: 0, dotOnly: !full, pts: placings ? undefined : r.pts,
      };
    }),
  };
}
