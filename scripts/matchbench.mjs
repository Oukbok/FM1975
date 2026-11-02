// Baut tests/matchbench.ts und misst die Balance der Match-Engine:  node scripts/matchbench.mjs [spiele]
// MODE=era (nur Ist/Soll je Epoche, MIX=1 mit Chancenmix) · MODE=attrs / MODE=tactics (tests/enginebench.ts, YEAR=…)
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
const entry = process.env.MODE === 'attrs' || process.env.MODE === 'tactics' ? 'tests/enginebench.ts' : 'tests/matchbench.ts';
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: 'test-output/matchbench.mjs', logLevel: 'error', jsx: 'automatic' });
const r = spawnSync(process.execPath, ['test-output/matchbench.mjs', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
