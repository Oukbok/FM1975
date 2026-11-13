// Erfahrung & Teambonus über mehrere Saisons messen (Wunsch Pascal).
//   node scripts/run-ts.mjs tests/expProbe.ts [saisons]
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { boostTier, leaderScore } from '../src/engine/teamBoost';
import type { Player } from '../src/types';
import { groupOf } from '../src/engine/attributeAging';

let seed = 4711;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const N = Math.max(1, Number(process.argv[2]) || 6);
const ui: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onOwnMatchDue() {}, onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false } as any;
const g = createNewGame({ managedClubId: 'fra', manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
(g as any).simAutoManage = true;

function report(tag: string) {
  const ps = (Object.values(g.players) as Player[]).filter((p) => p.clubId && !p.world);
  const band = (lo: number, hi: number) => ps.filter((p) => p.age >= lo && p.age <= hi);
  const avg = (a: Player[]) => a.length ? (a.reduce((s, p) => s + (p.attributes.experience ?? 0), 0) / a.length).toFixed(0) : '-';
  const top = (a: Player[]) => a.filter((p) => p.overall >= 78);
  const low = (a: Player[]) => a.filter((p) => p.overall < 62);
  const line = [[18, 21], [22, 25], [26, 29], [30, 33], [34, 40]].map(([lo, hi]) => { const b = band(lo, hi); return `${lo}-${hi}: Ø${avg(b)} (Top ${avg(top(b))} / schwach ${avg(low(b))})`; }).join(' | ');
  const e66 = ps.filter((p) => (p.attributes.experience ?? 0) >= 66).length;
  const elig = ps.filter((p) => boostTier(p)).length;
  const lead76 = ps.filter((p) => (p.attributes.leadership ?? 0) >= 76).length;
  const both = ps.filter((p) => (p.attributes.leadership ?? 0) >= 76 && (p.attributes.experience ?? 0) >= 66).length;
  const hold = ps.filter((p) => p.teamBoost);
  console.log(`${tag} n=${ps.length} | Erf≥66 ${e66} | Führ≥76 ${lead76} | beides ${both} | infrage ${elig} | Träger ${hold.length} (${hold.map((p) => p.teamBoost![0]).join('')})`);
  console.log('   ' + line);
  const grp = (a: Player[], g: string) => { let s = 0, n = 0; for (const p of a) for (const [k, v] of Object.entries(p.attributes)) if (groupOf(k as any) === g) { s += v as number; n++; } return n ? (s / n).toFixed(0) : '-'; };
  console.log('   Werte je Alter (Tempo/Kraft/Technik/Kopf/Einsatz): ' + [[18, 21], [22, 25], [26, 29], [30, 33], [34, 40]].map(([lo, hi]) => { const b = band(lo, hi).filter((p) => p.naturalPosition !== 'TW'); return `${lo}-${hi}: ${grp(b, 'tempo')}/${grp(b, 'kraft')}/${grp(b, 'technik')}/${grp(b, 'kopf')}/${b.length ? (b.reduce((s, p) => s + p.attributes.workRate, 0) / b.length).toFixed(0) : '-'}`; }).join(' | '));
  const wr = (a: Player[]) => a.length ? (a.reduce((s, p) => s + p.attributes.workRate, 0) / a.length).toFixed(0) : '-';
  console.log(`   Einsatzwille: Stärke ≥80 ${wr(ps.filter((p) => p.overall >= 80))}, 70–79 ${wr(ps.filter((p) => p.overall >= 70 && p.overall < 80))}, <60 ${wr(ps.filter((p) => p.overall < 60))}; Talente ≤21 mit Potenzial ≥80: ${wr(ps.filter((p) => p.age <= 21 && (p.development.basePotential ?? 0) >= 80))}`);
  const intl = ps.filter((p) => (p.intl?.caps ?? 0) >= 20);
  console.log(`   Nationalspieler ≥20 Länderspiele: ${intl.length}, Erfahrung Ø ${avg(intl)}; Top 5 Erfahrung: ${[...ps].sort((a, b) => b.attributes.experience - a.attributes.experience).slice(0, 5).map((p) => `${p.lastName}(${p.age},${p.overall},E${p.attributes.experience},L${p.attributes.leadership},LS${leaderScore(p).toFixed(0)},${p.intl?.caps ?? 0})`).join(' ')}`);
}
const G = ['tempo', 'kraft', 'technik', 'kopf'] as const;
const gv = (p: Player) => G.map((g) => { let s = 0, n = 0; for (const [k, v] of Object.entries(p.attributes)) if (groupOf(k as any) === g) { s += v as number; n++; } return s / n; }).concat([p.attributes.workRate, p.attributes.experience, p.overall]);
const snap = new Map((Object.values(g.players) as Player[]).filter((p) => p.clubId && p.naturalPosition !== 'TW').map((p) => [p.id, { age: p.age, dob: p.dateOfBirth, v: gv(p) }]));
function longi() {
  const rows: string[] = [];
  for (const [lo, hi] of [[17, 20], [21, 24], [25, 28], [29, 31], [32, 36]]) {
    const ds: number[][] = [];
    for (const [id, s0] of snap) { const p = g.players[id] as Player | undefined; if (!p || p.dateOfBirth !== s0.dob || s0.age < lo || s0.age > hi) continue; const v = gv(p); ds.push(v.map((x, i) => x - s0.v[i])); }
    if (!ds.length) continue;
    const m = ds[0].map((_, i) => (ds.reduce((a, d) => a + d[i], 0) / ds.length).toFixed(1));
    rows.push(`Startalter ${lo}-${hi} (n ${ds.length}): Tempo ${m[0]} Kraft ${m[1]} Technik ${m[2]} Kopf ${m[3]} Einsatz ${m[4]} Erfahrung ${m[5]} Stärke ${m[6]}`);
  }
  console.log('   Längsschnitt seit Start:\n   ' + rows.join('\n   '));
}
report('Start');
for (let s = 0; s < N; s++) {
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
  }
  report(`Ende ${g.season?.label ?? g.calendar.currentDate}`);
  longi();
  startNextSeason(g);
}
