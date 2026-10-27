// Baut einen Node-Test und führt ihn aus:
//   npm run sim -- <saisons>            (ganzes Spiel ohne UI, tests/sim.ts)
//   node scripts/sim.mjs --world <n>    (nur Europa-Simulation, tests/world-sim.ts)
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2);
const world = args[0] === '--world';
const entry = world ? 'tests/world-sim.ts' : 'tests/sim.ts';
const out = world ? 'test-output/world-sim.mjs' : 'test-output/sim.mjs';
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error', jsx: 'automatic' });
const r = spawnSync(process.execPath, [out, ...(world ? args.slice(1) : args)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
