// =============================================================================
// Leistung & Speicher über lange Karrieren (Wunsch Pascal: Steam-Release mit
// 50+ Jahren). Spielt wie tests/sim.ts N Saisons ohne UI (gleicher Seed, eigener
// Verein automatisch) und protokolliert:
//   - Rechenzeit je Tag (`processDay`: Ø, p95, max) und je Saisonwechsel,
//   - Zeit je Teilschritt von processDay/startNextSeason (V8-CPU-Profil über
//     node:inspector – direkte Aufrufe der beiden Funktionen, inklusive Zeit),
//   - Größe des Spielstands nach 1/10/20/40/60 Jahren (JSON, gzip, lz-string wie
//     die Vorlagen), je Feld des Game-Objekts und je Unterfeld der größten Felder,
//     dazu JSON.stringify/parse-Zeit (Speichern/Laden).
//   node scripts/run-ts.mjs tests/perf-bench.ts [saisons=60]
//   (mit `node --expose-gc` wird der Heap nach einer vollen GC gemessen)
//   DRILL=f,g Aufschlüsselung weiterer Funktionen · CALLERS=f,g wer ruft diese Funktionen (inkl. Zeit)
//   PROF=0 ohne CPU-Profil · SIZES=1,10,20,40,60 · OUT=datei.json (Rohdaten)
//   FP=1 Fingerabdruck je Saison (Meister, Tabelle, Konto) für den Vergleich vorher/nachher
// =============================================================================
import { Session } from 'node:inspector/promises';
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { compressToUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import type { Game } from '../src/game/state';

const seasons = Number(process.argv[2] ?? 60);
const PROF = process.env.PROF !== '0';
const DRILL = (process.env.DRILL ?? '').split(',').filter(Boolean); // weitere Funktionen aufschlüsseln
const drillAll: Record<string, Record<string, number>> = {};
const CALLERS = (process.env.CALLERS ?? '').split(',').filter(Boolean); // Aufrufer dieser Funktionen
const callersAll: Record<string, Record<string, number>> = {};
const SIZES = new Set((process.env.SIZES ?? '1,10,20,40,60').split(',').map(Number));
let seed = Number(process.env.SEED ?? 1975);
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const g: Game = createNewGame({
  managedClubId: process.env.CLUB ?? 'mgl',
  manager: { name: 'Sim', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, legends: true,
});
(g as any).simAutoManage = true;

// --- CPU-Profil -------------------------------------------------------------
type PNode = { id: number; callFrame: { functionName: string; lineNumber: number }; hitCount?: number; children?: number[] };
type Profile = { nodes: PNode[]; startTime: number; endTime: number; samples: number[] };
const session = PROF ? new Session() : null;
session?.connect();
async function profStart() { if (!session) return; await session.post('Profiler.enable'); await session.post('Profiler.setSamplingInterval', { interval: 400 }); await session.post('Profiler.start'); }
async function profStop(): Promise<Profile | null> { if (!session) return null; const { profile } = await session.post('Profiler.stop') as any; await session.post('Profiler.disable'); return profile; }
const nameOf = (n: PNode) => n.callFrame.functionName || `(anonym Z.${n.callFrame.lineNumber + 1})`;
/** Inklusive Zeit (ms) der direkten Aufrufe von `parent` sowie Eigenzeit aller Funktionen. */
function analyse(p: Profile, parents: string[]) {
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const dt = (p.endTime - p.startTime) / 1000 / Math.max(1, p.samples.length);
  const incl = new Map<number, number>();
  const inc = (n: PNode): number => { let s = (n.hitCount ?? 0) * dt; for (const c of n.children ?? []) s += inc(byId.get(c)!); incl.set(n.id, s); return s; };
  inc(p.nodes[0]);
  const out: Record<string, Record<string, number>> = {};
  for (const par of parents) out[par] = {};
  const self: Record<string, number> = {};
  const callers: Record<string, Record<string, number>> = {};
  for (const n of p.nodes) for (const c of n.children ?? []) {
    const cn = nameOf(byId.get(c)!);
    if (CALLERS.includes(cn)) { const m = (callers[cn] ??= {}); m[nameOf(n)] = (m[nameOf(n)] ?? 0) + incl.get(c)!; }
  }
  const walk = (n: PNode, inside: Set<string>) => {
    const nm = nameOf(n);
    self[nm] = (self[nm] ?? 0) + (n.hitCount ?? 0) * dt;
    if (out[nm] && !inside.has(nm)) {
      out[nm]['(selbst)'] = (out[nm]['(selbst)'] ?? 0) + (n.hitCount ?? 0) * dt;
      for (const c of n.children ?? []) { const cn = byId.get(c)!; const k = nameOf(cn); out[nm][k] = (out[nm][k] ?? 0) + incl.get(c)!; }
    }
    const next = out[nm] ? new Set([...inside, nm]) : inside;
    for (const c of n.children ?? []) walk(byId.get(c)!, next);
  };
  walk(p.nodes[0], new Set());
  return { steps: out, self, callers };
}
const addInto = (a: Record<string, number>, b: Record<string, number>) => { for (const [k, v] of Object.entries(b)) a[k] = (a[k] ?? 0) + v; };
const top = (o: Record<string, number>, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);

// --- Größe --------------------------------------------------------------------
const kb = (n: number) => Math.round(n / 1024);
function sizeReport(game: Game, label: string) {
  const t0 = performance.now(); const json = JSON.stringify(game); const tStr = performance.now() - t0;
  const t1 = performance.now(); JSON.parse(json); const tParse = performance.now() - t1;
  const t2 = performance.now(); const gz = gzipSync(json).length; const tGz = performance.now() - t2;
  const t3 = performance.now(); const lz = compressToUTF16(json).length * 2; const tLz = performance.now() - t3;
  const bytes = Buffer.byteLength(json);
  const fields = Object.entries(game).map(([k, v]) => { const j = JSON.stringify(v ?? null); return { k, raw: Buffer.byteLength(j), gz: gzipSync(j).length }; }).sort((a, b) => b.raw - a.raw);
  // Unterfelder der größten Record-Felder (Spieler, Vereine …) bzw. Objekte.
  const sub: Record<string, { k: string; raw: number }[]> = {};
  for (const f of fields.slice(0, 6)) {
    const v = (game as any)[f.k];
    if (!v || typeof v !== 'object') continue;
    const acc: Record<string, number> = {};
    const vals = Array.isArray(v) ? v : Object.values(v);
    const isRec = !Array.isArray(v) && vals.length > 20 && vals.every((x) => x && typeof x === 'object' && !Array.isArray(x));
    if (isRec) { for (const x of vals) for (const [sk, sv] of Object.entries(x)) acc[sk] = (acc[sk] ?? 0) + JSON.stringify(sv ?? null).length; }
    else if (!Array.isArray(v)) { for (const [sk, sv] of Object.entries(v)) acc[sk] = JSON.stringify(sv ?? null).length; }
    else continue;
    sub[f.k] = top(acc, 8).map(([k, raw]) => ({ k, raw }));
  }
  console.log(`SIZE ${label}: JSON ${(bytes / 1048576).toFixed(2)} MB | gzip ${(gz / 1048576).toFixed(2)} MB | lz-string ${(lz / 1048576).toFixed(2)} MB | stringify ${tStr.toFixed(0)} ms parse ${tParse.toFixed(0)} ms gzip ${tGz.toFixed(0)} ms lz ${tLz.toFixed(0)} ms | Spieler ${Object.keys(game.players).length} Jugend ${Object.keys(game.youthPlayers ?? {}).length} Nachrichten ${game.messages.length}`);
  console.log('   Felder: ' + fields.slice(0, 22).map((f) => `${f.k} ${kb(f.raw)}/${kb(f.gz)}`).join(' · ') + ' (KB JSON/gzip)');
  for (const [k, list] of Object.entries(sub)) console.log(`   ${k}: ` + list.map((x) => `${x.k} ${kb(x.raw)}`).join(' · '));
  return { label, bytes, gz, lz, tStr, tParse, tGz, tLz, fields, sub };
}

// --- Fingerabdruck (Determinismus vorher/nachher) ------------------------------
function fingerprint(game: Game): string {
  const t = game.table.rows.map((r) => `${r.clubId}:${r.points}:${r.goalsFor}`).join(',');
  const my = game.clubs[game.managedClubId];
  let h = 0; const s = `${t}|${Math.round(my.finances.balance)}|${Object.keys(game.players).length}|${game.euroCups?.ec?.winnerClubId}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return `${game.season} ${(h >>> 0).toString(16)}`;
}

// --- Lauf ---------------------------------------------------------------------
const rows: any[] = [], sizes: any[] = [];
const dayStepsAll: Record<string, Record<string, number>> = {}, switchStepsAll: Record<string, Record<string, number>> = {};
const selfAll: Record<string, number> = {};
const tAll = Date.now();
for (let s = 0; s < seasons; s++) {
  const days: number[] = [];
  await profStart();
  const cpu0 = process.cpuUsage();
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    const t = g.clubs[g.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    const t0 = performance.now(); processDay(g, HEADLESS_UI); days.push(performance.now() - t0);
    if (++guard > 1000) throw new Error('Saison endet nicht');
  }
  const season = g.season;
  if (SIZES.has(s + 1)) sizes.push(sizeReport(g, `nach ${s + 1} J. (${season})`));
  const fp = process.env.FP ? fingerprint(g) : '';
  const tS = performance.now(); startNextSeason(g); const sw = performance.now() - tS;
  const cpu = process.cpuUsage(cpu0); const cpuS = (cpu.user + cpu.system) / 1e6;
  const prof = await profStop();
  const sorted = [...days].sort((a, b) => a - b);
  const sum = days.reduce((a, b) => a + b, 0);
  const row = { season, n: days.length, sum, cpuS, avg: sum / days.length, p95: sorted[Math.floor(sorted.length * 0.95)], max: sorted[sorted.length - 1], sw, heap: ((globalThis as any).gc?.(), process.memoryUsage().heapUsed / 1e6), players: Object.keys(g.players).length, fp, steps: {} as any };
  if (prof) {
    const a = analyse(prof, ['processDay', 'startNextSeason', ...DRILL]);
    for (const d of DRILL) addInto((drillAll[d] ??= {}), a.steps[d]);
    for (const c of CALLERS) addInto((callersAll[c] ??= {}), a.callers[c] ?? {});
    row.steps = { day: top(a.steps.processDay, 12), sw: top(a.steps.startNextSeason, 8) };
    const dec = `${season.slice(0, 3)}0er`;
    addInto((dayStepsAll[dec] ??= {}), a.steps.processDay); addInto((switchStepsAll[dec] ??= {}), a.steps.startNextSeason);
    addInto(selfAll, a.self);
  }
  rows.push(row);
  console.log(`DAY ${season} Summe ${(sum / 1000).toFixed(1)} s (CPU ${cpuS.toFixed(1)} s) Ø ${row.avg.toFixed(1)} ms p95 ${row.p95.toFixed(1)} max ${row.max.toFixed(0)} | Saisonwechsel ${sw.toFixed(0)} ms | Heap ${row.heap.toFixed(0)} MB Spieler ${row.players}${fp ? ' | FP ' + fp : ''}`);
  if (prof && (s % 10 === 0 || s === seasons - 1)) {
    console.log('   Tag-Teilschritte (Saison, ms): ' + row.steps.day.map(([k, v]: any) => `${k} ${v.toFixed(0)}`).join(' · '));
    console.log('   Saisonwechsel-Teilschritte (ms): ' + row.steps.sw.map(([k, v]: any) => `${k} ${v.toFixed(0)}`).join(' · '));
  }
}
console.log('\n=== Zusammenfassung je Jahrzehnt ===');
const byDec: Record<string, any[]> = {};
for (const r of rows) (byDec[`${r.season.slice(0, 3)}0er`] ??= []).push(r);
for (const [d, rs] of Object.entries(byDec)) {
  const avg = rs.reduce((a, r) => a + r.sum, 0) / rs.reduce((a, r) => a + r.n, 0);
  const sw = rs.reduce((a, r) => a + r.sw, 0) / rs.length;
  console.log(`${d}: Tag Ø ${avg.toFixed(1)} ms | Saison ${(rs.reduce((a, r) => a + r.sum, 0) / rs.length / 1000).toFixed(1)} s (CPU inkl. Wechsel ${(rs.reduce((a, r) => a + r.cpuS, 0) / rs.length).toFixed(1)} s) | Saisonwechsel Ø ${sw.toFixed(0)} ms | p95 max ${Math.max(...rs.map((r) => r.p95)).toFixed(0)} ms`);
  if (dayStepsAll[d]) console.log('   Tag: ' + top(dayStepsAll[d], 14).map(([k, v]) => `${k} ${(v / rs.length).toFixed(0)}`).join(' · ') + ' (ms je Saison)');
  if (switchStepsAll[d]) console.log('   Wechsel: ' + top(switchStepsAll[d], 10).map(([k, v]) => `${k} ${(v / rs.length).toFixed(0)}`).join(' · '));
}
for (const d of DRILL) console.log(`Aufschlüsselung ${d} (ms je Saison): ` + top(drillAll[d] ?? {}, 14).map(([k, v]) => `${k} ${(v / rows.length).toFixed(0)}`).join(' · '));
for (const c of CALLERS) console.log(`Aufrufer von ${c} (ms je Saison): ` + top(callersAll[c] ?? {}, 10).map(([k, v]) => `${k} ${(v / rows.length).toFixed(0)}`).join(' · '));
if (PROF) console.log('Eigenzeit gesamt (s): ' + top(selfAll, 30).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}`).join(' · '));
console.log(`fertig in ${((Date.now() - tAll) / 1000).toFixed(0)} s`);
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify({ rows, sizes: sizes.map((s) => ({ ...s, fields: s.fields })), dayStepsAll, switchStepsAll, selfAll }, null, 1));
