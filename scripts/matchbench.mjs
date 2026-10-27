// Baut tests/matchbench.ts und misst die Balance der Match-Engine:  node scripts/matchbench.mjs [spiele]
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
await esbuild.build({ entryPoints: ['tests/matchbench.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'test-output/matchbench.mjs', logLevel: 'error', jsx: 'automatic' });
const r = spawnSync(process.execPath, ['test-output/matchbench.mjs', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
