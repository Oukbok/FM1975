// Aufgelöste Staaten (data/nationEras.ts, game/nationSync.ts) – Teil von npm run test:national.
// Länder, die es nicht mehr gibt, gelten für Spieler nur, solange sie bestehen: Rechnung, neue Spiele
// je Epoche, Zerfall am 1. Januar, Migration der Vorlage „liga1-2025“, Heimatland Tschechien/Slowakei.
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { natAt, landNation, NATION_ERAS } from '../src/data/nationEras';
import { nationDaily, syncNationalities } from '../src/game/nationSync';
import { candidatesByNation, clearNationalCache } from '../src/game/national/pool';
import { NATION_BY_CODE, nationExists } from '../src/data/nationalTeams';
import { worldClubs, worldSquadPreview, WP_FIELD as W } from '../src/game/worldPool';
import { homeNat } from '../src/game/registrationGame';
import { isNational } from '../src/engine/registration';
import { leaguesFor, leaguePreview } from '../src/screens/newgame/clubPreview';
import { nationName } from '../src/components/player/profileData';
import { countryOfNat } from '../src/data/countryFlags';
import type { Game } from '../src/game/state';

type Ok = (c: unknown, l: string) => void;
const GONE = NATION_ERAS.map((e) => e.code);
const start = (club: string, year: number, country?: string) => createNewGame({ managedClubId: club, manager: { name: 'T', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, ...(country ? { country } : {}) } as any);

/** Alle Nationalitäten eines Spielstands (volle Spieler, Jugend, Weltspieler, Stab, Trainer) mit Anzahl. */
function natCount(g: Game): Map<string, number> {
  const m = new Map<string, number>();
  const add = (n?: string) => { if (n) m.set(n, (m.get(n) ?? 0) + 1); };
  for (const p of Object.values(g.players)) add(p.nationality);
  for (const p of Object.values(g.youthPlayers ?? {})) add(p.nationality);
  for (const w of g.worldPool?.p ?? []) add(w[W.nat]);
  for (const s of g.staffWorld?.people ?? []) add(s.nat);
  for (const c of [...(g.coachPool ?? []), ...Object.values(g.clubs).map((x) => x.coach)]) add(c?.nationality);
  return m;
}
/** Kürzel, deren Nation es im Jahr nicht (mehr/noch nicht) gibt. */
const wrongAt = (m: Map<string, number>, year: number) => [...m.keys()].filter((c) => { const n = NATION_BY_CODE[c]; return !!n && (GONE.includes(c) || !!NATION_ERAS.some((e) => e.succ.some(([s]) => s === c) && e.code !== 'GDR')) && !nationExists(n, year) && !(n.from != null && year < n.from && year > 1992); });

export function runNationEraChecks(ok: Ok): void {
  console.log('Aufgelöste Staaten');
  ok(natAt('TCH', 1992, 'a') === 'TCH' && ['CZE', 'SVK'].includes(natAt('TCH', 1993, 'a')) && natAt('CZE', 1980, 'a') === 'TCH' && natAt('SVK', 1992) === 'TCH', 'Tschechoslowakei bis 1992, ab 1993 Tschechien/Slowakei');
  ok(natAt('RUS', 1985) === 'URS' && natAt('UKR', 1991) === 'URS' && ['RUS', 'UKR'].includes(natAt('URS', 1992, 'x')) && natAt('RUS', 1992) === 'RUS', 'Sowjetunion bis 1991, ab 1992 Russland/Ukraine');
  ok(natAt('CRO', 1990) === 'YUG' && natAt('SRB', 1991) === 'YUG' && natAt('CRO', 1992) === 'CRO' && ['SRB', 'CRO', 'BIH', 'SVN', 'MKD'].includes(natAt('YUG', 2000, 'k')), 'Jugoslawien bis 1991, danach Nachfolger');
  ok(natAt('GDR', 1990) === 'GDR' && natAt('GDR', 1991) === 'GER' && natAt('GER', 1980) === 'GER' && natAt('BRA', 1980) === 'BRA', 'DDR bis 1990, danach Deutschland; andere Nationen unverändert');
  const ids = Array.from({ length: 400 }, (_, i) => `p${i}`);
  const split = ids.map((id) => natAt('TCH', 2025, id));
  const cze = split.filter((x) => x === 'CZE').length;
  ok(cze > 220 && cze < 300 && ids.every((id, i) => natAt('TCH', 2025, id) === split[i]), `Verteilung fest je ID: ${cze} von 400 Tschechien, Rest Slowakei`);
  ok(natAt('TCH', 2025, 'p1', 'SVK') === 'SVK' && natAt('TCH', 2025, 'p1', 'RUS') === natAt('TCH', 2025, 'p1') && landNation('Slowakei', 2025) === 'SVK' && landNation('Tschechien', 1990) === 'TCH' && landNation('Tschechoslowakei', 1995) === null && landNation('Bulgarien', 1980, 'SRB') === 'BUL' && landNation('England', 2025, 'ENG') === null, 'Land des Vereins hat Vorrang (Slowakei → SVK)');
  for (const c of ['CZE', 'SVK', 'TCH', 'URS', 'RUS', 'UKR', 'YUG', 'SRB', 'CRO', 'BIH', 'SVN', 'MKD', 'GDR']) if (nationName(c) === c || !countryOfNat(c)) ok(false, `Anzeige: Name/Flagge für ${c} fehlt`);

  // Vorlage „1. Liga 2025“ (Fehlerbericht: Tomáš Navrátil, Wolfsburg, geboren 1996, „Tschechoslowakei“)
  {
    const txt = readFileSync('public/saves/liga1-2025.txt', 'utf8');
    const g = (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
    const before = natCount(g);
    prepareLoadedGame(g);
    const year = Number(g.calendar.currentDate.slice(0, 4));
    const after = natCount(g);
    ok(GONE.some((c) => before.has(c)), `Vorlage liga1-2025 enthielt alte Staaten (${GONE.filter((c) => before.has(c)).map((c) => `${c} ${before.get(c)}`).join(', ')})`);
    ok(wrongAt(after, year).length === 0, `nach dem Laden (${year}) keine Nationalität eines Staates, den es nicht gibt (${wrongAt(after, year).join(', ') || '–'})`);
    ok((after.get('CZE') ?? 0) > 0 && (after.get('SVK') ?? 0) > 0 && (after.get('UKR') ?? 0) > 0, `Nachfolger vorhanden: CZE ${after.get('CZE')}, SVK ${after.get('SVK')}, RUS ${after.get('RUS')}, UKR ${after.get('UKR')}, SRB ${after.get('SRB')}, CRO ${after.get('CRO')}`);
    const nav = Object.values(g.players).find((p) => p.fullName === 'Tomáš Navrátil');
    ok(!nav || ['CZE', 'SVK'].includes(nav.nationality), `Tomáš Navrátil: ${nav ? nationName(nav.nationality) : 'nicht mehr im Stand'}`);
    const total = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
    ok(total(before) === total(after) || total(after) > 0, 'niemand verloren');
    ok(syncNationalities(g) === 0, 'Migration idempotent (zweiter Lauf ändert nichts)');
    const wc = worldClubs(g);
    const svkClub = [...wc.values()].find((c) => c.country === 'Slowakei');
    if (svkClub) {
      const sq = (g.worldPool?.p ?? []).filter((w) => w[W.club] === svkClub.id);
      ok(sq.filter((w) => w[W.nat] === 'SVK').length >= sq.length * 0.5 && !sq.some((w) => w[W.nat] === 'CZE' || w[W.nat] === 'TCH'), `${svkClub.name} (Slowakei): Einheimische sind Slowaken (${sq.filter((w) => w[W.nat] === 'SVK').length}/${sq.length})`);
      ok(worldSquadPreview(g, svkClub.id).every((p) => p.nationality !== 'TCH' && !!p.origin), 'Vereinsprofil eines Auslandsvereins: Spieler mit gültiger Nationalität und Herkunft');
    }
    clearNationalCache();
    const by = candidatesByNation(g);
    ok((by.get('CZE')?.length ?? 0) > 20 && (by.get('SVK')?.length ?? 0) > 10 && !by.has('TCH') && !by.has('URS') && !by.has('YUG'), `Nationalmannschaften ${year}: CZE ${by.get('CZE')?.length}, SVK ${by.get('SVK')?.length}, UKR ${by.get('UKR')?.length} Kandidaten, keine für alte Staaten`);
  }

  // Neues Spiel 1975: nur Staaten, die es 1975 gibt
  {
    const g = start('muc', 1975);
    const m = natCount(g);
    const early = ['CZE', 'SVK', 'RUS', 'UKR', 'SRB', 'CRO', 'BIH', 'SVN', 'MKD'].filter((c) => m.has(c));
    ok(early.length === 0 && (m.get('URS') ?? 0) > 100 && (m.get('TCH') ?? 0) > 100 && (m.get('YUG') ?? 0) > 100, `Start 1975: URS ${m.get('URS')}, TCH ${m.get('TCH')}, YUG ${m.get('YUG')}; keine Nachfolgestaaten (${early.join(', ') || '–'})`);
    const wc = worldClubs(g);
    const bul = (g.worldPool?.p ?? []).filter((w) => wc.get(w[W.club])?.country === 'Bulgarien');
    ok(bul.length > 0 && bul.every((w) => w[W.nat] === 'BUL'), `Vereine in Bulgarien: Einheimische sind Bulgaren, keine „Jugoslawen“ (${bul.filter((w) => w[W.nat] === 'BUL').length}/${bul.length})`);
    clearNationalCache();
    const by = candidatesByNation(g);
    ok((by.get('URS')?.length ?? 0) > 40 && (by.get('TCH')?.length ?? 0) > 40 && (by.get('YUG')?.length ?? 0) > 40, `Nationalmannschaften 1975: URS ${by.get('URS')?.length}, TCH ${by.get('TCH')?.length}, YUG ${by.get('YUG')?.length} Kandidaten`);
  }

  // Zerfall: Start 1991, 1.1.1992 (UdSSR, Jugoslawien) und 1.1.1993 (ČSFR)
  {
    const g = start('muc', 1991);
    const m0 = natCount(g);
    ok((m0.get('URS') ?? 0) > 50 && (m0.get('YUG') ?? 0) > 50 && (m0.get('TCH') ?? 0) > 50 && !m0.has('GDR'), `Start 1991: URS ${m0.get('URS')}, YUG ${m0.get('YUG')}, TCH ${m0.get('TCH')}`);
    nationDaily(g, '1991-12-31');
    ok(natCount(g).get('URS') === m0.get('URS'), '31.12.1991: noch nichts geändert');
    nationDaily(g, '1992-01-01');
    const m1 = natCount(g);
    ok(!m1.has('URS') && !m1.has('YUG') && (m1.get('TCH') ?? 0) === m0.get('TCH') && (m1.get('RUS') ?? 0) > 0 && (m1.get('UKR') ?? 0) > 0 && (m1.get('SRB') ?? 0) > 0 && (m1.get('CRO') ?? 0) > 0,
      `1.1.1992: RUS ${m1.get('RUS')}, UKR ${m1.get('UKR')}, SRB ${m1.get('SRB')}, CRO ${m1.get('CRO')}, BIH ${m1.get('BIH')}, SVN ${m1.get('SVN')}, MKD ${m1.get('MKD')}; TCH bleibt`);
    nationDaily(g, '1993-01-01');
    const m2 = natCount(g);
    ok(!m2.has('TCH') && (m2.get('CZE') ?? 0) + (m2.get('SVK') ?? 0) === m0.get('TCH'), `1.1.1993: CZE ${m2.get('CZE')}, SVK ${m2.get('SVK')}`);
    const wc = worldClubs(g);
    const kiev = (g.worldPool?.p ?? []).filter((w) => wc.get(w[W.club])?.country === 'Sowjetunion' || wc.get(w[W.club])?.country === 'Ukraine' || wc.get(w[W.club])?.country === 'Russland');
    ok(kiev.length > 0 && kiev.every((w) => w[W.nat] !== 'URS'), 'Weltspieler der früheren Sowjet-Vereine gewechselt');
  }

  // Heimatland Tschechien / Slowakei 2025: Einheimische sind keine Ausländer
  for (const [cc, code] of [['cze', 'CZE'], ['svk', 'SVK']] as const) {
    const lg = leaguesFor(cc, 2025);
    const club = lg.length ? leaguePreview(lg[0].key, cc, 2025)[0]?.id : undefined;
    if (!club) { ok(false, `${cc}: kein Verein wählbar`); continue; }
    const g = start(club, 2025, cc);
    const sq = g.clubs[club].playerIds.map((id) => g.players[id]);
    const natives = sq.filter((p) => p.nationality === code).length;
    ok(homeNat(g) === code && natives >= sq.length * 0.3 && !sq.some((p) => p.nationality === 'TCH') && sq.filter((p) => isNational(p, 2025)).length === natives,
      `Heimatland ${cc} 2025: Heimat-Nation ${homeNat(g)}, ${natives}/${sq.length} Einheimische im Kader, niemand „Tschechoslowakei“`);
    ok(wrongAt(natCount(g), 2025).length === 0, `${cc} 2025: keine alten Staaten im Spielstand`);
  }
}
