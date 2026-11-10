// Vereinsauszeichnungen ohne UI: Hürden, Laufzeit/Verlängerung, Eigengewächs, Wirkungstabelle.
//   npm run test:honours
import { HONOURS } from '../src/data/clubHonours';
import { CHECKS, bindHonours, isHomegrown, type HonourFacts, type HonourState } from '../src/game/clubHonours';
import { honourFx } from '../src/engine/honourEffects';
import type { Game } from '../src/game/state';
import type { Club, Player } from '../src/types';

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log('FEHLER:', m); } };

const base: HonourFacts = {
  s: '1980/81', tier: 1, pos: 9, hg: 0, hg80: 0, hgTop: 0, hgRec: 0, youth: 0, eu: 0, euMain: 0, cup: 0, out: 1, homeL: 3, homeD: 4,
  gfpg: 1.5, gapg: 1.4, bestAtt: 0, bestDef: 0, attRatio: 1, fair: 0, mood: 55, loyal: 2, loyalHg: 0, profit: 0, loan: 0, reserve: 0.1,
  att: 0.6, cap: 30000, trf: 0, str: 75, coachY: 1, calm: 1, title: 0,
};
const seq = (n: number, p: Partial<HonourFacts>) => Array.from({ length: n }, (_, i) => ({ ...base, ...p, s: `${1980 + i}/${String(81 + i).slice(-2)}` }));

// Durchschnittssaison: keine Auszeichnung
for (const h of HONOURS) ok(CHECKS[h.id](seq(10, {})) < 0, `${h.id}: Durchschnittssaison ohne Stufe`);
// Stufen
ok(CHECKS.talentschmiede(seq(1, { hg: 3 })) === 0 && CHECKS.talentschmiede(seq(1, { hg: 5 })) === 1 && CHECKS.talentschmiede(seq(1, { hg: 7, hg80: 3 })) === 2, 'Talentschmiede B/S/G');
ok(CHECKS.talentschmiede(seq(1, { hg: 7, hg80: 2 })) === 1, 'Talentschmiede Gold braucht 3× Stärke 80+');
ok(CHECKS.spitzenklub(seq(3, { pos: 2 })) === 0 && CHECKS.spitzenklub(seq(2, { pos: 2 })) < 0, 'Spitzenklub Bronze: drei Saisons Top 2');
ok(CHECKS.spitzenklub(seq(3, { pos: 1 })) === 2, 'Spitzenklub Gold: drei Titel in Folge');
ok(CHECKS.festung(seq(1, { homeL: 0, homeD: 5 })) === 0 && CHECKS.festung(seq(1, { homeL: 0, homeD: 2 })) === 1 && CHECKS.festung(seq(2, { homeL: 0, homeD: 5 })) === 2, 'Festung B/S/G');
ok(CHECKS.kasse(seq(5, { profit: 1 })) === 0 && CHECKS.kasse(seq(4, { profit: 1 })) < 0, 'Solide Kasse: fünf Gewinnjahre');
ok(CHECKS.kasse(seq(10, { profit: 1, reserve: 1.1 })) === 2, 'Solide Kasse Gold');
ok(CHECKS.pokalschreck(seq(1, { cup: 2, out: 0 })) < 0, 'Pokalschreck nur als Außenseiter');
// Lücke in der Serie zählt nicht
const gap = seq(3, { pos: 1 }); gap[1] = { ...gap[1], s: '1990/91' };
ok(CHECKS.spitzenklub(gap) < 2, 'Serie muss lückenlos sein');

// Eigengewächs
const club = { id: 'xyz', name: 'Testhausen' } as Club;
const p = (id: string, extra: Partial<Player> = {}) => ({ id, history: { transfers: [] }, ...extra }) as unknown as Player;
ok(isHomegrown(p('xyz_y_1'), club), 'Eigengewächs aus der eigenen Jugend');
ok(!isHomegrown(p('abc_y_1'), club), 'fremde Jugend zählt nicht');
ok(!isHomegrown(p('xyz_p1'), club), 'Profi ohne Jugend zählt nicht');
ok(!isHomegrown(p('xyz_y_2', { youthJoined: '1980-07-01', youthPromoted: '1980-12-01' }), club), 'weniger als ein Jahr in der Jugend');
ok(isHomegrown(p('xyz_y_3', { history: { transfers: [{ date: '1982-07-01', fromClub: 'Testhausen', toClub: 'B', fee: 1000, kind: 'loan' }] } }), club), 'Leihe beendet den Status nicht');
ok(!isHomegrown(p('xyz_y_4', { history: { transfers: [{ date: '1982-07-01', fromClub: 'Testhausen', toClub: 'B', fee: 50000 }, { date: '1984-07-01', fromClub: 'B', toClub: 'Testhausen', fee: 80000 }] } }), club), 'verkauft und zurückgekauft zählt nicht');

// Wirkungstabelle
const st: HonourState = { v: 1, facts: {}, active: { xyz: { talentschmiede: { tier: 1, until: 1990, since: 1986 }, sprungbrett: { tier: 2, until: 1990, since: 1986 } } }, moodMin: {} };
bindHonours({ honours: st } as unknown as Game, true);
ok(Math.abs(honourFx('xyz', 'youthAppeal') - 0.2) < 1e-9, 'Wirkungen addieren sich (Silber 10 % + Sprungbrett Gold 10 %)');
ok(honourFx('abc', 'youthAppeal') === 0, 'ohne Auszeichnung keine Wirkung');
bindHonours({} as unknown as Game, true);
ok(honourFx('xyz', 'youthAppeal') === 0, 'neuer Spielstand leert die Tabelle');

console.log(fails ? `${fails} Fehler.` : 'Auszeichnungen-Test bestanden.');
if (fails) process.exit(1);
