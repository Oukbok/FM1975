// Seitenlinie im Textmodus ohne UI:  npm run test:sideline
// Aufwärmen (Bonus beim Einwechseln), Co-Trainer-Wechsel, Verletzter wartet auf dich,
// Umstellung (Formation/Positionen), Einzelgespräche, Wechsel-Entwurf, KI-Spiele unverändert.
import { createNewGame } from '../src/game/newGame';
import { leagueClubs } from '../src/game/season';
import { setEraYear } from '../src/engine/positions';
import { MatchSim } from '../src/engine/match/sim';
import { bench, onPitch } from '../src/engine/match/state';
import { isWarm, playerTalk, reshape, warmUp, WARM_ENERGY } from '../src/engine/match/sideline';
import { getFormation } from '../src/data/formations';
import { applyDraft, changeFormation, draftDiff, initialDraft, swap } from '../src/screens/match/changes/draft';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FEHL'} ${msg}`); };

const g = createNewGame({
  managedClubId: 'mgl', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const clubs = leagueClubs(g);
const P = g.players;
setEraYear(1995);
const run = (sim: MatchSim, until: number) => { let n = 0; while (!sim.finished && (sim.minute < until || sim.phase !== 'play') && n++ < 400) { sim.step(); if (sim.minute >= until && sim.phase === 'play') break; } };

// 1) Aufwärmen: Einwechsler startet frischer
{
  const sim = new MatchSim(clubs[0], clubs[1], P, { year: 1995, seed: 7, humanSides: ['home'], live: true });
  run(sim, 60);
  const t = sim.home;
  const [b1, b2] = bench(t);
  const e2 = b2.energy;
  check(warmUp(sim, 'home', b1.id, true), 'Ersatzspieler wärmt sich auf');
  run(sim, 64);
  check(isWarm(sim, b1), `nach ${sim.minute - (b1.warmSince ?? 0)} Minuten warm`);
  const e1 = b1.energy, d1 = b1.day ?? 1;
  const out1 = onPitch(t).find((m) => m.group !== 'GK')!, out2 = onPitch(t).filter((m) => m.group !== 'GK')[1];
  sim.substitute('home', out1.id, b1.id);
  sim.substitute('home', out2.id, b2.id);
  check(b1.energy === Math.min(100, e1 + WARM_ENERGY) && (b1.day ?? 1) > d1, `aufgewärmt: Kraft ${e1.toFixed(1)} → ${b1.energy.toFixed(1)}`);
  check(b2.energy === e2, 'ohne Aufwärmen kein Bonus');
  check(t.layout!.map[Object.keys(t.layout!.map).find((k) => t.layout!.map[k] === b1.id)!] === b1.id, 'Einwechsler übernimmt den Slot');
}

// 2) Co-Trainer wechselt Erschöpfte (automatisch) – ohne ihn wechselt niemand
for (const auto of [true, false]) {
  let subs = 0;
  for (let s = 0; s < 30; s++) {
    const sim = new MatchSim(clubs[2], clubs[3], P, { year: 1995, seed: 100 + s, humanSides: ['home'], live: true });
    sim.home.coach = { autoSubs: auto };
    for (const m of sim.home.players) m.energy = Math.min(m.energy, 70);
    sim.runToEnd();
    subs += sim.home.subsUsed;
  }
  if (auto) check(subs >= 30, `Co-Trainer an: ${subs} Wechsel in 30 Spielen`);
  else check(subs <= 3, `Co-Trainer aus: ${subs} Wechsel (nur Verletzungen ohne Wechselrecht wären Abgänge)`);
}

// 3) Verletzter wartet auf dich (manuell)
{
  let waited = 0, ai = 0;
  for (let s = 0; s < 80 && !waited; s++) {
    const sim = new MatchSim(clubs[4], clubs[5], P, { year: 1995, seed: 300 + s, humanSides: ['home'], live: true });
    sim.runToEnd();
    for (const e of sim.events) {
      if (e.kind === 'injury' && e.side === 'home' && e.detail === 'wartet') waited++;
      if (e.kind === 'injury' && e.side === 'away' && e.detail === 'wartet') ai++;
    }
  }
  check(waited > 0, 'manuell: Verletzter bleibt auf dem Platz und wartet');
  check(ai === 0, 'KI-Seite wechselt Verletzte wie bisher');
}

// 4) Umstellung + Entwurf
{
  const sim = new MatchSim(clubs[6], clubs[7], P, { year: 1995, seed: 5, humanSides: ['home'], live: true });
  run(sim, 30);
  const d = initialDraft(sim, 'home');
  check(Object.keys(d.map).length === 11, 'Entwurf: elf Spieler auf Slots');
  changeFormation(sim, 'home', d, '4-3-3');
  check(d.formation === '4-3-3' && Object.keys(d.map).length === 11, 'Formation 4-3-3 im Entwurf');
  const field = Object.values(d.map)[5];
  const b = bench(sim.home)[0];
  check(swap(sim, 'home', d, field, b.id) === null && draftDiff(sim, 'home', d).ins.length === 1, 'Wechsel im Entwurf geplant');
  applyDraft(sim, 'home', d);
  check(sim.home.formation === '4-3-3' && sim.home.subsUsed === 1 && b.onPitch, 'Entwurf angewendet: Wechsel + Formation');
  const f = getFormation('4-3-3');
  const ok = onPitch(sim.home).every((m) => f.slots.some((s) => sim.home.layout!.map[s.id] === m.id && s.position === m.pos));
  check(ok, 'Positionen folgen den Slots');
  check(reshape(sim, 'home', '4-3-3', sim.home.layout!.slots, sim.home.layout!.map) === 0, 'gleiche Aufstellung: keine Änderung');
  const m = onPitch(sim.home)[3];
  const before = m.day ?? 1;
  check(playerTalk(sim, 'home', m.id, 'fordern', 4.5) !== null && (m.day ?? 1) !== before, 'Einzelgespräch wirkt auf die Tagesleistung');
  check(playerTalk(sim, 'home', m.id, 'loben', 2) === null, 'nur ein Gespräch je Halbzeit');
  // Wechsel-Limit
  const d2 = initialDraft(sim, 'home');
  const ids = Object.values(d2.map).filter((id) => sim.players[id].naturalPosition !== 'TW');
  const bs = bench(sim.home);
  let err: string | null = null;
  for (let i = 0; i < bs.length && !err; i++) err = swap(sim, 'home', d2, ids[i], bs[i].id);
  check(!!err && draftDiff(sim, 'home', d2).ins.length === sim.subsLeft(sim.home), `Wechsel-Limit greift (${err})`);
}

// 5) KI-Spiele unverändert (gleicher Seed = gleiches Ergebnis, keine Seitenlinien-Ereignisse)
{
  const a = new MatchSim(clubs[0], clubs[9], P, { year: 1995, seed: 42 }); a.runToEnd();
  const b = new MatchSim(clubs[0], clubs[9], P, { year: 1995, seed: 42 }); b.runToEnd();
  check(a.score().join() === b.score().join() && !a.events.some((e) => e.kind === 'warmup' || e.kind === 'reshape'), 'KI-Spiel reproduzierbar, ohne Seitenlinie');
}

console.log(fails ? `${fails} Prüfung(en) fehlgeschlagen.` : 'Seitenlinien-Test bestanden.');
if (fails) process.exit(1);
