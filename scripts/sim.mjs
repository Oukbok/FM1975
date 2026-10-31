// Baut einen Node-Test und führt ihn aus:
//   npm run sim -- <saisons>            (ganzes Spiel ohne UI, tests/sim.ts)
//   node scripts/sim.mjs --world <n>    (nur Europa-Simulation, tests/world-sim.ts)
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
const args = process.argv.slice(2);
const world = args[0] === '--world';
const entry = world ? 'tests/world-sim.ts' : 'tests/sim.ts';
// Eigene Bundle-Datei je Prozess, damit mehrere Läufe (Seeds) parallel laufen können.
const out = `test-output/${world ? 'world-sim' : 'sim'}.${process.pid}.mjs`;
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error', jsx: 'automatic' });
const r = spawnSync(process.execPath, [out, ...(world ? args.slice(1) : args)], { stdio: 'inherit' });
rmSync(out, { force: true });
process.exit(r.status ?? 1);
