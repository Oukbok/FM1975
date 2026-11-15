// Funktionstest Stadionumfeld: Nachrüstung (idempotent), Ausgangslage je Epoche,
// Spieltags-/Monatsposten 1975 vs. 2025, Bau mit Genehmigung, Fläche/Grundstück,
// ÖPNV-Verhandlung, Sicherheitsrisiko, Auslastungs-Delta, Lizenzauflage, KI-Ausbau,
// Nachbargrundstücke (Karte, Preis, Kauf, Bauen auf dem Grundstück, Migration).
//   node scripts/run-ts.mjs tests/grounds-test.ts
import { createNewGame } from '../src/game/newGame';
import { aiBuild, buyGroundsLand, buyGroundsPlot, demolishGrounds, ensureClubGrounds, groundsDaily, migrateGrounds, renovateGrounds, startGroundsBuild, startTransitTalk } from '../src/game/groundsGame';
import {
  accessInfo, areaUsed, chaosSeverity, groundsAttendanceBonus, groundsMoodBonus, incidentRisk, landOffer, landPrice, levelOf, makeGrounds, matchdayItems, mdScale, monthlyItems, riskReduction,
} from '../src/engine/grounds';
import { GROUNDS_MODULES, LOCATIONS } from '../src/data/groundsCatalog';
import { PLOTS, buildableOn, clubPlots, landCap, plotOfModule, plotPrice, plotsOf } from '../src/engine/groundsPlots';
import { formatMoney } from '../src/engine/economy';
import { Club } from '../src/types';

let fails = 0;
const ok = (cond: unknown, label: string) => { console.log(`${cond ? 'OK  ' : 'FEHL'} ${label}`); if (!cond) fails++; };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + x.amount, 0);
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const me = g.clubs[g.managedClubId];
// Saisonbudget (game/budgetPlan.ts) hier ausblenden – geprüft wird die Bau-Logik, die Budgetgrenze prüft test:budget.
delete (g as any).budget;

// --- Nachrüstung ---
ok(!me.grounds, 'Neues Spiel: Umfeld noch nicht angelegt (wird nachgerüstet)');
migrateGrounds(g);
const snap = JSON.stringify(Object.values(g.clubs).map((c) => c.grounds));
migrateGrounds(g);
ok(JSON.stringify(Object.values(g.clubs).map((c) => c.grounds)) === snap, 'migrateGrounds ist idempotent');
const gr = me.grounds!;
ok(gr.area >= areaUsed(me, gr), `Fläche reicht für die Ausgangslage (${areaUsed(me, gr)}/${gr.area}, ${LOCATIONS[gr.location].name})`);
ok(levelOf(gr, 'floodlight') === 1 && levelOf(gr, 'press') === 1 && levelOf(gr, 'stewards') === 1, '1975: Flutlicht, Pressetribüne, Vereinsordner');
ok(!gr.modules.hospitality && !gr.modules.museum && !gr.modules.onlineShop, '1975: kein VIP-Zelt, kein Museum, kein Onlineshop');

// --- Ausgangslage späterer Epochen ---
for (const year of [1990, 2005, 2025]) {
  const c = clone(me); c.reputation = 82; c.infrastructure.merchandising = 4;
  const x = makeGrounds(c, year);
  const keys = Object.entries(x.modules).map(([k, v]) => `${k}:${v!.level}`).join(' ');
  ok(year < 2005 ? !x.modules.museum : true, `${year}: ${keys}`);
}

// --- Geld: 1975 vs. 2025 (Spitzenausstattung, 25.000 Zuschauer) ---
for (const year of [1975, 2025]) {
  const c = clone(me) as Club; c.reputation = 80; c.infrastructure.merchandising = 4;
  const x = makeGrounds(c, year);
  if (year === 2025) for (const m of GROUNDS_MODULES) x.modules[m.key] = { level: m.levels.length, condition: 100, builtYear: 2024, months: 24 };
  c.grounds = x;
  const md = matchdayItems(c, x, 25000, year);
  const mo = monthlyItems(c, x, year);
  console.log(`  ${year} (Skala ${mdScale(year).toFixed(1)}): je Heimspiel ${formatMoney(sum(md), year)} [${md.map((i) => `${i.label} ${formatMoney(i.amount, year)}`).join(' · ')}]`);
  console.log(`  ${year}: je Monat ${formatMoney(sum(mo), year)} [${mo.map((i) => `${i.label} ${formatMoney(i.amount, year)}`).join(' · ')}]`);
  const season = sum(md) * 17 + sum(mo) * 12;
  console.log(`  ${year}: Umfeld-Saldo je Saison ≈ ${formatMoney(season, year)}`);
  if (year === 1975) ok(Math.abs(season) < 450000, '1975: Umfeld ist ein Nebengeschäft (< 10 % von 4,5 Mio. DM)');
  else ok(season > 0, '2025: voll ausgebautes Umfeld trägt sich');
}

// --- Bau mit Genehmigung ---
{
  const t = clone(g); migrateGrounds(t);
  const c = t.clubs[t.managedClubId];
  c.finances.balance = 50_000_000;
  const tg = c.grounds!; tg.area = 40;
  tg.modules.parking = { level: 1, condition: 100, builtYear: 1975 };
  const before = c.finances.balance;
  const r = startGroundsBuild(t, 'parking');
  ok(r.ok && tg.projects.length === 1 && tg.projects[0].phase === 'permit', `Asphaltierung braucht Genehmigung: ${r.text}`);
  ok(c.finances.balance < before, 'Kosten beim Bauantrag gebucht');
  tg.projects[0].protest = 'none';
  let d = t.calendar.currentDate;
  for (let i = 0; i < 200; i++) { d = addDays(d, 1); t.calendar.currentDate = d; groundsDaily(t, d); }
  ok(levelOf(tg, 'parking') === 2, `Parkplatz nach Genehmigung + Bau auf Stufe 2 (${tg.projects.length} offen)`);
  // Abgelehnt → 90 % zurück
  tg.modules.vereinsheim = { level: 1, condition: 100, builtYear: 1975 };
  const b2 = c.finances.balance;
  startGroundsBuild(t, 'vereinsheim');
  tg.projects[0].protest = 'abgelehnt';
  for (let i = 0; i < 200; i++) { d = addDays(d, 1); t.calendar.currentDate = d; groundsDaily(t, d); }
  ok(levelOf(tg, 'vereinsheim') === 1 && tg.projects.length === 0, 'Abgelehnter Bauantrag: keine neue Stufe');
  ok(c.finances.balance < b2 && b2 - c.finances.balance < 30000, `Abgelehnt: nur 10 % Planungskosten verloren (${b2 - c.finances.balance})`);
  ok(t.messages.some((m) => m.subject.startsWith('Bauantrag abgelehnt')), 'Nachricht über Ablehnung');
  // Fläche
  tg.area = areaUsed(c, tg);
  tg.modules.hospitality = undefined;
  t.calendar.currentDate = '1986-08-01';
  const r2 = startGroundsBuild(t, 'hospitality');
  ok(!r2.ok && /Fläche/.test(r2.text), `Ohne Fläche kein VIP-Zelt: ${r2.text}`);
  const lb = buyGroundsLand(t);
  ok(lb.ok && tg.area === areaUsed(c, tg) + 2, `Grundstückskauf: ${lb.text}`);
  ok(startGroundsBuild(t, 'hospitality').ok, 'Mit neuem Grundstück: VIP-Zelt im Bau');
  const dm = demolishGrounds(t, 'parking');
  ok(dm.ok && levelOf(tg, 'parking') === 1, `Abriss gibt Fläche frei: ${dm.text}`);
  tg.modules.parking!.condition = 40;
  ok(renovateGrounds(t, 'parking').ok && tg.modules.parking!.condition === 100, 'Sanierung stellt Zustand her');
  // ÖPNV-Verhandlung
  tg.modules.transit = { level: 1, condition: 100, builtYear: 1980 };
  const tt = startTransitTalk(t);
  ok(tt.ok && !!tg.talk, `Verhandlung: ${tt.text}`);
  tg.talk!.accepted = true;
  for (let i = 0; i < 80; i++) { d = addDays(t.calendar.currentDate, 1); t.calendar.currentDate = d; groundsDaily(t, d); }
  ok(levelOf(tg, 'transit') === 2, 'Stadt sagt zu → Sonderzüge');
}

// --- Anreise, Sicherheit, Stimmung ---
{
  const c = clone(me) as Club; const x = makeGrounds(c, 1985); c.grounds = x;
  x.modules.parking = { level: 1, condition: 100, builtYear: 1980 }; x.modules.transit = undefined;
  const big = c.stadium.capacity;
  const sev = chaosSeverity(c, x, 1985, big);
  const a = accessInfo(c, x, 1985, big);
  console.log(`  Anreise ausverkauft: Nachfrage ${a.demand}, Kapazität ${a.capacity} → Chaos ${Math.round(sev * 100)} %`);
  x.modules.transit = { level: 2, condition: 100, builtYear: 1985 }; x.modules.parking = { level: 3, condition: 100, builtYear: 1985 };
  ok(chaosSeverity(c, x, 1985, big) < sev || sev === 0, 'Parkhaus + Sonderzüge senken das Anreise-Chaos');
  x.modules.stewards = { level: 1, condition: 100, builtYear: 1975 }; x.modules.fanProject = undefined; x.modules.familyBlock = undefined;
  const r0 = incidentRisk(x, 1985, true, 50);
  x.modules.stewards = { level: 3, condition: 100, builtYear: 1990 }; x.modules.fanProject = { level: 1, condition: 100, builtYear: 1985, months: 24 };
  const r1 = incidentRisk(x, 1990, true, 50);
  ok(r1 < r0 * 0.6, `Derby-Risiko 80er: ${(r0 * 100).toFixed(1)} % → ${(r1 * 100).toFixed(1)} % (Reduktion ${(riskReduction(x, 1990) * 100).toFixed(0)} %)`);
  ok(groundsMoodBonus(x, 1990) > 0, `Fanprojekt hebt die Stimmung (+${groundsMoodBonus(x, 1990).toFixed(1)})`);
  // Auslastungs-Delta: zweimal im selben Monat → keine Änderung
  const t = clone(g); migrateGrounds(t); const cm = t.clubs[t.managedClubId];
  cm.grounds!.lastMonth = '1900-01';
  groundsDaily(t, t.calendar.currentDate);
  const r = cm.stadium.averageAttendanceRate;
  cm.grounds!.lastMonth = '1900-01';
  groundsDaily(t, t.calendar.currentDate);
  ok(Math.abs(cm.stadium.averageAttendanceRate - r) < 0.002, `Auslastungs-Bonus wird nur einmal angewandt (${groundsAttendanceBonus(cm, cm.grounds!, 1975).toFixed(3)})`);
}

// --- Lizenzauflage und KI ---
{
  const t = clone(g); migrateGrounds(t);
  const c = t.clubs[t.managedClubId]; const x = c.grounds!;
  x.modules.floodlight = { level: 1, condition: 100, builtYear: 1975 };
  x.lastSeason = '1999/00';
  const b = c.finances.balance;
  t.calendar.currentDate = '2000-07-01';
  groundsDaily(t, '2000-07-01');
  ok(c.finances.balance < b && (x.licenseStrikes ?? 0) === 1, `2000: Flutlicht unter Auflage → Geldstrafe ${formatMoney(b - c.finances.balance, 2000)}`);
  ok(t.messages.some((m) => m.subject === 'Lizenzauflage'), 'Nachricht zur Lizenzauflage');
  const ai = Object.values(t.clubs).find((k) => k.id !== c.id && k.grounds)!;
  ai.finances.balance = 80_000_000; ai.reputation = 80;
  const lv = Object.values(ai.grounds!.modules).reduce((a, m) => a + (m?.level ?? 0), 0);
  aiBuild(ai, ai.grounds!, '2000-07-01', 2000, 1);
  const lv2 = Object.values(ai.grounds!.modules).reduce((a, m) => a + (m?.level ?? 0), 0);
  ok(lv2 > lv && lv2 - lv <= 2, `KI baut mit Geld höchstens 2 Stufen je Saison (${lv} → ${lv2})`);
  const poor = clone(ai); poor.finances.balance = -1_000_000; const lp = JSON.stringify(poor.grounds);
  aiBuild(poor, poor.grounds!, '2000-07-01', 2000, 1);
  ok(JSON.stringify(poor.grounds) === lp, 'KI ohne Geld baut nichts');
  const e = ensureClubGrounds(ai, '2000-07-01');
  ok(e === ai.grounds, 'ensureClubGrounds lässt vorhandenes Umfeld unverändert');
}

// --- Nachbargrundstücke (engine/groundsPlots.ts) ---
{
  // Karte: fest je Verein, Summe ≈ alte Obergrenze, immer Brache + Bebautes dabei
  const ids = Object.keys(g.clubs).slice(0, 60);
  for (const loc of ['innenstadt', 'stadtteil', 'stadtrand'] as const) {
    const cap = landCap(loc);
    let okSum = true, okMix = true, brache = 0, total = 0;
    for (const id of ids) {
      const buy = clubPlots(id, loc).filter((p) => p.buyable);
      const s = buy.reduce((a, p) => a + p.size, 0);
      if (s > cap || s < cap - 1) okSum = false;
      if (!buy.some((p) => p.kind === 'brache') || !buy.some((p) => p.kind === 'haeuser' || p.kind === 'gewerbe')) okMix = false;
      brache += buy.filter((p) => p.kind === 'brache').length; total += buy.length;
    }
    ok(okSum, `${loc}: kaufbare Parzellen ≈ alte Obergrenze ${cap}`);
    ok(okMix, `${loc}: immer Brachland und mindestens ein bebautes Grundstück`);
    console.log(`  ${loc}: im Schnitt ${(total / ids.length).toFixed(1)} kaufbare Grundstücke, ${Math.round((100 * brache) / total)} % Brache`);
  }
  ok(JSON.stringify(clubPlots('mgl', 'stadtteil')) === JSON.stringify(clubPlots('mgl', 'stadtteil')), 'Karte ist fest (zweimal gleich)');
  ok(PLOTS.every((a) => PLOTS.every((b) => a === b || a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.d <= b.y || b.y + b.d <= a.y)), 'Grundstücke überschneiden sich nicht');

  const t = clone(g); migrateGrounds(t);
  const c = t.clubs[t.managedClubId]; const x = c.grounds!;
  c.finances.balance = 50_000_000;
  t.calendar.currentDate = '1986-08-01';
  const year = 1986;
  const plots = plotsOf(c, x).filter((p) => p.buyable);
  const br = plots.find((p) => p.kind === 'brache')!;
  const built = plots.find((p) => p.kind === 'haeuser' || p.kind === 'gewerbe')!;
  ok(plotPrice(x, { size: 2, kind: 'brache' }, year) === landPrice({ ...x, landBought: 0 }, year), `Brache mit 2 Parzellen kostet so viel wie früher der erste Zukauf (${formatMoney(plotPrice(x, { size: 2, kind: 'brache' }, year), year)})`);
  ok(plotPrice(x, { size: 3, kind: built.kind }, year) > 2 * plotPrice(x, { size: 3, kind: 'brache' }, year), 'Bebautes Grundstück kostet deutlich mehr als Brache gleicher Größe');
  const p0 = plotPrice(x, built, year);
  const a0 = x.area, b0 = c.finances.balance, n0 = x.landBought;
  const rb = buyGroundsPlot(t, br.id);
  ok(rb.ok && x.area === a0 + br.size && x.landBought === n0 + 1 && x.plots!.includes(br.id) && c.finances.balance < b0, `Kauf: ${rb.text}`);
  ok(!buyGroundsPlot(t, br.id).ok, 'Dasselbe Grundstück nicht zweimal');
  ok(plotPrice(x, built, year) > p0, 'Preise steigen leicht mit jedem Kauf');
  const closed = plotsOf(c, x).find((p) => !p.buyable);
  ok(!closed || !buyGroundsPlot(t, closed.id).ok, 'Nicht kaufbares Grundstück bleibt Nachbarschaft');
  c.finances.balance = 0;
  ok(!buyGroundsPlot(t, built.id).ok, 'Ohne Geld kein Kauf');
  c.finances.balance = 50_000_000;

  // Bauen auf dem eigenen Grundstück
  delete x.modules.vereinsheim; delete x.modules.parking; x.projects = [];
  const opts = buildableOn(c, x, br.id, year);
  ok(opts.some((o) => o.key === 'vereinsheim') && opts.every((o) => o.area <= br.size), `Bauland ${br.size} Parzellen: ${opts.map((o) => o.key).join(', ')}`);
  ok(!opts.some((o) => o.key === 'transit' || o.key === 'floodlight'), 'ÖPNV und Flutlicht haben keinen Bauplatz');
  ok(br.size >= 3 || !opts.some((o) => o.key === 'parking'), 'Parkplatz (3 Parzellen) passt nicht auf ein kleines Grundstück');
  ok(!startGroundsBuild(t, 'parking', br.size >= 3 ? 'gibtsnicht' : br.id).ok && !x.sites?.[br.id], 'Zu großes Vorhaben wird auf dem Grundstück abgelehnt');
  const rs = startGroundsBuild(t, 'vereinsheim', br.id);
  ok(rs.ok && x.sites?.[br.id] === 'vereinsheim' && plotOfModule(x, 'vereinsheim') === br.id, `Bau auf dem Grundstück: ${rs.text}`);
  ok(buildableOn(c, x, br.id, year).length === 0, 'Belegtes Grundstück nimmt kein zweites Modul auf');
  let d = t.calendar.currentDate;
  for (let i = 0; i < 120; i++) { d = addDays(d, 1); t.calendar.currentDate = d; groundsDaily(t, d); }
  ok(levelOf(x, 'vereinsheim') === 1 && x.sites?.[br.id] === 'vereinsheim', 'Fertig: Vereinsheim steht auf dem Grundstück');
  demolishGrounds(t, 'vereinsheim');
  ok(!x.sites?.[br.id], 'Abriss macht das Grundstück wieder frei');
  // Gesamtfläche bleibt die harte Grenze
  x.area = areaUsed(c, x);
  const rf = startGroundsBuild(t, 'vereinsheim', br.id);
  ok(!rf.ok && /Fläche/.test(rf.text) && !x.sites?.[br.id], `Ohne freie Gesamtfläche kein Bau auf dem Grundstück: ${rf.text}`);

  // Migration alter Spielstände
  for (const n of [1, 2, 3, 5]) {
    const m = clone(g); migrateGrounds(m);
    const mc = m.clubs[m.managedClubId]; const mg = mc.grounds!;
    const base = LOCATIONS[mg.location];
    mg.area = base.area; mg.landBought = 0; delete mg.plots;
    for (let i = 0; i < n; i++) { const o = landOffer(mg, 1980); if (!o) break; mg.area += o.parcels; mg.landBought++; }
    const area = mg.area, bought = mg.area - base.area;
    migrateGrounds(m);
    const mine = plotsOf(mc, mg).filter((p) => mg.plots!.includes(p.id));
    const s = mine.reduce((a, p) => a + p.size, 0);
    ok(mg.area === area && s <= bought && s >= bought - 1, `Migration ${mg.landBought} Zukäufe (${bought} Parzellen) → ${mine.length} Grundstücke mit ${s} Parzellen [${mine.map((p) => p.kind).join(', ')}]`);
    const snap2 = JSON.stringify(mg);
    migrateGrounds(m);
    ok(JSON.stringify(mg) === snap2, 'Migration ist idempotent');
  }
}

console.log(fails ? `\n${fails} FEHLER` : '\nAlle Umfeld-Tests bestanden.');
process.exit(fails ? 1 : 0);
