// =============================================================================
// Andere Kontinente + Weltpokal/Klub-WM ohne UI (npm run test:continents):
//  1. Langlauf 40+ Saisons Hintergrund (Meister je Land, Kontinentalpokale, Weltpokal/Klub-WM
//     mit Europas Landesmeister aus der Hintergrund-Welt): Format je Epoche, Rechenzeit, Speicher.
//  2. Eigener Verein als Europapokalsieger je Epoche (1977 Hin/Rück, 1985 Tokio, 1999 Klub-WM 2000,
//     2010 sieben Teams, 2024 Interkontinentalpokal, 2025 große Klub-WM): Termine im Kalender, Vorschau,
//     Textmodus-Vorbereitung, eigenes Spiel über findOwnMatchDue, Speichern/Laden davor und danach,
//     Spielbericht, Prämie, Titel in der Vitrine.
//  3. Alter Spielstand (Vorlage ohne Kontinente): Laden + Saisonwechsel rüsten nach, keine Fehler.
//  4. Speicher: Spielstand mit 40 Jahren Kontinent-Historie gegen ohne (Ziel < +3 %).
// =============================================================================
import { readFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findMatch, findOwnMatchDue, quickSimOwnMatch, createOwnMatchSim } from '../src/game/ownMatch';
import { buildPrematch } from '../src/game/prematch';
import { startNextSeason } from '../src/game/season';
import { saveGame, loadGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import type { Game } from '../src/game/state';
import { continentsState, ensureContinents, nationalChampion } from '../src/game/continents';
import { icState, icStateOf, setupIntercontinental } from '../src/game/intercontinental';
import { icPlansFor } from '../src/data/world/continents/intercontinental';
import { CONTINENTS, CT_COUNTRIES, isContinentalId } from '../src/data/world/continents';
import { titlesOf } from '../src/game/clubRecords';
import { trophiesOf } from '../src/game/trophyCabinet';
import { clubStrength, drawClubName } from '../src/game/cupDraw';
import { ownFixtureOn } from '../src/game/euroFixture';
import { worldCompSeasons, worldCompSnapshot, worldCompWinners } from '../src/game/worldCupsView';
import { continentProfile } from '../src/game/continentProfile';
import { countryRef } from '../src/game/countryProfile';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; }, clear: () => store.clear(),
};
let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const ui: DayUi = { onOwnMatchDue() {}, onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
const make = (year: number, club = 'muc', hist = 'medium') => {
  const g = createNewGame({ managedClubId: club, manager: { name: 'T', nationality: 'GER', birthYear: year - 35, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, historyMode: hist } as any);
  (g as any).simAutoManage = true;
  return g;
};
const lz = (g: Game) => compressToUTF16(JSON.stringify(g)).length;

// ---------------------------------------------------------------------------
// 1) Langlauf Hintergrund: 1975 → 2034 (60 Saisons, mind. 40 gefordert)
// ---------------------------------------------------------------------------
{
  const g = make(1975);
  (g as any).managedClubId = 'x_niemand'; // Hintergrund pur: dein Verein qualifiziert sich sonst über die Rangliste für die große Klub-WM
  const euroTop = () => Object.values(g.euroClubs!).filter((e) => !isContinentalId(e.id)).sort((a, b) => b.strength - a.strength);
  const per: number[] = [];
  const formats = new Map<string, Set<string>>();
  for (let y = 1976; y <= 2034; y++) {
    g.season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
    const t0 = performance.now();
    ensureContinents(g, y);
    const top = euroTop();
    // Europas Spitze wie in einem echten Langlauf (Hintergrund-Welt: ≈ 79 bis 1995, 82 um 2005, 83 heute).
    const lvl = y <= 1995 ? 79 : y <= 2005 ? 79 + ((y - 1995) * 3) / 10 : Math.min(83, 82 + (y - 2005) / 20);
    top.slice(0, 8).forEach((e, i) => { e.strength = lvl - i * 0.5; });
    setupIntercontinental(g, { ec: top[(y * 7) % 6].id, ecRu: top[((y * 7) % 6) + 1].id });
    per.push(performance.now() - t0);
    for (const p of icPlansFor(y)) (formats.get(p.format) ?? formats.set(p.format, new Set()).get(p.format)!).add(String(y));
  }
  const st = continentsState(g)!;
  const ic = icState(g);
  ok(per.length >= 40, `Langlauf: ${per.length} Saisons`);
  const avg = per.reduce((a, b) => a + b, 0) / per.length;
  ok(avg < 25, `Rechenzeit je Saison Ø ${avg.toFixed(2)} ms (max ${Math.max(...per).toFixed(1)} ms)`);
  // Meister je Land jedes Jahr mit Liga
  const bra = [1980, 1995, 2010, 2030].map((y) => nationalChampion(g, 'bra', y));
  ok(bra.every(Boolean), `Brasilien-Meister: ${bra.map((id) => drawClubName(g, id!)).join(', ')}`);
  const usaGap = nationalChampion(g, 'usa', 1990);
  ok(!usaGap && nationalChampion(g, 'usa', 1980) && nationalChampion(g, 'usa', 2000), 'USA: Meister 1980/2000, keine Liga 1990');
  // Kontinentalpokale je Epoche
  const cupYears = (k: keyof typeof CONTINENTS) => Object.keys(st.cups).filter((y) => st.cups[+y][k]).length;
  ok(cupYears('sa') >= 55 && cupYears('af') >= 55, `Kontinentalpokale: SA ${cupYears('sa')}, AF ${cupYears('af')}, AS ${cupYears('as')}, NA ${cupYears('na')}, OC ${cupYears('oc')}`);
  ok(!st.cups[1980]?.as && st.cups[1990]?.as && !st.cups[1990]?.oc && st.cups[2010]?.oc, 'Asien 1972–1985 ohne Pokal, Ozeanien erst später');
  ok(!st.cups[2010]?.oc?.t?.some((id) => id.includes('_aus_')) && st.cups[2010]?.as, 'Australien ab 2006 in Asien');
  // Formate je Epoche im Archiv
  const arc = (y: number, key: string) => ic.archive.filter((a) => a.season.startsWith(`${y}/`) && a.key === key);
  const wp76 = arc(1976, 'wp')[0], wp85 = arc(1985, 'wp')[0];
  ok(wp76 && wp76.format === 'legs2' && (wp76.winner ? wp76.score.includes(',') : !!wp76.note), `1976 Weltpokal Hin/Rück: ${wp76?.winner ? `${drawClubName(g, wp76.winner)} ${wp76.score}` : wp76?.note}`);
  ok(wp85?.format === 'tokyo' && !wp85.score.includes(','), `1985 Weltpokal Tokio: ${drawClubName(g, wp85?.winner ?? '')} ${wp85?.score}`);
  const c99 = arc(1999, 'cwc')[0];
  ok(c99?.format === 'cwc2000' && arc(1999, 'wp').length === 1, `1999/2000: Weltpokal + Klub-WM 2000 (${c99?.format}), Sieger ${drawClubName(g, c99?.winner ?? '')}`);
  ok(!arc(2001, 'cwc').length && arc(2001, 'wp').length === 1, '2001: keine Klub-WM, Weltpokal in Tokio');
  ok(arc(2005, 'cwc')[0]?.format === 'six' && !arc(2005, 'wp').length, '2005: Klub-WM mit 6 Teams, kein Weltpokal mehr');
  ok(arc(2015, 'cwc')[0]?.format === 'seven', `2015: Klub-WM mit 7 Teams (Gastgeber), Sieger ${drawClubName(g, arc(2015, 'cwc')[0]?.winner ?? '')}`);
  ok(arc(2024, 'icup')[0]?.m?.length === 5 && !arc(2024, 'cwc').length, '2024: Interkontinentalpokal (5 Spiele), keine alte Klub-WM');
  const big = arc(2025, 'big')[0];
  ok(big?.m?.length === 63 && big.groups?.length === 8 && arc(2025, 'icup').length === 1, `2025: große Klub-WM 32 Teams (${big?.m?.length} Spiele) + Interkontinentalpokal; Sieger ${drawClubName(g, big?.winner ?? '')}`);
  ok(arc(2029, 'big').length === 1 && !arc(2027, 'big').length, 'große Klub-WM alle vier Jahre (2029 ja, 2027 nein)');
  // Bilanz Europa je Epoche
  for (const [a, b] of [[1976, 1979], [1980, 2004], [2005, 2023], [2024, 2034]]) {
    const l = ic.archive.filter((x) => x.winner && x.key !== 'big' && +x.season.slice(0, 4) >= a && +x.season.slice(0, 4) <= b);
    const eu = l.filter((x) => !isContinentalId(x.winner)).length;
    console.log(`     Europa gewinnt ${a}–${b}: ${eu} von ${l.length} (Südamerika ${l.filter((x) => x.winner.includes('_ct_') && CT_COUNTRIES.find((c) => x.winner.includes(`_${c.cc}_`))?.conf[0][1] === 'sa').length})`);
  }
  // Anzeige
  ok(worldCompSeasons(g, 'cwc').length >= 20 && worldCompSnapshot(g, 'cwc', '2023/24')?.rounds.length === 5, `Statistiken › Welt: Klub-WM mit Saisons und Turnierbaum (2023/24: Play-off bis Finale: ${worldCompSnapshot(g, 'cwc', '2023/24')?.rounds.map((r) => r.name).join(', ')})`);
  ok(worldCompSnapshot(g, 'wp', '1990/91')?.title.startsWith('Weltpokal'), 'Statistiken › Welt: ältere Saison ohne Einzelspiele (nur Sieger/Finale)');
  ok(worldCompSnapshot(g, 'sa', '2030')?.rounds.length === 4, 'Statistiken › Welt: Südamerika-Pokal 2030 mit vier Runden');
  ok(worldCompSnapshot(g, 'cwc', '2025/26')?.groups?.length === 8, 'Statistiken › Welt: Gruppen der großen Klub-WM');
  ok(worldCompWinners(g, 'sa').some((w) => w.pre) && worldCompWinners(g, 'sa').some((w) => !w.pre), 'Siegerliste Südamerika: echte Sieger vor dem Start + gespielte');
  const prof = continentProfile(g, 'Brasilien');
  ok(prof && prof.seasons.length > 40 && prof.clubs.length >= 8, `Länderprofil Brasilien: ${prof?.seasons.length} Meister, ${prof?.clubs.length} Vereine, ${prof?.cupWins.length} Kontinentaltitel`);
  ok(countryRef(g, 'Brasilien').kind === 'continent' && countryRef(g, 'Japan').kind === 'continent', 'Länderprofil: Art „continent“');
  const bytes = JSON.stringify(st).length + JSON.stringify(ic).length;
  console.log(`     Speicher nach ${per.length} Saisons: Kontinente ${JSON.stringify(st).length} B, Weltpokal-Archiv ${JSON.stringify(ic).length} B (roh), komprimiert ${compressToUTF16(JSON.stringify({ st, ic })).length * 2} B`);
  ok(bytes < 120000, `Speicher roh ${bytes} B`);
}

// ---------------------------------------------------------------------------
// 2) Eigener Verein als Europapokalsieger
// ---------------------------------------------------------------------------
async function roundTrip(g: Game, slot: string): Promise<Game> {
  delete (g as any).simAutoManage;
  const okSave = await saveGame(slot, { name: slot, managerName: 'T', clubName: 'T', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g);
  const l = (await loadGame<Game>(slot))!.game;
  prepareLoadedGame(l);
  (l as any).simAutoManage = true;
  if (!okSave) throw new Error('Speichern fehlgeschlagen');
  return l;
}
let wonOnce = false;
for (const [year, key, until, label] of [
  [1977, 'wp', '1977-12-31', 'Weltpokal Hin/Rück'], [1985, 'wp', '1985-12-31', 'Weltpokal Tokio'], [1999, 'cwc', '2000-01-20', 'Klub-WM 2000'],
  [2010, 'cwc', '2010-12-31', 'Klub-WM 7 Teams'], [2024, 'icup', '2024-12-31', 'Interkontinentalpokal'], [2025, 'big', '2025-08-05', 'Klub-WM 32 Teams'],
] as const) {
  let g = make(year);
  const ecRu = Object.values(g.euroClubs!).sort((a, b) => b.strength - a.strength)[0].id;
  setupIntercontinental(g, { ec: 'muc', ecRu });
  const ev = icState(g).events.find((e) => e.key === key);
  ok(ev && ev.teams.includes('muc'), `${year} ${label}: Ereignis mit deinem Verein (${ev?.teams.length} Teams)`);
  if (!ev) continue;
  const cal = g.calendar.events.filter((e) => e.type === 'super_cup' && e.matchId?.startsWith('ic_'));
  const mine = cal.filter((e) => ownFixtureOn(g, e));
  ok(cal.length && mine.length, `${year}: ${cal.length} Termine, eigene ${mine.map((e) => e.date).join(', ')}`);
  ok(!mine.some((e) => g.fixtures.some((f) => (f.homeClubId === 'muc' || f.awayClubId === 'muc') && Math.abs(Date.parse(f.date) - Date.parse(e.date)) < 2 * 86400000)), `${year}: kein Ligaspiel am Vortag/Tag/Folgetag`);
  g = await roundTrip(g, `ct-${year}a`);
  ok(icStateOf(g)?.events.find((e) => e.key === key)?.matches.length === ev.matches.length, `${year}: Speichern/Laden vor dem Spiel`);
  let own = 0, preview = 0, text = 0, guard = 0;
  while (g.calendar.currentDate < until && guard++ < 800) {
    if (processDay(g, ui)) continue;
    const due = findOwnMatchDue(g);
    if (!due) { processDay(g, ui); continue; }
    if (/Weltpokal|Klub-Welt|Interkontinental/.test(due.label)) {
      own++;
      const pm = buildPrematch(g, due);
      if (pm.opp.name && pm.opp.id) preview++;
      if (own === 1) { const sim = createOwnMatchSim(g, due, false); if (sim) text++; if (own === 1) console.log(`     Vorschau: ${pm.home.name} – ${pm.away.name} (${pm.opp.country ?? 'Europa'}, ${pm.distance != null ? Math.round(pm.distance) + ' km' : 'ohne Karte'}), ${due.label}`); }
    }
    quickSimOwnMatch(g, due);
    processDay(g, ui);
  }
  const ev2 = icStateOf(g)!.events.find((e) => e.key === key)!;
  ok(own >= 1 && preview === own && text === 1, `${year}: ${own} eigene Spiele über findOwnMatchDue, Vorschau + Textmodus vorbereitet`);
  ok(ev2.winner && ev2.matches.every((m) => m.played || !m.home), `${year}: Sieger ${drawClubName(g, ev2.winner ?? '')} (${ev2.runnerUp ? drawClubName(g, ev2.runnerUp) : '-'})`);
  const m = ev2.matches.find((x) => x.match && (x.home === 'muc' || x.away === 'muc'));
  ok(m?.match && findMatch(g, m.match.id), `${year}: Spielbericht ${drawClubName(g, m!.home)} – ${drawClubName(g, m!.away)} ${m?.hg}:${m?.ag}`);
  const opp = m ? (m.home === 'muc' ? m.away : m.home) : '';
  if (isContinentalId(opp)) ok(g.clubs[opp]?.playerIds.length >= 18 && g.players[g.clubs[opp].playerIds[0]]?.nationality !== 'GER', `${year}: Gegnerkader ${g.clubs[opp]?.name} (${g.players[g.clubs[opp].playerIds[0]]?.nationality}, Stärke ${Math.round(clubStrength(g, opp))})`);
  const prize = g.clubs.muc.finances.transactions.filter((t) => /^Prämie (Weltpokal|Klub|Interkont)/.test(t.description)).reduce((a, t) => a + t.amount, 0);
  ok(prize > 0, `${year}: Prämie gebucht (${Math.round(prize).toLocaleString('de-DE')})`);
  g = await roundTrip(g, `ct-${year}b`);
  ok(icStateOf(g)!.archive.some((a) => a.key === key && a.season === g.season), `${year}: Archiv nach Speichern/Laden`);
  if (ev2.winner === 'muc') {
    wonOnce = true;
    const t = titlesOf(g, 'muc').find((x) => x.kind === (key === 'wp' ? 'weltpokal' : key === 'icup' ? 'intercup' : 'klubwm'));
    const tr = trophiesOf(g, 'muc').find((x) => x.kind === t?.kind);
    ok(t && tr && tr.cat === 'kontinental' && tr.shape === 'welt', `${year}: Titel in der Vitrine „${tr?.title}“ (${tr?.cat}, Form ${tr?.shape})`);
  }
}
if (!wonOnce) {
  // Sicherheitsnetz: Titel direkt eintragen und Vitrine prüfen (Ergebnisse hängen vom Zufall ab).
  const g = make(1985);
  setupIntercontinental(g, { ec: 'muc', ecRu: null });
  const { addTitleRecord } = await import('../src/game/clubRecords');
  addTitleRecord(g, 'muc', 'weltpokal', g.season);
  ok(trophiesOf(g, 'muc').some((x) => x.kind === 'weltpokal' && x.cat === 'kontinental'), 'Vitrine: Weltpokal (eingetragen, kein Sieg in den Läufen)');
}

// ---------------------------------------------------------------------------
// 3) Alter Spielstand ohne Kontinente + 4) Speicher
// ---------------------------------------------------------------------------
{
  const raw = readFileSync('public/saves/test-40-jahre.txt', 'utf8');
  const g: Game = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw).game;
  // Die Vorlagen werden inzwischen mit Kontinenten erzeugt: für den Test „alter Stand“ die Felder entfernen.
  delete (g as any).continents; delete (g as any).icCups;
  const had = !!(g as any).continents;
  const before = lz(g);
  prepareLoadedGame(g);
  ok(!had && continentsState(g), `Alter Spielstand ${g.season}: Kontinente beim Laden nachgerüstet`);
  // 40 Jahre Historie wie in einem langen Spiel aufbauen (nur Hintergrund).
  const y0 = Number(g.season.slice(0, 4));
  const keep = g.season;
  delete (g as any).continents; delete (g as any).icCups;
  const plain = lz(g);
  for (let y = y0 - 39; y <= y0; y++) {
    g.season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
    ensureContinents(g, y);
    const top = Object.values(g.euroClubs!).sort((a, b) => b.strength - a.strength);
    setupIntercontinental(g, { ec: top[y % 4].id, ecRu: top[(y % 4) + 1].id });
  }
  g.season = keep;
  const full = lz(g);
  const pct = ((full - plain) / plain) * 100;
  console.log(`     Spielstand komprimiert: Vorlage ${before * 2} B, ohne Kontinente ${plain * 2} B, mit 40 Jahren ${full * 2} B`);
  ok(pct < 3, `Speicher +${pct.toFixed(2)} % (Ziel < 3 %)`);
  // Saisonwechsel des alten Stands
  const raw2 = readFileSync('public/saves/test-3-jahre.txt', 'utf8');
  const g2: Game = JSON.parse(raw2.startsWith('LZ1:') ? decompressFromUTF16(raw2.slice(4))! : raw2).game;
  delete (g2 as any).continents; delete (g2 as any).icCups;
  prepareLoadedGame(g2);
  (g2 as any).simAutoManage = true;
  g2.calendar.currentDate = `${Number(g2.season.slice(0, 4)) + 1}-06-30`;
  const t0 = performance.now();
  startNextSeason(g2);
  ok(icStateOf(g2) && continentsState(g2)!.y === Number(g2.season.slice(0, 4)), `Alter Spielstand: Saisonwechsel nach ${g2.season} rüstet Weltpokal-Zustand nach (${Math.round(performance.now() - t0)} ms Saisonwechsel gesamt)`);
  for (let i = 0; i < 20; i++) processDay(g2, ui);
  ok(true, 'Alter Spielstand: 20 Tage weiter ohne Fehler');
}

console.log(fails ? `\n${fails} Fehler.` : '\nKontinente & Weltpokal: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
