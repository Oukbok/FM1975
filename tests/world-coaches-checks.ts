// =============================================================================
// Cheftrainer aller Vereine der Welt (game/worldCoaches.ts) – Prüfungen für npm run test:staff.
//   worldCoachChecks()       neues Spiel 1975/2005, Herkunft, Ansehen, Gegner als voller Verein, Gast,
//                            Auf-/Absteiger, Migration alter Spielstände, Idempotenz, Determinismus
//   worldCoachLongChecks()   nach dem Langlauf: Karussell im Ausland, Ex-Profis, Wechsel zwischen Ländern
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import type { Game } from '../src/game/state';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { buildEuroClubFull } from '../src/data/generate';
import { isLeagueClub } from '../src/engine/clubEconomy';
import { ensureGuestClub } from '../src/game/worldSquad';
import { coachAsStaff } from '../src/engine/staffGen';
import { adoptHead, attachHead, coachOfClub, ensureWorldHeads, headTargets, noteWorldRetirees, stashHead, worldHeads, worldHeadsSeasonEnd, type WHead } from '../src/game/worldCoaches';
import { leanClubs } from '../src/game/staffLean';

function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function make(year: number, club = 'mgl'): Game {
  return createNewGame({
    managedClubId: club, startYear: year,
    manager: { name: 'Test', nationality: 'GER', birthYear: year - 35, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  } as any);
}

const TACTIC: Record<string, string> = { offensiv: 'attacking', ausgewogen: 'balanced', defensiv: 'defensive', konter: 'counter' };

export function worldCoachChecks(): string[] {
  const out: string[] = [];
  for (const year of [1975, 2005]) {
    const g = make(year, year >= 2000 ? 'muc' : 'mgl');
    const hs = worldHeads(g);
    if (!hs) fail(`${year}: kein Pool der Welt-Trainer`);
    const targets = headTargets(g);
    const missing = [...targets.keys()].filter((id) => !hs.c[id]);
    if (missing.length) fail(`${year}: ${missing.length} Vereine ohne Cheftrainer (z. B. ${missing.slice(0, 3).join(', ')})`);
    for (const [id, h] of Object.entries(hs.c)) {
      if (!h[1] || !h[2] || !Number.isFinite(h[3]) || !(h[4] >= 10 && h[4] <= 99) || h[5] < 0 || h[5] > 11 || !/^\d{4}-\d\d-\d\d$/.test(h[6])) fail(`${year}: Trainer ${id} ungültig ${JSON.stringify(h)}`);
      const age = year - h[3];
      if (age < 30 || age > 70) fail(`${year}: Trainer ${h[1]} (${id}) ist ${age} Jahre alt`);
    }
    // Jeder Verein mit vollem Kader hat seinen Trainer am Verein, keiner doppelt.
    for (const c of Object.values(g.clubs)) if (isLeagueClub(c) && hs.c[c.id]) fail(`${year}: ${c.id} hat zwei Trainer`);
    if (coachOfClub(g, g.managedClubId)) fail('eigener Verein hat einen KI-Trainer');
    const league = Object.values(g.clubs).find((c) => isLeagueClub(c) && c.id !== g.managedClubId)!;
    if (coachOfClub(g, league.id) !== league.coach) fail('KI-Verein der Spielerliga: Trainer nicht vom Verein');
    // Herkunft: in jedem großen Land überwiegend Einheimische.
    const natShare: string[] = [];
    for (const land of ['England', 'Italien', 'Spanien', 'Frankreich', 'Niederlande']) {
      const ids = [...targets.entries()].filter(([, t]) => t.country === land).map(([id]) => id);
      if (ids.length < 10) continue;
      const nats = new Map<string, number>();
      for (const id of ids) nats.set(hs.c[id][2], (nats.get(hs.c[id][2]) ?? 0) + 1);
      const [topNat, n] = [...nats].sort((a, b) => b[1] - a[1])[0];
      const share = n / ids.length;
      if (share < 0.6 || share > 0.95) fail(`${year} ${land}: Anteil einheimischer Trainer ${Math.round(share * 100)} % (${topNat})`);
      if (nats.size < 2) fail(`${year} ${land}: keine ausländischen Trainer`);
      natShare.push(`${land} ${topNat} ${Math.round(share * 100)} %`);
    }
    // Ansehen folgt der Vereinsgröße: die 30 stärksten Auslandsvereine über den 30 schwächsten.
    const foreign = [...targets.entries()].filter(([, t]) => t.country).sort((a, b) => b[1].rep - a[1].rep);
    const top = avg(foreign.slice(0, 30).map(([id]) => hs.c[id][4])), low = avg(foreign.slice(-30).map(([id]) => hs.c[id][4]));
    if (top < low + 15) fail(`${year}: Ansehen groß ${top.toFixed(0)} vs. klein ${low.toFixed(0)}`);
    // Sim-Vereine der Heimat (2. Liga) haben ebenfalls einen Trainer.
    const sim = Object.values(g.simClubs).filter((s) => s.tier === 2);
    if (!sim.length || sim.some((s) => !coachOfClub(g, s.id))) fail(`${year}: Sim-Verein der 2. Liga ohne Trainer`);
    // Größe im Spielstand
    const bytes = JSON.stringify(hs).length;
    if (bytes / Object.keys(hs.c).length > 90) fail(`${year}: Trainer im Pool zu groß (${(bytes / Object.keys(hs.c).length).toFixed(0)} B je Verein)`);
    out.push(`${year}: ${Object.keys(hs.c).length} Cheftrainer im Pool der Welt (${(bytes / 1024).toFixed(0)} KB), Ansehen groß ${top.toFixed(0)} / klein ${low.toFixed(0)}, ${natShare.join(', ')}`);

    if (year !== 1975) continue;
    // Europapokal-Gegner als voller Verein: Trainer + Taktik nach seinem Stil.
    const fid = foreign[0][0];
    const eu = g.euroClubs![fid];
    g.clubs[fid] = buildEuroClubFull(eu, g.calendar.seasonStartDate, g.players);
    attachHead(g, g.clubs[fid]);
    const c = g.clubs[fid].coach;
    if (!c || c.name !== hs.c[fid][1]) fail('Europapokal-Gegner: Trainer fehlt bzw. weicht vom Pool ab');
    if (g.clubs[fid].tactics.style !== TACTIC[c.style]) fail('Europapokal-Gegner: Taktik folgt nicht dem Trainerstil');
    // Gast aus der 2. Liga (Pokal): Trainer des Sim-Vereins.
    const guest = sim[0].id;
    const want = hs.c[guest][1];
    if (!ensureGuestClub(g, guest) || g.clubs[guest].coach?.name !== want) fail('Gastverein: Trainer fehlt');
    // Idempotent: noch einmal nachrüsten ändert nichts (angelegte Gäste behalten ihren Trainer).
    const before = JSON.stringify(hs);
    ensureWorldHeads(g, true);
    if (JSON.stringify(worldHeads(g)) !== before) fail('ensureWorldHeads nicht idempotent');
    // Absteiger → Pool, Aufsteiger ← Pool (season.ts 5a/5b).
    const down = Object.values(g.clubs).find((x) => isLeagueClub(x) && x.id !== g.managedClubId && x.coach)!;
    const name = down.coach!.name;
    stashHead(g, down);
    if (worldHeads(g)!.c[down.id]?.[1] !== name) fail('Absteiger: Trainer nicht im Pool der Welt');
    const coachBefore = down.coach;
    down.coach = undefined;
    adoptHead(g, down);
    if (down.coach?.name !== name || worldHeads(g)!.c[down.id]) fail('Aufsteiger: Trainer nicht übernommen');
    down.coach = coachBefore;
    // Ex-Profis des Weltpools werden freie Trainer (Chance nach Stärke, fest je ID).
    const nf = hs.f.length;
    noteWorldRetirees(g, Array.from({ length: 200 }, (_, i) => ({ id: `wp_test_${i}`, name: `Test Profi${i}`, nat: 'ENG', born: 1941, ov: 82 })));
    const ex = hs.f.length - nf;
    if (ex < 20 || ex > 120) fail(`Ex-Profis als Trainer unplausibel (${ex} von 200 Starken)`);
    // Saisonende: Karussell mit Tabellen (ohne Spieltage: nur Ruhestand/Vertragsende) – jeder Verein bleibt besetzt.
    worldHeadsSeasonEnd(g, `${year + 1}-06-29`);
    const miss2 = [...headTargets(g).keys()].filter((id) => !worldHeads(g)!.c[id]);
    if (miss2.length) fail(`Saisonende: ${miss2.length} Vereine ohne Trainer`);
    out.push(`Gegner/Gast/Auf-/Absteiger ok, Ex-Profis ${ex}/200 als freie Trainer`);
  }

  // Determinismus: zwei neue Spiele → gleiche Trainer.
  const a = JSON.stringify(worldHeads(make(1985))), b = JSON.stringify(worldHeads(make(1985)));
  if (a !== b) fail('Trainer der Welt nicht deterministisch');

  // Alter Spielstand: ohne Pool der Welt, Auslands-Cheftrainer noch im schlanken Stab → Migration beim Laden.
  const old = make(1975);
  const w = old.staffWorld!;
  const lean = leanClubs(old).find((c) => c.kind === 'foreign')!;
  const hc = old.clubs[Object.keys(old.clubs).find((id) => isLeagueClub(old.clubs[id]) && old.clubs[id].coach)!].coach!;
  const person = { ...coachAsStaff({ ...hc, id: 'old_head', name: 'Altmann Auslandstrainer' }, 1975), clubId: lean.id, hired: '1974-07-01', contractEnd: '1977-06-30' };
  w.people.push(person);
  delete w.heads;
  for (const c of Object.values(old.clubs)) if (!isLeagueClub(c)) c.coach = undefined;
  const saved = JSON.parse(JSON.stringify(old)) as Game;
  prepareLoadedGame(saved);
  const hs2 = worldHeads(saved);
  if (!hs2 || [...headTargets(saved).keys()].some((id) => !hs2.c[id])) fail('Migration: Vereine ohne Trainer');
  if (hs2.c[lean.id]?.[1] !== 'Altmann Auslandstrainer') fail('Migration: Auslandstrainer des schlanken Stabs nicht übernommen');
  if (saved.staffWorld!.people.some((m) => m.roleId === 'cheftrainer' && m.clubId === lean.id)) fail('Migration: Auslandstrainer doppelt');
  const again = JSON.stringify(hs2);
  prepareLoadedGame(saved);
  if (JSON.stringify(worldHeads(saved)) !== again) fail('Migration nicht idempotent');
  out.push('Migration alter Spielstände ok (idempotent), Determinismus ok');
  return out;
}

/** Je Saisonwechsel im Langlauf: Vereinswechsel der Trainer zählen (gleiche ID, anderer Verein; anderes Land). */
const track = { prev: new Map<string, [string, string]>(), moved: 0, abroad: 0, fromHome: 0, seasons: 0 };
export function trackWorldHeads(g: Game): void {
  const hs = worldHeads(g);
  if (!hs) return;
  const targets = headTargets(g);
  const land = (id: string) => targets.get(id)?.country ?? 'Heimat';
  const now = new Map<string, [string, string]>();
  for (const [id, h] of Object.entries(hs.c)) now.set(h[0], [id, land(id)]);
  for (const c of Object.values(g.clubs)) if (c.coach && isLeagueClub(c)) now.set(c.coach.id, [c.id, 'Heimat']);
  if (track.seasons++) for (const [cid, [club, l]] of now) {
    const was = track.prev.get(cid);
    if (!was || was[0] === club) continue;
    track.moved++;
    if (was[1] !== l) { track.abroad++; if (l === 'Heimat') track.fromHome++; }
  }
  track.prev = now;
}

/** Nach dem Langlauf (staff-test Abschnitt 5): Karussell im Ausland hat gearbeitet. */
export function worldCoachLongChecks(g: Game, start: Record<string, WHead>, seasons: number): string[] {
  const hs = worldHeads(g);
  if (!hs) fail('Langlauf: Pool der Welt fehlt');
  const targets = headTargets(g);
  const missing = [...targets.keys()].filter((id) => !hs.c[id]);
  if (missing.length) fail(`Langlauf: ${missing.length} Vereine ohne Trainer`);
  const kept = [...targets.keys()].filter((id) => start[id] && hs.c[id][0] === start[id][0]).length;
  const changed = [...targets.keys()].filter((id) => start[id] && hs.c[id][0] !== start[id][0]).length;
  if (seasons >= 5 && changed < kept) fail(`Langlauf: kaum Trainerwechsel (${changed} gewechselt, ${kept} geblieben)`);
  const exPros = hs.f.filter((f) => f[7] === 1).length;
  const ages = Object.values(hs.c).map((h) => Number(g.season.slice(0, 4)) - h[3]);
  if (avg(ages) < 40 || avg(ages) > 60) fail(`Langlauf: Durchschnittsalter der Trainer ${avg(ages).toFixed(1)}`);
  const dom = [...targets.keys()].filter((id) => targets.get(id)?.country === 'England');
  const engShare = dom.length ? dom.filter((id) => hs.c[id][2] === 'ENG').length / dom.length : 1;
  if (engShare < 0.5) fail(`Langlauf: England nur ${Math.round(engShare * 100)} % einheimische Trainer`);
  if (seasons >= 5 && track.moved < seasons * 5) fail(`Langlauf: kaum Vereinswechsel von Trainern (${track.moved})`);
  if (seasons >= 5 && !track.abroad) fail('Langlauf: kein Trainer wechselt das Land');
  const per = (n: number) => (n / Math.max(1, track.seasons - 1)).toFixed(1);
  return [`${Object.keys(hs.c).length} Trainer, ${changed} Vereine mit neuem Trainer (${kept} wie zu Beginn); je Saison ${per(track.moved)} Vereinswechsel, davon ${per(track.abroad)} in ein anderes Land (${per(track.fromHome)} in die Heimat); freie Trainer ${hs.f.length} (Ex-Profis ${exPros}), Ø Alter ${avg(ages).toFixed(1)}, England einheimisch ${Math.round(engShare * 100)} %`];
}
