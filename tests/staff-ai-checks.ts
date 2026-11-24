// KI-Stäbe, schlanke Stäbe im Ausland, Stab-Faktor für alle, Abwerben mit Ablöse und
// Wechselgründen, KI-Angebote für eigene Mitarbeiter, Speichern/Laden, Migration alter
// Spielstände (Teil von `npm run test:staff`, game/staffAi.ts + staffLean.ts + staffPoach.ts).
import { createNewGame } from '../src/game/newGame';
import { Game } from '../src/game/state';
import { StaffMember } from '../src/engine/staffPeople';
import { economyScale, yearOf } from '../src/engine/economy';
import { memberMonthlySalary } from '../src/engine/staffPeople';
import { aiStaffAnnual, aiStaffSeason, aiStaffSummary, AI_STAFF_ROLES, ensureAiStaff, staffedClubs, staffIndex, STAFF_W } from '../src/game/staffAi';
import { staffFactorOf, staffStrengthFor, staffStrengthOf, bindStaffFactor } from '../src/game/staffGame';
import { staffStrength } from '../src/engine/honourEffects';
import { isAbroad, leanClubs, leanSeason } from '../src/game/staffLean';
import { worldHeads } from '../src/game/worldCoaches';
import { aiStaffOffers, answerStaffOffer, currentMonthly, poachFee, poachView, STAFF_OFFER_TYPE } from '../src/game/staffPoach';
import { migrateStaffPeople, refillFree, staffMarket } from '../src/game/staffWorld';
import { offerContract, demandOf } from '../src/game/trainerTeam';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { STAFF_BY_ID, staffAvailable } from '../src/data/staff';
import { runAiEconomy } from '../src/engine/clubEconomy';

function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function make(year: number, club = 'mgl'): Game {
  return createNewGame({
    managedClubId: club, startYear: year,
    manager: { name: 'Test', nationality: 'GER', birthYear: year - 35, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  } as any);
}

/** Einmal in die Zukunft: n Saisonwechsel nur des Arbeitsmarkts (schnell). */
function staffSeasons(g: Game, n: number): void {
  const w = g.staffWorld!;
  for (let i = 0; i < n; i++) {
    const y = yearOf(g.calendar.currentDate) + 1;
    g.calendar.currentDate = `${y}-07-01`;
    for (const m of w.people) m.age++;
    for (const m of w.people) if (m.clubId && m.contractEnd && m.contractEnd <= g.calendar.currentDate) m.contractEnd = `${y + 2}-06-30`;
    aiStaffSeason(g, w, g.calendar.currentDate, Math.random);
  }
}

export function staffAiChecks(): string[] {
  const out: string[] = [];
  // ---------------------------------------------------------------------------
  // 1) KI-Stäbe je Epoche: alle Stellen der Zeit bei den Großen, Lücken bei Kleinen, Güte nach Ruf
  // ---------------------------------------------------------------------------
  for (const year of [1975, 1995, 2012]) {
    const g = make(year, year >= 2010 ? 'muc' : 'mgl');
    if (g.staffWorld?.ai !== 1) fail(`${year}: KI-Stäbe nicht angelegt`);
    const rows = aiStaffSummary(g).sort((a, b) => b.rep - a.rep);
    if (rows.length < 15) fail(`${year}: zu wenige Vereine mit Stab (${rows.length})`);
    const avail = AI_STAFF_ROLES.filter((r) => staffAvailable(STAFF_BY_ID[r], year)).length;
    const top = rows.slice(0, 5), low = rows.slice(-5);
    const fillTop = avg(top.map((r) => r.filled / avail)), fillLow = avg(low.map((r) => r.filled / avail));
    const qTop = avg(top.map((r) => r.q)), qLow = avg(low.map((r) => r.q));
    if (fillTop < 0.85) fail(`${year}: Große haben zu viele Lücken (${fillTop.toFixed(2)})`);
    if (year > 1990 && fillLow > fillTop) fail(`${year}: Kleine besser besetzt als Große`);
    if (qTop <= qLow) fail(`${year}: Güte groß ${qTop.toFixed(1)} ≤ klein ${qLow.toFixed(1)}`);
    const payTop = avg(top.map((r) => r.pay)), payLow = avg(low.map((r) => r.pay));
    if (payTop <= payLow) fail(`${year}: Große zahlen nicht mehr für ihren Stab`);
    // Gehaltssumme im Rahmen: 1975-Kaufkraft je Jahr 100 Tsd. – 2 Mio. DM.
    const real = (payTop * 12) / economyScale(year);
    if (real < 1e5 || real > 2.5e6) fail(`${year}: Stab-Kosten der Großen unplausibel (${Math.round(real / 1000)} Tsd. in 1975-DM)`);
    const fTop = avg(top.map((r) => staffStrengthOf(g, r.id).factor)), fLow = avg(low.map((r) => staffStrengthOf(g, r.id).factor));
    if (fTop < fLow) fail(`${year}: Faktor groß < klein`);
    // Niemand doppelt: je Verein höchstens eine Person je Stelle.
    for (const [id, list] of staffIndex(g)) {
      const seen = new Set<string>();
      for (const m of list) { if (g.clubs[id] && STAFF_W[m.roleId] && seen.has(m.roleId)) fail(`${year}: ${id} hat ${m.roleId} doppelt`); seen.add(m.roleId); }
    }
    out.push(`${year}: ${avail} Stellen, besetzt groß ${(fillTop * 100).toFixed(0)} % / klein ${(fillLow * 100).toFixed(0)} %, Q ${qTop.toFixed(1)}/${qLow.toFixed(1)}, Faktor ${fTop.toFixed(4)}/${fLow.toFixed(4)}, Kosten groß ${Math.round(real / 1000)} Tsd. (1975)`);
  }

  // ---------------------------------------------------------------------------
  // 2) Faktor symmetrisch: gleiche Leute → gleicher Faktor, eigener Verein wie KI; Grenzen
  // ---------------------------------------------------------------------------
  const g = make(1975);
  const w = g.staffWorld!;
  const year = yearOf(g.calendar.currentDate);
  const ai = staffedClubs(g)[0];
  const aiList = staffIndex(g).get(ai.id) ?? [];
  const own = staffStrengthFor(g.staff ?? [], year).factor;
  if (Math.abs(own - staffStrengthOf(g).factor) > 1e-12) fail('eigener Faktor weicht ab');
  const swapped = staffStrengthFor(aiList, year).factor;
  if (Math.abs(swapped - staffStrengthOf(g, ai.id).factor) > 1e-12) fail('KI-Faktor nicht nach derselben Formel');
  if (Math.abs(staffFactorOf(0, 2015) - 0.96) > 1e-9 || Math.abs(staffFactorOf(1.1, 2015) - 1.02) > 1e-9) fail('Grenzen −4 %/+2 % ab 2010 falsch');
  if (Math.abs(staffFactorOf(0, 1975) - 0.98) > 1e-9 || Math.abs(staffFactorOf(1.1, 1975) - 1.01) > 1e-9) fail('Epochengewicht 1975 falsch');
  if (!(staffFactorOf(1.05, 2015) > 1 && staffFactorOf(1.05, 2015) < 1.02)) fail('Bonus nicht stufenlos');
  bindStaffFactor(g);
  if (Math.abs(staffStrength(ai.id) - staffStrengthOf(g, ai.id).factor) > 1e-12) fail('KI-Faktor nicht an die Match-Engine gebunden');
  if (Math.abs(staffStrength(g.managedClubId) - own) > 1e-12) fail('eigener Faktor nicht gebunden');
  out.push(`Faktor: eigener ${own.toFixed(4)}, ${ai.shortName} ${swapped.toFixed(4)}, Grenzen 0,96/1,02 (2015) bzw. 0,98/1,01 (1975)`);

  // ---------------------------------------------------------------------------
  // 3) Schlanke Stäbe: Auslandsvereine und Sim-Vereine nehmen Leute aus dem Pool
  // ---------------------------------------------------------------------------
  const lean = leanClubs(g);
  if (!lean.some((c) => c.kind === 'foreign') || !lean.some((c) => c.kind === 'sim')) fail('keine schlanken Vereine');
  // Wie im Spiel: nach jeder Saison füllt sich der freie Markt wieder auf (staffWorldSeason → refillFree).
  for (let i = 0; i < 6; i++) { leanSeason(g, w, `${1976 + i}-07-01`, Math.random); refillFree(g, w, 1976 + i, Math.random, 18); }
  const leanIds = new Set(lean.map((c) => c.id));
  const abroad = w.people.filter((m) => m.clubId && leanIds.has(m.clubId) && isAbroad(g, m.clubId));
  // Cheftrainer der Auslandsvereine stehen im Pool der Welt (game/worldCoaches.ts, tests/world-coaches-checks.ts), nicht im Stab.
  const heads = abroad.filter((m) => m.roleId === 'cheftrainer');
  if (abroad.length < 5) fail(`zu wenige Personen im Ausland angestellt (${abroad.length})`);
  if (heads.length) fail('Cheftrainer im schlanken Stab eines Auslandsvereins (gehört nach staffWorld.heads)');
  if (lean.filter((c) => c.kind === 'foreign').some((c) => !worldHeads(g)?.c[c.id])) fail('Auslandsverein ohne Cheftrainer');
  const mkEmp = staffMarket(g, { role: 'all', onlyEmployed: true });
  if (!mkEmp.some((r) => r.m.clubId && isAbroad(g, r.m.clubId))) fail('Ausland nicht unter „angestellt“ im Markt');
  if (staffMarket(g, { role: 'all', onlyFree: true }).some((r) => r.m.clubId)) fail('Angestellte unter „vereinslos“');
  const oneClub = abroad[0].clubId!;
  if (staffMarket(g, { role: 'all', clubId: oneClub }).some((r) => r.m.clubId !== oneClub)) fail('Vereinsfilter greift nicht');
  out.push(`Schlank: ${lean.length} Vereine, im Ausland angestellt ${abroad.length} (Cheftrainer im Pool der Welt ${Object.keys(worldHeads(g)?.c ?? {}).length}), Sim-Vereine ${w.people.filter((m) => m.clubId && g.simClubs[m.clubId]).length}`);

  // ---------------------------------------------------------------------------
  // 4) Ablöse: Plausibilität je Epoche, Restlaufzeit, Saisonzeit, Cheftrainer
  // ---------------------------------------------------------------------------
  const feeLines: string[] = [];
  for (const y of [1975, 1995, 2020]) {
    const gy = y === 1975 ? g : make(y);
    const idx = staffIndex(gy);
    const co = staffedClubs(gy).map((c) => (idx.get(c.id) ?? []).find((m) => m.roleId === 'cotrainer')).filter(Boolean) as StaffMember[];
    const ratios: number[] = [];
    for (const m of co) {
      m.contractEnd = `${y + 2}-06-30`;
      const f = poachFee(gy, m, `${y}-06-10`);
      ratios.push(f / (currentMonthly(gy, m, y) * 12));
      const mid = poachFee(gy, m, `${y}-10-10`);
      if (mid <= f * 0.95) fail(`${y}: Ablöse mitten in der Saison nicht höher (${mid} ≤ ${f})`);
      m.contractEnd = `${y + 4}-06-30`;
      if (poachFee(gy, m, `${y}-06-10`) < f) fail(`${y}: längerer Vertrag nicht teurer`);
      m.contractEnd = `${y + 2}-06-30`;
    }
    const r = avg(ratios);
    if (r < 0.1 || r > 2.5) fail(`${y}: Ablöse Co-Trainer = ${r.toFixed(2)} Jahresgehälter (unplausibel)`);
    // KI-Cheftrainer (Markt `cp:`) kosten mehr als Co-Trainer.
    const head = staffMarket(gy, { role: 'cheftrainer', onlyEmployed: true })[0]?.m;
    const hr = head ? poachFee(gy, head, `${y}-06-10`) / (currentMonthly(gy, head, y) * 12) : 0;
    if (head && hr < r * 0.9) fail(`${y}: Cheftrainer-Ablöse (${hr.toFixed(2)}) unter Co-Trainer (${r.toFixed(2)})`);
    feeLines.push(`${y} Co ${r.toFixed(2)} / Chef ${hr.toFixed(2)} Jahresgehälter`);
  }
  const r75 = Number(feeLines[0].split(' ')[2]), r20 = Number(feeLines[2].split(' ')[2]);
  if (!(r20 > r75)) fail('Ablösen steigen über die Epochen nicht');
  out.push(`Ablöse (2 Jahre Restlaufzeit, Juni): ${feeLines.join(' | ')}`);

  // ---------------------------------------------------------------------------
  // 5) Wechselwunsch: Gründe, Ablehnung, Abwerbeschutz, Heimatverein, Verhandlung möglich
  // ---------------------------------------------------------------------------
  const idx = staffIndex(g);
  const small = staffedClubs(g).sort((a, b) => (a.reputation ?? 0) - (b.reputation ?? 0))[0];
  const big = staffedClubs(g).sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0))[0];
  const sm = (idx.get(small.id) ?? []).find((m) => m.roleId === 'mannschaftsarzt')!;
  const bm = (idx.get(big.id) ?? []).find((m) => m.roleId === 'mannschaftsarzt')!;
  for (const m of [sm, bm]) { m.hired = '1970-07-01'; m.loyalty = 50; m.traits = undefined; m.deal = undefined; m.contractEnd = '1978-06-30'; }
  const vs = poachView(g, sm), vb = poachView(g, bm);
  if (!vs.ok || !vs.reasons.some((r) => r.text.startsWith('Größerer Verein'))) fail(`vom Kleinen: sollte kommen (${vs.blocker})`);
  if ((g.clubs[g.managedClubId].reputation ?? 0) < (big.reputation ?? 0) - 4 && vb.ok) fail('vom Größeren: sollte ablehnen');
  sm.traits = ['treu'];
  const vt = poachView(g, sm);
  if (vt.ok || !vt.blocker?.includes('Vereinstreu')) fail(`vereinstreu ohne Ablehnung (${vt.blocker})`);
  sm.traits = undefined; sm.deal = { protect: true };
  if (!poachView(g, sm).blocker?.includes('Abwerbeschutz')) fail('Abwerbeschutz greift nicht');
  sm.deal = undefined; sm.hired = '1975-06-01';
  if (!poachView(g, sm).reasons.some((r) => r.text.includes('gerade erst'))) fail('„gerade erst gewechselt“ fehlt');
  sm.hired = '1970-07-01';
  bm.home = g.managedClubId;
  if (!poachView(g, bm).reasons.some((r) => r.text.includes('früherer Verein'))) fail('Heimatverein fehlt in den Gründen');
  bm.home = undefined;
  const co = (idx.get(small.id) ?? []).find((m) => m.roleId === 'cotrainer')!;
  co.hired = '1970-07-01'; co.traits = undefined; co.loyalty = 50; co.deal = undefined;
  if (!poachView(g, co, 'cheftrainer').reasons.some((r) => r.text.includes('Cheftrainer'))) fail('Aufstieg zum Cheftrainer fehlt in den Gründen');
  // Abwerben über den Tisch: Ablöse wird gebucht, der Verein bekommt sie, die Stelle wird frei.
  const before = g.clubs[small.id].finances.balance;
  const fee = poachFee(g, sm);
  const res = offerContract(g, sm.id, demandOf(g, sm, 'mannschaftsarzt') * 1.2, 2, { roleId: 'mannschaftsarzt', agreed: true });
  if (!res.ok) fail(`Abwerben gescheitert: ${res.text}`);
  if (Math.round(g.clubs[small.id].finances.balance - before) !== fee) fail('Ablöse nicht beim abgebenden Verein gebucht');
  if (w.people.includes(sm)) fail('abgeworbene Person noch im Pool');
  out.push(`Wechselwunsch: vom Kleinen ${vs.score} (${vs.reasons.map((r) => r.text).join(', ')}), vom Großen ${vb.score}; abgeworben für ${fee}`);

  // ---------------------------------------------------------------------------
  // 6) KI wirbt deine Leute ab: Nachricht mit Wahl, Freigeben/Halten/Ablehnen
  // ---------------------------------------------------------------------------
  const gm = make(1975, 'off'); // kleiner Verein – größere bieten
  const target = gm.staff!.find((m) => m.roleId === 'cotrainer')!;
  target.quality = 16; target.hired = '1970-07-01'; target.traits = undefined; target.deal = undefined;
  if (target.skills) for (const k of Object.keys(target.skills) as (keyof typeof target.skills)[]) target.skills[k] = Math.max(target.skills[k] ?? 1, 15);
  gm.calendar.currentDate = '1976-05-20';
  aiStaffOffers(gm, '1976-05-20', () => 0.01);
  const msg = gm.messages.find((x) => x.eventRef?.type === STAFF_OFFER_TYPE);
  if (!msg || msg.choices?.length !== 3) fail('kein Abwerbe-Angebot mit drei Wahlmöglichkeiten');
  const fee6 = Number(msg.eventRef!.data!.fee);
  const keep = JSON.parse(JSON.stringify(msg.eventRef));
  const sal = target.salaryFactor;
  answerStaffOffer(gm, keep, 'halten');
  if (!(target.salaryFactor > sal) || !gm.staff!.includes(target)) fail('Halten: Gehalt nicht erhöht');
  const bal = gm.clubs[gm.managedClubId].finances.balance;
  answerStaffOffer(gm, keep, 'freigeben');
  if (gm.staff!.includes(target)) fail('Freigeben: Mitarbeiter noch da');
  if (Math.round(gm.clubs[gm.managedClubId].finances.balance - bal) !== fee6) fail('Freigeben: Ablöse nicht gebucht');
  const at = gm.staffWorld!.people.find((m) => m.name === target.name);
  if (!at || at.clubId !== keep.data.buyer) fail('Freigeben: arbeitet nicht beim neuen Verein');
  out.push(`KI-Angebot: ${msg.subject} (${fee6}), Halten/Freigeben ok`);

  // ---------------------------------------------------------------------------
  // 7) Speichern/Laden und Migration alter Spielstände (KI-Stäbe einmalig besetzen)
  // ---------------------------------------------------------------------------
  const gs = make(1975);
  const n0 = gs.staffWorld!.people.length;
  const loaded = JSON.parse(JSON.stringify(gs)) as Game;
  prepareLoadedGame(loaded);
  if (loaded.staffWorld?.ai !== 1 || loaded.staffWorld.people.length !== n0) fail(`Laden verändert die Stäbe (${n0} → ${loaded.staffWorld?.people.length})`);
  // Alter Spielstand: nur die fünf früher geführten Stellen, keine Markierung.
  const old = JSON.parse(JSON.stringify(gs)) as Game;
  const OLD = new Set(['cotrainer', 'torwarttrainer', 'konditionstrainer', 'videoanalyst', 'athletiktrainer']);
  old.staffWorld!.people = old.staffWorld!.people.filter((m) => !m.clubId || (OLD.has(m.roleId) && !!old.clubs[m.clubId]));
  delete old.staffWorld!.ai;
  const thin = aiStaffSummary(old).reduce((a, r) => a + r.filled, 0);
  migrateStaffPeople(old);
  const full = aiStaffSummary(old).reduce((a, r) => a + r.filled, 0);
  if (old.staffWorld!.ai !== 1 || full <= thin) fail(`Migration besetzt die KI-Stäbe nicht (${thin} → ${full})`);
  const again = old.staffWorld!.people.length;
  migrateStaffPeople(old); ensureAiStaff(old);
  if (old.staffWorld!.people.length !== again) fail('Migration nicht idempotent');
  const old2 = JSON.parse(JSON.stringify(gs)) as Game;
  delete old2.staffWorld!.ai;
  old2.staffWorld!.people = old2.staffWorld!.people.filter((m) => !m.clubId);
  prepareLoadedGame(old2);
  if (old2.staffWorld!.ai !== 1 || aiStaffSummary(old2).some((r) => r.filled < 4)) fail('Laden: alter Stand ohne KI-Stäbe nicht nachgerüstet');
  // Größe: KI-Stäbe kosten wenig Platz.
  const size = JSON.stringify(gs.staffWorld).length;
  if (size > 400_000) fail(`Arbeitsmarkt zu groß (${size} Zeichen)`);
  out.push(`Speichern/Laden ok, Migration ${thin} → ${full} Stellen, Arbeitsmarkt ${Math.round(size / 1024)} KB`);
  // Kurzer Langlauf des Arbeitsmarkts: Stäbe bleiben voll, Pool versiegt nicht.
  staffSeasons(gs, 6);
  const rows = aiStaffSummary(gs);
  if (rows.some((r) => r.filled < r.avail * 0.5)) fail('KI-Stäbe veröden über die Jahre');
  // Haushaltsplanung: Der Stab ist fester Posten im Personalrahmen – Spielergehälter sinken um (höchstens) seine Kosten.
  {
    const gh = make(1995);
    const year = 1995, staff = aiStaffAnnual(gh, year);
    const wagesAfter = (withStaff: boolean) => {
      const clubs = structuredClone(gh.clubs), players = structuredClone(gh.players);
      runAiEconomy({ clubs, players, managedClubId: gh.managedClubId, season: gh.season, date: '1995-07-01', year, rng: () => 0.5, skipInvest: true, tier: 1, staffAnnual: withStaff ? staff : undefined });
      const id = staffedClubs(gh).sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0))[0].id;
      return { id, w: clubs[id].playerIds.reduce((a, pid) => a + (players[pid]?.contract.weeklyWage ?? 0), 0) * 52 * economyScale(year) };
    };
    const a = wagesAfter(false), b = wagesAfter(true);
    const st = staff[a.id] ?? 0;
    if (!(st > 0)) fail('Haushalt: keine Stabkosten für den größten KI-Verein');
    if (b.w >= a.w) fail('Haushalt: Stabkosten mindern die Spielergehälter nicht');
    if (a.w - b.w > st) fail(`Haushalt: Spielergehälter sinken stärker als die Stabkosten (${Math.round(a.w - b.w)} > ${Math.round(st)})`);
    out.push(`Haushalt: Stab ${Math.round(st / 1000)} Tsd./Jahr → Spielergehälter −${((1 - b.w / a.w) * 100).toFixed(1)} %`);
  }
  void memberMonthlySalary;
  return out;
}
