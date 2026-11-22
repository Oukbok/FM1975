// Weitere Auszeichnungen (Goldener Schuh, Trainer des Jahres, Elf der Saison) – Prüfungen
// für tests/awards-test.ts (`npm run test:awards`): reine Formeln + Archiv nach echten Saisons,
// Speicherplatz, Migration.
import { getFormation } from '../src/data/formations';
import { coachScore, type CoachCandidate } from '../src/engine/coachAward';
import { rankGoldenShoe, shoeFactor } from '../src/engine/goldenShoe';
import type { AwardCandidate } from '../src/engine/seasonAwards';
import { pickTeamOfSeason, tosFormationId } from '../src/engine/teamOfSeason';
import { extraAwardsState, migrateExtraAwards, MAX_EXTRA_SEASONS } from '../src/game/extraAwardsGame';
import type { Game } from '../src/game/state';
import { worldTeamsOf } from '../src/game/worldAwardsGame';

function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };

export function checkExtraFormulas(): void {
  // Goldener Schuh: ungewichtet bis 1996, danach 2 / 1,5 / 1 nach Rang des Landes
  expect(shoeFactor(1990, 1) === 1 && shoeFactor(1996, 3) === 1, 'Schuh vor 1997 gewichtet');
  expect(shoeFactor(1997, 5) === 2 && shoeFactor(1997, 6) === 1.5 && shoeFactor(2010, 21) === 1.5 && shoeFactor(2010, 22) === 1, 'Schuh-Faktoren falsch');
  const sc = (pid: string, goals: number, rank: number, apps = 30) => ({ pid, name: pid, clubId: 'c', clubName: 'C', country: 'X', home: false, pos: 'MS', apps, goals, rank });
  const shoe = rankGoldenShoe([sc('a', 30, 30), sc('b', 20, 2), sc('c', 20, 2, 25)], 2005);
  expect(shoe[0].pid === 'c' && shoe[1].pid === 'b' && shoe[2].pid === 'a', 'Schuh: Gewichtung/Gleichstand falsch');
  expect(rankGoldenShoe([sc('a', 30, 30), sc('b', 20, 2)], 1985)[0].pid === 'a', 'Schuh: vor 1997 nicht nach Toren');
  // Trainer des Jahres: Überraschung schlägt Pflichterfüllung, Titel zählen, Amtszeit anteilig
  const cc = (o: Partial<CoachCandidate>): CoachCandidate => ({ clubId: 'x', clubName: 'X', coach: 'T', rank: 5, expected: 5, teams: 18, champion: false, cup: false, tenure: 1, ...o });
  expect(coachScore(cc({ rank: 3, expected: 12 })) > coachScore(cc({ rank: 3, expected: 3 })), 'Trainer: Überraschung zählt nicht');
  expect(coachScore(cc({ rank: 1, expected: 1, champion: true })) > coachScore(cc({ rank: 2, expected: 1 })), 'Trainer: Meister zählt nicht');
  expect(coachScore(cc({ rank: 3, expected: 12, tenure: 0.5 })) < coachScore(cc({ rank: 3, expected: 12 })), 'Trainer: Amtszeit zählt nicht');
  expect(coachScore(cc({ euro: { comp: 'ec', round: 5, rounds: 6, won: true, label: 'Finale', name: 'Pokal' } })) > coachScore(cc({})) + 2, 'Trainer: Europapokalsieg zählt nicht');
  // Elf der Saison: Formation je Epoche, Positionen passend
  expect(tosFormationId(1980) === 'libero-1-4-3-2' && tosFormationId(1990) === 'libero-1-3-4-2' && tosFormationId(2000) === '4-4-2' && tosFormationId(2015) === '4-2-3-1', 'Formation je Epoche falsch');
  const pos = ['TW', 'TW', 'LIB', 'IV', 'IV', 'IV', 'IV', 'LV', 'RV', 'RV', 'DM', 'ZM', 'ZM', 'OM', 'LM', 'RM', 'MS', 'MS', 'HS', 'LA'];
  const cands: AwardCandidate[] = pos.map((p, i) => ({
    pid: `p${i}`, name: `S ${i}`, clubId: 'c', clubName: 'C', pos: p, cat: p === 'TW' ? 'GK' : ['LIB', 'IV', 'LV', 'RV'].includes(p) ? 'DEF' : ['MS', 'HS', 'LA'].includes(p) ? 'ATT' : 'MID',
    age: 25, apps: 30, avg: 2.5 + (i % 5) * 0.2, goals: 3, assists: 2, clean: 8, gaPerGame: 1.2, rank: 4,
  }));
  for (const y of [1980, 1990, 2000, 2015]) {
    const r = pickTeamOfSeason(cands, { matchdays: 34, teams: 18 }, y);
    const f = getFormation(r.formation);
    expect(r.xi.length === 11 && new Set(r.xi.map((x) => x.c.pid)).size === 11, `Elf ${y}: nicht 11 verschiedene Spieler`);
    const exact = r.xi.filter((x, i) => x.c.pos === f.slots[i].position).length;
    expect(r.xi.filter((x) => x.slot === 'TW').every((x) => x.c.pos === 'TW'), `Elf ${y}: Torwart kein Torwart`);
    console.log(`Elf ${y} (${f.label}): ${exact}/11 auf ihrer Stammposition`);
  }
  console.log('Formeln Torjägerstern / Trainer / Elf der Saison: OK');
}

export function checkExtraArchive(g: Game, seasons: string[]): void {
  const st = extraAwardsState(g);
  expect(st, 'Kein Archiv der weiteren Auszeichnungen');
  for (const s of seasons) {
    const shoe = st!.shoe.find((x) => x.s === s);
    expect(shoe && shoe.top.length === 10, `${s}: Torjägerstern fehlt / nicht 10 Plätze`);
    for (let i = 1; i < shoe!.top.length; i++) expect(shoe!.top[i - 1].pts >= shoe!.top[i].pts, `${s}: Schuh nicht sortiert`);
    expect(shoe!.top.every((e) => e.pts === Math.round(e.gl * e.f * 10) / 10), `${s}: Schuh-Punkte ≠ Tore × Faktor`);
    const coach = st!.coach.find((x) => x.s === s);
    expect(coach && coach.top.length === 3 && coach.top.every((e) => e.why.length > 8 && e.n), `${s}: Trainer des Jahres fehlt / ohne Begründung`);
    const xi = st!.xi.find((x) => x.s === s);
    expect(xi && xi.x.length === 11 && xi.x.every((r) => r[3] && xi.c[r[2]]), `${s}: Elf der Saison der eigenen Liga fehlt / ohne Spieler-IDs/Vereine`);
    const f = getFormation(xi!.f ?? '');
    const exact = xi!.x.filter((r, i) => g.players[r[3]!]?.naturalPosition === f.slots[i].position).length;
    expect(exact >= 7, `${s}: nur ${exact}/11 der Elf auf ihrer Stammposition`);
    const w = shoe!.top[0];
    console.log(`${s}: Schuh ${w.n} (${w.cn}, ${w.k}) ${w.gl}×${w.f}=${w.pts} | Trainer ${coach!.top.map((e) => `${e.n} (${e.cn}, ${e.rk}./erw. ${e.ex}.)`).join(', ')} | Elf ${f.label} (${exact}/11 Stammpos.): ${xi!.x.map((r, i) => `${f.slots[i].position} ${r[0].split(' ').pop()}`).join(', ')}`);
    console.log(`   ${coach!.top[0].why}`);
  }
  const xiw = seasons.flatMap((s) => worldTeamsOf(g, s));
  expect(!st!.xiw, 'Altes Feld extraAwards.xiw noch vorhanden');
  expect(xiw.length > 10 && xiw.every((x) => x.x.length === 11 && x.x.every((r) => !r[3] && r[0] && r[0] !== '?' && x.c[r[2]] && r[1] > 50)), `Elf der Auslandsligen fehlt (${xiw.length}) oder unvollständig`);
  const last = xiw.filter((x) => x.s === xiw[xiw.length - 1].s);
  console.log(`   ${last[0].s} ${last[0].d}: ${last[0].x.map((r) => `${r[0].split(' ').pop()} ${(r[1] / 100).toFixed(2)}`).join(', ')}`);
  const kb = (v: unknown) => (JSON.stringify(v ?? null).length / 1024).toFixed(1);
  console.log(`Speicher: Schuh ${kb(st!.shoe)} KB, Trainer ${kb(st!.coach)} KB, Elf eigene Liga ${kb(st!.xi)} KB (${st!.xi.length} Saisons), Elf Ausland ${xiw.length} Ligen (in seasonAwards.wv), je Saison gesamt ≈ ${((JSON.stringify(st).length / Math.max(1, seasons.length)) / 1024).toFixed(1)} KB`);

  // Migration: begrenzt, idempotent, alte Stände ohne Feld bleiben leer
  const one = st!.shoe[0];
  for (let i = 0; i < MAX_EXTRA_SEASONS + 5; i++) st!.shoe.push({ ...one, s: `x${i}` });
  migrateExtraAwards(g);
  expect(st!.shoe.length === MAX_EXTRA_SEASONS, 'Schuh-Archiv nicht begrenzt');
  st!.shoe = st!.shoe.filter((x) => !x.s.startsWith('x'));
  const snap = JSON.stringify(st);
  migrateExtraAwards(g);
  expect(JSON.stringify(st) === snap, 'Migration der weiteren Auszeichnungen nicht idempotent');
  const old = { ...g } as any;
  delete old.extraAwards;
  migrateExtraAwards(old);
  expect(old.extraAwards === undefined, 'Migration legt bei alten Ständen ein Feld an');
  console.log('OK – Torjägerstern, Trainer des Jahres, Elf der Saison');
}
