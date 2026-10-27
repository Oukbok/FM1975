// Baut tests/sim.ts für Node und führt es aus:  npm run sim -- <saisons>
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
await esbuild.build({ entryPoints: ['tests/sim.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'test-output/sim.mjs', logLevel: 'error', jsx: 'automatic' });
const r = spawnSync(process.execPath, ['test-output/sim.mjs', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
