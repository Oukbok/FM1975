// Bündelt eine TypeScript-Testdatei für Node und führt sie aus:
//   node scripts/run-ts.mjs tests/dataset-test.ts [args…]
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';
const [entry, ...args] = process.argv.slice(2);
if (!entry) { console.error('Aufruf: node scripts/run-ts.mjs <datei.ts> [args]'); process.exit(2); }
const out = `test-output/${basename(entry, '.ts')}.mjs`;
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error', jsx: 'automatic' });
const r = spawnSync(process.execPath, [out, ...args], { stdio: 'inherit' });
process.exit(r.status ?? 1);
