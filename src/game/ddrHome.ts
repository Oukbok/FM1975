// =============================================================================
// DDR als Heimatland (Wunsch Pascal: Start 1975–1990 in DDR-Oberliga oder DDR-Liga)
// -----------------------------------------------------------------------------
// Aufbau: Das Spiel bleibt technisch ein deutsches Spiel (homeCountry fehlt = 'ger'),
// die Spielerliga ist aber die DDR-Oberliga (Ebene 101) bzw. die DDR-Liga (102); die
// Bundesliga und ihr Unterbau laufen simuliert im Hintergrund – wie bei einem Start in
// der 2. Liga. Markierung `game.ddrHome`. Anzeige (Währung Mark der DDR, Namen
// ostdeutsch, Länderliste) über `applyHomeModules`.
// Regeln: Punkteregel wie in der DDR (2 Punkte), keine Wechsel aus dem Westen/Ausland
// vor dem Mauerfall (9.11.1989), Europapokal-Starter aus den Weltdaten, danach
// Meister/FDGB-Pokalsieger/Plätze der Oberliga. Zur Saison 1991/92 verteilt die
// Reform `reform-1991-reunification` (data/reformTransition.ts migrate1991) die
// Vereine in die gesamtdeutsche Pyramide; danach entfällt `ddrHome`.
// =============================================================================
import { DDR_LIGA_ID, DDR_LIGA_SEEDS, DDR_OBERLIGA_ID, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import type { EuroCompId } from '../data/europe';
import { COUNTRY_BY_CC, countryOrigin } from '../data/world/countries';
import { realClub, realClubName } from '../data/world/index';
import { setHomeOrigin } from '../data/origins';
import { setHomeCurrency } from '../engine/economy';
import { isForeignId } from '../engine/world';
import type { SimClub } from '../engine/leagues';
import { makeMessage, pushMessage } from '../engine/messages';
import { ddrSeedsFor } from './worldCompose';
import type { Game } from './state';

/** Mauerfall: ab diesem Tag sind Wechsel zwischen Ost und West möglich. */
export const DDR_OPEN_DATE = '1989-11-09';
/** Letzte Startsaison in der DDR (1990/91). */
export const DDR_LAST_START = 1990;

export const isDdrHome = (g: { ddrHome?: true }): boolean => !!g.ddrHome;

/** Ebene der DDR-Ligen im Spiel (101/102) → Ligaebene 1/2 (Finanzen, Kader, Ziele). */
export const levelOfTier = (t: number): number => (t > 100 && t < 109 ? t - 100 : t);

/** Ist der Verein ein DDR-Verein (Sim-Verein mit Kennung, DDR-ID oder voller Verein eines DDR-Spiels)? */
export function isDdrClub(g: Pick<Game, 'simClubs' | 'clubs'> & { ddrHome?: true }, id: string): boolean {
  if (!id) return false;
  if (g.simClubs?.[id]?.ddr) return true;
  if (/^(ddr|gdr)-/.test(id) || /^res-(ddr|gdr)-/.test(id)) return true;
  return !!g.ddrHome && !!g.clubs?.[id] && !g.clubs[id].guest && !isForeignId(id); // Gastverein = Bundesligist (game/worldSquad.ts)
}

/** DDR-Grenze noch zu? (nur bei DDR-Start) */
export function ddrBorderClosed(g: { ddrHome?: true }, today: string): boolean {
  return !!g.ddrHome && today < DDR_OPEN_DATE;
}

/** Grund, warum ein DDR-Verein den Spieler nicht holen darf (sonst null). */
export function ddrTransferBlocker(g: Game, clubId: string, today: string): string | null {
  if (!ddrBorderClosed(g, today)) return null;
  if (isDdrClub(g, clubId)) return null;
  return 'Vor dem Mauerfall (November 1989) dürfen DDR-Vereine keine Spieler aus dem Westen oder dem Ausland verpflichten.';
}

/** Anzeige-Module (Währung, Herkunft der Spielernamen) passend zum Spielstand setzen. */
export function applyHomeModules(g: { ddrHome?: true; homeCountry?: string; managedClubId?: string; clubs?: Record<string, { city?: string } | undefined> }): void {
  if (g.ddrHome) {
    setHomeCurrency('gdr'); // Mark der DDR bis 30.6.1990, danach D-Mark (data/currencies.ts)
    setHomeOrigin(countryOrigin('gdr'));
  } else {
    // Stadt des eigenen Vereins: Nachfolgestaat nach der Auflösung von ČSSR/UdSSR/Jugoslawien (data/currencySuccessors.ts).
    setHomeCurrency(g.homeCountry, g.managedClubId ? g.clubs?.[g.managedClubId]?.city : undefined);
    setHomeOrigin(g.homeCountry && g.homeCountry !== 'ger' ? countryOrigin(g.homeCountry) : null);
  }
}

/** DDR-Ligen zum Start (Weltdaten, sonst Vereine von 1975) – gleiche Quelle für Assistent und Spiel. */
export function ddrStartSeeds(year: number): { ober: SimClub[]; liga: SimClub[] } {
  const s = ddrSeedsFor(year);
  if (s) return s;
  const liga = DDR_LIGA_SEEDS.map((x) => ({ ...x }));
  return { ober: DDR_OBERLIGA_SEEDS.map((x) => ({ ...x })), liga };
}

/** In welcher DDR-Liga spielt der Verein zum Start? */
export function ddrLeagueOf(year: number, clubId: string): typeof DDR_OBERLIGA_ID | typeof DDR_LIGA_ID | null {
  const s = ddrStartSeeds(year);
  if (s.ober.some((c) => c.id === clubId)) return DDR_OBERLIGA_ID;
  if (s.liga.some((c) => c.id === clubId)) return DDR_LIGA_ID;
  return null;
}

/** Städte der DDR für die Amateure im FDGB-Pokal (Weltdaten-Vereine ohne Ligaplatz). */
export function ddrAmateurTowns(used: Set<string>): string[] {
  const out: string[] = [];
  const seen = new Set(used);
  const ids = ['gdr-wismar', 'gdr-schwerin', 'gdr-greifswald', 'gdr-guestrow', 'gdr-torgelow', 'gdr-bergen', 'gdr-eberswalde', 'gdr-hennigsdorf', 'gdr-fuerstenwalde',
    'gdr-dessau', 'gdr-eisleben', 'gdr-wernigerode', 'gdr-blankenburg', 'gdr-wittenberge', 'gdr-werdau', 'gdr-plauen', 'gdr-bautzen', 'gdr-suhl', 'gdr-zeitz',
    'gdr-soemmerda', 'gdr-nordhausen', 'gdr-weimar', 'gdr-hermsdorf', 'gdr-ilmenau', 'gdr-schwedt', 'gdr-neustrelitz', 'gdr-halberstadt', 'gdr-senftenberg',
    'gdr-zittau', 'gdr-altenburg', 'gdr-weida', 'gdr-thale', 'gdr-wolgast', 'gdr-demmin', 'gdr-luebben', 'gdr-weissenfels'];
  for (const id of ids) {
    const city = realClub('gdr', id)?.city;
    if (!city || seen.has(city)) continue;
    seen.add(city); out.push(city);
  }
  return out;
}

/** Tabelle (Reihenfolge) der DDR-Oberliga der abgelaufenen Saison. */
function oberOrder(g: Game): string[] {
  if (g.leagues.playerDivision.id === DDR_OBERLIGA_ID) return g.table.rows.map((r) => r.clubId);
  return g.leagues.otherDivisions.find((d) => d.id === DDR_OBERLIGA_ID)?.table.rows.map((r) => r.clubId) ?? [];
}

/**
 * Europapokal-Starter der DDR aus der abgelaufenen Saison: Meister (Landesmeister), FDGB-Pokalsieger
 * (sonst Finalist, sonst nächster Platz) in den Pokalsieger-Wettbewerb, die nächsten zwei Plätze in den
 * UEFA-Pokal (historisch meist zwei, Quelle: Weltdaten `euro` 1975–1990). Gilt auch für 1991/92
 * (Starter aus der NOFV-Oberliga 1990/91).
 */
export function ddrEuroQualifiers(g: Game): Record<EuroCompId, string[]> {
  const order = oberOrder(g).filter((id) => !id.startsWith('res-'));
  const out: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  if (!order.length) return out;
  const taken = new Set<string>();
  const next = () => { const id = order.find((x) => !taken.has(x)); if (id) taken.add(id); return id; };
  const c = next(); if (c) out.ec.push(c);
  const winner = g.cup?.winnerClubId ?? null;
  const fin = g.cup?.rounds[g.cup.rounds.length - 1]?.ties[0];
  const finalist = fin?.winnerClubId ? (fin.winnerClubId === fin.homeClubId ? fin.awayClubId : fin.homeClubId) : null;
  const ok = (id: string | null) => !!id && !taken.has(id) && !id.startsWith('am') && (!!g.clubs[id] || !!g.simClubs[id]);
  const cw = ok(winner) ? winner! : ok(finalist) ? finalist! : next();
  if (cw) { taken.add(cw); out.cwc.push(cw); }
  for (let i = 0; i < 2; i++) { const id = next(); if (id) out.uefa.push(id); }
  return out;
}

/** Zwei Starterlisten zusammenführen (ohne Doppelte). */
export function mergeQualifiers(a: Record<EuroCompId, string[]>, b: Record<EuroCompId, string[]>): Record<EuroCompId, string[]> {
  const used = new Set<string>();
  const out: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  for (const src of [a, b]) for (const k of ['ec', 'cwc', 'uefa'] as EuroCompId[]) for (const id of src[k] ?? []) if (!used.has(id)) { used.add(id); out[k].push(id); }
  return out;
}

/** Wiedervereinigung (Saisonwechsel 1991/92): Heimatland wird Deutschland. */
export function ddrReunifyHome(g: Game, ownTierName: string): void {
  if (!g.ddrHome) return;
  delete g.ddrHome;
  applyHomeModules(g);
  const name = g.clubs[g.managedClubId]?.name ?? 'Dein Verein';
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'milestone', from: 'Fußball-Chronik',
    subject: 'Wiedervereinigung: Willkommen im gesamtdeutschen Fußball',
    shortText: `${name} spielt ab sofort im gesamtdeutschen Ligasystem (${ownTierName}).`,
    bodyText: `Mit der Saison 1991/92 ist das Ligasystem der DDR Geschichte. Nach dem Endstand der Oberliga 1990/91 spielen Meister und Vizemeister in der 1. Liga, die Plätze 3 bis 8 in der 2. Liga, alle übrigen in der NOFV-Oberliga (dritte Ebene).\n\n${name} tritt in der ${ownTierName} an. Ab jetzt gelten die Regeln des gesamtdeutschen Fußballs: D-Mark, DFB-Pokal, freier Transfermarkt.`,
  }));
}

/** Name des Heimatlandes für Anzeigen (DDR solange `ddrHome`). */
export function homeLandName(g: { ddrHome?: true; homeCountry?: string }): string {
  return g.ddrHome ? 'DDR' : COUNTRY_BY_CC[g.homeCountry ?? 'ger']?.name ?? 'Deutschland';
}

/** Umbenennungen der DDR-Vereine (Weltdaten `rename`, z. B. Karl-Marx-Stadt → Chemnitz 1990) zum Saisonwechsel nachführen. */
export function ddrRenameClubs(g: Game, year: number): void {
  for (const c of [...Object.values(g.clubs), ...Object.values(g.simClubs)]) {
    if (!isDdrClub(g, c.id)) continue;
    const rc = realClub('gdr', c.id);
    if (!rc?.rename?.length) continue;
    const n = realClubName(rc, year);
    if (n && n !== c.name) c.name = n;
  }
}
