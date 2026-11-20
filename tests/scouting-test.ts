// Scouting 2.0 ohne UI (Wunsch Pascal): Software kaufen/Alterung, Abo/Kündigen, Scouts im
// Ausland, Jugendcamps (Bau, Betrieb, Talente, FIFA-Regel), KI-Talente, Speichern/Laden.
//   npm run test:scouting        PRICES=1 zeigt die Kosten je Epoche
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { knowCtx, knowledge, poolRows, type PoolRow } from '../src/game/playerPool';
import { activeSub, buyBoost, buyProduct, cancelSub, productPrice, softProfile, subBoost, subscribe } from '../src/game/scoutSoftware';
import { abroadCountries, abroadTerms, areaKnowledge, scoutStaff, startAbroad } from '../src/game/scoutAbroad';
import { busySlots, scoutSlots, scoutingOf } from '../src/game/scoutingGame';
import { aiCampTalents, buildCamp, buildCost, campAt, campsOf, kidReady, monthlyCost, takeKid, youthCampsDaily } from '../src/game/youthCamps';
import { quickHire } from '../src/game/trainerTeam';
import { CAMP_LEVELS, CAMP_SITE_BY_ID, joinAge } from '../src/data/youthCampSites';
import { SCOUT_PRODUCTS, PRODUCT_BY_ID } from '../src/data/scoutingProducts';
import { ORIGINS } from '../src/data/origins';
import { economyScale } from '../src/engine/economy';
import type { Game } from '../src/game/state';

let seed = 4711;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (c: unknown, m: string) => { if (!c) fail(m); };
const load = (path: string): Game => {
  const txt = readFileSync(path, 'utf8');
  const g = (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
  prepareLoadedGame(g);
  return g;
};
const roundtrip = (g: Game): Game => { const c = JSON.parse(JSON.stringify(g)) as Game; prepareLoadedGame(c); return c; };
const meanK = (g: Game, f: (r: PoolRow) => boolean) => {
  const ctx = knowCtx(g);
  const rs = poolRows(g).rows.filter(f);
  return rs.reduce((a, r) => a + knowledge(ctx, r), 0) / Math.max(1, rs.length);
};
/** Tage verarbeiten, bis das Datum erreicht ist (Spieltage halten processDay an). */
const until = (g: Game, date: string) => { for (let i = 0; i < 400 && g.calendar.currentDate < date; i++) processDay(g, HEADLESS_UI); };
const plusDays = (d: string, n: number) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
const bal = (g: Game) => g.clubs[g.managedClubId].finances.balance;
const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');

// --- Kosten je Epoche (Bericht) ---------------------------------------------
if (process.env.PRICES) {
  for (const y of [1975, 1985, 1995, 2005, 2015, 2025]) {
    const ps = SCOUT_PRODUCTS.filter((p) => y >= p.from && (p.until == null || y <= p.until))
      .map((p) => `${p.name} ${fmt(productPrice(p, y).nominal / (y >= 2002 ? 1.95583 : 1))}${y >= 2002 ? ' €' : ' DM'}${p.kind === 'sub' ? '/Monat' : ''}`);
    const c = CAMP_LEVELS.filter((l) => y >= l.from).map((l) => `${l.name} ${fmt(buildCost(CAMP_SITE_BY_ID.gha, l.level, 0, y).nominal / (y >= 2002 ? 1.95583 : 1))} + ${fmt(monthlyCost(CAMP_SITE_BY_ID.gha, l.level, y).nominal / (y >= 2002 ? 1.95583 : 1))}/M`);
    console.log(`${y}: ${ps.join(' | ')}${c.length ? ` || Ghana: ${c.join(' | ')}` : ''}`);
  }
}

// --- 1975: Karteikarten kaufen, Alterung --------------------------------------
{
  const g = createNewGame({
    managedClubId: 'muc',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  const dom2 = (r: PoolRow) => r.kind === 'world' && r.country === 'Deutschland' && r.level === 2 && !r.youth;
  const k0 = meanK(g, dom2);
  expect(subscribe(g, 'lupe'), '1975: Abo darf es noch nicht geben');
  expect(buyProduct(g, 'band', 'west'), '1975: Videokassetten darf es noch nicht geben');
  const b0 = bal(g);
  expect(!buyProduct(g, 'kartei', 'heimat'), '1975: Karteikarten nicht kaufbar');
  const paid = b0 - bal(g);
  expect(Math.abs(paid - productPrice(PRODUCT_BY_ID.kartei, 1975).nominal) < 1, `Kaufpreis falsch gebucht: ${paid}`);
  expect(buyProduct(g, 'kartei', 'heimat'), 'zweimal dieselbe Ausgabe im Jahr');
  const k1 = meanK(g, dom2);
  expect(k1 > k0 + 0.03, `Karteikarten wirken nicht: ${k0.toFixed(3)} → ${k1.toFixed(3)}`);
  const abroad = (r: PoolRow) => r.kind === 'world' && r.country === 'England';
  expect(Math.abs(meanK(g, abroad) - meanK(g, abroad)) < 1e-9, 'Bekanntheit nicht stabil');
  const b = scoutingOf(g).buys![0];
  const now = buyBoost(b, '1975-08-01'), later = buyBoost(b, '1978-08-01');
  expect(later < now * 0.4 && later >= 0, `Kauf altert nicht: ${now} → ${later}`);
  console.log(`1975 Karteikarten: ${fmt(paid)} DM, Bekanntheit 2. Liga ${k0.toFixed(3)} → ${k1.toFixed(3)}, Wirkung nach 3 Jahren ${(later / now * 100).toFixed(0)} %`);
  // alte Spielstände ohne Felder laden
  const old = load('public/saves/test-3-jahre.txt');
  expect(!old.youthCamps || Array.isArray(old.youthCamps.camps), 'Altstand: Camps kaputt');
  expect(softProfile(old).length === 0, 'Altstand: Software ohne Kauf');
  meanK(old, (r) => r.kind === 'world');
  for (let i = 0; i < 3; i++) processDay(old, HEADLESS_UI);
  console.log('Altstand 1978 ohne neue Felder: geladen, 3 Tage ok');
}

// --- 2025: Abo, Kündigen, Auslandsscout, Camp --------------------------------
{
  const g = load('public/saves/liga1-2025.txt');
  const today = g.calendar.currentDate;
  console.log(`Vorlage ${g.season}, ${today}, ${g.clubs[g.managedClubId].name}`);
  expect(buyProduct(g, 'cd', 'west'), '2025: CD-ROM gibt es nicht mehr');
  const eng = (r: PoolRow) => r.kind === 'world' && r.country === 'England' && r.level <= 2 && !r.youth;
  const engY = (r: PoolRow) => r.kind === 'world' && r.country === 'England' && r.youth;
  const k0 = meanK(g, eng), y0 = meanK(g, engY);
  const b0 = bal(g);
  expect(!subscribe(g, 'vista'), 'Abo Videoplattform scheitert');
  expect(!subscribe(g, 'werk'), 'Abo Datenanalyse scheitert');
  expect(subscribe(g, 'vista'), 'Doppelabo');
  const first = b0 - bal(g);
  const k1 = meanK(g, eng), y1 = meanK(g, engY);
  expect(k1 > k0 + 0.08, `Abos wirken nicht: ${k0.toFixed(3)} → ${k1.toFixed(3)}`);
  expect(y1 > y0, 'Abos wirken nicht auf Jugend');
  const sv = activeSub(g, 'vista')!;
  expect(subBoost(sv, '2027-12-10') > subBoost(sv, today) * 1.3, 'Abo wird nicht genauer');
  console.log(`2025 Abos: erster Monat ${fmt(first / 1.95583)} €, England Ø ${k0.toFixed(3)} → ${k1.toFixed(3)}, Jugend ${y0.toFixed(3)} → ${y1.toFixed(3)}`);

  // Auslandsscout
  if (scoutStaff(g).length < 2) { const h = quickHire(g, 'scout_1975'); expect(h.ok, `kein Scout einstellbar: ${h.text}`); }
  const st = scoutStaff(g)[0];
  const land = abroadCountries(g).includes('Spanien') ? 'Spanien' : abroadCountries(g)[0];
  const esY = (r: PoolRow) => r.country === land && r.youth;
  const a0 = meanK(g, esY);
  const terms = abroadTerms(g, land, 4, st.id);
  const busy0 = busySlots(g);
  expect(!startAbroad(g, land, 4, st.id), 'Auslandsreise scheitert');
  expect(startAbroad(g, land, 4, st.id), 'zweite Reise ins selbe Land');
  expect(busySlots(g) === busy0 + 1, 'Reise belegt keinen Platz');
  expect(busySlots(g) <= scoutSlots(g), 'mehr Reisen als Plätze');

  // Camp in Ghana bauen
  const gha = CAMP_SITE_BY_ID.gha;
  const cost = buildCost(gha, 1, 0, 2025);
  const b1 = bal(g);
  const err = buildCamp(g, 'gha', 1);
  expect(!err, `Camp-Bau scheitert: ${err}`);
  expect(Math.abs(b1 - bal(g) - cost.nominal) < 1, 'Baukosten falsch');
  expect(buildCamp(g, 'gha', 2), 'Ausbau während des Baus');
  expect(buildCamp(g, 'pol', 3), 'Stufe überspringen');

  until(g, plusDays(today, 30));
  const a1 = meanK(g, esY);
  expect(a1 > a0 + 0.1, `Auslandsscout wirkt nicht: ${a0.toFixed(3)} → ${a1.toFixed(3)}`);
  expect(!scoutingOf(g).abroad?.length, 'Scout nicht zurück');
  const log = scoutingOf(g).abroadLog![0];
  expect(log.finds.length >= 3 && log.finds.every((id) => (scoutingOf(g).reports[id]?.k ?? 0) >= 0.8), 'Funde ohne Berichte');
  expect(g.messages.some((m) => m.subject.startsWith('Zurück aus')), 'keine Nachricht zur Rückkehr');
  console.log(`Scout in ${land} (4 Wochen, ${fmt(terms.nominal / 1.95583)} €): Jugend Ø ${a0.toFixed(3)} → ${a1.toFixed(3)}, ${log.finds.length} Funde, Länderwissen ${areaKnowledge(g, land).toFixed(2)}`);
  // Abo-Abbuchung zum Monatsersten (10.12. + 30 Tage → über den 1.1.)
  expect(g.clubs[g.managedClubId].finances.transactions.filter((t) => t.description.startsWith('Abo:')).length >= 3, 'Abo nicht monatlich gebucht');

  // Kündigen
  cancelSub(g, 'werk');
  expect(!!scoutingOf(g).subs!.find((x) => x.id === 'werk')!.end, 'Kündigung ohne Termin');
  let n = 0;
  while (scoutingOf(g).subs!.some((x) => x.id === 'werk') && n++ < 40) processDay(g, HEADLESS_UI);
  expect(!scoutingOf(g).subs!.some((x) => x.id === 'werk'), 'gekündigtes Abo läuft weiter');
  expect(g.messages.some((m) => m.subject === 'Abo beendet: Datenwerk Leistungsanalyse'), 'keine Nachricht zum Abo-Ende');
  console.log(`Kündigung wirksam nach ${n} Tagen`);

  // Camp fertig + Betrieb + Talente
  const camp = campAt(g, 'gha')!;
  camp.building!.done = g.calendar.currentDate;
  processDay(g, HEADLESS_UI);
  expect(camp.level === 1 && !camp.building, 'Camp nicht fertig');
  const bm = bal(g);
  const d1 = `${g.calendar.currentDate.slice(0, 4)}-${g.calendar.currentDate.slice(5, 7)}-01`;
  youthCampsDaily(g, d1);
  expect(bm - bal(g) >= monthlyCost(gha, 1, 2026).nominal - 1, 'Betriebskosten fehlen');
  youthCampsDaily(g, '2026-07-01');
  expect(camp.kids.length === 1, `Jahrgang Stufe 1 ≠ 1 Talent: ${camp.kids.length}`);
  const kid = camp.kids[0];
  const surnames = new Set(Object.values(ORIGINS).filter((o) => o.face === 'westafrika').flatMap((o) => o.last));
  expect(surnames.has(kid.last), `Name passt nicht zu Ghana: ${kid.name}`);
  expect(!kidReady(g, gha, kid), 'Minderjähriger sofort wechselbar');
  expect(takeKid(g, 'gha', kid.id), 'FIFA-Regel greift nicht');
  kid.born -= 4; // jetzt 18
  const before = Object.keys(g.youthPlayers).length;
  expect(!takeKid(g, 'gha', kid.id), 'Übernahme scheitert');
  const yp = Object.values(g.youthPlayers).find((p) => p.fullName === kid.name)!;
  expect(Object.keys(g.youthPlayers).length === before + 1 && yp && yp.nationality === 'GHA' && yp.clubId === g.managedClubId, 'Talent nicht in der Jugend');
  console.log(`Camp Ghana: ${kid.name} (${kid.pos}) → Jugend, Nationalität ${yp.nationality}, Gesicht ${yp.face}, ${yp.age} Jahre`);
  expect(joinAge(gha, '1999-08-01') === 16 && joinAge(gha, '2005-08-01') === 18, 'FIFA-Grenze 2001 falsch');
  expect(joinAge(CAMP_SITE_BY_ID.pol, '2003-08-01') === 18 && joinAge(CAMP_SITE_BY_ID.pol, '2005-08-01') === 16, 'EU-Ausnahme falsch');

  // KI-Talente
  const ai = aiCampTalents(g, '2026-07-01');
  expect(ai > 0 && ai < 15, `KI-Camps unplausibel: ${ai}`);
  console.log(`KI 2026: ${ai} Talente über Camps/Abos großer Vereine`);

  // Speichern/Laden
  const before2 = { soft: softProfile(g).length, k: meanK(g, eng), camps: campsOf(g).camps.length, log: scoutingOf(g).abroadLog!.length };
  const g2 = roundtrip(g);
  const after2 = { soft: softProfile(g2).length, k: meanK(g2, eng), camps: campsOf(g2).camps.length, log: scoutingOf(g2).abroadLog!.length };
  expect(JSON.stringify(before2) === JSON.stringify(after2), `Speichern/Laden verlustbehaftet: ${JSON.stringify(before2)} vs ${JSON.stringify(after2)}`);
  for (let i = 0; i < 3; i++) processDay(g2, HEADLESS_UI);
  console.log('Speichern/Laden: verlustfrei');
  void economyScale;
}
console.log('OK – Scouting 2.0');
