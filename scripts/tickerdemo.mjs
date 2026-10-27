// Konsolen-Demo des Textmodus:  node scripts/tickerdemo.mjs [jahr] [seed] [ko]
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
await esbuild.build({ entryPoints: ['tests/tickerdemo.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'test-output/tickerdemo.mjs', logLevel: 'error' });
spawnSync(process.execPath, ['test-output/tickerdemo.mjs', ...process.argv.slice(2)], { stdio: 'inherit' });
